/* TW-D12 (routines/16-durability-remainder.md, piece two) — backup is manual.
 *
 * The entire durability story is a file the user has to remember to make.
 * `buildBackup`, `downloadJson`, `inspectBackup` and `restoreBackup` all exist
 * and are good; nothing ever calls them without a tap. This piece adds the
 * scheduling: a snapshot ring in IndexedDB, a File System Access handle where
 * the browser has one, and the share sheet where it doesn't.
 *
 * The tests pin the properties that make it safe rather than the mechanics:
 *
 * - The ring is a ring, not a slot. A bad state must not overwrite the last
 *   good one — a ring that faithfully records a wipe until the good copies
 *   fall off the end has eaten its own contents.
 * - A snapshot restores through `restoreBackup`, so it merges by natural key
 *   and is idempotent, exactly as a file is.
 * - A share that cannot be confirmed is not recorded as a backup. The share
 *   sheet reports dismissal and success identically in practice, and a
 *   `last-backup` written on a cancelled share would claim a copy that does
 *   not exist.
 * - Every scheduled path is a no-op without IndexedDB, and the manual save
 *   button's path still works.
 *
 * What none of it protects against is stated in the module header and the PR
 * rather than tested: the ring dies with the origin, the handle is
 * Chromium-only, the share sheet needs a tap. The only copy that survives
 * losing the phone is a file somewhere else.
 */
import { IDBFactory } from 'fake-indexeddb'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  RING_SIZE, loadFileHandle, maybeAutoBackup, restoreSnapshot, ringAdd, ringList,
  saveFileHandle, shareBackup, writeBackupToHandle,
} from '../../lib/auto-backup.js'
import { buildBackup } from '../../lib/backup.jsx'
import { closePhotoStore } from '../../lib/photo-store.js'
import { loadKey, lsGet, saveKey } from '../../lib/storage.js'

const reading = (id, date) => ({ id, param: 'alkalinity', value: 8.5, date, time: '09:00', note: '' })

/* A full backup object with a chosen number of readings, without touching the
   stored state — the ring stores what it is given. */
const backupWith = (n, createdAt) => ({
  format: 'dans-tank-backup', version: 1, createdAt,
  counts: { readings: n, icps: 0, waterChanges: 0, doseChanges: 0, taskLog: 0, lighting: 0 },
  data: { readings: Array.from({ length: n }, (_, i) => reading('r' + i, '2026-08-0' + ((i % 9) + 1))) },
})

const iso = (day) => `2026-08-${String(day).padStart(2, '0')}T02:00:00.000Z`

beforeEach(() => {
  window.localStorage.clear()
  delete window.storage
  delete navigator.share
  delete navigator.canShare
  window.indexedDB = new IDBFactory()
  closePhotoStore()
})

describe('the snapshot ring', () => {
  it('keeps the last N and prunes the oldest', async () => {
    for (let d = 1; d <= RING_SIZE + 2; d++) {
      const res = await ringAdd(backupWith(d, iso(d)), iso(d))
      expect(res.ok).toBe(true)
    }

    const list = await ringList()
    expect(list.length).toBe(RING_SIZE)
    /* Newest first, and the two oldest are gone. */
    expect(list[0].key).toBe(iso(RING_SIZE + 2))
    expect(list[list.length - 1].key).toBe(iso(3))
  })

  it('refuses to let an empty state overwrite the last good one', async () => {
    await ringAdd(backupWith(40, iso(1)), iso(1))

    /* The device was wiped; the nightly snapshot fires anyway. Writing this
       would start flushing the 40-reading copy toward the end of the ring. */
    const res = await ringAdd(backupWith(0, iso(2)), iso(2))

    expect(res.ok).toBe(false)
    const list = await ringList()
    expect(list.length).toBe(1)
    expect(list[0].counts.readings).toBe(40)
  })

  it('accepts an empty snapshot on a device that never held anything', async () => {
    /* An empty tank log is a normal first week. Only the transition from
       something to nothing is suspect. */
    const res = await ringAdd(backupWith(0, iso(1)), iso(1))
    expect(res.ok).toBe(true)
  })

  it('restores through restoreBackup: merged, idempotent', async () => {
    await saveKey('readings', [reading('a', '2026-08-01'), reading('b', '2026-08-02')])
    const snap = await buildBackup()
    await ringAdd(snap, iso(3))

    /* The user deletes everything, then reaches for the snapshot. */
    await saveKey('readings', [])

    const current = { readings: [] }
    await restoreSnapshot(iso(3), current)
    expect((await loadKey('readings', [])).length).toBe(2)

    /* Restoring the same snapshot again changes nothing — natural-key merge,
       the same promise the file restore makes. */
    const again = await restoreSnapshot(iso(3), { readings: await loadKey('readings', []) })
    expect(again['readings'].length).toBe(2)
  })
})

describe('the file handle', () => {
  it('round-trips through IndexedDB', async () => {
    await saveFileHandle({ kind: 'file', name: 'dans-tank-backup.json' })
    const back = await loadFileHandle()
    expect(back).toMatchObject({ kind: 'file', name: 'dans-tank-backup.json' })
  })

  it('degrades to "needs a tap" when the permission has lapsed, without writing', async () => {
    const createWritable = vi.fn()
    const handle = {
      kind: 'file',
      queryPermission: async () => 'prompt',
      createWritable,
    }

    const res = await writeBackupToHandle(handle, backupWith(3, iso(1)))

    expect(res.ok).toBe(false)
    expect(res.needsTap).toBe(true)
    expect(createWritable).not.toHaveBeenCalled()
  })

  it('writes when the permission is granted', async () => {
    let written = ''
    const handle = {
      kind: 'file',
      queryPermission: async () => 'granted',
      createWritable: async () => ({
        write: async (s) => { written += s },
        close: async () => {},
      }),
    }

    const res = await writeBackupToHandle(handle, backupWith(3, iso(1)))

    expect(res.ok).toBe(true)
    expect(JSON.parse(written).counts.readings).toBe(3)
  })
})

describe('the share sheet', () => {
  it('does not record a backup it cannot confirm', async () => {
    navigator.canShare = () => true
    navigator.share = async () => { throw new DOMException('canceled', 'AbortError') }

    const res = await shareBackup(backupWith(3, iso(1)))

    expect(res.ok).toBe(false)
    /* The one assertion that matters: a cancelled share must not leave a
       last-backup record claiming a copy that does not exist. */
    expect(lsGet('last-backup')).toBeUndefined()
  })

  it('does not record last-backup even on an apparent success', async () => {
    navigator.canShare = () => true
    navigator.share = async () => {}

    const res = await shareBackup(backupWith(3, iso(1)))

    expect(res.ok).toBe(true)
    expect(lsGet('last-backup')).toBeUndefined()
  })
})

describe('the schedule', () => {
  it('writes one snapshot a day, not one per call', async () => {
    await saveKey('readings', [reading('a', '2026-08-01')])

    await maybeAutoBackup({ now: iso(10) })
    await maybeAutoBackup({ now: `2026-08-10T09:00:00.000Z` })

    expect((await ringList()).length).toBe(1)

    await maybeAutoBackup({ now: iso(11) })
    expect((await ringList()).length).toBe(2)
  })

  it('does not snapshot a device that looks wiped', async () => {
    await saveKey('readings', [reading('a', '2026-08-01')])
    await maybeAutoBackup({ now: iso(10) })

    /* The wipe happened between launches; piece one's verdict says so. The
       schedule must neither snapshot the empty state nor overwrite the file
       handle's copy with it. */
    window.localStorage.clear()
    const res = await maybeAutoBackup({ now: iso(11), suspectWipe: true })

    expect(res.snapshotted).toBe(false)
    expect((await ringList()).length).toBe(1)
    expect((await ringList())[0].counts.readings).toBe(1)
  })

  it('is a no-op without IndexedDB, and the manual path still works', async () => {
    delete window.indexedDB
    closePhotoStore()

    const res = await maybeAutoBackup({ now: iso(10) })
    expect(res.snapshotted).toBe(false)

    /* The manual save button's path: buildBackup + saveKey('last-backup'). */
    await saveKey('readings', [reading('a', '2026-08-01')])
    const b = await buildBackup()
    expect(b.counts.readings).toBe(1)
    expect(await saveKey('last-backup', b.createdAt)).toBe(true)
    expect(lsGet('last-backup')).toBe(b.createdAt)
  })
})
