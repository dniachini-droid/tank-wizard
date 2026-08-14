/* The summary, checked for meaning rather than well-formedness.
 *
 * Earlier sweeps confirmed the text parsed and the numbers were finite, and
 * missed a headline reading "everything is in range and holding — nothing
 * needs doing" above a claim saying phosphate was heading out of range. These
 * properties are about whether the box contradicts itself:
 *   - the headline cannot declare the tank calm while claims disagree
 *   - no two claims may describe the same parameter's level
 *   - a parameter named as fine cannot also be flagged or have a dose claim
 *   - every finding reaches the summary, and every destination resolves
 *   - the score working must reproduce the score, and not exist without one
 */
const path=require('path');
const L=require(path.join(__dirname, '..', '..', 'build', 'engines-new.cjs'));
const defs=L.PARAM_DEFS, T=L.todayStr();
let rnd=Number(process.env.SEED||1); const rand=()=>{rnd=(rnd*1103515245+12345)%2147483648;return rnd/2147483648;};
const pick=a=>a[Math.floor(rand()*a.length)];
const bad={}; const note=(k,d)=>{(bad[k]=bad[k]||[]).push(d);};

const RUNS=Number(process.env.RUNS||800);
let n=0;
for(let i=0;i<RUNS;i++){
  const readings=[];
  const nParams=1+Math.floor(rand()*defs.length);
  const chosen=defs.slice().sort(()=>rand()-0.5).slice(0,nParams);
  for(const d of chosen){
    const w=d.max-d.min;
    const c=pick([1,2,3,5,8,14,30]);
    const base=d.min+w*(rand()*3-1);            // well inside to well outside
    const drift=(rand()-0.5)*w*pick([0,0.1,0.5,2]);
    const noise=w*pick([0,0.02,0.15,0.8]);
    const age=pick([0,0,0,30,120]);
    for(let j=c;j>0;j--){
      readings.push({param:d.key,date:L.addDays(T,-(age+j*pick([1,2,3,7,21]))),time:pick(['08:00','20:00','23:59']),
        value:Math.round((base+drift*((c-j)/Math.max(1,c-1))+(rand()-0.5)*noise)*100000)/100000});
    }
  }
  const latest={}; for(const d of defs){const r=readings.filter(x=>x.param===d.key).sort((a,b)=>a.date<b.date?1:-1); latest[d.key]=r[0]||null;}
  const S={...L.DEFAULT_SETTINGS,volumeL:pick([20,77,200,800,2000])};
  let f,states=[],ov,claims;
  try{
    f=L.buildFindings({readings,icps:[],paramDefs:defs,settings:S,doseLog:[],waterChanges:[],latestByParam:latest}).findings;
    for(const k of ['alkalinity','calcium','magnesium']){
      const def=defs.find(d=>d.key===k);
      const fn=k==='alkalinity'?L.assessAlkalinity:k==='calcium'?L.assessCalcium:L.assessMagnesium;
      const a=fn({readings,doseLog:[],waterChanges:[],corrections:[],settings:S,def});
      const st=L.doseStatus(a,def); if(st) states.push({...st,key:k,el:def.label.toLowerCase()});
    }
    ov=L.buildOverview(readings,latest,defs,f,states);
    claims=L.buildBriefing(readings,latest,defs,f,states,{});
  }catch(e){ note('THREW',e.message); continue; }
  n++;
  const H=ov.headline||'';

  // ---- headline sanity
  if(/undefined|NaN|Infinity|\[object/.test(H)) note('headline broken',H);
  if(/\s{2,}/.test(H)) note('headline double space',H);
  if(/\s[,.;]/.test(H)) note('headline space before punctuation',H);
  if((H.match(/—/g)||[]).length>1) note('headline two dashes',H);
  if(H.split(/\s+/).length>18) note('headline too long',H);

  // ---- headline must not contradict the claims
  const hasAct=claims.some(c=>c.tone==='act');
  const hasWatchOrWorse=claims.some(c=>['act','warn','watch'].includes(c.tone));
  if(/nothing needs doing/.test(H)&&hasWatchOrWorse)
    note('headline says nothing needed while claims exist',H+' || '+claims.filter(c=>c.tone!=='ok'&&c.tone!=='busy').map(c=>c.claim).join('; '));
  if(/^Everything is in range and holding/.test(H)&&hasWatchOrWorse)
    note('headline says all fine while claims exist',H);
  if(hasAct&&/^(Everything|All in range|Mostly stable|Rock steady|Steady throughout)/.test(H))
    note('headline calm while something urgent',H);

  // ---- claim text sanity
  for(const c of claims){
    const t=c.claim+' '+(c.support||'');
    if(/undefined|NaN|Infinity|\[object/.test(t)) note('claim broken',t.slice(0,80));
    if(/\s{2,}/.test(t)) note('claim double space',t.slice(0,80));
    if(/\s[,.;]/.test(t)) note('claim space before punctuation',t.slice(0,80));
    if(/\b(\w+) \1\b/i.test(t)) note('claim repeated word',t.slice(0,80));
    if(c.support&&!/[.!?]$/.test(c.support.trim())) note('support unpunctuated',c.support.slice(-40));
    if(c.claim.length>90) note('claim very long',c.claim);
  }

  // ---- no two claims about the same parameter's level
  const lvl={};
  for(const c of claims){
    const isLevel=/^finding:(far-out-|heading-out-|salinity-off)/.test(c.id)||c.id.startsWith('drift:')||c.id==='parked';
    if(!isLevel) continue;
    const keys=c.id==='parked'?String(c.dismissSignature||'').split(','):[c.goto&&c.goto.tab==='param'?c.goto.key:null];
    for(const k of keys.filter(Boolean)){
      if(lvl[k]) note('two level claims for one parameter',k+': '+lvl[k]+' + '+c.id);
      lvl[k]=c.id;
    }
  }

  // ---- a parameter cannot be both "fine" and flagged
  const solid=claims.find(c=>c.id==='solid');
  if(solid){
    const named=String(solid.support||'').replace(/^Holding:\s*/,'').replace(/\.$/,'').split(/,\s*|\s+and\s+/).map(x=>x.trim().toLowerCase());
    for(const k of Object.keys(lvl)){
      const lbl=(defs.find(d=>d.key===k)||{}).label;
      if(lbl&&named.includes(lbl.toLowerCase())) note('named fine while level flagged',lbl);
    }
    for(const c of claims){
      if(!c.id.startsWith('dose:')) continue;
      const lbl=(defs.find(d=>d.key===c.id.slice(5))||{}).label;
      if(lbl&&named.includes(lbl.toLowerCase())&&/level is not|steady but|could change/i.test(c.claim))
        note('named fine while dose claim disagrees',lbl+': '+c.claim);
    }
  }

  // ---- every finding reaches the summary
  for(const x of f) if(!claims.some(c=>c.id==='finding:'+x.id)) {
    /* Which element it was about, so a real gap can be told apart from a
       finding the summary deliberately folded into another claim. */
    note('finding missing from summary', x.id + ' [' + (x.params||[]).join('+') + ']');
  }

  // ---- destinations resolve
  for(const c of claims){
    if(!c.goto) continue;
    if(!['param','dosing','log'].includes(c.goto.tab)) note('bad destination',String(c.goto.tab));
    if(c.goto.tab==='param'&&!defs.find(d=>d.key===c.goto.key)) note('destination not a parameter',String(c.goto.key));
  }

  // ---- score explanation consistency
  const ex=L.explainScore(readings,latest,defs,ov.score);
  if(ex){
    const caps=[ex.evidenceCap,ex.safetyCap].filter(v=>v!=null);
    const shown=ex.capped?null:(caps.length?Math.min(ex.blended,...caps):ex.blended);
    if(shown!=null&&Math.abs(shown-ov.score)>1) note('score working disagrees with score',shown+' vs '+ov.score);
    if(ex.capped&&!(latest.ammonia&&latest.ammonia.value>0.005)) note('false ammonia cap','');
  }
}
console.log('DEEP SWEEP seed='+(process.env.SEED||1)+'  '+n+' tanks');
const ks=Object.keys(bad);
console.log('  properties violated: '+ks.length);
for(const k of ks){ console.log('   '+k+': '+bad[k].length); bad[k].slice(0,3).forEach(x=>console.log('      '+x)); }
if(ks.length) process.exit(1);

/* A parameter that is moving must never be described as parked or steady.
 *
 * The stability grade compares day-to-day movement against a noise threshold,
 * so something climbing steadily but slowly still grades green. A real tank
 * showed the consequence: alkalinity oscillating 0.41 dKH around its mean
 * produced a 0.053 dKH/week slope, and the app announced it would leave the
 * range in 26 days — forecasting a 0.2 dKH move inside noise five times that.
 * Meanwhile potassium climbing 80 ppm over three weeks was called "parked".
 *
 * The test that separates them is direction, not rate: a wandering parameter
 * reverses about half its steps, a travelling one far fewer.
 */
{
  const defs7 = L.PARAM_DEFS;
  const T10 = L.todayStr();
  const S10 = { ...L.DEFAULT_SETTINGS, volumeL: 77 };
  let bad = 0, checked = 0;

  const run = (key, shape) => {
    const def = defs7.find((d) => d.key === key);
    const span = def.max - def.min, mid = (def.min + def.max) / 2;
    const noise = (L.STABILITY_RULES[key] || {}).noiseFloor || span * 0.1;
    const rise = Math.max(span * 0.5, noise * 4);
    const n = 12, readings = [];
    for (let i = 0; i < n; i++) {
      readings.push({ param: key, date: L.addDays(T10, -(n - 1 - i) * 2), time: '20:00',
        value: Math.round(shape(i, n - 1, mid, span, noise, rise) * 1000) / 1000 });
    }
    for (const k of defs7.map((d) => d.key)) {
      if (k === key || k === 'ammonia' || k === 'salinity') continue;
      const d = defs7.find((x) => x.key === k);
      for (let j = 8; j > 0; j--) readings.push({ param: k, date: L.addDays(T10, -j * 2), time: '20:00', value: (d.min + d.max) / 2 });
    }
    return L.deriveTankState({ readings, icps: [], paramDefs: defs7, settings: S10 });
  };

  for (const key of ['alkalinity', 'calcium', 'magnesium', 'nitrate', 'phosphate', 'ph', 'potassium']) {
    if (!defs7.find((d) => d.key === key)) continue;

    /* Oscillating around the middle must never produce a trend claim. */
    const osc = run(key, (i, n, mid, span) => mid + Math.sin(i * 1.3) * span * 0.5);
    checked++;
    if (osc.allFindings.some((f) => f.id === 'heading-out-' + key)) {
      console.log(`  FAIL ${key}: oscillation reported as heading out of range`); bad++;
    }

    /* Climbing steadily out of band must never be called parked or steady. */
    const climbing = run(key, (i, n, mid, span, noise, rise) => mid - rise * 0.5 + rise * (i / n));
    checked++;
    const said = climbing.briefing
      .filter((c) => c.goto && c.goto.key === key)
      .map((c) => c.claim + ' ' + (c.support || '')).join(' ').toLowerCase();
    if (/parked|going nowhere|nothing to chase/.test(said)) {
      console.log(`  FAIL ${key}: a climbing parameter described as parked — "${said.slice(0, 70)}"`); bad++;
    }
    /* And it must say something rather than falling through every claim. */
    const level = climbing.latestByParam[key];
    const def = defs7.find((d) => d.key === key);
    const outOfBand = level && (level.value < def.min || level.value > def.max);
    const dosed = ['alkalinity', 'calcium', 'magnesium'].includes(key);
    if (outOfBand && !said && !dosed) {
      console.log(`  FAIL ${key}: climbing out of range and nothing said at all`); bad++;
    }
  }
  console.log(`  moving vs parked: ${checked} checks across 7 parameters, ${bad} failures`);
  if (bad) process.exit(1);
}

/* The reading confirmation window must speak for the dosing engine, not form
 * its own opinion.
 *
 * Logged mid-correction, 412 ppm is not "well below your target" with nothing
 * being done — it is a tank on its way somewhere, and the number climbing is
 * the plan working. The window had no idea a plan existed, so it commented on
 * the reading in isolation while the Dosing Wizard two taps away called the
 * same number progress.
 */
{
  const caDef3 = L.PARAM_DEFS.find((d) => d.key === 'calcium');
  /* Anchored to the band. 400 -> 475 crossed calcium's old 450-500; against
     the corrected 400-450 the start is the floor and 412 is inside, so the
     "still out of range" assertion had nothing to assert. */
  const cb = caDef3;
  const bwid = cb.max - cb.min;
  const planStart = cb.min - bwid;
  const planTarget = (cb.min + cb.max) / 2;
  const plan = { target: planTarget, returnDose: 12, startValue: planStart, up: true,
    remaining: planTarget - (planStart + bwid * 0.25), daysLeft: 4, days: 5, arrived: false };
  const verdict = (value, prev, state, cp) => L.readingVerdict(caDef3, {
    value, prev, delta: prev == null ? null : value - prev,
    status: L.paramStatus(caDef3, value),
    doseState: cp ? { state, correctionPlan: cp } : null });
  let bad = 0;

  /* Out of band mid-plan: still says out of range, but in the plan's context. */
  const mid = verdict(planStart + bwid * 0.25, planStart + bwid * 0.1, 'correcting-dose', plan);
  const midText = `${mid.headline} ${mid.line}`;
  if (!/below range/i.test(midText)) { console.log('  FAIL mid-plan hides that it is out of range'); bad++; }
  if (!/correction/i.test(midText)) { console.log('  FAIL mid-plan does not mention the correction'); bad++; }
  if (mid.celebrate) { console.log('  FAIL celebrated a mid-plan reading'); bad++; }

  /* Rising is reported as the plan working, not as a problem. */
  if (!/working|nothing to change/i.test(mid.line)) {
    console.log('  FAIL a deliberate rise is not framed as the plan working'); bad++;
  }

  /* Arrival celebrates, and only arrival. */
  const done = verdict(planTarget + 2, planTarget - 4, 'correction-done', { ...plan, arrived: true, remaining: 0 });
  if (!done.celebrate) { console.log('  FAIL arrival does not celebrate'); bad++; }
  if (!/nice work|back in range/i.test(done.headline)) { console.log('  FAIL arrival wording'); bad++; }
  if (done.goto !== 'dosing') { console.log('  FAIL arrival does not hand off to the wizard'); bad++; }

  /* An ordinary in-band reading with no plan must NOT celebrate — otherwise
     the celebration means nothing. */
  const ordinary = verdict(planTarget, planTarget - 2, 'idle', null);
  if (ordinary.celebrate) { console.log('  FAIL celebrated an ordinary in-band reading'); bad++; }

  /* Stalled and overdue say so rather than reading as fine. */
  for (const [label, state] of [['stalled', 'correction-stalled'], ['due', 'correction-due']]) {
    const v = verdict(planStart + 2, planStart + 1, state, plan);
    if (v.celebrate) { console.log(`  FAIL celebrated a ${label} correction`); bad++; }
    if (!/dosing wizard/i.test(v.line)) { console.log(`  FAIL ${label} does not point at the wizard`); bad++; }
  }

  /* No verdict may leak internals. */
  for (const v of [mid, done, ordinary]) {
    if (/undefined|NaN|Infinity/.test(`${v.headline} ${v.line}`)) {
      console.log('  FAIL broken text in a verdict'); bad++;
    }
  }
  console.log(`  reading window vs dosing engine: 7 verdicts, ${bad} failures`);
  if (bad) process.exit(1);
}

/* The reading window and the Dosing Wizard must never contradict each other.
 *
 * With a correction running the window renders the engine's verdict. Without
 * one it uses its own voice — "dead centre", "a little low" — and that voice
 * has to stay consistent with what the wizard says about the same tank on the
 * same day. A popup calling a reading fine while the wizard flags it is how
 * someone learns to trust one screen and ignore the other.
 */
{
  const T16 = L.todayStr();
  const CFG = {
    alkalinity: { dkhPerMlPer100L: 0.0533, dailyDoseMl: 9, fn: L.assessAlkalinity },
    calcium: { caPpmPerMlPer100L: 0.36, calciumDoseMl: 12, fn: L.assessCalcium },
    magnesium: { mgPpmPerMlPer100L: 0.024, magDoseMl: 8, fn: L.assessMagnesium },
  };
  let bad = 0, checked = 0;
  for (const key of Object.keys(CFG)) {
    const def = L.PARAM_DEFS.find((d) => d.key === key);
    const span = def.max - def.min, mid = (def.min + def.max) / 2;
    const S16 = { ...L.DEFAULT_SETTINGS, volumeL: 77, ...CFG[key] };
    for (const off of [-2, -1.2, -0.6, 0, 0.6, 1.2, 2]) {
      const v = mid + span * off;
      const readings = [];
      for (let j = 8; j > 0; j--) readings.push({ param: key, date: L.addDays(T16, -j * 2), time: '20:00', value: v });
      const a = CFG[key].fn({ readings, doseLog: [], waterChanges: [], corrections: [],
        settings: S16, def, correctionPlans: {} });
      const st = L.doseStatus(a, def, T16, S16);
      const pv = L.readingVerdict(def, { value: v, prev: v, delta: 0,
        status: L.paramStatus(def, v), doseState: st });
      checked++;
      const inBand = v >= def.min && v <= def.max;
      const popupCalm = /nothing to do|dead centre|comfortably|boring kind of good/i.test(`${pv.headline} ${pv.line}`);
      if (popupCalm && !inBand) {
        console.log(`  FAIL ${key} at ${v}: window calm while out of band — "${pv.headline}"`); bad++;
      }
      if (!inBand && !/low|high|below|above|range|band/i.test(pv.headline)) {
        console.log(`  FAIL ${key} at ${v}: window silent about being out of band`); bad++;
      }
      if (/undefined|NaN|Infinity/.test(`${pv.headline} ${pv.line}`)) {
        console.log(`  FAIL ${key} at ${v}: broken text`); bad++;
      }
    }
  }
  console.log(`  window vs wizard agreement: ${checked} combinations, ${bad} contradictions`);
  if (bad) process.exit(1);
}

/* The reading confirmation after a plain dose change.
 *
 * The window was already wired to correction PLANS — that was built and tested.
 * An ordinary dose change was not, and the agreement test above runs with
 * `doseLog: []`, so it had never once seen one. That is exactly why the gap
 * survived.
 *
 * The failure it produced: raise the dose, watch alkalinity climb 2 dKH, and
 * the window would say "far enough out that a re-test is worth doing" —
 * suggesting the READING was suspect when it was the predictable result of the
 * keeper's own change, which the wizard knew about and was calling an
 * overshoot at that very moment.
 */
{
  const dcDef = L.PARAM_DEFS.find((d) => d.key === 'alkalinity');
  const TD = L.todayStr();
  let bad = 0, checked = 0;

  const window = ({ ago, dose, vals, now, waterChange = false, prevDose = 9 }) => {
    const S = { ...L.DEFAULT_SETTINGS, volumeL: 77, dkhPerMlPer100L: 0.0533, dailyDoseMl: dose };
    const readings = vals.map((v, i) =>
      ({ param: 'alkalinity', date: L.addDays(TD, -(vals.length - i)), time: '20:00', value: v }));
    const doseLog = [
      { element: 'alkalinity', date: L.addDays(TD, -ago - 3), time: '21:00', ml: prevDose },
      { element: 'alkalinity', date: L.addDays(TD, -ago), time: '21:00', ml: dose },
    ];
    const waterChanges = waterChange ? [{ id: 'w', date: L.addDays(TD, -1), litres: 12 }] : [];
    const a = L.assessAlkalinity({ readings, doseLog, waterChanges, corrections: [],
      settings: S, def: dcDef, correctionPlans: {} });
    const st = L.doseStatus(a, dcDef, TD, S, null, doseLog, waterChanges);
    const prev = vals[vals.length - 1];
    return L.readingVerdict(dcDef, { value: now, prev, delta: now - prev,
      status: L.paramStatus(dcDef, now), doseState: st });
  };

  const CASES = [
    ['too early', { ago: 1, dose: 11, vals: [8.4, 8.4, 8.4, 8.4, 8.5], now: 8.6 },
      /too early/i, /11\.0 mL|yesterday/],
    /* A settled tank, so the wizard is idle. With a rising trend the engine
       asks for a different dose and "hold it here" is correctly withheld —
       an earlier version of this case used rising readings and then asserted
       the very message the overlap rule exists to suppress. */
    /* The reading that ARRIVES in band. The message is said once, when it
       becomes true — an earlier version used readings already in band, which
       the "say it once" rule correctly silences. */
    ['it worked', { ago: 7, dose: 11, vals: [8.0, 8.1, 8.2, 8.3, 8.4], now: 9.0 },
      /working/i, /hold it here/i],
    /* "Not moved" splits in two. If the dose does not match consumption the
       change was too small; if it DOES match, the level is not stuck, it is
       being HELD — which is what a matched dose does, and is the normal state
       after a correction that overshot and was cancelled. An earlier version
       asserted the "too small" wording for both. */
    ['it has not moved', { ago: 7, dose: 11, vals: [8.4, 8.4, 8.4, 8.4, 8.4], now: 8.4 },
      /has not moved|held at/i, /solution strength|matching what the tank uses/i],
    ['overshot', { ago: 7, dose: 14, vals: [8.4, 8.8, 9.3, 9.6, 9.9], now: 10.3 },
      /overshoot/i, /not suspect/i],
    /* Three outcomes now, not one. When the engine knows what the tank uses it
       can say whether the change went far enough; when it does not — which is
       common right after a change, because the fit needs readings on the NEW
       dose — it says so rather than blaming a skimmer. An earlier version
       asserted "something else is at work" unconditionally, which is the guess
       the app should not be making. */
    ['moved the wrong way', { ago: 7, dose: 11, vals: [8.9, 8.8, 8.7, 8.6, 8.5], now: 8.3 },
      /wrong way|did not go far enough|still falling/i, /mL a day/],
    ['danger names the cause', { ago: 7, dose: 20, vals: [9.0, 9.8, 10.5, 10.9, 11.2], now: 11.6 },
      /dangerously high/i, /you changed the dose/i],
  ];

  for (const [label, setup, headlinePattern, linePattern] of CASES) {
    const v = window(setup);
    checked++;
    if (!headlinePattern.test(v.headline)) {
      console.log(`  FAIL ${label}: headline was "${v.headline}"`); bad++;
    }
    if (!linePattern.test(v.line)) {
      console.log(`  FAIL ${label}: line did not say what it should — "${v.line.slice(0, 70)}"`); bad++;
    }
    if (/undefined|NaN|Infinity/.test(`${v.headline} ${v.line}`)) {
      console.log(`  FAIL ${label}: broken text`); bad++;
    }
    /* Every message must name the dose somewhere — headline or line. The
       "has not moved" case puts it in the headline, which reads better than
       repeating it. */
    if (!/mL a day/.test(`${v.headline} ${v.line}`)) {
      console.log(`  FAIL ${label}: never names the dose — "${v.headline} / ${v.line.slice(0, 60)}"`); bad++;
    }
  }

  /* Danger comes FIRST and the cause second, in one message — not the cause
     alone, and not two messages. */
  {
    const v = window({ ago: 7, dose: 20, vals: [9.0, 9.8, 10.5, 10.9, 11.2], now: 11.6 });
    checked++;
    const dangerAt = v.headline.search(/dangerous/i);
    const causeAt = v.line.search(/you changed the dose/i);
    if (dangerAt < 0 || causeAt < 0) {
      console.log('  FAIL danger message does not carry both the danger and the cause'); bad++;
    }
  }

  /* A water change between the dose change and the reading could have done the
     work, so the claim must soften from "your dose did this" to "it has
     moved". Crediting the wrong cause teaches the wrong lesson. */
  {
    const credited = window({ ago: 7, dose: 11, vals: [8.0, 8.1, 8.2, 8.3, 8.4], now: 9.0 });
    const softened = window({ ago: 7, dose: 11, vals: [8.0, 8.1, 8.2, 8.3, 8.4], now: 9.0, waterChange: true });
    checked++;
    if (softened.line === credited.line) {
      console.log('  FAIL a water change in between did not soften the attribution'); bad++;
    }
    if (/mL a day has moved/.test(softened.line)) {
      console.log('  FAIL still credits the dose despite a water change'); bad++;
    }
  }

  /* And it must fall silent once the change is old news: in range, and held
     there. Otherwise every reading forever carries a paragraph about a dose
     change from months ago. */
  {
    const settled = window({ ago: 60, dose: 11,
      vals: [9.0, 9.0, 9.0, 9.0, 9.0], now: 9.0 });
    checked++;
    if (/mL a day|changed the dose/i.test(settled.line)) {
      console.log(`  FAIL still narrating a dose change from 60 days ago — "${settled.line.slice(0, 60)}"`); bad++;
    }
  }

  /* A correction plan still wins: that behaviour was built and tested first and
     must not be displaced. */
  {
    const S = { ...L.DEFAULT_SETTINGS, volumeL: 77, dkhPerMlPer100L: 0.0533, dailyDoseMl: 14 };
    const readings = [8.2, 8.3, 8.4, 8.5, 8.6].map((v, i) =>
      ({ param: 'alkalinity', date: L.addDays(TD, -(5 - i)), time: '20:00', value: v }));
    const doseLog = [{ element: 'alkalinity', date: L.addDays(TD, -2), time: '21:00', ml: 14 }];
    const a = L.assessAlkalinity({ readings, doseLog, waterChanges: [], corrections: [],
      settings: S, def: dcDef,
      correctionPlans: { alkalinity: { target: 9.0, returnDose: 9, startedAt: L.addDays(TD, -2),
        startValue: 8.2, pace: 'steady', dose: 14, days: 4 } } });
    const st = L.doseStatus(a, dcDef, TD, S, null, doseLog, []);
    const v = L.readingVerdict(dcDef, { value: 8.7, prev: 8.6, delta: 0.1,
      status: L.paramStatus(dcDef, 8.7), doseState: st });
    checked++;
    /* 8.7 is inside the band, so this plan has ARRIVED and the window
       celebrates — which is the correction behaviour winning, exactly as it
       should. What must not happen is the dose-change message appearing
       instead. */
    const isCorrectionVoice = /correction|on its way|back in range|nice work/i.test(`${v.headline} ${v.line}`);
    const isDoseChangeVoice = /mL a day|changed the dose|dose change is working/i.test(`${v.headline} ${v.line}`);
    if (!isCorrectionVoice || isDoseChangeVoice) {
      console.log(`  FAIL a running correction was displaced by the dose-change message — "${v.headline}"`); bad++;
    }
  }

  console.log(`  reading confirmation after a dose change: ${checked} checks, ${bad} failures`);
  if (bad) process.exit(1);
}

/* The same messages, through the path the app actually uses.
 *
 * Everything above calls readingVerdict directly with a doseState built by
 * hand. That is how the correction cross-talk came to be dead in the real app
 * for months: the engine function was tested exhaustively and the CALL SITE
 * was never checked, so every verification passed against data the app cannot
 * produce.
 *
 * When you log a reading the app re-derives the whole tank and hands the
 * popup `after.doseStates.find(...)`. If deriveTankState stops threading the
 * dose log through to doseStatus, these fields go undefined and the whole
 * feature silently disappears — with every test above still passing.
 */
{
  const dcDef2 = L.PARAM_DEFS.find((d) => d.key === 'alkalinity');
  const TD2 = L.todayStr();
  let bad = 0, checked = 0;

  const throughTheApp = ({ ago, dose, vals, now }) => {
    const S = { ...L.DEFAULT_SETTINGS, volumeL: 77, dkhPerMlPer100L: 0.0533, dailyDoseMl: dose };
    const readings = vals.map((v, i) =>
      ({ param: 'alkalinity', date: L.addDays(TD2, -(vals.length - i)), time: '20:00', value: v }));
    for (const k of ['calcium', 'magnesium', 'nitrate', 'phosphate', 'ph']) {
      const d = L.PARAM_DEFS.find((x) => x.key === k);
      for (let j = 8; j > 0; j--) {
        readings.push({ param: k, date: L.addDays(TD2, -j * 2), time: '20:00', value: (d.min + d.max) / 2 });
      }
    }
    const doseLog = [
      { element: 'alkalinity', date: L.addDays(TD2, -ago - 3), time: '21:00', ml: 9 },
      { element: 'alkalinity', date: L.addDays(TD2, -ago), time: '21:00', ml: dose },
    ];
    /* Exactly what logReading does: append, re-derive, take the dose state. */
    const next = [...readings, { id: 'new', param: 'alkalinity', date: TD2, time: '20:00', value: now }];
    const after = L.deriveTankState({ readings: next, icps: [], paramDefs: L.PARAM_DEFS,
      settings: S, doseLog, waterChanges: [], corrections: [], correctionPlans: {} });
    const ds = after.doseStates.find((d) => d && d.key === 'alkalinity') || null;
    const prev = vals[vals.length - 1];
    return { ds, v: L.readingVerdict(dcDef2, { value: now, prev, delta: now - prev,
      status: L.paramStatus(dcDef2, now), doseState: ds }) };
  };

  for (const [label, setup, pattern] of [
    ['too early', { ago: 1, dose: 11, vals: [8.4, 8.4, 8.4, 8.4, 8.5], now: 8.6 }, /too early/i],
    /* Arriving in band AND the wizard content. A steep climb leaves the
       engine wanting another change, and "hold it here" is then correctly
       withheld — so the success case needs a gentle approach, not a sharp
       one. */
    ['it worked', { ago: 7, dose: 11, vals: [8.35, 8.4, 8.42, 8.45, 8.48], now: 8.6 }, /working|in band/i],
    ['it has not moved', { ago: 7, dose: 11, vals: [8.4, 8.4, 8.4, 8.4, 8.4], now: 8.4 }, /has not moved|held at/i],
    ['overshot', { ago: 7, dose: 14, vals: [8.4, 8.8, 9.3, 9.6, 9.9], now: 10.3 }, /overshoot/i],
    /* Sparse readings and a fresh change reach the OTHER settling returns —
       there are three, and removing the facts from any one of them went
       unnoticed until each was exercised. */
    ['sparse history', { ago: 1, dose: 11, vals: [8.5, 8.5], now: 8.6 }, /too early|mL a day/i],
    ['single prior reading', { ago: 1, dose: 11, vals: [8.5], now: 8.6 }, /too early|mL a day/i],
  ]) {
    const { ds, v } = throughTheApp(setup);
    checked++;
    /* The fields must survive the trip. This is the specific thing that was
       never checked: deriveTankState -> doseStatus -> the popup. */
    if (!ds || ds.doseChangedDaysAgo == null) {
      console.log(`  FAIL ${label}: deriveTankState did not carry the dose-change facts to the popup`);
      bad++;
      continue;
    }
    /* Threading is checked separately, below, with values that differ from
       the defaults. Asserting `doseDirection === "up"` here proved nothing:
       "up" is what the field falls back to when the dose log never arrives, so
       a broken thread and a correct computation look identical. */
    if (!pattern.test(`${v.headline} ${v.line}`)) {
      console.log(`  FAIL ${label} through the app path: "${v.headline}"`); bad++;
    }
  }

  /* And with no dose change at all it must stay quiet, through the same path. */
  {
    const S = { ...L.DEFAULT_SETTINGS, volumeL: 77, dkhPerMlPer100L: 0.0533, dailyDoseMl: 9 };
    const readings = [8.9, 9.0, 9.0, 9.1, 9.0].map((v, i) =>
      ({ param: 'alkalinity', date: L.addDays(TD2, -(5 - i)), time: '20:00', value: v }));
    const after = L.deriveTankState({ readings, icps: [], paramDefs: L.PARAM_DEFS,
      settings: S, doseLog: [], waterChanges: [], corrections: [], correctionPlans: {} });
    const ds = after.doseStates.find((d) => d && d.key === 'alkalinity') || null;
    const v = L.readingVerdict(dcDef2, { value: 9.0, prev: 9.1, delta: -0.1,
      status: L.paramStatus(dcDef2, 9.0), doseState: ds });
    checked++;
    if (/mL a day|changed the dose/i.test(`${v.headline} ${v.line}`)) {
      console.log(`  FAIL narrated a dose change that never happened — "${v.line.slice(0, 60)}"`); bad++;
    }
  }


  /* Does the dose log actually REACH doseStatus?
   *
   * Only provable with inputs whose correct answer differs from the fallback.
   * A lowered dose must read "down" — the default is "up". A water change after
   * the change must read disturbed — the default is false. With the threading
   * cut, both silently take their defaults and every other assertion here
   * still passes. */
  {
    const S = { ...L.DEFAULT_SETTINGS, volumeL: 77, dkhPerMlPer100L: 0.0533, dailyDoseMl: 7 };
    const readings = [9.6, 9.5, 9.4, 9.3, 9.2].map((v, i) =>
      ({ param: 'alkalinity', date: L.addDays(TD2, -(5 - i)), time: '20:00', value: v }));
    /* Lowered: 12 mL down to 7. */
    const doseLog = [
      { element: 'alkalinity', date: L.addDays(TD2, -10), time: '21:00', ml: 12 },
      { element: 'alkalinity', date: L.addDays(TD2, -6), time: '21:00', ml: 7 },
    ];
    const waterChanges = [{ id: 'w', date: L.addDays(TD2, -2), litres: 15 }];
    const after = L.deriveTankState({ readings, icps: [], paramDefs: L.PARAM_DEFS,
      settings: S, doseLog, waterChanges, corrections: [], correctionPlans: {} });
    const ds = after.doseStates.find((d) => d && d.key === 'alkalinity');
    checked++;
    if (!ds || ds.doseDirection !== 'down') {
      console.log(`  FAIL a lowered dose reads as "${ds && ds.doseDirection}" — the dose log is not reaching doseStatus`);
      bad++;
    }
    checked++;
    if (!ds || ds.disturbedSinceDoseChange !== true) {
      console.log(`  FAIL a water change after the dose change was not noticed — the water-change list is not reaching doseStatus`);
      bad++;
    }
  }

  console.log(`  dose-change messages through deriveTankState: ${checked} checks, ${bad} failures`);
  if (bad) process.exit(1);
}

/* The confirmation window must never contradict the Dosing Wizard.
 *
 * Testing the new messages in isolation missed two overlaps that only appear
 * when the two surfaces are read side by side:
 *
 * 1. A LOGGED correction sets the state to "correcting" without creating a
 *    correctionPlan, so a guard on `!correctionPlan` let the dose-change
 *    message through. The wizard said "alkalinity is on its way to 10.0dKH"
 *    while the window said "the dose change is working, hold it here" —
 *    crediting the daily dose for a rise a correction was driving, and telling
 *    the keeper to hold while a correction ran.
 *
 * 2. "suggested" means the engine wants a DIFFERENT dose. "Hold it here"
 *    against a wizard asking for 9.6 mL is a flat contradiction.
 *
 * The fix for (2) had to be narrow. Suppressing the whole block whenever the
 * wizard wanted a change silenced the overshoot and "has not moved" messages —
 * which are exactly the ones worth saying, because they EXPLAIN why the wizard
 * wants a change rather than contradicting it.
 */
{
  const ovDef = L.PARAM_DEFS.find((d) => d.key === 'alkalinity');
  const TO = L.todayStr();
  let bad = 0, checked = 0;

  const both = (o) => {
    const S = { ...L.DEFAULT_SETTINGS, volumeL: 77, dkhPerMlPer100L: 0.0533, dailyDoseMl: o.dose };
    const readings = o.vals.map((v, i) =>
      ({ param: 'alkalinity', date: L.addDays(TO, -(o.vals.length - i)), time: '20:00', value: v }));
    for (const k of ['calcium', 'magnesium', 'nitrate', 'phosphate', 'ph']) {
      const d = L.PARAM_DEFS.find((x) => x.key === k);
      for (let j = 8; j > 0; j--) {
        readings.push({ param: k, date: L.addDays(TO, -j * 2), time: '20:00', value: (d.min + d.max) / 2 });
      }
    }
    const doseLog = o.ago != null ? [
      { element: 'alkalinity', date: L.addDays(TO, -o.ago - 3), time: '21:00', ml: 9 },
      { element: 'alkalinity', date: L.addDays(TO, -o.ago), time: '21:00', ml: o.dose },
    ] : [];
    const correctionPlans = o.plan ? { alkalinity: { target: 9.0, returnDose: 9,
      startedAt: L.addDays(TO, -o.plan), startValue: 8.2, pace: 'steady', dose: o.dose, days: 4 } } : {};
    const st = L.deriveTankState({ readings, icps: [], paramDefs: L.PARAM_DEFS, settings: S,
      doseLog, waterChanges: [], corrections: o.corr || [], correctionPlans });
    const ds = st.doseStates.find((x) => x && x.key === 'alkalinity');
    const prev = o.vals[o.vals.length - 1];
    return { ds, v: L.readingVerdict(ovDef, { value: o.now, prev, delta: o.now - prev,
      status: L.paramStatus(ovDef, o.now), doseState: ds }) };
  };

  /* A running correction — plan or logged — owns the window. */
  for (const [label, setup] of [
    ['a logged correction', { ago: 5, dose: 11, vals: [8.3, 8.4, 8.5, 8.6, 8.7], now: 8.9,
      corr: [{ id: 'c', element: 'alkalinity', date: L.addDays(TO, -2), time: '12:00', ml: 20, direction: 'up' }] }],
    ['a correction plan', { ago: 2, plan: 2, dose: 14, vals: [8.2, 8.3, 8.4, 8.5, 8.6], now: 8.7 }],
  ]) {
    const { v } = both(setup);
    checked++;
    if (/dose change is working|hold it here/i.test(`${v.headline} ${v.line}`)) {
      console.log(`  FAIL ${label}: the dose-change message spoke over a running correction — "${v.headline}"`);
      bad++;
    }
  }

  /* "Hold it here" must never appear while the wizard is asking for a change. */
  {
    const { ds, v } = both({ ago: 7, dose: 11, vals: [8.4, 8.5, 8.6, 8.7, 8.8], now: 9.0 });
    checked++;
    if (ds.state === 'suggested' && /hold it here/i.test(v.line)) {
      console.log('  FAIL told the keeper to hold while the wizard asked for a different dose');
      bad++;
    }
  }

  /* But the messages that EXPLAIN a wanted change must still appear. Silencing
     these was the overcorrection. */
  for (const [label, setup, pattern] of [
    ['overshoot', { ago: 7, dose: 14, vals: [8.4, 8.8, 9.3, 9.6, 9.9], now: 10.3 }, /overshoot/i],
    /* Either wording — "has not moved" when the dose is short, "held at" when
       the dose matches and is holding the level where it is. Both explain why
       the wizard wants a change rather than contradicting it. */
    ['has not moved', { ago: 7, dose: 11, vals: [8.4, 8.4, 8.4, 8.4, 8.4], now: 8.4 }, /has not moved|held at/i],
  ]) {
    const { ds, v } = both(setup);
    checked++;
    if (!pattern.test(`${v.headline} ${v.line}`)) {
      console.log(`  FAIL ${label} fell silent because the wizard wanted a change [${ds.state}] — "${v.headline}"`);
      bad++;
    }
  }

  /* And with the wizard idle, the success message speaks. */
  {
    /* Arriving in band, not sitting in it. The success message is said once,
       on the reading that makes it true — a run of readings already in band is
       precisely the case it now stays quiet for, and asserting it there was
       asserting the wallpaper this change removed. */
    const { v } = both({ ago: 7, dose: 11, vals: [8.35, 8.4, 8.42, 8.45], now: 8.6 });
    checked++;
    if (!/working/i.test(v.headline)) {
      console.log(`  FAIL a working dose change went unmentioned with the wizard idle — "${v.headline}"`);
      bad++;
    }
  }
  console.log(`  window never contradicts the wizard: ${checked} checks, ${bad} failures`);
  if (bad) process.exit(1);
}

/* The same messages on calcium and magnesium.
 *
 * Everything above was built and verified on alkalinity alone — 28 mentions of
 * it against 2 each for the others. Alkalinity settles in two days; calcium
 * takes seventeen and magnesium thirty. The whole feature was developed on the
 * one element where the timing bug is invisible.
 *
 * What that hid: "too early to tell" gated EVERY message behind the settle
 * window, so calcium and magnesium said nothing else for two to four weeks
 * however far out they had gone. A tank 60 ppm over its calcium band, three
 * days after the keeper doubled the dose, was told to wait a fortnight.
 *
 * The window governs whether the dose RATE can be inferred. It does not govern
 * whether a level has visibly left its band, which needs no statistics — so
 * overshoot and wrong-way now speak immediately, while "it worked" and "it has
 * not moved" still wait, because those are inferences about the rate.
 */
{
  const ELEMENTS = {
    alkalinity: { strength: 'dkhPerMlPer100L', dose: 'dailyDoseMl', s: 0.0533, from: 9, to: 11 },
    calcium: { strength: 'caPpmPerMlPer100L', dose: 'calciumDoseMl', s: 0.36, from: 9, to: 12 },
    magnesium: { strength: 'mgPpmPerMlPer100L', dose: 'magDoseMl', s: 0.024, from: 8, to: 11 },
  };
  const TE = L.todayStr();
  let bad = 0, checked = 0;

  const speak = (key, { ago, vals, now }) => {
    const c = ELEMENTS[key];
    const def = L.PARAM_DEFS.find((d) => d.key === key);
    const S = { ...L.DEFAULT_SETTINGS, volumeL: 77, [c.strength]: c.s, [c.dose]: c.to };
    const readings = vals.map((v, i) =>
      ({ param: key, date: L.addDays(TE, -((vals.length - i) * 2)), time: '20:00',
         value: Math.round(v * 1000) / 1000 }));
    const doseLog = [
      { element: key, date: L.addDays(TE, -ago - 3), time: '21:00', ml: c.from },
      { element: key, date: L.addDays(TE, -ago), time: '21:00', ml: c.to },
    ];
    const st = L.deriveTankState({ readings, icps: [], paramDefs: L.PARAM_DEFS, settings: S,
      doseLog, waterChanges: [], corrections: [], correctionPlans: {} });
    const ds = st.doseStates.find((x) => x && x.key === key);
    const prev = vals[vals.length - 1];
    return L.readingVerdict(def, { value: now, prev, delta: now - prev,
      status: L.paramStatus(def, now), doseState: ds });
  };

  for (const key of Object.keys(ELEMENTS)) {
    const def = L.PARAM_DEFS.find((d) => d.key === key);
    const span = def.max - def.min;
    const CASES = [
      ['still below on day one', { ago: 1, vals: [def.min - span * 0.3, def.min - span * 0.28], now: def.min - span * 0.25 }, /too early/i],
      ['overshot on day three', { ago: 3, vals: [def.min, def.min + span * 0.6, def.max + span * 0.2], now: def.max + span * 0.6 }, /overshoot/i],
      /* Any of the three wrong-direction outcomes. Which one fires depends on
         whether the engine can compute what the tank uses, and three days
         after a change it usually cannot. */
      ['wrong way on day three', { ago: 3, vals: [def.min + span * 0.6, def.min + span * 0.3, def.min], now: def.min - span * 0.3 }, /wrong way|did not go far enough|still falling|still rising/i],
      ['not moved, long after', { ago: 40, vals: [def.min - span * 0.3, def.min - span * 0.3, def.min - span * 0.3], now: def.min - span * 0.3 }, /has not moved|held at/i],
    ];
    for (const [label, setup, pattern] of CASES) {
      const v = speak(key, setup);
      checked++;
      const text = `${v.headline} ${v.line}`;
      if (!pattern.test(text)) {
        console.log(`  FAIL ${key}, ${label}: "${v.headline}"`); bad++;
      }
      if (/undefined|NaN|Infinity/.test(text)) {
        console.log(`  FAIL ${key}, ${label}: broken text`); bad++;
      }
    }
    /* Whatever the element, SOMETHING about the dose change must be said. */
    checked++;
    const v = speak(key, { ago: 3, vals: [def.min, def.min + span * 0.6, def.max + span * 0.2], now: def.max + span * 0.6 });
    if (!/mL a day|changed the dose/i.test(`${v.headline} ${v.line}`)) {
      console.log(`  FAIL ${key}: an overshoot never names the dose`); bad++;
    }
  }
  console.log(`  dose-change messages on all three elements: ${checked} checks, ${bad} failures`);
  if (bad) process.exit(1);
}

/* A change that did not go far enough is not "something else is at work".
 *
 * Lowering 13 mL to 11 on a tank that uses 0.62 dKH a day still supplies 0.76.
 * The level goes on rising with nothing else involved — and the app told the
 * keeper to check whether a skimmer, reactor or water-change habit had
 * altered. That sends someone hunting for a problem that is arithmetic.
 *
 * Three outcomes now. Where the engine knows what the tank uses it says
 * plainly whether the change was big enough. Where it does not — which is
 * common right after a change, because the fit needs readings on the NEW dose
 * — it says so, and names both possibilities in the order worth checking.
 * Guessing was the bug.
 */
{
  const wwDef = L.PARAM_DEFS.find((d) => d.key === 'alkalinity');
  const TW = L.todayStr();
  let bad = 0, checked = 0;

  const after = ({ from, to, vals, now }) => {
    const S = { ...L.DEFAULT_SETTINGS, volumeL: 77, dkhPerMlPer100L: 0.0533, dailyDoseMl: to };
    const readings = vals.map((v, i) =>
      ({ param: 'alkalinity', date: L.addDays(TW, -(vals.length - i) * 2), time: '20:00', value: v }));
    const doseLog = [
      { element: 'alkalinity', date: L.addDays(TW, -9), time: '21:00', ml: from },
      { element: 'alkalinity', date: L.addDays(TW, -2), time: '21:00', ml: to },
    ];
    const st = L.deriveTankState({ readings, icps: [], paramDefs: L.PARAM_DEFS, settings: S,
      doseLog, waterChanges: [], corrections: [], correctionPlans: {} });
    const ds = st.doseStates.find((x) => x && x.key === 'alkalinity');
    const prev = vals[vals.length - 1];
    return { ds, v: L.readingVerdict(wwDef, { value: now, prev, delta: now - prev,
      status: L.paramStatus(wwDef, now), doseState: ds }) };
  };

  /* Lowered, still rising. Whichever branch fires, it must NOT assert an
     external cause unless the engine actually knows the dose is on the right
     side of consumption. */
  {
    const { ds, v } = after({ from: 13, to: 11, vals: [9.5, 9.9, 10.1, 10.32], now: 10.5 });
    checked++;
    /* Naming an external cause as ONE possibility is fine; asserting it as THE
       cause is not. The honest message says "either the change was too small
       or something else is at work" and an earlier version of this check
       flagged it for containing the phrase at all. */
    const knows = ds.maintenanceNow != null;
    const hedged = /not yet enough|too small|likelier|either/i.test(v.line);
    const blamesOutside = /skimmer|reactor|something else is at work/i.test(v.line) && !hedged;
    if (blamesOutside && !knows) {
      console.log(`  FAIL blamed an external cause without knowing what the tank uses — "${v.headline}"`);
      bad++;
    }
    if (!/mL a day/.test(v.line)) {
      console.log('  FAIL the wrong-direction message never names the dose'); bad++;
    }
    /* And it must not claim certainty it does not have. */
    if (!knows && !/not yet enough|too small|likelier/i.test(v.line)) {
      console.log(`  FAIL asserted a cause the engine cannot distinguish — "${v.line.slice(0, 70)}"`);
      bad++;
    }
  }

  /* The engine exposes what it knows, so the branch can be chosen honestly. */
  {
    checked++;
    const { ds } = after({ from: 13, to: 11, vals: [9.5, 9.9, 10.1, 10.32], now: 10.5 });
    if (!('maintenanceNow' in ds)) {
      console.log('  FAIL the dose state no longer carries what the tank uses');
      bad++;
    }
  }
  console.log(`  a small change is not blamed on the skimmer: ${checked} checks, ${bad} failures`);
  if (bad) process.exit(1);
}

/* Adjusting the dose faster than the element can answer.
 *
 * Three changes in five days on alkalinity, which settles in two, is the
 * oscillation the whole bracketing system exists to prevent — and nothing
 * anywhere mentioned it. Not the headline, not the findings, not the wizard.
 * The app would say "too early to tell" for the third time in a week without
 * noticing it was the third time.
 *
 * Found by replaying a fortnight of use rather than testing snapshots: every
 * individual message was correct, and the sequence was not.
 */
{
  const rcDef = L.PARAM_DEFS.find((d) => d.key === 'alkalinity');
  const TR = L.todayStr();
  let bad = 0, checked = 0;

  const withChanges = (ages, doses) => {
    const S = { ...L.DEFAULT_SETTINGS, volumeL: 77, dkhPerMlPer100L: 0.0533, dailyDoseMl: doses[doses.length - 1] };
    const readings = [8.4, 8.5, 8.6, 8.7].map((v, i) =>
      ({ param: 'alkalinity', date: L.addDays(TR, -(4 - i)), time: '20:00', value: v }));
    const doseLog = ages.map((age, i) =>
      ({ element: 'alkalinity', date: L.addDays(TR, -age), time: '21:00', ml: doses[i] }));
    const st = L.deriveTankState({ readings, icps: [], paramDefs: L.PARAM_DEFS, settings: S,
      doseLog, waterChanges: [], corrections: [], correctionPlans: {} });
    const ds = st.doseStates.find((x) => x && x.key === 'alkalinity');
    return { ds, v: L.readingVerdict(rcDef, { value: 8.9, prev: 8.7, delta: 0.2,
      status: L.paramStatus(rcDef, 8.9), doseState: ds }) };
  };

  /* Three inside two settle windows must be called out. */
  {
    const { ds, v } = withChanges([5, 3, 1], [10, 11, 13]);
    checked++;
    if (ds.recentChanges !== 3) {
      console.log(`  FAIL counted ${ds.recentChanges} recent changes, expected 3`); bad++;
    }
    if (!/dose changes in \d+ days/i.test(v.headline)) {
      console.log(`  FAIL three changes in five days went unmentioned — "${v.headline}"`); bad++;
    }
    /* And it must say what to do, not merely observe. */
    if (!/leave it alone|pick a dose/i.test(v.line)) {
      console.log('  FAIL flagged the churn without saying what to do instead'); bad++;
    }
  }

  /* One or two must NOT trigger it — adjusting twice is normal. */
  for (const [label, ages, doses] of [
    ['a single change', [3], [13]],
    ['two changes', [3, 1], [11, 13]],
  ]) {
    const { v } = withChanges(ages, doses);
    checked++;
    if (/dose changes in \d+ days/i.test(v.headline)) {
      console.log(`  FAIL ${label} was treated as churn — "${v.headline}"`); bad++;
    }
  }

  /* Changes long ago must not count toward it. */
  {
    const { ds } = withChanges([60, 40, 1], [10, 11, 13]);
    checked++;
    if (ds.recentChanges !== 1) {
      console.log(`  FAIL old changes counted as recent: ${ds.recentChanges}`); bad++;
    }
  }
  console.log(`  churn is noticed, ordinary adjustment is not: ${checked} checks, ${bad} failures`);
  if (bad) process.exit(1);
}

/* A level being HELD out of band is not a level that is stuck.
 *
 * Replaying a correction that was started and then cancelled: 15 mL pushed
 * alkalinity to 10.12, the dose went back to 9, and 9 holds it there exactly.
 * The app said "7 days at 9.00 mL a day and it has not moved — either the dose
 * needs to go further or the solution strength is wrong".
 *
 * Both halves wrong. The dose matches consumption precisely, which is why the
 * level is not moving; and for a level ABOVE the band, "go further" points the
 * wrong way. A daily dose cannot move a level, only hold one — moving it is a
 * correction, and that is what should have been said.
 *
 * The same replay found the overshoot message saying "past the top of your
 * range" for a level that had gone under the bottom, then explaining that the
 * dose was "more than the tank needs" while the keeper looked at a reading
 * below their floor.
 */
{
  const hDef = L.PARAM_DEFS.find((d) => d.key === 'alkalinity');
  const TH = L.todayStr();
  let bad = 0, checked = 0;

  const after = ({ from, to, vals }) => {
    const S = { ...L.DEFAULT_SETTINGS, volumeL: 77, dkhPerMlPer100L: 0.0533, dailyDoseMl: to };
    const readings = vals.map((v, i) =>
      ({ param: 'alkalinity', date: L.addDays(TH, -(vals.length - i) * 2), time: '20:00', value: v }));
    const doseLog = [
      { element: 'alkalinity', date: L.addDays(TH, -14), time: '21:00', ml: from },
      { element: 'alkalinity', date: L.addDays(TH, -7), time: '21:00', ml: to },
    ];
    const st = L.deriveTankState({ readings, icps: [], paramDefs: L.PARAM_DEFS, settings: S,
      doseLog, waterChanges: [], corrections: [], correctionPlans: {} });
    const ds = st.doseStates.find((x) => x && x.key === 'alkalinity');
    const last = vals[vals.length - 1];
    return { ds, v: L.readingVerdict(hDef, { value: last, prev: vals[vals.length - 2],
      delta: 0, status: L.paramStatus(hDef, last), doseState: ds }) };
  };

  /* Held above after a cancelled correction: matched dose, level parked high. */
  {
    const { ds, v } = after({ from: 15, to: 9, vals: [10.11, 10.12, 10.12, 10.12] });
    checked++;
    const matched = ds.maintenanceNow != null && Math.abs(ds.maintenanceNow - ds.doseNow) / ds.doseNow <= 0.12;
    if (matched && /needs to go|solution strength/i.test(v.line)) {
      console.log(`  FAIL called a matched dose insufficient — "${v.headline}"`); bad++;
    }
    if (matched && !/holding|hold/i.test(v.line)) {
      console.log(`  FAIL did not explain that the dose is holding the level — "${v.line.slice(0, 60)}"`); bad++;
    }
    /* And it must point DOWN, not further up. */
    if (/higher|go further/i.test(v.line)) {
      console.log('  FAIL pointed upward for a level above the band'); bad++;
    }
  }

  /* An overshoot downward must say bottom, not top. */
  {
    const { v } = after({ from: 15, to: 4, vals: [9.4, 8.9, 8.4, 8.0] });
    checked++;
    if (/past the top/i.test(v.line)) {
      console.log(`  FAIL a downward overshoot said "past the top" — "${v.line.slice(0, 70)}"`); bad++;
    }
    if (/more than the tank needs/i.test(v.line)) {
      console.log('  FAIL said the dose was too high for a level below the band'); bad++;
    }
  }

  /* And an overshoot upward must still say top. */
  {
    const { v } = after({ from: 9, to: 18, vals: [8.6, 9.3, 9.9, 10.5] });
    checked++;
    if (!/past the top/i.test(v.line)) {
      console.log(`  FAIL an upward overshoot lost its direction — "${v.line.slice(0, 70)}"`); bad++;
    }
  }
  console.log(`  held is not stuck, and overshoot names its end: ${checked} checks, ${bad} failures`);
  if (bad) process.exit(1);
}
