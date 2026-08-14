/* TW-D5 (routines/16-durability-remainder.md, piece one) — the app cannot tell
 * a cleared browser from a fresh install, and seeds into the difference.
 *
 * Both storage prefixes live in the same localStorage, so a browser that clears
 * its data takes all of it at once. On the next open every `loadKey` returns
 * its fallback, which is correct — and then `src/App.jsx:489-513` reads the
 * absence of `wc-seeded` and `light-seeded` as "this is a new device" and
 * writes 25 weekly water changes dated 16 Feb to 3 Aug
 * (`src/lib/analytics/water-changes.js:9`) and one lighting note into a history
 * that holds nothing else. The user is looking at a maintenance record they did
 * not create, next to an empty readings list, with nothing on screen to say
 * anything was lost. The water-change list is not decoration either: it is the
 * export side of the nutrient maths.
 *
 * `seed-data.js:1-11` already settled this principle for readings — a
 * fabricated measurement standing in for one nobody took is the substitution
 * the spec forbids. These tests apply the same reasoning to the two keys that
 * never got it, and add the detection that makes it possible to say so.
 *
 * Nothing survives a full clear, and these tests do not pretend otherwise. What
 * they pin is the two evidence paths that do exist — a witness record in
 * IndexedDB, which survives a localStorage-only clear, and ICP photos in the
 * photo store with no panels left to hang them on, which cannot exist on a
 * device that has never run the app — plus the rule that governs the case where
 * neither is available: do not seed into a history the app cannot account for.
 */
import { IDBFactory } from 'fake-indexeddb'
import { render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { ReefConsoleInner } from '../../App.jsx'
import { DB_NAME, DB_VERSION, PHOTO_STORE, WITNESS_STORE } from '../../lib/idb.js'
import { closePhotoStore, putPhoto } from '../../lib/photo-store.js'
import { lsGet, saveKey } from '../../lib/storage.js'

const WITNESS_KEY = 'install'

/* The witness is written here through raw IndexedDB rather than through the
   app's own module, so these tests describe the state a wiped device is in
   rather than the implementation that reads it. The one thing borrowed from
   the app is the version constant: opening the shared database at a fixed
   number is the exact `VersionError` trap the routine warns about, and this
   helper fell into it the first time the version moved (piece two, 2 -> 3). */
function withDb(fn) {
  return new Promise((resolve, reject) => {
    const req = window.indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(PHOTO_STORE)) db.createObjectStore(PHOTO_STORE)
      if (!db.objectStoreNames.contains(WITNESS_STORE)) db.createObjectStore(WITNESS_STORE)
    }
    req.onerror = () => reject(req.error)
    req.onsuccess = () => {
      const db = req.result
      const tx = db.transaction(WITNESS_STORE, 'readwrite')
      const out = fn(tx.objectStore(WITNESS_STORE))
      tx.oncomplete = () => { db.close(); resolve(out && out.result) }
      tx.onerror = () => { db.close(); reject(tx.error) }
    }
  })
}

const putWitness = (w) => withDb((s) => s.put(w, WITNESS_KEY))
const getWitness = () => withDb((s) => s.get(WITNESS_KEY))

/* A device that logged for six months and then had its storage cleared. */
const LIVED_IN = {
  installId: 'inst-1',
  firstSeen: '2026-02-13T00:00:00.000Z',
  high: { 'readings': 412, 'icp-tests': 3, 'water-changes': 25, 'dose-log': 6, 'task-log': 180, 'lighting-log': 2 },
}

const started = () =>
  waitFor(() => expect(screen.queryByText(/loading reef console/i)).not.toBeInTheDocument())

beforeEach(() => {
  window.localStorage.clear()
  delete window.storage
  window.indexedDB = new IDBFactory()
  closePhotoStore()
})
afterEach(() => window.localStorage.clear())

describe('a device whose storage was cleared, with the witness intact', () => {
  it('does not seed water changes into a history it cannot account for', async () => {
    await putWitness(LIVED_IN)

    render(<ReefConsoleInner />)
    await started()

    /* Before the fix: 25 rows, dated to a period this device has no other
       record of. The seed itself is unchanged and still correct for a genuinely
       new install — see the clean-install test below. */
    expect(lsGet('water-changes') || []).toEqual([])
    expect(lsGet('lighting-log') || []).toEqual([])
  })

  it('says a wipe happened, and what was lost, without opening Setup', async () => {
    await putWitness(LIVED_IN)

    render(<ReefConsoleInner />)
    await started()

    /* The dashboard is the default tab and no navigation has happened, so
       anything asserted here is on the screen the user actually arrives at. */
    expect(document.body.textContent).toMatch(/cleared/i)
    expect(document.body.textContent).toContain('412')
  })

  it('does not claim a backup does or does not exist', async () => {
    await putWitness(LIVED_IN)

    render(<ReefConsoleInner />)
    await started()

    /* The app has never been able to know this — `last-backup` is erased by the
       same clear. `backup-absence-claim.test.js` removed the false version of
       this sentence from Setup; a wipe notice must not reintroduce it. */
    expect(document.body.textContent).not.toMatch(/you\s?have\s?n['’]?t saved a backup/i)
    expect(document.body.textContent).not.toMatch(/no backup exists/i)
  })

  it('never seeds again on this device, even once the user starts logging', async () => {
    await putWitness(LIVED_IN)

    const first = render(<ReefConsoleInner />)
    await started()
    first.unmount()

    /* Declining to seed has to be recorded, or the next load — by then with a
       reading on it, so no longer looking wiped — walks straight back into the
       seeding branch and writes the 25 rows after all. */
    await saveKey('readings', [{ id: 'r1', param: 'alkalinity', value: 8.4, date: '2026-08-14' }])
    render(<ReefConsoleInner />)
    await started()

    expect(lsGet('water-changes') || []).toEqual([])
  })
})

describe('a device whose storage was cleared, with the witness gone too', () => {
  it('reads photos with no panels as proof of a prior install', async () => {
    /* A photo in the store and no `icp-tests` row to hang it on cannot happen
       on a device that has never run the app. */
    await putPhoto('icp-old', 'data:image/jpeg;base64,AAAA')

    render(<ReefConsoleInner />)
    await started()

    expect(lsGet('water-changes') || []).toEqual([])
    expect(document.body.textContent).toMatch(/cleared/i)
  })
})

describe('a genuinely clean install', () => {
  /* The regression guard. This is the one test that must pass both before and
     after the change: nothing about a new device changes. */
  it('seeds the water-change history and the lighting note exactly as before', async () => {
    render(<ReefConsoleInner />)
    await started()

    await waitFor(() => expect((lsGet('water-changes') || []).length).toBe(25))
    expect((lsGet('lighting-log') || []).length).toBe(1)
    expect(document.body.textContent).not.toMatch(/cleared/i)
  })

  it('writes a witness so the next wipe is detectable', async () => {
    render(<ReefConsoleInner />)
    await started()

    await waitFor(async () => expect(await getWitness()).toBeTruthy())
    const w = await getWitness()
    expect(w.installId).toBeTruthy()
    expect(w.firstSeen).toMatch(/^\d{4}-\d{2}-\d{2}/)
  })
})

describe('the witness records the most this device ever held', () => {
  it('does not fall when the user deletes a reading', async () => {
    await saveKey('readings', [{ id: 'a' }, { id: 'b' }, { id: 'c' }])
    await saveKey('readings', [{ id: 'a' }])

    const w = await getWitness()
    expect(w.high['readings']).toBe(3)
  })

  it('does not call it a wipe when the user emptied the tank log themselves', async () => {
    /* Everything deleted by hand: the counts are zero, but the markers are
       still there, so localStorage was never cleared and nothing was lost. */
    await saveKey('readings', [{ id: 'a' }, { id: 'b' }])
    await saveKey('readings', [])
    await saveKey('wc-seeded', true)
    await saveKey('light-seeded', true)
    await saveKey('historical-seeded', true)
    await saveKey('icp-seeded', true)

    render(<ReefConsoleInner />)
    await started()

    expect(document.body.textContent).not.toMatch(/cleared/i)
  })
})

describe('with no IndexedDB at all', () => {
  it('starts, seeds as it always did, and claims nothing', async () => {
    delete window.indexedDB
    closePhotoStore()

    render(<ReefConsoleInner />)
    await started()

    await waitFor(() => expect((lsGet('water-changes') || []).length).toBe(25))
    expect(document.body.textContent).not.toMatch(/cleared/i)
  })
})
