# The Engine Plan — Revision 2

Rewritten 16 August 2026. Supersedes `THE-ENGINE-PLAN.md` from Stage 3 onward.

**The fork is decided: rebuild the messaging layer, keep the engines.**

---

# What changed, and why

Revision 1 offered consolidation or rebuild and left the choice open until after
Stage 2. Two things settled it early.

**Dan used the app.** He found a card saying *"alkalinity is rising"* sitting
directly above a panel showing **weekly drift −0.50 dKH/wk**, with a chart
showing both. Both true over different windows; neither states its window;
nothing reconciles them. His summary: *"every single thing I look at is
contradicting itself."*

**And the inventory measured why.** Sixteen position classifiers, ~76 decision
sites, no referee. Not a set of bugs — a structure that permits them.

**But the fork was framed wrongly.** It was put as rebuild-or-consolidate, when
the real question is *how much to keep*. The dosing arithmetic is the
best-tested code here and nobody has disputed a dose figure since Phase 3. Every
contradiction Dan sees is in the layer that decides what to **say**.

**So: keep the engines. Rebuild the layer above them.**

---

# What is kept, and what goes

## Kept — the arithmetic

`assessAlkalinity`, `assessCalcium`, `assessMagnesium`, and the shared machinery
they call: consumption, `maintenanceDose`, staging, bracketing, the step cap,
rate ceilings, `proposeCorrection`, `correctionProgress`, `settleWindow`.

**And the golden corpus stays a live oracle.** These functions' outputs are what
it pins, and rebuilding above them does not change a single dose figure. If the
fingerprint moves during this work, something is wrong.

## Kept — the state machine, provisionally

`doseStatus`'s 17 states are a vocabulary, and a good one — `wizard-states.md`
documents them and their order matters. The new layer renders them rather than
replacing them.

**Two changes it needs:** the four contradiction states from journey 4b, and its
own position tests re-sourced from the new classifier rather than computed
inline.

## Thrown away

| What | Why |
|---|---|
| `findings.js` — 709 lines | its own classifiers, its own thresholds, re-runs all three engines a second time |
| `narrative-engine.js` — the surviving half | after Stage 1's deletion, the score, headline and briefing remain; all three classify independently |
| `reading-meaning.js`'s `computeControl` and `paramContext` | a second consistency vocabulary and its own absolute thresholds |
| `positionBand` and `ALERT_WIDTH` | added 15 August, one consumer, disagrees with `SAFE_BOUNDS` on every element |
| `paramStatus` — 28 call sites | the most-used classifier; all sites move |
| `ReadingConfirmation`'s own band vocabulary and its regexes over engine English | classifies independently, then parses the engine's prose |
| `StabilityStrip`'s excursion test, `safetyCapFor`, the `rangePt` copies | small, scattered, own thresholds |

## Decided during the rebuild rather than inherited

Three kit-noise tables become one. Four alkalinity trend thresholds become one.
Two alert-boundary families become one. These are chemistry decisions and they
are Dan's — see Stage 5.

---

# The governing rule

**The new layer is built from canon alone.**

`reef-chemistry.md` and `wizard-states.md` are ~2,700 lines, sourced, and carry
their reasoning. The five journeys record how Dan actually keeps a tank. Between
them there is enough to write a messaging layer without reading the old one.

**Where canon is silent**, the current behaviour may be *consulted* — but as
evidence of a gap in canon, reported to Dan, not copied. The point of rebuilding
is to stop inheriting the reasoning being replaced.

**This will surface a lot of gaps**, and that is the intended output of Stage 4.

---

# THE STAGES

Stages 1 and 2 are unchanged from revision 1 and are already under way.

---

## STAGE 1 — Delete dead code ✅ done

455 lines removed, fingerprint held at `3a782222dbce41c5`, bundle down 19 kB.

---

## STAGE 2 — The magnesium gate *(in progress)*

The only live safety gap: canon §5 and §20, three red spec tests, no
implementation.

Plus the magnesium alert inversion — alert-low at 1125 sits below `SAFE_BOUNDS`'
1150, so "act now" is outside "this is dangerous" — and removing potassium,
nitrate and phosphate from Setup's correction dropdown, which §29.6 forbids.

**Do not build this into the old layer if the new one would carry it better.**
The gate belongs wherever every correction path passes through, and the new
layer is that place. If Stage 2 finds the gate needs four separate insertions,
that is a reason to defer it into Stage 6 rather than write it four times.

---

## STAGE 3 — What every screen should say ✅ done

**Done 16 August 2026, in one day rather than the week budgeted**, across three
owner sessions: `docs/spec/message-spec-1-wizard.md`, `-2-wizard-remaining.md`
and `-3-surfaces.md`, all three now folded into canon and reduced to decision
records.

**The specification is `wizard-states.md` §23, §24 and §25** — seven wording
rules, twenty-seven reference cards, and what each surface renders. Its
arithmetic half is `reef-chemistry.md` §28, rewritten, and §9, amended. Stage
6c builds the message layer from §24 and §25; **where a card and a current app
string differ, the card wins and the string is a finding.**

**Four of the twenty-seven cards were added after Stage 4 reported them
missing** — §24.24 to §24.27, the negative-consumption hold and its escalation,
the staged plan due a reading, the tested-but-inconclusive case, and `worked`
route 12. §25.1 gained the collapsed headline rule in the same session. That is
G-1 to G-4 and G-27 of `.agent/gap-report.md`, filed as **TW-075 to TW-078**.

**Six questions were carried open — `wizard-states.md` §25.6 — and Stage 5b
closed three of them on 16 August.** Item 5: **§24.24 does not word the
logged-correction case, because the card does not fire when a correction is
logged.** Item 4: **relationship notices are the third of the ordering's four
tiers.** Item 6: **the fixed parameter order breaks the headline's tie too** —
one order, one reason. **Three remain in canon**, none blocking anything — §9's
volume ceiling, the 6.9 dKH overlap and app-level notices in Tasks. **Stage 5c
closed those three on 16 August and they are folded** — the ceiling applies to a
single day's dose, §24.9 renders on the dashboard and §24.23 in the wizard, and
Tasks is the home for app-level notices with a count badge. **§25.6's carried
list is empty of everything it came in with**; four new items replace it,
numbered 7 to 10.

**Stage 5b closed the rest of Stage 4's open list — 16 August**, seven of its
eight owner decisions folded from `docs/spec/stage-5b-remaining-items.md`:
ammonia's own
section (`reef-chemistry.md` §32, G-22), the notice ordering (G-28), the off
switch's scope (G-31), `drifting` producing no notice and the deletion of
"heading out of range" (G-21), the kit-accuracy split (D-1), and the
negative-consumption suppression, plus the headline tie-break the ordering turned
out to answer as well. Filed as **TW-080 to TW-084**. **Four items remain of the
gap report's open list and all four are Dan's** — `.agent/needs-dan.md` item 14.

**The eighth decision — the parameter tile (G-9) — is decided and still not
folded.** It landed after the 5b fold ran and was not in the 5c/6a fold's
authorisation. **It is a fold waiting to happen, not a question**; canon does not
carry it and no agent may treat G-9 as open. `.agent/needs-dan.md` item 15.

**Stage 5c and Stage 6a are folded — 16 August**, in one pass, because they
overlap on magnesium: 5c moves the suggested band to 1250–1400 and 6a rules on
what a reading of exactly 1150 classifies as. **Fourteen owner decisions**, filed
as **TW-085 to TW-091**, with TW-052 closed in the code's favour and TW-079 and
TW-084 amended where the decisions overtook them.

**Stage 5c, five decisions** (`docs/spec/stage-5c-last-items.md`): the card
placement, Tasks as the home for app-level notices, the volume ceiling per day,
magnesium's band at 1250–1400 — which also resolves §10's alert inversion, the
floor now biting on the shipped default — and **Insights survives**, four
sections removed and the rest specified after 6f.

**Stage 6a, nine decisions** (`docs/spec/stage-6a-decisions.md`, written from the
owner's answers to `.agent/stage-6a-gaps.md`'s twenty findings): §22's steadiness
figures for four parameters with five ungraded by decision; salinity's window,
rate thresholds, clearly-out margin and its alert moved off the range edge; and
seven rulings on what `classifyReading` returns — the thin series, the shared
boundary, `drifting`, total movement, the resolution floor's scope, and the alert
clamp.

**Insights survives.** §25.5 is amended: four sections come out now, and the
screen is **specified after 6f** rather than deferred — the earlier read of it
measured the surface's size and not its contents.

The rest of this section is what the stage was scoped to do, kept as the record
of what it was asked for.

**This is the work, and it cannot be delegated.**

The new layer needs to know what to say in every situation. Canon says a great
deal about what is *true*; much less about what the app *tells you*.

**The method** is the one that has worked all week: a session enumerates the
situations, Dan answers, the answers go into canon. Roughly the shape of item
10's nine decisions, but broader.

**Surface by surface:**

- **The dosing wizard** — 17 states, and the four contradiction states that do
  not exist yet. Journey 4b already drafted the matrix; it needs finishing.
- **The tank summary** — one notice per parameter, superseding not accumulating,
  hidden globally. Journey 4 has the model.
- **Parameter cards and the history modal** — what a chip says, what a
  steadiness verdict says, and how the two relate. This is where Dan's
  rising-versus-falling contradiction lives.
- **The reading confirmation** — what it says after a reading, and how it defers
  to the wizard.
- **Insights** — largely unexamined.
- **Findings** — which conditions produce a notice at all.

**The output** is a message specification: every situation, the exact sentence,
and which surfaces show it. That document is what the new layer is built from.

**Expect thirty or so decisions.** Most will be quick.

---

## STAGE 4 — The gap report *(read-only, one session)* ✅ done

**Done 16 August 2026**, and `.agent/gap-report.md` is the output. Its Part 1 —
the numbers — was answered by Stage 5 below. **Five of its Part 2 gaps have since
been answered by the owner**: G-1 to G-4, the four states with no card, and G-27,
the collapsed tank summary headline, which was Stage 5's most pressing carried
item because deleting the health score left no tank-level view at all. Those
answers are `wizard-states.md` §24.24–§24.27 and §25.1, and they are filed as
**TW-075 to TW-078**. The report itself is unchanged — it resolves nothing by
design, and it is not annotated with resolutions.

Before writing any code: take the message specification and canon, and report
every place they cannot answer a question the current app answers.

**This is where inherited reasoning would otherwise sneak in.** A gap found here
becomes a decision for Dan. A gap found during implementation becomes a guess.

Also report: every number the current layer uses that canon does not name. The
three kit-noise tables, the four trend thresholds, `paramContext`'s absolute
values, the alert widths. **These are Stage 5's decision list.**

---

## STAGE 5 — The numbers *(Dan)* ✅ done

**Done 16 August 2026, in one session**, from `docs/spec/stage-5-the-numbers.md`,
now folded into canon and reduced to a decision record. **Eleven decisions**
answering Part 1 of `.agent/gap-report.md`.

**The specification is `reef-chemistry.md` §5, §11, §18, §30 and §31** — one
noise-floor table for every parameter, all absolute; movement as magnitude or
persistence; alert levels for ammonia and salinity and none for potassium and
pH; the three evidence bars; and the five findings thresholds that survive.
**Its surfaces half is `wizard-states.md` §13, §15, §22, §25.1 and §25.2**,
where the health score and `paramContext` are deleted, position becomes
**range**, the severity mapping drops to the four registered colours, and the
steadiness panel follows the keeper's selected window.

**The one canon-versus-canon contradiction is resolved: §28 wins over §18**, and
§18's retarget clause is withdrawn.

**Stage 6a takes its thresholds from these sections.** The implementation is
**TW-064 to TW-074**, all untagged. **Twelve questions are carried open and are
Dan's** — `.agent/needs-dan.md` Open item 12; ~~the pressing one is G-27, the
summary headline that replaces the deleted score~~ **G-27 was answered the same
day** (`wizard-states.md` §25.1), which also closes item 12's entries 1 and 4;
what remains of that list is Open item 13's opening paragraph.

The rest of this section is what the stage was scoped to do, kept as the record
of what it was asked for.

The chemistry decisions Stage 4 surfaces. Known already:

**One kit-noise table.** `KIT_PRECISION` (alk 0.10–0.20 by kit), `KIT_SIGMA`
(0.05), `STABILITY_RULES.noiseFloor` (0.10). Three answers, all live,
`buildFindings` consults all three in one pass.

**One alkalinity trend threshold.** Engine 0.10/day, `DRIFT_GUIDE` 0.5/week,
`RATE_RULES` 0.5/week and 0.3/day, `CONSISTENCY_RULES` 0.5 spread. A 0.6 dKH/week
drift is "hold" in the wizard and amber in the history modal.

**One alert boundary family.** `positionBand`/`ALERT_WIDTH` against
`SAFE_BOUNDS`. Three registers for one reading today.

Each is one number replacing three or four. Each is Dan's.

---

## STAGE 6 — Build it *(2–3 weeks, ~6 PRs)*

The new layer, alongside the old, not replacing it yet.

**6a — `classifyReading`.** ✅ **built 16 August**, TW-079. One function, one
vocabulary, canon's seven bands plus §22's steadiness axis. Every threshold from
Stage 5. It reported **twenty gaps** (`.agent/stage-6a-gaps.md`) and **all
twenty are now answered, closed or recorded** — `docs/spec/stage-6a-decisions.md`,
folded. The follow-on work is TW-085, TW-086 and TW-090; nothing calls the
function until 6f. **One of its questions wants an owner before 6f** — whether it
is handed the correction-adjusted series (T-5).

**6b — The notice model.** ✅ **built 16 August**, TW-092. One live notice per
parameter; a new verdict supersedes rather than joins; supersession clears
hidden; hiding is global; everything hideable with a confirmation on the serious
ones; off is per parameter, permanent, and includes alerts. Journey 4's model,
plus §25.1's four tiers and the fixed parameter order.
`src/lib/notices/notice-model.js`, 30 tests, nothing calls it.

**`findingKey`, `findingSignature` and `findingHidden` were reused as
instructed** — the mechanism, not the key's content: `findingKey` is one notice
per finding **id** and §20 needs one per **parameter**, which is journey 4 fault
4 if imported as-is. `findingHidden`'s body is reproduced unchanged, bare-date
guard included. **6f collapses the two back into one.**

It reported **seven gaps** (`.agent/stage-6b-gaps.md`) against Stage 6a's twenty,
because §20 and §25.1 answer most of journey 4 outright. **Two are returned in
the result rather than decided** — whether a parameter's off switch reaches a
relationship notice naming it, and which of a verdict and a suspect reading is
the one live notice when both apply.

**6c — The message layer.** ✅ **built 16 August**, TW-093. Stage 3's
specification, rendered. One place that turns a verdict into a sentence:
`src/lib/messages/message-layer.js`, §24's twenty-seven cards plus §25.1's short
form and collapsed headline and §25.3's deferral. 51 tests, every card asserted
against §24's own quoted string. Nothing calls it.

**It does not invent wording.** §24's preamble authorises two substitutions — the
parameter, and direction on 24.13 alone — and everywhere else the layer **refuses
the mirror** rather than composing it. **Nine gaps**
(`.agent/stage-6c-gaps.md`), and **five of them are cards §24 has not written**:
in range but rising, steady and *above* the range (whose situation
`reef-chemistry.md` §28.3 already works through at 455 ppm), above-and-recovering,
above-and-worsening, and the unwritten `fell-short`/`overshot` quadrants. **That
is wording work for the owner**, of the kind §24 itself is. One composition was
chosen and flagged — §25.1's collapsed headline reads as two clauses by its slot
table and one list by its naming rule.

**6d — The contradiction states** in `doseStatus`, and its position tests
re-sourced from `classifyReading`.

**6e — Phosphate, nitrate and salinity**, per §29. The count mechanism, nitrate's
trend, the two fixed warnings, no dose. These have no engine, so the new layer
carries them entirely.

**6f — The switchover.** Every surface reads the new layer. The old classifiers
are deleted in the same PR, so there is never a period where both are live.

**Throughout: the golden fingerprint must not move.** The engines are untouched.
If it moves, something has reached further than intended — stop and report.

---

## STAGE 7 — Enforcement

**Extend `wordingcheck`.** Today it covers one function and one field. It
asserts `claim:` but not `support:`, which is how `narrative-engine.js:474`
writes its own sentence and passes. Its `checked` count is printed and never
asserted, so a whitespace change prints `OK (0 checked)` and exits 0.

**Add a single-source check:** no surface may classify. Any comparison against
`def.min`/`def.max` outside `classifyReading` fails the build.

**Without Stage 7, Stage 6 erodes.** The classifier count grew by one during a
week of consolidation work — that is what an unenforced rule looks like.

---

# What this means for Dan, practically

**Week 1 — Stage 3.** Answering what each screen should say. Thirty-odd
decisions, the same shape as the journeys and item 10. No PRs to read.

**Week 2 — Stages 4 and 5.** Read one gap report, make the chemistry decisions
it surfaces. One or two sittings.

**Weeks 3 and 4 — Stage 6.** Six PRs, larger than the recent ones, each read
properly. The app carries on working throughout; the new layer runs alongside
until 6f.

**Then the contradictions are gone in one step**, not trickling out over a
month.

**The risk, stated plainly:** the new layer is written from canon, and canon has
never been implemented. Some of it will be wrong. But it will be wrong in one
place, findable, and fixable — which is not true of sixteen classifiers.

---

# What this does not cover

**Phase 9's render tests.** Nothing in this layer has ever been drawn in a test.
Stage 6 will want them, and they are the natural moment — new code, no legacy
expectations.

**The reskin**, after Phase 9.

**TW-035**, the `doseStatus.target` field holding two physical quantities. A
correctness fix with a live parity test; do it alone, whenever.

**And a version label in Setup**, stamped from the build. Small, and it would
have saved an hour of "is this the new build?" today.
