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

### breaker / 2026-08-13 / S1
what: CORRECTION to domain-verifier's S3 finding above (lines 15-31): its
"impact: currently unreachable in practice" claim is wrong. Setup.jsx:77 is
NOT the only settings writer for volumeL — `restoreBackup`
(src/lib/backup.jsx:151-155) is a second one, and it applies
`{ ...DEFAULT_SETTINGS, ...b["tank-settings"] }` straight from an imported
JSON file with **zero numeric validation**, unlike Setup.jsx's
`volNum > 0 ? volNum : null`. Setup.jsx's own "Restore from a backup" button
calls `restoreBackup(pending.parsed, {...}, true)` unconditionally
(Setup.jsx:602-606, `applySettings` hardcoded `true`, no checkbox, no
confirmation of what settings will change) on any file the user uploads. A
hand-edited or corrupted backup JSON containing `"tank-settings": {"volumeL":
-50}` reaches live `settings.volumeL` verbatim, which Insights.jsx reads
directly (line 118) to call the very `computeSkeletonMass` the S3 finding
above discusses — reclassifying that finding as reachable and materially more
severe than S3.
evidence: `npx vitest run src/test/spec/analytics/skeleton-mass-negative-volume.test.js src/test/spec/components/insights-skeleton-negative-volume.test.js src/test/spec/data/backup-restore-data-integrity.test.js` →
6 failed, 2 passed (all 6 failures are the documented bugs; the 2 passes are
positive controls proving the test methodology). Direct repro:
`computeSkeletonMass(0.3, -50)` → `{ gPerDay: -0.268..., gPerMonth: -8.16...,
kgPerYear: -0.0979... }` instead of `{status:'novolume', missing:'net
volume'}`. Rendered live: Insights.jsx's "Skeleton laid down" card (line 440,
guarded only by `skeleton.status === "novolume"` at line 424, which a
negative-but-truthy object never satisfies) shows
`summary={`about ${skeleton.gPerMonth.toFixed(0)} g...`}` → literally "about
-8 g of calcium carbonate a month" on screen, confirmed by
insights-skeleton-negative-volume.test.js finding a rendered `/-\d/` text node
where the refusal copy should be.
impact: a real, reachable path (upload a backup file — including one that
could plausibly be corrupted by a text editor, a bad merge, an old app
version's now-fixed bug, or hand-editing to fix something else in it) puts a
negative "grams of skeleton grown per month" figure on the Insights screen
where the app should refuse and name the missing/invalid net volume, exactly
the failure class TW-001 exists to close for the other two engines. Also
compounds the false claim in Setup.jsx:596 ("nothing is overwritten") — the
restore *does* overwrite tank-settings, unsanitised, is not opt-in, and is
never previewed to the user before the button is pressed (inspectBackup's
preview, Setup.jsx:554-565, reports `hasSettings` as a boolean but never what
the incoming settings values actually are).
suggested fix: (1) tighten calcification.js:25's guard to `!(volumeL > 0)` per
domain-verifier's original suggestion — necessary but not sufficient; (2)
restoreBackup (backup.jsx:151-155) needs the same numeric sanitisation
Setup.jsx:77 already applies before writing `tank-settings`, since it is a
second, unguarded write path to the same storage key; (3) consider previewing
the actual incoming settings values (not just `hasSettings: true/false`)
before Restore is pressed, since it silently changes numbers that drive every
dose calculation in the app.
confidence: high

### breaker / 2026-08-13 / S2
what: `restoreBackup`'s natural-key dedup for `readings`
(`${r.param}|${r.date}`, backup.jsx:114) cannot distinguish a genuine second
same-day reading (e.g. an AM/PM retest, or a corrected re-test) already
present locally from a duplicate of it in an imported backup file — the
incoming row is silently discarded rather than added. This directly
contradicts the restore button's own copy (Setup.jsx:596): "Restoring adds
anything missing and leaves what you already have alone, so nothing is
overwritten or duplicated" — a genuinely-different second reading for the
same day IS something missing, and it is not added.
evidence: tests/... `npx vitest run src/test/spec/data/backup-restore-data-integrity.test.js` →
"BUG: two DIFFERENT alkalinity readings on the same day (e.g. a retest) merge
into one, losing real data" fails: `expected [ { id: 'r1', ... } ] to have a
length of 2 but got 1` — the backup's second reading (value 6.9, same
param/date as an existing 8.2 reading) never reaches `result.readings`.
impact: restoring an otherwise-good backup after logging a legitimate same-day
retest (a normal thing to do when the first reading looks wrong and you
retest before dosing) silently drops the retest with no error, no skipped
count (inspectBackup's `skipped` counter, backup.jsx:89-99, only counts
unparseable rows, not natural-key collisions against existing data — the
preview even reports it as "0 fresh" without saying why). Falls squarely under
AGENTS.md's "Silent data loss is the worst possible failure here."
suggested fix: key `readings` (and `dose-log`) by `${param}|${date}|${time}`
where a time field exists, or fall back to also comparing `value` so two
same-day rows with different values are never treated as the same
observation; surface true collisions (same key, same value) vs. genuine
same-day duplicates differently in the preview.
confidence: high

### fixer (round D) / 2026-08-13 / S2
what: same root cause as the just-fixed Volume-field revert bug
(state-auditor/S1, adjudicated.md item 8), but in the OTHER effect in
Setup.jsx (now lines 66-71, unmodified by round D's fix): `elemDose`,
`elemStrength`, and `sigmaVal` all resync from the whole `settings` object
on any write, not just a write to their own field. Saving the Volume field
would clobber an unsaved dose-mL edit in the same screen, same failure
class as the fixed bug.
evidence: src/components/Setup.jsx:66-71 (post round-D fix); surfaced
directly by the fixer while scoping round D's fix, not independently
reproduced with a test (round D's task was explicitly scoped to the Volume
field only, per the confirmed finding).
impact: same class as the fixed S1 (silent loss of an unsaved edit), but
narrower — requires two specific fields on the same screen edited in the
right order. Not independently verified/reproduced yet.
suggested fix: apply the same narrowed-dependency pattern round D just used
for volumeL to each of these three fields individually.
confidence: medium (mechanism confirmed by code read; not test-reproduced)

### domain-verifier / 2026-08-13 / S1
what: §6 rate-of-change rail constants for magnesium still disagree with
today's canon update (reef-chemistry.md §6: magnesium 50 ppm/24h). Two
independent "rail" sources in src/lib exist and BOTH are wrong, in opposite
directions:
  - src/lib/analytics/correction.js:20 `CORRECTIONS.magnesium.maxPerDay = 100`
    — this now EXCEEDS the hard cap (2x). It is live and reachable: Setup.jsx
    imports `computeCorrection` (Setup.jsx:7,119-121) and renders its output
    directly in the one-off correction calculator, including the literal
    string "That exceeds the safe change of {maxPerDay} ppm per day"
    (Setup.jsx:387-388) — i.e. the UI tells the user 100 ppm/day is the safe
    ceiling and sizes `days`/`perDayG` off it.
  - src/lib/analytics/safe-rate.js:27 `CORRECTION_MAX_RATE.magnesium = 25` and
    safe-rate.js:31 `SAFE_DAILY_RISE.magnesium = 25` (same object, re-exported)
    — under the new 50 ppm/24h default. SAFE_DAILY_RISE is what the live
    Dosing Wizard's rate ceiling (`safeDoseBand`, called from
    src/lib/dosing/alkalinity.js's `rateLimitDose`/`applyDoseConstraints`,
    shared by calcium.js and magnesium.js) actually enforces on every dosing
    path today.
  Calcium is confirmed correctly updated in both places (safe-rate.js:27 = 20,
  correction.js:16 = 20) — matches the task brief's "code already matched".
  This is a fresh verification of backlog TW-016, which is still open and
  still accurate as filed; nothing has changed the constants since it was
  logged.
evidence:
  $ node -e "..." (script imported CORRECTIONS/CORRECTION_MAX_RATE/SAFE_DAILY_RISE
  directly and ran computeCorrection('magnesium', 1200, 1350, 200)):
    CORRECTIONS.magnesium.maxPerDay = 100
    CORRECTIONS.calcium.maxPerDay = 20
    CORRECTION_MAX_RATE.magnesium = 25
    SAFE_DAILY_RISE.magnesium = 25
    computeCorrection(magnesium, 1200->1350, 200L) => { delta:150, days:2,
      products:[{name:"Magnesium chloride hexahydrate", totalG:250.8,
      perDayG:125.4}, {name:"Magnesium sulphate heptahydrate", totalG:303,
      perDayG:151.5}], maxPerDay:100 }
    implied ppm/day = 150/2 = 75  <-- 50% over the current 50 ppm/24h rail
  $ npx vitest run src/test/spec/classification/rails.test.js
    6 failed | 6 passed (12) — includes:
    "magnesium: CORRECTION_MAX_RATE.magnesium === CORRECTIONS.magnesium.maxPerDay"
      expected 25 to be 100 (the two in-app sources contradict each other)
  src/lib/dosing/alkalinity.js:319,348 (`safeDoseBand` call sites),
  src/lib/analytics/safe-rate.js:43-48 (`safeDoseBand` reads SAFE_DAILY_RISE)
impact: Setup's correction calculator (a live, reachable feature) recommends
a magnesium correction plan that delivers 75 ppm/24h — 1.5x the current hard
cap — while its own copy tells the user this is "safe". Independently, the
Dosing Wizard's rate ceiling under-corrects magnesium at half the currently
authorised rate (25 vs 50), which is not dangerous on its own but is a
hardcoded tightening the spec reserves for `[user]`, and the two sources
disagreeing with each other is exactly the failure mode safe-rate.js's own
header comment (lines 15-20) says previously caused a 105-tank oscillation /
29-tank crash in simulation when SAFE_DAILY_RISE and CORRECTION_MAX_RATE
disagreed for calcium.
suggested fix: needs `[approved][chem]` per AGENTS.md rule 3 before either
constant may change (already the case per TW-016's own note). Set
CORRECTIONS.magnesium.maxPerDay = 50 in correction.js:20, and
CORRECTION_MAX_RATE.magnesium = 50 in safe-rate.js:27 (SAFE_DAILY_RISE is
derived from it automatically at safe-rate.js:31). Re-point the hardcoded
SPEC_RAIL/canon-table constants in the test files noted in the next finding
at the same time, in the same change, so the tests don't go green against a
number that is itself stale.
confidence: high

### domain-verifier / 2026-08-13 / S2
what: Two test files that exist specifically to pin the §6 rail constants
against canon hardcode the numbers from BEFORE today's spec update, not
today's canon. This makes them actively misleading right now: they currently
fail on calcium (which the app already fixed to the new, correct 20) and
would tell a future agent that reverting calcium back to 25 "fixes" it —
the opposite of AGENTS.md's rule 3. They also assert magnesium should be 100,
which was true yesterday but is 50 as of today's spec change (the task brief
that spawned this run).
evidence: src/test/spec/classification/rails.test.js:24
  `const SPEC_RAIL = { alkalinity: 0.5, calcium: 25, magnesium: 100 };`
  and header comment lines 6-9 quoting the same stale table.
  src/test/spec/dosing/rate-rails.test.js:37-45, explicitly asserting
  `expect(SAFE_DAILY_RISE.calcium).toBe(25)` (labelled "calcium default rail
  is 25 ppm/24h per canon (code enforces 20)") and
  `expect(SAFE_DAILY_RISE.magnesium).toBe(100)`.
  $ npx vitest run src/test/spec/classification/rails.test.js
  src/test/spec/dosing/rate-rails.test.js
    → "calcium: CORRECTIONS.calcium.maxPerDay === 25" fails: expected 20 to be 25
    → "calcium default rail is 25 ppm/24h per canon (code enforces 20)" fails:
       expected 20 to be 25
    → "magnesium default rail is 100 ppm/24h per canon (code enforces 25)"
       fails: expected 25 to be 100 (right direction, wrong target number —
       should assert 50, not 100)
impact: not a live user-facing defect, but a real hazard to the run's own
correctness process — these tests currently reward the wrong fix for
calcium (making it non-compliant again) and would not catch a "fix" of
magnesium to 100 as still being wrong, since neither file's constant was
updated alongside today's canon change.
suggested fix: update both files' hardcoded canon tables to
`{ alkalinity: 0.5, calcium: 20, magnesium: 50 }` in the same change that
fixes the underlying constants (see prior finding), per AGENTS.md rule 4 —
this is "the test is genuinely wrong" case, not a live-code question, and
should be corrected rather than skipped since the fix is dictated directly
by the spec text, not a guess.
confidence: high

### domain-verifier / 2026-08-13 / S1
what: The default calcium/alkalinity dosing-solution strengths the app
pre-fills for a new user, and the explanatory hint text shown next to them,
imply and explicitly state a Ca:alk consumption ratio of ~6.8 ppm Ca per dKH
— not the reef-chemistry.md §1 fixed universal constant of 7.15 ppm Ca per
1.0 dKH ("Changing any of these without an [approved][chem] item is an S1
defect", line 29).
evidence: src/lib/analytics/consumption.js:84-93 (`DOSE_ELEMENTS`):
  alkalinity `defaultStrength: 0.0533` (dKH/mL/100L)
  calcium `defaultStrength: 0.3611` (ppm/mL/100L)
  calcium hint text, verbatim: "Paired with the alkalinity part that gives
  6.8 ppm calcium per dKH — the ratio corals actually consume."
  0.3611 / 0.0533 = 6.774859287054409 (i.e. the coded ratio is actually 6.77,
  not even the 6.8 the hint text itself claims — a second, smaller
  discrepancy on top of the spec mismatch).
  These defaults are live: Setup.jsx:61 pre-fills the strength input from
  `elem.defaultStrength` whenever a setting is unset, and Setup.jsx:103 falls
  back to `elem.defaultStrength` on save if the typed field is empty/0 — so a
  user who accepts the suggested defaults for both parts is silently given a
  7.15-vs-6.77 mismatch (5.2% short) baked into every downstream dose,
  consumption and maintenance-dose calculation for the life of the tank.
  $ npx vitest run src/test/spec/analytics/unit-conversions.test.js
    "SPEC VIOLATION: DOSE_ELEMENTS default calcium/alkalinity strengths imply
    a ratio other than 7.15" — fails: expected 6.774859287054409 to be close
    to 7.15, received difference is 0.3751407129455915
impact: A calcium dose sized to this default strength systematically
under-supplies calcium relative to real alkalinity consumption for anyone
using the app's own suggested two-part product pairing — exactly the failure
mode reef-chemistry.md §5 describes ("If measured alk consumption implies a
calcium draw the user's calcium dosing does not cover, calcium is drifting
down"), except here the shortfall is built into the app's own default rather
than an emergent finding. The hint text also makes an affirmative, wrong
factual claim ("the ratio corals actually consume") that contradicts the
spec's fixed constant and would mislead a user who checked their own product
label's mixing ratio against it.
suggested fix: needs `[approved][chem]` before changing (AGENTS.md rule 3).
Recompute one of the two default strengths so 0.3611/0.0533 (or whichever
values are kept) equals 7.15, and correct the hint text's "6.8" claim to
match. Flag to Dan first since this may reflect a real product's actual
mixing ratio rather than a typo — if so this is a spec-vs-product-reality
conflict for spec-challenges.md, not a straightforward constant fix.
confidence: high

### domain-verifier / 2026-08-13 / S2
what: surfaces-and-messaging.md §5 terminology registry ("net volume" is the
required term; "water volume" is explicitly banned) is still violated at one
live, user-facing site — confirms backlog TW-017 is still open and its
repro is still accurate as of this run; nothing has changed since it was
filed.
evidence: src/lib/findings.js:363, live in the current tree:
  `detail: \`Every dosing and consumption figure divides by your tank volume,
  so without a sensible number in Setup none of them mean anything. Enter
  your net water volume — total system litres less rock and sand
  displacement, usually around 80-85% of the display figure.\`,`
  — uses both "tank volume" and "net water volume" (containing the banned
  "water volume") in the same message, neither of which is the required
  "net volume".
  $ grep -rniE "water volume|tank size\b" src --include=*.js --include=*.jsx | grep -v /test/
    → only this one hit; no other live "water volume"/"tank size" instances
    found in the current tree.
impact: this message fires on the "tank volume not set" finding (id:
no-volume, scope: dosing, severity: act) — one of the most safety-critical
refusal messages in the app (net volume is the input every dose calculation
depends on per §2/§9) — and it is the one place still using the banned
synonym instead of the term the registry requires everywhere else.
suggested fix: change "your tank volume" -> "your net volume" and "net water
volume" -> "net volume" at findings.js:363 (per TW-017, already queued,
untagged/needs [approved] tag before an implementer may act per AGENTS.md
"Untagged items are read-only to the implementer").
confidence: high

### perf-watchdog / 2026-08-13 / S3
what: Main JS bundle and total initial payload remain over budget, re-measured
fresh (not trusted from the prior sweep's numbers). Delta since this morning's
pre-TW-001 baseline is negligible (+0.19 kB gzip main JS) and attributable to
TW-001's own ~50-line diff (new refusal branches in consumption.js,
calcification.js, helpers.js, Insights.jsx) — not a regression, not growing.
CSS remains well under budget. No new runtime dependency was added (package.json
byte-identical across TW-001's commit) and `max_new_deps_per_night: 0` holds.
evidence:
`npm run build` (clean checkout, current HEAD 7968d5c on
claude/dazzling-faraday-9zbsv7):
  dist/assets/index-Drz21Ht6.js   987.01 kB │ gzip: 286.39 kB
  dist/assets/index-9qIAZR0F.css   37.31 kB │ gzip:   8.71 kB
Total initial (JS+CSS gzip) = 286.39 + 8.71 = 295.10 kB.
Cross-checked with raw `gzip -c`: JS 285,715 B (285.7 kB), CSS 8,689 B
(8.7 kB) — consistent with Vite's own reported figures within tool-level
gzip-setting noise.
Prior baseline (.agent/log/2026-08-13-consistency-sweep.md:243-244, this
morning, pre-TW-001): main JS 286.2 kB gzip, total ~294.9 kB gzip.
Budget (.agent/budgets.json): main_js_kb_gzip 180, total_initial_kb_gzip 250,
css_kb_gzip 40.
`git diff HEAD~2 HEAD -- package.json package-lock.json` → empty (TW-001 added
zero dependencies).
`npm ls --omit=dev --all` → 3 direct runtime deps (react, react-dom,
recharts), 45 total nodes incl. transitive — under
`max_runtime_dependencies: 20`.
impact:
  metric              | budget | previous (this AM) | current | delta   | verdict
  main_js_kb_gzip      | 180    | 286.2               | 286.4   | +0.2    | FAIL (59% over)
  total_initial_kb_gzip| 250    | 294.9               | 295.1   | +0.2    | FAIL (18% over)
  css_kb_gzip           | 40     | 8.7                 | 8.7     | 0.0     | PASS
Both breaches are pre-existing (predate tonight's build cycle entirely per the
consistency-sweep run two cycles ago) and flat — TW-001 did not move them
meaningfully. Root cause (unchanged from this morning): the whole app ships as
a single un-split ~987 kB chunk (Vite's own build warning: "Some chunks are
larger than 500 kB after minification"), no dynamic import() anywhere in
src/, no manualChunks config in vite.config.js. recharts (5.4 MB unpacked,
pulling in victory-vendor/d3-* + lodash + react-smooth +
react-transition-group as transitive deps) is the single largest contributor
loaded on every route, including ones that never render a chart on first
paint.
suggested fix: code-split at the route/tab level (Dashboard/WaterLog/Insights/
Setup/Tasks) via React.lazy + dynamic import, and/or move recharts import
behind a lazy boundary so it only loads when a chart is actually mounted, so
the initial payload for a cold load doesn't include the charting stack. Purely
a bundling change — touches vite.config.js and top-level route wiring only, no
chemistry logic.
confidence: high

### perf-watchdog / 2026-08-13 / S4
what: Test suite runtime is well inside budget; no action needed, logged for
the record.
evidence: `time npm test` → `Test Files 31 failed | 14 passed (45)`, `Tests 63
failed | 199 passed (262)`, `Duration 21.35s`, `real 0m21.933s`. Budget
(.agent/budgets.json `tests.max_suite_runtime_seconds`) is 180s — suite runs
at ~12% of budget. (Failing-test counts here are pre-existing correctness
findings tracked by other auditors this cycle, not a perf-watchdog concern —
see TW-001's own log and the dataflow-tracer/breaker findings above.)
impact: none — clean bill on this budget line.
suggested fix: none needed.
confidence: high

### perf-watchdog / 2026-08-13 / S3
what: `ZoomableLineChart` (src/components/ZoomableChart.jsx) recomputes its
full visible-window derivation — `visible` (array slice), `values`,
`scaleVals`, and the `niceAxis()` call that drives axis domain/ticks/
formatters — on every render, unmemoized (only `visibleEvents` is wrapped in
`useMemo`, line 177). At the unzoomed default (`range: {start:0, end:1}`,
which is what a user sees immediately after picking "your whole log" in
Dashboard.jsx, since `rows` returns `allRows` unsliced when
`activeWin >= 99999`, Dashboard.jsx:274), `visible` is the entire dataset —
there is no cap and no virtualisation on this path. Measured directly (not
eyeballed) with a Profiler-wrapped render harness at realistic-to-large scale.
evidence: React `Profiler`-instrumented render of `ZoomableLineChart` under
jsdom (ResizeObserver/getBoundingClientRect stubbed so
`ResponsiveContainer` actually lays out), warm (JIT-warmed with a throwaway
5-point mount first, discarded), single run per size:
  points | mount (wall) | re-render w/ identical props (wall)
  200    | 43.8 ms       | 14.6 ms
  1000   | 62.2 ms       | 28.8 ms
  5000   | 117.9 ms      | 64.8 ms
The re-render column is the key number: props and data were unchanged between
the two renders (simulating a parent re-render from an unrelated sibling state
change, e.g. any Dashboard state update while "whole log" is selected), yet
recharts + the unmemoized slice/scale math still cost ~65 ms of React work at
5000 points because nothing short-circuits it. React's own Profiler
`onRender` callback additionally logged extra "update"/"nested-update"
commits beyond the two renders actually triggered (5 commit phases logged for
2 explicit render calls) — recharts' `ResponsiveContainer` does its own
internal two-pass layout (measure, then re-render at measured size), which is
normal recharts behaviour but doubles the real commit cost of every mount.
This is React-thread/reconciliation cost only (jsdom does no real SVG paint);
real-device paint cost for 5000 plotted points would be additional and is not
measured here.
Confirmed by reading (not just profiling): src/components/ZoomableChart.jsx:
`visible` (163), `values`/`scaleVals`/`axis` (166-173) are plain `const`s
recomputed every render; `useMemo` only wraps `visibleEvents` (177-193).
Dashboard.jsx:274 (`if (activeWin >= 99999) return allRows;`) is the one place
an unbounded array reaches this component. WaterLog.jsx's own "Past readings"
list, by contrast, already caps to 40 rows (`histRows`, WaterLog.jsx:68-72) —
no equivalent problem there.
impact: not currently budget-breaking or crash-causing — the largest realistic
per-parameter history for one real tank over years is unlikely to reach 5000
readings soon, and even at 5000 the measured React-side cost (~65-120 ms) is
below the ~100 ms interaction-response guideline most of the time, not a hard
freeze. But it is unbounded and unmemoized by construction, so it degrades
linearly with log size with no ceiling, and every unrelated re-render while
"whole log" is selected pays the full recompute cost for no reason (nothing
in the derivation depends on the changed state).
suggested fix: wrap `visible`/`values`/`scaleVals`/`axis` in
`useMemo(..., [data, startIdx, endIdx, targetMin, targetMax])` alongside the
existing `visibleEvents` memo, so an unrelated parent re-render is a no-op for
this component. Purely a rendering/memoization change to chart-display code
(axis tick formatting, slicing) — does not touch any chemistry constant,
formula, or threshold in src/lib/analytics or src/lib/dosing.
confidence: high

### state-auditor / 2026-08-13 / S1
what: DosingWizard's per-element panel (AlkAssessmentBlock, and the
DoseChangeSheet nested inside it) is rendered without a `key` tied to which
element is open. Switching the open element while the "Record the new dose"
sheet is showing leaves the mL input holding the PREVIOUS element's
recommended-dose string, because DoseChangeSheet seeds `ml` via
`useState(String(recommended...))` once at mount and the component instance
is reused rather than remounted.
evidence: src/components/DosingWizard.jsx:252
(`<AlkAssessmentBlock a={active.a} def={activeDef} .../>`, no key) and
src/components/ErrorBoundary.jsx:249 (`<DoseChangeSheet .../>`, no key).
Reproduced with a scratch RTL test (created, run, then deleted — repo left
clean, confirmed via `git status --porcelain`): rendered DosingWizard with
alkalinity (recommendedDose 5.2) and calcium (recommendedDose 40) both
needing a dose, opened alkalinity's "Set the dose" sheet (mL field shows
"5.2"), then clicked the Calcium card while the sheet stayed open. `npx
vitest run <temp file>` → `AssertionError: expected '5.2' to be '40'` — the
mL field still read "5.2" after switching to calcium.
impact: If "Record" is tapped without noticing the stale figure,
AlkAssessmentBlock's onSave (ErrorBoundary.jsx:253-264) calls
`onApplyDose(ml, {...})` with the OLD element's mL amount but the NEW
element's metadata (effectPerMl/currentValue/maintenanceDose all correctly
reflect the newly active element, since `a` is a fresh prop) — so e.g.
calcium's daily dose gets saved as an alkalinity-sized number. The number
written to settings/doseLog is not the number the app actually computed for
that element.
suggested fix: key `<AlkAssessmentBlock>` (and thereby its nested
`<DoseChangeSheet>`) by `active.key` in DosingWizard.jsx so switching
elements always remounts fresh input state instead of carrying it over.
confidence: high

### state-auditor / 2026-08-13 / S1
what: Setup.jsx's Volume (L) field silently reverts an unsaved, in-progress
edit to the last-saved value whenever any *other* settings write happens on
the same screen (e.g. recording a dose change), because the resync effect
fires on any change of `settings` object identity, not just external ones.
evidence: src/components/Setup.jsx:58-64 —
`useEffect(() => { setVol(...); setElemDose(...); setElemStrength(...);
setSigmaVal(...); setSaveMsg(null); }, [settings, elemKey])`. `saveDose()`
(Setup.jsx:86-92) calls `onAddDoseChange`, which in App.jsx's `addDoseChange`
(App.jsx:388-394) also does `await saveSettings({ ...settings,
[cfg.doseField]: row.ml })` — a `settings` write unrelated to volume — which
produces a new object reference and re-fires the Setup effect, resetting
`vol` back to `settings.volumeL`. Reproduced with a scratch RTL test (created,
run, then deleted — repo left clean, confirmed via `git status --porcelain`):
harness mirrors App.jsx's real wiring (onAddDoseChange also saves the dose
field into settings). Started with settings.volumeL=70, typed "95" into
Volume (L) without clicking its own Save button, then edited and saved the
unrelated Dose (mL/day) field. `npx vitest run <temp file>` →
`AssertionError: expected '70' to be '95'` — Volume field reverted to "70".
impact: A user entering net volume for the first time — the exact input
tonight's TW-001 fix made dosing refuse-and-name on when absent — can lose
that entry with no warning if they also record/adjust a dose on the same
Setup visit before hitting the Volume field's own Save button. Dosing
continues to be computed (or refused, per TW-001) against the old/missing
volume while the screen gives no indication the typed value was discarded.
suggested fix: don't resync `vol`/`elemDose`/`elemStrength`/`sigmaVal` on
every `settings` reference change. Either run the resync only on mount and
after an explicit restore (`onRestored`), or track per-field "dirty" state
and skip overwriting a field the user has edited since its own last save.
confidence: high

### state-auditor / 2026-08-13 / S2
what: DoseChangePopup does not reset its 14-second auto-dismiss countdown
(`left`) when a new `result` arrives, and — unlike its three sibling
confirmation popups — is not `key`ed to force a remount per result. A second
dose confirmation shown shortly after a first one that had already counted
down to 0 auto-closes itself immediately, before the user can read the
expected-change figures it just calculated.
evidence: src/components/DoseExpectation.jsx:17-36 — the effect at 24-29
resets `phase` on a new `result` but not `left`/`held`; the countdown effect
at 31-36 (`if (left <= 0) { onClose(); return; }`) runs again on the new
`result` with `left` still at its old value of 0. Contrast with App.jsx:1272
(`<DoseChangePopup result={doseResult} onClose={...} />`, no key) vs.
App.jsx:1273 `<LogResultPopup key={logResult ? logResult.at : "none"} .../>`,
:1276 `<IcpResultPopup key={icpResult ? "icp"+icpResult.at : "icpnone"} .../>`,
:1278 `<TaskDonePopup key={taskResult ? "task"+taskResult.at : "tasknone"} .../>`
— the other three are deliberately keyed to remount per result; DoseChangePopup
is not. Reproduced with fake timers (scratch test, created/run/deleted — repo
left clean, confirmed via `git status --porcelain`): ran a first dose
result's countdown out to 0 (`onClose` called once, as expected), then
supplied a second, unrelated dose result. `npx vitest run <temp file>` →
`AssertionError: expected "vi.fn()" to not be called at all, but actually
been called 1 times` — the second popup called `onClose` immediately.
impact: making two dose changes in reasonably quick succession — e.g. tuning
alkalinity then calcium in the same Dosing Wizard visit, an ordinary
workflow — causes the second confirmation (expected ppm/dKH change, days to
test) to auto-dismiss on arrival, so the user never sees the number the app
just calculated for that dose.
suggested fix: add `setLeft(AUTO); setHeld(false);` to the effect keyed on
`result` at DoseExpectation.jsx:24-29, mirroring
ReadingConfirmation.jsx:446-449's `setLeft(AUTO_SECONDS); setHeld(false);`;
or simply key `<DoseChangePopup>` in App.jsx the same way the other three
confirmation popups already are.
confidence: high

### state-auditor / 2026-08-13 / S3
what: CorrectionPanel's pace selection (`pace` state) is not reset when the
user switches which element's correction panel is open, because it shares
the same missing-key root cause as the S1 above — `<CorrectionPanel
def={active.def} .../>` in DosingWizard.jsx is not keyed by `active.key`.
evidence: src/components/DosingWizard.jsx:96-190 (`const [pace, setPace] =
useState(null)` at line 102) and :267-273 (`<CorrectionPanel def={active.def}
.../>`, no key). Traced by code reading, not independently reproduced with a
failing test — see impact for why.
impact: picking "quick" while correcting alkalinity and then opening
calcium's correction panel (if it also offers "quick") shows calcium's panel
pre-selected on "quick" rather than defaulting to its own best pace. The
mL/day and day-count figures shown are still correct for whichever pace ends
up selected — each is read fresh from `offers[chosen]` for the current
element — so this is not itself a wrong-number bug, only a misleading
carried-over UI selection. Flagged because it is the same missing-key defect
class as the two S1 findings above and would compound if either is fixed
without addressing this one too.
suggested fix: same as the AlkAssessmentBlock finding — key
`<CorrectionPanel>` (or the surrounding Card) by `active.key`.
confidence: medium

### static-analyst / 2026-08-13 / S2
what: In all three dosing engines (alkalinity, calcium, magnesium), the rate-
ceiling clamp (`rateLimitDose`, which sets `out.rateLimited = {wanted, allowed,
perDay, unit, days}` and is the only thing rendered in the "Held to X mL
rather than Y mL..." UI banner) runs BEFORE the shared `applyDoseConstraints`
(bracketing, `capDoseStep`, and a second `safeDoseBand` re-check). Both
functions can independently shrink the working dose figure, but only
`rateLimitDose`'s clamp is ever recorded on `out`. When `applyDoseConstraints`
tightens the figure further (via `capDoseStep`'s ordinary 25%-of-current-dose
cap, or its own trailing `safeDoseBand` re-check), `out.recommendedDose` ends
up strictly smaller than what `out.rateLimited.allowed` already told the user
was the (rate-limited) answer — with no field recording that a second,
different clamp happened, and no update to the rendered "Held to {allowed} mL"
text. The banner and the number the app is about to record disagree, for the
same assessment, in the same render.
evidence: Ran the real, unmodified exported functions from
src/lib/dosing/alkalinity.js directly (not reimplemented), in the exact
sequence and with the exact call signature used in production at
alkalinity.js:853 (`rateLimitDose`) then :859 (`applyDoseConstraints`),
:862 (`out.recommendedDose = next`) — the identical pattern also appears
verbatim at calcium.js:574,580,583 and helpers.js:942,948,951 (assessMagnesium).
Script (bundled with esbuild, run under node with a minimal window/localStorage
shim so the module graph loads headless):
  const out = { currentDose: 4, maintenanceDose: 50,
    current: { value: 9.0 }, trendPerDay: 0 };
  const applied = (out.maintenanceDose - out.currentDose) * 0.1;  // 4.6, a
    // modest staged step -- same shape as the real 0.55/0.7/0.9 urgency
    // multipliers assessAlkalinity itself applies before calling rateLimitDose
    // (alkalinity.js:843-846; the identical pattern recurs in calcium.js:566-569
    // and helpers.js:936-937)
  const limited = rateLimitDose(applied, out, def, { volumeL: 200 }, 0.05);
  // -> { next: 40, stop: false }; out.rateLimited = { wanted: 8.6, allowed: 40,
  //      perDay: 0.5, unit: "dKH", days: 4 }
  const finalNext = applyDoseConstraints(limited.next, out, def, { volumeL: 200 }, [], []);
  // -> finalNext = 5; out.stepCapped = { wanted: 40, allowed: 5 }
Output: `out.recommendedDose would be: 5` / `but out.rateLimited (shown in UI)
claims allowed = 40` / `MISMATCH: true`.
Rendered surface confirmed by reading: ErrorBoundary.jsx:158-165 renders
`a.rateLimited.allowed`/`.wanted`/`.perDay`/`.days` verbatim as "Held to X mL
rather than Y mL... Getting there will take about {days} more days" with no
re-check against `a.recommendedDose`; ErrorBoundary.jsx:249-251 prefills the
DoseChangeSheet's editable amount from `a.recommendedDose` (the smaller,
further-clamped figure), so the number the sheet offers to record is not the
number the banner directly above it just described.
Full end-to-end reproduction through `assessAlkalinity()`'s own trend/
consumption maths (rather than calling the two shared functions directly)
was attempted but not completed in this pass — flagged as UNVERIFIED at that
level; the mechanism itself is verified against the real, unmodified
production functions in the exact call order and with realistic magnitudes
(a 100-200 L tank, a 1-4 mL/day current dose, a 0.35 dKH/mL/100L solution
strength within STRENGTH_RANGE.alkalinity's plausible band).
impact: A user reads "Held to 40 mL rather than 8.6 mL: the larger figure
would move alkalinity faster than 0.5 dKH a day... Getting there will take
about 4 more days" and then taps Record on a sheet pre-filled with 5 mL — a
different number the banner never mentioned, with no explanation for the
second reduction. Whichever figure the user trusts, one of the two on-screen
numbers is stale/wrong for that render. Because `out.stepCapped` (the field
that would explain the second clamp) is set but never read by any component
(`grep -rn "\.stepCapped\b" src --include=*.js --include=*.jsx` outside
alkalinity.js's own assignment and test files returns nothing), there is
currently no path for the discrepancy to be explained to the user at all.
suggested fix: Either (a) re-run/replace `out.rateLimited` after
`applyDoseConstraints` so it always reflects the final clamp that actually
produced `out.recommendedDose` (and drop or supersede it if a later step
un-does the rate-limit binding), or (b) merge the two into one ordered
constraint pass that records a single "why the number changed" trail
reflecting whichever constraint bound last, and render `out.stepCapped`
(currently dead) alongside `out.rateLimited` so no clamp is silent. Add a
regression test asserting `out.recommendedDose === (out.rateLimited ?
out.rateLimited.allowed : out.maintenanceDose-derived value)` whenever
`out.rateLimited` is set, across all three engines.
confidence: high

### static-analyst / 2026-08-13 / S3
what: DoseChangeSheet's `def` and `element` props are declared in its
destructured signature but never read anywhere in the component body — the
component has no access to the parameter's rail (`SAFE_DAILY_RISE[def.key]`)
or its own element identity at all, despite the caller explicitly threading
both through. This is concrete, file-level evidence for backlog TW-004 ("no
§6 rail check reachable from manual dose entry"): the wiring needed for a
rail check at this exact call site already exists and is being dropped on
the floor, not merely absent.
evidence: `grep -n "\bdef\b\|\belement\b" src/components/DoseChangeSheet.jsx`
→ only one match, the destructuring line itself
(src/components/DoseChangeSheet.jsx:16:
`export function DoseChangeSheet({ def, element, current, recommended,
suggested, plan, onCancel, onSave }) {`) — zero uses in the function body
(lines 17-69). Caller passes both anyway:
src/components/ErrorBoundary.jsx:249 `<DoseChangeSheet def={def}
element={a.element || "alkalinity"} ... />`.
impact: Same user-facing gap TW-004 already describes (Record is enabled for
any finite value >= 0 with no rail lookup) — this finding narrows the cause
to a specific, already-half-built code path: `def` (which would let the
component look up `SAFE_DAILY_RISE[def.key]`/`CORRECTIONS[def.key].maxPerDay`
itself) is sitting in scope, threaded by the caller, and silently discarded.
suggested fix: When implementing TW-004's rail check, wire it through the
`def` prop that already reaches this component rather than adding a new prop;
if `def`/`element` remain genuinely unused after that work, remove them from
the signature and the caller so an unused prop doesn't look like a check that
already exists.
confidence: high

### static-analyst / 2026-08-13 / S4
what: Two directly contradictory comments about the same code exist ~500
lines apart in the same file. src/lib/dosing/alkalinity.js:332-340 (the block
comment immediately above `rateLimitDose`'s own definition) states in the
present tense: "Alkalinity does NOT have this block — it has no safeDoseBand
call of its own and never sets out.rateLimited... alkalinity clamps silently
at the end and says nothing." But alkalinity.js calls `rateLimitDose` itself
at line 853, and the comment sitting directly above that call
(alkalinity.js:848-851) correctly describes the same functionality in the
PAST tense as something that used to be missing and has since been added:
"Alkalinity had its own shorter version and never set out.rateLimited... The
ceiling was applied either way; the difference was that the user was not
told." The earlier comment (332-340) was not updated when the later fix
(848-853) was made, so it now asserts the opposite of what the file's own
code three hundred lines down does.
evidence: src/lib/dosing/alkalinity.js:335-339 ("Alkalinity does NOT have
this block... alkalinity clamps silently at the end and says nothing.")
vs. src/lib/dosing/alkalinity.js:848-853 (`const limited =
rateLimitDose(applied, out, def, settings, out.effectPerMl);`) with its own
comment describing the gap as already closed.
impact: Low direct user impact (the code itself is correct and consistent
with the newer comment), but a real hazard to future work on this file: a
maintainer or agent reading top-to-bottom hits the false claim first and may
"fix" a gap that no longer exists, or distrust the (correct) rendered
rateLimited banner because the nearby comment says alkalinity "says nothing."
suggested fix: Delete or rewrite alkalinity.js:332-340 to match current
behaviour, or move/consolidate it next to the 848-853 comment it now
duplicates and contradicts.
confidence: high

### static-analyst / 2026-08-13 / S4
what: src/lib/dosing/magnesium.js ends with an orphaned doc comment
describing a function that is not in this file. The comment
("A last backstop on the resulting dose, deliberately loose: two millilitres
per litre per day is beyond any real system, so this only catches
combinations the strength test somehow lets through.") is immediately
followed by end-of-file — no function definition. The function it describes
(a millilitres-vs-volume backstop, "two millilitres per litre" ≈ `ml <=
vol * 2`) does exist, but as `dosePlausible` in src/lib/dosing/helpers.js:525-529,
not in magnesium.js.
evidence: `cat -A src/lib/dosing/magnesium.js | tail -5` →
  }$
  $
  /* A last backstop on the resulting dose, deliberately loose: two millilitres$
     per litre per day is beyond any real system, so this only catches$
     combinations the strength test somehow lets through. */$
  (file ends at line 55, no code follows). src/lib/dosing/helpers.js:525-529:
  `export function dosePlausible(ml, settings) { const vol = Number(settings
  && settings.volumeL); if (!isFinite(ml) || !isFinite(vol) || vol <= 0)
  return true; return ml <= vol * 2; }` — matches the comment's description
  exactly (`vol * 2` = "two millilitres per litre").
impact: Cosmetic — behaviour is correct and dosePlausible is used correctly
by all three engines (grep confirms call sites in alkalinity.js:363,752,
calcium.js:383,499, helpers.js:764,860). But the dangling comment reads as
though a function was deleted from magnesium.js without removing its
docstring, which could lead a future reader to search for a missing
implementation that was actually just relocated.
suggested fix: Delete the orphaned comment from magnesium.js, or move it to
sit above `dosePlausible` in helpers.js where the function it describes
actually lives.
confidence: high

### static-analyst / 2026-08-13 / S4
what: src/components/Insights.jsx has a stray, misplaced comment sitting
above the wrong `useMemo` call. The comment ("The alkalinity protocol
assessment — computed here so the dose row and its detail read from one
result rather than two engines.") is positioned directly above the
`computeCalibration(...)` memo (ICP-vs-test-kit calibration), which has
nothing to do with an "alkalinity protocol assessment" or a "dose row" — no
such concepts appear anywhere near this code. `computeCalibration`'s actual
job (comparing logged readings against ICP lab panels to flag a
miscalibrated test kit) is unrelated to dosing protocol assessment entirely.
evidence: src/components/Insights.jsx:94-100:
  94: /* Same replacement dates the findings layer uses, or this panel would keep
  95:    showing an offset the rest of the app had already retired. */
  96: /* The alkalinity protocol assessment — computed here so the dose row and its
  97:    detail read from one result rather than two engines. */
  98: const calibration = useMemo(
  99:   () => computeCalibration(readings, icps, paramDefs, 7, kitChanges),
  100:   [readings, icps, paramDefs, kitChanges]);
`grep -n "dose row" src/components/*.jsx` → only this one hit, nowhere else in
the file or component tree; `grep -n "protocol assessment" src/components/Insights.jsx`
→ only this one hit, with no matching code below it. `git log -p --follow --
src/components/Insights.jsx | grep -n "alkalinity protocol assessment"` →
added once, in the file's initial commit — never relocated alongside actual
"dose row" code, if such code ever existed elsewhere in this file.
impact: Purely cosmetic/misleading — no behavioural effect, since
`computeCalibration`'s own two-line comment above it (94-95) is the one that
actually matches the code. But the misplaced block is confusing enough that
a future reader could mistake `calibration` for something dosing-related.
suggested fix: Delete the misplaced comment (lines 96-97) or move it to
whichever code it actually describes, if that code still exists elsewhere in
the file.
confidence: medium

### static-analyst / 2026-08-13 / S4
what: src/lib/stability-engine.js has a duplicate object key (`fmtRate`) in
a single object literal — a copy-paste artifact from merging two return
shapes. Harmless in this instance because both occurrences assign the
identical value, so the second silently overwrites the first with no
behaviour change, but it is the only such duplicate-key defect anywhere in
the app's bundled source.
evidence: src/lib/stability-engine.js:103-106:
  103:     return { grade: "unknown", label: "Not enough data", rule, fmtRate: "—",
  104:       detail: "Log another reading to establish a trend", readingCount: all.length,
  105:       spread: 0, spanDays: 1, netChange: 0, typicalRate: 0, fmtRate: "—",
  106:       pattern: "flat", atResolution: false, maxDelta: 0 };
`fmtRate` is set at both 103 and 105 (same value, "—", both times).
Confirmed via a full-app esbuild bundle of the real entry point (not a
partial/synthetic snippet): bundling src/App.jsx with esbuild
(`bundle:true, jsx:'automatic'`) produces exactly one warning across the
entire app: "Duplicate key \"fmtRate\" in object literal" at
src/lib/stability-engine.js:105 — no other duplicate-key warnings anywhere
else in the bundled tree, confirming this is not a systemic pattern
elsewhere.
impact: None currently (values are identical, so JS's "last key wins"
semantics produce the same result either way). Flagged because it is
concrete evidence of an object literal assembled by copy-pasting one
return shape into another without deduplicating fields — the same failure
class that, in a case where the two values differed, would silently drop
one of them.
suggested fix: Remove the duplicate `fmtRate: "—"` at line 105 (keep
the one at line 103, or vice versa — they're identical).
confidence: high
