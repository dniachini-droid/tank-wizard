/* --- Local dates ---
 *
 * toISOString() returns UTC. At 9am in Sydney it is still the previous day in
 * UTC, so the app believed "today" was yesterday: a reminder due today read as
 * "in 1 day", and adding days to a date could land a day short. Every date in
 * this app is a calendar day in the user's own timezone, so they are formatted
 * and parsed locally throughout.
 */
export const isoLocal = (d) => {
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
};
export const parseLocal = (iso) => {
  const [y, m, d] = String(iso).slice(0, 10).split("-").map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
};
export const todayStr = () => isoLocal(new Date());
/* Shorthand for "n days from today", in local terms. */
export const addDaysFromToday = (n) => { const x = new Date(); x.setDate(x.getDate() + n); return isoLocal(x); };
export const daysBetween = (a, b) => Math.round((new Date(b) - new Date(a)) / 86400000);
export const fmtDate = (d) => new Date(d + "T00:00:00").toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" });
export const fmtShort = (d) => new Date(d + "T00:00:00").toLocaleDateString("en-AU", { day: "numeric", month: "short" });

export function paramStatus(def, value) {
  if (value == null || isNaN(value)) return "unknown";
  if (value < def.min) return "low";
  if (value > def.max) return "high";
  return "ok";
}

export const STATUS_COLOR = { ok: "#0B7C86", low: "#926A09", high: "#C4285B", unknown: "#9FB0AE" };
