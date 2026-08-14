# 2026-08-14 — Tank Wizard overnight (consistency sweep, routine 5)

## Needs you (3)

**1. The spec contradicts itself, same day, both sentences yours — rail
tightening.** `reef-chemistry.md` §3 says the user may tighten a daily rate
rail ("never loosen"); `wizard-states.md` §21 (decided the same day) rejects a
rate-tolerance Setup question outright and names §3's rate ceiling as an
arrival point of the rejected shape. Nothing in code implements either — the
rail is fixed and untweakable today (`safe-rate.js:43-48` reads no user
value). Full three-option workup in `.agent/needs-dan.md` item 8. Plain
terms: the spec promises a keeper whose corals react badly to fast swings a
way to ask for a gentler daily limit, then immediately says Setup must never
ask that kind of question. Pick which sentence survives.

**2. Vocabulary registry decision** (`.agent/needs-dan.md` item 7): the
consistency verdicts (`reading-meaning.js:196-219`) use six words that are
not in §13's seven bands, and the one shared word — "drifting" — means the
opposite (§13: inside the band, sliding toward an edge; the code: already
outside it). Blocks TW-037. Plain terms: the app has grown a second
home-made vocabulary for "how is this parameter doing", and its one shared
word disagrees with the official one.

**3. Three one-liners** (`.agent/needs-dan.md` item 6): phosphate's and
potassium's brand colours are byte-identical to the danger-red/low-amber
severity colours (a colour-registry gap of §15's shape); the "notice"
concept ships under three words today with a fourth planned; the four-way
"target" rename needs your sign-off before any copy changes.

## Shipped

Nothing — read-only sweep by design. Only new parity tests (below) and
`.agent/` state are on this branch.

## Found (new, all independently re-verified by the adjudicator: 19/19 confirmed, 0 refuted)

1. **TW-036 — the dose sheet can record a number you didn't just ask for.**
   `DoseChangeSheet.jsx:17` seeds its amount once and never re-syncs; the
   staged-plan shortcuts ("Step to X" / "Go to Y", `ErrorBoundary.jsx:209,212`)
   reuse one unkeyed sheet. Reproduced live: tap "Step to 7.50", then "Go to
   9.90" with the sheet open — the field still says 7.5. Plain terms:
   change your mind between the small step and the full dose, and unless you
   notice, the dose you record is the one you *didn't* pick.

2. **TW-033 [schema] — restore silently rewrites and drops data while
   claiming it didn't.** One root cause, three consequences
   (`backup.jsx:75,78,120,123,170-172`): targets are overwritten
   unconditionally on every restore (not even gated by the settings flag), so
   all history silently reclassifies against that day's bands; the merge keys
   omit time-of-day, so the second same-day reading or dose is dropped — while
   the preview counts it as recovered; and with no stored classification or
   recommendation (TW-013/TW-014), nothing downstream can even detect what
   changed. Reproduced live, twice independently. Plain terms: use the undo
   feature to recover a few lost readings and the app may quietly relabel
   months of history, throw away one of two same-day tests, and tell you
   "nothing was overwritten."

3. **TW-034 — corrections feed the math but are written down nowhere.** The
   one-off correction log (`App.jsx:888-911`) shapes consumption estimates,
   correction gating and findings, yet appears in no history view, no CSV
   export (`export-csv.js:5`), and its delete function has no caller. Plain
   terms: the app privately uses your correction doses to explain the tank's
   behaviour forever, but neither you nor your exported records can ever see
   them again.

4. **TW-002 [standing #1] — still no single classifier; the census is now
   thirteen, not eight.** All prior manifestations reconfirmed unchanged;
   StabilityStrip (`TodayPanel.jsx:314`) newly catalogued and its live
   disagreement pinned by a permanent test: the spread bar renders "outside"
   amber while the current reading is in band on every other surface. §19's
   one-engine decision is still wired to nothing. Plain terms: thirteen
   independent opinions about the same reading, still one card showing amber
   "low" above red "dangerously low" for one number.

5. **TW-035, TW-037, TW-038, TW-039, TW-040, TW-041** — one internal field
   holds "level to aim for" in one branch and "mL per day" in the rest
   (latent, now permanently tested); the invented-vocabulary family above;
   the cross-parameter assessment (ratio warnings, burnt-tips, weekly
   priority) is computed every render and rendered nowhere — with two
   landmines (pH 8.4 vs 8.45, two rival "one thing this week" waterfalls)
   that must be unified before wiring it in; a red test still asserts the
   pre-14-Aug rails (Ca 25/Mg 100) next to correct code — fix direction
   triple-checked: fix the TEST, or someone "fixing" the code would let
   magnesium run four times faster than the decided ceiling; ICP popup and
   every history chart render bare numbers, no units, no aria labels.

## Verified good news

- **Position-is-last-reading landed cleanly**: 17/17 defect tests pass, and a
  new cross-engine parity test proves all three engines agree by rule, not
  luck.
- The 13 Aug magnesium-rail fix (fd82363) held; its spec assertion now
  passes on merit.
- Restore's row-merge is genuinely additive for what it doesn't drop; no
  history rows are overwritten in place.
- The two crash bugs from the phase-5 gate (log-popup "go to dosing", task
  "mark done") are confirmed fixed at root cause (704cc69).

## Health

- Tests: pre-sweep 414 (352 pass / 62 standing documented failures);
  post-sweep 430 (366 / 64) — +16 new parity tests, +2 new documented spec
  violations, zero unexplained drift. Parity suite: 11 files, 61 tests,
  53 pass / 8 documented violations.
- Build: passes. Bundle: main JS 292.7 kB gzip vs 180 kB budget, total
  ~301.9 kB vs 250 kB — over, pre-existing; growth since yesterday
  (286.2 → 292.7) traces to the durability and position merges, not this
  read-only sweep.

## Didn't run

No fixes, no build-cycle work (by design). Phase-5-gate leftovers (dead
useMemo `preview`, dead CSS) parked unverified on TW-022/TW-023. Durability
piece three (TW-D11) remains not started, carried in run-state.

## In plain terms

Nothing got fixed tonight and nothing got worse — every inconsistency found
yesterday is still there, freshly confirmed. What's new is where the app
*keeps its promises about the past*: the backup/undo feature can quietly
relabel your whole history, silently drop one of two same-day tests while
saying it recovered both, and the correction doses the app reasons from are
never shown to you at all. The dose-entry sheet can record the number you
changed your mind away from. And the one decision only you can make: the
spec both promises and forbids a "gentler daily limit" question, in two
documents dated the same day.
