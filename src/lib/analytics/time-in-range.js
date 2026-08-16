/* --- 5. Time in range --- */

/* --- Operating band & control quality ---
   Time in range alone conflates two different things: a tank that swings
   wildly, and a tank that sits rock-steady somewhere the target range does not
   cover. Consistency is measured against the tank's own distribution, so it
   is independent of where the target range happens to sit. */

export function percentile(sortedVals, p) {
  if (!sortedVals.length) return null;
  const idx = Math.min(sortedVals.length - 1, Math.max(0, Math.round((p / 100) * (sortedVals.length - 1))));
  return sortedVals[idx];
}

export const ROUND_STEP = {
  alkalinity: 0.1, calcium: 5, magnesium: 10, potassium: 10,
  phosphate: 0.01, nitrate: 0.5, salinity: 0.1, ph: 0.05, ammonia: 0.01,
};

/* Format a value at the precision that parameter is actually measured to,
   so pH shows 8.10 rather than 8 and calcium shows 450 rather than 450.00. */
export function fmtVal(def, v) {
  if (v == null || isNaN(v)) return "—";
  const step = ROUND_STEP[def.key] || def.step || 0.1;
  const decimals = (String(step).split(".")[1] || "").length;
  return v.toFixed(decimals);
}

/* Amounts and rates need different precision from readings. A magnesium
   reading is sensibly shown to the nearest 10 ppm, but a dose of
   0.031 ppm/day rounded that way reads as zero. Scale the decimals to the
   size of the number instead. */
/* Split out from fmtAmount so that anything needing to COMPARE two amounts at
   the precision they are shown to reads the same table the display does. They
   were one function, and the dosing engines compared raw values instead \u2014
   which is how a dose of 10.799999999999999 came to be an "increase" on 10.8
   (TW-050). */
export function amountDecimals(v) {
  const a = Math.abs(v);
  if (a >= 100) return 0;
  if (a >= 10) return 1;
  if (a >= 1) return 2;
  if (a >= 0.01) return 3;
  return 4;
}

export function fmtAmount(v) {
  if (v == null || isNaN(v)) return "\u2014";
  if (v === 0) return "0";
  return v.toFixed(amountDecimals(v));
}

export function roundTo(v, step) {
  const decimals = (String(step).split(".")[1] || "").length;
  return parseFloat((Math.round(v / step) * step).toFixed(decimals));
}

/* --- Per-parameter consistency rules, from published reef guidance ---
 *
 * Measured on the p05-p95 spread of readings in the window.
 *
 * Macro elements use ABSOLUTE spreads, because corals respond to the size of
 * the change: alkalinity within ~0.2 dKH/day is the figure associated with
 * strong long-term SPS outcomes, ~0.5 dKH is widely called acceptable, and
 * 1.0+ dKH swings are the ones linked to tissue loss. Calcium and magnesium
 * follow the safe-correction rates commonly quoted (~20 ppm/day Ca,
 * 50-100 ppm/day Mg). Salinity matters because even fluctuation inside the
 * optimal range is documented to stress corals.
 *
 * Nutrients use FOLD change (p95/p05) instead, because they operate at very
 * low concentrations where absolute spread is meaningless: the difference
 * between 0.01 and 0.15 ppm phosphate is a 15x swing, not "0.14 ppm". Reef
 * guidance treats a steady 0.08 as far healthier than that range.
 */
export const CONSISTENCY_RULES = {
  alkalinity: { mode: "absolute", tight: 0.5,  moderate: 1.0,  unit: "dKH",
                why: "0.2 dKH/day is the tightest control band; beyond about 1 dKH of movement you are into the range linked with tissue loss" },
  calcium:    { mode: "absolute", tight: 30,   moderate: 60,   unit: "ppm",
                why: "20 ppm/day is the accepted safe rate of change for calcium" },
  magnesium:  { mode: "absolute", tight: 50,   moderate: 100,  unit: "ppm",
                why: "magnesium moves slowly; 50-100 ppm/day is the safe correction ceiling" },
  potassium:  { mode: "absolute", tight: 45,   moderate: 70,   unit: "ppm",
                why: "potassium moves slowly and hobby kits only resolve to about 20 ppm, so anywhere in the 380-420 range is comfortable" },
  salinity:   { mode: "absolute", tight: 0.5,  moderate: 1.0,  unit: "ppt",
                why: "fluctuation even inside the optimal range is documented to stress corals" },
  ph:         { mode: "absolute", tight: 0.2,  moderate: 0.4,  unit: "",
                why: "a daily swing of 0.2-0.3 is normal; more than that usually points at CO2 or alkalinity instability" },
  phosphate:  { mode: "fold",     tight: 1.8,  moderate: 2.6,  unit: "x",
                why: "nutrients are judged proportionally — a steady 0.08 ppm is healthier than a range of 0.01-0.15 ppm" },
  nitrate:    { mode: "fold",     tight: 1.6,  moderate: 2.3,  unit: "x",
                why: "nitrate should track feeding and export smoothly rather than stepping between levels" },
  ammonia:    { mode: "absolute", tight: 0.05, moderate: 0.1,  unit: "ppm",
                why: "any sustained detectable ammonia indicates a biological problem" },
};
