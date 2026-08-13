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

### history-truth-auditor — complete
5 findings appended (3xS1, 2xS4). Added 4 regression test files under
src/test/spec/history/ (target-change-immutability, dose-log-immutability,
override-visibility, timezone-dst) — verified locally: 4 tests fail
(documenting real bugs), 11 pass (positive controls / already-correct
behaviour), matches auditor's own report exactly.
Headline: no persisted classification anywhere in the app, and no
classifyReading function exists (grep confirms zero matches) — every
surface, including history itself, computes band status live from
paramStatus(def, value) using TODAY's targets (App.jsx:377-381 merges
customRanges live on every render). Editing a target in Setup silently
reclassifies every past reading of that parameter, no error, no flag, and no
recorded target-change event. This is the exact failure §6 names as the
worst-case bug. Needs a [schema]-tagged fix (persist classification + target
band in force at log time). Also confirmed: no recommended-dose field is
ever captured on manual dose-log rows (root cause shared with
manual-dose-auditor's override-recording finding); CSV export passes raw
values through unscaled (fine, but carries no classification to be faithful
to); timezone/DST handling verified correct across 3 zones.

### wizard-dose-auditor — complete
5 findings appended (2xS1, 2xS2, 1xS3).
Headline: AlkAssessmentBlock CRASHES on the two most common refusal states
(net volume/strength unset; no readings yet) — `a.current.value` read
unguarded when `a.current` is null. Reproduced live against real
assessAlkalinity output. Hits every new user on first use of the Dosing tab,
destroying the spec-required "refuse and name what's missing" message,
replacing it with a raw error card. Also S1: magnesium gate and precipitation
guard (reef-chemistry §5/§9) are structurally unreachable from the wizard —
assessAlkalinity/assessCalcium have no parameter channel for magnesium
status or sibling-element due-today status; confirmed via repo's own
currently-failing spec tests (magnesium-gate.test.js, precipitation-guard
.test.js). S2: no submit lock on Record/Start controls, stale-closure state
reads risk dropped/desynced dose-log entries on rapid double-confirm
(medium confidence, code-inspection). S2: zero component/integration tests
for the wizard itself — exactly how the S1 crash went undetected.

## Wave A complete
All 6 surface auditors reported. 36 findings total appended to
.agent/findings.md across the wave. Cross-cutting theme, confirmed
independently by band-classifier-auditor, terminology-auditor,
message-consistency-auditor, and history-truth-auditor: **`classifyReading`
does not exist anywhere in the codebase** — confirmed by direct grep
returning zero matches, cited independently by 4 of 6 auditors. This is the
single-source rule (§1) violation and outranks all other findings per
orchestrator rules. At least 8 divergent classifiers found in its place.
Proceeding to Wave B.

## Wave B — differential (dose-parity-checker)
Wrote 9 files under tests/parity/ (1 fixture module + 8 test files). Verified
locally: `npx vitest run tests/parity` → 45 tests, 38 pass, 7 intentional
documented failures (SPEC VIOLATION pattern, paired with confirms-actual-
behavior tests), zero test errors — matches auditor's own report exactly.
10 findings appended to .agent/findings.md.
Headline: `assessAlkalinity`/`assessCalcium` — the functions the real Dosing
Wizard renders (App.jsx:148-150) — have NO awareness of magnesium at all.
For the exact alert-thresholds.test.js fixture (Mg 1180→1140, below
alert-low 1150; alk falling 7.9→7.4), assessAlkalinity recommends
"increase" and never mentions magnesium, identical whether or not Mg
readings are even in the input array. Per reef-chemistry §5 the spec-correct
behavior is to defer/refuse while Mg is below alert-low — the wizard does
the opposite. This is a second, independent confirmation (via differential
testing rather than static reading) of the magnesium-gate gap
wizard-dose-auditor already flagged structurally.
Also: DoseChangeSheet has no §6 rail check (3rd independent confirmation,
after manual-dose-auditor and wizard-dose-auditor); a boundary-exact
cross-surface disagreement where doseStatus calls 6.9 dKH "Dangerously low"
(red) while readingVerdict (the popup shown the instant that reading is
logged) calls the same value "Well below band" (amber) because SAFE_BOUNDS'
emergency branch is unreachable outside an active dose-change window;
readings <2 days apart get a confident "hold" verdict from assessAlkalinity
instead of the required refusal.
Unverified (needs full React render tree, not driven this pass): DosingWizard
.jsx/Dashboard.jsx/Insights.jsx end-to-end; dedicated alerts surface (treated
buildFindings/computeDoseAdvice as proxy — no separate alerts component
found); live IndexedDB/localStorage persistence round-tripping.

## Wave C — contradiction-hunter (complete)
Built §7 matrix: 14 cells actually populated (no separate "notifications"
surface exists — no push code, only in-app reminders). 2 cells agree by
construction (safe: band across dashboard/alert-banner/history all call
paramStatus on the same object; expected-delta/days-to-target between
wizard and test-log-confirmation both read the same deriveTankState-built
correctionPlan object). 9 cells agree BY COINCIDENCE only — flagged as
their own class of finding per orchestrator brief, since they will break on
the next unrelated change. Concrete example: STATUS_COLOR.high and the
SAFE_BOUNDS emergency tone are both hex #C4285B, identical by accident
across two unrelated files, which happens to mask the severity distinction
on the high side while STATUS_COLOR.low (#926A09) exposes it on the low
side. 5 cells are already-live contradictions.
Headline (new, verified S1): ParamCard (Dashboard's primary scan tile,
DoseExpectation.jsx:219-309) shows THREE independently-computed severities
for ONE reading in ONE render, in a single ~90px card, no navigation
needed: the big number tinted mild amber via paramStatus, a dose badge
reading "Dangerously low" (red) via doseStatus's inline SAFE_BOUNDS check
(dosing/state.js:184-201), and a findings badge independently reaching red/
"dangerously low" via findings.js's own separate SAFE_BOUNDS check. Worked
example: 6.9 dKH is < def.min (8.5, triggers mild amber) and <
SAFE_BOUNDS.alkalinity.min (7, triggers urgent red) simultaneously — same
number, same instant, two different severities on screen together.
Also: ZoomableChart.jsx shades only the no-action band with no visual
representation of alert thresholds — an out-of-band point and an
alert-severity point plot identically (contradiction shape: chart shading
not matching classifier boundaries).

## Wave D step 1 — adjudicator (complete)
Independently re-verified all 40 S1/S2 findings (of 51 raw: 26 S1, 14 S2,
6 S3, 4 S4) against source, tests, and spec. Result: night's findings were
mostly real, not noise. 0 downgraded to UNCONFIRMED. Verified both test
suites match their own claims exactly (tests/parity: 45/38 pass/7 fail;
src/test/spec/history: 4 fail/11 pass) and additionally ran
src/test/spec/classification/ (cited repeatedly as evidence): 7/8 files
fail, 24/115 tests fail — matches citations.
Merged 51 raw findings → 25 distinct root-cause clusters (heaviest:
classifyReading-absence mega-cluster ~10 raw findings → 1 architectural
root cause with several independently-actionable symptoms).
One important correction found and written up: manual-dose-auditor and
dose-parity-checker both got the FIX DIRECTION backwards on the magnesium
rail-constant disagreement — correction.js's magnesium value (100) matches
reef-chemistry.md canon exactly; safe-rate.js's value (25, what the live
wizard actually uses) is the one violating canon. Appended a CORRECTION
block to .agent/findings.md so triage doesn't promote the wrong fix.
No stark two-agent contradictions found (checked specifically per brief).
Two items escalated to .agent/needs-dan.md by the orchestrator (adjudicator
had no write access): (1) the two canon spec files disagree with each other
on volume terminology ("water volume" vs "net volume") — a genuine spec
self-contradiction, not resolvable by an agent; (2) the magnesium/calcium
rail constant tension above — safe-rate.js's own code comment cites
independent real-world sourcing that may mean the spec itself needs
revisiting, a live-tank-safety chemistry-constant decision reserved for Dan.
