import { CA_PER_DKH } from './calcification.js'
import { parseLocal } from '../dates.js'

/* The shipped two-part strengths. The alkalinity part is the product's own
   figure; the calcium part is DERIVED from it at §16's Ca:alk ratio, so the
   pairing the app ships always implies the ratio calcification consumes.
   They used to be two independent product figures whose ratio was 6.77, and
   Setup's blank-field default (0.3611) and this table (0.36) did not even
   agree with each other. One constant, two derived values, no drift.

   They live here, beside DEFAULT_SETTINGS, rather than in consumption.js with
   DOSE_ELEMENTS: consumption.js already imports DEFAULT_SETTINGS from this
   module, so defining them there and importing them back would be a cycle. */
export const ALK_DEFAULT_STRENGTH = 0.0533;
export const CA_DEFAULT_STRENGTH = Math.round(ALK_DEFAULT_STRENGTH * CA_PER_DKH * 1e4) / 1e4;

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
  /* The alkalinity figure is the actual mix rather than a label: Aquaforest
     Balling at 2x standard, 101 g soda ash per L = 1906 meq/L, so 1 mL into
     100 L gives 0.0533 dKH. */
  dailyDoseMl: 8, dkhPerMlPer100L: ALK_DEFAULT_STRENGTH,
  /* The calcium figure is DERIVED from it, at §16's Ca:alk ratio, and is the
     same one DOSE_ELEMENTS ships — one pairing, from one constant, so Setup's
     blank-field default and the engine's dosing default cannot disagree. They
     did: 0.36 here against 0.3611 there, implying 6.75 and 6.77 respectively,
     both against the spec-fixed 7.15.
     Magnesium is taken from the product's own figure rather than derived:
     Aquaforest's magnesium part raises 100 L by 1.2 ppm per 100 mL at standard
     strength, so 0.012 ppm/mL/100L, and 0.024 at the double-strength mix used
     here. Commercial magnesium supplements really are this dilute — magnesium
     sits near 1400 ppm, so shifting it is inherently a large-volume job, and a
     figure that looks implausibly small next to the calcium part is correct. */
  calciumDoseMl: 9, caPpmPerMlPer100L: CA_DEFAULT_STRENGTH,
  magDoseMl: 8, mgPpmPerMlPer100L: 0.024,
  waterChangeL: 10,
};

/* Stoichiometry: 1 meq/L of alkalinity pairs with 20 ppm calcium, and
   1 meq/L = 2.8 dKH. So each dKH of alkalinity consumed corresponds to
   roughly 7.14 ppm of calcium consumed in a balanced system. */

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
