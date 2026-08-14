run: 2026-08-14-phase6-bugs
routine: routine 15 — phase 6: the known bugs
started: 2026-08-14T00:00:00Z
status: interrupted
last completed step: bug 1 (App.jsx:1275 goTo crash, Tasks.jsx:198 onComplete crash)
  — test written and confirmed RED, fix applied, confirmed GREEN, npm run
  verify green (linkcheck/propcheck flipped to blocking per TW-021), full
  vitest suite shows 194 passed / 69 failed matching the routine's documented
  pre-existing baseline, backlog updated, committed, pushed, PR opened.
next step: bug 2 — negative consumption (alkalinity.js:635-642, calcium.js:360-367,
  helpers.js:718-724). Branch fresh from origin/main (normal — a first fetch
  in this container misread main as stale, corrected in the log's "Branch/base
  note"; main is current, PR bug 1 was opened against it normally). Read
  routine section 2 in full again before starting; do not rely on this
  summary alone.
in-flight: none — bug 1 fully closed out (commit, push, PR), working tree
  clean, no half-finished edits anywhere
branch: claude/2026-08-14-bug1-tab-nav-crashes (bug 1's PR branch, pushed,
  PR opened against main)
uncommitted work: no

<!--
This file is the resume point. Every routine reads it first and writes it
throughout. If status is in-progress or interrupted, the last run died and the
next run must resume before starting anything new. See AGENTS.md, "Checkpoint
and resume contract".

status is "interrupted" rather than "complete" because the routine (seven
bugs) is not finished — only bug 1 of 7 is done. This is a clean stopping
point per rule 6 (stop at a bug boundary), not a crash: nothing is
half-edited, nothing needs reverting. The next run should read this file,
confirm bug 1's PR is still open and untouched, then proceed to bug 2.
-->
