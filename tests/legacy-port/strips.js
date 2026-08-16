/* The stability strip renders nothing unless computeStability supplies the
 * percentile bounds. It shipped broken because every check passed: the claim
 * carried a strip, the component existed, and the component returned null.
 * Nothing in the suite could tell an empty strip from an absent one.
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
let fail = 0, checked = 0;

for (const def of L.PARAM_DEFS) {
  /* Enough readings, spread across the parameter's own window. */
  const rows = [];
  for (let i = 8; i >= 0; i--) {
    const drift = ((8 - i) / 8) * (def.max - def.min) * 0.4;
    rows.push({ param: def.key, date: L.addDays(T, -i * 2), time: '20:00',
      value: Math.round((def.min + (def.max - def.min) * 0.3 + drift) * 1000) / 1000 });
  }
  const stab = L.computeStability(def, rows);
  /* Some parameters have no stability rule on purpose — ammonia should read
     zero, so the spread of its readings means nothing. Those never draw a
     strip and are not a failure. */
  if (!stab) continue;
  checked++;
  for (const f of ['p05', 'p95', 'spread', 'readingCount']) {
    if (stab[f] == null) { console.log(`  FAIL ${def.key}: ${f} missing — strip would render nothing`); fail++; }
  }
  if (stab.p05 != null && stab.p95 != null && stab.p95 < stab.p05) {
    console.log(`  FAIL ${def.key}: p95 below p05`); fail++;
  }
}

console.log(`  stability bounds: ${checked} parameters, ${fail} failures`);
if (fail) process.exit(1);

/* The score breakdown must reproduce the score exactly, or it is a story about
 * the arithmetic rather than the arithmetic. Checked over random tanks because
 * the mean/weakest-link blend behaves differently as the spread of sub-scores
 * changes. */
{
  let rnd = 90210;
  const rand = () => { rnd = (rnd * 1103515245 + 12345) % 2147483648; return rnd / 2147483648; };
  let bad = 0, runs = 0;
  for (let i = 0; i < 400; i++) {
    const readings = [];
    for (const def of L.PARAM_DEFS) {
      if (rand() < 0.15) continue;
      const w = def.max - def.min;
      const base = def.min + w * (rand() * 2.0 - 0.5);
      for (let j = 6; j > 0; j--) {
        readings.push({ param: def.key, date: L.addDays(T, -j * 2), time: '20:00',
          value: Math.round((base + (rand() - 0.5) * w * rand() * 1.5) * 1000) / 1000 });
      }
    }
    const latest = {};
    for (const d of L.PARAM_DEFS) {
      const r = readings.filter((x) => x.param === d.key).sort((a, b) => (a.date < b.date ? 1 : -1));
      latest[d.key] = r[0] || null;
    }
    const f = L.buildFindings({ readings, icps: [], paramDefs: L.PARAM_DEFS,
      settings: { ...L.DEFAULT_SETTINGS, ...TANK_STRENGTHS }, doseLog: [], waterChanges: [], latestByParam: latest });
    const ov = L.buildOverview(readings, latest, L.PARAM_DEFS, f.findings, []);
    const ex = L.explainScore(readings, latest, L.PARAM_DEFS, ov.score);
    if (!ex) continue;
    runs++;
    /* The displayed figure must reproduce the score. Previously `capped` was
       inferred from a mismatch, so this check could never fail — any drift
       simply set the flag and printed a false warning about ammonia. It is now
       decided by ammonia itself, which is what exposed the evidence cap the
       explanation had been leaving out. */
    /* Two ceilings can hold the score down: how little data supports it, and
       any parameter outside what the hobby treats as workable. The working
       must account for both or the stated arithmetic lands above the number on
       the card — the exact complaint the breakdown exists to answer. */
    const caps = [ex.evidenceCap, ex.safetyCap].filter((v) => v != null);
    const shown = ex.capped ? null
      : (caps.length ? Math.min(ex.blended, ...caps) : ex.blended);
    if (shown != null && Math.abs(shown - ov.score) > 1) {
      console.log(`  FAIL breakdown shows ${shown}, score is ${ov.score}`); bad++;
    }
    const ammonia = latest.ammonia;
    if (ex.capped && !(ammonia && ammonia.value > 0.005)) {
      console.log('  FAIL ammonia warning shown with no ammonia reading'); bad++;
    }
    const mean = Math.round((ex.parts.reduce((a, p) => a + p.raw, 0) / ex.parts.length) * 100);
    if (mean !== ex.mean) { console.log('  FAIL average line does not match its own rows'); bad++; }
    if (ex.worst !== Math.round(Math.min(...ex.parts.map((p) => p.raw)) * 100)) {
      console.log('  FAIL weakest link wrong'); bad++;
    }
    /* Each bar must reflect the thing it draws, and the sub-score must be the
       weighted blend of its own two bars — otherwise the picture and the
       number disagree on the same row. */
    for (const p of ex.parts) {
      const d = L.PARAM_DEFS.find((x) => x.key === p.key);
      const st = L.paramStatus(d, latest[p.key].value);
      const stab = L.computeStability(d, readings);
      const wantStab = !stab ? 70 : stab.grade === 'green' ? 100
        : stab.grade === 'amber' ? 55 : stab.grade === 'red' ? 15 : 70;
      if (p.stability !== wantStab) { console.log(`  FAIL ${p.key} steadiness bar ${p.stability}, grade ${stab && stab.grade}`); bad++; }
      if (st === 'ok' && p.range !== 100) { console.log(`  FAIL ${p.key} in range but bar ${p.range}`); bad++; }
      if (st !== 'ok' && p.range === 100) { console.log(`  FAIL ${p.key} out of range but bar 100`); bad++; }
      const wantSub = Math.round((p.stability / 100 * 0.4 + p.range / 100 * 0.6) * 100);
      if (Math.abs(p.sub - wantSub) > 1) { console.log(`  FAIL ${p.key} sub ${p.sub} vs its bars ${wantSub}`); bad++; }
    }
    for (let k = 1; k < ex.parts.length; k++) {
      if (ex.parts[k].raw < ex.parts[k - 1].raw - 1e-9) { console.log('  FAIL rows not ordered worst first'); bad++; }
    }
    if (ex.weakest.length === ex.parts.length && ex.parts.length > 1) {
      console.log('  FAIL every parameter named as the weakest link'); bad++;
    }
    for (const p of ex.parts) {
      if (p.sub < 0 || p.sub > 100 || p.range < 0 || p.range > 100 || p.stability < 0 || p.stability > 100) {
        console.log(`  FAIL ${p.key} out of bounds`); bad++;
      }
    }
  }
  console.log(`  score breakdown: ${runs} random tanks, ${bad} inconsistencies`);
  if (bad) process.exit(1);
}

/* The strip must agree with the claim printed above it. It previously drew
 * only where readings sat, so a parameter climbing steadily inside its band
 * showed a bar comfortably within the target while the words said "climbing,
 * not settling". Direction is now part of the picture, and this checks the two
 * cannot disagree. */
{
  let rnd = 5150, bad = 0, checked = 0;
  const rand = () => { rnd = (rnd * 1103515245 + 12345) % 2147483648; return rnd / 2147483648; };
  for (let i = 0; i < 300; i++) {
    const def = L.PARAM_DEFS[Math.floor(rand() * L.PARAM_DEFS.length)];
    const w = def.max - def.min;
    const dir = rand() < 0.5 ? 1 : -1;
    const rows = [];
    const start = def.min + w * 0.15;
    for (let j = 8; j >= 0; j--) {
      rows.push({ param: def.key, date: L.addDays(T, -j * 2), time: '20:00',
        value: Math.round((start + dir * ((8 - j) / 8) * w * 0.7) * 1000) / 1000 });
    }
    const stab = L.computeStability(def, rows);
    if (!stab || stab.grade === 'unknown' || stab.p05 == null) continue;
    checked++;
    const sorted = rows.slice();
    const win = sorted.slice(-Math.max(2, stab.readingCount || 2));
    const then = win[0].value, now = sorted[sorted.length - 1].value;
    const drawn = now > then ? 'up' : now < then ? 'down' : 'flat';
    const stated = stab.pattern === 'trending up' ? 'up'
      : stab.pattern === 'trending down' ? 'down' : null;
    if (stated && drawn !== 'flat' && stated !== drawn) {
      console.log(`  FAIL ${def.key}: strip draws ${drawn}, stability says ${stab.pattern}`);
      bad++;
    }
  }
  console.log(`  strip direction: ${checked} series, ${bad} disagreements with the claim`);
  if (bad) process.exit(1);
}

/* Phosphate and nitrate get no generic trend claim at all — TW-029,
 * reef-chemistry.md §25, routines/20-phosphate-nitrate.md.
 *
 * This block used to assert the opposite: that a measurable in-range drift
 * on these two MUST produce heading-out-<key> ("missed a measurable drift").
 * That assertion pinned borrowed reasoning — a 30-day regression, which at
 * their 7-day cadence is a line through four or five bounces of a parameter
 * that oscillates — and §25 records the notices it produced as a defect, not
 * a display problem. The kit-resolution guard the old comment described
 * ("projected to leave its range in 34 days on a trend of 0.006 ppm a week")
 * was a patch on that borrowed rule; the rule itself is now removed for
 * these two, so the expectation inverts: no drift of any size may fire. The
 * per-parameter reasoning that replaces it is Dan's to write into canon
 * first (.agent/needs-dan.md). */
{
  /* Alkalinity, calcium and magnesium are governed by their dosing protocols,
     which own the "is it moving, should I act" question for those elements —
     the generic trend detector deliberately stays silent on them, so they are
     not checked here. tests/crosstalk.js covers that boundary. */
  const NOISE = { phosphate: 0.02, nitrate: 1.0 };
  let bad = 0;
  for (const [key, noise] of Object.entries(NOISE)) {
    const def = L.PARAM_DEFS.find((d) => d.key === key);
    if (!def) continue;
    const mk = (perWeek) => {
      const rows = [];
      const start = def.min + (def.max - def.min) * 0.3;
      for (let i = 10; i >= 0; i--) {
        rows.push({ param: key, date: L.addDays(T, -i * 3), time: '20:00',
          value: Math.round((start + perWeek * ((10 - i) * 3 / 7)) * 100000) / 100000 });
      }
      const last = rows[rows.length - 1];
      const f = L.buildFindings({ readings: rows, icps: [], paramDefs: L.PARAM_DEFS,
        settings: { ...L.DEFAULT_SETTINGS, ...TANK_STRENGTHS }, doseLog: [], waterChanges: [], latestByParam: { [key]: last } });
      return { flagged: f.findings.some((x) => x.id === 'heading-out-' + key) };
    };
    const tiny = mk(noise * 0.2);
    if (tiny.flagged) { console.log(`  FAIL ${key}: projected a trend below kit resolution`); bad++; }
    /* The drift size that the old rule was required to flag — big enough for
       the kit and for the band. Scenario coordinates, not thresholds. */
    const band = def.max - def.min;
    const real = mk(Math.max(noise * 0.6, band / 10));
    if (real.flagged) { console.log(`  FAIL ${key}: generic trend claim on a parameter with no written rules (TW-029)`); bad++; }
  }
  console.log(`  no generic trend claims on nutrients: ${Object.keys(NOISE).length} parameters, ${bad} failures`);
  if (bad) process.exit(1);
}

/* The score has to distinguish "low" from "dangerous".
 *
 * Only ammonia capped the score, so a tank at 0.2 dKH scored 71 — identical to
 * one at 6.0, and just 29 points below perfect. The blend cannot express it:
 * five healthy parameters hold the mean up while the worst term is floored.
 */
{
  const defs5 = L.PARAM_DEFS;
  const T6 = L.todayStr();
  const S6 = { ...L.DEFAULT_SETTINGS, ...TANK_STRENGTHS, volumeL: 77 };
  const scoreWith = (key, val) => {
    const r = [];
    for (const d of defs5) {
      if (d.key === 'ammonia' || d.key === 'salinity') continue;
      const v = d.key === key ? val : (d.min + d.max) / 2;
      for (let j = 8; j > 0; j--) r.push({ param: d.key, date: L.addDays(T6, -j), time: '20:00', value: v });
    }
    return L.deriveTankState({ readings: r, icps: [], paramDefs: defs5, settings: S6 }).overview.score;
  };
  let bad = 0;

  /* Deeper trouble must always score lower, never the same. */
  /* Each ladder starts at its band midpoint and walks outward. The midpoints
     moved when the target bands were corrected against the hobby consensus —
     calcium had been 450-500 and magnesium 1450-1500, both entirely above
     every published range — so a ladder starting at the old midpoint now
     begins outside the band and scores lower than the step below it. */
  const mid = (k) => {
    const d = L.PARAM_DEFS.find((x) => x.key === k);
    return (d.min + d.max) / 2;
  };
  const LADDERS = {
    alkalinity: [mid('alkalinity'), 8, 7.5, 6.9, 6, 4, 2],
    calcium:    [mid('calcium'), 390, 370, 330, 300, 250],
    magnesium:  [mid('magnesium'), 1200, 1150, 1100, 1000, 900],
  };
  for (const [key, ladder] of Object.entries(LADDERS)) {
    for (let i = 1; i < ladder.length; i++) {
      const hi = scoreWith(key, ladder[i - 1]), lo = scoreWith(key, ladder[i]);
      if (lo > hi) { console.log(`  FAIL ${key} ${ladder[i]} scores ${lo}, above ${ladder[i-1]} at ${hi}`); bad++; }
    }
    /* And a genuinely dangerous level must be well below a merely low one. */
    const low = scoreWith(key, ladder[2]), danger = scoreWith(key, ladder[ladder.length - 1]);
    if (danger >= low - 20) {
      console.log(`  FAIL ${key}: dangerous scores ${danger}, barely below low at ${low}`); bad++;
    }
  }

  /* And it must not cry wolf: a tank with everything inside its bands scores
     high, or the cap is firing on healthy tanks. */
  let rnd = 5150;
  const rand = () => { rnd = (rnd + 0x6D2B79F5) | 0; let t = Math.imul(rnd ^ (rnd >>> 15), 1 | rnd);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  let lowScores = 0;
  for (let i = 0; i < 300; i++) {
    const r = [];
    for (const d of defs5) {
      if (d.key === 'ammonia' || d.key === 'salinity') continue;
      const mid = (d.min + d.max) / 2, span = d.max - d.min;
      const v = mid + (rand() - 0.5) * span * 0.8;
      for (let j = 8; j > 0; j--) r.push({ param: d.key, date: L.addDays(T6, -j), time: '20:00', value: v });
    }
    const sc = L.deriveTankState({ readings: r, icps: [], paramDefs: defs5, settings: S6 }).overview.score;
    if (sc < 60) lowScores++;
  }
  if (lowScores > 3) { console.log(`  FAIL ${lowScores}/300 healthy tanks scored under 60`); bad++; }

  console.log(`  score severity: 3 ladders + 300 healthy tanks, ${bad} failures`);
  if (bad) process.exit(1);
}
