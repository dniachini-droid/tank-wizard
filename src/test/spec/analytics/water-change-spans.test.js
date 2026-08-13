/* Spec conformance — §8 a water change between readings must be accounted
 * for, or the span discarded
 *
 * docs/spec/reef-chemistry.md §8 (line 197):
 *   "A water change between readings must be accounted for or the span
 *    discarded."
 *
 * src/lib/analytics/consumption.js `computeElementConsumption` implements a
 * mass-balance correction for water changes inside the window:
 *   consumed = dosed + addedByWaterChanges - netChangeInTank
 * where `addedByWaterChanges` (wcContribution) is `f * (saltVal - levelAtTheTime)`
 * for each recorded change, `f` being the fraction of the tank replaced.
 *
 * This file checks both halves of the spec sentence: the "accounted for"
 * branch reproduces the documented formula exactly (regression test, positive
 * case). The "or discarded" branch checks what happens when a water change is
 * recorded but cannot actually be accounted for — here, because its litres
 * were never entered — and finds the code does neither: it silently treats
 * the un-accountable change as if it contributed nothing, which is not the
 * same as discarding the span.
 */
import { describe, expect, it } from 'vitest'
import { computeElementConsumption } from '../../../lib/analytics/consumption.js'
import { DEFAULT_SETTINGS } from '../../../lib/analytics/water-changes.js'

/* volumeL = 100 and dailyDoseMl = 0 keep the arithmetic checkable by hand:
   dosed is always 0, so consumedTotal is just wcContribution - netChange. */
const S = { ...DEFAULT_SETTINGS, volumeL: 100, dailyDoseMl: 0 }
const readings = [
  { id: '1', param: 'alkalinity', date: '2026-08-05', value: 8.0 },
  { id: '2', param: 'alkalinity', date: '2026-08-09', value: 7.6 },
  { id: '3', param: 'alkalinity', date: '2026-08-13', value: 7.3 },
]

describe('a water change accounted for correctly', () => {
  it('matches the documented mass-balance formula exactly', () => {
    /* 20 L into 100 L is f = 0.2. SALT_MIX alkalinity value is 8.0. The
       nearest reading to the change date (2026-08-09) is 7.6, so the change
       contributes 0.2 * (8.0 - 7.6) = 0.08 dKH.
       Regression slope over (0,8.0) (4,7.6) (8,7.3) is -0.0875 dKH/day, so
       netChange over the 8-day span is -0.7 dKH.
       consumedTotal = dosed(0) + wcContribution(0.08) - netChange(-0.7) = 0.78 */
    const wc = [{ date: '2026-08-09', litres: 20 }]
    const result = computeElementConsumption('alkalinity', readings, wc, S)
    expect(result.status).toBe('ok')
    expect(result.wcContribution).toBeCloseTo(0.08, 6)
    expect(result.netChange).toBeCloseTo(-0.7, 6)
    expect(result.consumedTotal).toBeCloseTo(0.78, 6)
  })
})

describe('a water change that cannot be accounted for (litres never entered)', () => {
  it('SPEC VIOLATION: is silently treated as zero contribution rather than accounted for or the span discarded', () => {
    const wcNoLitres = [{ date: '2026-08-09' }] // litres unset — the change is real but its size is unknown
    const withUnaccountable = computeElementConsumption('alkalinity', readings, wcNoLitres, S)
    const withoutAnyChange = computeElementConsumption('alkalinity', readings, [], S)

    /* Precondition: a genuine water change with known litres, on the exact
       same readings, produces a materially different (accounted-for) result
       — proved above. So the question here is specifically what happens when
       the litres are missing, not whether accounting works at all. */
    expect(withUnaccountable.wcCount).toBe(1)

    /* §8: this span must either be corrected for the water change, or
       discarded outright. What actually happens is neither — an
       un-accountable water change (wcCount: 1) produces byte-for-byte the
       same consumedTotal as no water change at all (wcCount: 0), which means
       the recorded water change was silently ignored rather than accounted
       for or the span discarded. */
    expect(withUnaccountable.consumedTotal).not.toBeCloseTo(withoutAnyChange.consumedTotal, 6)
    /* Discarded means NOT "ok" with a number attached. */
    expect(withUnaccountable.status).not.toBe('ok')
  })
})
