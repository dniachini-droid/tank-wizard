/* Backup / restore — untested area (no existing tests reference
 * restoreBackup/inspectBackup/buildBackup anywhere in the repo before this
 * file). Attacked here as "Data: corrupt storage value" and "a reading
 * entered twice... on the same day", per the audit brief.
 *
 * AGENTS.md: "Silent data loss is the worst possible failure here — a user's
 * tank log history is irreplaceable." restoreBackup is the one restore path
 * the app has (src/lib/backup.jsx:13-23, "This is the file that can [restore
 * from]"), and its own UI copy (Setup.jsx:596) promises: "Restoring adds
 * anything missing and leaves what you already have alone, so nothing is
 * overwritten or duplicated."
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

describe('restoreBackup — a second genuine same-day reading for the same parameter is silently dropped', () => {
  it('BUG: two DIFFERENT alkalinity readings on the same day (e.g. a retest) merge into one, losing real data', async () => {
    const current = {
      ...emptyCurrent,
      readings: [{ id: 'r1', param: 'alkalinity', date: '2026-08-01', value: 8.2 }],
    };
    // A genuinely different second test, same param, same day — the natural
    // key restoreBackup uses is `${param}|${date}` (backup.jsx:114), which
    // cannot tell this apart from a duplicate of the reading already logged.
    const backup = makeBackup({
      readings: [{ id: 'r2', param: 'alkalinity', date: '2026-08-01', value: 6.9 }],
    });

    const result = await restoreBackup(backup, current, false);

    // What the restore UI promises: "adds anything missing". A second, real
    // reading with a different value is not a duplicate of the first, and
    // should be added rather than discarded.
    expect(result.readings).toHaveLength(2);
    expect(result.readings.some((r) => r.value === 6.9)).toBe(true);
  });
});

describe('restoreBackup — tank-settings from a backup file are sanitised like manual entry', () => {
  it('a negative volumeL in the backup file is nulled, not written through, matching Setup.jsx\'s saveVolume convention', async () => {
    const backup = makeBackup({
      'tank-settings': { volumeL: -50, dailyDoseMl: 10, dkhPerMlPer100L: 0.05 },
    });

    const result = await restoreBackup(backup, emptyCurrent, true);

    // Setup's own manual entry path sanitises this exact field before saving
    // it (Setup.jsx:77 — `volNum > 0 ? volNum : null`). restoreBackup.jsx now
    // applies the identical convention (backup.jsx:155-158): invalid input
    // becomes null, the same refusal shape every other volume-null site in
    // the app already checks for — not a fabricated positive fallback, which
    // no other write path in the codebase does.
    expect(result['tank-settings'].volumeL).toBeNull();
  });
});
