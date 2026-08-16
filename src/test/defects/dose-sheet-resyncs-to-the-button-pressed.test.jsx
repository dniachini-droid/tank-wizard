/* TW-036 (.agent/items/, 2026-08-14 consistency sweep) — the dose sheet
 * can record a number the user did not pick.
 *
 * `DoseChangeSheet` seeded its amount field once, with `useState(String(...))`
 * at DoseChangeSheet.jsx:17, and never looked at the `recommended` prop again.
 * A staged plan offers two shortcuts side by side — "Step to X" and "Go to Y"
 * (ErrorBoundary.jsx:209,212) — and both open the same already-mounted,
 * unkeyed sheet, so tapping one and then the other leaves the field holding
 * the FIRST figure while the button just pressed claims the second. Pressing
 * Record then writes the number that was not chosen, to the dose log and to
 * every engine that reads it.
 *
 * The general case is the same bug with no taps at all: any re-render that
 * moves `recommended` — a new reading landing while the sheet is open — leaves
 * the field on the stale figure.
 *
 * In plain terms: you weigh up the small step, change your mind, tap "go
 * straight to the full dose", and unless you happen to look at the box again,
 * the dose you record is the small one.
 *
 * spec: docs/spec/wizard-states.md §12/§16 — the recorded dose must match what
 * the wizard just told the user.
 */
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { AlkAssessmentBlock } from '../../components/ErrorBoundary.jsx'
import { DoseChangeSheet } from '../../components/DoseChangeSheet.jsx'
import { PARAM_DEFS } from '../../lib/constants.js'

const DEF = PARAM_DEFS.find((d) => d.key === 'alkalinity')

/* The staged plan from the backlog's own repro: three steps, 7.5 now and 9.9
   at the end, with both shortcuts on screen. */
const STAGED = {
  element: 'alkalinity',
  action: 'increase',
  currentDose: 5,
  recommendedDose: 7.5,
  maintenanceDose: 9.9,
  staged: true,
  plan: [7.5, 8.4, 9.9],
  explanation: 'Alkalinity is below the band and the dose does not account for it.',
  consumption: 0.5,
  effectPerMl: 0.04,
  current: { value: 7.1, date: '2026-08-14', time: '08:00' },
  /* The summary rows the block always draws, so the component renders at all.
     `target` here is the band, which is the shape this branch reads — see
     TW-035 for the field's other meaning elsewhere. */
  targetRange: { min: DEF.min, max: DEF.max },
  used: [
    { param: 'alkalinity', date: '2026-08-10', time: '08:00', value: 7.0 },
    { param: 'alkalinity', date: '2026-08-14', time: '08:00', value: 7.1 },
  ],
}

const amountField = () => screen.getByLabelText(/amount \(mL\/day\)/i)

describe('the staged-plan shortcuts and the amount field agree', () => {
  it('re-syncs to the second shortcut when it is tapped with the sheet already open', () => {
    render(<AlkAssessmentBlock a={STAGED} def={DEF} onApplyDose={() => {}} />)

    fireEvent.click(screen.getByRole('button', { name: /step to 7\.50/i }))
    expect(amountField()).toHaveValue(7.5)

    fireEvent.click(screen.getByRole('button', { name: /go to 9\.90/i }))
    expect(amountField()).toHaveValue(9.9)
  })

  it('records the figure on the button last pressed, not the one before it', () => {
    const onApplyDose = vi.fn()
    render(<AlkAssessmentBlock a={STAGED} def={DEF} onApplyDose={onApplyDose} />)

    fireEvent.click(screen.getByRole('button', { name: /step to 7\.50/i }))
    fireEvent.click(screen.getByRole('button', { name: /go to 9\.90/i }))
    fireEvent.click(screen.getByRole('button', { name: /record/i }))

    expect(onApplyDose).toHaveBeenCalledTimes(1)
    expect(onApplyDose.mock.calls[0][0]).toBe(9.9)
  })

  it('goes back down again when the smaller step is tapped second', () => {
    render(<AlkAssessmentBlock a={STAGED} def={DEF} onApplyDose={() => {}} />)

    fireEvent.click(screen.getByRole('button', { name: /go to 9\.90/i }))
    expect(amountField()).toHaveValue(9.9)

    fireEvent.click(screen.getByRole('button', { name: /step to 7\.50/i }))
    expect(amountField()).toHaveValue(7.5)
  })
})

describe('the amount field follows the recommendation it is showing', () => {
  it('re-syncs when the advice changes underneath an open sheet', () => {
    const { rerender } = render(
      <DoseChangeSheet def={DEF} element="alkalinity" current={5} recommended={9.9}
        suggested={9.9} onCancel={() => {}} onSave={() => {}} />)

    expect(amountField()).toHaveValue(9.9)

    rerender(
      <DoseChangeSheet def={DEF} element="alkalinity" current={5} recommended={14.2}
        suggested={14.2} onCancel={() => {}} onSave={() => {}} />)

    expect(amountField()).toHaveValue(14.2)
  })

  it('leaves a hand-typed amount alone while the recommendation stays put', () => {
    const { rerender } = render(
      <DoseChangeSheet def={DEF} element="alkalinity" current={5} recommended={9.9}
        suggested={9.9} onCancel={() => {}} onSave={() => {}} />)

    fireEvent.change(amountField(), { target: { value: '8.2' } })
    rerender(
      <DoseChangeSheet def={DEF} element="alkalinity" current={5} recommended={9.9}
        suggested={9.9} plan={[9.9]} onCancel={() => {}} onSave={() => {}} />)

    expect(amountField()).toHaveValue(8.2)
  })
})
