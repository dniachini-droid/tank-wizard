/* Everything wired together: engine -> decision -> three surfaces -> panel.
   Walks tanks day by day and audits each element on its own guidance. */
const { decide } = require('/tmp/decide.js');
const { decideSlow, SPEC } = require('/tmp/camg.js');
const { panel } = require('/tmp/panel.js');

let _rng = require('/tmp/rng.js').makeRng(1);
const setSeed = s => { _rng = require('/tmp/rng.js').makeRng(s); };
const rand = () => _rng();

const DEF = {
  alkalinity: { key:'alkalinity', label:'Alkalinity', unit:'dKH', min:8.5, max:9.5 },
  calcium:    { key:'calcium',    label:'Calcium',    unit:'ppm', min:420, max:450 },
  magnesium:  { key:'magnesium',  label:'Magnesium',  unit:'ppm', min:1300, max:1400 },
};
const STRENGTH = { alkalinity:0.0533, calcium:0.36, magnesium:0.024 };
const NOISE    = { alkalinity:0.1,    calcium:10,   magnesium:25 };
const CADENCE  = { alkalinity:2,      calcium:7,    magnesium:21 };
const GUIDE = {
  alkalinity:{ safe:[7,11],      dailyLimit:0.5, band:[8.5,9.5] },
  calcium:   { safe:[350,550],   dailyLimit:15,  band:[420,450] },
  magnesium: { safe:[1150,1700], dailyLimit:50,  band:[1300,1400] },
};

function walkAll({ volumeL, cons, jumps, days, skipChance, behaviour, startLevels, env }) {
  const ctxBehaviour = behaviour || {};
  const st = {}; const out = { events: [], series: {}, changes: {}, corrections: {} };
  for (const k of Object.keys(DEF)) {
    const eff = STRENGTH[k]*100/volumeL;
    st[k] = { eff, cons: cons[k], dose: cons[k]/eff, level: (startLevels && startLevels[k] != null) ? startLevels[k] : (DEF[k].min+DEF[k].max)/2,
              consBase: cons[k], kitOffset: 0,
              readings: [], history: [], since: 999, priorDose: null, appliedAt: 0,
              corr: [], pending: 0, nch: 0, ncorr: 0 };
    out.series[k] = []; out.changes[k] = 0; out.corrections[k] = 0;
    out.minLevel = out.minLevel || {}; out.precipDays = 0;
  }
  for (let day = 0; day < days; day++) {
    for (const j of jumps) if (day === j.day) st[j.el].cons *= j.factor;

    /* Things that shift every reading at once, which a per-element engine
       cannot see by looking at one element. */
    if (env) {
      /* Salinity drift: everything dissolved scales with it, so all three
         readings move together for a reason that has nothing to do with dosing. */
      if (env.salinityDrift) {
        const f = 1 + env.salinityDrift;
        for (const k of Object.keys(DEF)) st[k].level *= f;
      }
      /* A water change pulls every element toward the salt mix. */
      if (env.wcEvery && day % env.wcEvery === 0 && day > 0) {
        const mix = { alkalinity: 8.2, calcium: 440, magnesium: 1340 };
        for (const k of Object.keys(DEF)) {
          const shift = (mix[k] - st[k].level) * (env.wcFraction || 0.15);
          st[k].level += shift;
          /* A water change moves every element at once, for a reason that has
             nothing to do with the dose. Logged the same way a correction is,
             so the engine subtracts it rather than reading it as the tank's
             consumption changing. Without this it was the single largest
             source of unnecessary dose changes. */
          if (env.logWaterChanges) st[k].corr.push({ day, amount: shift });
        }
      }
      /* Consumption rises and falls with the seasons as light and temperature
         move — a real effect that looks like the dose drifting. */
      if (env.seasonal) {
        const f = 1 + env.seasonal * Math.sin(2*Math.PI*day/365);
        for (const k of Object.keys(DEF)) st[k].cons = st[k].consBase * f;
      }
      /* A new test kit reads systematically differently from the old one. */
      if (env.kitSwapDay && day === env.kitSwapDay) {
        for (const k of Object.keys(DEF)) st[k].kitOffset = (env.kitOffsetPct || 0.05) * st[k].level;
      }
    }

    /* The elements are not independent, and testing them as if they were was
       a gap. Below about 1250 ppm magnesium, calcium and alkalinity stop
       staying in solution and precipitate out — the tank "uses" more of both
       for no biological reason, which is exactly the situation the app should
       recognise rather than chase with bigger doses. */
    const mg = st.magnesium.level;
    const precipitating = mg < 1250;
    if (precipitating) { out.precipDays++;
      const severity = Math.min(1, (1250 - mg) / 250);
      st.alkalinity.level -= st.alkalinity.cons * severity * 0.6;
      st.calcium.level -= st.calcium.cons * severity * 0.6;
    }
    /* And very high alkalinity precipitates on its own. */
    if (st.alkalinity.level > 12) {
      const ex = (st.alkalinity.level - 12) * 0.15;
      st.alkalinity.level -= ex;
      st.calcium.level -= ex * 20;
    }
    let alkSteady = true;
    for (const k of Object.keys(DEF)) {
      const s = st[k];
      s.level += s.dose*s.eff - s.cons;
      if (s.pending !== 0) {
        const step = Math.sign(s.pending)*Math.min(Math.abs(s.pending), GUIDE[k].dailyLimit);
        s.level += step; s.pending -= step; s.corr.push({day, amount: step});
      }
      if (s.level < 0) s.level = 0;
      out.series[k].push(s.level);
    }
    for (const k of Object.keys(DEF)) {
      const s = st[k], def = DEF[k];
      s.since++;
      if (day % CADENCE[k] !== 0 || rand() < skipChance) continue;
      s.readings.push({ day, value: s.level + (s.kitOffset || 0) + (rand()-0.5)*2*NOISE[k] });
      if (s.readings.length > 20) s.readings = s.readings.slice(-20);
      const adj = s.readings.map(r=>({day:r.day,
        value:r.value - s.corr.filter(c=>c.day<=r.day).reduce((a,c)=>a+c.amount,0)}));
      let d;
      if (k === 'alkalinity') {
        d = decide({ def, eff:s.eff, dose:s.dose, level:s.level, daysSinceChange:s.since,
          readings:adj, history:s.history, today:day, consumptionEstimate:s.dose*s.eff,
          allReadings:adj, testedToday:true, testEveryDays:CADENCE[k],
          changeCount:s.nch, snoozeCount:0, previousState:s.lastState,
          correctionRemaining:Math.abs(s.pending) });
        alkSteady = ['idle','settling','early-test','watching'].includes(d.state);
      } else {
        d = decideSlow(k, { def, eff:s.eff, dose:s.dose, level:s.level, readings:adj,
          daysSinceChange:s.since, today:day, alkSteady, previousState:s.lastState });
      }
      const rows = panel({ key:k, def, eff:s.eff, dose:s.dose, priorDose:s.priorDose,
        level:s.level, readings:adj, daysSinceChange:s.since, state:d.state,
        history:s.history, today:day, appliedAt:s.appliedAt,
        target:null, recommendedDose:d.options?(d.options.find(o=>o.recommended)||{}).dose:null,
        correctionRemaining:Math.abs(s.pending) });
      s.lastState = d.state;
      out.events.push({ day, el:k, d, rows, level:s.level, dose:s.dose,
        /* what is actually true at this instant, for checking claims against */
        truth: { consumption: s.cons, needDose: s.cons/s.eff, level: s.level,
                 supplied: s.dose*s.eff, drift: s.dose*s.eff - s.cons } });

      if (d.options) {
        /* Real people do not always take the recommendation. */
        const roll = rand();
        if (roll < (ctxBehaviour.ignoreChance || 0)) { continue; }
        let rec = d.options.find(o=>o.recommended);
        if (roll < (ctxBehaviour.ignoreChance || 0) + (ctxBehaviour.contraryChance || 0)) {
          const others = d.options.filter(o=>!o.recommended);
          if (others.length) rec = others[Math.floor(rand()*others.length)];
        }
        if (['correct-level','off-target','emergency'].includes(d.state) && (rec.id === 'correct' || rec.id === 'faster')) {
          s.pending = (def.min+def.max)/2 - s.level; s.ncorr++; out.corrections[k]++;
        } else if (rec.dose != null && Math.abs(rec.dose-s.dose) >= Math.max(0.05, s.dose*0.01)) {
          const win = adj.filter(r=>r.day>=day-s.since);
          if (win.length>1){
            const n=win.length,mx=win.reduce((a,r)=>a+r.day,0)/n,my=win.reduce((a,r)=>a+r.value,0)/n;
            let sxy=0,sxx=0;for(const r of win){sxy+=(r.day-mx)*(r.value-my);sxx+=(r.day-mx)**2;}
            s.history.push({dose:s.dose,rate:sxx?sxy/sxx:0,day});
          }
          s.priorDose = s.dose; s.dose = rec.dose; s.since = 0; s.appliedAt = day;
          s.nch++; out.changes[k]++; s.readings = s.readings.slice(-1);
        }
      } else if (['idle','off-target','watching'].includes(d.state)) s.since = 0;
    }
  }
  out.final = {}; for (const k of Object.keys(DEF)) out.final[k] = { dose: st[k].dose, need: st[k].cons/st[k].eff };
  return out;
}
module.exports = { walkAll, setSeed, DEF, GUIDE, STRENGTH };
