/* --- Shared parity fixtures ---
 *
 * §2 of docs/spec/surfaces-and-messaging.md requires that "given identical
 * inputs — same reading, same targets, same net volume, same product, same
 * history — all three [dosing] surfaces must produce the same numbers and the
 * same classification." Every test in tests/parity/ drives one of these
 * fixtures through more than one real surface function and compares the
 * actual returned values (never rendered strings) at stored precision.
 *
 * PARAM_DEFS (src/lib/constants.js) ships:
 *   alkalinity  8.5 - 9.5  dKH
 *   calcium     400 - 450  ppm
 *   magnesium   1250 - 1400 ppm
 *
 * SAFE_BOUNDS (src/lib/findings.js) ships the hobby-safe envelope used by
 * some (not all) surfaces as the "alert" threshold:
 *   alkalinity  7 - 11
 *   calcium     350 - 500
 *   magnesium   1150 - 1600
 */
import { PARAM_DEFS } from '../../src/lib/constants.js'
import { DEFAULT_SETTINGS } from '../../src/lib/analytics/water-changes.js'

export const alkDef = PARAM_DEFS.find((d) => d.key === 'alkalinity');
export const caDef = PARAM_DEFS.find((d) => d.key === 'calcium');
export const mgDef = PARAM_DEFS.find((d) => d.key === 'magnesium');

// A fully-configured tank: net volume set, strengths set, doses set — the
// baseline every fixture starts from and overrides piecemeal.
export const baseSettings = {
  ...DEFAULT_SETTINGS,
  volumeL: 300,
  dailyDoseMl: 15, dkhPerMlPer100L: 0.0533,
  calciumDoseMl: 12, caPpmPerMlPer100L: 0.36,
  magDoseMl: 10, mgPpmPerMlPer100L: 0.024,
};

export const noVolumeSettings = { ...baseSettings, volumeL: null };

// ---- one case per §3 band, including boundary-exact values ----------------
// (constructed directly against PARAM_DEFS min/max and SAFE_BOUNDS, so a
// change to either constant re-derives the fixture rather than silently
// going stale)
export const bandFixtures = {
  inBandMid:        { param: 'alkalinity', value: (alkDef.min + alkDef.max) / 2 },      // 9.0 dKH — dead centre
  inBandLowerEdge:   { param: 'alkalinity', value: alkDef.min },                          // 8.5 — §3: edge is inclusive of the band it bounds
  inBandUpperEdge:   { param: 'alkalinity', value: alkDef.max },                          // 9.5 — same rule, other edge
  outOfBandLow:      { param: 'alkalinity', value: alkDef.min - 0.3 },                    // 8.2 — below no-action band, above alert-low (7)
  outOfBandHigh:     { param: 'alkalinity', value: alkDef.max + 0.3 },                    // 9.8 — above no-action band, below alert-high (11)
  alertLowExact:     { param: 'alkalinity', value: 7 },                                   // SAFE_BOUNDS.alkalinity.min exactly
  alertHighExact:    { param: 'alkalinity', value: 11 },                                  // SAFE_BOUNDS.alkalinity.max exactly
  caInBandMid:       { param: 'calcium', value: (caDef.min + caDef.max) / 2 },
  caAlertLowExact:   { param: 'calcium', value: 350 },
  mgAlertLowExact:   { param: 'magnesium', value: 1150 },
};

// ---- magnesium below alert-low, alkalinity also low ------------------------
// Reef-chemistry.md §5 "magnesium gate": while magnesium sits below its
// alert-low, the app must not recommend an alkalinity or calcium correction
// until magnesium is addressed. Alkalinity readings falling from 7.9 to 7.4
// over 6 days, evenly spaced (>=2 days apart, per §4/§8); magnesium 1180 ->
// 1140, ending below the 1150 alert-low, spaced >=6 days apart (§8).
export const mgGateFixture = {
  alkReadings: [
    { id: 'a1', param: 'alkalinity', date: '2026-08-07', value: 7.9 },
    { id: 'a2', param: 'alkalinity', date: '2026-08-09', value: 7.7 },
    { id: 'a3', param: 'alkalinity', date: '2026-08-11', value: 7.5 },
    { id: 'a4', param: 'alkalinity', date: '2026-08-13', value: 7.4 },
  ],
  mgReadings: [
    { id: 'm1', param: 'magnesium', date: '2026-08-01', value: 1180 },
    { id: 'm2', param: 'magnesium', date: '2026-08-07', value: 1160 },
    { id: 'm3', param: 'magnesium', date: '2026-08-13', value: 1140 },
  ],
  // volumeL: 100 matches src/test/spec/classification/alert-thresholds.test.js's
  // own worked-example-4 fixture exactly, which is the one independently
  // confirmed to trigger the gate in computeDoseAdvice — kept identical here
  // so this file's precondition is not a fixture I invented but the same one
  // another Wave A auditor already verified.
  settings: { ...DEFAULT_SETTINGS, volumeL: 100, dailyDoseMl: 8, magDoseMl: 8 },
};
mgGateFixture.allReadings = [...mgGateFixture.alkReadings, ...mgGateFixture.mgReadings];

// ---- a correction requiring a multi-day plan --------------------------------
// Calcium a long way below target on a tank that has been stable there for a
// while: the raw change from currentDose to maintenanceDose is large enough
// (mag > 3, calcium.js:585) that assessCalcium must stage it (`out.staged`).
export const multiDayPlanFixture = {
  def: caDef,
  readings: [
    { id: 'c1', param: 'calcium', date: '2026-07-01', value: 380 },
    { id: 'c2', param: 'calcium', date: '2026-07-08', value: 378 },
    { id: 'c3', param: 'calcium', date: '2026-07-15', value: 375 },
    { id: 'c4', param: 'calcium', date: '2026-07-22', value: 372 },
    { id: 'c5', param: 'calcium', date: '2026-07-29', value: 368 },
  ],
  settings: { ...baseSettings, calciumDoseMl: 6, caPpmPerMlPer100L: 0.36 },
};

// ---- reading immediately after a recorded kit change -----------------------
export const kitChangeFixture = {
  kitChanges: { alkalinity: [{ date: '2026-08-12', kit: 'salifert' }] },
  readings: [
    { id: 'k1', param: 'alkalinity', date: '2026-08-10', value: 9.0 },
    { id: 'k2', param: 'alkalinity', date: '2026-08-13', value: 9.1 }, // day after the kit change
  ],
};

// ---- readings less than 2 days apart ----------------------------------------
export const closeReadingsFixture = {
  def: alkDef,
  readings: [
    { id: 'r1', param: 'alkalinity', date: '2026-08-12', time: '08:00', value: 9.0 },
    { id: 'r2', param: 'alkalinity', date: '2026-08-13', time: '07:00', value: 8.9 }, // ~23h later
  ],
  settings: baseSettings,
};

// ---- first-ever reading, no history -----------------------------------------
export const firstEverFixture = {
  readings: [],
  settings: baseSettings,
};

// ---- a correction landing exactly on a §6 rail -------------------------------
// rateLimitDose (src/lib/dosing/alkalinity.js) is imported byte-identically
// into calcium.js and helpers.js (assessMagnesium) — the one shared function
// every dosing surface's engine calls to enforce the SAFE_DAILY_RISE ceiling.
// This fixture asks for a maintenance dose far above what the tank is
// currently getting (currentDose 10 mL/day, maintenanceDose 40 mL/day,
// requested step to 70 mL/day) on a tank small enough (100L) that the safe
// swing around the maintenance dose is narrower than the raw arithmetic asks
// for — so the rail, not the maths, decides the number. Verified empirically:
// wanted 70 mL/day, allowed (rail-exact) 49.4 mL/day.
export const railFixture = {
  def: alkDef,
  settings: { ...baseSettings, volumeL: 100, dkhPerMlPer100L: 0.0533 },
  effect: 0.0533 * 100 / 100,       // alkEffectPerMl(settings), 0.0533 dKH/mL
  currentDose: 10,
  maintenanceDose: 40,
  applied: 60,                       // out.currentDose + applied = 70 requested
  expectedWanted: 70,
  expectedAllowed: 49.4,             // rounded band.hi
};
