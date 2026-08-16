# Run log — 2026-08-15-phosphate-nitrate

Routine: `routines/20-phosphate-nitrate.md` (written this run, then executed).
Item: `.agent/backlog.md` TW-029, the buildable half only. Authorisation: Dan's
direct instruction of 15 August 2026 (TW-029 itself is untagged, deliberately —
the instruction authorises the removal half; the reasoning half stays his).
Branch: `claude/phosphate-nitrate-routine-7lovsr`, from `dc38fd6`.

## Step zero

Scanned `.agent/runs/` — no `in-progress`/`interrupted` runs (the grep hit on
README.md is its own prose). Clean start.

## Pre-change verification (evidence rule)

TW-029's arithmetic re-verified at `dc38fd6` against the pre-change bundle
(`npx esbuild src/test-surface.js --bundle … build/engines-new.cjs`, then a
node probe over `buildFindings`):

```
phosphate 0      []                — SAFE_BOUNDS min 0.01, still silent
phosphate 0.169  []
phosphate 0.171  ["phosphate is well above your target"]
nitrate   0      []
nitrate   24.9   []
nitrate   25.1   ["nitrate is well above your target"]
nitrate   100    ["nitrate is 100.0ppm — dangerously high"]
```

Matches TW-029 exactly: fires high at ≥0.170 / ≥25, low side unreachable
(−0.040 / −5 at the default bands). The new test's climb scenarios were also
run against the pre-change bundle and both fired
(`heading-out-phosphate`, `heading-out-nitrate` at-edge variant) — the test
would have caught the defect.

Baseline `npm test`: 64 failed / 474 passed across 68 files (failure list
saved and diffed later).

## Changes

- `src/lib/findings.js` — exported `NUTRIENTS_AWAITING_OWN_RULES`
  (`phosphate`, `nitrate`) with the §25/§12 reasoning and the
  unreachable-low arithmetic in its comment; both the `far-out-*` loop and
  the `heading-out-*` loop now `continue` on it. Salinity deliberately left
  in the loops (TW-030's decision). No constant, band or formula changed.
- `src/lib/dosing/helpers.js` — comment only, at `correctionProgress`'s
  `noiseFloor` read: the percent-mode entries would be misread as absolute
  and would bind at phosphate's default band (0.04 vs bandWidth/3 = 0.0233,
  zone 57% of the band vs §9's middle third). No behaviour change.
- `src/test/defects/phosphate-nitrate-borrowed-reasoning.test.js` — new, 8
  tests: far-out absent across a 0→extreme sweep for both keys;
  heading-out absent on the exact climb shape strips.js used to require a
  flag for; positive controls (alkalinity far-out still fires,
  `nutrient-starved` still fires, `paramStatus` still says high/low); set
  contains exactly the two keys.
- `tests/legacy-port/strips.js` — trend-resolution block inverted per the
  decision: old expectation "a measurable in-range drift MUST produce
  heading-out" (pins the defect) → new expectation "no drift of any size
  may" (pins the removal). Old and new expectations recorded in the block
  comment with the citation. AGENTS.md #4: behaviour change under an owner
  decision, not a test bent to pass.
- `tests/legacy-port/husbandry.js` — ONE expectation suspended, not
  deleted: "nitrate 80 is excessive". The only path that ever produced an
  urgent nitrate claim was the removed far-out loop (band-scaled trigger,
  SAFE_BOUNDS escalation); canon has no nitrate upper-warning figure (§2's
  table covers the three dosed elements only), so the expectation is
  unimplementable without inventing a threshold, which §25 forbids.
  Comment in place; re-enable when the canon entry exists. This is the one
  real cost of the removal and is stated in needs-dan item 10 and the PR
  risk section. 18 of 19 best-practice rules still assert.
- `routines/20-phosphate-nitrate.md` — the routine itself.
- `.agent/needs-dan.md` — item 10: nine decisions, worked up per AGENTS.md
  #10, both layers per #11. Includes the three-option workup of the
  noise-floor unit question and the drift-claim direction-language flag.
- `.agent/backlog.md` — TW-029 annotated with the executed split; item
  stays open.

## Not done, deliberately

- No replacement reasoning of any kind: no SAFE_BOUNDS-triggered stand-in,
  no 0.03 floor warning, no count mechanism, no nitrate trend rule. §25.
- No fix to the noiseFloor unit misread (three chemistry options, Dan's).
- No touch on salinity's passage through the loops (TW-030), the `drift:`
  claims (stability layer's own rules; flagged to Dan), or the
  nutrient-specific findings.
- No domain-verifier dispatch: the chemistry judgement implemented here is
  Dan's own, quoted in §25; nothing new is claimed about reef chemistry.

## Gates

- `npm run lint` — **not configured** (no `lint` script in package.json);
  recorded rather than claimed.
- `npm run verify` — ALL BLOCKING CHECKS PASSED (first run failed on
  husbandry's now-unimplementable expectation, handled above; deadcode and
  csscheck advisory failures are pre-existing and untouched — deadcode
  names three component useMemos, none of them this change).
- `npm test` — 64 failed / 482 passed. Failure list diffed against the
  pre-change baseline: **identical set** ("IDENTICAL FAILURE SET"), all 64
  pre-existing labelled chemistry gaps. The 8 new tests all pass.
- `npm run build` — passes (runs inside verify as its first blocking step).
