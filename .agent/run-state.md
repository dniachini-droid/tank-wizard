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
