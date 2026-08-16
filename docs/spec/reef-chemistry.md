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
§15, §20 and the new §22. **§27 added, and §1, §8.4, §11 and §13 amended,
15 August 2026** on the spec owner's authority — out and clearly out are two
questions, then the same day the margins were confined to wording only, and a
third dosing instrument was named. Folded in from
`docs/spec/DECISION-drift-back.md` (now deleted), the same way §25 was folded
in from `DECISION-reef-chemistry-engine.md`. **§28 added 15 August 2026** —
drift back. **§28 rewritten, and §1 amended, 16 August 2026** on the spec
owner's authority — automatic dose advice only ever stabilises, and moving a
level is a plan the user opts into, symmetrical in both directions and offered
only once the level is stable. Folded in from
`docs/spec/message-spec-1-wizard.md`, whose wording half is `wizard-states.md`
§23 and §24.

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

**Amended 15 Aug (Dan, spec owner): two instruments become three.** The first
two are unchanged and nothing below withdraws them; the third was missing, and
its absence is why the app had nothing useful to say to a tank sitting above
its range.

- A **daily dose** replaces what the tank consumes. It **holds** a level. It
  cannot move one in any reasonable time.
- A **correction** is a one-off or temporary elevated dose. It **moves** a
  level. It is not a maintenance figure and must be returned from.
- A **drift back** is a deliberate under-dose. It **lets the tank draw a level
  down** by consuming more than is supplied. It is not a maintenance figure
  either, and it must be returned from.

**Amended 16 Aug (Dan, spec owner): the second and third are two executions of
one offer.** Moving a level, in either direction, is a **return plan** the user
opts into; which of the two instruments carries it out follows from the
direction and is not a separate decision the user makes. §28 is the mechanism.

Most confusing advice in reef software comes from conflating these. When the
app says "the dose is right, the level is not", that is this distinction.

Three wizard states exist purely to express the first two. Collapsing them into
"increase the dose" makes the app give advice that cannot work.

### The asymmetry, stated

**The third instrument is downward-only in practice, and that is not an
oversight.**

**Amended 16 Aug (Dan, spec owner): the asymmetry is about how a plan executes,
not about which direction gets offered.** Both directions are offered, on the
same terms, and the app's unprompted advice is the same in both — match
consumption. What differs is what the plan does once opted into.

The offer is symmetric. A level that has climbed out of band is being
over-dosed, and a level that has fallen out of band is being under-dosed;
either way the app's advice is to match consumption, and either way walking the
level back to the middle of the band is a plan offered on top of that advice
and never folded into the dose figure.

The **execution** is not symmetric, and that is the asymmetry this section
records:

- **Upward — an additive exists.** A level is walked up by dosing above
  consumption, which is close enough to a correction (§9) that the existing
  instrument carries the plan.
- **Downward — nothing exists.** There is no additive that lowers alkalinity,
  calcium or magnesium. Coming down happens by dosing less and waiting, which
  is neither holding nor correcting, and until 15 August the app had no name
  for it and no way to offer it. **Where a rise is corrected by adding, a fall
  in the other direction can only be waited out**, and the waiting is the
  instrument.

One practical consequence survives the amendment unchanged: **when a level has
climbed out of band, "hold" is not one of the options.** The current dose is
above consumption by definition — that is what made it climb — so leaving it
alone means continuing to climb, and the dose advice is to decrease to the
point the level stops moving.

What has changed is what comes after it. That advice is the whole of the
advice: it parks the level, and parking it is the point. Walking it home is not
a second dose figure to weigh against the first — it is a plan, offered only
once the level is actually stable. §28 is that plan.

---

## 2. Target ranges — three layers

The app does not impose target ranges. Reefkeepers legitimately run alkalinity
anywhere from 7 to 11 dKH, and the right number depends on their corals,
nutrients and lighting. What the app imposes is the outer limit.

### Layer 1 — Safe bounds (fixed, not user-adjustable)

Where sources describe actual harm, not merely out of range.

| | Safe bounds |
|---|---|
| Alkalinity | 7 – 11 dKH |
| Calcium | 350 – 500 ppm |
| Magnesium | 1150 – 1600 ppm |

Below 380 ppm calcium slows growth; above 500 it pulls alkalinity down. Above
~1600 magnesium causes lethargic invertebrates and suppressed uptake. Randy
Holmes-Farley gives 7–11 dKH as the workable alkalinity range.

**The app refuses to accept a target range outside these**, and names the
reason.

### Layer 2 — The user's target range

**Decided 16 Aug: the user sets a minimum and a maximum. One range, two edges,
no target point inside it.** Everything the app says is relative to *their*
range, not to a hobby consensus.

This corrects the sentence that stood here — "the user sets a target and a
band width" — which described something the app has never done and now never
will. The gap was tested, not inferred:
`src/test/spec/classification/band-edges.test.js` records that no target field
exists anywhere on settings; the user edits two edges directly. A target point
inside the band was **considered and rejected**: a range within a range is more
to configure and more to explain, for a distinction the trend already makes.
Anything in range is fine; movement within the range is worth knowing, and the
trend covers that.

Where canon needs a single anchor inside the range — the aim point a
correction heads for (§9), the anchor §18's alert widths hang from — it is the
**midpoint**, `(min + max) / 2`: derived on the spot, never stored, never
asked for.

### Layer 3 — Starting suggestions (editable, never re-applied)

Shown at first setup, clearly labelled as suggestions.

| | Suggested target range |
|---|---|
| Alkalinity | 8.2 – 8.8 dKH (0.6 wide, midpoint 8.5) |
| Calcium | 400 – 450 ppm (50 wide, midpoint 425) |
| Magnesium | 1275 – 1425 ppm (150 wide, midpoint 1350) |

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
inside the safe bounds (layer 1), and the app refuses a target range outside them
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
the user's target range sits at 7 or at 11.

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

**Open, 15 Aug — the relaxation needs a threshold chosen for this job, and
does not have one.** Relaxing the cap is a stronger action than an ordinary
change, and requiring more than a bare edge crossing for it may well be right.
But it must be sourced from a constant chosen for *relaxing a step cap*, not
borrowed — not from §27's wording margins, and not from a trend constant.
**This decision does not choose it and nothing here changes today.** Recorded
as §13.4 with what is already known: the sentence above and the code have
diverged, and neither is authorised to move until the threshold is settled.

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
The aim point is a point, not a zone. Not the nearest edge — normal drift would
take it straight back out.

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
reading at or beyond the aim point — is computed independently of `arrived`, and
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

**Its two inputs are band position and trend direction. Not a margin.**
Recorded explicitly 15 Aug because the question was asked: "outside its band"
here means past the edge by any amount, exactly as §27 requires, and the only
threshold in this rule is the noise floor on the *movement*. §27's out-of-band
margins have no part in grading and must never be wired into it. Nothing in the
code needed changing for this — `outOfBandWorsening` already takes position,
trend and the noise floor and never took a margin — which is why it is written
down rather than fixed.

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
- Accept a target range outside the §2 safe bounds
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
(`.agent/items/TW-002.md`).

**13.4 §8.4's step-cap relaxation has no threshold of its own.** Opened 15 Aug
by the owner, deliberately left unanswered. §8.4 says the 25% cap relaxes when
the level is "outside its band and still moving further out — see §11". The
code relaxes on something else: `capDoseStep` (`helpers.js:51-60`) widens to
50% when the level is outside §2's **safe bounds**, and to 100% when it is
outside them *and* heading further out. Band and safe bounds are two different
layers — 400–450 against 350–500 for calcium — so the sentence and the code
have been describing different tanks. **Neither is authorised to move.** What
is settled is only what the source may not be: not §27's wording margins, not
a trend constant, not a borrowed figure of any kind. What it should be is a
judgement about how much evidence justifies a larger-than-ordinary step, and
belongs with whoever chooses it. Filed as `.agent/items/TW-049.md`.

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

### The ratio is not a product strength — 16 August

These are two different kinds of fact and must never be reconciled with each
other.

**The Ca:alk ratio is chemistry.** 7.15 ppm Ca per 1.0 dKH is stoichiometric:
calcification deposits CaCO3, so a mole of carbonate takes a mole of calcium
with it. It is the same for every tank, every product and every user, it is
fixed above, and it governs **coupling** — the balanced-consumption band, an
implied calcium draw from measured alkalinity consumption, an implied
alkalinity draw from measured calcium consumption.

**A solution strength is a property of a bottle.** How much a product delivers
per mL depends on what is in it and how the user diluted it. It is not derived
from anything in this document, and no reef fact constrains it.

The two touched once and it was a mistake worth recording. The shipped
strengths implied 6.77 ppm/dKH, and the tempting reading was that they
contradicted the 7.15 above and should be moved to agree with it. They did not
contradict it. 0.3611 ppm/mL/100L was what the Aquaforest 1:1 recipe genuinely
delivers, and **that recipe really is slightly calcium-light against a true
7.15** — a fact about the product, not an error in the table. Moving the
strength to make the ratio come out right would have made the app claim a
bottle delivers something it does not, and under-dosed calcium by the
difference on every tank running that default.

So: a mismatch between a user's strengths and 7.15 is a finding about their
recipe, which the app may surface. It is never a reason to change either
number. Nothing in the app derives a strength from the ratio.

### Solution strengths are not shipped at all — 16 August

There is no default strength for alkalinity, calcium or magnesium. The app
must not ship a plausible number for something only the user can know.

Every dose, consumption figure and correction is scaled by this number, and
nothing in the app can check it — canon has called that the single largest
correctness risk since day one. A default makes it worse rather than better,
because it hides the fact that the figure was never set: a blank field is
visibly unanswered, while 0.0533 looks like something somebody decided.

An unset strength behaves exactly as an unset net volume does (§17, §12):

- no dose recommendation, and no correction;
- the level, its movement, and whether it is in range, all unaffected — those
  come from the readings and need no strength;
- the missing input **named**, never a silent null or a NaN.

**The empty field stays empty.** No suggestion, no placeholder, no "Aquaforest
1:1 is about 0.36". A figure the user has not checked against their own bottle
is the failure this removed; offering one in the blank would reintroduce it
with an extra step. Guidance may say where to find the number and how to work
it out from a mix. It may not supply one.

Stored values are left alone for the moment: anyone already running on a
figure keeps it, and only a setup with nothing stored meets the refusal.
Distinguishing a strength the user typed from one an old default wrote for
them, and asking them to confirm the latter, is filed as TW-061. A product
picker — choose your product, the app fills the strengths, and the figure is
attached to a name you can check against a bottle — is filed as TW-062 and is
the better long-term answer.

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

§2 sets the target range and the safe bounds. Two further layers sit between
the range and the safe bounds and were not carried into §2.

Default alert thresholds, hung from the midpoint of whatever target range the
user sets — the derived anchor of §2, never a stored value:

| Parameter | Alert low | Alert high |
|---|---|---|
| Alkalinity | midpoint − 1.0 dKH | midpoint + 1.0 dKH |
| Calcium | midpoint − 50 ppm | midpoint + 50 ppm |
| Magnesium | midpoint − 200 ppm | midpoint + 200 ppm |

All `[user]` adjustable. The out-of-band window is therefore narrow for
alkalinity — under §2's 0.6 range it runs from 0.3 to 1.0 dKH from the
midpoint — and the app must handle a reading landing exactly on either edge
correctly (`wizard-states.md` §13).

**The bands and the alert thresholds must never be allowed to overlap or
invert.** `classifyReading` validates this on every call and returns
`insufficient-data` with a configuration error if a user has set them
inconsistently. This answers §13.3 for the band/alert half of that open item.

**Universal rule regardless of the chosen target range:** stability at a
slightly sub-optimal number beats movement toward an optimal one. If a value
sits outside the user's target range but the series is stable, the app suggests
reconsidering the range before suggesting a correction.

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
dose_mL = (aim_point − current) × net_volume_L / potency
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
   expected delta, days to the aim point.
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

**Overtaken by §6's 14 August decision. The divergence is closed — 16 August.**
The previous canon also said "a water change between readings must be accounted
for or the span discarded." That is now settled the other way, everywhere:
water changes stay in the trend fit, only logged corrections are subtracted,
and consumption is `dosed - netChangeInTank` — the engines' `supplied -
trendPerDay` — at every layer. The analytics-layer `consumptionRate`
(`computeElementConsumption`) used to add a mass-balance term for water changes
and no longer does. There was never a case for two answers to one question; the
engines' answer is the one kept, for the reasons in §6.

**Deferred, not rejected.** The subtraction is a real effect, not a
sophistication: a large water change against a mismatched salt shifts
alkalinity by two to three noise floors, which is well inside what the app
claims to resolve. It will matter eventually. It is not done now because the
correction is only as good as the salt-mix figures the user entered in Setup,
and most of those are wrong — a default carried over, a batch that varies from
the label, or a number never entered at all. A correction computed from a wrong
salt figure does not leave the reading uncorrected; it moves it somewhere else
and reports the result with the same confidence. Between an honest figure that
ignores water changes and a corrected one built on a number nobody checked, the
first is the safer thing to show, and it is the one the engines already show.

Revisit when there is a reason to — the salt-mix figures becoming trustworthy
(measured rather than assumed, or validated against a reading taken straight
after a change) is the reason to look again, and the largest single water
change on record shifting a parameter by more than three noise floors is the
signal that the wait has cost something.

---

## 23. Worked examples — executable test vectors

Illustrative numbers. These become tests verbatim; they check the reasoning, not
any particular tank. Carried forward unchanged, including example 1's 1.0 dKH
band, which predates §2's tightening to 0.6 — the reasoning under test is the
rail and the multi-day split, not the band width.

```
1. GIVEN net 68 L, alk 7.6, aim point 8.5, product potency such that 1 mL
   raises 68 L by 0.0147 dKH
   THEN total need 0.9 dKH = 61 mL; exceeds the 0.5 dKH/day rail
   → 2-day plan; day one capped at 0.5 dKH = 34 mL, rounded DOWN to the doser
     increment; flagged "multi-day correction"

2. GIVEN net volume unset
   THEN refuses; names net volume as the missing input; offers the 0.85 helper

3. GIVEN alk consumption 0.4 dKH/day; user's calcium dosing covers 1.5 ppm/day
   THEN implied Ca draw = 0.4 × 7.15 = 2.86 ppm/day
   → flags a 1.36 ppm/day shortfall BEFORE the Ca reading falls

4. GIVEN Mg 1140 with alert-low 1150, and alk 7.4 with aim point 8.5
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

9. GIVEN alk exactly at the no-action lower edge (target range 8.2–8.8,
   lower edge 8.2)
   THEN classified in range, not out of range (edges inclusive of their band)

10. GIVEN target range 8.2–8.8, upper edge 8.8, stored reading 8.849 displayed
    as 8.8
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
is filed as `.agent/items/TW-029.md`.

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
section needs is `.agent/items/TW-028.md`, and until it exists this section
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
  whether the level is out of range.

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

**Amended the same day, before anything shipped: "clearly out" is a wording
distinction and nothing else.** It changes how the app describes the
situation. **It may not gate a recommendation, suppress one, relax a
constraint, or change any figure.** The margins above are unchanged and were
never the problem; what they were wired into was. The full rule, the fault
that produced it and its cost are in "The second decision" below, which is
part of this section and not an appendix to it.

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

> **This is the cost of the first wiring, which was withdrawn the same day.**
> The measurements are kept because they are what exposed the fault — the
> "40 rows withdraw a dose change" line below is the evidence the second
> decision was argued from. What actually ships is in "The second decision".

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

### The second decision — the margin governs wording, nothing else

**Decided 15 Aug (Dan, spec owner), correcting the decision above before it
shipped.** The margins are right. Their wiring was not.

#### What went wrong

`clearlyOut` fed the `*Worsening` flag, and that flag decides whether the app
acts at all. So raising the margins raised the bar for speaking, and the audit
above measured the result without naming it: **40 of the 70 changed rows
withdrew a dose change.** Calcium at 384 ppm — sixteen below a 400–450 band —
went from "increase to 13.1 mL/day" to "hold at 12.0".

Raising a margin meant for describing how far out a level sits made the app go
quiet on levels that are genuinely out of range. That is the opposite of what
was wanted, and it is the whole reason a margin may not be a gate.

#### The rule

**A level is out of band the moment it is past the edge by any amount, and
that is what decides whether the app acts.** 455 against 400–450 is out, and
the app responds.

**"Clearly out" changes how the app describes the situation and nothing else.
It may not gate a recommendation, suppress one, relax a constraint, or change
any figure.** A margin that decides whether the app speaks is not a wording
distinction, whatever it is called.

The two questions and their three answers are therefore:

| Question | Answered by | May govern |
|---|---|---|
| Is it out? | past `def.min`/`def.max` by any amount | whether the app acts |
| Is it clearly out? | past the edge by 50 ppm / 50 ppm / 0.5 dKH | wording |
| Is it moving? | §11's grading — position and trend direction | whether the movement is credible |

#### Where the three uses stood, checked rather than assumed

The decision named three consumers of `clearlyOut`. Only one of them was real:

- **The act/hold decision — real, and severed.** The three `*Worsening` flags
  now take a plain out-of-band test. Each engine still computes its
  `clearlyOut` and now reports it on the assessment as a wording input.
- **§11's grading — never took a margin.** `outOfBandWorsening` takes band
  position, trend direction and the noise floor, and always did. Nothing to
  re-source; §11 now says so explicitly so nobody wires one in.
- **§8.4's step-cap relaxation — never took a margin either, and is a
  different problem.** It relaxes on §2's safe bounds, not on the band at all,
  which is not what §8.4's own sentence says. **Left exactly as it is** and
  opened as §13.4; choosing its threshold is not authorised here.

#### What it costs, measured

Same grid, same sweep, three engines compared: **A** = this file before §27
(margins 5 ppm / 10 ppm / 0.2 dKH, wired into the gate), **B** = the first
wiring (50 / 50 / 0.5, wired into the gate), **C** = what ships (50 / 50 / 0.5,
wording only).

**The 40 rows that withdrew a dose change: all 40 recover main's
recommendation exactly** — same action, same millilitres, to the digit. The 30
that changed wording only under B are byte-identical to A again. B is fully
undone.

Against A — what actually changes on the tree today — **36 of 2,970 rows, all
alkalinity:**

| Direction | Transition | Rows |
|---|---|---|
| below | `hold → increase` | 13 |
| below | `hold → hold` (wording and card only) | 5 |
| above | `hold → decrease` | 8 |
| above | `hold → increase` (a zero change mislabelled — see below) | 5 |
| above | `hold → hold` (wording and card only) | 5 |

Symmetric, 18 below and 18 above. **Every one of the 36 sits within 0.012 and
0.192 dKH of its band edge** — inside the old 0.2 dKH margin, which is exactly
the window the old wiring silenced. Dose figures move by 0.0% to 2.8%. **0
rows whose last reading is in band changed; 0 became `idle`; 0 went from acting
to holding.** Calcium and magnesium do not move at all: their old margins,
5 ppm and 10 ppm, were smaller than any grid step near the edge.

The direction of the change is the point: **26 rows go from holding to acting**
on a level that is out of band and drifting further out. None goes the other
way.

#### Two things this surfaces, neither fixed here

**The act path never says the level is out of range.** When the app acts it
says "the dose no longer matches what the tank uses" and names the new
millilitres; it does not say the level is above or below the band. Under the
old wiring these rows took the hold branch, which did say it. So the app
speaks now where it used to be quiet, but it speaks only about the dose. That
is precisely the gap §28 exists to close, and it is named there rather than
patched with copy here.

**`action` can read "increase" for a change of zero.** Five of the 36 —
alkalinity at 8.98 against an 8.8 ceiling — report `action: "increase"` while
recommending the same 10.8 mL/day the keeper is already pouring. The cause is
arithmetic, not chemistry: `next` is rounded to a tenth (10.8) and compared
against an unrounded `currentDose` (10.799999999999999), so `next >
currentDose` is true by 1.8 × 10⁻¹⁵ (`alkalinity.js:922`, `calcium.js:629`,
`helpers.js:1114` — all three engines, identically). Pre-existing and newly
reachable, not introduced. Filed as `.agent/items/TW-050.md`; fixing it moves
`action` values and needs its own audit.

### Flagged, not changed

**The golden sweep is blind to this margin, and to anything else gated on two
or more logged corrections.** Its `withCorrection` dimension is a boolean — one
correction or none — so `repeatedCorrections(...) >= 2` is false in all 5,940
cases. That is a gap in the app's widest behavioural net, not a fault in this
decision, and it is not fixed here: widening the corpus re-records the
fingerprint for reasons unrelated to §27 and belongs in its own item. Filed as
`.agent/items/TW-047.md`.

### Enforced by

Per §14, named rather than asserted:

- `src/test/defects/clearly-out-margins.test.js` — 66 assertions, in four
  groups:
  - **13** pin the no-margin half of "out": each element, each direction, a
    hair past the edge is said to be out and never reaches the `idle` card.
  - **36** pin the wording-only rule behaviourally. Four distances — a hair
    past the edge, past the old borrowed constant, just inside the new margin,
    and past it — must all produce the same action on a level drifting further
    out, in both directions on all three engines, while `clearlyOut` itself
    differs across the margin and the recommended dose does not.
  - **10** pin the constants: exported at their decided values, each declared
    as a bare number, each `clearlyOut` expression naming its own constant with
    no `_TREND` reference and no numeric literal.
  - **7** pin the wiring structurally, by reading the source: each
    `*Worsening` expression must name the out-of-band test, must not name its
    `clearlyOut`, and must contain no `CLEARLY_OUT` constant; each out-of-band
    test must be `above || below` and nothing else. Behaviour alone would let
    the margin back in beside a second condition that happened to carry the
    fixtures; this group refuses the wiring itself.

  **22 of the original 47 failed against the code before the first decision;
  37 of the 66 fail against the wiring the first decision shipped with.**
- `tests/legacy-port/invariants.js` — the app never says "nothing to do" about
  a level outside its band. Unchanged and still green; the audit above confirms
  no row reached `idle`.

### In plain terms

Your range is 400 to 450. At 455 your calcium is out. Not "nearly out", not
"out within tolerance" — out, and the app says so, exactly as it does at 500.
That has not changed and now cannot quietly change.

The app also has a second phrase for a level that is a long way out rather than
a hair out — 50 ppm past your range for calcium and magnesium, 0.5 dKH for
alkalinity. **That phrase is only a phrase.** It changes how the app puts
things. It does not change what the app does, and it never decides whether the
app says anything at all.

That last sentence is the correction, and it is worth being blunt about why it
was needed. For a few hours on 15 August those three numbers *were* the point
at which the app decided to speak — which meant making them bigger made the app
quieter. A calcium sixteen below your range stopped getting a dose change and
started getting "hold". Nobody intended that; it was only visible once the
change was measured against six thousand simulated tanks. Being out of your
range is what makes the app speak, at one ppm past the edge as at fifty. How
far out you are only changes how it words the answer.

Underneath, two of those three numbers were not distances at all. They were the
figures for *how fast* a level counts as moving in a week, borrowed to answer
*how far* it sits from your range — different kinds of measurement entirely,
like answering "how far is the shop" with "twenty minutes' walk" and then
treating the answer as metres. Nothing on screen looked wrong. The danger was
that the next person to adjust what counts as a fast week would, without
knowing it, have changed what counts as far out of range. The two now have
their own numbers, written down here, and a test that fails if anyone ties them
back together.

---

## 28. Return plans — moving a level on purpose

**Decided 15 Aug (Dan, spec owner): a deliberate under-dose is a third
instrument, and the app must be able to offer it.** **Rewritten 16 Aug (Dan,
spec owner): it is one direction of a general mechanism, and it is a plan
rather than one of two dose figures.** §1 carries the model; this section
carries what the mechanism is, when it may be offered, what it needs, and what
is not settled.

> *"If you're at 420, 430, 440, and then you go to 455 — you're not holding.
> You have to decrease your dose. Do you mean decrease your dose to match
> consumption, or decrease your dose to let it drift down?"*

That question is what started this section. The 15 August answer was *both, and
the user picks*. **The 16 August answer is that only one of them is a dose
figure at all.**

### 28.1 The rule the rest of this section obeys

**Automatic dose advice only ever stabilises.**

> *"When alkalinity decreases, what I usually do is match my dose to
> consumption — to stabilise it first, not provide more than consumption. Once
> I've confirmed it's stable, then I can increase the daily dose slightly to
> bring it up."*

Unprompted, the app recommends one thing: the dose that matches consumption. It
never recommends a dose above or below consumption in order to move a level.
**Moving a level is always a plan the user opts into.** The app may offer the
plan; it never folds it into the dose figure.

This is not a wording preference. A dose figure that quietly contains a
deliberate move is a figure the user cannot check — the whole point of §7's
dose gap is that the recommended dose is *what the tank uses*, and a number
that is sometimes that and sometimes that-plus-an-intention is neither.

### 28.2 The ordering rule — stabilise first

**A return plan is offered only when the level is stable and out of band.**

If a level is moving, the only advice is to match consumption. A deliberate
move laid on top of an unintended one means the level is travelling for two
reasons at once, and no reading can separate them: the plan cannot be judged to
have worked, and the underlying drift cannot be seen to have stopped.

Two consequences, and both are testable:

1. **A dose-change suggestion and a return-plan offer may never appear
   together.** Not on the same card, not on the same surface, not in the same
   sentence. The two conditions are mutually exclusive by construction — one
   requires the level to be moving, the other requires it not to be — so any
   surface showing both has a fault, not a hard case.
2. **"Stable" here is §11's word, not a loose one.** Movement below the kit
   noise floor over the fitted window (§5, §4). A level that is out of band and
   moving is `recovering` or `worsening` (`wizard-states.md` §2, branch 21) and
   gets dose advice only.

### 28.3 One mechanism, two directions

When a level is stable and out of band, the dose already matches consumption —
that is what "stable" means — so the dose figure has nothing left to say. It
holds the level where it is, and where it is, is wrong. That is the whole
occasion for a plan.

| | What it is | What it does | Where you end up |
|---|---|---|---|
| **Match consumption** | advice, unprompted, a dose figure | the level stops moving | parked, wherever it is |
| **Return plan** | an offer the user opts into, never a dose figure | supply is set away from consumption on purpose, with an end | the middle third of the band, then back to maintenance |

**Drift back is this mechanism going down.** A level walked up is the same
mechanism going up. Neither is a special case of the other, and the app offers
both on the same terms: same trigger condition, same destination, same rails,
same return, same expiry.

**Today the app offers neither.** It offers the first row and calls it
finished — that is the `off-target` card, and it is why a keeper at 455 gets
told to decrease the dose and is then left at 455. §27's second decision makes
the app speak in that state; this section is what it should offer once it does.

### 28.4 What a return plan is not

**Not a correction (§9).** A correction is a one-off or temporary elevated dose
from a known quantity, sized by §21's formula, delivered over days and verified
on arrival. It is the instrument a return plan *uses* going up; it is not the
same thing as the offer.

**Not a maintenance change (§6, §7).** A maintenance dose is the app's best
estimate of what the tank uses. A return plan's dose is deliberately away from
that, on purpose, with a planned end.

**Not advice.** This is the 16 August distinction and the one an implementer is
most likely to lose: the app may *offer* a plan, but until the user takes it
the recommended dose is unchanged and still matches consumption.

**It is a temporary dose change with a return** — structurally a plan: a
destination, an expected duration, an arrival test, a return dose.

### 28.5 What it needs

Named, not designed. Most of the machinery exists and is cited rather than
reinvented. All of it applies in both directions.

- **A destination: the middle third of the band**, §9's arrival zone, for §9's
  reason — stopping at the edge leaves one week of ordinary drift from being
  out again.
- **A rate that is not chosen, going down.** How fast a level falls is set by
  consumption minus what is still being dosed, and consumption is the tank's,
  not the app's. §9's "lowering is limited by consumption" already states this.
  **The user's only real lever downward is how deep to cut**; the rate follows.
  Going up the rate is chosen, within the rails, because the additive supplies
  it — that is the §1 asymmetry, and it is the only place in this section where
  the two directions differ.
- **A duration estimate, because that is the actual decision.** *"About nine
  days"* against *"stays at 455"* is the choice being made, and an offer
  without it is not a choice. This holds in both directions.
- **§3's rails still apply.** A plan must not pull a level down, or push it up,
  faster than the rail allows, which caps how deep the cut or how large the
  addition may go. The rails are not relaxed for being deliberate.
- **A return dose, recomputed not replayed** — §9's rule, for §9's reason: a
  plan running while demand grows must not hand back a figure that is now
  short.
- **An arrival test, with §9's two-reading confirmation.** Reaching the zone
  mid-travel is passing through, not arriving.
- **Expiry on the calendar**, per §9. An unattended plan must not run for a
  month.

### 28.6 What is not settled

Recorded rather than answered. **None of these is authorised.**

- **Whether it is a new wizard state or a variant of the correction plan.**
  Structurally it is a correction plan with a signed delta, which argues for
  reuse. But §1's distinction is load-bearing and collapsing the two may cost
  more than it saves. `wizard-states.md` §3's table gains a row either way, and
  which row it is depends on this answer — which is why no row has been added
  yet.
- **Which wizard states satisfy "stable and out of band".** §28.2 gives the
  condition; branch 21c (`off-target`) plainly meets it, and route 12
  (`worked`, tested steady and not in band) appears to as well. Whether a level
  that has just finished a staged plan should be offered a return plan in the
  same breath is a question for Stage 4's gap report, not an answer to be
  guessed at by an implementer. `wizard-states.md` §24 records it against the
  card.
- **How the offer is presented.** Constrained now rather than settled: it is
  one offer, not two dose buttons, and it may not share a card with a
  dose-change suggestion (§28.2). Whether it is a link, a sheet or a step in
  the wizard is open.
- **What happens if the user does nothing.** The level stays where it is —
  stable, out of band, by definition of when the offer appeared. Whether the
  app repeats the offer, and how often, is unaddressed. §20's supersede-not-
  stack rule constrains the answer.

**One thing that was open on 15 August is now closed:** *"whether the upward
case is built at all"*. It is built. Symmetrical, same terms, same section.

### Enforced by

**Nothing yet, and that is stated rather than implied.** §14 exists because
this document once claimed enforcement it did not have. No code implements a
return plan in either direction; no test asserts one. The item is
`.agent/items/TW-048.md`, untagged — the decision settles that the mechanism
exists, when it may be offered and what it must respect, not that it may be
built without a design.

**One rule of this section is testable against the app as it stands**, before
any of it is built: §28.2's exclusion — no surface may show a dose-change
suggestion and a return-plan offer together — and §28.1's — no recommended dose
figure may be anything but the figure that matches consumption. Both are
assertions about code that exists today.

### In plain terms

If your alkalinity has climbed above your range, there is no product you can
add to bring it down. The only way down is to dose less than your corals use
and let them pull it down for you. Every reefkeeper knows this; the app did
not.

So when your calcium reads 455 against a range topping out at 450, the app
tells you to cut the dose back to what the tank actually uses — and if you do
exactly that, calcium stops climbing and sits at 455. That is the right advice
and it is deliberately all the advice: your calcium has stopped moving, which
is the thing that needed fixing first.

What was missing is the next offer, and it comes after: once you are steady at
455, the app can offer to walk you home — dose deliberately less than the tank
uses, let calcium fall to the middle of your range over about a week, then go
back to normal dosing. About nine days, against staying at 455. That is a
choice you make, not a number the app quietly changes.

The same thing works upward, and it is now written the same way. If alkalinity
has settled at 7.8 against a range starting at 8.2, the app does not secretly
over-dose you to bring it up. It gets you steady, then offers you the trip.

The reason it is in that order is simple: if the app moved your level while it
was already moving on its own, you would have no way of telling which was
which. One thing at a time, and you can see each one work.

None of that is built. This section says what it is and what it must respect —
your rails, your range, a return to normal dosing, and an expiry so a plan you
forget about does not run all month — so that when it is built, it is built
once and correctly.

---

## 29. Phosphate and nitrate

**Decided 16 Aug (Dan, spec owner): all nine decisions of `.agent/needs-dan.md`
item 10, in one pass, with the spec edit authorised.** This is the canon entry
§25's coverage table said was written **nowhere**. It is written here.

**Amended the same day, before anything shipped.** The first pass left two
questions in §29.5 open, because Dan's answers gave two different numbers for
one of them. Both are now settled and §29.5 carries them: **the count is
same-side**, and **nitrate's trend bar is three readings, not the dosed
elements' four-reading statistical gate** — the phrase "the same evidence bar
as the dosed elements" is withdrawn as loose wording. **Nothing in this section
is open.**

§25 settled **where** the reasoning lives — one engine — and deliberately
settled nothing about its content. TW-029 removed the borrowed reasoning on
15 August, which left these two saying less than they should rather than saying
wrong things. This section is what replaces the silence.

`docs/journeys/journey-5-phosphate-nitrate.md` is design input, not guidance:
where it and this section differ, this section wins, and §29.6 is the one place
they differ.

### 29.1 The shape, before any figure

Alkalinity, calcium and magnesium are consumed and replaced: the tank takes,
you pour, the app tunes the daily dose. **Phosphate and nitrate are managed by
export and by feeding, not by a dose that replaces consumption.** So
`maintenanceDose`, the dose gap (§7), the rails (§3) and the settle window have
nothing to attach to — which is why borrowed reasoning produced nonsense here.
It was never the thresholds. It was the whole shape.

Everything below follows from that. These two get a level, a band, a count and
at most two fixed warnings. They never get a millilitre figure.

### 29.2 Bands — the same three layers, with a much wider layer 1

§2's structure applies unchanged. The figures do not.

| | Safe bounds (layer 1) | Suggested band (layer 3) | Test cadence |
|---|---|---|---|
| Phosphate | 0.01 – 0.5 ppm | **0.03 – 0.10 ppm** | 7 days |
| Nitrate | 0.5 – 50 ppm | **5 – 15 ppm** | 7 days |

The layer 3 figures are published guidance: 0.03–0.10 ppm phosphate, and a
nitrate band centred where the hobby runs it. The layer 1 figures are the ones
`SAFE_BOUNDS` already carries with their sourcing beside them — nitrate *"zero
starves corals; high is ugly, not acute"*, phosphate's 0.01 floor likewise.
Neither figure is newly minted here; both are promoted from code comment to
canon, which is where a figure the app acts on belongs.

**The band is freely editable, and the range of legitimate settings is wider
than for the dosed elements.** Dan: *"Some people run phosphate up to 0.20,
even 0.30, 0.40. People have very different ideas of what phosphate level
should be in their tank."* A user whose target range runs to **0.40 ppm
phosphate or 40 ppm nitrate is not making a mistake**, and the app may not treat them as one, nudge
them toward the suggestion, or grade them against it. Layer 3 is a starting
point for someone with no opinion; it is not the right answer.

This is a wider licence than alkalinity gets, deliberately. Alkalinity's
legitimate range is 7–11 dKH because outside it there is described harm.
Phosphate between 0.03 and 0.40 is a husbandry preference, and the app has no
standing to have an opinion about it.

### 29.3 Out, and clearly out

§27 applies as written, with these two figures added to its family:

1. **Out has no margin.** A level is out the moment it is past the band edge by
   any amount, measured on the last reading (§26).
2. **Clearly out is a fixed distance past the edge: phosphate 0.10 ppm,
   nitrate 10 ppm.** Named constants of their own, declared beside their
   engine's other constants as bare numbers, derived from nothing — not from a
   trend constant, not from a kit noise floor, not from the band width (§27's
   third rule).
3. **Clearly out is a wording tier and nothing else** (§27's same-day
   amendment). Here that constraint costs nothing at all: per §29.6 there is no
   recommendation for it to gate, no dose for it to change and no constraint
   for it to relax. It changes one adjective in one sentence.

**One consequence, stated so it is not re-filed as the bug that started all
this.** At the suggested bands, "clearly out low" is arithmetically
unreachable: phosphate 0.03 − 0.10 = −0.07 ppm, nitrate 5 − 10 = −5 ppm. That
is the same shape as the negative `far-out-low` thresholds TW-029 removed, and
it is **not** the same fault, for three reasons.

- The removed threshold gated the only thing the app ever said about a low
  level. This one gates an adjective, on a sentence that fires anyway.
- Phosphate's low side has its own voice that does not depend on the band at
  all — the fixed warning at 0.03 in §29.4.
- Nitrate near zero already speaks through the nutrient findings that were
  never removed (both nutrients near zero together, and high alkalinity on lean
  nutrients).

On a wider user band it becomes reachable — a keeper running 0.20–0.40 ppm is
clearly out low at 0.10. The unreachability is a property of a narrow band, not
of the rule.

### 29.4 Two fixed warnings, and only two

**Both fire regardless of the user's band.** That is the point of them: a band
is the user's judgement, and these two figures are not.

| Warning | Fires at | Register |
|---|---|---|
| Phosphate low | **below 0.03 ppm** | it is getting quite low — a warning, not an emergency |
| Nitrate high | **above 50 ppm** | worth attention, not urgent |

**Phosphate below 0.03 ppm.** Dan: *"I was stuffing around trying to get it
really low and it went below 0.03 — it was like 0.01, which is not good for the
corals at all. That should come up as a warning. Not an emergency. But it
definitely should flag."* The published position runs opposite to intuition —
zero starves corals and invites dinoflagellates, and nutrients too low is worse
than nutrients too high. The figure is the published band's own floor, which is
why it is 0.03 and not 0.01.

**It does not escalate.** At 0.01 ppm the app says the same thing it says at
0.029. `SAFE_BOUNDS`' phosphate minimum of **0.01 is a floor on what may be set
as a target-range edge** — it governs Setup, not readings — and a reading landing there
adds nothing to what the 0.03 warning already said. This resolves the collision
item 10 named between the two figures: they are not two answers to one
question, they are answers to two questions.

**Nitrate above 50 ppm.** A word, not an alarm: **published evidence shows
nitrate is not acutely toxic**, so nothing here may reach the urgent tier. The
figure is `SAFE_BOUNDS`' existing nitrate ceiling, whose comment already carries
the reasoning: *high is ugly, not acute*.

**This restores the suspended husbandry expectation — but not verbatim.**
`tests/legacy-port/husbandry.js` carries `'nitrate 80 is excessive'` commented
out, asserting `urgentAbout(r, /nitrate/i)`. Nitrate at 80 ppm must now say
something, so the check comes back; it must not say something urgent, so the
predicate is wrong and changes with it. Restoring it unaltered would assert the
opposite of this section. The adjacent live expectation, `'nitrate 25 is high
but not acute'`, is unaffected and still holds.

**Nitrate has no low warning of its own.** Two warnings is the whole list, and
`SAFE_BOUNDS`' nitrate minimum of 0.5 ppm is a target-range floor by exactly
the rule stated for phosphate's 0.01 above. Near-zero nitrate is not silent — it reaches
the keeper through the nutrient findings named in §29.3, which judge the two
nutrients together rather than by a borrowed band rule.

**A fixed warning may fire on an in-band reading, and that is not a
contradiction.** A keeper who sets a phosphate band of 0.01–0.05 gets "in band"
on the chip and the low warning in the same view, because the chip answers
*where is this against the range you chose* and the warning answers *this figure
is low whatever range you chose*. The same already happens for the dosed
elements against §2's safe bounds. What the app may never do is say both things
in one sentence as though they were one judgement.

### 29.5 Count, not slope — and nitrate is not phosphate

**Phosphate gets a count and no trend.** Dan: *"Mine oscillates. Mine goes up
to 0.20, then down to 0.15, then up to 0.19, then down. It doesn't work like
that."* Direction language on a parameter that bounces this hard is a confident
statement about a movement nobody measured.

> **The count: three of the last four readings outside the band, on the same
> side.**

**Same side, decided 16 Aug on the second pass.** Two above and one below does
not count. *"The point of the count is where the level has been living; a
reading bouncing above then below is not that."* Three high and one low is a
tank living high; two high, one low and one high is a tank bouncing, which is
what phosphate does when nothing is wrong. The literal reading — any three
outside, either side — would fire hardest on exactly the behaviour §29.5 exists
to stop the app talking about.

Two things it says that a slope cannot — *this is where you have been living*,
and *this is not one odd test*. Nothing in the app counts this today;
everything else fits a line. It is a new mechanism, not a retuned one.

The count is the same mechanism for both parameters. Nitrate has it too
(alongside its trend, below); it is not phosphate's alone.

**No direction language for phosphate anywhere**, including the stability
layer's. The `drift:` claims sit on the stability layer's own fold-mode rules
rather than on the removed findings loops, so they survived TW-029 and can
still say *"Phosphate is climbing, not settling."* Under this section they may
not. Count language replaces slope language on every surface, or it has not
replaced it.

**Nitrate gets both count and trend.** Dan: *"Nitrate can be notoriously
stable, or it can continue to rise."* The chemistry behind the asymmetry is
real and is the reason the two may not share a model: phosphate binds to rock
and sand and is strongly buffered, while nitrate has no buffering mechanism at
all. Randy Holmes-Farley's illustration — add 1 ppm phosphate and 100 ppm
nitrate to a tank and nitrate rises the full 100 while phosphate rises under
0.1.

**Nitrate's trend bar, decided 16 Aug on the second pass:**

> **Three readings, one direction, clearing §5's noise floor.**

**This is deliberately *not* the four-reading, three-step statistical gate the
dosed elements use** (`directional()` — four rows, three steps, two thirds
agreeing). The first pass of this section recorded the bar as *"the same
evidence bar as the dosed elements"* on Dan's own phrase; **that phrase was
loose wording and is withdrawn.** The rule he meant is the practical one from
`journey-1-alkalinity.md` §5:

> *"One reading is notice, two is a signal, three is a fact. … The app's
> evidence gates are about statistics; this is about patience."*

Three readings is two steps, and both must go the same way — the third reading
is what turns a signal into a fact. The movement across the three must clear
§5's noise floor, which is the part that stops the rule firing on kit
resolution.

**Why the softer bar is right here and not a slackening.** The statistical gate
exists to keep a regression from claiming a slope through scatter. Nitrate is
not being fitted — it is being watched for a run of three, which is a claim
about consecutive readings rather than about a line. Applying the gate meant
importing a test designed for a different question, which is the defect §25
names. The noise floor stays in force, so this is a lower *count*, not a lower
standard of measurement.

**The two parameters do not converge.** Phosphate gets no direction language at
any bar, however patient — a run of three on a parameter that oscillates
between 0.20 and 0.15 is what oscillation looks like, not a trend. The
difference is the buffering, not the evidence.

### 29.6 No dose, no correction, no levers

**The app names the level and stops.**

- **No dose.** Neither parameter produces a millilitre figure. There is no
  strength, no dose path and nothing to compute one from.
- **No correction (§9), and no drift back (§28).** Both instruments move a
  level by changing what is poured in. Neither parameter has anything poured
  in.
- **No suggested levers.** This is the one place this section overrides journey
  5, which asked the app to *"say these are your options. Just really
  briefly."* Dan's reasoning for the reversal: the app **cannot see whether
  someone runs GFO, a refugium or carbon dosing, and suggesting levers they are
  not using is noise.** Naming a lever a keeper already runs at full tilt is
  worse than saying nothing, and the app has no way to tell the two apart.

The keeper is told where the level is, how often it has been there, and — for
the two figures in §29.4 — that it is worth a look. What to do about it is
theirs.

### 29.7 Windows and cadence, ratified

| | Test cadence | Analysis window | Mode |
|---|---|---|---|
| Phosphate | 7 days | **14 days** | proportional |
| Nitrate | 7 days | **28 days** | proportional |

**Ratified as they stand.** The stability layer already used these figures
(`src/lib/stability-engine.js`) and they were right, but they were habit rather
than canon; this makes them canon. §4's rule that windows are flat and never
stretched applies here too: refuse rather than reach.

The proportional mode is deliberate and matches Dan's *"if it is bouncing
around, it should be more lax"* — a fixed ppm tolerance behaves very differently
on a tank at 0.05 than on one at 0.30, and these are parameters people run
across that whole spread.

### 29.8 The noise-floor unit question is closed as unreachable by design

Item 10's decision 8 offered three ways to reconcile `STABILITY_RULES`'
proportional noise floors with `correctionProgress`, which reads that field as
an absolute value in the parameter's own unit. **None of the three is taken.
The question is closed, because the branch cannot be reached.**

`correctionProgress` computes a correction's arrival zone. **Neither parameter
has a correction path, and per §29.6 neither will ever have one.** So the
mismatch is not latent-and-waiting; it is unreachable **by design** rather than
by an accident of today's call sites. No table changes, no branch is added, no
per-parameter floor table is minted, and phosphate does not get an absolute
floor it has no use for.

A comment at the read site records this, so that the next reader who notices
the mismatch finds the reason it is not a bug rather than re-deriving the three
options.

**What would reopen it:** only a decision to give either parameter a correction
path — which is precisely what §29.6 forbids. Anyone reaching for that
reopens this subsection first.

### Enforced by

**Nothing yet, and that is stated rather than implied**, per §14. No code
implements any of the above and no test asserts it. The implementation is filed
under `.agent/items/` as **TW-054** through **TW-060**, all untagged: the
decision settles the reasoning, not that it may be built without approval.

Three cross-references elsewhere in canon now point at "nowhere" and are stale
against this section — §25's coverage table row for these two, §4's cadence and
window table, and §16's clearly-out margin list. They are left as they are:
this decision authorised a new section, and repointing them is TW-060.

### In plain terms

Your phosphate and nitrate now have rules of their own instead of borrowing
alkalinity's, which is what was producing the silly notices.

The starting ranges are 0.03 to 0.10 for phosphate and 5 to 15 for nitrate, and
they are yours to change to whatever you like. Running phosphate at 0.40 or
nitrate at 40 is a perfectly ordinary way to keep a tank and the app will not
argue with you about it — much more latitude than it gives you on alkalinity,
because on these two there is no published harm to point at.

Past the edge of your range by any amount, you are out of range and the app
says so. Once you are 0.10 phosphate or 10 nitrate past it, it says so more
plainly. That is a change of wording only — nothing about it changes a dose,
because these two never get a dose.

There are exactly two warnings that ignore your range entirely. Phosphate under
0.03 tells you it is getting quite low, and keeps telling you the same thing at
0.01 rather than escalating — low nutrients are the ones that actually hurt
corals. Nitrate over 50 gets a mention, not an alarm, because the published
evidence is that high nitrate is untidy rather than poisonous. That second one
brings back the check that had been switched off, at the right volume this time.

For phosphate the app counts instead of drawing lines: three of your last four
tests outside your range is the thing worth saying, because phosphate bounces
and a line through bouncing numbers invents movement that was never there. It
will no longer tell you phosphate is climbing. Nitrate is genuinely different —
it has nothing in the tank holding it steady the way rock and sand hold
phosphate — so nitrate keeps both the count and a real "this is rising", held
to the same standard of evidence as your alkalinity.

And when a level runs high the app names it and stops. It does not tell you to
run GFO or a refugium or dose carbon, because it has no idea which of those you
are already running, and telling you to do something you are doing is worse than
saying nothing.

None of this is built yet. This section is the rules; the work to make the app
follow them is filed and waiting on your approval.
