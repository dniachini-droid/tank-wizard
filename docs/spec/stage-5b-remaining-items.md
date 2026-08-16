# Stage 5b — The Remaining Open Items

Dan, 16 August 2026. Owner decisions. Clears the open list from
`.agent/gap-report.md` Part 2 and the items carried from
`stage-5-the-numbers.md`.

**With this, nothing on the gap report's open list is unanswered.** Stage 6
proceeds.

---

## Folded into canon 16 August 2026 — and what this file now is

**This file is the decision record, not the reference.** Decisions 2 to 8 below
are in canon: ammonia is `reef-chemistry.md` **§32**, its own section; the notice
ordering and the off switch's scope are `wizard-states.md` **§25.1**;
`drifting`'s answer is **§13** and the deletion it causes is **§25.4**; the
relationship-notice placement is **§25.1** and **§25.4**; the kit-accuracy split
is `reef-chemistry.md` **§19**; and the negative-consumption suppression is
`reef-chemistry.md` **§24** with `wizard-states.md` **§24.24**. **Where this file
and canon differ, canon wins.**

**Decision 1 is not in canon.** The fold covered the seven that follow it, and
the parameter tile (G-9) was still recorded as open when it ran. **It is decided
here and awaiting a fold** — `.agent/needs-dan.md` item 14 carries it as such,
and no agent may treat it as unanswered.

The implementation is filed as **TW-080** to **TW-084**, all untagged, plus
amendments to **TW-075** and **TW-076** where these decisions overtook them.
**TW-084 is the ammonia item** — it was filed as TW-079 and renumbered when
Stage 6a took that number on main. The open list at the end of this file is
reconciled below and is `.agent/needs-dan.md` item 14.

---
# 1. The parameter tile keeps all five elements

Gap report G-9. `ParamCard` shows the value, a slider with the range edges, a
position word, a sparkline, a steadiness word with a date, and a dose chip when
one applies.

**All of it stays. What changes is where the words come from.**

The gap report counted four independently computed severities in one card,
which is why one reading can disagree with itself in a square inch. But looking
at the tile rather than the code, the value, slider, position word and
sparkline are **one fact shown four ways** — that is presentation, and it is the
app's first rule working as intended: state it, then show the basis. The
position word is the claim; the slider and the numbers beside it are the basis,
on the same tile.

The steadiness word is a second genuine claim. The dose chip is a third.

**So: three claims, four presentations of the first, and every one sourced from
`classifyReading`.** They cannot disagree because there is nothing left to
disagree with.

Reskinning is Phase 9's work and is not this decision.

---

# 2. `drifting` is a tile state, not a notice

Gap report G-21. `drifting` — inside the range, trending toward an edge — is one
of §13's seven bands. The tile can show it. **It produces no notice.**

Nothing is wrong yet: the level is in range. A notice for every parameter
wandering inside its own range is the kind of noise this rebuild exists to
remove, and if the *dose* is actually wrong the wizard says so on its own terms.

## This deletes the "heading out of range" warning entirely

`findings.js:466-557`, and it is the specimen the gap report singled out:

> *"Alkalinity is 8.5 dKH and moving down at about 0.35 dKH a week. At that pace
> it reaches the bottom of your range in roughly 12 days. The dosing protocol
> looks only as far back as your last dose change and sees nothing to act on
> there, so no dose change is suggested yet — but the longer view is drifting.
> Worth another test or two to see which holds."*

**That is a surface reconciling two time windows in prose**, which is precisely
what §25.2 replaced with a structural fix. It is the 16 August contradiction,
written down and shipped. It goes.

---

# 3. Ammonia — its own model, and a short one

Gap report G-22. Ammonia has no chemistry section and does not fit the one
canon has. Every other parameter has a range you sit inside; **ammonia's target
is zero**, so §13's seven bands do not apply — there is no "in range" for a
parameter that should read nothing.

**The whole model:**

| Undetectable | Silence. Not a green tick, not a verdict — nothing. |
| Detectable | An immediate notice at the alert tier. |
| Trend, steadiness, dose | None of them. Ever. |

No band, no seven-word vocabulary, no steadiness verdict, no analysis window,
no noise floor beyond what the kit resolves.

**One reading is grounds for acting**, which is true of no other parameter and
is why it needs its own section rather than an entry in an existing table.

---

# 4. Kit accuracy — deleted for alkalinity, reported without a verdict for the rest

Gap report D-1, which was worked up with three options rather than deleted,
because canon's rule against telling a keeper their kit is wrong was argued
from **drift**, and an independent lab panel is not drift.

## Alkalinity's version is arithmetic on a comparison that does not exist

**ICP does not measure carbonate alkalinity.** So the finding compares
alkalinity readings against something that cannot measure alkalinity. That is
not a rule to debate — **delete it outright.**

## Calcium and magnesium keep the observation, lose the verdict

ICP does measure both, so a paired comparison is real. The finding survives as
a statement about the **comparison**, not about the kit:

> Your last three calcium readings sat 25% above the lab panel.

**No "your kit is wrong". No "worth replacing the reagent".** The observation is
reported; the conclusion is the keeper's. That is §23.5's rule applied
precisely — report what was seen, do not name what it means.

---

# 5. Notice ordering — three tiers, then a fixed order

Gap report G-28. The summary shows one notice per parameter; canon said nothing
about the order.

**Tier 1 — alerts**, ranked among themselves by proportional distance.
**Tier 2 — out of range**, same ranking.
**Tier 3 — relationship notices.**
**Tier 4 — everything else, in a fixed parameter order.**

## The fixed order

**Alkalinity, calcium, magnesium, salinity, nitrate, phosphate, potassium,
ammonia.**

Roughly how often each is looked at. **Ammonia sits last** — unless it is
detectable, in which case it is an alert and is at the top by definition.

A salinity alert jumps to the front; once it clears, salinity drops back to
fourth.

## Why relationship notices sit third, not first

They were proposed for the top, above alerts, and that was rejected: **an alert
is a level that needs attention now; a relationship notice is context.** Context
does not outrank a tank in trouble.

The magnesium gate is not an exception to this. When it fires, magnesium is
below alert-low, so magnesium's own alert is already at the top — the
relationship notice sits below it, explaining what is being held.

## The tie-break

Two parameters equally far out proportionally: **the fixed order above breaks
the tie.** No new rule.

---

# 6. Off is per parameter, and it means off

Gap report G-31. §25.1 registers **hide** (per notice, temporary, resurfaces on
supersession) and **off** (permanent, set in Setup). What canon never said is
what a *type* is.

**A parameter.** Turn phosphate off and nothing about phosphate speaks again
until it is turned back on.

Not per finding id, not per finding family, not per §25.4 kind.

## Alerts and safe-bounds excursions are included

**Off means off.** Turning phosphate off silences the below-0.03 warning too.

> *"If the notifications go off, all notifications go off. They turned it off."*

The reasoning is the strongest part of the decision, and it applies to the
whole app: **the keeper ran the test and typed the number in.** They already
know the level is low. The app is not telling them something they do not have
in front of them; it is choosing whether to comment.

This is the same principle as everything being hideable, and it is the answer
to the ultra-low-nutrient case §25.1 names — someone deliberately running
phosphate at 0.02 turns phosphate off, and the app never asks whether they are
running an ultra-low-nutrient system.

---

# 7. Relationship notices — placement

Gap report §25.6 item 4. **Tier 3 of the ordering above**, in their own group,
below out-of-range and above the fixed parameter order.

They are about the tank rather than a parameter, so attaching one to the
parameter most affected was rejected: the magnesium gate hung under alkalinity
would be missed by someone looking at calcium, which is also being held.

---

# 8. The negative-consumption card does not fire when a correction is logged

Carried from the §24.24 fold-in. The card exists because a rise the dose cannot
explain is unexplained. **If a one-off correction is logged, the rise is
accounted for and the card is simply wrong.**

No card, no escalation, no counting toward the three-consecutive threshold.

---


# What the fold added, and where to read it

The decisions above are the owner's words. Canon carries them plus the
consequences the fold had to settle to make them implementable. **Nothing here is
a new decision** — each is either a restatement, a boundary, or a rule already in
canon applied to the new text.

**Ammonia** (`reef-chemistry.md` §32). "Undetectable" and "detectable" are given
a definition the app can apply — **a reading above zero** — because §5 abolished
per-kit figures and ammonia is not to reacquire one. The single reading is stated
as carrying **no evidence bar**: §30's three bars are about *movement*, and
detectability is not a movement claim. `wizard-states.md` §13 is amended to say
ammonia falls **outside** its seven bands rather than reaching only some of them,
which is the one place the existing rule did not stretch. The two findings
`ammonia-high` and `ammonia-detected` collapse to one — a second tier is a band.
The `CONSISTENCY_RULES` ammonia entry is deleted rather than left as dead
configuration (§22).

**The ordering** (`wizard-states.md` §25.1). The proportional-distance key is
stated to be **a ranking key and not a margin**, so `reef-chemistry.md` §27
rule 3 is untouched — it gates no recommendation and relaxes no constraint. The
fixed order being a **total order** is what makes the list deterministic, which
is the property being bought. And it breaks the collapsed headline's tie as well
as the list's — *one order, one reason* — so the headline and the list beneath it
can never name two equally out-of-range parameters in opposite orders.

**Off** (`wizard-states.md` §25.1). Recorded as matching **hide** exactly, on
§20's own reasoning, because two controls with different exception lists teach
the keeper that the rules are arbitrary. What off does *not* do is stated: the
reading is still recorded, charted and tiled, and the engine still assesses the
parameter (§19). It removes the parameter from the notices — the app speaking
first.

**The deleted warning** (`wizard-states.md` §25.4). Recorded **as a deletion with
its reason**, next to the others, so the empty slot in the card set is not read
as an invitation to write a replacement.

**Kit accuracy** (`reef-chemistry.md` §19). The finding's two live figures split:
**5% is ratified as the trigger** on §31's terms, and **25% goes with the
severity ladder it graded** — one wording, one severity, at `watch`, because
`act` would contradict a notice that asks for nothing.

**The negative-consumption suppression** (`reef-chemistry.md` §24). §24 part 3 is
now **spent entirely** — no water change in either direction, no missing
correction, no logged one — and the suppression is noted to agree with part 4's
count, which never counted an interval with a correction logged in it.

---

# Two things the fold derived rather than decided

Both are written into §25.1 the way §20's mapping of *serious* and §25.1's own
slot table are written — **so the rule is implementable, correctable in one line,
and not mistaken for a decision.**

**pH is not in the fixed parameter order.** The order names eight parameters and
the app has nine. pH has no alert tier but does produce notices — §31's *pH high*
and *CO2 signature* are both ratified. **It sorts last**, after ammonia, as the
only placement that adds nothing to what was decided. **Put to the owner and
confirmed right, and left derived rather than promoted** — so it keeps its
one-line correctability, and so the fixed order still names eight.

**Relationship notices order among themselves by the earliest parameter they
name** in the fixed order. Tier 3 needs an internal order for the same
determinism reason as the others.

---

# What is now closed

Every item on the gap report's open list, plus the two carried from tonight's
folds. Specifically: G-9, G-21, G-22, G-27, G-28, G-31, D-1, §25.6 item 4, the
headline tie-break, and the logged-correction case.

**Still open, and none of it blocks Stage 6:**

**All but one of these closed on 16 August in the Stage 5c and 6a folds**, and
each is struck with what answered it. **TW-063 is the survivor.**

- ~~**The 6.9 dKH card overlap**~~ (§25.6 item 2) — three cards claimed that
  situation, and the third was found by the gap report after the item was
  written. **Closed: §24.9 on the dashboard, §24.23 in the wizard**, and the
  third was already deleted by D-4. `narrative-engine.js:457-459` goes with it.
- ~~**App-level notices going to Tasks**~~ (§25.6 item 3) — six finding ids, no
  home, and the fit was unproven. **Closed: Tasks is the home, with a count
  badge**, and the two blocking ones also render at the refusal.
- ~~**§9's volume ceiling**~~ (§25.6 item 1). **Closed: it applies per day** — if
  one day of a plan needs more than ~1.5 L the plan is too aggressive, however
  many days it runs.
- ~~**Magnesium's default band**~~ shipped 1250–1400 against §2 layer 3's
  1275–1425 (TW-052). **Closed: canon changes and the code is right**, which also
  resolves §10's alert inversion — the floor at 1150 now bites on the shipped
  default rather than looking like dead code.
- **TW-063** — the golden sweep feeds each engine only its own element's
  readings, so it is structurally blind to cross-parameter rules and could let
  Stage 6 break the magnesium gate without the fingerprint moving. **Still open,
  on its own terms, and untouched by either fold.**
- ~~**Insights**~~ (§25.5) — deliberately unspecified, may not survive.
  **Closed: it survives.** Four sections come out now and the rest is specified
  after 6f. The earlier read measured the surface's size and not its contents.

## Reconciled after the merge — 16 August

Two lists were written against this file on the same day and both are kept.

**Five of the six above are since answered by `stage-5c-last-items.md`** — the
6.9 dKH overlap, app-level notices going to Tasks, the volume ceiling, magnesium's
default band, and Insights, which survives. **TW-063 stands.** Stage 5c is a
staging document like this one and **is not folded into canon**; nothing in it
may be read as canon until it is.

**Four items are open on the other lineage** — the one `.agent/needs-dan.md`
items 12 and 13 carried, now item 14: what an **"N of M in range"** claim may
count (G-29); the **severity colours** meaning direction on one screen and tier
on another; the **two relationships `reef-chemistry.md` §30 did not settle**; and
**`settings.mgAlertLow`** (N-2). None blocks Stage 6.

**And one is decided here but not in canon: the parameter tile** (G-9, decision 1
above). It was open when the fold ran and closed by this file. It is carried at
item 14 as **decided, awaiting a fold** — not as a question for the owner, and
not as canon.
