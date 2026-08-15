# Spec Reconciliation — Routine 06

> **Note added 2026-08-14 (canon swap).** This is a historical record; its body
> is left as written. The files it cites were renamed that day:
> `reef-chemistry-MERGED.md` → `docs/spec/reef-chemistry.md`,
> `wizard-states-MERGED.md` → `docs/spec/wizard-states.md`,
> `docs/spec/surfaces-and-messaging.md` → `wizard-states.md` §11–§17 (add 10 to
> the section number), `docs/spec/app-contract.md` → `wizard-states.md` §18,
> `docs/spec/incoming/*.txt` → `legacy/protocol/*.txt` (identical files,
> duplicates deleted). Section numbers in `reef-chemistry.md` §1–§14 and
> `wizard-states.md` §0–§10 are unchanged, **except** that §8's subsections
> shifted: bracketing §8.1 → §8.3, step cap §8.2 → §8.4, rate ceiling
> §8.3 → §8.5. Everything the previous canon carried that the merge had dropped
> now lives in `reef-chemistry.md` Part II (§15–§23), which maps the old sections
> to the new ones.

Read-only run. No code changed, no spec edited. Nothing ships except this file.
Base docs = `docs/spec/incoming/{dosing,wizard}-spec.txt` (read from code
2026-08-12). Secondary/canon = `reef-chemistry.md`, `surfaces-and-messaging.md`,
`app-contract.md` (written 2026-08-13, contains at least one already-corrected
error re: magnesium/precipitation). Where they conflict, base is presumed right
unless secondary cites a source base lacks — flagged, not resolved, below.

All commit timestamps in this repo are dated 2026-08-13 (`git log`), including
the very first commit. The base docs' claim to have been "read out of the
running code on 2026-08-12" therefore predates every commit this reconciliation
can see — worth knowing when weighing how current the base docs are.

---

## 1. Enforcement audit

| Claimed file | Exists? | Tests what it claims? |
|---|---|---|
| `tests/husbandry.js` (dosing-spec: bands, every constant) | **No** | n/a |
| `tests/summary.js` (wizard-spec §7: wizard-vs-surfaces agreement) | **No** | n/a |
| `tests/matrix.js` (wizard-spec: 180 state×reading combos) | **No** | n/a |
| `tests/sim/surfaces.js` (wizard-spec: 12 states, thousands of tank-days) | **No** | n/a |
| `tests/protocols.js` (wizard-spec/dosing-spec: 39 worked examples) | **No** | n/a |

`find . -name husbandry.js -o -name summary.js -o -name matrix.js -o -name
protocols.js -o -path '*sim/surfaces.js'` (excluding node_modules) → zero
results, checked twice, once per doc's citation list.

**Every enforcement claim in both base documents is false as stated.** Neither
document's "Where to look in the code" section names a test file that exists.
This is not a partial miss — `grep -rl "DOSE_DRIFT_TRIGGER\|BRACKET_MEMORY_DAYS\|DOSE_STEP_CAP\|settleWindow\|bracketDose" tests/`
finds exactly one incidental hit (`tests/parity/multiday-plan-parity.test.js`,
which exercises `bracketDose` as a side effect of a parity check, not as a
dedicated enforcement test). None of the arithmetic mechanisms dosing-spec.txt
documents in detail — the settle-window formula, bracketing, the step cap, the
dose-gap trigger table — has a dedicated test anywhere in the repo.

What **does** exist and does real enforcement work, just not under the claimed
names or against the claimed rules: `tests/parity/` (9 files, built by the
2026-08-13 consistency sweep, enforcing `surfaces-and-messaging.md`'s parity
requirement) and `src/test/spec/{analytics,classification,dosing,history}/`
(35 files, enforcing `reef-chemistry.md` and `surfaces-and-messaging.md`
clause by clause — e.g. `magnesium-gate.test.js`, `precipitation-guard.test.js`,
`unit-conversions.test.js`, `rate-rails.test.js`). Several of these currently
**fail** — that is their job; a failing spec test here documents a real gap,
not a broken suite. One of them is itself stale: `rate-rails.test.js:9,44`
asserts canon says magnesium=100 (a number that appears nowhere in
`reef-chemistry.md`; the real canon figure is 50, at line 158) — a test citing
a citation that was never correct.

**Read everything below in that light.** A rule described by either base
document as "enforced" or "a test fails" had, at the time of writing, no test
behind it — full stop.

---

## 2. Summary counts

Working set: 31 comparison rows below.

- **AGREE** (all three concur): 2
- **CONFLICT** (base vs. secondary genuinely disagree): 2
- **GAP-IN-SECONDARY** (base covers, canon silent): 8
- **GAP-IN-BASE** (canon covers, base silent): 12 — more than the routine's
  "expect few" primed for. Base docs are scoped tightly to wizard arithmetic
  and state machine; canon's scope (history, terminology, cross-surface
  parity, magnesium gate, precipitation, units, net-volume mechanics) is
  structurally wider, so most of canon's territory is simply outside what the
  base docs ever set out to cover.
- **CODE-DIVERGES** (both specs agree, code differs) or the practical
  equivalent (one spec silent, the other contradicted by code): 13, several
  overlapping with a GAP-IN-BASE row above (canon requires it, base is silent
  on it, code doesn't do it — both facts recorded on one row below).
- Two items don't fit the five verdicts at all and are called out separately:
  **two live wizard states with no authorization in either document**, and
  **the two canon documents disagreeing with each other** about what
  `classifyReading` does.

---

## 3. The conflict list

Ranked by cost of a wrong call. Both positions stated. Not resolved here.

### 3.1 — The whole targeting model (highest cost: touches every band, every alert, every recommendation)

- **base** (`dosing-spec.txt` §2): fixed universal target bands and a
  separate, fixed universal *safe-bounds* (harm-point) tier, identical for
  every user — alkalinity 8.5–9.5 dKH target / 7–11 safe; calcium 400–450 /
  350–500; magnesium 1250–1400 / 1150–1600. "Enforced by tests/husbandry.js. A
  band moved outside published guidance fails the build" (false per §1 above).
- **secondary** (`reef-chemistry.md` §3): the app "does not impose targets."
  The user sets a target; the app derives a no-action band (± a fixed width,
  e.g. alkalinity ±0.5 dKH) and alert-low/alert-high thresholds (± a wider
  fixed offset) from *that* target. No universal fixed harm-point tier exists
  in this model at all — the two-tier band/alert structure is user-relative,
  not absolute.
- **code does**: `PARAM_DEFS` (`src/lib/constants.js:26-29`) hard-codes the
  base doc's exact numbers as defaults. `SAFE_BOUNDS`
  (`src/lib/findings.js:87-111`) hard-codes the base doc's exact harm points,
  with no per-user override found anywhere. Separately, `App.jsx:352,378-381,
  407-420` implements `customRanges` — a user can override a parameter's
  `min`/`max` directly, and this overrides `PARAM_DEFS` at render time. That
  is a real (if structurally different — a bare min/max pair, not a
  target-plus-derived-band-plus-alert-threshold triple) piece of
  user-configurability, so code is a hybrid: base's fixed numbers as defaults,
  a partial and structurally mismatched implementation of secondary's
  user-relative model layered on top, and secondary's alert-tier and
  Setup-suggestion-by-coral-mix mechanics absent entirely.
- **evidence**: `src/lib/constants.js:26-29`, `src/lib/findings.js:87-111`,
  `src/App.jsx:352,378-381,407-420`, `docs/spec/reef-chemistry.md:61-91`,
  `docs/spec/incoming/dosing-spec.txt:65-83`.

### 3.2 — Magnesium's rate rail: 25 ppm/day or 50 ppm/day

- **base** (`dosing-spec.txt` §3): 25 ppm/day. Sourced: "magnesium widely
  given as 25, suppliers to 50. The conservative end is used."
- **secondary** (`reef-chemistry.md` §6, line 158): 50 ppm/day. Sourced:
  "Aqua Forest magnesium label: 'maximum daily increase 50 mg/l (ppm)'."
- **code does**: `CORRECTION_MAX_RATE.magnesium` and `SAFE_DAILY_RISE.magnesium`
  (`src/lib/analytics/safe-rate.js:27,31`) = 25 — matches base, half of
  secondary's current figure. This is not a fresh discovery: it is
  `.agent/items/TW-051.md` **TW-051** (filed as TW-016), already written up by Dan on 2026-08-13 and
  sitting in "Needs Dan's approval" pending an `[approved][chem]` tag — not
  yet implemented. Both documents cite a real source for their number; the
  routine's "secondary wins if it cites a source base lacks" tie-breaker does
  not cleanly apply here since base cites one too. Restating rather than
  re-deciding it.
- **evidence**: `src/lib/analytics/safe-rate.js:22-31`,
  `docs/spec/reef-chemistry.md:154-158`,
  `docs/spec/incoming/dosing-spec.txt:94-102`, `.agent/items/TW-051.md` TW-051.

---

## 4. Gaps in canon (base knows, canon doesn't)

These are base-doc arithmetic/state-machine mechanisms with no mention in
either canon document. All confirmed present and matching in code; the gap is
purely on the canon side. Promotion candidates.

| # | Topic | Base cites | Canon | Code (evidence) |
|---|---|---|---|---|
| 4.1 | **Settle window formula** — `needed = (2×kitNoise×√2)/(0.15×dailySupply)`, floors/ceilings 2–5d (alk), 7–30d (ca/mg) | §5 | silent | Matches exactly. `src/lib/findings.js:78-84` |
| 4.2 | **Kit noise floors** — alk 0.1, ca 10, mg 30 | §5 | silent | Matches exactly. `src/lib/stability-engine.js:42,45,46` |
| 4.3 | **§9.1 pairing** — dose-gap trigger's out-of-band halving exists only because stability grading is wrong; both need rewriting together if grading is fixed. **Flagged prominently per instruction.** | §5, §9.1 (dosing); §8.1 (wizard) — both base docs state this identically | silent — canon has no concept of "stability grading" at all | Halving confirmed live: `gap > (outOfBand ? trigger/2 : trigger)`, `src/lib/dosing/helpers.js:502-503`. The grading it patches around: `ALK_TREND.stable = 0.10` dKH/day, `src/lib/dosing/alkalinity.js:28-32,190` — a 0.02 dKH/day decline (dosing-spec's own example) is well under 0.10 and does grade "stable," confirming the fault as described. **If anyone touches stability grading, dosing-spec §5's halving has no canon backstop telling them it must move too — canon doesn't know this pairing exists.** |
| 4.4 | **Magnesium's exemption from the dose-gap trigger** (managed by level, never by measured-gap dose chasing) | §5 (dosing); handover note #4, §1.4 (wizard) | silent — reef-chemistry §1 says Mg "not consumed proportionally... depletes slowly," consistent but doesn't state the exemption mechanism | `DOSE_DRIFT_TRIGGER` has no `magnesium` key (`src/lib/dosing/helpers.js:463-487`); `doseDriftedFrom` returns `false` when `trigger == null` (line 491). `assessMagnesium` (`src/lib/dosing/helpers.js:554-962`) never calls `doseDriftedFrom` with a nonzero trigger for magnesium. Confirmed exempt. |
| 4.5 | **The dose-gap trigger table itself** (alk 12%/6%, ca 30%/15%, in-band/out-of-band) | §5 | silent | `DOSE_DRIFT_TRIGGER = {alkalinity:0.12, calcium:0.30}`, `src/lib/dosing/helpers.js:474-475`, matches exactly |
| 4.6 | **Bracketing** (two dose observations, one rise one fall, answer sits between) and its 45-day memory | §6.1 | silent | `BRACKET_MEMORY_DAYS = 45`, `bracketDose`, `src/lib/dosing/helpers.js:85,133-150` — matches |
| 4.7 | **Step cap** — 25% per change, relaxed to 100%/50% when out-of-range and worsening | §6.2 | silent | `DOSE_STEP_CAP = 0.25`, `capDoseStep`, `src/lib/dosing/helpers.js:49-60` — matches |
| 4.8 | **Correction pacing** — gentle/steady/quick = 25%/50%/100% of max rate | §7 | silent | `CORRECTION_PACE = {gentle:0.25, steady:0.5, quick:1.0}`, `src/lib/dosing/helpers.js:213` — matches |
| 4.9 | **Stale-reading rule for corrections** — nothing proposed if a correction/plan/dose-change postdates the newest reading | §7 | silent | `staleAgainst` checks in `proposeCorrection`, `src/lib/dosing/helpers.js:386-403` — matches |
| 4.10 | **Correction-plan expiry on the calendar** — due at estimate, stalled at 2× estimate | §7 | silent | `dueNow`/`overrun` in `correctionProgress`, `src/lib/dosing/helpers.js:263-270,321-331` — matches, with one precision the base doc rounds off: overrun is `expected×2 + 2` days, not a bare doubling. |
| 4.11 | **The 23-return/15-state wizard order itself**, as a governing single-source rule | wizard-spec §2-3 | surfaces-and-messaging §1 states the *principle* ("wizard owns the verdict") but not the 23-entry table | See §5.3 below — order matches, with exceptions noted there |

---

## 5. Code divergences (both specs agree — or one is silent and the other is
contradicted — and code does something else). Ranked, worst first.

### 5.1 — `classifyReading` does not exist; ~10 divergent classifiers stand in its place

**Both apply**: surfaces-and-messaging.md §1 states this as *the* single-source
rule ("a second implementation... is an S1 defect, even if it currently
produces identical output"). The base docs implicitly assume something like it
exists too (dosing-spec's safe-bounds and target-band tables presume one
classification path). Code has neither one function nor even a consistent
concept.

`grep -rln "classifyReading" src tests` → zero implementations, two test-only
references (`src/test/spec/classification/classify-reading-validation.test.js`,
`tests/parity/band-classification-matrix.test.js` — both fail, by
construction, since the function doesn't exist).

Ten independent classifiers found:

| Classifier | Defined | Vocabulary |
|---|---|---|
| `paramStatus` | `src/lib/dates.js:24-29`, 20+ callers | `ok/low/high/unknown` — no drifting, no alert tier, no insufficient-data |
| `STATUS_COLOR` | `src/lib/dates.js:31` | second, independent colour authority keyed off `paramStatus` |
| `paramContext` | `src/lib/analytics/reading-meaning.js:17-87` | free-text severity, no formal states |
| `computeControl` | `reading-meaning.js:89+` | `rateGrade`/`pattern` ("trending up/down" — banned synonym per §5) |
| `readingVerdict` | `src/components/ReadingConfirmation.jsx:20,32,45-53` | own `inBand` boolean + own inline SAFE_BOUNDS check |
| far-out-of-band check | `src/lib/findings.js:218-250` | `unsafe/watch/act`, "well above/below your target" (banned synonym for out-of-range) |
| inline `inBand`/`inRange` | `dosing/calcium.js:396,402-404`, `alkalinity.js:590-592`, `helpers.js:274,370` | raw `v>=min && v<=max`, recomputed 5+ places |
| `caBandOf`/`alkBandOf` | `calcium.js:134-140`, alkalinity equivalent | `stable/small/meaningful/significant` — a *rate* axis, but stored in a field literally named `band`, colliding with canon's term |
| Mg:Ca ratio check | `analytics/drift.js:299-308` (`computeIonicBalance`) | `ok: true/false` off ratio 2.7 — unrelated third threshold |
| `SAFE_BOUNDS` (see 5.2) | `findings.js:87-111` | base's own concept, but checked ad hoc |

`SAFE_BOUNDS` is **not** a stand-in for `classifyReading` — both base docs
keep "safe bounds" (harm points) conceptually distinct from the target-band
classification canon governs (dosing-spec §2's two-column table; canon's own
code-map at `reef-chemistry.md`-adjacent commentary labels `SAFE_BOUNDS` "harm
points" separately from `PARAM_DEFS`). See 5.2 for its own, smaller version of
the same defect.

**Footnote, not a row**: the two canon documents disagree with each other
about what `classifyReading` even does. `reef-chemistry.md:96-98` says it
"validates [band/alert consistency] on every call and returns
`insufficient-data` with a configuration error" — a validation duty.
`surfaces-and-messaging.md` §3, which defines `classifyReading`'s contract in
detail, never assigns it that job. Neither document is being asked to
reconcile against the other here, but whoever implements this function has
two canon sources telling it different things.

### 5.2 — `SAFE_BOUNDS` itself is checked ad hoc in ≥4 places despite being base's own authorized single concept

Base doc names `SAFE_BOUNDS` as one of the ten symbols to look for
(dosing-spec §10) — implying one definition, looked up. It is defined once
(`findings.js:87-111`) but the *comparison* `value < bounds.min || value >
bounds.max` is written out independently at `findings.js:232`,
`dosing/state.js:185,191`, `dosing/helpers.js:53-57`,
`ReadingConfirmation.jsx:45-53` — five inline re-implementations of the same
two-line check, already caught diverging at the boundary by the prior
sweep (doseStatus's inclusive vs. ReadingConfirmation's exclusive edge
handling on 6.9 dKH — see `.agent/items/TW-002.md` TW-002).

### 5.3 — Two live wizard states with zero authorization in either document

Neither base nor secondary mentions this; recorded here because it is the
single clearest case in this run of code that has moved past what either
document — including the base doc's own claim to have been "read out of the
running code... every state, guard and label verified against the build" —
actually describes.

`src/lib/dosing/state.js:458-472`, nested inside the guard for wizard-spec's
documented state #21 ("off-target"): when the level is out of band **and
moving** (`band !== "stable"` with nonzero trend), the code returns
`state: "recovering"` (tone `#1D6FA5`, short `"Coming back"`) or
`state: "worsening"` (tone `#A2621B`, short `"Moving away"`) — never falling
through to `off-target` at all in that case. Only a non-moving out-of-band
reading reaches the documented `off-target` state.

`git log --all --oneline -S "recovering" -- src/lib/dosing/state.js` → one
hit, the repo's root commit (`0637695`, "Tank Wizard converted to Vite
project"). This is not a recent addition — it predates every other commit in
the visible history, including whatever state the code was in on 2026-08-12
when the base doc claims to have verified every state against the build.
`grep -i "recovering\|worsening\|Coming back\|Moving away"` against both
`wizard-spec.txt` and `surfaces-and-messaging.md` → zero matches in either.

Net effect: the wizard actually has **17 states across 25 return points**, not
"15 distinct states... 23 returns" as documented, and wizard-spec §2 entry #21's
"FIRES WHEN" description ("the dose is right and the level is not") is
incomplete rather than merely silent elsewhere — it omits a real bifurcation
that changes the tone/label the keeper sees for the same underlying condition.

Aside from this, the order of the 23 documented entries **does match**,
sequentially, entry for entry — verified line range by line range against
`state.js`; no branch found out of its documented relative position.

### 5.4 — Base doc's own "4,000 tanks never reached them" claim is half-stale

wizard-spec §8.2 and handover note #2 say `worked`, `fell-short`, `overshot`,
`due` are all unreached without a staged plan, and that "4,000 randomly
generated tanks never reached them." `src/test/defects/dose-state-direction.test.js:33-90`
constructs a staged `activePlan` and **does** reach `fell-short` and
`overshot` (asserted directly, lines 85-90) — added since the base doc's
claimed read date. `worked` and `due` remain genuinely unreached: no
assertion of `state === 'worked'` or `state === 'due'` exists anywhere in
`src/` or `tests/`. Two of four, not four of four.

### 5.5 — Solution strength: base's central risk claim is contradicted by code as it stands

dosing-spec §4, in the handover notes, calls this "the single largest
correctness risk in the whole system... the app has no independent way to
check it... a wrong strength makes every figure wrong in a way no test can
catch." `strengthPlausible` (`src/lib/dosing/magnesium.js:34-51`) is generic
across all three elements and **is** called for each: alkalinity
(`alkalinity.js:8,647-648`), calcium (`calcium.js:8,382-383`), magnesium
(`helpers.js:8,744-746`). A coarse range-plausibility check exists for all
three, not none. This does not fully retire the risk — the check catches
values outside any real product's range, not a wrong-but-plausible value,
which is the failure mode dosing-spec is actually worried about and which
remains uncaught — but the specific claim "no independent way to check it" is
false as written.

### 5.6 — Analysis windows don't match the base doc's own numbers

dosing-spec §4: alkalinity window 7 days (extendable to 21); calcium/magnesium
14 days (extendable to 35). `STABILITY_RULES`
(`src/lib/stability-engine.js:42,45,46`): `alkalinity.windowDays = 14`,
`calcium.windowDays = 28`, `magnesium.windowDays = 28` — flat values, no
extend-on-insufficient-data logic found anywhere in the file (only a `stale`
flag when data falls outside the fixed window). Noise floors match (0.1/10/30)
but the window figures and the "extendable" mechanic do not.

### 5.7 — Magnesium gate and precipitation guard: structurally absent (canon §5/§9, base silent)

`reef-chemistry.md` §5: "If magnesium is below alert-low, the app does not
recommend alk or calcium corrections until magnesium is addressed" and "Never
recommend simultaneous alkalinity and calcium doses... separate by at least 4
hours." Neither base document mentions either rule. Confirmed absent from
code independently of the prior sweep's TW-005: `assessAlkalinity` and
`assessCalcium` take no magnesium-status or sibling-due-today parameter at all
(both functions' signatures, `alkalinity.js`/`calcium.js`); `grep -rn
"precipitat|separationHours|minSeparation" src/lib` finds only narrative
prose mentioning precipitation, zero gating logic. `src/test/spec/dosing/
magnesium-gate.test.js` and `precipitation-guard.test.js` already exist and
fail, documenting exactly this.

### 5.8 — Net volume: no gross/net distinction, no estimate helper

`reef-chemistry.md` §2 requires the app to hold gross and net volume
separately, offer a `net ≈ gross × 0.85` helper requiring explicit acceptance,
and label every dose derived from an estimated volume. Base docs are silent —
`dosing-spec.txt` discusses `effectPerMl` sourced "from the solution strength
in Setup" without ever distinguishing volume types. Code has exactly one
`settings.volumeL` field (`src/components/Setup.jsx`), UI copy for which was
relabeled "net volume" in commit `f7c23fb` ("Refuse to dose when net volume
unset") — the refusal-when-unset behaviour matches canon §9's requirement, but
there is no second (gross) field, no 0.85 helper, no distinction anywhere.
Matches open backlog item **TW-001** exactly (still `[approved][chem]`, not
yet implemented).

### 5.9 — Kit-change flag not threaded into consumption/trend engines

`reef-chemistry.md` §4: a recorded kit change must split the series; the app
"must not read the step change... as consumption or trend." Base docs are
silent (neither discusses test-kit changes). `kitChanges` exists as a
parameter (`src/lib/findings.js:134,169`) but is threaded only into
`computeCalibration` (`src/lib/analytics/icp-calibration.js:44,52`, ICP-vs-kit
comparison) — never passed into `assessAlkalinity`, `assessCalcium`, or
`assessMagnesium`, the three functions that compute the trend this rule is
about.

### 5.10 — Unit conversions: one matches, two are entirely unimplemented

`reef-chemistry.md` §1 (base silent throughout — dosing/wizard specs never
discuss display units, gallons, or temperature): dKH↔meq/L (1 meq/L = 2.8
dKH) matches exactly, `src/lib/analytics/calcification.js:21`. US gallon
(3.78541 L) and imperial gallon (4.54609 L) conversions: zero occurrences
anywhere in `src/` — confirmed unimplemented by the codebase's own
`src/test/spec/analytics/unit-conversions.test.js:15-16`. °C↔°F: zero
occurrences of Fahrenheit/Celsius conversion logic anywhere in `src/`, same
test file. The Ca:alk consumption ratio (canon: point value 7.15) is
implemented as a *band*, `CA_PER_DKH_LO/HI = 6.4/7.6`
(`src/lib/analytics/drift.js:276-277`, midpoint 7.0, not 7.15), used for
precipitation/anomaly discrimination in drift analysis — a different purpose
than reef-chemistry's worked example 3 (proactively surfacing an implied
calcium shortfall from measured alkalinity consumption, *before* the calcium
reading confirms it). **UNVERIFIED**: could not confirm whether worked example
3's specific proactive-surfacing behaviour is implemented anywhere in the
codebase under a different name; flagging rather than guessing.

### 5.11 — History truthfulness / persisted classification (canon §6, base silent)

Not rediscovered this run — restating with fresh confirmation because it's a
canon requirement with zero base-doc coverage. No reading stores its
classification or the target band in force at log time; every surface,
including history, reclassifies live against *today's* `customRanges`
(`App.jsx:377-381`). Matches open backlog item **TW-013** `[schema]`, not yet
implemented. `src/test/spec/history/target-change-immutability.test.js` fails,
confirming live.

### 5.12 — Manual override recording (canon §2/§6, base silent)

Canon: "recorded as a manual override, with both the recommended value and the
entered value... history must show both, always." `DoseChangeSheet`'s
`onSave` is invoked with only `(ml, date, time)` — the recommended figure
shown on the same sheet never reaches storage. Matches open backlog item
**TW-014** `[schema]`, not yet implemented.
`src/test/spec/history/override-visibility.test.js` fails, confirming live.

### 5.13 — Terminology registry and cross-surface parity (canon §5/§2, base silent)

Base docs never discuss vocabulary or cross-surface numeric agreement outside
the wizard itself — canon's terminology registry (one word per concept) and
the three-dosing-surfaces parity requirement are pure canon territory. Both
are violated live: forbidden words ("safe," "optimal," "healthier," "well
below your target") leak into rendered text (backlog **TW-015**), and the
manual-adjustment surface (`DoseChangeSheet`) has no §6 rail check at all
(backlog **TW-004**) while `assessCalcium`'s own displayed dose and staged
plan's first day disagree for the identical correction (backlog **TW-006**).
Not rediscovered this run; restated because both are canon-only requirements
the base docs have no opinion on, and both are currently open, unimplemented
backlog items.

---

## 6. Test plan sketch

One line each, for every enforcement claim with nothing behind it. Not written.

- **`tests/husbandry.js` equivalent**: assert `PARAM_DEFS`, `SAFE_BOUNDS`,
  `CORRECTION_MAX_RATE`/`SAFE_DAILY_RISE`, `DOSE_STEP_CAP`,
  `BRACKET_MEMORY_DAYS`, `DOSE_DRIFT_TRIGGER` against a single source-cited
  table (the one in dosing-spec §2/§3/§5/§6, or its successor once §3.2 above
  is decided); fail the build on any value drift.
- **Settle-window formula**: assert `settleWindow(key, dailySupply, settings)`
  against the closed-form formula in dosing-spec §5 directly (not just
  incidentally through a parity fixture), including its floor/ceiling clamps
  per element.
- **Bracketing / step cap**: assert `bracketDose`/`capDoseStep` against the
  worked mechanics in dosing-spec §6 — a rate that fell at dose X and rose at
  dose Y must return a value strictly between them; a step must never exceed
  25% except when out-of-range-and-worsening.
- **`tests/matrix.js` equivalent**: drive `doseStatus` through all 17 live
  states (not 15) via constructed inputs, asserting first-match-wins order —
  including a fixture that reaches `worked` and `due` via a staged
  `activePlan`, which nothing today does.
- **`tests/summary.js` equivalent**: assert the tank summary and reading
  confirmation never emit language contradicting the wizard's current state
  for the same element on the same render.
- **`tests/sim/surfaces.js` equivalent**: a multi-year simulated-tank harness
  (dosing-spec references one existing; none found) that runs the real
  engines and asserts no safe-bounds excursion goes unmentioned and no
  correction stacks on a stale reading.
- **§9.1 stability grading**: once/if grading changes, a test that a level
  outside its band and moving further out never grades `"stable"` — paired
  explicitly with a test that the dose-gap out-of-band halving is removed in
  the same change (dosing-spec's own instruction).
- **`recovering`/`worsening`**: a test asserting these two states exist,
  documenting their trigger condition and tone — currently nothing prevents
  either from silently disappearing in a refactor, since no spec names them.

---

## Appendix — full topic sweep (dosing-spec §1–10, wizard-spec §1–9)

Everything above is drawn from this pass; listed here for traceability. Topics
not already broken out as their own section above:

- **§1 dose-vs-correction distinction** (dosing-spec §1, wizard-spec §6):
  AGREE — `maintenanceDose` (steady-state) vs. `proposeCorrection`/plan
  (moving) are cleanly separated in code exactly as both base docs describe;
  canon doesn't use this framing explicitly but doesn't contradict it either
  (GAP-IN-SECONDARY, low stakes).
- **§4 how maintenanceDose is derived** (fit slope, subtract supply, exclude
  disturbances): AGREE, base+code; canon §8 covers a related but distinct
  concept (minimum-evidence gating for consumption rate, ≥3 readings over
  ≥6 days) which is its own, separately-tracked gap — `src/test/spec/dosing/
  refusals.test.js` and `min-evidence.test.js` exist and are the right place
  to look; not re-litigated here since backlog **TW-007** already covers the
  round-before-compare and evidence-gate defects.
- **§8 "what the app will not do" (dosing) vs. §9 "must refuse to" (canon)**:
  largely disjoint lists by design — base's seven items are dose-change-
  specific arithmetic guards (3-reading minimum for a *dose change*, settle
  window, magnesium exemption, in-band correction refusal, stale reading, rate
  ceiling, 25% step cap); canon's nine are broader refusal gates (net volume,
  §6 rail, simultaneous dosing, magnesium gate, 2-day consumption minimum,
  kit-change boundary, gross volume, 3-reading trend-extrapolation minimum,
  silent defaults). Only "respect the rate ceiling" is stated by both, in
  compatible terms. Every canon-only item on this list is broken out in
  §5 above where code diverges; no base-only item on this list is
  contradicted by canon anywhere.
