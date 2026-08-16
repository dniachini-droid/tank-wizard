# 2026-08-16 — phosphate and nitrate get their own canon

Run: `2026-08-16-phosphate-nitrate-canon`.
Routine: owner decision — `.agent/needs-dan.md` item 10, all nine decisions.
Branch: `claude/reef-chemistry-spec-aqe29s` (harness-designated).

Dan closed item 10 in one message and authorised the spec edit in as many
words. This run records the decisions and files the implementation. **It builds
nothing**: the implementation is untagged and unapproved.

## What was written

**`docs/spec/reef-chemistry.md` §29 — Phosphate and nitrate**, eight
subsections plus enforcement and a plain-language layer:

| | |
|---|---|
| §29.1 | the shape: managed by export and feeding, not by a dose — why borrowed reasoning was never a threshold problem |
| §29.2 | bands: phosphate 0.03–0.10, nitrate 5–15; safe bounds 0.01–0.5 and 0.5–50; legitimate range wider than the dosed elements |
| §29.3 | out has no margin; clearly out at 0.10 ppm / 10 ppm; wording only |
| §29.4 | the two fixed warnings, both band-independent, and the `SAFE_BOUNDS` collision resolved |
| §29.5 | count not slope; nitrate's own model; two residues named, then closed on the second pass |
| §29.6 | no dose, no correction, no levers — the one place canon overrides journey 5 |
| §29.7 | windows ratified: 14 days and 28 days, proportional |
| §29.8 | the `correctionProgress` unit question closed as unreachable by design |

**No figure in §29 is new.** Every one of the eight — 0.03, 0.10, 5, 15, 0.01,
0.5, 50, 14, 28 — is already in `constants.js`, `findings.js` or
`stability-engine.js` with its sourcing beside it. §29 promotes them from code
comment to canon, which is the state item 10 asked for ("a figure, and where it
came from"). The two genuinely new figures are the clearly-out margins,
0.10 ppm and 10 ppm, named by Dan.

**`.agent/needs-dan.md`** — item 10 struck through and closed with a mapping
from each of the nine questions to the subsection that answers it; the decision
recorded at the top of Decisions; the 15 August §27 entry demoted from
"(latest)" to "(previously latest)", not rewritten.

**`.agent/items/TW-054` … `TW-060`** — the implementation, all
`status: needs-approval`, all untagged, orders 680–740.

**`.agent/items/TW-029.md`** — progress line: the reasoning half is done, the
item stays open until TW-054…060 ship. *"The notices are no longer wrong, but
they are still not yet right."*

## The one code change, and it is a comment

`src/lib/dosing/helpers.js`, `correctionProgress`. The warning comment TW-029
left at the read site said the unit mismatch was latent and pointed at three
unresolved options. Dan closed the question as **unreachable by design**, so
the comment now says that, cites §29.8, and tells the next reader that the only
thing which could make the read wrong is giving one of these parameters a
correction path — which §29.6 forbids. Dan asked for this comment by name.

No constant, threshold, formula or behaviour was touched.

## Two things Dan's answers did not settle — raised, then closed the same day

Both were named in §29.5 rather than invented away, and Dan answered both
before anything shipped. Recorded here in the order it happened, because the
question is what the answer turns on.

**Raised on the first pass:**

1. **Nitrate's trend evidence bar.** Dan: *"three readings, one direction,
   clearing the noise floor"* **and** *"at the same evidence bar as the dosed
   elements"*. The dosed elements' bar is `directional()`
   (`src/lib/findings.js:142-156`): four readings, three steps, two thirds
   agreeing. Three readings is two steps. The sentence gives two numbers.
2. **Whether the phosphate count needs the same side.** *"Three of the last
   four readings outside the band"* reads literally as either side; its stated
   purpose — *this is where you have been living* — reads as one side. Two
   above and one below is the separating case.

**Answered on the second pass, later the same day:**

1. **Three readings, one direction, clearing the noise floor — and explicitly
   not the four-reading statistical gate.** Dan: *"My 'same evidence bar' was
   loose wording — the practical rule from journey 1 is what I meant."* The
   phrase is withdrawn from §29.5 and the rule is
   `journey-1-alkalinity.md` §5: *"One reading is notice, two is a signal,
   three is a fact. … The app's evidence gates are about statistics; this is
   about patience."* §29.5 now carries **why the lower count is not a lower
   standard**: `directional()` is a test about a fitted line, and nitrate is
   not being fitted — it is watched for a run of three, a claim about
   consecutive readings. §5's noise floor stays in force, so what drops is the
   count, not the measurement standard. TW-058 carries the same reasoning,
   because "widen it to four for consistency" is the obvious wrong instinct at
   implementation time.
2. **Same side. Two above and one below does not count.** Dan: *"The point of
   the count is where the level has been living; a reading bouncing above then
   below is not that."* Three high and one low is a tank living high; two high,
   one low and one high is a tank bouncing, which is what phosphate does when
   nothing is wrong — so the literal either-side reading would have fired
   hardest on exactly the behaviour the count exists to stop the app talking
   about. TW-057's first test artefact is now the negative case: above, above,
   below, above produces **nothing**.

Both items are unblocked; neither is approved. §29's header states that nothing
in the section is open, so a later reader does not go looking.

Phosphate does not converge on nitrate as a result: it gets no direction
language at any bar, however patient. A run of three on a parameter that
oscillates between 0.20 and 0.15 is what oscillation looks like. The two are
separated by the buffering, not by the evidence.

## Three consequences worth naming, all analysed rather than escalated

- **Clearly-out-low is unreachable at both suggested bands** (0.03 − 0.10 =
  −0.07; 5 − 10 = −5). Same *shape* as the negative `far-out-low` thresholds
  TW-029 removed, not the same fault: it gates an adjective rather than the
  only thing said about a low level; phosphate's low side has the
  band-independent 0.03 warning; near-zero nitrate reaches the keeper through
  the nutrient findings that were never removed. Reachable on a wider user
  band. Written into §29.3 and TW-055 so it is not re-filed every audit.
- **The suspended husbandry expectation comes back, but not verbatim.**
  `tests/legacy-port/husbandry.js:84-94` asserts `urgentAbout(r, /nitrate/i)`
  at 80 ppm; §29.4 puts nitrate above 50 at *worth attention, not urgent*.
  Restoring it unaltered would assert the opposite of the decision, so the
  predicate changes with it (TW-056). Inversion with reasoning, per AGENTS.md
  rule 4.
- **A fixed warning can fire on an in-band reading** — a keeper with a
  phosphate band of 0.01–0.05 gets both. Not a contradiction; the same shape
  already holds for the dosed elements against safe bounds. What is forbidden
  is folding both into one sentence.

Nitrate gets no low warning: the two-warning list is exhaustive and
`SAFE_BOUNDS`' 0.5 is a target floor by the rule Dan stated for phosphate's
0.01. Recorded in §29.4 rather than escalated, because Dan's own framing
settles it.

## Verification

    npm ci                    (node_modules was absent in this container)
    npm run verify            ALL BLOCKING CHECKS PASSED
    node tests/legacy-port/golden.js
                              golden: 5940 cases unchanged (3a782222dbce41c5)
    npx vitest run            59 failed | 535 passed (594)

The golden fingerprint is **unchanged**, which is expected rather than
reassuring here: nothing behavioural was touched.

The 59 vitest failures were measured on both trees and compared **by name, not
by count**: 59 before, 59 after, **0 new, 0 fixed**. Method: `npx vitest run
--reporter=json` on the working tree, `git stash -u`, the same command on the
clean tree, set-difference of `file :: fullName`.

Two advisory checks fail (`deadcode`, `csscheck`) and did so before this run.

## Not done

- Nothing from TW-054…TW-060. Untagged means unapprovable by an agent.
- §25's coverage table, §4's window table and §16's constants table still point
  at "nowhere" for these two. Dan authorised a new section, not edits to three
  existing ones — filed as TW-060, owner Dan, same call as TW-053.
- No PR opened by this run (see the run file).
