# Where the Merged Spec Is Under-Specified

An honest audit of `reef-chemistry-MERGED.md`. Every place a competent
implementer would have to guess.

Each gap has a **proposed answer**. Mark **YES**, **NO** (say what instead), or
**ASK ME LATER**. Ones marked **NEEDS DAN** I can't answer — they're chemistry
or product judgement.

Written after Dan spotted that §11 says "the fitted trend over the window"
without saying which window, how many readings, or how the slope is derived.
He was right, and the same fault runs through most of the document.

---

# §2 — Targets

**G1. A band that extends past a safe bound.**
User targets 7.2 dKH with a 0.6 band, so the lower edge is 6.9 — below the safe
floor of 7.
*Proposed:* accept the target, clamp the band edge to the safe bound, and say
so. The user's intent is respected; the app just doesn't pretend 6.9 is fine.

**G2. Minimum and maximum band width.**
Nothing stops a user setting a 0.05 dKH band, which their kit can't resolve, or
a 4 dKH band that never triggers anything.
*Proposed:* minimum = 2× the kit noise floor (alk 0.2, Ca 20, Mg 60). No
maximum, but warn above 1.5 dKH / 100 ppm / 300 ppm that drift will go
unremarked.

**G3. What "safe bounds" does at the boundary.**
Is 7.0 dKH inside or outside? The reconciliation found the app already
disagrees with itself here — inclusive in one place, exclusive in another.
*Proposed:* bounds are **inclusive**. 7.0 is safe; 6.99 is not.

---

# §3 — Rate rails

**G4. What the rail is measured against.**
"The new dose must not move the level faster than the rail" — but the app can't
know the future rate. It must be a *predicted* rate.
*Proposed:* predicted rate = `(newDose − currentDose) × effectPerMl`. If that
exceeds the rail, the dose is reduced until it doesn't.

**G5. Does the rail apply to falling as well as rising?**
Lowering a dose lets a level fall. Is a fast fall equally limited?
*Proposed:* yes, symmetrically — coral responds to rate of change in either
direction. But §9 already notes a fall is capped by consumption anyway, so this
rarely binds.

---

# §4 — Cadence and windows

**G6. What cadence actually does.**
It's listed as a number but nothing says what it changes.
*Proposed:* two things. It sets what the app suggests in `testOn`. And a
reading logged sooner than the cadence is stored but produces **no rate
calculation and no trend verdict** — two readings a day apart on a Hanna are
mostly kit noise.

**G7. Window with too few readings.**
*Proposed:* fewer than 3 readings in the window → no consumption figure, no
trend verdict, no dose suggestion. The app says how many more it needs. (This
was agreed as collapse rule C7 but didn't make it into the merged document.)

---

# §5 — Kit noise floors

**G8. Applied to what.**
A single difference between two readings, or to the total movement a fitted
slope implies across the window?
*Proposed:* **to the total movement across the window** — `slope × windowDays`.
A slope of 0.02 dKH/day over 14 days is 0.28 dKH, comfortably above 0.1, so it
counts. The same slope over 3 days is 0.06 and does not.

---

# §6 — Consumption and maintenance dose

**This section has the most gaps, and it's the one everything else depends on.**

**G9. How `effectPerMl` is derived.**
The Setup strength is a product figure — "0.024 ppm per mL per 100 L". Turning
that into an effect on *this* tank needs the net volume.
*Proposed:* `effectPerMl = labelStrength × (100 / netVolumeL)`. State it
explicitly with units, because this conversion is exactly where the 42×
magnesium error lived.

**G10. A dose change inside the analysis window.**
Half the readings sat under the old dose.
*Proposed:* the window is **truncated at the most recent dose change**. Only
readings since the change are used. If that leaves fewer than 3, no consumption
figure — which is what the settle window already enforces in practice.

**G11. How a disturbance is excluded.**
"Exclude water changes and logged corrections" — drop the reading, drop the
interval, or split the series?
*Proposed:* **split the series.** Readings either side of a water change belong
to different regimes. Fit only within the longest clean segment in the window.

**G12. Negative consumption.**
A high reading followed by a low one can imply the tank is *producing*
alkalinity, which it isn't.
*Proposed:* negative consumption means the model has broken — a bad reading, an
unlogged water change, or a wrong strength. The app reports it as unusable
rather than acting. It should not clamp to zero and carry on.

**G13. What counts as "enough history" to solve strength from readings.**
§6 says `effectPerMl` may be "solved from history when there is enough of it"
without saying how much.
*Proposed:* **NEEDS DAN** — or simpler, drop this entirely. Solving strength
from history is what bracketing already does, less directly and more safely.
Two mechanisms doing the same job is how this app got into trouble.

---

# §7 — When the app will change a dose

**G14. Units in the settle window formula.**
`(2 × kitNoise × √2) / (0.15 × dailySupply)` — `dailySupply` in what? It must
be the daily *effect* in the parameter's units (dKH/day), not millilitres, for
the units to cancel.
*Proposed:* state it as `dailySupply = dose_mL × effectPerMl`, in parameter
units per day.

**G15. The three-standard-errors rule conflicts with the window.**
§7 requires the slope to exceed three standard errors "over at least 20 days"
for calcium and magnesium — but the analysis window is 28 days, and magnesium's
cadence is 21, so a magnesium window often holds one or two readings.
*Proposed:* **NEEDS DAN.** Either the window is wrong or this rule can never be
satisfied for magnesium. Since magnesium's dose is never tuned from readings
anyway (§10), it may only need to apply to calcium.

**G16. How the dose gap is computed.**
*Proposed:* `|maintenanceDose − currentDose| / currentDose`. If `currentDose` is
zero, no percentage is meaningful — treat as "no dose set" and suggest a
starting dose instead.

**G17. The 10% nudge — of what, and how often.**
BRS says "subtract 10% per day until stable", which reads as repeated daily
adjustment. That contradicts the settle window, which says wait 2 days for
alkalinity before judging.
*Proposed:* 10% of the **current dose**, applied **once**, then wait a full
settle window before considering another. BRS's daily cadence assumes someone
watching closely; the app's settle window is the more conservative rule and
should win.

**G18. When the nudge applies versus a correction.**
*Proposed:* nudge when the level is **inside the band** but the dose gap has
tripped. Correction when the level is **outside the band**. That matches §1 —
a dose holds, a correction moves — and needs saying explicitly.

---

# §8 — How big a change

**G19. What makes a bracket observation.**
"A dose at which the level fell" needs a period of stable dose with enough
readings to see a direction.
*Proposed:* a bracket observation is a span where the dose was unchanged for at
least one settle window, containing at least 3 readings, whose fitted slope
clears the noise floor per G8. Direction = sign of the slope.

**G20. Multiple observations on the same side.**
*Proposed:* take the **tightest** valid bracket — the highest dose that fell,
the lowest dose that rose.

**G21. What "may only widen, never narrow" means mechanically.**
*Proposed:* observations older than half the memory window (15 days alk, 30
calcium) may only **loosen** an existing bound, never tighten one. An old "14 mL
was too much" cannot cap today's suggestion; an old "10 mL was too little" can
still raise the floor.

**G22. Step cap — 25% of what.**
*Proposed:* of the current dose. A change from 10 mL is capped at 12.5 or 7.5.

---

# §9 — Corrections

**G23. The correction dose itself is never specified.**
The document says corrections exist, gives three paces, and says where they
stop — but never how much to add.
*Proposed:* `correctionAmount = (targetLevel − currentLevel) / effectPerMl`,
delivered over `days = deficit / (rail × paceFraction)`, split evenly. **This is
the single biggest hole in the document.**

**G24. Who picks the pace.**
*Proposed:* the user, with steady (50%) preselected. The app never picks quick
on its own.

**G25. "Middle third" defined.**
*Proposed:* for a band from `lo` to `hi`, the middle third runs
`lo + (hi−lo)/3` to `hi − (hi−lo)/3`. On 8.2–9.2 that's 8.53–8.87.

**G26. "Two readings inside the band" — consecutive?**
*Proposed:* yes, two consecutive readings both inside the band. One in, one
out, one in resets the count. Anything looser lets a bouncing level close a
correction it hasn't finished.

**G27. Correction on top of a maintenance dose.**
Is the correction added to the daily dose, or does it replace it for the
duration?
*Proposed:* **NEEDS DAN.** Added, I think — the tank still consumes during a
correction, so the maintenance dose still has a job. But this is a chemistry
call and getting it wrong doubles or halves a correction.

---

# §10 — Magnesium

**G28. The one-off correction calculator's arithmetic.**
*Proposed:* same as G23, but using the *correction product's* strength, not
Component 3's. Setup needs a second strength field for it.

**G29. How a logged correction suppresses re-warning, and for how long.**
*Proposed:* after a logged correction, the app doesn't propose another until
either a reading dated after the correction shows the target wasn't reached, or
the expected settling time has passed. Same shape as the stale-reading rule.

---

# §11 — Grading (the gap Dan found)

**G30. How the trend is computed.**
*Proposed, all four:*
- Least-squares slope over the **analysis window** — 14 days alkalinity, 28
  calcium and magnesium. Not the difference between the last two readings.
- **Minimum 3 readings.** Two readings are a difference, not a trend.
- Movement must clear the noise floor per G8 — `|slope| × windowDays > floor`.
- Fewer than 3 readings → **no trend verdict at all**. The app says "one more
  reading", it does not guess.

**G31. "Moving further out" when the band edge is crossed mid-window.**
A level that went from 8.6 to 8.0 crossed out of an 8.2–8.8 band partway.
*Proposed:* judge on the **current position** and the **fitted slope**. Out of
band now, slope pointing further out → `worsening`, regardless of where it
started.

---

# Summary

**31 gaps.** Three need Dan's judgement: G13, G15, G27. One is a genuine hole
rather than a vagueness: **G23 — the correction dose arithmetic is entirely
absent from the document.**

The rest are mechanical and can be closed by writing them down.

**None of this means the spec is bad.** It means a spec that has never been
implemented against always reads as more complete than it is. This is what the
test build would have surfaced anyway — finding it now is cheaper.
