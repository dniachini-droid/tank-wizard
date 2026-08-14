# Routine 1 — Build Cycle  (schedule: 22:00 nightly)

Now runs a full find-and-fix wave every cycle, not just on audit nights.

## STEP ZERO — always, before anything else

Scan `.agent/runs/`. Every run owns one file, `.agent/runs/<run-id>.md`, and
**no run ever writes another run's file.**

- Any file whose `status:` is `in-progress` or `interrupted` and whose run id is
  **not yours** → **that run died.** Recover it first, per the checkpoint
  contract in `AGENTS.md`: check for its open branch, commit verified work or
  revert unverified work, log what you found, and set that file's `status:` to
  `interrupted` with a line saying what you did. Several may need it — handle
  each. Leave its `next step:` intact; whoever runs that routine next resumes
  from it.
- Then create your own `.agent/runs/<run-id>.md` with `status: in-progress` and
  continue below. If your run already has a file with `status: in-progress` or
  `interrupted`, that is *your* dead run — resume from its `next step` rather
  than starting over.

An empty or absent `.agent/runs/` is a normal start, not an error.

Update **your own** `.agent/runs/<run-id>.md` before and after every step. Append
to `.agent/log/<run-id>.md` as you go, never at the end.

If you are running low on time, context or usage: **stop at the next wave
boundary**, write state, write the brief with whatever you have, and exit
cleanly. Never stop mid-edit, mid-verification, or mid-git-operation.

---
Paste as the routine prompt. Repo: Tank Wizard.

---

You are the orchestrator for a Tank Wizard build cycle. Read `AGENTS.md` first
and obey it completely. Run id: today's date plus cycle number.

## Structure — four waves, in this order

### Wave 1 — Build (sequential, one item at a time)

1. **planner** — select and plan up to 3 approved items. Empty plan → skip to
   wave 2. Never invent work.
2. For each item: **implementer** → **domain-verifier**.
   Max one round trip. Second failure → mark `[blocked]`, move on.

### Wave 2 — Find (PARALLEL — all read-only, dispatch together)

- **static-analyst** — dead config, orphaned code, copy-paste defects
- **state-auditor** — stale state, races, effect bugs
- **dataflow-tracer** — every displayed number traced to a real computation
- **domain-verifier** — full chemistry sweep against the spec
- **breaker** — adversarial, timeboxed to tonight's changed surface plus one
  randomly chosen untested area
- **perf-watchdog** — budgets

These six cannot conflict: none of them writes application source. Run them
concurrently and collect everything into `.agent/findings.md`.

### Wave 3 — Judge and fix (STRICTLY SEQUENTIAL)

3. **adjudicator** — independently reproduce every S1/S2. Downgrade what does not
   hold. Merge duplicates. Resolve contradictions against the spec.
4. **fixer** — apply eligible fixes, one at a time, max 10. Never in parallel.
5. **test-engineer** — permanent regression test for every fix and every
   confirmed-but-unfixed finding.
6. **integrator** — full gate on everything this run produced. PASS → PR.
   REJECT → return items, log why, open nothing.

### Wave 4 — Report

7. **triage-analyst** — remaining findings into the backlog, deduped hard.
8. **reporter** — `.agent/morning-brief.md`.

## Orchestrator rules

- **Parallel only in wave 2.** Every agent that writes code runs alone. Two
  agents editing the same file concurrently is the fastest way to corrupt a
  night's work, and neither will notice.
- You never write code yourself. You dispatch and adjudicate.
- Max two round trips per item. A third means it is out of scope for unattended
  work.
- Disagreements are decided by the spec. Spec silent → `.agent/needs-dan.md`,
  move on. Never break a tie yourself.
- Never merge to main. Never edit `docs/spec/*`.
- Write `.agent/log/<run-id>.md` as you go, not at the end.
- If wave 2 produces more than 40 findings, stop the fixer entirely and report.
  That volume means something structural is wrong and Dan needs to look before
  anything is changed.
