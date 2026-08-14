run: 2026-08-14-phase6-bugs
routine: routine 15 — phase 6: the known bugs
started: 2026-08-14T00:00:00Z
status: complete
last completed step: bug 7 — TW-020, arrival zone vs full band, shipped.
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
in-flight: none — bug 7 shipped and pushed, PR #27 opened, working tree
  clean
branch: claude/bug7-arrival-zone (pushed)
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
-->
