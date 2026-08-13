/* Calcification coupling — §5, §1, worked examples 3, 4, 7
 *
 * Spec anchor: docs/spec/reef-chemistry.md §1, line 33 — the single universal
 *   constant: "Ca:alk consumption ratio: 7.15 ppm Ca per 1.0 dKH." Changing
 *   it "without an [approved][chem] item is an S1 defect" (line 29).
 *
 * §5, lines 126-136 —
 *   "If measured alk consumption implies a calcium draw the user's calcium
 *    dosing does not cover, calcium is drifting down. The app surfaces this
 *    BEFORE the calcium reading confirms it.
 *    If calcium falls while alkalinity is stable, calcification is NOT the
 *    cause. The app says so and does not reflexively recommend more calcium
 *    — precipitation, low magnesium, or a testing error are likelier. It
 *    points there."
 *
 * Worked example 3 (line 231-233): alk consumption 0.4 dKH/day, user's
 *   calcium dosing covers 1.5 ppm/day → implied draw 0.4 × 7.15 = 2.86
 *   ppm/day → flags a 1.36 ppm/day shortfall BEFORE the Ca reading falls.
 * Worked example 7 (line 245-247): Ca falling 8 ppm/week, alk flat within
 *   ±0.1 dKH → does NOT recommend more calcium; surfaces precipitation,
 *   magnesium and test error as likelier causes.
 *
 * drift.js hardcodes CA_PER_DKH_LO = 6.4 / CA_PER_DKH_HI = 7.6 as the
 * "balanced" tolerance band — the task brief asks this to be checked against
 * the spec's single canonical 7.15 and any conflict reported.
 */
import { describe, expect, it } from 'vitest'
import {
  CA_PER_DKH_LO, CA_PER_DKH_HI, computeIonicBalance, computeDoseAdvice,
} from '../../../lib/analytics/drift.js'
import { PARAM_DEFS } from '../../../lib/constants.js'
import { DEFAULT_SETTINGS } from '../../../lib/analytics/water-changes.js'

describe('§1 universal constant — Ca:alk ratio is 7.15 ppm Ca per dKH', () => {
  it('CA_PER_DKH_LO/HI, the tolerance band used for the "balanced" verdict, is centred on 7.15', () => {
    // The spec gives one ratio, not a range. Whatever tolerance the code
    // wraps around it, its centre must be the canonical constant, or the
    // "balanced" verdict is being judged against a different number than the
    // one §1 fixes as an S1-protected constant.
    const centre = (CA_PER_DKH_LO + CA_PER_DKH_HI) / 2;
    expect(centre).toBeCloseTo(7.15, 2);
  });

  it('7.15 itself falls inside the "balanced" band the code accepts', () => {
    // Weaker sanity check: whatever the band is, it should at least include
    // the canonical ratio.
    expect(CA_PER_DKH_LO).toBeLessThanOrEqual(7.15);
    expect(CA_PER_DKH_HI).toBeGreaterThanOrEqual(7.15);
  });
});

describe('§5 / worked example 3 — flagging a calcium shortfall implied by alk consumption, before Ca readings confirm it', () => {
  /* Alk readings only: consumption is real and readable (0.4ish dKH/day),
   * but there is deliberately no calcium reading history at all — this is
   * exactly the situation worked example 3 describes ("BEFORE the Ca reading
   * confirms it"). Spec-legal: 2 alk readings 12 days apart (§4, ≥2 days).
   */
  const readings = [
    { id: 'a1', param: 'alkalinity', date: '2026-08-01', value: 8.9 },
    { id: 'a2', param: 'alkalinity', date: '2026-08-13', value: 8.5 },
  ];
  const settings = { ...DEFAULT_SETTINGS, volumeL: 100 };

  it('precondition: there is genuinely no calcium reading in this fixture', () => {
    expect(readings.filter((r) => r.param === 'calcium').length).toBe(0);
  });

  it('computeIonicBalance still surfaces the implied calcium shortfall from alk consumption alone', () => {
    // Spec requires this to be flagged BEFORE any Ca reading exists. The only
    // in-scope function for this reasoning is computeIonicBalance, which
    // requires `ca.length >= 2` internally before it will return anything —
    // structurally it cannot do what worked example 3 requires.
    const result = computeIonicBalance(readings, settings);
    expect(result).not.toBeNull();
  });
});

describe('§5 / worked example 7 — Ca falling while alk is flat: not calcification, and magnesium must be named', () => {
  /* Alk exactly flat (two identical readings, "within ±0.1 dKH" trivially
   * satisfied), calcium falling hard enough that the implied ratio is well
   * outside the balanced band. Spec-legal: alk 12 days apart (§4); calcium
   * likewise 12 days apart, 2 readings (minimum for a slope, §8 in spirit —
   * this function does not gate on 3 readings, see min-evidence tests).
   */
  const readings = [
    { id: 'a1', param: 'alkalinity', date: '2026-08-01', value: 8.5 },
    { id: 'a2', param: 'alkalinity', date: '2026-08-13', value: 8.5 },
    { id: 'c1', param: 'calcium', date: '2026-08-01', value: 450 },
    { id: 'c2', param: 'calcium', date: '2026-08-13', value: 428 },
  ];
  const settings = { ...DEFAULT_SETTINGS, volumeL: 100 };

  it('precondition: the ratio is well outside the balanced band (ca-heavy) — this scenario actually exercises the diagnosis', () => {
    const result = computeIonicBalance(readings, settings);
    expect(result).not.toBeNull();
    expect(result.status).toBe('ok');
    expect(result.verdict).toBe('ca-heavy');
    expect(result.ratio).toBeGreaterThan(CA_PER_DKH_HI);
  });

  it('does not reflexively recommend dosing more calcium', () => {
    const result = computeIonicBalance(readings, settings);
    expect(result.note.toLowerCase()).not.toMatch(/dose more calcium|increase.*calcium dose|raise.*calcium dose/);
  });

  it('names magnesium as one of the likelier causes, per §5 line 134', () => {
    const result = computeIonicBalance(readings, settings);
    expect(result.note.toLowerCase()).toMatch(/magnesium/);
  });

  it('names precipitation as one of the likelier causes, per §5 line 134', () => {
    const result = computeIonicBalance(readings, settings);
    expect(result.note.toLowerCase()).toMatch(/precipitat/);
  });
});

describe('§5 magnesium gate — computeDoseAdvice must not recommend calcium correction while magnesium is below alert-low', () => {
  /* Same shape as worked example 4, applied to calcium rather than
   * alkalinity, since §5/§9 name both: "does not recommend alk or calcium
   * corrections until magnesium is addressed."
   */
  const readings = [
    { id: 'c1', param: 'calcium', date: '2026-08-01', value: 450 },
    { id: 'c2', param: 'calcium', date: '2026-08-07', value: 436 },
    { id: 'c3', param: 'calcium', date: '2026-08-13', value: 428 },
    { id: 'm1', param: 'magnesium', date: '2026-08-01', value: 1180 },
    { id: 'm2', param: 'magnesium', date: '2026-08-07', value: 1160 },
    { id: 'm3', param: 'magnesium', date: '2026-08-13', value: 1140 },
  ];
  const settings = { ...DEFAULT_SETTINGS, volumeL: 100 };

  it('precondition: taken alone, the calcium engine would call for a dose adjustment', () => {
    const out = computeDoseAdvice(readings, [], PARAM_DEFS, null, settings);
    expect(out.advice.calcium.status).toBe('adjust');
  });

  it('with magnesium below its alert-low (1140 < 1150), calcium correction must be deferred', () => {
    const out = computeDoseAdvice(readings, [], PARAM_DEFS, null, settings);
    expect(out.advice.calcium.status).not.toBe('adjust');
  });
});
