/* --- 2. Calcium carbonate deposited ---
 *
 * Alkalinity consumption converts directly to mass of CaCO3:
 *   dKH -> meq/L  (1 dKH = 1/2.8 meq/L)
 *   x volume     -> meq/day
 *   / 2          -> mmol/day  (carbonate carries two charges)
 *   x 100.087    -> mg/day
 *
 * Scope matters: this is ALL calcium carbonate laid down, which includes
 * coralline algae, calcifying inverts, and abiotic precipitation on heaters
 * and pumps — not coral growth alone. Partial nitrogen cycling and magnesium
 * incorporation also consume a little alkalinity, so the figure is a slight
 * overstatement. Published guidance holds these are much less important than
 * calcification, so it remains a fair proxy provided it is labelled honestly.
 */
export const CACO3_MOLAR_MASS = 100.087;   // g/mol
export const ARAGONITE_DENSITY = 2.93;     // g/cm3

export function computeSkeletonMass(alkConsumedPerDay, volumeL) {
  if (!alkConsumedPerDay || alkConsumedPerDay <= 0 || !volumeL) return null;
  const meqPerDay = alkConsumedPerDay * (1 / 2.8) * volumeL;
  const mmolPerDay = meqPerDay / 2;
  const gPerDay = (mmolPerDay * CACO3_MOLAR_MASS) / 1000;
  return {
    gPerDay, gPerWeek: gPerDay * 7, gPerMonth: gPerDay * 30.44,
    kgPerYear: (gPerDay * 365) / 1000,
    cm3PerMonth: (gPerDay * 30.44) / ARAGONITE_DENSITY,
    meqPerDay, mmolPerDay,
  };
}
