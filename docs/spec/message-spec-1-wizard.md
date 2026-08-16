# Message Specification — 1. The Dosing Wizard

Dan, 16 August 2026. Owner decisions. Stage 3 of `THE-ENGINE-PLAN-v2.md`.

**Folded into canon 16 August 2026, and this file is now the decision record
rather than the reference.** The five rules are `wizard-states.md` §23; the
twelve cards are §24; the dose-advice rule and the ordering rule are
`reef-chemistry.md` §28, rewritten the same day, with §1 amended alongside it.
**Where this file and canon differ, canon wins.** What is still open —
"Still to write", below — is unchanged and lives here until it is decided.

The wizard owns the verdict; every other surface renders it. So its wording is
settled first and everything else defers to it.

---

# The rules

Five, and they govern every card here and everything written later.

## 1. State it, then show the basis

One line saying what is happening, then the numbers it rests on.

Not because it reads better, but because **a claim you cannot check is a claim
you have to trust.** "Alkalinity is below your range" has to be believed;
"alkalinity is 8.0 dKH, below your range of 8.2–8.8, falling about 0.1 a day"
can be looked at and disagreed with. That is how Dan found the
rising-versus-falling contradiction on 16 August — by seeing the working.

This is the app's own principle made visible: it never asserts what it cannot
support.

## 2. Never speak in the first person

No "I", no "I'll know", no "I think". The app states what is true and what a
reading would show. It has no voice of its own.

"You" is used for the user's own actions — *"you raised the dose"* — which is a
statement of fact, not a conversation.

> ✗ One more reading and I'll know whether it worked.
> ✓ One more reading will show whether it's working.

## 3. Mention the dose only when it is relevant

The daily dose appears when it has just changed, when it is being recommended,
or when it explains why no change is being recommended.

It does **not** appear when nothing is happening. A card that says a level is
holding does not need to recite the dose that is holding it.

The third case matters: `off-target` has to say the dose is already correct,
because otherwise the card looks like the app failing to notice an out-of-range
level.

## 4. Units always, in the parameter's own unit

dKH for alkalinity, ppm for everything else. Every figure, every card.

## 5. Never speculate about causes

The app reports what it observes. It does not guess at why.

> ✗ Alkalinity hasn't moved in four days. Something is holding it down.
> ✓ Alkalinity is 7.6 dKH, the same as when the correction started four days ago.

Same principle as §29's no-levers rule: the app cannot see the tank, only the
numbers, and a plausible wrong cause is worse than no cause.

---

# The rule that changed the model

**Automatic dose advice only ever stabilises.**

Unprompted, the wizard recommends one thing: the dose that matches consumption.
It never recommends a dose above or below consumption in order to move a level.

> *"When alkalinity decreases, what I usually do is match my dose to consumption
> — to stabilise it first, not provide more than consumption. Once I've
> confirmed it's stable, then I can increase the daily dose slightly to bring it
> up."*

**Moving a level is always a plan the user opts into.** Up or down, symmetrical.
The app may offer it, but it is a separate choice and never folded into the dose
figure.

## The ordering rule

**Stabilise first. A return plan is only offered when the level is stable and
out of band.**

If a level is moving, the only advice is to match consumption. Offering a
deliberate move on top of an unintended one means neither can be judged — the
level would be travelling for two reasons at once and no reading could separate
them.

This makes the two mutually exclusive by construction: a dose-change suggestion
and a return-plan offer can never appear on the same card.

## What this changes in canon

**§28's drift back needed rewriting, and was rewritten the same day.** It
framed a level that had climbed out of band as a choice between two dose
figures — match consumption, or cut further to walk it down. Under this
decision the app offers the first as advice and the second as a plan, and the
same structure applies going up.

Drift back is not a special downward case. It is one direction of a general
mechanism, and the asymmetry §28 records — that downward has no additive and
upward does — is about *how* the plan is executed, not about whether it is
offered.

**Done:** §28 is now "Return plans — moving a level on purpose", §28.1 carries
the stabilise-only rule, §28.2 the ordering rule and its exclusion, and §1's
asymmetry is amended to say it governs execution. The one question §28 left
open on 15 August — whether the upward case is built at all — is closed by this
decision: it is, on the same terms.

---

# The cards

Alkalinity used throughout; the same shapes apply to calcium and magnesium in
their own units.

## Nothing to do

> **Alkalinity is holding at 8.5 dKH**
> In your range of 8.2–8.8.

No dose figure. Nothing is happening and nothing needs explaining.

## The dose no longer matches — the common one

> **Alkalinity is in range but falling**
> 8.5 dKH now, down about 0.1 a day over the last three readings. Your dose of
> 9.0 mL/day is below what the tank is using — 9.7 mL/day would match it.
> **Open the dosing wizard →**

The recommended figure is stated as *what would match*, not as an instruction.

## Steady, but in the wrong place

> **Alkalinity is steady at 8.0 dKH, below your range**
> Your dose is matching what the tank uses, so it will stay here.
> **Plan a gradual return to 8.5 dKH →**

The dose is mentioned under rule 3's third case — without it, the card looks
like the app has failed to notice.

**"Plan a gradual return"** rather than "bring it up": it names the destination,
and *gradual* says plainly that nothing is going to be forced.

This is the only card that offers a return plan, because it is the only state
where the level is both stable and out of band.

## Too soon to judge a change

> **Too soon to tell**
> You raised the alkalinity dose to 9.7 mL/day yesterday. One more reading will
> show whether it's working.

## Not enough data

> **Not enough readings yet**
> Alkalinity is 8.5 dKH, in your range. Two more readings will show which way
> it's going.

## The change worked

> **Your dose change is working**
> Alkalinity is up to 8.6 dKH from 8.3, in your range. Keep testing every couple
> of days until it settles.

## Still falling despite the change — new state

> **Alkalinity is still falling despite your dose change**
> 8.3 dKH now, down from 8.5 two days ago. You raised the dose to 9.7 mL/day on
> the 14th and the fall hasn't slowed. It may need to go higher.
> **Open the dosing wizard →**

One of the four contradiction states from journey 4b. Does not exist today.

## No response at all — new state

> **Alkalinity hasn't moved since your dose change**
> 8.5 dKH on the 14th, 8.5 now. You raised the dose to 9.7 mL/day two days ago
> and nothing has responded. It may need to go higher.
> **Open the dosing wizard →**

From journey 1: *"that's two days of an increased dose and it hasn't actually
moved — at that point I'd increase the dose further."* An expected response that
does not arrive is itself evidence.

## Very low

> **Alkalinity is very low at 6.8 dKH**
> This needs a correction unless you are deliberately holding it there.
> **Open the dosing wizard →**

**No mention of the safe floor.** It is a number the user did not set and cannot
change, so quoting it invites a question the card cannot answer.

**And the escape clause is deliberate** — same principle as every notice being
hideable. The app does not know why a level is where it is.

## A correction running

> **Correction running**
> Alkalinity is 8.1 dKH, up from 7.6 when the correction started. Heading for
> 8.5. Test again in two days.

## A correction that is not working

> **The correction isn't working**
> Alkalinity is 7.6 dKH, the same as when the correction started four days ago.

No speculation, per rule 5.

## Figures cannot be trusted

> **Alkalinity figures can't be trusted**
> The numbers imply a solution strength far from what's in Setup. Check the
> strength before using any dose figure here.
> **Open Setup →**

---

# Still to write

The remaining states follow the shapes above and need drafting rather than
deciding: `correction-done`, `correction-due`, `recovering`, `worsening`,
`overshot`, `fell-short`, and the "wrong tool" variant where a maintenance
solution cannot deliver a correction.

Two of the four contradiction states are still missing: dose lowered and still
rising, and movement not established.

Then the other surfaces — tank summary, parameter cards and history modal,
reading confirmation, Insights, findings — each of which renders these verdicts
rather than forming its own.

---

# One thing to check against the current app

Rule 2 forbids the first person. `narrative-engine.js` and `findings.js` should
be checked for it. If the app currently says "I" anywhere, that is a finding for
the rebuild rather than something to fix now.
