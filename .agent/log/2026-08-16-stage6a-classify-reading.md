# Run log — Stage 6a, `classifyReading`

run: 2026-08-16-stage6a-classify-reading
routine: `THE-ENGINE-PLAN-v2.md` Stage 6a

## What ran

**Canon read, first and only source.** `reef-chemistry.md` §2, §4, §5, §10,
§11, §12, §18, §19, §22, §23, §26, §27, §29, §30, §31; `wizard-states.md` §13,
§15, §22, §24 (24.2–24.5, 24.27), §25.2. `.agent/gap-report.md` Part 4 for what
canon already answers and Part 2 for what it does not. **No file in
`src/lib/analytics/`, `src/lib/dosing/`, `src/lib/findings.js`,
`src/lib/narrative-engine.js` or `src/lib/stability-engine.js` was read for its
reasoning** — the governing rule.

**Test-first.** `src/test/spec/classification/classify-reading.test.js` written
and run red (module absent) before `src/lib/classify/classify-reading.js`
existed.

**Mutation-checked rather than assumed.** Seven mutations applied to the
implementation one at a time and the suite re-run:

| Mutation | Tests killed |
|---|---|
| clearly-out compares `>` instead of `>=` | 2 |
| the rate limb compares `>=` instead of `>` | 1 |
| alkalinity's noise floor 0.1 → 0.05 | 4 |
| the three-reading minimum → two | 2 |
| magnesium's alert-low floor removed | 1 |
| `drifting` ignores movement | 1 |
| `directionHeld` loses its reversal test | 1 |
| `directionHeld`'s final `sign !== 0` → `true` | **0 — equivalent mutant** |

The survivor is equivalent, not a coverage hole: a series whose every step is
flat has a total of zero, which is below every floor, so the second limb refuses
either way.

## Result

- **`npm run verify` exit 0**, all blocking checks pass. The two advisory
  failures (`deadcode` on `Tasks.jsx:27`, `csscheck`) are byte-identical to the
  baseline taken before any change.
- **The golden fingerprint held at `3a782222dbce41c5`** — unchanged before and
  after, which is the plan's own test that this stage did not reach further than
  intended. The engines were not touched.
- **`npx vitest run`: 46 failed / 706 passed.** Before the change, on the same
  tree: 46 failed / 602 passed, across an **identical set of 26 failing files**.
  The 46 are the pre-existing, already-labelled spec-violation tests
  `scripts/verify/run.mjs` documents; the 104 new assertions all pass.
- **One blocking check had to be satisfied by rewording, not by code.**
  `linkcheck` reads a word directly against `(` inside a single-quoted string as
  a function call; a refusal message reading `a maximum (§2 layer 2)` resolved
  to nothing. Both such messages now use an em dash. No logic changed.

## Deliverables

| File | What |
|---|---|
| `src/lib/classify/classify-reading.js` | the function and canon's tables, each cited |
| `src/test/spec/classification/classify-reading.test.js` | 104 assertions, every vector quoted from canon |
| `.agent/stage-6a-gaps.md` | **twenty findings** — where canon could not answer |
| `.agent/items/TW-079.md` | the item, `status: done` |

## Nothing was changed outside those four paths

No surface, no classifier, no engine, no constant, no spec file. Nothing calls
the new function.

## What the next stage needs to know

`.agent/stage-6a-gaps.md` is the whole of it, and one finding gates a surface:
**§22 registers six steadiness verdicts and names no threshold for any of them**,
so the verdict refuses for every parameter today and Stage 6c has nothing to
render on the steadiness panel until the owner supplies two figures per
parameter and one choice of measure. Everything else — the seven bands,
movement, out and clearly out — is answered.

## In plain terms

The one piece of code that decides where a reading sits is built and tested,
written only from your own written rules. It is not wired to anything yet, so
nothing on your screen has changed, and the five-thousand-tank fingerprint that
proves the dosing maths is untouched has not moved.

Twenty questions came up that your rules do not answer. The biggest one is that
you have six phrases for how steady a parameter has been and no numbers behind
any of them — so for now the app says it cannot grade steadiness rather than
guessing. They are all written up for you with options and what each one costs.
