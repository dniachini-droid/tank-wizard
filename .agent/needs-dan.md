# Needs Dan

Decisions no agent may make. Newest at top. Dan clears this file.

---

## Open

### 2. Negative-consumption refusal (routine 15, bug 2) — Decision 3's option (c), as specified, breaks the legacy behavioural suite

**What was tried.** `.agent/five-decisions.md` Decision 3 worked three options
for what to do when `consumption` comes out negative ("gaining"). Routine 15
(`routines/15-phase6-bugs.md`, bug 2) authorised option (c), the "middle"
ground: a gain within an element's own trend-noise floor (`ALK_TREND.stable`
/ `CA_TREND.stable` / `MG_TREND.stable`) continues exactly as today (clamp to
zero, label "gaining"); a gain clearly beyond that floor stops before the
hold/act branches with an `action: "implausible"` refusal, reusing
`strengthPlausible`/`dosePlausible`'s existing convention — except when the
level is already past its own safe bound (`findings.js` `SAFE_BOUNDS`) and
still moving the wrong way, in which case the refusal stands down so that
emergency response still fires (the routine's own explicit ordering note,
citing Decision 3's "must change with").

I implemented exactly this in all three engines (`alkalinity.js`,
`calcium.js`, `helpers.js`'s magnesium assessment), wrote failing-then-passing
tests proving the refusal fires for Decision 3's own worked "large" numbers
and stands down for a constructed safe-bound emergency, confirmed both with
`npx vitest run` — then ran `npm run verify` and it failed three blocking
checks that were green before the change:

- `legacy-port:golden` — fingerprint changed (`37ded9064e91e80e` ->
  `2497c8fdd5a7313f`). Every regressed row I inspected has the same shape:
  `calcium|-2.5|0.29|...` — calcium below its target range and recovering
  upward (a rising trend, e.g. "Calcium is below your range at 315ppm and
  moving up toward it"). Before: `action: "hold"` (the existing "moving to
  target, don't fight the direction you want" branch). After: `action:
  "implausible"`, because the negative-consumption refusal I added runs
  *before* that branch is ever reached and catches the same rising trend as
  "gaining beyond the noise floor."
- `legacy-port:protocols` — `MISS Mg §61: got "implausible", expected
  "hold"`. Fixture: magnesium readings 1360 -> 1380 -> 1400 over 14 days
  (20 ppm/week), comfortably inside the 1250-1400 band and nowhere near
  `SAFE_BOUNDS.magnesium` (1150-1600). Per §10, magnesium never drives a dose
  off trend at all — the protocol's own answer is simply "hold" regardless of
  direction or rate. My refusal fires anyway, because 20 ppm/week converts to
  a per-day gaining amount that clears `MG_TREND.stable` (10 ppm/week) — the
  same test the routine specified, applied to an entirely ordinary reading.
- `legacy-port:invariants` — 6,000 random assessments, 626 (~10%) produced a
  negative `consumption` or `maintenanceDose`, because my refusal branch
  returned before the existing zero-clamp ran. That specific part is a plain
  implementation bug in my patch and fixable on its own (clamp before
  returning) — but it doesn't touch the two findings above, which are about
  the *action* changing, not the raw figures.

**The actual problem.** The threshold Decision 3 authorised — "clearly beyond
the element's own trend-noise floor" — does not distinguish implausible
chemistry from ordinary tank behaviour anywhere near as cleanly as the
worked arithmetic suggested. Two large, legitimate classes of movement
produce "consumption negative, beyond the noise floor" as a matter of course:
a level recovering from below (or above) its target band, which is *supposed*
to move faster than the maintenance dose alone would explain; and, for
magnesium specifically, ordinary slow drift within its own band, since
nothing about magnesium's assessment reacts to trend by design (§10). The
routine's own ordering note anticipated one exemption (the safe-bound
emergency) but not these two, and Decision 3's worked examples were chosen
to demonstrate the *bug*, not sampled against the legacy golden/protocol
corpus for false positives — so this gap wasn't visible until it was run
against real fixtures.

**Why I stopped instead of extending the exemption myself.** AGENTS.md rule 5
forbids changing a chemistry threshold or formula beyond what's authorised,
and rule 7 asks for a report rather than a forced fix when a bug wants more
than its citation covers. Inventing a wider exemption (e.g., also standing
down whenever the level is moving toward its target band) or a looser
threshold multiplier would be exactly that: a new, uncited chemistry
judgement call, the same kind of call Decision 3 itself declined to make
("no basis for a recommendation — this needs Dan's judgement").

**The change was reverted in full** (`git checkout` on all three engine
files, the new test file removed) before this was written up. `npm run
verify` confirmed green again afterward — all blocking checks pass, same as
before this bug was attempted. Nothing was left half-fixed.

**Options, for the actual decision:**

- **(a) Status quo, formally.** Leave the clamp-and-continue as it is for all
  magnitudes of gaining, closing this as "investigated, not changed."
  Chemistry risk: none beyond what already exists today (nothing about
  today's behaviour changes). Cost: the two real problems Decision 3
  documented stay open — alkalinity/calcium still walk into an unexplained
  ~25% dose cut on a real gaining event, and magnesium's gaining stays fully
  silent with no other symptom to flag a bad reading. This is where the
  routine's own attempted fix landed once evidence overruled the plan; it is
  a legitimate outcome, not a failure to act.
- **(b) Narrow the trigger to exclude "moving toward target."** Compute
  whichever of `above`/`below` + trend-direction each engine already uses for
  its own "moving to target, hold" branch, and add it as a second exemption
  alongside the safe-bound one — refuse only when the level is *not* headed
  toward its band. This would very likely close the calcium golden
  regression (that fixture is exactly the moving-to-target shape) but not
  the magnesium one, since §61's reading is already inside its band, not
  approaching it from outside — magnesium would need its own, separate
  carve-out (plausibly: never refuse for magnesium at all, consistent with
  §10 already exempting it from every other trend-driven action). This is
  the direction I'd take if authorised, but it is two more chemistry-relevant
  judgement calls beyond what Decision 3 or the routine settled, and I have
  not verified it against the full golden/protocol/invariant corpus.
- **(c) Raise the threshold instead of narrowing the trigger.** Keep one
  exemption (safe-bound) but require the gain to clear a larger multiple of
  the noise floor (2x, 3x — unset) before refusing, on the theory that a
  small multiple is what's catching ordinary recovery and drift. Untested
  against the golden corpus, and picking a multiple is exactly the kind of
  unsourced number Decision 3 avoided inventing; it would need the same
  sourcing scrutiny the original three options got.

**In plain terms.** I built the tank-wizard app's planned fix for "the app
sometimes recommends cutting a dose when the tank is actually just gaining
that element naturally" — but when I ran it against the app's full historical
test suite (thousands of pre-verified reef scenarios), it also started
wrongly flagging two completely normal situations as suspicious: a tank
recovering back up toward its target range after being low, and magnesium
drifting slowly within its healthy range (which the app is never supposed to
react to anyway). I did not ship the change — the app behaves exactly as it
did before this attempt, nothing is broken, and the original problem
(the dose-cut and the silent magnesium case) is still open. Fixing it
properly needs a couple of small judgement calls about exactly when to hold
back the new warning, which is what the options above lay out.

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
