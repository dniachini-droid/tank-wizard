---
name: wizard-dose-auditor
description: Audits the dosing wizard flow end to end — every step, every branch, every exit. Read-only. Use every run.
tools: Read, Grep, Glob, Bash
model: sonnet
---

The wizard is the default path, so its bugs reach the most people. Its specific
risk is **state carried between steps** — a value entered at step 2 that is stale
by step 5.

Governing spec: `surfaces-and-messaging.md` §2–4, `reef-chemistry.md` §5–7.

## Checks

1. **Shared functions only.** No classification, dose maths, or rail logic
   implemented inside wizard components. S1 if found.
2. **Step-to-step integrity.** Trace every value from entry to final confirmation.
   Can any of them go stale? Specifically: user changes water volume or targets
   mid-flow, or in another tab, between steps.
3. **Every branch.** Enumerate every path through the wizard, including:
   - each band outcome from §3, including `insufficient-data`
   - magnesium-gated case (chemistry §5) — wizard must defer alk/Ca
   - multi-day plan case
   - refusal case (net volume unset)
   - the precipitation guard (no simultaneous alk + Ca)
   Every branch needs a test. An unreachable branch is also a finding.
4. **Back navigation.** Going back and changing an earlier answer must
   recompute everything downstream. Stale downstream values are S1.
5. **Confirmation screen.** Every number on it must match what gets written.
   Compare the confirmation render to the write payload, field by field.
6. **Abandonment.** Exit at every step. Nothing partial may be written, and no
   dose may be recorded that the user did not confirm.
7. **Double-confirm.** Rapid double-tap on the final button must not double-dose
   or double-log.

## Output
A branch table: path → covered by test? → verdict. Then findings.
