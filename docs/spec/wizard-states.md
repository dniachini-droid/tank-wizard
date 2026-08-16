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
arithmetic half is `reef-chemistry.md` §28, rewritten the same day.

> Agents never edit this file. Disagreements → `.agent/spec-challenges.md`.

Companion: `reef-chemistry.md` — the arithmetic. Read that one to know what
number the app produces; this one to know why a particular card is showing,
what words may go on it, and what the app must be true of as a program.

Part I (§0–§10) is the wizard's state machine. Part II (§11–§18) is the surfaces
and messaging canon plus the platform floor. Part III (§19–§24) is the Reef
Chemistry Engine's surfaces, the notice model, what Setup may ask for, the
consistency verdicts, the five wording rules, and the twelve reference cards
the rebuilt message layer is built from.

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

## 23. The five wording rules

**Decided 16 Aug (Dan, spec owner).** Folded in from
`docs/spec/message-spec-1-wizard.md`, Stage 3 of `THE-ENGINE-PLAN-v2.md`, the
same way §19 and §20 were folded in from `DECISION-reef-chemistry-engine.md`.
Its arithmetic half is `reef-chemistry.md` §28.

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

### How these sit against §14 and §15

Three layers, and they do not overlap:

- **§14** — which parts a message must contain.
- **§15** — which word each concept gets.
- **§23** — how the parts are said, and what may not be said at all.

A message can satisfy §14 and §15 completely and still break §23 — "I think
alkalinity is fine" contains all four parts and no banned synonym.

### Enforced by

Per §10, named rather than asserted: **nothing asserts §23 today.**
`scripts/verify/wordingcheck.mjs` covers one field of one loop in one function,
and asserts `claim:` without `support:` — which is exactly §23.1's failure mode
going unchecked.

Five checks would close it, one per rule, and all five are static:

| Rule | The check |
|---|---|
| 23.1 | every `claim:` has a `support:`, and the support names a figure |
| 23.2 | no first-person pronoun in any user-facing string |
| 23.3 | a dose figure appears only on the three permitted card kinds |
| 23.4 | every numeric figure in a message carries its parameter's unit |
| 23.5 | a fixed banned-construction list — "something is", "may be caused by" |

**23.2 is checkable against the app as it stands, before the rebuild.**
`src/lib/narrative-engine.js` and `src/lib/findings.js` are
where first-person copy would live. If the app says "I" anywhere today, that is
a finding for the rebuild to clear rather than a patch to apply now — the layer
is being replaced, and fixing copy in code that is about to be deleted spends
the effort twice.

---

## 24. The twelve cards — the reference the rebuild works from

**Decided 16 Aug (Dan, spec owner).** These are not illustrations. **They are
the reference wording**, and Stage 6c builds the message layer to produce them.
Where a card here and a current app string differ, the card wins and the string
is a finding.

Alkalinity is used throughout; **the same shapes apply to calcium and magnesium
in their own units** (§23.4). Twelve cards, in the order they were decided.

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

### What these twelve do not cover

Stated so the gap is not mistaken for completeness. **Seven states follow the
shapes above and need drafting rather than deciding:** `correction-done`,
`correction-due`, `recovering`, `worsening`, `overshot`, `fell-short`, and the
"wrong tool" variant where a maintenance solution cannot deliver a correction.

**Two of the four contradiction states are still missing:** dose lowered and
still rising, and movement not established.

**And the other surfaces are not written at all** — tank summary, parameter
cards and the history modal, reading confirmation, Insights, findings. Each
renders these verdicts rather than forming its own (§0.3, §11), so each is a
rendering decision rather than a wording one, but none of them is decided yet.

### In plain terms

Twelve cards, written out word for word, because the app is about to be rebuilt
from them and "something like this" is how the app got into contradicting
itself in the first place.

Two of them describe situations the app cannot currently recognise at all — a
dose that was raised and did nothing, and a level still falling after a change.
Both are things a keeper notices immediately and the app has been silent about.

And one of them, the steady-but-in-the-wrong-place card, is the one that has
been quietly useless: it told you your dose was right and left you sitting
outside your range with nowhere to go. It now ends with an offer to walk you
back.
