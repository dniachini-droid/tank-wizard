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
