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
