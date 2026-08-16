import { DOSE_ELEMENTS, computeConsumption } from './analytics/consumption.js'
import { calibrateDoseStrength } from './analytics/dose-strength.js'
import { computeIonicBalance } from './analytics/drift.js'
import { computeCalibration } from './analytics/icp-calibration.js'
import { icpRef, icpStatus } from './analytics/icp-reference.js'
import { kitSigma, regressionWithError } from './analytics/measurement-noise.js'
import { computeNutrientProduction, computeNutrientRatio } from './analytics/nutrients.js'
import { fmtAmount, fmtVal } from './analytics/time-in-range.js'
import { byNewest, byOldest, windowRows } from './analytics/time-of-day.js'
import { PARAM_DEFS } from './constants.js'
import { daysBetween, fmtDate, paramStatus, todayStr } from './dates.js'
import { assessAlkalinity } from './dosing/alkalinity.js'
import { assessCalcium } from './dosing/calcium.js'
import { assessMagnesium } from './dosing/helpers.js'
import { joinList } from './narrative-engine.js'
import { STABILITY_RULES } from './stability-engine.js'

/* --- Shared findings layer ---
 *
 * Every analysis used to end at its own conclusion, so the calcium dose box
 * could recommend raising the dose while the ionic check simultaneously said
 * calcium was already disappearing faster than calcification explains. Each
 * analysis now emits findings into one pool, and any screen can ask what is
 * relevant to it. One place reasons; everywhere else reads.
 *
 * A finding carries:
 *   params    which parameters it concerns (for routing to cards and modals)
 *   severity  "info" | "watch" | "act"
 *   scope     "reading-accuracy" | "dosing" | "chemistry" | "nutrients" | "trace"
 *   title     short label for a badge
 *   detail    the full sentence, written to stand alone wherever it appears
 */
export const DOSED_ELEMENTS = new Set(["alkalinity", "calcium", "magnesium"]);

/* Phosphate and nitrate are managed by export and feeding, not by a daily
   dose, and no reasoning of their own is written in canon yet —
   reef-chemistry.md §25's coverage table lists them as "assessed with
   borrowed and wrong reasoning ... nowhere — TW-029". The generic level and
   trend loops below apply alkalinity-shaped rules to every parameter: an
   alarm scaled to the width of the user's own band, and a 30-day regression
   over what is a 4-5 reading window at their 7-day cadence. §12 forbids
   exactly that: the app does not judge one parameter by another parameter's
   thresholds, trend logic or evidence bar.

   The band-width threshold was not merely noisy here — it was unreachable on
   the side that matters. At the default bands the far-out-low trigger sat at
   −0.040 ppm phosphate and −5 ppm nitrate, values no kit can return, so a
   phosphate of 0.00 ppm — outside SAFE_BOUNDS' own 0.01 minimum — produced
   nothing at all, while ordinary nutrient bounce produced confident notices.

   So both loops skip these two until their own rules are written into canon
   (§25: covering a parameter means covering it correctly or not at all).
   Their band-position chips, stability grades and the nutrient-specific
   findings below all still speak; only the borrowed judgements are removed.
   Salinity stays in the loops deliberately — its treatment is TW-030's own
   decision, not a side effect of this one. */
export const NUTRIENTS_AWAITING_OWN_RULES = new Set(["phosphate", "nitrate"]);

/* What the hobby regards as safe, as distinct from whatever band you have set
   as your target range.
   
   These matter because "outside your target range" and "dangerous" are different
   claims, and the app was treating them as the same one. Alkalinity 7.5 on a
   target range of 8.5–9.5 was reported as "a long way below range" at act severity —
   but 7.5 dKH is a perfectly ordinary alkalinity, and Randy Holmes-Farley's
   own guidance puts the workable range at roughly 7–11 dKH. Raising an alarm
   there trains people to ignore alarms.

   Outside your target range but inside these bounds is worth knowing. Outside these
   is worth acting on. Ammonia is absent deliberately: any detectable reading
   is handled on its own terms, because there is no safe amount. */
/* Test kit precision, chosen in Setup. The settling window is derived from it:
   a better kit earns a verdict sooner because a given dose error clears its
   noise in fewer days. Figures are manufacturers' own repeatability for
   alkalinity, rounded conservatively. Calcium and magnesium kits are coarse
   enough that the differences between brands do not matter. */
export const KIT_PRECISION = {
  /* Hanna's alkalinity checker is the most precise in common use; its calcium
     checker is not. BRS measured a 101 ppm spread between highest and lowest
     Hanna calcium readings on one sample, against 10 ppm for Red Sea and a
     6 ppm deviation for Salifert magnesium. Carrying 10 ppm here because the
     alkalinity figure is good was flattering the wrong instrument. */
  hanna:    { alkalinity: 0.10, calcium: 15, magnesium: 25, label: "Hanna checker" },
  salifert: { alkalinity: 0.15, calcium: 10, magnesium: 25, label: "Salifert" },
  redsea:   { alkalinity: 0.20, calcium: 5, magnesium: 25, label: "Red Sea" },   /* Red Sea quote 5 ppm and BRS measured a 10 ppm spread */
  other:    { alkalinity: 0.20, calcium: 15, magnesium: 30, label: "Other / not sure" },
};

export function kitNoise(paramKey, settings) {
  const perElement = settings && settings.testKits && settings.testKits[paramKey];
  const chosen = perElement || (settings && settings.testKit) || "hanna";
  const kit = KIT_PRECISION[chosen] || KIT_PRECISION.other;
  return kit[paramKey] != null ? kit[paramKey] : (KIT_PRECISION.other[paramKey] || 0.1);
}

/* How many days of readings before a rate means anything on this tank.
   Not the calendar: what has to be detectable is the smallest dose error worth
   correcting, about 15% of the dose. On a tank consuming 3 dKH a day that
   error moves alkalinity 0.48 a day and clears the kit in one; on a nano at
   0.25 it moves 0.04 and takes five. A fixed two days was too short for slow
   tanks and wasted a day on fast ones. */
export function settleWindow(paramKey, dailySupply, settings) {
  const floor = paramKey === "alkalinity" ? 2 : 7;
  const ceiling = paramKey === "alkalinity" ? 5 : 30;
  const cons = Math.abs(dailySupply || 0);
  if (!(cons > 0)) return floor;
  const needed = (2 * kitNoise(paramKey, settings) * Math.SQRT2) / (0.15 * cons);
  return Math.max(floor, Math.min(ceiling, Math.round(needed)));
}

export const SAFE_BOUNDS = {
  /* Randy Holmes-Farley states 7–11 dKH as the workable range outright, so
     that is the boundary. It had been widened to 6.5–12 on the reasoning that
     calcification only stalls below 6 — but the effect was that 6.9 dKH read
     as "steady, a few sitting off-target" and scored 71, which is far too calm
     for a tank that low. Below 7 or above 11 is worth saying plainly. */
  alkalinity: { min: 7, max: 11 },
  /* Below 380 growth slows; above 500 the sources describe alkalinity being
     dragged down, which is a real risk rather than merely out of range. */
  calcium:    { min: 350, max: 500 },
  /* Above about 1600 the sources report lethargic invertebrates and suppressed
     calcium and alkalinity uptake. An earlier attempt at this edit matched on
     single spacing and silently did nothing — the assertion caught it. */
  magnesium:  { min: 1150, max: 1600 },
  nitrate:    { min: 0.5, max: 50 },   /* zero starves corals; high is ugly, not acute */
  phosphate:  { min: 0.01, max: 0.5 },
  ph:         { min: 7.7, max: 8.6 },
  /* reefcalcs give the acceptable range as 32-37 ppt with no benefit at
     either end; 38 was beyond anything published. */
  salinity:   { min: 32, max: 37 },
  /* Toxicity is reported above 500 ppm — stress and mortality in sensitive
     invertebrates. A ceiling of 470 was tighter than the harm point, which
     means flagging tanks that are not in trouble. */
  potassium:  { min: 330, max: 500 },
};


/* Whether the readings actually travel in one direction rather than wandering.
   A random walk reverses about half its steps; a genuine trend reverses far
   fewer. Measured on a real tank, a window that reversed 42% of the time
   predicted continued movement no better than chance. */
export function directional(rows) {
  if (!rows || rows.length < 4) return false;
  const overall = rows[rows.length - 1].value - rows[0].value;
  if (overall === 0) return false;
  let same = 0, steps = 0;
  for (let i = 1; i < rows.length; i++) {
    const d = rows[i].value - rows[i - 1].value;
    if (d === 0) continue;
    steps++;
    if (Math.sign(d) === Math.sign(overall)) same++;
  }
  /* Two thirds of steps agreeing is comfortably clear of a coin flip without
     demanding a monotonic climb, which real data never gives. */
  return steps >= 3 && same / steps >= 0.67;
}

export function buildFindings({ readings, icps, paramDefs, settings, doseLog, waterChanges, latestByParam, kitChanges = {}, corrections = [] }) {
  const out = [];
  const add = (f) => out.push(f);

  /* The dosing protocol's verdict for an element, or null when it cannot form
     one — no strength entered, too few readings. Only when it cannot does the
     generic trend detector below speak for that element. */
  const doseVerdictCache = {};
  const doseVerdict = (key) => {
    if (key in doseVerdictCache) return doseVerdictCache[key];
    let v = null;
    try {
      const def = paramDefs.find((d) => d.key === key);
      const fn = key === "alkalinity" ? assessAlkalinity
        : key === "calcium" ? assessCalcium
        : key === "magnesium" ? assessMagnesium : null;
      if (def && fn) {
        const a = fn({ readings, doseLog, waterChanges, corrections, settings, def });
        /* An unconfigured element returns "hold" with a reason asking for the
           strength — that is not a verdict, and treating it as one silenced
           the trend warning on a tank that had never been set up. Only a
           verdict the protocol could actually reach counts. */
        const usable = a && a.action
          && a.action !== "implausible" && a.action !== "blocked"
          && a.effectPerMl > 0 && a.currentDose != null;
        v = usable ? a.action : null;
      }
    } catch (e) { v = null; }
    doseVerdictCache[key] = v;
    return v;
  };

  /* --- Test kit accuracy, from paired ICP comparisons ---
     This is the most under-used knowledge in the app: a kit reading 222% high
     silently undermines every conclusion drawn from that parameter. */
  const cal = computeCalibration(readings, icps, paramDefs, 7, kitChanges);
  const kitOffsets = {};
  for (const r of cal.results) {
    const pct = r.meanPct;
    kitOffsets[r.def.key] = { pct, meanDiff: r.meanDiff, n: r.n, def: r.def };
    if (Math.abs(pct) < 5) continue;
    const severe = Math.abs(pct) >= 25;
    add({
      id: "kit-" + r.def.key,
      params: [r.def.key],
      scope: "reading-accuracy",
      severity: severe ? "act" : "watch",
      title: `kit reads ${pct > 0 ? "high" : "low"} ${Math.abs(pct).toFixed(0)}%`,
      detail: severe
        ? `Your ${r.def.label.toLowerCase()} kit read ${Math.abs(pct).toFixed(0)}% ${pct > 0 ? "higher" : "lower"} than the lab across ${r.n} paired comparison${r.n === 1 ? "" : "s"}. That's far beyond normal kit variation, so anything derived from these readings — target ranges, trends, dosing advice — is built on a number the lab disagrees with. Worth replacing the reagent before acting on it.`
        : `Your ${r.def.label.toLowerCase()} kit runs about ${Math.abs(pct).toFixed(0)}% ${pct > 0 ? "high" : "low"} against the lab. Small, but it shifts every figure derived from it in the same direction, so treat ${r.def.label.toLowerCase()} conclusions as carrying that offset.`,
    });
  }

  /* --- Ammonia ---
     Ammonia was displayed and never interpreted, so a tank at 0.4ppm produced
     no warning at all. It is the only parameter where a single reading is
     grounds for acting immediately, so it is checked first and can reach the
     highest severity. */
  const amDef = paramDefs.find((d) => d.key === "ammonia");
  const amLast = latestByParam && latestByParam.ammonia;
  if (amDef && amLast) {
    const v = amLast.value;
    const stale = daysBetween(amLast.date, todayStr()) > 3;
    if (v > amDef.max) {
      add({
        id: "ammonia-high", params: ["ammonia"], scope: "chemistry", severity: "act", value: v,
        title: "ammonia is dangerously high",
        detail: `${fmtVal(amDef, v)}${amDef.unit} on ${fmtDate(amLast.date)}. This is harmful to fish and corals now. Re-test to confirm, then look for a dead animal, an overfeed, or a filter that has been disturbed or replaced. A water change buys time while you find the cause.`,
      });
    } else if (v > (amDef.step || 0.01) / 2) {
      add({
        id: "ammonia-detected", params: ["ammonia"], scope: "chemistry", severity: "act", value: v,
        title: "ammonia is detectable",
        detail: `${fmtVal(amDef, v)}${amDef.unit} on ${fmtDate(amLast.date)}. An established tank should read zero — anything measurable means waste is being produced faster than the biology can process it. Worth re-testing today and checking for anything that has died or any recent change to the filtration.${stale ? " This reading is a few days old, so confirm it before acting." : ""}`,
      });
    }
  }

  /* --- Parameters a long way outside their range ---
     Nothing here could previously reach "act": a tank at 11.5 dKH with 45ppm
     nitrate produced only "watch" findings, so the app had no way to say that
     something mattered now rather than eventually. A full band-width outside
     is the threshold, which scales with whatever range you have set. */
  for (const def of paramDefs) {
    if (def.key === "ammonia") continue;          // handled above, on its own terms
    if (NUTRIENTS_AWAITING_OWN_RULES.has(def.key)) continue;
    const last = latestByParam && latestByParam[def.key];
    if (!last) continue;
    const half = (def.max - def.min) / 2;
    if (!(half > 0)) continue;
    const over = last.value - def.max, under = def.min - last.value;
    const outBy = Math.max(over, under);
    if (outBy < half * 2) continue;               // two half-bands = a full band out

    const dir = over > 0 ? "above" : "below";
    /* A full band outside a narrow target range can still be a perfectly ordinary
       reading. Only escalate when it is also outside what the hobby treats as
       safe; otherwise this is worth knowing, not worth alarm. */
    const safe = SAFE_BOUNDS[def.key];
    const unsafe = !safe || last.value < safe.min || last.value > safe.max;
    add({
      id: "far-out-" + def.key, params: [def.key], scope: "chemistry",
      severity: unsafe ? "act" : "watch",
      value: last.value,
      /* The severity already distinguished dangerous from merely out of range;
         the wording did not. At 5.0 dKH the Dosing Wizard said "dangerously
         low" while the summary said "a long way below range" — the same fact,
         two registers, and the softer one is where most people look first. It
         also read identically at 6.5 and at 3.0.

         The value is named for the same reason the wizard names it: "a long
         way" is a judgement, and a number is not. */
      title: unsafe
        ? `${def.label.toLowerCase()} is ${fmtVal(def, last.value)}${def.unit} — dangerously ${dir === "below" ? "low" : "high"}`
        : `${def.label.toLowerCase()} is well ${dir} your target range`,
      detail: `${fmtVal(def, last.value)}${def.unit} against a target range of ${fmtVal(def, def.min)}–${fmtVal(def, def.max)}${def.unit}, measured ${fmtDate(last.date)}. Confirm it with a second test before making a large correction — a single reading this far out is as likely to be a test error as a real change. If it holds, correct it gradually: moving ${def.label.toLowerCase()} quickly is usually harder on livestock than the level itself.` + (unsafe ? "" : ` For what it is worth, ${fmtVal(def, last.value)}${def.unit} is still inside what the hobby treats as workable for ${def.label.toLowerCase()} — outside your target range rather than dangerous, so bring it back at a steady pace rather than in one move.`),
    });
  }

  /* A replaced kit clears the old warning, but nothing yet proves the new one
     is any better — which is worth stating rather than leaving silence. */
  for (const r of cal.replaced || []) {
    add({
      id: "kit-replaced-" + r.def.key,
      params: [r.def.key],
      scope: "reading-accuracy",
      severity: "info",
      title: `${r.def.label.toLowerCase()} kit replaced`,
      detail: `You recorded a new ${r.def.label.toLowerCase()} kit on ${fmtDate(r.since)}, so comparisons against earlier lab panels no longer apply and the previous offset has been cleared. The next ICP panel will check the new kit against the lab and, if they disagree again, say so.`,
    });
  }

  /* --- Ionic balance, routed to both elements it concerns --- */
  const bal = computeIonicBalance(readings, settings);
  /* Fired on 100% of tanks in testing, because any ratio outside the band
     counted however marginally. A finding that always appears carries no
     information, so it now needs to be meaningfully outside. */
  const ratioOff = bal && bal.band && isFinite(bal.ratio)
    ? (bal.ratio < bal.band[0] * 0.85 || bal.ratio > bal.band[1] * 1.15)
    : false;
  if (bal && bal.status === "ok" && bal.verdict !== "balanced" && ratioOff) {
    /* Route to whichever element is actually out of step. "ca-heavy" means
       calcium is the anomaly; "ca-light" points at alkalinity instead. The
       other element is named in the text, which is where it belongs. */
    const subject = bal.verdict === "ca-heavy" ? "calcium" : "alkalinity";
    add({
      id: "ionic",
      params: [subject],
      scope: "chemistry",
      severity: "watch",
      /* This finding is about the RATIO between calcium and alkalinity use, not
         about either one's direction. Titling it "falling" was read as a claim
         about the trend, and fired on tanks whose alkalinity was climbing. */
      title: bal.verdict === "ca-heavy"
        ? "calcium and alkalinity are out of step"
        : "alkalinity and calcium are out of step",
      detail: bal.note,
      ratio: bal.ratio, band: bal.band,
    });
  }

  const unverified = [];

  /* --- Dose strength confidence ---
     Millilitre recommendations rest on a strength figure. If that has never
     been checked against the tank's own response, the advice should say so. */
  for (const el of DOSE_ELEMENTS) {
    const c = calibrateDoseStrength(el.key, readings, doseLog, waterChanges, settings);
    if (!c) continue;
    if (c.status === "ok" && !c.enteredInside && !c.implausible) {
      add({
        id: "strength-" + el.key,
        params: [el.key],
        scope: "dosing",
        severity: "act",
        title: "dose strength looks wrong",
        detail: `Your own dose changes imply ${el.label.toLowerCase()} delivers ${c.median.toFixed(4)} ${el.strengthLabel}, not the ${c.entered} entered in Setup. Every millilitre figure for ${el.label.toLowerCase()} is scaled by that, so correct it before acting on any dose advice.`,
      });
    } else if (c.status === "nochanges" || c.status === "nodata") {
      const dosed = settings[el.doseField] > 0;
      const strengthVal = settings[el.strengthField];
      const strengthOk = typeof strengthVal === "number" && isFinite(strengthVal) && strengthVal > 0;
      if (dosed && !strengthOk) {
        /* Dosing with no usable strength means every millilitre figure for this
           element is meaningless, which matters more than verification. */
        add({
          id: "strength-missing-" + el.key,
          params: [el.key],
          scope: "dosing",
          severity: "act",
          title: "dose strength missing",
          detail: `You're dosing ${el.label.toLowerCase()} but Setup has no usable strength for it, so the app can't work out what those millilitres deliver. Enter how much 1 mL raises 100L and the consumption and dosing figures will start working.`,
        });
      } else if (dosed) {
        /* Collected and reported once below. Three separate findings saying the
           same sentence about three elements read as three problems. */
        unverified.push(el);
      }
    }
  }

  if (unverified.length) {
    const names = unverified.map((e) => e.label.toLowerCase());
    add({
      id: "strength-unverified",
      params: unverified.map((e) => e.key),
      scope: "dosing",
      severity: "info",
      title: unverified.length === 1
        ? `${names[0]} strength not yet confirmed`
        : "dose strengths not yet confirmed",
      detail: `The strength figures for ${joinList(names)} are entered and being used, but none has been checked against how your tank actually responds. Record a dose change of a millilitre or more and, after a few weeks of readings, the app can solve for the real figure. Until then every millilitre recommendation is only as good as those numbers.`,
    });
  }

  /* --- Physically implausible consumption ---
     If the numbers imply a tank consuming far more than any reef plausibly can,
     the inputs are wrong rather than the tank extraordinary. Almost all tanks
     sit between 0.1 and 1.0 dKH a day; heavily stocked SPS systems reach ~2.
     Anything beyond that points at a mis-entered dose or product strength —
     the same failure that can quietly inflate every downstream figure. */
  const consCheck = computeConsumption(readings, settings);
  if (!(settings.volumeL > 0)) {
    add({
      id: "no-volume",
      params: [],
      scope: "dosing",
      severity: "act",
      title: "tank volume not set",
      detail: `Every dosing and consumption figure divides by your tank volume, so without a sensible number in Setup none of them mean anything. Enter your net water volume — total system litres less rock and sand displacement, usually around 80-85% of the display figure.`,
    });
  }
  if (consCheck && consCheck.consumption != null &&
      isFinite(consCheck.consumption) && consCheck.consumption > 2) {
    add({
      id: "implausible-alk",
      params: ["alkalinity"],
      scope: "dosing",
      severity: "act",
      title: "consumption looks too high to be real",
      detail: `The figures imply your tank consumes ${consCheck.consumption.toFixed(1)} dKH a day. Almost every reef sits between 0.1 and 1.0, and even heavily stocked SPS systems rarely pass 2. That points at the dose or the product strength in Setup being wrong rather than the tank being remarkable — worth re-checking both, since every consumption, skeleton and dosing figure is scaled by them.`,
    });
  }
  const balCheck = computeIonicBalance(readings, settings);
  if (balCheck && balCheck.status === "ok" && isFinite(balCheck.caConsumed) && balCheck.caConsumed > 0) {
    const caPerDay = balCheck.caConsumed;
    if (caPerDay > 30) {
      add({
        id: "implausible-ca",
        params: ["calcium"],
        scope: "dosing",
        severity: "act",
        title: "calcium use looks too high to be real",
        detail: `The figures imply ${caPerDay.toFixed(0)} ppm of calcium consumed a day, which no reef sustains — it would pair with ${(caPerDay / 6.75).toFixed(1)} dKH of alkalinity. Check the calcium dose and strength in Setup before trusting any calcium figure.`,
      });
    }
  }

  /* --- Thin data ---
     A parameter tested rarely produces advice with wide error bars, and that
     should travel with the advice rather than being invisible. */
  const sparse = [];
  for (const def of paramDefs) {
    const rows = windowRows(readings, def.key, 60);
    if (rows.length < 2) continue;
    const span = Math.max(1, daysBetween(rows[0].date, rows[rows.length - 1].date));
    const gap = span / (rows.length - 1);
    const expected = Math.max(3, (def.freqDays || 7));
    if (gap > expected * 2 && rows.length >= 3) {
      sparse.push({ def, gap: Math.round(gap) });
    }
  }

  if (sparse.length) {
    add({
      id: "sparse",
      params: sparse.map((x) => x.def.key),
      scope: "reading-accuracy",
      severity: "info",
      title: sparse.length === 1
        ? `${sparse[0].def.label.toLowerCase()} is tested rarely`
        : `${sparse.length} parameters are tested rarely`,
      detail: `${joinList(sparse.map((x) => `${x.def.label.toLowerCase()} about every ${x.gap} days`))} over the last two months. Trends and dose advice for ${sparse.length === 1 ? "it" : "these"} rest on fewer points than the rest, so treat them as directional rather than precise.`,
    });
  }

  /* --- Heading out of range ---
     The most useful thing the app can say is that something will be a problem
     before it is one. A parameter still in band but travelling steadily toward
     the edge was previously invisible until it crossed. */
  for (const def of paramDefs) {
    if (def.key === "ammonia") continue;
    if (NUTRIENTS_AWAITING_OWN_RULES.has(def.key)) continue;
    const last = latestByParam && latestByParam[def.key];
    if (!last) continue;
    const st = paramStatus(def, last.value);
    if (st !== "ok") continue;                      // already reported elsewhere

    /* Alkalinity, calcium and magnesium have their own dosing protocols. When
       one of those already wants a change it owns the message, and repeating
       it here would be the same advice twice in different words.

       When the protocol says hold, this finding still has something to add:
       the protocol reasons over a short window since the last dose change —
       three readings, in one real case — while this is a thirty-day
       regression. A tank falling 0.9 dKH across a month reads as "within
       normal test variation" over three readings, and suppressing this
       entirely made that silent. Both are kept, with the wording below
       adjusted so they cannot contradict each other. */
    const verdict = DOSED_ELEMENTS.has(def.key) ? doseVerdict(def.key) : null;
    if (verdict != null && verdict !== "hold") continue;

    const rows = windowRows(readings, def.key, 30);
    if (rows.length < 5) continue;
    const reg = regressionWithError(rows);
    if (!reg || !isFinite(reg.slope)) continue;

    /* The trend has to be real, not noise: the slope must exceed twice its own
       standard error before it is worth mentioning. */
    if (!(Math.abs(reg.slope) > (reg.se || 0) * 2)) continue;

    /* And it has to be large enough for the kit to see. Statistical
       significance is not the same as physical measurability: phosphate was
       being projected to leave its range in 34 days on a trend of 0.006 ppm a
       week, against a kit that resolves 0.02 ppm and readings that swing six
       times that between tests. The regression was confident about a movement
       nobody could have measured. */
    const noise = (STABILITY_RULES[def.key] || {}).noiseFloor || 0;
    if (noise && Math.abs(reg.slope) * 7 < noise / 2) continue;

    const edge = reg.slope > 0 ? def.max : def.min;
    const distance = Math.abs(edge - last.value);

    /* The projected movement has to be bigger than the parameter's own
       scatter. The kit-resolution guard above is not enough on its own: a tank
       oscillating ±0.41 dKH around 9.28 produced a 0.053 dKH/week slope, which
       clears the kit by a whisker, and the app announced it would leave the
       range in 26 days — forecasting a 0.2 dKH move inside noise five times
       that size. Checking the tank's own spread rather than the kit's is what
       distinguishes a trend from the up-leg of an oscillation.

       Direction consistency matters as much as size. Measured on this tank,
       readings changed direction on 42% of steps against 50% for a random
       walk, and a one-directional week predicted continued movement only 27%
       of the time — below the 32% base rate. A parameter that reverses this
       often is wandering, not travelling. */
    /* Comparing the projection against the residual spread was the wrong test:
       a perfectly straight line has near-zero residual, so a trivial slope
       passed while a genuine climb that had almost reached the edge was
       blocked. What actually separates the two is whether the readings travel
       in one direction. */
    if (!directional(rows)) continue;
    const days = distance / Math.abs(reg.slope);
    /* Arriving at the edge is the urgent end of this, not something to skip.
       A tank that fell 0.9 dKH over a month and is now sitting exactly on the
       band minimum computed "reaches the bottom in 0 days" and was dropped by
       a guard meant to suppress useless horizons. */
    if (days > 45) continue;                        // too far off to be useful
    const atEdge = days <= 2;

    add({
      id: "heading-out-" + def.key, params: [def.key], scope: "chemistry", severity: "watch",
      title: atEdge
        ? `${def.label.toLowerCase()} has drifted to the edge of your range`
        : `${def.label.toLowerCase()} is heading out of range`,
      detail: `${def.label} is ${fmtVal(def, last.value)}${def.unit} and moving ${reg.slope > 0 ? "up" : "down"} at about ${fmtAmount(Math.abs(reg.slope) * 7)}${def.unit} a week. `
        + (atEdge
          ? `That has taken it to the ${reg.slope > 0 ? "top" : "bottom"} of your range — still inside it, but with no margin left. `
          : `At that pace it reaches the ${reg.slope > 0 ? "top" : "bottom"} of your range in roughly ${Math.round(days)} days. `)
        + (verdict === "hold"
          /* The protocol has looked at the readings since your last dose change
             and found nothing to act on. Saying "correct this now" underneath
             that would be two answers to one question, so this says what it
             actually knows: the longer view disagrees with the shorter one. */
          ? `The dosing protocol looks only as far back as your last dose change and sees nothing to act on there, so no dose change is suggested yet — but the longer view is drifting. Worth another test or two to see which holds.`
          : `Correcting a drift this size now is a small adjustment; waiting until it is outside the band means a larger one, and large corrections are harder on livestock than the drift itself.`),
    });
  }

  /* --- pH read together with alkalinity ---
     Neither number alone identifies this, which is why it was never reported:
     high alkalinity with low pH is the signature of carbon dioxide building up
     indoors, and the fix is ventilation rather than anything dosed. */
  const phLast = latestByParam && latestByParam.ph;
  const alkLast = latestByParam && latestByParam.alkalinity;
  const phDef = paramDefs.find((d) => d.key === "ph");
  const alkDef = paramDefs.find((d) => d.key === "alkalinity");
  if (phLast && alkLast && phDef && alkDef
      && daysBetween(phLast.date, todayStr()) <= 30) {
    if (phLast.value < 7.9 && alkLast.value >= alkDef.min) {
      add({
        id: "co2-accumulation", params: ["ph", "alkalinity"], scope: "chemistry", severity: "watch",
        title: "pH is low while alkalinity is fine",
        detail: `pH ${fmtVal(phDef, phLast.value)} alongside alkalinity ${fmtVal(alkDef, alkLast.value)}${alkDef.unit}. Low pH with healthy alkalinity almost always means carbon dioxide in the room rather than anything wrong in the water — a closed house, a sealed cabinet, or poor gas exchange. Fresh air to the skimmer intake, or an open window, usually lifts it more than any additive will. Calcification slows at low pH, so alkalinity consumption often looks lower than it should while this persists.`,
      });
    } else if (phLast.value > 8.45) {
      add({
        id: "ph-high", params: ["ph"], scope: "chemistry", severity: "info",
        title: "pH is running high",
        detail: `pH ${fmtVal(phDef, phLast.value)}. Usually kalkwasser, a soda-ash-heavy two-part, or very strong aeration in a well-ventilated room. Not harmful in itself, but above about 8.5 the risk of precipitation rises, which shows up as alkalinity and calcium falling together for no apparent reason.`,
      });
    }
  }

  /* --- Alkalinity read against nutrients ---
     The strongest cross-parameter rule in the hobby, and one the app knew but
     never showed: this reasoning lived only in the prose assessment, which was
     replaced by the claim feed, so it stopped reaching anyone. Randy
     Holmes-Farley and the wider consensus both put it plainly — corals build
     skeleton from carbonate and tissue from nitrogen and phosphorus, so high
     alkalinity on lean nutrients lets skeleton outrun tissue and burns SPS
     tips. Neither number is wrong on its own, which is exactly why a
     per-parameter check cannot see it. */
  const alkR = latestByParam && latestByParam.alkalinity;
  const no3R = latestByParam && latestByParam.nitrate;
  const po4R = latestByParam && latestByParam.phosphate;
  const alkDef2 = paramDefs.find((d) => d.key === "alkalinity");
  if (alkR && no3R && po4R && alkDef2) {
    const lean = no3R.value < 3 || po4R.value < 0.03;
    const rich = no3R.value >= 5 && po4R.value >= 0.05;
    if (alkR.value >= 9 && lean) {
      add({
        id: "alk-vs-nutrients", params: ["alkalinity"], scope: "chemistry", severity: "watch",
        title: `alkalinity is high for nutrients this lean`,
        detail: `Alkalinity ${fmtVal(alkDef2, alkR.value)}dKH with nitrate ${fmtVal({ step: 0.1 }, no3R.value)}ppm and phosphate ${fmtVal({ step: 0.01 }, po4R.value)}ppm. That pairing is what burns SPS tips: there is carbonate to spare for skeleton but little nitrogen and phosphorus to build tissue with, so growth outruns the tissue covering it. Either feed a little more to bring nutrients up, or ease alkalinity down toward 8 — the two have to move together, and dropping alkalinity faster than 0.5dKH a day is its own risk.`,
      });
    } else if (alkR.value <= 7.5 && rich) {
      add({
        id: "alk-vs-nutrients", params: ["alkalinity"], scope: "chemistry", severity: "info",
        title: `alkalinity is low for nutrients this generous`,
        detail: `Alkalinity ${fmtVal(alkDef2, alkR.value)}dKH with nitrate ${fmtVal({ step: 0.1 }, no3R.value)}ppm and phosphate ${fmtVal({ step: 0.01 }, po4R.value)}ppm. Corals have plenty to build tissue with but less carbonate for skeleton, which usually shows as good colour and slow growth rather than anything harmful. Raising alkalinity gently would let growth catch up.`,
      });
    }
  }

  /* --- Salinity ---
     Every other parameter is measured per litre of water, so salinity drift
     shifts all of them at once. Worth saying only when it is genuinely off. */
  const salDef = paramDefs.find((d) => d.key === "salinity");
  const salLast = latestByParam && latestByParam.salinity;
  if (salDef && salLast && daysBetween(salLast.date, todayStr()) <= 21) {
    const off = salLast.value - 35;
    /* When salinity is already flagged as a long way out, this would be the
       second finding on the same screen saying the level is wrong. The acute
       one supersedes it — the skew it causes is named there instead, so the
       consequence is not lost. */
    const alreadyFlagged = out.some((f) => f.id === "far-out-salinity");
    if (Math.abs(off) >= 1.2 && !alreadyFlagged) {
      add({
        id: "salinity-off", params: ["salinity"], scope: "chemistry", severity: "watch",
        title: `salinity is ${off > 0 ? "high" : "low"} enough to skew other readings`,
        detail: `Salinity ${fmtVal(salDef, salLast.value)}${salDef.unit} against a normal 35${salDef.unit}. Everything dissolved in the water scales with this, so at ${fmtVal(salDef, salLast.value)} your other parameters read roughly ${Math.abs(off / 35 * 100).toFixed(0)}% ${off > 0 ? "higher" : "lower"} than they would at 35 — a difference that can look like a chemistry problem no amount of dosing will fix. Correct salinity first, then re-test.`,
      });
    }
  }

  /* --- Stability that has changed ---
     A tank that used to swing and now holds steady has achieved something, and
     one that is coming apart deserves warning before any single reading looks
     wrong. Comparing the recent window against the one before it says which,
     and neither was being reported. */
  for (const def of paramDefs) {
    const recent = windowRows(readings, def.key, 21);
    const older = readings
      .filter((r) => r.param === def.key
        && daysBetween(r.date, todayStr()) > 21
        && daysBetween(r.date, todayStr()) <= 63)
      .sort(byOldest);
    if (recent.length < 5 || older.length < 5) continue;

    const spread = (rows) => {
      const v = rows.map((r) => r.value).sort((a, b) => a - b);
      const q = (p) => v[Math.min(v.length - 1, Math.max(0, Math.round(p * (v.length - 1))))];
      return q(0.9) - q(0.1);
    };
    const now = spread(recent), before = spread(older);
    if (!(before > 0)) continue;
    const noise = kitSigma(def) * 2;
    if (now < noise && before < noise) continue;      // both inside kit resolution

    if (now <= before * 0.55 && before - now > noise) {
      add({
        id: "settled-" + def.key, params: [def.key], scope: "chemistry", severity: "info",
        title: `${def.label.toLowerCase()} has settled down`,
        detail: `Over the last three weeks ${def.label.toLowerCase()} has moved within ${fmtVal(def, now)}${def.unit}, against ${fmtVal(def, before)}${def.unit} in the six weeks before that. Whatever changed — dosing, flow, export, or simply time — it is holding better than it was. Worth not changing anything else for a while.`,
      });
    } else if (now >= before * 1.9 && now - before > noise) {
      add({
        id: "destabilised-" + def.key, params: [def.key], scope: "chemistry", severity: "watch",
        title: `${def.label.toLowerCase()} has become less steady`,
        detail: `${def.label} now moves within ${fmtVal(def, now)}${def.unit} over three weeks, against ${fmtVal(def, before)}${def.unit} before that — it is swinging roughly ${(now / before).toFixed(1)}× more than it was. The level may still look fine, but something changed: a dose adjustment, a new addition, a skimmer or reactor behaving differently, or growth outpacing what you are replacing.`,
      });
    }
  }

  /* --- Nutrient ratio ---
     Nitrate and phosphate are consumed together by the same organisms in a
     roughly fixed proportion, so the ratio between them says something neither
     number says alone. This was computed for Insights and never surfaced as a
     finding, which is why a tank at 45ppm nitrate against 0.02ppm phosphate
     produced no comment on the mismatch. */
  const nr = computeNutrientRatio(readings);
  if (nr && nr.ratio != null && isFinite(nr.ratio)) {
    const no3 = latestByParam && latestByParam.nitrate;
    const po4 = latestByParam && latestByParam.phosphate;
    const bothLow = no3 && po4 && no3.value < 2 && po4.value < 0.02;

    if (bothLow) {
      add({
        id: "nutrient-starved", params: ["nitrate", "phosphate"], scope: "nutrients", severity: "watch",
        title: "both nutrients are close to zero",
        detail: `Nitrate ${fmtAmount(no3.value)}ppm and phosphate ${fmtAmount(po4.value)}ppm. Corals need some of both — stripping them together tends to show as pale tissue, slow growth and sometimes a cyanobacteria or dinoflagellate bloom moving in where nothing else can compete. Feeding more is usually the fix rather than dosing either one.`,
      });
    } else if (nr.ratio > 250) {
      add({
        id: "ratio-po4-limited", params: ["phosphate", "nitrate"], scope: "nutrients", severity: "watch",
        title: "phosphate is limiting relative to nitrate",
        detail: `Your ratio is about ${Math.round(nr.ratio)}:1 against the roughly 100:1 that balanced tanks sit near. Nitrate cannot be consumed without phosphate alongside it, so the usual sign of this is nitrate that will not come down however much you export. Raising phosphate a little often lets the nitrate fall on its own.`,
      });
    } else if (nr.ratio < 40) {
      add({
        id: "ratio-no3-limited", params: ["nitrate", "phosphate"], scope: "nutrients", severity: "watch",
        title: "nitrate is limiting relative to phosphate",
        detail: `Your ratio is about ${Math.round(nr.ratio)}:1 against the roughly 100:1 that balanced tanks sit near. With nitrate this low relative to phosphate, phosphate tends to accumulate because there is not enough nitrogen to consume it — and surplus phosphate is what algae use. Feeding more, or dosing nitrate, usually works better than adding more phosphate removal.`,
      });
    }
  }

  /* --- Nutrient equilibrium --- */
  for (const key of ["nitrate", "phosphate"]) {
    const n = computeNutrientProduction(key, readings, waterChanges, settings);
    if (!n || n.status !== "ok" || n.equilibrium == null) continue;
    const cur = latestByParam && latestByParam[key] ? latestByParam[key].value : null;
    if (cur == null) continue;
    add({
      id: "equilibrium-" + key,
      params: [key],
      scope: "nutrients",
      severity: "info",
      title: `${n.def.label.toLowerCase()} settles near ${fmtVal(n.def, n.equilibrium)}${n.def.unit}`,
      detail: `On your current water change routine alone, ${n.def.label.toLowerCase()} would settle at about ${fmtVal(n.def, n.equilibrium)}${n.def.unit}. You're at ${fmtVal(n.def, cur)}${n.def.unit}${cur < n.equilibrium * 0.85 ? `, which is below that — your other export is doing real work` : cur > n.equilibrium * 1.15 ? `, above where water changes alone would hold it` : `, essentially at that equilibrium`}.`,
      equilibrium: n.equilibrium, offsetPct: n.offsetPct,
    });
  }

  /* --- ICP findings, which nothing outside the ICP section used to see --- */
  if (icps && icps.length) {
    const latest = [...icps].sort(byNewest)[0];
    const els = Object.entries(latest.elements || {})
      .map(([n, v]) => ({ n, v, ref: icpRef(n) }))
      .map((e) => ({ ...e, st: icpStatus(e.ref, e.v) }));
    const detected = els.filter((e) => e.st === "detected");
    const off = els.filter((e) => e.ref && (e.st === "high" || e.st === "low"));
    if (detected.length) {
      add({
        id: "icp-contaminant",
        params: [],
        scope: "trace",
        severity: "act",
        title: `${detected.length} contaminant${detected.length === 1 ? "" : "s"} detected`,
        detail: `Your ${fmtDate(latest.date)} panel detected ${joinList(detected.map((e) => e.n))}, which Triton targets at zero. Worth identifying what went into the tank recently and running fresh carbon.`,
      });
    }
    if (off.length) {
      add({
        id: "icp-offrange",
        params: off.map((e) => e.n).filter((n) => PARAM_DEFS.some((d) => d.key === n)),
        scope: "trace",
        severity: "watch",
        title: `${off.length} element${off.length === 1 ? "" : "s"} outside reference`,
        detail: `Your ${fmtDate(latest.date)} panel had ${joinList(off.map((e) => `${e.n} ${e.st}`))} against Triton's reference ranges.`,
      });
    }
  }

  return { findings: out, kitOffsets };
}
