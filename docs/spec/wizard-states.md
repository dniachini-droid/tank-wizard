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

> Agents never edit this file. Disagreements → `.agent/spec-challenges.md`.

Companion: `reef-chemistry.md` — the arithmetic. Read that one to know what
number the app produces; this one to know why a particular card is showing,
what words may go on it, and what the app must be true of as a program.

Part I (§0–§10) is the wizard's state machine. Part II (§11–§18) is the surfaces
and messaging canon plus the platform floor. Part III (§19–§25) is the Reef
Chemistry Engine's surfaces, the notice model, what Setup may ask for, the
consistency verdicts, the seven wording rules, the twenty-three reference cards
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
over the fitted window, §5 and §11 there — never a single pair of readings.

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
| within no-action band | **in range** | fine, good, OK, normal, healthy, ideal, in target, on target |
| outside no-action band | **out of range** | bad, off, abnormal, dangerous, off target, off-target |
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
  is the one the verdict was actually graded over, `reef-chemistry.md` §4's
  analysis window for that parameter. A verdict graded over 14 days under a
  heading saying 30 is the contradiction of 16 August in a new place.
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

## 24. The twenty-three cards — the reference the rebuild works from

**Decided 16 Aug (Dan, spec owner).** These are not illustrations. **They are
the reference wording**, and Stage 6c builds the message layer to produce them.
Where a card here and a current app string differ, the card wins and the string
is a finding.

Alkalinity is used throughout; **the same shapes apply to calcium and magnesium
in their own units** (§23.4). Twenty-three cards, in the order they were
decided: **24.1–24.12 on the first pass**, **24.13–24.23 the same day** from
parts 2 and 3 of the specification. Nothing in the first twelve changed when
the rest arrived.

**With 24.23 the wizard is covered.** Every state in §2's ordered list has
wording, and so do all four contradiction states from
`docs/journeys/journey-4b-notification-matrix.md`, two of which the app cannot
express at all.

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

**This is the only card that offers a return plan**, because it is the only one
of the twelve where the level is both stable and out of band —
`reef-chemistry.md` §28.2. **Whether route 12 (`worked`, tested steady and not
in band) also qualifies is open** and is filed as such in §28.6; it is a Stage 4
gap-report question, not an implementer's judgement call.

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

### What these twenty-three do not cover

Stated so the gap is not mistaken for completeness. **The seven states the
first pass left to draft are drafted** — `correction-done` (24.13, 24.14),
`correction-due` (24.15), `recovering` (24.17), `worsening` (24.18),
`fell-short` (24.19), `overshot` (24.20), and the "wrong tool" variant (24.23).
**All four contradiction states have wording** (24.7, 24.8, 24.21, 24.22), and
two of them still have no state in the engine.

What these cards do **not** settle:

- **Which branch produces which card**, where a card and a branch are not one
  to one. 24.13 and 24.14 are one state with two flags; 24.7 and 24.22 may be
  `fell-short` and `overshot` widened; 24.17 and 24.18 need §23.6's recency
  precondition, which the engine cannot currently answer for a dose changed
  outside the wizard. Stage 4 reports these; Stage 6d decides them.
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

Twenty-three cards, written out word for word, because the app is about to be
rebuilt from them and "something like this" is how the app got into
contradicting itself in the first place.

Four of them describe situations the app cannot currently recognise at all — a
dose raised that did nothing, a level still falling after a raise, a level
still rising after a cut, and the honest "one reading in, too early to say".
All four are things a keeper notices immediately and the app has been silent
about.

One of them, the steady-but-in-the-wrong-place card, is the one that has been
quietly useless: it told you your dose was right and left you sitting outside
your range with nowhere to go. It now ends with an offer to walk you back.

And the last one is where the app stops recommending a different product. If
your alkalinity is at 6.9 and nine days of gradual dosing is what it takes,
that is what it says — nine days — instead of suggesting a dry buffer or a
water change that gets there faster by doing to your corals exactly what every
other rule in the app exists to prevent.

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

24.12 and 24.13–24.23 take the same treatment and are not tabulated: the rule
is generative, and a table that has to be extended per card is the hand-written
second wording this rule exists to prevent.

**Tapping a notice opens the full card.** The summary is a way in, not a
summary of the reasoning.

**One live violation this makes explicit**, already recorded in
`.agent/items/TW-027.md`: `correction-done` writes its own support sentence in
`src/lib/narrative-engine.js`, and `scripts/verify/wordingcheck.mjs` checks
`claim:` but not `support:`, so it passes a blocking check.

#### The three layers

**Collapsed** — the summary headline only.

**Expanded** — the live notices, one per parameter.

**Below those, a hidden section** — collapsed, listing what is hidden. Each
entry can be unhidden individually, which returns it to the live list, plus an
unhide-all.

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

#### Serious notices confirm before hiding

Unchanged from §20 and restated here because this is the surface it happens
on: hiding a notice flagged serious asks *"This is flagged as a serious notice.
Are you sure you wish to hide it?"*, with a line noting hidden notices can be
brought back from the tank summary. §20's mapping of **serious** — severity
`act`, or a wizard state whose §3 tone is red — is unchanged, and so is the
point that the confirmation is a speed bump rather than a class of notice that
cannot be hidden.

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

**The heading states the window the verdict was actually graded over.** That is
`reef-chemistry.md` §4's analysis window for the parameter — 14 days for
alkalinity, 28 for calcium and magnesium — so "Over the last 30 days" above is
the shape of the heading, not a new window. A panel heading that names a window
the grading did not use is the same defect this rule was written to fix.

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
one notice per parameter. **How they are placed is not settled** — carried at
§25.6.

**A fourth kind is a finding, not a feature.** Anything that is none of these
three is either a parameter verdict the engine should be producing, or a
surface forming an opinion (§19, an S1 defect).

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

### 25.6 The four carried open items

**None is settled, none may be answered by an agent**, and they are listed
together so they are not lost when parts 2 and 3 become decision records.

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

**4. Where relationship notices sit** in a summary that is otherwise one notice
per parameter (§25.4).

### Enforced by

Per §10, named rather than asserted: **nothing asserts §25 today**, and the
checker that comes closest passes on a live violation of it —
`wordingcheck.mjs` asserts `claim:` against `d.headline` and does not look at
`support:`, which is how `correction-done`'s hand-written support sentence
survives (`.agent/items/TW-028.md`).

Four checks would close it, and all four are extensions of work already filed:

| The rule | The check | Filed as |
|---|---|---|
| 25.1's generated short form | every summary line's headline and first sentence are the engine's own strings, not literals | TW-028 |
| 25.2's no-direction rule | no direction word appears in any steadiness-panel string | TW-028 |
| 25.3's deferral | the confirmation renders the card and adds no verdict of its own | TW-028 |
| 25.4's three kinds | every notice resolves to a parameter verdict, a suspect reading, or a registered relationship notice | TW-027 |

**§25.1's hidden-versus-off distinction needs a test of its own**, and it is
the one behaviour in this section that can fail silently in a way the user pays
for: a hidden notice that does not come back when a worse verdict supersedes it
is the app going quiet about a tank that is getting worse. `findingHidden`
already implements the resurfacing half; nothing asserts it.

### In plain terms

The tank summary shows one line per parameter and those lines are not written
anywhere — they are the first sentence of the card you get when you tap them,
so the two can never disagree.

Anything you do not want to see, you hide. Hiding lasts until the situation
changes, and then it comes back, because the alternative is an app that goes
quiet about a tank that is getting worse. If it keeps coming back and you never
want it, there is a switch in Setup that turns that kind of notice off for
good. That is the whole answer for someone deliberately running their phosphate
at 0.02 — you turn that one off, and the app never has to ask you what kind of
reefkeeper you are.

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
