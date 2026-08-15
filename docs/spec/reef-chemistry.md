# Reef Chemistry — CANON

**Status: canon.** Merged 13 August 2026 from the previous `reef-chemistry.md`
and `legacy/protocol/dosing-spec.txt`. **Amended 14 August 2026** on the spec
owner's authority — §6, §7, §8 and §9; the decisions and their reasoning are
recorded in `.agent/needs-dan.md`. **Became this file on 14 August 2026**, when
Part II below carried forward everything the merge had left behind. **§25 added
14 August 2026** on the spec owner's authority — the Reef Chemistry Engine,
folded in from `docs/spec/DECISION-reef-chemistry-engine.md` (now deleted). Its
surfaces and notice halves are `wizard-states.md` §19 and §20. **§26 added 14
August 2026** on the spec owner's authority — position is the last reading.
**§3 amended 14 August 2026** on the spec owner's authority — the rails are
fixed; the "user may tighten a rail" clause is withdrawn, and
tighten-never-loosen is recorded against §2's bands, where it belongs. The
three companion decisions of the same authorisation are `wizard-states.md`
§15, §20 and the new §22.

> Agents never edit this file. Disagreements → `.agent/spec-challenges.md`.

Companion: `wizard-states.md` — the state machine, the surfaces, and the
platform floor. This document is the arithmetic. Read this one to know what
number the app produces; that one to know why a particular card is showing and
what words may go on it.

Every figure here is either sourced or marked as a judgement. Where a decision
was made on 13 or 14 August it says so, with the reasoning, so nobody
re-litigates it from first principles.

Scope: **three-part dosing** (alkalinity, calcium and magnesium as separate
additives). Not two-part, not kalkwasser, not calcium reactor. Tank-agnostic
and product-agnostic; anything a user configures is marked `[user]` and lives in
app settings, not here.

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

**Any recommendation exceeding a rail is a bug, not a preference.** Enforced in
logic, not merely displayed. A correction needing more than one day is presented
as a **multi-day plan** with a per-day dose — never as a single dose the user
might administer at once.

| | Rail | Source |
|---|---|---|
| Alkalinity | 0.5 dKH / day | most keepers cap at 0.5; some sources allow up to 1.4 |
| Calcium | 20 ppm / day | reefcalcs calls 20 safe; BRS allows 50 for large corrections |
| Magnesium | 25 ppm / day | Aqua Forest label allows 50; 25 is the conservative figure — see below |
| Salinity | 0.5 ppt / day | carried forward from the previous canon |
| Temperature | 0.5 °C / day | carried forward from the previous canon |

**Decided 14 Aug: the rails are fixed. There is no user rail.** One figure per
element, the same for every user. No setting tightens a rail and none loosens
one. The clause that stood here — `[user]` may tighten a rail, the app never
permits loosening — is **withdrawn**.

It contradicted `wizard-states.md` §21, settled the same day, which holds that
**Setup asks for facts, not judgements** and names a rate tolerance
specifically as a non-fact, pointing at this section's ceiling as the answer
the app already has. A rail is reasoning this document has done, with a source
in the table above. A tighten-only dial would replace it with a number typed by
someone who has been using the app for four minutes, and would give one input
three arrival points — the dose-gap trigger (§7), the staging fractions (§8.1)
and the rate ceiling (§8.5). That shape is the defect this project spent two
days removing.

**Nothing is withdrawn from a user in practice: no mechanism ever existed.**
`rateLimitDose` (`src/lib/dosing/alkalinity.js:351-379`) reads settings only
for plausibility, `safeDoseBand` (`src/lib/analytics/safe-rate.js:43-48`) reads
the hardcoded constant, and `src/components/Setup.jsx` has no rate field at all
(`grep -rn "maxDailyRise\|tighten\|rateLimit" src/components/Setup.jsx` → no
matches). The clause described an intention, not a behaviour.

**Tighten-never-loosen still applies — to bands, where it belongs.** §2's
layers are its home: the user's band (layer 2) may be as tight as they like
inside the safe bounds (layer 1), and the app refuses a target outside them
(§12). A band is the user's judgement about their own corals and their own
tank. A rail is a limit on how fast the app may move a live tank. They are not
the same kind of number, and only one of them is the user's to set.

**If 0.5 dKH/day proves too fast for a real tank, this paragraph is where it
changes** — for everyone, with the reasoning written down and arguable, exactly
as the magnesium rail moved on 14 August. Per `wizard-states.md` §21, a setting
earns its place by solving a problem someone actually hit: a keeper reporting
that their corals react badly to a 0.5 dKH day **is** that problem, and the
setting can be added then. It is not being added in advance of one.

**Decided 14 Aug: the magnesium rail is 25 ppm/day.** This settles a conflict
the canon swap surfaced — the document this file replaced said 50 ppm/day, set
on 13 August, while the merged draft written the same day kept 25, and the two
never met.

For the record, because the losing figure is the better-sourced one: **50 ppm is
the Aqua Forest magnesium label's own stated maximum daily increase.** It is not
a guess, and nothing here says it is unsafe. **25 is chosen as the conservative
figure, for consistency.** Calcium's rail is 20 ppm/day where BRS allows 50 for
large corrections; taking the manufacturer's ceiling for magnesium while taking
the conservative figure for calcium would mean the three rails were picked on
different principles, which is the disagreement-between-numbers failure this app
keeps having. One principle, applied to all three: the conservative number.

**Revisit if corrections prove too slow in practice.** The cost of 25 over 50 is
days on a magnesium correction — a 150 ppm correction takes 6 days instead of 3.
If that shows up as real friction on a real tank, the label figure is there and
this is the paragraph to come back to.

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

Step 2 can produce a negative consumption, when the level is rising faster than
the dose supplies. **See §24** — the clamp to zero stays, but nothing downstream
may size a dose change from it.

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
- Derive a dose change from a negative consumption figure (§24)
- Name a cause for a negative consumption figure it cannot see (§24)
- Tune magnesium's daily dose from a measured gap — ever
- Propose a correction for a level inside its band
- Propose a correction on a reading older than the last intervention
- Propose an alkalinity or calcium correction while magnesium is below
  alert-low
- Move a level faster than the §3 rails
- Change a dose by more than 25% at once, except when outside the band and
  moving further out
- Dose at all when net volume is unset, or use gross volume anywhere (§17)
- Accept a target outside the §2 safe bounds
- Stretch the analysis window to manufacture a consumption figure
- Recommend simultaneous alkalinity and calcium dosing (§20)
- Compute a consumption rate from readings less than 2 days apart (§19)
- Treat a step change across a recorded kit change as real (§19)
- Extrapolate a trend from fewer than 3 readings (§22)
- Substitute a default for a missing measurement without saying so (§16)
- Tell a user their test kit is wrong (§19)
- Judge one parameter by another parameter's thresholds, trend logic or
  evidence bar (§25)

---

## 13. Open items

**13.1 Component 3+ strength.** One retailer's listing gives 25 mL in 100 L
raising magnesium by 0.38 ppm — 0.0152 ppm/mL/100 L at standard strength, or
0.0304 at double. The app uses 0.024, verified earlier against the label two
ways. These do not reconcile, and product versions may differ. **Verify against
the bottle in hand before trusting either.**

**13.2 Notifications.** The app currently waits to be opened.
`correctionProgress` already computes `dueNow`, `overrun` and `stalled`. A
push layer on top of those is a separate design conversation. **Narrowed
14 Aug:** what a notice *contains*, how many there are, and what hiding one
does are no longer open — §25 and `wizard-states.md` §20 settle them. Only the
push layer itself remains open here.

**13.3 `classifyReading`'s duties.** The two previous canon documents disagreed
on whether it validates band/alert consistency. **Answered 14 Aug: it does** —
§18 carries the rule forward, and `wizard-states.md` §13 gives the vocabulary and
boundary rules it returns. The function itself still does not exist
(`.agent/backlog.md` TW-002).

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

---

# Part II — carried forward from the previous canon

**Added 14 August 2026, during the canon swap.** Everything below was in the
`reef-chemistry.md` this document replaced and is **not covered anywhere in
§1–§14**. It is carried forward rather than merged into the sections above so
that §1–§14 keep the numbering every cross-reference and every 13/14 August
decision already uses. Where a rule below has been overtaken by a decision in
Part I, it says so at that rule and Part I wins.

Roughly 35 files under `src/test/spec/` cite the previous canon by section and
line number. Those line numbers are all stale now. The section mapping is:

| Previous canon | Now |
|---|---|
| §0 Philosophy | §15 |
| §1 Universal constants | §16 |
| §2 Water volume | §17 |
| §3 Targets — suggestions, bands | §2 (superseded — one suggested set, alkalinity band 0.6) |
| §3 Targets — alert thresholds, band validation | §18 |
| §4 Testing cadence and precision | §19, and §4 for the windows |
| §5 Three-part reasoning | §20, and §10 for the magnesium gate |
| §6 Rate-of-change rails | §3 — note the magnesium rail was settled at 25 ppm/day on 14 Aug, not the 50 this file previously carried |
| §7 Dose calculation | §21 |
| §8 Consumption rate | §22, and §6 for the maintenance-dose derivation |
| §9 The app must refuse to | §12 |
| §10 Worked examples | §23 |

---

## 15. Philosophy

- **Stability over micromanagement.** Slow correction beats fast correction. The
  app never recommends a large single-step correction.
- Coral health over user convenience.
- When a reading is ambiguous, the app recommends **re-testing**, not dosing.
- The app advises. It never auto-doses. Every recommendation shows its inputs
  and its reasoning.
- The app would rather say "not enough data" than produce a confident number
  from thin evidence.

This is the same instinct §7 and §12 express in arithmetic: an app that always
has an answer is not more useful than one that says what it is waiting for.

---

## 16. Universal constants — fixed for every user

Changing any of these without an `[approved][chem]` item is an S1 defect.
Anything a user configures is marked `[user]` and lives in app settings, not
here.

| Constant | Value |
|---|---|
| Ca:alk consumption ratio | **7.15 ppm Ca per 1.0 dKH** |
| Mg | not consumed proportionally to calcification; depletes slowly and via water changes |
| dKH ↔ meq/L | 1 meq/L = **2.8 dKH** |
| ppm ≡ mg/L | identical — display only, never convert |
| L ↔ US gal | 1 US gal = **3.78541 L** |
| L ↔ imp gal | 1 imp gal = **4.54609 L** — must be distinguished from US gal |
| °C ↔ °F | F = C × 9/5 + 32 |
| "Clearly out" margin — calcium (§27) | **50 ppm past the band edge** |
| "Clearly out" margin — magnesium (§27) | **50 ppm past the band edge** |
| "Clearly out" margin — alkalinity (§27) | **0.5 dKH past the band edge** |

The three margins are distances, never rates, and never a fraction of the band
width. They answer only "is this clearly out"; "is this out" carries no margin
at all. See §27.

Scope, unchanged: **three-part dosing** — alkalinity, calcium and magnesium as
separate additives. Not two-part, not kalkwasser, not calcium reactor.

---

## 17. Net volume

`[user]` net volume — gross system volume minus rock, sand and equipment
displacement.

**Every dose calculation uses net volume. Never gross.** This is the most common
cause of overdosing in software of this kind.

If net volume is unset, the app **refuses to calculate any dose** and names net
volume as the missing input (§12).

**Estimate helper.** The app may offer `net ≈ gross × 0.85` as a starting point.
If used, it must be explicitly accepted by the user, and every dose derived from
an estimated volume is labelled as such wherever it appears. The app prompts the
user to measure properly, once, non-nagging.

---

## 18. Alert thresholds and band validation

§2 sets the target, the band and the safe bounds. Two further layers sit
between the band and the safe bounds and were not carried into §2.

Default alert thresholds, applied to whatever target the user sets:

| Parameter | Alert low | Alert high |
|---|---|---|
| Alkalinity | target − 1.0 dKH | target + 1.0 dKH |
| Calcium | target − 50 ppm | target + 50 ppm |
| Magnesium | target − 200 ppm | target + 200 ppm |

All `[user]` adjustable. The out-of-band window is therefore narrow for
alkalinity — under §2's 0.6 band it runs from 0.3 to 1.0 dKH from target — and
the app must handle a reading landing exactly on either edge correctly
(`wizard-states.md` §13).

**The bands and the alert thresholds must never be allowed to overlap or
invert.** `classifyReading` validates this on every call and returns
`insufficient-data` with a configuration error if a user has set them
inconsistently. This answers §13.3 for the band/alert half of that open item.

**Universal rule regardless of chosen targets:** stability at a slightly
sub-optimal number beats movement toward an optimal one. If a value sits outside
the user's target but the series is stable, the app suggests reconsidering the
target before suggesting a correction.

---

## 19. Testing precision, the cadence minimum, and kit changes

- **Alkalinity is tested no more often than every 2 days.** This is the design
  assumption for all consumption maths. A tank drawing ~0.4 dKH/day produces
  ~0.8 dKH of signal over that interval, comfortably above any common kit's
  error.
- **The app must not compute a consumption rate from readings less than 2 days
  apart.** It says when to test next instead. This is a floor on the interval
  between two readings, and is separate from §4's analysis windows and §7's
  requirement of at least 3 readings.
- Absolute accuracy is not required. Users target stability against their own
  kit. **The app never tells a user their kit is wrong.**
- **Kit change flag `[user]`.** When the user records a change of test kit or
  brand, the app marks that point and must not read the step change across it as
  consumption or trend. It requests a fresh baseline.

---

## 20. Three-part coupling and the precipitation guard

**Calcification coupling.** Alkalinity and calcium are consumed together at
7.15 ppm Ca per 1.0 dKH (§16). Therefore:

- If measured alkalinity consumption implies a calcium draw the user's calcium
  dosing does not cover, calcium is drifting down. The app surfaces this
  **before** the calcium reading confirms it.
- If calcium falls while alkalinity is stable, calcification is **not** the
  cause. The app says so and does not reflexively recommend more calcium —
  precipitation, low magnesium, or a testing error are likelier. It points
  there.
- Dosing alkalinity alone over time is a defect state, not a valid
  configuration. Flag it.

**Precipitation guard.** Never recommend simultaneous alkalinity and calcium
doses. Separate by at least **4 hours** (`[user]`, minimum 1). Never recommend
dosing both into the same location at the same time.

This guard applies **only between calcium and alkalinity**. Magnesium does not
precipitate with either and can be dosed within five minutes of both — see §10,
which corrected an earlier version of this rule.

**The magnesium gate** — no alkalinity or calcium correction while magnesium is
below alert-low — is §10, not repeated here.

---

## 21. The correction dose formula

This is the arithmetic for a **correction** (§9) — a one-off dose that moves a
level. The maintenance dose that holds a level is §6 to §8, and the two must not
be confused (§1).

```
dose_mL = (target − current) × net_volume_L / potency
```

`potency` `[user]` = change in the parameter per mL per litre, taken from the
product's own documentation. Product-agnostic: the app stores a potency per
product per parameter and nothing about brands.

Rules:

1. **Convert units first. Round last.** Never round an intermediate value.
2. Round to the doser's minimum increment `[user]`.
3. **Round down on the first correction of any parameter.** Under-correcting is
   recoverable; over-correcting is not.
4. Doses above `[user]` mL are split across the day.
5. Every recommendation states: product, potency used, net volume assumed, mL,
   expected delta, days to target.
6. Any missing input is named. The app never substitutes a default silently.

Rule 1 is not the same statement as §8.2's rounding constraint, which orders
rounding *first* among the five constraints applied to a staged maintenance-dose
figure. Both are true of their own pipeline: never round an intermediate inside
a calculation; round the staged figure before the constraints that read it.

---

## 22. Consumption rate — data requirements

These are requirements on the data a rate may be computed from. The derivation
itself is §6, and the analysis windows are §4.

- Requires at least 3 readings spanning at least 6 days.
- Fewer: the app says "insufficient data", shows what it has, gives no rate.
- Readings across a recorded kit change do not combine (§19).
- The rate is always reported with the interval it came from.

**Overtaken in part by §6's 14 August decision.** The previous canon also said
"a water change between readings must be accounted for or the span discarded."
For the three dosing engines that is now settled the other way: water changes
stay in the trend fit, and only logged corrections are subtracted, for the
reasons in §6. The line is kept here because it still describes the
analytics-layer `consumptionRate`, which does account for water changes
(`computeElementConsumption`) — but the two layers now answer the same question
differently, and **that divergence is not resolved**. It needs one answer.

---

## 23. Worked examples — executable test vectors

Illustrative numbers. These become tests verbatim; they check the reasoning, not
any particular tank. Carried forward unchanged, including example 1's 1.0 dKH
band, which predates §2's tightening to 0.6 — the reasoning under test is the
rail and the multi-day split, not the band width.

```
1. GIVEN net 68 L, alk 7.6, target 8.5, product potency such that 1 mL raises
   68 L by 0.0147 dKH
   THEN total need 0.9 dKH = 61 mL; exceeds the 0.5 dKH/day rail
   → 2-day plan; day one capped at 0.5 dKH = 34 mL, rounded DOWN to the doser
     increment; flagged "multi-day correction"

2. GIVEN net volume unset
   THEN refuses; names net volume as the missing input; offers the 0.85 helper

3. GIVEN alk consumption 0.4 dKH/day; user's calcium dosing covers 1.5 ppm/day
   THEN implied Ca draw = 0.4 × 7.15 = 2.86 ppm/day
   → flags a 1.36 ppm/day shortfall BEFORE the Ca reading falls

4. GIVEN Mg 1140 with alert-low 1150, and alk 7.4 with target 8.5
   THEN addresses magnesium only; explicitly defers the alk correction and says why

5. GIVEN two alk readings 1 day apart
   THEN no consumption rate; states the 2-day minimum; says when to test next

6. GIVEN a kit change recorded between reading 4 and 5
   THEN series split at that point; no trend across the boundary; fresh baseline
   requested

7. GIVEN Ca falling 8 ppm/week, alk flat within ±0.1 dKH
   THEN does NOT recommend more calcium; surfaces precipitation, magnesium and
   test error as likelier causes

8. GIVEN an alk dose and a Ca dose both due
   THEN never scheduled together; separated by ≥4 hours

9. GIVEN alk exactly at the no-action lower edge (target 8.5, band ±0.3 → 8.2)
   THEN classified in range, not out of range (edges inclusive of their band)

10. GIVEN target 8.5, upper edge 8.8, stored reading 8.849 displayed as 8.8
    THEN classified on 8.849 (out of range), not on the displayed 8.8
```

---

# Part III — decided after the canon swap

Part II above is carried forward from the previous canon. What follows was
decided after it and is new canon, not a restatement of anything older.

---

## 24. Negative consumption

**Decided 14 Aug (Dan, spec owner): a negative consumption never sizes a dose
change. Hold, report the observation, ask about what the app cannot see, and
escalate only on repetition.** This replaces the option authorised in
`routines/15-phase6-bugs.md` bug 2 — `.agent/five-decisions.md` Decision 3's
option (c), a refusal for any gain beyond the element's trend-noise floor —
which was wrong at the premise and was tried, measured and reverted first.
The evidence and the reasoning are in `.agent/needs-dan.md`.

### Why the premise was wrong

The earlier working assumed a negative consumption meant the model had broken.
It does not. **626 of the 6,000 random assessments in
`tests/legacy-port/invariants.js` produce one**, and the legitimate causes are
ordinary: a one-off correction, a water change with a richer salt, demand
collapsing, a wrong Setup strength, a bad reading, or a fast nitrate drop
(~2.3 dKH per 50 ppm NO3, forum-level sourcing — Decision 3 records the limit
on it). The legacy behavioural suite already knows this, which is why
`tests/legacy-port/protocols.js` expects **`hold`** for magnesium §61 — a
reading of 1360 → 1380 → 1400 over 14 days, comfortably inside its band, whose
consumption comes out at −1.86 ppm/day.

### The actual bug — the cut, not the clamp

The clamp itself is right: a negative maintenance dose is not a thing anyone
can pour, and zero is the honest floor. What was wrong is what followed it.

A forced `maintenanceDose` of 0 against any positive `currentDose` reads as a
**100% gap** to `doseDriftedFrom`, which saturates both the 12% alkalinity and
30% calcium triggers unconditionally. The engine then walks into its act block
and sizes a reduction from that zero. On Decision 3's worked alkalinity case —
9.0 mL/day of a 0.05 dKH/mL/100 L solution in 72 L, supplying 0.625 dKH/day
against a measured +0.9 dKH/day — that came out as a staged cut to 6.8 mL/day,
**roughly 25%**, toward a level the arithmetic never diagnosed as excessive.
**That cut is the harm.** Nothing on screen said the working had implied the
tank was manufacturing alkalinity.

Bracketing (§8.3), named elsewhere as the only real defence against a wrong
Setup strength, computes the same `currentDose × effectPerMl − trend` and
discards every observation when it is not positive — so it is **inert for
exactly as long as a gaining event lasts**, and cannot catch the cut either.

### The rule, four parts

1. **Hold.** When consumption comes out negative, never derive a dose change
   from it. `recommendedDose` equals `currentDose`, nothing is staged, and no
   plan is left behind.
2. **Report the observation, not a cause.** The level is rising faster than the
   dose accounts for, and the dose is unchanged. **The app must not claim to
   know why.** Every candidate cause is consistent with the same arithmetic, so
   naming one would be a guess wearing a diagnosis's clothes.
3. **Ask what it cannot see.** Has a water change or a one-off correction been
   logged? If one has, name it and say it would account for the rise. If none
   has, ask — and say that this may be a testing error or a change in demand,
   and to test again in **two days**.
4. **Escalate on repetition, not on a single instance.** **Three consecutive
   negatives with nothing logged** is a real signal — most likely a wrong Setup
   strength or genuinely collapsed demand — and the app should say so. One
   reading is a reading; three is a pattern. Consecutive means counted from the
   newest interval backwards and stopped at the first that does not gain, and
   "nothing logged" means no water change and no correction for that element
   dated inside the window the trend was fitted over.

The action stays `hold` at every step, including the escalation. Escalating
changes what is said, never what is dosed.

### The one qualification — the level outranks the arithmetic

**A level at or over the top of its range and still rising keeps its
reduction.** That answer comes from where the element is, not from the
consumption sum, and holding there would leave a tank without guidance at the
moment it most needs it. Decision 3 named suppressing it as the concrete
regression risk of any refuse-style fix, and the protocol corpus agrees:
`protocols.js` Mg §56 (1480 → 1495 in a week, five ppm below the top of its
range) is a gaining reading whose required answer is still `decrease`.

Expressed in each engine's own existing vocabulary, with no new threshold
invented: the level is above its band and the trend is positive, or — for
calcium and magnesium, which already compute it — `nearEdge` reads `"upper"`.
Alkalinity has no near-edge notion of its own and is tested on band position
alone.

### What it costs, measured

Against the 5,940-case golden sweep: 1,206 assessments produce a negative
consumption. **60 change** — 14 calcium and 46 magnesium, every one of them
`decrease → hold`, and nothing else in the sweep moves. 732 already held for
another reason and are untouched. 746 keep their reduction under the
qualification above, because the level is out of band or at its upper edge and
still climbing.

**The golden fingerprint moves with this, by design:** `37ded9064e91e80e →
372fcda432be5bcf`, re-recorded through `golden.js`'s own documented `UPDATE=1`
mechanism after the diff was audited row by row. `37ded9064e91e80e` was also
the proof that the port matched `legacy/` byte for byte; it no longer does, and
the 60 rows above are the whole of the difference. `legacy/` itself is
untouched.

### Surfaces

`doseStatus`'s two idle cards both say the dose is matching consumption, which
is the one thing this case knows to be untrue — "nothing to do, keep testing on
your usual schedule" printed under a wizard asking for a retest in two days is
a direct contradiction. A hold reached this way is marked, and the card echoes
the wizard's words instead (`wizard-states.md` §0.3). The `state` stays
`"idle"`: no dose change is being asked for, which is what every consumer of
that field reads it to mean.

### Enforced by

Per §14, named rather than asserted:

- `src/test/defects/negative-consumption.test.js` — all four parts, in all
  three engines, plus the qualification and the dose card. 13 assertions;
  12 of them fail against the code as it stood before this rule.
- `tests/legacy-port/invariants.js` — `consumption` and `maintenanceDose` are
  never negative (the clamp survives; the earlier attempt broke this by
  returning before it).
- `tests/legacy-port/protocols.js` — Mg §61 holds, Mg §56 still decreases.
- `tests/legacy-port/golden.js` — the 60 changed rows, pinned.

### In plain terms

Sometimes a tank shows more alkalinity, calcium or magnesium than your dose can
explain. That is not the app breaking and it is not always a mistake — a water
change with a richer salt, a correction you added, your corals eating less, a
wrong bottle strength in Setup, or simply a duff test will all do it.

What the app used to do was treat the impossible sum as though it meant "you
are dosing too much", and quietly recommend cutting your dose by about a
quarter — with nothing on the screen saying the maths had just implied your
tank was making alkalinity out of nothing. That cut was the problem.

Now it holds your dose where it is and tells you what it actually saw: the
level is climbing faster than your dose accounts for, and the dose has not been
changed. It does not guess why, because it cannot. It asks the one thing it
cannot see for itself — did you do a water change or add a one-off correction?
— and if you did, and logged it, it says so and moves on. If you did not, it
suggests testing again in two days, because a bad test result is the cheapest
explanation to rule out.

If it happens three readings running with nothing logged against any of them,
that stops being one odd result. Then it says so plainly: most likely the
strength you entered in Setup is wrong, or your tank's demand really has fallen
away. It still does not change your dose.

The one exception: if the level is already at or over the top of your range and
still climbing, you do get told to dose less — because at that point it is the
level telling you, not the arithmetic, and a tank going high needs an answer.

---

## 25. The Reef Chemistry Engine

**Decided 14 Aug (Dan, spec owner): one engine assesses every parameter. Every
surface renders its verdict. No surface forms its own opinion.** It is called
the **Reef Chemistry Engine**.

This section is what the engine must assess and with what reasoning. The
surfaces half of the same decision — which screen shows which verdict, and how
a notice behaves once shown — is `wizard-states.md` §19 and §20. Folded in here
on 14 August from `docs/spec/DECISION-reef-chemistry-engine.md`, which this
section and those two replace; that file is deleted, not superseded in place.

**This is the third time the single-source principle has been arrived at
independently on this project** — after the dose engines (§7,
`wizard-states.md` §0.3) and the classifiers (`wizard-states.md` §11). It is
the same rule again, applied to assessment.

### One engine, not two

An earlier proposal was two engines — one for the dosed elements, one for
everything else, sharing a rule between them. Rejected:

> *"What about the dosing wizard and notifications just coming from one
> location? The engine measures the alkalinity, calcium and magnesium levels,
> but everything else as well, including phosphate — it just doesn't display
> that in the dosing wizard. That way it's all coming from one spot and the
> wizard doesn't have to compete with anything."*

Two engines with one rule between them are still two engines that can drift.
One engine has nothing to drift against.

**The dosing wizard is a screen, not the source.** It displays alkalinity,
calcium and magnesium because those are the three that are dosed (§16, scope).
The engine assesses phosphate, nitrate, salinity and the rest in the same pass
and simply does not display them there. That is the point of the change: there
is nothing for the wizard to compete with, because there is no second opinion
anywhere.

### One engine does not mean one set of rules

**Per-parameter logic, inside one engine.** Alkalinity, phosphate and salinity
behave differently and need different reasoning, and this document already
says so element by element — §4's cadences and windows, §5's noise floors,
§3's rails and §10's magnesium exemption are all statements that one
parameter's reasoning is not another's.

The current app has the opposite arrangement, and it is a defect:

> *"I have noticed silly notifications of phosphate coming up and silly
> notifications of nitrate coming up, which don't make sense, because the wrong
> measurements are being applied to them — it's the same measurements as
> alkalinity and calcium."*

Phosphate bounces. It genuinely does. Applying alkalinity's trend logic and
thresholds to it produces noise dressed as findings. **That is a real defect,
not a display problem** — the notices are wrong, not merely unhelpful — and it
is filed as `.agent/backlog.md` TW-029.

Added to §12's refusals: **the app does not judge one parameter by another
parameter's thresholds, trend logic or evidence bar.**

### Parameters the engine must cover

| Group | Parameters | Where its reasoning is written |
|---|---|---|
| Dosed, and already assessed | alkalinity, calcium, magnesium | §1–§11, §16–§24 — in full |
| Assessed with borrowed and wrong reasoning | phosphate, nitrate | **nowhere** — TW-029 |
| Needs its own treatment; not assessed at all today | salinity | **nowhere** — TW-030 |
| Different data source entirely | ICP panels | **nowhere** — not scheduled |

**Naming a parameter in this table does not authorise inventing its
thresholds.** Each of the last three needs its own reasoning written into this
document first, sourced the way §2, §3 and §5 are sourced, before it can be
assessed properly. Until then the engine covering a parameter means covering
it correctly or not at all — a borrowed threshold is what this decision
removes, not what it extends. This is Phase 8b, item 4 of the five unspecified
areas.

Salinity has one figure here already — the 0.5 ppt/day rail in §3, carried
forward from the previous canon — and nothing else. A rail is not an
assessment.

### Not a rebuild

`deriveTankState` (`src/App.jsx:67`), `assessAlkalinity`, `assessCalcium`,
`assessMagnesium` and `doseStatus` already exist and are the best-tested code
in the app — 5,940 pinned golden cases and three-year simulations behind them.
**The engine is those consolidated and extended to the parameters they do not
currently cover, not something new written from scratch.** A rewrite would put
that corpus at risk to gain nothing this decision asks for.

**`deriveTankState` remains the function that runs it.** *Reef Chemistry
Engine* is the name of the thing, usable in this document, in the code and in
describing the app to someone else. It is not the name of a new call.

### What this settles, and what it does not

Settled here: that there is one assessment step; that every parameter goes
through it; that the wizard is a display of three of its verdicts and not their
source; that per-parameter reasoning lives inside the one engine; and that
phosphate and nitrate carrying alkalinity's reasoning today is a defect.

Not settled here, and not to be inferred from it:

- the actual reasoning for phosphate, nitrate and salinity — thresholds,
  windows, noise floors and what counts as movement for each. None of it
  exists yet in this document and none of it may be minted from this section.
- the evidence rules `docs/journeys/journey-4b-notification-matrix.md` asks
  for — how many readings establish movement, how far apart, and how much
  movement contradicts a dose change. §22 sets minimum evidence for a
  *consumption rate* only. 4b's open questions 2–5 are still Dan's.
- ICP panels, which have a different data source and no reasoning written at
  all.

### Enforced by

Per §14, named rather than asserted: **nothing asserts any of this today.**
`scripts/verify/wordingcheck.mjs` checks that one loop in one function repeats
the wizard's headline, which is a fraction of the rule. The enforcement this
section needs is `.agent/backlog.md` TW-028, and until it exists this section
describes an intention.

### In plain terms

One part of the app works out what is going on with your tank, and it does it
for everything you test — not just the three you dose. Every screen then shows
what that one part concluded. Nothing else in the app gets to have its own
opinion, so two screens cannot tell you different things about the same
reading.

The dosing wizard only shows alkalinity, calcium and magnesium because those
are the three you pour. Phosphate, nitrate and salinity are worked out in
exactly the same breath — they just are not printed on that screen.

Working everything out in one place does not mean judging everything by the
same yardstick. Phosphate bounces around in a way alkalinity never does, and
measuring it as though it were alkalinity is what produces the daft phosphate
and nitrate warnings you have been seeing. Those warnings are wrong, not just
annoying, and fixing them is a job of its own. Salinity is not assessed at all
today. Both need their own proper rules written down here first — this
decision says they must be covered, not what the numbers are.

None of this is a rewrite. The existing dosing engines are the best-tested
thing in the app, with nearly six thousand pinned cases behind them; the engine
is those tidied into one place and stretched to cover the parameters they
currently ignore.

---

## 26. Position is the last reading

**Decided 14 Aug (Dan, spec owner): position is always the last reading.
Whether a level is in band, out of band, or at which edge — that question is
answered by the most recent measurement, never by a fitted or projected value.
History is for trend, direction, consumption and dose. It is never used to
assert where the level is now. The app must never state a position that no
measurement supports.**

If the last reading says 8.5 and the band starts at 8.2, the level is in band.
It is on the upper edge, but it is in band.

This supersedes `.agent/needs-dan.md` item 3's option (b), which offered a
choice of measure and observed that unifying on the fitted value was probably
the smaller change. **It is the wrong direction, and size is not the deciding
factor.**

### What was wrong

Every side-of-band question in the three engines was answered from `fittedNow`
— the correction-adjusted least-squares value at the last timestamp — while the
sentence reporting the answer quoted the last raw reading. The two disagree
whenever the newest reading sits off the fitted line, which is exactly what a
recovering tank and a running correction both produce. The app printed, from
its own code and its own shipped bands:

| What the app said | The band | The reading it named |
|---|---|---|
| "Alkalinity is below your range at 8.5dKH" | 8.2–8.8 | in band |
| "Calcium is below your range at 405ppm" | 400–450 | in band |
| "Calcium is above your range at 445ppm" | 400–450 | in band |
| "Magnesium is below your range at 1260ppm" | 1250–1400 | in band |

The reverse ran silently: a newest reading outside its band, with a fitted value
inside it, reached the "dose is matching consumption" card and was reported as
though the tank were in range.

### What the rule covers

Every test of which side of the band a level sits on, in all three engines and
on the dose card:

- `inRange` / `above` / `below` — the position triple each engine derives.
- `nearEdge` (calcium and magnesium) — "at which edge", named in the decision.
- `alkClearlyOut` / `caClearlyOut` / `clearlyOut` — position plus a margin
  beyond the edge.
- §11's grading qualifiers, which take their position from the triple above.
- `doseStatus`'s two position tests — whether a settled dose change worked, and
  whether the level is off target.

**The measure moves; no threshold moves.** The 0.2 dKH / `CA_TREND.stable` /
`MG_TREND.stable` margins, the 12%-of-band edge proximity, both §11 qualifiers
and every trigger percentage are untouched. They are simply measured from the
last reading now.

### What the rule does not cover

Trend, direction, consumption, the maintenance dose and every rate the app
quotes stay fitted, over the correction-adjusted window (§6). Nothing in this
decision touches them.

Three position tests were already compliant and stay as they are: the emergency
check in each engine (§2 layer 1 safe bounds), `correctionProgress`'s arrival
zone (§9), and `proposeCorrection`'s in-band guard. So do statements about where
a level *started* — "magnesium started this period below your range at 1100 ppm
and has been moving up to 1260" is history, and history is what it is for.

### What it costs, measured against the 5,940-case golden sweep

**172 rows change.** 163 alkalinity, 8 calcium, 1 magnesium — and **every one
of them has a logged correction**, which is the state that makes the fitted and
measured positions diverge. Audited by element and by direction:

- **54 rows, all alkalinity, `increase → hold`.** 29 of those have a last
  reading *above* the band: the app was recommending a larger alkalinity dose
  — 9.0 → 10.6 mL/day in one case, an 18% raise — for a tank whose newest
  reading was 8.87 dKH against a range topping out at 8.8. That is the
  direction that matters, and it now holds.
- **40 rows change band grade**: 36 `mild → stable` (the fitted value said out
  of band, the reading says in) and 4 `stable → mild` — those four all have a
  last reading above the band and still rising, so §11's grading became
  *stricter* where the reading is the worse news.
- **1 row changes card state**, `idle → off-target`: calcium at 451 ppm against
  a 400–450 band, previously "dose is matching consumption", now "steady but
  above your range".
- **41 further rows move `recommendedDose` without changing `action`** —
  staging fractions responding to `nearEdge`.
- **0 rows** move the dose away from the band its last reading is on, in either
  direction, for any element.

The golden fingerprint moves by design: `fbac65244f00ac9b → 83780c1728b67ca6`,
re-recorded through `golden.js`'s documented `UPDATE=1` mechanism after the
diff was audited row by row.

### One consequence worth stating

`doseStatus`'s "dose right, level off" card is removed. It said what the
"steady, off target" branch above it already says, and existed only because the
two branches measured position differently — one on the fitted value, one on
the last reading — so a level the fit called in-band and the kit called
out-of-band fell between them. With both reading the last reading the earlier
branch always returns first and the condition became unreachable. Nothing a
keeper used to see is lost; the surviving branch carries it, and says it more
precisely.

### Flagged, not changed — needs its own decision

**The one-off correction is still sized from the fitted value.** `toMid`, in all
three engines, measures the distance from the fitted position to the band
midpoint and converts it to millilitres. It is not a side-of-band test, so it
is outside what this decision authorises — but it is a distance measured from a
position, and it now disagrees with the position the same card reports. Moving
it to the last reading would change **39 further golden rows**, all of them
one-off correction volumes: alkalinity 18.5 → 13.9 mL and 20.4 → 14.1 mL are
real examples, so it is a change of up to about 30% in what a keeper is told to
pour. That is a dose figure, and dose figures need their own authorisation
(AGENTS.md #3). See `.agent/needs-dan.md`.

Also flagged, separately: `caClearlyOut` and `clearlyOut` compare a **distance**
in ppm against `CA_TREND.stable` (5 ppm/**week**) and `MG_TREND.stable` (10
ppm/**week**), which are rate constants. The comparison is dimensionally wrong
whichever measure feeds it, and predates this decision. Not touched here.
**Settled 15 Aug by §27**, which gives the three margins their own named
constants and moves the figures; the position they are measured from is still
this section's.

### Enforced by

Per §14, named rather than asserted:

- `src/test/defects/position-is-last-reading.test.js` — both directions, all
  three engines, the dose card and `nearEdge`. 17 assertions; **all 17 fail
  against the code as it stood before this rule.**
- `tests/legacy-port/invariants.js` — the app never says "nothing to do" about
  a level outside its band. The property is unchanged; its measure of "outside
  its band" moved from the fitted value to the last reading, in the test as in
  the code.
- `tests/legacy-port/golden.js` — the 172 changed rows, pinned.

### In plain terms

If your test says 8.5, your alkalinity is 8.5. That sounds too obvious to need
writing down, and it was not what the app did.

The app draws a line through your recent readings to work out which way things
are heading, and how much your tank is using. That is the right way to answer
those questions. But it was also using that line to decide *where your tank is
right now* — and the line and the last test do not always agree, particularly
while a correction is running or a level is climbing back. So it would tell you
"alkalinity is below your range at 8.5" when your range starts at 8.2. Both
halves of that sentence came out of the same app, and one of them was wrong.

Worse, in the 5,940 test tanks it kept behind it, that mistake had the app
telling people to *increase* their alkalinity dose — by nearly a fifth in one
case — on a tank whose latest test was already above the top of its range. It
now holds instead.

From now on: where your tank is comes from your last test, every time, on every
screen. How fast it is moving, what your corals are using, and what to pour
still come from the whole history, because a single test cannot tell you those
things. A test you actually did will never again be overruled about the one
thing it is definitely qualified to answer.

---

## 27. Out, and clearly out

**Decided 15 Aug (Dan, spec owner): out and clearly out are two different
questions and get two different numbers.**

**A level is out the moment it is past the band edge by any amount.** 455 ppm
against a 400–450 band is out. There is no margin on this, no tolerance and no
rounding toward the band.

**A level is clearly out once it is past the edge by a fixed margin: calcium
50 ppm, magnesium 50 ppm, alkalinity 0.5 dKH.** Fixed figures, not scaled to
band width — a keeper who widens their band has not decided that being far out
matters less.

This closes `.agent/needs-dan.md` item 5 as its option (b) taken further: the
margins become named constants of their own, and the figures move. Option (c)
— pointing them at §5's kit noise floors — was **not** taken. How well a kit
can see a level is a third question again, and tying the margins to it would
mean that changing a test kit in Setup changed how far out of range a tank had
to be before the app called it clearly out.

### What was wrong

`caClearlyOut` (`calcium.js`) and magnesium's `clearlyOut` (`helpers.js`) asked
whether a level was far enough past its band edge to count as clearly out, and
answered it like this:

```js
const caClearlyOut = above ? (posNow - def.max) > CA_TREND.stable
  : below ? (def.min - posNow) > CA_TREND.stable : false;
```

The left side is a **distance in ppm**. `CA_TREND.stable` is **5 ppm per week**
and `MG_TREND.stable` is **10 ppm per week** — rate constants, declared as such
in their own comments (`calcium.js:28`, "ppm/week — below this, treat as test
variation"). Comparing the two is a category error. Nothing was visibly wrong
on screen; the harm was ahead of us, in the next person to move a trend
constant for trend reasons and silently move the out-of-band margin with it.

Alkalinity's `alkClearlyOut` did not have the dimensional fault — it compared
against a literal `0.2`, which is a dKH distance — but 0.2 dKH is too small
under this decision, and an unnamed literal is invisible to anyone looking for
the app's out-of-band margins.

### The rule

1. **Out has no margin.** `inRange` / `above` / `below`, and every sentence and
   badge derived from them, test the last reading (§26) against `def.min` and
   `def.max` with nothing added to either. A level 0.1 ppm past the edge is out
   and is said to be out.
2. **Clearly out is a fixed distance past the edge**, in the parameter's own
   unit: `ALK_CLEARLY_OUT` 0.5 dKH, `CA_CLEARLY_OUT` 50 ppm, `MG_CLEARLY_OUT`
   50 ppm. Each is declared beside its engine's other constants as a bare
   number, derived from nothing.
3. **The two families of constant never touch.** A margin must not be defined
   in terms of a trend constant, a kit noise floor (`KIT_PRECISION`,
   `KIT_SIGMA`), or a band width. **Adjusting how fast counts as moving must
   never change how far counts as out**, and the reverse.

### What the rule covers

`alkClearlyOut`, `caClearlyOut` and `clearlyOut` — the three margin tests, one
per engine. Each feeds exactly one thing: the `*Worsening` flag that decides
whether a level outside its band and still drifting further out may be held on
a sub-noise trend.

Nothing else moves. The position those distances are measured from is §26's and
is untouched. The trend constants keep their values and their meanings. The
12%-of-band `nearEdge` proximity, §11's grading qualifiers, the dose-gap
trigger and every rate ceiling are untouched.

### What it costs, measured

**The 5,940-case golden sweep does not move: `3a782222dbce41c5` before and
after.** That is not evidence the change is inert — it is evidence the corpus
cannot see it, and the reason is worth recording. `clearlyOut` only ever
reaches an outcome through `*Worsening`, which additionally requires either a
trend at or above the element's own "stable" rate — which would have taken the
band off "stable" and skipped the branch entirely — or **two** logged
corrections. `golden.js` logs at most one. The margin is unreachable in every
one of its 5,940 cases, at either the old figures or the new ones.

So the change was audited on the same grid with the correction count swept
0, 1 and 2 — 2,970 cases each, old engine against new:

| Logged corrections | Cases | Rows changed |
|---|---|---|
| 0 | 2,970 | 0 |
| 1 | 2,970 | 0 |
| 2 | 2,970 | **70** |

The 70, by element and direction:

| Element | Direction | Transition | Card | Rows |
|---|---|---|---|---|
| alkalinity | below | `increase → hold` | `suggested → suggested` | 17 |
| alkalinity | above | `decrease → hold` | `suggested → off-target` | 17 |
| calcium | below | `increase → hold` | `suggested → suggested` | 3 |
| calcium | above | `decrease → hold` | `suggested → off-target` | 3 |
| calcium | below | `hold → hold` | `off-target → suggested` | 10 |
| calcium | above | `hold → hold` | `off-target → off-target` | 10 |
| magnesium | below | `hold → hold` | `off-target → suggested` | 5 |
| magnesium | above | `hold → hold` | `off-target → off-target` | 5 |

Symmetric: 35 below, 35 above. 34 alkalinity, 26 calcium, 10 magnesium.

- **40 rows withdraw a dose change**, `increase`/`decrease → hold`. The
  recommended dose reverts to what the keeper is already pouring, a move of
  **0.9% to 10.1%**. The largest is calcium at 384 ppm — 16 ppm below a 400–450
  band, on a trend of 0 ppm a week — where the app recommended 13.1 mL/day and
  now holds at 12.0. An alkalinity example: 7.93 dKH against 8.2–8.8, 9.7 mL/day
  → hold at 9.0. **This is the cost of the decision, not a side effect of it**:
  a level that is out, but not clearly out, on a trend the test cannot resolve,
  is no longer grounds for changing the daily dose.
- **30 rows keep the same dose and change only what is said about it.** These
  previously fell past the stable-hold branch and explained themselves in
  consumption arithmetic; they now take that branch and say plainly that the
  level is holding outside the range, naming the figure and the side. Where the
  level is below the band, the card also now offers the one-off correction that
  branch carries. `recommendedDose` is identical on all 30.
- **0 rows changed whose last reading is in band.** The margin governs only
  levels already out.
- **0 rows became `idle`** — the card that says the dose is matching
  consumption and there is nothing to answer for.
- **0 rows stopped saying the level is above or below the range.** Out is still
  out, and still said, on every one of the 70.
- **All 70 changed rows sit strictly between the old margin and the new one** —
  alkalinity 0.204–0.408 dKH past the edge, calcium 15–50 ppm, magnesium 45 ppm.
  Nothing outside that window moved, in either direction, for any element.

### Flagged, not changed

**The golden sweep is blind to this margin, and to anything else gated on two
or more logged corrections.** Its `withCorrection` dimension is a boolean — one
correction or none — so `repeatedCorrections(...) >= 2` is false in all 5,940
cases. That is a gap in the app's widest behavioural net, not a fault in this
decision, and it is not fixed here: widening the corpus re-records the
fingerprint for reasons unrelated to §27 and belongs in its own item. Filed as
`.agent/backlog.md` TW-047.

### Enforced by

Per §14, named rather than asserted:

- `src/test/defects/clearly-out-margins.test.js` — 47 assertions. 13 pin the
  no-margin half (each element, each direction, a hair past the edge). 24 pin
  the margin itself, at the new figure, past the old figure, and just inside
  both, in both directions on all three engines. 10 are structural: each margin
  is exported at its decided value, is declared as a bare number, and each
  `clearlyOut` expression names its margin constant and contains no `_TREND`
  reference and no numeric literal. **22 of the 47 fail against the code as it
  stood before this rule.**
- `tests/legacy-port/invariants.js` — the app never says "nothing to do" about
  a level outside its band. Unchanged and still green; the audit above confirms
  no row reached `idle`.

### In plain terms

Your range is 400 to 450. At 455 your calcium is out. Not "nearly out", not
"out within tolerance" — out, and the app says so, exactly as it does at 500.
That has not changed and now cannot quietly change.

What has changed is the second question the app asks after that one: *how far*
out. There is a point past your range where a level that is drifting the wrong
way, however slowly, is worth changing the daily dose over. Below that point it
is worth telling you about, and worth correcting in one go if a correction is
possible, but not worth chasing with the dose — because the movement is smaller
than your test kit can honestly measure, and chasing it is how the up-down-up
oscillation starts. That point is now 50 ppm for calcium and magnesium and
0.5 dKH for alkalinity.

Underneath, two of those three numbers were not distances at all. They were the
figures for *how fast* a level counts as moving in a week, borrowed to answer
*how far* it sits from your range — different kinds of measurement entirely,
like answering "how far is the shop" with "twenty minutes' walk" and then
treating the answer as metres. Nothing on screen looked wrong. The danger was
that the next person to adjust what counts as a fast week would, without
knowing it, have changed what counts as far out of range. The two now have
their own numbers, written down here, and a test that fails if anyone ties them
back together.
