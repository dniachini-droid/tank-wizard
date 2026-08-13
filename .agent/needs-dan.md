# Needs Dan

Decisions no agent may make. Newest at top. Dan clears this file.

---

## 2026-08-13 — consistency sweep (run 2026-08-13-consistency-sweep)

### 1. The two canon spec files disagree with each other on volume terminology

`docs/spec/surfaces-and-messaging.md:132` (terminology registry) says the
approved term is **"water volume"** and explicitly bans "tank size, volume,
capacity" as synonyms.

`docs/spec/reef-chemistry.md` uses **"net water volume"/"net volume"**
consistently, 6+ times (lines 45, 48, 51, 186, 204, 228-229), including in
the canonical refusal-message wording for worked example 2 ("refuses; names
net volume as the missing input").

This is not a case of the spec being silent — it's the two canon documents
naming the same concept differently. Per AGENTS.md, agents never edit
`docs/spec/*`, and this can't be resolved by an agent's judgement (the
escalation rule: "the spec is silent, ambiguous, or self-contradictory").
The app itself is inconsistent too (terminology-auditor found "tank volume"
/ "net volume" / "water volume" all in use, sometimes both in one message —
`src/lib/findings.js:362-363`), but the app can't be made consistent until
the spec is. Please pick one term and update the losing spec file (or tell
us which file wins so we don't have to re-raise this every run).

Found independently by: terminology-auditor, confirmed by adjudicator.

### 2. Magnesium/calcium dose-rate constants: two in-app tables disagree with each other AND the live engine disagrees with reef-chemistry.md canon

`src/lib/analytics/correction.js`'s `CORRECTIONS.magnesium.maxPerDay` (100)
and `src/lib/analytics/safe-rate.js`'s `SAFE_DAILY_RISE.magnesium` (25)
disagree 4x. Checked both against `docs/spec/reef-chemistry.md:154-160`
canon table directly:

```
| Rail | Default per 24 h |
| Alkalinity | 0.5 dKH |
| Calcium | 25 ppm |
| Magnesium | 100 ppm |
```

`correction.js`'s magnesium value (100) **matches canon exactly**.
`safe-rate.js`'s value (25) is the one that's wrong. `safe-rate.js`'s
`SAFE_DAILY_RISE`/`rateLimitDose` is what the live Dosing Wizard actually
calls on every dosing path (`src/lib/dosing/helpers.js:1,407`,
`src/lib/dosing/state.js:1,194,261,365`) — so **the wizard is currently
running magnesium corrections 4x too conservative relative to spec**, not
the other way around. (Calcium is a separate, smaller issue: both tables
agree with each other at 20 ppm/day but both undercut canon's 25 — no
cross-surface contradiction there, just a uniform constant drift.)

`safe-rate.js`'s own code comment (lines 22-26) cites independent real-world
sourcing (BRS caps calcium at 50, reefcalcs calls 20 "safe", magnesium
"widely given as 25 ppm/day") that was chosen deliberately and conflicts
with `reef-chemistry.md`'s canon table. This may mean the code author
disagreed with the canon table on purpose, in which case the spec itself
may need revisiting rather than the code — that's a judgement call on a
chemistry-safety rail we won't make ourselves (AGENTS.md rule 3: never
change chemistry constants without an authorising, spec-matching backlog
item; escalation rule: "a fix requires changing a chemistry constant").

Two Wave A/B findings (manual-dose-auditor, dose-parity-checker) originally
reported this with the fix direction backwards (claiming both figures
"disagree with canon in different directions" and suggesting deleting
`correction.js`'s table) — the adjudicator corrected this: `correction.js`
is the one that's right for magnesium. Please resolve which of
`safe-rate.js` / canon / real-world sourcing should actually govern before
anyone touches this rail — it directly controls how much magnesium gets
dosed into a live tank.

Found by: manual-dose-auditor, dose-parity-checker; direction corrected by
adjudicator via direct file read + `tests/parity/correction-calculator-vs-
rail.test.js`.

