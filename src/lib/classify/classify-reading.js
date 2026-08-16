/* classifyReading — THE-ENGINE-PLAN-v2.md Stage 6a.
 *
 * One function, one vocabulary, replacing the sixteen position classifiers
 * `.agent/engine-inventory.md` counted. Built alongside the existing code:
 * nothing calls it yet, no classifier is deleted, and the engines are
 * untouched.
 *
 * THE GOVERNING RULE (plan, "The governing rule"): this file is built from
 * canon alone — `docs/spec/reef-chemistry.md` and `docs/spec/wizard-states.md`.
 * Nothing here was read out of `findings.js`, `narrative-engine.js`,
 * `reading-meaning.js`, `stability-engine.js`, `state.js` or the three
 * engines, because those are the reasoning being replaced. Every figure below
 * cites the section it came from. Where canon does not answer a question, this
 * file **refuses and names what is missing** rather than filling the hole, and
 * the hole is written up in `.agent/stage-6a-gaps.md` for the owner.
 *
 * It answers four questions about one reading:
 *
 *   1. Which of §13's seven bands is it in?          (wizard-states.md §13)
 *   2. How steady has it been over the window?       (wizard-states.md §22)
 *   3. Is it moving?                                 (reef-chemistry.md §11)
 *   4. Is it out, and is it clearly out?             (reef-chemistry.md §26, §27)
 *
 * Two vocabularies, both registered, and they never substitute for each other:
 * §13's seven bands say *where this reading sits*; §22's six verdicts say
 * *how steady this has been*. §13 answers from the last reading and nothing
 * else (§26). §22 answers from the window and never from a single reading.
 *
 * `range` is the word for the user's two edges throughout — `wizard-states.md`
 * §15, 16 August: **band is canon's own word and never reaches a screen**. The
 * one field named `band` here is §13's band id, which is canon's own
 * identifier and is not app copy.
 */

/* ============================== canon's tables ==============================
 * Each is one figure per parameter, cited. No table below is derived from
 * another, and none may be: `reef-chemistry.md` §27 rule 3 — adjusting how
 * fast counts as moving must never change how far counts as out, and the
 * reverse.
 */

/* §5, amended 16 Aug — one noise floor per parameter, every figure absolute.
 * Percent mode is abolished. Ammonia is deliberately absent: it is graded on
 * detectability, not on movement, so there is nothing to fit a floor against. */
export const NOISE_FLOOR = {
  alkalinity: 0.1,
  calcium: 10,
  magnesium: 30,
  nitrate: 1.0,
  phosphate: 0.01,
  salinity: 0.2,
  potassium: 20,
  ph: 0.1,
};

/* §4, and §29.7 for the two nutrients — flat, never stretched. Canon names no
 * analysis window for salinity, potassium, pH or ammonia; those parameters
 * refuse unless the caller names a window (§25.2's selectable panel does). */
export const ANALYSIS_WINDOW_DAYS = {
  alkalinity: 14,
  calcium: 28,
  magnesium: 28,
  phosphate: 14,
  nitrate: 28,
};

/* §4, and §29.2 for the two nutrients — the test cadence, used here only to
 * say when the next reading is due when a claim is refused for want of one
 * (§23 worked example 5: "says when to test next"). */
export const TEST_CADENCE_DAYS = {
  alkalinity: 2,
  calcium: 7,
  magnesium: 21,
  phosphate: 7,
  nitrate: 7,
};

/* §11, 16 Aug — the first limb of the movement rule: the fitted daily rate
 * that counts as moving on its own. Canon: "0.10 dKH/day for alkalinity, and
 * the engines' existing CA_TREND and MG_TREND figures at their own scales,
 * 5 ppm/week for calcium and 10 ppm/week for magnesium. Those two are stated
 * per week and mean the same rate; the conversion is arithmetic, not a second
 * rule." Canon names a threshold for these three and no other parameter. */
export const MOVEMENT_RATE_PER_DAY = {
  alkalinity: 0.1,
  calcium: 5 / 7,
  magnesium: 10 / 7,
};

/* §27 (three) and §29.3 (two) — how far past the edge counts as *clearly* out,
 * in the parameter's own unit. Fixed figures, not scaled to band width. These
 * govern wording and nothing else: §27's same-day amendment forbids them
 * gating a recommendation, suppressing one, relaxing a constraint or changing
 * any figure. Canon names no margin for salinity, potassium, pH or ammonia. */
export const CLEARLY_OUT_MARGIN = {
  alkalinity: 0.5,
  calcium: 50,
  magnesium: 50,
  phosphate: 0.10,
  nitrate: 10,
};

/* §18 — the default alert thresholds, hung from the midpoint of whatever
 * target range the user set (§2's derived anchor, never a stored value).
 * All `[user]` adjustable, so a caller-supplied level wins. */
export const ALERT_OFFSET = {
  alkalinity: 1.0,
  calcium: 50,
  magnesium: 200,
};

/* §18, added 16 Aug — the two parameters whose tier is a fixed level rather
 * than an offset from a midpoint. Salinity is sourced: below 31 kills coral
 * over prolonged exposure and at 38 soft corals melt, so 33/36 sits outside
 * where anyone runs and not yet at harm. Ammonia's target is zero, so there is
 * no edge to hang a margin from — the tier fires above whatever the kit can
 * resolve, which is the `detectable` rule below. */
export const ALERT_FIXED = {
  salinity: { low: 33, high: 36 },
};
export const ALERT_DETECTABLE = ['ammonia'];

/* §10 — magnesium's alert-low is floored at §2's safe bound. §2's layers must
 * not invert: layer 1 is where sources describe harm and the alert is the
 * earlier, act-now signal, so an act-now line below the harm point is
 * incoherent. It bites only while a magnesium range is centred lower than
 * §2 layer 3's 1275–1425. */
export const ALERT_LOW_FLOOR = {
  magnesium: 1150,
};

/* §22 — the six consistency verdicts, registered 14 Aug, `drifting` renamed
 * `unsettled`. Six verdicts and seven bands, and nothing else: a surface
 * inventing a seventh is a finding, exactly as §13 says of the bands. */
export const STEADINESS_VERDICTS = ['dialled', 'controlled', 'steady-off', 'unsettled', 'loose', 'sliding'];

/* §22 — the spread each verdict is graded against.
 *
 * DELIBERATELY EMPTY. §22 registers the six words and says in terms that it
 * "does not change any threshold, window or grading rule"; no section of
 * either canon document names a spread, a tolerance, or the measure that
 * decides whether a *window* sits off the range. The four thresholds that
 * answered this in the old layer are `CONSISTENCY_RULES`, which is the
 * reasoning Stage 6a exists to stop inheriting — §11 retires it from movement
 * grading and leaves it alive only "where §22's steadiness verdicts need a
 * spread", without saying what the figures should be.
 *
 * So the verdict refuses, by §22's own rule: "A verdict is produced only where
 * consistency can actually be graded. Where it cannot — no tolerance rule for
 * the parameter, or a metric that cannot be computed — the surface refuses and
 * names what is missing." The grading tree below is written and tested; the
 * moment the owner supplies a row here it starts producing verdicts.
 *
 * A row is `{ tight, wide, offRangeMeasure }` — the spread at or under which a
 * window is held tightly, the spread at or over which it is swinging widely,
 * both in the parameter's own unit, and which measure decides that the window
 * sits off the range ('median' | 'mean' | 'all-readings'). All three are
 * missing from canon; see `.agent/stage-6a-gaps.md` gaps S-1 to S-3. */
export const SPREAD_TOLERANCE = {};

/* §15's colour registry, 16 August — four severity tiers, not six, and they
 * are §13's bands rather than a fifth severity scale. §22: every verdict
 * carries the tier of the latest reading's §13 band and renders no calmer
 * than it. */
const BAND_TIER = {
  'in-band': 'calm',
  drifting: 'calm',
  'out-of-band-low': 'raised',
  'out-of-band-high': 'raised',
  'alert-low': 'alert',
  'alert-high': 'alert',
  'insufficient-data': 'unknown',
};

/* The parameters this function knows about, and the unit each figure above is
 * stated in. A parameter absent from this list refuses rather than borrowing
 * another parameter's thresholds — `reef-chemistry.md` §12's last line: the
 * app never judges one parameter by another parameter's thresholds, trend
 * logic or evidence bar. */
const UNITS = {
  alkalinity: 'dKH',
  calcium: 'ppm',
  magnesium: 'ppm',
  nitrate: 'ppm',
  phosphate: 'ppm',
  salinity: 'ppt',
  potassium: 'ppm',
  ammonia: 'ppm',
  ph: '',
};

const DAY_MS = 86400000;

/* A float guard, not a chemistry margin. Comparisons happen at stored
 * precision and never round (§13's boundary rules), but a stored value that
 * lands exactly on a threshold must not flip on the last bit of a double —
 * `reef-chemistry.md` §27 records `action: "increase"` for a change of zero as
 * exactly that fault, one engine comparing 10.8 against 10.799999999999999.
 * Scaled to the figure being compared so it means the same at 0.01 ppm
 * phosphate as at 1600 ppm magnesium. */
const near = (magnitude) => Math.abs(magnitude) * 1e-9 + Number.EPSILON;
const exceeds = (value, threshold) => value > threshold + near(threshold);
const reaches = (value, threshold) => value >= threshold - near(threshold);

const isNum = (n) => typeof n === 'number' && Number.isFinite(n);

/* ================================ the function ============================ */

/**
 * Classify one reading against the user's target range.
 *
 * @param {object} input
 * @param {string} input.parameter   a key of UNITS above
 * @param {object} [input.range]     `{ min, max, alertLow?, alertHigh? }` — the
 *                                   user's two edges (§2 layer 2), and their
 *                                   alert levels where they have set them
 *                                   (§18, all three `[user]` adjustable)
 * @param {Array}  [input.readings]  `[{ value, date }]`, any order
 * @param {number} [input.windowDays] the window to grade over. Defaults to §4's
 *                                   analysis window for the parameter; §25.2's
 *                                   panel passes the window the keeper picked
 * @param {string|number|Date} [input.kitChangedAt] a recorded kit change —
 *                                   readings before it do not combine with
 *                                   readings after it (§19, §23 example 6)
 * @returns {object} one classification, in one vocabulary
 */
export function classifyReading(input) {
  const { parameter, range: rangeInput, readings, windowDays, kitChangedAt } = input || {};
  const refusals = [];
  const refuse = (axis, code, ...missing) => { refusals.push({ axis, code, missing }); };

  const unit = UNITS[parameter];
  const known = typeof unit === 'string';
  if (!known) refuse('band', 'unknown-parameter', `no canon thresholds for "${parameter}"`);

  /* ---- the last reading. §26: position is always the last reading. History
   * is for trend, direction, consumption and dose; it is never used to assert
   * where the level is now. */
  const rows = (Array.isArray(readings) ? readings : [])
    .filter((r) => r && isNum(r.value) && Number.isFinite(Date.parse(r.date ?? r.at)))
    .map((r) => ({ value: r.value, date: r.date ?? r.at, t: Date.parse(r.date ?? r.at) }))
    .sort((a, b) => a.t - b.t);
  const last = rows[rows.length - 1] || null;
  if (!last) refuse('band', 'no-reading', 'a reading with a numeric value and a date');

  /* ---- the range, and §18's validation, which names this function: "the
   * bands and the alert thresholds must never be allowed to overlap or invert.
   * `classifyReading` validates this on every call and returns
   * `insufficient-data` with a configuration error." */
  const range = resolveRange(parameter, rangeInput, refuse);

  /* ---- below what the kit resolves. §5 states the floor as the smallest
   * difference the app may found a claim on, and gives phosphate's 0.01 as
   * "the kit's own resolution — anything smaller is beneath measurement".
   * A level under it is a level the app cannot honestly place. Ammonia has no
   * floor by decision and is exempt: §18 grades it on detectability. */
  const floor = known ? NOISE_FLOOR[parameter] : undefined;
  const belowResolution = !!(last && isNum(floor) && Math.abs(last.value) < floor - near(floor));
  if (belowResolution) {
    refuse('band', 'below-resolution',
      `a reading the kit can resolve — ${parameter} reads to ${floor}${unit ? ` ${unit}` : ''} (§5)`);
  }

  /* ---- the window everything after this point is graded over. §4: flat, with
   * no extension. Refuse rather than reach. */
  const window = resolveWindow(parameter, windowDays, rows, last, kitChangedAt, refuse);

  /* ---- is it moving? §11, as amended 16 August. */
  const movement = gradeMovement(parameter, window, floor, refuse);

  /* ---- which band? §13. */
  const bandBlocked = !known || !last || !range.valid || belowResolution;
  const band = bandBlocked ? 'insufficient-data' : classifyBand(parameter, last.value, range, movement);

  /* ---- out, and clearly out. §26 and §27, from the last reading and never a
   * fitted value. */
  const position = gradePosition(parameter, last, range, bandBlocked, refuse);

  /* ---- how steady has it been? §22. */
  const steadiness = gradeSteadiness(parameter, band, window, movement, range, refuse);

  return {
    parameter: parameter ?? null,
    unit: known ? unit : null,
    reading: last ? { value: last.value, date: last.date } : null,
    band,
    range: range.reported,
    out: position.out,
    clearlyOut: position.clearlyOut,
    movement,
    steadiness,
    window: window.reported,
    refusals,
  };
}

/* ------------------------------------------------------------ the range ---- */

function resolveRange(parameter, given, refuse) {
  const blank = { valid: false, reported: { min: null, max: null, alertLow: null, alertHigh: null, alertHighRule: null } };
  const src = given || {};
  if (!isNum(src.min) || !isNum(src.max)) {
    refuse('band', 'no-target-range', 'a target range — a minimum and a maximum, per §2 layer 2');
    return blank;
  }

  /* §2, 16 August: the user sets a minimum and a maximum, and where canon
   * needs a single anchor inside the range it is the midpoint, derived on the
   * spot and never stored. */
  const midpoint = (src.min + src.max) / 2;

  const offset = ALERT_OFFSET[parameter];
  const fixed = ALERT_FIXED[parameter];
  const detectable = ALERT_DETECTABLE.includes(parameter);

  let alertLow = isNum(src.alertLow) ? src.alertLow
    : isNum(offset) ? midpoint - offset
      : fixed ? fixed.low : null;
  const alertHigh = isNum(src.alertHigh) ? src.alertHigh
    : isNum(offset) ? midpoint + offset
      : fixed ? fixed.high : null;

  /* §10 — the floor under magnesium's alert-low, at §2's safe bound. */
  if (isNum(alertLow) && isNum(ALERT_LOW_FLOOR[parameter])) {
    alertLow = Math.max(alertLow, ALERT_LOW_FLOOR[parameter]);
  }

  const reported = {
    min: src.min,
    max: src.max,
    alertLow: isNum(alertLow) ? alertLow : null,
    alertHigh: isNum(alertHigh) ? alertHigh : null,
    /* §18: ammonia's high tier is "anything detectable" — a rule, not a level,
     * because its target is zero and there is no edge to hang a margin from. */
    alertHighRule: detectable ? 'detectable' : null,
  };

  /* §18 — overlap or inversion is a configuration error, not something to
   * classify around. */
  const faults = [];
  if (src.min > src.max) faults.push(`the target range is inverted — minimum ${src.min} is above maximum ${src.max}`);
  if (isNum(reported.alertLow) && reported.alertLow > src.min) {
    faults.push(`alert-low ${reported.alertLow} sits above the target range's lower edge ${src.min}`);
  }
  if (isNum(reported.alertHigh) && reported.alertHigh < src.max) {
    faults.push(`alert-high ${reported.alertHigh} sits below the target range's upper edge ${src.max}`);
  }
  if (isNum(reported.alertLow) && isNum(reported.alertHigh) && reported.alertLow > reported.alertHigh) {
    faults.push(`the alert levels are inverted — alert-low ${reported.alertLow} is above alert-high ${reported.alertHigh}`);
  }
  if (faults.length) {
    refuse('band', 'range-configuration', ...faults);
    return { valid: false, reported };
  }
  return { valid: true, reported, midpoint };
}

/* ----------------------------------------------------------- the window ---- */

function resolveWindow(parameter, windowDays, rows, last, kitChangedAt, refuse) {
  const days = isNum(windowDays) ? windowDays
    : (parameter in ANALYSIS_WINDOW_DAYS ? ANALYSIS_WINDOW_DAYS[parameter] : null);
  if (!isNum(days)) {
    refuse('movement', 'no-analysis-window',
      `an analysis window for ${parameter} — §4 and §29.7 name one for alkalinity, calcium, magnesium, phosphate and nitrate only`);
    return { days: null, rows: [], reported: { days: null, readings: 0, from: null, to: null } };
  }
  if (!last) return { days, rows: [], reported: { days, readings: 0, from: null, to: null } };

  /* §19, and §23 worked example 6: readings across a recorded kit change do
   * not combine — the series splits at that point and a fresh baseline is
   * requested. */
  const cut = Number.isFinite(Date.parse(kitChangedAt)) ? Date.parse(kitChangedAt) : -Infinity;
  const from = Math.max(last.t - days * DAY_MS, cut);
  const inWindow = rows.filter((r) => r.t >= from);
  return {
    days,
    rows: inWindow,
    reported: {
      days,
      readings: inWindow.length,
      from: inWindow.length ? inWindow[0].date : null,
      to: inWindow.length ? inWindow[inWindow.length - 1].date : null,
    },
  };
}

/* --------------------------------------------------------- is it moving? ---- */

/* §11's movement rule, added 16 August. A level is moving if EITHER the fitted
 * daily rate exceeds the element's threshold, OR the direction has held
 * consistently across the window and the total movement over it clears §5's
 * noise floor. Both limbs are reported, so a caller can see which fired and
 * which was unavailable — canon names a rate threshold for three parameters
 * and a noise floor for eight. */
function gradeMovement(parameter, window, floor, refuse) {
  const blank = (limbs) => ({ moving: null, direction: null, ratePerDay: null, totalOverWindow: null, basis: [], limbs });

  if (!isNum(window.days)) {
    return blank({ rate: 'no-window', persistence: 'no-window' });
  }
  if (!isNum(floor)) {
    /* Ammonia. §5: graded on detectability, not on movement — its target is
     * zero, so there is nothing to fit a floor against. */
    refuse('movement', 'no-noise-floor',
      `a noise floor for ${parameter} — §5 records that it is graded on detectability, not on movement`);
    return blank({ rate: parameter in MOVEMENT_RATE_PER_DAY ? 'unavailable' : 'no-threshold-in-canon', persistence: 'no-noise-floor' });
  }

  const rows = window.rows;
  /* §12: the app never extrapolates a trend from fewer than 3 readings, and
   * §30.1 sets the bar at three — "one reading is notice, two is a signal,
   * three is a fact". §23 worked example 5 says the refusal names when to test
   * next. */
  if (rows.length < 3) {
    const short = 3 - rows.length;
    const cadence = TEST_CADENCE_DAYS[parameter];
    refuse('movement', 'too-few-readings',
      `${short} more reading${short === 1 ? '' : 's'} in the ${window.days}-day window — §30.1 needs three`,
      ...(isNum(cadence) ? [`the next test is due in ${cadence} days (§4)`] : []));
    return blank({ rate: 'too-few-readings', persistence: 'too-few-readings' });
  }

  const ratePerDay = fitDailyRate(rows);
  const totalOverWindow = rows[rows.length - 1].value - rows[0].value;

  /* First limb — magnitude. */
  const threshold = MOVEMENT_RATE_PER_DAY[parameter];
  const rateLimb = !isNum(threshold) ? 'no-threshold-in-canon'
    : !isNum(ratePerDay) ? 'unavailable'
      : exceeds(Math.abs(ratePerDay), threshold) ? 'above' : 'at-or-below';

  /* Second limb — persistence. "0.02 dKH/day for three days is noise. The same
   * rate for ten days is 0.2 dKH and it is real." Slope times window, not
   * slope alone; and §30.1 makes it a claim about consecutive readings rather
   * than about a fitted line, which is why this counts steps rather than
   * testing significance. */
  const held = directionHeld(rows);
  const persistenceLimb = !held ? 'direction-not-held'
    : reaches(Math.abs(totalOverWindow), floor) ? 'clears-floor' : 'below-floor';

  const basis = [];
  if (rateLimb === 'above') basis.push('rate');
  if (persistenceLimb === 'clears-floor') basis.push('persistence');

  const delta = totalOverWindow;
  return {
    moving: basis.length > 0,
    direction: Math.abs(delta) < near(floor) ? 'flat' : delta > 0 ? 'up' : 'down',
    ratePerDay,
    totalOverWindow,
    basis,
    limbs: { rate: rateLimb, persistence: persistenceLimb },
  };
}

/* Least squares over time in days. §26: trend, direction, consumption and
 * every rate the app quotes stay fitted — it is only *position* that moves to
 * the last reading. */
function fitDailyRate(rows) {
  const t0 = rows[0].t;
  const xs = rows.map((r) => (r.t - t0) / DAY_MS);
  const ys = rows.map((r) => r.value);
  const n = xs.length;
  const mx = xs.reduce((a, b) => a + b, 0) / n;
  const my = ys.reduce((a, b) => a + b, 0) / n;
  let num = 0, den = 0;
  for (let i = 0; i < n; i += 1) {
    num += (xs[i] - mx) * (ys[i] - my);
    den += (xs[i] - mx) ** 2;
  }
  return den === 0 ? null : num / den;
}

/* "The direction has held consistently across the window" — every step agrees
 * in sign, with at least one step that is not flat. */
function directionHeld(rows) {
  let sign = 0;
  for (let i = 1; i < rows.length; i += 1) {
    const step = rows[i].value - rows[i - 1].value;
    if (step === 0) continue;
    const s = step > 0 ? 1 : -1;
    if (sign === 0) sign = s;
    else if (s !== sign) return false;
  }
  return sign !== 0;
}

/* -------------------------------------------------------- which band? ---- */

/* §13's seven, and the boundary rules that go with them: band edges are
 * inclusive of the band they bound, a value exactly equal to alert-low is
 * alert-low, comparisons happen at stored precision, and classification never
 * rounds. The alert tier is tested first — where the two rules meet on one
 * value (magnesium's floored alert-low sitting exactly on the range's lower
 * edge, §10) the more serious reading is the honest one, and §22's tier rule
 * says a position must never be rendered calmer than it is. */
function classifyBand(parameter, value, range, movement) {
  const { min, max, alertLow, alertHigh, alertHighRule } = range.reported;

  if (alertHighRule === 'detectable') {
    /* §18: ammonia's tier "fires above whatever the kit can resolve". Canon
     * names no detection limit, so the app can only read a recorded value
     * greater than zero as detectable — gap A-1 in `.agent/stage-6a-gaps.md`. */
    if (value > 0) return 'alert-high';
  } else if (isNum(alertHigh) && reaches(value, alertHigh)) {
    return 'alert-high';
  }
  if (isNum(alertLow) && value <= alertLow + near(alertLow)) return 'alert-low';

  if (value > max + near(max)) return 'out-of-band-high';
  if (value < min - near(min)) return 'out-of-band-low';

  /* §13: `drifting` is a band word and means **inside** the band, trending
   * toward an edge. Where movement cannot be graded the app does not guess at
   * it — §24.5 states the position anyway ("Alkalinity is 8.5 dKH, in your
   * range. Two more readings will show which way it's going"), and the
   * movement axis carries the refusal. */
  return movement.moving === true ? 'drifting' : 'in-band';
}

/* --------------------------------------------- out, and clearly out ---- */

function gradePosition(parameter, last, range, blocked, refuse) {
  if (blocked || !last) return { out: null, clearlyOut: null };
  const { min, max } = range.reported;

  /* §27 rule 1: out has no margin. `inRange` / `above` / `below` test the last
   * reading against the range's two edges with nothing added to either. A
   * level 0.1 ppm past the edge is out and is said to be out. */
  const past = last.value > max + near(max) ? last.value - max
    : last.value < min - near(min) ? min - last.value
      : 0;
  const out = past > 0;

  /* §27 rule 2: clearly out is a fixed distance past the edge, in the
   * parameter's own unit, derived from nothing — not from a trend constant,
   * not from a kit noise floor, not from the band width. */
  /* The margin governs only levels already out — §27's audit: "0 rows changed
   * whose last reading is in band." A level inside its range needs no margin,
   * so a parameter canon gives none for is not refused while it is in range. */
  if (!out) return { out, clearlyOut: false };

  const margin = CLEARLY_OUT_MARGIN[parameter];
  if (!isNum(margin)) {
    refuse('position', 'no-clearly-out-margin',
      `a clearly-out margin for ${parameter} — §27 and §29.3 name one for alkalinity, calcium, magnesium, phosphate and nitrate only`);
    return { out, clearlyOut: null };
  }
  return { out, clearlyOut: reaches(past, margin) };
}

/* ----------------------------------------------- how steady has it been? ---- */

/* §22's second vocabulary. Graded over the window, from the spread or the
 * fitted rate of the readings in it — never from a single reading.
 *
 * The tier is §13's band of the *latest* reading (§26), not the median and not
 * a fitted value, and it is always reported: a steadiness verdict must never
 * mask a dangerous position, and an ungradeable parameter renders in the
 * unknown tier rather than falling through to a calm one (§15's four
 * registered severity colours, 16 August).
 *
 * The verdict itself refuses today, for the reason written on
 * `SPREAD_TOLERANCE` above. */
function gradeSteadiness(parameter, band, window, movement, range, refuse) {
  const values = window.rows.map((r) => r.value);
  /* A spread needs two readings to exist at all. One reading has no spread —
   * reporting zero would read as "perfectly steady", which is the shape of
   * claim §22 forbids being made from a single reading. */
  const spread = values.length >= 2 ? Math.max(...values) - Math.min(...values) : null;
  const base = { verdict: null, tier: BAND_TIER[band] ?? 'unknown', window: window.reported, spread, missing: [] };

  if (!isNum(window.days)) {
    base.missing = [`an analysis window for ${parameter} (§4)`];
    return base;
  }
  if (values.length < 3) {
    base.missing = [`three readings in the ${window.days}-day window — §22 grades a window, never a single reading`];
    refuse('steadiness', 'too-few-readings', ...base.missing);
    return base;
  }

  const tolerance = SPREAD_TOLERANCE[parameter];
  if (!tolerance || !isNum(tolerance.tight) || !isNum(tolerance.wide) || !tolerance.offRangeMeasure) {
    /* §22, "Unknown refuses": a verdict is produced only where consistency can
     * actually be graded. Where it cannot — no tolerance rule for the
     * parameter — the surface refuses and names what is missing, per §13's
     * last row. It does not fall through to a graded verdict, which is the one
     * thing that row exists to prevent. */
    base.missing = [
      `a spread tolerance for ${parameter} — §22 registers the six verdicts and names no threshold for any of them`,
      'the measure that decides whether a window sits off the range — median, mean, or every reading',
    ];
    refuse('steadiness', 'no-spread-tolerance', ...base.missing);
    return base;
  }

  const verdict = pickVerdict(spread, tolerance, movement, window, range);
  return { ...base, verdict: STEADINESS_VERDICTS.includes(verdict) ? verdict : null };
}

/* The six, from §22's own descriptions of them and nothing else:
 *
 *   sliding     moving one way, fast
 *   steady-off  very steady, but settled off the band
 *   unsettled   off the band, and moving about while it is there
 *   loose       swinging widely, no consistent direction
 *   dialled     held inside the band, tightly
 *   controlled  centred in the band, ordinary test-to-test variation
 *
 * The shape is canon's; the two figures and the off-range measure are the
 * caller's, because canon names none. */
function pickVerdict(spread, tolerance, movement, window, range) {
  if (movement.limbs.rate === 'above') return 'sliding';

  const { min, max } = range.reported;
  const values = window.rows.map((r) => r.value);
  const offRange = windowSitsOffRange(values, tolerance.offRangeMeasure, min, max);

  if (offRange) return spread <= tolerance.tight ? 'steady-off' : 'unsettled';
  if (spread >= tolerance.wide) return 'loose';
  return spread <= tolerance.tight ? 'dialled' : 'controlled';
}

function windowSitsOffRange(values, measure, min, max) {
  const off = (v) => v < min || v > max;
  if (measure === 'all-readings') return values.every(off);
  if (measure === 'mean') return off(values.reduce((a, b) => a + b, 0) / values.length);
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return off(sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2);
}
