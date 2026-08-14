/* TW-D11 stage 2 (routines/16-durability-remainder.md, piece three) — the
 * remaining storage keys move to IndexedDB.
 *
 * The photos left in c7ed9d0; the other 23 keys stayed in localStorage, a
 * synchronous ~5 MB text store with all-or-nothing writes. This move is the
 * same shape as the photo move, one level up: the split happens underneath
 * `loadKey`/`saveKey`, so nothing outside src/lib/storage.js changes —
 * `App.jsx`, `Setup.jsx` and `backup.jsx` keep every call they have, and
 * `buildBackup` reading through `loadKey` is what keeps backup files
 * format-identical across the move in both directions.
 *
 * The rules it inherits from the photo move, each pinned below:
 *
 * - Migrate on first load through the existing `saveKey` path — one write
 *   path, not two.
 * - Fail safe: a key that cannot be written to IndexedDB stays in
 *   localStorage, where it works, and is retried on a later load. Nothing is
 *   removed from where it works until its replacement is in place.
 * - The contract is unchanged: `loadKey(key, fallback)` resolves to the value
 *   or the fallback — including stored falsy values — and `saveKey` still
 *   resolves true/false and reports through `storageErrorHandler`.
 *
 * And the one interaction the routine required checking rather than assuming:
 * `drainLegacyStore`. A key the drain could not carry lives under the legacy
 * prefix and that copy is the newer one, so the migration must take its value
 * from the drain-aware read — migrating the stale mirror would make the exact
 * loss TW-032 was filed to stop permanent. And a confirmed IndexedDB write
 * must remove BOTH prefixes, or the next load's drain resurrects the legacy
 * copy into a store the app no longer treats as authoritative.
 *
 * What this move does not buy, stated rather than implied: IndexedDB is
 * evicted by the same clears and the same seven-day rule as localStorage.
 * This is room and transactional writes, not durability.
 */
import { IDBFactory } from 'fake-indexeddb'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { buildBackup, restoreBackup } from '../../lib/backup.jsx'
import { KV_STORE, run } from '../../lib/idb.js'
import { closePhotoStore } from '../../lib/photo-store.js'
import {
  LEGACY_PREFIX, LS_PREFIX, drainLegacyStore, loadKey, lsGet, onStorageError, saveKey,
} from '../../lib/storage.js'

/* Where a key actually is, read through the same module the app stores it
   with. `undefined` means the store does not hold it. */
const inIdb = async (key) => {
  const res = await run(KV_STORE, 'readonly', (s) => s.get(key))
  return res.ok ? res.value : undefined
}

const keysWith = (prefix) => {
  const out = []
  for (let i = 0; i < window.localStorage.length; i++) {
    const k = window.localStorage.key(i)
    if (k && k.startsWith(prefix)) out.push(k)
  }
  return out
}

const READING = [{ id: 'r1', param: 'alkalinity', value: 8.2, date: '2026-08-14', note: '' }]

/* Every key the app stores, with a representative value each — the
   enumeration is the routine's, from grepping the tree, and piece three has
   to move all of them. */
const ALL_KEYS = {
  'readings': READING,
  'icp-tests': [{ id: 'i1', date: '2026-06-01', note: '', elements: { calcium: 420 } }],
  'water-changes': [{ id: 'w1', date: '2026-08-11', litres: 10, note: '' }],
  'dose-log': [{ id: 'd1', date: '2026-08-01', time: '09:00', ml: 12, element: 'alkalinity' }],
  'lighting-log': [{ id: 'l1', date: '2026-08-05', note: 'UV 66%' }],
  'task-log': [{ id: 't1', taskId: 'waterchange', date: '2026-08-11', auto: false }],
  'tasks-custom': [{ id: 'c1', label: 'Clean skimmer' }],
  'reminders': [{ id: 'rem-alkalinity', label: 'Test alkalinity', intervalDays: 2, enabled: true }],
  'tank-settings': { volumeL: 77, testKit: 'hanna' },
  'custom-ranges': { phosphate: { min: 0.05, max: 0.12 } },
  'kit-changes': { alkalinity: '2026-07-01' },
  'findings-dismissed': { 'f1': true },
  'alk-plan': { appliedDose: 15, appliedAt: '2026-08-10 09:00' },
  'ca-plan': null,
  'mg-plan': null,
  'corrections': [{ id: 'k1', element: 'alkalinity', date: '2026-08-09' }],
  'correction-plans': { alkalinity: { dose: 15 } },
  'last-backup': '2026-08-12T09:00:00.000Z',
  'historical-seeded': true,
  'icp-seeded': true,
  'wc-seeded': true,
  'light-seeded': true,
  'strengths-fixed-v1': true,
}

beforeEach(() => {
  window.localStorage.clear()
  delete window.storage
  window.indexedDB = new IDBFactory()
  closePhotoStore()
  onStorageError(null)
})

describe('where a value lives now', () => {
  it('is in IndexedDB and not in localStorage, and comes back identical', async () => {
    expect(await saveKey('readings', READING)).toBe(true)

    expect(await inIdb('readings')).toBe(JSON.stringify(READING))
    expect(keysWith(LS_PREFIX)).toEqual([])
    expect(keysWith(LEGACY_PREFIX)).toEqual([])
    expect(await loadKey('readings', null)).toEqual(READING)
  })

  it('keeps the loadKey fallback contract, stored falsy values included', async () => {
    expect(await loadKey('missing', 'fallback')).toBe('fallback')

    /* A stored falsy value is a value, not an absence. No current key stores
       a bare falsy scalar, which is exactly why this would rot unnoticed. */
    await saveKey('a-zero', 0)
    await saveKey('an-empty', '')
    await saveKey('a-false', false)
    expect(await loadKey('a-zero', 'fallback')).toBe(0)
    expect(await loadKey('an-empty', 'fallback')).toBe('')
    expect(await loadKey('a-false', 'fallback')).toBe(false)
  })
})

describe('a localStorage-shaped install, on its first load after the move', () => {
  it('migrates every key, byte-identically, and leaves nothing behind', async () => {
    for (const [key, value] of Object.entries(ALL_KEYS)) {
      window.localStorage.setItem(LS_PREFIX + key, JSON.stringify(value))
    }

    /* The whole set, not a sample — the routine counted 23 for a reason. */
    for (const [key, value] of Object.entries(ALL_KEYS)) {
      expect(await loadKey(key, 'MISSING')).toEqual(value)
    }
    for (const [key, value] of Object.entries(ALL_KEYS)) {
      expect(await inIdb(key)).toBe(JSON.stringify(value))
    }
    expect(keysWith(LS_PREFIX)).toEqual([])
  })

  it('migrates through the one write path, so a second load reads IndexedDB alone', async () => {
    window.localStorage.setItem(LS_PREFIX + 'readings', JSON.stringify(READING))
    await loadKey('readings', null)

    /* localStorage is empty now; only IndexedDB can answer. */
    expect(keysWith(LS_PREFIX)).toEqual([])
    expect(await loadKey('readings', null)).toEqual(READING)
  })
})

describe('when IndexedDB cannot be used', () => {
  it('keeps every key in localStorage, working exactly as before', async () => {
    delete window.indexedDB
    closePhotoStore()

    expect(await saveKey('readings', READING)).toBe(true)
    expect(lsGet('readings')).toEqual(READING)
    expect(await loadKey('readings', null)).toEqual(READING)
  })

  it('says so once, not on every save', async () => {
    const said = []
    onStorageError((m) => said.push(m))
    delete window.indexedDB
    closePhotoStore()

    await saveKey('readings', READING)
    await saveKey('kit-changes', { alkalinity: '2026-07-01' })

    expect(said).toHaveLength(1)
    expect(said[0]).toMatch(/browser storage/i)
  })

  it('retries on a later load, once IndexedDB works again', async () => {
    delete window.indexedDB
    closePhotoStore()
    await saveKey('readings', READING)

    window.indexedDB = new IDBFactory()
    closePhotoStore()

    expect(await loadKey('readings', null)).toEqual(READING)
    expect(await inIdb('readings')).toBe(JSON.stringify(READING))
    expect(keysWith(LS_PREFIX)).toEqual([])
  })
})

describe('the drainLegacyStore interaction — checked, not assumed', () => {
  it('migrates the legacy copy, not the stale mirror, when the drain was quota-blocked', async () => {
    /* The device TW-032 was filed for: a value under both prefixes, the
       legacy copy newer, and no room to carry it across. */
    window.localStorage.setItem(LEGACY_PREFIX + 'custom-ranges', JSON.stringify({ phosphate: { min: 0.05, max: 0.12 } }))
    window.localStorage.setItem(LS_PREFIX + 'custom-ranges', JSON.stringify({}))

    const spy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      const e = new Error('exceeded the quota'); e.name = 'QuotaExceededError'; throw e
    })
    try {
      expect(drainLegacyStore()).toEqual({ reclaimed: 0, carried: 0, undrained: 1 })
    } finally {
      spy.mockRestore()
    }

    /* The migration must read the drain-aware answer — the legacy copy — and
       a confirmed IndexedDB write must take BOTH prefixes with it, so the
       next load's drain has nothing to resurrect. */
    expect(await loadKey('custom-ranges', null)).toEqual({ phosphate: { min: 0.05, max: 0.12 } })
    expect(await inIdb('custom-ranges')).toBe(JSON.stringify({ phosphate: { min: 0.05, max: 0.12 } }))
    expect(keysWith(LEGACY_PREFIX)).toEqual([])
    expect(keysWith(LS_PREFIX)).toEqual([])
    expect(drainLegacyStore()).toEqual({ reclaimed: 0, carried: 0, undrained: 0 })
  })
})

describe('backups across the move', () => {
  it('a file written before the move restores into a device after it', async () => {
    const file = { format: 'dans-tank-backup', version: 1, data: { 'readings': READING } }

    const merged = await restoreBackup(file, {}, false)

    expect(merged['readings']).toHaveLength(1)
    expect(await loadKey('readings', [])).toHaveLength(1)
    expect(await inIdb('readings')).toBeTruthy()
  })

  it('a file written after the move carries the same shape it always did', async () => {
    await saveKey('readings', READING)
    await saveKey('correction-plans', { alkalinity: { dose: 15 } })

    const backup = await buildBackup()

    expect(backup.format).toBe('dans-tank-backup')
    expect(backup.data['readings']).toEqual(READING)
    expect(backup.data['correction-plans']).toEqual({ alkalinity: { dose: 15 } })
    expect(backup.counts.readings).toBe(1)
  })
})
