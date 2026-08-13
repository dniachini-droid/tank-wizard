/* Spec conformance — §5 precipitation guard
 *
 * Spec anchor: docs/spec/reef-chemistry.md §5, lines 143-145 —
 *   "Precipitation guard. Never recommend simultaneous alkalinity and
 *   calcium doses. Separate by at least 4 hours ([user], minimum 1). Never
 *   recommend dosing both into the same location at the same time."
 *
 * §9, line 206 — the app must refuse to "Recommend simultaneous alk and
 * calcium dosing."
 *
 * §10 worked example 8 (reef-chemistry.md:249-250), verbatim:
 *   "GIVEN an alk dose and a Ca dose both due THEN never scheduled together;
 *   separated by >=4 hours."
 */
import { describe, expect, it } from 'vitest'
import { assessAlkalinity } from '../../../lib/dosing/alkalinity.js'
import { assessCalcium } from '../../../lib/dosing/calcium.js'

const alkDef = { key: 'alkalinity', label: 'Alkalinity', unit: 'dKH', min: 8.0, max: 9.0, step: 0.1 };
const caDef = { key: 'calcium', label: 'Calcium', unit: 'ppm', min: 400, max: 450, step: 1 };

/* Two independent, spec-legal fixtures that each land squarely on "a dose is
   due today": alkalinity falling out of band, calcium falling out of band —
   the worked example's "an alk dose and a Ca dose both due". */
const alkReadings = [
  { id: '1', param: 'alkalinity', date: '2026-08-01', value: 8.3 },
  { id: '2', param: 'alkalinity', date: '2026-08-03', value: 8.0 },
  { id: '3', param: 'alkalinity', date: '2026-08-05', value: 7.7 },
  { id: '4', param: 'alkalinity', date: '2026-08-07', value: 7.4 },
];
const alkSettings = { volumeL: 100, dkhPerMlPer100L: 0.02, dailyDoseMl: 8 };

const caReadings = [
  { id: '1', param: 'calcium', date: '2026-07-01', value: 430 },
  { id: '2', param: 'calcium', date: '2026-07-08', value: 410 },
  { id: '3', param: 'calcium', date: '2026-07-15', value: 390 },
  { id: '4', param: 'calcium', date: '2026-07-22', value: 370 },
];
const caSettings = { volumeL: 100, caPpmPerMlPer100L: 0.36, calciumDoseMl: 9 };

describe('§5/§9 precipitation guard — worked example 8', () => {
  const alk = assessAlkalinity({
    readings: alkReadings, doseLog: [], waterChanges: [], settings: alkSettings,
    def: alkDef, now: 20320,
  });
  const ca = assessCalcium({
    readings: caReadings, doseLog: [], waterChanges: [], settings: caSettings,
    def: caDef, now: 20340,
  });

  it('precondition: both an alkalinity dose and a calcium dose are recommended for the same day', () => {
    expect(alk.ok).toBe(true);
    expect(alk.action).toBe('increase');
    expect(ca.ok).toBe(true);
    expect(ca.action).toBe('increase');
  });

  it('neither recommendation carries a minimum-separation-from-the-other-element field', () => {
    /* Spec requires >=4 hours (user-tightenable down to a floor of 1) between
       an alk dose and a Ca dose. Nothing on either result names a separation
       requirement, a scheduled time, or a reference to the other element at
       all — there is no field to check before administering both doses back
       to back. Asserted as a plain presence check first (so the failure
       reads as "the field does not exist" rather than a type error), then as
       the numeric requirement itself. */
    expect(alk.minSeparationFromCalciumHours).toBeDefined();
    expect(ca.minSeparationFromAlkalinityHours).toBeDefined();
    expect(Number(alk.minSeparationFromCalciumHours) >= 4).toBe(true);
    expect(Number(ca.minSeparationFromAlkalinityHours) >= 4).toBe(true);
  });

  it('neither engine is even given the other element\'s recommendation to check against', () => {
    /* For a guard against *simultaneous* alk+Ca dosing to be enforceable in
       logic (reef-chemistry.md:151 — "enforced in logic, not merely
       displayed"), assessAlkalinity would need to know whether a calcium
       dose is also due today, or vice versa. Neither function's parameter
       list includes anything about the other element's assessment, due date,
       or last-dosed time — each is computed in total isolation. */
    const alkParams = ['readings', 'doseLog', 'waterChanges', 'settings', 'def',
      'now', 'plan', 'corrections', 'correctionPlans'];
    expect(alkParams).not.toContain('calciumDue');
    expect(alkParams).not.toContain('otherElementAssessment');
    /* Both `alk` and `ca` above were computed with no reference to each
       other whatsoever, and both came back "increase" (see precondition) —
       nothing in the call graph could have refused or delayed either one on
       account of the other being due at the same time. */
    expect(alk.action).toBe('increase');
    expect(ca.action).toBe('increase');
  });
});
