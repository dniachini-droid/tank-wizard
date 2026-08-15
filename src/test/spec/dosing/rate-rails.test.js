/* Spec conformance — §3 rate-of-change rails as HARD CAPS
 *
 * Spec anchor: docs/spec/reef-chemistry.md §3, lines 146-166 —
 *   "Any recommendation exceeding a rail is a bug, not a preference. Enforced
 *   in logic, not merely displayed."
 *   | Rail | Default per 24 h |
 *   | Alkalinity | 0.5 dKH |
 *   | Calcium | 20 ppm |
 *   | Magnesium | 25 ppm |
 *   "Decided 14 Aug: the rails are fixed. There is no user rail. One figure
 *   per element, the same for every user. No setting tightens a rail and none
 *   loosens one."
 *
 * These tests exercise the rail directly through the exported primitives
 * (`rateLimitDose` from alkalinity.js, and the constants that feed it) rather
 * than through a full assessment, because the rail's job is narrow and
 * mechanical: given a raw candidate dose, never let the implied level change
 * exceed the per-24h ceiling.
 *
 * History: until 2026-08-14 this file asserted the pre-14-Aug canon (Ca 25,
 * Mg 100, cited as §6) and a since-withdrawn "[user] may tighten a rail"
 * clause. The rail-constant decision (reef-chemistry.md §3, 14 Aug) fixed the
 * canon and the code; this file was the leftover — TW-039.
 */
import { describe, expect, it } from 'vitest'
import { SAFE_DAILY_RISE, CORRECTION_MAX_RATE } from '../../../lib/analytics/safe-rate.js'
import { rateLimitDose } from '../../../lib/dosing/alkalinity.js'

const alkDef = { key: 'alkalinity', label: 'Alkalinity', unit: 'dKH', min: 8.5, max: 9.5, step: 0.1 }

describe('§3 rail defaults must match the canon table verbatim', () => {
  it('alkalinity default rail is 0.5 dKH/24h', () => {
    expect(SAFE_DAILY_RISE.alkalinity).toBe(0.5)
  });

  /* reef-chemistry.md:159 — "Calcium | 20 ppm / day". */
  it('calcium default rail is 20 ppm/24h per canon', () => {
    expect(SAFE_DAILY_RISE.calcium).toBe(20);
  });

  /* reef-chemistry.md:160 — "Magnesium | 25 ppm / day", the conservative
     figure chosen 14 Aug over the Aqua Forest label's 50. */
  it('magnesium default rail is 25 ppm/24h per canon', () => {
    expect(SAFE_DAILY_RISE.magnesium).toBe(25);
  });

  it('SAFE_DAILY_RISE and CORRECTION_MAX_RATE never disagree with each other', () => {
    /* Internal consistency check, not a spec citation — but the safe-rate.js
       header describes exactly this kind of drift as the reason CORRECTION_MAX_RATE
       exists as a single source. Kept here as a tripwire. */
    expect(SAFE_DAILY_RISE.alkalinity).toBe(CORRECTION_MAX_RATE.alkalinity);
    expect(SAFE_DAILY_RISE.calcium).toBe(CORRECTION_MAX_RATE.calcium);
    expect(SAFE_DAILY_RISE.magnesium).toBe(CORRECTION_MAX_RATE.magnesium);
  });
});

describe('§3 hard cap — no recommendation may imply a delta above the rail actually configured', () => {
  it('alkalinity: a huge raw correction is clamped so the implied dKH/24h never exceeds the coded rail', () => {
    const effect = 0.02; // dKH per mL
    const out = { currentDose: 10, maintenanceDose: 10 };
    const settings = { volumeL: 500 };
    /* `applied` is absurdly large so the raw candidate (currentDose + applied)
       sits far outside any sane band — this is the scenario the rail exists
       to catch. */
    const { next } = rateLimitDose(1000, out, alkDef, settings, effect);
    const impliedDeltaPerDay = Math.abs(next - out.currentDose) * effect;
    /* Precondition: the rail actually bound something — otherwise this proves
       nothing about the clamp. */
    expect(next).toBeLessThan(10 + 1000);
    expect(impliedDeltaPerDay).toBeLessThanOrEqual(SAFE_DAILY_RISE.alkalinity + 1e-9);
  });
});

describe('§3 — the rails are fixed; no user value may tighten one', () => {
  /* Until 14 Aug the canon carried a "[user] may tighten a rail" clause. It
     is withdrawn — reef-chemistry.md §3, "Decided 14 Aug: the rails are
     fixed. There is no user rail." — and no settings field for it ever
     existed (grepped across src/lib and src/components/Setup.jsx: no
     "increment", "rail", "maxDailyRise", or per-element rate-limit setting).
     `maxDailyRiseDKH` below is the name such a control would plausibly use;
     the point being tested is that NO such name — this one included —
     changes what rateLimitDose enforces. This is the regression test for the
     14 Aug decision: same inputs as the withdrawn-canon test this block
     replaces, opposite expectation. */
  it('a user-supplied rate-limit setting changes nothing — the fixed rail decides', () => {
    const effect = 0.02; // dKH per mL
    const out = { currentDose: 10, maintenanceDose: 10 };
    const plain = { volumeL: 500 };
    const withUserRail = { volumeL: 500, maxDailyRiseDKH: 0.2 };  // a stricter 0.2 dKH/24h ask
    const { next: nextPlain } = rateLimitDose(1000, out, alkDef, plain, effect);
    const { next: nextWithRail } = rateLimitDose(1000, out, alkDef, withUserRail, effect);
    /* Identical output with and without the field: the setting is inert. */
    expect(nextWithRail).toBe(nextPlain);
    /* And the clamp that does apply is the fixed §3 rail, not the user's 0.2. */
    const impliedDeltaPerDay = Math.abs(nextWithRail - out.currentDose) * effect;
    expect(impliedDeltaPerDay).toBeLessThanOrEqual(SAFE_DAILY_RISE.alkalinity + 1e-9);
    expect(impliedDeltaPerDay).toBeGreaterThan(0.2 + 1e-9);
  });
});
