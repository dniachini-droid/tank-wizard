# Stage 5c — The Last Open Items

Dan, 16 August 2026. Owner decisions. Closes the six items carried forward from
`stage-5b-remaining-items.md`.

**Nothing on the gap report's open list remains.** Stage 6 has everything it
needs.

---

## Folded into canon 16 August 2026 — and what this file now is

**This file is the decision record, not the reference.** All five decisions are
in canon: the card placement is `wizard-states.md` **§24.9** and **§24.23**; the
app-level notices' home is **§25.1** with **§25.6** item 3; the volume ceiling is
`reef-chemistry.md` **§9**; magnesium's band is **§2** layer 3, with the alert
inversion restated at **§10**; and Insights is **§25.5**. **Where this file and
canon differ, canon wins.**

Folded alongside `docs/spec/stage-6a-decisions.md` in one pass, since the two
overlap on magnesium: 5c moves the suggested band to 1250–1400 and 6a rules on
what a reading of exactly 1150 classifies as, and folding them separately would
have meant writing §10's arithmetic twice.

**§25.6's carried list is now empty of everything it came in with** — items 1, 2
and 3 close here, items 4, 5 and 6 closed in Stage 5b. Four new items are opened
by these two folds and are §25.6 items 7 to 10.

The implementation is filed as **TW-086** to **TW-090**, all untagged, plus an
amendment to **TW-052**, which this decision resolves in the code's favour.

---

# 1. The 6.9 dKH overlap — short card on the dashboard, full card in the wizard

Gap report §25.6 item 2, and the report found a third claimant the item did not
know about.

Three cards claim a reading below the safe floor:

| §24.9 | *"Alkalinity is very low at 6.8 dKH — this needs a correction unless you are deliberately holding it there."* |
| §24.23 | *"Alkalinity is very low at 6.9 dKH — bringing it to 8.5 would take about nine days at a safe rate"*, plus the return-plan offer |
| `far-out-<param>` | its own "dangerously low" title, `findings.js:243-277` |

**The third is already deleted** — "dangerously" is banned by §15, and D-4 covers
it. So the decision is between two.

**§24.9 on the dashboard. §24.23 in the wizard.**

The dashboard wants a glance; the wizard is where a plan gets set, and the
duration and the offer only matter once you are there.

This also removes `narrative-engine.js:457-459`, which is a hand-written regex
over the wizard's own English written to stop these two colliding. With a
placement rule they cannot collide.

---

# 2. Tasks is the home for everything the app wants you to do

Gap report G-34 and §25.6 item 3. Six notices are about the app rather than the
tank: no net volume set, solution strength missing, strength unverified,
testing sparsely, kit replaced, and the kit comparison.

**They were evicted from the tank summary and had nowhere to go.**

## The rule

**The tank summary tells you about your tank. Tasks tells you what to do about
the app.**

Every future notice sorts into one or the other without a decision, which is
the point — this list will grow.

Tasks already holds reminders the keeper creates. It now also holds what the
app notices. Same list, and **the tab carries a count badge** so nothing is
hidden behind a screen nobody opens.

## Two of them also appear inline

**No net volume set** and **solution strength missing** do not merely want doing
— they stop the app working. §16 and §17 make the app refuse a dose without
them.

So those two live in Tasks **and** show at the point of refusal, so someone
looking at a blank dose figure sees why rather than going hunting.

---

# 3. The volume ceiling applies per day, not per correction

Gap report §25.6 item 1. §9 says a correction needing more than about 1.5 L of
the maintenance solution is too big for it.

**§9's wrong-tool rule was already amended on 16 August** — the constraint is the
rate, not the product, and naming a faster alternative just makes an unsafe
change easier to perform. That left the ceiling looking redundant, since a plan
spread over nine days brings the daily volume right down.

**It still has one job.** Applied to a single day's dose rather than to the
whole correction: **if one day of a plan needs more than 1.5 L, the plan is too
aggressive**, however many days it runs.

A sanity check on a day's dose, not a trigger to reach for another product.

---

# 4. Magnesium's default band is 1250–1400

TW-052. The app ships 1250–1400; §2 layer 3 suggests 1275–1425.

**Canon changes. The code is right.**

This also resolves the alert inversion recorded in `reef-chemistry.md` §10 and
the engine plan's Stage 2b: magnesium's alert-low sat at 1125 against
`SAFE_BOUNDS`' 1150 **because** the shipped band's midpoint is 1325 rather than
1350. With 1250–1400 as canon, the floor at `magnesium-gate.js:63` is doing
exactly what §18 requires and the inversion is a consequence of the band, not a
fault in the gate.

---

# 5. Insights survives — and the earlier read of it was wrong

Gap report G-35 and §25.5, which deferred it with *"it may not survive."*

**It survives.** The inventory measured its size and not its contents, and the
contents are not what either the inventory or this conversation assumed.

## What is actually in it

Nine analysis blocks, and four of them exist nowhere else in the app:

- **Coral demand over time** — consumption on a rolling window with an
  uncertainty band drawn, per element, plus whether demand is growing.
- **Skeleton laid down** — the alkalinity consumed converted to grams of calcium
  carbonate a month, with the caveat that it includes coralline and abiotic
  precipitation.
- **Nutrient production** — what the tank generates, worked backwards from a
  logged water change and the level's movement, with the honest note that a
  steady nitrate level and a productive tank with matching export look
  identical.
- **Dose-strength calibration** — solving the solution strength from the
  keeper's own dose changes rather than the bottle's label, which is a direct
  attack on the risk canon calls the largest in the app.

**This is the analytical half of the app**, not a second copy of the history
modal.

## And it already contains the fix this project spent a week arriving at

The comment on the demand block:

> *"Deliberately NOT a dosing verdict. That call belongs to 'Should you adjust?',
> which uses a short window; this is the long view of how much the tank consumes
> and whether that demand is growing. Both were previously giving verdicts on
> different windows, which read as a contradiction."*

That is §25.2's structural fix, arrived at independently, before any of this
week's work. The dose-strength block does the same thing — it defers to the
wizard explicitly and says why: *"If the two ever read differently, follow the
Wizard — its result is what the dose recommendations are built on."*

**A screen that already knows it must not form a second opinion is not the
screen to delete.**

## Four sections come out now

Each contradicts a decision already made:

| **"Water change needed to hold a level"** | §29.6 — no suggested levers for nitrate or phosphate. This is a lever with a litre figure attached. |
| **The nutrient equilibrium projection** | Gap report D-6. A projection about an export regime the app cannot see. |
| **The target-range retarget offer** | §18's clause, withdrawn in favour of §28. The *"Your tank actually runs X–Y · Use this"* row goes. |
| **The N:P ratio block** | Canon has no ratio reasoning, and Randy Holmes-Farley calls the approach a myth: aim both nitrogen and phosphorus at their own levels, never at a ratio. |

## And it gets specified after 6f

Not before. It is the last unspecified surface, and specifying it while the
layer beneath it is being replaced would mean writing against something that is
about to change.

**§25.5 is amended:** Insights survives, four sections are removed, and its
specification is scheduled rather than deferred indefinitely.

---

# What this leaves

**Nothing on the gap report's open list.**

Two items are scheduled rather than open: **Insights' specification**, after
6f; and **what a task looks like** — Tasks is now the home for six app-level
notices and nobody has decided how a notice becomes a task, or how the two
kinds sit together in one list.

**TW-063 stands** — the golden sweep feeds each engine only its own element's
readings, so it is structurally blind to cross-parameter rules and could let
Stage 6 break the magnesium gate without the fingerprint moving. Its two
options are costed in the item and the decision is still open.
