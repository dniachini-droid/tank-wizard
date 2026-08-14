# Journeys — 4b. The Notification Matrix

Derived from Dan's dictated account, 14 August 2026. **Draft for his review.**

One live notice per parameter. Its content is whichever cell of this matrix the
parameter currently occupies. Move cell, the notice replaces itself.

---

## The three dimensions

**Position** — below band · in band · above band

**Movement** — falling · stable · rising · not established

**Dose state** — no recent change · changed, behaving as expected · changed,
contradicting the expectation

---

## Evidence rules

These decide when the app may claim movement at all.

### To establish movement from nothing: three readings

Three readings, in one direction, clearing the kit noise floor.

> *"If my alkalinity was 9.0 and the next reading was 9.3, that's only two
> readings. We can't really say it's rising."*

Two readings is a difference. Three is a trend. Until then, movement is **not
established** and the notice says so rather than guessing.

### To claim a dose change is being contradicted: two readings

A lower bar, deliberately. The dose change created an expectation, so breaking
it is informative straight away.

All four conditions:

1. Both readings dated **after** the dose change
2. At least **24 hours apart** — *"not taken the next day at a different time"*
3. Movement **substantial** — Dan's figure is 0.2–0.3 dKH, roughly 2–3× the kit
   noise floor
4. Direction **opposite** to what the change intended

### To claim a dose change is working: same two-reading rule

Movement in the intended direction, same conditions.

---

## The matrix — no recent dose change

| Position | Movement | The notice |
|---|---|---|
| In band | stable | *Alkalinity is in range and holding.* |
| In band | not established | *Alkalinity is in range. One more reading before I can say which way it's going.* |
| In band | rising | *Alkalinity is in range but rising.* |
| In band | falling | *Alkalinity is in range but falling.* |
| Below band | not established | *Alkalinity is below your range. One more reading before I can say which way it's going.* |
| Below band | rising | *Alkalinity is below your range but coming back toward it.* |
| Below band | stable | *Alkalinity is below your range and holding there.* |
| Below band | falling | *Alkalinity is below your range and still falling.* |
| Above band | not established | *Alkalinity is above your range. One more reading before I can say which way it's going.* |
| Above band | falling | *Alkalinity is above your range but coming back toward it.* |
| Above band | stable | *Alkalinity is above your range and holding there.* |
| Above band | rising | *Alkalinity is above your range and still rising.* |

**Note the wording shift when out of band.** Movement is described relative to
the target, not in the abstract — *coming back toward it* rather than *rising*.
Same cell, better sentence.

---

## The matrix — dose changed, behaving as expected

Append the confirming clause. The situation is unchanged; the reading of it is
different.

| Situation | The notice |
|---|---|
| Below band, rising, dose was raised | *Alkalinity is below your range and coming back. Your dose change is working — test again in two days.* |
| Above band, falling, dose was lowered | *Alkalinity is above your range and coming down. Your dose change is working — test again in two days.* |
| In band, falling, dose was lowered | *Alkalinity is in range and easing down, as expected after your dose change.* |
| In band, rising, dose was raised | *Alkalinity is in range and rising, as expected after your dose change.* |

---

## The matrix — dose changed, contradicting the expectation

**The most important row in the document**, and the one the app cannot produce
today.

| Situation | The notice |
|---|---|
| Dose raised, still falling | *Alkalinity is still falling despite your dose change. The increase hasn't been enough — consider raising it further.* |
| Dose lowered, still rising | *Alkalinity is still rising despite your dose change. The reduction hasn't been enough.* |
| Dose raised, no movement at all | *Alkalinity hasn't moved since your dose change. Two readings, no response — consider raising it further.* |
| Dose lowered, no movement at all | *Magnesium hasn't moved since your dose change. Two readings, no response.* |

**The "no movement" rows come from journey 1** and are Dan's own reasoning:

> *"I know that's within test variation, but now that's two days of an increased
> dose. It hasn't actually moved. So at that point I would increase the dose
> further."*

An expected response that does not arrive is itself evidence.

---

## Dan's worked example, traced through

**9.0 → 8.8 → 8.6**, one day apart each.

Three readings, one direction, movement clears the noise floor.

> **In band, falling, no dose change** → *Alkalinity is in range but falling.*

The wizard suggests raising the dose. It is raised.

> **In band, falling, dose changed** → *Alkalinity is in range but falling. You
> have just changed the dose — wait and test.*

**Three days later: 8.4.** Below band now, still falling, after a raise.

Two readings after the change, more than 24 hours apart, 0.2 dKH — substantial.

> **Below band, falling, contradicting** → *Alkalinity is now below your range
> and still falling despite your dose change.*

---

## What the app cannot do today

1. **Distinguish expected from contradicted.** There is no "despite your dose
   change" anywhere. A falling level reads the same whether you just raised the
   dose or did nothing.
2. **Say "not established."** The app either has a verdict or is silent; it does
   not say *one more reading and I can tell you*.
3. **Treat "no movement" as a finding** outside a correction plan.
4. **Word movement relative to the target when out of band.** *Coming back
   toward it* is a different sentence from *rising*, and the app has one.

---

## Open questions

1. **Does the notice replace itself as the parameter moves cell?** One notice
   per parameter, content driven by the cell — meaning supersession is automatic
   and nothing accumulates. Confirming this is what makes the model work.
2. **How long does "recent dose change" last?** Until the next reading? Until
   the settle window passes? Until the expectation is confirmed or contradicted?
3. **Is 24 hours right for the minimum gap**, given journey 1 says you always
   test at 9am? Two readings 24 hours apart at the same hour, or is 48 safer?
4. **Do calcium and magnesium use the same wording**, at their own scales?
5. **Should "still falling despite your dose change" also appear in the
   wizard**, or only as a notice? `wizard-states.md` §7 says the wizard owns the
   verdict and surfaces echo it — this needs to be one of the wizard's states,
   not a second opinion computed elsewhere.

**Question 5 matters most.** Get it wrong and this builds a sixth engine.
