/* --- Safe rate of change ---
 *
 * Every correction so far has been capped in millilitres — a percentage of the
 * calculated change, staged over days. That protects against a wrong estimate
 * but says nothing about what the tank actually experiences. On a small volume
 * a modest millilitre change is a large daily swing, and the swing is what
 * harms corals: tissue recession follows rapid movement even when it is
 * heading toward a better number.
 *
 * The hobby consensus is a hard ceiling near 1.4 dKH a day with most keepers
 * staying under 0.5, so 0.5 is used as the working limit and the tighter of
 * the two constraints wins. Calcium and magnesium are scaled from it through
 * the stoichiometry of calcification, which is what ties them together.
 */
/* How fast a level may move without harming corals. There is one such limit
   per element and it had been written twice: SAFE_DAILY_RISE said calcium 3.5
   ppm a day while CORRECTION_MAX_RATE said 15, a four-fold disagreement about
   the same piece of physics, introduced when the correction planner was added
   and never reconciled. The 3.5 figure also had no source — it made a gentle
   calcium correction take 86 days, which nobody would follow.

   Sourced: alkalinity no more than 1.0 dKH a day and most keepers stay at 0.5;
   BRS caps calcium at 50 ppm a day and reefcalcs calls 20 the safe rate;
   magnesium is widely given as 25 ppm a day, with suppliers going to 50. The
   conservative end of each is the default, because overshooting is the failure
   mode these limits exist to prevent. */
export const CORRECTION_MAX_RATE = { alkalinity: 0.5, calcium: 20, magnesium: 25 };

/* The same limit, kept as its own name because the code reads better where it
   is used. Derived rather than retyped, so the two can no longer disagree. */
export const SAFE_DAILY_RISE = { ...CORRECTION_MAX_RATE };

/* The safe band around the maintenance dose.
 *
 * The anchor has to be the maintenance dose — the dose that holds the level
 * exactly steady — because any surplus or shortfall against it is what moves
 * the tank. Anchoring on measured consumption instead was wrong: consumption
 * is derived as supplied minus trend, so a tank merely drifting upward reports
 * a small or negative consumption, the ceiling collapsed toward zero, the dose
 * was clamped down, alkalinity then fell, and the next assessment swung it back.
 * In simulation that oscillation spiked 105 tanks and crashed 29.
 */
export function safeDoseBand(element, maintenanceDose, effectPerMl) {
  const limit = SAFE_DAILY_RISE[element];
  if (!limit || !isFinite(maintenanceDose) || !isFinite(effectPerMl) || effectPerMl <= 0) return null;
  const swing = limit / effectPerMl;
  return { lo: Math.max(0, maintenanceDose - swing), hi: maintenanceDose + swing, limit };
}
