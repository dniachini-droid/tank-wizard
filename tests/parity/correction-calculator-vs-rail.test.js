/* §2/§6 parity — Setup's "correction calculator" vs the §6 rail
 *
 * Setup.jsx renders a fourth dose-recommending surface not named in
 * wizard-states.md's table of three, but which produces exactly
 * the numbers §2 requires parity on ("the recommended dose in mL... the
 * expected delta and days to target"): a "Correction calculator" for
 * turning a current/target gap into grams-per-day and days-to-target
 * (Setup.jsx:113-121, `computeCorrection(calcParam, calcCurrent,
 * parseFloat(calcTarget), settings.volumeL)`, imported from
 * src/lib/analytics/correction.js).
 *
 * src/test/spec/classification/rails.test.js already proves, at the
 * constant level, that CORRECTIONS.magnesium.maxPerDay (100) disagrees with
 * CORRECTION_MAX_RATE.magnesium / SAFE_DAILY_RISE.magnesium (25) — the same
 * "physical limit on how fast magnesium may rise" encoded twice, 4x apart.
 * This file drives that disagreement through the actual surface a user
 * would read it from, with a concrete current/target gap, and states the
 * result in the terms §2 asks for: "the expected delta and days to target."
 */
import { describe, expect, it } from 'vitest'
import { computeCorrection } from '../../src/lib/analytics/correction.js'
import { SAFE_DAILY_RISE } from '../../src/lib/analytics/safe-rate.js'
import { mgDef } from './fixtures.js'

describe('§2/§6 — Setup\'s correction calculator vs the rail every dosing engine enforces, for the identical current/target/volume', () => {
  const volumeL = 300;
  const current = 1150;                              // SAFE_BOUNDS.magnesium.min — the alert-low boundary-exact fixture
  const target = (mgDef.min + mgDef.max) / 2;         // 1325 — the wizard's own correction target (see helpers.js proposeCorrection)
  const gap = target - current;                       // 175 ppm

  it('Setup\'s calculator: how many days it tells the user this correction needs', () => {
    const calc = computeCorrection('magnesium', current, target, volumeL);
    expect(calc.delta).toBe(gap);
    expect(calc.maxPerDay).toBe(100);   // CORRECTIONS.magnesium.maxPerDay, per rails.test.js
    expect(calc.days).toBe(2);          // ceil(175 / 100)
  });

  it('the rail every dosing engine enforces (SAFE_DAILY_RISE.magnesium) implies a materially different, much slower days-to-target for the identical gap', () => {
    const railDays = Math.ceil(gap / SAFE_DAILY_RISE.magnesium);
    expect(SAFE_DAILY_RISE.magnesium).toBe(25);
    expect(railDays).toBe(7);
  });

  it('SPEC VIOLATION (§2/§6, S1): the same 175 ppm correction is "2 days" on the Setup screen and "7 days" against the rail every dosing engine enforces — a 3.5x disagreement about how fast the user is told it is safe to move magnesium', () => {
    const calc = computeCorrection('magnesium', current, target, volumeL);
    const railDays = Math.ceil(gap / SAFE_DAILY_RISE.magnesium);
    // §2: "given identical inputs... all three surfaces must produce the
    // same numbers." Setup's calculator is a fourth surface producing a
    // days-to-target figure for the same physical question the dosing
    // engines answer; per §2's own principle it must not disagree with the
    // rail the wizard, manual and test-log paths are all built on
    // (rateLimitDose / SAFE_DAILY_RISE — see rail-exact-landing.test.js).
    expect(calc.days).toBe(railDays);
  });

  it('confirms the actual, current disagreement: computeCorrection recommends moving magnesium 3.5x faster than the rail allows', () => {
    const calc = computeCorrection('magnesium', current, target, volumeL);
    const railDays = Math.ceil(gap / SAFE_DAILY_RISE.magnesium);
    expect(calc.days).toBe(2);
    expect(railDays).toBe(7);
    expect(calc.maxPerDay / SAFE_DAILY_RISE.magnesium).toBe(4);
    // What Setup's calculator implies as a daily rate for the first day —
    // the actual number a user reads and could act on today.
    const impliedFirstDayRate = gap / calc.days;
    expect(impliedFirstDayRate).toBeGreaterThan(SAFE_DAILY_RISE.magnesium * 3);
  });
});
