/* §15 terminology registry / §12 parity — one field, two units, same name.
 *
 * §15: "the user's chosen value" is the ONE concept the word "target" may
 * mean, everywhere in the app. `doseStatus` (src/lib/dosing/state.js) is the
 * single function every dosing surface reads (§11's single-source rule,
 * §19's "no surface forms its own opinion") — the dashboard tile, the
 * dosing wizard's status card and the reading confirmation window (via
 * App.jsx:162's `doseStates`) all consume its return value directly. If that
 * one function's own `target` field means two different things depending on
 * which branch produced it, every one of those surfaces has silently
 * inherited a landmine: whichever one starts rendering `target` generically
 * (as several already render `correctionPlan.target`/`cp.target` with
 * `fmtVal(def, ...)` + the parameter's unit) will be right for some states
 * and wrong — by an order of magnitude, and in the wrong physical unit — for
 * others.
 *
 * Traced by file:line, `doseStatus`'s own top-level `target` key means:
 *   - a CONCENTRATION (the band midpoint, in the parameter's own unit) in
 *     the "emergency" branch (state.js:205, `target: mid`)
 *   - a DOSE RATE in mL/day (`a.maintenanceDose`) in the "suggested" branch
 *     (state.js:361, `target: a.maintenanceDose`)
 *   - a DOSE RATE in mL/day (`plan.target`, i.e. `a.activePlan.target`) in
 *     the "settling", "due" and "worked"(+in-band) branches (state.js:294,
 *     300, 315) — and state.js:314's own detail text confirms the unit by
 *     rendering it as "${fmtAmount(plan.target)} mL/day" a few lines below
 *     the very branch this file drives.
 *
 * The dose-rate reading is the majority (three of the four cases this file
 * drives), not the concentration reading — worth noting because it is easy
 * to assume, from the plainer English of the word "target", that a
 * concentration is the default and the dose-rate cases are the exception.
 * They are not: they are most of it.
 *
 * No live consumer reads the top-level `target` off a "suggested"/"settling"
 * doseStatus object today (checked: no `.target` access in src/components or
 * src/lib/narrative-engine.js touches anything but `correctionPlan.target`,
 * which is the concentration-bearing `cp` object, not this one) — so this is
 * a latent hazard, not a rendering bug in front of a user right now. That is
 * exactly why it needs a permanent pin: nothing today would fail if a future
 * change started reading it.
 */
import { describe, expect, it } from 'vitest'
import { PARAM_DEFS } from '../../src/lib/constants.js'
import { DEFAULT_SETTINGS } from '../../src/lib/analytics/water-changes.js'
import { doseStatus } from '../../src/lib/dosing/state.js'

const alkDef = PARAM_DEFS.find((d) => d.key === 'alkalinity');
const TODAY = '2026-08-14';

/* Reaches state.js:356-361, the "suggested" branch: no correction, no active
 * plan, no correction-in-progress, a level inside SAFE_BOUNDS (so the
 * emergency check above it does not intercept), and an action of
 * "increase"/"decrease". */
const suggestedA = {
  action: 'increase', staged: false, trendPerDay: -0.05,
  current: { date: '2026-08-13', value: 8.5 }, fittedNow: 8.5,
  currentDose: 9, recommendedDose: 10.2,
  /* Deliberately far outside the alkalinity band (8.2-8.8) so the mismatch,
   * if `target` were read as a concentration, would be unmistakable rather
   * than a coincidental near-miss. */
  maintenanceDose: 3.2,
  effectPerMl: 0.0533, correctionPlan: null, correctionInProgress: null,
  lastDoseChangeAt: null,
};

/* Reaches state.js:290-294, the "settling" branch: an activePlan applied
 * today, so daysSince (0) is under the settle window and nothing has been
 * tested since. */
const settlingA = {
  action: 'hold', trendPerDay: 0.01,
  current: { date: '2026-08-14', value: 8.5 }, fittedNow: 8.5,
  currentDose: 9, recommendedDose: 9, maintenanceDose: 9,
  effectPerMl: 0.0533, correctionPlan: null, correctionInProgress: null,
  lastDoseChangeAt: null, used: [],
  activePlan: { appliedAt: '2026-08-14', appliedDose: 9, target: 10.5, stage: 1, stages: 2, nextTestAt: '2026-08-16' },
};

/* Reaches state.js:188-206, the "emergency" branch: a level below
 * SAFE_BOUNDS.alkalinity.min (7), no correctionPlan. */
const emergencyA = {
  action: 'increase',
  current: { date: '2026-08-13', value: 6.5 }, fittedNow: 6.5,
  currentDose: 9, correctionPlan: null,
};

describe('precondition — the three fixtures really do reach the three branches under test', () => {
  it('suggestedA reaches "suggested"', () => {
    expect(doseStatus(suggestedA, alkDef, TODAY, DEFAULT_SETTINGS).state).toBe('suggested');
  });
  it('settlingA reaches "settling"', () => {
    expect(doseStatus(settlingA, alkDef, TODAY, DEFAULT_SETTINGS).state).toBe('settling');
  });
  it('emergencyA reaches "emergency"', () => {
    expect(doseStatus(emergencyA, alkDef, TODAY, DEFAULT_SETTINGS).state).toBe('emergency');
  });
});

describe('SPEC VIOLATION (§15 terminology registry): doseStatus\'s `target` field must mean one thing — "the user\'s chosen value" (a concentration) — in every branch it appears in', () => {
  it('the "suggested" and "settling" branches\' `target` should be a concentration in (or at least plausibly near) the alkalinity band, the same quantity the "emergency" branch\'s `target` is', () => {
    const suggested = doseStatus(suggestedA, alkDef, TODAY, DEFAULT_SETTINGS);
    const settling = doseStatus(settlingA, alkDef, TODAY, DEFAULT_SETTINGS);
    // A generous plausibility window around the band, not the band itself —
    // this asks only "is it in the right physical ballpark for a dKH
    // concentration", not "is it in range".
    const plausibleConcentration = (v) => v >= alkDef.min - 2 && v <= alkDef.max + 2;
    expect(plausibleConcentration(suggested.target)).toBe(true);
    expect(plausibleConcentration(settling.target)).toBe(true);
  });
});

describe('confirms actual behaviour: `target` is a dose rate (mL/day) in "suggested" and "settling", and a concentration (dKH) only in "emergency"', () => {
  it('"suggested": target is literally a.maintenanceDose, a dose rate — not a plausible alkalinity concentration', () => {
    const out = doseStatus(suggestedA, alkDef, TODAY, DEFAULT_SETTINGS);
    expect(out.target).toBe(suggestedA.maintenanceDose);
    expect(out.target).toBe(3.2);
    // 3.2 is nowhere near a plausible alkalinity reading (8.2-8.8, or even
    // SAFE_BOUNDS 7-11) -- it is mL/day, dressed as if it might be dKH.
    expect(out.target).toBeLessThan(alkDef.min - 2);
  });

  it('"settling": target is literally activePlan.target, a dose rate — state.js\'s own detail text for the sibling "worked" branch (line 314) confirms the same field is rendered "X mL/day" a few lines below this one', () => {
    const out = doseStatus(settlingA, alkDef, TODAY, DEFAULT_SETTINGS);
    expect(out.target).toBe(settlingA.activePlan.target);
    expect(out.target).toBe(10.5);
    // 10.5 happens to fall inside the "plausible concentration" window used
    // above by coincidence of the numbers chosen — the point is not that
    // this particular figure looks wrong, it is that the field's own
    // meaning (a dose rate) is not the meaning §15 reserves for "target".
    // Proven directly: it is byte-identical to activePlan.target, the value
    // the "worked" branch's own prose (state.js:314) labels "mL/day".
  });

  it('"emergency": target IS a concentration — the band midpoint, the one branch where the field means what §15 says it must always mean', () => {
    const out = doseStatus(emergencyA, alkDef, TODAY, DEFAULT_SETTINGS);
    const mid = (alkDef.min + alkDef.max) / 2;
    expect(out.target).toBe(mid);
    expect(out.target).toBeGreaterThanOrEqual(alkDef.min);
    expect(out.target).toBeLessThanOrEqual(alkDef.max);
  });

  it('the three branches\' `target` values are not remotely on the same scale, confirming this is not a rounding or display difference but a different quantity being returned under one field name', () => {
    const suggested = doseStatus(suggestedA, alkDef, TODAY, DEFAULT_SETTINGS);
    const settling = doseStatus(settlingA, alkDef, TODAY, DEFAULT_SETTINGS);
    const emergency = doseStatus(emergencyA, alkDef, TODAY, DEFAULT_SETTINGS);
    // All three are real, present, non-null numbers -- a consumer reading
    // `target` generically has no signal from its mere presence that tells
    // it which unit it just received.
    for (const v of [suggested.target, settling.target, emergency.target]) {
      expect(typeof v).toBe('number');
      expect(Number.isFinite(v)).toBe(true);
    }
    expect(suggested.target).not.toBe(emergency.target);
    expect(settling.target).not.toBe(emergency.target);
  });
});
