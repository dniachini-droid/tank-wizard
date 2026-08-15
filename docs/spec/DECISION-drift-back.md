# Decision — Drift back, and what "clearly out" may govern

Dan, 15 August 2026. Owner decision. Two connected parts.

Part one corrects a decision made earlier the same day, before its consequence
was visible. Part two adds an instrument §1 currently says does not exist.

---

# Part one — "clearly out" governs wording, nothing else

## What went wrong

Yesterday's decision replaced three borrowed constants with named margins:
calcium and magnesium 50 ppm, alkalinity 0.5 dKH, up from 5 ppm, 10 ppm and
0.2 dKH.

The intent was to fix a category error — two of the three compared a **distance**
against a **rate** — and to stop a future change to trend thresholds silently
moving what counts as far out of range.

**The consequence was not intended and was not visible when the decision was
made.** `clearlyOut` feeds the `*Worsening` flag, and that flag gates whether
the app acts at all. PR #50's own audit records it: on a two-correction grid,
**40 of 70 changed rows withdraw a dose change**. Calcium at 384 ppm — sixteen
below a 400–450 band — went from recommending 13.1 mL/day to holding at 12.0.

So raising the margin made the app go quiet on levels that are genuinely out of
range. That is the opposite of what was wanted.

## The rule

**A level is out of band the moment it is past the edge by any amount, and that
is what decides whether the app acts.** 455 against 400–450 is out, and the app
responds.

**"Clearly out" is a wording distinction only.** It changes how the app
describes the situation. It may not gate a recommendation, suppress one, relax a
constraint, or change any figure.

The margins stand at 50 ppm, 50 ppm and 0.5 dKH — they were never the problem.
What they were wired into was.

## What this means for `*Worsening`

`clearlyOut` currently feeds §11's grading qualifier and, through it, §8.4's
step-cap relaxation and the act/hold decision. Those uses need re-sourcing.

**§11's grading is unaffected in principle** — a level outside its band and
moving further out is never graded stable, and that rule already tests band
position and trend direction. It does not need a margin at all. If it currently
takes one from `clearlyOut`, it should take band position instead.

**§8.4's step-cap relaxation is a genuine question** and is not settled here.
Relaxing the 25% cap is a stronger action than an ordinary change, and requiring
more than a bare edge crossing for it may well be right. But it must be sourced
from something chosen for that job, not from a wording constant.

Both need working up before implementation. **This decision does not authorise
choosing them.**

---

# Part two — drift back

## The instrument that was missing

§1 says a daily dose **holds** a level and a correction **moves** it, and that
conflating them is the source of most bad advice in reef software. That remains
true and is not withdrawn.

**But it is incomplete in one direction.** A level can be moved by the daily
dose — downward — by deliberately dosing under consumption and letting the tank
draw itself back. That is neither holding nor correcting. It is a third thing,
and reefkeepers do it routinely.

> *"If you're at 420, 430, 440, and then you go to 455 — you're not holding. You
> have to decrease your dose. Do you mean decrease your dose to match
> consumption, or decrease your dose to let it drift down?"*

## The two offers, and why "hold" is not one of them

When a level has climbed out of band, the current dose is above consumption by
definition — that is what made it climb. Leaving the dose alone means continuing
to climb. **Both available options decrease the dose. They differ in how far.**

| Offer | What it does | Where you end up |
|---|---|---|
| **Match consumption** | decrease to the point the level stops moving | parked at 455, out of band, stable |
| **Drift back** | decrease further, so consumption exceeds supply | walks down to the middle third, then returns to maintenance |

The smaller cut parks you where you are. The larger cut brings you home.

**Symmetrical in principle, asymmetrical in practice.** A falling level is
under-dosed, and the same two offers exist — match consumption to park it, or
over-dose to walk it up. But over-dosing to raise a level is close enough to a
correction that the existing instrument may serve; the downward case has no
instrument at all today, and is where this is needed.

## What drift back is not

**Not a correction.** A correction is a one-off or temporary elevated dose from
a known quantity, sized by §21's formula, delivered over days and verified on
arrival. Drift back adds nothing — it removes.

**Not a maintenance change.** It is deliberately wrong on purpose, and it has a
planned end.

**It is a temporary dose change with a return**, which is structurally closest to
a correction plan: it has a target, an expected duration, an arrival test and a
return dose.

## What it needs

Most of the machinery exists. Named rather than designed, because designing it
is implementation work:

- **A target.** The middle third of the band, per §9's arrival zone. Same
  reasoning: stopping at the edge leaves one week of drift from being out again.
- **A rate.** How fast it drifts is set by consumption, not chosen — the level
  falls at whatever rate the tank uses it, minus what is still being dosed. §9's
  "lowering is limited by consumption" already states this. So the app can
  offer a duration, and the user's only real lever is how far to cut.
- **A duration estimate**, which the user needs in order to choose. *"About nine
  days"* against *"stays at 455"* is the actual decision being made.
- **The §3 rails still apply.** A drift back must not pull a level down faster
  than the rail allows, which caps how deep the cut may go.
- **A return dose, recomputed not replayed** — §9's existing rule, for the same
  reason.
- **An arrival test**, and the same two-reading confirmation as §9.
- **Expiry on the calendar**, per §9. An unattended drift back must not run for
  a month.

## What is not settled here

- **Whether it is a new wizard state or a variant of the correction plan.**
  Structurally it is a correction plan with a negative delta, which argues for
  reuse. But §1's distinction is load-bearing and collapsing them may cost more
  than it saves. `wizard-states.md` §3's table gains a row either way.
- **Whether the upward case is built at all**, or whether an existing correction
  covers it.
- **How the offer is presented** — two buttons, a slider, or the wizard picking
  one and naming the other.
- **What happens if the user does nothing.** The level keeps climbing; whether
  the app escalates, and how, is unaddressed.

---

# Why these two are one decision

Part one stops the app going quiet on an out-of-band level. Part two gives it
something useful to say when it speaks.

Without part two, the app's honest answer at 455 is *"your dose is above
consumption, decrease it"* — which parks the tank out of band and calls that
finished. That is the `off-target` card, and it is the state Dan described as
the app not doing anything about a level that is out.

---

# Consequences

**PR #50 must not merge as it stands.** Its margins are correct; their wiring is
not. It needs reworking so `clearlyOut` affects wording only, with §11's grading
and §8.4's step-cap relaxation re-sourced or explicitly left as they were.

**`reef-chemistry.md` §1 needs amending** — the two-instrument model becomes
three, with drift back named and its downward-only asymmetry stated.

**§27 needs the wording-only constraint written into it**, so the margins cannot
be wired back into a gate by someone reading only that section.

**A backlog item for drift back**, untagged, with the unsettled questions above
recorded rather than answered.
