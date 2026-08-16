/* Properties that must hold for ANY input, checked against random data.
 *
 * Written after several rounds where scenario tests passed while the app said
 * something false. A scenario test only checks the cases you thought of; these
 * check the shape of every answer, on inputs nobody designed.
 */
const path = require('path');
const L = require(path.join(__dirname, '..', '..', 'build', 'engines-new.cjs'));

const T = L.todayStr();
/* Read from the engine rather than retyped, so a sourced correction to the
   rates cannot leave the test asserting numbers the app no longer claims. */
const LIMIT = { ...L.SAFE_DAILY_RISE };
const STRENGTH = { alkalinity: 'dkhPerMlPer100L', calcium: 'caPpmPerMlPer100L', magnesium: 'mgPpmPerMlPer100L' };
const DOSE = { alkalinity: 'dailyDoseMl', calcium: 'calciumDoseMl', magnesium: 'magDoseMl' };
const ASSESS = { alkalinity: L.assessAlkalinity, calcium: L.assessCalcium, magnesium: L.assessMagnesium };

let rnd = 20260811;
const rand = () => { rnd = (rnd * 1103515245 + 12345) % 2147483648; return rnd / 2147483648; };
const pick = (a) => a[Math.floor(rand() * a.length)];

const violations = {};
const note = (k, d) => { (violations[k] = violations[k] || []).push(d); };

const RUNS = Number(process.env.INVARIANT_RUNS || 6000);
for (let i = 0; i < RUNS; i++) {
  const k = pick(['alkalinity', 'calcium', 'magnesium']);
  const def = L.PARAM_DEFS.find((d) => d.key === k);
  const vol = pick([20, 45, 77, 120, 200, 400, 800, 2000]);
  const settings = {
    volumeL: vol,
    [STRENGTH[k]]: pick([0.01, 0.024, 0.0533, 0.1, 0.36, 0.5, 1.2]),
    [DOSE[k]]: pick([0, 1, 5, 8, 15, 40]),
  };
  const readings = [];
  const base = def.min + (def.max - def.min) * rand() * 1.6 - (def.max - def.min) * 0.3;
  for (let j = Math.floor(rand() * 10); j > 0; j--) {
    readings.push({
      param: k, date: L.addDays(T, -j * pick([1, 2, 3, 7, 14])),
      time: pick(['08:00', '20:00', '23:59', '00:01']),
      value: Math.round((base + (rand() - 0.5) * (def.max - def.min) * pick([0.1, 0.5, 1.5])) * 1000) / 1000,
    });
  }
  const doseLog = rand() < 0.4 ? [{ element: k, date: L.addDays(T, -Math.floor(rand() * 40)), time: '09:00', ml: pick([1, 5, 9, 20, 60]) }] : [];
  const corrections = rand() < 0.2 ? [{ element: k, date: L.addDays(T, -Math.floor(rand() * 30)), time: '09:00', ml: pick([5, 50, 500]) }] : [];

  let a, st;
  try {
    a = ASSESS[k]({ readings, doseLog, waterChanges: [], corrections, settings, def });
    st = L.doseStatus(a, def, T);
  } catch (e) { note('threw', `${k}: ${e.message}`); continue; }

  for (const f of ['recommendedDose', 'maintenanceDose', 'consumption', 'supplied', 'trendPerDay', 'trendPerWeek', 'fittedNow'])
    if (a[f] != null && !isFinite(a[f])) note('non-finite ' + f, k);

  if (a.recommendedDose < 0) note('negative dose', k);
  if (a.consumption < 0) note('negative consumption', k);
  if (a.maintenanceDose < 0) note('negative maintenance', k);

  const txt = (a.explanation || '') + (a.reason || '') + (a.caution || '') + (st ? st.headline + st.detail : '');
  if (/NaN|undefined|Infinity|\[object/.test(txt)) note('leaked internals into text', `${k}: ${txt.slice(0, 60)}`);

  if (a.correction) {
    /* Nothing you can dose lowers these parameters. */
    if (a.correction.direction !== 'up') note('downward correction offered', k);
    if (a.correction.ppmPerDay > LIMIT[k] * 1.05) note('correction exceeds safe rate', k);
    if (!(a.correction.days >= 2)) note('correction not spread over days', k);
  }
  /* Only judge the rate where the app is actually changing the dose — on a
     hold, the movement is the user's existing dose, not a recommendation. */
  if ((a.action === 'increase' || a.action === 'decrease') && a.recommendedDose != null && a.consumption != null && a.effectPerMl) {
    const rise = Math.abs(a.recommendedDose * a.effectPerMl - a.consumption);
    if (rise > LIMIT[k] * 1.05) note('recommendation exceeds safe rate', `${k} ${rise.toFixed(2)}`);
  }
  if (st) {
    if ((a.action === 'increase' || a.action === 'decrease') && st.state === 'idle') note('status contradicts action', k);
    /* Range membership is the last reading, never a fitted value
       (reef-chemistry.md §26, decided 14 Aug). This read `a.fittedNow` and said
       so — "judged on the fitted level by design, so one noisy reading cannot
       flip the verdict" — which mirrored `doseStatus`'s own rule at the time.
       The property being checked is unchanged: the app never says "nothing to
       do" about a level that is outside its band. Only the measure of "outside
       its band" moved, in the test as in the code. */
    const level = a.current ? a.current.value : null;
    if (level != null && st.state === 'idle' && (level < def.min || level > def.max)) note('idle while out of range', k);
  }
  if (a.action === 'implausible' && a.recommendedDose != null) note('dose offered while setup is blocked', k);
}

const keys = Object.keys(violations);
console.log(`  invariants: ${RUNS} random assessments, ${keys.length} properties violated`);
for (const key of keys) {
  console.log(`    ${key}: ${violations[key].length}`);
  violations[key].slice(0, 3).forEach((v) => console.log(`      ${v}`));
}
if (keys.length) process.exit(1);
