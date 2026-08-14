# Routine 13 — Phase 5: The Gate

Cloud routine. **Ports tooling; changes no application code.** Nothing in
`src/` is edited. Nothing under `legacy/` or `docs/spec/` is edited.

---

## Background

`legacy/verify.sh` is the old repo's merge gate — 106 lines, ordered
cheapest-first, and nothing merged unless it exited 0. It has three parts:

1. **Static checks** — 15 checkers in `legacy/tools/`, run against the single
   `src/reef-console.jsx` file and the built HTML.
2. **Behavioural checks** — 26 test files. **Already ported.** Phase 3 ran them
   against the new modular code through `src/test-surface.js`: golden
   fingerprint `37ded9064e91e80e` matched, 0 failures, 21 suites passing, 4
   fixtures, 1 unrunnable (`popup.js` — it greps the monolith's JSX source,
   which no longer exists). See `.agent/phase3-conformance.md`. They live in
   `tests/legacy-port/`.
3. **The gate logic itself** — and it was broken. Every `|| fail=1` in the
   script set a flag that was **never read**, so a suite could exit 1 while the
   gate printed `ALL CHECKS PASSED`. That went unnoticed for the entire life of
   the script. `set -o pipefail` was added for the same class of fault:
   `node tests/textcheck.js | tail -1` reported the exit code of `tail`, so
   textcheck crashed on every run and the gate never noticed.

**This repo has no CI at all.** There is no `.github/` directory. Everything is
run by hand, when someone remembers.

The job is to make the static half run against 57 ESM modules instead of one
JSX file, and to make the whole gate run on every pull request.

### What is actually in `legacy/tools/`

19 files, of which **15 are checkers** invoked by `verify.sh`. The other four
are not checkers and must not be counted as ports that failed:

| File | What it is |
|---|---|
| `build.py` | the 72 KB single-file builder — vite replaces it entirely |
| `build_harness.py` | builds `build/engines.js` for the test harnesses — superseded by the esbuild command in `.agent/phase3-conformance.md` §0 |
| `loader.js` | the runtime boot loader injected into the single HTML file |
| `mutate.py` | mutation testing — **not static, and the most important file in the directory** |

Say this count plainly in the report. "19 checkers" is the directory listing,
not the checker count.

---

## The job

### 1. Read every checker before porting anything

Each one has a docstring naming the **real bug that caused it to be written**.
That bug is the checker's reason to exist, and it is how you decide whether it
still applies. A checker whose bug is now impossible under ESM and vite should
be reported as superseded, with the reason — not ported for completeness, and
not deleted silently either.

### 2. Classify each of the 15, one of four ways

**PORTED** — runs against the new tree, catches the same class of fault, no
material change in what it means.

**PORTED WITH CHANGES** — the fault class still exists but the mechanism must
change, usually because the checker assumed one file and must now walk a module
graph. State exactly what changed and what that costs in coverage.

**SUPERSEDED** — something in the new toolchain already catches this, better.
Name the replacement and prove it: write the fault into a scratch file, run the
replacement, show it failing. **A superseded verdict with no demonstration is a
guess.** If the replacement needs a dependency the repo does not have, see §5.

**DOES NOT PORT** — the fault class does not exist in the new architecture, or
the checker is so coupled to the monolith that porting it means rewriting it.
Say which, and say what is now unguarded as a result.

### 3. Build the gate

A single entry point, `npm run verify`, plus the individual checkers as
separate scripts so one can be run alone. Ordered cheapest-first, same as the
original — a syntax error should fail in a second, not after the simulation.

**Three rules the old gate learned the hard way:**

- **Every non-zero exit must reach the exit code.** The old script's `fail=1`
  flag was set and never read. If you use the same pattern, read the flag.
- **`set -o pipefail`**, or the Node equivalent — a piped checker's exit code
  must survive the pipe.
- **A check that cannot fail is worse than no check**, because it reports
  coverage it does not have. This is what `mutate.py` exists to prove.

### 4. Wire it into GitHub Actions

`.github/workflows/verify.yml`, on `pull_request` and on push to the branch.
`npm ci` (there is a `package-lock.json`), Node 20 or 22, and the Python 3 the
checkers need if any survive as Python. Cache what is worth caching.

`build/` is gitignored and regenerated — the workflow must build the harness
bundle before the legacy-port suites run, using the exact esbuild command in
`.agent/phase3-conformance.md` §0. Do not invent a different one; the `window`
stub in its banner is what makes the legacy suites run at all.

The gate must be **one required check**, not fifteen — Dan reads one red or
green, and the log says which checker failed.

### 5. Dependencies: propose, never install

Several of these checkers have a better modern equivalent — `no-undef` for
`scopecheck`, `eslint-plugin-react-hooks` for `hookcheck`, a dead-export finder
for `deadcode`. Every one of those is a new dependency.

**Do not add one.** File it as a `[deps]` backlog item with the checker it
replaces, the evidence from §2 that it actually catches the fault, and what it
costs. Dan approves dependencies (AGENTS.md #6).

Worth knowing while you are there: `AGENTS.md`'s definition of done requires
`npm run lint`, and **no `lint` script exists in `package.json`**. If your
answer to several checkers is "eslint does this", that is one `[deps]` item
closing several holes at once, and it closes that gap too. Say so; do not act
on it.

---

## What is already known — check, do not rediscover

- **`livecheck.py` is the highest-value port and has no off-the-shelf
  equivalent.** It catches config fields read *only by tests* — a fix and a
  test agreeing about a number the app never consults. All seven of its
  `TABLES` exist in the new tree, each in exactly one module:
  `STABILITY_RULES` (`src/lib/stability-engine.js`), `CONSISTENCY_RULES`
  (`src/lib/analytics/time-in-range.js`), `SAFE_BOUNDS` and `KIT_PRECISION`
  (`src/lib/findings.js`), `CORRECTION_MAX_RATE`
  (`src/lib/analytics/safe-rate.js`), `DOSE_ADVICE_RULES`
  (`src/lib/analytics/drift.js`), `DOSE_DRIFT_TRIGGER`
  (`src/lib/dosing/helpers.js`). The single-file version reads one source; the
  port must read the module that declares the table and every module that
  imports it.
- **`deadcode.py` will find real things immediately.** `.agent/five-decisions.md`
  already documents `doseAdvice` computed and never read at `Insights.jsx:108`
  and `Dashboard.jsx:298`. Expect more: the split multiplied the surface.
- **`escapecheck.py` still applies and now spans files.** `useEscape` is used in
  8 components; the overlays it must cover are `AllParametersSheet`,
  `DoseChangeSheet`, `LogReadingSheet`, `IcpPanel`, `ReadingConfirmation`,
  `TaskCompletion`, `TodayPanel` and the rest of `src/components/`. The legacy
  version found component boundaries with `line.startswith("function ")` in one
  file. That will not work.
- **`wordingcheck.py` maps directly onto live canon.** It enforces that the
  summary repeats the dosing engine's words rather than writing its own — which
  is `wizard-states.md` §7 and §12, the parity requirement. `buildBriefing` now
  lives in `src/lib/narrative-engine.js`. This checker is the only automated
  enforcement of §7 that has ever existed; §7 currently says it describes an
  intention rather than a guarantee.
- **`csscheck.py` is the one most likely not to port.** It reads built HTML,
  splits on `<script id="app-src" type="text/plain">`, and asserts every class
  has a rule and every rule is used. The new app is Tailwind + PostCSS, where
  utility classes are generated on demand and unused ones are purged by the
  build — so half the check is what Tailwind already does and the other half
  needs the built CSS bundle, not an inline script tag. Decide honestly; do not
  force it.
- **`jsxcheck.py` and half of `validate.js` are probably superseded by the
  build.** An unclosed tag or an unbalanced brace fails `npm run build` under
  esbuild's parser. Prove it per §2 rather than assuming it. `validate.js`'s
  other half — identifiers that resolve nowhere — is a different question under
  ESM, where the import graph makes it checkable properly for the first time.
- **`rootprops.py` is written against `export default function ReefConsole`**
  and the monolith's "root ends at the next top-level function" assumption. The
  root is now `src/App.jsx`. Whether the fault class survives the split is a
  real question — answer it, do not port mechanically.
- **`popup.js` is the precedent for "does not port".** Phase 3 filed it
  unrunnable rather than pointing it at a different file with a different
  extraction pattern, because that would be rewriting the test, not porting it.
  Hold the same line here.

### `mutate.py` — port this one

It breaks the app on purpose and checks the suites notice. It exists because
**two checks in the old gate were green while covering nothing**: `csscheck`
inspected a fixed prefix list and passed while a whole class family went
unstyled, and `verify.sh` set a flag it never read.

Every mutation in it is a real fault found during the old stage 5. They are
keyed to line content in `src/reef-console.jsx` and will all need re-pointing
at the new modules. A ported gate that has not been mutation-tested is not
known to work — it is only known to be green, which is the exact thing this
project has been burned by.

---

## When a ported checker fails on day one

Several will. That is the checkers working, not a reason to weaken them.

**Never edit a checker to make it pass.** Same rule as AGENTS.md #4 for tests.

Land each failing checker **advisory** — it runs, it prints, it does not fail
the build — with a `[blocked]` backlog item naming what it found and what
making it blocking would take. Everything green goes in **blocking** on day
one. The report must list, explicitly, which checkers are blocking and which
are advisory, and every advisory one must have a backlog item. An advisory
checker with no item is how a check goes quiet.

---

## Output

`.agent/phase5-gate.md`:

1. **Counts** — ported, ported with changes, superseded, does not port; and
   separately, blocking vs advisory.
2. **The table** — one line per checker: name, outcome, what it catches, what
   it costs if it is missing.
3. **What each one actually catches**, in a sentence, from its docstring's real
   bug — not a paraphrase of its name. `deadcode.py` is not "finds dead code";
   it is "finds the shape that hid `CA_PER_DKH_LO`, used in seven places and
   declared in none, while every suite passed."
4. **Did not port** — each with the reason, and **what is now unguarded**. This
   is the section Dan reads. A fault class that no longer has a checker is a
   hole, whether or not it was reasonable to drop the checker.
5. **Superseded** — the replacement, and the demonstration that it catches the
   fault. Name the `[deps]` item where one is needed.
6. **The mutation results** — which mutations the ported gate caught, which it
   did not, and what that says about coverage.
7. **The workflow** — what runs, in what order, how long it takes, and what a
   red build looks like.

### Write everything twice

Per AGENTS.md #11. Precise (file:line, exit codes, timings), then plain — what
this checker would have stopped from reaching the tank, in one reefkeeper's
sentence. If the plain version is hard to write, the checker may not be earning
its place. Say so.

---

## Never

- Change anything in `src/` — not one line, not to make a checker pass
- Edit anything under `legacy/` (AGENTS.md #9) — copy out to a scratch
  directory and run it there, as Phase 3 did with `build_harness.py`
- Edit a checker to make it pass, or narrow one to fit what the code does now
- Add a dependency — propose it as `[deps]` and stop
- Report a checker as superseded without demonstrating the replacement failing
  on the real fault
- Land a checker that cannot fail
- Report the gate as working before `mutate.py` has been run against it
- Merge the PR, or enable auto-merge (AGENTS.md #13)

---

## Definition of done for this routine

- `npm run verify` runs locally, exits non-zero on a real fault, and exits 0 on
  a clean tree
- `.github/workflows/verify.yml` runs on every pull request and is one check
- `mutate.py`'s successor has been run and its results are in the report
- Every advisory checker has a `[blocked]` backlog item
- `.agent/phase5-gate.md` written, both layers
- `.agent/log/<run-id>.md` written as you go, not at the end
- Committed, pushed, PR opened per AGENTS.md #13
