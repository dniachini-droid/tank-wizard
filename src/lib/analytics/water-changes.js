import { parseLocal } from '../dates.js'

/* --- Water change history ---
 * 10L every Monday since the tank was set up. Seeded once so the nutrient
 * production and dilution maths have the export side of the equation; without
 * it they cannot separate "produces nothing" from "produces plenty and exports
 * exactly as much".
 */
export const WATER_CHANGE_SEED = ["2026-02-16","2026-02-23","2026-03-02","2026-03-09","2026-03-16","2026-03-23","2026-03-30","2026-04-06","2026-04-13","2026-04-20","2026-04-27","2026-05-04","2026-05-11","2026-05-18","2026-05-25","2026-06-01","2026-06-08","2026-06-15","2026-06-22","2026-06-29","2026-07-06","2026-07-13","2026-07-20","2026-07-27","2026-08-03"];
export const WATER_CHANGE_LITRES = 10;

/* AI Blade channel settings, seeded once so the lighting marker and history
   have a starting point. */
export const LIGHTING_SEED = [
  { id: "light-2026-08-05", date: "2026-08-05",
    note: "UV 66% · V 72% · RY 93% · B 93% · CW 20%" },
];

export const DEFAULT_SETTINGS = {
  /* Which alkalinity kit you use — sets how long the app waits before it will
     read a trend. Hanna is the most common and the most precise. */
  /* A kit per element, because almost nobody uses one brand for everything —
     Hanna's alkalinity checker is the most precise in common use and its
     calcium checker is among the least, so a single choice was guaranteed to
     be wrong for one parameter or the other. The old single testKit is still
     read as the fallback so existing setups keep working. */
  testKit: "hanna",
  testKits: { alkalinity: "hanna", calcium: "redsea", magnesium: "salifert" },
  /* Deliberately absent. Every millilitre figure in the app is scaled by the
     tank's net volume, so a default here is not a convenience — it is one
     particular tank's volume silently dosing somebody else's. The engines
     refuse and name it as the missing input instead (reef-chemistry.md §17,
     §21 rule 6, §12). */
  volumeL: null,
  /* The three solution strengths are deliberately absent, for the same reason
     `volumeL` is and with the same consequence — the engines refuse and name
     the missing input rather than assuming one (reef-chemistry.md §12, §16,
     §17).

     A strength is a property of the bottle in the user's cupboard: what that
     product delivers per mL at the dilution THEY mixed. The app cannot check
     it, every dose and consumption figure is scaled by it, and a plausible
     default is worse than a blank — a blank shows that nothing was set, while
     a default hides it behind a number that looks considered.

     These previously shipped as 0.0533 / 0.3611 / 0.024, the Aquaforest 2x
     Balling figures. They were real measurements of one particular recipe,
     which is exactly the problem: they are correct for one cupboard and
     silently wrong for every other. Owner decision, 16 August.

     Note this is NOT the Ca:alk ratio question. §16's 7.15 governs how the two
     are consumed together, and it is stoichiometry. What a bottle delivers is
     a different kind of fact, and the two must never be reconciled — see §16.

     Doses are not defaults in the same sense and are left as they were: the
     user knows what their doser is set to, and a dose without a strength
     produces no recommendation anyway. */
  dailyDoseMl: 8,
  calciumDoseMl: 9,
  magDoseMl: 8,
  waterChangeL: 10,
};

/* Calendar-day index. Built from local midnight and divided after removing the
   timezone offset, so a day is always a day regardless of DST. */
/* Memoised, because this sits in the hot path of every assessment: each one
   sorts its readings, and a sort comparator calls this O(n log n) times. With
   a couple of years of history that is millions of date parses per screen —
   enough to make the dosing tab visibly slow on a phone. The set of distinct
   dates is small, so caching them costs almost nothing. */
export const DAY_NUM_CACHE = new Map();
export const dayNum = (d) => {
  const hit = DAY_NUM_CACHE.get(d);
  if (hit !== undefined) return hit;
  const x = parseLocal(d);
  const n = Math.floor((x.getTime() - x.getTimezoneOffset() * 60000) / 86400000);
  if (DAY_NUM_CACHE.size < 20000) DAY_NUM_CACHE.set(d, n);
  return n;
};
/* ISO date shifted by n days, in and out as ISO date strings. */
/* "Wed 12 Aug" — a date you can act on without counting. */
export const fmtFriendly = (iso) => {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
};

/* --- Water change dilution model --- */
