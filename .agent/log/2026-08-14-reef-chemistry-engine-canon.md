# Run 2026-08-14 — the Reef Chemistry Engine, folded into canon

Owner-directed, not a routine. Dan authorised the spec edits explicitly, which
is the only thing that makes them legal under AGENTS.md rule 1 ("never edit
`docs/spec/*`"). No code changed. No chemistry constant changed, invented or
moved.

## What was asked

1. Fold `docs/spec/DECISION-reef-chemistry-engine.md` into `reef-chemistry.md`
   and `wizard-states.md` as proper canon sections rather than leaving it loose
   in `docs/spec/`.
2. Unblock TW-026, TW-027 and TW-028.
3. File the new work the decision creates: phosphate and nitrate assessed with
   reasoning that suits them (**as a defect**), salinity assessed at all, and
   the confirmation dialogue for hiding serious notices.

## What was done

**Spec — the fold.** Split along the two files' own stated division: the
arithmetic and what is assessed goes in `reef-chemistry.md`, the surfaces and
the words go in `wizard-states.md`.

- `reef-chemistry.md` **§25 — The Reef Chemistry Engine** (new, Part III
  alongside §24). One engine, not two, with Dan's own words quoted; per-parameter
  logic inside it; the parameter coverage table; not-a-rebuild (`deriveTankState`
  at `src/App.jsx:67` remains the function that runs it); an explicit
  "what this settles and what it does not"; an honest "Enforced by" saying
  nothing asserts it; a plain-terms layer per house rule 11.
- `reef-chemistry.md` §12 gains one refusal: **the app does not judge one
  parameter by another parameter's thresholds, trend logic or evidence bar.**
- `reef-chemistry.md` §13.2 (open item, notifications) narrowed: what a notice
  contains, how many there are and what hiding does are now settled; only the
  push layer is still open. Header amended to record §25.
- `wizard-states.md` **Part III, §19 — The Reef Chemistry Engine, which surface
  shows what** (the surface table, the wizard-is-a-screen rule, what it changes
  about §7 and §11, and what it unblocks) and **§20 — Notices** (one live notice
  per parameter, supersession, global hiding, every notice hideable including
  safe-bounds excursions, the confirmation wording verbatim, resurfacing).
- `wizard-states.md` §7 gains a "widened 14 Aug" pointer to §19; §11's
  single-source table gains a **parameter assessment** row naming
  `deriveTankState`; header and part-map amended.
- `docs/spec/DECISION-reef-chemistry-engine.md` deleted. Nothing in the repo
  referenced it (`grep -rn "DECISION-reef-chemistry"` — no hits outside the file
  itself), and both new sections record where it went.

**One thing the decision did not say, written down as such.** §20 needed a
definition of "serious" to be implementable. It is mapped to the app's existing
severity vocabulary — a finding of severity `act`, or a wizard state whose §3
tone is red — and the section says in its own text that this is the spec's
inference and not the owner's words, so correcting it is one line. It is
flagged again in TW-031 and in the PR body. Nothing else in §19 or §20 is
anything but Dan's decision restated.

**Backlog — unblocked.** TW-026, TW-027, TW-028 moved to "Approved for
implementation" and marked `[approved]`, ordered 026 → 027 → 028, still phase 8b
(approved, not next). Their existing text is unchanged apart from `spec:`,
`owner:` and a new `UNBLOCKED 2026-08-14` line, plus §19/§20 cross-references
where those sections now answer a question the item had recorded as open —
journey 4's open question 1 (what counts as one topic) and open question 4
(whether a safe-bounds excursion may be hidden) are both answered by §20.
**None of the three carries `[chem]`, deliberately**: the routing, the states
and the enforcement may be built; a chemistry constant may not be minted from
them. Journey 4b's evidence figures are journey material, not canon, and §25
says so — noted on TW-026.

**Backlog — new work.** Three items filed in "Needs Dan's approval":

- **TW-029 `[chem]` — DEFECT, phosphate and nitrate assessed with alkalinity's
  reasoning.** Filed as a defect per the decision's own framing. Three generic
  loops in `src/lib/findings.js` apply one rule to every parameter, and the
  arithmetic was checked rather than asserted: at the default bands
  (`constants.js:33-34`) the `far-out-<key>` threshold puts phosphate's low
  trigger at **-0.040 ppm** and nitrate's at **-5 ppm**, so neither parameter
  can produce a far-out-low finding at any value a kit can return — including
  0.00 ppm phosphate, which `SAFE_BOUNDS` itself calls out of bounds.
  Alkalinity at the same defaults triggers at 7.6/9.4, which is the behaviour
  the rule was written for.
- **TW-030 — salinity is not assessed at all.** `deriveTankState`
  (`src/App.jsx:142-162`) assesses three elements; salinity reaches no verdict.
  It has four disconnected fragments instead, and three different reference
  points for what "normal" is (34-36 band, a literal 35 in the skew finding,
  32-37 safe bounds).
- **TW-031 — confirmation before hiding a serious notice; every notice becomes
  hideable.** Names the two live behaviours §20 now overrules
  (`narrative-engine.js:394`, and the five dose claims at `:457-492`), and says
  to build it with TW-027.

TW-029 and TW-030 are each split into a buildable half (remove the wrong
reasoning; wire salinity in) and a half that needs Dan (what the right
reasoning is). §25 mints no phosphate, nitrate or salinity figures and forbids
inventing them, so filing them as ready-to-build would have been false.

## Verification

- `npm test` before the change: **69 failed / 279 passed (348)**, 32 failed /
  20 passed of 52 files — the same pre-existing `[chem]` failures the bug-3 run
  recorded.
- `npm test` after the change: **69 failed / 279 passed (348)** — identical, as
  expected for a docs-only change.
- `npm run build`: succeeds.
- `npm run verify`: `ALL BLOCKING CHECKS PASSED`. Two advisory checks still
  fail — `deadcode` and `csscheck`, the pre-existing TW-022 and TW-023, both
  untouched by this change.
- `npm run lint`: **does not exist** (`package.json` has no `lint` script). This
  is TW-024, open and unchanged; it could not be run and is not reported as
  passing.
- Every `file:line` written into canon or into a new backlog item was read
  before it was cited, and the two threshold figures above were computed with
  `node`, not eyeballed.

## Found while reading, not fixed

- **`.agent/backlog.md` has two items numbered TW-016** — the `correction.js`
  magnesium rail item under "Needs Dan's approval", and the "drift/drifting has
  three meanings" item further down. Not renumbered: an ID is referenced from
  run notes and PRs, and picking which one moves is Dan's call, not a tidy-up.
