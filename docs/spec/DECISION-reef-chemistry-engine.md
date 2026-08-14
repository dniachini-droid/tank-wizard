# Decision — The Reef Chemistry Engine

Dan, 14 August 2026. Owner decision. This is the canon entry TW-026 and TW-027
were blocked on.

---

## The decision

**One engine assesses every parameter. Every surface renders its verdict. No
surface forms its own opinion.**

It is called the **Reef Chemistry Engine**.

---

## What changes conceptually

Today the app has roughly five mechanisms producing dosing or stability advice,
and a findings layer that computes its own notices on top. Surfaces disagree
because they are each doing their own reasoning.

Under this decision there is one assessment step. Every parameter goes through
it. Every surface reads the result.

| Surface | What it shows |
|---|---|
| The dosing wizard screen | alkalinity, calcium, magnesium |
| The tank summary | every parameter |
| A parameter card | that one parameter |
| Insights | whichever it needs |

**The wizard is a screen, not the source.** It displays three parameters
because those are the ones you dose. The engine assesses all of them regardless
— phosphate, nitrate, salinity and the rest are assessed the same way and
simply not shown there.

That is the point of the change: there is nothing for the wizard to compete
with, because there is no second opinion anywhere.

---

## Why one engine rather than two

An earlier proposal was two engines — one for dosed parameters, one for the
rest, sharing a rule. Dan rejected it, correctly:

> *"What about the dosing wizard and notifications just coming from one
> location? The engine measures the alkalinity, calcium and magnesium levels,
> but everything else as well, including phosphate — it just doesn't display
> that in the dosing wizard. That way it's all coming from one spot and the
> wizard doesn't have to compete with anything."*

Two engines with one rule between them is still two engines that can drift.
One engine has nothing to drift against.

**This is the third time the single-source principle has been arrived at
independently on this project** — after the dose engines and the classifiers.

---

## What this does not mean

**Not one set of rules for every parameter.** Alkalinity, phosphate and
salinity behave differently and need different reasoning. One engine, per-type
logic inside it.

This matters because the current app has the opposite problem:

> *"I have noticed silly notifications of phosphate coming up and silly
> notifications of nitrate coming up, which don't make sense, because the wrong
> measurements are being applied to them — it's the same measurements as
> alkalinity and calcium."*

Phosphate bounces. It genuinely does. Applying alkalinity's trend logic and
thresholds to it produces noise dressed as findings. **That is a real defect,
not a display problem**, and it is filed as part of this work.

**Not a rebuild.** `deriveTankState`, `assessAlkalinity`, `assessCalcium`,
`assessMagnesium` and `doseStatus` already exist and are the best-tested code in
the app — 5,940 pinned cases, three-year simulations. The engine is those
consolidated and extended to the parameters they do not currently cover, not
something new written from scratch.

---

## Parameters the engine must cover

**Dosed, and already assessed:** alkalinity, calcium, magnesium.

**Assessed but with borrowed and wrong reasoning:** phosphate, nitrate.

**Needs its own treatment:** salinity.

**Different data source entirely:** ICP panels.

Each needs its own reasoning written before it can be assessed properly. That
is Phase 8b, item 4 of the five unspecified areas.

---

## The notification model this enables

With one verdict per parameter, the notification model from
`docs/journeys/journey-4-notifications.md` becomes almost free:

- **One live notice per parameter.** Its content is the engine's current
  verdict.
- **A new verdict supersedes the old notice** rather than joining it. Nothing
  accumulates, and the hidden list stops growing.
- **Hiding is global**, because there is one notice, not one per surface.

---

## Hiding — settled 14 August

**Every notice can be hidden. No exceptions, including safe-bounds
excursions.**

> *"If someone wants to hide a notification, they can hide a notification. There
> might be a reason the app doesn't know about."*

**Serious notices get a confirmation before hiding:**

> "This is flagged as a serious notification. Are you sure you wish to hide it?"

with a line noting hidden notices can be brought back from the tank summary.

**And a hidden notice resurfaces on the next reading that would trigger it.**
The new verdict supersedes the hidden one and appears unhidden. So hiding buys
you until the next test, never indefinitely.

No special case in the model — supersession already does the work. The
confirmation is a speed bump, not an exception.

---

## What this unblocks

- **TW-026** — the missing `doseStatus` states from the notification matrix.
  They belong in the engine, not in the notification layer.
- **TW-027** — every surface renders the engine's verdict. `findingKey`,
  `findingSignature` and `findingHidden` already provide identity,
  supersession and global hiding; they stop at the summary.
- **TW-028** — extend `wordingcheck` so a surface writing its own sentence
  fails the build. Without it, this decision erodes.

---

## New work this creates

- Phosphate and nitrate assessed with reasoning that suits them, not
  alkalinity's thresholds. **Filed as a defect** — the current notices are
  wrong, not merely unhelpful.
- Salinity assessed at all.
- The confirmation dialogue for hiding serious notices.

---

## The name

**Reef Chemistry Engine.** Usable in the spec, in the code, and in describing
the app to someone else.

`deriveTankState` remains the function that runs it. The name describes the
thing, not the call.
