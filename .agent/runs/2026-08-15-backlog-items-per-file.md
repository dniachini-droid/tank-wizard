run: 2026-08-15-backlog-items-per-file
routine: owner instruction — promote TW-042 and restructure the backlog
started: 2026-08-15
status: complete
last completed step: 56 item files + 11 notes written, backlog.md deleted, docs and routines repointed, both duplicate ids resolved, npm run verify green
next step: none — commit, push and PR in the same breath as this update. Dan reviews and merges (or not).
in-flight: nothing
branch: claude/backlog-items-per-file-jqkiub (harness-designated)
uncommitted work: no

## STEP ZERO

Scanned `.agent/runs/` — eight files, all `status: complete`. No dead run, no
recovery, normal start.

## What Dan asked for and what shipped

TW-042 promoted and implemented in the same change. `.agent/backlog.md` is
deleted; the backlog is `.agent/items/`, one file per item named by TW number,
with `notes/` for the free-standing triage comments. `npm run backlog` renders
the ordered view to stdout and writes no file, so there is nothing to commit
and nothing to conflict over. Full contract in `.agent/items/README.md`.

**Deleted, not generated-and-committed** — the question Dan asked to be
answered explicitly. A committed regenerated `backlog.md` is a shared singleton
again: every filing rewrites the whole file at the same positions, so the
conflicts return, plus a new failure mode where the copy silently disagrees
with the folder. Same reasoning as §4 option 2 of the run-state proposal, same
verdict.

**Ordering.** `order:` field per file, spaced by 10, ties broken by id. Top =
next now means lowest `order:` among `status: approved`. Two runs that pick the
same number lose only the arbitrary tie-break, not their work.

**The `[approved]` gate.** `npm run backlog -- --approved` prints only the
implementable items, in order — one command, not fifty files. The gate is
`status: approved`; `backlog:check` refuses a file that claims it without the
`[approved]` tag, so the two cannot drift.

**Both duplicate ids resolved**, since filenames force it. The later of each
pair moved: the magnesium correction-rail item TW-016 → **TW-051**, magnesium's
off-centre band TW-026 → **TW-052**. Evidence for which was later is in
`.agent/items/README.md`; both new files carry `renumbered-from:`.

## Counts — before and after

| | before | after |
|---|---|---|
| items | 55 | 56 |
| approved | 9 | 9 |
| needs Dan's approval | 34 | 34 |
| blocked | 3 | 3 |
| done | 9 | 10 |
| notes (HTML comments) | 11 | 11 |
| distinct ids | 53 | 56 |

55 → 56 is TW-053, filed by this run (below). TW-042 moved from needs-approval
to done, so the two open sections come out level. 53 → 56 distinct ids is the
two collisions splitting apart plus TW-053.

## Verification

- `node scripts/backlog.mjs > rendered.md` and `diff` against the deleted
  `backlog.md` (from `git show HEAD:.agent/backlog.md`): the only differences
  are the regenerated header, the two renumberings and their three in-body
  references, TW-042's promotion and closure, TW-053, and three cosmetic blank
  lines the old file had doubled up. Every other byte — every item body, every
  Done and Blocked entry, every note — is unchanged.
- `npm run verify` — **ALL BLOCKING CHECKS PASSED**, 41 steps including the new
  blocking `backlog` check. `deadcode` and `csscheck` still fail advisory: the
  pre-existing TW-022 and TW-023, untouched.
- `npm test` — 64 failed / 474 passed (538). Measured on this tree **and** on
  the stashed baseline: byte-identical counts. The four test files this change
  touches are comment-only edits (`git diff --stat`: 4 files, 4 insertions,
  4 deletions).
- `npm run lint` — **does not exist** (TW-024, open). Could not be run, and is
  not reported as passing.

## Filed, not fixed

`TW-053` — eleven `.agent/backlog.md` paths in `docs/spec/reef-chemistry.md`,
`docs/spec/wizard-states.md` and `docs/journeys/journey-5-phosphate-nitrate.md`
still point at the deleted file. AGENTS.md rule 1 forbids an agent editing
canon, so they are filed rather than fixed. Every one names an id that still
resolves; only the path is stale, and no reference points at the wrong item.

## Left alone deliberately

Run transcripts — `.agent/log/**`, `.agent/runs/**`, `.agent/HANDOVER-2026-08-13.md`
— keep the ids and paths they were written with. They are accounts of what a
run saw at the time and rewriting them would falsify the record; this is the
same call §8 of the run-state proposal made about its own dangling references.
The mapping table in `.agent/items/README.md` is what resolves them, and
`grep -rn TW-016 .agent/items/` finds TW-051 through its `renumbered-from:`
line. Everywhere else in the tree — AGENTS.md, six routines, THE-PLAN-v3.md,
START-HERE.md, three agent briefs, the phase reports, needs-dan, four test
comments, `scripts/verify/run.mjs` — was repointed.
