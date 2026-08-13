/* The proposed protocol, isolated so it can be tested before it is built. */
const EFF = 0.0692;                 // dKH per mL, 77 L
const SETTLE_DAYS = 3;              // alkalinity
const STEP_CAP = 0.25;              // no single change moves the dose more than 25%
const BRACKET_MEMORY = 21;          // days before an observation is too old to trust
const SAFE_RATE = 0.5;              // dKH/day — break out of settling early above this
/* Kit precision, chosen in Setup. The settling window is derived from this:
   a better kit earns a verdict sooner because a given dose error clears its
   noise in fewer days. Figures are the manufacturers' own repeatability for
   alkalinity, rounded conservatively. */
const KIT_PRECISION = {
  hanna:    0.10,   /* Hanna HI772/HI755 checker */
  salifert: 0.15,   /* Salifert titration, read by eye */
  redsea:   0.20,   /* Red Sea Foundation Pro titration */
  other:    0.20,
};
let NOISE = KIT_PRECISION.hanna;   // alkalinity default
function setKit(k) { NOISE = KIT_PRECISION[k] || KIT_PRECISION.other; }

/* Everything below was written in dKH and quietly assumed alkalinity. On
   magnesium it reported movement as "159x the kit's own error" and declared a
   perfectly normal 1450 ppm outside the workable range, because it was
   comparing ppm against an alkalinity threshold. Each element needs its own
   numbers.

   noise    typical kit resolution for that element
   safe     what the hobby treats as workable, distinct from your target band
   maxRate  how fast the element may be moved in a day */
const ELEMENT = {
  alkalinity: { noise: 0.10, safe: [7, 11],       maxRate: 0.5 },
  calcium:    { noise: 10,   safe: [350, 550],    maxRate: 25 },
  magnesium:  { noise: 25,   safe: [1150, 1700],  maxRate: 60 },
};
function elementOf(def) {
  return (def && ELEMENT[def.key]) || ELEMENT.alkalinity;
}
const BAND = { min: 8.5, max: 9.5 };

function fitRate(rows) {
  const n = rows.length;
  if (n < 2) return null;
  const mx = rows.reduce((a, r) => a + r.day, 0) / n;
  const my = rows.reduce((a, r) => a + r.value, 0) / n;
  let sxy = 0, sxx = 0;
  for (const r of rows) { sxy += (r.day - mx) * (r.value - my); sxx += (r.day - mx) ** 2; }
  return sxx ? sxy / sxx : 0;
}

/* Returns what the app would advise. */
function advise({ readings, dose, daysSinceChange, history, today, level, eff, consumptionEstimate, mode, allReadings, def }) {
  /* A solution strength of zero, a negative one, or one so small it implies a
     bathtub of product per day, means every millilitre figure downstream is
     meaningless. Left unguarded this produced a confident "change to 12.5
     mL/day" for a strength of zero, where no dose can do anything at all. */
  if (!(eff > 0) || !isFinite(eff) || eff > 100) {
    return { action: 'blocked', reason: 'setup', rate: 0, settleDays: null, observedNoise: null };
  }
  const EL = elementOf(def);
  const BASE_NOISE = def && def.key !== 'alkalinity' ? EL.noise : NOISE;
  const SAFE_LO = EL.safe[0], SAFE_HI = EL.safe[1];
  const MAX_RATE = EL.maxRate;
  /* The tank's own dKH-per-mL, not a constant for one tank size. */
  const E = eff || EFF;

  /* The kit setting says what the kit can do; it says nothing about how
     carefully it is being used, or whether the reagent is old. Testing with a
     kit 3.5x noisier than declared produced 45 dose changes instead of 9 —
     the engine chasing its own measurement error. So the declared figure is
     treated as a floor and the observed scatter is allowed to raise it. */
  const observedNoise = (() => {
    const rows = (allReadings && allReadings.length >= 6) ? allReadings.slice(-20) : null;
    if (!rows) return BASE_NOISE;
    const n = rows.length;
    const mx = rows.reduce((a,r)=>a+r.day,0)/n, my = rows.reduce((a,r)=>a+r.value,0)/n;
    let sxy=0, sxx=0;
    for (const r of rows) { sxy += (r.day-mx)*(r.value-my); sxx += (r.day-mx)**2; }
    const slope = sxx ? sxy/sxx : 0;
    let ss = 0;
    for (const r of rows) { const fit = my + slope*(r.day-mx); ss += (r.value-fit)**2; }
    const resid = Math.sqrt(ss / Math.max(1, n-2));
    /* Never below the kit's own limit, never more than four times it — beyond
       that the scatter is the tank moving, not the kit. */
    return Math.max(BASE_NOISE, Math.min(BASE_NOISE*4, resid));
  })();
  const KN = observedNoise;
  const win = readings.filter(r => r.day >= today - Math.max(daysSinceChange, 1));
  const rate = fitRate(win);
  /* Every wait must say how long is left, or the screen reads "test in NaN
     days". A single reading cannot give a rate, but the window is still known. */
  if (rate == null) {
    const cons0 = Math.abs(consumptionEstimate || 0);
    const est = cons0 > 0
      ? Math.max(2, Math.min(5, Math.round((2 * KN * Math.SQRT2) / (0.15 * cons0))))
      : SETTLE_DAYS;
    return { action: 'wait', reason: 'not enough readings', rate: 0, settleDays: est, observedNoise: KN };
  }

  /* How many days of readings are needed before a rate means anything, on
     this tank. The answer is set by signal against noise, not by the calendar:
     a tank consuming 3 dKH/day produces a signal ten times larger than one
     consuming 0.3, so it earns a verdict ten times sooner. Waiting three days
     on a fast tank throws away information; acting after one on a slow tank is
     reading the kit, not the tank.

     Required: the movement over the window must clear kit noise by 2x. */
  const settleDays = (() => {
    /* Not consumption itself — a correctly dosed tank shows no movement
       however much it consumes. What has to be detectable is the smallest
       dose error worth correcting, which is about 15% of the dose. On a tank
       consuming 3 dKH/day that error moves alkalinity 0.48 a day and clears
       the kit in one; on a nano at 0.25 it moves 0.04 and takes five. */
    const cons = Math.abs(consumptionEstimate || 0);
    if (!(cons > 0)) return SETTLE_DAYS;
    /* Steady mode chases a smaller error, so it earns a verdict sooner and
       intervenes more often — which is the whole point of it. */
    const smallestWorthSeeing = (mode === 'steady' ? 0.30 : 0.15) * cons;
    const needed = (2 * KN * Math.SQRT2) / smallestWorthSeeing;
    /* Steady mode is allowed to act daily. That is the trade it exists for:
       a one-day window carries far more noise, but the steps it takes are so
       small (5-10%) that a wrong one costs almost nothing and the next reading
       corrects it. Settled mode waits for a clean signal instead. */
    /* Steady mode uses a fixed short window and closes the whole gap each
       time. Small frequent steps turned out to be the worst of both — the
       lag between step and effect IS the drift, so a partial correction
       leaves variation behind. Steadiness comes from fully correcting often,
       accuracy from waiting for a clean signal. They are opposites. */
    if (mode === 'steady') return 2;
    return Math.max(2, Math.min(5, Math.round(needed)));
  })();

  const movingFast = Math.abs(rate) > MAX_RATE;
  /* The settling wait assumes the dose is roughly right and only needs
     confirming. It is not, when the tank is already outside its workable range
     and still heading away from it — a badly short dose kept falling 0.5 dKH a
     day for the whole three days, taking alkalinity from 7.1 to 5.6 while the
     app waited. Nobody watches that and waits. */
  const SAFE_BAND = { min: SAFE_LO, max: SAFE_HI };
  const unsafe = level != null && (level < SAFE_BAND.min || level > SAFE_BAND.max);
  const worsening = unsafe && ((level < SAFE_BAND.min && rate < 0.02) || (level > SAFE_BAND.max && rate > -0.02));
  if (daysSinceChange < settleDays && !movingFast && !worsening) {
    return { action: 'wait', reason: `settling, day ${daysSinceChange} of ${settleDays}`, rate, settleDays, observedNoise: KN };
  }
  const early = daysSinceChange < settleDays && (movingFast || worsening);

  /* Rate inside what the kit can resolve over this span — nothing to act on. */
  /* Settled mode refuses to act on movement inside kit noise. Steady mode
     accepts noisier evidence because its steps are small enough to be wrong
     cheaply — the noise averages out across many tiny corrections. */
  /* The gate that stops the engine acting on movement it cannot distinguish
     from kit error. Settled mode respects it strictly. Steady mode all but
     ignores it — statistically that is chasing noise, but with a full
     correction every two days the errors cancel and the level ends up
     visibly steadier. Being right about each step and being steady overall
     turn out to be different goals. */
  const noiseGate = mode === 'steady' ? 0.02 : KN * Math.SQRT2 / Math.max(1, daysSinceChange);
  const rateNoise = noiseGate;
  if (Math.abs(rate) < rateNoise) {
    return { action: 'hold', reason: 'movement is inside kit noise', rate, dose, observedNoise: KN, settleDays };
  }

  /* An observation is only useful while it still describes this tank. When
     consumption jumps — corals fill in, a colony is added — the old readings
     describe a tank that no longer exists, and a bracket built from them
     blocks the very increase the tank needs. In testing this held a tank at
     8 mL for seventeen days while alkalinity fell from 9.0 to 4.9.

     Each past observation implies a consumption; discard any that disagrees
     with what the tank is doing now by more than a quarter. */
  const consNow = dose * E - rate;
  const live = history.filter(h => {
    if (today - h.day > BRACKET_MEMORY) return false;
    const consThen = h.dose * E - h.rate;
    if (!(consThen > 0) || !(consNow > 0)) return false;
    return Math.max(consThen, consNow) / Math.min(consThen, consNow) <= 1.25;
  });
  const below = live.filter(h => h.rate < 0).sort((a, b) => b.dose - a.dose)[0];
  const above = live.filter(h => h.rate > 0).sort((a, b) => a.dose - b.dose)[0];

  let want = dose + (-rate) / E;
  let basis = 'computed from consumption';

  /* History constrains the answer, but never contradicts what the tank is
     doing now. An old observation that alkalinity rose at 14 mL says nothing
     useful once the tank is falling at 25 mL — demand has grown, and the old
     bracket is describing a different tank. Current direction always wins. */
  const usableBelow = rate < 0 ? below : (below && below.dose < dose ? below : null);
  const usableAbove = rate > 0 ? above : (above && above.dose > dose ? above : null);

  if (usableBelow && usableAbove && usableAbove.dose > usableBelow.dose) {
    want = usableBelow.dose + (usableAbove.dose - usableBelow.dose)
      * (0 - usableBelow.rate) / (usableAbove.rate - usableBelow.rate);
    want = Math.min(Math.max(want, usableBelow.dose + 0.05), usableAbove.dose - 0.05);
    basis = `bracketed between ${usableBelow.dose} and ${usableAbove.dose}`;
  } else if (usableBelow) { want = Math.max(want, usableBelow.dose + 0.05); basis = `above ${usableBelow.dose}, where it still fell`; }
  else if (usableAbove) { want = Math.min(want, usableAbove.dose - 0.05); basis = `below ${usableAbove.dose}, where it still rose`; }

  /* Direction is not negotiable: falling never cuts the dose, rising never
     raises it, whatever the arithmetic or the history says. */
  if (rate < 0) want = Math.max(want, dose);
  if (rate > 0) want = Math.min(want, dose);

  /* The 25% cap exists to stop noise driving a big change. When the tank is
     already outside its band and still heading the wrong way, the movement is
     not noise — it is the thing you are trying to stop, and holding the step
     to 25% leaves the tank out of range for weeks on a high-demand system.
     The safe-rate ceiling below still applies, so the step can grow but the
     tank still never moves faster than 0.5 dKH/day. */
  /* The cap only relaxes when the tank is outside what the hobby treats as
     workable (7-11 dKH), not merely outside the narrow band you chose. At 8.1
     on a target of 8.5-9.5 the tank is slightly low, not in trouble, and
     relaxing the cap there produced a 72% jump off one reading. */
  const offTarget = level != null && (level < BAND.min || level > BAND.max);
  const unsafeLevel = level != null && (level < SAFE_LO || level > SAFE_HI);
  const headingWrong = unsafeLevel && ((level < SAFE_LO && rate < 0) || (level > SAFE_HI && rate > 0));

  /* Step size follows how wrong things are. Testing showed the proposal's one
     weakness was moment-to-moment steadiness — three times the variation of
     constant small adjustments — and that came entirely from taking large
     steps even when nothing much was wrong. Large steps are for emergencies;
     inside the band, where the hobby cares most about steadiness, the step is
     small enough that a change is barely felt. */
  /* Two defensible ways to run a tank, and the testing could not separate
     them, so the keeper chooses.

       steady   — small frequent corrections. Holds the number tightest
                  (variation 0.06 vs 0.17) which is what the hobby names as
                  most important, at the cost of a dose change every few days
                  and a less accurate underlying dose.
       settled  — fewer, larger steps aimed at finding the dose the tank
                  actually needs. Three times more accurate on the dose with a
                  fifth of the changes, but the level moves more between them.

     Both stay inside every published limit; they optimise for different
     things. */
  const steadyMode = mode === 'steady';
  const calm = !offTarget && Math.abs(rate) < MAX_RATE * 0.4;
  /* Steady mode closes the gap in full, held only by the safety ceiling.
     Settled mode caps the step so a noisy window cannot cause a swing. */
  const capPct = headingWrong ? 1.0
    : unsafeLevel ? 0.5
    : steadyMode ? 1.0
    : offTarget ? STEP_CAP
    : calm ? 0.08
    : STEP_CAP;
  const cap = dose * capPct;
  const capped = Math.max(dose - cap, Math.min(dose + cap, want));
  const wasCapped = Math.abs(capped - want) > 0.05;

  /* Never let a single change move the tank faster than the safe daily rate. */
  const impliedRise = Math.abs(capped - dose) * E;
  const final = impliedRise > MAX_RATE
    ? dose + Math.sign(capped - dose) * (MAX_RATE / E)
    : capped;

  return {
    settleDays, observedNoise: KN,
    action: Math.abs(final - dose) < 0.1 ? 'hold' : (final > dose ? 'increase' : 'decrease'),
    dose: Math.round(final * 10) / 10, from: dose, rate, basis, wasCapped, early,
    bracket: below && above ? [below.dose, above.dose] : null,
  };
}
module.exports = { advise, setKit, KIT_PRECISION, EFF, SETTLE_DAYS, STEP_CAP, SAFE_RATE, BAND, NOISE };
