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
