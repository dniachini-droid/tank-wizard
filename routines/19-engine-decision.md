# Routine 19 — The Engine Decision

Cloud routine. **Reports only.** No code, spec, test, constant, fixture or
script is changed. The entire output is one report: `.agent/engine-decision.md`,
plus the standard `.agent/log/<run-id>.md` and `.agent/run-state.md` per the
checkpoint contract. Nothing else in the tree moves.

Baseline this routine was written against: commit `480b086`, 14 August 2026.
Every figure below was measured at that commit and is given **with the command
that produced it**. Re-measure before relying on any of them. A number in a
routine file is a starting point, not a finding.

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

The report has six parts. **Parts one to five are evidence and carry no
opinion. Part six is a recommendation.** The separation is deliberate and is
the routine's central structural rule — see part six.

---

## Precondition — routine 18's report

This routine reads `.agent/real-history-replay.md`, the output of
`routines/18-real-history-replay.md`, for two things: the count of habits whose
replayed behaviour differs, and a dated example under each.

**Checked at `480b086`: that report does not exist**, in `main` or on any
remote branch.

```
ls -la .agent/real-history-replay.md
for b in $(git ls-remote --heads origin | awk '{print $2}' | sed 's|refs/heads/||'); do
  printf '%s: ' "$b"; git ls-tree -r --name-only origin/"$b" 2>/dev/null | grep -c real-history-replay
done
```

**If it is absent, the routine still runs.** Classification (part one) asks
what rule the engine has, which is answerable by reading the engine — the
replay confirms it and dates it, it does not establish it. So:

- Do part one statically, from the code, the journeys and canon.
- Mark every replay-dependent cell `UNVERIFIED — routine 18 not run`, and say
  so once at the top of the report rather than in every row.
- Say plainly in part six that the recommendation rests on static reading
  alone, and whether that weakens it.

**Do not manufacture the replay.** No partial re-run, no synthesised timeline,
no habit counted as `differs` because it looks like it would.

**The "8 of 9" figure is to be re-read, not assumed.** The brief for this
routine states routine 18 found 8 of 9 described habits differing. If the
report exists, count its own table. If it says 7, or 9, or splits into
`differs` and `no occasion to tell`, that number is the number, and the
discrepancy gets one line. Rows marked `no occasion to tell` stay there — they
are evidence for neither path and must not be promoted to round the count up.

---

## Four things the report must not get wrong

**1. The tree is four days old, and AI-built throughout — `legacy/` and its
test suite included.** Dan's figure; check it against the artefacts and report
what they show. This repo's first commit is 2026-08-13
(`git log --reverse --format='%h %ad %s' --date=short | head -3`); `legacy/` was
preserved 14 August 2026 (`legacy/README-LEGACY.md:1-6`) and its own git
history is not in this tree — date it from `legacy/docs/CHANGELOG.md`, and mark
`UNVERIFIED` with the reason if it will not pin.

**There is no long history here to preserve, and no argument may rest on one.**
"It took a long time to build", "that corpus represents real investment",
"throwing away working code" — barred, in every wording, in every part
including part six. What was expensive to produce is not evidence about what is
right to do next.

The disciplined form of the argument is available and permitted: **the corpus
is worth exactly what it can still check.** That is a claim about present
utility, measured in part three, and it is not a sunk-cost argument. Keep the
distinction visible.

**2. Canon has already answered this once.** §25's subsection is titled
**"Not a rebuild"** (`docs/spec/reef-chemistry.md:1283-1294`):

> "`deriveTankState` (`src/App.jsx:67`), `assessAlkalinity`, `assessCalcium`,
> `assessMagnesium` and `doseStatus` already exist and are the best-tested code
> in the app — 5,940 pinned golden cases and three-year simulations behind
> them. **The engine is those consolidated and extended to the parameters they
> do not currently cover, not something new written from scratch.** A rewrite
> would put that corpus at risk to gain nothing this decision asks for."

Dan wrote that, as spec owner, on 14 August. Three consequences:

- Its stated ground is the golden corpus — exactly what part three measures.
  **Testing the reasoning behind a decision the owner already made, at his
  request, is the service being asked for.** Not a challenge to canon.
- A recommendation to rebuild is a recommendation that Dan **reopen §25**. Part
  six must say so in those words, and the case goes to
  `.agent/spec-challenges.md` worked up per AGENTS.md #1 and #10, with one line
  in the report saying it was filed. **The report body never proposes a spec
  edit itself.**
- A recommendation to consolidate must separate §25's **conclusion** from
  §25's **reasoning**. Part three may find the corpus is worth less than §25
  assumes. Agreeing with a conclusion whose stated ground has just been
  weakened is a legitimate position and must be stated as one, not blurred.

**3. Canon and the journeys are two sources, and they disagree with each
other.** "Rebuild from canon and the journeys" reads as one starting point and
is not. Canon §4 (`:148-164`) fixes cadence at 2 / 7 / 21 days and windows at
14 / 28 / 28, and records the rejection explicitly:

> "**Decided 13 Aug: windows are flat, with no extension.** An earlier design
> stretched the window (alk 7→21, Ca/Mg 14→35) when readings were thin.
> Rejected: stretching means the app quietly changes its own arithmetic when
> data is sparse … Refuse rather than reach."

The journeys know it. `journey-1-alkalinity.md:142` says outright *"The spec
has a flat 2-day alkalinity cadence"* before describing an adaptive one, and
`journey-2-calcium.md:210-214` warns that calcium's cadence never relaxes,
*"Worth knowing before building an adaptive-cadence feature that would try to
stretch it."*

**A habit canon rejects cannot be built by either path** until Dan changes
canon. It is evidence for neither, and filing it as either is the easiest way
to get this report wrong.

**4. The two golden files have already diverged.** `legacy/tests/golden.json`
is `37ded9064e91e80e`; `tests/legacy-port/golden.json` is `83780c1728b67ca6`.
Both 5,940 rows, 30 fields. The legacy fingerprint is **not** a check on
today's code and must never be cited as one.

```
python3 -c "
import json
for p in ['tests/legacy-port/golden.json','legacy/tests/golden.json']:
    d=json.load(open(p)); print(p, d['digest'], d['count'], len(d['rows'][0].split('|')[6].split('~')), 'fields')"
```

---

## Part one — classify the nine habits

**This is the load-bearing finding.** Additions favour consolidating;
contradictions favour rebuilding. Get this right and much of the rest is
arithmetic.

The nine are routine 18's table (`routines/18-real-history-replay.md:302-310`).
One row each, and **four** verdicts, not two:

| Verdict | Meaning |
|---|---|
| `addition` | The engine has **no rule** here. Adopting the habit adds a branch and removes nothing. |
| `replacement` | The engine has a rule that **contradicts** the habit. Adopting it inverts or deletes existing behaviour. |
| `canon-blocked` | **Canon states a rule that contradicts the habit.** Neither path can adopt it without a spec decision from Dan. Counted separately, and evidence for neither path. |
| `already-does-it` | The engine already implements it, perhaps under another name or on only some elements. Check this before writing any other verdict. |

### The trap that would invert the whole result

**A default is a rule.** "The engine has no adaptive-cadence branch" does not
make adaptive cadence an addition — the engine emits a fixed cadence, and a
fixed cadence contradicts an adaptive one. An absent branch falling through to
a default that contradicts the habit is a **replacement**.

The test, in these words: *feed the engine the case the journey describes; does
it stay silent, or say something incompatible?* Silence is an addition.
Anything else is a replacement. Where it honestly depends on the case, say so
and classify both cases.

Where a habit is `already-does-it` on some elements and not others, that is its
own row and its own finding — it is the consolidation argument appearing inside
the classification. Verified example: `nearEdge`, tolerance tightening near the
band edge (habit 7), exists at `src/lib/dosing/calcium.js:436` and
`src/lib/dosing/helpers.js:932` (magnesium) and **not** in
`src/lib/dosing/alkalinity.js` (`grep -rn nearEdge src/lib/`).

### What each row carries

1. **The journey's sentence, verbatim**, with file and section.
   `docs/journeys/README.md:71-73` — quote, don't paraphrase — applies in full.
2. **The engine's current rule, verbatim**, with `file:line`. Code, or the
   comment that states the rule. Not a summary.
3. **Canon's rule where canon speaks**, quoted, with `§`; `not in canon`
   otherwise. That absence is itself reportable: it is what a rebuild would
   have nothing to build from.
4. **The verdict**, with reasoning in a sentence or two. Where genuinely
   arguable, give both readings and what would settle it (AGENTS.md #10).
5. **A dated example** from routine 18's timeline where one exists.

### Two habits that are not rule-sized — check before classifying

- **Habit 9, notice stacking.** `journey-4b-notification-matrix.md` is not a
  complaint, it is a **complete replacement design**: three dimensions
  (position × movement × dose state), a full matrix of cells, exact sentences,
  and its own evidence rules (three readings to establish movement, two to
  contradict a dose change, with four conditions). It is also marked *"Draft
  for his review"* (`:3`) and unaccepted. Classify what it would replace —
  `buildFindings`, `src/lib/findings.js:134` — and say that this row is a
  layer, not a rule.
- **The preferred range inside the band.** `journey-1-alkalinity.md:13-14`
  ("Band 8.5–9.5 dKH. **But the real target is 9.0–9.5**") and
  `journey-2-calcium.md:193-197` both need a concept the engine has no slot
  for. Check canon §2's three layers (`:46-96`) before calling it an addition —
  it may already be partly specced, which changes its classification.

### Where to look — verified pointers at `480b086`

Confirm before quoting; line numbers move.

| Area | Sites |
|---|---|
| Cadence / next test | `nextCheck` assignments: `alkalinity.js:580,694,703,742,781,801,808,817,829,840,940`; `calcium.js:313,395,470,487,528,543,564,574,637`; `helpers.js:629,642,648,828,899`. `ALK_SETTLE_HOURS`/`ALK_EARLY_HOURS` `alkalinity.js:35-36`, `CA_SETTLE_DAYS` `calcium.js:33`, `MG_SETTLE_DAYS` `magnesium.js:21`. Canon §4 `:148-164`. |
| Trend detection | `ALK_TREND` `alkalinity.js:28-32`, `CA_TREND` `calcium.js:27-33`, `MG_TREND` `magnesium.js:15-21`; `trendConfirmed` `alkalinity.js:393-399`; `directionConsistent` `:247`; `alkFit` `:153`; `alkIntervals` `:174`; `pickTrendWindow` `calcium.js:156`. Canon §5 `:167-175`. |
| Evidence bar (habit 6) | `trendConfirmed` above — `readingCount >= 4`, `spanDays >= 20`. `findings.js` `kitNoise:65`, `settleWindow:78`, `directional:118`. Journey 4b "Evidence rules". Canon §22, and §25's note that 4b's open questions 2–5 are unanswered (`:1308-1311`). |
| Stability vs target (habit 2) | `computeStability` `stability-engine.js:83`, `gradeSpread:64`; `doseStatus` `state.js:44`; canon §11 `:690`. |
| Window choice (habit 4) | `pickTrendWindow` `calcium.js:156`; canon §4's flat-window rejection. Journey 2 G (`:154-171`) specifies a *method* change — anchor at the lowest point and average when bouncing, full span when monotonic — not a width change. Classify what it actually asks for. |
| Magnesium (habit 8) | `assessMagnesium` `helpers.js:700`; `canLowerByDose` `helpers.js:367`; canon §10 `:634-689`. |
| Notices (habit 9) | `buildFindings` `findings.js:134`; `wizard-states.md` §19/§20. |
| No movement after a change (habit 5) | `correctionProgress` `helpers.js:247-362`, `stalled`/`backwards` at `:316-319`. Journey 1 §3 (`:157-164`) is explicit that the engine has this **for correction plans only** and Dan applies it to ordinary dose changes. |

A throwaway Node harness in the scratchpad is allowed for confirming a rule's
behaviour, on routine 18's terms: **not in the repo**, core loop in the report
appendix, and the clock trap at `routines/18-real-history-replay.md:189-209`
applies unchanged.

### The tally

End with: N additions, N replacements, N canon-blocked, N already-does-it, N
no-occasion-to-tell, summing to 9. Then one sentence — additions favour
consolidating, contradictions favour rebuilding. **Then stop.** Part one draws
no conclusion; part six does.

---

## Part two — the blast radius of the contradictions

`replacement` rows only. Additions have no blast radius.

1. Name every function whose behaviour would change. Sitting nearby does not
   count.
2. Measure each one from its own boundaries
   (`grep -n '^export function\|^function' <file>`). Measured counts with the
   command; never an eyeballed figure.
3. Classify each: **trend detection**, **cadence**, **messaging**, **dose
   arithmetic**, **plumbing**. The question is whether the damage lands in the
   first three — most of the engine — or at the edges. Answer in those terms.
4. Give the denominator. At `480b086`: `src/lib/dosing/` totals 3,380 lines
   across six files, `src/lib/findings.js` 709, `src/lib/stability-engine.js`
   164 (`wc -l src/lib/dosing/*.js src/lib/findings.js src/lib/stability-engine.js`).
   Re-measure, and add whichever `src/lib/analytics/*` modules are reached.
5. **Count the sentences.** A behaviour change here is mostly a rewriting job:
   `explanation`, `reason` and `nextCheck` are prose built from the numbers
   that changed, and `doseStatus` adds `headline` and `detail`. Count the
   template literals in the affected functions. Reporting a change as 40 lines
   when it is 40 lines and 25 sentences understates the rebuild case as badly
   as ignoring it would overstate it.
6. **Report the overlap.** Habits down, functions across. Do the nine land on
   the same functions repeatedly, or each in its own corner? Overlap means one
   rewrite serves several habits; dispersion means the same work nine times.
   Say which shape the matrix is — it feeds part six directly.

**One honesty rule, in the report:** this section produces line counts, and a
line count is not an effort estimate. Say what it does not tell you — nothing
about how hard the lines are, nothing about the tests that move with them.

---

## Part three — what the golden corpus is worth to a rebuild

5,940 pinned cases record **current** behaviour. A rebuild deliberately changes
behaviour. How much is still a meaningful check afterwards, and what replaces
the rest?

### Establish first

- The sweep is **synthetic**: a grid at `tests/legacy-port/golden.js:56-81` —
  3 params × 9 offsets × 11 slopes × 5 reading counts × dose present/absent ×
  correction present/absent = 5,940. Confirm the arithmetic. Real-tank data is
  `fixtures/real-tank/`, 336 readings, and is not in this corpus.
- Each row is **30 fields** (`golden.js:47-49`, `:103-137`): 14 assessment, 3
  from `doseStatus`, 10 from `computeStability`, 3 correction offers. **Rows
  are the wrong unit** — a rebuild invalidates fields, and rows survive
  partially.
- Quote the corpus's own stated purpose (`golden.js:1-13`), including the claim
  that the three engines *"share 68% of their lines and every 'fixed in one
  place, not the others' bug this project has had came from that"*. It is
  evidence in part four, on the consolidation side.

### Estimate field by field, without guessing

1. From part one's classification, decide for each of the 30 fields whether a
   rebuild targets it. Fields canon fixes arithmetically — `consumption`,
   `supplied`, `effectPerMl`, `currentDose` (§6, §21) — should survive a
   rebuild and remain real checks. Fields downstream of trend logic, cadence or
   wording — `trendPerDay`, `band`, `consistent`, `action`, `recommendedDose`,
   `explanation`, `reason`, `nextCheck`, the three `doseStatus` fields — are
   what a rebuild is *for*.
2. Count how many rows carry a **non-empty** value in each field. A field empty
   in most rows pins nothing there. No engine run needed:

   ```
   python3 -c "
   import json
   d=json.load(open('tests/legacy-port/golden.json'))
   full=[0]*30
   for r in d['rows']:
       p=r.split('|',6)[6].split('~')
       for i in range(min(30,len(p))):
           if p[i]!='': full[i]+=1
   print(full)"
   ```
3. Report both numbers the question asks for — fields still meaningful, fields
   needing re-recording — and the row count that follows: rows where every
   targeted field is empty survive as checks; rows where any is populated must
   be re-recorded. Show the working.

### The calibration point already in canon

§26 measured a real behaviour change against this exact sweep
(`docs/spec/reef-chemistry.md:1417-1442`): **172 of 5,940 rows changed** — 1 in
34 — for **one** rule (position is the last reading), audited by element and
direction, digest re-recorded `fbac65244f00ac9b → 83780c1728b67ca6` via
`golden.js`'s `UPDATE=1` (`:151-155`).

Use it both ways, and say both:

- One rule moved ~3% of rows: the corpus absorbs targeted change well.
- Auditing those 172 by element and direction was itself a piece of work, and
  nine habits is not one rule. **172 × 9 is not a calculation** and must not be
  presented as one — the field-level count above is how you would actually
  know.

§26 also flags a further 39 rows for a change not yet made (`:1455-1466`) — the
one-off correction still sized from the fitted value. Note it: pending work
both paths inherit.

### What replaces it

Answer with the measured net, not an assumed one.

1. Record current state: `npm run verify` — build, 14 static checks (2
   advisory), 23 `tests/legacy-port/` suites (`scripts/verify/run.mjs:26-84`).
   And `npm test` (vitest), **deliberately outside the gate**, 69/261 red
   across 32/44 files at Phase 5, every one a labelled pre-existing chemistry
   gap (`run.mjs:88-100`). Re-measure both; do not quote those figures.
2. Split the 23 suites into **behaviour-pinning** (record what the engine says;
   invalidated by deliberate change) and **property-checking** (assert
   invariants that survive it — `invariants`, `husbandry`, `protocols`,
   `sim/years`, `malformed`, `units` are candidates; check each, assume none).
   **Those two lists are the answer to "what replaces it".**
3. State the re-record option and what it buys: `UPDATE=1` against the new
   engine on day one pins the new behaviour from then on and proves nothing
   whatever about the transition. That plainly.
4. Name what neither corpus nor suite covers: real-tank behaviour. The only
   real-tank check in the project is `fixtures/real-tank/` via routine 18, and
   it is a report, not an assertion.

---

## Part four — size both paths

Four headings each, and **no total** — no hours, no story points, no sizes.

- **What has to be written.** From parts one and two.
- **What has to be re-recorded or re-tested.** From part three.
- **What Dan must decide before work can start.** Canon-blocked habits; §25's
  own "not settled here" list (`:1303-1313`); 4b's open questions 2–5; §13's
  open items; the open questions at the foot of each journey.
- **What is unknown.** Named as unknown and left unknown.

### The rebuild — say this plainly

**Canon and the journeys have never been implemented, and never tested against
a real tank.** Verify before printing, and print the verification:

- §14 is titled "Enforcement — the honest state", and §25's "Enforced by" says
  outright *"nothing asserts any of this today"* (`:1315-1321`). Check §14 and
  every "Enforced by" block; report what actually asserts canon.
- The journeys have never been run against anything until routine 18, which is
  a report and asserts nothing. 4b is marked draft and unaccepted.
- `docs/spec/reef-chemistry.md` is 1,508 lines; `docs/journeys/*` is 833 across
  five files (`wc -l`). Neither has executed.

Risks, each stated as a risk:

- A rebuild from canon starts by finding **canon silent exactly where the
  engine has rules**. §25 lists what it does not settle; §13 lists open items;
  phosphate, nitrate and salinity have no reasoning written at all
  (`:1262-1281`) and §25 forbids minting any. Silence is a blocked start, not a
  blank slate.
- The engine's hard-won rules (part five) are **not in canon**. A from-scratch
  build either re-earns them by failing the same way, or copies them across —
  and copying them across is consolidation under another name for those rules.
  Say which the rebuild would be doing.
- The only real-tank evidence in the project is 336 readings. A check, not a
  suite, and it cannot validate a new engine.

### Consolidating — say what carrying the structure costs

Measured with the repo's own tools, not asserted:

- Three engines sharing most of their lines. `golden.js:4-6` claims 68% and
  attributes every "fixed in one place, not the others" bug to it. **Measure it
  now** — `npm run verify:dupcheck`, `npm run verify:blockdup` (ceiling 10,
  tree at 10 per `.agent/run-state.md`) — and report measured beside claimed.
- Divergence that structure has already produced: `nearEdge` in two engines of
  three; the three-times-identical block at `alkalinity.js:407-428`, whose own
  comment records that *"blockdup did not object because it abandoned any
  eight-line window containing a comment, and this block is well commented: the
  documentation was hiding the duplication it described"*; §26's flagged
  dimensional bug — `caClearlyOut`/`clearlyOut` compare a ppm **distance**
  against a ppm/**week** rate (`:1468-1471`).
- Phosphate and nitrate on borrowed alkalinity reasoning, which §25 calls a
  defect and not a display problem (`:1247-1257`, TW-029).
- The mixed clock: `assess*` takes a `now` parameter and the code still reads
  the real clock inside `applyDoseConstraints`, `correctionProgress` and
  `doseStatus`, so the engine cannot be evaluated at a past date through its
  public interface (`routines/18-real-history-replay.md:189-209`). Confirm it
  still holds.
- Open items already filed against these engines (`.agent/backlog.md`,
  `.agent/needs-dan.md`) — count them. Both paths inherit the problems; only
  one inherits the code they attach to.

**If the evidence shows the two paths are not exhaustive** — for instance that
the contradictions sit in a layer separable from the arithmetic — report that
as a fact, in one short paragraph, with the evidence. Do not develop it into a
third proposal. Part six recommends between the two paths as asked.

---

## Part five — the genuinely hard-won

**Definition, applied strictly:** a rule that exists because a **specific
failure was observed**, and that **neither canon nor the journeys record**. Not
a rule that is merely subtle, clever or well-commented.

**Sweep, do not recall.** This codebase carries its rationale in comments —
seeds, simulated runs, measured percentages, specific overshoot figures. Search
`src/lib/dosing/`, `src/lib/analytics/`, `src/lib/findings.js`,
`src/lib/stability-engine.js`, `src/lib/narrative-engine.js`. Verified seeds at
`480b086`:

| Rule | Site | The observation, quoted |
|---|---|---|
| Stale-reading guard | `helpers.js:385-415` | *"Over three simulated years this drove calcium from 403 to 498"*; *"Seed 4 did exactly that — day 1044 start at a reading of 399 … while the true level had reached 447."* |
| `measuredSince >= 1` | `helpers.js:302-319` | *"48% of plans over three years were killed as stalled having never had a chance to work, and each replacement started from a worse level."* |
| Passing the target stops the dose | `helpers.js:321-328` | *"calcium reached its band and kept climbing to 702 ppm … alkalinity ran to zero on a downward correction for the same reason."* |
| `dueNow` — estimate spent, unconfirmed | `helpers.js:337-343` | *"how calcium overshot to 515 ppm: it entered its band on a Monday, the next test was the following Monday."* |
| `freshReturn` — return dose recomputed | `helpers.js:345-356` | *"sends the keeper back to a dose 38% short, and the level falls straight out again."* |
| `BRACKET_MEMORY_DAYS = 45` | `helpers.js:62-85` | *"Measured across 36 three-year runs: mean dose error 14% at 21 days, 10% at 35, 8% at 45."* |
| The golden harness's pinned `now` | `golden.js:22-34` | the fingerprint *"was not reproducible, and the failure only showed when a run happened to straddle 20:00."* |
| The sweep's slope and count grids | `golden.js:60-79` | three records of a sweep that was blind: *"moving those thresholds changed nothing in 3,564 cases and this sweep reported no change at all."* |

Each rule found gets: the quoted comment, `file:line`, and then **the check
that is the whole point** — grep canon and the journeys, and record `not in
canon` / `in canon §N` / `in journey-N §…`. A rule canon already records is not
knowledge at risk; it is documented behaviour, and belongs in another column.

Three requirements on the reporting:

1. **Distinguish simulated from observed.** "Seed 4", "three simulated years",
   "36 three-year runs" are simulation against a model of a reef. Real evidence
   of a real bug class, and **not** observed harm to a live tank. Label each.
   Never upgrade simulated to observed.
2. **State whether the evidence is re-earnable.** These came from a simulator
   still in the tree — `tests/legacy-port/sim/` (`longrun.js`, `rng.js`,
   `years.js`, `smoke.js`, `surfaces.js`), gated as `sim/smoke` and `sim/years`
   (`run.mjs:81`). Check it runs. If a rule found by a three-year simulation
   can be re-found by running the same simulation against a new engine, it is
   far cheaper to re-earn than "hard-won" implies — and that cuts **against**
   the hard-won argument. Report it whichever way it comes out.
3. **The count is the finding.** A handful is a small thing to carry and a
   small thing to lose; many is a different matter. **Do not tune the
   definition to reach a number in either direction.** Apply it, count what it
   catches, report the count.

---

## Part six — the recommendation

**Consolidate, or rebuild.** One of the two, stated in the first sentence of
the section, in those words.

Five conditions, all binding:

**1. It comes last.** After parts one to five are written and will not be
revised to suit it. Parts one to five carry no advocacy — no leading adjectives,
no ordering that argues, no summary that tallies. **Dan must be able to read
the evidence, form his own view, and only then see yours.** If a finding is
edited after part six is drafted, say in the log that it was and why.

**2. It is traceable.** Every load-bearing claim cites a specific row, count or
measurement from parts one to five. Not an impression of the whole. A
recommendation that cannot be walked back to numbered findings is not finished.

**3. It states plainly what would make it wrong.** A section headed exactly
that. Concrete and checkable: which finding, if it turned out otherwise, would
flip the recommendation; what would have to be true; and — where it can be
named — what test, count or question would settle it. "Further work may reveal"
is not an answer. Include the single finding you would most want to be wrong
about, and say why it is the one.

**4. No appeal to accumulated work.** The tree is four days old. There is no
long history here, and any argument resting on one is invalid — barred in every
wording, including softened ones ("mature", "battle-tested", "hard-won" applied
to the corpus rather than to a specific observed failure, "starting over
wastes"). Present utility is the permitted form: what the corpus can still
check, measured in part three; what the simulator can still re-find, measured
in part five. If part six cannot make its case without leaning on effort
already spent, that is itself the finding, and it should say so.

**5. If the evidence does not favour either path, say so.** In those words, as
the recommendation. **Do not manufacture a preference to fill the section.** A
genuine tie is a real outcome and a useful one. It must then say what is
missing — which specific measurement, decision or test would break the tie, and
who can produce it — so the section still ends with something actionable.

Two things part six must also do:

- If it recommends **rebuilding**, say plainly that this means Dan reopening
  canon §25, and file the worked-up case in `.agent/spec-challenges.md` per
  AGENTS.md #1, with one line here saying it was filed.
- If it recommends **consolidating**, say whether it agrees with §25's
  reasoning or only its conclusion. Part three may show the golden corpus is
  worth less than §25 assumes. Reaching the same conclusion on different
  grounds is a legitimate position and is stated as one.

Length: this is the shortest section in the report. If it runs longer than the
findings it rests on, the argument has moved out of the evidence and into
prose.

---

## Rules, no exceptions

1. **Read-only.** The only writes are `.agent/engine-decision.md`,
   `.agent/log/<run-id>.md` and `.agent/run-state.md`. No source, spec, test,
   constant, fixture, journey or script changes. Any harness lives in the
   scratchpad and dies with the session; its core loop goes in the appendix.
2. **Advocacy is confined to part six.** Parts one to five report; part six
   recommends. This is the routine's structural rule and the reason the report
   is worth reading. Read parts one to five back cold before shipping and cut
   anything that leans.
3. **Evidence rule** (AGENTS.md). Every number comes from a command, and the
   report shows it. Anything unverified is marked `UNVERIFIED` with the reason.
   Baseline figures in this routine are re-measured, not copied.
4. **Quote, don't paraphrase** — `docs/journeys/README.md:71-73` for journeys,
   the same discipline for engine code and canon. If a rule is ugly, quote it
   ugly.
5. **No appeal to accumulated work**, anywhere, in any wording. Condition 4 of
   part six applies to the whole report.
6. **Canon is canon** (AGENTS.md #1). The report never edits or proposes
   editing `docs/spec/*`. A case that canon is wrong goes to
   `.agent/spec-challenges.md`, worked up, with one line here saying so. Part
   six may *recommend that Dan* change canon — that is a recommendation to the
   owner, not an agent editing the spec, and the distinction is stated where it
   is used.
7. **Contradictions worked up, never resolved** (AGENTS.md #10) — engine vs
   journeys, canon vs journeys, §25 vs this report's own findings. Parts one to
   five work them up and leave them open. Part six is the one place a position
   is taken, and it takes a position on the path, not on the contradictions.
8. **Chemistry-significant findings flagged for `domain-verifier`** (AGENTS.md
   #12) — flagged in the report, not dispatched from here.
9. **Both layers** (AGENTS.md #11). The plain layer must be enough to decide
   from alone: the nine habits in reef-keeping terms, what each path costs and
   risks, what is unknown, and the recommendation with what would make it
   wrong. No identifiers, no file paths, no camelCase, no test names.
10. **Checkpoint contract.** Six parts and nine habits is interruptible work.
    Write each part as it completes, update `.agent/run-state.md` at every part
    boundary, and ship a partial report saying exactly what did not run. **A
    partial report stops before part six** — a recommendation on incomplete
    evidence is worse than none, and the report says that is why it is absent.
11. **Finish the job** (AGENTS.md #13): branch `claude/<date>-engine-decision`,
    commit, push, open the PR with the what/why/risk body in both layers.
    **Never merge.**

---

## Report skeleton — `.agent/engine-decision.md`

1. **The question**, in a paragraph, and the note that parts one to five carry
   no opinion and part six recommends.
2. **What was read and measured**: commit, whether routine 18's report existed,
   commands run and their output.
3. **The four framing facts**: the tree's age and what it does and does not
   imply; canon §25 having answered this once, and what that means
   procedurally; canon and the journeys disagreeing with each other; the two
   golden files having diverged.
4. **Part one — the nine habits classified**, then the tally.
5. **Part two — blast radius**: functions, measured lines, the
   trend/cadence/messaging split, the sentence count, the habit × function
   matrix.
6. **Part three — the golden corpus**: field-level survival with its working,
   the §26 calibration, and the two named lists of what would replace it.
7. **Part four — the two paths**, four headings each, neither totalled.
8. **Part five — the hard-won inventory**, with simulated/observed labels, the
   re-earnable check, and the count stated plainly.
9. **Part six — the recommendation**, with "what would make this wrong".
10. **Open questions for Dan** — each answerable in one line.
11. **Appendix**: commands with output, any harness loop verbatim.
12. **In plain terms** — the whole report again in reef-keeping language, per
    AGENTS.md #11, keeping the same order: the evidence first, the
    recommendation last, and what would make it wrong.

---

## In plain terms

*Per AGENTS.md #11 — what this routine is, for the person whose tank it is.*

The part of the app that works out your alkalinity, calcium and magnesium is
three separate lumps of code doing mostly the same job. It has been decided
there should be one. The question is whether to tidy the three into one and keep
how they behave, or start again from the chemistry document and your four
write-ups of how you actually run the tank.

The report gathers the evidence first and gives you an answer at the end.

Five things it works out. First, and most important: nine habits you described
don't match what the app does. For each one — is the app simply **quiet** where
you have a habit, so adding it takes nothing away? Or does it do the
**opposite**, so adding your habit means removing what's there? A third answer
matters as much: some of your habits are things the chemistry document has
already ruled out on purpose, and the write-ups say so themselves. Those can't
be built either way until you change your mind about the document, so they
count for neither side.

Second, where the app does the opposite, how much of it is involved — the parts
that spot trends, decide when to test again, and write the sentences you read,
which is most of it? Or the edges? It also counts the sentences, because
changing what the app concludes mostly means rewriting what it says.

Third, there is a set of nearly six thousand recorded answers proving the app
still behaves as it did yesterday. Deliberately change the behaviour and most
of that stops being a check. The report works out how much survives, how much
would have to be recorded fresh, and what would be left watching for mistakes
meanwhile.

Fourth, both routes side by side with the awkward parts said out loud. Starting
again: the chemistry document and your write-ups have never been built into
anything and have never been tested against a real tank — careful, untried, and
silent in places where the app currently has rules. Tidying up: you'd carry
forward three lumps that have already drifted apart, one measurement compared
against the wrong kind of number, and phosphate and nitrate warnings that come
out wrong because they're judged by alkalinity's rules.

Fifth, some rules exist because something specific went wrong once — the app
talked itself into dosing again off a test taken before its last correction had
landed, and calcium climbed from 403 to 498 in testing before that was caught.
That knowledge isn't written down anywhere but the code. The report counts how
many such rules there are, and checks whether the same testing that found them
could simply find them again — because if it could, they're much cheaper to
lose than they sound.

**Then, last, it recommends one route.** Last on purpose: you should be able to
read the evidence and make up your own mind before you see anyone else's. The
recommendation has to point at specific findings rather than a general feeling,
and it has to include a section saying plainly what would make it wrong —
which finding, if it turned out the other way, would flip it. If the evidence
honestly doesn't favour either route, it has to say that instead of inventing a
preference, and then say what would settle it.

One argument it is not allowed to make. Everything here — the app, the old
version, all of its tests — was built in four days. There is no long history to
protect, and no case may rest on the work already done. If the recorded answers
are worth keeping it must be because of what they can still check tomorrow, not
because of what they cost to produce.
