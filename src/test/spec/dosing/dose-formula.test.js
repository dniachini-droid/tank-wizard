/* Spec conformance — §7 dose formula and §7.5 recommendation completeness
 *
 * Spec anchor: docs/spec/reef-chemistry.md §7, lines 169-189 —
 *   "dose_mL = (target - current) * net_volume_L / potency"
 *   1. "Convert units first. Round last. Never round an intermediate value."
 *   5. "Every recommendation states: product, potency used, net volume
 *      assumed, mL, expected delta, days to target."
 *
 * §10 worked example 1 (reef-chemistry.md:222-226):
 *   "GIVEN net 68 L, alk 7.6, target 8.5, product potency such that 1 mL
 *   raises 68 L by 0.0147 dKH THEN total need 0.9 dKH = 61 mL; exceeds the
 *   0.5 dKH/day rail -> 2-day plan; day one capped at 0.5 dKH = 34 mL,
 *   rounded DOWN to the doser increment; flagged 'multi-day correction'"
 */
import { describe, expect, it } from 'vitest'
import { proposeCorrection } from '../../../lib/dosing/helpers.js'
import { rateLimitDose } from '../../../lib/dosing/alkalinity.js'

const alkDef = { key: 'alkalinity', label: 'Alkalinity', unit: 'dKH', min: 8.0, max: 9.0, step: 0.1 }

describe('§10 worked example 1 — the core arithmetic, run through the app\'s own correction planner', () => {
  /* proposeCorrection is the function that turns "level X, target Y" into a
     capped, rail-aware correction — the closest in-scope match to the worked
     example's shape. `pace: 'quick'` runs at exactly the rail (1.0x
     CORRECTION_MAX_RATE.alkalinity = 0.5 dKH/day), which is what the worked
     example describes ("capped at 0.5 dKH"). */
  const a = {
    current: { value: 7.6, date: '2026-08-13' },
    effectPerMl: 0.0147,
    maintenanceDose: 0,   // isolates the correction delta from any baseline maintenance dose
    currentDose: 0,
    correctionInProgress: null,
    lastCorrectionPlanAt: null,
    lastDoseChangeAt: null,
  };

  const result = proposeCorrection(a, alkDef, {}, 'quick');

  it('computes a 2-day plan (0.9 dKH / 0.5 dKH-per-day rail)', () => {
    expect(result).not.toBeNull();
    expect(result.days).toBe(2);
  });

  it('day-one dose matches the worked example\'s 34 mL', () => {
    expect(result.dose).toBe(34.0);
  });

  /* §6, line 164: "A correction needing more than one day is presented as a
     multi-day plan ... never as a single dose the user might administer at
     once." §10 example 1 explicitly requires the result be "flagged
     'multi-day correction'". proposeCorrection returns `days: 2` as a bare
     number with no boolean/flag/label marking the recommendation as a
     multi-day plan rather than a single administrable dose — nothing
     distinguishes it from a one-day correction at the API level. */
  it('is flagged as a multi-day correction, not just a numeric day count', () => {
    expect(result.multiDay).toBe(true);
  });
});

describe('§7 rule 1 — round last, never round an intermediate value', () => {
  /* rateLimitDose reports what it clamped via `out.rateLimited = { wanted,
     allowed, ... }`. "wanted" is supposed to be what the maths actually
     pointed to before the rail intervened — the number a user reads as "the
     app wanted to give you N mL but the safe rate only allows M". But the
     value stored as `wanted` is `next`, which was already rounded to the
     nearest 0.1 mL *before* being compared against the rail and before being
     recorded — an intermediate rounding of the very figure the reasoning
     chain is built on. */
  it('the reported "wanted" dose is the precise raw figure, not a pre-rounded one', () => {
    const effect = 0.02; // dKH per mL
    const currentDose = 10;
    const applied = 25.37;                    // deliberately not a multiple of 0.1
    const raw = currentDose + applied;         // the true, unrounded "wanted" figure
    const out = { currentDose, maintenanceDose: currentDose }; // band = [currentDose-25, currentDose+25]
    const settings = { volumeL: 1000 };

    const { next } = rateLimitDose(applied, out, alkDef, settings, effect);

    /* Precondition: the rail actually clamped this dose, so `out.rateLimited`
       exists and this test is exercising the path it claims to. */
    expect(out.rateLimited).toBeTruthy();
    expect(next).not.toBe(raw);

    /* Spec-correct: the figure quoted as "wanted" should be the true
       pre-clamp value (raw), converted but not rounded, because rounding is
       reserved for the very last step. */
    expect(out.rateLimited.wanted).toBe(raw);
  });
});

describe('§7 rule 5 — every recommendation states product, potency, net volume, mL, expected delta, days to target', () => {
  it('proposeCorrection\'s result names none of product, potency, or net volume', () => {
    const a = {
      current: { value: 7.6, date: '2026-08-13' },
      effectPerMl: 0.0147,
      maintenanceDose: 0,
      currentDose: 0,
      correctionInProgress: null,
      lastCorrectionPlanAt: null,
      lastDoseChangeAt: null,
    };
    const result = proposeCorrection(a, alkDef, { volumeL: 68 }, 'quick');
    expect(result).not.toBeNull();
    /* §7.5 requires all six be stated on the recommendation. `dose` (mL) and
       `days` (days to target) are present; product, potency, and net volume
       assumed are not represented anywhere on the object at all. */
    expect(result.product).toBeDefined();
    expect(result.potency).toBeDefined();
    expect(result.netVolumeL).toBeDefined();
  });
});
