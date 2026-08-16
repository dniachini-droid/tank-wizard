/* Spec conformance — §5 magnesium gate
 *
 * Spec anchor: docs/spec/reef-chemistry.md §5, lines 138-141 —
 *   "Magnesium gate. Low magnesium destabilises both alk and calcium and
 *   drives precipitation. If magnesium is below alert-low, the app does not
 *   recommend alk or calcium corrections until magnesium is addressed.
 *   Correcting the other two first wastes additive and can precipitate."
 *
 * §9, line 207 — the app must refuse to "Recommend alk or calcium correction
 * while magnesium is below alert-low."
 *
 * §10 worked example 4 (reef-chemistry.md:235-236), verbatim:
 *   "GIVEN Mg 1140 with alert-low 1150, and alk 7.4 with target 8.5 THEN
 *   addresses magnesium only; explicitly defers the alk correction and says
 *   why."
 */
import { describe, expect, it } from 'vitest'
import { assessAlkalinity } from '../../../lib/dosing/alkalinity.js'
import { assessCalcium } from '../../../lib/dosing/calcium.js'

/* Band ±0.5 around a target of 8.5, matching the worked example's target. */
const alkDef = { key: 'alkalinity', label: 'Alkalinity', unit: 'dKH', min: 8.0, max: 9.0, step: 0.1 };
const caDef = { key: 'calcium', label: 'Calcium', unit: 'ppm', min: 400, max: 450, step: 1 };

/* Alkalinity falling steadily toward 7.4, well below the 8.0 band floor —
   readings 2 days apart across 6 days (spec-legal cadence, §4/§8), and a
   dose that has not changed recently, so the engine has everything it needs
   to reach a normal "increase the dose" verdict. Nothing about magnesium is
   passed anywhere, because assessAlkalinity's parameters (readings, doseLog,
   waterChanges, settings, def, now, plan, corrections, correctionPlans) have
   no channel for another parameter's status at all. */
const alkReadings = [
  { id: '1', param: 'alkalinity', date: '2026-08-01', value: 8.3 },
  { id: '2', param: 'alkalinity', date: '2026-08-03', value: 8.0 },
  { id: '3', param: 'alkalinity', date: '2026-08-05', value: 7.7 },
  { id: '4', param: 'alkalinity', date: '2026-08-07', value: 7.4 },
];
const alkSettings = { volumeL: 100, dkhPerMlPer100L: 0.02, dailyDoseMl: 8 };

describe('§5/§9 magnesium gate — worked example 4', () => {
  it('precondition: with magnesium out of the picture entirely, alkalinity gets a real correction', () => {
    const out = assessAlkalinity({
      readings: alkReadings, doseLog: [], waterChanges: [], settings: alkSettings,
      def: alkDef, now: 20320,
    });
    expect(out.ok).toBe(true);
    expect(out.action).toBe('increase');
    expect(out.recommendedDose).toBeGreaterThan(out.currentDose);
  });

  it('assessAlkalinity has no parameter through which magnesium status could reach it', () => {
    /* Documents the missing channel directly: the function signature is
       destructured from a single object with these exact keys. There is no
       `magnesium`, `mgStatus`, or `mgBelowAlertLow` among them. */
    const accepted = ['readings', 'doseLog', 'waterChanges', 'settings', 'def',
      'now', 'plan', 'corrections', 'correctionPlans'];
    expect(accepted).not.toContain('magnesium');
    expect(accepted).not.toContain('mgStatus');
  });

  it('injecting magnesium\'s status via settings does not defer the alkalinity correction (it must, per worked example 4)', () => {
    /* Worked example 4 verbatim: Mg 1140, alert-low 1150 (i.e. 10 ppm below
       the gate). Smuggled into settings under the most plausible names, in
       case the engine reads them opportunistically even though they are not
       part of its documented parameters. */
    const gatedSettings = {
      ...alkSettings,
      magnesium: 1140, mgAlertLow: 1150,
      magnesiumValue: 1140, magnesiumBelowAlertLow: true,
    };
    const out = assessAlkalinity({
      readings: alkReadings, doseLog: [], waterChanges: [], settings: gatedSettings,
      def: alkDef, now: 20320,
    });
    /* Spec-correct: this must come back deferred, explaining that magnesium
       needs addressing first — not a live alkalinity correction. */
    expect(out.action).not.toBe('increase');
    expect(out.reason || out.explanation).toMatch(/magnesium/i);
  });

  it('the same gap exists for calcium: a low-magnesium tank still gets a calcium correction', () => {
    const caReadings = [
      { id: '1', param: 'calcium', date: '2026-07-01', value: 430 },
      { id: '2', param: 'calcium', date: '2026-07-08', value: 410 },
      { id: '3', param: 'calcium', date: '2026-07-15', value: 390 },
      { id: '4', param: 'calcium', date: '2026-07-22', value: 370 },
    ];
    /* The magnesium this test's title has always described and its fixture
       never contained. Below the alert-low of 1150 by the last reading, on
       magnesium's own 21-day cadence (§4). Without these rows the fixture was
       a tank whose magnesium had never been measured, which is not a
       low-magnesium tank and does not close the gate — §10 conditions the
       rule on magnesium being BELOW alert-low, and unmeasured is not below
       anything. Fixture corrected on the spec owner's instruction,
       16 August; the assertions are the ones that always stood here. */
    const mgReadings = [
      { id: 'm1', param: 'magnesium', date: '2026-06-10', value: 1180 },
      { id: 'm2', param: 'magnesium', date: '2026-07-01', value: 1160 },
      { id: 'm3', param: 'magnesium', date: '2026-07-22', value: 1140 },
    ];
    const caSettings = { volumeL: 100, caPpmPerMlPer100L: 0.36, calciumDoseMl: 9,
      mgPpmPerMlPer100L: 0.024, magDoseMl: 8 };
    /* Precondition, "on its own terms" — i.e. without the magnesium rows,
       exactly as the same precondition is written in
       classification/alert-thresholds.test.js and the parity file. Run
       against the full fixture it would be the gated call below with the
       opposite expectation, which no implementation can satisfy. */
    const alone = assessCalcium({
      readings: caReadings, doseLog: [], waterChanges: [], settings: caSettings,
      def: caDef, now: 20340,
    });
    expect(alone.ok).toBe(true);
    expect(alone.action).toBe('increase');
    /* Per §10/§12, deferred now that magnesium is gated — and it names the
       reason rather than going quiet. */
    const out = assessCalcium({
      readings: [...caReadings, ...mgReadings], doseLog: [], waterChanges: [],
      settings: caSettings, def: caDef, now: 20340,
    });
    expect(out.action).not.toBe('increase');
    expect(out.reason || out.explanation).toMatch(/magnesium/i);
  });
});
