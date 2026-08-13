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

### manual-dose-auditor — complete
6 findings appended to .agent/findings.md (4xS1, 1xS2, 1xS3).
Headline: DoseChangeSheet.jsx (the wizard's manual-override sheet) has NO §6
rail check at all — never passed effectPerMl/rail constants, Save fires
unconditionally for any value >= 0, no confirmation step. Direct §2 violation.
The correct warning pattern already exists elsewhere (ErrorBoundary.jsx
a.rateLimited block) but isn't reused here. Also S1: Setup.jsx's separate
"Dosing" card dose editor has zero validation (accepts negative doses, no
rail check); no manual override anywhere persists both recommended+entered
values (doseLog only stores {date,time,ml,element,note}), so history can't
distinguish an override from an accepted recommendation; and a second,
independent correction calculator (lib/analytics/correction.js) disagrees
with the shared SAFE_DAILY_RISE rate constant by 4x for magnesium (100 vs 25
ppm/day), and both differ from reef-chemistry.md §6 canon in different
directions. Positive: feedback loop correctly uses actual-dosed amounts, not
stored recommendations; no evidence of override contaminating targets.

### terminology-auditor — complete
7 findings appended (2xS1, 4xS2, 1xS3, 1xS4).
Headline: lib/findings.js's SAFE_BOUNDS renders the explicitly forbidden words
"dangerously low/high" and a wizard state literally named "emergency" — on
all three parity surfaces (wizard: dosing/state.js:198-199, test log
confirmation: ReadingConfirmation.jsx:50-53,150-155, dashboard:
findings.js:201,247). Cross-confirms band-classifier-auditor: since
classifyReading doesn't exist, SAFE_BOUNDS has become the de facto
unauthorized second band classifier. Also: "safe"/"optimal"/"healthier"
leaking via CONSISTENCY_RULES[...].why (time-in-range.js); "net volume" vs
"water volume" vs "tank volume" used inconsistently, sometimes both in one
message (findings.js:362-363) — flagged as needing a spec-challenge since
§5 says "water volume" but reef-chemistry.md tests enforce "net volume";
ICP confirmation popup shows bare element values with no unit ever
(IcpConfirmation.jsx); chart axis/tooltip in ZoomableChart.jsx never carries
a unit.

### message-consistency-auditor — complete
6 findings appended (4xS1, 1xS2, 1xS3).
Headline: ReadingConfirmation.jsx:74-78 shows headline "In range, correction
still running" immediately followed by remaining-ppm/days-left text — an
in-band badge paired with active-correction language, on the very first
in-band reading after a correction plan starts, reachable via
App.jsx:1014-1020. Systemic pattern: every genuine insufficient-data refusal
from the three dosing engines (alkalinity.js/calcium.js/helpers.js) renders
as a calm "Hold"/"No change"/"needs another reading" in the same neutral
tone as a real recommendation, across 3 surfaces (AlkAssessmentBlock,
DoseElementCard, state.js doseStatus) — and on 2 of 3 surfaces the refusal
reason is replaced with wrong generic wording even when the actual problem
is a missing Setup field no amount of testing fixes. Also S2: pH "running
high" threshold disagrees between Insights narrative (>8.4) and Dashboard
claim feed (>8.45) for the same reading.
