/* Out and clearly out — reef-chemistry.md §27, decided 15 Aug.
 *
 * Owner decision, closing `.agent/needs-dan.md` item 5:
 *
 *   "Out and clearly out are two different questions and get two different
 *    numbers. A level is out the moment it is past the band edge by any
 *    amount. 455 ppm against a 400–450 band is out. There is no margin on
 *    this. A level is clearly out once it is past the edge by a fixed margin:
 *    calcium 50 ppm, magnesium 50 ppm, alkalinity 0.5 dKH. Fixed figures, not
 *    scaled to band width."
 *
 * The fault item 5 reported is dimensional. `caClearlyOut` (`calcium.js`) and
 * magnesium's `clearlyOut` (`helpers.js`) measured a **distance** past the
 * edge — ppm — against `CA_TREND.stable` (5 ppm per **week**) and
 * `MG_TREND.stable` (10 ppm per week), which are rate constants, declared as
 * such in their own comments. `alkClearlyOut` used a literal 0.2, which is a
 * dKH distance and dimensionally right but too small under this decision.
 *
 * So this file pins three things:
 *
 *  1. **Out has no margin.** A hair past the edge is out, on every element, in
 *     both directions. This half already held and is pinned so it cannot
 *     acquire a tolerance later.
 *  2. **Clearly out is the new fixed margin**, and it is the margin that
 *     governs — a level past the edge by more than the OLD constant but less
 *     than the new one is no longer clearly out.
 *  3. **The margins are their own constants.** Not the trend constants, not
 *     the kit noise floors. Adjusting how fast counts as moving must never
 *     change how far counts as out, and the structural checks at the bottom
 *     are what stop that happening again.
 */
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { PARAM_DEFS } from '../../lib/constants.js'
import { DEFAULT_SETTINGS, dayNum } from '../../lib/analytics/water-changes.js'
import { ALK_CLEARLY_OUT, assessAlkalinity } from '../../lib/dosing/alkalinity.js'
import { CA_CLEARLY_OUT, assessCalcium } from '../../lib/dosing/calcium.js'
import { assessMagnesium } from '../../lib/dosing/helpers.js'
import { MG_CLEARLY_OUT } from '../../lib/dosing/magnesium.js'
import { doseStatus } from '../../lib/dosing/state.js'

const TODAY = '2026-08-15'
const NOW = dayNum(TODAY) + 12 / 24
const addDays = (iso, n) =>
  new Date(new Date(iso + 'T00:00:00Z').getTime() + n * 86400000).toISOString().slice(0, 10)

/* `drift` is the per-reading movement of the fixture series: enough to give a
   direction, small enough that the trend stays inside the element's own
   "stable" grade, which is what puts the assessment on the branch `clearlyOut`
   guards. */
const ENGINES = {
  alkalinity: { fn: assessAlkalinity, strength: 'dkhPerMlPer100L', s: 0.0533, dose: 'dailyDoseMl', d: 9, gap: 2, drift: 0.02, oldMargin: 0.2, margin: 0.5, unit: 'dKH' },
  calcium: { fn: assessCalcium, strength: 'caPpmPerMlPer100L', s: 0.36, dose: 'calciumDoseMl', d: 7, gap: 7, drift: 0.3, oldMargin: 5, margin: 50, unit: 'ppm' },
  magnesium: { fn: assessMagnesium, strength: 'mgPpmPerMlPer100L', s: 0.024, dose: 'magDoseMl', d: 8, gap: 14, drift: 0.6, oldMargin: 10, margin: 50, unit: 'ppm' },
}

const defOf = (key) => PARAM_DEFS.find((d) => d.key === key)

function assess(key, values, corrections = []) {
  const cfg = ENGINES[key]
  const def = defOf(key)
  const settings = { ...DEFAULT_SETTINGS, volumeL: 77, [cfg.strength]: cfg.s, [cfg.dose]: cfg.d }
  const readings = values.map((value, i) => ({
    param: key, value, time: '09:00',
    date: addDays(TODAY, -(values.length - i) * cfg.gap),
  }))
  const a = cfg.fn({ readings, doseLog: [], waterChanges: [], corrections,
    settings, def, correctionPlans: {}, now: NOW })
  return { a, def, settings, status: doseStatus(a, def, TODAY, settings) }
}

const everythingSaid = (a, status) =>
  `${a.explanation || ''} ${a.reason || ''} ${a.caution || ''} `
  + `${status ? status.headline || '' : ''} ${status ? status.detail || '' : ''}`

/* ------------------------------------------------------------------ *
 * 1. Out has no margin.
 * ------------------------------------------------------------------ */

/* A flat series, so nothing but the position is under test. */
const flat = (v) => [v, v, v, v]

/* Deliberately smaller than every margin in the file, including the old ones:
   the point is that being barely past the edge is still being past it. */
const HAIRS = { alkalinity: [0.01, 0.1], calcium: [0.1, 5], magnesium: [0.1, 5] }

describe('§27 — a level past its band edge by any amount is out', () => {
  for (const key of Object.keys(ENGINES)) {
    const def = defOf(key)
    for (const past of HAIRS[key]) {
      for (const [side, value, word] of [
        ['below', def.min - past, 'below'],
        ['above', def.max + past, 'above'],
      ]) {
        it(`${key}: ${value}${ENGINES[key].unit} is ${word} a ${def.min}–${def.max} band`, () => {
          const { a, status } = assess(key, flat(value))
          expect(a.current.value).toBe(value)

          /* Said in words, on the assessment and on the dose card alike. */
          expect(everythingSaid(a, status)).toMatch(new RegExp(`${word} your range`))
          /* And never treated as a tank with nothing to answer for: `idle` is
             the card that says the dose is matching consumption and the level
             is where it should be. */
          expect(status.state).not.toBe('idle')
        })
      }
    }
  }

  it('the margin plays no part: a level 0.1ppm past the edge reads exactly as one 5ppm past', () => {
    const def = defOf('calcium')
    const hair = assess('calcium', flat(def.max + 0.1))
    const more = assess('calcium', flat(def.max + 5))
    expect(hair.status.state).toBe(more.status.state)
    expect(hair.a.action).toBe(more.a.action)
  })
})

/* ------------------------------------------------------------------ *
 * 2. Clearly out is the fixed margin, and it is the margin that governs.
 * ------------------------------------------------------------------ */

/* `clearlyOut` gates `worsening`, which is the one thing that stops a level
   outside its band and drifting further out from being held on a sub-noise
   trend. Reaching it needs a tank that is out of band, moving the wrong way
   slowly enough to grade "stable", and carrying two logged corrections — the
   `repeatedCorrections` half of the same condition. The corrections sit before
   the reading window so they count toward the repeat tally without bending the
   fit through the readings under test.
   No case sits exactly on a margin. `8.8 + 0.5` is 9.300000000000001 in binary
   floating point, so an exactly-at-the-margin assertion would pin arithmetic
   noise rather than the decision. */
const twoCorrections = (key) => [
  { id: 'c1', element: key, date: addDays(TODAY, -65), time: '12:00', ml: 20, direction: 'up' },
  { id: 'c2', element: key, date: addDays(TODAY, -58), time: '12:00', ml: 20, direction: 'up' },
]

function drifting(key, side, past) {
  const cfg = ENGINES[key]
  const def = defOf(key)
  const last = side === 'below' ? def.min - past : def.max + past
  const step = side === 'below' ? cfg.drift : -cfg.drift
  return [last + 3 * step, last + 2 * step, last + step, last]
}

const ADVERSE_ACTION = { below: 'increase', above: 'decrease' }

describe('§27 — clearly out is a fixed margin past the edge', () => {
  for (const key of Object.keys(ENGINES)) {
    const cfg = ENGINES[key]
    for (const side of ['below', 'above']) {
      const eps = cfg.margin / 100

      it(`${key} ${side}: ${cfg.margin}${cfg.unit} past the edge and still drifting is clearly out`, () => {
        const { a } = assess(key, drifting(key, side, cfg.margin + eps), twoCorrections(key))
        expect(a.band).toBe('stable')
        expect(a.action).toBe(ADVERSE_ACTION[side])
      })

      it(`${key} ${side}: just inside ${cfg.margin}${cfg.unit} is out, but not clearly out`, () => {
        const { a, def, status } = assess(key, drifting(key, side, cfg.margin - eps), twoCorrections(key))
        expect(a.band).toBe('stable')
        /* DEFECT (before §27): held against the old constant this was clearly
           out, and the engine acted on a sub-noise trend. */
        expect(a.action).toBe('hold')
        /* Still out, though — the whole point of the two numbers. The dose
           holds; the app does not pretend the level is in band. */
        expect(a.current.value < def.min || a.current.value > def.max).toBe(true)
        expect(everythingSaid(a, status)).toMatch(new RegExp(`${side} your range`))
      })

      it(`${key} ${side}: past the old ${cfg.oldMargin}${cfg.unit} constant is no longer clearly out`, () => {
        const { a } = assess(key, drifting(key, side, cfg.oldMargin + eps), twoCorrections(key))
        expect(a.band).toBe('stable')
        /* DEFECT (before §27): the old margin was a rate constant for calcium
           and magnesium — `CA_TREND.stable` 5 ppm/week and `MG_TREND.stable`
           10 ppm/week — and a literal 0.2 for alkalinity. Each fired here. */
        expect(a.action).toBe('hold')
      })

      it(`${key} ${side}: a hair past the edge is nowhere near clearly out`, () => {
        const { a } = assess(key, drifting(key, side, cfg.margin / 100), twoCorrections(key))
        expect(a.action).toBe('hold')
      })
    }
  }
})

/* ------------------------------------------------------------------ *
 * 3. The margins are their own constants.
 * ------------------------------------------------------------------ */

const SITES = [
  { file: 'src/lib/dosing/alkalinity.js', local: 'alkClearlyOut', name: 'ALK_CLEARLY_OUT', value: 0.5 },
  { file: 'src/lib/dosing/calcium.js', local: 'caClearlyOut', name: 'CA_CLEARLY_OUT', value: 50 },
  { file: 'src/lib/dosing/helpers.js', local: 'clearlyOut', name: 'MG_CLEARLY_OUT', value: 50 },
]

/* Where each constant is declared — magnesium's test lives in `helpers.js`,
   but the constant belongs beside the engine's other magnesium figures. */
const DECLARED_IN = {
  ALK_CLEARLY_OUT: 'src/lib/dosing/alkalinity.js',
  CA_CLEARLY_OUT: 'src/lib/dosing/calcium.js',
  MG_CLEARLY_OUT: 'src/lib/dosing/magnesium.js',
}

const EXPORTED = { ALK_CLEARLY_OUT, CA_CLEARLY_OUT, MG_CLEARLY_OUT }

const src = (f) => readFileSync(resolve(process.cwd(), f), 'utf8')

/* The right-hand side of `const <local> = … ;`, comments stripped. */
function expressionFor(text, local) {
  const at = text.search(new RegExp(`\\bconst ${local}\\s*=`))
  if (at < 0) return null
  const semi = text.indexOf(';', at)
  return text.slice(text.indexOf('=', at) + 1, semi)
    .replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '').trim()
}

describe('§27 — each margin is a named constant of its own', () => {
  for (const site of SITES) {
    it(`${site.name} is exported with the decided value`, () => {
      expect(EXPORTED[site.name]).toBe(site.value)
    })

    it(`${site.name} is declared as a bare number, derived from nothing`, () => {
      const decl = expressionFor(src(DECLARED_IN[site.name]), site.name)
      expect(decl).not.toBeNull()
      /* DEFECT this prevents: a margin defined as `CA_TREND.stable * 10` or
         `kitNoise(...)` reads as its own constant and is not one. Pointing it
         at the kit noise floors was explicitly rejected — how well the kit
         reads a level is a different question from how far out the level is. */
      expect(decl).toMatch(/^[0-9]*\.?[0-9]+$/)
    })

    it(`${site.local} compares against ${site.name} and nothing else`, () => {
      const expr = expressionFor(src(site.file), site.local)
      expect(expr).not.toBeNull()
      expect(expr).toContain(site.name)
      /* The dimensional fault itself: a distance compared against a rate. */
      expect(expr).not.toMatch(/_TREND/)
      /* And no bare literal — 0.2 dKH was dimensionally right and still
         invisible to anyone looking for the app's out-of-band margins. */
      expect(expr).not.toMatch(/[0-9]/)
    })
  }

  it('no margin is reachable from a trend constant or a kit noise floor', () => {
    for (const name of Object.keys(DECLARED_IN)) {
      const decl = expressionFor(src(DECLARED_IN[name]), name)
      expect(String(decl)).not.toMatch(/TREND|KIT_|kitNoise|kitSigma|SIGMA|PRECISION/)
    }
  })
})
