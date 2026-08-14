/* The backup panel asserts a fact the app cannot know.
 *
 * `last-backup` is an ordinary storage key. It is written when the user saves
 * a backup file (src/components/Setup.jsx) and it lives in the same
 * localStorage as everything else — so when a browser clears its storage,
 * the record of the backup is erased along with the data it was protecting.
 *
 * The panel reads that absence as proof:
 *
 *     backupAge == null
 *       ? `You haven't saved a backup yet. ...`
 *
 * Which means that after a wipe — the one moment when restoring a file would
 * actually save the user's history — the app tells them they never made one.
 * A user who has a perfectly good backup sitting in iCloud Drive is told, by
 * the only screen that could have helped, that there is nothing to recover.
 *
 * The app does not know whether a backup exists. It knows only that this
 * device holds no record of one. The message must say that, and must point at
 * restore rather than away from it.
 *
 * This is not wipe detection — that is a larger job (an install marker, a
 * high-water record count) and is deliberately not attempted here. This is
 * only the removal of a false claim.
 */
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import React from 'react'
import { Setup } from '../../components/Setup.jsx'
import { saveKey } from '../../lib/storage.js'
import { DEFAULT_SETTINGS } from '../../lib/analytics/water-changes.js'
import { PARAM_DEFS } from '../../lib/constants.js'

const settle = () => new Promise((r) => setTimeout(r, 60));

function renderSetup() {
  return render(React.createElement(Setup, {
    settings: DEFAULT_SETTINGS,
    onSaveSettings: vi.fn(),
    paramDefs: PARAM_DEFS,
    latestByParam: {},
    readings: [],
    onAddDoseChange: vi.fn(), onDeleteDoseChange: vi.fn(),
    onAddLighting: vi.fn(), onDeleteLighting: vi.fn(),
    onRestored: vi.fn(), onPlayIntro: vi.fn(),
    onRestoreFinding: vi.fn(), onRestoreAllFindings: vi.fn(),
  }));
}

beforeEach(() => { window.localStorage.clear(); });

describe('backup panel with no last-backup record', () => {
  it('DEFECT: claims no backup was ever saved, which the app has no way of knowing', async () => {
    renderSetup();
    await settle();

    // FAILS before the fix. This is the exact sentence shown to someone whose
    // browser has just cleared storage, at the moment a restore would work.
    expect(document.body.textContent).not.toMatch(/you\s?have\s?n['’]?t saved a backup yet/i);
  });

  it('acknowledges a backup file may exist elsewhere and points at restoring it', async () => {
    renderSetup();
    await settle();
    const text = document.body.textContent;

    // The absence must be reported as this device's missing record, not as
    // the non-existence of a backup.
    expect(text).toMatch(/no record of a backup|this device has no record/i);

    // And it must leave the door to recovery open, in some phrasing.
    expect(text).toMatch(/may still|might still|if you (have|saved|already)/i);

    // The control that acts on that advice is in the same panel.
    expect(screen.getByText(/Restore from a backup/i)).toBeInTheDocument();
  });

  it('GUARD: an existing backup record still reports its age normally', async () => {
    const twoDaysAgo = new Date(Date.now() - 2 * 86400000).toISOString();
    await saveKey('last-backup', twoDaysAgo);

    renderSetup();
    await settle();

    // The happy path is unchanged: a real record still produces a real age,
    // and does not fall into the "no record" wording.
    expect(document.body.textContent).toMatch(/2 days ago/i);
    expect(document.body.textContent).not.toMatch(/no record of a backup/i);
  });
});
