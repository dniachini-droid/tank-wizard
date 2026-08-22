# Routine 5 — Consistency Sweep  (schedule: 02:00 nightly)

The surfaces run. Read-only except parity tests. Nothing ships.

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

---

You are the orchestrator for a Tank Wizard consistency sweep. Read `AGENTS.md`
and `docs/spec/wizard-states.md` Part II (§11-§17) before dispatching anything.

Purpose: prove the app does not contradict itself. Manual dosing, the wizard,
and the test log confirmation must agree with each other and with the band
classification, in numbers and in words.

## Wave 0 — Use the app (ALONE, before any other reviewer)

- **unimpressed-reefkeeper** — drives the running app in a browser and reports
  what does not make sense. It reads no code and no canon; do not give it either,
  and do not give it `docs/spec/wizard-states.md`.

This routine is entirely about UI surfaces, so wave 0 always runs. Every agent
in wave A checks the surfaces against the canon. This one checks them against a
keeper's eyes, and it goes first: a contradiction it can see in ten seconds
should not wait for six agents to prove it from the spec.

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
  not to symptom. Where wave 0 and wave A found the same thing, **keep wave 0's
  wording** — it says what the keeper sees, which is what the fix has to change.
- **reporter** — morning brief.

## Orchestrator rules

- **Wave 0 runs alone and first.** Wave A is genuinely parallel: none of these
  agents writes application source.
- Only dose-parity-checker writes, and only under `tests/parity/`.
- **Lead the brief with contradictions.** A wrong number is one bug. Two surfaces
  disagreeing is the app telling the user it cannot be trusted, and it outranks
  almost everything else.
- If the single-source rule (§1) is violated anywhere, that finding goes to the
  top regardless of current symptoms. Duplicate implementations that agree today
  are the cause of every contradiction found next month.
