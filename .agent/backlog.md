# Backlog

Ordered. Top = next. **Only `[approved]` items may be implemented.**

## Approved for implementation

- [ ] [approved][chem] TW-001 Add net-volume field; every dose calc uses net, not gross
      why: dosing on gross 77 L overdoses by the displacement fraction
      spec: docs/spec/reef-chemistry.md#2-tank-constants
      owner: implementer

## Needs Dan's approval

<!-- triage-analyst files items here. Dan promotes by adding [approved]. -->
<!-- 2026-08-13 consistency sweep: 15 promoted (cap), 7 more qualified and were
     held back this run (parseFloat truncation on paste, "target" field dual
     meaning dose-vs-reading, ICP popup + chart missing units x2, LogResultPopup
     missing date/time, kitChanges not threaded into assessAlkalinity, chart has
     no alert-low/high shading) — will resurface next sweep if still true.
     2 items (volume terminology spec self-contradiction; magnesium/calcium rail
     constant conflict) are already escalated in .agent/needs-dan.md and are
     NOT repeated here — see that file. -->

- [ ] TW-002 No single classifyReading(); ~8 divergent classifiers disagree on the same reading
      why: classifyReading(param, value, targets) — the one legal place band classification
      happens per spec — does not exist anywhere in the codebase. 8 independently-maintained
      engines (paramStatus, reading-meaning.js's computeControl, ReadingConfirmation's
      readingVerdict, findings.js's SAFE_BOUNDS, dosing/state.js's inline SAFE_BOUNDS check,
      three dosing engines' own def.min/max comparisons, computeIonicBalance) use different
      thresholds and vocabulary and visibly disagree today. Concrete instance: Dashboard
      ParamCard shows amber "low" (paramStatus) directly above two red "Dangerously low"
      badges (doseStatus + findings.js, both reading SAFE_BOUNDS) for the identical 6.9 dKH
      reading, in one card, one render. The SAFE_BOUNDS check is also non-inclusive at the
      boundary (7.0 dKH exactly falls through to calm "off-target"; 6.99 triggers
      "emergency"). narrative-engine.js and findings.js separately disagree on the pH-high
      threshold (8.4 vs 8.45) for the same stored value, producing a message on one surface
      and silence on the other for the same reading.
      spec: docs/spec/surfaces-and-messaging.md §1 ("a second implementation... is an S1
      defect, even if it currently produces identical output"), §3
      repro: npx vitest run src/test/spec/classification/classify-reading-validation.test.js
      ("no module in scope exports a function named classifyReading"); npx vitest run
      tests/parity/alert-severity-cross-surface.test.js (doseStatusAt(6.9) → emergency/red
      vs readingVerdictAt(6.9) → "Well below band"/amber; doseStatusAt(7.0).state is not
      'emergency')
      owner: implementer

- [ ] TW-003 Dosing Wizard crashes on the two most common refusal states
      why: AlkAssessmentBlock (shared by all three elements) unconditionally reads
      a.current.value at the top of its stats table. Every assess* engine leaves
      out.current = null on a refusal (no net volume/solution strength set, or no readings
      logged yet) and returns before populating it. Tapping any element card before setup
      is complete throws a TypeError inside render; the correctly-worded refusal message the
      engine already computed (a.reason) is discarded and replaced with a generic
      "this tab hit an error" card and a raw stack trace. This is the first thing a
      brand-new user sees — the wizard opens on the element needing attention, and the
      closing hint text explicitly invites tapping any of the three cards.
      spec: docs/spec/reef-chemistry.md §2/§9 (refuses and names what's missing);
      docs/spec/surfaces-and-messaging.md §4
      repro: reproduced live against real components (not mocked): render
      <AlkAssessmentBlock a={{...assessAlkalinity({readings:[],doseLog:[],waterChanges:[],
      settings:{},def,now}), def}} /> throws "TypeError: Cannot read properties of null
      (reading 'value')" at src/components/ErrorBoundary.jsx:279. Same result for
      readings:[] against fully-configured settings.
      owner: implementer

- [ ] [chem] TW-004 Manual dose entry has no §6 rail check; Setup also accepts negative/unbounded doses
      why: DoseChangeSheet (opened from the wizard for all three elements) only compares
      the typed value to the app's own suggestion for a cosmetic "that's fine" note; the
      Save button is enabled for any finite value >= 0, with no rail lookup and no
      confirmation step. Setup's independent "Dosing" card dose field has no min bound
      (saveDose only rejects NaN), never calls dosePlausible, and stores the raw parseFloat
      verbatim — a negative or wildly implausible daily dose is written straight into
      settings and doseLog, corrupting every downstream engine's currentDose input.
      spec: docs/spec/surfaces-and-messaging.md §2 ("may NOT silently exceed a §6 rail...
      the app warns explicitly, states the rail and the overage, and requires confirmation")
      repro: npx vitest run tests/parity/manual-override-rail-check.test.js — with
      rateLimitDose clamping a requested 70 mL/day to 49.4 mL/day elsewhere in the app,
      driving the real DoseChangeSheet component with 70 mL/day entered shows no text
      matching /rail|limit|confirm|exceed/ anywhere, Record enabled, onSave(70,...) fires
      silently. src/components/Setup.jsx:66-92,204-208 (no min, no dosePlausible call).
      owner: implementer

- [ ] [chem] TW-005 Magnesium gate and precipitation guard are unreachable from the Dosing Wizard
      why: assessAlkalinity/assessCalcium take no magnesium status or sibling-element
      due-today parameter at all, so two of reef-chemistry.md §9's mandatory refusals — hold
      alk/Ca corrections while magnesium is below alert-low; never schedule alk and Ca doses
      within 4 hours of each other — cannot be produced by the wizard no matter what a user
      does. Not merely untested: structurally unimplemented.
      spec: docs/spec/reef-chemistry.md §5/§9, worked examples 4 and 8
      repro: npx vitest run src/test/spec/dosing/magnesium-gate.test.js — worked-example-4
      fixture (Mg 1140 < alert-low 1150, alk 7.4 vs target 8.5) still returns action:
      "increase" with no /magnesium/i match anywhere in the reason text; npx vitest run
      src/test/spec/dosing/precipitation-guard.test.js — neither engine's output carries a
      minSeparationFromCalciumHours/minSeparationFromAlkalinityHours field.
      owner: implementer

- [ ] TW-006 assessCalcium's displayed recommendedDose and internal plan[0] disagree for the same correction
      why: out.recommendedDose (rate-limited and step-capped via rateLimitDose/
      capDoseStep/applyDoseConstraints — what's shown and pre-fills DoseChangeSheet) and
      out.plan[0] (first day of the staged multi-day plan, built by a separate loop using
      its own 0.5/0.6 urgency multiplier, never capped) are two different numbers both
      claiming to be "day one" of the identical correction, computed inside one function
      call.
      spec: docs/spec/surfaces-and-messaging.md §2 ("the recommended dose in mL... and
      whether a multi-day plan is required" must be identical across surfaces)
      repro: npx vitest run tests/parity/multiday-plan-parity.test.js — currentDose 6 mL/day,
      maintenanceDose ~9.93 mL/day: recommendedDose = 7.5 (stepCapped {wanted:9.9,
      allowed:7.5}), plan[0] = 8.4 — a third figure, matching neither.
      owner: implementer

- [ ] TW-007 Rate/drift verdicts compare display-rounded values and skip the minimum-evidence gate
      why: assessDrift/computeRates round the rate before comparing it to the action
      threshold, not after — a raw 0.501 dKH/week drift (over the 0.5 threshold) rounds to
      "0.50" and is graded "no action needed". Separately, assessDrift and assessAlkalinity's
      own consumption calc never gate on reef-chemistry's minimum-evidence rule (>=3
      readings spanning >=6 days; no reading pair under 2 days apart) before producing a
      confident, dose-affecting verdict.
      spec: docs/spec/surfaces-and-messaging.md §3; docs/spec/reef-chemistry.md §7
      ("round last"), §8 (minimum evidence)
      repro: npx vitest run src/test/spec/classification/rounding-vs-stored.test.js; npx
      vitest run src/test/spec/classification/min-evidence.test.js — both fail live
      owner: implementer

- [ ] TW-008 "No change" shown for a matched dose holding outside the band, beside a live correction control
      why: when a daily dose matches consumption but the current reading sits outside the
      user's band, the collapsed Dosing Wizard tile shows headline "No change" / "dose
      matches use" in the neutral hold tone, directly beside an amber/red band-position dot
      — and one tap away, inside the same card, an active "Log a ... mL correction" button
      for the identical reading.
      spec: docs/spec/surfaces-and-messaging.md §4 (a message must not imply no action is
      needed when an action is available for the same reading)
      repro: code trace — src/lib/dosing/alkalinity.js:715-765 (out.ok=true,
      action="hold", explanation still notes it's out of range), src/components/
      DosingWizard.jsx:14-31,62-74 (headline/tone logic, band-position dot)
      owner: implementer

- [ ] TW-009 Refusal states render as a calm "Hold" or a false "more readings needed" instead of naming the missing input
      why: every genuine insufficient-data refusal (no volume, no dose configured, no
      readings yet) leaves out.action at its untouched default "hold", so AlkAssessmentBlock
      renders "Hold at -- mL/day" in the same tone as a real matched-dose hold. DoseElementCard
      and doseStatus separately collapse the identical refusal to "more readings needed" /
      "needs another reading" — false when the cause is a missing Setup field, since no
      amount of retesting fixes that. The correctly-worded a.reason exists on the object but
      only reaches the least prominent of the three surfaces.
      spec: docs/spec/surfaces-and-messaging.md §3 ("refuse and name what's missing"), §4
      ("a refusal message names the specific missing input")
      repro: code trace — src/lib/dosing/{calcium,alkalinity,helpers}.js (action never set
      off the "hold" default on any refusal path); src/components/DosingWizard.jsx:27-31;
      src/lib/dosing/state.js:417-437
      owner: implementer

- [ ] TW-010 insufficient-data readings render as a green "Saved" success card
      why: readingVerdict (the test-log confirmation shown after every test) has no branch
      for status === "unknown"/insufficient-data; execution falls through to the function's
      final return, which reuses the exact tone (#0B7C86) and checkmark used for a
      confirmed in-band good reading. A reading the app cannot classify is indistinguishable
      from one it has confirmed healthy.
      spec: docs/spec/surfaces-and-messaging.md §3 ("refuse and name what's missing"), §2
      (test-log confirmation, "every user, every test")
      repro: code trace — src/components/ReadingConfirmation.jsx:343-409, no unknown/
      insufficient-data branch; fallback at line 409 returns {emoji:"checkmark",
      tone:"#0B7C86", headline:"Saved"}
      owner: implementer

- [ ] TW-011 "In range, correction still running" headline contradicts its own body text
      why: when a correction plan is active but hasn't yet confirmed arrival (two in-band
      confirming readings), the first in-band test after starting the correction produces
      headline "In range, correction still running" with a body line quoting the remaining
      ppm/dKH gap and days left in the same breath — pairing the spec's no-action term
      directly against language describing an unfinished action.
      spec: docs/spec/surfaces-and-messaging.md §4 ("the single most important rule in this
      file")
      repro: code trace — src/components/ReadingConfirmation.jsx:74-78; reachable via
      App.jsx:1014-1020 recomputing doseState/correctionPlan from the freshly-saved reading
      before the popup opens
      owner: implementer

- [ ] TW-012 No submit lock on dose confirmation buttons — rapid double-tap can drop or duplicate a dose-log/correction-plan entry
      why: DoseChangeSheet's Record button and CorrectionPanel's Start button have no
      disabled-while-saving guard, and the write path (addDoseChange, setDoseLog/
      setCorrectionPlans) reads state from the enclosing render's closure rather than a
      functional updater. Two confirmations fired close together each compute `next` from
      the same stale array; the later write replaces the array outright rather than merging,
      so one entry can be silently dropped from state, from storage, or from just one of the
      two while the UI still reports "Recorded" for it.
      spec: docs/spec/surfaces-and-messaging.md §6 (history-truthfulness); audit checklist
      item 7 ("rapid double-tap on the final button must not double-dose or double-log")
      repro: reproduced live (not committed, git status clean after) — two fireEvent.click
      on Record calls onSave twice with no lock in between; code trace src/App.jsx:388-394
      (addDoseChange: setDoseLog(next) built from closure, not a functional updater), :720-759
      owner: implementer

- [ ] [schema] TW-013 No persisted classification or target-change event — editing a target silently reclassifies all history
      why: readings store no band/target-at-time-of-reading; every surface reclassifies live
      against the user's current customRanges, so narrowing or adopting a new target
      silently rewrites every past reading's verdict with no record anything changed.
      Separately, saveRange/resetRange write only to custom-ranges — no event is recorded
      anywhere when a target changes, so a step-change in a chart/history has no on-screen
      explanation.
      spec: docs/spec/surfaces-and-messaging.md §6 ("Recomputing the past against present
      settings is an S1 defect"; "If a target changed, history shows the change as an event
      in the series")
      repro: npx vitest run src/test/spec/history/target-change-immutability.test.js — a
      9.0 dKH reading logged 2026-03-15, rendered "In range" via the real WaterLog
      component, re-renders as "Low" the moment paramDefs reflects a changed target, unedited
      owner: implementer

- [ ] [schema] TW-014 Manual dose overrides are never stored with the recommendation they replaced
      why: DoseChangeSheet's onSave callback is invoked with only (ml, date, time) — the
      recommended/suggested figure shown on the same sheet is dropped before it reaches
      storage. Every doseLog row is {id, date, time, ml, element, note}; no history view,
      chart, or CSV export can show recommended-vs-dosed for a past manual entry.
      spec: docs/spec/surfaces-and-messaging.md §2/§6 ("recorded as a manual override, with
      both the recommended value and the entered value... history must show both, always")
      repro: npx vitest run src/test/spec/history/override-visibility.test.js — typing 15.5
      into the amount field with recommended=10.0 and clicking Record calls onSave with
      [15.5, date, time]; 10.0 appears nowhere in the call
      owner: implementer

- [ ] TW-015 Forbidden vocabulary ("safe", "optimal", "healthier") leaks into rendered narrative text
      why: CONSISTENCY_RULES[key].why strings are spliced verbatim into Dashboard/Insights
      messages: "20 ppm/day is the accepted safe rate of change for calcium"; "the safe
      correction ceiling"; "fluctuation... inside the optimal range"; "a steady 0.08 ppm is
      healthier than a range of 0.01-0.15 ppm". §5 bans exactly this vocabulary about a
      reading.
      spec: docs/spec/surfaces-and-messaging.md §5 ("The app never uses 'safe' or 'unsafe'
      about any reading")
      repro: code trace — src/lib/analytics/time-in-range.js:70,72,76,80, spliced in at
      src/lib/analytics/reading-meaning.js:206, consumed by Dashboard.jsx:11 and
      Insights.jsx:15
      owner: implementer

- [ ] TW-016 "drift"/"drifting" is used for three incompatible meanings across the app
      why: reading-meaning.js's verdict="drifting" fires on an out-of-band, oscillating
      median — the opposite of the spec's inside-band, trending-toward-an-edge definition.
      Dashboard's "Weekly drift" label is a generic rate-of-change magnitude shown even when
      a parameter is centred in-band. Insights' ionic-balance section uses "drift" for an
      unaccounted dosing-vs-measured discrepancy, a third, unrelated meaning.
      spec: docs/spec/surfaces-and-messaging.md §3 (band-verdict definition of "drifting"),
      §5 (no invented or reused vocabulary)
      repro: code trace — src/lib/analytics/reading-meaning.js:196-220; src/components/
      Dashboard.jsx:492,582; src/components/Insights.jsx:384,391
      owner: implementer

## Blocked

## Done
