/* Every dose state, against every position a reading can land in.
 *
 * The two overlap bugs found earlier came from two combinations of state and
 * reading. There are sixty-odd, and nothing was walking them.
 *
 * Building this found something else: four states — worked, fell-short,
 * overshot and due — were never reached by 4,000 randomly generated tanks.
 * They are not dead. They live behind `plan`, the STAGED dose plan, which is a
 * separate feature from correction plans and which no sweep in the repo ever
 * supplied. A quarter of the wizard's vocabulary was outside every simulation.
 */
const path = require('path');
const L = require(path.join(__dirname, '..', 'build', 'engines.js'));

const T = L.todayStr();
const defs = L.PARAM_DEFS;
let bad = 0, checked = 0;
const reached = new Set();

/* Reading positions: outside the safe bounds both ways, outside the band both
   ways, and dead centre. */
const positions = (def) => {
  const span = def.max - def.min;
  return [
    ['far below', def.min - span * 1.5],
    ['just below', def.min - span * 0.2],
    ['in band', (def.min + def.max) / 2],
    ['just above', def.max + span * 0.2],
    ['far above', def.max + span * 1.5],
  ];
};

const tank = (key, o) => {
  const def = defs.find((d) => d.key === key);
  const strengthField = { alkalinity: 'dkhPerMlPer100L', calcium: 'caPpmPerMlPer100L', magnesium: 'mgPpmPerMlPer100L' }[key];
  const doseField = { alkalinity: 'dailyDoseMl', calcium: 'calciumDoseMl', magnesium: 'magDoseMl' }[key];
  const strength = { alkalinity: 0.0533, calcium: 0.36, magnesium: 0.024 }[key];
  const S = { ...L.DEFAULT_SETTINGS, volumeL: 77,
    [strengthField]: o.strength != null ? o.strength : strength,
    [doseField]: o.dose };
  const readings = o.vals.map((v, i) =>
    ({ param: key, date: L.addDays(T, -(o.vals.length - i) * (o.gap || 2)), time: '20:00', value: v }));
  for (const k of defs.map((d) => d.key)) {
    if (k === key || k === 'ammonia') continue;
    const d = defs.find((x) => x.key === k);
    for (let j = 8; j > 0; j--) readings.push({ param: k, date: L.addDays(T, -j * 2), time: '20:00', value: (d.min + d.max) / 2 });
  }
  const doseLog = o.ago != null
    ? [{ element: key, date: L.addDays(T, -o.ago - 3), time: '21:00', ml: o.from || 9 },
       { element: key, date: L.addDays(T, -o.ago), time: '21:00', ml: o.dose }]
    : [];
  const corrections = o.corr ? [{ id: 'c', element: key, date: L.addDays(T, -2), time: '12:00', ml: 20, direction: 'up' }] : [];
  const correctionPlans = o.plan
    ? { [key]: { target: (def.min + def.max) / 2, returnDose: 9, startedAt: L.addDays(T, -o.plan),
        startValue: def.min, pace: 'steady', dose: o.dose, days: o.planDays || 4 } }
    : {};
  /* A STAGED plan, which is what reaches worked / fell-short / overshot / due
     and which nothing else in the repo exercises. */
  const staged = o.staged
    ? { appliedDose: o.dose, stage: 1, stages: 2, target: o.stagedTarget || o.dose + 1,
        startedAt: L.addDays(T, -o.ago), appliedAt: L.addDays(T, -o.ago) }
    : null;
  const a = { alkalinity: L.assessAlkalinity, calcium: L.assessCalcium, magnesium: L.assessMagnesium }[key]({
    readings: readings.filter((r) => r.param === key), doseLog, waterChanges: [], corrections,
    settings: S, def, plan: staged, correctionPlans });
  return { def, st: L.doseStatus(a, def, T, S, null, doseLog, []), prev: o.vals[o.vals.length - 1] };
};

const SCENARIOS = [
  ['nothing happening', { vals: [9.0, 9.0, 9.0, 9.0], dose: 9 }],
  ['dose just changed', { vals: [9.0, 9.0], dose: 11, ago: 0 }],
  ['dose changed a week ago', { vals: [8.4, 8.5, 8.6, 8.7], dose: 11, ago: 7 }],
  ['far below the safe floor', { vals: [5.0, 5.0, 5.0, 5.0], dose: 9 }],
  ['a logged correction', { vals: [8.2, 8.3, 8.4, 8.5], dose: 11, ago: 5, corr: true }],
  ['a correction plan running', { vals: [8.2, 8.3, 8.4, 8.5], dose: 14, ago: 2, plan: 2 }],
  ['a correction plan overdue', { vals: [8.2, 8.3, 8.4, 8.5], dose: 14, ago: 20, plan: 20 }],
  ['a correction plan arrived', { vals: [8.2, 8.6, 8.9, 9.0], dose: 14, ago: 3, plan: 3 }],
  ['no dose configured', { vals: [9.0, 9.0], dose: 0, strength: 0 }],
  ['staged plan, it worked', { vals: [9.0, 9.0, 9.0, 9.0], dose: 11, ago: 5, staged: true }],
  ['staged plan, no test yet', { vals: [9.0], dose: 11, ago: 14, staged: true }],
  ['staged plan, overshot', { vals: [8.4, 9.2, 9.9, 10.5], dose: 16, ago: 8, staged: true }],
];

for (const key of ['alkalinity', 'calcium', 'magnesium']) {
  for (const [label, setup] of SCENARIOS) {
    let ctx;
    try { ctx = tank(key, setup); }
    catch (e) { console.log(`  FAIL ${key} / ${label}: deriving threw — ${e.message}`); bad++; continue; }
    const { def, st, prev } = ctx;
    if (!st) { console.log(`  FAIL ${key} / ${label}: no dose state`); bad++; continue; }
    reached.add(st.state);

    for (const [posLabel, value] of positions(def)) {
      checked++;
      let v;
      try {
        v = L.readingVerdict(def, { value, prev, delta: value - prev,
          status: L.paramStatus(def, value), doseState: st });
      } catch (e) {
        console.log(`  FAIL ${key} / ${label} / ${posLabel}: readingVerdict threw — ${e.message}`); bad++; continue;
      }
      const text = `${v.headline} ${v.line}`;
      if (/undefined|NaN|Infinity|\[object/.test(text)) {
        console.log(`  FAIL ${key} / ${label} / ${posLabel}: broken text — ${text.slice(0, 60)}`); bad++;
      }
      /* Never tell someone to hold while the wizard asks for a change. */
      if (/hold it here/i.test(text) && /could change|needs a test|is due/i.test(st.headline)) {
        console.log(`  FAIL ${key} / ${label} / ${posLabel}: told them to hold against "${st.headline}"`); bad++;
      }
      /* Never credit the daily dose while a correction is running. */
      if (/dose change is working/i.test(text) && /on its way|correction/i.test(st.headline)) {
        console.log(`  FAIL ${key} / ${label} / ${posLabel}: credited the dose during a correction`); bad++;
      }
      /* A dangerous level must never read as reassurance. */
      const bounds = L.SAFE_BOUNDS[key];
      if (bounds && (value < bounds.min || value > bounds.max)
          && /nothing to do|dead centre|rock steady|working/i.test(text)) {
        console.log(`  FAIL ${key} / ${label} / ${posLabel}: reassuring text at a dangerous level — "${v.headline}"`); bad++;
      }
    }
  }
}

console.log(`  state x reading matrix: ${checked} combinations, ${reached.size} states reached, ${bad} failures`);
if (bad) process.exit(1);

/* The window's OWN voice must not contradict the wizard either.
 *
 * The overlap rules built for the dose-change messages guarded one phrase:
 * "hold it here". The generic wording underneath them was never checked, and
 * it says "nothing to do" — which, against a wizard asking for a dose change,
 * is the same contradiction in older words. 22 of 500 swept tanks had exactly
 * that pair on screen at once.
 *
 * The level being dead centre is a fact and stays. "Nothing to do" is an
 * instruction, and the instruction is not the window's to give when the engine
 * disagrees.
 */
{
  const { makeRng } = require(path.join(__dirname, 'sim', 'rng.js'));
  const TV = L.todayStr();
  let bad = 0, seen = 0;

  for (let seed = 1; seed <= 500; seed++) {
    const rnd = makeRng(seed * 17 + 5);
    const key = ['alkalinity', 'calcium', 'magnesium'][seed % 3];
    const def = defs.find((d) => d.key === key);
    const span = def.max - def.min;
    const strengthField = { alkalinity: 'dkhPerMlPer100L', calcium: 'caPpmPerMlPer100L', magnesium: 'mgPpmPerMlPer100L' }[key];
    const doseField = { alkalinity: 'dailyDoseMl', calcium: 'calciumDoseMl', magnesium: 'magDoseMl' }[key];
    const strength = { alkalinity: 0.0533, calcium: 0.36, magnesium: 0.024 }[key];
    const dose = Math.round((4 + rnd() * 20) * 10) / 10;
    const S = { ...L.DEFAULT_SETTINGS, volumeL: 77, [strengthField]: strength, [doseField]: dose };

    const readings = [];
    let v0 = def.min + span * (rnd() * 1.4 - 0.2);
    const count = 3 + Math.floor(rnd() * 5);
    for (let j = count; j > 0; j--) {
      v0 += span * (rnd() - 0.45) * 0.25;
      readings.push({ param: key, date: L.addDays(TV, -j * 2), time: '20:00', value: Math.round(v0 * 1000) / 1000 });
    }
    const doseLog = rnd() < 0.5
      ? [{ element: key, date: L.addDays(TV, -Math.floor(rnd() * 30)), time: '21:00', ml: dose }] : [];

    let st;
    try { st = L.deriveTankState({ readings, icps: [], paramDefs: defs, settings: S,
      doseLog, waterChanges: [], corrections: [], correctionPlans: {} }); }
    catch (e) { continue; }
    const ds = st.doseStates.find((x) => x && x.key === key);
    if (!ds) continue;
    const last = readings[readings.length - 1];
    const prev = readings[readings.length - 2];
    let v;
    try { v = L.readingVerdict(def, { value: last.value, prev: prev.value,
      delta: last.value - prev.value, status: L.paramStatus(def, last.value), doseState: ds }); }
    catch (e) { continue; }
    seen++;

    const wizardWants = /could change|needs a test|is due|needs more/i.test(`${ds.headline} ${ds.detail}`);
    const windowSaysFine = /nothing to do|nothing needs|boring kind of good|no action/i.test(`${v.headline} ${v.line}`);
    if (wizardWants && windowSaysFine) {
      bad++;
      if (bad <= 3) {
        console.log(`  FAIL ${key}: window "${v.headline}" against wizard "${ds.headline.slice(0, 40)}"`);
      }
    }
  }
  console.log(`  the window's own voice defers too: ${seen} tanks, ${bad} contradictions`);
  if (bad) process.exit(1);
}
