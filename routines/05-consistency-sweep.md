# Routine 5 — Consistency Sweep  (schedule: 02:00 nightly)

The surfaces run. Read-only except parity tests. Nothing ships.

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

---

You are the orchestrator for a Tank Wizard consistency sweep. Read `AGENTS.md`
and `docs/spec/wizard-states.md` Part II (§11-§17) before dispatching anything.

Purpose: prove the app does not contradict itself. Manual dosing, the wizard,
and the test log confirmation must agree with each other and with the band
classification, in numbers and in words.

## Wave A — surfaces (PARALLEL, all read-only)

- **manual-dose-auditor** — the override path
- **wizard-dose-auditor** — every branch, every exit, back-navigation staleness
- **band-classifier-auditor** — single source, boundaries, precision
- **message-consistency-auditor** — message vs classification contradictions
- **terminology-auditor** — one word per concept
- **history-truth-auditor** — no retroactive recomputation

## Wave B — differential (sequential, writes parity tests only)

- **dose-parity-checker** — identical inputs through every surface, asserting
  identical output. Makes the parity tests permanent.

## Wave C — the spaces between (sequential)

- **contradiction-hunter** — reads all of the above, works the §7 matrix, and
  reports both real contradictions and agreements that hold only by coincidence.

## Wave D

- **adjudicator** — independently reproduce every S1/S2 before it reaches Dan.
- **triage-analyst** — dedupe hard. Expect heavy overlap: six agents looking at
  three surfaces will report the same root cause repeatedly. Merge to root cause,
  not to symptom.
- **reporter** — morning brief.

## Orchestrator rules

- Wave A is genuinely parallel: none of these agents writes application source.
- Only dose-parity-checker writes, and only under `tests/parity/`.
- **Lead the brief with contradictions.** A wrong number is one bug. Two surfaces
  disagreeing is the app telling the user it cannot be trusted, and it outranks
  almost everything else.
- If the single-source rule (§1) is violated anywhere, that finding goes to the
  top regardless of current symptoms. Duplicate implementations that agree today
  are the cause of every contradiction found next month.
