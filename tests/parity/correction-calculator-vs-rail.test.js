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
 * Bug 5 (routine 15, TW-016) fixed the defect this file was written to
 * demonstrate: CORRECTIONS.magnesium.maxPerDay (100, four times the §3 rail)
 * disagreed with CORRECTION_MAX_RATE.magnesium / SAFE_DAILY_RISE.magnesium
 * (25) — the same "physical limit on how fast magnesium may rise" encoded
 * twice. Both are 25 now (src/test/spec/classification/rails.test.js proves
 * this at the constant level). This file keeps driving that number through
 * the actual surface a user reads it from, as a parity regression guard —
 * per §2, "given identical inputs... all three surfaces must produce the
 * same numbers," and Setup's calculator is a fourth surface answering the
 * same physical question the dosing engines do.
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
    expect(calc.maxPerDay).toBe(25);   // CORRECTIONS.magnesium.maxPerDay, per rails.test.js
    expect(calc.days).toBe(7);         // ceil(175 / 25)
  });

  it('the rail every dosing engine enforces (SAFE_DAILY_RISE.magnesium) implies the same days-to-target for the identical gap', () => {
    const railDays = Math.ceil(gap / SAFE_DAILY_RISE.magnesium);
    expect(SAFE_DAILY_RISE.magnesium).toBe(25);
    expect(railDays).toBe(7);
  });

  it('parity holds (§2/§6): the same 175 ppm correction is "7 days" on both the Setup screen and the rail every dosing engine enforces', () => {
    const calc = computeCorrection('magnesium', current, target, volumeL);
    const railDays = Math.ceil(gap / SAFE_DAILY_RISE.magnesium);
    expect(calc.days).toBe(railDays);
  });

  it('confirms the two rail sources agree exactly — no implied-rate disagreement', () => {
    const calc = computeCorrection('magnesium', current, target, volumeL);
    expect(calc.maxPerDay / SAFE_DAILY_RISE.magnesium).toBe(1);
    // What Setup's calculator implies as a daily rate for the first day —
    // the actual number a user reads and could act on today — must not
    // exceed the rail every other surface enforces.
    const impliedFirstDayRate = gap / calc.days;
    expect(impliedFirstDayRate).toBeLessThanOrEqual(SAFE_DAILY_RISE.magnesium);
  });
});
