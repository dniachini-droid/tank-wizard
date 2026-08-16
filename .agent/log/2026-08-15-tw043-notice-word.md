# Run log — TW-043 ("notice" is the one word)

run: 2026-08-15-tw043-notice-word
item: TW-043 [approved]
branch: claude/four-backlog-items-o18y6d-tw043

## What happened

Four user-facing strings brought to §15's registry word, **notice**:

- `Dashboard.jsx:620` "Worth knowing about {parameter}" → "Notices for {parameter}"
- `Setup.jsx:552` InfoBlock title "Hidden notes" → "Hidden notices"
- `Setup.jsx:555` summary "{n} note{s} hidden" → "{n} notice{s} hidden"
- `Setup.jsx:559` "Notes you hide will be listed here" → "Notices you hide…"
- `App.jsx:781` toast "Hidden notes restored" → "Hidden notices restored" —
  found by the repo-wide grep; it is the toast for Setup's "Show all again"
  button, i.e. the same hidden-notices flow, same banned noun.

NOT touched, per the item: the hide-confirmation sentence ("notification")
lands with TW-031 or the string lands twice; `finding`/`claim`/`dose state`
are internal code names §20 exempts; "Got it — hide this" carries no noun
(recorded non-violation). The `aurelia-skin.css:70` section comment
"--- Hidden notes ---" is a code comment, not a user-facing word — left.

Test first: `src/test/spec/terminology/notice-word.test.js`, proven red
(5 failed / 1 passed) before the strings moved, 7/7 green after.

## Evidence

- Before: `npx vitest run src/test/spec/terminology/notice-word.test.js` →
  5 failed | 1 passed.
- After: 7 passed. Full suite: 64 failed | 481 passed — the 64 are the
  pre-existing labelled SPEC VIOLATION reds, count unchanged from baseline.
- `npm run verify` → ALL BLOCKING CHECKS PASSED.

## In plain terms

The app called the same thing a note, a notification and something worth
knowing about, depending on the screen. It is a notice on all of them now —
the dashboard list, the hidden list in Setup, and the little confirmation
that pops up when you bring them all back.
