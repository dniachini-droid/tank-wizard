/* Defect 2 (inventory §6.2) — src/lib/analytics/consumption.js:92
 *
 * DOSE_ELEMENTS.magnesium.defaultStrength is 1.0 ppm/mL/100L. The same product,
 * described in the same units, is 0.024 in DEFAULT_SETTINGS
 * (src/lib/analytics/water-changes.js:46), and src/lib/dosing/magnesium.js:37-41
 * documents real magnesium supplements as ~0.012 at standard strength, 0.024 at
 * the double-strength mix used here. The two figures are ~42x apart.
 *
 * This is not a cosmetic disagreement: Setup.jsx:61 displays
 * `settings[strengthField] ?? defaultStrength` and Setup.jsx:97 persists
 * `strengthNum || elem.defaultStrength`, so the wrong figure is both shown to
 * the user and written into their settings. Every dose divides by strength, so
 * a magnesium recommendation comes out ~42x too small.
 *
 * Spec anchor: docs/spec/reef-chemistry.md §7 — `potency` is a single [user]
 * value per product per parameter, taken from the product's documentation, and
 * every recommendation states the potency it used. Two live potencies for one
 * bottle means at least one surface is stating a potency that is not the one
 * the maths used. §9 also forbids substituting a default for a missing
 * measurement without saying so — which is exactly what Setup.jsx:97 does with
 * this constant.
 */
import { describe, expect, it } from 'vitest'
import { DOSE_ELEMENTS } from '../../lib/analytics/consumption.js'
import { DEFAULT_SETTINGS } from '../../lib/analytics/water-changes.js'

const magnesium = DOSE_ELEMENTS.find((e) => e.key === 'magnesium')

describe('magnesium product strength', () => {
  it('is one figure, not two 42x apart', () => {
    /* Alkalinity and calcium already hold to this — the two tables agree to
       within display rounding. Magnesium is the odd one out. */
    const alkalinity = DOSE_ELEMENTS.find((e) => e.key === 'alkalinity')
    const calcium = DOSE_ELEMENTS.find((e) => e.key === 'calcium')
    expect(alkalinity.defaultStrength).toBeCloseTo(DEFAULT_SETTINGS.dkhPerMlPer100L, 3)
    expect(calcium.defaultStrength).toBeCloseTo(DEFAULT_SETTINGS.caPpmPerMlPer100L, 2)

    expect(magnesium.defaultStrength).toBeCloseTo(DEFAULT_SETTINGS.mgPpmPerMlPer100L, 4)

    /* And the surviving figure has to describe a magnesium product that
       exists. Per src/lib/dosing/magnesium.js:37-41: ~0.012 ppm/mL/100L at standard
       strength, 0.024 at double strength. 0.05 leaves generous headroom for a
       far more concentrated mix than anything on sale; 1.0 does not describe a
       magnesium supplement at all — it is roughly the concentration of a
       calcium part. */
    expect(magnesium.defaultStrength).toBeLessThanOrEqual(0.05)

    /* What the error costs, in the units the user reads. 8 mL/day into 77 L:
       0.25 ppm/day of magnesium against the default's claimed 10.4 ppm/day. */
    const perDay = (strength) => 8 * strength * (100 / 77)
    expect(perDay(magnesium.defaultStrength)).toBeCloseTo(perDay(DEFAULT_SETTINGS.mgPpmPerMlPer100L), 2)
  })
})
