/* §12 manual override rule — wizard-states.md:
 *
 *   "A manual adjustment may exceed the app's recommendation. It may NOT
 *    silently exceed a §6 rail — the app warns explicitly, states the rail
 *    and the overage, and requires confirmation."
 *
 * DoseChangeSheet (src/components/DoseChangeSheet.jsx) is the manual
 * adjustment surface (§2's "Manual adjustment" row: "user directly edits a
 * dose amount"). rail-exact-landing.test.js established, with a real
 * fixture, exactly what value rateLimitDose — the function every dosing
 * engine calls — would allow for a given currentDose/maintenanceDose pair
 * on a given tank (10 -> 40 mL/day maintenance, rail-clamped recommendation
 * 49.4 mL/day, even though the raw arithmetic wanted 70).
 *
 * This test drives the real DoseChangeSheet component, exactly as a user
 * would, entering a value beyond that rail (70 mL/day — the very figure the
 * engine itself refused to recommend) and inspects what the component
 * actually does: does it warn, name the rail, state the overage, and
 * require confirmation (§2), or does it silently accept it?
 */
import { describe, expect, it, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import React from 'react'
import { DoseChangeSheet } from '../../src/components/DoseChangeSheet.jsx'
import { rateLimitDose } from '../../src/lib/dosing/alkalinity.js'
import { SAFE_DAILY_RISE } from '../../src/lib/analytics/safe-rate.js'
import { railFixture, alkDef } from './fixtures.js'

describe('§2 manual override rule — DoseChangeSheet and the §6 rail', () => {
  const { settings, effect, currentDose, maintenanceDose, applied, expectedAllowed } = railFixture;

  it('precondition: the same current/maintenance dose pair really is rail-limited by the engine (from rail-exact-landing.test.js)', () => {
    const out = { currentDose, maintenanceDose };
    const result = rateLimitDose(applied, out, alkDef, settings, effect);
    expect(result.next).toBe(expectedAllowed);
    expect(out.rateLimited.wanted).toBe(70);
  });

  it('SPEC VIOLATION (§2, S1): DoseChangeSheet must warn explicitly, state the rail and the overage, and require confirmation before saving a manual dose that exceeds the §6 rail', () => {
    const onSave = vi.fn();
    render(React.createElement(DoseChangeSheet, {
      def: alkDef,
      element: 'alkalinity',
      current: currentDose,
      recommended: expectedAllowed,   // what the engine actually recommends, rail-applied
      suggested: expectedAllowed,
      plan: null,
      onCancel: () => {},
      onSave,
    }));

    // A user free-typing the un-rail-limited figure the engine itself
    // refused to recommend — exactly the scenario §2 requires the app to
    // catch: "may not silently exceed a §6 rail."
    const amountInput = screen.getByRole('spinbutton');
    fireEvent.change(amountInput, { target: { value: '70' } });

    // §2: "the app warns explicitly, states the rail and the overage, and
    // requires confirmation." This assertion is what that sentence requires
    // on screen. It fails against the current implementation, which has no
    // rail-awareness anywhere in DoseChangeSheet.jsx — the component is
    // handed `recommended`/`suggested` (already rail-applied by the caller)
    // and `current`, but never SAFE_DAILY_RISE, never `def.key`'s rail, and
    // never the un-rail-limited maintenance figure, so it has no way to
    // detect an overage even if it wanted to warn about one.
    const bodyText = document.body.textContent.toLowerCase();
    expect(bodyText).toMatch(/rail|limit|safe.?rate|exceed/);

    // §2: "...and requires confirmation." A second explicit step — not just
    // wording — must stand between "70 mL" and the save actually happening.
    const recordBtn = screen.getByRole('button', { name: /Record/i });
    fireEvent.click(recordBtn);
    expect(onSave).not.toHaveBeenCalled(); // must be gated behind confirming the overage first
  });

  it('confirms what DoseChangeSheet does instead: silently saves 70 mL/day with no rail warning and no confirmation step', () => {
    const onSave = vi.fn();
    render(React.createElement(DoseChangeSheet, {
      def: alkDef,
      element: 'alkalinity',
      current: currentDose,
      recommended: expectedAllowed,
      suggested: expectedAllowed,
      plan: null,
      onCancel: () => {},
      onSave,
    }));
    const amountInput = screen.getByRole('spinbutton');
    fireEvent.change(amountInput, { target: { value: '70' } });

    // No mention of a rail, a limit or the safe rate anywhere on the sheet —
    // only the generic "that's fine" courtesy note against `suggested`.
    const bodyText = document.body.textContent.toLowerCase();
    expect(bodyText).not.toMatch(/rail|limit|safe.?rate|confirm|exceed/);

    // Nothing gates the save: the Record button is enabled and one click
    // commits the raw, un-rail-limited figure straight through.
    const recordBtn = screen.getByRole('button', { name: /Record/i });
    expect(recordBtn).not.toBeDisabled();
    fireEvent.click(recordBtn);

    expect(onSave).toHaveBeenCalledTimes(1);
    expect(onSave).toHaveBeenCalledWith(70, expect.any(String), expect.any(String));

    // For reference: the overage against the rail the engine itself
    // enforces for the identical currentDose/maintenanceDose pair.
    const overage = Math.round((70 - expectedAllowed) * 10) / 10;
    expect(overage).toBeGreaterThan(SAFE_DAILY_RISE.alkalinity); // a real, sizeable overage — not noise
  });

  it('the courtesy "differs from suggested" note does not distinguish a trivial overage from a rail-busting one', () => {
    // A second, smaller overage that stays within the rail, to show the
    // sheet's only comparison is blind to whether the rail was crossed at
    // all — same wording either side of it.
    const onSave = vi.fn();
    render(React.createElement(DoseChangeSheet, {
      def: alkDef, element: 'alkalinity', current: currentDose,
      recommended: expectedAllowed, suggested: expectedAllowed,
      plan: null, onCancel: () => {}, onSave,
    }));
    const amountInput = screen.getByRole('spinbutton');
    // 1 mL over the recommendation — comfortably inside the rail.
    fireEvent.change(amountInput, { target: { value: String(expectedAllowed + 1) } });
    const noteWithinRail = document.body.textContent;
    expect(noteWithinRail).toMatch(/that's|fine/i);

    fireEvent.change(amountInput, { target: { value: '70' } }); // rail-busting, from the precondition above
    const noteBeyondRail = document.body.textContent;
    // Same reassurance ("that's ... fine") is shown whether the entered
    // value is 1 mL over or 20+ mL over a hobby-sourced physiological
    // ceiling — the wording carries no information about the rail at all.
    expect(noteBeyondRail).toMatch(/that's|fine/i);
  });
});
