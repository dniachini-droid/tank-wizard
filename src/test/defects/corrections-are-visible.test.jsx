/* TW-034 (.agent/backlog.md, 2026-08-14 consistency sweep) — one-off dose
 * corrections feed the engines permanently and are written down nowhere.
 *
 * `logCorrection` (App.jsx:888-905) writes to its own `corrections` array,
 * which the dosing engines read for consumption-disturbance fitting and for
 * the pendingCorrection / repeatedCorrections gating (alkalinity.js:83,486,
 * 513,721,776,853; calcium.js:74,184-185), and which `buildFindings` reads
 * too. But the array reached no history surface, `buildCsv` had no parameter
 * for it (export-csv.js:5) and its one call site passed none (Setup.jsx:744),
 * and `deleteCorrection` (App.jsx:907) had no caller at all — so a correction
 * could not be reviewed, exported or removed once logged.
 *
 * Owner decision (2026-08-15): corrections appear in history as their own
 * entry type alongside readings and dose changes, and in the CSV export.
 *
 * In plain terms: you add a one-off dose to bring a parameter up, tap to log
 * it, and from then on the app uses it privately to explain your tank's
 * behaviour — while neither the app nor the spreadsheet you export can ever
 * show you that you did it. "Why did the consumption estimate jump last
 * month?" becomes unanswerable from your own records.
 */
import { fireEvent, render, screen, within } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { Setup } from '../../components/Setup.jsx'
import { PARAM_DEFS } from '../../lib/constants.js'
import { buildCsv } from '../../lib/export-csv.js'

const CORRECTIONS = [
  { id: 'c1', date: '2026-08-12', time: '14:30', element: 'alkalinity', ml: 24, direction: 'up' },
  { id: 'c2', date: '2026-08-04', time: '09:15', element: 'calcium', ml: 60, direction: 'up' },
]

function renderSetup(props = {}) {
  return render(
    <Setup settings={{ volumeL: 77 }} onSaveSettings={async () => {}} paramDefs={PARAM_DEFS}
      latestByParam={{}} readings={[]} onRestored={() => {}} onPlayIntro={() => {}}
      onAddDoseChange={async () => {}} onDeleteDoseChange={async () => {}}
      onAddLighting={async () => {}} onDeleteLighting={async () => {}}
      onRestoreFinding={() => {}} onRestoreAllFindings={() => {}}
      corrections={CORRECTIONS} {...props} />,
  )
}

beforeEach(() => {
  window.localStorage.clear()
  delete window.storage
})

/* The history blocks are collapsed until tapped, the same as Doser changes
   directly above. Open it and hand back the rows inside. */
async function openCorrections() {
  fireEvent.click((await screen.findByText(/one-off corrections/i)).closest('button'))
}

describe('a logged correction can be found again in the app', () => {
  it('lists it as its own kind of entry, not folded into the dose log', async () => {
    renderSetup()

    const block = await screen.findByText(/one-off corrections/i)
    expect(block).toBeInTheDocument()
    expect(screen.getByText(/2 corrections logged/i)).toBeInTheDocument()
  })

  it('says how much, of what, and when', async () => {
    renderSetup()
    await openCorrections()

    expect(screen.getByText(/24\.0 mL of alkalinity/i)).toBeInTheDocument()
    expect(screen.getByText(/60\.0 mL of calcium/i)).toBeInTheDocument()
    expect(screen.getByText(/12 Aug/i)).toBeInTheDocument()
  })

  it('shows nothing at all when none have been logged', () => {
    renderSetup({ corrections: [] })

    expect(screen.queryByText(/one-off corrections/i)).not.toBeInTheDocument()
  })
})

describe('a correction logged by mistake can be removed', () => {
  it('hands the row back to the delete function', async () => {
    const onDeleteCorrection = vi.fn()
    renderSetup({ onDeleteCorrection })
    await openCorrections()

    const row = screen.getByText(/24\.0 mL of alkalinity/i).closest('div.flex')
    fireEvent.click(within(row).getByRole('button', { name: /delete/i }))
    fireEvent.click(within(row).getByRole('button', { name: /delete\?/i }))

    expect(onDeleteCorrection).toHaveBeenCalledWith('c1')
  })
})

describe('the CSV export carries corrections too', () => {
  const base = { readings: [], icps: [], lighting: [], taskLog: [], doseLog: [], waterChanges: [], allTasks: [] }

  it('writes one row per correction, in the same shape as the other sections', () => {
    const csv = buildCsv({ ...base, corrections: CORRECTIONS })
    const lines = csv.split('\n')

    expect(lines.some((l) => l.startsWith('correction,2026-08-12,alkalinity correction,24,mL'))).toBe(true)
    expect(lines.some((l) => l.startsWith('correction,2026-08-04,calcium correction,60,mL'))).toBe(true)
  })

  it('writes the amount a correction downward actually was', () => {
    const csv = buildCsv({ ...base, corrections: [{ id: 'c3', date: '2026-08-01', element: 'alkalinity', ml: -12, direction: 'down' }] })

    expect(csv).toContain('correction,2026-08-01,alkalinity correction,-12,mL')
  })

  it('still builds when no corrections are passed at all', () => {
    expect(() => buildCsv(base)).not.toThrow()
  })
})
