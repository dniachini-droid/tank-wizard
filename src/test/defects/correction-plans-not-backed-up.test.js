/* TW-D2 (routines/14-phase7-durability.md §2.2, .agent/inventory.md #14) —
 * an in-progress correction is absent from every backup and every restore.
 *
 * `correction-plans` holds the live correction state: the elevated dose, the
 * target, the dose to return to when it arrives, and when it started
 * (src/App.jsx — written by startCorrection, cancelCorrection and
 * finishCorrection). It is the one key that says "the number you are dosing
 * today is deliberately not the maintenance number."
 *
 * It was missing from `BACKUP_KEYS` (src/lib/backup.jsx), so `buildBackup`
 * never wrote it and `restoreBackup` never looked for it. A user who restores
 * onto a clean device gets their readings, their dose log and their settings
 * back — and a correction that has silently ceased to exist. The app then
 * reads the elevated dose in the restored dose log as the maintenance dose,
 * because the plan that explained it is gone, and there is no longer anything
 * to tell them to put the dose back when the parameter arrives.
 *
 * Three properties are asserted, in the order they matter:
 *   1. a backup taken with a correction running contains it;
 *   2. restoring that backup brings the correction back;
 *   3. a backup file written before this key existed restores without
 *      complaint and without destroying a correction running on this device.
 *
 * (3) is the migration case. Older files have no `correction-plans` member at
 * all; files written by `buildBackup` for a device with no correction running
 * carry an explicit `null`. Neither may be read as "clear the corrections".
 */
import { beforeEach, describe, expect, it } from 'vitest'
import { BACKUP_KEYS, buildBackup, restoreBackup } from '../../lib/backup.jsx'
import { loadKey, saveKey } from '../../lib/storage.js'

const PLAN = {
  alkalinity: {
    target: 8.5, returnDose: 9, startedAt: '2026-08-01 08:00',
    startValue: 6.0, pace: 'steady', dose: 15, days: 10,
  },
}

beforeEach(() => {
  window.localStorage.clear()
  delete window.storage
})

describe('a correction in progress survives backup and restore', () => {
  it('is one of the keys a backup collects', () => {
    expect(BACKUP_KEYS).toContain('correction-plans')
  })

  it('is written into the backup file', async () => {
    await saveKey('correction-plans', PLAN)

    const backup = await buildBackup()

    expect(backup.data['correction-plans']).toEqual(PLAN)
  })

  it('comes back when that file is restored onto a device without it', async () => {
    const backup = { format: 'dans-tank-backup', version: 1, data: { 'correction-plans': PLAN } }

    const merged = await restoreBackup(backup, {}, false)

    /* Both the stored key and the returned state, because the screen reads the
       return value and only a reload reads storage. A restore that writes one
       without the other shows the user a correction that isn't running, or
       runs one it doesn't show. */
    expect(await loadKey('correction-plans', null)).toEqual(PLAN)
    expect(merged['correction-plans']).toEqual(PLAN)
  })

  it('keeps a correction already running here when the file names the same parameter', async () => {
    /* The file is older than this device's plan. `restoreBackup` merges and
       never removes newer entries (the contract stated at backup.jsx:109 and
       promised to the user in Setup's restore panel: "Restoring adds anything
       missing and leaves what you already have alone"). The running correction
       is what the dose on the bottle is set to right now, so a stale plan from
       a file must not replace it. */
    const running = { alkalinity: { ...PLAN.alkalinity, target: 9.0, dose: 20, startedAt: '2026-08-12 09:00' } }
    await saveKey('correction-plans', running)

    const backup = { format: 'dans-tank-backup', version: 1, data: { 'correction-plans': PLAN } }
    const merged = await restoreBackup(backup, {}, false)

    expect(merged['correction-plans'].alkalinity).toEqual(running.alkalinity)
  })

  it('restores a correction for a parameter this device has no plan for', async () => {
    await saveKey('correction-plans', { calcium: { target: 430, returnDose: 12, dose: 18 } })

    const backup = { format: 'dans-tank-backup', version: 1, data: { 'correction-plans': PLAN } }
    const merged = await restoreBackup(backup, {}, false)

    expect(Object.keys(merged['correction-plans']).sort()).toEqual(['alkalinity', 'calcium'])
    expect(merged['correction-plans'].alkalinity).toEqual(PLAN.alkalinity)
  })
})

describe('backup files written before this key existed', () => {
  /* The migration case. A file from any earlier version of the app has no
     `correction-plans` member; `buildBackup` on a device with no correction
     running writes an explicit `null`. A restore must treat both as "this file
     says nothing about corrections", never as "there are no corrections". */
  const olderFile = { format: 'dans-tank-backup', version: 1, data: { readings: [] } }
  const emptyFile = { format: 'dans-tank-backup', version: 1, data: { 'correction-plans': null } }

  it.each([
    ['absent from the file', olderFile],
    ['present but null', emptyFile],
    ['present but the wrong shape', { format: 'dans-tank-backup', version: 1, data: { 'correction-plans': [] } }],
  ])('does not cancel a running correction when the key is %s', async (_label, file) => {
    await saveKey('correction-plans', PLAN)

    const merged = await restoreBackup(file, {}, false)

    expect(await loadKey('correction-plans', null)).toEqual(PLAN)
    expect(merged['correction-plans']).toEqual(PLAN)
  })

  it('restores an older file onto a device with no corrections without throwing', async () => {
    const merged = await restoreBackup(olderFile, {}, false)

    expect(merged['correction-plans']).toEqual({})
  })
})
