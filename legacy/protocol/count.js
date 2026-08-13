const { decide } = require('/tmp/decide.js');
const { decideSlow } = require('/tmp/camg.js');
const { panel } = require('/tmp/panel.js');
const DEFS = {
  alkalinity:{key:'alkalinity',label:'Alkalinity',unit:'dKH',min:8.5,max:9.5},
  calcium:{key:'calcium',label:'Calcium',unit:'ppm',min:420,max:450},
  magnesium:{key:'magnesium',label:'Magnesium',unit:'ppm',min:1300,max:1400}};
const EFF = {alkalinity:0.0692, calcium:0.47, magnesium:0.031};
/* A linear congruential generator modulo 2^31 was producing badly correlated
   draws: picking one of three elements 300,000 times gave 299,999 of one and 1
   of another. Its low-order bits cycle with a very short period, and calling it
   a varying number of times per iteration locked that cycle to the loop.
   mulberry32 mixes properly and costs nothing. */
let seed = 9;
const rnd = () => {
  seed = (seed + 0x6D2B79F5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
const pick = a => a[Math.floor(rnd()*a.length)];
const blank = s => String(s).replace(/-?\d[\d.,]*/g,'#').replace(/\s+/g,' ').trim();

const shapes = {}; const strings = {}; const states = {}; const perEl = {};
for (const el of Object.keys(DEFS)) perEl[el] = new Set();
const bucket = (obj,k) => (obj[k] = obj[k] || new Set());
let threw = 0, done = 0;

for (let i = 0; i < 300000; i++) {
  const el = pick(Object.keys(DEFS));
  const def = DEFS[el], span = def.max - def.min;
  const eff = EFF[el] * (rnd()<0.015 ? pick([0,-1,900]) : 1);
  const dose = Math.round((0.3 + rnd()*140)*10)/10;
  /* Spread levels across safe, off-target and dangerous, deliberately. */
  const zone = pick(['deep-low','low','band','high','deep-high']);
  const mid = (def.min+def.max)/2;
  const level = zone==='deep-low' ? mid-span*(3+rnd()*4)
    : zone==='low' ? def.min-span*rnd()
    : zone==='band' ? def.min+span*rnd()
    : zone==='high' ? def.max+span*rnd() : mid+span*(3+rnd()*4);
  const nR = Math.floor(rnd()*8);
  const readings = [];
  const slope = (rnd()-0.5)*span*0.4;
  for (let j=0;j<nR;j++) readings.push({day:j*pick([1,2,3,7,21]), value: level - slope*(nR-1-j)});
  const since = pick([0,1,2,3,4,5,8,14,30,999]);
  const hist = Array.from({length:Math.floor(rnd()*5)},(_,k)=>({dose:dose*(0.6+rnd()*0.8),rate:(rnd()-0.5)*span*0.06,day:-k-1}));
  const ctx = { def, eff, dose, level, daysSinceChange: since, readings, history: hist,
    today: Math.max(1,since), consumptionEstimate: dose*eff, allReadings: readings,
    testedToday: rnd()<0.5, previousState: pick([null,'suggested-up','suggested-down','off-target','emergency','overdue','early-warning','correct-level']),
    snoozeCount: Math.floor(rnd()*5), changeCount: Math.floor(rnd()*7),
    correctionRemaining: rnd()<0.4 ? rnd()*span*3 : 0,
    alkSteady: rnd()<0.7, testEveryDays: pick([2,7,21]),
    plan: rnd()<0.2 ? {target:dose*1.4} : null };
  let d;
  try { d = el==='alkalinity' ? decide(ctx) : decideSlow(el, ctx); } catch(e) { threw++; continue; }
  done++;
  states[el+':'+d.state] = (states[el+':'+d.state]||0)+1;
  let rows = [];
  try { rows = panel({ key:el, ...ctx, state:d.state,
    recommendedDose: d.options ? (d.options.find(o=>o.recommended)||{}).dose : null,
    priorDose: rnd()<0.5 ? dose*(0.7+rnd()*0.6) : null, appliedAt: 0,
    target: ctx.plan ? ctx.plan.target : null }); } catch(e) {}
  for (const f of ['summary','why','dashboard','wizard']) {
    if (!d[f]) continue;
    bucket(shapes,f).add(blank(d[f])); bucket(strings,f).add(d[f]); perEl[el].add(blank(d[f]));
  }
  for (const o of d.options||[]) {
    const t = o.label+' | '+o.note+' | '+(o.risk||'');
    bucket(shapes,'options').add(blank(t)); bucket(strings,'options').add(t); perEl[el].add(blank(t));
  }
  for (const n of d.notes||[]) { bucket(shapes,'notes').add(blank(n)); bucket(strings,'notes').add(n); perEl[el].add(blank(n)); }
  for (const r of rows) { const t = r.label+': '+r.value+' | '+(r.note||'');
    bucket(shapes,'panel').add(blank(t)); bucket(strings,'panel').add(t); perEl[el].add(blank(t)); }
}
console.log(`DISTINCT MESSAGES — ${done.toLocaleString()} situations sampled (${threw} unusable)`);
console.log('='.repeat(76));
console.log();
console.log('  surface                distinct wordings   distinct sentence shapes');
const LBL={summary:'tank summary line',why:'the explanation',dashboard:'dashboard line',
  wizard:'wizard line',options:'action options',notes:'side notes',panel:'wizard panel rows'};
let ts=0,tp=0;
for (const f of ['summary','why','dashboard','wizard','options','notes','panel']) {
  const st=(strings[f]||new Set()).size, sh=(shapes[f]||new Set()).size;
  ts+=st; tp+=sh;
  console.log('  '+LBL[f].padEnd(24)+String(st).toLocaleString().padStart(9)+String(sh).toLocaleString().padStart(22));
}
console.log('  '+'TOTAL'.padEnd(24)+String(ts).toLocaleString().padStart(9)+String(tp).toLocaleString().padStart(22));
console.log();
console.log('  distinct sentence shapes per element:');
for (const el of Object.keys(perEl)) console.log('    '+el.padEnd(12)+perEl[el].size);
console.log();
console.log('  states reached:');
for (const [k,v] of Object.entries(states).sort((a,b)=>b[1]-a[1])) console.log('    '+k.padEnd(34)+v.toLocaleString());
