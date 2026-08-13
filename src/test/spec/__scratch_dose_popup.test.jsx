import { describe, expect, it, vi } from 'vitest'
import { act, render } from '@testing-library/react'
import { DoseChangePopup } from '../../components/DoseExpectation.jsx'

describe('scratch repro DoseChangePopup countdown', () => {
  it('second result auto-closes immediately if first already counted to 0', async () => {
    vi.useFakeTimers();
    const onClose = vi.fn();
    const def = { key: 'alkalinity', label: 'Alkalinity', unit: 'dKH', min: 8, max: 9 };
    const result1 = { def, from: 8.0, to: 8.5, date: '2026-08-13', time: '09:00', testOn: '2026-08-15', expected: 8.5, perDay: 0.25, days: 2, staged: false, target: 8.5 };
    const { rerender } = render(<DoseChangePopup result={result1} onClose={onClose} />);
    await act(async () => { await vi.advanceTimersByTimeAsync(15000); });
    expect(onClose).toHaveBeenCalledTimes(1);
    onClose.mockClear();
    const result2 = { ...result1, from: 8.5, to: 9.0 };
    await act(async () => { rerender(<DoseChangePopup result={result2} onClose={onClose} />); });
    // no additional time advanced yet -- should NOT have closed immediately
    expect(onClose).not.toHaveBeenCalled();
    vi.useRealTimers();
  });
});
