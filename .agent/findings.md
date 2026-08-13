# Raw findings (pre-triage)

Auditors append here. triage-analyst empties this into the backlog each night.
Format: one block per finding.

```
### <agent> / <date> / <severity S1-S4>
what:
evidence: (command + output, or file:line)
impact:
suggested fix:
confidence: high|medium|low
```

<!-- 2026-08-13-build-1 triage-analyst pass: all 23 raw findings from tonight's
     wave-2 sweep processed. 9 fixed same-night (rounds A-E, PR #3 — see
     .agent/log/2026-08-13-build-1.md); 4 filed as new backlog items
     (breaker/S2 -> TW-019; static-analyst/S2 rate-limit ordering -> TW-020;
     domain-verifier/S1 Ca:alk ratio -> TW-021 [chem], also escalated to
     .agent/needs-dan.md; fixer round D's surfaced Setup.jsx sibling bug ->
     TW-022, no test yet); 2 filed as new [perf] items (bundle-budget breach
     -> TW-023; ZoomableLineChart unmemoized re-render -> TW-024); 4 folded
     into existing duplicates (magnesium-rail S1/S2 -> TW-016, repro list
     extended; banned-terminology S2 -> TW-017, repro line added); 2
     clean-bill/no-action (dataflow-tracer S3; perf-watchdog S4); 1 folded as
     a cross-reference (static-analyst S3 DoseChangeSheet unused props ->
     note added to TW-004). Also fixed the pre-existing TW-016 numbering
     collision: the unrelated "drift" terminology item is now TW-018. -->
