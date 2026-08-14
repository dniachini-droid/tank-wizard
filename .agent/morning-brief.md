# 2026-08-13 — Tank Wizard overnight

> **Note added 2026-08-14 (canon swap).** This is a historical record; its body
> is left as written. The files it cites were renamed that day:
> `reef-chemistry-MERGED.md` → `docs/spec/reef-chemistry.md`,
> `wizard-states-MERGED.md` → `docs/spec/wizard-states.md`,
> `docs/spec/surfaces-and-messaging.md` → `wizard-states.md` §11–§17 (add 10 to
> the section number), `docs/spec/app-contract.md` → `wizard-states.md` §18,
> `docs/spec/incoming/*.txt` → `legacy/protocol/*.txt` (identical files,
> duplicates deleted). Section numbers in `reef-chemistry.md` §1–§14 and
> `wizard-states.md` §0–§10 are unchanged, **except** that §8's subsections
> shifted: bracketing §8.1 → §8.3, step cap §8.2 → §8.4, rate ceiling
> §8.3 → §8.5. Everything the previous canon carried that the merge had dropped
> now lives in `reef-chemistry.md` Part II (§15–§23), which maps the old sections
> to the new ones.

## Needs you (N)
Two spec files disagree with each other on volume terminology — surfaces-and-messaging.md says "water volume", reef-chemistry.md says "net volume" — pick one. (.agent/needs-dan.md #1)
Magnesium dose-rate rail: the live wizard runs on safe-rate.js's 25 ppm/day, which contradicts both reef-chemistry.md canon (100 ppm/day) and Setup's own correction.js (100). safe-rate.js's code comment cites independent real-world sourcing — may be the spec that's wrong, not the code. Needs your call before anyone touches a dosing rail. (.agent/needs-dan.md #2)
15 backlog items (TW-002 through TW-016) are waiting for [approved] tags — untagged, implementer can't act on any of them.

## Shipped (branches awaiting your merge)
PR #1 — claude/2026-08-13-consistency-sweep: adds 4 permanent regression tests under src/test/spec/history/ and 9 files (fixtures + 8 suites) under tests/parity/, proving cross-surface disagreement. No application source touched, no user-facing number moved — this was a read-only audit sweep by design.

## Found
**Lead contradiction — the app disagrees with itself.** TW-002: `classifyReading()` — the one function the spec requires every surface to call — does not exist anywhere in the codebase. ~8 independently-maintained classifiers exist in its place, and they visibly disagree today: a single 6.9 dKH reading shows mild amber (paramStatus) directly beside two separate red "Dangerously low" badges (doseStatus, findings.js) in one Dashboard card, one render. This is the root cause behind most of tonight's other findings and outranks them per the single-source rule.
TW-003: the Dosing Wizard crashes outright (`TypeError`, null dereference) on the two most common refusal states — no volume/strength set, no readings yet. First thing a new user hits.
TW-004: manual dose entry (DoseChangeSheet + Setup's dose field) has no rail check at all — Setup accepts negative or unbounded doses with zero validation.
TW-005: the magnesium gate and precipitation guard (reef-chemistry §5/§9) are structurally unreachable from the wizard — assessAlkalinity/assessCalcium have no channel to receive magnesium status at all.
Also flagged by contradiction-hunter: 9 cross-surface facts that agree today only by coincidence (no shared source) — they will break on the next unrelated change, not just today's bugs.

## Health
tests: 193 passing / 68 failing / 0 skipped (44 files: 12 pass, 32 fail). Of the 32 failing files, 23 pre-date tonight's sweep (existing spec-violation tests the auditors used as evidence, not created by this run) and 9 are new — 3 history + 6 parity regression tests this sweep added, all failing intentionally to document real findings, none broken infrastructure.
coverage: not measured this run (read-only sweep, no coverage tooling run)
bundle: main JS 286.2 kB gzip (budget 180 kB) — over budget; CSS 8.7 kB (budget 40 kB) — fine; total initial ~294.9 kB gzip (budget 250 kB) — over budget. Pre-existing, not caused by tonight's sweep (no application source changed), but flagging since it's over both thresholds in .agent/budgets.json.
build: pass (`npm run build` succeeds, one Vite warning about a >500 kB chunk — same root cause as the bundle-budget miss)
audit: 51 raw findings → adjudicator independently reproduced all 40 S1/S2 (0 downgraded) → merged to 25 root-cause clusters → triage promoted 15 to backlog, deleted 5 as noise, parked 2 unverified, held back 7 at the item cap

## Didn't finish
Nothing stalled. All four waves (A: 6 surface auditors, B: parity checker, C: contradiction-hunter, D: adjudicator/triage/reporter) ran to completion.

## Cost
not tracked this run
