/* Regression test for the DosingWizard "no remount on element switch" family
 * (adjudicated.md items #7, #11; state-auditor S1/S3, dataflow-tracer S2).
 *
 * Root cause: the active-element detail panel in DosingWizard.jsx was
 * rendered without a `key` tied to `active.key`, so React reused the same
 * AlkAssessmentBlock/CorrectionPanel component instances (and their
 * internal useState) across an element switch instead of remounting them.
 * On top of that, CorrectionPanel was passed `def={active.def}` — a field
 * that does not exist on the `items` array entries — instead of the
 * already-computed `activeDef`, so it always returned null.
 *
 * (a) Stale mL amount (S1, dangerous): DoseChangeSheet seeds its mL input
 *     from useState once at mount. Switching elements while the dose-change
 *     sheet is open left the PREVIOUS element's recommended mL amount
 *     showing; recording at that point would log the wrong element's dose
 *     figure under the new element's key.
 * (b) CorrectionPanel dead code (S2): def={active.def} is always undefined,
 *     so CorrectionPanel's `if (!def) return null;` fired unconditionally —
 *     the entire temporary-correction UI (pace picker / refusal text) never
 *     rendered for any element.
 */
import { describe, expect, it } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import React from 'react'

const { DosingWizard } = await import('../../../components/DosingWizard.jsx');
const { PARAM_DEFS } = await import('../../../lib/constants.js');

function makeAssessment(overrides) {
  return {
    action: "increase",
    currentDose: 4,
    recommendedDose: 5.2,
    explanation: "test explanation",
    current: { value: 8.0 },
    target: { min: 8.5, max: 9.5 },
    used: [],
    maintenanceDose: 6,
    nextCheck: "Test again in 48 hours.",
    ...overrides,
  };
}

describe('DosingWizard — element switch remounts the active-element panel (adjudicated #7/#11)', () => {
  it('does not carry a stale mL amount across an element switch mid-dose-sheet', () => {
    const alkAssessment = makeAssessment({ element: "alkalinity", currentDose: 4, recommendedDose: 5.2 });
    const caAssessment = makeAssessment({ element: "calcium", currentDose: 30, recommendedDose: 40 });

    render(React.createElement(DosingWizard, {
      paramDefs: PARAM_DEFS,
      alkAssessment,
      caAssessment,
      mgAssessment: null,
      findings: [],
      onApplyAlkDose: () => {},
      onApplyCaDose: () => {},
      onApplyMgDose: () => {},
      onClearAlkPlan: () => {},
      onClearCaPlan: () => {},
      onClearMgPlan: () => {},
      onLogCorrection: () => {},
      onApplyEffect: () => {},
      onApplyCaEffect: () => {},
      onApplyMgEffect: () => {},
      correctionOffers: {},
      doseStates: [],
      onStartCorrection: () => {},
      onCancelCorrection: () => {},
      onFinishCorrection: () => {},
    }));

    // The wizard opens on the first element that needs attention: alkalinity.
    fireEvent.click(screen.getByRole('button', { name: /set the dose/i }));

    const mlInput = screen.getByLabelText(/amount \(ml\/day\)/i);
    expect(mlInput.value).toBe('5.2');

    // Switch to calcium WITHOUT closing the dose-change sheet first.
    fireEvent.click(screen.getByText('Calcium'));

    // The stale alkalinity figure must not still be on screen anywhere —
    // the panel (and its useState) must have remounted fresh, closing the
    // sheet rather than carrying "5.2" over under calcium's element key.
    expect(screen.queryByDisplayValue('5.2')).not.toBeInTheDocument();

    // Opening calcium's own dose sheet must prefill calcium's own figure,
    // not the previous element's.
    fireEvent.click(screen.getByRole('button', { name: /set the dose/i }));
    const caMlInput = screen.getByLabelText(/amount \(ml\/day\)/i);
    expect(caMlInput.value).toBe('40');
  });

  it('renders CorrectionPanel (not null) for the active element instead of always short-circuiting on def', () => {
    const alkAssessment = makeAssessment({ action: "hold" });

    render(React.createElement(DosingWizard, {
      paramDefs: PARAM_DEFS,
      alkAssessment,
      caAssessment: null,
      mgAssessment: null,
      findings: [],
      onApplyAlkDose: () => {},
      onApplyCaDose: () => {},
      onApplyMgDose: () => {},
      onClearAlkPlan: () => {},
      onClearCaPlan: () => {},
      onClearMgPlan: () => {},
      onLogCorrection: () => {},
      onApplyEffect: () => {},
      onApplyCaEffect: () => {},
      onApplyMgEffect: () => {},
      correctionOffers: {
        alkalinity: {
          steady: { possible: false, why: "Net volume is needed to calculate a safe correction pace." },
        },
      },
      doseStates: [],
      onStartCorrection: () => {},
      onCancelCorrection: () => {},
      onFinishCorrection: () => {},
    }));

    // Nothing needs attention (action "hold"), so open alkalinity explicitly.
    fireEvent.click(screen.getByText('Alkalinity'));

    // Before the fix, def={active.def} is always undefined and
    // CorrectionPanel's `if (!def) return null;` fires unconditionally —
    // none of this ever renders.
    expect(screen.getByText(/bringing it back/i)).toBeInTheDocument();
    expect(screen.getByText(/net volume is needed to calculate a safe correction pace/i)).toBeInTheDocument();
  });
});
