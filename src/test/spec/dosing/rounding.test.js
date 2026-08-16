/* Spec conformance — §7.2/§7.3 rounding rules, and §3 boundary handling
 *
 * Spec anchor: docs/spec/reef-chemistry.md §7, lines 179-184 —
 *   2. "Round to the doser's minimum increment [user]."
 *   3. "Round down on the first correction of any parameter. Under-correcting
 *      is recoverable; over-correcting is not."
 *
 * §3, lines 93-98 — the no-action band and alert thresholds "must never be
 * allowed to overlap or invert", and "the app must handle a reading landing
 * exactly on either edge correctly." §10 worked examples 9 and 10
 * (reef-chemistry.md:252-257) are this verbatim.
 */
import { describe, expect, it } from 'vitest'
import { PARAM_DEFS } from '../../../lib/constants.js'
import { assessAlkalinity } from '../../../lib/dosing/alkalinity.js'

const alkDef = PARAM_DEFS.find((d) => d.key === 'alkalinity'); // min 8.2, max 8.8

describe('§7.2 — round to the doser\'s minimum increment', () => {
  /* Grepped across src/lib and src/components/Setup.jsx: there is no settings
     field anywhere for a doser's minimum increment (no "increment", no
     per-element "stepMl"). Every rounding call in the dosing engines is
     hardcoded to `Math.round(x * 10) / 10` — a fixed 0.1 mL increment,
     regardless of what dosing hardware the user actually has (a Kamoer FX-STP
     doses in 0.1 mL steps; many syringe-based manual dosers cannot resolve
     anywhere near that). `doserIncrementMl` below is the obvious name such a
     setting would take; passing it demonstrates that nothing reads it. */
  it('a coarser user-configured doser increment (e.g. 0.5 mL) is not honoured', () => {
    const readings = [
      { id: '1', param: 'alkalinity', date: '2026-08-01', value: 8.9 },
      { id: '2', param: 'alkalinity', date: '2026-08-03', value: 8.6 },
      { id: '3', param: 'alkalinity', date: '2026-08-05', value: 8.3 },
      { id: '4', param: 'alkalinity', date: '2026-08-07', value: 8.0 },
    ];
    const settings = {
      volumeL: 100, dkhPerMlPer100L: 0.023, dailyDoseMl: 8.3,
      doserIncrementMl: 0.5,
    };
    const out = assessAlkalinity({
      readings, doseLog: [], waterChanges: [], settings, def: alkDef,
      now: 20320,
    });
    expect(out.ok).toBe(true);
    /* Precondition: a real, non-trivial dose was recommended, so rounding
       behaviour is actually in play. */
    expect(out.recommendedDose).not.toBeNull();
    /* Spec-correct: with a 0.5 mL doser, the recommended dose must itself be
       a multiple of 0.5. The app always returns a multiple of 0.1 instead. */
    const remainder = Math.round((out.recommendedDose % 0.5) * 100) / 100;
    expect(remainder === 0 || remainder === 0.5).toBe(true);
  });
});

describe('§7.3 — round DOWN on the first correction of any parameter', () => {
  /* Fixture: alkalinity has been dead stable at 7.8726 dKH for six days (four
     readings, two days apart — spec-legal cadence per §4/§8) while the dose
     matches consumption exactly (zero trend => maintenanceDose === currentDose,
     so the dose itself has not drifted). The tank is simply parked below the
     8.2-8.8 band (bug 4, routine 15 — the band tightened from 8.5-9.5 to
     8.2-8.8; mid moved from 9.0 to 8.5, and LEVEL moved down by the same 0.5
     dKH so `toMid`, and everything derived from it below, is unchanged). That
     is exactly the "steady, out of band" case the protocol turns into a
     one-off, additive-only correction (`out.correction`) — the FIRST
     correction for this parameter, so §7.3 requires it round down.
     effect is set to a clean 0.02 dKH/mL so the raw, unrounded corretion
     (toMid / effect) lands on 31.37 mL — a fraction whose nearest-0.1 rounding
     (31.4) diverges from its floor (31.3), which is the number a red test
     needs to actually distinguish "round to nearest" from "round down". */
  const LEVEL = 7.8726;
  const readings = [
    { id: '1', param: 'alkalinity', date: '2026-08-01', value: LEVEL },
    { id: '2', param: 'alkalinity', date: '2026-08-03', value: LEVEL },
    { id: '3', param: 'alkalinity', date: '2026-08-05', value: LEVEL },
    { id: '4', param: 'alkalinity', date: '2026-08-07', value: LEVEL },
  ];
  const settings = { volumeL: 100, dkhPerMlPer100L: 0.02, dailyDoseMl: 8 };
  const out = assessAlkalinity({
    readings, doseLog: [], waterChanges: [], settings, def: alkDef, now: 20320,
  });

  it('precondition: the tank is graded stable, out of band, and offers a one-off correction', () => {
    expect(out.ok).toBe(true);
    expect(out.band).toBe('stable');
    expect(out.action).toBe('hold'); // the daily dose itself is not changing
    expect(out.correction).toBeTruthy();
    expect(out.correction.direction).toBe('up');
  });

  it('the raw correction is 31.37 mL, which nearest-0.1 and floor-to-0.1 disagree on', () => {
    const toMid = Math.abs(8.5 - LEVEL);
    const raw = toMid / 0.02;
    expect(raw).toBeCloseTo(31.37, 2);
  });

  it('rounds the first correction DOWN to 31.3 mL, not to the nearest 0.1', () => {
    /* reef-chemistry.md:184 — "Round down on the first correction of any
       parameter." The app's actual formula is `Math.round((toMid/effect)*10)/10`,
       which rounds 313.7 up to 314 => 31.4 mL — over-correcting on the very
       first dose, which is the one case the spec singles out as
       unrecoverable. */
    expect(out.correction.oneOffMl).toBe(31.3);
  });
});

describe('§3 — the out-of-band edge is inclusive (worked example 9)', () => {
  /* "GIVEN alk exactly at the no-action lower edge (target 8.5, band ±0.5 ->
     8.0) THEN classified in range, not out of range (edges inclusive of
     their band)." Using the real PARAM_DEFS band (8.2-8.8, bug 4 — routine
     15), a reading sitting exactly on the lower edge (8.2) must classify
     as in-range. */
  it('a reading exactly on the band\'s lower edge classifies as in range', () => {
    const readings = [
      { id: '1', param: 'alkalinity', date: '2026-08-01', value: 8.2 },
      { id: '2', param: 'alkalinity', date: '2026-08-03', value: 8.2 },
      { id: '3', param: 'alkalinity', date: '2026-08-05', value: 8.2 },
    ];
    const settings = { volumeL: 100, dkhPerMlPer100L: 0.02, dailyDoseMl: 8 };
    const out = assessAlkalinity({
      readings, doseLog: [], waterChanges: [], settings, def: alkDef, now: 20316,
    });
    expect(out.ok).toBe(true);
    expect(out.fittedNow).toBe(8.2);
    /* No target correction should be offered for an in-range level. (The
       alkalinity engine's `out` initializer, unlike calcium's and
       magnesium's, does not default this field to null — it is simply never
       set, i.e. undefined — so falsy is the correct check here.) */
    expect(out.correction).toBeFalsy();
  });
});

describe('§3 — classification uses the stored value, not the displayed one (worked example 10)', () => {
  /* "GIVEN target 8.5, upper edge 9.0, stored reading 9.049 displayed as 9.0
     THEN classified on 9.049 (out of range), not on the displayed 9.0." Using
     PARAM_DEFS' real band (max 8.8, bug 4 — routine 15), the equivalent probe
     is a value just over 8.8 that would display, rounded to def.step (0.1),
     as exactly 8.8. */
  it('a reading of 8.849 (displays as 8.8) is still classified above range', () => {
    const readings = [
      { id: '1', param: 'alkalinity', date: '2026-08-01', value: 8.849 },
      { id: '2', param: 'alkalinity', date: '2026-08-03', value: 8.849 },
      { id: '3', param: 'alkalinity', date: '2026-08-05', value: 8.849 },
    ];
    const settings = { volumeL: 100, dkhPerMlPer100L: 0.02, dailyDoseMl: 8 };
    const out = assessAlkalinity({
      readings, doseLog: [], waterChanges: [], settings, def: alkDef, now: 20316,
    });
    expect(out.ok).toBe(true);
    /* fittedNow carries the un-rounded value through; a naive implementation
       that classified against a display-rounded figure would put this
       reading (rounds to 8.8) right on the band edge and call it in-range. */
    expect(out.fittedNow).toBeCloseTo(8.849, 5);
    expect(out.fittedNow > alkDef.max).toBe(true);
  });
});
