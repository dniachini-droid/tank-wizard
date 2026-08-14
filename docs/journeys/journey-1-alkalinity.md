# Journeys — 1. Alkalinity

Dictated by Dan, 14 August 2026. His actual practice, not the app's behaviour.

**This is a source document, not a specification.** It records what a
competent reefkeeper does. What the app should do about it is a separate
question, taken up at the end.

---

## The setting

Band 8.5–9.5 dKH. **But the real target is 9.0–9.5** — the band is what's
acceptable, not what's aimed at.

Tested at **9am**, always. Alkalinity consumption varies through the day, so
readings taken at different times aren't comparable.

**Cadence is adaptive, not fixed:**

| Situation | Interval |
|---|---|
| Normal | every 2 days |
| Two readings the same | stretch to 3 |
| Several readings holding | 4, then 5 days |
| Around a dose change | tighten, sometimes daily |

---

## Journey A — a slow rise, watched rather than chased

**Day 1.** 9.0 dKH. Nothing to do.

**Day 3.** 9.1. Up 0.1. Still nothing — one small move is not a trend.

**Day 5.** 9.2. *"Now I'm starting to think it might be going up."*

Two options here, and the second is what usually happens:

- a very small decrease in dose, or
- **wait one more test.** Two moves in the same direction is a signal; three
  is a fact.

**Day 7.** 9.3. Now it's real. Three readings, consistent direction.

**The calculation.** Using those three readings and the known solution
strength, work out what the tank is actually consuming, compare against what's
being dosed, and take the difference. That's the excess. Change the dose by it.

**Then wait two days before judging.** Best practice is a two-day gap after a
change — testing the next day is tempting and tells you little.

---

## Journey B — the change worked

Dose changed on day 7 at 9am. Test again day 9 at 9am.

**9.2.** Good.

**Day 11 — 9.2 again.** Two readings the same after a change. Confident now.

**Cadence relaxes.** Testing every 2 days becomes every 3, then every 4. After
several matching readings, five days is fine.

**The pattern: confidence buys interval.** Stability is what earns the right to
test less often.

---

## Journey C — the change undershot

Dose changed. Two days later, 9.1. Two days after that, **8.8**.

*"Okay, we're actually going down again."*

**The response is deliberately measured.** Recalculate consumption, then choose
a dose **higher than the current one but not back to the original** — aiming
for the middle rather than swinging between two wrong answers.

> *"I undershot it. So I'll do that. Because I wanna try and get in the
> middle."*

---

## Journey D — the fall, and what "no movement" means

**Day 1.** 9.0.

**Day 3.** 8.8. *"That's the first trigger that something's probably up."* Down
0.2. Noticed, not acted on.

**Day 5.** 8.6. Now it's clear — losing about 0.1 dKH per day. **Dose
increased.**

**Day 7.** 8.6. Unchanged. *"Okay, that's interesting."*

**Day 9.** 8.5. Down 0.1 — within test variation on its own.

**But this is the key judgement in the whole account:**

> *"I know that's within test variation, but now that's two days of an
> increased dose. It hasn't actually moved. So at that point I would increase
> the dose further."*

**A reading that hasn't moved is not neutral when a dose change should have
moved it.** Absence of the expected response is itself evidence. The dose goes
up again.

**Day 11.** 8.6. **Day 13.** 8.6.

*"That's the point I realise my coral consumption has probably increased."*

Not a dosing error — the tank changed. Demand grew.

---

## Journey E — climbing back, and when to stop

Sitting at 8.6, bottom of the band. The aim is back to 9.0.

**Gently.** 0.2–0.3 dKH per day is comfortable. A week to get there is fine.

**But then it stabilises at 8.7 and stays there.**

The reasoning:

> *"It's staying stable, it's just at the bottom of my band. But if it's
> stable, I'd make the call — even though it's at the bottom of my band, this
> is actually stable. I could change the dose again, but I'd be stuffing around
> too much, so I wouldn't change it."*

**A stable 8.7 beats a chased 9.0.** Below target, inside the band, holding
steady — leave it alone.

---

## What this reveals that the app does not currently do

### 1. Cadence is adaptive and the app's is fixed

The spec has a flat 2-day alkalinity cadence. Dan runs 2 days normally, 3 when
steady, 4–5 when confident, and tightens around a change.

The app could suggest the interval based on how settled things are. Right now
it says the same thing whatever the tank is doing.

### 2. Testing time matters and nothing enforces it

Every reading at 9am, because consumption varies through the day. Two readings
at different times aren't comparable, and a spurious 0.2 difference could
trigger a dose change that isn't warranted.

`minutesOf`, `dayPos` and `fmtTime` all exist in the codebase. Whether anything
uses them to warn about a reading taken at a different hour is unchecked.

### 3. "It didn't move" is a finding

Currently `stalled` only applies to a correction plan. Dan applies the same
reasoning to an ordinary dose change: *two readings after an increase, no
movement, increase again.*

That's a rule the app doesn't have — and it's the one that caught rising
demand.

### 4. Stability can outrank the target

The app assumes off-target means act. Dan's judgement is the opposite when the
level is holding: *stable and slightly low beats being chased toward a number.*

There is no state for "off target, but deliberately left alone." This is the
biggest philosophical gap between the app and its user.

### 5. One reading is notice, two is a signal, three is a fact

A consistent pattern throughout: the first move gets watched, the second gets
considered, the third gets acted on. The app's evidence gates are about
statistics; this is about patience.

### 6. Corrections aim for the middle, deliberately

When a change undershoots, the next dose sits between the old and the new — not
back to the start. Avoiding oscillation is explicit.

---

## Open questions for Dan

1. **Is 9.0–9.5 a tighter band, or a target inside a wider one?** The app
   currently has one band. Two concepts might be needed: where you aim, and
   where you'd tolerate.
2. **How far off the 9am hour before a reading isn't comparable?** An hour? Two?
3. **Does the same time-of-day rule apply to calcium and magnesium**, or is it
   an alkalinity thing?
4. **What makes you decide a stable-but-low level is acceptable** rather than
   worth one more nudge? Is it how long it has held, how far off it is, or how
   much stuffing around it would take?
