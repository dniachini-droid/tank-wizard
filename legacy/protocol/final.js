const { decide } = require('/tmp/decide.js');
let _rng = require('/tmp/rng.js').makeRng(1);
const setSeed = s => { _rng = require('/tmp/rng.js').makeRng(s); };
const rand = () => _rng();

function runTank({ volumeL, strength, cons0, jumps, noise, days = 180, current, awayFrom, awayDays, corrBand, mode, choice, startDose, startAlk }) {
  const eff = strength * 100 / volumeL;
  const def = { key:'alkalinity', label:'Alkalinity', unit:'dKH', min:8.5, max:9.5 };
  let cons = cons0, dose = (startDose != null ? startDose : cons0/eff), alk = (startAlk != null ? startAlk : 9.0);
  let readings = [], history = [], since = 999;
  const corr = []; let nch = 0, ncorr = 0, lowest = 99, highest = 0, outDays = 0;
  /* The metrics the guidance actually names: daily swing under 0.3 dKH,
     weekly drift under 0.5, and a stable set point rather than a good one. */
  const series = []; let firstInBand = -1, overshootHigh = 0, overshootLow = 0;
  const noisy = v => Math.round((v + (rand()-0.5)*2*noise)*10)/10;

  for (let day = 0; day < days; day++) {
    for (const j of jumps) if (day === j.day) cons *= j.factor;
    alk += dose*eff - cons;
    /* Corrections were only firing below 7.5 and above 10.5 — far outside the
       target band, so slow drift inside the band was never corrected and
       accumulated over months. That accumulated drift, not the step size, is
       what showed up as three times the variation. A real keeper corrects back
       toward the band, not merely away from disaster. */
    const CORRECT_BELOW = corrBand ? corrBand[0] : 7.5;
    const CORRECT_ABOVE = corrBand ? corrBand[1] : 10.5;
    if (alk < CORRECT_BELOW) { const s2 = Math.min(0.5, 9.0-alk); alk += s2; corr.push({day,amount:s2}); ncorr++; }
    if (alk > CORRECT_ABOVE) { const s2 = -Math.min(0.5, alk-9.0); alk += s2; corr.push({day,amount:s2}); ncorr++; }
    lowest = Math.min(lowest, alk); highest = Math.max(highest, alk);
    series.push(alk);
    if (firstInBand < 0 && alk >= 8.5 && alk <= 9.5) firstInBand = day;
    if (alk > 9.5) overshootHigh++;
    if (alk < 8.5) overshootLow++;
    if (alk < 7 || alk > 11) outDays++;
    /* A stretch where nobody tests: no readings logged, so no advice either.
       This is the question the steadiness numbers cannot answer — how much of
       the calm depends on someone being there to adjust it. */
    const away = awayFrom != null && day >= awayFrom && day < awayFrom + awayDays;
    if (away) { continue; }
    readings.push({ day, value: noisy(alk) });
    since++;
    const adj = readings.map(r => ({ day:r.day,
      value: r.value - corr.filter(c=>c.day<=r.day).reduce((a,c)=>a+c.amount,0) }));

    if (current) {
      if (since < 2) continue;
      const win = adj.filter(r=>r.day>=day-since); if (win.length<2) continue;
      const n=win.length,mx=win.reduce((a,r)=>a+r.day,0)/n,my=win.reduce((a,r)=>a+r.value,0)/n;
      let sxy=0,sxx=0;for(const r of win){sxy+=(r.day-mx)*(r.value-my);sxx+=(r.day-mx)**2;}
      const rate=sxx?sxy/sxx:0;
      if (Math.abs(rate)<0.02){since=0;continue;}
      const want=Math.round((dose+(-rate)/eff)*10)/10;
      if (Math.abs(want-dose)>=0.1&&want>0){dose=want;nch++;since=0;readings=readings.slice(-1);} else since=0;
      continue;
    }
    const d = decide({ def, eff, dose, level: alk, daysSinceChange: since,
      readings: adj, history, today: day, consumptionEstimate: dose*eff, mode,
      allReadings: adj });
    if (d.options) {
      /* choice: 'gentle' takes the capped recommendation, 'aggressive' takes
         the largest option offered — which is what the uncapped arithmetic
         implies. The labels only earn their keep if the aggressive one really
         does arrive sooner and really does overshoot more. */
      let rec = d.options.find(o=>o.recommended);
      if (choice === 'aggressive') {
        rec = d.options.reduce((a,b)=>Math.abs(b.dose-dose)>Math.abs(a.dose-dose)?b:a, rec);
      }
      if (Math.abs(rec.dose-dose) >= 0.1) {
        const win=adj.filter(r=>r.day>=day-since);
        const n=win.length,mx=win.reduce((a,r)=>a+r.day,0)/n,my=win.reduce((a,r)=>a+r.value,0)/n;
        let sxy=0,sxx=0;for(const r of win){sxy+=(r.day-mx)*(r.value-my);sxx+=(r.day-mx)**2;}
        history.push({dose,rate:sxx?sxy/sxx:0,day});
        dose=rec.dose; since=0; readings=readings.slice(-1); nch++;
      }
    } else if (d.state==='idle'||d.state==='off-target') since=0;
  }
  /* Measured over the settled second half, which is what a keeper lives with. */
  const tail = series.slice(Math.floor(series.length/2));
  let dailyOver = 0, worstDaily = 0;
  for (let i = 1; i < tail.length; i++) {
    const mv = Math.abs(tail[i] - tail[i-1]);
    worstDaily = Math.max(worstDaily, mv);
    if (mv > 0.3) dailyOver++;
  }
  let weeklyOver = 0, worstWeekly = 0;
  for (let i = 7; i < tail.length; i++) {
    const mv = Math.abs(tail[i] - tail[i-7]);
    worstWeekly = Math.max(worstWeekly, mv);
    if (mv > 0.5) weeklyOver++;
  }
  const mean = tail.reduce((a,b)=>a+b,0)/tail.length;
  const sd = Math.sqrt(tail.reduce((a,b)=>a+(b-mean)**2,0)/tail.length);
  return { dose, need: cons/eff, err: Math.abs(dose-cons/eff)/(cons/eff)*100,
           nch, ncorr, lowest, highest, outDays,
           pctDaysOver03: dailyOver/Math.max(1,tail.length-1)*100,
           pctWeeksOver05: weeklyOver/Math.max(1,tail.length-7)*100,
           worstDaily, worstWeekly, setPoint: mean, sd, firstInBand, overshootHigh, overshootLow };
}
module.exports = { runTank, setSeed };
