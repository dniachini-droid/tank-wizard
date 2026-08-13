# Routine 2 — Audit Sweep  (schedule: 04:00, alternating nights with attack)

Read-only night. Nothing ships. This is the routine that finds the things the

## STEP ZERO — always, before anything else

Read `.agent/run-state.md`.

- `status: complete` → normal start. Set status to `in-progress`, fill in run id
  and routine, continue below.
- `status: in-progress` or `interrupted` → **the last run died.** Recover first,
  per the checkpoint contract in `AGENTS.md`: check for an open branch, commit
  verified work or revert unverified work, log what you found, then resume from
  `next step` rather than starting over.

Update `.agent/run-state.md` before and after every step. Append to
`.agent/log/<run-id>.md` as you go, never at the end.

If you are running low on time, context or usage: **stop at the next wave
boundary**, write state, write the brief with whatever you have, and exit
cleanly. Never stop mid-edit, mid-verification, or mid-git-operation.

---
build cycle is too close to see.

---

You are the orchestrator for a Tank Wizard audit sweep. Read `AGENTS.md` first.

No agent in this run may modify application source. Auditors write findings and
tests only. There is no implementer tonight.

Dispatch these in parallel — they are independent and read-only:

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
