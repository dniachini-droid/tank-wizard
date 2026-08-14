run: 2026-08-14-phase6-bugs
routine: routine 15 — phase 6: the known bugs
started: 2026-08-14T00:00:00Z
status: interrupted
last completed step: bug 3 — dose-gap halving removed (3a) + stability
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
  none related to this bug.
next step: bug 4 — alkalinity band 1.0 -> 0.6 (constants.js PARAM_DEFS,
  min: 8.2, max: 8.8). Branch fresh from origin/main once bug 3's PR exists.
  Read routine section 4 in full before starting. Report, do not fix,
  magnesium's own uncredited off-centre band (min 1250/max 1400 vs target
  1350 -> should be 1275-1425) found while reading — same rule 7 shape as
  bug 2 and bug 3's needs-dan.md item, a second thing found, not authorised.
  band-edges.test.js is already red (pre-existing, part of the 69) and may
  reference a different concept ("§3 default coral-mix target") — read what
  it actually asserts before assuming this fix closes it; write a new,
  narrower defects test if it doesn't match §2.
in-flight: none — bug 3 committed on claude/bug3-halving-and-grading, not yet
  pushed/PR'd as of this write; push + PR happen in the same breath as this
  commit, per rule 8, before bug 4 starts.
branch: claude/bug3-halving-and-grading
uncommitted work: no (this file's own edit is part of the commit being made)

<!--
This file is the resume point. Every routine reads it first and writes it
throughout. If status is in-progress or interrupted, the last run died and the
next run must resume before starting anything new. See AGENTS.md, "Checkpoint
and resume contract".

status is "interrupted" rather than "complete" because the routine (seven
bugs) is not finished — bugs 1 and 2 are done, bugs 3-7 remain. This is a
clean stopping point per rule 6 (stop at a bug boundary), not a crash: nothing
is half-edited, nothing needs reverting.

Bug 2 was closed twice. The first pass (PR #14) reported and reverted, because
the option the routine authorised broke three blocking checks. Dan then
withdrew that option as wrong at the premise and authorised the §24 rule, which
is what shipped on the second pass. PR #14 documents the investigation and
stays as the record of it; the rule itself is a separate change.
-->
