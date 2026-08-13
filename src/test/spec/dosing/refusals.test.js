/* Spec conformance — §2/§7.6/§9 refusal to dose without net volume, and
 * naming it, across every dose-recommendation entry point in scope.
 *
 * Spec anchor: docs/spec/reef-chemistry.md §2, lines 48-52 —
 *   "Every dose calculation uses net volume. Never gross... If net volume is
 *   unset, the app refuses to calculate any dose and names net volume as the
 *   missing input."
 * §7.6, line 188 — "Any missing input is named. The app never substitutes a
 * default silently."
 * §9, lines 204 and 212 — the app must refuse to "Calculate any dose when
 * net volume is unset" and to "Substitute a default for a missing
 * measurement without saying so."
 *
 * src/test/defects/net-volume.test.js already covers assessAlkalinity
 * against the DEFAULT_SETTINGS 77 L fallback. This file covers the other
 * entry points named in this audit's brief: assessCalcium, assessMagnesium,
 * proposeCorrection, and doseStatus.
 */
import { describe, expect, it } from 'vitest'
import { assessCalcium } from '../../../lib/dosing/calcium.js'
import { assessMagnesium, missingDoseInputs, proposeCorrection } from '../../../lib/dosing/helpers.js'
import { doseStatus } from '../../../lib/dosing/state.js'

const caDef = { key: 'calcium', label: 'Calcium', unit: 'ppm', min: 400, max: 450, step: 1 };
const mgDef = { key: 'magnesium', label: 'Magnesium', unit: 'ppm', min: 1250, max: 1400, step: 1 };

const caReadings = [
  { id: '1', param: 'calcium', date: '2026-07-01', value: 430 },
  { id: '2', param: 'calcium', date: '2026-07-08', value: 420 },
  { id: '3', param: 'calcium', date: '2026-07-15', value: 410 },
];
const mgReadings = [
  { id: '1', param: 'magnesium', date: '2026-06-01', value: 1350 },
  { id: '2', param: 'magnesium', date: '2026-06-22', value: 1320 },
  { id: '3', param: 'magnesium', date: '2026-07-13', value: 1290 },
];

describe('§2/§7.6/§9 — assessCalcium refuses and names net volume', () => {
  it('with volume set, this fixture does produce a dose (precondition)', () => {
    const settings = { volumeL: 100, caPpmPerMlPer100L: 0.36, calciumDoseMl: 9 };
    const out = assessCalcium({ readings: caReadings, doseLog: [], waterChanges: [], settings, def: caDef, now: 20330 });
    expect(out.maintenanceDose).not.toBeNull();
  });

  it('with volume unset, refuses and names net volume', () => {
    const settings = { caPpmPerMlPer100L: 0.36, calciumDoseMl: 9 }; // volumeL absent
    const out = assessCalcium({ readings: caReadings, doseLog: [], waterChanges: [], settings, def: caDef, now: 20330 });
    expect(out.ok).toBe(false);
    expect(out.recommendedDose).toBeNull();
    expect(out.maintenanceDose).toBeNull();
    expect(out.reason).toMatch(/net volume/i);
  });
});

describe('§2/§7.6/§9 — assessMagnesium refuses and names net volume', () => {
  it('with volume set, this fixture does produce a dose (precondition)', () => {
    const settings = { volumeL: 100, mgPpmPerMlPer100L: 0.024, magDoseMl: 8 };
    const out = assessMagnesium({ readings: mgReadings, doseLog: [], waterChanges: [], settings, def: mgDef, now: 20360 });
    expect(out.maintenanceDose).not.toBeNull();
  });

  it('with volume unset, refuses and names net volume', () => {
    const settings = { mgPpmPerMlPer100L: 0.024, magDoseMl: 8 }; // volumeL absent
    const out = assessMagnesium({ readings: mgReadings, doseLog: [], waterChanges: [], settings, def: mgDef, now: 20360 });
    expect(out.ok).toBe(false);
    expect(out.recommendedDose).toBeNull();
    expect(out.maintenanceDose).toBeNull();
    expect(out.reason).toMatch(/net volume/i);
  });
});

describe('§7.6/§9 — proposeCorrection names net volume as the missing input rather than returning a bare refusal', () => {
  /* This is the exact shape a caller has after assessAlkalinity/assessCalcium/
     assessMagnesium refused for a missing volume: `current` and `effectPerMl`
     are both null, because the assessment returned before setting them. */
  const refusedAssessment = {
    current: null, effectPerMl: null, maintenanceDose: null, currentDose: null,
    correctionInProgress: null, lastCorrectionPlanAt: null, lastDoseChangeAt: null,
  };

  it('returns null rather than naming net volume as the reason nothing can be proposed', () => {
    const result = proposeCorrection(refusedAssessment, caDef, {}, 'steady');
    /* Spec-correct: §7.6 says "any missing input is named" — a caller
       surfacing this to a user needs a reason string, not a bare null that
       is indistinguishable from "nothing to correct, level is in band". */
    expect(result).not.toBeNull();
    expect(result.why).toMatch(/net volume/i);
  });

  it('missingDoseInputs (the shared wording every engine uses) does name it, confirming the wording exists — proposeCorrection just never calls it', () => {
    const settings = {};
    const msg = missingDoseInputs(settings, 'calcium', 'caPpmPerMlPer100L');
    expect(msg).toMatch(/net volume/i);
  });
});

describe('§7.6/§9 — doseStatus must not paper over a missing-volume refusal with an unrelated message', () => {
  it('surfaces the real reason (net volume) rather than "needs another reading"', () => {
    const settings = { caPpmPerMlPer100L: 0.36, calciumDoseMl: 9 }; // volumeL absent
    const a = assessCalcium({ readings: caReadings, doseLog: [], waterChanges: [], settings, def: caDef, now: 20330 });
    /* Precondition: the assessment itself does the right thing. */
    expect(a.reason).toMatch(/net volume/i);

    /* A real, in-band recent reading is available independently of the
       refused assessment — exactly the shape App.jsx passes doseStatus in
       practice (`latestByParam`), and exactly the condition that makes the
       `!a.ok` branch in doseStatus choose its wording from `a.hoursOnDose`
       and `known.value` rather than from `a.reason`. */
    const latestByParam = { calcium: { value: 425, date: '2026-07-15' } };
    const status = doseStatus(a, caDef, '2026-07-16', settings, latestByParam, [], []);

    expect(status).not.toBeNull();
    /* Spec-correct: the user-facing state must name net volume as the
       problem, the same way the underlying assessment already does. */
    expect((status.headline || '') + (status.detail || '')).toMatch(/net volume/i);
  });
});
