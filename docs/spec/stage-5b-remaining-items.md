# Stage 5b — The Remaining Open Items

Dan, 16 August 2026. Owner decisions. Clears the open list from
`.agent/gap-report.md` Part 2 and the items carried from
`stage-5-the-numbers.md`.

**With this, nothing on the gap report's open list is unanswered.** Stage 6
proceeds.

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

# What is now closed

Every item on the gap report's open list, plus the two carried from tonight's
folds. Specifically: G-9, G-21, G-22, G-27, G-28, G-31, D-1, §25.6 item 4, the
headline tie-break, and the logged-correction case.

**Still open, and none of it blocks Stage 6:**

- **The 6.9 dKH card overlap** (§25.6 item 2) — three cards claim that
  situation, and the third was found by the gap report after the item was
  written.
- **App-level notices going to Tasks** (§25.6 item 3) — six finding ids, no
  home, and the fit is unproven.
- **§9's volume ceiling** (§25.6 item 1) — whether the ~1.5 L limit has any
  remaining role once a plan spreads a correction over days.
- **Magnesium's default band** ships 1250–1400 against §2 layer 3's 1275–1425
  (TW-052).
- **TW-063** — the golden sweep is structurally blind to cross-parameter rules,
  so Stage 6 could break the magnesium gate without the fingerprint moving.
- **Insights** (§25.5) — deliberately unspecified, may not survive.
