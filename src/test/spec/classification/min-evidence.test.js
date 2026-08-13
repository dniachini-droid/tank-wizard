/* Minimum evidence for a rate — §4, §8, §9
 *
 * Spec anchors:
 *   §4, lines 111-115 — "Alkalinity is tested no more often than every 2
 *     days... The app must not compute a consumption rate from readings less
 *     than 2 days apart. It says when to test next instead."
 *   §8, line 194 — "Requires at least 3 readings spanning at least 6 days."
 *   §8, line 195 — "Fewer: the app says insufficient data, shows what it
 *     has, gives no rate."
 *   §9 — the app must refuse to "Compute consumption from readings less than
 *     2 days apart" and to "Extrapolate a trend from fewer than 3 readings."
 *
 * assessDrift (drift.js) and computeRates (rate-analysis.js) both gate on
 * `rows.length < 3` — that half of §8/§9 is real and is locked in below as a
 * regression test. Neither function checks the SPAN between the first and
 * last reading, and neither rejects a pair of readings closer together than
 * 2 days — both are separate, real gaps against §8 and §4, demonstrated
 * below with spec-illegal-on-purpose fixtures (that is the point: these are
 * exactly the fixtures §4/§8 say must not produce a rate).
 */
import { describe, expect, it } from 'vitest'
import { assessDrift } from '../../../lib/analytics/drift.js'
import { computeRates } from '../../../lib/analytics/rate-analysis.js'
import { PARAM_DEFS } from '../../../lib/constants.js'

const alkDef = PARAM_DEFS.find((d) => d.key === 'alkalinity');

describe('§9 — never extrapolate a trend from fewer than 3 readings (regression lock)', () => {
  const twoReadings = [
    { id: '1', param: 'alkalinity', date: '2026-08-01', value: 8.9 },
    { id: '2', param: 'alkalinity', date: '2026-08-13', value: 8.5 },
  ];

  it('assessDrift refuses with only 2 readings', () => {
    const drift = assessDrift('alkalinity', twoReadings, 90);
    expect(drift.status).toBe('insufficient');
  });

  it('computeRates refuses with only 2 readings', () => {
    const rates = computeRates(alkDef, twoReadings, 90);
    expect(rates).toBeNull();
  });
});

describe('§8 line 194 — a rate requires the readings to span at least 6 days, not merely number 3', () => {
  // Spec-illegal fixture on purpose: 3 readings, correctly 2 days apart
  // (§4-legal individually), but spanning only 4 days in total — short of
  // §8's 6-day minimum.
  const threeReadingsShortSpan = [
    { id: '1', param: 'alkalinity', date: '2026-08-09', value: 8.8 },
    { id: '2', param: 'alkalinity', date: '2026-08-11', value: 8.6 },
    { id: '3', param: 'alkalinity', date: '2026-08-13', value: 8.4 },
  ];

  it('precondition: the span really is under 6 days', () => {
    // 08-09 to 08-13 is 4 days.
    expect(threeReadingsShortSpan[2].date).toBe('2026-08-13');
    expect(threeReadingsShortSpan[0].date).toBe('2026-08-09');
  });

  it('assessDrift must not report a usable rate ("ok") from a 4-day span', () => {
    const drift = assessDrift('alkalinity', threeReadingsShortSpan, 90);
    expect(drift.status).toBe('insufficient');
  });

  it('computeRates must not report a weekly drift figure from a 4-day span', () => {
    const rates = computeRates(alkDef, threeReadingsShortSpan, 90);
    // Spec: with less than 6 days of span, this is insufficient evidence for
    // a rate, weekly or otherwise.
    expect(rates === null || rates.weekly === null).toBe(true);
  });
});

describe('§4 / §9 — must not compute a rate across a pair of readings less than 2 days apart', () => {
  // Spec-illegal fixture on purpose: 3 readings spanning 12 days overall
  // (§8-legal), but two of them are only 1 day apart — the exact case §4
  // forbids using for a consumption computation.
  const readingsWithCloseePair = [
    { id: '1', param: 'alkalinity', date: '2026-08-01', value: 9.0 },
    { id: '2', param: 'alkalinity', date: '2026-08-02', value: 8.8 }, // 1 day after #1
    { id: '3', param: 'alkalinity', date: '2026-08-13', value: 8.0 },
  ];

  it('precondition: two of the three readings are only 1 day apart', () => {
    expect(readingsWithCloseePair[0].date).toBe('2026-08-01');
    expect(readingsWithCloseePair[1].date).toBe('2026-08-02');
  });

  it('assessDrift must not produce a confident rate ("ok") when a sub-2-day pair is in the series', () => {
    const drift = assessDrift('alkalinity', readingsWithCloseePair, 90);
    // Spec (§4/§9): a consumption rate must not be computed from readings
    // less than 2 days apart. The regression here silently blends the
    // 1-day-apart pair in with the rest.
    expect(drift.status).not.toBe('ok');
  });
});
