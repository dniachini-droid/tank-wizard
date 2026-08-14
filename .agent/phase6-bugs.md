# Phase 6 — the seven known bugs (routine 15)

All seven bugs attempted. Six fixed and shipped as their own PR; bug 2 was
fixed on a second pass after its first authorised approach broke three
blocking checks and was reverted. No PR in this routine has been merged —
merging is Dan's alone (AGENTS.md #13). Each bug branched independently from
`main` and was verified against its own base, per rule 1 — bugs 3-7 do not
depend on one another's unmerged PRs (bug 7's test is deliberately built
against a local fixture rather than live `PARAM_DEFS` so it does not
implicitly depend on bug 4 having merged).

Full detail, including everything tried, measured, and audited, is in
`.agent/log/2026-08-14-phase6-bugs.md`. This file is the summary AGENTS.md
#11 asks for: what changed, precisely, and what a reefkeeper would notice.

---

## Bug 1 — the two ReferenceError crashes

**Outcome: fixed.** PR #12 (merged).

**Precise.** `App.jsx:1275` called `goTo(...)`, which existed only inside
`Dashboard`'s own render body — `App.jsx` (`ReefConsoleInner`) had no `goTo`
at all. Fixed to `onOpenDosing={() => setTab("dosing")}`, matching the
existing tab-switch pattern used everywhere else in the file.
`Tasks.jsx:198` called `onComplete(id)`, which `Tasks` never received (its
prop is `onMarkDone`). Fixed to call `onMarkDone`. Both confirmed to throw
`ReferenceError` before the fix (`src/test/defects/tab-navigation-crashes.test.jsx`)
and to work after. `verify:linkcheck`/`verify:propcheck` — the two checkers
that had already found these — flipped from advisory to blocking in the same
PR (TW-021).

**Plain.** Tapping "go to dosing" from a log-result popup, and tapping "mark
done" on a reminder, both used to crash the app outright. Both now work.

---

## Bug 2 — negative consumption

**Outcome: fixed, on the second pass.** First pass (PR #14) reported and
reverted; second pass (PR #18) shipped. Both merged.

**Precise.** A rising reading (consumption computes negative) used to force
`maintenanceDose` to 0, which read as a 100% gap to the dose-gap trigger and
staged a real ~25% dose cut toward a level the arithmetic never diagnosed as
excessive. The routine's originally-authorised fix (a hard refusal beyond
each element's trend-noise floor) broke three blocking checks on its first
attempt — golden, protocols, and invariants all disagreed with the premise
that a negative consumption means something is wrong. Reported to Dan
(`.agent/needs-dan.md`), who withdrew that premise and authorised a
four-part replacement instead: hold; report the observation, not a cause;
ask whether an unlogged water change or correction explains it, with a
retest offered; escalate only on three consecutive negatives with nothing
logged. Recorded at `docs/spec/reef-chemistry.md` §24. Implemented in all
three engines (`alkalinity.js`, `calcium.js`, `helpers.js`'s magnesium
assessment) via one shared helper. One qualification beyond the authorised
words, flagged explicitly rather than buried: a level at or over the top of
its range and still rising keeps its reduction (without it, a sourced
protocol example fails). `doseStatus`'s idle-card wording, which would have
contradicted the new hold under a wizard asking for a retest, was corrected
in the same PR.

**Plain.** If a reading comes back higher than expected — more often than
not just test noise, an unlogged water change, or a richer salt mix — the
app now holds the dose and asks a clarifying question instead of quietly
cutting the dose by a quarter for a problem that was never real.

---

## Bug 3 — dose-gap halving removed, stability grading fixed

**Outcome: fixed.** PR #22 (not yet merged).

**Precise.** `doseDriftedFrom` (`helpers.js`) no longer halves its 12%/30%
dose-gap trigger when the level is out of band — the `outOfBand` parameter
is gone. `alkBandOf`/`caBandOf`/`mgBandOf` now take a second argument and
promote a rate-only "stable" grade to the next band up when the level is
outside its band, still moving away, and the movement clears the element's
§5 kit noise floor over the fitted window (§11) — via one shared
`outOfBandWorsening` helper, not three inline copies. Confirmed magnesium is
not exempt: it has no `DOSE_DRIFT_TRIGGER` key (§10), so grading is its
*only* guard against an indefinite "stable" hold. Golden re-recorded after
auditing all 441 changed rows; one genuine coverage gap found in the
process — under an active correction, the (now-removed) raw-position check
and the new fitted-position check can disagree, so a narrow ~7-8.7%
alkalinity dose gap goes uncaught by either mechanism for the life of the
correction — written up in full at `.agent/needs-dan.md` item 3, not fixed
(outside this bug's authorisation).

**Plain.** A tank drifting slowly out of its healthy range — too slowly to
trip the old "that's moving fast" alarm, but for long enough that it's a
real trend — now gets flagged and acted on, instead of the app saying
everything looks steady. (One narrow exception, found and reported rather
than fixed: while a manual top-up correction is already running, a
moderate dosing error can still go unflagged for a while.)

---

## Bug 4 — alkalinity band, 1.0 → 0.6 dKH

**Outcome: fixed.** PR #23 (not yet merged).

**Precise.** `constants.js` PARAM_DEFS alkalinity: `{ min: 8.5, max: 9.5 }`
→ `{ min: 8.2, max: 8.8 }`, matching §2's decided target (8.5) and band
(0.6 total, ±0.3) exactly — the old band wasn't even centred on its own
target. Three collateral test files (`tests/legacy-port/summary.js`,
`src/test/spec/history/target-change-immutability.test.js`,
`src/test/spec/dosing/rounding.test.js`) had hardcoded alkalinity reading
values that assumed the old band; their fixture *numbers* were re-picked
(never their assertions) to keep testing what they claim to. Confirmed via
a differential vitest diff that the full suite's failure list came back
byte-identical to a freshly measured baseline. Found, not fixed:
magnesium's own PARAM_DEFS band is centred on 1325 ppm, not its 1350 ppm
target — same shape as this bug, filed as TW-026 (not authorised under this
bug's alkalinity-only citation).

**Plain.** Alkalinity's healthy-range window narrowed from a full point to
0.6 of a point, matching the tighter guidance the spec settled on — the app
will speak up about a drifting alkalinity reading sooner than it used to.

---

## Bug 5 — TW-016, magnesium correction rail 100 → 25 ppm/24h

**Outcome: fixed.** PR #25 (not yet merged).

**Precise.** `correction.js:20` `CORRECTIONS.magnesium.maxPerDay`: 100 → 25,
matching §3's settled rail (`safe-rate.js`'s `CORRECTION_MAX_RATE.magnesium`
was already correct at 25). `rails.test.js`'s `SPEC_RAIL` constant and
stale "§6" header citation corrected in the same PR, per the backlog item's
own instruction — confirmed calcium's assertions now pass for the reason
they were always right, magnesium's for the new reason.
`tests/parity/correction-calculator-vs-rail.test.js`, which existed to
demonstrate this exact defect, needed the same treatment: its real SPEC
VIOLATION assertion now passes unedited (the fix's own effect); two others
that hardcoded the buggy 100/4× figures as fact were re-pointed to the
corrected numbers.

**Plain.** The "how many days will this correction take" figure on Setup's
magnesium correction calculator now matches the pace the rest of the app
already treats as safe, instead of suggesting something roughly four times
faster.

---

## Bug 6 — TW-019, magnesium removed from DOSE_ADVICE_RULES

**Outcome: fixed.** PR #26 (not yet merged).

**Precise.** `drift.js`'s `DOSE_ADVICE_RULES` magnesium entry deleted — it
computed a "suggested dose" from a trend window independently of both
`DOSE_DRIFT_TRIGGER` (correctly absent for magnesium) and the real dosing
wizard, exactly what §10 exempts magnesium from. Traced the one live
consumer, `previewStrengthChange`, and confirmed its reads are already
guard-clause-safe against the key being absent. Found and fixed in the same
PR (unavoidable, not scope creep): `tests/legacy-port/husbandry.js`
unconditionally indexed the now-absent key and would otherwise crash —
confirmed directly, not assumed.

**Plain.** A second, hidden "suggested magnesium dose" — one the real
dosing wizard never used and the spec says shouldn't exist — has been
removed from a strength-change preview screen.

---

## Bug 7 — TW-020, arrival zone vs full band

**Outcome: fixed.** PR #27 (not yet merged).

**Precise.** `correctionProgress` (`helpers.js`) now tests arrival against
the §9 middle-third zone (`max(bandWidth/3, 2×noiseFloor)`, clamped,
centred on the midpoint), computed live from `def.min`/`def.max` — not the
full band. `noiseFloor` is §5's `STABILITY_RULES`, not the `_TREND.stable`
family bugs 2/3 use. `passed` and the `arrived || passed` correction-done
trigger confirmed untouched, via a live integration test, not just the raw
fields. Two call sites' copy ("inside your band") updated to "back near the
middle of your range" — still true either way, now precise.

**Plain.** "Correction finished" now requires two readings genuinely settled
near the middle of the target range, not just anywhere inside it — so the
app stops declaring victory the moment a correction merely crosses into the
range while still climbing.

---

## Loose ends, for Dan

- `.agent/needs-dan.md` item 3 — the bug-3 dose-gap coverage question
  (options, not a recommendation).
- `.agent/backlog.md` TW-026 (mine, bug 4's magnesium band finding) — needs
  approval before an implementer can act.
- Two backlog numbering collisions, found across concurrent work, not
  renumbered (an ID is cited from run notes and PRs — Dan's call):
  **TW-016** (this routine's bug 5 vs. a pre-existing terminology item) and
  **TW-026** (this routine's bug 4 finding vs. a pre-existing item from an
  unrelated concurrent canon-sync run).
