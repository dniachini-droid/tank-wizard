/* Calcium and magnesium on their own terms, not alkalinity with a new unit.
   Sourced practice:
     calcium   — test weekly; 400-450 typical, 380-470 workable. "Assuming you
                 are dosing correctly, calcium will stay steady if alk is
                 steady", so calcium is read alongside alkalinity rather than
                 alone. Corrections gradual, retest between steps.
     magnesium — test every 2-4 weeks; 1250-1400, sweet spot 1300-1350. BRS
                 method: stop dosing 5 days, test, work out what returns it to
                 target, divide by 5. Raise no more than 50 ppm/day. Maintenance
                 and correction are separate jobs.                              */



const fmt = (n, d = 0) => Number(n).toFixed(d).replace(/\.0$/, '');

const SPEC = {
  calcium: {
    label: 'Calcium', unit: 'ppm', noise: 10, safe: [350, 550], ideal: [400, 450],
    maxRisePerDay: 15,      /* gradual; Seachem caps a single dose well below this */
    testEveryDays: 7,       /* weekly is the consensus */
    minWindowDays: 14,      /* a 15% dose error needs ~45 days to show; 14 is the
                               shortest window where a large error is visible */
  },
  magnesium: {
    label: 'Magnesium', unit: 'ppm', noise: 25, safe: [1150, 1700], ideal: [1300, 1400],
    maxRisePerDay: 50,      /* "do not raise magnesium by more than 50 ppm per day" */
    testEveryDays: 21,      /* every 2-4 weeks */
    minWindowDays: 30,      /* consumption is unmeasurable faster than this */
  },
};

function fitRate(rows) {
  const n = rows.length; if (n < 2) return null;
  const mx = rows.reduce((a,r)=>a+r.day,0)/n, my = rows.reduce((a,r)=>a+r.value,0)/n;
  let sxy=0, sxx=0;
  for (const r of rows) { sxy+=(r.day-mx)*(r.value-my); sxx+=(r.day-mx)**2; }
  return sxx ? sxy/sxx : null;
}

function _decideSlowRaw(key, ctx) {
  const S = SPEC[key];
  const { def, eff, dose, level, readings, daysSinceChange, alkSteady, today } = ctx;
  const el = S.label.toLowerCase();
  const U = S.unit;
  const target = (def.min + def.max) / 2;
  const inBand = level >= def.min && level <= def.max;
  const unsafe = level < S.safe[0] || level > S.safe[1];
  const span = readings.length ? today - readings[0].day : 0;

  /* ---- level first: this is what these two are actually managed on ------ */
  if (unsafe) {
    const gap = target - level;
    const days = Math.ceil(Math.abs(gap) / S.maxRisePerDay);
    return {
      state: 'correct-level', tone: 'act',
      summary: `${S.label} is ${level < S.safe[0] ? 'below' : 'above'} what corals tolerate — ${fmt(level)}${U}`,
      why: `${S.label} outside ${S.safe[0]}–${S.safe[1]}${U} ${key === 'magnesium' ? 'stops calcium and alkalinity staying in solution' : 'limits calcification whatever alkalinity is doing'}. Correct the level, not the daily dose.`,
      notes: [`Raise no more than ${S.maxRisePerDay}${U} a day — ${days} day${days===1?'':'s'} to reach ${fmt(target)}${U}.`],
      dashboard: `${S.label} ${fmt(level)}${U} — correct the level`,
      wizard: `Bring ${el} to ${fmt(target)}${U} over ${days} day${days===1?'':'s'}. Keep the daily dose as it is until the level is back.`,
      options: [
        { id:'correct', label:`Correct over ${days} day${days===1?'':'s'}`, dose,
          note:`${fmt(Math.abs(gap)/days)}${U} a day, retesting between steps.`, recommended:true },
        { id:'wait', label:'Leave it for now', dose,
          note:`${S.label} stays at ${fmt(level)}${U}.` },
      ],
    };
  }

  if (!inBand) {
    const gap = target - level;
    const days = Math.ceil(Math.abs(gap) / S.maxRisePerDay);
    return {
      state: 'off-target', tone: 'warn',
      summary: `${S.label} is ${fmt(level)}${U}, outside your ${def.min}–${def.max}${U} band`,
      why: `Still inside what the hobby treats as workable, so this is a nudge rather than a rescue. ${key==='calcium' && alkSteady===false ? 'Alkalinity is also moving — settle that first, since calcium follows it.' : `Correct the level; the daily dose is a separate question.`}`,
      notes: [`No more than ${S.maxRisePerDay}${U} a day.`],
      dashboard: `${S.label} ${fmt(level)}${U} — off target`,
      wizard: `A ${fmt(Math.abs(gap))}${U} correction over ${days} day${days===1?'':'s'} brings ${el} to ${fmt(target)}${U}.`,
      options: [
        { id:'correct', label:`Correct to ${fmt(target)}${U}`, dose, note:`Over ${days} day${days===1?'':'s'}.`, recommended:true },
        { id:'hold', label:'Hold and watch', dose, note:`${S.label} is inside the workable range.` },
      ],
    };
  }

  /* ---- in band: is the daily dose right? ------------------------------- */
  if (span < S.minWindowDays) {
    const left = S.minWindowDays - span;
    /* Acknowledge what has just been fixed rather than going quiet on it. */
    const was = ctx.previousState;
    const resolved = ['suggested-up','suggested-down','off-target','correct-level'].includes(was);
    const label = { 'suggested-up':'The increase', 'suggested-down':'The reduction',
      'off-target':'The correction', 'correct-level':'The correction' }[was];
    return {
      state: 'watching', tone: 'ok', resolvedFrom: resolved ? was : null,
      summary: resolved
        ? `${label} worked — ${el} back in range at ${fmt(level)}${U}`
        : `${S.label} is in range at ${fmt(level)}${U}`,
      why: `${S.label} moves too slowly to judge a dose from a few readings — ${S.minWindowDays} days of history is the shortest span where a real dose error clears the kit's ${S.noise}${U} resolution.`,
      notes: [`Next test due in about ${S.testEveryDays} days.`],
      dashboard: `${S.label} ${fmt(level)}${U} — in range`,
      wizard: `${fmt(dose)} mL/day. ${left} more day${left===1?'':'s'} of history before the dose can be judged.`,
      options: null,
    };
  }

  const rate = fitRate(readings) || 0;
  const detectable = (2 * S.noise * Math.SQRT2) / Math.max(1, span);
  if (Math.abs(rate) < detectable) {
    return {
      state: 'idle', tone: 'ok',
      /* Says the level is holding, not that the dose is right. Those are
         different claims and only the first is known: magnesium's dose cannot
         be measured from tank readings at all, and the old wording asserted it
         was correct when it was 62% out. The level being steady is what
         matters and what the readings actually show. */
      summary: `${S.label} is holding at ${fmt(level)}${U}`,
      why: `Over ${Math.round(span)} days ${el} moved less than the kit's ${S.noise}${U} resolution. ${key === 'magnesium' ? `Magnesium moves too slowly for its exact daily dose to be measurable — a steady level is the real test, and it is steady.` : `Nothing to change.`}`,
      notes: [], dashboard: `${S.label} holding at ${fmt(dose,1)} mL/day`,
      wizard: `Keep ${fmt(dose,1)} mL/day — ${el} is steady. Test again in about ${S.testEveryDays} days.`,
      options: null,
    };
  }

  /* A real drift over a long window: adjust the maintenance dose. */
  const want = Math.max(0, dose + (-rate) / eff);
  const capped = Math.max(dose*0.75, Math.min(dose*1.25, want));
  const final = Math.round(capped * 10) / 10;
  const coupled = key === 'calcium' && alkSteady === false;
  return {
    state: rate < 0 ? 'suggested-up' : 'suggested-down', tone: 'warn',
    summary: coupled
      ? `${S.label} is drifting, but alkalinity is too`
      : `${S.label} dose could change — ${fmt(dose,1)} to ${fmt(final,1)} mL`,
    why: coupled
      ? `Calcium follows alkalinity: when both drift together the cause is usually the alkalinity dose, not the calcium one. Settle alkalinity first, then retest calcium.`
      : `${S.label} moved ${fmt(Math.abs(rate)*7,1)}${U} a week across ${Math.round(span)} days — slow, but consistent enough over that span to be real.`,
    notes: [Math.abs(final-dose) > dose*0.24 ? `Step held to 25% of the current dose.` : null].filter(Boolean),
    dashboard: coupled ? `${S.label} drifting — check alkalinity first` : `${S.label}: ${fmt(dose,1)} → ${fmt(final,1)} mL`,
    wizard: coupled
      ? `Hold ${fmt(dose,1)} mL/day until alkalinity is steady, then retest ${el}.`
      : `${fmt(dose,1)} → ${fmt(final,1)} mL/day, then retest in about ${S.testEveryDays} days.`,
    options: coupled
      ? [{ id:'hold', label:'Hold and fix alkalinity first', dose, note:'Calcium usually follows once alkalinity settles.', recommended:true },
         { id:'apply', label:`Change to ${fmt(final,1)} mL anyway`, dose:final, note:'May need reversing once alkalinity settles.' }]
      : [{ id:'apply', label:`Change to ${fmt(final,1)} mL/day`, dose:final, note:`Retest in about ${S.testEveryDays} days.`, recommended:true },
         { id:'keep', label:'Keep the current dose', dose, note:`${S.label} continues ${rate<0?'falling':'rising'} ${fmt(Math.abs(rate)*7,1)}${U} a week.` }],
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

function decideSlow(key, ctx) {
  return attachClaimProps(_decideSlowRaw(key, ctx), key, ctx.level);
}

module.exports = { decideSlow, SPEC };
