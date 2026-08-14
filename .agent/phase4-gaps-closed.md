# Phase 4 — Spec Gaps: BLOCKED

**Status: could not run. The routine's required input, `.agent/SPEC-GAPS.md`, does not exist.**

---

## What was checked

- `.agent/SPEC-GAPS.md` — not present on disk in this container.
- `git log --all` for any path matching `SPEC-GAPS` — no commit ever added,
  renamed, or deleted this file. It has never existed in this repository's
  history.
- A repo-wide grep for `SPEC-GAPS`, and for the gap IDs the routine cites as
  "known answers" (`G23`, `G27`, `G9`, `G26`) — zero hits outside
  `routines/11-phase4-gaps.md` itself.
- No differently-named or differently-located file contains a G1–G31 list
  (checked `.agent/*.md`, `docs/spec/`, `AGENTS.md`, `DO-THIS-STEP-BY-STEP.md`).

So there is no source for the "31 places (G1–G31)" the routine asks to be
resolved. Nothing to triage, quote, or contradict-check — the list itself is
missing, not just thin.

## What is present and unaffected

- The five legacy protocol documents all exist and are readable:
  `legacy/protocol/dosing-spec.txt`, `wizard-spec.txt`,
  `calculation-spec.txt`, `correction-spec.txt`, `dose-change-confirmation.md`.
- The two merged drafts exist: `docs/spec/reef-chemistry-MERGED.md`,
  `docs/spec/wizard-states-MERGED.md`.
- `private/` is absent (only the `.gitignore` entry from commit `4687f05`
  exists) — consistent with "if absent, say the check was not run," per the
  routine's own instructions. No real-data replay was possible or attempted.
- `legacy/tests/sim/` has `rng.js`, `years.js`, `longrun.js`, `surfaces.js`,
  `smoke.js` — **no `invariants.js`**, which the routine names as one of the
  three files to copy for simulation. That file is also missing, separately
  from the SPEC-GAPS problem.

## Not attempted

Per the routine's own rules ("never present a reasoned proposal as though it
were sourced," "resolving a contradiction is Dan's job"), generating a
plausible-looking 31-item G1–G31 table from scratch — reverse-engineering
gaps from the specs and code myself, in the absence of the actual
`SPEC-GAPS.md` — would be exactly that: unsourced material presented as if it
had a source. So it was not done.

## What would unblock this

Someone needs to either:
1. Restore/commit `.agent/SPEC-GAPS.md` (perhaps it exists uncommitted in
   another session's container and never got pushed), or
2. Regenerate it via whatever process originally produced the "31 places"
   count, then re-run this routine.

Also worth restoring alongside it: `legacy/tests/sim/invariants.js`, needed
for the simulation step this routine calls for on any STILL OPEN gap.
