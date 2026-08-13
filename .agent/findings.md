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

### dataflow-tracer / 2026-08-13 / S2
what: CorrectionPanel — the only UI surface for `proposeCorrection` (one of
tonight's three TW-001 fix targets) — is unreachable on every render, so
proposeCorrection's return value, including tonight's new
`{possible:false, why:'...net volume...'}` refusal shape, never actually
displays anywhere. `DosingWizard.jsx` renders `<CorrectionPanel def={active.def}
... />` (line 268), but `active` is drawn from the `items` array declared at
lines 199-203 — `{key, a, apply, clear, effect}` — which has no `def` field.
`active.def` is therefore always `undefined`. `CorrectionPanel`'s first line
(`if (!def) return null;`, line 104) short-circuits before any of its three
branches (offer / running / arrived) run. This means not just the new
`offer.why` refusal text, but also the running-correction progress bar, the
gentle/steady/quick pace picker, "Start the correction", "Cancel and go back",
and "Correction complete" are all dead code — the entire temporary-correction
feature is invisible regardless of what proposeCorrection returns. `def` is
already correctly computed in scope two lines below as `activeDef`
(DosingWizard.jsx:212) and simply isn't the one passed down.
evidence: src/components/DosingWizard.jsx:199-203 (items array, no `def` key),
:212 (`activeDef` computed but unused for this prop), :268
(`<CorrectionPanel def={active.def} .../>`), :104 (`if (!def) return null;`).
Confirmed with a standalone repro:
`node -e "const items=[{key:'alkalinity',a:{x:1},apply:1,clear:1,effect:1}]; const active=items.find(x=>x.key==='alkalinity'); console.log(active.def)"`
→ prints `undefined`. No test in src/test exercises CorrectionPanel or
DosingWizard (`grep -rn "CorrectionPanel\|DosingWizard" src/test` → no
matches), so nothing in the suite would catch this. This is not new tonight —
grep of `.agent/inventory.md:174-183` shows a prior sweep flagged the identical
`def` bug — but it is directly relevant to tonight's item: the fix's own
verification note ("DosingWizard.jsx already renders offer.why") describes code
that exists but cannot execute in the browser a real user sees.
impact: proposeCorrection's refusal object (this fix) and its success object
(possible:true, dose, days, returnDose, pace) both reach zero pixels. A user
with alkalinity/calcium/magnesium out of band and net volume unset gets no
correction guidance at all — not even a wrong number, just silence — and a
user with a correction plan already running has no way to see its progress or
cancel it from this panel. Reverse-direction check (brief step 3): proposeCorrection
is spec-governed (reef-chemistry.md §2, §7.6/§9) and correctly implements the
refusal, but it is dead code as far as the screen is concerned.
suggested fix: pass `def={activeDef}` instead of `def={active.def}` at
DosingWizard.jsx:268 (activeDef is already computed at :212 and in scope). Add
a render test that mounts DosingWizard/CorrectionPanel with an out-of-band
assessment and asserts the pace picker or refusal text actually appears.
confidence: high

### dataflow-tracer / 2026-08-13 / S3
what: Full trace of every TW-001-touched function's live call sites confirms
no other caller misreads the new `{status:'novolume', missing:...}` /
`{possible:false, why:...}` object shapes as a number. All three call sites
outside the ones already verified in tonight's fix are accounted for:
`predictAfterChange` is only ever called from Tasks.jsx (:32, :41), both sites
already guard `settings.volumeL > 0` before calling, so the new refusal shape
is structurally unreachable from that caller — `wcResult.pct.toFixed(1)` and
`wcResult.rows.map(...)` (Tasks.jsx:85,88) only ever run on the numeric
success shape. `computeSkeletonMass` is only ever called from Insights.jsx
(:118), which explicitly branches on `skeleton.status === "novolume"`
(:424) before reading `.gPerMonth`/`.gPerWeek`/`.kgPerYear`/`.cm3PerMonth`
(:442-457) — correct. `proposeCorrection` is only ever called from App.jsx
(:185-187) into `correctionOffers`, whose only consumer is
DosingWizard.jsx:270 → CorrectionPanel, which checks `offers[k].possible`
before reading `.dose`/`.days`/`.returnDose` (DosingWizard.jsx:101,144-186) —
correct in isolation (see the companion S2 finding: this whole panel is
unreachable for an unrelated reason, but the shape-handling itself is sound).
evidence: `grep -n "predictAfterChange|computeSkeletonMass|proposeCorrection" -r src`
enumerated every call site; each traced above by file:line.
impact: none — this is a clean-bill finding for the specific risk named in the
brief (stale/old-shape callers). Logged as low-severity so the negative result
is on record rather than silently assumed.
suggested fix: none needed.
confidence: high
