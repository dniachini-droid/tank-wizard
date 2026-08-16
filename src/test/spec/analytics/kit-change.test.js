/* Spec conformance — §4 / §8 / §9 kit change must split the series
 *
 * docs/spec/reef-chemistry.md §4 (lines 118-120):
 *   "Kit change flag [user]. When the user records a change of test kit or
 *    brand, the app marks that point and must not read the step change
 *    across it as consumption or trend. It requests a fresh baseline."
 * §8 (line 196): "Readings across a recorded kit change do not combine."
 * §9 (line 209): "Treat a step change across a recorded kit change as real"
 * is one of the things the app must refuse to do.
 * Worked example 6 (lines 241-243): "GIVEN a kit change recorded between
 * reading 4 and 5 THEN series split at that point; no trend across the
 * boundary; fresh baseline requested."
 *
 * src/lib/analytics/icp-calibration.js `computeCalibration` takes a
 * `kitChanges` argument and genuinely honours it (readings before the
 * recorded date are excluded — see the `since`/`replaced` handling). None of
 * the three consumption-rate functions in scope do:
 *   computeElementConsumption(key, readings, waterChanges, settings)   — 4 args
 *   computeDemandSeries(key, readings, waterChanges, settings)          — 4 args
 *   calibrateDoseStrength(key, readings, doseLog, waterChanges, settings) — 5 args
 * None of them accept anything resembling a kit-change date, so there is no
 * way for a caller to tell them a kit change happened at all.
 */
import { describe, expect, it } from 'vitest'
import { computeElementConsumption } from '../../../lib/analytics/consumption.js'
import { computeDemandSeries } from '../../../lib/analytics/demand.js'
import { calibrateDoseStrength } from '../../../lib/analytics/dose-strength.js'
import { computeCalibration } from '../../../lib/analytics/icp-calibration.js'
import { DEFAULT_SETTINGS } from '../../../lib/analytics/water-changes.js'
import { PARAM_DEFS } from '../../../lib/constants.js'

/* The app no longer ships solution strengths — only the user's own bottle can
   say what a product delivers (reef-chemistry.md §16), so a fixture standing
   in for a dosing tank has to state its own. These are exactly the figures
   this suite used to inherit from DEFAULT_SETTINGS, so every expectation
   below is unchanged by their becoming explicit. */
const S = { ...DEFAULT_SETTINGS, volumeL: 68,
  dkhPerMlPer100L: 0.0533, caPpmPerMlPer100L: 0.36, mgPpmPerMlPer100L: 0.024 }
const alk = (date, value) => ({ id: date, param: 'alkalinity', date, value })

describe('signature check — none of the consumption-rate functions can be told about a kit change', () => {
  it('computeElementConsumption, computeDemandSeries and calibrateDoseStrength have no kitChanges parameter', () => {
    /* icp-calibration.computeCalibration is (readings, icps, paramDefs, windowDays, kitChanges) = 5 args,
       and genuinely uses the 5th. The three functions below have no equivalent slot at all. */
    expect(computeElementConsumption.length).toBe(4)
    expect(computeDemandSeries.length).toBe(4)
    expect(calibrateDoseStrength.length).toBe(5) // (key, readings, doseLog, waterChanges, settings) — no kitChanges
  })
})

describe('worked example 6 — kit change recorded between reading 4 and 5', () => {
  /* Readings 1-4 are the old kit's series. A kit change is recorded between
     4 and 5: the new kit reads a full 0.9 dKH lower on the same water, a step
     that dwarfs anything real drift could produce over a single day, and is
     exactly what §4's "step change" language describes. Readings 5-7 are the
     new kit's own gentle, real drift. */
  const readings = [
    alk('2026-07-01', 9.2),
    alk('2026-07-15', 9.0),
    alk('2026-07-25', 8.9),
    alk('2026-08-01', 8.8), // last reading on the OLD kit
    // --- kit change recorded here ---
    alk('2026-08-08', 7.9), // first reading on the NEW kit — step change, not real consumption
    alk('2026-08-10', 7.88),
    alk('2026-08-11', 7.86),
  ]

  it('SPEC VIOLATION: computeElementConsumption combines readings across the kit-change boundary into a single rate', () => {
    const result = computeElementConsumption('alkalinity', readings, [], S)
    /* Precondition: the series as a whole does satisfy every other §8 rule
       (>= 3 readings, >= 7-day span for alkalinity), so if the engine were
       kit-change aware it would have to refuse or split rather than silently
       succeed. */
    expect(result.status).toBe('ok')

    /* The engine picked up the last pre-change reading (2026-08-01, 8.8) plus
       the three post-change readings, spanning the kit-change boundary. */
    expect(result.rows).toBe(4)
    expect(result.spanDays).toBe(10)

    /* Within either sub-series alone, alkalinity is drifting gently — about
       -0.013 dKH/day pre-change (9.2 -> 8.8 over 31 days) and about
       -0.02 dKH/day post-change (7.9 -> 7.86 over 3 days). A rate an order of
       magnitude larger than either can only be the 0.9 dKH kit-swap step
       being read as if it were nine days of real consumption — exactly the
       "step change... read as consumption" §4 forbids. */
    expect(Math.abs(result.perDay)).toBeGreaterThan(0.5)
  })
})

describe('reference — icp-calibration.computeCalibration DOES honour a recorded kit change', () => {
  it('excludes a comparison pair taken before the recorded replacement date', () => {
    const def = PARAM_DEFS.find((d) => d.key === 'calcium')
    const readings = [
      { id: '1', param: 'calcium', date: '2026-07-01', value: 410 },
      { id: '2', param: 'calcium', date: '2026-08-01', value: 420 },
    ]
    const icps = [
      { date: '2026-07-02', elements: { calcium: 460 } }, // taken on the OLD kit's watch
      { date: '2026-08-02', elements: { calcium: 425 } }, // taken after the kit was replaced
    ]
    const kitChanges = { calcium: '2026-07-20' }
    const result = computeCalibration(readings, icps, [def], 7, kitChanges)
    const calciumResult = result.results.find((r) => r.def.key === 'calcium')
    /* Only the post-replacement pair survives — the pre-replacement ICP test
       against the old kit is excluded, exactly what §4's "fresh baseline"
       requires and exactly what the three functions above fail to do. */
    expect(calciumResult.pairs).toHaveLength(1)
    expect(calciumResult.pairs[0].date).toBe('2026-08-02')
  })
})
