# Needs Dan

Decisions no agent may make. Newest at top. Dan clears this file.

---

## Open

### 3. §7's composition claim doesn't fully hold during an active correction

Bug 3 (`routines/15-phase6-bugs.md`) removed the out-of-band halving in
`doseDriftedFrom` (§7) and fixed stability grading to catch a level outside
its band and still worsening regardless of rate (§11), on §7's own stated
premise: "with grading fixed, the app catches a slow decline directly and the
hair-trigger is no longer doing any work." The golden sweep (5 of 5,940 rows,
all alkalinity, all with a correction logged) shows one narrow case where that
premise doesn't hold.

**The mechanism.** `doseDriftedFrom`'s (now-removed) `outOfBand` argument was
computed from `out.current.value` — the last **raw** reading. Grading's new
`outOfBandWorsening` check (this bug) is computed from `fittedNow` — the
**correction-adjusted** fitted position, which was already what `alkWorsening`
used pre-fix. During an active correction these two can disagree at the
margin: the raw last reading sits just outside the band while the
correction-adjusted fit sits just inside it. Before this bug, a real ~7-8.7%
dose gap in that state was caught by the halved 6% out-of-band trigger (using
the raw position). After this bug, the same gap is under the full 12% trigger
(halving gone) and grading doesn't promote the band away from "stable" either
(the fitted position reads in-band, so the two qualifiers never engage). The
result: a real, moderate dose gap that used to prompt a recalculation now
holds silently until it either clears 12% on its own or the correction ends
and the raw and fitted positions converge again.

**Reproduce:** `routines/15-phase6-bugs.md` bug 3's golden audit,
`alkalinity|0.8|-0.02|7|false|true` through `|0.8|0|20|false|true` in
`tests/legacy-port/golden.js`'s sweep (offset 0.8, near-zero slope, an active
correction). `action: "increase" -> "hold"`, no `band` change, `doseDriftedFrom`
flips from true (halved, raw-position out-of-band) to false (un-halved, and
grading sees the fitted in-band position).

**Options, not a recommendation:**

(a) **Leave it.** The window is narrow — needs a dose gap in roughly the 6-12%
band (30-60% for calcium, since its trigger is 30%), a level within about a
kit-noise-floor's width of the band edge, and an active correction running.
It resolves itself once the correction completes (raw and fitted positions
reconverge) or the gap grows past 12%/30% on its own. Cost: a real gap sits
uncorrected for the life of the correction, which could be days.

(b) **Make `doseDriftedFrom`'s out-of-band-ness (if the halving is ever
reconsidered) or `outOfBandWorsening`'s position test use the same measure of
"where the level is."** Whichever of `out.current.value` (raw) or `fittedNow`
(correction-adjusted) is chosen as the single source of truth, use it
everywhere a "which side of the band" question is asked. This is bigger than
bug 3's citation — `alkClearlyOut`/`caClearlyOut`/`clearlyOut` (the
`alkWorsening` family) already use `fittedNow` exclusively, so unifying on
`fittedNow` is probably the smaller change, but it's a live behavioural
change to more than the two things this bug touched and needs its own
authorisation.

(c) **Widen `outOfBandWorsening` to also fire on a large `doseDriftedFrom`-
style gap even when `fittedNow` reads in-band**, reasoning that a real
double-digit-percent dose/consumption mismatch is itself evidence worth
acting on independent of band position. This reintroduces something
halving-shaped, just gated differently — worth being explicit that's what it
is before choosing it.

**In plain terms:** a very specific, narrow situation — the tank's true
alkalinity is right at the edge of its healthy range, a manual top-up
correction is running, and the daily dose is off by a moderate amount (not a
lot, not a little) — used to get flagged for a dose recalculation and, after
this fix, doesn't get flagged until either the correction finishes or the
mismatch grows larger. Nothing crashes and nothing dangerous is missed (an
emergency — the level actually past its safe edge and still heading the wrong
way — is caught by a separate, unaffected check), but a real, moderate dosing
error can sit unflagged for the life of a correction. Found by machine-testing
thousands of synthetic scenarios, not observed on the real tank.

### ~~2. Negative-consumption refusal~~ — closed 2026-08-14, see Decisions

Decision 3's option (c) was wrong at the premise, not merely mis-calibrated.
The replacement rule is recorded below and in `docs/spec/reef-chemistry.md`
§24, and is implemented. The investigation that produced this item — the three
blocking checks the option-(c) attempt broke, and why — is left in
`.agent/log/2026-08-14-phase6-bugs.md`; it is the evidence the replacement was
written from, and the golden and protocol findings in it still stand.

### ~~0. The magnesium rail has two live values~~ — closed 2026-08-14, see Decisions

### ~~1. `reef-chemistry.md` §2 still uses the losing term~~ — closed 2026-08-14

The registry banned "water volume"; the old §2 heading (`## 2. Water volume`)
and its definition line still used it. Both were rewritten during the 14 August
canon swap, when that section was carried forward as **§17 Net volume** —
heading and definition line now read "net volume". This was not a fourth
unauthorised spec edit: the section was being rewritten anyway to survive the
swap, and the registry decision already settled the wording.

The only remaining occurrences of the phrase in canon are in
`wizard-states.md` §15's registry itself — the concept column and the never-use
column — where naming the banned term is the point.

---

## Decisions

### 2026-08-14 (latest) — Dan, spec owner: the calcium suggested default stays 425 ±25

**No spec change, no code change, no backlog item.** `reef-chemistry.md` §2
layer 3 keeps calcium at **425 ppm, 50 total (±25)** — 400–450. It is correct as
written and is not to be moved.

**What this closes.** `docs/journeys/journey-2-calcium.md` flagged it as a
possible mismatch: canon centres the suggestion "well below where he actually
keeps it." That reading is resolved — it is not a mismatch. 400–450 is where
most reefers target, and layer 3 exists to give a *new* user a sane starting
point, not to describe the owner's tank.

**What is recorded instead.** Dan runs **450–500** himself, and **anything up to
500 is tolerated** — layer 1's hard limits already permit it (calcium 350–500;
above 500 it starts pulling alkalinity down). But that is a **layer 2**
preference inside a user-set band, and a user preference inside the band is not
a reason to move the layer 3 suggestion. The two layers are doing different
jobs; this is exactly the distinction Dan drew himself about magnesium in
`journey-3-magnesium.md` — "up to 1500, even 1600 are safe, **but I wouldn't put
that in the app**" — personal tolerance is not published guidance. Journeys
README rule 4 (don't generalise from one tank) points the same way.

The journey now carries a resolved note at the paragraph that raised it. **Do
not re-raise.**

### 2026-08-14 (later still) — Dan, spec owner: negative consumption holds, it does not cut

**Replaces `routines/15-phase6-bugs.md` bug 2's authorisation** — Decision 3's
option (c), a refusal for any gain beyond the element's trend-noise floor.
That option was wrong at the premise and is withdrawn. Recorded at
`docs/spec/reef-chemistry.md` §24, cross-referenced from §6 and §12, and
implemented under this authorisation.

**Why the original was wrong.** It assumed a negative consumption means the
model has broken. It does not. **626 of the 6,000 random assessments in
`tests/legacy-port/invariants.js` produce one**, and the legitimate causes are
ordinary: a one-off correction, a water change with a richer salt, demand
collapsing, a wrong Setup strength, a bad reading, or a fast nitrate drop. The
legacy behavioural suite already knew this — `tests/legacy-port/protocols.js`
expects **`hold`** for magnesium §61, a reading whose consumption comes out at
−1.86 ppm/day. The previous attempt's golden and protocol regressions were the
suite saying so, not a calibration problem to be tuned around.

**The actual bug is narrower: the cut, not the clamp.** A forced
`maintenanceDose` of 0 against a real `currentDose` reads as a 100% gap to
`doseDriftedFrom`, saturating the 12% alkalinity and 30% calcium triggers
unconditionally, and the engine sizes a reduction from that zero — roughly 25%
on Decision 3's own worked alkalinity case (9.0 → 6.8 mL/day), toward a level
the arithmetic never diagnosed as excessive. That cut is the harm. The clamp
stays: a negative maintenance dose is not a thing anyone can pour.

**The rule, four parts.** (1) A negative consumption never sizes a dose change
— hold. (2) Report the observation, not a cause: the level is rising faster
than the dose accounts for, and the dose is unchanged; the app must not claim
to know why. (3) Ask what it cannot see — has a water change or a one-off
correction been logged? If not, this may be a testing error or a change in
demand; test again in two days. (4) Escalate on repetition, not on a single
instance: three consecutive negatives with nothing logged is a real signal,
most likely a wrong Setup strength or genuinely collapsed demand, and should
say so. The action stays `hold` throughout, escalation included.

**One qualification, and it needs Dan's eye.** A level at or over the top of
its range and still rising **keeps its reduction**. Without it
`protocols.js` **Mg §56** fails — 1480 → 1495 in a week, five ppm below the top
of its range, a gaining reading whose required answer is `decrease`. Decision 3
had already named suppressing that response as the one concrete regression risk
of any refuse-style fix. It is written in each engine's own existing vocabulary
(above the band with a positive trend, or `nearEdge === "upper"` where calcium
and magnesium already compute it); **no new threshold was invented.** It is
nonetheless a qualification the four-part rule does not state, and it is the
one thing in this change that goes beyond the words authorised — flagged here
rather than buried in a diff. The alternative was to break §56, which the
authorisation explicitly forbade.

**What it costs, measured against the 5,940-case golden sweep.** 1,206
assessments produce a negative consumption. **60 change** — 14 calcium, 46
magnesium, every one `decrease → hold`, audited row by row, and nothing else in
the sweep moves. 732 already held for another reason. 746 keep their reduction
under the qualification above.

**The golden fingerprint moved, by design:** `37ded9064e91e80e →
372fcda432be5bcf`, re-recorded through `golden.js`'s own documented `UPDATE=1`
mechanism after the diff was audited. That digest was also the proof that the
port matched `legacy/` byte for byte; **it no longer does**, and those 60 rows
are the whole of the difference. `legacy/` itself is untouched (AGENTS.md #9).
Worth knowing rather than discovering later.

**Also fixed, because it would have shipped a contradiction.** `doseStatus`'s
idle cards say the dose is matching consumption — "nothing to do, keep testing
on your usual schedule" — which would have printed directly under a wizard
asking for a retest in two days. A hold reached this way is marked and the card
now echoes the wizard. The `state` stays `"idle"`; no new state value was
introduced, so no consumer of that field changes behaviour.

**Verification.** `npm run verify` green, all blocking checks, including the
three the previous attempt broke: `legacy-port:golden`, `legacy-port:protocols`
(39/39) and `legacy-port:invariants` (6,000 assessments, 0 properties
violated). `npx vitest run`: 69 failed / 213 passed, against a measured
baseline of 69 failed / 200 passed on the same tree without this change — the
same 69 pre-existing `[chem]` failures, 13 new tests passing, none added.
`src/test/defects/negative-consumption.test.js` has 13 assertions; 12 fail
against the code as it stood before the rule.

**In plain terms.** Sometimes a tank shows more alkalinity, calcium or
magnesium than your dose can explain — a water change with a richer salt, a
correction you added, corals eating less, a wrong bottle strength, or just a
duff test. The app used to read that impossible sum as "you are dosing too
much" and quietly recommend cutting your dose by about a quarter, with nothing
on screen saying the maths had implied your tank was making alkalinity out of
nothing. Now it holds the dose and tells you what it actually saw, without
guessing why. It asks the one thing it cannot see — did you do a water change
or add a correction? — and if you logged one, it says so. If not, it suggests
retesting in two days. Three readings running with nothing logged and it says
plainly that the Setup strength is probably wrong or demand has really fallen
away — still without changing your dose. The single exception: if the level is
already at or over the top of your range and still climbing, you are still told
to dose less, because there it is the level talking, not the arithmetic.

### 2026-08-14 (later) — Dan, spec owner: the magnesium rail is 25 ppm/24 h

Settles the 25-vs-50 conflict the canon swap surfaced (open item 0, now closed).
The old canon said 50, set on 13 August; the merged draft written the same day
said 25. **25 wins.**

Recorded in `reef-chemistry.md` §3 with the reasoning, and worth repeating here
because the losing figure is the better-sourced one: **50 ppm/day is the Aqua
Forest magnesium label's own stated maximum daily increase** — not a guess, and
nothing in this decision calls it unsafe. **25 is the conservative figure, chosen
for consistency across the three rails.** Calcium sits at 20 ppm/day where BRS
allows 50 for large corrections; taking the manufacturer's ceiling for magnesium
while taking the conservative number for calcium would mean the rails were
picked on two different principles — the disagreement-between-numbers failure
this app keeps having. One principle, all three rails: the conservative number.

**Revisit if corrections prove too slow in practice.** The cost is days on a
magnesium correction — 150 ppm takes 6 days at 25 rather than 3 at 50. If that
becomes real friction on the tank, the label figure is there and §3 is the
paragraph to come back to.

Consequences, already applied: the UNRESOLVED note in §3 is gone, and
`.agent/backlog.md` TW-016 is unblocked and rescoped. It turns out to be smaller
than filed — `safe-rate.js`'s `CORRECTION_MAX_RATE` is *already* {0.5, 20, 25}
and needs no change at all, so the work is `correction.js`'s magnesium
`maxPerDay` of 100 (four times the rail) plus re-pointing `rails.test.js`'s
`SPEC_RAIL`, which still asserts the pre-13-August {0.5, 25, 100}. No
application code was changed under this authorisation.

### 2026-08-14 — Dan, spec owner (resolves Decisions 1, 2, 4 and 5 of `.agent/five-decisions.md`)

Authorised as owner. **Spec only — no application code was touched.** The
resulting code work is filed untagged in `.agent/backlog.md`.

**1. Which engine owns the drift response — the wizard, and only the wizard.**
(Decision 1, option (a).) The wizard recomputes `maintenanceDose` in full on
every assessment that clears the dose-gap trigger and stages a magnitude-banded
fraction of the recomputed gap. There is no flat percentage nudge in it and
never was. The flat 10%/15% that `reef-chemistry.md` §7 attributed to the app
belonged to `src/lib/analytics/drift.js`, a second engine with its own noise
floors and windows and no knowledge of staging, bracketing, rate ceilings,
plausibility or a running plan — **its dose figures are being removed**.
`assessDrift`, the slope classifier that emits no dose number, is not covered by
this. BRS's 10%-a-day advice is real and is not being disputed; it is simply not
what this app does, and BRS itself switches regimes past about 1.4 dKH.
Recorded at `reef-chemistry.md` §7, `wizard-states.md` §0.3 and §9.4.

Two things that fall out of it and still need doing: `previewStrengthChange`
needs a new source for the "Suggested dose … after" row at `Insights.jsx:697`,
and `DOSE_ADVICE_RULES`'s `magnesium` key contradicts `reef-chemistry.md` §10 by
omission — that one needs closing regardless of this decision.

**2. Water changes are not excluded from the trend fit.** (Decision 2, option
(a) on the boundary question; option (c) declined for now.) Only logged
corrections leave the fit, and they leave it by proportional subtraction over
three days, not by dropping readings or restarting the window. The reason is the
one already recorded in `src/lib/dosing/alkalinity.js:493-499` — restarting the
window weekly left the assessment one reading to work from and it answered
"hold" on tanks that were visibly draining — and the cadence arithmetic makes
the same failure worse, not better, for calcium and magnesium. Not settled, and
written into the spec as open: a mismatched salt mix can push a routine 10%
change to two or three times alkalinity's noise floor, and **no size threshold
anywhere distinguishes a routine 10% change from a 40% one**. Mathematical
subtraction is declined for now because `SALT_MIX` is hardcoded with no Setup
field to correct it, which would make a wrong baseline a silent input to a dose.
Recorded at `reef-chemistry.md` §6.

**3. Bracket memory is a flat 45 days, all three elements.** (Decision 5,
day-count sub-question, option (a).) The 30/60 split is withdrawn and so is its
"roughly two settle windows each" justification, which does not survive
arithmetic: two of alkalinity's settle windows is 4–10 days, not 30, and two of
calcium's is 14–60, with 60 only at the slow extreme. The 25% consumption
filter, not the calendar, is what catches staleness — 45 days costs 3.3% drift
on 30%/year growth and 6.0% at 60%/year, both far inside it. The directional
"widen never narrow" rule stays **open**, with its stated circularity
justification marked as not reproducing against the code's actual formula.
Recorded at `reef-chemistry.md` §8.3.

**4. A correction arrives in the middle third of the band, floored at twice the
noise floor.** (Decision 4, option (c), the noise-widened construction.)
`zoneWidth = max(bandWidth / 3, 2 × noiseFloor)`, clamped to the band, centred
on the midpoint; `correction-done` still needs two readings, now inside that
zone rather than anywhere in the band. The aim point is untouched — still the
midpoint, still a point and not a zone. The floor is on the zone's **total
width**; a bare middle third leaves 60% of calcium's and magnesium's zone inside
the kit's blind spot, and the floor brings that to 50%. Zones at the suggested
bands: alkalinity 8.40–8.60, calcium 415–435, magnesium 1320–1380. Recorded at
`reef-chemistry.md` §9 and `wizard-states.md` §4.

Also deleted under this authorisation, as instructed: the claim in both merged
drafts that **"consumption does not re-baseline until `correction-done`
clears."** No mechanism implements it — the analytics layer contains no
reference to corrections, plans or `arrived`. Deleted rather than restated as an
intention, because it was being used to argue that a narrower arrival test would
carry a real functional cost.

Three documentation corrections were made in the same pass, not decisions:
§8 now carries **the five constraints in their fixed order** (rounding, rate
ceiling, plausibility, bracketing, step cap) with the statement that order
changes the answer, replacing three constraints in a different order; §8.1 now
carries **the full staging table** from `calculation-spec.txt` §6, including
magnesium's absent rescue path and the 72 mL/day figure behind it; and the
middle-third self-contradiction — a middle-third heading with a full-band exit
condition two sentences below it, in both documents — is resolved by decision 4
above.

Wording note on decision 4: the authorisation said "the zone half-width is never
less than 2× that element's noise floor," which is the phrasing used in
`five-decisions.md` Decision 4. That document's own worked numbers (calcium
widening to 20 ppm, magnesium to 60 ppm, both at a 50% noise ratio) and its
stated rationale ("at least as wide as the noise band on both sides of a true
reading") are a floor on the **total width**, so total width is what is written
into the spec. Read as half-width instead, the zone would be 405–445 for calcium
and 1265–1385 for magnesium — 80% of the band in both cases, which would make
the narrowing nearly a no-op and amount to choosing option (a). Say the word if
half-width was meant literally; it is a one-line change in three places.

### 2026-08-13 — Dan, spec owner (resolves both items from run 2026-08-13-consistency-sweep)

**Magnesium rail: 50 ppm / 24 h.** `reef-chemistry.md` §6 — now §3 after the
14 Aug canon swap — changed from 100 to 50. Source recorded in the table: Aqua Forest magnesium label, "maximum daily
increase 50 mg/l (ppm)". Neither in-app table was right — `correction.js`'s
100 matched the old canon and now **exceeds** the rail; `safe-rate.js`'s 25 is
under it but is a hardcoded tightening, not a `[user]` one.

**Calcium rail: 20 ppm / 24 h.** `reef-chemistry.md` §6 (now §3) changed from 25 to 20,
noted in the table as matching the real-world sourcing cited in
`src/lib/analytics/safe-rate.js` (reefcalcs' 20 ppm/day safe rate). Both
in-app tables already agree at 20, so canon moved to the code here, not the
code to canon. The uniform constant drift is closed.

**Volume terminology: "net volume" wins.** `wizard-states.md` §15
registry row changed: the word to use is **net volume**; "water volume" joins
"tank size, volume, capacity" in the never-use column. `reef-chemistry.md`
already uses "net volume" throughout, so the losing file was the registry.
This is the file that wins on terminology going forward — do not re-raise.

Why these and not the alternatives: the rails are hard caps on how much goes
into a live tank, so each one now carries its own real-world source in the
spec rather than an unattributed number. "net volume" was already the majority
usage in canon and is the more precise of the two terms — "water volume" does
not say net.

Application source code was **not** touched under this authorisation. The
resulting code work is filed untagged in `.agent/backlog.md`.
