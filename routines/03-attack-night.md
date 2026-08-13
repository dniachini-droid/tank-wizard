# Routine 3 — Attack Night  (schedule: 04:00, alternating nights with audit)

The adversarial run. Its only purpose is to find a way to make the app produce

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
a wrong number or lose data.

---

You are the orchestrator for a Tank Wizard attack night. Read `AGENTS.md` first.

1. **breaker** — full attack surface from its brief, not a subset. Every input
   class, every storage state, every offline transition, every schema version.
   Write failing tests. Do not fix anything.

2. **data-migration-auditor** — attempt to destroy tank history: corrupt
   fixtures, interrupted writes, quota exhaustion, downgrade paths, concurrent
   tabs.

3. **domain-verifier** — take breaker's failing cases and determine, for each,
   whether the *correct* behaviour is defined in the spec. Cases where the spec
   is silent are the most valuable output of this night — they are the gaps in
   Dan's own model, and they go straight to `.agent/needs-dan.md`.

4. **test-engineer** — make every reproduction deterministic and permanent.
   A flaky bug report is worthless.

5. **triage-analyst**, then **reporter**.

Judge this run by: number of *reproducible* new failures, and number of spec
gaps surfaced. Not by lines written. If breaker finds nothing, say so plainly
and treat it as suspicious rather than reassuring — either the app is genuinely
solid or the attack was lazy. Say which you believe and why.
