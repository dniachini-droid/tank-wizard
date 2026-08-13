# How the app decides a dosing suggestion

**Alkalinity, calcium and magnesium.** Values read from the code on
2026-08-12, not from memory. Where a figure has a source it is named; where it
is a judgement, that is said.

Two known faults are recorded at the end. Read those before acting on the rest.

---

## 1. The two things a dose can and cannot do

This distinction runs through everything below and is worth stating first.

- A **daily dose** replaces what the tank consumes. It **holds** a level. It
  cannot move one in any reasonable time.
- A **correction** is a one-off or a temporary elevated dose. It **moves** a
  level. It is not a maintenance figure and must be returned from.

Most confusing advice in reef software comes from conflating these. When the
app says "the dose is right, the level is not", that is this distinction.

---

## 2. Targets

| | Target band | Safe bounds | Test cadence | Step |
|---|---|---|---|---|
| Alkalinity | 8.5 – 9.5 dKH | 7 – 11 | every 2 days | 0.1 |
| Calcium | 400 – 450 ppm | 350 – 500 | every 7 days | 1 |
| Magnesium | 1250 – 1400 ppm | 1150 – 1600 | every 21 days | 1 |

Bands sit inside published consensus and contain natural seawater where the
hobby targets it (calcium ~420, magnesium ~1290). Alkalinity is deliberately
run above seawater's 7.5.

Safe bounds are where sources describe actual harm, not merely off-target:
below 380 ppm calcium slows growth, above 500 pulls alkalinity down; above
~1600 magnesium causes lethargic invertebrates and suppressed uptake.

Enforced by `tests/husbandry.js`. A band moved outside published guidance fails
the build.

---

## 3. Rate limits

**One limit per element**, used both for corrections and as the ceiling on any
dose change:

| | Max rate of change |
|---|---|
| Alkalinity | 0.5 dKH / day |
| Calcium | 20 ppm / day |
| Magnesium | 25 ppm / day |

Sourced: alkalinity up to 1.0 with most keepers at 0.5; BRS caps calcium at 50
and reefcalcs calls 20 safe; magnesium widely given as 25, suppliers to 50. The
conservative end is used, because overshooting is the failure these prevent.

**This was once two tables disagreeing** — 3.5 vs 15 for calcium. One value
now, and a test fails if a second appears.

---

## 4. How the app works out what the tank uses

`maintenanceDose` — the dose that would hold the level steady — is the centre
of everything.

1. Take readings inside the analysis window (alkalinity 7 days, extendable to
   21; calcium and magnesium 14, extendable to 35).
2. Fit a slope. Subtract what the current dose supplies. What remains is
   consumption.
3. Exclude disturbances — water changes and logged corrections displace the
   level and are not consumption.
4. `maintenanceDose = consumption / effectPerMl`.

`effectPerMl` comes from the solution strength in Setup, or is solved from
history when there is enough of it.

> **Everything downstream depends on the strength in Setup being right.** The
> app has no independent way to check it. A wrong strength makes every figure
> wrong in a way no test can catch.

---

## 5. When the app will change a dose

A change is proposed only if **all** of these hold:

1. **Enough readings** — at least 3 in the window.
2. **The settle window has passed** since the last change.
3. **The movement is real** — the trend clears the kit's noise floor
   (alkalinity 0.1, calcium 10, magnesium 30) and, for calcium and magnesium,
   the slope exceeds three standard errors over at least 20 days.
4. **The gap is worth acting on** — see below.

### The settle window

How long before a change can be judged, computed per element and per kit:

```
needed = (2 × kitNoise × √2) / (0.15 × dailySupply)
```

Floors and ceilings: alkalinity 2–5 days, calcium and magnesium 7–30.

On a Hanna checker alkalinity settles in **2 days**; calcium takes **17**;
magnesium **30**. This is why the same advice arrives at very different speeds
for the three, and it is correct: it is how long before a 15% error is visible
above the kit's own noise.

### The dose-gap trigger

| | In band | Out of band |
|---|---|---|
| Alkalinity | 12% | 6% |
| Calcium | 30% | 15% |
| Magnesium | **never** | **never** |

Tighter out of band because the tolerance exists to ignore noise while the
level is where it should be; once it has left, the gap is the reason it is
drifting.

**Magnesium is absent deliberately.** Its dose cannot be inferred from tank
readings — a 15% error takes over a thousand days to clear the 25 ppm kit
noise. Magnesium is managed by its LEVEL: when that drifts out of band the app
advises a one-off correction, dry salt or water changes, and never chases the
daily dose. Arithmetic: on a tank losing 0.19 ppm a day, one correction holds
for about 598 days.

---

## 6. How big a change

Three constraints, applied in order:

1. **Bracketing.** If history contains a dose where the level fell and one
   where it rose, the answer must sit between them. Observations older than 45
   days are dropped, and any whose implied consumption differs from today's by
   more than 25% is discarded.
2. **Step cap — 25% per change.** Sourced: dosing guides describe 10–30% per
   adjustment. Relaxed only when the tank is outside workable range AND still
   heading the wrong way, because there the movement is the problem.
3. **Rate ceiling.** The new dose must not move the level faster than the
   table in section 3.

---

## 7. Corrections

Offered only when the level is **outside its band**. Three paces, as fractions
of the max rate:

| Pace | Fraction | Alkalinity |
|---|---|---|
| Gentle | 25% | 0.125 dKH/day |
| Steady | 50% | 0.25 dKH/day |
| Quick | 100% | 0.5 dKH/day |

Target is the **middle of the band**, not the nearest edge.

### Rules

- **Never on a stale reading.** If a correction, plan or dose change happened
  AFTER the newest reading, nothing is proposed. Without this, corrections
  stack on unmeasured levels — in simulation this drove calcium 403 → 498.
- **The return dose is recomputed**, not replayed. A plan running while demand
  grows must not hand back a figure that is now 38% short.
- **Lowering is limited by consumption.** The fastest a level can fall is the
  rate the tank uses it. Where the arithmetic wants a negative dose, the app
  offers zero and says how long that takes.
- **Where the maintenance solution cannot do the job** — more than about 1.5
  litres — it says so and points at dry salt or water changes rather than
  quoting an impossible volume.
- **Unattended plans expire.** Past the estimate the state becomes
  `correction-due`; past twice it, `correction-stalled`. Measured on the
  calendar, so it works with no new readings.

---

## 8. What the app will not do

- Change a dose on fewer than 3 readings
- Change a dose inside the settle window
- Change magnesium's dose on a measured gap
- Propose a correction for a level inside its band
- Propose a correction on a reading older than the last intervention
- Move a level faster than the rate table
- Change a dose by more than 25% at once, except when out of range and worsening

---

## 9. Two known faults — read before relying on section 5

### 9.1 A slow decline is under-served *(unresolved)*

`band === "stable"` stays true for a fall of about 0.02 dKH a day. A tank
drifting that slowly enters the hold branch, and only the dose-gap trigger
rescues it.

Simulated over three years with demand growing 30% a year, a keeper following
every recommendation: **three dose changes, and alkalinity reached 0.5 dKH.**
The app said "hold" at 6.87 — below the safe floor.

Halving the trigger out of band improved this from one change to three. It is a
patch. **The real fix: a level outside its band and moving further out should
never be graded stable, whatever the rate.** That is a change to stability
grading, not another threshold.

### 9.2 Magnesium's "meaningful" threshold is unsourced

40 ppm, a judgement. Alkalinity's 0.3 dKH and calcium's 15 ppm match sources;
this one does not. It governs what counts as worth mentioning, not what is
dosed.

---

## 10. Where to look in the code

| | |
|---|---|
| `PARAM_DEFS` | bands, units, cadence |
| `SAFE_BOUNDS` | harm points |
| `CORRECTION_MAX_RATE` / `SAFE_DAILY_RISE` | one rate table, aliased |
| `DOSE_DRIFT_TRIGGER` | when a gap is worth acting on |
| `DOSE_STEP_CAP` | 25% |
| `BRACKET_MEMORY_DAYS` | 45 |
| `STABILITY_RULES` | analysis windows, kit noise floors |
| `CONSISTENCY_RULES` | drift grading, each with a stated reason |
| `assessAlkalinity` / `assessCalcium` / `assessMagnesium` | per-element engines |
| `applyDoseConstraints`, `rateLimitDose`, `trendConfirmed` | shared logic |
| `proposeCorrection`, `correctionProgress` | corrections |
| `doseStatus` | turns an assessment into what the user reads |

Every constant is enforced by `tests/husbandry.js`; changing one without
changing the source it cites fails the build.
