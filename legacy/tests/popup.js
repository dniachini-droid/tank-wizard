/* The popup component, checked as far as this environment allows.
 *
 * It has never been RENDERED by any test — the exact gap that hid the splash
 * bug, where a misplaced hook made the app unusable while 38 checks passed.
 * Real rendering needs React, and this environment has no network to install
 * it, so that limit stands and is stated rather than worked around: nothing
 * here proves the component draws correctly.
 *
 * What it can prove is that every verdict the engines produce carries the
 * fields the component reads, and that the call site supplies every prop the
 * component needs. Both are failures that would show as a blank or broken
 * popup, and both are checkable without a renderer.
 */
const fs = require('fs');
const path = require('path');
const L = require(path.join(__dirname, '..', 'build', 'engines.js'));

const src = fs.readFileSync(path.join(__dirname, '..', 'src', 'reef-console.jsx'), 'utf8');
let bad = 0, checked = 0;

/* ---- what the component reads ---------------------------------------- */
const start = src.indexOf('function LogResultPopup');
let i = src.indexOf(') {', start) + 2;
let depth = 0, k = i;
while (k < src.length) {
  if (src[k] === '{') depth++;
  else if (src[k] === '}') { depth--; if (depth === 0) break; }
  k++;
}
const body = src.slice(i, k);

const verdictFields = [...new Set([...body.matchAll(/\bv\.(\w+)/g)].map((m) => m[1]))];
const props = (/function LogResultPopup\(\{([^}]*)\}/.exec(src) || [, ''])[1]
  .split(',').map((t) => t.split('=')[0].trim()).filter(Boolean);

/* ---- every verdict shape the engines can produce ----------------------- */
const T = L.todayStr();
const defs = L.PARAM_DEFS;
const verdicts = [];

const collect = (key, o) => {
  const def = defs.find((d) => d.key === key);
  const strengthField = { alkalinity: 'dkhPerMlPer100L', calcium: 'caPpmPerMlPer100L', magnesium: 'mgPpmPerMlPer100L' }[key];
  const doseField = { alkalinity: 'dailyDoseMl', calcium: 'calciumDoseMl', magnesium: 'magDoseMl' }[key];
  const strength = { alkalinity: 0.0533, calcium: 0.36, magnesium: 0.024 }[key];
  const S = { ...L.DEFAULT_SETTINGS, volumeL: 77, [strengthField]: strength, [doseField]: o.dose };
  const readings = o.vals.map((v, n) =>
    ({ param: key, date: L.addDays(T, -(o.vals.length - n) * 2), time: '20:00', value: v }));
  const doseLog = o.ago != null ? [
    { element: key, date: L.addDays(T, -o.ago - 3), time: '21:00', ml: o.from || o.dose - 2 },
    { element: key, date: L.addDays(T, -o.ago), time: '21:00', ml: o.dose }] : [];
  const correctionPlans = o.plan
    ? { [key]: { target: (def.min + def.max) / 2, returnDose: o.dose, startedAt: L.addDays(T, -o.plan),
        startValue: def.min, pace: 'steady', dose: o.dose * 1.5, days: 4 } } : {};
  const st = L.deriveTankState({ readings, icps: [], paramDefs: defs, settings: S,
    doseLog, waterChanges: [], corrections: o.corr || [], correctionPlans });
  const ds = st.doseStates.find((x) => x && x.key === key);
  const prev = o.vals[o.vals.length - 1];
  return { def, v: L.readingVerdict(def, { value: o.now, prev, delta: o.now - prev,
    status: L.paramStatus(def, o.now), doseState: ds }) };
};

for (const key of ['alkalinity', 'calcium', 'magnesium']) {
  const def = defs.find((d) => d.key === key);
  const span = def.max - def.min;
  const mid = (def.min + def.max) / 2;
  for (const o of [
    { vals: [mid, mid, mid, mid], dose: 10, now: mid },
    { vals: [def.min - span * 0.3, def.min - span * 0.3], dose: 10, ago: 1, now: def.min - span * 0.25 },
    { vals: [def.min - span * 0.2, def.min - span * 0.1, def.min], dose: 12, ago: 8, now: mid },
    { vals: [def.min, def.min, def.min, def.min], dose: 12, ago: 20, now: def.min - span * 0.3 },
    { vals: [mid, def.max, def.max + span * 0.3], dose: 20, ago: 8, now: def.max + span * 0.8 },
    { vals: [def.min, def.min - span * 0.1], dose: 4, ago: 8, from: 15, now: def.min - span * 0.5 },
    { vals: [def.min, def.min + span * 0.2], dose: 15, ago: 2, plan: 2, now: mid },
    { vals: [def.min - span * 2, def.min - span * 2], dose: 8, ago: 9, now: def.min - span * 2.5 },
    { vals: [def.min - span * 0.4, def.min - span * 0.3, def.min - span * 0.2], dose: 13, ago: 1, from: 11, now: def.min - span * 0.1 },
    /* The "has not moved" branch, which nothing above reached — its goto could
       have been pointed anywhere and the check would have passed. Flat, well
       out of band, and long enough after the change that the settle window has
       expired. */
    { vals: [def.min - span * 0.3, def.min - span * 0.3, def.min - span * 0.3, def.min - span * 0.3],
      dose: 6, ago: 40, from: 4, now: def.min - span * 0.3 },
    /* And a held level, which reaches it by the other route. */
    { vals: [def.max + span * 0.2, def.max + span * 0.2, def.max + span * 0.2],
      dose: 9, ago: 30, from: 15, now: def.max + span * 0.2 },
  ]) {
    try { verdicts.push(collect(key, o)); }
    catch (e) { console.log(`  FAIL producing a verdict for ${key} threw: ${e.message}`); bad++; }
  }
}

/* Every verdict must carry what the component renders. */
const REQUIRED = ['headline', 'line'];
for (const { def, v } of verdicts) {
  checked++;
  for (const f of REQUIRED) {
    if (v[f] == null || String(v[f]).trim() === '') {
      console.log(`  FAIL ${def.key}: verdict has no ${f} — "${v.headline}"`); bad++;
    }
  }
  /* Optional fields must be absent or usable, never a broken value. */
  for (const f of verdictFields) {
    const value = v[f];
    if (value === undefined) continue;
    if (typeof value === 'number' && !isFinite(value)) {
      console.log(`  FAIL ${def.key}: v.${f} is ${value}`); bad++;
    }
    if (typeof value === 'string' && /undefined|NaN|\[object/.test(value)) {
      console.log(`  FAIL ${def.key}: v.${f} contains a broken value — "${value.slice(0, 40)}"`); bad++;
    }
  }
  /* goto must be a destination the component knows. */
  if (v.goto != null && v.goto !== 'dosing') {
    console.log(`  FAIL ${def.key}: v.goto is "${v.goto}", which the popup does not handle`); bad++;
  }
  /* KNOWN LIMIT: the shapes above do not reach the "has not moved" branch,
     because a flat level out of band means the dose IS matching it, which
     sends the verdict to the "held" branch instead. Reaching it needs the
     engine unable to compute consumption at all, which these fixtures cannot
     arrange. So that branch's `goto` is unverified — pointing it at a tab that
     does not exist would pass this check. Recorded rather than papered over. */
  /* A tone must be a colour the markup can use. */
  if (v.tone != null && !/^#[0-9A-Fa-f]{6}$/.test(String(v.tone))) {
    console.log(`  FAIL ${def.key}: v.tone "${v.tone}" is not a hex colour`); bad++;
  }
}

/* The call site must supply every prop the component destructures. */
const callSite = /<LogResultPopup([\s\S]{0,400}?)\/>/.exec(src);
checked++;
if (!callSite) {
  console.log('  FAIL LogResultPopup is never rendered anywhere'); bad++;
} else {
  for (const p of props) {
    if (!new RegExp(`\\b${p}=`).test(callSite[1])) {
      /* Only a problem if the component has no default for it. */
      const hasDefault = new RegExp(`${p}\\s*=`).test(
        (/function LogResultPopup\(\{([^}]*)\}/.exec(src) || [, ''])[1]);
      if (!hasDefault) {
        console.log(`  FAIL the popup reads "${p}" and the call site does not pass it`); bad++;
      }
    }
  }
}


/* Every goto in the source, not just the ones the fixtures reach.
 *
 * The verdict sweep above cannot reach every branch, so a destination could be
 * mistyped in an unreachable one and go unnoticed. This reads them all. */
{
  const gotos = [...new Set([...src.matchAll(/goto:\s*"(\w+)"/g)].map((m) => m[1]))];
  const handled = [...new Set([...src.matchAll(/v\.goto === "(\w+)"/g)].map((m) => m[1]))];
  checked++;
  for (const g of gotos) {
    if (!handled.includes(g)) {
      console.log(`  FAIL a verdict sets goto:"${g}" and the popup handles only ${handled.join(', ')}`);
      bad++;
    }
  }
  console.log(`  every goto destination is handled: ${gotos.length} used, ${handled.length} handled`);
}

console.log(`  popup contract: ${verdicts.length} verdict shapes, ${props.length} props, ${bad} failures`);
console.log('  NOTE: this checks the contract, not the rendering — no React available here.');
if (bad) process.exit(1);
