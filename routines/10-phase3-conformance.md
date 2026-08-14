# Routine 10 — Phase 3: Legacy Conformance

Run as a cloud routine. Read-only against `legacy/`. Writes tests and one
report. **Changes no application code.**

---

## What this phase answers

Yesterday the app was converted from one 16,278-line file into 57 modules. The
test suite did not come with it.

`legacy/` holds that suite: 41 checks, 5,940 golden cases, fingerprint
`37ded9064e91e80e`, all passing on the old code as of 14 August 2026.

Phase 2 built `src/test-surface.js`, which presents all 196 names those tests
expect. Verified: 196/196 found, zero renamed, zero missing, zero signature
differences.

**This phase runs those tests against the new code and reports what differs.**

---

## The mechanism

The legacy tests are CommonJS. Each begins:

```js
const L = require(path.join(__dirname, '..', 'build', 'engines.js'));
```

The new code is ES modules. So the tests need a CommonJS bundle of the new
code, in the same shape.

1. Bundle `src/test-surface.js` into CommonJS with esbuild →
   `build/engines-new.cjs`. It must expose the same 196 names.
2. Copy the legacy tests to `tests/legacy-port/`, changing **one line each** —
   the require path, pointed at the new bundle.
3. Run them.

**The only permitted edit to a copied test is the require path.** Nothing else.
Not a threshold, not an expected value, not a skipped case.

---

## THE RULES

**1. Never edit a test to make it pass.** A failing legacy test is the entire
product of this phase. Editing one destroys the finding.

**2. Never edit `golden.json`.** Not one case. If the fingerprint differs, the
report says so and lists which cases moved. Regenerating it converts a safety
net into a rubber stamp.

**3. Never edit anything under `legacy/`.** AGENTS.md #9. Copy out, work on the
copy.

**4. Never touch application code.** Not to fix a failure, however obvious. File
it.

**5. Never adjust the bundle to smooth a difference.** Same rule as the adapter.
Bundling only.

If you find yourself reasoning toward "this test is wrong" — stop. Report it as
a difference and let Dan decide.

---

## Order of work

### Step 1 — golden first, before anything else

`legacy/tests/golden.js` against the new bundle. One number comes back.

- **`37ded9064e91e80e`** → the maths survived the conversion intact. Say so
  prominently.
- **Anything else** → list every case whose output changed: the inputs, the old
  output, the new output.

Report this before running anything else, in case you run out of time or
context. It is the single most valuable output of the phase.

### Step 2 — the rest

`husbandry`, `matrix`, `summary`, `protocols`, `crosstalk`, `invariants`,
`derivation`, `briefing`, `units`, `shared`, `strips`, `popup`, `hiding`,
`malformed`, `robust`, `tanks3`, `verify_math`, `surfaces-agree`, `fuzz3`,
`perf`, then `sim/*`.

Run each separately. Record pass or fail and the output.

### Step 3 — classify every failure

Three buckets. **Do not guess — where you cannot tell, say so.**

**A. Known deliberate change (13 August).** Four defect fixes landed:
- magnesium `defaultStrength` 1.0 → 0.024
- `doseStatus` inverted increase/decrease branch
- `volumeL` no longer falls back to 77
- 325 seed readings and 2 ICP panels removed

Phase 2 confirmed five constants and seven functions differ, and mapped most to
these four. A failure is only bucket A if you can trace it to a specific one.
"Probably related" is bucket C.

**B. Conversion regression.** The split changed behaviour nobody intended. Give
the failing assertion, the legacy behaviour, the new behaviour, and your best
guess at which module did it.

**C. Cannot determine.** Say what you tried.

### Known non-issues

- **`NAV`** — `build_harness.py` stubs icon components to null, so legacy NAV
  holds nulls where the app has real components. A harness artifact, not a
  regression.
- **The three `assess*` functions** replaced a hardcoded "Set your tank volume
  and X solution strength…" string with `missingDoseInputs()`. Any legacy test
  asserting that exact sentence will fail on wording. Report it as its own
  category — Dan will decide whether the new wording stands.
- **The project's own Vitest suite currently has 69 failures across 32 files.**
  Pre-existing, unrelated, not this phase's business.

---

## Output

`.agent/phase3-conformance.md`:

1. **The golden fingerprint.** First line. Match or not.
2. **Counts** — tests run, passed, failed; failures per bucket.
3. **Bucket B in full** — the important section. Ranked by how much a user
   would notice. Each with the failing assertion, both behaviours, and the
   suspected module.
4. **Bucket A**, each mapped to its specific known change.
5. **Bucket C**, with what you tried.
6. **The wording category**, separately.
7. **Anything that would not run at all**, and why.

Terse. One person is reading this to make decisions.

---

## What a good result looks like

Fingerprint matches, most suites green, a handful of failures all traceable to
the four known changes.

**A bad result is not a failed phase.** If the fingerprint differs and forty
tests fail, that is forty real problems found before they reached a tank —
which is what this whole exercise exists to do. Report it plainly. Do not
soften it, and do not fix any of it.
