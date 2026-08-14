/* The shared helpers must still know which element they are working on.
 *
 * The merge inverted the risk. Before it, the danger was three copies of the
 * same logic drifting apart — which is what blockdup and dupcheck watch for,
 * and which produced every "fixed in one place, not the others" bug this
 * project has had.
 *
 * Now there is one implementation and three callers, and the new danger is the
 * opposite: a helper that ignores its element and quietly gives all three the
 * same answer. That is exactly what the hardcoded safeDoseBand("alkalinity")
 * was — calcium clamped to 10.9-13.1 mL where its own limit allows 0-54.8 —
 * and it survived a long time because nothing compared the elements.
 *
 * The golden fingerprint cannot catch this on its own: it was recorded from
 * current behaviour, so a helper that has ALWAYS ignored its element looks
 * perfectly stable. These assertions are about sensitivity, not stability.
 */
const path = require('path');
const L = require(path.join(__dirname, '..', '..', 'build', 'engines-new.cjs'));

const defs = L.PARAM_DEFS;
const KEYS = ['alkalinity', 'calcium', 'magnesium'];
let bad = 0, checked = 0;

/* rateLimitDose must clamp against each element's own safe band. */
{
  const results = {};
  for (const key of KEYS) {
    const def = defs.find((d) => d.key === key);
    const out = { maintenanceDose: 10, currentDose: 10, effectPerMl: 0.07 };
    const r = L.rateLimitDose(40, out, def, { ...L.DEFAULT_SETTINGS, volumeL: 77 }, 0.07);
    results[key] = r.next;
  }
  checked++;
  /* Alkalinity's limit is 0.5 a day against calcium's 20, so on identical
     inputs alkalinity must clamp far harder. If all three agree, the element
     is being ignored. */
  if (new Set(Object.values(results)).size === 1) {
    console.log(`  FAIL rateLimitDose gives every element the same answer: ${JSON.stringify(results)}`);
    bad++;
  }
  if (!(results.alkalinity < results.calcium)) {
    console.log(`  FAIL rateLimitDose: alkalinity (${results.alkalinity}) should clamp harder than calcium (${results.calcium})`);
    bad++;
  }
}

/* trendConfirmed must respond to the threshold it is given. */
{
  checked++;
  const out = { slopeSE: 0.01, trendPerWeek: 5, trendPerDay: 0.7 };
  const loose = L.trendConfirmed(out, 6, 30, 0.3);
  const strict = L.trendConfirmed(out, 6, 30, 50);
  if (loose === strict) {
    console.log('  FAIL trendConfirmed ignores its threshold');
    bad++;
  }
  /* And each of its other conditions must actually bite. */
  if (L.trendConfirmed(out, 3, 30, 0.3)) { console.log('  FAIL trendConfirmed ignores the reading count'); bad++; }
  if (L.trendConfirmed(out, 6, 10, 0.3)) { console.log('  FAIL trendConfirmed ignores the span'); bad++; }
  if (L.trendConfirmed({ ...out, slopeSE: null }, 6, 30, 0.3)) { console.log('  FAIL trendConfirmed ignores a missing slope error'); bad++; }
}

/* applyDoseConstraints must respect each element's own band. */
{
  const T = L.todayStr();
  const seen = {};
  for (const key of KEYS) {
    const def = defs.find((d) => d.key === key);
    /* currentDose close to the figure being asked for, so the 25% step cap
       does not fire and the element's own band decides. */
    const out = { maintenanceDose: 10, currentDose: 16, effectPerMl: 0.07,
      trendPerDay: 0, current: { value: (def.min + def.max) / 2 } };
    const readings = [];
    for (let j = 6; j > 0; j--) {
      readings.push({ param: key, date: L.addDays(T, -j * 2), time: '20:00', value: (def.min + def.max) / 2 });
    }
    /* Just inside the 25% step cap, so the cap does NOT fire and the element's
       own safe band is what decides. An earlier version asked for 200 against
       a current of 10: the cap clamped every element to 12.5 and the band
       never got a look in, so the test reported the helper as element-blind
       when it was the scenario that was blind. */
    seen[key] = L.applyDoseConstraints(19, out, def, { ...L.DEFAULT_SETTINGS, volumeL: 77 }, readings, []);
  }
  checked++;
  if (new Set(Object.values(seen)).size === 1) {
    console.log(`  FAIL applyDoseConstraints gives every element the same answer: ${JSON.stringify(seen)}`);
    bad++;
  }
}

/* And the whole engines, on identical numbers, must not agree — each has its
   own bands, cadence and thresholds. */
{
  const T = L.todayStr();
  const out = {};
  for (const key of KEYS) {
    const def = defs.find((d) => d.key === key);
    const readings = [];
    /* Deliberately the same VALUES for all three, which sit in wildly
       different places relative to each band. */
    for (let j = 8; j > 0; j--) {
      readings.push({ param: key, date: L.addDays(T, -j * 2), time: '20:00', value: 420 });
    }
    const fn = { alkalinity: L.assessAlkalinity, calcium: L.assessCalcium, magnesium: L.assessMagnesium }[key];
    const a = fn({ readings, doseLog: [], waterChanges: [], corrections: [],
      settings: { ...L.DEFAULT_SETTINGS, volumeL: 77 }, def, correctionPlans: {} });
    /* Whether the level is in the element's own band, which is the thing that
       must differ. `action` alone was the same "hold" for all three, because a
       flat line means hold regardless of where the line sits. */
    out[key] = `${L.paramStatus(def, 420)}`;
  }
  checked++;
  if (new Set(Object.values(out)).size === 1) {
    console.log(`  FAIL 420 reads the same for every element, though it is in band only for calcium: ${JSON.stringify(out)}`);
    bad++;
  }
}

console.log(`  shared helpers stay element-aware: ${checked} checks, ${bad} failures`);
if (bad) process.exit(1);
