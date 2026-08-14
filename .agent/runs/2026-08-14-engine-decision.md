run: 2026-08-14-engine-decision
routine: routines/19-engine-decision.md
started: 2026-08-14T15:20:00Z
status: complete
last completed step: full report written (parts 1-6, open questions, appendix, plain
  layer), log written
next step: none — commit, push and PR happen in the same breath as this update
in-flight: nothing
branch: claude/busy-gates-xs4f5v (harness-designated; routine's claude/<date>-engine-decision name
  overridden by the session's branch requirement — noted in the log)
uncommitted work: yes (this file)

notes for resume:
  - npm ci is required before verify/vitest on a fresh container.
  - Measured this run: verify ALL BLOCKING PASS (advisory deadcode+csscheck fail, baseline);
    vitest 62 failed / 352 passed, 30/59 files; dupcheck 67 pairs 188 fns no unexplained dup;
    blockdup 9 (ceiling 10); golden 83780c1728b67ca6 5940 rows 30 fields;
    legacy golden 37ded9064e91e80e; routine 18 report absent on every branch.
  - src/tests/docs identical to 480b086 (git diff --stat empty); only routines/ moved.
  - A partial report ships WITHOUT part six (routine rule 10).
