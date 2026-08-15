# Run log — 2026-08-15-backlog-items-per-file

Owner instruction, not a numbered routine: promote TW-042 and restructure
`.agent/backlog.md`, which had conflicted three times in one evening. No
subagents — the work is one mechanical migration plus its checker, and
splitting it across agents would have put two writers on the same files.

## STEP ZERO

`.agent/runs/` scanned: eight files, all `status: complete`. No dead run, no
recovery. Own run file created before the first edit.

## What was read first

`.agent/proposals/run-state-restructure.md` in full, as instructed. The traps
it documents and how each was handled here:

- §3, option B (one shared append-only file) is measured as **not working** —
  both sides append at the same position and git conflicts anyway. So the fix
  is not "append instead of rewrite"; it is one file per thing.
- §4 option 2, a committed derived index, is the trap it warns about most
  plainly: a second copy of the state conflicts exactly as the original did.
  This is why `npm run backlog` writes to **stdout only** — there is no path to
  commit by accident and nothing to `.gitignore`.
- §2's real prize is correctness, not merge relief: a shared field cannot keep
  a promise once runs overlap. The backlog's equivalent is *order* — the old
  file's "top = next" lived only in line position, which is exactly what a
  merge scrambles. `order:` per file makes it explicit.
- §8's "left alone deliberately" precedent — historical prose keeps the paths
  it was written with — is followed here for `.agent/log/`, `.agent/runs/` and
  the 13 August handover.

## The migration

1. Parsed `backlog.md` (1,944 lines) into blocks. 55 items, 11 free-standing
   HTML comments, four sections. No item body contains a blank line, and every
   column-0 line is a heading, an item, a comment or the preamble — so the
   split is unambiguous rather than heuristic.
2. One file per item, `.agent/items/TW-NNN.md`: `id` / `title` / `status` /
   `tags` / `order` header, blank line, then the body verbatim, dedented by the
   six spaces the list format required. Notes became
   `.agent/items/notes/<date>-<slug>.md` with the same `status:`/`order:` so
   they render where they sat.
3. `scripts/backlog.mjs` renders the view and, with `--check`, validates the
   folder. Wired into `npm run verify` as a **blocking** step: the folder
   replaced a hand-written list, and the checker is what stops it rotting.
4. `.agent/backlog.md` deleted (`git rm`).

## Round-trip — how "full text intact" was proved

Not by reading it. The renderer regenerates the old file from the folder, and
`diff` against `git show HEAD:.agent/backlog.md` returns only:

- the regenerated header (3 lines, says where the source of truth is now)
- `TW-016` → `TW-051` and `TW-026` → `TW-052` on their two item lines
- three in-body references to the renumbered rail item
- TW-042 moved from "Needs Dan's approval" to Done with its closure note
- TW-053, filed by this run
- three cosmetic blank lines the old file had doubled up

Every other byte of all four sections, Done and Blocked included, is identical.

## The two duplicate ids

Filenames force the issue — two items cannot share a path. The **later** of
each pair moved, which is also the later of each pair in file position, so
both readings of "later" agree:

- **TW-016 → TW-051** (magnesium correction rail, closed). The 13 August
  consistency sweep promoted exactly 15 items and its log names them: TW-002
  through TW-016, the fifteenth being "'drifting' meaning three incompatible
  things". The rail item was minted afterwards, out of Dan's same-day
  decisions, onto a number the sweep had already used.
- **TW-026 → TW-052** (magnesium's off-centre band). Recorded directly in
  `.agent/log/2026-08-14-phase6-bugs.md`: the journey-4b `doseStatus` item
  "already exists … as of this run's start", and bug 4 "minted its number
  against a backlog that did not yet have the other".

Two earlier runs found these collisions and deliberately left them, both
saying the same thing — renumbering is Dan's call because the ids are cited
from run notes and PRs. Dan has now made that call, and the citation problem is
handled by `renumbered-from:` in each moved file plus the mapping table in
`.agent/items/README.md`.

## Cross-references repointed

`AGENTS.md` (item format, handoff list, rule 11's exemption, recovery step 3);
routines `01`, `13`, `14`, `15`, `16`, `19`; `THE-PLAN-v3.md` rule 4 and its
outstanding-decisions list; `START-HERE.md`; `.claude/agents/planner.md`,
`implementer.md`, `triage-analyst.md`; `.agent/needs-dan.md`,
`phase5-gate.md`, `phase6-bugs.md`, `spec-reconciliation.md`,
`engine-decision.md`, `target-terminology-audit.md`; four test-file header
comments; `scripts/verify/run.mjs`. The proposal that started this got a dated
line in §6 recording that its "it has not actually hurt yet" prediction expired.

Not repointed, on purpose: run transcripts (falsifying the record), and eleven
paths in `docs/spec/` and `docs/journeys/` (AGENTS.md rule 1 — filed as
TW-053).

## Verification

- `npm run verify` — **ALL BLOCKING CHECKS PASSED** (41 steps, including the
  new blocking `backlog` check at 79ms). Advisory `deadcode` and `csscheck`
  still fail: pre-existing TW-022/TW-023, untouched by this change.
- `node scripts/backlog.mjs --check` — `56 items (9 approved for
  implementation, 34 needs dan's approval, 3 blocked, 10 done), 11 notes,
  0 problems`.
- `npm test` — 64 failed / 474 passed (538), identical to the stashed baseline
  measured on the same tree. The only test edits are four comment lines.
- `npm run lint` — does not exist (TW-024). Not run, not reported as passing.

## Counts

55 items before, 56 after (+TW-053). 9 approved before and after; 34
needs-approval before and after (TW-042 out, TW-053 in); 3 blocked; 9 done
before, 10 after (+TW-042). 11 notes in, 11 out. Distinct ids 53 → 56.
