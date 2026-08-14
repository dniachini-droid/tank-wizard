# Routine 11 — Phase 4: Close the Spec Gaps

Cloud routine. **Reports only.** No spec file is edited, no code is touched.

---

## Background

Five specification documents exist for this app, all read out of running code
on 12 August 2026:

| `legacy/protocol/dosing-spec.txt` | bands, rate limits, what may change |
| `legacy/protocol/wizard-spec.txt` | the state machine, 23 branches in order |
| `legacy/protocol/calculation-spec.txt` | how a daily dose change is worked out |
| `legacy/protocol/correction-spec.txt` | how a correction is sized and tracked |
| `legacy/protocol/dose-change-confirmation.md` | not yet read by anyone |

Two merged drafts existed in `docs/spec/` as `reef-chemistry-MERGED.md` and
`wizard-states-MERGED.md`; on 14 Aug they became `reef-chemistry.md` and
`wizard-states.md`, the only two canon files. They were written before the last three documents
above were found, so they are incomplete.

`.agent/SPEC-GAPS.md` lists **31 places (G1–G31)** where the merged drafts are
too vague to implement or test against. Most were written before
`calculation-spec` and `correction-spec` surfaced.

**Phase 3 is complete:** the golden fingerprint `37ded9064e91e80e` matches
exactly against the new modular code, 0 failures. The specs describe code whose
behaviour is now verified.

---

## The job

For each of G1 to G31, establish the answer and where it comes from.

### Four possible outcomes

**ANSWERED BY SPEC** — one of the five legacy documents answers it. Quote the
document, section and figure. Say whether it matches the proposal in
`SPEC-GAPS.md`; where it differs, the legacy document wins, because it was read
out of code that now has a verified fingerprint.

**ANSWERED BY CODE** — no document covers it, but the code does so
unambiguously and consistently. Give file:line. Flag that it is undocumented.

**CONTRADICTED** — a legacy document and the code disagree, or two legacy
documents disagree. State both. **Do not resolve it.**

**STILL OPEN** — genuinely unanswered. These go to the design process below.

### Known answers, to check rather than rediscover

- **G23** — `correction-spec.txt` §3 gives it in full:
  `perDay = maxRate × paceFraction`, `days = max(1, ceil(gap / perDay))`,
  `delta = perDay / effectPerMl`, `dose = maintenance ± delta`
- **G27** — `correction-spec.txt` §3, and it reverses the guess in
  `SPEC-GAPS.md`: **a correction REPLACES the daily dose. It is not added.**
  The returned `dose` is the whole figure to run while correcting. Read as an
  addition, every correction doubles.
- **G9** — `calculation-spec.txt` §2:
  `effectPerMl = strengthPer100L × (100 / volumeL)`
- **G26** — `correction-spec.txt` §6: `arrived` already requires two
  consecutive in-band readings, and records why one was not enough

### A whole mechanism missing from the merged drafts

`calculation-spec.txt` §6 describes **staging** — the app does not apply a
whole calculated change at once. Alkalinity applies 55–100% depending on size
and urgency; calcium 50–100%; magnesium 45–100%. Alkalinity and calcium have a
**rescue path** applying 100% when out of band; **magnesium deliberately has
none**, because raising a dilute maintenance dose to lift low magnesium once
asked for 72 mL/day.

The merged drafts do not mention staging at all. Report it as a gap in the
merge, with the full table.

Also missing: the **five constraints in fixed order** (`calculation-spec` §7) —
rounding, rate ceiling, plausibility, bracketing, step cap. Order changes the
answer.

---

## For anything STILL OPEN

Use the `domain-verifier` agent and its nine checks. In particular:

- search for published guidance before proposing anything
- give two or three options, each with reasoning that can be checked
- **simulate** — copy `legacy/tests/sim/years.js`, `invariants.js` and
  `sim/surfaces.js` to a scratch directory and run current versus proposed.
  Report numbers, with the caveat that the simulator has its own model
- **replay against real data** — `private/` holds Dan's actual tank backups.
  If present, report what a proposed rule would have done differently on his
  real history. If absent, say the check was not run. Never substitute
  synthetic data
- say which direction being wrong hurts
- check nothing already does the job
- name anything that must change alongside
- say plainly where you have no basis

`private/` is gitignored. **Never commit anything from it, never quote raw
readings into a public report** — describe patterns, not values.

---

## Output

`.agent/phase4-gaps-closed.md`:

1. **Counts** — answered by spec, answered by code, contradicted, still open
2. **The table** — G1 to G31, one line each: gap, outcome, source, whether it
   matches the original proposal
3. **Contradictions** in full — both positions, no resolution
4. **Still open** — the domain-verifier treatment for each
5. **Missing from the merged drafts** — staging, the five constraints, and
   anything else the newly found documents cover that the merge does not
6. **What `dose-change-confirmation.md` contains** — nobody has read it

### Write everything twice

Every finding gets both layers, per `domain-verifier`:

- **Precise** — specification language, figures, units, file:line
- **Plain** — the same thing as one reefkeeper would say it to another

If the plain version is hard to write, the rule is muddled. Say so.

---

## Never

- Edit any file in `docs/spec/`
- Edit anything under `legacy/`
- Change application code, tests or constants
- Resolve a contradiction — that is Dan's
- Present a reasoned proposal as though it were sourced
- Commit or quote anything from `private/`
