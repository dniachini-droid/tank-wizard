# Run log — 2026-08-14-real-history-replay

Routine: `routines/18-real-history-replay.md`
Branch: `claude/hopeful-bohr-yc58vu`
Engine imported at: `385428a219f2e1e586e488c81dd5fa9efe2caf0f` (routine was written
against `054b692`; `385428a` is the current `main` and contains it).
Scope: report only. Writes limited to `.agent/real-history-replay.md`,
this log, and `.agent/run-state.md`.

## Step 1 — read the canon

`AGENTS.md` and `routines/18-real-history-replay.md` read in full before any work.
No PR template found (`.github/` contains `workflows/` only), so the PR body uses
the AGENTS.md template.

## Step 2 — environment

`npm ci` run (node_modules was empty; a fresh clone cannot import the engine
without it). Node v22.22.2, esbuild 0.25.12 present as a vite dependency.

## Step 3 — harness (scratchpad only, never in the repo)

Files, all under the session scratchpad:
`jsx-loader.mjs`, `register.mjs`, `replay.mjs`, `smoke.mjs`, `clockproof.mjs`,
`mixedclock.mjs`, `mixedclock2.mjs`, `probe.mjs`, `probe2.mjs`, `probe3.mjs`,
`dosechange.mjs`, `dosechange2.mjs`, `dosechange3.mjs`, `contradiction.mjs`,
`evidence.mjs`, `evidence2.mjs`, `dismissed.mjs`.

Blocker found and solved: `src/lib/constants.js` imports `../icons.jsx`, so the
engine cannot be imported by plain Node. A Node ESM loader that transpiles `.jsx`
through the esbuild already vendored with vite fixes it without touching the repo.
Result: every module named by the routine imports outside a browser, plus
`deriveTankState` from `src/App.jsx` itself — so the replay calls the app's own
wiring rather than a re-derivation. Nothing is `UNVERIFIED` for import reasons.

## Step 4 — clock fake, verified before trusting output

Global `Date` replaced per step with a subclass whose zero-arg constructor and
`static now()` return the step's timestamp. Proof run:

```
unfaked  todayStr()            = 2026-08-14
faked    todayStr()            = 2026-05-04   (want 2026-05-04)
faked    addDaysFromToday(-14) = 2026-04-20   (want 2026-04-20)
restored todayStr()            = 2026-08-14
```

`todayStr() === step.date` is asserted on every one of the 336 steps; the run
throws if it drifts. It did not.

## Step 5 — fixture facts re-verified

All the routine's fixture facts hold at `385428a` except three small corrections,
recorded in the report §1/§2: the 11 timed readings start 2026-08-10 (not 08-09);
`findings-dismissed` holds 22 entries in two formats (not ten); the `ca-plan`
`target: 22.2` is a target **dose in mL/day**, not a ppm delta.

## Step 6 — replay runs

Run A (12-Aug settings throughout) and run B (09-Aug settings up to 2026-08-09):
336 steps each, 0 engine errors, ~0.9 s per run.

## Step 7 — analysis and report

Sections 1–11 of `.agent/real-history-replay.md` written. Headline findings:
engine-vs-band contradiction on 50 step-elements; 128 of 132 dose
recommendations fail journey-4b's evidence rule; the 10 dismissals of
2026-08-10 hid nothing; the recorded 11 Aug alkalinity change is an override of
a `hold`; the recorded 10 Aug calcium plan is not reproducible at `385428a`.

## Step 8 — commit, push, PR

Committed the three report files only, pushed `claude/hopeful-bohr-yc58vu`,
opened the PR. Not merged.
