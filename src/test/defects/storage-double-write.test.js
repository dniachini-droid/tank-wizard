/* TW-D3 (routines/14-phase7-durability.md §2.1) — every value written to
 * localStorage twice, halving the effective quota.
 *
 * `src/lib/storage.js` installed a shim at module load whenever
 * `window.storage` was absent, backing it with localStorage under the prefix
 * `reefconsole:`. `saveKey` treats `window.storage` as a host bridge and
 * mirrors every successful bridge write to `lsSet`, which writes localStorage
 * under `danstank:`.
 *
 * Nothing in index.html or src/main.jsx defines `window.storage`, so in the
 * shipped PWA the shim was always installed, the bridge branch was always
 * taken, and every value landed in localStorage twice, byte-identical, under
 * two prefixes. Confirmed by execution before this test was written:
 *
 *     saveKey('readings', [ …one reading… ])
 *       reefconsole:readings  -> 76 chars
 *       danstank:readings     -> 76 chars
 *       distinct keys: 2, copies identical
 *
 * The mirror itself is sound where a *real* host bridge exists — a bridge that
 * fails in an unexpected way should not lose the write, which is the reasoning
 * at storage.js:33-36. It buys nothing when the "bridge" is localStorage
 * itself, and costs 100% of the footprint. So the shim goes and the mirror
 * stays: the tests below pin both halves of that, plus the migration for
 * installs whose data is already under the legacy prefix.
 */
import { beforeEach, describe, expect, it } from 'vitest'
import {
  LEGACY_PREFIX, LS_PREFIX, drainLegacyStore, loadKey, lsGet, onStorageError, saveKey,
} from '../../lib/storage.js'

const keysWith = (prefix) => {
  const out = []
  for (let i = 0; i < window.localStorage.length; i++) {
    const k = window.localStorage.key(i)
    if (k && k.startsWith(prefix)) out.push(k)
  }
  return out
}

const READING = [{ id: 'r1', param: 'alkalinity', value: 8.2, date: '2026-08-14', note: '' }]

/* A localStorage that is out of room. jsdom's own `localStorage` is a Proxy
   that turns `localStorage.setItem = fn` into a *stored item* called "setItem"
   and leaves the real method in place, so the usual stub does nothing at all
   and the test passes for the wrong reason. Swap the whole object instead. */
function outOfSpace(seed = {}) {
  const m = new Map(Object.entries(seed))
  const full = { get length() { return m.size },
    key: (i) => [...m.keys()][i] ?? null,
    getItem: (k) => (m.has(k) ? m.get(k) : null),
    setItem: () => { const e = new Error('exceeded the quota'); e.name = 'QuotaExceededError'; throw e },
    removeItem: (k) => { m.delete(k) },
    clear: () => m.clear() }
  const real = window.localStorage
  Object.defineProperty(window, 'localStorage', { value: full, configurable: true, writable: true })
  return () => Object.defineProperty(window, 'localStorage', { value: real, configurable: true, writable: true })
}

beforeEach(() => {
  window.localStorage.clear()
  delete window.storage
})

describe('the shipped PWA, where no host bridge exists', () => {
  it('does not install a localStorage-backed bridge pretending to be one', () => {
    /* The module has already been loaded by the imports above; the shim, if it
       were still there, would have installed at that moment. `delete
       window.storage` in beforeEach only proves the absence is stable. */
    expect(window.storage).toBeUndefined()
  })

  it('writes each value to localStorage exactly once', async () => {
    await saveKey('readings', READING)
    await saveKey('correction-plans', { alkalinity: { target: 8.5, dose: 15 } })

    expect(keysWith(LEGACY_PREFIX)).toEqual([])
    expect(keysWith(LS_PREFIX).sort()).toEqual(['danstank:correction-plans', 'danstank:readings'])
  })

  it('reads back what it wrote', async () => {
    await saveKey('readings', READING)

    expect(await loadKey('readings', null)).toEqual(READING)
  })

  it('still names a full disk as a full disk when its one write fails', async () => {
    /* The quota message used to be reached only because the shim threw across
       the bridge branch. With no bridge there is nothing to throw, so the
       local failure has to carry the explanation itself — otherwise removing
       the shim would downgrade the one error a user can act on ("remove a few
       ICP photos") to "unknown error". */
    const said = []
    onStorageError((m) => said.push(m))
    const restore = outOfSpace()
    try {
      expect(await saveKey('readings', READING)).toBe(false)
    } finally {
      restore()
      onStorageError(null)
    }
    expect(said).toHaveLength(1)
    expect(said[0]).toMatch(/storage is full/i)
    expect(said[0]).not.toMatch(/unknown error/i)
  })
})

describe('a genuine host bridge', () => {
  /* The environment the mirror was written for. It is still mirrored, because
     there the second copy is a second *backend*, not a second copy in the same
     one. */
  it('is used, and is still mirrored to localStorage', async () => {
    const wrote = []
    window.storage = {
      async get() { throw new Error('key not found') },
      async set(key, value) { wrote.push([key, value]); return { key, value } },
    }

    await saveKey('readings', READING)

    expect(wrote).toEqual([['readings', JSON.stringify(READING)]])
    expect(lsGet('readings')).toEqual(READING)
  })

  it('falls through to localStorage when it throws, without losing the write', async () => {
    window.storage = { async set() { throw new Error('bridge exploded') } }

    expect(await saveKey('readings', READING)).toBe(true)
    expect(lsGet('readings')).toEqual(READING)
  })
})

describe('an install whose data is already under the legacy prefix', () => {
  /* Existing devices hold both copies, and the `reefconsole:` one is the copy
     `loadKey` preferred, so it is the authoritative one. Dropping the shim
     without draining it would silently revert any key whose mirror had gone
     stale — which is exactly what happens to a user near the quota, where the
     first write of the pair succeeds and the second fails.
     The invariant: after draining, `loadKey` returns what it returned before. */

  it('keeps the authoritative copy when the two disagree, and reclaims the duplicate', () => {
    window.localStorage.setItem(LEGACY_PREFIX + 'readings', JSON.stringify(READING))
    window.localStorage.setItem(LS_PREFIX + 'readings', JSON.stringify([]))   // stale mirror

    drainLegacyStore()

    expect(lsGet('readings')).toEqual(READING)
    expect(keysWith(LEGACY_PREFIX)).toEqual([])
  })

  it('reclaims the duplicate when the two agree, which is the ordinary case', () => {
    window.localStorage.setItem(LEGACY_PREFIX + 'readings', JSON.stringify(READING))
    window.localStorage.setItem(LS_PREFIX + 'readings', JSON.stringify(READING))

    const moved = drainLegacyStore()

    expect(lsGet('readings')).toEqual(READING)
    expect(keysWith(LEGACY_PREFIX)).toEqual([])
    expect(moved.reclaimed).toBe(1)
  })

  it('carries over a key that only ever existed under the legacy prefix', () => {
    window.localStorage.setItem(LEGACY_PREFIX + 'correction-plans', JSON.stringify({ alkalinity: { dose: 15 } }))

    drainLegacyStore()

    expect(lsGet('correction-plans')).toEqual({ alkalinity: { dose: 15 } })
  })

  it('leaves both copies alone, and still reads the authoritative one, when the carry-over cannot be written', async () => {
    const restore = outOfSpace({
      [LEGACY_PREFIX + 'readings']: JSON.stringify(READING),
      [LS_PREFIX + 'readings']: JSON.stringify([]),          // stale mirror
    })
    try {
      expect(drainLegacyStore()).toEqual({ reclaimed: 0, carried: 0, undrained: 1 })

      /* Nothing thrown away, and the value the app read yesterday is the value
         it reads today — a stale mirror must not win because the drain ran out
         of room. The next load retries, and by then space may have been freed. */
      expect(window.localStorage.getItem(LEGACY_PREFIX + 'readings')).toBe(JSON.stringify(READING))
      expect(await loadKey('readings', null)).toEqual(READING)
    } finally {
      restore()
    }
  })

  it('is a no-op on a device that has nothing under the legacy prefix', () => {
    window.localStorage.setItem(LS_PREFIX + 'readings', JSON.stringify(READING))

    expect(drainLegacyStore()).toEqual({ reclaimed: 0, carried: 0, undrained: 0 })
    expect(lsGet('readings')).toEqual(READING)
  })

  it('ignores unrelated localStorage entries belonging to other sites', () => {
    window.localStorage.setItem('someone-elses-key', 'x')
    window.localStorage.setItem(LEGACY_PREFIX + 'readings', JSON.stringify(READING))

    drainLegacyStore()

    expect(window.localStorage.getItem('someone-elses-key')).toBe('x')
  })
})
