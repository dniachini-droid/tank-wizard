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
 * This test renders the REAL `ReefConsole` exported by App.jsx (the same
 * export src/test/defects/seed-data.test.js already renders end to end) and
 * drives two real dose changes through the actual dosing-wizard UI — it does
 * not reimplement App.jsx's key expression anywhere. A prior version of this
 * file defined its own `Harness` component that hardcoded the same key
 * expression App.jsx uses; that passed even with App.jsx's fix fully
 * reverted (proven by the integrator gate, see .agent/log/2026-08-13-build-1
 * .md) because it never touched App.jsx's code at all. This version was
 * confirmed, by the same revert-and-rerun method, to fail without the fix
 * and pass with it — see the fixer's report for the literal commands.
 *
 * Two different elements (alkalinity, then calcium) are used for the two
 * dose changes rather than the same element twice: assessAlkalinity/
 * assessCalcium both refuse a second recommendation for the same element
 * until enough time and readings have passed since the last change
 * (ALK_EARLY_HOURS gating in the real engine), which would hide the
 * "change the dose anyway" control on a second attempt at the same element.
 * Two independent elements each have their own dose-change history, so the
 * second one is unaffected by the first having just been recorded — while
 * still exercising the one shared `doseResult`/`DoseChangePopup` App.jsx
 * actually renders for every element.
 */
import { afterEach, describe, expect, it, vi } from 'vitest'
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import React from 'react'
import { ReefConsole } from '../../../App.jsx'
import { lsSet } from '../../../lib/storage.js'
import { DEFAULT_SETTINGS } from '../../../lib/analytics/water-changes.js'

afterEach(() => {
  vi.useRealTimers();
});

async function advanceSeconds(n) {
  for (let i = 0; i < n; i++) {
    await act(async () => { await vi.advanceTimersByTimeAsync(1000); });
  }
}

/* Navigates to an element's dosing panel and opens its "record a dose"
 * sheet, returning the Record button ready to click. Done entirely under
 * real timers — findByRole's internal polling does not advance fake ones —
 * so any caller that needs a fake-timers-controlled countdown must switch to
 * fake timers itself, AFTER this resolves and BEFORE clicking the button it
 * returns (DoseChangePopup's own phase-transition timers are scheduled by
 * the click handler, so they must be scheduled under the same timer
 * implementation that will later advance them). */
async function openDoseSheet(elementLabel) {
  fireEvent.click(screen.getAllByText(/^Dosing$/i)[0]);
  await waitFor(() => expect(screen.queryAllByText(new RegExp(`^${elementLabel}$`, 'i')).length)
    .toBeGreaterThan(0));
  fireEvent.click(screen.getAllByText(new RegExp(`^${elementLabel}$`, 'i'))[0]);

  const openBtn = await screen.findByRole('button', { name: /change the dose anyway|set the dose/i });
  fireEvent.click(openBtn);
  return screen.findByRole('button', { name: /record/i });
}

describe('DoseChangePopup — remounts on a new result instead of reusing a stale countdown (adjudicated #9)', () => {
  it('shows a fresh 14s countdown for a second dose confirmation that arrives right after the first auto-dismissed', async () => {
    window.localStorage.clear();
    delete window.storage;

    // A stable, in-band, flat-trend tank — deliberately unremarkable, so the
    // dosing wizard's "change the dose anyway" manual-override control (which
    // is available for any non-implausible assessment, not just "increase"/
    // "decrease") is what triggers the dose change, not an actual correction.
    const DAY = 86400000;
    const now = Date.now();
    const daysAgo = (n) => new Date(now - n * DAY).toISOString().slice(0, 10);
    const settings = {
      ...DEFAULT_SETTINGS,
      volumeL: 300,
      dailyDoseMl: 15, dkhPerMlPer100L: 0.0533,
      calciumDoseMl: 12, caPpmPerMlPer100L: 0.36,
      magDoseMl: 10, mgPpmPerMlPer100L: 0.024,
    };
    lsSet('historical-seeded', true);
    lsSet('icp-seeded', true);
    lsSet('wc-seeded', true);
    lsSet('light-seeded', true);
    lsSet('strengths-fixed-v1', true);
    lsSet('tank-settings', settings);
    lsSet('dose-log', []);
    lsSet('readings', [
      { id: 'a1', param: 'alkalinity', value: 9.0, date: daysAgo(6) },
      { id: 'a2', param: 'alkalinity', value: 9.0, date: daysAgo(3) },
      { id: 'c1', param: 'calcium', value: 425, date: daysAgo(6) },
      { id: 'c2', param: 'calcium', value: 425, date: daysAgo(3) },
    ]);

    render(React.createElement(ReefConsole));
    await waitFor(() => expect(screen.queryAllByText(/^Dosing$/i).length).toBeGreaterThan(0),
      { timeout: 5000 });

    // --- First dose: alkalinity. Record it, let its popup run its full
    // 14-second countdown and auto-close, exactly the sequence the bug needs. ---
    const recordBtn1 = await openDoseSheet('Alkalinity');

    vi.useFakeTimers();
    await act(async () => { fireEvent.click(recordBtn1); });
    // phase reaches 2 (the "Recorded" screen, with the countdown) at 900ms.
    await act(async () => { await vi.advanceTimersByTimeAsync(900); });
    expect(screen.getByText(/Closes in 14s/i)).toBeInTheDocument();

    // Run the countdown out — 14 ticks plus margin — so it auto-closes.
    await advanceSeconds(16);
    expect(screen.queryByText(/Closes in/i)).not.toBeInTheDocument();
    vi.useRealTimers();

    // --- Second dose: calcium, recorded immediately after. Before the fix,
    // App.jsx reused the same DoseChangePopup instance across doseResult
    // changes, so its `left` state was still 0 from the expired first
    // countdown — the countdown effect fired onClose() immediately and the
    // second popup was never actually seen (confirmed directly: reverting
    // App.jsx's key and rerunning this exact test, the "Closes in"/
    // "Recorded" text for calcium never appears at all). With the fix,
    // App.jsx's key={doseResult.at} forces a fresh mount, resetting `left`
    // to 14 for the new result. ---
    const recordBtn2 = await openDoseSheet('Calcium');

    vi.useFakeTimers();
    await act(async () => { fireEvent.click(recordBtn2); });
    await act(async () => { await vi.advanceTimersByTimeAsync(900); });
    expect(screen.getByText(/Calcium · from/i)).toBeInTheDocument();
    expect(screen.getByText(/Closes in 14s/i)).toBeInTheDocument();
  }, 30000);
});
