/* --- Salt mix baseline: Aquaforest Reef Salt, manufacturer figures at 35 ppt --- */
export const SALT_MIX = {
  name: "Aquaforest Reef Salt",
  salinity: 35,
  /* Midpoints of the published ranges. Aquaforest state Reef Salt is
     nitrate- and phosphate-free, so both baseline to zero. */
  values: { alkalinity: 8.0, calcium: 425, magnesium: 1390, potassium: 390, nitrate: 0, phosphate: 0 },
  ranges: { alkalinity: [7.7, 8.3], calcium: [410, 440], magnesium: [1360, 1420], potassium: [380, 400] },
};

/* --- Salt baseline comparison: what the system adds vs consumes --- */
export function computeSaltComparison(latestByParam, paramDefs) {
  const rows = [];
  for (const def of paramDefs) {
    const base = SALT_MIX.values[def.key];
    if (base == null) continue;
    const reading = latestByParam[def.key];
    if (!reading) continue;
    const delta = reading.value - base;
    const pct = base !== 0 ? (delta / base) * 100 : null;
    rows.push({ def, base, current: reading.value, delta, pct, date: reading.date });
  }
  return rows;
}
