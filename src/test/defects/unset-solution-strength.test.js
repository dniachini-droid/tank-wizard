/* An unset solution strength is refused and named — it is never assumed
 *
 * Owner decision, 16 August. The app must not ship a plausible number for
 * something only the user can know. A solution strength is a property of the
 * bottle in the user's cupboard: what that product delivers per mL, at the
 * dilution they mixed it to. Nothing in the app can check it, and everything
 * downstream is scaled by it — canon has called that the single largest
 * correctness risk since day one. A default made it worse than a blank,
 * because a blank at least shows that nothing was ever set.
 *
 * So the three shipped defaults are gone. An unset strength means:
 *   - no dose recommendation
 *   - no correction
 *   - the level, its movement, and whether it is in range, exactly as before
 *   - the missing input NAMED, not a silent null
 *
 * The same refusal shape as net volume (reef-chemistry.md §17, §12), for the
 * same reason: "the engines refuse and name it as the missing input instead".
 * `missingDoseInputs` already implemented this and already knew how to name a
 * missing strength — the default was what stopped it ever being reached.
 *
 * Existing stored values are deliberately untouched. Anyone already running on
 * a stored figure keeps it; only a setup with nothing stored gets the refusal.
 */
import { describe, expect, it } from 'vitest'
import { DOSE_ELEMENTS, computeConsumption, computeElementConsumption } from '../../lib/analytics/consumption.js'
import { DEFAULT_SETTINGS } from '../../lib/analytics/water-changes.js'
import { PARAM_DEFS } from '../../lib/constants.js'
import { assessAlkalinity } from '../../lib/dosing/alkalinity.js'
import { assessCalcium } from '../../lib/dosing/calcium.js'
import { assessMagnesium } from '../../lib/dosing/helpers.js'

const def = (k) => PARAM_DEFS.find((d) => d.key === k)
const DATES = ['2026-08-01', '2026-08-03', '2026-08-05', '2026-08-07', '2026-08-09', '2026-08-11']
/* A tank that is plainly falling: the level, the movement and the in-range
   verdict are all knowable from these readings alone, with no strength. */
const falling = (param, from, step) =>
  DATES.map((date, i) => ({ id: `${i}`, param, date, value: from - step * i }))

const STRENGTH_FIELDS = ['dkhPerMlPer100L', 'caPpmPerMlPer100L', 'mgPpmPerMlPer100L']

describe('the app ships no solution strength at all', () => {
  it('DEFAULT_SETTINGS carries none of the three', () => {
    for (const f of STRENGTH_FIELDS) {
      expect(DEFAULT_SETTINGS[f], `DEFAULT_SETTINGS still ships ${f}`).toBeUndefined()
    }
  })

  it('DOSE_ELEMENTS carries no defaultStrength', () => {
    for (const el of DOSE_ELEMENTS) {
      expect(el.defaultStrength, `${el.key} still has a defaultStrength`).toBeUndefined()
    }
  })

  it('and no hint offers a figure to type in', () => {
    /* "Aquaforest 1:1 is about 0.36" is the problem, not the solution: a
       number the user has not checked against their own bottle is exactly
       what the default was. The hints may say where to find the figure; they
       may not supply one. */
    for (const el of DOSE_ELEMENTS) {
      expect(el.hint, `${el.key} hint suggests a strength figure`).not.toMatch(/\d*\.\d+/)
    }
  })
})

describe('with no strength set, each engine refuses and names it', () => {
  const CASES = [
    ['alkalinity', () => assessAlkalinity({
      readings: falling('alkalinity', 8.6, 0.08), doseLog: [], waterChanges: [],
      settings: { volumeL: 100, dailyDoseMl: 8 }, def: def('alkalinity'),
    }), 'alkalinity'],
    ['calcium', () => assessCalcium({
      readings: falling('calcium', 440, 4), doseLog: [], waterChanges: [],
      settings: { volumeL: 100, calciumDoseMl: 9 }, def: def('calcium'),
    }), 'calcium'],
    ['magnesium', () => assessMagnesium({
      readings: falling('magnesium', 1380, 5), doseLog: [], waterChanges: [],
      settings: { volumeL: 100, magDoseMl: 8 }, def: def('magnesium'),
    }), 'magnesium'],
  ]

  for (const [element, run, label] of CASES) {
    it(`${element}: no recommendation, and the reason names the strength`, () => {
      const out = run()
      expect(out.ok).toBe(false)
      expect(out.recommendedDose).toBeNull()
      /* Named, not a bare null — a caller must be able to tell "nothing to do"
         from "we were never told what your product delivers". */
      expect(out.reason).toBeTruthy()
      expect(out.reason.toLowerCase()).toContain(`${label} solution strength`)
      expect(out.reason).toMatch(/Setup/)
    })

    it(`${element}: names only the strength when the volume IS set`, () => {
      /* The volume refusal and the strength refusal are the same shape, and
         must not be confused for one another. */
      const out = run()
      expect(out.reason).not.toMatch(/net volume/)
    })
  }
})

describe('the refusal is per element — one missing strength does not silence the others', () => {
  /* Explicitly confirmed by the owner, 16 August. A keeper who has entered
     their alkalinity figure but not their calcium one gets full alkalinity
     advice and a named refusal on calcium — not a blanket silence, and not
     alkalinity advice quietly computed from a calcium assumption. */
  const settings = { volumeL: 100, dailyDoseMl: 8, calciumDoseMl: 9, magDoseMl: 8,
                     dkhPerMlPer100L: 0.0533 }

  it('alkalinity is fully assessed when only its own strength is set', () => {
    const out = assessAlkalinity({
      readings: falling('alkalinity', 8.6, 0.08), doseLog: [], waterChanges: [],
      settings, def: def('alkalinity'),
    })
    expect(out.ok).toBe(true)
    expect(out.effectPerMl).toBeGreaterThan(0)
  })

  it('calcium refuses in the same breath, naming only calcium', () => {
    const out = assessCalcium({
      readings: falling('calcium', 440, 4), doseLog: [], waterChanges: [],
      settings, def: def('calcium'),
    })
    expect(out.ok).toBe(false)
    expect(out.reason).toContain('calcium solution strength')
    expect(out.reason).not.toContain('alkalinity')
  })

  it('magnesium refuses too, independently of both', () => {
    const out = assessMagnesium({
      readings: falling('magnesium', 1380, 5), doseLog: [], waterChanges: [],
      settings, def: def('magnesium'),
    })
    expect(out.ok).toBe(false)
    expect(out.reason).toContain('magnesium solution strength')
  })

  it('and the consumption figures follow the same per-element rule', () => {
    const readings = [...falling('alkalinity', 8.6, 0.08), ...falling('calcium', 440, 4)]
    expect(computeElementConsumption('alkalinity', readings, [], settings).status).toBe('ok')
    expect(computeElementConsumption('calcium', readings, [], settings).status).toBe('nostrength')
  })
})

describe('a stored strength still works — existing setups are untouched', () => {
  it('alkalinity assesses normally when the user has entered their own figure', () => {
    const out = assessAlkalinity({
      readings: falling('alkalinity', 8.6, 0.08), doseLog: [], waterChanges: [],
      settings: { volumeL: 100, dailyDoseMl: 8, dkhPerMlPer100L: 0.0533 },
      def: def('alkalinity'),
    })
    expect(out.ok).toBe(true)
    expect(out.effectPerMl).toBeGreaterThan(0)
  })

  it('the refusal is about the strength being absent, not about its value', () => {
    /* A zero or negative strength is not a product; it is an unusable entry,
       and it refuses for the same reason rather than dividing by it. */
    for (const bad of [0, -1]) {
      const out = assessAlkalinity({
        readings: falling('alkalinity', 8.6, 0.08), doseLog: [], waterChanges: [],
        settings: { volumeL: 100, dailyDoseMl: 8, dkhPerMlPer100L: bad },
        def: def('alkalinity'),
      })
      expect(out.ok).toBe(false)
      expect(out.reason).toContain('solution strength')
    }
  })
})

describe('the consumption figures refuse in the same way, rather than reporting NaN', () => {
  it('computeElementConsumption names the missing strength', () => {
    const out = computeElementConsumption('alkalinity',
      falling('alkalinity', 8.6, 0.08), [], { volumeL: 100, dailyDoseMl: 8 })
    expect(out.status).toBe('nostrength')
    expect(out.missing).toBe('alkalinity solution strength')
    /* The one thing it must never do is present arithmetic done with an
       absent number. */
    expect(out.perDay).toBeUndefined()
  })

  it('computeElementConsumption still works from a stored strength', () => {
    const out = computeElementConsumption('alkalinity',
      falling('alkalinity', 8.6, 0.08), [],
      { volumeL: 100, dailyDoseMl: 8, dkhPerMlPer100L: 0.0533 })
    expect(out.status).toBe('ok')
    expect(Number.isFinite(out.perDay)).toBe(true)
  })

  it('computeConsumption gives no rate rather than a NaN one', () => {
    const out = computeConsumption(falling('alkalinity', 8.6, 0.08),
      { volumeL: 100, dailyDoseMl: 8 })
    /* Whatever shape it returns, it must not hand a caller NaN dressed as a
       number. */
    if (out) {
      for (const k of ['dosePerDayDkh', 'consumption', 'recommendedMl', 'adjustMl']) {
        expect(Number.isNaN(out[k]), `${k} is NaN`).toBe(false)
      }
    }
  })
})
