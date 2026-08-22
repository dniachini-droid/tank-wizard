# Tank Wizard — House Rules

Every agent, every run, no exceptions. Read this before doing anything.

## What this app is

Tank Wizard is a React/JSX progressive web app for reef aquarium management.
It is used by a real person to make real dosing decisions on a live 77 L reef tank.
**A wrong number in this app can kill livestock.** Treat numerical correctness as a
safety property, not a quality property.

## Non-negotiables

1. **Never edit `docs/spec/*` .** The spec is human-authored canon. If code and spec
   disagree, the code is wrong. If you believe the spec is wrong, write your case to
   `.agent/spec-challenges.md` and stop. Do not "fix" the spec to match the code.
2. **Never push to `main`.** Branch as `claude/<date>-<slug>`, open a PR, stop.
3. **Never change chemistry constants, formulas, thresholds, or unit conversions**
   unless the backlog item explicitly authorises it AND the change matches the spec.
4. **Never delete or rewrite a test to make it pass.** A failing test is information.
   If a test is genuinely wrong, mark it `.skip` with a comment and log it for Dan.
5. **Never touch storage schema versioning** outside an item tagged `[schema]`.
   Silent data loss is the worst possible failure here — a user's tank log history
   is irreplaceable.
6. **No new runtime dependencies** without an item tagged `[approved][deps]`.
7. **No network calls added to the app.** It is offline-first by design.
8. **No secrets, keys, tokens, or personal data** committed. Ever.
9. **Never edit anything under `legacy/`.** It is the original single-file Tank
   Wizard repo, preserved on 14 August 2026 with its full test suite passing —
   41 checks, 5,940 golden cases, fingerprint `37ded9064e91e80e`. It is a
   reference and a source of tests to port, **not live code**. Read from it,
   copy out of it, cite it — never write to it. To port a test, change the copy
   in the root `tests/` tree and leave the original untouched. See
   `legacy/README-LEGACY.md`.
10. **Never resolve a contradiction, but always work it up.** When two live
    behaviours conflict, or a document and the code disagree, do not choose
    between them. But do not merely report the conflict either. Give it the full
    treatment: two or three options with reasoning that can be checked, which
    direction being wrong hurts, whether something in the app already does the
    job, what else must change alongside, and what would make each option wrong.
    Present the decision fully prepared and leave the choosing to Dan.
    "Do not decide" does not mean "do not think."
11. **Every prose report gets a plain-language layer.** This covers
    `.agent/findings.md`, `.agent/needs-dan.md`, `.agent/spec-challenges.md`,
    morning briefs and phase reports. Each must state its findings twice: the
    precise version (figures, units, `file:line`), then the same thing in plain
    reef-keeping terms — no code identifiers, no camelCase, no test names. Dan
    keeps a reef tank; he does not write code. If the plain version is hard to
    write, the finding is muddled, and that is worth reporting. This is a
    writing requirement, not an extra agent. Structured files are exempt:
    `.agent/items/` keeps the item format above, where the `why:` line
    carries the plain meaning and the identifiers are the point.
12. **Dispatch `domain-verifier` only for chemistry.** Use it when a finding
    changes a chemistry constant, changes what the app tells the user to dose,
    or contradicts something settled in `docs/spec/`. Not for terminology, dead
    code, formatting, test structure, performance or accessibility.
13. **Finish the job: commit, push, open a PR. Never merge.** When work is
    complete, all three happen in the same breath — `git commit`, `git push -u
    origin <branch>`, and `gh pr create` (or the GitHub MCP tools where `gh` is
    not installed). **A pushed branch with no PR is unfinished work**, invisible
    to Dan and easy to lose; if you pushed, you open the PR, in the same run,
    before you report done.
    The PR body uses the template below and must say three things: **what
    changed, why, and what breaks if it is wrong.** Per rule 11 it says them
    twice — the precise version with figures and `file:line`, then the same
    thing in plain reef-keeping terms. A PR Dan cannot evaluate without reading
    the diff is not finished either.
    **Merging is Dan's alone.** Never merge a PR, never enable auto-merge, never
    push to `main`. This holds however green the checks are and however trivial
    the change looks — a wrong number in this app can kill livestock, and the
    last human check is the whole point of the gate.

## The unimpressed reefkeeper runs first

`unimpressed-reefkeeper` runs **before any other reviewer** on any round that
changes something Dan will look at. Rounds that touch only the engine or the
canon do not need it. It reads no code and no canon — it drives the running app
in a browser and reports what does not make sense. It exists because every
code-reading reviewer on this project has passed, as correct and fully tested,
faults that were obvious within seconds of using the app.

**Its findings are fixed in the same round.** They are not filed for Dan to
decide on. He is told what was fixed and why.

**Three exceptions go to Dan instead**, via `.agent/needs-dan.md`:

- anything touching chemistry or the canon
- anything the agent flags as *"was this decided?"*
- anything where it names two options rather than one answer

**It needs two things and stops without them:**

1. the app running in a browser it can drive
2. a written summary of what is in the tank's data — how many readings of each
   parameter, how many dose changes, how many water changes, how many tasks

Give it both before dispatching it. Without the summary it cannot tell real data
from invented data, which is how twenty phantom water-change markers survived
four rounds of review. A run that cannot supply both does not run this agent and
says so; half a review from it is worse than none, because it will be trusted.

## Definition of done

An item is only done when all of these hold:

- `npm run lint` clean
- `npm run typecheck` clean (if configured)
- `npm test` green, including the new tests you wrote
- `npm run build` succeeds
- Bundle within budget (`.agent/budgets.json`)
- A regression test exists that would have caught the original bug
- `.agent/log/<run-id>.md` written
- PR opened with the "what/why/risk" body from the template below

## Evidence rule

Never report a claim you did not verify by running something. Do not write
"this should work" or "this looks correct". Write the command you ran and its
output. An agent that cannot verify a claim must mark it `UNVERIFIED` and say why.

## Escalation rule

Stop and write to `.agent/needs-dan.md` instead of guessing when:

- The spec is silent, ambiguous, or self-contradictory on a chemistry question
- A fix requires changing a chemistry constant
- A fix requires a schema migration
- Two agents disagree twice on the same item
- You would need to change more than ~400 lines to complete the item

Stopping is a successful outcome. Guessing is not.

## Handoff format

The repo is the shared memory. Agents do not talk to each other directly;
they read and write these files:

- `.agent/items/<TW-id>.md` — the queue. One file per item. Ordered. Tagged.
  `npm run backlog` prints the whole thing in order; `npm run backlog --
  --approved` prints only what may be implemented.
- `.agent/log/<run-id>.md` — what happened this run, per agent
- `.agent/findings.md` — raw audit output, pre-triage
- `.agent/needs-dan.md` — decisions only Dan can make
- `.agent/spec-challenges.md` — where an agent thinks the spec is wrong

## Backlog item format — one file per item, never one shared list

Every item is exactly one file, `.agent/items/<TW-id>.md`, named by its number:

```
id: TW-034
title: Alkalinity dosing calc rounds before unit conversion
status: approved
tags: [approved][chem]
order: 340

why: 0.1 dKH error at low volumes
spec: docs/spec/reef-chemistry.md#alkalinity
repro: tests/dosing.alk.test.js "rounds after conversion"
owner: implementer
```

Header lines, a blank line, then the body in the same `why: / spec: / repro: /
owner:` prose as before. `status` is `approved` · `needs-approval` · `blocked` ·
`done` — the four sections the old list had.

Tags: `[approved]` (implementer may act), `[chem]`, `[schema]`, `[pwa]`, `[a11y]`,
`[perf]`, `[sec]`, `[deps]`, `[docs]`, `[blocked]`.

**Untagged items are read-only to the implementer.** No `[approved]`, no code change.

**Order lives in the `order:` field, not in line position.** Lower is sooner,
values are spaced by 10 so an item can be slotted between two others without
touching either, and ties break by id. Top = next still holds; it is now
`npm run backlog -- --approved` and take the first.

**The one rule: a run edits only the files for the items it is touching.**
Filing an item creates a new path, so two runs filing different items cannot
conflict. There is no combined `.agent/backlog.md` any more — one shared list
that every run appended to is what this replaced, for the same reason
`.agent/run-state.md` was replaced by `.agent/runs/`. Do not reintroduce it,
and do not commit a generated index of the folder: a second copy of the queue
conflicts exactly as the original did. `npm run backlog` prints the view to
stdout, deliberately writing no file. Full contract: `.agent/items/README.md`.

## PR body template

Per non-negotiable #13, every PR uses this and every PR gets opened. Per rule
11, **What / Why / Risk each carry a plain-language layer** — the precise
version first, then the same thing in reef-keeping terms.

```
## What
## Why
## Spec reference
## Risk (what breaks if I'm wrong)
## Verification (commands run + output)
## Not done / follow-ups

## In plain terms
what changed · why · what breaks if it's wrong
```

If a command in Verification could not be run, say so and say why. An unrun
check is never reported as a passing one.

## Tone

Terse. No narration, no preamble, no "Great question!". You are writing for
one tired human reading a summary at 7am. Lead with what needs his attention.

---

## Checkpoint and resume contract

A run can end at any moment: time limit, usage limit, infrastructure hiccup.
**The system must never lose work or leave the repo in a half-changed state.**
Every agent and every routine obeys these rules.

### Write as you go, never at the end

Append to `.agent/log/<run-id>.md` after **every** agent completes, not when the
run finishes. If the run dies, the log is what survives. A run that did good work
and wrote nothing down did nothing.

### The run file — one per run, never shared

Every run owns exactly one file, `.agent/runs/<run-id>.md`, and it is that run's
resume point. It always reflects reality:

```
run: <run-id>
routine: <which one>
started: <timestamp>
status: in-progress | complete | interrupted
last completed step: <wave / agent>
next step: <exactly what to do next>
in-flight: <anything started but unfinished — name it precisely>
branch: <branch name if one is open>
uncommitted work: yes/no
```

Update it **before** starting each step and **immediately after** finishing it.

**The one rule: a run writes only its own file, and never edits another run's.**
That is what makes two runs in flight at once safe. The `<run-id>` is the same
one that names the run's log, so `.agent/runs/<id>.md` and `.agent/log/<id>.md`
are always a matched pair.

There is no single shared state file. There was one — `.agent/run-state.md` —
and concurrent runs overwrote each other's records in it, which is why it is
gone. Do not reintroduce it, and do not add a committed index derived from
`.agent/runs/`: a second copy of `status` conflicts exactly as the original did.

### Every run starts by scanning the folder

Read every file in `.agent/runs/`. A file whose `status` is `in-progress` or
`interrupted` is a run that died — **there may be more than one, so check them
all.** For each one that is not yours, before doing anything new:

1. Check for its open branch with uncommitted changes.
2. If the work is complete and verified → commit and open the PR.
3. If the work is half-done and unverified → **revert it entirely** and put the
   item back on the backlog with a note — its own file under `.agent/items/`,
   which is the only file this touches. Half-finished chemistry code is more
   dangerous than no code.
4. Log what you found and what you did about it.
5. Set that file's `status` to `interrupted` and record what you did, but leave
   its `next step` intact — it belongs to that routine, and whoever runs that
   routine next resumes from it. Do not carry on another run's work as your own.

If the dead run **is** yours — same run id, from an earlier attempt — resume
from its `next step` rather than starting over, as before.

An absent or empty `.agent/runs/` is a normal start, not an error.

### Stop cleanly at boundaries

Wave boundaries are the safe stopping points. If you are running low on time,
context, or usage, **stop at the next boundary rather than starting a new
agent.** Write state, write the brief with what you have, exit.

Never stop in the middle of:
- an implementer's edit before tests run
- a fixer's change before verification
- a git operation

If you must, revert to the last clean state first.

### Never leave the tree half-fixed

Any agent whose change does not verify reverts its own change completely before
reporting. Reporting a failure is fine. Leaving broken code is not.

### Partial output still ships

A run that completes two of four waves writes a morning brief covering those two
waves and says plainly what did not run. Silence is the only unacceptable
outcome.
