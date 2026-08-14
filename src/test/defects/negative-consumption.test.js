/* Bug 2 (routine 15) — negative consumption, as re-decided on 14 August 2026.
 *
 * Spec anchor: docs/spec/reef-chemistry.md §24.
 *
 * Consumption comes out negative whenever the level rises faster than the dose
 * supplies. That is not the model breaking — a one-off correction, a water
 * change with a richer salt, demand collapsing, a wrong Setup strength, a bad
 * reading and a fast nitrate drop all produce it, and 626 of the 6,000 random
 * assessments in tests/legacy-port/invariants.js do. The clamp to zero stays.
 *
 * The bug is what followed the clamp. A forced maintenanceDose of 0 against a
 * real currentDose reads as a 100% gap to doseDriftedFrom
 * (src/lib/dosing/helpers.js), which saturates both the 12% alkalinity and 30%
 * calcium triggers unconditionally and walks into the act block. Decision 3's
 * own worked alkalinity case is reproduced below — 9 mL/day of a 0.05
 * dKH/mL/100L solution in 72 L supplies 0.625 dKH/day against a measured
 * +0.9 dKH/day — and before this rule it came out as a staged cut to 6.8
 * mL/day, a 25% reduction toward a level the arithmetic never diagnosed as
 * excessive, with nothing on screen saying the working had implied the tank
 * was manufacturing alkalinity.
 *
 * The four parts of the rule, each asserted below:
 *   1. hold — a negative consumption never sizes a dose change;
 *   2. report the observation, never a cause;
 *   3. ask about the two things the app cannot see, and offer the retest;
 *   4. escalate only on the third consecutive negative with nothing logged.
 *
 * And the one qualification: the level still outranks the arithmetic. A tank at
 * or over the top of its range and still climbing keeps its reduction —
 * Decision 3 named suppressing that as the concrete regression risk of any
 * refuse-style fix, and legacy/tests/protocols.js Mg §56 is exactly that shape.
 */
import { describe, expect, it } from 'vitest'
import { assessAlkalinity } from '../../lib/dosing/alkalinity.js'
import { assessCalcium } from '../../lib/dosing/calcium.js'
import { assessMagnesium } from '../../lib/dosing/helpers.js'
import { doseStatus } from '../../lib/dosing/state.js'
import { dayNum } from '../../lib/analytics/water-changes.js'

const ALK = { key: 'alkalinity', label: 'Alkalinity', unit: 'dKH', min: 8.2, max: 8.8, step: 0.1 }
const CA = { key: 'calcium', label: 'Calcium', unit: 'ppm', min: 400, max: 450, step: 1 }
const MG = { key: 'magnesium', label: 'Magnesium', unit: 'ppm', min: 1250, max: 1400, step: 1 }

const day = (n) => new Date(Date.UTC(2026, 5, 1) + n * 86400000).toISOString().slice(0, 10)
const at = (n) => dayNum(day(n)) + 12 / 24
const read = (param, n, value) => ({ param, date: day(n), time: '09:00', value })

/* Decision 3's worked alkalinity case, against the live engine rather than
   trusted from the write-up: 0.625 dKH/day supplied, +0.9 dKH/day measured,
   the level at 7.5 dKH and below its band — so the "moving toward target,
   hold" branch does not catch it (that branch wants a trend at or under
   ALK_TREND.meaningful, 0.30 dKH/day, and this is three times it). */
const alkSettings = { volumeL: 72, dkhPerMlPer100L: 0.05, dailyDoseMl: 9 }
const alkRising = [
  read('alkalinity', 0, 4.8), read('alkalinity', 1, 5.7),
  read('alkalinity', 2, 6.6), read('alkalinity', 3, 7.5),
]
const alkAssess = (extra = {}) => assessAlkalinity({
  readings: alkRising, doseLog: [], waterChanges: [], corrections: [],
  settings: alkSettings, def: ALK, correctionPlans: {}, now: at(3), ...extra,
})

/* Calcium rising 30 ppm a week against a 3.6 ppm/day supply, ending at 440 —
   inside its band and clear of the near-edge test (12% of a 50 ppm band). */
const caSettings = { volumeL: 200, caPpmPerMlPer100L: 0.36, calciumDoseMl: 20 }
const caRising = [
  read('calcium', 0, 350), read('calcium', 7, 380),
  read('calcium', 14, 410), read('calcium', 21, 440),
]
const caAssess = (extra = {}) => assessCalcium({
  readings: caRising, doseLog: [], waterChanges: [], corrections: [],
  settings: caSettings, def: CA, correctionPlans: {}, now: at(21), ...extra,
})

/* Magnesium is where this bites hardest: 8 mL/day at 0.012 ppm/mL/100L in
   200 L supplies 0.048 ppm/day, so a rise of 15 ppm a week — a fifth of what
   the kit can resolve — is already enough to turn consumption negative. */
const mgSettings = { volumeL: 200, mgPpmPerMlPer100L: 0.012, magDoseMl: 8 }
const mgRising = [
  read('magnesium', 0, 1290), read('magnesium', 7, 1305),
  read('magnesium', 14, 1320), read('magnesium', 21, 1335),
]
const mgAssess = (extra = {}) => assessMagnesium({
  readings: mgRising, doseLog: [], waterChanges: [], corrections: [],
  settings: mgSettings, def: MG, correctionPlans: {}, now: at(21), ...extra,
})

describe('negative consumption — the dose change (§24 part 1)', () => {
  it('holds alkalinity instead of staging a 25% cut', () => {
    const a = alkAssess()

    /* The precondition: this really is the negative-consumption case, and the
       clamp still holds — invariants.js asserts these two are never negative. */
    expect(a.gaining).toBeGreaterThan(0)
    expect(a.consumption).toBe(0)
    expect(a.maintenanceDose).toBe(0)

    expect(a.action).toBe('hold')
    expect(a.recommendedDose).toBe(a.currentDose)
    expect(a.gainingHold).toBe(true)
    /* Nothing staged, and no plan of further cuts left behind it. */
    expect(a.staged).toBeFalsy()
    expect(a.plan).toBeUndefined()
  })

  it('holds calcium instead of staging a cut', () => {
    const a = caAssess()
    expect(a.gaining).toBeGreaterThan(0)
    expect(a.maintenanceDose).toBe(0)
    expect(a.action).toBe('hold')
    expect(a.recommendedDose).toBe(a.currentDose)
  })

  it('holds magnesium instead of staging a cut', () => {
    const a = mgAssess()
    expect(a.gaining).toBeGreaterThan(0)
    expect(a.action).toBe('hold')
    expect(a.recommendedDose).toBe(a.currentDose)
  })
})

describe('negative consumption — what it says (§24 parts 2 and 3)', () => {
  it('reports the observation and says the dose is unchanged', () => {
    const a = alkAssess()
    expect(a.explanation).toMatch(/rising/i)
    expect(a.explanation).toMatch(/faster than your .* dose accounts for/i)
    expect(a.explanation).toMatch(/dose is unchanged/i)
  })

  it('claims no cause on a single instance', () => {
    /* Every cause the app could name here is consistent with the same
       arithmetic, so naming one would be a guess wearing a diagnosis's
       clothes. One interval, so the escalation in part 4 is not in play. */
    const a = alkAssess({ readings: [read('alkalinity', 2, 6.6), read('alkalinity', 3, 7.5)] })
    expect(a.gainingHold).toBe(true)
    const said = `${a.explanation} ${a.nextCheck}`
    expect(said).not.toMatch(/salt mix|dissolution|nitrate|precipitat/i)
    expect(said).not.toMatch(/strength in Setup/i)
  })

  it('asks about the two things it cannot see, and offers the retest', () => {
    const a = alkAssess({ readings: [read('alkalinity', 2, 6.6), read('alkalinity', 3, 7.5)] })
    expect(a.nextCheck).toMatch(/water change/i)
    expect(a.nextCheck).toMatch(/one-off correction/i)
    expect(a.nextCheck).toMatch(/testing error|change in demand/i)
    expect(a.nextCheck).toMatch(/two days/i)
  })

  it('names a logged water change instead of asking about it', () => {
    const a = alkAssess({ waterChanges: [{ date: day(2), litres: 15 }] })
    expect(a.action).toBe('hold')
    expect(a.explanation).toMatch(/water change is logged on 2026-06-03/i)
    expect(a.nextCheck).not.toMatch(/unlogged/i)
  })

  it('names a logged one-off correction instead of asking about it', () => {
    const a = caAssess({
      corrections: [{ id: 'c1', element: 'calcium', date: day(0), time: '10:00', ml: 30, direction: 'up' }],
    })
    expect(a.action).toBe('hold')
    expect(a.explanation).toMatch(/one-off correction is logged on 2026-06-01/i)
  })
})

describe('negative consumption — escalation (§24 part 4)', () => {
  it('does not escalate on a single instance', () => {
    /* Two readings is one interval: one negative, not three. */
    const a = alkAssess({ readings: [read('alkalinity', 2, 6.6), read('alkalinity', 3, 7.5)] })
    expect(a.gainingHold).toBe(true)
    expect(a.caution || '').not.toMatch(/third reading in a row/i)
    expect(a.nextCheck).not.toMatch(/strength in Setup/i)
  })

  it('names wrong strength and collapsed demand on the third, in all three engines', () => {
    for (const a of [alkAssess(), caAssess(), mgAssess()]) {
      expect(a.action).toBe('hold')
      expect(a.caution).toMatch(/third reading in a row/i)
      expect(a.caution).toMatch(/strength in Setup/i)
      expect(a.caution).toMatch(/demand/i)
      expect(a.nextCheck).toMatch(/strength in Setup/i)
    }
  })

  it('does not escalate when something logged explains the rise', () => {
    const a = caAssess({ waterChanges: [{ date: day(7), litres: 20 }] })
    expect(a.gainingHold).toBe(true)
    expect(a.caution || '').not.toMatch(/third reading in a row/i)
  })
})

describe('negative consumption — the level still outranks it (§24)', () => {
  it('keeps the reduction when the level is above range and still rising', () => {
    /* The regression risk Decision 3 named: a refusal placed at the clamp runs
       before the emergency response and swallows it. Calcium well past 450 and
       climbing needs less calcium whatever the consumption sum says, and
       legacy protocols Mg §56 makes the same call five ppm inside the band. */
    const a = caAssess({
      readings: [
        read('calcium', 0, 470), read('calcium', 7, 500),
        read('calcium', 14, 530), read('calcium', 21, 560),
      ],
    })
    expect(a.gaining).toBeGreaterThan(0)
    expect(a.gainingHold).toBeUndefined()
    expect(a.action).toBe('decrease')
    expect(a.recommendedDose).toBeLessThan(a.currentDose)
  })
})

describe('negative consumption — the dose card agrees with the wizard', () => {
  it('does not tell the keeper the dose is matching consumption', () => {
    const a = mgAssess()
    const st = doseStatus(a, MG, day(21), mgSettings,
      { magnesium: { value: 1335, date: day(21) } }, [], [])

    expect(st).toBeTruthy()
    /* The contradiction this replaces: "Magnesium dose is matching consumption
       / Nothing to do — keep testing on your usual schedule", printed directly
       under a wizard asking for a retest in two days. */
    expect(st.headline).not.toMatch(/matching consumption/i)
    expect(st.detail).not.toMatch(/nothing to do/i)
    expect(st.headline).toMatch(/rising faster than your dose accounts for/i)
    expect(st.detail).toMatch(/two days/i)
  })
})
