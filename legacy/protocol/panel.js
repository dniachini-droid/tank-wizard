/* The panel under each element in the Dosing Wizard. Not a status label — a
   running account of where the adjustment has got to, what should happen next,
   and how you got here. Composed from facts rather than picked from a list, so
   it stays true as the situation changes. */
/* Trailing zeros were being stripped after rounding, so 1.046 shown to one
   decimal became "1.0" and then "1" — a 4.6% misstatement of a figure people
   check against their own arithmetic. Only strip when the value really is
   whole. */
const fmt = (n, d = 1) => {
  const v = Number(n);
  const s = v.toFixed(d);
  return Number(s) === Math.round(v) && Number.isInteger(Number(s)) ? String(Number(s)) : s;
};
const plural = (n, w) => `${n} ${w}${n === 1 ? '' : 's'}`;

const CADENCE = { alkalinity: 3, calcium: 7, magnesium: 21 };
const RATE = { alkalinity: 0.5, calcium: 15, magnesium: 50 };
const NOISE = { alkalinity: 0.1, calcium: 10, magnesium: 25 };

/* Returns rows: label + value + optional note. Every row earns its place. */
function panel(ctx) {
  const { key, def, eff, dose, level, priorDose, readings, daysSinceChange,
          state, history, target, appliedAt, correctionRemaining } = ctx;
  const U = def.unit;
  const el = def.label.toLowerCase();
  const cadence = CADENCE[key], maxRate = RATE[key], noise = NOISE[key];
  const rows = [];
  const mid = (def.min + def.max) / 2;

  /* --- where the dose stands --------------------------------------------- */
  if (priorDose != null && Math.abs(priorDose - dose) > 0.05) {
    const dir = dose > priorDose ? 'up' : 'down';
    const pct = Math.round(Math.abs(dose - priorDose) / priorDose * 100);
    rows.push({ label: 'Dose', value: `${fmt(priorDose)} → ${fmt(dose)} mL/day`,
      note: `${pct}% ${dir}, applied ${daysSinceChange === 0 ? 'today' : plural(daysSinceChange, 'day') + ' ago'}` });
  } else {
    rows.push({ label: 'Dose', value: `${fmt(dose)} mL/day`,
      note: daysSinceChange > 900 ? 'unchanged since you started logging'
        : `unchanged for ${plural(daysSinceChange, 'day')}` });
  }

  /* --- what that dose supplies, in the element's own units ---------------- */
  /* Small numbers need more places: magnesium supplying 0.44 ppm displayed as
     "0.4", which is a 9% misstatement of a figure people check against their
     own arithmetic. */
  /* Enough places that the displayed figure is within about 1% of the real
     one, whatever its magnitude. */
  const places = v => { const a = Math.abs(v);
    return a === 0 ? 0 : a < 0.1 ? 3 : a < 10 ? 2 : a < 100 ? 1 : 0; };
  rows.push({ label: 'Supplies', value: `${fmt(dose * eff, places(dose * eff))}${U} a day`,
    note: `at your solution strength and tank volume` });

  /* --- what the readings say --------------------------------------------- */
  const after = (readings || []).filter(r => appliedAt == null || r.day >= appliedAt);
  if (after.length >= 2) {
    const span = after[after.length - 1].day - after[0].day;
    const moved = after[after.length - 1].value - after[0].value;
    const perDay = span > 0 ? moved / span : 0;
    const meaningful = Math.abs(moved) > noise * 1.5;
    rows.push({
      label: 'Since the change',
      value: `${moved >= 0 ? '+' : ''}${fmt(moved, key === 'alkalinity' ? 2 : 0)}${U} over ${plural(span, 'day')}`,
      note: meaningful
        ? `${fmt(Math.abs(perDay), places(perDay))}${U} a day — beyond what the kit can invent`
        : `inside the kit's ${noise}${U} resolution, so not yet a trend`,
    });
    if (meaningful) {
      const consumption = dose * eff - perDay;
      /* An estimate, not a measurement — it inherits the reading's error, and
         over a short window that error is large. Saying "about" is the
         difference between a figure people trust appropriately and one they
         treat as gospel. */
      const consErr = (noise * Math.SQRT2 / Math.max(1, span)) / eff;
      rows.push({ label: 'Tank is using', value: `about ${fmt(consumption, places(consumption))}${U} a day`,
        note: consumption > 0
          ? `implies ${fmt(consumption / eff, places(consumption / eff))} mL/day to hold level, give or take ${fmt(consErr, places(consErr))} mL`
          : `${el} is being added from somewhere else` });
    }
  } else if (after.length === 1) {
    rows.push({ label: 'Since the change', value: 'one reading so far',
      note: `a rate needs two — next test ${cadence === 3 ? 'in a day or two' : `in about ${plural(cadence, 'day')}`}` });
  } else {
    rows.push({ label: 'Since the change', value: 'nothing logged yet',
      note: `${el} has been moving unmeasured since the change` });
  }

  /* --- what to expect ----------------------------------------------------- */
  const due = Math.max(0, cadence - daysSinceChange);
  if (state === 'settling' || state === 'early-test' || state === 'watching') {
    rows.push({ label: 'Expect', value: due === 0 ? 'a verdict at your next test' : `a verdict in ${plural(due, 'day')}`,
      note: `if the dose is right, ${el} should sit within ${noise}${U} of ${fmt(level, key === 'alkalinity' ? 2 : 0)}${U}` });
  } else if (state === 'overdue') {
    rows.push({ label: 'Expect', value: 'nothing until you test',
      note: `the next recommendation cannot be worked out without a reading` });
  } else if (state === 'idle') {
    rows.push({ label: 'Expect', value: `${el} to hold near ${fmt(level, key === 'alkalinity' ? 2 : 0)}${U}`,
      note: `retest in about ${plural(cadence, 'day')} to confirm it stays there` });
  } else if (state === 'suggested-up' || state === 'suggested-down') {
    const next = ctx.recommendedDose;
    if (next != null) {
      const delta = Math.abs(next - dose) * eff;
      rows.push({ label: 'If you apply it', value: `${el} moves about ${fmt(delta, key === 'alkalinity' ? 2 : 1)}${U} a day`,
        note: delta > maxRate ? `above the ${maxRate}${U}/day corals tolerate` : `within the ${maxRate}${U}/day limit` });
      rows.push({ label: 'Then', value: `retest in ${plural(cadence, 'day')}`,
        note: `expect ${el} to settle near ${fmt(mid, key === 'alkalinity' ? 2 : 0)}${U}` });
    }
  } else if (state === 'emergency-correcting' || state === 'off-target-correcting') {
    /* The panel had no branch for the correcting states, so a notification
       saying "correction under way" sat above a panel showing no correction at
       all — the two surfaces contradicting each other on 52,853 days. */
    const gap = mid - level;
    const remaining = correctionRemaining || 0;
    const done = Math.max(0, Math.abs(gap) - remaining);
    const daysLeft = Math.max(1, Math.ceil(remaining / maxRate));
    rows.push({ label: 'Correction', value: `${fmt(done, key === 'alkalinity' ? 2 : 0)}${U} done, ${fmt(remaining, key === 'alkalinity' ? 2 : 0)}${U} to go`,
      note: `about ${plural(daysLeft, 'day')} left at ${maxRate}${U} a day` });
    rows.push({ label: 'Meanwhile', value: `the daily dose stays at ${fmt(dose)} mL`,
      note: `the dose matches consumption; the correction moves the level` });
    rows.push({ label: 'Expect', value: `${el} near ${fmt(mid, key === 'alkalinity' ? 2 : 0)}${U} in ${plural(daysLeft, 'day')}`,
      note: `retest before adding more — going faster is its own risk` });
  } else if (state === 'correct-level' || state === 'off-target') {
    const gap = mid - level;
    const days = Math.max(1, Math.ceil(Math.abs(gap) / maxRate));
    rows.push({ label: 'Correction', value: `${fmt(Math.abs(gap), key === 'alkalinity' ? 2 : 0)}${U} to reach ${fmt(mid, key === 'alkalinity' ? 2 : 0)}${U}`,
      note: `${plural(days, 'day')} at the safe rate of ${maxRate}${U}/day` });
    if (correctionRemaining) {
      rows.push({ label: 'Progress', value: `${fmt(Math.abs(gap) - correctionRemaining, key === 'alkalinity' ? 2 : 0)}${U} done, ${fmt(correctionRemaining, key === 'alkalinity' ? 2 : 0)}${U} to go`,
        note: `the daily dose is unchanged while this runs` });
    }
  } else if (state === 'early-warning') {
    rows.push({ label: 'Expect', value: 'a choice, not a verdict',
      note: `one reading cannot separate a real move from a bad test` });
  }

  /* --- how you got here --------------------------------------------------- */
  const live = (history || []).filter(h => (ctx.today - h.day) <= 21);
  if (live.length >= 2) {
    const below = live.filter(h => h.rate < 0).sort((a,b)=>b.dose-a.dose)[0];
    const above = live.filter(h => h.rate > 0).sort((a,b)=>a.dose-b.dose)[0];
    if (below && above && above.dose > below.dose) {
      rows.push({ label: 'Narrowed to', value: `${fmt(below.dose)}–${fmt(above.dose)} mL/day`,
        note: `${el} fell at ${fmt(below.dose)} and rose at ${fmt(above.dose)}, so the answer is between them` });
    }
  }
  if (live.length >= 4) {
    rows.push({ label: 'Note', value: `${live.length} changes without settling`,
      note: `check salinity, the strength in Setup, and that the doser delivers what it claims` });
  }
  if (target != null && Math.abs(target - dose) > 0.3) {
    rows.push({ label: 'Planned', value: `${fmt(target)} mL/day was the target`,
      note: `superseded if the readings say otherwise — measured beats predicted` });
  }
  return rows;
}
module.exports = { panel };
