import { X } from '../../icons.jsx'
import { dayNum } from './water-changes.js'
import { addDaysFromToday, isoLocal, parseLocal } from '../dates.js'

/* --- Time of day ---
 *
 * Alkalinity swings through the day as the doser runs and the corals
 * photosynthesise, so a reading is only comparable to another taken at a
 * similar hour. Without a time, two readings from the same day sit at the same
 * x on every chart and regression, and a normal daily cycle reads as
 * instability. Readings logged before this existed simply have no time, and are
 * treated as midday so they neither lead nor lag.
 */
export const nowTime = () => {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
};

/* Minutes past midnight, or null if the reading predates timestamps. */
export const minutesOf = (t) => {
  if (!t || typeof t !== "string") return null;
  const m = t.match(/^(\d{1,2}):(\d{2})/);
  if (!m) return null;
  const h = +m[1], mi = +m[2];
  if (h > 23 || mi > 59) return null;
  return h * 60 + mi;
};

/* A reading's position on the timeline, in days, including time of day. */
export const dayPos = (row) => {
  const mins = minutesOf(row && row.time);
  return dayNum(row.date) + (mins == null ? 0.5 : mins / 1440);
};

/* Newest first, breaking ties on time so same-day readings order correctly. */
export const byNewest = (a, b) => dayPos(b) - dayPos(a);
export const byOldest = (a, b) => dayPos(a) - dayPos(b);

export const fmtTime = (t) => {
  const mins = minutesOf(t);
  if (mins == null) return null;
  const h = Math.floor(mins / 60), m = mins % 60;
  const ampm = h < 12 ? "am" : "pm";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(m).padStart(2, "0")}${ampm}`;
};

export const addDays = (iso, n) => {
  const x = parseLocal(iso);
  x.setDate(x.getDate() + n);   // setDate handles month, year and DST correctly
  return isoLocal(x);
};

/* Least-squares slope in units-per-day. More robust than first-vs-last,
   which is hostage to a single bad reading at either end. */
export function regressionSlope(rows) {
  if (rows.length < 2) return null;
  /* Fractional days, so two readings taken twelve hours apart are twelve hours
     apart to the maths rather than simultaneous. */
  const xs = rows.map((r) => dayPos(r));
  const ys = rows.map((r) => r.value);
  const x0 = xs[0];
  const X = xs.map((x) => x - x0);
  const n = X.length;
  const mx = X.reduce((a, b) => a + b, 0) / n;
  const my = ys.reduce((a, b) => a + b, 0) / n;
  let num = 0, den = 0;
  for (let i = 0; i < n; i++) { num += (X[i] - mx) * (ys[i] - my); den += (X[i] - mx) ** 2; }
  if (den === 0) return null;
  return num / den;
}

export function windowRows(readings, key, days) {
  const cutoff = addDaysFromToday(-days);
  return readings.filter((r) => r.param === key && r.date >= cutoff)
    .sort(byOldest);
}
