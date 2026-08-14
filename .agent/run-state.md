run: 2026-08-14-durability-remainder
routine: routines/16-durability-remainder.md (PR #30)
started: 2026-08-14T11:30:00Z
status: piece two complete

pieces:
  routine file — done, PR #30 (claude/routines-durability-remainder-a6u43v)
  piece one, wipe detection (TW-D5) — done, PR #31
    (claude/durability-wipe-detection, branched from the routine branch).
    Test-first, 6 of 10 red before the fix. verify green, vitest 62/323.
  piece two, automatic backup (TW-D12) — done on
    claude/durability-automatic-backup, branched from piece one's branch.
    Test-first (12 red on missing module), verify green, vitest 62/335.
    PR number in the log once opened.
  piece three, keys to IndexedDB (TW-D11) — not started. Branch from piece
    two's branch. Read the routine's piece-three section first: the drain
    interaction (migrate from readLocal's answer, remove BOTH prefixes only
    after a confirmed write) and the shared DB_VERSION (now 3; bump to 4 in
    src/lib/idb.js, add the store to STORES there, nowhere else).

notes for resume:
  - npm ci before anything; a fresh clone fails verify at `vite: not found`.
  - Baselines: verify green (advisory deadcode 3 + csscheck 3), vitest
    62/313 pre-work, 62/323 after piece one, 62/335 after piece two.
  - PR stacking: the GitHub API here refuses a non-default base (422), so
    all PRs target main and stacking is by branch parentage, said in each
    PR body. Merge order: #30, then #31, then piece two's, then three's.
  - blockdup ceiling 10, tree at exactly 10 — watch new duplication.
  - The wipe-detection test helper imports DB_VERSION from idb.js; keep it
    that way when bumping for piece three.
