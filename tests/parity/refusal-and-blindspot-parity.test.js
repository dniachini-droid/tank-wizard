/* §2 parity — refusal + reason, and inputs one engine uses that another
 * silently ignores for what §2 calls "identical inputs."
 *
 * Covers four of the task's required fixtures:
 *   - net volume unset
 *   - first-ever reading, no history
 *   - readings less than 2 days apart
 *   - a reading immediately after a recorded kit change
 *
 * The first two are POSITIVE findings: assessAlkalinity/assessCalcium/
 * assessMagnesium genuinely agree, at stored-string precision, both on
 * *whether* to refuse and on *why* — because all three share the same
 * `missingDoseInputs` helper (src/lib/dosing/helpers.js) for the volume
 * case, and the same "No {element} readings yet." template for the
 * first-ever case. Recorded here as passing parity tests precisely so a
 * future change to one engine's wording, without the others, is caught.
 *
 * The second two are violations: assessAlkalinity has no concept of a
 * minimum reading interval (reef-chemistry.md §4/§9, already covered for
 * computeConsumption by src/test/spec/analytics/cadence-two-day-gap.test.js)
 * and no concept of a kit change at all — unlike the calibration/findings
 * engine, which reasons about both.
 */
import { describe, expect, it } from 'vitest'
import { assessAlkalinity } from '../../src/lib/dosing/alkalinity.js'
import { assessCalcium } from '../../src/lib/dosing/calcium.js'
import { assessMagnesium } from '../../src/lib/dosing/helpers.js'
import { alkDef, caDef, mgDef, noVolumeSettings, baseSettings } from './fixtures.js'

function runAll(readingsByParam, settings) {
  const alk = assessAlkalinity({ readings: readingsByParam.alkalinity, doseLog: [], waterChanges: [], settings, def: alkDef, now: null });
  const ca = assessCalcium({ readings: readingsByParam.calcium, doseLog: [], waterChanges: [], settings, def: caDef, now: null });
  const mg = assessMagnesium({ readings: readingsByParam.magnesium, doseLog: [], waterChanges: [], settings, def: mgDef, now: null });
  return { alk, ca, mg };
}

describe('§2 refusal + reason parity — net volume unset', () => {
  const readingsByParam = {
    alkalinity: [{ id: '1', param: 'alkalinity', date: '2026-08-01', value: 9.0 }],
    calcium: [{ id: '1', param: 'calcium', date: '2026-08-01', value: 420 }],
    magnesium: [{ id: '1', param: 'magnesium', date: '2026-08-01', value: 1300 }],
  };

  it('all three engines refuse (ok: false)', () => {
    const { alk, ca, mg } = runAll(readingsByParam, noVolumeSettings);
    expect(alk.ok).toBe(false);
    expect(ca.ok).toBe(false);
    expect(mg.ok).toBe(false);
  });

  it('all three refusal reasons are the same sentence, byte-for-byte, differing only in the phrase naming which solution strength is also involved', () => {
    const { alk, ca, mg } = runAll(readingsByParam, noVolumeSettings);
    const stem = "Set your tank's net volume in Setup before this can be calculated.";
    expect(alk.reason.startsWith(stem)).toBe(true);
    expect(ca.reason.startsWith(stem)).toBe(true);
    expect(mg.reason.startsWith(stem)).toBe(true);
    // The "will not assume one" tail is identical too — genuine parity, not
    // just a shared prefix.
    const tail = 'the app will not assume one.';
    expect(alk.reason.endsWith(tail)).toBe(true);
    expect(ca.reason.endsWith(tail)).toBe(true);
    expect(mg.reason.endsWith(tail)).toBe(true);
  });
});

describe('§2 refusal + reason parity — first-ever reading, no history', () => {
  it('all three engines name their own element in an otherwise-identical refusal template', () => {
    const { alk, ca, mg } = runAll({ alkalinity: [], calcium: [], magnesium: [] }, baseSettings);
    expect(alk.ok).toBe(false);
    expect(ca.ok).toBe(false);
    expect(mg.ok).toBe(false);
    expect(alk.reason).toBe('No alkalinity readings yet.');
    expect(ca.reason).toBe('No calcium readings yet.');
    expect(mg.reason).toBe('No magnesium readings yet.');
  });
});

describe('SPEC VIOLATION (§4/§9, S2) — readings less than 2 days apart: assessAlkalinity computes a "hold" verdict instead of refusing', () => {
  // Two alkalinity readings ~23 hours apart — the exact worked example 5
  // shape reef-chemistry.md §4/§9 and
  // src/test/spec/analytics/cadence-two-day-gap.test.js are both built
  // around ("Alkalinity is tested no more often than every 2 days... The
  // app must not compute a consumption rate from readings less than 2 days
  // apart. It says when to test next instead."), driven here through the
  // actual wizard engine (assessAlkalinity) rather than computeConsumption.
  const readings = [
    { id: 'r1', param: 'alkalinity', date: '2026-08-12', time: '08:00', value: 9.0 },
    { id: 'r2', param: 'alkalinity', date: '2026-08-13', time: '07:00', value: 8.9 },
  ];

  it('§4/§9 requires assessAlkalinity to refuse (not compute a confident consumption-derived dose) for two readings under 2 days apart', () => {
    const out = assessAlkalinity({ readings, doseLog: [], waterChanges: [], settings: baseSettings, def: alkDef, now: null });
    expect(out.ok).toBe(false);
  });

  it('confirms what assessAlkalinity does instead: proceeds to a confident "hold" verdict, ok: true, with a consumption/maintenance-dose figure computed from the ~23h gap, and no mention anywhere of the 2-day minimum', () => {
    const out = assessAlkalinity({ readings, doseLog: [], waterChanges: [], settings: baseSettings, def: alkDef, now: null });
    expect(out.ok).toBe(true);
    expect(out.action).toBe('hold');
    // The consumption/maintenance-dose arithmetic ran to completion on a
    // sub-2-day gap — exactly what §4/§9 forbids computing at all.
    expect(out.consumption).not.toBeNull();
    expect(out.maintenanceDose).not.toBeNull();
    expect(JSON.stringify(out)).not.toMatch(/2.?day.?min/i);
  });
});

describe('SPEC VIOLATION (§2 parity, S2) — a reading immediately after a recorded kit change is invisible to assessAlkalinity', () => {
  // Three steady readings on the old kit, then one reading the day the kit
  // was swapped, 0.4 dKH lower — the shape of a calibration offset, not a
  // real overnight drop.
  const readings = [
    { id: '1', param: 'alkalinity', date: '2026-08-01', value: 9.0 },
    { id: '2', param: 'alkalinity', date: '2026-08-05', value: 9.0 },
    { id: '3', param: 'alkalinity', date: '2026-08-09', value: 9.0 },
    { id: '4', param: 'alkalinity', date: '2026-08-12', value: 8.6 },
  ];
  const kitChanges = { alkalinity: [{ date: '2026-08-12', kit: 'salifert' }] };

  it('assessAlkalinity produces byte-identical output whether or not a kitChanges argument naming this exact reading date is supplied', () => {
    // Not "handles it correctly or not" — literally cannot see it: the
    // function signature (src/lib/dosing/alkalinity.js:419-420) destructures
    // { readings, doseLog, waterChanges, settings, def, now, plan,
    // corrections, correctionPlans } and nothing else, so an extra
    // `kitChanges` key is silently dropped by JS destructuring.
    const withoutKitArg = assessAlkalinity({ readings, doseLog: [], waterChanges: [], settings: baseSettings, def: alkDef, now: null });
    const withKitArg = assessAlkalinity({ readings, doseLog: [], waterChanges: [], settings: baseSettings, def: alkDef, now: null, kitChanges });
    expect(withKitArg.action).toBe(withoutKitArg.action);
    expect(withKitArg.trendPerDay).toBe(withoutKitArg.trendPerDay);
    expect(withKitArg.recommendedDose).toBe(withoutKitArg.recommendedDose);
    // The 0.4 dKH step lands inside the ordinary trend arithmetic exactly as
    // if it were real tank movement, indistinguishable from consumption.
    expect(withoutKitArg.trendPerDay).toBeLessThan(0);
  });
});
