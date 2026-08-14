run: 2026-08-14-consistency-sweep
routine: routines/05-consistency-sweep.md
started: 2026-08-14T (scheduled fire)
status: in-progress
last completed step: setup (npm ci, canon read, branch created, baseline vitest 352/414 pass, 62 standing failures)
next step: collect Wave A results (6 auditors dispatched in parallel, read-only), append to findings.md, then Wave B (dose-parity-checker)
in-flight: Wave A — manual-dose-auditor, wizard-dose-auditor, band-classifier-auditor, message-consistency-auditor, terminology-auditor, history-truth-auditor (all read-only; if this run dies here, nothing needs reverting — re-dispatch Wave A)
branch: claude/2026-08-14-consistency-sweep
uncommitted work: yes (this file)

carried forward, not this run's scope:
  durability piece three (TW-D11, keys to IndexedDB) — not started, see
  .agent/log/2026-08-14-durability-remainder.md for the resume notes.
