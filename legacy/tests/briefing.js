/* The briefing replaced the prose assessment, so it is now the only thing on
 * the dashboard that says what the tank is doing. It is generated text over
 * randomised inputs, which is exactly where grammar breaks: a plural verb on a
 * single item, a support line starting mid-sentence because it was lifted from
 * a longer explanation, a claim about an element that a dose claim already
 * covered.
 */
const path = require('path');
const L = require(path.join(__dirname, '..', 'build', 'engines.js'));

const T = L.todayStr();
const defs = L.PARAM_DEFS;
let rnd = 424242;
const rand = () => { rnd = (rnd * 1103515245 + 12345) % 2147483648; return rnd / 2147483648; };
const pick = (a) => a[Math.floor(rand() * a.length)];

const problems = {};
const note = (k, d) => { (problems[k] = problems[k] || []).push(d); };

const RUNS = Number(process.env.BRIEFING_RUNS || 900);
let claimsSeen = 0, withGoto = 0, wordTotal = 0;

for (let i = 0; i < RUNS; i++) {
  const readings = [];
  for (const def of defs) {
    if (rand() < 0.12) continue;                       /* sometimes untested */
    const n = 1 + Math.floor(rand() * 12);
    const width = def.max - def.min;
    const base = def.min + width * (rand() * 2.2 - 0.6);   /* in, under, over */
    const drift = (rand() - 0.5) * width * pick([0, 0.2, 1.2]);
    for (let j = n; j > 0; j--) {
      readings.push({ param: def.key, date: L.addDays(T, -j * pick([1, 2, 3, 7])),
        time: '20:00',
        value: Math.round((base + drift * ((n - j) / n) + (rand() - 0.5) * width * 0.15) * 1000) / 1000 });
    }
  }
  const latest = {};
  for (const d of defs) {
    const r = readings.filter((x) => x.param === d.key).sort((a, b) => (a.date < b.date ? 1 : -1));
    latest[d.key] = r[0] || null;
  }
  const settings = { ...L.DEFAULT_SETTINGS, volumeL: pick([20, 77, 200, 800]) };
  let findings = [], states = [];
  try {
    findings = L.buildFindings({ readings, icps: [], paramDefs: defs, settings,
      doseLog: [], waterChanges: [], latestByParam: latest }).findings;
    for (const k of ['alkalinity', 'calcium', 'magnesium']) {
      const def = defs.find((d) => d.key === k);
      const fn = k === 'alkalinity' ? L.assessAlkalinity : k === 'calcium' ? L.assessCalcium : L.assessMagnesium;
      const a = fn({ readings, doseLog: [], waterChanges: [], corrections: [], settings, def });
      const st = L.doseStatus(a, def);
      if (st) states.push({ ...st, key: k, el: def.label.toLowerCase() });
    }
  } catch (e) { note('setup threw', e.message); continue; }

  let claims;
  try { claims = L.buildBriefing(readings, latest, defs, findings, states, {}); }
  catch (e) { note('buildBriefing threw', e.message); continue; }

  /* Every finding belongs in the summary. A finding raised on a parameter
     card but absent from the box is exactly the split this change removed. */
  const shown = new Set(claims.map((c) => c.id));
  for (const f of findings) {
    if (shown.has('finding:' + f.id)) continue;
    /* An info-level note about an element the summary already speaks for is
       folded in deliberately — "alkalinity is tested rarely" beneath an
       alkalinity dose claim is the box repeating itself. Anything at watch or
       act, and anything about an element with no other claim, must still
       appear: that is the split this assertion was written to catch. */
    const els = f.params || [];
    const spokenFor = els.length > 0 && els.every((el) =>
      claims.some((c) => (c.goto && c.goto.key === el) || c.id === 'dose:' + el));
    if (f.severity === 'info' && spokenFor) continue;
    note('finding missing from summary', `${f.severity} ${f.id} [${els.join('+')}]`);
  }

  const elements = [];
  for (const c of claims) {
    claimsSeen++;
    if (c.goto) withGoto++;
    const text = c.claim + ' ' + (c.support || '');
    wordTotal += text.split(/\s+/).length;

    if (/undefined|NaN|Infinity|\[object/.test(text)) note('broken text', text.slice(0, 70));
    /* "pH" is correctly lower-case first — the parameter is named that way,
       and forcing a capital would be wrong. */
    if (!/^[A-Z0-9]/.test(c.claim) && !/^pH\b/.test(c.claim)) note('claim not capitalised', c.claim.slice(0, 50));
    /* "pH" is spelt with a lower-case p; capitalising it would be the error.
       Any word whose second letter is already capital is left as written. */
    if (c.support && !/^[A-Z0-9"]/.test(c.support) && !/^[a-z][A-Z]/.test(c.support)) {
      note('support not capitalised', c.support.slice(0, 50));
    }
    if (c.support && !/[.!?]$/.test(c.support.trim())) note('support unpunctuated', c.support.slice(-40));
    if (c.claim.split(/\s+/).length > 11) note('claim too long', c.claim);
    if (/\bare\b/.test(c.claim) && /^(\w+) is\b/.test(c.claim)) note('mixed number', c.claim);

    if (c.goto) {
      if (!['param', 'dosing', 'log'].includes(c.goto.tab)) note('unknown destination', c.goto.tab);
      if (c.goto.tab === 'param' && !defs.find((d) => d.key === c.goto.key)) note('destination has no parameter', String(c.goto.key));
    }
    if (c.strip && !defs.find((d) => d.key === c.strip.key)) note('strip has no parameter', String(c.strip.key));
    /* A strip that cannot draw is worse than none: it renders an empty gap. */
    if (c.strip) {
      const st = L.computeStability(defs.find((d) => d.key === c.strip.key), readings);
      if (!st || st.p05 == null || st.p95 == null) note('strip would render nothing', c.strip.key);
    }
    const el = c.id.split(':')[1];
    if (el && defs.find((d) => d.key === el)) {
      if (elements.includes(el)) note('element claimed twice', el);
      elements.push(el);
    }
  }
  if (claims.length > 12) note('too many claims', String(claims.length));

  /* The headline claims things about the whole tank; verify it against the
     counts it was built from. */
  const ov = L.buildOverview(readings, latest, defs, findings, states);
  const h = ov.headline;
  const inR = defs.filter((d) => latest[d.key]).filter((d) => L.paramStatus(d, latest[d.key].value) === 'ok').length;
  const tracked = defs.filter((d) => {
    if (!latest[d.key]) return false;
    const st = L.computeStability(d, readings);
    return st && st.grade !== 'unknown';
  }).length;
  if (/undefined|NaN|\[object/.test(h)) note('headline broken', h);
  if (!/^[A-Z0-9]/.test(h) && !/^pH\b/.test(h)) note('headline not capitalised', h);
  if ((h.match(/\u2014/g) || []).length > 1) note('headline has two dashes', h);
  if (h.split(/\s+/).length > 18) note('headline too long', h);
  if (/^(Everything is in range|All in range)/.test(h) && tracked && inR < tracked) {
    note('headline claims all in range when they are not', h);
  }
  if (/everything else is in range and holding/.test(h) && tracked && inR < tracked - 1) {
    note('headline claims the rest is fine when it is not', h);
  }
}

const keys = Object.keys(problems);
console.log(`  briefing: ${RUNS} random tanks, ${claimsSeen} claims, ${(wordTotal / Math.max(1, RUNS)).toFixed(0)} words each, ${withGoto} navigable`);
for (const k of keys) {
  console.log(`    ${k}: ${problems[k].length}`);
  problems[k].slice(0, 3).forEach((d) => console.log(`      ${d}`));
}
if (keys.length) process.exit(1);

/* What may be put away, and what may not.
 *
 * Hiding is a snooze keyed to the numbers behind the claim, not a delete. Two
 * rules have to hold or the summary becomes unsafe: an urgent claim can never
 * be hidden, and a claim that needs an action the app can take you to should
 * not be hidden either — acting on it clears it, and hiding it just loses the
 * job. */
{
  const L2 = L;
  const T2 = L2.todayStr();
  const defs2 = L2.PARAM_DEFS;
  let bad = 0, checked = 0;

  const amDef = defs2.find((d) => d.key === 'ammonia');
  const readings = [{ param: 'ammonia', date: T2, time: '09:00', value: amDef.max + 1 }];
  for (const d of defs2) {
    if (d.key === 'ammonia') continue;
    for (let i = 6; i > 0; i--) {
      readings.push({ param: d.key, date: L2.addDays(T2, -i * 2), time: '20:00',
        value: (d.min + d.max) / 2 });
    }
  }
  const latest = {};
  for (const d of defs2) {
    const r = readings.filter((x) => x.param === d.key).sort((a, b) => (a.date < b.date ? 1 : -1));
    latest[d.key] = r[0] || null;
  }
  const f = L2.buildFindings({ readings, icps: [], paramDefs: defs2,
    settings: L2.DEFAULT_SETTINGS, doseLog: [], waterChanges: [], latestByParam: latest });
  const claims = L2.buildBriefing(readings, latest, defs2, f.findings, [], {});
  for (const c of claims) {
    checked++;
    /* Only acute chemistry hazards are protected. A calibration offset is
       serious but persistent, and refusing to let it be acknowledged left a
       permanent line in the summary that nothing could clear. */
    const acute = f.findings.some((x) => x.severity === 'act' && x.scope === 'chemistry'
      && c.id === 'finding:' + x.id);
    if (acute && c.dismissible) {
      console.log(`  FAIL acute hazard can be hidden: ${c.claim}`); bad++;
    }
    if (c.dismissible && !c.dismissKey) {
      console.log(`  FAIL hideable claim with no key: ${c.claim}`); bad++;
    }
  }
  /* A dose suggestion may be put off, but only until the next reading: the key
     carries the latest reading's timestamp, so logging a test brings it back.
     This is what stops "not now" becoming "never". */
  const states = [{ key: 'alkalinity', el: 'alkalinity', state: 'suggested',
    headline: 'Alkalinity dose could change', detail: 'It is falling.', short: '8 to 10' }];
  const dose = L2.buildBriefing(readings, latest, defs2, f.findings, states, {})
    .find((c) => c.id === 'dose:alkalinity');
  if (dose) {
    checked++;
    if (!dose.snoozeUntilTest) { console.log('  FAIL dose suggestion cannot be put off'); bad++; }
    if (!dose.dismissKey || dose.dismissKey.indexOf('|') < 0) {
      console.log('  FAIL dose snooze has no key'); bad++;
    }
    const hidden = { [dose.dismissKey]: { at: T2, sig: String(dose.dismissSignature || '') } };
    const still = L2.buildBriefing(readings, latest, defs2, f.findings, states, { dismissed: hidden })
      .some((c) => c.id === 'dose:alkalinity');
    if (still) { console.log('  FAIL "not now" did not hide the suggestion'); bad++; }

    /* A new reading must bring it back. */
    const later = readings.concat([{ param: 'alkalinity', date: L2.addDays(T2, 1), time: '20:00',
      value: latest.alkalinity ? latest.alkalinity.value : 8.6 }]);
    const l2 = { ...latest, alkalinity: later[later.length - 1] };
    const f3 = L2.buildFindings({ readings: later, icps: [], paramDefs: defs2,
      settings: L2.DEFAULT_SETTINGS, doseLog: [], waterChanges: [], latestByParam: l2 });
    const back = L2.buildBriefing(later, l2, defs2, f3.findings, states, { dismissed: hidden })
      .some((c) => c.id === 'dose:alkalinity');
    if (!back) { console.log('  FAIL suggestion did not return after the next test'); bad++; }
  }
  /* The count must equal what was actually put away. It used to be recomputed
     from a separately-built list, which disagreed whenever hiding one claim
     changed what another said. */
  {
    const live = L2.buildBriefing(readings, latest, defs2, f.findings, [], {});
    const hid = {};
    let expect = 0;
    for (const c of live.filter((x) => x.dismissible).slice(0, 3)) {
      hid[c.dismissKey] = { at: T2, sig: String(c.dismissSignature || '') }; expect++;
      const b = L2.buildBriefing(readings, latest, defs2, f.findings, [], { dismissed: hid });
      if ((b.hiddenCount || 0) !== expect) {
        console.log(`  FAIL hidden count ${b.hiddenCount}, expected ${expect}`); bad++;
      }
    }
  }
  console.log(`  dismissal rules: ${checked} claims, ${bad} violations`);
  if (bad) process.exit(1);
}

/* Counts in claims must describe the tank, not the leftovers.
 *
 * "N of M are in range and holding" took its numerator from the parameters not
 * already mentioned above while the denominator counted all of them — two
 * different populations, so a tank with five in range could read "2 of 7".
 */
{
  const T3 = L.todayStr();
  const defs3 = L.PARAM_DEFS;
  let rnd3 = 13579, bad = 0, checked = 0;
  const rand3 = () => { rnd3 = (rnd3 * 1103515245 + 12345) % 2147483648; return rnd3 / 2147483648; };

  for (let i = 0; i < 400; i++) {
    const readings = [];
    for (const d of defs3) {
      if (rand3() < 0.15) continue;
      const w = d.max - d.min;
      const base = d.min + w * (rand3() * 2.0 - 0.4);
      for (let j = 6; j > 0; j--) {
        readings.push({ param: d.key, date: L.addDays(T3, -j * 2), time: '20:00',
          value: Math.round((base + (rand3() - 0.5) * w * 0.3) * 1000) / 1000 });
      }
    }
    const latest = {};
    for (const d of defs3) {
      const r = readings.filter((x) => x.param === d.key).sort((a, b) => (a.date < b.date ? 1 : -1));
      latest[d.key] = r[0] || null;
    }
    const all = L.buildFindings({ readings, icps: [], paramDefs: defs3,
      settings: L.DEFAULT_SETTINGS, doseLog: [], waterChanges: [], latestByParam: latest }).findings;
    const claim = L.buildBriefing(readings, latest, defs3, all, [], {}).find((c) => c.id === 'solid');
    if (!claim) continue;
    checked++;

    /* Recount independently. A parameter with a live claim against its level
       is not "holding", even if it is inside the band and grades green today —
       something heading out of range is the obvious case. */
    const claimsAll = L.buildBriefing(readings, latest, defs3, all, [], {});
    const flagged = new Set();
    for (const c of claimsAll) {
      if (/^finding:(far-out-|heading-out-|salinity-off)/.test(c.id) && c.goto && c.goto.tab === 'param') {
        flagged.add(c.goto.key);
      }
      if (c.id.startsWith('drift:')) flagged.add(c.id.slice(6));
    }
    let tracked = 0, fine = 0;
    for (const d of defs3) {
      if (!latest[d.key]) continue;
      const stab = L.computeStability(d, readings);
      if (!stab || stab.grade === 'unknown') continue;
      tracked++;
      if (L.paramStatus(d, latest[d.key].value) === 'ok' && stab.grade === 'green'
        && !flagged.has(d.key)) fine++;
    }
    const m = claim.claim.match(/^(\d+) of (\d+)/);
    if (!m) { console.log(`  FAIL unparseable: ${claim.claim}`); bad++; continue; }
    if (Number(m[1]) !== fine) {
      console.log(`  FAIL claims ${m[1]} in range and holding, actually ${fine}`); bad++;
    }
    if (Number(m[2]) !== tracked) {
      console.log(`  FAIL denominator ${m[2]}, actually tracking ${tracked}`); bad++;
    }
    if (Number(m[1]) > Number(m[2])) { console.log(`  FAIL numerator exceeds denominator`); bad++; }

    /* Every parameter counted must also be named. Listing a subset and
       finishing with "and others noted above" left the reader to work out
       which ones were fine. */
    const listed = String(claim.support || '')
      .replace(/^Holding:\s*/, '').replace(/\.$/, '')
      .split(/,\s*|\s+and\s+/).map((x) => x.trim()).filter(Boolean);
    if (listed.length !== fine) {
      console.log(`  FAIL names ${listed.length} but counts ${fine}: ${claim.support}`); bad++;
    }
    if (/others|above/i.test(claim.support || '')) {
      console.log(`  FAIL support defers instead of naming: ${claim.support}`); bad++;
    }
  }
  console.log(`  claim counts: ${checked} tanks, ${bad} miscounts`);
  if (bad) process.exit(1);
}
