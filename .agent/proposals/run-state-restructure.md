# Proposal — restructure `run-state.md` so parallel runs append instead of rewrite

Status: **approved by Dan and implemented**, 2026-08-14. Raised after resolving
the same conflict four times in one pass (PRs #37, #38, #40, #41). Option A was
taken as recommended in §7: one file per run under `.agent/runs/`,
`run-state.md` deleted, STEP ZERO now a directory scan. What shipped is recorded
in §8 at the foot of this file.

---

## 1. The evidence that prompted this

Merging current `main` into the four open PR branches produced **one conflicted
file on all four, and only one**:

| PR | branch | conflicted files |
|----|--------|------------------|
| #37 | `claude/hopeful-bohr-yc58vu` | `.agent/run-state.md` |
| #38 | `claude/stoic-carson-i9416q` | `.agent/run-state.md` |
| #40 | `claude/busy-gates-xs4f5v` | `.agent/run-state.md` |
| #41 | `claude/2026-08-14-consistency-sweep` | `.agent/run-state.md` |

Everything else merged itself, including `.agent/backlog.md` (which four runs had
all edited) and every `.agent/log/<run-id>.md`. **The log folder — one file per
run — has never conflicted.** That is the experiment already run inside this
repo, and it came out in favour of the change proposed here.

`THE-PLAN-v3.md` rule 4 already records the diagnosis — *"two branches that both
write `run-state.md` will conflict. Serialise, or accept a resolution pass."*
This proposes the third option that rule doesn't list: make the file shape not
conflict, so neither serialising nor a resolution pass is needed.

## 2. What is actually wrong (not just merge noise)

`run-state.md` is one singleton file doing two jobs with opposite access
patterns:

| | job A — resume pointer | job B — run record |
|---|---|---|
| what | `status`, `next step`, `in-flight`, `uncommitted work` | what the run produced, notes for whoever runs next |
| lifetime | current run only | forever |
| access | **rewritten** constantly (AGENTS.md: before *and* after every step) | **appended**, never revised |
| owner | exactly one run | every run that ever ran |

Job A is per-run and mutable. Job B is shared and append-only. They are welded
into one file, so every run doing job A necessarily clobbers everyone else's job
B. That is exactly what each of the four conflicts was: the branch had replaced
the whole file with its own header, deleting the durability run's record, and
resolution meant hand-reassembling both by hand.

The workarounds already in the tree show the strain — two runs gave up on the
format and appended their record as an **HTML comment** under someone else's
`run:` header (`position-last-reading`, and the engine-decision branch), each
explaining at length why it was *not* writing a proper header. When contributors
start hiding entries in comments to avoid touching a field, the format is the
problem.

### The part that is a correctness bug, not an annoyance

STEP ZERO in six routines asks one question: *did the previous run die?* It
answers it by reading a single `status:` field.

With concurrent runs that field is unreliable in a way that fails silently. If
run A is `in-progress` and dies, and run B then writes `status: complete` for
itself, **run A's interrupted state is destroyed.** The next run reads
`complete`, takes the normal-start path, and never runs the recovery steps —
the open branch, the uncommitted edit and the half-done work in AGENTS.md's
recovery list are simply never looked for.

The checkpoint contract's core promise is *"the system must never lose work."*
One `status` field shared by concurrent runs cannot keep that promise, however
the merges are resolved. A conflict at least stops and asks; this loses quietly.

## 3. The two options, assessed

The brief suggested one file per run **or** an append-only log. These are not
equivalent — I tested the second before proposing it.

### Option B — one shared append-only file: **rejected, it does not work**

The intuition is that if every run only ever appends, git can take both sides.
It cannot. Both runs append at the same position — end of file — so git sees two
different insertions at one point and conflicts. Measured, not assumed:

```
$ # two branches, each appending a different entry to the end of one file
$ git merge runA
Auto-merging log.md
CONFLICT (content): Merge conflict in log.md
```

Append-only removes the *destructive* part of the problem (no entry is lost, and
resolution is mechanical: keep both, in order). It does **not** remove the
conflict. Every concurrent pair still stops for a human. And it leaves the
job-A/job-B conflation — and therefore the silent-recovery bug in §2 — fully
intact, because there is still one `status` field.

Worth having as a fallback if §4 is judged too large a change; not worth it as
the answer.

### Option A — one file per run: **recommended**

Two runs writing two different filenames produce no conflict at all, at any
volume of concurrency, with no resolution pass. This is precisely what
`.agent/log/` already does and why it has never conflicted.

## 4. The recommended shape

```
.agent/
  runs/
    2026-08-14-durability-remainder.md      # one file per run, owned by that run
    2026-08-14-failure-replay.md
    2026-08-14-real-history-replay.md
    2026-08-14-engine-decision.md
    2026-08-14-consistency-sweep.md
  log/
    <run-id>.md                             # unchanged, already works this way
```

`.agent/runs/<run-id>.md` keeps today's fields verbatim — no new format to learn,
and the run-id already matches the log filename:

```
run: 2026-08-14-consistency-sweep
routine: routines/05-consistency-sweep.md
started: 2026-08-14T17:20:00Z
status: complete
last completed step: ...
next step: ...
in-flight: none
branch: claude/2026-08-14-consistency-sweep
uncommitted work: no
```

**One rule replaces the ambiguity: a run writes only its own file, and never
edits another run's.** That single sentence is what makes the conflict
structurally impossible rather than merely unlikely.

### STEP ZERO becomes a scan, and gets more correct

Today: read one file, trust one `status`. Proposed:

> Read every file in `.agent/runs/`. Any with `status: in-progress` or
> `interrupted` **and a run-id that is not yours** is a dead run — recover it per
> the checkpoint contract, then create your own file and proceed. Several may
> need recovering; handle each.

This is strictly stronger than today. It detects *every* abandoned run rather
than only the most recent writer, which is the §2 bug fixed as a side effect —
and it is the real argument for the change. The merge relief is the smaller
prize.

### `run-state.md` itself

Do not keep it as a duplicate of the per-run files — a second copy of `status`
is the same bug again. Two honest choices:

1. **Delete it**, leaving a one-line tombstone pointing at `.agent/runs/`.
   Cleanest. Requires updating the six STEP ZERO routines in the same change.
2. **Keep the name as a derived index** — a table of run-id, status, branch,
   regenerated from `.agent/runs/` rather than hand-written. Convenient for a
   human skim, but it is a generated file that will conflict whenever two runs
   regenerate it, so it must be `.gitignore`d or rebuilt on read, never
   committed. If that discipline looks fragile, take option 1.

I would take **option 1**. The index is a convenience the directory listing
already provides, and any committed derived file re-creates the problem.

## 5. Migration

Small and mechanical; no application code, no spec, no chemistry.

1. Split the current `run-state.md` into one `.agent/runs/<run-id>.md` per record
   it contains. Today that is the durability-remainder record plus the two
   entries currently buried in HTML comments — which become ordinary files with
   ordinary headers, and stop being special cases.
2. Update the checkpoint contract in `AGENTS.md` §"The run-state file" — the
   field list is unchanged, the location and the one-file-per-run rule are new.
3. Update STEP ZERO in the six routines that read it: `01-build-cycle`,
   `02-audit-sweep`, `03-attack-night`, `04-weekly-review`, `05-consistency-sweep`,
   `17-failure-replay`. Routines 15, 16, 18 and 19 mention the file in passing
   and need only a path change.
4. Amend `THE-PLAN-v3.md` rule 4 — the "serialise, or accept a resolution pass"
   trade-off no longer applies to this file.
5. `START-HERE.md` line 26 mentions run-state in the `.agent/` inventory.

Best done as **one PR, merged when no other run is mid-flight**, since it
touches the file every run reads. It is the last conflict on this file rather
than another instance of it.

## 6. What this does not fix

Stated plainly so the change isn't oversold:

- **`.agent/backlog.md` is the next one, and it is surviving on luck.** Filed as
  **TW-042**, deliberately not fixed. It is structurally identical — one file
  every concurrent run appends to — and the only reason it has merged itself is
  that runs happened to append different regions. Git conflicts when two
  branches add different lines at the same position, and every run files its new
  TW- items at the same place; §3's measurement of that is the general case, not
  a quirk of run-state.md. The evidence that it is luck and not design: across
  the same four branches, the same four runs and the same concurrency,
  `run-state.md` conflicted four times out of four and `backlog.md` conflicted
  zero times out of four. Nothing about `backlog.md`'s shape earned that. It has
  not actually hurt yet, which is exactly why it should not be restructured on
  the strength of this note — but when it does, the same split applies.
- **Genuine content conflicts stay conflicts.** Two runs editing the same source
  file still collide, correctly. This only stops runs colliding over bookkeeping
  that was never shared in the first place.
- **A directory of files is less skimmable than one file.** `ls .agent/runs/`
  plus per-file headers recovers most of it; §4's option 2 exists if that proves
  annoying in practice.
- **It does not reduce how much runs write.** Same discipline, same cadence,
  different addresses.

## 7. Recommendation

Adopt **option A, one file per run in `.agent/runs/`, with `run-state.md`
deleted in favour of a directory scan.** The merge relief is real but secondary;
the reason to do it is that a single shared `status` field cannot keep the
checkpoint contract's promise once runs overlap, and it fails silently when it
breaks. The log folder has been running the one-file-per-run pattern in this
repo without a single conflict, which is as much evidence as a change this size
needs.

---

## 8. What shipped (2026-08-14)

Implemented as approved. No application source, spec, test, fixture or
dependency changed — the diff is `.agent/`, `routines/`, `AGENTS.md`,
`THE-PLAN-v3.md` and `START-HERE.md` only.

**Structure**

- `.agent/runs/<run-id>.md` — six files, split from the old `run-state.md`.
- `.agent/runs/README.md` — the one-file-per-run rule, the do-nots, and a
  migration note explaining why old records still say "run-state.md".
- `.agent/run-state.md` — **deleted**, no tombstone (§4 option 1).

**The six run files.** Five came from the `run:` records the file carried:
`failure-replay`, `durability-remainder`, `real-history-replay`,
`engine-decision`, `consistency-sweep`. The sixth,
`2026-08-14-position-last-reading`, was one of the two records that had been
hidden inside an HTML comment under another run's header; it now has the
ordinary header it was denied. Its `started:` is a date only — the original
never recorded a time, and none was invented.

Content was carried across verbatim and checked line by line: **exactly two
lines of the original are not in `.agent/runs/`**, both of them the stale
cross-reference `<!-- Previous run record (…) closed complete; see .agent/log/
for its trail. -->` at the foot of the engine-decision record. It existed only
because one file forced runs to point at each other; with a record per file, a
"previous run record" pointer implies an ordering the folder does not have, so
it was dropped rather than carried. That is the only deletion.

**Documentation**

- `AGENTS.md` §"The run file — one per run, never shared" — replaces §"The
  run-state file". Field list unchanged. Adds the never-write-another-run's-file
  rule, and says plainly that the shared file is gone and must not be
  reintroduced, including as a committed derived index.
- `AGENTS.md` §"Every run starts by scanning the folder" — replaces §"Every run
  starts by reading it". Recovery steps 1-4 unchanged.
- STEP ZERO rewritten in the five nightly routines (`01`-`05`) and the
  checkpoint clause in `17`; path-only updates in `15`, `16`, `18`, `19`.
- `THE-PLAN-v3.md` rule 4 — the serialise-or-resolve trade-off is retired and
  pointed at TW-042.
- `START-HERE.md` — `.agent/` inventory line.

**One semantic decision, flagged rather than buried.** The old contract's step 5
was "resume from `next step`, not from the beginning" — written when runs were
serial, so the next run was always the same run's successor. Under concurrency
that is ambiguous: a build cycle finding a dead consistency sweep should not
execute the sweep's next step as its own. The contract now splits it — recover
the *tree* (commit verified work or revert unverified, log it, mark the file
`interrupted`) but leave that run's `next step` for its own routine, and resume
from `next step` only when the dead run is yours. This is a change in meaning,
not just address, and is the one part of this worth a second opinion.

**Left alone deliberately.** Historical prose in `.agent/morning-brief.md`,
`.agent/engine-decision.md`, `.agent/inventory.md` and inside the migrated run
records still refers to `run-state.md`. Those are accurate accounts of what
those runs saw at the time; rewriting them would falsify the record. The
migration note in `.agent/runs/README.md` covers the dangling references
instead.
