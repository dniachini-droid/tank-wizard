/* A tank over years, not weeks. Everything so far has been a snapshot or a
   few months; this asks what only shows up over a long life: a maturing tank
   whose demand triples, kits replaced, salt mixes changed, months of neglect,
   and thousands of accumulated readings. */
const path = require('path');
const L = require(path.join(__dirname, '..', '..', '..', 'build', 'engines-new.cjs'));
const { makeRng } = require(path.join(__dirname, 'rng.js'));

const DEFS = L.PARAM_DEFS;
const KEYS = ['alkalinity', 'calcium', 'magnesium'];
const STR = { alkalinity: 0.0533, calcium: 0.36, magnesium: 0.024 };
const DOSEF = { alkalinity: 'dailyDoseMl', calcium: 'calciumDoseMl', magnesium: 'magDoseMl' };
const STRF = { alkalinity: 'dkhPerMlPer100L', calcium: 'caPpmPerMlPer100L', magnesium: 'mgPpmPerMlPer100L' };
const NOISE = { alkalinity: 0.1, calcium: 10, magnesium: 25 };
const CAD = { alkalinity: 2, calcium: 7, magnesium: 21 };

function run(seed, opts) {
  const { volumeL, cons0, days, growthPerYear, neglectSpells = [], kitChangeDays = [] } = opts;
  const rnd = makeRng(seed);
  const T = L.todayStr();
  const dayDate = (d) => L.addDays(T, -(days - 1 - d));
  const settings = { ...L.DEFAULT_SETTINGS, volumeL };
  const eff = {}, dose = {}, level = {}, cons = {};
  for (const k of KEYS) {
    eff[k] = STR[k] * 100 / volumeL;
    cons[k] = cons0[k];
    dose[k] = cons[k] / eff[k];
    level[k] = (DEFS.find((d) => d.key === k).min + DEFS.find((d) => d.key === k).max) / 2;
    settings[STRF[k]] = STR[k];
    settings[DOSEF[k]] = dose[k];
  }
  const readings = [], doseLog = [], waterChanges = [];
  let plans = {};
  /* A correction the keeper makes with dry salt rather than the doser.
     See the note at the keeper loop below for why this exists. */
  let saltPlans = {};
  const problems = [];
  const note = (m, d) => problems.push(`${m}${d ? ' | ' + d : ''}`);
  const seen = {};
  let derivations = 0, slowest = 0;
  const trace = [];
  const planLog = [];

  for (let day = 0; day < days; day++) {
    /* Corals grow: demand compounds. */
    for (const k of KEYS) cons[k] *= Math.pow(growthPerYear, 1 / 365);
    /* A real tank cannot go negative: consumption stops when there is nothing
       left to consume. Letting the level run to -335 dKH produced numbers the
       engine rightly refuses to assess, and made the harness look like a bug
       in the app. */
    for (const k of KEYS) {
      const available = Math.max(0, level[k]);
      const used = Math.min(cons[k], available + dose[k] * eff[k]);
      level[k] = Math.max(0, level[k] + dose[k] * eff[k] - used);
    }
    /* A dry-salt correction in progress, delivered a day at a time at the §3
       rail — the same shape the app describes when it sends the keeper to a
       dedicated supplement instead of the maintenance bottle. */
    for (const k of KEYS) {
      const sp = saltPlans[k];
      if (!sp || sp.daysLeft <= 0) continue;
      level[k] += sp.perDay;
      sp.daysLeft--;
    }

    /* Water changes, which the harness never simulated. A change pulls every
       level toward the salt mix, which is a disturbance the engines are
       supposed to recognise and not mistake for consumption. */
    if (opts.waterChangeEvery && day % opts.waterChangeEvery === 0 && day > 0) {
      const frac = (opts.waterChangeL || 12) / volumeL;
      const mix = opts.saltMix || { alkalinity: 8.8, calcium: 440, magnesium: 1320 };
      for (const k of KEYS) level[k] = level[k] * (1 - frac) + (mix[k] || level[k]) * frac;
      waterChanges.push({ id: 'w' + day, date: dayDate(day), litres: opts.waterChangeL || 12 });
    }

    const neglected = neglectSpells.some(([a, b]) => day >= a && day < b);
    if (!neglected) {
      for (const k of KEYS) {
        if (day % CAD[k] !== 0) continue;
        readings.push({ param: k, date: dayDate(day), time: '20:00',
          value: Math.round((level[k] + (rnd() - 0.5) * 2 * NOISE[k]) * 1000) / 1000 });
      }
    }
    /* Only derive periodically — deriving 1,800 times is the harness being
       slow, not the app. */
    if (day % (opts.checkEvery || 7) !== 0 && day !== days - 1) continue;

    /* Shift every date so the simulated day IS today. The engine measures
       plans, settling windows and overdue tests against todayStr(), so a loop
       that runs in the past reads every plan as hundreds of days old the
       moment it is created — which looked exactly like the app failing. */
    const shift = days - 1 - day;
    const slide = (d) => L.addDays(d, shift);
    const rNow = readings.map((r) => ({ ...r, date: slide(r.date) }));
    const dNow = doseLog.map((r) => ({ ...r, date: slide(r.date) }));
    const pNow = {};
    for (const [k2, v2] of Object.entries(plans)) {
      pNow[k2] = { ...v2, startedAt: slide(String(v2.startedAt).slice(0, 10)) };
    }
    const t0 = Date.now();
    let st;
    try {
      st = L.deriveTankState({ readings: rNow, icps: [], paramDefs: DEFS, settings, doseLog: dNow, correctionPlans: pNow, waterChanges: waterChanges.map((w) => ({ ...w, date: slide(w.date) })) });
    } catch (e) { note('derivation threw', `day ${day}: ${e.message}`); continue; }
    derivations++;
    slowest = Math.max(slowest, Date.now() - t0);
    if (day % 60 === 0) {
      const d = st.doseStates.find((x) => x.key === 'alkalinity');
      trace.push({ day, level: level.alkalinity, dose: dose.alkalinity, cons: cons.alkalinity,
        state: d ? d.state : '-', head: d ? d.headline : '-' });
    }

    for (const k of KEYS) {
      const d = st.doseStates.find((x) => x.key === k);
      if (!d) { note(`${k}: no dose state`, `day ${day}`); continue; }
      seen[d.state] = (seen[d.state] || 0) + 1;
      const text = `${d.headline} ${d.detail}`;
      if (/undefined|NaN|Infinity|\[object/.test(text)) note(`${k}: broken text`, text.slice(0, 50));
      if (/-\d+ (day|week|month)/.test(text)) note(`${k}: negative duration`, text.slice(0, 50));
      /* The point of the app: a tank heading for trouble must be told before
         it gets there, not after. */
      const pd = DEFS.find((x) => x.key === k);
      /* Against the last reading, not the simulated truth. During a neglect
         spell there is no recent reading and "needs another reading" is the
         only honest thing the app can say — blaming it for not knowing a
         number nobody gave it was the harness being unfair. */
      const known = st.latestByParam && st.latestByParam[k];
      const outOfBand = known && known.value != null
        && (known.value < pd.min || known.value > pd.max);
      const urgent = d.tone === 'act' || /act|warn/.test(String(d.tone));
      if (outOfBand) {
        /* Any wording that acknowledges the level, not just the words I
           happened to think of first — "the level is not" right is a perfectly
           clear way to say it and my regex called it silence. */
        const said = /below|above|out of|low|high|correct|rising|falling|reach|the level is not|range|back in|holding at/i.test(text);
        if (!said) note(`${k}: out of band and the wizard says nothing about it`, `${d.state}: known=${known.value} aCurrent=${(k==='alkalinity'?st.alkAssessment:k==='calcium'?st.caAssessment:st.mgAssessment||{}).current ? 'yes':'no'}: ${text.slice(0,40)}`);
      }
    }
    if (/undefined|NaN|Infinity/.test(st.overview.headline)) note('headline broken', st.overview.headline);

    /* Keeper acts on advice. */
    for (const k of KEYS) {
      const d = st.doseStates.find((x) => x.key === k);
      if (!d || neglected) continue;
      if (['correction-done', 'correction-due', 'correction-stalled'].includes(d.state) && plans[k]) {
        const a2 = { alkalinity: st.alkAssessment, calcium: st.caAssessment, magnesium: st.mgAssessment }[k];
        const cpx = a2 && a2.correctionPlan;
        planLog.push({ day, el: k, ev: 'end', via: d.state, from: dose[k],
          to: plans[k].returnDose, level: level[k], need: cons[k] / eff[k],
          moved: cpx ? cpx.movedSoFar : null, since: cpx ? cpx.measuredSince : null,
          pdays: cpx ? cpx.days : null, remaining: cpx ? cpx.remaining : null });
        dose[k] = plans[k].returnDose; settings[DOSEF[k]] = dose[k];
        doseLog.push({ element: k, date: dayDate(day), time: '21:00', ml: dose[k] });
        const p = { ...plans }; delete p[k]; plans = p; continue;
      }
      if (!plans[k]) {
        const os = st.correctionOffers[k] || {};
        const offer = ['quick', 'steady', 'gentle'].map((n) => os[n]).find((o) => o && o.possible);
        if (offer) {
          plans = { ...plans, [k]: { target: offer.aimPoint, returnDose: offer.returnDose,
            startedAt: dayDate(day), startValue: level[k], pace: offer.pace, dose: offer.dose, days: offer.days } };
          planLog.push({ day, el: k, ev: 'start', via: offer.pace, from: dose[k],
            to: offer.dose, ret: offer.returnDose, level: level[k], need: cons[k] / eff[k],
            target: offer.aimPoint, lastRead: (st.latestByParam[k]||{}).value, state: d.state });
          dose[k] = offer.dose; settings[DOSEF[k]] = dose[k];
          doseLog.push({ element: k, date: dayDate(day), time: '21:00', ml: offer.dose });
          continue;
        }
        /* The keeper does what the app tells them, including when the answer
           is not a doser setting.

           When a level is out of band and the app refuses the correction
           because the maintenance solution is the wrong tool — "a dedicated
           supplement or dry salt is the right tool for a gap this size"
           (helpers.js, proposeCorrection) — a real keeper opens Setup's
           correction calculator and weighs it out. This harness previously
           could not, so it modelled a keeper who reads that instruction and
           does nothing, for years. Magnesium is where that bites: its daily
           dose is never tuned from readings (reef-chemistry.md §10), so once
           demand outgrows a fixed dose the level falls and the doser is not
           the route back.

           A refusal that IS the magnesium gate is deliberately excluded. There
           the app is telling the keeper NOT to correct this element yet, and a
           keeper who follows advice does not reach for the dry salt anyway —
           excluding it is what keeps the gate's cost visible in this suite
           rather than papered over. */
        const refusal = ['quick', 'steady', 'gentle'].map((n) => os[n])
          .find((o) => o && o.possible === false && o.up && o.gap > 0 && !o.magnesiumGate);
        if (refusal && !saltPlans[k]) {
          const rail = (L.CORRECTIONS[k] || {}).maxPerDay;
          if (rail > 0) {
            const dl = Math.max(1, Math.ceil(refusal.gap / rail));
            saltPlans = { ...saltPlans, [k]: { perDay: refusal.gap / dl, daysLeft: dl } };
            planLog.push({ day, el: k, ev: 'salt', level: level[k], target: refusal.aimPoint, days: dl });
          }
        }
        if (saltPlans[k] && saltPlans[k].daysLeft <= 0) { const s = { ...saltPlans }; delete s[k]; saltPlans = s; }
        const a = { alkalinity: st.alkAssessment, calcium: st.caAssessment, magnesium: st.mgAssessment }[k];
        if (a && a.recommendedDose != null && /suggest/.test(d.state)
            && Math.abs(a.recommendedDose - dose[k]) > 0.05) {
          dose[k] = a.recommendedDose; settings[DOSEF[k]] = dose[k];
          doseLog.push({ element: k, date: dayDate(day), time: '21:00', ml: dose[k] });
        }
      }
    }
  }
  return { problems, seen, level, dose, cons, trace, planLog, waterChanges: waterChanges.length, openPlans: Object.keys(plans), readings: readings.length,
    doseChanges: doseLog.length, derivations, slowest };
}
module.exports = { run, KEYS, DEFS };
