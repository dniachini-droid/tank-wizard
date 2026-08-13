/* Band/alert consistency validation — §3, lines 95-98
 *
 * Spec anchor: docs/spec/reef-chemistry.md §3, lines 95-98 — "The bands and
 *   the alert thresholds must never be allowed to overlap or invert:
 *   `classifyReading` validates this on every call and returns
 *   `insufficient-data` with a configuration error if a user has set them
 *   inconsistently."
 *
 * IMPORTANT — API does not exist. A repo-wide search turns up no function
 * named `classifyReading` anywhere in the codebase:
 *
 *   $ grep -rn "classifyReading" src   →   (no matches)
 *
 * confirmed independently by this file at run time (see the first describe
 * block, which imports every export of every module in scope and asserts
 * the named contract is present). This is recorded as a GAP, not a
 * behavioural violation with a numeric discrepancy — there is nothing to
 * disagree with because nothing implements the spec's named contract.
 *
 * The second describe block tests the underlying requirement — "must never
 * be allowed to overlap or invert" — against whatever classification path
 * DOES exist (paramContext / computeControl, reading-meaning.js), by feeding
 * it a deliberately inverted def (min > max, i.e. band inverted). This is a
 * real behavioural test, not a stand-in for the missing function.
 */
import { describe, expect, it } from 'vitest'
import * as readingMeaning from '../../../lib/analytics/reading-meaning.js'
import * as timeInRange from '../../../lib/analytics/time-in-range.js'
import * as drift from '../../../lib/analytics/drift.js'
import * as safeRate from '../../../lib/analytics/safe-rate.js'
import * as rateAnalysis from '../../../lib/analytics/rate-analysis.js'
import * as correction from '../../../lib/analytics/correction.js'
import * as measurementNoise from '../../../lib/analytics/measurement-noise.js'
import { paramContext, computeControl } from '../../../lib/analytics/reading-meaning.js'
import { PARAM_DEFS } from '../../../lib/constants.js'

describe('§3 line 96 — `classifyReading` does not exist anywhere in the classification surface', () => {
  const modules = { readingMeaning, timeInRange, drift, safeRate, rateAnalysis, correction, measurementNoise };

  it('no module in scope exports a function named classifyReading', () => {
    const found = Object.entries(modules).filter(([, mod]) => typeof mod.classifyReading === 'function');
    // GAP, not a numeric mismatch: the spec names this function explicitly
    // and requires it to validate band/alert consistency "on every call".
    // This assertion is written against the spec's named contract per the
    // task brief, and is expected to fail for as long as the function is
    // simply absent.
    expect(found.map(([name]) => name)).toEqual(
      expect.arrayContaining(['readingMeaning'])
    );
  });
});

describe('§3 line 95-98 — inverted/inconsistent band configuration must not silently misclassify', () => {
  /* A user who sets the band's "min" above its "max" (equivalent to setting
   * an alert-low above a band-low, or a band wider than its own alert — the
   * two examples the task brief gives for "inversion"). Spec requires this
   * to be caught and reported as a configuration error yielding
   * "insufficient-data" — not silently classified as if it were valid.
   */
  const invertedDef = { ...PARAM_DEFS.find((d) => d.key === 'alkalinity'), min: 9.0, max: 8.0 };

  it('paramContext does not report a configuration error for an inverted band — it produces confident output instead', () => {
    // A reading that sits between the (inverted) max and min is simultaneously
    // "above max" and "below min" under the raw comparison the function
    // uses. Spec requires "insufficient-data" with a configuration error;
    // the function has no such return shape at all — it returns a normal
    // advisory string as if the band were valid.
    const context = paramContext(invertedDef, 8.5, null);
    expect(context).toBe('insufficient-data');
  });

  it('computeControl does not report a configuration error for an inverted band either', () => {
    const readings = [
      { id: '1', param: 'alkalinity', date: '2026-08-09', value: 8.5 },
      { id: '2', param: 'alkalinity', date: '2026-08-11', value: 8.5 },
      { id: '3', param: 'alkalinity', date: '2026-08-13', value: 8.5 },
    ];
    const control = computeControl(invertedDef, readings, 90);
    // Spec requires a configuration error surfaced as insufficient-data, not
    // a normal control object with a (meaningless, given the inversion)
    // verdict computed on top of it.
    expect(control && control.status).toBe('insufficient-data');
  });
});
