# Message Specification — 2. The Dosing Wizard, remaining cards

Dan, 16 August 2026. Continues `message-spec-1-wizard.md`. Same five rules.

**With this, the wizard is covered.** The other surfaces render these verdicts
rather than forming their own.

---

# One new rule

## 6. A recent dose change takes precedence in the wording

When a dose has recently changed, the card describes **the change and its
result**, not the bare position.

So `recovering` and `worsening` only appear when nothing has been done lately.
Below range and still falling with no recent change is one card; the same
reading after you raised the dose is *"still falling despite your dose change"*.
Below range and climbing after a raise is *"your dose change is working"*, not a
bare recovering card.

The reason: once a change is in play, the useful question is no longer *where is
it* but *did that work*. Answering the first when the second is available wastes
the card.

---

# The cards

## A correction has arrived — first reading inside

> **Alkalinity has reached 8.5 dKH**
> Back in your range. One more reading will confirm it's holding — it may still
> be rising.

**Direction-aware.** A correction that pushed upward risks continuing upward, so
it says *rising*; a downward correction says *falling*. The clause is the reason
§9 waits for two readings rather than one, so dropping it would lose the point.

## A correction has finished — second reading confirms

> **Correction finished**
> Alkalinity is holding at 8.5 dKH, in your range. Your dose is back to
> 9.0 mL/day.

Dose mentioned under rule 3 — it has just changed back.

## A correction is due a reading

> **Time to test**
> The alkalinity correction has run its expected three days. A reading today
> will show where it got to.

## A correction has overrun

> **The correction has run longer than expected**
> Nine days have passed with no readings on what should have been a three-day
> plan. A reading today will show where it got to.

## Out of range and coming back

> **Alkalinity is below your range but coming back**
> 8.1 dKH, up from 7.9 over the last three readings.

Only when no dose change is in play — see rule 6.

## Out of range and still going

> **Alkalinity is below your range and still falling**
> 8.0 dKH, down from 8.3 over the last three readings.

Only when no dose change is in play.

## The change helped, but not enough

> **The change helped but hasn't gone far enough**
> Alkalinity is 8.4 dKH, up from 8.1, still below your range. 10.2 mL/day would
> match what the tank is using.
> **Open the dosing wizard →**

## The change went too far

> **The change went further than needed**
> Alkalinity is 9.0 dKH, up from 8.1, now above your range. 9.3 mL/day would
> match what the tank is using.
> **Open the dosing wizard →**

## One reading in — not enough to say

> **You have logged one reading since your dose change**
> Alkalinity is 8.4 dKH. One more will show whether the change is working.

The fourth contradiction state from journey 4b. Does not exist today.

## Far out, beyond what the daily dose can reach

> **Alkalinity is very low at 6.9 dKH**
> Bringing it to 8.5 would take about nine days at a safe rate.
> **Plan a gradual return to 8.5 dKH →**

**No alternative product is named**, and this is a correction to how the app
currently thinks — see below.

The nine days is not a warning. It is what it takes, and the rate is the
constraint whatever product is used.

---

# A change to canon this surfaced

## §9's "wrong tool" rule needs revisiting

Canon says that where a correction would need more than about 1.5 litres of the
maintenance solution, the app says so and points at dry salt or water changes
rather than quoting an impossible volume.

**The half about not quoting an impossible volume is right. The half about
pointing at another product is wrong.**

> *"A dry buffer or a water change would be quicker" — not good, because corals
> don't like fast changes.*

The constraint is not the product, it is the rate. §3's rails apply however the
alkalinity gets there, so a different product does not make a fast change safe —
it just makes an unsafe one easier to perform. Naming it as the better tool
contradicts everything else the app says about rate of change.

**The right answer is a gradual plan and an honest duration.** Nine days is nine
days; the app should say so and offer the plan.

**What still needs deciding:** whether the volume ceiling has any role left. It
may be that a plan spread over enough days brings the daily volume back under
1.5 litres anyway, in which case the rule dissolves. Or the ceiling stays as a
sanity check on a single day's dose. Not settled here.

---

# One overlap to resolve

At 6.9 dKH a tank is below `SAFE_BOUNDS`, so the *very low* card from part one
also applies. Two cards claim the same situation.

**Not settled.** Either they merge into one card carrying both the urgency and
the duration, or the emergency card takes precedence on the dashboard and this
fuller version appears inside the wizard. The second is probably right — the
dashboard wants brevity, the wizard is where a plan gets set — but it needs
deciding.

---

# The wizard is now covered

Every state in `wizard-states.md` §2 has wording, plus the four contradiction
states from journey 4b that do not exist in code.

**Two open items** carried from here: §9's wrong-tool rule, and the 6.9 dKH
card overlap.

**Next surfaces**, in order of how much they matter: the tank summary, where
Dan's notification problem lives; parameter cards and the history modal, where
the rising-versus-falling contradiction appeared; the reading confirmation;
Insights; findings.
