import { DOSE_ELEMENTS } from './consumption.js'
import { regressionWithError } from './measurement-noise.js'
import { SALT_MIX } from './salt-baseline.js'
import { addDays, byOldest } from './time-of-day.js'
import { DEFAULT_SETTINGS, dayNum } from './water-changes.js'
import { fmtShort } from '../dates.js'

/* --- Demand over time, for any dosed element ---
 *
 * Rolling windows of consumption = dose - drift. Each point carries its own
 * standard error so the chart can show an uncertainty band rather than a bare
 * line implying more precision than the readings support.
 *
 * Only offered where the signal actually clears the noise. Measured against
 * this tank's own data: alkalinity has a signal-to-noise ratio around 97,
 * calcium around 13, magnesium around 1.2 — magnesium's estimate flips sign
 * between windows, so charting it would be drawing patterns in noise.
 */
export const DEMAND_SERIES = {
  alkalinity: { windowDays: 21, stepDays: 10, minReadings: 4, unit: "dKH" },
  calcium:    { windowDays: 30, stepDays: 14, minReadings: 4, unit: "ppm" },
};

export function computeDemandSeries(key, readings, waterChanges, settings) {
  const cfg = DEMAND_SERIES[key];
  const el = DOSE_ELEMENTS.find((e) => e.key === key);
  if (!cfg || !el) return null;
  const s = { ...DEFAULT_SETTINGS, ...settings };
  if (!(s.volumeL > 0)) return { status: "novolume", key, el };
  const doseMl = s[el.doseField] || 0;
  const strength = s[el.strengthField] || 0;
  if (doseMl <= 0 || strength <= 0) return { status: "nodose", key, el };

  const perDay = doseMl * strength * (100 / s.volumeL);
  const rows = readings.filter((r) => r.param === key).sort(byOldest);
  if (rows.length < cfg.minReadings + 2) return { status: "insufficient", key, el, have: rows.length };

  const first = dayNum(rows[0].date), last = dayNum(rows[rows.length - 1].date);
  const points = [];
  for (let t = first + cfg.windowDays; t <= last; t += cfg.stepDays) {
    const lo = t - cfg.windowDays;
    const seg = rows.filter((r) => dayNum(r.date) >= lo && dayNum(r.date) <= t);
    if (seg.length < cfg.minReadings) continue;
    const r = regressionWithError(seg);
    if (!r) continue;

    /* Water changes inside the window move the level independently of coral
       demand, so their contribution is added back before calling the remainder
       consumption. */
    const saltVal = SALT_MIX.values[key];
    let wcPerDay = 0;
    if (saltVal != null) {
      const inWin = (waterChanges || []).filter((w) => {
        const d = dayNum(w.date);
        return d >= lo && d <= t;
      });
      let total = 0;
      for (const w of inWin) {
        const f = Math.min(1, (w.litres || 0) / s.volumeL);
        let near = seg[0], best = Infinity;
        for (const x of seg) {
          const gap = Math.abs(dayNum(x.date) - dayNum(w.date));
          if (gap < best) { best = gap; near = x; }
        }
        total += f * (saltVal - near.value);
      }
      wcPerDay = total / cfg.windowDays;
    }

    const demand = perDay + wcPerDay - r.slope;
    const date = addDays(rows[0].date, t - dayNum(rows[0].date));
    points.push({
      label: fmtShort(date), date, demand,
      lo: demand - 2 * r.seSlope, hi: demand + 2 * r.seSlope,
      se: r.seSlope, n: seg.length,
    });
  }

  if (points.length < 2) return { status: "insufficient", key, el, have: rows.length };

  const vals = points.map((p) => p.demand);
  const mean = vals.reduce((a, b) => a + b, 0) / vals.length;
  const meanSE = points.reduce((a, p) => a + p.se, 0) / points.length;
  const snr = meanSE > 0 ? Math.abs(mean) / meanSE : Infinity;

  // Is demand growing? Compare the first and last thirds rather than endpoints.
  const third = Math.max(1, Math.floor(points.length / 3));
  const early = points.slice(0, third).reduce((a, p) => a + p.demand, 0) / third;
  const late = points.slice(-third).reduce((a, p) => a + p.demand, 0) / third;
  const change = late - early;
  const meaningful = Math.abs(change) > 2 * meanSE;
  const direction = !meaningful ? "steady" : change > 0 ? "rising" : "falling";

  return {
    status: "ok", key, el, points, perDay, mean, meanSE, snr,
    change, direction, meaningful, unit: cfg.unit, windowDays: cfg.windowDays,
  };
}
