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

/* The Ca:alk consumption ratio — reef-chemistry.md §16, one value for every
 * user, and §20's calcification coupling rests on it. Changing it without an
 * [approved][chem] item is an S1 defect.
 *
 * Stoichiometric, and written out so it can be checked rather than trusted:
 * calcification deposits CaCO3, so each mole of carbonate laid down takes one
 * mole of calcium with it. 1 meq/L of alkalinity is 0.5 mmol/L of carbonate
 * (two charges), which pairs with 0.5 mmol/L of calcium = 20.04 ppm. At
 * 1 meq/L = 2.8 dKH that is 20.04 / 2.8 = 7.157, i.e. 7.15 ppm Ca per dKH.
 *
 * It lives here, exported, because it had five values in the codebase and none
 * of them was this one (.agent/inventory.md:354). Every surface that needs the
 * ratio — the shipped product strengths, the balanced-consumption band, the
 * implied-alkalinity prose — derives from this constant so they cannot drift
 * apart again. Owner decision, 16 August.
 */
export const CA_PER_DKH = 7.15;

export function computeSkeletonMass(alkConsumedPerDay, volumeL) {
  /* spec: reef-chemistry.md §17, §12 — net volume is the input every dose
     and derived-mass figure here scales by, so its absence is refused and
     named rather than folded into the same bare null the zero/negative-
     consumption branch below returns. A caller cannot otherwise tell "the
     tank isn't calcifying" from "we don't know how big the tank is". */
  if (!(volumeL > 0)) return { status: "novolume", missing: "net volume" };
  if (!alkConsumedPerDay || alkConsumedPerDay <= 0) return null;
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
