# Routine 20 — Phosphate and Nitrate: remove the borrowed reasoning

Build routine, executing the **buildable half of `.agent/backlog.md` TW-029**
— filed as a **defect**, not an enhancement. The other half is a report, not
code: what Dan must decide before either parameter can be assessed properly.

Baseline this routine was written against: commit `dc38fd6`, 15 August 2026.
Every figure below was verified at that commit. Re-verify before relying on
any of them; the commands are given.

**Authorisation, stated because the tag is absent.** TW-029 carries no
`[approved]` tag — the backlog note says so deliberately: *"Neither is
[approved]; both are split so the buildable half is obvious once it is."*
This routine exists because Dan instructed it directly on 15 August 2026:
write the routine, execute it, commit, push, open a PR. That instruction
authorises **the removal half only**. What phosphate and nitrate's own
reasoning should be is not authorised here, is not canon anywhere
(reef-chemistry.md §25, "what this settles, and what it does not"), and this
routine must not invent a single figure of it. **Do not invent a threshold.**

---

## Read first, in full

1. `.agent/backlog.md` TW-029. It carries verified arithmetic that must not
   be rediscovered, the inventory of the four borrowed rules, and the scope
   note this routine is built from.
2. `docs/journeys/journey-5-phosphate-nitrate.md`. Dan's own account of how
   these two behave. **Design input, not canon** — it shapes the part-two
   report and nothing in part one.
3. `docs/spec/reef-chemistry.md` §25, which governs what may and may not be
   invented here, plus §12's refusal (*"judge one parameter by another
   parameter's thresholds, trend logic or evidence bar"*), §2/§3/§5 as the
   models for how a sourced canon entry looks, and §4 for cadence.

---

## The defect, and the split

Dan, 14 August, quoted in §25 and TW-029:

> *"I have noticed silly notifications of phosphate coming up and silly
> notifications of nitrate coming up, which don't make sense, because the
> wrong measurements are being applied to them — it's the same measurements
> as alkalinity and calcium."*

§25 records this as **a real defect, not a display problem**. And it fired on
the real tank: `fixtures/real-tank/dans-tank-backup-2026-08-12.json:2893,2902`
records `heading-out-phosphate` dismissed 10 August and `heading-out-nitrate`
dismissed 11 August. These are the silly notices, dated.

The scope note in TW-029 is the whole design: **removing the wrong reasoning
is buildable now; what the right reasoning is is not yet canon and may not be
invented here.** So the routine splits in two.

- **Part one** stops the borrowed rules producing wrong notices. Code, tests,
  the full verify gate.
- **Part two** reports what Dan must decide before either parameter can be
  assessed properly — thresholds, windows, noise floors, sourced the way §2,
  §3 and §5 are — to `.agent/needs-dan.md`, worked up per AGENTS.md #10, in
  both layers per #11.

Between the two halves there is nothing: no interim threshold, no
SAFE_BOUNDS-triggered stand-in, no count mechanism built "since we're here".
§25: *"the engine covering a parameter means covering it correctly or not at
all — a borrowed threshold is what this decision removes, not what it
extends."*

---

## The arithmetic, carried from TW-029 — verify, do not rediscover

The `far-out-<key>` loop (`src/lib/findings.js:218-251`) fires at a full
band-width outside the band: `outBy >= (def.max - def.min)`. At the default
bands (`src/lib/constants.js:33-34`):

| | Band | Fires high at | Fires low at |
|---|---|---|---|
| Phosphate | 0.03–0.10 ppm | ≥ 0.170 ppm | ≤ **−0.040 ppm** |
| Nitrate | 5–15 ppm | ≥ 25 ppm | ≤ **−5 ppm** |

Both low thresholds are negative, so **far-out-low is arithmetically
unreachable for both parameters at any value a kit can return**. A phosphate
of 0.00 ppm — which `SAFE_BOUNDS` itself calls out of bounds
(`findings.js:102`, min 0.01) and which `reading-meaning.js` describes as
starving corals and inviting dinoflagellates — produces **nothing**. The
borrowed rule is not merely noisy; on the side journey 5 calls the one hard
floor, it is silent by construction. Scaling an alarm to the width of the
user's own band is alkalinity's logic, sensible there (9.4 / 7.6 dKH at the
defaults), unreachable here.

Verify with: `node -e` over `buildFindings` at values 0.00 and 0.169/0.171
(phosphate), 0 and 24.9/25.1 (nitrate), before touching the loop.

---

## Part one — stop the borrowed rules

### 1. The two loops, scoped

`src/lib/findings.js` runs three generic loops over every `paramDefs` entry.
Two of them apply alkalinity-shaped reasoning to phosphate and nitrate:

- **`far-out-<key>`** (`:218-251`) — the band-width threshold above.
- **`heading-out-<key>`** (`:424-510`) — a 30-day linear regression with a
  45-day projection horizon. Phosphate and nitrate test at 7-day cadence
  (`constants.js` `freqDays: 7`), so the window holds 4–5 readings and
  `rows.length >= 5` is barely met: a regression over four intervals of a
  bouncing parameter. The file's own comment at `:453-459` records the
  symptom; the noise-floor gate added there is a patch on the borrowed rule,
  not per-parameter reasoning.

Define one exported set — `NUTRIENTS_AWAITING_OWN_RULES = new Set(["phosphate",
"nitrate"])` — with a comment carrying the reasoning (§25's coverage table
row, §12's refusal, the unreachable-low arithmetic so the next reader does
not re-derive it), and `continue` on it in **both** loops. Exported so the
regression test names the same set the code consults.

**Exactly those two keys.** Salinity also passes through both loops and is
TW-030's problem — §25 lists it separately, and its removal-or-not is a
decision that item must make with its own evidence. Touching it here widens
an authorised scope.

### 2. What stays, named so it is not "cleaned up" in passing

- **`paramStatus`** (`src/lib/dates.js:24-29`) and every band-position chip.
  A bare min/max/ok against the user's own band is position, not judgement —
  journey 5's own design speaks in band terms (*"you're currently sitting
  above band"*). Its role as heading-out's gate (`findings.js:428-429`)
  disappears with heading-out; the chip itself is untouched.
- **The nutrient-specific findings**: `nutrient-starved`, `ratio-po4-limited`,
  `ratio-no3-limited`, `equilibrium-*` (`findings.js:628-676`), and
  `alk-vs-nutrients` (`:537-566`). These are nutrient reasoning, not borrowed
  alkalinity reasoning. TW-029's inventory does not name them.
- **The stability layer** (`src/lib/stability-engine.js:51-52`): phosphate
  14-day window in percent mode, nitrate 28-day — the one layer that already
  knows these two are proportional, bouncy and slow-cadence. Read-only here.
- **The `drift:` claims** (`src/lib/narrative-engine.js:565-591`), which sit
  on the stability layer's own fold-mode rules, not on the borrowed loops.
  They can say *"Phosphate is climbing, not settling"* — direction language
  journey 5 rejects — but they are **not in TW-029's borrowed inventory**,
  and whether count language replaces them is part of the reasoning Dan has
  not written. Left in place; named in the part-two report so the decision
  sees them.

### 3. The latent unit error — comment, not fix

`correctionProgress` (`src/lib/dosing/helpers.js:280-283`) reads
`STABILITY_RULES[def.key].noiseFloor` as an absolute value in the element's
own unit. Correct for the three `mode: "absolute"` elements that reach it;
wrong for the two percent-mode entries, where the figure is a proportion.
Latent today because phosphate never reaches the function; live the moment
phosphate gets an engine. At the default band the misread constant would
**bind**: `2 × 0.02 = 0.04` beats `bandWidth/3 = 0.0233`, setting the arrival
zone to 57% of the band where §9 asks for a middle third.

TW-029: *"no fix proposed, deliberately"* — reading the percent floor as a
proportion of the band, giving `correctionProgress` its own per-parameter
floor, and giving phosphate an absolute floor in `STABILITY_RULES` are three
different chemistry decisions. So: **add the constraint as a comment at the
read site** (so whoever wires phosphate in cannot miss it), change no
behaviour, and work the three options up in part two.

### 4. Tests

Per TW-029's own repro note, the obvious first artefact is the test that
would have caught this.

- **New defect test**, `src/test/defects/` alongside the others, house style
  (decision quoted in the header, then pins):
  1. No `far-out-phosphate` / `far-out-nitrate` at **any** reading ≥ 0 —
     sweep 0.00 through values beyond the old 0.170 / 25 thresholds, both of
     which used to fire high.
  2. No `heading-out-phosphate` / `heading-out-nitrate` on a steady,
     kit-visible climb — the exact shape `tests/legacy-port/strips.js` used
     to require a flag for.
  3. Positive controls, so the pin proves scoping rather than breakage:
     `far-out-alkalinity` still fires a full band out; a nutrient-specific
     finding still fires for these two keys; `paramStatus` still says
     high/low for an out-of-band phosphate.
  4. The set contains exactly the two keys — salinity must not drift in
     under TW-030's nose.
- **`tests/legacy-port/strips.js:158-196`** asserts the removed behaviour: a
  measurable in-range drift on phosphate/nitrate **must** produce
  `heading-out-<key>` (*"missed a measurable drift"*). Under §25 that
  assertion now pins a defect. Rewrite the block to assert the opposite —
  neither fires at any drift size — with a comment citing TW-029 and this
  routine. Per AGENTS.md rule 4 this is recorded in the log as an expected
  behaviour change under an owner decision, not a test bent to pass.
- **`tests/legacy-port/summary.js:176-204`** (moving-vs-parked) requires an
  out-of-band, non-dosed, climbing parameter to have *something* said about
  it. The stability layer's `drift:` claim should satisfy it. Run and see;
  if it fails, that is information — report it, do not weaken the assertion
  without working up what surface now speaks for an out-of-band nutrient.

### 5. Gates

`npm run lint`, `npm run verify` (build + static checks + 23 legacy-port
suites), `npm test` (vitest; compare failures against a baseline run taken
**before** the change — pre-existing reds are labelled chemistry gaps and are
not this routine's to fix), `npm run build`. Record each command and outcome
in the log. No new failures anywhere; new tests green.

---

## Part two — the report Dan needs

One new entry in `.agent/needs-dan.md`, newest at top, both layers per
AGENTS.md #11, contradictions worked up and left open per #10. It exists so
that when Dan sits down to write the canon entry, every decision is in front
of him with its evidence, and none has been quietly made for him.

**Frame first**: §25 settles *where* the reasoning lives — the engine, per
the one-engine decision — and settles *nothing* about its content. What is
missing is a canon section for each parameter sourced the way §2, §3 and §5
are: a figure, and where it came from. Journey 5 is quoted as design input
throughout, marked as his words rather than published guidance.

The decisions, enumerated:

1. **Phosphate's band and its legitimate range.** Published 0.03–0.10 ppm;
   journey 5: people run 0.20–0.40 on purpose, so the band must be freely
   editable and wider-ranged than the dosed parameters'.
2. **The 0.03 ppm floor** — the one place journey 5 wants firmness: warning,
   not emergency, not silence. Needs a canon entry with its severity and
   wording register, because SAFE_BOUNDS currently says 0.01 and nothing
   fires at any low value; the two figures need reconciling, not averaging.
3. **The count mechanism** — how many of the last N readings out of band
   before the app speaks. Three-of-four is his example; is it the rule? A
   mechanism the app does not have; nothing else fits a line to it.
4. **No direction language on phosphate — and what about the stability
   layer's?** Removing the findings loops removes the regression's voice, but
   `drift:` claims can still say phosphate is "climbing". If count language
   replaces slope language, it replaces it there too.
5. **Nitrate is not phosphate.** It can pin or climb steadily — does it get
   trend language phosphate does not? (Journey 5 open question 1, and Randy
   Holmes-Farley's buffering asymmetry as the physical reason the two may
   not share a model.)
6. **Nitrate's floor** (open question 4) and **any upper warning** for either
   (open question 3).
7. **The levers, in his words** (open question 5) — above band the app names
   options briefly and never computes an amount. No millilitre figure exists
   for either parameter today (neither is in `DOSED_ELEMENTS`, no strength,
   no dose path); the canon entry should say that is by design so it stays
   true.
8. **The noise-floor unit question**, three options from TW-029, each with
   which-direction-wrong-hurts: (a) read percent-mode floors as a proportion
   of the band in `correctionProgress`; (b) give `correctionProgress` its own
   per-parameter floor table; (c) give phosphate an absolute ppm floor in
   `STABILITY_RULES`. Decided **before** anything gives phosphate an engine.
9. **Windows and cadence** — STABILITY_RULES' 14/28-day percent-mode windows
   exist but are unsourced in canon; a §4-style row each.

Finally: annotate TW-029 in `.agent/backlog.md` — the removal half executed
(date, branch, this routine), the reasoning half open and now waiting on the
needs-dan entry. Do not close the item.

---

## Rules, no exceptions

1. **Do not invent a threshold.** No figure for phosphate or nitrate enters
   code, spec or test as a judgement. Test fixture values are scenario
   coordinates, not thresholds, and say so.
2. **Canon is canon** (AGENTS.md #1). Nothing under `docs/spec/*` or
   `docs/journeys/*` moves. The §12 refusal is implemented, not edited.
3. **Chemistry constants untouched** (AGENTS.md #3). This routine removes
   the *application* of borrowed rules; it changes no constant, band, rail
   or formula. `SAFE_BOUNDS`, `STABILITY_RULES`, `PARAM_DEFS` all keep their
   values.
4. **No domain-verifier dispatch.** The chemistry judgement here — that the
   borrowed notices are wrong — is Dan's own, in canon, quoted. Nothing new
   is claimed about reef chemistry; removal implements the decision.
5. **Tests updated, never bent** (AGENTS.md #4). Every assertion changed
   cites TW-029 in a comment and is listed in the log with its old and new
   expectation.
6. **Checkpoint contract.** `.agent/runs/<run-id>.md` before and after each
   step; `.agent/log/<run-id>.md` as work completes, never at the end. Part
   one is the safe boundary — if the run dies after it, part two is a clean
   resume.
7. **Finish the job** (AGENTS.md #13): commit on the designated branch, push,
   open the PR with the what/why/risk body in both layers. **Never merge.**

---

## In plain terms

*Per AGENTS.md #11 — for the person whose tank it is.*

The app has been judging phosphate and nitrate with alkalinity's ruler. That
ruler measures two things: "a long way out of range", scaled to the width of
your own target band, and "heading out of range", from a straight line fitted
through a month of readings. Both make sense for alkalinity. Neither makes
sense for nutrients — and the arithmetic proves it: on the low side, the
"long way out" alarm for phosphate sits at minus 0.04, a number no test kit
can produce. So phosphate at absolute zero — genuinely bad for corals — says
nothing, while ordinary bouncing produced the silly warnings you noticed.

This routine takes that ruler away from those two parameters. It does not
build the replacement, because the replacement is a set of chemistry
decisions only you can make — where the firm floor sits, how many high
readings in a row matter, whether nitrate gets to be called "rising" when
phosphate never should. Until you decide, the app says less about these two
instead of saying wrong things: their band chips, their nutrient-balance
warnings and their stability grades all stay.

The second half of the routine writes those decisions up for you, one by one,
with what the write-ups and the published guidance each say, so deciding is
a matter of reading one document rather than excavating the app.
