import { regressionSlope, windowRows } from './time-of-day.js'
import { daysBetween } from '../dates.js'

/* --- Rate analysis for frequently-tested parameters ---
 *
 * Spread alone cannot tell apart a slow steady climb from a violent bounce.
 * Published guidance treats these as separate questions with separate
 * thresholds: daily swings under ~0.3 dKH, and weekly drift under ~0.5 dKH.
 *
 * A rate is only trustworthy when readings sit close together. Testing 8.0,
 * then 9.0 three weeks later, divides out to a flattering 0.05 dKH/day while
 * hiding whatever happened in between — so gaps beyond maxGapDays are left
 * out of the rate entirely and reported as drift instead.
 */
export const RATE_RULES = {
  alkalinity: { maxGapDays: 4, dailyGood: 0.3, dailyOk: 0.5, weeklyGood: 0.5, weeklyOk: 1.0, unit: "dKH", dp: 2 },
  salinity:   { maxGapDays: 5, dailyGood: 0.1, dailyOk: 0.2, weeklyGood: 0.3, weeklyOk: 0.6, unit: "ppt", dp: 2 },
};

export function computeRates(def, readings, days) {
  const rr = RATE_RULES[def.key];
  if (!rr) return null;
  const rows = windowRows(readings, def.key, days);
  if (rows.length < 3) return null;

  // Daily swing, using only pairs close enough together to mean anything.
  const closeRates = [];
  let widestGap = 0, gappedPairs = 0;
  for (let i = 1; i < rows.length; i++) {
    const gap = Math.max(0.5, daysBetween(rows[i - 1].date, rows[i].date));
    if (gap > widestGap) widestGap = gap;
    if (gap > rr.maxGapDays) { gappedPairs++; continue; }
    closeRates.push(Math.abs(rows[i].value - rows[i - 1].value) / gap);
  }

  let daily = null;
  if (closeRates.length >= 2) {
    const sorted = [...closeRates].sort((a, b) => a - b);
    // 90th percentile: tolerate one odd jump without ignoring real volatility.
    const typical = sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * 0.9))];
    /* Compare on the rounded, displayed value. Otherwise 0.30000000000000004
       reads as "above 0.3" while the screen shows 0.30. */
    const shown = parseFloat(typical.toFixed(rr.dp));
    daily = {
      value: typical,
      shown,
      worst: sorted[sorted.length - 1],
      n: closeRates.length,
      grade: shown <= rr.dailyGood ? "good" : shown <= rr.dailyOk ? "ok" : "poor",
    };
  }

  // Weekly drift: the underlying trend, not the noise around it.
  const slope = regressionSlope(rows);
  const weeklyVal = slope == null ? null : slope * 7;
  const weeklyShown = weeklyVal == null ? null : parseFloat(Math.abs(weeklyVal).toFixed(rr.dp));
  const weekly = weeklyVal == null ? null : {
    value: weeklyVal,
    shown: weeklyShown,
    direction: weeklyVal > 0 ? "up" : weeklyVal < 0 ? "down" : "flat",
    grade: weeklyShown <= rr.weeklyGood ? "good"
      : weeklyShown <= rr.weeklyOk ? "ok" : "poor",
  };

  const spanDays = Math.max(1, daysBetween(rows[0].date, rows[rows.length - 1].date));
  return { rr, daily, weekly, rows: rows.length, spanDays, widestGap, gappedPairs,
           sparse: daily == null };
}

/* Describes how the parameter is moving. Deliberately says nothing about
   changing a dose — that call belongs to the dosing box, which uses the same
   window and the same drift figure, so the two can never disagree. */
export function rateNarrative(def, r, windowLabel) {
  if (!r) return null;
  const { rr, daily, weekly } = r;
  const d = (v) => v.toFixed(rr.dp);
  const parts = [];
  const span = windowLabel || `these ${r.spanDays} days`;

  /* When movement is one-directional, the day-to-day figure IS the drift —
     0.30/day and 2.1/week are the same thing. Calling the daily number
     reassuring in that case contradicts the drift warning underneath it. */
  const oneWay = weekly && weekly.grade !== "good" && daily
    && Math.abs(weekly.value) > daily.value * 4;

  if (daily) {
    const dv = d(daily.value);
    if (daily.grade === "good" && oneWay) {
      parts.push(`Between tests across ${span} you're moving about ${dv} ${rr.unit} a day. On its own that's inside the ${rr.dailyGood} ${rr.unit} most reefers aim for, but it isn't random movement — it's all in one direction, so it compounds into the drift below rather than cancelling out.`);
    } else if (daily.grade === "good") {
      parts.push(`Between tests across ${span} you're moving about ${dv} ${rr.unit} a day — inside the ${rr.dailyGood} ${rr.unit} most reefers aim for, and it's the movement corals actually feel.`);
    } else if (daily.grade === "ok") {
      parts.push(`Between tests across ${span} you're moving about ${dv} ${rr.unit} a day, a little above the ${rr.dailyGood} ${rr.unit} ideal but still in territory most tanks handle fine. Splitting the dose into more, smaller doses across the day is the usual way to tighten it.`);
    } else {
      parts.push(`Between tests across ${span} you're swinging about ${dv} ${rr.unit} a day, more than corals like to see. More frequent smaller doses tighten this, and it's worth checking the doser is delivering what you think it is.`);
    }
  }

  if (weekly && Math.abs(weekly.value) > 0.001) {
    const wv = d(Math.abs(weekly.value));
    const dir = weekly.direction === "up" ? "climbing" : "falling";
    parts.push(`Over the same period it's ${dir} at an average of ${wv} ${rr.unit} a week.`);
    if (weekly.grade === "good") {
      parts.push(`That's gentle enough to count as normal drift.`);
    } else {
      parts.push(`That's a real direction rather than noise — what it means for your dose is covered below.`);
    }
  }

  if (r.sparse) {
    parts.push(`There aren't enough closely-spaced tests to judge day-to-day movement — readings are up to ${Math.round(r.widestGap)} days apart, and a lot can happen in between. Testing a couple of days running would tell you far more than the spread alone.`);
  } else if (r.gappedPairs > 0) {
    parts.push(`A few gaps of more than ${rr.maxGapDays} days were left out of the daily figure, since there's no way to know what happened between those tests.`);
  }

  return parts.join(" ");
}
