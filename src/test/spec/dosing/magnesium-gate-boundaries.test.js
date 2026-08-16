/* The magnesium gate's edges — reef-chemistry.md §10, §12, §20, §2.
 *
 * The three red spec tests that pinned this rule
 * (`classification/alert-thresholds.test.js`, `classification/ca-alk-coupling.test.js`,
 * `dosing/magnesium-gate.test.js`) all check the same thing from three angles:
 * that a correction IS withheld. None of them checks what the gate must not
 * do, and that is the half with the safety consequences — a refusal that also
 * swallows a warning is worse than no refusal at all.
 *
 * So this file covers only the boundaries: where the gate stops.
 */
import { describe, expect, it } from 'vitest'
import { magnesiumAlertLow, magnesiumGate } from '../../../lib/analytics/magnesium-gate.js'
import { assessAlkalinity } from '../../../lib/dosing/alkalinity.js'
import { assessMagnesium, proposeCorrection } from '../../../lib/dosing/helpers.js'
import { doseStatus } from '../../../lib/dosing/state.js'
import { PARAM_DEFS } from '../../../lib/constants.js'
import { SAFE_BOUNDS } from '../../../lib/findings.js'

const alkDef = PARAM_DEFS.find((d) => d.key === 'alkalinity');
const mgDef = PARAM_DEFS.find((d) => d.key === 'magnesium');
const settings = { volumeL: 100, dkhPerMlPer100L: 0.02, mgPpmPerMlPer100L: 0.024,
  dailyDoseMl: 8, magDoseMl: 8 };

/* Magnesium below alert-low, tested at its own 21-day cadence (§4). */
const lowMg = [
  { id: 'm1', param: 'magnesium', date: '2026-06-10', value: 1180 },
  { id: 'm2', param: 'magnesium', date: '2026-07-01', value: 1160 },
  { id: 'm3', param: 'magnesium', date: '2026-07-22', value: 1140 },
];

describe('§18 + §2 — where alert-low sits', () => {
  it('is the §18 threshold (midpoint − 200) floored at §2\'s safe bound, which on the shipped range is 1150', () => {
    /* PARAM_DEFS ships magnesium at 1250–1400 (TW-052 — §2 layer 3 suggests
       1275–1425), so §18's midpoint − 200 gives 1125, below the 1150 safe
       bound. The floor is what stops the act-now line sitting outside the
       harm line. */
    expect((mgDef.min + mgDef.max) / 2 - 200).toBe(1125);
    expect(SAFE_BOUNDS.magnesium.min).toBe(1150);
    expect(magnesiumAlertLow(PARAM_DEFS)).toBe(1150);
  });

  it('follows the user\'s own range upward when their midpoint puts alert-low above the safe bound', () => {
    const wide = PARAM_DEFS.map((d) => (d.key === 'magnesium' ? { ...d, min: 1300, max: 1500 } : d));
    expect(magnesiumAlertLow(wide)).toBe(1200); // midpoint 1400 − 200, above the floor
  });

  it('at-or-below closes it, per wizard-states.md §13\'s boundary rule', () => {
    const at = [{ id: 'm', param: 'magnesium', date: '2026-07-22', value: 1150 }];
    const above = [{ id: 'm', param: 'magnesium', date: '2026-07-22', value: 1150.5 }];
    expect(magnesiumGate({ readings: at, settings, paramDefs: PARAM_DEFS })).toBeTruthy();
    expect(magnesiumGate({ readings: above, settings, paramDefs: PARAM_DEFS })).toBeNull();
  });
});

describe('§10 — what the gate does not close over', () => {
  it('magnesium that has never been measured does not close it', () => {
    /* §10 conditions the rule on magnesium being below alert-low. An
       unmeasured level is not below anything, and refusing on a measurement
       nobody took would withhold every alkalinity and calcium correction from
       every tank that does not test magnesium. */
    expect(magnesiumGate({ readings: [], settings, paramDefs: PARAM_DEFS })).toBeNull();
  });

  it('magnesium\'s own correction is never gated — it is the thing the gate is asking for', () => {
    const a = assessMagnesium({
      readings: lowMg, doseLog: [], waterChanges: [],
      settings: { ...settings, magDoseMl: 8 }, def: mgDef, now: null, paramDefs: PARAM_DEFS,
    });
    const offer = proposeCorrection(a, mgDef, settings, 'steady');
    /* Whatever it decides about feasibility, it must not be refused *because
       of the gate* — that would leave the keeper with no way out of it. */
    expect(offer && offer.magnesiumGate).toBeFalsy();
  });

  it('a dose DECREASE is not gated — lowering a level cannot precipitate anything', () => {
    /* Alkalinity climbing well above its range on a low-magnesium tank. The
       app should still say to ease the dose down. */
    const rising = [
      { id: 'a1', param: 'alkalinity', date: '2026-07-10', value: 9.4 },
      { id: 'a2', param: 'alkalinity', date: '2026-07-14', value: 9.7 },
      { id: 'a3', param: 'alkalinity', date: '2026-07-18', value: 10.0 },
      { id: 'a4', param: 'alkalinity', date: '2026-07-22', value: 10.3 },
    ];
    const out = assessAlkalinity({
      readings: [...rising, ...lowMg], doseLog: [], waterChanges: [], settings,
      def: alkDef, now: null, paramDefs: PARAM_DEFS,
    });
    expect(out.magnesiumGate).toBeTruthy();      // the gate IS closed
    expect(out.action).not.toBe('hold');          // and it did not suppress this
    expect(out.action).toBe('decrease');
  });
});

describe('§2 layer 1 — the gate suppresses advice about a correction, never the warning', () => {
  /* Alkalinity below 7 dKH, the §2 safe bound, on a tank whose magnesium is
     under alert-low. The correction is deferred; the danger is not. */
  const crashing = [
    { id: 'a1', param: 'alkalinity', date: '2026-07-10', value: 7.6 },
    { id: 'a2', param: 'alkalinity', date: '2026-07-14', value: 7.2 },
    { id: 'a3', param: 'alkalinity', date: '2026-07-18', value: 6.9 },
    { id: 'a4', param: 'alkalinity', date: '2026-07-22', value: 6.5 },
  ];
  const readings = [...crashing, ...lowMg];

  it('precondition: alkalinity really is outside SAFE_BOUNDS and the gate really is closed', () => {
    expect(6.5).toBeLessThan(SAFE_BOUNDS.alkalinity.min);
    const out = assessAlkalinity({ readings, doseLog: [], waterChanges: [], settings,
      def: alkDef, now: null, paramDefs: PARAM_DEFS });
    expect(out.magnesiumGate).toBeTruthy();
  });

  it('the wizard still reports the emergency', () => {
    const out = assessAlkalinity({ readings, doseLog: [], waterChanges: [], settings,
      def: alkDef, now: null, paramDefs: PARAM_DEFS });
    const st = doseStatus(out, alkDef, '2026-07-22', settings,
      { alkalinity: crashing[crashing.length - 1] }, [], []);
    expect(st.state).toBe('emergency');
  });

  it('the correction offer is refused, and names magnesium rather than going silent', () => {
    const out = assessAlkalinity({ readings, doseLog: [], waterChanges: [], settings,
      def: alkDef, now: null, paramDefs: PARAM_DEFS });
    const offer = proposeCorrection(out, alkDef, settings, 'steady');
    expect(offer).toBeTruthy();
    expect(offer.possible).toBe(false);
    expect(offer.why.toLowerCase()).toMatch(/magnesium/);
  });
});
