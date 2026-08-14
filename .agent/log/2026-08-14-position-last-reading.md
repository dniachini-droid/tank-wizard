# Run 2026-08-14-position-last-reading

Owner decision, delivered directly by Dan, superseding `.agent/needs-dan.md`
item 3's option (b). Not a routine. One change, scoped first, then implemented
test-first, then audited against the golden sweep by element and direction as
routine 15's Phase 6 bugs were.

Branch: `claude/position-last-reading-d3s0pj`.

---

## The decision, as given

> Position is always the last reading. Whether a level is in band, out of band,
> or at which edge — that question is answered by the most recent measurement,
> never by a fitted or projected value. If the last reading says 8.5 and the
> band starts at 8.2, the level is in band. It is on the upper edge, but it is
> in band.
>
> History is for trend, direction, consumption and dose. It is never used to
> assert where the level is now. The app must never state a position that no
> measurement supports.

Option (b) said unifying on `fittedNow` was probably the smaller change. Dan:
"It's the wrong direction, and size isn't the deciding factor."

Recorded at `docs/spec/reef-chemistry.md` §26 under Dan's explicit
authorisation for the spec edit. Item 3 closed.

---

## Step 1 — scope, before anything changed

Every place in the app that decides which side of the band a level sits on,
and the measure each used. Working tree untouched at this point; the two
measured variants below were built in a scratch copy.

### Answered from `fittedNow` — all moved

| Site | What it decides |
|---|---|
| `alkalinity.js:600-602` | `inRange` / `above` / `below` |
| `calcium.js:409-411`, `helpers.js:910-912` | the same triple, magnesium in `helpers.js` |
| `calcium.js:429-430`, `helpers.js:924-925` | `nearLower`/`nearUpper` → `nearEdge` — "at which edge" |
| `alkalinity.js:711`, `calcium.js:473`, `helpers.js:962` | `alkClearlyOut`/`caClearlyOut`/`clearlyOut` — position plus a margin |
| via the triple, all three engines | §11 grading, through `outOfBandWorsening(above, below, …)` |
| `state.js:300-302` | whether a settled dose change "worked" or only stopped the drift |
| `state.js:448-450` | off-target / recovering / worsening, **while printing `a.current.value`** |
| `tests/legacy-port/invariants.js:79` | test mirror of `state.js:448`, with the old rule written into its comment |

### Already the last reading — verified, unchanged

`alkEmergency`/`caEmergency`/`mgEmergency` (`alkalinity.js:681`,
`calcium.js:457`, `helpers.js:945`); `helpers.js:54`'s safe-bounds check;
`correctionProgress`'s arrival zone (`helpers.js:286-291`); `proposeCorrection`
(`helpers.js:381-383`); `state.js:85`, `:191`, `:422`, `:502`; `dates.js`'s
`paramStatus` and its ~30 UI/narrative callers; `findings.js`; `drift.js`;
`reading-meaning.js`.

**So `state.js` was already internally inconsistent** — two of its five
position tests on the fitted value, three on the last reading — and
`state.js:444-447` documented the split as intentional: "The fitted level
decides whether the tank counts as out of range… What gets shown is always the
measured value."

### Doing a second job beyond position — flagged

1. **`toMid`** (`alkalinity.js:750`, `calcium.js:495`, `helpers.js:978`) —
   sizes the one-off correction volume from the fitted position. Not a
   side-of-band test, so outside the decision's scope; a dose figure, so
   outside an agent's authority (AGENTS.md #3). **Not changed.** Measured
   anyway: moving it changes **39 further golden rows**, 211 vs 172, e.g.
   alkalinity 18.5 → 13.9 mL. Filed as needs-dan item 4 with three options.
2. **`caClearlyOut`/`clearlyOut`** compare a **ppm distance** against
   `CA_TREND.stable` (5 ppm/**week**) and `MG_TREND.stable` (10 ppm/**week**).
   Dimensionally wrong whichever measure feeds it; predates the decision.
   **Not changed.** Filed as needs-dan item 5. Alkalinity is not affected — its
   literal `0.2` is a dKH distance.
3. **`nearEdge`** is a position question (named in the decision) that also acts
   as an early-act trigger for calcium and magnesium — it feeds `urgent` and
   `levelWantsLess`. Moved, because the decision names it; the second job is
   why 41 rows move `recommendedDose` without changing `action`.

### Golden rows that would move — the number asked for

**172 of 5,940**, measured in a scratch copy before any repo file changed.

---

## Step 2 — test first

`src/test/defects/position-is-last-reading.test.js`, 17 assertions.
**All 17 fail against `HEAD` before the fix** — verified by building the
pre-change tree from `git archive HEAD` into a scratch copy and running the
same file there, not by reasoning about it.

The fixtures reproduce the defect in the app's own words, both directions, all
three engines:

- "Alkalinity is below your range at 8.5dKH" (band 8.2–8.8)
- "Alkalinity is above your range at 8.6dKH"
- "Calcium is below your range at 405ppm" / "above your range at 445ppm" (400–450)
- "Magnesium is below your range at 1260ppm" / "above your range at 1390ppm" (1250–1400)
- the reverse — last reading 8.15, 397 ppm, 1245 ppm, all outside their bands,
  all reported as "dose is matching consumption at …" with state `idle`
- `nearEdge` null for calcium 2 ppm off its floor and still falling
- `doseStatus` returning "steady but not where you want it" for a reading of 8.5

Each in-band assertion checks the *present-tense* claim only. "Magnesium started
this period below your range at 1100ppm and has been moving up to 1260ppm" is a
statement about history and stays true — §26 governs claims about now.

---

## Step 3 — the change

`posNow = out.current.value` in each engine, replacing `fittedNow` in the
position triple, `nearLower`/`nearUpper` and `clearlyOut`. In `state.js`, one
`nowLevel` at the top of `doseStatus` that all five position tests now share,
including the two that were on the fitted value; `level` and `shown` are the
same number, so a card can no longer classify from one figure and quote
another.

`fittedNow` stays computed and exported — it still sizes `toMid` (item 4), and
`rounding.test.js` asserts it. No threshold, trigger or constant moved.

**One block removed**: `state.js`'s "dose right, level off" idle card. With both
branches reading the last reading, the "steady, off target" branch above it
returns first on an identical condition, so it became unreachable — proved from
the control flow, then confirmed against the sweep, where the one card that
changes state is exactly this case and now reads "Calcium is steady but above
your range" instead of "Calcium dose is matching consumption at 451ppm".

**One test mirror moved with it**: `tests/legacy-port/invariants.js`'s "idle
while out of range" property measured "out of range" on `fittedNow` and its
comment said so — "judged on the fitted level by design". The design is what
changed. The property is unaltered; only its measure moved, and the comment now
says that. Without this it reported 108 false violations. Flagged here rather
than left to be found in the diff (AGENTS.md #4).

---

## Step 4 — golden audit, by element and direction

`fbac65244f00ac9b → 83780c1728b67ca6`, 5,940 rows, **172 changed**.
Re-recorded via `UPDATE=1` after the audit, not before.

**Every changed row has `withCorrection: true`** — the correction-adjustment is
what makes the fitted and measured positions diverge, which is the mechanism
item 3 identified. Nothing outside that state moves.

| | alkalinity | calcium | magnesium |
|---|---|---|---|
| rows changed | 163 | 8 | 1 |
| last reading above band | 85 | 3 | 0 |
| last reading in band | 78 | 5 | 1 |
| last reading below band | 0 | 0 | 0 |

Transitions:

- **`increase → hold`, 54 rows, all alkalinity.** 29 of them have a last reading
  **above** the band — the app was recommending a dose *increase* for a tank
  whose newest reading was over its range (9.0 → 10.6 mL/day at a reading of
  8.87 dKH; 13.0 → 10.8 in the with-dose-log variant). The other 25 have a last
  reading in band.
- **Band grade, 40 rows.** 36 `mild → stable`, where the fitted value read out
  of band and the reading reads in. 4 `stable → mild` — all with the last
  reading above the band and still rising, so §11 grading became **stricter**
  exactly where the measurement is the worse news (8.914, 9.064, 8.830, 9.130
  dKH against a ceiling of 8.8).
- **Card state, 1 row.** Calcium `idle → off-target` at 451 ppm.
- **`recommendedDose` without an `action` change, 41 rows** — staging fractions
  following `nearEdge`.

**Direction-of-harm scan: 0 rows** move the recommended dose away from the band
the row's own last reading sits on, in either direction, for any element.
Computed from each fixture's actual last reading, not from its starting offset.

Item 3's own cited rows, checked individually: `alkalinity|0.8|-0.02|7|false|
true` held with "Your current dose is matching consumption. Keep testing on
your usual schedule" against maintenance 9.72 vs current 9.0 — the 8.0% gap the
item is about — and now adds "But it is holding at 8.9dKH, which is 0.108dKH
above your range…" with the matching next step. The 12% trigger is untouched,
so the gap still does not force a recalculation; that residue is recorded in
the closed item rather than glossed.

---

## Verification

- `npm run verify` — **all blocking checks pass**, including
  `legacy-port:golden`, `legacy-port:protocols`, `legacy-port:invariants`
  (6,000 assessments, 0 properties violated) and `sim/years`. The two advisory
  failures (`deadcode`, `csscheck`) are the pre-existing ones and are
  byte-identical before and after — `deadcode` still reports exactly the three
  TW-022 `useMemo` findings, no new dead code from this change.
- `npx vitest run` — **62 failed / 313 passed**, against a baseline of 62 / 313
  measured on the same tree before the change. Compared **by test name via the
  JSON reporter**, not by count: **0 new failures, 0 fixed**.
- `npx vitest run src/test/defects/position-is-last-reading.test.js` — 17
  passed. The same file against `git archive HEAD`: **17 failed**.
- Baseline `npm run verify` was run and green before any edit.

---

## Not done

- `toMid` — needs-dan item 4, measured (39 rows, up to ~40% of a pour) but not
  changed. A dose figure.
- `caClearlyOut`/`clearlyOut`'s rate-vs-distance comparison — needs-dan item 5.
- Item 3's residue: whether a moderate dose gap under a running correction
  should itself force a recalculation. That is the 12% trigger, not the measure
  of position, and §26 does not decide it.
