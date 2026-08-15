import { SAFE_DAILY_RISE } from '../analytics/safe-rate.js'
import { fmtAmount, fmtVal } from '../analytics/time-in-range.js'
import { minutesOf, nowTime } from '../analytics/time-of-day.js'
import { dayNum } from '../analytics/water-changes.js'
import { todayStr } from '../dates.js'
import { alkAnomaly, alkFit, alkIntervals, alkStamp, applyDoseConstraints, directionConsistent, noteCurrentAndInterventions, rateLimitDose, trendConfirmed } from './alkalinity.js'
import { correctionPlanFor, correctionProgress, doseDriftedFrom, dosePlausible, gainingHold, mgEffectPerMl, missingDoseInputs, outOfBandWorsening, pendingCorrection } from './helpers.js'
import { strengthPlausible } from './magnesium.js'

/* --- Calcium dosing assessment ---
 *
 * Same architecture as the alkalinity protocol, but calcium is a different
 * animal and the constants reflect that. Calcium moves slowly and test
 * uncertainty is a large fraction of a week's real movement, so the engine is
 * deliberately more reluctant: weekly intervals rather than daily, a seven-day
 * wait after any change rather than forty-eight hours, and a strong preference
 * for confirming a small trend over a second week before touching anything.
 *
 * Everything learned building the alkalinity engine is carried over: timestamps
 * rather than reading counts, a window that starts at the last dose change,
 * separate maintenance and recommended figures, staged corrections with a
 * remembered destination, one-off corrections accounted for mathematically
 * rather than resetting the window, anomaly detection before action, and an
 * empirical solver for the effect-per-mL that everything else rests on.
 */

export const CA_TREND = {
  stable: 5,        /* ppm/week — below this, treat as test variation */
  small: 10,
  meaningful: 20,   /* at or above this, verify before acting */
};

/* reef-chemistry.md §27 — how far past the edge counts as CLEARLY out.
   A distance in ppm, never a rate. See `ALK_CLEARLY_OUT` in alkalinity.js for
   the full reasoning; the short version is that this line read
   `> CA_TREND.stable` — 5 ppm per WEEK against a distance in ppm — and moving
   the trend constant silently moved the out-of-band margin with it. */
export const CA_CLEARLY_OUT = 50;

export const CA_SETTLE_DAYS = 7;

export function caEffectPerMl(settings) {
  const per100 = Number(settings && settings.caPpmPerMlPer100L);
  const vol = Number(settings && settings.volumeL);
  if (!isFinite(per100) || !isFinite(vol) || vol <= 0 || per100 <= 0) return null;
  return (per100 * 100) / vol;
}

/* Solve the real ppm-per-mL from the tank's response across dose periods.
   Consumption cancels between two periods, so it need not be known. */
/* Solving a solution's real strength from how the level responded to dose
   changes. Calcium and magnesium ran as two 57-line functions that were 98%
   identical — the same algorithm typed twice, differing only in which element
   they read and how long a window each needs. Duplication like that is how
   correctionInProgress ended up wired into alkalinity alone: a fix lands in
   one copy and the others are quietly left behind. Alkalinity keeps its own
   solver because it genuinely differs. */
export const SLOW_SOLVERS = {
  /* Calcium needs a fortnight to show a slope worth trusting; magnesium moves
     slowly enough to need three weeks. */
  calcium: { doseField: "calciumDoseMl", minSpanDays: 12, effect: (st) => caEffectPerMl(st) },
  magnesium: { doseField: "magDoseMl", minSpanDays: 19, effect: (st) => mgEffectPerMl(st) },
};

export function solveSlowEffect(key, readings, doseLog, waterChanges, settings, corrections) {
  const cfg = SLOW_SOLVERS[key];
  if (!cfg) return { status: "nochanges" };

  const changes = (doseLog || [])
    .filter((d) => d.element === key && isFinite(d.ml))
    .sort((a, b) => alkStamp(a) - alkStamp(b));
  if (!changes.length) return { status: "nochanges" };

  const all = (readings || [])
    .filter((r) => r.param === key && isFinite(r.value))
    .sort((a, b) => alkStamp(a) - alkStamp(b));

  /* Anything the keeper did to the water ends the period: a water change or a
     one-off correction moved the level, and reading that as the daily dose
     responding teaches the solver the wrong strength. */
  const disturbances = [...(waterChanges || []), ...(corrections || [])].map((x) => alkStamp(x));
  const bounds = [];
  for (let i = 0; i < changes.length; i++) {
    bounds.push({
      from: alkStamp(changes[i]),
      to: i + 1 < changes.length ? alkStamp(changes[i + 1]) : Infinity,
      dose: changes[i].ml,
    });
  }
  const priorDose = Number(settings && settings[cfg.doseField]);
  if (isFinite(priorDose) && priorDose !== changes[0].ml) {
    bounds.unshift({ from: -Infinity, to: alkStamp(changes[0]), dose: priorDose });
  }

  const periods = [];
  for (const b of bounds) {
    const rows = all.filter((r) => {
      const t = alkStamp(r);
      if (t < b.from || t >= b.to) return false;
      return !disturbances.some((d) => d > b.from && d <= t);
    });
    if (rows.length < 3) continue;
    const spanDays = alkStamp(rows[rows.length - 1]) - alkStamp(rows[0]);
    if (spanDays < cfg.minSpanDays) continue;
    const f = alkFit(rows);
    if (!f) continue;
    periods.push({ dose: b.dose, slope: f.slope, n: rows.length, span: spanDays });
  }
  if (periods.length < 2) return { status: "needmore", periods: periods.length };

  /* Every pair of periods gives an estimate, weighted by how far apart the
     doses were: a small dose difference divides a small slope difference and
     amplifies the noise in both. */
  const ests = [];
  for (let i = 0; i < periods.length; i++) {
    for (let j = i + 1; j < periods.length; j++) {
      const dD = periods[i].dose - periods[j].dose;
      if (Math.abs(dD) < 1) continue;
      const k = (periods[i].slope - periods[j].slope) / dD;
      if (!isFinite(k) || k <= 0) continue;
      ests.push({ k, weight: Math.abs(dD) });
    }
  }
  if (!ests.length) return { status: "nospread", periods: periods.length };
  const wsum = ests.reduce((a, e) => a + e.weight, 0);
  const k = ests.reduce((a, e) => a + e.k * e.weight, 0) / wsum;
  const entered = cfg.effect(settings);
  return {
    status: "ok", k, pairs: ests.length, periods: periods.length, entered,
    pctOff: entered ? ((k - entered) / entered) * 100 : null,
    suggestedPer100L: settings && settings.volumeL
      ? Math.round((k * settings.volumeL / 100) * 10000) / 10000 : null,
  };
}

export function solveCaEffect(readings, doseLog, waterChanges, settings, corrections) {
  return solveSlowEffect("calcium", readings, doseLog, waterChanges, settings, corrections);
}


export function caBandOf(perWeek, outOfBandWorsening) {
  const a = Math.abs(perWeek);
  const rate = a < CA_TREND.stable ? "stable"
    : a < CA_TREND.small ? "small"
    : a < CA_TREND.meaningful ? "meaningful"
    : "significant";
  /* reef-chemistry.md §11 — same fix as alkBandOf, same reasoning: a level
     outside its band and still moving away is never graded stable, whatever
     the rate. Only ever promotes away from "stable". */
  return (rate === "stable" && outOfBandWorsening) ? "small" : rate;
}


/* Choose between a long context window and a shorter recent one.
 *
 * Both protocols say the same thing: older data gives context but must not
 * overpower a new sustained trend (calcium §36, magnesium §47). A month of
 * stability followed by a fortnight of steady decline averages out to a mild
 * drift, and the engine then holds while the tank empties. When the recent
 * window has enough readings of its own and shows a materially stronger trend,
 * it is the one that describes the tank now.
 */
export function pickTrendWindow(rows, recentDays, nowStamp, minWeekly) {
  if (rows.length < 4) return { rows, narrowed: false };
  const recent = rows.filter((r) => alkStamp(r) >= nowStamp - recentDays);
  if (recent.length === rows.length) return { rows, narrowed: false };
  /* Two readings a week apart is enough for a clearly meaningful movement,
     which is what both protocols allow for a single strong weekly interval. */
  const span = recent.length >= 2
    ? alkStamp(recent[recent.length - 1]) - alkStamp(recent[0]) : 0;
  if (recent.length < 2 || span < 6) return { rows, narrowed: false };
  const fullFit = alkFit(rows), recentFit = alkFit(recent);
  if (!fullFit || !recentFit) return { rows, narrowed: false };
  /* Two conditions, both necessary. The recent window has to be materially
     steeper than the whole period — a third again — and steep enough to matter
     on its own. Without the second test, a flat series with one noisy last
     reading narrows to a "trend" that is pure test error, which is how this
     started recommending dose cuts on a stable tank. */
  const recentWeekly = Math.abs(recentFit.slope) * 7;
  if (recentWeekly >= minWeekly
      && Math.abs(recentFit.slope) > Math.abs(fullFit.slope) * 1.3) {
    return { rows: recent, narrowed: true, fullSlope: fullFit.slope };
  }
  return { rows, narrowed: false };
}

/* Corrections that keep recurring mean the maintenance dose is short.
   A tank lifted back into range that sags out again within weeks is not
   asking for another lift; something is pulling it down continuously, and the
   daily dose is the thing that should answer that. */
export function repeatedCorrections(corrections, element, nowStamp, days = 70) {
  const recent = (corrections || [])
    .filter((c) => c.element === element && isFinite(c.ml) && c.ml > 0
      && alkStamp(c) >= nowStamp - days);
  return recent.length;
}

/* The element's own key, not a hardcoded "alkalinity". The block below was
   copied from assessAlkalinity into the calcium and magnesium engines and the
   key came with it, so both clamped their dose using alkalinity's 0.5-a-day
   rate limit. Calcium was held to 10.9-13.1 mL where its own limit allows
   0-54.8, and magnesium to 0-24.1 against 0-814.5.

   This is precisely the cost of three near-identical engines: a line that is
   right in one is wrong in the other two, and nothing compares them. */
export function assessCalcium({ readings, doseLog = [], waterChanges = [], settings, def,
                         now = null, plan = null, corrections = [] , correctionPlans = {} }) {
  const nowStamp = now != null ? now : (dayNum(todayStr()) + minutesOf(nowTime()) / 1440);
  const out = {
    ok: false, reason: null, element: "calcium",
    current: null, previous: null, target: null, currentDose: null, daysOnDose: null,
    used: [], trendPerDay: null, trendPerWeek: null, band: null, consistent: null,
    supplied: null, consumption: null, maintenanceDose: null,
    recommendedDose: null, action: "hold", explanation: "", nextCheck: "",
    anomaly: null, events: [], effectPerMl: null, effectSolved: null,
    activePlan: null, stage: null, stages: null, planTarget: null, nextTestDue: null,
    targetCorrection: null,
  };

  const effect = caEffectPerMl(settings);
  out.effectPerMl = effect;
  if (!effect) {
    out.reason = missingDoseInputs(settings, "calcium", "caPpmPerMlPer100L");
    return out;
  }
  out.effectSolved = solveCaEffect(readings, doseLog, waterChanges, settings, corrections);

  /* Only recent history can affect the answer, so older readings are dropped
     before sorting rather than after. Without this the cost of an assessment
     grows with the whole log — someone three years in would pay for every
     reading they had ever taken, on every render. */
  const caFloor = nowStamp - 400;
  const all = (readings || [])
    .filter((r) => r.param === "calcium" && isFinite(r.value) && alkStamp(r) >= caFloor)
    .sort((a, b) => alkStamp(a) - alkStamp(b));
  if (!all.length) { out.reason = "No calcium readings yet."; return out; }
  noteCurrentAndInterventions(out, all, def, doseLog, correctionPlans);
  /* The temporary correction plan, if one is running for this element.
     Read here so every engine exposes it identically. */
  out.correctionPlan = correctionProgress(
    correctionPlanFor(correctionPlans, def.key), def, readings, todayStr(), out.maintenanceDose);
  /* What remains of a correction the user started. Placed right after the
     latest reading is known, which every engine reaches — the earlier
     placement sat inside a branch calcium and magnesium never took, so
     neither could report a correction in progress at all. */
  out.correctionInProgress = pendingCorrection(corrections, def, out.current, todayStr(), settings, readings);
  /* `out.previous` was set here and nowhere else, and read by nothing —
     assessAlkalinity and assessMagnesium never set it at all. A field one copy
     of three grew and no consumer ever asked for. Removed. */
  out.target = { min: def.min, max: def.max };

  const changes = (doseLog || [])
    .filter((d) => d.element === "calcium" && isFinite(d.ml))
    .sort((a, b) => alkStamp(a) - alkStamp(b));
  const lastChange = changes.length ? changes[changes.length - 1] : null;
  out.currentDose = lastChange ? lastChange.ml : Number(settings.calciumDoseMl);
  if (!isFinite(out.currentDose)) {
    out.reason = "Set your daily calcium dose in Setup before this can be calculated.";
    return out;
  }

  const windowStart = lastChange ? alkStamp(lastChange) : -Infinity;
  out.daysOnDose = lastChange ? nowStamp - windowStart : null;

  if (plan && plan.target != null && plan.appliedDose != null) {
    out.activePlan = plan; out.planTarget = plan.target;
    out.stage = plan.stage; out.stages = plan.stages; out.nextTestDue = plan.nextTestAt || null;
  }

  /* Sections 36 and 7: three to four weeks of context, but only within the
     current dose period. Calcium wants a longer view than alkalinity. */
  const horizon = nowStamp - 28;
  let used = all.filter((r) => alkStamp(r) >= windowStart && alkStamp(r) >= horizon);
  if (used.length < 3) used = all.filter((r) => alkStamp(r) >= windowStart).slice(-4);
  /* The reading at the moment of the change anchors the new period. */
  if (lastChange) {
    const anchor = all
      .filter((r) => alkStamp(r) < windowStart && (windowStart - alkStamp(r)) <= 1)
      .sort((a, b) => alkStamp(b) - alkStamp(a))[0];
    if (anchor && !used.includes(anchor)) used = [anchor, ...used];
  }
  out.used = used;

  /* Section 18: a water change moves calcium independently. Regular weekly
     changes of similar size are part of normal behaviour (section 19), so only
     an unusual one is called out. */
  /* Routine water changes are part of the tank's normal behaviour and are left
     in the trend rather than flagged — a regular tenth-volume change is already
     reflected in the consumption the dose has to match. */

  /* Section 20: a manual correction is deliberate, and its contribution is
     known exactly — so it is subtracted rather than used to reset the window. */
  const corrList = (corrections || [])
    .filter((c) => c.element === "calcium" && isFinite(c.ml))
    .sort((a, b) => alkStamp(a) - alkStamp(b));
  const CORRECTION_DAYS = 3;
  if (corrList.length && used.length) {
    const addedBy = (stamp) => corrList.reduce((sum, c) => {
      const t = alkStamp(c);
      if (stamp <= t) return sum;
      return sum + c.ml * effect * Math.min(1, (stamp - t) / CORRECTION_DAYS);
    }, 0);
    const anchor = addedBy(alkStamp(used[0]));
    out.usedAdjusted = used.map((r) => ({ ...r, value: r.value - (addedBy(alkStamp(r)) - anchor) }));
  }
  let maths = out.usedAdjusted || used;
  /* Kept before any narrowing: the anomaly test needs the wider context. */
  const anomalyRows = maths;
  const caPick = pickTrendWindow(maths, 15, nowStamp, CA_TREND.small);
  if (caPick.narrowed) {
    maths = caPick.rows;
    out.narrowedWindow = true;
    out.fullWindowTrend = caPick.fullSlope * 7;
  }

  if (maths.length < 2) {
    out.reason = lastChange
      ? "Only one calcium reading since the dose changed. Hold and measure at the next weekly test."
      : "Two calcium readings are needed to see a trend. Hold the current dose and test again next week.";
    out.nextCheck = "Measure calcium at your next weekly test.";
    return out;
  }

  const spanDays = alkStamp(maths[maths.length - 1]) - alkStamp(maths[0]);
  if (spanDays <= 0) { out.reason = "Readings need to be on different days."; return out; }

  const fit = alkFit(maths);
  const intervals = alkIntervals(maths);
  out.trendPerDay = fit ? fit.slope : intervals[intervals.length - 1].perDay;
  out.trendPerWeek = out.trendPerDay * 7;
  /* Provisional — rate only. Promoted below, once fittedNow/above/below exist,
     if §11's grading (see `outOfBandWorsening` in helpers.js) says a "stable"
     reading is actually outside the band and still worsening. */
  out.band = caBandOf(out.trendPerWeek);
  out.consistent = directionConsistent(intervals, CA_TREND.stable * 0.5);
  out.intervals = intervals.length;

  /* Confidence in the slope itself, as with alkalinity. With a calcium kit
     resolving to about ±10 ppm, a single week can easily show 15 ppm of
     movement that is not there — so a trend has to be either repeated across
     weeks or statistically clear of its own scatter before it is acted on. */
  out.slopeSE = (() => {
    if (!fit || maths.length < 3 || !isFinite(fit.rmse)) return null;
    const xs = maths.map(alkStamp);
    const mx = xs.reduce((a, b) => a + b, 0) / xs.length;
    const sxx = xs.reduce((a, x) => a + (x - mx) ** 2, 0);
    if (!(sxx > 0)) return null;
    return fit.rmse / Math.sqrt(sxx);
  })();
  /* Three standard errors and three weeks: on weekly data a two-sigma test
     across a fortnight fires on noise often enough to matter. */
  out.confirmedByFit = trendConfirmed(out, maths.length, spanDays, CA_TREND.small);

  out.supplied = out.currentDose * effect;
  out.consumption = out.supplied - out.trendPerDay;
  out.maintenanceDose = out.consumption / effect;
  /* Refreshed here because correctionProgress runs long before maintenanceDose
     exists, so the plan it built could only ever replay the stored figure —
     the very staleness this was meant to fix. */
  if (out.correctionPlan) {
    out.correctionPlan = correctionProgress(
      correctionPlanFor(correctionPlans, def.key), def, readings, todayStr(), out.maintenanceDose);
  }

  /* A reef takes up roughly half a ppm to a ppm and a half of magnesium a day.
     An apparent consumption far above that is not consumption — it is the
     level falling for some other reason, and the maintenance formula cannot
     tell the two apart. Capping it keeps the daily dose a maintenance figure
     and hands the rest to a correction, which is where it belongs. */
  /* A reef takes up around half a ppm to a ppm of magnesium a day; the top end
     of anything credible is about one. Above that the arithmetic is describing
     a level problem wearing consumption's clothes. */

  /* Consumption can come out negative when the level is rising faster than the
     dose supplies — water changes with a richer salt will do it. The formula
     then produces a negative maintenance dose, which is not a thing anyone can
     pour, and the figure was being shown as "calculated maintenance −190 mL a
     day". Zero is the honest floor, with the situation named. */
  if (out.consumption < 0) {
    out.gaining = -out.consumption;
    out.consumption = 0;
    out.maintenanceDose = 0;
  }
  /* Checked here, before any branch, because a wrong strength poisons every
     path — including the ones that return "hold" while still printing a
     maintenance figure of a hundred millilitres a day. */
  out.anomaly = alkAnomaly(anomalyRows, alkFit(anomalyRows),
    Math.max(CA_TREND.meaningful * 2, (def.max - def.min) * 0.6));
  /* The reading is taken at face value. Flagging it is useful; refusing to
     calculate until it is repeated is not — the figures are the same either
     way, and the decision belongs to the person holding the test kit. */
  if (out.anomaly) {
    out.caution = `This reading sits well away from the ones before it, which pointed to about ${fmtVal(def, out.anomaly.expected)}${def.unit}. Worth a second test if anything about it felt off — otherwise the working below takes it as read.`;
  }

  const caStrength = strengthPlausible("calcium", settings);
  if (!caStrength.ok || !dosePlausible(out.maintenanceDose, settings)) {
    out.action = "implausible";
    out.reason = !caStrength.ok
      ? `The calcium strength in Setup is ${caStrength.value} ${caStrength.unit}, which is outside anything a real product delivers (${caStrength.lo}–${caStrength.hi}). Every millilitre figure here is derived from it, so they will all be wrong until it is corrected. A typical two-part calcium is around 0.36.`
      : `The working points to ${fmtAmount(out.maintenanceDose)} mL/day, which is not a real dose for ${fmtAmount(settings.volumeL)} L. The strength figure is the likely cause.`;
    out.nextCheck = "Correct the solution strength in Setup, and these figures will make sense.";
    return out;
  }

  /* The fitted line at the last timestamp, correction-adjusted. It sizes a
     one-off correction below; it does not say where calcium is. */
  const fittedNow = (fit && maths.length >= 3)
    ? maths.reduce((a, r) => a + r.value, 0) / maths.length
      + fit.slope * (alkStamp(maths[maths.length - 1])
        - maths.reduce((a, r) => a + alkStamp(r), 0) / maths.length)
    : out.current.value;
  out.fittedNow = fittedNow;
  /* §26, decided 14 Aug: position is the last reading — see the same block in
     `alkalinity.js`. Section 37's "judge where calcium sits from the pattern"
     is superseded: a single reading dropping to 445 on a tank that has held 470
     for a month is still where the only measurement puts it, and the engine
     said "calcium is below your range at 405ppm" against a band of 400–450. */
  const posNow = out.current.value;
  const inRange = posNow >= def.min && posNow <= def.max;
  const above = posNow > def.max;
  const below = posNow < def.min;
  /* §11's grading fix — see `outOfBandWorsening` above `doseDriftedFrom` in
     helpers.js for the two qualifiers and why this is shared across all
     three engines rather than copied per file. Only ever promotes away from
     the provisional "stable" set above; a rate that already read faster than
     that is untouched. */
  if (out.band === "stable") {
    out.band = caBandOf(out.trendPerWeek,
      outOfBandWorsening(above, below, out.trendPerDay, spanDays, def.key));
  }
  /* Sections 44 and 45: the same trend means different things depending on how
     close calcium already is to leaving the range. */
  const bandWidth = def.max - def.min;
  /* Close enough to the boundary that another week of the same movement would
     carry calcium out of range. 12% of the band puts 453 in a 450–500 range
     inside it and 462 comfortably outside it, which matches the protocol's own
     examples. And it only counts when the trend is heading toward that edge:
     490 falling is moving away from the top, not toward it. */
  const nearLower = inRange && (posNow - def.min) < bandWidth * 0.12;
  const nearUpper = inRange && (def.max - posNow) < bandWidth * 0.12;
  const headingDown = out.trendPerDay < 0, headingUp = out.trendPerDay > 0;
  out.nearEdge = (nearLower && headingDown) ? "lower"
    : (nearUpper && headingUp) ? "upper" : null;

  /* Sections 29, 30 and 56: verify a surprise before acting on it. */
  /* Calcium kits resolve to perhaps ±10 ppm, and four weekly points scatter
     widely around a fit. The floor has to sit above that scatter or ordinary
     noise gets reported as a testing error every other week. */
  const lastInterval = intervals[intervals.length - 1];
  const weekMove = lastInterval ? Math.abs(lastInterval.change) : 0;
  /* Sections 29 and 30: a large jump is suspect when it is out of character
     with the weeks around it. A steady 15 ppm a week for three weeks is a real
     trend; 2 ppm then 52 ppm is a reading to repeat. */
  const priorMoves = intervals.slice(0, -1).map((iv) => Math.abs(iv.change));
  /* Compared against the largest move the series has already made, not the
     median. A series alternating between two values has a median move of zero,
     which made every movement look exceptional. */
  const typicalMove = priorMoves.length ? Math.max(...priorMoves) : null;
  const outOfCharacter = typicalMove != null && weekMove > Math.max(CA_TREND.meaningful, typicalMove * 1.5);
  if (weekMove >= CA_TREND.meaningful && (intervals.length < 2 || outOfCharacter)) {
    out.caution = (out.caution ? out.caution + " " : "")
      + `That is a large move for calcium in ${fmtAmount(lastInterval.days)} days. If calcium and alkalinity fell together it is usually precipitation rather than consumption, which a bigger dose will not fix.`;
  }

  /* Sections 5, 41 and 49: seven days on a new dose before judging it. */
  const caEmergency = lastChange
    && ((out.current.value < def.min && out.trendPerDay < 0) || (out.current.value > def.max && out.trendPerDay > 0))
    && Math.abs(out.trendPerWeek) >= CA_TREND.meaningful;

  if (!caEmergency && lastChange && out.daysOnDose != null && out.daysOnDose < CA_SETTLE_DAYS) {
    if (weekMove >= CA_TREND.meaningful) {
      out.caution = (out.caution ? out.caution + " " : "")
        + `Calcium moved ${fmtAmount(weekMove)}${def.unit} since the dose changed, which is a lot this soon. Worth checking the dosing pump, the reservoir level and whether the intended dose is actually being delivered — but changing the dose again now would make the next reading impossible to interpret.`;
    }
    out.reason = `The calcium dose changed to ${fmtAmount(out.currentDose)} mL/day ${Math.round(out.daysOnDose)} days ago. Calcium moves slowly, so a full week on the new dose is needed before it means anything. Hold and measure at the next weekly test.`;
    out.nextCheck = `Measure calcium in about ${Math.max(1, Math.round(CA_SETTLE_DAYS - out.daysOnDose))} days.`;
    return out;
  }

  /* Sections 9, 27 and 48: hold unless the movement is credible — unless
     calcium is already outside the range and still moving away from it, where
     even a small persistent trend needs answering (section 24).

     §27, second decision: the gate is OUT OF BAND, by any amount. It was
     `caClearlyOut`, and that was the fault — a margin sized to describe how
     far out a level sits was deciding whether the app spoke at all, so raising
     it from 5 ppm to 50 made the app go quiet on calcium sixteen below its
     range. The margin below is wording only and must never come back here. */
  const caOutOfBand = above || below;
  const caClearlyOut = above ? (posNow - def.max) > CA_CLEARLY_OUT
    : below ? (def.min - posNow) > CA_CLEARLY_OUT : false;
  out.clearlyOut = caClearlyOut;
  const caRepeats = repeatedCorrections(corrections, "calcium", nowStamp);
  const caWorsening = caOutOfBand
    && (Math.abs(out.trendPerWeek) >= CA_TREND.stable || caRepeats >= 2)
    && ((below && out.trendPerDay <= 0) || (above && out.trendPerDay >= 0));
  if (out.band === "stable" && !caWorsening
      && !doseDriftedFrom(out.maintenanceDose, out.currentDose, def.key)) {
    out.ok = true; out.recommendedDose = out.currentDose; out.action = "hold";
    out.explanation = `Calcium moved ${fmtAmount(Math.abs(out.trendPerWeek))}${def.unit} a week, which is within what the test itself can resolve. The objective is a stable range rather than an identical number each week, so this is exactly what you want.`;
    out.nextCheck = "Measure again at your next weekly test.";

    /* Sections 21 and 22: a matched dose holds calcium wherever it sits. */
    if (!inRange) {
      const mid = (def.min + def.max) / 2;
      /* The fitted value, not the last raw reading. Magnesium already used
         this and the other two did not — the same block, one copy diverged.
         Fitted is the better answer: on a kit with 25 ppm of noise, whether
         the last reading landed on the high or low side of the sawtooth moved
         the correction by a third (112 ppm against 85). The fit is what the
         app trusts everywhere else it reasons about where a level actually
         is. */
      const toMid = Math.abs(mid - fittedNow);
      const oneOff = Math.round((toMid / effect) * 10) / 10;
      /* A one-off correction can only ever ADD. There is no additive that
         lowers alkalinity, calcium or magnesium — coming down happens by
         dosing less and waiting, which the advice below already says. Offering
         a "correction" in that direction invited an action that does not
         exist. Also withheld when the strength figure makes the amount absurd,
         because printing the number invites someone to dose it. */

      out.targetCorrection = !above
        ? {
            direction: "up", toMid,
            days: Math.max(2, Math.ceil(toMid / SAFE_DAILY_RISE[def.key])),
            ppmToRaise: Math.round(toMid * 100) / 100,
            ppmPerDay: Math.round((toMid / Math.max(2, Math.ceil(toMid / SAFE_DAILY_RISE[def.key]))) * 100) / 100,
            oneOffMl: oneOff,
            perDayMl: Math.round((SAFE_DAILY_RISE[def.key] / effect) * 10) / 10,
            /* Whether quoting the maintenance bottle is sensible at all: a lift
               this size is usually done with a stronger mix or the dry salt. */
            viaMaintenance: dosePlausible(oneOff / 5, settings),
          }
        : null;

      out.explanation += ` But it is holding at ${fmtVal(def, out.current.value)}${def.unit}, ${above ? "above" : "below"} your range — a matched dose will keep it there indefinitely.`;
      const repeats = repeatedCorrections(corrections, "calcium", nowStamp);
      if (repeats >= 2 && out.targetCorrection) {
        out.caution = (out.caution ? out.caution + " " : "")
          + `You have corrected calcium ${repeats} times in the last couple of months and it keeps sagging back. That points to the daily dose being short rather than the level needing another lift — a salt mix below your target, fed in by weekly water changes, is the usual cause. Raising the daily dose by around ${fmtAmount(out.targetCorrection.perDayMl)} mL would carry it instead.`;
      }
      out.nextCheck = above
        ? `Let it fall: hold this dose, or ease it down slightly, and allow consumption to bring calcium back toward the range. Do not chase it with a bigger reduction.`
        : out.targetCorrection
        ? `Raising it is a separate one-off correction of roughly ${fmtAmount(out.targetCorrection.oneOffMl)} mL spread over a few days — not a permanent increase, which would carry calcium past the range once it arrives. Keep the daily dose where it is.`
        : `Raising it needs a one-off correction rather than a bigger daily dose, but the amount cannot be worked out until the solution strength in Setup is right.`;
    }
    return out;
  }

  /* Section 43: a small movement waits for a second week, unless calcium is
     already close to leaving the range (sections 44 and 45). */
  if (out.band === "small" && !out.nearEdge
      && (out.intervals < 2 || out.consistent === false)) {
    out.ok = true; out.recommendedDose = out.currentDose; out.action = "hold";
    out.explanation = `Calcium moved ${fmtAmount(Math.abs(out.trendPerWeek))}${def.unit} a week, which is small for calcium and ${out.intervals < 2 ? "seen over only one interval" : "not consistent between intervals"}. At ${fmtVal(def, out.current.value)}${def.unit} it is comfortably inside your range, so there is time to confirm it.`;
    out.nextCheck = "If next week shows the same movement again, the trend is real and worth acting on.";
    return out;
  }

  /* Sections 7 and 48: 10–20 ppm a week is meaningful but not urgent, and one
     week of it is one measurement. Confirm it over a second week, or by the
     fit being clear of its own noise, unless calcium is close to leaving the
     range — where waiting another week costs more than acting early. */
  /* Section 58: the default is to hold unless there is credible evidence.
     While calcium is inside the range, "credible" means the movement repeated
     across weeks or the fit is clear of its own scatter — a single week is a
     single measurement whatever its size, and calcium is slow enough that
     waiting one more week costs almost nothing. */
  /* Applies to the 5–10 ppm band only. Section 48 is explicit that a 10–20 ppm
     weekly movement is actionable once confounding events are ruled out, so a
     wider gate than this would contradict the protocol rather than implement
     it. Noise beyond that is a kit problem, not a logic problem. */
  if (out.band === "small" && inRange && !out.nearEdge && !out.confirmedByFit
      && (out.intervals < 2 || out.consistent === false)) {
    out.ok = true; out.recommendedDose = out.currentDose; out.action = "hold";
    out.explanation = `Calcium moved ${fmtAmount(Math.abs(out.trendPerWeek))}${def.unit} a week, which would matter if it holds — but ${out.intervals < 2 ? "it has been seen over a single week, and one week is one measurement" : "the weeks disagree with each other"}. At ${fmtVal(def, out.current.value)}${def.unit} calcium is inside your range, so there is room to confirm before acting. Calcium moves slowly enough that a week's patience costs very little, and acting on noise costs a fortnight.`;
    out.nextCheck = "Measure again next week. If the same movement repeats, the trend is real and the dose should change.";
    return out;
  }

  /* Sections 23 to 26: direction relative to target matters more than the
     trend alone. */
  const movingToTarget = (above && out.trendPerDay < 0) || (below && out.trendPerDay > 0);
  if (movingToTarget) {
    out.ok = true; out.recommendedDose = out.currentDose; out.action = "hold";
    out.explanation = `Calcium is ${above ? "above" : "below"} your range at ${fmtVal(def, out.current.value)}${def.unit} and moving ${out.trendPerDay < 0 ? "down" : "up"} toward it at ${fmtAmount(Math.abs(out.trendPerWeek))}${def.unit} a week. That is the direction you want, so changing the dose now would work against it.`;
    out.nextCheck = `Reassess once calcium reaches ${fmtVal(def, def.min)}–${fmtVal(def, def.max)}${def.unit}.`;
    return out;
  }

  /* §24 — a negative consumption never sizes a dose change. The exemption is
     the level itself: at or over the top of the range and still rising still
     gets the reduction below, because that answer comes from where calcium is
     rather than from the consumption arithmetic. */
  if (out.gaining) {
    const levelWantsLess = (above && out.trendPerDay > 0) || out.nearEdge === "upper";
    if (!levelWantsLess) {
      return gainingHold(out, def, { intervals, waterChanges, corrections });
    }
  }

  /* Section 39 and 40: conservative sizing, because feedback is a week away. */
  const rawChange = out.maintenanceDose - out.currentDose;
  const mag = Math.abs(rawChange);
  const urgent = below || above || out.nearEdge != null
    || Math.abs(out.trendPerWeek) >= CA_TREND.meaningful;
  let applied;
  const caRescue = caEmergency || below || above;
  if (caRescue) applied = rawChange;
  else if (mag <= 1) applied = rawChange;
  else if (mag <= 3) applied = rawChange * 0.85;
  else applied = urgent ? rawChange * 0.6 : rawChange * 0.5;

  /* Declared here, not inside the block: the extraction moved the `let next`
     into the helper and left the callers assigning an undeclared name, which
     works only because this file is not in strict mode. */
  const limited = rateLimitDose(applied, out, def, settings, effect);
  if (limited.stop) return out;
  let next = limited.next;

  /* Bracketing, the step cap and the rate ceiling — one implementation for all
     three elements. */
  next = applyDoseConstraints(next, out, def, settings, readings, doseLog);

  out.ok = true;
  out.recommendedDose = next;
  out.action = next > out.currentDose ? "increase" : next < out.currentDose ? "decrease" : "hold";
  out.staged = mag > 3;

  if (out.staged) {
    const steps = [];
    let at = out.currentDose, guard = 0;
    while (Math.abs(out.maintenanceDose - at) > 1 && guard++ < 5) {
      const remaining = out.maintenanceDose - at;
      at = Math.round((at + (Math.abs(remaining) > 3 ? remaining * (urgent ? 0.6 : 0.5) : remaining)) * 10) / 10;
      steps.push(at);
    }
    if (Math.abs(out.maintenanceDose - at) > 0.05) steps.push(Math.round(out.maintenanceDose * 10) / 10);
    out.plan = steps;
  }

  out.explanation =
    `Calcium is ${out.trendPerDay < 0 ? "falling" : "rising"} ${fmtAmount(Math.abs(out.trendPerWeek))}${def.unit} a week across ${fmtAmount(spanDays)} days`
    + `${out.consistent ? ", in the same direction each week" : ""}`
    + `${out.nearEdge ? `, and at ${fmtVal(def, out.current.value)}${def.unit} it is already close to the ${out.nearEdge === "lower" ? "bottom" : "top"} of your range — which is why a smaller movement is being acted on than would be elsewhere` : ""}. `
    + `At ${fmtAmount(out.currentDose)} mL/day you are adding ${fmtAmount(out.supplied)}${def.unit} a day, so the tank is using about ${fmtAmount(out.consumption)}${def.unit} a day. `
    + `Replacing that exactly would take ${fmtAmount(out.maintenanceDose)} mL/day`
    + (out.staged ? `, which is a large change for calcium. Move part of the way and confirm over a week — feedback here is slow, so a wrong estimate costs a fortnight.` : `.`)
    + (out.narrowedWindow ? ` This reads the last fortnight rather than the full month, because the recent weeks are moving faster than the month as a whole — averaged over everything it would look like ${fmtAmount(Math.abs(out.fullWindowTrend))}${def.unit} a week, which would understate what is happening now.` : "");
  out.nextCheck = `Hold the new dose for a full week, then measure calcium again. Do not adjust again in between.`;
  return out;
}
