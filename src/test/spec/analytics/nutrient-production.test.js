/* Spec conformance — nutrients.js net volume refusal and mass-balance
 * arithmetic, in support of §2 / §8's water-change accounting requirement
 *
 * docs/spec/reef-chemistry.md §2 (line 48): "Every dose calculation uses net
 * volume. Never gross"; §9 (line 204): the app must refuse to "Calculate any
 * dose when net volume is unset". computeNutrientProduction is not a dose
 * calculation itself, but every downstream number it produces (perWeek,
 * holdAtMax, equilibrium) is volume-dependent the same way a dose is, and
 * the function already refuses correctly — this locks that, and locks the
 * mass-balance formula the module's own header comment documents:
 *   P = [ (Cend - Cstart) + SUM_i f_i*(C_i - Cnew) ] / days
 * against a hand-computed, unambiguous fixture (nothing exercised the "ok"
 * branch of this function before this file).
 */
import { describe, expect, it } from 'vitest'
import { computeNutrientProduction } from '../../../lib/analytics/nutrients.js'
import { DEFAULT_SETTINGS } from '../../../lib/analytics/water-changes.js'

const S = { ...DEFAULT_SETTINGS, volumeL: 100 }

/* Phosphate: SALT_MIX puts fresh saltwater at 0 ppm. f = 10L / 100L = 0.1.
   removed = f * (levelAtChange - 0) = 0.1 * 0.07 = 0.007
   perDay = ((0.09 - 0.05) + 0.007) / 54 = 0.047 / 54 */
const readings = [
  { id: '1', param: 'phosphate', date: '2026-06-20', value: 0.05 },
  { id: '2', param: 'phosphate', date: '2026-07-15', value: 0.07 },
  { id: '3', param: 'phosphate', date: '2026-08-13', value: 0.09 },
]
const waterChanges = [{ date: '2026-07-15', litres: 10 }]

describe('computeNutrientProduction', () => {
  it('refuses with net volume unset, rather than dividing by an unset volume', () => {
    const result = computeNutrientProduction('phosphate', readings, waterChanges, { ...S, volumeL: null })
    expect(result.status).toBe('novolume')
  })

  it('matches the documented mass-balance formula exactly', () => {
    const result = computeNutrientProduction('phosphate', readings, waterChanges, S)
    expect(result.status).toBe('ok')
    expect(result.spanDays).toBe(54)
    expect(result.removed).toBeCloseTo(0.007, 8)
    expect(result.perDay).toBeCloseTo(0.047 / 54, 8)
    expect(result.perWeek).toBeCloseTo((0.047 / 54) * 7, 8)
  })

  it('without any logged water changes, reports net drift only — and says so — rather than a false zero production figure', () => {
    const result = computeNutrientProduction('phosphate', readings, [], S)
    expect(result.status).toBe('nowaterchanges')
    expect(result.netDrift).toBeCloseTo(((0.09 - 0.05) / 54) * 7, 8)
  })
})
