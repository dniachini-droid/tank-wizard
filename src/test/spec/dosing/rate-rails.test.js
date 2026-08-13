/* Spec conformance — §6 rate-of-change rails as HARD CAPS
 *
 * Spec anchor: docs/spec/reef-chemistry.md §6, lines 149-166 —
 *   "Any recommendation exceeding a rail is a bug, not a preference. Enforced
 *   in logic, not merely displayed."
 *   | Rail | Default per 24 h |
 *   | Alkalinity | 0.5 dKH |
 *   | Calcium | 25 ppm |
 *   | Magnesium | 100 ppm |
 *   "[user] may tighten a rail. The app never permits loosening beyond the
 *   default."
 *
 * These tests exercise the rail directly through the exported primitives
 * (`rateLimitDose` from alkalinity.js, and the constants that feed it) rather
 * than through a full assessment, because the rail's job is narrow and
 * mechanical: given a raw candidate dose, never let the implied level change
 * exceed the per-24h ceiling.
 */
import { describe, expect, it } from 'vitest'
import { SAFE_DAILY_RISE, CORRECTION_MAX_RATE } from '../../../lib/analytics/safe-rate.js'
import { rateLimitDose } from '../../../lib/dosing/alkalinity.js'

const alkDef = { key: 'alkalinity', label: 'Alkalinity', unit: 'dKH', min: 8.5, max: 9.5, step: 0.1 }

describe('§6 rail defaults must match the canon table verbatim', () => {
  /* Alkalinity's default is correct — included so the file documents the one
     parameter that is NOT in violation, rather than silently skipping it. */
  it('alkalinity default rail is 0.5 dKH/24h', () => {
    expect(SAFE_DAILY_RISE.alkalinity).toBe(0.5)
  });

  /* reef-chemistry.md:157 — "Calcium | 25 ppm". The app enforces 20, sourced
     in analytics/safe-rate.js from "reefcalcs calls 20 the safe rate" — a
     deliberate, reasoned choice, but not the number the canon states. Whether
     20 or 25 is correct is a [chem] question for spec-challenges.md; as
     written, the two disagree. */
  it('calcium default rail is 25 ppm/24h per canon (code enforces 20)', () => {
    expect(SAFE_DAILY_RISE.calcium).toBe(25);
  });

  /* reef-chemistry.md:158 — "Magnesium | 100 ppm". The app enforces 25, a
     4x tighter ceiling than canon states. */
  it('magnesium default rail is 100 ppm/24h per canon (code enforces 25)', () => {
    expect(SAFE_DAILY_RISE.magnesium).toBe(100);
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

describe('§6 hard cap — no recommendation may imply a delta above the rail actually configured', () => {
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

describe('§6 — a user may tighten a rail; the app must honour it', () => {
  /* There is no settings field anywhere in the codebase for this (grepped
     across src/lib and src/components/Setup.jsx: no "increment", "rail",
     "maxDailyRise", or per-element rate-limit setting exists at all).
     `maxDailyRiseDKH` below is a reasonable, spec-legal name a user-facing
     control would use; the point being tested is that NO such name — this
     one included — changes what rateLimitDose enforces, because the function
     never reads settings for a rate limit at all. It only ever consults the
     hardcoded SAFE_DAILY_RISE constant. */
  it('a tighter user-configured alkalinity rail is not honoured', () => {
    const effect = 0.02; // dKH per mL
    const out = { currentDose: 10, maintenanceDose: 10 };
    const settings = { volumeL: 500, maxDailyRiseDKH: 0.2 };  // user asks for a stricter 0.2 dKH/24h cap
    const { next } = rateLimitDose(1000, out, alkDef, settings, effect);
    const impliedDeltaPerDay = Math.abs(next - out.currentDose) * effect;
    /* Spec requires the tighter, user-set 0.2 dKH/24h ceiling to win. The app
       has no mechanism to read it, so this fails: the dose is clamped only to
       the hardcoded default (0.5), not to what the user asked for. */
    expect(impliedDeltaPerDay).toBeLessThanOrEqual(0.2 + 1e-9);
  });
});
