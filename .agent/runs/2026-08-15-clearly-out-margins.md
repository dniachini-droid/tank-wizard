run: 2026-08-15-clearly-out-margins
routine: owner decision — needs-dan item 5, "out" vs "clearly out"
started: 2026-08-15
status: complete
last completed step: spec §27 written, item 5 closed, TW-047 filed, all gates green
next step: none — commit, push and PR happen in the same breath as this update. Dan reviews and merges (or not).
in-flight: nothing
branch: claude/reef-chemistry-clearly-out-zwjte5 (harness-designated)
uncommitted work: no

## The decision implemented

Dan, 15 Aug, closing `.agent/needs-dan.md` item 5, authorising the spec edit:

- **Out** = past the band edge by any amount. 455 ppm against 400–450 is out.
  No margin, no tolerance.
- **Clearly out** = past the edge by a fixed margin: calcium 50 ppm,
  magnesium 50 ppm, alkalinity 0.5 dKH. Fixed figures, not scaled to band width.
- The three get their own named margin constants. Not the trend constants, not
  the kit noise floors.

Recorded as `docs/spec/reef-chemistry.md` §27; figures also in §16's
universal-constants table; §26's flag now points at §27 as settled.

## Baseline, before any change

    node tests/legacy-port/golden.js
      golden: 5940 cases unchanged (3a782222dbce41c5)

    npx vitest run
      Tests  64 failed | 408 passed (472)

The 64 are pre-existing and pre-labelled — see `scripts/verify/run.mjs:88-100`.

## Steps

1. [x] failing test written and shown failing against unchanged code — 22 of 47
2. [x] three named margin constants declared, `clearlyOut` in all three engines
       pointed at them
3. [x] test green — 47 of 47
4. [x] golden audited by element and direction. **No regeneration needed**: the
       digest is unchanged because the corpus cannot reach the branch (at most
       one logged correction; the margin needs two). Re-swept with two
       corrections, 70 of 2,970 rows change — full table in the log. Blind spot
       filed as TW-047.
5. [x] `npm run verify` — ALL BLOCKING CHECKS PASSED. `npx vitest run` — 519
       tests, the same 64 failures as baseline, name for name; none new.
6. [x] spec §27 written, needs-dan item 5 closed and recorded under Decisions
7. [x] commit, push, PR

## Post-push: main merged in

`origin/main` moved after this branch was pushed (PR #50 went un-mergeable).
Merged main in and resolved, 2026-08-15.

- **One conflict, `.agent/needs-dan.md`, Decisions section.** Both sides added
  an entry dated 2026-08-15 at the top. **Every entry kept, none rewritten**:
  §27 first as "(latest)", then main's colour reversal re-labelled "(earlier
  the same day)" — it was "(latest)" against main and no longer is — then the
  four-approvals entry, keeping main's "superseded in part" header and its
  blockquote. Nothing else in the file was touched by the resolution.
- `.agent/backlog.md` auto-merged: main's TW-045 approval and TW-046 closure
  sit alongside TW-047, which is still untagged under "Needs Dan's approval".
- Main brought no source changes — `.agent/backlog.md`, `.agent/needs-dan.md`
  and a new `docs/journeys/journey-5-phosphate-nitrate.md` only. Open item 9 is
  now resolved as option (a) on main; §27 does not touch it either way.
- Re-verified on the merged tree: `npm run verify` — ALL BLOCKING CHECKS
  PASSED, golden 5,940 cases unchanged at `3a782222dbce41c5`.

Not merged. That stays Dan's.

## Full account

`.agent/log/2026-08-15-clearly-out-margins.md`.
