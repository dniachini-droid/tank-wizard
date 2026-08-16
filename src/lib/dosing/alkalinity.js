import { SAFE_DAILY_RISE, safeDoseBand } from '../analytics/safe-rate.js'
import { fmtAmount, fmtVal } from '../analytics/time-in-range.js'
import { minutesOf, nowTime } from '../analytics/time-of-day.js'
import { dayNum } from '../analytics/water-changes.js'
import { todayStr } from '../dates.js'
import { repeatedCorrections } from './calcium.js'
import { bracketDose, capDoseStep, correctionPlanFor, correctionProgress, doseAction, doseDriftedFrom, doseObservations, dosePlausible, gainingHold, missingDoseInputs, outOfBandWorsening, pendingCorrection } from './helpers.js'
import { strengthPlausible } from './magnesium.js'

/* --- Alkalinity dosing assessment ---
 *
 * Built to a written protocol rather than assembled from heuristics. The
 * ordering of the steps below mirrors that protocol deliberately, because the
 * order is what stops the engine reacting to a number without first asking
 * whether the number should be trusted.
 *
 * Three ideas do most of the work:
 *
 *  - Elapsed time comes from timestamps, never from counting readings. Three
 *    measurements span two days, not three.
 *  - A dose change starts a new assessment period. Readings from before it
 *    describe a tank that no longer exists, so they are not mixed in.
 *  - The calculated maintenance dose and the recommended next dose are
 *    different numbers. The first is arithmetic; the second accounts for
 *    uncertainty and moves in steps a tank can absorb.
 */

export const ALK_TREND = {
  stable: 0.10,        /* dKH/day — below this, treat as noise */
  mild: 0.20,
  meaningful: 0.30,    /* at or above this in ~24h, act early */
};

/* reef-chemistry.md §27 — how far past the edge counts as CLEARLY out.
 *
 * A distance in dKH, not a rate: it is measured against how far the level sits
 * beyond `def.min`/`def.max`, never against how fast it is moving. Out and
 * clearly out are two different questions — a level is out the moment it is
 * past the edge by any amount, and that test carries no margin at all
 * (`above`/`below`, below). This is the second question, and only this one.
 *
 * Fixed, not a fraction of the band: a keeper who widens their alkalinity band
 * has not decided that being far out matters less.
 *
 * Deliberately its own constant, and deliberately a bare number. It was a
 * literal 0.2 here and `CA_TREND.stable`/`MG_TREND.stable` — rate constants in
 * ppm per week — in the other two engines, which is the dimensional fault
 * `.agent/needs-dan.md` item 5 reported. Adjusting how fast counts as moving
 * must never change how far counts as out, so this must not be derived from
 * the trend constants; nor from the kit noise floors (`KIT_PRECISION`,
 * `KIT_SIGMA`), which answer a third question again — what the kit can see.
 * Pinned by `src/test/defects/clearly-out-margins.test.js`.
 */
export const ALK_CLEARLY_OUT = 0.5;

/* Hours the new dose must run before a routine reassessment. */
export const ALK_SETTLE_HOURS = 48;
export const ALK_EARLY_HOURS = 24;

/* Precise position in days, including time of day. */
/* Keyed on the record itself rather than on a string built from its fields.
   The cache was working — the cost was making the key: `date + "|" + time` on
   every call, then hashing it. Sorting ten years of readings calls this a few
   hundred thousand times, and it came to half the entire derivation.

   A WeakMap holds no strings and needs no size cap: entries vanish when the
   record does. It is also safer than stamping the object, because spreading a
   record produces a new object and therefore a fresh computation — a copy with
   an edited date cannot inherit the old stamp. */
export const STAMP_CACHE = new WeakMap();
export function alkStamp(r) {
  if (!r || !r.date) return 0;
  if (typeof r === "object") {
    const hit = STAMP_CACHE.get(r);
    if (hit !== undefined) return hit;
  }
  const mins = minutesOf(r.time);
  const v = dayNum(r.date) + (mins == null ? 0.5 : mins / 1440);
  if (typeof r === "object") STAMP_CACHE.set(r, v);
  return v;
}

/* How much alkalinity one millilitre of the solution adds to this tank.
   Configurable, and recalculated whenever volume or concentration changes. */
/* Solve for the real effect-per-mL from the tank's response to dose changes.
 *
 * Across two periods under different doses, consumption is assumed roughly
 * constant, so:
 *     s1 = D1*k - C     and     s2 = D2*k - C
 *     k  = (s1 - s2) / (D1 - D2)
 * where s is the measured slope and D the dose. Consumption cancels, which is
 * why this works without knowing it. */
export function solveAlkEffect(readings, doseLog, waterChanges, settings) {
  const changes = (doseLog || [])
    .filter((d) => (d.element || "alkalinity") === "alkalinity" && isFinite(d.ml))
    .sort((a, b) => alkStamp(a) - alkStamp(b));
  if (changes.length < 1) return { status: "nochanges" };

  const all = (readings || [])
    .filter((r) => r.param === "alkalinity" && isFinite(r.value))
    .sort((a, b) => alkStamp(a) - alkStamp(b));

  /* Periods of constant dose, bounded by changes and by anything that moves
     alkalinity independently. */
  const disturbances = [...(waterChanges || []), ...(settings && settings._corrections || [])]
    .map((x) => alkStamp(x));
  const bounds = [];
  for (let i = 0; i < changes.length; i++) {
    const from = alkStamp(changes[i]);
    const to = i + 1 < changes.length ? alkStamp(changes[i + 1]) : Infinity;
    bounds.push({ from, to, dose: changes[i].ml });
  }
  const first = changes[0];
  const priorDose = Number(settings && settings.dailyDoseMl);
  if (isFinite(priorDose) && priorDose !== first.ml) {
    bounds.unshift({ from: -Infinity, to: alkStamp(first), dose: priorDose });
  }

  const periods = [];
  for (const b of bounds) {
    const rows = all.filter((r) => {
      const t = alkStamp(r);
      if (t < b.from || t >= b.to) return false;
      return !disturbances.some((d) => d > b.from && d <= t);
    });
    if (rows.length < 3) continue;
    const span = alkStamp(rows[rows.length - 1]) - alkStamp(rows[0]);
    if (span < 1.5) continue;
    const f = alkFit(rows);
    if (!f) continue;
    periods.push({ dose: b.dose, slope: f.slope, n: rows.length, span, rmse: f.rmse });
  }
  if (periods.length < 2) return { status: "needmore", periods: periods.length };

  /* Every usable pair, weighted toward the larger dose separations, which
     resolve k better. */
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
  const spread = ests.length > 1
    ? Math.sqrt(ests.reduce((a, e) => a + (e.k - k) ** 2, 0) / (ests.length - 1))
    : null;

  const entered = alkEffectPerMl(settings);
  return {
    status: "ok", k, spread, pairs: ests.length, periods: periods.length,
    entered,
    pctOff: entered ? ((k - entered) / entered) * 100 : null,
    /* The figure to type into Setup, expressed the way Setup asks for it. */
    suggestedPer100L: settings && settings.volumeL
      ? Math.round((k * settings.volumeL / 100) * 10000) / 10000 : null,
  };
}

export function alkEffectPerMl(settings) {
  const per100 = Number(settings && settings.dkhPerMlPer100L);
  const vol = Number(settings && settings.volumeL);
  if (!isFinite(per100) || !isFinite(vol) || vol <= 0 || per100 <= 0) return null;
  return (per100 * 100) / vol;
}

/* Least-squares slope in dKH per day, with the residual spread that says how
   much to trust it. */
export function alkFit(rows) {
  const n = rows.length;
  if (n < 2) return null;
  const xs = rows.map(alkStamp), ys = rows.map((r) => r.value);
  const mx = xs.reduce((a, b) => a + b, 0) / n;
  const my = ys.reduce((a, b) => a + b, 0) / n;
  let sxy = 0, sxx = 0;
  for (let i = 0; i < n; i++) { sxy += (xs[i] - mx) * (ys[i] - my); sxx += (xs[i] - mx) ** 2; }
  if (sxx === 0) return null;
  const slope = sxy / sxx;
  let ss = 0;
  for (let i = 0; i < n; i++) {
    const pred = my + slope * (xs[i] - mx);
    ss += (ys[i] - pred) ** 2;
  }
  const rmse = n > 2 ? Math.sqrt(ss / (n - 2)) : 0;
  return { slope, rmse, spanDays: xs[xs.length - 1] - xs[0] };
}

/* Each consecutive pair, so a consistent decline can be told from two
   movements that happen to average out. */
export function alkIntervals(rows) {
  const out = [];
  for (let i = 1; i < rows.length; i++) {
    const days = alkStamp(rows[i]) - alkStamp(rows[i - 1]);
    if (days <= 0) continue;
    out.push({
      from: rows[i - 1], to: rows[i], days,
      change: rows[i].value - rows[i - 1].value,
      perDay: (rows[i].value - rows[i - 1].value) / days,
    });
  }
  return out;
}

export function alkBandOf(perDay, outOfBandWorsening) {
  const a = Math.abs(perDay);
  const rate = a < ALK_TREND.stable ? "stable"
    : a < ALK_TREND.mild ? "mild"
    : a < ALK_TREND.meaningful ? "meaningful"
    : "significant";
  /* reef-chemistry.md §11, decided 13 Aug — "the most dangerous defect": a
     level outside its band and moving further out is never graded stable,
     whatever the rate. A flat-rate threshold graded 0.02 dKH/day "stable" and
     held a dose for three simulated years while alkalinity fell past the safe
     floor. `outOfBandWorsening` is true only when both §11 qualifiers hold —
     movement away from the band, clearing the kit noise floor over the fitted
     window — computed by the caller, which is where the band edges and the
     fitted trend both already live. This only ever promotes away from
     "stable"; a trend that already reads faster than that is unaffected. */
  return (rate === "stable" && outOfBandWorsening) ? "mild" : rate;
}

/* A reading that contradicts everything around it should be re-tested rather
   than acted on. Flagged, never silently discarded. */
export function alkAnomaly(rows, fit, floor = 0.45) {
  /* Four readings, so the expectation is drawn from at least three points.
     Extrapolating from two and calling the third an anomaly flagged ordinary
     noise as a testing error. `floor` is the smallest deviation worth calling
     odd, and must be in the parameter's own units — a threshold of 0.45 is
     meaningful for dKH and meaningless for ppm. */
  if (rows.length < 4 || !fit) return null;
  const last = rows[rows.length - 1];
  const prior = rows.slice(0, -1);
  const pf = alkFit(prior);
  if (!pf) return null;
  const expected = prior[prior.length - 1].value
    + pf.slope * (alkStamp(last) - alkStamp(prior[prior.length - 1]));
  const residual = last.value - expected;
  const scale = Math.max(floor / 3, pf.rmse * 3);
  if (Math.abs(residual) < Math.max(floor, scale)) return null;

  /* A value the series has already produced cannot be out of character with
     it. Readings of 1520, 1560, 1560, 1560, 1520 were being flagged because a
     line through the first four slopes upward — driven entirely by the first
     point sitting low — and extrapolating it predicted 1582. The final 1520
     then looked 62 adrift, despite being identical to a reading in the same
     set. Comparing against the range the series actually occupies avoids
     trusting an extrapolation further than the data supports. */
  const prev = prior.map((r) => r.value);
  const lo = Math.min(...prev), hi = Math.max(...prev);
  const margin = Math.max(floor / 4, (hi - lo) * 0.25);
  if (last.value >= lo - margin && last.value <= hi + margin) return null;
  return { value: last.value, expected, residual, date: last.date, time: last.time };
}


/* Consistency of direction, ignoring movements too small to be real.
 *
 * Strict sign agreement treats a single sub-resolution wobble as the series
 * contradicting itself: readings of 9.2, 9.3, 9.0, 8.7 give intervals of
 * +0.1, -0.3, -0.3, and calling that "scattered" because of a 0.1 step means a
 * clear decline gets damped down to "re-test". `flat` is the movement below
 * which an interval carries no direction at all. */
export function directionConsistent(intervals, flat) {
  if (!intervals || intervals.length < 2) return null;
  const dirs = intervals
    .map((iv) => (Math.abs(iv.change) <= flat ? 0 : (iv.change > 0 ? 1 : -1)))
    .filter((d) => d !== 0);
  if (dirs.length < 2) return true;
  return dirs.every((d) => d === dirs[0]);
}

/* Everything between "the maths produced a figure" and "here is the answer":
   bracketing against observed doses, the step cap, and the rate ceiling.

   This was 110 lines, byte-identical, in all three assessment engines. Three
   copies of the same reasoning, and the copies did not stay in step — two of
   them clamped the dose using alkalinity's rate limit because the key was
   hardcoded when the block was pasted, holding calcium to 10.9-13.1 mL where
   its own limit allows 0-54.8.

   Every argument it needs is passed explicitly. `out` is mutated, as it was
   before, because the caller reads the diagnostic fields it sets. */
export function applyDoseConstraints(next, out, def, settings, readings, doseLog) {
  /* Bracketing, applied to the figure the maths produced. If the tank has run
     a dose where the level fell and another where it rose, the answer lies
     between them — a constraint noise cannot corrupt. Current direction wins
     over history, so a falling tank is never cut and a rising one never
     raised. */
  {
    const obs = doseObservations(doseLog, readings, def.key, out.effectPerMl, todayStr());
    const br = bracketDose(next, out.currentDose, out.trendPerDay || 0, obs, out.effectPerMl, todayStr());
    if (br) {
      let bracketed = br.dose;
      if ((out.trendPerDay || 0) < 0) bracketed = Math.max(bracketed, out.currentDose);
      if ((out.trendPerDay || 0) > 0) bracketed = Math.min(bracketed, out.currentDose);
      if (isFinite(bracketed) && bracketed > 0) {
        out.bracket = { low: br.low, high: br.high, from: next };
        next = Math.round(bracketed * 10) / 10;
      }
    } else if (obs.length) {
      /* No usable bracket — usually because a noisy reading made the implied
         consumption look unlike the tank's, so the pair was discarded. The
         weaker constraint still holds and is the one that stops the worst
         oscillation: never go below a dose the level recently FELL at, and
         never above one it recently ROSE at. Observing a fall at 8 mL rules
         out 7.7 whatever this window's arithmetic says. */
      /* The same coherence filter the bracket uses. Without it the floor was
         built from observations describing a tank that no longer exists — a
         fall at 8 mL held the dose up while alkalinity sat at 11 and climbing,
         which means consumption had collapsed and that observation was stale. */
      /* A looser filter than the bracket uses, deliberately. Interpolating
         between two observations needs them to describe the same tank state,
         so the bracket demands consumption within 25%. The floor makes a much
         weaker claim — "the level fell at 8 mL, so the answer is above 8" —
         and that survives a good deal of disagreement. At 25% the floor was
         being discarded on ordinary noise and the dose dropped to 7.7 anyway.
         Three-fold is the point where the two observations cannot both be
         describing the same tank at all. */
      const consNow2 = out.currentDose * out.effectPerMl - (out.trendPerDay || 0);
      const live2 = obs.filter((h) => {
        const consThen = h.dose * out.effectPerMl - h.rate;
        if (!(consThen > 0) || !(consNow2 > 0)) return false;
        return Math.max(consThen, consNow2) / Math.min(consThen, consNow2) <= 3;
      });
      const fell = live2.filter((h) => h.rate < 0).sort((a, b) => b.dose - a.dose)[0];
      const rose = live2.filter((h) => h.rate > 0).sort((a, b) => a.dose - b.dose)[0];
      if (fell && next < fell.dose) { out.bracketFloor = { at: fell.dose, from: next }; next = fell.dose; }
      if (rose && next > rose.dose) { out.bracketCeiling = { at: rose.dose, from: next }; next = rose.dose; }
    }

    /* Held to a quarter of the current dose unless the tank is genuinely in
       trouble, so one noisy window cannot produce a large swing. */
    const capped = capDoseStep(next, out.currentDose,
      out.current ? out.current.value : null, def, out.trendPerDay || 0);
    if (Math.abs(capped - next) > 0.05) {
      out.stepCapped = { wanted: Math.round(next * 10) / 10, allowed: Math.round(capped * 10) / 10 };
      next = Math.round(capped * 10) / 10;
    }

    /* The rate ceiling has to be the last word. Bracketing and the step cap
       both move the figure, and the rate limit was applied before them — so a
       bracket floor could push the dose back above the ceiling it had just
       been clamped to. Re-applied here so nothing can overrule how fast the
       level is allowed to move. */
    const finalBand = safeDoseBand(def.key, out.maintenanceDose, out.effectPerMl);
    if (finalBand) {
      /* Rounded inward, not to nearest. A band edge of 10.06 rounded to 10.1
         puts the recommendation back outside the limit it was just clamped to
         — a hundredth of a millilitre, but it is the difference between
         respecting the ceiling and not. */
      if (next > finalBand.hi) next = Math.floor(finalBand.hi * 10) / 10;
      if (next < finalBand.lo) next = Math.ceil(finalBand.lo * 10) / 10;
    }
  }
  return next;
}

/* From "the maths produced a figure" to "it is a real dose": rounding, the
   rate ceiling, and the plausibility check.

   Shared by all three elements, byte-identical. Alkalinity calls this too
   (see the call site further down in this file) and sets out.rateLimited
   just like calcium and magnesium, so where calcium says "we wanted 32 mL
   but the safe rate allows 14", alkalinity now says the same thing instead
   of clamping silently at the end. */
export function rateLimitDose(applied, out, def, settings, effect) {
  /* `applied` is the raw adjustment; the block below names its own `next`. */
  let next = Math.max(0, Math.round((out.currentDose + applied) * 10) / 10);

  /* The rate limit, applied last so it overrides everything above it including
     an emergency rescue. A tank that is genuinely low still must not be brought
     back faster than corals tolerate — the swing is the harm, not the level. */
  const band = safeDoseBand(def.key, out.maintenanceDose, effect);
  let clamped = next;
  if (band) {
    if (clamped > band.hi) clamped = Math.round(band.hi * 10) / 10;
    if (clamped < band.lo) clamped = Math.round(band.lo * 10) / 10;
  }
  if (Math.abs(clamped - next) > 0.05) {
    out.rateLimited = {
      wanted: next, allowed: clamped,
      perDay: SAFE_DAILY_RISE[def.key], unit: def.unit,
      days: Math.max(1, Math.ceil(Math.abs((next - clamped) * effect) / SAFE_DAILY_RISE[def.key])),
    };
    next = clamped;
  }

  if (!dosePlausible(next, settings)) {
    out.action = "implausible";
    out.reason = `The maths points to ${fmtAmount(next)} mL/day, which is not a real dose for a ${fmtAmount(settings.volumeL)} L tank. That means the solution strength in Setup is wrong rather than the tank being unusual — ${fmtAmount(out.effectPerMl)} ${def.unit} per mL would make this necessary, and a normal product is far stronger. Correct the strength and this will resolve itself.`;
    out.nextCheck = "Check the solution strength in Setup before dosing anything.";
    return { next, stop: true };
  }
  return { next, stop: false };
}

/* Has the trend earned the right to be acted on?
 *
 * Two conditions, and both matter. Statistical: the slope must exceed three
 * standard errors over at least twenty days — on weekly data a two-sigma test
 * across a fortnight fires on noise often enough to matter. And practical: a
 * tightly-measured 6 ppm a week is still only 6 ppm a week, so the movement
 * must also be large enough to be worth acting on.
 *
 * Calcium and magnesium each carried this, identical but for their own
 * threshold constant and a differently-worded comment. Written once, with the
 * threshold passed in. */
export function trendConfirmed(out, readingCount, spanDays, smallTrend) {
  return out.slopeSE != null && out.slopeSE > 0
    && readingCount >= 4
    && Math.abs(out.trendPerWeek) >= smallTrend
    && Math.abs(out.trendPerDay) > out.slopeSE * 3
    && spanDays >= 20;
}

/* Three result fields were removed here rather than kept: out.events,
   out.correctionAdjusted and out.correctionRepeats. Each was assigned and read
   by nothing — correctionRepeats a leftover from a change that was reverted,
   the other two grown and forgotten. A result field with no consumer looks
   like an interface and is not one, and the next person to touch this has to
   work out whether it matters. */
/* The latest reading, and when the app last intervened.
 *
 * Written three times, identically — and I wrote the second and third copies
 * myself, an hour after arguing that copying is how these engines drift apart.
 * blockdup did not object because it abandoned any eight-line window
 * containing a comment, and this block is well commented: the documentation
 * was hiding the duplication it described. */
export function noteCurrentAndInterventions(out, all, def, doseLog, correctionPlans) {
  out.current = all[all.length - 1];
  /* When the dose or a plan last moved, so a correction is not proposed on a
     reading that predates the app's own intervention. */
  out.lastDoseChangeAt = (doseLog || [])
    .filter((x) => x && (x.element || "alkalinity") === def.key && x.date)
    .map((x) => String(x.date).slice(0, 10))
    .sort()
    .pop() || null;
  {
    const p = correctionPlanFor(correctionPlans, def.key);
    out.lastCorrectionPlanAt = p && p.startedAt ? String(p.startedAt).slice(0, 10) : null;
  }
}

export function assessAlkalinity({ readings, doseLog = [], waterChanges = [], settings, def,
                            now = null, plan = null, corrections = [] , correctionPlans = {} }) {
  const nowStamp = now != null ? now : (dayNum(todayStr()) + minutesOf(nowTime()) / 1440);
  const out = {
    ok: false, reason: null,
    current: null, target: null, currentDose: null, hoursOnDose: null,
    used: [], trendPerDay: null, band: null, consistent: null,
    supplied: null, consumption: null, maintenanceDose: null,
    recommendedDose: null, action: "hold", explanation: "", nextCheck: "",
    anomaly: null, effectPerMl: null,
    /* A staged correction spans days, so the destination has to survive between
       sessions. Without it the app would recompute a fresh plan each time and
       forget it was already partway through one. */
    activePlan: null, stage: null, stages: null, planTarget: null, nextTestDue: null,
  };

  /* A plan is live while the dose it set is still the current one. */
  if (plan && plan.target != null && plan.appliedDose != null) {
    out.activePlan = plan;
    out.planTarget = plan.target;
    out.stage = plan.stage;
    out.stages = plan.stages;
    out.nextTestDue = plan.nextTestAt || null;
  }

  const effect = alkEffectPerMl(settings);
  out.effectPerMl = effect;
  /* Every figure below rests on this number, so how well it is known is part
     of the answer rather than a footnote. */
  out.effectSolved = solveAlkEffect(readings, doseLog, waterChanges,
    { ...settings, _corrections: corrections });
  if (!effect) {
    out.reason = missingDoseInputs(settings, "alkalinity", "dkhPerMlPer100L");
    return out;
  }

  /* Only recent history can affect the answer, so older readings are dropped
     before sorting rather than after. Without this the cost of an assessment
     grows with the whole log — someone three years in would pay for every
     reading they had ever taken, on every render. */
  const alkFloor = nowStamp - 400;
  const all = (readings || [])
    .filter((r) => r.param === "alkalinity" && isFinite(r.value) && alkStamp(r) >= alkFloor)
    .sort((a, b) => alkStamp(a) - alkStamp(b));
  if (!all.length) {
    out.reason = "No alkalinity readings yet.";
    return out;
  }
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
  out.target = { min: def.min, max: def.max };

  /* Step 2 — has the dose changed? Everything before the most recent change
     describes the tank under a dose it is no longer receiving. */
  const changes = (doseLog || [])
    .filter((d) => (d.element || "alkalinity") === "alkalinity" && isFinite(d.ml))
    .sort((a, b) => alkStamp(a) - alkStamp(b));
  const lastChange = changes.length ? changes[changes.length - 1] : null;
  out.currentDose = lastChange ? lastChange.ml : Number(settings.dailyDoseMl);
  if (!isFinite(out.currentDose)) {
    out.reason = "Set your daily alkalinity dose in Setup before this can be calculated.";
    return out;
  }

  const windowStart = lastChange ? alkStamp(lastChange) : -Infinity;
  out.hoursOnDose = lastChange ? (nowStamp - windowStart) * 24 : null;

  /* Step 3 — confounding events.
     Water changes are deliberately NOT among them. A routine change of a tenth
     of the volume shifts alkalinity by about as much as the test can resolve,
     while restarting the window every week left the assessment with a single
     reading to work from — which is why it answered "hold" on tanks that were
     visibly draining. A manual correction is different: large, deliberate, and
     known exactly, so it is subtracted from the readings further down rather
     than throwing the window away. */
  const eventStamps = [];
  const corrList = (corrections || [])
    .filter((c) => (c.element || "alkalinity") === "alkalinity" && isFinite(c.ml))
    .sort((a, b) => alkStamp(a) - alkStamp(b));
  const lastEvent = eventStamps.length
    ? eventStamps.reduce((a, b) => (a.stamp > b.stamp ? a : b)) : null;
  /* `out.events` was set here and read nowhere. The stamps it held are used
     locally under their own name; publishing them on the result served no
     consumer. */

  const cutoff = Math.max(windowStart, lastEvent ? lastEvent.stamp : -Infinity);
  /* Step 26 — recent data under the same dose. Two to four days is the working
     window; older readings give context but must not dilute a new trend. */
  /* Four days is the working window when testing daily, per the protocol. But
     someone testing every third day has only two readings in that span, and a
     slow drift can then never be confirmed — it simply persists uncorrected.
     The protocol also says to use all relevant recent measurements under the
     same dose, so the window widens to gather at least four readings, and only
     ever within the current dose period. */
  const horizon = nowStamp - 4;
  let used = all.filter((r) => alkStamp(r) >= cutoff && alkStamp(r) >= horizon);
  /* Widening was added so that someone testing every third day could still
     confirm a slow drift. But it must not reach back over a settled period and
     average out a clear recent trend — three readings over two days showing a
     steady decline is exactly the evidence section 26 says to act on, and
     pulling in the flat week before it cancels the signal entirely. So the
     window only widens when the recent one genuinely cannot support a trend. */
  if (used.length < 3) {
    const wider = all.filter((r) => alkStamp(r) >= cutoff && alkStamp(r) >= nowStamp - 12);
    if (wider.length > used.length) used = wider.slice(-6);
  }
  if (used.length < 3) used = all.filter((r) => alkStamp(r) >= cutoff).slice(-4);

  /* The protocol asks for alkalinity to be recorded at the time of the change
     and used as the Day-0 anchor. Without it the first day after a change has
     one point and nothing to compare it against — the assessment would sit
     idle for a day longer than it needs to. */
  if (lastChange) {
    const anchor = all
      .filter((r) => alkStamp(r) < cutoff && (cutoff - alkStamp(r)) <= 0.5)
      .sort((a, b) => alkStamp(b) - alkStamp(a))[0];
    if (anchor && !used.includes(anchor)) used = [anchor, ...used];
  }
  out.used = used;

  /* Subtract what a logged correction put in, spread over the three days it is
     delivered across. What remains is the tank's own behaviour, which is what
     the dose has to match — otherwise the lift shows up as reduced consumption
     and the engine cuts a dose that was correct. */
  const CORRECTION_DAYS = 3;
  const correctionAddedBy = (stamp) => corrList.reduce((sum, c) => {
    const t = alkStamp(c);
    if (stamp <= t) return sum;
    const frac = Math.min(1, (stamp - t) / CORRECTION_DAYS);
    return sum + c.ml * effect * frac;
  }, 0);
  if (corrList.length) {
    const anchor = used.length ? correctionAddedBy(alkStamp(used[0])) : 0;
    out.usedRaw = used;
    used = used.map((r) => ({ ...r, value: r.value - (correctionAddedBy(alkStamp(r)) - anchor) }));
  }

  const spanDays = used.length >= 2 ? alkStamp(used[used.length - 1]) - alkStamp(used[0]) : 0;
  /* Step 5 — enough evidence? */
  if (used.length < 2 || spanDays <= 0) {
    out.reason = lastChange
      ? `Only ${used.length} reading${used.length === 1 ? "" : "s"} since the dose changed. Hold the current dose and test again.`
      : "At least two readings are needed to see a trend. Hold the current dose and test again.";
    out.nextCheck = "Test again tomorrow, ideally at a similar time of day.";
    return out;
  }

  out.used = out.usedRaw || used;
  const anomalyRows = used;
  const fit = alkFit(used);
  const intervals = alkIntervals(used);
  const trend = fit ? fit.slope : intervals[intervals.length - 1].perDay;
  out.trendPerDay = trend;

  /* The fitted line at the last timestamp, correction-adjusted. It sizes a
     one-off correction below; it does not say where alkalinity is. */
  const fittedNow = (fit && used.length >= 3)
    ? used.reduce((a, r) => a + r.value, 0) / used.length
      + fit.slope * (alkStamp(used[used.length - 1])
        - used.reduce((a, r) => a + alkStamp(r), 0) / used.length)
    : out.current.value;
  out.fittedNow = fittedNow;
  /* §26, decided 14 Aug: position is the last reading. In band, out of band or
     at which edge is answered by the most recent measurement and never by a
     fitted value. This was `fittedNow`, on the argument that one low titration
     on a tank that had held 9.0 for a fortnight is a test result rather than a
     tank at 8.2 — but the sentence reporting it quotes `out.current.value`, so
     the app printed "alkalinity is below your range at 8.5dKH" against a band
     starting at 8.2. A position no measurement supports is not a safer answer
     for being smoother. */
  const posNow = out.current.value;
  const inRange = posNow >= def.min && posNow <= def.max;
  const above = posNow > def.max;
  const below = posNow < def.min;
  /* §11's grading fix — see `outOfBandWorsening` above `doseDriftedFrom` in
     helpers.js for the two qualifiers and why this is shared across all
     three engines rather than copied per file. */
  out.band = alkBandOf(trend, outOfBandWorsening(above, below, trend, spanDays, def.key));
  out.anomaly = alkAnomaly(used, fit);

  /* A trend is consistent when every interval points the same way. Two
     movements that cancel out are not the same as a steady decline. */
  /* One kit step is the smallest movement worth calling a direction. */
  out.consistent = directionConsistent(intervals, (def.step || 0.1) * 1.5);

  /* Requiring every interval to point the same way is a strict test that kit
     noise defeats easily: a genuine 0.15 dKH/day drift measured to ±0.05 will
     show one interval going the other way sooner or later, and the engine would
     then never confirm it. So a trend also counts as confirmed when the fitted
     slope is far enough from zero relative to its own scatter — which is what
     "more measurements are better" buys you. */
  const seSlope = (() => {
    if (!fit || used.length < 4 || !isFinite(fit.rmse)) return null;
    const xs = used.map(alkStamp);
    const mx = xs.reduce((a, b) => a + b, 0) / xs.length;
    const sxx = xs.reduce((a, x) => a + (x - mx) ** 2, 0);
    if (!(sxx > 0)) return null;
    return fit.rmse / Math.sqrt(sxx);
  })();
  out.slopeSE = seSlope;
  out.confirmedByFit = seSlope != null && seSlope > 0
    && Math.abs(trend) > seSlope * 2.5 && spanDays >= 2;

  const lastInterval = intervals[intervals.length - 1];
  const bigMove = lastInterval && Math.abs(lastInterval.change) >= ALK_TREND.meaningful
    && lastInterval.days <= 1.5;

  /* Steps 9–11 — the arithmetic. */
  out.supplied = out.currentDose * effect;
  out.consumption = out.supplied - trend;
  out.maintenanceDose = out.consumption / effect;
  /* Refreshed here because correctionProgress runs long before maintenanceDose
     exists, so the plan it built could only ever replay the stored figure —
     the very staleness this was meant to fix. */
  if (out.correctionPlan) {
    out.correctionPlan = correctionProgress(
      correctionPlanFor(correctionPlans, def.key), def, readings, todayStr(), out.maintenanceDose);
  }

  /* Consumption can come out negative when the level is rising faster than the
     dose supplies. The formula then produces a negative maintenance dose,
     which is not a thing anyone can pour. */
  if (out.consumption < 0) {
    out.gaining = -out.consumption;
    out.consumption = 0;
    out.maintenanceDose = 0;
  }

  /* Checked here, before any branch, because a wrong strength poisons every
     path — including the ones that return "hold" while still printing a
     maintenance figure of a hundred millilitres a day. */
  const alkStrength = strengthPlausible("alkalinity", settings);
  if (!alkStrength.ok || !dosePlausible(out.maintenanceDose, settings)) {
    out.action = "implausible";
    out.reason = !alkStrength.ok
      ? `The alkalinity strength in Setup is ${alkStrength.value} ${alkStrength.unit}, which is outside anything a real product delivers (${alkStrength.lo}–${alkStrength.hi}). Every millilitre figure here is derived from it, so they will all be wrong until it is corrected. A soda-ash two-part is around 0.05.`
      : `The working points to ${fmtAmount(out.maintenanceDose)} mL/day, which is not a real dose for ${fmtAmount(settings.volumeL)} L. The strength figure is the likely cause.`;
    out.nextCheck = "Correct the solution strength in Setup, and these figures will make sense.";
    return out;
  }


  /* Step 22 — verify before acting on something that looks wrong. */
  if (out.anomaly) {
    out.caution = `This reading sits well away from the ones before it, which pointed to about ${fmtVal(def, out.anomaly.expected)}${def.unit}. Worth a second test if anything felt off — otherwise the working below takes it as read.`;
  }

  /* Steps 3 and 15 — a freshly changed dose needs time to show its effect. */
  /* The exception the protocols allow: already outside the band and still
     heading the wrong way is not a trend to be confirmed, it is a tank in
     trouble, and waiting out the settling period makes it worse. */
  const alkEmergency = lastChange
    && ((out.current.value < def.min && trend < 0) || (out.current.value > def.max && trend > 0))
    && Math.abs(trend) >= ALK_TREND.meaningful;

  if (!alkEmergency && lastChange && out.hoursOnDose != null && out.hoursOnDose < ALK_EARLY_HOURS) {
    out.reason = `The dose changed to ${fmtAmount(out.currentDose)} mL/day about ${Math.round(out.hoursOnDose)} hours ago. That is not long enough to judge it. Hold and test again.`;
    out.nextCheck = `Test again around ${Math.max(1, Math.round((ALK_EARLY_HOURS - out.hoursOnDose)))} hours from now.`;
    return out;
  }
  if (!alkEmergency && lastChange && out.hoursOnDose < ALK_SETTLE_HOURS) {
    if (bigMove) {
      out.caution = (out.caution ? out.caution + " " : "")
        + `That is a large move so soon after a dose change — worth checking the doser is delivering what you set, rather than changing the dose again.`;
    }
    out.reason = `The dose changed to ${fmtAmount(out.currentDose)} mL/day about ${Math.round(out.hoursOnDose)} hours ago and alkalinity has moved ${fmtVal(def, Math.abs(lastInterval.change))}${def.unit} since — inside normal variation. Hold this dose and take one more reading before deciding.`;
    out.nextCheck = `Test again around ${Math.max(1, Math.round(ALK_SETTLE_HOURS - out.hoursOnDose))} hours from now.`;
    return out;
  }

  /* Step 4 — a large one-day movement is grounds for an early review, but the
     protocol asks for the reading to be checked first: a single interval is a
     single test, and acting on it without confirmation is how a mis-measured
     drop becomes a real overdose. */
  if (bigMove && intervals.length < 2) {
    out.caution = (out.caution ? out.caution + " " : "")
      + `That is a large move for ${Math.round(lastInterval.days * 24)} hours and rests on a single interval — worth checking for a missed dose or a sample taken at an unusual hour.`;
  }

  /* Step 6 — do not react to small movements, unless alkalinity is already
     outside the band and still drifting further out. A trend below the noise
     floor still empties a tank given enough weeks. */
  /* §27, second decision: the gate is OUT OF BAND, by any amount — never the
     margin. See the note at the same site in calcium.js. */
  const alkOutOfBand = above || below;
  const alkClearlyOut = above ? (posNow - def.max) > ALK_CLEARLY_OUT
    : below ? (def.min - posNow) > ALK_CLEARLY_OUT : false;
  out.clearlyOut = alkClearlyOut;
  const alkRepeats = repeatedCorrections(corrections, "alkalinity", nowStamp);
  const alkWorsening = alkOutOfBand
    && (Math.abs(trend) >= ALK_TREND.stable || alkRepeats >= 2)
    && ((below && trend <= 0) || (above && trend >= 0));
  /* "Stable" is a statement about the trend, not about the dose. A tank losing
     0.056 dKH a day grades stable — that is under the weekly drift limit — and
     the engine held the dose for three simulated years while demand grew four
     fold and alkalinity fell past zero. It knew: maintenanceDose read 5.86
     against a current 5.06 the whole time.

     The right question is whether the dose matches what the tank uses. A gap
     of more than 12% is worth acting on: it is the error the settling window
     is sized to detect, so if the reading can see it the dose should follow.
     Below that the difference is inside the noise and chasing it is how the
     8 -> 10 -> 8 oscillation started. */
  if (out.band === "stable" && !alkWorsening
      && !doseDriftedFrom(out.maintenanceDose, out.currentDose, def.key)) {
    out.ok = true;
    out.recommendedDose = out.currentDose;
    out.action = "hold";
    out.explanation = `Alkalinity is moving ${fmtAmount(Math.abs(trend))} dKH a day, which is within normal test variation. Your current dose is matching consumption.`;
    out.nextCheck = "Keep testing on your usual schedule.";

    /* Steps 18–19 — holding steady is not the same as being right. A dose that
       exactly matches consumption will hold alkalinity wherever it happens to
       sit, including well outside the range. That needs a separate one-off
       correction, and must not be folded into the daily dose. */
    if (!inRange) {
      const gap = above ? out.current.value - def.max : def.min - out.current.value;
      const mid = (def.min + def.max) / 2;
      /* The fitted value, not the last raw reading. Magnesium already used
         this and the other two did not — the same block, one copy diverged.
         Fitted is the better answer: on a kit with 25 ppm of noise, whether
         the last reading landed on the high or low side of the sawtooth moved
         the correction by a third (112 ppm against 85). The fit is what the
         app trusts everywhere else it reasons about where a level actually
         is. */
      const toMid = Math.abs(mid - fittedNow);
      /* Additive only: nothing you can dose brings alkalinity down. */
      const oneOff = Math.round((toMid / effect) * 10) / 10;

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
      out.explanation += ` But it is holding at ${fmtVal(def, out.current.value)}${def.unit}, which is ${fmtAmount(gap)}${def.unit} ${above ? "above" : "below"} your range — a steady dose will keep it there indefinitely rather than bring it back.`;
      const repeats = repeatedCorrections(corrections, "alkalinity", nowStamp);
      if (repeats >= 2 && out.targetCorrection) {
        out.caution = (out.caution ? out.caution + " " : "")
          + `You have corrected alkalinity ${repeats} times in the last couple of months and it keeps sagging back. Something is pulling it down continuously — usually a salt mix below your target arriving with each water change — and the daily dose is what should answer that. Around ${fmtAmount(out.targetCorrection.perDayMl)} mL more a day would carry it instead of correcting again.`;
      }
      out.nextCheck = above
        ? `Bringing it down is a matter of letting it drift: reduce the dose temporarily, or leave it and let consumption pull it back, then restore this dose once it reaches the range.`
        : out.targetCorrection
        ? `Raising it back is a separate one-off correction of roughly ${fmtAmount(out.targetCorrection.oneOffMl)} mL spread over two or three days — not a permanent increase, which would then push it past the range. Keep the daily dose where it is.`
        : `Raising it back needs a one-off correction rather than a bigger daily dose, but the amount cannot be worked out until the solution strength in Setup is right.`;
    }
    return out;
  }
  /* Step 8 — a trend whose intervals contradict each other is weaker evidence
     than its size suggests. Previously only mild trends were damped this way,
     so 9.3 / 8.8 / 9.0 / 8.5 — down, up, down — still produced a dose change.
     The average is real; the confidence is not. */
  if (out.consistent === false && intervals.length >= 2) {
    const swings = intervals.map((iv) => `${iv.perDay > 0 ? "+" : ""}${fmtAmount(iv.perDay)}`).join(", ");
    /* A large last movement inside an already scattered series is more likely
       to be another scattered reading than a new direction. Confirm it rather
       than dose against it. */
    if (bigMove) {
      out.caution = (out.caution ? out.caution + " " : "")
        + `The intervals before this one were going in different directions (${swings} ${def.unit} a day), so the size of the last step is less certain than it looks.`;
      out.nextCheck = "Repeat the alkalinity test now, then judge from the pair.";
      return out;
    }
    out.ok = true;
    out.recommendedDose = out.currentDose;
    out.action = "hold";
    out.explanation = `The overall trend is ${fmtAmount(Math.abs(trend))} dKH a day, but the individual intervals disagree: ${swings} dKH a day. A number that jumps around like that is usually test scatter rather than a real direction, and dosing against scatter makes a tank less stable, not more.`;
    out.nextCheck = "Two or three more readings at a consistent time of day will show whether there is a real trend underneath this.";
    return out;
  }

  if (out.band === "mild" && intervals.length < 2) {
    out.ok = true;
    out.recommendedDose = out.currentDose;
    out.action = "hold";
    out.explanation = `Alkalinity is drifting about ${fmtAmount(Math.abs(trend))} dKH a day, but ${intervals.length < 2 ? "over only one interval" : "the individual intervals disagree with each other"}. That is not yet firm enough to change the dose on.${used.length < 4 ? " A fourth reading would let the trend be judged on its overall shape rather than interval by interval." : ""}`;
    out.nextCheck = "One more reading will confirm whether this is a real trend.";
    return out;
  }
  /* A steep per-day rate extrapolated from a short gap is not the same as a
     confirmed daily movement. Half a day at 0.3 dKH/day is a 0.15 change —
     well inside test variation — so any adjustment needs either a real ~48h
     span or an actual movement of 0.30 dKH within about a day. */
  if ((out.band === "meaningful" || out.band === "significant") && spanDays < 1.5 && !bigMove) {
    out.ok = true;
    out.recommendedDose = out.currentDose;
    out.action = "hold";
    out.explanation = `Alkalinity is moving about ${fmtAmount(Math.abs(trend))} dKH a day, but that rate comes from only ${fmtAmount(spanDays)} days — an actual change of ${fmtVal(def, Math.abs(lastInterval.change))}${def.unit}, which is inside normal test variation.`;
    out.nextCheck = "Confirm it with a reading tomorrow, then adjust.";
    return out;
  }

  /* Steps 18–21 — trend control is not the same as target correction. */
  const movingToTarget = (above && trend < 0) || (below && trend > 0);
  if (movingToTarget && Math.abs(trend) <= ALK_TREND.meaningful) {
    out.ok = true;
    out.recommendedDose = out.currentDose;
    out.action = "hold";
    out.explanation = `Alkalinity is ${above ? "above" : "below"} your range at ${fmtVal(def, out.current.value)}${def.unit} and moving ${trend < 0 ? "down" : "up"} toward it at ${fmtAmount(Math.abs(trend))} dKH a day. That is the direction you want, so changing the dose now would work against it. Reassess once it reaches the range.`;
    out.nextCheck = `Recalculate once alkalinity is back inside ${fmtVal(def, def.min)}–${fmtVal(def, def.max)}${def.unit}.`;
    return out;
  }

  /* §24 — a negative consumption never sizes a dose change. The exemption is
     the level itself: above the range and still rising is the rescue case
     below, which must keep firing (Decision 3 named suppressing it as the one
     concrete regression risk here). Alkalinity has no near-edge notion of its
     own, so `above` is the whole test — inventing one would be a new
     threshold. */
  if (out.gaining) {
    const levelWantsLess = above && trend > 0;
    if (!levelWantsLess) {
      return gainingHold(out, def, { intervals, waterChanges, corrections });
    }
  }

  /* Step 17 — size the correction. If a plan is already running and its
     destination still agrees with what the readings now say, keep walking it
     rather than inventing a new target every time. */
  const planLive = out.activePlan
    && Math.abs(out.activePlan.appliedDose - out.currentDose) < 0.05
    && Math.abs(out.activePlan.target - out.maintenanceDose) <= Math.max(1.5, out.activePlan.target * 0.2);
  out.continuingPlan = !!planLive;

  const rawChange = out.maintenanceDose - out.currentDose;
  const urgent = (below && trend < 0) || (above && trend > 0)
    || Math.abs(trend) >= ALK_TREND.meaningful * 1.5;
  let applied;
  const mag = Math.abs(rawChange);
  /* Already out of band and still heading away: staging is the wrong instinct
     here, because each held-back step costs another two days at a level the
     tank should not be at. Simulation showed tanks crashing while the engine
     politely corrected 70% at a time. */
  const rescue = alkEmergency
    || ((below && trend < 0) || (above && trend > 0));
  if (rescue) applied = rawChange;
  else if (mag <= 2) applied = rawChange;
  else if (mag <= 4) applied = rawChange * 0.9;
  else applied = urgent ? rawChange * 0.7 : rawChange * 0.55;

  /* The same rounding, rate ceiling and plausibility check the other two use.
     Alkalinity had its own shorter version and never set out.rateLimited, so
     where calcium can say "we wanted 32 mL but the safe rate allows 14",
     alkalinity clamped silently at the end and said nothing. The ceiling was
     applied either way; the difference was that the user was not told. */
  const limited = rateLimitDose(applied, out, def, settings, out.effectPerMl);
  if (limited.stop) return out;
  let next = limited.next;

  /* Bracketing, the step cap and the rate ceiling — one implementation for all
     three elements. */
  next = applyDoseConstraints(next, out, def, settings, readings, doseLog);

  out.ok = true;
  out.recommendedDose = next;
  out.action = doseAction(next, out.currentDose);
  out.staged = mag > 4;

  /* A staged correction is a plan, not a single number. Spelling out the steps
     means the 48-hour wait between them is visible rather than something the
     user has to remember from the explanation. */
  if (out.staged) {
    const steps = [];
    let at = out.currentDose;
    let guard = 0;
    while (Math.abs(out.maintenanceDose - at) > 2 && guard++ < 5) {
      const remaining = out.maintenanceDose - at;
      const stepSize = Math.abs(remaining) > 4
        ? remaining * (urgent ? 0.7 : 0.55)
        : remaining;
      at = Math.round((at + stepSize) * 10) / 10;
      steps.push(at);
    }
    if (Math.abs(out.maintenanceDose - at) > 0.05) {
      steps.push(Math.round(out.maintenanceDose * 10) / 10);
    }
    out.plan = steps;
  }

  const dirWord = trend < 0 ? "falling" : "rising";
  /* How much the recommendation could be out, given how well the readings
     actually fit a straight line. A single figure implies a precision the data
     rarely supports. */
  if (fit && fit.rmse > 0 && spanDays > 0) {
    const slopeErr = fit.rmse / Math.max(0.5, spanDays / 2);
    out.doseUncertaintyMl = Math.round((slopeErr / effect) * 10) / 10;
  }

  out.explanation =
    `Alkalinity is ${dirWord} ${fmtAmount(Math.abs(trend))} dKH a day across ${fmtAmount(spanDays)} days`
    + `${out.consistent ? ", consistently in every interval" : ""}. `
    + `At ${fmtAmount(out.currentDose)} mL/day you are adding ${fmtAmount(out.supplied)} dKH a day, so the tank is using about ${fmtAmount(out.consumption)} dKH a day. `
    + `Replacing that exactly would take ${fmtAmount(out.maintenanceDose)} mL/day`
    + (out.staged
      ? `, which is a large jump from ${fmtAmount(out.currentDose)}. Move part of the way first and re-check — a big correction is harder on corals than the drift itself.`
      : `.`)
    + (out.doseUncertaintyMl && out.doseUncertaintyMl >= 0.5
      ? ` Your readings scatter enough that this figure is only good to about ±${fmtAmount(out.doseUncertaintyMl)} mL, so treat it as a direction rather than a precise number.`
      : ``);
  out.nextCheck = `Hold the new dose for 48 hours, then test again. Two readings at a similar time of day will show whether it has settled.`;
  return out;
}
