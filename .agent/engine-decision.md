# The Engine Decision — evidence, then a recommendation

Run `2026-08-14-engine-decision`, routine `routines/19-engine-decision.md`.
Written at commit `02de5e9` (HEAD of `claude/busy-gates-xs4f5v`), whose
`src/`, `tests/` and `docs/` trees are **byte-identical to the routine's
baseline `480b086`** — `git diff --stat 480b086 HEAD -- src tests docs`
returns nothing; only `routines/` differs.

## 1. The question

Canon `docs/spec/reef-chemistry.md` §25 names one **Reef Chemistry Engine**:
one assessment step, every parameter through it, every surface a display of
its verdict. That is settled. How to get there is not, and there are two ways:
**consolidate in place** — `assessAlkalinity`, `assessCalcium`,
`assessMagnesium` and `doseStatus` merged into one engine, keeping their
current rules, extended to the parameters they do not cover — or **rebuild
from canon and the journeys**, treating the existing code as reference rather
than starting point.

**Parts one to five of this report are evidence and carry no opinion. Part six
is a recommendation.** The separation is deliberate: read the evidence, form
your own view, then read part six.

**One caveat governs the whole report.** Routine 18's replay report
(`.agent/real-history-replay.md`) does not exist — not locally, not on any
remote branch (§2 below shows the check). Every classification in part one is
therefore **static** — from the code, the journeys and canon — and every
replay-dependent cell (dated examples, frequency-on-real-data) is
`UNVERIFIED — routine 18 not run`. That is stated once here rather than in
every row. Part six says what this costs the recommendation.

## 2. What was read and measured

Commands run at `02de5e9` (full outputs in the appendix):

| What | Command | Result |
|---|---|---|
| Routine 18's report | `ls .agent/real-history-replay.md`; `git ls-tree -r --name-only origin/<branch> \| grep -c real-history-replay` over all 9 remote branches | absent locally; **0 matches on every remote branch** |
| Repo age | `git log --reverse --format='%h %ad %s' --date=short \| head -3` | first commit `0637695` **2026-08-13** |
| Legacy preservation | `legacy/README-LEGACY.md:1-6` | preserved **14 August 2026** |
| Legacy's own age | `legacy/docs/CHANGELOG.md` (15 lines) | **carries no dates** — `UNVERIFIED`, see §3 |
| Golden digests | `python3` json read of both files | `tests/legacy-port/golden.json` = `83780c1728b67ca6`, `legacy/tests/golden.json` = `37ded9064e91e80e`; both 5,940 rows, 30 fields |
| Engine size | `wc -l src/lib/dosing/*.js src/lib/findings.js src/lib/stability-engine.js` | dosing 3,380 across six files; `findings.js` 709; `stability-engine.js` 164; total 4,253 |
| Spec / journeys size | `wc -l` | `reef-chemistry.md` 1,508; `docs/journeys/*` 1,016 across six files (933 in the five journey files + 83 README) |
| Gate state | `npm run verify` (after `npm ci`) | **all blocking checks pass**; advisory `deadcode` and `csscheck` fail (tracked baseline) |
| Vitest state | `npm test` | **62 failed / 352 passed (414 tests), 30 failed / 29 passed of 59 files** — outside the gate by design (`scripts/verify/run.mjs:63-64`) |
| Duplication | `npm run verify:dupcheck`; `npm run verify:blockdup` | dupcheck: "no unexplained duplication (67 function pairs compared, 188 functions)" — note it carries an `ALLOWED` list, so explained duplication exists; blockdup: **9 duplicated blocks against a ceiling of 10** |
| Real-tank fixture | `python3` count of `fixtures/real-tank/dans-tank-backup-2026-08-12.json` | 336 readings |

The routine's own baseline figures were re-measured, not copied. Two moved:
the journeys total 933 lines across five files (routine said 833), and
blockdup reads 9 (run-state's last note said 10).

## 3. The four framing facts

**3.1 The tree is young, and AI-built throughout — `legacy/` and its test
suite included.** This repo's first commit is 2026-08-13. `legacy/` was
preserved here 14 August 2026 (`legacy/README-LEGACY.md:1-6`). Dan's figure is four days for the whole
project; the artefacts in this tree can confirm the two days of this repo's
own history but **cannot pin `legacy/`'s start date** — its git history is not
in this tree and `legacy/docs/CHANGELOG.md` is a 15-line table of notable
fixes carrying no dates, so the four-day figure for the whole project is
`UNVERIFIED — not datable from this tree`. Either way the consequence stands:
**there is no long history here, and no argument in this report rests on
one.** The corpus is examined in part three for what it can still check —
present utility — and nothing else.

**3.2 Canon has already answered this question once.** §25's subsection is
titled **"Not a rebuild"** (`docs/spec/reef-chemistry.md:1283-1290`):

> "`deriveTankState` (`src/App.jsx:67`), `assessAlkalinity`, `assessCalcium`,
> `assessMagnesium` and `doseStatus` already exist and are the best-tested
> code in the app — 5,940 pinned golden cases and three-year simulations
> behind them. **The engine is those consolidated and extended to the
> parameters they do not currently cover, not something new written from
> scratch.** A rewrite would put that corpus at risk to gain nothing this
> decision asks for."

Dan wrote that as spec owner on 14 August. Three consequences for this
report: testing that decision's reasoning, at his request, is the service
being asked for, not a challenge to canon. A recommendation to rebuild would
be a recommendation that **Dan reopen §25**, and the worked-up case would go
to `.agent/spec-challenges.md` — the report body never proposes a spec edit.
A recommendation to consolidate must separate §25's conclusion from its
reasoning, because §25's stated ground is the golden corpus, and part three
measures exactly what that corpus is worth to this change.

**3.3 Canon and the journeys are two sources, and they disagree.** "Rebuild
from canon and the journeys" reads as one starting point and is not. Canon §4
(`:148-164`) fixes cadence at 2 / 7 / 21 days and windows at 14 / 28 / 28,
and records the rejection:

> "**Decided 13 Aug: windows are flat, with no extension.** An earlier design
> stretched the window (alk 7→21, Ca/Mg 14→35) when readings were thin.
> Rejected: stretching means the app quietly changes its own arithmetic when
> data is sparse, producing a consumption figure the user cannot tell came
> from older, less relevant history. Refuse rather than reach."

The journeys know it. `journey-1-alkalinity.md:141` says outright *"The spec
has a flat 2-day alkalinity cadence"* before describing an adaptive one, and
`journey-2-calcium.md:213-214` warns *"Worth knowing before building an
adaptive-cadence feature that would try to stretch it."* **A habit canon
rejects cannot be built by either path** until Dan changes canon. Such habits
are classified `canon-blocked` below and are evidence for neither path.

**3.4 The two golden files have already diverged.** Measured:
`legacy/tests/golden.json` is `37ded9064e91e80e`; `tests/legacy-port/golden.json`
is `83780c1728b67ca6`. Both 5,940 rows, 30 fields. The port's fingerprint has
moved twice since preservation, both deliberately and audited (§24's 60 rows,
`37ded9064e91e80e → 372fcda432be5bcf`; §26's 172 rows,
`fbac65244f00ac9b → 83780c1728b67ca6`). **The legacy fingerprint is not a
check on today's code and is never cited as one below.**

---

## 4. Part one — the nine habits classified

The nine habits are routine 18's table
(`routines/18-real-history-replay.md:302-310`). Four verdicts: `addition`
(the engine has no rule; adopting adds a branch, removes nothing),
`replacement` (the engine has a rule that contradicts the habit),
`canon-blocked` (canon states a rule that contradicts the habit — buildable by
neither path without a spec decision), `already-does-it`.

The test applied to every row, per the routine: *feed the engine the case the
journey describes; does it stay silent, or say something incompatible?*
Silence is an addition. Anything else is a replacement — **a default is a
rule**. All dated-example cells are `UNVERIFIED — routine 18 not run` (§1)
and are omitted rather than invented.

### Habit 1 — adaptive cadence

**Journey**, `journey-1-alkalinity.md:19-26` (table: normal every 2 days; two
readings the same, stretch to 3; several holding, 4 then 5; around a change,
tighten) and `:140-144`:

> "The spec has a flat 2-day alkalinity cadence. Dan runs 2 days normally, 3
> when steady, 4–5 when confident, and tightens around a change. The app
> could suggest the interval based on how settled things are. Right now it
> says the same thing whatever the tank is doing."

**Engine rule**, verbatim. The steady-state cadence is fixed:
`src/lib/dosing/alkalinity.js:742` `out.nextCheck = "Keep testing on your
usual schedule.";` and `:940` `` out.nextCheck = `Hold the new dose for 48
hours, then test again. ...` ``; `src/lib/dosing/calcium.js:487` `"Measure
again at your next weekly test."`. `nextCheck` varies by *situation* (settle
windows, anomaly retests — 13 assignment sites in `alkalinity.js`, 9 in
`calcium.js`, 11 in `helpers.js`, `grep -c 'nextCheck ='`) but never
stretches with confidence: no branch anywhere emits "test in 3–5 days because
the tank has been steady."

**Canon**: §4 fixes test cadence 2 / 7 / 21 days; the flat-window rejection
(`:156-160`, quoted in §3.3) records "refuse rather than reach" as the
decided posture toward data-dependent stretching.

**Verdict: `canon-blocked`.** Canon states the cadence and records the
rejection of adaptivity's nearest cousin; the journey itself concedes the
conflict (`:141`). Note also that even absent canon this would be a
replacement, not an addition — the engine emits a fixed cadence, and a fixed
cadence contradicts an adaptive one.

### Habit 2 — stability outranks the target

**Journey**, `journey-1-alkalinity.md:127-131` and `:167-171`:

> "It's staying stable, it's just at the bottom of my band. But if it's
> stable, I'd make the call — even though it's at the bottom of my band, this
> is actually stable. I could change the dose again, but I'd be stuffing
> around too much, so I wouldn't change it."

> "The app assumes off-target means act. … There is no state for 'off
> target, but deliberately left alone.' This is the biggest philosophical gap
> between the app and its user."

**Engine rule**, verbatim. The engine *holds the dose* when stable
(`alkalinity.js:736-740`: `out.action = "hold"`) — but it re-offers a
correction on every stable out-of-band assessment, `alkalinity.js:775`:

> `` out.explanation += ` But it is holding at ...${def.unit}, which is ...
> ${above ? "above" : "below"} your range — a steady dose will keep it there
> indefinitely rather than bring it back.` ``

and `:784`: `` `Raising it back is a separate one-off correction of roughly
${...} mL spread over two or three days — not a permanent increase...` ``.
`proposeCorrection` (`helpers.js:379-384`) offers a correction whenever the
level is out of band and no staleness guard bites; `doseStatus`'s off-target
card (`state.js:480-486`) prints "steady but below your range … Raising it is
a separate correction". There is no acceptance state and no way to stop the
offer recurring except hiding notices.

**Canon**: §18 (`:888-891`) records the habit's principle — *"Universal rule
regardless of chosen targets: stability at a slightly sub-optimal number
beats movement toward an optimal one. If a value sits outside the user's
target but the series is stable, the app suggests reconsidering the target
before suggesting a correction."* No engine path suggests reconsidering the
target — the engine is further from canon here than the habit is. Worked up,
not resolved: engine vs §18 is its own contradiction, distinct from engine
vs habit.

**Verdict: `replacement`** — adopting the habit removes or gates the standing
correction offer and the off-target card's framing, and adds the acceptance
state §18 implies. Partial `already-does-it`: the dose itself is never chased
(action stays `hold`), which is half the habit.

### Habit 3 — a big move skips the confirming test

**Journey**, `journey-2-calcium.md:85-88` (490 one week, 450 the next):

> "I definitely would increase the dose. I wouldn't say, oh, I'll measure
> again."

and `:93`: "Small moves need confirming; big ones do not." The journey's own
calibration (`:220-221`): "40 clearly does, 20 clearly doesn't." The
journey's reading of the app (`:182-185`): *"The app's dose-gap trigger is a
percentage and does not care whether the movement arrived in one step or
four."*

**Engine rule**, verbatim. The engine does grade magnitude —
`calcium.js:136-139`:

> `const rate = a < CA_TREND.stable ? "stable" : a < CA_TREND.small ? "small"
> : a < CA_TREND.meaningful ? "meaningful" : "significant";`

(`CA_TREND` = 5 / 10 / 20 ppm/week, `calcium.js:27-31`) — and only the
`"small"` grade is gated behind confirmation (`calcium.js:539-545` and
`:560-566`, both conditions beginning `if (out.band === "small" ...)`).
Anything at or above 10 ppm/week that clears the other holds falls through to
the act block (`:589-599`). Traced on the journey's own cases: 490→450 in a
week (40 ppm/week, "significant") acts immediately — matching the habit; but
490→470 (20 ppm/week, also "significant" since `20 < 20` is false) **also
acts immediately**, where the journey leaves it as testing variation.

**Canon**: §7's four conditions require *"at least 3 readings"* and *"for
calcium and magnesium the slope exceeds three standard errors over at least
20 days"* before a dose change. The habit's act-on-two-readings contradicts
that bar; so, on this path, does the engine (the `trendConfirmed` /
`confirmedByFit` check, `alkalinity.js:393-399`, is consulted only inside the
`"small"` branches). That engine-vs-canon divergence is worked up here and
left open; it is chemistry-significant and flagged for `domain-verifier`.

**Verdict: `replacement`, partial.** The big-move half is `already-does-it` —
the engine acts immediately on large single moves. The small-move half is a
replacement: the engine's act threshold (~10 ppm/week) contradicts the
journey's wait-at-20, and adopting the habit re-gates existing behaviour.
What would settle the threshold is the journey's own open question 1
(`journey-2:220-222`), which is Dan's. Where the canon bar lands on both is a
spec decision.

### Habit 4 — noise is answered by a longer window

**Journey**, `journey-2-calcium.md:75-78`:

> "Even though it's bounced up and down over the last four or five weeks,
> it's gone from 490 to 460. Even though it's gone up and down, I'm looking
> at a wider window."

and §G (`:163-166`), which is a **method** change, not a width change:

> "I would basically just calculate from the lowest dose to where it
> currently is over that, and essentially average what I've kind of given
> in."

with the journey's own gloss (`:169-170`): *"The app has one method for both.
It fits a least-squares slope across the window regardless of shape."*

**Engine rule**, verbatim. `pickTrendWindow` (`calcium.js:156-178`) only ever
**narrows** — `return { rows: recent, narrowed: true, ... }` when the recent
fortnight is a third steeper; there is no widening branch. The fit is always
least-squares (`alkFit`, `alkalinity.js:153-170`), whatever the shape.
Windows are fixed horizons: `calcium.js:265` `const horizon = nowStamp - 28;`
`helpers.js:763` `const horizon = nowStamp - 35;`.

**Canon**: §4's recorded rejection of window extension (quoted §3.3) blocks
the widen-on-noise reading outright. The §G method reading contradicts §6,
whose derivation step 2 is *"Fit a slope"* — a different consumption method
is a change to canon's stated arithmetic and needs Dan (AGENTS.md #3).

**Verdict: `canon-blocked`** — on the widening reading by §4's explicit
rejection; the §G anchor-and-average reading is a replacement of
`alkFit`/`pickTrendWindow` that *also* requires a canon §6 decision first, so
neither path can build either reading today.

### Habit 5 — "it didn't move" is a finding

**Journey**, `journey-1-alkalinity.md:102-104`:

> "I know that's within test variation, but now that's two days of an
> increased dose. It hasn't actually moved. So at that point I would
> increase the dose further."

and `:159-162`: *"Currently `stalled` only applies to a correction plan. Dan
applies the same reasoning to an ordinary dose change: two readings after an
increase, no movement, increase again. That's a rule the app doesn't have."*

**Engine rule**, verbatim. For correction plans the engine has exactly this —
`helpers.js:316-319`:

> `const stalled = days >= 3 && measuredSince >= 1 && movedSoFar <
> (STABILITY_RULES[def.key] || {}).noiseFloor;`

For an *ordinary* dose change, flat readings after the change produce the
opposite verdict. The analysis window restarts at the change
(`alkalinity.js:501`, `windowStart`), so the prior decline is excluded; a
flat post-change series grades `stable`, `consumption == supplied`, and the
engine answers `alkalinity.js:741`:

> `` out.explanation = `Alkalinity is moving ... within normal test
> variation. Your current dose is matching consumption.` ``

`doseStatus` reads the same case as success — `state.js:311-315`, state
`"worked"`, `"${...} mL/day is holding ${label} steady inside your range."`
Its `"fell-short"` state (`state.js:330-333`) fires only when the level is
*still moving* and the engine still wants more — not on no-movement.

**Canon**: not in canon. §7's settle window says when a change may be judged,
not what an absent response means. Journey-4b's "no movement" matrix rows
(`journey-4b:100-101`) carry the rule but 4b is *"Draft for his review"*
(`:3`) and §25 lists its evidence rules as unanswered (`:1308-1311`).

**Verdict: `replacement`.** The engine's rule — flat after a change means the
dose is right — contradicts the habit — flat after an increase means the
increase was absorbed, act again. Partial `already-does-it` for correction
plans (`stalled`/`backwards`) and for the still-moving case (`fell-short`).

### Habit 6 — one reading is notice, two is a signal, three is a fact

**Journey**, `journey-1-alkalinity.md:176-178`:

> "the first move gets watched, the second gets considered, the third gets
> acted on. The app's evidence gates are about statistics; this is about
> patience."

Journey-4b's evidence rules (`:25-31`): three readings in one direction
clearing kit noise to establish movement — *"If my alkalinity was 9.0 and the
next reading was 9.3, that's only two readings. We can't really say it's
rising."* — and two readings, four conditions, to contradict a dose change
(`:39-50`).

**Engine rule**, verbatim. The gates are statistical and per-branch.
`trendConfirmed` (`alkalinity.js:393-399`): `readingCount >= 4 && ... >
out.slopeSE * 3 && spanDays >= 20`. `confirmedByFit` for alkalinity
(`:637-638`): `Math.abs(trend) > seSlope * 2.5 && spanDays >= 2`. Some
branches already speak the habit's language — the mild single-interval hold,
`alkalinity.js:812-818`: `"One more reading will confirm whether this is a
real trend."` Others act on evidence the ladder rejects: the big-move path
(`:640-642`, `bigMove` = one interval ≥ 0.3 dKH within 1.5 days) can reach
the act block on two readings; conversely `buildFindings`' movement notices
demand five readings and two-thirds directional agreement
(`findings.js:445-446` `rows.length < 5`, `directional` `:118-132`) — stricter
than "three is a fact". The engine is incompatible with the count ladder in
both directions, case by case.

**Canon**: §22 sets minimum evidence for a *consumption rate* only (3
readings, 6 days); §5 gives noise floors; §25 (`:1308-1311`) says 4b's
evidence-rule questions — how many readings, how far apart, how much movement
— *"are still Dan's."* Not in canon.

**Verdict: `replacement`.** A uniform count ladder would re-gate acting
branches (loosening some, tightening others) and rewrite the claims notices
may make. Partial `already-does-it` in the deferral branches that already say
"one more reading."

### Habit 7 — tolerance shrinks near the band edge

**Journey**, `journey-2-calcium.md:103-105`:

> "Even though it's just tipped over and it's only twenty away from my level,
> I would most likely decrease the dose. My threshold for making a dose
> change, because I'm so close to the upper end, is less."

**Engine rule**, verbatim — present in two engines of three.
`calcium.js:433-437`:

> `const nearLower = inRange && (posNow - def.min) < bandWidth * 0.12;`
> `const nearUpper = inRange && (def.max - posNow) < bandWidth * 0.12;`
> `out.nearEdge = (nearLower && headingDown) ? "lower" : (nearUpper &&
> headingUp) ? "upper" : null;`

Same construct for magnesium at `helpers.js:930-933`. `nearEdge` feeds
urgency (`calcium.js:592`), un-gates the small-move holds (`:539`, `:560`)
and is named in the explanation (`:632`). **Alkalinity has none** —
`grep -rn nearEdge src/lib/` returns sites in `calcium.js` and `helpers.js`
only; alkalinity's urgency test (`alkalinity.js:866-867`) reads band position
and trend, never edge proximity, so identical moves mid-band and near-edge
get identical alkalinity responses.

**Canon**: not in canon as a rule; §26 names "the 12%-of-band edge proximity"
as an existing untouched threshold (`:1402`). How near is "near" is the
journey's open question 2 (`journey-2:223-224`) — Dan's.

**Verdict: `already-does-it`** — on calcium and magnesium; on alkalinity the
uniform-tolerance default is a rule the habit contradicts, a replacement in
miniature. The split itself is a finding: the same habit implemented in two
engines and absent from the third is the consolidation argument appearing
inside the classification.

### Habit 8 — magnesium high: pause or cut hard, never fine-tune

**Journey**, `journey-3-magnesium.md:33-36`:

> "If it's still the same level or higher on my next test, I'd just pause
> dosing magnesium for that period, or decrease the dose a lot."

and `:126-127`: *"the honest options are stop dosing or halve it — not a
computed adjustment."*

**Engine rule**, verbatim. High-and-stable magnesium gets neither pause nor
hard cut — `helpers.js:1014-1015`:

> `` out.nextCheck = above ? `Let it drift down: hold this dose, or ease it
> back slightly, and let consumption and water changes bring magnesium toward
> the range. Magnesium moderately high is rarely urgent.` : ... ``

High-and-worsening magnesium reaches the act block and receives a **computed,
staged adjustment** — `helpers.js:1093-1095`: `if (mag <= 1) applied =
rawChange; else if (mag <= 3) applied = rawChange * 0.8; else applied =
urgent ? rawChange * 0.55 : rawChange * 0.45;` — exactly the fine-tuning the
habit says never to do. No path anywhere recommends pausing the dose.

**Canon**: §10 — the maintenance dose is *"never tuned from readings. Not
delayed — exempt"*, `DOSE_DRIFT_TRIGGER` has no magnesium key
(`helpers.js:488-499` implements this, verbatim in the habit's spirit), and
corrections come from a separate product. Canon supports "never fine-tune"
for the gap trigger; it is silent on recommending a pause, and the engine's
trend-following staged changes for magnesium sit in unresolved tension with
§10's exemption — worked up, left open, flagged for `domain-verifier`
(chemistry-significant: it changes what the app tells the user to dose).

**Verdict: `replacement`, partial.** The coarse response (pause / cut hard)
contradicts the engine's computed staged cuts and "ease it back slightly"
wording. Partial `already-does-it`: no gap trigger, no rescue path, high-side
treated as non-urgent, corrections routed to a separate product — the
asymmetry and the never-tune-from-gap halves already exist.

### Habit 9 — notices stack instead of replacing (a layer, not a rule)

**Journey**, `journey-4-notifications.md:74-76` (the calcium example):

> "And the original notice is still there, still saying consider changing the
> dose. It is not false — calcium is still increasing — but it is stale, and
> it contradicts the notice sitting next to it."

and `:92-94`: *"At any point in time I don't want multiple notifications
existing for the same thing, especially having conflicting information."*

Journey-4b is not a complaint but a **complete replacement design** — three
dimensions (position × movement × dose state), a full matrix of sentences,
its own evidence rules — and is marked *"Draft for his review"* (`:3`),
unaccepted.

**What it would replace**: `buildFindings` (`src/lib/findings.js:134-709`),
which emits one finding per fired rule with independent ids
(`"heading-out-"`, `"far-out-"`, `"kit-"`, …) that coexist about one
parameter; plus the claim layer's hiding rules — `narrative-engine.js:394`
`dismissible: !(f.severity === "act" && f.scope === "chemistry")` and the
dose claims built with no dismissible flag (`:439-492`); plus the
already-started identity machinery `findingKey` / `findingSignature` /
`findingHidden` (`src/components/DoseExpectation.jsx:134-153`).

**Canon**: the supersession model is **already canon** — `wizard-states.md`
§20, decided 14 Aug: one live notice per parameter, a new verdict supersedes,
hiding global, every notice hideable — and §20 names the two live behaviours
above as *"against canon rather than merely undecided."* What is **not**
canon: 4b's matrix cells, sentences and evidence rules (§25 `:1308-1311`).
Backlog items TW-026, TW-027, TW-028 already carry the work.

**Verdict: `replacement`** — of the findings layer's accumulation model; this
row is a layer, not a rule, and half of it is engine-vs-canon rather than
engine-vs-habit.

### The preferred range inside the band — checked before classifying

`journey-1:13-14` ("Band 8.5–9.5 dKH. **But the real target is 9.0–9.5**")
and `journey-2:193-197` need a concept checked against canon §2's three
layers before being called an addition. §2 Layer 2: *"The user sets a target
and a band width."* Canon therefore already distinguishes the aim (a target
point) from the tolerated band — partly the concept — but the engines read
only `def.min`/`def.max` and aim corrections at the band **midpoint**
(`(def.min + def.max) / 2`, e.g. `helpers.js:416`), not at a user target, and
no concept of a preferred *range* inside the band exists in code or canon.
Not one of the nine; noted because habits 2 and 3 lean on it, and because it
is Dan's journey-1 open question 1.

### The tally

| Verdict | Count | Habits |
|---|---|---|
| `addition` | **0** | — |
| `replacement` | **6** | 2, 3 (partial), 5, 6, 8 (partial), 9 (a layer) |
| `canon-blocked` | **2** | 1, 4 |
| `already-does-it` | **1** | 7 (on two engines of three) |
| `no occasion to tell` | **0** | — |

Sum: 9. Additions favour consolidating; contradictions favour rebuilding.

---

## 5. Part two — the blast radius of the contradictions

`replacement` rows only (habits 2, 3, 5, 6, 8, 9). The two `canon-blocked`
habits are excluded — they cannot be built by either path — which matters:
excluding them takes the trend-fitting arithmetic (`alkFit`,
`pickTrendWindow`) and the cadence figures out of the blast radius entirely.

**Functions whose behaviour would change.** Named from part one's rows;
sitting nearby did not count (`gainingHold`, `correctionProgress` and the
solvers are untouched by all six). Measured from their own boundaries
(`grep -n '^export function\|^function' <file>`, spans in the appendix), with
template-literal counts as the sentence measure (routine's instruction;
counted per function region, appendix shows the script):

| Function | Site | Lines | Template literals | Class |
|---|---|---|---|---|
| `assessAlkalinity` | `alkalinity.js:429-942` | 514 | 38 | trend gates + messaging + dose arithmetic |
| `assessCalcium` | `calcium.js:199-639` | 441 | 33 | trend gates + messaging + dose arithmetic |
| `assessMagnesium` | `helpers.js:700-1139` | 440 | 39 | trend gates + messaging + dose arithmetic |
| `doseStatus` | `state.js:44-517` | 474 | 74 | messaging |
| `buildFindings` | `findings.js:134-709` | 576 | 54 | messaging + trend detection (`directional`) |
| `proposeCorrection` | `helpers.js:379-463` | 85 | 5 | dose arithmetic + messaging |
| `trendConfirmed` | `alkalinity.js:393-399` | 7 | 0 | trend detection |
| `directionConsistent` | `alkalinity.js:247-254` | 8 | 0 | trend detection |
| `canLowerByDose` | `helpers.js:367-373` | 7 | 0 | dose arithmetic |
| dismissibility sites | `narrative-engine.js:394, 439-492` | ~40 of 1,348 | — | messaging (habit 9) |
| `findingKey`/`findingSignature`/`findingHidden` | `DoseExpectation.jsx:134-153` | 20 of 354 | — | plumbing (habit 9) |

Affected named-function lines: 2,552 of a measured denominator of 4,253
(`src/lib/dosing/` 3,380 + `findings.js` 709 + `stability-engine.js` 164;
`wc -l`), plus the partial reach into `narrative-engine.js` (1,348) and
`DoseExpectation.jsx` (354). Of `src/lib/analytics/*` (1,925 lines total),
the engines reach `safe-rate.js`, `time-in-range.js`, `time-of-day.js` and
`water-changes.js` as inputs; none of the six habits changes any of them.

**Where the damage lands.** Not at the edges. The three `assess*` functions
and `doseStatus` — trend gating, branch structure and the sentences — take
the bulk; `buildFindings` takes the layer replacement. What the six habits do
**not** touch, in any row: the §6 consumption derivation (`supplied`,
`consumption`, `maintenanceDose`), the §8 staging fractions and five
constraints (`applyDoseConstraints`, `rateLimitDose`, `bracketDose`,
`capDoseStep`), the solvers, and the §11 stability grading
(`computeStability` untouched). The damage is in the first three classes —
trend gating, cadence-adjacent wording, messaging — and those are most of
what a user sees; the dose arithmetic underneath is untouched by every one of
the six.

**The sentences.** 243 template literals across the affected functions (38 +
33 + 39 + 74 + 54 + 5 = 243), against roughly 90 lines of gating logic. A
behaviour change here is mostly a rewriting job: `explanation`, `reason` and
`nextCheck` are prose built from the numbers that changed, and `doseStatus`
adds `headline` and `detail` — 74 template literals in that one function.
Reporting this as "~2,550 lines" without the sentence count would understate
the work either path faces on wording; reporting only lines would overstate
how much *logic* moves.

**The overlap — habits down, functions across:**

| | assessAlk | assessCa | assessMg | doseStatus | buildFindings | proposeCorrection | narrative / DoseExp | trendConfirmed / directionConsistent | canLowerByDose |
|---|---|---|---|---|---|---|---|---|---|
| H2 stability-over-target | ● | ● | ● | ● | ○ | ● | | | |
| H3 big-move threshold | | ● | | ○ | | | | | |
| H5 no-movement | ● | ● | ● | ● | | | | | |
| H6 evidence ladder | ● | ● | ● | | ● | | | ● | |
| H8 magnesium coarse | | | ● | ● | | ● | | | ● |
| H9 notice layer | | | | ● | ● | | ● | | |

(● behaviour changes; ○ wording only.) **The matrix is concentrated, not
dispersed**: each of the three `assess*` functions is hit by three to four
habits, `doseStatus` by five, `buildFindings` by two to three. One rewrite of
the hold/offer/claim layer inside each function serves several habits at
once; the same is not true in reverse — no habit lives in a corner of its
own except habit 9's layer. This feeds part six directly.

**Honesty rule.** These are line and sentence counts, not an effort estimate.
They say nothing about how hard the lines are — the 7-line `trendConfirmed`
gates more behaviour than a hundred lines of wording — and nothing about the
tests that move with them, which is part three's subject.

---

## 6. Part three — what the golden corpus is worth to a rebuild

### Established first

- **The sweep is synthetic.** The grid at `tests/legacy-port/golden.js:56-81`
  is 3 params × 9 offsets × 11 slopes × 5 reading counts × dose
  present/absent × correction present/absent = **5,940** — arithmetic
  confirmed (3 × 9 × 11 × 5 × 2 × 2 = 5,940, matching the file's
  `count`). Real-tank data is `fixtures/real-tank/` — 336 readings, measured
  — and is **not** in this corpus.
- **Each row is 30 fields** (`golden.js:47-49` and `:103-137`): 14 assessment
  fields, 3 from `doseStatus` (`state`, `headline`, `detail`), 10 from
  `computeStability`, 3 correction offers. **Rows are the wrong unit** — a
  rebuild invalidates fields, and rows survive partially.
- **The corpus's stated purpose**, `golden.js:1-14`, verbatim:

  > "This exists to make the merge safe. Merging assessAlkalinity,
  > assessCalcium and assessMagnesium is worth doing — they share 68% of
  > their lines and every 'fixed in one place, not the others' bug this
  > project has had came from that — but it is 1,300 lines of the most
  > consequential code in the app, and the usual suites check properties
  > rather than exact output."

  The 68% figure and the bug attribution are evidence in part four. Note the
  corpus was built *for the consolidation*, by its own statement.
- **One coverage gap worth naming**: `buildFindings` is not fingerprinted at
  all — habit 9's entire layer sits outside the corpus. Whatever the corpus
  is worth, it is worth nothing to the notice-layer half of this decision.

### Field-by-field survival, measured

Non-empty counts per field across all 5,940 rows (command and full output in
the appendix; no engine run needed):

| # | Field | Non-empty | A rebuild adopting part one's replacements targets it? |
|---|---|---|---|
| 0 | `ok` | 5,940 | arguable (branch restructure flips it in edge cases) |
| 1 | `action` | 5,940 | **yes** (H2, H3, H5, H8) |
| 2 | `currentDose` | 5,940 | no — §6/§21 arithmetic |
| 3 | `recommendedDose` | 4,319 | **yes** (H3, H8 re-gate what is recommended when) |
| 4 | `maintenanceDose` | 5,940 | no — §6 arithmetic |
| 5 | `consumption` | 5,940 | no — §6 |
| 6 | `supplied` | 5,940 | no — §6 |
| 7 | `effectPerMl` | 5,940 | no — §6 |
| 8 | `trendPerDay` | 5,940 | no — habit 4 (the fit) is canon-blocked |
| 9 | `band` | 5,940 | arguable (H6 changes when a grade is *claimed*, not computed) |
| 10 | `consistent` | 4,752 | arguable (H6) |
| 11 | `explanation` | 4,319 | **yes** (all six) |
| 12 | `reason` | 1,621 | **yes** |
| 13 | `nextCheck` | 5,940 | **yes** |
| 14–16 | `state` / `headline` / `detail` | 5,940 each | **yes** (H2, H5, H8, H9) |
| 17–26 | 10 stability fields | 5,940 each | no — §11 untouched by all six |
| 27–29 | correction offers | 4,680 each | **yes** (H2, H8) |

**The two numbers the question asks for.** Fields that remain meaningful
checks after a rebuild that adopts the six replacements: **14 of 30**
(`currentDose`, `maintenanceDose`, `consumption`, `supplied`, `effectPerMl`,
`trendPerDay`, the 10 stability fields, counting `ok`/`band`/`consistent` as
arguable and excluding them). Fields needing re-recording: **13 certain**
(`action`, `recommendedDose`, `explanation`, `reason`, `nextCheck`, the three
`doseStatus` fields, the three offers) plus the 3 arguable.

**The row count that follows**, shown with its working: a row survives whole
only if every targeted field is empty in it. `action`, `nextCheck`, `state`,
`headline` and `detail` are non-empty in **all 5,940 rows** — so **0 rows
survive whole, and all 5,940 must be re-recorded**, while 14 of their 30
columns remain live checks throughout. The corpus does not die in a rebuild;
it degrades to its arithmetic and stability columns — which are precisely the
columns the habits do not dispute.

### The calibration point already in canon

§26 measured a real behaviour change against this exact sweep
(`reef-chemistry.md:1417-1442`): **172 of 5,940 rows changed** — 1 in 34 —
for **one** rule (position is the last reading), audited by element and by
direction (54 alkalinity `increase → hold`, 40 band-grade moves, 1 card
state, 41 dose-size moves, 0 rows moving a dose away from the band), digest
re-recorded `fbac65244f00ac9b → 83780c1728b67ca6` via `golden.js`'s
documented `UPDATE=1` (`golden.js:151-155`). Both readings, stated: the
corpus absorbs a targeted single-rule change well, and auditing those 172
rows by element and direction was itself a piece of work. Nine habits is not
one rule, and **172 × 9 is not a calculation** — the field-level count above
is how the exposure is actually known: every row moves on the messaging
columns under either path's adoption of the habits.

§26 also flags **39 further rows** for a change not yet made
(`:1455-1466`, the one-off correction still sized from the fitted value —
`.agent/needs-dan.md` open item 4). Pending work both paths inherit.

### What replaces it

Measured, not assumed. Current state (this run, after `npm ci`):

- `npm run verify`: **all blocking checks pass** — build, 14 static checks (2
  advisory: `deadcode`, `csscheck`, both failing as tracked baseline), and
  all 23 `tests/legacy-port/` suites (`popup` SKIP, unrunnable since Phase 3;
  `scripts/verify/run.mjs:26-84`).
- `npm test` (vitest), deliberately outside the gate (`run.mjs:63-64`): **62
  failed / 352 passed of 414 tests, across 30 failed / 29 passed of 59
  files**. The routine's Phase-5 figure (69/261) is stale; measured is what
  counts. The failing files are concentrated in `src/test/spec/`
  (classification, analytics conformance — e.g. `classifyReading` still does
  not exist, TW-002) and `tests/parity/`; per-test labelling as "pre-existing
  chemistry gap" was not re-verified test by test — `UNVERIFIED` at that
  granularity.

**The 23 suites, split.** Judged from what each printed in this run's passing
output (appendix) — checked, not assumed:

- **Behaviour-pinning — invalidated by deliberate change:** `golden` (5,940
  exact rows — the subject of this section); `protocols` (39 sourced
  protocol examples pinning expected verdicts — e.g. Mg §61 `hold`, Mg §56
  `decrease`; survives only where a habit does not flip a pinned verdict, and
  habits 3, 5 and 8 can); `hiding` (pins current hiding semantics, which
  habit 9 and canon §20 both change).
- **Property-checking — survives a deliberate behaviour change:**
  `invariants` (6,000 random assessments, properties such as consumption
  never negative), `husbandry` (19 best-practice rules against sources),
  `units`/`textcheck` (175 figures across 361 texts, plausibility),
  `malformed`/`robust`/`fuzz3` (crash-safety over hostile shapes),
  `sim/smoke`/`sim/years` (three-year simulations, properties — pass in this
  run, `sim/years` in 115 s), `matrix`/`surfaces-agree`/`crosstalk`/
  `summary`/`briefing`/`strips`/`shared`/`derivation` (surfaces agree with
  the engine and with each other — they assert agreement, not content, so
  they survive as long as surfaces echo), `verify_math`, `run_all`, `perf`.

**Those two lists are the answer to "what replaces it":** the property suites
and the 14 surviving golden columns keep watching during a rebuild; the exact
messaging pins do not.

- **The re-record option**, plainly: `UPDATE=1` against a new engine on day
  one pins the new behaviour from then on and **proves nothing whatever about
  the transition** — it converts the corpus from a check on the change into a
  check on what the change produced.
- **What neither corpus nor suite covers: real-tank behaviour.** The only
  real-tank check in the project is `fixtures/real-tank/` (336 readings) via
  routine 18 — a report, not an assertion — and that report does not exist.

---

## 7. Part four — the two paths, side by side

Four headings each. **No totals** — no hours, no story points, no sizes.

### The rebuild — from canon and the journeys

**What has to be written.** One engine replacing the ~2,550 affected lines of
part two plus the branch structure around them; 4b's notice layer; and — the
blocked start — the reasoning canon does not contain. Verified and printed,
per the routine:

- §14 is titled "Enforcement — the honest state" and records that the
  *previous* canon's claimed enforcement files did not exist. Today, much of
  §1–§24 **is** asserted: the 23 legacy-port suites pass, and §24 and §26
  carry "Enforced by" blocks naming real tests
  (`src/test/defects/negative-consumption.test.js` — 13 assertions;
  `position-is-last-reading.test.js` — 17 assertions). But §25's own
  "Enforced by" says outright (`reef-chemistry.md:1317`): *"nothing asserts
  any of this today"* — the engine decision itself is an intention until
  TW-028.
- The journeys have never been run against anything: routine 18, the only
  vehicle, produced no report. 4b is marked *"Draft for his review"* and
  unaccepted.
- `reef-chemistry.md` is 1,508 lines; the five journey files are 933
  (`wc -l`). Neither has executed.
- Phosphate, nitrate and salinity have no reasoning written at all
  (§25 `:1264-1281`) **and §25 forbids minting any** — *"a borrowed threshold
  is what this decision removes, not what it extends."* A rebuild "extended
  to the parameters they do not cover" cannot cover them either, until Dan
  writes their sections. Silence is a blocked start, not a blank slate.
- One thing a rebuild would *not* have to re-derive, found by part five's
  check and stated here because it cuts against the usual rebuild risk: canon
  §6, §8 and §9 already transcribe most of the engine's failure-earned rules,
  several verbatim with the observation attached (the stale-reading guard
  with its 403→498 trace is canon §9; the recomputed return dose is §9; the
  45-day bracket memory with its 36-run calibration is §8.3; the water-change
  decision with its reasoning is §6). Canon is *not* silent exactly where the
  engine is cleverest — part five counts what remains uncanonical.

**What has to be re-recorded or re-tested.** All 5,940 golden rows (0 survive
whole — part three), with 14 of 30 columns continuing as live checks; the
three behaviour-pinning suites (`golden`, parts of `protocols`, `hiding`);
the property suites carry over. Vitest's 62 red tests do not move either way
until the spec gaps they encode are built.

**What Dan must decide before work can start.** The two canon-blocked habits
(1 and 4 — cadence and windows/method, §4 and §6); the thresholds inside the
six replacements (habit 3's line between 20 and 40; habit 2's acceptance
state; habit 6's ladder vs statistics); 4b's open questions 2–5
(§25 `:1308-1311`); §25's own "not settled here" list (phosphate / nitrate /
salinity reasoning, ICP); §13's open items (13.1 Component 3+ strength, 13.2
push layer); and the open questions at the foot of each journey — **22 in
all** (journey-1: 4, journey-2: 4, journey-3: 4, journey-4: 5, 4b: 5).

**What is unknown.** Whether the habits' count-based evidence rules would
have out-performed the engine's statistical gates on the real tank — routine
18 is the instrument and has not run. Whether the journeys describe current
practice or dropped habits (the README's fourth cause). How often each
contradiction actually bites on real data — frequency is a replay question.
All named as unknown and left unknown.

**Risks, each stated as a risk.** A rebuild from canon starts by finding
canon silent where part five's residue lives (the un-canonical rules — the
`measuredSince` guard, the anomaly-range guard, the window-choice conditions)
and either re-earns them by failing the same way or copies them across — and
copying them across is consolidation under another name for those rules; a
rebuild would in practice be doing the second, given the simulator that found
them is still in the tree. The only real-tank evidence in the project is 336
readings — a check, not a suite, and it cannot validate a new engine. And a
rebuild recommendation is, procedurally, a request that Dan reopen §25
(§3.2) — a spec decision precedes any code.

### Consolidating in place — what carrying the structure costs

Measured with the repo's own tools, not asserted:

- **Duplication, measured beside the claim.** `golden.js:4-6` claims the
  three engines *"share 68% of their lines"* and attributes every "fixed in
  one place, not the others" bug to that. Measured today:
  `npm run verify:dupcheck` → "no unexplained duplication (67 function pairs
  compared, 188 functions)" — with an `ALLOWED` list, so known duplication is
  explained rather than absent; `npm run verify:blockdup` → **9 duplicated
  blocks against a ceiling of 10**. The 68% figure predates the extraction of
  the shared helpers (`applyDoseConstraints`, `rateLimitDose`,
  `trendConfirmed`, `noteCurrentAndInterventions`, `gainingHold`,
  `outOfBandWorsening` — all shared now) and no repo tool emits a share
  percentage, so 68% as a *current* figure is `UNVERIFIED`; the structure it
  described is demonstrably reduced but not gone.
- **Divergence the structure has already produced**, in the code today:
  `nearEdge` in two engines of three (part one, habit 7); the
  three-times-identical block whose own comment
  (`alkalinity.js:407-413`) records *"Written three times, identically — and
  I wrote the second and third copies myself, an hour after arguing that
  copying is how these engines drift apart. blockdup did not object because
  it abandoned any eight-line window containing a comment, and this block is
  well commented: the documentation was hiding the duplication it
  described"*; and §26's flagged dimensional bug — `caClearlyOut` /
  `clearlyOut` compare a ppm **distance** against `CA_TREND.stable` (5
  ppm/**week**) and `MG_TREND.stable` (10 ppm/**week**), rate constants
  (`reef-chemistry.md:1468-1471`, `.agent/needs-dan.md` open item 5,
  `calcium.js:477-478`, `helpers.js:968-969`).
- **Phosphate and nitrate on borrowed alkalinity reasoning** — §25 calls it a
  defect, not a display problem (`:1247-1257`, TW-029). Consolidation
  inherits the defect attached to live code; the rebuild inherits the same
  defect as a hole it may not fill without Dan's thresholds.
- **The mixed clock — confirmed still present.** `assess*` accepts `now`, but
  `applyDoseConstraints` reads `todayStr()` directly
  (`alkalinity.js:274-275`), and `correctionProgress` and `pendingCorrection`
  are called with `todayStr()` inside all three engines (`alkalinity.js:481,
  486`, `calcium.js:234, 239`, `helpers.js:735, 740`); `doseStatus` defaults
  to it (`state.js:73, 154`). The engine cannot be evaluated at a past date
  through its public interface — the same fault that constrains routine 18's
  harness (`routines/18-real-history-replay.md:189-209`). Both paths must
  fix it to be replay-testable; consolidation carries it as a live defect.
- **Open items already filed against these engines, counted.**
  `.agent/backlog.md`: 29 open items in all; those attached to the dosing
  engines and notice layer include TW-003, TW-004, TW-005, TW-006, TW-008,
  TW-012, TW-014, TW-018, TW-025, TW-026, TW-027, TW-028, TW-029, TW-030,
  TW-031 — **15**. `.agent/needs-dan.md`: **2** open items (4: one-off
  correction sized from the fitted value, 39 golden rows; 5: the dimensional
  comparison above). Both paths inherit the problems; only consolidation
  inherits the code they attach to.

**One structural fact, reported and not developed** (the routine's
escape-hatch clause): part two's matrix shows the six contradictions land in
branch gating, offers and sentences — the hold/offer/claim layer — while the
§6/§8 consumption-and-staging arithmetic and §11 grading are untouched by
every one of them. The two paths as posed are therefore not symmetric about
the arithmetic: both keep it; they differ over the layer above it. Reported
as a fact; part six recommends between the two paths as asked.

---

## 8. Part five — the genuinely hard-won

**Definition, applied strictly:** a rule that exists because a **specific
failure was observed**, and that **neither canon nor the journeys record**.
Not a rule that is merely subtle, clever or well-commented.

Swept, not recalled: `grep -rn -iE 'seed [0-9]|simulated|three-year|36
three|% of plans|overshot to|drove (calcium|alkalinity)|ran to zero|measured
across' src/lib/dosing/ src/lib/analytics/ src/lib/findings.js
src/lib/stability-engine.js src/lib/narrative-engine.js` (12 sites), plus
the routine's verified seed table, plus the rules encountered in the full
read of the five engine files. Each candidate then checked against canon and
the journeys by section. **Labels:** `sim` = found in simulation against a
model of a reef (real evidence of a bug class, **not** observed harm to a
live tank); `real` = derived from Dan's actual exported data; `meas` =
measured on the codebase itself.

### Checked and found already recorded in canon — not knowledge at risk

| Rule | Site | Where canon records it |
|---|---|---|
| Stale-reading guard (corrections never proposed on a reading older than the last intervention; `sim`: *"this drove calcium 403→498"*, *"Seed 4 … day 1044 start at a reading of 399 … while the true level had reached 447"*) | `helpers.js:385-415` | **§9 Rules, verbatim including the 403→498 trace** |
| Passing the target stops the dose (`sim`: *"calcium … kept climbing to 702 ppm … alkalinity ran to zero"*) | `helpers.js:321-328` | **§9** — "`passed` … computed independently of `arrived` … `correction-done` fires on either", with file:line |
| `dueNow` — estimate spent, unconfirmed (`sim`: *"calcium overshot to 515 ppm"*) | `helpers.js:337-343` | **§9** — plans expire on the calendar; `correction-due` |
| `freshReturn` — return dose recomputed (`sim`: *"a dose 38% short, and the level falls straight out again"*) | `helpers.js:345-356` | **§9** — "The return dose is recomputed, not replayed" |
| `BRACKET_MEMORY_DAYS = 45` (`sim`: *"Measured across 36 three-year runs: mean dose error 14% at 21 days, 10% at 35, 8% at 45"*) | `helpers.js:62-85` | **§8.3, with the same 36-run calibration quoted** |
| Water changes stay in the trend fit (`sim`: *"answered 'hold' on tanks that were visibly draining"*) | `alkalinity.js:505-511` | **§6, the code comment quoted into canon verbatim** |
| Alkalinity rescue path (`sim`: *"tanks crashing while the engine politely applied 70% at a time"*) | `alkalinity.js:870-876` | **§8.1** |
| Magnesium no-rescue / 72 mL (`sim`) | `helpers.js:1088-1092` | **§8.1, §10** |
| Step cap 25% (`sim`: *"25% gave the lowest error, 15% converged too slowly"*) | `helpers.js:33-49` | **§8.4** (the sourced 10–30%; the simulation calibration itself is only in the code) |
| §11 grading fix (`sim`: three-year 6.87 dKH crash under "hold") | `alkBandOf` and kin | **§11, with the trace** |
| Negative-consumption hold (`sim` + sweep counts) | `gainingHold`, `helpers.js:540-566` | **§24, in full** |

**This is a finding in its own right: canon was written by transcribing the
engine.** Eleven of the failure-earned rules checked, including five of the
routine's eight verified seeds, are in canon §6–§11 or §24 — several with
the code's own comment quoted verbatim. The two documents are not
independent sources on these rules.

### Not in canon, not in the journeys — the inventory at risk

| # | Rule | Site | The observation, quoted | Label |
|---|---|---|---|---|
| 1 | `measuredSince >= 1` — a plan is only "stalled" if something was measured after it started | `helpers.js:302-319` | *"48% of plans over three years were killed as stalled having never had a chance to work, and each replacement started from a worse level."* | sim |
| 2 | Anomaly series-range guard — a value the series already produced cannot be out of character | `alkalinity.js:225-235` | *"Readings of 1520, 1560, 1560, 1560, 1520 were being flagged because a line through the first four slopes upward … the final 1520 then looked 62 adrift, despite being identical to a reading in the same set."* | sim |
| 3 | Anomaly floor in the parameter's own units | `alkalinity.js:208-213`, `magnesium.js:9-12` | *"a threshold of 0.45 is meaningful for dKH and meaningless for ppm"* — one of *"the two faults that only appeared under simulation"* | sim |
| 4 | `directionConsistent`'s sub-resolution filter | `alkalinity.js:240-246` | *"readings of 9.2, 9.3, 9.0, 8.7 give intervals of +0.1, −0.3, −0.3, and calling that 'scattered' because of a 0.1 step means a clear decline gets damped down to 're-test'"* | meas |
| 5 | `pickTrendWindow`'s two joint conditions (steeper by a third AND meaningful on its own) | `calcium.js:166-177` | *"a flat series with one noisy last reading narrows to a 'trend' that is pure test error, which is how this started recommending dose cuts on a stable tank"* | sim |
| 6 | Bracket-floor coherence at 3×, not the bracket's 25% | `alkalinity.js:284-312` | *"At 25% the floor was being discarded on ordinary noise and the dose dropped to 7.7 anyway."* | sim |
| 7 | `canLowerByDose`'s 45-day feasibility line | `helpers.js:367-373` | *"nine months to shift 70 ppm"* (§9 records lowering-limited-by-consumption; the 45-day threshold is only here) | meas |
| 8 | Dose-change "old news" retirement by time alone | `state.js:98-113` | *"On six months of Dan's actual alkalinity it almost never fired … 75-89% of readings carried a paragraph about it … A message that appears four readings in five is wallpaper."* | **real** |
| 9 | The stamp cache (`WeakMap`) and the `doseObservations` cursor walk | `alkalinity.js:39-47`, `helpers.js:95-104` | *"it came to half the entire derivation"*; *"A decade of history took 333 ms to derive, on every render … ten times the data cost thirty-six times the time."* | meas (performance) |
| 10 | The golden harness's pinned `now` | `golden.js:22-34` | *"was not reproducible, and the failure only showed when a run happened to straddle 20:00."* | meas (harness) |
| 11 | The sweep's slope and count grids | `golden.js:60-79` | *"moving those thresholds changed nothing in 3,564 cases and this sweep reported no change at all."* (three separate records of a blind sweep) | meas (harness) |

**Simulated vs observed, kept distinct.** Ten of the eleven rest on
simulation or on measuring the codebase; **exactly one — #8 — rests on real
tank data** (Dan's six months of alkalinity readings), and none records harm
to a live tank.

**Is the evidence re-earnable? Checked.** The simulator that produced the
`sim` rows is in the tree — `tests/legacy-port/sim/` (`longrun.js`,
`rng.js`, `years.js`, `smoke.js`, `surfaces.js`) — gated as `sim/smoke` and
`sim/years` (`run.mjs:81`), and **both ran and passed in this run**
(`sim/years` in 115 s). A rule found by a three-year simulation can in
principle be re-found by running the same simulation against a new engine —
which makes rows 1, 2, 3, 5 and 6 far cheaper to re-earn than "hard-won"
implies, **and that cuts against the hard-won argument**. What the simulator
cannot re-find: row 8 (it took Dan's real export) and the two harness rows,
which are properties of the test rig rather than of any engine.

**The count is the finding: eleven rules survive the strict definition, of
which eight are engine behaviour, one is real-data-derived, and two belong
to the harness.** A rebuild that lost them would be re-finding most of them
with tooling the tree already carries; the one real-data rule and the two
harness rules it would have to carry across by hand.

---

## 9. Part six — the recommendation

**Consolidate.** Written after parts one to five, none of which was revised
to fit it.

The case, traced to the findings: part one found **zero additions and zero
pure inversions of the arithmetic** — six replacements, but part two's matrix
shows all six land in the hold/offer/claim layer (branch gates, offers,
sentences: ~2,550 lines, 243 template literals) while the §6/§8 consumption
and staging arithmetic and §11 grading are untouched by every one of them.
The two canon-blocked habits (1, 4) remove the trend-fit and cadence from
the argument entirely. So the thing a rebuild would rebuild — the arithmetic
— is the thing no habit disputes, and the thing the habits do dispute has to
be rewritten under **either** path. Part four adds that the rebuild cannot
start where it claims to: phosphate, nitrate and salinity reasoning may not
be minted (§25), habits 1 and 4 are blocked, and the six thresholds are
among 22 open questions only Dan can answer — the same questions
consolidation needs, with a reopened §25 on top. Part five found the
un-canonical hard-won inventory is eleven rules, one of them real-data
derived, most re-earnable from the gated simulator — small enough that it
decides nothing on its own, in either direction.

**On §25's reasoning versus its conclusion.** This agrees with §25's
conclusion but only partly with its stated ground. §25 rests on the corpus —
"5,940 pinned golden cases … a rewrite would put that corpus at risk." Part
three measured that ground as weaker than it reads: adopting the habits
moves every one of the 5,940 rows on the messaging columns under either
path, 0 rows survive whole, and the corpus's protection is against
*accidental* change — the habits demand *deliberate* change, which the
corpus cannot arbitrate (re-recording via `UPDATE=1` proves nothing about
the transition). What actually survives to keep watch — 14 arithmetic and
stability columns plus the property suites — survives equally under both
paths. The stronger ground for §25's conclusion is part two's shape
(contradictions confined to a layer both paths must rewrite) and part four's
blocked start, not corpus preservation. Same conclusion, partly different
reasons — stated as such.

**What would make this wrong.** Concrete and checkable:

- **The finding I would most want to be wrong about: part one/part two's
  claim that no habit touches the dose arithmetic.** It is the load-bearing
  premise, and it is static. If routine 18's replay, once run, shows habits
  diverging on `recommendedDose` / `maintenanceDose` *figures* on Dan's real
  data — millilitres he would not have poured, not sentences he would not
  have written — the separable-layer premise collapses and the rebuild case
  reopens. The test that settles it: run routine 18; count `differs` habits
  whose divergence includes a dose figure. More than two, and this
  recommendation should be re-argued from that table.
- If Dan reopens §4 and adopts adaptive cadence and shape-dependent
  consumption methods (habits 1 and 4), the canon-blocked rows convert to
  replacements inside the trend/cadence core — the blast radius then reaches
  the arithmetic, and the tally that favoured consolidating flips.
- If part one's habit-3/habit-6 verdicts are wrong in the other direction —
  if Dan confirms the engine's statistical gates already match his practice
  and the count ladder is a description, not a requirement — the replacement
  count drops toward two and the consolidation case gets *stronger*; that
  error would not flip the recommendation.
- If consolidation in practice reproduces the drift pattern (blockdup
  breaching its ceiling of 10, another fixed-in-one-place bug), that is
  evidence the structure cannot be carried safely — but §25 already mandates
  one engine, and consolidation *is* the de-duplication, so this failure
  mode argues for finishing it, not for starting over.

**Static-only caveat, as promised in §1:** this recommendation rests on
reading code, canon and journeys, with no replay of real data behind the
classification. It weakens the *confidence*, not the direction: every
verdict in part one is checkable against quoted code, but the frequency and
real-money severity of each contradiction is unmeasured until routine 18
runs. Running it is the single cheapest way to test this report.

No spec challenge is filed: the recommendation is to keep §25 as written,
so there is no case for `.agent/spec-challenges.md` to carry.

---

## 10. Open questions for Dan — each answerable in one line

1. Run routine 18 before acting on this report, or accept the static
   classification? (It is the one measurement that could flip part six.)
2. Habit 3: where is the act-immediately line for a single-week calcium move
   — 20, 30, 40 ppm, or a fraction of the band?
3. Habit 2: should "off target, stable, deliberately left alone" be a state
   the app can hold, silencing the standing correction offer?
4. Habits 1 and 4 are canon-blocked (§4, §6). Leave them blocked, or reopen
   those sections? (Leaving them blocked costs nothing now; both paths skip
   them.)
5. Habit 6: is the one/two/three ladder a requirement for the engine, or a
   description of your own patience the statistical gates may approximate?
6. Habit 8: when magnesium drifts high, should the app offer "pause the
   dose" as a first-class action? (It currently never recommends pausing.)
7. 4b is still marked draft: accept its evidence rules (its open questions
   2–5) so the notice layer can be specced, or hold?
8. The calcium act path changes doses at ≥10 ppm/week without §7's
   three-standard-error confirmation — engine and canon disagree; which is
   right? (Flagged for domain-verifier; chemistry-significant.)

## 11. Appendix — commands and outputs

All run at `02de5e9`, 2026-08-14, in this session.

```
$ git log --reverse --format='%h %ad %s' --date=short | head -3
0637695 2026-08-13 Tank Wizard converted to Vite project
511a57e 2026-08-13 Add agent system
f4bbbbe 2026-08-13 Inventory report

$ ls -la .agent/real-history-replay.md
ls: cannot access '.agent/real-history-replay.md': No such file or directory
$ for b in $(git ls-remote --heads origin | awk '{print $2}' | sed 's|refs/heads/||'); do
    printf '%s: ' "$b"; git ls-tree -r --name-only origin/"$b" | grep -c real-history-replay; done
claude/2026-08-13-consistency-sweep: 0   claude/dazzling-faraday-9zbsv7: 0
claude/durability-keys-to-idb: 0         claude/friendly-keller-y5zoqc: 0
claude/hopeful-bohr-yc58vu: 0            claude/serene-cori-yg3b9q: 0
claude/stoic-carson-i9416q: 0            main: 0
master: 0

$ python3 -c "
import json
for p in ['tests/legacy-port/golden.json','legacy/tests/golden.json']:
    d=json.load(open(p)); print(p, d['digest'], d['count'], len(d['rows'][0].split('|')[6].split('~')), 'fields')"
tests/legacy-port/golden.json 83780c1728b67ca6 5940 30 fields
legacy/tests/golden.json 37ded9064e91e80e 5940 30 fields

$ python3 -c "
import json
d=json.load(open('tests/legacy-port/golden.json'))
full=[0]*30
for r in d['rows']:
    p=r.split('|',6)[6].split('~')
    for i in range(min(30,len(p))):
        if p[i]!='': full[i]+=1
print(full)"
[5940, 5940, 5940, 4319, 5940, 5940, 5940, 5940, 5940, 5940, 4752, 4319,
 1621, 5940, 5940, 5940, 5940, 5940, 5940, 5940, 5940, 5940, 5940, 5940,
 5940, 5940, 5940, 4680, 4680, 4680]

$ wc -l src/lib/dosing/*.js src/lib/findings.js src/lib/stability-engine.js
   942 alkalinity.js   639 calcium.js   88 corrected-strength.js
  1139 helpers.js       55 magnesium.js 517 state.js
   709 findings.js     164 stability-engine.js   4253 total

$ wc -l docs/spec/reef-chemistry.md docs/journeys/*
  1508 reef-chemistry.md; journeys: 83 README + 197 + 228 + 168 + 177 + 163
  = 933 across the five journey files (1016 with README)

$ npm ci && npm run verify        # fresh container needs npm ci first
ALL BLOCKING CHECKS PASSED (advisory findings above, if any, are tracked in
the backlog)   [deadcode: fail (advisory), csscheck: fail (advisory);
23 legacy-port suites pass; popup SKIP; sim/years 115261ms]

$ npm test
Test Files  30 failed | 29 passed (59)
     Tests  62 failed | 352 passed (414)

$ npm run verify:dupcheck
OK   no unexplained duplication (67 function pairs compared, 188 functions)
$ npm run verify:blockdup
OK   duplicated blocks within/across functions: 9 (ceiling 10)

$ grep -rn nearEdge src/lib/ | grep -v '\*'
calcium.js:436,539,560,583,592,632; helpers.js:932,1031,1073,1081
(no alkalinity.js sites)

$ grep -c 'nextCheck =' src/lib/dosing/{alkalinity,calcium,helpers}.js
13 / 9 / 11

$ python3 - <<'EOF'    # line and sentence counts per affected function
ranges = { 'src/lib/dosing/alkalinity.js': {'assessAlkalinity': (429,942), ...},
  ... (spans from grep -n '^export function' per file) }
for f, fns in ranges.items():
    lines = open(f).read().split('\n')
    for name,(a,b) in fns.items():
        seg = '\n'.join(lines[a-1:b])
        print(f, name, b-a+1, 'lines,', seg.count('`')//2, 'template-literals')
EOF
assessAlkalinity 514/38 · assessCalcium 441/33 · assessMagnesium 440/39 ·
doseStatus 474/74 · buildFindings 576/54 · proposeCorrection 85/5 ·
trendConfirmed 7/0 · directionConsistent 8/0 · canLowerByDose 7/0 ·
pickTrendWindow 23/0 · correctionProgress 116/2 · gainingHold 58/20

$ grep -rn -iE 'seed [0-9]|simulated|three-year|36 three|% of plans|overshot
  to|drove (calcium|alkalinity)|ran to zero|measured across' src/lib/...
12 sites (part five's sweep; quoted there)

$ python3 -c "import json; d=json.load(open('fixtures/real-tank/dans-tank-backup-2026-08-12.json'))['data']; print(len(d['readings']))"
336

$ git diff --stat 480b086 HEAD -- src tests docs
(empty — byte-identical)
```

No harness was written this run: every part-one verdict traces to quoted
code, and no engine execution was needed beyond the repo's own gated suites.

## 12. In plain terms

*Per AGENTS.md #11 — the whole report again, in reef-keeping language, same
order: evidence first, recommendation last.*

The part of the app that judges your alkalinity, calcium and magnesium is
three separate lumps of code doing mostly the same job, and it has been
decided there should be one. The question here: tidy the three into one and
keep how they behave, or start again from the chemistry document and your
four write-ups of how you actually run the tank.

**One thing to know up front:** the earlier exercise that was supposed to
walk your real six months of test results through the app never produced its
report. So everything here comes from reading the code and the documents
carefully — it is checkable, but nothing in it has been confirmed against
your actual data yet. Running that replay is the cheapest way to test this
report, and it is the first question at the end.

**The nine habits.** For each habit you described, we asked: is the app
simply quiet there, or does it do the opposite? The answer surprised us in
one direction: **the app is never simply quiet.** Not one of the nine is a
pure add-a-feature. Two of them — testing less often when things are steady,
and answering a noisy patch by looking at a longer stretch — are things the
chemistry document has already ruled out on purpose, and your own write-ups
say so; those can't be built either way until you change the document, so
they count for neither side. One — being warier of small moves near the edge
of your range — the app already does, for calcium and magnesium but not
alkalinity, which is itself a small picture of why the three lumps need to
become one. The other six are places the app actively does something
different from you: it keeps offering a correction for a level you'd
deliberately leave alone; it changes the calcium dose on a one-week move
you'd call testing variation; it reads "the level didn't move after I raised
the dose" as success where you read it as the tank asking for more; its
patience is statistical where yours counts readings; it fine-tunes high
magnesium where you'd pause or cut hard; and its notices pile up where you
want one per topic that replaces itself.

**Where the damage lands.** Adopting those six habits means rewriting the
part of the app that decides *when to speak and what to say* — the gates,
the offers, and around two hundred and forty sentences. It does **not**
touch the arithmetic that works out what your tank consumes and what to
pour. Every one of the six lands in the talking layer; none lands in the
sums. And the same few functions get hit again and again, so one careful
rewrite serves several habits at once.

**The six thousand recorded answers.** They record thirty facts per test
tank. If the app's behaviour changes on purpose, the recorded sentences and
verdicts stop being a check — every one of the 5,940 tanks would need
re-recording. But fourteen of the thirty facts per tank are the consumption
and stability arithmetic, which no habit disputes, and those keep checking
either way — as do the property tests (things like "never recommend more
than corals tolerate"), which don't care about exact wording. So the
recorded answers are neither as protective as the document assumes nor
worthless: they protect against *accidental* change, and what you're
considering is *deliberate* change.

**The two routes side by side.** Starting again sounds cleaner but hits
three walls immediately: the two blocked habits can't be built without your
say-so; the phosphate and nitrate rules the new engine is supposed to gain
don't exist and the document forbids inventing them; and the six habits'
thresholds are questions only you can answer — twenty-two open questions
across the documents. Meanwhile, most of the lessons the current code
learned the hard way — don't re-correct off a stale test, recompute the
return dose, stop pushing once the target is passed — are already written
into the chemistry document, often word for word, so a rebuild "from the
document" would largely rebuild the same engine. Tidying up carries real
warts: two known bugs on file, phosphate judged by alkalinity's rules,
one measurement compared against the wrong kind of number, and a clock
problem that stops the engine being tested against past dates. Eleven
hard-learned rules live only in the code — but the simulator that found most
of them is still here and still runs, so losing them would mostly mean
re-finding them cheaply.

**The recommendation: tidy the three into one — consolidate.** Not because
of anything already spent, but because the evidence says the fight is in the
talking layer, which both routes must rewrite anyway, and the arithmetic
underneath — the only part a rebuild would actually replace — is the part
nobody, including you, has complained about. The chemistry document reached
the same conclusion for a partly different reason (protecting the recorded
answers); this report agrees with the conclusion and says the protection
argument is weaker than it reads.

**What would make this wrong:** it all rests on "no habit touches the
arithmetic." That was judged by reading, not by replaying your data. If the
replay, once run, shows the app would have told you to pour *different
millilitres* than you did — not just said different sentences — then the
premise fails and the start-again case deserves a fresh hearing. That replay
is the one measurement to ask for before committing.
