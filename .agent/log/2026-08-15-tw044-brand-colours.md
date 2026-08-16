# Run log — TW-044 (phosphate/potassium brand colours off the severity register)

run: 2026-08-15-tw044-brand-colours
item: TW-044 [approved]
branch: claude/four-backlog-items-o18y6d-tw044

## What happened

Exactly two string literals moved, both in `src/lib/constants.js`:
phosphate `#C4285B` → `#9B3A8C` (plum), potassium `#926A09` → `#5F7A12`
(olive). The severity colours (`STATUS_COLOR`, dates.js:31) did not move.

Hardcoded-copy sweep, per the item: grepped `#C4285B`/`#926A09`
case-insensitively across src/ (js, jsx, css, html, tailwind config,
public/). Every hit outside constants.js is a severity/tone usage — act/
emergency/danger tones, STATUS_COLOR.low/high themselves, rate-grade
"poor" colouring, ICP contaminant styling, the amber lighting-section
tone — none is a phosphate/potassium brand copy. constants.js was the
only brand site. legacy/ untouched (rule 9).

Figures re-derived rather than trusted (scratchpad colour-derive.mjs):
- contrast vs #F3F7F6 page: phosphate 5.76:1, potassium 4.54:1
  (§18 floor 4.5:1 text, 3:1 chart stroke) — matches canon exactly
- CIE76 from the severity colour each replaces: 37.9 and 32.7 — matches
- palette's tightest pair unchanged at 16.4 (alkalinity/pH)
- calcium/potassium improves 29.3 → 61.6
- no new brand colour sits within ΔE 20 of any severity colour

Registry test: `src/test/spec/terminology/colour-registry.test.js` — no
PARAM_DEFS colour equals any STATUS_COLOR value, with the **named
alkalinity exception** (#0B7C86 == ok) citing the 2026-08-15 TW-046
decided-against decision, exactly as the item requires — a blanket test
would fail on alkalinity by design. Proven red first (4 failed: both
collisions + both replacement values), 13/13 after.

## Evidence

- Before: `npx vitest run src/test/spec/terminology/colour-registry.test.js`
  → 4 failed | 9 passed.
- After: 13 passed. Full suite 64 failed | 487 passed — the 64 are the
  pre-existing labelled reds, count unchanged from baseline.
- `npm run verify` → ALL BLOCKING CHECKS PASSED.

## In plain terms

The phosphate chart was drawn in the exact red the app uses for danger, so
a perfect phosphate reading still looked like an alarm; potassium was drawn
in the exact amber that means low. Both now have their own colours — a plum
and an olive — checked for legibility and for not resembling any warning
colour. The warning colours themselves haven't moved, and alkalinity's teal
deliberately stays as it is (decided 15 Aug).
