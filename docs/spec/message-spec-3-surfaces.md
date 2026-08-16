# Message Specification — 3. The Surfaces

Dan, 16 August 2026. Owner decisions. Completes Stage 3 of
`THE-ENGINE-PLAN-v2.md`.

**Folded into canon 16 August 2026, and this file is now the decision record
rather than the reference.** Rule 7 is `wizard-states.md` §23.7; the missing
card is §24.22; the surfaces are the new §25, and the four carried open items
are §25.6. §15 gains **hide** and **off**; §22 gains the two rules the
steadiness panel now obeys; §7 and §14 gain pointers to §25. **Where this file
and canon differ, canon wins.**

Parts 1 and 2 settled the wizard. This settles everything that renders it.

**The wizard owns the verdict. No surface here forms its own.** Where a surface
appears to need a claim the wizard cannot supply, that is a gap in the wizard,
not licence to compute one locally.

---

# A missing card from part 2

The mirror of *still falling despite your dose change*, which was not drafted:

> **Alkalinity is still rising despite your dose change**
> 9.1 dKH now, up from 8.9 two days ago. You lowered the dose to 8.4 mL/day on
> the 14th and the rise hasn't slowed. It may need to come down further.
> **Open the dosing wizard →**

That completes all four contradiction states from journey 4b.

---

# Rule 7 — headlines do not name the parameter; the badge does

Every notice carries a parameter badge. So a headline that is a **fragment**
does not repeat the parameter:

*Too soon to tell · Not enough readings yet · Correction running · The
correction isn't working · Correction finished · Time to test · The correction
has run longer than expected · The change helped but hasn't gone far enough ·
The change went further than needed · You have logged one reading since your
dose change*

A headline that is a **complete sentence** keeps it, because removing it reads
oddly:

*Alkalinity is holding at 8.5 dKH · Alkalinity is in range but falling ·
Alkalinity is very low at 6.8 dKH*

The test is whether the sentence stands on its own, not whether the parameter
appears.

---

# THE TANK SUMMARY

## What it shows

**One notice per parameter, and nothing else.**

## The short form is generated, never written

The summary shows the **headline plus the first sentence** of the wizard's card.
It is not a separate wording.

This is already what `wizard-states.md` §7 requires, and it is the only way two
wordings cannot drift apart — there is only one.

Worked through every card:

| Headline | First sentence |
|---|---|
| Alkalinity is holding at 8.5 dKH | In your range of 8.2–8.8. |
| Alkalinity is in range but falling | 8.5 dKH now, down about 0.1 a day over the last three readings. |
| Alkalinity is steady at 8.0 dKH, below your range | Your dose is matching what the tank uses, so it will stay here. |
| Too soon to tell | You raised the alkalinity dose to 9.7 mL/day yesterday. |
| Not enough readings yet | Alkalinity is 8.5 dKH, in your range. |
| Your dose change is working | Alkalinity is up to 8.6 dKH from 8.3, in your range. |
| Alkalinity is still falling despite your dose change | 8.3 dKH now, down from 8.5 two days ago. |
| Alkalinity hasn't moved since your dose change | 8.5 dKH on the 14th, 8.5 now. |
| Alkalinity is very low at 6.8 dKH | This needs a correction unless you are deliberately holding it there. |
| Correction running | Alkalinity is 8.1 dKH, up from 7.6 when the correction started. |
| The correction isn't working | Alkalinity is 7.6 dKH, the same as when the correction started four days ago. |

Tapping a notice opens the full card.

## App-level notices do not belong here

No backup in three weeks, storage nearly full, a test kit expiring — these are
about the app, not the tank, and the summary is one notice per parameter.

**Likely home is Tasks**, since each is an action. **Not settled** — Tasks
currently handles reminders the user creates, and these are the app noticing
something, which may not fit the same list. Work through when Tasks is
specified.

## The three layers

**Collapsed** — the summary headline only.

**Expanded** — the live notices, one per parameter.

**Below those, a hidden section** — collapsed, listing what is hidden. Each can
be unhidden individually, which returns it to the live list, plus an unhide-all.

## Hidden and off are different things

**Hidden** is per notice and temporary. Hiding dismisses *that* notice. When the
situation changes and a new verdict supersedes it, **the notice reappears in the
live list automatically.** This is load-bearing: hiding must never silence a
situation permanently.

**Off** is per notice type and permanent, set in Setup, until changed again.

The escalation is deliberate. Hide it once; if it keeps coming back and you
never want it, turn the type off. The app does not ask up front whether you want
a class of notice — that is a judgement, and `wizard-states.md` §21 says Setup
asks for facts.

**This is the answer to the ultra-low-nutrient case:** someone running phosphate
at 0.02 deliberately would see the below-0.03 warning constantly. They turn that
type off. The app never asks "are you running ULNS?"

## Serious notices confirm before hiding

Per the 15 August decision: hiding a notice flagged serious asks *"This is
flagged as a serious notification. Are you sure you wish to hide it?"*, with a
line noting hidden notices can be brought back from the tank summary.

---

# PARAMETER CARDS AND THE HISTORY MODAL

## The contradiction that has to stop

On 16 August, using the app, Dan found a card saying **"alkalinity is rising"**
directly above a panel reading **WEEKLY DRIFT −0.50 dKH/wk**, with a chart
showing both. Both were true over different windows. Neither stated its window.
Nothing reconciled them.

**The fix is not wording. It is deciding what the steadiness panel is for.**

## The split

**The wizard answers: which way is it going, and what should happen.** It works
from the last few readings and it owns direction.

**The steadiness panel answers: how consistent has this been.** A longer window,
and a genuinely different question.

They never compete because they never make the same kind of claim.

## Two rules that enforce it

**The panel leads with its window**, as a heading rather than a label beside a
number:

> **Over the last 30 days**
> Wide swing — 1.1 dKH between highest and lowest. 18% of readings in range.

**The panel never uses direction words.** No rising, no falling, no climbing, no
drifting up or down. Direction belongs to the wizard. The panel talks about
spread, consistency and how much of the time a level sat in range.

That is the whole fix. Two headings, two time frames, no shared vocabulary.

## What was considered and not done

An explanatory line — *"this is a longer view than the advice above"*. Rejected:
if the panel needs a caption saying it is different, it is not different enough,
and the caption reads as clutter within months.

**Revisit only if the built screen still feels contradictory.** Fix the panel
before captioning it.

---

# THE READING CONFIRMATION

## What it shows

A receipt, then the wizard's full card.

> **8.5 dKH logged**
> In your range. Down 0.2 from two days ago.
>
> **Alkalinity is in range but falling** — down about 0.1 a day over the last
> three readings. Your dose of 9.0 mL/day is below what the tank is using;
> 9.7 mL/day would match it.
> **Open the dosing wizard →**

## Why the full card and not a pointer

Two lines above the fold are the receipt: the value, where it sits, how it moved
since last time. Below that, the wizard's card verbatim.

**The alternative was a pointer** — *"alkalinity is falling, see the dosing
wizard"* — and it was rejected because the app's whole shape is that things
surface where you are rather than making you go looking.

**And it does not become overload, because the card's length already scales with
how much there is to say.** When nothing is wrong it is two short lines:
*"Alkalinity is holding at 8.5 dKH — in your range of 8.2–8.8."* The
confirmation only gets long when something is actually happening, which is
exactly when it is wanted.

**Start here and tighten if it proves too much.** Easier to trim than to
discover it was needed.

## What it must never do

Form its own opinion. Canon §7 already forbids this and it is where journey 4's
worst example came from: a confirmation saying *"nothing to do"* while the
wizard asked for a dose change.

The receipt line may use its own voice about the **value**. The verdict is the
wizard's, rendered.

---

# FINDINGS

## Findings largely stop being a separate thing

`buildFindings` is 709 lines today with its own classifiers and thresholds, and
it is what produced the phosphate noise. Once the engine produces one verdict
per parameter, a notice is that verdict rendered — there is nothing left for a
separate findings engine to decide.

**Three kinds survive.**

## 1. The parameter's verdict

The engine's output, rendered. Covers every dosed and non-dosed parameter.

## 2. A suspect reading — belongs to its parameter

> **This alkalinity reading looks unusual**
> 7.2 dKH, 1.3 below your last reading two days ago. That is a larger jump than
> the tank has shown before. Worth retesting before acting on it.

## 3. Relationship notices — their own slot

The small set that genuinely belong to no single parameter.

> **Alkalinity and calcium are both falling faster than usual**
> Alkalinity down 0.15 a day, calcium down 12 ppm a week, both steeper than the
> last month. Consumption may have risen.

And the magnesium gate, which is about a relationship even though it names one
parameter:

> **Magnesium is low at 1180 ppm**
> Alkalinity and calcium corrections are held until magnesium comes up — neither
> holds properly below about 1250.

**These need their own slot in the summary**, since the summary is otherwise one
notice per parameter. How they are placed is not settled.

---

# INSIGHTS — unresolved

**Deliberately not specified.**

Dan does not yet know what he uses it for, and the inventory found it never
receives `doseStates` at all.

> *"We might even find out that we don't need it, to be honest."*

**Deciding what a screen should say before knowing what it is for is how
surfaces end up carrying their own opinions**, which is the problem being
removed. Revisit once the other surfaces are rebuilt and it is clear what is
left over.

It may not survive.

**It survives — 16 August 2026, Stage 5c**, and `wizard-states.md` §25.5 is the
reference. Four of its nine analysis blocks exist nowhere else in the app, and
the screen already carries §25.2's structural fix in its own comments. **Four
sections come out now** — the water-change lever, the equilibrium projection, the
retarget offer and the N:P ratio block — **and the rest is specified after 6f**,
scheduled rather than deferred. The paragraph above is kept because its reasoning
still holds for anything genuinely unspecified; what was wrong was the premise
that nobody knew what this screen was for.

---

# THE RULES, ALL SEVEN

Carried from parts 1 and 2, plus rule 7:

1. **State it, then show the basis.** A claim you cannot check is a claim you
   have to trust.
2. **Never speak in the first person.** No "I". "You" for the user's own
   actions.
3. **Mention the dose only when relevant** — just changed, being recommended, or
   explaining why no change is recommended.
4. **Units always**, in the parameter's own unit.
5. **Never speculate about causes.** Report what is observed.
6. **A recent dose change takes precedence in the wording.**
7. **Headlines do not name the parameter unless the sentence needs it.** The
   badge carries it.

---

# CARRIED OPEN ITEMS

Four, and none is settled. **All four are carried in canon at
`wizard-states.md` §25.6**, in this order, and are listed in
`.agent/needs-dan.md` under Open:

**§9's "wrong tool" rule.** Pointing at dry salt or a water change when a
correction exceeds ~1.5 litres contradicts the rate rules — a different product
does not make a fast change safe. The right answer is a gradual plan and an
honest duration. Whether the volume ceiling has any remaining role is open.

**The 6.9 dKH overlap.** Two cards claim that situation. Probably the short one
on the dashboard and the fuller plan card in the wizard, but not decided.

**App-level notices.** Out of the tank summary; Tasks is the likely home; the
fit is unproven.

**Where relationship notices sit** in a summary that is otherwise one notice per
parameter.
