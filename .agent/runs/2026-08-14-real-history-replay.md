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
