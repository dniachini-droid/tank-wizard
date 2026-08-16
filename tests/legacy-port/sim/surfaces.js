const path = require('path');
/* Every surface, every day, checked against every other. The five that must
   agree: tank summary headline, summary claims, findings, Dosing Wizard, and
   the reading confirmation window. */
const L = require(path.join(__dirname, '..', '..', '..', 'build', 'engines-new.cjs'));
const { makeRng } = require(path.join(__dirname, 'rng.js'));
const DEFS = L.PARAM_DEFS, T = L.todayStr();
const KEYS = ['alkalinity', 'calcium', 'magnesium'];
const STR = { alkalinity: 0.0533, calcium: 0.36, magnesium: 0.024 };
const DOSEF = { alkalinity: 'dailyDoseMl', calcium: 'calciumDoseMl', magnesium: 'magDoseMl' };
const STRF = { alkalinity: 'dkhPerMlPer100L', calcium: 'caPpmPerMlPer100L', magnesium: 'mgPpmPerMlPer100L' };
const NOISE = { alkalinity: 0.1, calcium: 10, magnesium: 25 };
const CAD = { alkalinity: 2, calcium: 7, magnesium: 21 };

function run(seed, opts) {
  const { volumeL, cons, startLevels, days, cancelChance = 0, ignoreChance = 0 } = opts;
  const rnd = makeRng(seed);
  const dayDate = (d) => L.addDays(T, -(days - 1 - d));
  const settings = { ...L.DEFAULT_SETTINGS, volumeL };
  const eff = {}, dose = {}, level = {};
  for (const k of KEYS) {
    eff[k] = STR[k] * 100 / volumeL;
    dose[k] = cons[k] / eff[k];
    level[k] = startLevels[k];
    settings[STRF[k]] = STR[k]; settings[DOSEF[k]] = dose[k];
  }
  const readings = [], doseLog = [];
  let plans = {};
  const problems = [];
  const note = (m, d) => problems.push(`${m}${d ? ' | ' + d : ''}`);
  const seen = {};

  for (let day = 0; day < days; day++) {
    for (const k of KEYS) level[k] += dose[k] * eff[k] - cons[k];
    const loggedToday = [];
    for (const k of KEYS) {
      if (day % CAD[k] !== 0) continue;
      const v = Math.round((level[k] + (rnd() - 0.5) * 2 * NOISE[k]) * 1000) / 1000;
      readings.push({ param: k, date: dayDate(day), time: '20:00', value: v });
      loggedToday.push({ k, v });
    }
    const st = L.deriveTankState({ readings, icps: [], paramDefs: DEFS, settings, doseLog, correctionPlans: plans });

    for (const k of KEYS) {
      const d = st.doseStates.find((x) => x.key === k);
      const def = DEFS.find((x) => x.key === k);
      if (!d) { note(`${k}: no dose state`); continue; }
      seen[d.state] = (seen[d.state] || 0) + 1;

      const claims = st.briefing.filter((c) => c.goto && c.goto.key === k);
      const said = claims.map((c) => `${c.claim} ${c.support || ''}`).join(' ');
      const finds = st.allFindings.filter((f) => (f.params || []).includes(k));
      const findText = finds.map((f) => `${f.title} ${f.detail || ''}`).join(' ');
      const head = st.overview.headline;

      /* --- text integrity on every surface --- */
      for (const [where, txt] of [['wizard', `${d.headline} ${d.detail}`],
        ['summary', said], ['findings', findText], ['headline', head]]) {
        if (/undefined|NaN|Infinity|\[object/.test(txt)) note(`${k}: broken text in ${where}`, txt.slice(0, 60));
      }

      /* --- the plan, if any, must reach every surface consistently --- */
      const planRunning = !!plans[k];
      const PLANWORDS = /on its way to|correction is under way|correction in progress|has reached|due a test|due a check|taking longer than expected|not responding to the correction|correction is running/i;
      const wizardSaysPlan = PLANWORDS.test(`${d.headline} ${d.detail}`);
      const summarySaysPlan = PLANWORDS.test(said) || /in line with your plan/i.test(said);

      /* `blocked` legitimately outranks a plan: it means the solution strength
         in Setup is outside what a real product delivers, so every millilitre
         figure is wrong — including the plan's own "40 mL for 5 days". Saying
         nothing about the plan is better than quoting a number that cannot be
         right. */
      if (planRunning && d.state !== 'blocked') {
        if (!wizardSaysPlan) note(`${k}: plan running, wizard silent`, `state=${d.state} level=${(level[k]||0).toFixed(0)} head=${d.headline}`);
        if (!summarySaysPlan) note(`${k}: plan running, summary silent`, said.slice(0, 60) || '(nothing)');
        if (/dose could change|dose is right, the level is not/i.test(said)) note(`${k}: summary fights the plan`, said.slice(0, 60));
        if (/parked|going nowhere|is steady but/i.test(said)) note(`${k}: called parked mid-plan`, said.slice(0, 60));
        /* The headline speaks for the whole tank, so "going nowhere" may be a
           true statement about a different element. Only a fault when the
           element under a plan is the ONLY one that could be meant. */
        /* Any parameter the headline could be describing — not just the three
           dosed ones. Nitrate or phosphate sitting off-target and steady is
           exactly what "going nowhere" means, and limiting the check to
           alkalinity, calcium and magnesium missed those. */
        const othersParked = DEFS.some((odef) => {
          if (odef.key === k || plans[odef.key]) return false;
          const last = st.latestByParam && st.latestByParam[odef.key];
          if (!last || last.value == null) return false;
          return last.value < odef.min || last.value > odef.max;
        });
        if (/going nowhere/i.test(head) && !othersParked) {
          note(`${k}: headline says going nowhere mid-plan`, head);
        }
      } else {
        if (wizardSaysPlan) note(`${k}: wizard claims a plan with none`, d.state);
        if (summarySaysPlan) note(`${k}: summary claims a plan with none`, said.slice(0, 70));
      }

      /* --- the reading window must match the wizard --- */
      for (const lg of loggedToday.filter((x) => x.k === k)) {
        const prior = readings.filter((r) => r.param === k).slice(-2)[0];
        const v = L.readingVerdict(def, { value: lg.v, prev: prior ? prior.value : null,
          delta: prior ? lg.v - prior.value : null, status: L.paramStatus(def, lg.v),
          doseState: d });
        const vt = `${v.headline} ${v.line}`;
        if (/undefined|NaN|Infinity/.test(vt)) note(`${k}: broken text in the reading window`, vt.slice(0, 60));
        /* Against the app's own view of the plan, not the harness's. A plan
           can sit in the harness's bookkeeping after the app has judged it
           arrived or unusable — correctionPlanFor rejects one whose figures do
           not survive coercion — and then `planRunning` is true while the app
           correctly has nothing to say about it. Four cases in a 400-tank
           sweep, every one the harness disagreeing with the engine rather than
           the window ignoring anything. */
        const appSeesPlan = !!(d && d.correctionPlan && d.correctionPlan.remaining > 0);
        if (appSeesPlan && !/correction|on its way|back in range|wizard/i.test(vt)) {
          note(`${k}: reading window ignores the plan`, vt.slice(0, 70));
        }
        /* Phrases that only a correction can produce. "back in range" is NOT
           one of them any more — the dose-change message uses it too, for a
           level a plain dose change brought back, and flagging that was the
           check reading a shared phrase as a claim about corrections. */
        if (!planRunning && /correction in progress|correction still running|correction has arrived/i.test(vt)) {
          note(`${k}: reading window invents a plan`, vt.slice(0, 70));
        }
        /* Celebration only on a genuine arrival. */
        if (v.celebrate && d.state !== 'correction-done') note(`${k}: celebrated without arriving`, d.state);
        if (v.celebrate && !planRunning) note(`${k}: celebrated with no plan`, vt.slice(0, 60));
      }
    }

    /* --- the keeper acts --- */
    for (const k of KEYS) {
      const d = st.doseStates.find((x) => x.key === k);
      if (!d || rnd() < ignoreChance) continue;
      if (['correction-done', 'correction-due', 'correction-stalled'].includes(d.state) && plans[k]) {
        dose[k] = plans[k].returnDose; settings[DOSEF[k]] = dose[k];
        doseLog.push({ element: k, date: dayDate(day), time: '21:00', ml: dose[k] });
        const p = { ...plans }; delete p[k]; plans = p; continue;
      }
      if (plans[k] && rnd() < cancelChance) {
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
          dose[k] = offer.dose; settings[DOSEF[k]] = dose[k];
          doseLog.push({ element: k, date: dayDate(day), time: '21:00', ml: offer.dose });
        }
      }
    }
  }
  return { problems, seen };
}
module.exports = { run };
