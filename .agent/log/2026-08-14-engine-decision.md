# Run log — 2026-08-14-engine-decision

Routine: `routines/19-engine-decision.md` (first execution; PR #39 merged the
routine file only). Commit worked at: `02de5e9`, whose `src/`, `tests/` and
`docs/` are byte-identical to the routine's baseline `480b086`
(`git diff --stat` empty).

## What happened, in order

1. **Precondition checked.** `.agent/real-history-replay.md` absent locally
   and on all 9 remote branches (0 matches each). Routine ran statically per
   its own contingency; every replay-dependent cell marked
   `UNVERIFIED — routine 18 not run`, once, at the top of the report.
2. **Baselines re-measured**, not copied: golden digests
   (`83780c1728b67ca6` port / `37ded9064e91e80e` legacy, both 5,940×30),
   engine wc (4,253), spec/journeys wc (1,508 / 933+83 — the routine's "833"
   figure was off by 100), verify (all blocking pass after `npm ci`;
   advisory deadcode+csscheck fail), vitest (62 failed / 352 passed of 414 —
   the routine's Phase-5 "69/261" is stale), dupcheck (67 pairs, 188
   functions, no unexplained duplication), blockdup (9 against ceiling 10 —
   run-state's earlier "at 10" note now reads 9).
3. **Primary sources read in full**: reef-chemistry.md (1,508 lines), all
   five journeys + README, wizard-states §19–§20, alkalinity.js, calcium.js,
   helpers.js, magnesium.js, state.js, findings.js, stability-engine.js,
   golden.js, routine 18.
4. **Report written in order** — parts one to five first, one leaning phrase
   cut from part four on the cold re-read ("everything that re-litigating a
   day-old owner decision costs" → neutral procedural statement), then part
   six drafted last. **No finding was edited after part six was drafted.**
5. **No harness.** Every part-one verdict traces to quoted code; no engine
   execution beyond the repo's gated suites. Nothing in the tree moved
   except the three permitted files.

## Outcome

- `.agent/engine-decision.md` — six parts. Tally: 0 additions, 6
  replacements, 2 canon-blocked, 1 already-does-it. Part six recommends
  **consolidate**, agreeing with §25's conclusion on partly different
  grounds, with a named falsifier (routine 18 showing dose-figure
  divergence on real data).
- No spec challenge filed (recommendation keeps §25 as written).
- Flagged for `domain-verifier` (flagged, not dispatched, per AGENTS.md #12):
  calcium act path changes doses at ≥10 ppm/week without §7's
  three-standard-error condition; magnesium's trend-following staged cuts
  vs §10's exemption.

## Deviations from the routine text

- **Branch name.** Routine rule 11 names `claude/<date>-engine-decision`;
  this session's harness designates `claude/busy-gates-xs4f5v` and forbids
  pushing elsewhere. The harness designation wins; work is on
  `claude/busy-gates-xs4f5v`.
- `npm test` first ran before `npm ci` on the fresh container and failed
  with `vitest: not found`; re-run after install. Only the post-install
  figures are reported.

## Files written (the only writes)

- `.agent/engine-decision.md`
- `.agent/run-state.md`
- `.agent/log/2026-08-14-engine-decision.md` (this file)
