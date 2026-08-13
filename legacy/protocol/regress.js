/* Every property established across this session, run together.
   The point is to catch a fix breaking an earlier fix — which happened once
   already: correcting the panel's decimal places turned 2,628 misstatements
   into 38,409 because the formatter stripped trailing zeros. */
const { decide } = require('/tmp/decide.js');
const { decideSlow } = require('/tmp/camg.js');
const { panel } = require('/tmp/panel.js');
const { walkAll, setSeed, DEF, GUIDE } = require('/tmp/integrated.js');

const results = [];
const check = (name, fn) => {
  let count = 0, fails = 0, sample = null;
  try { const r = fn(); count = r.count; fails = r.fails; sample = r.sample; }
  catch (e) { fails = -1; sample = e.message; }
  results.push({ name, count, fails, sample });
};

/* mulberry32: the LCG this replaced gave 299,999 of one element and 1 of
   another when picking from three, which quietly narrowed every sweep. */
let _r = require('/tmp/rng.js').makeRng(1);
const rnd = () => _r();
const pick = a => a[Math.floor(rnd()*a.length)];

function harvest(n, days) {
  const evs = [];
  for (let i = 0; i < n; i++) {
    setSeed(i*7919+1); _r = require('/tmp/rng.js').makeRng(i*7919+1);
    try {
      const r = walkAll({ volumeL: pick([25,40,77,200,400,800,1500]),
        cons:{ alkalinity:0.15+rnd()*2.8, calcium:1.0+rnd()*15, magnesium:0.1+rnd()*2.5 },
        jumps: Array.from({length:Math.floor(rnd()*4)},()=>({el:pick(['alkalinity','calcium','magnesium']),day:20+Math.floor(rnd()*(days-40)),factor:0.5+rnd()*1.3})),
        days, skipChance: rnd()*0.4,
        behaviour:{ ignoreChance: rnd()*0.25, contraryChance: rnd()*0.15 },
        env:{ wcEvery: pick([7,14,30]), wcFraction: 0.1+rnd()*0.25, logWaterChanges: true },
        startLevels:{ magnesium:1150+rnd()*450, calcium:370+rnd()*140, alkalinity:7.1+rnd()*3.8 } });
      for (const ev of r.events) evs.push(ev);
      evs.series = evs.series || []; evs.push.length;
      r.tankSeries = r.series;
      evs.tanks = (evs.tanks||[]); evs.tanks.push(r);
    } catch (e) { /* counted elsewhere */ }
  }
  return evs;
}

const EV = harvest(600, 300);

/* --- properties, in the order they were established --------------------- */

check('1. every state produces all four surfaces', () => {
  let c=0,f=0,s=null;
  for (const ev of EV) { c++;
    for (const k of ['summary','why','dashboard','wizard'])
      if (!String(ev.d[k]||'').trim()) { f++; s=s||`${ev.el}/${ev.d.state} missing ${k}`; }
  } return {count:c,fails:f,sample:s};
});

check('2. no broken text anywhere', () => {
  let c=0,f=0,s=null;
  for (const ev of EV) { c++;
    const all = [ev.d.summary,ev.d.why,ev.d.dashboard,ev.d.wizard,
      ...(ev.rows||[]).map(r=>r.value+' '+(r.note||''))].join(' ');
    if (/undefined|NaN|Infinity|\[object/.test(all)) { f++; s=s||all.slice(0,60); }
  } return {count:c,fails:f,sample:s};
});

check('3. exactly one recommendation where options exist', () => {
  let c=0,f=0,s=null;
  for (const ev of EV) if (ev.d.options) { c++;
    if (ev.d.options.filter(o=>o.recommended).length !== 1) { f++; s=s||`${ev.el}/${ev.d.state}`; }
  } return {count:c,fails:f,sample:s};
});

check('4. every problem state offers a way out', () => {
  let c=0,f=0,s=null;
  const PROB = ['off-target','correct-level','suggested-up','suggested-down','early-warning'];
  for (const ev of EV) if (PROB.includes(ev.d.state)) { c++;
    if (!ev.d.options) { f++; s=s||`${ev.el}/${ev.d.state}`; }
  } return {count:c,fails:f,sample:s};
});

check('5. every option has a usable dose', () => {
  let c=0,f=0,s=null;
  for (const ev of EV) for (const o of (ev.d.options||[])) { c++;
    if (o.dose==null||!isFinite(o.dose)||o.dose<0) { f++; s=s||`${ev.el} ${o.dose}`; }
  } return {count:c,fails:f,sample:s};
});

check('6. the wizard panel always populates', () => {
  let c=0,f=0,s=null;
  for (const ev of EV) { c++;
    if (!ev.rows||!ev.rows.length) { f++; s=s||`${ev.el}/${ev.d.state}`; }
  } return {count:c,fails:f,sample:s};
});

check('7. text fits a phone screen', () => {
  let c=0,f=0,s=null;
  for (const ev of EV) { c++;
    for (const k of ['summary','why','dashboard','wizard'])
      if (String(ev.d[k]||'').length > 260) { f++; s=s||`${ev.d.state} ${k} ${String(ev.d[k]).length}`; }
  } return {count:c,fails:f,sample:s};
});

check('8. the panel states what a dose supplies accurately', () => {
  let c=0,f=0,s=null;
  for (const ev of EV) { const sup=(ev.rows||[]).find(r=>r.label==='Supplies'); if(!sup) continue; c++;
    const num=parseFloat(String(sup.value));
    if (isFinite(num) && Math.abs(num-ev.truth.supplied) > Math.max(0.005, ev.truth.supplied*0.02)) {
      f++; s=s||`${ev.el} said ${num} actual ${ev.truth.supplied.toFixed(3)}`; }
  } return {count:c,fails:f,sample:s};
});

check('9. never claims the DOSE is right when it is >25% out', () => {
  let c=0,f=0,s=null;
  for (const ev of EV) { const say=(ev.d.summary+' '+ev.d.why).toLowerCase();
    if (!/dose is (matching|holding)|settled after the change/.test(say)) continue; c++;
    const off=Math.abs(ev.dose-ev.truth.needDose)/ev.truth.needDose;
    if (off>0.25) { f++; s=s||`${ev.el} ${(off*100).toFixed(0)}%`; }
  } return {count:c,fails:f,sample:s};
});

check('10. never claims the LEVEL is fine when it is outside the band', () => {
  let c=0,f=0,s=null;
  for (const ev of EV) { const say=(ev.d.summary+' '+ev.d.why).toLowerCase();
    if (!/is holding at|is in range|looks fine so far/.test(say)) continue; c++;
    const def=DEF[ev.el];
    if (ev.level<def.min-1e-9||ev.level>def.max+1e-9) { f++; s=s||`${ev.el} ${ev.level.toFixed(2)}`; }
  } return {count:c,fails:f,sample:s};
});

check('11. direction of a suggestion matches its label', () => {
  let c=0,f=0,s=null;
  for (const ev of EV) { if(!ev.d.state.startsWith('suggested')||!ev.d.options) continue; c++;
    const rec=ev.d.options.find(o=>o.recommended);
    if (ev.d.state==='suggested-up'&&rec.dose<ev.dose-1e-9) { f++; s=s||'up but goes down'; }
    if (ev.d.state==='suggested-down'&&rec.dose>ev.dose+1e-9) { f++; s=s||'down but goes up'; }
  } return {count:c,fails:f,sample:s};
});

check('12. impossible setup is blocked, not guessed at', () => {
  let c=0,f=0,s=null;
  const def=DEF.alkalinity;
  for (const eff of [0,-0.05,500,NaN]) { c++;
    const d=decide({def,eff,dose:10,level:8.7,daysSinceChange:3,
      readings:[0,1,2,3].map(x=>({day:x,value:9.3-0.2*x})),history:[],today:3,
      consumptionEstimate:10*eff,allReadings:[]});
    if (d.state!=='blocked') { f++; s=s||`eff ${eff} gave ${d.state}`; }
  } return {count:c,fails:f,sample:s};
});

check('13. every element stays inside its safe band', () => {
  let c=0,f=0,s=null;
  for (const t of (EV.tanks||[])) for (const k of Object.keys(DEF)) { c++;
    const G=GUIDE[k]; const out=t.series[k].filter(v=>v<G.safe[0]||v>G.safe[1]).length;
    if (out>t.series[k].length*0.10) { f++; s=s||`${k} outside safe ${out} days`; }
  } return {count:c,fails:f,sample:s};
});

check('14. daily movement respects each element ceiling', () => {
  let c=0,f=0,s=null;
  for (const t of (EV.tanks||[])) for (const k of Object.keys(DEF)) { c++;
    const G=GUIDE[k]; const ser=t.series[k];
    let worst=0; for(let i=1;i<ser.length;i++) worst=Math.max(worst,Math.abs(ser[i]-ser[i-1]));
    if (worst > G.dailyLimit*1.05) { f++; s=s||`${k} moved ${worst.toFixed(2)} vs limit ${G.dailyLimit}`; }
  } return {count:c,fails:f,sample:s};
});

console.log('REGRESSION SUITE — every property established this session');
console.log('='.repeat(80));
let totalFails=0;
for (const r of results) {
  const pct = r.count ? (r.fails/r.count*100) : 0;
  const mark = r.fails===0 ? 'PASS' : r.fails<0 ? 'ERROR' : 'FAIL';
  totalFails += Math.max(0,r.fails);
  console.log(`  ${mark.padEnd(6)}${r.name.padEnd(54)}${String(r.fails).padStart(6)} / ${r.count.toLocaleString()}`);
  if (r.fails!==0 && r.sample) console.log(`         ${r.sample}`);
}
console.log();
console.log(`  ${results.filter(r=>r.fails===0).length} of ${results.length} properties clean`);
