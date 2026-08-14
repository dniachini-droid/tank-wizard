# Phase 4 — Closing the Spec Gaps

Reports only. No spec file, code file, or test was edited to produce this.

Method: each of G1–G31 was checked against the five legacy documents
(`dosing-spec.txt`, `wizard-spec.txt`, `calculation-spec.txt`,
`correction-spec.txt`, `dose-change-confirmation.md`), and where none of
the five covered it, against the running source
(`src/lib/dosing/*.js`, `src/lib/analytics/*.js`, `src/lib/findings.js`,
`src/lib/stability-engine.js`, `src/components/*.jsx`). Genuinely open
questions went to an independent `domain-verifier` pass — published
guidance, options, simulation where practical, and honest gaps.

`private/` does not exist in this checkout. Every "replay against real
data" step below was **not run**, and no synthetic data was substituted
for it.

---

## 1. Counts

| Outcome | Count | Gaps |
|---|---|---|
| Answered by spec | 10 | G7, G9, G14, G18, G20 (spec+code), G22, G23, G26, G27, G30* |
| Answered by code (undocumented) | 13 | G3, G4, G5, G6*, G10, G13, G15, G16, G19*, G20, G24, G28-mechanism, G31* |
| Contradicted | 10 | G8, G11, G12, G17, G21, G25, G30, G31, and the "5 constraints" / staging omissions below |
| Still open | 5 | G1, G2, G25, G28, G29 |

(Several gaps carry two tags at once — e.g. G30 is answered by a legacy
document *and* contradicted by the merged draft's own 13-August decision.
The table below gives one line per gap with the full picture; the counts
above tag each gap by its headline outcome and are not mutually exclusive
with the notes.)

**The single most important finding isn't on the list of 31.** Every one
of the three engines below computes a dosing recommendation for the same
tank, independently, with different thresholds, and the merged canon
documents describe only one of them:

1. **The wizard** — `src/lib/dosing/{alkalinity,calcium,magnesium,state}.js`, governed by `calculation-spec.txt` / `correction-spec.txt`, verified by the Phase 3 golden fingerprint. This is the one `reef-chemistry-MERGED.md` and `wizard-states-MERGED.md` describe as canon ("the wizard owns the verdict").
2. **The Insights/Dashboard drift advisor** — `src/lib/analytics/drift.js` (`assessDrift`, `computeDoseAdvice`, `computeDoseCalc`), rendered live in `src/components/Insights.jsx` and `src/components/Dashboard.jsx`. Its own noise floors (`DRIFT_GUIDE`), its own settle-window floor (partly reconciled to call the wizard's `settleWindow`, per its own comment), its own extendable windows, and its own **literal 10%/15% dose nudge** (`pct: drift.severity === "high" ? 15 : 10`, `src/lib/analytics/drift.js:203`).
3. **The stability-grading engine** — `src/lib/stability-engine.js`, with a third set of window/noise-floor numbers, applying the noise floor to the **largest single step between consecutive readings**, not to a fitted slope at all.

`wizard-states-MERGED.md` §7 already names the "ten divergent classifiers" problem for reading severity. This is the same disease in the dosing-*advice* layer, and it is not named anywhere in either merged draft. See §5.

---

## 2. The table — G1 to G31

| Gap | Outcome | Source | Matches SPEC-GAPS's proposal? |
|---|---|---|---|
| G1 — band edge past safe bound | **Still open** | no feature exists to clamp — see §4 | N/A — nothing to compare against |
| G2 — min/max band width | **Still open** | no feature exists — see §4 | N/A |
| G3 — safe-bound boundary | Answered by code | `findings.js:233`, `state.js:191`, `helpers.js:54`, `narrative-engine.js:742` — all four sites treat the boundary value as safe (strict `<`/`>` for "unsafe") | **Yes**, exactly |
| G4 — rail measured against what | Answered by code | `safe-rate.js:43 safeDoseBand`, `alkalinity.js:348` — clamps the *candidate dose* into a band centred on **`maintenanceDose`**, not on `currentDose` | **No** — proposal assumed the anchor was `currentDose`; code deliberately anchors on `maintenanceDose` (comment cites a 2015-tank simulation crash when anchored on consumption/currentDose) |
| G5 — rail applies to falls too | Answered by code | same function, band has both `lo` and `hi` from one `limit` | **Yes** |
| G6 — what cadence does | Answered by code, partial | `testOn` is driven from settle/plan timing (`state.js`); no code excludes a reading logged sooner than cadence from the trend fit — `alkIntervals` (`alkalinity.js:174`) accepts any interval `> 0` days | **Half** — the `testOn` half holds, the "no trend from a too-soon reading" half is not implemented; the noise floor and reading-count gates do that job instead |
| G7 — <3 readings → nothing | Answered by spec | `calculation-spec.txt` §4, `dosing-spec.txt` §5.1 | **Yes**, though the stricter `trendConfirmed` gate for calcium/magnesium actually requires **4** (`alkalinity.js:383-388`), not 3 — a second, tighter threshold sitting under the general one |
| G8 — noise floor applied to what | **Contradicted** | Neither of the two proposed options. `alkBandOf` (`alkalinity.js:188-193`) compares the **fitted per-day slope directly** to a fixed per-day threshold (`ALK_TREND.stable = 0.10`), with no window scaling at all | **No** — see §3, this is the root cause of the already-documented slow-decline fault |
| G9 — effectPerMl derivation | Answered by spec | `calculation-spec.txt` §2 (given) | **Yes** |
| G10 — dose change truncates window | Answered by code | `alkalinity.js:490-491` (`windowStart`/`cutoff` bounded at `lastChange`) | **Yes** |
| G11 — how a disturbance is excluded | **Contradicted** | `calculation-spec.txt` §3 and `dosing-spec.txt` §4 both say water changes are excluded as disturbances; `alkalinity.js:493-499` explicitly does **not** exclude water changes ("deliberately NOT among them") and instead subtracts a logged correction's estimated contribution proportionally over 3 days | **No** — none of the three proposed mechanisms (drop reading / drop interval / split series); it's a fourth mechanism, and it contradicts two legacy documents about water changes specifically |
| G12 — negative consumption | **Contradicted** | `alkalinity.js:638-641`, `calcium.js:365`, `helpers.js:722` — consumption is clamped to 0, `maintenanceDose` set to 0, execution **continues** | **No — the opposite.** Proposal: report as unusable, don't act. Code: silently proceeds with a dose of 0 and a "gaining" label |
| G13 — enough history to solve strength | Answered by code | `alkalinity.js:71-127 solveAlkEffect` — ≥2 usable dose-periods, each ≥3 readings spanning ≥1.5 days, at least one pair with dose separation ≥1 mL | The mechanical question is answered; SPEC-GAPS's *product* question ("should this exist at all?") is untouched — still Dan's call |
| G14 — settle-window units | Answered by spec + code | `calculation-spec.txt` §1 (`supplied = currentDose × effectPerMl`) + `dosing-spec.txt` §5 formula; confirmed at three call sites (`state.js:71`, `state.js:155`, `drift.js:125`) | **Yes**, exactly |
| G15 — 3-SE rule vs window | Answered by code | `trendConfirmed` (`alkalinity.js:383`) hardcodes `spanDays >= 20` and `readingCount >= 4` regardless of element; at magnesium's 21-day cadence this is almost never satisfiable inside a 28–35 day window | Confirms the concern is real. But magnesium's safety net (`emergency`/`SAFE_BOUNDS`) does not depend on `confirmedByFit` — it depends on level position — so the practical blast radius is the "small band" grading nuance, not magnesium's core safety mechanism. Still needs Dan for whether this matters enough to fix |
| G16 — dose-gap formula | Answered by code | `doseDriftedFrom` (`helpers.js:502`): `\|maintenanceDose − currentDose\| / currentDose` | **Yes**, exactly |
| G17 — the 10% nudge | **Contradicted** | See §3 — this is the headline finding | **No.** The wizard has no 10% mechanism at all; it fully recomputes and stages `maintenanceDose`. A *different* engine (`analytics/drift.js`) does have a literal 10%/15% nudge, feeding Insights/Dashboard, independently of the wizard |
| G18 — nudge vs correction | Answered by spec + code | `wizard-spec.txt` §1/§6, `wizard-states-MERGED.md` §6 — in-band → dose path, out-of-band → correction path | **Yes** on the in-band/out-of-band split; the word "nudge" is doing double duty across two different engines — see G17 |
| G19 — bracket observation definition | Answered by code, partial | `doseObservations` (`helpers.js:87-131`): a period needs only **2** readings (not 3) and a span ≥1 day; no explicit noise-floor test on the slope | **No**, not exactly — looser on reading count, and the noise floor is not separately checked (the 25% consumption-similarity filter in `bracketDose` stands in for it) |
| G20 — tightest bracket | Answered by code | `bracketDose` (`helpers.js:143-144`): highest dose that fell, lowest dose that rose | **Yes**, exactly |
| G21 — "may only widen" mechanism | **Contradicted** | `BRACKET_MEMORY_DAYS = 45` is still flat (`helpers.js:85`), not the merged draft's proposed 30/60 per-element split; the actual discard rule is still the flat 25% consumption-similarity filter (`helpers.js:138-141`) that the merged draft's §8.1 explicitly calls "circular" and proposes to replace | The "never narrow, only widen" mechanism SPEC-GAPS asked about **exists nowhere** — not in code, not in any legacy doc. The merged draft's 13-Aug "decision" is a proposal with no implementation behind it |
| G22 — step cap of what | Answered by spec | `calculation-spec.txt` §7.5; `capDoseStep` (`helpers.js:51-58`) uses `currentDose` | **Yes** |
| G23 — correction dose arithmetic | Answered by spec | `correction-spec.txt` §3 (given) | **Yes** |
| G24 — who picks the pace | Answered by code | `DosingWizard.jsx:98-103` — user picks; `"steady"` is the fallback/default | **Yes** |
| G25 — "middle third" defined | **Still open** | see §4 — invented by the merge, unsupported by code or any legacy doc, and internally inconsistent within the merged draft itself | N/A |
| G26 — two consecutive in-band readings | Answered by spec | `correction-spec.txt` §6 (given) | **Yes** |
| G27 — correction replaces, not adds | Answered by spec | `correction-spec.txt` §3 (given) — reverses SPEC-GAPS's own guess | **No** — and that's the point; the legacy doc overrides the guess |
| G28 — magnesium correction's strength source | **Still open** | see §4 | N/A |
| G29 — magnesium re-warning suppression | **Still open** | see §4 | N/A |
| G30 — trend computation | Answered by spec, **contradicted** by the merge | `calculation-spec.txt` §3 gives extendable windows (alk 7→21, Ca/Mg 14→35) and matches code's adaptive widen-until-3-readings logic (`alkalinity.js:512-529`); `reef-chemistry-MERGED.md` §4 explicitly *decided* flat windows with no extension, which is not what the code the fingerprint validated does | Proposal's "least-squares slope, min 3 readings, noise-floor gate" all hold; the "no trend verdict below 3" and "windows are flat" pieces conflict with what's actually running |
| G31 — band-edge-crossed mid-window | Answered by spec, **not yet in code** | `reef-chemistry-MERGED.md` §11 states the rule and `wizard-states-MERGED.md` branch 21b implements the *state name* (`worsening`); but `ALK_TREND.stable = 0.10` is still a flat per-day threshold with no window scaling (`alkalinity.js:28-32,190`) — the merged doc's own §9.2 admits this | The rule is written down correctly. It just isn't running yet — same defect as G8 |

\* see the relevant footnote row above for the nuance.

---

## 3. Contradictions, in full

### 3.1 The 10% nudge exists, but not where the merged draft says it does

**Precise.** `reef-chemistry-MERGED.md` §7 states, as a 13-August decision:
"For ordinary drift, the response is a 10% adjustment to the daily dose,
not a correction... This is gentler than recalculating from scratch."
`calculation-spec.txt` §§5–8 (read from the wizard's actual code, fingerprint-verified) describes something else entirely: once `doseDriftedFrom` trips, the wizard computes `rawChange = maintenanceDose − currentDose`
from a full consumption re-derivation, then **stages** a fraction of it
(45%–100% depending on element, magnitude and urgency — §6 of that
document), then applies rounding, rate ceiling, plausibility, bracketing
and a 25% step cap, in that order (§7). Nowhere in this five-step,
per-element pipeline is there a flat 10%. Meanwhile
`src/lib/analytics/drift.js:203` (`pct: drift.severity === "high" ? 15 : 10`)
**does** implement a literal percentage nudge — in a completely separate
engine feeding `Insights.jsx` and `Dashboard.jsx`, with its own noise
floors (`DRIFT_GUIDE`) and its own extendable windows, neither described
in either merged draft.

**Plain.** Ask "what does the app actually do when your alkalinity dose
drifts 15% off what the tank needs?" and you get two different, true
answers depending which screen you're standing on. The Dosing Wizard
quietly recomputes the whole thing and eases into it a bit at a time. The
Insights page has its own, much simpler idea: just nudge the number by
10%, or 15% if it's worse. Both are live. Neither knows the other exists.
The merged spec wrote down the Insights page's rule and called it the
wizard's rule, which it isn't.

**Do not resolve.** This needs a decision: which engine is canon for the
"ordinary drift" response, and what happens to the other one.

### 3.2 Water changes: excluded by the docs, not excluded by the code

**Precise.** `calculation-spec.txt` §3: "Readings are excluded if they
fall inside a disturbance — a water change or a logged correction —
because those move the level without being consumption." `dosing-spec.txt`
§4.3 says the same. `alkalinity.js:493-499` states the opposite as a
deliberate design choice: "Water changes are deliberately NOT among them
[the confounding events list]. A routine change of a tenth of the volume
shifts alkalinity about as much as the test can resolve, while restarting
the window every week left the assessment with a single reading to work
from — which is why it answered 'hold' on tanks that were visibly
draining." Only logged corrections are subtracted, and not by dropping or
splitting — by a proportional estimate of how much of the correction's
effect has landed by each reading's timestamp (`correctionAddedBy`,
`alkalinity.js:496-499`).

**Plain.** The handover notes say the app throws out any reading too close
to a water change. It doesn't — not any more. Someone changed their mind,
for a reason written right there in the code: doing that made the app go
quiet on tanks that were genuinely crashing, because water changes happen
often enough that "exclude anything near one" left almost nothing to look
at. What actually happens is narrower and cleverer than either the docs or
G11's three guesses: only *corrections* get subtracted, and they're
subtracted as a fading contribution, not thrown away wholesale.

**Do not resolve.** Whether the calculation-spec/dosing-spec description
or the current code is "right" is Dan's call — the code's own comment
argues its position, but that argument isn't in any spec.

### 3.3 Negative consumption is not treated as broken — it's smoothed over

**Precise.** SPEC-GAPS's G12 proposal: "negative consumption means the
model has broken... The app reports it as unusable rather than acting. It
should not clamp to zero and carry on." `alkalinity.js:638-641` (and the
identical pattern in `calcium.js:365` and `helpers.js:722`): `if
(out.consumption < 0) { out.gaining = -out.consumption; out.consumption =
0; out.maintenanceDose = 0; }` — execution continues past this line into
the plausibility check and the rest of the pipeline.

**Plain.** When the maths says "this tank is somehow making its own
alkalinity," which can only mean a bad reading, an unlogged water change,
or a wrong bottle strength in Setup, the app doesn't stop and say so. It
quietly relabels the problem as "gaining," sets the suggested dose to
zero, and moves on as if nothing was wrong. That is close to the exact
failure mode the app's own handover notes call "the single largest
correctness risk in the system" — a wrong Setup strength that nothing
catches. This isn't a documentation gap; it's a live behaviour that
deserves a second look regardless of what the eventual spec says, because
right now the app's response to "something here doesn't add up" is
silence.

**Do not resolve.** No legacy document covers this at all — it's not a
spec-vs-code contradiction, it's spec-silence-vs-code-behaviour, and the
behaviour looks worth Dan seeing directly.

### 3.4 The five constraints became three, in a different order, missing two

**Precise.** `calculation-spec.txt` §7 gives five constraints in a fixed
order — rounding, rate ceiling, plausibility, bracketing, step cap — and
states plainly "order changes the answer." Runtime confirms this order
exactly: `rateLimitDose` (`alkalinity.js:853`) performs rounding, then the
rate-ceiling clamp, then a plausibility check (`dosePlausible`, line 363)
all before returning; `applyDoseConstraints` (`alkalinity.js:859`) then
runs bracketing (line ~264) followed by the step cap (`capDoseStep`, line
307). `reef-chemistry-MERGED.md` §8 "How big a change" lists **three**
constraints — bracketing, step cap, rate ceiling, in that order — with no
mention of rounding as an ordered step and no mention of plausibility as
an ordered step at all (plausibility appears only as prose in §6, decoupled
from the ordered list). This is `dosing-spec.txt` §6's older three-step
list, carried into the merge unchanged, while the newer and more precise
`calculation-spec.txt` (found later, per the routine's own background)
was not reconciled against it.

**Plain.** The maths doc that was actually traced through the code says
there are five gates a number passes through, in a specific order, and
warns that changing the order changes the answer. The merged spec that's
supposed to be canon only lists three of them, in a different order, and
never says order matters. Anyone implementing §8 as written would round
last instead of first and would never explicitly check plausibility at
all — both wrong, both silently.

### 3.5 Bracket memory: three numbers for one thing

**Precise.** `dosing-spec.txt` §6.1 and `calculation-spec.txt` §7.4: "45
days" flat. `reef-chemistry-MERGED.md` §8.1: "Decided 13 Aug: memory scales
per element: 30 days alkalinity, 60 days calcium." Code:
`BRACKET_MEMORY_DAYS = 45` (`helpers.js:85`), flat, still matching the two
legacy documents and not the merged draft's decision.

**Plain.** Three different numbers have now been written down for "how
long a bracket observation stays valid" — one in the old docs, one in the
running code (the same as the old docs), and a third one the merge
proposed and never built.

### 3.6 The stability-grading fix is written but not running (G8/G31 tied together)

**Precise.** `reef-chemistry-MERGED.md` §11 states the rule as designed:
"a level outside its band and moving further out is never graded stable...
The movement must clear the kit noise floor over the fitted window
[emphasis added]." `wizard-states-MERGED.md` §9.2 already admits, in its
own "known faults" section: "the stability grading fault is fixed in
spec, not yet in code. `ALK_TREND.stable = 0.10` dKH/day still grades a
0.02/day decline as stable at `src/lib/dosing/alkalinity.js:28-32,190`."
Verified directly: `alkBandOf` (`alkalinity.js:188-193`) compares the
fitted **per-day** slope to `ALK_TREND.stable` with no window-length term
anywhere in the comparison — exactly the pre-fix behaviour the merged
draft describes, and exactly G8's unresolved question (is the noise floor
applied to a single difference or to `slope × windowDays`?) answered the
wrong way for the fix to work.

**Plain.** The team already found the app's worst bug — a tank can crash
in slow motion while the app keeps saying "hold" — and already wrote down
the correct fix. The fix just isn't in the app yet. This is the one item
on this list that isn't really a documentation gap at all; it's a shipped
diagnosis with an unshipped cure, and the merged spec is honest about that
in its own known-faults section even though `reef-chemistry-MERGED.md`
§11 reads, out of context, as if the fix were already live.

---

## 4. Still open

Five gaps had no answer in any legacy document, in the merged drafts'
"decided" text, or in the running code. An independent `domain-verifier`
pass (published guidance, simulation where practical, real-data replay —
`private/` does not exist in this checkout, so that step could not run for
any of the five) was run for all five; see the companion findings below.

**G1 / G2 — target band editing doesn't exist yet.** Both gaps assume a
feature — a user-settable target and band width per element — that isn't
built. `src/lib/constants.js` `PARAM_DEFS` hardcodes one fixed min/max per
element; `src/components/Setup.jsx` has no control for it.
`reef-chemistry-MERGED.md` §2 "Layer 2 — the user's target and band"
describes this as if it already exists. These aren't vagueness gaps in a
spec for a working feature — they're open design questions for a feature
that hasn't shipped.

**G25 — "middle third" has no source anywhere.** `correction-spec.txt`
§2 gives the correction *target* as a single point, `(min+max)/2`. The
merged draft's own §9 is internally inconsistent — it headlines "the
middle third of the band" as where a correction ends, then two paragraphs
later defines the actual exit test as "two readings inside **the band**,"
not the middle third. No code anywhere computes a middle-third zone;
`correctionProgress`'s `arrived` flag tests the ordinary band.

**G28 — no separate magnesium correction-product strength field exists.**
Both SPEC-GAPS and the merged draft (§10) assume Setup has, or should
have, two magnesium strength numbers — one for the daily three-part
maintenance product, one for a separate correction product. Neither
`src/lib/dosing/magnesium.js` nor `src/components/Setup.jsx` has a second
field; `pendingCorrection` prices a magnesium correction using the same
`mgEffectPerMl` as the daily dose.

**G29 — magnesium's correction re-warning suppression could not be
confirmed either way from the code alone.** `pendingCorrection`
(`helpers.js`, ~150-193) is the closest mechanism — it tracks what's left
of a logged correction against a 21-day lookback and the element's noise
floor — but whether it (or anything else) actually gates a repeat
magnesium warning, versus the level-based `emergency` check
(`state.js:185-191`, which only checks for a running correction *plan*,
not a logged one-off) firing again regardless, needed independent tracing.

*(Domain-verifier findings for all five to be appended here.)*

---

## 5. Missing from the merged drafts

**Staging — the whole mechanism.** Neither `reef-chemistry-MERGED.md` nor
`wizard-states-MERGED.md` mentions staging at all. `calculation-spec.txt`
§6 gives it in full, confirmed against code (spot-checked at
`alkalinity.js:833-846`, matching exactly):

| | ≤ smallest tier | next tier | larger | rescue |
|---|---|---|---|---|
| Alkalinity | ≤2 mL: 100% | ≤4 mL: 90% | >4 mL: 70% urgent / 55% otherwise | out of band & still heading away, or unsafe: 100% |
| Calcium | ≤1 mL: 100% | ≤3 mL: 85% | >3 mL: 60% urgent / 50% otherwise | out of band, either direction: 100% |
| Magnesium | ≤1 mL: 100% | ≤3 mL: 80% | >3 mL: 55% urgent / 45% otherwise | **none, deliberately** |

Magnesium's missing rescue path is deliberate and documented: applying a
full calculated change to a dilute maintenance dose once produced a
72 mL/day figure nobody would pour. This entire table, and the reasoning
behind magnesium's exception, is absent from both merged drafts.

**The five constraints in fixed order.** Covered in full at §3.4 above —
the merged draft has three of five, in the wrong order, with no statement
that order matters.

**The three-engine dosing-advice architecture.** Covered at the top of §1
and in §3.1. Neither merged draft acknowledges that `analytics/drift.js`
and `stability-engine.js` exist, let alone that they compute their own
dosing/stability verdicts independently of the wizard they declare
authoritative.

**Two other things `calculation-spec.txt` states but the merge doesn't
carry forward:**
- §8 "Continuing an existing plan" — the `planLive` condition that stops a
  staged plan's target from drifting on every render.
- §9 "When the arithmetic is impossible" — the explicit statement that a
  number from broken input is worse than no number, which is *why* the
  `blocked`/`implausible` state exists, not just that it does.

---

## 6. What `dose-change-confirmation.md` contains

Nobody had read this document before this pass. It is the fourth
legacy-protocol-adjacent file and is not one of the four "read out of
running code on 12 August" documents — its own header says **"Status:
proposed, not built."**

**What it says.** The reading-confirmation window, today, only narrates a
reading when a correction plan is running; a plain dose change gets no
narration at all — the window just describes where the level sits. The
document argues this is actively misleading, not merely terse, with a
worked example: raising alkalinity from 9 to 11 mL/day and then seeing
10.2 dKH a week later currently reads as "well above band, re-test
suggested" — when the reading isn't wrong, it's the predictable and
already-known consequence of the user's own change. It proposes five
narrated cases, in priority order — too early to judge, it worked, not
enough, overshot, wrong direction — each built strictly from fields the
wizard's assessment already computes (`state`, `hoursOnDose`,
`currentDose`, `trendPerDay`, `settleWindow`), with an explicit rule that
these messages must never invent a new threshold or read a figure from
anywhere but the assessment itself. It sets three decisions as already
taken: the "it worked" case should speak (not stay silent), a dose change
stays relevant until superseded or settled for two settle windows, and a
past-safe-bound reading always leads with the danger before the cause.

**What was found that the document itself doesn't know.** `src/components/ReadingConfirmation.jsx`
already contains headline strings matching several of the proposed cases
near-verbatim — `"Too early to tell"`, `"The dose change is working"`,
`"That is the dose change overshooting..."` — with comments discussing the
same attribution and wording-drift concerns the proposal raises. The
document's own status line ("proposed, not built") appears to be stale;
the feature looks substantially built already. This wasn't verified
line-by-line against all five proposed cases and the document's testing
section, and is offered as a pointer for whoever picks this up next, not
a confirmed audit.

**Plain version.** This document is a well-argued case for a feature that
looks like it already shipped under a different assumption about its own
status. Before anyone plans work off "not yet built," someone should
diff `ReadingConfirmation.jsx` against the five proposed cases directly.

---

*Domain-verifier findings for G1, G2, G25, G28, G29 are being appended as
a follow-up to this file — that pass was still running when this document
was first written.*
