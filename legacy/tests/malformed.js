/* Data the app itself can produce or accept, in shapes that broke it.
 *
 * Not arbitrary garbage — the point is inputs a real installation reaches:
 * its own backup format, its own storage, a device with a wrong clock, an
 * interrupted write. Six of the app's own record types crashed on shapes its
 * own backup file permits, because readings were coerced at the boundary and
 * nothing else was.
 */
const path = require('path');
const L = require(path.join(__dirname, '..', 'build', 'engines.js'));

const defs = L.PARAM_DEFS;
const T = L.todayStr();
const GOOD = { ...L.DEFAULT_SETTINGS, volumeL: 77, dkhPerMlPer100L: 0.0533, dailyDoseMl: 10 };

const base = [];
for (const d of defs) {
  if (d.key === 'ammonia') continue;
  for (let j = 10; j > 0; j--) {
    base.push({ param: d.key, date: L.addDays(T, -j * 2), time: '20:00', value: (d.min + d.max) / 2 });
  }
}

let bad = 0, checked = 0;
const attempt = (label, input) => {
  checked++;
  let st;
  try {
    st = L.deriveTankState({ readings: base, icps: [], paramDefs: defs, settings: GOOD, ...input });
  } catch (e) {
    console.log(`  FAIL ${label} threw: ${e.message}`); bad++; return;
  }
  const text = String(st.overview.headline)
    + st.briefing.map((c) => `${c.claim} ${c.support || ''}`).join(' ')
    + st.doseStates.map((d) => `${d.headline} ${d.detail}`).join(' ');
  if (/undefined|NaN|Infinity|\[object/.test(text)) {
    console.log(`  FAIL ${label} produced broken text: ${text.slice(0, 60)}`); bad++;
  }
  /* A future date reaching the wording shows up as a negative duration. */
  if (/-\d+ (day|hour|week|month)/.test(text)) {
    console.log(`  FAIL ${label} printed a negative duration`); bad++;
  }
  /* A tank with no usable readings has no score, and saying so is correct.
     Only demand one when there is something to score. */
  const usable = (st.analysed || []).length > 0;
  if (usable && st.overview.score == null) { console.log(`  FAIL ${label} lost the score`); bad++; }
};

/* Every list the app stores, in every shape a bad write or hand-edited export
   can leave behind. */
const SHAPES = [
  ['a null entry', [null]],
  ['an undefined entry', [undefined]],
  ['a string entry', ['x']],
  ['a number entry', [42]],
  ['a nested array', [[]]],
  ['not an array (string)', 'oops'],
  ['not an array (object)', {}],
  ['not an array (number)', 5],
  ['not an array (null)', null],
  ['empty', []],
];
for (const key of ['readings', 'doseLog', 'waterChanges', 'corrections', 'icps']) {
  for (const [label, value] of SHAPES) {
    /* readings replaces the base set rather than adding to it. */
    attempt(`${key}: ${label}`, key === 'readings' ? { readings: value } : { [key]: value });
  }
}

/* Settings. A default only applies when the key is absent; storage can hold an
   explicit null, which sails past it into the first property access. */
for (const [label, value] of [
  ['null', null], ['a string', 'x'], ['an array', []], ['absent', undefined],
  ['volumeL as a string', { ...GOOD, volumeL: '77' }],
  ['volumeL zero', { ...GOOD, volumeL: 0 }],
  ['volumeL negative', { ...GOOD, volumeL: -50 }],
  ['volumeL null', { ...GOOD, volumeL: null }],
  ['strength as a string', { ...GOOD, dkhPerMlPer100L: '0.0533' }],
  ['strength zero', { ...GOOD, dkhPerMlPer100L: 0 }],
  ['strength negative', { ...GOOD, dkhPerMlPer100L: -1 }],
  ['testKits as a string', { ...GOOD, testKits: 'hanna' }],
  ['testKits naming an unknown brand', { ...GOOD, testKits: { alkalinity: 'nope' } }],
]) attempt(`settings ${label}`, { settings: value });

/* Correction plans are stored as JSON and come back as whatever was written. */
for (const [label, value] of [
  ['null', null], ['a string', 'x'], ['an array', []],
  ['a plan that is a string', { alkalinity: 'x' }],
  ['no target', { alkalinity: { returnDose: 9, startedAt: T, startValue: 8 } }],
  ['target as a string', { alkalinity: { target: '9', returnDose: 9, startedAt: T, startValue: 8 } }],
  ['returnDose as a string', { alkalinity: { target: 9, returnDose: '9', startedAt: T, startValue: 8 } }],
  ['startedAt not a date', { alkalinity: { target: 9, returnDose: 9, startedAt: 'nope', startValue: 8 } }],
  ['for an element that does not exist', { unobtainium: { target: 9, returnDose: 9, startedAt: T, startValue: 8 } }],
]) attempt(`correction plan ${label}`, { correctionPlans: value });

/* A device with the wrong clock, and histories a real tank produces. */
const mk = (offsets, v = 9.0) => offsets.map((o) =>
  ({ param: 'alkalinity', date: L.addDays(T, o), time: '20:00', value: v }));
const withRest = (rows) => {
  const r = [...rows];
  for (const d of defs) {
    if (d.key === 'alkalinity' || d.key === 'ammonia') continue;
    for (let j = 8; j > 0; j--) r.push({ param: d.key, date: L.addDays(T, -j * 2), time: '20:00', value: (d.min + d.max) / 2 });
  }
  return r;
};
for (const [label, offsets] of [
  ['every reading in the future', [2, 4, 6, 8, 10]],
  ['half future, half past', [-6, -4, -2, 2, 4]],
  ['one reading years ahead', [-8, -6, -4, -2, 900]],
  ['one reading years behind', [-3000, -6, -4, -2, 0]],
  ['all on the same day', [-1, -1, -1, -1, -1]],
  ['a single reading', [-1]],
  ['none at all', []],
]) attempt(`clock: ${label}`, { readings: withRest(mk(offsets)) });

const past = withRest(mk([-8, -6, -4, -2, 0]));
attempt('clock: dose change dated ahead', { readings: past, doseLog: [{ element: 'alkalinity', date: L.addDays(T, 60), time: '21:00', ml: 12 }] });
attempt('clock: correction dated ahead', { readings: past, corrections: [{ id: 'c', element: 'alkalinity', date: L.addDays(T, 60), time: '12:00', ml: 15, direction: 'up' }] });
attempt('clock: water change dated ahead', { readings: past, waterChanges: [{ id: 'w', date: L.addDays(T, 20), litres: 12 }] });
attempt('clock: plan started in the future', { readings: past,
  correctionPlans: { alkalinity: { target: 9.5, returnDose: 10, startedAt: L.addDays(T, 45), startValue: 8.5, days: 5 } } });

console.log(`  malformed and skewed input: ${checked} shapes, ${bad} failures`);
if (bad) process.exit(1);

/* The remaining things read from storage: kit changes, dismissals and the
 * three dose plans. Each is its own key, so each can be null on its own after
 * an interrupted write — and a stored null passes the default straight into
 * the first property read, the same trap that caught settings.
 */
{
  let more = 0, seen = 0;
  const tryOne = (label, input) => {
    seen++;
    try {
      const st = L.deriveTankState({ readings: base, icps: [], paramDefs: defs, settings: GOOD, ...input });
      const text = String(st.overview.headline) + st.briefing.map((c) => `${c.claim} ${c.support || ''}`).join(' ');
      if (/undefined|NaN|Infinity/.test(text)) { console.log(`  FAIL ${label} produced broken text`); more++; }
    } catch (e) { console.log(`  FAIL ${label} threw: ${e.message}`); more++; }
  };
  for (const [label, v] of [['null', null], ['a string', 'x'], ['an array', []],
    ['a bad entry', { alkalinity: 'nope' }], ['a null entry', { alkalinity: [null] }]]) {
    tryOne(`kitChanges ${label}`, { kitChanges: v });
  }
  for (const [label, v] of [['null', null], ['a string', 'x'], ['an array', []]]) {
    tryOne(`dismissed ${label}`, { dismissed: v });
  }
  for (const [label, v] of [['null', null], ['a string', 'x'],
    ['one plan a string', { alk: 'x' }], ['one plan null', { alk: null } ]]) {
    tryOne(`plans ${label}`, { plans: v });
  }

  /* Custom target ranges are merged into paramDefs before the engine sees
     them, so a nonsensical range arrives looking official. */
  for (const [label, ranges] of [
    ['a non-numeric minimum', [{ key: 'alkalinity', min: 'x', max: 9.5 }]],
    ['a minimum above the maximum', [{ key: 'alkalinity', min: 12, max: 8 }]],
    ['a null entry', [null]],
    ['not an array', 'x'],
  ]) {
    const merged = defs.map((d) => {
      const o = (Array.isArray(ranges) ? ranges : []).find((c) => c && c.key === d.key);
      return o ? { ...d, min: o.min, max: o.max } : d;
    });
    seen++;
    try {
      const st = L.deriveTankState({ readings: base, icps: [], paramDefs: merged, settings: GOOD });
      const text = String(st.overview.headline) + st.briefing.map((c) => `${c.claim} ${c.support || ''}`).join(' ');
      if (/undefined|NaN|Infinity/.test(text)) { console.log(`  FAIL custom range ${label} produced broken text`); more++; }
    } catch (e) { console.log(`  FAIL custom range ${label} threw: ${e.message}`); more++; }
  }
  console.log(`  storage keys and custom ranges: ${seen} shapes, ${more} failures`);
  if (more) process.exit(1);
}

/* The restore inspector — the gatekeeper, not what comes after it.
 *
 * A single null anywhere in a backup threw while building the dedupe key, so
 * one bad entry made the whole file unreadable with no explanation. And a
 * string or a number in the readings list was counted as importable, so the
 * preview promised more than the restore would deliver and the difference
 * vanished silently. That is the worst shape a data-loss bug can take: the
 * counts look right and nothing appears wrong.
 */
{
  let more = 0, seen = 0;
  const file = (data) => ({ format: 'dans-tank-backup', createdAt: '2026-08-01', data });

  const CASES = [
    ['a clean backup', { readings: [{ param: 'alkalinity', date: '2026-08-01', value: 9 }] }, 1, 0],
    ['a null among readings', { readings: [null, { param: 'alkalinity', date: '2026-08-01', value: 9 }] }, 1, 1],
    ['a string among readings', { readings: ['x'] }, 0, 1],
    ['a number among readings', { readings: [42] }, 0, 1],
    ['a null in dose-log', { 'dose-log': [null, { element: 'alkalinity', date: '2026-08-01', ml: 10 }] }, 1, 1],
    ['a null in reminders', { reminders: [null] }, 0, 1],
    ['a null in task-log', { 'task-log': [null] }, 0, 1],
    ['a null in water-changes', { 'water-changes': [null] }, 0, 1],
    ['a null in icp-tests', { 'icp-tests': [null] }, 0, 1],
  ];
  for (const [label, data, wantUsable, wantSkipped] of CASES) {
    seen++;
    let r;
    try { r = L.inspectBackup(file(data), {}); }
    catch (e) { console.log(`  FAIL restore ${label} threw: ${e.message}`); more++; continue; }
    if (!r.ok) { console.log(`  FAIL restore ${label} was rejected outright`); more++; continue; }
    const total = (r.summary || []).reduce((a, x) => a + x.total, 0);
    if (total !== wantUsable) {
      console.log(`  FAIL restore ${label}: counted ${total} usable, expected ${wantUsable}`); more++;
    }
    if ((r.skipped || 0) !== wantSkipped) {
      console.log(`  FAIL restore ${label}: reported ${r.skipped || 0} skipped, expected ${wantSkipped}`); more++;
    }
  }

  /* Existing data can be just as damaged as the incoming file. */
  seen++;
  try {
    L.inspectBackup(file({ readings: [{ param: 'alkalinity', date: '2026-08-01', value: 9 }] }),
      { readings: [null, { param: 'alkalinity', date: '2026-08-01', value: 9 }] });
  } catch (e) {
    console.log(`  FAIL restore with damaged existing data threw: ${e.message}`); more++;
  }

  /* A file that is not a backup at all must be refused, not half-read. */
  for (const [label, parsed] of [
    ['not a backup', { hello: 'world' }],
    ['no data section', { format: 'dans-tank-backup' }],
    ['data is a string', { format: 'dans-tank-backup', data: 'x' }],
    ['null', null],
  ]) {
    seen++;
    try {
      const r = L.inspectBackup(parsed, {});
      if (r.ok) { console.log(`  FAIL restore accepted ${label}`); more++; }
      if (!r.reason) { console.log(`  FAIL restore refused ${label} without saying why`); more++; }
    } catch (e) { console.log(`  FAIL restore ${label} threw: ${e.message}`); more++; }
  }
  console.log(`  restore inspector: ${seen} files, ${more} failures`);
  if (more) process.exit(1);
}

/* Every settings field, corrupted one at a time.
 *
 * D4 re-verification: the original pass tested settings as a whole — null, a
 * string, an array — but never each FIELD individually. A single corrupted
 * number in an otherwise valid settings object is the likelier failure: a
 * hand-edited backup, a half-finished form, a value that was once a string.
 *
 * It also found two fields the app reads that DEFAULT_SETTINGS does not
 * declare: `kitSigma` and `_corrections`. Neither would have been covered by
 * iterating the defaults, which is what a naive version of this test does.
 */
{
  let more = 0, seen = 0;
  const GOOD = { ...L.DEFAULT_SETTINGS, volumeL: 77 };
  /* Read from the source, not from the defaults, so a field the app consults
     but never declares is still exercised. */
  const FIELDS = [...new Set([...Object.keys(GOOD), 'kitSigma', '_corrections'])];
  const CORRUPT = [['a string', 'oops'], ['null', null], ['NaN', NaN],
    ['Infinity', Infinity], ['negative', -1], ['an object', {}],
    ['an array', []], ['zero', 0], ['huge', 1e9]];

  for (const field of FIELDS) {
    for (const [label, value] of CORRUPT) {
      seen++;
      let st;
      try {
        st = L.deriveTankState({ readings: base, icps: [], paramDefs: defs,
          settings: { ...GOOD, [field]: value } });
      } catch (e) {
        console.log(`  FAIL settings.${field} = ${label} threw: ${e.message}`); more++; continue;
      }
      const text = String(st.overview.headline)
        + st.briefing.map((c) => `${c.claim} ${c.support || ''}`).join(' ')
        + st.doseStates.map((d) => `${d.headline} ${d.detail}`).join(' ');
      if (/undefined|NaN|Infinity|\[object/.test(text)) {
        console.log(`  FAIL settings.${field} = ${label} produced broken text: ${text.slice(0, 60)}`);
        more++;
      }
    }
  }

  /* Custom ranges are merged into paramDefs before the engine sees them, so a
     nonsensical range arrives looking official. */
  for (const [label, ranges] of [
    ['null', null], ['a string', 'x'],
    ['minimum above maximum', [{ key: 'alkalinity', min: 12, max: 8 }]],
    ['NaN bounds', [{ key: 'alkalinity', min: NaN, max: NaN }]],
    ['no key', [{ min: 8, max: 9 }]],
    ['equal bounds', [{ key: 'alkalinity', min: 9, max: 9 }]],
  ]) {
    seen++;
    const merged = defs.map((d) => {
      const o = (Array.isArray(ranges) ? ranges : []).find((c) => c && c.key === d.key);
      return o ? { ...d, min: o.min, max: o.max } : d;
    });
    try {
      const st = L.deriveTankState({ readings: base, icps: [], paramDefs: merged, settings: GOOD });
      const text = String(st.overview.headline) + st.briefing.map((c) => c.claim).join(' ');
      if (/undefined|NaN|Infinity/.test(text)) {
        console.log(`  FAIL custom range ${label} produced broken text`); more++;
      }
    } catch (e) {
      console.log(`  FAIL custom range ${label} threw: ${e.message}`); more++;
    }
  }
  console.log(`  every settings field corrupted in turn: ${seen} combinations, ${more} failures`);
  if (more) process.exit(1);
}

/* The restore that writes, not just the one that previews.
 *
 * `inspectBackup` was hardened against nulls and non-objects. `restoreBackup`,
 * which does the actual merging and saving, was not — so a file the preview
 * described as ready to import threw the moment the button was pressed. Four
 * shapes did it, including a null in the EXISTING data rather than the
 * incoming file, which no amount of inspecting the file would have caught.
 *
 * A preview that promises what the restore cannot deliver is worse than a
 * refusal: the refusal at least happens before anything is written.
 */
{
  let more = 0, seen = 0;
  const file = (data) => ({ format: 'dans-tank-backup', createdAt: '2026-08-01', data });
  const CASES = [
    ['a clean file', { readings: [{ param: 'alkalinity', date: '2026-08-01', value: 9 }] }, {}],
    ['a null among readings', { readings: [null, { param: 'alkalinity', date: '2026-08-01', value: 9 }] }, {}],
    ['a string among readings', { readings: ['x'] }, {}],
    ['a null in dose-log', { 'dose-log': [null] }, {}],
    ['a null in reminders', { reminders: [null] }, {}],
    ['a null in task-log', { 'task-log': [null] }, {}],
    ['damaged existing data', { readings: [{ param: 'alkalinity', date: '2026-08-01', value: 9 }] }, { readings: [null] }],
    ['both damaged', { readings: [null, 'x', 7] }, { readings: [null] }],
    ['every list not an array', { readings: 'x', 'dose-log': 5, reminders: null }, {}],
  ];

  const run = async () => {
    for (const [label, data, current] of CASES) {
      seen++;
      /* Whatever the inspector accepts, the restore must survive. */
      const info = L.inspectBackup(file(data), current);
      if (!info.ok) continue;
      try {
        await L.restoreBackup(file(data), current, false);
      } catch (e) {
        console.log(`  FAIL restore of ${label} threw after the preview accepted it: ${e.message}`);
        more++;
      }
    }
    console.log(`  restore survives everything the preview accepts: ${seen} files, ${more} failures`);
    if (more) process.exit(1);
  };
  run();
}

/* Malformed dose logs, through the reading-confirmation path.
 *
 * Readings have been coerced at the deriveTankState boundary for months. The
 * dose log never was — so a backup holding `ml` as the string "11" survived
 * the restore, survived inspectBackup, and then crashed the confirmation
 * window on toFixed. JSON round-trips preserve types; a hand-edited export or
 * a file from another tool does not have to.
 *
 * The dose-change messages made this reachable: they are the first thing to
 * read `ml` and format it back out.
 */
{
  const dlDef = L.PARAM_DEFS.find((d) => d.key === 'alkalinity');
  const TM = L.todayStr();
  const SM = { ...L.DEFAULT_SETTINGS, volumeL: 77, dkhPerMlPer100L: 0.0533, dailyDoseMl: 11 };
  const rows = [8.4, 8.5, 8.6, 8.7].map((v, i) =>
    ({ param: 'alkalinity', date: L.addDays(TM, -(4 - i) * 2), time: '20:00', value: v }));
  let more = 0, seen = 0;

  const attempt = (label, doseLog, waterChanges) => {
    seen++;
    let st;
    try {
      st = L.deriveTankState({ readings: rows, icps: [], paramDefs: L.PARAM_DEFS, settings: SM,
        doseLog, waterChanges: waterChanges || [], corrections: [], correctionPlans: {} });
    } catch (e) { console.log(`  FAIL ${label}: deriving threw — ${e.message}`); more++; return; }
    const ds = st.doseStates.find((x) => x && x.key === 'alkalinity');
    let v;
    try {
      v = L.readingVerdict(dlDef, { value: 8.9, prev: 8.7, delta: 0.2,
        status: L.paramStatus(dlDef, 8.9), doseState: ds });
    } catch (e) { console.log(`  FAIL ${label}: the confirmation threw — ${e.message}`); more++; return; }
    const text = `${v.headline} ${v.line}`;
    if (/undefined|NaN|Infinity|\[object|\bnull\b/.test(text)) {
      console.log(`  FAIL ${label}: broken text — ${text.slice(0, 60)}`); more++;
    }
    if (/-\d+ (day|week)/.test(text)) {
      console.log(`  FAIL ${label}: negative duration`); more++;
    }
  };

  for (const [label, ml] of [
    ['a string', '11'], ['null', null], ['zero', 0], ['negative', -5],
    ['NaN', NaN], ['enormous', 1e9], ['a string with units', '11 mL'],
    ['an empty string', ''], ['an object', {}], ['an array', []],
  ]) {
    attempt(`ml is ${label}`, [{ element: 'alkalinity', date: L.addDays(TM, -3), time: '21:00', ml }]);
  }

  attempt('no date', [{ element: 'alkalinity', time: '21:00', ml: 11 }]);
  attempt('a date that is not a date', [{ element: 'alkalinity', date: 'not-a-date', time: '21:00', ml: 11 }]);
  attempt('dated in the future', [{ element: 'alkalinity', date: L.addDays(TM, 30), time: '21:00', ml: 11 }]);
  attempt('dated four thousand days ago', [{ element: 'alkalinity', date: L.addDays(TM, -4000), time: '21:00', ml: 11 }]);
  attempt('no element', [{ date: L.addDays(TM, -3), time: '21:00', ml: 11 }]);
  attempt('a null entry', [null, { element: 'alkalinity', date: L.addDays(TM, -3), time: '21:00', ml: 11 }]);
  attempt('not an array', 'oops');
  attempt('two identical entries', [
    { element: 'alkalinity', date: L.addDays(TM, -3), time: '21:00', ml: 9 },
    { element: 'alkalinity', date: L.addDays(TM, -3), time: '21:00', ml: 11 }]);
  attempt('a hundred changes', Array.from({ length: 100 }, (unused, i) =>
    ({ element: 'alkalinity', date: L.addDays(TM, -i), time: '21:00', ml: 9 + i % 5 })));
  attempt('a damaged water-change list',
    [{ element: 'alkalinity', date: L.addDays(TM, -3), time: '21:00', ml: 11 }],
    [null, { id: 'w', date: 'bad', litres: 'x' }]);

  console.log(`  malformed dose logs through the confirmation: ${seen} shapes, ${more} failures`);
  if (more) process.exit(1);
}
