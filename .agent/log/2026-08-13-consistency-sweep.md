# Run log — 2026-08-13-consistency-sweep (routine 5, consistency sweep)

## Setup
- Read `.agent/run-state.md`: status was `complete` from prior run. Clean start, no recovery needed.
- `npm ci`: succeeded, 527 packages, 0 vulnerabilities.
- Branch created: `claude/2026-08-13-consistency-sweep`.
- Read `AGENTS.md` and `docs/spec/surfaces-and-messaging.md` (canon for this sweep).

## Wave A — surfaces (parallel, read-only)
Dispatching: manual-dose-auditor, wizard-dose-auditor, band-classifier-auditor,
message-consistency-auditor, terminology-auditor, history-truth-auditor.

### band-classifier-auditor — complete
7 findings appended to .agent/findings.md (6xS1, 1xS3).
**Headline: `classifyReading` does not exist anywhere in the codebase.** At
least 8 independent classifiers found instead (paramStatus in lib/dates.js,
paramContext/computeControl in analytics/reading-meaning.js, readingVerdict in
ReadingConfirmation.jsx, SAFE_BOUNDS in findings.js, assessDrift/DRIFT_GUIDE in
analytics/drift.js, inline SAFE_BOUNDS in dosing/state.js, per-file min/max
checks in dosing/calcium.js + alkalinity.js + helpers.js, computeIonicBalance's
own Ca:dKH band in analytics/drift.js disagreeing with reef-chemistry §1's
7.15 constant). PARAM_DEFS (lib/constants.js) only carries flat min/max, no
target/alert-low/alert-high, so 4 of 7 spec bands are structurally
unrepresentable. Also: insufficient-data renders as green "Saved" on test-log
confirmation (S1); round-before-compare defects in drift/rate grading,
confirmed by existing failing vitest suite at src/test/spec/classification/.
This is the top-priority finding of the run per orchestrator rules (single-
source violation outranks current symptoms).
