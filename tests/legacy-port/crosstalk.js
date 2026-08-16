/* Every surface reads from the same engine, and nothing is said twice.
 *
 * The app has one place that answers each question — the dosing engines for a
 * recommendation, buildFindings for the findings pool, buildBriefing for the
 * summary. The failure this guards against is two surfaces reasoning
 * independently and disagreeing, which has happened twice: three dose engines
 * computing correct answers that no component read, and two dismissal systems
 * writing different key formats into the same storage.
 */
const path = require('path');
const L = require(path.join(__dirname, '..', '..', 'build', 'engines-new.cjs'));

/* The app ships no solution strengths — only the user's own bottle can say
   what a product delivers (docs/spec/reef-chemistry.md §16), and an unset
   strength is refused and named. These simulated tanks stand in for CONFIGURED
   tanks, so they state the strengths explicitly. The figures are the ones this
   harness used to inherit from DEFAULT_SETTINGS, so every expectation is
   unchanged. Cases that deliberately probe a missing or null strength set
   their own and are untouched. */
const TANK_STRENGTHS = { dkhPerMlPer100L: 0.0533, caPpmPerMlPer100L: 0.36, mgPpmPerMlPer100L: 0.024 };


const T = L.todayStr();
const defs = L.PARAM_DEFS;
let rnd = 606060;
const rand = () => { rnd = (rnd * 1103515245 + 12345) % 2147483648; return rnd / 2147483648; };
const pick = (a) => a[Math.floor(rand() * a.length)];

const problems = {};
const note = (k, d) => { (problems[k] = problems[k] || []).push(d); };

const RUNS = Number(process.env.CROSSTALK_RUNS || 600);
let n = 0;

for (let i = 0; i < RUNS; i++) {
  const readings = [];
  for (const d of defs) {
    if (rand() < 0.14) continue;
    const w = d.max - d.min;
    const base = d.min + w * (rand() * 2.4 - 0.7);
    const c = 1 + Math.floor(rand() * 10);
    const drift = (rand() - 0.5) * w * pick([0, 0.2, 1.1]);
    for (let j = c; j > 0; j--) {
      readings.push({ param: d.key, date: L.addDays(T, -j * pick([1, 2, 3, 7])), time: '20:00',
        value: Math.round((base + drift * ((c - j) / c) + (rand() - 0.5) * w * 0.12) * 10000) / 10000 });
    }
  }
  const latest = {};
  for (const d of defs) {
    const r = readings.filter((x) => x.param === d.key).sort((a, b) => (a.date < b.date ? 1 : -1));
    latest[d.key] = r[0] || null;
  }
  const settings = { ...L.DEFAULT_SETTINGS, ...TANK_STRENGTHS, volumeL: pick([20, 77, 200, 800]) };

  let findings, states = [], assessments = {};
  try {
    findings = L.buildFindings({ readings, icps: [], paramDefs: defs, settings,
      doseLog: [], waterChanges: [], latestByParam: latest }).findings;
    for (const k of ['alkalinity', 'calcium', 'magnesium']) {
      const def = defs.find((d) => d.key === k);
      const fn = k === 'alkalinity' ? L.assessAlkalinity : k === 'calcium' ? L.assessCalcium : L.assessMagnesium;
      const a = fn({ readings, doseLog: [], waterChanges: [], corrections: [], settings, def });
      assessments[k] = a;
      const st = L.doseStatus(a, def);
      if (st) states.push({ ...st, key: k, el: def.label.toLowerCase() });
    }
  } catch (e) { note('setup threw', e.message); continue; }

  const claims = L.buildBriefing(readings, latest, defs, findings, states, {});
  n++;

  /* 1. No claim appears twice, by id or by wording. */
  const ids = new Set(), texts = new Set();
  for (const c of claims) {
    if (ids.has(c.id)) note('duplicate claim id', c.id);
    ids.add(c.id);
    if (texts.has(c.claim)) note('two claims with identical wording', c.claim);
    texts.add(c.claim);
  }

  /* 2. Two findings must not both assert that the same parameter's level is
        wrong — that is one fact stated twice. */
  const LEVEL = /^(far-out-|heading-out-|salinity-off$)/;
  const levelBy = {};
  for (const c of claims) {
    const m = /^finding:(.+)$/.exec(c.id);
    if (!m || !LEVEL.test(m[1])) continue;
    const key = c.goto && c.goto.tab === 'param' ? c.goto.key : null;
    if (!key) continue;
    if (levelBy[key]) note('two level claims for one parameter', `${key}: ${levelBy[key]} + ${m[1]}`);
    levelBy[key] = m[1];
  }

  /* 3. A dose claim and a drift claim must not both describe the same
        element's movement. */
  for (const k of ['alkalinity', 'calcium', 'magnesium']) {
    const hasDose = claims.some((c) => c.id === 'dose:' + k);
    const hasDrift = claims.some((c) => c.id === 'drift:' + k);
    if (hasDose && hasDrift) note('dose and drift claim for one element', k);
  }

  /* 4. The summary's dose claim must repeat the dosing engine's own wording,
        not a second opinion assembled from the readings. */
  for (const st of states) {
    const c = claims.find((x) => x.id === 'dose:' + st.key);
    if (!c) continue;
    if (c.claim !== st.headline) {
      note('summary reworded the dose verdict', `${st.key}: "${c.claim}" vs "${st.headline}"`);
    }
  }

  /* 5. A parameter named as fine must not also carry a level claim. */
  const solid = claims.find((c) => c.id === 'solid');
  if (solid) {
    const named = String(solid.support || '').replace(/^Holding:\s*/, '').replace(/\.$/, '')
      .split(/,\s*|\s+and\s+/).map((x) => x.trim().toLowerCase());
    for (const [key, id] of Object.entries(levelBy)) {
      const lbl = (defs.find((d) => d.key === key) || {}).label;
      if (lbl && named.includes(lbl.toLowerCase())) {
        note('named as fine while its level is flagged', `${lbl} (${id})`);
      }
    }
  }

  /* 6. Every claim's destination must resolve to something real. */
  for (const c of claims) {
    if (!c.goto) continue;
    if (!['param', 'dosing', 'log'].includes(c.goto.tab)) note('unknown destination', String(c.goto.tab));
    if (c.goto.tab === 'param' && !defs.find((d) => d.key === c.goto.key)) {
      note('destination parameter does not exist', String(c.goto.key));
    }
  }
}

const keys = Object.keys(problems);
console.log(`  cross-talk: ${RUNS} tanks, ${keys.length} properties violated`);
for (const k of keys) {
  console.log(`    ${k}: ${problems[k].length}`);
  problems[k].slice(0, 3).forEach((d) => console.log(`      ${d}`));
}
if (keys.length) process.exit(1);

/* The dosing protocol owns its elements.
 *
 * A generic trend detector and the dosing protocol were both answering "is
 * this moving, should I act" for alkalinity, calcium and magnesium — over
 * different windows, so they produced different numbers and could contradict
 * outright: the summary said to correct a drift while the Dosing Wizard said
 * the dose was matching consumption. */
{
  const T2 = L.todayStr();
  const defs2 = L.PARAM_DEFS;
  let rnd2 = 31415, bad = 0, holds = 0, agrees = 0;
  const rand2 = () => { rnd2 = (rnd2 * 1103515245 + 12345) % 2147483648; return rnd2 / 2147483648; };
  const pick2 = (a) => a[Math.floor(rand2() * a.length)];

  for (let i = 0; i < 400; i++) {
    const readings = [];
    for (const d of defs2) {
      if (rand2() < 0.1) continue;
      const w = d.max - d.min;
      const base = d.min + w * (rand2() * 1.6 - 0.3);
      const c = 4 + Math.floor(rand2() * 10);
      const drift = (rand2() - 0.5) * w * pick2([0, 0.3, 1.2]);
      for (let j = c; j > 0; j--) {
        readings.push({ param: d.key, date: L.addDays(T2, -j * pick2([1, 2, 3])), time: '20:00',
          value: Math.round((base + drift * ((c - j) / c) + (rand2() - 0.5) * w * 0.08) * 10000) / 10000 });
      }
    }
    const latest = {};
    for (const d of defs2) {
      const r = readings.filter((x) => x.param === d.key).sort((a, b) => (a.date < b.date ? 1 : -1));
      latest[d.key] = r[0] || null;
    }
    const settings = { ...L.DEFAULT_SETTINGS, ...TANK_STRENGTHS, volumeL: pick2([77, 200]) };
    let findings;
    try {
      findings = L.buildFindings({ readings, icps: [], paramDefs: defs2, settings,
        doseLog: [], waterChanges: [], latestByParam: latest }).findings;
    } catch (e) { continue; }

    for (const k of ['alkalinity', 'calcium', 'magnesium']) {
      const def = defs2.find((d) => d.key === k);
      const fn = k === 'alkalinity' ? L.assessAlkalinity : k === 'calcium' ? L.assessCalcium : L.assessMagnesium;
      let a;
      try { a = fn({ readings, doseLog: [], waterChanges: [], corrections: [], settings, def }); }
      catch (e) { continue; }
      const warned = findings.some((x) => x.id === 'heading-out-' + k);
      if (a.action === 'hold') {
        holds++;
        /* A hold and a long-run drift warning can coexist — they answer over
           different windows, and suppressing the warning entirely made a tank
           falling 0.9 dKH across a month completely silent. What must not
           happen is the two giving opposite instructions, so the warning is
           required to defer to the protocol in its wording rather than telling
           you to correct something the protocol just declined to act on. */
        if (warned) {
          const f2 = findings.find((x) => x.id === 'heading-out-' + k);
          const text = String(f2 && f2.detail || '');
          if (!/no dose change is suggested yet/.test(text)) {
            console.log(`  FAIL ${k}: protocol holds but the finding recommends a correction`); bad++;
          }
          if (/Correcting a drift this size now is a small adjustment/.test(text)) {
            console.log(`  FAIL ${k}: finding contradicts the protocol's hold`); bad++;
          }
        }
      }
      if (a.action === 'increase' || a.action === 'decrease') {
        agrees++;
        if (warned) { console.log(`  FAIL ${k} warned twice — protocol and trend detector`); bad++; }
      }
    }
  }
  console.log(`  protocol authority: ${holds} holds, ${agrees} changes, ${bad} contradictions`);
  if (bad) process.exit(1);
}

/* A correction under way must reach every surface, not just the wizard.
 *
 * The Dosing Wizard said "alkalinity is on its way to 9.1" while the tank
 * summary said "parked off-target — nothing to chase" and the headline said
 * "one sitting off-target but going nowhere". Three surfaces, three stories,
 * about an element that was being deliberately moved.
 */
{
  const defs6 = L.PARAM_DEFS;
  const T9 = L.todayStr();
  const S9 = { ...L.DEFAULT_SETTINGS, ...TANK_STRENGTHS, volumeL: 77, dkhPerMlPer100L: 0.0533, dailyDoseMl: 9.3 };
  const build = (corrections) => {
    const readings = [8.0, 8.05, 8.1, 8.2, 8.35].map((v, i) =>
      ({ param: 'alkalinity', date: L.addDays(T9, -(4 - i)), time: '20:00', value: v }));
    for (const k of ['calcium', 'magnesium', 'nitrate', 'phosphate', 'ph']) {
      const d = defs6.find((x) => x.key === k);
      for (let j = 8; j > 0; j--) readings.push({ param: k, date: L.addDays(T9, -j), time: '20:00', value: (d.min + d.max) / 2 });
    }
    return L.deriveTankState({ readings, icps: [], paramDefs: defs6, settings: S9, corrections });
  };
  let bad = 0;

  /* The shape logCorrection actually writes: element and millilitres. The
     tests had used { param, amount, fromValue }, fields nothing produces, so
     every check of the correction cross-talk passed against data the app
     cannot create while the feature was dead in the app itself. */
  const running = build([{ id: 'c1', element: 'alkalinity', date: L.addDays(T9, -2),
    time: '12:00', ml: 20, direction: 'up' }]);
  const wiz = running.doseStates.find((d) => d.key === 'alkalinity');
  if (!wiz || wiz.state !== 'correcting') { console.log('  FAIL wizard does not report the correction'); bad++; }

  /* The summary must carry it, and must not simultaneously call it parked. */
  const claims = running.briefing.map((c) => c.claim).join(' | ');
  if (!/on its way to/.test(claims)) { console.log('  FAIL the summary does not mention the correction'); bad++; }
  if (/parked off-target/.test(claims)) { console.log('  FAIL summary calls a corrected element parked'); bad++; }

  /* The headline must not describe it as going nowhere. */
  if (/going nowhere/.test(running.overview.headline)) {
    console.log(`  FAIL headline says "going nowhere" during a correction`); bad++;
  }

  /* And with no correction, the ordinary wording must be unchanged. */
  const idle = build([]);
  const idleClaims = idle.briefing.map((c) => c.claim).join(' | ');
  if (/on its way to/.test(idleClaims)) { console.log('  FAIL claims a correction with none logged'); bad++; }

  console.log(`  correction reaches every surface: ${bad} failures`);
  if (bad) process.exit(1);
}

/* A temporary correction dose, end to end.
 *
 * Two jobs share one control: tuning the dose to match consumption, and
 * deliberately setting it off consumption to move a level somewhere else.
 * Without a stored plan the engine cannot tell them apart, and raising
 * calcium's dose from 12 to 25 to reach 475 made it recommend cutting back to
 * 18.8 — arguing with the plan the keeper had just started.
 */
{
  const defs8 = L.PARAM_DEFS;
  const T12 = L.todayStr();
  const S12 = { ...L.DEFAULT_SETTINGS, ...TANK_STRENGTHS, volumeL: 77, caPpmPerMlPer100L: 0.36, calciumDoseMl: 12 };
  const build = (vals, plans, dose) => {
    const r = vals.map((v, i) => ({ param: 'calcium', date: L.addDays(T12, -(vals.length - 1 - i)), time: '20:00', value: v }));
    for (const k of defs8.map((d) => d.key)) {
      if (k === 'calcium' || k === 'ammonia' || k === 'salinity') continue;
      const d = defs8.find((x) => x.key === k);
      for (let j = 8; j > 0; j--) r.push({ param: k, date: L.addDays(T12, -j * 2), time: '20:00', value: (d.min + d.max) / 2 });
    }
    return L.deriveTankState({ readings: r, icps: [], paramDefs: defs8,
      settings: { ...S12, calciumDoseMl: dose || 12 }, doseLog: [], correctionPlans: plans || {} });
  };
  /* Anchored to the band rather than to fixed numbers. 400 -> 475 was a walk
     from below the band to its old midpoint; the band is now 400-450, so 400
     is its floor and 475 is above the top — the plan arrived before it began. */
  const caBand = L.PARAM_DEFS.find((d) => d.key === 'calcium');
  const caTarget = (caBand.min + caBand.max) / 2;
  const caStart = caBand.min - (caBand.max - caBand.min);
  const plan = { target: caTarget, returnDose: 12, startedAt: L.addDays(T12, -9),
    startValue: caStart, pace: 'steady', dose: 28 };
  let bad = 0;

  /* An offer exists when the level is out of band, with a dose and a return. */
  const step = (caTarget - caStart) / 10;
  const before = build([caStart, caStart, caStart + 1, caStart, caStart]);
  const offer = before.correctionOffers.calcium && before.correctionOffers.calcium.steady;
  if (!offer || !offer.possible) { console.log('  FAIL no correction offered for calcium at 400'); bad++; }
  else {
    if (!(offer.dose > 12)) { console.log('  FAIL the offered dose does not raise calcium'); bad++; }
    if (offer.returnDose == null) { console.log('  FAIL no maintenance dose to return to'); bad++; }
  }

  /* While running, every surface says it is a plan — and none of them
     recommends changing the dose, which would undo it. */
  const running = build([caStart, caStart + step * 2, caStart + step * 4,
    caStart + step * 5, caStart + step * 6], { calcium: plan }, 28);
  const rw = running.doseStates.find((d) => d.key === 'calcium');
  if (!rw || rw.state !== 'correcting-dose') { console.log(`  FAIL running plan gave "${rw && rw.state}"`); bad++; }
  const rsaid = running.briefing.filter((c) => c.goto && c.goto.key === 'calcium')
    .map((c) => c.claim).join(' | ');
  if (!/on its way to/.test(rsaid)) { console.log('  FAIL summary silent about the plan'); bad++; }
  if (/dose could change/.test(rsaid)) { console.log('  FAIL summary recommends changing the dose mid-plan'); bad++; }

  /* Arrival needs two readings inside the band, then offers the return dose. */
  const arrived = build([caStart, caStart + step * 2, caStart + step * 4, caStart + step * 6,
    caStart + step * 8, caTarget, caTarget + 2], { calcium: plan }, 28);
  const aw = arrived.doseStates.find((d) => d.key === 'calcium');
  if (!aw || aw.state !== 'correction-done') { console.log(`  FAIL arrival gave "${aw && aw.state}"`); bad++; }
  else if (aw.returnDose == null) { console.log('  FAIL arrival does not name the dose to return to'); bad++; }
  /* One reading inside the band is not enough — it can be a bad endpoint. */
  /* Exactly one reading inside the band: the one before it must still be
     outside, or two consecutive in-band readings confirm arrival and the test
     is checking the wrong thing. */
  const oneOnly = build([caStart, caStart + step * 2, caStart + step * 4,
    caBand.min - 6, caBand.min - 3, caBand.min + 1], { calcium: plan }, 28);
  const ow = oneOnly.doseStates.find((d) => d.key === 'calcium');
  if (ow && ow.state === 'correction-done') { console.log('  FAIL declared arrival on a single reading'); bad++; }

  /* Cancelling leaves nothing behind. */
  const cancelled = build([caStart, caStart + step * 2, caStart + step * 4,
    caStart + step * 5, caStart + step * 6], {}, 12);
  const csaid = cancelled.briefing.map((c) => c.claim + ' ' + (c.support || '')).join(' ');
  if (/on its way to|correction/i.test(csaid)) {
    console.log(`  FAIL a claim survived the cancel: "${csaid.slice(0, 80)}"`); bad++;
  }

  console.log(`  correction plan lifecycle: offer -> running -> arrived -> cancel, ${bad} failures`);
  if (bad) process.exit(1);
}

/* A correction must stop pushing, not run until something confirms it.
 *
 * With only "two readings inside the band" as the stop condition, calcium
 * entered its range on a Monday, the next weekly test was seven days later,
 * and the elevated dose ran the whole week between — 515 ppm against a 500
 * ceiling. Alkalinity ran to zero on a downward correction the same way.
 * Confirmation decides when to say "done"; passing the target, and the
 * estimate running out, decide when to stop pushing.
 */
{
  const akDef6 = L.PARAM_DEFS.find((d) => d.key === 'alkalinity');
  const T13 = L.todayStr();
  const S13 = { ...L.DEFAULT_SETTINGS, ...TANK_STRENGTHS, volumeL: 77, dkhPerMlPer100L: 0.0533, dailyDoseMl: 12.6 };
  const mk = (offset, vals) => vals.map((v, i) =>
    ({ param: 'alkalinity', date: L.addDays(T13, offset + i), time: '20:00', value: v }));
  const planAt = (offset, days) => ({ alkalinity: { target: 9.0, returnDose: 9,
    startedAt: L.addDays(T13, offset), startValue: 8.0, pace: 'steady', dose: 12.6, days } });
  const stateFor = (offset, vals, days) => {
    const a = L.assessAlkalinity({ readings: mk(offset, vals),
      doseLog: [{ element: 'alkalinity', date: L.addDays(T13, offset), time: '21:00', ml: 12.6 }],
      waterChanges: [], corrections: [], settings: S13, def: akDef6,
      correctionPlans: planAt(offset, days) });
    return L.doseStatus(a, akDef6, T13, S13);
  };
  let bad = 0;
  const expect = (label, st, want) => {
    if (!st) { console.log(`  FAIL ${label}: no status`); bad++; return; }
    if (st.state !== want) { console.log(`  FAIL ${label}: got "${st.state}", wanted "${want}"`); bad++; }
  };

  expect('a plan started today', stateFor(0, [8.0, 8.0], 4), 'correcting-dose');
  expect('one day in and moving', stateFor(-1, [8.0, 8.25], 4), 'correcting-dose');
  /* Passing the target stops the push even on a single reading. */
  expect('passed the target', stateFor(-2, [8.0, 8.5, 9.1], 4), 'correction-done');
  /* Three days with no movement is not the plan working. */
  expect('not moving at all', stateFor(-3, [8.0, 8.0, 8.0, 8.0], 4), 'correction-stalled');
  /* The estimate has run out and nothing confirms where it got to. */
  expect('estimate ran out', stateFor(-5, [8.0, 8.1, 8.15, 8.2, 8.2, 8.25], 4), 'correction-due');

  /* Every one of these states must name the dose to go back to, or the keeper
     is told to stop with no figure to stop at. */
  for (const [label, st] of [
    ['passed', stateFor(-2, [8.0, 8.5, 9.1], 4)],
    ['stalled', stateFor(-3, [8.0, 8.0, 8.0, 8.0], 4)],
    ['due', stateFor(-5, [8.0, 8.1, 8.15, 8.2, 8.2, 8.25], 4)],
  ]) {
    if (st && st.returnDose == null && !/9(\.0)? mL/.test(st.detail || '')) {
      console.log(`  FAIL ${label} does not name the dose to return to`); bad++;
    }
  }
  console.log(`  correction stop conditions: 5 states, ${bad} failures`);
  if (bad) process.exit(1);
}

/* The correction panel must open on a pace that works.
 *
 * Defaulting to "steady" showed calcium at 530 a flat refusal — bringing it
 * down that fast would mean dosing less than nothing — while its gentle option
 * would have brought it back in a fortnight. A working answer was hidden
 * behind a fixed preference.
 */
{
  const caDef2 = L.PARAM_DEFS.find((d) => d.key === 'calcium');
  const T14 = L.todayStr();
  const S14 = { ...L.DEFAULT_SETTINGS, ...TANK_STRENGTHS, volumeL: 77, caPpmPerMlPer100L: 0.36, calciumDoseMl: 9 };
  const at = (v) => {
    const r = [];
    for (let j = 8; j > 0; j--) r.push({ param: 'calcium', date: L.addDays(T14, -j * 2), time: '20:00', value: v });
    return L.assessCalcium({ readings: r, doseLog: [], waterChanges: [], corrections: [],
      settings: S14, def: caDef2 });
  };
  let bad = 0;
  /* Levels expressed relative to the band. Fixed numbers broke when calcium's
     band was corrected from 450-500 to the consensus 400-450: 400 became the
     floor rather than "well below", and 470 landed outside rather than inside. */
  const bw = caDef2.max - caDef2.min;
  for (const [label, level, wantSome] of [
    ['well above the band', caDef2.max + bw * 1.6, true],
    ['well below the band', caDef2.min - bw * 1.0, true],
    ['inside the band', (caDef2.min + caDef2.max) / 2, false],
  ]) {
    const a = at(level);
    const offers = ['gentle', 'steady', 'quick'].map((p) => L.proposeCorrection(a, caDef2, S14, p));
    const workable = offers.filter((o) => o && o.possible);
    if (wantSome && !workable.length) { console.log(`  FAIL ${label}: no workable pace at all`); bad++; }
    if (!wantSome && workable.length) { console.log(`  FAIL ${label}: offered a correction in band`); bad++; }
    /* Every refusal must explain itself and never leak internals. */
    for (const o of offers) {
      if (!o || o.possible) continue;
      if (!o.why || /undefined|NaN|Infinity/.test(o.why)) { console.log(`  FAIL ${label}: bad refusal text`); bad++; }
    }
    /* A workable pace must move the dose the right way. */
    for (const o of workable) {
      const up = level < caDef2.min;
      if (up && !(o.dose > a.currentDose)) { console.log(`  FAIL ${label}: raising offer does not raise the dose`); bad++; }
      if (!up && !(o.dose < a.currentDose)) { console.log(`  FAIL ${label}: lowering offer does not lower the dose`); bad++; }
      if (o.dose < 0) { console.log(`  FAIL ${label}: negative dose offered`); bad++; }
    }
  }
  console.log(`  correction pace selection: 3 levels x 3 paces, ${bad} failures`);
  if (bad) process.exit(1);
}

/* A one-off correction has to be pourable.
 *
 * Magnesium at 1330 was told to add 4,652 mL of a solution normally dosed 8 mL
 * a day. The arithmetic is right and the advice is useless. The correction
 * planner already knew when the maintenance solution is the wrong tool; this
 * older path did not, so the same tank got sensible advice in one place and
 * nonsense in another.
 */
{
  const T15 = L.todayStr();
  const CASES = [
    /* Levels relative to each band. 1330 was below magnesium's old 1450-1500
       and sits inside the corrected 1250-1400, so it had nothing to refuse. */
    ['magnesium', { mgPpmPerMlPer100L: 0.024, magDoseMl: 8 }, 'below', L.assessMagnesium, false],
    ['calcium', { caPpmPerMlPer100L: 0.36, calciumDoseMl: 12 }, 'below', L.assessCalcium, true],
    ['alkalinity', { dkhPerMlPer100L: 0.0533, dailyDoseMl: 9 }, 'below', L.assessAlkalinity, true],
  ];
  let bad = 0;
  for (const [key, extra, where, fn, pourable] of CASES) {
    const def = L.PARAM_DEFS.find((d) => d.key === key);
    /* Below the band but still inside the safe bounds. A level outside those
       is an emergency and reports as one, which outranks any discussion of
       which product to use — correctly, but it is not what this test is
       asking about. */
    const sb = L.SAFE_BOUNDS[key] || { min: -Infinity, max: Infinity };
    const level = where === 'below'
      ? Math.max(sb.min + (def.min - sb.min) * 0.3, def.min - (def.max - def.min))
      : Math.min(sb.max - (sb.max - def.max) * 0.3, def.max + (def.max - def.min));
    const S15 = { ...L.DEFAULT_SETTINGS, ...TANK_STRENGTHS, volumeL: 77, ...extra };
    const readings = [];
    for (let j = 8; j > 0; j--) readings.push({ param: key, date: L.addDays(T15, -j * 2), time: '20:00', value: level });
    const a = fn({ readings, doseLog: [], waterChanges: [], corrections: [], settings: S15,
      def, correctionPlans: {} });
    const st = L.doseStatus(a, def, T15, S15);
    if (!st) { console.log(`  FAIL ${key}: no status`); bad++; continue; }
    const text = `${st.headline} ${st.detail}`;

    /* Any millilitre figure quoted as an action must be within reach of the
       solution it names. */
    const m = /about ([\d,]+(?:\.\d+)?) mL/.exec(text);
    const normal = a.maintenanceDose != null ? a.maintenanceDose : a.currentDose;
    if (m && pourable) {
      const ml = parseFloat(m[1].replace(/,/g, ''));
      if (normal > 0 && ml > normal * 25) {
        console.log(`  FAIL ${key}: quotes ${ml} mL against a normal ${normal.toFixed(1)} mL`); bad++;
      }
    }
    if (!pourable) {
      if (/one-off correction of about/.test(text)) {
        console.log(`  FAIL ${key}: still offers an unpourable one-off`); bad++;
      }
      if (!/supplement|dry salt|water change/i.test(text)) {
        console.log(`  FAIL ${key}: refuses without naming a route that works`); bad++;
      }
    }
  }
  console.log(`  one-off corrections are pourable: 3 elements, ${bad} failures`);
  if (bad) process.exit(1);
}

/* A correction must not run unattended for ever.
 *
 * The elevated dose keeps running until someone next opens the app, and the
 * progress checks all depended on a reading arriving. With none, the engine
 * returned early and every time check went uncomputed — a three-day plan still
 * read "on its way to 9.0dKH" forty days later, by which point the same dose
 * would have carried alkalinity past 13. The app was cheerfully reporting
 * progress on a correction that had long since become an overdose.
 *
 * The clock is the one thing knowable without a test, so it is now checked
 * whether or not anything has been measured.
 */
{
  const akDef7 = L.PARAM_DEFS.find((d) => d.key === 'alkalinity');
  const T17 = L.todayStr();
  const S17 = { ...L.DEFAULT_SETTINGS, ...TANK_STRENGTHS, volumeL: 77, dkhPerMlPer100L: 0.0533, dailyDoseMl: 8.7 };
  const unattended = (age) => {
    const readings = [];
    for (let j = 4; j > 0; j--) readings.push({ param: 'alkalinity', date: L.addDays(T17, -age - j), time: '20:00', value: 8.35 });
    const a = L.assessAlkalinity({ readings,
      doseLog: [{ element: 'alkalinity', date: L.addDays(T17, -age), time: '21:00', ml: 8.7 }],
      waterChanges: [], corrections: [], settings: S17, def: akDef7,
      correctionPlans: { alkalinity: { target: 9.0, returnDose: 5.1, startedAt: L.addDays(T17, -age),
        startValue: 8.35, pace: 'steady', dose: 8.7, days: 3 } } });
    return L.doseStatus(a, akDef7, T17, S17);
  };
  let bad = 0;
  /* Inside the estimate it is still running; past it, it is not. */
  const cases = [[1, 'correcting-dose'], [3, 'correction-due'], [7, 'correction-due'],
    [14, 'correction-stalled'], [40, 'correction-stalled']];
  for (const [age, want] of cases) {
    const st = unattended(age);
    if (!st) { console.log(`  FAIL day ${age}: no status`); bad++; continue; }
    if (st.state !== want) {
      console.log(`  FAIL day ${age}: got "${st.state}", wanted "${want}"`); bad++;
    }
    const text = `${st.headline} ${st.detail}`;
    /* It must never quote a level it does not have. */
    if (/undefined|NaN|Infinity|is at —|is at null/.test(text)) {
      console.log(`  FAIL day ${age}: quotes a level it does not have`); bad++;
    }
    /* And past the estimate it must name the dose to go back to. */
    if (age >= 3 && !/5\.10 mL/.test(text)) {
      console.log(`  FAIL day ${age}: does not name the dose to return to`); bad++;
    }
  }
  console.log(`  unattended corrections: ${cases.length} ages, ${bad} failures`);
  if (bad) process.exit(1);
}

/* A correction must never hand back a stale dose.
 *
 * This is the property the whole of stage 5 came from. Every symptom — calcium
 * stopped at zero, alkalinity 65% over, magnesium 55% under — was the same
 * thing: the daily dose left wherever the last plan put it. A plan records the
 * dose to return to when it starts, and if it runs while demand grows, that
 * figure sends the keeper back to a dose too small to hold the level, which
 * falls straight out again and starts another plan.
 *
 * The dose to return to is now recomputed from what the tank uses today, with
 * the stored figure kept only as a sanity floor.
 */
{
  const akDef8 = L.PARAM_DEFS.find((d) => d.key === 'alkalinity');
  const T18 = L.todayStr();
  const S18 = { ...L.DEFAULT_SETTINGS, ...TANK_STRENGTHS, volumeL: 77, dkhPerMlPer100L: 0.0533, dailyDoseMl: 8.7 };
  let bad = 0, checked = 0;

  /* A plan that has been running while demand climbed. */
  for (const [label, staleReturn, climb] of [
    ['demand grew a lot', 5.1, 0.06],
    ['demand grew a little', 7.9, 0.02],
    ['demand unchanged', 8.7, 0.0],
  ]) {
    const readings = [];
    for (let j = 10; j > 0; j--) {
      readings.push({ param: 'alkalinity', date: L.addDays(T18, -j * 2), time: '20:00',
        value: 8.3 + climb * (10 - j) });
    }
    const a = L.assessAlkalinity({ readings,
      doseLog: [{ element: 'alkalinity', date: L.addDays(T18, -20), time: '21:00', ml: 8.7 }],
      waterChanges: [], corrections: [], settings: S18, def: akDef8,
      correctionPlans: { alkalinity: { target: 9.0, returnDose: staleReturn,
        startedAt: L.addDays(T18, -20), startValue: 8.3, pace: 'steady', dose: 8.7, days: 3 } } });
    const cp = a.correctionPlan;
    checked++;
    if (!cp) { console.log(`  FAIL ${label}: no plan progress`); bad++; continue; }
    if (a.maintenanceDose == null) continue;
    /* The figure handed back must be what the tank uses now, not what it used
       when the plan began. */
    const off = Math.abs(cp.returnDose - a.maintenanceDose) / a.maintenanceDose;
    if (off > 0.12) {
      console.log(`  FAIL ${label}: returns to ${cp.returnDose} against a demand of ${a.maintenanceDose.toFixed(2)}`);
      bad++;
    }
  }

  /* And it must not follow an absurd figure off a cliff — the stored value is
     the safer answer when the fresh one is implausible. */
  const wild = L.assessAlkalinity({
    readings: [{ param: 'alkalinity', date: L.addDays(T18, -4), time: '20:00', value: 9.0 },
               { param: 'alkalinity', date: L.addDays(T18, -2), time: '20:00', value: 9.0 },
               { param: 'alkalinity', date: T18, time: '20:00', value: 2.0 }],
    doseLog: [{ element: 'alkalinity', date: L.addDays(T18, -20), time: '21:00', ml: 8.7 }],
    waterChanges: [], corrections: [], settings: S18, def: akDef8,
    correctionPlans: { alkalinity: { target: 9.0, returnDose: 8.7, startedAt: L.addDays(T18, -20),
      startValue: 8.3, pace: 'steady', dose: 8.7, days: 3 } } });
  checked++;
  if (wild.correctionPlan && wild.correctionPlan.returnDose > 8.7 * 6) {
    console.log(`  FAIL a wild reading dragged the return dose to ${wild.correctionPlan.returnDose}`);
    bad++;
  }
  console.log(`  return dose tracks demand: ${checked} cases, ${bad} failures`);
  if (bad) process.exit(1);
}

/* The summary and the Dosing Wizard must agree on how bad it is.
 *
 * wordingcheck.py enforces that a dose claim repeats the engine's headline, but
 * the summary reaches a level through findings too, and those are its own
 * voice. That left a gap it could not see: at 5.0 dKH the wizard said
 * "dangerously low" while the summary said "a long way below range" — the same
 * fact in two registers, and the softer one is where most people look first.
 * It also read identically at 6.5 and at 3.0.
 */
{
  const akDefX = L.PARAM_DEFS.find((d) => d.key === 'alkalinity');
  const TX = L.todayStr();
  const SX = { ...L.DEFAULT_SETTINGS, ...TANK_STRENGTHS, volumeL: 77, dkhPerMlPer100L: 0.0533, dailyDoseMl: 9 };
  let bad = 0, checked = 0;

  const tank = (v) => {
    const r = [];
    for (let j = 8; j > 0; j--) r.push({ param: 'alkalinity', date: L.addDays(TX, -j * 2), time: '20:00', value: v });
    for (const d of L.PARAM_DEFS) {
      if (d.key === 'alkalinity' || d.key === 'ammonia') continue;
      for (let j = 8; j > 0; j--) r.push({ param: d.key, date: L.addDays(TX, -j * 2), time: '20:00', value: (d.min + d.max) / 2 });
    }
    return L.deriveTankState({ readings: r, icps: [], paramDefs: L.PARAM_DEFS, settings: SX });
  };

  const safe = L.SAFE_BOUNDS.alkalinity;
  for (const v of [7.5, 8.0, 6.5, 5.0, 3.0, 10.5, 11.5, 13]) {
    checked++;
    const st = tank(v);
    const wizard = st.doseStates.find((d) => d.key === 'alkalinity');
    const claim = st.briefing.find((c) => /alkalinity/i.test(c.id));
    if (!wizard) { console.log(`  FAIL ${v}: no wizard state`); bad++; continue; }
    const dangerous = v < safe.min || v > safe.max;
    const wizardSaysDanger = /dangerous/i.test(wizard.headline);
    if (dangerous !== wizardSaysDanger) {
      console.log(`  FAIL ${v}: unsafe=${dangerous} but the wizard says "${wizard.headline}"`);
      bad++;
    }
    /* If the wizard calls it dangerous, the summary must not be gentler. */
    if (wizardSaysDanger && claim && !/dangerous/i.test(claim.claim)) {
      console.log(`  FAIL ${v}: wizard "${wizard.headline}" but summary "${claim.claim}"`);
      bad++;
    }
    /* And a dangerous level must name the figure, not just judge it. */
    if (wizardSaysDanger && claim && !new RegExp(String(v).replace('.', '\\.')).test(claim.claim)) {
      console.log(`  FAIL ${v}: the summary judges without naming the level — "${claim.claim}"`);
      bad++;
    }
  }
  console.log(`  summary and wizard agree on severity: ${checked} levels, ${bad} failures`);
  if (bad) process.exit(1);
}

/* A correction must not be proposed on a reading that predates the last one.
 *
 * Calcium is tested weekly and a correction takes days to show up, so the
 * reading that prompted one is often still the newest when it finishes. The
 * app would then look at a level that predated its own intervention and offer
 * to do the whole thing again. Over three simulated years that drove calcium
 * from 403 to 498, with plans starting two days apart and the dose swinging
 * 9.2 -> 52 -> 9.2.
 *
 * Asserted directly, because the three-year simulation does NOT catch it:
 * removing the guard still passes years.js. A property this specific needs a
 * test that names it.
 */
{
  const caDef = L.PARAM_DEFS.find((d) => d.key === 'calcium');
  const TS = L.todayStr();
  const SS = { ...L.DEFAULT_SETTINGS, ...TANK_STRENGTHS, volumeL: 77, caPpmPerMlPer100L: 0.36, calciumDoseMl: 9.2 };
  let bad = 0, checked = 0;

  const assess = ({ readingAge, correctionAge = null, planAge = null, doseChangeAge = null }) => {
    const readings = [];
    for (let j = 6; j > 0; j--) {
      readings.push({ param: 'calcium', date: L.addDays(TS, -(j * 7 + readingAge)), time: '20:00', value: 399 + j });
    }
    readings.push({ param: 'calcium', date: L.addDays(TS, -readingAge), time: '20:00', value: 399 });
    return L.assessCalcium({
      readings,
      doseLog: doseChangeAge != null
        ? [{ element: 'calcium', date: L.addDays(TS, -doseChangeAge), time: '21:00', ml: 60 }] : [],
      waterChanges: [],
      corrections: correctionAge != null
        ? [{ id: 'c', element: 'calcium', date: L.addDays(TS, -correctionAge), time: '12:00', ml: 120, direction: 'up' }] : [],
      settings: SS, def: caDef,
      correctionPlans: planAge != null
        ? { calcium: { target: 425, returnDose: 9.2, startedAt: L.addDays(TS, -planAge),
            startValue: 399, pace: 'steady', dose: 60, days: 2 } } : {},
    });
  };

  const offered = (a) => ['gentle', 'steady', 'quick']
    .some((p) => { const o = L.proposeCorrection(a, caDef, SS, p); return o && o.possible; });

  const CASES = [
    /* label, setup, may a correction be offered? */
    ['nothing has happened yet', { readingAge: 4 }, true],
    ['a correction was logged AFTER the reading', { readingAge: 4, correctionAge: 3 }, false],
    ['a correction was logged BEFORE the reading', { readingAge: 1, correctionAge: 5 }, true],
    ['a plan started AFTER the reading', { readingAge: 4, planAge: 2 }, false],
    ['a plan started BEFORE the reading', { readingAge: 1, planAge: 6 }, true],
    ['the dose changed AFTER the reading', { readingAge: 4, doseChangeAge: 2 }, false],
    ['the dose changed BEFORE the reading', { readingAge: 1, doseChangeAge: 6 }, true],
    ['everything long finished', { readingAge: 1, correctionAge: 40, planAge: 60, doseChangeAge: 50 }, true],
  ];

  for (const [label, setup, mayOffer] of CASES) {
    checked++;
    const got = offered(assess(setup));
    if (got !== mayOffer) {
      console.log(`  FAIL ${label}: correction ${got ? 'offered' : 'withheld'}, expected ${mayOffer ? 'offered' : 'withheld'}`);
      bad++;
    }
  }
  console.log(`  no correction on a stale reading: ${checked} cases, ${bad} failures`);
  if (bad) process.exit(1);
}

/* A correction must not be proposed on a reading that predates it.
 *
 * Calcium is tested weekly and a correction takes days to show up, so the
 * reading that prompted one is often still the newest when it finishes. The
 * app would then look at a level that predated its own intervention and offer
 * to do the whole thing again.
 *
 * Over three simulated years this drove calcium 403 -> 498, with plans starting
 * two days apart and the dose swinging 9.2 -> 52 -> 9.2. A 120 mL correction
 * delivering 56 ppm would be in flight, the last reading would still say 399,
 * and all three paces offered another.
 *
 * Asserted directly rather than left to the simulation: removing the guard did
 * NOT fail the three-year runs, because the harness's own plan bookkeeping
 * masked it. A fix the suite cannot prove is a fix on trust.
 */
{
  const caDef = L.PARAM_DEFS.find((d) => d.key === 'calcium');
  const TC = L.todayStr();
  const SC = { ...L.DEFAULT_SETTINGS, ...TANK_STRENGTHS, volumeL: 77, caPpmPerMlPer100L: 0.36, calciumDoseMl: 9.2 };
  let bad = 0, checked = 0;

  const assess = ({ readingAge, correctionAge = null, planAge = null, doseChangeAge = null }) => {
    const readings = [];
    for (let j = 6; j > 0; j--) {
      readings.push({ param: 'calcium', date: L.addDays(TC, -(j * 7 + readingAge)), time: '20:00', value: 399 });
    }
    readings.push({ param: 'calcium', date: L.addDays(TC, -readingAge), time: '20:00', value: 399 });
    return L.assessCalcium({
      readings,
      doseLog: doseChangeAge != null
        ? [{ element: 'calcium', date: L.addDays(TC, -doseChangeAge), time: '21:00', ml: 30 }] : [],
      waterChanges: [],
      corrections: correctionAge != null
        ? [{ id: 'c', element: 'calcium', date: L.addDays(TC, -correctionAge), time: '12:00', ml: 120, direction: 'up' }] : [],
      settings: SC, def: caDef,
      correctionPlans: planAge != null
        ? { calcium: { target: 425, returnDose: 9.2, startedAt: L.addDays(TC, -planAge),
            startValue: 399, pace: 'steady', dose: 63, days: 2 } } : {},
    });
  };

  const CASES = [
    ['nothing has happened yet', { readingAge: 4 }, true],
    ['a correction logged AFTER the reading', { readingAge: 4, correctionAge: 3 }, false],
    ['a correction logged BEFORE the reading', { readingAge: 1, correctionAge: 3 }, true],
    ['a plan started AFTER the reading', { readingAge: 4, planAge: 3 }, false],
    ['a plan started BEFORE the reading', { readingAge: 1, planAge: 3 }, true],
    ['a dose change AFTER the reading', { readingAge: 4, doseChangeAge: 3 }, false],
    ['a dose change BEFORE the reading', { readingAge: 1, doseChangeAge: 3 }, true],
    ['an old correction, fresh reading', { readingAge: 1, correctionAge: 40 }, true],
  ];

  for (const [label, setup, shouldOffer] of CASES) {
    const a = assess(setup);
    for (const pace of ['gentle', 'steady', 'quick']) {
      checked++;
      const offer = L.proposeCorrection(a, caDef, SC, pace);
      const offered = !!(offer && offer.possible);
      if (offered !== shouldOffer) {
        console.log(`  FAIL ${label} (${pace}): ${offered ? 'offered a correction' : 'refused'} when it should have ${shouldOffer ? 'offered' : 'refused'}`);
        bad++;
      }
    }
  }
  console.log(`  corrections wait for a fresh reading: ${checked} checks, ${bad} failures`);
  if (bad) process.exit(1);
}
