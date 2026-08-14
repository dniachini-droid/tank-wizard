run: 2026-08-14-four-owner-decisions
routine: none — owner decisions delivered directly by Dan, not a routine
started: 2026-08-14T (in session)
status: complete
last completed step: main merged into the branch after the run-state restructure
  landed (e3b9658); conflict resolved, `npm run verify` run, pushed. PR #43 open,
  never merged, per AGENTS.md #13.
next step: none. Dan reviews; the code work waits on [approved] tags against
  TW-037, TW-039, TW-043, TW-044, TW-045.
in-flight: none
branch: claude/four-owner-decisions-spec-h2qm6v (harness-designated), cut from
  main at 0b13829, merged up to e3b9658
uncommitted work: no

notes:
  - **Spec-only.** No application code, no test, no chemistry constant touched.
    `git diff --stat origin/main...HEAD -- . ':!*.md'` is empty. AGENTS.md #1
    forbids an agent editing docs/spec; Dan's explicit authorisation is the only
    reason this run did, same exception as the §26 change.
  - What moved: reef-chemistry.md §3 (rails fixed, tighten clause withdrawn);
    wizard-states.md §22 (new — the six consistency verdicts registered, drifting
    -> unsettled, the alert tier, unknown refuses), §15 (notice + unsettled +
    consistency-verdict rows, and a new colour registry), §20 (the word, and the
    confirmation sentence restated), §13 and §21 cross-references.
  - needs-dan: items 7 and 8 closed, two of the three notes in 6 closed, the
    "target" rename left open and parked, **new open item 9** — alkalinity's brand
    colour is byte-identical to STATUS_COLOR.ok, not covered by the decision and
    its harm points the other way.
  - Colour figures were computed, not eyeballed (sRGB -> CIE Lab, WCAG luminance);
    the scripts lived in the session scratchpad and die with it. §15 and the log
    carry the numbers and enough method to re-derive.
  - **Renumbered on the merge.** This run originally filed TW-042/043/044. main's
    run-state restructure (a2ea1b4) had already taken TW-042 for the backlog
    shared-singleton item, and git merged both additions without noticing the
    collision — the backlog is one shared file, which is precisely what that
    TW-042 is about. This run's three items are now **TW-043 (notice wording),
    TW-044 (brand colours), TW-045 (the §22 checker)**; every cross-reference in
    needs-dan, the log and the PR body moved with them.
  - This run began before the restructure and originally wrote to the shared
    `.agent/run-state.md`. That file is gone; this record is the same content,
    at its own address, per `.agent/runs/README.md`.
  - No other run's file was read into or edited by this one.
