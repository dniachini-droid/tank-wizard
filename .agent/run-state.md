run: 2026-08-14-phase6-bugs
routine: routine 15 — phase 6: the known bugs
started: 2026-08-14T00:00:00Z
status: interrupted
last completed step: bug 5 — TW-016, magnesium correction rail 100 -> 25,
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
in-flight: none — bugs 3, 4 and 5 are each their own shipped, independent PR
  against `main` (#22, #23, #25) — none merged as of this write. Bug 6 does
  not depend on any of them; branch it from `main` as-is, don't wait.
branch: claude/bug5-magnesium-rail (pushed)
uncommitted work: no

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
