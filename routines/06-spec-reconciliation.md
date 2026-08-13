# Routine 06 — Spec Reconciliation  (run ONCE, read-only)

Paste as a routine prompt, or into a `claude` session. Nothing ships.

---

You are producing a reconciliation between five specification documents. **Do
not change any code. Do not edit any spec file. Do not open a pull request for
anything except the report itself.**

## The documents, and their standing

**Base documents — these are the authority.** Written over a week by the app's
owner, read directly out of running code on 2026-08-12, with sourced constants
and simulated failures behind their conclusions:

- `docs/spec/incoming/dosing-spec.txt` — the arithmetic: bands, rate limits,
  how `maintenanceDose` is derived, when a change is worth suggesting
- `docs/spec/incoming/wizard-spec.txt` — the state machine: 23 returns across
  15 states, in tested order

**Secondary documents.** Written in a single conversation on 2026-08-13,
partly from first principles, and **known to contain at least one error already
corrected** (the magnesium rail, and the claim that magnesium needs separating
from calcium and alkalinity to avoid precipitation — it does not):

- `docs/spec/reef-chemistry.md`
- `docs/spec/surfaces-and-messaging.md`
- `docs/spec/app-contract.md`

**Where they conflict, the base documents are presumed right** unless the
secondary document cites a source the base lacks. Say when that happens; do not
resolve it yourself.

---

## STEP ZERO — verify the enforcement claims

Before comparing anything, establish what is actually true today.

Both base documents claim test enforcement. `dosing-spec` says bands are
enforced by `tests/husbandry.js` and that a band moved outside published
guidance fails the build. `wizard-spec` cites `tests/summary.js`,
`tests/matrix.js` (180 state × reading combinations), `tests/sim/surfaces.js`
(12 states across thousands of tank-days), and `tests/protocols.js` (39 worked
examples from published guidance).

**Check which of these files exist.** Report the list plainly.

This matters because it determines how to read everything else. A rule
described as "enforced" that has no test behind it is an intention, not a
guarantee — and the consistency sweep of 2026-08-13 found several of these
rules being violated in the live code.

For each enforcement claim, record: **file exists / does not exist**, and if it
exists, **does it test what the claim says**.

---

## The comparison

Work through the base documents section by section. For every rule, constant,
threshold or behaviour, produce one row:

```
### <topic>
base says:        (document, section, exact figure or rule)
secondary says:   (document, section) or "silent"
code does:        (file:line, what it actually does)
verdict:          AGREE · CONFLICT · GAP-IN-SECONDARY · GAP-IN-BASE · CODE-DIVERGES
evidence:         command run, or file:line
```

**Five verdicts, used precisely:**

- **AGREE** — all three say the same thing
- **CONFLICT** — base and secondary disagree. State both. Do not pick.
- **GAP-IN-SECONDARY** — base covers something canon doesn't. Expect many:
  the settle window, bracketing, the dose-gap trigger, the 23-branch order,
  correction pacing, `correctionProgress` flags. These are the most valuable
  rows in your report.
- **GAP-IN-BASE** — canon covers something the base doesn't. Expect few:
  the terminology registry, the cross-surface parity requirement.
- **CODE-DIVERGES** — both specs agree and the code does something else.
  These are defects. Rank them.

## Areas to cover, at minimum

Targets and bands · safe bounds · rate limits · test cadence · analysis
windows · kit noise floors · the settle window formula · the dose-gap trigger ·
step cap and bracketing · correction pacing and targets · the stale-reading
rule · plan expiry · the 15 wizard states and their order · which surfaces may
speak · magnesium's exemption from dose-gap logic · the maintenance-versus-
correction distinction · unit conversions · refusal conditions.

## Specific things to check, because they are known risks

1. **The 9.1 pairing.** `dosing-spec` §9.1 says the out-of-band halving of the
   dose-gap trigger exists *only* because stability grading is wrong, and both
   sections need rewriting together if the grading is fixed. Confirm the
   halving is present in code and flag the pairing prominently.
2. **Magnesium's exemption.** Both base documents warn that an agent will read
   this as an inconsistency and "fix" it. Confirm the exemption exists in code
   and record why it must stay.
3. **Wizard branch order.** Verify the live order matches the documented order.
   A branch in the wrong position changes behaviour with no condition altered —
   this has happened before in this codebase.
4. **The four unreachable states.** `worked`, `fell-short`, `overshot`, `due`
   require a staged plan. Confirm no existing test supplies one.
5. **Solution strength.** `dosing-spec` §4 calls this the single largest
   correctness risk: everything downstream depends on it and nothing can check
   it. Report whether any validation exists.
6. **The eight classifiers.** The 2026-08-13 sweep found at least eight
   divergent classifiers where `classifyReading` should be. Map each to which
   spec, if any, authorises it.

---

## Output

Write `.agent/spec-reconciliation.md`:

1. **Enforcement audit** — which claimed test files exist. First, and plainly.
2. **Summary counts** — agreements, conflicts, gaps each way, code divergences.
3. **The conflict list** — ordered by how much a wrong decision would cost.
   Each needs both positions stated fairly and what the code currently does.
   **Do not recommend a resolution.** These are the owner's to decide.
4. **Gaps in canon** — what the base documents know that canon doesn't. This is
   the material that needs promoting into enforced specification.
5. **Code divergences** — where both specs agree and the code doesn't. Ranked.
6. **Test plan sketch** — for each enforcement claim that has no test behind it,
   one line on what that test would need to assert. Do not write the tests.

## Rules

- Evidence for every claim. File and line, or the command you ran.
- Never resolve a conflict. Never edit a spec. Never change code.
- Where you cannot determine what the code does, say so rather than inferring.
- Terse. This is being read by one person deciding twenty or thirty things.
