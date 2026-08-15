/* TW-033, the half a user actually meets — the Setup restore panel.
 *
 * The engine-level guarantee lives in restore-rewrites-and-drops.test.js:
 * `restoreBackup` refuses to run when the file's target bands disagree with
 * the device's and no choice was passed. This file asserts the other half of
 * the owner decision (2026-08-15) — that the screen SHOWS both values and
 * makes the user pick, rather than defaulting quietly and reporting nothing.
 *
 * In plain terms: if the backup you are restoring was made when your
 * alkalinity target was 7.0–8.0 and today it is 8.0–9.0, the app has to say so
 * and ask which you meant, because whichever wins re-colours every test you
 * have ever logged.
 */
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { Setup } from '../../components/Setup.jsx'
import { loadKey, saveKey } from '../../lib/storage.js'

const DEVICE_RANGES = { alkalinity: { min: 8.0, max: 9.0 } }
const FILE_RANGES = { alkalinity: { min: 7.0, max: 8.0 } }

const BACKUP = {
  format: 'dans-tank-backup',
  version: 1,
  createdAt: '2026-08-10T09:00:00.000Z',
  data: {
    'custom-ranges': FILE_RANGES,
    readings: [{ id: 'r1', param: 'alkalinity', date: '2026-08-10', time: '08:00', value: 7.4 }],
  },
}

const PARAM_DEFS = [{ key: 'alkalinity', label: 'Alkalinity', unit: 'dKH', min: 8.0, max: 9.0, step: 0.1 }]

function renderSetup(onRestored = () => {}) {
  return render(
    <Setup settings={{ volumeL: 77 }} onSaveSettings={async () => {}} paramDefs={PARAM_DEFS}
      latestByParam={{}} readings={[]} onRestored={onRestored} onPlayIntro={() => {}}
      onAddDoseChange={async () => {}} onDeleteDoseChange={async () => {}}
      onAddLighting={async () => {}} onDeleteLighting={async () => {}}
      onRestoreFinding={() => {}} onRestoreAllFindings={() => {}}
      customRanges={DEVICE_RANGES} />,
  )
}

/* The backup panel opens itself when this device has no record of a backup,
   which is the state every test here starts in. The file arrives through the
   hidden input the "Restore from a backup" label wraps. */
async function offerBackup() {
  await screen.findByText(/restore from a backup/i)
  const input = document.querySelector('input[type="file"]')
  const file = new File([JSON.stringify(BACKUP)], 'backup.json', { type: 'application/json' })
  fireEvent.change(input, { target: { files: [file] } })
}

beforeEach(async () => {
  window.localStorage.clear()
  delete window.storage
  vi.spyOn(window, 'scrollTo').mockImplementation(() => {})
  await saveKey('custom-ranges', DEVICE_RANGES)
})

describe('the restore panel shows both targets and will not choose for you', () => {
  it('names the parameter and quotes both bands', async () => {
    renderSetup()
    await offerBackup()

    await screen.findByText(/targets are not the ones set here/i)
    const row = await screen.findByText(/Alkalinity/i, { selector: 'span.font-black' })
    expect(row.parentElement.textContent).toMatch(/here\s*8-9dKH|here\s*8–9dKH/)
    expect(row.parentElement.textContent).toMatch(/this file\s*7-8dKH|this file\s*7–8dKH/)
  })

  it('holds the Restore button shut until the choice is made', async () => {
    renderSetup()
    await offerBackup()

    const restore = await screen.findByRole('button', { name: /^restore$/i })
    expect(restore).toBeDisabled()

    fireEvent.click(screen.getByRole('button', { name: /keep the ones set here/i }))
    expect(restore).toBeEnabled()
  })

  it('leaves this device\'s targets alone when that is the choice, and says so', async () => {
    renderSetup()
    await offerBackup()

    fireEvent.click(await screen.findByRole('button', { name: /keep the ones set here/i }))
    fireEvent.click(screen.getByRole('button', { name: /^restore$/i }))

    await screen.findByText(/targets set on this device were kept/i)
    expect(await loadKey('custom-ranges', null)).toEqual(DEVICE_RANGES)
  })

  it('takes the file\'s targets when that is the choice, and says so', async () => {
    renderSetup()
    await offerBackup()

    fireEvent.click(await screen.findByRole('button', { name: /use the file's/i }))
    fireEvent.click(screen.getByRole('button', { name: /^restore$/i }))

    await screen.findByText(/targets now come from this file/i)
    await waitFor(async () => expect(await loadKey('custom-ranges', null)).toEqual(FILE_RANGES))
  })

  it('never claims nothing was overwritten', async () => {
    renderSetup()
    await offerBackup()

    fireEvent.click(await screen.findByRole('button', { name: /use the file's/i }))
    fireEvent.click(screen.getByRole('button', { name: /^restore$/i }))

    await screen.findByText(/targets now come from this file/i)
    expect(screen.queryByText(/nothing was overwritten/i)).not.toBeInTheDocument()
  })
})
