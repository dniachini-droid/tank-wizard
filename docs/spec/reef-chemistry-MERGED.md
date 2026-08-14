# Reef Chemistry — Canon

**Status: proposed.** Replaces `docs/spec/reef-chemistry.md` and supersedes
`docs/spec/incoming/dosing-spec.txt`. Reviewed and merged 13 August 2026.
**Amended 14 August 2026** on the spec owner's authority — §6, §7, §8 and §9;
the decisions and their reasoning are recorded in `.agent/needs-dan.md`.

Companion: `wizard-states.md` — the state machine. This document is the
arithmetic. Read this one to know what number the app produces; that one to
know why a particular card is showing.

Every figure here is either sourced or marked as a judgement. Where a decision
was made on 13 August it says so, with the reasoning, so nobody re-litigates it
from first principles.

---

## 1. The distinction everything rests on

- A **daily dose** replaces what the tank consumes. It **holds** a level. It
  cannot move one in any reasonable time.
- A **correction** is a one-off or temporary elevated dose. It **moves** a
  level. It is not a maintenance figure and must be returned from.

Most confusing advice in reef software comes from conflating these. When the
app says "the dose is right, the level is not", that is this distinction.

Three wizard states exist purely to express it. Collapsing them into "increase
the dose" makes the app give advice that cannot work.

---

## 2. Targets — three layers

The app does not impose targets. Reefkeepers legitimately run alkalinity
anywhere from 7 to 11 dKH, and the right number depends on their corals,
nutrients and lighting. What the app imposes is the outer limit.

### Layer 1 — Safe bounds (fixed, not user-adjustable)

Where sources describe actual harm, not merely off-target.

| | Safe bounds |
|---|---|
| Alkalinity | 7 – 11 dKH |
| Calcium | 350 – 500 ppm |
| Magnesium | 1150 – 1600 ppm |

Below 380 ppm calcium slows growth; above 500 it pulls alkalinity down. Above
~1600 magnesium causes lethargic invertebrates and suppressed uptake. Randy
Holmes-Farley gives 7–11 dKH as the workable alkalinity range.

**The app refuses to accept a target outside these**, and names the reason.

### Layer 2 — The user's target and band

The user sets a target and a band width. Everything the app says is relative to
*their* number, not to a hobby consensus.

### Layer 3 — Starting suggestions (editable, never re-applied)

Shown at first setup, clearly labelled as suggestions.

| | Suggested target | Suggested band |
|---|---|---|
| Alkalinity | 8.5 dKH | 0.6 total (±0.3) |
| Calcium | 425 ppm | 50 total (±25) |
| Magnesium | 1350 ppm | 150 total (±75) |

**Decided 13 Aug:** alkalinity's band tightened from 1.0 to 0.6. Published
guidance puts weekly drift under 0.5 dKH and daily variation under 0.3. A 1.0
band tolerates a full dKH of movement before the app speaks, by which point a
correction is needed rather than a nudge.

The band is deliberately paired with a gentle response — see §7. A tight band
with a soft response beats a wide band whose only tool is a correction.

**Bands are not derived from test-kit precision.** Hobby kits are all roughly
as imprecise as each other, and asking users which kit they own adds a question
they would answer badly.

---

## 3. Rate rails — one per element

The maximum any level may be moved in 24 hours. Applies to corrections and as
the ceiling on any dose change.

| | Rail | Source |
|---|---|---|
| Alkalinity | 0.5 dKH / day | most keepers cap at 0.5; some sources allow up to 1.4 |
| Calcium | 20 ppm / day | reefcalcs calls 20 safe; BRS allows 50 for large corrections |
| Magnesium | 25 ppm / day | widely given as 25; Aqua Forest label allows 50 |

**Decided 13 Aug: one rail per element, not two.** A separate, faster rail for
corrections was considered and rejected. The conservative figure is used
throughout, because every extra number is another thing that can contradict
itself — and this app's central defect has been numbers disagreeing with each
other. The cost is a couple of extra days on a rare event.

Coral responds to rate of change, not absolute value, so these apply whether
the user targets 7 or 11.

---

## 4. Cadence and analysis windows

| | Test cadence | Analysis window |
|---|---|---|
| Alkalinity | 2 days | 14 days |
| Calcium | 7 days | 28 days |
| Magnesium | 21 days | 28 days |

**Decided 13 Aug: windows are flat, with no extension.** An earlier design
stretched the window (alk 7→21, Ca/Mg 14→35) when readings were thin. Rejected:
stretching means the app quietly changes its own arithmetic when data is
sparse, producing a consumption figure the user cannot tell came from older,
less relevant history. Refuse rather than reach.

Aquaforest recommends weekly testing for all three. 21 days for magnesium
reflects what reefkeepers actually do and what magnesium's movement justifies.

---

## 5. Kit noise floors

| Alkalinity | 0.1 dKH |
| Calcium | 10 ppm |
| Magnesium | 30 ppm |

Movement smaller than this is the kit, not the tank. No trend, verdict or dose
change may be founded on a difference below the floor.

---

## 6. Consumption and the maintenance dose

`maintenanceDose` — the dose that would hold the level steady — is the centre
of everything.

1. Take readings inside the analysis window (§4)
2. Fit a slope. Subtract what the current dose supplies. What remains is
   consumption.
3. Subtract what a logged correction put in — see below. **Water changes are
   not excluded and not subtracted.**
4. `maintenanceDose = consumption / effectPerMl`

`effectPerMl` comes from the solution strength in Setup, or is solved from
history when there is enough of it.

### Disturbances — what leaves the fit, and what stays

**Decided 14 Aug: water changes stay in the trend fit. Only logged corrections
are removed, and they are removed by proportional subtraction — not by dropping
readings, not by restarting the window.**

An earlier version of this section, and both legacy specs
(`calculation-spec.txt` §3, `dosing-spec.txt` §4.3), said a water change is a
disturbance and readings near one are excluded. The app does not do that, and
the reason is recorded where the decision was taken —
`src/lib/dosing/alkalinity.js:493-499`:

> Water changes are deliberately NOT among them. A routine change of a tenth of
> the volume shifts alkalinity by about as much as the test can resolve, while
> restarting the window every week left the assessment with a single reading to
> work from — which is why it answered "hold" on tanks that were visibly
> draining. A manual correction is different: large, deliberate, and known
> exactly, so it is subtracted from the readings further down rather than
> throwing the window away.

`src/lib/dosing/calcium.js:273-278` carries the same reasoning for calcium: a
regular tenth-volume change "is already reflected in the consumption the dose
has to match."

The cadence arithmetic settles the other two elements the same way rather than
differently. Calcium is tested weekly and magnesium every 21 days, against
water changes logged weekly. Treating a change as a window boundary would
leave calcium with one usable reading and magnesium frequently with none — the
same "hold on a draining tank" failure that removed the rule for alkalinity,
but a week or three weeks slower for anyone to notice, which makes it worse and
not better.

**How a correction is subtracted** (`alkalinity.js:551-562`). Each reading in
the window has removed from it the share of the correction that had landed by
that reading's timestamp, spread linearly across three days:

```
addedBy(t) = Σ over corrections  ml × effectPerMl × min(1, (t − t_correction) / 3)
```

anchored on the first reading in the window, so the fit sees the tank's own
behaviour and not the lift. The reading is kept; only the part of it the
correction put there is taken out. Without this, a correction reads as reduced
consumption and the engine cuts a dose that was correct.

**Not settled by this decision.** The reasoning above holds for a *routine*
change with a reasonably matched salt mix, where the shift sits at or under the
kit noise floor (§5). Two things it does not cover, both open:

- A mismatched salt mix. Common brands run from about 7 to about 12.5 dKH, so
  a 10% change against a 9 dKH tank can shift alkalinity 0.2–0.3 dKH — two to
  three times its noise floor. Calcium and magnesium stay under their floors
  even at the worst plausible mismatch.
- A large one-off change. The shift scales linearly with the fraction changed,
  so a 40% change at that mismatch moves alkalinity about 1.2 dKH — roughly a
  whole band. **The app has no size threshold anywhere that distinguishes a
  routine 10% change from a 40% one.**

The machinery to subtract a water change mathematically already exists in the
analytics layer (`computeElementConsumption`, `src/lib/analytics/consumption.js`,
using the `SALT_MIX` baseline in `salt-baseline.js`) and is not wired into the
dosing engines. Wiring it in would make a hardcoded salt-mix figure an input to
a dose recommendation, with no Setup field to correct it — which is why it is
not being done here.

> **Everything downstream depends on the strength in Setup being right.**
> `strengthPlausible` checks each element against a coarse range and will catch
> a value outside any real product's. It will **not** catch a wrong-but-
> plausible value, which is the failure that matters. Bracketing (§8.3) is the
> only real defence.

---

## 7. When the app will change a dose

All four must hold:

1. **At least 3 readings** in the analysis window
2. **The settle window has passed** since the last change
3. **The movement is real** — clears the kit noise floor, and for calcium and
   magnesium the slope exceeds three standard errors over at least 20 days
4. **The gap is worth acting on**

### The settle window

How long before a change can be judged:

```
needed = (2 × kitNoise × √2) / (0.15 × dailySupply)
```

Clamped: alkalinity 2–5 days, calcium and magnesium 7–30.

On a Hanna checker alkalinity settles in 2 days, calcium in 17, magnesium in
30. This is why the same advice arrives at very different speeds, and it is
correct — it is how long before a 15% error becomes visible above the kit's own
noise.

### The dose-gap trigger

How far the daily dose must sit from the calculated ideal before the app raises
it.

| Alkalinity | 12% |
| Calcium | 30% |
| Magnesium | never — see §10 |

**Decided 13 Aug: the out-of-band halving is removed.** Previously the trigger
halved (12→6%, 30→15%) once a level left its band. That existed only as a patch
for broken stability grading (§11) — with grading fixed, the app catches a slow
decline directly and the hair-trigger is no longer doing any work.

### The response to a gap

**Decided 14 Aug: the wizard recomputes in full and stages a fraction of the
result. There is no flat percentage nudge anywhere in the wizard.**

Once the trigger opens, the wizard does not adjust the standing dose by a fixed
percentage of itself. It recomputes `maintenanceDose` from scratch (§6) —
`consumption = supplied − trend`, then `consumption / effectPerMl` — takes

```
rawChange = maintenanceDose − currentDose
```

and applies a *fraction of that freshly recomputed gap*, sized by the gap's own
magnitude and by urgency, per element. The fractions are §8.1; the five
constraints that then trim the result are §8.2. Recalculation is not reserved
for anything: it happens on every assessment that gets this far. Staging governs
how much of the recomputed change is applied now — not whether the
recomputation happens.

**What the 10% figure was, and where it went.** An earlier version of this
section recorded BRS's advice — if levels are slowly rising subtract 10% per
day, if slowly falling raise by 10%, repeat until stable — as the app's
behaviour. BRS does give that advice and it is sound for the regime it
describes; BRS itself switches to a calculated correction split over a few days
once the gap passes about 1.4 dKH, so even the source has two regimes rather
than one. But it was never what this wizard does. The flat figure that existed
in the app belonged to a **separate engine**, `src/lib/analytics/drift.js`
(`pct: drift.severity === "high" ? 15 : 10`), which computed its own dose advice
from its own noise floors and windows, with no knowledge of staging, bracketing,
rate ceilings, plausibility or a running plan. **That engine's dose figures are
being removed**, per `wizard-states.md` §0.3: the wizard is the only thing in
the app that produces a number to dose.

Worked, to show the two are different arithmetic rather than two descriptions of
one idea. Alkalinity, `currentDose` 9.0 mL/day, `effectPerMl` 0.0692 dKH/mL,
trend −0.15 dKH/day:

```
supplied        = 9.0 × 0.0692           = 0.6228 dKH/day
consumption     = 0.6228 − (−0.15)       = 0.7728 dKH/day
maintenanceDose = 0.7728 / 0.0692        = 11.17 mL/day
rawChange       = 11.17 − 9.0            = +2.17 mL
```

- flat 15% nudge: `9.0 × 1.15` = **10.35 mL/day**
- the wizard: `mag` = 2.17 mL falls in the ≤4 mL band → apply 90% → `9.0 + 1.95`
  = **10.95 mL/day**, before rounding, rate ceiling, plausibility, bracketing
  and the step cap

Same two readings, two engines, two answers about 0.6 mL apart. The structural
difference is what the percentage is a percentage *of*: a flat share of the
dose the tank is already on, direction only and blind to how far off it is,
versus a magnitude-banded share of a gap recomputed from the readings each
time.

Corrections (§9) are not "full recalculation" as against this gentler thing.
They are a different instrument for a different job — moving a level rather than
holding one (§1).

---

## 8. How big a change

The raw change is `maintenanceDose − currentDose` (§7). It is never applied
whole. First it is **staged** — a fraction of it is applied, sized per element
(§8.1). Then the staged figure passes **five constraints in a fixed order**
(§8.2).

**The order changes the answer.** This is not a stylistic list.

### 8.1 Staging — how much of the raw change to apply

A large calculated change resting on few readings is not applied at once. The
fractions differ per element, and the differences are deliberate. `mag` is
`|rawChange|` in mL.

| | rescue | small `mag` | medium `mag` | larger |
|---|---|---|---|---|
| Alkalinity | **100%** — out of band and still heading away, or outside safe bounds | ≤ 2 mL: 100% | ≤ 4 mL: 90% | 70% if urgent, else 55% |
| Calcium | **100%** — out of band, either direction | ≤ 1 mL: 100% | ≤ 3 mL: 85% | 60% if urgent, else 50% |
| Magnesium | **none — deliberately** | ≤ 1 mL: 100% | ≤ 3 mL: 80% | 55% if urgent, else 45% |

**Urgent** means the level is out of band, near an edge, or the trend has
reached the meaningful threshold — alkalinity 0.3 dKH/day × 1.5, calcium
20 ppm/week, magnesium 30 ppm/week.

**The three rows are not copy-paste drift.** Alkalinity is read to 0.01 dKH
every two days, so a mistake is visible within days and it can afford to move
boldly. Magnesium is read to 25 ppm every three weeks, so a mistake persists for
weeks; it takes the smallest steps of the three. An agent who unifies these rows
will make magnesium unstable.

**Magnesium has no rescue path, and that is deliberate.** Alkalinity and calcium
apply the full calculated change when the level is out of band. Magnesium never
does. Raising a dilute maintenance dose far enough to lift a low magnesium
produces figures nobody would pour — a drifting tank once asked for 72 mL/day.
Magnesium levels are moved by a correction from a separate product (§9, §10);
this dose only ever tracks consumption.

Read alongside §10 this is belt and braces, and deliberately so. §10 keeps the
dose-gap trigger shut for magnesium, so the ordinary route into this table never
opens for it; the missing rescue row means that even if some other route did
reach the staging step, an out-of-band or unsafe magnesium level could not pull
the daily dose with it. Neither a gap nor an emergency may move magnesium's
maintenance dose.

**Alkalinity's rescue path exists for the opposite reason.** Simulation showed
tanks crashing while the engine politely applied 70% at a time — each held-back
step costs another two days at a level the tank should not be at.

### 8.2 The five constraints, in fixed order

Applied to the staged figure, in this sequence.

| # | Constraint | What it does |
|---|---|---|
| 1 | **Rounding** | to 0.1 mL, and never below zero |
| 2 | **Rate ceiling** | the new dose must not move the level faster than the §3 rails — see §8.5 |
| 3 | **Plausibility** | if the figure implies a solution strength that cannot be right, the wizard stops and shows "check setup" instead of quoting it — see §6 and §12 |
| 4 | **Bracketing** | the answer must sit between the highest dose at which the level fell and the lowest at which it rose — see §8.3 |
| 5 | **Step cap** | no more than 25% per change — see §8.4 |

**Order changes the answer**, and this is the order. An earlier version of this
section listed three of these — bracketing, step cap, rate ceiling, in that
sequence — and said nothing about order mattering. Anyone implementing that list
would round last instead of first, and would never check plausibility at all:
both wrong, and both silently, because a figure built from a broken input still
comes out of bracketing and the step cap looking like an ordinary dose.

Two practical notes, both from measurement rather than principle: **the step cap
is usually the binding constraint**, and the rate ceiling almost never binds in
realistic cases. Tuning the rails to change behaviour is usually tuning the
wrong thing.

The staged, constrained figure is the recommendation:

```
recommendedDose = the figure surviving all five
action          = recommendedDose > currentDose ? "increase"
                : recommendedDose < currentDose ? "decrease"
                : "hold"
```

### 8.3 Bracketing

If history contains a dose at which the level fell and one at which it rose,
the true dose lies between them. This is purely empirical — no solution
strength enters the calculation — which makes it **the only check on a wrong
Setup strength**.

It brackets; it does not pinpoint. The arithmetic still picks the number within
the range.

**Decided 14 Aug: bracket memory is 45 days, flat, for all three elements.**

An observation older than 45 days is dropped; any whose implied consumption
differs from today's by more than 25% is discarded whatever its age.

The 13 August entry here proposed 30 days for alkalinity and 60 for calcium,
"roughly two settle windows each." **That justification does not hold
arithmetically** against the settle-window formula in §7. Alkalinity's settle
window is clamped to 2–5 days, so two of them is 4–10 days — the proposed 30 is
three to seven and a half times its own stated basis. Calcium's is clamped to
7–30, so two is 14–60 days, and 60 holds only for the slowest-consuming tanks.
Magnesium, which shares calcium's settle-window formula exactly, was never given
a figure at all. Both numbers and the reasoning behind them are withdrawn.

The day count is not where staleness is caught — **the 25% consumption filter
is**, because it judges the tank rather than the calendar. Compounding steady
growth, a tank whose demand grows 30% a year drifts 3.3% away from a 45-day-old
observation; at 60% a year it is 6.0% at 45 days and 12.3% at 90 — all far
inside the filter. For smooth growth alone to make the filter bind at 45 days,
demand would have to grow roughly 511% in a year. The day count is a blunt
second guard whose only job is to stop something absurd, and it was measured:
across 36 three-year runs, mean dose error was 14% at 21 days, 10% at 35, and 8%
at 45 (`src/lib/dosing/helpers.js:62-85`).

This does not cover a *step* change — a tray of frags added in one weekend is
not smooth growth. The 25% filter reacts to that on the next reading regardless
of window length, which is the case the directional rule below is really about.

**Still open, not decided:**

- **Old observations may only widen the bracket, never narrow it.** A growing
  tank needs more, not less, and an old observation must never veto a higher
  dose. The worry has documented precedent — a stale bracket once held a tank at
  8 mL for seventeen days while alkalinity fell from 9.0 to 4.9. But the
  circularity argument recorded for it on 13 August ("a tank under-dosed for
  weeks has an understated current consumption") does **not** reproduce against
  the formula the code uses: `consNow = currentDose × effectPerMl −
  currentRate` subtracts the rate, so a falling level always makes `consNow`
  *larger*, never smaller, and in both traces in `.agent/five-decisions.md`
  (Decision 5) the 25% filter correctly discarded the stale observation. The
  most concrete remaining lead is a timing mismatch: immediately after a dose
  change, `currentDose` is the new figure while the trend still reflects the old
  one, so `consNow` mixes two periods. This needs a sharper diagnosis before
  anything is built.

**Decided 13 Aug, and unchanged:**

- **Never veto silently.** If bracketing overrules the arithmetic, say so. If
  the arithmetic wanted *more* than the bracket allows, the user decides —
  that is the coral-growth case, and a silent cap would suppress it.

A tank with no dose history has no bracket, so the arithmetic runs unchecked.
That is exactly when a wrong Setup strength is most dangerous and least
detectable, and the app should say so.

### 8.4 Step cap

No dose changes by more than **25%** at once. Sourced: dosing guides describe
10–30% per adjustment.

Relaxed only when the level is **outside its band and still moving further
out** — see §11 for how that is determined.

### 8.5 Rate ceiling

The new dose must not move the level faster than §3.

---

## 9. Corrections

Offered only when the level is outside its band.

| Pace | Fraction of rail | Alkalinity |
|---|---|---|
| Gentle | 25% | 0.125 dKH/day |
| Steady | 50% | 0.25 dKH/day |
| Quick | 100% | 0.5 dKH/day |

### Where a correction ends

Two different numbers, which the 13 August entry ran together and then
contradicted itself about. They are separated here.

**The aim point is unchanged: the midpoint of the band**, `(min + max) / 2`.
A target is a point, not a zone. Not the nearest edge — normal drift would take
it straight back out.

**Decided 14 Aug: the arrival test is the middle third of the band, floored so
the zone is never narrower than twice that element's noise floor (§5).**

```
zoneWidth = max(bandWidth / 3, 2 × noiseFloor)     clamped to bandWidth
zone      = midpoint ± zoneWidth / 2
```

The floor is on the zone's **total width** — the width of the noise band either
side of a true reading — not on each side of the midpoint. If a user's band is
narrower than twice the noise floor, the clamp applies and the arrival test is
simply "inside the band."

Worked against the §2 suggested bands and the §5 noise floors. These figures are
illustrative, not constants: the band is the user's (§2, Layer 2), so the zone is
computed from whatever band is in force and must never be hardcoded.

| | Band | Middle third | 2 × noise floor | Arrival zone |
|---|---|---|---|---|
| Alkalinity | 0.6 dKH (8.2–8.8) | 0.20 dKH | 0.2 dKH | 0.20 wide — 8.40–8.60 |
| Calcium | 50 ppm (400–450) | 16.7 ppm | 20 ppm | 20 wide — 415–435 |
| Magnesium | 150 ppm (1275–1425) | 50 ppm | 60 ppm | 60 wide — 1320–1380 |

Why the floor exists: a literal middle third puts more than half of calcium's
and magnesium's zone inside the kit's own blind spot — the noise floor is 60% of
a bare middle-third zone for both. The floor brings that to 50%. It is a
judgement, not a sourced figure, and no source anywhere describes a
tolerance-zone rule for finishing a correction; the whole construct is this
project's, which is why the arithmetic is shown rather than asserted. At
alkalinity's tightened 0.6 band the two terms tie exactly, so the floor changes
nothing there.

**`correction-done` exits only after two readings inside the arrival zone**, not
one, and not merely inside the band. Three consecutive 0.2 dKH rises do not
simply stop; reaching the band mid-climb is passing through, not arriving. While
the state holds, the wizard's `testOn` field carries "keep testing every 2 days
— it may still be climbing."

**A stricter arrival test does not strand the elevated dose.** `passed` — one
reading at or beyond the target — is computed independently of `arrived`, and
`correction-done` fires on either (`helpers.js:316`, `state.js:227`), before the
stalled and backwards branches. What a narrower zone costs is the confident
two-reading wording, which becomes rarer for calcium and magnesium; what it does
not cost is the return to the maintenance dose. `arrived` and `passed` must
never be conflated when this is built.

What happens next is handled by ordinary machinery: if the level keeps rising,
the dose gap goes negative and the app suggests coming down. If it holds, the
correction dose turned out to be the right maintenance dose and nothing needs
doing.

**Deleted 14 Aug: "consumption does not re-baseline until this clears."** Both
merged drafts carried that sentence. No such mechanism exists — a search of
`src/lib/analytics/consumption.js`, `demand.js` and the rest of the analytics
layer found no reference to corrections, plans or `arrived` at all
(`.agent/five-decisions.md`, Decision 4). What does happen is in §6, and is the
whole of it: while a logged correction is being delivered, its estimated
contribution is subtracted from each reading in the trend fit, so the lift is
not read as the tank's own behaviour. The claim is removed rather than
restated as an intention, because nothing anywhere implemented it and it was
being relied on to argue that a narrower arrival test would be costly.

### Rules

- **Never on a stale reading.** If a correction, plan or dose change happened
  *after* the newest reading, nothing is proposed. Without this, corrections
  stack on a level nobody has seen — in simulation this drove calcium 403→498.
  A new reading dated after the intervention releases the block. Two
  corrections in a row are fine if there is a measurement between them.
- **The return dose is recomputed, not replayed.** A plan running while demand
  grows must not hand back a figure that is now short.
- **Lowering is limited by consumption.** The fastest a level falls is the rate
  the tank uses it. Where the arithmetic wants a negative dose, the app offers
  zero and says how long that will take.
- **Where the maintenance solution cannot do the job** — more than about 1.5 L
  — say so and point at dry salt or water changes rather than quoting an
  impossible volume.
- **Plans expire on the calendar.** Past the estimate, `correction-due`; past
  `(expected × 2) + 2` days, `correction-stalled`. A 3-day plan survives to day
  8. Testing a day late does not kill it; a month of silence does.

---

## 10. Magnesium

**Decided 13 Aug, after research and correction.**

Magnesium is dosed daily from a three-part system (Aquaforest Component 3+),
tuned independently of calcium and alkalinity. Balling guidance says all three
should be dosed in equal amounts, and Aquaforest's own advice is to set the base
dose from the least-consumed element — but in practice reefkeepers dose the
three independently, and the app must support that.

### What is exempt

**The maintenance dose is never tuned from readings.** Not delayed — exempt. A
15% magnesium dose error takes over a thousand days to clear the 30 ppm kit
noise floor. Any answer the app produced would be invented. `DOSE_DRIFT_TRIGGER`
has no magnesium key and must not gain one.

### What is not exempt

**Corrections behave exactly like alkalinity's.** A one-off dose of a known
quantity into a known volume is directly measurable within hours. Expected +150
ppm, measured +140 — the app verifies it landed, same as any other correction.

An earlier draft imposed a 30-day silence after a magnesium correction. That
was wrong: it confused the slow *dose-tuning* signal with the fast *correction*
signal.

### The model

- Level watched continuously. Outside band, or heading for the edge → warn.
  This never waits, whatever was recently dosed.
- Correction from a **separate product**, not the daily three-part. Aquaforest
  is explicit: Component 1+2+3+ is maintenance only. BRS sells distinct
  maintenance and general-adjustment magnesium mixes.
- Corrections over 100 ppm spread over several days (BRS).
- Every correction logged as "added X ppm on this date."
- **No re-warning while a logged correction is still settling.** Still below
  band six days after a correction reads as "you corrected recently, give it
  time" — never as "you are low, correct again." Same principle as the stale-
  reading rule, different clock.

### Magnesium as a gate

Below roughly 1200–1350 ppm, calcium and alkalinity cannot be held properly and
precipitation becomes likely (BRS). While magnesium is below alert-low, the app
does not recommend alkalinity or calcium corrections, and says why.

### Precipitation

**Magnesium does not precipitate with calcium or alkalinity.** BRS: it can be
dosed within five minutes of either. The separation requirement applies **only
between calcium and alkalinity** — an earlier version of this document was
wrong about this.

---

## 11. Stability grading

**Decided 13 Aug — this was the app's most dangerous defect.**

Previously, any movement slower than 0.10 dKH/day graded as `stable`. A tank
losing 0.02 dKH/day therefore entered the hold branch and crashed in slow
motion. Simulated over three years with demand growing 30% annually, a keeper
following every recommendation received three dose changes and reached 6.87
dKH — below the safe floor — while the app said "hold".

**The rule: a level outside its band and moving further out is never graded
stable, whatever the rate.**

Two qualifiers:

- **Only movement away counts.** Out of band but recovering is working as
  intended; leave it alone.
- **The movement must clear the kit noise floor** over the fitted window. Over
  a fortnight, 0.02 dKH/day is 0.28 dKH — well above a Hanna's 0.1 — so a trend
  fitted over enough readings can see it. A single pair cannot.

This replaces the dose-gap halving (§7), which was a patch for this fault.

---

## 12. What the app refuses to do

- Change a dose on fewer than 3 readings in the window
- Change a dose inside the settle window
- Tune magnesium's daily dose from a measured gap — ever
- Propose a correction for a level inside its band
- Propose a correction on a reading older than the last intervention
- Propose an alkalinity or calcium correction while magnesium is below
  alert-low
- Move a level faster than the §3 rails
- Change a dose by more than 25% at once, except when outside the band and
  moving further out
- Dose at all when net volume is unset
- Accept a target outside the §2 safe bounds
- Stretch the analysis window to manufacture a consumption figure

---

## 13. Open items

**13.1 Component 3+ strength.** One retailer's listing gives 25 mL in 100 L
raising magnesium by 0.38 ppm — 0.0152 ppm/mL/100 L at standard strength, or
0.0304 at double. The app uses 0.024, verified earlier against the label two
ways. These do not reconcile, and product versions may differ. **Verify against
the bottle in hand before trusting either.**

**13.2 Notifications.** The app currently waits to be opened.
`correctionProgress` already computes `dueNow`, `overrun` and `stalled`. A
push layer on top of those is a separate design conversation.

**13.3 `classifyReading`'s duties.** The two previous canon documents disagreed
on whether it validates band/alert consistency. Whoever implements it needs one
answer.

---

## 14. Enforcement — the honest state

The documents this replaces claimed enforcement by `tests/husbandry.js`,
`tests/matrix.js`, `tests/protocols.js`, `tests/summary.js` and
`tests/sim/surfaces.js`. **None of those files exist.** Every rule described as
"enforced" was, at the time of writing, an intention.

That is the project's central defect and the reason for this merge. The rules
were good. Nothing made them true.

**No rule in this document may be described as enforced until a test asserts
it.** Where a test exists, name it. Where none does, say so.
