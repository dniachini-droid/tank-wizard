/* Spec conformance — §4 minimum testing cadence for consumption maths
 *
 * Spec anchor: docs/spec/reef-chemistry.md §4, lines 111-115 —
 *   "Alkalinity is tested no more often than every 2 days. This is the
 *   design assumption for all consumption maths... The app must not compute
 *   a consumption rate from readings less than 2 days apart. It says when to
 *   test next instead."
 *
 * §9, line 208 — the app must refuse to "Compute consumption from readings
 * less than 2 days apart."
 *
 * §10 worked example 5 (reef-chemistry.md:238-239), verbatim:
 *   "GIVEN two alk readings 1 day apart THEN no consumption rate; states the
 *   2-day minimum; says when to test next."
 */
import { describe, expect, it } from 'vitest'
import { assessAlkalinity } from '../../../lib/dosing/alkalinity.js'

const alkDef = { key: 'alkalinity', label: 'Alkalinity', unit: 'dKH', min: 8.5, max: 9.5, step: 0.1 };

describe('§4/§9 — no consumption rate from readings less than 2 days apart (worked example 5)', () => {
  /* Two alkalinity readings, exactly one day apart, showing a real (and
     large) movement — the shape that most tempts an engine into treating a
     1-day gap as a valid trend window. */
  const readings = [
    { id: '1', param: 'alkalinity', date: '2026-08-01', value: 8.5 },
    { id: '2', param: 'alkalinity', date: '2026-08-02', value: 8.0 },
  ];
  const settings = { volumeL: 100, dkhPerMlPer100L: 0.02, dailyDoseMl: 8 };
  const out = assessAlkalinity({
    readings, doseLog: [], waterChanges: [], settings, def: alkDef, now: 20302,
  });

  it('the engine did not, per spec, compute a trend from this pair — but it does', () => {
    /* Spec-correct: §4 forbids computing a consumption rate at all from a
       1-day gap, regardless of how large the apparent movement is. The
       engine should report insufficient cadence and a next-test date instead
       of a numeric trend. */
    expect(out.trendPerDay).toBeNull();
  });

  it('does not silently turn a 1-day pair into an actionable dose change', () => {
    /* Because trendPerDay above is NOT null, the engine proceeds all the way
       through to a real recommendation: alkalinity at 8.0 is below the 8.5
       floor and "falling", which qualifies as a rescue case that bypasses
       the short-span safety check the engine does have (that check is
       explicitly skipped for a "big move", which this is). The result is an
       actionable, non-hold dose change computed entirely from one 24-hour
       gap. */
    expect(out.ok).toBe(false);
  });

  it('states the 2-day minimum, as the worked example requires', () => {
    const text = (out.reason || '') + (out.explanation || '') + (out.nextCheck || '');
    expect(text).toMatch(/2 day/i);
  });
});
