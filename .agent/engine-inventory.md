# Reef Chemistry Engine — inventory of what exists

**Date:** 2026-08-16 · **Tree:** `main` at `9e3c9e8` · **Method:** read-only.
Every file under `src/lib` and `src/components` that produces a verdict,
classification, severity or dose figure was read in full or traced to its
consumers by import and call-site grep. Nothing was run in a browser; `npm
run verify`/vitest were not run (node_modules not installed in this
container), so "red test" claims below are read from test source, not from a
run. Changes nothing; this file is the only write.

This is the measurement reef-chemistry.md §25's consolidation plan will be
built from. It contains no plan and no recommendations.

---

## 1. What actually runs today — the derivation pipeline

`deriveTankState` (`src/App.jsx:69-201`) is the single derivation §25 names.
It runs on every relevant state change (`App.jsx:1042`), and once more per
logged reading to build the confirmation popup (`App.jsx:1124`). In order it
computes:

| Step | Producer | Output |
|---|---|---|
| `buildFindings` (`findings.js:158`) | severity-tagged findings pool (`info/watch/act`) | `allFindings`/`findings` |
| `assessAlkalinity` / `assessCalcium` / `assessMagnesium` (`alkalinity.js:450`, `calcium.js:206`, `helpers.js:768`) | full dose assessment per dosed element: `action` (`hold/increase/decrease/implausible`), `band` (`stable/mild|small/meaningful/significant`), `recommendedDose`, `maintenanceDose`, `targetCorrection`, `clearlyOut`, `gainingHold`, staged `plan` | `alkAssessment` etc. |
| `doseStatus` (`state.js:44`) ×3 | one of **17 state strings** (`blocked, emergency, correction-stalled, correction-due, correction-done, correcting-dose, correcting, settling, due, worked, fell-short, overshot, suggested, recovering, worsening, off-target, idle`) with tone/headline/detail | `doseStates` |
| `computeStability` (`stability-engine.js:83`) per param | `green/amber/red/unknown` grade + pattern | `stabilityByParam` |
| `buildOverview` (`narrative-engine.js:763`) | score 0–100, headline, **paragraphs (dead — see §3)**, urgentCount/watchCount (dead) | `overview` |
| `buildBriefing` (`narrative-engine.js:329`) | ordered claim feed (tone `act/warn/busy/watch/ok`) | `briefing` |
| `explainScore` (`narrative-engine.js:81`) | per-param score working (duplicates buildOverview's arithmetic — see §4.9) | `scoreExplained` |
| `proposeCorrection` (`helpers.js:428`) ×3 paces ×3 elements | correction offers (dose/day/days/returnDose) | `correctionOffers` |

Everything else that classifies runs **outside** this derivation, per
component render: `computeControl`, `computeRates`/`rateNarrative`,
`computeElementConsumption`, `computeConsumption`, `computeDoseAdvice`,
`computeIonicBalance`, `computeNutrientRatio/Production`,
`calibrateDoseStrength`, `computeDemandSeries`, `computeIcpTrends`,
`icpStatus`, `computeCorrection` (Setup), `readingVerdict`
(ReadingConfirmation), `StabilityStrip`, plus 28 scattered `paramStatus`
call sites. The §25 sentence "every surface renders its verdict" describes
the `doseStates`/`briefing` path only; the rest is unconsolidated.

---

## 2. Census of verdict producers

Definition used throughout: a **mechanism** is a distinct piece of code that
turns a reading (or a window of readings) into a categorical judgement —
band position, severity, quality grade, or an actionable dose figure — using
thresholds it owns or consults itself, rather than by rendering another
mechanism's already-formed verdict. A **decision site** is one call site
where such a judgement is made.

### 2a. Position classifiers (where does the level sit)

| # | Mechanism | Vocabulary / thresholds | Consumers | Live? |
|---|---|---|---|---|
| P1 | `paramStatus` (`dates.js:24`) | `low/high/ok/unknown` off `def.min/max`, inclusive edges | 28 call sites: App alerts (`App.jsx:1087,1110`), Dashboard chip (`Dashboard.jsx:145`), ParamCard tone (`DoseExpectation.jsx:220`), ParamGauge (`backup.jsx:346`), WaterLog StatusPill (`WaterLog.jsx:186`), DosingWizard dot (`DosingWizard.jsx:69`), findings gate (`findings.js:454`), computeControl (`reading-meaning.js:149`), narrative-engine ×19 | **Live** (12 of the 19 narrative-engine sites feed dead prose) |
| P2 | `positionBand` + `ALERT_WIDTH` (`reading-meaning.js:102-116`) | `in-band / out-of-band-low|high / alert-low|high`, tiers 0–2; alert = band-midpoint ± width (alk 1.0, Ca 50, Mg 200) | **only** `computeControl` (`:276-283`) | Live, single consumer. Added 15 Aug (TW-037/045). Closest thing to the spec's `classifyReading`; nothing else calls it |
| P3 | `SAFE_BOUNDS` emergency test in `doseStatus` (`state.js:189-206`) | outside `SAFE_BOUNDS` → `emergency` / "Dangerously low/high"; **strict** comparison (7.0 dKH exactly is NOT emergency); suppressed while a correctionPlan runs | wizard cards, briefing, ParamCard badge | Live |
| P4 | `SAFE_BOUNDS` escalation in `buildFindings` far-out (`findings.js:242-276`) | fires only at ≥ one full band-width out; then outside SAFE_BOUNDS → `act` "dangerously", inside → `watch` "well below/above your target" | findings → briefing, cards, wizard | Live. Gates differently from P3 — see §4.1 |
| P5 | `readingVerdict` (`ReadingConfirmation.jsx:20-410`) | two more independent `SAFE_BOUNDS` tests (`:46`, `:150`); own band vocab: "Dead centre" (<0.35 of half-band from mid), "near the edge" (>0.8), "A little high/low" vs "Well above/below band" (half-band-width out); regex over the engine's English (`:369-370`, `/could change|needs a test|is due|needs more/i`) to decide whether to say "nothing to do" | LogResultPopup only | Live |
| P6 | Engines' own position block, ×3 copies | `inRange/above/below` off last reading (§26), inclusive; `nearEdge` at 12% of band width (calcium `:440-444`, magnesium `helpers.js:998-1001`; alkalinity has none by design); `clearlyOut` at fixed margins `ALK_CLEARLY_OUT` 0.5 / `CA_CLEARLY_OUT` 50 / `MG_CLEARLY_OUT` 50 (§27) | dose branching, targetCorrection, wording | Live. Same shape written three times (`alkalinity.js:629-631,742-749`, `calcium.js:419-422,490-497`, `helpers.js:983-1001,1038-1047`) |
| P7 | `doseStatus`'s own in-band tests (`state.js:89-92, 307, 427, 456-457`) | drives `worked / off-target / recovering / worsening / settling` headline | wizard/briefing | Live |
| P8 | `capDoseStep` SAFE_BOUNDS test (`helpers.js:51-60`) | `unsafe`/`headingWrong` relax the 25% step cap to 50%/100% | dose sizing | Live |
| P9 | `safetyCapFor` (`narrative-engine.js:735-750`) | distance past SAFE_BOUNDS → score cap 45→15 | buildOverview score + explainScore | Live |
| P10 | rangePt banding in `buildOverview` (`narrative-engine.js:796-804`) **and again** in `explainScore` (`:100-107`) | bands-out 0.25 / 0.75 / 1.5 → 0.78/0.45/0.2/0.03 | score + ScoreBreakdown | Live, two identical copies |
| P11 | `buildOverview` prose classifiers: `outButStable`/`outAndFar` at `bandsOut>1` (`:974-980`), `MG_CRITICAL=1250` (`:1096`), trio verdicts, priority ladder (`:1210-1287`) | own thresholds | **paragraphs render nowhere** | **Dead output** (computed every derivation) |
| P12 | `StabilityStrip` excursion test (`TodayPanel.jsx:314`) | `stab.p05 < def.min || stab.p95 > def.max` → hardcoded `#A2621B` | Dashboard briefing strips | Live. TW-002's "13th classifier", unchanged; pinned by `tests/parity/stability-strip-vs-param-status.test.js` |
| P13 | `paramContext` (`reading-meaning.js:17-87`) | above/below `def` plus its own absolute thresholds (Ca 380, PO4 0.15, K 430/360, Mg "1500s harmless"…) | computeControl `contextNote` → ParamHistoryModal | Live |
| P14 | `icpStatus` (`icp-reference.js:89-97`) + `ICP_REFERENCE` bands | `ok/low/high/detected/unknown` | IcpPanel, IcpConfirmation, Insights, findings ICP block | Live (different data source) |
| P15 | `correctionProgress` arrival zone (`helpers.js:277-411`) | §9 middle-third zone, floored at 2× noise floor; `arrived/passed/stalled/backwards/overrun/dueNow` | doseStatus correction states, CorrectionPanel, readingVerdict | Live |
| P16 | `computeControl` verdict (`reading-meaning.js:123-300`) | `sliding/loose/dialled/controlled/steady-off/unsettled` off window median/spread/rates, then §22 tier-floor from `positionBand` | ParamHistoryModal verdict box, Insights time-in-range | Live |

### 2b. Movement / stability classifiers

| # | Mechanism | Vocabulary / thresholds | Consumers | Live? |
|---|---|---|---|---|
| M1 | `computeStability` + `gradeSpread` (`stability-engine.js:64-162`) | `tight/moderate/loose` off `CONSISTENCY_RULES` p05–p95 spread → `green/amber/red/unknown`, `atResolution` off `STABILITY_RULES.noiseFloor`, `farApart` downgrade off `def.freqDays` | deriveTankState (`stabilityByParam`), score, briefing drift claims, ParamCard label, StabilityStrip, explainScore | Live |
| M2 | `computeControl` consistency (`reading-meaning.js:174-217`) | same `CONSISTENCY_RULES`, but `rateGrade` from `computeRates` **overrides** the spread grade where rates exist; `wholeRangeInBand` promotes moderate→tight | ParamHistoryModal, Insights | Live. Same rules as M1, different override logic — the two can grade one window differently for alkalinity/salinity |
| M3 | `computeRates` (`rate-analysis.js:20-68`) | `good/ok/poor` daily and weekly, `RATE_RULES` alkalinity + salinity only; grades on the **rounded shown** value (`:43`, deliberate) | ParamHistoryModal bars + `rateNarrative`, feeds M2 | Live |
| M4 | `assessDrift` (`drift.js:21-38`) | `severity none/mild/high`, `needsAction` vs `DRIFT_GUIDE` (alk 0.5, Ca 10, Mg 25 /wk); also rounds before comparing (`:30`) | only inside `computeDoseAdvice` | Live only via the strength-preview path (see §3.2) |
| M5 | `alkBandOf`/`caBandOf`/`mgBandOf` (`alkalinity.js:210-226`, `calcium.js:141-151`, `helpers.js:756-766`) | `stable/mild|small/meaningful/significant` off `ALK_TREND`/`CA_TREND`/`MG_TREND`; §11 promotion via shared `outOfBandWorsening` (`helpers.js:596-600`) | engine branching, wording | Live, three copies of one shape |
| M6 | `directional` (`findings.js:142-156`) and `directionConsistent` (`alkalinity.js:269-276`) | two different "is this a real direction" booleans (⅔-of-steps vs all-signs-agree-above-flat) | findings heading-out + briefing `travelling` vs engines | Live, both |
| M7 | `computeDemandSeries` (`demand.js:24-98`) | demand `steady/rising/falling`, `meaningful` at 2×SE | Insights demand chart | Live |
| M8 | `computeIcpTrends` (`icp-reference.js:100-125`) | `steady/accumulating/depleting` at ±12% | Insights ICP section | Live |
| M9 | settled/destabilised spread comparison (`findings.js:615-652`) | 21d vs 21–63d windows, 0.55×/1.9× against `kitSigma`×2 | findings | Live |

### 2c. Cross-parameter classifiers

| # | Mechanism | Verdict | Consumers | Live? |
|---|---|---|---|---|
| X1 | `computeIonicBalance` (`drift.js:277-349`) | `balanced/ca-heavy/ca-light` vs `CA_PER_DKH` 6.4–7.6 per dKH consumed; `mgNote` at Mg:Ca 2.7 | Insights, findings `ionic` (only when ≥15% outside band), previewStrengthChange | Live |
| X2 | `computeNutrientRatio` (`nutrients.js:106-140`) | `starved/loaded/balanced/n-heavy/p-heavy` (starved <3 NO3 / <0.03 PO4; balanced 50–150:1) | Insights, findings ratio checks | Live |
| X3 | `buildFindings` cross-checks | alk-vs-nutrients (lean = NO3<3 or PO4<0.03, `:577`), nutrient-starved (both <2 / <0.02, `:664`), CO2 (pH<7.9 with alk in band), pH-high >8.45, salinity-off ±1.2 from 35 | findings | Live. Two different "nitrate lean" thresholds inside one function — see §4.7 |
| X4 | `buildOverview` prose ratios: Ca:alk levels 42–60:1, Mg:Ca 2.7, nutrient thresholds duplicating X2 (`:1104-1166`) | its own numbers | **paragraphs render nowhere** | **Dead output** |

### 2d. Dose and correction calculators (every mechanism that emits a mL/gram/day figure)

| # | Mechanism | What it emits | Surface | Live? |
|---|---|---|---|---|
| D1 | The three engines (`assess*`) | `recommendedDose`, `maintenanceDose`, staged `plan`, via shared `rateLimitDose` + `applyDoseConstraints` (bracketing → step cap → rate ceiling) | Dosing tab (AlkAssessmentBlock), briefing, ReadingConfirmation via doseState | **Live — the canonical path** |
| D2 | Engines' `targetCorrection` (in-hold branches) | one-off `oneOffMl` sized to band midpoint off `fittedNow`, `perDayMl` off `SAFE_DAILY_RISE` | AlkAssessmentBlock "Log a X mL correction", doseStatus `suggested` wording | Live |
| D3 | `proposeCorrection` (`helpers.js:428-531`) | elevated-daily-dose walk: `dose`, `days`, `returnDose` at 3 paces off `CORRECTION_MAX_RATE` × `CORRECTION_PACE` | CorrectionPanel (revived 15 Aug — `DosingWizard.jsx:267`) | Live |
| D4 | `computeCorrection` (`analytics/correction.js:50-69`) | grams of dry salt per product, staged by its own `maxPerDay` table (alk 0.5, Ca 20, Mg 25, K 10, NO3 2, PO4 0.03) | Setup → "Correction calculator" (`Setup.jsx:168-175, 449-510`) | **Live** — the disconnected fourth calculator. Consults none of D1–D3, no bracketing/plausibility, and can be used mid-plan without either knowing |
| D5 | `computeDoseCalc` via `computeDoseAdvice` (`drift.js:238-271`) | `recommendedMl`, `stepMl` (halve-the-gap), `pct` 10/15% | only `previewStrengthChange` → Insights "Suggested dose before/after" row (`corrected-strength.js:43-50,68-77`) | Live on that one row only; dead at both direct UI call sites (§3.2) |
| D6 | `computeConsumption` (`consumption.js:9-67`) | `recommendedMl`, `adjustMl` | nothing reads either field | **Dead fields** |
| D7 | `doseStatus` emergency arithmetic (`state.js:198-205`) | days-to-midpoint at `SAFE_DAILY_RISE` (narrative only) | emergency card | Live |
| D8 | `solveAlkEffect`/`solveSlowEffect` (`alkalinity.js:93-164`, `calcium.js:65-138`) | solved strength + `suggestedPer100L`, |ΔD|-weighted mean of period pairs | AlkAssessmentBlock "Use X /mL/100L" apply button (`ErrorBoundary.jsx:311-341`) | Live |
| D9 | `calibrateDoseStrength` (`dose-strength.js:19-106`) | solved strength, **median** over ±21d windows, ±2SE range | findings `strength-*` (act), Insights calibration card + its own apply via `previewStrengthChange` | Live. D8 and D9 answer the same question with different estimators and two separate apply buttons — see §4.5 |

Manual paths that bypass every calculator: `DoseChangeSheet` (free-typed mL,
no rail comparison — `SAFE_DAILY_RISE` is imported by ErrorBoundary.jsx but
used only in D2's prose) and Setup's per-element dose fields.

---

## 3. Dead code — reported separately, as asked

Confirmed by grep for every consumer; "dead" here means *computed and never
rendered/read*, not merely unused exports.

1. **`buildOverview`'s entire prose engine — ~440 lines, computed on every
   derivation, rendered nowhere.** `OverviewCard` (`TodayPanel.jsx:617-695`)
   reads exactly two fields: `overview.score` and `overview.headline`.
   `overview.paragraphs`, `overview.urgentCount` and `overview.watchCount`
   have **zero** consumers (repo-wide grep). That kills, as output: the dose
   paragraphs (`narrative-engine.js:872-914`), the roll-call and nuance
   paragraphs (`:916-1020`), trend/trio/ratio/nutrient/pH paragraphs
   (`:1022-1195`), the stale-data paragraph and the entire "If you do one
   thing this week" priority ladder (`:1197-1288`). The reported claim is
   confirmed and current. Note the *score* and *headline* halves of
   `buildOverview` (`:779-851`, `:1303-1339`) are live — the function is
   half dead, not all dead.
2. **`computeDoseAdvice` at both direct UI call sites.**
   `Dashboard.jsx:298-303` and `Insights.jsx:106` each assign `doseAdvice`
   into a `useMemo` and never reference the identifier again (single
   occurrence in each file). Also drags `DOSE_ADVICE_RULES` into
   Dashboard's import solely to gate the dead memo. Only live path is
   `previewStrengthChange` (D5).
3. **`computeConsumption` at `Dashboard.jsx:288-290`** — assigned, never
   read (the modal's consumption box uses `computeElementConsumption`).
   The Insights call (`Insights.jsx:91`) is live for `.consumption`,
   `.dosePerDayDkh`, `.demandTrend`; its `recommendedMl`/`adjustMl` dose
   fields are read by nothing anywhere.
4. **`out.events: []`** still initialised in all three engine results
   (`alkalinity.js:459`, `calcium.js:212`, `helpers.js:777`) and consumed by
   nothing — the comment at `alkalinity.js:537-541` says the field was
   removed, but the initialiser stayed in all three.
5. **`DRIFT_GUIDE`** (`drift.js:15-19`) reaches a surface only through
   `computeDoseAdvice`'s `settling` entries' `guide` field — and no live
   consumer reads `settling` entries at all (the preview only reads
   `.calc`, which settling entries don't carry). Effectively dead with D5's
   caveat.
6. **`positionBand` is exported but has one internal consumer** — no
   surface calls it directly; the §22 tier reaches screens only inside
   `computeControl`'s result.
7. **Not dead any more — corrections to the record:**
   - `CorrectionPanel` was revived 15 Aug (`d032374`, "Fix B"): the
     `def={active.def}` always-undefined prop is fixed
     (`DosingWizard.jsx:267-273` passes `def={activeDef}`), and
     `dosing-wizard-element-switch-key.test.js` pins it rendering non-null.
     Any plan built on "CorrectionPanel is dead" is stale.
   - `state.js:322-323`'s increase/increase copy-paste defect is fixed
     (now `increase`/`decrease` at `state.js:327-328`, TW-050 adjacent).
   - The `|| 77` volume fallbacks are gone from `src/`; `DEFAULT_SETTINGS.volumeL`
     is now `null` with refusal paths (`water-changes.js:29-34`).
   - `drainLegacyStore` is called at startup since `a9bcbc2` (TW-032).

---

## 4. Two mechanisms, one question, different numbers

Each row is a place where two live mechanisms answer the same question and
can print different answers. Both numbers given.

1. **"Is this reading alarming?" — two alert-boundary families.**
   §18 alert thresholds via `positionBand`/`ALERT_WIDTH`
   (`reading-meaning.js:102`): at default bands, alk **7.5 / 9.5**,
   Ca **375 / 475**, Mg **1125 / 1525** (midpoint ± width). SAFE_BOUNDS
   (`findings.js:111-135`): alk **7 / 11**, Ca **350 / 500**,
   Mg **1150 / 1600**. Alkalinity 7.2: `computeControl` renders the alert
   tier (≤7.5); `doseStatus` does not go `emergency` (>7.0); the far-out
   finding says "well below your target" at watch, not act. Three surfaces,
   three registers for one number. Note Mg is *inverted* between the
   families: alert-low 1125 sits **below** SAFE_BOUNDS' 1150.
2. **State.js vs findings.js safe-bounds gating (the reported difference,
   verified).** Both now use the same `SAFE_BOUNDS` table with the same
   strict (`<`/`>`) boundary — 7.0 dKH exactly still falls through both, the
   non-inclusive edge TW-002 and the 14 Aug census flagged, unchanged. What
   differs is the gate: `doseStatus` goes `emergency` on *any* excursion
   past SAFE_BOUNDS unless a correction plan is running (`state.js:195`);
   `buildFindings` requires *both* a full band-width out *and* past
   SAFE_BOUNDS for "act" (`findings.js:251,258`). With a user band of
   7.2–7.6, a reading of 6.9 is `emergency` in the wizard and **no finding
   at all** on the dashboard (0.3 out < 0.4 full-band threshold).
   Conversely, mid-correction the wizard suppresses its emergency while the
   finding still fires.
3. **"Is the trend actionable?" — four thresholds for alkalinity alone.**
   Engine: stable below **0.10 dKH/day (= 0.70/wk)** (`ALK_TREND`, plus the
   12% dose-gap trigger). `assessDrift`: needsAction above **0.5 dKH/wk**
   (`DRIFT_GUIDE`). `computeRates`: weekly `good` ≤ **0.5 dKH/wk**, daily
   `good` ≤ **0.3 dKH/day** (`RATE_RULES`). `CONSISTENCY_RULES`: tight ≤
   **0.5 dKH spread** (a spread, not a rate). A 0.6 dKH/wk drift is "within
   normal test variation — hold" in the wizard and an amber "ok, above the
   0.5 ideal" in the same parameter's history modal.
4. **Three kit-noise tables, all three still live.**
   `KIT_PRECISION` (`findings.js:77-87`: alk 0.10–0.20, Ca 5–15, Mg 25–30,
   per chosen kit) → `kitNoise` → `settleWindow`. `KIT_SIGMA`
   (`measurement-noise.js:10-13`: alk 0.05, Ca 8, Mg 15) → settled/
   destabilised findings + Setup display. `STABILITY_RULES[*].noiseFloor`
   (`stability-engine.js:42-53`: alk 0.1, Ca 10, Mg 30) → stability grade,
   heading-out gate, gainingHold, correctionProgress, ReadingConfirmation.
   `buildFindings` still consults all three in one pass (`:107`, `:486`,
   `:636`).
5. **Two effect-per-mL solvers with two apply buttons.** Engine solvers
   (D8, |ΔD|-weighted mean; alk needs span ≥1.5d, Ca ≥12d, Mg ≥19d) render
   in AlkAssessmentBlock with "Use X /mL/100L". `calibrateDoseStrength`
   (D9, median of ±21-day experiments, ≥4 readings each side) drives an
   act-severity "dose strength looks wrong" finding and Insights' own apply
   with preview. Same tank, same question, different estimators, different
   windows — both on screen.
6. **Four consumption computations, one §22 divergence still live.**
   `computeElementConsumption` was unified to `dosed − netChange` with no
   water-change term (`e7a2270`, §22). The engines' `supplied − trendPerDay`
   agrees in shape (different windows). `computeConsumption` (alk-only,
   fixed 30d) agrees in shape. **`computeDemandSeries` does not**: it still
   adds a water-change contribution back into demand
   (`demand.js:50-67`) — the mass-balance term §22 removed elsewhere. On a
   week with a 10 L change against Aquaforest values, Insights' demand
   chart and the same page's consumption figure embody two different
   answers to "does a water change count?".
7. **Nitrate "lean" is <3 ppm at `findings.js:577` and <2 ppm at
   `findings.js:664`** — same function, two thresholds (alk-vs-nutrients vs
   nutrient-starved). `nutrients.js:119` and the dead buildOverview prose
   use <3.
8. **pH high: 8.45 vs 8.4 — now live-vs-dead.** `findings.js:554` flags
   \>8.45 (live). `narrative-engine.js:1191` flags >8.4 — inside the dead
   paragraphs, so the disagreement no longer reaches two screens; it
   reaches one screen and one corpse.
9. **The score is computed twice.** `buildOverview:779-843` computes it;
   `explainScore:81-165` re-derives the identical arithmetic (stabPt/
   rangePt/blend) as a second copy, sharing only `safetyCapFor`. The
   ammonia and evidence caps exist in both. They agree today line-for-line;
   nothing enforces it.
10. **Ca:alk ratio constants in live code:** 6.4–7.6 band (`drift.js:274-275`,
    consumption-based, live via ionic finding), 6.75 (`findings.js:412`,
    implausible-ca prose), 6.8 (`consumption.js:95` hint text), 7.14 and
    6.77 (`water-changes.js:38-44` comments/derivation). The dead prose
    adds a 42–60:1 standing-level test.
11. **Testing cadence, two sources:** `PARAM_DEFS.freqDays` (alk 2, PO4 7,
    Mg 21) drives stability's `farApart` and sparse findings;
    `REMINDER_SEED.intervalDays` (`reminders.js:17-24`: PO4 **3**, Mg **7**)
    drives what the app actually asks the user to do. Phosphate 3 vs 7 and
    magnesium 7 vs 21 still disagree.
12. **Settle windows, three answers:** adaptive `settleWindow`
    (`findings.js:102-109`), the engines' fixed `ALK_EARLY/SETTLE_HOURS`
    24/48h + `CA_SETTLE_DAYS`/`MG_SETTLE_DAYS` 7 (used *before* the
    adaptive window in each engine), and `DOSE_ADVICE_RULES.minDaysSinceChange`
    7/14 (drift path, floored by settleWindow since the merge at
    `drift.js:117-123`).
13. **Staging fractions, per element and duplicated within each engine:**
    alk 1/0.9/0.7-or-0.55 (`alkalinity.js:899-904`), Ca 1/0.85/0.6-or-0.5
    (`calcium.js:610-614`), Mg 1/0.8/0.55-or-0.45 (`helpers.js:1165-1167`) —
    and each engine restates its fractions a second time inside its staged-
    plan loop (`alkalinity.js:930-941`, `calcium.js:632-641`,
    `helpers.js:1185-1194`).

**Still-live copy-paste defects in this family** (verified against today's
source): `helpers.js:911` grades magnesium's interval consistency with
`CA_TREND.stable * 0.5` (2.5 ppm; magnesium's own constant would give 5) —
`CA_TREND` is imported into helpers.js for this single use;
`corrected-strength.js:55` still tests the stray, always-truthy `aA` in the
ionic-balance guard; `helpers.js:222` derives `pendingCorrection.direction`
from `c.amount`, a field `logCorrection` (`App.jsx:888-890`) never writes —
it writes `{element, ml (signed), direction}` — so the derived direction is
permanently `"up"` even though the record now carries a real `direction`
field it could read.

---

## 5. The classifier count — and what the disagreement was

The three historical counts used three definitions:

- **"~8" (TW-002, 13 Aug):** mechanisms with their own *thresholds and
  vocabulary* for band/severity of a single reading, counting the three
  dosing engines as one.
- **"Ten" (wizard-states.md §7/§11):** same idea, drawn up during the canon
  merge; no surviving enumeration.
- **"Thirteen" (band-classifier-auditor, 14 Aug):** an enumeration "by
  file:line" — the list itself did not survive into `.agent/` (findings.md
  has been rotated to 14 lines); only the headline and the 13th entry
  (StabilityStrip) are on record (`log/2026-08-14-consistency-sweep.md:86-99`,
  TW-002 addendum).

So the disagreement is definitional, as suspected — none of the three counts
can be checked against its own list, because only this report's list exists.

**Today, under the definition stated at the top of §2** (own thresholds or
own consultation of a threshold table, producing a categorical verdict about
a reading's position/severity): **P1–P16 = 16 position-classifying
mechanisms**, of which 14 are fully live, one (P11) computes dead output,
and one (P14, ICP) is a different data source. Counting the way TW-002
counted (single-reading band/severity only, engines' shared shape as one,
excluding window-verdicts like computeControl, excluding capDoseStep/
safetyCapFor as "not user-facing words") reproduces numbers in the 10–13
range, which is exactly why the historical counts moved. Movement adds
M1–M9; cross-parameter adds X1–X3. Any future count should cite this table
and say which rows it includes.

Since 13 Aug the population has **grown by one** (P2 `positionBand`, added
15 Aug by TW-037/045 — ironically the most spec-shaped classifier in the
codebase, and consumed by exactly one caller) and **changed state in one**
(P11's vocabulary went from live-rendered prose to dead output when the
OverviewCard stopped rendering paragraphs).

---

## 6. The "48 decision sites"

**Provenance:** the figure is `.agent/inventory.md:476` ("Seven
classification vocabularies across **~48** independent decision sites",
13 Aug), self-described at `inventory.md:788` as "a judgement call about
what counts as a distinct decision site". It was never an enumerated list —
TW-002 does not carry it; HANDOVER and THE-PLAN quote it from inventory.md.
**There is nothing to check the sites off against.** What can be done is a
fresh enumeration under a stated rule.

**Fresh count (call sites in production `src/`, tests excluded), rule: one
site = one place a band/severity/safety decision is taken:**

| Family | Sites | Where |
|---|---|---|
| `paramStatus(` calls | **28** | listed under P1; 12 of the 19 narrative-engine sites feed dead prose |
| `SAFE_BOUNDS[` consultations | **6** | `state.js:189`, `findings.js:257`, `helpers.js:53`, `narrative-engine.js:738`, `ReadingConfirmation.jsx:45,149` |
| Direct `def.min/def.max` comparisons in classifying roles | **~42** | engines 12 (position/nearEdge/emergency/clearlyOut/recovering ×3 elements), `state.js` 4, `drift.js` 2, `reading-meaning.js` 4, `narrative-engine.js` 5, `findings.js` 2, `ReadingConfirmation.jsx` ~9, `helpers.js` 3 (proposeCorrection, capDoseStep via bounds, correctionProgress zone), `TodayPanel.jsx:314` 1 |
| **Total** | **~76** | |

So the honest statement is: the ~48 was an estimate under a coarser rule;
today's count under a per-call-site rule is **~76**, and no reading of the
code supports the number having shrunk — TW-029 removed two *loops* in
findings.js but the sites they contained were 4 of ~80, and `positionBand`
plus §22's tier logic added sites since. The per-*mechanism* count (16) and
per-*vocabulary* count (the seven of inventory §5.4 are all still present:
`low/high/ok/unknown`, SAFE_BOUNDS-"dangerously", fitted `above/below` — now
last-reading per §26 — `tight/moderate/loose`, `green/amber/red`,
`good/ok/poor`, the control verdicts, plus `icpStatus` and the 17-state dose
machine) are the other two defensible framings.

---

## 7. The named suspects, verified one by one

- **`assessAlkalinity`/`assessCalcium`/`assessMagnesium` + `doseStatus`:**
  live, canonical, called only from `deriveTankState` (plus findings.js's
  internal `doseVerdict` re-run of the same three engines at
  `findings.js:165-188` — a fourth invocation per derivation, results not
  shared with the App-level run). §26 landed in all three (position =
  last reading; `fittedNow` retained only to size corrections).
- **`stability-engine.js`:** live everywhere (M1). Its old dead
  greenPerDay/amberPerDay thresholds were deleted rather than wired
  (`:21-31`); grading now delegates spread to `CONSISTENCY_RULES`. Its
  noiseFloor table doubles as one of the three kit-noise sources (§4.4).
- **`analytics/correction.js`:** confirmed the disconnected fourth
  correction calculator (D4), live in Setup only. Its per-day caps agree
  with `CORRECTION_MAX_RATE` for alk/Ca/Mg (0.5/20/25 — the old Mg
  100-vs-25 split is resolved) but it also mints caps for K/NO3/PO4
  (10/2/0.03) that exist nowhere else, and §29.6 has since forbidden
  nutrient corrections outright while this UI still offers nitrate and
  phosphate in its dropdown (`Setup.jsx:168`, `correctable` = every param
  with a CORRECTIONS entry).
- **"assessDrift's dose figures were removed on 14 August" — not what
  happened.** What was removed on 14 Aug was **magnesium's entry in
  `DOSE_ADVICE_RULES`** (`de9a29f`, TW-019), killing the magnesium dose
  figure in the preview path. `assessDrift` itself never emitted a dose
  figure (it is the slope/severity half); `computeDoseCalc` — the actual
  dose-figure half — is **still present and still live** through
  `previewStrengthChange` for alkalinity and calcium. TW-018 (remove the
  dose figures, re-point the preview at the wizard) is still
  `needs-approval`. The narrative half and the dose half are both alive;
  only magnesium's slice is gone.
- **CorrectionPanel:** no longer dead (see §3.7). The one-word prop is
  fixed and regression-tested.
- **`buildOverview`:** confirmed — the narrative renders nowhere; score and
  headline render (§3.1).

---

## 8. Superseded but never removed

- `drift.js`'s `computeDoseAdvice`/`computeDoseCalc`/`DOSE_ADVICE_RULES`/
  `DRIFT_GUIDE`: superseded by decision (wizard-states §0.3/§9.4,
  reef-chemistry §7), decided-removed, still present; two dead call sites
  plus one gated live row (TW-018 pending).
- `buildOverview`'s prose engine: superseded in fact by `buildBriefing`
  (the claims feed) — the paragraphs stopped rendering, the ~440 lines
  stayed, and they still execute per derivation.
- `computeConsumption` (alk-only, fixed 30-day window): superseded in shape
  by `computeElementConsumption` + `computeDemandSeries`; still the source
  of Insights' calcification headline figure and skeleton mass, and still
  carries its dead `recommendedMl`/`adjustMl` dose fields.
- Dashboard's local `stabilityByParam` memo (`Dashboard.jsx:110-116`)
  recomputes what `tank.stabilityByParam` already holds — the comment says
  it is kept "only for the card's recent-range view", but the cards read
  this local map, not the tank's (`:162`), so the consolidation note
  describes an intention.
- `out.events` initialisers (§3.4); the contradictory comments inventory §4g
  listed were mostly cleaned up in the engine files read today, but
  `magnesium.js` still ends on its `dosePlausible` orphan structure (file
  is now constants-only; the function lives in helpers.js — the file-level
  comment at `magnesium.js:1-13` still describes it as containing the
  assessment, which lives in `helpers.js:768`).
- `REMINDER_SEED` cadences vs `freqDays` (§4.11) — one of the two is
  superseded by the other and nobody has said which.

---

## 9. Coverage vs §25's table, as of today

| Parameter | Engine assessment today | Notes |
|---|---|---|
| alkalinity, calcium, magnesium | Full: engine + doseStatus + findings + briefing | The one consolidated path |
| phosphate, nitrate | No level/trend judgement from the engine: findings' generic loops skip them (`NUTRIENTS_AWAITING_OWN_RULES`, `findings.js:57`) | But they are still classified by band on every card/chip via `paramStatus`, graded by `computeStability`/`computeControl`, narrated by `computeNutrientRatio/Production` findings, offered corrections by Setup's calculator (§29.6 forbids), and headline-counted by `buildHeadline`. §29 (16 Aug) wrote their canon — bands, two fixed warnings, same-side count, no-dose rule — and **none of it is implemented**; the only §29 references in `src/` are comments in `helpers.js:321-330` |
| salinity | No assessment. Band chip (`paramStatus`), stability grade, `RATE_RULES.salinity` in the history modal, and the ±1.2-off-35 skew finding (`findings.js:594-613`) | Deliberately left in the generic loops (TW-030 open) |
| ICP | Separate path entirely: `icpStatus`/`ICP_REFERENCE` + `computeIcpTrends` + calibration findings | Own band family (e.g. Ca 415–520 mg/L vs PARAM_DEFS 400–450 vs SAFE_BOUNDS 350–500) |

Magnesium gate / precipitation guard (§5, §20): implemented **nowhere** in
live code — the only mentions are prose strings; red spec tests pin the
requirement (`src/test/spec/classification/alert-thresholds.test.js:90-108`,
`ca-alk-coupling.test.js:117+`, `dosing/magnesium-gate.test.js` — read, not
run).

> **Superseded 16 August, for the gate half only.** Stage 2a built it:
> `src/lib/analytics/magnesium-gate.js` owns the rule, and it is evaluated at
> the two dose engines, `computeDoseAdvice` and Setup's correction calculator,
> with `proposeCorrection` reading the engines' decision off the assessment.
> All four pinning assertions above are green. Canon §10 was amended the same
> day to record what "corrections" covers. **The precipitation guard half of
> this line still stands** — §20's four-hour separation between alkalinity and
> calcium is implemented nowhere, and `dosing/precipitation-guard.test.js`
> remains red. The golden sweep cannot see the gate at all: TW-063.

Enforcement: unchanged from §25's own admission — `scripts/verify/
wordingcheck.mjs` checks one echo in one function; nothing asserts
single-source anywhere else.

---

## Confidence notes

- Everything above with a file:line was read directly in today's tree;
  live/dead claims rest on repo-wide grep for each identifier, including
  re-exports (`test-surface.js` re-exports are test-only by design and were
  not counted as consumers).
- No tests were executed (no node_modules); the three "red spec test"
  characterisations are from reading the test source and confirming the
  asserted behaviour is absent from `src/`.
- The ~42 direct-comparison site count involves judgement about what is a
  "classifying role" (chart geometry and range-edit forms excluded); ±5 is
  the honest error bar. The 28 and 6 are exact.
- The app was not run; nothing here depends on runtime behaviour beyond
  what render paths imply statically.
