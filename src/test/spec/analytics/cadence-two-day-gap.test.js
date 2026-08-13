/* Spec conformance — §4 / §9 the 2-day minimum interval between readings
 *
 * docs/spec/reef-chemistry.md §4 (lines 111-115):
 *   "Alkalinity is tested no more often than every 2 days. This is the design
 *    assumption for all consumption maths... The app must not compute a
 *    consumption rate from readings less than 2 days apart. It says when to
 *    test next instead."
 * §9 (line 208): "Compute consumption from readings less than 2 days apart"
 * is one of the things the app must refuse to do.
 * Worked example 5 (lines 238-239): "GIVEN two alk readings 1 day apart THEN
 * no consumption rate; states the 2-day minimum; says when to test next."
 *
 * Two separate claims are tested:
 *  1. Worked example 5 literally — exactly two readings, one day apart.
 *  2. The general rule, isolated from the "fewer than 3 readings" rule that
 *     also happens to catch example 5: three readings, enough to satisfy the
 *     minimum count and the minimum span, but with the CLOSEST pair only one
 *     day apart. §4 says this must still be refused. The 2-day boundary
 *     (closest pair exactly 2 days apart) must be accepted.
 */
import { describe, expect, it } from 'vitest'
import { computeConsumption, computeElementConsumption } from '../../../lib/analytics/consumption.js'
import { DEFAULT_SETTINGS } from '../../../lib/analytics/water-changes.js'

const S = { ...DEFAULT_SETTINGS, volumeL: 68 }
const alk = (date, value) => ({ id: date, param: 'alkalinity', date, value })

describe('worked example 5 — two alk readings 1 day apart', () => {
  it('computeElementConsumption gives no rate, and its "insufficient" signal ought to state the 2-day minimum and when to test next', () => {
    const readings = [alk('2026-08-12', 9.0), alk('2026-08-13', 8.95)]
    const result = computeElementConsumption('alkalinity', readings, [], S)
    expect(result.status).not.toBe('ok')
    /* §4 requires the app to state the 2-day minimum and say when to test
       next. Nothing on the "insufficient" result carries either message —
       only a bare need/have count. */
    const text = JSON.stringify(result)
    expect(text).toMatch(/2.?day/i)
  })

  it('computeConsumption gives no rate, not a silent null', () => {
    const readings = [alk('2026-08-12', 9.0), alk('2026-08-13', 8.95)]
    const result = computeConsumption(readings, S)
    /* §0: "would rather say 'not enough data' than produce a confident number
       from thin evidence" — a bare `null` says nothing about what it has or
       why, let alone the 2-day minimum or a next-test date. */
    expect(result).not.toBeNull()
  })
})

describe('a 1-day gap embedded inside an otherwise-valid series (isolated from the 3-reading minimum)', () => {
  it('SPEC VIOLATION: computeElementConsumption computes a rate even though the two most recent readings are only 1 day apart', () => {
    const readings = [
      alk('2026-08-01', 9.0),
      alk('2026-08-02', 8.9), // 1 day after the previous reading
      alk('2026-08-09', 8.4), // total span 8 days, satisfies alkalinity's 7-day floor
    ]
    /* Precondition: 3 readings, 8-day span — satisfies every other rule, so
       the 1-day gap between the first two is the only thing in question. */
    expect(readings.length).toBe(3)

    const result = computeElementConsumption('alkalinity', readings, [], S)
    /* §4/§9: must not compute a consumption rate when any pair feeding the
       regression is less than 2 days apart. The code has no pairwise-gap
       check at all, so this currently returns "ok" with a rate. */
    expect(result.status).not.toBe('ok')
  })

  it('accepts the boundary — closest pair exactly 2 days apart', () => {
    const readings = [
      alk('2026-08-01', 9.0),
      alk('2026-08-03', 8.8), // exactly 2 days after the previous reading
      alk('2026-08-09', 8.4),
    ]
    const result = computeElementConsumption('alkalinity', readings, [], S)
    expect(result.status).toBe('ok')
  })
})
