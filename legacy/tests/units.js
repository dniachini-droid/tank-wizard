/* Every number the app shows must be plausible for the unit beside it.
 *
 * The arithmetic can be right while the label is wrong, and that is the class
 * of fault no structural checker sees. "0.30dKH of 1.00dKH added so far" was
 * arithmetically correct and described the level moving as though it were
 * millilitres poured in. A magnesium correction quoted 3,465 mL of a solution
 * dosed 8 mL a day. Both read fluently.
 *
 * This sweeps the text the engines actually generate and checks each number
 * against what its unit can plausibly be, which is mechanical enough to run on
 * every build.
 */
const path = require('path');
const L = require(path.join(__dirname, '..', 'build', 'engines.js'));

/* What a figure can plausibly be, by unit. Generous — the point is to catch
   a number that cannot mean what its label says, not to police style. */
const PLAUSIBLE = {
  /* Negative values are allowed because the same unit describes a change as
     well as a level: "moving -0.1 dKH a day" is perfectly sensible, and an
     earlier version of this check flagged it. What cannot be sensible is the
     magnitude. */
  dKH: [-25, 25],
  ppt: [-60, 60],
  /* A dose or a one-off correction. Beyond a few litres the maintenance
     solution is the wrong product and the figure is advice nobody can act on. */
  ' mL': [-3000, 3000],
};
/* ppm covers calcium, magnesium, potassium, nitrate and phosphate, whose
   ranges differ by five orders of magnitude, so it is checked per parameter
   rather than globally. */

const T = L.todayStr();
const defs = L.PARAM_DEFS;
let bad = 0, numbers = 0, texts = 0;

const check = (where, text) => {
  if (!text) return;
  texts++;
  for (const [, num, unit] of String(text).matchAll(/(-?\d[\d,]*\.?\d*)\s?(dKH|ppt|mL)\b/g)) {
    const v = parseFloat(num.replace(/,/g, ''));
    if (!isFinite(v)) continue;
    numbers++;
    const key = unit === 'mL' ? ' mL' : unit;
    const range = PLAUSIBLE[key];
    if (!range) continue;
    if (v < range[0] || v > range[1]) {
      console.log(`  FAIL ${where}: "${v}${unit}" is outside anything that unit can mean`);
      console.log(`      ${String(text).slice(0, 110)}`);
      bad++;
    }
  }
  /* A negative duration means a date arrived where it should not have. */
  if (/-\d+ (day|week|month|hour)/.test(text)) {
    console.log(`  FAIL ${where}: negative duration — ${String(text).slice(0, 80)}`);
    bad++;
  }
};

/* Sweep every element across levels from far below to far above its band, with
   and without a correction, and read everything the engines say. */
const CFG = {
  alkalinity: { s: { dkhPerMlPer100L: 0.0533, dailyDoseMl: 9 }, fn: L.assessAlkalinity },
  calcium: { s: { caPpmPerMlPer100L: 0.36, calciumDoseMl: 12 }, fn: L.assessCalcium },
  magnesium: { s: { mgPpmPerMlPer100L: 0.024, magDoseMl: 8 }, fn: L.assessMagnesium },
};
for (const key of Object.keys(CFG)) {
  const def = defs.find((d) => d.key === key);
  const span = def.max - def.min;
  const S = { ...L.DEFAULT_SETTINGS, volumeL: 77, ...CFG[key].s };
  for (const off of [-3, -2, -1, -0.4, 0, 0.4, 1, 2, 3]) {
    for (const withCorrection of [false, true]) {
      const level = (def.min + def.max) / 2 + span * off;
      const readings = [];
      for (let j = 8; j > 0; j--) {
        readings.push({ param: key, date: L.addDays(T, -j * 2), time: '20:00', value: level });
      }
      const corrections = withCorrection
        ? [{ id: 'c', element: key, date: L.addDays(T, -3), time: '12:00', ml: 20, direction: 'up' }]
        : [];
      let a, st;
      try {
        a = CFG[key].fn({ readings, doseLog: [], waterChanges: [], corrections,
          settings: S, def, correctionPlans: {} });
        st = L.doseStatus(a, def, T, S);
      } catch (e) {
        console.log(`  FAIL ${key} at ${level}: threw ${e.message}`); bad++; continue;
      }
      const where = `${key} ${level.toFixed(1)}${withCorrection ? ' +correction' : ''}`;
      if (st) { check(where, st.headline); check(where, st.detail); }
      check(where, a.explanation);
      check(where, a.reason);
      check(where, a.nextCheck);
      for (const pace of ['gentle', 'steady', 'quick']) {
        const o = L.proposeCorrection(a, def, S, pace);
        if (o && o.why) check(`${where} offer/${pace}`, o.why);
      }
    }
  }
}

/* And the whole-tank surfaces. */
for (const off of [-2, -0.5, 0, 0.5, 2]) {
  const readings = [];
  for (const d of defs) {
    if (d.key === 'ammonia') continue;
    const span = d.max - d.min;
    const v = (d.min + d.max) / 2 + span * off;
    for (let j = 8; j > 0; j--) readings.push({ param: d.key, date: L.addDays(T, -j * 2), time: '20:00', value: v });
  }
  const st = L.deriveTankState({ readings, icps: [], paramDefs: defs,
    settings: { ...L.DEFAULT_SETTINGS, volumeL: 77 } });
  check(`tank ${off}`, st.overview.headline);
  for (const c of st.briefing) { check(`tank ${off}`, c.claim); check(`tank ${off}`, c.support); }
  for (const f of st.allFindings) { check(`tank ${off}`, f.title); check(`tank ${off}`, f.detail); }
}

/* Self-guarding. This only judges the figures it finds, so if the formatters
   stopped emitting numbers at all it would report a clean sweep — a check that
   passes hardest when the app is most broken. Breaking fmtVal to return
   "undefined" produced exactly that: zero implausible figures, out of zero
   figures. The floor is well below the ~170 a healthy run produces. */
if (numbers < 100) {
  console.log(`  FAIL only ${numbers} figures found across ${texts} texts — the sweep is not exercising the wording`);
  bad++;
}
console.log(`  units and magnitudes: ${numbers} figures across ${texts} texts, ${bad} implausible`);
if (bad) process.exit(1);
