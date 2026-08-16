# The Dosing Wizard, the Surfaces and the App Contract — CANON

**Status: canon.** Merged 13 August 2026 from `surfaces-and-messaging.md` §1–3
and `legacy/protocol/wizard-spec.txt`. **Amended 14 August 2026** on the spec
owner's authority — §0.3, §4 and §9.4; the decisions and their reasoning are
recorded in `.agent/needs-dan.md`. **Became this file on 14 August 2026**, when
Part II carried forward the rest of `surfaces-and-messaging.md` and all of
`app-contract.md`. **Part III added 14 August 2026** on the spec owner's
authority — §19 and §20, the surfaces and notice halves of the Reef Chemistry
Engine decision, folded in from `docs/spec/DECISION-reef-chemistry-engine.md`
(now deleted). Its assessment half is `reef-chemistry.md` §25. **§21 added
14 August 2026** on the spec owner's authority — what Setup may ask for.
**§22 added, and §15 and §20 amended, 14 August 2026** on the spec owner's
authority — the consistency verdicts registered as a second vocabulary, one
word for a notice, and the colour registry. Its companion decision is
`reef-chemistry.md` §3, the rails. **§23 and §24 added, and §14 and §15
amended, 16 August 2026** on the spec owner's authority — the five wording
rules and the twelve reference cards, folded in from
`docs/spec/message-spec-1-wizard.md` (Stage 3 of `THE-ENGINE-PLAN-v2.md`). Its
arithmetic half is `reef-chemistry.md` §28, rewritten the same day. **§25
added, §23 and §24 extended, and §7, §14, §15 and §22 amended, 16 August
2026** on the spec owner's authority — two more wording rules, the eleven
remaining wizard cards, and the surfaces that render them, folded in from
`docs/spec/message-spec-2-wizard-remaining.md` and
`docs/spec/message-spec-3-surfaces.md` the same way part 1 was. **That
completes Stage 3 of `THE-ENGINE-PLAN-v2.md`.** The four questions it leaves
open are carried at §25.6; `reef-chemistry.md` §9 is amended alongside it.
**§13, §15, §22, §25.1 and §25.2 amended 16 August 2026** on the spec owner's
authority — Stage 5, the numbers, folded in from
`docs/spec/stage-5-the-numbers.md`. Position gets one word — **range** — and the
severity colour mapping is redone in the four colours §15 actually registers.
**The health score is deleted** from §25.1 and **`paramContext` from §25.2**,
with nothing replacing either. The steadiness panel grades the window the keeper
selected and names it, which amends §25.2's own rule 1 and §22 with it. Its
arithmetic half is `reef-chemistry.md` §5, §11, §18, §30 and §31.
**§24 extended to twenty-seven cards and §25.1 extended, 16 August 2026** on the
spec owner's authority — five owner decisions answering `.agent/gap-report.md`
G-1 to G-4 and G-27. The four states that had no wording get it: the
negative-consumption hold and its escalation, the staged plan due a reading, the
tested-but-inconclusive case, and `worked` route 12 — which also settles that
route 12 carries §24.3's return-plan offer, so §24.3 is no longer the only card
that does. The collapsed tank summary headline gets its composition rule, which
is what replaces the deleted health score. Its arithmetic half is
`reef-chemistry.md` §24, whose parts 3 and 4 are narrowed to the cards, and §28.6,
one of whose open questions is closed.

> Agents never edit this file. Disagreements → `.agent/spec-challenges.md`.

Companion: `reef-chemistry.md` — the arithmetic. Read that one to know what
number the app produces; this one to know why a particular card is showing,
what words may go on it, and what the app must be true of as a program.

Part I (§0–§10) is the wizard's state machine. Part II (§11–§18) is the surfaces
and messaging canon plus the platform floor. Part III (§19–§25) is the Reef
Chemistry Engine's surfaces, the notice model, what Setup may ask for, the
consistency verdicts, the seven wording rules, the twenty-seven reference cards
the rebuilt message layer is built from, and what each surface does with them.

---

## 0. Four things to know before changing anything here

**1. Order is the design.** The wizard is one ordered list of guards, first
match wins. Moving a branch changes behaviour even when every condition is
untouched. This has already caused a real bug: `correcting` sat below the dose
verdicts, so a correction was detected and never reported. Lifting it fixed
nothing else and fixed that entirely.

**2. Four states need a staged plan to reach.** `worked`, `fell-short`,
`overshot` and `due` live behind `plan` — a staged dose plan, which is **not**
the same thing as a correction plan. Four thousand randomly generated tanks
never reached them. Any test of the wizard must supply a staged plan or a
quarter of the vocabulary goes unexercised. As of 13 Aug,
`src/test/defects/dose-state-direction.test.js` reaches `fell-short` and
`overshot`; `worked` and `due` remain unreached by anything.

**3. The wizard owns the verdict. Other surfaces echo it.** Two bugs came from
surfaces forming their own opinion: a summary saying "parked off-target"
against an engine saying "on its way to 475", and a confirmation saying
"nothing to do" against a wizard asking for a dose change. **If a surface
disagrees with the wizard, the surface is wrong.**

This is a rule about the whole app, not about three named screens, and it
covers numbers as well as words. **Decided 14 Aug:** the wizard is the only
thing in the app that may produce a figure to dose. The second dose calculator
in `src/lib/analytics/drift.js` — which had its own flat 10%/15% nudge, its own
noise floors and its own windows — is being removed, because it knew nothing of
staging, bracketing, rate ceilings, plausibility or a running plan and could
therefore contradict the wizard while both were on screen. See
`reef-chemistry.md` §7, and §9.4 below for what is still standing.

**4. Magnesium never reaches the dose-gap states.** By design — see
`reef-chemistry.md` §10. It is managed by level. An agent who reads this as an
inconsistency and "fixes" it will break it.

---

## 1. What the wizard is

`doseStatus` turns an assessment — a set of numbers about one element — into a
single card. Called once per element on every render.

| Field | Contents |
|---|---|
| `state` | one of 17 |
| `tone` | a colour, from a fixed set |
| `short` | two or three words for the tab strip |
| `headline` | one sentence |
| `detail` | one or two sentences of reasoning |
| `target` | where a plan is heading, when there is one — the correction's **aim point** (a level) on one branch, a staged plan's **planned dose** (mL/day) on four others. One field, two physical units; the split is filed as TW-035 and the field keeps its name until that lands |
| `testOn` | when to test next, when that is the ask |

**Nothing else in the app decides what an element's situation is.** Other
surfaces render this verdict or stay quiet.

---

## 2. The order of decision

One ordered list. First match wins. A branch only runs if every branch above it
declined.

| # | State | Fires when |
|---|---|---|
| 1 | `blocked` | the arithmetic is impossible — usually a wrong solution strength |
| 2 | `emergency` | outside safe bounds and no correction plan running |
| 3 | `correction-stalled` | a plan has overrun its estimate and not arrived |
| 4 | `correction-due` | a plan is due to be checked and has not overrun |
| 5 | `correction-done` | a plan has arrived — **see §4 for the exit condition** |
| 6 | `correction-stalled` | a plan is going backwards, or has not moved |
| 7 | `correcting-dose` | a plan is running normally |
| 8 | `correcting` | a logged one-off correction is still working through |
| 9 | `settling` | a staged plan changed the dose, settle window not passed |
| 10 | `due` | a staged plan is running and no test has been logged |
| 11 | `worked` | tested, steady, in band |
| 12 | `worked` | tested, steady, not in band — "steady, out of range" |
| 13 | `fell-short` | tested, engine still wants more in the same direction |
| 14 | `overshot` | tested, engine now wants the opposite direction |
| 15 | `settling` | a plain dose change inside its settle window |
| 16 | `suggested` | the engine wants a different dose |
| 17 | `correcting` | a correction is in progress by another route |
| 18 | `suggested` | a one-off would need >25× the normal dose — "wrong tool" |
| 19 | `suggested` | a correction is needed rather than a dose change |
| 20 | `settling` | the assessment is not usable yet — too few readings |
| 21a | `recovering` | **out of band, moving back toward it** |
| 21b | `worsening` | **out of band, moving further away** |
| 21c | `off-target` | out of band, not moving — the dose is right, the level is not |
| 22 | `idle` | the dose is right, the level is slightly off |
| 23 | `idle` | nothing to do |

**25 return points across 17 distinct states.** Several states are reached by
more than one route: `correction-stalled` twice, `settling` three times,
`suggested` three times, `correcting` twice, `worked` twice, `idle` twice.

### On branch 21

**Documented 13 Aug.** `recovering` and `worsening` are live at
`src/lib/dosing/state.js:458-472` and appeared in no previous specification.
They predate every commit in the repository. Verified and kept, because they
express a distinction that matters: 8.2 and climbing toward the band is not the
same situation as 8.2 and falling away from it.

Only a **non-moving** out-of-band reading reaches `off-target`. Movement must
clear the kit noise floor over the fitted window to count as movement at all.

This branch is where `reef-chemistry.md` §11 lands: a level outside its band and
moving further out is `worsening`, never `stable`, whatever the rate.

---

## 3. The states in full

| State | Tone | Tab label | Meaning |
|---|---|---|---|
| `blocked` | red | Check setup | the figures cannot be trusted |
| `emergency` | red | *(danger wording)* | outside safe bounds |
| `correction-stalled` | amber | Taking too long | plan overran |
| `correction-stalled` | amber | Not responding | plan is not working |
| `correction-due` | amber | Test now | plan needs a reading |
| `correction-done` | teal | Aim point reached | plan arrived — see §4 |
| `correcting-dose` | blue | Correction running | plan in progress |
| `correcting` | blue | Correction running | logged correction in progress |
| `settling` | blue | Change settling | too soon to judge |
| `settling` | blue | One more reading | not enough data yet |
| `due` | amber | Test to confirm | staged plan needs a test |
| `worked` | teal | Change worked | it did what it should |
| `worked` | grey | Steady, out of range | stable in the wrong place |
| `fell-short` | amber | Needs more | the change was too small |
| `overshot` | amber | Went too far | the change was too large |
| `recovering` | blue | Coming back | out of band, heading the right way |
| `worsening` | amber | Moving away | out of band, heading the wrong way |
| `suggested` | grey | Correction needed | a dose will not fix this |
| `suggested` | grey | Wrong tool | the solution cannot do it |
| `off-target` / `idle` | grey | Dose right, level off | holding, in the wrong place |
| `idle` | grey | No change needed | everything is fine |

**Tone is not decoration.** Red means act now. Amber, act soon. Blue, something
is already in motion. Teal, it worked. Grey, nothing to do.

---

## 4. Corrections

Branches 3–8. Flags come from `correctionProgress`, computed from the plan and
the readings since it started.

| Flag | Meaning |
|---|---|
| `arrived` | two readings inside the arrival zone — see below |
| `passed` | one reading at or beyond the aim point. Computed independently of `arrived`; never conflate the two |
| `dueNow` | enough time has elapsed that a reading is expected |
| `overrun` | days > (expected × 2) + 2 |
| `stalled` | 3+ days in, a reading since, level moved less than the noise floor |
| `backwards` | 3+ days in, a reading since, level moved away from the aim point |

`stalled` and `backwards` both require a reading **since the plan started**.
Without that, the app would judge a correction on the reading that prompted it
— the stale-reading fault in `reef-chemistry.md` §9.

`overrun` is measured on the **calendar**, not on readings. A plan left
unattended with no new tests still expires. Before this existed, a three-day
plan with no readings still said "on its way to 9.0 dKH" at day 40.

### Where a correction ends

The arithmetic is `reef-chemistry.md` §9; this is what it means for the branch.
Two numbers, kept apart:

- **Where the correction aims** — the midpoint of the band. The aim point is a
  point, not a zone. Unchanged.
- **Where it is judged to have arrived** — a zone. **Changed 14 Aug:** the
  middle third of the band, floored so the zone is never narrower than twice
  that element's noise floor, and clamped to the band. Against the suggested
  bands that is 8.40–8.60 dKH, 415–435 ppm calcium, 1320–1380 ppm magnesium.

The 13 August wording — "the middle third of the band," followed two sentences
later by an exit condition written in full-band terms — asserted both and
matched neither consistently. The zone above is the exit condition.

**`correction-done` exits only after two readings inside the arrival zone**, not
one, and not merely inside the band. Three consecutive 0.2 dKH rises do not
simply stop; reaching the band mid-climb is passing through, not arriving. While
the state holds, `testOn` carries "keep testing every 2 days — it may still be
climbing."

A narrower zone cannot strand the elevated dose. Branch 5 fires on `arrived`
**or** `passed`, and `passed` needs only one reading at or beyond the aim point, so
the one-tap "return to your maintenance dose" action is reached either way. The
cost of a stricter `arrived` is that the confident two-reading wording gets rare
for calcium and magnesium, not that the correction fails to close.

**Deleted 14 Aug: "consumption does not re-baseline until this clears."** No
such mechanism exists anywhere in the app — the analytics layer contains no
reference to corrections, plans or `arrived` (`.agent/five-decisions.md`,
Decision 4). What does happen is in `reef-chemistry.md` §6: while a logged
correction is being delivered, its estimated contribution is subtracted from
each reading in the trend fit. The claim is removed, not restated as an
intention.

Same branch position, no new state — only the exit condition changed.

---

## 5. What the wizard needs before it will suggest a dose

All four, from `reef-chemistry.md` §7:

- at least 3 readings in the analysis window
- the settle window has passed since the last change
- the movement clears the kit noise floor
- the gap is worth acting on

If any fails, the wizard says which: `settling` when it is too soon, "one more
reading" when there is too little data, `due` when a change is waiting on
evidence.

**This is deliberate. An app that always has an answer is not more useful than
one that says what it is waiting for.**

---

## 6. The distinction the whole wizard turns on

A daily dose **holds** a level. A correction **moves** one.

Three states exist purely to express this:

- **`off-target`** — the dose is right and the level is not. Nothing added to
  the daily dose fixes this; it would hold the level in the wrong place faster.
  What is needed is a correction.
- **`idle` "dose right, level off"** — the same conclusion when the level is
  only slightly out and the app is not pressing.
- **`suggested` "correction needed"** — the level must move and a dose change
  is the wrong instrument.

If these are collapsed into "increase the dose", the app starts giving advice
that cannot work.

---

## 7. Where the wizard must not be contradicted

Three other surfaces speak about the same element: the tank summary claim, the
reading confirmation window, and the findings list.

All three **echo the wizard or say nothing**.

**Widened 14 Aug — see §19.** This section is the rule for three surfaces and
three elements because until now nothing produced a verdict about anything
else. §19 applies the same rule to every surface and every parameter the Reef
Chemistry Engine assesses. Where the two overlap they agree; §7's specifics
below stand unchanged.

- The summary renders the wizard's headline and the first sentence of its
  detail. It does not write its own sentence.
- The reading confirmation may use its own voice for the **level**, but must
  not give an instruction that conflicts. "Dead centre" is fine. "Nothing to
  do" is not, when the wizard is asking for a change.
- A running correction always outranks a dose-change message.

**Extended 16 Aug — see §25**, which says what each surface does with the
verdict rather than only what it may not do to it. The two bullets above are
where §25.1's generated short form and §25.3's receipt-then-card come from;
neither is a new rule, and §25 states as much. §25 adds the sentence these
bullets imply: **where a surface appears to need a claim the wizard cannot
supply, that is a gap in the wizard, not licence to compute one locally.**

### Why this matters more than it looks

As of 13 August the app violates this in a card 90 pixels wide: `ParamCard`
shows three independently computed severities for one reading in a single
render — the same 6.9 dKH triggers mild amber via `paramStatus` and urgent red
via two separate `SAFE_BOUNDS` checks.

There is no `classifyReading`. **Ten** divergent classifiers stand in its
place. Until one exists and every surface calls it, this section describes an
intention, not a guarantee.

---

## 8. Dose changes have one home

**Decided 13 Aug.**

A dose changes in exactly one place: this wizard. Whether the wizard suggested
the number or the user typed it makes no difference to how it is recorded — the
app cannot verify where a number came from, but it can verify what happens
after it.

Every change records:

| from | previous daily dose |
| to | new daily dose |
| date | when it changed |
| basis reading | the value the expectation was built on |
| expected effect | predicted change per day, and predicted value at next test |
| outcome | open · confirmed · contradicted · unverified · expired |

**One live expectation per element at a time.** A new change closes the previous
one with an outcome first.

This exists so the reading confirmation window has exactly one thing to
consult. Previously a dose could change in two places that did not know about
each other, so the confirmation could not reliably say whether a rise was
expected.

---

## 9. Known faults

**9.1 — `worked` and `due` are unreachable by any test.** Not a fault in the
app; a fault in how it has been tested. Any new wizard test must supply a
staged `activePlan`.

**9.2 — the stability grading fault is fixed in spec, not yet in code.**
`ALK_TREND.stable = 0.10` dKH/day still grades a 0.02/day decline as stable at
`src/lib/dosing/alkalinity.js:28-32,190`. `reef-chemistry.md` §11 defines the
replacement. Until that lands, branch 21b rarely fires when it should.

**9.3 — the dose-gap halving is still live** at
`src/lib/dosing/helpers.js:502-503`. `reef-chemistry.md` §7 removes it. **These
two must change together**: the halving exists only to compensate for 9.2, so
removing it before grading is fixed would make slow declines worse.

**9.4 — the second dose calculator is decided-removed in spec, still present in
code.** `src/lib/analytics/drift.js` still exports `computeDoseAdvice` and
`computeDoseCalc`. Where they stand as of 14 Aug: `Insights.jsx:108` and
`Dashboard.jsx:298` each compute a `doseAdvice` and never read it — dead in both
files. The one live path is `.calc`, through `previewStrengthChange`
(`src/lib/dosing/corrected-strength.js:43-51`) into the "Suggested dose … now /
after" row at `Insights.jsx:697-720`, itself gated behind a third mechanism,
`calibrateDoseStrength`. Removing the dose figures therefore needs a replacement
source for that preview row — the wizard's own assessment run under before and
after settings — and the two dead `useMemo` calls taken out with them.
`assessDrift`, the slope classifier that produces no dose number, is not what
this decision removes.

Separately and independently of the removal: `DOSE_ADVICE_RULES`
(`drift.js:40-57`) carries a `magnesium` entry and never consults
`DOSE_DRIFT_TRIGGER`, so magnesium can be given a computed dose figure through
that preview path. `reef-chemistry.md` §10 forbids tuning magnesium's daily dose
from readings at all. Nobody decided this; it is an omission, and it needs
closing whatever happens to the rest of the file.

---

## 10. Enforcement — the honest state

The document this replaces claimed enforcement by `tests/summary.js`,
`tests/matrix.js`, `tests/sim/surfaces.js` and `tests/protocols.js`. **None of
these files exist.** Every rule described as enforced was an intention.

What does exist: `tests/parity/` (9 files) and `src/test/spec/` (35 files),
several of which currently fail — documenting real gaps, which is their job.

**No rule in this document may be described as enforced until a test asserts
it.** Where a test exists, name it. Where none does, say so.

### What still needs building

- **`matrix.js` equivalent** — drive `doseStatus` through all 17 states,
  asserting first-match-wins order, including fixtures that reach `worked` and
  `due` via a staged plan
- **`summary.js` equivalent** — assert no surface emits language contradicting
  the wizard's current state for the same element in the same render
- **`sim/surfaces.js` equivalent** — multi-year simulated tanks running the real
  engines: no safe-bounds excursion goes unmentioned, no correction stacks on a
  stale reading
- **`recovering` / `worsening`** — assert both states exist with their trigger
  conditions and tones. Nothing currently prevents them vanishing in a refactor,
  since until today no document named them.

---

# Part II — surfaces, messaging and the app contract

**Added 14 August 2026, during the canon swap.** Everything below was in
`surfaces-and-messaging.md` and `app-contract.md`, both of which this document
replaces. It is appended rather than merged into §1–§10 so that those sections
keep the numbering every cross-reference already uses. §11–§17 are the surfaces
and messaging canon; §18 is the platform floor.

Section mapping for anything that cited the old files:

| Previously | Now |
|---|---|
| `surfaces-and-messaging.md` §1 single-source rule | §11 |
| `surfaces-and-messaging.md` §2 surfaces, parity, overrides | §12 |
| `surfaces-and-messaging.md` §3 band classification | §13 |
| `surfaces-and-messaging.md` §4 message contract | §14 |
| `surfaces-and-messaging.md` §5 terminology registry | §15 |
| `surfaces-and-messaging.md` §6 history truthfulness | §16 |
| `surfaces-and-messaging.md` §7 contradiction matrix | §17 |
| `app-contract.md` (all of it) | §18 |

§7 above — where the wizard must not be contradicted — is the same principle
these sections enforce in detail. Where §7 and §11–§17 overlap, they agree: the
wizard owns the verdict, everything else echoes it or stays quiet.

---

## 11. The single-source rule

There is **exactly one** implementation of each of the following. Every surface
calls it. No surface recomputes, reformats or re-decides.

| Concern | The one function | Everything else must call it |
|---|---|---|
| Band classification | `classifyReading(param, value, targetRanges)` | wizard, manual entry, test log, dashboard, alerts, history |
| Dose calculation | `calculateDose(...)` per `reef-chemistry.md` §21 (correction) and §6–§8 (maintenance) | wizard, manual adjustment, plan view |
| Rail enforcement | `applyRails(...)` per `reef-chemistry.md` §3 | every path producing a dose |
| Consumption rate | `consumptionRate(...)` per `reef-chemistry.md` §22 | trends, wizard, log |
| Message selection | `messageFor(classification, context)` | every surface showing words about a reading |
| Parameter assessment | the Reef Chemistry Engine, run by `deriveTankState` | every surface showing a verdict about any parameter |

The last row was **added 14 Aug** by the Reef Chemistry Engine decision — §19
here, `reef-chemistry.md` §25.

**A second implementation of any of these is an S1 defect,** even if it
currently produces identical output. Identical today is divergent after the next
change.

As of 14 August this is an intention, not a guarantee, and the gap is large
enough to name here rather than only in §10: there is no `classifyReading` —
**ten** divergent classifiers stand in its place (§7) — and until 14 August
there were **four** implementations of "what should be dosed" (§0.3, §9.4).

---

## 12. The three dosing surfaces

| Surface | What it is | Who uses it |
|---|---|---|
| **Manual adjustment** | user directly edits a dose amount | experienced user overriding |
| **Dosing wizard** | guided flow: reading → classification → recommendation → confirm | default path |
| **Test log confirmation** | the message shown after logging a test result | every user, every test |

### Parity requirement

Given identical inputs — same reading, same target ranges, same net volume, same
product, same history — **all three surfaces must produce the same numbers and
the same classification.** Differences permitted only in presentation:
verbosity, layout, and how much reasoning is shown.

Specifically, the following must be identical across surfaces:

- the band the reading falls in
- the recommended dose in mL, after rounding and rails
- the expected delta and days to the aim point
- whether the app refuses to advise, and the reason
- whether a multi-day plan is required

### Manual override rules

- A manual adjustment may exceed the app's recommendation. It may **not**
  silently exceed a rail (`reef-chemistry.md` §3) — the app warns explicitly,
  states the rail and the overage, and requires confirmation.
- A manual adjustment is recorded **as a manual dose**, with both the
  recommended value and the entered value. History must show both.
- A manual dose never changes the stored target ranges or the consumption model
  unless the user explicitly asks. One-off means one-off.
- After a manual dose, the next recommendation is computed from actual dosed
  amounts, not from what was recommended.

This is the same rule as §8: a dose changes in exactly one place, and how it is
recorded does not depend on where the number came from.

---

## 13. Band classification

`classifyReading` returns exactly one of:

| Band | Meaning | Action implied |
|---|---|---|
| `in-band` | within the user's no-action band | none |
| `drifting` | inside the band, but trending toward an edge | watch |
| `out-of-band-low` | below no-action band, above alert-low | correct slowly |
| `out-of-band-high` | above no-action band, below alert-high | correct slowly |
| `alert-low` | at or below alert-low | act, and see the magnesium gate (`reef-chemistry.md` §10) |
| `alert-high` | at or above alert-high | act |
| `insufficient-data` | cannot classify (missing target range, missing volume, too few readings) | refuse and name what's missing |

Thresholds are `reef-chemistry.md` §2 (band, safe bounds) and §18 (alert
levels). Whether movement counts as `drifting` at all is the kit noise floor
over the fitted window, §5 and §11 there — never a single pair of readings, and
under §11's 16 August rule a rate below the element's threshold still counts as
movement where the direction has held and the total across the window clears the
floor.

**Which parameters can reach the two alert bands — amended 16 August.** Until
now only alkalinity, calcium and magnesium had alert thresholds, so `alert-low`
and `alert-high` were unreachable for the other six however far out they went:
seven bands on paper, five in practice, and nothing said so. `reef-chemistry.md`
§18 now adds **ammonia** (anything detectable, high only) and **salinity**
(below 33, above 36 ppt), and states that **potassium and pH have no alert tier
at all**, which is a decision rather than an omission. Phosphate and nitrate
answer the same need through §29.4's two fixed warnings.

**A parameter with no alert tier still has all seven bands available to it in
this table** — it simply never classifies into two of them, in the same way a
parameter with no target range set classifies `insufficient-data`. **No surface
may invent a third position vocabulary for those parameters**, which is what a
silent two-band set had become.

**Ammonia is the one parameter this table does not classify — 16 August,
Stage 5b.** `reef-chemistry.md` §32 gives it two states, **undetectable** and
**detectable**, and they are not two of these seven. Its target is zero, so
there is no band to be inside, no width, no lower half and no edge to drift
toward; `in-band` would have to mean *exactly zero*, which is a value. The rule
directly above — every parameter keeps all seven and simply never reaches some
of them — **is stated as covering every parameter and does not cover this one**,
and it is amended here rather than stretched. Ammonia's two states are the only
position vocabulary it has, and §32 is the only place they are set.

### `drifting` produces no notice — decided 16 August, Stage 5b

**Decided 16 Aug (Dan, spec owner)**, closing G-21 of `.agent/gap-report.md`.

**`drifting` is a tile state and nothing else.** It colours the tile and it says
where the reading sits. **It produces no notice**, generates no summary line, and
has no card in §24 — which is why §24's twenty-seven do not contain one and why
that is not a twenty-eighth gap.

**A band is a position, not an event.** The other six bands earn a notice by
being somewhere a keeper may need to act — out of range, at the alert tier, or
unclassifiable. `drifting` says the reading is **inside the band**, which is
where it is meant to be. What it adds is a direction, and **direction is the
wizard's** (§25.2): if a level moving inside its band warrants saying something,
the wizard says it from §11's movement rule over §4's window, in the card the
keeper opens. **A second surface saying it from a second window is the fault
§25.2 exists to prevent**, and it is precisely what was shipped — see §25.4,
where the finding that did it is deleted.

**This does not weaken the tile.** `drifting` still classifies, still colours,
still differs from `in-band` on screen. The keeper who looks sees it. **What the
app will not do is come and tell them**, and the distinction between those two
is the whole of this decision.

**§25.1's collapsed headline is untouched by this and is not to be read against
it.** Slot 2 can name a parameter that is **moving**, which is §11's word and
§11's rule over the wizard's own window — §25.1 says in terms that it is *"not
`drifting` or `unsettled`"*. **A moving parameter may reach the headline; a
`drifting` band may not produce a notice.** The two are different claims from
different rules, and they were never the same one.

### Boundary rules — fixed, no exceptions

- Band edges are **inclusive of the band they bound**: a value exactly equal to
  the no-action lower edge is `in-band`, not `out-of-band-low`.
- A value exactly equal to alert-low is `alert-low`.
- Comparisons happen at **stored precision**, never at display precision. A
  reading of 7.849 displayed as 7.8 classifies as 7.849.
- Classification never rounds. Display rounds.

**Every surface uses these bands and no other vocabulary for where a reading
sits.** No surface may invent a category like "slightly low" or "borderline"
that is not in this table.

These seven bands are not the wizard's 17 states. A band describes where a
reading sits; a state describes what to do about the element. Branch 21's
`recovering` / `worsening` / `off-target` split, for instance, is three states
over one band.

**Nor are they the consistency verdicts.** §22 registers a second, separate
vocabulary of six words answering a different question — *how steady has this
been over the window*, which these seven bands cannot express. The two never
substitute for each other, and `drifting` above is a band word only: **inside**
the band, trending toward an edge. The verdict that used to share that name
meant nearly the opposite and is now `unsettled` (§22, §15).

---

## 14. Message contract

Every message shown about a reading has exactly these parts, and every surface
uses the same ones:

1. **What was measured** — parameter, value, unit, and the date/time
2. **The band** — using §15's terminology, never a synonym
3. **Why** — brief, referencing the target range, not the app's opinion
4. **What happens next** — the recommended action, or explicitly "no action", or
   the refusal and what's missing

### Hard rules

- **A message must never contradict the classification it accompanies.** A
  reading classified `in-band` may not carry a message suggesting a correction.
  This is the single most important rule in this part.
- A message must never state a number that differs from the number shown
  alongside it, at any rounding.
- A message must never imply an action the app will not then offer.
- A refusal message names the missing input specifically.
- No message tells a user their test kit is wrong.
- No message expresses urgency the band does not justify.

**§23 governs how these four parts are worded**, and §24 is the reference
wording itself. This section says what a message must contain; that one says
how it may say it. A message can satisfy every rule above and still fail §23.
**§25 says which surface shows which of the four parts** — the tank summary
shows the headline and the first sentence and nothing else, the reading
confirmation shows a receipt and then the whole card — and it does so by
rendering the same strings rather than by writing its own.

**One hard rule is added by `reef-chemistry.md` §28.2 and belongs here:** a
dose-change suggestion and a return-plan offer may never appear in the same
message, on the same card, or on the same surface at the same time. The two
conditions are mutually exclusive — one needs the level to be moving, the other
needs it not to be — so both together is a fault, not a hard case.

---

## 15. Terminology registry

One word per concept, everywhere. Any synonym is a finding.

| Concept | The word to use | Never use |
|---|---|---|
| within no-action band | **in range** | fine, good, OK, normal, healthy, ideal, in target, on target, in band |
| outside no-action band | **out of range** | bad, off, abnormal, dangerous, off target, off-target, out of band |
| outside it, on the high side | **above range** | above band, over band, high band, over target |
| outside it, on the low side | **below range** | below band, under band, low band, under target |
| at/beyond alert threshold | **needs attention** | critical, urgent, emergency, danger |
| moving toward an edge, **inside** the band | **drifting** | trending, slipping, creeping |
| the user's chosen band — a minimum and a maximum | **target range** — always both words | bare "target", target band, ideal, optimal, recommended level, correct |
| the single level a correction heads for | **aim point** | target, goal, setpoint |
| the mL/day a staged plan is working up to | **planned dose** | target, target dose |
| a suggested dose | **recommended dose** | required, needed, prescribed |
| net water volume | **net volume** | water volume, tank size, volume, capacity |
| a user-entered dose | **manual dose** | custom, override, adjusted |
| a thing the app shows about a parameter | **notice** | notification, note, hidden note, "worth knowing about" |
| off the band and moving about | **unsettled** | drifting, wandering |
| how steady a parameter has been over the window | **consistency verdict** | control grade, stability score, steadiness rating |
| a plan the user opts into that walks a level back into the band | **return plan** — offered as *"Plan a gradual return"* | drift back, bring it up, walk it down, taper, wean |
| dismissing one notice until the situation changes | **hide** | mute, snooze, silence, ignore, clear |
| silencing a whole notice type permanently, in Setup | **off** | mute, disable, suppress, opt out |

The app never uses "safe" or "unsafe" about any reading. It reports position
relative to the user's own target ranges and nothing more. This is a rule about
user-facing words only — `reef-chemistry.md` §2's "safe bounds" is the internal
name of a threshold, and the app does not say it out loud.

**net volume** won the 13 August terminology decision; "water volume" is a
banned synonym (`.agent/needs-dan.md`).

**notice** won the 14 August decision, and it is the **only** word for the
concept. The three that shipped alongside it are banned: "Worth knowing about"
(`src/components/Dashboard.jsx:619-620`), "Hidden notes" / "Notes"
(`src/components/Setup.jsx:478-491`), and "notification" — including in §20's
confirmation sentence, which is restated there. Owner quotations elsewhere in
this document are left verbatim; a quotation records what was said, and the
ban is on what the **app** says. `.agent/items/TW-031.md` carries the
restated sentence.

Two words are deliberately **not** in that never-use column, because they are
canon's own and mean something else: **alert**, which §13 and §18 use for a
threshold and two band names, and **message**, which is §14's word for the
four-part thing a notice contains. A notice carries a message; it is not called
one.

**target range** won the 16 August decision, closing the multi-way use of
"target" audited in `.agent/target-terminology-audit.md` — four uses in the
parking note, six in fact. The band the user sets keeps the word, always as
both words; bare "target" is banned in app copy. The single level a correction
heads for is the **aim point** — one concept from two sources, typed once into
Setup's calculator or derived as the range's midpoint — which is the phrase
this document and `reef-chemistry.md` §9 already used when they needed to be
exact. The mL/day a staged plan works toward is the **planned dose**. "In
target", "on target" and "off target" are banned synonyms for the two
registered position words above. `targetCorrection`, which never held a
target of any kind, is renamed `correction`. Two things the decision leaves
alone: the `off-target` **state id** (never rendered — the same category as
canon's own reserved words below; its one rendered leak, the "Steady, off
target" tab label, is renamed with the copy), and the `doseStatus.target`
**field split**, which is a correctness fix gated on its own parity test —
TW-035, shipped separately. Underneath the rename sits `reef-chemistry.md`
§2's 16 August structural decision: there is no user-set target point at all —
one range, two edges, midpoint derived.

**return plan** is registered 16 August alongside §23 and §24. **"Drift back"
is an engine word, not app copy** — `reef-chemistry.md` §1 and §28 keep it for
the downward instrument, and the app never says it, because it names a
mechanism rather than what the user is being offered. One offer, one phrase,
both directions: the card says *"Plan a gradual return to 8.5 dKH"* going up
and going down alike. The same category as the `off-target` state id above —
canon's own word, never rendered.

**range** wins the position vocabulary outright — registered 16 August, Stage 5,
and the shortest entry in this registry to state and the most visible to get
wrong. The dashboard banner said *"Out of range"*; the tile directly beneath it
said *"ABOVE BAND"*. **Same reading, same instant, two vocabularies**, found by
Dan on the app on 16 August.

**Tiles read `in range`, `above range`, `below range`.** "Band" is canon's own
word for the thing — §13's seven of them, §2's edges — and it stays canon's, in
the same category as the `off-target` state id and "drift back": **the app never
says it out loud.** This is not a new rule, it is the first two rows of this
table applied to the two directions they never spelled out, which is exactly the
gap a synonym walked through.

**hide** and **off** are registered 16 August with §25, and the reason they are
two entries rather than one is the whole of §25.1's escalation: **hide is per
notice and temporary — a superseding verdict brings it back automatically —
and off is per notice type and permanent.** A word that covers both, "mute"
most of all, would let a surface offer one and deliver the other, which on the
temporary side means an app that has gone quiet about a tank getting worse.
Neither word may be used for the other. "Got it — hide this"
(`DoseExpectation.jsx:175`) already uses the right verb, and §20 records that
it needs no rename.

**unsettled** and **drifting** are the pair this registry exists for: near
opposites that shared one word until 14 August. `drifting` is §13's band word —
inside the band, sliding toward an edge. `unsettled` is §22's verdict — off the
band, moving about while it is there. Neither may be used for the other, and
neither may be used loosely for movement in general.

### The colour registry

**Decided 14 Aug.** One word per concept has a colour twin: a colour that means
*something is wrong* must not also be a parameter's identity. This is §15's
rule one level down — colours instead of words.

- **The severity colours are reserved, and unchanged by this decision:** `ok`
  `#0B7C86`, `low` `#926A09`, `high` `#C4285B`, `unknown` `#9FB0AE`
  (`STATUS_COLOR`, `src/lib/dates.js:31`). Nothing here moves them.
- **A parameter's brand colour may never be byte-identical to a severity
  colour.** Two were: `phosphate` `#C4285B`, the danger red, and `potassium`
  `#926A09`, the low amber (`PARAM_DEFS`, `src/lib/constants.js:32-33`).
  Phosphate's chart line and header cap therefore render in the alarm colour at
  every value, a perfect reading included.
- **The new brand colours: phosphate `#9B3A8C` (plum), potassium `#5F7A12`
  (olive).** Chosen to clear both the severity register and the rest of the
  palette, measured rather than eyeballed: contrast against the `#F3F7F6` page
  is 5.76:1 and 4.54:1 (§18's floor for text is 4.5:1, for a chart stroke
  3:1); CIE76 separation from the severity colour each replaces is 37.9 and
  32.7. The palette's own closest pair is unchanged at 16.4 —
  alkalinity/pH, which these do not touch — and calcium/potassium improves from
  29.3.
- **One collision is left standing and is not a silent omission.** `alkalinity`
  `#0B7C86` is byte-identical to `ok`. It was not named in the decision, and
  its direction of harm is the mirror of phosphate's — an alarming chart that
  looks healthy, rather than a healthy chart that looks alarming. Recorded as
  an open one-liner in `.agent/needs-dan.md` rather than changed here.

#### Four severity colours, not six — added 16 August

**Decided 16 Aug (Dan, spec owner).** `TONE_TIER`
(`src/lib/analytics/reading-meaning.js:121`) maps **six** hex colours to three
tiers, to implement §22's rule that a verdict never renders calmer than its own
reading. Four of those six — `#2A8050`, `#1D6FA5`, `#A2621B`, `#C4285B` — are
registered nowhere. **The mapping is redone in the four colours above and
nothing else.**

| Tier | Colour | Registered as |
|---|---|---|
| calm — the reading is `in-band` or `drifting` | `#0B7C86` | `ok` |
| raised — `out-of-band-low` or `out-of-band-high` | `#926A09` | `low` |
| alert — `alert-low` or `alert-high` | `#C4285B` | `high` |
| ungradeable — `insufficient-data` | `#9FB0AE` | `unknown` |

**The tiers are §13's bands, not a fifth severity scale**, which is §22's
existing rule stated as a table: the tier comes from the latest reading's band,
the verdict word is untouched, and a verdict never renders calmer than the tier.
The fourth row is the refusal case §22 already carries — an ungradeable
parameter renders in the unknown colour rather than falling through to a calm
one.

**Two reasons, and the second is the general one.** Six severity colours is more
than anyone distinguishes at a glance, so the extra two were carrying no
information a keeper could read. And **an unregistered colour is the same fault
as an unregistered word** — this registry exists because a colour means
something to a user whether or not anyone wrote down what, and four of the six
meant whatever the reader guessed.

**One collision this creates, worked up and not resolved here.** The four
colours are used elsewhere to mean **direction**, not tier: `paramStatus`
(`src/lib/dates.js:25-29`) returns `low` for a value under its minimum and
`high` for one over its maximum, and `DosingWizard`, `DoseExpectation`,
`ReadingContext` and the backup export all colour by that. Under the mapping
above, `low` `#926A09` means *out of range, either side* and `high` `#C4285B`
means *at the alert tier, either side*. **The same two colours would then mean
one thing on a verdict and another on a chip**, which is the fault this registry
exists to prevent, one level down from words.

The mapping above is what §22 needs — a lethal low and a mildly low rendering
identically is the exact failure §22's tier was added to stop, and a
direction-keyed mapping cannot escalate. The mapping is therefore the decided
one. **What is not decided is what happens to `paramStatus`'s colouring**: it
either moves to the tier reading, or keeps direction and stops using these four
colours, or the registry gains a name for the distinction. Three options, one
answer needed, **and it is Dan's** — `.agent/needs-dan.md`, and TW-072 carries
it so the implementation cannot pick one by accident. `STATUS_COLOR`'s four
values do not move either way.

---

## 16. History truthfulness

- A logged entry records **what the app said at the time**: the classification,
  the recommendation, and the target ranges then in force.
- Changing target ranges today must **not** retroactively change what history
  shows was recommended. Recomputing the past against present settings is an S1
  defect.
- If a target range changed, history shows the change as an event in the
  series.
- A manual dose is shown in history as recommended-vs-dosed, always both.

§8's dose-change record — from, to, date, basis reading, expected effect,
outcome — is the same principle applied to a dose rather than a reading.

---

## 17. Cross-surface contradiction matrix

The auditors work through every cell. Each pair must agree, or the disagreement
is a finding.

| | wizard | manual | test log | dashboard | history | alerts |
|---|---|---|---|---|---|---|
| band shown | | | | | | |
| dose mL | | | | | | |
| expected delta | | | | | | |
| days to the aim point | | | | | | |
| refusal + reason | | | | | | |
| terminology used | | | | | | |
| units displayed | | | | | | |

---

## 18. The app contract — platform floor

Moved verbatim from `app-contract.md` on 14 August. It is not about the wizard
and sits here only because canon is now two files; if it grows, it should get
its own again.

### Stack

- React + JSX, PWA, offline-first
- Build: detected from the repo at first run and recorded here by Dan
- Test: Vitest + React Testing Library, axe-core for a11y
- Storage: detected from the repo at first run and recorded here by Dan

### Storage contract

- Schema version key: `tw.schema.version`
- **Every schema change requires a forward migration plus a test that migrates a
  fixture from every previous version.** Fixtures in `tests/fixtures/schema/`.
- Data is never destructively rewritten in place: migrate to a new key, verify,
  then remove the old.
- On migration failure the app enters read-only mode and surfaces an export
  button. It must never start empty and silent.

### Offline behaviour

- Fully functional with no network on first paint after install.
- Service worker updates must never serve a half-updated asset set.
- A log entry created offline must survive a hard reload.

### Non-goals

No accounts, no sync, no telemetry, no analytics, no ads, no cloud dependency.

### Performance budgets

`.agent/budgets.json`. Enforced, not advisory.

### Accessibility floor

- Touch targets ≥44 px
- Text contrast ≥4.5:1
- All interactive elements keyboard reachable and labelled
- Numeric inputs use the right `inputmode` — this app is used one-handed,
  wet-handed, standing at a tank

---

# Part III — decided after the canon swap

Parts I and II were merged or carried forward from documents this file
replaces. What follows was decided after that and is new canon.

---

## 19. The Reef Chemistry Engine — which surface shows what

**Decided 14 Aug (Dan, spec owner): one engine assesses every parameter. Every
surface renders its verdict. No surface forms its own opinion.** The engine is
the **Reef Chemistry Engine**; what it must assess, and with what reasoning, is
`reef-chemistry.md` §25. This section and §20 are the surfaces half of the same
decision. Both were folded in on 14 August from
`docs/spec/DECISION-reef-chemistry-engine.md`, which they replace and which is
deleted.

Today the app has roughly five mechanisms producing dosing or stability advice,
and a findings layer computing its own notices on top. Surfaces disagree
because each is doing its own reasoning. Under this decision there is one
assessment step; every parameter goes through it; every surface reads the
result.

| Surface | What it shows |
|---|---|
| The dosing wizard screen | alkalinity, calcium, magnesium |
| The tank summary | every parameter |
| A parameter card | that one parameter |
| Insights | whichever it needs |

**The wizard is a screen, not the source.** It displays three parameters
because those are the three that are dosed. The engine assesses all of them
regardless — phosphate, nitrate, salinity and the rest are assessed the same
way and simply not shown there.

A parameter the wizard does not display still has a verdict, and the surfaces
that do show that parameter render *that* verdict. There is no second opinion
to fall back on and none to invent.

### What this changes about §7 and §11

§7 says three named surfaces echo the wizard or stay quiet. §19 widens it in
two directions and narrows it in none:

- **from three surfaces to every surface** — the tank summary, the reading
  confirmation, the findings list, the parameter card, the parameter graph
  panel and Insights alike.
- **from three elements to every parameter the engine assesses.** §7 could only
  ever be a rule about alkalinity, calcium and magnesium, because nothing
  produced a verdict about anything else.

Where §7, §11 and §19 overlap they agree, and §11's single-source table gains
the row this decision creates:

| Concern | The one function | Everything else must call it |
|---|---|---|
| Parameter assessment | the Reef Chemistry Engine, run by `deriveTankState` (`src/App.jsx:67`) | every surface showing a verdict about any parameter |

**A surface computing its own verdict is an S1 defect**, on the same terms as
§11's other five rows: identical output today is divergent after the next
change.

### What this unblocks

- **TW-026** — the `doseStatus` states the journey-4b matrix needs. They belong
  in the engine, not in the notification layer.
- **TW-027** — every surface renders the engine's verdict. `findingKey`,
  `findingSignature` and `findingHidden` already provide identity,
  supersession and global hiding; they stop at the summary.
- **TW-028** — extend `wordingcheck` so a surface writing its own sentence
  fails the build. Without it this section erodes, exactly as §7 did: per §10,
  a rule with no checker is an intention.

---

## 20. Notices — one per parameter, superseded not stacked

With one verdict per parameter, the notification model in
`docs/journeys/journey-4-notifications.md` becomes almost free. **Decided
14 Aug:**

- **One live notice per parameter.** Its content is the engine's current
  verdict. Not one per surface, not one per rule that fired.
- **A new verdict supersedes the old notice** rather than joining it. Nothing
  accumulates, and the hidden list stops growing.
- **Hiding is global**, because there is one notice, not one per surface.

### Hiding

**Every notice can be hidden. No exceptions, including safe-bounds
excursions.**

> *"If someone wants to hide a notification, they can hide a notification.
> There might be a reason the app doesn't know about."*

This settles the conflict recorded in journey 4's open question 4 and in
TW-027, and two live behaviours are now against canon rather than merely
undecided: findings of severity `act` and scope `chemistry` are non-dismissible
by rule (`src/lib/narrative-engine.js:394`), and five dose claims —
`correcting-dose`, `correction-due`, `correction-done`, `correction-stalled`
and `correcting` (`narrative-engine.js:457-492`) — are built with no
`dismissible` flag at all. Both stated a reason in the code, and the reason is
overruled: the user may have one the app cannot see.

**Serious notices get a confirmation before hiding:**

> "This is flagged as a serious notice. Are you sure you wish to hide it?"

with a line noting hidden notices can be brought back from the tank summary.

**The sentence changed on 14 August**, from "a serious notification" to "a
serious notice", when §15 registered **notice** as the one word for the
concept. The wording was settled before the registry entry existed; the
decision that created the entry restated it. `.agent/items/TW-031.md` quotes
the restated version.

**Serious** is the app's existing severity vocabulary and not a new category: a
finding of severity `act`, or a wizard state whose §3 tone is red. **The
decision did not name this mapping** — it is written here so the rule is
implementable, and correcting it is a one-line change to this paragraph, not a
new concept. This is the one thing in §19–§20 the owner has not stated
directly.

The confirmation is a speed bump, not an exception. It does not create a class
of notice that cannot be hidden.

### Resurfacing

**A hidden notice resurfaces on the next reading that would trigger it.** The
new verdict supersedes the hidden one and appears unhidden. Hiding buys you
until the next test, never indefinitely.

No special case is needed in the model — supersession already does the work,
and `findingHidden` (`src/components/DoseExpectation.jsx:148`) already
implements exactly this for findings: an entry stays hidden only while the
stored signature still equals the current one.

**Extended 16 Aug — see §25.1**, which puts this rule on a surface and adds the
thing it implies: **hiding is not the only control, and it is not permanent.**
Hide is per notice and lasts until a superseding verdict returns it to the live
list automatically; **off** is per notice type, permanent, and set in Setup.
§15 registers both words. Nothing above changes — §25.1 is where the hidden
list lives, where it is unhidden one at a time or all at once, and why the
escalation from hide to off exists instead of a Setup question asking the user
what kind of notice they want.

### The word — settled 14 August

**Notice is the single term.** §15 now carries the entry, and the three
alternatives that shipped alongside it are banned: "Worth knowing about"
(`Dashboard.jsx:619-620`), "Hidden notes" / "Notes" (`Setup.jsx:478-491`), and
"notification", which the confirmation sentence above used and no longer does.

`finding`, `claim` and `dose state` are what the **code** calls the same thing
in `src/lib/narrative-engine.js`; they are internal names, not user-facing
words, and the ban is on what the app says out loud. Renaming them in code is
tidiness, not this decision.

One hide control ships with no noun at all — "Got it — hide this"
(`DoseExpectation.jsx:175`). That is not a fourth term and needs no rename to
comply; it is listed here so the next auditor does not file it as one.

Two more non-violations, for the same reason. This document says "the
notification model in `docs/journeys/journey-4-notifications.md`" and §21 lists
"notification thresholds" as an example judgement — both name a document and a
concept in canon's own prose, not a thing shown on a screen. A **file name is
not a user-facing word**, and renaming journey 4 is not part of this decision.

### Enforced by

Per §10, named rather than asserted: **nothing asserts §19 or §20 today.**
`scripts/verify/wordingcheck.mjs` covers one field of one loop in one function.
TW-028 is the enforcement, and it should land with TW-027 rather than after it.

---

## 21. What Setup may ask for — facts, not judgements

**Decided 14 Aug (Dan, spec owner).**

> **Setup asks for facts, not judgements.**

The app asks only for what it cannot know and cannot default. Everything else
gets a sensible default and is changeable later.

### The two kinds of input

| | Facts | Judgements |
|---|---|---|
| What they are | properties of this tank and this shelf of bottles | opinions about how the app should behave |
| Who can supply them | **only the user** — there is no default that is not a guess about someone else's tank | the app, from `reef-chemistry.md`, and better than a new user can |
| Where they belong | Setup, asked up front | a default, visible and editable once the user has a reason to change it |
| Examples | net volume; solution strengths; which parameters are dosed | band widths; rate tolerances; cadence; notification thresholds |

The test for a fact is not that it is numeric or that it feels technical. It is
that **the app cannot obtain it and cannot default it.** Net volume is a fact:
no default is even approximately right, and `reef-chemistry.md` §17 shows every
dose figure scaling off it. Solution strength is a fact: it is printed on a
bottle the app cannot see, and §2 there records that everything downstream
depends on it being right. Which parameters are dosed is a fact about the
user's equipment.

A rate tolerance is not a fact. `reef-chemistry.md` §3 already holds a defended
rail per element, and §11 a stability grading. The app has an answer. Asking
the user to supply one instead replaces reasoning the spec has done with a
number typed by someone who has been using the app for four minutes.

**The app must work well without being configured beyond the facts.** A user
who enters net volume, strengths and their dosed parameters, and touches
nothing else, gets the app working correctly. Not degraded, not in a reduced
mode — correctly. If a default is not good enough to ship unattended, the
defect is in the default, not in the absence of a question.

### Why

Every setting is a question someone must answer before the app is useful,
usually without enough information to answer it well. "What daily alkalinity
movement do you tolerate?" produces a guess, and the guess then behaves like a
decision: the app acts on it, silently, for months, with the same weight as a
measured fact.

**A setting must earn its place by solving a problem someone actually hit.**
Not a problem someone might hit; not a preference someone might have. The
sequence is: the default is wrong for a real tank, that is observed, and the
setting is added to fix it. A setting added before that has no evidence behind
its own existence, let alone behind the value a user will type into it.

This is the Setup-facing half of what §5 already says about the wizard: an app
that always has an answer is not more useful than one that says what it is
waiting for. The wizard refuses rather than guessing. Setup defaults rather
than interrogating. Both are the same refusal to launder a guess into an
authority.

### Rejected — a Setup question for rate tolerance

**Recorded so it is not revisited.** The proposal: ask the user in Setup for
the daily movement they tolerate per element, and feed that figure into the
dose-gap triggers, and possibly into the rate rails.

Rejected on two independent grounds, either of which is sufficient:

1. **It demands a judgement up front.** It asks a new user to decide the
   app's sensitivity before they have seen it behave once — the exact failure
   this section exists to prevent. `reef-chemistry.md` §3 and §11 already
   answer the question with reasoning the user does not have.
2. **One setting reaching into rails and staging fractions is the shape of the
   defects this project has spent two days removing.** A single number
   entering the dose-gap trigger (`reef-chemistry.md` §7), the staging
   fractions (§8.1) and the rate ceiling (§3, §8.5) is one input with three
   arrival points and no single owner. That is the same shape as the four
   competing dose calculators (§0.3, §9.4 here), the ten divergent classifiers
   (§7, §11), and the halving at `helpers.js:502-503` that exists only to
   compensate for a grading fault elsewhere (§9.2, §9.3). Those cost two days
   to find and remove. This would reintroduce the shape by hand, with a user
   setting at the top of it so that no two tanks failed the same way.

Rejection of the setting is not rejection of the underlying concern. If a
tank's real behaviour shows a rail or a trigger is wrong, the fix is to change
it in `reef-chemistry.md`, for everyone, with the reasoning written down —
where it can be argued with and tested — not to expose it as a dial.

### What this section does not say

- It does not freeze the current Setup screen. Setup today also asks for test
  kit precision and repeat-test spread; those are facts about the kit,
  measured, not opinions about behaviour, and they are what `reef-chemistry.md`
  §5's noise floors are built from.
- It does not forbid settings. It orders them: default first, setting only once
  a real tank has shown the default wrong.
- It does not make defaults invisible or immovable. A default a user cannot see
  or change is a different fault from the one this section prevents.
- It does not decide which parameters the engine assesses. That is §19 and
  `reef-chemistry.md` §25. This section governs only what the app asks a human
  to supply.

### Enforced by

Per §10, named rather than asserted: **nothing asserts §21 today.** The check
that would is a test over the Setup schema — every field is either on the facts
list above or carries a recorded default and a recorded reason it needed to
become a question. Until that exists this section is an intention, and a new
Setup field can be added without anything objecting.

### In plain terms

Ask what only the user knows. Default everything else, and change a default
when a real tank proves it wrong — not when a user might have had an opinion.

**Consequence recorded 14 August:** `reef-chemistry.md` §3's "a user may
tighten a rail" clause is withdrawn under this section's reasoning. The rails
are fixed, one figure per element for everyone. Tighten-never-loosen survives
where it belongs — on §2's bands, which are the user's judgement about their
own corals, inside safe bounds the app will not let them leave.

---

## 22. Consistency verdicts — the second vocabulary, registered

**Decided 14 Aug (Dan, spec owner).**

> **Two vocabularies, both registered.** §13's seven bands answer *where is
> this reading*. The six consistency verdicts answer *how steady has this been
> over time* — a different axis, and one §13 has no words for.

`computeControl` (`src/lib/analytics/reading-meaning.js:89-236`) has been
emitting six headline categories with no entry anywhere in canon, rendered
beside the official band badge in the same modal (`Dashboard.jsx:467`). They
are **not** removed. They answer a question the seven bands cannot: a reading
can sit inside its band all window and still have bounced across it, and only
these words say so.

### The six

Graded over the analysis window (`reef-chemistry.md` §4), from the spread or
the fitted rate of the readings in it — never from a single reading.

| Verdict | What it says about the window | Headline |
|---|---|---|
| `dialled` | held inside the band, tightly | Dialled in |
| `controlled` | centred in the band, ordinary test-to-test variation | Well controlled |
| `steady-off` | very steady, but settled off the band | Steady, running high/low |
| `unsettled` | off the band, and moving about while it is there | Unsettled high/low |
| `loose` | swinging widely, no consistent direction | Wide swing |
| `sliding` | moving one way, fast | Moving up/down fast |

Six verdicts and seven bands, and nothing else. A surface inventing a seventh
verdict is a finding, exactly as §13 says of the bands.

**Ammonia is graded by none of the six — 16 August, Stage 5b.**
`reef-chemistry.md` §32.5 states it as a rule: a parameter whose only acceptable
value is a single point has no spread worth grading, and *"a tank at zero all
month is not `dialled`; it is normal"*. The `CONSISTENCY_RULES` ammonia entry —
live, and unreachable since the day it was written — goes with the decision
rather than surviving as dead configuration. **This is a parameter falling
outside the vocabulary, not a seventh verdict**; nothing is added here.

### The rename — `drifting` became `unsettled`

`drifting` is §13's word and stays §13's word: **inside** the band, trending
toward an edge. The verdict of the same name fired on close to the opposite
condition — the window **median outside** the band, with moderate spread
(`reading-meaning.js:218`). Two badges in one modal, one word, near-opposite
meanings.

The verdict is renamed **`unsettled`**; the headline becomes "Unsettled high" /
"Unsettled low". §15 carries both entries and the ban. This is a rename of the
verdict only — no threshold, no condition and no band definition moves with it.

### A verdict never masks a position — the alert tier

**A steadiness verdict must never mask a dangerous position.** The six grade
movement and say nothing about how far out the current reading is, so as
written a lethal value and a mildly-off one both read `sliding`, in the same
colour (`tone` is fixed per verdict, `reading-meaning.js:196-220`).

The verdicts therefore gain a tier, and it is §13's, not a new severity scale:

- **Every verdict carries the tier of the latest reading's §13 band, and
  renders no calmer than it.** A latest reading classifying `alert-low` or
  `alert-high` renders at the alert tier whatever the window says.
- **At the alert tier the verdict's text leads with the position**, then
  discusses steadiness. "Steady" is never the first thing a keeper reads about
  a level that needs attention.
- **The verdict word itself does not change.** A tank at alert-low held very
  steadily is still `steady-off`; it is simply not shown in a calm colour, and
  it says the level first. The window graded the window; the tier reports the
  reading.
- The reading the tier is read from is the **last** one — `reef-chemistry.md`
  §26, position is the last reading — not the median and not a fitted value.

This does not make a verdict into a band. It stops a verdict outranking one.

### Unknown refuses

A verdict is produced only where consistency can actually be graded. Where it
cannot — no tolerance rule for the parameter, or a metric that cannot be
computed — the surface **refuses and names what is missing**, per §13's last
row (`insufficient-data`). It does not fall through to a graded verdict.

Today it falls through. `consistency` initialises to `"unknown"`
(`reading-meaning.js:141`) and, with no rule for the parameter, still reaches
`controlled` or `unsettled` through the median test alone, because every branch
that tests `consistency` fails open. That is a graded verdict resting on no
grading, which is the one thing §13's last row exists to prevent.

### The panel these verdicts render on — added 16 August

**§25.2 settles what the steadiness panel is for, and two of its rules land on
the six verdicts directly.** The verdict set, the thresholds, the grading and
the tier above are all unchanged; what changes is the panel around them.

- **The panel leads with its window, as a heading** — and the window it names
  is the one the verdict was actually graded over. A verdict graded over 14 days
  under a heading saying 30 is the contradiction of 16 August in a new place.
  **Amended later the same day (Stage 5): that window is the one the keeper
  selected on the panel, not §4's analysis window.** The panel offers 7 / 30 /
  90 / All and grades whatever is picked; the buttons stay, the grading follows
  the selection, and the heading names it. §25.2 carries the decision.
- **The panel never uses direction words.** Direction is the wizard's, worked
  from the last few readings; consistency is the panel's, worked over the
  window. The two never compete because they never make the same kind of
  claim.

**One registered headline breaks the second rule: `sliding` renders as "Moving
up/down fast".** The verdict word is untouched — this is a rule about the
panel's language, not about the six — but that headline is direction, on the
panel. **It is recorded rather than reworded here**, because minting
replacement copy is §24's kind of work and the owner has not drafted it. Until
it is drafted, the panel carries one string that contradicts its own rule, and
that is stated rather than left to be discovered. The other five are position
and spread words and comply as they stand.

### What this section does not do

- It does not let a verdict state a band position in its own words. Where the
  reading sits is §13's answer, quoted, not paraphrased.
- It does not change any threshold, window or grading rule. It registers the
  words, renames one, adds a tier and closes one fall-through.
- It does not settle the four-way use of "target" — the value the user types,
  the app's computed aim point, the whole band, and a synonym for in-band, all
  in one modal. Parked 14 Aug pending a review of all four uses; the review
  found six (`.agent/target-terminology-audit.md`) and the owner **settled it
  16 Aug** — see §15's registry: **target range** / **aim point** / **in
  range** / **out of range** / **planned dose**, and `targetCorrection` →
  `correction`.

### Enforced by

Per §10, named rather than asserted: **nothing asserts §22 today.** Three
checks would: that the verdict set is exactly these six, that no verdict
renders calmer than its own reading's band, and that an ungradeable parameter
refuses instead of grading. Filed in `.agent/items/`; until they exist this
section is an intention, and `scripts/verify/wordingcheck.mjs` covers one field
of one loop in one function.

### In plain terms

Two questions, two sets of words. "Where is my alkalinity right now" has seven
answers, and they are the official ones. "Has it been steady these last few
weeks" has six — and those are now official too, where before they were being
shown to you with nothing in writing behind them.

One of the six used to be called "drifting". Everywhere else in the app that
word means you are still inside your range and sliding toward the edge; as a
steadiness verdict it meant you were already outside it. Near enough opposite,
same word, and both could appear one tap apart. It is now "unsettled".

Two more fixes. However steady a parameter has been, if your last test is at a
level that needs attention, the steadiness note may no longer show in a calm
colour and has to tell you the level first — steady is not the same as safe.
And where the app has no yardstick for what steady even means for a parameter,
it now says so instead of quietly grading you against nothing.

---

## 23. The seven wording rules

**Decided 16 Aug (Dan, spec owner).** Folded in from
`docs/spec/message-spec-1-wizard.md`, Stage 3 of `THE-ENGINE-PLAN-v2.md`, the
same way §19 and §20 were folded in from `DECISION-reef-chemistry-engine.md`.
Its arithmetic half is `reef-chemistry.md` §28. **Rules 6 and 7 were added the
same day** from parts 2 and 3 of the same specification; rules 1–5 are
unchanged by them.

§14 says which parts a message has. **This section says how they are worded**,
and it governs every card in §24 and every sentence the rebuilt message layer
writes after them. The wizard owns the verdict (§0.3), so the wizard's wording
is settled first and every other surface defers to it.

### 23.1 State it, then show the basis

**One line saying what is happening, then the numbers it rests on.**

Not because it reads better, but because **a claim you cannot check is a claim
you have to trust.** "Alkalinity is below your range" has to be believed;
"alkalinity is 8.0 dKH, below your range of 8.2–8.8, falling about 0.1 a day"
can be looked at and disagreed with.

That is not a hypothetical. It is how the rising-versus-falling contradiction
was found on 16 August — a card saying *"alkalinity is rising"* above a panel
showing −0.50 dKH/wk, caught by seeing the working. The contradiction existed
for weeks; the visible basis is what surfaced it.

This is §14's parts 1 and 3 given an order, and it is the app's own principle
made visible: **it never asserts what it cannot support.**

### 23.2 Never speak in the first person

**No "I", no "I'll know", no "I think."** The app states what is true and what
a reading would show. It has no voice of its own.

> ✗ One more reading and I'll know whether it worked.
> ✓ One more reading will show whether it's working.

"You" is used for the user's own actions — *"you raised the dose"* — which is a
statement of fact, not a conversation.

### 23.3 Mention the dose only when it is relevant

The daily dose appears in exactly three cases:

1. when it has just changed,
2. when it is being recommended,
3. when it explains why no change is being recommended.

It does **not** appear when nothing is happening. A card that says a level is
holding does not need to recite the dose that is holding it.

**The third case is the one that is easy to drop and must not be.**
`off-target` has to say the dose is already correct, because otherwise the card
reads as the app failing to notice an out-of-range level. It is also the card
`reef-chemistry.md` §28 hangs the return-plan offer on, and the offer makes no
sense without the sentence that precedes it.

### 23.4 Units always, in the parameter's own unit

**dKH for alkalinity, ppm for everything else. Every figure, every card.**

No exceptions for a second figure in the same sentence, and no exceptions for a
figure in a tab label or a chip.

### 23.5 Never speculate about causes

**The app reports what it observes. It does not guess at why.**

> ✗ Alkalinity hasn't moved in four days. Something is holding it down.
> ✓ Alkalinity is 7.6 dKH, the same as when the correction started four days ago.

Same principle as `reef-chemistry.md` §29's no-levers rule: the app cannot see
the tank, only the numbers, and **a plausible wrong cause is worse than no
cause** — it is the one kind of error a user will act on.

**No exception — tested 16 August and confirmed.** The one place canon had
written an exception into itself was `reef-chemistry.md` §24 part 4: at three
consecutive negative-consumption readings with nothing logged, *"most likely a
wrong Setup strength or genuinely collapsed demand — and the app should say
so."* **Naming the Setup strength there was considered and rejected**, and that
half of part 4 is withdrawn; §24.24's escalation states the pattern and stops.
The argument for the exception was that three readings running are strong enough
evidence to name the likeliest cause. They are not: three readings establish
that the gain is real and persistent, which is a fact about the *arithmetic*, and
§24's own list gives six causes all consistent with it. The strongest of them is
also the most expensive to get wrong — a keeper told their Setup strength is
probably wrong will edit a figure that may well be right, and every dose the app
computes afterwards is wrong with it.

**Where the line falls:** naming a cause the app has been **told** is not
speculation. `reef-chemistry.md` §24 part 3 still requires a logged correction to
be named, because a logged correction is a fact in the record rather than an
inference from a number. The rule bans the guess, not the entry.

### 23.6 A recent dose change takes precedence in the wording

**When a dose has recently changed, the card describes the change and its
result, not the bare position.**

Once a change is in play the useful question is no longer *where is it* but
*did that work*. Answering the first when the second is available wastes the
card.

The consequence is a rule about two states specifically: **`recovering` and
`worsening` only appear when nothing has been done lately.** The same reading
gets a different card depending on what preceded it —

| The reading | No recent change | After a dose change |
|---|---|---|
| below range, still falling | §24.18 `worsening` | §24.7 *still falling despite your dose change* |
| below range, climbing | §24.17 `recovering` | §24.6 *your dose change is working* |

This is a wording rule with a precondition the engine has to be able to answer:
**what counts as a recent change, and whether the engine knows about one at
all.** Both are open in code rather than here. `fell-short` and `overshot`
(§2, branches 13–14) sit behind `plan && plan.appliedAt`, which only a dose
change made *through the wizard* writes, so a change made anywhere else falls
through to branch 21 and gets exactly the bare-position card this rule
forbids. That gap is `.agent/items/TW-026.md`, and how long "recent" lasts is
journey 4b's open question 2 — Dan's, unanswered, and **not settled by this
rule.** The rule says which card wins when the engine knows; it does not
define the window.

### 23.7 Headlines do not name the parameter — the badge carries it

**Every notice carries a parameter badge, so the headline does not repeat what
the badge already says.**

A headline that is a **fragment** drops it:

*Too soon to tell · Not enough readings yet · Correction running · The
correction isn't working · Correction finished · Time to test · The correction
has run longer than expected · The change helped but hasn't gone far enough ·
The change went further than needed · You have logged one reading since your
dose change*

A headline that is a **complete sentence** keeps it, because removing it reads
oddly:

*Alkalinity is holding at 8.5 dKH · Alkalinity is in range but falling ·
Alkalinity is very low at 6.8 dKH*

**The test is whether the sentence stands on its own, not whether the parameter
appears.** The fragment-versus-sentence split is how it usually falls out, not
the rule itself: §24.6's *"Your dose change is working"* and §24.21's *"You
have logged one reading since your dose change"* are both complete sentences
that stand perfectly well without naming the parameter, and neither names it.
Where the sentence would not stand — *"is holding at 8.5 dKH"* — the parameter
goes back in.

**This rule assumes the badge.** A surface that renders a headline with no
parameter badge beside it either supplies one or is showing the wrong thing;
it does not re-add the parameter to the wording, because then two surfaces
would carry two headlines for one verdict, which is what §7 and §25 exist to
prevent.

### How these sit against §14 and §15

Three layers, and they do not overlap:

- **§14** — which parts a message must contain.
- **§15** — which word each concept gets.
- **§23** — how the parts are said, and what may not be said at all.

A message can satisfy §14 and §15 completely and still break §23 — "I think
alkalinity is fine" contains all four parts and no banned synonym.

**23.6 is the one rule of the seven that is not purely about words.** It picks
which card fires, which is why it reads as a wording rule and lands as an
engine requirement. It is stated here rather than in §2 because the reason is a
reason about the message — a card that answers the less useful question — and
because the branch order that would implement it is not settled (§24's note on
24.17 and 24.18).

### Enforced by

Per §10, named rather than asserted: **nothing asserts §23 today.**
`scripts/verify/wordingcheck.mjs` covers one field of one loop in one function,
and asserts `claim:` without `support:` — which is exactly §23.1's failure mode
going unchecked.

Seven checks would close it, one per rule. Five are static; the last two need
the engine's own output:

| Rule | The check |
|---|---|
| 23.1 | every `claim:` has a `support:`, and the support names a figure |
| 23.2 | no first-person pronoun in any user-facing string |
| 23.3 | a dose figure appears only on the three permitted card kinds |
| 23.4 | every numeric figure in a message carries its parameter's unit |
| 23.5 | a fixed banned-construction list — "something is", "may be caused by" |
| 23.6 | no `recovering` or `worsening` card is emitted while a dose change is inside its recency window |
| 23.7 | no headline names a parameter unless the headline is one of §24's registered complete-sentence forms |

**23.2 is checkable against the app as it stands, before the rebuild.**
`src/lib/narrative-engine.js` and `src/lib/findings.js` are
where first-person copy would live. If the app says "I" anywhere today, that is
a finding for the rebuild to clear rather than a patch to apply now — the layer
is being replaced, and fixing copy in code that is about to be deleted spends
the effort twice.

**23.7 is checkable today as well, and would be noisy for the same reason.**
Every headline in the app was written before the badge rule existed, so a sweep
now returns findings Stage 6c is going to rewrite anyway. Count them in Stage
4's gap report; fix them when the layer is rebuilt.

---

## 24. The twenty-seven cards — the reference the rebuild works from

**Decided 16 Aug (Dan, spec owner).** These are not illustrations. **They are
the reference wording**, and Stage 6c builds the message layer to produce them.
Where a card here and a current app string differ, the card wins and the string
is a finding.

Alkalinity is used throughout; **the same shapes apply to calcium and magnesium
in their own units** (§23.4). Twenty-seven cards, in the order they were
decided: **24.1–24.12 on the first pass**, **24.13–24.23 the same day** from
parts 2 and 3 of the specification, and **24.24–24.27 the same day again**, from
the four states `.agent/gap-report.md` found with no wording. Nothing in the
first twelve changed when the rest arrived, and nothing in the first
twenty-three changed when the last four did.

**24.23 did not cover the wizard, and the claim that it did is withdrawn.** The
first twenty-three closed with *"with 24.23 the wizard is covered — every state
in §2's ordered list has wording"*. Checked branch by branch, Stage 4 found four
that did not: branch 10 (`due`), branch 12 (`worked`, steady and out of range),
the negative-consumption hold required by `reef-chemistry.md` §24 with its
escalation, and the tested-but-inconclusive `settling` case. Those are
`.agent/gap-report.md` G-1 to G-4 and they are 24.24 to 24.27 below. **The claim
is not restated here.** The count was checked once, against §2's list, and it
was wrong by four; a second assertion of completeness is worth less than the
report that disproved the first, and §2's own branch 22 is a row §26 removed
(G-5), so the list it would be checked against is not itself settled.

What can be said without a count: **all four contradiction states from
`docs/journeys/journey-4b-notification-matrix.md` have wording** (24.7, 24.8,
24.21, 24.22), two of which the app cannot express at all, and **every state
Stage 4 named as missing one now has one.**

### 24.1 Nothing to do — `idle`

> **Alkalinity is holding at 8.5 dKH**
> In your range of 8.2–8.8.

No dose figure — §23.3. Nothing is happening and nothing needs explaining.

### 24.2 The dose no longer matches — `suggested`

> **Alkalinity is in range but falling**
> 8.5 dKH now, down about 0.1 a day over the last three readings. Your dose of
> 9.0 mL/day is below what the tank is using — 9.7 mL/day would match it.
> **Open the dosing wizard →**

The common one. **The recommended figure is stated as *what would match*, not
as an instruction** — which is `reef-chemistry.md` §28.1 in one sentence: the
figure is the tank's consumption, and it is not carrying an intention.

### 24.3 Steady, but in the wrong place — `off-target`

> **Alkalinity is steady at 8.0 dKH, below your range**
> Your dose is matching what the tank uses, so it will stay here.
> **Plan a gradual return to 8.5 dKH →**

The dose is mentioned under §23.3's third case — without it, the card looks
like the app has failed to notice.

**"Plan a gradual return"** rather than "bring it up": it names the
destination, and *gradual* says plainly that nothing is going to be forced. The
destination is the band midpoint, per `reef-chemistry.md` §9.

**Amended 16 August: this is one of two cards that offer a return plan, not the
only one.** It was the only one of the first twelve where the level is both
stable and out of band — `reef-chemistry.md` §28.2 — and the open question it
carried, *"whether route 12 (`worked`, tested steady and not in band) also
qualifies"*, **is answered yes**: 24.27 is that card and it carries this offer.
`reef-chemistry.md` §28.6's second bullet is closed for route 12 and the
deferral to Stage 4's gap report is discharged (G-2).

**Two cards, one condition.** The offer appears on exactly the states that
satisfy §28.2 — stable and out of band — and those are branch 21c (`off-target`,
this card) and route 12 (`worked`, 24.27). **A fourth card acquiring it is a
finding** unless §28.2's condition moved with it.

**A fourth, because 24.23 is the third and it is the known exception.** 24.23
renders *"Plan a gradual return to 8.5 dKH"* on a level far below its range,
which is a state that is usually neither stable nor in band, and canon already
records that as unresolved: either that card is a **correction wearing the
return plan's words**, or §28.2's condition needs widening. That question is
§25.6 item 2 and it is untouched here. **What is settled is the two states that
satisfy §28.2 as written**; 24.23's use of the phrase is a question about 24.23,
not a third answer to this one.

Note what is *not* on this card: a dose figure to change to. §28.2's exclusion
is visible here — the suggestion and the offer never share a card.

### 24.4 Too soon to judge a change — `settling`

> **Too soon to tell**
> You raised the alkalinity dose to 9.7 mL/day yesterday. One more reading will
> show whether it's working.

"You raised" — §23.2's permitted second person, a statement of fact about the
user's own action.

### 24.5 Not enough data — `settling`

> **Not enough readings yet**
> Alkalinity is 8.5 dKH, in your range. Two more readings will show which way
> it's going.

The refusal names what is missing, per §14. It still states the position,
because the position is known.

### 24.6 The change worked — `worked`

> **Your dose change is working**
> Alkalinity is up to 8.6 dKH from 8.3, in your range. Keep testing every couple
> of days until it settles.

### 24.7 Still falling despite the change — contradiction state, does not exist

> **Alkalinity is still falling despite your dose change**
> 8.3 dKH now, down from 8.5 two days ago. You raised the dose to 9.7 mL/day on
> the 14th and the fall hasn't slowed. It may need to go higher.
> **Open the dosing wizard →**

One of the four contradiction states from
`docs/journeys/journey-4b-notification-matrix.md`. **Not in §2's ordered list
and not in §3's table** — it is new, and Stage 6d adds it.

### 24.8 No response at all — contradiction state, does not exist

> **Alkalinity hasn't moved since your dose change**
> 8.5 dKH on the 14th, 8.5 now. You raised the dose to 9.7 mL/day two days ago
> and nothing has responded. It may need to go higher.
> **Open the dosing wizard →**

From journey 1: *"that's two days of an increased dose and it hasn't actually
moved — at that point I'd increase the dose further."* **An expected response
that does not arrive is itself evidence**, and the app currently has no state
that says so.

### 24.9 Very low — `emergency`

> **Alkalinity is very low at 6.8 dKH**
> This needs a correction unless you are deliberately holding it there.
> **Open the dosing wizard →**

**No mention of the safe floor.** It is a number the user did not set and
cannot change, so quoting it invites a question the card cannot answer. This is
§15's rule that the app never says "safe" out loud, applied to the figure
behind the word.

**The escape clause is deliberate** — same principle as every notice being
hideable (§20). The app does not know why a level is where it is, which is
§23.5 stated as a courtesy rather than a prohibition.

### 24.10 A correction running — `correcting-dose`

> **Correction running**
> Alkalinity is 8.1 dKH, up from 7.6 when the correction started. Heading for
> 8.5. Test again in two days.

"Heading for 8.5" is the **aim point** (§15), stated as a level.

### 24.11 A correction that is not working — `correction-stalled`

> **The correction isn't working**
> Alkalinity is 7.6 dKH, the same as when the correction started four days ago.

**No speculation about why**, per §23.5. The temptation here is strongest and
the card resists it: it states the two numbers and the elapsed time, and stops.

### 24.12 Figures cannot be trusted — `blocked`

> **Alkalinity figures can't be trusted**
> The numbers imply a solution strength far from what's in Setup. Check the
> strength before using any dose figure here.
> **Open Setup →**

Names the missing input specifically (§14), and refuses rather than guessing.

### 24.13 A correction has arrived — first reading inside

> **Alkalinity has reached 8.5 dKH**
> Back in your range. One more reading will confirm it's holding — it may still
> be rising.

**Direction-aware.** A correction that pushed upward risks continuing upward,
so it says *rising*; a downward correction says *falling*.

**The clause is the reason `reef-chemistry.md` §9 waits for two readings rather
than one**, so dropping it would lose the point of the two-reading test — the
card would claim an arrival the app has not established.

This is `correction-done` reached by **`passed`** — one reading at or beyond
the aim point — which §4 computes independently of `arrived` and which fires
the same branch. 24.14 is the same state reached by `arrived`. **The two flags
select between these two wordings and must never be conflated** (§4). A reading
that lands inside the band but short of the aim point sets neither and is still
24.10.

### 24.14 A correction has finished — second reading confirms

> **Correction finished**
> Alkalinity is holding at 8.5 dKH, in your range. Your dose is back to
> 9.0 mL/day.

The dose appears under §23.3's first case — it has just changed back. This is
the wording §4 calls the confident one, and the wording that becomes rare for
calcium and magnesium under the arrival zone's noise floor.

### 24.15 A correction is due a reading — `correction-due`

> **Time to test**
> The alkalinity correction has run its expected three days. A reading today
> will show where it got to.

### 24.16 A correction has overrun — `correction-stalled`

> **The correction has run longer than expected**
> Nine days have passed with no readings on what should have been a three-day
> plan. A reading today will show where it got to.

Branch 3, and the figures are §4's: `overrun` is `days > (expected × 2) + 2`,
measured on the **calendar**, so a three-day plan survives to day 8 and the
card above is day 9. It states the elapsed time and the expectation and asks
for a reading — it does not say the correction failed, because with no reading
since it started nothing is known about where the level got to.

### 24.17 Out of range and coming back — `recovering`

> **Alkalinity is below your range but coming back**
> 8.1 dKH, up from 7.9 over the last three readings.

**Only when no dose change is in play** — §23.6. With a recent change this
situation is 24.6 instead.

### 24.18 Out of range and still going — `worsening`

> **Alkalinity is below your range and still falling**
> 8.0 dKH, down from 8.3 over the last three readings.

**Only when no dose change is in play** — §23.6. With a recent change this
situation is 24.7 instead.

These two are branch 21a and 21b, which §2 records as live in code and absent
from every previous specification. **§23.6 narrows when they may fire**;
nothing about their trigger conditions or tones moves, and §10's warning
stands — nothing asserts that they exist at all, so a refactor can still delete
them silently.

### 24.19 The change helped, but not enough — `fell-short`

> **The change helped but hasn't gone far enough**
> Alkalinity is 8.4 dKH, up from 8.1, still below your range. 10.2 mL/day would
> match what the tank is using.
> **Open the dosing wizard →**

The recommended figure is stated as *what would match*, exactly as in 24.2 —
`reef-chemistry.md` §28.1. The card reports a change that worked partly; it
does not carry an intention to finish the job.

### 24.20 The change went too far — `overshot`

> **The change went further than needed**
> Alkalinity is 9.0 dKH, up from 8.1, now above your range. 9.3 mL/day would
> match what the tank is using.
> **Open the dosing wizard →**

Same shape, opposite direction. **Note what is not offered:** the level is now
above the range, and the card still recommends only the consumption-matching
figure. Walking it back down is a return plan, it is a separate offer, and it
is not available here because the level is not steady yet —
`reef-chemistry.md` §28.2.

### 24.21 One reading in — not enough to say — contradiction state, does not exist

> **You have logged one reading since your dose change**
> Alkalinity is 8.4 dKH. One more will show whether the change is working.

**Movement not established** — the third of journey 4b's four contradiction
states, and the one that is a refusal rather than a verdict. It states the
position, because the position is known, and declines the direction, because
one reading is not a direction. Same shape as 24.5 and the same reason.

### 24.22 Still rising despite the change — contradiction state, does not exist

> **Alkalinity is still rising despite your dose change**
> 9.1 dKH now, up from 8.9 two days ago. You lowered the dose to 8.4 mL/day on
> the 14th and the rise hasn't slowed. It may need to come down further.
> **Open the dosing wizard →**

The mirror of 24.7, and **with it all four of journey 4b's contradiction states
have wording**: raised and still falling (24.7), changed and nothing moved
(24.8), one reading in (24.21), lowered and still rising (24.22).

**Two of the four exist in neither §2's list nor §3's table.** 24.7 and 24.22
are close to what `fell-short` and `overshot` express and may turn out to be
those two with their preconditions widened rather than new branches; 24.8 and
24.21 have no candidate anywhere in the code. Settling which is which is
`.agent/items/TW-026.md`'s first job and Stage 6d's work — **not an
implementer's judgement call**, because getting it wrong builds a further
engine on top of two that nearly work.

### 24.23 Far out, beyond what the daily dose can reach

> **Alkalinity is very low at 6.9 dKH**
> Bringing it to 8.5 would take about nine days at a safe rate.
> **Plan a gradual return to 8.5 dKH →**

**No alternative product is named**, and that is a correction to canon rather
than a drafting choice: `reef-chemistry.md` §9's rule to *"point at dry salt or
water changes"* is amended the same day, because the constraint is the rate and
not the product. §3's rails apply however the alkalinity gets there, so naming
a faster product does not make a fast change safe — it makes an unsafe one
easier to perform.

**The nine days is not a warning.** It is what it takes, and it is the figure
the decision is actually made against.

**Two things about this card are open, and neither may be closed by an
implementer** — both are carried at §25.6:

- **The volume ceiling's remaining role.** The half of §9's rule that says the
  app must not quote an impossible volume stands. Whether ~1.5 L survives as a
  sanity check on a single day's dose, or dissolves because a plan spread over
  enough days brings the daily volume under it anyway, is undecided.
- **The overlap with 24.9.** At 6.9 dKH the level is below `SAFE_BOUNDS`, so
  the *very low* card applies to the same reading. Two cards, one situation.
  The likely answer is the short one on the dashboard and this fuller one
  inside the wizard — brevity where you glance, the plan where a plan gets set
  — but it is not decided.

One further thing to notice rather than resolve: the offer reads *"Plan a
gradual return"*, which §15 registers as the **return plan** phrase, while
`reef-chemistry.md` §28.2 offers a return plan only when the level is **stable
and out of band**. A level this far down is usually neither. Going up, §28.5
says the instrument is a correction — so this card may be a correction wearing
the return plan's words, or the plan's condition may need widening. It belongs
to the same open item as the overlap above and is stated here so the next
reader does not take the phrase as settling it.

### 24.24 Rising faster than the dose accounts for — `idle`, held

> **Alkalinity is rising faster than your dose accounts for**
> 9.1 dKH, up from 8.6 two days ago. The dose is unchanged. Test again in two
> days.

**And at three consecutive, the same card escalates:**

> **Alkalinity has been rising faster than your dose accounts for since
> 10 August**
> Three readings running. The dose is unchanged.

**This is `reef-chemistry.md` §24 given wording** — the negative-consumption
rule, decided 14 August, whose own "Surfaces" paragraph required a marked idle
card echoing the wizard and whose part 4 required an escalation. Neither existed
in canon or in the card set. G-3.

**One card, two wordings, because it is one state at two evidence levels.** §24's
action is `hold` at every step, and *"escalating changes what is said, never what
is dosed"*; the `state` stays `idle` and the hold is **marked**, not branched.
**§2's ordered list does not gain a row** — a mark on a state is not a branch,
and adding one would put a third `idle` route into a list whose first-match
ordering is already carrying a row §26 removed.

**No cause is named, in either wording, and this is the decision rather than a
drafting choice.** §23.5 holds without exception here. **Naming the Setup
strength at the escalation was considered and rejected** — `reef-chemistry.md`
§24 part 4 had said the app *"should say so"*, naming a wrong Setup strength or
collapsed demand as the likely causes, and **that half of part 4 is withdrawn**.
Three readings running establish the *pattern*; they do not distinguish between
the six causes §24 itself lists as all consistent with the same arithmetic. A
plausible wrong cause is worse than no cause, and the Setup strength is the one
a keeper would act on by editing a number that may well be right.

**No water change is mentioned, and none may be.** `reef-chemistry.md` §24
part 3 asked *"has a water change or a one-off correction been logged?"*. §22 was
settled the other way on 16 August: **water changes stay in the trend fit and are
not subtracted from consumption, at any layer**, and the analytics-layer
mass-balance term was removed with it. A card that asks about a water change
invites the keeper to explain a figure the app has decided not to correct for,
and then does nothing with the answer. §22's deferral is explicit and this card
must not read as though it were not.

**No missing one-off correction is mentioned either.** Naming one as absent is
naming a cause — part 2's own prohibition, applied to part 3's own example.

**And where a correction *has* been logged, this card does not appear at all —
decided 16 August, Stage 5b.** The question left open here the day before was
whether the card gained a second wording for that case. **It does not, and it
gains no sentence of any kind: it is suppressed.** `reef-chemistry.md` §24
carries the decision and the reasoning; the consequence for this card is that
**§24.24 has one wording and one escalation, both of them the nothing-logged
case**, which is the case part 4's count was already the only case it counted.
Part 3 of §24 is now spent entirely — no water change in either direction, no
missing correction, no logged one.

**The suppression is on the card, not on the arithmetic.** The consumption
figure is still negative, part 1 still holds the dose, and nothing is staged.
**What changes is only that the app says nothing** — which is what it has to
say, because the keeper poured the extra themselves and told the app so.

**"Logged" is `reef-chemistry.md` §24's existing definition and gains nothing
here:** a one-off correction for **this element**, dated inside the window the
trend was fitted over. A correction for another element does not suppress this
card; neither does one that predates the window; and a water change never does.

**What survives of part 3 in the wording:** *"Test again in two days."* The
escalation drops it. Three retests two days apart have already happened by the
time it fires, and asking for a fourth on the same terms asks for evidence the
card has just finished reporting.

The dose sentence is §23.3's third case — it explains why no change is being
recommended — and without it the card reads as the app failing to notice a level
climbing. Both headlines are complete sentences and keep the parameter, §23.7.
**The escalation's headline carries a date** because its claim is about
duration; it is the only headline in the twenty-seven that does.

**The qualification outranks this card, unchanged.** `reef-chemistry.md` §24's
one qualification — a level at or over the top of its range and still rising
keeps its reduction — is a question about where the element is, not about the
consumption sum. That situation is not this card; it is the ordinary
`suggested`, 24.2, and nothing here reaches it.

### 24.25 A staged plan is due a reading — `due`

> **Time to test**
> You changed the alkalinity dose four days ago. A reading today will show
> whether it worked.

**§2 branch 10** — a staged plan is running, the settle window has passed, and
no reading has been logged. G-1.

**It shares 24.15's headline and is a card of its own.** The gap report asked
whether branch 10 reuses 24.15 or gets a twenty-fourth card, and the answer is
both halves of the question: the same two words at the top, a different sentence
underneath, because the two situations differ in exactly the way §1 says
everything differs. 24.15 is a **correction** — a known quantity, delivered, and
the question is *where it got to*. This is a **dose change** — a rate, and the
question is *whether it worked*. One reference wording per situation; the
headline is a fragment either way (§23.7) and the support carries the difference.

"You changed" is §23.2's permitted second person, as in 24.4's *"you raised"*.

**No dose figure, and §23.3 permits one here** — the dose has recently changed,
which is §23.3's first case. §23.3 is a limit on where a figure may appear, not
an instruction to print one wherever it may. This card's subject is the missing
reading; the figure belongs to the card the reading produces.

**§9.1 is unchanged by this.** `due` is unreachable by any existing test and has
never been seen on screen by anyone. Wording a state does not make it reachable,
and any new wizard test must still supply a staged `activePlan`.

### 24.26 Tested, and still too close to call — `settling`

> **Still too close to call**
> Alkalinity is 8.6 dKH after two readings since your dose change. One more will
> show which way it's going.

**Two or more readings since the change, and they settle nothing.** G-4. The
readings are neither steady enough to call the change finished nor moving enough
to call it working, failing or contradicted.

**It is the card for a reading set that clears none of `reef-chemistry.md` §30's
three bars while a change is in play.** Not §30.3 — the readings are further
apart than the noise floor, so "no response at all" (24.8) is not available. Not
§30.2 — they are not moving two to three times the floor against the change, so
"being contradicted" (24.7, 24.22) is not available. Not §30.1 — there is no
third reading in one direction. **The refusal is what the evidence bars look like
from the keeper's side**, and it is the only card that exists because three
separate bars were all missed.

**Three refusals, three different reasons, and they are not interchangeable:**

| Card | The situation | What is missing |
|---|---|---|
| 24.5 | too few readings, no change in play | readings |
| 24.21 | exactly one reading since a change | a second reading |
| **24.26** | **two or more since a change, inconclusive** | **agreement between the readings** |

*"Still"* marks the position in that sequence: 24.4 said *"too soon to tell"*
before any reading, and this says the same thing has survived two of them.

It states the position, because the position is known, and declines the
direction, because two readings that disagree are not a direction — §14, and the
same shape as 24.5 and 24.21.

**No dose figure.** Nothing is being recommended and nothing has just changed
that the card is reporting on; §23.3's three cases are not met.

### 24.27 The change worked, and the level is settled out of range — `worked`, route 12

> **The change worked, but alkalinity is settled below your range**
> 8.0 dKH, holding steady since the change. Your dose is now matching what the
> tank uses.
> **Plan a gradual return to 8.5 dKH →**

**§2 branch 12**, tab label "Steady, out of range", §3 tone **grey** — the one
`worked` route that is not teal. G-2, and it answers both halves of that gap:
**this is the card, and yes it carries §24.3's offer.**

**This is `reef-chemistry.md` §28.2's state.** The level is stable and it is out
of band, which is the condition for a return plan and the only condition for
one. §28.6's second bullet asked whether *"a level that has just finished a
staged plan should be offered a return plan in the same breath"*, and deferred
it here. It should: the plan finished, the dose now matches consumption, and
that is precisely §28.3's *"the dose figure has nothing left to say — it holds
the level where it is, and where it is, is wrong."* Refusing the offer here would
leave the keeper parked at 8.0 with a card congratulating them, which is the
same dead end §28.3 describes at 455 ppm.

**§28.2's exclusion is satisfied, not strained.** No dose-change suggestion
appears on this card, because there is none to make — the dose matches
consumption, which is what *steady* means. The offer and a suggestion still never
share a card.

The dose sentence is §23.3's third case, exactly as on 24.3, and for the same
reason: without it the offer has nothing to stand on. **The destination is the
band midpoint**, `reef-chemistry.md` §9, as on 24.3 and 24.23.

**Grey with an offer is not a contradiction**, and 24.3 already establishes the
pairing: grey is §3's *nothing to do* about the **dose**, and the offer is not a
dose. §3's tone for route 12 does not move.

**The headline keeps the parameter under §23.7**, and it is worth saying why,
because the first clause would stand without it. *"The change worked"* alone is a
complete sentence; *"but is settled below your range"* is not, and the two
clauses are one sentence. The test is whether the sentence stands, not whether a
clause does.

**"Settled" is used here in its ordinary sense and is not §22's verdict.** §22's
`steady-off` grades a window — *very steady, but settled off the band* — and
renders on the steadiness panel. This is a wizard state about a dose change that
has finished. The two describe the same tank from two axes and neither may be
rendered as the other (§13, §22). Note also that the card says **below your
range** where §22's description of the same shape says *off the band*: §15's
16 August decision, and the reason band stays canon's word and never reaches
the screen.

### What these twenty-seven do not cover

Stated so the gap is not mistaken for completeness. **The seven states the
first pass left to draft are drafted** — `correction-done` (24.13, 24.14),
`correction-due` (24.15), `recovering` (24.17), `worsening` (24.18),
`fell-short` (24.19), `overshot` (24.20), and the "wrong tool" variant (24.23).
**All four contradiction states have wording** (24.7, 24.8, 24.21, 24.22), and
two of them still have no state in the engine. **The four Stage 4 found with
none are written** (24.24–24.27), and one of them — the negative-consumption
hold — had a rule in `reef-chemistry.md` §24 requiring wording that no card had
supplied since 14 August.

What these cards do **not** settle:

- **Which branch produces which card**, where a card and a branch are not one
  to one. 24.13 and 24.14 are one state with two flags; 24.7 and 24.22 may be
  `fell-short` and `overshot` widened; 24.17 and 24.18 need §23.6's recency
  precondition, which the engine cannot currently answer for a dose changed
  outside the wizard. Stage 4 reports these; Stage 6d decides them. **24.24 is
  the reverse case and is settled here**: it is a mark on `idle`, not a branch,
  and §2's list does not move for it.
- **G-5's off-by-one, which the count above depends on.** §2's branch 22 and
  §3's "Dose right, level off" row describe a card `reef-chemistry.md` §26
  removed as unreachable. Until that row goes, any statement of the form "every
  branch has a card" is being checked against a list with a branch that cannot
  fire. Housekeeping, and it is why this section no longer states a total
  against §2.
- **Two figures the cards imply and canon does not name** — what counts as a
  *recent* dose change (§23.6), and whether §9's volume ceiling survives
  (24.23). Both are Dan's, both are carried at §25.6.
- **The other parameters' wording.** Alkalinity throughout, calcium and
  magnesium by the same shapes in their own units (§23.4). Phosphate, nitrate
  and salinity are not dosed and their content is `reef-chemistry.md` §29 —
  which forbids most of the vocabulary above for phosphate specifically. **No
  card here may be lifted onto a nutrient** without reading that section first.

**The surfaces that render these cards are §25**, written the same day. The
gap the first pass named here is closed there.

### In plain terms

Twenty-seven cards, written out word for word, because the app is about to be
rebuilt from them and "something like this" is how the app got into
contradicting itself in the first place.

Four of them describe situations the app cannot currently recognise at all — a
dose raised that did nothing, a level still falling after a raise, a level
still rising after a cut, and the honest "one reading in, too early to say".
All four are things a keeper notices immediately and the app has been silent
about.

One of them, the steady-but-in-the-wrong-place card, is the one that has been
quietly useless: it told you your dose was right and left you sitting outside
your range with nowhere to go. It now ends with an offer to walk you back — and
so does the card you get when a dose change works perfectly and parks your
alkalinity just under your range, which used to congratulate you and stop there.

One is where the app stops recommending a different product. If your alkalinity
is at 6.9 and nine days of gradual dosing is what it takes, that is what it says
— nine days — instead of suggesting a dry buffer or a water change that gets
there faster by doing to your corals exactly what every other rule in the app
exists to prevent.

The last four were found by reading the list of situations against the list of
cards and noticing four situations with nothing to say. Your tank gaining
alkalinity faster than your dose explains — which the app has had a rule about
since 14 August and no words for. The same thing three readings running, which
it now says plainly and still without guessing why. A dose you changed and never
tested, which now asks you to. And the honest "two readings in and it is still
too close to call", which is the app declining to tell you something it does not
know rather than picking the likelier of two guesses.

---

## 25. The surfaces — what each one renders

**Decided 16 Aug (Dan, spec owner).** Folded in from
`docs/spec/message-spec-3-surfaces.md`, the same way §23 and §24 were folded in
from part 1. §23 and §24 settled what the wizard says; **this section settles
what everything that renders it does with it**, and it is the last of Stage 3.

**The wizard owns the verdict. No surface here forms its own.** That is §0.3,
§7 and §19 already, and this section adds the sentence those three imply
without ever quite saying: **where a surface appears to need a claim the wizard
cannot supply, that is a gap in the wizard, not licence to compute one
locally.** Every contradiction in journey 4 and every one found on 16 August
started as a surface answering a question the engine had not been asked.

### 25.1 The tank summary

**What it shows: one notice per parameter, and nothing else.** §20 already says
one live notice per parameter, superseded not stacked; this says the summary
shows exactly that set and adds nothing to it.

#### The short form is generated, never written

**The summary shows the headline plus the first sentence of the wizard's card.
It is not a separate wording.**

This is not a new rule — it is §7's existing requirement, restated because it
is the load-bearing one: **it is the only arrangement in which two wordings
cannot drift apart, because there is only one wording.** A summary line written
by hand to say the same thing as a card is two strings that agree today.

Worked through eleven of the twelve first-pass cards, as the check that the
rule generates sensible lines rather than as a second source:

| Card | Headline | First sentence |
|---|---|---|
| 24.1 | Alkalinity is holding at 8.5 dKH | In your range of 8.2–8.8. |
| 24.2 | Alkalinity is in range but falling | 8.5 dKH now, down about 0.1 a day over the last three readings. |
| 24.3 | Alkalinity is steady at 8.0 dKH, below your range | Your dose is matching what the tank uses, so it will stay here. |
| 24.4 | Too soon to tell | You raised the alkalinity dose to 9.7 mL/day yesterday. |
| 24.5 | Not enough readings yet | Alkalinity is 8.5 dKH, in your range. |
| 24.6 | Your dose change is working | Alkalinity is up to 8.6 dKH from 8.3, in your range. |
| 24.7 | Alkalinity is still falling despite your dose change | 8.3 dKH now, down from 8.5 two days ago. |
| 24.8 | Alkalinity hasn't moved since your dose change | 8.5 dKH on the 14th, 8.5 now. |
| 24.9 | Alkalinity is very low at 6.8 dKH | This needs a correction unless you are deliberately holding it there. |
| 24.10 | Correction running | Alkalinity is 8.1 dKH, up from 7.6 when the correction started. |
| 24.11 | The correction isn't working | Alkalinity is 7.6 dKH, the same as when the correction started four days ago. |

24.12, 24.13–24.23 and 24.24–24.27 take the same treatment and are not
tabulated: the rule is generative, and a table that has to be extended per card
is the hand-written second wording this rule exists to prevent.

**Tapping a notice opens the full card.** The summary is a way in, not a
summary of the reasoning.

**One live violation this makes explicit**, already recorded in
`.agent/items/TW-027.md`: `correction-done` writes its own support sentence in
`src/lib/narrative-engine.js`, and `scripts/verify/wordingcheck.mjs` checks
`claim:` but not `support:`, so it passes a blocking check.

#### The three layers

**Collapsed** — the summary headline only. **Its composition rule is below**;
until 16 August this layer was one word of specification for the most-read
string in the app (G-27).

**Expanded** — the live notices, one per parameter.

**Below those, a hidden section** — collapsed, listing what is hidden. Each
entry can be unhidden individually, which returns it to the live list, plus an
unhide-all.

#### The collapsed headline — three slots, generated

**Decided 16 Aug (Dan, spec owner)**, closing G-27 and answering what the health
score's deletion left behind.

**Three slots, in this order, each dropped when it is empty:**

1. **the worst thing now**
2. **anything else notable**
3. **anything in flight**

> **Alkalinity is out of range, and several others are moving — a dose change is
> still settling.**

That is all three slots filled. With slot 3 empty it stops at *"…and several
others are moving."* With slots 2 and 3 empty it is *"Alkalinity is out of
range."* **A dropped slot leaves nothing behind** — no "and nothing else", no
placeholder clause — which is why a quiet tank produces a short line, or none at
all, rather than three clauses reporting that there is nothing to report.

**It is generated from the same verdicts the tiles render, and never
hand-composed.** This is §25.1's own first rule applied one level up: the
headline is the one string in the app that speaks for the whole tank, and a
hand-written tank-level sentence is a second wording that agrees with the tiles
today and drifts from them by the next release. **A literal in the summary's
code path is a finding**, exactly as it is for a card's short form. The deleted
health score is what this rule is written against — nineteen constants, one
number, and no way for a keeper to check it against anything on screen. **Every
clause of this headline is checkable against the tiles below it**, which is the
property the score never had.

**Naming: up to three named individually, then "several others".**

- **One, two or three** parameters out of range: each is **named**.
- **Four or more**: the **worst two are named**, followed by **"several
  others"**.

Three is the point at which a list stops being readable at a glance, and the
worst two are the two a keeper would act on first. The cut is on the count, not
on the screen width — the same tank produces the same headline on every device,
because a headline that reflows into a different claim is two headlines.

**Worst is defined, and it is a two-key sort:**

1. **Alert tier first.** A parameter at `alert-low` or `alert-high` (§13, and
   `reef-chemistry.md` §18 for which parameters can reach those bands at all)
   outranks every parameter that is merely out of range, however far out.
2. **Then furthest out as a fraction of its own band** — the distance past the
   nearer edge of the user's target range, divided by that range's width.

**The fraction is what makes parameters comparable.** 0.3 dKH and 30 ppm are not
two sizes of the same thing, and a raw distance would sort the tank by which
parameter happens to be measured in the larger unit — magnesium would lead every
headline it appeared in. Dividing by the keeper's own range width asks the only
question that means the same thing for all nine: *how far out is this, for this
parameter, on this tank.*

**This is a ranking key, not a margin, and `reef-chemistry.md` §27 is
untouched.** §27 rule 3 forbids defining a **margin** in terms of a band width,
for the reason it states — a keeper who widens their band has not decided that
being far out matters less. Nothing here is a margin: this key gates no
recommendation, suppresses none, relaxes no constraint and changes no figure. It
decides which of two parameters is named first in one sentence. `ALK_CLEARLY_OUT`
and its two siblings keep their fixed values and their meaning. The distinction
is the whole of §27's second decision — *the margin governs wording, nothing
else* — read the other way round: **an ordering governs wording and must never
become a margin.**

Both comparisons run at **stored precision** and against the last reading, §13
and `reef-chemistry.md` §26.

**What fills each slot** — derived from canon rather than stated by the
decision, and written here so the rule is implementable. Correcting any row is a
one-line change to this paragraph, not a new concept; §20's mapping of
**serious** is recorded the same way and for the same reason.

| Slot | What goes in it | Source |
|---|---|---|
| 1 — the worst thing now | the worst parameter whose §13 band is `alert-*` or `out-of-band-*`, by the sort above | §13, §18 |
| 2 — anything else notable | the remaining out-of-range parameters under the naming rule, and parameters that are **moving** | §13, §11's movement rule |
| 3 — anything in flight | parameters whose wizard state is a change or plan the keeper has made that the app has not yet judged — `settling`, `due`, `correcting`, `correcting-dose`, `correction-due`, `correction-stalled` | §2 |

**Slot 3 is about what has been started, not about what is wrong.** `worked`,
`fell-short`, `overshot` and `correction-done` all follow an action and are
**judged**, so they are not in flight; they have already said what happened.
`suggested` is the reverse — nothing has been started yet — and belongs to the
parameter's own notice, not to the tank's headline.

**"Moving" is §11's word and §11's rule**, and it is not `drifting` or
`unsettled`, both of which §15 reserves for narrower things. The headline says
moving; the tile says which way.

**What this rule does not settle**, recorded rather than guessed:

- ~~**An exact tie on both keys.**~~ **Closed 16 August, Stage 5b: the fixed
  parameter order breaks it** — alkalinity, calcium, magnesium, salinity,
  nitrate, phosphate, potassium, ammonia, set two subsections below and applying
  here as well. **One order, one reason.** The tiles' own order was the obvious
  candidate and is still not chosen: a display arrangement that may change for
  display reasons cannot be what makes a headline checkable.
- **Whether an "N of M in range" claim may appear at all** when every slot is
  empty. That is G-29, still open, and the candidate recorded with the health
  score's deletion — *"3 of 6 in range, 2 need attention"* — belongs to it. **This
  rule does not adopt it**: an all-quiet tank drops all three slots, and what a
  quiet tank's headline says is the remaining half of the question.
- ~~**Ordering inside the expanded list.** G-28, untouched.~~ **Closed
  16 August, Stage 5b — the next subsection.** This rule orders the
  **headline's** clauses; the ordering of the notices below it is now set
  separately, and the two are deliberately not the same rule.

#### The order of the expanded list — decided 16 August, Stage 5b

**Decided 16 Aug (Dan, spec owner)**, closing G-28. §20 gives one notice per
parameter and §25.1 gives the expanded list; **in what order** was the one thing
neither said, and the app has been answering it with a `rank` 0–8
(`narrative-engine.js:388-540`) that interleaves findings and dose states and has
no entry anywhere in canon.

**Four tiers, in this order:**

1. **Alerts.** Any parameter at `alert-low` or `alert-high` (§13;
   `reef-chemistry.md` §18 for which parameters can reach them, and §32 for
   ammonia, whose detectable state is an alert and whose undetectable state
   produces no notice to place).
2. **Out of range.** `out-of-band-low` and `out-of-band-high`.
3. **Relationship notices.** §25.4 kind 3 — the small set belonging to no single
   parameter.
4. **Everything else, in a fixed parameter order.**

**The fixed parameter order:**

> **alkalinity, calcium, magnesium, salinity, nitrate, phosphate, potassium,
> ammonia**

**Within tiers 1 and 2, notices are ranked by proportional distance** — the
distance past the nearer edge of the user's target range, divided by that
range's width, furthest first. **The fixed order breaks ties.**

That is the same key the collapsed headline sorts on, and it is the same key for
the same reason: 0.3 dKH and 30 ppm are not two sizes of the same thing, and a
raw distance would order the list by which parameter happens to be measured in
the larger unit. **It is a ranking key and not a margin here too** —
`reef-chemistry.md` §27 rule 3 is untouched, and every sentence of §25.1's
headline rule about that distinction applies unchanged to this one.

**The fixed order is a total order, so the list is always deterministic.** That
is the property being bought: two parameters equally far out, in the same tier,
do not reorder between renders. A list whose order changes without the tank
changing is a list a keeper cannot learn.

**Why a fixed order rather than the tiles' order or the order they were tested
in.** Test order is a fact about the keeper's morning, not about the tank, and it
would reorder the summary every time they tested in a different sequence. The
tiles' order is a display arrangement that may change for display reasons. **The
fixed order is a property of the parameters**, and it runs roughly from the ones
the app doses and reasons about most fully to the ones it watches.

**Ammonia is last in the fixed order and is never disadvantaged by it**, which
is worth stating because it looks wrong at a glance. Ammonia only ever produces
a notice when it is detectable, and a detectable reading is an alert
(`reef-chemistry.md` §18, §32) — so it enters at tier 1, where tier outranks the
fixed order absolutely. **The fixed order decides its position only against
other alerts, and only on an exact tie.**

**Two things are derived rather than stated by the decision, and written here so
the rule is implementable** — the same standing, and the same one-line
correctability, as §20's mapping of *serious* and the slot table above:

- **pH is not in the fixed order.** The order names eight parameters and the app
  has nine; pH has no alert tier (`reef-chemistry.md` §18) but does produce
  notices — §31's *pH high* and *CO2 signature* are both ratified. **pH sorts
  last**, after ammonia, as the only placement that adds nothing to what the
  decision states. Correcting this is a one-line change to this bullet. **Put to
  the owner on 16 August and left standing as derived** — confirmed right, and
  deliberately not promoted to a decision, so it keeps its one-line
  correctability. **The confirmation is not a ninth entry in the fixed order**;
  the order still names eight and this bullet still places the ninth.
- **Relationship notices order among themselves by the earliest parameter they
  name** in the fixed order. Tier 3 needs an internal order for the same
  determinism reason as the others, and the decision does not give one.

**The fixed order breaks the headline's tie as well — confirmed 16 August,
Stage 5b.** It was decided about this list, and it applies to both:

> **One order, one reason.**

§25.1's collapsed headline sorts on the same two keys as tiers 1 and 2 here, and
until today it had no answer for an exact tie on both. **It has this one.** A
single fixed order across the two rules is also the only arrangement in which
the headline and the list beneath it cannot name two out-of-range parameters in
opposite orders — which is the property the headline rule is built on, since
every clause of it is meant to be checkable against the tiles below. **Two
orderings would have been a second wording of the same fact**, in the shape
§25.1's first rule exists to prevent. **§25.6 item 6 closes.**

**What this does not touch.** §20's one-notice-per-parameter rule and its
supersession are unchanged — this orders the set, it does not change its
membership. The hidden section below the list is unchanged. And the headline
remains its **own rule with its own subject**: it sorts clauses about a whole
tank and this sorts notices. They now share a tie-break; they do not become one
rule, and a change to either is not automatically a change to the other.

#### Hidden and off are different things

**Hidden is per notice and temporary.** Hiding dismisses *that* notice. When
the situation changes and a new verdict supersedes it, **the notice reappears
in the live list automatically.** This is load-bearing: **hiding must never
silence a situation permanently.** It is §20's resurfacing rule, which
`findingHidden` already implements — an entry stays hidden only while its
stored signature still equals the current one — and it is why the hidden list
does not grow without bound.

**Off is per notice type and permanent**, set in Setup, until changed again.

**The escalation is deliberate.** Hide it once; if it keeps coming back and you
never want it, turn the type off. **The app does not ask up front whether you
want a class of notice** — that is a judgement, and §21 says Setup asks for
facts. Off is set in Setup, but it is not a Setup *question*: it is a switch
the user reaches for after the app has shown them the thing they want to stop
seeing.

**This is the answer to the ultra-low-nutrient case.** Someone deliberately
running phosphate at 0.02 would see the below-0.03 warning
(`reef-chemistry.md` §29.4) constantly. They turn that type off. **The app
never asks "are you running ULNS?"** — which is the §21 question that would
have to exist otherwise, and exactly the kind of judgement §21 refuses.

#### A notice type is a parameter — decided 16 August, Stage 5b

**Decided 16 Aug (Dan, spec owner)**, closing G-31. The paragraphs above have
said *"off is per notice type"* since Stage 3 without saying what a type is, and
`.agent/gap-report.md` listed four candidates — the finding `id`, the id family,
the parameter, or the §25.4 kind. **It is the parameter.**

**One switch per parameter, and it turns off everything that parameter would
say.** Not the id, so a keeper does not have to find and silence
`far-out-phosphate` and then `ratio-po4-limited` and then whatever the next one
is called. Not the kind, which would silence the same class of notice across
every parameter at once. **The parameter is the unit the keeper thinks in**, and
it is the only one of the four that a Setup screen can present without teaching
the keeper the app's internal taxonomy.

**Turning phosphate off turns off phosphate and nothing else.** The nitrate
warning is unaffected — which is the question G-31 asked in exactly those terms
— and so is every other parameter.

**Off includes alerts and safe-bounds excursions.** There is no notice a
parameter can produce that survives its switch being off: not `alert-low`, not
`alert-high`, not a reading beyond §2's safe bounds, not §29.4's fixed
warnings, and not ammonia's detectable notice (`reef-chemistry.md` §32.6, which
records this as the sharpest case and accepts it by name).

**This matches hide exactly, and that is the point.** §20 already settled the
same question for hiding — *"Every notice can be hidden. No exceptions,
including safe-bounds excursions"* — on the reasoning that *"there might be a
reason the app doesn't know about."* **A control with an exception list is a
control the keeper cannot trust**, and two controls with different exception
lists is worse: the keeper who hides an alert successfully and then finds the
off switch refuses the same notice has learned that the app's rules are
arbitrary.

**The reasoning, recorded, because this is the half that is not obvious.**

> **The keeper ran the test and typed the number in.** The app is choosing
> whether to **comment** on a figure that is already in front of them — it is
> not informing them of something they do not have.

That sentence is the whole argument and it is worth keeping intact. Every
instinct against letting a user silence an alert comes from systems that hold
information the user does not: a smoke alarm, a warning light, a monitor on a
sensor nobody is watching. **This app holds none.** The reading is the keeper's,
it came from their own kit and their own hands, it is on the tile, it is on the
chart, and it is in the log. Turning the notice off removes the app's *remark*
about it and removes nothing else.

**What off does not do**, so that this is not read wider than it is: it does not
stop the reading being recorded, charted, or shown on its tile with its band
colour; it does not stop the parameter being assessed by the engine (§19); and
it does not remove it from anything the keeper opens deliberately. **It removes
the parameter from the notices**, which are the app speaking first.

**And it is reversible in one place.** Off lives in Setup and is changed there,
which is also where the keeper who wonders why they have heard nothing about
phosphate for two months will find the answer.

#### Serious notices confirm before hiding

Unchanged from §20 and restated here because this is the surface it happens
on: hiding a notice flagged serious asks *"This is flagged as a serious notice.
Are you sure you wish to hide it?"*, with a line noting hidden notices can be
brought back from the tank summary. §20's mapping of **serious** — severity
`act`, or a wizard state whose §3 tone is red — is unchanged, and so is the
point that the confirmation is a speed bump rather than a class of notice that
cannot be hidden.

#### The health score is deleted — 16 August

**Decided 16 Aug (Dan, spec owner), Stage 5.** A 0–100 number on the front of
the app, computed from **nineteen constants** in `src/lib/narrative-engine.js`,
with **no canon entry of any kind** — not a band, not a verdict, not a notice,
not a message. It has already been caught showing 42 while its own working panel
summed to 71.

**Deleted, along with `ScoreBreakdown`, the score colour bands and the headline
score bands.**

**The reason is §23.1, the app's own first wording rule: state it, then show the
basis.** A single number claiming to summarise a tank's health is the least
checkable thing in the app — there is no basis to show, only nineteen weights
nobody has seen. Every other number the app puts on screen can be traced to a
reading, a band or a formula in `reef-chemistry.md`; this one traces to a blend
of a blend.

**What replaces it — decided the same day, and it is the collapsed headline
above.** This paragraph said *"nothing yet, and there is already a candidate"*,
named the summary headline as the thing that needed writing regardless, and
deferred to G-27. **G-27 is answered**: three slots, generated from the same
verdicts the tiles render, worst first. The property the score never had is the
one the rule is built on — every clause can be checked against the tiles below
it.

**The candidate recorded here is not what was adopted.** *"3 of 6 in range, 2
need attention"* is a count of the quiet as well as the loud, and what may be
counted as in range and holding is G-29, still open. The headline that shipped
speaks only about what is not quiet, and says nothing at all when nothing is —
which is a narrower claim and one no open question is blocking.

#### App-level notices do not belong here

No backup in three weeks, storage nearly full, a test kit expiring — **these
are about the app, not the tank**, and the summary is one notice per parameter.
They leave.

**Tasks is the likely home**, since each is an action. **Not settled**: Tasks
today handles reminders the user creates, and these are the app noticing
something, which may not fit the same list. Worked through when Tasks is
specified. Carried at §25.6.

### 25.2 Parameter cards and the history modal

#### The contradiction that has to stop

On 16 August, using the app, Dan found a card saying **"alkalinity is rising"**
directly above a panel reading **WEEKLY DRIFT −0.50 dKH/wk**, with a chart
showing both. **Both were true over different windows. Neither stated its
window. Nothing reconciled them.**

**The fix is not wording. It is deciding what the steadiness panel is for.**

#### The split

**The wizard answers: which way is it going, and what should happen.** It works
from the last few readings and **it owns direction**.

**The steadiness panel answers: how consistent has this been.** A longer
window, and a genuinely different question — which is §22's whole basis for
registering a second vocabulary at all.

**They never compete because they never make the same kind of claim.**

#### Two rules that enforce it

**1. The panel leads with its window**, as a heading rather than a label beside
a number:

> **Over the last 30 days**
> Wide swing — 1.1 dKH between highest and lowest. 18% of readings in range.

**The heading states the window the verdict was actually graded over.** A panel
heading that names a window the grading did not use is the same defect this rule
was written to fix.

**Amended 16 August (Dan, spec owner), later the same day — Stage 5.** As first
written, this rule fixed the window per parameter: `reef-chemistry.md` §4's
analysis window, 14 days for alkalinity and 28 for calcium and magnesium. **The
app offers 7 / 30 / 90 / All and grades whatever the keeper picks, and that is
the behaviour that stays.**

> **The buttons stay. The panel grades the selected window and names it in its
> heading.**

> *"Over the last 90 days — wide swing, 1.1 dKH between highest and lowest."*

No data is hidden, no button is removed and the chart is untouched. **The rule
§25.2 was written to enforce is satisfied either way** — a verdict must say what
it judged — and it is satisfied by the heading naming the selection, which is
the honest description of what the panel actually did. Fixing the window would
have deleted a control the keeper uses in order to make a sentence true, when
the sentence can simply be made true.

**This does not touch §4.** The analysis window remains what the wizard's
arithmetic runs on — consumption, dose gaps, `reef-chemistry.md` §11's movement
rule. The panel is the other question, over the span the keeper asked about, and
the two are now visibly different questions rather than accidentally different
numbers.

**2. The panel never uses direction words.** No rising, no falling, no
climbing, no drifting up or down. **Direction belongs to the wizard.** The
panel talks about spread, consistency, and how much of the time a level sat in
range.

That is the whole fix. **Two headings, two time frames, no shared vocabulary.**

**One registered string breaks rule 2 and is not silently reworded here.**
§22's six verdicts are position words and spread words except one: `sliding`
renders as **"Moving up/down fast"**. The verdict *word* is unaffected — this
is a rule about the panel's language, not about the six — but its headline is
direction, on the panel, which is what rule 2 forbids. Re-drafting it is the
kind of work §24 did, constrained by this rule; it is recorded here and in §22
rather than guessed at, and until it is done the panel has one string that
contradicts its own rule.

#### What was considered and not done

An explanatory line — *"this is a longer view than the advice above"*.
**Rejected: if the panel needs a caption saying it is different, it is not
different enough**, and the caption reads as clutter within months.

**Revisit only if the built screen still feels contradictory. Fix the panel
before captioning it.**

#### `paramContext` is deleted, and nothing replaces it — 16 August

**Decided 16 Aug (Dan, spec owner), Stage 5.** Eight prose blocks
(`src/lib/analytics/reading-meaning.js:17-87`) fire whenever the last reading is
outside the user's band and render on this modal below the steadiness verdict.
Between them they quote about fifteen figures canon has never named, against a
band the keeper set themselves.

**One of them contradicts canon outright:** it tells a keeper that tanks run
happily up to around 500–550 ppm calcium, where `reef-chemistry.md` §2 caps
calcium at 500 **because above that it pulls alkalinity down**. Others quote
magnesium's *"1300–1400 most guides quote"* against §2's 1275–1425, a phosphate
figure of 0.15 that appears nowhere, and a full set of potassium numbers for a
parameter canon has no reasoning about at all.

**Most of the block also breaches §23.5 and `reef-chemistry.md` §29.6** — never
speculate about causes, and no suggested levers: *"water changes are the likely
source"*, *"low magnesium is usually the reason calcium won't hold"*, *"a little
more feeding is normally the fix"*, *"dose nitrate back up to around 5 ppm"*.

**Nothing replaces it.** The band says where the level is and the verdict says
how steady it has been; **explaining what that means is the kind of writing that
goes stale and then contradicts something else**, which is precisely what
happened here. A keeper who wants to know why 550 is or is not fine is asking a
question this app has decided not to answer — see §25.5 on Insights, which is
the same instinct and is deliberately unspecified for the same reason.

The figures that *were* canon all along — 0.5 dKH/day (`reef-chemistry.md` §3's
rail) and the 380 ppm calcium floor (§2 layer 1) — are not lost with the block:
they are in canon, which is where a surface should have been reading them from.

### 25.3 The reading confirmation

**A two-line receipt, then the wizard's full card.**

> **8.5 dKH logged**
> In your range. Down 0.2 from two days ago.
>
> **Alkalinity is in range but falling** — down about 0.1 a day over the last
> three readings. Your dose of 9.0 mL/day is below what the tank is using;
> 9.7 mL/day would match it.
> **Open the dosing wizard →**

**Two lines above the fold are the receipt**: the value, where it sits, how it
moved since last time. Below that, the wizard's card verbatim.

**The alternative was a pointer** — *"alkalinity is falling, see the dosing
wizard"* — **and it was rejected**, because the app's whole shape is that
things surface where you are rather than making you go looking.

**It does not become overload, because the card's length already scales with
how much there is to say.** When nothing is wrong it is two short lines
(§24.1). The confirmation only gets long when something is actually happening,
which is exactly when it is wanted. **Start here and tighten if it proves too
much** — easier to trim than to discover it was needed.

**What it must never do: form its own opinion.** §7 already forbids this, and
it is where journey 4's worst example came from — a confirmation saying
*"nothing to do"* while the wizard asked for a dose change. **The receipt line
may use its own voice about the value. The verdict is the wizard's, rendered.**

### 25.4 Findings — three kinds and no fourth

**Findings largely stop being a separate thing.** `buildFindings` is 709 lines
today with its own classifiers and thresholds, and it is what produced the
phosphate noise journey 5 records. **Once the engine produces one verdict per
parameter, a notice is that verdict rendered** — there is nothing left for a
separate findings engine to decide.

**Three kinds survive.**

**1. The parameter's verdict.** The engine's output, rendered. Covers every
dosed and non-dosed parameter (§19).

**2. A suspect reading — belongs to its parameter.**

> **This alkalinity reading looks unusual**
> 7.2 dKH, 1.3 below your last reading two days ago. That is a larger jump than
> the tank has shown before. Worth retesting before acting on it.

It reports the size of the jump against the tank's own history and asks for a
retest. It does not say the kit is wrong (§14) and does not guess at a cause
(§23.5).

**3. Relationship notices — their own slot.** The small set that genuinely
belong to no single parameter.

> **Alkalinity and calcium are both falling faster than usual**
> Alkalinity down 0.15 a day, calcium down 12 ppm a week, both steeper than the
> last month. Consumption may have risen.

*"Consumption may have risen"* is not §23.5 speculation, and the line between
them is worth stating once: consumption is a figure the engine computes from
the readings and the dose (`reef-chemistry.md` §6), so this reports the
arithmetic. *"Something is using it up"* would be the same sentence about the
tank, which the app cannot see, and is forbidden.

And the magnesium gate, which is about a relationship even though it names one
parameter (`reef-chemistry.md` §10):

> **Magnesium is low at 1180 ppm**
> Alkalinity and calcium corrections are held until magnesium comes up — neither
> holds properly below about 1250.

**These need their own slot in the summary**, since the summary is otherwise
one notice per parameter. **Placed 16 August, Stage 5b:** the ordering decision
at §25.1 makes them **the third of its four tiers** — after every alert and every
out-of-range parameter, before everything else, ordered among themselves by the
earliest parameter they name. That is the slot, and §25.6 item 4 closes with it.
**Hideability is unchanged and untouched** — a relationship notice is a notice,
§20 applies, and whether hiding one hides it for both parameters it names is a
question about hiding rather than about placement.

**A fourth kind is a finding, not a feature.** Anything that is none of these
three is either a parameter verdict the engine should be producing, or a
surface forming an opinion (§19, an S1 defect).

#### Ammonia's notice is kind 1, and it is the only parameter with no quiet form

`reef-chemistry.md` §32 gives ammonia two states. **Detectable produces one
kind-1 notice** — the parameter's verdict, rendered, at alert tier, on a single
reading. **Undetectable produces nothing**, which no other parameter does: every
other parameter has a quiet verdict in the shape of §24.1, and ammonia has none
and is not to be given one. §32.3 carries the reasoning. **The two live findings,
`ammonia-high` and `ammonia-detected`, become one** — a second tier would be a
band, and §32 has none.

#### The "heading out of range" finding is deleted — 16 August, Stage 5b

**Decided 16 Aug (Dan, spec owner)**, with `drifting`'s answer at §13:
**`heading-out-<param>` (`findings.js:466-557`) is deleted outright.** Not
rewritten, not narrowed, not given a threshold. **Recorded here as a deletion
with its reason**, alongside the other deletions this document carries, so it is
not re-derived by someone reading the gap in the card set as an invitation.

What it says today, on the same screen as the wizard's verdict:

> *"Alkalinity is 8.5 dKH and moving down at about 0.35 dKH a week. At that pace
> it reaches the bottom of your range in roughly 12 days. The dosing protocol
> looks only as far back as your last dose change and sees nothing to act on
> there, so no dose change is suggested yet — **but the longer view is
> drifting.** Worth another test or two to see which holds."*

**The reason is that it is a surface reconciling two time windows in prose, and
§25.2 replaced that with a structural fix.** The sentence is doing, in words,
exactly what the 16 August contradiction did by accident: it holds the wizard's
window and a longer window side by side, notices they disagree, and writes a
paragraph explaining the disagreement to the keeper. **§25.2's answer was not to
word it better.** It was to decide what each surface is for — the wizard owns
direction over its own window, the panel owns spread over the window the keeper
picked — **so that the two never make the same kind of claim and never need
reconciling.** This finding is the reconciliation the fix removed the need for,
still running.

**It is also the fault in its own most literal form.** *"The dosing protocol
looks only as far back as your last dose change and sees nothing to act on
there"* is a surface explaining the engine's reasoning to excuse its own
disagreement with it — the same instinct as the two regexes over the engine's
English (`.agent/gap-report.md` D-9), one step further along.

**Nothing replaces it, and the parameter is not left silent.** If a level moving
inside its band warrants saying something, **the wizard says it**, from §11's
movement rule over §4's window, in the card the keeper opens — and §25.1's
headline can name a **moving** parameter under §11's rule. The tile still shows
`drifting`. What goes is the second opinion, computed from a second window, on a
surface that is not entitled to one.

### 25.5 Insights — deliberately unspecified

**Not specified, on purpose.** Dan does not yet know what it is for, and the
inventory found it never receives `doseStates` at all
(`.agent/items/TW-027.md`).

> *"We might even find out that we don't need it, to be honest."*

**Deciding what a screen should say before knowing what it is for is how
surfaces end up carrying their own opinions**, which is the problem being
removed. Revisit once the other surfaces are rebuilt and it is clear what is
left over. **It may not survive.**

Until then Insights is bound by §19 like everything else: whatever it shows, it
renders the engine's verdict or stays quiet. Being unspecified is not a licence
to compute.

### 25.6 The carried open items

**None may be answered by an agent**, and they are listed together so they are
not lost when parts 2 and 3 become decision records. **Six were carried into
16 August and three closed that day in Stage 5b** — items 4, 5 and 6, struck
through below with what replaced them. **Three remain**, and they are items 1, 2
and 3, unchanged since Stage 3.

**1. `reef-chemistry.md` §9's "wrong tool" rule.** Pointing at dry salt or a
water change when a correction exceeds ~1.5 L contradicts the rate rules — a
different product does not make a fast change safe. **That half is decided and
§9 is amended**: the answer is a gradual plan and an honest duration (§24.23).
**What is open is whether the volume ceiling has any remaining role** — a
sanity check on a single day's dose, or dissolved because a long enough plan
brings the daily volume under it anyway.

**2. The 6.9 dKH card overlap.** §24.9 and §24.23 both claim that situation.
Probably the short one on the dashboard and the fuller plan card in the wizard,
**but not decided** — and see §24.23 on whether that card's offer is a return
plan or a correction wearing its words.

**3. App-level notices.** Out of the tank summary (§25.1). **Tasks is the
likely home; the fit is unproven**, because Tasks today holds reminders the
user created and these are the app noticing something.

**~~4. Where relationship notices sit~~ — closed 16 August, Stage 5b.** §25.1's
ordering decision makes them **the third of four tiers**: after every alert and
every out-of-range parameter, before everything else, ordered among themselves
by the earliest parameter they name. Recorded at §25.4. **G-26's second
question is not this one and is not closed by it** — whether a relationship
notice is hideable, and whether hiding it hides it for both parameters, is a
question about hiding rather than placement, and §20's *"every notice can be
hidden, no exceptions"* answers the first half of it on its face.

**Two more, added 16 August with §24.24–24.27 and §25.1's headline rule.** The
list is five and six because the four above are unchanged, not because these are
smaller.

**~~5. Whether §24.24 gains a wording for a *logged* correction~~ — closed
16 August, Stage 5b.** **It does not: the card does not fire at all when a
one-off correction is logged.** `reef-chemistry.md` §24 carries the decision and
the reasoning — a logged correction is the first of the six ordinary causes that
section lists, so where one is in the record the arithmetic is explained and
there is nothing to report. Part 3 is spent entirely. §24.24 keeps one wording
and one escalation, both the nothing-logged case, which is the only case part 4's
count ever counted.

**~~6. What breaks an exact tie in §25.1's headline ordering?~~ — closed
16 August, Stage 5b.** **The fixed parameter order breaks it** — alkalinity,
calcium, magnesium, salinity, nitrate, phosphate, potassium, ammonia. It was
decided for the notice list and **applies to both: one order, one reason.**

The question was two parameters in the same tier, the same fraction of their own
bands out, and the requirement was determinism — an ordering that varies between
renders cannot be checked against the tiles, which is the whole basis of the
rule. A fixed order over parameters is a total order and supplies it.

**The tiles' own order is still not chosen**, and the reason it was resisted
holds: it is a display arrangement that may change for display reasons, and a
headline whose tie-break moves when a layout does is not checkable in the sense
the rule means. **A single order across both rules is also the stronger
answer** — the headline and the list beneath it can no longer name two equally
out-of-range parameters in opposite orders.

### Enforced by

Per §10, named rather than asserted: **nothing asserts §25 today**, and the
checker that comes closest passes on a live violation of it —
`wordingcheck.mjs` asserts `claim:` against `d.headline` and does not look at
`support:`, which is how `correction-done`'s hand-written support sentence
survives (`.agent/items/TW-028.md`).

Five checks would close it, and all five are extensions of work already filed:

| The rule | The check | Filed as |
|---|---|---|
| 25.1's generated short form | every summary line's headline and first sentence are the engine's own strings, not literals | TW-028 |
| 25.1's collapsed headline | the headline's clauses are generated from the rendered verdicts, no clause is a literal, and slot order and the naming cut hold at one, three and four out-of-range parameters | TW-076 |
| 25.2's no-direction rule | no direction word appears in any steadiness-panel string | TW-028 |
| 25.3's deferral | the confirmation renders the card and adds no verdict of its own | TW-028 |
| 25.4's three kinds | every notice resolves to a parameter verdict, a suspect reading, or a registered relationship notice | TW-027 |
| 25.1's notice ordering | the expanded list is the four tiers in order, proportional distance within the first two, the fixed parameter order breaking ties — asserted on a tank where tier and distance disagree | TW-081 |
| 25.1's off switch | a parameter switched off produces no notice of any kind, alerts and safe-bounds excursions included, and no other parameter is affected | TW-082 |
| 25.4's deleted `heading-out-*` | no surface computes a second direction claim over a second window; the id is absent | TW-080 |
| §32's ammonia rules | a zero reading produces nothing anywhere; any positive reading produces one alert-tier notice; no trend, verdict or dose is reachable | TW-084 |

**§25.1's hidden-versus-off distinction needs a test of its own**, and it is
the one behaviour in this section that can fail silently in a way the user pays
for: a hidden notice that does not come back when a worse verdict supersedes it
is the app going quiet about a tank that is getting worse. `findingHidden`
already implements the resurfacing half; nothing asserts it.

### In plain terms

The tank summary shows one line per parameter and those lines are not written
anywhere — they are the first sentence of the card you get when you tap them,
so the two can never disagree.

Above them, when it is collapsed, is one line for the whole tank: the worst
thing first, then anything else worth saying, then anything you have already
started that is still running. *"Alkalinity is out of range, and several others
are moving — a dose change is still settling."* If there is nothing in the second
or third part, it stops early rather than padding. That line is built from the
same verdicts as the tiles underneath it, so you can always check it by looking
down — which is exactly what you could never do with the score out of 100 it
replaces.

Those lines come in a fixed order, so the list looks the same every time you open
it. Anything at the top tier comes first, then anything simply out of range —
each of those sorted by how far out it is as a share of your own range, so a
0.3 dKH problem and a 30 ppm problem are compared fairly. Then the handful of
notices about two parameters at once. Then everything else, in the same
parameter order every time: alkalinity, calcium, magnesium, salinity, nitrate,
phosphate, potassium, ammonia. When two things tie, that order settles it, so
the list never shuffles itself between one look and the next.

Anything you do not want to see, you hide. Hiding lasts until the situation
changes, and then it comes back, because the alternative is an app that goes
quiet about a tank that is getting worse. If it keeps coming back and you never
want it, there is a switch in Setup that turns that kind of notice off for
good. That is the whole answer for someone deliberately running their phosphate
at 0.02 — you turn that one off, and the app never has to ask you what kind of
reefkeeper you are.

**The switch is per parameter, and it covers everything.** Turn phosphate off
and phosphate goes quiet — every phosphate notice, including the serious ones
and the ones about being outside the safe bounds. Nitrate is untouched, and so
is everything else. That is the same rule hiding already follows, and it follows
it for the same reason: **you ran the test and you typed the number in.** The app
is deciding whether to say something about a figure that is already on your
screen, not keeping one from you. Your readings still get recorded, still get
charted, still sit on their tile in their colour. What stops is the app speaking
first.

And one thing you will stop seeing entirely: the paragraph that used to appear
under the wizard explaining that the wizard was looking at a short window and the
chart was looking at a longer one and that the longer one was drifting. That was
the app arguing with itself in front of you. A level moving inside its range
colours its tile and the wizard tells you about it if it matters — nothing writes
you an essay reconciling two time frames any more.

The steadiness panel stops arguing with the advice above it. The advice says
which way your alkalinity is going right now; the panel says how consistent it
has been over the last few weeks, says which weeks at the top, and never uses
the words rising or falling again. That is the fix for the screen that said
alkalinity was rising directly above a panel saying it had fallen half a point
a week.

Log a reading and you get two lines confirming what you logged, then the same
card the wizard would show you. Not a link to it. The same words.

And the notices list stops being its own little engine with its own opinions.
There are three kinds left: what the app thinks of a parameter, a reading that
looks odd enough to retest, and the handful of notices about two parameters at
once.
