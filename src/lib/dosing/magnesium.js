/* --- Magnesium dosing assessment ---
 *
 * The most conservative of the three. Magnesium moves slowly, tests carry
 * meaningful uncertainty, and a weekly water change can account for a large
 * share of the apparent movement — so the default is to hold, and the bar for
 * acting is higher than for calcium.
 *
 * Everything learned building the alkalinity and calcium engines is carried
 * over, including the two faults that only appeared under simulation: the
 * anomaly threshold must be expressed in the parameter's own units, and the
 * tank's position relative to the target range must come from the fitted level rather
 * than the last reading, or one noisy result reads as a tank out of range.
 */

export const MG_TREND = {
  stable: 10,       /* ppm/week — below this is test variation */
  small: 20,
  meaningful: 30,   /* at or above this, verify before acting */
};

/* reef-chemistry.md §27 — how far past the edge counts as CLEARLY out.
   A distance in ppm, never a rate. See `ALK_CLEARLY_OUT` in alkalinity.js for
   the full reasoning; the short version is that magnesium's `clearlyOut` in
   helpers.js read `> MG_TREND.stable` — 10 ppm per WEEK against a distance in
   ppm — and moving the trend constant silently moved the margin with it.
   The same 50 ppm as calcium, and the same figure whatever the band width. */
export const MG_CLEARLY_OUT = 50;

export const MG_SETTLE_DAYS = 7;

/* A recommendation is only as sound as the strength figure behind it.
 *
 * The first version of this tested the resulting DOSE against tank volume,
 * which coupled two unrelated things: a 45 L tank carrying heavy SPS demand
 * legitimately needs a dose that looks enormous per litre, and got flagged
 * despite being correctly configured. Testing the STRENGTH directly has no
 * such coupling — a figure outside what any real product can be is wrong
 * whatever the tank looks like.
 *
 * Ranges below are generous, covering weak ready-made solutions through to
 * concentrated Balling mixes, so only a genuine mistake falls outside. */
export const STRENGTH_RANGE = {
  alkalinity: { lo: 0.01, hi: 0.40, unit: "dKH/mL/100L", field: "dkhPerMlPer100L" },
  calcium:    { lo: 0.05, hi: 2.00, unit: "ppm/mL/100L", field: "caPpmPerMlPer100L" },
  /* The floor here is deliberately far below the other two. Ready-made
     magnesium supplements are dilute — around 0.012 ppm/mL/100L at standard
     strength — so a range borrowed from the calcium part would reject a
     perfectly ordinary bottle. */
  magnesium:  { lo: 0.005, hi: 3.00, unit: "ppm/mL/100L", field: "mgPpmPerMlPer100L" },
};

export function strengthPlausible(element, settings) {
  const r = STRENGTH_RANGE[element];
  if (!r) return { ok: true };
  const v = Number(settings && settings[r.field]);
  if (!isFinite(v) || v <= 0) return { ok: true };
  if (v >= r.lo && v <= r.hi) return { ok: true };
  return { ok: false, value: v, ...r };
}
