# Routine 15 — Phase 6: The Known Bugs

Cloud routine. **Seven bugs, seven PRs, one at a time, each under the gate
that just landed.** `npm run verify` (routine 13, PR #9, merged to `main`)
must pass before any of these opens.

---

## Background

Phase 5 built `scripts/verify/*.mjs` and wired `.github/workflows/verify.yml`
into this repo's first CI. Building it surfaced two live crash bugs
(`.agent/findings.md`) that nobody had fixed yet, and the backlog already
carried three approved-for-authorization chemistry items (TW-016, TW-019,
TW-020) and two spec-decided-but-not-yet-coded rules (negative consumption,
stability grading) that predate Phase 5 entirely. This routine works through
all seven, smallest and most user-visible first.

**Every fix in this routine is pre-authorized by what's cited against it** —
either an existing `[chem]`-tagged, `owner: implementer — needs
[approved][chem]` backlog item this routine formally approves by naming it,
or a `**Decided <date>**` line already in `docs/spec/reef-chemistry.md`. Where
a bug's fix touches a number this routine does not explicitly authorize
(the routine found one — see bug 4's note on magnesium's own band — a
second, uncredited drift), **do not fix it.** Report it instead, the same way
Phase 5 reported what it found without touching it.

### The gate, and what it means for you

`npm run verify` runs the ported static checkers, the legacy-port
behavioural suite, and `npm run build`. It does **not** run `npm test`
(vitest) — that suite carries ~69 pre-existing, already-tracked `[chem]`
failures and was deliberately left out of the required check
(`.agent/phase5-gate.md` §7). That does not make vitest optional for you:
several of the bugs below have a vitest spec test already asserting the
correct behaviour (that's how some of them were found). Run `npx vitest run
<path>` against the specific spec file each bug names, in addition to
`npm run verify`, and expect some of those files to still be red afterward
for reasons unrelated to your fix — say so in the PR rather than chasing
every red line in a file you touched.

`linkcheck` and `propcheck` currently run **advisory** — they already found
bug 1, below, which is exactly why. TW-021 (`.agent/backlog.md`) says
explicitly what flipping them to blocking requires: fix both bugs, confirm
`npm run verify:linkcheck` and `npm run verify:propcheck` clean, flip their
`mode` in `scripts/verify/run.mjs` from `'advisory'` to `'blocking'`. Bug 1's
PR does all of that — it is the fix TW-021 is waiting on, not a follow-up.

---

## Rules, every bug, no exceptions

1. **One bug per PR.** Branch from current `main`, fix exactly one bug, open
   exactly one PR. Do not batch, even when two bugs touch the same file (bug
   2 and bug 3 both touch `src/lib/dosing/helpers.js` — still two PRs, in the
   order below, each branched from `main` after the previous one merged if
   there's a real dependency, see each bug's own note).
2. **A failing test first.** Before touching the fix, write the test that
   proves the bug — it must fail against the code as it stands today, for the
   reason the bug describes, not for an unrelated reason. Then fix the bug.
   Then confirm the test passes and nothing else broke. A PR with the test
   and the fix in the same commit is fine; a PR with only the fix, or with
   the test already passing before the fix lands, is not — you did not prove
   what you claim to have fixed.
3. **`npm run verify` must pass before every PR.** Not "should" — a red
   `npm run verify` is not a PR, it's unfinished work.
4. **Never edit a test to make it pass** (AGENTS.md #4). If a test's
   expectation looks wrong once you're in the code, that is a finding, not
   license to change the assertion — write it up (`.agent/findings.md` or
   `.agent/needs-dan.md`, whichever fits) and leave the test alone unless the
   bug you were assigned is specifically "the test is wrong."
5. **Never change a chemistry constant, formula, threshold or unit
   conversion beyond what's authorized below** (AGENTS.md #3). If the fix
   for one bug seems to want a second, unauthorized change to make sense,
   stop and report it — do not fix it "while you're in there."
6. **Stop at a bug boundary if running short on time, context or usage.**
   Finish the bug in progress (test, fix, verify, PR) or revert it entirely
   (AGENTS.md's checkpoint contract — half-fixed chemistry code is worse
   than no fix). Never stop mid-edit. Write `.agent/runs/<run-id>.md` and
   `.agent/log/<run-id>.md` before moving to the next bug and before
   stopping.
7. **Report anything more complicated than described here rather than
   forcing it.** This routine was written from reading the code once, on 14
   August. If a fix touches more than what's described — a third caller, a
   test that assumes something this routine didn't check, a number that
   doesn't reconcile the way the spec math below says it should — that is
   real information. Write it up and either scope the PR down to what's
   clean, or stop and ask, rather than making the diff bigger than the
   citation underneath it.
8. **Finish the job per bug**: commit, push, open the PR, in that order,
   before moving to the next bug (AGENTS.md #13). Never merge.

---

## The seven bugs, in order

### 1. The two ReferenceError crashes (Phase 5 findings)

Smallest, most user-visible, do first, as a pair — one PR fixes both, since
they're the same class of bug found by the same checkers and TW-021's
blocking-flip is naturally one change once both are fixed.

**1a. `App.jsx:1275`** calls `goTo({ tab: "dosing", key })`. `goTo` is
declared only inside `Dashboard`'s own body (`Dashboard.jsx:60`) — a
different component. `App.jsx` (the root, `ReefConsoleInner`) has no `goTo`
at all. Confirmed: `grep -rn "goTo\b" src/` returns exactly the declaration
in `Dashboard.jsx` and the one dead call in `App.jsx`. Throws the instant a
user taps "go to dosing" from the log-result popup after logging a reading.
`App.jsx` already has its own tab-switching state in scope at the call site
(there is a `tab`/tab-setter pair used elsewhere in the same render) — trace
it before deciding the fix; it may be as small as calling whatever `App.jsx`
already uses to switch tabs instead of a nonexistent `goTo`, or it may need
a small local `goTo` that does the same thing `Dashboard`'s does. Confirm by
tracing, don't assume.

**1b. `Tasks.jsx:198`** calls `onComplete(id)`. `Tasks`'s signature
(`Tasks.jsx:15-20`) never declares `onComplete` — it declares `onMarkDone`,
which is what `App.jsx:1248` actually passes in
(`onMarkDone={completeReminder}`). `grep -n onComplete src/components/Tasks.jsx`
shows exactly one assignment and one call, no declaration. Throws when a
user opens a reminder from the Tasks tab and taps "mark done" from its
sheet. Most likely fix: `onComplete` at `Tasks.jsx:198` should read
`onMarkDone` — confirm the sheet's contract expects the same `(id) => void`
shape before changing it, per rule 7 above.

**Tests first**: these are UI interaction bugs, not pure-function bugs — the
existing `src/test/defects/*.test.js` convention (spec-anchor comment, then
`vitest` assertions against a pure function) doesn't fit directly. Use
`@testing-library/react` (already a devDependency) to render the component,
simulate the tap, and assert it does not throw / does what it should
instead. Put both in `src/test/defects/` alongside the existing four, one
file per bug or one file for both — your call, they're small.

**Also in this PR**: once both are fixed and `npm run verify:linkcheck` and
`npm run verify:propcheck` are clean, flip `linkcheck` and `propcheck` from
`'advisory'` to `'blocking'` in `scripts/verify/run.mjs` (this is exactly
what TW-021 asks for) and move TW-021 from `## Blocked` to `## Done` in
`.agent/backlog.md`.

No chemistry, no spec citation needed — these are wiring bugs.

---

### 2. Negative consumption

**Where it authorizes from.** No line in `docs/spec/reef-chemistry.md`
states this rule yet in prose — checked directly, `grep -n "negative"
docs/spec/reef-chemistry.md` returns two unrelated hits. The actual working
is `.agent/five-decisions.md`, Decision 3 ("What happens when consumption
comes out negative?"), which worked three options and left it "no basis for
a recommendation — this needs Dan's judgement." **The authorization for this
bug is this routine's own text**, per the brief this was written from:
option (c), the "middle" option Decision 3 already worked the arithmetic
for. If `docs/spec/reef-chemistry.md` doesn't carry this rule by the time
you implement it, that's not yours to add — flag it in the PR body as a
canon gap for a future spec-reconciliation pass, and cite Decision 3
directly in the PR instead.

**The bug, today**, in all three engines (`alkalinity.js:635-642`,
`calcium.js:360-367`, `helpers.js:718-724`, same shape in each — written once
and copied, per the comment above each): when `out.consumption < 0`,
`out.gaining = -out.consumption; out.consumption = 0; out.maintenanceDose =
0`. From Decision 3's worked arithmetic: forcing `maintenanceDose` to 0
against any positive `currentDose` gives `doseDriftedFrom` a 100% gap,
saturating both the 12% (alkalinity) and 30% (calcium) triggers
unconditionally — the engine walks into its normal act branch and stages a
real ~25% dose cut (`DOSE_STEP_CAP`, `helpers.js:49`) toward a level the
arithmetic never actually diagnosed as excessive. Bracketing
(`bracketDose` and its fallback) both compute `consNow = currentDose ×
effectPerMl − trend` — the same formula, negative for the same reason — and
discard every observation when it isn't positive, so bracketing is
completely inert for exactly as long as gaining is in effect. Magnesium is
the one case that's fully silent instead: `DOSE_DRIFT_TRIGGER` has no
magnesium key (by design, §10), so `doseDriftedFrom` returns `false`
unconditionally and the hold branch fires with nothing but a relabelled
row — a wrong reading or unlogged event sits there renamed "gaining" with no
signal at all.

**The fix.** A negative beyond that element's own noise floor stops before
the hold/act branches and names the likely cause (bad reading, unlogged
water change, wrong Setup strength in that order of likelihood, matching
`strengthPlausible`/`dosePlausible`'s existing `action: "implausible"` /
`reason` / `nextCheck` convention — reuse that shape, don't invent a new
one). A negative within the noise floor carries on exactly as today (clamp,
label gaining, continue) — Decision 3's sourced finding stands: gaining is
sometimes real chemistry (a richer salt mix, dissolution, a nitrate-to-
alkalinity conversion, lower demand), not always a mistake.

**The threshold is each element's own trend-noise constant** — the one
Decision 3's arithmetic was built on: `ALK_TREND.stable` (0.10 dKH/day,
`alkalinity.js:28`), `CA_TREND.stable` (5 ppm/week, `calcium.js:27`),
`MG_TREND.stable` (10 ppm/week, `magnesium.js:16`). **This is a different
constant family from the one bug 7 uses** (`STABILITY_RULES`'s §5 kit noise
floors — 0.1 dKH / 10 ppm / 30 ppm) — same name, different numbers, different
job. Do not mix them up; say in the PR which one you used and why, since the
two are easy to confuse from the name alone.

**Ordering, must hold**: the check has to sit AFTER the `strengthPlausible`/
`dosePlausible` refusal (so a wrong-strength refusal still wins, it's a
worse problem) and BEFORE the emergency/rescue branches that sit later in
each function (so a level genuinely at/past its safe bound and still moving
the wrong way still gets its emergency response — Decision 3 flagged this
exact regression risk: "a hard refuse inserted at the clamp site runs before
[the emergency checks] and would suppress them"). Concretely: the new check
replaces the existing clamp-and-continue at the three cited line ranges,
but must run after the plausibility checks that already sit just below it
in each file and before whatever emergency logic follows.

**Tests first, one per element** (`src/test/defects/`, following the
existing spec-anchor-comment convention): construct a reading series whose
fitted trend makes `consumption` negative by (a) a small amount, inside the
noise floor — assert the existing clamp-and-continue behaviour is
unchanged; (b) a large amount, clearly beyond the noise floor — assert the
new refusal fires (`action`, `reason` naming a plausible cause,
`recommendedDose` not silently 0), and that an emergency condition
(constructed to also be true in the same case) still fires instead of being
swallowed by the new check. Decision 3's own worked numbers
(`.agent/five-decisions.md` lines ~843-880, alkalinity `currentDose=9.0`,
`trend=+0.90` producing `gaining=0.275`; calcium `currentDose=20`,
`trend=+6.0`; magnesium's `trend=+9`/week case) are real, checkable starting
points for the "large" case in each element — verify the arithmetic still
holds against current code before trusting it as a fixture, per rule 7.

---

### 3. Dose-gap halving removal + stability grading fix (one PR)

**These ship together, not separately** — per `reef-chemistry.md` §7's own
words: "the out-of-band halving is removed... it existed only as a patch for
broken stability grading (§11) — with grading fixed, the app catches a slow
decline directly and the hair-trigger is no longer doing any work." Today,
grading is **not yet fixed**. Removing the halving first would remove the
only thing currently catching a slow, out-of-band decline — a regression,
not a cleanup. Fix grading, confirm it actually catches what the halving
used to catch, then remove the halving in the same PR.

**3a. The halving** — `doseDriftedFrom`, `helpers.js:489-504`:
```js
const gap = Math.abs(maintenanceDose - currentDose) / currentDose;
return gap > (outOfBand ? trigger / 2 : trigger);
```
`outOfBand ? trigger / 2 : trigger` is the halving. §7: "Decided 13 Aug: the
out-of-band halving is removed." Fix: `doseDriftedFrom` always compares
against `trigger`, full stop — drop the `outOfBand` parameter and its ternary
entirely (three call sites pass it today: `alkalinity.js:716`,
`calcium.js:464`, `helpers.js:813` — update all three, and check
`alkalinity.js:716-718`'s multi-line boolean expression that computes the
`outOfBand` argument is either removed with it or left as genuinely dead
code your linter — sorry, `deadcode.mjs` — will now catch).

**3b. Stability grading** — the actual bug, per `reef-chemistry.md` §11:
"a level outside its band and moving further out is never graded stable,
**whatever the rate**," with two qualifiers: only movement *away* counts
(recovering back toward the band is fine), and the movement must clear that
element's kit noise floor (§5) over the fitted window.

Today, in all three engines (same shape, written once and copied — same
pattern as bug 2):
- `alkBandOf(trend)` (`alkalinity.js:186-192`, and the `caBandOf`/magnesium
  equivalents in `calcium.js:135-139` and `helpers.js:547-551`) grades
  purely from `|trend|` against a flat threshold (`ALK_TREND.stable = 0.10`
  dKH/day, etc.) — **zero awareness of band position.** This is the literal
  shape of the "most dangerous defect" §11 describes: a tank losing 0.02
  dKH/day (well under 0.10) grades `"stable"` regardless of where the level
  sits.
- There is a downstream partial guard — `alkWorsening`/`caWorsening`
  (`alkalinity.js:700-704`, `calcium.js:457-461`, check `helpers.js` for
  magnesium's equivalent, if any — magnesium doesn't drive a dose off trend
  per §10, so confirm whether it needs the same fix or is legitimately
  exempt before assuming it mirrors the other two) — but it requires
  `Math.abs(trend) >= ALK_TREND.stable` **or** `alkRepeats >= 2` on top of
  being clearly out of band. That first branch of the OR is just "not
  actually stable by the flat threshold" restated, and the second requires
  two corrections to have *already happened*. A slow decline that is out of
  band, still worsening, but under the 0.10 threshold and hasn't yet had two
  corrections tried — exactly §11's own worked example, 0.02 dKH/day — still
  reads `!alkWorsening` and still holds. This is the gap.

**The fix**: `alkBandOf` (and its calcium/magnesium equivalents) need to
stop being pure rate functions — grading has to know whether the level is
outside its band and which way it's moving, not just how fast. §11's rule
is unconditional on rate ("whatever the rate") once those two qualifiers
hold, so the fix is most likely in `alkBandOf`/`caBandOf`/magnesium's
equivalent themselves (make band position and direction part of what decides
"stable" is even a candidate answer), rather than only patching
`alkWorsening`'s OR condition — but verify against the full call graph of
`out.band` (it's read in more places than the hold branch — the UI shows it
too) before choosing where the fix lives, per rule 7. Whichever call site
changes, the two qualifiers are load-bearing and must both survive: movement
*away* only, and the movement must clear the element's own §5 noise floor
over the fitted window — a fix that grades stable-but-nonmoving readings as
unstable is a new bug, not this one fixed.

**Tests first**: `src/test/defects/`, one construction per element that
reproduces §11's own worked shape — a series clearly outside the band,
moving further out, at a rate under that element's `_TREND.stable` — assert
`out.band !== "stable"` (or however the fix expresses it) and that the hold
branch does not fire. A second case: outside the band but *recovering*
(moving back toward it) at the same slow rate — assert this one *does* still
read as expected (not punished for improving). A third: simulate what the
now-removed halving used to catch (an out-of-band dose gap that the flat
12%/30% trigger alone would miss before this fix, catches after) to prove
3a and 3b actually compose — the whole reason they ship together.

**Also worth doing in this PR** (not required, but directly relevant): run
`node scripts/verify/mutate.mjs` afterward, by hand, and check whether the
"the dose-gap check removed" mutation
(`scripts/verify/mutate.mjs`'s sixth entry) is still meaningful post-fix —
it currently mutates the very condition this bug changes. If the mutation's
anchor text no longer matches after 3a's edit, update it in the same PR
rather than leaving `mutate.mjs` silently checking nothing (AGENTS.md's own
lesson, "a check that cannot fail is worse than no check," Phase 5's whole
reason for existing).

---

### 4. Alkalinity band, 1.0 → 0.6

`docs/spec/reef-chemistry.md` §2: "**Decided 13 Aug:** alkalinity's band
tightened from 1.0 to 0.6." Suggested target 8.5 dKH, suggested band 0.6
total (±0.3) — the Layer 3 table in §2 gives it directly: **8.2–8.8 dKH.**

Current: `src/lib/constants.js`, the `PARAM_DEFS` entry —
```
{ key: "alkalinity", ..., min: 8.5, max: 9.5, ... }
```
Width 1.0, and — separately from the width — not even centred on the 8.5
target (`min` and target coincide; the real band today is target-to-target+1,
not target±0.5). Fix: `min: 8.2, max: 8.8`.

**Found while reading, not authorized here — report, do not fix**:
magnesium's entry in the same table is `min: 1250, max: 1400` (width 150 —
correct) but centred on 1325, not the 1350 target §2's own Layer 3 table
gives (1275–1425). This routine does not authorize touching magnesium's
band — only alkalinity's tightening was decided and cited. Flag it in this
PR's body as a second, uncredited off-centre band, and leave it for a
separate `[chem]` backlog item.

**Test first**: `band-edges.test.js`
(`src/test/spec/classification/band-edges.test.js`) already asserts
something about this — it's one of the 69 currently-red vitest specs (Phase
5's count). Read what it actually asserts before assuming this fix closes
it: its failure messages reference "§3 default coral-mix target for 'Mixed
reef'," which does not obviously match reef-chemistry.md's own §2/§3 — it
may be pointing at a different document's numbering (`wizard-states.md`?) or
a different concept (a coral-mix-specific default distinct from the generic
suggested target). **Do not edit that test to make it pass** (rule 4) — if
this fix closes some of its assertions and not others, say exactly which in
the PR, and don't force the rest. Write a new, narrower test in
`src/test/defects/` that asserts specifically what §2 says (8.2–8.8, ±0.3
around 8.5) if `band-edges.test.js` turns out to be asserting something else
entirely.

**Dependency note for bug 7**: bug 7's worked example numbers (8.40–8.60 dKH)
assume this band (8.2–8.8) is already in effect. Do this bug before bug 7,
as ordered, and prefer writing bug 7's regression test against an explicit
local `def` fixture (band values passed directly, not read from the live
`PARAM_DEFS` import) so the two PRs stay decoupled regardless of merge
timing — bug 7's fix is band-relative by construction (§9: "the zone is
computed from whatever band is in force and must never be hardcoded"), so
its test doesn't actually need this PR merged first if it supplies its own
band.

---

### 5. TW-016 — magnesium correction rail, 100 → 25

`.agent/backlog.md` TW-016, already `[chem]`, formally approved by this
routine. `docs/spec/reef-chemistry.md` §3: the magnesium rail is 25 ppm/24h
(settled 14 Aug, closing a prior 25-vs-50 conflict). Two places claim to
encode "the daily rail":

- `src/lib/analytics/safe-rate.js:27` — `CORRECTION_MAX_RATE = {alkalinity:
  0.5, calcium: 20, magnesium: 25}` — **already correct, do not touch.**
- `src/lib/analytics/correction.js:20` — `CORRECTIONS.magnesium.maxPerDay =
  100` — **four times the rail. This is the fix**: `100 → 25`.

**Test first**: `src/test/spec/classification/rails.test.js` already exists
and already asserts this (it's one of the 69 red vitest specs) — its
`SPEC_RAIL` constant (`{alkalinity: 0.5, calcium: 25, magnesium: 100}`, line
~24) is the **pre-13-Aug** canon and needs re-pointing to `{0.5, 20, 25}` as
part of this fix, per TW-016's own text — not a violation of rule 4, since
the backlog item explicitly names this file's constant as needing the
update, not just the assertions. Re-check the file's header comment too
(lines 1-19 cite "§6, lines 149-166," which is now §3 after the 14 Aug
canon swap) and correct the stale section reference in the same PR. After
the fix, `rails.test.js`'s calcium assertions should already be passing
(the code was already right there) and its magnesium ones should now pass
for the right reason — confirm both, don't just confirm the file goes green
as a whole without checking why.

---

### 6. TW-019 — remove magnesium from `DOSE_ADVICE_RULES`

`.agent/backlog.md` TW-019, already `[chem]`, formally approved by this
routine. `docs/spec/reef-chemistry.md` §10, "What is exempt": "**The
maintenance dose is never tuned from readings.** Not delayed — exempt... Any
answer the app produced would be invented."

`src/lib/analytics/drift.js:40-57` (`DOSE_ADVICE_RULES`) has a `magnesium:
{...}` entry with its own 14-35 day window, computing `needsAction`/
`severity` from a trend — independent of `DOSE_DRIFT_TRIGGER` (which
correctly has no magnesium key, per §10). `computeDoseAdvice` iterates
`Object.keys(DOSE_ADVICE_RULES)` generically — removing the key is enough,
no special-casing needed elsewhere in `drift.js` itself.

**Fix**: delete the `magnesium` entry from `DOSE_ADVICE_RULES`.

**Worth knowing, not required to fix**: `computeDoseAdvice`'s result is
consumed at three call sites — `Insights.jsx:108` and `Dashboard.jsx:298-300`
(both already flagged as **dead code**, TW-022, `.agent/findings.md` — the
`useMemo` result is computed and never rendered in either file, per Phase
5's `deadcode.mjs`) and `src/lib/dosing/corrected-strength.js:43-44`
(`previewStrengthChange`, which **is** live — rendered at
`Insights.jsx:697-720`). Trace `previewStrengthChange`'s before/after diff
logic and confirm it doesn't unconditionally index a `.magnesium` key on the
result expecting one to exist — after this fix, magnesium simply won't be a
key on the object `computeDoseAdvice` returns. This is a real thing to
verify, not a reason to expand this PR's scope into TW-022 — leave the dead
`doseAdvice` memos alone, they're a separate backlog item.

**Test first**: a small addition to (or new file alongside)
`src/test/spec/dosing/magnesium-gate.test.js` or a new `src/test/defects/`
file — assert `DOSE_ADVICE_RULES` has no `magnesium` key, and that
`computeDoseAdvice(...)`'s result object has no `magnesium` property for a
tank with a magnesium reading history that would previously have produced
one. Also exercise `previewStrengthChange` with a magnesium strength change
before/after and confirm it still returns sensibly (per the trace above)
rather than crashing or producing `undefined` where a number was expected.

---

### 7. TW-020 — `arrived` tests the arrival zone, not the full band

`.agent/backlog.md` TW-020, already `[chem]`, formally approved by this
routine. `docs/spec/reef-chemistry.md` §9: "**Decided 14 Aug: the arrival
test is the middle third of the band, floored so the zone is never narrower
than twice that element's noise floor (§5).**"

```
zoneWidth = max(bandWidth / 3, 2 × noiseFloor)     clamped to bandWidth
zone      = midpoint ± zoneWidth / 2
```

**The noise floor here is §5's kit noise floor** (0.1 dKH / 10 ppm / 30
ppm — `STABILITY_RULES[key].noiseFloor` in `src/lib/stability-engine.js`) —
**not** the `_TREND.stable` family bug 2 uses. Same caution as bug 2, other
direction: don't reach for `ALK_TREND.stable` here by habit.

Worked, against the bands that should be in force once bug 4 has landed
(§2 suggested bands, §9's own table):

| | Band | Middle third | 2 × noise floor | Arrival zone |
|---|---|---|---|---|
| Alkalinity | 0.6 dKH (8.2–8.8) | 0.20 | 0.2 | **8.40–8.60** |
| Calcium | 50 ppm (400–450) | 16.7 | 20 | **415–435** |
| Magnesium | 150 ppm (1275–1425*) | 50 | 60 | **1320–1380** |

\* Magnesium's *suggested* band per §2/§9 is 1275–1425. `constants.js`
currently ships 1250–1400 (see bug 4's note — a second, uncredited off-centre
band, not authorized for fixing here). The formula must read `def.min`/
`def.max` live, not these illustrative numbers — if you test against the
actual shipped `PARAM_DEFS`, your magnesium zone will legitimately differ
from the 1320–1380 shown here until that separate drift is fixed. That's
expected, not a bug in this fix — don't chase it.

Current: `correctionProgress`, `src/lib/dosing/helpers.js:273-279`:
```js
const inBand = (v) => v >= def.min && v <= def.max;
const lastTwo = rows.slice(-2);
const arrived = lastTwo.length >= 2 && lastTwo.every((r) => inBand(r.value));
```
Tests the **full band**, not a zone.

**Fix**: compute `zoneWidth`/`zone` per the formula above from `def.min`/
`def.max` (not hardcoded), and change `inBand` to an arrival-zone test for
the `arrived` computation specifically. **`inBand` itself may be used
elsewhere in the same function or file for a different purpose (band
membership, not arrival) — check every call site before narrowing it
globally; if it's shared, add a new `inZone`-style check rather than
changing what `inBand` means everywhere it's called.**

**Must not change, in the same fix** (§9 is explicit, and TW-020's own
`watch:` note repeats it): `passed` (`helpers.js:316`) — one reading at or
beyond the target — stays completely independent of `arrived`.
`correction-done` fires on `arrived || passed`
(`state.js:227`) — that's what keeps "return to maintenance" reachable even
when the narrower zone isn't hit twice. Do not conflate the two, and check
the call sites that branch on `cp.arrived` specifically for their wording —
a narrower zone makes the confident "arrived" language rarer for calcium and
magnesium; the copy at those call sites may need a look, not necessarily a
change, per what actually reads correctly once you see it.

**Test first**: `src/test/defects/`, one construction per element. Build a
reading pair inside the old (full) band but outside the new, narrower zone —
assert `arrived` is now `false` where it used to be `true`. Build a pair
inside the zone — assert `arrived` is still `true`. Build a case where
`passed` is true but `arrived` is false — assert `correction-done` still
fires (via whatever state.js exposes for this) to prove the independence
held. Per bug 4's dependency note, construct the `def` fixture explicitly
in this test (band values passed directly) rather than importing the live
`PARAM_DEFS`, so this PR does not implicitly depend on bug 4 having merged.

---

## Output

Per bug, as you finish it (not batched at the end):

1. The test-first commit and the fix commit (or one commit doing both, your
   call — the PR diff must make it obvious a failing test preceded the fix).
2. `npm run verify` output in the PR body's Verification section, plus the
   specific `npx vitest run <path>` output for any spec file the bug names,
   with a plain note on any failures in that file left unrelated to this fix.
3. The PR body follows AGENTS.md's template — What / Why / Spec reference /
   Risk / Verification / Not done / **In plain terms**, per rule 11: every PR
   states its fix twice, the precise version and the reefkeeping-plain one.
4. `.agent/backlog.md`: move the bug's own item (TW-016, TW-019, TW-020,
   TW-021) from wherever it sits to `## Done`, in the same PR that closes it.
   Bugs 2, 3 and 4 don't have existing TW items — file one only if you find
   follow-on work (per rule 7's "report, don't force" — the magnesium band
   drift found under bug 4 is exactly this: a new backlog item, not a fix).
5. `.agent/log/<run-id>.md`, appended per bug as you go, not reconstructed
   at the end — same checkpoint contract as every other routine.
6. `.agent/runs/<run-id>.md` updated before and after every bug.

When all seven are attempted (fixed, or explicitly reported-and-skipped per
rule 7), write `.agent/phase6-bugs.md`: one section per bug, outcome (fixed
+ PR link, or reported-not-fixed + why), and — per AGENTS.md #11 — both
layers: the precise version (file:line, the constants that moved, the test
that proves it) and the plain version (what a reefkeeper would notice
differently on the app, in one sentence, no identifiers). If a bug turns out
to be reported-not-fixed, that's a complete, successful outcome for this
routine — say so plainly, don't apologize for it.

---

## Never

- Land two bugs in one PR, except bug 1's pair and bug 3's pair — both
  explicitly paired above, for stated reasons; no other pairing.
- Edit a test to make it pass (AGENTS.md #4) — narrow scope, file a finding,
  or write a new, more specific test instead.
- Change a chemistry constant, formula, threshold or unit conversion this
  routine does not explicitly authorize for that bug — including ones you
  find along the way that look related (magnesium's band under bug 4;
  anything else you notice under any other bug).
- Touch `docs/spec/*` or anything under `legacy/`.
- Merge a PR, or enable auto-merge.
- Leave `mutate.mjs` checking a mutation whose anchor no longer matches
  after your fix without updating it (bug 3's note) — a check that can't
  fail is worse than none.
- Report a checker, test, or `npm run verify` result you did not actually
  run (AGENTS.md's evidence rule).

---

## Definition of done, per bug

- A test existed that failed for the stated reason, before the fix.
- The fix is exactly what's authorized above — no more, no less.
- `npm run verify` passes.
- The relevant vitest spec file (where one is named) was run and its result
  reported honestly, including anything still red for unrelated reasons.
- PR opened, per AGENTS.md #13's template, plain-language layer included.
- Backlog and the run file updated in the same PR.

## Definition of done, whole routine

- Seven bugs attempted in the order above, each a complete PR or an
  honestly reported skip.
- `.agent/phase6-bugs.md` written, both layers, per bug.
- No PR merged. No `src/` change without a preceding failing test. No
  chemistry constant moved beyond what's cited above.
