/* Bug 6 (routine 15, TW-019) — remove magnesium from DOSE_ADVICE_RULES.
 *
 * Spec anchor: docs/spec/reef-chemistry.md §10, "What is exempt": "**The
 * maintenance dose is never tuned from readings.** Not delayed — exempt...
 * Any answer the app produced would be invented. `DOSE_DRIFT_TRIGGER` has no
 * magnesium key and must not gain one."
 *
 * `src/lib/analytics/drift.js`'s `DOSE_ADVICE_RULES` had its own magnesium
 * entry — independent of `DOSE_DRIFT_TRIGGER`, and independent of the real
 * dosing wizard (`assessMagnesium`) — computing a "suggested dose" straight
 * from a trend window. `computeDoseAdvice` iterates
 * `Object.keys(DOSE_ADVICE_RULES)` generically, so deleting the entry is the
 * whole fix; no special-casing needed elsewhere in `drift.js`.
 *
 * The one live consumer, `previewStrengthChange` (corrected-strength.js,
 * rendered at Insights.jsx:697-720), reads `adv.advice[key]` behind a
 * `e && e.calc && ...` guard already — this exercises that a magnesium
 * strength-change preview still returns sensibly, not `undefined` where a
 * number was expected, once `advice.magnesium` is simply absent.
 */
import { describe, expect, it } from 'vitest'
import { DOSE_ADVICE_RULES, computeDoseAdvice } from '../../lib/analytics/drift.js'
import { previewStrengthChange } from '../../lib/dosing/corrected-strength.js'
import { PARAM_DEFS } from '../../lib/constants.js'
import { DEFAULT_SETTINGS } from '../../lib/analytics/water-changes.js'
import { addDaysFromToday } from '../../lib/dates.js'

describe('DOSE_ADVICE_RULES — magnesium removed (§10)', () => {
  it('DEFECT: DOSE_ADVICE_RULES still has a magnesium key', () => {
    expect(Object.keys(DOSE_ADVICE_RULES)).not.toContain('magnesium')
  })

  it('alkalinity and calcium are untouched', () => {
    expect(DOSE_ADVICE_RULES.alkalinity).toBeTruthy()
    expect(DOSE_ADVICE_RULES.calcium).toBeTruthy()
  })
})

describe('computeDoseAdvice — a magnesium reading history that used to produce advice', () => {
  // A clear, sustained rise over three weeks — well past DOSE_ADVICE_RULES'
  // old 14-day window/40 ppm meaningful threshold and DRIFT_GUIDE's 25
  // ppm/week guide, and a real magDoseMl set, so this fixture produced a
  // real "adjust" advice entry (status, drift, calc.recommendedMl) before
  // this fix.
  const readings = Array.from({ length: 6 }, (_, i) => ({
    param: 'magnesium', date: addDaysFromToday(-(20 - i * 4)), time: '20:00', value: 1250 + i * 15,
  }))
  const settings = { ...DEFAULT_SETTINGS, volumeL: 200, mgPpmPerMlPer100L: 0.024, magDoseMl: 8 }

  it('DEFECT: computeDoseAdvice(...).advice has a magnesium property', () => {
    const adv = computeDoseAdvice(readings, [], PARAM_DEFS, 30, settings)
    expect(adv.advice).not.toHaveProperty('magnesium')
  })

  it('alkalinity and calcium advice keys are unaffected by the same call', () => {
    const alkReadings = Array.from({ length: 6 }, (_, i) => ({
      param: 'alkalinity', date: addDaysFromToday(-(12 - i * 2)), time: '20:00', value: 8.5 + i * 0.05,
    }))
    const s = { ...settings, dkhPerMlPer100L: 0.0533, dailyDoseMl: 9 }
    const adv = computeDoseAdvice([...readings, ...alkReadings], [], PARAM_DEFS, 30, s)
    expect(adv.advice).toHaveProperty('alkalinity')
    expect(adv.advice.alkalinity.status).not.toBe(undefined)
  })
})

describe('previewStrengthChange — a magnesium strength change, with the advice key gone', () => {
  const readings = Array.from({ length: 6 }, (_, i) => ({
    param: 'magnesium', date: addDaysFromToday(-(20 - i * 4)), time: '20:00', value: 1250 + i * 15,
  }))
  const settings = { ...DEFAULT_SETTINGS, volumeL: 200, mgPpmPerMlPer100L: 0.024, magDoseMl: 8 }

  it('returns a real preview, not a crash, and never surfaces a "Suggested dose" row for magnesium', () => {
    const preview = previewStrengthChange('magnesium', 0.03, readings, [], settings, PARAM_DEFS)
    expect(preview).toBeTruthy()
    expect(preview.rows.length).toBeGreaterThan(0)
    // No row's before/after is a bare "undefined" string — the failure shape
    // an unguarded `adv.advice.magnesium.calc.recommendedMl` would produce.
    for (const row of preview.rows) {
      expect(String(row.before)).not.toMatch(/undefined|NaN/)
      expect(String(row.after)).not.toMatch(/undefined|NaN/)
    }
    // §10: no dose suggestion for magnesium, from any source.
    expect(preview.rows.some((r) => r.label === 'Suggested dose')).toBe(false)
  })
})
