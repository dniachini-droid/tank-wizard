/* Spec conformance — §8 hard minimums for a consumption rate
 *
 * docs/spec/reef-chemistry.md §8 (lines 192-198):
 *   "Requires at least 3 readings spanning at least 6 days.
 *    Fewer: the app says 'insufficient data', shows what it has, gives no rate."
 * §9 (line 211): "Extrapolate a trend from fewer than 3 readings" is one of the
 * things the app must refuse to do.
 * §0 (lines 22-23): "The app would rather say 'not enough data' than produce a
 * confident number from thin evidence."
 *
 * Two functions in src/lib/analytics/consumption.js compute a consumption
 * rate: the alkalinity-specific `computeConsumption`, and the generalised,
 * water-change-aware `computeElementConsumption`. Both are tested against the
 * §8 floor directly. `computeElementConsumption` additionally enforces its own
 * per-element minimum (7 days for alkalinity, stricter than the spec's 6-day
 * floor, which §8's "at least" permits) — that boundary is locked here too so
 * a regression can't silently loosen it below the spec floor.
 *
 * Today, for the purposes of every fixture below, is 2026-08-13 (system
 * clock) — `windowRows` filters relative to the real current date, so all
 * fixture dates sit inside the last two weeks.
 */
import { describe, expect, it } from 'vitest'
import { computeConsumption, computeElementConsumption } from '../../../lib/analytics/consumption.js'
import { DEFAULT_SETTINGS } from '../../../lib/analytics/water-changes.js'

const S = { ...DEFAULT_SETTINGS, volumeL: 68 }
const alk = (date, value) => ({ id: date, param: 'alkalinity', date, value })

describe('computeConsumption (alkalinity-specific rate) vs the §8 floor', () => {
  it('refuses with 2 readings — not even 3', () => {
    const readings = [alk('2026-08-12', 9.0), alk('2026-08-13', 8.9)]
    const result = computeConsumption(readings, S)
    expect(result).toBeFalsy()
  })

  it('SPEC VIOLATION: computes a confident rate from 3 readings spanning only 5 days — under the 6-day floor', () => {
    const readings = [alk('2026-08-08', 9.0), alk('2026-08-10', 8.9), alk('2026-08-13', 8.8)]
    /* Precondition: this fixture has exactly 3 readings and a real (non-flat)
       drift, so the only thing standing between it and a rate should be the
       §8 span requirement. */
    expect(readings.length).toBe(3)

    const result = computeConsumption(readings, S)
    /* §8 requires at least 6 days of span. This span is 5 days
       (2026-08-08 to 2026-08-13), so the spec requires "insufficient data",
       not a number. computeConsumption performs no span check at all — only
       a row-count check — so it returns a full result. */
    expect(result).toBeNull()
  })

  it('accepts 3 readings spanning exactly 6 days — the boundary is inclusive', () => {
    const readings = [alk('2026-08-07', 9.0), alk('2026-08-10', 8.9), alk('2026-08-13', 8.8)]
    const result = computeConsumption(readings, S)
    expect(result).not.toBeNull()
    expect(result.driftPerDay).not.toBeNull()
  })
})

describe('computeElementConsumption (generalised, water-change-aware rate) vs the §8 floor', () => {
  it('reports an explicit insufficient-data status with 2 readings, not a bare null', () => {
    const readings = [alk('2026-08-12', 9.0), alk('2026-08-13', 8.9)]
    const result = computeElementConsumption('alkalinity', readings, [], S)
    expect(result.status).toBe('insufficient')
    /* "shows what it has" — the count of what it actually found. */
    expect(result.have).toBe(2)
    expect(result.status).not.toBeNull()
  })

  it('reports "tooshort" (not a rate) one day under alkalinity\'s own 7-day floor', () => {
    const readings = [alk('2026-08-07', 9.0), alk('2026-08-10', 8.9), alk('2026-08-13', 8.8)]
    const result = computeElementConsumption('alkalinity', readings, [], S)
    expect(result.status).toBe('tooshort')
    expect(result.spanDays).toBe(6)
    expect(result.minDays).toBe(7)
  })

  it('accepts exactly 7 days — alkalinity\'s own floor, itself no lower than the spec\'s 6-day minimum', () => {
    const readings = [alk('2026-08-06', 9.0), alk('2026-08-10', 8.9), alk('2026-08-13', 8.8)]
    const result = computeElementConsumption('alkalinity', readings, [], S)
    expect(result.status).toBe('ok')
    expect(result.spanDays).toBe(7)
  })
})
