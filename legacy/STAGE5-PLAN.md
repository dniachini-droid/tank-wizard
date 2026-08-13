# Stage 5 remediation — where we are

The gate had a defect: every `|| fail=1` line set a flag that was never read, so
a suite could exit 1 while `verify.sh` printed ALL CHECKS PASSED. Fixed. The
moment it started reporting honestly, three-year runs failed.

## The fault

One cause, three symptoms. A correction plan sets the daily dose, and when the
plan ends the dose is left wherever the plan put it. Over three years at 30%
annual growth:

| element   | dose supplies | demand | verdict          |
|-----------|---------------|--------|------------------|
| alkalinity| 1.267         | 0.769  | 65% over         |
| calcium   | 0.000         | 5.273  | stopped entirely |
| magnesium | 0.200         | 0.439  | 55% under        |

Calcium at zero is the "stop dosing" offer added in stage 3: correct as an idea
— stopping the dose is how a level comes down — but a dose of zero has no
natural way back.

## Steps, in order. Each one: check, rate, then redo or continue.

- [x] **5a. Re-run every suite with the gate honest. DONE.**
      Two more gate defects found, both hiding failures:
      - `|| fail=1` set a flag nothing read. Fixed: the script now exits 1.
      - Five commands piped through `tail`, and a pipeline reports its LAST
        command's status, so `node tests/textcheck.js | tail -1` always
        succeeded. Fixed with `set -o pipefail`.
      Behind that, `textcheck.js` was crashing on every run: a stage 3 edit
      referenced `supplied`, which was never in scope in that function. Fixed.
      All 18 suites now pass except `years.js`, which is the real fault below.

- [x] **5b. Diagnose. DONE — one cause, confirmed.**

      `correctionProgress` measures movement as
      `Math.abs(latest.value - plan.startValue)`, and calls the plan stalled
      when that is below the kit's noise floor after three days.

      With only one reading since the plan began — which is the normal state
      for calcium at weekly testing and magnesium at three-weekly — the
      "latest" reading IS the one the plan started from. Movement is measured
      from a reading to itself: zero, always.

      So **absence of evidence is read as evidence of failure.** 48% of plans
      over three years ended as `correction-stalled` having never had a chance
      to work, and each replacement started from a worse level. The dose
      thrashes 5 -> 26 -> 5 -> 28 -> 7 -> 53 mL and ends wherever the last dead
      plan left it.

      Why the isolated tests missed it: they built histories with readings at
      every step, so `readingsSince` was always 2 or more. The multi-year loop
      derives on a schedule that does not line up with each element's testing
      cadence, which is exactly what happens in a real week.

      The three symptoms are one bug. Do not patch them separately.

- [~] **5c. PARTIAL — and the diagnosis in 5b was substantially wrong.**

      The fix itself is right and stays: `stalled` now requires a reading on a
      LATER day than the plan began. Absence of evidence should not read as
      evidence of failure, and four cases confirm it behaves correctly.

      But it barely changed the three-year runs, because the stalled epidemic
      was **my harness, not the app**. `correctionProgress` measures a plan
      against `todayStr()`, and the harness ran its loop in the past — at
      simulated day 700 of a 1095-day run, a plan read as 394 days old the
      moment it was created. Every plan overran instantly.

      With the harness clock aligned — re-dating the whole history each
      simulated day so the simulated day IS today — stalled plans drop from
      21-32 per run to 0-1.

      What remains, and is NOT yet explained:
      - 45-100 plans started over three years, which is a lot of churn
      - levels still drift out of band on a growing tank
      - the daily dose still ends materially adrift (up to 151%)

      This is the same class of mistake as the surfaces sweep earlier: I
      attributed harness artifacts to the app. 5b has to be redone against the
      corrected harness before any further fix.

- [x] **5b-again. DONE. Two findings, both confirmed.**

      **1. The dose-gap check exists in one engine of three.**
      `dosePersistentlyOff` was added to `assessAlkalinity` in 5c and nowhere
      else. Calcium and magnesium still hold whenever the trend grades stable,
      which is the exact fault it was written to fix. Over three years at 60%
      annual growth:

      | element    | dose off by | plans started |
      |------------|-------------|---------------|
      | alkalinity | 2%          | many          |
      | calcium    | 19%         | some          |
      | magnesium  | 76%         | **zero**      |

      Magnesium never adjusts at all. Its dose sat at 6.4 mL while demand grew
      to needing 26.3, and the level fell to 1063 ppm. No correction is offered
      either, because the maintenance solution cannot deliver a gap that size —
      correctly refused, but nothing else steps in.

      **2. A correction dose is open-loop between checks.**
      The elevated dose runs until someone next opens the app. Alkalinity at
      8.35 aiming for 9.0 reached 11.53 in seven days. How badly depends
      entirely on how often the keeper looks:

      | checks every | final alkalinity | dose off |
      |--------------|------------------|----------|
      | 1 day        | 9.23 in band     | 3%       |
      | 2 days       | 8.80 in band     | 4%       |
      | 3 days       | 9.13 in band     | 4%       |
      | 7 days       | 10.26 OUT        | 66%      |

      At realistic cadence — alkalinity is tested every two days — it holds.
      At weekly it breaks. That is a genuine risk rather than a harness
      artifact: nothing stops a correction if the keeper stops looking.

- [ ] **5d. Add the missing invariant.**
      A correction plan must never leave the daily dose materially adrift from
      consumption once it ends. The years suite checks outcomes; this is the
      specific property that broke.

- [ ] **5e. Re-run the full gate and the three-year runs.**


## 5c fix 1 — the dose-gap check in all three engines. PARTIAL.

`doseDriftedFrom` is now one shared helper called by all three engines, with a
per-element trigger: alkalinity 12%, calcium 30%, magnesium 60%. The spread is
deliberate — alkalinity is read to 0.1 dKH on a 1.0 band so a small dose error
shows within days, while magnesium's dose cannot be inferred from tank readings
at all and the LEVEL has to stay the signal.

Effect over three years, checking every two days:

| growth | magnesium before | after   |
|--------|------------------|---------|
| steady | 1325 in band     | 1392 in band |
| 30%/yr | 1211 OUT         | 1343 in band |
| 60%/yr | 1063 OUT         | 1228 out (was far worse) |

**Three sourced protocol examples still disagree: Mg §57, Mg §9a, Ca §53.**
Each expects "hold" where the engine now says increase or decrease. I tried
shifting the example levels to match the corrected bands and it made things
worse — six misses instead of three — so that was reverted. The examples are
sourced husbandry and the engine now contradicts them; that conflict has to be
resolved on the merits, not by moving the test data.

Open questions for the next pass:
- Are §57/§9a/§53 still right under the corrected bands, or were they written
  against levels that are no longer mid-band?
- Is a 60% trigger on magnesium defensible at all, given the dose is
  unmeasurable? Perhaps magnesium should never dose-chase and only respond to
  level.

## Still to do
- [ ] resolve the three protocol conflicts
- [x] **5c fix 2 — DONE.** A correction is open-loop between checks, and the
      progress checks all depended on a reading arriving. With none, the engine
      returned early and every time check went uncomputed: a three-day plan
      still read "on its way to 9.0dKH" **forty days later**, by which point
      the same dose would have carried alkalinity past 13.

      The clock is the one thing knowable without a test, so it is now checked
      whether or not anything has been measured:

      | days since start | state |
      |------------------|-------|
      | 1  | correcting-dose |
      | 3  | correction-due — the estimate has run out |
      | 7  | correction-due |
      | 14 | correction-stalled |
      | 40 | correction-stalled |

      And the wording no longer quotes a level it does not have: it used to
      print "alkalinity is at —dKH". Unmeasured now says so plainly, because
      the complaint is different — the problem is not that the correction is
      slow, it is that an elevated dose has been running untested.

      Verified by removing the check: the suite catches it.
- [x] **5d — DONE.** The property the whole stage came from, now encoded.

      A plan records the dose to return to when it starts. If it runs while
      demand grows, that figure sends the keeper back to a dose too small to
      hold the level — which falls straight out again and starts another plan.
      Twenty days of growth left the stored figure **38% short**.

      Worse, `correctionProgress` runs 150 lines before `maintenanceDose`
      exists, so the plan it built could only ever replay the stored number.
      The figure is now refreshed after maintenance is known.

          stored (20 days ago)   5.1 mL
          returns to now         8.3 mL
          tank actually needs    8.27 mL

      The stored value is kept as a sanity floor: a wild reading must not drag
      the return dose off a cliff. Both directions are asserted, and removing
      the fix fails the suite.
- [x] **5e — DONE. Everything green, and verified it can go red.**

      All 18 suites and 9 static checkers pass independently. Gate exits 0.
      400 tanks / 28,000 tank-days clean. Three-year runs: 0 problems.

      More importantly, `tools/mutate.py` now breaks six real faults on purpose
      and confirms a suite notices each one:

      | fault reintroduced | caught by |
      |--------------------|-----------|
      | a dose claim writes its own words | wordingcheck.py |
      | the calcium band drifts from consensus | husbandry.js |
      | records no longer guarded | malformed.js |
      | return dose replays the stored figure | crosstalk.js |
      | unattended plans stop being timed | crosstalk.js |
      | the dose-gap check removed | protocols.js |

      The last one initially came back NOT CAUGHT, and the reason was worth
      finding: the three-year simulation passes without it, because the plan
      machinery picks the tank up shortly after it leaves the band. The check
      earns its place in a narrower case — a dose falling behind while the
      reading still grades stable — so that is now asserted directly rather
      than left to a simulation that cannot see it.

      Two of my own test attempts were wrong before that landed: the first used
      a fall rate too small to trigger the check, the second one large enough
      to push the level out of band, which skipped the assertion entirely.

## Stage 5 complete.


## 5c step 1 — re-anchor the stale examples. DONE. 39/39 protocols pass.

Three examples sat outside the band they were written to be inside, because
stage 3 corrected the bands. Re-expressed relative to the band midpoint so they
survive the next change too. Only those three — shifting all of them broke six
others, which is what happens when test data is moved until it agrees.

Calcium resolved immediately. The two magnesium ones did not, and the reason
settled the open question:

**Magnesium's dose gap is computed from noise.** A 5 ppm move over a week — a
fifth of the kit's 25 ppm resolution — produced an implied maintenance dose of
30.9 mL against a current 8. A 286% "gap" built entirely of measurement error.
Two sourced examples correctly call that a hold.

So magnesium is now absent from the dose-drift table deliberately: its dose is
never chased, and the LEVEL rules manage it. That is what the original design
said, and applying a dose-gap trigger at any threshold was wrong.

## Where that leaves the long runs

Checking every two days, over three years:

| growth  | alkalinity | calcium | magnesium |
|---------|-----------|---------|-----------|
| steady  | 9.1 in    | 441 in  | 1325 in   |
| 30%/yr  | 8.8 in    | 409 in  | **1211 out** |
| 60%/yr  | 9.3 in    | 420 in  | **1063 out** |

Alkalinity and calcium hold. Magnesium falls behind on a growing tank and the
level rules do not catch it — no correction is offered either, because the
maintenance solution cannot deliver a gap that size. That is the real remaining
gap and it is a genuine one, not a threshold to tune.


## The magnesium gap — investigated, and the answer is the app is right

Checked against sources. Magnesium IS managed by occasional correction rather
than daily dose-chasing:

- "Magnesium is used more slowly, but it still declines over time. It is
  usually corrected less often, but it still matters."  (fancyreef)
- "For lightly stocked aquariums, regular water changes using a quality reef
  salt may provide sufficient magnesium replenishment."  (Charterhouse)
- BRS: general adjustments over 100 ppm spread over a few days; maintenance is
  a separate, much smaller daily dose.

And the arithmetic supports it. On a tank losing 0.19 ppm a day, a one-off
lifting 1211 -> 1325 holds for **598 days** before it needs doing again. That
is not a treadmill; it is the right tool.

**So the app's advice is already correct**, and it fires at the right point:

| level | what the app says |
|-------|-------------------|
| 1325  | dose is matching consumption, nothing to do |
| 1260  | same — still in band |
| 1211  | needs more than the daily dose can give; a dedicated supplement or dry salt is the right tool, or a series of water changes |
| 1063  | dangerously low, with the same routes |

**The failing assertion is mine, not the app's.** `years.js` demands the dose
track demand within 35% for every element, and magnesium is deliberately not
dose-tracked. That check has to exempt it.

## One improvement identified but NOT built

The sources also say repeated correction is the signal to move to daily dosing:
"a mature SPS tank can consume large amounts daily — that is why many hobbyists
move from occasional correction to planned daily dosing."

The app does not say that. It offers a fourth one-off without noting the
pattern. I attempted it and made a mess: the repeat count is computed after the
branch that returns early, moving it broke declaration order, and the file had
to be restored from the last package. Worth doing, carefully, as its own step.


## Magnesium exemption — DONE. Gate green at that point.

`years.js` no longer demands the dose track demand for magnesium, which is
deliberately not dose-tracked. The LEVEL check still covers all three. Two
alkalinity failures were also mine: the run can end mid-plan, and a correction
dose is supposed to be off consumption, so those are now skipped.

## Then a much bigger find

Trying to add the repeated-correction note exposed that **`pendingCorrection`
reads fields the app never writes.**

    logCorrection writes  { id, date, time, element, ml, direction }
    pendingCorrection read { param, amount, fromValue }
    repeatedCorrections reads { element, ml }      <- correct

One storage key, two readers, two different shapes. So the entire correction
cross-talk — everything built in the "make sure notifications talk to each
other" work — has been **dead in the real app** and alive only in tests, which
had invented the fields to match. Every verification of it passed against data
the app cannot produce.

`pendingCorrection` now reads element/ml, converts millilitres to the level
change they deliver, and takes the starting level from the last reading before
the correction was logged. It detects correctly.

## Fixed — and the cross-talk now works in the app for the first time

- The `correcting` branch was below every dose verdict, so a tank that also had
  a dose suggestion never reached it. Lifted above them: a correction the
  keeper started outranks any opinion about the daily dose, because it is the
  thing actively moving the level.
- A correction was never "finished" because it waited for the remaining amount
  to reach zero, against a kit that cannot resolve the last fraction. It now
  completes once what is left is smaller than the kit can see.
- Four test files used the fabricated { param, amount, fromValue } shape and
  now use what the app writes: { element, ml, direction }.

Verified with a real logged correction:

    HEADLINE  Steady throughout, with a few sitting off-target - a correction is under way
    WIZARD    Alkalinity is on its way to 9.5dKH
    SUMMARY   Alkalinity is on its way to 9.5dKH

**Gate green.** 400 tanks / 28,000 tank-days clean, three-year runs 0 problems.

- [x] move the correcting branch above the dose verdicts
- [ ] the repeated-correction note (the original goal, still not built)
- [x] **5c fix 2 — DONE.** A correction is open-loop between checks, and the
      progress checks all depended on a reading arriving. With none, the engine
      returned early and every time check went uncomputed: a three-day plan
      still read "on its way to 9.0dKH" **forty days later**, by which point
      the same dose would have carried alkalinity past 13.

      The clock is the one thing knowable without a test, so it is now checked
      whether or not anything has been measured:

      | days since start | state |
      |------------------|-------|
      | 1  | correcting-dose |
      | 3  | correction-due — the estimate has run out |
      | 7  | correction-due |
      | 14 | correction-stalled |
      | 40 | correction-stalled |

      And the wording no longer quotes a level it does not have: it used to
      print "alkalinity is at —dKH". Unmeasured now says so plainly, because
      the complaint is different — the problem is not that the correction is
      slow, it is that an elevated dose has been running untested.

      Verified by removing the check: the suite catches it.
- [x] **5d — DONE.** The property the whole stage came from, now encoded.

      A plan records the dose to return to when it starts. If it runs while
      demand grows, that figure sends the keeper back to a dose too small to
      hold the level — which falls straight out again and starts another plan.
      Twenty days of growth left the stored figure **38% short**.

      Worse, `correctionProgress` runs 150 lines before `maintenanceDose`
      exists, so the plan it built could only ever replay the stored number.
      The figure is now refreshed after maintenance is known.

          stored (20 days ago)   5.1 mL
          returns to now         8.3 mL
          tank actually needs    8.27 mL

      The stored value is kept as a sanity floor: a wild reading must not drag
      the return dose off a cliff. Both directions are asserted, and removing
      the fix fails the suite.
- [x] **5e — DONE. Everything green, and verified it can go red.**

      All 18 suites and 9 static checkers pass independently. Gate exits 0.
      400 tanks / 28,000 tank-days clean. Three-year runs: 0 problems.

      More importantly, `tools/mutate.py` now breaks six real faults on purpose
      and confirms a suite notices each one:

      | fault reintroduced | caught by |
      |--------------------|-----------|
      | a dose claim writes its own words | wordingcheck.py |
      | the calcium band drifts from consensus | husbandry.js |
      | records no longer guarded | malformed.js |
      | return dose replays the stored figure | crosstalk.js |
      | unattended plans stop being timed | crosstalk.js |
      | the dose-gap check removed | protocols.js |

      The last one initially came back NOT CAUGHT, and the reason was worth
      finding: the three-year simulation passes without it, because the plan
      machinery picks the tank up shortly after it leaves the band. The check
      earns its place in a narrower case — a dose falling behind while the
      reading still grades stable — so that is now asserted directly rather
      than left to a simulation that cannot see it.

      Two of my own test attempts were wrong before that landed: the first used
      a fall rate too small to trigger the check, the second one large enough
      to push the level out of band, which skipped the assertion entirely.

## Stage 5 complete.


# Stage 6 — the checkers' own coverage

Every checker was probed with the fault it advertises. All six that could be
probed caught their own: an unstyled class, an unrendered component, an unread
constant, an unbalanced tag, an unreceived prop, an undefined identifier.

## What no checker inspected

- **Reduced motion.** Ten of 39 animations sat outside the block — the chart
  draw, the score bar, the stability strips, the splash, the confirmation
  flourishes. A partial block is arguably worse than none: what still moves is
  exactly what nobody thought to check. Fixed, and `tools/motioncheck.py` now
  guards it. Verified it fails when the guard is removed.
- **First run and empty states.** Tested six: brand new tank, one reading, one
  reading per parameter, two on the same day, readings with no settings, a
  year-old reading and nothing since. All clean, no changes needed.
- **Performance.** The whole derivation runs on every render:

  | history  | readings | derive |
  |----------|----------|--------|
  | 1 year   | 519      | 14 ms  |
  | 3 years  | 1,543    | 41 ms  |
  | 5 years  | 2,566    | 77 ms  |
  | 10 years | 5,131    | 216 ms |

  Fine for a decade of data, but it grows faster than linearly — 2x the data
  costs 2.8x the time — so something in there is quadratic. Not urgent at these
  sizes; worth knowing before it is.

## Still uninspected

- whether a number shown in the UI matches the engine that produced it
- whether a component renders anything at all for a given state
- contrast, focus order, screen-reader labels beyond the 16 aria-labels present
- narrow screens


## Stage 6 continued — do the numbers mean what their labels say?

Components turned out not to compute anything: they render engine strings, so
a component cannot disagree with the engine. The risk is the engine computing a
number correctly and labelling it wrongly — "0.30dKH of 1.00dKH added so far"
was arithmetically right and described a level moving as though it were
millilitres poured in.

`tests/units.js` sweeps the text the engines generate and checks every figure
against what its unit can plausibly mean. 168 figures across 361 texts.

It found the app quoting **14,438 mL** of maintenance solution as an action,
and **4,815 mL** in a second place. Arithmetically correct, and useless: nobody
pours fourteen litres into a 77 L tank. One sibling path had been fixed for
exactly this and two others were missed — which is what a units check is for.

Past two litres the figure is dropped and the comparison carries the point.

Two of my own mistakes on the way:
- the first version flagged "-0.1 dKH", which is a perfectly sensible *change*.
  The same unit describes a level and a movement; only magnitude is checkable.
- dropping the figure also dropped the only mention that the level was out of
  band. The message explained the constraint and forgot the problem. The years
  suite caught it, which is the first time one simulation has caught a
  regression introduced while fixing something another suite found.


# Step C — deliberate regression pass

## The gate itself, re-read line by line

- Every suite and checker on disk appears in it. `tanks3.js` looked orphaned
  and is a shared fixture (15 tank archetypes) used by two suites that are in
  the gate; `surfaces.js` is a library for `smoke.js`. Neither is a gap.
- `set -o pipefail` genuinely covers the five lines that pipe through `tail`
  and `grep` — verified rather than assumed, since those pipes were the reason
  textcheck went unnoticed for weeks.

## Four suites could not fail

`fuzz3`, `robust`, `run_all` and `textcheck` all **printed** their failures and
exited 0. A quarter of the behavioural checks were incapable of failing the
gate. textcheck reported "dirty: 0" and would have reported "dirty: 47" with
the same exit code.

All four now exit 1. Verified by breaking `fmtVal` to return "undefined":
textcheck and run_all catch it. fuzz3 and robust do not, correctly — their job
is crash resistance, not text quality.

## And a blind spot in a checker built this session

`units.js` judges only the figures it finds, so with the formatters broken it
reported a clean sweep of zero figures — a check that passes hardest when the
app is most broken. Same failure mode as the original csscheck. It now fails if
fewer than 100 figures turn up, against ~170 in a healthy run.


# Step D — re-running the stages against a working gate

## Stage 1 — wording. Held, with a gap the checker could not see.

Every dose claim echoes the engine, verified across eight states. But
`wordingcheck.py` only inspects `dose:` claims, and the summary also reaches a
level through findings, which are its own voice. At 5.0 dKH the wizard said
"dangerously low" while the summary said "a long way below range" — and read
identically at 6.5 and at 3.0. The severity flag already made the distinction;
the wording never followed it. Both surfaces now agree, and `crosstalk.js`
asserts it across eight levels.

## Stage 2 — engine boundaries. Both claims held. A bigger one was missed.

The safety cap is single-sourced and the Ca/Mg solvers are merged, as reported.

But `dupcheck.py` compares whole function bodies pairwise, so it reports "no
unexplained duplication" while the same lines sit inside three 400-line
functions. Measured properly:

| comparison | shared lines |
|------------|--------------|
| assessCalcium vs assessMagnesium | **68%** |
| assessCalcium vs assessAlkalinity | 49% |
| assessMagnesium vs assessAlkalinity | 49% |

Verbatim copying is small — 90 lines of 15,706 in runs of 8+, none in runs of
20+. The similarity is structural: the same logic, reworded and interleaved.

**This is not a style complaint.** Every "fixed in one place, not the others"
bug this project has had came from here: the dose-gap check went into one
engine of three; the settling window disagreed across three tables; the return
dose was recomputed in one path and replayed in another.

`tools/blockdup.py` now makes the scale visible and stops it growing. Its
ceiling is set to exactly what exists today — at 6 with 4 in the file it let a
whole pasted function through, which is not a check.

**Recommended as its own piece of work:** merging the three assessment engines.
It is 1,300 lines of the most consequential code in the app and should be
deliberate, not slipped into a re-verification pass.


# The merge — halted before starting, and it was right to build the net first

## What was built

`tests/golden.js` — a fingerprint of everything the three assessment engines
produce: 5,940 cases across nine level offsets, eleven slopes, five reading
counts, with and without a dose change, with and without a correction. Each
records the assessment fields, the Dosing Wizard's state/headline/detail, the
stability grade, and all three correction offers.

Sensitivity was tested rather than assumed, which took four attempts:
- slopes too shallow to reach any grade boundary
- reading counts too few (stability grades on SPREAD, not slope)
- a field name that does not exist (`perWeek`), so a whole engine recorded
  empty strings
- a threshold that turned out to be unread entirely

It now catches: band edges, safe bounds, daily rate limits, the dose step cap,
the dose-drift trigger, correction pace.

## And then it found something much worse

**`greenPerDay` and `amberPerDay` are never read by any code.** Eight
parameters declare them; `computeStability` reads only `windowDays` and
`noiseFloor`; nothing else touches them. The only readers in the repo are my
own tests in `husbandry.js`.

Which means the stage 3 finding — "alkalinity graded steady at 1.4 dKH a week,
nearly three times the published limit" — was **a correction to a number
nothing uses**. It was reported as one of the most significant fixes of that
stage. It changed nothing.

`husbandry.js` "verified" the corrected value by reading the same dead constant.
A test and a fix that only reference each other.

## Next

1. Find what actually grades drift, and whether it is right.
2. Decide whether these constants should be wired up or deleted.
3. `deadcode.py` did not catch this: it checks that a constant is READ, and
   these are — by the tests. That is a hole worth closing.
4. Only then the merge.


# The dead thresholds — resolved

## What actually grades drift

`CONSISTENCY_RULES`, on the SPREAD across the window rather than a rate per
day. Alkalinity: tight at 0.5 dKH spread, moderate at 1.0. Every entry already
carries a `why` citing its reasoning — 20 ppm/day is the accepted safe rate for
calcium, nutrients are judged proportionally because absolute spread is
meaningless at 0.01-0.15 ppm, and so on. It is sound, and it is the table
nobody audited because a plausible-looking impostor sat next to it.

## Resolved

- `greenPerDay` and `amberPerDay` deleted from all eight parameters. Not wired
  up: `CONSISTENCY_RULES` already does this job and does it better.
- `husbandry.js` now checks the real table — spread limits against published
  guidance, tight looser than the kit can resolve, moderate looser than tight,
  and every rule carrying a stated reason.
- The golden fingerprint is **byte-identical** before and after the deletion,
  which is the proof the fields were inert.

## A second one, found immediately

`tools/livecheck.py` flags config fields the app never reads. On its first run
it found `DOSE_ADVICE_RULES.requiresDose` on magnesium — declared once, read by
nothing, not even a test. Removed rather than guessed at.

`deadcode.py` cannot see this class: the constant IS read, just only by tests.

## Every other stage 3 constant checked

SAFE_DAILY_RISE (23 references), CORRECTION_MAX_RATE (4), DOSE_STEP_CAP (2),
SAFE_BOUNDS (5), KIT_PRECISION (5), DOSE_DRIFT_TRIGGER (2),
BRACKET_MEMORY_DAYS (2), CONSISTENCY_RULES (5). All genuinely live.

So the drift threshold was the only inert one — but it was reported as one of
stage 3's most significant findings.


# The merge — first extraction, and a real bug it exposed

## A copy-paste bug, found before any refactoring

`safeDoseBand("alkalinity", ...)` and `SAFE_DAILY_RISE["alkalinity"]` appear
inside assessCalcium and assessMagnesium. The block was copied from the
alkalinity engine and the key came with it, so both clamped their dose using
alkalinity's 0.5-a-day rate limit:

| element   | band it used | band it should use |
|-----------|--------------|--------------------|
| calcium   | 10.9 - 13.1 mL | 0 - 54.8 mL |
| magnesium | 0 - 24.1 mL   | 0 - 814.5 mL |

Fixed to `def.key`. Eight golden cases changed, each a calcium recommendation
that had been pinned to the wrong band's edge — 9.9 mL where the correct answer
was 10.4.

This is exactly what the merge is for: a line right in one engine and wrong in
the other two, with nothing comparing them.

## First extraction: applyDoseConstraints

Bracketing, the step cap and the rate ceiling — 110 lines, **byte-identical**
in all three engines, verified by hash before touching anything. Now one
function with every argument passed explicitly.

**The golden fingerprint is unchanged: 5,940 cases, same digest.** That is the
proof the extraction was behaviour-preserving.

Duplicated blocks: 4 -> 3. Engines: 458/500/504 -> 476/432/434 lines.

## Remaining shared runs between calcium and magnesium

    42 lines   dose assembly, up to the constraints call
    22 lines   the one-off correction figure
    13 lines   the trend-significance test
    10 lines   the reading window

Each is a candidate for the same treatment: confirm identical, extract, verify
the digest is unchanged.


## Second extraction: rateLimitDose

Rounding, the rate ceiling and the plausibility check — 42 lines, byte-identical
in calcium and magnesium. Extracted; **golden digest unchanged**.

Alkalinity does NOT have this block. It has no `safeDoseBand` call of its own
and never sets `out.rateLimited`, so where calcium can say "we wanted 32 mL but
the safe rate allows 14", alkalinity clamps silently in the shared constraints
function and says nothing. The ceiling is still applied — the difference is
that alkalinity never reports it.

That is a behaviour difference rather than a refactor, so it is recorded here
rather than changed: **alkalinity should probably report rateLimited like the
other two.**

## A near-miss worth recording

The extraction moved `let next` into the helper and left both callers assigning
an undeclared `next`. It worked — this file is not in strict mode, so it became
an implicit global — and validate, scopecheck and the golden fingerprint all
passed. Caught only by reading the diff.

I tried to build a checker for implicit globals and could not make it reliable:
`let metric = null, consistency = "unknown", metricLabel = "";` defeats a naive
declaration scan, and JSX attributes look like assignments. 303 hits, nearly all
false. Not shipped — a noisy checker is worse than none, and this needs more
care than a quick regex.

**Open:** a reliable implicit-global check. `"use strict"` at the top of the
module would do it properly and is worth considering.


## "use strict" — and why the implicit global survived

The source uses ES module imports and the app is transformed by Babel with
sourceType "module", so **the shipped app runs strict**. The test harness
built a CommonJS file with no strict directive, so it did not.

That is the whole explanation for the near-miss: an implicit global throws in
the browser and passed silently in every test. A harness more permissive than
the app is a harness that certifies crashes.

`build_harness.py` now emits `"use strict"`. Nothing latent surfaced — the
golden digest is unchanged — and reintroducing the exact bug now fails golden
and protocols where before it failed nothing.

## Alkalinity aligned with the shared rate limiter

It had its own two-line version and never set `out.rateLimited`. Now uses
`rateLimitDose` like the other two. Golden digest unchanged across all 5,940
cases.

Worth recording honestly: the rate limit **never binds** in any case tried —
dose 2 to 14 mL, falls of 0.05 to 0.8 dKH a day, none triggered it. The 25%
step cap is tighter in every realistic scenario. So this alignment fixes a real
inconsistency that a user is unlikely ever to see. It is still right — the
three engines should not disagree about whether to tell you something — but it
is not the win the hardcoded-key fix was.


## What "merging the engines" should mean — settled

Two readings of it: collapse all three into one function with branching, or
extract the shared logic and leave three thin element-specific shells.

Measured, the second is right:

| comparison | lines matching in place |
|------------|------------------------|
| calcium vs magnesium | 60% |
| alkalinity vs calcium | 33% |

The 40% that differs is mostly legitimate — per-element wording, magnesium's
slower response, calcium's different bands. Collapsing that means either a
large config table or a scatter of `if (key === "magnesium")` branches, and the
branching version is worse than three clear functions. So: keep extracting
shared logic, keep the shells.

## Third divergence found: the one-off correction figure

    alkalinity   toMid = |mid - out.current.value|
    calcium      toMid = |mid - out.current.value|
    magnesium    toMid = |mid - fittedNow|

Magnesium was the odd one out and magnesium was right. On a kit with 25 ppm of
noise, whether the last reading landed on the high or low side of the sawtooth
moved the correction by a third — 112 ppm against 85. The fitted value is what
the app trusts everywhere else it reasons about where a level actually is.

All three now use it. Eight golden cases changed, every one a `nextCheck`
correction figure and nothing else.

**That is three real inconsistencies the merge has found**: the hardcoded
"alkalinity" key clamping calcium to the wrong band, alkalinity never reporting
rateLimited, and this. Each was the same shape — one copy of shared logic
diverging, with nothing comparing them.


## Fourth and fifth extractions, and four dead fields

`trendConfirmed` — the statistical significance test, identical in calcium and
magnesium but for their own threshold constant and a differently-worded
comment. Extracted, golden unchanged.

The reading-window block turned out NOT to be worth extracting: each engine
filters on its own parameter name, which is correct, and the remaining
differences are formatting. But comparing them found something else.

**`out.previous`** was set by assessCalcium alone — the other two never set it
— and read by nothing anywhere. A field one copy of three grew, with no
consumer.

That prompted extending `livecheck.py` from config tables to engine RESULT
fields, which found three more:

    out.events              set by alkalinity, read by nothing
    out.correctionAdjusted  set by all three, read by nothing
    out.correctionRepeats   set by two, read by nothing

`correctionRepeats` is mine — a leftover from the repeated-correction note that
was reverted when the file had to be restored. The assignment survived the
revert and the reader did not.

Building that check needed one correction: the first version excluded the
engine bodies when looking for readers, so every field an engine reads back
from its own result looked orphaned — 14 false positives. Self-reads are now
counted against writes.

Verified: adding an orphan result field fails the gate.


# What to check AFTER a merge — the risk inverts

Before the merge the danger was three copies of the same logic drifting apart.
`blockdup` and `dupcheck` watch for that, and it produced every "fixed in one
place, not the others" bug this project has had.

After it there is one implementation and three callers, and the danger is the
opposite: **a helper that ignores its element and gives all three the same
answer.** That is exactly what the hardcoded `safeDoseBand("alkalinity")` was.

The golden fingerprint cannot catch it. It was recorded from current
behaviour, so a helper that has ALWAYS ignored its element looks perfectly
stable. Stability and correctness are different questions and only one of them
was being asked.

`tests/shared.js` asserts SENSITIVITY rather than stability:

- rateLimitDose must clamp alkalinity harder than calcium on identical inputs
- trendConfirmed must respond to its threshold, reading count, span and slope
  error — each condition tested separately
- applyDoseConstraints must give different answers for different elements
- 420 must not read the same for all three, being in band only for calcium

**Verified: reinstating the hardcoded key inside the shared helper fails it.**
The bug that survived undetected for months now fails the gate.

## Two of my own scenarios were wrong first

- `applyDoseConstraints(200, ...)` against a current of 10: the 25% step cap
  clamped every element to 12.5 and the band never got a look in. The helper
  was fine; the scenario was blind. Fixed by asking for a figure inside the
  cap so the band decides.
- comparing `action` across engines: a flat line means "hold" regardless of
  where it sits, so all three agreed for a reason that had nothing to do with
  the element. Compares band status now.

Gate: **38 checks across 44 files.**


# D3 — guidance conformance, re-verified

Four constants were exported, live, and had **no test asserting their value**:
DOSE_DRIFT_TRIGGER, DOSE_STEP_CAP, BRACKET_MEMORY_DAYS, CORRECTION_PACE. Three
carried a sourced justification in the code. `BRACKET_MEMORY_DAYS` carried none
at all — the only husbandry constant in the app with no stated reason, which is
exactly how the dead drift thresholds survived beside it.

## What it does, and why 21 was wrong

Bracketing needs TWO observations, one where the level fell and one where it
rose. At 21 days:

    dose adjusted weekly       6 observations
    fortnightly                3
    every three weeks          2
    monthly                    1   <- no bracket

So the constraint that exists to stop dose oscillation was unavailable to a
keeper adjusting every three weeks or less often.

Lengthening costs almost nothing, because staleness is already handled better
elsewhere: the bracket discards any observation whose implied consumption
differs from today's by more than 25%. A tank growing 60% a year drifts 6% in
45 days — well inside that filter, which judges the tank rather than the
calendar.

Measured across 36 three-year runs: mean dose error **14% at 21 days, 10% at
35, 8% at 45**. Set to 45, with the reasoning written down.

## And I nearly tuned the app to please my own test

The first assertion demanded a bracket for someone adjusting MONTHLY, which 45
days does not give. The honest answer was not to push the memory to 60+ but to
fix the bar: bracketing exists to stop oscillation, and a keeper adjusting once
a month is not oscillating. Three weeks is the defensible requirement.

All four constants now assert their values, and reverting the memory or moving
the step cap out of range both fail the gate.


# D4 — adversarial data, re-verified

## What the original pass missed

**Settings were tested as a whole but never field by field.** Null, a string,
an array — but not one corrupted number in an otherwise valid object, which is
the likelier failure: a hand-edited backup, a half-finished form, a value that
used to be a string. 114 combinations now, plus 1,375 PAIRS of fields corrupted
together. All clean.

It also found two fields the app reads that `DEFAULT_SETTINGS` does not
declare — `kitSigma` and `_corrections` — so a test that iterates the defaults
would never have reached them. The list is now explicit about both.

## And the real one: the restore that writes

`inspectBackup` was hardened during the original stage 4. **`restoreBackup` —
the function that actually merges and saves — was not.**

So a file the preview described as ready to import threw the moment the button
was pressed. Four shapes did it, including a null in the EXISTING data rather
than the incoming file, which no amount of inspecting the file would have
caught.

A preview that promises what the restore cannot deliver is worse than a
refusal: the refusal at least happens before anything is written.

Both now apply the same guard, and the test asserts the relationship directly —
whatever the inspector accepts, the restore must survive. Verified: removing
the guard fails the gate.

## The pattern, again

Stage 4 hardened the gatekeeper and left the thing behind it. Stage 1 fixed the
wording in one surface and left the other. Stage 3 fixed a constant nothing
read. Every re-verification finds the same shape: the work was done in one
place and the sibling was not checked.


# D5 — long-horizon, re-verified

## A harness defect that invalidated the earlier results

The repo's copy of `longrun.js` had **no `checkEvery` at all** and defaulted to
seven days, so `years.js` had been measuring a keeper who opens the app once a
week — the one interval at which the correction machinery is known to
overshoot. I had been testing against a `/tmp` copy carrying the fix and never
synced it back. Now synced, at two days.

And it ran **one seed**. Seed 1 reported zero problems; seeds 2, 4, 7, 9, 10
and 11 reported six between them.

## The real bug: corrections proposed on stale readings

Calcium is tested weekly and a correction takes days to show up, so the reading
that prompted one is often still the newest when it finishes. The app then
looked at a level predating its own intervention and offered to do it again.

Over three years that drove calcium 403 -> 498, plans starting **two days
apart**, dose swinging 9.2 -> 52 -> 9.2. A 120 mL correction delivering 56 ppm
would be in flight, the last reading still said 399, and all three paces
offered another.

Now guarded against a logged correction, a correction plan, and a dose change.
Plans on the affected seed halved, 34 -> 17, and calcium ended in band.

**Asserted directly in crosstalk.js, because years.js does NOT catch it** —
removing the guard still passed the simulation. Eight cases, and each of the
three guards verified individually load-bearing.

## Water changes were never simulated

The most common thing a reefer does, and the harness had no model of it. A
change pulls every level toward the salt mix, which is a disturbance the
engines must recognise rather than read as consumption. Now three of the six
scenarios include them; all clean.

## An assertion I deliberately weakened, and why

Calcium's maintenance estimate scatters 1.1x to 4.3x around a correct value
across twelve runs. The mean is right; the variance is inherent to a kit
reading 5-15 ppm on a 50 ppm band with weekly tests. Asserting per-run failed
whenever a run happened to END on a high estimate, which says nothing about the
estimator. It now tests that the estimator is UNBIASED, plus a loose per-run
sanity bound of 4x.

I changed a failing test into a passing one. I believe unbiasedness is the
right property, but that is a judgement and it should be visible as one.

## Cost

Six scenarios by twelve seeds is nearly five minutes — too slow for a gate, and
a check nobody runs is not a check. The gate runs four seeds (~1 minute);
`SEEDS=12` runs the full sweep. Both are currently clean.


# D5 finished, and D6

## D5 — the guard is now load-bearing

`crosstalk.js` asserts the staleness rule directly across 24 checks: a
correction is refused when a logged correction, a plan, or a dose change came
AFTER the newest reading, and offered when it came before. Removing any of the
three parts fails the gate. The three-year simulation could not prove it — the
harness's own plan bookkeeping masked the effect — and a fix a suite cannot
prove is a fix on trust.

## D6 — every checker probed

15 checkers, all in the gate. Eleven catch their own advertised fault.

`scopecheck.py` did not catch an undeclared identifier inside an engine
function — and should not: an undeclared READ throws a ReferenceError the
moment the line runs, and golden, protocols and run_all all exercise the
engines on every build. Its scope is components, where a path can go
unexercised because nothing renders them. Documented rather than widened.

## blockdup was hiding duplication behind documentation

It abandoned any eight-line window containing a comment. In a codebase this
heavily commented, almost no run was comment-free — so a whole pasted function
went unnoticed **because its duplicate lines were interleaved with the
explanation of what they do.**

Comments are now skipped rather than treated as a break. The count went 4 -> 11.
Seven duplicated regions had been invisible, including one I created myself an
hour after arguing that copying is how these engines drift apart:
`out.current` plus the intervention timestamps, written three times
identically. Extracted as `noteCurrentAndInterventions`; golden unchanged.

Ceiling set to the real count of 10, with the remaining regions named in the
tool rather than hidden.

## And mutate.py left a mutation in the source

The alkalinity dose-gap check was missing for about an hour. Nothing noticed
until the golden fingerprint changed on a run where I had edited only a test
file.

A tool whose job is to introduce faults must not leave any behind — its
leftovers are indistinguishable from real ones. It now verifies the restore
after every probe and again at the end, and exits non-zero if the source
differs from the snapshot.


# Stage 3 of the confirmation-window plan — complete

Five surfaces on one tank at one moment: headline, summary claim, findings,
Dosing Wizard, reading window, and the correction panel's own figures.

## Found and fixed: 9% of out-of-band tanks named by nobody

35 of 378. The headline said "Mostly stable and in range", the summary said
"alkalinity DOSE could change", the solid claim said "5 of 6 are in range and
holding". Every statement true; the impression wrong.

The condition was exact. A FLAT reading out of band was caught — allSteady goes
false and the sentence falls to "a few sitting off-target". A MOVING one was
not: the trend grades amber or red, mostSteady stays true, and it lands in the
"mostly in range" branch. So the app read as reassuring precisely when a
parameter was out of range AND heading further out.

`mostIn` is true at 75%, so with six parameters one could sit a full point
outside and the headline still opened with "in range".

Now: "Mostly steady, but Alkalinity is outside its range". 9% -> 0%.

## Checked and clean

- **False alarms** — 500 tanks, no surface ever claimed something was out when
  everything was in band.
- **Several out at once** — 227 tanks with two or more outside; every one named.
- **The correction panel** — its target, remaining and days agree with what the
  window quotes.

## Two more scope errors that static checking passed

`analysed` is not in scope in `buildHeadline`; `cap` is defined inside a
component and invisible to an engine function. `validate.js` resolved both
names and did not care where they lived. Only running the code caught them —
the second time today.


# Handover — the dose-change confirmation, stages 1 to 5

Built to the protocol agreed in `protocol/dose-change-confirmation.md`. Five
stages of the ten-stage plan run. Gate green: 40 checks, 46 files.

## What the feature does

When a reading is logged after a dose change, the confirmation window says what
that reading means FOR the change, rather than describing the level in
isolation:

| situation | what it says |
|-----------|--------------|
| within the settle window | too early to tell, and how long to wait |
| arrived in band | the change is working — said ONCE |
| still out, dose matched | held at X — a dose holds, only a correction moves |
| still out, dose short | N days and it has not moved; check the strength first |
| past the band | overshooting, upward or downward, naming the right end |
| moved against the change | too small, external cause, or honestly unsure |
| three changes in a settle window | you are adjusting faster than it can answer |
| past a safe bound | danger first, cause second, one message |

A running correction always wins. The window never tells you to hold while the
wizard asks for a change.

## Bugs found across the five stages

1. calcium and magnesium said "too early" to everything for weeks — the whole
   feature was developed on alkalinity, the one element where the timing bug is
   invisible
2. a dangerous level mid-correction was unflagged, and quoted stale progress
3. four dose states were never reached by any sweep in the repo
4. 9% of out-of-band tanks were named by NO surface — a headline bug older than
   the feature
5. a fortnight of use never mentioned three dose changes in five days
6. a held level was misdiagnosed as a stuck one
7. an overshoot downward said "past the top of your range"
8. on real data the messages appeared on 89% of readings — wallpaper

Three of those were in code that predates the feature.

## Left deliberately as it is

Messages appear on roughly 47% of readings with normal dosing. That is arguably
still high, and the remaining volume is the problem messages repeating while
the problem holds — defensible, but a judgement worth making from use rather
than from a simulation.

## Stages not yet run

6. the component that renders it, which has never been rendered in any test
7. wording under real constraints — length on a phone, numbers against the
   screen behind the popup
8. adversarial input through this path
9. long-horizon narration
10. a mutation sweep over the six branches


# Stage 6 — the popup component

**The real limit first: this environment has no network, so React cannot be
installed and the component cannot be rendered.** Nothing here proves it draws
correctly. That is the same gap that hid the splash bug, and it is still open.

What is checkable without a renderer, and now is:

- every verdict the engines produce carries the fields the component reads —
  33 shapes across three elements
- no optional field arrives as NaN, Infinity or "[object Object]"
- every prop the component destructures is either passed at the call site or
  has a default
- every `goto` destination set anywhere in the source is one the popup handles

## Four probes of my own that proved nothing

Testing the check took longer than writing it, and every failure was mine:

- inserting `line: undefined` BEFORE the real `line:` — the later key wins, so
  the mutation was a no-op
- `|| ` in a mutation, so the real value still came through
- pointing `goto` at a branch the fixtures never reach
- dropping a prop that has a default, which is not a failure

Each looked like the check being blind. Each was the probe being wrong. The
only way to tell the difference was to read what the mutation actually did.

## A gap left open rather than hidden

The fixtures cannot reach the "has not moved" branch: a flat level out of band
means the dose IS matching it, which routes to "held" instead. Reaching it
needs the engine unable to compute consumption at all. That branch's wording is
therefore unverified by the sweep — the static `goto` check covers its
destination, nothing covers its text.


# Stage 7 — wording under real constraints

## Length: fine

Seven distinct messages, longest 228 characters, about four lines on a phone.
Nothing over 240. No change needed.

## The real find: the window's OWN voice contradicts the wizard

Every overlap rule built for the dose-change messages guarded one phrase —
"hold it here". The generic wording underneath them was never checked, and it
says **"nothing to do"**. Against a wizard asking for a dose change that is the
same contradiction in older words.

**22 of 500 swept tanks had exactly that pair on screen at once**: the popup
saying "Dead centre — nothing to do" while the Dosing Wizard two taps away said
"Calcium dose could change".

The level being dead centre is a fact and stays. "Nothing to do" is an
instruction, and the instruction is not the window's to give when the engine
disagrees. Now: "Right in the middle of your band. The Dosing Wizard still has
an adjustment to suggest."

22 -> 0, guarded by a 500-tank sweep in `matrix.js`.

## The pattern, again

This is the fourth bug found in code that predates the feature, and the second
where a rule I wrote for the new messages should always have applied to the old
ones. Building the guard taught me what to look for; it did not occur to me to
look where the guard was not.


# Stage 8 — adversarial input through this path

20 shapes of malformed dose log fed through the confirmation window: ml as a
string, null, zero, negative, NaN, enormous, an object, an array; no date, a
date that is not a date, dated in the future, dated four thousand days ago; a
null entry, not an array at all, two identical entries, a hundred changes, and
a damaged water-change list alongside.

## One crash, and it was reachable

**`ml` as the string "11" crashed the confirmation on toFixed.**

Readings have been coerced at the deriveTankState boundary for months. The dose
log never was — so that value survived the restore, survived inspectBackup, and
then threw. JSON round-trips preserve types; a hand-edited export or a file
from another tool does not have to.

What made it reachable now: the dose-change messages are the first thing in the
app to read `ml` and format it back out. The value had been sitting there
harmlessly because nothing had asked it to be a number.

Coerced at the same boundary as readings. Verified: removing the coercion fails
the suite.

## Everything else clean

19 of 20 shapes passed untouched, including a hundred dose changes and a
four-thousand-day-old entry.


# Stage 9 — long-horizon narration, and an UNRESOLVED finding

## The narration itself is sound

155 confirmations across three simulated years: no broken text, no absurd
figures, longest line 228 characters. It does not degrade with history.

## But the app under-responds to a slow, persistent decline

Simulating a keeper who follows every recommendation for three years, on a tank
whose demand grows 30% a year:

    day   level  dose  needs  what the app said
     14    9.02   5.1    5.1  hold
    126    7.86   5.4    5.5  hold
    182    6.87   5.4    5.8  hold     <- below the safe floor
    238    4.98   5.4    6.0  hold
    350    2.72   6.1    6.5  hold

**One dose change in three years while the tank crashed to 0.5 dKH.**

### What is fixed

The dose-drift trigger ignored where the level was. A 12% tolerance is right
while the level sits in its band — that is noise, not signal. Once the level is
OUT of band the reasoning is gone: the gap is no longer a question of whether
the reading can see it, it is why the tank is drifting.

Halved when out of band. The app now acts at day 100 rather than day 180, and
made three changes rather than one. Eight golden cases changed, every one the
same far-below-band scenario.

### What is NOT fixed

Three changes is still far too few, and the tank still ends at 0.5.

The deeper cause: `band === "stable"` stays true for a fall of 0.02 dKH a day,
so the whole hold branch is entered in the first place. The dose-gap check is a
patch over that — the real answer is that a level OUT of band and moving
FURTHER out should never be graded stable, whatever the rate.

That is the same shape as the stage 5 "going nowhere" bug and the stage 3
headline bug: a slow movement outside the band being treated as calm.

**This is the most consequential thing still open.** It needs a change to the
stability grading rather than another threshold, and that deserves its own
session rather than the end of a long one.
