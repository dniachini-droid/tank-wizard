/* Spec conformance — §2 / §9 net volume, never gross, everywhere
 *
 * docs/spec/reef-chemistry.md §2 (lines 48-52):
 *   "Every dose calculation uses net volume. Never gross... If net volume is
 *    unset, the app refuses to calculate any dose and names net volume as the
 *    missing input."
 * §9 (lines 204, 210): the app must refuse to "Calculate any dose when net
 * volume is unset" and to "Use gross volume anywhere".
 * Worked example 2 (lines 228-230): "GIVEN net volume unset THEN refuses;
 * names net volume as the missing input; offers the 0.85 helper."
 *
 * src/test/defects/net-volume.test.js already covers the silent 77 L
 * DEFAULT_SETTINGS fallback for assessAlkalinity — this file does not repeat
 * that. It checks the two OTHER §9-relevant entry points named in this
 * agent's brief: `predictAfterChange` and `computeSkeletonMass`, neither of
 * which is exercised by the existing defect test. For contrast,
 * `computeDemandSeries` and `calibrateDoseStrength` (both in scope) already
 * do this correctly and are locked here as the reference for what "right"
 * looks like in this codebase.
 */
import { describe, expect, it } from 'vitest'
import { predictAfterChange } from '../../../lib/analytics/consumption.js'
import { computeSkeletonMass } from '../../../lib/analytics/calcification.js'
import { computeDemandSeries } from '../../../lib/analytics/demand.js'
import { calibrateDoseStrength } from '../../../lib/analytics/dose-strength.js'
import { DEFAULT_SETTINGS } from '../../../lib/analytics/water-changes.js'
import { PARAM_DEFS } from '../../../lib/constants.js'

const calciumDef = PARAM_DEFS.filter((d) => d.key === 'calcium')
const latest = { calcium: { value: 420, date: '2026-08-10' } }

describe('predictAfterChange', () => {
  it('Precondition: with a known net volume it produces a normal, bounded prediction', () => {
    const result = predictAfterChange(latest, calciumDef, 68, 10)
    expect(result.pct).toBeCloseTo((10 / 68) * 100, 6)
    expect(result.rows[0].after).toBeGreaterThan(latest.calcium.value)
    expect(result.rows[0].after).toBeLessThan(SALT_MIX_VALUE)
  })

  it('SPEC VIOLATION: with volumeL unset (null, exactly as DEFAULT_SETTINGS.volumeL ships) it does not refuse — it silently predicts a 100% water change', () => {
    /* volumeL: null is exactly what a user who has never opened Setup has,
       per DEFAULT_SETTINGS (water-changes.js) and per App.jsx's settings
       spread. litres / null divides by zero, clamped to f = 1 (Math.min),
       which reads as "100% of the tank was replaced" — a specific, plausible
       -looking, and completely wrong number, not a refusal. */
    const result = predictAfterChange(latest, calciumDef, DEFAULT_SETTINGS.volumeL, 10)
    expect(result).toEqual({
      status: 'novolume',
      missing: 'net volume',
    })
  })

  it('SPEC VIOLATION: with volumeL undefined it does not refuse either — it silently returns NaN', () => {
    const result = predictAfterChange(latest, calciumDef, undefined, 10)
    expect(result).toEqual({
      status: 'novolume',
      missing: 'net volume',
    })
  })
})

const SALT_MIX_VALUE = 425 // Aquaforest Reef Salt calcium figure, from salt-baseline.js

describe('computeSkeletonMass', () => {
  it('Precondition: with a known net volume it produces a normal mass estimate', () => {
    const result = computeSkeletonMass(0.3, 68)
    expect(result.gPerDay).toBeGreaterThan(0)
  })

  it('SPEC VIOLATION: with volumeL unset it returns a bare null — refuses, correctly, but never names net volume as the missing input', () => {
    const result = computeSkeletonMass(0.3, null)
    /* Refusing is right. A bare null is indistinguishable from "consumption
       was zero or negative" (the function's OTHER null-returning branch), so
       nothing here actually names net volume as the missing input per §2/§7.6
       ("Any missing input is named. The app never substitutes a default
       silently"). */
    expect(result).not.toBeNull()
  })
})

describe('reference: computeDemandSeries and calibrateDoseStrength already refuse and name the missing input correctly', () => {
  it('computeDemandSeries reports an explicit "novolume" status', () => {
    const result = computeDemandSeries('alkalinity', [], [], { ...DEFAULT_SETTINGS, volumeL: null })
    expect(result.status).toBe('novolume')
  })

  it('calibrateDoseStrength reports an explicit "novolume" status', () => {
    const result = calibrateDoseStrength('alkalinity', [], [], [], { ...DEFAULT_SETTINGS, volumeL: null })
    expect(result.status).toBe('novolume')
  })
})
