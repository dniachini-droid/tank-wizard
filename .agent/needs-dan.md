# Needs Dan

Decisions no agent may make. Newest at top. Dan clears this file.

---

## Open

### 0. The magnesium rail has two live values — 25 or 50 ppm/24 h (surfaced by the 2026-08-14 canon swap)

Your 13 August decision set the magnesium rail to **50 ppm/24 h**, sourced to the
Aqua Forest label ("maximum daily increase 50 mg/l"), and it was written into the
old `reef-chemistry.md` §6. The merged draft that became the new
`reef-chemistry.md` was written the same day and independently kept **25
ppm/day** in its §3 rails table, sourced as "widely given as 25; Aqua Forest
label allows 50". The two documents never met, so replacing the old file with the
merged one would have silently reverted your decision.

Nothing has been resolved. §3 now carries an **UNRESOLVED** note stating both
figures and their sources, and `.agent/backlog.md` TW-016 — the code item filed
against the 50 ppm figure — is marked blocked on this, because it cannot be
implemented while canon disagrees with itself about the number.

What is not in dispute: calcium (both say 20 ppm/day) and alkalinity (both say
0.5 dKH/day). Live code is a third and fourth answer already —
`correction.js:20` says 100, `safe-rate.js:27` says 25 — which is what TW-016
exists to fix.

One line from you settles it: 25 or 50.

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
