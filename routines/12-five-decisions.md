# Routine 12 — Work Up the Five Decisions

Cloud routine. **Reports only.** No code, spec, test or constant is changed.

---

## Why this exists

Phase 4 (`.agent/phase4-gaps-closed.md`) closed 26 of 31 gaps and surfaced
several places where two live behaviours conflict, or where a decision was
written down and never built.

That report documented them and stopped, because the routine told it to. Under
**AGENTS.md non-negotiable #10**, that was half a job: never resolve a
contradiction, but always work it up.

This routine does the working up. Five decisions, each given the full
`domain-verifier` treatment. **Dan still chooses.**

---

## What "worked up" means

For each decision below, every one of these:

1. **What sources say**, if anything. Search properly. Say plainly when nothing
   credible exists rather than reaching for a forum post.
2. **Two or three options**, each with reasoning that can be checked. Not
   assertions — reasoning Dan can follow and disagree with.
3. **Which direction being wrong hurts.** Errors in a dosing app are not
   symmetric. One direction stresses coral; the other annoys someone. Say
   which is which for each option. This often settles the question.
4. **What already does this job.** This app has repeatedly grown a second
   mechanism where one existed. Check before proposing.
5. **What else must change alongside.** Rules come in pairs.
6. **Is this one question or two.** Say so if it splits.
7. **The edges.** New tank, no history. Monthly tester. Level on a safe bound.
   Wrong-but-plausible Setup strength.
8. **Hand-computed arithmetic** against the real constants in `src/lib/`
   wherever a number would help. Label it as arithmetic, not simulation.
9. **What would make your preferred option wrong.**

Where you have no basis, **say so and stop**. A blank is cheap.

Both layers per non-negotiable #11: precise, then plain reef-speak.

**Note on simulation:** `legacy/tests/sim/*.js` runs against the old engine
bundle, which is not what these decisions concern. Do not present results from
it as evidence about current behaviour. `private/` is not in this checkout, so
real-data replay cannot run — say so rather than substituting anything.

---

## Decision 1 — Which engine owns the drift response?

**The conflict.** Two live mechanisms answer "your daily dose has drifted from
what the tank needs, what now?"

- **The wizard** (`src/lib/dosing/*.js`) recomputes `maintenanceDose` in full,
  stages a fraction of the change (45–100% by element, magnitude and urgency),
  then applies five ordered constraints. Fingerprint-verified.
- **`src/lib/analytics/drift.js:203`** applies a flat 10%, or 15% when
  severity is high. Feeds Insights and Dashboard. Its own noise floors, its
  own windows.

`reef-chemistry.md` §7 documents the second and calls it the wizard's
rule. That is simply wrong.

**What to work up:** which should govern, and what happens to the other. Note
that `wizard-states.md` §7 already says the wizard owns the verdict and
other surfaces echo it — so this may be less a chemistry question than a
question of whether that existing rule is being enforced.

---

## Decision 2 — Are water changes excluded from the trend fit?

**The conflict.** `calculation-spec.txt` §3 and `dosing-spec.txt` §4.3 both say
water changes are excluded as disturbances. `alkalinity.js:493-499` deliberately
does not exclude them, and argues its case in a comment: excluding them
restarted the window weekly and left the assessment a single reading, so the
app answered "hold" on tanks that were visibly draining.

Only logged corrections are subtracted, and by a proportional fading estimate
rather than by dropping readings.

**What to work up:** how much a routine water change actually moves alkalinity,
calcium and magnesium relative to each kit's noise floor — arithmetic on real
numbers, for a typical 10% change. That should largely settle it. Then whether
the current treatment is right for all three elements or only alkalinity.

---

## Decision 3 — What happens when consumption comes out negative?

**The conflict.** `alkalinity.js:638-641`, `calcium.js:365`, `helpers.js:722`
all clamp negative consumption to zero, set `maintenanceDose` to zero, label
the tank "gaining", and **continue**.

Negative consumption means the tank is producing alkalinity, which is not
possible. So one of the inputs is wrong: a bad reading, an unlogged water
change, or a wrong Setup strength.

The app's own handover notes call a wrong Setup strength "the single largest
correctness risk in the system", and nothing catches it.

**What to work up:** whether "gaining" is ever a legitimate reading of a
negative result, or always a broken input. Whether the response should be to
refuse and name the likely cause. And how often this actually fires — is it a
rare edge or a routine occurrence being silently absorbed?

This one is not a spec-versus-code conflict. No document covers it. It is a
live behaviour that looks wrong.

---

## Decision 4 — Where does a correction finish?

**The conflict.** `correction-spec.txt` §2 targets the band midpoint.
`arrived` (`helpers.js:274-279`) tests the full band. The merged draft says
"middle third" in its heading and "inside the band" in its body, two paragraphs
apart.

**The problem Phase 4 found.** Magnesium's band is 150 ppm wide, so its middle
third is 50 ppm — narrower than magnesium's own 30 ppm noise floor. A literal
middle-third rule could stop magnesium ever registering as arrived, on test
noise alone.

Not dangerous: `passed` (`helpers.js:316`) stops the elevated dose
independently of `arrived`. The failure is a stuck "still correcting" status,
not an overdose. But it is a real flaw in a decision made on 13 August.

**What to work up:** full band, literal middle third, or a per-element zone
scaled to each noise floor rather than a fixed fraction. Include the arithmetic
for all three elements. And whether the two confirming readings should instead
be required a minimum interval apart.

---

## Decision 5 — Bracket memory: 45 days flat, or 30/60 per element?

**The conflict.** `dosing-spec.txt` §6.1, `calculation-spec.txt` §7.4 and
`helpers.js:85` all say 45 days, flat. `reef-chemistry.md` §8.1 (now §8.3) records
a 13 August decision for 30 days alkalinity and 60 days calcium, scaled to
roughly two settle windows each — which was never implemented.

The same decision included "old observations may only widen the bracket, never
narrow it", intended to stop an old observation vetoing a dose increase on a
growing tank. Phase 4 found that mechanism **exists nowhere** — not in code,
not in any legacy document. The actual discard rule is still the flat 25%
consumption-similarity filter that the merged draft itself calls circular.

**What to work up:** whether the per-element split is worth building, and
whether the directional rule solves a real problem. Include arithmetic: on a
tank whose demand grows 30% a year, how much does a 45-day-old bracket
observation actually differ from today's? That number should settle whether
this matters.

---

## Output

`.agent/five-decisions.md`. Each decision gets:

```
## Decision N — <question>

what sources say:
options:            each with reasoning
arithmetic:         hand-computed, against real constants
wrong way:          which direction hurts, per option
already does this:
must change with:
splits into:
edges:
leaning:            and why, or "no basis"
would be wrong if:
```

Then both layers — precise, then plain.

End with **one page** listing the five questions and their options only, so Dan
can read the shape before the detail.

---

## Never

- Choose. Present the decision fully prepared and stop.
- Change code, spec, tests or constants.
- Write under `legacy/`.
- Present simulated or hand-computed figures as measured fact.
- Present a reasoned option as though it were sourced.
- Fill a gap you cannot defend.
