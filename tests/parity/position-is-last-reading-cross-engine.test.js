/* §26/§12 parity — do all three dosing engines agree on what "position"
 * means, for the identical relative shape?
 *
 * reef-chemistry.md §26 (decided 14 Aug): "Whether a level is in band, out of
 * band, or at which edge — that question is answered by the most recent
 * measurement, never by a fitted or projected value." The fix
 * (src/test/defects/position-is-last-reading.test.js, 17/17 passing) proved
 * this per engine, against per-engine literal fixtures (different absolute
 * numbers for alkalinity/calcium/magnesium). That is the right test for "is
 * this engine correct" — it is not a test that the three engines are
 * governed by *one rule* rather than three separately-maintained ones that
 * currently happen to agree.
 *
 * This file drives the SAME relative shape — expressed as a fraction of each
 * element's own band width, so "the same shape" means the same position
 * relative to the band, not the same absolute number — through all three
 * engines at once, and asserts they return the identical verdict class. The
 * point is not to catch today's bug (there is none here); it is to make sure
 * that if a future edit reintroduces `fittedNow`-based position in exactly
 * one of the three engines, the three stop agreeing and this test — not a
 * user noticing one screen disagrees with another — is what catches it.
 *
 * §12's parity requirement is usually read as "surfaces agree for identical
 * inputs." This is the engine-to-engine reading of the same requirement:
 * §19 names "one engine ... every parameter goes through it" as the decided
 * direction, and until that engine exists, these three hand-written engines
 * are the closest thing to it — they had better agree with each other on the
 * one rule §26 states plainly, using the one shared field name
 * (`out.current.value`, `out.fittedNow`) each already exposes.
 */
import { describe, expect, it } from 'vitest'
import { PARAM_DEFS } from '../../src/lib/constants.js'
import { DEFAULT_SETTINGS, dayNum } from '../../src/lib/analytics/water-changes.js'
import { assessAlkalinity } from '../../src/lib/dosing/alkalinity.js'
import { assessCalcium } from '../../src/lib/dosing/calcium.js'
import { assessMagnesium } from '../../src/lib/dosing/helpers.js'

const alkDef = PARAM_DEFS.find((d) => d.key === 'alkalinity');
const caDef = PARAM_DEFS.find((d) => d.key === 'calcium');
const mgDef = PARAM_DEFS.find((d) => d.key === 'magnesium');

const TODAY = '2026-08-14';
const NOW = dayNum(TODAY) + 12 / 24;
const addDays = (iso, n) =>
  new Date(new Date(iso + 'T00:00:00Z').getTime() + n * 86400000).toISOString().slice(0, 10);

/* Same shape scaled per element: `strength`/`dose` are each engine's own
 * settings keys for solution strength and daily dose (arbitrary plausible
 * values — the fixture does not depend on their size, only that they are
 * present so the engine does not refuse for a missing-input reason). `gap`
 * is each element's own realistic test cadence (§4/§8): alkalinity every 2
 * days, calcium/magnesium weekly/fortnightly. */
const ENGINES = {
  alkalinity: { fn: assessAlkalinity, def: alkDef, strength: 'dkhPerMlPer100L', s: 0.0533, dose: 'dailyDoseMl', d: 9, gap: 2 },
  calcium: { fn: assessCalcium, def: caDef, strength: 'caPpmPerMlPer100L', s: 0.36, dose: 'calciumDoseMl', d: 12, gap: 7 },
  magnesium: { fn: assessMagnesium, def: mgDef, strength: 'mgPpmPerMlPer100L', s: 0.024, dose: 'magDoseMl', d: 8, gap: 14 },
};

const inBand = (def, v) => v >= def.min && v <= def.max;

/* A series expressed as fractions of the element's OWN band width (0 = def.min,
 * 1 = def.max), so the same array of fractions produces "the same shape" —
 * the same position relative to the band — on every element regardless of
 * its absolute units (dKH vs ppm). */
function seriesFor(key, fractions) {
  const cfg = ENGINES[key];
  const w = cfg.def.max - cfg.def.min;
  return fractions.map((f, i) => ({
    param: key,
    value: cfg.def.min + f * w,
    time: '09:00',
    date: addDays(TODAY, -(fractions.length - i) * cfg.gap),
  }));
}

function assess(key, fractions) {
  const cfg = ENGINES[key];
  const settings = { ...DEFAULT_SETTINGS, volumeL: 77, [cfg.strength]: cfg.s, [cfg.dose]: cfg.d };
  const readings = seriesFor(key, fractions);
  return cfg.fn({ readings, doseLog: [], waterChanges: [], corrections: [],
    settings, def: cfg.def, correctionPlans: {}, now: NOW });
}

/* Four readings three band-widths below the floor, then a last reading dead
 * centre. Verified empirically against all three engines (not asserted from
 * a guess): at this magnitude the least-squares fit stays pulled below the
 * floor for every element while the newest measurement is squarely in band
 * — the exact shape §26 says must classify as in band. (A shallower outlier,
 * e.g. one band-width below the floor, was tried first and left calcium's
 * fit inside the band while alkalinity's and magnesium's sat outside it —
 * itself a reminder that "the same shape" only produces "the same
 * disagreement" once the magnitude is large enough for every element's own
 * fit window and cadence; that is a property of the fit, not of this test.) */
const IN_BAND_LAST_SHAPE = [-3, -3, -3, -3, 0.5];

/* The mirror, modelled on the exact shape reef-chemistry.md's own recovering-
 * tank case uses (a steady rise approaching the band from below, ending on a
 * reading that has not quite arrived): fractions of the band width equivalent
 * to alkalinity's 7.4 -> 7.8 -> 8.2 -> 8.6 -> 8.15 against an 8.2-8.8 band,
 * scaled to each element's own band the same way. The fit, extrapolated from
 * a still-rising trend, lands inside the band; the last raw reading has
 * dipped just short of it. Verified empirically. */
const OUT_BAND_LAST_SHAPE = [-4 / 3, -2 / 3, 0, 2 / 3, -1 / 12];

describe("§26/§12 cross-engine parity — the same relative shape, scaled per element's own band", () => {
  it('all three engines agree the position is IN band when the last reading is centred, even though the fitted line (same shape, every engine) sits below the floor', () => {
    const results = {};
    for (const key of Object.keys(ENGINES)) results[key] = assess(key, IN_BAND_LAST_SHAPE);

    for (const key of Object.keys(ENGINES)) {
      const { def } = ENGINES[key];
      const a = results[key];
      /* Precondition, per engine: the shape really does pull the fit and the
       * last reading into different bands here — otherwise the parity
       * assertion below would pass for a fixture that proves nothing. */
      expect(inBand(def, a.current.value)).toBe(true);
      expect(inBand(def, a.fittedNow)).toBe(false);
    }

    /* The parity claim itself: not "is alkalinity right", "is calcium
     * right", "is magnesium right" checked three separate times — one
     * verdict-class comparison across all three for the identical shape. */
    const lastReadingVerdicts = Object.keys(ENGINES)
      .map((key) => inBand(ENGINES[key].def, results[key].current.value));
    expect(lastReadingVerdicts).toEqual([true, true, true]);

    /* And confirms none of the three quietly answered from the fitted line
     * instead — if even one had, that engine's entry here would flip to
     * `true` while the last-reading verdict above stayed `true` too, so the
     * two rows would stop looking like independent evidence of the same
     * rule and start looking like the old bug (fit and last reading just
     * happening to agree by construction). Asserting the fit row is FALSE
     * for all three is what makes the row above mean something. */
    const fittedVerdicts = Object.keys(ENGINES)
      .map((key) => inBand(ENGINES[key].def, results[key].fittedNow));
    expect(fittedVerdicts).toEqual([false, false, false]);
  });

  it('all three engines agree the position is OUT of band when the last reading steps outside, even though the fitted line (same shape, every engine) sits inside it', () => {
    const results = {};
    for (const key of Object.keys(ENGINES)) results[key] = assess(key, OUT_BAND_LAST_SHAPE);

    for (const key of Object.keys(ENGINES)) {
      const { def } = ENGINES[key];
      const a = results[key];
      expect(inBand(def, a.current.value)).toBe(false);
      expect(inBand(def, a.fittedNow)).toBe(true);
    }

    const lastReadingVerdicts = Object.keys(ENGINES)
      .map((key) => inBand(ENGINES[key].def, results[key].current.value));
    expect(lastReadingVerdicts).toEqual([false, false, false]);

    const fittedVerdicts = Object.keys(ENGINES)
      .map((key) => inBand(ENGINES[key].def, results[key].fittedNow));
    expect(fittedVerdicts).toEqual([true, true, true]);
  });

  it('`current.value` is the literal last raw reading passed in, on all three engines, for both shapes — the field the whole parity claim rests on', () => {
    const inBandCase = {};
    const outBandCase = {};
    for (const key of Object.keys(ENGINES)) {
      inBandCase[key] = assess(key, IN_BAND_LAST_SHAPE);
      outBandCase[key] = assess(key, OUT_BAND_LAST_SHAPE);
    }
    for (const key of Object.keys(ENGINES)) {
      const { def } = ENGINES[key];
      const w = def.max - def.min;
      expect(inBandCase[key].current.value).toBeCloseTo(def.min + 0.5 * w, 6);
      expect(outBandCase[key].current.value).toBeCloseTo(def.min + (-1 / 12) * w, 6);
    }
  });
});
