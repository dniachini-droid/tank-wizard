/* Spec conformance — §0 "not enough data" over a confident guess
 *
 * docs/spec/reef-chemistry.md §0 (lines 22-23):
 *   "The app would rather say 'not enough data' than produce a confident
 *    number from thin evidence."
 *
 * This is the philosophy underlying §8's "insufficient data" wording and the
 * §9 refusal list, but it is broader than either: ANY path that can't
 * support a confident answer should say so explicitly, not return a bare
 * `null` a caller has to interpret. `computeElementConsumption`,
 * `computeDemandSeries` (for alkalinity/calcium) and `calibrateDoseStrength`
 * already do this — they return a `status` field naming the reason. This
 * file collects the functions/paths in scope that do NOT: they return a bare
 * `null`, indistinguishable from any other reason a null might occur.
 */
import { describe, expect, it } from 'vitest'
import { computeConsumption } from '../../../lib/analytics/consumption.js'
import { computeSkeletonMass } from '../../../lib/analytics/calcification.js'
import { computeDemandSeries } from '../../../lib/analytics/demand.js'
import { calibrateDoseStrength } from '../../../lib/analytics/dose-strength.js'
import { DEFAULT_SETTINGS } from '../../../lib/analytics/water-changes.js'

const S = { ...DEFAULT_SETTINGS, volumeL: 68 }

describe('reference — paths that already comply: an explicit status, not a bare null', () => {
  it('computeDemandSeries("alkalinity") with too little data', () => {
    const result = computeDemandSeries('alkalinity', [], [], S)
    expect(result).not.toBeNull()
    expect(result.status).toBe('insufficient')
  })

  it('calibrateDoseStrength("alkalinity") with no dose log', () => {
    const result = calibrateDoseStrength('alkalinity', [], [], [], S)
    expect(result).not.toBeNull()
    expect(result.status).toBe('nochanges')
  })
})

describe('SPEC VIOLATION: paths in scope that return a bare, unlabelled null', () => {
  it('computeConsumption with fewer than 3 alkalinity readings', () => {
    const readings = [
      { id: '1', param: 'alkalinity', date: '2026-08-12', value: 9.0 },
      { id: '2', param: 'alkalinity', date: '2026-08-13', value: 8.9 },
    ]
    const result = computeConsumption(readings, S)
    /* Two readings exist. A caller receiving `null` cannot show "2 readings
       logged, need at least 3" the way computeElementConsumption's
       `{status:'insufficient', have:2, need:3}` can. */
    expect(result).not.toBeNull()
  })

  it('computeSkeletonMass with net volume unset', () => {
    const result = computeSkeletonMass(0.3, null)
    expect(result).not.toBeNull()
  })

  it('computeDemandSeries("magnesium") — not in the DEMAND_SERIES table at all, so it has no status of its own', () => {
    /* demand.js documents WHY magnesium is excluded (signal-to-noise ~1.2,
       "charting it would be drawing patterns in noise") — a genuinely
       defensible design choice. But the function's contract breaks down
       silently for this one key: every other key gets a `status`; magnesium
       gets a bare `null`, indistinguishable from a caller's own coding
       mistake (e.g. mistyping the key). */
    const result = computeDemandSeries('magnesium', [
      { id: '1', param: 'magnesium', date: '2026-06-01', value: 1350 },
      { id: '2', param: 'magnesium', date: '2026-07-01', value: 1345 },
      { id: '3', param: 'magnesium', date: '2026-08-01', value: 1340 },
    ], [], S)
    expect(result).not.toBeNull()
  })

  it('calibrateDoseStrength for a key with no DOSE_ELEMENTS entry', () => {
    const result = calibrateDoseStrength('potassium', [], [], [], S)
    expect(result).not.toBeNull()
  })
})
