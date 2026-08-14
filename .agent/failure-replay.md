# Failure Replay — routine 17

14 August 2026. Read-only against `legacy/`; no application code, spec,
test, or constant changed. Every number below is under the simulator's
assumptions (`legacy/tests/sim/longrun.js`'s model of tank behaviour —
compounding demand, fixed kit noise, fixed testing cadences, a fixed salt
mix, consumption that stops at zero), not a fact about the app in use.

**Bundle builds.**

| | legacy | current |
| --- | --- | --- |
| build tool | `legacy/tools/build_harness.py`, run from a scratch copy | `npx esbuild src/test-surface.js` (Phase 3 §0 command, verbatim) |
| exports | 196 (`harness built: 196 exports`) | 198 named exports (`Object.keys(require(...))`, esbuild doesn't print a count) |
| golden fingerprint | `37ded9064e91e80e` — **matches** the preserved value | `fbac65244f00ac9b` — differs. Expected: PRs since Phase 3 (#22's golden re-record among them) legitimately changed output. Not a build error — the bundle's own regression baseline (`tests/legacy-port/golden.json`) is the one to check for that, not this replay. |

Golden sanity gate: legacy matched, confirming the legacy bundle is built
correctly (rule per the routine — if legacy's fingerprint were wrong, the
build itself would be the bug). Current's mismatch is recorded, not
investigated further; it is out of scope for a replay comparing simulated
years, and Phase 6 (`.agent/phase6-bugs.md`) already accounts for output
changes since 14 August.

**Instrumentation** (the one permitted additive edit, rule 4, byte-identical
in both scratch trees — `tests/sim/longrun.js`, replacing the line-97
`trace.push`):

```diff
       trace.push({ day, level: level.alkalinity, dose: dose.alkalinity, cons: cons.alkalinity,
-        state: d ? d.state : '-', head: d ? d.headline : '-' });
+        state: d ? d.state : '-', head: d ? d.headline : '-',
+        calciumLevel: level.calcium, calciumDose: dose.calcium,
+        magnesiumLevel: level.magnesium, magnesiumDose: dose.magnesium });
```

Recording only — no threshold, no control flow, no logic touched. Both
harnesses' three suites (`years.js`, `invariants.js`, `crosstalk.js`) and
the F3 annex (`smoke.js`) ran with the *unmodified* harnesses first, before
this edit was ever made, so their pass/fail counts (§ Harness counts below)
are untouched by it. Two further files were written, run against both
scratch trees, and never committed: `replay-measure.js` (the step-2 driver,
re-running the exact `years.js` grid and reading `level`, `dose`, `cons`,
`trace`, `planLog`, `doseChanges` off `run()`'s return value — nothing it
reads required touching the harness) and two small diagnostic scripts used
only to inspect specific `planLog` entries named in the New Failures section.

**Methodology caveat, stated once, applies everywhere below.** `trace` is
sampled every 60 days (`longrun.js:95`, `day % 60 === 0`) — 19 points per
run, 456 across the 24 scenario x seed runs per engine. Levels between
samples are invisible to it. Where a figure below says "trace-sampled
min/max", read it as a bound, not the true extreme — the real peak or
trough could be worse. Where a figure instead comes from `planLog` (exact
level *at that plan event*, no sampling), it is called out as exact. The
"days below floor" figures are **60-day checkpoints below the floor**, not
calendar days — 19 checkpoints per run, not 1,095 daily readings; the
routine's own working header calls them "days below" and this report keeps
that name for continuity with the routine's table, but the number itself
counts checkpoints.

**Attribution key** (cited by number throughout — differences to check against
these before crediting them to a 14 August fix or defect, per the routine's
own Attribution section):

1. **The alkalinity band moved: 8.5-9.5 -> 8.2-8.8 dKH.** `longrun.js` reads
   `PARAM_DEFS`/`DEFAULT_SETTINGS` from the bundle under test, so the
   simulated tank *starts* at each engine's own band midpoint (legacy 9.0,
   current 8.5) and is judged against its own goalposts. Raw levels are
   comparable; band verdicts are not.
2. **The magnesium rail moved: 100 -> 25 ppm/24h.**
3. **The salt mix (alk 8.8) sits differently in the two bands** — the top of
   current's band, mid-low in legacy's — so water-change scenarios are
   structurally easier or harder per engine for reasons that are the
   simulator's, not either engine's.
4. **13-Aug deltas the sims never see** (magnesium `defaultStrength`,
   `volumeL` fallback removal) — the harness supplies both explicitly, so
   neither ever fires here. Not cited to explain anything below.

---

## New failures — current overshoots further than legacy when a correction plan runs into a neglect spell

**This is the headline finding of the replay**, ranked above the F1-F4
section per the routine's step 4: something current produces that legacy
does not, at a magnitude worth Dan's attention.

**Precise.** Across the 24 runs (6 scenarios x 4 seeds) per engine, filter
`planLog` for `ev:"end"` events whose day falls within 4 days of either
neglect spell (`[400,440]` or `[800,830]`) — a plan whose lifecycle
overlapped a blackout in test readings. Legacy has 4 such events; current
has 6. Of those, the ones ending `correction-stalled` (the plan ran out its
schedule with no fresh reading to confirm or cancel it) are:

| Engine | Scenario / seed | Day | Level reached (exact, `planLog`) | Plan `need` (ppm-equiv/day) | Dose that ran the whole spell |
| --- | --- | --- | --- | --- | --- |
| legacy | a steady tank, seed 2 | 444 | **518.16 ppm calcium** | 5.13 | (steady/quick pace, see log) |
| current | a steady tank, seed 3 | 830 | **710.63 ppm calcium** | 5.13 | steady pace, 26.2 mL/day vs ~5.1 mL/day need |
| current | fast growth (60%/yr), weekly changes, seed 3 | 830 | **836.82 ppm calcium** | 14.97 | quick pace, 54.4 mL/day, offered day 798 |

Legacy's worst neglect-overlap overshoot across all 24 runs: 518 ppm, 1 of
24 runs. Current's worst: **837 ppm, in 2 of 24 runs** — both roughly 1.4x
to 1.6x legacy's worst, and both **above** the documented F3 figure of 702
ppm (see F3 below). In the second case, `planLog` shows the plan was
offered on day 798, two days before the day-800 neglect spell begins, at a
"quick" pace (54.4 mL/day against a computed daily need around 15 — this
scenario's demand has compounded 60%/yr by day 798). With no readings for
the next 32 days, nothing in the app can see the overshoot or cancel the
plan; a reading on day 834 finally shows 769 ppm and an "emergency" hold
brings it back to 379 ppm by day 876 (42 days later). The first case is the
same shape at a gentler pace (steady, 26.2 mL/day, offered day 798,
30 days unread).

**Why this is worth flagging rather than filing as "still F3, unchanged":**
in the same scenario and seed, legacy's `planLog` has no plan open across
either neglect window at all (its plan-start days for that steady-tank,
seed-3 run are 176, 182, 204, 238, 322, 330, 540, 554, 624, 686, 756, 854,
938, 1016 — nothing near 798). Current opens a plan at day 798 in both
cases checked. That is consistent with Bug 3's grading change
(`.agent/phase6-bugs.md` — `doseDriftedFrom` promotes a rate-only "stable"
grade to the next band when the level is outside band and still moving
away): a fix explicitly intended to catch slow drift sooner also makes the
app more willing to open a correction plan at all — and a plan that is
open when a neglect spell starts has no way to be stopped early under
either engine's design (that is F3's still-open defect, not something this
replay's authorisation extends to fixing). The fix did not create the "no
stop condition" defect; it appears to have increased how often a plan is
open at the moment a spell of missed testing begins, which is when that
defect bites hardest. This is **plausible attribution, not proven** — the
alternative explanation, that this is simply a different RNG-driven reading
sequence for the same seed after six routine-15 fixes changed intermediate
arithmetic, cannot be ruled out from the data gathered here, and both
explanations may be true together.

Two more small, related data points from the same instrumentation:
magnesium's dose changed at all in current (`magnesium_doseSwing`
`[6.42, 12.5]`, i.e. it moved) where legacy's magnesium dose was flat for
the entire simulated three years (`[6.42, 6.42]`) in every one of the 24
runs — consistent with Bug 6 (magnesium removed from
`DOSE_ADVICE_RULES`, per `.agent/phase6-bugs.md`) changing whether a
maintenance-dose nudge ever reaches magnesium in the harness's own
apply-the-advice loop. And `alkalinity` plan-starts jumped roughly 3x
(777 legacy -> 2,342 current across the 24 runs) while `calcium`
plan-starts, an element whose band did not move, stayed flat (269 -> 243) —
the asymmetry itself is evidence the alkalinity change (band width halved,
Bug 4) rather than a general defect is driving the alkalinity-specific
churn; see Attribution note 1.

**Plain.** In two of the twenty-four simulated three-year tanks, the
updated app started a calcium correction right before a stretch where the
simulated keeper stopped testing for a month — and because nothing tests
the water during that stretch, the app has no way to know the correction
overran. Calcium climbed to 711 ppm in one case and 837 ppm in the other
before the next reading caught it, both higher than the worst the old app
ever reached in the same kind of situation (518 ppm) and both above the
level the original bug report warned about (702 ppm). This is not a new
bug in the correction logic itself — both the old and new app have the
same gap: a running correction has no way to check itself if nobody tests
the water. What looks to have changed is that the updated app opens
corrections more readily (a change made on purpose, to catch slow-drifting
alkalinity sooner), which means more corrections are open at the moment a
testing gap begins, which is exactly when that gap matters most. In plain
terms: a fix aimed at alkalinity drift appears to have made the older,
still-unfixed "no way to check a running correction" problem bite more
often — a lesson learned by simulating a full life, not a bench test.

---

## F1 — the hold-forever crash

**Documented.** Three simulated years, demand growing 30% a year, a keeper
following every recommendation: alkalinity reached 6.87 dKH on day 182 —
below the safe floor — while the wizard said "hold", and kept falling to
2.72 by day 350. Barely any dose changes across the whole run while the
tank crashed. Source: `legacy/STAGE5-PLAN.md` (day/level/dose table near
line 1251).

**Replay, both engines, growth-1.3 scenarios specifically** ("moderate
growth, 30% a year" and "moderate growth, fortnightly changes", 4 seeds
each, 8 runs per engine):

| | legacy | current |
| --- | --- | --- |
| worst trace-sampled alkalinity minimum, growth-1.3 runs | 7.97 dKH (day 420, seed 1, no water changes) | 7.27 dKH (day 420, seed 1, no water changes) |
| alkalinity dose-change count range, growth-1.3 runs (of `doseChanges`, all 3 elements combined) | 131-163 | 244-316 |
| all 24 runs: worst trace-sampled alkalinity minimum | 1.37 dKH (day 420, fast growth + weekly changes, seed 3) | 0.97 dKH (day 420, a steady tank, seed 1) |
| all 24 runs: checkpoints below 7.5 dKH (of 456 total) | 1 | 3 |
| all 24 runs: checkpoints below 8.2 dKH | 8 | 70 |
| all 24 runs: checkpoints below 8.5 dKH | 30 | 227 |
| `doseChanges` (aggregate, exact): worst-low / median / worst-high across 24 runs | 51 / 135 / 171 | 102 / 269 / 345 |

**Verdict: gone in both, margin narrower in current.** Neither engine
reproduces anything close to F1's shape — a fall to 2.72 dKH with almost no
dose changes. Both engines change dose 51-345 times over three simulated
years (roughly every 6-20 days on average), the opposite of "barely any."
Both worst-case alkalinity minima (0.97-1.37 dKH) occur at day 420 — just
after the first neglect spell ends (day 400-440) — in both engines, which
is the simulator's own testing blackout doing what a testing blackout does,
not the documented hold-forever pattern (which happened with the keeper
testing and following advice throughout). **Attribution:** the checkpoints-
below-floor figures are not directly comparable at face value — current's
much higher counts against the *fixed* 8.2/8.5 references are expected
given Attribution note 1 (current's band sits at 8.2-8.8 vs legacy's
8.5-9.5, so current's whole operating range sits closer to, and partly
below, those same fixed rulers even in ordinary operation) and note 3 (the
simulator's water changes pull toward 8.8, the *top* of current's band but
mid-low in legacy's, so current tanks spend more of their time relatively
lower in absolute dKH even when perfectly "in band"). The dose-change count
roughly doubling in current is the same story as the New Failures section:
a narrower, lower band and Bug 3's more sensitive grading produce more
frequent corrections, which is a design change (intended), not a
reappearance of F1.

**Plain.** The specific crash from the original bug report — alkalinity
sliding to danger levels over three years while the app just said "hold"
and barely changed the dose at all — does not happen in either version.
Both the old and the new app keep adjusting the dose regularly throughout,
and the new app adjusts it roughly twice as often, which fits with a
change made on purpose (catching a slow alkalinity drift sooner). Both
versions dip lower on a fixed dKH scale during the simulated month when the
keeper stops testing, and the new app dips a bit lower than the old one
during that same gap — but the target itself moved lower and narrower on
14 August (a decision already made, not something found here), so part of
that difference is the goalposts moving, not the app getting worse at
holding the tank steady.

---

## F2 — corrections stacking on stale readings

**Documented.** Calcium driven 403 -> 498 ppm over three years by
corrections proposed on readings that predated the app's own intervention:
plans starting two days apart, dose swinging 9.2 -> 52 -> 9.2 mL. Source:
`legacy/STAGE5-PLAN.md` ("The real bug: corrections proposed on stale
readings", near line 953).

**Replay.** The two direct crosstalk.js probes built specifically for this
bug, unmodified, both engines:

| Probe | legacy | current |
| --- | --- | --- |
| "no correction on a stale reading" | 8 cases, 0 failures | 8 cases, 0 failures |
| "corrections wait for a fresh reading" | 24 checks, 0 failures | 24 checks, 0 failures |

From the year-long simulation (`planLog`), the minimum gap in days between
successive calcium plan starts, across all 24 runs:

| | legacy | current |
| --- | --- | --- |
| minimum gap observed (any run) | 6 days | 6 days |
| full set of minimum gaps per run (24 values, days) | 8,6,6,14,70,8,6,6,14,8,14,6,6,8,6,6,14,14,6,8,14,28,8 | 6,20,8,20,70,386,8,6,14,6,6,6,6,8,6,6,14,14,6,8,14,36,8 |
| calcium dose swing across all runs (min-max daily dose, trace-sampled) | 0 - 29.7 mL | 0 - 55.3 mL |

**Verdict: gone.** Both dedicated probes pass with zero failures in both
engines — the exact mechanism F2 named (a correction offered against a
reading older than the app's own last intervention) is not observed. The
minimum plan-start gap is 6 days in both engines, not the documented 2 —
neither engine reproduces "two days apart." Current's dose-swing ceiling is
higher (55.3 vs 29.7 mL) but that traces to the New Failures section's
neglect-spell overshoot runs, not to stale-reading stacking: the largest
current calcium doses are the emergency-hold corrections following the
711/837 ppm overshoots, a consequence of the missed-testing gap, not of an
old reading being reused. **Attribution:** the dose-swing widening is
downstream of the New Failures finding above, not a separate F2 event.

**Plain.** The original bug — the app proposing a new correction using a
water test that was already out of date because of an earlier correction —
does not happen in either version, and the two tests built specifically to
catch it both pass cleanly in both. Calcium doses do swing wider in the new
version, but that traces back to the neglect-spell overshoot described
above (a bigger problem needs a bigger correction to fix), not to the app
reusing stale numbers.

---

## F3 — no stop condition on a running correction

**Documented.** Calcium reached its band and kept climbing to 702 ppm,
because the weekly cadence put the two confirming readings a fortnight
away while the elevated dose kept running; alkalinity ran to zero on a
downward correction the same way. Sources: `legacy/AGENTS.md:106-111`,
`legacy/protocol/correction-spec.txt:194-200`, `legacy/tests/sim/smoke.js:8-11`.

**Replay.** `years.js`'s 24-run grid measured this directly (§ New Failures
above has the full detail); repeated here as F3's own section per the
routine's structure:

| | legacy | current |
| --- | --- | --- |
| worst calcium level at any `planLog` event, all 24 runs (exact, not sampled) | 518.16 ppm (day 444, neglect-overlap, "a steady tank" seed 2) | **836.82 ppm** (day 830, neglect-overlap, "fast growth + weekly changes" seed 3) |
| trace-sampled worst calcium maximum, all 24 runs | 514.28 ppm (day 840, "moderate growth 30%" seed 4) | 695.61 ppm (day 840, "a steady tank" seed 3 — the same run as the 710.63 ppm exact figure above; the nearest trace sample, 10 days after the true peak at day 830, already missed it by 15 ppm) |
| worst trace-sampled alkalinity minimum, all 24 runs | 1.37 dKH | 0.97 dKH |
| `correction-stalled` calcium plan endings (count / total calcium endings) | 13 / 266 | 14 / 241 |

**F3 annex (step 3).** `sim/smoke.js`, 60 tanks / 4,200 tank-days / 12
states, both engines: **0 disagreements, 0 failures reported in either.**
This is a weaker instrument for F3 than the `years.js` grid turned out to
be — `smoke.js` prints only a states-exercised count and a pass/fail
verdict, no per-surface disagreement tally to quote (unlike `crosstalk.js`,
whose per-block counts were usable). The `years.js` measurements above are
the primary F3 evidence in this replay; the annex corroborates only "no
outright surface disagreement," not the overshoot magnitude question.

**Verdict: present in both, and the worst case in current runs higher than
either legacy's worst case or the documented 702 ppm figure.** Neither
engine has closed F3 — a running correction still has no mechanism to
detect a level moving away from target *while the plan is executing*, if
no fresh reading arrives (the two engines only differ on how often that
circumstance now arises; see New Failures). Alkalinity's "ran to zero on a
downward correction" half of F3 is present at similar severity in both
(1.37 vs 0.97 dKH, neither reaching literal zero in this simulation, but
both dipping to the same day-420 neglect-overlap trough). **Attribution:**
the calcium overshoot magnitude difference (518 vs 837 ppm) is the same
finding as the New Failures section — plausibly, not certainly, linked to
Bug 3's grading sensitivity increasing how often a plan is open when a
neglect spell begins. The alkalinity trough difference (1.37 vs 0.97 dKH)
is confounded by the band/goalpost change (Attribution note 1) in the same
way F1's checkpoint counts are.

**Plain.** The core problem the original bug named — a correction that
keeps running past where it should stop, because nothing checks on it
until the next scheduled test — is still there in both versions. It has
not been fixed by 14 August's changes, and this replay's authorisation
does not extend to fixing it. In the worst simulated case, the new
version's overshoot (837 ppm) was worse than the old version's worst case
(518 ppm) and worse than the number in the original bug report (702 ppm).
That worst case coincides with a stretch where the simulated keeper wasn't
testing at all, which is the one condition under which no dosing app can
self-correct — but the new version reached that condition, with a
correction already running, more often than the old one did.

---

## F4 — plans killed as stalled having never had a chance

**Documented.** 48% of plans over three years ended `correction-stalled`
when the only reading since the plan began was the one it started from —
movement measured from a reading to itself, always zero. Source:
`legacy/STAGE5-PLAN.md` §5b (near line 46).

**The §5c caveat, carried forward as instructed.** STAGE5-PLAN §5c
re-diagnosed the 48%: most of it was the *harness*, not the app — the
original loop ran in the past, so every plan read as hundreds of days old
at creation. With the clock aligned — which `legacy/tests/sim/longrun.js`
does (its "Shift every date so the simulated day IS today" block,
`longrun.js:76-81`, run unmodified in this replay) — stalled plans fell to
0-1 per run before any app fix. **This replay measures the residual
stalled fraction under that already-corrected harness; it is not a
re-measurement of the original 48%, and the 48% figure is not a fair
comparison point for either engine's number below.**

**Replay, both engines, corrected-clock harness, all 24 runs combined:**

| | legacy | current |
| --- | --- | --- |
| plan endings, all elements | 1,042 | 2,579 |
| of those, `correction-stalled` | 17 | 14 |
| stalled fraction | 1.63% | 0.54% |
| plan starts, all elements | 1,046 | 2,585 |
| plan starts, alkalinity only | 777 | 2,342 |
| plan starts, calcium only | 269 | 243 |

**Verdict: gone in the sense §5c already found, and unchanged by 14
August.** Both engines sit at 0.5-1.6% stalled, nowhere near 48% —
consistent with §5c's finding that the harness clock, not the app, was
responsible for most of the original figure, and confirming that finding
still holds after 14 August's fixes. **Attribution:** current's much
higher plan-start volume (2,585 vs 1,046, almost entirely from alkalinity)
is the band-narrowing effect discussed in Attribution note 1 and the New
Failures section, not a stalled-plan pathology — if anything, current's
*fraction* stalled is lower, because the numerator (14 vs 17, roughly flat)
is divided by a much larger denominator (driven by alkalinity's tripled
plan-start rate). The stalled count staying roughly flat while total
endings more than doubled is itself worth naming: current is not
generating proportionally more "measured a reading against itself" plans,
it is generating more plans overall for an unrelated reason.

**Plain.** The specific number from the original report — nearly half of
all corrections being cancelled for a reason that turned out to be a flaw
in the test itself, not the app — was already found to be mostly a testing
artefact before 14 August, and this replay confirms that finding still
holds: in both versions, only about 1 in 200 corrections now ends that way.
The new version starts far more corrections overall (mostly alkalinity
ones, for reasons covered above), but it is not cancelling a bigger *share*
of them for the original flawed reason — the opposite, slightly.

---

## Harness counts (step 1, context)

Unmodified harnesses, both scratch trees, run before any instrumentation
edit:

| Suite | legacy | current |
| --- | --- | --- |
| `tests/sim/years.js` (6 scenarios x 4 seeds, 3 simulated years each, checked every 2 days) | `three-year runs: 6 scenarios x 4 seeds, 0 problems, slowest derivation 61ms` (1m45s wall) | `three-year runs: 6 scenarios x 4 seeds, 0 problems, slowest derivation 64ms` (2m27s wall) |
| `INVARIANT_RUNS=6000 node tests/invariants.js` | `invariants: 6000 random assessments, 0 properties violated` | `invariants: 6000 random assessments, 0 properties violated` |
| `tests/crosstalk.js` | `cross-talk: 600 tanks, 0 properties violated`; `protocol authority: 1098 holds, 82 changes, 0 contradictions`; all 9 remaining probe lines 0 failures | `cross-talk: 600 tanks, 0 properties violated`; `protocol authority: 1118 holds, 62 changes, 0 contradictions`; all 9 remaining probe lines 0 failures |
| `tests/sim/smoke.js` (F3 annex, 60 tanks, 4,200 tank-days) | `surfaces: 60 tanks, 4,200 tank-days, 12 states exercised` (0 disagreements) | `surfaces: 60 tanks, 4,200 tank-days, 12 states exercised` (0 disagreements) |

All four suites are clean (0 problems/violations/failures) on both engines.
`crosstalk.js`'s protocol-authority line is the one count that differs
between engines and is worth naming here even though it reported 0
contradictions either way: current holds slightly more often and changes
slightly less often (1118/62 vs 1098/82) in that harness's own 600-tank
generative sweep — a different simulator from `years.js`, not directly
comparable to the plan-start counts above, but pointing the same direction
(current's decision logic leans toward holding more, changing less, in a
short generative sweep, while opening far more multi-day correction plans
over a compounding three-year run — both plausibly downstream of the same
band-width and grading changes, applied differently by two different test
generators).

Slowest single derivation: legacy 58-61ms, current 64-74ms across the runs
in this replay — both comfortably under the 250ms regression line
`years.js` itself checks.

---

## Closing — did 14 August make the app better, and by how much?

**Precise.** F1 (the hold-forever crash) and F2 (stale-reading stacking)
are both gone in current, and were already gone in legacy — this replay
adds three simulated years of margin measurement to that conclusion rather
than changing it: both engines keep the dose moving throughout (51-345
changes over three years, never "barely any"), and both dedicated
stale-reading probes pass 0/8 and 0/24 failures in both engines. F4's 48%
was already understood as mostly a harness artefact before 14 August
(§5c); the residual stalled fraction is low and slightly *lower* in
current (0.54% vs 1.63%) despite current running far more plans overall.
F3 (no stop condition on a running correction) is **not fixed by 14
August, in either direction that matters**: it is still present in both
engines, and the worst measured case in current (837 ppm, `planLog`-exact)
is higher than legacy's worst case (518 ppm) and higher than the
documented 702 ppm. The plausible mechanism (Bug 3's grading fix opening
more corrections, which increases exposure to F3's still-unfixed gap
during a testing blackout) is attribution, not proof — the routine's
authorisation stops at reporting it. Two of 14 August's four cited
attribution causes (the alkalinity band narrowing 1.0 -> 0.6 dKH, and the
resulting goalpost/checkpoint effects) account for most of the *other*
differences measured here — the 3x jump in alkalinity plan-starts, the
roughly-doubled aggregate dose-change count, and a meaningful share of the
checkpoints-below-fixed-floor gap — none of which are defects, all of
which are the constants moving on purpose.

**Plain.** The two crashes the original report is named for — a tank left
to fall for months while the app said "hold," and corrections proposed on
data that was already out of date — are gone in both the old and new
version, and three simulated years of testing turns up nothing that
changes that. The "corrections cancelled for a bad reason" number from the
original report was already understood to be mostly a test-harness problem
before 14 August, and the new version doesn't make that better or worse in
any way that matters. The one problem still standing after 14 August is
the same one the original report found: a correction that's running has no
way to check on itself except the next scheduled test, and if that test
doesn't happen — because the keeper is away, or busy — the correction can
run further than anyone intended. That gap is not new. What may be new is
how often the app finds itself in that position: a change made on purpose,
to flag a slow alkalinity drift sooner, appears to also mean a correction
is more often already running by the time a gap in testing begins — and
when that happens, this replay's worst simulated case (837 ppm calcium)
ran further than anything either the old app or the original bug report
showed. Worth Dan's attention, not because 14 August introduced the gap,
but because it may have made the tank more exposed to a gap that was
already there.

**Risk if this report is wrong.** Dan makes decisions from the numbers
above. If the "New Failures" attribution is wrong — if Bug 3's grading
change is not actually why more corrections are open going into a neglect
spell, and it's instead RNG noise from six unrelated arithmetic changes —
then the report's framing (a fix increasing exposure to an old gap)
overstates a causal story the data doesn't fully support; the raw
overshoot numbers (518 vs 837 ppm) stand regardless, but the "why" does
not. If the checkpoint-below-floor and dose-change-count comparisons are
read as verdicts rather than measurements against a moved goalpost (this
report's repeated caution notwithstanding), someone could conclude current
is "worse at holding alkalinity" when the fairer reading is "the target
moved, and some of the difference is the target, not the app."
