run: 2026-08-14-durability-remainder
routine: routines/16-durability-remainder.md (PR #30)
started: 2026-08-14T11:30:00Z
status: complete — all three pieces built, verified, pushed, PRs open

pieces:
  routine file — PR #30 (claude/routines-durability-remainder-a6u43v)
  piece one, wipe detection (TW-D5) — PR #31 (claude/durability-wipe-detection)
  piece two, automatic backup (TW-D12) — PR #33 (claude/durability-automatic-backup)
  piece three, keys to IndexedDB (TW-D11) — PR #36 (claude/durability-keys-to-idb)

merge order: #30 → #31 → #33 → #36. Each branch is stacked on
the previous; every PR targets main (the API refused a non-default base with
a 422, twice), so each diff shows its ancestors until the ancestor merges.

final numbers: npm run verify green on every branch tip (advisory deadcode 3
+ csscheck 3, the pre-existing baseline). vitest 62 failed / 313 -> 323 ->
335 -> 345 passed across the four commits — 32 new tests, no new failures,
the 62 spot-checked by name against the baseline list.

notes:
  - npm ci before anything; a fresh clone fails verify at `vite: not found`.
  - src/lib/idb.js owns DB_NAME/DB_VERSION (now 4). Adding a store = STORES +
    version bump there, nowhere else. Tests that open the database import
    DB_VERSION rather than hardcoding it.
  - storage-double-write / legacy-drain-wiring / seed-data run without
    IndexedDB deliberately — they are the fallback regression suite now.
