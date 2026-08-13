import { CONSISTENCY_RULES, fmtVal, percentile } from './analytics/time-in-range.js'
import { byOldest } from './analytics/time-of-day.js'
import { addDaysFromToday, daysBetween } from './dates.js'

/* ---------------------------------- stability engine ---------------------------------- */
/*
 * Rate-of-change based stability scoring.
 *
 * Rationale (from reef husbandry consensus): corals respond to the RATE parameters
 * move, not the absolute number. A tank held steady slightly outside "ideal" reliably
 * outperforms one that bounces through perfect values. Published survival data shows
 * alkalinity held within ~0.2 dKH/day correlating with far better long-term SPS
 * outcomes than +/-1.0 dKH daily swings.
 *
 * We normalise every change to a PER-DAY rate so the score is independent of how
 * often testing happens. `perUnit` sets whether thresholds are absolute or percentage.
 * `noiseFloor` prevents ordinary test-kit resolution (e.g. a single Salifert increment)
 * from ever scoring as instability on its own.
 */

/* Windows and noise floors. This table once also carried greenPerDay and
   amberPerDay, which looked like the drift thresholds and were not: nothing
   read them. Drift is graded by CONSISTENCY_RULES, on the spread across the
   window rather than a rate per day.

   They were not harmless. A stage 3 audit "found" that alkalinity graded steady
   at 1.4 dKH a week — three times the published limit — and "fixed" it. The
   number was never consulted, so nothing changed, and a test verified the fix
   by reading the same dead constant. A fix and a test agreeing with each other
   about something the app never asks. Deleted rather than wired up, because
   CONSISTENCY_RULES already does this job and does it better. */
export const STABILITY_RULES = {
  /* Alkalinity graded "steady" at up to 0.2 dKH a day, which is 1.4 a week —
     nearly three times the 0.5 dKH weekly drift the guidance allows, and more
     than the whole target band. A tank crossing its entire range in five days
     still came out green, which is how "parked" and "steady" ended up on
     parameters that were visibly moving. The thresholds are the sourced
     weekly figures divided out, not a per-day noise tolerance: day-to-day
     swing and sustained drift are different things and this window measures
     the second. Calcium and magnesium were already close to the same
     proportion of their bands and are left alone. */
  alkalinity: { windowDays: 14, mode: "absolute", noiseFloor: 0.1, unit: "dKH", displayPer: "week" },
  /* Salifert put the tolerable fluctuation in calcium at about 15 mg/L, a
     weekly figure rather than a daily one. */
  calcium:    { windowDays: 28, mode: "absolute", noiseFloor: 10, unit: "ppm", displayPer: "week" },
  magnesium:  { windowDays: 28, mode: "absolute", noiseFloor: 30, unit: "ppm", displayPer: "week" },
  salinity:   { windowDays: 14, mode: "absolute", noiseFloor: 0.2, unit: "ppt", displayPer: "week" },
  /* Monthly testing means a 90-day window, and hobby potassium kits are only
     good to about 20 ppm, so movement below that is measurement noise. */
  potassium:  { windowDays: 90, mode: "absolute", noiseFloor: 20, unit: "ppm", displayPer: "month" },
  phosphate:  { windowDays: 14, mode: "percent", noiseFloor: 0.02, unit: "%", displayPer: "week" },
  nitrate:    { windowDays: 28, mode: "percent", noiseFloor: 1.0, unit: "%", displayPer: "week" },
  ph:         { windowDays: 28, mode: "absolute", noiseFloor: 0.1, unit: "" },
};

/* Stability is derived from the same spread-based engine as Control &
   alignment, so the two can never contradict each other. The previous
   version divided each change by elapsed days, which turned a 10 ppm
   difference between two readings a day apart into "70 ppm/week" even
   though 10 ppm is calcium's own test resolution. */
/* Grade a set of readings by spread, using the same sourced per-parameter
   rules as Control & alignment. Shared so the windowed and fallback paths
   can never diverge. */
export function gradeSpread(def, rows) {
  if (!rows || rows.length < 2) return null;
  const cr = CONSISTENCY_RULES[def.key];
  if (!cr) return null;
  const vals = rows.map((r) => r.value).sort((a, b) => a - b);
  const p05 = percentile(vals, 5), p95 = percentile(vals, 95);
  const spread = p95 - p05;
  let metric, metricLabel;
  if (cr.mode === "fold") {
    metric = p05 > 0 ? p95 / p05 : (p95 > 0 ? Infinity : 1);
    metricLabel = `${isFinite(metric) ? metric.toFixed(1) : "\u221E"}x swing`;
  } else {
    metric = spread;
    metricLabel = `${fmtVal(def, spread)}${cr.unit} spread`;
  }
  const consistency = metric <= cr.tight ? "tight" : metric <= cr.moderate ? "moderate" : "loose";
  return { metric, metricLabel, consistency, spread, p05, p95 };
}

export function computeStability(def, readings) {
  const rule = STABILITY_RULES[def.key];
  if (!rule) return null;

  const all = readings.filter((r) => r.param === def.key)
    .sort(byOldest);
  if (all.length < 2) {
    return { grade: "unknown", label: "Not enough data", detail: `Need at least 2 readings`, rule, fmtRate: "\u2014" };
  }

  /* Prefer readings inside the parameter's own window. If testing has been
     less frequent than that, fall back to the most recent few and say so,
     rather than reporting nothing useful. */
  const cutoffDate = addDaysFromToday(-rule.windowDays);
  const inWindow = all.filter((r) => r.date >= cutoffDate);
  const stale = inWindow.length < 3;
  const useRows = stale ? all.slice(-4) : inWindow;

  const g = gradeSpread(def, useRows);
  if (!g) {
    return { grade: "unknown", label: "Not enough data", rule, fmtRate: "\u2014",
      detail: "Log another reading to establish a trend", readingCount: all.length,
      spread: 0, spanDays: 1, netChange: 0, typicalRate: 0, fmtRate: "\u2014",
      pattern: "flat", atResolution: false, maxDelta: 0 };
  }
  const c = g;

  // Largest single step, to spot movement that is only test resolution.
  let maxDelta = 0;
  for (let i = 1; i < useRows.length; i++) {
    maxDelta = Math.max(maxDelta, Math.abs(useRows[i].value - useRows[i - 1].value));
  }
  const atResolution = maxDelta <= rule.noiseFloor;

  // Is it travelling one way, or just moving back and forth?
  const netChange = useRows[useRows.length - 1].value - useRows[0].value;
  let totalMovement = 0;
  for (let i = 1; i < useRows.length; i++) totalMovement += Math.abs(useRows[i].value - useRows[i - 1].value);
  const directionality = totalMovement > 0 ? Math.abs(netChange) / totalMovement : 0;
  const pattern = totalMovement === 0 ? "flat"
    : directionality > 0.6 ? (netChange > 0 ? "trending up" : "trending down")
    : "oscillating";

  const grade = atResolution ? "green"
    : c.consistency === "tight" ? "green"
    : c.consistency === "moderate" ? "amber" : "red";

  const label = atResolution ? "At test resolution"
    : c.consistency === "tight" ? "Rock steady"
    : c.consistency === "moderate" ? "Some movement" : "Unstable";

  const spanDays = Math.max(1, daysBetween(useRows[0].date, useRows[useRows.length - 1].date));

  /* Spread between readings taken weeks apart cannot tell you how steady the
     parameter was in between, so it should not be graded as tight control. */
  const avgGap = spanDays / Math.max(1, useRows.length - 1);
  /* "Tested rarely" has to mean rarely FOR THIS PARAMETER. Alkalinity every
     8 days is sparse; nitrate every 8 days is a normal routine. Judging both
     against a flat 7-day rule downgraded perfectly well-run nutrients. */
  const expectedGap = Math.max(7, (def.freqDays || 7) * 2);
  const farApart = avgGap > expectedGap;
  const shownGrade = farApart && grade === "green" ? "amber" : grade;
  const shownLabel = farApart
    ? (grade === "green" ? "Steady, but tested rarely" : label)
    : label;

  return {
    grade: shownGrade, label: shownLabel, trueGrade: grade,
    farApart, avgGap,
    rule, pattern, netChange, spanDays,
    spread: c.spread, consistency: c.consistency, metricLabel: c.metricLabel,
    p05: c.p05, p95: c.p95,
    fmtRate: c.metricLabel || "not enough readings",
    typicalRate: Math.abs(netChange) / spanDays,
    readingCount: useRows.length,
    atResolution, maxDelta,
    stale,
    detail: `${c.metricLabel} · ${useRows.length} readings over ${spanDays}d${stale ? " (outside usual window)" : ""}${farApart ? ` · averaging ${Math.round(avgGap)}d apart, further apart than this parameter wants` : ""} · ${pattern}`,
  };
}

export const STABILITY_COLOR = { green: "#0B7C86", amber: "#A2621B", red: "#C4285B", unknown: "#9FB0AE" };
