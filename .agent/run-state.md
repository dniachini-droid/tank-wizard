run: 2026-08-14-durability-remainder
routine: routines/16-durability-remainder.md (PR #30)
started: 2026-08-14T11:30:00Z
status: piece one complete

pieces:
  routine file — done, pushed, PR #30 (claude/routines-durability-remainder-a6u43v)
  piece one, wipe detection (TW-D5) — done on claude/durability-wipe-detection,
    branched from the routine branch. Test-first (6 of 10 red before the fix),
    verify green, vitest 62/323 against a 62/313 baseline. PR number recorded
    in the log once opened.
  piece two, automatic backup (TW-D12) — not started. Branch from piece one's
    branch. The ring's refuse-to-overwrite rule reads piece one's high-water
    marks, which is why the order matters.
  piece three, keys to IndexedDB (TW-D11) — not started. Branch from piece
    two's branch. The drain interaction analysis is in the routine §piece
    three; read it before writing anything.

notes for resume:
  - npm ci before anything; a fresh clone fails verify at `vite: not found`.
  - Baselines: verify green (advisory deadcode 3 + csscheck 3), vitest 62/313
    pre-piece-one, 62/323 after.
  - src/lib/idb.js now owns DB_NAME/DB_VERSION (2). Adding a store = add to
    STORES + bump version there, nowhere else.
  - blockdup ceiling is 10 and the tree sits exactly at it; watch for new
    incidental duplication when writing piece two's ring.
