# Routine 2 — Audit Sweep  (schedule: 04:00, alternating nights with attack)

Read-only night. Nothing ships. This is the routine that finds the things the

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
build cycle is too close to see.

---

You are the orchestrator for a Tank Wizard audit sweep. Read `AGENTS.md` first.

No agent in this run may modify application source. Auditors write findings and
tests only. There is no implementer tonight.

## First, alone, before any other reviewer

- **unimpressed-reefkeeper** — drives the running app in a browser and reports
  what does not make sense. It reads no code and no canon; do not give it either.

It runs on any sweep covering the UI, which is every sweep that includes the
a11y or PWA passes below. It exists because the reviewers in the parallel batch
have passed, as correct and fully tested, faults that were obvious in seconds of
using the app — so it goes first, and its findings tell the others where to look.

**Two prerequisites. It stops without them, and that is correct behaviour.**

1. **The app running in a browser it can drive**, at a phone viewport, with the
   real backup imported. Not screenshots, not source.
2. **A written summary of what is in the tank's data** — how many readings of
   each parameter, how many dose changes, how many water changes, how many
   tasks.

Produce the summary yourself before dispatching, by **counting the arrays in
the backup you loaded** — `data.readings` grouped by parameter, `data.dose-log`,
`data.water-changes`, `data.task-log`. Count the arrays; do not copy the
`counts` header, and do not write the summary from memory or from what you
expect the tank to contain. **A wrong summary is worse than none**, because the
agent trusts it and measures the whole app against it — in both directions. Real
markers called phantom is the same failure as phantom markers called real.

If you cannot drive a browser in this environment, **do not dispatch it, and say
so in the brief.** Half a review from this agent is worse than none, because it
will be trusted. Never let it fall back to reading source.

**This is a read-only night, so nothing it finds is fixed here.** Its findings
go into `.agent/findings.md` and through triage with everything else. The
same-round fix rule in `AGENTS.md` applies to build routines, not to this one.
Its three escalations still go straight to `.agent/needs-dan.md`: anything
touching chemistry or the canon, anything it flags as *"was this decided?"*, and
anything where it names two options rather than one answer.

---

## Then dispatch these in parallel — they are independent and read-only:

- **domain-verifier** — full sweep of every chemistry constant and formula
  against the spec, not just tonight's changes. Recompute at least five dose
  recommendations by hand.
- **data-migration-auditor** — full version matrix.
- **pwa-auditor** — offline, service worker, install, persistence, export path.
- **a11y-reviewer** — full axe pass plus the wet-hands mobile checks.
- **perf-watchdog** — budgets and dependency weight.
- **security-auditor** — audit, lockfile, secrets, network calls.
- **test-engineer** — coverage gaps and flake hunt (three full suite runs).

Then, sequentially:

- **triage-analyst** — dedupe hard. This routine generates the most noise of any
  night; expect to delete more findings than you promote.
- **reporter** — morning brief.

Cap the sweep: if an auditor has produced more than 20 findings, have it stop
and report its top 20 by severity. Volume is not thoroughness.
