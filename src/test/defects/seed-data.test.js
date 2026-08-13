/* Defect 4 (inventory §6.4, §5.1) — fabricated readings merged into real data
 *
 * src/lib/seed-data.js holds ~325 invented readings dated 2026-02-13 to
 * 2026-08-09. src/App.jsx:452-464 pushes them into the `readings` key as
 * `{ id, param, value, date, note: "" }` — no seed flag, no source marker — and
 * saves them to the same storage key the user's own readings live in. They then
 * feed every consumption rate, trend, regression and therefore every
 * maintenance dose the app produces, and they are written into the backup file
 * and the CSV export. There is no way to un-seed them and no way to tell which
 * readings are real.
 *
 * Spec anchor: docs/spec/reef-chemistry.md §0 — "The app would rather say 'not
 * enough data' than produce a confident number from thin evidence", and every
 * recommendation shows its inputs; §9 — the app must refuse to "Substitute a
 * default for a missing measurement without saying so". A fabricated reading
 * standing in for a measurement nobody took is that substitution in its
 * strongest form.
 *
 * The assertion is deliberately neutral about the remedy: it passes if seeded
 * rows are flagged `seed: true`, and it passes if they are not written at all.
 * It fails only while they are indistinguishable from the user's own data.
 */
import { describe, expect, it, beforeEach } from 'vitest'
import { render, waitFor } from '@testing-library/react'
import React from 'react'
import { ReefConsole } from '../../App.jsx'
import { HISTORICAL_DATA } from '../../lib/seed-data.js'
import { lsGet } from '../../lib/storage.js'

const seedKeys = new Set(
  Object.entries(HISTORICAL_DATA).flatMap(([param, rows]) =>
    rows.map((row) => `${param}|${row.date}`)))

beforeEach(() => {
  /* A clean browser: nothing stored, so the seeders at App.jsx:449-506 run. */
  window.localStorage.clear()
  delete window.storage
})

describe('first run on a clean device', () => {
  it('does not merge fabricated readings into the user\'s own data unmarked', async () => {
    render(React.createElement(ReefConsole))

    /* Wait for the load effect to finish writing. */
    await waitFor(() => expect(lsGet('readings')).toBeInstanceOf(Array), { timeout: 5000 })
    await waitFor(() => expect(lsGet('historical-seeded')).toBe(true), { timeout: 5000 })

    const stored = lsGet('readings') || []
    const fabricated = stored.filter((r) => r && seedKeys.has(`${r.param}|${r.date}`))
    const unmarked = fabricated.filter((r) => r.seed !== true)

    /* Counted rather than listed, with a sample, so the failure is readable —
       there are 325 of them. */
    expect({
      count: unmarked.length,
      sample: unmarked.slice(0, 3).map((r) => `${r.param} ${r.date} = ${r.value}`),
    }).toEqual({ count: 0, sample: [] })
  })
})
