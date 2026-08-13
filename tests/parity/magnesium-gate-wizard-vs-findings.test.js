/* §2 parity + reef-chemistry.md §5 "magnesium gate"
 *
 * §5 (quoted in src/test/spec/classification/alert-thresholds.test.js):
 *   "Low magnesium destabilises both alk and calcium... If magnesium is
 *    below alert-low, the app does not recommend alk or calcium corrections
 *    until magnesium is addressed."
 *
 * src/test/spec/classification/alert-thresholds.test.js already establishes,
 * with a failing test, that `computeDoseAdvice` (the findings/Insights
 * engine, src/lib/analytics/drift.js) does NOT implement this gate either —
 * re-run below as this file's own precondition rather than assumed, per the
 * "do not infer parity from reading the code" rule.
 *
 * What that file does not check is the surface a user actually acts on to
 * change a dose: the Dosing Wizard, which App.jsx builds directly from
 * `assessAlkalinity`/`assessCalcium` (src/App.jsx:148-150,
 * `assess("alkalinity", assessAlkalinity, plans.alk)`) with no magnesium
 * argument anywhere in the call signature. Per §2, "given identical
 * inputs... same history... all three [dosing] surfaces must produce the
 * same numbers and the same classification" — specifically "whether the app
 * refuses to advise, and the reason."
 *
 * This file's contribution: the gap is not confined to one engine. Two
 * independently-written engines — assessAlkalinity's own trend arithmetic
 * and computeDoseAdvice's separate drift arithmetic — agree with each other
 * (no cross-surface CONTRADICTION), but they agree in the direction the spec
 * forbids: both recommend acting on alkalinity while magnesium sits below
 * its alert-low, with neither ever mentioning magnesium. That is worse than
 * a disagreement between two surfaces, because nothing in the app catches it
 * — there is no second opinion to catch the first one being wrong.
 *
 * Fixture is the exact one from alert-thresholds.test.js's worked example 4:
 * magnesium 1180 -> 1140 (below alert-low 1150), alkalinity falling
 * 7.9 -> 7.4 over 6 days, volumeL 100 — kept byte-identical to that file's
 * fixture rather than re-derived, so this file's precondition is the same
 * fixture another Wave A auditor already verified, not a new one that might
 * happen to land differently.
 */
import { describe, expect, it } from 'vitest'
import { assessAlkalinity } from '../../src/lib/dosing/alkalinity.js'
import { assessCalcium } from '../../src/lib/dosing/calcium.js'
import { computeDoseAdvice } from '../../src/lib/analytics/drift.js'
import { PARAM_DEFS } from '../../src/lib/constants.js'
import { mgGateFixture, alkDef } from './fixtures.js'

const { allReadings, alkReadings, settings } = mgGateFixture;

describe('precondition — re-confirms alert-thresholds.test.js: computeDoseAdvice (findings engine) has no magnesium gate either', () => {
  it('taken alone, the alkalinity trend would call for a dose adjustment', () => {
    const adviceNoMg = computeDoseAdvice(alkReadings, [], PARAM_DEFS, null, settings);
    expect(adviceNoMg.advice.alkalinity.status).toBe('adjust');
  });

  it('with the below-alert-low magnesium rows included in the same history, computeDoseAdvice still says "adjust" — the gate does not fire here either', () => {
    const advice = computeDoseAdvice(allReadings, [], PARAM_DEFS, null, settings);
    expect(advice.advice.alkalinity.status).toBe('adjust');
  });
});

describe('SPEC VIOLATION (§5 magnesium gate, S1): assessAlkalinity — the function the real Dosing Wizard renders — must defer or refuse while magnesium is below alert-low', () => {
  it('given the identical full reading history (including the below-alert-low magnesium rows), assessAlkalinity must not recommend increasing the alkalinity dose', () => {
    // What §5 requires of ANY surface computing an alkalinity recommendation
    // while magnesium sits below its alert-low.
    const out = assessAlkalinity({ readings: allReadings, doseLog: [], waterChanges: [], settings, def: alkDef, now: null });
    expect(out.action).not.toBe('increase');
  });

  it('confirms what the Dosing Wizard does instead: recommends increasing the alkalinity dose while magnesium sits below alert-low, without mentioning magnesium', () => {
    // App.jsx wires assessAlkalinity with `readings` — the whole log,
    // magnesium included (src/App.jsx:145: `fn2({ readings, doseLog,
    // waterChanges, settings, def, plan, corrections, correctionPlans })`)
    // — and renders `out.action`/`out.recommendedDose` directly as the
    // Wizard's headline recommendation (state.js's doseStatus, "suggested"
    // branch reads `a.action`/`a.recommendedDose` straight off this object).
    // This is the actual number a user would act on.
    const out = assessAlkalinity({ readings: allReadings, doseLog: [], waterChanges: [], settings, def: alkDef, now: null });
    expect(out.action).toBe('increase');
    expect(out.recommendedDose).toBeGreaterThan(out.currentDose);
    expect(out.explanation.toLowerCase()).not.toMatch(/magnesium/); // never names the reason §5 requires
  });

  it('the magnesium rows in the readings array make literally no difference to assessAlkalinity\'s output — the function does not read them', () => {
    const withMg = assessAlkalinity({ readings: allReadings, doseLog: [], waterChanges: [], settings, def: alkDef, now: null });
    const withoutMg = assessAlkalinity({ readings: alkReadings, doseLog: [], waterChanges: [], settings, def: alkDef, now: null });
    expect(withMg.action).toBe(withoutMg.action);
    expect(withMg.recommendedDose).toBe(withoutMg.recommendedDose);
  });
});

describe('the same gap in assessCalcium, for completeness (§5 names both alk and calcium)', () => {
  it('assessCalcium is likewise unaffected by a below-alert-low magnesium reading in the same history', () => {
    const caDef = PARAM_DEFS.find((d) => d.key === 'calcium');
    const caReadings = [
      { id: 'c1', param: 'calcium', date: '2026-07-01', value: 430 },
      { id: 'c2', param: 'calcium', date: '2026-07-15', value: 415 },
      { id: 'c3', param: 'calcium', date: '2026-07-29', value: 400 },
      { id: 'c4', param: 'calcium', date: '2026-08-12', value: 385 },
    ];
    const withMg = assessCalcium({ readings: [...caReadings, ...mgGateFixture.mgReadings], doseLog: [], waterChanges: [], settings, def: caDef, now: null });
    const withoutMg = assessCalcium({ readings: caReadings, doseLog: [], waterChanges: [], settings, def: caDef, now: null });
    expect(withMg.action).toBe(withoutMg.action);
    expect(withMg.recommendedDose).toBe(withoutMg.recommendedDose);
  });
});
