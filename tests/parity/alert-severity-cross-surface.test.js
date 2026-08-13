/* §2/§3/§4 parity — alert severity for the identical reading, across surfaces
 *
 * §3 boundary rule: "A value exactly equal to alert-low is `alert-low`."
 * (Comparisons happen at stored precision, never display precision.)
 *
 * §2: "...all three surfaces must produce the same numbers and the same
 * classification." §4: "A message must never contradict the classification
 * it accompanies" and "No message expresses urgency the band does not
 * justify" — which cuts both ways: a surface that plainly under-states the
 * urgency another surface assigns the identical reading is exactly the kind
 * of disagreement §2 exists to catch, because the user has no way to know
 * which screen to believe.
 *
 * Two independent findings, both driven from real function calls with an
 * identical `a` (dosing-engine result) / `latestByParam` fixture — no
 * assumptions about internals, only observed return values:
 *
 *  1. doseStatus (src/lib/dosing/state.js) — which the Dosing Wizard tile
 *     and dashboard both render — treats the SAFE_BOUNDS alert-low boundary
 *     with a strict "<" comparison (state.js:191:
 *     `nowVal < bounds.min`), so a reading of exactly 7.0 dKH (SAFE_BOUNDS.
 *     alkalinity.min) is NOT "emergency" while 6.99 is — violating §3's own
 *     inclusive-boundary rule.
 *
 *  2. For the same tank state and the same clearly-dangerous reading
 *     (6.9 dKH, no dose change in progress, no correction plan running),
 *     doseStatus calls it "Dangerously low" in red (#C4285B) while
 *     readingVerdict (src/components/ReadingConfirmation.jsx) — the popup
 *     shown the moment that exact reading is logged — calls it merely
 *     "Well below band" in amber (#A2621B) and suggests a re-test, never
 *     using the word "dangerous" at all. The SAFE_BOUNDS emergency branch in
 *     readingVerdict exists (line ~45) but is gated behind
 *     `ds.doseChangedDaysAgo != null` (line 124), so it is unreachable
 *     whenever there is no dose change in flight — precisely the ordinary
 *     case this fixture represents.
 */
import { describe, expect, it } from 'vitest'
import { doseStatus } from '../../src/lib/dosing/state.js'
import { readingVerdict } from '../../src/components/ReadingConfirmation.jsx'
import { paramStatus } from '../../src/lib/dates.js'
import { alkDef, baseSettings } from './fixtures.js'

// A stable, unremarkable assessment: no active dose change, no correction
// plan, dose matching consumption — the ordinary case a user is in most of
// the time, not an edge case invented to dodge some other branch.
function assessmentAt(value) {
  return {
    ok: true, action: 'hold', currentDose: 10, effectPerMl: 0.05,
    current: { value, date: '2026-08-13' },
    band: 'stable', trendPerDay: 0,
    correctionPlan: null, correctionInProgress: null, activePlan: null,
    fittedNow: value, lastDoseChangeAt: null,
  };
}

function doseStatusAt(value) {
  const latestByParam = { alkalinity: { param: 'alkalinity', date: '2026-08-13', value } };
  return doseStatus(assessmentAt(value), alkDef, '2026-08-13', baseSettings, latestByParam, [], []);
}

function readingVerdictAt(value, ds) {
  const status = paramStatus(alkDef, value);
  return readingVerdict(alkDef, { value, status, delta: 0, prev: value, doseState: ds });
}

describe('SPEC VIOLATION (§3 boundary rule, S2): doseStatus does not treat the alert-low boundary as inclusive', () => {
  it('a fraction below the boundary (6.99, SAFE_BOUNDS.alkalinity.min = 7) is correctly "emergency"', () => {
    const ds = doseStatusAt(6.99);
    expect(ds.state).toBe('emergency');
    expect(ds.short).toBe('Dangerously low');
  });

  it('exactly on the boundary (7.0) must also be "emergency" per §3 ("a value exactly equal to alert-low is alert-low")', () => {
    const ds = doseStatusAt(7.0);
    expect(ds.state).toBe('emergency');
  });

  it('confirms what doseStatus does instead at exactly 7.0: falls through to the calm "off-target" state, not "emergency"', () => {
    const ds = doseStatusAt(7.0);
    expect(ds.state).toBe('off-target');
    expect(ds.short).toBe('Steady, below range');
    expect(ds.tone).not.toBe('#C4285B'); // not the emergency red
  });
});

describe('SPEC VIOLATION (§2/§4, S1): the identical reading gets a materially different alert severity on the Dosing Wizard tile vs the test-log confirmation popup', () => {
  const value = 6.9; // unambiguously below SAFE_BOUNDS.alkalinity.min (7), not a boundary edge case

  it('precondition: doseStatus (Dosing Wizard tile / dashboard) treats 6.9 dKH as a dangerous emergency', () => {
    const ds = doseStatusAt(value);
    expect(ds.state).toBe('emergency');
    expect(ds.short).toBe('Dangerously low');
    expect(ds.headline.toLowerCase()).toMatch(/dangerously low/);
  });

  it('per §2, readingVerdict must classify the identical reading with the same severity the Dosing Wizard assigns it', () => {
    const ds = doseStatusAt(value);
    const v = readingVerdictAt(value, ds);
    // What the Dosing Wizard already says about this exact number: it is
    // dangerous, not merely "well below band" with a suggestion to re-test.
    expect(v.headline.toLowerCase()).toMatch(/dangerous/);
  });

  it('confirms what readingVerdict shows instead: "Well below band", no mention of danger, and a re-test suggestion — a calmer message than the Dosing Wizard gives for the same number', () => {
    const ds = doseStatusAt(value);
    const v = readingVerdictAt(value, ds);
    expect(v.headline).toBe('Well below band');
    expect(v.headline.toLowerCase()).not.toMatch(/dangerous/);
    expect(v.tone).not.toBe('#C4285B'); // amber (#A2621B), not the emergency red doseStatus used
    expect(v.tone).toBe('#A2621B');
  });
});
