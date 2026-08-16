run: 2026-08-16-phosphate-nitrate-canon
routine: owner decision — needs-dan item 10, all nine phosphate/nitrate decisions
started: 2026-08-16
status: complete
last completed step: §29 written, item 10 closed, TW-054..060 filed, read-site comment landed, all gates green
next step: none from this run. Dan's two remaining lines (nitrate's reading count, the phosphate count's same-side question) unblock TW-057 and TW-058; TW-054..060 need `[approved]` before any of it ships.
in-flight: nothing
branch: claude/reef-chemistry-spec-aqe29s (harness-designated)
uncommitted work: no

## What Dan authorised

Dan, 16 Aug, closing `.agent/needs-dan.md` item 10 — all nine decisions — and
authorising the spec edit in as many words. Scope, in his order:

1. Bands: phosphate 0.03–0.10, nitrate 5–15. Freely editable, legitimate range
   wider than the dosed elements — 0.40 phosphate and 40 nitrate are legitimate.
2. Out at any amount past the edge; clearly out at 0.10 ppm phosphate,
   10 ppm nitrate.
3. Two fixed warnings, band-independent: phosphate below 0.03, nitrate above 50.
   `SAFE_BOUNDS`' phosphate 0.01 is a target floor and says nothing extra at a
   reading. Restores the suspended husbandry expectation.
4. Phosphate: count only (three of the last four outside band). Nitrate: count
   and trend, trend at the dosed elements' evidence bar.
5. No dose, no correction, no levers for either.
6. Windows ratified: phosphate 14 days, nitrate 28.
7. `correctionProgress`'s noise-floor unit mismatch closed as unreachable by
   design; comment at the read site.

**Spec edit authorised, code work is not** — the implementation is filed
untagged, per AGENTS.md rule on `[approved]`. The one exception Dan named
explicitly is the comment at the `correctionProgress` read site, which is a
comment and no behaviour.

## Steps

1. [x] `docs/spec/reef-chemistry.md` §29 written — eight subsections,
       enforcement, plain-language layer. No new figure except the two
       clearly-out margins Dan named; the other eight are promoted from code
       comment to canon with their existing sourcing.
2. [x] `.agent/needs-dan.md` item 10 struck with a question-to-subsection
       mapping, decision recorded at the top of Decisions, the 15 Aug §27 entry
       demoted from "(latest)" and not rewritten.
3. [x] implementation filed untagged: **TW-054** bands and the wide legitimate
       range · **TW-055** the two clearly-out margins · **TW-056** the two fixed
       warnings and the restored husbandry check · **TW-057** the count
       mechanism · **TW-058** phosphate loses direction language, nitrate keeps
       a trend · **TW-059** the refusals and windows pinned · **TW-060** three
       stale canon cross-references, owner Dan. TW-029 carries a progress line
       and stays open.
4. [x] comment at `src/lib/dosing/helpers.js` `correctionProgress` — latent
       becomes closed-by-design, cites §29.8, names what would reopen it.
5. [x] `npm ci` (node_modules absent in this container) · `npm run verify` —
       **ALL BLOCKING CHECKS PASSED** · golden **5940 cases unchanged
       (3a782222dbce41c5)** · `npx vitest run` — 59 failed / 535 passed,
       compared by name against the clean tree: **0 new, 0 fixed**.
6. [x] log written — `.agent/log/2026-08-16-phosphate-nitrate-canon.md`
7. [x] commit, push
8. [ ] **PR not opened by this run.** The session harness forbids opening one
       without an explicit request, which is narrower than AGENTS.md #13.
       Flagged to Dan in the same breath as the push rather than left silent —
       a branch with no PR is unfinished work and this run knows it.

## Two residues, not invented away

Named in §29.5 and carried on the items that need them; neither blocks anything
else.

- **Nitrate's trend evidence bar.** *"three readings, one direction, clearing
  the noise floor"* against *"the same evidence bar as the dosed elements"* —
  and that bar is `directional()`: four readings, three steps, two thirds
  agreeing. Three readings is two steps. TW-058, half two only.
- **Whether the phosphate count needs the same side.** *"Three of the last four
  readings outside the band"* — either side literally, one side by its stated
  purpose. Two above and one below is the separating case. TW-057.

## Full account

`.agent/log/2026-08-16-phosphate-nitrate-canon.md`.
