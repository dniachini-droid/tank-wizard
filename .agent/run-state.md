run: 2026-08-14-phase6-bugs
routine: routine 15 — phase 6: the known bugs
started: 2026-08-14T00:00:00Z
status: interrupted
last completed step: bug 2 — negative consumption. Implemented Decision 3's
  option (c) exactly as the routine authorised in all three engines, with a
  safe-bound-emergency exemption per the routine's ordering note. Tests
  written, confirmed RED against unfixed code, confirmed GREEN after the fix.
  npm run verify then failed three blocking checks that were green before
  (legacy-port:golden, legacy-port:protocols, legacy-port:invariants) — the
  refusal fires on ordinary "recovering toward target" and "magnesium
  drifting within its own band" scenarios the legacy behavioural suite
  already validates as correct, not just on implausible readings. Reverted
  in full (git checkout on all three engine files, test file removed),
  npm run verify confirmed green again. Written up in .agent/needs-dan.md
  with evidence and three options, per rule 7 ("report rather than force")
  — no chemistry threshold or exemption invented beyond what Decision 3 and
  the routine authorised. Reported-not-fixed, a complete outcome per rule 7.
next step: bug 3 — dose-gap halving removal + stability grading fix
  (helpers.js:489-504 halving; alkBandOf/caBandOf/magnesium equivalent
  grading fix). Branch fresh from origin/main. Read routine section 3 in
  full again before starting; do not rely on this summary alone.
in-flight: none — bug 2 fully closed out (no code change shipped, needs-dan.md
  finding written, committed, pushed, PR #14 opened documenting the attempt
  and the revert), working tree clean, no half-finished edits anywhere
branch: claude/2026-08-14-bug2-negative-consumption-report (bug 2's PR
  branch, pushed, PR #14 opened against main)
uncommitted work: no

<!--
This file is the resume point. Every routine reads it first and writes it
throughout. If status is in-progress or interrupted, the last run died and the
next run must resume before starting anything new. See AGENTS.md, "Checkpoint
and resume contract".

status is "interrupted" rather than "complete" because the routine (seven
bugs) is not finished — bugs 1 and 2 are done (2 as reported-not-fixed), bugs
3-7 remain. This is a clean stopping point per rule 6 (stop at a bug
boundary), not a crash: nothing is half-edited, nothing needs reverting. The
next run should read this file, confirm bug 2's PR is still open and
untouched, then proceed to bug 3.
-->
