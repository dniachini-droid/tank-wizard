/* The decision surface: what the engine offers, and what every screen says.
   Prototype only — nothing is written into the app. */
const { advise, BAND, NOISE, SAFE_RATE } = require('/tmp/proto.js');


/* "pH" keeps its spelling at the start of a sentence. */
function sentenceStart(t) {
  const x = String(t || '');
  return /^[a-z][A-Z]/.test(x) ? x : x.charAt(0).toUpperCase() + x.slice(1);
}




const fmt = (n, d = 1) => Number(n).toFixed(d).replace(/\.0$/, '');

/* One state object per element, from which all three screens are written, so
   they cannot drift apart the way two dismissal systems once did. */
function _decideRaw(ctx) {
  const { def, eff, dose, level, daysSinceChange, plan } = ctx;
  const r = advise({ ...ctx, def });
  const el = def.label.toLowerCase();
  const unit = def.unit;
  const outOfBand = level < def.min || level > def.max;
  const SAFE = { alkalinity:[7,11], calcium:[350,550], magnesium:[1150,1700] }[def.key] || [7,11];
  const unsafe = level < SAFE[0] || level > SAFE[1];

  /* ---- the numbers cannot be trusted at all ------------------------------ */
  if (r.action === 'blocked') {
    return {
      state: 'blocked', tone: 'act', options: null,
      summary: `${def.label} figures can't be trusted yet`,
      why: `The solution strength in Setup is ${!(eff > 0) ? 'zero or negative' : 'far outside what a real product delivers'}, so every millilitre figure for ${el} is wrong until it is corrected. No dose can be recommended from it.`,
      dashboard: `${def.label} — check Setup`,
      wizard: `Enter the strength of your ${el} solution in Setup. Until then nothing here means anything.`,
      goto: { tab: 'setup', key: def.key },
    };
  }

  /* ---- the level itself is an emergency ---------------------------------
     Checked before anything about dosing, because a tank at 0.6 dKH does not
     need a dose recommendation, it needs rescuing. In testing an 800 L tank
     fell from 9.0 to 0.0 dKH after a demand jump and the app raised not one
     urgent alert the whole way down — the dose logic was working correctly and
     saying "dose could change" in a calm tone while everything died. The level
     outranks the dose. */
  if (unsafe) {
    /* A correction already running changes what this should say. Without it
       the app reported "dangerously low" every day of a correction that was
       working — each engine telling the truth, and together reading as though
       nothing were being done about it. */
    const fixing = ctx.correctionRemaining ? Math.abs(ctx.correctionRemaining) : 0;
    if (fixing > 0) {
      const fixDays = Math.max(1, Math.ceil(fixing / SAFE_RATE));
      const low0 = level < SAFE[0];
      const turning = (low0 && r.rate > 0) || (!low0 && r.rate < 0);
      return {
        state: 'emergency-correcting', tone: 'act',
        summary: `${def.label} is ${fmt(level, 2)}${unit} — correction under way`,
        why: `Still outside ${SAFE[0]}\u2013${SAFE[1]}${unit}, but a correction is running: ${fmt(fixing, 2)}${unit} to go, about ${fixDays} more day${fixDays === 1 ? '' : 's'} at the safe rate. ${turning ? `${el.charAt(0).toUpperCase() + el.slice(1)} is already moving the right way.` : `It has not turned yet — if it has not by the next test, something else is pulling it.`}`,
        dashboard: `${def.label} ${fmt(level, 2)}${unit} — correcting, ${fixDays}d left`,
        wizard: `Correction in progress. Keep the daily dose running underneath and retest before adding more.`,
        options: [
          { id: 'continue', label: 'Continue the correction', dose, recommended: true,
            note: `${fmt(fixing, 2)}${unit} remaining, about ${fixDays} day${fixDays === 1 ? '' : 's'}.` },
          { id: 'stop', label: 'Stop and reassess', dose,
            note: `Leaves ${el} at ${fmt(level, 2)}${unit}, still outside the workable range.` },
        ],
      };
    }
    const mid = (def.min + def.max) / 2;
    const gap = mid - level;
    const days = Math.max(1, Math.ceil(Math.abs(gap) / SAFE_RATE));
    const low = level < SAFE[0];
    return {
      state: 'emergency', tone: 'act',
      summary: `${def.label} is ${fmt(level, 2)}${unit} — ${low ? 'dangerously low' : 'dangerously high'}`,
      why: `Outside ${SAFE[0]}–${SAFE[1]}${unit}, ${low ? `calcification stops and coral tissue is at risk` : `precipitation strips calcium out of the water and burns tissue`}. This is the level, not the dose — no daily dose fixes it quickly enough.`,
      notes: [`Correcting faster than ${SAFE_RATE}${unit} a day is its own risk, so this takes ${days} day${days === 1 ? '' : 's'}.`],
      dashboard: `${def.label} ${fmt(level, 2)}${unit} — act now`,
      wizard: `Correct ${el} toward ${fmt(mid, 2)}${unit} at no more than ${SAFE_RATE}${unit} a day. Keep the daily dose running underneath.`,
      options: [
        { id: 'correct', label: `Correct over ${days} day${days === 1 ? '' : 's'}`, dose, correction: gap,
          note: `${fmt(Math.abs(gap) / days, 2)}${unit} a day — as fast as is safe.`, recommended: true },
        { id: 'faster', label: `Correct in half the time`, dose, correction: gap,
          note: `${fmt(Math.abs(gap) / Math.max(1, Math.ceil(days/2)), 2)}${unit} a day.`,
          risk: `Above the ${SAFE_RATE}${unit}/day corals tolerate — only worth it if ${el} is still moving the wrong way.` },
      ],
    };
  }

  /* ---- still settling, nothing unusual ---------------------------------- */
  if (r.action === 'wait') {
    const due = Math.max(0, r.settleDays - daysSinceChange);
    /* Overdue is measured against when you actually test, not against the
       settling window alone. Someone testing weekly was told the test was
       overdue on 46% of days — the window had elapsed, but they were never
       going to test sooner and the nagging was pure noise. What matters is
       whether you have skipped your own rhythm. */
    const rhythm = ctx.testEveryDays || null;
    const graceDays = rhythm ? Math.max(r.settleDays, rhythm) : r.settleDays;
    const overdue = daysSinceChange - graceDays;
    const snoozed = ctx.snoozeCount || 0;
    /* Snoozing moves the date, not the state. Without saying so, seven days of
       snoozing showed the identical message seven times and looked like
       progress — the tank had been drifting the whole while with nothing
       logged to judge it by. */
    if (overdue > 0) {
      return {
        state: 'overdue', tone: snoozed >= 3 || overdue >= 4 ? 'warn' : 'busy', options: null,
        summary: `${def.label} test is ${overdue} day${overdue === 1 ? '' : 's'} overdue`,
        why: `Changed ${daysSinceChange} days ago, nothing logged since${snoozed ? ` after ${snoozed} snooze${snoozed === 1 ? '' : 's'}` : ''}. ${sentenceStart(el)} has been moving the whole time, unmeasured — one reading unblocks it.`,
        dashboard: `${def.label}: test overdue by ${overdue}d`,
        wizard: `Still on ${fmt(dose)} mL/day. ${overdue} days past due — one reading unblocks this.`,
        canSnooze: true,
      };
    }
    /* You tested before it was due. That deserves an answer rather than the
       same "leave it alone" as if nothing had happened — otherwise logging a
       reading looks like it did nothing, and people stop bothering. */
    const testedEarly = (ctx.testedToday === true) && daysSinceChange < r.settleDays;
    if (testedEarly) {
      const moved = Math.abs(r.rate || 0) * daysSinceChange;
      const inRange = level >= def.min && level <= def.max;
      /* If this reading follows something that needed fixing, say that it is
         fixed. Without it a problem simply stopped being mentioned — you were
         told to raise the dose, you did, and the next screen said "looks fine
         so far" as though nothing had happened. A quarter of all resolutions
         disappeared this way. */
      const was = ctx.previousState;
      /* Only states where the user actually did something get a "that worked"
         line. An overdue test resolving means they finally tested, which is
         not a fix — "the overdue test is working" was nonsense. */
      const DID = { 'suggested-up':'the increase', 'suggested-down':'the reduction',
        'off-target':'the correction', 'early-warning':'the change',
        'emergency':'the correction' };
      const resolved = Object.prototype.hasOwnProperty.call(DID, was);
      const label = DID[was] || 'the change';
      return {
        state: 'early-test', tone: inRange ? 'ok' : 'busy', options: null,
        canSnooze: true, dueInDays: due, resolvedFrom: resolved ? was : null,
        /* The change can be working while the level is still short of the
           band — that is progress and should be said, not withheld until the
           number is perfect. Staying silent here was the last 4% of
           resolutions that simply stopped being mentioned. */
        summary: resolved && inRange
          ? `${label.charAt(0).toUpperCase() + label.slice(1)} is working — ${el} at ${fmt(level, 2)}${unit}`
          : resolved
            ? `${label.charAt(0).toUpperCase() + label.slice(1)} is in, ${el} still ${level < def.min ? 'below' : 'above'} range at ${fmt(level, 2)}${unit}`
          : was === 'overdue' && inRange
            ? `Caught up — ${el} is ${fmt(level, 2)}${unit} and back in range`
            : was === 'overdue'
              ? `Caught up — ${el} is ${fmt(level, 2)}${unit}`
              : inRange
            ? `${def.label} looks fine so far — ${fmt(level, 2)}${unit}`
            : `${def.label} is at ${fmt(level, 2)}${unit}, still settling`,
          why: `Moved ${fmt(moved, 2)}${unit} since the change — ${moved < (r.observedNoise || NOISE) * 1.5 ? 'inside what the kit can resolve' : 'measurable, but not enough to judge a dose by'}. The reading counts; the verdict needs ${due} more day${due === 1 ? '' : 's'}.`,
        dashboard: `${def.label} ${fmt(level, 2)}${unit} — verdict in ${due} day${due === 1 ? '' : 's'}`,
        wizard: `Logged. Still on ${fmt(dose)} mL/day; ${due} more day${due === 1 ? '' : 's'} of readings and this can be judged.`,
      };
    }

    return {
      state: 'settling', tone: 'busy', options: null, canSnooze: true, dueInDays: due,
      summary: `${def.label} dose changed — leave it alone`,
      why: `Day ${daysSinceChange} of ${r.settleDays}. A dose error worth acting on moves ${el} about ${fmt(0.15 * (dose * eff), 2)}${unit} a day; your kit resolves ${fmt(r.observedNoise || NOISE, 2)}${unit}.`,
      dashboard: `${def.label}: settling, test ${due === 0 ? 'today' : `in ${due} day${due === 1 ? '' : 's'}`}`,
      wizard: `Holding ${fmt(dose)} mL/day. Nothing to judge yet — the movement so far is inside what the kit can resolve.`,
    };
  }

  /* ---- broke out early: something is moving fast ------------------------ */
  if (r.early) {
    const perDay = Math.abs(r.rate);
    const dir = r.rate < 0 ? 'fallen' : 'risen';
    const modest = r.dose;
    /* Floored at zero: a fast rise implies a negative dose, which is not a
       thing you can do. Stopping altogether is the real limit, and saying so
       is more useful than offering "-0.4 mL/day". */
    const rawFull = dose + (-r.rate) / eff;
    const uncapped = Math.max(0, Math.round(rawFull * 10) / 10);
    const wouldBeNegative = rawFull < 0;
    const aggressiveRise = Math.abs(uncapped - dose) * eff;
    const options = [
      { id: 'wait', label: `Wait the full ${r.settleDays} days`, dose,
        note: `One reading can be the kit. If this is noise it will not repeat.`,
        risk: unsafe ? `${def.label} is already outside 7–11${unit} — waiting risks it going further.` : null },
      { id: 'modest', label: `Change to ${fmt(modest)} mL/day`, dose: modest,
        note: `Moves ${el} about ${fmt(Math.abs(modest - dose) * eff, 2)}${unit} a day — inside the safe ceiling.`,
        recommended: true },
      { id: 'full', label: uncapped === 0 ? `Stop dosing ${el} entirely` : `Change to ${fmt(uncapped)} mL/day`, dose: uncapped,
        note: wouldBeNegative
          ? `${def.label} is rising faster than stopping the dose alone would fix — the rest has to come from consumption or a water change.`
          : `What ${daysSinceChange === 1 ? 'one day' : daysSinceChange + ' days'} of readings implies. Would move ${el} ${fmt(aggressiveRise, 2)}${unit} a day.`,
        risk: aggressiveRise > SAFE_RATE ? `Faster than what corals tolerate in a day, and built on one reading carrying ±${fmt((r.observedNoise || NOISE) * Math.SQRT2 / Math.max(1, daysSinceChange), 2)}${unit} of error.` : null },
    ];
    return {
      state: 'early-warning', tone: unsafe ? 'act' : 'warn', options,
      summary: `${def.label} has ${dir} ${fmt(perDay, 2)}${unit} in ${daysSinceChange} day${daysSinceChange === 1 ? '' : 's'}`,
      why: `${fmt(perDay / ((r.observedNoise || NOISE) * Math.SQRT2 / Math.max(1, daysSinceChange)), 1)}× the kit's own error, so this is real movement. ${unsafe ? `Outside the workable range — waiting is the risky option.` : `Still inside the workable range, so there is room to be measured.`}`,
      dashboard: `${def.label} moved ${fmt(perDay, 2)}${unit}/day — 3 options`,
      wizard: `Three ways to go. The middle one is recommended: it closes most of the gap without moving ${el} faster than corals tolerate.`,
    };
  }

  /* ---- window complete, nothing to do ----------------------------------- */
  if (r.action === 'hold') {
    if (outOfBand) {
      const fixingOT = ctx.correctionRemaining ? Math.abs(ctx.correctionRemaining) : 0;
      if (fixingOT > 0) {
        const fixDaysOT = Math.max(1, Math.ceil(fixingOT / SAFE_RATE));
        return {
          state: 'off-target-correcting', tone: 'busy', options: null,
          summary: `${def.label} is coming back — ${fmt(level, 2)}${unit}`,
          why: `Outside your band, but a correction is running with ${fmt(fixingOT, 2)}${unit} still to go over about ${fixDaysOT} more day${fixDaysOT === 1 ? '' : 's'}. The daily dose is unchanged underneath it, which is right: the dose matches consumption, the correction moves the level.`,
          dashboard: `${def.label} ${fmt(level, 2)}${unit} — correcting`,
          wizard: `Correction in progress: ${fmt(fixingOT, 2)}${unit} to go. Retest before adding more.`,
        };
      }
      /* This said "use a one-off correction" and then offered nothing to press.
         Across an integrated run it was the second most common state — 40,493
         times — and every one of them was a dead end that left alkalinity
         sitting outside the band for a median of 96 days. */
      const mid = (def.min + def.max) / 2;
      const gap = mid - level;
      const days = Math.max(1, Math.ceil(Math.abs(gap) / SAFE_RATE));
      return {
        state: 'off-target', tone: 'warn',
        options: [
          { id: 'correct', label: `Correct to ${fmt(mid, 2)}${unit} over ${days} day${days === 1 ? '' : 's'}`,
            dose, correction: gap, recommended: true,
            note: `${fmt(Math.abs(gap) / days, 2)}${unit} a day — within the ${SAFE_RATE}${unit}/day corals tolerate.` },
          { id: 'hold', label: 'Leave the level where it is', dose,
            note: `${def.label} is steady at ${fmt(level, 2)}${unit}; a stable number off-target beats a moving one.` },
        ],
        summary: `${def.label} is steady but ${level > def.max ? 'above' : 'below'} your range`,
        why: `The dose matches consumption — ${el} is not drifting. What is wrong is where it sits, and no daily dose fixes that. A one-off correction moves the level.`,
        dashboard: `${def.label} ${fmt(level, 2)}${unit} — level, not dose`,
        wizard: `Keep ${fmt(dose)} mL/day. Use a one-off correction to move the level, rate-limited to a safe daily step.`,
      };
    }
    /* A staged plan that turns out to be unnecessary has to be cancelled out
       loud. You were told 12.3 mL was coming; going quiet leaves you expecting
       a second step that is never going to be recommended, and possibly making
       it yourself. */
    const planned = plan && plan.target != null && Math.abs(plan.target - dose) > 0.3;
    return {
      state: 'idle', tone: 'ok', options: null, planCancelled: planned || false,
      summary: planned
        ? `${def.label} settled at ${fmt(dose)} mL — the second step is not needed`
        : `${def.label} dose is matching consumption`,
      why: planned
        ? `The plan was to reach ${fmt(plan.target)} mL in two steps, but ${fmt(dose)} is already holding ${el} steady — over ${daysSinceChange} days it moved less than the kit can resolve. The estimate that produced ${fmt(plan.target)} came from readings taken under the old dose; this one is measured under the dose you are actually running, so it is the better number. Do not make the second change.`
        : `Over ${daysSinceChange} days ${el} moved less than the kit can resolve. That is the answer you want.`,
      dashboard: planned
        ? `${def.label} settled at ${fmt(dose)} mL — plan complete`
        : `${def.label} holding at ${fmt(dose)} mL/day`,
      wizard: planned
        ? `Stop here. ${fmt(dose)} mL/day is holding ${el} steady, so the planned step to ${fmt(plan.target)} mL is cancelled.`
        : `${fmt(dose)} mL/day is right for this tank. Nothing to change.`,
    };
  }

  /* ---- a real change is recommended ------------------------------------- */
  const rise = Math.abs(r.dose - dose) * eff;
  const changeCount = ctx.changeCount || 0;
  const chasing = changeCount >= 4 && !r.bracket;
  const basisText = r.bracket
    ? `Fell at ${fmt(r.bracket[0])} mL, rose at ${fmt(r.bracket[1])} mL — so the dose that holds ${el} level is between the two.`
    : r.basis.startsWith('above')
      ? `${def.label} still fell at ${fmt(dose)} mL, so the answer is above it — but one window cannot say how far, so this steps up rather than leaps.`
      : r.basis.startsWith('below')
        ? `${def.label} still rose at ${fmt(dose)} mL, so the answer is below it.`
        : `${sentenceStart(el)} is moving ${fmt(Math.abs(r.rate), 2)}${unit} a day against ${fmt(dose * eff, 2)}${unit} supplied.`;
  return {
    state: r.action === 'increase' ? 'suggested-up' : 'suggested-down',
    tone: 'warn',
    options: [
      { id: 'apply', label: `Change to ${fmt(r.dose)} mL/day`, dose: r.dose, recommended: true,
        note: `Moves ${el} ${fmt(rise, 2)}${unit} a day.` },
      { id: 'keep', label: 'Keep the current dose', dose,
        note: `${def.label} continues ${r.rate < 0 ? 'falling' : 'rising'} at ${fmt(Math.abs(r.rate), 2)}${unit} a day.` },
    ],
    summary: `${def.label} dose could change — ${fmt(dose)} to ${fmt(r.dose)} mL`,
    /* One short reason, then the qualifications as separate notes. Stacked
       into a single paragraph these ran past 400 characters, which is more
       than anyone reads on a phone mid-task. */
    why: basisText,
    notes: [
      r.wasCapped ? `Step held to ${Math.round((Math.abs(r.dose - dose) / dose) * 100)}% so a noisy window cannot cause a swing.` : null,
      r.bracket ? `Each change narrows the range — this should be one of the last.` : null,
      chasing ? `Change ${changeCount + 1} without settling. Check salinity, the strength in Setup, and that the doser delivers what it claims.` : null,
    ].filter(Boolean),
    dashboard: `${def.label}: ${fmt(dose)} → ${fmt(r.dose)} mL`,
    wizard: `${fmt(dose)} → ${fmt(r.dose)} mL/day. ${basisText}`,
  };
}

/* One boundary where every state acquires what the app's notification system
   needs: a rank so it can be ordered against existing findings, a stable key
   plus a volatile signature for the hiding engine, and a destination so
   tapping it goes somewhere. Applied here rather than at each return so a new
   state cannot be added without them — the two-dismissal-systems bug earlier
   in this project came from exactly that being decided per-feature.

   Acute states are deliberately not dismissible: a tank at 6.4 dKH must not be
   hideable. */
const CLAIM_SPEC = {
  'emergency':             { rank: 0, dismissible: false, tab: 'param' },
  'emergency-correcting':  { rank: 0, dismissible: false, tab: 'param' },
  'blocked':               { rank: 1, dismissible: false, tab: 'setup' },
  'correct-level':         { rank: 2, dismissible: false, tab: 'param' },
  'early-warning':         { rank: 3, dismissible: false, tab: 'dosing' },
  'suggested-up':          { rank: 4, dismissible: true,  tab: 'dosing' },
  'suggested-down':        { rank: 4, dismissible: true,  tab: 'dosing' },
  'off-target':            { rank: 5, dismissible: true,  tab: 'param' },
  'off-target-correcting': { rank: 5, dismissible: true,  tab: 'param' },
  'overdue':               { rank: 6, dismissible: true,  tab: 'log' },
  'settling':              { rank: 7, dismissible: true,  tab: 'dosing' },
  'early-test':            { rank: 7, dismissible: true,  tab: 'param' },
  'watching':              { rank: 8, dismissible: true,  tab: 'param' },
  'idle':                  { rank: 9, dismissible: true,  tab: 'dosing' },
};

function attachClaimProps(d, key, level) {
  if (!d || !d.state) return d;
  const spec = CLAIM_SPEC[d.state];
  if (!spec) return d;
  /* The signature is what must still hold for a dismissal to stay in force,
     keyed to the reading so a worse number brings the note straight back. */
  const rounded = level == null || !isFinite(level) ? '' : Math.round(Number(level) * 100) / 100;
  return {
    ...d,
    rank: spec.rank,
    dismissible: spec.dismissible,
    dismissKey: spec.dismissible ? `${d.state}|${key}` : null,
    dismissSignature: spec.dismissible ? `${d.state}|${rounded}` : null,
    goto: d.goto || { tab: spec.tab, key },
  };
}

function decide(ctx) {
  return attachClaimProps(_decideRaw(ctx), ctx.def && ctx.def.key, ctx.level);
}

module.exports = { decide };
