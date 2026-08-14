run: 2026-08-14-failure-replay
routine: routines/17-failure-replay.md
started: 2026-08-14T00:00:00Z
status: complete
last completed step: committed, pushed, PR #38 opened (https://github.com/dniachini-droid/tank-wizard/pull/38) — never merged, per AGENTS.md #13
next step: none — routine finished
in-flight: none
branch: claude/stoic-carson-i9416q
uncommitted work: no

notes:
  - read-only routine: no application code, spec, test, or constant changed.
    verified via git status before commit — only .agent files touched.
  - scratch work happened outside the repo tree, in the session scratchpad
    (<scratchpad>/failure-replay/legacy-run, current-run). Never committed.
  - headline finding: current, in 2 of 24 simulated three-year runs, opens
    a calcium correction plan just before a neglect spell and overshoots
    further than legacy does in the same circumstance (836.8 / 710.6 ppm
    vs legacy's worst 518.2 ppm) — above the documented F3 figure of
    702 ppm. Attributed, not proven, to Bug 3's grading sensitivity change
    increasing how often a plan is open going into a testing gap. Full
    detail in .agent/failure-replay.md's "New failures" section.
  - previous run-state content (routine 16, durability remainder, status
    "piece one complete") was superseded by this run at the start; that
    routine's own branches/PRs are untouched by this one and its log
    survives independently at .agent/log/2026-08-14-durability-remainder.md.
