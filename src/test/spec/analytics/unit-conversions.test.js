/* Spec conformance — §1 universal constants
 *
 * docs/spec/reef-chemistry.md §1 (lines 27-39):
 *   | Ca:alk consumption ratio | 7.15 ppm Ca per 1.0 dKH |
 *   | Mg | not consumed proportionally to calcification; depletes slowly and
 *         via water changes |
 *   | dKH <-> meq/L | 1 meq/L = 2.8 dKH |
 *   | ppm == mg/L | identical — display only, never convert |
 *   | L <-> US gal | 1 US gal = 3.78541 L |
 *   | L <-> imp gal | 1 imp gal = 4.54609 L — must be distinguished from US gal |
 *   | degC <-> degF | F = C * 9/5 + 32 |
 * §1 preamble (line 29): "Changing any of these without an [approved][chem]
 * item is an S1 defect."
 *
 * Coverage note: nothing under src/lib/analytics/ (or anywhere in src/, by
 * grep) implements US/imperial gallon conversion or degC<->degF conversion.
 * Those two rows of the constants table have no code to test in this scope —
 * see the final report for that gap. This file covers the three constants
 * that ARE implemented in scope: dKH<->meq/L (calcification.js), ppm==mg/L
 * (icp-calibration.js), and the Ca:alk ratio as it appears baked into the
 * default dose-strength pairing in consumption.js.
 */
import { describe, expect, it } from 'vitest'
import { computeSkeletonMass } from '../../../lib/analytics/calcification.js'
import { DOSE_ELEMENTS, CONSUMPTION_RULES, computeElementConsumption } from '../../../lib/analytics/consumption.js'
import { labValueFor } from '../../../lib/analytics/icp-calibration.js'
import { icpStatus, ICP_REFERENCE } from '../../../lib/analytics/icp-reference.js'
import { PARAM_DEFS } from '../../../lib/constants.js'
import { DEFAULT_SETTINGS } from '../../../lib/analytics/water-changes.js'

describe('dKH <-> meq/L: 1 meq/L = 2.8 dKH (computeSkeletonMass)', () => {
  it('divides alkalinity consumption by exactly 2.8 to get meq/L', () => {
    const volumeL = 200
    const alkConsumedPerDay = 0.56 // dKH/day, chosen to divide cleanly by 2.8
    const result = computeSkeletonMass(alkConsumedPerDay, volumeL)
    const expectedMeqPerDay = (alkConsumedPerDay / 2.8) * volumeL
    expect(result.meqPerDay).toBeCloseTo(expectedMeqPerDay, 10)
    expect(expectedMeqPerDay).toBeCloseTo(40, 10)
  })
})

describe('ppm == mg/L: identical, never converted (icp-calibration / icp-reference)', () => {
  const calciumDef = PARAM_DEFS.find((d) => d.key === 'calcium')

  it('labValueFor passes an ICP mg/L figure straight through to compare against a ppm kit reading, unscaled', () => {
    const lab = labValueFor(calciumDef, { calcium: 440 })
    expect(lab.value).toBe(440)
    expect(lab.converted).toBeNull()
  })

  it('icpStatus compares an ICP mg/L figure directly against the same-scale ppm reference band, unscaled', () => {
    /* ICP_REFERENCE.calcium is stated in mg/L (415-520). A PARAM_DEFS calcium
       reading of 430 ppm sits inside that band with no conversion applied. */
    const ref = ICP_REFERENCE.calcium
    expect(icpStatus(ref, 430)).toBe('ok')
    expect(icpStatus(ref, calciumDef.min)).toBe('low') // 400 ppm < 415 mg/L lower bound, compared raw
  })
})

describe('Ca:alk consumption ratio — 7.15 ppm Ca per 1.0 dKH (§1, S1-defect-if-changed)', () => {
  it('SPEC VIOLATION: DOSE_ELEMENTS default calcium/alkalinity strengths imply a ratio other than 7.15', () => {
    const alkEl = DOSE_ELEMENTS.find((e) => e.key === 'alkalinity')
    const caEl = DOSE_ELEMENTS.find((e) => e.key === 'calcium')
    /* Both defaults describe the same reference product line at the same
       (double) strength, so the ratio between them is the ratio the app
       hands a new user as "balanced". §1 fixes that ratio at 7.15 ppm Ca per
       1.0 dKH. */
    const impliedRatio = caEl.defaultStrength / alkEl.defaultStrength
    expect(impliedRatio).toBeCloseTo(7.15, 2)
  })

  it('magnesium demand is NOT derived from the calcification (Ca:alk) ratio — it uses its own dose settings only', () => {
    /* §1: "Mg | not consumed proportionally to calcification; depletes slowly
       and via water changes." Set an enormous alkalinity dose and a zero
       magnesium dose; if magnesium demand were even partly derived from the
       alkalinity/calcification figures, dosePerDay would be nonzero. */
    const s = { ...DEFAULT_SETTINGS, volumeL: 100, dailyDoseMl: 500, dkhPerMlPer100L: 1, magDoseMl: 0, mgPpmPerMlPer100L: 0.1 }
    expect(CONSUMPTION_RULES.magnesium.dose(s)).toBe(0)

    const readings = [
      { id: '1', param: 'magnesium', date: '2026-06-15', value: 1350 },
      { id: '2', param: 'magnesium', date: '2026-07-06', value: 1340 },
      { id: '3', param: 'magnesium', date: '2026-08-13', value: 1330 },
    ]
    const result = computeElementConsumption('magnesium', readings, [], s)
    expect(result.status).toBe('ok')
    expect(result.dosePerDay).toBe(0)
  })
})
