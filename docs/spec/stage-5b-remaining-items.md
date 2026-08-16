# Stage 5b — The Remaining Items

Dan, 16 August 2026. Owner decisions. Clears the open list `.agent/gap-report.md`
left behind after Stage 5 answered the numbers and the four-cards fold answered
the states — G-21, G-22, G-28, G-31, D-1, and the two questions those folds
raised on their way through.

Eight decisions. **The spec edits are authorised. Docs only.**

**Folded into canon 16 August 2026, and this file is now the decision record
rather than the reference.** Ammonia is `reef-chemistry.md` **§32**, its own
section. The notice ordering and the off switch's scope are `wizard-states.md`
**§25.1**; `drifting`'s answer is **§13** and the deletion it causes is **§25.4**;
the kit-accuracy split is `reef-chemistry.md` **§19**; and the
negative-consumption suppression is `reef-chemistry.md` **§24** with
`wizard-states.md` **§24.24**. **Where this file and canon differ, canon wins.**

The implementation is filed as **TW-079** to **TW-083**, all untagged, plus
amendments to **TW-075** and **TW-076** where this decision overtook them. The
five items still open at the end of this file are `.agent/needs-dan.md` item 14.

---

# 1. Ammonia gets a section of its own

**It does not fit `wizard-states.md` §13's bands, because its target is zero.**

Every other parameter has a target *range* — two edges, a width, a midpoint —
and the bands, the alert offsets, the ordering fraction and the margins are all
built on that shape. None of it survives when the target is a point. Six of the
seven bands are unreachable and the seventh, `in-band`, would have to mean
*exactly zero*, which is a value rather than a band.

**Two states:**

| State | Condition | What the app does |
|---|---|---|
| Undetectable | the reading is zero | **nothing at all** |
| Detectable | the reading is above zero | **one notice, at alert tier** |

**Silence when undetectable.** No verdict, no notice, no tile state, no entry in
the tank summary, no clause in the collapsed headline. Almost every ammonia
reading on an established tank is zero, and a parameter that confirms it is fine
every time is a line the keeper stops reading — which costs exactly once.

**An alert-tier notice when detectable, on one reading.** No second reading is
waited for. §30's evidence bars are about movement and none of them applies.

**And none of the rest of the machinery:**

- **no trend** — never graded for movement in either direction; 0.5 then 0.25 is
  not a fall the app reports;
- **no steadiness verdict** — §22's six do not apply, and the
  `CONSISTENCY_RULES` entry goes;
- **no dose** — not dosed, no product, no rail, no return plan;
- **no analysis window** — each reading is judged alone.

The two live findings, `ammonia-high` and `ammonia-detected`, become one. A
second tier is a band, and there are none here.

---

# 2. The notice list gets its order

**§25.1 gains it. Four tiers:**

1. **alerts**
2. **out of range**
3. **relationship notices**
4. **everything else, in a fixed parameter order**

**The fixed parameter order: alkalinity, calcium, magnesium, salinity, nitrate,
phosphate, potassium, ammonia.**

**Within the first two tiers, ranked by proportional distance** — how far past
the nearer edge, as a share of the range's own width. **The fixed order breaks
ties.**

Same key as the collapsed headline sorts on, and for the same reason: 0.3 dKH
and 30 ppm are not two sizes of the same thing. **A ranking key, not a margin** —
§27 rule 3 is untouched.

The fixed order is a total order, so the list is deterministic. A list that
reshuffles without the tank changing is a list nobody can learn.

**And it breaks the collapsed headline's tie as well** — the question
`wizard-states.md` §25.6 item 6 had been carrying since the four-cards fold.

> **It was decided about the notice list but it applies to both — one order, one
> reason.**

Which also means the headline and the list beneath it can never name two equally
out-of-range parameters in opposite orders. The tiles' own order stays not
chosen: a display arrangement that may change for display reasons cannot be what
makes a headline checkable.

---

# 3. The off switch is per parameter, and it covers everything

**Off is per parameter**, not per finding id, not per id family, not per §25.4
kind. Turning phosphate off turns off phosphate and nothing else; nitrate is
untouched.

**It includes alerts and safe-bounds excursions.** There is no notice a
parameter can produce that survives its switch being off — including ammonia's.

**The reasoning, which is the half worth recording:**

> **The keeper ran the test and typed the number in.** The app is choosing
> whether to **comment** on a figure already in front of them — it is not
> informing them of something they do not have.

Every instinct against letting a user silence an alert comes from systems that
hold information the user does not: a smoke alarm, a warning light, a sensor
nobody is watching. **This app holds none.** The reading is on the tile, on the
chart and in the log. Turning the notice off removes the app's remark about it
and nothing else.

It also matches hide exactly, which §20 settled the same way and for the same
reason. Two controls with different exception lists teach the keeper that the
rules are arbitrary.

---

# 4. `drifting` produces no notice — only a tile state

It colours the tile and says where the reading sits. **It produces no notice, no
summary line and no card.**

A band is a position, not an event. `drifting` says the reading is **inside its
band**, which is where it is meant to be; what it adds is a direction, and
direction is the wizard's.

---

# 5. "Heading out of range" is deleted entirely

**A deletion, recorded with its reason** rather than left as an empty slot for
someone to fill later.

> *"Alkalinity is 8.5 dKH and moving down at about 0.35 dKH a week … The dosing
> protocol looks only as far back as your last dose change and sees nothing to
> act on there, so no dose change is suggested yet — **but the longer view is
> drifting.** Worth another test or two to see which holds."*

**It is a surface reconciling two time windows in prose, which §25.2 replaced
with a structural fix.** §25.2's answer was never to word it better — it was to
decide what each surface is for, so the two never make the same kind of claim and
never need reconciling. This is the reconciliation the fix removed the need for,
still running.

Nothing replaces it. If a level moving inside its band warrants saying
something, the wizard says it.

---

# 6. Kit accuracy — one deletion, two demotions

`.agent/gap-report.md` D-1, answered in two parts because it is two questions.

**Alkalinity: deleted outright, and not for canon's reason.** **ICP does not
measure carbonate alkalinity.** ICP measures elements; alkalinity is a titration
result. The two numbers are not measurements of the same quantity, so **the
comparison cannot exist** — this is not a rule being enforced, it is arithmetic
on two different properties. No future decision about ICP reopens it.

**Calcium and magnesium: the observation survives, the verdict does not.** ICP
does measure both, against the same water.

> *"Your last three calcium readings sat 25% above the lab panel taken the same
> day."*

**And nothing after it.** No *"your kit is reading high"*, no *"worth replacing
the reagent"*. **The app does not know which of the two is wrong** — a lab is a
better measurement, not a true one, and the sample was drawn, stored and posted
by the keeper.

5% stays as the trigger. 25% goes with the verdict it graded: one wording, one
severity, `watch`.

---

# 7. The negative-consumption card does not fire when a correction is logged

This closes the question §24.24 left open the day before. **Not a second
wording — a suppression.**

A logged correction is the first of the six ordinary causes `reef-chemistry.md`
§24 itself lists. Where one is in the record the arithmetic is explained and
there is nothing to report. The card would be the app announcing a surprise and
explaining it away in the same breath, about the keeper's own action.

**§24 part 3 is now spent entirely**: no water change in either direction, no
missing correction, no logged one. Parts 1, 2 and 4 are untouched, and the
suppression now agrees with part 4's count, which never counted an interval with
a correction logged in it.

---

# 8. The implementation is filed untagged

**TW-079** ammonia; **TW-080** `drifting` and the deleted finding; **TW-081** the
notice ordering; **TW-082** the off switch; **TW-083** kit accuracy. TW-075 and
TW-076 are corrected where this decision overtook them.

**Untagged. None may be built without `[approved]`.**

---

# What remains open after this

**Five of the gap report's open list, and every one is Dan's.**
`.agent/needs-dan.md` item 14. Stage 3's own three surviving questions —
`wizard-states.md` §25.6 items 1 to 3, the volume ceiling, the 6.9 dKH card
overlap and where app-level notices go — are a separate list and are unchanged
by this fold; §25.6 items 4 and 6 closed with decision 2.

**1. What the parameter tile's chip shows** (G-9). Deferred at Stage 5 rather
than decided.

**2. What an "N of M in range" claim may count** (G-29) — and therefore what a
completely quiet tank's headline says, since all three of its slots drop.

**3. The severity colours mean direction on one screen and tier on another.**
§15's mapping is redone in the four registered colours; `paramStatus` still uses
two of them for *under the minimum* and *over the maximum*. TW-072 cannot be
built until it is answered.

**4. Two relationships `reef-chemistry.md` §30 deliberately did not settle** —
§30.1's three-readings bar against `directional()`'s four-row gate, and whether
claiming a dose change **worked** uses §30.2's bar or stays a stability question
under §11.

**5. `settings.mgAlertLow`** (N-2) — a live per-user override with no Setup field
and no canon entry.

---

# The sixth, answered the same day

**What breaks an exact tie in §25.1's headline ordering.** Carried since the
four-cards fold, put back with this one, and closed: **decision 2's fixed
parameter order breaks it too.** One order, one reason. TW-076 and TW-081 share
a single definition of it rather than carrying two.

---

# Two things this fold derived rather than decided

Both are written into §25.1 the way §20's mapping of *serious* and §25.1's own
slot table are written — **so the rule is implementable, correctable in one
line, and not mistaken for a decision.**

**pH is not in the fixed parameter order.** The order names eight parameters and
the app has nine. pH has no alert tier but does produce notices — §31's *pH high*
and *CO2 signature* are both ratified. **It sorts last**, after ammonia, as the
only placement that adds nothing to what was decided. **Put to the owner and
confirmed right, and left derived rather than promoted** — so it keeps its
one-line correctability, and so the fixed order still names eight.

**Relationship notices order among themselves by the earliest parameter they
name** in the fixed order. Tier 3 needs an internal order for the same
determinism reason as the others.
