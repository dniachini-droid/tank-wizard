import { CORRECTION_MAX_RATE, SAFE_DAILY_RISE } from '../analytics/safe-rate.js'
import { fmtAmount, fmtVal } from '../analytics/time-in-range.js'
import { byNewest, byOldest, minutesOf, nowTime } from '../analytics/time-of-day.js'
import { dayNum } from '../analytics/water-changes.js'
import { daysBetween, todayStr } from '../dates.js'
import { alkAnomaly, alkEffectPerMl, alkFit, alkIntervals, alkStamp, applyDoseConstraints, directionConsistent, noteCurrentAndInterventions, rateLimitDose, trendConfirmed } from './alkalinity.js'
import { CA_TREND, caEffectPerMl, pickTrendWindow, repeatedCorrections, solveSlowEffect } from './calcium.js'
import { MG_SETTLE_DAYS, MG_TREND, strengthPlausible } from './magnesium.js'
import { SAFE_BOUNDS } from '../findings.js'
import { STABILITY_RULES } from '../stability-engine.js'

/* ---- Bracketing --------------------------------------------------------
   The single most valuable thing the simulation work produced.

   Every dose the tank has run under, with what the level did at that dose, is
   an observation. If alkalinity FELL at 8 mL and ROSE at 10 mL, then the dose
   that holds it level is between 8 and 10 — that is implied by the
   measurements, not a heuristic, and no amount of kit noise can make it false.

   Without it the engine recomputed consumption from scratch in each window and
   the answers disagreed wildly: 12.3 mL from one window, 7.1 from the next, on
   the same tank two days apart. That is the 8 -> 10 -> 8 oscillation, and it
   is caused by measurement error rather than by the tank.

   Two guards learned from testing:
     - Current direction always beats stored history. A bracket remembered from
       14 mL was cutting the dose while alkalinity actively fell at 25 mL.
     - An observation is only useful while it still describes this tank. When
       consumption jumps, the old readings describe a tank that no longer
       exists and the bracket blocked the very increase the tank needed — it
       held one at 8 mL for seventeen days while alkalinity fell 9.0 to 4.9. */

/* ---- Step cap ----------------------------------------------------------
   How much a single change may move the dose. The engine already limits how
   fast the LEVEL may move; this limits how far the DOSE jumps in one go, which
   is a different thing and the one that stops a noisy window causing a swing.

   Reefco Aquariums put it plainly: increase alkalinity dosing by 10% and
   monitor for a week. Top Shelf Aquatics: when alkalinity drops 1.0 dKH
   overnight, resist dosing it back — increase daily dosing by 20-30% and let
   it recover over 3-4 days. Simulation agreed: 25% gave the lowest error, 15%
   converged too slowly to keep up with a growing tank.

   The cap relaxes when the tank is outside what the hobby treats as workable
   and still heading the wrong way. There the movement is not noise, it is the
   problem — holding a badly underdosed tank to 25% steps left it out of range
   for weeks. The safe-rate ceiling still applies underneath, so the level
   never moves faster than corals tolerate. */
export const DOSE_STEP_CAP = 0.25;

export function capDoseStep(wanted, currentDose, level, def, rate) {
  if (!(currentDose > 0) || !isFinite(wanted)) return wanted;
  const bounds = SAFE_BOUNDS[def.key];
  const unsafe = bounds && level != null && (level < bounds.min || level > bounds.max);
  const headingWrong = unsafe && bounds
    && ((level < bounds.min && rate < 0) || (level > bounds.max && rate > 0));
  const pct = headingWrong ? 1.0 : unsafe ? 0.5 : DOSE_STEP_CAP;
  const cap = currentDose * pct;
  return Math.max(currentDose - cap, Math.min(currentDose + cap, wanted));
}

/* How far back a dose observation stays usable for bracketing.
 *
 * This was 21 with no stated reason at all — the only husbandry constant in
 * the app carrying no justification, which is how the dead drift thresholds
 * survived next door.
 *
 * Bracketing needs TWO observations, one where the level fell and one where it
 * rose. At 21 days a keeper who changes the dose every three weeks has exactly
 * one, and one every month has none — so the constraint that exists to stop
 * dose oscillation was unavailable to precisely the steady tanks that had
 * settled into a rhythm.
 *
 * Lengthening costs little, because staleness is already handled better
 * elsewhere: the bracket discards any observation whose implied consumption
 * differs from today's by more than 25%. A tank growing 60% a year drifts 6%
 * in 45 days and 12% in 90 — well inside that filter, which judges the actual
 * tank rather than the calendar. The time limit is a blunt second guard and
 * only needs to stop something absurd.
 *
 * Measured across 36 three-year runs: mean dose error 14% at 21 days, 10% at
 * 35, 8% at 45. Small and consistent. 45 is the setting; beyond about 90 days
 * the drift starts to exceed what the coherence filter tolerates anyway, so
 * there is nothing to gain by going further. */
export const BRACKET_MEMORY_DAYS = 45;

export function doseObservations(doseLog, readings, paramKey, effectPerMl, today) {
  /* Each period between dose changes gives one observation: the dose that ran,
     and the rate the level moved at while it ran. */
  const changes = (doseLog || [])
    .filter((d) => (d.element || "alkalinity") === paramKey && d.ml != null)
    .slice().sort((a, b) => (a.date < b.date ? -1 : 1));
  if (!changes.length || !(effectPerMl > 0)) return [];
  const rows = (readings || []).filter((r) => r.param === paramKey).slice().sort(byOldest);
  const out = [];
  /* Walked once rather than rescanned per change. This filtered the whole
     reading list inside the loop over dose changes, so the cost grew with
     readings TIMES changes — and both grow with the age of the tank. A decade
     of history took 333 ms to derive, on every render, and the shape of the
     curve said quadratic: ten times the data cost thirty-six times the time.

     The rows are already in date order and the changes are too, so a single
     moving cursor finds each window. Only the first and last reading in a
     window are used, so nothing else needs collecting. */
  let cursor = 0;
  for (let i = 0; i < changes.length; i++) {
    const from = changes[i].date;
    const to = i + 1 < changes.length ? changes[i + 1].date : null;
    /* The cursor only ever moves forward, because `from` only ever increases. */
    while (cursor < rows.length && rows[cursor].date < from) cursor++;
    if (daysBetween(from, today) > BRACKET_MEMORY_DAYS) continue;
    let last = -1;
    let count = 0;
    for (let k = cursor; k < rows.length; k++) {
      if (to != null && rows[k].date >= to) break;
      last = k;
      count++;
    }
    if (count < 2) continue;
    const firstRow = rows[cursor];
    const lastRow = rows[last];
    const span = daysBetween(firstRow.date, lastRow.date);
    if (span < 1) continue;
    out.push({
      dose: changes[i].ml,
      rate: (lastRow.value - firstRow.value) / span,
      day: dayNum(from),
    });
  }
  return out;
}

export function bracketDose(wanted, currentDose, currentRate, observations, effectPerMl, today) {
  if (!observations || observations.length < 2 || !(effectPerMl > 0)) return null;
  const consNow = currentDose * effectPerMl - currentRate;
  /* Discard observations that imply a consumption unlike the tank's now — they
     describe a different tank. */
  const live = observations.filter((h) => {
    const consThen = h.dose * effectPerMl - h.rate;
    if (!(consThen > 0) || !(consNow > 0)) return false;
    return Math.max(consThen, consNow) / Math.min(consThen, consNow) <= 1.25;
  });
  const below = live.filter((h) => h.rate < 0).sort((a, b) => b.dose - a.dose)[0];
  const above = live.filter((h) => h.rate > 0).sort((a, b) => a.dose - b.dose)[0];
  if (!below || !above || above.dose <= below.dose) return null;
  /* Interpolate to where the trend crosses zero, strictly inside the bracket. */
  const zero = below.dose + (above.dose - below.dose) * (0 - below.rate) / (above.rate - below.rate);
  const bounded = Math.min(Math.max(zero, below.dose + 0.05), above.dose - 0.05);
  return { dose: Math.round(bounded * 10) / 10, low: below.dose, high: above.dose };
}

/* How much of a started correction is still outstanding. A correction is
   logged with the total it intends to add; what matters on screen is what is
   left, which is the total less what the level has actually moved since. */
export function pendingCorrection(corrections, def, current, today, settingsForCorrection, readingsForCorrection) {
  /* The shape the app actually writes: logCorrection stores { element, ml,
     direction }. This read { param, amount, fromValue }, which nothing ever
     produces — so the whole correction cross-talk was dead in the real app and
     alive only in my tests, which had invented the fields to match. Every
     verification of it passed against data the app cannot create.

     repeatedCorrections in the same file reads element/ml correctly, so one
     storage key had two readers expecting different shapes. */
  const mine = (corrections || [])
    .filter((c) => c && c.element === def.key && isFinite(Number(c.ml)))
    .filter((c) => daysBetween(c.date, today) <= 21)
    .sort((a, b) => (a.date < b.date ? 1 : -1));
  if (!mine.length || !current) return null;
  const c = mine[0];
  /* Millilitres of solution, converted to the level change it delivers. */
  const perMl = def.key === "alkalinity" ? alkEffectPerMl(settingsForCorrection)
    : def.key === "calcium" ? caEffectPerMl(settingsForCorrection)
    : def.key === "magnesium" ? mgEffectPerMl(settingsForCorrection) : 0;
  const total = perMl > 0 ? Math.abs(Number(c.ml) || 0) * perMl : 0;
  if (!(total > 0)) return null;

  /* What the level was when the correction was logged. */
  const before = (readingsForCorrection || [])
    .filter((r) => r.param === def.key && String(r.date) <= String(c.date))
    .sort(byNewest)[0];
  const startedAt = before ? Number(before.value) : NaN;
  const done = isFinite(startedAt) ? Math.abs(current.value - startedAt) : 0;
  const remaining = Math.max(0, Math.round((total - done) * 100) / 100);
  /* Finished once what is left is smaller than the kit can see. Waiting for it
     to reach exactly zero means waiting on a reading that cannot resolve the
     difference — "0.09 dKH still to go" against a kit that reads to 0.1 is
     progress nobody can measure, and it never completes. */
  const resolution = (STABILITY_RULES[def.key] || {}).noiseFloor || 0;
  if (remaining <= resolution) return null;
  return { total, done: Math.round(done * 100) / 100, remaining,
    startedAt: isFinite(startedAt) ? startedAt : null,
    direction: (Number(c.amount) || 0) >= 0 ? "up" : "down", since: c.date };
}

/* ---- Temporary correction dose ----------------------------------------
   Two different jobs share the same control, and conflating them is what made
   the app argue with its own user.

     MAINTENANCE  the level is inside the band, and the dose is tuned so what
                  goes in matches what the tank uses. Steady state.
     CORRECTION   the level is outside the band, and the dose is deliberately
                  set above or below consumption to walk the level back. Not
                  steady state, and it ends.

   Without the distinction, raising calcium's dose from 12 to 25 mL to bring
   400 up to 475 made the engine see a rising tank and recommend cutting the
   dose to 18.8 — fighting the very plan the keeper had just started. A stored
   plan tells every surface that the elevated dose is deliberate, what it is
   aiming at, and what to go back to.

   Arrival needs two consecutive readings inside the band. One reading can be a
   bad endpoint, and the guidance is explicit about retesting before acting. */
export const CORRECTION_PACE = { gentle: 0.25, steady: 0.5, quick: 1.0 };

/* How fast a deliberate correction may move a level, which is not the same as
   how far a dose change may shift it. SAFE_DAILY_RISE is the conservative
   limit on a routine dose adjustment; a correction is a considered act with a
   target, and the hobby allows more. Using the routine figure produced "86
   days at the gentle pace" to move calcium 75 ppm, which nobody would follow.

   Sources: alkalinity no more than 1.0 dKH a day and most keepers stay at 0.5;
   calcium raised in measured steps, Seachem capping a single day near 24 ppm;
   magnesium no more than 50 ppm a day. */

export function correctionPlanFor(plans, key) {
  const p = plans && typeof plans === "object" ? plans[key] : null;
  if (!p || typeof p !== "object") return null;
  /* Coerced, because a plan is stored as JSON and comes back as whatever was
     written — a target of "9" formatted fine until something called toFixed on
     it. Every figure the wording quotes has to be a number by the time it
     leaves here. */
  const target = Number(p.target);
  const startValue = Number(p.startValue);
  const returnDose = Number(p.returnDose);
  if (!isFinite(target) || !p.startedAt) return null;
  return {
    ...p,
    target,
    startValue: isFinite(startValue) ? startValue : null,
    returnDose: isFinite(returnDose) ? returnDose : null,
    days: isFinite(Number(p.days)) ? Number(p.days) : null,
  };
}

/* Where a plan has got to: the level now, what remains, and whether the tank
   has confirmed arrival with two readings inside the band. */
export function correctionProgress(plan, def, readings, today, maintenanceNow) {
  if (!plan) return null;
  const rows = (readings || [])
    .filter((r) => r.param === def.key && r.date >= String(plan.startedAt).slice(0, 10))
    .sort(byOldest);
  const latest = rows.length ? rows[rows.length - 1] : null;
  /* No reading since the plan began does not mean nothing has happened. The
     elevated dose has been running the whole time, and the clock is the one
     thing that is knowable without a test. Returning early here meant a
     three-day plan still read "on its way to 9.0" forty days later, by which
     point the same dose would have carried alkalinity past 13 — the app
     cheerfully reporting progress on a correction that had long since become
     an overdose.

     The time checks are computed and returned even with nothing measured. */
  if (!latest) {
    const elapsed = daysBetween(String(plan.startedAt).slice(0, 10), today);
    const expectedDays = plan.days || null;
    return { ...plan, level: null, arrived: false, readingsSince: 0, measuredSince: 0,
      movedSoFar: 0, remaining: null, days: elapsed, daysLeft: null,
      stalled: false, backwards: false, passed: false,
      estimatedDays: expectedDays,
      dueNow: expectedDays != null && elapsed >= expectedDays,
      overrun: expectedDays != null && elapsed > expectedDays * 2 + 2 };
  }

  const up = plan.target > plan.startValue;
  const inBand = (v) => v >= def.min && v <= def.max;
  /* Two consecutive readings inside the band. A single one can be a bad
     endpoint, and dropping back to maintenance on it leaves the tank sagging
     straight out again. */
  const lastTwo = rows.slice(-2);
  const arrived = lastTwo.length >= 2 && lastTwo.every((r) => inBand(r.value));

  const remaining = up
    ? Math.max(0, plan.target - latest.value)
    : Math.max(0, latest.value - plan.target);
  const movedSoFar = Math.abs(latest.value - plan.startValue);
  const days = daysBetween(String(plan.startedAt).slice(0, 10), today);
  const perDay = days > 0 ? movedSoFar / days : 0;
  const daysLeft = perDay > 0 ? Math.max(1, Math.ceil(remaining / perDay)) : null;
  /* Moving the wrong way, or not at all, is worth saying — it usually means
     the strength in Setup is wrong or something else is pulling the level. */
  /* A plan has only "not moved" if something has been measured since it
     began. With one reading — which is the normal state for calcium at weekly
     testing and magnesium at three-weekly — the latest reading IS the one the
     plan started from, so movement is measured from a reading to itself and
     comes out zero every time.

     Absence of evidence was being read as evidence of failure: 48% of plans
     over three years were killed as stalled having never had a chance to work,
     and each replacement started from a worse level. */
  /* Readings on a LATER day than the plan started. Comparing timestamps
     counted the start-day reading itself, because a plan stored as a date
     stamps at midnight and the reading at 20:00 sorts after it. */
  const startDay = String(plan.startedAt).slice(0, 10);
  const measuredSince = rows.filter((r) => String(r.date).slice(0, 10) > startDay).length;
  const stalled = days >= 3 && measuredSince >= 1
    && movedSoFar < (STABILITY_RULES[def.key] || {}).noiseFloor;
  const backwards = days >= 3 && measuredSince >= 1
    && ((up && latest.value < plan.startValue) || (!up && latest.value > plan.startValue));

  /* Passing the target must stop the elevated dose immediately, whether or not
     a second reading has confirmed it. Waiting for confirmation before easing
     off cost real overshoot in testing: calcium reached its band and kept
     climbing to 702 ppm because its weekly cadence meant two confirming
     readings were a fortnight away, and alkalinity ran to zero on a downward
     correction for the same reason. Confirmation decides when to say "done";
     passing the target decides when to stop pushing. */
  const passed = up ? latest.value >= plan.target : latest.value <= plan.target;

  /* And a plan cannot run forever. If it has taken more than twice the days it
     was estimated to need, something is wrong with the assumptions rather than
     with the tank, and quietly continuing to over-dose is the worst outcome. */
  const expected = plan.days || null;
  const estimatedDays = expected;
  const overrun = expected != null && days > expected * 2 + 2;

  /* The estimate has run out and no reading has confirmed where the level got
     to. Continuing to push blind is how calcium overshot to 515 ppm: it
     entered its band on a Monday, the next test was the following Monday, and
     the elevated dose ran for the whole week in between. The right behaviour
     is the one the hobby already teaches — test between doses rather than
     dosing through. */
  const dueNow = expected != null && days >= expected && !passed;

  /* The dose to return to, recomputed rather than replayed. The figure stored
     when the plan started is what the tank used then; a plan that runs while
     demand grows sends the keeper back to a dose 38% short, and the level
     falls straight out again. That is the mechanism behind every symptom this
     stage began with — a dose left wherever the last plan put it.

     The stored value stays as the floor of a sanity check: if the fresh figure
     is absurd, the recorded one is the safer answer. */
  const freshReturn = (maintenanceNow != null && isFinite(maintenanceNow) && maintenanceNow > 0
    && (plan.returnDose == null || maintenanceNow < plan.returnDose * 6))
    ? Math.round(maintenanceNow * 10) / 10
    : plan.returnDose;

  return { ...plan, level: latest.value, up, remaining, movedSoFar, perDay,
    days, daysLeft, arrived, stalled, backwards, passed, overrun, dueNow, estimatedDays,
    returnDose: freshReturn, storedReturnDose: plan.returnDose,
    readingsSince: rows.length, measuredSince };
}

/* Whether a parameter can be lowered by the dose at all. Magnesium cannot:
   stopping the dose entirely only removes what the tank consumes, which for
   magnesium is a fraction of a ppm a day — nine months to shift 70 ppm. */
export function canLowerByDose(def, dailySupply) {
  if (!(dailySupply > 0)) return { possible: false, daysPerUnit: null };
  const span = (def.max - def.min) || 1;
  /* Days to move one band-width if the dose stopped entirely. */
  const days = span / dailySupply;
  return { possible: days <= 45, daysPerUnit: days };
}


/* What a correction would involve, for offering it. Returns null when the dose
   cannot do the job — lowering magnesium, most obviously, where stopping the
   dose entirely would take the better part of a year. */
export function proposeCorrection(a, def, settings, pace) {
  if (!a || !a.current || !a.effectPerMl || !(a.effectPerMl > 0)) return null;
  const level = a.current.value;
  const inBand = level >= def.min && level <= def.max;
  if (inBand) return null;

  /* Nothing new to go on since the last correction. A correction takes days to
     show up in a reading, and on a weekly-tested element the reading that
     prompted it is often still the newest one when the correction finishes —
     so the app looks at a level that predates its own intervention and offers
     to do the whole thing again.

     Over three simulated years this drove calcium from 403 to 498: a 120 mL
     correction delivering 56 ppm was already in flight, the last reading still
     said 399, and all three paces offered another. The corrections stacked and
     the level oscillated with plans starting two days apart.

     A correction already delivered is not evidence about where the level is
     now. Until something has been measured since, there is nothing to propose. */
  const readingDate = String(a.current.date || "");
  const staleAgainst = (when) => when && readingDate <= String(when).slice(0, 10);

  /* A logged one-off correction. */
  const running = a.correctionInProgress;
  if (staleAgainst(running && running.since)) return null;

  /* A correction PLAN that has run, which the first version of this guard
     missed: it only knew about logged corrections, so a plan could finish, the
     level could move 50 ppm, and the same stale reading would prompt the whole
     thing again. Seed 4 did exactly that — day 1044 start at a reading of 399,
     day 1046 end, day 1048 start again at the SAME reading of 399 while the
     true level had reached 447. */
  if (staleAgainst(a.lastCorrectionPlanAt)) return null;

  /* And any dose change, for the same reason: the dose was altered on the
     strength of this reading and has not been measured since. */
  if (staleAgainst(a.lastDoseChangeAt)) return null;
  const target = (def.min + def.max) / 2;
  const up = target > level;
  const gap = Math.abs(target - level);
  const maxRate = CORRECTION_MAX_RATE[def.key] || SAFE_DAILY_RISE[def.key] || (def.max - def.min) * 0.5;
  const perDay = maxRate * (CORRECTION_PACE[pace] || CORRECTION_PACE.steady);
  const days = Math.max(1, Math.ceil(gap / perDay));
  const maintenance = a.maintenanceDose != null ? a.maintenanceDose : a.currentDose;
  const delta = perDay / a.effectPerMl;
  const dose = Math.round((up ? maintenance + delta : maintenance - delta) * 10) / 10;

  if (!up) {
    /* Lowering only works if consumption can carry the level down in a
       sensible time. Magnesium cannot: the tank uses a fraction of a ppm a
       day, so even stopping the dose entirely takes months. */
    const feasible = canLowerByDose(def, maintenance * a.effectPerMl);
    /* A dose below zero does not mean the job is impossible — only that this
       pace asks for more than stopping the dose can deliver. A gentler pace
       may be perfectly workable, and calcium at 530 was being refused outright
       while its gentle option would have brought it back in a fortnight. */
    if (dose < 0 && feasible.possible) {
      /* Stopping the dose is not a refusal, it is the answer — the fastest a
         level can fall is the rate the tank consumes it. Returning "not at
         this pace" for all three paces left the panel with nothing to offer
         when the obvious move was sitting right there. */
      const stopDays = Math.ceil(gap / Math.max(1e-9, maintenance * a.effectPerMl));
      return { possible: true, atFloor: true, target, gap, up: false,
        days: stopDays, perDay: maintenance * a.effectPerMl, dose: 0,
        returnDose: Math.round(maintenance * 10) / 10, pace,
        note: `Stopping the dose is the fastest ${def.label.toLowerCase()} can fall — the tank has to use it up. About ${stopDays} day${stopDays === 1 ? "" : "s"} to lose ${fmtVal(def, gap)}${def.unit}.` };
    }
    if (dose < 0 || !feasible.possible) {
      const stopDays = Math.ceil(gap / Math.max(1e-9, maintenance * a.effectPerMl));
      return { possible: false, target, gap, up,
        stopDays,
        why: `Stopping the ${def.label.toLowerCase()} dose entirely would take about ${stopDays > 60 ? `${Math.round(stopDays / 30)} months` : `${stopDays} days`} to bring it down ${fmtVal(def, gap)}${def.unit} — the tank uses too little for the dose to move it. A water change is the practical route.` };
    }
  }
  /* Raising has its own feasibility limit. A maintenance solution is mixed to
     replace daily consumption, so using it for a large correction can call for
     a dose nobody can pour: magnesium at 1300 needed 409 mL/day of an 8 mL
     solution. Beyond a few times the normal dose it is the wrong product for
     the job, not the wrong plan. */
  if (up && dose > Math.max(maintenance * 6, maintenance + 40)) {
    return { possible: false, target, gap, up,
      why: `Reaching ${fmtVal(def, target)}${def.unit} through your maintenance solution would mean ${fmtAmount(dose)} mL a day against a normal ${fmtAmount(maintenance)} mL — far more than it is mixed for. A dedicated ${def.label.toLowerCase()} supplement or dry salt is the right tool for a gap this size; the daily dose is for holding a level, not moving it this far.` };
  }
  return { possible: true, target, gap, up, days, perDay, dose, returnDose: Math.round(maintenance * 10) / 10, pace };
}

/* Whether the daily dose has drifted from what the tank uses, regardless of
   what the trend grades. "Stable" describes the reading, not the dose: a tank
   losing 0.056 dKH a day is under the weekly drift limit and still 14%
   underdosed, and over three simulated years that held the dose while demand
   grew four fold.

   Written once because the first version of it went into assessAlkalinity
   alone. Calcium then ran 19% adrift and magnesium 76%, its dose never
   changing at all while demand quadrupled — the same fault, in the two engines
   the fix had not reached. */
export const DOSE_DRIFT_TRIGGER = {
  /* How far the dose may sit from what the tank uses before it is worth
     changing, per element, because what is measurable differs sharply.

     Alkalinity is read to 0.1 dKH on a 1.0 band, so a 12% dose error shows
     within days. Calcium is read to 5-15 ppm on a 50 ppm band and needs a
     wider margin. Magnesium's dose cannot be inferred from tank readings at
     all — a 15% error takes over a thousand days to clear the noise — so
     nothing short of a large, sustained gap should move it, and the LEVEL
     stays the signal. Seven sourced protocol examples said "hold" where a flat
     12% trigger said otherwise. */
  alkalinity: 0.12,
  calcium: 0.30,
  /* Magnesium is absent deliberately, not forgotten. Its dose cannot be
     inferred from tank readings at all — a 15% error takes over a thousand
     days to clear the noise — so maintenanceDose is computed from whatever the
     last few readings did, and for magnesium that is noise. A 5 ppm move over
     a week, a fifth of the kit's 25 ppm resolution, produced an implied
     maintenance dose of 30.9 mL against a current 8: a 286% "gap" built
     entirely out of measurement error, which two sourced protocol examples
     correctly call a hold.

     Magnesium is managed by its LEVEL. When that drifts out of band the level
     rules respond; the dose is never chased. */
};

export function doseDriftedFrom(maintenanceDose, currentDose, key, outOfBand) {
  if (maintenanceDose == null || !(currentDose > 0)) return false;
  const trigger = DOSE_DRIFT_TRIGGER[key];
  if (trigger == null) return false;
  /* The threshold exists to ignore noise while the level is where it should
     be. Once the level has left its band that reasoning is gone: the gap is no
     longer a question of whether the reading can see it, it is the reason the
     tank is drifting.
     
     Over three simulated years this held a dose 10% short while alkalinity
     fell from 9.0 to 6.82 — below the safe floor — and only acted at 5.22.
     One dose change in three years on a tank that was crashing the whole time.
     Out of band, half the tolerance applies. */
  const gap = Math.abs(maintenanceDose - currentDose) / currentDose;
  return gap > (outOfBand ? trigger / 2 : trigger);
}

export function dosePlausible(ml, settings) {
  const vol = Number(settings && settings.volumeL);
  if (!isFinite(ml) || !isFinite(vol) || vol <= 0) return true;
  return ml <= vol * 2;
}

/* Why an effect-per-mL could not be worked out, in the user's terms.
 *
 * The two inputs fail differently. A missing strength is a bottle detail; a
 * missing net volume means the app has no idea how big the tank is, and there
 * is no safe stand-in for that — so it is named explicitly rather than folded
 * into a generic "check Setup" (reef-chemistry.md §2, §7.6). One wording, used
 * by all three engines, so they cannot drift apart on it. */
export function missingDoseInputs(settings, label, strengthField) {
  const vol = Number(settings && settings.volumeL);
  const per100 = Number(settings && settings[strengthField]);
  const noVolume = !isFinite(vol) || vol <= 0;
  const noStrength = !isFinite(per100) || per100 <= 0;
  const parts = [];
  if (noVolume) parts.push("your tank's net volume");
  if (noStrength) parts.push(`your ${label} solution strength`);
  if (!parts.length) return null;
  return `Set ${parts.join(" and ")} in Setup before this can be calculated.`
    + (noVolume
      ? " Every millilitre figure here is worked out per litre of water, so no dose is calculated until the net volume is entered — the app will not assume one."
      : "");
}

export function mgEffectPerMl(settings) {
  const per100 = Number(settings && settings.mgPpmPerMlPer100L);
  const vol = Number(settings && settings.volumeL);
  if (!isFinite(per100) || !isFinite(vol) || vol <= 0 || per100 <= 0) return null;
  return (per100 * 100) / vol;
}

export function solveMgEffect(readings, doseLog, waterChanges, settings, corrections) {
  return solveSlowEffect("magnesium", readings, doseLog, waterChanges, settings, corrections);
}


export function mgBandOf(perWeek) {
  const a = Math.abs(perWeek);
  if (a < MG_TREND.stable) return "stable";
  if (a < MG_TREND.small) return "small";
  if (a < MG_TREND.meaningful) return "meaningful";
  return "significant";
}

export function assessMagnesium({ readings, doseLog = [], waterChanges = [], settings, def,
                           now = null, plan = null, corrections = [] , correctionPlans = {} }) {
  const nowStamp = now != null ? now : (dayNum(todayStr()) + minutesOf(nowTime()) / 1440);
  const out = {
    ok: false, reason: null, element: "magnesium",
    current: null, target: null, currentDose: null, daysOnDose: null,
    used: [], trendPerDay: null, trendPerWeek: null, band: null, consistent: null,
    supplied: null, consumption: null, maintenanceDose: null,
    recommendedDose: null, action: "hold", explanation: "", nextCheck: "",
    anomaly: null, events: [], effectPerMl: null, effectSolved: null,
    activePlan: null, stage: null, stages: null, planTarget: null, nextTestDue: null,
    targetCorrection: null, salinityShift: null,
  };

  const effect = mgEffectPerMl(settings);
  out.effectPerMl = effect;
  if (!effect) {
    out.reason = missingDoseInputs(settings, "magnesium", "mgPpmPerMlPer100L");
    return out;
  }
  out.effectSolved = solveMgEffect(readings, doseLog, waterChanges, settings, corrections);

  /* Only recent history can affect the answer, so older readings are dropped
     before sorting rather than after. Without this the cost of an assessment
     grows with the whole log — someone three years in would pay for every
     reading they had ever taken, on every render. */
  const mgFloor = nowStamp - 400;
  const all = (readings || [])
    .filter((r) => r.param === "magnesium" && isFinite(r.value) && alkStamp(r) >= mgFloor)
    .sort((a, b) => alkStamp(a) - alkStamp(b));
  if (!all.length) { out.reason = "No magnesium readings yet."; return out; }
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

  const changes = (doseLog || [])
    .filter((d) => d.element === "magnesium" && isFinite(d.ml))
    .sort((a, b) => alkStamp(a) - alkStamp(b));
  const lastChange = changes.length ? changes[changes.length - 1] : null;
  out.currentDose = lastChange ? lastChange.ml : Number(settings.magDoseMl);
  if (!isFinite(out.currentDose)) {
    out.reason = "Set your daily magnesium dose in Setup before this can be calculated.";
    return out;
  }

  const windowStart = lastChange ? alkStamp(lastChange) : -Infinity;
  out.daysOnDose = lastChange ? nowStamp - windowStart : null;

  if (plan && plan.target != null && plan.appliedDose != null) {
    out.activePlan = plan; out.planTarget = plan.target;
    out.stage = plan.stage; out.stages = plan.stages; out.nextTestDue = plan.nextTestAt || null;
  }

  /* Section 47: two weeks preferred for small trends, three to four for
     confirming stability — but only within the current dose period. */
  const horizon = nowStamp - 35;
  let used = all.filter((r) => alkStamp(r) >= windowStart && alkStamp(r) >= horizon);
  if (used.length < 3) used = all.filter((r) => alkStamp(r) >= windowStart).slice(-5);
  if (lastChange) {
    const anchor = all
      .filter((r) => alkStamp(r) < windowStart && (windowStart - alkStamp(r)) <= 1)
      .sort((a, b) => alkStamp(b) - alkStamp(a))[0];
    if (anchor && !used.includes(anchor)) used = [anchor, ...used];
  }
  out.used = used;

  /* Section 39: magnesium scales with salinity, so a salinity shift between
     tests can masquerade as consumption. Flagged rather than corrected for,
     because the reading is what it is — what changes is how to read it. */
  if (used.length >= 2) {
    const from = alkStamp(used[0]), to = alkStamp(used[used.length - 1]);
    const sal = (readings || [])
      .filter((r) => r.param === "salinity" && isFinite(r.value)
        && alkStamp(r) >= from - 1 && alkStamp(r) <= to + 1)
      .sort((a, b) => alkStamp(a) - alkStamp(b));
    if (sal.length >= 2) {
      const shift = sal[sal.length - 1].value - sal[0].value;
      if (Math.abs(shift) >= 0.6) {
        out.salinityShift = {
          shift,
          impliedPpm: out.current.value * (shift / (sal[0].value || 35)),
        };
      }
    }
  }



  /* Section 25: a manual correction is known exactly, so it is subtracted
     rather than used to throw the window away. */
  const corrList = (corrections || [])
    .filter((c) => c.element === "magnesium" && isFinite(c.ml))
    .sort((a, b) => alkStamp(a) - alkStamp(b));
  const CORRECTION_DAYS = 4;
  let maths = used;
  if (corrList.length && used.length) {
    const addedBy = (stamp) => corrList.reduce((sum, c) => {
      const t = alkStamp(c);
      if (stamp <= t) return sum;
      return sum + c.ml * effect * Math.min(1, (stamp - t) / CORRECTION_DAYS);
    }, 0);
    const anchor = addedBy(alkStamp(used[0]));
    maths = used.map((r) => ({ ...r, value: r.value - (addedBy(alkStamp(r)) - anchor) }));
  }

  /* Kept before any narrowing: the anomaly test needs the wider context. */

  const anomalyRows = maths;

  const mgPick = pickTrendWindow(maths, 15, nowStamp, MG_TREND.small);
  if (mgPick.narrowed) {
    maths = mgPick.rows;
    out.narrowedWindow = true;
    out.fullWindowTrend = mgPick.fullSlope * 7;
  }

  if (maths.length < 2) {
    out.reason = lastChange
      ? "Only one magnesium reading since the dose changed. Hold and measure at the next weekly test."
      : "Two magnesium readings are needed to see a trend. Hold the current dose and test again next week.";
    out.nextCheck = "Measure magnesium at your next weekly test.";
    return out;
  }

  const spanDays = alkStamp(maths[maths.length - 1]) - alkStamp(maths[0]);
  if (spanDays <= 0) { out.reason = "Readings need to be on different days."; return out; }

  const fit = alkFit(maths);
  const intervals = alkIntervals(maths);
  out.trendPerDay = fit ? fit.slope : intervals[intervals.length - 1].perDay;
  out.trendPerWeek = out.trendPerDay * 7;
  out.band = mgBandOf(out.trendPerWeek);
  out.consistent = directionConsistent(intervals, CA_TREND.stable * 0.5);
  out.intervals = intervals.length;

  out.slopeSE = (() => {
    if (!fit || maths.length < 3 || !isFinite(fit.rmse)) return null;
    const xs = maths.map(alkStamp);
    const mx = xs.reduce((a, b) => a + b, 0) / xs.length;
    const sxx = xs.reduce((a, x) => a + (x - mx) ** 2, 0);
    if (!(sxx > 0)) return null;
    return fit.rmse / Math.sqrt(sxx);
  })();
  out.confirmedByFit = trendConfirmed(out, maths.length, spanDays, MG_TREND.small);

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

  /* Consumption can come out negative when the level is rising faster than the
     dose supplies — a richer salt arriving with water changes will do it. The
     formula then yields a negative maintenance dose, which is not a thing
     anyone can pour, so zero is the floor and the situation is named. */
  if (out.consumption < 0) {
    out.gaining = -out.consumption;
    out.consumption = 0;
    out.maintenanceDose = 0;
  }

  /* No cap on consumption itself. Capping it blocked the trend-following
     increases the protocol explicitly asks for — a magnesium falling 25 ppm a
     week needs a bigger maintenance dose, and that is the dose doing its job.
     What the daily dose must never do is lift a level, which is why the
     out-of-range rescue is absent from this engine. When the implied
     maintenance is a large multiple of what is currently dosed, that is said
     rather than silently applied. */
  /* Checked here, before any branch, because a wrong strength poisons every
     path — including the ones that return "hold" while still printing a
     maintenance figure of a hundred millilitres a day. */
  out.anomaly = alkAnomaly(anomalyRows, alkFit(anomalyRows),
    Math.max(MG_TREND.meaningful * 2, (def.max - def.min) * 0.6));
  if (out.anomaly) {
    out.caution = `This reading sits well away from the ones before it, which pointed to about ${fmtVal(def, out.anomaly.expected)}${def.unit}. Magnesium rarely moves that fast on its own, so salinity and the dosing reservoir are worth a glance — otherwise the working below takes it as read.`;
  }

  const mgStrength = strengthPlausible("magnesium", settings);
  if (!mgStrength.ok || !dosePlausible(out.maintenanceDose, settings)) {
    out.action = "implausible";
    out.reason = !mgStrength.ok
      ? `The magnesium strength in Setup is ${mgStrength.value} ${mgStrength.unit}, which is outside anything a real product delivers (${mgStrength.lo}–${mgStrength.hi}). Every millilitre figure here is derived from it, so they will all be wrong until it is corrected. A ready-made magnesium part is around 0.012, and a double-strength mix around 0.024.`
      : `The working points to ${fmtAmount(out.maintenanceDose)} mL/day, which is not a real dose for ${fmtAmount(settings.volumeL)} L. The strength figure is the likely cause.`;
    out.nextCheck = "Correct the solution strength in Setup, and these figures will make sense.";
    return out;
  }

  /* Section 48: position comes from the pattern, not the last number. */
  const fittedNow = (fit && maths.length >= 3)
    ? maths.reduce((a, r) => a + r.value, 0) / maths.length
      + fit.slope * (alkStamp(maths[maths.length - 1])
        - maths.reduce((a, r) => a + alkStamp(r), 0) / maths.length)
    : out.current.value;
  out.fittedNow = fittedNow;
  const inRange = fittedNow >= def.min && fittedNow <= def.max;
  const above = fittedNow > def.max;
  const below = fittedNow < def.min;

  const bandWidth = def.max - def.min;
  const nearLower = inRange && (fittedNow - def.min) < bandWidth * 0.12;
  const nearUpper = inRange && (def.max - fittedNow) < bandWidth * 0.12;
  out.nearEdge = (nearLower && out.trendPerDay < 0) ? "lower"
    : (nearUpper && out.trendPerDay > 0) ? "upper" : null;

  /* Sections 36 to 38: verify a surprise before acting on it. */
  const lastInterval = intervals[intervals.length - 1];
  const weekMove = lastInterval ? Math.abs(lastInterval.change) : 0;
  const priorMoves = intervals.slice(0, -1).map((iv) => Math.abs(iv.change));
  /* Compared against the largest move the series has already made, not the
     median. A series alternating between two values has a median move of zero,
     which made every movement look exceptional. */
  const typicalMove = priorMoves.length ? Math.max(...priorMoves) : null;
  const outOfCharacter = typicalMove != null && weekMove > Math.max(MG_TREND.meaningful, typicalMove * 1.5);
  if (weekMove >= MG_TREND.meaningful && (intervals.length < 2 || outOfCharacter)) {
    out.caution = (out.caution ? out.caution + " " : "")
      + `That is more than magnesium usually moves in ${fmtAmount(lastInterval.days)} days — worth checking salinity and whether the solution was remixed at a different strength.`;
  }

  /* Sections 6, 21 and 52: a full week on a new dose before judging it. */
  const mgEmergency = lastChange
    && ((out.current.value < def.min && out.trendPerDay < 0) || (out.current.value > def.max && out.trendPerDay > 0))
    && Math.abs(out.trendPerWeek) >= MG_TREND.meaningful;

  if (!mgEmergency && lastChange && out.daysOnDose != null && out.daysOnDose < MG_SETTLE_DAYS) {
    if (weekMove >= MG_TREND.meaningful) {
      out.caution = (out.caution ? out.caution + " " : "")
        + `Magnesium moved ${fmtAmount(weekMove)}${def.unit} since the dose changed, which is more than it should this soon. Check salinity and the dosing reservoir — but a second dose change now would make the next reading impossible to read.`;
    }
    out.reason = `The magnesium dose changed to ${fmtAmount(out.currentDose)} mL/day ${Math.round(out.daysOnDose)} days ago. Magnesium moves slowly enough that a full week is the minimum before the new dose means anything. Hold and measure at the next weekly test.`;
    out.nextCheck = `Measure magnesium in about ${Math.max(1, Math.round(MG_SETTLE_DAYS - out.daysOnDose))} days.`;
    return out;
  }

  /* Sections 11 and 34: hold on anything inside test variation — but only
     while the tank is inside its range, or heading back into it. Below range
     and still falling, even slowly, is a leak that never gets fixed if a
     sub-threshold trend always returns "hold" (section 29). */
  const clearlyOut = above ? (fittedNow - def.max) > MG_TREND.stable
    : below ? (def.min - fittedNow) > MG_TREND.stable : false;
  const mgRepeats = repeatedCorrections(corrections, "magnesium", nowStamp);
  /* Exposed so the wording can mention it: the count is computed here, and
     the branch that needs it returns before anything further down. */
  const worsening = clearlyOut
    && (Math.abs(out.trendPerWeek) >= MG_TREND.stable || mgRepeats >= 2)
    && ((below && out.trendPerDay <= 0) || (above && out.trendPerDay >= 0));
  if (out.band === "stable" && !worsening
      && !doseDriftedFrom(out.maintenanceDose, out.currentDose, def.key,
        out.current != null && (out.current.value < def.min || out.current.value > def.max))) {
    out.ok = true; out.recommendedDose = out.currentDose; out.action = "hold";
    out.explanation = `Magnesium moved ${fmtAmount(Math.abs(out.trendPerWeek))}${def.unit} a week, which is inside what the test can resolve. Stable magnesium in the right range is the goal, not an identical number each week.`;
    out.nextCheck = "Measure again at your next weekly test.";

    /* Sections 26 and 27: a matched dose holds magnesium where it sits. */
    if (!inRange) {
      const mid = (def.min + def.max) / 2;
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

      out.explanation += ` But it is holding at ${fmtVal(def, out.current.value)}${def.unit}, ${above ? "above" : "below"} your range — a dose that matches consumption will keep it there indefinitely.`;
      const repeats = repeatedCorrections(corrections, "magnesium", nowStamp);
      if (repeats >= 2 && out.targetCorrection) {
        out.caution = (out.caution ? out.caution + " " : "")
          + `You have corrected magnesium ${repeats} times in the last couple of months and it keeps sagging back. That is a sign the daily dose is short rather than the level needing another lift — most often a salt mix below your target feeding weekly water changes. Raising the daily dose by around ${fmtAmount(out.targetCorrection.perDayMl)} mL would carry it instead of correcting again.`;
      }
      out.nextCheck = above
        ? `Let it drift down: hold this dose, or ease it back slightly, and let consumption and water changes bring magnesium toward the range. Magnesium moderately high is rarely urgent.`
        : out.targetCorrection
        ? (out.targetCorrection.oneOffMl > 1500
          /* Past a couple of litres the figure stops being advice. Quoting
             "roughly 14,438 mL of your maintenance solution" is arithmetically
             correct and useless — nobody pours fourteen litres into a 77 L
             tank. The sibling path in doseStatus was fixed for exactly this
             and this one was missed, which is what a units check is for. */
          ? `Raising it needs a dedicated magnesium supplement or dry salt — through your maintenance solution it would take litres, which is not what that bottle is mixed for. Work out the dose from the product's own instructions, spread it over at least ${out.targetCorrection.days} days, and log it so the rise is treated as your doing rather than as the tank needing less.`
          : `Raising it is a separate correction of roughly ${fmtAmount(out.targetCorrection.oneOffMl)} mL of your maintenance solution — which is a lot of liquid, so most people mix a stronger magnesium solution or use the dry salt for this and keep the daily bottle for maintenance. Spread it over at least ${out.targetCorrection.days} days. Log it when you have added it and the rise will be treated as your doing rather than as the tank needing less.`)
        : `Raising it needs a one-off correction rather than a bigger daily dose, but the amount cannot be worked out until the solution strength in Setup is right.`;
    }
    return out;
  }

  /* Sections 34, 58 and 65: 10–20 ppm a week waits for a second week. */
  if (out.band === "small" && inRange && !out.nearEdge && !out.confirmedByFit
      && (out.intervals < 2 || out.consistent === false)) {
    out.ok = true; out.recommendedDose = out.currentDose; out.action = "hold";
    out.explanation = `Magnesium moved ${fmtAmount(Math.abs(out.trendPerWeek))}${def.unit} a week and ${out.intervals < 2 ? "that is a single week's movement" : "the weeks do not agree with each other"}. At ${fmtVal(def, out.current.value)}${def.unit} it is comfortably inside your range, and magnesium is slow enough that another week costs nothing.`;
    out.nextCheck = "Measure again next week. If the same movement repeats, it is a real trend and worth acting on.";
    return out;
  }

  /* Sections 31 to 33: moving toward target is the direction you want. */
  const startedBelow = maths[0].value < def.min;
  const startedAbove = maths[0].value > def.max;
  /* A tank that began the window outside the range and is heading back is
     mid-correction. Judging it only by where it has arrived treats a working
     recovery as a new problem, and escalates a dose that is already doing its
     job. */
  const recovering = (startedBelow && out.trendPerDay > 0) || (startedAbove && out.trendPerDay < 0);
  const movingToTarget = (above && out.trendPerDay < 0) || (below && out.trendPerDay > 0);
  if (movingToTarget || recovering) {
    out.ok = true; out.recommendedDose = out.currentDose; out.action = "hold";
    const wasLow = below || startedBelow;
    out.explanation = movingToTarget
      ? `Magnesium is ${above ? "above" : "below"} your range at ${fmtVal(def, out.current.value)}${def.unit} and moving ${out.trendPerDay < 0 ? "down" : "up"} toward it at ${fmtAmount(Math.abs(out.trendPerWeek))}${def.unit} a week. That is the direction you want, so changing the dose now would work against it.`
      : `Magnesium started this period ${wasLow ? "below" : "above"} your range at ${fmtVal(def, maths[0].value)}${def.unit} and has been moving ${out.trendPerDay > 0 ? "up" : "down"} steadily to ${fmtVal(def, out.current.value)}${def.unit}. The correction is working — continue it rather than escalating, or magnesium will overshoot once it arrives.`;
    out.nextCheck = movingToTarget
      ? `Reassess once magnesium reaches ${fmtVal(def, def.min)}–${fmtVal(def, def.max)}${def.unit}.`
      : `Keep measuring weekly. Once magnesium settles inside the range, work out the maintenance dose from readings taken there.`;
    return out;
  }

  /* Sections 17, 18 and 51: a large calculated change resting on a single
     weekly interval is checked before it is acted on. Doubling a magnesium
     dose because of one test is exactly the move the protocol warns against —
     unless magnesium is already outside the range, where waiting costs more
     than verifying. */
  const rawChange = out.maintenanceDose - out.currentDose;
  const mag = Math.abs(rawChange);
  if (mag > 3 && out.intervals < 2 && inRange && !out.nearEdge) {
    out.caution = (out.caution ? out.caution + " " : "")
      + `This rests on one weekly reading and points to a ${fmtAmount(mag)} mL change, so the staged step below is deliberately smaller than the full figure.`;
  }
  const urgent = below || above || out.nearEdge != null
    || Math.abs(out.trendPerWeek) >= MG_TREND.meaningful;
  let applied;
  /* No rescue path here, unlike alkalinity and calcium. Raising the daily dose
     to lift a low magnesium is exactly what sections 26 and 27 warn against,
     and with a dilute maintenance product it produces figures nobody would
     pour — a tank drifting down asked for 72 mL/day. Levels are moved by a
     separate correction; this dose only ever tracks consumption. */
  if (mag <= 1) applied = rawChange;
  else if (mag <= 3) applied = rawChange * 0.8;
  else applied = urgent ? rawChange * 0.55 : rawChange * 0.45;

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
      at = Math.round((at + (Math.abs(remaining) > 3 ? remaining * (urgent ? 0.55 : 0.45) : remaining)) * 10) / 10;
      steps.push(at);
    }
    if (Math.abs(out.maintenanceDose - at) > 0.05) steps.push(Math.round(out.maintenanceDose * 10) / 10);
    out.plan = steps;
  }

  out.explanation =
    `Magnesium is ${out.trendPerDay < 0 ? "falling" : "rising"} ${fmtAmount(Math.abs(out.trendPerWeek))}${def.unit} a week across ${fmtAmount(spanDays)} days`
    + `${out.consistent ? ", in the same direction each week" : ""}`
    + `${out.nearEdge ? `, and at ${fmtVal(def, out.current.value)}${def.unit} it is close to the ${out.nearEdge === "lower" ? "bottom" : "top"} of your range — which is why a smaller movement is being acted on than would be elsewhere` : ""}. `
    + `At ${fmtAmount(out.currentDose)} mL/day you are adding ${fmtAmount(out.supplied)}${def.unit} a day, so the tank is using about ${fmtAmount(out.consumption)}${def.unit} a day. `
    + `Replacing that exactly would take ${fmtAmount(out.maintenanceDose)} mL/day`
    + (out.staged ? `, which is a large change to make on magnesium. Move part of the way and confirm over a week or two — magnesium is slow, so a wrong estimate is expensive to unwind.` : `.`)
    + (out.narrowedWindow ? ` This reads the last three weeks rather than the full five, because the recent weeks are moving faster than the period as a whole — averaged over everything it would look like ${fmtAmount(Math.abs(out.fullWindowTrend))}${def.unit} a week, which would understate what is happening now.` : "")
    + (out.maintenanceDose > out.currentDose * 3 && out.currentDose > 0
        ? ` That is more than three times what you dose now, which is a lot to ask of a maintenance solution — magnesium uptake is small, so a figure this size usually means something is pulling the level down rather than corals consuming it. Worth checking salinity and the salt mix before committing to the full amount; a one-off correction with a stronger solution is the usual route for closing a gap.`
        : "")
    + (out.salinityShift ? ` Note that salinity moved ${fmtAmount(Math.abs(out.salinityShift.shift))} ppt over this period, which alone accounts for roughly ${fmtAmount(Math.abs(out.salinityShift.impliedPpm))}${def.unit} of the movement — worth settling salinity before reading much into this.` : "");
  out.nextCheck = `Hold the new dose for a full week, then measure magnesium again. For a small change, two weeks gives a much clearer answer.`;
  return out;
}
