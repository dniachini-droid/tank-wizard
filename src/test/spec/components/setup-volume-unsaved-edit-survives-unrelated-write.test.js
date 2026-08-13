/* Regression test for adjudicated.md item #8 (state-auditor/S1, confirmed):
 * Setup's Volume (L) field silently reverts an unsaved edit on ANY unrelated
 * settings write.
 *
 * Root cause: Setup.jsx's local-state resync effect depended on the whole
 * `settings` object (`useEffect(() => { setVol(...); ... }, [settings,
 * elemKey])`). Any settings write elsewhere on the same screen — e.g.
 * saving a dose change, which App.jsx's addDoseChange (App.jsx:388-394)
 * implements as `saveSettings({ ...settings, [cfg.doseField]: row.ml })` —
 * produces a new settings object identity even though volumeL itself never
 * changed. The effect re-fired on that new identity and clobbered whatever
 * the user had typed into the Volume field but not yet saved, with zero
 * warning.
 *
 * Fix: the Volume field's resync now depends on `settings.volumeL` itself
 * (the value that should legitimately trigger a resync — e.g. an external
 * backup restore), not the whole `settings` object, so a write that leaves
 * volumeL untouched no longer re-fires it.
 *
 * This test mirrors App.jsx's real wiring for saveSettings/addDoseChange
 * (App.jsx:383-394) inside a small harness, matching this repo's existing
 * convention for component-level regression tests (see
 * dosing-wizard-element-switch-key.test.js, dose-change-popup-remount-key.test.js).
 */
import { describe, expect, it } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import React from 'react'

const { Setup } = await import('../../../components/Setup.jsx');
const { PARAM_DEFS } = await import('../../../lib/constants.js');
const { DOSE_ELEMENTS } = await import('../../../lib/analytics/consumption.js');

/* Mirrors App.jsx's real settings/dose-change wiring (App.jsx:383-394):
 * saveSettings replaces the settings object; addDoseChange writes the
 * changed element's dose field via saveSettings, producing a new settings
 * object identity without touching volumeL. */
function Harness() {
  const [settings, setSettings] = React.useState({
    volumeL: 70,
    dailyDoseMl: 4, dkhPerMlPer100L: 0.0533,
    calciumDoseMl: 30, caPpmPerMlPer100L: 0.3611,
    magDoseMl: 0, mgPpmPerMlPer100L: 0.024,
  });
  const [doseLog, setDoseLog] = React.useState([]);

  const onSaveSettings = async (next) => { setSettings(next); };
  const onAddDoseChange = async (row) => {
    const element = row.element || "alkalinity";
    setDoseLog((prev) => [{ id: String(prev.length), ...row, element }, ...prev]);
    const cfg = DOSE_ELEMENTS.find((e) => e.key === element);
    if (cfg) await onSaveSettings({ ...settings, [cfg.doseField]: row.ml });
  };

  return React.createElement(Setup, {
    settings, onSaveSettings, paramDefs: PARAM_DEFS, latestByParam: {}, readings: [],
    doseLog, onAddDoseChange, onDeleteDoseChange: () => {},
    waterChanges: [], icps: [], lighting: [], taskLog: [], allTasks: [],
    onAddLighting: () => {}, onDeleteLighting: () => {}, onRestored: () => {}, onPlayIntro: () => {},
    onRestoreFinding: () => {}, onRestoreAllFindings: () => {},
    customTasks: [], dismissedList: [],
  });
}

describe('Setup — Volume field keeps an unsaved edit across an unrelated settings write (adjudicated #8)', () => {
  it('does not revert a typed-but-unsaved volume when a dose change is saved', async () => {
    render(React.createElement(Harness));

    const volInput = screen.getByLabelText(/volume \(l\)/i);
    expect(volInput.value).toBe('70');

    // User types a new volume but does NOT click its own Save button.
    fireEvent.change(volInput, { target: { value: '95' } });
    expect(volInput.value).toBe('95');

    // Unrelated write on the same screen: change and save the alkalinity
    // dose, which does not touch settings.volumeL.
    const doseInput = screen.getByLabelText(/dose \(ml\/day\)/i);
    fireEvent.change(doseInput, { target: { value: '6' } });
    fireEvent.click(screen.getByRole('button', { name: /save dose change/i }));

    // The dose save must have gone through (sanity check the write happened).
    await waitFor(() => expect(screen.getByText(/dose set to 6 ml\/day/i)).toBeInTheDocument());

    // The user's unsaved volume edit must still be showing, not reverted.
    expect(volInput.value).toBe('95');
  });
});
