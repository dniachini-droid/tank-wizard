/* Spec conformance — §22: the water-change divergence is closed
 *
 * docs/spec/reef-chemistry.md §22 recorded that two layers answered the same
 * question differently: the three dosing engines fit the trend and subtract
 * only logged corrections (§6, 14 August), while the analytics layer's
 * `computeElementConsumption` additionally ran a mass-balance correction for
 * water changes inside the window.
 *
 * Owner decision, 16 August: one answer everywhere, and it is the engines'.
 * Water changes are not subtracted from consumption anywhere. The analytics
 * layer drops the mass-balance term:
 *
 *   was:  consumed = dosed + addedByWaterChanges - netChangeInTank
 *   is:   consumed = dosed - netChangeInTank
 *
 * which is the engines' `supplied - trendPerDay`, over the span rather than
 * per day. §22 records the decision and why the subtraction is deferred
 * rather than rejected.
 *
 * These are the regression tests for that. The property under test is not the
 * arithmetic of any one vector — it is that a water change inside the window
 * cannot move the consumption figure at all.
 */
import { describe, expect, it } from 'vitest'
import { computeElementConsumption } from '../../../lib/analytics/consumption.js'
import { DEFAULT_SETTINGS } from '../../../lib/analytics/water-changes.js'
import { SALT_MIX } from '../../../lib/analytics/salt-baseline.js'

/* volumeL = 100 keeps the arithmetic checkable by hand: 1 mL/day of a
   0.0533 dKH/mL/100L solution delivers exactly 0.0533 dKH/day. */
const S = { ...DEFAULT_SETTINGS, volumeL: 100, dailyDoseMl: 0 }
const readings = [
  { id: '1', param: 'alkalinity', date: '2026-08-05', value: 8.0 },
  { id: '2', param: 'alkalinity', date: '2026-08-09', value: 7.6 },
  { id: '3', param: 'alkalinity', date: '2026-08-13', value: 7.3 },
]

describe('§22 — a water change does not move the consumption figure', () => {
  it('a 20% change against a mismatched salt gives the same answer as no change at all', () => {
    /* The worst case for the old mass-balance term, and the one §22 keeps on
       the table: 20 L into 100 L is f = 0.2, and the nearest reading to the
       change date is 7.6 against SALT_MIX's 8.0, so the old code credited
       0.2 * (8.0 - 7.6) = 0.08 dKH to the water change and reported 0.78.
       That term is gone; both spans must now report the same figure. */
    const withChange = computeElementConsumption('alkalinity', readings, [{ date: '2026-08-09', litres: 20 }], S)
    const without = computeElementConsumption('alkalinity', readings, [], S)

    expect(withChange.status).toBe('ok')
    expect(withChange.consumedTotal).toBeCloseTo(without.consumedTotal, 12)
    expect(withChange.perDay).toBeCloseTo(without.perDay, 12)
  })

  it('holds for a change big enough to matter — 50% against a salt 2 dKH away', () => {
    /* Two to three noise floors is the size §22 says will matter eventually.
       Proving the figure is untouched at that size is the point: this is not
       a rounding tolerance, it is the absence of a term. */
    const far = readings.map((r) => ({ ...r, value: SALT_MIX.values.alkalinity - 2 + (r.value - 7.6) }))
    const withChange = computeElementConsumption('alkalinity', far, [{ date: '2026-08-09', litres: 50 }], S)
    const without = computeElementConsumption('alkalinity', far, [], S)

    expect(withChange.status).toBe('ok')
    expect(withChange.consumedTotal).toBeCloseTo(without.consumedTotal, 12)
  })

  it('reports no water-change contribution field at all, so no surface can re-add it', () => {
    /* One answer everywhere means the term is not merely unused — it is not
       published. A field that still carried it would invite a caller to do
       the arithmetic again and arrive somewhere else. */
    const result = computeElementConsumption('alkalinity', readings, [{ date: '2026-08-09', litres: 20 }], S)
    expect(result.wcContribution).toBeUndefined()
    expect(result.perChange).toBeUndefined()
  })

  it('still counts the water changes in the span, because that is honest context', () => {
    const result = computeElementConsumption('alkalinity', readings, [{ date: '2026-08-09', litres: 20 }], S)
    expect(result.wcCount).toBe(1)
  })
})

describe('§22 — the figure is the engines\' figure: dosed minus what stayed', () => {
  it('with no dose, consumption is exactly the fall in the tank', () => {
    /* Regression slope over (0,8.0) (4,7.6) (8,7.3) is -0.0875 dKH/day, so
       netChange over the 8-day span is -0.7 dKH and nothing was dosed:
       consumed = 0 - (-0.7) = 0.7 dKH, i.e. 0.0875 dKH/day. */
    const result = computeElementConsumption('alkalinity', readings, [], S)
    expect(result.netChange).toBeCloseTo(-0.7, 6)
    expect(result.dosed).toBe(0)
    expect(result.consumedTotal).toBeCloseTo(0.7, 6)
    expect(result.perDay).toBeCloseTo(0.0875, 6)
  })

  it('with a dose, consumption is the dose plus the fall — supplied minus trend, the engines\' identity', () => {
    /* 8 mL/day at 0.0533 dKH/mL/100L into 100 L is 0.4264 dKH/day supplied.
       The tank still fell 0.0875 dKH/day, so it consumed 0.5139 dKH/day. */
    const dosing = { ...S, dailyDoseMl: 8 }
    const result = computeElementConsumption('alkalinity', readings, [], dosing)
    expect(result.dosePerDay).toBeCloseTo(0.4264, 6)
    expect(result.perDay).toBeCloseTo(0.5139, 6)
    /* Stated as the identity rather than the vector, so this test fails if the
       shape of the balance changes and not merely its inputs. */
    expect(result.consumedTotal).toBeCloseTo(result.dosed - result.netChange, 12)
  })
})
