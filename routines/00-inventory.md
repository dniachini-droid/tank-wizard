# Routine 0 — Inventory  (run this ONCE, first, before anything else)

Read-only. Changes nothing. Tells you what you actually have.

Run it as a routine, or paste it into a `claude` session on your laptop.

---

You are producing an inventory of the Tank Wizard codebase. **Do not change any
code. Do not create a branch. Do not open a pull request.**

Context: this app was built over many rounds inside Claude conversations, with
no test suite. Nothing in it has been independently verified. Assume nothing
about it works as intended until you have read the code.

Read `AGENTS.md` and `docs/spec/` first so you know what the app is supposed
to do, then work through the code and write `.agent/inventory.md` covering:

## 1. What exists
Every screen, every major component, what each one is for. One line each.

## 2. Where the important logic lives
File paths for: dose calculation, band classification, unit conversion, storage
and persistence, the dosing wizard, manual dose entry, the test log. If any of
these doesn't exist, say so plainly — that's the most valuable line in the report.

## 3. What's incomplete
Stubs, placeholders, `TODO` comments, functions that return hardcoded values,
components that render but do nothing, buttons wired to nothing.

## 4. Signs of conflicting edits
This app was edited many times without verification. Look specifically for:
- the same feature implemented twice in different places
- two functions that do nearly the same thing with different logic
- code that looks copied from elsewhere and only partly adapted
- config or state that nothing reads
- comments describing behaviour the code no longer has

For each, say which version appears to be the live one.

## 5. Distance from the spec
Compare what exists against `docs/spec/reef-chemistry.md` and
`docs/spec/surfaces-and-messaging.md`. Don't fix anything — just list the gaps,
biggest first. Be specific: "no net-volume field exists, doses are calculated on
a hardcoded 77" is useful; "chemistry needs work" is not.

## 6. Can it be trusted right now?
A direct answer. If you found anything that could produce a wrong dose
recommendation, lead with it and name the file and line.

## 7. What I'd do first
Five items, ordered, that would most improve the app's correctness. For each:
what, why, and roughly how big.

---

## Rules

- Read broadly before concluding. Use the Explore subagent for the sweep.
- Evidence for every claim: file and line. No impressions.
- Where you are unsure, say so. "I could not determine how X works" is a useful
  finding, not a failure.
- No praise, no narration, no summary of your own process.
- Write for someone who built this app but has not read it end to end.
