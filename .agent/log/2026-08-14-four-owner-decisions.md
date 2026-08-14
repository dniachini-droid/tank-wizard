# 2026-08-14 — four owner decisions, recorded

Not a routine. Dan delivered four decisions directly and authorised the spec
edits. **Spec, backlog and decision record only — no application code, no test,
no chemistry constant was touched.** Branch
`claude/four-owner-decisions-spec-h2qm6v`, cut from `main` at `0b13829` (PR #41
merged).

Written under the same exception as the 14 August `§26` change: AGENTS.md #1
forbids an agent editing `docs/spec/*`, and the owner's explicit authorisation
is the only reason this run did.

---

## What was decided, and where it now lives

### 1. The rails are fixed — `reef-chemistry.md` §3

Closes needs-dan open item 8 as option (b). §3's `[user]` may **tighten** a rail
clause is withdrawn. One figure per element, the same for every user; no setting
either way.

- The contradiction it resolves: §3 and `wizard-states.md` §21 were both settled
  on 14 August and disagreed on whether a keeper may ask for a gentler daily
  limit. §21 wins on its own reasoning — Setup asks facts, not judgements, and
  it names a rate tolerance specifically as a non-fact.
- **Tighten-never-loosen is re-homed, not deleted:** it applies to §2's bands,
  which the user sets as tightly as they like inside safe bounds the app refuses
  to let them leave.
- Costs nobody anything today, and §3 now says why: **no mechanism ever
  existed.** `rateLimitDose` (`alkalinity.js:351-379`) reads settings only for
  plausibility; `safeDoseBand` (`safe-rate.js:43-48`) reads a hardcoded
  constant; `Setup.jsx` has no rate field.
- The revisit path is written into §3 rather than left implied: if 0.5 dKH/day
  proves too fast on a real tank, the rail changes there, for everyone, with the
  reasoning — per §21 a setting earns its place by solving a problem someone hit.

### 2 and 3. Two vocabularies, registered — `wizard-states.md` §22 (new)

Closes needs-dan open item 7 as option (a). The six consistency verdicts in
`reading-meaning.js` are **registered in canon**, not folded into §13's seven
and not removed. §13 answers *where is this reading*; §22 answers *how steady has
this been over the window*, which §13 has no words for. Six verdicts, seven
bands, nothing else.

Three sub-decisions inside §22:

- **`drifting` → `unsettled`.** Canon's `drifting` is inside the band sliding
  toward an edge; the verdict fired on the median outside the band with moderate
  spread (`reading-meaning.js:218`). Near-opposites, one word, two badges in one
  modal. No threshold or condition moves with the rename.
- **The alert tier.** `tone` is fixed per verdict (`:196-220`), so a lethal
  value and a mildly-off one both read `sliding` in the same colour. Every
  verdict now carries the tier of the **latest** reading's §13 band (§26 —
  position is the last reading), renders no calmer than it, and at the alert
  tier leads with the position. The verdict word is unchanged; tone and sentence
  order are not.
- **Unknown refuses.** `consistency` initialises to `"unknown"` (`:141`) and
  every branch testing it fails open, so an ungradeable parameter still reaches
  `controlled` or `unsettled` on the median test alone. Per §13's last row it
  must refuse and name what is missing. Latent, not live — all nine `PARAM_DEFS`
  keys have a `CONSISTENCY_RULES` entry today (`time-in-range.js:66-85`), and
  the record says so rather than claiming a user-visible repro.

### 4. One word for a notice, and two brand colours — `wizard-states.md` §15, §20

Closes two of the three one-line notes in needs-dan item 6.

- **`notice` is registered in §15** as the single term. Banned: "Worth knowing
  about" (`Dashboard.jsx:619-620`), "Hidden notes"/"Notes"
  (`Setup.jsx:478-491`), "notification". §20's confirmation sentence is restated
  as *"This is flagged as a serious notice. Are you sure you wish to hide it?"*
  and TW-031 now quotes the restated version.
- Recorded as **non-violations** so they are not re-filed: "Got it — hide this"
  (`DoseExpectation.jsx:175`, no noun); `finding`/`claim`/`dose state` as
  internal code names; and canon's own prose naming
  `journey-4-notifications.md` and its model.
- **§15 gains a colour registry.** The severity colours are reserved and
  unchanged. No parameter brand colour may be byte-identical to one. Two were:
  phosphate `#C4285B` (danger red), potassium `#926A09` (low amber).
  **New: phosphate `#9B3A8C`, potassium `#5F7A12`.**

---

## Colour arithmetic — the one thing this run computed

Candidates were measured, not eyeballed. sRGB → CIE L\*a\*b\* (D65) for
separation, WCAG 2.x relative luminance for contrast. Scripts:
`<scratchpad>/colour.mjs`, `<scratchpad>/pairs.mjs` — session scratch, not
committed; both are ~20 lines and are described well enough in §15 to
re-derive.

| | contrast vs `#F3F7F6` page | CIE76 from the severity colour it replaces |
|---|---|---|
| phosphate `#9B3A8C` | 5.76:1 | 37.9 from `#C4285B` |
| potassium `#5F7A12` | 4.54:1 | 32.7 from `#926A09` |

§18's floor is 4.5:1 for text and 3:1 for a chart stroke; both clear it, and
potassium's 4.54 is identical to the value it replaces. Palette-internal: the
tightest pair is unchanged at **16.4** (alkalinity/pH — not touched by this
decision), and calcium/potassium **improves from 29.3** to a wider gap. Nearest
neighbour to the new phosphate is magnesium `#7B4FCB` at 32.8, comfortably
above the palette's existing floor.

---

## Filed, not fixed

Everything code-side is untagged in `.agent/backlog.md`. Untagged means the
implementer may not act (AGENTS.md, backlog item format); these need
`[approved]` from Dan.

- **TW-037** — rescoped and **unblocked**. Now: implement §22 (rename, alert
  tier, unknown refuses), with the four tests it needs named. Its original
  finding text is kept verbatim underneath as the evidence.
  One clarification recorded in it: contradiction (2) of the original finding —
  "steady-off" in blue over a current reading that is in band — is **not** a bug
  under §22. The verdict grades the window and the badge grades the reading;
  §22 forbids only the verdict rendering *calmer* than the reading's band.
- **TW-039** — extended. The same test file carries a **second** stale block:
  `describe('§6 — a user may tighten a rail; the app must honour it')`
  (`rate-rails.test.js:74-94`) now asserts withdrawn canon. Per AGENTS.md #4 it
  is to be **inverted, not deleted** — the assertion §3 now supports is that no
  user value changes what the rail enforces, which makes it the regression test
  for decision 1.
- **TW-043** — the notice wording, three surfaces. Build the confirmation half
  with TW-031 or the string lands twice.
- **TW-044** — the two brand colours, plus the registry test that would have
  caught both.
- **TW-045** — the §22 checker. Nothing asserts §22 today, and per §10 a rule
  with no checker is an intention. Ordering matters: check (1) may land before
  TW-037; (2) and (3) assert behaviour TW-037 creates.

These three were filed as TW-042/043/044 and **renumbered when `main` was merged
in**. `main`'s run-state restructure (`a2ea1b4`) had already taken TW-042 for
"`.agent/backlog.md` is the next shared-singleton conflict, surviving on luck",
and git merged both sets of additions without noticing — two items under one id,
in the file whose singleton risk that item is about. Renumbering is the smaller
correction: `main`'s item is merged and referenced elsewhere; these three were
referenced only from this branch. Every cross-reference moved with them.

## Left open, deliberately

- **needs-dan item 9, new.** `PARAM_DEFS.alkalinity.color` `#0B7C86` is
  byte-identical to `STATUS_COLOR.ok`. Found while applying decision 4 and
  **not** named in it. Its harm is the mirror of phosphate's — an alarming chart
  that looks healthy rather than a healthy chart that looks alarming — which is
  arguably the worse direction, so extending the decision by analogy was not an
  agent's call. Three options written up. Two nearby cases listed with it:
  `nitrate` = the `controlled` verdict tone, `salinity` = the `steady-off` tone;
  both are verdict tones rather than `STATUS_COLOR` entries and sit outside the
  registry rule as §15 words it.
- **The four-way "target" rename** — parked by the owner pending a review of all
  four uses. Recorded in §22's "what this section does not do" and left open in
  needs-dan item 6.
- **The cost of decision 1**, stated in §3 rather than glossed: a keeper whose
  corals react badly to fast swings has no path through the app today, not even
  a manual one.

---

## Verification

**No behavioural claim is made by this run, so none is verified.** The tree's
only edits are Markdown:

```
$ git diff --stat main...HEAD -- . ':!*.md'
(empty)
```

`npm run verify` and `npx vitest run` are unchanged by construction — no source
file, test file or constant moved. The one test this decision makes stale
(`rate-rails.test.js`'s tighten block) still fails exactly as it did before the
run, now for the opposite reason, and is filed as TW-039 rather than edited.

Cross-reference integrity was checked by grep rather than by reading: every
`tighten`, `notification`, `Notes` and `drifting` occurrence remaining in
`docs/spec/` was re-read and is either a band-word use (correct), a verbatim
owner quotation (kept, and §20 says why), or a document/file name (recorded as a
non-violation).

## Merged up, after the fact

`main` moved while this branch was open: the run-state restructure landed
(`a2ea1b4`, PR #42), deleting `.agent/run-state.md` in favour of one file per
run under `.agent/runs/`. `origin/main` (`e3b9658`) merged in. One conflict, and
it was the expected one — this branch had written to the shared file that main
deleted. Resolved per the new convention: the file is gone, and this run's
record is now `.agent/runs/2026-08-14-four-owner-decisions.md`, content carried
across unchanged apart from the merge notes. No other run's file was touched.

The merge also surfaced the silent half: git combined both branches' backlog
additions cleanly and produced **two TW-042s**, because both sides appended to
one shared file. Renumbered here, not on main — see "Filed, not fixed" above.
Worth noting that main's TW-042 is the item warning that `.agent/backlog.md` is
the next shared-singleton conflict; this merge is a small instance of exactly
that, and it argues for the item rather than against it.

## In plain terms

Four decisions, all writing. Nothing in the app behaves differently today.

The app is not going to grow a knob for how fast it may move your tank — one
speed limit per parameter, the same for everyone. The knob had been promised in
writing months ago and never actually built, so nothing you have goes away. The
"tighten it, never loosen it" idea still applies to your target ranges, which is
where it belongs. If half a dKH a day turns out to be too fast for your corals,
that is a real report and the number changes for everybody.

The app has two sets of words about a parameter and now admits it: one for where
your reading is right now, one for how steady it has been over the last few
weeks. The second set had never been written down. One of its words, "drifting",
meant nearly the opposite of the same word on the badge beside it — that one is
now "unsettled". Two rules were missing and are now written: however steady
something has been, if your last test is at a level that needs attention the app
may not show it in a calm colour; and where the app has no yardstick for what
steady means, it says so instead of grading you against nothing.

The thing the app shows you about a parameter is a **notice** — one word, not
four. And your phosphate chart is no longer drawn in the exact red the app uses
for danger, nor potassium in the exact amber it uses for low, so a perfectly
healthy phosphate stops looking like an alarm. The danger colours themselves
have not moved.

One thing found and left for you: your alkalinity chart is drawn in exactly the
colour the app uses to say "in range", so it looks that way even when your
alkalinity is not. That is the same fault pointing the other way, you did not
mention it, and guessing which way you would go on it is what the needs-dan file
is for.
