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

> Agents never edit this file. Disagreements → `.agent/spec-challenges.md`.

Companion: `reef-chemistry.md` — the arithmetic. Read that one to know what
number the app produces; this one to know why a particular card is showing,
what words may go on it, and what the app must be true of as a program.

Part I (§0–§10) is the wizard's state machine. Part II (§11–§18) is the surfaces
and messaging canon plus the platform floor. Part III (§19–§21) is the Reef
Chemistry Engine's surfaces, the notice model, and what Setup may ask for.

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
| `target` | where a plan is heading, when there is one |
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
| 12 | `worked` | tested, steady, not in band — "steady, off target" |
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
| `correction-done` | teal | Target reached | plan arrived — see §4 |
| `correcting-dose` | blue | Correction running | plan in progress |
| `correcting` | blue | Correction running | logged correction in progress |
| `settling` | blue | Change settling | too soon to judge |
| `settling` | blue | One more reading | not enough data yet |
| `due` | amber | Test to confirm | staged plan needs a test |
| `worked` | teal | Change worked | it did what it should |
| `worked` | grey | Steady, off target | stable in the wrong place |
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
| `passed` | one reading at or beyond the target. Computed independently of `arrived`; never conflate the two |
| `dueNow` | enough time has elapsed that a reading is expected |
| `overrun` | days > (expected × 2) + 2 |
| `stalled` | 3+ days in, a reading since, level moved less than the noise floor |
| `backwards` | 3+ days in, a reading since, level moved away from target |

`stalled` and `backwards` both require a reading **since the plan started**.
Without that, the app would judge a correction on the reading that prompted it
— the stale-reading fault in `reef-chemistry.md` §9.

`overrun` is measured on the **calendar**, not on readings. A plan left
unattended with no new tests still expires. Before this existed, a three-day
plan with no readings still said "on its way to 9.0 dKH" at day 40.

### Where a correction ends

The arithmetic is `reef-chemistry.md` §9; this is what it means for the branch.
Two numbers, kept apart:

- **Where the correction aims** — the midpoint of the band. A target is a point.
  Unchanged.
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
**or** `passed`, and `passed` needs only one reading at or beyond the target, so
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
| Band classification | `classifyReading(param, value, targets)` | wizard, manual entry, test log, dashboard, alerts, history |
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

Given identical inputs — same reading, same targets, same net volume, same
product, same history — **all three surfaces must produce the same numbers and
the same classification.** Differences permitted only in presentation:
verbosity, layout, and how much reasoning is shown.

Specifically, the following must be identical across surfaces:

- the band the reading falls in
- the recommended dose in mL, after rounding and rails
- the expected delta and days to target
- whether the app refuses to advise, and the reason
- whether a multi-day plan is required

### Manual override rules

- A manual adjustment may exceed the app's recommendation. It may **not**
  silently exceed a rail (`reef-chemistry.md` §3) — the app warns explicitly,
  states the rail and the overage, and requires confirmation.
- A manual adjustment is recorded **as a manual dose**, with both the
  recommended value and the entered value. History must show both.
- A manual dose never changes the stored targets or the consumption model
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
| `insufficient-data` | cannot classify (missing target, missing volume, too few readings) | refuse and name what's missing |

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

**Every surface uses these bands and no other vocabulary.** No surface may
invent a category like "slightly low" or "borderline" that is not in this table.

These seven bands are not the wizard's 17 states. A band describes where a
reading sits; a state describes what to do about the element. Branch 21's
`recovering` / `worsening` / `off-target` split, for instance, is three states
over one band.

---

## 14. Message contract

Every message shown about a reading has exactly these parts, and every surface
uses the same ones:

1. **What was measured** — parameter, value, unit, and the date/time
2. **The band** — using §15's terminology, never a synonym
3. **Why** — brief, referencing the target, not the app's opinion
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

---

## 15. Terminology registry

One word per concept, everywhere. Any synonym is a finding.

| Concept | The word to use | Never use |
|---|---|---|
| within no-action band | **in range** | fine, good, OK, normal, healthy, ideal |
| outside no-action band | **out of range** | bad, off, abnormal, dangerous |
| at/beyond alert threshold | **needs attention** | critical, urgent, emergency, danger |
| moving toward an edge | **drifting** | trending, slipping, creeping |
| the user's chosen value | **target** | ideal, optimal, recommended level, correct |
| a suggested dose | **recommended dose** | required, needed, prescribed |
| net water volume | **net volume** | water volume, tank size, volume, capacity |
| a user-entered dose | **manual dose** | custom, override, adjusted |

The app never uses "safe" or "unsafe" about any reading. It reports position
relative to the user's own targets and nothing more. This is a rule about
user-facing words only — `reef-chemistry.md` §2's "safe bounds" is the internal
name of a threshold, and the app does not say it out loud.

**net volume** won the 13 August terminology decision; "water volume" is a
banned synonym (`.agent/needs-dan.md`).

---

## 16. History truthfulness

- A logged entry records **what the app said at the time**: the classification,
  the recommendation, and the targets then in force.
- Changing targets today must **not** retroactively change what history shows
  was recommended. Recomputing the past against present settings is an S1
  defect.
- If a target changed, history shows the change as an event in the series.
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
| days to target | | | | | | |
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

> "This is flagged as a serious notification. Are you sure you wish to hide
> it?"

with a line noting hidden notices can be brought back from the tank summary.

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

### A note on the word

This document uses **notice** for the thing shown about a parameter — what the
code variously calls a finding, a claim and a dose state. The confirmation
sentence above says "notification" because that is the settled user-facing
wording, quoted verbatim. §15's registry carries no entry for this concept yet;
adding one is the owner's call and nothing here should be read as having made
it.

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
