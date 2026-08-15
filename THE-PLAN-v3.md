# Tank Wizard — The Plan, Revision 3

Revised 14 August 2026, evening. Supersedes `THE-PLAN-v2.md`.

Read the changes section first if you have read revision 2.

---

# WHAT CHANGED SINCE REVISION 2

**Phases 0 through 6 are done.** Revision 2 budgeted about four weeks for them.
They took two days.

**Phase 7 is half done.** The urgent durability work landed — persistence
requested at app mount rather than only on the Setup screen, the backup panel no
longer claiming no backup exists at the moment restoring one would work,
`correction-plans` added to backups, the double write to localStorage removed,
and ICP photos moved to IndexedDB. That last one took a 12-panel install from
71% of quota to 0.7%.

**The Reef Chemistry Engine decision reshapes everything downstream.** Revision
2's Phase 10 said "consolidate five mechanisms into one." That understated it.
The decision is now: **one engine assesses every parameter, every surface
renders its verdict, no surface forms its own opinion.** Phosphate, nitrate and
salinity are in scope, not just the three dosed elements.

**The journeys exist.** Four documents, dictated by Dan: alkalinity, calcium,
magnesium, and notifications with a state matrix. They are the raw material for
Phase 8 and they found things no agent had.

**Two real bugs came from Dan using the app**, not from any sweep: the
notification layer hiding inconsistently, and phosphate and nitrate having
alkalinity's thresholds applied to them. Both are now filed.

---

# WHERE THINGS STAND

**Proven and verified:** the dosing arithmetic. 5,940 pinned cases, 6,000 random
assessments, 4,200 tank-days, three-year simulations, 39 protocol examples. All
green against current code, with a gate that blocks a red merge.

**The golden fingerprint has moved three times today**, each with an audited
row-by-row diff: `37ded9064e91e80e` → bug 2 → bugs 3 and 4. It no longer proves
equivalence with the legacy app. It now pins intended behaviour, which is the
right thing for it to pin.

**Still not proven at all:** anything that renders. No component has ever been
drawn in a test.

**Still unspecified:** four of the five areas. Roughly 1,700 lines of engine.

---

## Phase 6 — what was actually fixed today

| 1 | Two live crashes — "go to dosing" from the log popup, and marking a reminder done |
| 2 | Negative consumption silently driving a ~25% dose cut |
| 3 | The dose-gap halving removed and stability grading fixed, together |
| 4 | Alkalinity band 1.0 → 0.6 dKH |
| 5 | Magnesium correction rail 100 → 25 ppm/day |
| 6 | Magnesium removed from `DOSE_ADVICE_RULES` |
| 7 | Correction arrival tests the zone, not the full band |

Every one test-first, with the test proven red before the fix.

**Bug 2 is worth remembering.** The rule Dan and I agreed was wrong at the
premise — we assumed negative consumption meant a broken model, and 626 of 6,000
random assessments produce it routinely. The gate caught it, the agent reverted
rather than widening the fix, and the rule was rewritten. That is the process
working exactly as intended.

---

# THE PHASES

---

## PHASE 0–6 — Done

Preserve · baseline · adapter · conformance · canon · the gate · the live bugs.

---

## PHASE 7 — Data durability  *(half done)*

**Done:** persistence at app mount, the backup message, `correction-plans` in
backups, the double write removed, ICP photos in IndexedDB with migration,
fail-safe fallback, and handling for all four ways IndexedDB can refuse.

**Remaining:**

- Automatic backup — snapshot ring, File System Access handle, iOS share sheet
- Wipe detection — the app currently cannot tell a cleared browser from a fresh
  install, and silently re-seeds
- The other 20 storage keys to IndexedDB
- A real backend before beta

**Suitable for unattended overnight work.** Fully specified, no judgement calls
mid-flight.

---

## PHASE 8 — The journeys, then the specs  *(2–3 weeks)*

### 8a — The journeys  *(done)*

`docs/journeys/` holds four documents. What they found that no sweep had:

- **Cadence is adaptive.** 2 days normally, 3 when steady, 4–5 when confident,
  tighter around a change. The app has a flat 2.
- **"It didn't move" is a finding.** Two readings after a dose increase with no
  movement means increase again. The app only has this for correction plans.
- **Stability can outrank the target.** A stable 8.7 beats a chased 9.0. The app
  has no state for "off target, deliberately left alone."
- **Noise is answered by a longer window**, not more readings.
- **A big single move skips the confirming test.**
- **Tolerance shrinks near a band edge.**
- **In balling, magnesium's dose is copied from alkalinity's**, not calculated.
- **The notification state matrix** — position × movement × dose state, with the
  four contradiction cells the app cannot produce at all.

Still worth writing: first-ever use, returning after two weeks away, a reading
you distrust, and ICP results disagreeing with your kit. That last is an open
spec question nobody has answered.

### 8b — The five unspecified areas

1. **Stability grading** — small, and where the fault we spent today patching
   around actually lives. Gates whether the wizard considers a change at all, so
   it sits upstream of everything already written.
2. **The derivation pipeline** (`deriveTankState`) — the spine. What feeds what,
   in what order.
3. **Overview, briefing and findings together** — 1,559 lines, the most-read
   screens, and where Dan's notification problem lives.
4. **Non-dosing parameters** — phosphate, nitrate, salinity, pH, ICP. **Filed as
   a defect, not an enhancement:** phosphate and nitrate currently get
   alkalinity's thresholds and trend logic, which produces noise dressed as
   findings.
5. **The data model** — largely covered by Phase 7.

### 8c — A coverage agent

Enumerates reachable states and reports the ones nothing handles. Built after
the journeys, because they are what it checks against.

---

## PHASE 9 — Render tests  *(1–2 weeks)*

The gap the old repo names as its own worst: *nothing has ever been rendered in
a test.*

Render every screen. The contradiction tests — one reading, one render, every
surface agrees. Walk all 17 wizard states through the real UI. Accessibility and
mobile layout. Rewrite `popup.js`, which could not be ported in Phase 3 because
it reads the old monolith's source text directly.

---

## PHASE 10 — The Reef Chemistry Engine  *(3–5 weeks)*

**Substantially reshaped by the 14 August decision.** No longer "collapse five
mechanisms" but "one engine assesses every parameter."

**What it replaces:** the wizard's three `assess*` functions and `doseStatus`,
`analytics/drift.js`, `stability-engine.js`, `analytics/correction.js`, the
duplicated safe-bounds check in `state.js` and `findings.js`, and roughly ten
divergent classifiers.

**What it adds:** assessment of phosphate, nitrate and salinity with reasoning
that suits them, and the four contradiction states from the notification matrix.

**What it enables:** the notification model. One verdict per parameter means one
notice per parameter, supersession for free, and global hiding.

**Not a rebuild.** `deriveTankState` and the three `assess*` functions are the
best-tested code in the app. The engine is those consolidated and extended.

**How:** build alongside, prove identical on all 5,940 golden cases, move the 48
decision sites one at a time, each its own PR, delete the old engines when
nothing calls them.

**And extend `wordingcheck`** so a surface writing its own sentence fails the
build. Its current coverage is one file, one function, one field — it asserts
`claim:` but not `support:`, which is how `narrative-engine.js:474` writes its
own sentence and passes a blocking check. Without this, the engine decision
erodes.

---

## PHASE 11 — Beta

Five reefers. Before it: net/gross volume, ICP logging, CSV import, a real
backend, and Dan's tank data out of the repo.

---

# USING THE APP — now

**Phase 6 was always the "reliable for Dan" mark, and it is done.** The crashes
are fixed, the silent dose cut is gone, grading catches a slow decline, the
rails and bands match canon, and the data is considerably safer than it was this
morning.

Two caveats: the screens are still untested, so expect visual oddities. And the
notification layer is still the mess described in journey 4 — specced, not
built.

**Deploy the built `dist/` folder to the existing Netlify site.** Same domain
means the same storage, so existing data survives.

**Log real readings and sanity-check the doses for the first fortnight.** Two of
today's confirmed bugs came from Dan using the app rather than from any agent.

---

# WORTH DOING BEFORE ANYTHING ELSE

**Re-run the documented failures against the fixed engine.**

The old repo records specific, reproducible failures with numbers attached:

- Three years, demand growing 30% a year, keeper following every recommendation:
  three dose changes, alkalinity reached **6.87 dKH** with the app saying hold
- Calcium **403 → 498** from corrections stacking on stale readings
- Calcium reaching **702** because a weekly cadence put two confirming readings
  a fortnight away
- **48%** of plans over three years killed as stalled having never had a chance

`sim/years.js` (6 scenarios × 4 seeds), `invariants.js` (6,000 assessments) and
`crosstalk.js` (24 stale-reading checks) still hold those scenarios.

**Run them against the new engine and report the same measurements**, not pass
or fail. Does a 30%-growth tank still reach 6.87? Does calcium still stack to
498?

Caveat: the bands and rails have changed too, so it is not strictly like for
like. Directional, and the interesting question is simply whether the failure
still happens at all.

**This is the best available answer to "did today make the app better."**

---

# TIMELINE

| 0–6 | done |
| 7 — durability, remainder | 3–5 days, overnight-suitable |
| 8 — journeys and specs | 2–3 weeks |
| 9 — render tests | 1–2 weeks |
| 10 — the engine | 3–5 weeks |

**Reliable for Dan:** now.
**Reliable for friends:** end of Phase 9.
**Clean:** end of Phase 10.

Phase 7's remainder and Phase 8's specs can run alongside each other.

---

# THE RULES

1. **Never fudge a test to make it green.** Held today — bug 2 was reverted
   rather than widened.
2. **Nothing merges unread.**
3. **Chemistry constants need explicit approval.**
4. **One thing at a time.** The corollary used to be that two branches writing
   `run-state.md` always conflict — serialise, or accept a resolution pass.
   **Fixed at the root instead:** state lives in `.agent/runs/<run-id>.md`, one
   file per run, and no run touches another's. Concurrent runs no longer collide
   over bookkeeping. `.agent/backlog.md` was the same shape of risk and is
   **now fixed the same way**: one file per item under `.agent/items/`, the
   combined list deleted, the ordered view generated by `npm run backlog` and
   never committed — see TW-042, closed 2026-08-15.
5. **Everything must be pushed.** Cloud sessions cannot see your Mac — this cost
   an hour today with the journey placeholders.
6. **The specs are the authority, and they are yours.**
7. **Never resolve a contradiction, but always work it up.**
8. **Every prose report gets a plain-language layer.**
9. **`golden.json` is regenerated, never resolved by side.** When two changes
   both touch it, the correct digest comes from running the tests with both
   applied. Bugs 3 and 4 interact — bug 4's narrower band shifts which cases
   fall into bug 3's promotion window.

---

# WHAT COULD GO WRONG

**Momentum.** Still the most likely failure. Two days of extraordinary pace is
not a rate anyone sustains. What keeps it going is using the app.

**Building process instead of the app.** Worth watching. The infrastructure is
genuinely load-bearing, but it exists to serve the app, not the other way round.

**Trusting a confident answer.** Four of the assistant's recommendations were
overturned this week: the magnesium strength direction, magnesium
precipitation, an invented re-baseline mechanism, and the negative-consumption
premise. Two were caught by Dan, two by arithmetic.

**The render layer being worse than expected.** Nothing has ever been tested
there, and four of the last five known bugs lived in it.

---

# OUTSTANDING DECISIONS

- The alkalinity dose-gap coverage gap during active corrections — 5 rows when
  bug 3 measured it, **40 rows** under bug 4's tighter band. Three options in
  `.agent/needs-dan.md`.
- Magnesium's `PARAM_DEFS` band is off-centre — 1325 against a 1350 target.
- ~~Two backlog numbering collisions: TW-016 and TW-026 each refer to two
  different things.~~ **Resolved 2026-08-15** by the move to one file per item,
  which made two items sharing a number impossible: the later of each pair was
  renumbered — the magnesium correction rail item TW-016 → **TW-051**,
  magnesium's off-centre band TW-026 → **TW-052**. Evidence for which was
  later, and the live references updated, in `.agent/items/README.md`.
- Journey 4b's open questions: how long "recent dose change" lasts, and whether
  24 hours is the right minimum gap given Dan always tests at 9am.
- Journey 3's open question 4: note or warning for the ionic-balance effect of
  breaking magnesium parity.
