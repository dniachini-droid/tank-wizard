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
  - Baselines: verify green (advisory deadcode 3 + csscheck 3), vitest
    62/313 pre-work, 62/323 after piece one, 62/335 after piece two.
  - PR stacking: the GitHub API here refuses a non-default base (422), so
    all PRs target main and stacking is by branch parentage, said in each
    PR body. Merge order: #30, then #31, then piece two's, then three's.
  - blockdup ceiling 10, tree at exactly 10 — watch new duplication.
  - The wipe-detection test helper imports DB_VERSION from idb.js; keep it
    that way when bumping for piece three.
  - src/lib/idb.js owns DB_NAME/DB_VERSION (now 4). Adding a store = STORES +
    version bump there, nowhere else. Tests that open the database import
    DB_VERSION rather than hardcoding it.
  - storage-double-write / legacy-drain-wiring / seed-data run without
    IndexedDB deliberately — they are the fallback regression suite now.

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

---

run: 2026-08-14-real-history-replay
routine: routines/18-real-history-replay.md
started: 2026-08-14T12:20:00Z
status: complete
last completed step: report written (all 11 sections), log written, committed,
  pushed, PR opened: https://github.com/dniachini-droid/tank-wizard/pull/37
next step: none — Dan reviews and merges (or not). Follow-ups are filed inside
  the report, §8 (other owners) and §9 (questions for Dan).
in-flight: nothing
branch: claude/hopeful-bohr-yc58vu
uncommitted work: no

what shipped:
  .agent/real-history-replay.md          — the full report, sections 1-11
  .agent/log/2026-08-14-real-history-replay.md
  .agent/run-state.md                    — this file

nothing else in the tree moved. The replay harness lived in the session
scratchpad and dies with the session; its core loop is preserved in the
report's appendix (§10).

notes for whoever runs this next:
  - npm ci first; node_modules is empty in a fresh clone and the engine cannot
    be imported without it.
  - The engine modules cannot be imported by plain Node: src/lib/constants.js
    imports ../icons.jsx. A node --import loader that transpiles .jsx through
    the esbuild vendored with vite fixes it (report §10.1). Do not work around
    it by stubbing PARAM_DEFS.
  - The clock fake is not optional. Verify todayStr() returns the step date
    before trusting one line of output; computeStability alone flips green to
    amber on the system clock (report §8, finding O2).
  - Key everything by (param, date, value). Reading ids do not survive an
    export/restore round trip (report §1).
