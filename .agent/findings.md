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

### domain-verifier / 2026-08-13 / S3
what: computeSkeletonMass's missing-volume guard is `!volumeL`, not
`!(volumeL > 0)` — a negative volumeL slips past it and produces a negative,
nonsensical mass figure instead of refusing. The sibling fix in the same
commit (consumption.js's predictAfterChange) uses the stricter
`!(volumeL > 0)` form; calcification.js inherited the looser form unchanged
from the pre-existing conditional (this commit only split one `null` return
into two, it did not weaken the check).
evidence: src/lib/analytics/calcification.js:25; direct execution:
computeSkeletonMass(0.3, -10) → { gPerDay: -0.0536... } instead of a refusal.
impact: currently unreachable in practice — Setup.jsx:77 is the only settings
writer for volumeL and already normalizes any non-positive input to null
(`volNum > 0 ? volNum : null`) before it reaches storage. No live user path
triggers this today.
suggested fix: tighten calcification.js:25's guard to `!(volumeL > 0)` to
match the convention used elsewhere in the same commit.
confidence: high

