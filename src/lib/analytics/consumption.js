import { SALT_MIX } from './salt-baseline.js'
import { byOldest, regressionSlope, windowRows } from './time-of-day.js'
import { DEFAULT_SETTINGS } from './water-changes.js'
import { PARAM_DEFS } from '../constants.js'
import { daysBetween, fmtShort, isoLocal } from '../dates.js'
import { STABILITY_RULES } from '../stability-engine.js'

/* --- 1. Alkalinity consumption & doser guidance --- */
export function computeConsumption(readings, settings) {
  const s = { ...DEFAULT_SETTINGS, ...settings };
  if (!(s.volumeL > 0)) return null;
  const rows = windowRows(readings, "alkalinity", 30);
  if (rows.length < 3) return null;

  const driftPerDay = regressionSlope(rows);
  if (driftPerDay == null) return null;

  // What the current daily dose actually delivers, in dKH, for this volume.
  const dosePerDayDkh = s.dailyDoseMl > 0
    ? s.dailyDoseMl * s.dkhPerMlPer100L * (100 / s.volumeL)
    : null;

  // Consumption = what you put in, minus what stayed. If alk is falling while
  // dosing, the tank is eating more than the dose delivers.
  const consumption = dosePerDayDkh != null ? dosePerDayDkh - driftPerDay : null;

  const dkhPerMl = s.dkhPerMlPer100L * (100 / s.volumeL);
  const recommendedMl = consumption != null && dkhPerMl > 0 ? consumption / dkhPerMl : null;
  const adjustMl = recommendedMl != null ? recommendedMl - s.dailyDoseMl : null;

  // Demand trend: consumption inferred window by window. With a constant dose,
  // a steepening decline means the tank is eating more, i.e. growing.
  const windows = [];
  for (let i = 5; i >= 0; i--) {
    const end = new Date(Date.now() - i * 14 * 86400000);
    const start = new Date(end.getTime() - 14 * 86400000);
    const seg = readings.filter((r) => r.param === "alkalinity"
      && r.date >= isoLocal(start)
      && r.date < isoLocal(end))
      .sort(byOldest);
    if (seg.length < 2) continue;
    const slope = regressionSlope(seg);
    if (slope == null) continue;
    windows.push({
      label: fmtShort(seg[seg.length - 1].date),
      drift: slope,
      demand: dosePerDayDkh != null ? dosePerDayDkh - slope : -slope,
      n: seg.length,
    });
  }

  let demandTrend = null;
  if (windows.length >= 3) {
    const firstHalf = windows.slice(0, Math.floor(windows.length / 2));
    const lastHalf = windows.slice(-Math.floor(windows.length / 2));
    const a = firstHalf.reduce((s2, w) => s2 + w.demand, 0) / firstHalf.length;
    const b = lastHalf.reduce((s2, w) => s2 + w.demand, 0) / lastHalf.length;
    const change = b - a;
    demandTrend = {
      change,
      direction: Math.abs(change) < 0.02 ? "steady" : change > 0 ? "rising" : "falling",
      pctChange: a !== 0 ? (change / Math.abs(a)) * 100 : 0,
    };
  }

  return { driftPerDay, dosePerDayDkh, consumption, recommendedMl, adjustMl, windows, demandTrend, settings: s, readingCount: rows.length };
}

/* --- Generalised consumption, water-change aware ---
 *
 * Mass balance: what you added, plus what water changes brought in, minus what
 * stayed, is what the tank consumed.
 *
 *   consumed = dosed + addedByWaterChanges - netChangeInTank
 *
 * Each parameter gets its own minimum window because they move at very
 * different speeds. Magnesium demand is roughly a tenth of calcium's, so a
 * week of weekly tests would show nothing but kit noise; three weeks gives the
 * signal a chance to clear the noise floor. Where it still doesn't, the result
 * is reported as unreliable rather than dressed up as a number.
 */
/* Which settings fields belong to which element, so the setup panel and the
   dose log can be driven by a single dropdown rather than stacking all three. */
export const DOSE_ELEMENTS = [
  { key: "alkalinity", label: "Alkalinity", doseField: "dailyDoseMl", strengthField: "dkhPerMlPer100L",
    unit: "dKH", strengthLabel: "dKH/mL/100L", strengthStep: 0.005, defaultStrength: 0.0533,
    hint: "Aquaforest Balling at 2x standard (101 g soda ash per litre) works out at 0.0533 dKH per mL per 100L. Their standard strength is half that." },
  { key: "calcium", label: "Calcium", doseField: "calciumDoseMl", strengthField: "caPpmPerMlPer100L",
    unit: "ppm", strengthLabel: "ppm/mL/100L", strengthStep: 0.01, defaultStrength: 0.3611,
    hint: "Aquaforest Balling at 2x standard (100 g AF Calcium per litre) works out at 0.3611 ppm per mL per 100L. Paired with the alkalinity part that gives 6.8 ppm calcium per dKH — the ratio corals actually consume." },
  { key: "magnesium", label: "Magnesium", doseField: "magDoseMl", strengthField: "mgPpmPerMlPer100L",
    unit: "ppm", strengthLabel: "ppm/mL/100L", strengthStep: 0.1, defaultStrength: 0.024,
    hint: "Magnesium products vary a lot in concentration — check your bottle. Leave the dose at 0 if water changes alone replenish it." },
];

export const CONSUMPTION_RULES = {
  alkalinity: { minDays: 7,  maxDays: 45,  unit: "dKH", dp: 2,
                dose: (s) => s.dailyDoseMl * s.dkhPerMlPer100L * (100 / s.volumeL) },
  calcium:    { minDays: 14, maxDays: 60,  unit: "ppm", dp: 1,
                dose: (s) => s.calciumDoseMl * s.caPpmPerMlPer100L * (100 / s.volumeL) },
  magnesium:  { minDays: 21, maxDays: 90,  unit: "ppm", dp: 1,
                dose: (s) => s.magDoseMl * s.mgPpmPerMlPer100L * (100 / s.volumeL) },
};

export function computeElementConsumption(key, readings, waterChanges, settings) {
  const rule = CONSUMPTION_RULES[key];
  const def = PARAM_DEFS.find((d) => d.key === key);
  if (!rule || !def) return null;
  const s = { ...DEFAULT_SETTINGS, ...settings };

  /* Widen until there are enough readings AND they actually span the minimum
     period. Checking only the count let a cluster of four tests inside 16 days
     satisfy a 21-day rule, which then failed the span check and reported
     "not enough data" even though months of history existed. */
  let rows = [], days = rule.minDays, spanDays = 0;
  for (; days <= rule.maxDays; days += 7) {
    rows = windowRows(readings, key, days);
    if (rows.length < 3) continue;
    spanDays = Math.max(1, daysBetween(rows[0].date, rows[rows.length - 1].date));
    if (spanDays >= rule.minDays) break;
  }

  if (rows.length < 3) return { status: "insufficient", need: 3, have: rows.length, rule, def, days };
  spanDays = Math.max(1, daysBetween(rows[0].date, rows[rows.length - 1].date));
  if (spanDays < rule.minDays) {
    // Genuinely not enough history yet, even reaching back as far as allowed.
    return { status: "tooshort", spanDays, minDays: rule.minDays, rule, def, rows: rows.length };
  }

  const slope = regressionSlope(rows);
  if (slope == null) return { status: "insufficient", need: 3, have: rows.length, rule, def, days };
  const netChange = slope * spanDays;

  // What water changes contributed across the same span.
  const from = rows[0].date, to = rows[rows.length - 1].date;
  const wcs = (waterChanges || []).filter((w) => w.date >= from && w.date <= to);
  const saltVal = SALT_MIX.values[key];

  /* A water change moves the level toward the salt's value by a fraction of the
     volume, so the effect depends on where the tank was AT THAT MOMENT — not on
     the window's median. Using the median made calcium's contribution vanish
     whenever the median happened to equal the salt figure, which is exactly
     what it did here: median 450, salt 450, contribution zero. */
  let wcContribution = 0;
  const perChange = [];
  for (const w of wcs) {
    const f = Math.min(1, (w.litres || 0) / s.volumeL);
    if (saltVal == null || f <= 0) continue;
    let near = rows[0], best = Infinity;
    for (const r of rows) {
      const gap = Math.abs(daysBetween(r.date, w.date));
      if (gap < best) { best = gap; near = r; }
    }
    const contribution = f * (saltVal - near.value);
    wcContribution += contribution;
    perChange.push({ date: w.date, litres: w.litres, level: near.value, contribution });
  }

  const vals = rows.map((r) => r.value).sort((a, b) => a - b);
  const typical = vals[Math.floor(vals.length / 2)];

  const dosePerDay = rule.dose(s);
  const dosed = dosePerDay * spanDays;

  // The balance itself.
  const consumedTotal = dosed + wcContribution - netChange;
  const perDay = consumedTotal / spanDays;

  // Is the signal bigger than what the test kit can resolve?
  const sRule = STABILITY_RULES[key];
  const floor = sRule ? sRule.noiseFloor : 0;
  const reliable = Math.abs(consumedTotal) > floor * 1.5;

  /* Three readings across two months is not the same evidence as three across
     a fortnight, and the figure should not be presented as though it were. */
  const avgGap = spanDays / Math.max(1, rows.length - 1);
  const sparse = avgGap > (rule.minDays / 2);

  return {
    status: "ok", rule, def, rows: rows.length, spanDays, sparse, avgGap,
    netChange, dosePerDay, dosed, wcContribution, wcCount: wcs.length,
    consumedTotal, perDay, reliable, saltVal, typical, perChange,
    doseConfigured: dosePerDay > 0,
  };
}

/* Predicted levels straight after a water change. */
/* Uses the salt maker's published figures. Batches vary, so these are
   estimates to test against rather than values to rely on. */
export function predictAfterChange(latestByParam, paramDefs, volumeL, litres) {
  /* spec: reef-chemistry.md §17, §12 — net volume unset must refuse and
     name the missing input, not fall through the division below. With
     volumeL null/undefined, litres / volumeL is NaN or Infinity, and
     Math.min(1, ...) turned that into a silent, plausible-looking "100% water
     change" prediction instead of a refusal. */
  if (!(volumeL > 0)) return { status: "novolume", missing: "net volume" };
  const f = Math.min(1, litres / volumeL);
  const out = [];
  for (const def of paramDefs) {
    const nominal = SALT_MIX.values[def.key];
    if (nominal == null) continue;
    const reading = latestByParam[def.key];
    if (!reading) continue;
    const after = reading.value * (1 - f) + nominal * f;
    out.push({ def, before: reading.value, after, delta: after - reading.value });
  }
  return { pct: f * 100, rows: out };
}
