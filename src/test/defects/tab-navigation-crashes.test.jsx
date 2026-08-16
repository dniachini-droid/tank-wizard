/* Defect (Phase 5 findings, .agent/findings.md) — two dead-code crashes caught
 * by linkcheck/propcheck (advisory) but never fixed:
 *
 *   src/App.jsx:1275   onOpenDosing={(key) => goTo({ tab: "dosing", key })}
 *   src/components/Tasks.jsx:198   onComplete={(id) => { onComplete(id); ... }}
 *
 * `goTo` is declared only inside Dashboard.jsx's own body — a different
 * component — so App.jsx's root (ReefConsoleInner) throws a ReferenceError
 * the instant a user taps "Open the Dosing Wizard" from the log-result popup.
 * Tasks.jsx declares `onMarkDone`, not `onComplete`, so its ReminderSheet's
 * "Mark done" button throws the same way.
 *
 * Routine 15, bug 1. Both wiring bugs, one file, per the routine's own
 * "your call, they're small" note — same class of bug, same checkers found
 * both.
 */
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ReefConsoleInner } from '../../App.jsx'
import { Tasks } from '../../components/Tasks.jsx'

describe('App.jsx:1275 — onOpenDosing no longer calls a nonexistent goTo', () => {
  beforeEach(() => localStorage.clear())
  afterEach(() => localStorage.clear())

  it('opening the Dosing Wizard from the log-result popup does not throw', async () => {
    // An active alkalinity correction is what makes readingVerdict return
    // goto: "dosing" without needing days of dose-change history — the
    // shortest real path to the crashing button.
    localStorage.setItem('danstank:correction-plans', JSON.stringify({
      alkalinity: {
        target: 8.5, returnDose: 9, startedAt: '2026-08-01 08:00',
        startValue: 6.0, pace: 'steady', dose: 15, days: 10,
      },
    }))
    // The dosing engines refuse to compute anything — including whether a
    // correction plan is active — without a tank volume (reef-chemistry.md
    // §17/§21/§12: deliberately no default). Setup already has one in the
    // real app; seed it the same way here.
    // The solution strength is the same case as of 16 August (§16): also
    // deliberately not shipped, also refused and named when absent. Without
    // it the popup offers no dosing button at all and this test would pass
    // vacuously, never reaching the navigation it exists to check.
    localStorage.setItem('danstank:tank-settings', JSON.stringify({
      volumeL: 77, dkhPerMlPer100L: 0.0533,
    }))

    render(<ReefConsoleInner />)
    await waitFor(() => expect(screen.queryByText(/loading reef console/i)).not.toBeInTheDocument())

    // Navigate to Test Lab (may appear twice — desktop sidebar + mobile nav).
    for (const btn of screen.getAllByRole('button', { name: /test lab/i })) fireEvent.click(btn)

    // Log an alkalinity reading below the 7 dKH safe floor while a
    // correction is running — the branch that sets goto: "dosing".
    // Alkalinity is the only parameter whose unit is "dKH", so its quick-entry
    // input is unambiguous even though "Alkalinity" text itself appears twice
    // (the Test Lab row and the history filter's <option>).
    const input = screen.getByPlaceholderText('dKH')
    fireEvent.change(input, { target: { value: '6' } })
    fireEvent.click(within(input.closest('div')).getByRole('button', { name: /^log$/i }))

    const openBtn = await screen.findByRole('button', { name: /open the dosing wizard|set the dose back/i })

    // Before the fix this throws ReferenceError: goTo is not defined — React
    // reports it as an uncaught exception from the click handler rather than
    // a synchronously catchable throw, so the proof is the tab actually
    // switching, not a try/catch around the click itself.
    fireEvent.click(openBtn)

    await waitFor(() => {
      expect(screen.getAllByRole('button', { name: /^dosing$/i })[0].className).toMatch(/teal/)
    })
  })
})

describe('Tasks.jsx:198 — ReminderSheet onComplete no longer calls itself', () => {
  const baseProps = {
    allTasks: [], taskLog: [],
    onAddCustom: vi.fn(), onDeleteCustom: vi.fn(),
    onAddWaterChange: vi.fn(), onDeleteWaterChange: vi.fn(),
    onSetReminderDue: vi.fn(), onSetReminderInterval: vi.fn(), onSkipReminder: vi.fn(),
    onUpdateReminder: vi.fn(), onNudgeReminder: vi.fn(),
    onAddReminder: vi.fn(), onDeleteReminder: vi.fn(),
  }
  const reminder = {
    id: 'r1', label: 'Top off', kind: 'task', intervalDays: 7,
    startDate: '2026-08-01', enabled: true,
  }

  it('tapping "Mark done" in the reschedule sheet calls onMarkDone, not a nonexistent onComplete', () => {
    const onMarkDone = vi.fn()
    render(<Tasks {...baseProps} onMarkDone={onMarkDone} reminders={[reminder]} />)

    fireEvent.click(screen.getByRole('button', { name: /change schedule/i }))
    const markDone = screen.getByRole('button', { name: /mark done/i })

    // Before the fix this throws ReferenceError: onComplete is not defined —
    // React reports it as an uncaught exception from the click handler rather
    // than a synchronously catchable throw, so the proof is that onMarkDone
    // was actually reached, not a try/catch around the click itself.
    fireEvent.click(markDone)
    expect(onMarkDone).toHaveBeenCalledWith('r1')
  })
})
