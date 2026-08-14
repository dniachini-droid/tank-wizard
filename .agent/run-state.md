run: 2026-08-14-phase6-bugs
routine: routine 15 — phase 6: the known bugs
started: 2026-08-14T00:00:00Z
status: interrupted
last completed step: bugs 3 and 4 — both now on this branch, bug 3 via a
  merge of `main` into `claude/bug4-alkalinity-band` (see the log's "Merge —
  bugs 3 and 4 composed" section). Listed oldest first; bug 4 is the genuine
  last completed step.

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
next step: bug 5 — TW-016, magnesium correction rail 100 -> 25
  (src/lib/analytics/correction.js:20, CORRECTIONS.magnesium.maxPerDay).
  Branch fresh from origin/main. Read routine section 5 in full before
  starting. rails.test.js's SPEC_RAIL constant needs re-pointing to
  {0.5, 20, 25} as part of this fix (the backlog item TW-016 explicitly
  names this file's constant, not just its assertions — not a rule-4
  violation), and its header comment's "§6, lines 149-166" citation is stale
  (now §3 after the 14 Aug canon swap) — correct both in the same PR. After
  the fix, confirm rails.test.js's calcium assertions pass for a reason
  already true before this fix (code was already right) and magnesium's pass
  for the new reason, not just that the file goes green as a whole.
in-flight: none — bugs 3 and 4 both shipped; bug 3 merged (PR #22), bug 4's
  PR #23 updated with `main` merged in and its conflicts resolved, working
  tree clean
branch: claude/bug4-alkalinity-band (pushed, PR #23)
uncommitted work: no

<!--
This file is the resume point. Every routine reads it first and writes it
throughout. If status is in-progress or interrupted, the last run died and the
next run must resume before starting anything new. See AGENTS.md, "Checkpoint
and resume contract".

status is "interrupted" rather than "complete" because the routine (seven
bugs) is not finished — bugs 1-4 are done, bugs 5-7 remain. This is a clean
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
-->
