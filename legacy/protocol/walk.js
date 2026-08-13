/* Walks tanks day by day and asserts that every day, and every transition,
   produces something for the user to read. Nothing may go quiet. */
const { decide } = require('/tmp/decide.js');
let _rng = require('/tmp/rng.js').makeRng(1);
const setSeed = s => { _rng = require('/tmp/rng.js').makeRng(s); };
const rand = () => _rng();
const def = { key:'alkalinity', label:'Alkalinity', unit:'dKH', min:8.5, max:9.5 };

function walk({ volumeL, cons0, jumps, noise, days, testEvery, snoozeChance, choice }) {
  const eff = 0.0533*100/volumeL;
  let cons = cons0, dose = cons0/eff*(0.6+rand()*0.8), alk = 8.0+rand()*2.0;
  let readings = [], history = [], since = 999, changeCount = 0, snoozes = 0;
  const corr = []; const seen = []; let plan = null;
  let lastState = null;

  for (let day = 0; day < days; day++) {
    for (const j of jumps) if (day === j.day) cons *= j.factor;
    alk += dose*eff - cons;
    if (alk < 8.5) { const s2=Math.min(0.5,9.0-alk); alk+=s2; corr.push({day,amount:s2}); }
    if (alk > 9.5) { const s2=-Math.min(0.5,alk-9.0); alk+=s2; corr.push({day,amount:s2}); }
    if (alk < 0.5) alk = 0.5;

    const testedToday = (day % testEvery === 0) && rand() > snoozeChance;
    if (testedToday) readings.push({ day, value: Math.round((alk + (rand()-0.5)*2*noise)*10)/10 });
    else if (day % testEvery === 0) snoozes++;
    since++;
    if (!readings.length) continue;

    const adj = readings.map(r=>({day:r.day,
      value:r.value - corr.filter(c=>c.day<=r.day).reduce((a,c)=>a+c.amount,0)}));
    const d = decide({ def, eff, dose, level: alk, daysSinceChange: since, readings: adj,
      history, today: day, consumptionEstimate: dose*eff, testedToday,
      snoozeCount: snoozes, changeCount, plan, testEveryDays: testEvery });
    seen.push({ day, state: d.state, tone: d.tone, d, lastState });

    if (d.options) {
      let rec = d.options.find(o=>o.recommended);
      if (choice === 'aggressive' && d.state === 'early-warning') {
        rec = d.options.reduce((a,b)=>Math.abs(b.dose-dose)>Math.abs(a.dose-dose)?b:a, rec);
      }
      if (Math.abs(rec.dose-dose) >= 0.1) {
        const win = adj.filter(r=>r.day>=day-since);
        if (win.length>1){
          const n=win.length,mx=win.reduce((a,r)=>a+r.day,0)/n,my=win.reduce((a,r)=>a+r.value,0)/n;
          let sxy=0,sxx=0;for(const r of win){sxy+=(r.day-mx)*(r.value-my);sxx+=(r.day-mx)**2;}
          history.push({dose,rate:sxx?sxy/sxx:0,day});
        }
        plan = { appliedDose: rec.dose, target: rec.dose, stage:1, stages:1 };
        dose = rec.dose; since = 0; changeCount++; snoozes = 0; readings = readings.slice(-1);
      }
    } else if (['idle','off-target'].includes(d.state)) { since = 0; plan = null; }
    lastState = d.state;
  }
  return seen;
}
module.exports = { walk, setSeed };
