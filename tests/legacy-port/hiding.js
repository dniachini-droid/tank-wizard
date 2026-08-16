/* The hide engine, fuzzed.
 *
 * Reasoning about this case by case kept producing fixes that worked on one
 * snapshot and failed on the next. The properties below are what actually
 * matter, checked over random tanks and random hide sequences:
 *
 *   1. Hiding one claim must not change what any other claim says. The first
 *      version skipped hidden claims during construction, so a hidden claim
 *      never reserved its parameter and a different claim about the same
 *      parameter appeared in its place.
 *   2. Hiding a claim must remove exactly that claim.
 *   3. The reported hidden count must equal the number of claims actually
 *      suppressed — not a recount from a separately built list.
 *   4. Hiding must be stable: re-running with the same data and the same
 *      dismissals must give the same answer.
 *   5. Restoring everything must return the original list exactly.
 */
const path = require('path');
const L = require(path.join(__dirname, '..', '..', 'build', 'engines-new.cjs'));

/* The app ships no solution strengths — only the user's own bottle can say
   what a product delivers (docs/spec/reef-chemistry.md §16), and an unset
   strength is refused and named. These simulated tanks stand in for CONFIGURED
   tanks, so they state the strengths explicitly. The figures are the ones this
   harness used to inherit from DEFAULT_SETTINGS, so every expectation is
   unchanged. Cases that deliberately probe a missing or null strength set
   their own and are untouched. */
const TANK_STRENGTHS = { dkhPerMlPer100L: 0.0533, caPpmPerMlPer100L: 0.36, mgPpmPerMlPer100L: 0.024 };


const T = L.todayStr();
const defs = L.PARAM_DEFS;
let rnd = 987654;
const rand = () => { rnd = (rnd * 1103515245 + 12345) % 2147483648; return rnd / 2147483648; };
const pick = (a) => a[Math.floor(rand() * a.length)];

const problems = {};
const note = (k, d) => { (problems[k] = problems[k] || []).push(d); };

const RUNS = Number(process.env.HIDING_RUNS || 400);
let sequences = 0;

for (let i = 0; i < RUNS; i++) {
  const readings = [];
  for (const def of defs) {
    if (rand() < 0.12) continue;
    const n = 1 + Math.floor(rand() * 10);
    const w = def.max - def.min;
    const base = def.min + w * (rand() * 2.2 - 0.6);
    const drift = (rand() - 0.5) * w * pick([0, 0.2, 1.0]);
    for (let j = n; j > 0; j--) {
      readings.push({ param: def.key, date: L.addDays(T, -j * pick([1, 2, 3, 7])), time: '20:00',
        value: Math.round((base + drift * ((n - j) / n) + (rand() - 0.5) * w * 0.12) * 1000) / 1000 });
    }
  }
  const latest = {};
  for (const d of defs) {
    const r = readings.filter((x) => x.param === d.key).sort((a, b) => (a.date < b.date ? 1 : -1));
    latest[d.key] = r[0] || null;
  }
  const settings = { ...L.DEFAULT_SETTINGS, ...TANK_STRENGTHS, volumeL: pick([20, 77, 200, 800]) };

  let findings = [], states = [];
  try {
    findings = L.buildFindings({ readings, icps: [], paramDefs: defs, settings,
      doseLog: [], waterChanges: [], latestByParam: latest }).findings;
    for (const k of ['alkalinity', 'calcium', 'magnesium']) {
      const def = defs.find((d) => d.key === k);
      const fn = k === 'alkalinity' ? L.assessAlkalinity : k === 'calcium' ? L.assessCalcium : L.assessMagnesium;
      const a = fn({ readings, doseLog: [], waterChanges: [], corrections: [], settings, def });
      const st = L.doseStatus(a, def);
      if (st) states.push({ ...st, key: k, el: def.label.toLowerCase() });
    }
  } catch (e) { note('setup threw', e.message); continue; }

  const build = (hid) => L.buildBriefing(readings, latest, defs, findings, states, { dismissed: hid });

  const original = build({});
  const hid = {};
  let expectedHidden = 0;

  /* Hide up to four, one at a time, checking the invariants at every step. */
  for (let step = 0; step < 4; step++) {
    const before = build(hid);
    const target = before.find((c) => c.dismissible && c.dismissKey && !hid[c.dismissKey]);
    if (!target) break;
    sequences++;

    hid[target.dismissKey] = { at: T, sig: target.dismissSignature != null ? String(target.dismissSignature) : '' };
    expectedHidden++;
    const after = build(hid);

    /* 2. exactly that claim goes */
    if (after.some((c) => c.id === target.id)) {
      note('hidden claim still visible', `${target.id}`);
    }
    /* 1. nothing else changes */
    for (const c of before) {
      if (c.id === target.id) continue;
      const still = after.find((x) => x.id === c.id);
      if (!still) { note('hiding removed an unrelated claim', `${target.id} -> ${c.id}`); continue; }
      if (still.claim !== c.claim) {
        note('hiding changed another claim', `${target.id}: "${c.claim}" -> "${still.claim}"`);
      }
    }
    /* and nothing new appears */
    for (const c of after) {
      if (before.some((x) => x.id === c.id)) continue;
      /* "N of M are in range and holding" is the summary describing what is
         left, not a new problem surfacing. Hiding the last warning should
         leave the box saying something rather than empty, so this one is
         allowed to appear. */
      if (c.id === 'solid') continue;
      note('hiding revealed a new claim', `${target.id} -> ${c.id}`);
    }
    /* 3. the count is right */
    if ((after.hiddenCount || 0) !== expectedHidden) {
      note('hidden count wrong', `${after.hiddenCount} vs ${expectedHidden}`);
    }
    /* 4. stable */
    const again = build(hid);
    if (again.length !== after.length || again.map((c) => c.id).join() !== after.map((c) => c.id).join()) {
      note('unstable between identical builds', target.id);
    }
  }

  /* 5. restoring everything returns the original */
  const restored = build({});
  if (restored.map((c) => c.id).join() !== original.map((c) => c.id).join()) {
    note('restore did not return the original list', '');
  }
}

const keys = Object.keys(problems);
console.log(`  hiding: ${RUNS} tanks, ${sequences} hide steps, ${keys.length} properties violated`);
for (const k of keys) {
  console.log(`    ${k}: ${problems[k].length}`);
  problems[k].slice(0, 4).forEach((d) => console.log(`      ${d}`));
}
if (keys.length) process.exit(1);

/* Dismissal has to mean the same thing on every surface.
 *
 * A finding can be put away from the parameter modal, the Insights tab, or the
 * tank summary. Those used to write two different key formats against the same
 * storage — "id|title" against a bare date from the modal, a stable key
 * against a signature from the summary — so the same finding had two
 * identities and dismissing it in one place left it showing in the other.
 */
{
  const T2 = L.todayStr();
  const defs2 = L.PARAM_DEFS;
  let bad = 0, checked = 0;
  let rnd2 = 246810;
  const rand2 = () => { rnd2 = (rnd2 * 1103515245 + 12345) % 2147483648; return rnd2 / 2147483648; };

  for (let i = 0; i < 200; i++) {
    const readings = [];
    for (const d of defs2) {
      if (rand2() < 0.15) continue;
      const w = d.max - d.min;
      const base = d.min + w * (rand2() * 2.2 - 0.6);
      for (let j = 6; j > 0; j--) {
        readings.push({ param: d.key, date: L.addDays(T2, -j * 2), time: '20:00',
          value: Math.round((base + (rand2() - 0.5) * w * 0.5) * 1000) / 1000 });
      }
    }
    const latest = {};
    for (const d of defs2) {
      const r = readings.filter((x) => x.param === d.key).sort((a, b) => (a.date < b.date ? 1 : -1));
      latest[d.key] = r[0] || null;
    }
    const all = L.buildFindings({ readings, icps: [], paramDefs: defs2,
      settings: { ...L.DEFAULT_SETTINGS, ...TANK_STRENGTHS }, doseLog: [], waterChanges: [], latestByParam: latest }).findings;

    for (const f of all) {
      const claim = L.buildBriefing(readings, latest, defs2, all, [], {})
        .find((c) => c.id === 'finding:' + f.id);
      if (!claim || !claim.dismissible) continue;
      checked++;

      /* Dismissed from the modal — the summary must agree. */
      const dis = { [L.findingKey(f)]: { at: T2, sig: L.findingSignature(f), times: 1 } };
      if (!L.findingHidden(f, dis)) { console.log(`  FAIL modal did not hide ${f.id}`); bad++; }
      const after = L.buildBriefing(readings, latest, defs2, all, [], { dismissed: dis });
      if (after.some((c) => c.id === 'finding:' + f.id)) {
        console.log(`  FAIL summary still shows ${f.id} after it was dismissed elsewhere`); bad++;
      }
      if ((after.hiddenCount || 0) < 1) {
        console.log(`  FAIL summary did not count ${f.id} as hidden`); bad++;
      }
      /* And the reverse: the summary's own key must be the shared one. */
      if (claim.dismissKey !== L.findingKey(f)) {
        console.log(`  FAIL summary uses a different key for ${f.id}`); bad++;
      }
      break;
    }
  }
  console.log(`  cross-surface dismissal: ${checked} findings, ${bad} inconsistencies`);
  if (bad) process.exit(1);
}

/* Hiding everything must not strand the notes.
 *
 * The briefing returned null when it had no visible claims, which took the
 * "hidden notes" row with it — so hiding the last note removed the only route
 * back to any of them. Hiding all of them is exactly when that list has to
 * stay reachable. */
{
  const T2 = L.todayStr();
  const defs2 = L.PARAM_DEFS;
  let rnd2 = 777333, bad = 0, checked = 0;
  const rand2 = () => { rnd2 = (rnd2 * 1103515245 + 12345) % 2147483648; return rnd2 / 2147483648; };

  for (let i = 0; i < 200; i++) {
    const readings = [];
    for (const d of defs2) {
      if (rand2() < 0.2) continue;
      const w = d.max - d.min;
      const base = d.min + w * (rand2() * 2.2 - 0.6);
      for (let j = 6; j > 0; j--) {
        readings.push({ param: d.key, date: L.addDays(T2, -j * 2), time: '20:00',
          value: Math.round((base + (rand2() - 0.5) * w * 0.3) * 100000) / 100000 });
      }
    }
    const settings = { ...L.DEFAULT_SETTINGS, ...TANK_STRENGTHS, volumeL: 77 };
    const hid = {};
    let state;
    try { state = L.deriveTankState({ readings, icps: [], paramDefs: defs2, settings }); }
    catch (e) { continue; }
    if (!state.briefing.length) continue;
    checked++;

    /* Hide every dismissible claim. */
    for (let step = 0; step < 20; step++) {
      const t = state.briefing.find((c) => c.dismissible && !hid[c.dismissKey]);
      if (!t) break;
      hid[t.dismissKey] = { at: T2, sig: String(t.dismissSignature || ''), times: 1 };
      state = L.deriveTankState({ readings, icps: [], paramDefs: defs2, settings, dismissed: hid });
    }

    const hiddenList = state.briefing.hidden || [];
    if (hiddenList.length !== Object.keys(hid).length) {
      console.log(`  FAIL hidden list has ${hiddenList.length}, ${Object.keys(hid).length} were hidden`); bad++;
    }
    /* Every hidden note must be nameable and individually restorable. */
    for (const h of hiddenList) {
      if (!h.claim || !h.dismissKey) { console.log('  FAIL hidden note not restorable'); bad++; break; }
    }
    if (state.briefing.length === 0 && hiddenList.length === 0 && Object.keys(hid).length > 0) {
      console.log('  FAIL hiding everything stranded the notes'); bad++;
    }
    /* Restoring one brings back exactly one. */
    if (hiddenList.length) {
      const one = { ...hid };
      delete one[hiddenList[0].dismissKey];
      const after = L.deriveTankState({ readings, icps: [], paramDefs: defs2, settings, dismissed: one });
      if ((after.briefing.hidden || []).length !== hiddenList.length - 1) {
        console.log('  FAIL restoring one did not bring back exactly one'); bad++;
      }
    }
  }
  console.log(`  all-hidden recovery: ${checked} tanks, ${bad} failures`);
  if (bad) process.exit(1);
}

/* The snooze explanation is per element, not once for the app.
 *
 * The "it comes back after your next test" sheet was gated on a single global
 * flag, so seeing it once for calcium meant magnesium's suggestion was hidden
 * silently the first time. The promise being made is about that element's
 * tests, so each element earns its own first explanation. */
{
  const T2 = L.todayStr();
  const defs2 = L.PARAM_DEFS;
  const readings = [];
  /* Start each element near the top of its own band and walk it down, rather
     than hardcoding levels. The bands moved when calcium and magnesium were
     corrected against the hobby consensus, and fixed numbers put both outside
     their range from the first reading — the dose claim never appeared, so
     there was nothing to snooze. */
  const near = (k, frac) => {
    const d = L.PARAM_DEFS.find((x) => x.key === k);
    return d.min + (d.max - d.min) * frac;
  };
  for (const [k, start, drop] of [
    ['alkalinity', near('alkalinity', 0.9), 0.12],
    ['calcium', near('calcium', 0.9), 4],
    ['magnesium', near('magnesium', 0.9), 6],
  ]) {
    for (let j = 8; j > 0; j--) {
      readings.push({ param: k, date: L.addDays(T2, -j * 2), time: '20:00', value: start - drop * (8 - j) });
    }
  }
  for (const k of ['nitrate', 'phosphate', 'ph']) {
    const d = defs2.find((x) => x.key === k);
    for (let j = 8; j > 0; j--) {
      readings.push({ param: k, date: L.addDays(T2, -j * 2), time: '20:00', value: (d.min + d.max) / 2 });
    }
  }
  const settings = { ...L.DEFAULT_SETTINGS, ...TANK_STRENGTHS, volumeL: 77 };
  let dismissed = {};
  let bad = 0, shown = 0;

  for (const el of ['alkalinity', 'calcium', 'magnesium']) {
    const state = L.deriveTankState({ readings, icps: [], paramDefs: defs2, settings, dismissed });
    const c = state.briefing.find((x) => x.id === 'dose:' + el);
    if (!c || !c.snoozeUntilTest) continue;
    /* This mirrors the app's own test for whether to show the sheet. */
    const explained = !!dismissed['__snooze-explained|' + (c.dismissKey || '')];
    if (explained) { console.log(`  FAIL ${el} skipped its first explanation`); bad++; }
    else shown++;
    dismissed = {
      ...dismissed,
      [c.dismissKey]: { at: T2, sig: String(c.dismissSignature || ''), times: 1 },
      ['__snooze-explained|' + c.dismissKey]: T2,
    };
  }
  if (shown < 2) { console.log(`  FAIL only ${shown} elements offered the explanation`); bad++; }
  console.log(`  per-element snooze sheet: ${shown} elements explained, ${bad} failures`);
  if (bad) process.exit(1);
}
