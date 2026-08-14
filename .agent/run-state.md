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

<!-- 2026-08-14, appended by the position-is-last-reading change (log:
     .agent/log/2026-08-14-position-last-reading.md). Deliberately NOT written
     as a new `run:` header, for the reason the phosphate-band note below
     already gives: routine 15's record is what this file's header is. This was
     an owner decision delivered directly by Dan, implemented in session, not a
     routine.

     What it produced, on branch claude/position-last-reading-d3s0pj:
     (1) reef-chemistry.md §26 — position is always the last reading. Written
     under Dan's explicit authorisation for the spec edit, which is the only
     reason an agent touched docs/spec (AGENTS.md #1).
     (2) The implementation: `inRange`/`above`/`below`, `nearEdge` and
     `clearlyOut` in all three engines, plus doseStatus's two position tests,
     all now read the last reading. No threshold moved. doseStatus's "dose
     right, level off" card removed as provably unreachable once both branches
     use one measure. Test: src/test/defects/position-is-last-reading.test.js,
     17 assertions, all 17 confirmed red against git archive HEAD.
     (3) golden fbac65244f00ac9b -> 83780c1728b67ca6, 172 of 5,940 rows,
     audited by element and direction — 0 rows move the dose away from the band
     its last reading is on.
     (4) needs-dan item 3 CLOSED (superseded, with its residue stated: the 12%
     dose-gap trigger is untouched). Two new open items filed rather than fixed:
     item 4 (the one-off correction is still sized from the fitted value — a
     dose figure, 39 further golden rows if moved) and item 5
     (caClearlyOut/clearlyOut compare a ppm distance against a ppm/week rate).

     Nothing here changes routine 15's state or its composed PRs. This branch
     was cut from `main`, which carries bugs 1-7. -->
