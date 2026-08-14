# Phase 3 — Legacy Conformance Report

14 August 2026 (run continues from Phase 2). Read-only against `legacy/`.
Nothing under `legacy/` or `docs/spec/` modified. No application code changed.

---

## 0. Reproducing the bundle

`build/` is gitignored — it's a generated artifact, not checked in. Rebuild
it before running anything in `tests/legacy-port/`:

```
npx esbuild src/test-surface.js --bundle --platform=node --format=cjs \
  --outfile=build/engines-new.cjs \
  --banner:js='global.window=global.window||{storage:null,localStorage:null,matchMedia:()=>({matches:false})};' \
  --loader:.jsx=jsx
```

The banner mirrors — does not alter — the same `window` stub
`legacy/tools/build_harness.py` bakes into `legacy/build/engines.js`, so both
harnesses run under an identical shim. `legacy/build/engines.js` itself was
never rebuilt in place: `legacy/tools/build_harness.py` was copied to a
scratch directory outside `legacy/` and run there, per AGENTS.md #9.

---

## 1. Golden fingerprint — MATCH

```
golden: 5940 cases unchanged (37ded9064e91e80e)
```

**`37ded9064e91e80e` — identical to the legacy value.** All 5,940 golden cases
in `legacy/tests/golden.json` (untouched) produce byte-identical output from
the new bundle. The maths survived the module split intact, for every case
this sweep covers.

Caveat worth stating plainly: `golden.js` builds every synthetic tank with
`volumeL: 77` and an explicit dose strength for each element (including
`mgPpmPerMlPer100L: 0.024` for magnesium) — see lines 82–83 and the `cfg`
table at the top of the file. That sidesteps all four of the 13 August
changes at once: the `volumeL` fallback removal never fires because
`volumeL` is always supplied, and the magnesium `defaultStrength` change
(1.0 → 0.024) never fires because the strength is always supplied too. The
fingerprint match is real, but it is not evidence that those two changes are
absent from user-facing behaviour — golden.js was never able to see them
either way.

---

## 2. Counts

26 legacy files run against `build/engines-new.cjs` (esbuild CJS bundle of
`src/test-surface.js`, banner-stubbed with the same `window` shim
`build_harness.py` bakes into the legacy harness).

| Outcome | Count | Files |
| --- | ---: | --- |
| Passed, 0 failures | 21 | golden, husbandry, matrix, summary, protocols, crosstalk, invariants, derivation, briefing, units, shared, strips, hiding, malformed*, robust, verify_math, surfaces-agree, fuzz3, perf, sim/smoke, sim/years |
| Fixture/helper, no assertions, loaded clean | 4 | tanks3, sim/rng, sim/surfaces, sim/longrun |
| Could not run | 1 | popup |

**Failures: 0.** Buckets A, B and C are all empty — no legacy test produced a
result that disagrees with the new code.

\* `malformed` passed but is flagged below — not a failure, but not silent
either.

---

## 3. Bucket B — conversion regressions

**Empty.** No suite found a behavioural difference the split introduced.

---

## 4. Bucket A — known deliberate changes (13 August)

**Empty of failures**, for the reason given in §1: nothing in this suite
exercises the trigger conditions for any of the four changes.

- Magnesium `defaultStrength` 1.0 → 0.024 — never fires; every suite that
  touches magnesium assessment supplies an explicit strength.
- `doseStatus` increase/decrease branch flip — not caught by anything in this
  run. Worth a targeted look outside this suite if Dan wants direct proof.
- `volumeL` no longer falls back to 77 — never fires; every settings object
  built by these suites sets `volumeL` explicitly (`robust.js`'s "volume of
  0" case is a different, deliberate value, not an absent one).
- 325 seed readings / 2 ICP panels removed — none of these suites read
  `HISTORICAL_DATA` or `ICP_SEED`; they all generate synthetic tanks.

None of this means the four changes are safe in the live app — only that
this legacy suite was never positioned to see them, in either direction.

---

## 5. Bucket C — cannot determine

**Empty.**

---

## 6. Wording category (`missingDoseInputs`)

Checked: no file in `legacy/tests/` (or its copy in `tests/legacy-port/`)
asserts the old hardcoded sentence `"Set your tank volume and … solution
strength …"`. `grep` for both that string and `missingDoseInputs` across both
trees returns nothing. So the wording change Phase 2 flagged in
`assessAlkalinity`/`assessCalcium`/`assessMagnesium` produced zero failures
here — not because it's fine, but because nothing in this suite checks that
sentence. Dan's decision from the adapter report still stands, un-tested by
Phase 3.

---

## 7. Could not run

**`popup.js`** — `ENOENT: open '.../tests/src/reef-console.jsx'`.

The test doesn't only use the engine bundle — line 18 reads the legacy
monolith's JSX source directly (`path.join(__dirname, '..', 'src',
'reef-console.jsx')`) and greps the literal text of `function
LogResultPopup(...)` to compare the fields a verdict carries against the
props the component reads. That file doesn't exist post-split; the component
now lives in `src/components/ReadingConfirmation.jsx`, under the same
function name, alongside code the popup test never asked to read. Rule 3
("only permitted edit is the require path") doesn't cover this — pointing it
at a different file and a different extraction pattern would be rewriting
the test, not porting it. Filed as unrunnable, not fixed, not skipped
silently.

---

## Other observations (not failures, not bucketed)

**`malformed.js`** passed (0 failures) but printed three copies of this
during its restore-backup checks:

```
storage bridge save failed readings ReferenceError: localStorage is not defined
    at Object.set (build/engines-new.cjs:6770:7)
    at saveKey (build/engines-new.cjs:6836:28)
    at Object.restoreBackup (build/engines-new.cjs:7091:11)
```

Verified this is not a harness artifact: running the same file against the
**legacy** `build/engines.js` (identical `window` stub, same scratch rebuild)
produces no such error — legacy's `saveKey` sees `window.storage === null`
and skips straight to the `localStorage` fallback, which fails silently and
is caught.

The difference is real and traces to new code: `src/lib/storage.js` opens
with

```js
// Inside Claude, window.storage already exists. Standalone, fall back to
// localStorage so logs still persist between visits on this device.
if (!window.storage) { window.storage = { ...fallback methods using bare `localStorage`... } }
```

which has no counterpart anywhere in `legacy/src/reef-console.jsx` (checked
— no match for "window.storage already exists" or the init guard). This
shim is new since the conversion: it makes `window.storage` truthy where
legacy leaves it `null`, so `saveKey` now attempts the bridge branch, which
throws on the bare `localStorage` global this Node harness doesn't provide,
gets caught, and falls through to the same silent local-storage failure
legacy takes directly. End result for the test is identical (save fails,
caught, no crash) — that's why it's not a bucket item — but it is a new code
path with no legacy analogue, added intentionally per its own comment for
"standalone" operation outside Claude's storage bridge. Not on the four
known-changes list. Worth Dan's eyes since it changes what a storage failure
looks like in the console, even though no test here is sensitive to it.

---

## Summary for Dan

- **Fingerprint matches.** Read §1's caveat before treating that as full
  coverage of the four known changes — golden.js's fixtures don't exercise
  two of them.
- **Zero test failures** across 21 runnable suites (5,940 golden cases +
  everything else). This is the good outcome the routine describes.
- **One test can't run post-split** (`popup.js`) — reads the old monolith
  source directly; needs a human decision on whether/how to port it, not a
  require-path fix.
- **One new, legacy-absent code path** found by accident in `malformed.js`'s
  output (the standalone storage shim) — didn't fail anything, but is new
  behaviour nobody asked this phase to evaluate.
- **The `missingDoseInputs` wording change** (Phase 2, §5b) remains
  untested by this suite — still an open decision for Dan, not resolved
  here.
