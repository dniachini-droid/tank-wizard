import { ICP_ALIASES } from './icp-calibration.js'
import { byOldest, regressionSlope } from './time-of-day.js'
import { daysBetween } from '../dates.js'

/* --- ICP reference ranges (mg/L). Trace targets follow natural seawater
       and the bands the major reef ICP labs report against. --- */
/* Reference ranges as published by Triton on their ICP-OES reports.
   Where Triton states a single setpoint rather than a range, the band is
   that setpoint +/-10% and is marked `derived` so the app can say so
   rather than implying Triton drew the boundary. */
/* Triton's report is organised into groups, and so is this list. Alphabetical
   order buried the elements you actually manage under a dozen contaminants
   that should always read zero. */
export const ICP_GROUPS = [
  { id: "macro", label: "Macro elements",
    members: ["calcium", "magnesium", "potassium", "sodium", "chloride", "sulphur",
              "strontium", "boron", "bromide", "fluoride", "salinity"] },
  { id: "nutrient", label: "Nutrients",
    members: ["phosphate", "phosphorus", "nitrate", "nitrogen"] },
  { id: "trace", label: "Trace elements",
    members: ["iodine", "lithium", "molybdenum", "manganese", "iron", "zinc",
              "nickel", "vanadium", "chromium", "cobalt", "barium", "silicon"] },
  { id: "contaminant", label: "Contaminants (target zero)",
    members: ["aluminium", "aluminum", "antimony", "arsenic", "lead", "cadmium",
              "copper", "lanthanum", "mercury", "scandium", "selenium",
              "titanium", "tungsten", "tin", "beryllium"] },
];

export function icpGroupOf(name) {
  const k = String(name || "").toLowerCase();
  const g = ICP_GROUPS.find((grp) => grp.members.includes(k));
  return g ? g.id : "other";
}

export const ICP_REFERENCE = {
  aluminium:   { lo: 0, hi: 0.06, ideal: 0.02, unit: "mg/L", toxic: true },
  antimony:    { lo: 0, hi: 0, ideal: 0, unit: "mg/L", toxic: true },
  arsenic:     { lo: 0, hi: 0, ideal: 0, unit: "mg/L", toxic: true },
  lead:        { lo: 0, hi: 0, ideal: 0, unit: "mg/L", toxic: true },
  cadmium:     { lo: 0, hi: 0, ideal: 0, unit: "mg/L", toxic: true },
  copper:      { lo: 0, hi: 0, ideal: 0, unit: "mg/L", toxic: true },
  lanthanum:   { lo: 0, hi: 0, ideal: 0, unit: "mg/L", toxic: true },
  mercury:     { lo: 0, hi: 0, ideal: 0, unit: "mg/L", toxic: true },
  scandium:    { lo: 0, hi: 0, ideal: 0, unit: "mg/L", toxic: true },
  selenium:    { lo: 0, hi: 0, ideal: 0, unit: "mg/L", toxic: true },
  titanium:    { lo: 0, hi: 0, ideal: 0, unit: "mg/L", toxic: true },
  tungsten:    { lo: 0, hi: 0, ideal: 0, unit: "mg/L", toxic: true },
  tin:         { lo: 0, hi: 0, ideal: 0, unit: "mg/L", toxic: true },
  sodium:      { lo: 10000, hi: 11300, ideal: 10650, unit: "mg/L" },
  calcium:     { lo: 415, hi: 520, ideal: 450, unit: "mg/L" },
  magnesium:   { lo: 1320, hi: 1500, ideal: 1400, unit: "mg/L" },
  potassium:   { lo: 380, hi: 480, ideal: 420, unit: "mg/L" },
  strontium:   { lo: 8, hi: 12, ideal: 9, unit: "mg/L" },
  vanadium:    { lo: 0, hi: 0.003, ideal: 0.001, unit: "mg/L" },
  zinc:        { lo: 0, hi: 0.005, ideal: 0.002, unit: "mg/L" },
  manganese:   { lo: 0, hi: 0.003, ideal: 0.001, unit: "mg/L" },
  iodine:      { lo: 0.03, hi: 0.09, ideal: 0.06, unit: "mg/L" },
  chromium:    { lo: 0, hi: 0.001, ideal: 0, unit: "mg/L" },
  cobalt:      { lo: 0, hi: 0.001, ideal: 0, unit: "mg/L" },
  iron:        { lo: 0, hi: 0.001, ideal: 0, unit: "mg/L" },
  barium:      { lo: 0, hi: 0.01, ideal: 0.003, unit: "mg/L" },
  beryllium:   { lo: 0, hi: 0, ideal: 0, unit: "mg/L", toxic: true },
  silicon:     { lo: 0, hi: 0.2, ideal: 0.08, unit: "mg/L" },
  phosphorus:  { lo: 0.006, hi: 0.023, ideal: 0.014, unit: "mg/L" },
  phosphate:   { lo: 0.018, hi: 0.07, ideal: 0.04, unit: "mg/L" },
  chloride:    { lo: 17550, hi: 21450, ideal: 19500, unit: "mg/L", setpoint: 19500, derived: true },
  bromide:     { lo: 59.4, hi: 72.6, ideal: 66, unit: "mg/L", setpoint: 66, derived: true },
  boron:       { lo: 4.05, hi: 4.95, ideal: 4.5, unit: "mg/L", setpoint: 4.5, derived: true },
  fluoride:    { lo: 1.17, hi: 1.43, ideal: 1.3, unit: "mg/L", setpoint: 1.3, derived: true },
  sulphur:     { lo: 810, hi: 990, ideal: 900, unit: "mg/L", setpoint: 900, derived: true },
  lithium:     { lo: 0.18, hi: 0.22, ideal: 0.2, unit: "mg/L", setpoint: 0.2, derived: true },
  nickel:      { lo: 0.0045, hi: 0.0055, ideal: 0.005, unit: "mg/L", setpoint: 0.005, derived: true },
  molybdenum:  { lo: 0.0108, hi: 0.0132, ideal: 0.012, unit: "mg/L", setpoint: 0.012, derived: true },
  salinity:    { lo: 31.5, hi: 38.5, ideal: 35, unit: "PSU", setpoint: 35, derived: true },
  aluminum:    { lo: 0, hi: 0.06, ideal: 0.02, unit: "mg/L", toxic: true },
  bromine:     { lo: 59.4, hi: 72.6, ideal: 66, unit: "mg/L", setpoint: 66, derived: true },
  fluorine:    { lo: 1.17, hi: 1.43, ideal: 1.3, unit: "mg/L", setpoint: 1.3, derived: true },
};

export function icpRef(name) {
  const k = String(name).trim().toLowerCase();
  if (ICP_REFERENCE[k]) return { key: k, ...ICP_REFERENCE[k] };
  for (const [alias, keys] of Object.entries(ICP_ALIASES)) {
    if (keys.includes(k) && ICP_REFERENCE[alias]) return { key: alias, ...ICP_REFERENCE[alias] };
  }
  return null;
}

export function icpStatus(ref, v) {
  if (!ref) return "unknown";
  /* Triton's target for the unwanted metals is literally zero, so any reading
     above the detection floor is a detection rather than a "high" range value. */
  if (ref.hi === 0) return v > 0 ? "detected" : "ok";
  if (v > ref.hi) return "high";
  if (v < ref.lo) return "low";
  return "ok";
}

/* Trace element accumulation/depletion across successive ICP tests. */
export function computeIcpTrends(icps) {
  const sorted = [...icps].sort(byOldest);
  if (sorted.length < 2) return [];
  const names = new Set();
  sorted.forEach((t) => Object.keys(t.elements || {}).forEach((n) => names.add(n)));
  const out = [];
  for (const name of names) {
    const series = sorted.filter((t) => t.elements && t.elements[name] != null)
      .map((t) => ({ date: t.date, value: t.elements[name] }));
    if (series.length < 2) continue;
    const slope = regressionSlope(series);
    const ref = icpRef(name);
    const first = series[0].value, last = series[series.length - 1].value;
    const spanDays = Math.max(1, daysBetween(series[0].date, series[series.length - 1].date));
    const pctChange = first !== 0 ? ((last - first) / Math.abs(first)) * 100 : 0;
    out.push({
      name, series, slope, ref, first, last, spanDays, pctChange,
      status: ref ? icpStatus(ref, last) : "unknown",
      direction: Math.abs(pctChange) < 12 ? "steady" : pctChange > 0 ? "accumulating" : "depleting",
    });
  }
  return out.sort((a, b) => {
    const rank = (x) => (x.ref && x.ref.toxic && x.status === "high" ? 0 : x.status === "high" || x.status === "low" ? 1 : 2);
    return rank(a) - rank(b) || a.name.localeCompare(b.name);
  });
}
