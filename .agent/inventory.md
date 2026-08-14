# Tank Wizard — Inventory

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

Read-only survey. No code changed, no branch, no PR.

Method: read `AGENTS.md` and all three files in `docs/spec/`, then swept `src/`
(16,623 lines across 58 files) with five parallel Explore agents covering
dosing, classification/messaging, storage/shell, UI surfaces, and
duplication/dead code. Every claim below carries a file:line. Claims marked
**[verified]** were re-checked directly rather than taken from an agent.

One thing to know before reading the rest: **the repo has no tests, no linter,
and no typechecker.** `package.json` has only `dev`, `build`, `preview`.
`node_modules/.bin` contains no vitest, jest, playwright, eslint or tsc.
There is no `tests/` directory. `docs/spec/app-contract.md:9` declares
"Vitest + React Testing Library, axe-core" — none of the three is installed.
`.agent/budgets.json` sets a 95% coverage floor for chemistry modules against a
suite that does not exist. So nothing in this report was caught by tooling,
and nothing in this app is currently protected against regression. **[verified]**

`npm run build` succeeds. Main bundle is **288.5 kB gzip against a 180 kB
budget**, total initial ~297 kB against 250 kB (`.agent/budgets.json`). **[verified]**

---

## 1. What exists

### Screens (six tabs, `src/lib/constants.js:40-47`)

There is no router. `tab` is a single string in state (`src/App.jsx:289`) switched
by `&&` conditionals at `src/App.jsx:1231-1304`. Not persisted, not in the URL,
so reload always lands on Dashboard and the back button does not navigate.

| Tab | File | What it is |
|---|---|---|
| Dashboard | `src/components/Dashboard.jsx:23` | Overview card, today panel, out-of-range chips, 8 parameter cards, reminders |
| Test Lab | `src/components/WaterLog.jsx:48` | Reading entry, past readings with inline edit, ICP panel, historical import |
| Dosing | `src/components/DosingWizard.jsx:192` | Three element tiles + one expanded assessment card |
| Insights | `src/components/Insights.jsx:84` | Demand, control quality, Ca/alk balance, skeleton mass, nutrients, N:P, dose-strength calibration, ICP review, salt baseline |
| Tasks | `src/components/Tasks.jsx:15` | Reminder list, water changes, completion calendar |
| Setup | `src/components/Setup.jsx:129` | Volume, test kits, dose + product strength, correction calculator, lighting log, backup/restore/CSV |

### Major components

File names rarely match contents. This is worth internalising before navigating:

- `src/components/ErrorBoundary.jsx:103` — `AlkAssessmentBlock`, the **full dose
  assessment UI** (headline, staged plan, one-off correction, "Set the dose"
  button, figures table, solved-strength block). Not an error boundary.
- `src/components/DoseExpectation.jsx` — the **shared design system**
  (`Btn`, `Field`, `Card`, `SectionTitle`, `inputCls`, `ParamCard`, `FindingList`).
  Not about dose expectations.
- `src/components/AllParametersSheet.jsx:17` — `TestLab`, the reading-entry list.
- `src/components/TodayPanel.jsx` — nine exports, including `OverviewCard`,
  `RemindersPanel`, `StabilityStrip`, `ScoreBreakdown`, `Briefing`, `SnoozeSheet`.
- `src/lib/dosing/magnesium.js` — 55 lines, contains **no magnesium assessment**.
  It holds `strengthPlausible`, which alkalinity and calcium import from it
  (`alkalinity.js:8`, `calcium.js:8`).

Other components: `ReadingConfirmation.jsx` (post-log modal + the reading message
engine), `IcpConfirmation.jsx`, `TaskCompletion.jsx`, `DoseChangeSheet.jsx`
(manual dose entry), `LogReadingSheet.jsx` (quick log), `ReadingContext.jsx`
(sparkline geometry), `ZoomableChart.jsx` (recharts wrapper), `LaunchAnimation.jsx`
(reef intro splash), `icons.jsx` (32 inline SVGs replacing lucide-react).

Every component file is reachable from `App.jsx`. There are no orphaned
component files — the dead code is at export and branch level (§3).

---

## 2. Where the important logic lives

The spec (`docs/spec/surfaces-and-messaging.md:19-24`) names five functions that
must each have exactly one implementation. **None of the five exists.** **[verified]**
`grep -rn "classifyReading\|calculateDose\|applyRails\|messageFor\|consumptionRate" src/`
returns zero hits.

| Concern | Spec requires | What actually exists |
|---|---|---|
| Band classification | `classifyReading(param, value, targets)` | `paramStatus(def, value)` — `src/lib/dates.js:24-29` — returns `"low"`/`"high"`/`"ok"`/`"unknown"`. Plus ~48 independent decision sites (§4) |
| Dose calculation | `calculateDose(...)` | Four independent engines (§4). Live one: `assessAlkalinity`/`assessCalcium`/`assessMagnesium` |
| Rail enforcement | `applyRails(...)` | No such function. Two disagreeing caps tables: `src/lib/analytics/safe-rate.js:27` and `src/lib/analytics/correction.js:7-36` |
| Consumption rate | `consumptionRate(...)` | Four implementations, three of which violate the minimum-interval rules |
| Message selection | `messageFor(classification, context)` | Prose generated in 12+ files |

**Dose calculation** — `src/lib/dosing/alkalinity.js:419` (`assessAlkalinity`),
`src/lib/dosing/calcium.js:195` (`assessCalcium`),
`src/lib/dosing/helpers.js:532` (`assessMagnesium`, 409 lines, in the file named
"helpers"). Core formula in all three:
`maintenanceDose = consumption / effectPerMl` (`alkalinity.js:626`,
`calcium.js:342`, `helpers.js:687`). These are what the UI acts on:
`src/App.jsx:150-152` → `src/components/DosingWizard.jsx:252` →
`src/components/ErrorBoundary.jsx:303-338`.

**Band classification** — `src/lib/dates.js:24-29`, 29 lines including blanks.

**Unit conversion** — barely exists. `1 meq/L = 2.8 dKH` appears once and
correctly at `src/lib/analytics/calcification.js:21`. **Gallons do not exist**:
`3.78541` and `4.54609` appear nowhere in `src/`. **Temperature does not exist**
as a tracked parameter at all. The app is litres-only with no unit selector.

**Storage and persistence** — `src/lib/storage.js` (106 lines), `localStorage`
only, no IndexedDB. 23 application keys, all written from `src/App.jsx:388-1121`.
Backup/restore in `src/lib/backup.jsx`.

**The dosing wizard** — `src/components/DosingWizard.jsx`. It is not a wizard:
no steps, no `step` state, no next/back. See §3.

**Manual dose entry** — `src/components/DoseChangeSheet.jsx:16` (free number
input, opened from `ErrorBoundary.jsx:267`), and a second, independent path at
`src/components/Setup.jsx:191-205`.

**The test log** — three surfaces all calling `addReading` (`src/App.jsx:1000`):
`AllParametersSheet.jsx:33`, `LogReadingSheet.jsx:22`, `TodayPanel.jsx:26`.
The message shown afterwards comes from `readingVerdict`
(`src/components/ReadingConfirmation.jsx:20`).

### What does not exist at all

These are the most valuable lines in this report:

- **No net-volume field.** One setting, `volumeL`, labelled `"Volume (L)"`
  (`src/components/Setup.jsx:134`) with no helper text. The words "net" and
  "gross" appear nowhere in the UI. The only mention anywhere is prose inside a
  finding: `src/lib/findings.js:363`. No `net ≈ gross × 0.85` helper, no
  estimated-volume flag, no labelling of doses derived from an estimate
  (`docs/spec/reef-chemistry.md:45-57` requires all three).
- **No alert thresholds.** `PARAM_DEFS` (`src/lib/constants.js:25-37`) carries
  only `min`, `max`, `step`, `freqDays`, `color`. There is no `target`, no band
  width, and no alert-low/alert-high anywhere in `src/`. The spec's model
  (target ± band, then separate alert thresholds,
  `docs/spec/reef-chemistry.md:77-91`) is not implemented — the app stores an
  absolute min/max pair instead, so `drifting`, `alert-low` and `alert-high` are
  unrepresentable.
- **No magnesium gate.** `assessAlkalinity` and `assessCalcium` never read a
  magnesium reading. The only magnesium gating is a sentence-ordering rule in
  narrative text at `src/lib/narrative-engine.js:1211-1213`, against a hardcoded
  1250. `docs/spec/reef-chemistry.md:138-141` and `:207` unimplemented.
- **No precipitation guard.** No dose scheduling, no time-of-day assignment, no
  ≥4-hour separation. `src/App.jsx:739-777` writes each element's dose
  independently with no cross-element check.
  `docs/spec/reef-chemistry.md:143-145` unimplemented.
- **No kit-change handling in any consumption or dosing path.** `kitChanges` is
  threaded through `src/App.jsx:136,643,966,1035` but no file in
  `src/lib/dosing/` or `src/lib/analytics/consumption.js` reads it.
  `docs/spec/reef-chemistry.md:118-121`, `:196`, `:209` unimplemented.
- **No doser-increment setting.** Every dose is rounded to 0.1 mL by
  `Math.round` in four separate places.
- **No storage schema version and no migrations.** `grep -rniE 'schema|migrat' src/`
  returns only English prose in comments. `tw.schema.version`
  (`docs/spec/app-contract.md:14`) does not exist.
- **No tests, linter, or typechecker.** **[verified]**

---

## 3. What's incomplete

There are **no `TODO`, `FIXME`, `XXX` or `HACK` markers anywhere in `src/`**.
The incompleteness is unmarked, which is why it survived.

### Runtime crashes — code that throws the moment it runs

**`src/components/Tasks.jsx` — three undeclared identifiers.** **[verified]**
- `:113` and `:115` reference `wcPreview`. The memo is named `preview` (`:27`).
- `:118` calls `logWaterChange`. The function is `confirmWaterChange` (`:33`).
- `:195` calls `onComplete`, which is not among the props destructured at `:15-20`.

`ReferenceError` fires the instant `wcOpen` becomes true — i.e. on tapping "Log
change" on the water-change reminder (`:147`). The panel crashes into
`TabErrorBoundary`. `preview` and `confirmWaterChange` are therefore both dead.
**Water-change logging is broken.**

### Features that render but do nothing

**The entire correction feature is unreachable.** **[verified]**
`src/components/DosingWizard.jsx:268` passes `def={active.def}`. `active` comes
from the `items` array at `:199-203`, whose objects are `{key, a, apply, clear,
effect}` — there is no `def` key. So `def` is always `undefined` and
`CorrectionPanel` returns null at `:104` on every render. Dead as a result: the
"bring it back to range" offer, the gentle/steady/quick pace picker (`:165-178`),
"Start the correction" (`:186`), "Cancel and go back" (`:138`), and the
completion button (`:115`). `App.jsx:1261-1262` wires all three handlers; none
can fire. The fix is one word — `activeDef` is already computed and in scope at
`:212`.

Second-order: `ReadingConfirmation.jsx:63` and `:295` tell the user to "set the
dose back in the Dosing Wizard", and `:568` renders a button that navigates
there — to a control that does not render.

**`src/lib/narrative-engine.js:854-1295` — ~440 lines of prose generator, dead.**
`buildOverview` assembles `paras` (paragraphs 1-5, foundation trio, nutrients,
control quality, pH, cadence, "if you do one thing this week") and returns it as
`overview.paragraphs` at `:1343`. **Nothing reads it.** **[verified]**
`OverviewCard` (`src/components/TodayPanel.jsx:617-695`) reads only
`overview.score` (`:622`) and `overview.headline` (`:645`). `urgentCount`
(`:1345`) and `watchCount` (`:1346`) are likewise unread.

**`src/lib/dosing/calcium.js:541-547` is unreachable.** **[verified]** Its guard is a
strict subset of the guard at `:520-522` (it adds `inRange` and
`!confirmedByFit`). Two editing rounds each added a "small trend waits a week"
rule; the later, more careful one never runs. Magnesium has the correct single
copy at `helpers.js:846`, so **magnesium honours `confirmedByFit` and calcium
does not.**

**`src/lib/dosing/alkalinity.js:502-512` — the "confounding events" block is
inert.** `eventStamps` is declared empty at `:502` and never pushed to, so
`lastEvent` is always null and `cutoff` always equals `windowStart`.

### Silently disabled guards

- **`src/lib/findings.js:452`** — `if (!(Math.abs(reg.slope) > (reg.se || 0) * 2)) continue;`
  `regressionWithError` returns **`seSlope`**, not `se`
  (`src/lib/analytics/measurement-noise.js:39`). **[verified]** `reg.se` is
  `undefined`, so the guard collapses to `|slope| > 0` and passes for every
  non-zero slope. The comment at `:450-451` describes a significance test that
  has never run.
- **`src/lib/findings.js:610`** — `kitSigma(def) * 2`. The signature is
  `kitSigma(key, settings)` (`measurement-noise.js:14`). **[verified]** Passing a def
  object yields `KIT_SIGMA[object]` → `undefined` → `0`. The noise floor is
  always zero, defeating the guard at `:611` and both tests at `:613,:619`.
  Every other call site passes a key string correctly (`Setup.jsx:62,248`).
- **`src/lib/analytics/drift.js:125`** — `cfg && cfg.effect ? cfg.effect(settings) : 0`.
  `DOSE_ELEMENTS` (`consumption.js:84-94`) has **no `effect` field**. **[verified]**
  The expression is always 0, so `settleWindow` always returns its floor and the
  adaptive settle window described at `:112-118` never runs. The comment
  immediately above documents fixing a crash here — the fix defused the feature.
- **`src/lib/dosing/helpers.js:508`** — `dosePlausible` returns `true` when
  volume is missing. The implausibility guard is disabled exactly when volume is
  unset.
- **`src/lib/dosing/magnesium.js:48`** — `strengthPlausible` returns `{ok: true}`
  for a zero or non-finite strength.

### Dead props and no-op handlers

- `src/components/Insights.jsx:84-89` — **16 props destructured and never used**,
  all genuinely wired from `App.jsx:1269-1278`: `onApplyAlkDose`,
  `onLogCorrection`, `onApplyEffect`, `alkPlan`, `onClearAlkPlan`, `corrections`,
  and the calcium/magnesium equivalents, plus `lighting`, `onDismissFinding`.
  Leftovers from when the dose UI lived on this tab.
- `src/components/Dashboard.jsx:23-24` — 5-8 unused props including `dueList`
  (itself hardcoded to `[]` at `src/App.jsx:950` with the comment "nothing
  renders it any more"), `saveRange`, `resetRange`, `customRanges`, `icps`.
- `src/components/Tasks.jsx:15-17` — 5 unused props.
- `src/App.jsx:830` `deleteCorrection` and `:1111` `markTaskDone` — defined,
  never wired.
- `src/components/DoseExpectation.jsx:332-336` — `Btn` defines `primary`,
  `ghost`, `danger`. `src/components/ReadingConfirmation.jsx:566` passes
  `variant="solid"`. **[verified]** `styles["solid"]` is `undefined`, so the
  celebratory "Set the dose back" button renders with `undefined` in its
  className — no background, white-on-white risk.

### Other

- 51 exports in `src/lib/` are never imported by another module.
- `src/lib/analytics/measurement-noise.js:1` and `time-of-day.js:1` import a
  React SVG icon component `X` into pure-maths modules, then shadow it with
  `const X = xs.map(...)`.
- `original-artifact.html` — 965 KB at the repo root, referenced by nothing, not
  gitignored.

---

## 4. Signs of conflicting edits

This is the dominant characteristic of the codebase. The pattern throughout: a
feature was reimplemented, the new version was wired up, the old version was
left running, and a comment was written describing a cleanup that did not happen.

### 4a. Four dose engines

| Engine | Entry point | Live? |
|---|---|---|
| **A** — `assessAlkalinity`/`assessCalcium`/`assessMagnesium` | `alkalinity.js:419`, `calcium.js:195`, `helpers.js:532` | **LIVE.** `App.jsx:150-152` → the Dosing tab. This is what the user acts on |
| **B** — `computeDoseAdvice`/`assessDrift`/`computeDoseCalc` | `drift.js:59`, `:21`, `:240` | **Dead at both UI call sites.** `Dashboard.jsx:298` and `Insights.jsx:108` assign `doseAdvice` and never reference it again. Only live path is the strength preview, `corrected-strength.js:43-50` |
| **C** — `computeConsumption` | `consumption.js:9` | Partly live — its `consumption` field feeds Insights. Its `recommendedMl` and `adjustMl` (`:28-29`) are read by nothing |
| **D** — `proposeCorrection` | `helpers.js:404` | Live via `App.jsx:187-189`, but its only UI surface is the unreachable `CorrectionPanel` |

A and B disagree on nearly every threshold for the same tank on the same day:

| Question | Engine A | Engine B |
|---|---|---|
| alkalinity "stable" | <0.10 dKH/day = 0.70/wk (`alkalinity.js:29`) | ≤0.5 dKH/wk (`drift.js:16`) |
| wait after a dose change | 24h then 48h (`alkalinity.js:35-36`) | 7 days (`drift.js:45`) |
| calcium settle | 7 days (`calcium.js:33`) | 14 days (`drift.js:46`) |
| calcium "meaningful" | 20 ppm/wk (`calcium.js:30`) | 15 ppm (`drift.js:46`), or 10 (`drift.js:17`) |
| chase magnesium by dose | forbidden (`helpers.js:476-486`) | supported, 40 ppm (`drift.js:51`) |
| step cap | 25% (`helpers.js:49`) | 10 or 15% (`drift.js:211`) |

`drift.js:112-118` documents the disagreement in a comment ("a third answer") and
keeps all three.

**Live version: A.** Everything the user sees and acts on in the Dosing tab comes
from A. B is dead weight computed on every Dashboard and Insights render.

### 4b. Two effect-per-mL solvers, both live, shown side by side

`solveAlkEffect`/`solveSlowEffect` (`alkalinity.js:71`, `calcium.js:58`) use a
|ΔD|-weighted mean; `calibrateDoseStrength` (`dose-strength.js:19`) uses a
median over a fixed ±21-day window with different minimums. Both are displayed
simultaneously: the median version drives an *act*-severity finding at
`findings.js:301-311`; the weighted version drives the "Apply" button at
`ErrorBoundary.jsx:311-338`. **Two different numbers with two different apply
buttons for one quantity.** Both live.

### 4c. Three kit-precision tables, all live inside one function

- `KIT_PRECISION` — `findings.js:53-63` — alk 0.10-0.20, Ca 5-15, Mg 25-30
- `KIT_SIGMA` — `measurement-noise.js:10-13` — alk 0.05, Ca 8, Mg 15
- `STABILITY_RULES[*].noiseFloor` — `stability-engine.js:42-53` — alk 0.1, Ca 10, Mg 30

`buildFindings` uses all three: `findings.js:83` (`kitNoise`), `:460`
(`noiseFloor`), `:610` (`kitSigma`, itself broken). Three answers to "is this
movement real?" in one pass. **No single live version.**

### 4d. Two score calculations that can disagree on screen

`explainScore` (`narrative-engine.js:81-165`) and the inline score in
`buildOverview` (`:786-843`). The comment at `:93-95` says explainScore "Must
mirror the score exactly." It does not: `buildOverview` applies an ammonia clamp
(`:823-824`) and `safetyCapFor` (`:834`) that `explainScore` computes but does
not apply. They are rendered **together** — the number at
`TodayPanel.jsx:634`, its own working at `:665`. **Both live, and they can
contradict each other in the same card.**

### 4e. Duplicates, condensed

- **Consumption**: four implementations, two water-change-aware, two not
  (`consumption.js:25`, `consumption.js:166`, `demand.js:70`, and the dosing
  engines' `supplied − trend`). `demand.js:50-68` is a near-line-for-line copy of
  `consumption.js:144-157`.
- **Stability**: `computeStability` (`stability-engine.js:83`) and
  `computeControl` (`reading-meaning.js:89`). `reading-meaning.js:99-113`
  duplicates `stability-engine.js:111-124` verbatim, then grades by rate where
  the other grades by spread. Both live.
- **Regression**: three least-squares implementations (`time-of-day.js:56`,
  `measurement-noise.js:21`, `alkalinity.js:153`); `measurement-noise.js:26-33`
  is byte-identical to `time-of-day.js:61-68`.
- **Timestamps**: `dayPos` (`time-of-day.js:29`) and `alkStamp`
  (`alkalinity.js:49`) — identical formula, one cached. Dosing uses `alkStamp`,
  everything else uses `dayPos`.
- **Ca:alk ratio**: five values in the codebase — `6.77` (`water-changes.js:34`),
  `7.14` (`:52`), `6.8` (`consumption.js:90`, user-facing), `6.75`
  (`findings.js:387`, user-facing), band `6.4-7.6` with a 7.0 midpoint
  (`drift.js:276-277`, `:331`). **The spec's 7.15 appears nowhere.**
- **Staging fractions**: three unnamed sets for the same rule —
  `alkalinity.js:845-846` (0.9/0.7/0.55), `calcium.js:568-569` (0.85/0.6/0.5),
  `helpers.js:895-896` (0.8/0.55/0.45) — each duplicated again inside its own
  staged-plan loop.

### 4f. Copy-paste defects

- **`src/lib/dosing/state.js:322-323`** **[verified]**:
  ```js
  const same = (a.trendPerDay < 0 && a.action === "increase")
    || (a.trendPerDay > 0 && a.action === "increase");
  ```
  Both disjuncts test `"increase"`. The second was meant to be `"decrease"`. See
  §6 — this one produces wrong advice.
- **`src/lib/dosing/helpers.js:672`** **[verified]** — inside `assessMagnesium`:
  `directionConsistent(intervals, CA_TREND.stable * 0.5)`. `CA_TREND.stable` is
  5 ppm; `MG_TREND.stable` is 10. Copied verbatim from `calcium.js:321`, and
  `CA_TREND` is imported into `helpers.js:7` for this single wrong use.
  Magnesium's flat-interval threshold is half what it should be.
- **`src/lib/dosing/corrected-strength.js:55`** —
  `if (bB && bA && bB.status === "ok" && aA && bA.status === "ok")`. `aA` is an
  unrelated `computeDoseAdvice` result from `:44`, always truthy. Leftover from
  copying the `cB && cA` pattern at `:35`.
- **`src/lib/dosing/helpers.js:192`** **[verified]** —
  `direction: (Number(c.amount) || 0) >= 0 ? "up" : "down"`. `logCorrection`
  (`App.jsx:811-813`) writes `{element, ml, direction}` — **no `amount` field
  exists anywhere**. So `direction` is hardcoded to `"up"` forever, and
  `state.js:263-266,366-377` branch on it. The comment at `helpers.js:157`
  documents fixing exactly this class of bug on the sibling fields and misses
  this line.

### 4g. Comments describing behaviour the code no longer has

- **`src/lib/dosing/alkalinity.js:332-340`** says *"Alkalinity does NOT have this
  block — it has no safeDoseBand call of its own and never sets out.rateLimited"*.
  `assessAlkalinity` calls `rateLimitDose` at `:853`. The comment at `:848-852`,
  same file, says the opposite. Two contradictory comments about one line.
- **`src/lib/dosing/magnesium.js:53-55`** — the file **ends on a comment with no
  code under it**, describing `dosePlausible`, which lives at `helpers.js:506`.
- **`src/lib/analytics/water-changes.js:70-71`** — an `addDays` doc-comment sits
  above `fmtFriendly`, which formats a weekday. `:77` ends the file on a
  "Water change dilution model" header with nothing after it; the model is at
  `consumption.js:190`.
- **`src/lib/dosing/calcium.js:236-238`** says `out.previous` was "Removed".
  `previous: null` is still at `:200`. `alkalinity.js:391-396` says `out.events`
  was removed; `events: []` is still at `alkalinity.js:428`, `calcium.js:204`,
  `helpers.js:541`.
- **`src/lib/dosing/calcium.js:351-358`** — two comment blocks **about
  magnesium**, inside `assessCalcium`, describing a cap that does not exist.
- **`src/lib/narrative-engine.js:1093-1095`** — *"Below a user-set target of 1450
  it may still be 1400, which is a perfectly ordinary level"*. `PARAM_DEFS`
  magnesium is now `1250-1400` (`constants.js:29`), and `constants.js:6-16`
  documents that 1450-1500 was removed as wrong.
- **`src/App.jsx:1193`** **[verified]** — the sidebar "Target profile" renders
  **`Ca 450–500 · Mg 1450–1500`**, hardcoded, ignoring both `PARAM_DEFS`
  (400-450 / 1250-1400) and `customRanges`. `constants.js:5-16` explicitly
  describes those exact numbers as the wrong values that were corrected because
  "the app was steering people away from correct values." The nav panel still
  displays them.

### 4h. Config nothing reads / two prefixes for one dataset

- **`src/lib/storage.js:5` vs `:37`** — two localStorage prefixes,
  `"reefconsole:"` and `"danstank:"`. `saveKey` (`:83-86`) writes **both** on
  every save. Every value is stored twice under two names, roughly doubling
  quota use on a device where ICP photos are already the stated quota risk
  (`:101`).
- **`src/lib/reminders.js:20`** — magnesium reminder `intervalDays: 7` against
  `freqDays: 21` in `constants.js:29`; phosphate `intervalDays: 3` against
  `freqDays: 7`. The two drive different surfaces and disagree.
- `src/App.jsx:950` — `const dueList = []`, hardcoded, still passed to
  `Dashboard` and still destructured there.
- **Circular imports**: `narrative-engine.js` → `components/DoseExpectation.jsx`
  → `components/ErrorBoundary.jsx` → `lib/dosing/alkalinity.js` →
  `lib/dosing/helpers.js` → `lib/findings.js` → back to `narrative-engine.js`.
  Also a three-way cycle among `alkalinity.js` ↔ `calcium.js` ↔ `helpers.js`.
  These resolve today only because every binding is read at call time; a
  module-level `const` table read during evaluation inside the cycle would be
  `undefined`.

---

## 5. Distance from the spec

Biggest first.

1. **325 fabricated readings are merged into the user's real data,
   indistinguishably.** **[verified]** `src/lib/seed-data.js:3` is one line holding
   `HISTORICAL_DATA` — ~400 invented readings across 8 parameters dated
   2026-02-13 to 2026-08-09. `src/App.jsx:452-464` pushes them into `readings` as
   `{id: uid(), param, value, date, note: ""}` — **no seed flag, no source
   marker** — and saves to the real key. Three more seeders follow the same
   pattern (ICP `App.jsx:471-480`, water changes `:485-495`, lighting `:497-506`).
   They cannot be un-seeded, they feed every engine, and they are written into
   the user's backup file and CSV export. Nothing in the spec contemplates this.

2. **No net-volume field; `77` is hardcoded as a silent fallback in 15 places.**
   **[verified]** `docs/spec/reef-chemistry.md:51` — "If net volume is unset, the app
   **refuses to calculate any dose**". The code does the opposite:
   `DEFAULT_SETTINGS.volumeL = 77` (`water-changes.js:29`) is spread into
   settings by six analytics modules, and `|| 77` is written literally at
   `Setup.jsx:26,59,70,73,114,172,355,366`, `Insights.jsx:118,430`,
   `Tasks.jsx:30,38,115`, `drift.js:246`, `dose-strength.js:23`.
   `Setup.jsx:73` persists `parseFloat(vol) || 77`, so clearing the volume field
   silently writes Dan's tank volume into settings. Doses are computed on gross
   volume with no displacement adjustment — typically a 10-20% systematic error
   on every millilitre the app produces.

3. **The band model in the spec is not implemented.** `docs/spec/reef-chemistry.md:77-91`
   defines target ± band width, plus separate alert thresholds. `PARAM_DEFS`
   (`constants.js:25-37`) stores an absolute `min`/`max` pair and nothing else.
   Consequences: no `target` value exists, so "target" in messaging means the
   band edge; `drifting`, `alert-low` and `alert-high` are unrepresentable; the
   spec's Mg band (±50) is 100 wide but the code's is 150; and the validation the
   spec mandates (`reef-chemistry.md:95-98` — `classifyReading` returns
   `insufficient-data` on inconsistent config) does not exist. An inverted band
   can enter through backup restore (`backup.jsx:164-166`) with no check at all.

4. **Seven classification vocabularies across ~48 independent decision sites.**
   The spec allows exactly one function returning one of seven values
   (`surfaces-and-messaging.md:69-79`). What exists: `paramStatus`'s
   `low/high/ok/unknown` (`dates.js:24`); a separate `SAFE_BOUNDS` "unsafe" test
   with its own thresholds (`findings.js:87-111`, re-tested at
   `ReadingConfirmation.jsx:46` and `:150`, `state.js:191`, `helpers.js:54`);
   `above/below/inRange` computed on a **fitted** value rather than the stored
   reading (`alkalinity.js:590-592`, `calcium.js:402-404`) — same reading, two
   different bands by construction; `tight/moderate/loose`
   (`stability-engine.js:79`); `green/amber/red` (`:126-132`);
   `good/ok/poor` (`rate-analysis.js:49`);
   `sliding/loose/dialled/controlled/steady-off/drifting`
   (`reading-meaning.js:196-220`); `icpStatus` (`icp-reference.js:89-96`); and a
   20-state dosing machine in `state.js`.

5. **Rails: partial, inconsistent, and two of four dose paths have none.**
   `docs/spec/reef-chemistry.md:154-160` requires alk 0.5, Ca 25, Mg 100,
   salinity 0.5 ppt, temp 0.5 °C, enforced in logic. Reality: two tables that
   disagree — `safe-rate.js:27` (alk 0.5, Ca 20, **Mg 25**) and `correction.js`
   (alk 0.5, Ca 20, **Mg 100**). **Salinity and temperature have no rail at all;
   temperature is not a tracked parameter.** Enforcement exists only on the
   engine path (`alkalinity.js:348-361`, `:319-327` and siblings);
   `computeDoseCalc` and `computeConsumption` apply no rail. Note the Ca and Mg
   values are *tighter* than spec, so they are not overdose risks — but they are
   not the spec's numbers, and the internal 25-vs-100 disagreement is a real
   defect.

6. **Consumption-rate minimums violated in six of eleven paths.**
   `reef-chemistry.md:194,208,211` requires ≥3 readings spanning ≥6 days, and no
   rate from readings <2 days apart. `computeElementConsumption`
   (`consumption.js:115-128`), `computeDemandSeries` and `calibrateDoseStrength`
   comply. But the three live dosing engines produce `consumption` and
   `maintenanceDose` from **2 readings with a sub-day span**
   (`alkalinity.js:564-572`, `calcium.js:305-314`, `helpers.js:656-665`), and
   `computeRates` (`rate-analysis.js:30`) explicitly floors the gap at
   **half a day**.

7. **Round-last rule violated; round-down rule absent.**
   `reef-chemistry.md:181` — "Never round an intermediate value."
   `alkalinity.js:343` rounds to 0.1 mL *before* the rate-limit clamp at
   `:348-353`; `:272`, `:310-311`, `:325-326` round three more times
   mid-pipeline. `rate-analysis.js:43` and `drift.js:30` grade on the **rounded,
   displayed** value, with `rate-analysis.js:41-42` documenting this as
   deliberate — a direct violation of `surfaces-and-messaging.md:87`
   ("Comparisons happen at stored precision"). `reef-chemistry.md:183`
   ("Round down on the first correction") is unimplemented: every dose uses
   round-to-nearest.

8. **No history truthfulness.** `surfaces-and-messaging.md:142-149` requires a
   log entry to record the classification, recommendation and targets *in force
   at the time*. The persisted `dose-log` row is `{id, date, time, ml, element,
   note}` (`App.jsx:390-397`). No classification, no targets, and — critically —
   **no recommended value**. `ErrorBoundary.jsx:253-265` passes nine fields to
   `onApplyDose` and `a.recommendedDose` is not among them. After the fact there
   is no way to tell whether a recorded 12 mL was the app's advice or a user
   override of a 9.6 mL suggestion. `surfaces-and-messaging.md:57-59` (manual
   override recorded as recommended-vs-dosed, "History must show both") is
   entirely unimplemented.

9. **Manual dose entry has no rail warning.** `surfaces-and-messaging.md:54-56`
   requires an explicit warning stating the rail and the overage, plus
   confirmation. `DoseChangeSheet.jsx:46-52` offers only a deviation note —
   typing 40 mL against a 9.6 mL suggestion produces the words **"which is
   fine"** and no rail check. `SAFE_DAILY_RISE` is imported in
   `ErrorBoundary.jsx:5` but never compared against the typed value. The second
   manual path (`Setup.jsx:191-205`) has no check either.

10. **Terminology: the banned vocabulary is used throughout.**
    `surfaces-and-messaging.md:124-136` and `:137` ("The app never uses 'safe' or
    'unsafe' about any reading"). Present anyway: "dangerously low/high"
    (`findings.js:201,247`, `ReadingConfirmation.jsx:51,153,352`,
    `state.js:198-199`); "safe" (`Setup.jsx:360,368,369`); "emergency"
    (`state.js:198`); "urgent" (`helpers.js:830`, `narrative-engine.js:1101`);
    "ideal"/"optimal" (`Insights.jsx:257`, `rate-analysis.js:93`,
    `reading-meaning.js:213`, `narrative-engine.js:997`, every
    `ICP_REFERENCE` entry); "fine"/"good"/"normal"/"healthy"
    (`findings.js:525,526,584,623`, `nutrients.js:125`,
    `ReadingConfirmation.jsx:379`, `rate-analysis.js:104`); "trending"
    (`stability-engine.js:123`); "creeping" (`Insights.jsx:172`). Plus invented
    band categories the spec explicitly forbids (`:91`): "A little high" /
    "A little low" (`ReadingConfirmation.jsx:396,404`), "Dead centre" (`:375`),
    "Heading the right way" (`:384`), "near the edge" (`:389`), `nearLower`/
    `nearUpper` at 12% of band width (`calcium.js:413-414`).

11. **Messages contradict their classification.** `surfaces-and-messaging.md:108-111`
    calls this "the single most important rule in this file."
    `ReadingConfirmation.jsx:76` — `inBand` is true and the headline reads
    "In range, correction still running", followed at `:77` by an active dosing
    instruction. `alkalinity.js:715-733` sets `action = "hold"` with
    "Your current dose is matching consumption" and then, inside the same branch
    at `:727`, computes and offers a correction; `calcium.js:463-480` has the
    identical structure. `findings.js:507` ships the contradiction as prose:
    "…so no dose change is suggested yet — but the longer view is drifting."
    Worst mechanism: `ReadingConfirmation.jsx:369-370` detects whether the dosing
    engine wants something by **running a regex over the engine's English
    sentences** (`/could change|needs a test|is due|needs more/i`) — which
    matches `state.js:325`'s "Needs more" and also `state.js:492`'s "No change
    needed", meaning the opposite.

12. **Surfaces disagree on hardcoded thresholds.** pH high is `> 8.45`
    (`findings.js:528`) and `> 8.4` (`narrative-engine.js:1191`) — a pH of 8.42
    is flagged by one surface and not the other. Nitrate "lean" is `< 3`
    (`findings.js:551`) and `< 2` (`:638`), in the same function. Magnesium
    "critical" is a bare 1250 at `narrative-engine.js:1096,1212,1240`,
    bypassing the user's own band entirely.

13. **No schema version, no migrations, and corrupt data starts silently
    empty.** `app-contract.md:14-20`. `loadKey` (`storage.js:50-59`) catches the
    parse error at `:56` with an empty body, falls through to `lsGet`, whose own
    catch at `:43` returns `undefined`, and returns the caller's fallback. A
    truncated `readings` value yields an empty array, the app renders a normal
    empty tank, and **the next write overwrites the corrupt-but-possibly-
    recoverable blob**. `app-contract.md:20` — "It must never start empty and
    silent" — is violated exactly. There is no read-only mode and no export
    prompt; `RootErrorBoundary` (`App.jsx:218-286`) never sees it because nothing
    throws.

14. **Backup loses data on restore.** `correction-plans` is written
    (`App.jsx:656,670,686`) but absent from `BACKUP_KEYS` (`backup.jsx:30-34`) —
    an in-flight correction is lost. `alk-plan`, `ca-plan`, `mg-plan` and
    `corrections` are *in* `BACKUP_KEYS` but `restoreBackup` (`backup.jsx:111-168`)
    never writes them back — saved to the file, dropped on the way in. Seed flags
    are not backed up either, so restoring to a clean browser re-seeds all the
    demo data and re-runs the one-shot settings overwrite at `App.jsx:526-534`.

15. **Bundle over budget.** **[verified]** 288.5 kB gzip against 180 kB.

16. **Gallons and temperature absent.** `reef-chemistry.md:37-39` requires US and
    imperial gallons to be distinguished and °C↔°F. Neither constant appears in
    `src/`; there is no unit selector and no temperature parameter.

Satisfied: no network calls anywhere (`app-contract.md:30` — verified by grep);
service worker configured (`vite.config.js:8-32`) and registered via the
plugin's injected script in the build; band edges are inclusive of the band they
bound wherever they are compared (`dates.js:26-27` and consistently elsewhere),
which matches `surfaces-and-messaging.md:83-85`.

---

## 6. Can it be trusted right now?

**No. Do not use it to make a dosing decision until at least items 1-3 below are
fixed.**

Ranked by how directly each produces a wrong number.

**1. `src/lib/dosing/state.js:322-323` — the app tells you to add more when you
have overshot.** **[verified]**
```js
const same = (a.trendPerDay < 0 && a.action === "increase")
  || (a.trendPerDay > 0 && a.action === "increase");
```
Both branches test `"increase"`. The second was meant to be `"decrease"` — the
comment at `:319-321` describes the intended behaviour. As written, `same`
reduces to `action === "increase" && trend !== 0`, so whenever the engine wants
an increase the state is **always** `"fell-short"` → chip **"Needs more"** →
*"narrowed the gap but has not closed it"* — even while the parameter is rising.
The `"overshot"` state at `:329` can never fire for a rising level. This is a
direct escalation path on a tank that is already moving the wrong way.

**2. `src/lib/analytics/consumption.js:92` — magnesium product strength is
wrong by ~42×.** **[verified]** `DOSE_ELEMENTS.magnesium.defaultStrength = 1.0`
ppm/mL/100L, while `DEFAULT_SETTINGS.mgPpmPerMlPer100L = 0.024`
(`water-changes.js:46`) and `magnesium.js:38-39` documents the real figure as
~0.012-0.024. `Setup.jsx:61` displays `settings[strengthField] ?? defaultStrength`
→ shows **1.0**; `Setup.jsx:97` **persists** `strengthNum || elem.defaultStrength`
→ writes 1.0 into settings. The dosing maths divides by strength, so the
magnesium recommendation comes out ~42× too small while the Setup panel and the
analytics modules quote different numbers for the same product. Alkalinity
(0.0533/0.0533) and calcium (0.3611/0.36) agree; magnesium does not.

**3. Every dose is computed on gross volume, defaulting to 77 L.** **[verified]**
`src/components/Setup.jsx:73` writes `parseFloat(vol) || 77`;
`src/lib/analytics/water-changes.js:29` seeds `volumeL: 77` into every settings
spread; `|| 77` is hardcoded at 15 sites. The spec requires refusal when net
volume is unset (`reef-chemistry.md:51`) — instead the app substitutes silently.
There is no net/gross distinction anywhere, so even a correctly entered display
volume overstates water by the rock and sand displacement, typically 10-20%.
**This is only harmless today because the owner's tank happens to be 77 L** —
which is exactly why it has survived. Anyone else, or Dan clearing the field, gets
doses scaled to someone else's tank.

**4. Recommendations are computed partly on 325 fabricated readings.** **[verified]**
`src/lib/seed-data.js:3` → merged into real `readings` at `src/App.jsx:452-464`
with no marker. Consumption rates, trends, regressions and therefore every
maintenance dose are derived from a series that is part invented. Dates run to
2026-08-09, so the fake data is current, not obviously historical.

**5. Consumption and maintenance doses are computed from 2 readings hours
apart.** `alkalinity.js:564-572`, `calcium.js:305-314`, `helpers.js:656-665` stop
only at `used.length < 2` and `spanDays <= 0`. `reef-chemistry.md:113-115`
forbids computing a rate from readings less than 2 days apart, precisely because
a sub-2-day span sits inside kit error. A dose sized from kit noise is a dose
sized from nothing.

**6. Three noise guards that were meant to prevent exactly this are silently
disabled.** **[verified]** `findings.js:452` (`reg.se` should be `reg.seSlope` →
significance test never runs), `findings.js:610` (`kitSigma(def)` should be
`kitSigma(def.key, settings)` → noise floor always 0),
`drift.js:125` (`cfg.effect` does not exist on `DOSE_ELEMENTS` → settle window
always the floor). All three fail *open*, producing confident findings from
movement that is within test error.

**7. No magnesium gate and no precipitation guard.** The app will recommend an
alkalinity correction with magnesium at 1140, and will recommend alkalinity and
calcium doses with no scheduling separation. `reef-chemistry.md:138-145`,
`:206-207`. Both are safety rules; neither exists in logic.

**8. Manual dose entry accepts any number with no rail check** and responds
*"which is fine"* (`DoseChangeSheet.jsx:46-52`).

**9. Correction progress is tracked with a hardcoded direction.** **[verified]**
`helpers.js:192` reads `c.amount`, which is never written
(`App.jsx:811-813` writes `ml`), so `direction` is always `"up"` and
`state.js:263-266,366-377` branch on it.

**10. Water-change logging crashes** (`Tasks.jsx:113,115,118`) **[verified]**, and
water changes are not subtracted in the dosing engines' consumption maths at all
— so a logged water change both fails to record and would not be accounted for
if it did.

The one reassuring finding: the app makes **no network calls**, so nothing leaves
the device. Verified by grep across `src/`, `index.html` and `vite.config.js`.

---

## 7. What I'd do first

Ordered. Each assumes the one before it.

**1. Stand up a test harness and pin the spec's ten worked examples as tests.**
*What:* install Vitest + React Testing Library, add `test`/`lint` scripts, and
encode `docs/spec/reef-chemistry.md:216-257` verbatim as executable vectors.
*Why:* every other item on this list is a chemistry change to untested code, and
AGENTS.md's definition of done is currently unsatisfiable — there is no `npm test`
to run. The ten examples are already written as test vectors and will fail
immediately, which is the point: they convert this report into a red bar someone
can drive to green.
*Size:* medium — half a day for the harness, a day for the vectors. No production
code changes, so it is safe to do first.

**2. Fix the four one-line defects that produce wrong numbers.**
*What:* `state.js:323` `"increase"` → `"decrease"`; `consumption.js:92`
`defaultStrength: 1.0` → `0.024`; `findings.js:452` `reg.se` → `reg.seSlope`;
`findings.js:610` `kitSigma(def)` → `kitSigma(def.key, settings)`. Add
`helpers.js:192` (`c.amount` → `c.ml`) and `DosingWizard.jsx:268`
(`active.def` → `activeDef`) if scope allows.
*Why:* highest correctness-per-line in the repo. Items 1, 2, 6 and 9 in §6, plus
the unreachable correction feature, are all single-token fixes. Each needs a
regression test from item 1.
*Size:* tiny — six tokens. The tests are the work.
*Caveat:* `consumption.js:92` is a chemistry constant, so per AGENTS.md §3 it
needs an `[approved][chem]` backlog item before anyone touches it, and existing
users may already have 1.0 persisted in settings — that is a data-repair
question, not just a constant change.

**3. Add net volume as a real, required input and make the app refuse without it.**
*What:* a `netVolumeL` field with net/gross wording and the 0.85 helper from
`reef-chemistry.md:54-57`; delete all 15 `|| 77` fallbacks and
`DEFAULT_SETTINGS.volumeL`; make the dose paths return an explicit refusal
naming the missing input rather than substituting.
*Why:* this is the app's existing top backlog item (TW-001), it is the single
most common cause of overdosing in software of this kind
(`reef-chemistry.md:49-51`), and the hardcoded 77 makes the app unusable by
anyone but its author while looking correct to its author.
*Size:* medium — the field and the helper are small; finding and removing 15
fallback sites and adding refusal paths through four dose engines is the bulk.

**4. Quarantine the seed data and make corrupt reads fail loudly.**
*What:* tag every seeded record with `seed: true` at `App.jsx:458` and the three
sibling seeders, filter seeded records out of consumption/trend/dose maths, and
offer a one-tap "remove demo data". Separately, make `loadKey`
(`storage.js:50-59`) distinguish "absent" from "unparseable" and surface the
latter as read-only mode with an export button, per `app-contract.md:20`.
*Why:* right now the app computes real dosing advice partly from invented
readings and cannot tell the user which is which, and a single corrupt key
silently discards history that `app-contract.md` calls irreplaceable. Both are
data-integrity problems, and both get harder the longer real readings accumulate
alongside fake ones.
*Size:* medium. The seed tagging is small; the read-only mode is a new UI state.
Touching storage requires a `[schema]`-tagged item under AGENTS.md §5.

**5. Collapse the classifiers to one `classifyReading`, then delete engine B.**
*What:* implement `classifyReading(param, value, targets)` returning the spec's
seven values, backed by a real target-plus-band-plus-alert model in
`PARAM_DEFS`; route all ~48 decision sites through it, starting with the ones
that drive user-visible words. Then delete `computeDoseAdvice`/`assessDrift`/
`computeDoseCalc` (`drift.js`), which are already dead at both UI call sites, and
the ~440 dead lines in `narrative-engine.js:854-1295`.
*Why:* this is the root cause of §4 and §5 — seven vocabularies and four engines
mean every future edit has a 3-in-4 chance of landing in the wrong copy, which is
visibly what happened to produce most of this report. Deleting the dead engine
first makes the remaining consolidation smaller and is zero-risk by definition.
*Size:* large — well beyond AGENTS.md's 400-line ceiling, so it needs splitting
into per-surface items with the shared classifier landing first. Start with the
deletions (free), then the classifier, then migrate surfaces one at a time behind
the tests from item 1.

---

## Notes on confidence

- Everything marked **[verified]** I re-checked directly against the source after
  the sweep reported it.
- I did **not** run the app. Findings about runtime behaviour
  (`Tasks.jsx` crashes, `CorrectionPanel` returning null) are read from the code
  and are unambiguous — undeclared identifiers and a missing object key — but no
  browser confirmed them.
- I could not determine whether any real user data currently exists in
  `localStorage`, so I cannot say whether the magnesium strength defect (§6.2) has
  already written `1.0` into a live settings object or whether `0.024` is in force.
  That needs someone to check the browser.
- The 48-classifier count in §5.4 is a judgement call about what counts as a
  distinct decision site; the seven *vocabularies* are a firm count of distinct
  string sets.
- I did not touch `.agent/run-state.md` — this routine declares itself read-only
  and assigns no run id.
