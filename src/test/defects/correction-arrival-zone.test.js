/* Bug 7 (routine 15, TW-020) — `arrived` tests the arrival zone, not the
 * full band.
 *
 * Spec anchor: docs/spec/reef-chemistry.md §9, "Decided 14 Aug: the arrival
 * test is the middle third of the band, floored so the zone is never
 * narrower than twice that element's noise floor (§5)."
 *
 *   zoneWidth = max(bandWidth / 3, 2 x noiseFloor)   clamped to bandWidth
 *   zone      = midpoint +/- zoneWidth / 2
 *
 * Worked, per §9's own table: alkalinity 0.6 dKH band -> zone 8.40-8.60;
 * calcium 50 ppm band -> zone 415-435; magnesium (band as decided, 150 ppm,
 * 1275-1425 per §2 -- the shipped PARAM_DEFS default is still off-centre,
 * bug 4's own uncredited finding, not this bug's to fix) -> zone 1320-1380.
 *
 * `def` is built locally in every case below (band values passed directly),
 * per the routine's own dependency note: the fix is band-relative by
 * construction (§9: "the zone is computed from whatever band is in force
 * and must never be hardcoded"), so this test does not need bug 4's PR
 * (alkalinity's real PARAM_DEFS band) to have merged.
 */
import { describe, expect, it } from 'vitest'
import { correctionProgress } from '../../lib/dosing/helpers.js'
import { assessAlkalinity } from '../../lib/dosing/alkalinity.js'
import { doseStatus } from '../../lib/dosing/state.js'
import { dayNum } from '../../lib/analytics/water-changes.js'

const day = (n) => new Date(Date.UTC(2026, 5, 1) + n * 86400000).toISOString().slice(0, 10)
const at = (n) => dayNum(day(n)) + 12 / 24

const CASES = {
  alkalinity: {
    def: { key: 'alkalinity', label: 'Alkalinity', unit: 'dKH', min: 8.2, max: 8.8, step: 0.1 },
    // zone 8.40-8.60 per §9's table
    inBandNotZone: [8.25, 8.28],
    inZone: [8.45, 8.50],
    passedNotArrived: { pair: [8.0, 8.65], target: 8.5 },
  },
  calcium: {
    def: { key: 'calcium', label: 'Calcium', unit: 'ppm', min: 400, max: 450, step: 1 },
    // zone 415-435 per §9's table
    inBandNotZone: [405, 408],
    inZone: [420, 425],
    passedNotArrived: { pair: [390, 440], target: 425 },
  },
  magnesium: {
    // A local band matching §2's decided target/width (1350, 150 total) —
    // not the live PARAM_DEFS default, which bug 4 found is still
    // off-centre and is not this bug's to fix.
    def: { key: 'magnesium', label: 'Magnesium', unit: 'ppm', min: 1275, max: 1425, step: 1 },
    // zone 1320-1380 per §9's table
    inBandNotZone: [1290, 1300],
    inZone: [1330, 1350],
    passedNotArrived: { pair: [1275, 1400], target: 1350 },
  },
};

const plan = (def, startValue, target) => ({
  target, startValue, startedAt: day(0), returnDose: 9, pace: 'steady', dose: 9, days: 10,
});

const readingsFor = (def, values, startDay = 4) => values.map((v, i) => ({
  param: def.key, date: day(startDay + i * 2), time: '20:00', value: v,
}));

describe.each(Object.entries(CASES))('%s — arrival zone, not the full band', (key, cfg) => {
  const { def } = cfg;

  it('DEFECT: two readings inside the band but outside the arrival zone no longer read as arrived', () => {
    const p = plan(def, def.min - (def.max - def.min) * 0.5, (def.min + def.max) / 2);
    const readings = readingsFor(def, cfg.inBandNotZone);
    // Precondition: both readings really are inside the full band — the old
    // test would have called this arrived.
    for (const v of cfg.inBandNotZone) {
      expect(v).toBeGreaterThanOrEqual(def.min);
      expect(v).toBeLessThanOrEqual(def.max);
    }
    const cp = correctionProgress(p, def, readings, day(20), null);
    expect(cp.arrived).toBe(false)
  })

  it('two readings inside the arrival zone still read as arrived', () => {
    const p = plan(def, def.min - (def.max - def.min) * 0.5, (def.min + def.max) / 2);
    const readings = readingsFor(def, cfg.inZone);
    const cp = correctionProgress(p, def, readings, day(20), null);
    expect(cp.arrived).toBe(true)
  })

  it('passed is independent of arrived: passing the target without two zone readings still stops the push', () => {
    const { pair, target } = cfg.passedNotArrived;
    const p = plan(def, def.min - (def.max - def.min) * 0.5, target);
    const readings = readingsFor(def, pair);
    const cp = correctionProgress(p, def, readings, day(20), null);
    expect(cp.passed).toBe(true)
    expect(cp.arrived).toBe(false)
  })
})

describe('assessAlkalinity + doseStatus — correction-done still fires on passed alone (§9)', () => {
  const def = { key: 'alkalinity', label: 'Alkalinity', unit: 'dKH', min: 8.2, max: 8.8, step: 0.1 }
  const settings = { volumeL: 77, dkhPerMlPer100L: 0.0533, dailyDoseMl: 9 }

  it('passed without two arrival-zone readings still reaches correction-done, via the real assess + doseStatus path', () => {
    const readings = [
      { param: 'alkalinity', date: day(4), time: '20:00', value: 8.0 },
      { param: 'alkalinity', date: day(6), time: '20:00', value: 8.65 },
    ]
    const doseLog = [{ element: 'alkalinity', date: day(0), time: '21:00', ml: 9 }]
    const correctionPlans = {
      alkalinity: { target: 8.5, returnDose: 9, startedAt: day(0), startValue: 7.5, pace: 'steady', dose: 9, days: 10 },
    }
    const a = assessAlkalinity({
      readings, doseLog, waterChanges: [], corrections: [], settings, def, correctionPlans, now: at(6),
    })
    expect(a.correctionPlan).toBeTruthy()
    expect(a.correctionPlan.passed).toBe(true)
    expect(a.correctionPlan.arrived).toBe(false)
    const st = doseStatus(a, def, day(6), settings)
    expect(st).toBeTruthy()
    expect(st.state).toBe('correction-done')
  })
})
