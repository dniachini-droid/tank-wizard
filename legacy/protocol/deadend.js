const { decide } = require('/tmp/decide.js');
let seed = 5; const rand = () => { seed = (seed*1103515245+12345)%2147483648; return seed/2147483648; };
const DEFS = {
  alkalinity: { key:'alkalinity', label:'Alkalinity', unit:'dKH', min:8.5, max:9.5, safe:[7,11] },
  calcium:    { key:'calcium',    label:'Calcium',    unit:'ppm', min:450, max:500, safe:[350,550] },
  magnesium:  { key:'magnesium',  label:'Magnesium',  unit:'ppm', min:1450, max:1500, safe:[1150,1700] },
};
const fail = {}; const note=(k,d)=>{(fail[k]=fail[k]||[]).push(d);};
let n=0; const states={}; const tones={};

for (const key of Object.keys(DEFS)) {
  const def = DEFS[key];
  const span = def.max - def.min;
  const eff = key==='alkalinity'?0.0692:key==='calcium'?0.47:0.031;
  for (const level of [def.safe[0]-span, def.safe[0]+0.1*span, def.min-0.5*span, def.min, (def.min+def.max)/2, def.max, def.max+0.5*span, def.safe[1]-0.1*span, def.safe[1]+span])
  for (const dose of [1, 5, 10, 40, 120])
  for (const trendMul of [-2, -1, -0.4, -0.1, 0, 0.1, 0.4, 1, 2])
  for (const since of [0, 1, 2, 3, 5, 8, 12])
  for (const hist of [[], [{dose:dose*0.7, rate:-0.2*span, day:-4}], [{dose:dose*1.3, rate:0.2*span, day:-4}],
                      [{dose:dose*0.7, rate:-0.2*span, day:-4},{dose:dose*1.3, rate:0.2*span, day:-3}]]) {
    const trend = trendMul * span * 0.1;
    const readings = [];
    for (let d=0; d<=Math.max(1,since); d++) readings.push({ day:d, value: level + trend*(d-since) });
    let r;
    try {
      r = decide({ def, eff, dose, level, daysSinceChange: since, readings, history: hist.map(h=>({...h})),
                   today: Math.max(1,since), consumptionEstimate: dose*eff,
                   snoozeCount: since > 3 ? since - 3 : 0 });
    } catch (e) { note('threw', `${key} ${level} ${dose}: ${e.message}`); continue; }
    n++;
    states[r.state]=(states[r.state]||0)+1;
    tones[r.tone]=(tones[r.tone]||0)+1;

    // --- no dead ends ---
    if (!r.state) note('no state', JSON.stringify(r).slice(0,60));
    if (!r.summary) note('no summary for the tank box', r.state);
    if (!r.dashboard) note('no dashboard line', r.state);
    if (!r.wizard) note('no wizard text', r.state);
    if (!r.why) note('no explanation of why', r.state);
    for (const [f,v] of Object.entries({summary:r.summary,dashboard:r.dashboard,wizard:r.wizard,why:r.why})) {
      if (/undefined|NaN|Infinity|\[object|null/.test(String(v))) note('broken text in '+f, String(v).slice(0,70));
      if (/\bNaN\b|in NaN/.test(String(v))) note('NaN in '+f, String(v).slice(0,60));
      if (/\s{2,}/.test(String(v))) note('double space in '+f, String(v).slice(0,50));
    }
    // every option must be actionable and explained
    if (r.options) {
      if (r.options.length < 2) note('fewer than two options', r.state);
      if (!r.options.some(o=>o.recommended)) note('no recommended option', r.state);
      if (r.options.filter(o=>o.recommended).length > 1) note('more than one recommended', r.state);
      for (const o of r.options) {
        if (!o.label || !o.note) note('option missing label or note', r.state);
        if (o.dose == null || !isFinite(o.dose) || o.dose < 0) note('option has no usable dose', `${r.state} ${o.dose}`);
        if (/undefined|NaN/.test(o.label+o.note+(o.risk||''))) note('broken option text', o.label);
      }
      // the recommended option must never be the most aggressive one
      const rec = r.options.find(o=>o.recommended);
      const maxMove = Math.max(...r.options.map(o=>Math.abs(o.dose-dose)));
      if (Math.abs(rec.dose-dose) > maxMove + 1e-9) note('recommended the most aggressive option', r.state);
    }
    // states that offer no options must be states where nothing is to be done
    if (!r.options && !['settling','idle','off-target','overdue'].includes(r.state)) {
      note('actionable state with no options', r.state);
    }
  }
}
console.log(`DEAD-END SWEEP — ${n.toLocaleString()} combinations`);
console.log('='.repeat(70));
console.log('  states reached: '+Object.entries(states).map(([k,v])=>`${k} ${v}`).join(', '));
console.log('  tones used    : '+Object.keys(tones).join(', '));
const ks=Object.keys(fail);
console.log('  problems      : '+ks.length);
for(const k of ks){ console.log('   '+k+': '+fail[k].length); fail[k].slice(0,3).forEach(d=>console.log('      '+d)); }
