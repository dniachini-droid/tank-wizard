/* §19/§26 — StabilityStrip forms its own opinion about the band, and it can
 * disagree with every other position-classifying surface about the same
 * parameter, on the same screen, for the same tank state.
 *
 * §19 (decided 14 Aug): "one engine assesses every parameter... No surface
 * forms its own opinion", and names "the parameter graph panel" explicitly
 * among the surfaces this covers. §26 (decided 14 Aug): "position is always
 * the last reading... never a fitted or projected value... History is for
 * trend... It is never used to assert where the level is now."
 *
 * StabilityStrip (src/components/TodayPanel.jsx:298, rendered on the Today
 * panel for every parameter, and again inside Briefing at TodayPanel.jsx:568)
 * computes its own in/out-of-band test to choose its colour:
 *
 *   const outside = stab.p05 < def.min || stab.p95 > def.max;
 *
 * `stab.p05`/`stab.p95` are the 5th/95th percentile of a WINDOW of recent
 * readings (src/lib/stability-engine.js, `computeStability`) — a spread
 * statistic, not the last reading. Nothing else in the app answers "is this
 * parameter in band" this way; `paramStatus` (src/lib/dates.js), the classifier
 * every other in/out-of-band surface in this parity suite ultimately traces
 * back to, answers strictly from the single value it is given.
 *
 * Two things are pinned here:
 *   1. (informational, currently true) when the recent window is a single
 *      degenerate point — no spread at all — the two happen to agree, because
 *      p05 == p95 == the last reading. Worth pinning precisely because it is
 *      a coincidence of the degenerate case, not a designed guarantee.
 *   2. (SPEC VIOLATION) the moment the window has real spread, the two can
 *      disagree about the identical last reading, live, reproduced against
 *      the real component and the real stability engine — matching the
 *      band-classifier-auditor's S2 finding (2026-08-14, "StabilityStrip …
 *      a thirteenth independent classifier") with an executable fixture.
 */
import { describe, expect, it } from 'vitest'
import { render } from '@testing-library/react'
import React from 'react'
import { StabilityStrip } from '../../src/components/TodayPanel.jsx'
import { PARAM_DEFS } from '../../src/lib/constants.js'
import { paramStatus, addDaysFromToday } from '../../src/lib/dates.js'
import { computeStability } from '../../src/lib/stability-engine.js'

const alkDef = PARAM_DEFS.find((d) => d.key === 'alkalinity');

/* def.color is the "in band" colour; "#A2621B" (TodayPanel.jsx:331) is the
 * hardcoded "outside" colour StabilityStrip falls back to. Reading the
 * rendered style is the only externally observable trace of its internal
 * `outside` boolean — there is no prop or return value to inspect instead. */
const stripColor = (def, readings) => {
  const { container } = render(React.createElement(StabilityStrip, { def, readings }));
  const span = container.querySelector('.strip-span');
  return span ? span.style.background : null;
};

/* jsdom normalises inline `background` styles to `rgb(r, g, b)` regardless of
 * whether the source was a hex literal — compare colours in that form rather
 * than as hex strings, so this test is checking the actual computed colour,
 * not fighting jsdom's own serialisation. */
const rgb = (hex) => {
  const n = hex.replace('#', '');
  const r = parseInt(n.slice(0, 2), 16), g = parseInt(n.slice(2, 4), 16), b = parseInt(n.slice(4, 6), 16);
  return `rgb(${r}, ${g}, ${b})`;
};

describe('agreement-by-coincidence pin — a degenerate (no-spread) window', () => {
  it('two identical in-band readings: StabilityStrip colours the span the band colour, matching paramStatus\'s "ok" verdict for the same value', () => {
    const v = (alkDef.min + alkDef.max) / 2;
    const readings = [
      { param: 'alkalinity', date: addDaysFromToday(-2), value: v },
      { param: 'alkalinity', date: addDaysFromToday(-1), value: v },
    ];
    expect(paramStatus(alkDef, v)).toBe('ok');
    // With p05 === p95 === v (no spread at all), `outside` reduces exactly to
    // paramStatus's own inequality — this is why the two agree here, and
    // only here.
    const stab = computeStability(alkDef, readings);
    expect(stab.p05).toBe(v);
    expect(stab.p95).toBe(v);
    expect(stripColor(alkDef, readings)).toBe(rgb(alkDef.color));
  });

  it('two identical below-band readings: StabilityStrip colours the span "outside", matching paramStatus\'s "low" verdict for the same value', () => {
    const v = alkDef.min - 0.3;
    const readings = [
      { param: 'alkalinity', date: addDaysFromToday(-2), value: v },
      { param: 'alkalinity', date: addDaysFromToday(-1), value: v },
    ];
    expect(paramStatus(alkDef, v)).toBe('low');
    expect(stripColor(alkDef, readings)).toBe(rgb('#A2621B'));
  });
});

describe('SPEC VIOLATION (§19/§26): StabilityStrip disagrees with the last-reading position for the identical current state', () => {
  const readings = [
    { param: 'alkalinity', date: addDaysFromToday(-12), value: 7.9 },  // below the band (min 8.2) -- an older excursion
    { param: 'alkalinity', date: addDaysFromToday(-9), value: 8.3 },
    { param: 'alkalinity', date: addDaysFromToday(-6), value: 8.5 },
    { param: 'alkalinity', date: addDaysFromToday(-3), value: 8.5 },
    { param: 'alkalinity', date: addDaysFromToday(-1), value: 8.5 },   // the last reading -- comfortably in band
  ];
  const lastValue = readings[readings.length - 1].value;

  it('precondition: the last reading is in band per paramStatus, and the window really does contain an out-of-band point that pulls stab.p05 below the floor', () => {
    expect(paramStatus(alkDef, lastValue)).toBe('ok');
    const stab = computeStability(alkDef, readings);
    expect(stab.p05).toBeLessThan(alkDef.min);
    expect(stab.p95).toBeLessThanOrEqual(alkDef.max);
  });

  it('§19/§26 requires StabilityStrip to render the in-band colour here — the last reading (8.5) is the position, and it is inside 8.2-8.8', () => {
    expect(stripColor(alkDef, readings)).toBe(rgb(alkDef.color));
  });

  it('confirms what StabilityStrip does instead: renders the "outside" colour (#A2621B), driven by a 12-day-old reading that is no longer the tank\'s position, while paramStatus and every last-reading-based surface in this suite say the identical current state is "ok"', () => {
    expect(stripColor(alkDef, readings)).toBe(rgb('#A2621B'));
    expect(paramStatus(alkDef, lastValue)).toBe('ok'); // the disagreement, restated: same tank, same moment, two verdicts
  });
});
