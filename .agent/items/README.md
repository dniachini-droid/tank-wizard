# `.agent/items/` — the backlog, one file per item

`.agent/backlog.md` is **deleted**. The backlog is this folder: one file per
item, named by its TW number, plus `notes/` for the triage notes that sit
between items. `npm run backlog` renders the ordered view on demand.

**The one rule: an item lives in exactly one file, and a run edits only the
files for the items it is actually touching.** Filing a new item creates a new
path, so two runs filing different items never write the same file and cannot
conflict. This is the same rule, for the same reason, as `.agent/runs/` — see
`.agent/proposals/run-state-restructure.md`, which is the argument this change
applies a second time.

## Why deleted rather than generated-and-committed

The brief allowed either. A committed `backlog.md` regenerated from this folder
would be a shared singleton again: every run that files an item regenerates the
whole file, every regeneration rewrites the same lines at the same positions,
and the conflicts come straight back — with a new failure mode on top, because
a stale committed copy can silently disagree with the folder it claims to
mirror. That is §4 option 2 of the run-state proposal, and the reason it was
turned down there is the reason it is turned down here.

So the view is **stdout only**. `npm run backlog` prints it; nothing writes it
to a path; there is no file to commit by accident and nothing to `.gitignore`.

## The file format

```
id: TW-001
title: Add net-volume field; every dose calc uses net, not gross
status: approved
tags: [approved][chem]
order: 10

why: dosing on gross 77 L overdoses by the displacement fraction
spec: docs/spec/reef-chemistry.md#17-net-volume
owner: implementer
```

Header lines, one blank line, then the item body exactly as it read in
`backlog.md` — `why:` / `spec:` / `repro:` / `owner:` and whatever else the
item carries. The body is prose, not schema; nothing parses it.

| field | meaning |
|---|---|
| `id` | `TW-NNN`. **Must equal the filename.** The checker enforces it. |
| `title` | the one-line summary that followed the id on the old item line |
| `status` | `approved` · `needs-approval` · `blocked` · `done` — the four old sections |
| `tags` | the old bracket tags verbatim, e.g. `[approved][chem]`; `—` if none |
| `order` | position in the queue; see below |
| `renumbered-from` | only on the two items whose ids collided (below) |

`status: done` renders as `- [x]`; everything else renders as `- [ ]`.

## Ordering — explicit, not line position

The old file said *top = next*, and meant it literally: order was line order, so
it lived nowhere except the arrangement of the file, which is exactly what a
merge scrambles. Order now lives in each item's `order:` field. Lower is
sooner. The view sorts by it.

Numbers are spaced by **10**, so an item can be inserted between two others by
picking a number in the gap — no other file is touched, so no other file can
conflict. Two runs that pick the same number are not an error and not a
conflict: ties break by id, deterministically, and both runs' files are intact.
Only the arbitrary tie-break is lost, which is what "same priority" already
meant.

Sections are `status:`, not position, so promoting an item is a one-word edit
to one file. The order value carries across unchanged — a promoted item keeps
its place relative to the rest.

## "What may I implement?" — one command, not fifty files

```
npm run backlog -- --approved
```

prints only the `[approved]` items, in order; the first one is next. The gate
is `status: approved`, and the checker refuses any file that claims it without
also carrying the `[approved]` tag, so the two cannot drift apart. Machine
answer, if you want just the ids:

```
grep -l '^status: approved' .agent/items/TW-*.md
```

Note the gate is the `status:` field, not the tag alone: TW-021 and TW-042 are
`done` and still carry `[approved]` from when they were live, and neither is
implementable now.

## Cross-references

Items cite each other by id in their prose, as they always did. An id now also
resolves to a path — `TW-037` is `.agent/items/TW-037.md`. `npm run
backlog:check` fails if any item or note cites a `TW-` id with no file, so a
reference cannot rot unnoticed.

## The two renumbered ids

`backlog.md` had minted two numbers twice. File names force the issue — two
items cannot share a path — so both were resolved in the migration. In each
case the **later** of the pair moved:

| was | is now | why this one moved |
|---|---|---|
| `TW-016` magnesium correction rail (done) | **`TW-051`** | `.agent/log/2026-08-13-consistency-sweep.md` promoted exactly 15 items, TW-002…TW-016, the last being the "drifting means three things" item. The rail item was minted afterwards, from Dan's same-day decisions, onto a number already taken. |
| `TW-026` magnesium's off-centre band | **`TW-052`** | `.agent/log/2026-08-14-phase6-bugs.md`: the journey-4b `doseStatus` item "already exists … as of this run's start"; bug 4 "minted its number against a backlog that did not yet have the other". |

Both moved items carry `renumbered-from:`, so `grep -rn TW-016 .agent/items/`
still finds TW-051 and says why. Live references across the tree were updated.
**Run logs under `.agent/log/` and `.agent/runs/` were not** — they are
transcripts of what a run saw at the time, and rewriting them would falsify the
record, the same call §8 of the run-state proposal made about its own dangling
references. Two of them (`2026-08-14-phase6-bugs.md`,
`2026-08-14-reef-chemistry-engine-canon.md`) flag the collisions as open and
deliberately un-renumbered; this table is the resolution they were waiting for.

## `notes/`

The old file carried eleven free-standing HTML comments — triage records,
promotion notes, the "TW-046 is closed" explanation. They belong to groups of
items rather than to any one item, so they are files of their own under
`notes/`, with the body verbatim and a header saying which items they concern:

```
note: 2026-08-14-phase-8b-promotion
status: approved
about: TW-026, TW-027, TW-028
date: 2026-08-14
order: 20
```

Same `status:` and `order:` fields as an item, so a note renders in the section
and at the position it had in `backlog.md`. Name new ones `<date>-<slug>` —
dated names are what keeps two runs from picking the same path.

## Filing, promoting, closing

- **File an item** (triage-analyst): create `TW-NNN.md` with
  `status: needs-approval`, an unused id (highest existing + 1) and an `order:`
  in the gap where it belongs. Touch no other file.
- **Promote** (Dan): set `status: approved` and add `[approved]` to `tags:`.
  One file, two lines.
- **Close**: set `status: done`, keep the full text, and add the closure note
  above the body — see `TW-046.md` and `TW-042.md` for the shape. AGENTS.md
  rule 4's spirit: the evidence is why the decision looks reasoned rather than
  arbitrary, so it is never deleted.
- **Never** hand-write a combined list back into `.agent/`. That is the file
  this change removed.

## Checking

`npm run backlog:check` runs as a blocking step in `npm run verify`. It
enforces: filename matches `id:`, required fields present, `status:` is one of
the four, `order:` is a number, `status: approved` implies the `[approved]`
tag, no empty bodies, and every `TW-` cross-reference resolves to a file. It
prints the item count by section, which is the number to quote in a run log.

## Migration record — 2026-08-15

55 items in, 55 items out; 11 notes in, 11 notes out. Verified by rendering
`npm run backlog` and diffing against the deleted `backlog.md`: the only
differences are the intended ones — the regenerated header, the two
renumberings and their three in-body references, TW-042's promotion and
closure, and three cosmetic blank lines the old file had doubled up. Every
other byte, in every section including Done and Blocked, is unchanged.
