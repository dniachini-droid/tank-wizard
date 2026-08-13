/* Regression test for adjudicated.md item #10 (static-analyst/S2, confirmed
 * S2, deliberately left UNFIXED tonight — the fixer plan (2026-08-13-build-1
 * log, wave 3) explicitly deferred this as too architecturally risky for a
 * same-night patch: "touches dose-recommendation logic in all three
 * chemistry engines; real bug but not small/unambiguous — needs a full
 * implementer + domain-verifier round."
 *
 * THIS TEST IS EXPECTED TO FAIL until that full round lands. It exists so
 * the mismatch cannot be silently reintroduced-and-ignored, or quietly
 * "fixed" by accident without anyone noticing the UI contract it repairs —
 * per AGENTS.md, a regression test must exist for every confirmed-but-
 * unfixed finding, not only for tonight's fixes.
 *
 * Bug: `rateLimitDose` runs BEFORE `applyDoseConstraints` in all three dosing
 * engines (alkalinity.js:852/858, calcium.js:574/580, helpers.js:942/948 —
 * same pattern, byte-identical order). `rateLimitDose` sets `out.rateLimited`
 * (what ErrorBoundary.jsx:158-165 renders verbatim as the "Held to X mL/day"
 * banner) from the figure BEFORE bracketing/step-cap/trailing-band-recheck.
 * `applyDoseConstraints` can then shrink the dose further (bracketing, the
 * quarter-of-current-dose step cap, or its own trailing safeDoseBand
 * re-check) WITHOUT touching `out.rateLimited`. `out.recommendedDose` (what
 * DoseChangeSheet, ErrorBoundary.jsx:249-251, actually prefills) is set from
 * the POST-constraints value — so the banner and the prefilled amount can be
 * two different numbers for the same assessment, and nothing on screen
 * explains why (`out.stepCapped` is set but never read outside the engine
 * file, confirmed via grep in adjudicated.md item #10).
 *
 * This calls the real, unmodified exported `rateLimitDose` and
 * `applyDoseConstraints` from alkalinity.js in the same production order the
 * engine itself uses (alkalinity.js:852-861), with inputs chosen to trigger
 * both a rate-limit clamp (large `applied` relative to the safe daily rise)
 * and a step-cap clamp (a low `currentDose` relative to the rate-limited
 * figure, which the quarter-of-current-dose cap in applyDoseConstraints then
 * shrinks further) — the same two-stage clamp static-analyst/adjudicator
 * demonstrated.
 */
import { describe, expect, it } from 'vitest'
import { applyDoseConstraints, rateLimitDose } from '../../../lib/dosing/alkalinity.js'

describe('rateLimitDose vs applyDoseConstraints ordering — banner vs recommendedDose (adjudicated #10, confirmed-but-unfixed)', () => {
  it('BUG: out.rateLimited.allowed ("Held to X mL/day" banner) disagrees with out.recommendedDose (what DoseChangeSheet actually prefills)', () => {
    const def = { key: 'alkalinity', unit: ' dKH' };
    const settings = { volumeL: 200 };
    // A tank running a low current dose (4 mL/day) with a much higher
    // maintenance dose (50 mL/day) and a very large wanted increase —
    // realistic for a tank that has drifted a long way from where it's
    // dosed and is being recalculated from scratch.
    const out = {
      currentDose: 4,
      maintenanceDose: 50,
      effectPerMl: 0.05,
      current: { value: 8 },
      trendPerDay: 0,
    };
    const applied = 60; // wants to go from 4 to 64 mL/day

    // Step 1 (production order, alkalinity.js:852): the rate ceiling runs
    // first and sets out.rateLimited — this is the number ErrorBoundary.jsx
    // renders verbatim as "Held to X mL/day".
    const limited = rateLimitDose(applied, out, def, settings, out.effectPerMl);
    expect(limited.stop).toBe(false);
    expect(out.rateLimited).toBeTruthy();
    const bannerAllowed = out.rateLimited.allowed;
    // Pinned control value: the rate ceiling (SAFE_DAILY_RISE.alkalinity =
    // 0.5 dKH/day, effectPerMl 0.05) clamps 64 mL/day down to the band's
    // 60 mL/day edge. This is what "Held to 60 mL/day" would show.
    expect(bannerAllowed).toBe(60);

    // Step 2 (production order, alkalinity.js:858): bracketing / step cap /
    // trailing band re-check run AFTER, and can shrink the dose further
    // without ever touching out.rateLimited.
    const finalNext = applyDoseConstraints(limited.next, out, def, settings, [], []);
    out.recommendedDose = finalNext;
    // Pinned control value: the quarter-of-current-dose step cap (currentDose
    // 4 mL/day) pulls 60 down toward 5, then the trailing safeDoseBand
    // re-check pulls it back up only as far as the band's own 40 mL/day
    // floor — a different number from the 60 the banner already showed.
    expect(out.recommendedDose).toBe(40);

    // What the finding claims: the two numbers disagree, and nothing in
    // `out` explains it to the person reading the banner (`out.stepCapped`,
    // the only trace of the second clamp, is never read outside the engine
    // file). This assertion documents the bug — it is EXPECTED TO FAIL
    // (the values are expected to differ, 60 !== 40) until a full
    // implementer/domain-verifier round reconciles the ordering, per the
    // fixer's explicit deferral tonight.
    expect(bannerAllowed).toBe(out.recommendedDose);
  });
});
