/* Spec conformance — water changes inside a consumption span
 *
 * SUPERSEDED AND REWRITTEN, 16 August, by owner decision closing §22's
 * divergence. What this file used to assert, and why it no longer holds:
 *
 *   It tested the older §8 sentence, "a water change between readings must be
 *   accounted for or the span discarded", against
 *   `computeElementConsumption`'s mass-balance correction
 *   (consumed = dosed + addedByWaterChanges - netChangeInTank). Two cases:
 *   the accounted-for branch reproduced the formula exactly (20 L into 100 L
 *   crediting 0.08 dKH, total 0.78), and the "or discarded" branch was a
 *   standing SPEC VIOLATION — a water change with no litres recorded was
 *   silently treated as contributing nothing rather than being accounted for
 *   or the span discarded.
 *
 *   Both are moot. §6's 14 August decision settled the three dosing engines
 *   the other way — water changes stay in the trend fit — and §22 recorded
 *   that the two layers therefore answered the same question differently and
 *   that the divergence needed one answer. It now has one: the engines'. The
 *   mass-balance term is gone from the analytics layer, so there is no
 *   accounting to get right and nothing for a missing litres field to break.
 *
 * The formula's own regression tests live in water-change-not-subtracted.test.js.
 * What is left here is the case the old SPEC VIOLATION was really about: a
 * water change the app cannot size must not quietly change what the app says.
 * Under the new rule it cannot, and this file holds that line — including for
 * the malformed records the old code path had to defend against.
 */
import { describe, expect, it } from 'vitest'
import { computeElementConsumption } from '../../../lib/analytics/consumption.js'
import { DEFAULT_SETTINGS } from '../../../lib/analytics/water-changes.js'

const S = { ...DEFAULT_SETTINGS, volumeL: 100, dailyDoseMl: 0 }
const readings = [
  { id: '1', param: 'alkalinity', date: '2026-08-05', value: 8.0 },
  { id: '2', param: 'alkalinity', date: '2026-08-09', value: 7.6 },
  { id: '3', param: 'alkalinity', date: '2026-08-13', value: 7.3 },
]

describe('a water change that cannot be sized (litres never entered)', () => {
  it('no longer needs accounting for, and reports the same figure as any other span', () => {
    /* This was the SPEC VIOLATION. The old code could not tell an
       un-sizeable change from no change, and under a rule that required
       accounting, that silence was the bug. Under §22's rule the two are
       genuinely the same case, so the equality below is the correct
       behaviour rather than the symptom. */
    const withUnsizeable = computeElementConsumption('alkalinity', readings, [{ date: '2026-08-09' }], S)
    const withoutAnyChange = computeElementConsumption('alkalinity', readings, [], S)

    expect(withUnsizeable.status).toBe('ok')
    expect(withUnsizeable.consumedTotal).toBeCloseTo(withoutAnyChange.consumedTotal, 12)
  })

  it('is still counted, so the reader is told it happened', () => {
    /* The size is unknown; the fact is not. Dropping it from the count would
       be the app hiding something it was told. */
    const result = computeElementConsumption('alkalinity', readings, [{ date: '2026-08-09' }], S)
    expect(result.wcCount).toBe(1)
  })
})

describe('malformed water-change records', () => {
  it('a change with zero, negative or absent litres cannot throw or skew the figure', () => {
    const junk = [
      { date: '2026-08-06', litres: 0 },
      { date: '2026-08-07', litres: -5 },
      { date: '2026-08-08' },
      { date: '2026-08-10', litres: 10 },
    ]
    const withJunk = computeElementConsumption('alkalinity', readings, junk, S)
    const clean = computeElementConsumption('alkalinity', readings, [], S)

    expect(withJunk.status).toBe('ok')
    expect(withJunk.consumedTotal).toBeCloseTo(clean.consumedTotal, 12)
    expect(withJunk.wcCount).toBe(4)
  })

  it('changes outside the fitted span are not counted', () => {
    /* The span is 5 to 13 August. A change in July belongs to a window this
       figure does not describe. */
    const outside = [{ date: '2026-07-01', litres: 20 }, { date: '2026-08-09', litres: 20 }]
    const result = computeElementConsumption('alkalinity', readings, outside, S)
    expect(result.wcCount).toBe(1)
  })
})
