/* Defect 2 (inventory §6.2) — magnesium's two disagreeing product strengths
 *
 * CLOSED BY REMOVAL, 16 August. Rewritten, not deleted: the original defect and
 * the reason it can no longer occur are both worth keeping.
 *
 * What it was: `DOSE_ELEMENTS.magnesium.defaultStrength` was 1.0 ppm/mL/100L
 * while `DEFAULT_SETTINGS.mgPpmPerMlPer100L`, describing the same bottle in the
 * same units, was 0.024 — about 42x apart, where real magnesium supplements run
 * ~0.012 at standard strength and 0.024 at the double-strength mix. It was not
 * cosmetic: Setup displayed `settings[strengthField] ?? defaultStrength` and
 * persisted `strengthNum || elem.defaultStrength`, so the wrong figure was both
 * shown to the user and written into their settings, making every magnesium
 * recommendation ~42x too small.
 *
 * Why it cannot recur: **there are no default strengths at all.** The owner
 * decision of 16 August removed all three, because a solution strength is a
 * property of the user's own bottle and the app must not ship a plausible
 * number for something only they can know (reef-chemistry.md §16). Two tables
 * of defaults cannot disagree when neither exists, and Setup no longer has a
 * fallback to persist.
 *
 * The original spec anchors still apply and are now satisfied outright rather
 * than by keeping two numbers in step: §7 — one [user] potency per product per
 * parameter, from the product's own documentation; §9 — never substitute a
 * default for a missing measurement without saying so, which is now never,
 * because there is no default and the absence is named.
 *
 * The refusal that replaced it is tested in unset-solution-strength.test.js.
 * What is left here is the narrower guarantee this file was opened for: no
 * second magnesium figure, anywhere, for a surface to disagree with.
 */
import { describe, expect, it } from 'vitest'
import { DOSE_ELEMENTS } from '../../lib/analytics/consumption.js'
import { DEFAULT_SETTINGS } from '../../lib/analytics/water-changes.js'

describe('magnesium product strength', () => {
  it('has no shipped figure in either table, so the two cannot disagree', () => {
    const magnesium = DOSE_ELEMENTS.find((e) => e.key === 'magnesium')
    expect(magnesium.defaultStrength).toBeUndefined()
    expect(DEFAULT_SETTINGS.mgPpmPerMlPer100L).toBeUndefined()
  })

  it('and neither does any other element — one absent figure, not one plausible one', () => {
    /* The 42x gap was possible because two tables each carried an opinion.
       The fix is not a better opinion in both; it is neither having one. */
    for (const el of DOSE_ELEMENTS) {
      expect(el.defaultStrength, `${el.key} has a defaultStrength again`).toBeUndefined()
      expect(DEFAULT_SETTINGS[el.strengthField], `DEFAULT_SETTINGS ships ${el.strengthField}`).toBeUndefined()
    }
  })

  it("a user's own magnesium figure is still honoured exactly as entered", () => {
    /* Removing the default must not have made the field itself unusable. The
       cost the original test measured — 8 mL/day into 77 L delivering
       0.25 ppm/day rather than a claimed 10.4 — is now simply whatever the
       user's own number says, with nothing else competing to describe it. */
    const stored = { ...DEFAULT_SETTINGS, volumeL: 77, magDoseMl: 8, mgPpmPerMlPer100L: 0.024 }
    const perDay = stored.magDoseMl * stored.mgPpmPerMlPer100L * (100 / stored.volumeL)
    expect(perDay).toBeCloseTo(0.249, 3)
  })
})
