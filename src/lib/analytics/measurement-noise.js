import { X } from '../../icons.jsx'
import { dayPos } from './time-of-day.js'

/* --- Kit measurement noise ---
 * Standard deviation of repeat measurements on the same water, NOT how much
 * the tank varies. Used by the cadence optimiser and the change detector.
 * Editable in Setup, because a Hanna checker and a Salifert titration are not
 * the same instrument.
 */
export const KIT_SIGMA = {
  alkalinity: 0.05, calcium: 8, magnesium: 15,
  nitrate: 1.0, phosphate: 0.01, potassium: 10, ph: 0.03, salinity: 0.2,
};
export function kitSigma(key, settings) {
  const s = settings && settings.kitSigma ? settings.kitSigma[key] : null;
  return s != null && s > 0 ? s : (KIT_SIGMA[key] || 0);
}

/* Slope with its standard error, so estimates can carry uncertainty rather
   than pretending to a precision the data doesn't support. */
export function regressionWithError(rows) {
  if (!rows || rows.length < 3) return null;
  const xs = rows.map((r) => dayPos(r));
  const ys = rows.map((r) => r.value);
  const x0 = xs[0];
  const X = xs.map((x) => x - x0);
  const n = X.length;
  const mx = X.reduce((a, b) => a + b, 0) / n;
  const my = ys.reduce((a, b) => a + b, 0) / n;
  let sxy = 0, sxx = 0;
  for (let i = 0; i < n; i++) { sxy += (X[i] - mx) * (ys[i] - my); sxx += (X[i] - mx) ** 2; }
  if (sxx === 0) return null;
  const slope = sxy / sxx;
  const intercept = my - slope * mx;
  let ssr = 0;
  for (let i = 0; i < n; i++) { const pred = intercept + slope * X[i]; ssr += (ys[i] - pred) ** 2; }
  const resSD = n > 2 ? Math.sqrt(ssr / (n - 2)) : 0;
  const seSlope = resSD / Math.sqrt(sxx);
  return { slope, intercept, seSlope, resSD, n, spanDays: X[n - 1] - X[0] };
}
