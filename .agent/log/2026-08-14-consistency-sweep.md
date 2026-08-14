# Run log — 2026-08-14-consistency-sweep (routine 5, consistency sweep)

## Setup
- Step zero: `.agent/run-state.md` showed the 2026-08-14-durability-remainder run
  ended cleanly at a piece boundary (pieces 1+2 merged, PRs #31/#33; piece three
  TW-D11 deliberately not started — carried forward, noted in run-state). No open
  branches, clean tree. Normal start, no recovery.
- `npm ci`: succeeded.
- Canon note: this routine's prompt cites `docs/spec/surfaces-and-messaging.md`,
  which was merged into `wizard-states.md` §11–§17 in the 14 Aug canon swap (the
  "§7 matrix" is now §17). Also in scope since yesterday's sweep: §19–§20 (Reef
  Chemistry Engine, one-notice model) and `reef-chemistry.md` §25–§26.
- Branch created: `claude/2026-08-14-consistency-sweep` from origin/main (02de5e9).
- `.agent/findings.md` was NOT empty at start: 4 untriaged blocks from
  routine-13-phase5-gate (goTo ReferenceError, onComplete ReferenceError, dead
  useMemo `preview`, dead CSS). Left in place; tonight's triage folds them in.
- Delta since the 2026-08-13 sweep, per git log: phase-6 bug fixes, durability
  pieces 1+2, position-is-last-reading (spec §26), engine-decision evidence
  (routine 19), canon swap. Yesterday's sweep findings live in backlog as
  TW-002..TW-018 — Wave A agents briefed to report fixed/unchanged/new deltas
  rather than re-report.
- Wave A agents run STRICTLY read-only and return findings as final-message text;
  the orchestrator appends to `.agent/findings.md` serially (six parallel
  appenders to one file risk clobbering each other's blocks).
- Baseline `npx vitest run` (pre-sweep, main @ 02de5e9): 59 files (29 pass /
  30 fail), 414 tests (352 pass / 62 fail). The 62 failures are the standing
  documented-defect baseline (same 62 as the durability run's "62/335", suite
  since grown to 414). Full output: scratchpad/vitest-baseline.txt.
- Stale-fetch note: at step zero `origin/main` locally showed bb70fce (pre canon
  swap); `git fetch origin main` brought it to 02de5e9 = HEAD. Sweep branch cut
  from the true main.

## Wave A — surfaces (parallel, read-only)
Dispatched: manual-dose-auditor, wizard-dose-auditor, band-classifier-auditor,
message-consistency-auditor, terminology-auditor, history-truth-auditor.
All briefed: read-only, verify prior backlog items (fixed/unchanged/changed)
rather than re-report, full blocks only for new/changed findings, findings
returned to orchestrator for serial append to findings.md.

### history-truth-auditor — complete (1st to report)
Priors: TW-013 unchanged (history suite still 4 fail / 11 pass, identical
failures), TW-014 unchanged. Durability code reviewed: idb.js/auto-backup.js
never touch readings/dose-log; restore merges rows additively — good.
NEW S1: snapshot restore unconditionally overwrites `custom-ranges`
(backup.jsx:170-172) → restoring a daily snapshot silently reclassifies all
history against that day's targets, while Setup.jsx:722-728 tells the user
"nothing was overwritten". Second door to TW-013's failure mode. Appended to
findings.md. 3xS1 total (2 unchanged priors + 1 new).

### manual-dose-auditor — complete (2nd)
Priors TW-004/TW-012/TW-014 all UNCHANGED (verified live: parity rail test and
both history tests still fail identically; TW-012 shown to reach a third
control, Setup's "Save dose change"). NEW: S2 — rate-rails.test.js still
asserts the pre-14-Aug rail canon (Ca 25/Mg 100) as "canon verbatim", red in
tree, citing a spec section that no longer exists; the dangerous direction is
someone "fixing" the code to match it (would reintroduce the 4x magnesium
rail). S3 — §3's "user may tighten a rail" has no implementation anywhere;
flagged for triage that §21 (facts-not-judgements) may put the spec in
self-tension → candidate needs-dan. Appended. Run total so far: 3xS1, 1xS2,
1xS3.
