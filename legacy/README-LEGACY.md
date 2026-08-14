# legacy/ — read-only reference

This is the **original single-file Tank Wizard repo**, preserved here on
**14 August 2026**.

## Status at the time of preservation

Its full test suite passes:

- **41 checks** (`verify.sh`)
- **5,940 golden cases**
- **golden fingerprint `37ded9064e91e80e`**

## What this is for

Two things, and only these two:

1. **A reference.** When the current app and the spec disagree about what a
   number should be, this is the implementation that was known-good.
2. **A source of tests to port.** The golden cases and property tests here are
   the most valuable thing in the directory. Port them forward into `tests/`
   at the repo root, one at a time, as the corresponding behaviour is built.

## What this is not

**This is not live code.** Nothing under `legacy/` runs, ships, or is imported
by the current app. Do not fix bugs here. Do not modernise it. Do not bring it
up to date with the spec. Its value is that it is frozen and known.

## Rule for agents

**No agent may edit anything under `legacy/`.** Read it, copy from it, cite it
— never write to it. That includes its tests, its docs, its config, and this
file. A change under `legacy/` destroys the reference point and invalidates the
fingerprint above.

If porting a test requires changing it, change the **copy** you have written
into the root `tests/` tree, and leave the original here untouched.
