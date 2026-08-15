# Journeys — 5. Phosphate and Nitrate

Dictated by Dan, 15 August 2026.

The first journey about parameters the app does **not** dose. Read alongside
`.agent/backlog.md` TW-029, which records that both are currently assessed with
alkalinity's reasoning and calls it a defect.

---

## The headline: these are not dosed parameters

Alkalinity, calcium and magnesium all work one way — the tank consumes, you
replace, the app tunes the daily dose. Phosphate and nitrate are managed by
**export** (skimming, GFO, carbon dosing, refugium, water changes) and **input**
(feeding), not by a daily dose that replaces consumption.

So `maintenanceDose`, the dose gap, the rails and the settle window have nothing
to attach to. That is why borrowed reasoning produces nonsense — it is not the
thresholds, it is the whole shape.

> *"It should absolutely not be monitored with the same sort of stringency as
> alkalinity, calcium and magnesium, because that will just end up a
> nightmare."*

---

## Phosphate does not trend — it oscillates

The central point, and it removes a whole vocabulary:

> *"Mine oscillates. Mine goes up to 0.20, then down to 0.15, then up to 0.19,
> then down. It doesn't work like that."*

> *"If you have two phosphate levels that are on their way up, it doesn't mean
> it's going to continue to go up. It might go down again."*

**So: no rising, no falling, no "out of band and rising."** Direction language
is meaningless on a parameter that bounces this much, and applying it produces
confident statements about movement nobody could have measured — which is
exactly what TW-029 records the regression already doing.

### What replaces it — count, not slope

> *"Over the last three or four readings, three out of four were above band —
> showing your phosphate is probably too high. Or you're currently sitting above
> band, and the last three readings were above band."*

**This is a new mechanism.** Nothing in the app counts how many of the last N
readings sat outside a band. Everything else fits a line. For a bouncing
parameter, the count is the honest summary and the slope is not.

Two things it says that a trend cannot: *this is where you have been living*,
and *this is not one odd test*.

---

## The band is the user's, and the range of legitimate opinion is wide

Published guidance is 0.03–0.10 ppm. But:

> *"Some people run phosphate up to 0.20, even 0.30, 0.40. People have very
> different ideas of what phosphate level should be in their tank."*

So the band must be **freely editable**, and the app must not treat a user
running 0.25 as wrong. Wider than alkalinity's range of legitimate settings, not
narrower.

> *"If it is bouncing around, it should be more lax. It's just more of a
> measurement sort of thing."*

---

## The one hard floor: below 0.03

This is the only place Dan wants the app to speak firmly.

> *"I was stuffing around trying to get it really low and it went below 0.03 —
> it was like 0.01, which is not good for the corals at all. That should come up
> as a warning. Not an emergency. But it definitely should flag."*

**Warning, not emergency.** Worth looking at, not urgent — and he notes some
keepers would treat it as urgent, so the wording should not dismiss it either.

This matches the published position, which runs the opposite way to intuition:
zero starves corals and invites dinoflagellates, and *nutrients too low is worse
than nutrients too high*.

---

## Above band: options, briefly, and no dose

> *"If it's really high outside the band of what people said, then it should say
> these are your options. Just really briefly. It doesn't have to be a big deal,
> and not dose anything."*

The app names the levers and stops. It does not compute an amount, because there
is no amount to compute — the levers are GFO, carbon dosing, a refugium, more
water changes, less feeding, and they act over weeks, not days.

---

## Nitrate is not phosphate

Flagged by Dan and worth not flattening:

> *"Nitrate can be notoriously stable, or it can continue to rise."*

So nitrate has two characteristic behaviours — pinned, or climbing steadily —
where phosphate bounces. The count-based summary probably suits both, but
nitrate may support a genuine direction claim in a way phosphate does not.

**Open question 1: does nitrate get trend language where phosphate does not?**

---

## What this means for the app

1. **No dose, ever.** Neither parameter produces a millilitre figure. Whatever
   `far-out-*` and the dose paths currently do with them, they should not.
2. **No trend language for phosphate.** Remove it rather than retune it.
3. **A count-based summary instead** — how many of the last N readings sat
   outside the band, and where the current one sits.
4. **A freely editable band**, with a much wider range of legitimate settings
   than the dosed parameters.
5. **One warning that fires firmly: below 0.03 ppm phosphate.** Not an
   emergency; not silence either.
6. **Above band: name the levers, briefly, and stop.**
7. **Nitrate and phosphate are not the same parameter** and may not share a
   model.

---

## Open questions for Dan

1. **Does nitrate get direction language?** It can climb steadily in a way
   phosphate does not.
2. **How many readings in the count, and how many out of band before it
   speaks?** Three of four is his example; is that the rule, or an illustration?
3. **Is there an upper warning to match the 0.03 floor?** He named a firm lower
   bound and nothing above — is high phosphate ever worth a warning rather than
   just a band excursion, or is that entirely the user's business?
4. **Does nitrate have its own floor**, the way phosphate has 0.03? Published
   guidance says zero nitrate is equally bad.
5. **What are the levers, in his words?** The app should name them, and they
   should be the ones he would actually use rather than a list from a website.
