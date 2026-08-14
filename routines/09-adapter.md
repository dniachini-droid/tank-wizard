# Phase 2 — The Test Surface Adapter

**Watched session. Not a routine.** Dan is present and approving each step.

Goal: let the legacy test suite run against the new modular code, unchanged.

---

## Background

`legacy/` holds the original single-file app and its full test suite — 41
checks, 5,940 golden cases, fingerprint `37ded9064e91e80e`, all passing as of
14 August 2026.

Those tests do not read the app directly. They read a generated bundle,
`build/engines.js`, produced by `legacy/tools/build_harness.py`, which exports
**196 names** — 140 functions and 56 constants.

The tests only care that those names exist and behave the same. They do not
care where they come from. So if the new modular code can present the same 196
names, the entire legacy suite becomes a conformance test on the conversion.

The full list is at `.agent/legacy-exports-196.txt`.

---

## THE RULE THAT MATTERS MOST

> **The adapter may only re-export. It may never reimplement, wrap, patch,
> shim, adjust or "fix" anything.**

If a name doesn't exist in the new code, it goes on the missing list. If it
exists but has a different signature, that goes on a list too. **Do not bridge
the difference.**

Every difference you paper over destroys the evidence this phase exists to
gather. A test that fails because the conversion dropped something is the most
valuable output of this whole exercise. An adapter that hides it is worse than
no adapter.

If you find yourself writing logic — any logic — in the adapter, stop and
report instead.

The only acceptable content in `src/test-surface.js` is import and export
statements.

---

## Steps

### 1. Read the target list

`.agent/legacy-exports-196.txt`. Each line is `fn` or `val` then the name.

### 2. Find each one in the new code

Search `src/`. For each of the 196, record:

- **found** — file and exported name
- **renamed** — found under a different name; give both, and say how you know
  it's the same thing
- **split** — one legacy name is now several functions
- **merged** — several legacy names are now one
- **missing** — not present anywhere

Be careful with **renamed** and **split**. Only claim a match you can justify
by reading the code. A guess here contaminates everything downstream. If you
are not sure, mark it **missing** and let Dan decide — a false negative costs a
conversation, a false positive costs a wrong conformance result.

### 3. Write the adapter

`src/test-surface.js`. Re-exports only, in alphabetical order, grouped by
source module with a comment naming each.

Include only the names you found. Leave the rest out — an adapter that exports
`undefined` for a missing name produces a confusing failure rather than a clear
one.

### 4. Check it loads

Confirm the file imports cleanly and every export resolves to something that
isn't `undefined`. Do not run the legacy tests yet — that's Phase 3.

### 5. Report

Write `.agent/adapter-report.md`:

1. **Counts** — found, renamed, split, merged, missing
2. **The missing list**, with what each one did in the legacy code and how
   significant its absence looks. Rank by significance.
3. **The renamed list**, old name → new name, and your evidence
4. **Split and merged**, with an explanation of each
5. **Anything you were unsure about**, listed plainly rather than resolved

---

## What the result will probably look like

Most of the 196 will be found. Some rename is expected — the conversion split
one file into 57 modules and some tidying almost certainly happened.

The interesting output is the missing list. Anything on it either:

- was dropped in the conversion — a real regression, and now visible
- was deliberately removed on 13 August — four defect fixes landed that day
- was dead code the conversion correctly pruned

**Do not guess which.** Report; Dan decides.

---

## Known deliberate changes from 13 August 2026

These four are expected to differ and are not conversion bugs:

1. magnesium `defaultStrength` 1.0 → 0.024 (a 42× error, verified against the
   product label)
2. an inverted increase/decrease branch in `doseStatus`
3. `volumeL` no longer falls back to 77 — the app now refuses to dose when net
   volume is unset
4. 325 fabricated seed readings and 2 fabricated ICP panels removed

If something in this list explains a difference, say so. Do not use them as a
general excuse for differences you cannot otherwise account for.

---

## Out of scope

- Do not run the legacy tests. Phase 3.
- Do not fix anything you find. File it.
- Do not edit anything under `legacy/`. AGENTS.md non-negotiable #9.
- Do not edit `docs/spec/`.
- Do not touch application code at all. This phase adds exactly one new file.
