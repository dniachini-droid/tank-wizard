# Run log — 2026-08-16-stage4-gap-report

**Routine:** `THE-ENGINE-PLAN-v2.md` Stage 4 — the gap report.
**Mode:** read-only. No source file, spec file or test was modified.

---

## What ran

One session, no subagents dispatched (the task was a single continuous read
across canon and the messaging layer; splitting it would have produced findings
neither half could check against the other).

### Sources read in full

- `docs/spec/reef-chemistry.md` — 2,740 lines, §1–§29
- `docs/spec/wizard-states.md` — 2,137 lines, §0–§25 including the new §23, §24, §25
- `docs/journeys/` — README + journeys 1, 4, 4b, 5 in full; 2 and 3 skimmed for messaging content
- `docs/spec/message-spec-1-wizard.md`, `-2-wizard-remaining.md`, `-3-surfaces.md` — read as decision records

### Code read

`src/lib/findings.js`, `src/lib/narrative-engine.js`,
`src/lib/analytics/reading-meaning.js`, `src/lib/dosing/state.js`,
`src/components/ReadingConfirmation.jsx`, `src/components/DoseExpectation.jsx`,
`src/components/TodayPanel.jsx`, `src/components/Dashboard.jsx` (modal +
steadiness panel), `src/lib/stability-engine.js`,
`src/lib/analytics/time-in-range.js`, `rate-analysis.js`, `drift.js`,
`measurement-noise.js`, `magnesium-gate.js`, `safe-rate.js`,
`src/lib/dosing/alkalinity.js` / `calcium.js` / `magnesium.js` (constant blocks),
`src/lib/constants.js`, `src/lib/dates.js`,
`scripts/verify/wordingcheck.mjs`.

---

## Output

`.agent/gap-report.md` — the deliverable. Structure:

- **Part 1 — the numbers canon does not name.** Stage 5's decision list. The
  plan's four families (three kit-noise tables, four alkalinity trend
  thresholds, `paramContext`'s absolutes, the alert widths) plus everything
  else the sweep found, each with its current value and its call sites.
- **Part 2 — gaps.** 41 items, G-1 to G-41.
- **Part 3 — deletions.** 15 items, D-1 to D-15.
- **Part 4 — what canon does answer.** 40 rows, so the rebuild knows what it
  does not have to ask about.
- **In plain terms.** Rule 11's second layer, covering the whole report.

Nothing was resolved. Two items were worked up per house rule 10 with options
and the cost of each direction (D-1, the kit-accuracy findings; D-11, the
target-range suggestion), because in both cases the deletion is not obviously
correct and picking wrong is expensive.

---

## Findings the run made that were not in the plan's expectations

1. **`ALERT_WIDTH` matches canon.** The plan expected it to "disagree with
   `SAFE_BOUNDS` on every element". Measured against the shipped bands, the
   alert-then-safe ordering holds on five of six edges; the one inversion is
   magnesium's, is the known Stage 2 item, and its cause (the shipped
   1250–1400 band against §2 layer 3's 1275–1425 — TW-052) and its fix (the
   floor at `magnesium-gate.js:63`) are both already in canon and in code.
   Reported as YES-with-a-known-exception rather than as a Stage 5 number.
   **The real gap underneath it is that canon defines alert thresholds for
   three parameters and §19 requires nine.**

2. **§29.5 cannot be implemented from canon.** Nitrate's trend bar requires
   the movement to clear "§5's noise floor". §5 has no nitrate entry. This is
   the single cleanest instance of the pattern Stage 4 exists to catch — a rule
   that reads complete and terminates in a figure canon does not hold.

3. **§24 is not complete against §2's list**, though it says it is. Four
   situations have no card: `due` (branch 10), `worked` route 12, the
   negative-consumption hold required by `reef-chemistry.md` §24 (plus its
   three-consecutive escalation), and the tested-but-inconclusive `settling`.

4. **The 6.9 dKH overlap (§25.6 item 2) has three claimants, not two.**
   `far-out-<param>` in `findings.js` is the third, and
   `narrative-engine.js:457-459` already contains a hand-written regex
   suppression rule to stop it colliding with the wizard.

5. **§23.2 (no first person) is clean.** Swept the whole messaging layer; zero
   matches. §23's "Enforced by" flagged it as checkable today and predicted
   findings. There are none.

6. **§23.7 breach count: 12 confirmed** (of 24 `doseStatus` headline forms),
   plus 28 further parameter-naming headlines in copy that has no registered
   form yet. §23 asked for the count and said explicitly not to fix them.

7. **The health score is the largest unspecified surface in the app** — 19
   constants, one number on screen, no canon entry of any kind, and a recorded
   history of contradicting its own working panel.

8. **Canon contradicts canon in one place that changes a card.**
   `reef-chemistry.md` §18 requires the app to suggest reconsidering the target
   range when a level is stable and out of band; §28.2/§28.3 and
   `wizard-states.md` §24.3 make that exact state the return-plan offer. Both
   are live canon. Flagged, not resolved.

9. **Two canon housekeeping items.** `wizard-states.md` §2 branch 22 and §3's
   "Dose right, level off" row describe a card `reef-chemistry.md` §26 removed
   as unreachable, so §24's card count runs against a list that is one long.
   And `message-spec-3-surfaces.md` still quotes "a serious **notification**",
   which §15 bans and §20 restates.

---

## Verification

**Not applicable by instruction.** The stage is read-only; no test was run and
no build was performed, because nothing was changed. Every line reference in
the report was verified by reading the cited file at the cited line. The two
behavioural counts (§23.2, §23.7) were taken by reading every headline site
enumerated, not by running a checker — a checker for either is TW-028's work
and is named as such in the report.

`git status` before commit showed exactly three new files, all under `.agent/`:
`gap-report.md`, `log/2026-08-16-stage4-gap-report.md`,
`runs/2026-08-16-stage4-gap-report.md`.

---

## In plain terms

I read everything you have written down about your tank's chemistry and about
what each screen should say — about five thousand lines — and then read every
sentence the app currently produces, roughly a hundred different kinds. For
each one I asked whether your written rules could have produced it.

The answer is in one file, `.agent/gap-report.md`. It has three lists: the
numbers you need to choose, the questions only you can answer, and the
sentences the app says that you have already decided it shouldn't.

I changed nothing and I decided nothing. That was the point of this stage —
every one of these questions answered by an agent halfway through building
something would have been a guess you never saw.
