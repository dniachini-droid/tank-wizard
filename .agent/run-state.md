run: 2026-08-14-phase6-bugs
routine: routine 15 — phase 6: the known bugs
started: 2026-08-14T00:00:00Z
status: interrupted
last completed step: bug 6 — TW-019, remove magnesium from
  DOSE_ADVICE_RULES, shipped. `drift.js`'s `DOSE_ADVICE_RULES` magnesium
  entry deleted (§10: maintenance dose never tuned from readings, magnesium
  exempt). `computeDoseAdvice` iterates Object.keys generically, no
  special-casing needed. Traced (not assumed) the one live consumer,
  `previewStrengthChange`, and confirmed its two `adv.advice[key]` reads
  are already guard-clause-safe against the key being absent. Checked
  Insights.jsx:108/Dashboard.jsx:298-300 (TW-022 dead code) — already
  guarded, left alone. Found and fixed in the same PR, not a scope
  expansion: tests/legacy-port/husbandry.js's settling-window check
  unconditionally indexed DOSE_ADVICE_RULES[key].minDaysSinceChange for
  all three elements — confirmed a genuine TypeError after rebuilding the
  engine bundle, narrowed the check to elements that still have an entry.
  npm run verify GREEN on every blocking check, including
  legacy-port:husbandry (crashed before that fix). golden unaffected —
  DOSE_ADVICE_RULES isn't read by any assess* engine. vitest: differential
  diff shows 70/70 both before and after, empty diff — no existing red
  test asserted this one (unlike TW-016), this bug's own defects test is
  the only coverage. PR:
  https://github.com/dniachini-droid/tank-wizard/pull/26
next step: bug 7 — TW-020, arrival zone vs full band
  (`correctionProgress`, src/lib/dosing/helpers.js:273-279). Branch fresh
  from origin/main. Read routine section 7 in full before starting.
  Depends on bug 4 (alkalinity's band) for its worked example numbers
  (8.40-8.60 dKH assumes 8.2-8.8 is in force) — bug 4's own PR (#23) is
  NOT merged as of this write, so per the routine's own dependency note,
  build this bug's test against an explicit local `def` fixture (band
  values passed directly, not read from the live PARAM_DEFS import) so
  this PR does not implicitly depend on #23 having merged — the fix
  itself is band-relative by construction (§9: "the zone is computed from
  whatever band is in force and must never be hardcoded"). Use §5's kit
  noise floor (STABILITY_RULES in src/lib/stability-engine.js — 0.1 dKH /
  10 ppm / 30 ppm), NOT the _TREND.stable family bugs 2/3 use — same
  caution as those bugs, opposite direction (habit might reach for
  ALK_TREND.stable here by mistake). Must NOT change `passed`
  (helpers.js:316) or the `arrived || passed` correction-done trigger
  (state.js:227) — check call sites that branch on `cp.arrived`
  specifically for wording, not necessarily code. `inBand` may be used
  elsewhere in the same function for band membership, not arrival — check
  every call site before narrowing it globally; add a new `inZone`-style
  check if shared rather than redefining what `inBand` means everywhere.
in-flight: none — this run has shipped bugs 3-6 as four independent PRs
  against `main` (#22, #23, #25, #26), none merged as of this write. Bug 7
  is the last of the seven; branch it from `main` as-is per the dependency
  note above, don't wait for #23.
branch: claude/bug6-mg-dose-advice (pushed)
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
