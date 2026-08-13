# Reef Chemistry — Canon

**Status: proposed.** Replaces `docs/spec/reef-chemistry.md` and supersedes
`docs/spec/incoming/dosing-spec.txt`. Reviewed and merged 13 August 2026.

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
3. Exclude disturbances — water changes and logged corrections displace the
   level and are not consumption
4. `maintenanceDose = consumption / effectPerMl`

`effectPerMl` comes from the solution strength in Setup, or is solved from
history when there is enough of it.

> **Everything downstream depends on the strength in Setup being right.**
> `strengthPlausible` checks each element against a coarse range and will catch
> a value outside any real product's. It will **not** catch a wrong-but-
> plausible value, which is the failure that matters. Bracketing (§8) is the
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
| Magnesium | never — see §9 |

**Decided 13 Aug: the out-of-band halving is removed.** Previously the trigger
halved (12→6%, 30→15%) once a level left its band. That existed only as a patch
for broken stability grading (§10) — with grading fixed, the app catches a slow
decline directly and the hair-trigger is no longer doing any work.

### The response to a gap

For ordinary drift, the response is a **10% adjustment to the daily dose**, not
a correction. BRS: if levels are slowly rising, subtract 10% per day; if slowly
falling, raise by 10%. Repeat until stable.

This is gentler than recalculating from scratch and self-corrects even when the
consumption model is slightly off. Full recalculation is reserved for genuine
corrections (§9).

---

## 8. How big a change

Three constraints, in order.

### 8.1 Bracketing

If history contains a dose at which the level fell and one at which it rose,
the true dose lies between them. This is purely empirical — no solution
strength enters the calculation — which makes it **the only check on a wrong
Setup strength**.

It brackets; it does not pinpoint. The arithmetic still picks the number within
the range.

**Decided 13 Aug, three changes:**

- **Memory scales per element: 30 days alkalinity, 60 days calcium** —
  roughly two settle windows each, replacing a flat 45. A flat window gave
  calcium barely one usable observation.
- **Old observations may only widen the bracket, never narrow it.** A growing
  tank needs more, not less; an old observation must never be able to veto a
  higher dose. The previous 25% consumption filter is circular — a tank
  under-dosed for weeks has an understated "current consumption", so the filter
  discards the honest data and keeps the misleading data.
- **Never veto silently.** If bracketing overrules the arithmetic, say so. If
  the arithmetic wanted *more* than the bracket allows, the user decides —
  that is the coral-growth case, and a silent cap would suppress it.

A tank with no dose history has no bracket, so the arithmetic runs unchecked.
That is exactly when a wrong Setup strength is most dangerous and least
detectable, and the app should say so.

### 8.2 Step cap

No dose changes by more than **25%** at once. Sourced: dosing guides describe
10–30% per adjustment.

Relaxed only when the level is **outside its band and still moving further
out** — see §10 for how that is determined.

### 8.3 Rate ceiling

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

**Decided 13 Aug: the middle third of the band.**

Not the nearest edge — normal drift would take it straight back out. Not judged
by "levelling off versus still climbing" — that judgement is unmeasurable while
the tank is being actively pushed.

What happens next is handled by ordinary machinery: if the level keeps rising,
the dose gap goes negative and the app suggests coming down. If it holds, the
correction dose turned out to be the right maintenance dose and nothing needs
doing.

**`correction-done` exits only after two readings inside the band**, not one.
Three consecutive 0.2 dKH rises do not simply stop; reaching the band mid-climb
is passing through, not arriving. While the state holds it carries "keep
testing every 2 days — it may still be climbing" in the wizard's `testOn`
field, and **consumption does not re-baseline until it clears**.

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
