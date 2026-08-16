# Stage 5 — The Numbers

Dan, 16 August 2026. Owner decisions. Answers Part 1 of `.agent/gap-report.md`
and the highest-value open items in Part 2.

Every figure below was live in the app and named nowhere in canon. Each is now
canon.

**Folded into canon 16 August 2026, and this file is now the decision record
rather than the reference.** The evidence rules are `reef-chemistry.md` §30 and
the ratified findings thresholds are §31; the one noise-floor table is §5, the
movement rule §11, the two new alert levels and the withdrawal of the retarget
clause §18, and §29.7's mode column is amended to match §5. On the surfaces
side, `wizard-states.md` §15 registers **above range** and **below range** and
carries the four-colour severity mapping, §25.1 deletes the health score, §25.2
deletes `paramContext` and follows the keeper's selected window, §22 is amended
with it, and §13 records which parameters can reach an alert band. **Where this
file and canon differ, canon wins.**

The implementation is filed as **TW-064** to **TW-074**, all untagged, and the
open items at the end of this file are `.agent/needs-dan.md` item 12.

---

# 1. The evidence rules — the report's own top priority

The gap report's closing advice: *"If you answer one thing from this report,
answer that."* Four registered cards — §24.7, §24.8, §24.21, §24.22 — could not
be built without these.

## To establish movement from nothing

**Three readings, one direction, movement clearing the noise floor.**

Journey 1 §5: one is notice, two is a signal, three is a fact.

## To claim a dose change is being contradicted

**Two readings, both dated after the change, at least one test cadence apart,
moving two to three times the noise floor in the direction opposite to what the
change intended.**

Proportional, not a fixed figure — the earlier draft quoted 0.2–0.3 dKH, which
is alkalinity's case mistaken for the rule:

| | Movement | Interval |
|---|---|---|
| Alkalinity | 0.2–0.3 dKH | 2 days |
| Calcium | 20–30 ppm | 7 days |
| Magnesium | 60–90 ppm | 21 days |

**The interval is one test cadence, not 24 hours.** Two magnesium readings are
three weeks apart by definition; a 24-hour rule is meaningless for it.

**The bar is lower than establishing movement, deliberately.** A dose change
creates an expectation, so breaking it is informative immediately, where a
trend from nothing has to earn its third reading.

## To claim no response at all

**Two readings after the change, both within the noise floor of each other.**

From journey 1: *"that's two days of an increased dose and it hasn't actually
moved — at that point I'd increase the dose further."* An expected response that
does not arrive is evidence.

---

# 2. One noise-floor table

**Three tables become one. `KIT_PRECISION` and `KIT_SIGMA` go.**

Per parameter, not per test kit. Per-kit is arguably more truthful — a Hanna
checker really does resolve better than a Red Sea kit — and it was rejected
anyway: it is another variable in an app that already has too many, and Setup
asking which kit you own to derive a threshold is the shape of thing §21 warns
about.

| Parameter | Noise floor | Mode |
|---|---|---|
| Alkalinity | 0.1 dKH | absolute |
| Calcium | 10 ppm | absolute |
| Magnesium | 30 ppm | absolute |
| **Nitrate** | **1.0 ppm** | **absolute** |
| **Phosphate** | **0.01 ppm** | **absolute** |
| Salinity | 0.2 ppt | absolute |
| Potassium | 20 ppm | absolute |
| pH | 0.1 | absolute |

**All absolute. Percent mode is abolished.**

## Nitrate — this was blocking §29 outright

§29.5 requires nitrate's trend to clear "§5's noise floor" and §5 had no
nitrate entry. **The rule as written could not be implemented.** It can now.

The app's figure was 1.0 in *percent* mode — 1% of the reading, so 0.1 ppm on a
tank at 10. No hobby nitrate kit resolves anywhere near that.

## Phosphate — neither of the app's options was right

The app used 0.02 in percent mode. Absolute 0.02 would swallow a fifth of the
0.03–0.10 band; 2% of a 0.10 reading is 0.002, far below what any kit shows.

**0.01 ppm is the kit's own resolution** — a Hanna phosphate checker reads to
0.01, so anything smaller is beneath measurement.

## A consequence, accepted

The settle-window formula feeds on these figures, so windows shift slightly.
Red Sea alkalinity users had 0.20 and now have 0.10, so their settle window
shortens. §7's formula and its 2–5 / 7–30 clamps are unchanged. **Accepted, not
flagged.**

---

# 3. Movement is magnitude *or* persistence

**The four alkalinity thresholds become one rule, and the rule is not a single
number.**

## First, which quantity

**Per day.** It is how the tank is actually thought about — *"losing about 0.1 a
day"* — and it is what the engines already use. Weekly is the same figure
multiplied; a spread over a window is a different measurement altogether.

`DRIFT_GUIDE`, `RATE_RULES` and `CONSISTENCY_RULES`' role in grading movement
all go. `CONSISTENCY_RULES` survives only where §22's steadiness verdicts need
a spread, which is a different question.

## Then the rule

A level is moving if **either**:

- the fitted daily rate exceeds the element's threshold — 0.10 dKH/day for
  alkalinity, and the existing `CA_TREND` and `MG_TREND` figures at their own
  scales; **or**
- the direction has held consistently and the **total** movement over the
  window clears the noise floor.

> *"Anything under 0.10 per day is stable, yes — but if it shows less movement
> per day and it's consistent over multiple days, it is a swing."*

**This is why a single threshold was never going to work.** 0.02 dKH/day for
three days is noise. The same rate for ten days is 0.2 dKH and it is real. The
second test is what the noise floor was always for — slope times window, not
slope alone — and it simply was not being used that way.

§11 continues to govern the dangerous case independently: a level outside its
band and moving further out is never graded stable, whatever the rate.

---

# 4. Alert levels for the parameters that had none

Only alkalinity, calcium and magnesium had a *needs attention* tier.
`positionBand` could never return it for the other six, however far out they
went.

**Ammonia and salinity get one. Potassium and pH do not.**

## Ammonia

**Anything detectable.** The target is zero, so there is no band edge to hang a
margin from — the tier fires above whatever the kit can resolve.

Ammonia still has no chemistry section of its own (gap report G-22) and needs
one; §13's seven bands do not fit a parameter whose target is zero.

## Salinity

**Below 33 ppt or above 36 ppt.**

Sourced. Target is 35 ppt / 1.025 SG, and most reef tanks run 33–35. Below 31
kills coral over prolonged exposure; at 38 and above soft corals melt and hard
coral tissue peels. `SAFE_BOUNDS`' 32–37 matches consensus, and the alert sits
inside it — outside where anyone runs, not yet at harm.

## Phosphate and nitrate

Already answered by §29.4's fixed warnings — below 0.03 and above 50 — which
serve the same purpose.

## Potassium and pH

**No alert tier.** Parameters you watch rather than act on urgently.

---

# 5. The health score is deleted

**Nineteen constants, one number on the front screen, no canon entry of any
kind.** Not a band, not a verdict, not a notice, not a message. It has already
been caught showing 42 while its own working panel summed to 71.

**Deleted, along with `ScoreBreakdown`, the score colour bands and the headline
score bands.**

The reason is the app's own first rule: **state it, then show the basis.** A
single number claiming to summarise a tank's health is the least checkable
thing in the app — there is no basis to show, only nineteen weights nobody has
seen.

## What replaces it

Nothing yet, and there is already a candidate: **the collapsed tank summary
headline** (gap report G-27) is unspecified and needs writing anyway. Something
of the shape *"3 of 6 in range, 2 need attention"* is a tank-health summary a
keeper can check against the tiles below it.

**Decide when G-27 is decided.** Recorded here so the score's deletion does not
quietly remove the only tank-level view.

---

# 6. `paramContext` is deleted, and nothing replaces it

Eight prose blocks on the history modal, quoting about fifteen figures canon
has never named, and one that **contradicts canon outright** — it tells a keeper
tanks run happily to 550 ppm calcium where §2 caps at 500 because above that it
pulls alkalinity down.

Most of it also breaches §23.5 (never speculate about causes) and §29.6 (no
levers): *"water changes are the likely source"*, *"low magnesium is usually the
reason calcium won't hold"*, *"a little more feeding is normally the fix"*.

**Nothing replaces it.** The band and the verdict say where a level is;
explaining what that means is the kind of writing that goes stale and then
contradicts something else — which is exactly what happened here.

---

# 7. The steadiness panel follows the window you pick

§25.2 says the panel states the window it graded over, and fixes that window
per parameter. The app offers 7 / 30 / 90 / All and grades whatever is picked.

**The buttons stay. The panel grades the selected window and names it in its
heading.**

> *"Over the last 90 days — wide swing, 1.1 dKH between highest and lowest."*

No data is hidden and the chart is untouched. The rule §25.2 was written to
enforce — that a verdict must say what it judged — is satisfied by the heading
naming the selection.

**§25.2 needs amending:** the window is the one the keeper selected, not §4's
analysis window.

---

# 8. One word for position

The dashboard banner says *"Out of range"*. The tile beneath it says *"ABOVE
BAND"*. Same reading, same instant, two vocabularies.

**§15 registered "range".** Tiles read **in range**, **above range**, **below
range**.

Found by Dan on the dashboard, 16 August.

---

# 9. Four severity colours, not six

`TONE_TIER` maps six colours to three tiers to implement §22's "never renders
calmer than the reading". §15's registry names **four** severity colours, and
four of the six in the mapping are registered nowhere.

**The mapping is redone using the four registered colours.**

Six severity colours is more than anyone distinguishes at a glance, and an
unregistered colour is the same fault as an unregistered word.

---

# 10. The findings thresholds that survive — ratified as they stand

Most of `buildFindings`' unnamed numbers belong to findings being deleted. Of
those that survive, these are ratified at their current values:

| Finding | Threshold |
|---|---|
| Implausible alkalinity consumption | > 2 dKH/day |
| Implausible calcium consumption | > 30 ppm/day |
| Ionic ratio off | more than 15% either side of the 7.15 coupling |
| pH high | > 8.45 |
| CO2 signature | pH < 7.9 with alkalinity in range |

---

# 11. §28 wins over §18

**A canon-versus-canon contradiction, and the report was right not to pick it.**

§18: when a level sits outside the range but is holding steady, suggest
**reconsidering the range** before suggesting a correction.

§28.2, written two days later: that exact state — stable and out of band — is
when the app offers to **walk the level home**.

The app does the first. Dan saw it on the dashboard: *"Change the target range
to 8.7–9.3? Use this."*

**§28 wins.** Offering to move the goalposts is a strange default; the range was
set for a reason. §18's clause is withdrawn, and `computeControl`'s
`suggestWorth`, the retarget offer and `SnoozeSheet`'s *"the target range is the
thing to change rather than the dose"* all go with it.

---

# What remains open after this

Stage 5 answered the numbers. From the gap report's 41 gaps, these still need
Dan:

**The collapsed tank summary headline** (G-27) — now more pressing, since the
health score's deletion leaves no tank-level view.

**What the parameter tile's chip shows** (G-9). Deferred rather than decided:
the tile turned out to be better than the code suggested, and the real faults
on it were the vocabulary split (§8 above) and bands that do not match canon's
defaults.

**Ammonia needs its own chemistry section** (G-22).

**The four cards with no state** (G-1 to G-4): `due`, `worked` route 12, the
negative-consumption hold and its three-consecutive escalation, and the
tested-but-inconclusive case.

**Whether `drifting` produces a notice** (G-21), and the "heading out of range"
warning that currently reconciles two windows in prose.

**The kit-accuracy findings** (D-1) — worked up with three options and not
decided.

**Notice ordering** (G-28), the "N of M in range" claim (G-29), what a notice
*type* is for the off switch (G-31), and where relationship notices sit
(§25.6 item 4).
