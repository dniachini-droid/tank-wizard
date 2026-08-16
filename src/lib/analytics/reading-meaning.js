import { computeRates } from './rate-analysis.js'
import { SALT_MIX } from './salt-baseline.js'
import { CONSISTENCY_RULES, ROUND_STEP, fmtVal, percentile, roundTo } from './time-in-range.js'
import { windowRows } from './time-of-day.js'
import { daysBetween, paramStatus } from '../dates.js'
import { directional } from '../findings.js'
import { STABILITY_RULES } from '../stability-engine.js'

/* --- What a reading actually means in practice ---
 *
 * Ranges alone don't tell you whether to worry. These notes carry the
 * practical consequence: magnesium at 1550 is above the usual target range but
 * widely reported as harmless (and typical of Aquaforest Reef Salt, which
 * mixes high), whereas phosphate at 0.3 is a real problem. Written to be
 * read as advice, not as a lookup table.
 */
export function paramContext(def, value, salt) {
  if (value == null || isNaN(value)) return null;
  const k = def.key;
  const above = value > def.max, below = value < def.min;
  if (!above && !below) return null;

  if (k === "magnesium") {
    if (above) {
      const fromSalt = salt && salt.values.magnesium >= 1380;
      return `For context, magnesium sitting in the 1500s is above the 1300–1400 most guides quote, but it's very widely reported as harmless — plenty of tanks run there for years with no ill effect on corals.${fromSalt ? ` ${salt.name} is known for mixing high in magnesium, so water changes are the likely source rather than anything going wrong.` : ""} Worth watching snails and other inverts, which are the first to mind it, and avoid pushing it higher.`;
    }
    return `Low magnesium is the one to fix promptly — it's what keeps calcium and alkalinity in solution, and when it drops they become difficult to hold no matter how much you dose.`;
  }

  if (k === "calcium") {
    if (above) {
      return `Calcium on the high side is not much of a worry — tanks run happily up to around 500–550 ppm, and high calcium causes far fewer problems than low. Just avoid raising alkalinity at the same time, since the two together are what causes precipitation.`;
    }
    return value < 380
      ? `Below about 380 ppm calcium starts to limit how fast corals can build skeleton, so this one is worth correcting — though gently. Check magnesium first, since low magnesium is usually the reason calcium won't hold.`
      : `At ${Math.round(value)} ppm you're just under your own target range, but comfortably inside the 380–450 ppm range most tanks run happily. Nothing here is harming corals — it only matters if it keeps falling, so watch the direction rather than the number.`;
  }

  if (k === "alkalinity") {
    if (above) {
      return `High alkalinity speeds up calcification, which sounds good but raises the risk of burnt SPS tips when nutrients are low. If your nitrate and phosphate are on the lean side, easing alkalinity down is worth more than chasing growth.`;
    }
    return `Alkalinity on the low side slows coral growth and leaves less buffer against pH swings. Bring it up slowly — no more than about 0.5 dKH a day — since the change itself stresses corals more than the low number does.`;
  }

  if (k === "phosphate") {
    if (above) {
      return `Elevated phosphate mostly shows up as nuisance algae and slower skeletal growth, and above roughly 0.15 ppm it can start interfering with alkalinity uptake. Bring it down gradually rather than stripping it — a sudden crash is harder on corals than the high number.`;
    }
    return `Phosphate this low starves corals rather than protecting them — pale, washed-out colour is the usual sign, and near-zero nutrients are what dinoflagellates thrive on. A little more feeding is normally the fix.`;
  }

  if (k === "nitrate") {
    if (above) {
      return `Higher nitrate usually shows as darker, browner coral tissue and faster algae growth rather than anything acute. Bring it down through water changes and export rather than chasing it with additives.`;
    }
    return `Nitrate this low tends to pale corals out and, combined with low phosphate, is the classic setup for dinoflagellates. Most reefers dose nitrate back up to around 5 ppm rather than running at zero.`;
  }

  if (k === "potassium") {
    if (above) {
      return `Potassium above about 430 ppm is rarely a problem on its own and usually tracks a salt mix or a supplement. Water changes will bring it back in line. Anywhere in the 380-420 range is comfortable, so small movements within that aren't worth chasing.`;
    }
    return `Potassium below about 360 ppm is sometimes linked to pale or washed-out colour in SPS. It moves slowly and hobby kits only resolve to roughly 20 ppm, so correct it gently and re-test in a month rather than a week.`;
  }

  if (k === "salinity") {
    return above
      ? `Salinity running high is usually evaporation outpacing top-off rather than anything added. Correct it slowly with fresh RODI — sudden salinity changes stress corals more than the level itself.`
      : `Salinity running low is normally too much top-off or a water change mixed light. Bring it up gradually over days rather than in one go.`;
  }

  if (k === "ph") {
    return above
      ? `A high pH reading is usually alkalinity-driven or a probe needing calibration. It rarely needs direct action.`
      : `Low pH is most often indoor CO2 rather than anything in the tank. More surface agitation, fresh air to the skimmer, or a refugium on a reverse light cycle all help more than buffering does.`;
  }

  if (k === "ammonia") {
    return above
      ? `Any measurable ammonia needs attention now — check for a dead animal, an overfed tank, or filtration that has been disturbed.`
      : null;
  }

  return null;
}

/* --- §22: a verdict never masks a position ---
 *
 * The tier is §13's, read from the LAST reading (reef-chemistry.md §26 —
 * position is the last reading, never a fitted or projected value). Alert
 * thresholds are §18's defaults, hung from the midpoint of the target range
 * — the derived anchor of §2 (no target point is stored anywhere): the
 * 8.2–8.8 range gives alert-low 7.5. Canon defines alert thresholds for the three dosed
 * elements only; the other parameters can reach the off-band tier but never
 * the alert tier. Band edges are inclusive of the band they bound, and a
 * value exactly on an alert threshold is at alert (§13 boundary rules);
 * distances are measured from the band edges with nothing added (§27, out
 * has no margin).
 */
export const ALERT_WIDTH = { alkalinity: 1.0, calcium: 50, magnesium: 200 };

export function positionBand(def, value) {
  const aw = ALERT_WIDTH[def.key];
  const mid = (def.min + def.max) / 2;
  if (value < def.min) {
    return aw != null && value <= mid - aw
      ? { band: "alert-low", tier: 2 } : { band: "out-of-band-low", tier: 1 };
  }
  if (value > def.max) {
    return aw != null && value >= mid + aw
      ? { band: "alert-high", tier: 2 } : { band: "out-of-band-high", tier: 1 };
  }
  return { band: "in-band", tier: 0 };
}

/* The verdict tones, ranked on the same three tiers as the bands: teal and
   green say in-band, blue and amber say off the band, red says act. A verdict
   may render soberer than its reading's band, never calmer — §22. */
const TONE_TIER = { "#0B7C86": 0, "#2A8050": 0, "#1D6FA5": 1, "#A2621B": 1, "#C4285B": 2, "#9FB0AE": 0 };

export function computeControl(def, readings, days = 90) {
  const rows = windowRows(readings, def.key, days);
  if (rows.length < 3) return null;
  const vals = rows.map((r) => r.value).sort((a, b) => a - b);
  const p05 = percentile(vals, 5), p50 = percentile(vals, 50), p95 = percentile(vals, 95);
  const spread = p95 - p05;
  const rangeWidth = def.max - def.min;

  /* Direction of travel and whether every step is inside test resolution —
     previously computed separately, now part of the single control result. */
  const chrono = rows;
  const spanDaysAll = Math.max(1, daysBetween(rows[0].date, rows[rows.length - 1].date));
  let maxDelta = 0, totalMovement = 0;
  for (let i = 1; i < chrono.length; i++) {
    const d = Math.abs(chrono[i].value - chrono[i - 1].value);
    if (d > maxDelta) maxDelta = d;
    totalMovement += d;
  }
  const netChange = chrono[chrono.length - 1].value - chrono[0].value;
  const directionality = totalMovement > 0 ? Math.abs(netChange) / totalMovement : 0;
  const pattern = totalMovement === 0 ? "flat"
    : directionality > 0.6 ? (netChange > 0 ? "trending up" : "trending down")
    : "oscillating";
  const sRule = STABILITY_RULES[def.key];
  const atResolution = sRule ? maxDelta <= sRule.noiseFloor : false;

  const inRange = rows.filter((r) => paramStatus(def, r.value) === "ok").length;
  const below = rows.filter((r) => r.value < def.min).length;
  const above = rows.filter((r) => r.value > def.max).length;
  const pct = Math.round((inRange / rows.length) * 100);

  // How tight is the tank's own band relative to the width of the target range?
  /* Consistency is now judged against published per-parameter tolerances
     rather than the width of whatever target range happens to be set. */
  /* Where a rate can be measured it supersedes the spread for grading, since
     a spread cannot distinguish a slow climb from a bounce. */
  const rateInfo = computeRates(def, readings, days);
  const rateGrade = rateInfo && rateInfo.daily
    ? (rateInfo.daily.grade === "good" && (!rateInfo.weekly || rateInfo.weekly.grade !== "poor") ? "tight"
       : rateInfo.daily.grade === "poor" ? "loose" : "moderate")
    : null;
  /* A parameter sliding steadily one way can keep its median inside the band
     while being anything but controlled. Treat severe drift as its own state
     rather than letting the median decide. */
  const severeDrift = rateInfo && rateInfo.weekly && rateInfo.weekly.grade === "poor";

  /* Spread between readings taken weeks apart says nothing about how much the
     parameter swung in between, so it should not be described as a swing. */
  const avgGapDays = spanDaysAll / Math.max(1, rows.length - 1);
  const readingsFarApart = avgGapDays > Math.max(7, (def.freqDays || 7) * 2);

  const cRule = CONSISTENCY_RULES[def.key];
  let metric = null, consistency = "unknown", metricLabel = "";
  if (cRule) {
    if (cRule.mode === "fold") {
      metric = p05 > 0 ? p95 / p05 : (p95 > 0 ? Infinity : 1);
      metricLabel = `${isFinite(metric) ? metric.toFixed(1) : "\u221E"}x swing`;
    } else {
      metric = spread;
      metricLabel = `${fmtVal(def, spread)}${cRule.unit} spread`;
    }
    consistency = metric <= cRule.tight ? "tight"
      : metric <= cRule.moderate ? "moderate" : "loose";
    if (rateGrade) consistency = rateGrade;
  }
  const ratio = rangeWidth > 0 ? spread / rangeWidth : null;

  /* Bar fill runs the intuitive way round: full means tightly held. */
  let consistencyScore = 0;
  if (cRule && metric != null && isFinite(metric)) {
    const base = cRule.mode === "fold" ? 1 : 0;
    const t = cRule.tight, m = cRule.moderate;
    if (metric <= t) consistencyScore = 1 - 0.15 * ((metric - base) / Math.max(1e-9, t - base));
    else if (metric <= m) consistencyScore = 0.85 - 0.35 * ((metric - t) / Math.max(1e-9, m - t));
    else consistencyScore = Math.max(0.12, 0.5 - 0.38 * Math.min(1, (metric - m) / Math.max(1e-9, m - base)));
  }
  /* "unknown" (no rule) renders the ungraded grey, not the loose red — a
     surface that cannot grade may not paint a grade (§22, unknown refuses). */
  const consistencyColor = consistency === "tight" ? "#0B7C86"
    : consistency === "moderate" ? "#A2621B"
    : consistency === "loose" ? "#C4285B" : "#9FB0AE";

  const step = ROUND_STEP[def.key] || def.step || 0.1;
  const suggested = { min: roundTo(p05, step), max: roundTo(p95, step) };
  // Only worth suggesting if it is materially different from the current target range.
  const suggestDiff = Math.abs(suggested.min - def.min) + Math.abs(suggested.max - def.max);

  /* Verdict is driven by where the median sits relative to the band, not by a
     percentage cliff. A median inside the band means the tank is in range and
     the excursions are noise; a median outside it means genuinely out of range. */
  const medianInside = p50 >= def.min && p50 <= def.max;
  /* If the whole spread sits inside the target range, the parameter is doing
     exactly what was asked of it — a fold ratio shouldn't override that. */
  const wholeRangeInBand = p05 >= def.min && p95 <= def.max;
  if (wholeRangeInBand && consistency === "moderate") consistency = "tight";
  const bias = p50 > def.max ? "high" : p50 < def.min ? "low" : "centred";
  const gap = bias === "high" ? p50 - def.max : bias === "low" ? def.min - p50 : 0;
  const gapTxt = gap === 0 ? "" : (gap < 1 ? gap.toFixed(2) : gap.toFixed(0)) + (def.unit || "");
  const dirWord = bias === "high" ? "above" : "below";

  let verdict, tone, headline, note, refused = false, missing = null;

  const name = def.label.toLowerCase();
  const band = `${fmtVal(def, def.min)}\u2013${fmtVal(def, def.max)}${def.unit}`;
  const latestVal = chrono[chrono.length - 1].value;
  const outside = below + above;

  const directional = pattern === "trending up" || pattern === "trending down";
  const wayWord = pattern === "trending up" ? "up" : "down";

  if (!cRule) {
    /* \u00a722 "Unknown refuses", per \u00a713's last row: where consistency cannot be
       graded, refuse and name what is missing \u2014 never fall through to a
       verdict resting on no grading. Latent today: every PARAM_DEFS key has a
       CONSISTENCY_RULES entry, so no live parameter reaches this. */
    refused = true; verdict = null; missing = "consistency tolerance rule";
    tone = "#9FB0AE"; headline = "Steadiness not graded";
    note = `No consistency tolerance is defined for ${name}, so how steady it has been can't be graded \u2014 saying nothing beats grading against nothing. The readings and their position are unaffected.`;
  } else if (severeDrift || (consistency === "loose" && directional)) {
    /* One-way movement is a slide, not a swing — the advice differs and so
       should the word. */
    verdict = "sliding"; tone = "#C4285B"; headline = `Moving ${wayWord} fast`;
    const change = Math.abs(netChange);
    note = `Your ${name} has gone from ${fmtVal(def, chrono[0].value)} to ${fmtVal(def, latestVal)}${def.unit} across these ${rows.length} readings — ${fmtVal(def, change)}${def.unit} in one direction. That's not test scatter, it's a genuine slide, and it's the fastest way to lose corals even while the average still looks respectable. Getting it to stop matters more than where it stops.`;
  } else if (consistency === "loose") {
    verdict = "loose"; tone = "#C4285B"; headline = "Wide swing";
    note = readingsFarApart
      ? `Your ${name} has covered ${fmtVal(def, p05)} to ${fmtVal(def, p95)}${def.unit} across these readings, but they average ${Math.round(avgGapDays)} days apart — so that range is drift over time rather than a swing you can pin down. Testing closer together would show whether it's moving smoothly or bouncing.`
      : `Your ${name} has bounced between ${fmtVal(def, p05)} and ${fmtVal(def, p95)}${def.unit} here, and a swing that size is something corals notice. ${cRule ? cRule.why.charAt(0).toUpperCase() + cRule.why.slice(1) + "." : ""} Getting the movement under control matters more right now than where the number sits — steady in the wrong place beats bouncing through the right one.`;
  } else if (medianInside && pct >= 85 && consistency === "tight") {
    verdict = "dialled"; tone = "#0B7C86"; headline = "Dialled in";
    note = `Your ${name} is sitting comfortably in the ${band} you're aiming for, and holding it there. ${outside === 0 ? `Every reading landed inside the band.` : `Only ${outside} of ${rows.length} readings stepped outside.`} This is what you want it to look like.`;
  } else if (medianInside) {
    verdict = "controlled"; tone = "#2A8050"; headline = "Well controlled";
    const bothSides = below > 0 && above > 0;
    note = `Your ${name} is centred in the ${band} band, currently reading ${fmtVal(def, latestVal)}${def.unit}.${outside === 0 ? ` Every reading landed inside it.` : bothSides ? ` ${outside} of ${rows.length} readings drifted outside, on both the high and low side, so there's no consistent bias — that pattern is normal test-to-test variation.` : ` ${outside} of ${rows.length} readings sat ${below > 0 ? "under" : "over"} the band.`}${consistency === "moderate" ? ` Movement is a little wider than ideal, so it's worth keeping an eye on.` : ``}`;
  } else if (consistency === "tight") {
    verdict = "steady-off"; tone = "#1D6FA5"; headline = `Steady, running ${bias}`;
    note = `Your ${name} has been very steady, but it's settled around ${fmtVal(def, p50)}${def.unit} — about ${gapTxt} ${dirWord} the ${band} you're aiming for. Corals care far more about steadiness than about the exact number, so a tank parked here and holding is in decent shape. The usual call is to move your target range to match the tank rather than push the tank to match the range.`;
  } else {
    /* Renamed from `drifting` (§22): that is §13's band word — inside the
       band, trending toward an edge — and this verdict fires on close to the
       opposite condition, the window median outside the band. Same
       condition, same tone, same note apart from the word. */
    verdict = "unsettled"; tone = "#A2621B"; headline = `Unsettled ${bias}`;
    note = `Your ${name} is running around ${fmtVal(def, p50)}${def.unit}, roughly ${gapTxt} ${dirWord} the ${band} band, and it's moving about while it does. Steady the movement first — corrections are far easier to judge once a parameter has stopped wandering.`;
  }

  /* §22's alert tier: every verdict carries the tier of the latest reading's
     §13 band and renders no calmer than it. The verdict word itself never
     changes — the window graded the window; the tier reports the reading. At
     the alert tier the note leads with the position, in §13/§15's own words
     ("needs attention", "alert"), before it discusses steadiness. */
  const position = positionBand(def, latestVal);
  if ((TONE_TIER[tone] ?? 0) < position.tier) {
    tone = position.tier === 2 ? "#C4285B" : "#A2621B";
  }
  if (position.tier === 2) {
    const side = position.band === "alert-low" ? "below" : "above";
    note = `Your ${name} needs attention: the latest reading, ${fmtVal(def, latestVal)}${def.unit}, is at or ${side} the alert threshold. ` + note;
  }

  const contextNote = paramContext(def, latestVal, SALT_MIX);

  /* Only offer a new target range where the tank is genuinely biased and held
     tightly. Suggesting a wider band for a swinging parameter would just
     hide instability, and a centred median needs no retarget at all. */
  const suggestWorth = verdict === "steady-off" && suggestDiff > (ROUND_STEP[def.key] || def.step || 0.1) * 1.5;

  return {
    rows: rows.length, pct, inRange, below, above,
    p05, p50, p95, spread, ratio, consistency, consistencyScore, consistencyColor,
    medianInside, bias, gap, metric, metricLabel, cRule,
    pattern, atResolution, maxDelta, netChange, rateInfo, rateGrade,
    suggested, suggestWorth, verdict, tone, headline, note, contextNote, days,
    position, refused, missing,
  };
}
