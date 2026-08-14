# Run log — routine 16, Phase 7's durability remainder

run: 2026-08-14-durability-remainder
routine: routines/16-durability-remainder.md
base: 39f370c (branch), origin/main at 180da10

## Baseline, measured before anything was written

A fresh clone has no `node_modules`. `npm run verify` on one fails at
`sh: 1: vite: not found` and takes 23 `legacy-port` checks down with it, because
`build/engines-new.cjs` is never produced. Not a code failure. `npm ci` first.

After `npm ci` (529 packages):

- `npm run verify` — ALL BLOCKING CHECKS PASSED, ~110 s, 85 s of it
  `legacy-port:sim/years`. Advisory: `deadcode` 3 findings, `csscheck` 3.
- `npx vitest run` — 62 failed / 313 passed, 56 files. The same pre-existing
  `[chem]` set as the Phase 6 baseline.

## Step 1 — the routine (PR #30)

`routines/16-durability-remainder.md`. Five things reading the code changed
against what the plan and routine 14 assert; all five are in the file and the
PR body. Shortest version: 23 keys not 20; `drainLegacyStore` runs twice per
load and that is deliberate, not a defect; the dangerous drain interaction is
across loads rather than within one; `photo-store.js`'s `DB_VERSION` is a shared
resource and opening the database at a second version would put report photos
back in localStorage for good; and the `node_modules` trap above.

## Step 2 — piece one, wipe detection, TW-D5

Test first. `src/test/defects/wipe-detection.test.jsx`, 10 cases, run against
the unmodified source before a line of the fix was written:

```
× does not seed water changes into a history it cannot account for
× says a wipe happened, and what was lost, without opening Setup
× never seeds again on this device, even once the user starts logging
× reads photos with no panels as proof of a prior install
× writes a witness so the next wipe is detectable
× does not fall when the user deletes a reading
✓ seeds the water-change history and the lighting note exactly as before
✓ does not claim a backup does or does not exist
✓ does not call it a wipe when the user emptied the tank log themselves
✓ starts, seeds as it always did, and claims nothing   (no IndexedDB)
Tests  6 failed | 4 passed (10)
```

The four that passed before the fix are the regression guards and are supposed
to: they pin what must not change. The six that failed are the defect.

Written:

- `src/lib/idb.js` — the database open, lifted out of `photo-store.js` with no
  behavioural change (same 4 s open timeout, same `onblocked` handling, same
  `{ok, value, reason}` result shape). One version constant, `DB_VERSION` 1 → 2,
  `onupgradeneeded` creating only missing stores. This is not tidying: a second
  module opening `tank-wizard` at version 2 while `photo-store.js` still asked
  for version 1 would fail its open with a `VersionError`, and photos would fall
  back to inline localStorage permanently.
- `src/lib/install-witness.js` — the witness and the verdict. `noteCount` is
  high-water only. `assessInstall` returns one of `fresh` / `known` / `wiped` /
  `suspect` and a `maySeed` flag, which is the only thing the caller acts on.
- `src/lib/storage.js` — `saveKey` records the high-water mark for any list it
  writes. It cannot make a save fail, and a device with no IndexedDB records
  nothing and carries on.
- `src/App.jsx` — the check runs before every seeding decision; the `*-seeded`
  markers are written even when seeding is declined, so declining is remembered;
  and a notice at the top of every tab says what was lost and offers restore.

Confirmed after: wipe-detection 10/10, `src/test/defects/` 128/128,
`npm run verify` ALL BLOCKING CHECKS PASSED with the advisory list back at its
baseline 3, `npx vitest run` 62 failed / 323 passed — the same 62, plus the 10
new ones passing.

### What piece one does not do

Notices a wipe; does not prevent one, does not survive a full clear, does not
recover anything, and does not act on a partial loss (one key going missing
while the rest survive). The last is visible in principle from the high-water
marks and is deliberately not acted on.

## Step 3 — piece two, automatic backup, TW-D12

PR for piece one: #31 (base `main`; the API refused the routine branch as a
base twice with a 422 on `base`, so stacking is by branch parentage and noted
in each PR body). Routine PR: #30.

Test first. `src/test/defects/automatic-backup.test.js`, 12 cases, red before
`src/lib/auto-backup.js` existed (import failure — the same shape of red the
photo suite started from). All 12 green after.

Written:

- `src/lib/auto-backup.js` — the ring (7, prunes oldest, refuses
  empty-over-good), the handle (persist, query/request permission split so
  `requestPermission` only ever runs from a tap), the share sheet (never
  writes `last-backup`), and `maybeAutoBackup` (daily cadence, skips a
  wiped/suspect device entirely — on those the current state is the thing
  that must NOT be preserved).
- `src/lib/idb.js` — `DB_VERSION` 2 → 3, stores `backup-ring` + `backup-meta`.
- `src/App.jsx` — schedule runs once loaded and again on visibilitychange →
  hidden, with piece one's verdict as the `suspectWipe` input.
- `src/components/Setup.jsx` — share button (feature-detected), the file
  handle chooser / re-grant button, and the snapshot list with per-row
  restore through `restoreBackup`. The ring is described as an undo history
  in as many words.

The version bump caught `wipe-detection.test.jsx`'s raw-IndexedDB helper
opening the shared database at a hardcoded 2 — the exact `VersionError` trap
the routine's piece-three section warns about, demonstrated a piece early.
The helper now imports `DB_VERSION`; no assertion changed.

Confirmed: automatic-backup 12/12, `src/test/defects/` 140/140,
`npm run verify` ALL BLOCKING CHECKS PASSED, advisory deadcode back at its
baseline 3, `npx vitest run` 62 failed / 335 passed (baseline 62/323 after
piece one — the 12 new tests, no new failures).

### What piece two does not do

The ring dies with the origin. The handle does not exist off Chromium and
cannot tell a synced folder from a local one. The share sheet needs a tap and
cannot confirm a save. The only copy that survives losing the phone is still
a file somewhere else — the module header and the PR both say so.

## Step 4 — piece three, the remaining keys to IndexedDB, TW-D11

PR for piece two: #33. Branch: claude/durability-keys-to-idb, from piece two's.

Test first. `src/test/defects/keys-in-idb.test.js`, 10 cases, 7 red against
the unmodified source for the right reasons (values not in IndexedDB,
localStorage not emptied); the 3 green on both sides are the fallback-contract
regression guards.

Written, all inside `src/lib/storage.js` plus the version bump:

- Values live in a `keyvalue` store as JSON strings — byte-for-byte what
  localStorage held. Read order: IndexedDB, then the drain-aware localStorage
  chain. A localStorage-only key migrates through `saveKey` on first load; a
  key that cannot be written stays where it works and retries next load.
- A confirmed IndexedDB write removes BOTH prefixes for the key and clears it
  from `undrained` — rule (d) from the routine, pinned by the quota-blocked-
  drain test: legacy value ends in IndexedDB, nothing left to resurrect,
  second drain reports {0,0,0}.
- Migration takes `readLocal`'s answer (legacy-preferring for undrained
  keys) — rule (c); migrating the mirror would have made the TW-032 loss
  permanent.
- The no-IndexedDB fallback announces once, through the same gate as the
  photo fallback — one banner per degraded device.
- `DB_VERSION` 3 → 4.

Knock-on, named in the PR: with working IndexedDB a full localStorage can no
longer fail a save — the save lands in IndexedDB. The "storage is full"
message is reachable only when both stores refuse.

Test reconciliation — 14 collisions, all in the two files that install
IndexedDB, all the same class (the row store's address moved; every pinned
property survives), each commented in place:

- `icp-photos-in-idb.test.js`: row-location assertions read the KV store via
  a `storedRows()` helper; the photo-location checks got STRONGER
  (localStorage now holds nothing for the key). Two scenario updates: the
  "storage full" message tests break IndexedDB first (the failure is
  otherwise unreachable, which is the point of the move), and the
  missing-photo test deletes the one photo rather than wiping the whole
  database (a whole-database wipe now takes the claiming row with the photo).
- `wipe-detection.test.jsx`: the clean-install seed assertion reads through
  `loadKey`.
- Untouched and passing as the fallback regression suite (they run without
  IndexedDB): `storage-double-write.test.js`, `legacy-drain-wiring.test.jsx`,
  `seed-data.test.js`, `backup-absence-claim.test.js`,
  `correction-plans-not-backed-up.test.js`.

Confirmed: keys-in-idb 10/10, `src/test/defects/` 150/150, `npm run verify`
ALL BLOCKING CHECKS PASSED (advisory deadcode 3 + csscheck 3, the baseline),
`npx vitest run` 62 failed / 345 passed — the same 62 files/names
spot-checked against the baseline list, the 10 new tests, no new failures.

### What piece three does not do

IndexedDB is evicted by the same clears and the same seven-day rule as
localStorage — this is room (the 5 MB ceiling gone) and transactional writes,
not durability. It does not make a wipe recoverable (pieces one and two). The
migration is one-way: a device that migrates and then runs an older build
reads an empty localStorage — accepted, per the routine, because the
alternative recreates the double write ee64a23 removed; the ring holds a
pre-migration copy on the daily cadence.

## Routine complete

All three pieces built, each test-first, each verified, each its own PR.
