/* Reading classification — alert thresholds (§3, lines 85-98)
 *
 * Spec anchor: docs/spec/reef-chemistry.md §3, lines 85-91 —
 *   "Default alert thresholds:
 *    Alkalinity  target − 1.0 dKH  target + 1.0 dKH
 *    Calcium     target − 50 ppm   target + 50 ppm
 *    Magnesium   target − 200 ppm  target + 200 ppm"
 * and the note directly under it (lines 93-95, quoted verbatim in the task
 * brief): "Note Mg's alert band (±200) is much wider than its no-action band
 * (±50) — verify the code doesn't conflate them."
 *
 * §5, lines 138-141 — "Magnesium gate. Low magnesium destabilises both alk
 *   and calcium... If magnesium is below alert-low, the app does not
 *   recommend alk or calcium corrections until magnesium is addressed."
 * Worked example 4 (line 235-236): Mg 1140 with alert-low 1150, alk 7.4 with
 *   target 8.5 → addresses magnesium only; explicitly defers the alk
 *   correction and says why.
 *
 * A grep of the whole classification surface in scope (reading-meaning.js,
 * time-in-range.js, drift.js, safe-rate.js, rate-analysis.js, correction.js,
 * measurement-noise.js) for "alert" turns up nothing at all — no export,
 * constant, or field named alert-low/alert-high/alertThreshold anywhere.
 * This file records that as a structural gap, then tests the one behaviour
 * §5/§9 hangs off it (the magnesium gate) against the one function that
 * could plausibly implement it: computeDoseAdvice.
 */
import { describe, expect, it } from 'vitest'
import { CONSISTENCY_RULES } from '../../../lib/analytics/time-in-range.js'
import { DRIFT_GUIDE, computeDoseAdvice } from '../../../lib/analytics/drift.js'
import { CORRECTION_MAX_RATE, SAFE_DAILY_RISE } from '../../../lib/analytics/safe-rate.js'
import { PARAM_DEFS } from '../../../lib/constants.js'
import { DEFAULT_SETTINGS } from '../../../lib/analytics/water-changes.js'

describe('§3 alert thresholds — no such concept exists in the in-scope modules', () => {
  it('no exported constant anywhere in scope encodes the magnesium alert half-width of 200 ppm', () => {
    // Every magnesium-specific numeric field across the in-scope modules.
    const mgDef = PARAM_DEFS.find((d) => d.key === 'magnesium');
    const magnesiumNumbers = [
      CONSISTENCY_RULES.magnesium.tight, CONSISTENCY_RULES.magnesium.moderate,
      DRIFT_GUIDE.magnesium.perWeek,
      CORRECTION_MAX_RATE.magnesium, SAFE_DAILY_RISE.magnesium,
      mgDef.max - mgDef.min, // the only "band width" the app actually has
    ];
    // 200 (half-width) and 400 (full width) are the only numbers that could
    // represent §3's magnesium alert band. Neither appears anywhere.
    expect(magnesiumNumbers).not.toContain(200);
    expect(magnesiumNumbers).not.toContain(400);
  });

  it('CONSISTENCY_RULES.magnesium (the nearest thing to a magnesium band width in scope) is not the §3 alert width', () => {
    // CONSISTENCY_RULES grades spread/consistency, not a per-reading alert —
    // its numbers are 50/100, coincidentally equal to the *no-action* band
    // width (100) and half (50), never the alert width (400/200).
    const rule = CONSISTENCY_RULES.magnesium;
    expect(rule.tight).not.toBe(200);
    expect(rule.moderate).not.toBe(200);
    // Documents the conflation risk named in the brief directly: the only
    // magnesium band width available anywhere (PARAM_DEFS, width 150) is
    // used for every purpose — there is no wider second band for "alert".
    const mgDef = PARAM_DEFS.find((d) => d.key === 'magnesium');
    const onlyBandWidth = mgDef.max - mgDef.min;
    expect(onlyBandWidth).not.toBe(400); // the alert width §3 requires
  });
});

describe('§5/§9 magnesium gate — worked example 4', () => {
  /* Mg 1140, alert-low 1150 (i.e. target 1350 − 200, the spec's own default
   * magnesium target and alert width). Alk 7.4, target 8.5, falling fast
   * enough on its own that the alkalinity engine would normally call for a
   * dose adjustment. Per §5/§9 the app must defer that adjustment and
   * address magnesium first — never both flagged as independent corrections.
   *
   * Fixture is spec-legal: alk readings 2 days apart (§4), 4 readings
   * spanning 6 days (§8), magnesium readings 6 days apart, 3 readings
   * spanning 12 days (§8).
   */
  const readings = [
    // Alkalinity: falling from 7.9 to 7.4 over 6 days, evenly spaced.
    { id: 'a1', param: 'alkalinity', date: '2026-08-07', value: 7.9 },
    { id: 'a2', param: 'alkalinity', date: '2026-08-09', value: 7.7 },
    { id: 'a3', param: 'alkalinity', date: '2026-08-11', value: 7.5 },
    { id: 'a4', param: 'alkalinity', date: '2026-08-13', value: 7.4 },
    // Magnesium: 1180 -> 1140, below the alert-low of 1150 by the final reading.
    { id: 'm1', param: 'magnesium', date: '2026-08-01', value: 1180 },
    { id: 'm2', param: 'magnesium', date: '2026-08-07', value: 1160 },
    { id: 'm3', param: 'magnesium', date: '2026-08-13', value: 1140 },
  ];
  const settings = { ...DEFAULT_SETTINGS, volumeL: 100, dailyDoseMl: 8, magDoseMl: 8 };

  it('precondition: taken alone, the alkalinity engine would call for a dose adjustment', () => {
    // If this doesn't hold, the deferral test below proves nothing — the
    // engine might simply not have anything to defer.
    const out = computeDoseAdvice(readings, [], PARAM_DEFS, null, settings);
    expect(out.advice.alkalinity.status).toBe('adjust');
  });

  it('with magnesium below its alert-low (1140 < 1150), alk correction must be deferred, not recommended', () => {
    const out = computeDoseAdvice(readings, [], PARAM_DEFS, null, settings);
    // Spec (§9): "Recommend alk or calcium correction while magnesium is
    // below alert-low" is something the app must refuse to do.
    expect(out.advice.alkalinity.status).not.toBe('adjust');
  });

  it('the deferred alkalinity advice explains itself by naming magnesium as the reason', () => {
    const out = computeDoseAdvice(readings, [], PARAM_DEFS, null, settings);
    const asText = JSON.stringify(out.advice.alkalinity);
    expect(asText.toLowerCase()).toMatch(/magnesium/);
  });
});
