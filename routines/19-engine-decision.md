# Routine 19 — The Engine Decision

Cloud routine. **Reports only.** No code, spec, test, constant, fixture or
script is changed. The entire output is one report: `.agent/engine-decision.md`,
plus the standard `.agent/log/<run-id>.md` and `.agent/run-state.md` per the
checkpoint contract. Nothing else in the tree moves.

Baseline this routine was written against: commit `480b086`, 14 August 2026.
Every figure quoted below was measured at that commit and is given **with the
command that produced it**. Re-measure before relying on any of them; a number
in a routine file is a starting point, not a finding.

---

## The question

`docs/spec/reef-chemistry.md` §25 names one **Reef Chemistry Engine**: one
assessment step, every parameter through it, every surface a display of its
verdict. That is settled. **How to get there is not**, and there are two ways:

- **Consolidate in place.** `assessAlkalinity`, `assessCalcium`,
  `assessMagnesium` and `doseStatus` merged into one engine, keeping their
  current rules, extended to the parameters they do not cover.
- **Rebuild from canon and the journeys.** Write the engine from
  `docs/spec/reef-chemistry.md` and `docs/journeys/*`, treating the existing
  code as reference rather than as the starting point.

**Dan decides. This routine does not.** Its job is to put the evidence in front
of him in a form he can act on: what actually differs between the engine and
the way he keeps the tank, how much of the engine those differences touch, what
the golden corpus is worth to each path, and what each path costs and risks.

**No recommendation, in any form.** Not in a summary, not in section ordering,
not in adjectives, not in the plain-language layer, and not by adding up which
side has more bullet points. The report may say which way a piece of evidence
points — that *is* the assignment — and may not total the arrows. If a
paragraph reads as advocacy when read back cold, rewrite it.

---

## Precondition — routine 18's report must exist

This routine works **from** `.agent/real-history-replay.md`, the output of
`routines/18-real-history-replay.md`. It does not re-derive the nine habits.

**Checked at `480b086`: that report does not exist**, in `main` or on any
remote branch.

```
ls -la .agent/real-history-replay.md
for b in $(git ls-remote --heads origin | awk '{print $2}' | sed 's|refs/heads/||'); do
  printf '%s: ' "$b"; git ls-tree -r --name-only origin/"$b" 2>/dev/null | grep -c real-history-replay
done
```

If it is still absent, **stop**. Write `.agent/run-state.md` saying routine 18
must run first, and exit. Do not substitute a fresh replay, a partial replay,
or the nine habits read straight from the journeys — the classification in
part one is only as good as the replayed behaviour it is checked against, and a
routine that quietly regenerates its own input is a routine with no input.

**The "8 of 9" figure is to be re-read, not assumed.** The brief for this
routine states that routine 18 found 8 of 9 described habits differing from
replayed engine behaviour. Read the report's own table and count. If it says
something else — 7, or 9, or four `differs` and four `no occasion to tell` —
the number in this report is the number in that table, and the discrepancy is
stated in one line and not explained away.

Rows routine 18 marked `no occasion to tell` stay `no occasion to tell` here.
They are not evidence for either path and must not be quietly promoted to
either column to round the count up.

---

## Four things the report must not get wrong

**1. The tree is about two weeks old, and AI-built throughout — including
`legacy/` and its test suite.** This repo's first commit is 2026-08-13
(`git log --reverse --format='%h %ad %s' --date=short | head -3`); `legacy/`
was preserved 14 August 2026 (`legacy/README-LEGACY.md:1-6`) and its own commit
history is not in this git tree — date it from `legacy/docs/CHANGELOG.md` and
mark `UNVERIFIED` with the reason if it cannot be pinned.

**No sunk-cost argument, in any wording.** "It took a long time to build",
"that corpus represents real investment", "throwing away working code" — none
of these appear. What was expensive to produce is not evidence about what is
right to do next. Age is admissible in exactly one direction: as evidence of
**how little real-world validation the code has had**, which is a fact about
both paths and cuts both ways.

**2. Canon has already answered this question once.** §25's subsection is
titled **"Not a rebuild"** (`docs/spec/reef-chemistry.md:1283-1294`):

> "`deriveTankState` (`src/App.jsx:67`), `assessAlkalinity`, `assessCalcium`,
> `assessMagnesium` and `doseStatus` already exist and are the best-tested code
> in the app — 5,940 pinned golden cases and three-year simulations behind
> them. **The engine is those consolidated and extended to the parameters they
> do not currently cover, not something new written from scratch.** A rewrite
> would put that corpus at risk to gain nothing this decision asks for."

Three consequences, all of which the report states plainly up front:

- Dan wrote that, as spec owner, on 14 August. Rebuilding means **reopening
  §25**, which only he can do (AGENTS.md #1).
- §25's stated ground is precisely the golden corpus — which is exactly what
  part three of this routine measures. **Testing the reasoning of a decision
  the owner already made, at his request, is the service being asked for.** It
  is not a challenge to canon and must not be written as one.
- If the run concludes §25's reasoning is defeated by its own findings, that
  case goes to `.agent/spec-challenges.md`, worked up per AGENTS.md #1 and #10,
  and the report says in one line that it went there. **The report body never
  proposes a spec edit.**

**3. Canon and the journeys are two sources, and they disagree.** "Rebuild from
canon and the journeys" reads as one starting point and is not. Canon §4
(`:148-164`) fixes cadence at 2 / 7 / 21 days and windows at 14 / 28 / 28, and
records the rejection explicitly:

> "**Decided 13 Aug: windows are flat, with no extension.** An earlier design
> stretched the window (alk 7→21, Ca/Mg 14→35) when readings were thin.
> Rejected: stretching means the app quietly changes its own arithmetic when
> data is sparse … Refuse rather than reach."

Journey habits 1 (adaptive cadence) and 4 (noise answered by a longer window)
are on the other side of that. **A habit canon rejects cannot be built by
either path** until Dan changes canon — so it is neither an argument for
rebuilding nor an argument against it, and filing it as either is the single
easiest way to get this report wrong.

**4. The two golden files have already diverged.** `legacy/tests/golden.json`
is digest `37ded9064e91e80e`; `tests/legacy-port/golden.json` is
`83780c1728b67ca6`. Both 5,940 rows. The legacy fingerprint is **not** a check
on today's code and must never be cited as one.

```
python3 -c "
import json
for p in ['tests/legacy-port/golden.json','legacy/tests/golden.json']:
    d=json.load(open(p)); print(p, d['digest'], d['count'], len(d['rows'][0].split('|')[6].split('~')), 'fields')"
```

---

## Part one — classify the nine habits

**This is the load-bearing finding.** Additions favour consolidating;
contradictions favour rebuilding. Get the classification right and the rest of
the report is arithmetic.

The nine habits are routine 18's table, `routines/18-real-history-replay.md:302-310`,
carried through to its report. One row each, and **four** verdicts, not two:

| Verdict | Meaning |
|---|---|
| `addition` | The engine has **no rule** on this. Adopting the habit adds a branch and removes nothing. |
| `replacement` | The engine has a rule that **contradicts** the habit. Adopting it means inverting or deleting existing behaviour. |
| `canon-blocked` | **Canon states a rule that contradicts the habit.** Neither path can adopt it without a spec decision from Dan. Report it, classify it, and count it separately from the other two. |
| `already-does-it` | The engine already implements it, possibly under another name or on only some elements. Check before classifying anything else. |

### The trap that would break the whole classification

**A default is a rule.** "The engine has no adaptive-cadence branch" does not
make adaptive cadence an addition — the engine emits a fixed cadence
(`nextCheck` strings, sites listed below), and a fixed cadence contradicts an
adaptive one. An absent branch that falls through to a default which
contradicts the habit is a **replacement**, not an addition.

The test to apply, in these words: *feed the engine the case the journey
describes; does it stay silent, or does it say something incompatible?* Silence
is an addition. Anything else is a replacement. Where the honest answer is that
it depends on the case, say so and classify both cases.

Where a habit is `already-does-it` on some elements and not others, that is its
own row and its own finding. Verified example: `nearEdge` — tolerance
tightening near the band edge, habit 7 — exists in `src/lib/dosing/calcium.js:436`
and `src/lib/dosing/helpers.js:932` (magnesium) and **not** in
`src/lib/dosing/alkalinity.js` (`grep -rn nearEdge src/lib/`). Check every
habit for that shape before writing a verdict.

### What each row must carry

1. **The journey's sentence, quoted verbatim**, with file and section.
   `docs/journeys/README.md:71-73` — quote, don't paraphrase — applies in full;
   a paraphrase is how a personal habit becomes a fake requirement.
2. **The engine's current rule, quoted verbatim**, with `file:line`. Code or
   the comment that states the rule, whichever carries it. Not a summary of it.
3. **Canon's rule where canon speaks**, quoted, with `§`. `not in canon` where
   it does not — and that absence is itself reportable, because it means a
   rebuild has nothing to build from on that habit.
4. **The verdict**, and the reasoning in one or two sentences. Where the verdict
   is genuinely arguable, give both readings and say which evidence would settle
   it (AGENTS.md #10).
5. **A dated example** from routine 18's timeline, where it has one.

### Where to start looking — verified pointers at `480b086`

Given so the run starts from evidence rather than from search. Confirm each
before quoting; line numbers move.

| Area | Sites |
|---|---|
| Cadence / next test | `nextCheck` assignments: `alkalinity.js:580,694,703,742,781,801,808,817,829,840,940`; `calcium.js:313,395,470,487,528,543,564,574,637`; `helpers.js:629,642,648,828,899`. Settle windows `ALK_SETTLE_HOURS`/`ALK_EARLY_HOURS` `alkalinity.js:35-36`, `CA_SETTLE_DAYS` `calcium.js:33`, `MG_SETTLE_DAYS` `magnesium.js:21`. Canon §4 `:148-164`. |
| Trend detection | `ALK_TREND` `alkalinity.js:28-32`, `CA_TREND` `calcium.js:27-33`, `MG_TREND` `magnesium.js:15-21`; `trendConfirmed` `alkalinity.js:393-399`; `directionConsistent` `alkalinity.js:247`; `alkFit` `:153`, `alkIntervals` `:174`; `pickTrendWindow` `calcium.js:156`. Canon §5 noise floors `:167-175`. |
| Evidence bar (habit 6) | `trendConfirmed` above (`readingCount >= 4`, `spanDays >= 20`); `findings.js` `kitNoise:65`, `settleWindow:78`, `directional:118`. Journey 4b "Evidence rules". Canon §22 (consumption-rate minimum only) and §25's note that 4b's open questions 2–5 are unanswered (`:1308-1311`). |
| Stability vs target (habit 2) | `computeStability` `stability-engine.js:83`, `gradeSpread:64`; `doseStatus` `state.js:44`; canon §11 `:690`. |
| Magnesium (habit 8) | `assessMagnesium` `helpers.js:700`; `canLowerByDose` `helpers.js:367`; canon §10 `:634-689`. |
| Notice stacking (habit 9) | `buildFindings` `findings.js:134`; `wizard-states.md` §19/§20. |
| Movement after a change (habit 5) | `correctionProgress` `helpers.js:247-362` — `stalled`/`backwards` at `:316-319`. |

A throwaway Node harness in the scratchpad is allowed for confirming a rule's
behaviour, on routine 18's terms: **not in the repo**, core loop pasted into
the report appendix, and the clock trap at
`routines/18-real-history-replay.md:189-209` applies unchanged.

### The count, stated plainly

End the section with the tally: N additions, N replacements, N canon-blocked, N
already-does-it, N no-occasion-to-tell, summing to 9. Then one sentence:
additions favour consolidating, contradictions favour rebuilding. **Then stop.**
Do not draw the conclusion.

---

## Part two — the blast radius of the contradictions

For the `replacement` rows only. `addition` rows do not have a blast radius —
they add.

**Method, measured not estimated:**

1. For each replacement, name every function that would have to change. A
   function counts if its behaviour changes, not if it merely sits nearby.
2. Measure each named function's length from its own boundaries
   (`grep -n '^export function\|^function' <file>` and subtract). Report
   measured line counts with the command; never an eyeballed figure.
3. Classify each function: **trend detection**, **cadence**, **messaging**,
   **dose arithmetic**, or **plumbing**. The question posed is whether the
   damage lands in the first three — which is most of the engine — or at the
   edges. Answer it in those terms.
4. Give the denominator. At `480b086`: `src/lib/dosing/` totals 3,380 lines
   across six files, `src/lib/findings.js` 709, `src/lib/stability-engine.js`
   164 (`wc -l src/lib/dosing/*.js src/lib/findings.js src/lib/stability-engine.js`).
   Re-measure; add whichever `src/lib/analytics/*` modules the replacements
   reach.
5. **Count the prose.** In this codebase a behaviour change is mostly a
   rewriting job: `explanation`, `reason` and `nextCheck` are user-facing
   sentences built from the numbers that changed, and `doseStatus` adds
   `headline` and `detail`. Count the template literals inside the affected
   functions. A change that moves 40 lines of arithmetic and 25 sentences is
   not a 40-line change, and reporting it as one would understate the rebuild
   case as badly as ignoring it would overstate it.
6. **Report the overlap.** Do the nine habits hit the same functions repeatedly,
   or does each land in a different corner? Overlap concentrates the work and
   means one rewrite serves several habits; dispersion means the same work
   nine times. Give the function-hit matrix — habits down, functions across —
   and say which shape it is.

**One honesty rule, stated in the report:** a line count is not an effort
estimate, and this section produces line counts. Say what they do not tell you
— nothing about how hard the lines are, and nothing about the tests that would
have to move with them.

---

## Part three — what the golden file is worth to a rebuild

5,940 pinned cases record **current** behaviour. A rebuild deliberately changes
behaviour. The question is how much of the corpus is still a meaningful check
afterwards, and what replaces the part that is not.

### Facts to establish first

- The sweep is **synthetic**, not real-tank: a grid built in
  `tests/legacy-port/golden.js:56-81` — 3 params × 9 offsets × 11 slopes × 5
  reading counts × dose present/absent × correction present/absent = 5,940.
  Confirm the arithmetic and say it in the report. Real-tank data lives in
  `fixtures/real-tank/`, 336 readings, and is not in this corpus.
- Each row is **30 fields** (`golden.js:47-49` and `:103-137`): 14 assessment
  fields, 3 from `doseStatus`, 10 from `computeStability`, 3 correction offers.
  **Rows are the wrong unit.** A rebuild does not invalidate a row; it
  invalidates fields, and a row survives partially.
- The header states the corpus's own purpose (`golden.js:1-13`), including
  the claim that the three engines "share 68% of their lines and every 'fixed
  in one place, not the others' bug this project has had came from that".
  Quote it — it is evidence in part four, on the consolidation side.

### How to estimate, without guessing

Field by field, from part one's classification:

1. For each of the 30 fields, decide whether a rebuild targets it. Fields that
   canon fixes arithmetically — `consumption`, `supplied`, `effectPerMl`,
   `currentDose` (§6, §21) — should be unchanged by a rebuild and remain a real
   check. Fields downstream of trend logic, cadence or wording —
   `trendPerDay`, `band`, `consistent`, `action`, `recommendedDose`,
   `explanation`, `reason`, `nextCheck`, the three `doseStatus` fields — are
   the ones a rebuild is *for*.
2. For each field, count how many of the 5,940 rows carry a **non-empty** value
   there. A field empty in most rows pins nothing in those rows. This is
   computable from `golden.json` alone, no engine run:

   ```
   python3 -c "
   import json
   d=json.load(open('tests/legacy-port/golden.json'))
   n=30
   full=[0]*n
   for r in d['rows']:
       p=r.split('|',6)[6].split('~')
       for i in range(min(n,len(p))):
           if p[i]!='': full[i]+=1
   print(full)"
   ```
3. From those two, give both numbers the brief asks for: **fields still
   meaningful** and **fields needing re-recording**, and the row count that
   follows — rows where every targeted field is empty are untouched checks;
   rows where any is populated need re-recording. Show the working.

### The calibration point already in canon

§26 measured a real behaviour change against this exact sweep
(`docs/spec/reef-chemistry.md:1417-1442`): **172 of 5,940 rows changed** — 1 in
34 — for a change to *one* rule (position is the last reading), audited by
element and direction, digest re-recorded `fbac65244f00ac9b → 83780c1728b67ca6`
via `golden.js`'s `UPDATE=1` (`golden.js:151-155`).

Use it in both directions and say both:

- One rule moved ~3% of rows: the corpus absorbs targeted change well.
- Auditing 172 changed rows by element and direction was itself a piece of
  work, and nine habits is not one rule. Extrapolating 172 × 9 is not a
  calculation and must not be presented as one — say what it would take to
  actually know, which is the field-level count above.

§26 also flags a *further* 39 rows for a change not yet made (`:1455-1466`) —
the one-off correction still sized from the fitted value. Note it: it is
pending work either path inherits.

### What replaces it, if it is largely invalidated

Answer with the measured safety net, not an assumed one.

1. Run and record the current state: `npm run verify` — build, 14 static checks
   (2 advisory), 23 `tests/legacy-port/` suites (`scripts/verify/run.mjs:26-84`).
   And `npm test` (vitest), which is **deliberately outside the gate** and was
   69/261 red across 32/44 files at Phase 5, every one a labelled pre-existing
   chemistry gap (`run.mjs:88-100`). Re-measure both; do not quote those
   numbers.
2. Split the 23 suites into **behaviour-pinning** (record what the engine says;
   invalidated by a deliberate behaviour change) and **property-checking**
   (assert invariants that survive it — `invariants`, `husbandry`, `protocols`,
   `sim/years`, `malformed`, `units` are the candidates; check each rather than
   assuming). Name them in two lists with a line of evidence each. **Those two
   lists are the answer to "what replaces it".**
3. State the re-record option and what it does and does not buy: running
   `UPDATE=1` against the new engine on day one pins the new behaviour from
   then on, and proves nothing whatever about the transition. Say it that
   plainly.
4. Note what neither corpus nor suite covers: real-tank behaviour. The only
   real-tank check in the project is `fixtures/real-tank/` via routine 18, and
   it is a report, not an assertion.

---

## Part four — size both paths honestly

For each path, four headings, and no total:

- **What has to be written.** Functions, parameters, sentences. Measured where
  measurable, from parts one and two.
- **What has to be re-recorded or re-tested.** From part three.
- **What Dan must decide before work can start.** Canon-blocked habits from
  part one; §25's own "not settled here" list (`:1303-1313`); journey 4b's open
  questions 2–5; the open items in §13.
- **What is unknown.** Named as unknown and left unknown. No hours, no story
  points, no t-shirt sizes.

### The rebuild — state this plainly

**Canon and the journeys have never been implemented or tested against a real
tank.** Verify before printing it, and print the verification:

- Canon's own §14 is titled "Enforcement — the honest state", and §25's
  "Enforced by" says outright: *"nothing asserts any of this today"*
  (`:1315-1321`). Check §14 and every "Enforced by" block and report what
  actually asserts canon today.
- The journeys have never been run against anything until routine 18, which is
  a report and asserts nothing.
- `docs/spec/reef-chemistry.md` is 1,508 lines; `docs/journeys/*` is 833 across
  five files (`wc -l`). Neither has executed.

What that risks, each stated as a risk and not as a verdict:

- A rebuild from canon starts by discovering **canon is silent** exactly where
  the engine has rules. §25 lists what it does not settle; §13 lists open items;
  phosphate, nitrate and salinity have no reasoning written at all
  (`:1262-1281`) and §25 forbids minting any. Silence is not a blank slate — it
  is a blocked start.
- The engine's hard-won rules (part five) are **not in canon**. A from-scratch
  build re-earns them by failing the same way, unless it copies them across —
  and copying them across is consolidation under another name for those rules.
  Say which of the two the rebuild would be doing.
- The only real-tank evidence in the project is 336 readings. That is a check,
  not a suite, and it cannot validate a new engine.

### Consolidating — state what carrying the structure costs

Measured, with the repo's own tools rather than assertion:

- Three engines sharing most of their lines. `golden.js:4-6` claims 68% and
  attributes every "fixed in one place, not the others" bug to it. **Measure it
  now** — `npm run verify:dupcheck`, `npm run verify:blockdup` (ceiling 10, tree
  at 10 per `.agent/run-state.md`) — and report the measured figure beside the
  claimed one.
- The divergence that structure has already produced: `nearEdge` in two engines
  of three (part one); the three-times-identical block `alkalinity.js:414-428`
  documents itself, comment and all; §26's flagged dimensional bug —
  `caClearlyOut`/`clearlyOut` compare a ppm **distance** against a ppm/**week**
  rate (`:1468-1471`).
- Phosphate and nitrate assessed with alkalinity's borrowed reasoning, which
  §25 calls a defect and not a display problem (`:1247-1257`, TW-029).
- The mixed clock routine 18 found: `assess*` takes a `now` parameter and the
  code still reads the real clock inside `applyDoseConstraints`,
  `correctionProgress` and `doseStatus`, so the engine cannot be evaluated at a
  past date through its public interface
  (`routines/18-real-history-replay.md:189-209`). Confirm it still holds.
- Whatever the current backlog already carries against these engines
  (`.agent/backlog.md`, `.agent/needs-dan.md`) — count the open items, because
  both paths inherit them and only one path inherits the code they attach to.

---

## Part five — the genuinely hard-won

**Definition, applied strictly:** a rule that exists because a **specific
failure was observed**, and that **neither canon nor the journeys record**. Not
a rule that is merely subtle, well-commented, or hard to read.

**Sweep, do not recall.** This codebase carries its rationale in comments —
seeds, simulated runs, measured percentages, specific overshoot figures. Search
for them across `src/lib/dosing/`, `src/lib/analytics/`, `src/lib/findings.js`,
`src/lib/stability-engine.js` and `src/lib/narrative-engine.js`. Verified seeds
for the sweep, at `480b086`:

| Rule | Site | The observation, quoted from the comment |
|---|---|---|
| Stale-reading guard | `helpers.js:385-415` | *"Over three simulated years this drove calcium from 403 to 498"*; *"Seed 4 did exactly that — day 1044 start at a reading of 399 … while the true level had reached 447."* |
| `measuredSince >= 1` | `helpers.js:302-319` | *"48% of plans over three years were killed as stalled having never had a chance to work, and each replacement started from a worse level."* |
| Passing the target stops the dose | `helpers.js:321-328` | *"calcium reached its band and kept climbing to 702 ppm … alkalinity ran to zero on a downward correction for the same reason."* |
| `dueNow` — estimate spent, unconfirmed | `helpers.js:337-343` | *"how calcium overshot to 515 ppm: it entered its band on a Monday, the next test was the following Monday."* |
| `freshReturn` — return dose recomputed | `helpers.js:345-356` | *"sends the keeper back to a dose 38% short, and the level falls straight out again."* |
| `BRACKET_MEMORY_DAYS = 45` | `helpers.js:62-85` | *"Measured across 36 three-year runs: mean dose error 14% at 21 days, 10% at 35, 8% at 45."* |
| The golden harness's pinned `now` | `golden.js:22-34` | the fingerprint *"was not reproducible, and the failure only showed when a run happened to straddle 20:00."* |
| The sweep's slope and count grids | `golden.js:60-79` | three separate records of a sweep that was blind: *"moving those thresholds changed nothing in 3,564 cases and this sweep reported no change at all."* |

For each rule found, the report gives: the quoted comment, `file:line`, and
then **the check that is the whole point** — grep canon and the journeys for
the rule and record `not in canon` / `in canon §N` / `in journey-N §…`. A rule
canon already records is not hard-won knowledge at risk; it is documented
behaviour, and belongs in a different column.

Three requirements on how this is reported:

1. **Distinguish simulated from observed.** "Seed 4", "three simulated years",
   "36 three-year runs" are simulation against a model of a reef. That is real
   evidence of a real bug class and it is **not** observed harm to a live tank.
   Label each one. Never upgrade simulated evidence to observed.
2. **State whether the evidence is re-earnable.** These observations came from a
   simulator that is still in the tree — `tests/legacy-port/sim/` (`longrun.js`,
   `rng.js`, `years.js`, `smoke.js`, `surfaces.js`), run by the gate as
   `sim/smoke` and `sim/years` (`run.mjs:81`). Check it runs. If a rule
   discovered by a three-year simulation can be rediscovered by running the
   same simulation against a new engine, then it is far cheaper to re-earn than
   "hard-won" suggests — and that cuts **against** the hard-won argument. This
   is decision-relevant and must be reported whichever way it comes out.
3. **The count is the finding.** If there are only a handful, say so in those
   words: a handful is a small thing to carry and a small thing to lose. If the
   sweep finds many, say that instead. **Do not tune the definition to reach a
   number in either direction** — apply it, count what it catches, report the
   count, and let it mean what it means.

---

## Rules, no exceptions

1. **Read-only.** The only writes are `.agent/engine-decision.md`,
   `.agent/log/<run-id>.md` and `.agent/run-state.md`. No source, spec, test,
   constant, fixture, journey or script changes. Any harness lives in the
   scratchpad and dies with the session; its core loop goes in the appendix.
2. **No recommendation.** See the question section. This is the one rule most
   likely to be broken accidentally, in the summary or the plain layer. Read
   both back cold before shipping and cut anything that leans.
3. **Evidence rule** (AGENTS.md). Every number comes from a command, and the
   report shows the command. Anything unverified is marked `UNVERIFIED` with
   the reason. The figures in this routine file are baseline `480b086` and are
   re-measured, not copied.
4. **Quote, don't paraphrase** — `docs/journeys/README.md:71-73` for journeys,
   and the same discipline for engine code and canon. If a rule is ugly, quote
   it ugly.
5. **No sunk cost**, in any wording. See "four things", item 1.
6. **Canon is canon** (AGENTS.md #1). The report does not propose editing §25 or
   any other section. A case that canon is wrong goes to
   `.agent/spec-challenges.md`, worked up, and gets one line in the report
   saying it was filed there.
7. **Contradictions worked up, never resolved** (AGENTS.md #10) — engine vs
   journeys, canon vs journeys, and §25 vs this report's own findings alike.
   Options with checkable reasoning, which direction being wrong hurts, what
   else must change alongside, what would make each option wrong.
8. **Chemistry-significant findings flagged for `domain-verifier`** (AGENTS.md
   #12) — flagged in the report, not dispatched from this routine.
9. **Both layers** (AGENTS.md #11). The plain layer must be enough to decide
   from on its own: the nine habits in reef-keeping terms, what each path
   costs, what each risks, what is unknown. No identifiers, no file paths, no
   camelCase, no test names in that layer.
10. **Checkpoint contract.** Five parts and nine habits is interruptible work.
    Write each part as it completes, update `.agent/run-state.md` at every part
    boundary, and ship a partial report that says exactly what did not run.
11. **Finish the job** (AGENTS.md #13): branch `claude/<date>-engine-decision`,
    commit the report, push, open the PR with the what/why/risk body in both
    layers. **Never merge.**

---

## Report skeleton — `.agent/engine-decision.md`

1. **The question**, in one paragraph, and the statement that this report does
   not answer it.
2. **What was read and measured**: commit, routine 18's report, the commands
   run and their output.
3. **The four framing facts**: the tree's age and what it does and does not
   imply; canon §25 having answered this once and what that means procedurally;
   canon and the journeys disagreeing with each other; the two golden files
   having diverged.
4. **Part one — the nine habits classified.** The table, then the tally.
5. **Part two — blast radius.** Functions, measured lines, the
   trend/cadence/messaging split, the sentence count, the habit × function
   overlap matrix.
6. **Part three — the golden corpus.** Field-level survival estimate with its
   working, the §26 calibration, and the two named lists of what would replace
   it.
7. **Part four — the two paths**, each under the four headings, neither
   totalled.
8. **Part five — the hard-won inventory**, with the simulated/observed label,
   the re-earnable check, and the count stated plainly.
9. **Open questions for Dan** — each answerable in one line, and none of them a
   disguised recommendation.
10. **Appendix**: commands run with their output, and any harness loop verbatim.
11. **In plain terms** — the whole report again in reef-keeping language, per
    AGENTS.md #11, ending with the two paths and the question, not an answer.

---

## In plain terms

*Per AGENTS.md #11 — what this routine is, for the person whose tank it is.*

The part of the app that works out your alkalinity, calcium and magnesium is
three separate lumps of code that mostly do the same thing. It has been decided
that there should be one. The question this routine puts in front of you is
whether to tidy the three into one and keep how they behave, or to start again
from the chemistry document and the four write-ups of how you actually run the
tank.

The routine does not answer that. It gathers what you need to answer it.

Four things it works out. First, and most important: we replayed your six
months of real readings and found that nine habits you described don't match
what the app does. For each one, is the app simply **quiet** where you have a
habit — in which case tidying up and adding the habit is straightforward — or
does it actively do the **opposite**, in which case adding your habit means
taking something out? A third answer matters just as much: some of your habits
are things the chemistry document has already ruled out on purpose. Those can't
be built either way until you change your mind about the document, and the
report says which ones those are rather than counting them for either side.

Second, if the app does the opposite, how much of it is involved — is it the
bits that spot trends, decide when to test again, and write the sentences you
read, which is most of it, or is it round the edges?

Third, there is a set of nearly six thousand recorded answers that proves the
app still behaves the way it did yesterday. If we deliberately change how it
behaves, most of that record stops being a check. The report works out how much
of it would survive, how much would have to be recorded fresh, and what would
be left watching for mistakes in the meantime.

Fourth, both routes, side by side, with the awkward parts said out loud. For
starting again: the chemistry document and your write-ups have never actually
been built into anything, and have never been tested against a real tank. They
are careful, and they are untried, and there are places where the document
simply doesn't say. For tidying up: the report says what you'd be carrying
forward — three lumps that have already drifted apart from each other, one
measurement compared against the wrong kind of number, and warnings about
phosphate and nitrate that come out wrong because they're judged by
alkalinity's rules.

And one more thing. Some rules in the app are there because something specific
went wrong once — the app talked itself into dosing again off a test taken
before its last correction had even landed, and calcium climbed from 403 to
498 in testing before that was caught. That kind of knowledge isn't written
down anywhere except in the code itself, so starting fresh means learning it
again the hard way. The report counts how many rules like that there are. If
it's only a handful, that is worth knowing, because a handful is not much to
lose — and it also checks whether the same testing that found them in the first
place could just find them again.

Two things this report will not do. It will not argue that the app is worth
keeping because it took effort to build — everything here, including the old
version and its tests, was written in about two weeks with AI help, and none of
it has years of hard-won knowledge behind it. And it will not tell you which
way to go. It lays out both, with the evidence, and the choice is yours.
