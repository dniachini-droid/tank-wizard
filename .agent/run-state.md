run: 2026-08-14-phase6-bugs
routine: routine 15 — phase 6: the known bugs
started: 2026-08-14T00:00:00Z
status: interrupted
last completed step: bug 4 — alkalinity band, 1.0 -> 0.6 dKH, shipped.
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
  to .agent/backlog.md "Needs Dan's approval". PR number recorded in a
  follow-up commit once opened, per the bug-3 precedent.
  IMPORTANT for whoever resumes: this branch was cut fresh from `main`, which
  does NOT yet include bug 3's changes (PR #22, not merged as of this run) —
  bugs 3 and 4 are independent PRs against the same base, per rule 1. Bug 5
  below is also independent of both and should also branch from `main`, not
  from either.
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
in-flight: bug 4 committed on claude/bug4-alkalinity-band, about to push and
  open the PR in the same breath, per rule 8.
branch: claude/bug4-alkalinity-band
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
