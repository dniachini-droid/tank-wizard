/* Position is the last reading — reef-chemistry.md §26, decided 14 Aug.
 *
 * Owner decision, superseding `.agent/needs-dan.md` item 3's option (b):
 *
 *   "Position is always the last reading. Whether a level is in band, out of
 *    band, or at which edge — that question is answered by the most recent
 *    measurement, never by a fitted or projected value. History is for trend,
 *    direction, consumption and dose. It is never used to assert where the
 *    level is now. The app must never state a position that no measurement
 *    supports."
 *
 * Before this rule the three engines answered every side-of-band question from
 * `fittedNow` — the correction-adjusted least-squares value at the last
 * timestamp — while quoting `out.current.value`, the last raw reading, in the
 * sentence that reported it. The two disagree whenever the last reading sits
 * off the fitted line, which is exactly what a recovering tank and an active
 * correction both produce. The result was a sentence that contradicted its own
 * number:
 *
 *   "Alkalinity is below your range at 8.5dKH"        (band 8.2–8.8)
 *   "Calcium is below your range at 405ppm"           (band 400–450)
 *   "Magnesium is below your range at 1260ppm"        (band 1250–1400)
 *
 * Every one of those is reproduced below against the code as it stood, in both
 * directions, in all three engines, and on the `doseStatus` surface as well.
 *
 * The measure moves; no threshold moves. The 0.2 dKH / `CA_TREND.stable` /
 * `MG_TREND.stable` margins on `clearlyOut`, the 12%-of-band edge proximity
 * behind `nearEdge`, and both §11 grading qualifiers are untouched — they are
 * simply measured from the last reading now.
 */
import { describe, expect, it } from 'vitest'
import { PARAM_DEFS } from '../../lib/constants.js'
import { DEFAULT_SETTINGS, dayNum } from '../../lib/analytics/water-changes.js'
import { assessAlkalinity } from '../../lib/dosing/alkalinity.js'
import { assessCalcium } from '../../lib/dosing/calcium.js'
import { assessMagnesium } from '../../lib/dosing/helpers.js'
import { doseStatus } from '../../lib/dosing/state.js'

const TODAY = '2026-08-14'
const NOW = dayNum(TODAY) + 12 / 24
const addDays = (iso, n) =>
  new Date(new Date(iso + 'T00:00:00Z').getTime() + n * 86400000).toISOString().slice(0, 10)

const ENGINES = {
  alkalinity: { fn: assessAlkalinity, strength: 'dkhPerMlPer100L', s: 0.0533, dose: 'dailyDoseMl', d: 9, gap: 2 },
  calcium: { fn: assessCalcium, strength: 'caPpmPerMlPer100L', s: 0.36, dose: 'calciumDoseMl', d: 12, gap: 7 },
  magnesium: { fn: assessMagnesium, strength: 'mgPpmPerMlPer100L', s: 0.024, dose: 'magDoseMl', d: 8, gap: 14 },
}

/* One series, one element, no dose log and no corrections: the divergence under
   test is between the fitted line and the last reading, and nothing else. */
function assess(key, values) {
  const cfg = ENGINES[key]
  const def = PARAM_DEFS.find((d) => d.key === key)
  const settings = { ...DEFAULT_SETTINGS, volumeL: 77, [cfg.strength]: cfg.s, [cfg.dose]: cfg.d }
  const readings = values.map((value, i) => ({
    param: key, value, time: '09:00',
    date: addDays(TODAY, -(values.length - i) * cfg.gap),
  }))
  const a = cfg.fn({ readings, doseLog: [], waterChanges: [], corrections: [],
    settings, def, correctionPlans: {}, now: NOW })
  return { a, def, settings, status: doseStatus(a, def, TODAY, settings) }
}

const said = (a) => `${a.explanation || ''} ${a.reason || ''}`
const inBand = (def, v) => v >= def.min && v <= def.max
/* Present tense only. "Magnesium started this period below your range at
   1100ppm and has been moving up to 1260ppm" is a statement about history and
   stays true — §26 governs claims about where the level is now. */
const claimsNow = (side) => new RegExp(`is ${side} your range`)

/* Each row: a series whose last reading is INSIDE the band while the fitted
   value it was judged by sits outside it. The band edges are the shipped
   `PARAM_DEFS` ones — 8.2–8.8, 400–450, 1250–1400. */
const IN_BAND_BY_LAST_READING = [
  { key: 'alkalinity', values: [7.4, 7.4, 7.4, 7.4, 8.5], last: 8.5, side: 'below' },
  { key: 'alkalinity', values: [9.6, 9.6, 9.6, 9.6, 8.6], last: 8.6, side: 'above' },
  { key: 'calcium', values: [360, 360, 360, 360, 405], last: 405, side: 'below' },
  { key: 'calcium', values: [500, 500, 500, 500, 445], last: 445, side: 'above' },
  { key: 'magnesium', values: [1100, 1100, 1100, 1100, 1260], last: 1260, side: 'below' },
  { key: 'magnesium', values: [1600, 1600, 1600, 1600, 1390], last: 1390, side: 'above' },
]

describe('§26 — a level whose last reading is in band is in band', () => {
  for (const row of IN_BAND_BY_LAST_READING) {
    it(`${row.key}: a last reading of ${row.last} is not reported as ${row.side} the range`, () => {
      const { a, def } = assess(row.key, row.values)

      /* The fixture only means something if the two measures actually
         disagree here — otherwise the assertion below passes for free. */
      expect(a.current.value).toBe(row.last)
      expect(inBand(def, a.current.value)).toBe(true)
      expect(inBand(def, a.fittedNow)).toBe(false)

      /* DEFECT: the engine said "<element> is <side> your range at <the last
         reading>", naming a number that is inside the range it claims to be
         outside. */
      expect(said(a)).not.toMatch(claimsNow(row.side))
    })
  }
})

describe('§26 — the dose card states the same position as the engine', () => {
  for (const row of IN_BAND_BY_LAST_READING) {
    it(`${row.key}: the card does not put a last reading of ${row.last} ${row.side} the range`, () => {
      const { status } = assess(row.key, row.values)
      const text = `${status.headline || ''} ${status.detail || ''}`
      expect(text).not.toMatch(claimsNow(row.side))
      expect(['recovering', 'worsening', 'off-target']).not.toContain(status.state)
    })
  }
})

/* The other direction, and the one that matters more for safety: the last
   reading is OUTSIDE the band while the fitted line is inside it. Each of these
   is a recovering tank whose newest reading has not yet reached the band — and
   each reached `doseStatus`'s "dose right, level off" card, which said the dose
   was matching consumption and named the level, while the branch above it
   judged the tank in band on the fitted value and let it through. */
const OUT_OF_BAND_BY_LAST_READING = [
  { key: 'alkalinity', values: [7.4, 7.8, 8.2, 8.6, 8.15], last: 8.15 },
  { key: 'calcium', values: [340, 365, 390, 415, 397], last: 397 },
  { key: 'magnesium', values: [1120, 1160, 1200, 1240, 1245], last: 1245 },
]

describe('§26 — a level whose last reading is out of band is out of band', () => {
  for (const row of OUT_OF_BAND_BY_LAST_READING) {
    it(`${row.key}: a last reading of ${row.last} is not reported as idle in band`, () => {
      const { a, def, status } = assess(row.key, row.values)

      expect(a.current.value).toBe(row.last)
      expect(inBand(def, a.current.value)).toBe(false)
      expect(inBand(def, a.fittedNow)).toBe(true)

      /* DEFECT: the card read "idle" — "<element> dose is matching consumption
         at <the last reading>" — for a reading outside the band, because the
         branch that would have said so measured position on the fitted line
         and found it inside. */
      expect(status.state).not.toBe('idle')
      const text = `${said(a)} ${status.headline || ''} ${status.detail || ''}`
      expect(text).toMatch(/below your range|outside your range/)
    })
  }
})

/* "…or at which edge" — `nearEdge` is a position question too, and calcium and
   magnesium act on a smaller movement when it is set. */
describe('§26 — which edge is answered by the last reading', () => {
  it('calcium: a last reading 2ppm inside the lower edge, on a falling series, is near the lower edge', () => {
    const { a, def } = assess('calcium', [455, 440, 425, 405, 402])
    expect(a.current.value).toBe(402)
    expect(inBand(def, a.current.value)).toBe(true)
    expect(a.fittedNow).toBeLessThan(def.min)
    expect(a.trendPerDay).toBeLessThan(0)
    /* DEFECT: `nearEdge` was gated on the fitted value being in range, so a
       level sitting 2 ppm off the floor and still falling reported no edge at
       all — the one state calcium is meant to act early on. */
    expect(a.nearEdge).toBe('lower')
  })
})

/* `doseStatus`'s own second position test, the one that decides whether a dose
   change "worked" or merely stopped the drift (state.js:300-302). Built as a
   literal so the branch is reached directly rather than via a series. */
describe('§26 — doseStatus judges "did it work" from the last reading', () => {
  const def = PARAM_DEFS.find((d) => d.key === 'alkalinity')
  const a = {
    action: 'hold', ok: true, trendPerDay: 0.01, band: 'stable',
    current: { date: '2026-08-13', value: 8.5 },
    fittedNow: 8.05,
    currentDose: 9, recommendedDose: 9, maintenanceDose: 9, effectPerMl: 0.069,
    correctionPlan: null, correctionInProgress: null, lastDoseChangeAt: '2026-08-08',
    used: [{ date: '2026-08-11', value: 8.4 }, { date: '2026-08-13', value: 8.5 }],
    activePlan: { appliedAt: '2026-08-08', appliedDose: 9, target: 9, stage: 1, stages: 1, nextTestAt: '2026-08-14' },
  }

  it('a settled dose with the last reading inside the band reads as having worked', () => {
    const st = doseStatus(a, def, TODAY, DEFAULT_SETTINGS,
      { alkalinity: { date: '2026-08-13', value: 8.5 } }, [], [])
    /* DEFECT: judged on `fittedNow` (8.05, below 8.2) this returned "steady but
       not where you want it" and told the keeper the level itself needed a
       separate correction — about a reading of 8.5, inside 8.2–8.8. */
    expect(st.state).toBe('worked')
    expect(st.short).toBe('Change worked')
    expect(`${st.headline} ${st.detail}`).not.toMatch(/not where you want it|needs a separate correction/)
  })
})
