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

### message-consistency-auditor — complete (3rd)
Priors TW-008/009/010/011 all UNCHANGED at the cited lines; §20's
non-dismissible claims confirmed live at narrative-engine.js:394/457-492;
position-is-last-reading message cleanup verified clean (no orphan "dose
right, level off" text). NEW: S2 — buildOverview's whole cross-parameter
narrative (ratio commentary, burnt-tips warning, pH paragraph, weekly
priority line) computed every render, rendered nowhere; legacy had it under
"Read full assessment", the port dropped the render call. S3 — corrects
yesterday's pH-threshold finding: >8.4 vs >8.45 split is real in source but
LATENT (the >8.4 branch is in the unrendered paragraphs); becomes live the
moment S2 is fixed. Appended. Run totals: 3xS1, 2xS2, 2xS3.

### terminology-auditor — complete (4th)
Priors TW-015/016/017 UNCHANGED (TW-017 expanded: two more live "tank volume"
strings — drift.js:282, DosingWizard.jsx:258); wordingcheck confirmed still
one-file/one-function/one-field by running it (TW-028 evidence). NEW: S2
"target" = four different concepts (typed value / computed midpoint / whole
band / % in band), all reachable in one modal, plus doseStatus.target being a
concentration in most branches and a dose RATE in one; S2 reading-meaning.js
invents six categories not in §13 and its "drifting" means the OPPOSITE band
position of §13's; S2 ICP popup unit-less+no aria; S2 chart axis/tooltip
unit-less at 3 call sites; S3 the "notice" concept ships under three words
today with a fourth coming (TW-031). Appended. Run totals: 3xS1, 6xS2, 3xS3.

### band-classifier-auditor — complete (5th)
The run's two most load-bearing verifications: (1) position-is-last-reading
(§26) LANDED CLEANLY — 17/17 defect tests pass, engines + doseStatus read the
last reading, and no new fitted-vs-last split exists because every other
classifier already read raw values; (2) §19's engine decision is DOCS-ONLY —
deriveTankState still assesses only alk/Ca/Mg and every other surface still
bypasses it. Classifier census: canon says "ten", this run enumerates
THIRTEEN by file:line (new #13: StabilityStrip, TodayPanel.jsx:314 — own
band test for its colour, filed as new S2). Boundary matrix: band edges
inclusive/correct in paramStatus; alert-low edge NON-inclusive at
state.js:189-206 (7.0 exactly = off-target, not emergency — violates §13);
§13's "drifting" implemented by NOTHING (reading-meaning's "drifting" is the
opposite meaning). TW-005/007/010 unchanged with fresh evidence. Appended.
Run totals: 3xS1, 7xS2, 3xS3.

### wizard-dose-auditor — complete (6th, closes Wave A)
Priors TW-003/005/009/012/006 all UNCHANGED (TW-003 re-reproduced live —
both refusal shapes still crash at ErrorBoundary.jsx:279; TW-012 widened to
the correction-start path). §26 verified from the wizard side: no new
staleness. Full branch table in findings. NEW S2, reproduced live with real
rendered components: staged-plan shortcuts share one unkeyed DoseChangeSheet
whose amount never re-syncs — tap "Step to 7.50" then "Go to 9.90" and the
field still says 7.5; the recorded dose is not the one the last tap asked
for. Appended. Run totals: 3xS1, 8xS2, 3xS3.

## Wave A complete
All six surface auditors reported. Zero prior findings fixed, zero
regressed-worse; every previously filed consistency defect reconfirmed live.
Two genuine verifications of recent work: position-is-last-reading landed
cleanly everywhere it claims to; the durability restore path merges history
rows additively. New this sweep: 1xS1 (snapshot restore overwrites targets →
silent retroactive reclassification of all history), 8xS2, 3xS3 across six
agents. Cross-cutting theme unchanged from yesterday and now sharper:
single-source rule still violated everywhere (13 named classifiers, §19
engine decision wired to nothing). Proceeding to Wave B.

## Wave B — dose-parity-checker (complete)
Baseline drift check first: parity suite was 39 pass/6 fail at start (vs 13
Aug's 38/7) — fully explained by fd82363 (magnesium rail 100→25), a real fix
whose spec assertion now passes; the 6 remaining failures verified identical
BY CONTENT to the documented violations. Added 3 permanent files (all
verified by the orchestrator's own re-run — 11 files, 61 tests, 53/8):
- dose-status-target-field-semantics.test.js — S1: doseStatus.target is
  mL/day in the MAJORITY of branches (suggested/settling/due/worked) and a
  concentration in one (emergency). Latent (no generic consumer today), now
  pinned.
- stability-strip-vs-param-status.test.js — S2: live repro of the strip
  showing its "outside" colour while the current reading is in-band on every
  other surface (spread statistic vs last reading, §26).
- position-is-last-reading-cross-engine.test.js — S3 positive: cross-engine
  guard, 3/3 pass.
Full suite 430 tests 366/64 — reconciles exactly with the 414/352/62
baseline (+16 tests, +2 documented failures). Nothing outside tests/parity/
touched (verified by exclusion runs). Committed 326605c. Proceeding to
Wave C.

## Wave C — contradiction-hunter (complete)
Matrix re-worked against unchanged app source: cell classes hold at 2
construction / 9 coincidence / 5 live; deltas are durability (two cells
gained permanent tests via Wave B; ParamCard's three-badge triple still
UNPINNED) plus interaction-level findings between cells. NEW S1 x2, both in
the spaces between yesterday's lanes:
1. Backup/restore natural keys omit time (param|date, element|date) —
   LIVE REPRO: restore of two same-day alk readings delivers ONE row while
   the preview claims both fresh. Same for dose-log. The recovery feature
   silently deletes data AND (per Wave A) silently relabels it.
2. The `corrections` array feeds engine math (consumption disturbances,
   correction gating, findings) but renders in no history surface and no
   CSV; deleteCorrection wired to nothing.
Also: S2 AlkAssessmentBlock renders 8.4 and 7.5 as the same step in one
block (tighter TW-006 evidence); S2 "steady-off" vs in-band card reproduced
live with a realistic recovery fixture; S2 rail-violating doses forever
indistinguishable downstream (TW-004+TW-014 are ONE fix — triage directive);
S2 restore×TW-013×TW-014 compound ("why did I raise this dose" becomes
unanswerable, unflagged); S3 priority-sentence vs Briefing latent landmine.
Two new unpinned colour coincidences (phosphate=danger red, potassium=low
amber) — colour-registry gap, note for Dan. Appended. Proceeding to Wave D.

## Wave D step 1 — adjudicator (complete)
19/19 new findings CONFIRMED from scratch (own repros, own fixtures), 0
refuted, 0 downgraded — an accurate night, not just a confident one. Key
adjudications: custom-ranges overwrite verified dynamically and UPGRADED
(not gated by applySettings at all — even manual file restore overwrites
targets); rate-rails fix direction triple-checked against §3 canon (fix the
TEST — no repeat of the 13 Aug reversed-direction near-miss); the two
phase5-gate S1s in findings.md are ALREADY FIXED (704cc69, verified
root-cause fixes with passing regression tests) — flagged so triage doesn't
promote closed bugs. Clusters prescribed: backup/restore family (one root
cause, three consequences), StabilityStrip (merge two agents), reading-
meaning vocabulary family, buildOverview dead-narrative family. Escalations
for needs-dan: §3-vs-§21 rail-tightening same-day spec self-contradiction
(new), reading-meaning vocabulary registry question. Arithmetic re-verified
exact. Appended to findings.md. Proceeding to triage.

## Wave D step 2 — triage-analyst (complete)
found 35 raw blocks → merged 11 into 6 destinations / deleted 2 (the
already-fixed phase5-gate S1s, per adjudicator) / promoted 9 (TW-033..041,
priority order led by TW-036 wrong-dose-recording, then TW-033 restore
integrity) / escalated 5 to needs-dan (items 8 and 7 with full rule-10
workups; item 6 = three one-liners) / annotated 7 existing items
(TW-002/004/006/013/014/017 + TW-022/023 parked-unverified note).
findings.md emptied to header. No 15-cap holdbacks. Committed 8a577ef.

## Wave D step 3 — reporter (complete, orchestrator-corrected)
Reporter (read-only by design) returned brief text; orchestrator wrote
.agent/morning-brief.md with three corrections under the evidence rule:
item order aligned to triage's actual backlog priority (TW-036 above
TW-033), verified bundle numbers added (build pass; main 292.7 kB gzip vs
180 budget, growth 286.2→292.7 attributed via git log to durability+position
merges, not tonight), and one garbled sentence about the classifier census
rewritten. Health numbers cross-checked against orchestrator's own runs.

## Run complete
All four waves ran to completion; nothing stalled, nothing reverted. Only
tests/parity/ and .agent/ were written, per the routine's write policy.
Deliverables: 3 permanent parity tests, 9 backlog items, 2 needs-dan
workups + 3 notes, morning brief, this log. PR #41 (https://github.com/dniachini-droid/tank-wizard/pull/41) opened from
claude/2026-08-14-consistency-sweep (see run-state / PR body = brief).
