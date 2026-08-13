# Surfaces, Bands and Messaging — CANON

Agents never edit this file. Disagreements → `.agent/spec-challenges.md`.

This file exists because the same fact is expressed in more than one place in
the app, and those places can drift apart. Drift here is worse than an outright
bug: the app contradicts itself, and the user has no way to know which half to
believe.

---

## 1. The single-source rule

There is **exactly one** implementation of each of the following. Every surface
calls it. No surface recomputes, reformats or re-decides.

| Concern | The one function | Everything else must call it |
|---|---|---|
| Band classification | `classifyReading(param, value, targets)` | wizard, manual entry, test log, dashboard, alerts, history |
| Dose calculation | `calculateDose(...)` per reef-chemistry §7 | wizard, manual adjustment, plan view |
| Rail enforcement | `applyRails(...)` per reef-chemistry §6 | every path producing a dose |
| Consumption rate | `consumptionRate(...)` per reef-chemistry §8 | trends, wizard, log |
| Message selection | `messageFor(classification, context)` | every surface showing words about a reading |

**A second implementation of any of these is an S1 defect,** even if it currently
produces identical output. Identical today is divergent after the next change.

---

## 2. The three dosing surfaces

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
  silently exceed a §6 rail — the app warns explicitly, states the rail and the
  overage, and requires confirmation.
- A manual adjustment is recorded **as a manual override**, with both the
  recommended value and the entered value. History must show both.
- A manual override never changes the stored targets or the consumption model
  unless the user explicitly asks. One-off means one-off.
- After an override, the next recommendation is computed from actual dosed
  amounts, not from what was recommended.

---

## 3. Band classification

`classifyReading` returns exactly one of:

| Band | Meaning | Action implied |
|---|---|---|
| `in-band` | within the user's no-action band | none |
| `drifting` | inside the band, but trending toward an edge (§8 rate applies) | watch |
| `out-of-band-low` | below no-action band, above alert-low | correct slowly |
| `out-of-band-high` | above no-action band, below alert-high | correct slowly |
| `alert-low` | at or below alert-low | act, and see chemistry §5 gating |
| `alert-high` | at or above alert-high | act |
| `insufficient-data` | cannot classify (missing target, missing volume, too few readings) | refuse and name what's missing |

### Boundary rules — fixed, no exceptions

- Band edges are **inclusive of the band they bound**: a value exactly equal to
  the no-action lower edge is `in-band`, not `out-of-band-low`.
- A value exactly equal to alert-low is `alert-low`.
- Comparisons happen at **stored precision**, never at display precision. A
  reading of 7.849 displayed as 7.8 classifies as 7.849.
- Classification never rounds. Display rounds.

**Every surface uses these bands and no other vocabulary.** No surface may
invent a category like "slightly low" or "borderline" that is not in this table.

---

## 4. Message contract

Every message shown about a reading has exactly these parts, and every surface
uses the same ones:

1. **What was measured** — parameter, value, unit, and the date/time
2. **The band** — using the §5 terminology, never a synonym
3. **Why** — brief, referencing the target, not the app's opinion
4. **What happens next** — the recommended action, or explicitly "no action", or
   the refusal and what's missing

### Hard rules

- **A message must never contradict the classification it accompanies.** A
  reading classified `in-band` may not carry a message suggesting a correction.
  This is the single most important rule in this file.
- A message must never state a number that differs from the number shown
  alongside it, at any rounding.
- A message must never imply an action the app will not then offer.
- A refusal message names the missing input specifically.
- No message tells a user their test kit is wrong.
- No message expresses urgency the band does not justify.

---

## 5. Terminology registry

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
relative to the user's own targets and nothing more.

---

## 6. History truthfulness

- A logged entry records **what the app said at the time**: the classification,
  the recommendation, and the targets then in force.
- Changing targets today must **not** retroactively change what history shows
  was recommended. Recomputing the past against present settings is an S1 defect.
- If a target changed, history shows the change as an event in the series.
- A manual override is shown in history as recommended-vs-dosed, always both.

---

## 7. Cross-surface contradiction matrix

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
