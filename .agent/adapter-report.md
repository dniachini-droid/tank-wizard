# Phase 2 — Test Surface Adapter Report

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

14 August 2026. Adapter written to `src/test-surface.js`. One new file, no
application code touched, nothing under `legacy/` or `docs/spec/` modified.

---

## 1. Counts

| Outcome  | Count |
| -------- | ----: |
| found    |   196 |
| renamed  |     0 |
| split    |     0 |
| merged   |     0 |
| missing  |     0 |
| **total**| **196** |

All 196 legacy names exist in `src/` under **exactly the same name**. No
renames, splits or merges had to be inferred, so none of the guesswork the
routine warns about was needed.

Each name resolves to exactly one exported binding — there are no duplicate
exports of the same name anywhere in `src/`, so no ambiguity about which module
a name should come from. The 196 come from 40 modules.

### How the match was checked

1. Every `export` in `src/` (excluding tests) was extracted and diffed against
   `.agent/legacy-exports-196.txt` — 196 of 196 matched by name, 0 duplicates.
2. The adapter was loaded through the project's own jsdom/vitest environment.
   All 196 exports resolve to a value that is not `undefined`, the module has
   exactly 196 exports (no extras, no default), and every one is of the kind the
   legacy list declares — all 140 `fn` are functions, all 56 `val` are non-functions.
3. `legacy/build/engines.js` was loaded (read-only, copied out to a scratch
   `.cjs` so `require` would treat it as CommonJS) and compared name by name
   against the adapter. **All 196 agree on `typeof`, and all 140 functions agree
   on declared arity (`Function.length`).** Zero signature differences.

So there is no missing list and no different-signature list. The adapter needed
no judgement calls, and it contains nothing but `export … from` statements.

## 2. Missing list

**Empty.** Nothing on the legacy list is absent from the new code.

## 3. Renamed list

**Empty.**

## 4. Split and merged

**Empty.** No legacy name maps to more than one new function, and no two legacy
names collapse into one.

---

## 5. Things I am not resolving — for Dan

The adapter's job is the surface, and the surface is clean. But while proving
the matches were real I also compared *contents*, and that turned up a small set
of genuine behavioural differences. Phase 3 decides what they mean; they are
listed here so nothing arrives as a surprise. **I have not changed any of them
and the adapter does not paper over any of them.**

Method: every function was compared as normalised source text (comments and
whitespace stripped, plus the two Vite-SSR transform artefacts — cross-module
identifiers rewritten to `__vite_ssr_import_N__.name`, and esbuild's `1e3` /
`void 0` / trailing-comma / paren reflow). Every constant was compared as
serialised JSON.

### 5a. Constants that differ — 5 of 56

| Constant | Legacy | New | Reading |
| --- | --- | --- | --- |
| `DOSE_ELEMENTS` | magnesium `defaultStrength: 1` | `0.024` | **Known deliberate change #1.** Everything else in the array is identical. |
| `DEFAULT_SETTINGS` | `volumeL: 77` | `volumeL: null` | **Known deliberate change #3.** All other fields identical. |
| `HISTORICAL_DATA` | 7 param arrays, **325** readings total | `{}` | **Known deliberate change #4.** The count matches the stated 325 exactly. |
| `ICP_SEED` | **2** panels | `[]` | **Known deliberate change #4.** Count matches. |
| `NAV` | `icon: null` on all six | real icon components | **Not a real difference.** `build_harness.py` stubs the 32 icon components to `null` before building `engines.js`. The ids and labels are identical. Any legacy test asserting `icon === null` is asserting a harness artefact, not app behaviour — worth knowing before Phase 3 reads a failure there as a regression. |

The other 51 constants are byte-identical.

### 5b. Functions whose behaviour differs — 7 of 140

122 of the 140 are identical once transform noise is removed. Of the 18 that
differ textually, 11 are pure formatting (esbuild reflow, and one local variable
renamed `d` → `d2` in `readingGeometry` to avoid shadowing). The 7 real ones:

**Accounted for by the known 13 August changes:**

1. `doseStatus` — one branch reads `a.action === "decrease"` where legacy read
   `"increase"`. **Known deliberate change #2**, and the only difference in the
   function.
2. `computeDoseCalc` — `const litres = s.volumeL || 77` → `const litres = s.volumeL`,
   and the guard tightened to `!(litres > 0)`. **Known change #3.**
3. `calibrateDoseStrength` — same `|| 77` fallback removed, plus a new early
   return `{ status: "novolume", key }`. **Known change #3**, though the new
   return shape is a detail the known-changes list does not spell out — a legacy
   test that expects a different shape here will fail for that reason, not
   because a number is wrong.
4. `computeCorrection` — gains `if (!(volumeL > 0)) return null;`. **Known
   change #3.**

**Not literally on the known list — flagging, not resolving:**

5. `assessAlkalinity`
6. `assessCalcium`
7. `assessMagnesium`

   All three replace a hardcoded string —
   `"Set your tank volume and <element> solution strength in Setup before this can be calculated."`
   — with a call to a new shared helper, `missingDoseInputs(settings, label, strengthField)`
   in `src/lib/dosing/helpers.js`. The helper names only the inputs that are
   actually missing and appends an extra sentence about net volume. It is
   plainly *adjacent* to known change #3 (it exists to say why the app is
   refusing to dose), and its comment cites reef-chemistry.md §2 and §7.6 — but
   it is a wording change beyond what the four known changes describe, and any
   legacy test asserting that exact sentence will fail. **Dan decides whether
   that is intended.** `missingDoseInputs` is itself a new export not on the
   legacy 196; the adapter does not export it, because the legacy list does not
   ask for it.

Everything else — all 133 remaining functions and 51 remaining constants —
matches the legacy bundle exactly.

### 5c. Two caveats on the evidence above

- **Arity is a weak signal on its own.** Default parameters and rest params
  reduce `Function.length`, so identical arity does not prove identical
  parameter lists. It matched for all 140, which is reassuring, but the real
  proof is Phase 3.
- **Identical source text is not identical behaviour.** A function that is
  byte-identical can still behave differently if a constant or helper it closes
  over changed. `assessAlkalinity` and friends read `DEFAULT_SETTINGS`, which
  did change. Text comparison narrows where to look; it does not settle
  anything.

### 5d. Unrelated observation

`npm test` on the project's own suite currently reports **69 failing tests
across 32 files** (192 passing). This is pre-existing and has nothing to do with
the adapter — verified by running the suite with `src/test-surface.js` removed
and getting the identical result. Nothing was imported by anything as a result
of this phase. Filed here rather than acted on.

---

## Out of scope, as instructed

- Legacy tests not run — Phase 3.
- Nothing fixed.
- `legacy/` untouched (read only; `build/engines.js` was copied out to scratch
  to be loaded, never modified).
- `docs/spec/` untouched.
- No application code changed. `git status` shows exactly one new file,
  `src/test-surface.js`.
