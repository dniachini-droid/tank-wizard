# The Engine Plan

Written 16 August 2026, from `.agent/engine-inventory.md`.

This is the plan for `reef-chemistry.md` §25 — one engine assessing every
parameter, every surface rendering its verdict.

**It contains a real fork.** Stages 1 and 2 are worth doing whichever way the
project goes. Stage 3 is the decision point, and it is left open deliberately.

---

# What the inventory actually found

Worth stating plainly before planning around it.

**16 position classifiers**, not the 10 or 13 previously believed. **~76
decision sites** under a per-call-site rule; the old figure of 48 was never an
enumerated list and cannot be checked. **Three kit-noise tables**, all live, all
consulted in a single pass by `buildFindings`. **Four different thresholds** for
"is this alkalinity trend actionable", ranging from 0.5 to 0.7 dKH/week.

Two facts that should shape the mood.

**The population grew during a week of consolidation work.** `positionBand` was
added on 15 August by the §22 work — the most spec-shaped classifier in the
codebase, consumed by exactly one caller.

**And a safety rule in canon has never existed in code.** The magnesium gate —
§5 and §20, below alert-low magnesium the app does not advise on alkalinity or
calcium — is implemented nowhere. Red spec tests pin it. Nothing satisfies them.

---

# STAGE 1 — Delete what is already dead

**Free. No behaviour changes. Do this whatever else is decided.**

Roughly 500 lines of code that execute on every derivation and reach no screen.

| What | Where | Size |
|---|---|---|
| `buildOverview`'s prose engine | `narrative-engine.js:872-1288` | ~440 lines |
| `computeDoseAdvice` at two UI call sites | `Dashboard.jsx:298`, `Insights.jsx:106` | 2 memos |
| `computeConsumption` at Dashboard | `Dashboard.jsx:288` | 1 memo |
| `out.events` initialisers | all three engines | 3 lines |
| `computeConsumption`'s dose fields | `consumption.js` | `recommendedMl`, `adjustMl` |
| Dashboard's duplicate `stabilityByParam` | `Dashboard.jsx:110` | recomputes what the tank already holds |

**Two of these are not merely dead — they are dead *and* contradictory.**
`buildOverview`'s paragraphs carry their own pH threshold of 8.4 against
`findings.js`'s live 8.45, and their own Ca:alk ratio band. Deleting them
removes two disagreements without a decision being needed.

**Care required on one point.** `buildOverview` is half dead, not all dead —
its score and headline are live and rendered. Delete the paragraphs, keep
`:779-851` and `:1303-1339`.

**Done when:** the derivation is ~500 lines lighter, the golden fingerprint is
unchanged, and nothing on screen differs.

---

# STAGE 2 — Build the safety rule that does not exist

**Also worth doing under any path.**

## 2a — The magnesium gate

Canon §5 and §20 say: while magnesium is below alert-low, the app does not
recommend alkalinity or calcium corrections, and says why. Below roughly
1200–1350 ppm neither can be held properly and precipitation becomes likely.

**It has never been built.** Three red spec tests pin it.

This is the only item in the whole plan that is a live safety gap rather than a
tidiness problem, which is why it comes before everything except free deletion.

## 2b — The magnesium alert inversion

`ALERT_WIDTH` puts magnesium's alert-low at **1125**. `SAFE_BOUNDS` puts the
harm floor at **1150**.

So the "act now" boundary sits *outside* the "this is dangerous" boundary — the
app would call 1140 dangerous before it called it worth acting on. Alkalinity
and calcium are not inverted; magnesium alone is.

**Needs a decision**, and it is small: either the alert width narrows, or
`SAFE_BOUNDS`' floor moves. Given §2's layering — safe bounds are harm points,
alerts are act-now — the alert should sit inside the bound, so the width
narrows.

## 2c — Setup's correction calculator offers what canon forbids

`analytics/correction.js` mints per-day caps for potassium, nitrate and
phosphate that exist nowhere else, and Setup's dropdown offers a correction for
every parameter with an entry. §29.6, written this morning, says phosphate and
nitrate get no correction at all.

Remove those three from the dropdown. The calculator's remaining behaviour is
Stage 4's problem.

---

# STAGE 3 — The fork

**Read this before committing to Stage 4.**

## The case for rebuilding, stated fairly

The classifier population **grew** during a week of work aimed at shrinking it.
A safety rule sat in canon for days without existing. The count of decision
sites is higher than anyone believed and no previous count can be verified.
Four days ago none of this app existed, so there is no long history being
protected.

That is a real case and it should not be dismissed with sunk cost.

## The case against, and why it currently wins

`.agent/engine-decision.md` classified all nine of Dan's journey habits and
found **zero additions**. Every one is a replacement, canon-blocked, or already
present. A rebuild would therefore not be building the journeys onto a clean
base — it would be re-deciding the same ~76 questions from scratch, with no
golden fingerprint to catch a wrong answer, because a rebuild deliberately
changes behaviour and invalidates 13 of the corpus's 30 fields in every row.

And the mess is not evenly distributed. **The dosing arithmetic is the
best-tested code here** — 5,940 pinned cases, three-year simulations, all green,
and nobody has disputed a dose figure since Phase 3. The tangle is in the
messaging and classification layer, and that layer gets rewritten under either
path.

## What would change the answer

**If Stage 1 and 2 go badly** — if deleting dead code moves the fingerprint, or
if building the magnesium gate turns out to require touching a dozen places —
that is evidence the coupling is worse than the inventory suggests, and the
rebuild case strengthens.

**If Phase 9's render tests find the surfaces are rotten**, rebuilding the
*surfaces* becomes reasonable regardless. That is a different question from
rebuilding the engines and should not be conflated with it.

**Decide after Stage 2, not now.**

---

# STAGE 4 — One classifier

The consolidation proper. Only after Stage 3's checkpoint.

## The order, cheapest and safest first

**4a — Collapse the three engines' duplicated position block.** The same
`inRange/above/below`, `nearEdge` and `clearlyOut` shape is written three times
(`alkalinity.js`, `calcium.js`, `helpers.js`). One shared function, three
callers. Mechanical, and it removes three of the sixteen.

**4b — One kit-noise table.** Three exist: `KIT_PRECISION`, `KIT_SIGMA`, and
`STABILITY_RULES.noiseFloor`. `buildFindings` consults all three in one pass.
They disagree — alkalinity is 0.10–0.20, 0.05, and 0.10 respectively. **This
needs a decision on which numbers survive**, and it is a chemistry question.

**4c — One alert boundary family.** `positionBand`/`ALERT_WIDTH` and
`SAFE_BOUNDS` currently produce three registers for one reading: at alkalinity
7.2 the history modal shows the alert tier, the wizard does not go emergency,
and the finding says "well below your target" at watch. Also a decision.

**4d — Build `classifyReading`** and move the ~76 sites onto it, in batches by
family: the 28 `paramStatus` calls first (12 of which currently feed dead prose
and will already be gone after Stage 1), then the 6 `SAFE_BOUNDS` consultations,
then the ~42 direct `def.min/max` comparisons.

Each batch its own PR, each proven against the golden fingerprint.

**4e — The trend thresholds.** Four answers for alkalinity: engine 0.10/day,
`DRIFT_GUIDE` 0.5/week, `RATE_RULES` 0.5/week and 0.3/day, `CONSISTENCY_RULES`
0.5 spread. A 0.6 dKH/week drift is "hold" in the wizard and amber in the
history modal. Decision required.

---

# STAGE 5 — The notification layer

TW-026, TW-027, TW-028. **This is the part Dan will actually see**, and it is
deliberately after the classifier work — one verdict per parameter is what makes
one notice per parameter possible.

**5a — The contradiction states.** `doseStatus` cannot express: dose raised and
still falling, dose lowered and still rising, dose changed with no movement, and
movement not established. Establish first whether `fell-short` and `overshot`
can serve the first two with widened preconditions — the inventory confirms they
are reachable for ordinary dose changes, not only staged plans.

**5b — Every surface renders the engine's verdict.** `findings.js` currently
re-runs all three engines itself (`:165-188`), a fourth invocation per
derivation whose results are not shared with the App-level run. `Insights` never
receives `doseStates` at all. Supersession does not exist — `add()` pushes,
never replaces.

**5c — Extend `wordingcheck`.** It covers one function, one field. It asserts
`claim:` but not `support:`, which is how `narrative-engine.js:474` writes its
own sentence and passes a blocking check. And its `checked` count is printed but
never asserted, so a whitespace change prints `OK (0 checked)` and exits 0.

**Without 5c, 5b erodes.** They land together.

---

# STAGE 6 — §29, and the parameters with no engine

**Everything decided this morning about phosphate and nitrate exists as canon
and two comments.** The bands, the two fixed warnings, the same-side count,
nitrate's trend, the no-dose rule — none of it is built.

Meanwhile both are still band-chipped by `paramStatus`, graded by
`computeStability` and `computeControl`, and headline-counted by
`buildHeadline`.

Salinity has no assessment at all and is deliberately still in the generic
loops (TW-030).

This comes after the classifier work because §29's count mechanism is a new
classifier, and adding it to sixteen before consolidating them makes seventeen.

---

# What this plan does not cover

**Phase 9's render tests.** Nothing here has ever been drawn in a test, and four
of the last five known bugs lived in that layer. Stage 5 will want them.

**The reskin**, which waits for Phase 9.

**TW-035**, the `doseStatus.target` field holding a concentration in one branch
and a dose rate in four. A correctness fix with a live parity test; do it alone,
whenever.

---

# Sequencing and cost

| Stage | What | Decisions needed | Cost |
|---|---|---|---|
| 1 | Delete dead code | none | half a day |
| 2 | Magnesium gate, alert inversion, Setup dropdown | one small | 2–3 days |
| 3 | **Fork: rebuild or consolidate** | **the big one** | — |
| 4 | One classifier | three chemistry decisions | 2–3 weeks |
| 5 | Notification layer | wording, several | 1–2 weeks |
| 6 | §29 and salinity | mostly decided | 1 week |

**Stages 1 and 2 are safe to start immediately.** Stage 3 is a conversation.
Stage 4 onwards should be one thing at a time — every step touches the engines,
and parallel work there is what produced this week's merge conflicts.

---

# The honest summary

The dosing maths is sound and heavily tested. The layer that decides what to
*say* about it has sixteen minds and no referee, and that is where every
disagreement in the inventory lives.

Stage 1 removes 500 lines for free. Stage 2 builds a safety rule that should
never have been missing. After those two, the picture will be clearer than it is
now, and the rebuild question can be answered on evidence rather than on
frustration.
