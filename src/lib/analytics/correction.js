/* --- Correction calculator ---
   Compound factors convert the target ion mass into the mass of the salt
   that actually carries it. Daily limits keep corrections gentle enough
   that the change itself doesn't stress corals. */
export const CORRECTIONS = {
  alkalinity: {
    label: "Alkalinity", unit: "dKH", maxPerDay: 0.5,
    products: [
      { name: "Sodium bicarbonate (baking soda)", gPerUnitPer100L: 3.0, note: "pH-neutral; the safer default" },
      { name: "Soda ash (sodium carbonate)", gPerUnitPer100L: 1.9, note: "raises pH too — use when pH runs low" },
    ],
  },
  calcium: {
    /* Published guidance puts the safe daily rise under about 20 ppm; larger
       corrections get spread across several days. */
    label: "Calcium", unit: "ppm", maxPerDay: 20,
    products: [{ name: "Calcium chloride dihydrate", gPerUnitPer100L: 0.367, note: "per 1 ppm Ca per 100L" }],
  },
  magnesium: {
    label: "Magnesium", unit: "ppm", maxPerDay: 100,
    products: [
      { name: "Magnesium chloride hexahydrate", gPerUnitPer100L: 0.836, note: "use roughly 3:1 with sulphate" },
      { name: "Magnesium sulphate heptahydrate", gPerUnitPer100L: 1.01, note: "the sulphate share of a mixed dose" },
    ],
  },
  potassium: {
    label: "Potassium", unit: "ppm", maxPerDay: 10,
    products: [{ name: "Potassium chloride", gPerUnitPer100L: 0.191, note: "per 1 ppm K per 100L" }],
  },
  nitrate: {
    label: "Nitrate", unit: "ppm", maxPerDay: 2,
    products: [{ name: "Sodium nitrate", gPerUnitPer100L: 0.137, note: "per 1 ppm NO3 per 100L" }],
  },
  phosphate: {
    label: "Phosphate", unit: "ppm", maxPerDay: 0.03,
    products: [{ name: "Potassium dihydrogen phosphate", gPerUnitPer100L: 0.143, note: "make a stock solution — raw amounts are tiny" }],
  },
};

/* Hobby scales read to about 0.1 g, so anything smaller is meaningless as a
   weight. Below that, milligrams are at least honest about the scale of the
   thing, and the UI advises a stock solution instead of weighing it. */
export function fmtDoseMass(g) {
  if (g == null || isNaN(g)) return "\u2014";
  if (g >= 1) return g.toFixed(1) + " g";
  if (g >= 0.1) return g.toFixed(2) + " g";
  return Math.round(g * 1000) + " mg";
}

export function computeCorrection(paramKey, current, target, volumeL) {
  const c = CORRECTIONS[paramKey];
  if (!c || current == null || target == null || isNaN(current) || isNaN(target)) return null;
  /* Doses scale straight off the volume, so without it there is no correction
     to quote — a missing volume must not quietly become a zero-gram answer. */
  if (!(volumeL > 0)) return null;
  const delta = target - current;
  if (Math.abs(delta) < 1e-9) return null;
  const volFactor = volumeL / 100;
  const days = Math.max(1, Math.ceil(Math.abs(delta) / c.maxPerDay));
  const products = delta > 0
    ? c.products.map((p) => ({
        ...p,
        totalG: Math.abs(delta) * p.gPerUnitPer100L * volFactor,
        perDayG: (Math.abs(delta) / days) * p.gPerUnitPer100L * volFactor,
      }))
    : [];
  const tiny = products.length > 0 && products.every((p) => p.perDayG < 0.1);
  return { delta, days, products, unit: c.unit, maxPerDay: c.maxPerDay, raising: delta > 0, tiny };
}
