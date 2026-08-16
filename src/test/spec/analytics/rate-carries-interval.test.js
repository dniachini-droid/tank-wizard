/* Spec conformance — §8 the rate is always reported with the interval it
 * came from
 *
 * docs/spec/reef-chemistry.md §8 (line 198):
 *   "The rate is always reported with the interval it came from."
 *
 * A bare number (e.g. "0.7 dKH/day") asserts a precision and a currency the
 * reader can't check without knowing the span and dates it was drawn from.
 * This checks that both consumption-rate functions in scope expose the
 * interval on the object they return — not merely somewhere buried in a
 * `windows` array — since that is what a caller would actually render
 * alongside the number.
 */
import { describe, expect, it } from 'vitest'
import { computeConsumption, computeElementConsumption } from '../../../lib/analytics/consumption.js'
import { DEFAULT_SETTINGS } from '../../../lib/analytics/water-changes.js'

/* The app no longer ships solution strengths — only the user's own bottle can
   say what a product delivers (reef-chemistry.md §16), so a fixture standing
   in for a dosing tank has to state its own. These are exactly the figures
   this suite used to inherit from DEFAULT_SETTINGS, so every expectation
   below is unchanged by their becoming explicit. */
const S = { ...DEFAULT_SETTINGS, volumeL: 68,
  dkhPerMlPer100L: 0.0533, caPpmPerMlPer100L: 0.36, mgPpmPerMlPer100L: 0.024 }
const alk = (date, value) => ({ id: date, param: 'alkalinity', date, value })

describe('computeElementConsumption', () => {
  it('carries its span alongside the rate', () => {
    const readings = [alk('2026-08-06', 9.0), alk('2026-08-10', 8.9), alk('2026-08-13', 8.8)]
    const result = computeElementConsumption('alkalinity', readings, [], S)
    expect(result.status).toBe('ok')
    expect(result.perDay).toEqual(expect.any(Number))
    expect(result.spanDays).toEqual(expect.any(Number))
    expect(result.spanDays).toBe(7)
  })
})

describe('computeConsumption', () => {
  it('SPEC VIOLATION: reports a driftPerDay rate with no span or date-interval field on the result at all', () => {
    const readings = [alk('2026-08-01', 9.0), alk('2026-08-03', 8.8), alk('2026-08-05', 8.7),
      alk('2026-08-07', 8.5), alk('2026-08-09', 8.4), alk('2026-08-11', 8.2), alk('2026-08-13', 8.1)]
    const result = computeConsumption(readings, S)
    expect(result).not.toBeNull()
    expect(result.driftPerDay).toEqual(expect.any(Number))

    /* §8 requires the interval alongside the rate. Nothing on the top-level
       result names the span in days or the first/last date it was computed
       over — only `readingCount`, which is a count, not an interval. */
    const hasIntervalField = 'spanDays' in result || 'interval' in result
      || 'fromDate' in result || 'toDate' in result || 'days' in result
    expect(hasIntervalField).toBe(true)
  })
})
