# The Dosing Wizard — Canon

**Status: proposed.** Replaces `docs/spec/surfaces-and-messaging.md` §1–3 and
supersedes `docs/spec/incoming/wizard-spec.txt`. Merged 13 August 2026.

Companion: `reef-chemistry.md` — the arithmetic. Read that one to know what
number the app produces; this one to know why a particular card is showing.

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
| `arrived` | the level has reached the target |
| `passed` | the level has gone past the target |
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

**Changed 13 Aug.** A correction targets the **middle third of the band**, not
the nearest edge and not a fixed offset.

**`correction-done` exits only after two readings inside the band**, not one.
Three consecutive 0.2 dKH rises do not simply stop; reaching the band mid-climb
is passing through, not arriving. While the state holds:

- `testOn` carries "keep testing every 2 days — it may still be climbing"
- consumption does **not** re-baseline, so the tail of a correction is never
  read as tank behaviour

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
