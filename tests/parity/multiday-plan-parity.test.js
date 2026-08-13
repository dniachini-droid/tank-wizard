/* §2 parity — a correction requiring a multi-day plan
 *
 * §2 requires identical inputs to produce "the recommended dose in mL,
 * after rounding and rails" and "whether a multi-day plan is required"
 * consistently. assessCalcium (src/lib/dosing/calcium.js) computes BOTH of
 * these from the same underlying gap (maintenanceDose - currentDose) but
 * through two different code paths that do not agree with each other:
 *
 *   out.recommendedDose  — the dose the wizard tells the user to set today,
 *                           via rateLimitDose + applyDoseConstraints, which
 *                           includes the step cap (capDoseStep,
 *                           DOSE_STEP_CAP = 25% of currentDose,
 *                           src/lib/dosing/helpers.js:49-60).
 *   out.plan              — the staged multi-day sequence, built in a
 *                           separate loop (calcium.js:588-596) using its own
 *                           `urgent ? 0.6 : 0.5` multiplier and never
 *                           calling capDoseStep, rateLimitDose or
 *                           applyDoseConstraints at all.
 *
 * Both numbers claim to answer "what should the first step of this
 * correction be" for the identical assessment. This file establishes, with
 * the multiDayPlanFixture (verified: currentDose 6 mL/day, maintenanceDose
 * ~9.93 mL/day, staged: true), that they disagree — and then follows the
 * number into DoseChangeSheet, the manual-adjustment surface, which is
 * pre-filled from `recommended` and separately displays `plan[1]` as "the
 * next step," so a user opening the sheet sees a first-day figure that
 * doesn't match the plan array's own first entry.
 */
import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import React from 'react'
import { assessCalcium } from '../../src/lib/dosing/calcium.js'
import { DoseChangeSheet } from '../../src/components/DoseChangeSheet.jsx'
import { multiDayPlanFixture } from './fixtures.js'

describe('precondition — multiDayPlanFixture really does produce a staged, multi-day plan', () => {
  it('assessCalcium reports staged: true with a plan array of more than one step', () => {
    const { def, readings, settings } = multiDayPlanFixture;
    const out = assessCalcium({ readings, doseLog: [], waterChanges: [], settings, def, now: null });
    expect(out.ok).toBe(true);
    expect(out.staged).toBe(true);
    expect(out.plan.length).toBeGreaterThan(1);
  });
});

describe('SPEC VIOLATION (§2, S2): recommendedDose and plan[0] disagree about the first step of the same staged correction', () => {
  it('per §2, "the recommended dose in mL" must be the same number wherever the app states the first step of the plan', () => {
    const { def, readings, settings } = multiDayPlanFixture;
    const out = assessCalcium({ readings, doseLog: [], waterChanges: [], settings, def, now: null });
    expect(out.plan[0]).toBe(out.recommendedDose);
  });

  it('confirms the actual numbers: recommendedDose is step-capped to 7.5 mL/day, but plan[0] is a different, uncapped 8.4 mL/day', () => {
    const { def, readings, settings } = multiDayPlanFixture;
    const out = assessCalcium({ readings, doseLog: [], waterChanges: [], settings, def, now: null });
    expect(out.currentDose).toBe(6);
    expect(out.recommendedDose).toBe(7.5);   // rateLimitDose + capDoseStep applied
    expect(out.plan[0]).toBe(8.4);           // the staged-steps loop, capDoseStep never applied
    expect(out.stepCapped).toBeTruthy();     // proof the cap really did engage for recommendedDose
    expect(out.stepCapped.wanted).not.toBe(out.plan[0]); // and the plan step isn't even the pre-cap figure either
  });
});

describe('§2 — DoseChangeSheet (manual surface) inherits only one of the two numbers, and displays the other as "the next step" without reconciling them', () => {
  it('the sheet pre-fills the input from recommendedDose (7.5), not from plan[0] (8.4)', () => {
    const { def, readings, settings } = multiDayPlanFixture;
    const out = assessCalcium({ readings, doseLog: [], waterChanges: [], settings, def, now: null });
    render(React.createElement(DoseChangeSheet, {
      def, element: 'calcium', current: out.currentDose,
      recommended: out.recommendedDose, suggested: out.recommendedDose,
      plan: out.plan, onCancel: () => {}, onSave: () => {},
    }));
    const amountInput = screen.getByRole('spinbutton');
    expect(amountInput.value).toBe(String(out.recommendedDose));
  });

  it('the sheet\'s own "first of N steps" note refers to plan[1] as "the next" step after whatever was just pre-filled — silently treating a 7.5 mL/day fill as step one of a plan whose own array says step one is 8.4', () => {
    const { def, readings, settings } = multiDayPlanFixture;
    const out = assessCalcium({ readings, doseLog: [], waterChanges: [], settings, def, now: null });
    render(React.createElement(DoseChangeSheet, {
      def, element: 'calcium', current: out.currentDose,
      recommended: out.recommendedDose, suggested: out.recommendedDose,
      plan: out.plan, onCancel: () => {}, onSave: () => {},
    }));
    // DoseChangeSheet.jsx:54-58: "This is the first of {plan.length} steps.
    // The next is worked out... so it may differ from {plan[1]} mL."
    expect(screen.getByText(/first of 2 steps/i)).toBeInTheDocument();
    expect(document.body.textContent).toMatch(/9\.90? mL/); // plan[1], via fmtAmount
    // Nowhere on the sheet does 8.4 (plan[0], the plan's own idea of step
    // one) appear at all — the two numbers for "step one" never meet.
    expect(document.body.textContent).not.toMatch(/8\.4/);
  });
});
