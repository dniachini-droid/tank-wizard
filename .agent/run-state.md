run: 2026-08-14-phase6-bugs
routine: routine 15 — phase 6: the known bugs
started: 2026-08-14T00:00:00Z
status: complete
last completed step: bugs 3, 4, 5, 6 and 7 — all five now on this branch,
  composed in bug order rather than merged independently (see the log's
  "Merge" sections). Listed oldest first; bug 7 is the genuine last completed
  step, and the last of the seven.

  bug 3 — dose-gap halving removed (3a) + stability
  grading fixed (3b), shipped together per §7/§11. `doseDriftedFrom`
  (helpers.js) no longer halves its trigger out of band; the `outOfBand`
  parameter is gone, not just unused. `alkBandOf`/`caBandOf`/`mgBandOf` now
  take a second `outOfBandWorsening` argument (a shared helper in helpers.js,
  looks up STABILITY_RULES[key].noiseFloor itself) and promote a rate-only
  "stable" grade to the next band up only when the level is outside its band,
  still moving away, and the movement clears the §5 noise floor over the
  fitted window. Confirmed magnesium is not exempt — grading is its *only*
  guard, since doseDriftedFrom is permanently false for it (§10, no trigger
  key). blockdup (ceiling 10, baseline exactly 10) failed twice during
  implementation from incidental new duplication between calcium.js and
  helpers.js; resolved by extracting the shared helper and by keeping the
  original provisional out.band assignment in place (promoted later) rather
  than deleting it — both real fixes, not workarounds, confirmed via a
  differential region diff. npm run verify GREEN on every blocking check.
  golden re-recorded (372fcda432be5bcf -> ae3b6189dd1ac438) after auditing
  all 441 changed rows: 365 are the intended band promotion (14 of those
  still hold, via the pre-existing "mild, one interval" gate — safe, bounded);
  71 are wording-only (a hold explanation changing which of two legitimate
  hold branches fires, action unchanged); the last 5 are a genuine finding —
  under an active correction, doseDriftedFrom's removed raw-position check
  and grading's fitted-position check can disagree, so a ~7-8.7% alkalinity
  dose gap goes uncaught by either mechanism until the correction ends. Not
  authorised to fix — written up in full (options, not a recommendation) at
  .agent/needs-dan.md item 3. vitest 69 failed / 252 passed — same 69
  pre-existing [chem] failures as the bug-2 baseline, spot-checked by name,
  none related to this bug. Merged to main as PR #22.

  bug 4 — alkalinity band, 1.0 -> 0.6 dKH, shipped.
  One-line fix (constants.js PARAM_DEFS, 8.5-9.5 -> 8.2-8.8) with a large,
  fully-explained blast radius: three OTHER test files (tests/legacy-port/
  summary.js, src/test/spec/history/target-change-immutability.test.js,
  src/test/spec/dosing/rounding.test.js) hardcoded alkalinity reading values
  that assumed the old band and needed their fixture *numbers* re-picked
  (never their assertions — AGENTS.md #4) to keep testing what they claim to.
  Confirmed via a differential vitest failure-list diff that the full suite's
  failure set is now byte-identical to a freshly-measured baseline, not just
  the same count. band-edges.test.js read but not touched — its 4 failures
  cite a "§3, target ± 0.5" numbering that matches neither the old nor the
  new band and predate this bug entirely (ran unchanged before/after,
  4 failed both times, same reason). golden re-recorded
  (372fcda432be5bcf -> a24f6fb8d3011187) after confirming no THREW/crash and
  spot-checking five rows field-by-field — not a row-by-row audit like bugs
  2/3, since golden.js's sweep is deliberately band-relative
  (base/rate = f(span)), so ~1/3 of the alkalinity matrix re-deriving is the
  designed consequence of this exact change, not a symptom to chase row by
  row. Found and filed, not fixed (rule 7 — out of this bug's citation):
  TW-026, magnesium's own PARAM_DEFS band is centred on 1325 ppm, not the
  1350 target §2 gives it — same off-centre shape as alkalinity's bug, filed
  to .agent/backlog.md "Needs Dan's approval". PR:
  https://github.com/dniachini-droid/tank-wizard/pull/23

  IMPORTANT for whoever resumes: bug 4's branch was originally cut fresh from
  a `main` that did NOT include bug 3 (PR #22 was still open), so bugs 3 and 4
  were developed as independent PRs against the same base, per rule 1. PR #22
  merged first; `main` has since been merged into this branch, so bug 3 IS now
  present here and the two fixes are composed. The golden fingerprint was
  REGENERATED against both fixes together rather than either side of the
  conflict being chosen — neither bug's solo digest (ae3b6189dd1ac438,
  a24f6fb8d3011187) is current any more. The composed digest is
  fbac65244f00ac9b, 5,940 rows, audited against both sides (0 THREW, every
  band move a promotion in bug 3's stated direction, calcium 28 / magnesium 0
  matching bug 3's own figures) — see the log's merge section for the full
  audit.

  `main` has been merged in a SECOND time since, to pick up the
  2026-08-14-reef-chemistry-engine-canon run (PR #24: the spec integration,
  TW-026/027/028 approved, TW-029/030/031 filed). That run changed no code —
  spec, backlog and its own log file only — so it moves nothing in the
  fingerprint, and the composed digest above still stands, re-verified rather
  than assumed. Its narrative is not repeated here: this file is the resume
  point for routine 15, and that run recorded itself complete and handed the
  thread back. Its durable record is
  .agent/log/2026-08-14-reef-chemistry-engine-canon.md, which the merge keeps
  in full. Bugs 5, 6 and 7 were each also cut from a `main` that predates bug
  4, per rule 1; they are composed onto this branch in bug order, each
  regenerating the fingerprint against everything applied so far.

  bug 5 — TW-016, magnesium correction rail 100 -> 25,
  shipped. `src/lib/analytics/correction.js:20`
  `CORRECTIONS.magnesium.maxPerDay`: 100 -> 25; `safe-rate.js`'s
  `CORRECTION_MAX_RATE.magnesium` (25) confirmed already correct, untouched.
  The test was already there per TW-016's own text — `rails.test.js`'s
  `SPEC_RAIL` re-pointed from the pre-13-Aug canon {0.5,25,100} to
  {0.5,20,25}, header comment corrected from stale "§6" to §3 — confirmed
  6/12 red before, 12/12 green after, calcium's three passing for the reason
  they always should have (code was already right) and magnesium's for the
  new reason. `tests/parity/correction-calculator-vs-rail.test.js` needed
  the same treatment (found via TW-016's own repro: line) — two of its four
  assertions hardcoded the *buggy* 100/4x figures as ground truth; its real
  SPEC VIOLATION assertion passes unedited now (the fix's own effect), the
  two stale ones re-pointed to the corrected figures. Left alone, confirmed
  unrelated via a differential failure-list diff: rate-rails.test.js's two
  magnesium/calcium failures (same stale-canon shape, but reads only
  safe-rate.js/rateLimitDose, neither touched here) — present unchanged in
  both the pre-fix and post-fix run. golden.json unaffected — CORRECTIONS
  isn't read by any assess* engine, only by Setup's calculator and
  proposeCorrection, neither exercised by golden.js's sweep; confirmed via
  legacy-port:golden passing with no digest-mismatch output. npm run verify
  GREEN on every blocking check. vitest: baseline 70 / post-fix 63, diff
  shows exactly the 7 closed assertions removed, zero added. PR:
  https://github.com/dniachini-droid/tank-wizard/pull/25

  bug 6 — TW-019, remove magnesium from
  DOSE_ADVICE_RULES, shipped. `drift.js`'s `DOSE_ADVICE_RULES` magnesium
  entry deleted (§10: maintenance dose never tuned from readings, magnesium
  exempt). `computeDoseAdvice` iterates Object.keys generically, no
  special-casing needed. Traced (not assumed) the one live consumer,
  `previewStrengthChange`, and confirmed its two `adv.advice[key]` reads
  are already guard-clause-safe against the key being absent. Checked
  Insights.jsx:108/Dashboard.jsx:298-300 (TW-022 dead code) — already
  guarded, left alone. Found and fixed in the same PR, not a scope
  expansion: tests/legacy-port/husbandry.js's settling-window check
  unconditionally indexed DOSE_ADVICE_RULES[key].minDaysSinceChange for
  all three elements — confirmed a genuine TypeError after rebuilding the
  engine bundle, narrowed the check to elements that still have an entry.
  npm run verify GREEN on every blocking check, including
  legacy-port:husbandry (crashed before that fix). golden unaffected —
  DOSE_ADVICE_RULES isn't read by any assess* engine. vitest: differential
  diff shows 70/70 both before and after, empty diff — no existing red
  test asserted this one (unlike TW-016), this bug's own defects test is
  the only coverage. PR:
  https://github.com/dniachini-droid/tank-wizard/pull/26


  bug 7 — TW-020, arrival zone vs full band, shipped.
  This was the seventh and last bug in the routine. `correctionProgress`
  (helpers.js) now tests arrival against the §9 zone
  (`max(bandWidth/3, 2×noiseFloor)`, clamped, centred on the midpoint),
  computed live from `def.min`/`def.max` on every call — not the full
  band. `noiseFloor` is §5's `STABILITY_RULES[key]`, confirmed the correct
  family (not `_TREND.stable`, bugs 2/3's constant, same caution those
  bugs needed in reverse). `passed` and the `arrived || passed`
  correction-done trigger confirmed untouched — proved via a live
  assessAlkalinity + doseStatus integration test, not just the raw
  correctionProgress fields. Two call sites' wording ("inside your
  band"/"inside your range") updated to "back near the middle of your
  range" — still true either way, now precise about what arrived actually
  means. npm run verify GREEN; golden UNCHANGED (golden.js's sweep never
  sets up a correctionPlans entry, so correctionProgress is never
  exercised by it — confirmed by reading golden.js, not assumed). vitest:
  differential diff 70/70 before and after, empty — no existing red test
  asserted this defect, this bug's own test is the coverage. PR:
  https://github.com/dniachini-droid/tank-wizard/pull/27

  COMPOSITION NOTE, replacing bug 4's note above where the two disagree: bugs
  4-7 were each branched fresh from a `main` that predates the others, per
  rule 1, and all four PRs went conflicted at once — against `main` (PR #24
  moved it under them) and against each other, on this file, the run log,
  .agent/backlog.md and tests/legacy-port/golden.json. They are being composed
  in bug order, each branch merging the one before it, so that the PRs merge
  cleanly in that order: #23, then #25, then #26, then #27. Each step
  re-derives the golden fingerprint against every fix applied so far —
  regenerating it where the tree moves it, auditing the diff by element and
  direction — rather than choosing a side, because the bugs interact (bug 4's
  narrower alkalinity band moves which cases fall into bug 3's promotion
  window). With all five fixes applied the digest is fbac65244f00ac9b, 5,940
  rows — bug 4's own composed figure, re-recorded from scratch on the full
  tree and byte-identical to it. Bugs 5, 6 and 7 move zero rows between them,
  measured one composed tree at a time rather than inferred: their constants
  live in `analytics/correction.js`, `analytics/drift.js` and
  `correctionProgress`, none of which the sweep enters. golden.json did not
  conflict at any of the three steps, which is exactly when the check matters,
  because git carries a stale snapshot forward without saying so. Audited by
  element and direction against the pre-bug-4 fingerprint: 1,950 rows differ,
  all alkalinity, calcium 0, magnesium 0 — PR #23's own figure, reproduced.
  Full audit in the log's "Merge — bug 7 composed" section.
next step: none — routine 15 is complete. All seven bugs attempted (six
  fixed and shipped, bug 2 fixed on its second pass after a first-pass
  revert). Each bug is its own PR against `main`, independently branched
  and independently verified per rule 1 — #12 (bug 1) and #14 + the
  bug-2-second-pass PR are merged; #22 (bug 3), #23 (bug 4), #25 (bug 5),
  #26 (bug 6) and #27 (bug 7) are open, unmerged as of this write. Merging
  is Dan's alone (AGENTS.md #13) — nothing here waits on it.
  Two things surfaced along the way that are Dan's to decide, not fixed
  under this routine's authorisation: `.agent/needs-dan.md` item 3 (a
  narrow alkalinity dose-gap coverage question found auditing bug 3's
  golden diff) and TW-026 (magnesium's own off-centre PARAM_DEFS band,
  found under bug 4) — filed to `.agent/backlog.md` "Needs Dan's
  approval". Also found, not fixed: `.agent/backlog.md` now has **two**
  different items both numbered TW-026 (mine, from bug 4; a
  pre-existing one from an unrelated concurrent canon-sync run, "doseStatus
  cannot express four cells of the journey-4b matrix") — a numbering
  collision across two independent, concurrently-shipped PRs, not
  something either session could have seen coming. Renumbering is Dan's
  call, same as the pre-existing TW-016 collision this run already found
  (see the log) — an ID is cited from run notes and PRs, so it is not a
  tidy-up to do unilaterally.
  `.agent/phase6-bugs.md` written this run, per the routine's closing
  instructions — one section per bug, both the precise and plain layers.
  Bug 7 was built against an explicit local `def` fixture rather than the live
  PARAM_DEFS import, exactly as bug 6's note asked, so that it did not
  implicitly depend on #23 having merged. Composing it here is the first time
  bug 4's narrower alkalinity band and bug 7's arrival zone are in the same
  tree, and the zone is band-relative by construction (§9), so the fingerprint
  was re-derived and audited at this step rather than carried forward.
in-flight: none — bugs 3, 4, 5, 6 and 7 all shipped. Bug 3 merged (PR #22);
  this branch (PR #27) carries all five and the canon run. Working tree clean.
branch: claude/bug7-arrival-zone (pushed, PR #27)
uncommitted work: no

<!--
This file is the resume point. Every routine reads it first and writes it
throughout. If status is in-progress or interrupted, the last run died and the
next run must resume before starting anything new. See AGENTS.md, "Checkpoint
and resume contract".

status is "complete" — all seven bugs in routine 15 have been attempted, each
as its own PR. "Complete" describes this routine's work, not the repo's
overall state: none of bugs 3-7's PRs are merged as of this write (merging is
Dan's alone), and a separate, unrelated run (2026-08-14-reef-chemistry-engine-
canon, run by a different session concurrently with bugs 3-7) landed its own
spec and backlog changes on `main` in between — those are that run's own
record, not duplicated here.

Two backlog numbering collisions found across concurrent work this run,
neither renumbered — an ID is cited from run notes and PRs, so renumbering is
Dan's call, not a tidy-up:
- TW-016: one pre-existing ("drift"/"drifting" terminology) and one this
  routine's bug 5 closed (magnesium correction rail). Found under bug 5.
- TW-026: one pre-existing (from the concurrent canon-sync run, "doseStatus
  cannot express four cells of the journey-4b matrix", now [approved]) and one
  this routine filed (magnesium's off-centre PARAM_DEFS band, found under
  bug 4, still needs Dan's approval). Found under bug 7, while writing this
  file — the canon-sync run's TW-026 did not exist yet when bug 4 filed its
  own.

Bug 2 was closed twice. The first pass (PR #14) reported and reverted, because
the option the routine authorised broke three blocking checks. Dan then
withdrew that option as wrong at the premise and authorised the §24 rule, which
is what shipped on the second pass. PR #14 documents the investigation and
stays as the record of it; the rule itself is a separate change.

The 2026-08-14-reef-chemistry-engine-canon run wrote its own `run: ` header
here while routine 15 was mid-flight, and recorded itself complete with
routine 15 named as "the older resume point". Merging it back in restores
routine 15 as the current run, which is what this file is for. Nothing of that
run is lost: its log file is merged intact and its backlog edits are merged.

The five PRs are no longer independent of each other, and this is the one
place that fact is easy to miss. They conflicted on this file, the run log,
.agent/backlog.md and tests/legacy-port/golden.json, so each has been merged
into the next in bug order: #23 carries bugs 3-4, #25 carries 3-5, #26 carries
3-6, #27 carries 3-7. Merge them in that order and each goes in clean; merge
one out of order and it brings its predecessors with it. Independently branched
per rule 1, as the entries above say — but no longer independently mergeable.
-->

<!-- 2026-08-14, appended by the phosphate-band investigation (log:
     .agent/log/2026-08-14-phosphate-band-investigation.md). Deliberately NOT
     written as a new `run:` header: routine 15's record is what this file's
     header is, and the tail above documents the confusion the last run caused
     by overwriting it mid-flight. This was a question from Dan, answered in
     session, not a routine.

     What it produced, on branch claude/phosphate-band-shift-4t55n8:
     (1) The answer — nothing today touched phosphate's band. constants.js:33
     has been 0.03-0.10 since 0637695; the day's only PARAM_DEFS edit is bug
     4's alkalinity change. The 0.07-0.15 band Dan remembers is the pre-rebuild
     one, still visible in legacy/releases/*.
     (2) TW-032 [schema], fixed here — drainLegacyStore was written and tested
     in ee64a23 and never called by the app, so an install whose mirror had
     gone stale silently reads its older copy. That is the one live mechanism
     that can make a hand-set target range revert with no code change behind
     it. Wired into App.jsx's startup effect; regression test
     src/test/defects/legacy-drain-wiring.test.jsx, 3 of 4 cases confirmed red
     before the fix. Authorised by Dan directly, per AGENTS.md rule 5.
     (3) TW-029 gained a sub-item — bug 7's arrival zone reads phosphate's and
     nitrate's percent-mode noise floors as absolute values. Latent (neither
     parameter reaches correctionProgress today), filed rather than fixed
     because every candidate fix is a chemistry decision.

     Nothing here changes routine 15's state or its five composed PRs. -->
