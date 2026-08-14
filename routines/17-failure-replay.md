# Routine 17 — Failure Replay

Run as a cloud routine. **Read-only: this routine changes no application code,
no spec, no tests, no constants.** Its entire output is one report,
`.agent/failure-replay.md`, plus the PR that carries it.

---

## The question

The legacy repo documents specific, reproducible failures with numbers
attached. On 14 August 2026 seven bugs were fixed in the modular code
(routine 15, summarised in `.agent/phase6-bugs.md`), and two constants
changed with them — the alkalinity band 8.5–9.5 → 8.2–8.8 dKH (PR #23) and
the magnesium correction rail 100 → 25 ppm/24h (PR #25).

**Do the documented failures still happen?** Not "do the tests pass" — the
tests already pass (Phase 3, `.agent/phase3-conformance.md`). The question is
what *numbers* each engine produces when driven through the same simulated
years, and whether the failure modes are still present, reduced, or gone.

---

## The four documented failures

Quote each of these in the report, with its source line, before the
measurements. They are the baseline being replayed.

**F1 — the hold-forever crash.** Three simulated years, demand growing 30% a
year, a keeper following every recommendation: alkalinity reached 6.87 dKH on
day 182 — below the safe floor — while the wizard said "hold", and kept
falling to 2.72 by day 350. Barely any dose changes across the whole run
while the tank crashed. Source: `legacy/STAGE5-PLAN.md` (the day/level/dose
table near line 1251).

**F2 — corrections stacking on stale readings.** Calcium driven 403 → 498 ppm
over three years by corrections proposed on readings that predated the app's
own intervention: plans starting two days apart, dose swinging
9.2 → 52 → 9.2 mL. Source: `legacy/STAGE5-PLAN.md` ("The real bug:
corrections proposed on stale readings", near line 953).

**F3 — no stop condition on a running correction.** Calcium reached its band
and kept climbing to 702 ppm, because the weekly cadence put the two
confirming readings a fortnight away while the elevated dose kept running;
alkalinity ran to zero on a downward correction the same way. Sources:
`legacy/AGENTS.md:106-111`, `legacy/protocol/correction-spec.txt:194-200`,
`legacy/tests/sim/smoke.js:8-11`.

**F4 — plans killed as stalled having never had a chance.** 48% of plans over
three years ended `correction-stalled` when the only reading since the plan
began was the one it started from — movement measured from a reading to
itself, always zero. Source: `legacy/STAGE5-PLAN.md` §5b (near line 46).

**Carry F4's own caveat, prominently.** STAGE5-PLAN §5c re-diagnosed the 48%:
most of it was the *harness*, not the app — the original loop ran in the
past, so every plan read as hundreds of days old at creation. With the clock
aligned (which the preserved `legacy/tests/sim/longrun.js` now does — see its
"Shift every date so the simulated day IS today" block), stalled plans fell
to 0–1 per run before any app fix. The honest replay of F4 measures the
residual stalled fraction under the corrected harness. Do not present 48% as
a purely-app defect; the report must say what §5c says.

**A second framing caveat, for all four.** These failures were found *and
fixed inside the legacy repo* during its Stage 5 — the preserved
`legacy/` passes its own suite. So the expected shape of this replay is not
"legacy fails, current passes". It is a margin measurement: how far from each
failure does each engine now run, and did 14 August widen or narrow that
margin — or reopen anything.

---

## THE RULES

1. **Never write anything under `legacy/`** (AGENTS.md #9). Copy out, work on
   the copies, in a scratch directory outside the repo tree (the session
   scratchpad). Nothing from scratch or `build/` gets committed.
2. **No application code, spec, test, or constant changes.** However obvious
   a fix looks, file it in the report. This routine authorises nothing.
3. **The copied harnesses run unmodified.** Both `invariants.js` and
   `crosstalk.js` require `../build/engines.js`, and `sim/longrun.js`
   requires `../../build/engines.js` — so a scratch tree that mirrors that
   layout needs **zero edits, not even the require line**. If you find
   yourself editing a threshold, an expected value, or a seed, stop: you are
   about to destroy the finding.
4. **One instrumentation exception, narrowly drawn.** The measurements need
   per-day calcium and magnesium levels, and `longrun.js`'s `trace` records
   only alkalinity. You may make **one additive recording edit** to the
   *scratch copies* of `longrun.js`: extend the existing `trace.push(...)`
   (line 97) to also record `level.calcium` and `level.magnesium` (and
   their doses). Recording only — no logic, no thresholds, no control flow.
   The edit must be byte-identical in both scratch trees, and the report
   includes its diff. Prefer, where a number is already reachable from
   `run()`'s return value (`planLog`, `doseChanges`, `level`, `trace`),
   reading it from there in a separate driver script instead of editing
   anything.
5. **Report measurements, not pass or fail.** A green harness is context, not
   an answer. Every claim in the report is a number one engine produced next
   to the number the other produced.
6. **Everything is "under the simulator's assumptions."** `longrun.js` has
   its own model of tank behaviour — compounding demand, fixed kit noise
   (`NOISE`), fixed testing cadences (`CAD`: alk 2d / Ca 7d / Mg 21d), a salt
   mix of alk 8.8 / Ca 440 / Mg 1320, consumption that stops at zero. None of
   that is a fact about Dan's tank. Every finding is phrased "under the
   simulator's assumptions", never as fact about the app in use.
7. **Attribute before you conclude.** Bands and rails changed as well as
   logic. Where the engines differ, say whether the difference traces to a
   changed *constant* or a fixed *defect* — §"Attribution" below lists the
   known constant changes and the structural unfairnesses of the comparison.
   "Different, cause not determined" is an acceptable classification;
   a difference silently credited to the bug fixes is not.
8. **Checkpoint contract applies** (AGENTS.md). Scan `.agent/runs/` first and
   recover any dead run; write your own `.agent/runs/<run-id>.md` and update it
   at each step boundary. Write the report incrementally —
   F1's measurements are worth having even if the run dies before F4.

---

## The mechanism — two bundles, two identical scratch trees

Build both engines as CommonJS bundles named `build/engines.js`, each at the
root of its own scratch tree, with identical copies of the harnesses beside
them:

```
<scratch>/legacy-run/            <scratch>/current-run/
  build/engines.js                 build/engines.js
  tests/invariants.js              tests/invariants.js
  tests/crosstalk.js               tests/crosstalk.js
  tests/sim/{years,longrun,rng,smoke,surfaces}.js   (same)
```

**Legacy bundle.** Copy `legacy/tools/build_harness.py` and
`legacy/src/reef-console.jsx` into `<scratch>/legacy-run/` preserving the
`tools/` + `src/` layout the script expects (it resolves ROOT from its own
location), then run it there. This is exactly how Phase 3 did it — the
original under `legacy/` is never rebuilt in place. It prints
`harness built: N exports`; record N.

**Current bundle.** The Phase 3 command, verbatim
(`.agent/phase3-conformance.md` §0), with the output pointed into the scratch
tree:

```
npx esbuild src/test-surface.js --bundle --platform=node --format=cjs \
  --outfile=<scratch>/current-run/build/engines.js \
  --banner:js='global.window=global.window||{storage:null,localStorage:null,matchMedia:()=>({matches:false})};' \
  --loader:.jsx=jsx
```

The banner mirrors the `window` stub `build_harness.py` bakes in, so both
engines run under an identical shim.

**Sanity gate before any measurement:** run `legacy/tests/golden.js` (copied
alongside, with `legacy/tests/golden.json`) against each bundle. Legacy must
print the preserved fingerprint `37ded9064e91e80e`. The current bundle's
fingerprint matched on 14 August (Phase 3) but PRs since (#22's golden
re-record among them) mean it may legitimately differ now — record whatever
it prints. If the *legacy* bundle's fingerprint is wrong, the bundle is
mis-built; stop and fix the build, not the tests.

---

## Order of work

### Step 1 — the three harnesses, unmodified, both engines

Run each and capture full output. These print their own measurements; record
the numbers, not just the exit codes.

- `node tests/sim/years.js` — 6 scenarios × 4 seeds (the gate default),
  three simulated years each, checked every two days. Prints per-run problems
  and the summary line `three-year runs: … problems, slowest derivation …ms`.
- `INVARIANT_RUNS=6000 node tests/invariants.js` — 6,000 randomised
  assessments; record the violation counts per property.
- `node tests/crosstalk.js` — record every `checked` / `failures` line it
  prints, and specifically the stale-reading blocks: "no correction on a
  stale reading", "corrections wait for a fresh reading", and "return dose
  tracks demand". Those blocks are the direct probes for F2.

Same commands, both trees. Any run that crashes outright is itself a
finding — report the error verbatim and carry on with the rest.

### Step 2 — the measurement driver

Write `replay-measure.js` in each scratch tree (identical files). It requires
`./tests/sim/longrun.js` and re-runs the exact `years.js` gate grid — the six
`SCENARIOS`, seeds 1–4, and the same opts (`volumeL: 77`,
`cons0: { alkalinity: 0.35, calcium: 2.4, magnesium: 0.2 }`, `days: 1095`,
`neglectSpells: [[400,440],[800,830]]`, `checkEvery: 2`, the scenario's
growth and water-change settings, `waterChangeL: 12`). Copy those opts from
`years.js` — do not retype them from memory. From each run's return value and
(instrumented per rule 4) trace, compute per scenario × seed:

- **min and max level per element** over the whole trace, with the day of
  each extreme;
- **days spent below 7.5 dKH alkalinity** (the documented "safe floor"), and
  below each fixed reference floor 8.2 and 8.5 — fixed references, so both
  engines are measured against the same rulers as well as their own;
- **dose-change count** (`doseChanges`) per element;
- **plan statistics from `planLog`**: plans started, plans ended, ends by
  `via` (`correction-done` / `correction-due` / `correction-stalled`), the
  stalled fraction, and the minimum gap in days between successive plan
  starts for the same element;
- **dose swing**: min and max daily dose per element across the run;
- **end levels** and end dose vs. end consumption (`level`, `dose`, `cons`).

Aggregate across the 24 runs per engine: worst-case and median for each of
the above. The four failures then read off directly:

| Failure | The replay number, legacy vs current |
| --- | --- |
| F1 | min alkalinity + days below 7.5/8.2/8.5 + alk dose-change count, in the growth-1.3 scenarios especially |
| F2 | max calcium, min gap between calcium plan starts, calcium dose swing; plus the crosstalk stale-reading block counts from step 1 |
| F3 | max calcium and min alkalinity across *all* runs — how close does either engine get to 702 / 0 |
| F4 | stalled fraction of all ended plans (the documented figure was 48%) + plans-started churn per run |

### Step 3 — the F3 annex (bounded)

F3's canonical reproduction was a correction lifecycle in `sim/smoke.js`, not
`years.js`. If step 2's max-calcium figures leave F3 unmeasured (both engines
far from any correction overshoot because `years.js` seldom runs corrections
hot), run `node tests/sim/smoke.js` in both trees as a clearly-labelled
annex — default 60 tanks, record its printed per-surface disagreement counts
and any level extremes it reports. This is the one permitted addition beyond
the three named harnesses; label it as an annex, and if you skip it, say in
the report that F3 was measured only through `years.js` and how far that
falls short.

### Step 4 — new failures, the more valuable finding

Diff the two engines' outputs from steps 1–3 looking for anything **current
produces that legacy does not**: a harness failure line, an invariant
violation, a level extreme, a plan-churn pathology, a stalled plan, a slower
derivation past the 250 ms line. For each, give the number from both engines,
the scenario/seed/case that produces it, and a first-pass attribution
(constant, known 14-Aug fix, or unknown). Rank these above everything else in
the report: a regression the fixes introduced matters more than confirmation
that old failures stayed fixed. If the section is empty, it still appears,
saying so and saying what was compared.

---

## Attribution — read before writing any conclusion

Differences between the engines have at least four causes that are **not**
fixed defects. Check each difference against this list before crediting it to
14 August:

1. **The alkalinity band moved: 8.5–9.5 → 8.2–8.8.** And `longrun.js` reads
   `PARAM_DEFS` and `DEFAULT_SETTINGS` from the bundle under test — so the
   simulated tank *starts* at each engine's own band midpoint (legacy 9.0,
   current 8.5), targets differ, and the harness's own out-of-band check
   judges each engine against its own goalposts. Raw levels are comparable;
   band verdicts are not. This is why rule 5's fixed reference floors exist.
2. **The magnesium rail moved: 100 → 25 ppm/24h** (`correction.js`). Any
   magnesium correction pacing difference traces here first.
3. **The salt mix sits differently in the two bands.** The simulator's water
   changes pull toward alk 8.8 — the top of the current band, mid-low in the
   legacy band. Water-change scenarios are therefore structurally easier or
   harder per engine for reasons that are the simulator's, not either
   engine's.
4. **Known 13-Aug deltas that the sims deliberately never see** (Phase 3 §4):
   magnesium `defaultStrength` 1.0 → 0.024 and the `volumeL` fallback removal
   never fire, because the harness supplies both explicitly. Do not cite them
   to explain anything here.

Where a difference survives all four — same ruler, same scenario, different
number — then map it to a specific routine-15 fix (`.agent/phase6-bugs.md`
bugs 1–7, most plausibly bug 2's negative-consumption hold, bug 3's dose-gap
and grading change, or bug 7's arrival zone) or mark it *cause not
determined* with what you tried.

---

## Output — `.agent/failure-replay.md`

Both layers per AGENTS.md rule 11: every finding stated twice, the precise
version (figures, units, scenario/seed, `file:line`) then the same thing in
plain reef-keeping terms — no code identifiers in the plain layer.

Structure, in this order:

1. **Header** — date, both bundle builds (export count, fingerprints), the
   instrumentation diff from rule 4, and the sentence "every number below is
   under the simulator's assumptions, not a fact about the app in use."
2. **New failures** (step 4) — first, even if empty.
3. **F1–F4**, one section each: the documented quote and source line; the
   replay numbers, legacy and current side by side; the verdict — **still
   present / reduced / gone** — with its attribution per the section above;
   then the plain-language layer. F4's section carries the §5c harness-clock
   caveat in both layers.
4. **Harness counts** (step 1) — the three suites' printed measurements per
   engine, as context.
5. **Closing paragraph** — one paragraph, both layers, answering: **did
   14 August make the app better, and by how much?** "By how much" means
   numbers from this replay — margins widened or narrowed, failures gone or
   moved — hedged to the simulator's assumptions. If the honest answer is
   "mostly unchanged, the constants moved the goalposts", write that.

---

## Finish (AGENTS.md #13)

Branch `claude/<date>-failure-replay`, commit `.agent/failure-replay.md`
(and the updated `.agent/runs/<run-id>.md` / run log — never `build/`, never
scratch, never anything under `legacy/`), push, open the PR with the
template's What / Why / Risk / Verification, both layers. What breaks if the
report is wrong: Dan trusts a margin that isn't there — say so in Risk. Never
merge.
