/* Classify on the stored value, never the displayed one — §7 rule 1, worked example 10
 *
 * Spec anchor: docs/spec/reef-chemistry.md §7, line 181 — "Convert units
 *   first. Round last. Never round an intermediate value." Worked example 10
 *   (lines 255-256): "target 8.5, upper edge 9.0, stored reading 9.049
 *   displayed as 9.0 → classified on 9.049 (out of range), not on the
 *   displayed 9.0."
 *
 * The task brief asks specifically whether any classification path in scope
 * consumes a rounded value. Two different things are tested here:
 *
 *  1. paramContext / computeControl (reading-meaning.js), which classify a
 *     single reading against a band — these take the raw stored value
 *     directly and never pass it through fmtVal/roundTo first. Worked
 *     example 10 is run against them verbatim and is expected to PASS: this
 *     is a regression lock, not a violation.
 *
 *  2. assessDrift (drift.js) and computeRates (rate-analysis.js), which
 *     classify a *rate* (mild/none, good/ok/poor) against a threshold. Both
 *     round the rate to its display precision ("shown") BEFORE comparing it
 *     to the threshold that decides the classification — the exact defect
 *     shape worked example 10 warns about, just one level up from a single
 *     reading. These are expected to FAIL.
 */
import { describe, expect, it } from 'vitest'
import { paramContext, computeControl } from '../../../lib/analytics/reading-meaning.js'
import { fmtVal } from '../../../lib/analytics/time-in-range.js'
import { assessDrift } from '../../../lib/analytics/drift.js'
import { computeRates } from '../../../lib/analytics/rate-analysis.js'
import { PARAM_DEFS } from '../../../lib/constants.js'

describe('worked example 10 verbatim — paramContext classifies on the stored value', () => {
  const target = 8.5, upperEdge = 9.0;
  const def = { ...PARAM_DEFS.find((d) => d.key === 'alkalinity'), min: target - 0.5, max: upperEdge };
  const stored = 9.049;

  it('precondition: 9.049 displays as 9.0, indistinguishable from the edge itself', () => {
    expect(fmtVal(def, stored)).toBe('9.0');
    expect(fmtVal(def, upperEdge)).toBe('9.0');
  });

  it('paramContext classifies the stored 9.049 as out of range, not the displayed 9.0', () => {
    const context = paramContext(def, stored, null);
    expect(context).not.toBeNull();
    expect(context.toLowerCase()).toMatch(/high alkalinity/);
  });
});

describe('worked example 10, generalised — computeControl classifies on stored values throughout', () => {
  const target = 8.5, upperEdge = 9.0;
  const def = { ...PARAM_DEFS.find((d) => d.key === 'alkalinity'), min: target - 0.5, max: upperEdge };
  const readings = [
    { id: '1', param: 'alkalinity', date: '2026-08-09', value: 9.049 },
    { id: '2', param: 'alkalinity', date: '2026-08-11', value: 9.049 },
    { id: '3', param: 'alkalinity', date: '2026-08-13', value: 9.049 },
  ];

  it('a series held at 9.049 (displays as 9.0) is NOT counted as inside the band', () => {
    const control = computeControl(def, readings, 90);
    expect(control).not.toBeNull();
    expect(control.medianInside).toBe(false);
    expect(control.above).toBe(3);
  });
});

describe('rounding-before-classification in assessDrift (drift.js) — the same defect shape one level up', () => {
  /* Three exactly-linear alkalinity readings (§4-legal: 2-day gaps) whose
   * regression slope is EXACTLY 0.501 dKH/week — a hair over the 0.5 dKH/week
   * "needs action" guide (DRIFT_GUIDE.alkalinity.perWeek). assessDrift
   * rounds this to two decimals ("shown") BEFORE comparing it to the guide:
   * 0.501.toFixed(2) = "0.50", so shown === guide.perWeek and the comparison
   * (shown > guide.perWeek) reads false. The raw, stored value is genuinely
   * over the rail; the rounded one just barely is not.
   */
  const slopePerDay = 0.501 / 7;
  const readings = [
    { id: '1', param: 'alkalinity', date: '2026-08-07', value: 8.5 },
    { id: '2', param: 'alkalinity', date: '2026-08-10', value: 8.5 + slopePerDay * 3 },
    { id: '3', param: 'alkalinity', date: '2026-08-13', value: 8.5 + slopePerDay * 6 },
  ];

  it('precondition: the raw weekly drift is genuinely above the 0.5 dKH/week guide', () => {
    const drift = assessDrift('alkalinity', readings, 8);
    expect(drift.status).toBe('ok');
    expect(Math.abs(drift.perWeek)).toBeGreaterThan(0.5);
  });

  it('needsAction reflects the raw drift, not the value rounded for display', () => {
    const drift = assessDrift('alkalinity', readings, 8);
    // Spec (§7.1): round last. The classification (needsAction) must be
    // decided from the same raw number checked in the precondition above,
    // not from `shown` (drift.perWeek rounded to 2dp for display).
    expect(drift.needsAction).toBe(true);
  });
});

describe('rounding-before-classification in computeRates (rate-analysis.js) — daily grade', () => {
  /* Two consecutive gaps, both exactly the §4 minimum of 2 days apart. The
   * larger of the two implied daily rates is exactly 0.301 dKH/day — a hair
   * over dailyGood (0.3). computeRates rounds to 2dp for "shown" and grades
   * off THAT ("shown <= rr.dailyGood ? good : ..."), so 0.301 grades "good"
   * instead of "ok".
   */
  const readings = [
    { id: '1', param: 'alkalinity', date: '2026-08-01', value: 8.5 },
    { id: '2', param: 'alkalinity', date: '2026-08-03', value: 8.6 },   // rate 0.05/day
    { id: '3', param: 'alkalinity', date: '2026-08-05', value: 9.202 }, // rate 0.301/day
  ];
  const def = PARAM_DEFS.find((d) => d.key === 'alkalinity');

  it('precondition: the raw (unrounded) typical daily rate is above dailyGood (0.3)', () => {
    const rates = computeRates(def, readings, 15);
    expect(rates).not.toBeNull();
    expect(rates.daily).not.toBeNull();
    expect(rates.daily.value).toBeGreaterThan(0.3);
  });

  it('the daily grade reflects the raw rate, not the value rounded for display', () => {
    const rates = computeRates(def, readings, 15);
    // Spec (§7.1, applied to rate classification): round last. 0.301 > 0.3
    // must not grade the same as a genuinely-good 0.30 or better.
    expect(rates.daily.grade).not.toBe('good');
  });
});
