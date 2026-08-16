# "Target" — full audit of every use

**Report only. No code, spec, copy or test was changed by this run.**

Raised by: `.agent/needs-dan.md` item 6, third bullet — *"'Target' rename
(terminology-auditor) — still open, parked by the owner 2026-08-14 pending a
review of all four uses."* Origin finding:
`.agent/log/2026-08-14-consistency-sweep.md:78-80`. Parked again in the spec at
`docs/spec/wizard-states.md:1093` — *"It does not settle the four-way use of
'target' … **Parked, pending a review of all four uses**."*

This is that review.

---

## 1. What this audit found that the parking note did not say

The note describes four meanings. There are **six**, and two of them are the
ones that can produce a wrong number rather than merely a confusing sentence.

The two extra ones are not pedantry:

- **A dose rate in mL/day** also travels under the name `target`, on the same
  object and often the same field as a concentration. This is already filed as
  **TW-035** and pinned by a live test
  (`tests/parity/dose-status-target-field-semantics.test.js`). The audit note
  called it out as an aside; it is a full sixth of the problem and it is the
  only one with a unit mismatch behind it.
- **`targetCorrection`** is not a target at all. It is a one-off correction
  object. 45 references carry the word for no reason.

And one structural fact underneath all of it, which is why the word split in
the first place:

> **The app has no "target" in the sense §15 registers.** §15 defines target as
> "the user's chosen value". `docs/spec/reef-chemistry.md:73-75` says "The user
> sets a target and a band width." The app does not implement that. The user
> sets a **minimum and a maximum** directly (`src/App.jsx:413-418`,
> `customRanges`), and no target *point* is stored anywhere. This is not an
> inference — `src/test/spec/classification/band-edges.test.js:105-113` states
> it as a tested structural gap: *"there is no user-settable 'target' anywhere
> in the codebase (grepped: no alkTarget, caTarget, mgTarget, or any 'target'
> field on settings)."*

The registry registers a word for a concept the app does not have. Six nearby
concepts then borrowed it. Renaming without noticing this leaves the same
vacuum, and the word will drift back into it.

---

## 2. Scale

Raw occurrences of the string, case-insensitive, excluding `legacy/`,
`original-artifact.html` and `node_modules`:

| Where | Count |
|---|---|
| `src/` (excluding DOM `e.target`) | 411 |
| `src/` DOM event handlers (`e.target.value` etc. — not ours) | 43 |
| `src/test/` + `tests/` | 261 |
| `docs/spec/reef-chemistry.md` | 33 |
| `docs/spec/wizard-states.md` | 28 |
| `docs/journeys/` | 10 |
| `.agent/` working notes | ~200 |

Identifier families, counted directly:

| Family | Count | Sense |
|---|---|---|
| `off-target` / "off target" | 296 (src + docs + tests) | §5 — band position |
| `targetCorrection` | 45 | §7 — not a target |
| `targetMin` / `targetMax` | 17 | §4 — the band |
| `planTarget` | 16 | §6 — a dose rate |
| "target range" (string) | 12 | §4 — the band |
| "in target" / "on target" / "in-target" | 11 | §5 — band position |
| `calcTarget` / `setCalcTarget` | 7 | §3 — typed by the user |
| `retarget` | 3 | §4 — changing the band |

---

## 3. Meaning 1 — the value the user types

**What it means:** a level the user names, once, to ask "what would it take to
get here from where I am?" It is not saved, not a setting, and does not affect
any classification or dose. It exists in exactly one place.

**Where it lives:**

| Site | What it is |
|---|---|
| `src/components/Setup.jsx:135` | `const [calcTarget, setCalcTarget] = useState("")` |
| `src/components/Setup.jsx:379` | `<Field label={`Target${…unit…}`}>` — **the visible label** |
| `src/components/Setup.jsx:380-381` | the number input |
| `src/components/Setup.jsx:394` | "Currently {x}{unit}. **Enter a target** to see what it takes to get there in {n}L." |
| `src/components/Setup.jsx:375` | resets to `""` when the parameter changes |
| `src/lib/analytics/correction.js:50-56` | `computeCorrection(paramKey, current, **target**, volumeL)`, `delta = target - current` |
| `src/components/Setup.jsx:139-140` | the call site |

**How the user meets it:** a "Target" field in Setup's correction calculator,
directly under a "Currently 8.1 dKH" line. Nothing about the field says it is
throwaway; it looks exactly like a setting, and the app has real settings on
the same screen.

**Why it is a distinct concept:** it is a *point*, chosen by a person, used
once, stored nowhere. The band the same user has set for the same parameter is
a *pair*, stored, and drives every classification the app makes. Two fields on
adjacent screens, same word, opposite lifetimes.

---

## 4. Meaning 2 — the app's computed aim point

**What it means:** the single value a correction is heading for. Always the
midpoint of the band, `(def.min + def.max) / 2`. Never user-supplied. The spec
is explicit and says it twice:

- `docs/spec/reef-chemistry.md:586` — *"The aim point is unchanged: the
  midpoint of the band … **A target is a point, not a zone.** Not the nearest
  edge — normal drift would take it straight back out."*
- `docs/spec/wizard-states.md:199` — *"**Where the correction aims** — the
  midpoint of the band. A target is a point."*

**Where it is computed:**

| Site | What |
|---|---|
| `src/lib/dosing/helpers.js:416-418` | `const target = (def.min + def.max) / 2` in `computeCorrectionPlan` |
| `src/lib/dosing/helpers.js:441,448,459,462` | returned as `target` on the plan object |
| `src/lib/dosing/state.js:197,205` | `const mid = (def.min + def.max) / 2` → `target: mid` on the **emergency** branch |
| `src/lib/dosing/helpers.js:232-238` | `correctionPlanFor` coerces a stored plan's `target` to Number |
| `src/lib/dosing/helpers.js:273,294-295,328` | direction, remaining, and `passed` all measured against `plan.target` |
| `src/lib/dosing/state.js:269,380` | recomputed for logged one-off corrections |

**How it reaches the user** (all as `fmtVal(def, …)` + the parameter's unit):

- `state.js:248,273` — "Alkalinity **is on its way to 8.5 dKH**"
- `state.js:220,228,236` — "still short of 8.5 dKH", "the estimate to reach
  8.5 dKH has run out", "has passed 8.5 dKH"
- `state.js:232` — `short: "**Target reached**"` (also `wizard-states.md:150`)
- `ReadingConfirmation.jsx:52,64,77` — "A correction is running **toward 8.5
  dKH**", "has **passed your target**", "0.4 dKH to go toward 8.5 dKH"
- `DosingWizard.jsx:135,161` — `plan.startValue → plan.level → **plan.target**`
- `narrative-engine.js:567` — "Moving toward 8.5 dKH, which is what the raised
  dose is for."
- `helpers.js:460` — "Reaching 8.5 dKH through your maintenance solution
  would mean …"

**Why it is a distinct concept:** it is derived, not chosen. A user who edits
their band moves this number without ever being shown it. It is also the one
meaning the spec's own prose insists on — "a target is a point" — while the
app's most-shown use of the word (§5 below) is a range.

---

## 5. Meaning 3 — the whole band

**What it means:** the pair `def.min`–`def.max`; the no-action band; the thing
the user actually sets and the thing every classification is made against.

**Where it lives:**

| Site | What |
|---|---|
| `src/lib/constants.js:5` | `/* **Target bands**, checked against the hobby consensus…` — the header comment over `PARAM_DEFS` |
| `src/App.jsx:413` | `// Merge any user-edited **target ranges** over the built-in defaults.` |
| `src/lib/dosing/helpers.js:741` | `out.**target** = { min: def.min, max: def.max }` |
| `src/lib/dosing/alkalinity.js:487`, `calcium.js:243` | the same assignment, per engine |
| `src/components/ErrorBoundary.jsx:280` | `<Row k="**Target range**" v={…a.target.min–a.target.max…} />` |
| `src/components/ZoomableChart.jsx:69,167-170,203,225` | `targetMin` / `targetMax` props, the shaded `ReferenceArea` |
| `src/components/ZoomableChart.jsx:232` | chart legend: "**target range**" |
| `src/components/AllParametersSheet.jsx:282,285` | "· **target** 8.2–8.8" and the chart props |
| `src/components/IcpPanel.jsx:169,173,175` | the same props, plus "Triton publishes a single **target** for this element" |
| `src/components/Dashboard.jsx:375` | modal header: "**target** 8.2–8.8dKH · 41 of 60 readings" |
| `src/components/Dashboard.jsx:379` | button: "**Edit target range**" |
| `src/components/Dashboard.jsx:387` | panel heading: "**Set target range** (dKH)" |
| `src/components/Dashboard.jsx:560` | "…above your **8.2–8.8dKH target** — so it's being held steadily…" |
| `src/components/Dashboard.jsx:590` | "**Retarget to** 8.3–8.9dKH?" |
| `src/components/TodayPanel.jsx:290-292,324` | StabilityStrip comment + `aria-label`: "…**target** 8.2 to 8.8dKH" |
| `src/components/TodayPanel.jsx:349` | the strip's own centre caption, literally the string `"target"` |
| `src/components/TodayPanel.jsx:490,581-582` | "Change the {param} **target**", "**targets live in Setup**, and a range you actually want…" |
| `src/components/Insights.jsx:325` | "(**target** is 8.2–8.8dKH)" |
| `src/lib/findings.js:248-249` | "…is well {above/below} your **target**", "8.1dKH against a **target of** 8.2–8.8dKH" |
| `src/lib/narrative-engine.js:634,936,1018,1044,1050` | "against a **target of** 8.2–8.8dKH", "inside their **target range**", "passing through your **target band**", "the edge of your **target band**" |
| `src/lib/analytics/reading-meaning.js:95,120-122,154` | `targetWidth = def.max - def.min`, "the width of the **target band**" |
| `src/lib/stability-engine.js:35` | "…than the whole **target band**" |
| `src/lib/analytics/time-in-range.js:5-7` | "somewhere the **target** does not…" |
| `src/lib/backup.jsx` / `.agent/items/TW-013.md` TW-013, TW-033 | "restore overwrites **targets**" — meaning `custom-ranges`, i.e. bands |

**Why it is a distinct concept:** a band has two edges and a width. §2's Layer
2 calls the width a separate user choice. `reading-meaning.js:95` divides by
it. You cannot substitute meaning 2 (a point) here without changing arithmetic.

**Note on `TodayPanel.jsx:349`:** the strip prints the bare word `"target"` as
its centre caption between the two band edges — the only place in the app where
"target" appears with no number and no qualifier at all. Whatever is decided,
this string cannot survive as-is; it means "the lit band you are looking at"
and reads as "the point you are aiming at."

---

## 6. Meaning 4 — a synonym for band position ("in it" / "out of it")

**What it means:** *not* a target at all — where a reading sits relative to the
band. `in target` = in range. `off target` = out of range.

**This one is already answered by the registry as written, and does not need
Dan.** `docs/spec/wizard-states.md:573-575` registers **in range** for "within
no-action band" and **out of range** for "outside no-action band", under the
heading *"One word per concept, everywhere. Any synonym is a finding."*
"In target" and "off target" are synonyms for those two registered concepts.
They are findings today, under a rule settled on 14 August.

**User-facing sites:**

| Site | String |
|---|---|
| `Dashboard.jsx:430` | "{pct}% **in target**" |
| `Dashboard.jsx:517` | bar label: "**In target**" |
| `Dashboard.jsx:525` | "38 of 41 **in target** · 3 below" |
| `Insights.jsx:305,313` | the same bar and caption, duplicated |
| `Insights.jsx:271,340` | "does that band line up with your **target**? … A low **in-target** score with tight consistency…" |
| `state.js:318` | `short: "**Steady, off target**"` — and `wizard-states.md:157` |
| `narrative-engine.js:231-232,253-255,265,267,290-291` | eight summary sentences: "Rock steady, but a lot of it is **off-target**", "several **off-target**", "one sitting **off-target** but going nowhere", … |
| `narrative-engine.js:645-646` | "Alkalinity **is parked off-target**" |
| `narrative-engine.js:939,993,997,1005,1008,1073,1077,1101,1181` | "Steady isn't the same as **on target**", "(0.3dKH **over target**)", "sitting **off-target** but holding steady", "**below target**", "all **on target**", "sitting off **your targets**", "sits **under your target**", "off **their targets**" |
| `narrative-engine.js:1229,1255,1271,1274` | four next-step sentences: "…before they mind a number being **off target**", "movement costs corals more than being **off-target** does", "…whether that's the tank or the **target**" |
| `findings.js:36-45,238,248` | "as your **target**", "'outside your **target**' and 'dangerous' are different", "merely **off-target**" |
| `reading-meaning.js:174-177,216,226` | "the tank is **on target**", "genuinely **off target**", "move your **target** to match the tank" |
| `ReadingConfirmation.jsx:24,390` | "not 'well below your **target**' with nothing being done", "Comfortably within your **target range**" |

**Internal-only sites** (state identifiers and derived flags — a different
question, see §11):

| Site | What |
|---|---|
| `state.js:480` | `state: "**off-target**"` — one of the 17 states |
| `Dashboard.jsx:349` | reads that id, renders "Level, not dose" |
| `narrative-engine.js:451,525` | reads the id |
| `narrative-engine.js:759` | a set literal of correcting-state ids, including `"off-target-correcting"` |
| `drift.js:201-207` | `**offTarget**` = `"low"` \| `"high"` \| `null`, computed from `def.min`/`def.max` |
| `wizard-states.md:117,157,164,258` | the state in §2's branch table, §5's tone table, §6 |

---

## 7. Meaning 5 — a dose rate in mL/day

**Not in the parking note's list of four.** This is the one with a unit
mismatch behind it, already filed as **TW-035** (`.agent/items/TW-035.md`)
and pinned by `tests/parity/dose-status-target-field-semantics.test.js`.

**What it means:** the mL/day a staged dose plan is working up to — a *rate*,
not a level.

| Site | What |
|---|---|
| `ErrorBoundary.jsx:257` | plan written to storage: `**target**: a.staged ? Math.round(a.maintenanceDose * 10) / 10 : ml` — **mL/day** |
| `state.js:361` | `**target**: a.maintenanceDose` on the "suggested" branch — mL/day |
| `state.js:294,300,315,353` | `**target**: plan.target` on "settling", "due", "worked" — mL/day |
| `state.js:309` | `Math.abs(plan.**target** - plan.appliedDose) > 0.5` — compared against a dose |
| `state.js:314` | "The plan was **heading for 12.5 mL/day**" — `fmtAmount(plan.target)` |
| `helpers.js:710`, `alkalinity.js:442,446-448`, `calcium.js:209,258-259` | `**planTarget**` = `plan.target`, mL/day |
| `ErrorBoundary.jsx:140-141` | "heading for about **12.5 mL/day** once this step is confirmed" |
| `DoseExpectation.jsx:39,94,97` | destructures `**target**` from the status object, renders `{fmtAmount(target)} **mL/day**` |
| `alkalinity.js:862` | `Math.abs(out.activePlan.**target** - out.maintenanceDose)` — dose against dose |

**The collision, precisely.** Two different stored objects both use the field
name `target`, and both are called `plan` inside `src/lib/dosing/`:

- the **correction plan** (`correctionPlanFor`, `cp`) — `target` is a
  concentration; compared with `plan.startValue` and reading values
  (`helpers.js:273,294-295,328`); rendered `fmtVal(def, …) + def.unit`.
- the **staged dose plan** (`activePlan`) — `target` is mL/day; compared with
  `plan.appliedDose` (`state.js:309`); rendered `fmtAmount(…) + " mL/day"`.

And `doseStatus`'s own returned top-level `target` is a concentration in one
branch (`state.js:205`) and a dose rate in four (`state.js:294,300,315,361`).
The parity test's own summary: *"whichever [surface] starts rendering `target`
generically … will be right for some states and wrong — by an order of
magnitude, and in the wrong physical unit — for others."* No live consumer
reads it generically today, so this is latent, not a visible bug.

`wizard-states.md:80` documents the field as *"where a plan is heading, when
there is one"* — a description that is true of both units and distinguishes
neither. That row is why the collision reads as intentional.

---

## 8. Meaning 6 — `targetCorrection`, which is not a target

45 references. The object is a one-off correction — how much to add, over how
many days, by what route. It has no target field, holds no aim point, and its
own properties are `ppmToRaise`, `days`, `ppmPerDay`, `oneOffMl`, `perDayMl`,
`viaMaintenance`, `direction`.

| Site | |
|---|---|
| `helpers.js:711,994,1010-1024`, `alkalinity.js:762,777-784`, `calcium.js:210,508-531` | computed and read |
| `state.js:259,363,394,413` | branch conditions and copy |
| `ErrorBoundary.jsx:222,228-241` | the "Log a 240 mL correction" panel |

The word here is doing no work at all. It is the cheapest thing on this list to
retire, and the only one with zero user-facing text to rewrite.

---

## 9. All six in one place — the collision map

`ParamHistoryModal` (`src/components/Dashboard.jsx:206`) is the modal the
parking note refers to. Opened on alkalinity, a user can see, without
scrolling past one screen:

| Line | What they read | Which meaning |
|---|---|---|
| 375 | "target 8.2–8.8dKH" | **band** |
| 379 | "Edit target range" | **band** |
| 387 | "Set target range (dKH)" + Minimum / Maximum inputs | **band**, typed |
| 430 | "82% in target" | **band position** |
| 517 | "In target" (bar label) | **band position** |
| 525 | "38 of 41 in target · 3 below" | **band position** |
| 560 | "…above your 8.2–8.8dKH target…" | **band** |
| 590 | "Retarget to 8.3–8.9dKH?" | **band**, as a verb |
| 349 | state `off-target` → "Level, not dose" | **band position** (id only) |
| via `dose.detail` | "Alkalinity is on its way to **8.5 dKH**" (`state.js:248`) | **aim point** |
| via `dose.detail` | "The plan was heading for **12.5 mL/day**" (`state.js:314`) | **dose rate** |
| 612 → `ZoomableChart:232` | legend "target range" | **band** |

Five of the six meanings, one screen. The sixth (Setup's typed value) is two
taps away and uses the bare label "Target" for something none of these are.

The sharpest single line is 560: **"above your 8.2–8.8dKH target"** — the word
takes a range as its object in the same modal where the dose card uses it for a
point and the bar label uses it for a percentage.

---

## 10. The proposal

Four meanings do not need four words, because **meanings 1 and 2 are the same
concept from two sources** — a single level to head for, in one case typed by
the user and in the other computed as the band midpoint. Once those collapse,
six uses reduce to four concepts and only one needs a genuinely new word.

### Recommended: the **band** keeps "target", always as **target range**

| Concept | Word | Replaces |
|---|---|---|
| the user's chosen band | **target range** — always both words, never bare "target" | "target", "target band", "target ranges", `targetMin`/`targetMax`, `out.target` |
| a single level being headed for, typed or computed | **aim point** | meaning 1's "Target" field, meaning 2's `plan.target`/`cp.target`/`target: mid` |
| where a reading sits relative to the band | **in range** / **out of range** — already registered, §15 | "in target", "off target", "on target", "% in target" |
| the mL/day a staged plan is working up to | **planned dose** | meaning 5's `plan.target`, `planTarget`, `doseStatus.target` |
| a one-off correction | **correction** — already the word everywhere else | `targetCorrection` → `correction` |

**Why the band and not the aim point.** Three reasons, in order of weight:

1. **It is what the user actually sets.** §15's registered concept is "the
   user's chosen value". In this app that is a pair of edges (`App.jsx:413-418`).
   The midpoint is derived and never shown as a settable thing. Giving the word
   to the derived number and inventing a new one for the chosen number inverts
   the registry's own definition.
2. **It is where the word already is, in front of users, today.** 12 "target
   range" strings, the chart legend, the modal header, the Setup screen, the
   `aria-label` on the stability strip. The aim point's user-facing appearances
   are all sentences that already name the number ("on its way to 8.5 dKH")
   and read fine without the word at all.
3. **"Aim point" is already the spec's own word.** `reef-chemistry.md:586` and
   `wizard-states.md:199` both write "**The aim point** is … the midpoint of
   the band" and then add "a target is a point" as a gloss. The spec reaches
   for "aim point" when it needs to be precise. Promote the precise one.

**The cost, stated plainly.** `reef-chemistry.md:586` and `wizard-states.md:199`
both contain the sentence "**A target is a point, not a zone.**" Under this
proposal that sentence becomes false and must be rewritten — the word would
then mean a zone and only a zone. That is the strongest argument against, and
it is a sentence written deliberately to settle a different confusion (nearest
edge vs midpoint), which the rename does not reopen: "the aim point is a point,
not a zone" carries the same meaning intact.

### Option B: the **aim point** keeps "target"; the band becomes **"your range"**

Faithful to the two spec sentences above, and to how a reefkeeper uses the word
in conversation — `docs/journeys/journey-1-alkalinity.md:13` has Dan writing
*"Band 8.5–9.5 dKH. **But the real target is 9.0–9.5**"*, which is the word
used for a point-ish aim inside a wider band.

Costs: every "target range" string flips to "range" (12 strings, plus
`targetMin`/`targetMax`, the chart legend, the `aria-label`, the Setup screen),
and — the real cost — the word changes meaning *under users who already have it
on screen*. A keeper who reads "target 8.2–8.8" today would read "target 8.5"
tomorrow, for the same tank, with no migration note. That is a worse failure
than the current ambiguity, which at least never changes what it says.

Note also that journey-1:189 records the exact question as still open — *"Is
9.0–9.5 a tighter band, or a target inside a wider one?"* — so Option B commits
the word to a concept whose own definition Dan has not settled.

### Option C: retire "target" entirely

`target range` → `range`, aim point → `aim point`, position → `in range`, dose
→ `planned dose`, `targetCorrection` → `correction`. Internally consistent and
the least ambiguous outcome available.

Cost: §15 loses a registered term and the app loses a word every reefkeeper
uses. "Your range" is measurably vaguer than "your target range" in the one
place it matters most — the Setup screen where a user first decides the number.
Not recommended, but recorded because it is the only option with no residual
ambiguity at all.

---

## 11. What each option leaves untouched

The following are **not** violations under any option and should be left alone:

- **DOM event handlers** — `e.target.value`, `e.target.files` (43 sites). Not
  our word.
- **The `Target` lucide icon** — `src/icons.jsx:31`, imported by
  `Insights.jsx:6` and `DoseExpectation.jsx:3`, used as the *nutrients* and
  *potassium* glyph. A concentric-circles icon; nothing to do with the concept.
- **"Touch targets ≥44 px"** — `wizard-states.md:711`, `.claude/agents/*.md`.
  Accessibility term of art.
- **Triton's published values** — `IcpPanel.jsx:173,175`,
  `Insights.jsx:1002`, `findings.js:693` ("which Triton **targets** at zero").
  Quoting a third party's own word for their own number. §15's precedent for
  this is explicit: owner quotations are left verbatim because "the ban is on
  what the **app** says."
- **The `off-target` state identifier** — `state.js:480` and its four readers,
  plus §2/§5/§6 of `wizard-states.md`. §15 already carves out two words as
  "canon's own": **alert** and **message**. A state id is the same category —
  it is never rendered (`Dashboard.jsx:349` renders "Level, not dose"). The one
  exception is `state.js:318`'s `short: "Steady, off target"`, which **is**
  rendered and is a §15 finding today.
- **`.brief-target-note`** — `aurelia-skin.css:59`, a CSS class. Cosmetic;
  rename only if the paragraph it styles is rewritten anyway.

---

## 12. Blast radius, if a rename is authorised

Not a plan — a size estimate, so the decision is made with the cost visible.

| Area | Sites | Risk |
|---|---|---|
| User-facing strings, components | ~35 across 9 files | Low — copy only |
| User-facing strings, `narrative-engine.js` | ~28 sentences | **Medium** — `scripts/verify/wordingcheck.mjs` asserts dose claims repeat the engine's wording; strings must move together or it fails |
| `findings.js`, `reading-meaning.js`, `state.js` copy | ~15 | Low |
| `targetMin`/`targetMax` props | 17, across 4 components | Low — mechanical |
| `targetCorrection` → `correction` | 45 | Low — mechanical, no user-facing text |
| `planTarget` / `doseStatus.target` split | 16 + the TW-035 field split | **Highest** — this is a behaviour-adjacent change, not a rename. Do it as TW-035, on its own, with the parity test as the gate |
| `off-target` state id | 296 matches for the family; the id itself is 5 code sites + 4 spec rows | Leave, per §11 |
| Spec: `reef-chemistry.md` §2, §9, §13 | 33 | **Medium** — §2's "the user sets a target and a band width" is already untrue of the code (see §1) |
| Spec: `wizard-states.md` §1 field table, §5, §15, §22 | 28 | Medium |
| Tests | 261 matches; `target-change-immutability.test.js` and `band-edges.test.js` are the two that carry the word structurally | Low — but `band-edges.test.js` is a *deliberately failing* structural-gap test and its prose must stay accurate |
| `.agent/` notes and backlog | ~200 | Leave. Working notes record what was said at the time |

Two things should **not** be bundled with a copy rename:

- **TW-035** (the mL/day field split) is a correctness fix with a live pin.
  It is cheaper and safer alone.
- **§2's missing target point** (§1 above) is a spec-vs-code gap, not a word
  problem. Deciding it — does the user set a point plus a width, or two edges?
  — would change which concept even needs a name. If that is going to be
  revisited, it should land first.

---

## 13. In plain terms

The app uses one word for six things. On the alkalinity history screen you can
see five of them at once: "target 8.2–8.8" (a range), "Edit target range" (the
same range), "82% in target" (a percentage of readings), "on its way to 8.5
dKH" (a single number in the middle of that range), and "heading for 12.5
mL/day" (an amount of liquid). Under the surface, that last one and the one
before it are stored in a field with the same name, in different units, on the
same object — which is a real hazard rather than an awkward sentence, and is
already filed as TW-035.

Underneath all of it: the spec says you set a target and a band width. The app
never asked you for a target. It asked for a minimum and a maximum, and
everything since has been six different pieces of code guessing what the word
was supposed to mean.

The recommendation is that "target range" — always both words — keeps the word
for the band you set, because that is the number you actually chose. The
midpoint the app aims a correction at becomes the **aim point**, which is the
phrase the spec already uses when it needs to be exact. "In target" and "off
target" become "in range" and "out of range", which the registry already
decided on 14 August and which needs no sign-off from you. The mL/day one
becomes the **planned dose**. And `targetCorrection` just becomes a correction,
because that is all it ever was.

**Nothing has been changed. This needs your sign-off before any of it ships.**

---

*Audit run 2026-08-15. Report only — no code, spec, copy or test modified.*
