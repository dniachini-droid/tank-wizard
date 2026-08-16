# 2026-08-16 — the target rename, per the owner's sign-off

Owner decision received in-session, closing `.agent/needs-dan.md` item 6 and
signing off `.agent/target-terminology-audit.md`'s recommended option. Two
parts, done in order.

## 1. The prior question, settled first — no target point

`reef-chemistry.md` §2 said "the user sets a target and a band width". The
user sets a **minimum and a maximum** — one range, two edges, no target
point inside it. A point inside the band was **considered and rejected**: a
range within a range is more to configure and more to explain, for a
distinction the trend already makes. §2 corrected; §18's alert thresholds
re-anchored on the **midpoint** (derived, never stored) — which is what
`positionBand` (`reading-meaning.js`) always did, so no behaviour moved.

`band-edges.test.js`'s deliberately-failing structural-gap block (4 tests)
pinned the old canon's target±band model against the shipped defs. The gap
is now closed by decision, so the block pins the settlement instead and
passes: alkalinity 8.2–8.8 and calcium 400–450 match §2; magnesium ships
1250–1400 against §2's 1275–1425, pinned as-shipped and cited to **TW-052**,
which stays open and owns that call.

## 2. The rename

Per the audit's recommended option (§10), exclusions per §11 and the
owner's instruction:

- **target range** — the band, always both words; bare "target" banned.
- **aim point** — the level a correction heads for (Setup's calculator
  field and helper text renamed; `computeCorrection`'s param,
  `proposeCorrection`'s offer field, and the `state.js` locals renamed;
  "Target reached" → "Aim point reached"; ReadingConfirmation's "passed
  your target" → "passed your aim point").
- **in range / out of range** — every rendered "in target"/"on target"/
  "off target", including `state.js:318`'s "Steady, off target" →
  "Steady, out of range" and ~28 narrative-engine sentences.
- **planned dose** — registered in §15; the `doseStatus.target` mL/day
  branches keep the field name until TW-035.
- `targetCorrection` → `correction` (45 refs, engines + ErrorBoundary +
  tests). `targetMin`/`targetMax` props → `targetRangeMin`/`targetRangeMax`;
  the assessment's band object `out.target` → `out.targetRange`;
  `holdAtTarget` → `holdAtMax` (it always held litres at `def.max`).

**Left alone, deliberately:** the `off-target` state id and its readers;
`plan.target` / `cp.target` / `planTarget` / `doseStatus.target` /
`meta.target` (persisted or TW-035-gated fields); DOM `e.target`; the
lucide `Target` icon; "touch targets"; Triton's published values
(`IcpPanel`, `findings.js:719`, `icp-reference.js`); `.brief-target-note`;
`.agent/` working notes and journey records.

Both spec files' "A target is a point, not a zone" → "The aim point is a
point, not a zone" — same settlement, nearest-edge question not reopened.

## Verification

- Full vitest: 54 failures, all pre-existing deliberate spec-violation pins
  (baseline on main was 58; the 4 removed are band-edges' converted gap
  pins; diffed by test identity against a clean worktree of main).
- `restore-asks-about-targets` updated to the renamed restore copy (5/5).
- `npm run verify`: all blocking checks pass — wordingcheck,
  consistencycheck, textcheck, and **golden unchanged** (the renamed
  strings sit outside the fingerprinted fields; 0 rows moved).
- Advisory deadcode/csscheck findings are TW-022/TW-023, unchanged.

TW-035 marked **approved** with the owner's do-it-alone instruction on the
item. TW-052 untouched.
