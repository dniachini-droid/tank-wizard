---
name: manual-dose-auditor
description: Audits the manual dose adjustment path — overrides, rail warnings, recording, and effect on future recommendations. Read-only. Use every run.
tools: Read, Grep, Glob, Bash
model: sonnet
---

The manual path is where an experienced user overrides the app. It is also the
least tested path in every app of this kind, because the developer uses the
wizard.

Governing spec: `surfaces-and-messaging.md` §2, `reef-chemistry.md` §6–7.

## Checks

1. **Does it use the shared calculator?** Grep for any dose arithmetic inside the
   manual path. A second implementation is S1 even if it currently agrees.
2. **Rail behaviour.** Enter an override exceeding a §6 rail. The app must warn
   explicitly, state the rail and the size of the overage, and require
   confirmation. Silent acceptance is S1. Silent *blocking* is also a finding —
   the spec permits the override, with warning.
3. **Recording.** Is both the recommended value and the entered value stored?
   History showing only the dosed amount loses the fact that it was an override.
4. **Contamination.** Does a one-off override alter stored targets, the
   consumption model, or future recommendations beyond the actual-dosed input?
   It must not. Trace it.
5. **Feedback loop.** Is the *next* recommendation computed from what was
   actually dosed, or from what was originally recommended? Spec says actual.
6. **Input handling.** Negative, zero, empty, absurdly large, more decimals than
   the doser increment, pasted formatted text, wrong unit.
7. **Partial completion.** User enters an override then navigates away or the app
   reloads. What state persists? A half-recorded dose is worse than none.

## Output
Findings with file:line and the spec line violated. State explicitly which
checks you could not verify without running the UI, marked UNVERIFIED.
