# Stage 6a — The Decisions

Dan, 16 August 2026. Owner decisions. Answers `.agent/stage-6a-gaps.md`, the
twenty findings raised while `src/lib/classify/classify-reading.js` was built
from canon alone.

**The figures that were missing, and nine rulings.** Stage 6b proceeds.

---

## Folded into canon 16 August 2026 — and what this file now is

**This file is the decision record, not the reference.** Everything below is in
canon: the steadiness figures are `wizard-states.md` **§22**; salinity's window is
`reef-chemistry.md` **§4**, its rate thresholds **§11**, its clearly-out margin
**§27** and its alert level **§18**; the single-reading rule and the boundary
ruling are `wizard-states.md` **§13**; `drifting`'s proximity answer is **§13**;
the total-movement correction is `reef-chemistry.md` **§11** and **§30.1**; the
resolution-floor scope is **§5** with **§29.4**; the alert clamp is **§18**; and
ammonia's detectability is **§18** with **§32.2**. **Where this file and canon
differ, canon wins.**

**This file was written after the fold, not before it.** Stage 5 through 5c each
produced a decision document that canon was then folded from;
`.agent/stage-6a-gaps.md` is a report of holes rather than a set of answers, and
the answers arrived as owner decisions against it. This document records them in
the same form as its predecessors so the lineage is not broken — **it is the
decision record for a fold that took its instructions directly from the owner.**

The implementation is filed as **TW-085** to **TW-090**, all untagged. The open
list at the end is reconciled at `.agent/needs-dan.md` item 15 and
`wizard-states.md` §25.6.

---

# 1. The steadiness verdicts get their figures — four parameters, not nine

`.agent/stage-6a-gaps.md` S-1, S-2 and S-3, and the largest hole in the report.

§22 registered six words on 14 August and said in terms that registering them
*"does not change any threshold, window or grading rule"*. So nothing in canon
could grade them, `SPREAD_TOLERANCE` shipped empty, and **every parameter refused
its verdict.** The only figures that ever answered it lived in the old layer this
project is throwing away.

## The spreads

| Parameter | Tight — at or under | Wide — at or over |
|---|---|---|
| Alkalinity | 0.3 dKH | 1.0 dKH |
| Calcium | 25 ppm | 80 ppm |
| Magnesium | 50 ppm | 100 ppm |
| Salinity | 0.3 ppt | 1.0 ppt |

**Eight figures for four parameters, not eighteen for nine.** Phosphate,
nitrate, potassium, pH and ammonia **get no steadiness verdict at all** — and
that is a decision, not an omission and not a refusal waiting on a figure. They
are not waiting on me.

**The four are the four with a rate threshold.** `sliding` is defined off the
rate, so a parameter without one cannot reach all six verdicts — and six words on
some parameters and four on others is the silent two-band vocabulary §13 had, in
a new place. All six, or none.

**Not derived from the noise floor and not derived from the band.** Deriving them
from §5 would mean changing a test kit changed what counts as steady; deriving
them from the band would mean a keeper who widens their range has decided that
bouncing about matters less. Both are the fault §27's third rule names. Each
figure stands on its own and is correctable on its own line.

## Spread is over the full window

Highest minus lowest, over every reading in the window being graded. Not a
recent slice of it. A bad fortnight inside a calm month should show.

## The off-range test is the median of the most recent half

Three of the six turn on whether the window sits *off* the range, and §22 forbids
deciding that from a single reading — which ruled out the last reading and ruled
in nothing.

**Take the readings in the most recent half of the window, take their median, ask
whether it is outside the band.**

The median because one kit misread is the commonest outlier and a mean chases it.
The recent half because a tank that spent the first fortnight out and the last
fortnight in **is in** — and a whole-window median lets an old excursion outvote
the present.

## `sliding` is twice the moving threshold

| | Moving (§11) | `sliding` |
|---|---|---|
| Alkalinity | 0.10 dKH/day | 0.20 dKH/day |
| Calcium | 5 ppm/week | 10 ppm/week |
| Magnesium | 10 ppm/week | 20 ppm/week |
| Salinity | 0.2 ppt/day | 0.4 ppt/day |

Canon had a bar for *moving* and none for *fast*, while §22 needs both — a level
on §11's slow-but-persistent limb is moving and is plainly not sliding.
**Doubling is the one decision; every cell is arithmetic on a figure §11 already
carries**, and any parameter that gains a rate threshold later gets its `sliding`
bar without a new decision.

---

# 2. Salinity gets what it was missing

W-1, W-2 and W-4. Four parameters had no analysis window, five had no rate
threshold, four had no clearly-out margin — and salinity was in all three lists
while being **a parameter the app already acts on**: §18 gives it an alert tier
and §3 gives it a rate rail.

| A 14-day analysis window | §4 — the same as alkalinity's, for a parameter that moves on the timescale of days |
| Rate thresholds of 0.2 and 0.4 ppt/day | §11 — moving, and `sliding` at twice it |
| A clearly-out margin of 0.5 ppt | §27 — a fixed distance past the edge, in its own unit |

**Potassium, pH and ammonia get none of the three, deliberately.** They are
watched rather than acted on, which is already §18's reason for giving potassium
and pH no alert tier; ammonia's exclusion is a rule of its own (§32.5). **A
parameter with no clearly-out margin never escalates its wording** — it says the
level is out, plainly, however far out it is. It does not borrow another
parameter's figure and it does not go quiet.

---

# 3. The rulings

**Magnesium at exactly 1150 is `alert-low`, and it is one notice, not two.** §10
floors magnesium's alert-low at 1150 and a keeper may set 1150 as their range
minimum, at which point two boundary rules claim one value. The alert tier is
tested first: of two defensible answers the more serious is the one that cannot
get a tank killed. One reading, one position, one verdict — a surface rendering
both an in-range line and an alert line for it is a finding.

**Salinity's alert moves to above 36.5 ppt.** At 36 it sat exactly on the app's
own shipped range edge, so 36.0 was both `alert-high` and not out of range — a
combination no card in §24 covers, reachable by typing the most ordinary number a
keeper with that range could type. **The level moves, not the boundary rule.**
§13's boundary rules are *"fixed, no exceptions"* and exempting §18's two levels
would have made that sentence false for one figure. The low side stays at 33.

**§13's last row: a single reading states its position.** *"Too few readings"* is
gone as a cause of `insufficient-data`. §24.5 is the card written for that state
and it states the position anyway, noting *"the position is known"*; §26 agrees.
**The band classifies from the last reading, and only the movement and steadiness
axes refuse** — naming what they are waiting for and when the next test is due.
`insufficient-data` is now for a band that genuinely cannot be found.

**And "missing volume" comes out of that row entirely.** Net volume is a dosing
input. Nothing in classifying a reading against a range needs it, the function
never took one, and leaving it in the row would send a checker looking for a
refusal that must not exist.

**§11's total movement is last minus first**, matching §30.1, which sets the same
bar and rules out the fitted line in terms. §11's explanation said *"slope times
window, not slope alone"* — a third quantity, agreeing on a monotone series and
parting company on a noisy one, which is exactly where it matters. **The
explanatory sentence is corrected rather than §30.1 widened.** §11's fitted rate
keeps the first limb.

**§5's resolution floor governs movement only.** A floor is a rule about
differences, not about levels. **A phosphate of 0.00 classifies `out-of-band-low`
and §29.4's warning fires** — 0.00 is the clearest case that warning exists for,
and the strict reading would have taken it down at exactly the reading that
should set it off loudest, via Stage 6e reading its input from a refusal. Nothing
changes on the movement side.

**`drifting` needs no proximity test.** In range and moving is `drifting`,
wherever it sits in the band; a level dead centre and creeping is `drifting`. The
trend is the information. Requiring proximity would have meant re-authorising
§26's 12%-of-band `nearEdge` figure for a new use, which is what §27's third rule
exists to stop — and it costs nothing on screen, because `drifting` produces no
notice.

**§18's alert offsets clamp to the range edge rather than refusing.** The offsets
are ±1.0 dKH, ±50 ppm and ±200 ppm from the midpoint, so with the defaults any
alkalinity range wider than 2.0 dKH inverts — and §2 permits a range anywhere
inside 7–11 dKH. Refusing made a legal range illegal. **This is §10's magnesium
floor generalised**: clamp the derived figure, do not reject the configuration. A
genuinely broken configuration still refuses.

**Ammonia is detectable above zero.** Confirmed rather than newly decided — §32.2
already says it. A keeper who records 0.01 reaches the same tier as one at 0.5
ppm, because the tier is about presence and not amount, and there is no second
tier for ammonia to escalate into.

---

# What this leaves

**Nothing that blocks Stage 6b.**

**Four questions carried**, at `wizard-states.md` §25.6 items 7 to 10 and
`.agent/needs-dan.md` item 15: §24.23's offer being a return plan or a correction
wearing its words; what a task actually looks like; whether `classifyReading` is
handed the correction-adjusted series before 6f wires it up; and salinity's test
cadence.

**Two things `.agent/stage-6a-gaps.md` records as noted rather than decided**, both
implementable as they stand: whether §22's and §19's span requirements reach a
movement claim (Q-1), and whether the reading at a kit change belongs to the old
series or the new (Q-3).

**Q-4 needs no answer.** Which surface calls the function is 6f's, and
`wizard-states.md` §11 already forbids any surface classifying for itself.
