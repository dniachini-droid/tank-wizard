run: 2026-08-14-reef-chemistry-engine-canon
routine: none — owner-directed. Dan authorised the spec edits explicitly
  (AGENTS.md rule 1 otherwise forbids them).
started: 2026-08-14T09:20:00Z
status: complete
last completed step: the whole of it, in one pass —
  (1) docs/spec/DECISION-reef-chemistry-engine.md folded into canon and
  deleted: reef-chemistry.md §25 (the engine, what it assesses, per-parameter
  reasoning, the coverage table, not-a-rebuild) plus a new §12 refusal and a
  narrowed §13.2; wizard-states.md Part III §19 (surfaces) and §20 (notices,
  hiding, the confirmation wording, resurfacing) plus a §7 pointer and a new
  §11 single-source row for parameter assessment.
  (2) TW-026, TW-027, TW-028 moved to "Approved for implementation" and marked
  [approved] — the only recorded blocker was the missing canon entry. None
  carries [chem]: the routing, states and enforcement may be built, a chemistry
  constant may not be minted from them.
  (3) TW-029 (defect — phosphate/nitrate carry alkalinity's reasoning),
  TW-030 (salinity not assessed at all) and TW-031 (confirmation before hiding
  a serious notice; every notice becomes hideable) filed under "Needs Dan's
  approval". TW-029 and TW-030 each need per-parameter reasoning from Dan
  before their second half is implementable; §25 mints no figures for them
  deliberately.
  No code changed. npm test 69 failed / 279 passed both before and after
  (unchanged, pre-existing); npm run build succeeds; npm run verify ALL
  BLOCKING CHECKS PASSED. npm run lint does not exist (TW-024) and was not run.
next step: nothing outstanding from this run. Two things waiting on Dan, both
  written up in place rather than here: the "serious" mapping in
  wizard-states.md §20 (the one line in §19/§20 that is the spec's inference
  rather than his words), and the phosphate, nitrate and salinity reasoning
  TW-029 and TW-030 need.
  **Routine 15 is still unfinished and is the older resume point**: bugs 1-3
  are done, bugs 4-7 remain. Bug 4 — alkalinity band 1.0 -> 0.6
  (constants.js PARAM_DEFS, min: 8.2, max: 8.8), branch fresh from origin/main,
  read routine section 4 in full first. Report, do not fix, magnesium's own
  uncredited off-centre band (min 1250/max 1400 vs target 1350 -> should be
  1275-1425). band-edges.test.js is already red (pre-existing, part of the 69)
  and may reference a different concept — read what it asserts before assuming
  bug 4 closes it.
in-flight: none — working tree clean, everything committed and pushed
branch: claude/reef-chemistry-spec-integration-i62jqc (pushed, PR opened)
uncommitted work: no

<!--
This file is the resume point. Every routine reads it first and writes it
throughout. If status is in-progress or interrupted, the last run died and the
next run must resume before starting anything new. See AGENTS.md, "Checkpoint
and resume contract".

status is "complete" for this run and this run only. The routine-15 work above
it is a separate, still-unfinished thread and is carried forward in "next step"
so it is not lost — the previous version of this file was the only record of
where it stopped.

Found while reading and deliberately not fixed: .agent/backlog.md has two items
numbered TW-016. Renumbering one is Dan's call, not a tidy-up — an ID is cited
from run notes and PRs.
-->
