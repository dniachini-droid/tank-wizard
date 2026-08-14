/* The derivation runs on every render, so its cost is felt on every tap.
 *
 * It was quadratic: ten years of history took 333 ms, and ten times the data
 * cost thirty-six times the time. The cause was not what it looked like. The
 * obvious suspect — a filter over all readings inside a loop over dose changes
 * — turned out to be cold. A CPU profile put half the entire derivation in
 * `alkStamp`, which was already cached: the cost was building the cache KEY,
 * a string concatenation per call, a few hundred thousand times per render.
 *
 * Keyed on the record object instead, via a WeakMap. Ten years now derives in
 * about 110 ms and the growth is near-linear.
 *
 * The ceilings below are generous — roughly three times what the machine does
 * today — because this is guarding against a return to quadratic, not policing
 * a few milliseconds on whatever hardware happens to run it.
 */
const path = require('path');
const L = require(path.join(__dirname, '..', '..', 'build', 'engines-new.cjs'));

const defs = L.PARAM_DEFS;
const T = L.todayStr();
const settings = { ...L.DEFAULT_SETTINGS, volumeL: 77, dkhPerMlPer100L: 0.0533, dailyDoseMl: 10 };

function history(days) {
  const readings = [], doseLog = [], waterChanges = [], corrections = [];
  for (let d = 0; d < days; d++) {
    for (const def of defs) {
      if (def.key === 'ammonia') continue;
      const every = def.key === 'alkalinity' ? 2 : def.key === 'magnesium' ? 21 : 7;
      if (d % every === 0) {
        readings.push({ param: def.key, date: L.addDays(T, -(days - 1 - d)), time: '20:00',
          value: (def.min + def.max) / 2 });
      }
    }
    if (d % 14 === 0) doseLog.push({ element: 'alkalinity', date: L.addDays(T, -(days - 1 - d)), time: '21:00', ml: 10 });
    if (d % 7 === 0) waterChanges.push({ id: 'w' + d, date: L.addDays(T, -(days - 1 - d)), litres: 12 });
    if (d % 60 === 0) corrections.push({ id: 'c' + d, element: 'alkalinity', date: L.addDays(T, -(days - 1 - d)), time: '12:00', ml: 15, direction: 'up' });
  }
  return { readings, doseLog, waterChanges, corrections };
}

const CEILING = { 1: 120, 5: 260, 10: 420 };   /* ms per derivation */
let bad = 0;
const timings = {};

for (const years of [1, 5, 10]) {
  const h = history(years * 365);
  /* One warm-up, then the measurement. */
  L.deriveTankState({ ...h, icps: [], paramDefs: defs, settings });
  const runs = 4;
  const t0 = Date.now();
  for (let i = 0; i < runs; i++) L.deriveTankState({ ...h, icps: [], paramDefs: defs, settings });
  const ms = (Date.now() - t0) / runs;
  timings[years] = ms;
  if (ms > CEILING[years]) {
    console.log(`  FAIL ${years} years of history takes ${ms.toFixed(0)}ms against a ceiling of ${CEILING[years]}ms`);
    bad++;
  }
}

/* And the shape, which is the thing that actually matters: doubling the data
   must not treble the time. Quadratic growth passes a fixed ceiling right up
   until it does not. */
const growth = timings[10] / timings[5];
if (growth > 2.6) {
  console.log(`  FAIL cost is growing faster than the data: 2x the history costs ${growth.toFixed(1)}x the time`);
  bad++;
}

console.log(`  derivation cost: 1y ${timings[1].toFixed(0)}ms, 5y ${timings[5].toFixed(0)}ms, 10y ${timings[10].toFixed(0)}ms, growth ${growth.toFixed(1)}x, ${bad} failures`);
if (bad) process.exit(1);
