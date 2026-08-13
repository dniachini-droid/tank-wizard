/* Regression test for adjudicated.md item #9 (state-auditor/S2, confirmed):
 * DoseChangePopup's countdown `left` isn't reset on a new `result` — only
 * `phase` is (DoseExpectation.jsx:24-27). The countdown effect
 * (DoseExpectation.jsx:31-36) re-fires on the new `result` while `left` is
 * still 0 from the PREVIOUS popup's expired countdown, calling `onClose()`
 * immediately. A user who dismisses/lets one dose confirmation expire, then
 * triggers a second one shortly after, never sees the second popup.
 *
 * Fix: App.jsx now keys DoseChangePopup on `doseResult.at` (App.jsx:1272),
 * the same convention its three sibling popups already use
 * (LogResultPopup/IcpResultPopup/TaskDonePopup, App.jsx:1273/1276/1278) — a
 * new result forces a full remount, so `left`/`phase`/timers start fresh
 * instead of carrying over stale component state.
 *
 * This test mirrors App.jsx's actual render site (component + key
 * expression) rather than importing App.jsx wholesale, matching this repo's
 * existing convention for component-level regression tests (see
 * dosing-wizard-element-switch-key.test.js).
 */
import { afterEach, describe, expect, it, vi } from 'vitest'
import { act, render } from '@testing-library/react'
import React from 'react'

const { DoseChangePopup } = await import('../../../components/DoseExpectation.jsx');

function makeResult(overrides) {
  return {
    at: Date.now(),
    def: { key: 'alkalinity', label: 'Alkalinity', unit: ' dKH' },
    from: 4, to: 5.2, date: '2026-08-13', time: '09:00',
    testOn: '2026-08-15', days: 2, perDay: 0.3, expected: 8.9,
    staged: false, target: null,
    ...overrides,
  };
}

/* Mirrors App.jsx:1272 exactly: <DoseChangePopup key={result ? result.at : "none"} result={result} onClose={...} /> */
function Harness({ result, onClose }) {
  return React.createElement(DoseChangePopup, { key: result ? result.at : 'none', result, onClose });
}

afterEach(() => {
  vi.useRealTimers();
});

describe('DoseChangePopup — remounts on a new result instead of reusing a stale countdown (adjudicated #9)', () => {
  it('does not self-close a second popup that arrives right after the first auto-dismissed', () => {
    vi.useFakeTimers();
    const onClose = vi.fn();

    const first = makeResult({ at: 1000 });
    let rerender;
    act(() => {
      ({ rerender } = render(React.createElement(Harness, { result: first, onClose })));
    });

    // Advance past the AUTO=14s countdown (plus margin) — first popup auto-closes.
    // Each 1s tick reschedules the next setTimeout from inside the effect, so
    // advancing has to happen one tick at a time, each inside its own act(),
    // for the state update to flush and the chain to keep re-firing.
    for (let i = 0; i < 16; i++) {
      act(() => {
        vi.advanceTimersByTime(1000);
      });
    }
    expect(onClose).toHaveBeenCalledTimes(1);

    onClose.mockClear();

    // A second, different result arrives with ZERO additional time elapsed —
    // e.g. the user triggers another dose change right after dismissing the first.
    const second = makeResult({ at: 2000, to: 6.0 });
    act(() => {
      rerender(React.createElement(Harness, { result: second, onClose }));
    });

    // Before the fix: the reused component instance's `left` was still 0 from
    // the expired first countdown, so the effect fired onClose() immediately.
    expect(onClose).not.toHaveBeenCalled();
  });
});
