import { DOSE_ELEMENTS } from './consumption.js'
import { byNewest, regressionSlope, windowRows } from './time-of-day.js'
import { DEFAULT_SETTINGS } from './water-changes.js'
import { daysBetween, todayStr } from '../dates.js'
import { settleWindow } from '../findings.js'

/* --- The one drift rule ---
 *
 * Published guidance gives a clean decision line: weekly drift under ~0.5 dKH
 * is normal and needs no action; beyond that, dosing needs adjusting. Every
 * box on screen now derives from this same figure over the same window, so
 * "keep doing what you're doing" and "raise the dose" can no longer appear
 * side by side.
 */
export const DRIFT_GUIDE = {
  alkalinity: { perWeek: 0.5, unit: "dKH", dp: 2 },
  calcium:    { perWeek: 10,  unit: "ppm", dp: 0 },
  magnesium:  { perWeek: 25,  unit: "ppm", dp: 0 },
};

export function assessDrift(key, readings, days) {
  const guide = DRIFT_GUIDE[key];
  if (!guide) return null;
  const rows = windowRows(readings, key, days);
  if (rows.length < 3) return { status: "insufficient", rows: rows.length, guide };
  const slope = regressionSlope(rows);
  if (slope == null) return { status: "insufficient", rows: rows.length, guide };
  const spanDays = Math.max(1, daysBetween(rows[0].date, rows[rows.length - 1].date));
  const perWeek = slope * 7;
  const shown = parseFloat(Math.abs(perWeek).toFixed(guide.dp));
  return {
    status: "ok", guide, perWeek, shown, spanDays, rows: rows.length,
    direction: perWeek > 0 ? "rising" : perWeek < 0 ? "falling" : "flat",
    // Within the guide means hold; beyond it means the dose needs a nudge.
    needsAction: shown > guide.perWeek,
    severity: shown > guide.perWeek * 2 ? "high" : shown > guide.perWeek ? "mild" : "none",
  };
}

export const DOSE_ADVICE_RULES = {
  /* Assessment windows match the timescale each element is actually managed
     on: alkalinity weekly, calcium and magnesium fortnightly. After a doser
     change the clock restarts — a full window has to pass before the new rate
     can be judged, because the tank is still settling into it. */
  alkalinity: { minReadings: 3, minDaysSinceChange: 7,  meaningful: 0.3, unit: "dKH", dp: 2, window: 7,  maxWindow: 21 },
  calcium:    { minReadings: 3, minDaysSinceChange: 14, meaningful: 15,  unit: "ppm", dp: 0, window: 14, maxWindow: 35 },
  /* Magnesium only gets advice when it is actually being dosed — otherwise the
     movement is water changes, and telling someone to adjust a dose that does
     not exist is worse than saying nothing. Longer window, bigger threshold,
     because demand is roughly a tenth of calcium's. */
  magnesium:  { minReadings: 3, minDaysSinceChange: 14, meaningful: 40,  unit: "ppm", dp: 0, window: 14, maxWindow: 35 },
  /* `requiresDose: true` sat on magnesium here and was read by nothing —
     not by the app, not even by a test. Removed rather than guessed at: if
     magnesium should behave differently when no dose is configured, that is a
     decision to make deliberately, not a flag to leave lying about looking
     like it already does something. */
};

export function computeDoseAdvice(readings, doseLog, paramDefs, days = null, settings = DEFAULT_SETTINGS) {
  const out = {};
  let anyLastChange = null, anyDays = null;

  for (const key of Object.keys(DOSE_ADVICE_RULES)) {
    const def = paramDefs.find((d) => d.key === key);
    if (!def) continue;
    const rule = DOSE_ADVICE_RULES[key];

    /* Every element needs this, not just magnesium: telling someone "the dose
       is matching consumption, leave it alone" when they dose nothing at all
       is nonsense. */
    const cfg = DOSE_ELEMENTS.find((e) => e.key === key);
    const dosed = cfg ? (settings[cfg.doseField] || 0) : 0;
    if (dosed <= 0) { out[key] = { status: "notdosed", key, def }; continue; }

    /* Each element has its own doser history — changing the calcium dose says
       nothing about whether an alkalinity trend is readable. */
    const sortedDoses = [...(doseLog || [])]
      .filter((d) => (d.element || "alkalinity") === key)
      .sort(byNewest);
    const lastChange = sortedDoses.length ? sortedDoses[0] : null;
    const daysSinceChange = lastChange ? daysBetween(lastChange.date, todayStr()) : null;
    if (lastChange && (!anyLastChange || lastChange.date > anyLastChange.date)) {
      anyLastChange = lastChange; anyDays = daysSinceChange;
    }

    /* Dosing decisions use a fixed assessment window per element, NOT whatever
       window the user happens to be viewing. A week of alkalinity holds only
       four to six readings; at +/-0.1 dKH kit resolution, noise alone can fake
       a 0.5 dKH weekly slope. The chips change what you're looking at; they
       must not change what the app tells you to do to your doser. */
    /* Start at the element's natural window. If testing has been less frequent
       than that window assumes, reach back a little further rather than
       reporting nothing — and flag that it did, so the figure isn't mistaken
       for a clean fortnight. */
    let win = rule.window;
    let extended = false;
    while (win < (rule.maxWindow || rule.window)) {
      const r = windowRows(readings, key, win)
        .filter((x) => !lastChange || x.date >= lastChange.date);
      if (r.length >= rule.minReadings) break;
      win += 7;
      extended = true;
    }
    const viewWin = days && days < 99999 ? days : null;

    let rows = windowRows(readings, key, win);
    if (lastChange) rows = rows.filter((r) => r.date >= lastChange.date);
    if (rows.length < rule.minReadings) {
      out[key] = { status: "insufficient", key, rows: rows.length, need: rule.minReadings, win, extended, lastChange, daysSinceChange };
      continue;
    }
    /* The settling window, asked of the one function that computes it rather
       than read from a second table. minDaysSinceChange said 7 days for
       alkalinity while settleWindow said 3, and 14 for magnesium while
       settleWindow said 30 — a third answer to "how long before a change can
       be judged", disagreeing with the adaptive one on all three elements.
       The fixed figure is the floor, so a coarse kit on a slow tank still gets
       the longer wait it needs. */
    const settleFor = Math.max(
      rule.minDaysSinceChange,
      /* What the daily dose supplies, which is what sizes the window — `dosed`
         is millilitres and `supplied` was never in scope here. This threw on
         every call, and the gate hid it: textcheck.js was piped through
         `tail -1`, which discards the exit code. */
      settleWindow(key, dosed > 0 ? Math.abs(dosed * (cfg && cfg.effect ? cfg.effect(settings) : 0)) : null, settings));
    if (lastChange && daysSinceChange != null && daysSinceChange < settleFor) {
      /* Still describe what the readings are doing — the user can see the
         parameter moving, and saying nothing about it feels evasive. It just
         isn't grounds for touching the doser again yet. */
      let sinceMove = null;
      const sinceRows = rows.filter((r) => r.date >= lastChange.date);
      if (sinceRows.length >= 2) {
        const first = sinceRows[0].value, last = sinceRows[sinceRows.length - 1].value;
        const delta = last - first;
        if (Math.abs(delta) > 1e-9) {
          sinceMove = {
            delta, direction: delta > 0 ? "risen" : "fallen",
            amount: Math.abs(delta), n: sinceRows.length,
          };
        }
      }
      out[key] = {
        status: "settling", key, def, daysSinceChange, need: rule.minDaysSinceChange,
        lastChange, sinceMove, guide: DRIFT_GUIDE[key],
      };
      continue;
    }

    // Everything below comes from the one shared drift assessment.
    const drift = assessDrift(key, readings, win);

    /* Rising toward a band you are below is recovery, not overdosing. Judging
       by drift alone tells someone bringing a crashed tank back up to cut the
       dose, which would stall exactly the correction they are making. */
    if (drift && drift.status === "ok" && def) {
      const rowsWin = windowRows(readings, key, win);
      const first = rowsWin[0].value, last = rowsWin[rowsWin.length - 1].value;
      const startedBelow = first < def.min, startedAbove = first > def.max;
      const nowInside = last >= def.min && last <= def.max;
      const movingUp = drift.direction === "rising";
      /* Recovery means an active correction, not a parameter sitting stuck
         just outside its band while drifting by less than the kit can read.
         Require the movement to be real before calling it a correction. */
      const meaningful = drift.needsAction;
      const closing = meaningful &&
        ((startedBelow && movingUp) || (startedAbove && !movingUp));
      const overshooting = (startedBelow && movingUp && last > def.max)
        || (startedAbove && !movingUp && last < def.min);
      if (closing && !overshooting) {
        out[key] = {
          status: "recovering", key, def, drift, win,
          startedAt: first, now: last, nowInside,
          direction: drift.direction,
        };
        continue;
      }
    }
    if (!drift || drift.status !== "ok") {
      out[key] = { status: "insufficient", key, rows: rows.length, need: rule.minReadings, win };
      continue;
    }

    /* If the window on screen tells a different story, say so rather than
       leaving the user to spot the discrepancy themselves. */
    let viewNote = null;
    if (viewWin && viewWin < win) {
      const viewDrift = assessDrift(key, readings, viewWin);
      if (viewDrift && viewDrift.status === "ok" && viewDrift.needsAction !== drift.needsAction) {
        viewNote = {
          days: viewWin,
          shown: viewDrift.shown,
          direction: viewDrift.direction,
          steeper: viewDrift.shown > drift.shown,
        };
      }
    }

    /* A dose that matches consumption holds the level wherever it happens to
       be — including below the band. "Leave it alone" is right for the dose
       and wrong for the tank, so the two need separating. */
    const rowsNow = windowRows(readings, key, win);
    const latestVal = rowsNow.length ? rowsNow[rowsNow.length - 1].value : null;
    const offTarget = latestVal == null ? null
      : latestVal < def.min ? "low" : latestVal > def.max ? "high" : null;

    out[key] = {
      status: drift.needsAction ? "adjust" : "hold",
      key, def, drift, win, extended, viewWin, viewNote, daysSinceChange, lastChange,
      offTarget, latestVal,
      direction: drift.direction,
      pct: drift.severity === "high" ? 15 : 10,
      /* Only computed once the drift has cleared the same evidence bar the
         verdict uses, so a single reading can never move the doser. */
      calc: computeDoseCalc(key, drift.perWeek, settings),
    };
  }

  /* The joint observation is specifically about calcium and alkalinity moving
     as a pair. It must not be attached to magnesium, which was producing text
     naming the wrong two elements. */
  const a = out.alkalinity, c = out.calcium;
  const together = !!(a && c && a.status === "adjust" && c.status === "adjust" &&
    a.direction === c.direction);

  return { advice: out, together, lastChange: anyLastChange, daysSinceChange: anyDays };
}

/* --- Turning a drift into an actual dose ---
 *
 * The percentage nudge is a rule of thumb. With the doser rate and the product
 * strength recorded, the real figure can be derived instead:
 *
 *   delivered/day   = mL/day x strength x (100 / tank litres)
 *   consumed/day    = delivered/day - observed drift/day
 *   dose to hold    = consumed/day / (strength x 100 / litres)
 *
 * Any drift means dose and demand disagree; solving for the dose that makes
 * them equal is just arithmetic once the inputs exist.
 */
export function computeDoseCalc(key, driftPerWeek, settings) {
  const cfg = DOSE_ELEMENTS.find((e) => e.key === key);
  if (!cfg) return null;
  const s = { ...DEFAULT_SETTINGS, ...settings };
  const doseMl = s[cfg.doseField] || 0;
  const strength = s[cfg.strengthField] || 0;
  const litres = s.volumeL || 77;
  if (doseMl <= 0 || strength <= 0 || litres <= 0) return null;

  const perMl = strength * (100 / litres);      // units delivered per mL
  const delivered = doseMl * perMl;              // units per day
  const driftPerDay = driftPerWeek / 7;
  const consumed = delivered - driftPerDay;      // what the tank actually uses

  // If the tank consumes nothing (or gains), no dose can hold it level.
  if (consumed <= 0) {
    return { doseMl, perMl, delivered, driftPerDay, consumed, litres,
             impossible: true, recommendedMl: 0 };
  }

  const recommendedMl = consumed / perMl;
  const deltaMl = recommendedMl - doseMl;
  const pct = (deltaMl / doseMl) * 100;

  /* A single jump of more than about a fifth is a bigger correction than the
     tank should absorb at once, so suggest getting there in two steps. */
  const big = Math.abs(pct) > 20;
  const stepMl = big ? doseMl + deltaMl / 2 : recommendedMl;

  return {
    doseMl, perMl, delivered, driftPerDay, consumed, litres,
    recommendedMl, deltaMl, pct, big, stepMl, impossible: false,
  };
}

/* The calculation written out, so the number can be checked rather than trusted. */
export const CA_PER_DKH_LO = 6.4;
export const CA_PER_DKH_HI = 7.6;

export function computeIonicBalance(readings, settings = DEFAULT_SETTINGS) {
  const s = { ...DEFAULT_SETTINGS, ...settings };
  /* Every per-litre figure divides by volume, so without a sensible one the
     whole comparison degenerates into NaN and Infinity. */
  if (!(s.volumeL > 0)) return { status: "novolume",
    note: "Set your tank volume in Setup — calcium and alkalinity consumption are both worked out per litre, so nothing here can be calculated without it." };
  const alk = windowRows(readings, "alkalinity", 60);
  const ca = windowRows(readings, "calcium", 60);
  const mg = windowRows(readings, "magnesium", 60);
  if (alk.length < 2 || ca.length < 2) return null;

  const alkSlope = regressionSlope(alk);
  const caSlope = regressionSlope(ca);
  if (alkSlope == null || caSlope == null) return null;

  const alkDose = s.dailyDoseMl > 0 && s.dkhPerMlPer100L > 0
    ? s.dailyDoseMl * s.dkhPerMlPer100L * (100 / s.volumeL) : null;
  const caDose = s.calciumDoseMl > 0 && s.caPpmPerMlPer100L > 0
    ? s.calciumDoseMl * s.caPpmPerMlPer100L * (100 / s.volumeL) : null;

  const mgNote = (() => {
    if (!mg.length || !ca.length) return null;
    const mgV = mg[mg.length - 1].value, caV = ca[ca.length - 1].value;
    if (!caV) return null;
    const r = mgV / caV;
    if (r < 2.7) return { ok: false, ratio: r,
      text: `Magnesium to calcium is ${r.toFixed(2)}:1, below the ~3.1:1 of natural seawater. Low magnesium makes alkalinity and calcium hard to hold no matter how much you dose - worth correcting first.` };
    return { ok: true, ratio: r,
      text: `Magnesium to calcium is ${r.toFixed(2)}:1, around the ~3.1:1 of natural seawater. That's the ratio that keeps calcium and alkalinity in solution and easy to dose.` };
  })();

  if (alkDose == null || caDose == null) {
    const missing = [alkDose == null ? "alkalinity" : null, caDose == null ? "calcium" : null].filter(Boolean);
    return {
      status: "nodose", mgNote, missing,
      note: `Checking whether calcium and alkalinity are consumed in proportion needs to know what you dose - consumption is the dose minus whatever drift is left over. Enter your ${missing.join(" and ")} dose in Setup and this will work.`,
    };
  }

  const alkConsumed = alkDose - alkSlope;
  const caConsumed = caDose - caSlope;

  if (alkConsumed <= 0.01) {
    return {
      status: "noconsumption", mgNote, alkConsumed, caConsumed, alkDose, caDose,
      note: `Your alkalinity isn't being drawn down at all - the dose is outpacing whatever the tank uses, so there's no calcification signal to compare calcium against. Ease the alkalinity dose back until alkalinity holds level, then this check becomes meaningful.`,
    };
  }

  const ratio = caConsumed / alkConsumed;
  const expectedLo = alkConsumed * CA_PER_DKH_LO;
  const expectedHi = alkConsumed * CA_PER_DKH_HI;
  const impliedAlk = caConsumed / ((CA_PER_DKH_LO + CA_PER_DKH_HI) / 2);

  let verdict, note;
  if (ratio >= CA_PER_DKH_LO && ratio <= CA_PER_DKH_HI) {
    verdict = "balanced";
    note = `Calcium and alkalinity are being consumed in proportion - ${ratio.toFixed(1)} ppm of calcium per dKH, inside the ${CA_PER_DKH_LO}-${CA_PER_DKH_HI} that calcification produces. Nothing is pulling one down faster than the other, and your two products are matched to what the tank actually uses.`;
  } else if (ratio > CA_PER_DKH_HI) {
    verdict = "ca-heavy";
    note = `Calcium is disappearing faster than calcification can explain - ${ratio.toFixed(1)} ppm per dKH against the ${CA_PER_DKH_LO}-${CA_PER_DKH_HI} coral skeleton actually takes. Read it the other way: using ${caConsumed.toFixed(1)} ppm of calcium a day should come with about ${impliedAlk.toFixed(2)} dKH of alkalinity, but you only use ${alkConsumed.toFixed(2)}. Most likely causes in order: the calcium product's strength is entered wrong in Setup, your calcium kit reads high, or calcium is precipitating out - check pumps and heaters for white crust.`;
  } else {
    verdict = "ca-light";
    note = `Alkalinity is being consumed faster than the calcium figure explains - only ${ratio.toFixed(1)} ppm of calcium per dKH against the ${CA_PER_DKH_LO}-${CA_PER_DKH_HI} calcification takes. Either something is consuming alkalinity beyond coral growth, or one of the inputs is off. Worth checking the alkalinity product strength in Setup, and whether nitrate has been climbing - that consumes alkalinity without touching calcium.`;
  }

  return {
    status: "ok", verdict, note, mgNote,
    alkDose, caDose, alkSlope, caSlope,
    alkConsumed, caConsumed, ratio, expectedLo, expectedHi, impliedAlk,
    band: [CA_PER_DKH_LO, CA_PER_DKH_HI],
  };
}
