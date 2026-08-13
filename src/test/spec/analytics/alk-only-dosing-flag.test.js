/* Spec conformance — §5 dosing alkalinity alone is a defect state
 *
 * docs/spec/reef-chemistry.md §5 (lines 135-136):
 *   "Dosing alkalinity alone over time is a defect state, not a valid
 *    configuration. Flag it."
 *
 * The mechanism available in this scope for "is the user dosing element X" is
 * `computeElementConsumption`'s `doseConfigured` flag (true when the
 * settings-configured daily dose for that element is > 0) — this is the
 * closest in-scope equivalent to "a doseLog with alk doses and no Ca doses".
 * A repo-wide grep for anything resembling this flag (`alk.?only`, "defect
 * state", "dosing alone") found nothing anywhere in src/, not only in the
 * files in this agent's scope — so this is reported as a confirmed missing
 * feature, not a misconfigured one.
 */
import { describe, expect, it } from 'vitest'
import { computeElementConsumption } from '../../../lib/analytics/consumption.js'
import { DEFAULT_SETTINGS } from '../../../lib/analytics/water-changes.js'

/* Six weeks of alkalinity readings under a real alkalinity dose, and calcium
   readings with NO calcium product configured (calciumDoseMl: 0) — the exact
   configuration §5 calls a defect state. */
const alkReadings = [
  { id: 'a1', param: 'alkalinity', date: '2026-07-02', value: 9.0 },
  { id: 'a2', param: 'alkalinity', date: '2026-07-16', value: 8.8 },
  { id: 'a3', param: 'alkalinity', date: '2026-08-13', value: 8.5 },
]
const caReadings = [
  { id: 'c1', param: 'calcium', date: '2026-06-20', value: 430 },
  { id: 'c2', param: 'calcium', date: '2026-07-20', value: 410 },
  { id: 'c3', param: 'calcium', date: '2026-08-13', value: 390 },
]
const settings = { ...DEFAULT_SETTINGS, volumeL: 100, dailyDoseMl: 8, calciumDoseMl: 0 }

describe('a tank dosing alkalinity with no calcium product configured', () => {
  it('Precondition: the per-element data genuinely shows alk dosed, calcium not', () => {
    const alkResult = computeElementConsumption('alkalinity', alkReadings, [], settings)
    const caResult = computeElementConsumption('calcium', caReadings, [], settings)
    expect(alkResult.status).toBe('ok')
    expect(caResult.status).toBe('ok')
    expect(alkResult.doseConfigured).toBe(true)
    expect(caResult.doseConfigured).toBe(false)
    /* And calcium is in fact falling, exactly the scenario §5 warns about. */
    expect(caResult.netChange).toBeLessThan(0)
  })

  it('SPEC VIOLATION: no field anywhere in either result flags this as the defect state §5 describes', () => {
    const alkResult = computeElementConsumption('alkalinity', alkReadings, [], settings)
    const caResult = computeElementConsumption('calcium', caReadings, [], settings)
    const combined = JSON.stringify({ alkResult, caResult })
    /* Looking for ANY signal — a boolean flag, a warning string, anything —
       that this alk-only configuration has been recognised as a defect
       state, per the spec's instruction to "flag it". */
    expect(combined).toMatch(/alk.{0,15}(alone|only)|defect state|missing calcium|no calcium (dose|product)/i)
  })
})
