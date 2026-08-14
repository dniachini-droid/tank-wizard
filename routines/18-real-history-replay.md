# Routine 18 — Real-History Replay

Cloud routine. **Reports only.** No code, spec, test or constant is changed.
The entire output is one report: `.agent/real-history-replay.md`, plus the
standard `.agent/log/<run-id>.md` and `.agent/run-state.md` per the checkpoint
contract. Nothing else in the tree moves.

Baseline this routine was written against: commit `054b692`, 14 August 2026.
Re-verify the fixture facts below before relying on them — the commands are
given so this is a two-minute job, not an act of faith.

---

## Why this exists

Every test in this repo runs against synthetic tanks — histories generated from
a model of how a reef behaves. `fixtures/real-tank/` holds two exports of Dan's
actual 77 L tank: about six months of real readings, his kit, his settings, his
water changes. This is the only place the engine can be run against reality.

The question is simple: **replaying his history day by day, what would the app
have told him?** At each reading, record the verdict, any dose recommendation,
any notice. Produce a timeline he can read against his own memory of what he
actually did — and check the app's behaviour against the four journey documents
that record how he actually manages the tank. Where the app and the journeys
disagree, those are the highest-value findings this routine can produce.

**Do not assume the app is right.** The readings themselves are evidence about
what the tank did next. Where the app's advice looks odd against what then
happened, say so plainly. This routine exists to test the app against reality,
not to grade reality against the app.

---

## The fixtures — what is actually in them

Two files, both `format: "dans-tank-backup"`, `version: 1`:

| | `dans-tank-backup-2026-08-09.json` | `dans-tank-backup-2026-08-12.json` |
|---|---|---|
| created | 2026-08-09T22:11Z | 2026-08-12T13:53Z |
| readings | 325 | 336 |
| ICP tests | 2 (Triton, 2026-06-14 and 2026-07-26) | same 2 |
| water changes | 25 × 10 L, 2026-02-16 → 2026-08-03 | same 25 |
| dose-log | **`null`** (`counts.doseChanges: 0`) | **2 entries** |
| task-log | `null` | 13 entries (auto-logged alk tests) |
| reminders / kit-changes / plans / dismissals | absent | present |
| `tank-settings.dailyDoseMl` (alk) | 8 | 10 |
| `tank-settings.calciumDoseMl` | 9 | 12 |
| `custom-ranges` | magnesium 1450–1500 only | mg 1520–1560, ca 400–450, NO₃ 6–15, PO₄ 0.11–0.19 |

Readings span **2026-02-13 → 2026-08-12**. Per parameter: alkalinity 82
(2026-05-04 onward, roughly daily), phosphate 101, magnesium 41, nitrate 41,
calcium 40, pH 16, potassium 13, salinity 2. Only 11 readings carry a `time`
field — all from 2026-08-09 onward. No parameter has two readings on one date.

Verify with:

```
python3 -c "import json,collections; d=json.load(open('fixtures/real-tank/dans-tank-backup-2026-08-12.json'))['data']; \
  print(len(d['readings']), collections.Counter(x['param'] for x in d['readings']))"
```

**The canonical fixture is the 2026-08-12 export.** Checked by
(param, date, value) triple: it contains all 325 of the 09 export's readings
plus 11 new ones. Use the 09 export only for the settings-snapshot question
below and as a cross-check.

Three facts about the fixtures to state in the report and then work around:

1. **Reading ids do not survive an export/restore round trip.** Zero id overlap
   between the two exports, three days apart, on 325 identical readings. The
   natural keys (param, date, value) match perfectly. Record this as an
   observation — it is `history-truth-auditor` territory, not this routine's
   job to chase — and key everything in the replay by natural key, never by id.
2. **The water-change list is byte-for-byte the app's own seed** — the same
   25 × 10 L rows, 16 Feb → 3 Aug, that `src/lib/analytics/water-changes.js:9`
   ships as `WATER_CHANGE_SEED`. The seed was built from Dan's real practice,
   so using it is fine, but the replay cannot distinguish "Dan entered this"
   from "the app seeded this". Say so once and move on.
3. **The task description says three months; the data says six.** Readings run
   from mid-February. Alkalinity's daily record starts 4 May. Use everything;
   just don't let the report claim a span the data doesn't have.

---

## The dose-change record — checked, and the answer shapes the whole routine

The brief's central caution was that the exports may not reliably record Dan's
own dose changes. **Checked: they do not.**

- The 09 August export has `dose-log: null` and `counts.doseChanges: 0`,
  against readings back to February.
- The 12 August export has exactly **two** dose-log entries, both created by
  the app itself: calcium set to 12 ml on 2026-08-10 09:00 and alkalinity set
  to 10 ml on 2026-08-11 09:00, each noted "set from the dosing wizard". The
  `ca-plan` blob (target +22.2 ppm, stage 1 of 3, next test 2026-08-17) and
  `alk-plan` blob (10 ml, stage 1 of 1, next test 2026-08-13) match them.
- The settings snapshots disagree between the exports (alk 8→10 ml, Ca
  9→12 ml), which is those same two changes seen from the other side. Every
  dose change **before 9 August is unrecorded** — the settings are an
  end-state, not a history.

Consequences, and the routine is designed around them:

1. **Advice-versus-action comparison is possible for exactly two events** —
   the 10 August calcium change and the 11 August alkalinity change. Do that
   comparison properly (section below). For everything earlier, the deliverable
   is the timeline itself, annotated, for Dan to review against his own memory.
   That is still the point of the exercise; say so in the report rather than
   apologising for it.
2. **The engine will run on an empty dose log for most of the replay.** That is
   not a flaw to patch — an empty dose log is exactly what the app would have
   known if Dan had installed it in February and never used the wizard. The
   replay records what the app *would have said*, not what it would have said
   with records it never had. Do not synthesise dose-log entries to make the
   engine happier.
3. **The current-dose figure is an anachronism for the early months.** Feeding
   the 12 August settings (10 ml alk / 12 ml Ca) to a March assessment claims a
   dose that did not exist in March. Handle it with two runs — see next
   section.

---

## Settings drift — run the replay twice

The exports give two settings snapshots and no history between or before them.
Under AGENTS.md #10 this is not a thing to quietly pick a side on; it is a
thing to bound. So:

- **Run A — "as the app stands today":** the 12 August `tank-settings` and
  `custom-ranges` throughout. This is what the app would say if Dan scrolled
  his history today, and it is the primary timeline in the report.
- **Run B — "as of 9 August":** the 09 August snapshot (8 ml / 9 ml, magnesium
  range 1450–1500, no other custom ranges) applied to the period up to
  9 August. This is the closer approximation for the earlier months.

Report where A and B **disagree** — different verdict, different dose advice, a
notice present in one and not the other — as its own table. Where they agree,
the conclusion is settings-robust and can be stated with confidence. Where they
diverge, both are shown and neither is chosen. The magnesium range moving from
1450–1500 to 1520–1560 between the two exports is itself worth a line in the
journey-3 section: journey-3 §5 is titled "Dan's tolerance is not the app's
recommendation", and here is the tolerance moving.

State-bearing extras are introduced only when the export says they existed:
the two dose-log entries at their recorded timestamps; the `ca-plan` and
`alk-plan` from their `appliedAt` dates; the `findings-dismissed` entries from
their recorded date (all ten are dated 2026-08-10 — before that date, nothing
is dismissed in the replay).

---

## The replay method

**One step per reading**, in chronological order — sort by `date`, then `time`
where present (11 readings have one), then stable on natural key. 336 steps.

At each step, the state is everything the export dates at or before that
moment: readings ≤ t, dose-log entries ≤ t, water changes ≤ t, plans active per
their `appliedAt`, dismissals active per their date, settings per run A/B.

Record, at each step:

1. **The verdict on the reading just taken** — the in-band / out-of-band
   classification against the effective ranges (`PARAM_DEFS`,
   `src/lib/constants.js:25`, overlaid by `custom-ranges`), via the same path
   the app uses (`paramContext`, `src/lib/analytics/reading-meaning.js:17`).
2. **The dose state and any recommendation** for the dosed elements — from
   `assessAlkalinity` (`src/lib/dosing/alkalinity.js:429`), `assessCalcium`
   (`src/lib/dosing/calcium.js:199`), `assessMagnesium`
   (`src/lib/dosing/helpers.js:700`) and `doseStatus`
   (`src/lib/dosing/state.js:44`): the state string, `action`,
   `recommendedDose`, `explanation`, `nextCheck`.
3. **Notices** — `buildFindings` (`src/lib/findings.js:134`), recorded as a
   diff against the previous step: what appeared, what went away. A wall of
   340 repeated finding lists is unreadable; the diff is the timeline.
4. **Stability grade** for the tested parameter (`computeStability`,
   `src/lib/stability-engine.js:83`).

**Call the engine the way `src/App.jsx` calls it** — the assessment wiring at
`App.jsx:149-151` and the findings wiring at `App.jsx:133` — not a private
re-derivation. The report must show what the app would have said, which is
`history-truth-auditor`'s standing rule: the log shows what the app said at the
time, not a recomputation by other means. Where App.jsx passes something the
harness must reconstruct (e.g. `latestByParam`), copy its construction, don't
improvise one.

### The clock trap — read before writing the harness

`assess*` accepts a `now` parameter, but **the engine also reads the real clock
directly** in several paths that matter to a replay: `todayStr()` inside
`applyDoseConstraints` → `doseObservations`/`bracketDose`
(`src/lib/dosing/alkalinity.js:274-275`), inside `correctionProgress` and
`pendingCorrection` calls (`alkalinity.js:481,486`, `calcium.js:234,239`,
`helpers.js:735,740`), and in `doseStatus` (`state.js:68`).

Passing `now` alone therefore does **not** freeze the replay date: the
dose-observation and correction paths would silently run against 2026-08-14
(or whenever the routine executes). The harness must fake the system clock
itself — in Node, override the global `Date` so `new Date()` returns the step's
timestamp (restore between steps or subclass with a settable offset). Verify
the fake works by asserting `todayStr()` returns the step date before trusting
a single output.

The mixed clock is also a **finding in its own right** — the engine cannot
currently be evaluated at a past date through its public parameters. Report it
(it is `history-truth-auditor` and replay-testability territory); do not fix it
in this routine.

### The harness is throwaway

The engine modules are plain ESM with no browser globals (checked:
`src/lib/dosing/` and `src/lib/analytics/` reference neither `localStorage` nor
`window`; the repo is `"type": "module"`), so a plain Node script that imports
them and loads the fixture JSON is enough. Write it in the session scratchpad,
**not in the repo**. This routine is read-only: no new files under `scripts/`,
no test files, nothing committed except the report. Paste the harness's core
loop into an appendix of the report so the run is reproducible, and record the
exact commit the engine was imported at.

If a module import fails outside the browser after all, say so, mark affected
outputs `UNVERIFIED`, and fall back to computing what can be computed — do not
stub the engine into shape and present the result as the app's behaviour.

---

## The timeline — what the report shows

The primary artefact is a chronological table, one row per step where anything
happened — verdict changed, a recommendation appeared or changed, a notice
appeared or cleared, a stability grade moved. Quiet steps compress ("12–19
June: seven alkalinity readings, all in band, no change in any output").
Columns: date, parameter and value, verdict, dose state/advice (with the ml
figure), notices delta, and — the referee's column — **what the readings then
did**.

That last column is where honesty lives. For every dose recommendation the
engine makes, look at the next two to four readings of that parameter:

- Advice followed by movement consistent with the *unchanged* dose suggests the
  advice was noise or the change was never made — either is worth a line.
- Advice to act on a level that then returned to band on its own, with no
  recorded intervention, is a flag on the advice, not on Dan.
- A trend the engine called established on evidence journey-4b's rules would
  reject (fewer than three readings in one direction clearing kit noise —
  `journey-4b-notification-matrix.md` §"Evidence rules") is a named finding
  even if the trend later proved real. Right answer, wrong evidence is still
  wrong.

Under AGENTS.md #10, where the app's output and the tank's subsequent behaviour
genuinely conflict, work it up: the possible readings of the conflict (engine
wrong; unrecorded intervention; kit noise; settings anachronism from run A/B),
which reading being wrong hurts, and what would decide it — usually a question
only Dan can answer, phrased so he can answer it from memory in one line.

---

## The two real dose changes — the only advice-versus-action comparison

For 2026-08-10 (calcium → 12 ml) and 2026-08-11 (alkalinity → 10 ml):

1. Run the engine on the data as of the moment **before** the change. Record
   its recommendation in full: dose, target, staging, next-test date.
2. Compare with what the wizard actually recorded: Ca 12 ml, plan target
   +22.2 ppm in 3 stages, next test 2026-08-17; alk 10 ml, 1 stage, next test
   2026-08-13.
3. They should match — these changes were *made through the wizard*, so a
   mismatch means the engine at `054b692` no longer reproduces its own recorded
   advice from four days ago. That would be a serious finding (engine drift
   against its own history); check the obvious innocent causes first
   (settings snapshot, clock fake, plan state) before claiming it.
4. Then the referee: what did alkalinity and calcium do after 10/11 August?
   The export ends 12 August with alkalinity at 8.8, one day into the new
   10 ml dose — say what can and cannot be concluded from a tail that short,
   and resist concluding more.

Also compare the ten `findings-dismissed` entries (all dated 2026-08-10 —
kit-reads-high on phosphate and magnesium, phosphate heading out and settling
near 0.18–0.19, calcium/alkalinity out of step, calcium far below range,
strength unverified, pH tested rarely, a nitrate equilibrium) against what the
replay's engine raises around that date. Ten dismissals in one sitting is
itself evidence for journey-4's complaints — see the next section. Note the
pair "phosphate settles near 0.18ppm" / "near 0.19ppm" dismissed as two
separate keys: that is journey-4 §4's stacking-instead-of-replacing, visible in
Dan's real data.

---

## The journey cross-check — the highest-value findings

`docs/journeys/` records how Dan actually manages the tank. It is source
material, not spec (its README is explicit); nothing here justifies a code
change. But the replay is six months of concrete cases, and every place the
app's replayed behaviour differs from a journey's description gets named, with
the journey and section cited and at least one dated example from the timeline.
Check each of these deliberately — a table in the report, one row each, verdict
`matches` / `differs` / `no occasion to tell`:

| # | Behaviour Dan describes | Where | What to look for in the replay |
|---|---|---|---|
| 1 | **Adaptive cadence** — 2 days normally, 3 when steady, 4–5 when confident, tighter around a change | journey-1 §"What this reveals" pt 1 | Does `nextCheck` ever vary with how settled the tank is? Compare against the actual gaps in his 82-reading alkalinity record — his real cadence is in the data. |
| 2 | **Stability outranks the target** — stable and slightly low beats being chased toward a number | journey-1 pt 4 | Find stretches where a level held steady outside band. Did the app nag every reading? Count the nags. This is journey-1's "biggest philosophical gap". |
| 3 | **A big move skips the confirming test** — 40 points in a week acts immediately, 20 does not | journey-2 pt 2 | Find the largest week-over-week calcium moves in the record; did the app's response distinguish magnitude, or apply the same gate to both? |
| 4 | **Noise is answered by a longer window, not more readings** | journey-2 pt 1 | Find the noisiest calcium/magnesium stretch; did the analysis window widen, or did the app fit a slope through the bounce at fixed 28 days? |
| 5 | **"It didn't move" is a finding** — two readings after an increase, no movement, increase again | journey-1 pt 3 | Only testable after 2026-08-11 (the sole recorded alk change). If the tail is too short, say `no occasion to tell` rather than stretching. |
| 6 | **One reading is notice, two is a signal, three is a fact** | journey-1 pt 5; journey-4b §"Evidence rules" | Audit every movement claim in the replayed notices: how many rest on fewer than three readings in one direction clearing kit noise? |
| 7 | **Tolerance shrinks near the band edge** | journey-2 pt 3 | Identical-sized moves mid-band vs near-edge: identical app response? |
| 8 | **Magnesium high → pause or cut hard, never fine-tune** | journey-3 pt 3 | Magnesium ran against a custom 1450–1500 (later 1520–1560) range; find the high excursions and record the advice given. |
| 9 | **Notices stack instead of replacing, and hiding is per-text** | journey-4 §"What is wrong" pts 1 & 4 | The 0.18/0.19 phosphate pair above is the smoking gun; look for other same-topic stacks across the six months. |

Each `differs` row is filed per AGENTS.md #10 — worked up, not resolved: is
the app missing something, is Dan's practice something the spec would reject,
does the app already do it somewhere unlooked, or is the journey describing a
dropped habit? The journeys README lists exactly these four causes; use its
framing. **Dan chooses.** Chemistry-significant disagreements (anything where
following the app instead of his practice would have changed a dose) are
flagged for `domain-verifier` per AGENTS.md #12 — flagged in the report, not
dispatched from this routine.

---

## Rules, no exceptions

1. **Read-only.** The only writes are `.agent/real-history-replay.md`,
   `.agent/log/<run-id>.md` and `.agent/run-state.md`. No source, spec, test,
   constant, fixture or script changes. The harness lives in the scratchpad
   and dies with the session; its core loop is preserved in the report's
   appendix.
2. **Evidence rule applies to every claim** (AGENTS.md). Every number in the
   report comes from a command or the harness run, and the report says which.
   Anything not verified is marked `UNVERIFIED` with the reason.
3. **What the app would have said, not what it should have said.** Engine
   outputs are quoted, not paraphrased into something more defensible. If an
   explanation string is wrong or ugly, quote it wrong and ugly.
4. **No synthetic history.** Nothing is added to the fixture data to make an
   analysis possible. Where the missing dose record blocks a conclusion, the
   report says "cannot be concluded from the exports" and moves on.
5. **Contradictions worked up, never resolved** (AGENTS.md #10) — between app
   and readings, app and journeys, run A and run B alike.
6. **Both layers, per AGENTS.md #11.** The report states everything twice:
   precise (figures, units, `file:line`, dates) and plain reef-keeping terms.
   The timeline itself needs a plain-language walkthrough of its headline
   moments — Dan should be able to read the plain layer alone, against his
   memory, in ten minutes.
7. **Checkpoint contract applies.** 336 steps is interruptible work: write the
   timeline incrementally, update run-state at section boundaries, and a
   partial run ships a partial report that says what did not run.
8. **Finish the job** (AGENTS.md #13): branch `claude/<date>-real-history-replay`,
   commit the report, push, open the PR with the what/why/risk body. Never
   merge.

---

## Report skeleton — `.agent/real-history-replay.md`

1. What was replayed: fixture, commit, runs A/B, step count, span.
2. The dose-record answer: what the exports do and do not contain (the section
   above, restated with the verification commands' output).
3. The timeline (run A primary; A/B divergence table after it).
4. The referee's notes: every place the advice looks odd against what the
   readings then did, worked up.
5. The two real dose changes: advice vs action.
6. The dismissed-notices check.
7. The journey cross-check table, with worked-up `differs` rows.
8. Findings that belong to other owners: id churn on export round-trip, the
   mixed clock (`now` parameter vs internal `todayStr()`), and anything else
   the replay surfaces that is not this routine's to fix.
9. Open questions for Dan — each answerable from memory in one line.
10. Appendix: the harness loop, verbatim, and the exact commands run.
11. **In plain terms** — the whole report again in reef-keeping language, no
    identifiers, per rule 11.

---

## In plain terms

*Per AGENTS.md #11 — what this routine is, for the person whose tank it is.*

Every other test we run uses invented tanks. You have given us the real one:
two backups of your actual history — about six months of tests, your weekly
10 L water changes, your kit, and the ranges you have set. This routine walks
through that history in order, one test at a time, and writes down what the
app would have told you at each moment: is this number fine, should a dose
change, is there anything it would have flagged.

One honest limitation, found by looking rather than assumed: your backups do
not record the dose changes you made before this August. They remember what
your doses are *now*, and the two changes you made through the app on 10 and
11 August, but not the ones you made from your own judgement in the months
before. So for most of the timeline we cannot mark "the app said X and you did
Y" — instead you get the app's side of the conversation, dated, for you to
read against your own memory. Where you remember doing something different
from what it would have advised, that is exactly the material we want.

The app is not assumed to be right. Your test results are the referee: if the
app would have told you to act and the tank then sorted itself out, the report
says the app was jumpy, not that you were lucky. And everything is checked
against the four documents where you described how you actually run the tank —
testing less often when things are steady, leaving a stable-but-slightly-low
level alone, acting immediately on a big move but waiting on a small one,
answering a noisy kit with a longer look rather than more tests. Every place
the app would have behaved differently from how you work gets named, with
dates, and nothing gets "fixed" off the back of it — the differences are laid
out with the reasoning, and what happens next is your call.
