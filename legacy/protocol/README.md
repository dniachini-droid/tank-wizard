# Dosing protocol — prototype

The dosing engine developed and tested outside the app before integration.
Kept here so the work is preserved and re-runnable.

## The engines
- `proto.js`   — the assessment: adaptive settling window sized from kit
                 precision, bracketing, step caps, safe-rate ceilings
- `decide.js`  — alkalinity decisions: 14 states, cross-talk with corrections,
                 claim properties (rank, dismiss key, destination)
- `camg.js`    — calcium and magnesium, managed on their own terms: level
                 first, weekly/monthly cadence, no daily-rate chasing
- `panel.js`   — the dynamic Dosing Wizard panel, 12 row types

## The harnesses
- `rng.js`     — mulberry32. The LCG this replaced returned 299,999 of one
                 element and 1 of another when picking from three, which
                 quietly narrowed every sweep that used it.
- `integrated.js`, `normal.js`, `walk.js`, `final.js` — tank simulations
- `regress.js` — 14 properties established during development
- `deadend.js`, `count.js` — coverage and message-count sweeps

## Key findings, so they are not rediscovered
1. Anything the keeper does to the water — corrections, water changes — must be
   logged and subtracted, or the engine reads it as the tank's consumption
   changing and chases a signal the user created. Worth 66 points of error.
2. Current direction always beats stored history. A bracket from 14 mL was
   cutting the dose while alkalinity actively fell at 25 mL.
3. Magnesium's dose cannot be measured from tank readings — a 15% error takes
   1,347 days to clear kit noise. Manage the level, not the rate.
4. Well-formed text can still be false. Checking claims against ground truth
   found 4,400 that read perfectly and were wrong.
