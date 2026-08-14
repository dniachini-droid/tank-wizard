# Needs Dan

Decisions no agent may make. Newest at top. Dan clears this file.

---

## Open

### 8. §3's "user may tighten a rail" vs §21's rejection of a rate-tolerance Setup field — same-day self-contradiction

Found 2026-08-14 (manual-dose-auditor, adjudicator-confirmed). `reef-chemistry.md` §3
states a user may tighten (never loosen) a dosing rail, but no mechanism exists in code
to do so — `Setup.jsx` has no `maxDailyRise`/tighten/rateLimit field (`grep -rn
"maxDailyRise\|tighten\|rateLimit" src/components/Setup.jsx` → no matches), and neither
`rateLimitDose` (`alkalinity.js:351-379`, reads settings only for `dosePlausible`) nor
`safeDoseBand` (`safe-rate.js:43-48`, hardcoded `SAFE_DAILY_RISE`) consults a user value
at all. Live: `rate-rails.test.js` "a tighter user-configured alkalinity rail is not
honoured" fails — `settings.maxDailyRiseDKH: 0.2` is silently ignored and the app clamps
at the hardcoded 0.5 default regardless.

`wizard-states.md` §21 (the same-day decision on what belongs in Setup) explicitly
**rejects** a rate-tolerance field, on the ground that "Setup asks facts, not
judgements" and names a rate tolerance specifically as a non-fact — pointing instead at
§3's rate ceiling as the arrival point, i.e. the rail already settles it for everyone.
§3 and §21 were both settled on 2026-08-14 and now disagree on the same question: does
the user get to ask for a gentler rail, or does the rail itself already answer that for
everyone?

**Options, not a recommendation:**

(a) **§3 wins — build the tighten-only field.** A per-element rate-cap surfaced
somewhere in Setup (or an existing rail-adjacent settings screen), threaded as
`min(default, userValue)` through `rateLimitDose`/`safeDoseBand`. Cost: a Setup field
asking for the exact kind of number §21's own reasoning says Setup should not ask for
("a judgement, not a fact") — reopens the question §21 was written to close, for this
one field.

(b) **§21 wins — delete §3's "user may tighten" sentence.** The rail is a fixed fact,
not a per-user dial; a keeper who wants gentler correction gets there by not taking the
staged plan's fastest step (the wizard already offers a slower step in a staged plan).
Cost: a real use case named in §3's own original reasoning — a keeper whose corals react
badly to fast swings — has no path through the app at all, not even a manual one (manual
entry is capped by the same rail once TW-004 lands).

(c) **Point §3's sentence at the staged plan instead of a Setup field.** The rail's
ceiling stays one fixed number for everyone (satisfying §21), but the wizard's staged
step size already lets a user choose a gentler first step (`TW-036` territory) — if that
satisfies the "may tighten" intent, reword §3 to say so rather than implying a Setup
field. Cost: needs confirming the staged plan's steps behave like a genuine rate
tolerance and aren't themselves capped by the rail's speed rather than a separate
ceiling — not yet checked.

**Which direction being wrong hurts.** (a) wrong: Setup grows exactly the kind of field
§21 exists to keep out, and every other "fact vs judgement" line in Setup gets harder to
hold. (b) wrong: a keeper with corals that measurably react badly to fast alkalinity
swings has zero way to ask the app for a gentler correction — not dangerous (the rail
stays conservative), but it silently withdraws a control §3 promised in writing. (c)
wrong if the staged plan doesn't actually behave like a rate tolerance — unverified.

**What else must change.** Whichever way this goes, §3's sentence and §21's "non-fact"
list need to agree about this one feature — right now each references the other without
matching.

**In plain terms.** The spec says twice, on the same day, that a keeper worried about
fast alkalinity swings should be able to ask for a gentler daily limit — and also that
Setup should never ask a question shaped like that. Nothing in the app lets a keeper ask
for gentler today, either way, so it's moot for now — but the two sentences can't both
survive as written, and building toward one closes off the other.

repro: `grep -rn "maxDailyRise\|tighten\|rateLimit" src/components/Setup.jsx` → no
matches; `npx vitest run src/test/spec/dosing/rate-rails.test.js` — "a tighter
user-configured alkalinity rail is not honoured" → FAIL.

### 7. reading-meaning.js's invented vocabulary vs §13's band words — does "consistency over time" get its own registry, or fold into §13's seven?

Found 2026-08-14 (terminology-auditor, contradiction-hunter, adjudicator-confirmed).
`reading-meaning.js`'s `computeControl` invents six headline categories with no entry in
§13's band table — sliding/"Moving fast", loose/"Wide swing", dialled/"Dialled in",
controlled/"Well controlled", steady-off/"Steady, running high/low", drifting/"Drifting
high/low" — rendered at `Dashboard.jsx:467`, in the same modal as the official band
badge. One of the six, "drifting", collides head-on with §13's own defined word:
`reading-meaning.js:218` fires it when the window **median** sits outside the band; §13
defines drifting as **inside** the band, trending toward an edge. Live-reproduced
consequence: a tank whose current reading is safely in band (`paramStatus` "ok", teal)
can show "Steady, running low" in blue in the same modal, one tap away
(`scratchpad/drift-collision3.mjs`).

This is a chemistry-judgement question, not a rename: the six categories mix a
rate-of-change grading (is the parameter oscillating or holding steady over the test
window) with band-position grading (is the current reading in range), and it isn't
obvious the two should share one vocabulary at all.

**Options:**

(a) Give consistency-over-time its own registry section in §13/§15, with words that
cannot collide with band-position words even by accident. Cost: a genuinely new spec
section, and every existing `reading-meaning.js` label needs re-auditing against it, not
just "drifting".

(b) Fold consistency-over-time into the existing seven band-position words — describe
window behaviour using only §13's vocabulary, dropping the six invented categories
outright. Cost: may lose real information (a reading can be in-band and still have swung
wildly across the window, which today only "loose" says) unless §13's seven words get
new modifiers.

(c) Keep both vocabularies, but make it structurally impossible for them to describe the
same reading in the same view — gate which one renders on whether recent history is
coherent enough to trust median-based grading (close to what `TW-007`'s minimum-evidence
gate already asks for elsewhere). Cost: the most code, and doesn't by itself pick better
words.

**Which direction being wrong hurts.** (a) wrong if it's overengineered for a feature
nobody reads closely; (b) wrong if it silently discards genuine "your readings are
bouncing even though you're in range" information the seven band words cannot express;
(c) wrong if it hides the disagreement instead of resolving it.

**In plain terms.** There's a second, home-made vocabulary layered on top of the
official band words, and its one shared word ("drifting") means the opposite thing
depending on which screen you're reading. This needs a decision about whether "is your
testing pattern steady" deserves its own words at all, not just a rename.

Blocks `.agent/backlog.md` TW-037 (code-side fix), filed `[blocked]` pending this
decision.

### 6. One-line notes — 2026-08-14

Three small items, flagged rather than filed, each too small for its own workup:

- **Colour-registry gap** (contradiction-hunter). `PARAM_DEFS.phosphate.color`
  (`constants.js:33`) equals the app-wide danger red (`#C4285B`) — phosphate's header cap
  tints "danger" regardless of the actual reading. `PARAM_DEFS.potassium.color` equals
  `STATUS_COLOR.low` (`#926A09`) — same shape. Same kind of problem as §15's word
  registry, one level down (colours instead of words); worth a colour-registry entry the
  day §15 gets touched again.
- **"Notice" wording** (terminology-auditor). The same on-screen concept ships today as
  "Worth knowing about" (`Dashboard.jsx:619-620`), "Got it — hide this"
  (`DoseExpectation.jsx:175`, no noun), and "Hidden notes"/"Notes" (`Setup.jsx:478-491`) —
  and `TW-031`'s settled confirmation sentence will add a fourth ("notification").
  Reconcile Setup's "notes" and `TW-031`'s "notification" together when §15 next gains an
  entry.
- **"Target" rename** (terminology-auditor). "Target" is used for four structurally
  different concepts in one modal: the value the user types, the app's computed aim
  point, the whole band, and a synonym for in-band. A rename needs your sign-off before
  anything ships — noted here rather than filed as backlog work, since it's a
  registry/copy decision, not implementation.

### 5. `caClearlyOut`/`clearlyOut` compare a distance against a rate

Found while implementing §26 (position is the last reading) and left alone:
not authorised, and wrong in a way that predates the decision.

`calcium.js`'s `caClearlyOut` and `helpers.js`'s magnesium `clearlyOut` ask
whether the level is far enough past its band edge to count as "clearly" out:

```js
const caClearlyOut = above ? (posNow - def.max) > CA_TREND.stable
  : below ? (def.min - posNow) > CA_TREND.stable : false;
```

The left side is a **distance in ppm**. `CA_TREND.stable` is **5 ppm per week**
and `MG_TREND.stable` is **10 ppm per week** — rate constants, declared as such
in each engine's own comment (`calcium.js:28`, "ppm/week — below this, treat as
test variation"). The comparison is dimensionally wrong whichever measure of
position feeds it, so §26 neither caused it nor fixed it.

Alkalinity does not have the fault: `alkClearlyOut` compares against a literal
`0.2`, which is a dKH distance and is right.

**Not a recommendation, three options:** (a) leave it — the numbers happen to
be in a workable range for a ppm distance, and 5 ppm / 10 ppm past the edge is
not an unreasonable "clearly out" margin; the fault is that nothing says so and
the next person to move `CA_TREND.stable` for rate reasons will move this too,
silently. (b) Give each element its own named out-of-band margin constant, set
to today's effective values so nothing moves, which makes the coupling visible
without changing behaviour. (c) Point it at §5's kit noise floor instead
(10 ppm calcium, 30 ppm magnesium) — dimensionally correct and already the
constant family the app uses for "can the kit even see this", but it **triples
magnesium's margin** and is a real behavioural change needing its own sweep.

**In plain terms:** for calcium and magnesium, the app decides "this is clearly
outside your range, not just a hair over" by comparing how far past the edge
the level sits against a number that actually means "how fast it is moving in a
week". The two are different kinds of measurement, and comparing them is a
category error even though the numbers it picks are not silly. Nothing is
visibly wrong on screen today. The risk is future: someone adjusting how fast
counts as "moving" would, without knowing, also change how far counts as "out".

### 4. The one-off correction is still sized from the fitted value

`reef-chemistry.md` §26 moved every side-of-band question to the last reading.
It deliberately did **not** move `toMid` — the distance from the level to the
band midpoint that sizes a one-off correction — because that is a dose figure,
not a position test, and dose figures need their own authorisation
(AGENTS.md #3). Raised here rather than buried in the change.

`alkalinity.js:750`, `calcium.js:495` and `helpers.js:978`, same shape in each:

```js
const toMid = Math.abs(mid - fittedNow);
const oneOff = Math.round((toMid / effect) * 10) / 10;
```

**Why it is now inconsistent.** The card these figures print on states the
position from the last reading, quotes the last reading, and computes the gap
to the band edge from the last reading — then quotes a millilitre figure
measured from a different position. Two numbers in one paragraph, from two
places.

**Why it was fitted in the first place**, and the argument is a real one
(recorded at `alkalinity.js:743-749`): on a kit with 25 ppm of noise, whether
the last reading landed on the high or low side of the sawtooth moved the
correction by a third — 112 ppm against 85. A correction is a single act sized
once, so a noisy endpoint has nowhere to average out.

**What it would cost, measured.** Moving `toMid` to the last reading changes
**39 further golden rows** beyond §26's 172 — 211 against 172 — every one of
them a one-off correction volume. Worked examples from the sweep: alkalinity
18.5 → 13.9 mL, 20.4 → 14.1 mL, 12.0 → 7.40 mL. That is up to about a 40%
change in what a keeper is told to pour in one go.

**Options, not a recommendation:**

(a) **Move it, for consistency.** §26's principle reads naturally onto it — the
distance is measured from a position, and the position is the last reading. The
card becomes internally consistent. Cost: corrections get noisier, by exactly
the sawtooth argument above, and the noise lands on a single pour rather than
being averaged away.

(b) **Leave it, and say so on the card.** Keep the fitted sizing and its noise
argument, but stop the paragraph reading as though both numbers came from the
same place — the correction is sized from the trend, and the card can say that
in a clause. No dose figure moves. Cost: two measures stay live in one screen,
which is the shape of problem §26 exists to remove.

(c) **Size it from the last reading but keep a floor on how much a single
noisy endpoint may move it** — e.g. clamp `toMid` to within one kit noise floor
of the fitted distance. Cost: a new constant and a new rule, in a place that
currently has neither; worth being explicit that this is a third mechanism,
not a tidy-up.

**Which direction hurts.** (a) over-corrects on a high reading and
under-corrects on a low one, once, by up to a third on a noisy kit; magnesium
is worst, alkalinity least. (b) hurts nobody today and leaves a live
contradiction for the next person to find. (c) is the most correct and the most
code.

**In plain terms:** when the app tells you to add a one-off amount to bring a
level back into range, it works out how far there is to go from the trend line
through your recent tests, not from your last test. Everything else on that
screen now comes from your last test. So the sentence can say your level is
8.9 and 0.1 above your range, and then quote a millilitre figure worked out
from 8.6. Nothing is dangerous about it and the trend-line version is arguably
the steadier number — a single duff test cannot send you pouring a third too
much. But it is two different answers to "where is my tank" in one paragraph,
which is the exact thing the last decision was about.

### ~~3. §7's composition claim doesn't fully hold during an active correction~~ — closed 2026-08-14, see Decisions

Superseded rather than chosen between. The item offered three options and noted
that option (b) — unify the two disagreeing measures of position, probably on
`fittedNow` — was likely the smaller change. Dan's answer was that direction is
wrong and size is not the deciding factor: **position is always the last
reading** (`docs/spec/reef-chemistry.md` §26), implemented under that
authorisation.

**What that settles, precisely.** The mechanism this item described was two
measures answering one question — `doseDriftedFrom`'s (since-removed) raw
out-of-band check against grading's fitted `outOfBandWorsening`. There is now
one measure, so the disagreement cannot recur. On this item's own cited rows,
the app also stops being silent: `alkalinity|0.8|-0.02|7|false|true` held with
"Your current dose is matching consumption. Keep testing on your usual
schedule" against a maintenance figure of 9.72 vs a current 9.0 — the 8.0% gap
this item is about — and now adds "But it is holding at 8.9dKH, which is
0.108dKH above your range: a steady dose will keep it there indefinitely rather
than bring it back," with the matching next step.

**What it does not settle, stated rather than glossed.** The 12% dose-gap
trigger is untouched, so that 8.0% gap still does not prompt a dose
recalculation — the keeper is now told about the level, not about the dose.
Options (a) and (c) of this item were about the trigger, not the measure, and
§26 does not decide between them. If a moderate gap under a running correction
should itself force a recalculation, that is a separate authorisation and this
paragraph is where it starts. Filed here as the residue rather than left
implied by a closed item.


### ~~2. Negative-consumption refusal~~ — closed 2026-08-14, see Decisions

Decision 3's option (c) was wrong at the premise, not merely mis-calibrated.
The replacement rule is recorded below and in `docs/spec/reef-chemistry.md`
§24, and is implemented. The investigation that produced this item — the three
blocking checks the option-(c) attempt broke, and why — is left in
`.agent/log/2026-08-14-phase6-bugs.md`; it is the evidence the replacement was
written from, and the golden and protocol findings in it still stand.

### ~~0. The magnesium rail has two live values~~ — closed 2026-08-14, see Decisions

### ~~1. `reef-chemistry.md` §2 still uses the losing term~~ — closed 2026-08-14

The registry banned "water volume"; the old §2 heading (`## 2. Water volume`)
and its definition line still used it. Both were rewritten during the 14 August
canon swap, when that section was carried forward as **§17 Net volume** —
heading and definition line now read "net volume". This was not a fourth
unauthorised spec edit: the section was being rewritten anyway to survive the
swap, and the registry decision already settled the wording.

The only remaining occurrences of the phrase in canon are in
`wizard-states.md` §15's registry itself — the concept column and the never-use
column — where naming the banned term is the point.

---

## Decisions

### 2026-08-14 (latest) — Dan, spec owner: position is always the last reading

**Supersedes open item 3's option (b)**, which offered a choice between the two
measures and noted that unifying on `fittedNow` was probably the smaller
change. **It is the wrong direction, and size is not the deciding factor.**
Recorded at `docs/spec/reef-chemistry.md` §26 and implemented under this
authorisation.

**The rule.** Whether a level is in band, out of band, or at which edge is
answered by the most recent measurement, never by a fitted or projected value.
If the last reading says 8.5 and the band starts at 8.2, the level is in band —
on the upper edge, but in band. History is for trend, direction, consumption
and dose; it is never used to assert where the level is now. The app must never
state a position that no measurement supports.

**What was wrong, in the app's own words.** Every side-of-band test read
`fittedNow` while the sentence reporting it quoted the last raw reading, so the
shipped code produced "Alkalinity is below your range at 8.5dKH" against a band
of 8.2–8.8, "Calcium is below your range at 405ppm" against 400–450, and
"Magnesium is below your range at 1260ppm" against 1250–1400. The reverse ran
silently: a newest reading outside its band with a fitted value inside it
reached the "dose is matching consumption" card.

**What moved.** `inRange`/`above`/`below` in all three engines; `nearEdge`;
`alkClearlyOut`/`caClearlyOut`/`clearlyOut`; §11's grading, through the
position triple it takes; and `doseStatus`'s two position tests. **No threshold
moved** — the 0.2 dKH / `CA_TREND.stable` / `MG_TREND.stable` margins, the
12%-of-band edge proximity and every trigger percentage are untouched and are
simply measured from the last reading now. Already compliant and left alone:
each engine's emergency check, `correctionProgress`'s arrival zone, and
`proposeCorrection`.

**What it costs, measured against the 5,940-case golden sweep.** 172 rows
change — 163 alkalinity, 8 calcium, 1 magnesium — and **every one has a logged
correction**, the state that makes the two measures diverge. 54 rows go
`increase → hold`, and **29 of those have a last reading above the band**: the
app was recommending a larger alkalinity dose (9.0 → 10.6 mL/day, an 18% raise)
for a tank whose newest reading was 8.87 dKH. 40 rows change band grade, 36 of
them `mild → stable` and 4 `stable → mild` — those four all above band and
still rising, so grading got stricter where the reading is the worse news. One
card moves `idle → off-target`. **0 rows move the dose away from the band its
last reading is on**, in either direction, for any element. Fingerprint
`fbac65244f00ac9b → 83780c1728b67ca6`, re-recorded through `golden.js`'s
`UPDATE=1` after a row-by-row audit.

**One thing removed.** `doseStatus`'s "dose right, level off" card. It said what
the "steady, off target" branch above it already says and existed only because
the two branches measured position differently; with one measure the earlier
branch always returns first and the condition became unreachable. Proved
unreachable rather than assumed, and confirmed against the sweep: the single
card that changed state is one of these, and it now reads "Calcium is steady but
above your range" instead of "Calcium dose is matching consumption at 451ppm".

**Two things flagged, not changed** — both now open items 4 and 5 above. The
one-off correction volume (`toMid`) is still sized from the fitted value, which
is a dose figure and needs its own authorisation; moving it would change 39
further golden rows by up to about 40% of a pour. And `caClearlyOut`/
`clearlyOut` compare a ppm distance against a ppm-per-week rate constant, which
is dimensionally wrong whichever measure of position feeds it.

**Verification.** `npm run verify` green on every blocking check, including
`legacy-port:golden`, `legacy-port:protocols` and `legacy-port:invariants`
(6,000 assessments, 0 properties violated). `npx vitest run`: 62 failed / 313
passed against a measured baseline of 62 / 313 on the same tree — the failure
set compared by name, not by count: 0 new, 0 fixed.
`src/test/defects/position-is-last-reading.test.js` has 17 assertions; **all 17
fail against the code as it stood before the rule.** One test mirror moved with
the code and says so in place: `tests/legacy-port/invariants.js`'s "idle while
out of range" property measured "out of range" on `fittedNow` by design, and
that design is what changed — the property itself is unaltered.

**In plain terms.** If your test says 8.5, your alkalinity is 8.5. The app drew
a line through your recent readings to work out which way things were heading —
that part is right — but it was also using that line to decide where your tank
is *now*, and the line and the last test do not always agree. So it would tell
you "alkalinity is below your range at 8.5" when your range starts at 8.2, with
both halves of the sentence coming out of the same app. Worse, across the test
tanks it keeps, that mistake had it telling people to increase their alkalinity
dose — by nearly a fifth in one case — on a tank whose latest test was already
above the top of its range. It now holds. Where your tank is comes from your
last test, every time, on every screen; how fast it is moving and what to pour
still come from the whole history, because one test cannot tell you those.

### 2026-08-14 (previously latest) — Dan, spec owner: the calcium suggested default stays 425 ±25

**No spec change, no code change, no backlog item.** `reef-chemistry.md` §2
layer 3 keeps calcium at **425 ppm, 50 total (±25)** — 400–450. It is correct as
written and is not to be moved.

**What this closes.** `docs/journeys/journey-2-calcium.md` flagged it as a
possible mismatch: canon centres the suggestion "well below where he actually
keeps it." That reading is resolved — it is not a mismatch. 400–450 is where
most reefers target, and layer 3 exists to give a *new* user a sane starting
point, not to describe the owner's tank.

**What is recorded instead.** Dan runs **450–500** himself, and **anything up to
500 is tolerated** — layer 1's hard limits already permit it (calcium 350–500;
above 500 it starts pulling alkalinity down). But that is a **layer 2**
preference inside a user-set band, and a user preference inside the band is not
a reason to move the layer 3 suggestion. The two layers are doing different
jobs; this is exactly the distinction Dan drew himself about magnesium in
`journey-3-magnesium.md` — "up to 1500, even 1600 are safe, **but I wouldn't put
that in the app**" — personal tolerance is not published guidance. Journeys
README rule 4 (don't generalise from one tank) points the same way.

The journey now carries a resolved note at the paragraph that raised it. **Do
not re-raise.**

### 2026-08-14 (later still) — Dan, spec owner: negative consumption holds, it does not cut

**Replaces `routines/15-phase6-bugs.md` bug 2's authorisation** — Decision 3's
option (c), a refusal for any gain beyond the element's trend-noise floor.
That option was wrong at the premise and is withdrawn. Recorded at
`docs/spec/reef-chemistry.md` §24, cross-referenced from §6 and §12, and
implemented under this authorisation.

**Why the original was wrong.** It assumed a negative consumption means the
model has broken. It does not. **626 of the 6,000 random assessments in
`tests/legacy-port/invariants.js` produce one**, and the legitimate causes are
ordinary: a one-off correction, a water change with a richer salt, demand
collapsing, a wrong Setup strength, a bad reading, or a fast nitrate drop. The
legacy behavioural suite already knew this — `tests/legacy-port/protocols.js`
expects **`hold`** for magnesium §61, a reading whose consumption comes out at
−1.86 ppm/day. The previous attempt's golden and protocol regressions were the
suite saying so, not a calibration problem to be tuned around.

**The actual bug is narrower: the cut, not the clamp.** A forced
`maintenanceDose` of 0 against a real `currentDose` reads as a 100% gap to
`doseDriftedFrom`, saturating the 12% alkalinity and 30% calcium triggers
unconditionally, and the engine sizes a reduction from that zero — roughly 25%
on Decision 3's own worked alkalinity case (9.0 → 6.8 mL/day), toward a level
the arithmetic never diagnosed as excessive. That cut is the harm. The clamp
stays: a negative maintenance dose is not a thing anyone can pour.

**The rule, four parts.** (1) A negative consumption never sizes a dose change
— hold. (2) Report the observation, not a cause: the level is rising faster
than the dose accounts for, and the dose is unchanged; the app must not claim
to know why. (3) Ask what it cannot see — has a water change or a one-off
correction been logged? If not, this may be a testing error or a change in
demand; test again in two days. (4) Escalate on repetition, not on a single
instance: three consecutive negatives with nothing logged is a real signal,
most likely a wrong Setup strength or genuinely collapsed demand, and should
say so. The action stays `hold` throughout, escalation included.

**One qualification, and it needs Dan's eye.** A level at or over the top of
its range and still rising **keeps its reduction**. Without it
`protocols.js` **Mg §56** fails — 1480 → 1495 in a week, five ppm below the top
of its range, a gaining reading whose required answer is `decrease`. Decision 3
had already named suppressing that response as the one concrete regression risk
of any refuse-style fix. It is written in each engine's own existing vocabulary
(above the band with a positive trend, or `nearEdge === "upper"` where calcium
and magnesium already compute it); **no new threshold was invented.** It is
nonetheless a qualification the four-part rule does not state, and it is the
one thing in this change that goes beyond the words authorised — flagged here
rather than buried in a diff. The alternative was to break §56, which the
authorisation explicitly forbade.

**What it costs, measured against the 5,940-case golden sweep.** 1,206
assessments produce a negative consumption. **60 change** — 14 calcium, 46
magnesium, every one `decrease → hold`, audited row by row, and nothing else in
the sweep moves. 732 already held for another reason. 746 keep their reduction
under the qualification above.

**The golden fingerprint moved, by design:** `37ded9064e91e80e →
372fcda432be5bcf`, re-recorded through `golden.js`'s own documented `UPDATE=1`
mechanism after the diff was audited. That digest was also the proof that the
port matched `legacy/` byte for byte; **it no longer does**, and those 60 rows
are the whole of the difference. `legacy/` itself is untouched (AGENTS.md #9).
Worth knowing rather than discovering later.

**Also fixed, because it would have shipped a contradiction.** `doseStatus`'s
idle cards say the dose is matching consumption — "nothing to do, keep testing
on your usual schedule" — which would have printed directly under a wizard
asking for a retest in two days. A hold reached this way is marked and the card
now echoes the wizard. The `state` stays `"idle"`; no new state value was
introduced, so no consumer of that field changes behaviour.

**Verification.** `npm run verify` green, all blocking checks, including the
three the previous attempt broke: `legacy-port:golden`, `legacy-port:protocols`
(39/39) and `legacy-port:invariants` (6,000 assessments, 0 properties
violated). `npx vitest run`: 69 failed / 213 passed, against a measured
baseline of 69 failed / 200 passed on the same tree without this change — the
same 69 pre-existing `[chem]` failures, 13 new tests passing, none added.
`src/test/defects/negative-consumption.test.js` has 13 assertions; 12 fail
against the code as it stood before the rule.

**In plain terms.** Sometimes a tank shows more alkalinity, calcium or
magnesium than your dose can explain — a water change with a richer salt, a
correction you added, corals eating less, a wrong bottle strength, or just a
duff test. The app used to read that impossible sum as "you are dosing too
much" and quietly recommend cutting your dose by about a quarter, with nothing
on screen saying the maths had implied your tank was making alkalinity out of
nothing. Now it holds the dose and tells you what it actually saw, without
guessing why. It asks the one thing it cannot see — did you do a water change
or add a correction? — and if you logged one, it says so. If not, it suggests
retesting in two days. Three readings running with nothing logged and it says
plainly that the Setup strength is probably wrong or demand has really fallen
away — still without changing your dose. The single exception: if the level is
already at or over the top of your range and still climbing, you are still told
to dose less, because there it is the level talking, not the arithmetic.

### 2026-08-14 (later) — Dan, spec owner: the magnesium rail is 25 ppm/24 h

Settles the 25-vs-50 conflict the canon swap surfaced (open item 0, now closed).
The old canon said 50, set on 13 August; the merged draft written the same day
said 25. **25 wins.**

Recorded in `reef-chemistry.md` §3 with the reasoning, and worth repeating here
because the losing figure is the better-sourced one: **50 ppm/day is the Aqua
Forest magnesium label's own stated maximum daily increase** — not a guess, and
nothing in this decision calls it unsafe. **25 is the conservative figure, chosen
for consistency across the three rails.** Calcium sits at 20 ppm/day where BRS
allows 50 for large corrections; taking the manufacturer's ceiling for magnesium
while taking the conservative number for calcium would mean the rails were
picked on two different principles — the disagreement-between-numbers failure
this app keeps having. One principle, all three rails: the conservative number.

**Revisit if corrections prove too slow in practice.** The cost is days on a
magnesium correction — 150 ppm takes 6 days at 25 rather than 3 at 50. If that
becomes real friction on the tank, the label figure is there and §3 is the
paragraph to come back to.

Consequences, already applied: the UNRESOLVED note in §3 is gone, and
`.agent/backlog.md` TW-016 is unblocked and rescoped. It turns out to be smaller
than filed — `safe-rate.js`'s `CORRECTION_MAX_RATE` is *already* {0.5, 20, 25}
and needs no change at all, so the work is `correction.js`'s magnesium
`maxPerDay` of 100 (four times the rail) plus re-pointing `rails.test.js`'s
`SPEC_RAIL`, which still asserts the pre-13-August {0.5, 25, 100}. No
application code was changed under this authorisation.

### 2026-08-14 — Dan, spec owner (resolves Decisions 1, 2, 4 and 5 of `.agent/five-decisions.md`)

Authorised as owner. **Spec only — no application code was touched.** The
resulting code work is filed untagged in `.agent/backlog.md`.

**1. Which engine owns the drift response — the wizard, and only the wizard.**
(Decision 1, option (a).) The wizard recomputes `maintenanceDose` in full on
every assessment that clears the dose-gap trigger and stages a magnitude-banded
fraction of the recomputed gap. There is no flat percentage nudge in it and
never was. The flat 10%/15% that `reef-chemistry.md` §7 attributed to the app
belonged to `src/lib/analytics/drift.js`, a second engine with its own noise
floors and windows and no knowledge of staging, bracketing, rate ceilings,
plausibility or a running plan — **its dose figures are being removed**.
`assessDrift`, the slope classifier that emits no dose number, is not covered by
this. BRS's 10%-a-day advice is real and is not being disputed; it is simply not
what this app does, and BRS itself switches regimes past about 1.4 dKH.
Recorded at `reef-chemistry.md` §7, `wizard-states.md` §0.3 and §9.4.

Two things that fall out of it and still need doing: `previewStrengthChange`
needs a new source for the "Suggested dose … after" row at `Insights.jsx:697`,
and `DOSE_ADVICE_RULES`'s `magnesium` key contradicts `reef-chemistry.md` §10 by
omission — that one needs closing regardless of this decision.

**2. Water changes are not excluded from the trend fit.** (Decision 2, option
(a) on the boundary question; option (c) declined for now.) Only logged
corrections leave the fit, and they leave it by proportional subtraction over
three days, not by dropping readings or restarting the window. The reason is the
one already recorded in `src/lib/dosing/alkalinity.js:493-499` — restarting the
window weekly left the assessment one reading to work from and it answered
"hold" on tanks that were visibly draining — and the cadence arithmetic makes
the same failure worse, not better, for calcium and magnesium. Not settled, and
written into the spec as open: a mismatched salt mix can push a routine 10%
change to two or three times alkalinity's noise floor, and **no size threshold
anywhere distinguishes a routine 10% change from a 40% one**. Mathematical
subtraction is declined for now because `SALT_MIX` is hardcoded with no Setup
field to correct it, which would make a wrong baseline a silent input to a dose.
Recorded at `reef-chemistry.md` §6.

**3. Bracket memory is a flat 45 days, all three elements.** (Decision 5,
day-count sub-question, option (a).) The 30/60 split is withdrawn and so is its
"roughly two settle windows each" justification, which does not survive
arithmetic: two of alkalinity's settle windows is 4–10 days, not 30, and two of
calcium's is 14–60, with 60 only at the slow extreme. The 25% consumption
filter, not the calendar, is what catches staleness — 45 days costs 3.3% drift
on 30%/year growth and 6.0% at 60%/year, both far inside it. The directional
"widen never narrow" rule stays **open**, with its stated circularity
justification marked as not reproducing against the code's actual formula.
Recorded at `reef-chemistry.md` §8.3.

**4. A correction arrives in the middle third of the band, floored at twice the
noise floor.** (Decision 4, option (c), the noise-widened construction.)
`zoneWidth = max(bandWidth / 3, 2 × noiseFloor)`, clamped to the band, centred
on the midpoint; `correction-done` still needs two readings, now inside that
zone rather than anywhere in the band. The aim point is untouched — still the
midpoint, still a point and not a zone. The floor is on the zone's **total
width**; a bare middle third leaves 60% of calcium's and magnesium's zone inside
the kit's blind spot, and the floor brings that to 50%. Zones at the suggested
bands: alkalinity 8.40–8.60, calcium 415–435, magnesium 1320–1380. Recorded at
`reef-chemistry.md` §9 and `wizard-states.md` §4.

Also deleted under this authorisation, as instructed: the claim in both merged
drafts that **"consumption does not re-baseline until `correction-done`
clears."** No mechanism implements it — the analytics layer contains no
reference to corrections, plans or `arrived`. Deleted rather than restated as an
intention, because it was being used to argue that a narrower arrival test would
carry a real functional cost.

Three documentation corrections were made in the same pass, not decisions:
§8 now carries **the five constraints in their fixed order** (rounding, rate
ceiling, plausibility, bracketing, step cap) with the statement that order
changes the answer, replacing three constraints in a different order; §8.1 now
carries **the full staging table** from `calculation-spec.txt` §6, including
magnesium's absent rescue path and the 72 mL/day figure behind it; and the
middle-third self-contradiction — a middle-third heading with a full-band exit
condition two sentences below it, in both documents — is resolved by decision 4
above.

Wording note on decision 4: the authorisation said "the zone half-width is never
less than 2× that element's noise floor," which is the phrasing used in
`five-decisions.md` Decision 4. That document's own worked numbers (calcium
widening to 20 ppm, magnesium to 60 ppm, both at a 50% noise ratio) and its
stated rationale ("at least as wide as the noise band on both sides of a true
reading") are a floor on the **total width**, so total width is what is written
into the spec. Read as half-width instead, the zone would be 405–445 for calcium
and 1265–1385 for magnesium — 80% of the band in both cases, which would make
the narrowing nearly a no-op and amount to choosing option (a). Say the word if
half-width was meant literally; it is a one-line change in three places.

### 2026-08-13 — Dan, spec owner (resolves both items from run 2026-08-13-consistency-sweep)

**Magnesium rail: 50 ppm / 24 h.** `reef-chemistry.md` §6 — now §3 after the
14 Aug canon swap — changed from 100 to 50. Source recorded in the table: Aqua Forest magnesium label, "maximum daily
increase 50 mg/l (ppm)". Neither in-app table was right — `correction.js`'s
100 matched the old canon and now **exceeds** the rail; `safe-rate.js`'s 25 is
under it but is a hardcoded tightening, not a `[user]` one.

**Calcium rail: 20 ppm / 24 h.** `reef-chemistry.md` §6 (now §3) changed from 25 to 20,
noted in the table as matching the real-world sourcing cited in
`src/lib/analytics/safe-rate.js` (reefcalcs' 20 ppm/day safe rate). Both
in-app tables already agree at 20, so canon moved to the code here, not the
code to canon. The uniform constant drift is closed.

**Volume terminology: "net volume" wins.** `wizard-states.md` §15
registry row changed: the word to use is **net volume**; "water volume" joins
"tank size, volume, capacity" in the never-use column. `reef-chemistry.md`
already uses "net volume" throughout, so the losing file was the registry.
This is the file that wins on terminology going forward — do not re-raise.

Why these and not the alternatives: the rails are hard caps on how much goes
into a live tank, so each one now carries its own real-world source in the
spec rather than an unattributed number. "net volume" was already the majority
usage in canon and is the more precise of the two terms — "water volume" does
not say net.

Application source code was **not** touched under this authorisation. The
resulting code work is filed untagged in `.agent/backlog.md`.
