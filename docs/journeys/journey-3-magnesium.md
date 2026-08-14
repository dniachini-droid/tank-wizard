# Journeys — 3. Magnesium

Dictated by Dan, 14 August 2026.

**Lower confidence than the other two, and he says so.** He has rarely needed to
change his magnesium dose, so most of this is reasoning about what he *would*
do rather than a record of what he has done. Treat it accordingly.

---

## The setting

**Balling system.** The maintenance dose is set by parity with alkalinity:

> *"Whatever I'm dosing my alkalinity at the time — if I'm dosing 12 mL a day
> spread over the day, I'd dose 12 mL of magnesium. And that seems to hold it."*

**This is genuinely new.** Nothing in the spec says magnesium's dose is derived
from alkalinity's. The app treats all three as independent. In a balling
system, magnesium's dose is not calculated at all — it is copied.

**Drift is extremely slow.** 1400 to about 1520 over a long period, and not a
concern.

---

## Journey A — drifted high

Sitting around 1520. Not worried.

**The response is coarse, not fine.**

> *"If it's still the same level or higher on my next test, I'd just pause
> dosing magnesium for that period, or decrease the dose a lot."*

Pause entirely, or cut hard. **No attempt to calculate a precise new dose** —
which matches the spec's rule that magnesium's dose can't be tuned from
readings, arrived at from the other direction.

### The ionic-balance caveat

Breaking parity does disturb the balling ratio.

> *"Most reefers don't follow those ratios — they adjust them independently, and
> it's not a huge deal because you're doing water changes to replenish the ionic
> balance over time."*

Worth flagging for anyone dosing trace elements, since potassium is sometimes
dosed alongside magnesium. Low concentrations, slow movement, so not urgent —
but it should be *said*, not silently ignored.

---

## Journey B — drifting low

**Risk is asymmetric, and this is the core of magnesium.**

> *"High magnesium levels don't really matter up to 1500, even 1600. Lower
> magnesium levels obviously aren't great."*

So the two directions get different responses. High: shrug, pause the dose.
Low: act.

### A deliberate instruction about the app

> *"Up to 1500, even 1600 are safe — **but I wouldn't put that in the app.**"*

He tolerates high magnesium in his own tank and does **not** want the app
telling users it's fine. Personal tolerance, not published guidance, and it
shouldn't be presented as advice.

**This is a distinction the app needs to be able to make**: what Dan does, and
what the app should recommend, are not always the same thing.

### The trigger

Below **1350**, or below his own **1400** minimum, a correction is considered.

---

## Journey C — the correction

**Not from the doser.**

> *"That liquid is not concentrated enough. I'd mix up some other magnesium
> solution, or use a premix — Red Sea or Fritz Aquatics."*

**Confirms the spec's rule from practice**, and adds product names.

### How the correction is sized

At 1380, wanting 1450 — a 70 ppm rise.

> *"I'd spread the increase over a number of days, to align with the published
> literature for raising magnesium safely per day."*

And he expects the app to carry that figure:

> *"There's options — a very safe level and a more aggressive level, both within
> safe. I'd look online for that because it's well published."*

**So the app should hold the sourced rate and offer the pace**, rather than
making the user look it up. That is exactly the gentle / steady / quick model
already in the spec, and this is independent confirmation it's the right shape.

---

## What this reveals

### 1. In balling, magnesium's dose is copied from alkalinity's

Not calculated. Parity in millilitres. The app has no concept of this and would
try to derive magnesium's dose independently — which, per its own arithmetic,
it cannot do meaningfully anyway.

**This may be the actual answer to "how does the app set a magnesium
maintenance dose."** It doesn't. It copies alkalinity's, and offers to.

### 2. Risk is asymmetric and the band should not be

High magnesium is tolerated to 1500–1600. Low magnesium is not tolerated at
all. A symmetric band around a midpoint misrepresents this.

### 3. The response to "too high" is pause or cut hard, never fine-tune

Consistent with the dose being untunable from readings. When magnesium is high,
the honest options are stop dosing or halve it — not a computed adjustment.

### 4. Breaking parity has a consequence worth naming

Ionic balance, and trace elements dosed alongside. Water changes recover it
over time. Not urgent, but the app shouldn't be silent about it.

### 5. Dan's tolerance is not the app's recommendation

He explicitly does not want his own comfort with 1600 encoded as advice. The
app should carry published guidance, and let a user set their own tolerance
inside it — which is the three-layer model already agreed for bands and rates.

---

## Open questions for Dan

1. **Should the app offer magnesium-alkalinity parity as the default** for
   someone who says they run a balling system? That would be a Setup question:
   "are you running three-part balling?"
2. **Below 1350 you'd correct. What about 1300, or 1250?** Does the pace change
   with how far below, or is it always gentle because magnesium moves slowly
   anyway?
3. **When magnesium drifts high and you pause the dose** — how do you know when
   to resume? A test, a fixed number of days, or by feel?
4. **What should the app say about the ionic-balance effect of breaking
   parity?** A note, a warning, or nothing?

---

## Cross-cutting note — three journeys in

A pattern across all three elements: **the reasoning shape is shared, and the
thresholds are personal.**

- Watch, confirm, act — same everywhere, different intervals
- Stability outranks the target — same everywhere
- Big moves skip confirmation — same everywhere, different magnitudes
- Risk is asymmetric — but the direction differs by element

The app should implement the shape once, and hold the thresholds as settings.
That is the difference between an app for Dan and an app for reefers.
