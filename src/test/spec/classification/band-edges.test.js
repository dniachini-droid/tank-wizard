/* Reading classification — no-action band edges (§3, worked example 9)
 *
 * Spec anchor: docs/spec/reef-chemistry.md §3, lines 77-84 —
 *   "Default no-action band, applied to whatever target the user sets:
 *    Alkalinity  1.0 dKH  target ± 0.5 dKH
 *    Calcium     50 ppm   target ± 25 ppm
 *    Magnesium   100 ppm  target ± 50 ppm"
 * and lines 93-95 — "The out-of-band window is therefore narrow for
 *   alkalinity — 0.5 to 1.0 dKH from target — and the app must handle a
 *   reading landing exactly on either edge correctly."
 * Worked example 9 (line 252-253): target 8.5, band ±0.5 → 8.0 classifies
 *   IN RANGE, not out of range. Edges are inclusive of their band.
 *
 * The band width must track whatever target the USER has set, not a single
 * hardcoded default — so every table below is exercised at more than one
 * target, including non-default ones, per the task brief.
 *
 * `paramContext` and `computeControl` (src/lib/analytics/reading-meaning.js)
 * are the two exported entry points in scope. Neither takes a "target" —
 * both take a `def` with fixed `min`/`max` and treat that as the band. That
 * is the only lever available to test the arithmetic the spec describes, so
 * each band edge below is expressed as a `def` built from `target ± half`,
 * exactly as §3 specifies. Separately, this file checks whether the def the
 * app actually ships (`PARAM_DEFS`, src/lib/constants.js) implements that
 * model at all for the exact numbers in worked example 9.
 */
import { describe, expect, it } from 'vitest'
import { paramContext, computeControl } from '../../../lib/analytics/reading-meaning.js'
import { PARAM_DEFS } from '../../../lib/constants.js'

const real = (key) => PARAM_DEFS.find((d) => d.key === key)

// A spec-legal def: target ± half-band-width, everything else borrowed from
// the app's own definition so label/unit/step stay realistic.
const bandDef = (key, target, half) => ({ ...real(key), min: target - half, max: target + half })

const HALF = { alkalinity: 0.5, calcium: 25, magnesium: 50 };

// Non-default targets are included deliberately — §3 says the band applies
// "to whatever target the user sets", not just 8.5/430/1350.
const TARGETS = {
  alkalinity: [8.0, 8.5, 9.0, 8.2],
  calcium: [420, 430, 450, 405],
  magnesium: [1300, 1350, 1250, 1420],
};

describe('§3 no-action band — edges are inclusive (worked example 9)', () => {
  for (const key of Object.keys(HALF)) {
    const half = HALF[key];
    for (const target of TARGETS[key]) {
      const def = bandDef(key, target, half);
      const lo = target - half, hi = target + half;

      it(`${key}: target ${target} — lower edge ${lo} classifies in range`, () => {
        // paramContext returns null when the reading needs no comment, i.e.
        // is inside the band. A non-null return means the app is treating it
        // as out of band.
        expect(paramContext(def, lo, null)).toBeNull();
      });

      it(`${key}: target ${target} — upper edge ${hi} classifies in range`, () => {
        expect(paramContext(def, hi, null)).toBeNull();
      });

      it(`${key}: target ${target} — just inside lower edge (${lo} + step) is in range`, () => {
        const step = key === 'alkalinity' ? 0.05 : key === 'calcium' ? 1 : 1;
        expect(paramContext(def, lo + step, null)).toBeNull();
      });

      it(`${key}: target ${target} — just outside lower edge (${lo} - step) is out of range`, () => {
        const step = key === 'alkalinity' ? 0.05 : key === 'calcium' ? 1 : 1;
        expect(paramContext(def, lo - step, null)).not.toBeNull();
      });

      it(`${key}: target ${target} — just outside upper edge (${hi} + step) is out of range`, () => {
        const step = key === 'alkalinity' ? 0.05 : key === 'calcium' ? 1 : 1;
        expect(paramContext(def, hi + step, null)).not.toBeNull();
      });
    }
  }
});

describe('§3 no-action band — computeControl treats the median edge inclusively', () => {
  // computeControl's medianInside test reads `p50 >= def.min && p50 <= def.max`
  // (reading-meaning.js:176). Three identical readings sitting exactly on the
  // lower edge should therefore read as "inside", per worked example 9.
  const target = 8.5, half = 0.5;
  const def = bandDef('alkalinity', target, half);
  const edge = target - half; // 8.0

  const readings = [
    { id: '1', param: 'alkalinity', date: '2026-08-09', value: edge },
    { id: '2', param: 'alkalinity', date: '2026-08-11', value: edge },
    { id: '3', param: 'alkalinity', date: '2026-08-13', value: edge },
  ];

  it('a reading held exactly on the lower edge is medianInside=true, not treated as out of band', () => {
    const control = computeControl(def, readings, 90);
    expect(control).not.toBeNull();
    expect(control.medianInside).toBe(true);
    expect(control.below).toBe(0);
  });
});

describe('§3 no-action band — the def the app actually ships does not implement "target ± band" (structural gap)', () => {
  /* PARAM_DEFS (src/lib/constants.js) is the ONLY def object ever passed to
   * paramContext/computeControl/paramStatus in the running app — there is no
   * user-settable "target" anywhere in the codebase (grepped: no alkTarget,
   * caTarget, mgTarget, or any "target" field on settings). So the band that
   * actually governs every classification in production is the fixed
   * PARAM_DEFS range, not target ± §3's width, for any target.
   *
   * This test runs worked example 9 verbatim against the def the app really
   * uses. Mixed reef is the spec's own default coral mix (§3 table, line 73):
   * alk target 8.5. Band ±0.5 → 8.0 must be in range.
   */
  it('worked example 9 verbatim: alk 8.0 (target 8.5, ±0.5) must be in range under the app\'s real def', () => {
    const alkDef = real('alkalinity');
    // Precondition: prove this is a real, live def, not a stub.
    expect(alkDef).toBeTruthy();
    const context = paramContext(alkDef, 8.0, null);
    // Spec: 8.0 is target 8.5's lower band edge, inclusive → in range → no
    // out-of-band commentary.
    expect(context).toBeNull();
  });

  it('PARAM_DEFS.alkalinity is not target 8.5 ± 0.5 dKH (§3 default coral-mix target for "Mixed reef")', () => {
    const alkDef = real('alkalinity');
    expect(alkDef.min).toBeCloseTo(8.0, 5);
    expect(alkDef.max).toBeCloseTo(9.0, 5);
  });

  it('PARAM_DEFS.calcium is not target 430 ± 25 ppm (§3 default coral-mix target)', () => {
    const caDef = real('calcium');
    expect(caDef.min).toBeCloseTo(405, 5);
    expect(caDef.max).toBeCloseTo(455, 5);
  });

  it('PARAM_DEFS.magnesium is not target 1350 ± 50 ppm (§3 default coral-mix target)', () => {
    const mgDef = real('magnesium');
    expect(mgDef.min).toBeCloseTo(1300, 5);
    expect(mgDef.max).toBeCloseTo(1400, 5);
  });
});
