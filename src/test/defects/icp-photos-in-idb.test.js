/* TW-D4 (routines/14-phase7-durability.md §2.2, §3.2) — ICP report photos
 * stored inline in localStorage as base64.
 *
 * Each panel's photo is a data URL on the `image` field of an `icp-tests` row,
 * written whole into the same 5 MB localStorage every other key shares.
 * `compressImage` caps the JPEG at 220,000 bytes, which base64 expands to
 * 293,359 characters — measured, not estimated, by
 * scripts/measure-photo-footprint.mjs. Twelve panels is 3.5 M characters, 71%
 * of the quota, before a single reading is counted.
 *
 * Photos move to IndexedDB, which is not subject to that quota. Nothing else
 * moves: `loadKey`/`saveKey` keep their contract, and every caller — the app,
 * `buildBackup`, `restoreBackup` — goes on seeing rows with an inline `image`,
 * because the split happens underneath them. That is the property most of
 * these tests are really pinning: from outside storage.js, nothing changed.
 *
 * The rest pin the ways it is allowed to fail. A browser with no IndexedDB, a
 * private window that refuses to open one, a write that will not fit — in
 * every case the photo stays where it already was and stays readable, and the
 * user is told. A photo that vanishes quietly is the failure this whole phase
 * exists to prevent.
 */
import { IDBFactory } from 'fake-indexeddb'
import { beforeEach, describe, expect, it } from 'vitest'
import { buildBackup, restoreBackup } from '../../lib/backup.jsx'
import { KV_STORE, run } from '../../lib/idb.js'
import { closePhotoStore, deletePhoto, photoIds } from '../../lib/photo-store.js'
import { loadKey, lsGet, onStorageError, saveKey } from '../../lib/storage.js'

/* Not a real JPEG, but exactly the size of the largest one the app can store:
   compressImage's 220,000-byte budget, base64-expanded. Size is what matters
   here and base64 expansion does not care what the bytes are. */
const PHOTO = 'data:image/jpeg;base64,' + 'A'.repeat(293359 - 23)
const OTHER = 'data:image/jpeg;base64,' + 'B'.repeat(1000)

const panel = (id, date, image) => ({
  id, date, note: 'Quarterly panel',
  elements: { calcium: 420, magnesium: 1350 },
  ...(image ? { image } : {}),
})

const said = []

/* Where the rows themselves live changed under this suite's feet: piece three
   of routine 16 (TW-D11) moved every loadKey/saveKey key — `icp-tests`
   included — from localStorage into IndexedDB's key-value store. Every
   property these tests pin survives; the ADDRESS several of them read the row
   store at did not, so those assertions read the row store where it now is.
   The fallback cases, where IndexedDB is unusable and rows genuinely stay in
   localStorage, still read localStorage — that is the point of them. */
const storedRows = async () => {
  const res = await run(KV_STORE, 'readonly', (s) => s.get('icp-tests'))
  return typeof res.value === 'string' ? JSON.parse(res.value) : undefined
}

beforeEach(() => {
  window.localStorage.clear()
  delete window.storage
  /* A fresh database per test, and the memoised handle to the old one dropped. */
  window.indexedDB = new IDBFactory()
  closePhotoStore()
  said.length = 0
  onStorageError((m) => said.push(m))
})

describe('where a photo ends up', () => {
  it('is not written into the row store, or anywhere in localStorage', async () => {
    await saveKey('icp-tests', [panel('a', '2026-01-01', PHOTO)])

    const stored = await storedRows()
    expect(stored).toHaveLength(1)
    expect(stored[0].image).toBeUndefined()
    expect(JSON.stringify(stored)).not.toContain('AAAA')
    /* Since the row move, localStorage holds nothing for this key at all. */
    expect(window.localStorage.getItem('danstank:icp-tests')).toBeNull()
  })

  it('leaves everything else on the row in the row store, unchanged', async () => {
    await saveKey('icp-tests', [panel('a', '2026-01-01', PHOTO)])

    expect((await storedRows())[0]).toMatchObject({
      id: 'a', date: '2026-01-01', note: 'Quarterly panel',
      elements: { calcium: 420, magnesium: 1350 },
    })
  })

  it('is in IndexedDB, under the row id', async () => {
    await saveKey('icp-tests', [panel('a', '2026-01-01', PHOTO)])

    expect(await photoIds()).toEqual(['a'])
  })

  it('comes back on the row exactly as it went in', async () => {
    const rows = [panel('a', '2026-01-01', PHOTO), panel('b', '2026-04-01', OTHER)]
    await saveKey('icp-tests', rows)

    expect(await loadKey('icp-tests', [])).toMatchObject([
      { id: 'a', image: PHOTO }, { id: 'b', image: OTHER },
    ])
  })

  it('does not disturb a panel that has no photo', async () => {
    await saveKey('icp-tests', [panel('a', '2026-01-01', null)])

    const back = await loadKey('icp-tests', [])
    expect(back[0].image).toBeUndefined()
    expect(await photoIds()).toEqual([])
  })

  it('shrinks what the row store holds by the whole size of the photo', async () => {
    const inline = JSON.stringify([panel('a', '2026-01-01', PHOTO)]).length

    await saveKey('icp-tests', [panel('a', '2026-01-01', PHOTO)])
    const res = await run(KV_STORE, 'readonly', (s) => s.get('icp-tests'))

    expect(inline).toBeGreaterThan(293000)
    expect(res.value.length).toBeLessThan(300)
    /* And localStorage's share of it is now zero rather than merely small. */
    expect(window.localStorage.getItem('danstank:icp-tests')).toBeNull()
  })
})

describe('photos already stored inline, on an existing install', () => {
  /* The migration. These devices are the reason the move is worth making, so
     orphaning them would defeat the point. */
  const seedInline = (rows) =>
    window.localStorage.setItem('danstank:icp-tests', JSON.stringify(rows))

  it('are moved to IndexedDB the first time they are loaded', async () => {
    seedInline([panel('a', '2026-01-01', PHOTO)])

    const back = await loadKey('icp-tests', [])

    expect(back[0].image).toBe(PHOTO)
    expect(await photoIds()).toEqual(['a'])
    expect((await storedRows())[0].image).toBeUndefined()
  })

  it('are readable, and still only in one place, on every load after that', async () => {
    seedInline([panel('a', '2026-01-01', PHOTO)])
    await loadKey('icp-tests', [])

    expect((await loadKey('icp-tests', []))[0].image).toBe(PHOTO)
    expect(await photoIds()).toEqual(['a'])
    expect((await storedRows())[0].image).toBeUndefined()
    expect(window.localStorage.getItem('danstank:icp-tests')).toBeNull()
  })

  it('stay where they are, and stay readable, when they cannot be written', async () => {
    /* The same shape as drainLegacyStore: nothing is removed from where it
       already works until its replacement is known to be in place. */
    seedInline([panel('a', '2026-01-01', PHOTO)])
    window.indexedDB = null
    closePhotoStore()

    const back = await loadKey('icp-tests', [])

    expect(back[0].image).toBe(PHOTO)
    expect(lsGet('icp-tests')[0].image).toBe(PHOTO)
  })

  it('are picked up by a later load once IndexedDB works again', async () => {
    seedInline([panel('a', '2026-01-01', PHOTO)])
    window.indexedDB = null
    closePhotoStore()
    await loadKey('icp-tests', [])

    window.indexedDB = new IDBFactory()
    closePhotoStore()
    const back = await loadKey('icp-tests', [])

    expect(back[0].image).toBe(PHOTO)
    expect(await photoIds()).toEqual(['a'])
    expect((await storedRows())[0].image).toBeUndefined()
  })
})

describe('when IndexedDB cannot be used at all', () => {
  /* Private browsing, an old engine, a user who refused storage. Falling back
     to localStorage is acceptable. Doing it without saying so is not. */
  const unusable = [
    ['there is no IndexedDB in this browser', () => { window.indexedDB = undefined }],
    ['opening a database throws', () => { window.indexedDB = { open() { throw new Error('refused') } } }],
    ['opening a database fails', () => {
      window.indexedDB = { open() { const r = {}; setTimeout(() => r.onerror && r.onerror({ target: r }), 0); return r } }
    }],
  ]

  it.each(unusable)('keeps the photo in localStorage when %s', async (_label, breakIt) => {
    breakIt(); closePhotoStore()

    expect(await saveKey('icp-tests', [panel('a', '2026-01-01', PHOTO)])).toBe(true)

    expect(lsGet('icp-tests')[0].image).toBe(PHOTO)
    expect((await loadKey('icp-tests', []))[0].image).toBe(PHOTO)
  })

  it.each(unusable)('tells the user when %s', async (_label, breakIt) => {
    breakIt(); closePhotoStore()

    await saveKey('icp-tests', [panel('a', '2026-01-01', PHOTO)])

    expect(said).toHaveLength(1)
    expect(said[0]).toMatch(/photo/i)
  })

  it('says it once, not on every save', async () => {
    window.indexedDB = undefined
    closePhotoStore()

    await saveKey('icp-tests', [panel('a', '2026-01-01', PHOTO)])
    await saveKey('icp-tests', [panel('a', '2026-01-01', PHOTO), panel('b', '2026-04-01', OTHER)])

    expect(said).toHaveLength(1)
  })

  it('never hangs when the open neither succeeds nor fails', async () => {
    /* `onblocked` — another tab holds an older version of the database open.
       Without a timeout this promise never settles and the app never loads. */
    window.indexedDB = { open() { return {} } }
    closePhotoStore()

    await saveKey('icp-tests', [panel('a', '2026-01-01', PHOTO)])

    expect(lsGet('icp-tests')[0].image).toBe(PHOTO)
  }, 15000)
})

describe('the message shown when localStorage is full', () => {
  /* It used to say "ICP report photos use the most space — remove a few".
     Once the photos are in IndexedDB that sends the user after space that was
     never the problem, and the one thing they could have deleted to fix it is
     no longer the thing taking the room. */
  const whenFull = async () => {
    const m = new Map()
    const full = { get length() { return m.size }, key: (i) => [...m.keys()][i] ?? null,
      getItem: (k) => (m.has(k) ? m.get(k) : null),
      setItem: () => { const e = new Error('quota'); e.name = 'QuotaExceededError'; throw e },
      removeItem: (k) => { m.delete(k) }, clear: () => m.clear() }
    const real = window.localStorage
    Object.defineProperty(window, 'localStorage', { value: full, configurable: true, writable: true })
    try { await saveKey('readings', [{ id: 'r', value: 8 }]) }
    finally { Object.defineProperty(window, 'localStorage', { value: real, configurable: true, writable: true }) }
    return said[said.length - 1]
  }

  it('does not blame photos once they are out of localStorage', async () => {
    await saveKey('icp-tests', [panel('a', '2026-01-01', PHOTO)])
    /* Since the row move a full localStorage cannot fail a save while
       IndexedDB works — the save simply lands there, which is the point of
       the move. The message under test is only reachable when BOTH stores
       refuse, so IndexedDB is broken here after the photos got out. The
       property is unchanged: with the photos moved, the failure message must
       not send the user after space that was never the problem. */
    window.indexedDB = undefined
    closePhotoStore()
    said.length = 0

    const msg = await whenFull()

    expect(msg).toMatch(/storage is full/i)
    expect(msg).not.toMatch(/report photos/i)
  })

  it('still blames them on a device where they had to stay inline', async () => {
    window.indexedDB = undefined
    closePhotoStore()
    await saveKey('icp-tests', [panel('a', '2026-01-01', PHOTO)])
    said.length = 0

    expect(await whenFull()).toMatch(/report photos use the most space/i)
  })
})

describe('a bridge that hands back something unreadable', () => {
  it('falls back to local storage rather than failing the load', async () => {
    await saveKey('icp-tests', [panel('a', '2026-01-01', PHOTO)])
    window.storage = { async get() { return { value: '{not json' } } }

    /* The parse used to sit outside the fallback, so a bridge returning
       nonsense rejected the load instead of dropping through to the copy that
       was fine all along. */
    expect((await loadKey('icp-tests', []))[0].image).toBe(PHOTO)
  })
})

describe('a photo that should be in IndexedDB but is not', () => {
  it('does not silently show a panel with no photo', async () => {
    await saveKey('icp-tests', [panel('a', '2026-01-01', PHOTO)])
    /* The photo is gone from under the row — the row still claims one. Before
       the row move this test wiped the whole database, but the rows live
       there too now, so a whole-database wipe takes the claim with the photo
       and there is nothing left to report on. Losing one store's entry while
       the row survives is the shape that remains reachable — a partial
       corruption, or an engine evicting blob data first. */
    await deletePhoto('a')
    said.length = 0

    const back = await loadKey('icp-tests', [])

    expect(back[0].image).toBeUndefined()
    expect(said).toHaveLength(1)
    expect(said[0]).toMatch(/photo/i)
  })
})

describe('deleting a panel', () => {
  it('takes its photo with it, so nothing is orphaned', async () => {
    await saveKey('icp-tests', [panel('a', '2026-01-01', PHOTO), panel('b', '2026-04-01', OTHER)])
    expect((await photoIds()).sort()).toEqual(['a', 'b'])

    const kept = (await loadKey('icp-tests', [])).filter((r) => r.id !== 'a')
    await saveKey('icp-tests', kept)

    expect(await photoIds()).toEqual(['b'])
  })
})

describe('backups', () => {
  it('carry the photo inline, exactly as they did before the move', async () => {
    await saveKey('icp-tests', [panel('a', '2026-01-01', PHOTO)])

    const backup = await buildBackup()

    expect(backup.data['icp-tests'][0].image).toBe(PHOTO)
    expect(backup.counts.icps).toBe(1)
  })

  it('restore the photo onto a device that has never seen it', async () => {
    const file = {
      format: 'dans-tank-backup', version: 1,
      data: { 'icp-tests': [panel('a', '2026-01-01', PHOTO)] },
    }

    const merged = await restoreBackup(file, {}, false)

    expect(merged['icp-tests'][0].image).toBe(PHOTO)
    expect((await loadKey('icp-tests', []))[0].image).toBe(PHOTO)
    expect(await photoIds()).toEqual(['a'])
    expect((await storedRows())[0].image).toBeUndefined()
  })

  it('restore from a file written before the move, whose rows are plain inline photos', async () => {
    /* Older backup files know nothing about any of this. They are just rows
       with an `image` field, which is exactly what a row looks like in memory
       today — so there is nothing to migrate, and this must keep being true. */
    const file = {
      format: 'dans-tank-backup', version: 1,
      data: { 'icp-tests': [{ id: 'old', date: '2025-06-01', elements: { calcium: 400 }, image: PHOTO }] },
    }

    const merged = await restoreBackup(file, {}, false)

    expect(merged['icp-tests'][0].image).toBe(PHOTO)
    expect(await photoIds()).toEqual(['old'])
  })

  it('do not duplicate a photo when the same file is restored twice', async () => {
    const file = {
      format: 'dans-tank-backup', version: 1,
      data: { 'icp-tests': [panel('a', '2026-01-01', PHOTO)] },
    }

    const first = await restoreBackup(file, {}, false)
    await restoreBackup(file, { 'icp-tests': first['icp-tests'] }, false)

    expect(await photoIds()).toEqual(['a'])
    expect((await loadKey('icp-tests', []))[0].image).toBe(PHOTO)
  })
})
