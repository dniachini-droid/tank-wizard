# Run 2026-08-15-clearly-out-margins

Owner decision, delivered directly by Dan, closing `.agent/needs-dan.md` item 5
and authorising the spec edit that records it. Not a routine. One change,
implemented test-first, then audited by element and direction.

Branch: `claude/reef-chemistry-clearly-out-zwjte5`.

---

## The decision, as given

> Out and clearly out are two different questions and get two different numbers.
>
> A level is out the moment it is past the band edge by any amount. 455 ppm
> against a 400–450 band is out. There is no margin on this.
>
> A level is clearly out once it is past the edge by a fixed margin: calcium
> 50 ppm, magnesium 50 ppm, alkalinity 0.5 dKH. Fixed figures, not scaled to
> band width.
>
> Give the three their own named margin constants. Do not reuse the trend
> constants, and do not point them at the kit noise floors — adjusting how fast
> counts as moving must never change how far counts as out.

Item 5's option (b), taken further: option (b) offered named constants "set to
today's effective values so nothing moves"; Dan took the naming and moved the
values. Option (c) — the kit noise floors — was explicitly rejected.

Recorded at `docs/spec/reef-chemistry.md` **§27** under Dan's explicit
authorisation for the spec edit (AGENTS.md #1 otherwise forbids it). §16's
universal-constants table carries the three figures. §26's "also flagged,
separately" paragraph now points at §27 as settled.

---

## Step 0 — baseline, before anything changed

    node tests/legacy-port/golden.js
      golden: 5940 cases unchanged (3a782222dbce41c5)

    npx vitest run
      Test Files  32 failed | 35 passed (67)
      Tests  64 failed | 408 passed (472)

The 64 are pre-existing and pre-labelled (`scripts/verify/run.mjs:88-100`). The
full list was pinned to `vitest-baseline.txt` so the after-state could be
compared name by name rather than by count.

---

## Step 1 — the failing test, written first

`src/test/defects/clearly-out-margins.test.js`, 47 assertions in three groups.

Run against the **unchanged** engines:

    npx vitest run src/test/defects/clearly-out-margins.test.js
      Tests  22 failed | 25 passed (47)

The 25 that passed are not filler — they are the half of the decision the code
already got right, pinned so it cannot drift:

- 13 assert **out has no margin**: 0.01 dKH / 0.1 ppm past the edge, each
  element, each direction, is said to be above or below the range and never
  reaches the `idle` card. One asserts a level 0.1 ppm past the edge reads
  identically to one 5 ppm past — the margin plays no part in this question.
- 12 assert the cases the new margin was already going to get right — past the
  new margin (50.5 ppm / 50.5 ppm / 0.505 dKH) still acts, and a hair past the
  edge (0.5 ppm / 0.5 ppm / 0.005 dKH) still holds — so an implementation that
  over-shot the margin in either direction would fail too.

The 22 that failed:

- 12 behavioural, 2 per element per direction: **just inside the new margin**
  (49.5 ppm calcium, 49.5 ppm magnesium, 0.495 dKH alkalinity) and **just past
  the old constant** (5.5 ppm, 10.5 ppm, 0.205 dKH). Both acted before; both
  must hold now.
- 10 structural: each margin exported at its decided value; each declared as a
  bare number; each `clearlyOut` expression naming its own constant and
  containing no `_TREND` reference and no numeric literal.

The structural group is the one that answers the fault item 5 actually reported.
The behavioural tests would still pass if someone wrote `CA_CLEARLY_OUT =
CA_TREND.stable * 10`; the structural ones would not.

Reaching the branch at all needs a tank that is out of band, drifting the wrong
way slowly enough to grade "stable", **and carrying two logged corrections** —
see the audit below for why the third condition is not optional.

---

## Step 2 — the change

| File | Change |
|---|---|
| `src/lib/dosing/alkalinity.js:54` | `ALK_CLEARLY_OUT = 0.5` declared, with the full reasoning the other two point at |
| `src/lib/dosing/alkalinity.js:741-742` | `alkClearlyOut` — literal `0.2` → `ALK_CLEARLY_OUT` |
| `src/lib/dosing/calcium.js:38` | `CA_CLEARLY_OUT = 50` declared |
| `src/lib/dosing/calcium.js:484-485` | `caClearlyOut` — `CA_TREND.stable` → `CA_CLEARLY_OUT` |
| `src/lib/dosing/magnesium.js:27` | `MG_CLEARLY_OUT = 50` declared |
| `src/lib/dosing/helpers.js:8` | imports `MG_CLEARLY_OUT` |
| `src/lib/dosing/helpers.js:968-969` | magnesium's `clearlyOut` — `MG_TREND.stable` → `MG_CLEARLY_OUT` |

Each constant sits beside its own engine's trend block, which is where the next
person looking for the figure will look, and which is where they will read the
comment saying why it must never be spelled `CA_TREND.stable` again.

`CA_TREND` and `MG_TREND` keep their values and every other use. Nothing else
in the three engines changed.

    npx vitest run src/test/defects/clearly-out-margins.test.js
      Tests  47 passed (47)

---

## Step 3 — the audit, by element and direction

### The golden sweep does not move — and that is the finding

    node tests/legacy-port/golden.js
      golden: 5940 cases unchanged (3a782222dbce41c5)

Identical before and after. **That is not evidence the change is inert.** Each
`clearlyOut` feeds exactly one thing — the `*Worsening` flag (verified by grep:
`caWorsening`, `alkWorsening` and `worsening` have one consumer each, the
stable-hold gate) — and that flag needs either a trend at or above the
element's own "stable" rate, which would have taken the band off "stable" and
skipped the branch, or **two logged corrections**. `golden.js:104,116` sweeps
`withCorrection` as a boolean: one correction or none. The margin is
unreachable in all 5,940 cases at the old figures and at the new ones alike.

So the change was audited on the same grid with the correction count swept
0, 1 and 2 — old bundle against new, 2,970 cases each:

| Logged corrections | Cases | Rows changed |
|---|---|---|
| 0 | 2,970 | 0 |
| 1 | 2,970 | 0 |
| 2 | 2,970 | **70** |

### The 70, by element, direction and transition

| Element | Direction | Action | Card | Rows |
|---|---|---|---|---|
| alkalinity | below | `increase → hold` | `suggested → suggested` | 17 |
| alkalinity | above | `decrease → hold` | `suggested → off-target` | 17 |
| calcium | below | `increase → hold` | `suggested → suggested` | 3 |
| calcium | above | `decrease → hold` | `suggested → off-target` | 3 |
| calcium | below | `hold → hold` | `off-target → suggested` | 10 |
| calcium | above | `hold → hold` | `off-target → off-target` | 10 |
| magnesium | below | `hold → hold` | `off-target → suggested` | 5 |
| magnesium | above | `hold → hold` | `off-target → off-target` | 5 |

Symmetric: 35 below, 35 above. 34 alkalinity, 26 calcium, 10 magnesium.

**40 rows withdraw a dose change.** `recommendedDose` reverts to what the keeper
is already pouring — a move of 0.9% to 10.1%. Largest: calcium at 384 ppm, 16 ppm
below a 400–450 band on a trend of 0 ppm a week, recommended 13.1 mL/day, now
holds at 12.0. Alkalinity example: 7.93 dKH against 8.2–8.8, 9.7 mL/day → 9.0.
This is the decision's cost, not a side effect of it: a level that is out but
not clearly out, on a trend the kit cannot resolve, is no longer grounds for
moving the daily dose.

**30 rows keep the same dose and change only what is said.** `recommendedDose`
is byte-identical on all 30. They previously fell past the stable-hold branch
and explained themselves in consumption arithmetic ("Calcium is rising 0ppm a
week across 2.00 days…"); they now take that branch and say the level is
holding outside the range, naming the figure and the side ("…But it is holding
at 1205ppm, below your range"). Where the level is below the band, the card also
now offers the one-off correction that branch carries — `off-target →
suggested`, i.e. "Correction needed". Nothing a keeper used to see is lost.

### The safety questions, asked explicitly

- **0** changed rows have a last reading in band.
- **0** changed rows became `idle` — the card that says the dose is matching
  consumption and there is nothing to answer for.
- **0** changed rows stopped saying the level is above or below the range.
- **All 70** sit strictly between the old margin and the new one: alkalinity
  0.204–0.408 dKH past the edge, calcium 15–50 ppm, magnesium 45 ppm. Nothing
  outside that window moved, for any element, in either direction.

`tests/legacy-port/invariants.js` — "the app never says nothing-to-do about a
level outside its band" — is green and needed no change; the `idle` count above
is the same property measured directly.

---

## Step 4 — the gates

    npm run verify
      ALL BLOCKING CHECKS PASSED
      (39 blocking checks; sim/years 99s; golden 5,940 cases unchanged)

Two advisory checkers fail and both are pre-existing and unrelated —
`deadcode` on three unread `useMemo` values in `Dashboard.jsx:298`,
`Insights.jsx:108` and `Tasks.jsx:27` (TW-022, already blocked), and `csscheck`
on three unused CSS rules. Neither mentions anything this run touched.

    npx vitest run
      total 519 | failed 64
      newly failing: none
      newly passing: none

519 = 472 + the 47 new. The 64 failures are the same 64 names as the baseline,
compared list against list, not by count.

---

## Step 5 — filed, not fixed

**TW-047** — the golden sweep cannot see anything gated on two or more logged
corrections. Filed **untagged** in `.agent/backlog.md`: widening the corpus
re-records the 5,940-case fingerprint for reasons that have nothing to do with
§27, and a fingerprint re-record must not ride inside someone else's diff. The
concrete evidence is this run's own: a change that moves 70 of 2,970 rows on a
two-correction grid moved 0 of 5,940 on the shipped one, and a digest that does
not move was about to be read as "behaviour preserved" when it meant "not
exercised".

---

## What breaks if this is wrong

The margins are now larger — 10× for calcium, 5× for magnesium, 2.5× for
alkalinity. If they are too large, a tank sitting persistently out of band and
drifting further out, with two corrections already logged against it, is held
rather than corrected for longer than it should be. What limits the harm: the
level is still reported as out of range on every surface, on every one of the
70 changed rows; the one-off correction is still offered where one is possible;
and the emergency check (§2 layer 1 safe bounds) sits above all of this and is
untouched. What would make it wrong is a keeper whose corals suffer inside that
window — 400 ppm down to 350 for calcium, 8.2 dKH down to 7.7 for alkalinity —
which is a chemistry judgement, and Dan's to make. He made it.

---

# Second owner decision, same day — the margins are confined to wording

`docs/spec/DECISION-drift-back.md` landed on main after PR #50 was opened. Two
connected parts, both authorised as spec edits. Folded into canon and the loose
file deleted — the same treatment §25 got from
`DECISION-reef-chemistry-engine.md` (commit `94f274a`).

## The decision, as given

> **Part one.** A level is out of band the moment it is past the edge by any
> amount, and that is what decides whether the app acts. "Clearly out" is a
> wording distinction only. It may not gate a recommendation, suppress one,
> relax a constraint, or change any figure. The margins stand at 50 ppm, 50 ppm
> and 0.5 dKH — they were never the problem. What they were wired into was.
>
> **Part two.** Two instruments become three: a daily dose holds a level, a
> correction moves it, and a deliberate under-dose lets the tank draw a level
> back down.

## Step 1 — checking the decision's three premises against the code

The decision states that `clearlyOut` "currently feeds §11's grading qualifier
and, through it, §8.4's step-cap relaxation and the act/hold decision." **Only
one of those three is true in the code**, and saying so is not a challenge to
the decision — it makes the rework smaller than the decision assumed.

| Claimed consumer | What it actually reads | Action taken |
|---|---|---|
| act/hold decision | `*Worsening` ← `clearlyOut` — **real** | severed |
| §11's grading | `outOfBandWorsening(above, below, trend, spanDays, key)` — band position, trend direction, `STABILITY_RULES` noise floor. **Never a margin.** | nothing to change; §11 now says so explicitly |
| §8.4's step cap | `capDoseStep` (`helpers.js:51-60`) — `SAFE_BOUNDS`, i.e. §2 layer 1, **not the band and not a margin** | left exactly as it is; opened as §13.4 / TW-049 |

Verified by grep: `caWorsening`, `alkWorsening` and `worsening` have exactly one
consumer each — the stable-hold gate. `capDoseStep` references `SAFE_BOUNDS` and
nothing else.

**§8.4 carries a separate divergence found on the way**, recorded rather than
resolved (AGENTS.md #10): §8.4's own sentence says the cap relaxes on the
**band**; the code relaxes on **safe bounds** — 400–450 against 350–500 for
calcium, two different tanks. Neither side is authorised to move, and the
threshold that would settle it is exactly what Dan declined to choose.

## Step 2 — the test, re-pointed before the code moved

`src/test/defects/clearly-out-margins.test.js` grew from 47 assertions to 66.

The group that asserted "just inside the margin holds" asserted the fault. It
is **re-pointed, not deleted** — same fixtures, same branch, opposite
expectation — and the file says so in as many words, because AGENTS.md #4 exists
to stop a test being quietly rewritten to match code that changed. Here canon
changed and the test follows canon.

Four distances now span both margins that have ever been in force — a hair past
the edge, past the old borrowed constant, just inside the new margin, past it —
and all four must produce the same action on a level drifting further out.

A fourth group was added that reads the source rather than the behaviour: each
`*Worsening` expression must name the out-of-band test, must not name its
`clearlyOut`, and must contain no `CLEARLY_OUT` constant; each out-of-band test
must be `above || below` and nothing else. Behaviour alone would let the margin
back in beside a second condition that happened to carry the fixtures.

    npx vitest run src/test/defects/clearly-out-margins.test.js   # PR #50's wiring
      Tests  37 failed | 29 passed (66)

## Step 3 — the change

| File | Change |
|---|---|
| `alkalinity.js:739-746` | `alkOutOfBand = above \|\| below`; `alkWorsening` takes it; `out.clearlyOut` reported |
| `calcium.js:481-494` | `caOutOfBand`; `caWorsening` takes it; `out.clearlyOut` reported |
| `helpers.js:964-977` | `outOfBand`; `worsening` takes it; `out.clearlyOut` reported |

The three margin constants are untouched at 50 ppm, 50 ppm and 0.5 dKH. Each
`clearlyOut` is still computed and is now reported on the assessment as a
wording input. **No surface consumes it yet** — the copy that would use it is
`wizard-states.md`'s to settle and no authorisation was given to mint it, so
none was minted.

    npx vitest run src/test/defects/clearly-out-margins.test.js
      Tests  66 passed (66)

## Step 4 — the audit, three-way

Same grid, correction count swept 0, 1 and 2. **A** = main (margins 5/10/0.2,
gated). **B** = PR #50 as opened (50/50/0.5, gated). **C** = the rework
(50/50/0.5, wording only).

| | 0 corrections | 1 correction | 2 corrections |
|---|---|---|---|
| A → B | 0 | 0 | 70 |
| B → C | 0 | 0 | 106 |
| A → C | 0 | 0 | **36** |

### The question asked: do the 40 rows keep their dose change?

**Yes — all 40, exactly.**

    restored to main's recommendation exactly : 40
    still holding under C                     : 0
    acting, but at a different figure         : 0

Same action, same millilitres, to the digit. Three spelled out:

| Row | A | B | C |
|---|---|---|---|
| alkalinity 7.93 (0.27 below) | increase 9.7 mL | hold 9.0 mL | increase 9.7 mL |
| alkalinity 7.93, dose logged | increase 11.5 mL | hold 10.8 mL | increase 11.5 mL |
| alkalinity 7.984 (0.22 below) | increase 9.3 mL | hold 9.0 mL | increase 9.3 mL |

The 30 rows that changed wording only under B are byte-identical to main again
under C. **B is fully undone.**

### The net change against main — 36 rows, all alkalinity

| Direction | Transition | Rows |
|---|---|---|
| below | `hold → increase` | 13 |
| below | `hold → hold` (wording and card only) | 5 |
| above | `hold → decrease` | 8 |
| above | `hold → increase` (a zero change mislabelled) | 5 |
| above | `hold → hold` (wording and card only) | 5 |

Symmetric, 18 below and 18 above. Every one sits **0.012 to 0.192 dKH** past
its band edge — inside the old 0.2 dKH margin, which is precisely the window
the old wiring silenced. Dose figures move 0.0% to 2.8%.

- **26 rows go from holding to acting.** None goes the other way.
- **0** rows whose last reading is in band changed.
- **0** rows became `idle`.
- **0** rows went from acting to holding.
- Calcium and magnesium do not move at all — their old margins, 5 ppm and
  10 ppm, are smaller than any grid step near the edge.

## Step 5 — two things surfaced, neither fixed

**The act path never says the level is out of range.** When the app acts it
says "the dose no longer matches what the tank uses" and names the new
millilitres. It does not say the level is above or below the band — the hold
branch was the one that said that. So the app now speaks where it was quiet,
but only about the dose. This is exactly the state the decision's part two
describes ("match consumption parks the tank out of band and calls it
finished"), so it is named in §28 rather than patched with unauthorised copy.

**`action` can read "increase" for a change of zero.** Five of the 36 —
alkalinity at 8.98 against an 8.8 ceiling — report `action: "increase"` while
recommending the same 10.8 mL/day already being poured. `next` is rounded to a
tenth; `currentDose` is not; `10.8 > 10.799999999999999` by 1.8e-15. Present in
all three engines on the same line (`alkalinity.js:922`, `calcium.js:629`,
`helpers.js:1114`), pre-existing, newly reachable. Filed as TW-050 — fixing it
moves `action` values and needs its own sweep.

## Step 6 — canon

- **§1** — two instruments become three, with the downward-only asymmetry
  stated: upward has an instrument (§9 may serve), downward has none, and
  "hold" is not an option for a level that has climbed out.
- **§27** — the wording-only constraint at the top of the section, then "The
  second decision" carrying the fault, the rule, the three-consumer check and
  the measured cost. The first decision's cost figures are kept, marked as the
  evidence the correction was argued from.
- **§28** (new) — drift back: the two offers, what it is not, what it needs
  (§9's arrival zone, consumption's rate, a duration estimate, §3's rails, a
  recomputed return dose, two-reading arrival, calendar expiry), and four
  questions recorded unanswered. "Enforced by: nothing yet", stated plainly.
- **§11** — takes band position and trend direction, never a margin. Written
  down; nothing changed.
- **§8.4 / §13.4** — the relaxation needs a threshold chosen for that job. Not
  chosen. The band-vs-safe-bounds divergence recorded.
- **§16** — unchanged; the three margins stay in the constants table.
- `docs/spec/DECISION-drift-back.md` deleted.

Backlog: **TW-048** (drift back), **TW-049** (§8.4's threshold), **TW-050**
(the `action` label), all untagged.

## Step 7 — the gates

    npm run verify
      ALL BLOCKING CHECKS PASSED

    npx vitest run
      total 538 | failed 64
      newly failing: none
      newly passing: none

538 = 472 baseline + 66. Same 64 failures as baseline, compared name for name.
Golden unchanged at `3a782222dbce41c5` — TW-047's blind spot again, and the
three-way sweep above is why that is not taken as evidence of nothing happening.
