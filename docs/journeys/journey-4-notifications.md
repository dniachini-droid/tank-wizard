# Journeys — 4. Notifications

Dictated by Dan, 14 August 2026, from using the app.

Unlike journeys 1–3, this one is about **the app**, not the tank. It records
what he observed, what is wrong, and what he wants instead.

Raw material for Phase 8b — the findings, overview and briefing layer, roughly
1,559 lines with no specification of any kind.

---

## Where notifications appear today

**Three or more places, by design:**

- **The tank summary** on the dashboard — collapsed, expands to show everything
- **Under a parameter's graph** — click into alkalinity on the dashboard and
  relevant notices appear below the chart
- **The insights tab**

> *"Phosphate going out of range should appear in the tank summary, but it can
> also appear underneath the phosphate graph in the phosphate section."*

**Multiple placement is correct and wanted.** The bug is not that one notice
appears twice — it is that the two copies do not behave as one thing.

---

## What works

Hiding exists. A notice carries a hide button, and hiding it works locally.

The tank summary is the complete list. Everything live appears there, collapsed
by default.

The tank summary can unhide — all at once, or one at a time.

Hidden notices are listed in the Setup tab.

---

## What is wrong — five things

### 1. Hiding is not global

Hide a notice in one place and it should be gone everywhere. Today it is not.

> *"Wherever you hide it from, it should be hidden."*

### 2. Some notices cannot be hidden at all

Dose-change notices, and the notice left behind after cancelling a dose change,
have no hide control.

> *"There were some notifications that you couldn't actually hide."*

### 3. The hidden list grows without bound

Setup lists hidden notices, and nothing appears to remove them.

> *"I don't think there's a way for them to expire. I'm not sure. Does that just
> become a never-ending list?"*

### 4. Notices about the same thing stack instead of replacing

**The clearest example, and the heart of the problem:**

Calcium is climbing. A notice says *calcium is increasing, consider changing the
dose.* You go to the wizard and change the dose.

The tank summary now shows a correction in progress, test again in a few days.

**And the original notice is still there**, still saying consider changing the
dose. It is not false — calcium is still increasing — but it is stale, and it
contradicts the notice sitting next to it.

> *"That shouldn't show up. There should be another notification which says your
> calcium is increasing, but you've just changed the dose, so this is expected
> to go down. Test next in…"*

### 5. Two notices about one situation can disagree

Which is the same fault as 4, seen from the user's side. The app appears to hold
two opinions about one parameter at once.

---

## What Dan wants — the model

### One live notice per topic

> *"At any point in time I don't want multiple notifications existing for the
> same thing, especially having conflicting information."*

A notice has a **topic** — a parameter and a concern. Only one notice per topic
is live at any moment. A new notice about that topic **replaces** the old one
rather than joining it.

### The lifecycle, in his own example

| Stage | The notice |
|---|---|
| Alkalinity falling, nothing done | *Alkalinity is dropping — consider changing the dose* |
| Dose changed in the wizard | **replaced by** *Alkalinity is dropping, but you've just changed the dose. Test again in…* |
| Tested, back in range | **replaced again** by whatever is true now |

> *"So you're not stacking multiple notifications that have conflicting
> reports."*

### Replacement resets hidden

This falls out of the model and solves problem 3. Hidden belongs to the notice,
not the topic. When a notice is superseded, the old one is gone — including its
hidden state — so the fresh one appears.

**The hidden list stops growing**, because hidden notices are not kept forever.
They are replaced.

### One engine, every surface reads from it

> *"I'm not sure if there should be one central place which actually reads all
> the data, like a notifications engine, and then each section takes it from
> it."*

**Yes.** This is the single-source rule, arrived at independently for the third
time in this project — after the dose engines and the classifiers.

---

## What already exists

`findingKey`, `findingSignature` and `findingHidden` are all live exports in
`src/components/DoseExpectation.jsx`.

**Someone started building exactly this.** A key is identity; a signature is
what would make a notice count as changed. That is the topic-and-supersession
model in embryo.

**Before designing anything, find out what those three do today.** The
difference between "never built" and "built and not wired up everywhere" is the
difference between weeks and days.

---

## What this means for the spec

The findings layer needs a specification that states:

1. **A notice has an identity.** One live notice per topic per parameter.
2. **A new notice supersedes rather than joins**, and supersession clears hidden.
3. **Hidden is global.** Hiding on any surface hides on all.
4. **Every notice can be hidden.** No exceptions, including dose-change notices.
5. **The tank summary is the complete list**, and the only place that can
   unhide.
6. **Every surface renders from one engine.** No surface computes its own
   notice — same rule as `wizard-states.md` §7, which says the wizard owns the
   verdict and other surfaces echo it.

Point 6 means this is not a separate problem from the wizard one. It is the same
rule, applied to a layer that has never had a specification.

---

## Open questions for Dan

1. **What counts as one topic?** Is *"alkalinity is falling"* the same topic as
   *"alkalinity is out of band"*, or two? The answer decides how much
   supersession actually happens.
2. **Should a superseded notice be recoverable at all?** Once replaced, is the
   old one gone, or visible in history somewhere?
3. **What does Setup's hidden list become** once notices supersede properly? Is
   it still needed, or does the tank summary's unhide cover it?
4. **Should some notices be unhideable in the other direction** — a level
   outside safe bounds, say? Point 4 above says everything can be hidden, but a
   tank at 6.5 dKH might warrant an exception.
5. **Does hiding survive a reload**, and should it?
