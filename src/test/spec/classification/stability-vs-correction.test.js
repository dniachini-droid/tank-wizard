/* Stability beats optimality — §3, lines 102-105
 *
 * Spec anchor: docs/spec/reef-chemistry.md §3, lines 102-105 — "Universal
 *   rule regardless of chosen targets: stability at a slightly sub-optimal
 *   number beats movement toward an optimal one. If a value sits outside the
 *   user's target but the series is stable, the app suggests reconsidering
 *   the target before suggesting a correction."
 *
 * computeControl (reading-meaning.js) is the in-scope function that grades
 * both "where" a series sits (medianInside) and "how tightly held" it is
 * (consistency), and produces a distinct "steady-off" verdict exactly for
 * the case the spec describes. This file locks that behaviour in as a
 * regression test, and separately confirms the contrast case: a series that
 * is both outside its band AND unstable must NOT get the "reconsider your
 * target" treatment — that message is only correct when the reading is
 * genuinely parked, not while it is still moving.
 */
import { describe, expect, it } from 'vitest'
import { computeControl } from '../../../lib/analytics/reading-meaning.js'
import { PARAM_DEFS } from '../../../lib/constants.js'

// Spec-legal alk band: target 8.5 ± 0.5 (§3).
const def = { ...PARAM_DEFS.find((d) => d.key === 'alkalinity'), min: 8.0, max: 9.0 };

describe('§3 — a value parked outside the band, but held steady, gets a "reconsider the target" verdict, not a correction push', () => {
  // Five readings, 2 days apart (§4), tightly clustered at 7.60-7.62 —
  // comfortably below the 8.0-9.0 band, and essentially not moving.
  const steadyOff = [
    { id: '1', param: 'alkalinity', date: '2026-08-05', value: 7.60 },
    { id: '2', param: 'alkalinity', date: '2026-08-07', value: 7.61 },
    { id: '3', param: 'alkalinity', date: '2026-08-09', value: 7.60 },
    { id: '4', param: 'alkalinity', date: '2026-08-11', value: 7.62 },
    { id: '5', param: 'alkalinity', date: '2026-08-13', value: 7.61 },
  ];

  it('precondition: the series is genuinely outside the band', () => {
    const control = computeControl(def, steadyOff, 90);
    expect(control.medianInside).toBe(false);
  });

  it('verdict is "steady-off", not a correction-pushing verdict like "drifting" or "sliding"', () => {
    const control = computeControl(def, steadyOff, 90);
    expect(control.verdict).toBe('steady-off');
  });

  it('the note reconsiders the target rather than pushing a correction', () => {
    const control = computeControl(def, steadyOff, 90);
    expect(control.note.toLowerCase()).toMatch(/target/);
  });
});

describe('§3 contrast — a value outside the band that is still moving must NOT get the "reconsider target" treatment', () => {
  // Same band, same rough location, but oscillating hard (2 dKH spread) —
  // this is instability, not a settled sub-optimal number, so the spec's
  // stability exception does not apply.
  const outsideAndUnstable = [
    { id: '1', param: 'alkalinity', date: '2026-08-05', value: 6.5 },
    { id: '2', param: 'alkalinity', date: '2026-08-07', value: 8.5 },
    { id: '3', param: 'alkalinity', date: '2026-08-09', value: 6.6 },
    { id: '4', param: 'alkalinity', date: '2026-08-11', value: 8.4 },
    { id: '5', param: 'alkalinity', date: '2026-08-13', value: 6.7 },
  ];

  it('precondition: this series is not tightly held (consistency is not "tight")', () => {
    const control = computeControl(def, outsideAndUnstable, 90);
    expect(control.consistency).not.toBe('tight');
  });

  it('verdict is not "steady-off" — an unstable series is not offered the retarget suggestion', () => {
    const control = computeControl(def, outsideAndUnstable, 90);
    expect(control.verdict).not.toBe('steady-off');
  });

  it('no target-reconsideration is suggested for an unstable series', () => {
    const control = computeControl(def, outsideAndUnstable, 90);
    expect(control.suggestWorth).toBe(false);
  });
});
