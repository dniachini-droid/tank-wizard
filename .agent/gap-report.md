# Stage 4 — The Gap Report

**Read-only. Nothing was changed. This report resolves nothing.**

Stage 4 of `THE-ENGINE-PLAN-v2.md`, run 16 August 2026. The governing rule is
the plan's: **the new messaging layer is built from canon alone.** This report
takes canon — `docs/spec/reef-chemistry.md`, `docs/spec/wizard-states.md`
including the new §23, §24 and §25, and `docs/journeys/` — and every message,
verdict, classification and number the current layer produces, and asks one
question of each: **could this be produced from canon alone?**

Three answers, and they are marked throughout:

| Mark | Meaning |
|---|---|
| **YES** | canon covers it — the section is cited |
| **GAP** | canon does not cover it and should — a decision for Dan |
| **DELETE** | canon does not cover it and deliberately should not — the app says something canon has decided not to say |

**A gap found here becomes a decision. A gap found during implementation
becomes a guess.** That is the whole reason this stage exists, and it is why
nothing below is answered.

The three `message-spec-*.md` files were read as decision records. Where they
and canon differ, canon wins; two places where the record still carries
something canon does not are flagged at G-38 and G-39.

---

## What was read, and what was measured

**Canon:** `reef-chemistry.md` (2,740 lines, §1–§29), `wizard-states.md`
(2,137 lines, §0–§25), `journeys/` (5 files + README).

**Code:** `src/lib/findings.js` (756), `src/lib/narrative-engine.js` (924),
`src/lib/analytics/reading-meaning.js` (300), `src/lib/dosing/state.js` (517),
`src/components/ReadingConfirmation.jsx` (630),
`src/components/TodayPanel.jsx` (`StabilityStrip`, `Briefing`,
`ScoreBreakdown`), `src/components/DoseExpectation.jsx` (`ParamCard`,
`FindingList`, `findingKey`/`findingSignature`/`findingHidden`),
`src/components/Dashboard.jsx` (the history modal and steadiness panel), plus
every threshold table they read.

**Counted:**

| Message site | Distinct outputs |
|---|---|
| `doseStatus` — `state.js` | 24 `headline:` returns across 17 states |
| `readingVerdict` — `ReadingConfirmation.jsx` | 21 `headline:` returns |
| `buildFindings` — `findings.js` | 27 `title:` sites over ~24 finding ids |
| `computeControl` — `reading-meaning.js` | 7 headline forms + 8 `paramContext` prose blocks |
| `buildBriefing` / `buildHeadline` — `narrative-engine.js` | 17 `claim:` sites; ~15 state clauses × ~12 qualifiers |
| **Total** | **~104 distinct user-facing message forms** |

**§24 registers 23 cards.** That is the shape of the problem in one line.

---

# PART 1 — THE NUMBERS CANON DOES NOT NAME

**This is Stage 5's decision list.** Every figure below is live in the current
messaging layer, every one changes what a keeper is told, and canon names none
of them. Each entry gives the **current value** and **where it is used**.

They are grouped by the plan's four families first, then everything else the
sweep found.

---

## 1.1 The three kit-noise tables

Canon names **one** set (`reef-chemistry.md` §5): alkalinity 0.1 dKH, calcium
10 ppm, magnesium 30 ppm. Three tables are live and all three are consulted in
one pass by `buildFindings`.

### Table A — `KIT_PRECISION` (`src/lib/findings.js:78-88`)

Per test-kit brand, chosen in Setup.

| Kit | Alkalinity | Calcium | Magnesium |
|---|---|---|---|
| `hanna` | **0.10** | **15** | **25** |
| `salifert` | **0.15** | **10** | **25** |
| `redsea` | **0.20** | **5** | **25** |
| `other` | **0.20** | **15** | **30** |

**Used by:** `kitNoise()` (`findings.js:90-95`) → `settleWindow()`
(`findings.js:103-110`) → the settle-window clamp that decides whether the
wizard says `settling`, and how many days `doseStatus` tells the keeper to
wait (`state.js:75, 158`). Also read by `ReadingConfirmation`'s "Too early to
tell" and "N dose changes in M days" messages via `ds.settleDays`.

**Canon's position:** §5 gives one figure per element, not four per element.
§21 (`wizard-states.md`) records test-kit precision as a **fact** Setup may
ask for, so the *question* is canonical; the *figures* are not. Only Hanna
alkalinity (0.10) and `other` magnesium (30) match §5; calcium matches §5 at
`salifert` only, and every other cell is a number canon has never seen.

### Table B — `KIT_SIGMA` (`src/lib/analytics/measurement-noise.js:10-13`)

| alkalinity | calcium | magnesium | nitrate | phosphate | potassium | ph | salinity |
|---|---|---|---|---|---|---|---|
| **0.05** | **8** | **15** | **1.0** | **0.01** | **10** | **0.03** | **0.2** |

**Used by:** `kitSigma()` → `buildFindings`' stability-change findings
(`findings.js:657` — `noise = kitSigma(def) * 2`, the guard on `settled-*` and
`destabilised-*`), and `regressionWithError` throughout.

**Canon's position:** unnamed anywhere. Alkalinity 0.05 is **half** §5's
0.1 dKH and calcium 8 is below §5's 10 ppm, so the same reading counts as
movement in one place and as noise in another.

### Table C — `STABILITY_RULES.noiseFloor` (`src/lib/stability-engine.js:32-54`)

| Parameter | `noiseFloor` | `windowDays` | `mode` |
|---|---|---|---|
| alkalinity | **0.1** | 14 | absolute |
| calcium | **10** | 28 | absolute |
| magnesium | **30** | 28 | absolute |
| salinity | **0.2** | 14 | absolute |
| potassium | **20** | 90 | absolute |
| phosphate | **0.02** | 14 | percent |
| nitrate | **1.0** | 28 | percent |
| ph | **0.1** | 28 | absolute |

**Used by:** `findings.js:507-508` (the "heading out of range" trend guard),
`ReadingConfirmation.jsx:200, 210, 275` (three separate movement tests —
"wrong way", "overshot", "not moved"), `reading-meaning.js:147`
(`atResolution`), `state.js` indirectly through the engines.

**Canon's position:** the three dosed elements **match §5 exactly** — YES.
The window figures for alkalinity/calcium/magnesium match §4, and phosphate 14
/ nitrate 28 match §29.7 — YES. Everything else is a gap:

- **salinity 0.2 ppt, potassium 20 ppm, pH 0.1** — canon has no noise floor
  for any of them. §25's coverage table puts salinity at "**nowhere** — TW-030"
  and does not list potassium, pH or ammonia at all.
- **phosphate 0.02 and nitrate 1.0** — §29.7 ratifies the *windows* and the
  *proportional mode* and stops there. The figures are referred to in §29.8
  ("`STABILITY_RULES`' proportional noise floors") and never stated.

### The one that blocks §29 outright

**§29.5 requires nitrate's trend to clear "§5's noise floor". §5 has no nitrate
entry.** The rule as written cannot be implemented from canon. This is the
clearest single instance of the pattern this stage exists to find: a canon rule
that reads as complete and terminates in a figure canon does not hold.

---

## 1.2 The four alkalinity trend thresholds

The plan names four. The sweep found **four families covering all three dosed
elements**, plus a fifth for salinity — 21 numbers in total, none named in
canon.

### `ALK_TREND` / `CA_TREND` / `MG_TREND` — the engines' own grading

`src/lib/dosing/alkalinity.js:30-34`, `calcium.js:29-33`, `magnesium.js:15-19`.

| | `stable` | `mild` / `small` | `meaningful` | Unit |
|---|---|---|---|---|
| Alkalinity | **0.10** | **0.20** | **0.30** | dKH/**day** |
| Calcium | **5** | **10** | **20** | ppm/**week** |
| Magnesium | **10** | **20** | **30** | ppm/**week** |

**Used by:** the `band` field on every assessment, which `doseStatus` reads at
`state.js:308` (`steady = a.band === "stable"` — the `worked` test) and
`state.js:464` (`moving` — the `recovering`/`worsening`/`off-target` split).
So these three numbers decide which of §24.3, §24.17 and §24.18 fires.

**Canon's position:** §11 replaces the *rule* — "a level outside its band and
moving further out is never graded stable, whatever the rate" — and `9.2`
(`wizard-states.md`) records that `ALK_TREND.stable = 0.10` is still live and
still grades a 0.02/day decline as stable. **§11 gives no replacement figure.**
`8.1`'s urgency test names "alkalinity 0.3 dKH/day × 1.5, calcium 20 ppm/week,
magnesium 30 ppm/week" — which are `ALK_TREND.meaningful × 1.5`,
`CA_TREND.meaningful` and `MG_TREND.meaningful`. So canon names the
`meaningful` row for one purpose and never names `stable` or `mild`.

**The `stable` row is the one that matters and the one canon does not have.**

### `DRIFT_GUIDE` (`src/lib/analytics/drift.js:17-21`)

| alkalinity | calcium | magnesium |
|---|---|---|
| **0.5 dKH/week** | **10 ppm/week** | **25 ppm/week** |

Plus derived: `needsAction` at `> perWeek`, `severity: "high"` at
`> perWeek × 2`.

**Used by:** `assessDrift`, which survives §0.3's removal of the second dose
calculator (`wizard-states.md` 9.4 explicitly exempts it: "`assessDrift`, the
slope classifier that produces no dose number, is not what this decision
removes"). It feeds `drift.js:222`'s status.

**Canon's position:** §2 layer 3 quotes "published guidance puts weekly drift
under 0.5 dKH and daily variation under 0.3" **as the reasoning for the 0.6
band width**, not as a grading threshold. The calcium 10 and magnesium 25
figures appear nowhere.

### `RATE_RULES` (`src/lib/analytics/rate-analysis.js:15-18`)

| | `maxGapDays` | `dailyGood` | `dailyOk` | `weeklyGood` | `weeklyOk` |
|---|---|---|---|---|---|
| alkalinity | **4** | **0.3** | **0.5** | **0.5** | **1.0** |
| salinity | **5** | **0.1** | **0.2** | **0.3** | **0.6** |

Plus the **90th-percentile** selector on close-pair rates
(`rate-analysis.js:40`).

**Used by:** the steadiness panel's "Day to day" and "Weekly drift" bars —
`Dashboard.jsx:459-486`. **This is the panel Dan was reading when he found the
contradiction on 16 August:** the `−0.50 dKH/wk` figure is
`rates.weekly.value` graded against `weeklyGood: 0.5`.

**Canon's position:** unnamed. §25.2 settles what the panel is *for* and
forbids direction words on it; it names no threshold, and does not say whether
the two bars survive at all.

### `CONSISTENCY_RULES` (`src/lib/analytics/time-in-range.js:75-94`)

18 numbers — `tight` and `moderate` for nine parameters.

| Parameter | mode | `tight` | `moderate` |
|---|---|---|---|
| alkalinity | absolute | **0.5** dKH | **1.0** dKH |
| calcium | absolute | **30** ppm | **60** ppm |
| magnesium | absolute | **50** ppm | **100** ppm |
| potassium | absolute | **45** ppm | **70** ppm |
| salinity | absolute | **0.5** ppt | **1.0** ppt |
| ph | absolute | **0.2** | **0.4** |
| phosphate | fold | **1.8×** | **2.6×** |
| nitrate | fold | **1.6×** | **2.3×** |
| ammonia | absolute | **0.05** ppm | **0.1** ppm |

**Used by:** `computeControl` (`reading-meaning.js:184-186`) — these are what
choose between §22's six registered verdicts. `gradeSpread`
(`stability-engine.js`) uses the same table for `ParamCard`'s steadiness chip.

**Canon's position:** §22 registers the six verdicts and says they are "graded
over the analysis window … from the spread or the fitted rate of the readings
in it". **It names no threshold at all.** All 18 figures are Dan's.

### A dimensional note, recorded not resolved

Alkalinity carries a `stable` in dKH/**day** (`ALK_TREND`), a drift guide in
dKH/**week** (`DRIFT_GUIDE`), a daily *and* a weekly grade (`RATE_RULES`), and
a **spread** in dKH over a window (`CONSISTENCY_RULES`) — four different
physical quantities, four thresholds, one element. The plan's "a 0.6 dKH/week
drift is 'hold' in the wizard and amber in the history modal" reproduces
exactly: 0.6/week is 0.086/day, below `ALK_TREND.stable` 0.10 → `stable` →
`hold`; and 0.6 > `DRIFT_GUIDE.perWeek` 0.5 and > `RATE_RULES.weeklyGood` 0.5 →
amber. **Both are correct against their own constant.** Choosing one number
does not by itself fix this — the four are not the same measurement, so Stage 5
needs to decide *which quantity* the single threshold measures before deciding
its value.

---

## 1.3 `paramContext`'s absolute values

`src/lib/analytics/reading-meaning.js:17-87`. Eight prose blocks, fired
whenever the last reading is outside the user's band, rendered on the history
modal below the steadiness verdict. **Every figure is a hobby-consensus level
stated to the keeper as fact, against a band the keeper set themselves.**

| Parameter | Figures quoted | Line |
|---|---|---|
| magnesium high | "**1500s**", "the **1300–1400** most guides quote"; salt-mix trigger at `salt.values.magnesium >= ` **1380** | `:26` |
| magnesium low | *(no figure — prose only)* | `:28` |
| calcium high | "tanks run happily up to around **500–550** ppm" | `:33` |
| calcium low | branch at `value < ` **380**; else "comfortably inside the **380–450** ppm range most tanks run happily" | `:35-37` |
| alkalinity high | *(no figure)* | `:42` |
| alkalinity low | "no more than about **0.5** dKH a day" | `:44` |
| phosphate high | "above roughly **0.15** ppm it can start interfering with alkalinity uptake" | `:49` |
| phosphate low | *(no figure)* | `:51` |
| nitrate high | *(no figure)* | `:56` |
| nitrate low | "dose nitrate back up to around **5** ppm" | `:58` |
| potassium high | "above about **430** ppm"; "anywhere in the **380-420** range" | `:63` |
| potassium low | "below about **360** ppm"; "hobby kits only resolve to roughly **20** ppm"; "re-test in a month rather than a week" | `:65` |
| salinity / ph / ammonia | *(no figures)* | `:68-84` |

**Canon's position, figure by figure:**

- **0.5 dKH/day** — YES, `reef-chemistry.md` §3's rail.
- **380 ppm calcium** — YES, §2 layer 1: "Below 380 ppm calcium slows growth".
- **calcium 500–550** — **contradicts canon.** §2 layer 1 sets calcium's safe
  ceiling at **500** because "above 500 it pulls alkalinity down". The card
  tells a keeper 550 is fine.
- **magnesium 1300–1400 / 1500s** — §2 layer 3 suggests **1275–1425** and
  layer 1 caps at **1600**. Neither figure quoted is canon's.
- **phosphate 0.15** — unnamed. §29.2's suggested band is 0.03–0.10 and §29.4's
  only fixed figure is the 0.03 floor. §29.2 explicitly holds that a keeper
  running 0.20–0.40 "is not making a mistake, and the app may not treat them as
  one" — this line does exactly that.
- **nitrate 5 ppm target** — §29.2's suggested band starts at 5; "most reefers
  dose nitrate back up to around 5" is a levers claim, forbidden by §29.6.
- **potassium 430 / 360 / 380–420 / 20 ppm** — unnamed. Canon has no potassium
  reasoning of any kind.
- **salt-mix magnesium 1380** — unnamed; `SALT_MIX` is the hardcoded baseline
  §6 declines to wire into dosing.

**This block is also the largest concentration of §23.5 breaches** (never
speculate about causes) and §29.6 breaches (no suggested levers) in the app —
see D-11.

---

## 1.4 The alert widths

`ALERT_WIDTH` (`src/lib/analytics/reading-meaning.js:102`) and `positionBand`
(`:104-116`).

| alkalinity | calcium | magnesium |
|---|---|---|
| **± 1.0 dKH** | **± 50 ppm** | **± 200 ppm** |

**Used by:** `positionBand` → `computeControl`'s §22 alert tier
(`reading-meaning.js:276-283`), and `magnesiumAlertLow`
(`magnesium-gate.js:60`) → the magnesium gate in `alkalinity.js` and
`calcium.js`.

**Canon's position:** these three figures are **YES — `reef-chemistry.md` §18**,
hung from the band midpoint exactly as §18 requires, and the §10 floor at
`SAFE_BOUNDS.magnesium.min` (1150) is implemented at `magnesium-gate.js:63`.
The plan's expectation that `ALERT_WIDTH` "disagrees with `SAFE_BOUNDS` on
every element" **does not reproduce** — measured against the shipped bands, the
ordering alert-then-safe holds on five of six edges:

| | mid | alert-low | safe min | alert-high | safe max |
|---|---|---|---|---|---|
| alkalinity (8.2–8.8) | 8.5 | 7.5 | 7 ✓ | 9.5 | 11 ✓ |
| calcium (400–450) | 425 | 375 | 350 ✓ | 475 | 500 ✓ |
| magnesium (**1250–1400**) | 1325 | **1125** | **1150 ✗** | 1525 | 1600 ✓ |

The one inversion is magnesium's, it is the Stage 2 item, and §10 already
records both the cause (the shipped band is 1250–1400, not §2 layer 3's
1275–1425 — TW-052) and the fix (the floor). **Recorded as YES-with-a-known-
exception rather than as a Stage 5 number.**

**But three real gaps sit underneath it:**

- **N-1 — no alert thresholds for six of nine parameters.** §18 gives alert
  levels for alkalinity, calcium and magnesium only. §19 requires *every*
  parameter the engine assesses to have a verdict, and §13's seven bands
  include `alert-low` and `alert-high`. `positionBand` returns tier 1 for
  phosphate, nitrate, salinity, potassium, pH and ammonia and can never return
  tier 2 for them — a silent, undocumented two-band vocabulary for six
  parameters. The code comment at `reading-meaning.js:94-97` says as much.
  **Canon must either name six more alert pairs or say those parameters have
  none.**
- **N-2 — `settings.mgAlertLow`** (`magnesium-gate.js:55`) is a live per-user
  override with no Setup field and no canon entry. §18 says alert thresholds
  are "all `[user]` adjustable"; §21 says Setup asks facts, not judgements, and
  names "notification thresholds" as a judgement. **The two read against each
  other**; the app has half of each.
- **N-3 — `TONE_TIER`** (`reading-meaning.js:121`) maps six hex colours to
  three tiers to implement §22's "never renders calmer". The mapping is a
  colour→severity table with no canon entry; §15's colour registry names four
  severity colours (`STATUS_COLOR`), and `TONE_TIER` uses six, four of which
  (`#2A8050`, `#1D6FA5`, `#A2621B`, `#C4285B`) are not in it.

---

## 1.5 Everything else the sweep found

Grouped by the file that owns it. **None of these is named in canon**, and each
changes what is said.

### The health score — `narrative-engine.js`

The score is a 0–100 number on the front of the app with **no canon entry
whatever**. Its constants:

| Figure | Value | Where |
|---|---|---|
| stability points by grade | green **1**, amber **0.55**, red **0.15**, unknown **0.7** | `:96-98`, `:793` |
| out-of-band position points | ≤0.25 bands out → **0.78**; ≤0.75 → **0.45**; ≤1.5 → **0.2**; beyond → **0.03** | `:106`, `:803` |
| the blend | `stability × ` **0.4** ` + range × ` **0.6** | `:114`, `:809` |
| mean-vs-worst | `mean × ` **0.6** ` + worst × ` **0.4** | `:126`, `:815` |
| ammonia caps | above max → **22**; detectable → **42** | `:823-824` |
| evidence caps | <3 params or <**12** readings → **70**; <**30** readings → **85** | `:148-149`, `:841-842` |
| safety cap | `45 − min(1, out/(span×2)) × ` **30** → a **45**-to-**15** range | `safetyCapFor`, `:753` |
| headline score bands | ≥**85** / ≥**70** / ≥**50** | `:848-851` |
| score colour bands | ≥**85** / ≥**70** / ≥**50** | `TodayPanel.jsx:623` |

**19 numbers, one number on screen, zero canon.** See G-30.

### `buildHeadline` — the tank-summary one-liner

| Figure | Value | Line |
|---|---|---|
| "most in range" / "most steady" | `>= ceil(total × ` **0.75** `)` | `:200-201` |
| "half out" | `<= floor(total × ` **0.5** `)` | `:202` |
| urgency count switch | `urgent >= ` **2** | `:219` |
| "several are moving" | `drifting >= ` **2** | `:246, 254` |
| the 18-word budget | **18** words (referenced in comment at `:294`, enforced nowhere) | `:294` |
| out-list naming | names **1**, then **2**, then "and N others" | `:211-213` |

### `buildBriefing` — the claims feed

| Figure | Value | Line |
|---|---|---|
| severity ranks | act **0**, watch **4**, info **7**; dose claims **1**–**6** | `:388`, `:442-540` |
| visible claim limit | **12** | `:728` |
| drift claims shown | first **3** | `:579` |
| "solid" line threshold | `solid.length >= ` **2** | `:695` |
| "travelling" test | `windowRows(…, ` **30** `)` and `rows.length >= ` **4** | `:613-614` |

### `buildFindings` — `findings.js`

| Finding | Threshold | Line |
|---|---|---|
| kit offset reported | `|pct| >= ` **5** %; severe at **25** % | `:199-200` |
| ammonia detectable | `> step/` **2** | `:229` |
| "far out" | `outBy >= ` **2 × half-band** (i.e. a full band width) | `:252` |
| ionic ratio off | `< band[0] × ` **0.85** ` or > band[1] × ` **1.15** | `:298` |
| implausible alk consumption | `> ` **2** ` dKH/day` | `:413` |
| implausible Ca consumption | `> ` **30** ` ppm/day` | `:426` |
| sparse testing | `gap > expected × ` **2**, `expected = max(`**3**`, freqDays)`, window **60** d | `:443-450` |
| heading-out: window | **30** days, `rows >= ` **5** | `:492-493` |
| heading-out: significance | `|slope| > se × ` **2** | `:499` |
| heading-out: measurability | `|slope| × 7 < noise / ` **2** → skip | `:508` |
| heading-out: horizon | `days > ` **45** → skip; `atEdge` at `days <= ` **2** | `:537-538` |
| `directional()` | `rows >= ` **4**, `steps >= ` **3**, `same/steps >= ` **0.67** | `:144-156` |
| CO2 signature | `ph < ` **7.9** ` && alk >= def.min` | `:569` |
| pH high | `ph > ` **8.45** | `:575` |
| alk-vs-nutrients lean | `alk >= ` **9** ` && (no3 < ` **3** ` || po4 < ` **0.03** `)` | `:598-600` |
| alk-vs-nutrients rich | `alk <= ` **7.5** ` && no3 >= ` **5** ` && po4 >= ` **0.05** | `:599, 606` |
| salinity skew | `|value − ` **35** `| >= ` **1.2**; staleness **21** d | `:620-627` |
| settled | `now <= before × ` **0.55**; windows **21** d vs **21–63** d, `>= 5` rows each | `:642-660` |
| destabilised | `now >= before × ` **1.9** | `:666` |
| spread measure | p90 − p10 (`q(0.9) − q(0.1)`) | `:650-653` |
| nutrients both low | `no3 < ` **2** ` && po4 < ` **0.02** | `:685` |
| N:P ratio | `> ` **250** ` : 1` or `< ` **40** ` : 1`, against "roughly **100**:1" | `:693-703` |
| equilibrium offset | `< eq × ` **0.85** / `> eq × ` **1.15** | `:720` |
| pH/alk staleness | **30** days | `:568` |

**`SAFE_BOUNDS`** (`findings.js:112-136`) — alkalinity 7–11, calcium 350–500,
magnesium 1150–1600 are **YES, §2 layer 1**; nitrate 0.5–50 and phosphate
0.01–0.5 are **YES, §29.2** (promoted to canon 16 August). **pH 7.7–8.6,
salinity 32–37 and potassium 330–500 are unnamed anywhere in canon.**

### `readingVerdict` — `ReadingConfirmation.jsx`

| Figure | Value | Line |
|---|---|---|
| "dead centre" | `fromMid < ` **0.35** of the half-band | `:358, 373` |
| "near the edge" | `fromMid > ` **0.8** | `:389` |
| "well above/below band" | `> def.max + halfBand` (a **half band** past the edge) | `:394, 402` |
| "barely moved" | `|delta| < def.step × ` **1.5** | `:378` |
| dose matched | `|maintenance − dose| / dose <= ` **0.12** | `:291` |
| too many changes | `recentChanges >= ` **3**; advice "leave it alone for `wait × ` **2** ` days`" | `:169-172` |
| auto-close | **15** seconds | `:437` |
| `SplashBurst` | **18** drops | `:417` |

### `computeControl` — `reading-meaning.js`

| Figure | Value | Line |
|---|---|---|
| default window | `days = ` **90** | `:123` |
| minimum readings | `rows.length < ` **3** → null | `:125` |
| percentiles | **5** / **50** / **95** | `:127` |
| directionality cutoff | `> ` **0.6** → "trending", else "oscillating" | `:144` |
| readings-far-apart | `avgGap > max(`**7**`, freqDays × `**2**`)` | `:172` |
| "dialled" | `medianInside && pct >= ` **85** ` && tight` | `:252` |
| consistency score curve | **0.15**, **0.85**, **0.35**, **0.5**, **0.38**, floor **0.12** | `:195-197` |
| retarget worth offering | `suggestDiff > step × ` **1.5** | `:290` |

### `StabilityStrip` — `TodayPanel.jsx:298-355`

| Figure | Value | Line |
|---|---|---|
| axis margin | band width × **0.35** either side | `:307-308` |
| reading overhang | band width × **0.08** | `:307-308` |
| minimum span width | **1.5** % | `:330` |
| "travelled" test | `|now − then| >= def.step` | `:320` |
| out-of-band span colour | `#A2621B` | `:331` |

### `doseStatus` — `state.js`

| Figure | Value | Line |
|---|---|---|
| stored plan expiry | **30** days | `:281` |
| dose-change "old news" | `max(settle × ` **2**`, ` **14** ` days)` | `:113` |
| dose-change hard expiry | `max(settle × ` **3**`, ` **42** ` days)` | `:115` |
| recent-changes window | `settle × ` **2** ` + 1` days | `:141` |
| "wrong tool" trigger | `oneOff > normal × ` **25** | `:396` |
| volume ceiling | `oneOff > ` **1500** ` mL` | `:407` |
| staged plan "more to go" | `|target − applied| > ` **0.5** ` mL` | `:309` |
| `worked` test | `a.band === "stable"` (→ `*_TREND.stable`) | `:308` |

**§9 names the ~1.5 L ceiling — YES**, and §25.6 item 1 carries the open
question of whether it survives. **The 25× multiplier is unnamed.**

### The steadiness panel's windows — `Dashboard.jsx:232-234`

| Cadence | Window buttons |
|---|---|
| `freqDays <= 3` | **7** / **30** / **90** / All |
| otherwise | **30** / **90** / **180** / All |

Insights uses a separate default of **90** (`Insights.jsx:128`). See G-12.

---

# PART 2 — GAPS

**Canon does not answer these, and it should.** Each is a decision for Dan.
None may be settled by an implementer.

---

## 2.1 States with no card

§24 says: *"With 24.23 the wizard is covered. Every state in §2's ordered list
has wording."* **Checked branch by branch, four are not.**

**G-1 — `due` (§2 branch 10) has no card.** A staged plan is running, the
settle window has passed, and no reading has been logged. The app says
*"Alkalinity needs a test to confirm the new dose"* (`state.js:298`). §24.15
*"Time to test"* is explicitly labelled `correction-due` — a different branch
(§2 branch 4) with a different subject (a correction's estimate, not a staged
dose plan). **Which card does branch 10 render?** Reusing §24.15 means a
staged plan and a correction share one wording; a new card means §24 has
twenty-four.
*Note:* §9.1 records `due` as unreached by any test, so this gap has never been
seen on screen by anyone.

**G-2 — `worked` route 12 (steady, out of band) has no card.** §2 branch 12,
tab label "Steady, out of range", tone **grey** in §3's table where every other
`worked` is teal. §24.6 is the in-band `worked`. Route 12 is mentioned twice in
canon and answered neither time: `reef-chemistry.md` §28.6 asks whether it
qualifies for a return-plan offer and defers it to "Stage 4's gap report", and
§24.3 repeats the deferral. **Two questions, both open:** what does the card
say, and does it carry §24.3's *"Plan a gradual return"* offer? The app today
says *"Alkalinity is steady but not where you want it"* + *"the level itself
needs a separate correction"* (`state.js:319-320`) — which offers a
**correction**, where §28.2 says a level that is stable and out of band is
exactly the return-plan case.

**G-3 — the negative-consumption hold has no card.**
`reef-chemistry.md` §24 is a full four-part rule with its own §24-"Surfaces"
paragraph requiring the idle card to be marked and to echo the wizard. The app
implements it at `state.js:499-503` (`a.gainingHold`): *"Alkalinity is rising
faster than your dose accounts for / The dose is unchanged … Check whether a
water change or a one-off correction is missing from the log, then test again
in two days."* **§24's twenty-three cards contain no such card**, and
`reef-chemistry.md` §24 part 4 additionally requires an **escalation** wording
at three consecutive negatives with nothing logged, which exists in neither
canon's card set nor the code. **Two cards missing: the hold and the
escalation.**

**G-4 — `settling` "one reading short of a verdict" has no clear card.**
`state.js:345-353`: tested, but the readings are neither steady enough to call
it settled nor moving enough to want a change. §24.5 (*"Not enough readings
yet"*) is the too-few-readings refusal; §24.21 (*"You have logged one reading
since your dose change"*) is a contradiction state about exactly one reading.
The app's case is **two or more readings, inconclusive**. **Which card, or a
twenty-fourth?**

---

## 2.2 States canon lists that the app has deleted, and the reverse

**G-5 — `wizard-states.md` §2 branch 22 and §3's "Dose right, level off" row
describe a card `reef-chemistry.md` §26 removed.** §26's "One consequence worth
stating" says the card "is removed … the condition became unreachable", and
`state.js:505-513` carries the comment confirming it. **§2 still lists it as a
branch and §3 still lists it as a state.** Canon contradicts canon. This is a
housekeeping decision, but it matters here because §24 counts cards against
§2's list and the count is off by one.

**G-6 — two of journey 4b's four contradiction states have no engine
candidate, and canon says so without choosing.** §24.22 records it plainly:
24.7 and 24.22 "may turn out to be [`fell-short` and `overshot`] with their
preconditions widened rather than new branches; 24.8 and 24.21 have no
candidate anywhere in the code. **Settling which is which is TW-026's first job
and Stage 6d's work — not an implementer's judgement call.**" **Carried here as
an open decision, unchanged.**

**G-7 — §23.6's recency window is undefined, and the engine cannot answer the
precondition.** §23.6 makes `recovering` and `worsening` conditional on *"no
recent dose change"* and says explicitly that both *what counts as recent* and
*whether the engine knows about a change at all* are open — journey 4b's open
question 2, "Dan's, unanswered, and **not settled by this rule**". The app has
**three** different answers live and none is canon:

| Mechanism | Window | Line |
|---|---|---|
| `plan.appliedAt` gate (only wizard-made changes) | ≤ **30** days | `state.js:279-281` |
| `doseFacts` "old news" | `max(settle×2, 14)` d, or in-band-and-settled | `state.js:113` |
| `doseFacts` hard expiry | `max(settle×3, 42)` d | `state.js:115` |

**G-8 — §23.6's precondition and §2's branch order are in tension and canon
does not order them.** §23.6 says a recent change wins the wording. §2 says
first match wins and branch 21 (`recovering`/`worsening`) sits *below* branches
13–14 (`fell-short`/`overshot`). Today a change made **outside the wizard**
writes no `plan.appliedAt`, falls past 13–14, and reaches branch 21 — producing
exactly the bare-position card §23.6 forbids. §24 records this and does not
resolve it.

---

## 2.3 What a parameter chip says

**G-9 — the parameter card's chip is unspecified, and it is where §7's
90-pixel violation lives.**

The plan's Stage 3 scope named it: *"Parameter cards and the history modal —
**what a chip says**, what a steadiness verdict says, and how the two relate."*
§25.2 answers the second and third. **It does not answer the first.**

`ParamCard` (`DoseExpectation.jsx:219-317`) renders **four independently
computed severities for one reading in one card**:

| Element | Source | Vocabulary |
|---|---|---|
| the value's colour | `paramStatus` → `STATUS_COLOR` | ok / low / high — three words, **not §13's seven** |
| the steadiness chip | `stab.label` + `STABILITY_COLOR[stab.grade]` | green / amber / red |
| the dose chip | `dose.short` (17 possible values) | `doseStatus`'s tab labels |
| the notes chip | `worst.title` or "N notes" | `buildFindings`' 27 titles |

**§13 requires exactly one band vocabulary of seven words and forbids any
surface inventing a category.** `paramStatus` returns three. **§19 forbids a
surface computing its own verdict.** This card computes three.

**Open:** what does the chip show — the §13 band? the §22 verdict? the wizard's
`short`? And what happens when they disagree, which is the state §7 describes
as live today at 6.9 dKH.

**G-10 — §22's verdicts have no home on a card.** §22 registers six verdicts
and §25.2 gives them a panel inside the history modal. `ParamCard` renders
`stab.label` — the output of `gradeSpread`, a **different** function over a
**different** window from `computeControl`, producing green/amber/red rather
than the six. **Are the two the same verdict at two sizes, or two verdicts?**

**G-11 — the parameter card's "N notes" chip has no canon model.** §20 says one
live notice per parameter. The chip counts findings and says "3 notes". If §20
holds there can only ever be one, plus the §25.4 kinds 2 and 3. **Does the
count survive supersession?**

---

## 2.4 The steadiness panel

**G-12 — the panel's window is user-selectable and canon fixes it.** §25.2
rule 1: *"The heading states the window the verdict was actually graded over.
That is `reef-chemistry.md` §4's analysis window for the parameter — 14 days
for alkalinity, 28 for calcium and magnesium."* The app offers
**7/30/90/All** (or 30/90/180/All) and grades over whichever the keeper picks
(`Dashboard.jsx:232-243, 273`). Insights offers its own selector defaulting to
**90** (`Insights.jsx:128`). **§4 has no window for potassium, pH or ammonia at
all**, and §29.7's 14/28 for phosphate/nitrate do not match any button.

Under §25.2 as written the selector cannot survive, because the moment the
keeper picks 90 days for alkalinity the heading names a window §4 does not
grade over. **Three shapes, none authorised:** delete the selector; keep it and
let the heading follow the selection (which is what the code does, and which
§25.2's *reasoning* arguably permits since heading and grading agree); or keep
it and grade §4's window regardless, which is the exact defect §25.2 was
written to fix. **Dan's.**

**G-13 — `sliding` renders as "Moving up/down fast", which §25.2 rule 2
forbids.** Canon already records this and declines to reword it: §22 and §25.2
both say *"it is recorded rather than reworded here, because minting
replacement copy is §24's kind of work and the owner has not drafted it."*
**Carried: one headline needs drafting.** Live at `reading-meaning.js:244`.

**G-14 — the panel's own numbers have no canon.** §25.2's worked example is
*"Wide swing — 1.1 dKH between highest and lowest. 18% of readings in range."*
The app shows p05–p95 ("usually 8.2–8.7"), a percentage in range, a
consistency bar, and — for alkalinity and salinity only — two rate bars.
**Canon names a spread and a percentage. It does not say whether the rate bars
belong on the panel at all**, and the "Weekly drift" bar is one half of the
16 August contradiction.

**G-15 — `paramContext` has no home.** Eight prose blocks rendered under the
verdict (`reading-meaning.js:285`, surfaced by `Dashboard.jsx`). It is not a
§13 band, not a §22 verdict, not one of §25.4's three finding kinds. See D-11
for why most of it is a deletion; **the gap is whether anything replaces it** —
"what does out-of-range actually mean for this parameter" is a real question a
keeper asks, and canon's answer today is silence.

---

## 2.5 The reading confirmation

**G-16 — the receipt's wording exists as exactly one example.** §25.3:

> **8.5 dKH logged**
> In your range. Down 0.2 from two days ago.

Three facts — value, position, movement since last. **Unanswered:**

- What does line 2 say when the reading is **out** of range? "In your range" is
  §15's registered phrase; its opposite is "out of range", which is a plainer
  register than the current *"A little low"* / *"Well below band"*.
- What when there is **no previous reading**, so there is no movement?
- What when the previous reading is **months** old — is "down 0.2 from two days
  ago" still the shape at "down 0.2 from four months ago"?
- **What is the noise floor on the movement clause?** §5's floor is 0.1 dKH;
  the example quotes 0.2. Does a 0.05 change get a movement clause at all?

**G-17 — §25.3 removes 21 message forms and replaces them with the card, and
the card cannot say what nine of them said.** The confirmation currently
carries messages that exist nowhere in §24:

| Current message | `ReadingConfirmation.jsx` | Nearest §24 card |
|---|---|---|
| "That is 3 dose changes in 5 days" | `:171` | **none** |
| "The change did not go far enough" | `:243` | 24.19-ish, different claim |
| "It has moved the wrong way" | `:246` | **none** |
| "It is still falling" | `:249` | 24.7 |
| "That is the dose change overshooting upward" | `:258` | 24.20 |
| "N days at X mL a day and it has not moved" | `:299` | 24.8 |
| "Held at 8.0 dKH, below your range" | `:294` | 24.3 |
| "Heading the right way" | `:384` | **none** |
| "Nice work — alkalinity is back in range" | `:61` | 24.13/24.14 |

**The oscillation warning at `:169-174` is the one worth naming as a gap
rather than a deletion.** Three dose changes inside two settle windows, on an
element that takes two days to answer, is a real fault the keeper is committing
and the app is the only thing that can see it. §12 (`reef-chemistry.md`)
refuses to *change* a dose inside the settle window; nothing in canon says the
app **tells the keeper they are adjusting too fast**. **Does that message
survive, and as which of §25.4's three kinds?**

**G-18 — celebration is unspecified.** `SplashBurst`, the 🎉 emoji and the
`celebrate` flag fire once, on `correction-done` (`:59-65`). §24.14's
*"Correction finished"* is a two-line card. **Does the app still celebrate?**
Canon has no register above and no emoji anywhere.

**G-19 — the 15-second auto-close is unspecified.** `:437`. §18's
accessibility floor does not cover it; nothing in canon says a message may
remove itself.

---

## 2.6 Findings

§25.4 says three kinds survive and *"a fourth kind is a finding, not a
feature"*. **Mapped, all 24 finding ids:**

| Finding id | §25.4 kind | Verdict |
|---|---|---|
| `far-out-<param>` | 1, parameter verdict | duplicates §24.9/§24.23 — see G-20 |
| `heading-out-<param>` | 1? | **GAP** — see G-21 |
| `ammonia-high` / `ammonia-detected` | 1 | **GAP** — canon has no ammonia (G-22) |
| `salinity-off` | 1 | **GAP** — §25 says salinity is "nowhere — TW-030" |
| `ionic` | 3, relationship | **YES** — §20's coupling; §25.4's own example |
| `alk-vs-nutrients` | 3 | **GAP on figures** — §29.3 names the finding, canon names no threshold |
| `nutrient-starved` | 3 | **GAP on figures** — same |
| `ratio-po4-limited` / `ratio-no3-limited` | 3? | **GAP** — canon has no N:P ratio reasoning at all |
| `co2-accumulation` | 3 | **GAP** — canon has no pH reasoning |
| `ph-high` | 1 | **GAP** — same |
| `strength-missing-<el>` | — | **GAP on placement** — §16 requires the refusal; §24.12 is the card. Is it a notice too? |
| `strength-<el>` "looks wrong" | — | same |
| `strength-unverified` | — | **GAP** — §8.3's "never veto silently" is adjacent; this is not that |
| `no-volume` | — | app-level; §17 + §12 require the refusal, §25.1 evicts app-level notices |
| `implausible-alk` / `implausible-ca` | — | §8.2 constraint 3 → the `blocked` card. Duplicate? |
| `kit-<param>` / `kit-replaced-<param>` | — | **DELETE candidate** — see D-1 |
| `sparse` | — | **GAP** — see G-24 |
| `settled-<param>` / `destabilised-<param>` | — | **GAP or a seventh verdict** — see G-23 |
| `equilibrium-<param>` | — | **DELETE candidate** — see D-6 |
| `icp-contaminant` / `icp-offrange` | — | **GAP** — §25's coverage table: ICP is "nowhere — not scheduled" |

**G-20 — the 6.9 dKH overlap is three cards, not two.** §25.6 item 2 carries
the overlap between §24.9 (*very low*) and §24.23 (*far out, gradual plan*).
**The sweep found a third claimant:** `far-out-<param>`
(`findings.js:243-277`) fires at a full band width out and produces its own
"dangerously low" title with its own detail, and `narrative-engine.js:457-459`
already contains a hand-written suppression rule using a **regex over the
wizard's own English** to stop the two colliding. **When §25.6 item 2 is
answered, it must be answered for three surfaces.**

**G-21 — "heading out of range" is the 16 August contradiction, written down
and shipped.** `findings.js:466-557` produces, on the same screen as the
wizard's verdict:

> *"Alkalinity is 8.5 dKH and moving down at about 0.35 dKH a week. At that
> pace it reaches the bottom of your range in roughly 12 days. The dosing
> protocol looks only as far back as your last dose change and sees nothing to
> act on there, so no dose change is suggested yet — **but the longer view is
> drifting.** Worth another test or two to see which holds."*

That sentence is a **surface reconciling two windows in prose**, which is
precisely what §25.2 replaced with a structural fix. It is also §13's
`drifting` band — inside the band, trending toward an edge — which is a
registered band with **no card in §24 and no notice model in §25**.

**Three questions, all Dan's:** (a) does `drifting` produce a notice at all, or
is it only a chip? (b) if it does, is it the wizard's verdict (in which case
the wizard needs a `drifting` state, which §2 does not have) or a fourth
finding kind? (c) if the wizard says hold and the 30-day regression says
drifting, **which one speaks** — because §25.2's answer for the panel was "they
never make the same kind of claim", and here they make exactly the same claim.

**G-22 — ammonia has no canon.** It is in `PARAM_DEFS` with `idealAt: "min"`,
it is the only parameter where one reading is grounds for acting, it caps the
health score, it has its own confirmation branch (`ReadingConfirmation.jsx:343-
353`), its own findings (`findings.js:213-236`) and a `CONSISTENCY_RULES` entry
it can never use. **§25's coverage table does not list it.** §13's seven bands
do not fit a parameter whose target is zero. **Ammonia needs its own §29.**

**G-23 — "has settled down" / "has become less steady" is a seventh and eighth
verdict.** `findings.js:636-673` compares the last 21 days' spread against the
21–63 day window and reports a **change in consistency**. §22 registers six
verdicts and says *"A surface inventing a seventh verdict is a finding, exactly
as §13 says of the bands."* This is arguably not a verdict — it is a claim
about the *derivative* of a verdict — but it is a graded statement about
steadiness in words that are not the six. **Does it survive, and as what?**

**G-24 — testing cadence has no messaging model.** Three separate mechanisms
tell a keeper about testing and canon governs none of them: `sparse`
(`findings.js:438-464`, "alkalinity is tested rarely"), `staleCount` in
`buildHeadline` (`:285-287`, "one reading is getting old", at `freqDays × 2`),
and `doseStatus.testOn`. §4 sets cadences and §19 (`reef-chemistry.md`) sets a
2-day minimum interval. **Journey 1 §1 says Dan's real cadence is adaptive** —
2 days normally, 3 when steady, 4–5 when confident, tighter around a change —
and journey 1's finding 1 names the fixed cadence as a gap. **Canon has not
taken this up.** Is "you are testing too rarely" a notice, and against which
cadence?

**G-25 — the suspect-reading threshold is unnamed.** §25.4 kind 2:

> *"7.2 dKH, 1.3 below your last reading two days ago. That is a larger jump
> than the tank has shown before."*

**"Larger than the tank has shown before" is a rule with no figure.** Larger
than the maximum step-to-step change on record? Than a percentile of them? By
how much? The app's nearest equivalent is `readingVerdict`'s *"Far enough out
that a re-test is worth doing"*, triggered at **a half band width past the
edge** (`:394, 402`) — a position test, not a jump test, so it is not the same
rule wearing a different number. **Nothing in the app implements §25.4 kind 2.**

**G-26 — relationship notices have no placement and no register.** §25.6 item 4
carries the placement. Two further questions the sweep raises: (a) §25.4's
magnesium-gate example says *"neither holds properly below about 1250"* while
§10's gate fires at **alert-low** (1150 on the shipped band, `magnesium-
gate.js:63`) and §10's own text says *"below roughly 1200–1350"* — **three
figures for one sentence**; (b) is a relationship notice hideable, and does
hiding it hide it for both parameters?

---

## 2.7 The tank summary

**G-27 — the collapsed headline is unspecified.** §25.1: *"**Collapsed** — the
summary headline only."* That is the entire specification. `buildHeadline`
(`narrative-engine.js:185-307`) composes it from ~15 state clauses × ~12
qualifiers — "well over a hundred distinct lines", by its own comment. **It is
the single most-read string in the app and canon gives it one word.**

Under §25.1's own logic ("the short form is generated, never written") a
handwritten tank-level headline is the thing the rule exists to prevent — but
§25.1 also asks for one. **Options, unresolved:** the worst live notice's
headline; a fixed count ("3 things to look at"); nothing at all; or a
composition rule of its own.

**G-28 — ordering is unspecified.** §20 gives one notice per parameter; §25.1
gives the expanded list. **In what order?** The app uses a `rank` 0–8
(`narrative-engine.js:388-540`) that interleaves findings and dose states.
Canon says nothing.

**G-29 — "N of M are in range and holding" has no model.** `narrative-
engine.js:695-719`. A tank-level positive claim, not a parameter notice.
§25.1 says the summary shows **one notice per parameter and nothing else**, so
strictly this is a deletion — but it is also the only place the app says
anything reassuring, and journey 4 does not object to it. **Recorded as a gap
because deleting it silently changes the app's tone, which is Dan's call.**

**G-30 — the health score has no canon at all.** A 0–100 number, a colour, a
headline band and a nine-row working panel (`ScoreBreakdown`,
`TodayPanel.jsx:364-437`), built from the 19 constants in §1.5. It is not a
band (§13), not a verdict (§22), not a notice (§20), and not a message (§14).
**§14's hard rule — "a message must never state a number that differs from the
number shown alongside it" — has already been broken by it once**
(`narrative-engine.js:737-741` records the card showing 42 while its own
working summed to 71).

**Three shapes:** it is specified into canon; it is deleted; or it survives
unspecified, which is the state §25.5 explicitly refuses for Insights.
**Dan's, and it is the largest single unspecified surface in the app.**

**G-31 — hide vs off: `off` does not exist.** §25.1 and §15 register two
controls. The app implements **hide** only (`findingKey`/`findingSignature`/
`findingHidden`, `DoseExpectation.jsx:134-154`, wired at `App.jsx:141-142`),
and §20 correctly identifies it as already implementing the resurfacing half.
**There is no per-notice-type `off` anywhere**, no Setup switch, and therefore
no answer to the ultra-low-nutrient case §25.1 names as the whole point of the
escalation. **What is a "notice type"?** — the finding `id` (`far-out-
phosphate`), the id family (`far-out-*`), the parameter, or the §25.4 kind?
Canon does not say, and the answer decides whether turning off the phosphate
low warning also turns off the nitrate one.

**G-32 — "serious" is canon's one admitted guess.** §20: *"**The decision did
not name this mapping** — it is written here so the rule is implementable …
This is the one thing in §19–§20 the owner has not stated directly."* The
mapping is severity `act`, or a wizard state whose §3 tone is red.
**Carried unchanged as the decision it is.**

**G-33 — three notices are non-hideable today, against §20.** Recorded in §20
and re-verified: `correcting-dose`, `correction-due`, `correction-done`,
`correction-stalled` and `correcting` are built with no `dismissible` flag
(`narrative-engine.js:464-499`), and `act`+`chemistry` findings are
non-dismissible by rule (`:401`). §20 overrules both. **Not a gap — a known
finding, listed here so it is not lost in the rebuild.**

**G-34 — app-level notices have nowhere to go.** §25.6 item 3. The sweep found
which ones they are, so the decision has a concrete list: `no-volume`,
`strength-missing-*`, `strength-unverified`, `sparse`, `kit-replaced-*`, and —
if D-1 goes the other way — `kit-*`. **Six ids, no home.**

---

## 2.8 Insights

**G-35 — Insights is deliberately unspecified and is currently the largest
uncanonical surface after the score.** §25.5 says so and says *"It may not
survive."* Measured for the record: `Insights.jsx` is **1,114 lines**, it calls
`computeControl` with its own 90-day default, it renders the "Suggested dose …
now / after" preview row (`:697-720`) that `wizard-states.md` 9.4 identifies as
the **one live path** of the second dose calculator, and it holds two dead
`doseAdvice` `useMemo` calls. **No decision requested — recorded so Stage 6
knows the size of what §25.5 defers.**

---

## 2.9 Cross-cutting

**G-36 — §23.7 breach count, as Stage 4 was asked to produce it.**

§23.7 says a headline names the parameter only where the sentence would not
stand without it, and lists ten registered fragment forms.

| Surface | Headline forms | Name the parameter |
|---|---|---|
| `doseStatus` (`state.js`) | 24 | **12** |
| `buildFindings` titles | 27 | **21** |
| `readingVerdict` | 21 | **2** (`:61`, `:76`; the rest are already fragments or value-led) |
| `computeControl` | 7 | **0** — compliant as they stand |
| `buildBriefing` own claims | 6 | **5** (`drift:`, `moving-out:`, `parked`, `solid`, plus `buildHeadline`'s out-list) |
| **Total** | **85** | **40** |

Counted as *forms that name the parameter*, not as confirmed breaches: §23.7
judges a headline against §24's registered complete-sentence forms, and only
`doseStatus` has cards to judge against. **The twelve `doseStatus` figures are
confirmed breaches** — each is a state whose §24 card is a registered fragment.
The other 28 name their parameter in copy that has no registered form yet, so
they are breaches only once §25.1 makes them notice headlines.

The twelve `doseStatus` breaches, precisely: `correction-stalled`×2
(`:213, 241`), `correction-due` (`:227`), `correcting-dose` (`:248`),
`correcting`×2 (`:273, 385`), `settling`×2 (`:292, 436`), `due` (`:298`),
`worked` (`:313`), `fell-short` (`:331`), `overshot` (`:335`).

**§23.7 predicted this would be noisy and said to count it, not fix it**
(§23's "Enforced by": *"Count them in Stage 4's gap report; fix them when the
layer is rebuilt."*) **Counted. No action requested.**

**G-37 — §23.2 breach count: zero.** Swept `findings.js`, `narrative-engine.js`,
`reading-meaning.js`, `state.js`, `ReadingConfirmation.jsx`,
`DoseExpectation.jsx` and `TodayPanel.jsx` for first-person pronouns in
user-facing strings. **No matches.** §23's "Enforced by" flagged this as
checkable today; it is checked and clean. The only "I" in the app's vocabulary
is in journey 4b's *draft* matrix (*"One more reading before I can say which
way it's going"*), which is a source document and not shipped.

**G-38 — the decision records carry one item canon does not.**
`message-spec-3-surfaces.md` line ~130 quotes the serious-notice confirmation
as *"a serious **notification**"*. Canon §15 bans the word and §20 restates the
sentence with **notice**. **Canon wins; noted so the decision record is not
read as authority.**

**G-39 — journey 4b's evidence rules are still open, and §24 depends on
them.** `reef-chemistry.md` §25 says plainly: *"the evidence rules journey 4b
asks for — how many readings establish movement, how far apart, and how much
movement contradicts a dose change … 4b's open questions 2–5 are still Dan's."*
4b's own draft figures: **three readings** to establish movement; **two
readings, ≥24 h apart, 0.2–0.3 dKH (2–3× the noise floor), opposite direction**
to claim a contradiction. **§24.7, §24.8, §24.21 and §24.22 cannot be
implemented without them** — they are the four contradiction cards. This is the
single highest-value open item in the report, because four registered cards
depend on it.

**G-40 — §12's "no simultaneous alkalinity and calcium dosing" has no
message.** `reef-chemistry.md` §20's precipitation guard requires ≥4 hours'
separation and §23's worked example 8 makes it a test vector. **No card in §24,
no notice in §25, and nothing in the code.** A refusal the app is required to
make and has no words for.

**G-41 — §20's coupling findings have no cards.** §20 requires three things the
app must *say*: an implied calcium shortfall surfaced **before** the calcium
reading confirms it (worked example 3); "if calcium falls while alkalinity is
stable, calcification is not the cause… it points there"; and "dosing
alkalinity alone over time is a defect state — flag it". The app implements
roughly the first through `ionic` (`findings.js:292-319`) with its own 0.85/
1.15 thresholds. **The second and third have no implementation and no card.**

---

# PART 3 — DELETIONS

**Canon has deliberately decided not to say these things.** They are not gaps.
Each is a live string the rebuild removes, with the section that removes it.

**D-1 — every message about the test kit being wrong.** `kit-<param>`
(`findings.js:191-211`): *"Your alkalinity kit read 25% higher than the lab
across 3 paired comparisons … worth replacing the reagent before acting on
it."* **§14: "No message tells a user their test kit is wrong."**
**§19 (`reef-chemistry.md`): "The app never tells a user their kit is wrong."**
Twice, in two documents, unqualified.

*Worked up per house rule 10, because this one is not obviously right.* The
rule's reasoning in §19 is *"Absolute accuracy is not required. Users target
stability against their own kit"* — which is an argument about **drift**, and
an ICP panel is a genuinely independent measurement the argument does not
cover. A kit reading 222% high does invalidate every downstream figure, which
is the finding's own justification. **Three options: (a) delete, canon as
written; (b) canon gains an exception for a lab-paired comparison, which needs
a figure — the current 5% / 25% are unnamed; (c) the finding survives as a
statement about the *comparison* rather than the kit ("your last three readings
sat 25% above the lab panel"), which reports the observation without the
verdict, in §23.5's spirit.** **Being wrong toward (a) loses a real safety
signal; being wrong toward (b) reopens a rule canon states twice. Dan's.**

**D-2 — `paramContext`'s cause and lever prose.** Eight blocks
(`reading-meaning.js:17-87`). §23.5: *"Never speculate about causes."* §29.6:
*"No suggested levers."* Direct breaches, quoted:

- *"`{salt.name}` is known for mixing high in magnesium, so **water changes are
  the likely source** rather than anything going wrong"* — a named cause.
- *"low magnesium is **usually the reason** calcium won't hold"* — a named cause.
- *"**A little more feeding is normally the fix**"* (phosphate low) — a lever,
  on a nutrient, which §29.6 forbids by name.
- *"**Most reefers dose nitrate back up to** around 5 ppm"* — a lever.
- *"Bring it down through **water changes and export**"* (nitrate high) — levers.
- *"Salinity running high is **usually evaporation outpacing top-off**"* — a
  cause.
- *"Low pH is **most often indoor CO2**"*; *"More surface agitation, fresh air
  to the skimmer, or a refugium on a reverse light cycle"* — a cause and three
  levers.

**D-3 — the safe-floor figure on the emergency card.** `state.js:204`:
*"Outside 7–11 dKH, where calcification stops and coral tissue is at risk."*
§24.9 is explicit: *"**No mention of the safe floor.** It is a number the user
did not set and cannot change, so quoting it invites a question the card cannot
answer."* The same figure is quoted again in `ReadingConfirmation.jsx:52, 154`.
**Three sites.**

**D-4 — "dangerously low/high" as a phrase.** `state.js:202-203`,
`ReadingConfirmation.jsx:51, 153, 352`, `findings.js:273`. **§15's registry
bans "dangerous" for the at-or-beyond-alert concept** — the registered word is
**needs attention** — and the section closes: *"The app never uses 'safe' or
'unsafe' about any reading."* §24.9's registered wording is *"Alkalinity is
very low at 6.8 dKH"*.

**D-5 — the wrong-tool card's product advice.** `state.js:408-409`:
*"A dedicated magnesium supplement or dry salt is the right tool, or a series
of water changes."* **`reef-chemistry.md` §9's wrong-tool rule, amended
16 August**, removes exactly this: *"The half about pointing at another product
is wrong … it just makes an unsafe one easier to perform."* §24.23 replaces it
with a duration and a return-plan offer. **Both branches of the message carry
it, at `:408` and `:409`.**

**D-6 — nutrient equilibrium projections.** `equilibrium-<param>`
(`findings.js:708-723`): *"On your current water change routine alone, nitrate
would settle at about 12 ppm."* §29.6: *"**The app names the level and stops.**"*
It is also a projection about an export regime the app cannot see, which is
§29.6's stated reason for the no-levers rule.

**D-7 — all phosphate direction language.** §29.5: *"**No direction language for
phosphate anywhere**, including the stability layer's … Count language replaces
slope language on every surface, or it has not replaced it."* Live sites:
`computeControl`'s `sliding` verdict headline *"Moving up fast"* and its note
*"a genuine slide"* (`reading-meaning.js:244-246`), applied to phosphate
through `CONSISTENCY_RULES.phosphate`; `buildBriefing`'s `drift:` claim
*"Phosphate is climbing, not settling"* (`narrative-engine.js:584`);
`moving-out:` *"Phosphate is outside your range and still rising"* (`:640`);
and `StabilityStrip`'s `then → now` arrow (`TodayPanel.jsx:347-349`), which is
direction drawn rather than written.

**D-8 — "water changes will bring it round".** `narrative-engine.js:655-656`,
the `parked` claim. A lever, and it contradicts §24.3, which is the card for
this exact situation and whose offer is *"Plan a gradual return to 8.5 dKH"*.

**D-9 — the two regexes over the engine's own English.** `narrative-
engine.js:459` (`/level is not|steady but/i` over `d.headline`) and
`ReadingConfirmation.jsx:370`
(`/could change|needs a test|is due|needs more/i` over
`ds.headline + ds.detail`). **A surface parsing another surface's prose to
decide what to say.** §25's governing sentence: *"where a surface appears to
need a claim the wizard cannot supply, that is a gap in the wizard, not licence
to compute one locally."* Both are that, in its most literal form — the claim
they need is *"does the wizard want a change"*, which is a boolean the verdict
should carry.

**D-10 — `readingVerdict`'s own band vocabulary.** *"Dead centre"*,
*"Heading the right way"*, *"In band"*, *"A little high"*, *"A little low"*,
*"Well above band"*, *"Well below band"* (`ReadingConfirmation.jsx:374-407`).
**§13: "No surface may invent a category like 'slightly low' or 'borderline'
that is not in this table."** *"A little low"* is the example the rule uses.
Seven categories, none of them one of the seven.

**D-11 — `computeControl`'s target-range suggestion.** `suggestWorth` and
`suggested` (`reading-meaning.js:206-208, 290`), rendered as an offer to move
the keeper's band to p05–p95, plus the note *"The usual call is to move your
target range to match the tank rather than push the tank to match the range"*
(`:261`) and `SnoozeSheet`'s *"the target range is the thing to change rather
than the dose"* (`TodayPanel.jsx:481-492`).

*Not a clean deletion — worked up.* **`reef-chemistry.md` §18 explicitly
requires it**: *"If a value sits outside the user's target range but the series
is stable, the app suggests reconsidering the range before suggesting a
correction."* **But §24.3 is the card for that exact state and its offer is a
return plan**, and `reef-chemistry.md` §28.3's whole argument is that a level
stable and out of band gets walked home rather than accommodated. **Two canon
sections, one situation, opposite offers.** §18 was carried into this file on
14 August; §28 was rewritten on 16 August.
**Not resolved here — flagged as a canon-versus-canon contradiction and the
one place in this report where the deletion depends on which section wins.**

**D-12 — the `drift:` and `moving-out:` claims wholesale.**
`narrative-engine.js:561-647`. They are a surface computing direction from
`computeStability`'s pattern over a 14/28-day window while the wizard computes
direction from the fit over §4's window. **§25.2: "Direction belongs to the
wizard."** This is the 16 August contradiction in the tank summary rather than
the history modal, and it has never been named as such.

**D-13 — `buildBriefing`'s hand-written support sentences.** Two survive
`wordingcheck`: `correction-done`'s *"Set the dose back to 9.0 mL/day to hold
it there."* (`:481`, named in §25.1 as a live violation) and every `drift:`,
`moving-out:`, `parked` and `solid` support line. **§25.1: "The summary shows
the headline plus the first sentence of the wizard's card. It is not a separate
wording."**
`scripts/verify/wordingcheck.mjs` asserts `claim: === d.headline` and never
looks at `support:` — verified by reading the script; it also prints its
`checked` count and never asserts it, so a run with zero matches exits 0.

**D-14 — the three surviving "correction needed" instructions.** `state.js:412-
413`: *"Alkalinity dose is right, the level is not … That needs a one-off
correction of about 45 mL spread over 3 days, not a bigger daily dose."*
`state.js:485`: *"Raising it is a separate correction rather than a bigger
daily dose."* `ReadingConfirmation.jsx:295`: *"Bringing it up is a separate
correction, and the Dosing Wizard has it."* **§28.1: automatic dose advice only
ever stabilises; moving a level is a plan the user opts into. §28.2: a dose
suggestion and a return-plan offer may never appear together.** §24.3 replaces
all three with *"Plan a gradual return to 8.5 dKH →"*. The upward direction is
a correction *underneath* the offer (§28.5), but it is not what the card says.

**D-15 — `state.js:484`'s downward advice.** *"Easing the dose back slightly and
letting consumption carry it toward the range is the way, and there is no hurry
about it."* This is **drift back folded into advice**, which §28.1 forbids in
the sentence it exists to prevent: *"a dose figure that quietly contains a
deliberate move is a figure the user cannot check."* §28.3's table is explicit
that the app's unprompted advice parks the level and the walk home is a
separate opt-in.

---

# PART 4 — WHAT CANON DOES ANSWER

Recorded so the rebuild knows what it does **not** have to ask about. Every row
is a message the current layer produces that comes straight out of canon.

| The message | Canon |
|---|---|
| The seven bands and their boundary rules (inclusive edges, stored precision, never round) | `wizard-states.md` §13; `reef-chemistry.md` §23 examples 9, 10 |
| Position is the last reading, on every surface | `reef-chemistry.md` §26 |
| Out has no margin; clearly out is 0.5 dKH / 50 ppm / 50 ppm and governs wording only | §27, §16 |
| Phosphate 0.10 / nitrate 10 clearly-out margins | §29.3 |
| Alert thresholds for the three dosed elements, hung from the midpoint | §18 |
| The magnesium alert-low floor at the safe bound | §10 |
| Kit noise floors for the three dosed elements | §5 |
| Analysis windows: alk 14, Ca/Mg 28, phosphate 14, nitrate 28 | §4, §29.7 |
| Test cadences: alk 2, Ca 7, Mg 21, phosphate 7, nitrate 7 | §4, §29.2 |
| Rate rails 0.5 dKH / 20 ppm / 25 ppm / 0.5 ppt / 0.5 °C per day | §3 |
| Safe bounds for alk, Ca, Mg, phosphate, nitrate | §2 layer 1, §29.2 |
| Suggested bands for all five | §2 layer 3, §29.2 |
| The settle-window formula and its 2–5 / 7–30 clamps | §7 |
| Dose-gap triggers 12% / 30% / never | §7, §10 |
| Staging fractions, the five constraints and their order, the 25% step cap | §8.1–§8.5 |
| Bracket memory 45 days and the 25% consumption filter | §8.3 |
| Correction paces 25/50/100% of rail | §9 |
| The aim point (midpoint) and the arrival zone `max(band/3, 2×noise)` | §9 |
| Two readings to close a correction; `arrived` and `passed` never conflated | §9, §4 (`wizard-states.md`) |
| `overrun` at `(expected × 2) + 2` days, on the calendar | §4 (`wizard-states.md`), §9 |
| The ~1.5 L volume ceiling exists (its survival is open) | §9, §25.6 item 1 |
| Ca:alk 7.15, dKH↔meq/L 2.8, gallon conversions | §16 |
| Net volume required; the 0.85 estimate helper and its labelling | §17 |
| No shipped solution strengths; the refusal names the missing input | §16 |
| Negative consumption: hold, report, ask, escalate at three | §24 |
| The magnesium gate, its four boundaries, and what it never touches | §10 |
| Phosphate's count (three of the last four, same side) | §29.5 |
| Nitrate's trend bar (three readings, one direction) | §29.5 |
| Phosphate < 0.03 and nitrate > 50, both fixed, neither escalating | §29.4 |
| No dose, no correction, no levers for either nutrient | §29.6 |
| The six consistency verdicts, the alert tier, and unknown-refuses | §22 |
| Every notice hideable; serious ones confirm; hiding resurfaces on supersession | §20, §25.1 |
| One live notice per parameter, superseded not stacked | §20, §25.1 |
| The summary short form = headline + first sentence, generated | §25.1 |
| The confirmation = receipt + the wizard's card verbatim | §25.3 |
| The panel leads with its window and never uses direction words | §25.2 |
| The seven wording rules | §23 |
| Twenty-three reference cards | §24 |
| One word per concept, and the colour registry | §15 |

---

# In plain terms

*Per house rule 11 — the same report, without a single code word.*

## What this was

The messaging layer of the app — everything that decides what sentence you
read about a reading — is being thrown away and written again, from your own
written-down rules and nothing else. Before a line of it is written, someone
had to go through every sentence the app says today and ask: **could I have
written this from your rules alone?**

Three answers. Yes, your rules cover it. No, and they should — that's a
question for you. No, and they shouldn't — you already decided the app
shouldn't say that, and the rebuild just drops it.

The app currently produces about **104 different kinds of sentence**. Your
written rules cover **23 cards**. That gap is the report.

## The numbers you need to pick (this is the important half)

**How much movement is just the test kit?** There are three answers live in the
app at once. One is per-brand and per-parameter (a Hanna alkalinity checker is
credited with 0.1 dKH, a Red Sea one 0.2). One is a flat half-that-figure used
for a different judgement. One matches your written rule. All three get
consulted in the same pass, so the same 0.15 dKH move is real, borderline and
invisible depending on which question is being asked. **Your rules name one set
of figures, for three parameters. You need one set, for all of them.**

There is one place this stops the rebuild dead. **Your new nitrate rule says a
rise counts as real once three readings in a row go the same way and the
movement clears the kit's noise floor. There is no noise floor for nitrate
anywhere in your rules.** The app has one — 1.0 ppm, treated as a percentage —
but you have never seen it or agreed to it.

**How fast is "moving" for alkalinity?** Four answers, and they are not even
the same kind of measurement. One is per day, one is per week, one is a
per-week grade with two levels, and one is the spread between your highest and
lowest reading over a fortnight. That is why a half-point-a-week fall reads as
"hold" on the dosing screen and as amber on the history screen — **both are
right against their own number.** Picking one number is not enough on its own:
first you have to decide *which of those four things* the app should measure.

**The little paragraphs of context on the history screen.** When a reading sits
outside your range, the app writes you a paragraph. Those paragraphs quote
about fifteen figures — calcium being fine up to 550, magnesium in the 1500s
being harmless, phosphate over 0.15 starting to matter, potassium comfortable
between 380 and 420. **None of those numbers is in your rules, and one of them
contradicts them:** you wrote that above 500 calcium starts pulling alkalinity
down, and the app tells you 550 is fine.

**The alert levels** — the point at which the app says a level needs attention
rather than just being out of range — turned out to be the one family that
already matches what you wrote. Only magnesium is wrong, you already know about
it, and the fix is already in. **What you have not decided is alert levels for
everything else.** Phosphate, nitrate, salinity, potassium, pH and ammonia can
never reach "needs attention" at all today, however far out they go, because
you have only set those levels for the three you dose.

**And the health score.** The number in the circle on the front screen is built
from **nineteen figures you have never seen**, and it has no rules behind it of
any kind — not what it means, not what it counts, not what makes it go up. It
has already been caught showing 42 while its own working added up to 71. It is
the biggest single thing in the app with nothing written down behind it, and
you have three choices: write the rules for it, delete it, or ship it knowing
it is unsupported.

## Sentences the app says that you have no rules for

**Four situations have no card written.** The one that matters most: when your
level is climbing faster than your dose can explain, you wrote a full rule
about it — hold the dose, say what you saw, ask whether a water change is
missing from the log, and say something stronger if it happens three times
running. **You never wrote the words.** The app has words; they are not yours.

The other three: when a dose change has been running long enough and you
haven't tested yet; when a change stopped the fall but left you outside your
range; and when you've tested twice and it's still too close to call.

**Ammonia has no rules at all.** It's the one parameter where a single reading
means act now, it caps the score, it has its own messages — and it isn't in any
of your chemistry documents. So does salinity, which your own coverage table
marks as "nowhere". So does pH, and potassium.

**What the little coloured chip on a parameter tile says is not decided.** That
tile currently shows four separate opinions about one reading, worked out four
different ways. It is the exact card you were shown as an example of the
problem — the same 6.9 dKH reading getting a mild amber and an urgent red in
one square inch. You settled what the steadiness panel says. The chip above it
is still open.

**The steadiness panel has a problem your new rule creates.** You wrote that the
panel must say at the top which stretch of time it graded, and that the stretch
is the fixed one for that parameter — a fortnight for alkalinity. **The app lets
you choose: 7 days, 30, 90, or everything.** Under your rule as written, the
buttons can't stay. You may well want them to. That's yours to say.

**The "heading out of range" warning is the contradiction, in writing.** It says
alkalinity will reach the bottom of your range in twelve days, then adds that
the dosing screen looks at a shorter stretch and disagrees, and suggests you
test again to see which one wins. **That is a screen reconciling two time
windows in a sentence** — which is precisely the thing you fixed by deciding
what each screen is *for*. Whether that warning exists at all is not decided.

**The confirmation window after you log a test** is meant to become two lines of
receipt and then the same card the dosing screen would show. You wrote one
example of those two lines. **What they say when the reading is out of range,
when there's no previous reading, or when the last one was four months ago is
not written** — and neither is whether the fireworks that go off when a
correction finishes survive.

**The four "despite your dose change" cards can't be built yet.** You have the
words for all four. What you don't have is the evidence rule underneath them:
how many readings after a change, how far apart, and how much movement counts
as the change being contradicted. Your own draft says two readings, at least a
day apart, 0.2 to 0.3 dKH, going the wrong way — **but that draft is marked as
a question, not an answer.** Four of your twenty-three cards are waiting on it.
**If you answer one thing from this report, answer that.**

## Sentences the rebuild drops

These are not questions. You already decided these, and the app hasn't caught
up.

The app **tells you your test kit is wrong** — twice you wrote that it must
never do that. (This one is worth a second look: an independent lab panel isn't
quite the same as second-guessing your kit, and a kit reading double is worth
knowing. Three ways to go, laid out in the report.)

The app **quotes the safe floor** — "outside 7 to 11 dKH" — in three places. You
decided it shouldn't: it's a number you didn't set and can't change, so quoting
it raises a question the card can't answer.

The app says **"dangerously low"**. Your word is "needs attention", and you
wrote that the app never says "safe" or "unsafe" about a reading at all.

The app **points you at dry salt and water changes** when a correction is too
big for your maintenance bottle. You reversed that four days ago: the limit is
the rate, not the bottle, and naming a faster product just makes an unsafe
change easier to do.

The app **guesses at causes** — your salt mixes high, your magnesium is why
calcium won't hold, your pH is the room's CO2 — and **names levers** — feed
more, dose nitrate, run a refugium. Both are ruled out: the app can't see your
tank, and telling you to do something you're already doing is worse than
silence.

The app **says phosphate is climbing**. You decided it never may — phosphate
bounces, and a line drawn through bouncing numbers invents a movement nobody
measured.

The app **makes up its own words for where a reading sits** — "a little low",
"well above band", "dead centre". You registered seven words and wrote that no
screen may invent an eighth. "A little low" is the example in your own rule.

And the app has **two places where one screen reads another screen's sentence
and searches it for phrases** to work out what the other screen means. That is
the whole problem in miniature.

## One place your own rules disagree with each other

You wrote, in the older document, that when a level sits outside your range but
is holding steady, the app should suggest **reconsidering your range** before
suggesting a correction. Two days later you wrote that a level stable and
outside its range is exactly when the app offers to **walk it home**. The app
currently does the first. Your newest card does the second. **They can't both
be the answer, and this report doesn't pick.**

## What this stage bought

Every question above is a question you can answer at a table with a cup of tea.
If it had been found three weeks from now it would have been answered by
whoever was typing at the time, quietly, inside a function — and you would have
found out about it the way you found out about "alkalinity is rising" sitting
above a panel saying it had fallen half a point a week.

**Nothing here has been decided. That was the job.**

---

## Provenance

Every claim in this report was verified by reading the file and the line cited.
Line numbers are against the working tree at commit time on branch
`claude/messaging-canon-gaps-kxl477`. No file outside `.agent/` was modified.

**Not verified by execution:** no tests were run and no build was performed —
this stage is read-only by instruction, and nothing here asserts runtime
behaviour that was not read directly from source. The two behavioural counts
(§23.7 breaches, §23.2 breaches) were taken by reading every headline site
listed, not by running a checker; a checker for either is TW-028's work.
