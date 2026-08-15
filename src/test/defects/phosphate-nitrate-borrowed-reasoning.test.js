/* Phosphate and nitrate carry no borrowed judgements — TW-029, decided as a
 * defect by the owner on 14 August (reef-chemistry.md §25):
 *
 *   "I have noticed silly notifications of phosphate coming up and silly
 *    notifications of nitrate coming up, which don't make sense, because the
 *    wrong measurements are being applied to them — it's the same
 *    measurements as alkalinity and calcium."
 *
 * §12's refusal: the app does not judge one parameter by another parameter's
 * thresholds, trend logic or evidence bar. The two generic findings loops did
 * exactly that. `far-out-<key>` scaled its alarm to the width of the user's
 * own band, which at the default bands put the low trigger at −0.040 ppm
 * phosphate and −5 ppm nitrate — unreachable at any value a kit can return,
 * so 0.00 ppm phosphate (outside SAFE_BOUNDS' own minimum, and the one level
 * journey 5 wants a firm word about) produced nothing while ordinary bounce
 * produced notices. `heading-out-<key>` fitted a 30-day regression through
 * what is 4–5 readings at their 7-day cadence.
 *
 * This file pins the removal, not a replacement. Per §25, no replacement may
 * be invented until Dan writes each parameter's own reasoning into canon;
 * every figure below is a scenario coordinate, not a threshold.
 *
 *  1. No far-out finding for phosphate or nitrate at any reading, from 0.00
 *     through values far past the old triggers (0.170 ppm / 25 ppm, which
 *     both fired "well above your target" before the removal).
 *  2. No heading-out finding on a steady, kit-visible, in-band climb — the
 *     exact shape tests/legacy-port/strips.js used to REQUIRE a flag for.
 *  3. The removal is scoped, not a breakage: alkalinity's far-out still
 *     fires, the nutrient-specific findings still speak for these two keys,
 *     and the band-position vocabulary (paramStatus) still says high/low.
 *  4. The set the code consults contains exactly these two keys — salinity's
 *     treatment is TW-030's decision and must not drift in here.
 */
import { describe, expect, it } from 'vitest'
import { PARAM_DEFS } from '../../lib/constants.js'
import { paramStatus, todayStr } from '../../lib/dates.js'
import { buildFindings, NUTRIENTS_AWAITING_OWN_RULES } from '../../lib/findings.js'

const addDays = (iso, n) =>
  new Date(new Date(iso + 'T00:00:00Z').getTime() + n * 86400000).toISOString().slice(0, 10)
const T = todayStr()
const SETTINGS = { volumeL: 77 }
const defOf = (key) => PARAM_DEFS.find((d) => d.key === key)

const findingsFor = (readings) => {
  const latestByParam = {}
  for (const r of readings) latestByParam[r.param] = r
  return buildFindings({
    readings, icps: [], paramDefs: PARAM_DEFS, settings: SETTINGS,
    doseLog: [], waterChanges: [], latestByParam,
  }).findings
}

const single = (key, value) =>
  findingsFor([{ param: key, date: addDays(T, -1), time: '20:00', value }])

/* A steady one-directional climb, kit-visible and ending just inside the
   band — before the removal this satisfied every heading-out gate: ≥5 rows
   in the 30-day window, slope past the noise floor, directional, and a
   projected exit within 45 days. */
const climb = (key, from, to) => {
  const rows = []
  for (let i = 0; i <= 10; i++) {
    rows.push({ param: key, date: addDays(T, -(10 - i) * 2), time: '20:00',
      value: Math.round((from + ((to - from) * i) / 10) * 100000) / 100000 })
  }
  return findingsFor(rows)
}

describe('far-out is unreachable-by-construction no more — it is gone', () => {
  /* Sweep from 0.00 through the old high triggers and beyond. The low side
     never fired at any value ≥ 0 (negative trigger); the high side fired at
     ≥ 0.170 / ≥ 25 with the default bands. Now neither side may. */
  const SWEEP = {
    phosphate: [0, 0.005, 0.03, 0.10, 0.169, 0.171, 0.5, 1.0],
    nitrate: [0, 0.4, 5, 15, 24.9, 25.1, 50, 200],
  }
  for (const [key, values] of Object.entries(SWEEP)) {
    it(`${key}: no far-out-${key} at any reading`, () => {
      for (const v of values) {
        const hits = single(key, v).filter((f) => f.id === `far-out-${key}`)
        expect(hits, `${key} at ${v}`).toEqual([])
      }
    })
  }
})

describe('heading-out never fires for the two nutrients', () => {
  it('phosphate: a steady kit-visible climb produces no trend finding', () => {
    const f = climb('phosphate', 0.05, 0.095)
    expect(f.filter((x) => x.id === 'heading-out-phosphate')).toEqual([])
  })
  it('nitrate: a steady kit-visible climb produces no trend finding', () => {
    const f = climb('nitrate', 8, 14.5)
    expect(f.filter((x) => x.id === 'heading-out-nitrate')).toEqual([])
  })
})

describe('the removal is scoped, not a breakage', () => {
  it('alkalinity a full band-width out still produces its far-out finding', () => {
    const def = defOf('alkalinity')
    const value = def.max + (def.max - def.min) + 0.1
    const hits = single('alkalinity', value).filter((f) => f.id === 'far-out-alkalinity')
    expect(hits.length).toBe(1)
  })
  it('nutrient-specific reasoning still speaks for both keys', () => {
    /* Both near zero: the nutrient-starved finding is their own rule and
       must survive the removal of the borrowed ones. */
    const f = findingsFor([
      { param: 'nitrate', date: addDays(T, -1), time: '20:00', value: 1 },
      { param: 'phosphate', date: addDays(T, -1), time: '20:00', value: 0.01 },
    ])
    const starved = f.find((x) => x.id === 'nutrient-starved')
    expect(starved).toBeTruthy()
    expect(starved.params).toEqual(expect.arrayContaining(['nitrate', 'phosphate']))
  })
  it('band position still reads high/low — position is not a judgement', () => {
    expect(paramStatus(defOf('phosphate'), 0.2)).toBe('high')
    expect(paramStatus(defOf('phosphate'), 0.01)).toBe('low')
    expect(paramStatus(defOf('nitrate'), 30)).toBe('high')
  })
})

describe('the scope is exactly the two TW-029 names', () => {
  it('phosphate and nitrate, and nothing else — salinity is TW-030\'s call', () => {
    expect([...NUTRIENTS_AWAITING_OWN_RULES].sort()).toEqual(['nitrate', 'phosphate'])
  })
})
