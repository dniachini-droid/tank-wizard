run: 2026-08-14-phase6-bugs
routine: routine 15 — phase 6: the known bugs
started: 2026-08-14T00:00:00Z
status: interrupted
last completed step: bugs 3, 4 and 5 — all three now on this branch, composed
  in bug order rather than merged independently (see the log's "Merge" sections).
  Listed oldest first; bug 5 is the genuine last completed step.

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
  window). At this step, bugs 3 + 4 + 5, the digest is unchanged at
  fbac65244f00ac9b: bug 5's constant lives in `analytics/correction.js`, which
  nothing in the sweep reads. Measured on the composed tree, not assumed from
  the absence of a git conflict — golden.json did not conflict here, and that
  is exactly when the check matters. See the log's "Merge — bug 5 composed onto
  bugs 3 + 4" section.
next step: bug 6 — TW-019, remove magnesium from DOSE_ADVICE_RULES
  (src/lib/analytics/drift.js:40-57). Branch fresh from origin/main. Read
  routine section 6 in full before starting. The fix itself is a straight
  deletion (delete the `magnesium: {...}` entry — computeDoseAdvice iterates
  Object.keys(DOSE_ADVICE_RULES) generically, no special-casing needed
  elsewhere). The real work is the trace the routine calls for:
  `previewStrengthChange` (corrected-strength.js:43-44, rendered live at
  Insights.jsx:697-720) consumes computeDoseAdvice's result and must be
  checked that it doesn't unconditionally index a now-absent `.magnesium`
  key — verify this before/after, don't assume. Insights.jsx:108 and
  Dashboard.jsx:298-300 are TW-022 (separate, already-tracked dead code) —
  leave them alone, don't expand into that item.
  Bug 6 is already implemented on `claude/bug6-mg-dose-advice` (PR #26,
  branched from `main` before this branch existed); it is composed onto this
  branch next rather than branched fresh.
in-flight: none — bugs 3, 4 and 5 all shipped. Bug 3 merged (PR #22); bug 4
  (PR #23) carries bug 3 and the canon run; this branch (PR #25) carries bugs
  3, 4 and 5. Working tree clean.
branch: claude/bug5-magnesium-rail (pushed, PR #25)
uncommitted work: no

<!--
This file is the resume point. Every routine reads it first and writes it
throughout. If status is in-progress or interrupted, the last run died and the
next run must resume before starting anything new. See AGENTS.md, "Checkpoint
and resume contract".

status is "interrupted" rather than "complete" because the routine (seven
bugs) is not finished — bugs 1-5 are done, bugs 6-7 remain. This is a clean
stopping point per rule 6 (stop at a bug boundary), not a crash: nothing is
half-edited, nothing needs reverting.

Bug 2 was closed twice. The first pass (PR #14) reported and reverted, because
the option the routine authorised broke three blocking checks. Dan then
withdrew that option as wrong at the premise and authorised the §24 rule, which
is what shipped on the second pass. PR #14 documents the investigation and
stays as the record of it; the rule itself is a separate change.

The 2026-08-14-reef-chemistry-engine-canon run wrote its own `run: ` header
here while routine 15 was mid-flight, and recorded itself complete with
routine 15 named as "the older resume point". Merging it in restores routine
15 as the current run, which is what this file is for. Nothing of that run is
lost: its log file is merged intact, its backlog edits are merged, and the one
note it left that is still live rather than run-specific is carried below.

Found while reading and deliberately not fixed: .agent/backlog.md has two items
numbered TW-016. Renumbering one is Dan's call, not a tidy-up — an ID is cited
from run notes and PRs.

The same has now happened a second time, and composing the branches is what
made it visible: there are two items numbered TW-026 — `[approved] TW-026
doseStatus cannot express four cells of the journey-4b matrix` (journeys 4/4b,
approved by the canon run) and `[chem] TW-026 magnesium's default band is
off-centre` (filed by bug 4). Bug 4 minted its number against a backlog that
did not yet carry the other; neither branch could see the clash on its own.
Left alone for the reason above — both IDs are already cited from run notes
and PRs, so renumbering is Dan's call. TW-032 is the first free number if he
wants one.
-->
