import { daysBetween } from '../dates.js'

/* --- 4. ICP cross-calibration of hobby test kits --- */
export const ICP_ALIASES = {
  calcium: ["calcium", "ca"],
  magnesium: ["magnesium", "mg"],
  potassium: ["potassium", "k"],
  alkalinity: ["alkalinity", "kh", "dkh", "carbonate hardness"],
  nitrate: ["nitrate", "no3"],
  phosphate: ["phosphate", "po4"],
};

/* Labs often report the element rather than the ion. Convert to the units
   hobby kits read so the comparison is like-for-like. */
export const ICP_CONVERSIONS = {
  phosphate: [
    { names: ["phosphorus", "p"], factor: 3.066, from: "P" },
  ],
  nitrate: [
    { names: ["nitrogen", "n"], factor: 4.427, from: "N" },
  ],
};

export function labValueFor(def, elements) {
  const aliases = ICP_ALIASES[def.key];
  if (aliases) {
    const direct = Object.keys(elements).find((k) => aliases.includes(k.trim().toLowerCase()));
    if (direct) return { value: elements[direct], sourceName: direct, converted: null };
  }
  const convs = ICP_CONVERSIONS[def.key] || [];
  for (const c of convs) {
    const hit = Object.keys(elements).find((k) => c.names.includes(k.trim().toLowerCase()));
    if (hit) {
      return {
        value: elements[hit] * c.factor,
        sourceName: hit,
        converted: { from: c.from, factor: c.factor, raw: elements[hit] },
      };
    }
  }
  return null;
}

export function computeCalibration(readings, icps, paramDefs, windowDays = 7, kitChanges = {}) {
  const results = [];
  const diagnostics = [];
  const replaced = [];
  for (const def of paramDefs) {
    if (!ICP_ALIASES[def.key] && !ICP_CONVERSIONS[def.key]) continue;
    /* Comparisons made with a kit you no longer own say nothing about the one
       you do. Anything before the replacement date is retired. */
    const since = kitChanges && kitChanges[def.key];
    const pairs = [];
    let sawElement = false;
    let nearestGap = Infinity;
    for (const test of icps) {
      if (!test.elements) continue;
      const lab = labValueFor(def, test.elements);
      if (!lab) continue;
      sawElement = true;
      let best = null, bestGap = Infinity;
      for (const r of readings.filter((r2) => r2.param === def.key)) {
        const gap = Math.abs(daysBetween(r.date, test.date));
        if (gap < bestGap) { bestGap = gap; best = r; }
      }
      if (bestGap < nearestGap) nearestGap = bestGap;
      if (since && test.date < since) continue;
      if (best && bestGap <= windowDays) {
        pairs.push({
          date: test.date, lab: lab.value, kit: best.value,
          diff: best.value - lab.value, gap: bestGap, converted: lab.converted,
        });
      }
    }
    if (!pairs.length && since) {
      replaced.push({ def, since });
    }
    if (pairs.length) {
      const meanDiff = pairs.reduce((s2, p) => s2 + p.diff, 0) / pairs.length;
      const meanPct = pairs.reduce((s2, p) => s2 + (p.lab ? (p.diff / p.lab) * 100 : 0), 0) / pairs.length;
      results.push({ def, pairs, meanDiff, meanPct, n: pairs.length, converted: pairs[0].converted });
    } else if (sawElement) {
      diagnostics.push({ def, nearestGap: nearestGap === Infinity ? null : nearestGap });
    }
  }
  return { results, diagnostics, windowDays, replaced };
}
