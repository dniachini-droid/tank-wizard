/* History truthfulness / manual override rules — §6 and §2
 * (surfaces-and-messaging.md):
 *
 *   §2: "A manual adjustment is recorded as a manual override, with both
 *   the recommended value and the entered value. History must show both."
 *   §6: "A manual override is shown in history as recommended-vs-dosed,
 *   always both."
 *
 * DoseChangeSheet (src/components/DoseChangeSheet.jsx) is the one place in
 * the app where a user records a dose change. It is given `recommended`
 * and `suggested` props and uses them on-screen (the "That's X mL more/less
 * than suggested" note, lines 46-52), but its `onSave` callback — the only
 * channel back to storage — is invoked as:
 *
 *     onSave(Math.round(val * 10) / 10, date, time)
 *
 * (DoseChangeSheet.jsx:63). The recommendation the sheet had on hand one
 * line above is not part of that call. This test drives the real component
 * exactly as a user would (typing an amount that differs from what was
 * recommended, then pressing Record) and inspects what actually reaches
 * the save callback.
 */
import { describe, expect, it, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import React from 'react'
import { DoseChangeSheet } from '../../../components/DoseChangeSheet.jsx'

describe('§2/§6 manual override — recommended value must travel with the dosed value into storage', () => {
  it('SPEC VIOLATION (S1): onSave only receives (ml, date, time) — the recommendation the user overrode is dropped', () => {
    const onSave = vi.fn();
    render(React.createElement(DoseChangeSheet, {
      def: { key: 'alkalinity', label: 'Alkalinity', unit: 'dKH' },
      element: 'alkalinity',
      current: 8,
      recommended: 10.0,
      suggested: 10.0,
      plan: null,
      onCancel: () => {},
      onSave,
    }));

    // The sheet starts pre-filled with the recommendation (line 17); the
    // user overrides it with a manual figure, exactly as §2 permits ("may
    // exceed the app's recommendation").
    const amountInput = screen.getByRole('spinbutton');
    fireEvent.change(amountInput, { target: { value: '15.5' } });

    fireEvent.click(screen.getByRole('button', { name: /Record/i }));

    expect(onSave).toHaveBeenCalledTimes(1);
    const args = onSave.mock.calls[0];

    // What §2/§6 requires history to be able to show: both the entered
    // value AND the recommendation it overrode.
    expect(args).toContain(15.5); // the dosed value does travel through
    expect(args).toContain(10.0); // FAILS: the recommended value (10.0) is nowhere in the callback args
  });

  it('the callback signature is exactly (ml, date, time) — three positional args, none of them the recommendation', () => {
    const onSave = vi.fn();
    render(React.createElement(DoseChangeSheet, {
      def: { key: 'alkalinity', label: 'Alkalinity', unit: 'dKH' },
      element: 'alkalinity',
      current: 8,
      recommended: 10.0,
      suggested: 10.0,
      plan: null,
      onCancel: () => {},
      onSave,
    }));
    fireEvent.click(screen.getByRole('button', { name: /Record/i }));
    expect(onSave).toHaveBeenCalledWith(10, expect.any(String), expect.any(String));
    expect(onSave.mock.calls[0]).toHaveLength(3);
  });
});
