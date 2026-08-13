/* Spec conformance — dose-strength calibration feeds §7's dose_mL formula
 *
 * docs/spec/reef-chemistry.md §7 (lines 169-177):
 *   "dose_mL = (target - current) x net_volume_L / potency ... `potency`
 *    [user] = change in the parameter per mL per litre..."
 *
 * calibrateDoseStrength (src/lib/analytics/dose-strength.js) estimates
 * `potency` itself from a logged dose change, using
 *   k = (s1 - s2) / (D1 - D2)
 * (documented in the file's own header comment). Nothing anywhere in the
 * existing test suite exercised the "ok" branch of this function before this
 * file — a wrong potency estimate here becomes a wrong dose_mL downstream,
 * so this locks the formula against a hand-computed, zero-noise fixture
 * where the correct answer is unambiguous.
 */
import { describe, expect, it } from 'vitest'
import { calibrateDoseStrength } from '../../../lib/analytics/dose-strength.js'
import { DEFAULT_SETTINGS } from '../../../lib/analytics/water-changes.js'

const S = { ...DEFAULT_SETTINGS, volumeL: 100 }

/* Exactly linear, noise-free series either side of a dose change, so the
   regression slopes are exact and the expected potency is knowable by hand.
   Before the change (8 mL/day): drift -0.10 dKH/day.
   After the change (12 mL/day): drift -0.02 dKH/day.
   k = (s1 - s2) / (D1 - D2) = (-0.10 - -0.02) / (8 - 12) = -0.08 / -4 = 0.02
   strength = k * volumeL / 100 = 0.02 * 100 / 100 = 0.02 */
const before = [
  { id: 'b1', param: 'alkalinity', date: '2026-06-10', value: 9.0 },
  { id: 'b2', param: 'alkalinity', date: '2026-06-15', value: 8.5 },
  { id: 'b3', param: 'alkalinity', date: '2026-06-20', value: 8.0 },
  { id: 'b4', param: 'alkalinity', date: '2026-06-25', value: 7.5 },
  { id: 'b5', param: 'alkalinity', date: '2026-06-30', value: 7.0 },
]
const after = [
  { id: 'a1', param: 'alkalinity', date: '2026-07-02', value: 6.90 },
  { id: 'a2', param: 'alkalinity', date: '2026-07-08', value: 6.78 },
  { id: 'a3', param: 'alkalinity', date: '2026-07-14', value: 6.66 },
  { id: 'a4', param: 'alkalinity', date: '2026-07-20', value: 6.54 },
]
const readings = [...before, ...after]
const doseLog = [
  { date: '2026-06-01', ml: 8, element: 'alkalinity' },
  { date: '2026-07-01', ml: 12, element: 'alkalinity' },
]

describe('calibrateDoseStrength — the k = (s1 - s2) / (D1 - D2) formula', () => {
  it('recovers the exact potency from a clean before/after fixture', () => {
    const result = calibrateDoseStrength('alkalinity', readings, doseLog, [], S)
    expect(result.status).toBe('ok')
    expect(result.estimates).toHaveLength(1)
    const est = result.estimates[0]
    expect(est.slopeBefore).toBeCloseTo(-0.10, 6)
    expect(est.slopeAfter).toBeCloseTo(-0.02, 6)
    expect(est.kPerMl).toBeCloseTo(0.02, 6)
    expect(est.strength).toBeCloseTo(0.02, 6)
    expect(result.median).toBeCloseTo(0.02, 6)
  })

  it('a water change inside either comparison window disqualifies that estimate rather than silently corrupting it', () => {
    const wc = [{ date: '2026-06-18', litres: 10 }] // falls inside the "before" window
    const result = calibrateDoseStrength('alkalinity', readings, doseLog, wc, S)
    expect(result.status).toBe('nodata')
    expect(result.skipped[0].why).toMatch(/water change/i)
  })

  it('a dose change too small to measure against is skipped, not force-fit', () => {
    const smallLog = [
      { date: '2026-06-01', ml: 8, element: 'alkalinity' },
      { date: '2026-07-01', ml: 8.3, element: 'alkalinity' }, // 3.75% change
    ]
    const result = calibrateDoseStrength('alkalinity', readings, smallLog, [], S)
    expect(result.status).toBe('nodata')
    expect(result.skipped[0].why).toMatch(/too small/i)
  })
})
