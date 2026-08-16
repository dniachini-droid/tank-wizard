/* Stage 6a — `classifyReading`, tested against canon's own worked examples.
 *
 * THE-ENGINE-PLAN-v2.md Stage 6a. Every vector below is quoted from
 * `docs/spec/reef-chemistry.md` or `docs/spec/wizard-states.md` and cited at
 * its assertion. Nothing here is taken from the current app's behaviour: the
 * sixteen classifiers this function replaces are the reasoning being replaced,
 * so a test that agreed with them would be inheriting it.
 *
 * The canon sources, once, so each block below can cite a section rather than
 * restate it:
 *   wizard-states.md §13  the seven bands and the boundary rules
 *   wizard-states.md §22  the six steadiness verdicts, the alert tier, and
 *                         "unknown refuses"
 *   wizard-states.md §24.5 the refusal that still states the position
 *   reef-chemistry.md §2  target range, midpoint, safe bounds
 *   reef-chemistry.md §4  analysis windows and test cadences
 *   reef-chemistry.md §5  one noise floor per parameter, all absolute
 *   reef-chemistry.md §10 magnesium's alert-low floor at the safe bound
 *   reef-chemistry.md §11 the movement rule — magnitude or persistence
 *   reef-chemistry.md §18 alert thresholds, and the validation this function
 *                         is named in
 *   reef-chemistry.md §23 worked examples 6, 9 and 10
 *   reef-chemistry.md §26 position is the last reading
 *   reef-chemistry.md §27 out, and clearly out
 *   reef-chemistry.md §29 phosphate and nitrate
 *   reef-chemistry.md §30 the three evidence bars
 */
import { describe, expect, it } from 'vitest'
import {
  classifyReading,
  ANALYSIS_WINDOW_DAYS,
  CLEARLY_OUT_MARGIN,
  MOVEMENT_RATE_PER_DAY,
  NOISE_FLOOR,
  SPREAD_TOLERANCE,
  STEADINESS_VERDICTS,
  TEST_CADENCE_DAYS,
} from '../../../lib/classify/classify-reading.js'

/* ---------------------------------------------------------------- helpers */

const DAY = 86400000;
const BASE = Date.parse('2026-08-16T09:00:00Z');

// A series ending at BASE, one reading every `everyDays`, oldest first.
const series = (values, everyDays = 2) =>
  values.map((value, i) => ({ value, date: new Date(BASE - (values.length - 1 - i) * everyDays * DAY).toISOString() }));

// The shortest input that still classifies: one reading, a range.
const one = (parameter, value, range, extra = {}) =>
  classifyReading({ parameter, range, readings: [{ value, date: new Date(BASE).toISOString() }], ...extra });

const ALK = { min: 8.2, max: 8.8 };      // §2 layer 3
const CA = { min: 400, max: 450 };       // §2 layer 3
const MG = { min: 1275, max: 1425 };     // §2 layer 3
const PO4 = { min: 0.03, max: 0.10 };    // §29.2 layer 3
const NO3 = { min: 5, max: 15 };         // §29.2 layer 3

/* A wider alkalinity range, used where a movement vector needs room to run
 * without the reading leaving the range. It is as wide as §18's own defaults
 * allow: alert-low is midpoint − 1.0 dKH, so a range wider than 2.0 dKH puts
 * its own lower edge below its alert level, which §18 calls a configuration
 * error. 7.6–9.4 sits exactly on that limit. */
const WIDE_ALK = { min: 7.6, max: 9.4 };

/* One valid range per parameter, at canon's own suggested figures where it has
 * them (§2 layer 3, §29.2 layer 3) and at the app's shipped defaults where
 * canon does not. Used where a test needs every parameter at once. */
const VALID_RANGE = {
  alkalinity: ALK,
  calcium: CA,
  magnesium: MG,
  nitrate: NO3,
  phosphate: PO4,
  salinity: { min: 34, max: 36 },
  potassium: { min: 380, max: 420 },
  ammonia: { min: 0, max: 0.25 },
  ph: { min: 7.8, max: 8.4 },
};
const MID_SERIES = {
  alkalinity: [8.4, 8.5, 8.6, 8.5],
  calcium: [420, 425, 430, 425],
  magnesium: [1330, 1350, 1370, 1350],
  nitrate: [9, 10, 11, 10],
  phosphate: [0.05, 0.06, 0.07, 0.06],
  salinity: [34.8, 35.0, 35.2, 35.0],
  potassium: [395, 400, 405, 400],
  ammonia: [0, 0, 0, 0],
  ph: [8.1, 8.2, 8.3, 8.2],
};

const refusalCodes = (r) => r.refusals.map((x) => x.code);

/* ------------------------------------------- §13 — the seven, and no others */

describe('§13 — the vocabulary is exactly canon\'s seven bands', () => {
  const SEVEN = ['in-band', 'drifting', 'out-of-band-low', 'out-of-band-high',
    'alert-low', 'alert-high', 'insufficient-data'];

  it('every band this function can return is one of §13\'s seven', () => {
    const seen = new Set();
    // A sweep wide enough to reach every reachable band on a dosed element.
    for (let v = 6.0; v <= 11.0; v += 0.05) {
      seen.add(one('alkalinity', Number(v.toFixed(2)), ALK).band);
    }
    seen.add(classifyReading({ parameter: 'alkalinity', range: ALK, readings: [] }).band);
    seen.add(classifyReading({
      parameter: 'alkalinity', range: ALK, readings: series([8.30, 8.40, 8.50, 8.60]),
    }).band);
    for (const band of seen) expect(SEVEN).toContain(band);
  });

  it('exposes §22\'s six steadiness verdicts and no seventh', () => {
    expect(STEADINESS_VERDICTS).toEqual(
      ['dialled', 'controlled', 'steady-off', 'unsettled', 'loose', 'sliding']);
  });
});

/* ------------------------------------------------- §13 — the boundary rules */

describe('§13 boundary rules — edges are inclusive of the band they bound', () => {
  it('§23 worked example 9: alk exactly on the lower edge 8.2 is in range', () => {
    expect(one('alkalinity', 8.2, ALK).band).toBe('in-band');
  });

  it('a reading exactly on the upper edge 8.8 is in range', () => {
    expect(one('alkalinity', 8.8, ALK).band).toBe('in-band');
  });

  it('§23 worked example 10: stored 8.849 classifies out of range, not on the displayed 8.8', () => {
    const r = one('alkalinity', 8.849, ALK);
    expect(r.band).toBe('out-of-band-high');
    expect(r.out).toBe(true);
  });

  it('classification never rounds — 8.8499 is out, 8.8 is in', () => {
    expect(one('alkalinity', 8.8499, ALK).band).toBe('out-of-band-high');
    expect(one('alkalinity', 8.8, ALK).band).toBe('in-band');
  });

  it('a value exactly equal to alert-low is alert-low', () => {
    // §18: alert-low = midpoint − 1.0 = 8.5 − 1.0 = 7.5
    expect(one('alkalinity', 7.5, ALK).range.alertLow).toBe(7.5);
    expect(one('alkalinity', 7.5, ALK).band).toBe('alert-low');
    expect(one('alkalinity', 7.51, ALK).band).toBe('out-of-band-low');
  });

  it('a value exactly equal to alert-high is alert-high', () => {
    expect(one('alkalinity', 9.5, ALK).band).toBe('alert-high');
    expect(one('alkalinity', 9.49, ALK).band).toBe('out-of-band-high');
  });
});

/* ------------------------------------- §26 — position is the last reading */

describe('§26 — position comes from the last reading and nothing else', () => {
  // §26's own table of four sentences the app used to print from a fitted
  // value while quoting the raw reading. Every one of these is in band.
  const table = [
    ['alkalinity', 8.5, ALK],
    ['calcium', 405, CA],
    ['calcium', 445, CA],
    ['magnesium', 1260, { min: 1250, max: 1400 }],
  ];
  for (const [parameter, value, range] of table) {
    it(`${parameter} ${value} against ${range.min}–${range.max} is in range`, () => {
      expect(one(parameter, value, range).band).toBe('in-band');
      expect(one(parameter, value, range).out).toBe(false);
    });
  }

  it('the last reading answers position even when the series is falling steeply through it', () => {
    // A series whose fit at the last timestamp sits below the range while the
    // reading itself is inside it. §26: history is never used to assert where
    // the level is now.
    const r = classifyReading({
      parameter: 'alkalinity', range: ALK,
      readings: series([9.4, 9.0, 8.6, 8.25]),
    });
    expect(r.reading.value).toBe(8.25);
    expect(r.out).toBe(false);
    expect(['in-band', 'drifting']).toContain(r.band);
  });

  it('reports which reading it used, so no surface can substitute another', () => {
    const r = classifyReading({ parameter: 'alkalinity', range: ALK, readings: series([8.9, 8.5, 8.3]) });
    expect(r.reading.value).toBe(8.3);
    expect(Date.parse(r.reading.date)).toBe(BASE);
  });

  it('takes the latest reading whatever order the series arrives in', () => {
    const rows = series([8.9, 8.5, 8.3]);
    const shuffled = [rows[1], rows[2], rows[0]];
    expect(classifyReading({ parameter: 'alkalinity', range: ALK, readings: shuffled }).reading.value).toBe(8.3);
  });
});

/* ----------------------------------------- §27 / §29.3 — out, clearly out */

describe('§27 — out has no margin', () => {
  it('calcium 455 against a 400–450 range is out', () => {
    const r = one('calcium', 455, CA);
    expect(r.out).toBe(true);
    expect(r.band).toBe('out-of-band-high');
  });

  it('a level 0.1 ppm past the edge is out and is said to be out', () => {
    expect(one('calcium', 450.1, CA).out).toBe(true);
    expect(one('calcium', 399.9, CA).out).toBe(true);
  });

  it('§27\'s worked figure: calcium 384, sixteen below a 400–450 range, is out', () => {
    expect(one('calcium', 384, CA).out).toBe(true);
  });

  it('§27\'s worked figure: alkalinity 7.93 against 8.2–8.8 is out', () => {
    expect(one('alkalinity', 7.93, ALK).out).toBe(true);
  });
});

describe('§27 — clearly out is a fixed distance past the edge, in the parameter\'s own unit', () => {
  it('the three margins are canon\'s: alkalinity 0.5 dKH, calcium 50 ppm, magnesium 50 ppm', () => {
    expect(CLEARLY_OUT_MARGIN.alkalinity).toBe(0.5);
    expect(CLEARLY_OUT_MARGIN.calcium).toBe(50);
    expect(CLEARLY_OUT_MARGIN.magnesium).toBe(50);
  });

  it('§29.3 adds phosphate 0.10 ppm and nitrate 10 ppm', () => {
    expect(CLEARLY_OUT_MARGIN.phosphate).toBe(0.10);
    expect(CLEARLY_OUT_MARGIN.nitrate).toBe(10);
  });

  it('calcium 455 is out but not clearly out — the margin is 50, not 5', () => {
    expect(one('calcium', 455, CA).clearlyOut).toBe(false);
  });

  it('calcium 384 is out but not clearly out', () => {
    expect(one('calcium', 384, CA).clearlyOut).toBe(false);
  });

  it('calcium 501 is clearly out high', () => {
    expect(one('calcium', 501, CA).clearlyOut).toBe(true);
  });

  it('§27: every row it moved sat between 0.204 and 0.408 dKH past the edge — all out, none clearly out', () => {
    for (const past of [0.204, 0.3, 0.408]) {
      expect(one('alkalinity', 8.8 + past, ALK).out).toBe(true);
      expect(one('alkalinity', 8.8 + past, ALK).clearlyOut).toBe(false);
      expect(one('alkalinity', 8.2 - past, ALK).out).toBe(true);
      expect(one('alkalinity', 8.2 - past, ALK).clearlyOut).toBe(false);
    }
  });

  it('0.5 dKH past the edge is clearly out — the margin is inclusive of the level it names', () => {
    expect(one('alkalinity', 8.8 + 0.5, ALK).clearlyOut).toBe(true);
  });

  it('a level inside the range is never clearly out', () => {
    expect(one('calcium', 425, CA).clearlyOut).toBe(false);
    expect(one('calcium', 425, CA).out).toBe(false);
  });

  it('§29.3: at the suggested phosphate range, clearly-out-low is arithmetically unreachable', () => {
    // 0.03 − 0.10 = −0.07 ppm. No reading can reach it.
    const r = one('phosphate', 0.02, PO4);
    expect(r.out).toBe(true);
    expect(r.clearlyOut).toBe(false);
  });

  it('§29.3: on a wider user range it becomes reachable — 0.20–0.40 is clearly out low at 0.10', () => {
    expect(one('phosphate', 0.10, { min: 0.20, max: 0.40 }).clearlyOut).toBe(true);
  });

  it('nitrate 26 against a 5–15 range is clearly out high', () => {
    expect(one('nitrate', 26, NO3).clearlyOut).toBe(true);
    expect(one('nitrate', 24, NO3).clearlyOut).toBe(false);
  });

  it('refuses clearly-out where canon names no margin, and says which margin is missing', () => {
    const r = one('potassium', 500, { min: 380, max: 420 });
    expect(r.out).toBe(true);
    expect(r.clearlyOut).toBeNull();
    expect(refusalCodes(r)).toContain('no-clearly-out-margin');
  });

  it('a parameter with no margin is not refused while it is in range — the margin governs only levels already out', () => {
    const r = one('potassium', 400, { min: 380, max: 420 });
    expect(r.out).toBe(false);
    expect(r.clearlyOut).toBe(false);
    expect(refusalCodes(r)).not.toContain('no-clearly-out-margin');
  });
});

/* --------------------------------------------- §18 — the alert thresholds */

describe('§18 — alert levels hang from the midpoint of whatever range the user set', () => {
  it('alkalinity: midpoint ± 1.0 dKH', () => {
    const r = one('alkalinity', 8.5, ALK);
    expect(r.range.alertLow).toBeCloseTo(7.5, 10);
    expect(r.range.alertHigh).toBeCloseTo(9.5, 10);
  });

  it('calcium: midpoint ± 50 ppm', () => {
    const r = one('calcium', 425, CA);
    expect(r.range.alertLow).toBe(375);
    expect(r.range.alertHigh).toBe(475);
  });

  it('magnesium: midpoint ± 200 ppm', () => {
    const r = one('magnesium', 1350, MG);
    expect(r.range.alertLow).toBe(1150);
    expect(r.range.alertHigh).toBe(1550);
  });

  it('the alert levels follow the user\'s range, not a default', () => {
    const r = one('alkalinity', 9.0, { min: 8.7, max: 9.3 });   // midpoint 9.0
    expect(r.range.alertLow).toBeCloseTo(8.0, 10);
    expect(r.range.alertHigh).toBeCloseTo(10.0, 10);
  });

  it('a user-set alert level overrides the derived one — §18 says all three are adjustable', () => {
    const r = one('alkalinity', 8.0, { ...ALK, alertLow: 8.05, alertHigh: 9.5 });
    expect(r.range.alertLow).toBe(8.05);
    expect(r.band).toBe('alert-low');
  });
});

describe('§10 — magnesium\'s alert-low is floored at §2\'s safe bound', () => {
  it('a range centred lower cannot push the act-now line below the harm point', () => {
    // 1150–1350, midpoint 1250, derived alert-low 1050 — floored to 1150.
    const r = one('magnesium', 1200, { min: 1150, max: 1350 });
    expect(r.range.alertLow).toBe(1150);
  });

  it('the floor changes nothing where the two agree — §2 layer 3 gives exactly 1150', () => {
    expect(one('magnesium', 1300, MG).range.alertLow).toBe(1150);
  });
});

describe('§18 — the parameters that gained a tier, and the two that deliberately have none', () => {
  it('ammonia: anything detectable is alert-high, and there is no alert-low', () => {
    const r = one('ammonia', 0.02, { min: 0, max: 0.25 });
    expect(r.band).toBe('alert-high');
    expect(r.range.alertLow).toBeNull();
  });

  it('ammonia at zero is not detectable and does not reach the alert tier', () => {
    expect(one('ammonia', 0, { min: 0, max: 0.25 }).band).toBe('in-band');
  });

  it('salinity: below 33 ppt is alert-low, above 36 ppt is alert-high — fixed levels, not offsets', () => {
    const range = { min: 34, max: 36 };
    expect(one('salinity', 32.5, range).band).toBe('alert-low');
    expect(one('salinity', 36.5, range).band).toBe('alert-high');
    expect(one('salinity', 35, range).band).toBe('in-band');
    expect(one('salinity', 33.5, range).range.alertLow).toBe(33);
    expect(one('salinity', 33.5, range).range.alertHigh).toBe(36);
  });

  it('potassium and pH have no alert tier at all — however far out they go', () => {
    for (const [parameter, range, low, high] of [
      ['potassium', { min: 380, max: 420 }, 200, 700],
      ['ph', { min: 7.8, max: 8.4 }, 6.5, 9.5],
    ]) {
      expect(one(parameter, low, range).range.alertLow).toBeNull();
      expect(one(parameter, high, range).range.alertHigh).toBeNull();
      expect(one(parameter, low, range).band).toBe('out-of-band-low');
      expect(one(parameter, high, range).band).toBe('out-of-band-high');
    }
  });

  it('phosphate and nitrate have no alert tier — §29.4\'s two fixed warnings serve that need', () => {
    expect(one('phosphate', 0.9, { min: 0.03, max: 0.10, }).range.alertHigh).toBeNull();
    expect(one('nitrate', 80, NO3).range.alertHigh).toBeNull();
    expect(one('nitrate', 80, NO3).band).toBe('out-of-band-high');
  });

  it('a parameter with no alert tier still has all seven bands available to it', () => {
    // §13: it simply never classifies into two of them. No surface may invent
    // a third position vocabulary for those parameters.
    const r = classifyReading({ parameter: 'ph', range: { min: 7.8, max: 8.4 }, readings: series([8.30, 8.31, 8.30]) });
    expect(['in-band', 'drifting']).toContain(r.band);
  });
});

describe('§18 — bands and alert thresholds may never overlap or invert; classifyReading validates on every call', () => {
  const bad = (range) => classifyReading({
    parameter: 'alkalinity', range,
    readings: [{ value: 8.5, date: new Date(BASE).toISOString() }],
  });

  it('an inverted range refuses with a configuration error', () => {
    const r = bad({ min: 9.0, max: 8.0 });
    expect(r.band).toBe('insufficient-data');
    expect(refusalCodes(r)).toContain('range-configuration');
  });

  it('an alert-low above the range\'s lower edge refuses', () => {
    const r = bad({ min: 8.2, max: 8.8, alertLow: 8.4, alertHigh: 9.5 });
    expect(r.band).toBe('insufficient-data');
    expect(refusalCodes(r)).toContain('range-configuration');
  });

  it('an alert-high below the range\'s upper edge refuses', () => {
    const r = bad({ min: 8.2, max: 8.8, alertLow: 7.5, alertHigh: 8.6 });
    expect(r.band).toBe('insufficient-data');
    expect(refusalCodes(r)).toContain('range-configuration');
  });

  it('an inverted alert pair refuses', () => {
    const r = bad({ min: 8.2, max: 8.8, alertLow: 9.6, alertHigh: 7.4 });
    expect(r.band).toBe('insufficient-data');
    expect(refusalCodes(r)).toContain('range-configuration');
  });

  it('the refusal names what is wrong rather than returning a bare code', () => {
    const r = bad({ min: 9.0, max: 8.0 });
    expect(r.refusals[0].missing.join(' ')).toMatch(/range/i);
  });

  it('a valid configuration produces no configuration refusal', () => {
    expect(refusalCodes(one('alkalinity', 8.5, ALK))).not.toContain('range-configuration');
  });
});

/* ---------------------------------------------------- §11 — the movement rule */

describe('§11 — the element thresholds, per day', () => {
  it('alkalinity is 0.10 dKH/day', () => {
    expect(MOVEMENT_RATE_PER_DAY.alkalinity).toBe(0.1);
  });

  it('calcium 5 ppm/week and magnesium 10 ppm/week mean the same rate — the conversion is arithmetic', () => {
    expect(MOVEMENT_RATE_PER_DAY.calcium).toBeCloseTo(5 / 7, 12);
    expect(MOVEMENT_RATE_PER_DAY.magnesium).toBeCloseTo(10 / 7, 12);
  });

  it('canon names a per-day threshold for the three dosed elements and no others', () => {
    expect(Object.keys(MOVEMENT_RATE_PER_DAY).sort()).toEqual(['alkalinity', 'calcium', 'magnesium']);
  });
});

describe('§11 first limb — the fitted daily rate exceeds the element\'s threshold', () => {
  it('alkalinity falling 0.15 a day is moving on the rate alone', () => {
    const r = classifyReading({
      parameter: 'alkalinity', range: ALK,
      readings: series([8.75, 8.45, 8.15, 7.85], 2),   // 0.15/day
    });
    expect(r.movement.moving).toBe(true);
    expect(r.movement.basis).toContain('rate');
    expect(r.movement.direction).toBe('down');
  });

  it('the threshold is exceeded, not merely met — exactly 0.10 a day does not fire the rate limb', () => {
    const r = classifyReading({
      parameter: 'alkalinity', range: WIDE_ALK,
      readings: series([8.6, 8.4, 8.2, 8.0], 2),       // exactly 0.10/day
    });
    expect(r.movement.limbs.rate).toBe('at-or-below');
  });
});

describe('§11 second limb — direction held, and the total across the window clears §5\'s floor', () => {
  it('canon\'s own case: 0.02 dKH/day for three days is noise', () => {
    // Three readings a day apart: total 0.04 dKH, below the 0.1 floor.
    const r = classifyReading({
      parameter: 'alkalinity', range: WIDE_ALK,
      readings: series([8.54, 8.52, 8.50], 1),
    });
    expect(r.movement.moving).toBe(false);
    expect(r.movement.limbs.persistence).toBe('below-floor');
  });

  it('canon\'s own case: the same rate for ten days is 0.2 dKH and it is real', () => {
    const r = classifyReading({
      parameter: 'alkalinity', range: WIDE_ALK,
      readings: series([8.70, 8.64, 8.58, 8.52, 8.44], 2.5),   // 10 days, 0.26 total
    });
    expect(r.movement.moving).toBe(true);
    expect(r.movement.basis).toContain('persistence');
  });

  it('a series that changes direction inside the window does not clear the persistence limb', () => {
    const r = classifyReading({
      parameter: 'alkalinity', range: WIDE_ALK,
      readings: series([8.30, 8.70, 8.30, 8.70, 8.35], 2),
    });
    expect(r.movement.limbs.persistence).toBe('direction-not-held');
    expect(r.movement.moving).toBe(false);
  });

  it('§30.1: two readings are a difference — three is what makes it a trend', () => {
    const two = classifyReading({
      parameter: 'alkalinity', range: ALK, readings: series([8.7, 8.3], 2),
    });
    expect(two.movement.moving).toBeNull();
    expect(refusalCodes(two)).toContain('too-few-readings');
  });

  it('the floor is §5\'s, per parameter — calcium needs 10 ppm across the window', () => {
    const quiet = classifyReading({
      parameter: 'calcium', range: CA, readings: series([428, 425, 422], 7),   // 6 ppm total
    });
    expect(quiet.movement.moving).toBe(false);
    const real = classifyReading({
      parameter: 'calcium', range: CA, readings: series([432, 425, 418], 7),   // 14 ppm total
    });
    expect(real.movement.moving).toBe(true);
  });

  it('exposes §5\'s table, all absolute, ammonia deliberately absent', () => {
    expect(NOISE_FLOOR).toEqual({
      alkalinity: 0.1, calcium: 10, magnesium: 30, nitrate: 1.0,
      phosphate: 0.01, salinity: 0.2, potassium: 20, ph: 0.1,
    });
    expect(NOISE_FLOOR.ammonia).toBeUndefined();
  });
});

describe('§11 — the rate limb is unavailable where canon names no threshold', () => {
  it('nitrate has a noise floor but no per-day threshold: the persistence limb still answers', () => {
    const r = classifyReading({
      parameter: 'nitrate', range: NO3, readings: series([6, 9, 12], 7),
    });
    expect(r.movement.limbs.rate).toBe('no-threshold-in-canon');
    expect(r.movement.moving).toBe(true);
    expect(r.movement.basis).toEqual(['persistence']);
  });

  it('ammonia has no noise floor either — movement refuses outright', () => {
    const r = classifyReading({
      parameter: 'ammonia', range: { min: 0, max: 0.25 },
      readings: series([0, 0, 0], 2), windowDays: 14,
    });
    expect(r.movement.moving).toBeNull();
    expect(refusalCodes(r)).toContain('no-noise-floor');
  });
});

/* ----------------------------------------------- §13 — drifting is a band word */

describe('§13 — `drifting` is inside the range and moving toward an edge', () => {
  it('a level inside its range that is moving classifies drifting', () => {
    const r = classifyReading({
      parameter: 'alkalinity', range: ALK,
      readings: series([8.75, 8.60, 8.45, 8.30], 1),   // 0.15/day, all in range
    });
    expect(r.out).toBe(false);
    expect(r.band).toBe('drifting');
  });

  it('a level inside its range that is not moving classifies in-band', () => {
    const r = classifyReading({
      parameter: 'alkalinity', range: ALK,
      readings: series([8.50, 8.51, 8.50, 8.51], 2),
    });
    expect(r.band).toBe('in-band');
  });

  it('a level outside its range is never `drifting`, however fast it is moving', () => {
    const r = classifyReading({
      parameter: 'alkalinity', range: ALK,
      readings: series([8.60, 8.30, 8.00, 7.70], 1),
    });
    expect(r.movement.moving).toBe(true);
    expect(r.band).toBe('out-of-band-low');
  });

  it('§24.5: with too few readings the position is still stated, and the refusal names what is missing', () => {
    const r = classifyReading({
      parameter: 'alkalinity', range: ALK, readings: series([8.5], 2),
    });
    expect(r.band).toBe('in-band');            // "Alkalinity is 8.5 dKH, in your range"
    expect(r.movement.moving).toBeNull();      // "Two more readings will show which way it's going"
    expect(refusalCodes(r)).toContain('too-few-readings');
    expect(r.refusals.find((x) => x.code === 'too-few-readings').missing.join(' ')).toMatch(/2 more readings/);
  });
});

/* --------------------------------------------------- §4 — the analysis window */

describe('§4 / §29.7 — the analysis window, flat and never stretched', () => {
  it('carries canon\'s five windows and no others', () => {
    expect(ANALYSIS_WINDOW_DAYS).toEqual({
      alkalinity: 14, calcium: 28, magnesium: 28, phosphate: 14, nitrate: 28,
    });
  });

  it('carries canon\'s five test cadences', () => {
    expect(TEST_CADENCE_DAYS).toEqual({
      alkalinity: 2, calcium: 7, magnesium: 21, phosphate: 7, nitrate: 7,
    });
  });

  it('readings older than the window take no part in the movement claim', () => {
    // Four readings inside alkalinity's 14 days, one far outside it.
    const inside = series([8.50, 8.51, 8.50, 8.51], 2);
    const ancient = { value: 6.0, date: new Date(BASE - 200 * DAY).toISOString() };
    const r = classifyReading({ parameter: 'alkalinity', range: ALK, readings: [ancient, ...inside] });
    expect(r.window.readings).toBe(4);
    expect(r.movement.moving).toBe(false);
  });

  it('refuses to reach: too few readings inside the window is a refusal, not a wider window', () => {
    const r = classifyReading({
      parameter: 'alkalinity', range: ALK,
      readings: [
        { value: 8.9, date: new Date(BASE - 90 * DAY).toISOString() },
        { value: 8.7, date: new Date(BASE - 60 * DAY).toISOString() },
        { value: 8.5, date: new Date(BASE).toISOString() },
      ],
    });
    expect(r.window.readings).toBe(1);
    expect(r.movement.moving).toBeNull();
    expect(refusalCodes(r)).toContain('too-few-readings');
  });

  it('§25.2: the caller may name the window, and the result says which one was graded', () => {
    const rows = series([8.9, 8.8, 8.7, 8.6, 8.5, 8.4], 5);   // 25 days of history
    const long = classifyReading({ parameter: 'alkalinity', range: ALK, readings: rows, windowDays: 90 });
    const short = classifyReading({ parameter: 'alkalinity', range: ALK, readings: rows });
    expect(long.window.days).toBe(90);
    expect(long.window.readings).toBe(6);
    expect(short.window.days).toBe(14);
    expect(short.window.readings).toBeLessThan(6);
  });

  it('refuses where canon names no window for the parameter', () => {
    const r = classifyReading({
      parameter: 'potassium', range: { min: 380, max: 420 }, readings: series([400, 402, 404], 30),
    });
    expect(r.window.days).toBeNull();
    expect(r.movement.moving).toBeNull();
    expect(refusalCodes(r)).toContain('no-analysis-window');
  });

  it('a caller-supplied window unblocks a parameter canon gives none for', () => {
    const r = classifyReading({
      parameter: 'potassium', range: { min: 380, max: 420 },
      readings: series([380, 400, 425], 10), windowDays: 30,
    });
    expect(r.window.days).toBe(30);
    expect(r.movement.moving).toBe(true);
  });
});

describe('§19 / §23 worked example 6 — a kit change splits the series', () => {
  it('readings before a recorded kit change do not combine with readings after it', () => {
    const rows = series([8.9, 8.7, 8.5, 8.3, 8.1], 2);
    const r = classifyReading({
      parameter: 'alkalinity', range: ALK, readings: rows,
      kitChangedAt: rows[3].date,
    });
    expect(r.window.readings).toBe(2);          // the change reading and the one after it
    expect(r.movement.moving).toBeNull();       // fresh baseline requested
    expect(refusalCodes(r)).toContain('too-few-readings');
  });
});

/* -------------------------------------------------- §22 — the steadiness axis */

describe('§22 — the steadiness verdict, and what it refuses', () => {
  it('canon registers the six words and names no threshold for any of them', () => {
    // §22: "It does not change any threshold, window or grading rule. It
    // registers the words." The tolerance table is therefore empty, and this
    // test is the record of that gap rather than a placeholder.
    expect(SPREAD_TOLERANCE).toEqual({});
  });

  it('an ungradeable parameter refuses and names what is missing, per §13\'s last row', () => {
    const r = classifyReading({
      parameter: 'alkalinity', range: ALK, readings: series([8.5, 8.4, 8.6, 8.5], 2),
    });
    expect(r.steadiness.verdict).toBeNull();
    expect(refusalCodes(r)).toContain('no-spread-tolerance');
    expect(r.steadiness.missing.join(' ')).toMatch(/tolerance/i);
  });

  it('it does not fall through to a graded verdict — the one thing §13\'s last row exists to prevent', () => {
    // Every parameter, at a valid range, with a gradeable window in front of
    // it: the refusal is about the missing tolerance and nothing else.
    for (const parameter of Object.keys(VALID_RANGE)) {
      const r = classifyReading({
        parameter, range: VALID_RANGE[parameter], windowDays: 30,
        readings: series(MID_SERIES[parameter], 3),
      });
      expect(refusalCodes(r)).not.toContain('range-configuration');
      expect(r.steadiness.verdict).toBeNull();
      expect(refusalCodes(r)).toContain('no-spread-tolerance');
    }
  });

  it('the window it would have graded is reported even while the verdict refuses', () => {
    const r = classifyReading({
      parameter: 'alkalinity', range: ALK, readings: series([8.4, 8.5, 8.6, 8.5], 2),
    });
    expect(r.steadiness.window.days).toBe(14);
    expect(r.steadiness.window.readings).toBe(4);
    expect(r.steadiness.spread).toBeCloseTo(0.2, 10);
  });
});

describe('§22 — a verdict never masks a position: the tier is the latest reading\'s band', () => {
  it('the tier is read from the last reading, not the median and not a fitted value', () => {
    const r = classifyReading({
      parameter: 'alkalinity', range: ALK,
      readings: series([8.5, 8.5, 8.5, 7.4], 2),   // steady all window, alert-low today
    });
    expect(r.band).toBe('alert-low');
    expect(r.steadiness.tier).toBe('alert');
  });

  it('§15\'s four registered severity tiers, and no fifth scale', () => {
    const tiers = {
      'in-band': 'calm', drifting: 'calm',
      'out-of-band-low': 'raised', 'out-of-band-high': 'raised',
      'alert-low': 'alert', 'alert-high': 'alert',
      'insufficient-data': 'unknown',
    };
    const cases = [
      ['alkalinity', 8.5, ALK], ['alkalinity', 8.0, ALK], ['alkalinity', 9.0, ALK],
      ['alkalinity', 7.4, ALK], ['alkalinity', 9.6, ALK],
    ];
    for (const [parameter, value, range] of cases) {
      const r = one(parameter, value, range);
      expect(r.steadiness.tier).toBe(tiers[r.band]);
    }
  });

  it('an ungradeable band renders in the unknown tier rather than falling through to a calm one', () => {
    const r = classifyReading({ parameter: 'alkalinity', range: { min: 9, max: 8 }, readings: series([8.5]) });
    expect(r.band).toBe('insufficient-data');
    expect(r.steadiness.tier).toBe('unknown');
  });
});

describe('§22 — the grading tree, once a tolerance exists', () => {
  /* Canon names the six verdicts and the condition each describes. It names no
   * figure for any of them, which is why SPREAD_TOLERANCE ships empty and the
   * verdict refuses. THE FIGURES BELOW ARE FICTIONAL and exist only to prove
   * the shape of the tree — that each of §22's six descriptions reaches its
   * own word, and no window reaches two. They are not a proposal, and no
   * surface may read them. See `.agent/stage-6a-gaps.md` gaps S-1 to S-3.
   */
  const FICTIONAL = { tight: 0.15, wide: 0.8, offRangeMeasure: 'median' };
  const graded = (values, everyDays = 2, range = ALK) => {
    SPREAD_TOLERANCE.alkalinity = FICTIONAL;
    try {
      return classifyReading({ parameter: 'alkalinity', range, readings: series(values, everyDays) });
    } finally {
      delete SPREAD_TOLERANCE.alkalinity;
    }
  };

  it('"held inside the band, tightly" → dialled', () => {
    expect(graded([8.50, 8.52, 8.48, 8.51]).steadiness.verdict).toBe('dialled');
  });

  it('"centred in the band, ordinary test-to-test variation" → controlled', () => {
    expect(graded([8.35, 8.65, 8.40, 8.60]).steadiness.verdict).toBe('controlled');
  });

  it('"swinging widely, no consistent direction" → loose', () => {
    expect(graded([8.30, 9.20, 8.35, 9.15], 2, WIDE_ALK).steadiness.verdict).toBe('loose');
  });

  it('"very steady, but settled off the band" → steady-off', () => {
    expect(graded([8.02, 8.04, 8.01, 8.03]).steadiness.verdict).toBe('steady-off');
  });

  it('"off the band, and moving about while it is there" → unsettled', () => {
    expect(graded([7.85, 8.15, 7.80, 8.10]).steadiness.verdict).toBe('unsettled');
  });

  it('"moving one way, fast" → sliding, and it outranks the spread words', () => {
    // §11's first limb is canon's only definition of fast movement.
    const r = graded([9.10, 8.80, 8.50, 8.20], 1, WIDE_ALK);
    expect(r.movement.limbs.rate).toBe('above');
    expect(r.steadiness.verdict).toBe('sliding');
  });

  it('a graded verdict is always one of §22\'s six', () => {
    for (const values of [[8.50, 8.52, 8.48], [8.35, 8.65, 8.40], [8.02, 8.04, 8.01], [7.85, 8.15, 7.80]]) {
      expect(STEADINESS_VERDICTS).toContain(graded(values).steadiness.verdict);
    }
  });

  it('the tier still comes from the last reading, not from the verdict', () => {
    const r = graded([8.50, 8.50, 8.50, 7.40]);
    expect(r.steadiness.verdict).not.toBeNull();
    expect(r.steadiness.tier).toBe('alert');
  });

  it('the table is empty again afterwards — no test leaks a figure into the app', () => {
    expect(SPREAD_TOLERANCE).toEqual({});
  });
});

/* ------------------------------------------------------------- the refusals */

describe('it refuses rather than guesses', () => {
  it('no readings at all: insufficient-data, naming the missing reading', () => {
    const r = classifyReading({ parameter: 'alkalinity', range: ALK, readings: [] });
    expect(r.band).toBe('insufficient-data');
    expect(refusalCodes(r)).toContain('no-reading');
  });

  it('no target range: insufficient-data, naming the missing range', () => {
    const r = classifyReading({ parameter: 'alkalinity', readings: series([8.5]) });
    expect(r.band).toBe('insufficient-data');
    expect(refusalCodes(r)).toContain('no-target-range');
  });

  it('an unknown parameter refuses rather than borrowing another parameter\'s thresholds', () => {
    const r = classifyReading({ parameter: 'iron', range: { min: 1, max: 2 }, readings: series([1.5]) });
    expect(r.band).toBe('insufficient-data');
    expect(refusalCodes(r)).toContain('unknown-parameter');
  });

  it('a non-numeric reading refuses', () => {
    const r = classifyReading({
      parameter: 'alkalinity', range: ALK,
      readings: [{ value: null, date: new Date(BASE).toISOString() }],
    });
    expect(r.band).toBe('insufficient-data');
    expect(refusalCodes(r)).toContain('no-reading');
  });

  it('a reading below what the kit resolves refuses, and names the resolution', () => {
    const r = one('phosphate', 0.004, PO4);
    expect(r.band).toBe('insufficient-data');
    expect(refusalCodes(r)).toContain('below-resolution');
    expect(r.refusals.find((x) => x.code === 'below-resolution').missing.join(' ')).toMatch(/0\.01 ppm/);
  });

  it('the resolution refusal is per parameter — nitrate below 1.0 ppm refuses, 1.0 does not', () => {
    expect(one('nitrate', 0.4, NO3).band).toBe('insufficient-data');
    expect(one('nitrate', 1.0, NO3).band).not.toBe('insufficient-data');
  });

  it('ammonia has no floor, so a zero reading classifies rather than refusing', () => {
    expect(one('ammonia', 0, { min: 0, max: 0.25 }).band).toBe('in-band');
  });

  it('every refusal names what is missing — none is a bare code', () => {
    const refusals = [
      classifyReading({ parameter: 'alkalinity', range: ALK, readings: [] }),
      classifyReading({ parameter: 'alkalinity', readings: series([8.5]) }),
      classifyReading({ parameter: 'iron', range: ALK, readings: series([8.5]) }),
      classifyReading({ parameter: 'alkalinity', range: ALK, readings: series([8.5, 8.4]) }),
      classifyReading({ parameter: 'potassium', range: { min: 380, max: 420 }, readings: series([400, 401, 402]) }),
      one('phosphate', 0.004, PO4),
    ].flatMap((r) => r.refusals);
    expect(refusals.length).toBeGreaterThan(5);
    for (const refusal of refusals) {
      expect(Array.isArray(refusal.missing)).toBe(true);
      expect(refusal.missing.length).toBeGreaterThan(0);
      expect(refusal.missing.every((m) => typeof m === 'string' && m.length > 3)).toBe(true);
      expect(typeof refusal.axis).toBe('string');
    }
  });
});

/* ------------------------------------------------------ the shape of the answer */

describe('the result carries one vocabulary and its own provenance', () => {
  it('names the parameter, the reading it used, and the range it judged against', () => {
    const r = one('alkalinity', 8.5, ALK);
    expect(r.parameter).toBe('alkalinity');
    expect(r.unit).toBe('dKH');
    expect(r.reading.value).toBe(8.5);
    expect(r.range.min).toBe(8.2);
    expect(r.range.max).toBe(8.8);
  });

  it('§15: the position field is called `range`, and no field is called `band` except §13\'s own band id', () => {
    const r = one('alkalinity', 8.5, ALK);
    expect(Object.keys(r)).toContain('range');
    expect(Object.keys(r).filter((k) => /band/i.test(k))).toEqual(['band']);
  });

  it('is a pure function of its input — the same input twice gives the same answer', () => {
    const input = { parameter: 'alkalinity', range: ALK, readings: series([8.6, 8.5, 8.4, 8.3]) };
    expect(classifyReading(input)).toEqual(classifyReading(input));
  });

  it('does not mutate the readings it was given', () => {
    const rows = series([8.6, 8.5, 8.4]);
    const before = JSON.stringify(rows);
    classifyReading({ parameter: 'alkalinity', range: ALK, readings: rows });
    expect(JSON.stringify(rows)).toBe(before);
  });
});
