run: 2026-08-14-consistency-sweep
routine: routines/05-consistency-sweep.md
started: 2026-08-14T (scheduled fire)
status: in-progress
last completed step: Wave A complete (all 6 auditors reported, findings appended + pushed; 1 new S1, 8 new S2, 3 new S3; all priors reconfirmed unchanged)
next step: Wave B — dose-parity-checker (writes under tests/parity/ only), then Wave C contradiction-hunter, then Wave D
in-flight: Wave B — dose-parity-checker (if this run dies mid-Wave-B: check tests/parity/ for uncommitted test files; run npx vitest run tests/parity — commit if green-or-documented-failure pattern, revert if broken)
branch: claude/2026-08-14-consistency-sweep
uncommitted work: yes (this file)

carried forward, not this run's scope:
  durability piece three (TW-D11, keys to IndexedDB) — not started, see
  .agent/log/2026-08-14-durability-remainder.md for the resume notes.
