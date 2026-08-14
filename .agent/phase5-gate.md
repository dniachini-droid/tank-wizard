# Phase 5 — The Gate

14 August 2026. Routine 13 (`routines/13-phase5-gate.md`). Nothing in `src/`
edited. Nothing under `legacy/` or `docs/spec/` edited. `legacy/verify.sh`'s
15 static checkers ported to `scripts/verify/*.mjs`, run through a single
entry point (`npm run verify`), wired into `.github/workflows/verify.yml` —
this repo had no CI at all before this run.

Read every checker in `legacy/tools/` before porting anything, cross-checked
every claim in the routine against the live tree, and demonstrated both
supersession verdicts before writing them down. Full trace in
`.agent/log/2026-08-14-phase5-gate.md`.

---

## 1. Counts

15 checker files in `legacy/verify.sh`'s static section. `validate.js` splits
into two verdicts — its brace/duplicate-declaration checks and its
undefined-call/component checks are genuinely different fault classes with
different fates — so this is 15 files, 16 verdicts:

| Verdict | Count | Which |
| --- | ---: | --- |
| PORTED (no material change) | 1 | wordingcheck |
| PORTED WITH CHANGES | 13 | validate.js (half), propcheck, scopecheck, hookcheck, rootprops, deadcode, livecheck, dupcheck, blockdup, csscheck, motioncheck, a11ycheck, escapecheck |
| SUPERSEDED | 2 | validate.js (half), jsxcheck |
| DOES NOT PORT | 0 | — |

**Plain terms:** every fault class the old checkers were built to catch still
exists in the new codebase, or is now caught earlier by the build itself.
Nothing had to be thrown away as no-longer-applicable.

14 scripts landed in `scripts/verify/` (validate.js's surviving half became
one script, `linkcheck.mjs`; jsxcheck's fate needed no script at all).
Blocking vs advisory, on this run:

| | Count | Which |
| --- | ---: | --- |
| Blocking | 10 | scopecheck, hookcheck, rootprops, livecheck, wordingcheck, dupcheck, blockdup, motioncheck, a11ycheck, escapecheck |
| Advisory | 4 | linkcheck, propcheck, deadcode, csscheck |

Also worth saying plainly, per the routine's own instruction: **19 files
live in `legacy/tools/`, not 15 checkers.** `build.py` and `build_harness.py`
are build machinery vite and the Phase 3 esbuild command already replace,
`loader.js` is the single-HTML-file boot loader vite also replaces, and
`mutate.py` is mutation testing, not a static check — ported separately, §6.

---

## 2. The table

One line per checker. "Costs if missing" is what stops being caught if this
check were deleted rather than landed.

| Checker | Outcome | Catches | Costs if missing |
| --- | --- | --- | --- |
| validate.js (braces, dup decls) | SUPERSEDED by `npm run build` | A mismatched brace or a duplicate top-level binding | Nothing — esbuild's parser rejects both before any test runs (demonstrated, §5) |
| jsxcheck.py | SUPERSEDED by `npm run build` | An unclosed/mismatched JSX tag | Nothing — esbuild's JSX parser rejects it (demonstrated, §5) |
| validate.js (calls, components) | PORTED WITH CHANGES → `linkcheck.mjs` | A call or JSX component that resolves to nothing declared, imported, or a real export of the file it's imported from | A `ReferenceError` that only throws when the code path runs — found two live ones, §4 |
| propcheck.py | PORTED WITH CHANGES → `propcheck.mjs` | A prop passed but never destructured, or an `on*` handler called but never received | A blank tab or a crash the moment the missing prop is read — found one live one (same bug `linkcheck.mjs` found from the other direction), §4 |
| scopecheck.py | PORTED WITH CHANGES → `scopecheck.mjs` | An identifier used in a component's hooks/derived-values region that's never declared, imported, or a prop | `Can't find variable` and a blank tab, on a path nothing renders in CI |
| hookcheck.py | PORTED WITH CHANGES → `hookcheck.mjs` | A hook called conditionally (not at exactly one indent level inside a top-level function) | A hook that runs only sometimes — broke the rules of hooks and hung the launch splash, unrecoverable, in the original incident |
| rootprops.py | PORTED WITH CHANGES → `rootprops.mjs` | A value the app root passes down that was never declared in the root's own scope | A blank screen with no error — the root component moved (§2 note below) |
| deadcode.py | PORTED WITH CHANGES → `deadcode.mjs` | A component never rendered, a function never referenced, an UPPER_SNAKE constant never read, the inverse (used, declared nowhere), and — new — a `useMemo` value computed and never read again | The shape that hid a real crash for weeks because nothing compiled the dead path; found 3 live unread `useMemo`s, §4 |
| livecheck.py | PORTED WITH CHANGES → `livecheck.mjs` | A config-table field, or an engine result field, read only by tests — never by the app | A fix and a test agreeing about a number the app never consults, silently |
| wordingcheck.py | PORTED, unchanged → `wordingcheck.mjs` | A dose claim in the tank summary that doesn't repeat `buildBriefing`'s own wording | The summary and the Dosing Wizard describing the same state in two different sentences that quietly drift apart |
| dupcheck.py | PORTED WITH CHANGES → `dupcheck.mjs` | 8+ identical lines shared between two whole function bodies, anywhere in `src/` | A fix landing in one copy of duplicated logic while another is quietly left behind |
| blockdup.py | PORTED WITH CHANGES → `blockdup.mjs` | 8+ line duplicated blocks inside/across functions, anywhere in `src/`, capped by a measured ceiling | The same "fixed in one place" class of bug as dupcheck, at finer grain — measured ceiling: 10 (§6 detail) |
| csscheck.py | PORTED WITH CHANGES → `csscheck.mjs` | A custom (non-Tailwind) class used with no CSS rule, or a rule nothing renders | A class styled by accident via an element selector, or CSS that silently stopped applying; found 3 live dead rules, §4 |
| motioncheck.py | PORTED WITH CHANGES → `motioncheck.mjs` | An animation declared outside the `prefers-reduced-motion` block | Motion someone who asked their device not to animate still has to sit through |
| a11ycheck.py | PORTED WITH CHANGES → `a11ycheck.mjs` | Text colour under 4.5:1 contrast against the page, or a missing/invisible `:focus-visible` ring | Text nobody can comfortably read, or keyboard navigation with no visible position |
| escapecheck.py | PORTED WITH CHANGES → `escapecheck.mjs` | A full-screen overlay (`fixed inset-0`) that doesn't call `useEscape` | A modal a keyboard user can open but not close |

---

## 3. What each one actually catches

From each docstring's real bug, not a paraphrase of the name:

- **validate.js (superseded half)** is "a build that silently produced broken
  output because two things declared the same name, or a brace never closed."
- **jsxcheck.py** is "a broken layout that passed every other check because
  nothing was tracking whether `<div>` had a `</div>`."
- **linkcheck.mjs (validate.js's surviving half)** is "a name that reads as
  defined because it exists *somewhere in the file*, when the file is 15,706
  lines and the name is actually a typo." Split into 58 modules, this becomes
  precise instead of a guess: a name is defined only if it's declared, a
  parameter, or actually exported by the file it claims to come from.
- **propcheck.mjs** is "a prop that's `undefined` inside the component the
  instant it's used — exactly how the Tasks tab broke."
- **scopecheck.mjs** is "`Can't find variable: editing` and a blank tab," on
  a path nothing renders, so nothing else exercises it.
- **hookcheck.mjs** is "a hook inserted inside the body of the very callback
  it needed to run alongside — called conditionally, throwing, and the launch
  splash could not be dismissed by the tap that was supposed to dismiss it."
- **rootprops.mjs** is "values handed down from the root that were actually
  computed inside a child component and never existed at the root — a blank
  screen with nothing in the console pointing at why."
- **deadcode.mjs** is "the shape that hid a real crash: `CA_PER_DKH_LO` used
  in seven places and declared in none, invisible because nothing compiled
  that path." Extended here to also catch a `useMemo` computed and never
  read again — the exact shape of the already-known `doseAdvice` finding.
- **livecheck.mjs** is "a fix and a test agreeing with each other about a
  number the app never consults" — alkalinity once graded steady at three
  times the published drift limit because the field that should have caught
  it was read only by the test that verified the fix.
- **wordingcheck.mjs** is "the tank summary and the Dosing Wizard describing
  the same dose state in two different sentences" — the only automated
  enforcement `wizard-states.md` §7/§12 has ever had.
- **dupcheck.mjs** is "a fix landing in one copy of duplicated logic while
  the other copies keep the bug" — the exact shape that once left
  `correctionInProgress` wired into alkalinity alone.
- **blockdup.mjs** is the same fault at finer grain: duplication *inside* a
  function that a whole-body comparison can't see, because the copies are
  interleaved with other code rather than being the whole function.
- **csscheck.mjs** is "a class styled by accident, working only until either
  side moves" — caught `sb-swatch` being styled by an element selector while
  the markup named a class.
- **motioncheck.mjs** is "the motion that's left over is precisely the
  motion nobody thought to check" — ten animations once sat outside the
  reduced-motion guard.
- **a11ycheck.mjs** is "text between 2.55:1 and 3.93:1 against the page, and
  no visible way to tell which control keyboard focus is on."
- **escapecheck.mjs** is "one modal of ten could be dismissed with Escape,
  and the other nine had no way out at all for a keyboard user."

---

## 4. Real findings — this port already earns its keep

Two ported checkers found live `ReferenceError` bugs on the first run, not
hypothetical ones: `App.jsx:1275` calls `goTo(...)`, which exists only
inside `Dashboard`'s own body; `Tasks.jsx:198` calls `onComplete(id)`, which
`Tasks` never receives (it receives `onMarkDone`). Both throw the moment a
real user taps the button that triggers them — "go to dosing" from the
log-result popup, "mark done" from a reminder sheet. `linkcheck.mjs` and
`propcheck.mjs` found the `onComplete` one independently, from opposite
directions, which is itself a small proof the port is sound.

`deadcode.mjs`'s `useMemo` extension found the two already-known `doseAdvice`
dead memos exactly where `.agent/five-decisions.md` said they'd be
(Insights.jsx:108, Dashboard.jsx:298) and a third, new one: `Tasks.jsx:27`
computes a water-change preview and never shows it to anyone.

`csscheck.mjs` found three dead CSS rules, one of them a real accessibility
gap (`.rc-modal`'s light focus ring never activates because the class it's
keyed to is never applied).

Full detail, evidence, and suggested fixes for all of these are in
`.agent/findings.md`. None of it was fixed here — `src/` was not touched,
per the routine's own rule. All four ported checkers that found something
land **advisory**, with `[blocked]` backlog items TW-021 through TW-023
naming exactly what closes each one out — see §7 below and `.agent/backlog.md`.

**Plain terms:** two buttons in the app are currently broken — tapping
"go to dosing" from a reading-logged popup, and marking a reminder done from
its detail sheet both crash instead of working. Neither was known before
this run. Fixing them is not part of this routine (this routine only builds
the checkers that found them), but they're written up and ready for an
implementer.

---

## 5. Superseded — demonstrated, not asserted

**validate.js's brace-balance and duplicate-declaration checks**, and
**jsxcheck.py's JSX-tag-balance check**, are superseded by `npm run build`
(esbuild, via vite). Demonstrated against scratch files, not asserted:

```
$ npx esbuild brace.js --bundle --outfile=/tmp/out.js
✘ [ERROR] Unexpected end of file
    brace.js:5:0

$ npx esbuild unclosed.jsx --loader:.jsx=jsx --bundle --outfile=/tmp/out.js
✘ [ERROR] Unexpected closing "div" tag does not match opening "span" tag
    unclosed.jsx:5:6
      5 │     </div>
        │       ~~~
        ╵       span
```

A duplicate top-level `const` in the same ES module is also a parse-time
`SyntaxError` under strict mode — not separately demonstrated here since it's
the same class of fault (a binding the parser itself rejects) as the brace
case above.

`npm run verify` runs `npm run build` as its first, cheapest step for exactly
this reason — a syntax fault fails in ~6 seconds, before any of the 58
application modules are individually scanned.

**Plain terms:** two of the fifteen old checks used to exist because nothing
else would catch a typo like a missing closing brace or an unclosed `<div>`.
The new build tool refuses to even start if either happens, so the check the
old script needed no longer needs to exist separately — trying to build the
app already does that job, and does it first.

---

## 6. The mutation results

`scripts/verify/mutate.mjs`, ported from `legacy/tools/mutate.py`. Same six
real faults, re-anchored to the new files (the monolith was one file; these
are six). Every anchor still existed, near-verbatim, when this was written —
checked before porting, not assumed:

```
$ node scripts/verify/mutate.mjs
  dose claim writes its own words             caught by wordingcheck.mjs
  calcium band drifts from the consensus      caught by legacy-port/husbandry
  records no longer guarded                   caught by legacy-port/malformed
  return dose replays the stored figure       caught by legacy-port/crosstalk
  unattended plans stop being timed           caught by legacy-port/crosstalk
  the dose-gap check removed                  caught by legacy-port/protocols
  source restored and verified
```

**6 of 6 caught.** `git status --short src/` confirmed clean after the run —
the restore-and-verify step (itself a mutate.py-era lesson: one mutation once
survived a run because the restore silently failed) held.

Two mutations moved from being caught by a JS behavioural test to being
caught by a *ported static checker instead*: the routine's own worked
example — "dose claim writes its own words" — is now caught by
`wordingcheck.mjs` before any test runs, not just by the behavioural suite
that used to be the only line of defence for it.

`blockdup.mjs`'s ceiling was measured fresh against this tree rather than
carried over from the monolith's calibration (10, coincidentally the same
number, on a differently-shaped 58-module tree): 10 duplicated 8+ line
blocks exist today; the ceiling is set to exactly that, with headroom
removed on purpose — a ceiling with slack is what let a whole pasted
function through once before.

`livecheck.mjs`'s second check (engine result fields nothing reads) ran
clean — 45 fields checked, 0 orphans — a real result, not evidence the check
can't fail: it uses the same read-count mechanism as the first half, which
`mutate.mjs` doesn't separately exercise (none of the six ported mutations
target a `livecheck`-shaped fault; that gap is inherited from
`legacy/tools/mutate.py`, which never had one either).

**Plain terms:** six specific ways this app has actually broken before were
deliberately reintroduced, one at a time, into the new code, and the new
checks caught every single one — then the code was put back and checked
byte-for-byte identical to before. This is the strongest evidence available
that the new gate isn't just green, it actually watches something.

---

## 7. The workflow

`.github/workflows/verify.yml` — one job, `verify`, runs on every pull
request and every push to `main`. Steps: checkout, Node 22 with npm cache,
`npm ci`, rebuild the esbuild test-harness bundle (the exact command from
`.agent/phase3-conformance.md` §0 — the `window` stub in its banner is what
makes `tests/legacy-port/` runnable at all), then `npm run verify`.

**No Python setup step.** All 15 legacy checkers were Python; all 14 ported
scripts are Node. This is a real simplification worth stating plainly: the
routine asked to note "Node 20 or 22, and the Python 3 the checkers need if
any survive as Python" — none did, so the workflow needs exactly one
language runtime.

`npm run verify` itself, measured on this tree: **~90 seconds**, dominated by
`legacy-port:sim/years` at ~68s (three years of simulated dosing per
scenario — the routine's own docstring for it: "a dose that never keeps up
only shows late"). Every static checker together is under 1.5 seconds; the
legacy-port behavioural suite is the cost, not the port.

A red build: any blocking step's non-zero exit stops the job; the log names
which one. The gate prints a table of every step, blocking and advisory, at
the end, so a red run shows exactly one row marked `FAIL` rather than a wall
of output to search through.

**`npm test` (vitest) is deliberately not wired into this gate.** It isn't
part of `legacy/verify.sh` — vitest didn't exist in the monolith — so porting
it was outside this routine's scope, and right now it's 69/261 tests red
across 32/44 files, every one already a labelled `SPEC VIOLATION` test
tracking an open, already-filed `[chem]` backlog item (TW-016 and others),
not a regression. Wiring it into the one required check today would make
every PR's required check red — including PRs with nothing to do with
chemistry — until dozens of pre-existing, [chem]-tagged items are approved
and closed. That's a real decision with a real cost either way, not made
silently here: it's flagged for Dan rather than decided.

**Plain terms:** every pull request now runs one check automatically instead
of nobody running anything by hand. It takes about a minute and a half, and
almost all of that time is the app being run through three years of
simulated tank days to make sure a slow-building problem would eventually
get flagged. A second, separate test suite that checks the app against the
full written spec (not just against itself) already exists and currently
disagrees with the app in 69 places — all already known, all waiting on
chemistry decisions only Dan can make, not on this gate.

---

## Did not port

Empty — see §1. No checker's fault class became impossible under ESM/vite;
every one either still applies (13, with the changes above) or the build
itself now closes the gap (2). Nothing is unguarded as a result of this
routine that wasn't already unguarded before it.

---

## `[deps]` and `[blocked]` items filed

- **TW-021** — `linkcheck`/`propcheck` advisory until the two real reference
  bugs they found (§4) are fixed.
- **TW-022** — `deadcode` advisory until its three unread `useMemo` findings
  (§4) are resolved or explicitly accepted.
- **TW-023** — `csscheck` advisory until its three dead-CSS findings (§4) are
  resolved, one of which needs a11y-reviewer's read.
- **TW-024** `[deps]` — `npm run lint` doesn't exist (AGENTS.md's Definition
  of Done requires it); eslint + `eslint-plugin-react-hooks` +
  `eslint-plugin-react` would give `linkcheck`, `hookcheck`, and `deadcode`
  real import/scope/control-flow resolution instead of the text-based
  heuristics this port uses, closing this gap and three coverage caveats at
  once. Not installed — Dan approves dependencies, AGENTS.md #6.

All four are in `.agent/backlog.md` under **Blocked**, each naming exactly
what moving the checker to blocking requires.
