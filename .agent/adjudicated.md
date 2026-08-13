# Wave 3 / Step 1 — Adjudication of tonight's S1/S2 findings

Run: 2026-08-13-build-1, wave 3, step 1 (adjudicator, sequential, solo).
Scope: every S1/S2 raw finding in `.agent/findings.md` from tonight's wave-2
sweep (6 parallel auditors). Each item below was independently re-derived —
either by re-running an existing test file in the repo, or by writing a
throwaway repro against the real (unmodified) source and deleting it
afterward (`git status --porcelain` confirmed clean each time; two such
scratch files were captured by an intermediate autocommit mid-run and have
since been deleted again — harmless, no application source touched).

No application source was edited. This file and its cross-references are the
only output.

## Summary

- **Confirmed as filed:** 9 (breaker S1, breaker S2, domain-verifier S1
  ×2, domain-verifier S2 ×2, state-auditor S1 ×2, state-auditor S2,
  static-analyst S2, dataflow-tracer S2) — see list, 10 items total below,
  all held at their original severity. Nothing was downgraded: every S1/S2
  raised tonight reproduced exactly as claimed, and none overstated severity.
- **Downgraded:** 0
- **Unconfirmed:** 0
- **Merged / duplicate-of-backlog:** 2 (domain-verifier's magnesium-rail S1 →
  TW-016; domain-verifier's banned-terminology S2 → TW-017). One more
  (rails.test.js/rate-rails.test.js stale-canon S2) substantially overlaps
  TW-016's own repro list and should be folded into it rather than filed
  separately — noted below.
- **Contradictions between agents:** none found requiring a spec tie-break.
  The only cross-agent interaction is breaker/S1 *correcting* (not
  contradicting) domain-verifier's earlier S3 "currently unreachable in
  practice" claim about the same guard — both are consistent once you add
  the second write path breaker found; treated as one merged item below.
- **Bookkeeping issue (not resolved here, flagged for triage-analyst):**
  `.agent/backlog.md` has two items both numbered **TW-016** — the magnesium
  rail-constant item (line 25, tagged `[chem]`, "Needs Dan's approval"
  section) and the "drift"/"drifting" terminology item (line 262, untagged,
  further down the same file). These are unrelated. Needs renumbering; not
  an adjudication call, a bookkeeping fix.

Net read on tonight: **not noise.** Every S1/S2 raised this cycle held up
under independent reproduction, at the severity claimed. That's a good sign
for the wave-2 auditors' calibration tonight, not a coincidence to wave past.

---

## Confirmed findings (own evidence)

### 1. breaker/S1 — negative volumeL reaches Insights via restoreBackup unsanitised

**CONFIRMED S1.**

- `src/lib/analytics/calcification.js:25` guards only `if (!volumeL)`, which a
  negative number passes (it's truthy). Reproduced directly:
  `computeSkeletonMass(0.3, -50)` → `{ gPerDay: -0.268090..., gPerMonth:
  -8.160665... }` instead of the refusal shape. Ran with a standalone node
  snippet against the function body verbatim.
- `src/lib/backup.jsx:151-155` `restoreBackup` writes
  `{ ...DEFAULT_SETTINGS, ...b["tank-settings"] }` straight from the parsed
  backup file with zero numeric validation — confirmed by reading the
  function; no `volNum > 0 ? volNum : null` guard anywhere in it (that guard
  exists only in `Setup.jsx:77`'s `saveVolume`, a different write path).
- `src/components/Setup.jsx:602-608` confirmed: the Restore button calls
  `restoreBackup(pending.parsed, {...}, true)` with `applySettings`
  hardcoded `true` — no checkbox, no per-field confirmation. The adjacent
  copy at `Setup.jsx:596` ("nothing is overwritten or duplicated") is false
  for `tank-settings`: it is overwritten, unsanitised, unconditionally.
- `src/components/Insights.jsx:116-118,424,442` confirmed: `skeleton =
  computeSkeletonMass(consumption.consumption, settings.volumeL)`, guarded
  only by `skeleton.status === "novolume"` before falling through to
  `skeleton.gPerMonth.toFixed(0)` — a negative-but-truthy object never hits
  the guard, so `-8 g of calcium carbonate a month` would render.
- Ran the auditor's own three test files as the independent check (not
  trusting their prose, executing the assertions myself):
  `npx vitest run src/test/spec/analytics/skeleton-mass-negative-volume.test.js
  src/test/spec/components/insights-skeleton-negative-volume.test.js
  src/test/spec/data/backup-restore-data-integrity.test.js` →
  6 failed / 2 passed, all 6 failures are exactly the claimed bugs (verified
  the diff output myself, not just the pass/fail count).

This also **supersedes** domain-verifier's own earlier S3 on the same guard
(`calcification.js:25`, findings.md line 15), which called the bug
"currently unreachable in practice" because it only checked the Setup.jsx
write path. breaker's finding is not a contradiction of that S3 — it is a
second write path (`restoreBackup`) the S3 finding didn't know about, which
makes the underlying bug reachable and materially worse than S3 filed it.
Treat as one merged item at S1 (breaker's severity), not two.

### 2. breaker/S2 — restoreBackup's dedup silently drops a genuine same-day retest

**CONFIRMED S2.**

- `src/lib/backup.jsx:114` keys `readings` by `${r.param}|${r.date}` only —
  no time, no value. Two different readings for the same param/day (e.g. an
  AM reading and a corrected PM retest) collide on the same key; the second
  is silently dropped rather than added (`have.has(k)) continue;` at line
  143).
- Ran the auditor's existing test:
  `npx vitest run src/test/spec/data/backup-restore-data-integrity.test.js` →
  the "two DIFFERENT alkalinity readings on the same day... merge into one"
  case fails exactly as claimed: `expected [...] to have a length of 2 but
  got 1`.
- Confirmed the contradiction with the UI's own copy: `Setup.jsx:596`,
  "Restoring adds anything missing and leaves what you already have alone,
  so nothing is overwritten or duplicated" — a second same-day reading with
  a different value is something missing, and it is not added. `skipped`
  (backup.jsx:89-99) only counts unparseable rows, not natural-key
  collisions, so the preview gives no hint this happens.

### 3. domain-verifier/S1 — magnesium §6 rail still broken both directions

**CONFIRMED S1. DUPLICATE-OF-TW-016** (the magnesium-rail backlog item,
`.agent/backlog.md` line 25, tagged `[chem]`, "Needs Dan's approval"
section — not the *other*, unrelated item also numbered TW-016 further down
the same file; see bookkeeping note above).

- `src/lib/analytics/correction.js:20` — `CORRECTIONS.magnesium.maxPerDay =
  100`. `docs/spec/reef-chemistry.md` §6 table (line 158): "Magnesium | 50
  ppm | Aqua Forest magnesium label: 'maximum daily increase 50 mg/l
  (ppm)'." 100 is 2x the current rail.
- `src/lib/analytics/safe-rate.js:27,31` — `CORRECTION_MAX_RATE.magnesium =
  25` / `SAFE_DAILY_RISE.magnesium = 25` — half the current rail, and per
  spec §6 "`[user]` may tighten a rail," not the app itself unprompted.
- Verified both file locations by direct read (not trusting the finding's
  quoted line numbers): confirmed `correction.js:20` and
  `safe-rate.js:27,31` read exactly as claimed.
- Verified calcium is correct in both places: `correction.js:16` maxPerDay
  20, `safe-rate.js:27` calcium 20 — matches spec §6 line 157 ("Calcium | 20
  ppm"). No calcium regression.
- `.agent/needs-dan.md`'s Decisions section (2026-08-13, Dan) already
  resolves this exact question: "Magnesium rail: 50 ppm/24h... Neither
  in-app table was right." This finding is Dan's already-made decision,
  re-verified fresh against the current tree, not a new escalation.
- Ran `npx vitest run src/test/spec/classification/rails.test.js` →
  6 failed / 6 passed (12), consistent with the claim (see item 5 below for
  the separate issue that this test file's own constants are also stale).

### 4. domain-verifier/S1 — DOSE_ELEMENTS default Ca/alk strength ratio contradicts spec's fixed 7.15

**CONFIRMED S1.**

- `src/lib/analytics/consumption.js:84-93`: alkalinity `defaultStrength:
  0.0533`, calcium `defaultStrength: 0.3611`. `0.3611 / 0.0533 =
  6.774859287054409` (verified with `node -e`). `docs/spec/reef-chemistry.md`
  §1 (line 33): "Ca:alk consumption ratio | **7.15 ppm Ca per 1.0 dKH**" —
  fixed for every user, "Changing any of these without an `[approved][chem]`
  item is an S1 defect" (line 29).
- Ran `npx vitest run src/test/spec/analytics/unit-conversions.test.js` →
  fails exactly as claimed: `expected 6.774859287054409 to be close to 7.15`.
- Also confirmed the hint text's own arithmetic is self-inconsistent:
  `consumption.js:90` claims "6.8 ppm calcium per dKH" but the coded values
  imply 6.77, not even the 6.8 the copy itself states.
- Not a duplicate of anything currently in `.agent/backlog.md` — new item.
  Needs `[approved][chem]` before any code change (AGENTS.md rule 3). The
  auditor's own suggestion to check whether 6.8x reflects a real product's
  actual mixing ratio (spec-vs-product-reality question) is worth carrying
  into triage, but I'm not filing to `spec-challenges.md` myself — that's a
  judgment call for whoever owns the fix, not an adjudication call.

### 5. domain-verifier/S2 — rails.test.js / rate-rails.test.js hardcode pre-today canon

**CONFIRMED S2. Substantially overlaps TW-016** (rails.test.js is already
named in TW-016's own `repro:` line and its own note: "The test constants
must be re-pointed at the new rails as part of this item, not edited on
their own to go green"). **New information this finding adds:**
`src/test/spec/dosing/rate-rails.test.js` also hardcodes the stale table
(`calcium: 25`, `magnesium: 100`) and is not currently named anywhere in
TW-016 — triage-analyst should fold this second file into TW-016's repro
list rather than opening a new backlog item.

- Verified by reading both files directly:
  `src/test/spec/classification/rails.test.js:24` — `const SPEC_RAIL = {
  alkalinity: 0.5, calcium: 25, magnesium: 100 };` — stale (current canon:
  calcium 20, magnesium 50, per `docs/spec/reef-chemistry.md` §6, confirmed
  by reading the spec file directly).
  `src/test/spec/dosing/rate-rails.test.js:37-45` — explicit
  `expect(SAFE_DAILY_RISE.calcium).toBe(25)` and
  `expect(SAFE_DAILY_RISE.magnesium).toBe(100)`, both stale against current
  canon.
- Ran both: `npx vitest run src/test/spec/classification/rails.test.js
  src/test/spec/dosing/rate-rails.test.js` → confirmed calcium assertions
  fail (`expected 20 to be 25` — i.e. the test currently punishes the
  *already-correct* code) and magnesium assertions fail in the right
  direction but against the wrong stale target (100, not 50).
- Correctly not an AGENTS.md rule-4 violation to fix: these are pinned
  against a spec table that changed today, which is "the test is genuinely
  wrong" per the rule's own carve-out, not a "delete a failing test" case.

### 6. domain-verifier/S2 — banned "water volume"/"tank volume" still live at findings.js:363

**CONFIRMED S2. DUPLICATE-OF-TW-017** (`.agent/backlog.md` line 45,
already filed, untagged, same repro).

- `src/lib/findings.js:363` verified verbatim: `"Every dosing and
  consumption figure divides by your tank volume, ... Enter your net water
  volume — total system litres..."`. `docs/spec/surfaces-and-messaging.md`
  §5 terminology registry (line 132): required term **"net volume"**; never
  use "water volume, tank size, volume, capacity" — both "tank volume" and
  "net water volume" in this one message land in the banned column (neither
  is the bare, required "net volume").
- Confirmed with `grep -rniE "water volume|tank size\b" src --include=*.js
  --include=*.jsx | grep -v /test/` → this is the only live hit, matching
  the auditor's claim of a single remaining site.
- This message fires on the "tank volume not set" finding — the same
  safety-critical refusal TW-001 touched tonight — so it's worth flagging
  again even though it's already tracked, in case TW-017 gets deprioritised
  relative to tonight's more novel items.

### 7. state-auditor/S1 — missing key lets a stale dose mL amount cross elements in DosingWizard

**CONFIRMED S1 — reproduced live**, not just from code trace.

- Code trace: `src/components/DosingWizard.jsx:252`
  `<AlkAssessmentBlock a={active.a} def={activeDef} .../>` has no `key`.
  `src/components/DoseChangeSheet.jsx:17` seeds `const [ml, setMl] =
  useState(String(recommended != null ? recommended : current))` once at
  mount — since neither `AlkAssessmentBlock` nor the nested
  `DoseChangeSheet` remounts when `openKey` changes, this state persists
  across an element switch.
- Independent reproduction (scratch RTL test, written and deleted this run,
  `git status --porcelain` confirmed clean after): rendered the real,
  unmodified `DosingWizard` with `alkAssessment.recommendedDose = 5.2` and
  `caAssessment.recommendedDose = 40`, opened alkalinity's dose sheet
  (confirmed input showed `"5.2"`), then clicked the Calcium card without
  closing the sheet. The mL input remained `"5.2"` — console-verified
  `mlInputAfter value: 5.2` — exactly the claimed defect. If Record were
  tapped at that point, `onApplyDose(ml=5.2, {...calcium metadata...})`
  would write alkalinity's dose figure under calcium's element key.

### 8. state-auditor/S1 — Setup's Volume field silently reverts an unsaved edit on any unrelated settings write

**CONFIRMED S1 — reproduced live.**

- Code trace: `src/components/Setup.jsx:58-64` —
  `useEffect(() => { setVol(...); ... }, [settings, elemKey])` fires on
  *any* new `settings` object reference, not just an external
  restore/reload. `src/App.jsx:388-394` `addDoseChange` (called from
  Setup's own "Save dose change" button) calls `saveSettings({ ...settings,
  [cfg.doseField]: row.ml })` — an unrelated write that produces a new
  object identity and re-fires Setup's resync effect.
- Independent reproduction (scratch RTL test, written and deleted, tree
  confirmed clean after): harness mirrors App.jsx's real wiring (dose save
  also writes settings). Set `settings.volumeL = 70`, typed `"95"` into the
  Volume field without saving it, then filled and saved an unrelated Dose
  field. Result: Volume field reverted to `"70"` — confirmed via
  `waitFor(() => expect(volInput.value).toBe('70'))` passing, i.e. the
  unsaved edit was actually lost.

### 9. state-auditor/S2 — DoseChangePopup's countdown isn't reset on a new result; can self-close before the user sees it

**CONFIRMED S2 — reproduced live.**

- Code trace: `src/components/DoseExpectation.jsx:23-27` resets `phase` on
  a new `result` but not `left`. The countdown effect (`:30-34`) re-fires on
  the new `result` while `left` is still `0` from the prior popup's
  countdown, calling `onClose()` immediately. Contrasted with the app's
  three sibling popups (`App.jsx:1273,1276,1278`), all explicitly `key`ed
  to force a remount per result — `DoseChangePopup` (`App.jsx:1272`) is not.
- Independent reproduction (scratch vitest test using fake timers, written
  and deleted, tree confirmed clean after): rendered `DoseChangePopup` with
  a first `result`, advanced fake timers 16s (14s AUTO + margin) →
  `onClose` called once, as designed. Cleared the mock, supplied a second,
  different `result` via `rerender` with **zero** additional time elapsed →
  `onClose` was called again immediately (`expected "vi.fn()" to not be
  called at all, but actually been called 1 times`), confirming the second
  confirmation popup self-closes before any time passes.

### 10. static-analyst/S2 — rateLimitDose vs applyDoseConstraints ordering: "Held to X mL" banner can disagree with recommendedDose

**CONFIRMED S2 — reproduced live against the real, unmodified functions.**

- Code trace confirmed the call order in all three engines:
  `src/lib/dosing/alkalinity.js:853` `rateLimitDose(...)` (sets
  `out.rateLimited`) runs, then `:859` `applyDoseConstraints(...)` (which
  re-applies bracketing, `capDoseStep`, and its own trailing `safeDoseBand`
  re-check) can shrink `next` further without touching `out.rateLimited`.
  `out.recommendedDose = next` (`:862`) is set from the *post*-constraints
  value. Grep confirmed the identical pattern in `calcium.js:574,580,583`
  and `helpers.js:942,948,951`.
- Independent reproduction: imported the real exported `rateLimitDose` and
  `applyDoseConstraints` from `src/lib/dosing/alkalinity.js` in a scratch
  vitest file (written and deleted, tree confirmed clean after), called
  them in production order with the auditor's own realistic inputs
  (`currentDose: 4, maintenanceDose: 50`, 200 L tank, `applied = 4.6`) —
  confirmed `out.rateLimited.allowed !== finalNext` (the assertion passed),
  matching the claimed mismatch (banner claims one allowed figure,
  `recommendedDose` — what the DoseChangeSheet actually prefills — is a
  different, further-clamped number).
- Confirmed the render sites: `ErrorBoundary.jsx:158-165` renders
  `a.rateLimited.allowed/.wanted/.perDay/.days` verbatim with no re-check
  against `a.recommendedDose`; `ErrorBoundary.jsx:249-251` prefills
  `DoseChangeSheet` from `a.recommendedDose`. `out.stepCapped` (which would
  explain the second clamp) is set but never read outside
  `alkalinity.js`'s own assignment (confirmed via grep) — no path exists
  today to show the user why the two numbers differ.

### 11. dataflow-tracer/S2 — CorrectionPanel gets def={active.def} (always undefined); temporary-correction UI is dead code

**CONFIRMED S2 — unambiguous from a direct code read, no ambiguity to
adjudicate.**

- `src/components/DosingWizard.jsx:199-203` — the `items` array:
  `{ key, a, apply, clear, effect }`. No `def` field, anywhere in any of
  the three entries.
- `src/components/DosingWizard.jsx:268` —
  `<CorrectionPanel def={active.def} .../>` — `active.def` is therefore
  always `undefined`.
- `src/components/DosingWizard.jsx:101` — `CorrectionPanel`'s first line,
  `if (!def) return null;` — short-circuits before any of the offer /
  running / arrived branches execute.
- `activeDef` is correctly computed two lines above the render, at
  `DosingWizard.jsx:212` (`paramDefs.find((d) => d.key === active.key)`),
  and is already the prop used for `AlkAssessmentBlock` at line 252 — it is
  simply not the value passed to `CorrectionPanel`.
- **Flagging the tension explicitly, as instructed**: this directly
  undermines tonight's TW-001 fix. `proposeCorrection`'s new refusal object
  (`{possible:false, why:'...net volume...'}`) is only ever read inside
  `CorrectionPanel`'s render body — which never executes. TW-001's own
  verification note ("DosingWizard.jsx already renders offer.why")
  describes code that is textually present but cannot run in the browser a
  real user sees. The fix is real; the surface for it is not reachable.
  This is the same missing-`key`/wrong-prop family as state-auditor's S1
  (item 7) and S3 (`CorrectionPanel`'s `pace` state not resetting across
  elements, findings.md line 563) — related but not the same specific bug:
  item 7 is a missing `key` (stale state carried across remounts that
  should have happened), this one is a wrong prop value (`def` bound to a
  field that doesn't exist on the object). Fixing one does not fix the
  other; both need addressing on `CorrectionPanel`/`DosingWizard.jsx`.

---

## Clustering notes (root cause)

- **DosingWizard "no remount on element switch" family** — three distinct
  findings share the same underlying pattern (no `key` tied to
  `active.key`/`openKey` on the panel that's supposed to change identity per
  element): state-auditor's S1 (item 7, stale mL — the dangerous one,
  writes a wrong number), state-auditor's S3 (findings.md line 563,
  `CorrectionPanel`'s `pace` carried over — cosmetic, not independently
  re-verified since it's S3), and dataflow-tracer's S2 (item 11, wrong prop
  entirely, so the panel never renders regardless of key). Recommend
  triage-analyst file these as one backlog item ("key the active-element
  panel by `active.key`; fix `def={active.def}` → `def={activeDef}`") since
  a single `DosingWizard.jsx` change addresses all three, rather than three
  separate items competing for review attention.
- **§6 magnesium rail family** — domain-verifier's S1 (item 3) is TW-016
  itself, re-verified; domain-verifier's S2 (item 5) adds one new file
  (`rate-rails.test.js`) to TW-16's existing repro list. One backlog item,
  not two.
- **Terminology family** — domain-verifier's S2 (item 6) is TW-017 itself,
  re-verified, no new information beyond confirming the repro still holds.

## Backlog bookkeeping (flagged, not resolved)

`.agent/backlog.md` has two items both numbered **TW-016**:
1. Line 25 — "Magnesium rail constants disagree with canon's new 50
   ppm/24h" ([chem], "Needs Dan's approval" section).
2. Line 262 — "'drift'/'drifting' is used for three incompatible meanings
   across the app" (untagged, further down, unrelated content).

This is a numbering collision, not a duplicate-content issue — the two
items are about entirely different code. Per the run brief, this is a
bookkeeping fix for triage-analyst (renumber one of them), not an
adjudication call on my part.
