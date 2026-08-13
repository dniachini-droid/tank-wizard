/* Defect 1 (inventory §6.1) — src/lib/dosing/state.js:322-323
 *
 *   const same = (a.trendPerDay < 0 && a.action === "increase")
 *     || (a.trendPerDay > 0 && a.action === "increase");
 *
 * Both disjuncts test "increase". The second was meant to be "decrease", as the
 * comment directly above it says: "Fell short means the tank is still heading
 * the way it was and the engine still wants more of the same. Anything else
 * after a change — wanting to cut back while it climbs — means it went too far."
 *
 * Spec anchor: docs/spec/reef-chemistry.md §0 — the app never recommends a large
 * single-step correction and would rather say "not enough data" than produce a
 * confident wrong number; and §6 — a recommendation that pushes a parameter
 * further past where it should be is a bug, not a preference. Telling a keeper
 * "Needs more" while the level is already rising is a direct escalation path on
 * a tank that has overshot.
 *
 * This test drives the full truth table of (trend direction × requested action)
 * in one assertion so the diff names every row that is wrong.
 */
import { describe, expect, it } from 'vitest'
import { PARAM_DEFS } from '../../lib/constants.js'
import { doseStatus } from '../../lib/dosing/state.js'
import { DEFAULT_SETTINGS } from '../../lib/analytics/water-changes.js'

const TODAY = '2026-08-13'
const def = PARAM_DEFS.find((d) => d.key === 'alkalinity')

/* A tank that changed its alkalinity dose four days ago and has since taken two
   readings, so the change has been tested. The level sits inside the band and
   the series is not stable, which is the state that reaches the fell-short /
   overshot decision at state.js:318-332. */
function assessment({ trendPerDay, action }) {
  return {
    action,
    trendPerDay,
    band: trendPerDay > 0 ? 'rising' : 'falling',
    current: { date: '2026-08-12', value: 9.0 },
    fittedNow: 9.0,
    currentDose: 9,
    recommendedDose: action === 'increase' ? 10.5 : 7.5,
    maintenanceDose: 10.5,
    effectPerMl: 0.069,
    correctionPlan: null,
    correctionInProgress: null,
    lastDoseChangeAt: '2026-08-09',
    used: [
      { date: '2026-08-10', value: 8.8 },
      { date: '2026-08-12', value: 9.0 },
    ],
    activePlan: {
      appliedAt: '2026-08-09',
      appliedDose: 9,
      target: 10.5,
      stage: 1,
      stages: 2,
      nextTestAt: '2026-08-14',
    },
  }
}

const stateFor = (row) =>
  doseStatus(assessment(row), def, TODAY, DEFAULT_SETTINGS, { alkalinity: { date: '2026-08-12', value: 9.0 } }, [], []).state

describe('doseStatus — did the dose change fall short, or overshoot?', () => {
  it('reads the tank\'s direction against the requested change', () => {
    /* Reaching the branch at all is a precondition, not the thing under test —
       if this fixture stops landing there the rows below are meaningless. */
    expect(['fell-short', 'overshot']).toContain(stateFor({ trendPerDay: -0.1, action: 'increase' }))

    const actual = {
      /* Still falling after raising the dose: the change narrowed the gap but
         did not close it. */
      'falling + increase': stateFor({ trendPerDay: -0.1, action: 'increase' }),
      /* Rising after raising the dose, and the engine still wants more: the
         change carried it past where it needed to be. */
      'rising + increase': stateFor({ trendPerDay: 0.1, action: 'increase' }),
      /* Still rising after cutting the dose, and the engine wants to cut
         further: the change fell short. */
      'rising + decrease': stateFor({ trendPerDay: 0.1, action: 'decrease' }),
      /* Falling after cutting the dose: it turned the other way. */
      'falling + decrease': stateFor({ trendPerDay: -0.1, action: 'decrease' }),
    }

    expect(actual).toEqual({
      'falling + increase': 'fell-short',
      'rising + increase': 'overshot',
      'rising + decrease': 'fell-short',
      'falling + decrease': 'overshot',
    })
  })
})
