# Raw findings (pre-triage)

Auditors append here. triage-analyst empties this into the backlog each night.
Format: one block per finding.

```
### <agent> / <date> / <severity S1-S4>
what:
evidence: (command + output, or file:line)
impact:
suggested fix:
confidence: high|medium|low
```

### routine-13-phase5-gate / 2026-08-14 / S1
what: `App.jsx:1275` calls `goTo({ tab: "dosing", key })` inside `ReefConsoleInner`'s
render, but `goTo` is declared only inside `Dashboard`'s own body (Dashboard.jsx:60) —
a different component, never imported, never passed as a prop. There is no `goTo` in
`App.jsx` at all outside that one call site.
evidence: `npm run verify:linkcheck` — "src/App.jsx: undefined calls -> goTo". Confirmed
by hand: `grep -rn "goTo\b" src/` returns exactly two hits, in two different components.
impact: `<LogResultPopup onOpenDosing={(key) => goTo({ tab: "dosing", key })} />` throws
`ReferenceError: goTo is not defined` the instant a user taps "go to dosing" from the
log-result popup after recording a reading. Plain terms: tap the button that's supposed
to take you from "reading logged" straight to the dosing screen, and the app breaks
instead — a blank error where the next useful screen should be.
suggested fix: App.jsx needs its own `goTo`, or the popup's `onOpenDosing` needs to be
wired to whatever App.jsx already uses to switch tabs (there is a `tab`/`setTab` pair in
scope at the call site — not verified which is correct, needs an implementer to trace
the tab-switching path before touching this).
confidence: high — reference error is not a guess, it's what the identifier resolution says,
and hand-confirmed by grep.

### routine-13-phase5-gate / 2026-08-14 / S1
what: `Tasks.jsx:198` calls `onComplete(id)` inside a `ReminderSheet` callback, but
`Tasks`'s own signature (Tasks.jsx:15-20) never declares `onComplete` — only `onMarkDone`,
which is what App.jsx actually passes in (`onMarkDone={completeReminder}`, App.jsx:1252).
evidence: `npm run verify:linkcheck` and `npm run verify:propcheck` both independently
flag it — "Tasks.jsx: undefined calls -> onComplete" and "Tasks: calls handlers it never
receives -> onComplete". Confirmed by hand: `grep -n onComplete src/components/Tasks.jsx`
shows exactly the one JSX prop assignment and the one call, no declaration.
impact: `ReferenceError: onComplete is not defined` the moment a user opens a reminder
from the Tasks tab and taps its "mark done" action inside the sheet. Plain terms: open a
reminder from the Tasks list and try to mark it done from that screen, and the app breaks
instead of completing the task.
suggested fix: likely `onComplete` at Tasks.jsx:198 should read `onMarkDone` — needs an
implementer to confirm the sheet's contract expects the same `(id) => void` shape before
changing it.
confidence: high — same basis as the goTo finding above, two independent checkers agree.

### routine-13-phase5-gate / 2026-08-14 / S3
what: three `useMemo` values computed and never read again: `doseAdvice` in
Insights.jsx:108 and Dashboard.jsx:298 (already known — `.agent/five-decisions.md`), and
a third, newly found: `preview` in Tasks.jsx:27 (`predictAfterChange` result for the
water-change dialog), referenced nowhere else in the file.
evidence: `npm run verify:deadcode` — "Insights.jsx:108 Insights: 'doseAdvice' computed
(useMemo) but never read again", same for Dashboard.jsx:298, and "Tasks.jsx:27 Tasks:
'preview' computed (useMemo) but never read again".
impact: wasted computation on every render (not a correctness bug for the first two,
already tracked). The `preview` case is a plausible feature gap, not just dead code: the
water-change dialog computes what the change would do to the tank's readings and then
never shows it — the "Log change" form logs, but the preview a user might expect to see
before confirming a big water change was never wired to any JSX. Plain terms: the app
works out what a planned water change would do to the tank and then doesn't show anyone.
suggested fix: for `preview`, needs an implementer/domain-verifier to decide whether the
water-change form was meant to display this and never got wired up, or whether it's
leftover from a removed feature and safe to delete. The two known `doseAdvice` cases are
already tracked in `.agent/five-decisions.md` — no new fix needed here, just re-confirmed
still present.
confidence: high for "computed and unread" (mechanical); medium for "this is a real gap"
in the `preview` case — needs a domain read, not just a static one.

### routine-13-phase5-gate / 2026-08-14 / S4
what: three dead custom CSS rules in `src/styles/base.css`: `.err` and its `#boot`
container (leftover from the monolith's HTML boot-loader screen, which no longer exists —
`loader.js` is build machinery vite replaced), `.rc-head` (referenced only inside its own
`prefers-reduced-motion` override, never applied as a className anywhere), and
`.rc-modal` (used only as a descendant selector — `.rc-modal :focus-visible` — never
applied as a className itself, so the light focus-ring override for modals never
activates).
evidence: `npm run verify:csscheck` — "CSS rule never used: err / rc-head / rc-modal".
impact: none observable today (dead weight, not a live bug) except `.rc-modal`, which is
a real accessibility gap: the light-on-dark focus ring it was meant to provide inside
modals never turns on, so keyboard focus inside a modal uses the default (possibly
low-contrast) ring instead.
suggested fix: delete `.err`/`#boot` (confirmed orphaned, no live consumer); for
`.rc-modal`, an implementer needs to either apply the class where modals render or
confirm the default focus ring already clears contrast inside modals before deciding
it's safe to drop.
confidence: high for "unused" (mechanical, cross-checked against every `className` in
`src/`); medium for "the modal focus ring is a real a11y gap" — worth a11y-reviewer's eyes
before triage, not asserted as certain here.

### history-truth-auditor / 2026-08-14 / status-of-priors
TW-013 (no persisted classification / target-change event) — UNCHANGED. src/test/spec/history: 4 fail / 11 pass, identical to 2026-08-13. WaterLog.jsx:186, Dashboard.jsx:145,612 still classify live against customRanges merged every render (App.jsx:415-418); no target-change event exists.
TW-014 (overrides not stored with recommendation) — UNCHANGED. DoseChangeSheet.jsx:63 onSave(ml,date,time) only; export-csv.js:20-21 has no recommended/override column.
position-is-last-reading (d050fc8) touched only the dosing engines, not history rendering. New durability code (idb.js/auto-backup.js) never touches readings/dose-log; restore merges by natural key without overwriting rows — except the finding below.

### history-truth-auditor / 2026-08-14 / S1
what: The new snapshot-restore feature opens a second, silent door to TW-013's exact bug. Restoring any daily snapshot unconditionally overwrites live `custom-ranges` (targets) with the snapshot's copy — and because band classification is computed live against `custom-ranges` everywhere in history (WaterLog rows, chart shading, tooltips), a restore instantly and silently reclassifies every reading in the log, including ones logged after the snapshot was taken. The confirmation message is false for this field: it says "nothing was overwritten," true for readings/dose-log (additive merge) but not for targets (full replace).
evidence: src/lib/backup.jsx:170-172 — unconditional `saveKey("custom-ranges", b["custom-ranges"])`, no merge, not gated by any applySettings flag. Restore entry: src/components/Setup.jsx:722-728 ("Snapshot restored — anything missing was added, nothing was overwritten."). buildBackup (backup.jsx:32) confirms every daily ring snapshot carries custom-ranges. Static trace unambiguous; dynamic repro UNVERIFIED this run (read-only — no test file could be written into the discovery path).
impact: In plain terms: use the undo feature to recover a few lost readings, and as a side effect every historical test result quietly re-labels itself against whatever target band was set on the snapshot's day — months of history relabeled, no warning, and the on-screen message explicitly claims nothing was overwritten.
suggested fix: root fix is TW-013 (persist classification at log time); until then restoreBackup should merge custom-ranges rather than replace, or the restore confirmation must name the overwrite.
confidence: medium (mechanism confirmed by code reading; not exercised live)

### manual-dose-auditor / 2026-08-14 / status-of-priors
TW-004 — UNCHANGED. DoseChangeSheet.jsx:1-69 imports no rail primitive; Save enabled for any val >= 0 (lines 21,63); Setup.jsx:105-111 saveDose checks only isNaN. Live: tests/parity/manual-override-rail-check.test.js still fails (70 mL vs 49.4 mL rail, no warning text).
TW-012 — UNCHANGED, and reaches a third control: App.jsx:425-431 addDoseChange, :731-736 startCorrection, :741-766 cancel/finish all build next state from closed-over arrays; no disabled-while-saving guard on DoseChangeSheet.jsx:63 Record, DosingWizard.jsx:186 Start the correction, Setup.jsx:234 Save dose change.
TW-014 — UNCHANGED. onSave(ml,date,time) only; App.jsx:816-826 writes {date,time,ml,element,note}; the recommended figure lives only in the transient doseResult popup and is discarded on close. History tests still fail as before.
UNVERIFIED this run: real-browser paste/locale behaviour of number inputs; live double-tap reproduction (structural trace only, relied on last sweep's live repro).

### manual-dose-auditor / 2026-08-14 / S2
what: src/test/spec/dosing/rate-rails.test.js still asserts the PRE-14-Aug rail canon (calcium 25, magnesium 100 ppm/day) as "the canon table verbatim". The rail-constant fix (backlog, 2026-08-13, closed) updated correction.js and the sibling rails tests to current canon (reef-chemistry.md §3: alk 0.5, Ca 20, Mg 25) but missed this file. A red test now sits in the tree asserting numbers wrong per current canon, next to code that correctly implements the canon (safe-rate.js:27).
evidence: npx vitest run src/test/spec/dosing/rate-rails.test.js → FAIL "calcium default rail is 25 ppm/24h per canon (code enforces 20)"; FAIL "magnesium default rail is 100 ppm/24h per canon (code enforces 25)". File header cites "reef-chemistry.md §6, lines 149-166" — a section/line range that no longer exists (rails now §3, ~107-113).
impact: No wrong number today — the app enforces the correct rails. The risk: anyone who trusts this red test as "code is out of spec" and "fixes" safe-rate.js would reintroduce the 4x-too-loose magnesium rail. In plain terms: a leftover checklist still says magnesium may rise 100 a day when the decided safe ceiling is 25; if someone ever "fixes" the app to match the leftover, magnesium could be pushed four times faster than corals can tolerate.
suggested fix: update rate-rails.test.js expectations (Ca→20, Mg→25) and its stale citation to §3 — same-shape follow-up to the closed rail item, not a new chemistry decision.
confidence: high

### manual-dose-auditor / 2026-08-14 / S3
what: reef-chemistry.md §3 explicitly permits the user to TIGHTEN a rail ("never loosen"), but no mechanism exists anywhere: no Setup field, and neither rateLimitDose (alkalinity.js:351-379, reads settings only for dosePlausible) nor safeDoseBand (safe-rate.js:43-48, hardcoded SAFE_DAILY_RISE) consults any user value.
evidence: grep for maxDailyRise/tighten/rateLimit in Setup.jsx → no matches. Live: rate-rails.test.js "a tighter user-configured alkalinity rail is not honoured" fails — settings.maxDailyRiseDKH: 0.2 silently ignored, clamped at hardcoded 0.5.
impact: In plain terms: a keeper who knows their corals react badly to fast alkalinity swings has no way to ask the app for a gentler daily limit — the spec promises that control, the app silently ignores it and always runs at the full default rate.
suggested fix: per-element rate-cap field (or existing rail-adjacent settings surface) threaded as min(default, userValue) through rateLimitDose/safeDoseBand. UI-and-wiring, not a chemistry change. NOTE for triage: check against wizard-states.md §21 (Setup asks facts, not judgements — a rate tolerance is named there as a NON-fact); the spec may be in self-tension here → possible needs-dan rather than backlog.
confidence: high

### message-consistency-auditor / 2026-08-14 / status-of-priors
TW-011 — UNCHANGED (ReadingConfirmation.jsx:76-77, in-band headline + remaining/daysLeft body in same object).
TW-009 — UNCHANGED (alkalinity.js:433-437 refusal path keeps action:"hold"; ErrorBoundary.jsx:121 "Hold at null mL/day" shape; DosingWizard.jsx:22-31 collapses every refusal to "Set up"/"more readings needed", never renders a.reason).
TW-010 — UNCHANGED, same line (ReadingConfirmation.jsx:409 green "Saved" for status unknown).
TW-008 — UNCHANGED (alkalinity.js:738,775 + DosingWizard.jsx:14-31 "No change" beside band dot).
§20 non-dismissibles — CONFIRMED still live at cited lines (narrative-engine.js:394; :457-492 five dose claims, no dismissible flag). TW-031 still un-approved.
position-is-last-reading cleanup — VERIFIED CLEAN: "dose right, level off" fully removed, no surviving message references it (state.js:505-513, pinned by position-is-last-reading.test.js:110,118).

### message-consistency-auditor / 2026-08-14 / S2
what: buildOverview's entire cross-parameter narrative — Ca:alk and Mg:Ca ratio commentary, the alkalinity-vs-nutrients "burnt SPS tips" warning, pH read against alkalinity, stability paragraph, stale-testing warning, and the "if you do one thing this week" line — is computed correctly every render and shown NOWHERE. Only overview.headline and overview.score have consumers; overview.paragraphs has none. The legacy app rendered it under a "Read full assessment" expander (legacy/releases/reef-console-v1-stable.jsx:5278, v3:5296-5346); the render call did not survive the rewrite into OverviewCard.
evidence: grep -rn "overview\." src/components → only TodayPanel.jsx:645 (headline) and Dashboard.jsx:38; OverviewCard (TodayPanel.jsx:617-690) reads score+headline only. grep -rn "\.paragraphs" → zero JSX consumers in src/, definition only at narrative-engine.js:1343. Insights.jsx never calls buildOverview. Not tracked in backlog.
impact: In plain terms: the app quietly works out real cross-checks — e.g. that high alkalinity with lean nutrients is the classic setup for burnt SPS tips, or that a calcium-to-alkalinity ratio far off balance means one dosing program needs attention — and then throws the advice away. The keeper sees a headline and a score with no explanation, and a category of chemistry cross-checks no other surface performs reaches no screen.
suggested fix: wire overview.paragraphs into OverviewCard behind an expander as legacy did, or thread buildOverview's output into Insights explicitly. Resolve the pH threshold split (next finding) FIRST.
confidence: high

### message-consistency-auditor / 2026-08-14 / S3
what: CORRECTION to last sweep: the pH "running high" threshold disagreement (>8.4 narrative-engine.js:1191 vs >8.45 findings.js:528) is NOT a live two-surface contradiction — the >8.4 branch lives inside the never-rendered overview.paragraphs. Only the >8.45 branch reaches a screen (claims/Briefing feed). Real and unreconciled in source, but latent, not live.
evidence: trace above; findings.js:528 confirmed live via App.jsx findings state → Briefing/FindingList.
impact: In plain terms: for a pH between 8.40 and 8.45 nothing on screen claims "running high" today — but the moment the discarded advice text is wired back in, the app would say high and not-high about the same reading. A landmine for the S2 fix above.
suggested fix: canon should name the pH-high figure once (reef-chemistry.md); collapse both branches to it before restoring paragraphs. Until then documentation debt, not a rendering bug.
confidence: high

### terminology-auditor / 2026-08-14 / status-of-priors
TW-015 — UNCHANGED (time-in-range.js:70-80 spliced via reading-meaning.js:206; findings.js:201,247; state.js:202-203; ReadingConfirmation.jsx:51,352 still render "dangerously"/"emergency").
TW-016 — UNCHANGED, shape shifted (reading-meaning.js "drifting" verdict now line 218 in restructured chain; Dashboard.jsx:492,582 "Weekly drift"; Insights.jsx:384,391 ionic-balance "drift").
TW-017 — UNCHANGED core + EXPANDED: findings.js:362-363 byte-identical double-offender; two more live "Set your tank volume in Setup": drift.js:282, DosingWizard.jsx:258. Setup.jsx itself clean ("net volume").
wordingcheck (TW-028 evidence) — CONFIRMED by running: OK, 11 checked, still one file/one function/one field, no coverage floor.

### terminology-auditor / 2026-08-14 / S2
what: The approved word "target" is used for four structurally different concepts across surfaces in one session: (A) the value the user types (Setup.jsx:379 Correction Calculator field); (B) the app's computed correction aim point = band midpoint (state.js:205 target:mid; rendered DosingWizard.jsx:135,161, ReadingConfirmation.jsx:48,77, narrative-engine.js:567); (C) the whole band, rendered "Target range" (alkalinity.js:487/calcium.js:243/helpers.js:741 out.target={min,max} → ErrorBoundary.jsx:280); (D) a synonym for in-band: Dashboard.jsx:430 "{c.pct}% in target". Supporting: doseStatus's target field is a concentration in most branches but a DOSE RATE (mL/day) in the "suggested" branch (state.js:361 target: a.maintenanceDose).
evidence: file:line cites above; senses A-D all reachable within the same parameter modal (Dashboard.jsx:430,445-467 + ErrorBoundary.jsx:280 + DosingWizard.jsx).
impact: In plain terms: "Target" means the number you typed, the point the app is steering to, your whole acceptable range, or just "in range" depending on the screen — "72% in target" next to "Target range: 8.4-8.6" next to "on its way to 8.5" teaches the keeper the word means nothing, on exactly the field where trusting it matters.
suggested fix: reserve "target" for the user's chosen value/band per §15; rename B ("aim point" or band-midpoint language), C ("Your range"), D ("% in range"). Copy/registry decision — flag for Dan before renaming.
confidence: high

### terminology-auditor / 2026-08-14 / S2
what: reading-meaning.js invents SIX headline categories not in §13's band table — sliding/"Moving fast", loose/"Wide swing", dialled/"Dialled in", controlled/"Well controlled", steady-off/"Steady, running high/low", drifting/"Drifting high/low" — rendered at Dashboard.jsx:467 in the same modal as the band badge. Worse: its "drifting" (line 218) fires only when the median sits OUTSIDE the band — §13 defines drifting as INSIDE the band trending toward an edge. Same word, opposite band position.
evidence: reading-meaning.js:196-219; Dashboard.jsx:467.
impact: In plain terms: a second home-made vocabulary sits on top of the official one, and its one shared word means the opposite — "Drifting high" here says you're already out of range, everywhere else it means still in range but sliding. suggested fix: needs Dan — decide whether consistency-over-time gets registry entries distinct from §13's bands or folds into the seven; involves chemistry reasoning (mixes rate grading with band position), not a bare rename.
confidence: medium

### terminology-auditor / 2026-08-14 / S3
what: The §20 "notice" concept ships TODAY under three different user-facing words — "Worth knowing about" (Dashboard.jsx:619-620), "Got it — hide this" (DoseExpectation.jsx:175, no noun), "Hidden notes"/"Notes" (Setup.jsx:478-491) — and §20's settled confirmation sentence will add a fourth ("notification") when TW-031 lands.
evidence: cites above. Registry gap itself is Dan's call per §20 — not filed as a defect; the shipped inconsistency is.
impact: In plain terms: hide a message on one screen and you'll hunt for "notes" on another — and the planned confirmation dialog will call the same thing a "notification". suggested fix: one-line note to Dan — when §15 gains the entry, reconcile Setup's "notes" and §20's "notification" together.
confidence: medium

### terminology-auditor / 2026-08-14 / S2
what: ICP confirmation popup renders every element value with no unit and no aria-label — unchanged from last sweep, now also checked for a11y.
evidence: IcpConfirmation.jsx:134 "{e.v} · {e.st}", :156 biggest-moves values; zero aria-* attributes in file.
impact: In plain terms: after logging an ICP lab result the "biggest moves" numbers carry no ppm/ppb, and a screen reader gets bare numbers with no context. suggested fix: thread units from icp-reference.js into lines 134/156, add aria-labels.
confidence: high

### terminology-auditor / 2026-08-14 / S2
what: ZoomableLineChart never receives or displays a unit or parameter name — axis ticks and tooltips are bare numbers at all three call sites; zero aria-* in file.
evidence: ZoomableChart.jsx:69 prop signature (no unit/label/def), :202 tickFormatter, :209 tooltip formatter (niceAxis :47-61 never appends a unit); callers Dashboard.jsx:612, IcpPanel.jsx:168, AllParametersSheet.jsx:285 pass nothing.
impact: In plain terms: every gridline and tooltip on every history chart is unit-less — is that 8.2 dKH, ppm or ppt? A screen reader announces context-free numbers. suggested fix: add unit/label props, append in axis formatters, aria-label the container — one component fix clears all three call sites.
confidence: high

### band-classifier-auditor / 2026-08-14 / status-of-priors
classifyReading — still does not exist (grep: only test-file references). Canon §11 itself now names "ten" divergent classifiers; this run enumerates THIRTEEN by file:line: paramStatus (dates.js:24), paramContext (reading-meaning.js:17), computeControl (reading-meaning.js:89), readingVerdict + inline SAFE_BOUNDS (ReadingConfirmation.jsx:20,45,149-155), findings.js far-out loop (:87,218-251), findings.js heading-out regression classifier (:424-510), assessDrift/DRIFT_GUIDE (drift.js), state.js inline emergency check (:189-206), alkalinity.js:608-610,719-720, calcium.js:413-415,477-478, helpers.js:916-918,968-969, computeIonicBalance (drift.js:277), and NEW #13 StabilityStrip (TodayPanel.jsx:314, see block below).
TW-010 — UNCHANGED (ReadingConfirmation.jsx:409 unconditional green Saved fallback).
TW-007 — UNCHANGED (rounding-vs-stored + min-evidence suites: same 6 failures as yesterday).
Boundary matrix: paramStatus band edges inclusive and CORRECT (verified live at exact edge and ±ε). alert-low edge WRONG: value exactly 7.0 = SAFE_BOUNDS.min classifies off-target not emergency (non-inclusive, violates §13 "exactly equal to alert-low is alert-low"); alert-high inferred same (state.js:195 > not >=). §13's drifting: no code implements it at all (reading-meaning.js:218's "drifting" = out-of-band bouncing median, opposite meaning). insufficient-data: detected correctly at classifier layer (paramStatus → "unknown"), destroyed at render (TW-010).
TW-005 — UNCHANGED (alert-thresholds + ca-alk-coupling suites still fail identically).
POSITION-IS-LAST-READING (§26) — LANDED, VERIFIED: 17/17 pass; engines + doseStatus read out.current.value; fittedNow survives only for one-off sizing (§26 explicitly defers that). NO new fitted-vs-last split: every other classifier already read raw last values.
§19 deriveTankState — still assesses only alk/Ca/Mg (App.jsx:142-162), still bypassed by ParamCard/TodayPanel/findings.js/drift.js/Insights. The 14 Aug engine decision is docs-only; nothing in code enforces it. TW-029/TW-030 unchanged.

### band-classifier-auditor / 2026-08-14 / S2
what: StabilityStrip (today-panel spread bar, every parameter) computes its own in/out-of-band test straight off def.min/def.max to choose its colour — a thirteenth independent classifier, never before named by file:line in backlog or canon's "ten".
evidence: TodayPanel.jsx:314 `const outside = stab.p05 < def.min || stab.p95 > def.max;` → :328 picks "#A2621B" vs def.color. Predates the Vite conversion (git log confirms untouched since 0637695) — pre-existing, newly catalogued.
impact: In plain terms: the little spread bar on the today screen forms its own opinion about whether your readings straddle the band, independent of the verdict shown on the card next to it — matching today by coincidence, and silently free to disagree after the next band change.
suggested fix: colour off the engine's band once classifyReading/the Reef Chemistry Engine exists; fold into TW-002's classifier census either way.
confidence: high

### wizard-dose-auditor / 2026-08-14 / status-of-priors
TW-003 — UNCHANGED, reproduced live: both refusal shapes throw TypeError at ErrorBoundary.jsx:279 (a.current.value unguarded; sibling read :262 guards correctly).
TW-005 — UNCHANGED (engine signatures alkalinity.js:429/calcium.js:199 take no Mg/sibling channel; same 3 test failures today).
TW-009 — UNCHANGED (refusals.test.js both cases fail identically).
TW-012 — UNCHANGED, WIDENED: closure-built next state + no disabled-while-saving confirmed on BOTH dose apply (App.jsx:425-431, DoseChangeSheet.jsx:63) and correction start (App.jsx:717-737, CorrectionPanel).
TW-006 — UNCHANGED (multiday-plan-parity: expected 8.4 to be 7.5).
§26 position-is-last-reading — implemented and verified from the wizard side too (17/17; wizard reads a.current.value, never fitted — no new staleness).
Branch table highlights: refusal branches crash the UI (TW-003) or mis-word (TW-009); Mg gate + precipitation guard branches structurally unreachable (TW-005); <2-days-apart readings get a confident "hold" instead of a refusal (parity test still failing); abandonment/back-navigation traced clean (assessments recomputed fresh via useMemo, sheet state unmounts cleanly).

### wizard-dose-auditor / 2026-08-14 / S2
what: In a staged multi-day plan, "Step to X" and "Go to Y" both open the same already-mounted DoseChangeSheet; the amount field is seeded once (useState) and never re-syncs to a changed recommended prop. Tap one shortcut, then the other without closing the sheet → the field keeps the FIRST figure while the button just pressed claims the second.
evidence: DoseChangeSheet.jsx:17 (useState seeded once); ErrorBoundary.jsx:209,212 → :249 (same unkeyed sheet instance, React reuses it). REPRODUCED LIVE (jsdom + react-dom, real components, no mocks): staged plan [7.5, 8.4, 9.9]; "Step to 7.50" → field 7.5; "Go to 9.90" with sheet open → field still 7.5. General case also confirmed: recommended changing 9.9→14.2 while sheet open leaves input at 9.9.
impact: In plain terms: consider the small step, change your mind and tap "go straight to the full dose" — the entry box quietly keeps the small number, and unless you notice, the dose you record is not the one you just asked for.
suggested fix: key DoseChangeSheet off prefill/recommended (or useEffect resync when not hand-edited) so the amount always reflects the last selection.
confidence: high

### dose-parity-checker / 2026-08-14 / status-of-priors
All 6 previously-documented parity violations UNCHANGED, re-verified by content: no rail check (TW-004), Mg gate unreachable (TW-005), plan[0] vs recommendedDose (TW-006), confident hold on <2-day readings, 6.9/7.0 dKH alert-low boundary pair. One count drift vs 13 Aug (parity 38/7 → 39/6) fully explained by fd82363 (magnesium rail 100→25 fix) — a genuine fix whose spec assertion now passes, not a weakened test. Suite extended: 8 files/45 tests → 11 files/61 tests (53 pass / 8 fail, the 6 prior + 2 new documented violations). Orchestrator reconciled full-suite numbers exactly: 414→430 tests (+16), 62→64 fail (+2 documented), 352→366 pass — no unexplained drift anywhere.

### dose-parity-checker / 2026-08-14 / S1
what: doseStatus's top-level `target` field carries two incompatible physical quantities under one name — and the dose-rate reading (mL/day) is the MAJORITY: "suggested" (state.js:361 target: a.maintenanceDose), "settling"/"due"/"worked" (state.js:294,300,315 target: plan.target) are all mL/day; only "emergency" (state.js:205 target: mid) is a concentration.
evidence: tests/parity/dose-status-target-field-semantics.test.js — every branch driven through the real function; state.js:314's own prose labels the same field "mL/day" nearby. No live consumer reads the field generically today (checked — only correctionPlan.target, a different object, is rendered): latent, honestly reported as such.
impact: In plain terms: the same labelled box sometimes holds "the level you're aiming for" and sometimes "how fast you're dosing"; nothing breaks today, and that's exactly the danger — the day a future change reads it generically, a dose rate renders as "8.4 dKH" and no test would have failed. Now one does.
suggested fix: split the field (targetDose/targetLevel) per §15's one-word-one-concept applied to the internal contract.
confidence: high

### dose-parity-checker / 2026-08-14 / S2
what: StabilityStrip's verdict comes from a spread statistic (p05/p95 of a window), not the last reading — live-reproduced showing the strip render its "outside" colour while the same parameter's current reading is squarely in band per every other surface.
evidence: tests/parity/stability-strip-vs-param-status.test.js — real component via @testing-library/react: last reading 8.5 (band 8.2-8.8, paramStatus "ok") + a 12-day-old 7.9 in the window → strip renders hardcoded "#A2621B" excursion colour. Agreement-by-coincidence pins added for the degenerate no-spread case.
impact: In plain terms: the spread bar can say "running out of range" in amber right next to a badge saying you're fine, same tank, same moment (and the strip appears again in the Briefing feed). Executable confirmation of Wave A's 13th-classifier finding, now permanently pinned.
suggested fix: colour off the last-reading band position (§26); keep the spread for consistency display only.
confidence: high

### dose-parity-checker / 2026-08-14 / S3
what: POSITIVE — all three engines genuinely agree that band position derives from the last reading, proven cross-engine by construction (identical relative band-position shape scaled per element), not just per-engine fixtures.
evidence: tests/parity/position-is-last-reading-cross-engine.test.js, 3/3 pass. Note in-file: a one-band-width outlier splits the engines' fits (calcium stays in-band); three band-widths needed for unanimity — informative about fit sensitivity, documented in comments.
impact: Permanent regression guard: a future edit reintroducing fitted-value position in exactly one engine now fails a cross-engine test, not only a per-engine fixture.
confidence: high
