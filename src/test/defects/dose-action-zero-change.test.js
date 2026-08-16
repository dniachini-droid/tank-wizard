/* TW-050 — `action` reads "increase" for a change of zero, in all three engines
 *
 *   out.action = next > out.currentDose ? "increase"
 *              : next < out.currentDose ? "decrease" : "hold"
 *
 * the same line three times (alkalinity.js:921, calcium.js:629,
 * helpers.js:1142). `next` has been rounded to one decimal by the dose
 * constraints; `currentDose` comes straight out of the dose log and has not.
 * A logged dose of 10.8 stored as 9 x 1.2 is 10.799999999999999, so
 * `next > currentDose` is true by 1.8e-15 and the app labels a zero change an
 * increase — telling the keeper to increase, then handing them the same number
 * they are already pouring.
 *
 * Found 2026-08-15 in the §27 rework audit: 5 of 36 changed rows, all
 * alkalinity at 8.98 against an 8.8 ceiling, reporting `action: "increase"`
 * while recommending exactly the 10.8 mL/day already being dosed. Pre-existing
 * — the comparison predates §27 — but newly reachable because those rows now
 * take the act path.
 *
 * Why it matters beyond cosmetics: `action` is read by the dose card
 * (ErrorBoundary.jsx:119) and the wizard, and "increase" on a tank above its
 * range is the wrong word in the one direction a keeper is least able to check
 * against their own judgement.
 *
 * The fix compares at the precision the dose is DISPLAYED to — `fmtAmount`,
 * which is what every surface renders these numbers through — rather than raw.
 * Owner decision, 16 August. TW-050's own note that this "changes `action`
 * values, which is a behavioural change across all three engines and needs its
 * own by-element sweep" is why the invariant is asserted per engine below and
 * not only on the helper.
 */
import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { fmtAmount } from '../../lib/analytics/time-in-range.js'
import { PARAM_DEFS } from '../../lib/constants.js'
import { assessAlkalinity } from '../../lib/dosing/alkalinity.js'
import { assessCalcium } from '../../lib/dosing/calcium.js'
import { assessMagnesium, doseAction } from '../../lib/dosing/helpers.js'

const def = (k) => PARAM_DEFS.find((d) => d.key === k)

describe('doseAction — the comparison itself', () => {
  it('grades two spellings of 10.8 as hold, not increase', () => {
    /* The reported defect, exactly. 9 * 1.2 is how the dose log came to hold
       10.799999999999999. */
    expect(doseAction(10.8, 9 * 1.2)).toBe('hold')
    expect(9 * 1.2).not.toBe(10.8) // precondition: these really do differ
  })

  it('grades it as hold in the other direction too', () => {
    expect(doseAction(9 * 1.2, 10.8)).toBe('hold')
  })

  it('still grades a real change', () => {
    expect(doseAction(10.8, 10.7)).toBe('increase')
    expect(doseAction(10.7, 10.8)).toBe('decrease')
    expect(doseAction(12, 10.8)).toBe('increase')
    expect(doseAction(8, 10.8)).toBe('decrease')
  })

  it('holds across fmtAmount\'s precision buckets, where the two doses would render the same', () => {
    /* fmtAmount scales decimals to magnitude: 2dp under 10, 1dp from 10, 0dp
       from 100. A pair straddling a bucket edge renders as "10.00" and "10.0"
       — different text for the same dose, and the comparison must not read
       that as a change. Comparing at the coarser of the two precisions is what
       makes this hold. */
    expect(fmtAmount(9.999)).toBe('10.00')
    expect(fmtAmount(10.001)).toBe('10.0')
    expect(doseAction(9.999, 10.001)).toBe('hold')
    expect(doseAction(10.001, 9.999)).toBe('hold')

    /* And a change that is real at the displayed precision is still a change. */
    expect(doseAction(10.1, 9.99)).toBe('increase')
  })

  it('grades sub-mL doses at the precision they are shown to, which is finer', () => {
    /* fmtAmount gives a sub-1 mL dose three decimals, so the threshold for
       "this is a change" scales with the dose rather than being a fixed
       tolerance. 0.5004 against 0.5 renders identically and holds; 0.504 does
       not render identically and is a real change at the precision shown. */
    expect(fmtAmount(0.5004)).toBe(fmtAmount(0.5))
    expect(doseAction(0.5004, 0.5)).toBe('hold')

    expect(fmtAmount(0.504)).not.toBe(fmtAmount(0.5))
    expect(doseAction(0.504, 0.5)).toBe('increase')
  })

  it('is defined for a dose of zero and for a missing current dose', () => {
    expect(doseAction(0, 0)).toBe('hold')
    expect(doseAction(5, 0)).toBe('increase')
  })
})

describe('every engine grades its own action through that one comparison', () => {
  /* The defect was one line copied three times, so the regression guard has to
     cover three files. These fixtures are steady tanks on a float-noisy logged
     dose — the state the audit found the bug in — and they assert the engine's
     own `action` agrees with the helper rather than with a raw comparison. */
  const DATES = ['2026-08-01', '2026-08-03', '2026-08-05', '2026-08-07', '2026-08-09', '2026-08-11']
  const flat = (param, value) => DATES.map((date, i) => ({ id: `${i}`, param, date, value }))
  const NOISY = 9 * 1.2 // 10.799999999999999

  const RUNS = [
    ['alkalinity', (level) => assessAlkalinity({
      readings: flat('alkalinity', level),
      doseLog: [{ date: '2026-06-01', element: 'alkalinity', ml: NOISY }],
      waterChanges: [], settings: { volumeL: 100, dkhPerMlPer100L: 0.0533, dailyDoseMl: 9 },
      def: def('alkalinity'),
    }), [8.98, 8.9, 8.5, 8.0]],
    ['calcium', (level) => assessCalcium({
      readings: flat('calcium', level),
      doseLog: [{ date: '2026-06-01', element: 'calcium', ml: NOISY }],
      waterChanges: [], settings: { volumeL: 100, caPpmPerMlPer100L: 0.36, calciumDoseMl: 9 },
      def: def('calcium'),
    }), [470, 455, 425, 395]],
    ['magnesium', (level) => assessMagnesium({
      readings: flat('magnesium', level),
      doseLog: [{ date: '2026-06-01', element: 'magnesium', ml: NOISY }],
      waterChanges: [], settings: { volumeL: 100, mgPpmPerMlPer100L: 0.024, magDoseMl: 9 },
      def: def('magnesium'),
    }), [1450, 1420, 1300, 1200]],
  ]

  for (const [element, run, levels] of RUNS) {
    it(`${element}: a recommendation equal to the current dose grades hold, whatever the float spelling`, () => {
      let reached = 0
      for (const level of levels) {
        const out = run(level)
        if (!out.ok || out.recommendedDose == null) continue
        reached++
        /* The invariant: if the two doses render identically, the app must not
           claim a direction. This is the assertion that fails on the old
           comparison the moment a rounded `next` meets an unrounded
           `currentDose`. */
        if (fmtAmount(out.recommendedDose) === fmtAmount(out.currentDose)) {
          expect(out.action, `${element} at ${level}: recommends ${fmtAmount(out.recommendedDose)} against a current ${fmtAmount(out.currentDose)}`).toBe('hold')
        }
        /* And in general the engine's verdict is the helper's verdict — no
           engine keeps its own opinion about what counts as a change. */
        expect(out.action, `${element} at ${level}`).toBe(doseAction(out.recommendedDose, out.currentDose))
      }
      /* A check that cannot fail is worse than no check (scripts/verify/run.mjs
         rule 3): prove the fixtures actually reached the graded path. */
      expect(reached, `no ${element} fixture reached a graded recommendation`).toBeGreaterThan(0)
    })
  }
})

describe('no engine keeps a raw comparison of its own', () => {
  /* The three copies are the reason this defect existed in triplicate. A
     source scan is the only guard that catches a fourth copy being added, or
     one of the three quietly reverting: the invariant above only sees the
     paths its fixtures reach. */
  const ENGINES = [
    'src/lib/dosing/alkalinity.js',
    'src/lib/dosing/calcium.js',
    'src/lib/dosing/helpers.js',
  ]
  for (const file of ENGINES) {
    it(`${file} assigns action from doseAction, not from > currentDose`, () => {
      /* Comments stripped first: helpers.js quotes the old line verbatim in
         doseAction's own docblock, which is exactly the note worth keeping. */
      const src = readFileSync(file, 'utf8')
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .replace(/^\s*\/\/.*$/gm, '')
      const raw = /action\s*=\s*[^;\n]*?(?:>|<)\s*(?:out\.)?currentDose/
      expect(src, `${file} still compares raw dose values to grade action`).not.toMatch(raw)
      expect(src).toContain('doseAction(')
    })
  }
})
