# Needs Dan

Decisions no agent may make. Newest at top. Dan clears this file.

---

## Open

### 14. The six that survive Stage 5b — 2026-08-16

Filed by the run that folded `docs/spec/stage-5b-remaining-items.md` into canon.
**Eight owner decisions cleared the gap report's open list** — ammonia's own
section, the notice ordering, the off switch's scope, `drifting`, the
"heading out of range" deletion, the kit-accuracy split in two parts, and the
negative-consumption suppression. **Six things are still yours**, and this entry
replaces items 12 and 13 as the live list rather than adding to them.

**Scope, stated so the count is not read wider than it is.** These six are what
is left of the gap report's open list — items 12 and 13's lineage. **Item 11 is
still open on its own terms** and is not counted here: its questions 1, 2 and 3
(§9's volume ceiling, the 6.9 dKH card overlap, where app-level notices go) are
carried in canon at `wizard-states.md` §25.6 items 1–3. Its question 4 closed
today with the ordering.

**1. What the parameter tile's chip shows (G-9).** Unchanged since Stage 5 —
deferred rather than decided. The tile turned out better than the code suggested
and its two real faults were the vocabulary split (now §15's **range**) and
bands that do not match canon's defaults.

**2. What an "N of M in range" claim may count (G-29).** And with it, what a
completely quiet tank's collapsed headline says, since all three of its slots
drop when there is nothing to report. The candidate recorded with the health
score's deletion — *"3 of 6 in range, 2 need attention"* — belongs to this
question and was not adopted.

**3. The severity colours mean direction on one screen and tier on another.**
§15's mapping is redone in the four registered colours; `paramStatus`
(`src/lib/dates.js:25-29`) still uses `low` for *under the minimum* and `high`
for *over the maximum*, on the wizard, the dose expectation, the reading context
and the backup export. Three options: move `paramStatus` to the tier reading;
keep direction there and stop using these four colours for it; or register a name
for the distinction. **TW-072 cannot be built until it is answered.**

**4. Two relationships `reef-chemistry.md` §30 deliberately did not settle.** How
§30.1's three-readings bar sits against `directional()`'s four-row statistical
gate where both could apply — §29.5 answered it for nitrate and only for nitrate.
And whether claiming a dose change **worked** uses §30.2's contradiction bar or
stays a stability question under §11; `wizard-states.md` §24.6 depends on the
answer.

**5. `settings.mgAlertLow` (N-2).** A live per-user override at
`src/lib/dosing/magnesium-gate.js:55`, with no Setup field and no canon entry.
§18 says alert thresholds are `[user]` adjustable; §21 says Setup asks facts, not
judgements, and names notification thresholds as a judgement. **The two read
against each other and the app has half of each.**

**6. What breaks an exact tie in §25.1's headline ordering.** Carried from item
13, and it now has a candidate it did not have. **Stage 5b's notice ordering
settles the same-shaped question one level down with a fixed parameter order** —
alkalinity, calcium, magnesium, salinity, nitrate, phosphate, potassium, ammonia
— which is a total order and would break this tie cleanly. **It is deliberately
not adopted**: the decision was made about the notice list, the headline's sort is
a different rule with a different subject, and extending one to the other is
yours. Recorded at `wizard-states.md` §25.6 item 6.

**Two things the fold derived rather than decided**, both written into §25.1 the
way §20's mapping of *serious* is — implementable, correctable in one line, and
not to be mistaken for a decision. **pH is not in the fixed parameter order**: it
names eight parameters and the app has nine, and pH produces notices (§31's *pH
high* and *CO2 signature*) despite having no alert tier, so it sorts last. And
**relationship notices order among themselves by the earliest parameter they
name**, because tier 3 needs an internal order for the same determinism reason as
the rest. **Correct either if it is wrong; neither is waiting on you.**

**In plain terms.** Six things left, and none of them is holding anything up.
Two are about what a screen says when nothing is wrong — the little chip on each
tile, and the line at the top when your whole tank is fine. One is a trap you
already know about: the four status colours mean "too low / too high" on some
screens and "out of range / needs attention" on others. Two are fine print in the
evidence rules you set on Sunday. And the last is what happens when two
parameters are exactly, identically out of range and the summary line has to name
one of them first — for which there is now an obvious answer sitting on the
table, which is the parameter order the notice list got today. Say the word and
it applies there too.

### ~~13. What the four late cards and the summary headline left open~~ — 2026-08-16, one closed same day, one carried to item 14

Filed by the run that folded five more owner decisions into canon —
`wizard-states.md` §24.24–§24.27 and §25.1's collapsed headline, answering
`.agent/gap-report.md` G-1 to G-4 and G-27. **Two items, both small, neither
blocking Stage 6c**, and both are also carried in canon at `wizard-states.md`
§25.6 items 5 and 6.

**~~1. Whether §24.24 gains a wording for a *logged* correction.~~ — closed
2026-08-16, Stage 5b.** **It does not, and it gains no sentence: the card does
not fire at all when a one-off correction is logged.** A logged correction is the
first of the six ordinary causes §24 itself lists, so where one is in the record
the arithmetic is explained and there is nothing to report. Part 3 is spent
entirely — no water change in either direction, no missing correction, no logged
one. `reef-chemistry.md` §24, `wizard-states.md` §24.24 and §25.6 item 5.

**2 is carried to item 14 as its item 6**, unchanged and still yours.

The original text of both, for the record:

**1. Whether §24.24 gains a wording for a *logged* correction.**
`reef-chemistry.md` §24 part 3 required the app to name a logged water change or
one-off correction where one exists. The water-change half is withdrawn outright
(§22 stopped subtracting them from consumption, so the app has nothing to say
about them). The correction half survives — naming something you told the app is
a fact, not a guess — **but the card written is the nothing-logged case**, which
is the one the three-consecutive escalation counts. Either the hold card takes a
second wording for the logged case, or part 3's first branch goes with the rest
of it. **Not decided, and an implementer may not pick.**

**2. What breaks an exact tie in §25.1's headline ordering.** Two parameters in
the same tier, the same fraction of their own target range out. The order has to
be deterministic — a headline that reorders between renders cannot be checked
against the tiles below it, which is the entire basis of the rule — and canon
does not say what breaks it. The tiles' own order is the obvious candidate and
was deliberately not chosen.

**In plain terms.** Two loose ends, and neither costs anything to leave for now.
When your tank gains alkalinity faster than your dose explains and you *had*
logged a one-off correction that morning, should the card mention it? And when
two parameters are exactly equally far out of range, which one does the summary
line name first? Nobody will notice the second until it happens; the first is a
sentence you may or may not want.

### ~~12. What Stage 5 left open when the numbers went into canon~~ — 2026-08-16, seven of twelve now closed; the rest are item 14

Filed by the run that folded `docs/spec/stage-5-the-numbers.md` into canon.
**Eleven decisions answered Part 1 of the gap report; these did not get
answered, and three more were surfaced by the fold itself.** None blocks Stage
6a, and every one of them is Dan's. **Two of the twelve are since closed** —
entries 1 and 4, the summary headline and the four cards with no state — by the
decisions recorded at the top of the Decisions section; both are struck through
below with what replaced them.

**The nine the decision itself carried forward:**

**~~1. The collapsed tank summary headline (G-27)~~ — closed 2026-08-16, see
Decisions.** Three slots — the worst thing now, anything else notable, anything
in flight — each dropped when empty, generated from the same verdicts the tiles
render. `wizard-states.md` §25.1. The candidate recorded with the score's
deletion (*"3 of 6 in range, 2 need attention"*) was **not** adopted; what it
depends on is item 8 below, which stays open.

**2. What the parameter tile's chip shows (G-9)** — deferred rather than
decided. The tile turned out to be better than the code suggested, and its two
real faults were the vocabulary split (now §15's **range** decision) and bands
that do not match canon's defaults.

**~~3. Ammonia needs its own chemistry section (G-22)~~ — closed 2026-08-16,
Stage 5b.** `reef-chemistry.md` **§32**. Two states — undetectable and
detectable — and not §13's seven bands, because its target is zero. Silence when
undetectable; one alert-tier notice on a single reading when detectable; no
trend, no steadiness verdict, no dose, no analysis window. The
`CONSISTENCY_RULES` entry and the second finding tier go with it. TW-079.

**~~4. The four cards with no state (G-1 to G-4)~~ — closed 2026-08-16, see
Decisions.** `due`, `worked` route 12, the negative-consumption hold and its
three-consecutive escalation, and the tested-but-inconclusive case are
`wizard-states.md` §24.24–§24.27. Two things moved with them: route 12 carries
§24.3's return-plan offer, closing `reef-chemistry.md` §28.6's second bullet, and
§24's parts 3 and 4 are narrowed so no card names a cause.

**~~5. Whether `drifting` produces a notice (G-21)~~ — closed 2026-08-16,
Stage 5b.** **It does not: `drifting` is a tile state and nothing else.** The
"heading out of range" finding is **deleted entirely**, recorded as a deletion
with its reason — it is a surface reconciling two time windows in prose, which
§25.2 replaced with a structural fix. `wizard-states.md` §13 and §25.4. TW-080.

**~~6. The kit-accuracy findings (D-1)~~ — closed 2026-08-16, Stage 5b**, in two
parts. **Alkalinity's is deleted outright** — ICP does not measure carbonate
alkalinity, so the comparison cannot exist. **Calcium's and magnesium's keep the
observation and lose the verdict**: *"your last three calcium readings sat 25%
above the lab panel"*, and nothing after it. 5% stays as the trigger; 25% goes
with the verdict it graded. `reef-chemistry.md` §19. TW-083.

**~~7. Notice ordering (G-28)~~ — closed 2026-08-16, Stage 5b.** Four tiers —
alerts, out of range, relationship notices, then a fixed parameter order
(alkalinity, calcium, magnesium, salinity, nitrate, phosphate, potassium,
ammonia). Proportional distance ranks the first two tiers; the fixed order breaks
ties. `wizard-states.md` §25.1. TW-081.

**8. What an "N of M in range" claim may count (G-29)** — which G-27's candidate
headline depends on.

**~~9. What a notice *type* is, for the off switch (G-31)~~ — closed 2026-08-16,
Stage 5b, and both halves of it.** **A notice type is a parameter**, and off
includes alerts and safe-bounds excursions — the same scope hide already has,
because the keeper ran the test and typed the number in, so the app is choosing
whether to comment rather than informing them of something they do not have.
**Relationship notices sit third of four tiers** in the ordering, which closes
§25.6 item 4 as well. `wizard-states.md` §25.1 and §25.4. TW-082.

**The three the fold surfaced, which are new:**

**10. The severity colours mean direction on one screen and tier on another.**
§15's mapping is redone in the four registered colours — calm, raised, alert,
ungradeable — because §22 needs an escalation that a direction-keyed mapping
cannot give. But `paramStatus` (`src/lib/dates.js:25-29`) already uses `low` for
*under the minimum* and `high` for *over the maximum*, on the wizard, the dose
expectation, the reading context and the backup export. **Same two colours, two
meanings, and this registry exists to stop exactly that.** Three options: move
`paramStatus` to the tier reading; keep direction there and stop using these four
colours for it; or register a name for the distinction. TW-072 carries it and
cannot be built until it is answered.

**11. Two relationships `reef-chemistry.md` §30 deliberately did not settle.**
How §30.1's three-readings bar sits against `directional()`'s four-row
statistical gate where both could apply — §29.5 answered it for nitrate and only
for nitrate. And whether claiming a dose change **worked** uses §30.2's
contradiction bar or stays a stability question under §11; `wizard-states.md`
§24.6 is the card that depends on the answer.

**12. `settings.mgAlertLow` (N-2), which Stage 5 did not reach.** A live
per-user override at `src/lib/dosing/magnesium-gate.js:55`, with no Setup field
and no canon entry. §18 says alert thresholds are `[user]` adjustable; §21 says
Setup asks facts, not judgements, and names notification thresholds as a
judgement. **The two read against each other and the app has half of each.**

**Superseded by item 14 — 2026-08-16.** Of this item's twelve, **seven are now
closed**: entries 1 and 4 the same day by the four-cards fold, and entries 3, 5,
6, 7 and 9 by Stage 5b. **Entries 2, 8, 10, 11 and 12 survive and are item 14's
first five.** Read item 14 for the live list; this entry stays for its reasoning.

**In plain terms.** Eleven questions about numbers are answered and written
down. Twelve things were still waiting on you, and the urgent one — the line
replacing the deleted score out of 100 — **you answered the same day**, so ten
remain. What it says is the worst thing first, then anything else worth
mentioning, then anything already under way, and it drops whichever of those
three is empty.

Two are traps rather than gaps. The app's four status colours currently mean
"too low" and "too high" on some screens, and the new rule needs them to mean
"out of range" and "needs attention" — the same amber meaning two different
things depending where you look, which is the exact fault the colour registry
was written to prevent. And your magnesium alert level can be overridden by a
setting that has no field to set it in.

The rest are the ordinary queue: ammonia still has no chemistry section of its
own, and the notice list still needs its ordering and its off switch settled.
The four situations with no card have theirs — that was the other one you
closed.

### 11. The four questions Stage 3 left open when the message specification went into canon — 2026-08-16

Filed by the run that folded `message-spec-2-wizard-remaining.md` and
`message-spec-3-surfaces.md` into canon. **All four are Dan's, none blocks
Stage 4, and all four are carried in canon at `wizard-states.md` §25.6** — this
entry exists so they are also in the file whose job is to hold them.

**1. Does the volume ceiling have any role left?** `reef-chemistry.md` §9 is
amended: where a correction exceeds the maintenance solution's reach the app no
longer points at dry salt or a water change, because the constraint is the rate
and a different product does not make a fast change safe. What survives is the
half that says never quote an impossible volume. **Open:** whether ~1.5 L stays
as a sanity check on a single day's dose, or dissolves because a plan spread
over enough days brings the daily volume under it anyway.

**2. Which card owns 6.9 dKH?** It is below `SAFE_BOUNDS`, so §24.9's *very
low* card applies; it is also beyond the daily dose's reach, so §24.23's plan
card applies. Two cards, one situation. The likely answer is the short one on
the dashboard and the fuller plan card in the wizard — brevity where you
glance, the plan where a plan gets set — **but it is not decided.** A second
question sits inside it: §24.23's offer uses the **return plan** phrase, while
`reef-chemistry.md` §28.2 offers a return plan only when the level is stable
and out of band, and §28.5 says the upward instrument is a correction. So that
card is either a correction wearing the plan's words, or §28.2's condition
needs widening.

**3. Where do app-level notices go?** No backup in three weeks, storage nearly
full, a test kit expiring. **Decided: they leave the tank summary**, which is
one notice per parameter and nothing else. **Open: Tasks is the likely home and
the fit is unproven** — Tasks today holds reminders the user created, and these
are the app noticing something. Work through when Tasks is specified.

**~~4. Where do relationship notices sit?~~ — closed 2026-08-16, Stage 5b.** The
notice ordering places them: **the third of four tiers**, after every alert and
every out-of-range parameter, before everything else, ordered among themselves by
the earliest parameter they name. `wizard-states.md` §25.1 and §25.4, and §25.6
item 4. **G-26's other question is not this one and is not closed by it** —
whether hiding a relationship notice hides it for both parameters is a question
about hiding, not placement.

The original text, for the record: *the small set that belong to no single
parameter — two parameters falling together, the magnesium gate — need their own
slot in a summary that is otherwise one notice per parameter.
`wizard-states.md` §25.4 has the wording; the placement is open.*

**One thing that is not on this list and is worth a line.** §22's `sliding`
verdict renders as "Moving up/down fast", and §25.2 now says the steadiness
panel never uses direction words. That is a drafting job constrained by a
decided rule rather than a decision — recorded at §22 and §25.2, not folded
into the four above.

### ~~10. Phosphate and nitrate now say less instead of saying wrong things — the rules that replace the silence are yours to write~~ — closed 2026-08-16, see Decisions

**All nine decisions answered.** Recorded as `docs/spec/reef-chemistry.md`
**§29**, under Dan's explicit authorisation for the spec edit. The
implementation is filed untagged as **TW-054** to **TW-060** and may not be
built without `[approved]`.

The nine, in the order this item asked them: bands and their wide legitimate
range (§29.2); the 0.03 floor, which wins over `SAFE_BOUNDS`' 0.01 because the
two answer different questions (§29.4); the count mechanism, three of the last
four (§29.5); phosphate loses direction language everywhere including the
stability layer's (§29.5); nitrate gets its own model with count *and* trend
(§29.5); the upper warning at nitrate 50, which restores the suspended
husbandry expectation at a corrected severity (§29.4); no levers — the reversal
of journey 5's "name the options" and the one place canon overrides the journey
(§29.6); the `correctionProgress` noise-floor unit question closed as
unreachable by design rather than resolved (§29.8); windows ratified at 14 and
28 days (§29.7).

**Two residues were named in §29.5 on the first pass, and Dan closed both the
same day**, before anything shipped: the count is **same side**, and nitrate's
trend bar is **three readings, one direction, clearing the noise floor** — not
the dosed elements' four-reading statistical gate, and the phrase "the same
evidence bar as the dosed elements" is withdrawn as loose wording. **Nothing in
§29 is open.** See the second Decisions entry for 16 August.

The workup below is left in place, per the file's habit: it is the statement of
the problem the decision answers, and its account of what TW-029 removed is the
starting state §29 was written against.

Filed 2026-08-15 by `routines/20-phosphate-nitrate.md`, the buildable half of
`.agent/items/TW-029.md` (executed on your 15 August instruction; branch
`claude/phosphate-nitrate-routine-7lovsr`). §25 settles **where** the reasoning
lives — the one engine — and deliberately settles **nothing** about its content.
What is missing is a canon section for each parameter sourced the way §2, §3 and
§5 are: a figure, and where it came from. `journey-5-phosphate-nitrate.md` is
quoted below as design input — your words, not published guidance.

**What was removed, so you know the starting state.** The two generic findings
loops no longer touch phosphate or nitrate (`src/lib/findings.js`,
`NUTRIENTS_AWAITING_OWN_RULES`): `far-out-<key>` (alarm scaled to the width of
the user's own band — at the defaults the low trigger sat at −0.040 ppm
phosphate / −5 ppm nitrate, unreachable by any kit, so 0.00 ppm phosphate said
nothing) and `heading-out-<key>` (a 30-day regression, 4–5 readings at their
cadence — the notices you dismissed on 10 and 11 August,
`fixtures/real-tank/dans-tank-backup-2026-08-12.json:2893,2902`). Still
speaking: band-position chips, stability grades (percent-mode, already
per-parameter), and the nutrient-specific findings (starved, ratio,
equilibrium, alk-vs-nutrients).

**One real cost, stated plainly rather than buried.** The best-practice suite
expected an urgent word at 80 ppm nitrate. The only path that ever produced one
was the removed loop, and canon has no nitrate upper-warning figure — §2's
safe-bounds table covers the three dosed elements only. That expectation is
suspended (`tests/legacy-port/husbandry.js`, comment in place) until you rule.
Until then, **nitrate at 80 ppm produces no urgent notice.** Decision 6 below
is where that gets fixed properly.

The decisions, each answerable separately:

1. **Phosphate's band and its legitimate range.** Published guidance 0.03–0.10
   ppm; journey 5: *"Some people run phosphate up to 0.20, even 0.30, 0.40."*
   Freely editable, wider range of legitimate settings than the dosed
   parameters — needs a §2-style entry saying so.
2. **The 0.03 ppm floor** — the one place you asked for firmness: *"That
   should come up as a warning. Not an emergency. But it definitely should
   flag."* Note the collision to resolve rather than average: `SAFE_BOUNDS`
   (code, sourced comments) puts phosphate's floor at 0.01 ppm; journey 5 says
   0.03. Which figure, which severity, what wording register.
3. **The count mechanism.** *"Over the last three or four readings, three out
   of four were above band."* How many readings is N, how many out of band is
   K, and is three-of-four the rule or an illustration? Nothing in the app
   counts this today — everything else fits a line.
4. **Direction language on phosphate — including the stability layer's.** The
   removed loops were the regression's voice, but the summary's `drift:` claims
   (`src/lib/narrative-engine.js:565-591`, sitting on the stability layer's own
   fold-mode rules, not on the borrowed loops — left in place) can still say
   *"Phosphate is climbing, not settling."* If count language replaces slope
   language, it replaces it there too. Your call whether that claim survives.
5. **Nitrate is not phosphate.** *"Nitrate can be notoriously stable, or it can
   continue to rise."* Phosphate binds to rock and sand and is strongly
   buffered; nitrate has no buffering mechanism at all (Randy Holmes-Farley's
   illustration: add 1 ppm phosphate and 100 ppm nitrate — nitrate rises the
   full 100, phosphate under 0.1). Does nitrate get trend language phosphate
   does not, and its own model?
6. **Upper warnings and nitrate's floor.** Is there an upper warning to match
   the 0.03 floor, for either parameter — the 80 ppm nitrate case above is
   this decision. And does nitrate have a floor of its own (published guidance
   says zero nitrate is equally bad; `SAFE_BOUNDS` carries 0.5 ppm, unsourced
   in canon)?
7. **The levers, in your words.** Above band the app should *"say these are
   your options. Just really briefly … and not dose anything."* Which levers —
   the ones you would actually pull, not a list from a website. No millilitre
   figure exists for either parameter today (neither is dosed, no strength, no
   dose path); worth a canon line saying that is by design so it stays true.
8. **The noise-floor unit question — decide before either parameter gets an
   engine.** `STABILITY_RULES` carries phosphate `noiseFloor: 0.02` and nitrate
   `1.0` in **percent** mode (a proportion); `correctionProgress`
   (`src/lib/dosing/helpers.js`) reads that field as an **absolute** value in
   the element's own unit. Latent today — neither parameter reaches the
   function; a warning comment now sits at the read site. Three options, each
   a different chemistry decision:
   - **(a) Read percent-mode floors as a proportion of the band** in
     `correctionProgress`. Keeps one table; wrong if the arrival-zone concept
     itself never applies to undosed parameters, in which case the code grows
     a branch nothing should ever take.
   - **(b) Give `correctionProgress` its own per-parameter floor table.**
     Cleanest separation of "stability noise" from "arrival tolerance"; wrong
     if the two really are the same idea, in which case two tables drift the
     way the three engines did.
   - **(c) Give phosphate an absolute ppm floor in `STABILITY_RULES`.**
     Simplest; wrong if percent mode is the honest model for a proportional
     parameter (journey 5: *"If it is bouncing around, it should be more
     lax"*) — an absolute floor at 0.20 ppm behaves very differently than at
     0.05.
   Getting this wrong hurts quietly: a misread floor sets phosphate's arrival
   zone to 57% of the band where §9 asks for a middle third — corrections
   would declare arrival far too early.
9. **Windows and cadence, ratified.** The stability layer already treats
   phosphate as 14-day/percent and nitrate as 28-day/percent
   (`stability-engine.js:51-52`) — the right shape, per journey 5, but
   unsourced in canon. A §4-style row each would make them canon rather than
   habit.

**In plain terms.** The app was judging your two nutrient levels with the
alkalinity ruler, and that produced the silly warnings you noticed — including
one absurdity: the "dangerously low" alarm for phosphate was set below zero, a
reading no test kit can produce, so phosphate at absolute zero (genuinely bad
for corals) said nothing at all. That ruler has now been taken away from those
two. The app still shows where each reading sits against your band, still
grades steadiness, and still warns when both nutrients are near zero together —
but it no longer claims either is "heading out of range" or "a long way out".
The gap is that until you write the real rules, it says less than it should:
most importantly, very high nitrate no longer gets an urgent word, and very low
phosphate still gets none. The nine questions above are the rules to write —
where the firm floor sits, how many high readings in a row matter, whether
nitrate may be called "rising" when phosphate never should, and what options
the app should name when a level runs high. Each can be answered in a line or
two, and none is answered for you.

### ~~9. `PARAM_DEFS.alkalinity.color` is byte-identical to `STATUS_COLOR.ok` — the mirror of the phosphate fault~~ — closed 2026-08-15, see Decisions

Resolved as **option (a) — leave it.** Alkalinity's brand colour does **not** change.

This item was first closed the same day as option (b), "alkalinity moves too", and
that reading was **reversed later on 2026-08-15** once the filing work showed what
`#0B7C86` actually is. Both entries are in Decisions; the later one supersedes the
earlier one and says so. Recorded this way rather than overwritten, because the thing
that changed was the evidence, not the owner's mind about the principle.

What settled it: `#0B7C86` is not merely `STATUS_COLOR.ok`. It is also
`STABILITY_COLOR.green`, the `dialled` verdict tone, the `tight` consistency colour,
and the app's own brand teal — **134 sites across 23 files.** Moving
`PARAM_DEFS.alkalinity.color` alone would take alkalinity's chart out of the house
palette to solve a problem the badge beside it already covers, and **TW-037's alert
tier is the proper answer to "an alarming reading must not look calm."**

Option (c) — extending §15's colour registry to the verdict tones, which would have
pulled in nitrate and salinity — was **not** taken either, in the first pass or this
one. Those two stay exactly as they are.

**Phosphate and potassium are not touched by this.** They stay changed under TW-044.
Their harm points the other way — a healthy reading drawn in the alarm colour — and
the badge does not rescue them. The asymmetry is the whole reason this item resolves
differently from the two it was filed alongside.

TW-046 is closed as decided-against, under Done in `.agent/items/`, with its
evidence kept. The workup below is left in place for the same reason: its framing of
the two directions of harm is exactly what the decision turns on.

Found 2026-08-14 while applying the colour half of decision 4, and **not covered by
it**. That decision named phosphate (`#C4285B` = danger red) and potassium (`#926A09`
= low amber) and both are settled. A third collision is live and was not named:
`PARAM_DEFS.alkalinity.color` (`src/lib/constants.js:26`) is `#0B7C86`, byte-identical
to `STATUS_COLOR.ok` (`src/lib/dates.js:31`).

The direction of harm is the **opposite** of phosphate's, which is why it is asked
rather than assumed. Phosphate's fault makes a healthy chart look like an alarm;
alkalinity's makes every alkalinity chart carry the colour that means "in range",
including on a tank whose alkalinity is at alert-low. Decision 4's stated reason —
"so a healthy chart cannot look like an alarm" — does not reach this one, and the
reverse ("an alarming chart must not look healthy") is arguably the worse of the two,
so it is not for an agent to extend the decision by analogy.

Two nearby cases, listed so the question is asked once: `PARAM_DEFS.nitrate.color`
`#2A8050` equals the `controlled` verdict tone and `PARAM_DEFS.salinity.color`
`#1D6FA5` equals the `steady-off` tone (`reading-meaning.js:211,215`). Those are
verdict tones rather than `STATUS_COLOR` entries, so they sit outside the registry
rule as written in §15.

**Options:** (a) leave all three — brand colours are identity, not status, and the
badge beside the chart already carries the status; (b) move alkalinity only, on the
"alarming chart must not look healthy" ground, which needs a colour clear of teal,
cyan (`ph` `#2AA7B0`) and the ok teal at once; (c) extend §15's colour registry to
verdict tones as well as `STATUS_COLOR`, which pulls in nitrate and salinity and is
three more colours to choose.

**In plain terms.** Your alkalinity chart is drawn in exactly the same green-blue the
app uses to say "this is in range" — so it is drawn that way even when your
alkalinity is not. Phosphate had the same fault pointing the other way and you have
fixed that one. This one you did not mention, and guessing which way you would go on
it is exactly what these notes are for.

### ~~8. §3's "user may tighten a rail" vs §21's rejection of a rate-tolerance Setup field~~ — closed 2026-08-14, see Decisions

Resolved as option (b): §21 wins, §3's clause is withdrawn, and the tighten-never-loosen
rule is recorded against §2's bands instead. The workup below is left in place because
the decision's cost — a keeper with fast-swing-sensitive corals has no path today —
is real and stated in the decision rather than glossed.

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

### ~~7. reading-meaning.js's invented vocabulary vs §13's band words~~ — closed 2026-08-14, see Decisions

Resolved as option (a): the six get registered in canon as a second vocabulary
(`wizard-states.md` §22), not folded into §13's seven and not removed. The decision
also settled two things this item did not ask about — an alert tier over the verdicts,
and a refusal where consistency cannot be graded. Workup left in place below.

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

Blocks `.agent/items/TW-037.md` TW-037 (code-side fix), filed `[blocked]` pending this
decision.

### ~~6. One-line notes — 2026-08-14~~ — all three closed

- ~~**Colour-registry gap**~~ — **closed 2026-08-14.** §15 gained the colour registry
  and both named collisions are settled: phosphate `#9B3A8C`, potassium `#5F7A12`.
  The severity colours are unchanged. A third collision the note did not name
  (`alkalinity` = `ok`) was item 9 above — **closed 2026-08-15: alkalinity does not
  change.** The badge already covers it and TW-037's alert tier is the proper answer.
  TW-046 closed decided-against.
- ~~**"Notice" wording**~~ — **closed 2026-08-14.** `notice` is registered in §15 as
  the single term; "Worth knowing about", "Hidden notes"/"Notes" and "notification"
  are banned, TW-031's confirmation sentence is restated, and "Got it — hide this"
  is recorded as a non-violation (no noun).
- ~~**"Target" rename**~~ (terminology-auditor) — **closed 2026-08-16, signed off by
  the owner.** The review the 14 Aug parking asked for ran on 15 Aug
  (`.agent/target-terminology-audit.md`; it found six uses, not four) and Dan took its
  recommended option, settling the prior question first: **there is no target point —
  the user sets a minimum and a maximum, one range, two edges.** A point inside the
  band was considered and rejected (a range within a range is more to configure and
  more to explain, for a distinction the trend already makes); `reef-chemistry.md` §2
  is corrected accordingly. The rename: the band keeps the word as **target range**
  (always both words, bare "target" banned), the correction's midpoint is the **aim
  point**, position is **in range** / **out of range** (registered 14 Aug), the mL/day
  a staged plan works toward is the **planned dose**, and `targetCorrection` →
  `correction`. Both "a target is a point, not a zone" sentences are rewritten as "the
  aim point is a point, not a zone". Excluded, per the audit's §11 and Dan's own
  instruction: TW-035's field split (its own change, parity test as the gate), the
  `off-target` state id (never rendered; its one rendered leak, "Steady, off target",
  renamed with the copy), DOM handlers, the lucide icon, touch targets, Triton's own
  published values, and the CSS class. Registry rows in `wizard-states.md` §15.

### ~~5. `caClearlyOut`/`clearlyOut` compare a distance against a rate~~ — closed 2026-08-15, see Decisions

Resolved as **option (b), taken further**: each element gets its own named margin
constant, and the figures move — calcium 50 ppm, magnesium 50 ppm, alkalinity
0.5 dKH, replacing 5 ppm, 10 ppm and a literal 0.2. Option (c) — the kit noise
floors — was **not** taken. Recorded as `reef-chemistry.md` §27 and shipped;
the workup below is left in place because its statement of the fault is what
the decision turns on, and because option (b)'s "so nothing moves" clause is the
one part of it that Dan did not take.

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

### 2026-08-16 (latest) — Dan, spec owner: the four states with no wording get it, and the tank gets one line that speaks for it

Five owner decisions folded into canon on the owner's authority, the same way
the three message specifications and Stage 5's numbers were earlier the same
day. **Docs only.** They answer `.agent/gap-report.md` **G-1 to G-4 and G-27**,
which were Open item 12's entries 4 and 1. What they leave open is Open item 13
above. The implementation is **TW-075 to TW-078**, all untagged.

**§24 becomes twenty-seven cards**, and the claim that twenty-three covered the
wizard is withdrawn rather than restated — Stage 4 checked it branch by branch
and it was wrong by four.

**The negative-consumption hold, at last** (§24.24). `reef-chemistry.md` §24 has
required a marked idle card echoing the wizard since 14 August, and required an
escalation at three consecutive; neither existed in canon or in code. *"Alkalinity
is rising faster than your dose accounts for / 9.1 dKH, up from 8.6 two days ago.
The dose is unchanged. Test again in two days."* One card, two wordings, because
it is one state at two evidence levels — the `state` stays `idle`, the hold is
marked, and §2's branch list does not move for it.

**And it names no cause, at either level.** §24 part 4 had said the escalation
should name the likely cause — a wrong Setup strength or collapsed demand.
**Naming the Setup strength was considered and rejected**, and that half of
part 4 is withdrawn: §23.5 holds without exception. Three readings running prove
the gain is real and persistent, which is a fact about the arithmetic; they do
not choose between the six causes §24 itself lists as equally consistent with it.
The strongest candidate is also the most expensive to be wrong about — a keeper
told their bottle strength is probably wrong will edit a figure that may well be
right, and every dose the app computes afterwards is wrong with it.

**No water change either, and that one is §22 catching up with itself.** Part 3
asked *"has a water change or a one-off correction been logged?"* — written on
14 August, when a water change was something the arithmetic owed an adjustment
to. §22 settled the other way on 16 August: water changes stay in the trend fit
and are not subtracted at any layer. Asking now invites a keeper to explain away
a figure the app has deliberately decided not to correct, which makes a stated
deferral look like an oversight they can fix. **Naming a *missing* one-off
correction goes too** — that is naming a cause. Naming a **logged** one stays,
because a logged correction is a fact in the record rather than an inference from
a number, and whether the card gains a wording for that case is Open item 13.

**A staged plan that was never tested now asks** (§24.25). *"Time to test / You
changed the alkalinity dose four days ago. A reading today will show whether it
worked."* Branch 10 shares §24.15's headline and gets its own support sentence,
because §1's distinction runs through even this: a correction asks *where did it
get to*, a dose change asks *did it work*.

**"Still too close to call"** (§24.26) — two or more readings since a change and
they settle nothing. It is the card for a reading set that clears **none** of
`reef-chemistry.md` §30's three evidence bars while a change is in play, and it
is the third of three refusals that are not interchangeable: 24.5 is missing
readings, 24.21 is missing a second reading, this is missing agreement between
the two it has.

**A dose change can work and still leave you out of range** (§24.27). *"The
change worked, but alkalinity is settled below your range / 8.0 dKH, holding
steady since the change. Your dose is now matching what the tank uses."* **Plus
§24.3's return-plan offer**, which closes `reef-chemistry.md` §28.6's second
bullet: route 12 is §28.2's stable-and-out-of-band state, so §24.3 stops being
the only card that offers a return plan. Two cards carry it, they are exactly the
two states that satisfy §28.2, and a fourth card acquiring it would be a finding
— a fourth, because §24.23 already renders the phrase on a far-out level that
satisfies neither half of §28.2, and whether that card is a correction wearing
the return plan's words is untouched and stays open at §25.6 item 2.

**The tank gets one line that speaks for it** (`wizard-states.md` §25.1) — G-27,
and what actually replaces the deleted health score. **Three slots, each dropped
when empty: the worst thing now, anything else notable, anything in flight.**
*"Alkalinity is out of range, and several others are moving — a dose change is
still settling."* Up to three out-of-range parameters are named individually; at
four or more the worst two are named and the rest become "several others". Worst
is a two-key sort — **alert tier first, then furthest out as a fraction of its
own band** — because 0.3 dKH and 30 ppm are not two sizes of the same thing, and
a raw distance would put magnesium at the front of every headline it appeared in.
**Generated from the same verdicts the tiles render, never hand-composed**, which
is §25.1's own rule one level up and the property the score never had: every
clause can be checked by looking down the screen.

**The candidate recorded with the score's deletion was not adopted.** *"3 of 6 in
range, 2 need attention"* counts the quiet as well as the loud, and what may be
counted as in range and holding is G-29, still open. This headline speaks only
about what is not quiet and says nothing when nothing is, which is a narrower
claim and one no open question blocks.

**One thing worth stating so it is not mistaken for a breach.** §27 rule 3
forbids defining a **margin** in terms of a band width. The headline's
fraction-of-band is a **ranking key**, not a margin: it gates no recommendation,
suppresses none, relaxes no constraint and changes no figure. §27's second
decision said the margin governs wording and nothing else; this is that read the
other way round — an ordering governs wording and must never become a margin.

**Verification.** Docs only — canon amended, four items filed untagged, the plan
and the open list updated. `.agent/gap-report.md` is deliberately untouched: it
resolves nothing by design and is not annotated with resolutions. No code
touched.

**In plain terms.** Four situations your app could get into had no words for
them, and now they do. When your tank gains alkalinity faster than your dose
explains, it tells you exactly that and asks you to retest in two days — and if
it happens three times running it says so, and still refuses to guess why,
because the likeliest guess is that your bottle strength is wrong and you would
go and change a number that is probably right. When you change a dose and never
test it, it asks. When you test twice and the readings disagree, it says it is
still too close to call instead of picking one. And when a dose change works
perfectly but parks your alkalinity just under your range, it stops congratulating
you and offers to walk you home.

Then there is the line at the top of your dashboard, where the score out of 100
used to be. It says the worst thing first, then anything else worth mentioning,
then anything you have already started that is still running, and it drops the
parts that have nothing to say rather than padding. Every piece of it is built
from the same verdicts as the tiles underneath, so you can always check it by
looking down — which is the one thing the score could never do.

### 2026-08-16 (previously latest) — Dan, spec owner: Stage 5, the numbers — eleven decisions, and canon stops contradicting itself

`docs/spec/stage-5-the-numbers.md` folded into canon on the owner's authority,
the same way the three message specifications were earlier the same day. **Docs
only.** Part 1 of `.agent/gap-report.md` is answered; what it leaves open is
Open item 12 above. The implementation is **TW-064 to TW-074**, all untagged.

**One noise-floor table, and percent mode is abolished** (`reef-chemistry.md`
§5). Three tables were live and `buildFindings` consulted all three in one pass,
so the same reading counted as movement in one place and as noise in another.
`KIT_PRECISION` and `KIT_SIGMA` go. Eight parameters, one absolute figure each,
**nitrate 1.0 ppm and phosphate 0.01 ppm added** — which unblocks §29.5, a canon
rule that required "§5's noise floor" for nitrate when §5 had no nitrate row and
therefore could not be implemented at all. Per parameter, not per test kit: the
per-kit model is arguably more truthful and is rejected anyway, because §21 does
not want a Setup question asked in order to derive a threshold from the answer.

**Movement is magnitude *or* persistence** (§11). Four threshold families graded
one element on four different physical quantities, which is how a 0.6 dKH/week
drift was `hold` in the wizard and amber on the history modal at the same
instant. One rule now: the fitted daily rate clears the element's threshold, **or**
the direction has held and the total across the window clears the noise floor.
*"Anything under 0.10 per day is stable, yes — but if it shows less movement per
day and it's consistent over multiple days, it is a swing."* Slope times window,
not slope alone — which is what the noise floor was always for.

**The evidence rules, which the gap report called the one thing to answer if only
one thing got answered** (§30). Three claims, three bars, every figure derived
from §5 and §4 rather than minted: three readings one direction to establish
movement from nothing; two readings **one test cadence apart** moving **two to
three times that element's noise floor** the wrong way to claim a dose change is
being contradicted; two readings within the noise floor of each other to claim no
response at all. **Two figures from the earlier draft are withdrawn** — the flat
0.2-0.3 dKH, which was alkalinity's case mistaken for the rule, and the 24-hour
interval, which never constrained magnesium, whose readings are three weeks apart
by definition.

**Alert levels for the two parameters that needed them** (§18): ammonia at
anything detectable, salinity below 33 or above 36 ppt. **Potassium and pH get
none, by decision** — watch-them parameters, and a tier that never justifies an
action is a colour change pretending to be information. Six of nine parameters
previously could not reach an alert band however far out they went, ammonia
included.

**§28 wins over §18, and the contradiction is closed.** §18 said the app should
suggest reconsidering the range when a level sits outside it but holds steady;
§28.2, written two days later, makes that exact state the occasion to offer to
walk the level home. The app was doing the first: *"Change the target range to
8.7-9.3? Use this."* **§18's clause is withdrawn** — the range was set for a
reason, and a range that moves to meet the reading cannot then be evidence about
the reading. `suggestWorth`, the retarget offer and `SnoozeSheet`'s copy go with
it; the user may still edit their own range whenever they like, the app just may
not propose it.

**The health score is deleted** (`wizard-states.md` §25.1) — nineteen constants,
one number on the front screen, no canon entry of any kind, and already caught
showing 42 while its own working panel summed to 71. The reason is the app's own
first wording rule: state it, then show the basis. **`paramContext` is deleted
and nothing replaces it** (§25.2) — eight prose blocks quoting fifteen unnamed
figures, one of which tells a keeper calcium runs happily to 550 where §2 caps
it at 500 *because above that it pulls alkalinity down*, plus the app's largest
concentration of §23.5 and §29.6 breaches.

**The steadiness panel follows the window you picked** (§25.2, amending its own
rule 1, and §22 with it). The buttons stay, the panel grades the selection and
names it in the heading. Fixing the window would have deleted a control in order
to make a sentence true, when the sentence can simply be made true.

**One word for position** (§15): **in range**, **above range**, **below range**.
The banner said "Out of range" directly above a tile saying "ABOVE BAND". And
**four severity colours, not six** — `TONE_TIER`'s six included four registered
nowhere, and an unregistered colour is the same fault as an unregistered word.
**That one has a catch and it is Open item 10 above:** the four registered
colours already mean *direction* in `paramStatus`, and the new mapping needs them
to mean *tier*.

**Five findings thresholds ratified as they stand** (§31) — the two implausible
consumption guards, the ionic ratio's 15%, pH high at 8.45 and the CO2 signature.
Right all along; the fault was having no entry in canon.

**Verification.** Docs only — canon, the source specification reduced to a
decision record, eleven items filed untagged, TW-026 and TW-059 corrected where
this decision overtook them. No code touched.

**In plain terms.** Every number the app was using to decide what to tell you is
now written down in your spec, and where it had several answers to one question
it now has one. It had three different ideas of how small a change is too small
to trust, and four different rulers for whether your alkalinity is moving —
which is why one screen could say it was rising while the panel underneath said
it had fallen half a point a week.

It can now also say three things it has never been able to say: that a level is
genuinely moving, that the dose change you made is being contradicted, and that
nothing happened at all — each with a stated amount of evidence behind it, scaled
to the parameter, so magnesium is not held to alkalinity's timetable.

Two things on your screens are being removed. The score out of 100, because
nothing in your spec ever said what it meant and it cannot be checked. And the
explanatory paragraphs under the history chart, one of which told you 550 calcium
was fine when your own rules stop at 500 because higher pulls your alkalinity
down. Nothing replaces either yet — the summary line that replaces the score is
the one thing on the open list worth your attention soon.

And when a level sits outside your range but holds steady, the app stops offering
to change your range to fit it.

### 2026-08-16 (third of five that day) — Dan, spec owner: the message specification finishes, and Stage 3 with it

Parts 2 and 3 of the message specification folded into canon on the owner's
authority, the same way part 1 was earlier the same day. **Docs only.** The
four questions it leaves open are Open item 11 above and `wizard-states.md`
§25.6.

**Two more wording rules join §23's five.** **Rule 6 — a recent dose change
takes precedence in the wording.** The card describes the change and its
result, not the bare position, because once a change is in play the useful
question is no longer *where is it* but *did that work*. Its consequence is
that `recovering` and `worsening` appear only when nothing has been done
lately. **Rule 7 — headlines do not name the parameter, because the badge
carries it** — except where the headline is a complete sentence that would not
stand without it. The test is whether the sentence stands on its own, not
whether the parameter appears.

**The remaining wizard cards join §24, which is now twenty-three.** Correction
arrived and correction finished (one state, two flags, never conflated),
correction due, correction overrun, `recovering`, `worsening`, `fell-short`,
`overshot`, the far-out plan card, one-reading-since-a-change, and still rising
despite your dose change — **which completes all four contradiction states from
journey 4b.** Two of the four still have no state in the engine; that is
TW-026 and Stage 6d.

**§9's wrong-tool rule is corrected.** Pointing at dry salt or a water change
contradicted every rate rule in the document — a different product does not
make a fast change safe, it makes an unsafe one easier to perform. The app
says what it takes and offers a gradual plan: *nine days at a safe rate*. The
half about never quoting an impossible volume stands.

**The surfaces get a section of their own, `wizard-states.md` §25.** The tank
summary shows one notice per parameter and nothing else, and its short form is
**generated, never written** — the headline plus the first sentence of the
wizard's card, which is §7's existing requirement and the only arrangement in
which two wordings cannot drift apart. Three layers: collapsed to a headline,
expanded to the live notices, and a hidden section below that unhides one at a
time or all at once. **Hidden and off are two different things**, and the
distinction is load-bearing: hide is per notice and temporary, and a
superseding verdict returns it to the live list automatically; off is per
notice type, permanent, and set in Setup. Hide once; if it keeps returning and
is never wanted, turn the type off. That is also the answer to the
ultra-low-nutrient case, and it is why the app never asks *"are you running
ULNS?"* — §21 says Setup asks for facts.

**The parameter-card contradiction is fixed by deciding what the panel is
for**, not by wording. The wizard owns direction and works from the last few
readings; the steadiness panel answers how consistent a level has been over a
longer window, leads with that window as a heading, and **never uses direction
words**. An explanatory caption was considered and rejected: if the panel needs
a caption saying it is different, it is not different enough.

**The reading confirmation shows a two-line receipt then the wizard's card
verbatim**, and never forms its own opinion. **Findings collapse to three
kinds:** the parameter's verdict, a suspect-reading notice belonging to its
parameter, and a small set of relationship notices that belong to none.
**Insights is deliberately unspecified and may not survive.**

**Verification.** Docs only — canon, the two source specifications now reduced
to decision records, the engine plan's Stage 3 marked done, and TW-026 to
TW-028 updated with the wording they now build to. No code touched.

**In plain terms.** The app now has, in writing, the exact sentence for every
situation the dosing wizard can be in, and the rule for what each screen does
with it. The summary line under a parameter is not written down anywhere — it
is the first sentence of the card you get when you tap it, so the two cannot
disagree. Hiding a notice lasts until the situation changes and then it comes
back, because an app that goes permanently quiet about a tank getting worse is
the failure this is guarding against; if you never want that kind of notice
there is a switch in Setup. And the steadiness panel stops arguing with the
advice above it — it says which weeks it is talking about, and it never says
rising or falling again.

### 2026-08-16 (fourth of five that day) — Dan, spec owner: the count is same-side, and nitrate's trend is patience rather than statistics

Closes the two questions §29.5 left open on the first pass, the same day and
before anything shipped. Recorded in `reef-chemistry.md` §29.5, with §29's
header amended to say the section carries nothing open. **Still spec and filing
only** — TW-057 and TW-058 are unblocked, not approved.

**1. Nitrate's trend bar is three readings, one direction, clearing the noise
floor.** Explicitly **not** the four-reading, three-step statistical gate the
dosed elements use (`directional()` — four rows, three steps, two thirds
agreeing). Dan: *"My 'same evidence bar' was loose wording — the practical rule
from journey 1 is what I meant."* That phrase is **withdrawn** from §29.5 and
the rule is `journey-1-alkalinity.md` §5: *"One reading is notice, two is a
signal, three is a fact. … The app's evidence gates are about statistics; this
is about patience."*

Why this is not a slackening, and the distinction is the point: the statistical
gate exists to stop a regression claiming a slope through scatter. Nitrate is
not being fitted — it is being watched for a run of three, which is a claim
about consecutive readings rather than about a line. Importing the gate would
have been a test designed for a different question, which is the defect §25
names. **§5's noise floor stays in force**, so this is a lower count, not a
lower standard of measurement.

**2. The count is three of the last four on the same side.** Two above and one
below does not count. Dan: *"The point of the count is where the level has been
living; a reading bouncing above then below is not that."* Three high and one
low is a tank living high; two high, one low, one high is a tank bouncing —
which is what phosphate does when nothing is wrong. The literal reading (any
three outside, either side) would have fired hardest on exactly the behaviour
§29.5 exists to stop the app talking about.

**What this does not change.** Phosphate still gets no direction language at
any bar, however patient. A run of three on a parameter that oscillates between
0.20 and 0.15 is what oscillation looks like. The two parameters are separated
by the buffering, not by the evidence, and a softer trend bar for nitrate does
not bring phosphate closer to having one.

**Verification.** Spec and filing only. The one code change on this branch
remains a comment. `npm run verify` re-run on the amended tree: all blocking
checks passed; golden 5,940 cases unchanged at `3a782222dbce41c5`.

**In plain terms.** Two small things, both about how many tests it takes before
the app says something.

For nitrate: three tests in a row moving the same way, by more than your kit
can misread, and the app will say nitrate is rising. Not the stricter
four-test statistical version your alkalinity gets — that one exists to stop
the app drawing a line through scatter, and this is not a line, it is a run of
three. Your own rule from the alkalinity journey: one reading is notice, two is
a signal, three is a fact.

For the count: three of your last four outside your range, **on the same
side**. Three high and one low is a tank sitting high and worth saying so. Two
high, one low, one high is phosphate doing what phosphate does, and the app
stays quiet — which is the whole reason the count exists instead of a trend
line.

### 2026-08-16 (earliest of the five) — Dan, spec owner: phosphate and nitrate get their own rules — nine decisions in one pass

Closes open item 10 entirely, and authorises the spec edit that records it.
Recorded as `docs/spec/reef-chemistry.md` **§29**. **Spec only — the
implementation is filed untagged as TW-054 to TW-060 and is not authorised.**
The single exception Dan named himself is a comment at the `correctionProgress`
read site, which carries no behaviour.

**1. The bands, and how much latitude they carry.** Phosphate **0.03–0.10**,
nitrate **5–15**, both freely editable — and the range of legitimate settings
is **wider than for the dosed elements**. A keeper running phosphate at 0.40 or
nitrate at 40 is keeping a tank, not making a mistake, and the app may not
nudge them toward the suggestion. Wider than alkalinity's licence on purpose:
7–11 dKH is bounded by described harm, and phosphate between 0.03 and 0.40 is a
preference the app has no standing to have an opinion about.

**2. Out, and clearly out.** §27 unchanged: **out the moment the level is past
the edge by any amount**. **Clearly out at 0.10 ppm past the edge for phosphate
and 10 ppm for nitrate**, as named constants of their own. Per §27's amendment
it is a wording tier — and here that costs nothing, because there is no
recommendation for it to gate.

**3. Two fixed warnings, both independent of the band.** **Phosphate below
0.03** says it is getting quite low, and **says the same thing at 0.01** rather
than escalating. **Nitrate above 50** gets a word — *worth attention, not
urgent*, because published evidence shows nitrate is not acutely toxic.
`SAFE_BOUNDS`' phosphate minimum of 0.01 is settled as **a floor on what may be
set as a target**, adding nothing when a reading lands there; the collision item
10 named is resolved by the two figures answering different questions rather
than by averaging them. **This restores the suspended husbandry expectation** —
and not verbatim: the suspended check asserts urgency, this decision forbids it,
so the check comes back with its severity corrected. Nitrate gets no floor
warning of its own: two warnings is the whole list, and near-zero nitrate
already reaches the keeper through the nutrient findings that were never
removed.

**4. Count for phosphate, count and trend for nitrate.** Phosphate: **three of
the last four readings outside the band**, and **no direction language
anywhere** — including the stability layer's `drift:` claims, which survived
TW-029 because they sit on the fold-mode rules rather than the removed loops.
Nitrate: **both**, its trend held to **the same evidence bar as the dosed
elements** — one direction, clearing the noise floor. The asymmetry is
chemistry, not taste: phosphate binds to rock and sand and is strongly
buffered; nitrate has no buffering mechanism at all.

**5. No dose, no correction, no levers, for either.** The app names the level
and stops. **This reverses journey 5's "say these are your options, just really
briefly"**, and it is the one place canon overrides that journey. Dan's reason:
the app **cannot see whether someone runs GFO, a refugium or carbon dosing, and
suggesting levers they are not using is noise.** Naming a lever a keeper
already runs flat out is worse than silence, and the app cannot tell the two
cases apart.

**6. Windows ratified as they stand** — phosphate 14 days, nitrate 28. Right
already, but habit rather than canon; now canon.

**7. The `correctionProgress` unit mismatch is closed, not resolved.** None of
the three options is taken. **Neither parameter has a correction path and
neither will**, so the branch is unreachable **by design** rather than by an
accident of today's call sites. A comment at the read site records that, so the
next reader finds the reason instead of re-deriving the options.

**Two things left open, and named rather than smoothed over** —
~~**both closed by the entry above, the same day, before anything shipped.**~~
Nitrate's trend bar was described two ways in one sentence — *"three readings"*
against the dosed elements' bar of **four** readings and three steps — and an
implementer needed one number. And *"three of the last four readings outside
the band"* read literally as either side of the band, while its stated purpose
(*this is where you have been living*) read as one side; two above and one
below is the case that separates them. Left standing rather than deleted: the
statement of each question is what its answer turns on.

**Verification.** Spec and filing only; no chemistry constant, no threshold and
no behaviour was touched, so no behavioural claim is made. The one code edit is
a comment.

**In plain terms.** Your phosphate and nitrate stop being judged by
alkalinity's yardstick and get their own, which is what the silly notices were
about.

Ranges start at 0.03–0.10 and 5–15 and are yours to move. Running phosphate at
0.40 is an ordinary way to keep a tank and the app will not argue. Past the
edge of your range by any amount you are out; well past it, it says so more
plainly, and that is a change of wording only because these two never get a
dose.

Two warnings ignore your range completely. Phosphate under 0.03 tells you it is
getting quite low and keeps saying exactly that at 0.01 — low nutrients are the
ones that hurt corals, and shouting louder as it falls would not help. Nitrate
over 50 gets a mention rather than an alarm, which also switches back on the
check that had been turned off, at the right volume this time.

For phosphate the app counts rather than draws lines — three of your last four
tests outside the range — and it will no longer tell you phosphate is climbing,
because phosphate bounces and that sentence was never measurable. Nitrate is
genuinely a different animal, with nothing in the tank holding it steady, so it
keeps both the count and a real "this is rising", proved to the same standard as
your alkalinity.

And when a level runs high the app tells you and stops. No GFO, no refugium, no
carbon dosing suggestions — it does not know which of those you already run, and
telling you to start something you are already doing is worse than saying
nothing.

Two small things still need a line from you, both about how many readings count.
Neither stops the rest.

### 2026-08-15 (previously latest) — Dan, spec owner: out and clearly out are two questions and get two numbers

Closes open item 5, and authorises the spec edit that records it. Recorded as
`reef-chemistry.md` **§27**, and — unlike the 14 August night — this one is
**code as well as spec**: the decision names figures, and figures that are not
in the code are not decisions.

**Out has no margin.** A level is out the moment it is past the band edge by
any amount. 455 ppm against a 400–450 band is out. No tolerance, no rounding
toward the band. This half already held in the code and is now pinned so it
cannot quietly acquire a margin later.

**Clearly out is a fixed distance past the edge**: calcium **50 ppm**,
magnesium **50 ppm**, alkalinity **0.5 dKH**. Fixed figures, not scaled to band
width. Each is now its own named constant — `CA_CLEARLY_OUT`, `MG_CLEARLY_OUT`,
`ALK_CLEARLY_OUT` — declared beside its engine's other constants as a bare
number, derived from nothing.

**Item 5's option (b), taken further.** Option (b) offered named constants "set
to today's effective values so nothing moves". Dan took the naming and moved
the values: 5 ppm → 50, 10 ppm → 50, 0.2 dKH → 0.5. **Option (c) was not
taken** — the margins must not point at the kit noise floors, because how well
a kit reads a level is a third question again, and tying the two together would
mean changing a test kit in Setup changed how far out of range a tank had to be
before the app called it clearly out. The rule Dan stated in as many words:
*adjusting how fast counts as moving must never change how far counts as out.*

**What it cost, and the thing worth Dan's eye.** The 5,940-case golden
fingerprint did **not** move — `3a782222dbce41c5` before and after — and that
is not because the change is inert. The corpus cannot reach the branch: it logs
at most one correction per case, and the margin only decides anything on two or
more. Re-swept on the same grid with two corrections, **70 of 2,970 rows
change**, symmetric 35 below / 35 above, 34 alkalinity / 26 calcium / 10
magnesium. 40 of them withdraw a recommended dose change (0.9%–10.1%, largest
calcium 13.1 → 12.0 mL/day); 30 keep the dose and change only the wording. No
row became "nothing to do", no in-band row moved, and no row stopped saying the
level is outside its range. The blind spot itself is filed as **TW-047**,
untagged — fixing it re-records the fingerprint and must not ride inside
someone else's diff.

**In plain terms.** Your range is 400 to 450; at 455 your calcium is out, and
the app says so, exactly as it does at 500. That has not changed. What has
changed is the second question — *how far* out — which is what decides whether
the app changes your daily dose over a drift too small for your test kit to
measure honestly. That point is now 50 ppm past your range for calcium and
magnesium, and 0.5 dKH for alkalinity. Two of those three numbers were
previously borrowed from "how fast a level counts as moving in a week", which
is a different kind of measurement entirely; they now have their own, and a
test fails if anyone ties them back together.

### 2026-08-15 (earlier the same day) — Dan, spec owner: alkalinity's colour stays; TW-045 approved and coupled to TW-037

**Supersedes decision 2 of the entry below**, filed earlier the same day. Decision 1
of that entry — the four items approved — stands untouched and is not reopened here.

**1. Alkalinity's brand colour does NOT change. TW-046 is closed, decided against.**
(Open item 9, resolved as **option (a)** — leave it.)

`#0B7C86` is not merely `STATUS_COLOR.ok`. It is also `STABILITY_COLOR.green`, the
`dialled` verdict tone, the `tight` consistency colour, and the app's brand teal,
across **134 sites in 23 files**. Moving `PARAM_DEFS.alkalinity.color` alone would
take alkalinity's chart out of the house palette to solve a problem the badge beside
it already covers, and **TW-037's alert tier is the proper answer to "an alarming
reading must not look calm."**

**Phosphate and potassium stay changed.** TW-044 is unaffected and stays approved.
Their harm points the other way and the badge does not rescue them — a healthy
reading drawn in the alarm colour is not a contradiction the badge resolves, it is
one the badge contradicts. That asymmetry is why three collisions found in one pass
do not get one answer.

Option (c) is still not taken: nitrate `#2A8050` and salinity `#1D6FA5` keep matching
the `controlled` and `steady-off` verdict tones. Nothing in §15's colour registry
extends to verdict tones.

*What reversed it, recorded plainly:* nothing about the principle changed. The earlier
decision was taken on the evidence in item 9, which named `STATUS_COLOR.ok` and no
other role for the colour. Filing TW-046 surfaced the other four roles and the site
count, and that is what the reversal is built on. The earlier entry is left standing
below rather than rewritten.

*One loose end this creates, flagged rather than buried:*
`PARAM_DEFS.alkalinity.color` still equals `STATUS_COLOR.ok` byte for byte, by
decision. TW-044's suggested registry test — "no PARAM_DEFS colour equals any
STATUS_COLOR value" — would therefore fail on alkalinity if written that broadly.
Whoever builds TW-044 must scope it to what the registry governs, or carry a named
alkalinity exception citing this decision. Noted on TW-044 itself as well.

**2. TW-045 is approved, and lands with TW-037.**

The §22 checker is `[approved]` and moved into "Approved for implementation". Its
checks assert the behaviour TW-037 creates, so **the two ship as one change** —
neither alone. Shipping the rename and the tier without the checker leaves §22
enforced by nothing, which is the state §10 calls "an intention" and **the state that
let §7 rot**. The ordering is written onto both items, not just this entry, because an
ordering constraint recorded only in a decisions log is one nobody reads at
implementation time.

This closes the hazard flagged when the first four were approved without it.

### 2026-08-15 (superseded in part — see above) — Dan, spec owner: four items approved for implementation, and alkalinity's colour moves too

> **Decision 2 below (alkalinity's colour moves) was reversed later the same day.**
> Alkalinity does not change; see the entry above. Decision 1 — the four approvals —
> stands. The entry is kept whole because the evidence it records is what the
> reversal was argued from.

Two separate acts in one message, kept apart here because they authorise different
things.

**1. Four backlog items approved.** `TW-037`, `TW-039`, `TW-043` and `TW-044` are now
`[approved]` and have moved into `.agent/items/`'s "Approved for implementation"
section. This is the code authorisation the 14 August decision deliberately withheld —
that night was spec-only, and the items it created were filed untagged precisely so
this step would be its own. Ordered after the phase-8b three; **TW-001 is still next.**

The scope Dan restated on each, which is narrower than the items alone would suggest:

- **TW-037** — implement §22. All three parts: rename `drifting` to `unsettled`; give
  the verdicts an alert tier so none renders calmer than the latest reading's §13 band;
  make an ungradeable parameter refuse and name what is missing rather than grade
  against nothing.
- **TW-039** — both stale blocks in `rate-rails.test.js`, one pass. `SPEC_RAIL` to
  calcium 20 / magnesium 25, and the §6 citation corrected to §3. The "a user may
  tighten a rail" block is **inverted, not deleted** (AGENTS.md rule 4): it now asserts
  that a user value changes nothing, because no user value may tighten a rail. Retitle
  the describe to §3 and drop the comment at :89-91 that states the opposite of canon.
- **TW-043** — "notice" is the one word. Fix "Worth knowing about" in Dashboard and
  "Hidden notes"/"note" in Setup. **The hide-confirmation sentence lands with TW-031,
  not here**, or the string ships twice.
- **TW-044** — phosphate `#C4285B` → `#9B3A8C`, potassium `#926A09` → `#5F7A12`.
  Re-derive the contrast and separation figures rather than trusting the recorded ones.
  Grep for hardcoded copies before assuming `constants.js` is the only site. Alkalinity
  is **not** in scope here — that is decision 2 below, and TW-046.

**Not approved, and it matters: `TW-045`.** The §22 checker stays untagged. Its checks
(2) and (3) assert the behaviour TW-037 creates, and the item's own ordering note says
they must land with TW-037 or immediately after. TW-037 shipping alone leaves §22
enforced by nothing, which is the state §10 calls "an intention" and §7 is the worked
example of. Flagged rather than assumed: approving it was not asked for.

**2. Alkalinity's brand colour moves too.** — ~~**REVERSED 2026-08-15, later the same
day. Alkalinity does not change.**~~ See the entry above; the two bullets at the end
of this decision are what the reversal was argued from. Left standing, not rewritten.

(Open item 9, **option (b)**.) Same
reasoning as phosphate and potassium: a parameter's identity colour must not be a
status colour. The severity colours stay put — as in decision 4, changing one of those
instead would be a different item. **Option (c) was not taken**: §15's colour registry
is not extended to verdict tones, so `nitrate` `#2A8050` (= the `controlled` tone) and
`salinity` `#1D6FA5` (= the `steady-off` tone) stay exactly as they are.

Filed as its own item, **TW-046**, untagged — the decision settles that alkalinity
moves, not what it moves to, and no replacement hex is named. Two things found while
filing it that the item now carries, because neither was visible when item 9 was
written:

- `#0B7C86` is not only `STATUS_COLOR.ok`. It is also `STABILITY_COLOR.green`, the
  `dialled` verdict tone, the `tight` consistency colour, and **the app's own brand
  teal** — 134 sites across 23 files. Only `PARAM_DEFS.alkalinity.color` moves, which
  means alkalinity's chart stops matching the house colour. That is a visual-identity
  call, not a mechanical swap, and it is why this is a separate item from TW-044 rather
  than a third line in it.
- Alkalinity/pH is the palette's tightest pair today at CIE76 16.4. Moving alkalinity
  is the one change that can improve that number, and must not worsen it.

### 2026-08-14 (previously latest) — Dan, spec owner: four decisions — fixed rails, two vocabularies, the tier and the refusal, one word for a notice

Authorised as owner, **spec only — no application code was touched.** Resolves open
items 8, 7 and two of the three one-line notes in 6. The resulting code work is filed
untagged in `.agent/items/` — **TW-037** rescoped and unblocked, **TW-039**
extended, **TW-043 to TW-045** new. Per AGENTS.md, untagged means the implementer may
not act on it: these need `[approved]` from you before any of it ships.
(Filed as TW-042/043/044; renumbered on merge, because `main`'s run-state
restructure had already taken TW-042 — for the item about `.agent/items/`
being the next shared-singleton conflict, which is what just happened.)

**1. The rails are fixed. There is no user rail.** (Open item 8, option (b).) §3's
`[user]` may tighten a rail clause is **withdrawn**; one figure per element, the same
for every user, no setting either way. §21 wins the same-day contradiction on its own
reasoning — Setup asks facts, not judgements, and it names a rate tolerance
specifically. Nothing is withdrawn in practice: no mechanism ever existed
(`rateLimitDose` reads settings only for plausibility, `safeDoseBand` reads a hardcoded
constant, `Setup.jsx` has no rate field). **Tighten-never-loosen survives on bands**,
where §2's layers already put it: the user's band may be as tight as they like inside
safe bounds the app refuses to let them leave. The cost this item named is accepted and
written into §3 rather than glossed — a keeper whose corals react badly to fast swings
has no path today. **If 0.5 dKH/day proves too fast on a real tank, §3 is the paragraph
to change, for everyone**; per §21 a setting earns its place by solving a problem
someone actually hit, and that report would be the problem. Recorded at
`reef-chemistry.md` §3, cross-referenced from `wizard-states.md` §21.

One consequence, filed not fixed: `src/test/spec/dosing/rate-rails.test.js`'s
`describe('§6 — a user may tighten a rail; the app must honour it')` block now asserts
withdrawn canon. It is a failing test asserting a rule that no longer exists, which is
not the same thing as a failing test finding a bug. Folded into TW-039, which is
already open against the same file for the same reason.

**2. Two vocabularies, both registered.** (Open item 7, option (a).) The six
consistency verdicts in `reading-meaning.js` stay and are **registered in canon** as
`wizard-states.md` §22, separate from §13's seven bands. The bands answer *where is
this reading*; the verdicts answer *how steady has this been over time*, which the
bands have no words for. Six verdicts, seven bands, nothing else — a seventh verdict is
a finding on the same terms as an invented band.

**3. `drifting` → `unsettled`, plus a tier and a refusal.** The verdict is renamed:
canon's `drifting` means **inside** the band sliding toward an edge, the verdict fired
on the **median outside** the band with moderate spread, and near-opposites may not
share a word. No threshold or condition moves with the rename. Two further fixes the
open item did not ask about:
- **The alert tier.** The six graded movement and nothing else, so a lethal value and a
  mildly-off one both read `sliding` in the same colour. Every verdict now carries the
  tier of the **latest reading's** §13 band (§26 — position is the last reading),
  renders no calmer than it, and at the alert tier leads with the position before the
  steadiness. The verdict word does not change; only its tone and the order of its
  sentence. **A steadiness verdict must never mask a dangerous position.**
- **Unknown refuses.** `consistency` initialises to `"unknown"` and every branch
  testing it fails open, so an ungradeable parameter still reaches `controlled` or
  `unsettled` on the median test alone. Per §13's last row it must **refuse and name
  what is missing** instead.

**4. One word for a notice, and two brand colours.** `notice` is registered in §15 as
the single term; **"Worth knowing about", "Hidden notes"/"Notes" and "notification" are
banned**, and §20's confirmation sentence is restated as *"This is flagged as a serious
notice. Are you sure you wish to hide it?"* (TW-031 updated to quote it). "Got it —
hide this" carries no noun and is recorded as a non-violation. §15 gains a **colour
registry**: the severity colours are reserved and **unchanged**, and no parameter's
brand colour may be byte-identical to one. The two that were: **phosphate `#C4285B` →
`#9B3A8C`** (plum), **potassium `#926A09` → `#5F7A12`** (olive). Measured rather than
eyeballed — contrast against the `#F3F7F6` page 5.76:1 and 4.54:1 against §18's 4.5:1
text floor; CIE76 separation from the severity colour each replaces 37.9 and 32.7; the
palette's tightest pair is unchanged at 16.4 (alkalinity/pH, untouched) and
calcium/potassium improves from 29.3.

**Not settled, and named as such.** The four-way use of "target" is **parked pending a
review of all four uses** — recorded in §22 and left open in item 6. A third
brand/severity colour collision found while applying decision 4 —
`alkalinity` `#0B7C86` = `STATUS_COLOR.ok` — was **not** named in the decision and its
harm points the other way (an alarming chart that looks healthy), so it is **open item
9** rather than an extension by analogy.

**Verification.** Spec-only change; no code, no test and no chemistry constant was
touched, so no behavioural claim is made and none is verified. The colour figures above
were computed (`scratchpad/colour.mjs`, `scratchpad/pairs.mjs`: sRGB → CIE L\*a\*b\*,
WCAG 2.x relative luminance). `npm run verify` and `npx vitest run` are unchanged by
this branch by construction — the tree's only edits are Markdown — and TW-038's
now-stale test still fails exactly as it did before, for the opposite reason.

**In plain terms.** Four things, all writing rather than app changes.

The app will not grow a knob for how fast it is allowed to move your tank. There is one
speed limit per parameter and it is the same for everyone; the knob was written down as
a promise months ago and never actually built, so nothing you have today goes away. The
"you may tighten it, never loosen it" idea does still apply to your target ranges,
which is where it belongs — those are yours to set as tightly as you like, inside
limits the app will not let you past. If half a dKH a day turns out to be too fast for
your corals, that is a real report and the number gets changed for everybody, with the
reasoning written down.

The app has two sets of words about a parameter and now admits it. One set says where
your reading is right now; the other says how steady it has been over the last few
weeks. They are different questions and the second one was never written down until
now. One of its words, "drifting", meant nearly the opposite of the same word on the
other badge — that one is now "unsettled". And two rules that were missing: however
steady something has been, if your last test is at a level that needs attention the
app may no longer show it in a calm colour, and where the app has no yardstick for what
steady means it now says so instead of quietly grading you against nothing.

Lastly, the thing the app shows you about a parameter is a **notice** — one word, not
four. And your phosphate chart is no longer drawn in the exact red the app uses for
danger, nor potassium in the exact amber it uses for low, so a perfectly healthy
phosphate no longer looks like an alarm. The danger colours themselves have not moved.

### 2026-08-14 (earlier) — Dan, spec owner: position is always the last reading

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

### 2026-08-14 — Dan, spec owner: the calcium suggested default stays 425 ±25

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
`.agent/items/TW-051.md` TW-051 (filed as TW-016) is unblocked and rescoped. It turns out to be smaller
than filed — `safe-rate.js`'s `CORRECTION_MAX_RATE` is *already* {0.5, 20, 25}
and needs no change at all, so the work is `correction.js`'s magnesium
`maxPerDay` of 100 (four times the rail) plus re-pointing `rails.test.js`'s
`SPEC_RAIL`, which still asserts the pre-13-August {0.5, 25, 100}. No
application code was changed under this authorisation.

### 2026-08-14 — Dan, spec owner (resolves Decisions 1, 2, 4 and 5 of `.agent/five-decisions.md`)

Authorised as owner. **Spec only — no application code was touched.** The
resulting code work is filed untagged in `.agent/items/`.

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
resulting code work is filed untagged in `.agent/items/`.
