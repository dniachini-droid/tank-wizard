# 2026-08-13 — Tank Wizard overnight (build cycle)

## Needs you (N)
TW-021 Ca:alk ratio: spec says 7.15, code has 6.77 (~5% systematic calcium under-dosing on the app's own default settings) — spec-vs-product-reality decision needed, top of `.agent/needs-dan.md` Open. Needed before TW-021 can be `[approved][chem]`.
`reef-chemistry.md` §2 (lines 43, 45) still says "water volume" — leftover from your 2026-08-13 terminology decision that "net volume" wins. Second item in needs-dan.md Open.
TW-016 (magnesium rail) and TW-021 (Ca:alk ratio) both need an `[approved][chem]` tag from you before an implementer can touch them — your 50 ppm/24h magnesium decision is already recorded, just not tagged onto the backlog item yet.

## Shipped (branches awaiting your merge)
PR #3 — claude/dazzling-faraday-9zbsv7: TW-001 (net-volume refuse-and-name at 3 call sites + 1 render guard) plus 5 same-night fixes from tonight's audit — closed a reachable negative-volume bug via backup restore, fixed a stale dose amount that could cross from one element to another in the Dosing Wizard, fixed a confirmation popup that could self-close before you saw it, fixed Setup's Volume field silently reverting an unsaved edit, plus 4 cosmetic cleanups. No chemistry constant, formula, or threshold touched (checked twice). https://github.com/dniachini-droid/tank-wizard/pull/3

## Found
**Most dangerous — negative volume renders live.** A hand-edited or corrupted backup file could carry a negative `volumeL` straight into your live settings unvalidated (Setup's own volume field is protected, `restoreBackup` wasn't) — Insights would then show a negative "grams of skeleton grown" figure instead of refusing. Fixed tonight.
**Second — wrong element gets the wrong dose.** Switching elements mid-wizard while a dose-change sheet was open left the previous element's recommended mL amount on screen; tapping Record would have logged it under the new element. Fixed tonight.
**Still open — real data loss on restore.** `restoreBackup`'s dedup only keys on param+date, not time — a genuine second same-day reading (e.g. a retest) silently vanishes rather than being added, with no warning. Filed as TW-019; needs a design decision on the right dedup key before an implementer can touch it, so left alone tonight on purpose.
**Still open — magnesium rail still wrong both ways.** `correction.js` recommends 2x over your new 50 ppm/24h cap; `safe-rate.js` runs the live wizard at half of it. Confirmed live tonight. Blocked on your `[approved]` tag on TW-016.

## Health
tests: 34 failed files / 66 failed tests / 210 passed (276 total) — every failure is either a confirmed-but-deliberately-deferred finding with its own permanent regression test, or pre-existing and unrelated to tonight; none is broken infrastructure. Verified twice (two independent gate passes), byte-identical both times.
coverage: not measured — `@vitest/coverage-v8` isn't installed and no `[approved][deps]` item authorizes adding it.
bundle: main JS 286.4 kB gzip (budget 180 kB) — over budget, pre-existing, +0.2 kB from tonight (not the cause).
build: pass.
audit: 23 raw findings → adjudicator independently reproduced all 9 S1/S2 (0 downgraded, 0 false positives) → 5 fixed same-night → 6 new backlog items filed (TW-019 through TW-024) → 1 escalated to you.

## Didn't finish
One fixer round needed a retry: the integrator caught a tautological regression test on the first gate pass (it hardcoded the fix's own logic instead of exercising the real app, so it would have passed even with the bug reintroduced) and rejected the branch. The fixer rewrote it to render the app end-to-end; the integrator independently re-verified and passed it on the second gate. This is the safety net working as designed, not a stall — flagging it because it's exactly the class of mistake that's easy to wave through if nobody checks.

## Cost
not tracked this run
