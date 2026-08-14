run: 2026-08-14-phase6-bugs
routine: routine 15 — phase 6: the known bugs
started: 2026-08-14T00:00:00Z
status: interrupted
last completed step: bug 2 — negative consumption, SECOND PASS, shipped.
  Dan withdrew Decision 3's option (c) as wrong at the premise and authorised
  a four-part replacement rule (hold / report the observation not a cause /
  ask about an unlogged water change or correction / escalate on three
  consecutive negatives with nothing logged). Recorded at
  docs/spec/reef-chemistry.md §24 (new Part III, cross-referenced from §6 and
  §12) and .agent/needs-dan.md; open item 2 there is closed. Implemented in
  all three engines via one shared helper in helpers.js, plus a doseStatus
  fix so the dose card stops saying "the dose is matching consumption" under
  a wizard asking for a retest. One qualification beyond the authorised
  words — a level at or over the top of its range and still rising keeps its
  reduction, without which protocols Mg §56 fails — flagged explicitly in
  needs-dan.md, not buried. npm run verify GREEN on every blocking check,
  including the three the first pass broke. golden re-recorded
  (37ded9064e91e80e -> 372fcda432be5bcf) after a row-by-row audit proving all
  60 changed rows are the intended decrease -> hold and nothing else moved.
  vitest 69 failed / 213 passed against a measured 69 / 200 baseline — no new
  failures.
next step: bug 3 — dose-gap halving removal + stability grading fix
  (helpers.js halving in doseDriftedFrom; alkBandOf/caBandOf/magnesium
  equivalent grading fix). Branch fresh from origin/main. Read routine
  section 3 in full again before starting; do not rely on this summary alone.
  Note for bug 3: doseDriftedFrom's outOfBand halving is the same function
  §24 now bypasses for gaining rows — check the two changes compose before
  assuming bug 3's diff is unaffected.
in-flight: none — bug 2 shipped and pushed, working tree clean
branch: claude/negative-consumption-bug-irngrj (pushed)
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
