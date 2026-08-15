/* Backup / restore — tank-settings sanitisation on the one restore path the
 * app has (src/lib/backup.jsx, "This is the file that can [restore from]").
 *
 * AGENTS.md: "Silent data loss is the worst possible failure here — a user's
 * tank log history is irreplaceable." A backup file is not trusted input any
 * more than the manual entry field is.
 *
 * Rebased from PR #3 (13 Aug). The original file also carried a doc-test
 * expecting two same-day, time-less readings with different values to both
 * survive a restore. That expectation was overtaken by TW-033's settled
 * design (backup.jsx NATURAL_KEYS): time is part of the reading key, and a
 * row without a time must match itself or restoring an old file would
 * duplicate every row in it — so that test was dropped in the rebase, not
 * adapted.
 */
import { describe, expect, it } from 'vitest'
import { restoreBackup } from '../../../lib/backup.jsx'

function makeBackup(data) {
  return {
    format: 'dans-tank-backup',
    version: 1,
    createdAt: '2026-08-01T00:00:00Z',
    data: {
      readings: [], 'icp-tests': [], 'water-changes': [], 'dose-log': [],
      'lighting-log': [], 'task-log': [], 'tasks-custom': [], reminders: [],
      ...data,
    },
  };
}

const emptyCurrent = {
  readings: [], 'icp-tests': [], 'water-changes': [], 'dose-log': [],
  'lighting-log': [], 'task-log': [], 'tasks-custom': [],
};

describe('restoreBackup — tank-settings from a backup file are sanitised like manual entry', () => {
  it('a negative volumeL in the backup file is nulled, not written through, matching Setup.jsx\'s saveVolume convention', async () => {
    const backup = makeBackup({
      'tank-settings': { volumeL: -50, dailyDoseMl: 10, dkhPerMlPer100L: 0.05 },
    });

    const result = await restoreBackup(backup, emptyCurrent, true);

    // Setup's own manual entry path sanitises this exact field before saving
    // it (Setup.jsx:124 — `volNum > 0 ? volNum : null`). restoreBackup now
    // applies the identical convention: invalid input becomes null, the same
    // refusal shape every other volume-null site in the app already checks
    // for — not a fabricated positive fallback, which no other write path in
    // the codebase does.
    expect(result['tank-settings'].volumeL).toBeNull();
  });
});
