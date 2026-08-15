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
