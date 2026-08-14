# Run log — 2026-08-14-failure-replay (routine 17)

Read-only routine. Single output: `.agent/failure-replay.md`.

## Steps

1. Scratch tree setup — `<scratchpad>/failure-replay/{legacy-run,current-run}`,
   mirroring `tools/+src/` (legacy) and `tests/{,sim/}` (both) exactly as
   `build_harness.py` and the harnesses' own `require` paths expect. Copied
   from `legacy/tests/*` (the originals, unmodified require paths) — not
   from `tests/legacy-port/*`, whose require paths were already rewritten
   during porting and would not resolve against a scratch `build/engines.js`.
2. Bundles built: legacy via `python3 tools/build_harness.py` in scratch
   (`harness built: 196 exports`); current via the Phase 3 §0 esbuild
   command, output pointed at the scratch tree (198 named exports on the
   resulting module). Golden sanity gate: legacy `37ded9064e91e80e` (match,
   confirms correct build); current `fbac65244f00ac9b` (mismatch, expected
   per PR #22's golden re-record — not investigated further, out of scope).
3. Three unmodified harnesses run in both trees: `years.js` (0 problems
   both), `INVARIANT_RUNS=6000 invariants.js` (0 violations both),
   `crosstalk.js` (0 failures on every probe both; protocol-authority holds
   differ 1098/82 vs 1118/62, recorded as context).
4. One instrumentation edit made, byte-identical in both scratch trees:
   extended `tests/sim/longrun.js`'s line-97 `trace.push` to also record
   `calciumLevel`/`calciumDose`/`magnesiumLevel`/`magnesiumDose`. Diff is
   in the report header. `replay-measure.js` written (identical in both
   trees) re-running the exact `years.js` SCENARIOS/opts grid (copied
   verbatim, not retyped) and computing per scenario x seed stats from
   `run()`'s return value. Ran ~1m45s (legacy) / ~2m25s (current) each.
5. Aggregation (`aggregate.js`, run locally against both JSON outputs, not
   copied into the scratch trees since it only post-processes already-
   written files) produced worst-case/median tables.
6. The step-2 numbers surfaced a striking finding — current's worst calcium
   peak (trace-sampled 695.6 ppm) landed in a *steady*-tank scenario, not a
   growth one. Two further tiny driver scripts (`diagnose.js`,
   `diagnose2.js`, `scan-stalls.js` — all read-only, all reading only
   `run()`'s already-returned `planLog`/`trace`, no further harness edits)
   traced this to two runs where current opened a calcium correction plan
   2 days before a neglect spell began; with no readings for the next
   30 days the plan ran unstopped, reaching 710.6 ppm and 836.8 ppm
   (`planLog`-exact) — both above the documented F3 figure (702 ppm) and
   above legacy's worst case in the same circumstance (518.2 ppm, 1 of 24
   runs vs current's 2 of 24). Same-seed comparison showed legacy never had
   a plan open across either neglect window in that run at all. Written up
   as the report's "New failures" section, ranked first per the routine,
   with attribution to Bug 3's grading sensitivity offered as plausible,
   not proven.
7. F3 annex: `sim/smoke.js`, both engines, 0 disagreements (60 tanks, 4,200
   tank-days, 12 states) — corroborates "no outright surface disagreement,"
   contributes nothing on overshoot magnitude (the harness doesn't print a
   quotable per-surface count in default mode).
8. Report written: `.agent/failure-replay.md` — header, attribution key,
   New failures (ranked first), F1-F4 (each two-layer per AGENTS.md #11,
   with verdict + attribution), harness counts, closing paragraph
   (both layers), risk paragraph.

## Nothing under `legacy/` touched

Confirmed via `git status` before finishing — only `.agent/failure-replay.md`,
`.agent/run-state.md`, and this log file are new/changed in the repo tree.
All scratch work (`<scratchpad>/failure-replay/`) stays outside the repo and
is not committed.

## Time

`years.js`/`replay-measure.js`/`scan-stalls.js` each take 1.5-2.5 minutes per
engine (three-year simulation x 24 scenario/seed combinations x two
diagnostic re-runs); total wall time for the numerical work was roughly
20 minutes across all invocations.
