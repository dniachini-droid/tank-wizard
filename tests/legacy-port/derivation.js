/* One derivation, and it must stay the only one.
 *
 * Derivation used to be split: the app root computed the findings and the
 * three dosing assessments, the Dashboard separately computed the overview,
 * the briefing and the score working, and computeStability was called from six
 * places. Nothing forced those to agree, and twice they did not — two
 * dismissal systems writing different key formats into the same storage, and a
 * headline that declared the tank calm while the claims beneath it disagreed.
 *
 * deriveTankState computes everything once. This checks two things: that it
 * produces exactly what the separate calls produced, so the consolidation
 * changed no behaviour, and that it stays internally consistent.
 */
const path = require('path');
const L = require(path.join(__dirname, '..', '..', 'build', 'engines-new.cjs'));

const T = L.todayStr();
const defs = L.PARAM_DEFS;
let rnd = 20260812;
const rand = () => { rnd = (rnd * 1103515245 + 12345) % 2147483648; return rnd / 2147483648; };
const pick = (a) => a[Math.floor(rand() * a.length)];

let n = 0, bad = 0;
const RUNS = Number(process.env.DERIVE_RUNS || 500);

for (let i = 0; i < RUNS; i++) {
  const readings = [];
  for (const d of defs) {
    if (rand() < 0.15) continue;
    const w = d.max - d.min;
    const c = 2 + Math.floor(rand() * 10);
    const base = d.min + w * (rand() * 2.4 - 0.7);
    for (let j = c; j > 0; j--) {
      readings.push({ param: d.key, date: L.addDays(T, -j * pick([1, 2, 3, 7])),
        time: pick(['08:00', '20:00']),
        value: Math.round((base + (rand() - 0.5) * w * 0.4) * 100000) / 100000 });
    }
  }
  const settings = { ...L.DEFAULT_SETTINGS, volumeL: pick([77, 200, 800]) };

  /* The old path, called exactly as the app used to call it. */
  const latest = {};
  for (const d of defs) {
    const rows = readings.filter((x) => x.param === d.key).sort(L.byNewest);
    latest[d.key] = rows[0] || null;
  }
  let oldFindings, oldStates = [], oldOverview, oldBriefing;
  try {
    oldFindings = L.buildFindings({ readings, icps: [], paramDefs: defs, settings,
      doseLog: [], waterChanges: [], latestByParam: latest, kitChanges: {}, corrections: [] }).findings;
    for (const k of ['alkalinity', 'calcium', 'magnesium']) {
      const def = defs.find((d) => d.key === k);
      const fn = k === 'alkalinity' ? L.assessAlkalinity : k === 'calcium' ? L.assessCalcium : L.assessMagnesium;
      const a = fn({ readings, doseLog: [], waterChanges: [], settings, def, plan: undefined, corrections: [] });
      /* The same arguments deriveTankState uses. doseStatus now takes the
         latest reading per parameter, because the assessment's own window can
         be empty while the app still knows a perfectly good reading — calling
         it without that is comparing against a different function. */
      const st = L.doseStatus(a ? { ...a, def } : null, def, T, settings, latest);
      if (st) oldStates.push({ ...st, key: k, el: def.label.toLowerCase(), def });
    }
    oldOverview = L.buildOverview(readings, latest, defs, oldFindings, oldStates);
    oldBriefing = L.buildBriefing(readings, latest, defs, oldFindings, oldStates, { dismissed: {} });
  } catch (e) { continue; }

  let tank;
  try { tank = L.deriveTankState({ readings, icps: [], paramDefs: defs, settings }); }
  catch (e) { console.log(`  FAIL deriveTankState threw: ${e.message}`); bad++; continue; }
  n++;

  if (tank.overview.headline !== oldOverview.headline) {
    console.log(`  FAIL headline changed:\n    old ${oldOverview.headline}\n    new ${tank.overview.headline}`); bad++;
  }
  if (tank.overview.score !== oldOverview.score) {
    console.log(`  FAIL score changed: ${oldOverview.score} -> ${tank.overview.score}`); bad++;
  }
  if (tank.briefing.map((c) => c.id).join() !== oldBriefing.map((c) => c.id).join()) {
    console.log('  FAIL briefing claims changed'); bad++;
  }
  if (tank.briefing.map((c) => c.claim).join('|') !== oldBriefing.map((c) => c.claim).join('|')) {
    console.log('  FAIL briefing wording changed'); bad++;
  }
  if (tank.doseStates.map((d) => d.state).join() !== oldStates.map((d) => d.state).join()) {
    console.log('  FAIL dose states changed'); bad++;
  }

  /* Internal consistency: everything the object hands out must agree. */
  if (tank.findings.length + tank.dismissedList.length !== tank.allFindings.length) {
    console.log('  FAIL visible + dismissed does not equal all findings'); bad++;
  }
  for (const def of defs) {
    const rows = readings.filter((r) => r.param === def.key).sort(L.byNewest);
    const want = rows[0] || null;
    if ((tank.latestByParam[def.key] || null) !== want) {
      console.log(`  FAIL latest reading for ${def.key} disagrees`); bad++;
    }
  }
  if (tank.scoreExplained && tank.overview.score == null) {
    console.log('  FAIL score working exists without a score'); bad++;
  }
  if (tank.hiddenCount !== (tank.briefing.hiddenCount || 0)) {
    console.log('  FAIL hidden count disagrees with the briefing'); bad++;
  }
}

console.log(`  derivation: ${n} tanks, ${bad} differences from the separate calls`);
if (bad) process.exit(1);

/* Readings from a restored backup are not validated for type.
 *
 * The log form parses what you type and so does the edit form, but a backup is
 * JSON straight from a file — the inspector checks its shape and never the
 * type of a value. A hand-edited export, or one written by another tool, can
 * put the string "8.9" into a reading. That threw on the first toFixed and
 * took the whole screen with it; and because the bad value is then saved, it
 * would throw again on every load.
 */
{
  const defs4 = L.PARAM_DEFS;
  const T4 = L.todayStr();
  const base = [];
  for (let j = 10; j > 0; j--) base.push({ param: 'alkalinity', date: L.addDays(T4, -j * 2), time: '20:00', value: 9.0 });
  for (const k of ['calcium', 'magnesium', 'nitrate', 'phosphate', 'ph']) {
    const d = defs4.find((x) => x.key === k);
    for (let j = 10; j > 0; j--) base.push({ param: k, date: L.addDays(T4, -j * 2), time: '20:00', value: (d.min + d.max) / 2 });
  }
  const settings4 = { ...L.DEFAULT_SETTINGS, volumeL: 77 };
  const BAD = [
    ['string value', { param: 'alkalinity', date: T4, time: '20:00', value: '8.9' }],
    ['string with units', { param: 'alkalinity', date: T4, time: '20:00', value: '8.9 dKH' }],
    ['null value', { param: 'alkalinity', date: T4, time: '20:00', value: null }],
    ['missing value', { param: 'alkalinity', date: T4, time: '20:00' }],
    ['empty string', { param: 'alkalinity', date: T4, time: '20:00', value: '' }],
    ['NaN value', { param: 'alkalinity', date: T4, time: '20:00', value: NaN }],
    ['a null entry', null],
    ['not an object', 42],
    ['an array', []],
  ];
  let bad = 0;
  for (const [label, entry] of BAD) {
    try {
      const st = L.deriveTankState({ readings: base.concat([entry]), icps: [], paramDefs: defs4, settings: settings4 });
      const text = String(st.overview.headline) + st.briefing.map((c) => c.claim + (c.support || '')).join(' ');
      if (/undefined|NaN|Infinity/.test(text)) { console.log(`  FAIL ${label} produced broken text`); bad++; }
      if (st.overview.score == null) { console.log(`  FAIL ${label} lost the score`); bad++; }
    } catch (e) {
      console.log(`  FAIL ${label} threw: ${e.message}`); bad++;
    }
  }
  /* A usable string value must still count, not be silently discarded. */
  const withString = L.deriveTankState({ readings: base.concat([
    { param: 'alkalinity', date: L.addDays(T4, 0), time: '21:00', value: '12.5' }]),
    icps: [], paramDefs: defs4, settings: settings4 });
  if (withString.latestByParam.alkalinity.value !== 12.5) {
    console.log('  FAIL a numeric string was not coerced and used'); bad++;
  }
  console.log(`  malformed readings: ${BAD.length + 1} shapes, ${bad} failures`);
  if (bad) process.exit(1);
}
