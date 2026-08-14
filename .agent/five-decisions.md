# The Five Decisions, Worked Up

> **Note added 2026-08-14 (canon swap).** This is a historical record; its body
> is left as written. The files it cites were renamed that day:
> `reef-chemistry-MERGED.md` → `docs/spec/reef-chemistry.md`,
> `wizard-states-MERGED.md` → `docs/spec/wizard-states.md`,
> `docs/spec/surfaces-and-messaging.md` → `wizard-states.md` §11–§17 (add 10 to
> the section number), `docs/spec/app-contract.md` → `wizard-states.md` §18,
> `docs/spec/incoming/*.txt` → `legacy/protocol/*.txt` (identical files,
> duplicates deleted). Section numbers in `reef-chemistry.md` §1–§14 and
> `wizard-states.md` §0–§10 are unchanged, **except** that §8's subsections
> shifted: bracketing §8.1 → §8.3, step cap §8.2 → §8.4, rate ceiling
> §8.3 → §8.5. Everything the previous canon carried that the merge had dropped
> now lives in `reef-chemistry.md` Part II (§15–§23), which maps the old sections
> to the new ones.

**Routine 12.** Reports only — nothing here changes code, spec, tests or
constants. Five decisions Phase 4 surfaced and stopped at, each given the
full `domain-verifier` treatment: what sources say, two or three options with
checkable reasoning, which direction being wrong hurts, what already does
this job, what else must change alongside, whether it's one question or two,
the edges, hand-computed arithmetic against the real constants in `src/lib/`,
and what would make the leaning option wrong. **Dan still chooses** — nothing
below picks an answer.

Per non-negotiable #11, every decision is written twice: a precise layer
(figures, `file:line`) and a plain reef-speak layer. `legacy/tests/sim/*.js`
results are not presented as evidence about current behaviour anywhere below,
and `private/` is not in this checkout — every place real-tank replay would
have settled a question, that is said plainly instead of substituted for.

---

## Decision 1 — Which engine owns the drift response?

**what sources say:**

§7's disputed paragraph, quoted exactly (`docs/spec/reef-chemistry-MERGED.md`
lines 196-204):

> ### The response to a gap
> For ordinary drift, the response is a **10% adjustment to the daily dose**,
> not a correction. BRS: if levels are slowly rising, subtract 10% per day;
> if slowly falling, raise by 10%. Repeat until stable.
> This is gentler than recalculating from scratch and self-corrects even when
> the consumption model is slightly off. Full recalculation is reserved for
> genuine corrections (§9).

Checked against BRS directly: BRS's alkalinity dosing guide does say exactly
this — slowly rising, subtract 10%/day; slowly falling, add 10%/day; repeat
and retest — for ordinary drift. For a larger one-off adjustment (BRS's own
threshold: >1.4 dKH) BRS switches recommendation and says spread the
calculated dose over a few days by halving it, not by applying a flat 10%.
So even BRS itself has two regimes, not one.

`reef-chemistry-MERGED.md` opens by defining its own scope (lines 5-8): "This
document is the arithmetic. Read this one to know what number **the app**
produces." §7 sits inside that document, directly under the dose-gap trigger
table (12% alkalinity / 30% calcium — which **does** match live code,
`DOSE_DRIFT_TRIGGER` in `src/lib/dosing/helpers.js:474-475`), with no
sentence anywhere saying "this paragraph describes a second, separate engine
feeding a different screen." A reader has no way to know §7 is not describing
what `assessAlkalinity`/`assessCalcium` do.

It is not what they do. `alkalinity.js:832-846`: once the 12%/30% gate at
`alkalinity.js:716` (`doseDriftedFrom`) opens, the code recomputes
`maintenanceDose` from scratch (`consumption = supplied - trend`) **every
single time** — never gated behind "full recalculation reserved for
corrections" — then stages a *fraction of that freshly recomputed gap* by
magnitude: 100% if the gap is ≤2 mL, 90% if ≤4 mL, else 55-70% depending on
urgency (calcium: ≤1 mL/≤3 mL/50-60%, `calcium.js:566-569`; magnesium:
≤1 mL/≤3 mL/45-55%, never rescued, `helpers.js:916-918`). That is a
magnitude-banded fraction of a full recompute — not "subtract/add a flat 10%,
repeat until stable."

What §7 actually describes — a flat, direction-only percentage, independent
of gap size, iterated call to call — is almost exactly
`src/lib/analytics/drift.js:211`: `pct: drift.severity === "high" ? 15 : 10`.
That is Mechanism B, not the wizard.

**So: the reading the routine started from is correct.** §7 attributes to
"the app" (which the document's own preface defines as the wizard/arithmetic
engine) a behaviour the wizard's real code does not implement, and that
behaviour is instead what the separate `drift.js` module implements. This is
not a case where the two mechanisms happen to agree and the doc merely
describes one instance of a shared idea — the arithmetic is structurally
different (flat % of current dose vs. staged % of a recomputed gap), as the
hand-worked example below shows numerically.

**options** (for what should be true going forward — not decided here):

- **(a) The wizard's staged-recompute governs everywhere.** `drift.js`'s
  `computeDoseAdvice`/`computeDoseCalc` numeric output (`.pct`, `.calc`) is
  removed from every surface that can produce a "what to dose" figure,
  including the one live consumer found below. `assessDrift` (the
  slope-vs-threshold classifier, no dose number) can stay for narrative use
  ("alkalinity is drifting") since that half is genuinely a different,
  lighter-weight question than "what should the dose become."
  Basis: §0.3's "the wizard owns the verdict... nothing else in the app
  decides what an element's situation is" (`wizard-states-MERGED.md`
  lines 27-31, 54-55) is written without a surface allowlist — it reads as a
  whole-app rule, not a rule about three named screens.

- **(b) `drift.js` keeps `assessDrift` but not `computeDoseCalc`.** The
  narrative/severity read stays; the dose-figure calculator is deleted or
  fenced off — nothing downstream may ever render a millilitre or percentage
  figure from it. The one live consumer (`corrected-strength.js`'s
  `previewStrengthChange`, feeding `Insights.jsx:697`'s "Suggested dose"
  preview) is re-pointed at the wizard's own assessment function run under
  before/after settings, instead of at `computeDoseAdvice`.
  Basis: same as (a), narrower — accepts that a slope classifier ("drifting,"
  "recovering," "settling") is not the same kind of claim as a dose figure
  and only the latter needs killing.

- **(c) `drift.js` keeps both, but must match the wizard's verdict.** Its
  classification and its own number both stay, but it is required to match
  `doseStatus`'s `state`/direction for the same element before either can
  render, and any numeric field is presentation only (e.g. annotate a
  sparkline with "the model says ~+15%") rather than an actionable card.
  Basis: cheapest to build, preserves whatever `drift.js` was for. But
  "presentation only" is hard to enforce in a codebase that has already, once,
  let a presentation number (`previewStrengthChange`) become an actionable
  "Suggested dose... after" row a user can act on — see "already does this"
  below. No existing code pattern in this repo demonstrates that a
  reconciliation check between two engines' verdicts can be built and kept
  enforced; this option would be inventing that pattern for the first time.

**arithmetic** (hand-computed, against real constants — alkalinity,
currentDose 9.0 mL/day, effectPerMl 0.0692 dKH/mL, trend −0.15 dKH/day —
falling, so all three mechanisms recommend an increase):

Shared substep (identical in both engines, since it's the same physics):

```
supplied    = 9.0 × 0.0692            = 0.6228 dKH/day
consumption = supplied − trend        = 0.6228 − (−0.15) = 0.7728 dKH/day
target dose = consumption / 0.0692    = 11.1676 mL/day
rawChange   = 11.1676 − 9.0           = +2.1676 mL
```

`drift.js`, `.pct` field (`drift.js:211`): `perWeek = −1.05` dKH/wk;
`guide.perWeek = 0.5`; `severity = "high"` (1.05 > 0.5×2); **pct = 15%** →
recommended dose = 9.0 × 1.15 = **10.35 mL/day.**

`drift.js`, `.calc` field (`computeDoseCalc`, `drift.js:240-273` — the field
that actually reaches a screen today): `recommendedMl = 11.1676`;
`deltaMl = 2.1676`; `pct = 24.08%` (>20 → "big"); `stepMl = 9.0 + 2.1676/2` =
**10.08 mL/day first step**, target 11.17 mL/day.

Wizard (`alkalinity.js:832-846`, the real code path): `mag = 2.1676` mL falls
in the "≤4 mL" band → `applied = rawChange × 0.9 = 1.9508`; `next = 9.0 +
1.9508` = **10.95 mL/day**, before rate-ceiling/bracket/step-cap/rounding
(step cap is 25% of 9.0 = 2.25 mL, not binding here — later constraints can
only trim this further, never raise it).

Three numbers for tomorrow's dose, from the same two readings: **10.35 /
10.08 (or 11.17 target) / 10.95 mL/day** — a spread of about 0.9 mL, roughly
9% of the dose itself. Note `drift.js` disagrees with *itself* (`.pct` says
10.35, `.calc` says 10.08–11.17) depending on which of its own two fields a
caller reads. This is arithmetic against the real constants in the two
files, not a simulation.

**wrong way** (which direction hurts, per option):

If Mechanism B's number were ever surfaced as actionable while Mechanism A is
mid-staged-correction, bracket-constrained, or in a rescue:

- **Mid-staged plan** (§9, e.g. a gentle 25%-of-rail correction under way):
  `drift.js` has no concept of `activePlan`/`continuingPlan`
  (`alkalinity.js:827-830`) — it would compute a fresh, unstaged figure
  against the current (still off-target, still-moving) reading and could
  recommend jumping to a number the wizard is deliberately approaching in
  steps. Direction of harm: over-correction, the coral-stress direction —
  exactly what §8.2's step cap and §9's paced corrections exist to prevent.
- **Rescue case** (level out of band and still moving away,
  `alkalinity.js:841-843`, `rescue = true` → 100% of gap applied
  immediately): `drift.js`'s flat 10/15% would undershoot a case the wizard
  has deliberately decided needs the whole gap now. Harm direction here is
  the opposite: too little, too slow, on a level that must not wait.
- **Bracket-constrained dose**: `computeDoseCalc` has no bracketing input at
  all (see "already does this") — a wrong-but-plausible Setup strength that
  the bracket has caught and is holding down would still slip straight into
  `drift.js`'s number.

(a) removes this risk entirely, at the cost of whatever `drift.js`'s number
was providing (in practice, almost nothing today — see below). (b) removes
the numeric risk; the surviving narrative classifier recommends nothing
numeric. (c) leaves reduced risk — a mismatch-detector can itself be wrong or
miss an edge case, and the one place `drift.js`'s number is *already* live
shows the "presentation only" boundary has already been crossed once without
anyone deciding it should be.

**already does this:**

`src/lib/dosing/state.js` (`doseStatus`, the function `wizard-states-MERGED.md`
names as the single owner of the verdict) does not import `drift.js` and
contains no call to `computeDoseAdvice`, `assessDrift`, or `computeDoseCalc`
(confirmed by grep). There is no existing reconciliation mechanism anywhere in
`src/lib` or `src/components` that compares two numeric dosing verdicts for
the same element — nothing to reuse for option (c); it would be new code.

Which surfaces actually render `computeDoseAdvice`'s output today, since the
routine's framing ("feeds Insights and Dashboard") turns out to overstate
current wiring:

- `Insights.jsx:108` and `Dashboard.jsx:298` both call `computeDoseAdvice`
  into a `doseAdvice` local via `useMemo` — in both files that is the
  **only** occurrence of the identifier. It is computed and never read again:
  dead code in both places (full-file grep, 1 hit each — the declaration
  itself). Neither `.pct` nor `.calc` nor `.together` reaches any JSX in
  either file today.
- The one place `computeDoseAdvice`'s `.calc` field (not `.pct`) *is* live:
  `src/lib/dosing/corrected-strength.js:43-51` (`previewStrengthChange`),
  rendered at `Insights.jsx:697-720` as a "Suggested dose... now / after"
  preview row — but only after a **third**, separate mechanism
  (`calibrateDoseStrength`, which infers strength from the tank's own
  measured response to a past dose change — not `drift.js`) has already
  flagged the entered Setup strength as wrong. So `drift.js`'s number is live
  in exactly one place, gated behind a different verdict engine, framed as an
  illustrative "here's what changing this number would do" comparison rather
  than a current dosing instruction.

A further duplication found while checking this, load-bearing for "must
change with": **magnesium.** `DOSE_ADVICE_RULES` (`drift.js:40-57`) includes
a `magnesium` entry with its own window (14-35 days) and would happily
compute `.calc` for magnesium through the exact `previewStrengthChange` path
just described, since magnesium is one of `DOSE_ELEMENTS`
(`consumption.js:91-93`) and `calibrateDoseStrength` covers it too.
`computeDoseAdvice` never consults `DOSE_DRIFT_TRIGGER` or `doseDriftedFrom` —
magnesium gets no special treatment inside `drift.js` at all. That directly
collides with `reef-chemistry-MERGED.md` §10 (lines 316-319): "The
maintenance dose is never tuned from readings. Not delayed — exempt...
`DOSE_DRIFT_TRIGGER` has no magnesium key and must not gain one."
`DOSE_DRIFT_TRIGGER` indeed has no magnesium key — but `drift.js` never
consults it, so the exemption is only as strong as one engine choosing to
honour a rule the other engine has no knowledge of.

**must change with:**

- Whichever option is chosen, the magnesium gap above needs a decision of its
  own, independent of this one: either `DOSE_ADVICE_RULES` drops its
  `magnesium` key (matching `DOSE_DRIFT_TRIGGER`'s exemption), or someone
  explicitly decides `drift.js`'s "1 mL a day looks like it's helping" logic
  is meant to be exempt from §10 for some stated reason. Right now nobody has
  decided either way; it is an omission.
- If (a) or (b): `previewStrengthChange` needs a replacement source for its
  "Suggested dose" preview row, since its only current input is exactly the
  function being removed.
- If (a): the dead `doseAdvice` `useMemo` calls in `Insights.jsx:108` and
  `Dashboard.jsx:298` should come out too, or they become inert clutter
  referencing a deleted/neutered export.
- Separately from all three options: `doseDriftedFrom` (`helpers.js:489-504`)
  still implements "out of band, half the tolerance applies" (lines 501-503)
  — the exact halving `reef-chemistry-MERGED.md` §7 says was "Decided 13 Aug:
  the out-of-band halving is removed." That's a live spec/code mismatch
  inside Mechanism A itself, independent of the drift.js question, and it
  means any simulation of "the wizard's real behaviour" run against current
  code is not simulating the behaviour the spec says was decided. Flagged
  here because it sits exactly where this decision went looking; not
  resolved here, since it is a separate question from which engine owns
  drift response.

**splits into:**

At least two questions wearing one name:

1. **Which engine computes the number** — mostly settled above: the wizard
   already fully recomputes on every ordinary dose-gap assessment; no code
   today does a lighter "flat 10%, don't recompute" pass for the wizard's own
   path. Only `drift.js` (its `.pct` field) does the flat-percentage thing,
   and it does not know about staging, bracketing, rate ceilings, or active
   plans.
2. **Which engine's number is displayed where** — shown above to already have
   a de facto answer nobody appears to have chosen deliberately: almost
   nowhere (dead code in Insights/Dashboard), except one narrow, already-gated
   calibration preview. Options (a)/(b)/(c) mostly differ on what to do about
   *that one surface*, not about restoring some large existing
   Insights/Dashboard drift-advice UI — because there mostly isn't one live
   to restore.

A third, smaller question: should `assessDrift` (the slope/severity
classifier with no dose number) be treated the same as `computeDoseCalc` (the
number)? Option (b) is built on splitting these two; (a) and (c) don't have
to.

**edges:**

- **Brand-new tank, no dose history.** Bracketing needs dose-change history
  and so does not exist yet either way. But the wizard still applies its
  other guards — rate ceiling, step cap, plausibility — on a brand-new tank.
  `computeDoseCalc` has *none* of those; it is pure
  `delivered − drift → consumed → recommended` arithmetic with no ceiling of
  any kind. On a new tank with a wrong-but-plausible strength entered,
  `drift.js`'s number is structurally *less* protected than the wizard's —
  the "simpler model, safer default" intuition is backwards here.
- **Wrong-but-plausible Setup strength, any tank age.**
  `reef-chemistry-MERGED.md` §8.1 is explicit that bracketing is "the only
  check on a wrong Setup strength" the wizard has. `computeDoseCalc` has no
  bracketing concept at all, at any tank age. Both engines' arithmetic is
  equally poisoned by the wrong strength value; only Mechanism A has any
  chance of catching it, and only once dose history accumulates.
- **Monthly tester.** Both engines gate on ≥3 readings after the last dose
  change and extend their window when readings are sparse. `drift.js`'s
  extension is capped (21 days for alkalinity, 35 for calcium/magnesium) — a
  true monthly tester may still land short of `minReadings` within that cap.
  No basis found for claiming one engine handles this meaningfully better
  than the other; a full check of the wizard's own window logic against the
  same cadence was not completed in this pass.
- **Level exactly on a safe bound.** `drift.js`'s `offTarget` test uses
  strict `<`/`>` against `def.min`/`def.max` (`drift.js:204`), so
  exactly-on-bound reads as in-band there. Whether the wizard's own boundary
  check uses the same operator was not verified — no basis for a comparison
  claim.

**leaning:** No basis for choosing between (a)/(b)/(c) — that is Dan's call.
What the evidence does support without qualification: **§7's attribution is
wrong** (the wizard does not do a flat 10/15% nudge; `drift.js` does, and §7
describes it without naming it), and **the magnesium gap in `drift.js` needs
a decision regardless of which option is picked**, since it currently
contradicts §10 by omission rather than by anyone's design choice.

**would be wrong if:**

- The §7-is-wrong finding would be wrong if a fourth code path exists —
  neither `assessAlkalinity`/`assessCalcium`/`assessMagnesium` nor
  `drift.js` — that actually implements a flat 10%-per-day iterate-until-
  stable rule. None was found in `src/lib/dosing` or `src/lib/analytics`, but
  this was a targeted search on the files the routine named, not an
  exhaustive audit of every file in `src/lib`.
- The "`drift.js`'s number is live in only one place" finding would be wrong
  if some other component reads `computeDoseAdvice`'s output through a
  prop-drilled or re-exported name that doesn't contain the literal string
  "doseAdvice", "computeDoseAdvice", or "computeDoseCalc" — grep-based
  dead-code claims can miss aliasing. Worth a second pass with the app
  actually running and Insights/Dashboard clicked through, which was not
  done here (static analysis only).
- Not run against the legacy simulator or against Dan's real tank data —
  `private/` does not exist in this checkout, so no real-data replay was
  possible. The 10.35 / 10.08 / 10.95 mL/day spread above is exact arithmetic
  for one manufactured reading pair, not a claim about how often or how
  badly this matters across a real tank's history.

### In plain reef-keeping language

**What the sources actually say.** Bulk Reef Supply's own advice for
ordinary slow drift really is "up or down 10% a day, retest, repeat" — the
spec quotes that correctly. But BRS also says that once the gap gets past
about 1.4 dKH, stop doing the daily 10% thing and instead work out the full
correction and split it across a couple of days. So even BRS has two
different rules for two different sizes of problem, not one rule that covers
everything.

The trouble is where that 10%-a-day quote sits in the spec. It's placed right
where the document is describing what the wizard — the thing that actually
tells you "raise your dose" or "hold" on your tank's cards — does. But the
wizard doesn't do the 10%-a-day thing. What it actually does, every time it
decides your dose has drifted enough to be worth touching, is throw away the
old number completely and work out from scratch what your tank is really
using right now, then walk toward that fresh number in steps sized to how far
off you are — small steps for a small gap, bigger chunks of the gap for a
bigger one, and the whole gap at once if you're already outside your safe
range and getting worse. That's a genuinely different way of thinking about
the problem than "nudge 10% and see." The 10%-a-day behaviour the spec
describes is what a second, separate calculator in the app does — one that
lives behind the scenes and, as far as could be checked, isn't actually shown
to you as a dosing instruction almost anywhere right now. So yes — the spec is
describing the wrong engine's behaviour, and it never says so.

**The options on the table** (not a decision — just what's available). One
path is to say the wizard is the only thing allowed to tell anyone what to
dose, full stop, and rip the second calculator's numbers out of everywhere
they could reach a screen. A middle path keeps the second calculator around
just for saying "yes, this is genuinely drifting" in plain words, but never
lets it put a millilitre figure or a percentage in front of you — only the
wizard gets to do that. A third path says both can keep their own numbers,
but the simple one has to check its answer against the wizard's before it's
allowed to show anything, and even then it only gets to draw a little trend
line, never a "change your dose to this" instruction.

**What it looks like on paper, with real numbers.** Take a tank dosing 9
millilitres of alkalinity a day, where the tank's own chemistry says a
millilitre nudges alkalinity by 0.0692 dKH, and alkalinity is slipping by
0.15 dKH a day. Ask three different parts of this codebase "what should
tomorrow's dose be" and you get three different answers: 10.35 mL from the
simple flat-15%-because-it's-slipping-a-lot rule; 10.08 mL as a first step
toward 11.17 mL from the second calculator's own fuller math; and 10.95 mL
from the wizard's actual staged approach. Same two test readings, three
different bottles-worth of dosing pump instructions. And the simple
calculator disagrees with its own other number — its quick 15%-rule and its
fuller math don't even land in the same place.

**Which way this hurts if it goes wrong.** If the simple calculator's number
ever reached a screen while the wizard is in the middle of walking a
correction down in careful steps, or is holding back because it doesn't yet
trust a bracketed dose range, the simple calculator has no idea any of that
caution exists — it would just compute a fresh number off the raw slope and
could tell you to jump further than the wizard is deliberately choosing not
to. If the tank is actually in an emergency and the wizard has decided to
close the whole gap right now, the simple calculator's cautious 10-15% would
instead tell you to under-react on a level that needs the full move.

**What already exists that could do this job.** Nothing in the app currently
cross-checks two dosing numbers against each other for the same element —
there's no existing referee to reuse; building one would be new work. And
digging into where the simple calculator's numbers actually show up today
turned up a surprise: in the two screens where you'd expect to see them (the
tank overview and the per-element detail view), the number is calculated and
then never actually put on screen — it's leftover, unused code. The one place
it genuinely does show up is a "here's what would change" preview that only
appears after a totally different, third check has already told you your
mixing strength looks wrong — and worryingly, that same preview path would
also happily offer a "corrected" magnesium dose based on drift readings,
which the chemistry spec is explicit should never happen — a magnesium dose
error takes months to years to even show up in test readings, so any number
built from a few weeks of magnesium readings is not measuring anything real.
That gap exists independently of which of the three options gets picked, and
needs fixing either way.

**Does this split into more than one question.** Yes — "which calculator
should do the maths" and "which calculator's answer should actually appear on
a screen" turn out to have different current answers. The wizard already does
all the real math, every time. But almost nowhere does the simpler
calculator's number reach a screen today anyway — so part of this isn't so
much "which engine wins" as "someone left a half-built feature lying around
and should decide on purpose whether to finish it, delete it, or fence it
in."

**The edge cases.** A brand-new tank has no dosing history for either
calculator to lean on, but the wizard still has its other seatbelts — a
ceiling on how fast it'll push a level, a cap on how big a single change can
be, a sanity check on whether a dose is even a plausible amount of liquid.
The simple calculator has none of those seatbelts, on a new tank or an old
one. If someone's mixing strength is entered wrong but still looks like a
believable number, neither calculator can tell — but only the wizard has any
chance of catching it later, once there's a real history of doses that went
up and doses that went down to compare against. Someone testing only once a
month may starve both calculators of enough readings, but which one copes
better with that wasn't fully checked here and shouldn't be assumed either
way.

**Leaning:** no call made here on purpose — that's the point of this
write-up. What is solid: the chemistry document is currently telling you the
wrong engine does something it doesn't do, and the magnesium gap in the
simple calculator needs a decision regardless of anything else in this
report.

**What would prove this wrong:** finding a fourth piece of code, not looked
at here, that actually does the flat-10%-a-day thing and is what the document
meant all along; finding that the "unused" screens actually do show this
number through some indirect wiring this pass didn't catch; or actually
running the app and the long-run simulator to see how often, and how badly,
any of this disagreement would matter on a real tank over months — none of
which was done here.

---

## Decision 2 — Are water changes excluded from the trend fit?

**kind:** design (the legacy spec answers a narrower question than the one in
front of us — see "splits into" — there is no published source that resolves
the live disagreement between the spec text and the current code's own
reasoning)

**what sources say:**

No hobby or vendor source frames this as a data-analysis question ("exclude
the disturbed reading from a regression window") the way the legacy spec
does. That framing is Tank Wizard's own, not the hobby's.

What does exist, generically, across BRS, salt-mix guidance, and manufacturer
pages: the standard hobby advice is "match your salt mix to your tank's
parameters" — the implicit claim being that a well-matched mix, at a normal
water-change fraction, does not move the number enough to worry about. This
is real consensus but qualitative; no source puts a number on "enough to
worry about" relative to a specific test kit's resolution.

Randy Holmes-Farley's writing describes water changes as a *replenishment*
mechanism for depleted elements, and separately notes magnesium dilutes
toward the salt mix's own value as freshwater top-off offsets salinity creep
from alkalinity/calcium dosing — supporting that a water change's effect is
real and salt-mix-relative, not zero, but not a citable number for a routine
10% change.

Published salt-mix parameter ranges (manufacturer marketing pages, cross-
checked across three brands) show real spread: Fritz ≈ 8.0–9.0 dKH /
400–450 ppm Ca / 1300–1400 ppm Mg; Red Sea Coral Pro ≈ 11.5–12.5 dKH /
450–480 ppm Ca / 1350–1430 ppm Mg; Tropic Marin Pro Reef ≈ 7 dKH / 440 ppm Ca
/ 1350 ppm Mg. Alkalinity varies by nearly 2x across common brands; calcium
and magnesium vary far less proportionally. Nothing more specific than "match
your salt" was found beyond this.

**options:**

- **(a) Keep the current code's approach for all three elements** — water
  changes stay fully in the trend fit, uncorrected, for alkalinity
  (`alkalinity.js` ~494-501), calcium (`calcium.js` ~273-278), and magnesium
  (no handling at all beyond the salinity-shift flag, `helpers.js` ~628-646).
  Reasoning: a routine water change is small (≈10%) and, per the arithmetic
  below, its shift is at or under each element's own kit-noise floor for a
  reasonably matched salt mix. Excluding it as a window boundary was tried
  for alkalinity and produced a worse failure — the assessment starved to one
  reading, answering "hold" on a tank that was visibly draining (the exact
  bug the comment at `alkalinity.js` ~494-501 names).

- **(b) Exclude water changes as window boundaries for calcium and magnesium
  too**, matching the legacy spec's literal text. Reasoning, checkable but
  almost certainly self-defeating: calcium is tested weekly and water changes
  are logged weekly; magnesium is tested every 21 days against the same
  weekly cadence. Treating a water change as a hard cutoff would very likely
  leave calcium with 0-1 readings after the most recent change, and would
  make it near-impossible for magnesium to ever accumulate 2 readings inside
  a window that resets weekly — the identical failure mode alkalinity's own
  comment names as the reason it rejected this approach.

- **(c) Keep water changes in the fit for all three, but subtract their known
  dilution effect mathematically** — the same pattern already used for
  logged corrections. This is **not new territory**: `src/lib/analytics/
  consumption.js`, function `computeElementConsumption` (lines 105-185),
  already implements exactly this — a mass-balance model that computes
  `f = litres / volumeL` for each logged water change and subtracts
  `f × (saltMixValue − levelAtThatMoment)` from the apparent trend, using a
  hardcoded salt-mix baseline (`SALT_MIX` in
  `src/lib/analytics/salt-baseline.js`: Aquaforest Reef Salt, alkalinity
  8.0 dKH / calcium 425 ppm / magnesium 1390 ppm). Each water-change record
  already carries the needed `litres` field. So the mechanism, the data
  field, and the baseline all already exist — but they live in the analytics
  layer (feeding `Dashboard.jsx`'s consumption panel and
  `corrected-strength.js`'s strength-preview tool), not in the three
  dosing-recommendation engines that actually decide a dose change. Building
  (c) into the dosing engines means either wiring in this existing model
  (risking the two layers disagreeing if not unified) or building a second,
  parallel dilution calculation.

**arithmetic** (hand-computed, NOT simulated, NOT measured — illustrative
only): shift ≈ (water-change fraction) × (salt-mix value − tank level at that
moment). Using a round 10% routine change against each element's
`STABILITY_RULES` noise floor (alkalinity 0.1 dKH, calcium 10 ppm, magnesium
30 ppm):

| Element | Well-matched scenario | Shift | vs. noise floor | Poorly-matched scenario (real brand figures) | Shift | vs. noise floor |
|---|---|---|---|---|---|---|
| Alkalinity | salt 8.5 (Fritz-like) vs. tank 9.0 | −0.05 dKH | 0.5× floor — invisible | Tropic Marin (~7.0) vs. tank 9.0 | −0.20 dKH | 2× floor |
| | | | | Red Sea Coral Pro (~12.0) vs. tank 9.0 | +0.30 dKH | 3× floor |
| Calcium | app's own SALT_MIX (425) vs. tank at band top (450) | −2.5 ppm | 0.25× floor | budget mix (~380) vs. tank at safe-bound edge (500) | −12 ppm | 1.2× floor |
| Magnesium | Fritz mid (1350) vs. tank mid (1325) | +2.5 ppm | <0.1× floor | low-end mix (~1200) vs. tank at band top (1400) | −20 ppm | 0.67× floor — still under |

Reading this: for a *matched* salt mix, all three elements sit well under
their own noise floor at a routine 10% change — the strongest checkable
support for option (a)'s reasoning, strongest for calcium and magnesium.
Alkalinity is the outlier: because common salt brands vary alkalinity by
nearly 2x while alkalinity's own noise floor is tightest proportionally, a
*mismatched* brand can push a routine 10% change to 2-3x the noise floor —
comparable to or exceeding the app's own "meaningful trend" language.
Magnesium never crosses its floor at 10% even in the worst plausible brand
mismatch found.

**wrong way, per option:**

- **(a):** a water change masquerading as consumption — most exposed for
  alkalinity when the salt mix is mismatched (up to 3x noise floor on a
  single change). Cost: a dose nudge that self-corrects within the next
  reading cycle (alkalinity retested every 2 days) — annoying, not
  dangerous, since bracketing and the step cap limit how far a bad reading
  moves the dose in one step.
- **(b):** the alkalinity failure recurring, but worse — calcium and
  magnesium are tested far less often, so "hold forever on a draining tank"
  would persist for a week (calcium) or three weeks (magnesium) before a
  human notices, not two days. This is the stress-coral direction.
- **(c):** risk shifts to the assumed salt-mix baseline. Since `SALT_MIX` is
  hardcoded to one product and Setup has no field to enter a different one,
  subtracting a wrong baseline injects a systematic bias — silently, the same
  way a wrong Setup strength does. If Dan's actual mix differs meaningfully
  from Aquaforest's midpoints, this option could make things worse than doing
  nothing, and in a way harder to notice, because the number now looks
  corrected rather than raw.

**already does this:** see option (c) above — `computeElementConsumption`
with `SALT_MIX` already performs a water-change-aware mass-balance
subtraction, consumed by `Dashboard.jsx` and `corrected-strength.js`, but not
by the dosing-recommendation engines. Confirmed by grep: none of
`assessAlkalinity`/`assessCalcium`/`assessMagnesium` import from
`consumption.js` or `salt-baseline.js`.

**must change with:**

- If (b) is taken for calcium/magnesium, the window-widening guard needs the
  same treatment alkalinity already has, but alkalinity's own widening does
  **not** currently reach back past a disturbance cutoff either — so (b)
  needs a *new* kind of widening that does not exist anywhere in the codebase
  today, for any element.
- If (c) is taken, `SALT_MIX` stops being a display-only baseline and becomes
  an input to a dose recommendation, raising its correctness bar to the same
  level as the Setup solution-strength value — and unlike solution strength,
  there is currently no Setup field to correct it if it's wrong for Dan's
  actual salt.
- Either (b) or (c), implemented only in the dosing engines without
  reconciling with `computeElementConsumption`, creates two different "what
  did this water change do to the trend" answers inside the same app.

**splits into:** two separable questions with plausibly different answers per
element:

1. *Should a water change be a hard boundary that restarts the trend window?*
   — already answered "no" for alkalinity, and the cadence argument above
   suggests "no" is even more clearly right for calcium and magnesium.
2. *Should a water change's dilution be estimated and subtracted from the
   readings that remain*, the way corrections already are? A weaker claim
   whose size depends entirely on how well-matched the salt is — alkalinity
   most exposed, magnesium least, per the arithmetic.

**edges:**

- **Brand-new tank, no water-change log**: `computeElementConsumption`'s
  dilution term needs `waterChanges` — with none logged, the contribution is
  0 and behaviour matches option (a). No option breaks here.
- **Monthly top-off-only regime**: removes the entire premise of this
  decision for that user — no weekly disturbance to exclude or subtract.
  Options converge.
- **A large one-off change (30-50%)**: the arithmetic scales linearly with
  fraction — a 40% change at the "poorly matched" alkalinity gap would shift
  the reading by ~1.2 dKH in one event, roughly the width of the entire
  target band. At that size, "leave it in the fit, it's negligible" stops
  holding — and the app currently has **no size threshold anywhere** that
  distinguishes a routine 10% change from a 40% one. This is a real gap
  regardless of which option is chosen.
- **A level sitting exactly on a safe bound**: this is where the calcium
  "poorly matched" arithmetic above (−12 ppm at the 500 ppm edge) actually
  exceeded the noise floor — the tank is furthest from most salt mixes'
  midpoint exactly when sitting at an extreme.

**leaning:** no single clean recommendation — the arithmetic and the
duplication finding point in different directions per sub-question. On
sub-question 1 (hard boundary), option (a) is best-supported for all three
elements: already validated for alkalinity by the "hold on a draining tank"
bug it was written to fix, and the cadence arithmetic says (b) would likely
reproduce that bug for calcium and worse for magnesium. On sub-question 2
(mathematical subtraction), the case is element-dependent: alkalinity is the
one element where a mismatched salt mix can push a routine 10% change to 2-3x
the noise floor, so it has the best-supported case for eventually doing
something like option (c) — but only with Dan's actual salt-mix figures, not
a generic default with no Setup field to override it. Calcium's case is much
weaker; magnesium's is weakest of all.

**would be wrong if:** option (a) would be wrong if Dan's actual salt mix has
a figure meaningfully different from his tank's target band — alkalinity is
most exposed to this by brand-to-brand variation. The "already does this job"
finding for option (c) would be wrong if `computeElementConsumption`'s
dilution term were broken or unused in practice — not checked beyond
confirming it exists, is imported by two consumers, and is covered by several
test files. All of this would be wrong if Dan's actual practice differs from
the seeded weekly-10L pattern — not checkable here, since `private/` does not
exist in this environment.

### In plain reef-speak

**What the old rulebook says, and what the app actually does.** The paperwork
for how this app used to work says water changes should be treated the same
as a manual correction — thrown out of the trend calculation entirely,
because they move the number without it meaning the coral used anything. The
code that's actually running today does something different for alkalinity
on purpose: it leaves water changes in the trend, and only throws out logged
corrections. The comment in the code explains why — when they tried throwing
out water changes too, a tank on weekly water changes only ever had one
usable reading between changes, and the app just sat there saying "hold" on
a tank that was visibly crashing. Calcium does the same thing, with its own
comment saying a well-matched routine water change is basically part of
normal behaviour. Magnesium doesn't even have that comment; it just doesn't
touch water changes at all, one way or the other.

**What's actually true about a water change's size.** Nobody in the hobby
publishes a hard number for "how much does a routine water change move my
numbers." The standard advice is just "match your salt to your tank,"
implying that if you do, it barely matters — real advice, but not a number.
Doing the arithmetic by hand: for a normal 10% water change with a reasonably
matched salt, alkalinity moves by about half a test-kit-increment, calcium by
a quarter of one, and magnesium by barely anything — all invisible against
kit noise, backing up what the code currently does. But swap in a mismatched
salt — and real brands really do vary this much, from about 7 dKH to about
12.5 dKH depending which one you buy — and that same routine 10% water change
on alkalinity can shift the reading by two to three test-kit-increments in
one go. Calcium can get close to a full increment in the worst realistic
case. Magnesium stays under the radar even then.

**The surprising thing found while checking this.** The app already has a
working version of "subtract what the water change added" — it's just not
connected to the part of the app that decides your dose. There's a separate
calculator (feeding the dashboard's consumption panel and the "what if I
change my mixing strength" tool) that already knows how many litres you
changed and already compares that against a built-in salt-brand baseline to
work out how much of a bump or dip came from the water rather than the coral.
It just isn't plugged into the actual dosing recommendation. So building
"subtract the water change mathematically" isn't starting from nothing — it's
deciding whether to reuse that existing calculator inside the dosing engine,
or accept having two separate water-change calculators quietly capable of
disagreeing with each other.

**Why "exclude water changes for calcium and magnesium too" is probably the
wrong fix even though it matches the old rulebook.** The reason it broke for
alkalinity — weekly water changes eating the whole trend window — gets
worse, not better, for calcium and magnesium, because they're tested less
often against the same weekly water changes. If a water change wiped the
slate every week, calcium would rarely have more than one reading to work
with, and magnesium might never accumulate two readings inside its own
window at all — the same "hold forever on a draining tank" bug, just slower
to notice, which makes it more dangerous, not less.

**The trade-off, plainly.** Leaving water changes in the trend risks a water
change occasionally getting mistaken for consumption, nudging the dose the
wrong way for a few days — mostly a nuisance, self-correcting quickly for
alkalinity. Excluding water changes as hard boundaries risks the app going
quiet on a tank that's actually drifting for a week or three weeks at a
stretch — the direction that actually stresses coral. Trying to
mathematically subtract the water change's effect risks getting it subtly
wrong if the built-in salt-brand assumption doesn't match what Dan actually
pours in — and there's currently nowhere in setup to tell the app what salt
he uses, so that risk is real and currently uncheckable.

**What this doesn't settle.** This is arithmetic done by hand against the
app's own numbers, not a measurement of Dan's actual tank — there's no real
tank data available to check this against here. Whether it's worth building
anything depends on how closely Dan's actual salt mix tracks his actual
target numbers, which only he can judge — and on alkalinity being the one
place the numbers say this is worth a second look, with calcium a much
weaker case and magnesium barely a case at all.

---

## Decision 3 — What happens when consumption comes out negative?

**what sources say:**

No primary source (BRS article, Randy Holmes-Farley column, manufacturer
literature) was found addressing this specific question — only forum threads,
several purporting to summarize Randy Holmes-Farley's reasoning secondhand
rather than citing him directly. Flagged as forum-level sourcing, not
authoritative. Within that limit, the threads converge on: gaining
alkalinity/calcium/magnesium without a dose increase is a recognized,
non-broken phenomenon, attributable to (1) a salt mix richer in that element
than the tank currently holds, most visible right after a water change;
(2) slow aragonite/sand-and-rock dissolution feeding alkalinity independent
of dosing; (3) nitrate reduction converting to alkalinity (~2.3 dKH per
50 ppm NO3 drop, per those threads); (4) a genuine drop in coral/bio demand.
No source describes a canonical "how to react to one high reading" protocol
beyond generic retest-before-acting advice. Net: negative consumption is not
always a broken input — sometimes it is the tank's real chemistry.

**options:**

- **(a) Status quo** — clamp `consumption`/`maintenanceDose` to 0, set
  `out.gaining`, continue into the normal hold/act branches. Basis: minimizes
  interruptions, consistent with how a single surprising reading is otherwise
  handled via `out.anomaly`/`out.caution` (flag, don't refuse) rather than via
  the `implausible` refuse pattern.
- **(b) Refuse** — when `consumption < 0`, short-circuit before the hold/act
  branches with an explicit `action: "implausible"`-style state naming bad
  reading / unlogged water change / wrong Setup strength, mirroring
  `strengthPlausible`/`dosePlausible`'s existing convention. Basis:
  structural consistency — the app already refuses on implausible
  strength/dose; a physically-impossible negative consumption is arguably the
  same class of problem getting quieter treatment today.
- **(c) Middle** — small negative (near each element's own already-published
  noise floor: `ALK_TREND.stable = 0.10` dKH/day, `CA_TREND.stable = 5`
  ppm/week, `MG_TREND.stable = 10` ppm/week) proceeds as now; large negative
  (clearly beyond what those floors could produce) flags/refuses. Basis:
  reuses each engine's own existing, already-defended noise-floor constant as
  the size cutoff rather than inventing a new threshold.

**arithmetic** (hand-computed against real constants, not simulated):

*Alkalinity.* `currentDose = 9.0` mL/day, `dkhPerMlPer100L = 0.05` (mid the
plausible strength range, matches the code's own comment "a soda-ash
two-part is around 0.05"), `volumeL = 72` → `effectPerMl = 0.05×100/72 =
0.0694` dKH/mL. `supplied = 9.0×0.0694 = 0.625` dKH/day. Measured
`trend = +0.90` dKH/day (well above `ALK_TREND.meaningful = 0.30`).
`consumption = 0.625 − 0.90 = −0.275` → `out.gaining = 0.275` dKH/day;
consumption and maintenanceDose forced to 0.

`doseDriftedFrom(0, 9.0, "alkalinity", …)`: `gap = |0−9.0|/9.0 = 1.00` (100%),
far exceeding both the 12% in-band and 6% out-of-band triggers. **Any
nonzero currentDose combined with a gaining-forced maintenanceDose=0 produces
a 100% gap, saturating the trigger instantly and unconditionally.**

`alkBandOf(0.90) = "significant"` — not "stable" — so the stable-hold branch
is unreachable on its band condition alone, on top of being defeated by the
100% gap above.

Taking current level = 7.5 dKH (below target band, inside the 7–11 dKH safe
bound so not flagged "unsafe"): `movingToTarget` is true (below range,
rising) but `|trend|=0.90 > meaningful=0.30`, so the "moving to target, hold"
branch also does not fire. Execution reaches the act block: `rawChange =
0 − 9.0 = −9.0`; `mag=9.0>4`; `urgent` true; `rescue` false (rising while
below range is the *right* direction, not an emergency pattern). `applied =
rawChange×0.7 = −6.3`. `next = max(0, round(9.0−6.3,1)) = 2.7`.

Bracketing: `consNow = 0.625 − 0.90 = −0.275 < 0`; the guard `!(consNow>0)`
discards every observation for both the bracket and its looser floor/ceiling
fallback. **Neither of the two independent bracket checks contributes
anything while gaining is in effect.** `capDoseStep`: level 7.5 is inside the
safe bound → `pct = 0.25` → `cap = 2.25` → `capped = max(6.75, 2.7) = 6.75`.

**Result: `action="decrease"`, `recommendedDose ≈ 6.75` mL/day (a 25% cut
from 9.0), `staged=true`, `gaining=0.275` dKH/day shown as "Tank is gaining
0.28 dKH/day."** No text anywhere in the pipeline says the underlying
arithmetic implied the tank manufactured alkalinity, or suggests checking a
reading, a water-change log, or the Setup strength.

*Calcium* (same structure): `currentDose=20` mL/day, `caPpmPerMlPer100L=0.36`,
`volumeL=200` → `effectPerMl=0.18` ppm/mL, `supplied=3.6` ppm/day.
`trend=+6.0` ppm/day (42 ppm/week, above `meaningful=20`).
`consumption=3.6−6.0=−2.4` → `gaining=2.4` ppm/day. `doseDriftedFrom` gap =
100% ≫ 30% trigger. Same downstream path: band "significant," hold
unreachable, bracketing inert, `capDoseStep` caps the cut to a 25% step (or a
full cut to 0 if the level is genuinely above the 500 ppm safe bound and
still rising).

*Magnesium* — the sharpest case: `currentDose=8` mL/day,
`mgPpmPerMlPer100L=0.012`, `volumeL=200` → `effectPerMl=0.006` ppm/mL,
`supplied=0.048` ppm/day — magnesium's daily dose typically supplies only
hundredths of a ppm/day. A `trendPerWeek=+9` ppm/week (`trendPerDay≈1.29`) —
**sitting below `MG_TREND.stable=10` ppm/week**, statistically
indistinguishable from test noise — already gives `consumption = 0.048 −
1.29 = −1.24` ppm/day, strongly negative. Unlike alkalinity/calcium,
`DOSE_DRIFT_TRIGGER.magnesium` is deliberately absent, so `doseDriftedFrom`
returns `false` unconditionally for magnesium — the 100%-gap short-circuit
that forces alkalinity/calcium into the act branch does **not** apply here.
With `band==="stable"` and `!worsening`, the hold branch fires cleanly:
**maintenanceDose stays 0, no dose action is recommended or taken, and the
only visible trace is the "Tank is gaining" row relabel.** This is the one
case in the whole system where gaining is genuinely, fully silent — a direct
consequence of magnesium's own "managed by level, not dose" design rather
than an oversight specific to gaining.

**wrong way:**

- **(a) status quo:** for alkalinity/calcium, most non-trivial gaining
  scenarios drive a real, staged ~25%-per-step dose CUT toward a level the
  arithmetic never actually diagnosed as excessive; if the true cause is a
  wrong Setup strength (the app's own named top risk), this recurs every
  reassessment, walking the dose toward zero over several cycles,
  unexplained. For magnesium, gaining is frequently held completely silently
  — a genuinely wrong reading or unlogged event just sits there relabeled,
  with no route to a "this looks wrong" message. Annoyance risk in this
  direction: none — nothing is surfaced to annoy.
- **(b) refuse:** chemistry risk from the refusal itself is nil *except* it
  also blocks the emergency/rescue paths that sit later in each function and
  would otherwise fire for a level genuinely at/past its safe bound and still
  rising — a hard refuse inserted at the clamp site runs before those checks
  and would suppress them (confirmed by code position). Annoyance risk: given
  gaining is sometimes legitimate, a hard refuse produces false "check setup"
  interruptions on ordinary weeks, risking the standard failure mode of
  over-alarming warning systems — training the user to dismiss the message.
- **(c) middle:** chemistry risk bounded by construction (only large, clearly-
  not-noise negatives interrupt); residual risk is calibration — a threshold
  set too high still misses real wrong-strength cases (demonstrated
  concretely below under "edges"). Annoyance risk lower than (b) but not
  zero.

**already does this:** `strengthPlausible` and `dosePlausible` already
implement exactly the refuse-and-name-the-cause *pattern* option (b) would
reuse (`out.action="implausible"`, `out.reason`, `out.nextCheck="Correct the
solution strength in Setup..."`, identical across all three files). Neither
function reads `out.consumption` or `out.trend` — **nothing currently checks
negative consumption itself** — so reuse would be of the messaging
convention, not an existing code path; duplication risk is low.

Separately: `bracketDose` is named in the handover notes as "the only check
on a wrong Setup strength" because it's purely empirical. Traced directly:
both `bracketDose` and its loose fallback compute `consNow = currentDose×
effectPerMl − trend` — the same formula that goes negative during gaining —
and discard every observation when it isn't positive. **Bracketing is
completely inert exactly when a gaining event is happening.**

Also: `out.gaining` **is** read in the UI — the per-element detail card
renders "Tank is gaining X/day" in place of "Tank is using X/day," with the
same visual weight as an ordinary data row (not exhaustively checked against
`out.caution`/`out.anomaly`'s distinguishing styling — worth a look at the
rendered screen).

**must change with:**

- `doseDriftedFrom`: forcing `maintenanceDose=0` while `currentDose>0` always
  yields a 100% gap, unconditionally tripping the trigger. Any change here
  has to decide what `doseDriftedFrom` sees instead of a hard zero — the real
  (unclamped, negative) value, `null`, or exempting gaining the way
  magnesium already structurally is.
- `bracketDose` / the floor-ceiling fallback: both inert during gaining. A new
  check has to be independent of bracketing, evaluated where
  `strengthPlausible`/`dosePlausible` already sit.
- The emergency/rescue branches sit *after* the clamp in file order. A
  refuse-and-return inserted at the clamp site would run before them and
  suppress a genuine emergency detection on a level at/past its safe bound —
  a concrete regression risk, confirmed by code position.

**splits into:** two separable questions: (1) is a negative-consumption
result ever a legitimate tank signal — sourced answer: sometimes yes; (2)
given an illegitimate or size-suspicious instance, should the *response* be
refuse vs. flag-louder-but-continue — a posture question the code currently
answers neither way. A third split: "should this stay silent" is not one
answer but three, one per element — alkalinity/calcium structurally cannot
stay silent (`doseDriftedFrom` forces the act branch), magnesium structurally
can (its drift check is a no-op). One uniform new rule would be changing
three different existing behaviours, not one.

**edges:**

- **Brand-new tank (2-3 readings):** a negative reading here is more likely
  artifact than signal — the app's existing thin-data guards already
  soften the narrative trust, though the raw arithmetic still runs
  underneath. Any size-based threshold (option c) needs to weigh evidence
  quantity, not just the figure's size.
- **Monthly magnesium vs. daily alkalinity:** magnesium's `supplied` is
  characteristically tiny relative to plausible weekly swings, so a single
  noisy monthly reading can push consumption negative with no corroborating
  data point for weeks; alkalinity's daily cadence gets many chances to
  average out one bad reading first. A flat rule across all three elements
  ignores this structural difference.
- **Level at a safe-bound edge while gaining:** a real risk for option (b) —
  refusing removes `recommendedDose` entirely at the moment a genuinely
  at-the-edge, rising tank most needs the rescue/cut logic that sits later in
  the same function.
- **Wrong-but-plausible Setup strength, worked concretely:** the accepted
  strength range for alkalinity is roughly 0.01–0.40. Take the real product
  value 0.05, mis-entered as 0.065 (+30%, comfortably inside range, passes
  `strengthPlausible` silently). `effectPerMl` is now 30% too high
  everywhere. If the tank's true trend is near flat (true consumption ≈0.20
  dKH/day, dose roughly matched), the inflated effect inflates `out.supplied`
  against an unchanged real trend near zero — consumption comes out
  *overstated*, not negative; the same inflated effect is then used to
  convert back to mL, so the two errors partly cancel in the mL figure and
  mostly show up as a biased `out.supplied` display and a biased
  `doseDriftedFrom` gap — never as a negative consumption. **Worked through
  honestly: this mechanism does not reliably catch the "wrong but plausible"
  strength case the routine specifically worries about.** It only catches
  strength errors severe enough, or tanks already close enough to zero net
  consumption, to be tipped past zero. This gives a concrete example for the
  spec's own claim that a wrong strength "makes every figure wrong in a way
  no test can catch" — the gaining-clamp is not that catch-all, and none of
  the three options here closes that broader gap.
- **How often this fires:** no measurement available — `private/` is absent
  from this checkout, and per the routine's instruction the simulator is not
  presented as evidence about current behaviour here. Reasoning only: for
  alkalinity/calcium, gaining requires trend to exceed a `supplied` figure
  that is typically well above the noise floor, so it should be uncommon
  except around real events (water changes, dose changes). For magnesium,
  `supplied` is characteristically so small that even a near-noise-floor
  trend triggers it — closer to routine than rare, structurally, though this
  remains reasoning from the mechanism, not a measured rate.

**leaning:** No basis for a recommendation — this needs Dan's judgement. What
the trace supports: current behaviour is not the uniform "clamp, relabel,
continue silently" Phase 4's note describes — it silently holds for
magnesium but actively drives real staged dose cuts for alkalinity/calcium in
most non-trivial gaining scenarios, and the app's one existing independent
cross-check (bracketing) goes blind at exactly the moment it would matter.
Refusing trades named chemistry risk (losing the rescue response at a
safe-bound edge) against named, sourced annoyance risk (flagging legitimate
gaining events as errors), and nothing available in this checkout settles
which risk dominates in practice.

**would be wrong if:** a refuse-style option is wrong if replaying it against
Dan's real tank history shows gaining is routine rather than rare — frequent
false "check setup" interruptions on ordinary weeks. A status-quo-preserving
option is wrong if that same replay shows a real wrong Setup strength or
unlogged event going uncaught for multiple weeks while the app either cut a
dose for the wrong reason or sat silent. Both falsifications require
`private/` data this checkout does not have.

### In plain reef-speak

**What the books say.** No proper source — Randy Holmes-Farley directly, or
Bulk Reef Supply — answers this. Forum threads (not authoritative, but the
best available) agree that a tank showing more alkalinity, calcium, or
magnesium than your dose can explain is not automatically a mistake. Real
causes exist: a fresh water change with a salt mix richer than your tank,
sand and rock slowly giving back alkalinity, a drop in nitrate turning into
alkalinity, or your corals simply pulling less out of the water for a while.
So "the tank is gaining" isn't always a red flag — sometimes it's just the
tank.

**The three options.** Right now: the app notices the arithmetic is
impossible, quietly treats the day's dose need as zero, labels the row
"gaining" instead of "using," and carries on as if that were an ordinary
result. Option two: stop dead the moment this happens, and tell you plainly —
"this doesn't add up, go check your last reading, your water-change log, or
your Setup strength" — the same way it already stops and says so when your
Setup strength or your dose looks physically impossible. Option three: let it
slide for a small gaining amount (about what your test kit's own wobble could
produce) but speak up for a big one that no ordinary noise could explain.

**Doing the sums by hand.** On an alkalinity tank dosing 9 mL a day of a
normal-strength two-part, that dose should be putting in about 0.625 dKH a
day. If a reading run shows alkalinity actually climbing 0.9 dKH a day — much
faster than the dose could explain — the app currently doesn't stop. It works
out that your dose looks 100% off from what the maths wants (a gap far past
the size that normally triggers a change), and because the level is climbing
fast rather than sitting quietly, it does NOT quietly hold — it walks
straight into its normal "change the dose" logic and comes out the other end
recommending roughly a 25% cut, from 9 mL down to about 6.75 mL a day, staged
over a few days. Nowhere in that recommendation does it say "by the way, the
tank appears to be making alkalinity out of nothing, which isn't possible —
you might want to check your last test or your Setup strength before
trusting this." It just looks like an ordinary dose cut. The one safety net
the app has for a wrong Setup strength — comparing doses where the level went
up against doses where it went down, and only trusting numbers between them
— turns out to switch itself off completely whenever this "gaining"
situation happens, for the same underlying reason the gaining happens in the
first place. So the app's own cross-check is blind at exactly the moment it's
needed. Calcium works out almost identically.

Magnesium is the interesting one. Because a typical magnesium dose only adds
a tiny sliver of ppm each day, it doesn't take much of a rise — even a rise
so small it's basically test-kit wobble — to make the sums go negative. And
because magnesium is deliberately never dose-corrected off small drifts,
this case sails straight past every safety check and just sits there, held,
quietly relabeled "gaining," with nothing said and nothing done. This is the
one true "totally silent" case in the whole app.

**Which way it hurts if wrong.** Leaving it as-is: for alkalinity and
calcium, a bad reading or a wrong bottle strength can quietly trigger a real,
unexplained dose cut, repeating every time you test until someone notices the
pattern — under-dosing rather than over-dosing, gentler but still
unexplained. For magnesium, a bad reading or genuine problem can just sit
there silently forever with no flag at all. Making it stop and ask every
time: no chemistry risk from stopping itself, except it also disables the
emergency dose-cut logic that would normally kick in for a tank genuinely
rising past the safe top of its range — so right when a tank needs an urgent
answer, refusing gives it nothing. And since gaining is sometimes completely
normal, a hard stop-and-ask every time risks becoming the boy who cried wolf.
The middle option only interrupts on genuinely large, clearly-not-noise
jumps, limiting both risks but not perfectly tuned either — it still misses
some real problems just below its size cutoff.

**What already exists.** The app already has a "stop and tell the user to
check Setup" behaviour, used today for an implausible bottle strength or an
absurd dose. It's the exact wording and shape a refuse-based fix for gaining
could reuse — but neither existing check looks at whether the tank is
gaining at all, so nothing currently catches this case; the wording pattern
exists, the trigger doesn't. Also worth knowing: the "gaining" figure IS
shown on screen today, just as an ordinary row that says "Tank is gaining"
instead of "Tank is using" — it's not hidden, but it doesn't look any
different from a normal result, no matter how strange the underlying number
is.

**What else would have to change.** The rule that decides "dose gap is too
big, change it" always fires 100% during a gaining event, because a
forced-zero maintenance number compared against any real dose looks
maximally wrong. So the two engines (alkalinity, calcium) get shoved toward
action every time, while magnesium — exempt from that particular rule by
design — sails through untouched. Fixing this properly means deciding what
that trigger should see instead of a hard zero, and being aware that the
app's rescue logic for a genuinely dangerous level sits further down the same
code, after the point where a "stop and ask" fix would sit — so a stop-and-
ask could accidentally swallow a real emergency if placed carelessly.

**Is this really one question.** No — it's at least two. First: is a
rising-too-fast reading ever legitimate on a real tank? (Sometimes, yes.)
Second, separately: when it isn't legitimate, should the app interrupt you,
or just say it louder while still giving you a recommendation? And a third
split fell out of tracing the actual code: "should this stay quiet" already
has three different real answers today, one per element, not one — so a
single new rule applied evenly to all three would be changing three
different behaviours at once, not fixing one.

**Where it bites hardest.** A brand-new tank with only two or three
readings: a weird jump here is more likely a fluke than a real trend, so
treat it more skeptically. Magnesium, tested once a month, can have one odd
reading dominate the whole picture for weeks — alkalinity, tested daily, gets
more chances to average a bad reading out. A tank sitting right on the edge
of safe with a fast rise: this is exactly where a hard "stop and ask" could
leave a tank without any guidance at the one moment it most needs an urgent
dose cut. And a very specific, realistic case worth seeing: entering a real
bottle's strength wrong by 30% — still well inside what the app considers a
sane bottle strength, so it sails through unflagged. On a tank whose real
consumption is healthy and positive, that 30% error does NOT show up as
"gaining" at all — it just quietly skews the daily-dose maths in the
background, invisibly, exactly the danger the app's own notes warn about. In
other words: this whole "gaining" mechanism only catches the wrong-strength
problem when it's severe enough, or the tank's real consumption is already
low enough, to tip the sum past zero. A milder wrong strength on an otherwise
healthy tank slips through completely untouched.

**No lean given.** This is a call about how much you want the app
interrupting you versus how much you're willing to let it quietly guess, and
no source or real data settles that here. Today's behaviour is not simply
"does nothing" — it silently sits on magnesium, but actively pushes a real,
unexplained dose cut on alkalinity and calcium in most cases, and its one
built-in cross-check against a wrong bottle strength switches itself off at
exactly the wrong moment. Whichever way you lean, you'd want to see it
checked against your own tank's history before trusting it — which isn't
possible here since your real data isn't loaded in this environment.

**What would prove a choice wrong.** A "stop and ask" approach is the wrong
call if, run against your real readings, it would have interrupted you on a
bunch of perfectly ordinary weeks. Leaving it as-is is the wrong call if, run
against your real readings, it would have let a real bad strength or bad
reading slide by uncaught for weeks. Either check needs your actual tank
history, which this session doesn't have access to.

---

## Decision 4 — Where does a correction finish?

**what sources say:**

No source — hobby or vendor — uses "middle third of the band," or any named
tolerance-zone concept, for where a correction should be considered done.
Search across Randy Holmes-Farley's reef-chemistry writing, BRS's dosing
guides and calculator pages, and general reef-tank dosing guides turned up
only the generic "dose to target, then resume maintenance dosing and retest
on your normal cadence" pattern — no edge/midpoint/zone distinction at all.
This is a design question. "Middle third" reads as an invented compromise
between "any point in band" and "exact midpoint," authored for this project,
not sourced from outside it.

One number IS sourced-by-code, not literature: the correction's numeric aim
point. `proposeCorrection` (`helpers.js:404`) computes `target = (def.min +
def.max) / 2` — dead centre of the band, a single point, unconditionally.
`legacy/protocol/correction-spec.txt` §2 confirms this exactly ("The MIDDLE
of the band, never the nearest edge") and gives the reasoning: correcting to
the edge leaves the tank "one bad week from being out again." A design
judgement, not a citation, but at least stated and checkable.

**The contradiction, quoted exactly, both sides:**

- `docs/spec/reef-chemistry-MERGED.md` §9, "Where a correction ends":
  "**Decided 13 Aug: the middle third of the band.** Not the nearest edge —
  normal drift would take it straight back out. Not judged by 'levelling off
  versus still climbing'..." — then, two sentences later, in the same
  subsection: "**`correction-done` exits only after two readings inside the
  band**, not one." (full band, not middle third)
- `docs/spec/wizard-states-MERGED.md` §4, "Where a correction ends":
  identical wording, same two-sentence adjacency.
- The running code, both places that matter: `proposeCorrection`'s target is
  `(def.min + def.max) / 2` — a point, not a zone. `correctionProgress`'s
  arrival test: `inBand = (v) => v >= def.min && v <= def.max; arrived =
  lastTwo.length >= 2 && lastTwo.every(r => inBand(r.value))`
  (`helpers.js:273-279`) — tests the **full band**, not a middle third.

Read closely, both merged documents are not choosing between "aim point" and
"arrival test" — they use "the middle third of the band" as the section
heading's decision line, then describe the exit condition, in the very same
subsection, in full-band terms. Whether the heading was meant to redescribe
the TARGET (which is already dead-centre, so "middle third" would be a
category error — a target is a point, not a zone) or the ARRIVAL test (which
is coded as full-band) cannot be resolved by reading harder — the text
asserts both a zone and a full-band exit condition, two sentences apart,
without acknowledging the two are different numbers. This is not a case
where the sourced answer sits between the two documents; it's a case where
one document contradicts itself while also not matching the code it purports
to describe.

**options** (for the ARRIVAL test only — the aim-point question is answered
by code today and treated separately below under "splits into"):

- **(a) Full band, as coded today.** Change nothing in code; treat "the
  middle third of the band" in both merged docs as a documentation error and
  correct or delete it. Basis: this is what `correctionProgress` has always
  computed, matches `legacy/protocol/correction-spec.txt` §6, and matches the
  merged docs' own very next sentence. No code change carries no new-bug risk.
- **(b) Literal middle third, as the heading in both merged docs states.**
  Narrow the arrival test to `lo = def.min + (def.max-def.min)/3, hi =
  def.max - (def.max-def.min)/3`. Basis: takes the "Decided 13 Aug" heading
  at face value, on the theory the full-band sentence is the actual error.
  Defensible only if someone can produce the reasoning behind the 13 Aug
  decision — none was found in either document; the "why" text argues
  against the nearest edge and against a levelling-off judgement, but never
  argues for one-third specifically over, say, one-half or one-quarter.
  That's a real gap: the fraction itself is unexplained.
- **(c) Per-element zone scaled to that element's own noise floor**, rather
  than a fixed fraction of band width. Basis: reuses a pattern the codebase
  already has (`STABILITY_RULES[def.key].noiseFloor`, used by `stalled`'s own
  per-element movement test) instead of inventing band-width arithmetic from
  nothing. The specific formula the routine proposed — "the smaller of
  middle-third or band-width-minus-2×noiseFloor" — turns out to be dead on
  arrival: for all three elements, band width minus 2×noiseFloor is LARGER
  than the middle third, so "the smaller of the two" is always the middle
  third (arithmetic below). That formula doesn't change anything from option
  (b) and should be discarded, not adopted, if the goal is a genuinely
  noise-anchored zone. An alternative construction, floated here and
  explicitly labelled a guess rather than sourced or code-derived: zone
  half-width = `max(band-width/3, 2×noiseFloor)` — never let the zone get
  narrower than twice the kit's noise floor. No basis for the multiplier "2"
  beyond "requiring the zone to be at least as wide as the noise band on
  both sides of a true reading."

**arithmetic** (hand-computed, against the real configured constants — not
simulated):

Band and noise-floor source: `src/lib/constants.js` `PARAM_DEFS` (alkalinity
min 8.5 max 9.5; calcium min 400 max 450; magnesium min 1250 max 1400) and
`STABILITY_RULES` (alkalinity noiseFloor 0.1 dKH; calcium 10 ppm; magnesium
30 ppm). Test cadence: alkalinity 2 days, calcium 7 days, magnesium 21 days.

| Element | Band width | Target (midpoint) | Middle-third zone width | Middle-third zone | Noise floor | Noise ÷ zone width |
|---|---|---|---|---|---|---|
| Alkalinity | 1.0 dKH | 9.0 dKH | 0.333 dKH | 8.833–9.167 dKH | 0.1 dKH | 30.0% |
| Calcium | 50 ppm | 425 ppm | 16.67 ppm | 416.7–433.3 ppm | 10 ppm | 60.0% |
| Magnesium | 150 ppm | 1325 ppm | 50 ppm | 1300–1350 ppm | 30 ppm | 60.0% |

Worth stating plainly because it cuts against the routine's framing: calcium
and magnesium have **identical** noise-to-zone ratios (60%), computed
independently. This is not a magnesium-only problem under option (b) —
calcium is exactly as noise-dominated in relative terms. What differs is
cadence: magnesium's 21-day interval means two confirming readings that both
need to land in a 50 ppm window can span 6+ weeks if the first attempt
misses; calcium's 7-day interval gets several tries in the same span.

Option (c)'s proposed formula, worked through: `band − 2×noise` gives 0.8
dKH (alkalinity), 30 ppm (calcium), 90 ppm (magnesium) — all **larger** than
the middle-third figures above, so "the smaller of the two" is the middle
third in all three cases. This formula collapses to plain middle-third and
should not be presented as a distinct option.

The alternative construction, `max(band/3, 2×noiseFloor)`: alkalinity
unchanged (0.333 dKH, 30.0%); calcium widens to 20 ppm (50.0%); magnesium
widens to 60 ppm (50.0%). Whether 50% is "wide enough" is not something
arithmetic alone can answer — no basis for calling 50% acceptable and 60% not;
both are a large fraction of a kit's stated resolution sitting inside a zone
that must be hit twice in a row.

Caveat applying to every row: `noiseFloor` in this codebase is documented as
"kit resolution" — the smallest change a test kit can be trusted to
distinguish from zero — not a stated measurement-error standard deviation.
Treating "noise ÷ zone width" as a literal miss-probability overstates a
precision this arithmetic doesn't have a model for; it is a legitimate
measure of how much of the zone's width sits inside the kit's blind spot, not
a calibrated probability of missing the zone by chance.

Separately, and out of scope for this decision but bearing on these numbers:
`reef-chemistry-MERGED.md` §2 records a 13 Aug decision to tighten
alkalinity's band from 1.0 to 0.6 dKH. `src/lib/constants.js` still has
alkalinity at 8.5–9.5 (1.0 dKH wide) — the code has not been updated to
match. If it is, alkalinity's arithmetic changes: middle third becomes 0.2
dKH, noise floor stays 0.1 dKH, ratio becomes 50% — no longer the outlier
low-noise case above. These numbers use the band the code actually runs
today; they would need rechecking if that separate contradiction is
resolved.

**wrong way:**

- **(a) full band, wrong in the loose direction:** `correction-done` can fire
  on two readings that barely scraped inside the band's outer edge. Ordinary
  drift then puts the tank back out within days, and the keeper sees "target
  reached" right before it isn't. Cost: a confusing status and possibly a
  second correction cycle starting sooner than needed. No overdose risk (see
  below). Wrong in the tight direction: none — this option can't be "too
  strict."
- **(b) literal middle third, wrong in the tight direction:** for calcium and
  magnesium, `arrived` may take a very long time to fire, or in a
  noise-heavy stretch, effectively never. What that actually costs, traced
  rather than assumed:
  - `passed` is computed completely independently of `arrived`
    (`helpers.js:316`: `passed = up ? latest.value >= plan.target :
    latest.value <= plan.target`) — ONE reading past the midpoint target,
    full stop.
  - `correction-done` fires on `cp.arrived || cp.passed`
    (`state.js:227`) — `passed` alone is sufficient, checked BEFORE
    `stalled`/`backwards` in branch order, so a plan can never get stuck
    showing "stalled" just because a narrower `arrived` never fires.
  - Once `correction-done` shows, `ReadingConfirmation.jsx` and
    `CorrectionPanel` both render a one-tap "Set dose to {returnDose}
    mL/day" action, gated on the STATE being `correction-done`, not on
    `arrived` specifically. So a stuck `arrived` does not keep the elevated
    dose running: `passed` gets the keeper to the "return to maintenance"
    button on its own.
  So Phase 4's conclusion holds under this closer read: a literal middle
  third does not create an overdose risk and does not trap the dose at an
  elevated level, because `passed` and `arrived` are independent OR
  conditions gating the same state. What it DOES cost, confirmed by reading
  the two call sites that branch on `cp.arrived` specifically: the
  celebratory, two-reading-confirmed wording ("Two readings inside your band
  confirm it") becomes rare for calcium and magnesium, and the app instead
  almost always uses the weaker, hedged wording ("has passed your target —
  stop pushing now... test again to confirm"). A real but modest cost — the
  app's most confident message becomes one Dan rarely sees for two of three
  elements, not a functional failure.
  One thing that could **not** be verified and is flagged rather than
  assumed either way: `wizard-states-MERGED.md` §4 claims "consumption does
  not re-baseline until [correction-done] clears." A grep of
  `src/lib/analytics/consumption.js`, `demand.js`, and every other analytics
  file for any reference to corrections, plans, or `arrived` found none. If
  this mechanism exists somewhere unfound, and is gated on `arrived`
  specifically rather than on `correction-done` (which fires via `passed`
  too), a stuck `arrived` under option (b) would leave post-correction
  readings excluded from consumption calculations indefinitely for calcium
  and magnesium — a real cost, not a cosmetic one. No evidence either way; not
  willing to guess which is true.
  Wrong in the loose direction: none — a middle-third zone is by
  construction never looser than full-band.
- **(c) noise-scaled zone:** same shape of risk as (b) but smaller in degree
  (50% noise ratio for Ca/Mg instead of 60%, unchanged for alkalinity). Same
  "modest wording cost, not functional" conclusion, same unresolved
  re-baseline question.

**already does this:** the noise-floor-scaling PATTERN — not this specific
job — already exists: `STABILITY_RULES[def.key].noiseFloor` is used today by
`stalled`'s movement test (`helpers.js:304-305`, `movedSoFar < noiseFloor`).
Option (c) reuses that existing table rather than inventing a new one; option
(b) does not reuse anything. A grep for "third" and "/ 3" across
`src/lib/dosing/*.js` found no existing middle-third or band-fraction logic
anywhere — this would be new code under either (b) or (c).

**must change with:** whether narrowing `arrived` (options b/c) would
contradict `stalled`'s own noise-floor test was checked and does **not**
actually arise under today's numbers, checkable arithmetic, not a guess: a
correction plan only starts when the level is OUTSIDE the full band. To
reach ANY middle-third zone from outside the full band requires moving at
least band-width/3 (the zone's own half-width from the nearest edge).
Band-width/3 exceeds each element's noiseFloor today: 0.333 > 0.1
(alkalinity, 3.3×), 16.67 > 10 (calcium, 1.67×), 50 > 30 (magnesium, 1.67×).
So whenever `arrived` can fire under a literal middle third, `movedSoFar` has
necessarily already exceeded `noiseFloor`, meaning `stalled`'s
`movedSoFar < noiseFloor` is necessarily false at that moment. The two flags
cannot both be true for a plan reaching the zone, given today's constants.
Separately, the branch order already checks `correction-done` before
`correction-stalled`, so even if both flags were internally true, the user
would only ever see "done." What DOES need watching if (b) or (c) is
adopted: the margins above (3.3× for alkalinity, 1.67× for calcium and
magnesium) are not large. If magnesium's noise floor were later revised
upward, or its band narrowed, the "cannot both be true" guarantee could stop
holding.

**splits into:** three questions wearing one name, and the merged docs'
self-contradiction is a symptom of running them together:

1. **What should the correction's numeric AIM POINT be** — midpoint, some
   other point? Already has a clear, checkable, code-and-legacy-doc-sourced
   answer: dead centre, unchanged since `correction-spec.txt` and unchanged
   in code today. Nothing in this decision touches it. "Middle third" cannot
   sensibly describe a target — a target is a point.
2. **What should the ARRIVAL/EXIT test be** — full band, or some narrower
   zone? The actual subject of options (a)/(b)/(c) above.
3. **Should the two confirming readings be required a minimum interval
   apart?** Neither merged doc nor the code addresses this.
   `lastTwo = rows.slice(-2)` takes whatever the two most recent readings
   are, with no minimum spacing — two readings logged the same day would
   satisfy `arrived` exactly as two readings a week apart would. No reasoning
   found anywhere for or against this being a problem. A distinct question,
   untouched by any option above — no basis for a recommendation on it here.

**edges:**

- **Alkalinity:** tested every 2 days, and the noise-to-zone ratio (30%, or
  50% if the band is later tightened to 0.6 per the unresolved §2
  contradiction) is the least noise-dominated of the three under any option.
  All three options behave similarly here in practice — this is the edge
  case where the whole question matters least.
- **Calcium:** intermediate on cadence (7 days) but NOT intermediate on
  noise-to-zone ratio — it matches magnesium's 60% exactly under option (b).
  Only cadence separates them, arithmetically they're identical.
- **Magnesium:** the stated problem case. 21-day cadence means two confirming
  readings, if the first attempt misses the zone, can be 6+ weeks apart.
  Under (b) this plausibly makes the "two readings confirm it" wording
  rare-to-absent, though `passed` still closes the correction on schedule.
- **A plan started right at the edge of the safe bound** (not just outside
  the target band): none of the three options change `proposeCorrection`'s
  eligibility test, so this edge doesn't interact with the arrival-zone
  question — already handled separately by emergency/safe-bounds logic ahead
  of any correction-progress wording.
- **Overshoot before two confirming readings land:** already handled
  independently by `passed` under all three options — precisely the scenario
  `passed` was added to cover (the calcium-702-ppm and alkalinity-to-zero
  incidents `correction-spec.txt` §6 cites). No option changes that.
- **Brand-new tank / monthly-cadence tester:** not specifically probed by
  this arithmetic; flagged as untested rather than asserted either way.

**leaning:** No basis for choosing between (a), (b) and (c) — this is
squarely a design question with a self-contradicting spec and no outside
source to settle it. What the arithmetic DOES settle, and should go in front
of Dan plainly: the specific "smaller of middle-third or band-minus-2×noise"
formula in the routine's brief is not a real third option under today's
constants — it equals middle-third for all three elements — so a genuine
choice is between (a) full band and something like (b)/the alternative
noise-widened construction, not between three meaningfully different
formulas. And regardless of which is chosen, the merged docs' internal
contradiction (middle-third heading, full-band sentence, same subsection,
twice) needs fixing in the documentation either way — that's not a design
call, it's a proofreading one.

**would be wrong if:**

- (a) would be wrong if Dan's actual reading history (once `private/`
  exists) shows corrections repeatedly being called "done" right at the
  band's outer edge, followed by the tank falling back out within days —
  the exact failure the 13 Aug decision's stated reasoning describes. Not
  checkable now.
- (b)/(c) would be wrong if the "consumption does not re-baseline until it
  clears" mechanism is located, confirmed to gate on `arrived` rather than
  on `correction-done`, and confirmed to matter for calcium/magnesium's
  demand tracking — that would turn the "modest wording cost" finding above
  into a real functional cost and should reopen this decision.
- The "cannot both be true" finding under "must change with" would be wrong
  if either noiseFloor or the band width for calcium or magnesium changes
  such that band-width/3 no longer exceeds noiseFloor — currently a 1.67×
  margin for both, the thinnest of the three elements.

### In plain reef-speak

What this is about: three places in the project disagree about exactly when
a correction should be declared finished — the middle of the range, or
somewhere narrower than that. Nobody outside the project says either one; the
usual BRS-style dosing guides only say "dose to target, then go back to your
maintenance dose and test on your normal schedule." So this is a call
somebody on this project made, not something borrowed from the hobby.

Where the numbers actually stand today, plain terms:

- The number the app aims a correction AT is already dead centre of your
  range — for alkalinity that's 9.0, calcium 425, magnesium 1325 — and
  nobody's proposing to change that.
- The test for when a correction is DONE is currently "did the last two
  readings land anywhere inside the range" — the whole range, edge to edge.
  That's what the code does today.
- Two of the written documents have a heading that says the done-test should
  instead be "only if it lands in the middle third of the range" — a
  noticeably narrower target — but then, two sentences later, the same
  document describes the done-test using the WHOLE range again. It's arguing
  with itself in the same paragraph, and matches neither reading
  consistently.

Doing the arithmetic on what "middle third" would actually mean for each of
your three elements, using your real configured ranges and your kit's own
noise allowance:

- Alkalinity: your range is a full point wide (8.5–9.5), so a middle third
  is about a third of a point wide (8.83–9.17), and your kit's noise floor
  (0.1 dKH) eats up about 30% of that width. Manageable — a third of a dKH is
  still comfortably bigger than what your kit can't tell apart.
- Calcium: your 50 ppm range gives a middle third of about 17 ppm, and your
  kit's noise floor (10 ppm) eats up 60% of that. More than half the target
  zone is inside the kit's blind spot.
- Magnesium: your 150 ppm range gives a middle third of 50 ppm, and the
  30 ppm magnesium noise floor eats up exactly the same 60%.

That last point matters: calcium and magnesium turn out to be equally
noise-heavy under a literal middle-third rule — this isn't only a magnesium
problem, even though magnesium is the one that gets tested only every three
weeks, which is what makes waiting for two clean readings in a row painfully
slow for that element specifically. Calcium gets tested weekly, so it gets
more chances to get lucky even though each individual chance is just as
noisy.

The "smarter, scale it to the noise" version of the rule, checked with your
real numbers, turns out not to actually change anything — it just gives back
the plain middle third for all three elements. A version that genuinely does
something different — never let the zone get narrower than twice the noise
floor — would ease calcium and magnesium's noise share from 60% down to 50%.
Whether 50% is good enough is a judgement call, not something arithmetic
settles.

Now the part that actually matters for whether any of this is dangerous:
does a correction that's too strict about calling itself "done" leave the
elevated dose running too long? Traced through the actual code rather than
assumed: the answer is no. There's a second, separate test — "has the level
gone past the target at all, even in one reading" — that works completely on
its own, doesn't care about the narrow zone, and is what shows the button to
return to your normal dose. So even in the worst case, where the tight
middle-third zone almost never gets hit twice in a row for magnesium, you
still get told to go back to maintenance dosing as soon as the level passes
your target. What you lose is only the nicer, more confident wording ("two
readings confirm it") — you'd more often see the weaker wording ("it's
passed target, stop pushing, but test again to be sure"). A real but small
cost, not a safety issue.

One thing worth being upfront about rather than guessing: one of the
documents claims that the app holds off recalculating your tank's
consumption rate until a correction is fully confirmed done. A search of the
code that does those calculations found no trace of that behaviour anywhere.
If it exists and is tied specifically to the strict two-readings-in-a-narrow-
zone test, then a stuck "not quite confirmed" status WOULD have a real cost
for calcium and magnesium — your consumption numbers would sit stale for a
long time. This can't be confirmed either way here.

Also checked whether tightening the done-test would fight with another rule
already in the app — the one that flags a correction as "not really moving,
might be noise" using each element's own noise allowance. It can't happen,
currently: reaching even the narrower middle-third zone from outside your
range always requires moving further than that noise allowance allows, for
all three elements. So the two rules don't currently contradict each other —
though the safety margin for calcium and magnesium is thinner than for
alkalinity, so this isn't a permanent guarantee if either number changes
later.

This turns out to be three separate questions tangled into one, which is
likely why the documents contradict themselves: (1) where the correction
aims — already settled, dead centre, untouched by any of this; (2) how
strict the "you've arrived" test should be — the actual open question here;
(3) whether the two confirming readings should have to be some minimum
number of days apart, which nothing in the app currently checks at all.

No call is made here between "keep the whole-range test" and "tighten it to
the middle third" (or some noise-scaled version) — there's no outside source
and no simulation run for this specific piece, and this is exactly the kind
of call that should stay with Dan. What can be said plainly: the documents
currently contradict themselves in the same paragraph and that needs fixing
regardless of which way this lands, and the "smarter, noise-scaled" formula
as specifically proposed doesn't actually do anything different from the
plain middle-third rule — so the real choice is between today's full-range
test and a genuinely tighter one, not between three meaningfully different
options.

---

## Decision 5 — Bracket memory: 45 days flat, or 30/60 per element?

**kind:** design, per-item (see "splits into" — this question was presented
as one 13-Aug decision but is actually two independent design questions with
no published answer to either)

**what sources say:**

No hobby or vendor source addresses this question at all, and it is unlikely
one exists — it is a statistics/control-systems question about how long a
past dose-response observation stays representative of a tank's *current*
state, not a chemistry question. A search for reef-hobby guidance on this
returned nothing on point: BRS/Reefco/Top Shelf material (already cited in
`helpers.js` for the *step cap*) addresses how big a single dose change
should be, and generic advice says "retest every few months as demand
rises," but nothing addresses how long a specific historical dose/response
pair should remain admissible evidence for bracketing, nor whether that
window should differ by element. Treated as a design question, full stop —
no tangential citation reached for.

**options:**

- **(a) Keep the flat 45-day window (status quo).** Matches
  `BRACKET_MEMORY_DAYS = 45` (`helpers.js:85`), and both legacy specs
  verbatim. Basis: the code comment at `helpers.js:62-84` states the
  day-count exists only "to stop something absurd" — the 25% consumption-
  similarity filter in `bracketDose` (`helpers.js:141`) is described there as
  the actual defence against staleness, tank-state-aware rather than
  calendar-aware.
- **(b) Build the 30-day-alkalinity / 60-day-calcium split** as recorded in
  `reef-chemistry-MERGED.md` §8.1, deciding magnesium separately (documented
  gap — see below). Basis as stated in the merged doc: "roughly two settle
  windows each." This basis does **not** check out arithmetically against the
  real `settleWindow` formula — see "arithmetic."
- **(c) Build the "widen never narrow" directional rule** (old observations
  may only expand the bracket's low/high, never pull it in) instead of, or
  alongside, a day-count change. Basis stated in the merged doc: the flat 25%
  consumption filter is "circular" and is the actual mechanism causing the
  failure mode described. Traced against the real code (see "already does
  this"), this basis is **not confirmed as stated** either — worked examples
  below show the opposite of what the doc claims in the two scenarios that
  could be constructed. That doesn't mean the underlying worry is groundless,
  only that the stated mechanism doesn't reproduce cleanly from
  `consNow = currentDose × effectPerMl − currentRate`.

**arithmetic** (hand-computed, against real constants):

*Growth-drift vs. the 25% filter* — the number the routine says should
largely settle option (a) vs (b) on the day-count sub-question alone.
Compounding a steady annual growth rate `g` continuously: drift over `d`
days = `exp(ln(1+g) × d/365) − 1`.

| annual demand growth | drift at 45 days | drift at 90 days |
|---|---|---|
| 30%/yr | 3.29% | 6.68% |
| 60%/yr (the figure already in the `helpers.js:78` comment) | 5.97% ≈ "6%" as stated | 12.29% ≈ "12%" as stated |

The existing code comment's own figures (6% at 45 days, 12% at 90 days, for
60%/yr growth) check out exactly against this formula. Both far short of the
25% consumption-similarity threshold.

Inverting the question — what steady annual growth rate would it take for the
25% filter itself to bind, from smooth exponential growth alone: to hit 25%
drift by day 45, **~511%/yr** (demand more than sextupling in a year); to hit
25% drift by day 90, **~147%/yr** (demand roughly 2.5×ing in a year). Both far
outside anything a reef tank does through steady growth. This confirms the
merged doc's own line, "beyond about 90 days the drift starts to exceed what
the coherence filter tolerates anyway," checked precisely rather than merely
plausible.

**Caveat:** this arithmetic models *smooth* exponential growth. A step change
— adding a tray of new SPS frags in one weekend — is not smooth, and the 25%
filter reacts to the measured rate change regardless, independent of window
length; this arithmetic doesn't cover that case (see "edges").

*"Two settle windows" claim for the 30/60 split*, checked against
`settleWindow` (floor/ceiling: alkalinity 2-5 days, calcium and magnesium
7-30 days, scaled inside those clamps by kit noise and daily supply):

- Alkalinity, two settle windows: 2×(2 to 5) = **4 to 10 days.** The proposed
  30 days is **3×–7.5× longer** than what "two settle windows" actually
  produces for alkalinity under the real formula. The stated justification
  does not hold arithmetically.
- Calcium, two settle windows: 2×(7 to 30) = **14 to 60 days.** 60 sits at
  the very top of that range — true only for the slowest-consuming tanks. For
  a typical or fast-consuming tank, "two settle windows" would be 14-30 days,
  not 60.

The 30/60 figures are not consistently derivable from "two settle windows"
as claimed — alkalinity's figure is arithmetically wrong by a wide margin,
and calcium's only holds at the slow extreme.

*Magnesium, the undocumented gap:* magnesium shares calcium's exact
settle-window formula — the code only branches on `paramKey === "alkalinity"`,
everything else gets the same 7-30 day range. If the merged doc's own stated
logic were applied consistently, magnesium would land on the same ~60-day
figure as calcium. Its absence from the "30/60" pair reads as an oversight in
the merged draft rather than a considered decision to leave it at 45 —
nothing in §8.1 or elsewhere states a reason to treat magnesium differently.

**wrong way:**

- **(a) flat 45, too short in principle:** if a growing tank's demand
  outpaces the window, dose stays low, level drifts down and out of band —
  coral stress. The arithmetic above says this doesn't actually happen from
  smooth growth at 45 days; it would take a near-sextupling of demand in well
  under a year.
- **(a) flat 45, too long in principle:** an old observation from a
  *materially different* tank state (post-livestock-crash, post-large-frag-
  addition, or before a solution-strength correction) sits inside the window
  and pollutes today's bracket. The 25% filter is supposed to catch this
  regardless of day count — if it does its job, the day-count length is
  nearly moot in this direction too, for smooth drift. It is not moot for
  step changes.
- **(b) 30/60 split, if built without re-deriving the figures:**
  alkalinity's proposed 30 days is 3-7.5× the "two settle windows" basis
  actually supports — an unexplained, uncorrected 30-day figure risks being
  *too short* for slower-consuming tanks, degrading to a bracket-of-one —
  exactly the "calcium barely one usable observation" failure the merged doc
  says it's fixing, just relocated to alkalinity.
- **(c) widen-never-narrow, if the "circular" premise is wrong or only
  partly right:** building a new directional mechanism to fix a described
  failure that the existing filter, worked through by hand, appears to
  already avoid in the scenarios constructed, risks solving a problem that
  doesn't reproduce as stated — while leaving unaddressed whatever the *real*
  failure mode is (see "already does this," the dose/rate timing-mismatch
  scenario).

The lopsided read: for options (a) and (b), the *day-count* sub-question is
low-stakes under the arithmetic above — 45 days is comfortably inside the
filter's tolerance for any growth rate a real reef tank produces smoothly.
The *directional* sub-question (c) is the one with real teeth, because a
stale bracket wrongly vetoing a warranted increase is a live category of harm
(documented precedent in the code's own comment: "held one at 8 mL for
seventeen days while alkalinity fell 9.0 to 4.9") — but whether the fix as
described actually targets the true mechanism is unconfirmed.

**already does this:** checked precisely by tracing `bracketDose`'s formula
with concrete numbers. `consNow = currentDose × effectPerMl − currentRate`.
Because `currentRate` is *subtracted*, a falling level (`currentRate < 0`)
always makes `consNow` *larger* than `currentDose × effectPerMl`, never
smaller — a structural fact of the formula, not scenario-dependent. An
under-dosed, falling tank cannot produce an "understated" `consNow` through
this formula. That is the opposite of the merged doc's literal claim ("a
tank under-dosed for weeks has an understated 'current consumption'").

Worked example (alkalinity, `effectPerMl = 0.1` dKH/mL/day):

- Old, healthy observation (60+ days back, tank in equilibrium): dose 10 mL,
  rate 0.0 → `consThen = 1.0 − 0.0 = 1.0`.
- Now (dose still 10 mL, tank under-dosed for weeks, falling at −0.3
  dKH/day): `consNow = 1.0 − (−0.3) = 1.3`.
- Ratio: `1.3 / 1.0 = 1.30`, **exceeds** the 1.25 threshold → the old
  observation is **discarded**, correctly, because the tank's true demand has
  grown and the filter recognizes it.

Second worked example, the specific failure the merged doc worries about —
an old "rose" observation capping a needed increase:

- Old observation: dose 10 mL, rate +0.2 (rising, matched the lower demand of
  that period) → `consThen = 1.0 − 0.2 = 0.8`.
- Now: dose still 10 mL, falling at −0.3 → `consNow = 1.3`.
- Ratio: `1.3 / 0.8 = 1.625`, **exceeds** 1.25 → also discarded.

In both constructions, the existing 25% filter discards the stale
observation that would have wrongly narrowed the bracket, which is what the
merged doc says it fails to do. The "keeps the misleading data, discards the
honest data" failure could not be reproduced with this formula.

A genuine mismatch not addressed anywhere else: if a dose was **just**
changed (e.g., raised today from 10→14 mL to catch up on demand),
`out.currentDose` reflects the new figure immediately but `out.trendPerDay`
still reflects the *old* dose's decline until enough new readings accumulate.
`consNow` then mixes a dose and a rate from two different periods —
`14 × 0.1 − (−0.3) = 1.7`, a hybrid that doesn't describe any real, single
tank-state. This could produce spurious discards (or spurious keeps) in the
window immediately after a dose change, in either direction. A plausible
candidate for what the merged doc is gesturing at, but not the mechanism it
describes, and not traced further here (would need either a scratch
simulation copied out of the repo, or a replay against Dan's real dose-change
history — neither run for this pass).

**Net finding:** the code's own claim that the 25% consumption filter is the
real defence against staleness, and the day-count is a blunt backstop, holds
up under both the growth-drift arithmetic and the two worked bracket
examples above. Building the 30/60 day-count split may be tuning a mechanism
that is already close to redundant for the failure mode described. The
"widen-never-narrow" idea targets a real *category* of harm (documented
precedent exists), but the specific circularity argument offered for it does
not reproduce from the formula as traced — possibly the timing-mismatch
case above, possibly something else — before concluding what to build.

**must change with:**

- If (b) is built: the `helpers.js:62-84` comment block, which cites 21→45
  day simulation results ("mean dose error 14% at 21 days, 10% at 35, 8% at
  45"), would need re-running per element — those numbers were measured for
  a flat window, not validated for split values, and the "two settle
  windows" derivation shown above does not hold as stated.
- If (c) is built: `bracketDose`'s selection logic (highest dose that fell /
  lowest dose that rose) has no concept of an observation's age today. Making
  old observations widen-only would require, conceptually, computing the
  bracket from *fresh* observations first, then separately checking whether
  any *older*, filtered-out observation would extend `low` further down or
  `high` further up — never letting an old observation pull `low` up or
  `high` down past what fresh data supports. That is a different shape of
  function, not a parameter tweak: candidate observations would need an age
  (or "is this fresh" boolean) that gates only the *narrowing* direction, and
  `out.bracket = { low, high, from: next }` plus the parallel
  `bracketFloor`/`bracketCeiling` weaker-fallback path would both need the
  same age-aware logic, or they'd disagree with each other.
- The merged doc's third stated change, **"never veto silently"** (§8.1,
  third bullet), is a UI/messaging change, not a bracket-math change, and is
  unbuilt regardless of which of (a)/(b)/(c) is chosen on the memory-window
  question — it pairs with all three, not specifically with any one.

**splits into:** two separate questions currently sharing one "Decided 13
Aug" label in §8.1:

1. **Should the memory window be flat 45 days or per-element (30/60)?**
   Low-stakes under the arithmetic above — 45 days is comfortably inside the
   25% filter's tolerance for realistic smooth growth, and the "two settle
   windows" derivation for 30/60 doesn't check out as stated. This
   sub-question looks close to already answered by the existing code's own
   reasoning.
2. **Should there be a directional widen-never-narrow rule?** Higher-stakes —
   targets a real, previously-documented category of harm — but the specific
   mechanism offered to justify it did not reproduce in the worked traces, so
   what exactly needs building, and whether the existing filter already
   covers most of the ground, is unresolved and needs a sharper diagnosis
   (most likely via the dose/rate timing-mismatch case, or via a
   scratch-copied simulation/real-data replay) before design work starts.

These can be decided independently — nothing about answering (2) requires
touching the day-count, and vice versa.

**edges:**

- **Brand-new tank, no dose history:** `bracketDose` requires ≥2 observations
  and returns `null` below that. Checked `applyDoseConstraints`: when
  `obs.length === 0`, *neither* the bracket branch nor the weaker
  floor/ceiling fallback branch executes — nothing runs, no message is set.
  `strengthPlausible`/`dosePlausible` only catch an *implausible* strength or
  dose figure, not a *wrong-but-plausible* one. The merged doc's own line —
  "A tank with no dose history has no bracket, so the arithmetic runs
  unchecked... the app should say so" — is **not currently implemented** for
  this specific case, confirmed by reading the code path, independent of
  which memory-window option is chosen. A real, separate gap from the
  45-vs-30/60 question that survives regardless of which option is picked.
- **One dose change ever:** structurally the same as above — one observation
  never clears the `< 2` guard, bracketing is unavailable regardless of
  whether the window is 45, 30, or 60 days.
- **Demand doubling in under 45 days (heavy new frags, fast SPS growth):**
  this is a *step* change, not smooth compounding, so the growth-drift
  arithmetic above doesn't directly apply. If it happened smoothly over 45
  days that's a >600%/yr annualized rate — arithmetic says the 25% filter
  would catch it easily. If it happened as a sudden jump, the filter reacts
  on the next reading regardless of the 45/30/60 question, because it
  compares *today's* implied consumption against the historical observation
  directly, not against a smoothed trend. This is a case where the
  *directional* rule (c) is more relevant, since a stale "rose at X mL"
  bracket from before the frag addition is exactly the kind of thing that
  could wrongly cap a now-needed increase.
- **Testing monthly instead of on cadence:** doesn't change this specific
  analysis much — `doseObservations` only requires ≥2 readings per
  dose-change window, and a monthly tester on a 45-day window may or may not
  clear that depending on how dose changes line up with test dates. Worth
  noting but not decisive here.
- **`private/` real-tank data:** absent from this repo entirely. Per the
  routine's own rule, this check could not be run; nothing here should be
  read as validated against Dan's actual tank.

**leaning:** No basis for a single confident recommendation across both
sub-questions — they should be decided separately, and one of them (the
day-count split) currently looks like it may not need building at all under
the arithmetic above, while the other (widen-never-narrow) looks worth
pursuing in principle but its stated justification needs re-derivation
before code gets written against it. Per sub-question:

- **Day-count (45 vs 30/60):** leans toward (a), keep flat 45, on the
  arithmetic — but not confident enough to call "decided"; would be
  strengthened by re-running the 36×3-year simulation the current 45-day
  figure is based on, this time also generating the golden-suite failures a
  30-day alkalinity window would produce for slow, steady tanks, and by
  correcting or removing the "roughly two settle windows" line in §8.1
  either way, since it does not hold arithmetically as written.
- **Directional rule (widen-never-narrow):** no basis for a lean toward
  "build it as specified" — the specific circularity argument used to
  justify it doesn't reproduce from the code. There is enough documented
  precedent to say the underlying worry is not invented, but what exactly is
  broken needs a sharper trace (the dose/rate timing-mismatch hypothesis
  above is the most concrete lead) before a design is chosen.

**would be wrong if:** the day-count lean toward (a) would be wrong if a
scratch-copied simulation (never against `legacy/`) or a replay against
Dan's real dosing history (once `private/` exists) showed the 25% filter
routinely failing to discard genuinely stale observations in practice — in
which case the day-count becomes the more load-bearing guard after all and
the split, correctly re-derived, would matter. The "already does this"
finding for the directional rule would be wrong if a scenario Dan can
construct from his own dosing history (a real instance of an old observation
vetoing a needed increase, with the actual numbers) doesn't match either of
the two worked traces above — that would mean there's a code path not found
here, and the merged doc's instinct was right even though its stated
mechanism wasn't.

### In plain reef-speak

**What the books say:** nothing. This isn't really a chemistry question —
it's "how long should we trust an old test of what a tank did at a given dose
before deciding it no longer applies." Nobody in the hobby writes about that;
it's closer to a statistics question, and it should be treated as one, not
dressed up with a citation that doesn't really fit.

**The three ideas on the table:**

- **Keep it as it is today** — any dose-and-response pairing older than 45
  days gets thrown out automatically, same for alkalinity, calcium and
  magnesium. But there's already a second, arguably stronger check running
  underneath: any old pairing, however recent, gets thrown out anyway if the
  tank's appetite back then looks more than 25% different from its appetite
  now. The comment in the code says this second check does the real work and
  the 45-day cutoff is just there to catch something obviously absurd.
- **Give alkalinity a shorter memory (30 days) and calcium a longer one (60
  days)**, with magnesium left as an unanswered question — was it meant to
  stay at 45, or get a third number worked out the same way? Nobody wrote
  that part down. And when the reasoning behind "30 for alkalinity" and "60
  for calcium" was actually checked — roughly two rounds of "how long before
  a new dose shows its true effect" — the numbers don't line up. For
  alkalinity, two of those rounds comes to somewhere between four and ten
  days, nowhere near 30. For calcium, two rounds comes to somewhere between
  fourteen and sixty days — sixty only makes sense for the very slowest
  tanks. So the reasoning that was supposed to justify these two figures
  doesn't actually produce them.
- **Add a one-way rule**: an old test can only ever make the safe range
  wider, never pull it in tighter than what recent testing supports. The idea
  is to stop an old "it fell at 8 mL" from ever blocking a genuinely-needed
  jump to 12 mL on a tank that's grown. Trying to reproduce, with real
  numbers, the specific reason given for why this is needed — the claim that
  the existing 25%-appetite check backfires and keeps the wrong data — in the
  two situations worked through by hand, the opposite happened: the existing
  check correctly threw out the stale reading both times. So the worry
  behind this idea may be real — there's a documented case elsewhere in the
  app of exactly this kind of stale-data problem happening — but the
  specific reason given for building a new rule doesn't hold up when you
  actually do the sums. There might be a real gap here (best guess: right
  after you change a dose, the app is briefly comparing today's new dose
  against yesterday's old trend, which don't belong together), but that's a
  guess needing its own check, not the thing that was written down.

**The arithmetic that matters most here:** if a tank's demand is growing at a
steady 30% a year — a solid, healthy-growth pace — a 45-day-old test only
drifts about 3% away from being accurate. Even at double that growth rate,
60% a year, it's only off by about 6% at 45 days and 12% at 90 days. Both are
well inside the 25% mismatch the app already tolerates before it throws a
reading out. To make that 25% tolerance itself the limiting factor at 45
days, a tank's demand would need to grow over five-fold in a year — not
something steady growth does. So on paper, 45 days doesn't put you anywhere
near the danger zone, for ordinary, gradual growth. A sudden jump — dropping
in a tray of new frags in one weekend — is a different story and isn't
covered by this kind of steady-growth math; that's more the territory of the
one-way rule.

**Which way being wrong hurts:** a memory that's too short throws away a
still-good old test and leaves the app guessing with less evidence — mildly
annoying, rarely dangerous. A memory that's too long, or a rule that lets an
old test block a needed increase, keeps a tank under-dosed while it's
actually hungrier than the record shows — that's the direction that stresses
coral, and it's the direction worth taking seriously. The arithmetic above
says the day-count length itself isn't really where that risk lives, for
ordinary growth; the one-way rule question is where it lives, if it's a real
gap at all.

**Something worth flagging on its own, regardless of which of these gets
built:** right now, if a tank has zero dose history, the app quietly runs its
numbers with no safety check at all and says nothing about it. That's exactly
the situation where a wrongly-entered solution strength is most dangerous,
because the one thing that could catch a wrong strength — comparing it
against what the tank has actually done — has nothing to compare against.
Nobody's built a message for that case yet. Fixing that isn't tied to the
45-vs-30/60 question one way or the other — it needs doing regardless.

**No confident answer here.** This is really two separate decisions wearing
one name: should the memory length differ by element, and should old
readings only ever be allowed to loosen the safe range, never tighten it. On
the length question, the arithmetic leans toward "leave it as is" — the case
for splitting it by element doesn't add up the way it was written down. On
the one-way-rule question, there's a real, previously-seen problem behind the
idea, but the specific explanation given for it doesn't survive being
checked by hand, so it isn't clear yet exactly what needs building. Both
would be worth re-checking against Dan's actual tank history once that's
available to look at — nothing here was checked against real readings,
because there aren't any in this workspace to check against.

---

## One page — the shape of it

Five decisions, options only, no reasoning repeated here — see above for the
full working.

1. **Which engine owns the drift response?** — (a) the wizard's staged
   full-recompute governs everywhere, `drift.js`'s dose figures removed · (b)
   `drift.js` keeps its narrative classifier but never a dose/percentage
   figure · (c) both keep their numbers, but `drift.js` must match the
   wizard's verdict and render presentation-only.

2. **Are water changes excluded from the trend fit?** — (a) keep the current
   code: water changes stay in the fit for all three elements, uncorrected ·
   (b) exclude water changes as window boundaries for calcium and magnesium
   too, matching the legacy spec · (c) keep water changes in the fit for all
   three, but subtract their known dilution mathematically, the way logged
   corrections already are.

3. **What happens when consumption comes out negative?** — (a) status quo:
   clamp to zero, label "gaining," continue silently · (b) refuse: stop
   before the hold/act branches and name the likely cause · (c) middle: hold
   as now for a small negative near the noise floor, flag/refuse for a large
   one.

4. **Where does a correction finish?** — (a) full band, as coded today; treat
   "middle third" in the merged docs as a documentation error · (b) literal
   middle third, narrowing the arrival test to match the merged docs'
   heading · (c) a per-element zone scaled to each element's noise floor
   rather than a fixed band fraction (the specific noise-scaled formula
   proposed collapses to plain middle-third under today's constants; a
   genuinely different noise-scaled construction is offered as an unsourced
   alternative).

5. **Bracket memory: 45 days flat, or 30/60 per element?** — two separable
   sub-questions. Day-count: (a) keep flat 45 days · (b) build the
   30-alkalinity/60-calcium split, with magnesium's figure still undecided.
   Directional rule: (c) build "old observations may only widen the bracket,
   never narrow it," alongside either day-count option.
