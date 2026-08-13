# Working on this codebase

Read this before changing anything. It is short because most of it is one idea.

## The one rule

**`./verify.sh` must pass before and after your change.** It is the gate. If it
fails, the change is not finished, however reasonable it looks.

```
./verify.sh
```

## What this app does

It tells a reef keeper whether to change their alkalinity, calcium or magnesium
dose, and by how much. Wrong advice kills coral. That is the whole reason the
checks are as heavy as they are.

## The five things that have actually gone wrong

Every one of these passed a test suite at the time. They are listed because the
same shapes recur.

1. **The engines were never connected to the screen.** Three dosing engines
   computed correct answers into a variable no component read, while an older
   engine drew the UI. Invisible for weeks: the tests confirmed the engines, and
   the engines were fine.
   → *Check that what you compute reaches a component.*

2. **A shared window reset.** Water changes restarted the alkalinity assessment,
   so a weekly water change left it one reading to reason from. Every tank
   answered "hold" and that read as agreement.
   → *Uniform output across varied inputs is a symptom, not a pass.*

3. **A displayed value nobody measured.** The fitted trend line was shown where
   the reading should have been: the kit said 1520, the app said 1540.
   → *Decision inputs must not leak into displayed text.*

4. **A constant used in seven places and declared in none.** Any call to
   `computeIonicBalance` threw. Found only when unrelated dead code was removed
   and forced a rebuild.
   → *A passing suite tells you what it exercised, not what is correct.*

5. **Dismissing an emergency kept it dismissed.** Dismissal was keyed to a
   finding's wording, and urgent titles are deliberately plain — ammonia at
   0.4 ppm and 1.5 ppm read identically.
   → *Ask what happens when the situation gets worse.*

## Rules that follow

- **Never widen a safety limit to make a test pass.** `SAFE_DAILY_RISE` and the
  settling periods exist because a swing harms coral more than a wrong-but-stable
  number. If a change needs them relaxed, the change is wrong.
- **A one-off correction can only ever add.** Nothing you dose lowers alkalinity,
  calcium or magnesium. Coming down is dosing less and waiting.
- **The daily dose is maintenance.** It tracks consumption. It is never the lever
  for moving a level — that is a correction, and for magnesium usually needs a
  stronger solution than the maintenance bottle.
- **Show measured values, decide on fitted ones.** `fittedNow` decides range
  membership; `current.value` is what the user sees.
- **One engine per question.** Two components answering the same question from
  two engines will eventually disagree. It has happened twice.
- **Comment the why, not the what.** Especially the constants — a threshold with
  no reasoning behind it gets "tuned" until the tests pass.

## Layout

```
src/reef-console.jsx     the whole app, single file, no build step
tools/build.py           produces the deployable single-page HTML
tools/build_harness.py   extracts the engines for testing — run first
tools/*.py, *.js         static checks
tests/protocols.js       39 worked examples from the protocol documents
tests/invariants.js      properties over random input
tests/*.js               scenario and fuzz suites
verify.sh                the gate
```

## Scope for an agent

Good: "add a pH engine following docs/protocols/ph.md; all 39 existing protocol
examples must still pass." Bounded, and the finish line is mechanical.

Bad: "keep improving the app." Produces drift, and drift here means dosing
advice that nobody asked for and nobody checked.

## What the checks cannot do

They confirm the code runs and that the numbers obey their stated properties.
They do not confirm the app says something true on screen. Four real bugs were
found by a person opening the app and thinking "that is not right". Keep a human
looking at it.

## Checking a change

`./verify.sh` — about 30 seconds. Run it before starting work as well as after,
so a failure is known to be new rather than pre-existing. Twice in development
time was lost proving a fault that was already there.

Two layers, and they catch different things:

- **The unit suites and invariants** check properties of a single assessment.
  Fast, precise, and blind to anything that only shows up over time.
- **`tests/sim/smoke.js`** runs whole tanks through whole correction lifecycles
  and checks that five surfaces agree on every simulated day: the headline,
  the tank summary claims, the findings, the Dosing Wizard, and the reading
  confirmation window. A correction with no stop condition ran calcium to 702
  ppm and alkalinity to zero while every unit property still passed, because
  each individual assessment was correct. Only running the days in sequence
  showed it.

For a wider net before shipping: `node tests/sim/smoke.js 400` — 28,000
tank-days, about 30 seconds.

## Adding a checker

Verify it fails on a deliberate violation before trusting it. `csscheck.py`
reported OK for months while only inspecting a fixed prefix list, so a whole
new class family went unstyled and the green light meant nothing. A checker
that cannot fail is worse than no checker, because it buys false confidence.

The smoke sweep guards against its own version of this: it fails if the run
never exercised the correction states, so a sweep that quietly stops covering
anything cannot report success.
