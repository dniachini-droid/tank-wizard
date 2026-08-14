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

- `.agent/backlog.md` — the queue. Ordered. Tagged.
- `.agent/log/<run-id>.md` — what happened this run, per agent
- `.agent/findings.md` — raw audit output, pre-triage
- `.agent/needs-dan.md` — decisions only Dan can make
- `.agent/spec-challenges.md` — where an agent thinks the spec is wrong

## Backlog item format

```
- [ ] [approved][chem] TW-034 Alkalinity dosing calc rounds before unit conversion
      why: 0.1 dKH error at low volumes
      spec: docs/spec/reef-chemistry.md#alkalinity
      repro: tests/dosing.alk.test.js "rounds after conversion"
      owner: implementer
```

Tags: `[approved]` (implementer may act), `[chem]`, `[schema]`, `[pwa]`, `[a11y]`,
`[perf]`, `[sec]`, `[deps]`, `[docs]`, `[blocked]`.

**Untagged items are read-only to the implementer.** No `[approved]`, no code change.

## PR body template

```
## What
## Why
## Spec reference
## Risk (what breaks if I'm wrong)
## Verification (commands run + output)
## Not done / follow-ups
```

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

### The run-state file

`.agent/run-state.md` is the resume point. It always reflects reality:

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

### Every run starts by reading it

If `status` is `in-progress` or `interrupted`, the previous run died. Before
doing anything new:

1. Check for an open branch with uncommitted changes.
2. If the work is complete and verified → commit and open the PR.
3. If the work is half-done and unverified → **revert it entirely** and put the
   item back on the backlog with a note. Half-finished chemistry code is more
   dangerous than no code.
4. Log what you found and what you did about it.
5. Then resume from `next step`, not from the beginning.

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
