# Real-history replay — Dan's 77 L tank, 13 Feb → 12 Aug 2026

Routine: `routines/18-real-history-replay.md`. Run id `2026-08-14-real-history-replay`.
**Report only.** No source, spec, test, constant, fixture or script changed.

Everything below comes from a run of the app's own derivation, `deriveTankState`
(`src/App.jsx:68`), over Dan's real export, one step per reading. Where a number
is not from that run or from a command, it is marked `UNVERIFIED` and says why.

---

## 1. What was replayed

| | |
|---|---|
| Fixture (canonical) | `fixtures/real-tank/dans-tank-backup-2026-08-12.json` |
| Cross-check fixture | `fixtures/real-tank/dans-tank-backup-2026-08-09.json` |
| Engine commit | `385428a219f2e1e586e488c81dd5fa9efe2caf0f` (current `main`; contains `054b692`, the commit the routine was written against) |
| Steps | **336**, one per reading, chronological |
| Span | 2026-02-13 → 2026-08-12 (**six months**, not the three the task description says) |
| Runs | **A** = 12-Aug settings and ranges throughout · **B** = 09-Aug settings and ranges up to and including 2026-08-09 |
| Engine errors | **0** in 336 × 2 steps |
| Harness | Node 22.22.2, session scratchpad only; core loop in §10 |

Per-parameter counts, from the routine's own verification command:

```
$ python3 -c "import json,collections; d=json.load(open('fixtures/real-tank/dans-tank-backup-2026-08-12.json'))['data']; \
    print(len(d['readings']), collections.Counter(x['param'] for x in d['readings']))"
336 Counter({'phosphate': 101, 'alkalinity': 82, 'magnesium': 41, 'nitrate': 41,
             'calcium': 40, 'ph': 16, 'potassium': 13, 'salinity': 2})
```

Ordering: `date`, then `time` where present, then a stable natural key
(`param`, `value`). At step *i* the engine sees readings 0..*i* — no parameter has
two readings on one date (verified: zero duplicate `(param, date)` pairs), so the
prefix is an exact "everything dated at or before this moment".

**Three fixture facts stated and worked around, as the routine requires.**

1. **Reading ids do not survive an export/restore round trip.** Verified: of 325
   ids in the 09 export and 336 in the 12 export, **0 overlap**; by natural key
   `(param, date, value)` all 325 of the 09 readings are present in the 12 export
   and 11 are new. Everything in this replay is keyed by natural key. This is
   `history-truth-auditor` territory — see §8.
2. **The water-change list is the app's own seed.** Verified byte-for-byte against
   `WATER_CHANGE_SEED` (`src/lib/analytics/water-changes.js:9`): the same 25 dates,
   16 Feb → 3 Aug, all 10 L, ids all of the form `wc-<date>`. The seed was built from
   Dan's practice, so using it is fine, but the replay cannot tell "Dan entered this"
   from "the app seeded this". Said once; moving on.
3. **Six months, not three.** Readings start 2026-02-13. Alkalinity's near-daily
   record starts **2026-05-04** (82 readings). No claim below spans more than the
   data.

**Three small corrections to the routine's fixture table**, found by re-checking:

- The routine says 11 readings carry a `time` field "all from 2026-08-09 onward".
  They are all from **2026-08-10 onward** (dates 08-10, 08-11, 08-12). The
  2026-08-09 alkalinity 9.3 has no time.
- The routine says `findings-dismissed` holds ten entries dated 2026-08-10. It holds
  **22 entries in two different formats**: 10 flat `signature: date` entries dated
  2026-08-10, one dated 2026-08-11, and 11 object-form entries
  `finding|<id>: {at, sig, times}` dated 2026-08-12. This turns out to matter a great
  deal — see §6.
- The routine reads `ca-plan.target: 22.2` as "+22.2 ppm". It is not. `App.jsx:815`
  writes `target: meta.target != null ? meta.target : ml`, and the wizard passes
  `target: a.staged ? round(a.maintenanceDose,1) : ml`
  (`src/components/ErrorBoundary.jsx:257`). **22.2 is a target dose in mL/day.**
  That changes §5 completely.

---

## 2. The dose-change record — what the exports do and do not contain

The routine's finding is confirmed at `385428a`:

```
09 export: counts={'readings': 325, 'icps': 2, 'waterChanges': 25,
                   'doseChanges': 0, 'taskLog': 0, 'lighting': 1}
           dose-log = None        task-log = None
           tank-settings = {volumeL 77, dailyDoseMl 8,  calciumDoseMl 9,  magDoseMl 8, ...}
           custom-ranges = {magnesium: 1450–1500}
           keys present: custom-ranges, dose-log, icp-tests, lighting-log, readings,
                         tank-settings, task-log, tasks-custom, water-changes

12 export: counts={... 'doseChanges': 2, 'taskLog': 13 ...}
           dose-log = [ {2026-08-10 09:00, 12 mL, calcium,    "set from the dosing wizard"},
                        {2026-08-11 09:00, 10 mL, alkalinity, "set from the dosing wizard"} ]
           tank-settings = {volumeL 77, dailyDoseMl 10, calciumDoseMl 12, magDoseMl 8, ...}
           custom-ranges = {magnesium 1520–1560, calcium 400–450, nitrate 6–15, phosphate 0.11–0.19}
           alk-plan = {appliedDose 10, appliedAt "2026-08-11 09:00", target 10,
                       stage 1, stages 1, nextTestAt 2026-08-13, nextTestTime 09:00}
           ca-plan  = {appliedDose 12, appliedAt "2026-08-10 09:00", target 22.2,
                       stage 1, stages 3, nextTestAt 2026-08-17, nextTestTime 09:00}
           mg-plan = None   corrections = None   kit-changes = None
```

**Every dose change before 9 August is unrecorded.** The settings are an end-state,
not a history. Consequences, exactly as the routine anticipated:

1. Advice-versus-action is possible for **two events only** — §5.
2. The engine runs on an empty dose log for 334 of 336 steps. That is not patched.
   No dose-log entry is synthesised.
3. The current-dose figure is an anachronism for the early months, which is what
   run B bounds — §3.

One more thing the exports contain that the routine did not flag: the `task-log`
records a **water change completed on 2026-08-10** (`{taskId: 'waterchange', date:
'2026-08-10'}`), while the `water-changes` list ends at **2026-08-03**. A tenth of
the tank's volume changed and not in the water-change record. Flagged in §8.

---

## 3. The timeline

Run A is primary. 336 steps; **40 steps were byte-identical to the step before**
(no verdict change, no action change, no dose-state change, no notice delta), so the
table below is the change points, compressed. Notices appeared or cleared on
**206 of 336 steps**.

### 3.1 The shape of the six months

| Parameter | Readings | In band (run A) | Out of band | Effective band (run A) |
|---|---|---|---|---|
| alkalinity | 82 | 12 | **70 high** | 8.2–8.8 dKH (`PARAM_DEFS`, `src/lib/constants.js:26`) |
| phosphate | 101 | 36 | 64 low, 1 high | 0.11–0.19 (custom) |
| magnesium | 41 | 7 | **34 low** | 1520–1560 (custom) |
| calcium | 40 | 25 | 15 high | 400–450 (custom) |
| nitrate | 41 | 41 | 0 | 6–15 (custom) |
| pH | 16 | 16 | 0 | 7.8–8.4 |
| potassium | 13 | 12 | 1 low | 380–420 |
| salinity | 2 | 2 | 0 | 34–36 |

Dose verdicts over all 336 steps (run A): alkalinity `hold` 263 / `decrease` 68 /
`increase` 5; calcium `hold` 165 / `increase` 97 / `decrease` 74; magnesium
`hold` 243 / `increase` 69 / `implausible` 24. Overall tank score ranged **34 → 100**.

### 3.2 The change-point timeline (run A)

`→ next` is the referee's column: the next two to four readings of that parameter,
on the **unchanged** dose (the dose log is empty until 10 August).

| Date | Reading | Verdict | Dose state / advice (ml) | Notices Δ | → next readings |
|---|---|---|---|---|---|
| 02-13 | NO₃ 9.2 | ok | all three "needs another reading" | +`strength-unverified` | — |
| 03-04 | NO₃ 13.1 | ok | unchanged | +`heading-out-nitrate`, +`equilibrium-nitrate\|20.7ppm` | 10.1, 12.8, 12.2 — settled on its own |
| 03-05 → 03-11 | NO₃ ×4 | ok | unchanged | equilibrium text rewritten each reading: 13.0 → 20.0 → 16.9 → 18.0 ppm | — |
| 03-09 | Mg 1230 | low | mg "needs another reading" | +`far-out-magnesium` | 1230, 1290, 1290 |
| 03-10 | Mg 1230 | low | mg `suggested`, 8 ml, "a dedicated supplement or dry salt is the right tool" | | — |
| 03-22 | Ca 450 | ok | ca "needs another reading" | | — |
| 03-23 | Ca 450 | ok | ca `idle` "dose is matching consumption", 12 | | — |
| **03-24** | **Ca 440 (−10)** | ok | ca **`increase` → 15 ml**, immediately | | 425, 425, 435, 440 |
| 03-26 | PO₄ 0.03 | low | — | +`far-out-phosphate`, +`ratio-po4-limited` | — |
| 03-27 | PO₄ 0.08 | low | — | +`equilibrium-phosphate\|0.05ppm` (first of **22** such texts) | — |
| 04-04 | Ca 450 | ok | ca back to `idle`, 12 | | 420, 415, 435 |
| 04-11 | Mg 1455 | low | mg `implausible` from 04-22, "the working points to 238 mL/day" | +`destabilised-magnesium` | — |
| **04-19** | **Ca 485 (+50 in 1 day)** | high | ca **`decrease` → 9 ml** on that single reading | | 470, 445, **405**, 455 |
| **04-27** | **Ca 405 (−40 in 2 days)** | ok | ca **`increase` → 15 ml**, immediately — the same gate and the same figure as the −10 move on 03-24 | | 455, 440, 455 |
| 04-28 | Ca 455 (+50) | high | ca `increase` → 14.9 | | — |
| **05-04** | **Alk 9.3** — first alkalinity reading | high | alk "needs another reading" | | daily from here |
| 05-05 | Alk 9.3 | high | alk `off-target`, rec 10 | | — |
| **05-07 → 05-12** | Alk 9.4 → 10.4 | high | five consecutive **`decrease`**: 9.4 → 9.0 → 8.1 → 7.5 → 7.5 ml | +`far-out-alkalinity` (05-08), +`ionic` (05-10) | alk **rose** 9.4 → 10.4 through all five, on the unchanged 10 ml |
| 05-13 → 05-21 | Alk 10.2 → 9.5 | high | `hold`, "two or three more readings … will show whether there is a real trend" | | fell on its own |
| **05-22 → 05-24** | Alk 9.8 → 10.0 | high | three more **`decrease`**: 9.0 → 8.8 → 8.3 ml | | 9.1, 9.1, 8.9, 8.9 — fell on its own |
| **05-28** | **Alk 8.9** | high | **`increase` → 12.5 ml** (+25%) while the level is *above* the band | | 8.9, 9.0, 8.8, 9.0 — flat |
| 05-29 | Ca 465 | high | | +`heading-out-calcium` | — |
| 06-06/06-07 | Alk 9.4, 9.5 | high | `decrease` → 7.9, then 8.2 ml | | 9.3, 9.3, 9.2, 9.0 |
| 06-14 | ICP #1 (Triton) | — | | +`kit-calcium\|14%`, +`kit-phosphate\|9%`, +`icp-offrange\|7 elements` | — |
| **06-17 → 06-27** | Alk 9.1 → 9.5 | high | **nine** `decrease` recommendations in eleven days: 9.4, 9.1, 8.8, 8.8, 9.1, 9.3, 9.4, 9.3, 9.6 ml | +`settled-alkalinity` 06-19 | 9.4, 9.3, 9.3, 9.3 — flat |
| 06-20 → 07-14 | Alk ×25, 9.0–9.8 | high | **19 of 25** steps show an attention-grade dose card | | held steady above band the whole time |
| 07-06 | Mg 1520 | ok (A) | | +`heading-out-magnesium` | 1520, 1560, 1560 |
| **07-16/07-17** | **Alk 8.6 — in band** | ok | **`increase` → 11.9, then 12.0 ml** | | 8.6, 8.8, 8.9, 8.7 — **rose** without the increase |
| **07-19** | **Alk 8.9** | high | **`decrease` → 8.4 ml** — a full reversal 3 days after "increase to 12.0" | | 8.7, 8.9, 8.9, 8.9 |
| 07-26 | ICP #2 (Triton) | — | | `kit-phosphate` jumps to **222%**, `icp-offrange` → 5 elements, +`kit-magnesium\|7%` | — |
| **07-28** | **Alk 8.6 — in band** | ok | **`increase` → 11.5 ml** on used rows `[8.9, 8.6, 8.6]`, explanation says "consistently in every interval" (one interval is zero) | | 8.7, 8.7, 8.7, 9.0 — **rose** without the increase |
| **08-04** | **Alk 9.0** | high | **`decrease` → 8.5 ml** on used rows `[8.7, 8.7, 9.0]`, same "consistently in every interval" wording, same defect, opposite sign | | 9.0, 9.0, 9.2, 9.3 — **kept rising** |
| 08-04 | Ca 430 | ok | ca `increase` → 14.1, "first step toward 16.9" | +`settled-phosphate` | 400 |
| 08-05 → 08-09 | Alk 9.0 → 9.3 | high | four more `decrease`: 8.7, 8.9, 9.3, 8.8 ml — the recommendation wanders 0.8 ml while the level moves 0.3 dKH | | — |
| **08-10 09:00** | — | — | **Dan sets calcium to 12 ml through the wizard** (§5) | | — |
| 08-10 18:00 | six readings + K, pH | | alk `off-target`; ca `settling`; mg `suggested` → 10 ml "first step toward 101" | Dan dismisses ten notices — **and the replay shows all ten still on screen** (§6) | — |
| **08-11 09:00** | — | — | **Dan sets alkalinity to 10 ml through the wizard.** The engine at that moment says **`hold` at 8 ml**: *"changing the dose now would work against it"* (§5) | | — |
| 08-12 09:24 | Alk 8.8 | ok | alk `settling`, "the dose changed to 10.0 mL/day about 24 hours ago and alkalinity has moved 0.1dKH since — inside normal variation" | ten dismissals re-recorded in the new format and now actually hide | export ends |

Alkalinity recommendation range over the six months: **7.5 → 12.5 mL/day** — a 67%
spread — on a level that stayed between 8.6 and 10.4 dKH. **29 of 82** alkalinity
readings produced a non-`hold` action.

### 3.3 A/B divergence

Run B applies the 09-Aug snapshot (alk 8 ml, Ca 9 ml, magnesium 1450–1500, no other
custom range) to every step dated ≤ 2026-08-09.

| | |
|---|---|
| Steps where A and B differ in any recorded output | **297 of 336** |
| All of them dated ≤ 2026-08-09 | yes — 297 pre, **0** post |
| Verdict flips | 103 — phosphate 94, magnesium 9, **nothing else** |
| Dose-recommendation figures differ | alkalinity 199 steps, calcium 286 steps |
| Dose **direction** (action) differs | alkalinity **5** steps, magnesium **5** steps, calcium **0** |
| Dose-state string differs | magnesium 58 steps, alkalinity 5 steps |
| Notice-count differs | 79 steps |

**Settings-robust (A and B agree, state with confidence):**

- The direction of every calcium recommendation across six months. The ml figures
  differ by a near-constant ~3 ml (the 9→12 setting shift carried through
  `maintenance = currentDose + fall/effectPerMl`), but never the sign.
- Every alkalinity verdict, every nitrate/pH/potassium/salinity verdict.
- The whole chase pattern in §3.2 and §4 — it is present in both runs.
- The two real dose changes (§5) — the divergence table is empty after 09 Aug.

**Divergent, both shown, neither chosen:**

| Date | Output | Run A (12-Aug settings) | Run B (09-Aug settings) |
|---|---|---|---|
| 2026-03-13 → 08-04 | phosphate verdict | 59 × `low`, 35 × `high` | `ok` / `ok` respectively — the custom 0.11–0.19 range inverts the phosphate story wholesale |
| 2026-07-27 | alkalinity action | `hold`, "moving 0.075 dKH a day, which is within normal test variation. Your current dose is matching consumption." | `increase` → 9.1 ml, "falling 0.075 dKH a day across 4.00 days, consistently in every interval" |
| 2026-07-06 → 08-04 | magnesium verdict | 3 × `low`→`ok`, 6 × `ok`→`high` | 1520 and 1560 are **above** the 1450–1500 band |
| 2026-08-04 | magnesium action | `hold` at 8 ml, `idle` | **`decrease` → 6 ml**, `suggested`, "Moving to 6.00 mL/day is the first step toward **0**" |

The same trend text, verbatim, is a `hold` in one run and an `increase` in the other
on 2026-07-27: the *only* thing that changed is which dose the tank was on. That is
the settings anachronism made concrete, and it is why every early-month figure in
§3.2 should be read as "the shape is real, the ml number is not".

**The magnesium range moved 1450–1500 → 1520–1560 between the two exports.**
journey-3 §5 is titled "Dan's tolerance is not the app's recommendation". Here is
the tolerance itself moving, by 70 ppm, in three days — and it moves the app from
"magnesium is above your range, cut the dose toward zero" to "magnesium is fine".
Nothing in the exports records why. Question for Dan in §9.

---

## 4. The referee's notes

Where the advice looks odd against what the readings then did. The dose log is empty
throughout this section, so "next readings" are always on the **unchanged** dose.

### R1 — The alkalinity chase (May–August). Chemistry-significant.

29 non-`hold` alkalinity recommendations across 82 readings, spanning 7.5–12.5 mL/day.
Four dated reversals inside a week:

| Advised | On | Then, unchanged | What that means |
|---|---|---|---|
| 07-16 `increase` → 11.9 ml | alk 8.6, **in band** | 8.6, 8.8, 8.9, 8.7 | it rose without the increase |
| 07-19 `decrease` → 8.4 ml | alk 8.9 | 8.7, 8.9, 8.9, 8.9 | 72 hours after "add 19% more" |
| 07-28 `increase` → 11.5 ml | alk 8.6, **in band** | 8.7, 8.7, 8.7, 9.0 | it rose without the increase |
| 08-04 `decrease` → 8.5 ml | alk 9.0 | 9.0, 9.0, 9.2, 9.3 | it kept rising after "dose less" |

**Reading of the conflict** (AGENTS.md #10, not resolved):

- *Engine wrong.* The fitted window is fixed at 4 days (`alkalinity.js:531`,
  `const horizon = nowStamp - 4`) and widens **only when fewer than three readings
  fall inside it** (`:540-543`). Dan tests daily, so his window is always exactly
  4 days and always 3–5 readings. A 0.3 dKH excursion on a kit that resolves 0.1 dKH
  fills that window completely and the engine fits a slope through it. This is the
  reading the data most supports: in all four cases the level did the opposite of
  what the advice implied, within four days, with nothing done.
- *Unrecorded intervention.* Possible — Dan may have changed the dose and not logged
  it (§2). But an unrecorded change would have to alternate up and down on a 3-day
  cycle to produce this pattern. Weak.
- *Kit noise.* Strong. The Hanna alkalinity checker's noise floor in
  `STABILITY_RULES` is 0.1 dKH; the moves being fitted are 0.2–0.3 dKH over 3 days.
- *Settings anachronism.* Ruled out: A and B agree on direction on 77 of 82 alkalinity
  steps, and all four reversals above are post-July, where A and B are identical.

**Which direction being wrong hurts.** If the engine is right and Dan ignored it, he
left alkalinity above band for three months — slow, low-harm. If the engine is wrong
and he had followed it, he would have cut to 7.5 mL/day on 12 May and raised to
12.5 mL/day on 28 May: a 67% swing inside a fortnight on the parameter that kills
livestock fastest. **The asymmetry says the engine's error is the expensive one.**

**What would decide it.** One line from Dan: *"Between May and August, did you ever
change the alkalinity dose from 8 mL/day, and if so when?"*

### R2 — "Increase the dose" while the level is above the band. Chemistry-significant.

2026-05-28, alkalinity 8.9 dKH (band 8.2–8.8, so **above**), current dose 10 mL/day.
Engine: `action: "increase"`, `recommendedDose: 12.5`. Quoted verbatim:

> "Alkalinity is falling 0.231 dKH a day across 4.00 days, consistently in every
> interval. At 10.0 mL/day you are adding 0.692 dKH a day, so the tank is using
> about 0.924 dKH a day. Replacing that exactly would take 13.3 mL/day. Your readings
> scatter enough that this figure is only good to about ±2.60 mL, so treat it as a
> direction rather than a precise number."

Used rows: `[10.0, 9.1, 9.1, 8.9]`. Two of the three intervals are −0.9 and −0.2; the
middle one is **zero**, so "consistently in every interval" is not true of this data.
Next four readings, unchanged: **8.9, 9.0, 8.8, 9.0** — the fall had already stopped
before the advice was given.

The engine is doing something defensible in isolation (matching consumption on a
falling trend) and something indefensible in context (raising the daily dose of an
element that is already over target, on a trend that is one flat interval away from
not existing). Had it been followed, alkalinity would have gone from 8.9 to roughly
10.6 dKH inside a week. **Flagged for `domain-verifier` per AGENTS.md #12.**

### R3 — The dose panel says "above your range" about a level inside the range. Chemistry-significant.

Scanned all 336 steps for `paramStatus(def, latestReading) === "ok"` while the dose
card's text claims the level is above or below range. **50 step-elements across 26
distinct dates**: calcium 19 steps / 12 dates (05-26 → 07-27), magnesium 24 steps /
11 dates (07-06 → 08-04), alkalinity 7 steps / 3 dates (06-02, 07-20, 08-11).

| Date | Element | Measured | Effective band | Fitted value | Card |
|---|---|---|---|---|---|
| 2026-07-27 | calcium | **440** | 400–450 | 450.375 | "Calcium is steady but **above** your range … easing the dose back slightly and letting consumption carry it toward the range is the way" |
| 2026-07-20 | alkalinity | **8.7** | 8.2–8.8 | 8.8199999 | "Alkalinity is **above** your range and rising" |
| 2026-07-20 | magnesium | **1560** | 1520–1560 | 1561.947 | "Magnesium is **above** your range and rising" |
| 2026-06-02 | alkalinity | **8.8** | 8.2–8.8 | 8.8714 | "Alkalinity is steady but **above** your range … holding at 8.8dKH" |
| 2026-07-06 | magnesium | **1520** | 1520–1560 | 1510.671 | "Magnesium is **below** your range and rising … at that pace it reaches 1520ppm in about 1 day" |

The mechanism is deliberate and documented at `src/lib/dosing/state.js:445-449`:

> "The fitted level decides whether the tank counts as out of range, because it
> resists one noisy reading. What gets shown is always the measured value: quoting a
> fitted 1540 to someone whose kit read 1520 is telling them a number that does not
> exist."

**This is a genuine contradiction, not a bug to fix here** (AGENTS.md #10). The two
readings of it:

- *The design is right and the wording is wrong.* Deciding on the fit is the correct
  statistical move; the sentence just must not then quote the measured number as if
  it were the one that failed. Being wrong here costs nothing chemically and costs
  trust. Fixing it means changing text only.
- *The design is wrong at this magnitude.* On 2026-07-20 the fitted alkalinity
  exceeds the band by **0.02 dKH** — one fifth of the kit's noise floor. On
  2026-07-27 the fitted calcium exceeds by **0.375 ppm** against a kit that reads in
  whole ppm and is independently known to run 14% high (`kit-calcium`, from ICP).
  Being wrong here costs a real dose change: the 07-27 card tells Dan to ease the
  calcium dose back on a 440 ppm reading. A guard — the fit must clear the band by at
  least the noise floor before it overrides the measurement — would remove all 50
  cases without touching the resist-one-noisy-reading property.
- *Something already does the job.* `outOfBandWorsening` (`helpers.js:528-532`)
  already requires `|trend| × spanDays > noiseFloor` before promoting a band grade.
  The same test is not applied to the out-of-range decision itself. Worth checking
  before adding anything new.

**Dan chooses.** Flagged for `domain-verifier`: on 2026-07-27 following the app
instead of the reading changes the calcium dose.

### R4 — Right answer, wrong evidence: "consistently in every interval"

Three dated cases where the explanation claims every interval moved the same way and
the `used` rows say otherwise:

| Date | Element | `used` values | Claim | Truth |
|---|---|---|---|---|
| 2026-05-07 | alkalinity | `[9.3, 9.3, 9.4, 9.4]` | "consistently in every interval", `consistent: true` | two of three intervals are **zero**; no interval clears the 0.1 dKH noise floor |
| 2026-07-28 | alkalinity | `[8.9, 8.6, 8.6]` | "falling … consistently in every interval" | second interval is zero |
| 2026-08-04 | alkalinity | `[8.7, 8.7, 9.0]` | "rising … consistently in every interval" | first interval is zero |

The 05-07 case is the sharpest: a `decrease` to 9.4 mL/day derived from four readings
that between them show **no movement at all above test resolution**. Journey-4b's
"Evidence rules" §"To establish movement from nothing: three readings" would reject
every one of these. Right answer or not, this is wrong evidence, and journey-4b says
so explicitly.

### R5 — Calcium: a single reading moves the dose 25%

2026-04-19, calcium 485 ppm — **+50 ppm in one day** from 435. That is 3.5× the
between-test moves either side of it and the ICP later shows the calcium kit reading
14% high. On that one reading the engine went from `idle` ("dose is matching
consumption", 12 ml) to `suggested`, `decrease` → **9 ml**. Eight days later it was at
405 and the engine said `increase` → **15 ml**. Same fortnight, 9 ml to 15 ml,
driven by two readings that a 10-ppm-resolution kit cannot distinguish from noise.

### R6 — The notice churn

252 notice appearances across 336 steps, from **105 distinct dismissible signatures**
— but only **26 distinct finding ids**. The gap is one mechanism: several notices
embed a computed number in their title, so every reading mints a new signature.

| Finding id | Distinct signatures | Appearances |
|---|---|---|
| `equilibrium-nitrate` | **52** | 67 |
| `equilibrium-phosphate` | **22** | 112 |
| `kit-phosphate` | 4 | 4 |
| every other id | 1–2 | 1–7 |

`equilibrium-phosphate` ran through *every* value from "settles near 0.00ppm" to
"settles near 0.21ppm" — 22 different texts for one situation. This is §6's smoking
gun and journey-4 §4's "notices stack instead of replacing", visible in Dan's real
data at a scale the journey did not know about.

---

## 5. The two real dose changes — advice versus action

### 5.1 Alkalinity, 2026-08-11 09:00 → 10 mL/day (target 10, 1 stage, next test 08-13)

Engine at that exact moment, clock faked to `2026-08-11T09:00`, readings through the
08:24 alkalinity 8.7, alkalinity dose at the 09-export value of **8 mL/day**, dose log
holding the calcium entry:

```
alkalinity: action=hold  recommendedDose=8  currentDose=8  maintenance=10.54
  explanation: "Alkalinity is above your range at 8.7dKH and moving down toward it at
    0.176 dKH a day. That is the direction you want, so changing the dose now would
    work against it. Reassess once it reaches the range."
  nextCheck:  "Recalculate once alkalinity is back inside 8.2–8.8dKH."
  doseState:  recovering | "Alkalinity is above your range and falling | Moving 0.2dKH
    a day toward your range … Nothing to change while it is heading the right way"
```

Identical with the 12-Aug ranges, identical with an empty dose log, and identical if
run before the 08:24 reading (`hold`, rec 8, from the 9.0 of 10 Aug). **The engine
said hold. Dan set 10.**

**This is not engine drift.** The innocent cause is verified in the code:
`src/components/ErrorBoundary.jsx:268-271` renders the button as
**"Change the dose anyway"** when `a.action === "hold"`, and `:257` sets
`target: a.staged ? round(a.maintenanceDose,1) : ml` with `stages: 1` when
`a.staged` is falsy. The recorded plan — `appliedDose 10, target 10, stage 1,
stages 1` — is exactly the shape that path produces. **The 11 August alkalinity
change is a recorded user override of a `hold`, not an accepted recommendation.**
There is no advice to reproduce, and nothing here contradicts the engine.

It is still worth Dan's attention that the app's own reading of 11 August was
"it is coming back on its own, changing the dose now would work against it", and he
raised the dose 25% anyway. Which of the two was right is answered in §5.3.

### 5.2 Calcium, 2026-08-10 09:00 → 12 mL/day (target 22.2, stage 1 of 3, next test 08-17)

Here the plan shape *does* carry engine output: `stages: 3` and `target: 22.2` can
only come from `a.staged === true` and `round(a.maintenanceDose, 1) === 22.2`
(`ErrorBoundary.jsx:257-259`). So the engine at the time believed the maintenance
calcium dose was **22.2 mL/day** and that 12 was the first of three steps toward it.

Four reconstructions were run, covering every innocent cause the routine names:

| Reconstruction | `currentDose` | `used` rows | first step | full target |
|---|---|---|---|---|
| 08-10 09:00, 09-Aug settings (ca 9 ml) | 9 | 4 rows to 08-04 | **10.5** | **12.1** |
| 08-10 09:00, 12-Aug settings (ca 12 ml) | 12 | 4 rows to 08-04 | **13.5** | **15.1** |
| 08-10 18:00 (after the tests), 09-Aug settings, empty dose log | 9 | `[450, 460, 440, 430, 400]` over 22.3 d | **11.3** | **13.9** |
| 08-10 18:00, 12-Aug settings, empty dose log | 12 | same 5 rows | **14.4** | **16.9** |
| **recorded on the day** | — | — | **12** | **22.2** |

The clock fake is verified (§10), the plan state is empty in every reconstruction,
and both settings snapshots were tried. **None reproduces 22.2.** The first step is
close (12 vs 11.3–14.4); the target is not (22.2 vs 12.1–16.9).

Where 22.2 could come from, arithmetically: `maintenance = currentDose + fall ÷
effectPerMl`, and `effectPerMl` for calcium here is `0.3611 × 100 ÷ 77 = 0.46896`
ppm/mL. `22.2 = 12 + fall ÷ 0.46896` gives a fall of **4.78 ppm/day** — which is
almost exactly the raw 430 → 400 slide between 4 and 10 August (30 ppm over 6.4 days
= 4.7 ppm/day). At `385428a` the engine instead fits **five** readings over 22.3 days
and gets 2.27 ppm/day. So the recorded figure is consistent with an engine that, on
10 August, was fitting only the last two calcium readings *and* already on a 12 mL/day
dose — neither of which is true of `385428a` or of the 09 export's settings.

**Worked up, not resolved:**

- *The engine's calcium window widened between 10 August and `385428a`.* Supported by
  independent evidence in §6: Dan's 10 August dismissal record contains the title
  `far-out-calcium|calcium is a long way below range`, and **no run of the current
  engine produces that string** — `findings.js:40` and `:240` describe that exact
  wording as a defect since corrected. The build Dan used on 10 August is demonstrably
  not `385428a`. This is the reading the evidence favours.
- *The calcium dose was already 12 mL/day when he opened the wizard.* Would explain
  the arithmetic, but contradicts the 09 export's `calciumDoseMl: 9` from the day
  before, and would require an unrecorded change between 9 and 10 August. Not
  impossible (§2 says the record is incomplete) and not testable from the exports.
- *A reading was present on 10 August that is not in the 12 August export.* Ruled out:
  all 325 of the 09 export's natural keys survive into the 12 export and the 12 export
  adds 11; nothing was deleted.

`UNVERIFIED`: which of the first two it is. It cannot be settled from the exports —
they carry no app version. **This is not "engine drift against its own history" in
the alarming sense** (the app has changed on purpose in the intervening days), but it
does mean the app cannot currently explain its own four-day-old advice, which is a
real problem for a log that is supposed to show what the app said at the time. Filed
to `history-truth-auditor` in §8.

### 5.3 The referee, on a four-day tail

What alkalinity and calcium did afterwards:

- **Alkalinity**: 08-11 08:24 → 8.7 (before the change); 08-12 09:24 → **8.8**. That is
  **one** reading after the change, 24 hours in, on a supplement whose settle window
  the app itself puts at two days. The engine's own words on 12 August: *"the dose
  changed to 10.0 mL/day about 24 hours ago and alkalinity has moved 0.1dKH since —
  inside normal variation. Hold this dose and take one more reading before deciding."*
  **Nothing can be concluded.** 8.7 → 8.8 is one kit resolution step.
- **Calcium**: 08-10 18:00 → 400 ppm (the reading, taken nine hours *after* the
  recorded 09:00 change). No calcium reading after it. The plan's own next test is
  2026-08-17, five days past the end of the export. **Nothing can be concluded**, and
  the engine agrees: *"Only one calcium reading since the dose changed. Hold and
  measure at the next weekly test."*

The timestamps are worth one line of their own: the calcium change is recorded at
**09:00** on 10 August and every 10 August reading is at **18:00 or later**. Either
the change was entered with a back-dated time, or it was made before the tests that
motivated it. The app permits both (`applyDoseChange` takes the date and time from the
sheet, `App.jsx:807-808`, deliberately). Consequence for the replay: from 10 August
09:00 the engine treats the calcium analysis window as restarted, so the 400 ppm
reading nine hours later lands in an empty window and produces "needs another
reading" instead of a verdict. Question for Dan in §9.

---

## 6. The dismissed-notices check

Ten notices carry the date **2026-08-10**, one carries 2026-08-11, and eleven
object-form entries carry 2026-08-12. Replaying with dismissals active from their
recorded dates:

| Moment | Notices raised | Hidden | Still on screen |
|---|---|---|---|
| 2026-08-10 18:45 (after the ten dismissals) | 10 | **0** | **10** |
| 2026-08-11 09:00 (after the eleventh) | 10 | **0** | **10** |
| 2026-08-12 09:30 (after the object-form re-dismissals) | 10 | **10** | **0** |

**Dan dismissed ten notices on 10 August and the app kept showing all ten.** Then on
12 August he dismissed what is essentially the same ten again, in a different storage
format, and they finally hid.

The mechanism, verified in code (`src/components/DoseExpectation.jsx:134-154`):

```js
export function findingKey(f)       { return "finding|" + f.id; }
export function findingSignature(f) { return f.severity === "act" && f.value != null
                                        ? `${f.id}|${f.title}|${f.value}` : `${f.id}|${f.title}`; }
export function findingHidden(f, dismissed) {
  const e = (dismissed || {})[findingKey(f)];
  if (e == null) return false;
  const sig = e && typeof e === "object" ? e.sig : null;
  /* A bare date is the old format and lapses rather than sticking forever. */
  return sig != null && sig === findingSignature(f);
}
```

The 2026-08-10 entries are keyed by the **full signature** (`kit-phosphate|kit reads
high 222%`) and hold a **bare date** as the value. `findingHidden` looks up
`finding|kit-phosphate` — a miss — and even on a hit a bare date returns `false` by
design. **All eleven pre-12-August dismissals are inert.** That is not a subtle
lapse-after-a-while behaviour: they never worked at all.

Two further observations from the same record:

1. **The 0.18 / 0.19 pair is real and it is the tip of the thing.**
   `equilibrium-phosphate|phosphate settles near 0.18ppm` and
   `…0.19ppm` are dismissed as two separate keys on the same day. The replay shows
   the engine produced **22 distinct texts** for that one finding across six months
   (§4/R6) and 52 for `equilibrium-nitrate`. Because `findingSignature` embeds the
   title and the title embeds the number, the 12 August dismissal of
   `equilibrium-phosphate|phosphate settles near 0.18ppm` is guaranteed to lapse the
   next time the estimate rounds to 0.17 or 0.19 — which, on this data, is a matter of
   days. journey-4 §4 ("notices stack instead of replacing") and §1 ("hiding is not
   global") are both confirmed in Dan's own data, with dates.
2. **Two dismissed titles the current engine never produces.**
   `far-out-calcium|calcium is a long way below range` — no run of `385428a` emits
   that string (`findings.js:40,240` record it as a corrected defect); the current
   text is `calcium is well above your target`.
   `heading-out-phosphate|phosphate is heading out of range` — never raised in run A,
   but **raised in run B**, i.e. only under the *default* 0.03–0.10 phosphate band.
   That dates the custom phosphate range 0.11–0.19 to on or after 10 August, and
   independently confirms the §5.2 conclusion that the build Dan ran on 10 August is
   not `385428a`.

Ten dismissals in one sitting, none of which worked, is itself the evidence
journey-4 asks for. It is also a plausible explanation for why he did it again two
days later.

---

## 7. The journey cross-check

`docs/journeys/` is source material, not spec (its README is explicit). Nothing here
justifies a code change. Verdicts: `matches` / `differs` / `no occasion to tell`.

| # | Behaviour Dan describes | Where | Verdict | Evidence from the replay |
|---|---|---|---|---|
| 1 | Adaptive cadence — 2 days normally, 3 when steady, 4–5 when confident | journey-1 §"What this reveals" pt 1 | **differs** | `nextCheck` takes 9 distinct forms for alkalinity across 336 steps and **none of them ever lengthens the interval for a settled tank**. The steady-state string is "Keep testing on your usual schedule" — the fixed `freqDays: 2` (`constants.js:26`). See 7.1. |
| 2 | Stability outranks the target | journey-1 pt 4 | **differs** | 20 Jun – 14 Jul, 25 alkalinity readings, every one between 9.0 and 9.8 and every one above band. The app showed an attention-grade dose card on **19 of 25** and made **7 distinct `decrease` recommendations**. No state exists for "off target, deliberately left alone". See 7.2. |
| 3 | A big move skips the confirming test; 40 points acts, 20 does not | journey-2 pt 2 | **differs** | Calcium 2026-03-24, −10 ppm in one day → `increase` → **15 ml**, immediately. Calcium 2026-04-27, −40 ppm in two days → `increase` → **15 ml**, immediately. Same gate, same figure, magnitude ignored. See 7.3. |
| 4 | Noise is answered by a longer window, not more readings | journey-2 pt 1 | **differs** | The alkalinity window is `nowStamp - 4` days, fixed (`alkalinity.js:531`), and widens **only when fewer than three readings** fall in it (`:540-543`) — i.e. for sparsity, never for noise. Dan tests daily, so his window is 4 days in every one of the 82 alkalinity steps; observed `used` counts are 3, 4 or 5 and nothing else. Through the noisiest stretch (7–19 July, alk 8.6–9.8) the window never widened. |
| 5 | "It didn't move" is a finding | journey-1 pt 3 | **no occasion to tell** | The only recorded alkalinity change is 2026-08-11. Exactly **one** alkalinity reading follows it (8.8 on 08-12, 24 h later, 0.1 dKH = one kit step). Two readings after an increase is the minimum the rule needs; the export ends first. |
| 6 | One reading is notice, two is a signal, three is a fact | journey-1 pt 5; journey-4b §"Evidence rules" | **differs** | Of **132** distinct (date, element, action, dose) recommendations, **128 fail** the strict rule (≥3 readings, all intervals in one direction, no flats or reversals) and **90 fail** the lenient one (a run of ≥3 readings in one direction with each step clearing the kit noise floor). By element, strict: alkalinity 26/30, calcium 77/77, magnesium 25/25. See 7.4. |
| 7 | Tolerance shrinks near the band edge | journey-2 pt 3 | **differs** | The only edge-sensitivity in the engine is binary — `outOfBandWorsening` (`helpers.js:528-532`) fires when the level is *already outside* and moving further out, promoting a `stable` grade to `mild`/`small` (`alkalinity.js:203`, `helpers.js:697`). Nothing graduates with *proximity*. Empirically: 2026-05-24 alk 10.0 (1.20 dKH from the edge), trend +0.120 → `decrease` 8.3; 2026-07-19 alk 8.9 (0.10 from the edge), trend +0.110 → `decrease` 8.4. Near-identical responses at twelve times the distance. |
| 8 | Magnesium high → pause or cut hard, never fine-tune | journey-3 pt 3 | **differs** | Run B (the range in force at the time, 1450–1500): six readings above band, 6 Jul – 4 Aug. Advice was `hold` at 8 ml on five of them, then on 2026-08-04 `decrease` → **6 ml**, described as *"Moving to 6.00 mL/day is the first step toward 0"*. A staged 25% trim, not a pause. See 7.5. |
| 9 | Notices stack instead of replacing; hiding is per-text | journey-4 §"What is wrong" pts 1 & 4 | **differs** | 105 distinct dismissible signatures from only 26 finding ids. `equilibrium-nitrate` alone produced **52** texts, `equilibrium-phosphate` **22**. The 0.18/0.19 pair in the dismissal record is two members of a 22-strong family. And §6: eleven dismissals that hid nothing at all. |

### 7.1 (differs) Cadence — worked up

The four causes from the journeys README:

- *The app is missing something.* The clearest reading. `nextCheck` varies with the
  dosing **situation** (post-change 48 h, "repeat the test now", "recalculate once
  back in band") but never with **settledness**. journey-1 pt 1 asks for exactly the
  latter. Wrong here costs Dan nothing but a few extra test strips.
- *Dan's practice is something the spec would reject.* `docs/spec/` puts alkalinity at
  a flat 2-day cadence; stretching to 4–5 days is a departure from canon, and this
  routine may not touch the spec. If the spec is right, the app is right to hold the
  line and journey-1 pt 1 should be closed as "declined", not implemented.
- *The app already does it.* Partly. `reminders` carry `intervalDays` and an
  `adjustDays` field, and the export shows `rem-alkalinity` at `intervalDays: 2` with
  `adjustDays: 0`. Whether anything ever moves `adjustDays` on its own is not
  established here — worth checking before building anything.
- *A dropped habit.* **Actively supported by the data, and this is the finding.**
  Dan's real alkalinity cadence across 82 readings: **63 gaps of 1 day, 17 of 2 days,
  1 of 3 days.** He does not test every 2–5 days; he tests essentially daily. The
  journey describes a cadence his own record does not show. Calcium and magnesium gaps
  are genuinely spread (calcium 1–8 days, magnesium 1–8), so the adaptive habit may
  be real for the slow elements and lapsed for alkalinity.

**What would decide it.** *"Since May you've tested alkalinity nearly every day —
is that the plan now, or was it a stretch of paying close attention?"*

### 7.2 (differs) Stability outranks the target — worked up. Chemistry-significant.

The stretch: 20 June to 14 July, 25 alkalinity readings, range 9.0–9.8 dKH, band
8.2–8.8. Stable, above target, and Dan did nothing (no dose-log entry, and the level
neither ran away nor came back). The app's response: 19 attention-grade cards and 7
`decrease` recommendations in 25 readings.

- *The app is missing something.* journey-1 calls this "the biggest philosophical gap"
  and the replay puts a number on it: **76% of readings in a deliberately-left-alone
  stretch carried a call to act.** A message that appears three readings in four is
  wallpaper — the same argument `state.js:104` already makes, in a comment, about a
  different message.
- *The practice is wrong.* Defensible: 9.0–9.8 dKH is above every published band and
  sustained high alkalinity with the calcium this tank was running (450–500) is the
  classic precipitation setup. The `ionic` finding fired for exactly this reason from
  10 May. If Dan is wrong to leave it, the nagging is the app doing its job.
- *Already handled somewhere.* Partly: `state.js:474-482` has an `off-target` state
  whose text is calm and correct ("there is no hurry about it"). But the `suggested`
  state overrides it on 7 of those 25 readings with a specific ml figure, and the
  card's tone is what Dan reads. The state exists; it does not win.
- *Dropped habit.* Unlikely; six months of consistent inaction.

**Which direction being wrong hurts.** Suppressing the notice on a genuinely
dangerous alkalinity is a livestock risk. Nagging on a stable one is a trust risk
that ends with the notices ignored — which §6 shows already happening.
**Flagged for `domain-verifier`**: whether 9.0–9.8 dKH held steady with calcium at
450–500 is safe to leave is a chemistry question, not a UX one.

### 7.3 (differs) Magnitude — worked up

The two cases are as close to a controlled comparison as real data gets: same element,
same six weeks, same starting dose, moves of −10 ppm and −40 ppm, and the engine
returned `increase → 15 mL/day` both times with no confirming-test gate on either. The
gate journey-2 pt 2 describes (small move waits for confirmation, big move acts) is
absent in both directions: the app neither waits on the small one nor distinguishes
the big one.

Note the direction this cuts. journey-2 wants the app to be *slower* on small moves;
the app is already as fast as it can be on both. So implementing pt 2 would mean
*adding* a gate, which would also have suppressed the 04-19 single-reading 25% cut in
§4/R5. That is an argument in its favour, and it is Dan's to make.

### 7.4 (differs) Evidence — worked up

The rule audited is journey-4b §"Evidence rules": *"Three readings, in one direction,
clearing the kit noise floor."* Two thresholds were computed so the number cannot be
accused of being chosen:

- **strict** — ≥3 readings, every interval in the fitted direction, no zero intervals:
  **128 of 132** recommendations fail.
- **lenient** — a run of ≥3 readings in one direction with every step ≥ the kit noise
  floor (alkalinity 0.1 dKH, calcium 10 ppm, magnesium 20 ppm): **90 of 132** fail.

Neither number is close to acceptable under the journey's rule, and the three
"consistently in every interval" cases in §4/R4 show the engine actively asserting an
evidence standard its own `used` rows do not meet. That last part is not a
philosophical gap — it is a claim in a user-facing string that the data contradicts.

The countervailing view, stated fairly: the engine is not trying to establish movement
from nothing. It fits a slope and reports a standard error (`±2.60 mL`, `±0.800 mL` in
the quoted strings), which is a legitimate and arguably better standard than counting
readings. journey-4b is describing patience; the engine is doing statistics. **The
question for Dan is which standard the notices should speak in** — and the honest
answer may be "the statistics, but with the patience threshold on top", since the
07-16 → 07-19 reversal in §4/R1 is a case where the statistics were confidently wrong
and three readings in one direction would have refused to fire.

### 7.5 (differs) Magnesium high — worked up. Chemistry-significant.

Two of the app's own outputs disagree on the same screen, on the same date, about the
same element:

- `paramContext` (`reading-meaning.js:22-28`), 2026-08-04, magnesium 1520 in run B:
  *"magnesium sitting in the 1500s … is very widely reported as harmless … Aquaforest
  Reef Salt is known for mixing high in magnesium, so **water changes are the likely
  source rather than anything going wrong**."*
- `doseStatus` on the same step: `decrease` → 6 mL/day, *"magnesium is rising and **the
  dose no longer matches what the tank uses**. Moving to 6.00 mL/day is the first step
  toward 0."*

One says the daily dose is not the cause; the other proposes to cut the daily dose to
zero in stages. And journey-3 pt 3 says the response to "too high" should be pause or
cut hard, never fine-tune — a staged trim to 6 ml is precisely the fine-tune it warns
against.

- *The app is missing something.* A "stop dosing this element" action does not exist;
  the engine can only move a maintenance figure. Wrong here means slow, ineffective
  advice on the one element where slow is actually fine.
- *The practice is wrong.* Cutting magnesium hard while calcium and alkalinity are
  dosed on the same balling schedule breaks parity, which journey-3 pt 4 itself names
  as having a consequence. The app's gradualism may be right and the journey's
  instinct wrong.
- *Already handled.* `proposeCorrection` offers gentle/steady/quick paces and could
  express "pause" as a quick correction. Not reached here because magnesium was
  `implausible`/`blocked` for 24 steps (`"The working points to 238 mL/day, which is
  not a real dose for 77.0 L. The strength figure is the likely cause."`), which is
  the app correctly refusing to advise on a bad Setup value.
- *Dropped habit.* No evidence either way.

**Flagged for `domain-verifier`**: whether the magnesium dose should be paused or
trimmed when the level is high and the salt is the source changes what the app tells
Dan to pour.

---

## 8. Findings that belong to other owners

| # | Finding | Owner | Evidence |
|---|---|---|---|
| O1 | **Reading ids do not survive export/restore.** 0 of 325 ids shared between two exports three days apart on identical readings; natural keys match perfectly. Any downstream analysis keyed by id silently loses continuity across a restore. | `history-truth-auditor` | §1 |
| O2 | **The engine reads the real clock through its `now` parameter.** `assess*` take `now`, but `todayStr()` is called directly inside `applyDoseConstraints` → `doseObservations`/`bracketDose` (`alkalinity.js:274-275`), in `correctionProgress`/`pendingCorrection` (`alkalinity.js:481,486`; `calcium.js:234,239`; `helpers.js:735,740`) and in `doseStatus` (`state.js:68`); `computeStability` (`stability-engine.js:83`) takes no `now` at all and calls `addDaysFromToday`. Demonstrated: with identical inputs and identical `now`, `computeStability` for alkalinity at 2026-06-20 returns **`green` "Rock steady"** when the system clock is 2026-08-14 and **`amber` "Some movement"** when the clock is faked to the evaluation date (spread 0.30 vs 0.60 dKH). Same at 2026-07-05. **The engine cannot be evaluated at a past date through its public parameters.** Not fixed here. | `history-truth-auditor`, replay-testability | §10 |
| O3 | **A water change is recorded in `task-log` on 2026-08-10 with no matching `water-changes` entry** (list ends 2026-08-03). 10 L on a 77 L tank is 13% of the volume; every consumption and dilution calculation from 10 August onward is missing it. | `history-truth-auditor` | §2 |
| O4 | **Two live dismissal formats, one of which is inert.** Eleven dismissals dated 2026-08-10/11 are keyed by full signature with a bare-date value and are ignored by `findingHidden` (`DoseExpectation.jsx:148-154`). Dan dismissed ten notices and nothing hid. | notifications / journey-4 owner | §6 |
| O5 | **Dismissal signatures embed computed numbers**, so a dismissal expires whenever the number moves. 22 distinct `equilibrium-phosphate` texts and 52 `equilibrium-nitrate` texts across six months. | notifications / journey-4 owner | §4/R6, §6 |
| O6 | **The app cannot reproduce its own four-day-old recorded advice.** The 10 August `ca-plan` target of 22.2 mL/day is not reproducible at `385428a` under any settings/clock/plan combination tried, and the same day's dismissal record contains a finding title (`calcium is a long way below range`) that the current engine no longer emits. The exports carry no app version, so "what the app said at the time" is not recoverable. | `history-truth-auditor` | §5.2, §6 |
| O7 | **The out-of-range decision uses the fitted value, the sentence quotes the measured one**, producing "8.7 dKH is above your range (8.2–8.8)" on 50 step-elements over 26 dates, with fitted excesses as small as 0.02 dKH — one fifth of the kit noise floor. | `domain-verifier` (chemistry), then Dan | §4/R3 |
| O8 | **The engine modules cannot be imported by plain Node** because `src/lib/constants.js` imports `../icons.jsx` (also `narrative-engine.js`, `analytics/measurement-noise.js`, `analytics/time-of-day.js`). Any future replay or offline analysis harness needs a JSX loader. Not a defect, but worth knowing. | tooling | §10 |

Chemistry-significant items flagged for `domain-verifier` per AGENTS.md #12 (flagged
here, **not dispatched** from this routine): **R2** (increase advised above band),
**R3/O7** (fitted-vs-measured out-of-range), **7.2** (nagging a stable above-band
alkalinity), **7.5** (magnesium pause vs trim).

---

## 9. Open questions for Dan — each answerable from memory in one line

1. **Between May and August, did you ever change the alkalinity dose from 8 mL/day —
   and if so, when?** (Decides §4/R1: whether the chase was the engine misreading a
   steady tank, or the engine reacting to changes it was never told about.)
2. **On 10 August, was the calcium dose already at 12 mL/day before you opened the
   wizard?** (Decides §5.2 between "the engine changed" and "the record is
   incomplete".)
3. **The calcium change is stamped 09:00 on 10 August but the tests are stamped
   18:00 — did you set the dose before testing, or type the time in afterwards?**
4. **On 11 August the app said to hold at 8 mL/day and that raising it "would work
   against it". What made you set 10?** (This is the only case in six months where his
   decision and the app's are both on record and they disagree.)
5. **You dismissed ten notices on 10 August and the same ten again on 12 August. Did
   they reappear, or did you just not notice the first lot had stuck?**
6. **What moved the magnesium range from 1450–1500 to 1520–1560 between 9 and 12
   August?** (It flips the app from "cut the magnesium dose toward zero" to "nothing
   to do".)
7. **Since May you've tested alkalinity almost every day. Is that the plan now, or was
   it a stretch of paying close attention?** (journey-1 describes 2–5 days; the record
   says daily.)
8. **Alkalinity ran 9.0–9.8 dKH from late June to mid-July, steady, with calcium at
   450–500. Was leaving it a decision, or had you not clocked it?**
9. **Was a water change done on 10 August?** (The task is ticked; the water-change log
   stops on 3 August.)

---

## 10. Appendix — the harness and the commands

The harness lived in the session scratchpad and dies with the session. Nothing was
written under `scripts/`, `tests/` or `src/`.

### 10.1 The JSX loader (needed because `constants.js` imports `icons.jsx`)

```js
// jsx-loader.mjs — registered via node --import register.mjs
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { transform } from '<repo>/node_modules/esbuild/lib/main.js';
export async function load(url, context, nextLoad) {
  if (url.endsWith('.jsx')) {
    const src = await readFile(fileURLToPath(url), 'utf8');
    const out = await transform(src, { loader: 'jsx', format: 'esm', jsx: 'automatic' });
    return { format: 'module', shortCircuit: true, source: out.code };
  }
  return nextLoad(url, context);
}
// register.mjs
import { register } from 'node:module';
register('./jsx-loader.mjs', import.meta.url);
```

### 10.2 The clock fake, and its proof

```js
const RealDate = Date;
function setClock(stampIso) {
  const fixed = new RealDate(stampIso);
  if (!isFinite(fixed.getTime())) throw new Error('bad clock stamp ' + stampIso);
  class FakeDate extends RealDate {
    constructor(...a) { if (a.length === 0) super(fixed.getTime()); else super(...a); }
    static now() { return fixed.getTime(); }
  }
  globalThis.Date = FakeDate;
}
function restoreClock() { globalThis.Date = RealDate; }
```

```
$ node --import register.mjs clockproof.mjs
unfaked  todayStr()             = 2026-08-14
faked    todayStr()             = 2026-05-04 (want 2026-05-04)
faked    addDaysFromToday(-14)  = 2026-04-20 (want 2026-04-20)
restored todayStr()             = 2026-08-14
```

`todayStr() === step.date` is additionally asserted **on every one of the 336 steps**;
the harness throws on drift. It never threw.

Evidence for finding O2 — identical inputs, identical `now`, different answer:

```
$ node --import register.mjs mixedclock.mjs 2026-06-20
stability grade: green  Rock steady    (system clock 2026-08-14)
              |  amber  Some movement  (system clock faked to 2026-06-20)
stability spread: 0.2999…  vs  0.5999…
$ node --import register.mjs mixedclock2.mjs 2026-07-05
stability grade: green  Rock steady  |  faked: amber  Some movement
```

### 10.3 The core loop, verbatim

```js
const steps = readingsAll.slice().sort((a, b) => {
  if (a.date !== b.date) return a.date < b.date ? -1 : 1;
  const ta = a.time || '', tb = b.time || '';
  if (ta !== tb) return ta < tb ? -1 : 1;
  if (a.param !== b.param) return a.param < b.param ? -1 : 1;
  return (a.value || 0) - (b.value || 0);
});

/* App.jsx:413-417 — PARAM_DEFS overlaid by custom-ranges */
const defsFor = (ranges) => PARAM_DEFS.map((d) => ranges[d.key]
  ? { ...d, min: ranges[d.key].min, max: ranges[d.key].max } : d);

for (let i = 0; i < steps.length; i++) {
  const r = steps[i];
  const stamp = `${r.date}T${(r.time || '09:00')}:00`;
  const useOld = (RUN === 'B') && r.date <= '2026-08-09';
  const settings = useOld ? SETTINGS_09 : SETTINGS_12;
  const paramDefs = defsFor(useOld ? RANGES_09 : RANGES_12);

  setClock(stamp);
  if (todayStr() !== r.date) { restoreClock(); throw new Error(`clock drift at step ${i}`); }

  const readings     = steps.slice(0, i + 1);                                  // readings <= t
  const doseLog      = doseLogAll.filter((d) => `${d.date}T${d.time || '00:00'}:00` <= stamp);
  const waterChanges = waterChangesAll.filter((w) => w.date <= r.date);
  const corrections  = correctionsAll.filter((c) => c.date <= r.date);
  const dismissed    = dismissedAt(r.date);          // both storage formats, active from their date
  const plans        = { alk: planActive(PLAN_SRC.alk, stamp),
                         ca:  planActive(PLAN_SRC.ca,  stamp),
                         mg:  planActive(PLAN_SRC.mg,  stamp) };
  const icpsNow      = icps.filter((x) => x.date <= r.date);

  /* The app's own derivation — App.jsx:68. Not a re-implementation:
     buildFindings (App.jsx:133), the three assess* (App.jsx:149-151),
     doseStatus (App.jsx:161), computeStability (App.jsx:168) and
     latestByParam (App.jsx:127-131) all run inside it, wired as the app wires them. */
  const tank = deriveTankState({ readings, icps: icpsNow, paramDefs, settings, doseLog,
    waterChanges, corrections, kitChanges, dismissed, plans, correctionPlans: {} });

  const def = paramDefs.find((d) => d.key === r.param);
  record({
    date: r.date, param: r.param, value: r.value,
    verdict:   paramStatus(def, r.value),                          // dates.js:24
    context:   paramContext(def, r.value, SALT_MIX),               // reading-meaning.js:17
    alk: pick(tank.alkAssessment), ca: pick(tank.caAssessment), mg: pick(tank.mgAssessment),
    doseStates: tank.doseStates.map((d) => ({ key: d.key, state: d.state, headline: d.headline, detail: d.detail })),
    appeared:  now.filter((s) => !prevFindings.has(s)),             // notices as a diff
    cleared:   [...prevFindings].filter((s) => !nowSet.has(s)),
    stability: tank.stabilityByParam[r.param],
    score:     tank.overview.score,
  });
  restoreClock();
}
```

### 10.4 Commands run

```
npm ci
git rev-parse HEAD                                          # 385428a219f2e1e586e488c81dd5fa9efe2caf0f
python3 -c "…Counter(x['param'] …)"                          # 336 readings, per-param counts (§1)
python3  natural-key / id-overlap / span / duplicate check    # §1 facts 1 and 3
python3  WATER_CHANGE_SEED comparison                         # §1 fact 2
node --import register.mjs smoke.mjs                          # every engine module imports
node --import register.mjs clockproof.mjs                     # §10.2
node --import register.mjs replay.mjs A replay-A.jsonl        # 336 steps, 0 errors, 0.9 s
node --import register.mjs replay.mjs B replay-B.jsonl        # 336 steps, 0 errors, 0.9 s
node --import register.mjs mixedclock.mjs / mixedclock2.mjs   # finding O2
node --import register.mjs probe.mjs   2026-05-28 …           # used rows + live findings (§4)
node --import register.mjs probe2.mjs / probe3.mjs            # fitted vs measured (§4/R3)
node --import register.mjs contradiction.mjs                  # the 50 step-elements (§4/R3)
node --import register.mjs evidence.mjs / evidence2.mjs       # 128 and 90 of 132 (§7.4)
node --import register.mjs dosechange.mjs / 2 / 3             # §5
node --import register.mjs dismissed.mjs                      # §6
python3  A/B divergence, notice families, referee tables      # §3.3, §4/R6, §4/R1
```

Not run, and not claimed: `npm test`, `npm run lint`, `npm run build`. This routine
changes no code, so the definition-of-done gates do not apply to it; they are named
here so that nobody reads their absence as a pass.

---

## 11. In plain terms

*Per AGENTS.md #11 — the whole report again, for the person whose tank it is. No code
names, no file references.*

**What we did.** You gave us two backups of your real tank. We walked through every
one of your 336 test results in order, from the middle of February to the twelfth of
August, and at each one we asked the app what it would have told you that day: is this
number fine, should a dose change, is there anything worth flagging. We did the whole
walk twice — once using the doses and ranges you have set today, and once using the
ones from three days earlier — so that we could tell which conclusions depend on your
settings and which are solid whatever they were. Nothing was changed. This is a report
and nothing else.

**The honest limitation, found by looking.** Your backups do not remember the dose
changes you made before August. They remember what your doses are now, and the two
changes you made through the app on the tenth and eleventh of August, but not the ones
you made on your own judgement in the months before. So for almost the whole six
months you get the app's side of the conversation, dated, to read against your own
memory. We did not invent any history to fill the gap.

**The big thing: the app chases alkalinity, and your tank does not agree with it.**
From May onward the app produced twenty-nine separate "change the dose" suggestions
for alkalinity, ranging from seven and a half millilitres a day to twelve and a half
— a two-thirds swing — while your alkalinity only ever moved between 8.6 and 10.4.
Four times it reversed itself inside a week. In mid-July it told you to raise the dose
by nearly a fifth; over the next four days alkalinity went up on its own, without you
doing anything, and three days later the app told you to cut the dose instead. At the
end of July it said raise again; alkalinity went up on its own again. In August it
said cut; alkalinity kept climbing. Every one of those calls was made from four days
of readings on a meter that only resolves to a tenth of a unit, and the moves it was
reading were two or three tenths. **Our reading is that the app is jumpy, not that you
were lucky.** But because your dose changes from that period were never recorded, one
line from you would settle it: did you touch the alkalinity dose at all between May
and August?

**The one that could have hurt.** On the twenty-eighth of May your alkalinity was 8.9
— above your target — and the app told you to increase the alkalinity dose by a
quarter, to twelve and a half millilitres a day. Over the next four tests it sat flat
at 8.8 to 9.0. If you had done what it said, you would have pushed an already-high
alkalinity higher still. We have flagged that for a chemistry check.

**The app sometimes calls a number "out of range" when it is inside the range.** On
twenty-six separate days it described a level as above or below your range while the
reading it quoted in the same sentence was inside it. The clearest is the
twenty-seventh of July: calcium read 440, your range is 400 to 450, and the app said
"calcium is steady but above your range" and suggested easing the calcium dose back.
The reason is that it decides in-or-out using a smoothed line through your recent
readings rather than the reading itself — sensible, so one odd result does not throw
it — but on the twentieth of July that smoothed line was over your alkalinity limit by
two hundredths of a unit, which is a fifth of what the meter can even see. We have not
changed anything. There are two reasonable ways to go and the choice is yours: leave
the smoothing and fix the wording so it stops quoting a number it is not judging, or
require the smoothed line to be clear of the edge by at least what the meter can
resolve before it overrides what you actually measured.

**Your ten dismissed notices on the tenth of August did nothing.** You hid ten
notices that day. Replaying it, all ten were still on screen afterwards, and still
there the next day. Two days later you hid what is essentially the same ten again, in
a newer format, and that time they stuck. The old way of recording a hidden notice is
simply not read any more. Worse, the newer way remembers the exact wording, and
several of your notices have a number baked into their wording — the phosphate one
went through twenty-two different versions over six months, one for each value it
settled near. So hiding "phosphate settles near 0.18" is guaranteed to come back the
moment it reads 0.19. That is exactly the complaint you wrote down about notices
stacking instead of replacing, and here it is in your own data.

**The two changes you actually made.** On the eleventh of August you raised alkalinity
from eight to ten millilitres a day through the app. Replaying that exact moment, the
app's advice was **hold** — its words were that alkalinity was coming back down on its
own and "changing the dose now would work against it". The app has a button that lets
you change it anyway, and that is what the record shows you used. So this is not the
app contradicting itself; it is you overruling it, on record, for the only time in six
months. Worth knowing what you were seeing that we are not. On the tenth of August you
set calcium to twelve millilitres as the first of three steps toward twenty-two. We
cannot reproduce that twenty-two from the current app on your data — the closest we
get is somewhere between twelve and seventeen — and separately we found a notice you
hid that day whose wording the app no longer produces at all. Both point the same way:
the app you were using on the tenth of August is not quite the app as it stands today.
That is not alarming in itself, but it does mean the app cannot presently explain its
own advice from four days ago, and we have flagged that.

**Where the app works differently from how you say you run the tank.** We checked nine
specific habits you described. Eight of them the app does differently and one we could
not test.

- You test less often when things are steady. The app never once suggests waiting
  longer — though we should say your own record shows you testing alkalinity on
  sixty-three days out of eighty-one back-to-back, which is not the two-to-five-day
  rhythm you described. Worth knowing which is the plan.
- You leave a stable-but-off-target level alone. Through a stretch of twenty-five
  alkalinity tests in late June and early July, all sitting between 9.0 and 9.8 and all
  above target, the app put an act-on-this card in front of you on nineteen of them and
  suggested a specific dose change on seven. That is the gap you called the biggest one.
- You act immediately on a big move and wait on a small one. The app treated a ten-point
  calcium drop in March and a forty-point drop in April identically — same instruction,
  same number.
- You answer a noisy meter by looking over a longer stretch. The app's alkalinity
  window is fixed at four days and only ever widens when you have been testing too
  rarely to fill it — never because the readings are bouncing.
- Your rule that one reading is a notice, two a signal and three a fact: of the hundred
  and thirty-two dose suggestions the app made across six months, a hundred and
  twenty-eight rest on evidence that rule would refuse. Three times the app's own
  explanation claimed every step moved the same way when one of the steps did not move
  at all.
- You get twitchier near the edge of the band. The app does not; a move at the very
  edge and the same move a whole unit away get near-identical treatment.
- When magnesium goes high you pause or cut hard, never fiddle. Under the range you
  actually had at the time, magnesium sat above it from early July. The app said do
  nothing five times and then suggested trimming from eight millilitres to six as "the
  first step toward zero" — the fiddle you said you never do. And on the very same
  screen its own note said the high magnesium is coming from your salt mix, not from
  your dosing. Two of the app's own sentences disagreeing about the cause.
- Your rule "if it didn't move, increase again" we could not test — only one alkalinity
  reading exists after your eleventh-of-August change, taken a day later, and it moved
  by exactly one notch on the meter, which means nothing either way.

**Nothing here has been decided.** Every disagreement above is written up with the
arguments on both sides, what it would cost if each side turned out wrong, and what
would settle it. Four of them touch chemistry directly — the "raise the dose while
you're already high" case, the in-range-called-out-of-range case, the nagging on a
steady high alkalinity, and the magnesium pause-versus-trim question — and those go to
a chemistry check before anyone touches anything.

**Nine questions are waiting for you in section 9**, each answerable in one line from
memory. The two that unlock the most are: did you change the alkalinity dose at all
between May and August, and what moved your magnesium range by seventy points in the
three days between your two backups.
