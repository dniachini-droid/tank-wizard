id: TW-D12
title: Backup was entirely manual — a file the user had to remember to make
status: done
tags: [schema]
order: 600

why: `buildBackup`, `downloadJson`, `inspectBackup` and `restoreBackup` all existed
and were well built (routine 14 §3.1), and nothing called any of them without a tap
on the Setup tab. Roughly 80% of the system was done; the missing 20% was the
scheduling and the destinations.
fix, three parts (`src/lib/auto-backup.js`), each carrying what it does NOT protect
against, because none is a complete answer:
  - a snapshot ring: the last 7 `buildBackup()` outputs in IndexedDB, written at
    most daily and when the app is backgrounded. A ring, not a slot — and it
    refuses the write that would rot it: a snapshot that collapsed to nothing does
    not go over one that held data, and the schedule skips entirely on a device
    piece one judged wiped. Restores through `restoreBackup`, so it merges by
    natural key and is idempotent. Described in the UI as an undo history — it
    lives in the same origin as the data it copies and dies with it.
  - a File System Access handle: `showSaveFilePicker()` once from a tap, the
    handle persisted, the same file rewritten on the daily cadence. Chromium-only —
    no Safari, no Firefox, therefore no iOS — and it cannot tell a synced folder
    from a local one; a lapsed permission degrades to a "needs a tap" button.
  - the share sheet: `navigator.share` with the backup as a file, one tap to
    Files/iCloud Drive on the platform where the handle does not exist. Never
    automatic (browser policy), and never recorded as a backup — the sheet reports
    dismissal and success identically in practice, so `last-backup` is not written
    on a share, or it would sometimes claim a copy that was cancelled.
rejected again, same grounds as routine 14 §3.3: periodic programmatic
auto-download.
honest baseline, in the module header and the PR: the only copy that survives
losing the phone is a file the user has put somewhere else. This makes that far
more likely; it does not make it certain.
also here: `DB_VERSION` 2 -> 3 (`src/lib/idb.js`, stores `backup-ring` and
`backup-meta`) — and the bump caught piece one's test helper opening the shared
database at a hardcoded 2, the exact `VersionError` trap the routine warns about.
The helper now imports the constant; the assertion it serves is unchanged.
repro: `src/test/defects/automatic-backup.test.js`, 12 cases — the ring prunes at
7, refuses the empty-over-good write, accepts empty-on-empty, restores
idempotently; the handle round-trips and a lapsed permission never reaches
`createWritable`; a cancelled share writes no record; the schedule is daily, skips
a wiped device, and is a no-op without IndexedDB while the manual path still
works. Red before the module existed, as the photo suite was.
authorised by `THE-PLAN-v3.md` §PHASE 7 (Dan, 2026-08-14) — AGENTS.md rule 5's
`[schema]` item, filed with the work.
owner: implementer — routine 16, piece two
