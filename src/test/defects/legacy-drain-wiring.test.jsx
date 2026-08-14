/* Defect — `drainLegacyStore` was written, tested and then never called.
 *
 * `c7ed9d0`/`ee64a23` removed the localStorage shim, which moved every read
 * from the legacy `reefconsole:` prefix to the `danstank:` mirror.
 * `src/lib/storage.js:71` carries an install's data across that move, and
 * `src/test/defects/storage-double-write.test.js` pins its behaviour in
 * detail — but nothing in `src/App.jsx` or `src/main.jsx` ever ran it. The
 * only references were the test file above and `src/test-surface.js:276`, so
 * the migration passed its own tests on every run while doing nothing
 * whatsoever on a real device.
 *
 * What that costs is not theoretical. The pre-shim `saveKey` ignored the
 * mirror's return value (`lsSet(key, value); return true;`), so a quota
 * failure left the bridge copy correct and the mirror stale, silently. ICP
 * report photos sat inline in localStorage until `c7ed9d0` moved them to
 * IndexedDB, which is exactly the pressure that produces those failures. Every
 * such key now reads its older copy.
 *
 * A custom target range is the clearest case of the harm, and the one that
 * prompted this: `custom-ranges` going missing does not show an error or an
 * empty screen. `App.jsx:388` falls back to `PARAM_DEFS`, and the band reverts
 * to the shipped default — for phosphate, back to 0.03-0.10 — with nothing on
 * screen to say a setting was lost.
 *
 * These tests exercise the wiring through a real mount rather than by calling
 * the drain directly, because the wiring is the whole defect: every assertion
 * here passed on the drain itself before this fix existed.
 */
import { render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { ReefConsoleInner } from '../../App.jsx'
import { LEGACY_PREFIX, LS_PREFIX, lsGet } from '../../lib/storage.js'

/* Dan's own case: a phosphate band tightened by hand, well inside the shipped
   0.03-0.10, so a revert to the default is unmistakable in either direction. */
const CUSTOM = { phosphate: { min: 0.05, max: 0.12 } }

const started = () =>
  waitFor(() => expect(screen.queryByText(/loading reef console/i)).not.toBeInTheDocument())

const keysWith = (prefix) => {
  const out = []
  for (let i = 0; i < window.localStorage.length; i++) {
    const k = window.localStorage.key(i)
    if (k && k.startsWith(prefix)) out.push(k)
  }
  return out
}

beforeEach(() => localStorage.clear())
afterEach(() => localStorage.clear())

describe('the legacy store is drained at startup, before anything is read', () => {
  it('keeps a custom target range whose mirror went stale', async () => {
    window.localStorage.setItem(LEGACY_PREFIX + 'custom-ranges', JSON.stringify(CUSTOM))
    window.localStorage.setItem(LS_PREFIX + 'custom-ranges', JSON.stringify({}))

    render(<ReefConsoleInner />)
    await started()

    expect(lsGet('custom-ranges')).toEqual(CUSTOM)
    expect(keysWith(LEGACY_PREFIX)).toEqual([])
  })

  it('shows the custom band rather than the shipped default', async () => {
    window.localStorage.setItem(LEGACY_PREFIX + 'custom-ranges', JSON.stringify(CUSTOM))
    window.localStorage.setItem(LS_PREFIX + 'custom-ranges', JSON.stringify({}))
    window.localStorage.setItem(LEGACY_PREFIX + 'readings', JSON.stringify([
      { id: 'p1', param: 'phosphate', value: 0.08, date: '2026-08-13', note: '' },
    ]))

    render(<ReefConsoleInner />)
    await started()

    /* The dashboard card's gauge is labelled with the band's own edges, so
       the card is where a lost custom range shows up first — no navigation,
       no modal, just the number Dan reads at a glance. Other buttons mention
       phosphate (the overdue-test alert, the reminder row), so match the card
       by the label it leads with. */
    const card = screen.getAllByRole('button').find((b) => /^Phosphate/.test(b.textContent || ''))

    /* Before the fix these are 0.03 and 0.10 — the shipped default standing in
       for a setting that was on the device the whole time. */
    expect(card.textContent).toContain('0.05')
    expect(card.textContent).toContain('0.12')
    expect(card.textContent).not.toContain('0.03')
  })

  it('carries over a key that never had a mirror at all', async () => {
    window.localStorage.setItem(LEGACY_PREFIX + 'custom-ranges', JSON.stringify(CUSTOM))

    render(<ReefConsoleInner />)
    await started()

    expect(lsGet('custom-ranges')).toEqual(CUSTOM)
  })

  it('leaves an install with nothing under the old prefix exactly as it was', async () => {
    window.localStorage.setItem(LS_PREFIX + 'custom-ranges', JSON.stringify(CUSTOM))

    render(<ReefConsoleInner />)
    await started()

    expect(lsGet('custom-ranges')).toEqual(CUSTOM)
    expect(keysWith(LEGACY_PREFIX)).toEqual([])
  })
})
