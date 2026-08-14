/* Rate-of-change rails as data (§3)
 *
 * Spec anchor: docs/spec/reef-chemistry.md §3, "Rate rails — one per element"
 * (renumbered from §6 in the 14 Aug canon swap) —
 *   "Any recommendation exceeding a rail is a bug, not a preference. Enforced
 *    in logic, not merely displayed.
 *    | Rail | Default per 24 h |
 *    | Alkalinity | 0.5 dKH |
 *    | Calcium    | 20 ppm  |
 *    | Magnesium  | 25 ppm  |
 *   [user] may tighten a rail. The app never permits loosening beyond the
 *    default."
 * Magnesium settled at 25 (not the Aqua Forest label's 50) on 14 Aug, closing
 * a conflict the canon swap surfaced — see §3's own "For the record" note.
 *
 * These are §1-class universal constants (line 29: "Changing any of these
 * without an [approved][chem] item is an S1 defect"). This file asserts the
 * spec values directly, and separately checks that the two independent
 * places in the codebase that both claim to encode "the daily rail"
 * (safe-rate.js and correction.js) don't disagree with each other.
 */
import { describe, expect, it } from 'vitest'
import { CORRECTION_MAX_RATE, SAFE_DAILY_RISE } from '../../../lib/analytics/safe-rate.js'
import { CORRECTIONS } from '../../../lib/analytics/correction.js'

const SPEC_RAIL = { alkalinity: 0.5, calcium: 20, magnesium: 25 };

describe('§6 rails — CORRECTION_MAX_RATE must equal the spec default per 24h', () => {
  for (const key of Object.keys(SPEC_RAIL)) {
    it(`${key}: CORRECTION_MAX_RATE.${key} === ${SPEC_RAIL[key]}`, () => {
      expect(CORRECTION_MAX_RATE[key]).toBe(SPEC_RAIL[key]);
    });
  }
});

describe('§6 rails — SAFE_DAILY_RISE must equal the spec default per 24h', () => {
  for (const key of Object.keys(SPEC_RAIL)) {
    it(`${key}: SAFE_DAILY_RISE.${key} === ${SPEC_RAIL[key]}`, () => {
      expect(SAFE_DAILY_RISE[key]).toBe(SPEC_RAIL[key]);
    });
  }
});

describe('§6 rails — CORRECTIONS[key].maxPerDay (correction.js) must equal the spec default', () => {
  for (const key of Object.keys(SPEC_RAIL)) {
    it(`${key}: CORRECTIONS.${key}.maxPerDay === ${SPEC_RAIL[key]}`, () => {
      expect(CORRECTIONS[key].maxPerDay).toBe(SPEC_RAIL[key]);
    });
  }
});

describe('§6 rails — the two independent daily-rail sources must not contradict each other', () => {
  /* safe-rate.js's own header comment (lines 15-20) records that exactly this
   * kind of disagreement previously happened for calcium (15 vs 3.5) and
   * caused a 105-tank oscillation / 29-tank crash in simulation. A rail is
   * "enforced in logic" (§6 line 151); if two different pieces of logic
   * enforce two different numbers for the same physical limit, at most one
   * of them can be the real cap and the other is dead or actively wrong.
   */
  for (const key of Object.keys(SPEC_RAIL)) {
    it(`${key}: CORRECTION_MAX_RATE.${key} === CORRECTIONS.${key}.maxPerDay`, () => {
      expect(CORRECTION_MAX_RATE[key]).toBe(CORRECTIONS[key].maxPerDay);
    });
  }
});
