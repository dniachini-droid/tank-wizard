/* Bug 3 (routine 15) — the dose-gap halving removed, stability grading fixed.
 *
 * These ship together (reef-chemistry.md §7 and §11, both decided 13 Aug):
 * the out-of-band halving in `doseDriftedFrom` existed only as a patch for
 * broken stability grading. Removing the halving without fixing grading
 * first would delete the only thing then catching a slow, out-of-band
 * decline — a regression, not a cleanup.
 *
 * §11, "the most dangerous defect": `alkBandOf`/`caBandOf`/`mgBandOf` graded
 * purely from |trend| against a flat threshold, with zero awareness of band
 * position. A tank losing 0.02 dKH/day graded "stable" regardless of where
 * the level sat — simulated over three years, that held a dose while
 * alkalinity fell past the safe floor on three dose changes total.
 *
 * The fix: a level outside its band and still moving further out is never
 * graded stable, whatever the rate — but only once two qualifiers hold:
 * movement away from the band (recovering back toward it is fine), and the
 * movement clears that element's own §5 kit noise floor (`STABILITY_RULES`)
 * over the span the trend was fitted across. That is a different constant
 * family from `ALK_TREND.stable`/`CA_TREND.stable`/`MG_TREND.stable`, which
 * bug 2 already established is a separate job.
 */
import { describe, expect, it } from 'vitest'
import { assessAlkalinity, alkBandOf } from '../../lib/dosing/alkalinity.js'
import { assessCalcium, caBandOf } from '../../lib/dosing/calcium.js'
import { assessMagnesium, mgBandOf, doseDriftedFrom } from '../../lib/dosing/helpers.js'
import { dayNum } from '../../lib/analytics/water-changes.js'

const day = (n) => new Date(Date.UTC(2026, 5, 1) + n * 86400000).toISOString().slice(0, 10)
const at = (n) => dayNum(day(n)) + 12 / 24
const read = (param, n, value) => ({ param, date: day(n), time: '09:00', value })

describe('doseDriftedFrom — the out-of-band halving is removed (§7, decided 13 Aug)', () => {
  it('DEFECT: an out-of-band 8% alkalinity gap no longer trips the trigger on its own', () => {
    /* Before the fix, being out of band halved the 12% trigger to 6%, so an
       8% gap alone (9.72 vs a current 9.0) fired doseDriftedFrom. The halving
       is gone: the same 12% applies whether the level is in band or out. */
    expect(doseDriftedFrom(9.72, 9.0, 'alkalinity', true)).toBe(false)
  })

  it('a 13% gap still trips the trigger, in band or out — the trigger itself is untouched', () => {
    expect(doseDriftedFrom(10.17, 9.0, 'alkalinity')).toBe(true)
    expect(doseDriftedFrom(10.17, 9.0, 'alkalinity', true)).toBe(true)
  })

  it('DEFECT: an out-of-band 22% calcium gap no longer trips the trigger on its own', () => {
    /* 30% trigger halved to 15% out of band used to catch a 22% gap. */
    expect(doseDriftedFrom(24.4, 20, 'calcium', true)).toBe(false)
  })

  it('a 31% calcium gap still trips the trigger', () => {
    expect(doseDriftedFrom(26.2, 20, 'calcium', true)).toBe(true)
  })

  it('magnesium has no trigger to halve — untouched, per §10', () => {
    expect(doseDriftedFrom(100, 8, 'magnesium', true)).toBe(false)
  })
})

describe('alkBandOf — §11, outside the band and worsening is never "stable"', () => {
  it('DEFECT: a 0.02 dKH/day trend outside the band used to grade stable regardless of position', () => {
    expect(alkBandOf(-0.02, true)).not.toBe('stable')
  })
  it('the same rate grades stable when recovering, not worsening', () => {
    expect(alkBandOf(-0.02, false)).toBe('stable')
  })
  it('a rate already fast on its own is unaffected', () => {
    expect(alkBandOf(-0.5, true)).toBe('significant')
    expect(alkBandOf(-0.5, false)).toBe('significant')
  })
})

describe('caBandOf — same fix, calcium\'s own scale', () => {
  it('DEFECT: a 3.5 ppm/week trend outside the band used to grade stable regardless of position', () => {
    expect(caBandOf(-3.5, true)).not.toBe('stable')
  })
  it('recovering at the same rate is unaffected', () => {
    expect(caBandOf(-3.5, false)).toBe('stable')
  })
})

describe('mgBandOf — same fix; magnesium has no DOSE_DRIFT_TRIGGER, so this is the only guard (§10)', () => {
  it('DEFECT: a 7 ppm/week trend outside the band used to grade stable regardless of position', () => {
    expect(mgBandOf(-7, true)).not.toBe('stable')
  })
  it('recovering at the same rate is unaffected', () => {
    expect(mgBandOf(-7, false)).toBe('stable')
  })
})

/* ---- End to end: the full assessment, not just the grading function ---- */

describe('assessAlkalinity — a slow, out-of-band decline no longer holds forever', () => {
  const def = { key: 'alkalinity', label: 'Alkalinity', unit: 'dKH', min: 8.2, max: 8.8, step: 0.1 }
  const settings = { volumeL: 72, dkhPerMlPer100L: 0.05, dailyDoseMl: 9.0 }

  it('DEFECT: 0.02 dKH/day below the band, clearing the noise floor over 16 days, is no longer "stable"', () => {
    /* §11's own worked shape: 0.02 dKH/day is under ALK_TREND.stable (0.10),
       so pre-fix this graded "stable" purely by rate. Over 16 days it moves
       0.32 dKH — well clear of the 0.1 dKH noise floor — so a trend fitted
       over this many readings can see it, per §11's own reasoning. The dose
       gap here is only ~3%, well under the 12% trigger either way, so
       doseDriftedFrom cannot be what saves this case — only grading can. */
    const readings = Array.from({ length: 9 }, (_, i) => read('alkalinity', i * 2, 7.90 - 0.02 * (i * 2)))
    const a = assessAlkalinity({
      readings, doseLog: [], waterChanges: [], corrections: [],
      settings, def, correctionPlans: {}, now: at(16),
    })
    expect(a.band).not.toBe('stable')
    expect(a.action).not.toBe('hold')
    expect(a.recommendedDose).toBeGreaterThan(a.currentDose)
  })

  it('the same slow rate, recovering back toward the band, still holds', () => {
    const readings = Array.from({ length: 9 }, (_, i) => read('alkalinity', i * 2, 7.90 + 0.02 * (i * 2)))
    const a = assessAlkalinity({
      readings, doseLog: [], waterChanges: [], corrections: [],
      settings, def, correctionPlans: {}, now: at(16),
    })
    expect(a.band).toBe('stable')
    expect(a.action).toBe('hold')
    expect(a.recommendedDose).toBe(a.currentDose)
  })
})

describe('assessCalcium — a slow, out-of-band decline no longer holds forever', () => {
  const def = { key: 'calcium', label: 'Calcium', unit: 'ppm', min: 400, max: 450, step: 1 }
  const settings = { volumeL: 200, caPpmPerMlPer100L: 0.36, calciumDoseMl: 20 }

  it('DEFECT: 0.5 ppm/day (3.5 ppm/week) below the band, clearing the noise floor over 25 days, is no longer "stable"', () => {
    /* 3.5 ppm/week is under CA_TREND.stable (5). Over 25 days it moves
       12.5 ppm, clearing the 10 ppm noise floor. The dose gap here is only
       ~14%, under the 30% trigger, so doseDriftedFrom cannot be what saves
       this case either. */
    const readings = Array.from({ length: 6 }, (_, i) => read('calcium', i * 5, 395 - 0.5 * (i * 5)))
    const a = assessCalcium({
      readings, doseLog: [], waterChanges: [], corrections: [],
      settings, def, correctionPlans: {}, now: at(25),
    })
    expect(a.band).not.toBe('stable')
    expect(a.action).not.toBe('hold')
    expect(a.recommendedDose).toBeGreaterThan(a.currentDose)
  })

  it('the same slow rate, recovering back toward the band, still holds', () => {
    const readings = Array.from({ length: 6 }, (_, i) => read('calcium', i * 5, 370 + 0.5 * (i * 5)))
    const a = assessCalcium({
      readings, doseLog: [], waterChanges: [], corrections: [],
      settings, def, correctionPlans: {}, now: at(25),
    })
    expect(a.band).toBe('stable')
    expect(a.action).toBe('hold')
    expect(a.recommendedDose).toBe(a.currentDose)
  })
})

describe('assessMagnesium — the only guard on a slow, out-of-band decline (§10, no DOSE_DRIFT_TRIGGER)', () => {
  const def = { key: 'magnesium', label: 'Magnesium', unit: 'ppm', min: 1250, max: 1400, step: 1 }
  const settings = { volumeL: 200, mgPpmPerMlPer100L: 0.012, magDoseMl: 8 }

  it('DEFECT: 1.05 ppm/day (7.35 ppm/week) below the band, clearing the noise floor over the fitted window, is no longer "stable"', () => {
    /* 7.35 ppm/week is under MG_TREND.stable (10). assessMagnesium keeps only
       the last 35 days of readings (Section 47), which here fits to a 30-day
       window once the earliest point falls just outside the horizon — 30
       days at 1.05 ppm/day is 31.5 ppm, clearing the 30 ppm noise floor.
       Magnesium has no DOSE_DRIFT_TRIGGER key at all (§10) — doseDriftedFrom
       is always false for magnesium, so grading is the *only* thing standing
       between this case and an indefinite hold. */
    const readings = Array.from({ length: 9 }, (_, i) => read('magnesium', i * 5, 1200 - 1.05 * (i * 5)))
    const a = assessMagnesium({
      readings, doseLog: [], waterChanges: [], corrections: [],
      settings, def, correctionPlans: {}, now: at(40),
    })
    expect(a.band).not.toBe('stable')
    expect(a.action).not.toBe('hold')
    expect(a.recommendedDose).toBeGreaterThan(a.currentDose)
  })

  it('the same slow rate, recovering back toward the band, still holds', () => {
    const readings = Array.from({ length: 9 }, (_, i) => read('magnesium', i * 5, 1200 + 1.05 * (i * 5)))
    const a = assessMagnesium({
      readings, doseLog: [], waterChanges: [], corrections: [],
      settings, def, correctionPlans: {}, now: at(40),
    })
    expect(a.band).toBe('stable')
    expect(a.action).toBe('hold')
    expect(a.recommendedDose).toBe(a.currentDose)
  })
})
