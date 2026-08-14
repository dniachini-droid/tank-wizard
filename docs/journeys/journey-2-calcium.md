# Journeys — 2. Calcium

Dictated by Dan, 14 August 2026. His actual practice.

Companion to `journey-1-alkalinity.md`. This one records what is **different**
about calcium, not what is the same.

---

## The setting

**Tested weekly**, always just before a water change.

**Band 400–500. Real aim 450–500.** Same two-layer split as alkalinity — where
he'd tolerate, and where he'd like it.

> *"I'm quite happy at 490 even though it's the upper end, because we know 500
> isn't bad for the reef."*

**Water changes are ignored.** His salt mixes close to his tank level, and at
10% weekly the effect is inside the noise. He believes most reefers are in the
same position.

**Note for the spec:** canon currently says calcium 425 ±25, i.e. 400–450. Dan
runs 450–500. Not a conflict — the band is user-set — but the *suggested
default* is centred well below where he actually keeps it.

---

## Journey A — the ordinary drift

**Week 1 — 490.** Fine.

**Week 2 — 470.** Down 20. *"I'll probably just leave it, I'm not really sure if
that's just testing variation."*

**Week 3 — 460.** Now it's real. Two readings in the same direction.

**The calculation.** Look back over those two weeks, work out consumption,
adjust the dose.

**Week 4 — 470 or better.** Leave the dose alone.

**Week 5 — 470 again.** Confident.

**But testing does not relax.** Unlike alkalinity, weekly stays weekly.

> *"I would continue to be testing calcium every week anyway."*

---

## Journey B — when the picture is noisy, zoom out

490 · 480 · 490 · 470.

Four readings, no clear direction. Leave it and wait for another.

**470 again** — still leave it.

**460** — now act.

> *"Even though it's bounced up and down over the last four or five weeks, it's
> gone from 490 to 460. Even though it's gone up and down, I'm looking at a
> wider window."*

**This is the rule that separates calcium from alkalinity.** When readings are
noisy, the answer is not more readings at the same scale — it is a longer
window. The trend is real; it is just buried under kit noise at the weekly
scale.

---

## Journey C — magnitude can skip the confirming test

490 one week, **450** the next. A 40-point drop in a single week.

> *"I definitely would increase the dose. I wouldn't say, oh, I'll measure
> again."*

Sometimes a retest, but often straight to a dose change.

**So the two-reading rule is not absolute.** A large enough single move is its
own evidence. Small moves need confirming; big ones do not.

---

## Journey D — proximity to the edge shrinks the threshold

490 · 500 · 495 · **510**.

At 500 he does nothing, despite it being the top of the band. At 510 he acts —
even though that is only 10 further.

> *"Even though it's just tipped over and it's only twenty away from my level,
> I would most likely decrease the dose. My threshold for making a dose change,
> because I'm so close to the upper end, is less."*

**Tolerance is not uniform across the band.** The same 10-point move means
different things at 470 and at 505.

---

## Journey E — position changes how a trend is read

Band 400–500, currently sitting at **400** — the very bottom.

**Next week 420.** Leave it. *"That's not a very big calcium movement in a day,
and it doesn't really impact the corals."*

**Next week 450.** Still relaxed.

> *"Yes, there's definitely a trend going up. But I might be okay with that,
> because it's gone from the lower end of my band and it's just going up into
> the upper end. Calcium moves slowly."*

**Next week 470.** Now he knows he's over-dosing — *but it is still fine*,
because 450–500 is where he wants to be.

**The same climb from 470 to 540 would be an entirely different conversation.**
A trend heading *toward* your preferred range is not the same event as one
heading away from it, even at identical rate.

---

## Journey F — predict, then confirm, then calculate

Still in Journey E, sitting at 470 after 430 · 450 · 470.

> *"I would assume that based on my last three readings, my next week's reading
> should be, all things being equal, around 490."*

So: **wait one week to see whether the prediction holds.** If it does, look back
over the whole month and calculate consumption from that, then set the dose.

**Two things here the app does not do:**

1. **State the expectation before the reading arrives.** "If nothing changes,
   expect about 490 next week." That turns the next test into a check rather
   than a fresh surprise.
2. **Use the prediction being met as a reason to trust a wider calculation.**
   The month is only worth calculating from because the shape held.

---

## Journey G — how the consumption window is chosen

Two different shapes, two different methods.

**Monotonic** — 430 · 450 · 470 · 490, one direction throughout:
use the whole span, first to last.

**Bouncing** — 430 · 450 · 440 · 460 · 470:

> *"I would basically just calculate from the lowest dose to where it currently
> is over that, and essentially average what I've kind of given in."*

Anchor at the lowest point, measure to the current one, average across the
period.

**The app has one method for both.** It fits a least-squares slope across the
window regardless of shape.

---

## What this reveals

### 1. Noise is answered by a longer window, not more readings

Alkalinity: three consecutive readings, act. Calcium: when it's bouncing, widen
the window instead. The app's analysis window is fixed at 28 days for calcium
and does not widen in response to noise.

### 2. A big move skips the confirming test

40 points in a week gets acted on immediately. 20 does not. The app's dose-gap
trigger is a percentage and does not care whether the movement arrived in one
step or four.

### 3. Tolerance shrinks near the band edge

The same 10-point move means one thing at 470 and another at 505. The app
treats the band as a hard in/out boundary with uniform tolerance inside it.

### 4. Direction relative to the *preferred* range matters

Climbing from 400 toward 470 is welcome. Climbing from 470 toward 540 is not.
Identical rate, opposite meaning. The app has no concept of a preferred range
inside the band, so it cannot make this distinction.

### 5. Expectations are stated before the reading arrives

*"I'd expect about 490 next week."* This is the same idea as the dose-change
expectation we specced in `wizard-states.md` §8 — but applied to ordinary
watching, not only to dose changes.

### 6. The consumption method depends on the shape of the data

Monotonic uses the full span. Noisy anchors at the lowest point and averages.
The app fits a slope either way.

### 7. Calcium's cadence never relaxes

Alkalinity earns longer intervals through stability. Calcium stays weekly
regardless. Worth knowing before building an adaptive-cadence feature that
would try to stretch it.

---

## Open questions for Dan

1. **What size single-week move skips the confirming test?** 40 clearly does, 20
   clearly doesn't. Where is the line — and is it a fixed number or a fraction
   of the band?
2. **How near the edge does tolerance start shrinking?** Within 10 of the
   boundary? 20? Or is it purely about crossing it?
3. **Does the same wider-window logic apply to magnesium**, given it moves even
   more slowly and is tested every three weeks?
4. **Is the "anchor at the lowest point" method specific to calcium**, or would
   you do the same for a noisy alkalinity series?
