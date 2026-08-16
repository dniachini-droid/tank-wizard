/* The app's advice, checked against established reef husbandry.
 *
 * Sources for the thresholds below: Randy Holmes-Farley's "Optimal Parameters
 * for a Coral Reef Aquarium" (alkalinity 7–11 dKH workable, calcification
 * stalls below ~6); the widely-repeated 0.5 dKH/day ceiling on how fast
 * alkalinity may be moved; the modern consensus that zero nitrate and
 * phosphate starve corals rather than being ideal (targets ~3–15 ppm and
 * 0.03–0.10 ppm); and the strong agreement that high alkalinity on lean
 * nutrients is what burns SPS tips.
 *
 * The distinction this enforces is between "outside the band you chose" and
 * "outside what the hobby considers safe". The app used to treat them as the
 * same thing and called 7.5 dKH "a long way below range" at emergency
 * severity, which is how alarms get ignored.
 */
const path = require('path');
const L = require(path.join(__dirname, '..', '..', 'build', 'engines-new.cjs'));

const T = L.todayStr();
const defs = L.PARAM_DEFS;
let bad = 0, checked = 0;

const run = (vals) => {
  const readings = [];
  for (const [k, v] of Object.entries(vals)) {
    for (let j = 8; j > 0; j--) {
      readings.push({ param: k, date: L.addDays(T, -j * 2), time: '20:00', value: v });
    }
  }
  const latest = {};
  for (const d of defs) {
    const r = readings.filter((x) => x.param === d.key).sort((a, b) => (a.date < b.date ? 1 : -1));
    latest[d.key] = r[0] || null;
  }
  const settings = { ...L.DEFAULT_SETTINGS, volumeL: 77 };
  const findings = L.buildFindings({ readings, icps: [], paramDefs: defs, settings,
    doseLog: [], waterChanges: [], latestByParam: latest }).findings;
  const states = [];
  for (const k of ['alkalinity', 'calcium', 'magnesium']) {
    const def = defs.find((d) => d.key === k);
    const fn = k === 'alkalinity' ? L.assessAlkalinity : k === 'calcium' ? L.assessCalcium : L.assessMagnesium;
    const a = fn({ readings, doseLog: [], waterChanges: [], corrections: [], settings, def });
    const st = L.doseStatus(a, def);
    if (st) states.push({ ...st, key: k, el: def.label.toLowerCase() });
  }
  return { findings, claims: L.buildBriefing(readings, latest, defs, findings, states, {}) };
};

const BASE = { alkalinity: 8.8, calcium: 450, magnesium: 1450, nitrate: 8, phosphate: 0.06, ph: 8.1 };
const urgentAbout = (c, re) => c.claims.some((x) => x.tone === 'act' && re.test(x.claim));
const saysAnything = (c, re) => c.claims.some((x) => x.tone !== 'ok' && re.test(x.claim));

const expect = (label, vals, fn) => {
  checked++;
  const r = run({ ...BASE, ...vals });
  if (!fn(r)) {
    console.log(`  FAIL ${label}`);
    r.claims.filter((x) => x.tone !== 'ok').forEach((x) => console.log(`         [${x.tone}] ${x.claim}`));
    bad++;
  }
};

/* Emergencies */
expect('any detectable ammonia is urgent', { ammonia: 0.25 }, (r) => urgentAbout(r, /ammonia/i));

/* Alkalinity: 7–11 workable, outside that is real */
expect('alk 7.5 is workable, not an emergency', { alkalinity: 7.5 }, (r) => !urgentAbout(r, /alkalinity/i));
expect('alk 11 is workable', { alkalinity: 11, nitrate: 10, phosphate: 0.1 }, (r) => !urgentAbout(r, /alkalinity/i));
expect('alk 13 is genuinely too high', { alkalinity: 13 }, (r) => urgentAbout(r, /alkalinity/i));
expect('alk 6 stalls calcification', { alkalinity: 6 }, (r) => urgentAbout(r, /alkalinity/i));

/* Calcium and magnesium */
expect('calcium 400 is low but workable', { calcium: 400 }, (r) => !urgentAbout(r, /calcium/i));
expect('calcium 320 is genuinely low', { calcium: 320 }, (r) => urgentAbout(r, /calcium/i));
expect('magnesium 1300 is low but workable', { magnesium: 1300 }, (r) => !urgentAbout(r, /magnesium/i));
expect('magnesium 1100 blocks calcium and alkalinity', { magnesium: 1100 }, (r) => urgentAbout(r, /magnesium/i));

/* Nutrients: zero is a problem, high is untidy rather than acute */
expect('nutrients at zero are flagged', { nitrate: 0.1, phosphate: 0.005 },
  (r) => saysAnything(r, /nutrient|nitrate|phosphate/i));
expect('nitrate 8 / phosphate 0.06 is healthy', {}, (r) => !r.claims.some((x) => x.tone === 'act'));
expect('nitrate 25 is high but not acute', { nitrate: 25 }, (r) => !urgentAbout(r, /nitrate/i));
/* SUSPENDED, not deleted — TW-029, reef-chemistry.md §25, per AGENTS.md #4.
   The only path that ever said something urgent at 80 ppm was the generic
   far-out loop: a trigger scaled to the user's band width (alkalinity's
   logic), escalated by SAFE_BOUNDS. §25 removes borrowed judgements from
   phosphate and nitrate and forbids minting replacements, and canon has no
   nitrate upper-warning figure — §2's safe-bounds table covers the three
   dosed elements only. So the app currently cannot honour this expectation
   without inventing a threshold. Whether nitrate gets an upper warning, and
   at what figure, is with Dan (.agent/needs-dan.md, journey 5 open
   question 3). Re-enable when the canon entry exists.
expect('nitrate 80 is excessive', { nitrate: 80 }, (r) => urgentAbout(r, /nitrate/i));
*/

/* The cross-parameter rule that no per-parameter check can see */
expect('high alk on lean nutrients warns of burnt tips', { alkalinity: 9.4, nitrate: 0.5, phosphate: 0.01 },
  (r) => r.findings.some((f) => f.id === 'alk-vs-nutrients' && f.severity === 'watch'));
expect('high alk on rich nutrients is left alone', { alkalinity: 9.4, nitrate: 8, phosphate: 0.08 },
  (r) => !r.findings.some((f) => f.id === 'alk-vs-nutrients'));

/* Salinity */
expect('salinity 35 is not flagged', { salinity: 35 }, (r) => !r.findings.some((f) => /salinity/.test(f.id)));
expect('salinity 30 is flagged', { salinity: 30 }, (r) => r.findings.some((f) => /salinity/.test(f.id)));

/* pH */
expect('pH 7.6 is flagged', { ph: 7.6 }, (r) => saysAnything(r, /ph|carbon/i));

/* The rate ceiling, which is the most repeated number in the hobby */
{
  checked++;
  /* Read from the engine rather than retyped. These had been copied and then
     the engine's own figures were corrected against the sources — calcium's
     3.5 ppm a day had no citation and made a gentle correction take 86 days —
     so the test was asserting numbers the app no longer claims. */
  const LIMIT = { ...L.SAFE_DAILY_RISE };
  const settings = { ...L.DEFAULT_SETTINGS, volumeL: 77 };
  for (const [k, lim] of Object.entries(LIMIT)) {
    const def = defs.find((d) => d.key === k);
    const readings = [];
    for (let j = 8; j > 0; j--) {
      readings.push({ param: k, date: L.addDays(T, -j * 2), time: '20:00', value: def.min - (def.max - def.min) });
    }
    const fn = k === 'alkalinity' ? L.assessAlkalinity : k === 'calcium' ? L.assessCalcium : L.assessMagnesium;
    const a = fn({ readings, doseLog: [], waterChanges: [], corrections: [], settings, def });
    if (a.correction && a.correction.ppmPerDay > lim * 1.05) {
      console.log(`  FAIL ${k} correction exceeds the ${lim}/day ceiling`); bad++;
    }
  }
}

console.log(`  husbandry: ${checked} best-practice rules, ${bad} failures`);
if (bad) process.exit(1);

/* Default target bands against the published hobby consensus.
 *
 * Calcium shipped at 450-500 and magnesium at 1450-1500, and both sat entirely
 * ABOVE every range in print. Natural seawater is about 420 ppm calcium and
 * 1290 ppm magnesium; the sources converge on 400-450 and 1250-1400. The
 * effect was not cosmetic: a tank at a textbook 435 ppm calcium and 1285 ppm
 * magnesium read as out of band on both, and the app offered to push magnesium
 * to 1475 — a level the same sources describe as stressing invertebrates and
 * suppressing calcium and alkalinity uptake. It was steering people away from
 * correct values.
 *
 * Each band below must contain the natural-seawater figure, because a default
 * that excludes the ocean is a default that is wrong.
 */
{
  /* [published low, published high, natural seawater or null]
     The seawater column only applies where the hobby actually targets it.
     Alkalinity is the exception and deliberately so: seawater is about 7.5 dKH
     and reef tanks are run at 8-12 because corals calcify faster there. A
     band that excluded the ocean would be wrong for calcium or magnesium and
     is correct for alkalinity. */
  const CONSENSUS = {
    alkalinity: [7, 12, null],
    calcium: [380, 450, 420],
    magnesium: [1250, 1400, 1290],
    salinity: [32, 37, 35],
    ph: [7.8, 8.5, 8.1],
  };
  let bad = 0;
  for (const [key, [lo, hi, nsw]] of Object.entries(CONSENSUS)) {
    const def = L.PARAM_DEFS.find((d) => d.key === key);
    if (!def) continue;
    if (def.min < lo || def.max > hi) {
      console.log(`  FAIL ${key} band ${def.min}-${def.max} falls outside the published ${lo}-${hi}`);
      bad++;
    }
    if (nsw != null && (nsw < def.min || nsw > def.max)) {
      console.log(`  FAIL ${key} band ${def.min}-${def.max} excludes natural seawater (${nsw})`);
      bad++;
    }
  }

  /* And the safe bounds must be wider than the target band, or a level inside
     its own target reads as dangerous. */
  for (const key of Object.keys(CONSENSUS)) {
    const def = L.PARAM_DEFS.find((d) => d.key === key);
    const sb = L.SAFE_BOUNDS[key];
    if (!def || !sb) continue;
    if (sb.min > def.min || sb.max < def.max) {
      console.log(`  FAIL ${key} safe bounds ${sb.min}-${sb.max} are inside the target ${def.min}-${def.max}`);
      bad++;
    }
  }
  console.log(`  bands match published guidance: ${Object.keys(CONSENSUS).length} parameters, ${bad} failures`);
  if (bad) process.exit(1);
}

/* Rates and cadences against the sources, and no constant claimed twice.
 *
 * SAFE_DAILY_RISE said calcium 3.5 ppm a day while CORRECTION_MAX_RATE said
 * 15 — a four-fold disagreement about the same piece of physics, introduced
 * when the correction planner was added and never reconciled. The 3.5 had no
 * citation at all and made a gentle calcium correction take 86 days.
 */
{
  let bad = 0;

  /* One limit per element, not two. */
  for (const k of Object.keys(L.CORRECTION_MAX_RATE)) {
    if (L.SAFE_DAILY_RISE[k] !== L.CORRECTION_MAX_RATE[k]) {
      console.log(`  FAIL ${k}: two different daily limits (${L.SAFE_DAILY_RISE[k]} vs ${L.CORRECTION_MAX_RATE[k]})`);
      bad++;
    }
  }

  /* Sourced ranges: alkalinity up to 1.0 dKH a day with most keepers at 0.5;
     BRS caps calcium at 50 ppm a day and reefcalcs calls 20 safe; magnesium is
     given as 25 ppm a day, with suppliers going to 50. */
  const SOURCED_RATE = { alkalinity: [0.3, 1.0], calcium: [15, 50], magnesium: [20, 50] };
  for (const [k, [lo, hi]] of Object.entries(SOURCED_RATE)) {
    const v = L.SAFE_DAILY_RISE[k];
    if (v == null) { console.log(`  FAIL ${k}: no daily rate limit`); bad++; continue; }
    if (v < lo || v > hi) {
      console.log(`  FAIL ${k} rate ${v}/day falls outside the published ${lo}-${hi}`);
      bad++;
    }
  }

  /* Test cadence. Alkalinity moves fastest and is checked every day or two;
     calcium weekly for a mixed reef; magnesium every two to four weeks,
     because it is consumed slowly and a weekly nag is noise. */
  const SOURCED_FREQ = { alkalinity: [1, 3], calcium: [5, 10], magnesium: [14, 30] };
  for (const [k, [lo, hi]] of Object.entries(SOURCED_FREQ)) {
    const def = L.PARAM_DEFS.find((d) => d.key === k);
    if (!def) continue;
    if (def.freqDays < lo || def.freqDays > hi) {
      console.log(`  FAIL ${k} tested every ${def.freqDays} days, published guidance is ${lo}-${hi}`);
      bad++;
    }
  }

  /* Kit resolution must be finer than the band it is measuring, or the app
     cannot tell "in range" from "out" at all. */
  for (const k of ['alkalinity', 'calcium', 'magnesium']) {
    const def = L.PARAM_DEFS.find((d) => d.key === k);
    const noise = (L.STABILITY_RULES[k] || {}).noiseFloor;
    if (!def || noise == null) continue;
    if (noise > (def.max - def.min) / 2) {
      console.log(`  FAIL ${k}: kit noise ${noise} is more than half the band width ${def.max - def.min}`);
      bad++;
    }
  }
  console.log(`  rates and cadences match the sources: ${bad} failures`);
  if (bad) process.exit(1);
}

/* Nutrient bands and drift thresholds against the sources.
 *
 * Nitrate shipped at 9-15 and phosphate at 0.07-0.15, both shifted above the
 * consensus — a tank at a healthy 6 ppm nitrate or 0.05 ppm phosphate read as
 * below target. And alkalinity graded "steady" at up to 0.2 dKH a day, which
 * is 1.4 a week: nearly three times the published weekly drift limit and more
 * than the whole target band. A tank crossing its entire range in five days
 * still came out green, which is how "parked" and "steady" ended up on
 * parameters that were visibly moving.
 */
{
  let bad = 0;

  /* Reef Trak 3-15 ppm nitrate and 0.03-0.10 phosphate; reefcalcs 0.04-0.08
     target with 0.02-0.10 acceptable; Randy runs both higher. The band must
     sit inside the widest defensible reading of the consensus. */
  const NUTRIENTS = { nitrate: [2, 20], phosphate: [0.02, 0.15] };
  for (const [key, [lo, hi]] of Object.entries(NUTRIENTS)) {
    const def = L.PARAM_DEFS.find((d) => d.key === key);
    if (!def) continue;
    if (def.min < lo || def.max > hi) {
      console.log(`  FAIL ${key} band ${def.min}-${def.max} outside the published ${lo}-${hi}`);
      bad++;
    }
    /* "Zero is bad" is the modern consensus, so the floor must be above it. */
    if (def.min <= 0) { console.log(`  FAIL ${key} band allows zero`); bad++; }
  }

  /* Drift is graded by CONSISTENCY_RULES, on the SPREAD across the window.
     This block used to read STABILITY_RULES.greenPerDay, which nothing in the
     app consults — so it passed by comparing a dead constant against a
     published figure, and reported "0 failures" while checking nothing.

     Sourced: alkalinity movement beyond about 1 dKH is where tissue loss is
     reported, so "tight" at 0.5 and "moderate" at 1.0 bracket it. Calcium's
     safe rate of change is 20 ppm a day. Magnesium moves slowly, 50-100 ppm.
     Salinity fluctuation stresses corals even inside the optimal range. */
  const SPREAD_LIMITS = {
    alkalinity: { tight: [0.3, 0.6], moderate: [0.8, 1.2] },
    calcium: { tight: [20, 40], moderate: [45, 75] },
    magnesium: { tight: [40, 70], moderate: [80, 130] },
    salinity: { tight: [0.3, 0.7], moderate: [0.8, 1.3] },
    ph: { tight: [0.15, 0.3], moderate: [0.3, 0.5] },
  };
  for (const [key, want] of Object.entries(SPREAD_LIMITS)) {
    const cr = L.CONSISTENCY_RULES[key];
    if (!cr) { console.log(`  FAIL ${key}: no consistency rule`); bad++; continue; }
    for (const level of ['tight', 'moderate']) {
      const v = cr[level];
      const [lo, hi] = want[level];
      if (!(v >= lo && v <= hi)) {
        console.log(`  FAIL ${key} ${level} spread is ${v}, published guidance puts it at ${lo}-${hi}`);
        bad++;
      }
    }
    if (!(cr.moderate > cr.tight)) {
      console.log(`  FAIL ${key}: moderate is not looser than tight`); bad++;
    }
    /* A "tight" spread must be something the kit can actually resolve. */
    const noise = (L.STABILITY_RULES[key] || {}).noiseFloor;
    if (noise != null && cr.mode === 'absolute' && cr.tight < noise) {
      console.log(`  FAIL ${key}: tight spread ${cr.tight} is below the kit's ${noise}`); bad++;
    }
    /* And it must not be so loose that a parameter can cross its band. */
    const def = L.PARAM_DEFS.find((d) => d.key === key);
    if (def && cr.mode === 'absolute' && cr.tight > (def.max - def.min)) {
      console.log(`  FAIL ${key}: a "tight" spread crosses the whole band`); bad++;
    }
  }
  /* Every parameter the app grades must have a rule, and every rule must state
     its reasoning — these carry a `why`, and an unexplained threshold is how
     the dead one survived. */
  for (const def of L.PARAM_DEFS) {
    const cr = L.CONSISTENCY_RULES[def.key];
    if (!cr) { console.log(`  FAIL ${def.key}: no consistency rule`); bad++; continue; }
    if (!cr.why) { console.log(`  FAIL ${def.key}: consistency thresholds with no stated reason`); bad++; }
  }
  console.log(`  nutrients and drift thresholds match the sources: ${bad} failures`);
  if (bad) process.exit(1);
}

/* Safe bounds and kit precision against the sources.
 *
 * A silent edit failure hid one of these for a whole round: the magnesium
 * ceiling was "corrected" to 1600 by a replacement that matched on single
 * spacing while the file used double, so the assert never fired and 1700
 * stayed. Asserting the resulting values, rather than trusting that an edit
 * landed, is the only version of this check that works.
 */
{
  let bad = 0;

  /* Where the sources place actual harm, not merely off-target. */
  const HARM = {
    alkalinity: [6.5, 12],      /* calcification stalls below ~6; 7-11 workable */
    calcium: [340, 520],        /* below 380 slows growth, above 500 pulls alkalinity down */
    magnesium: [1100, 1650],    /* above ~1600 inverts go lethargic and uptake suppresses */
  };
  for (const [key, [lo, hi]] of Object.entries(HARM)) {
    const sb = L.SAFE_BOUNDS[key];
    if (!sb) { console.log(`  FAIL ${key}: no safe bounds`); bad++; continue; }
    if (sb.min < lo || sb.max > hi) {
      console.log(`  FAIL ${key} safe bounds ${sb.min}-${sb.max} outside the published harm points ${lo}-${hi}`);
      bad++;
    }
  }

  /* Kit precision must reflect the kit, not the brand. Hanna's alkalinity
     checker is the most precise in common use and its calcium checker is not:
     BRS measured a 101 ppm spread between highest and lowest Hanna calcium
     readings on one sample, against 10 ppm for Red Sea. */
  for (const [name, kit] of Object.entries(L.KIT_PRECISION)) {
    for (const key of ['alkalinity', 'calcium', 'magnesium']) {
      const v = kit[key];
      const def = L.PARAM_DEFS.find((d) => d.key === key);
      if (v == null || !def) { console.log(`  FAIL ${name}: no ${key} precision`); bad++; continue; }
      if (v <= 0) { console.log(`  FAIL ${name} ${key}: precision must be positive`); bad++; }
      /* A kit that cannot resolve a third of the band is not usable for it. */
      if (v > (def.max - def.min) / 3) {
        console.log(`  FAIL ${name} ${key}: ${v} cannot resolve a band of ${def.max - def.min}`);
        bad++;
      }
    }
  }
  if (L.KIT_PRECISION.hanna.calcium <= L.KIT_PRECISION.redsea.calcium) {
    console.log('  FAIL Hanna calcium is claimed at least as precise as Red Sea, against the measured spread');
    bad++;
  }
  console.log(`  safe bounds and kit precision match the sources: ${bad} failures`);
  if (bad) process.exit(1);
}

/* A kit per element, not one brand for everything.
 *
 * Hanna's alkalinity checker is the most precise in common use and its calcium
 * checker is among the least — BRS measured a 101 ppm spread against 10 for
 * Red Sea. A single selector was therefore guaranteed to be wrong for one
 * parameter or another, and almost nobody buys one brand for all three.
 */
{
  let bad = 0;
  const mixed = { ...L.DEFAULT_SETTINGS,
    testKits: { alkalinity: 'hanna', calcium: 'redsea', magnesium: 'salifert' } };

  for (const [key, kit] of Object.entries(mixed.testKits)) {
    const got = L.kitNoise(key, mixed);
    const want = L.KIT_PRECISION[kit][key];
    if (got !== want) {
      console.log(`  FAIL ${key}: used ${got} but ${kit} is ${want} — the per-element choice was ignored`);
      bad++;
    }
  }

  /* An existing setup with only the old single value must keep working. */
  const legacy = { ...L.DEFAULT_SETTINGS, testKits: undefined, testKit: 'salifert' };
  for (const key of ['alkalinity', 'calcium', 'magnesium']) {
    if (L.kitNoise(key, legacy) !== L.KIT_PRECISION.salifert[key]) {
      console.log(`  FAIL ${key}: a legacy single-kit setting stopped being honoured`);
      bad++;
    }
  }

  /* A more precise kit must never need a longer window than a coarser one. */
  for (const key of ['alkalinity', 'calcium', 'magnesium']) {
    const supply = { alkalinity: 0.62, calcium: 4.2, magnesium: 0.35 }[key];
    const fine = L.settleWindow(key, supply, { testKits: { [key]: 'redsea' } });
    const coarse = L.settleWindow(key, supply, { testKits: { [key]: 'other' } });
    const finer = L.KIT_PRECISION.redsea[key] < L.KIT_PRECISION.other[key];
    if (finer && fine > coarse) {
      console.log(`  FAIL ${key}: the more precise kit needs a longer window (${fine} vs ${coarse})`);
      bad++;
    }
  }
  console.log(`  per-element test kits: ${bad} failures`);
  if (bad) process.exit(1);
}

/* One answer to "how long before a dose change can be judged".
 *
 * There were three. settleWindow computes it from what the tank supplies and
 * how precise the kit is; DOSE_ADVICE_RULES carried a fixed minDaysSinceChange
 * that disagreed with it — 7 days against 3 for alkalinity. Same failure as
 * SAFE_DAILY_RISE and CORRECTION_MAX_RATE claiming different daily limits:
 * one fact, two tables, and nothing forcing them to agree.
 *
 * Magnesium dropped out of this comparison per reef-chemistry.md §10 (bug 6,
 * routine 15): DOSE_ADVICE_RULES no longer carries a magnesium entry at all
 * — the maintenance dose is never tuned from readings for magnesium, so
 * there is no second "how long to wait" answer left to disagree with
 * settleWindow. settleWindow itself is unaffected and still checked below.
 */
{
  let bad = 0;
  const S = { ...L.DEFAULT_SETTINGS, volumeL: 77,
    testKits: { alkalinity: 'hanna', calcium: 'redsea', magnesium: 'salifert' } };
  const supply = { alkalinity: 0.62, calcium: 4.2, magnesium: 0.35 };

  for (const key of ['alkalinity', 'calcium', 'magnesium']) {
    const w = L.settleWindow(key, supply[key], S);
    if (w < 1) { console.log(`  FAIL ${key}: settling window is ${w} days`); bad++; }
    if (!L.DOSE_ADVICE_RULES[key]) continue;
    const floor = L.DOSE_ADVICE_RULES[key].minDaysSinceChange;
    /* The fixed figure survives only as a floor, so a coarse kit on a slow
       tank still gets the longer wait it needs. It must never be the ceiling. */
    if (floor > 60) { console.log(`  FAIL ${key}: floor of ${floor} days is not a floor`); bad++; }
  }

  /* And the window must respond to the kit: a coarser kit needs longer. */
  for (const key of ['alkalinity', 'calcium']) {
    const fine = L.settleWindow(key, supply[key], { testKits: { [key]: 'redsea' } });
    const coarse = L.settleWindow(key, supply[key], { testKits: { [key]: 'other' } });
    const isFiner = L.KIT_PRECISION.redsea[key] < L.KIT_PRECISION.other[key];
    if (isFiner && fine > coarse) {
      console.log(`  FAIL ${key}: the finer kit was given a longer window`); bad++;
    }
  }
  console.log(`  one settling window, not three: ${bad} failures`);
  if (bad) process.exit(1);
}

/* The parameters left out of the first conformance pass.
 *
 * Bands and safe bounds for potassium, ammonia, nitrate, phosphate, pH and
 * salinity were never checked against a source — they were simply the ones
 * that had not caused trouble yet, which is not the same as being right. Two
 * were: potassium's safe ceiling sat at 470 against a reported toxicity point
 * of 500, and salinity's at 38 against a published acceptable range ending at
 * 37. Both flagged tanks that were not in trouble.
 */
{
  let bad = 0;

  /* Bands, with the natural-seawater figure where the hobby targets it. */
  const BANDS = {
    /* [published low, published high, seawater or null] */
    potassium: [370, 430, 400],     /* seawater runs 380-420; toxicity above 500 */
    salinity: [33, 36, 35],          /* target 34-36 ppt, seawater 35 */
  };
  for (const [key, [lo, hi, nsw]] of Object.entries(BANDS)) {
    const def = L.PARAM_DEFS.find((d) => d.key === key);
    if (!def) continue;
    if (def.min < lo || def.max > hi) {
      console.log(`  FAIL ${key} band ${def.min}-${def.max} outside the published ${lo}-${hi}`); bad++;
    }
    if (nsw != null && (nsw < def.min || nsw > def.max)) {
      console.log(`  FAIL ${key} band excludes natural seawater (${nsw})`); bad++;
    }
  }

  /* Ammonia is a ceiling, not a band: anything measurable is a problem, and
     above 0.25 ppm the sources describe fish suffocating within hours. */
  const am = L.PARAM_DEFS.find((d) => d.key === 'ammonia');
  if (am) {
    if (am.idealAt !== 'min') { console.log('  FAIL ammonia is not treated as a ceiling'); bad++; }
    if (am.min !== 0) { console.log(`  FAIL ammonia floor is ${am.min}, not zero`); bad++; }
    if (am.max > 0.25) { console.log(`  FAIL ammonia ceiling ${am.max} above the 0.25 harm point`); bad++; }
  }

  /* Safe bounds against the reported harm points. */
  const HARM2 = {
    potassium: [300, 500],    /* toxicity above 500 */
    salinity: [31, 37],       /* acceptable 32-37, no benefit either end */
    nitrate: [0.2, 55],       /* zero starves; above ~50 Randy would reduce */
    phosphate: [0.005, 0.5],  /* limitation below ~0.02; above ~0.3 reduce */
    ph: [7.6, 8.6],
  };
  for (const [key, [lo, hi]] of Object.entries(HARM2)) {
    const sb = L.SAFE_BOUNDS[key];
    if (!sb) { console.log(`  FAIL ${key}: no safe bounds`); bad++; continue; }
    if (sb.min < lo || sb.max > hi) {
      console.log(`  FAIL ${key} safe bounds ${sb.min}-${sb.max} outside the harm points ${lo}-${hi}`); bad++;
    }
    const def = L.PARAM_DEFS.find((d) => d.key === key);
    if (def && (sb.min > def.min || sb.max < def.max)) {
      console.log(`  FAIL ${key} safe bounds sit inside the target band`); bad++;
    }
  }

  /* Every parameter the app grades must have a stability rule, and a "steady"
     week must not cross its own band. */
  for (const def of L.PARAM_DEFS) {
    const rule = L.STABILITY_RULES[def.key];
    if (!rule) continue;
    if (!(rule.noiseFloor > 0)) { console.log(`  FAIL ${def.key}: no noise floor`); bad++; }
    if (!(rule.windowDays > 0)) { console.log(`  FAIL ${def.key}: no window`); bad++; }
    /* The dead fields must not come back. */
    if ('greenPerDay' in rule || 'amberPerDay' in rule) {
      console.log(`  FAIL ${def.key}: STABILITY_RULES carries drift thresholds again — nothing reads them`);
      bad++;
    }
  }
  console.log(`  remaining parameters match the sources: ${bad} failures`);
  if (bad) process.exit(1);
}

/* The four constants no test asserted the value of.
 *
 * D3 re-verification found DOSE_DRIFT_TRIGGER, DOSE_STEP_CAP,
 * BRACKET_MEMORY_DAYS and CORRECTION_PACE exported, live, and unasserted. Three
 * carried a sourced justification in the code; BRACKET_MEMORY_DAYS carried
 * none at all — the only husbandry constant in the app with no stated reason,
 * which is exactly how the dead drift thresholds survived beside it.
 */
{
  let bad = 0;

  /* Bracketing needs TWO observations, one where the level fell and one where
     it rose. The memory has to be long enough that a keeper changing the dose
     at a normal interval has both. */
  const T2 = L.todayStr();
  const observationsAt = (changeEvery) => {
    const doseLog = [], readings = [];
    let dose = 9;
    for (let d = 0; d < 120; d++) {
      if (d % changeEvery === 0) {
        dose += (d / changeEvery % 2 ? 1 : -1) * 0.8;
        doseLog.push({ element: 'alkalinity', date: L.addDays(T2, -(119 - d)), time: '21:00', ml: Math.round(dose * 10) / 10 });
      }
      if (d % 2 === 0) readings.push({ param: 'alkalinity', date: L.addDays(T2, -(119 - d)), time: '20:00', value: 9.0 + (d % 7 - 3) * 0.05 });
    }
    return L.doseObservations(doseLog, readings, 'alkalinity', 0.069, T2).length;
  };
  /* Someone adjusting every three weeks must get a bracket. Monthly is NOT
     required, and demanding it was the wrong bar: bracketing exists to stop
     dose oscillation, and a keeper adjusting once a month is not oscillating.
     Setting the memory to 60+ days purely to satisfy that assertion would have
     been tuning the app to please a test I had just invented. */
  if (observationsAt(21) < 2) {
    console.log(`  FAIL bracket memory of ${L.BRACKET_MEMORY_DAYS} days gives only ${observationsAt(21)} observation(s) to a keeper adjusting every three weeks — a bracket needs two`);
    bad++;
  }
  /* But not so long that an observation can be staler than the coherence
     filter would ever accept. A tank growing 60% a year drifts about 12% in
     90 days; the filter discards anything past 25%. */
  if (L.BRACKET_MEMORY_DAYS > 90) {
    console.log(`  FAIL bracket memory of ${L.BRACKET_MEMORY_DAYS} days outlives what the coherence filter tolerates`);
    bad++;
  }

  /* The step cap: 10-30% per adjustment is what the dosing guides describe. */
  if (!(L.DOSE_STEP_CAP >= 0.10 && L.DOSE_STEP_CAP <= 0.30)) {
    console.log(`  FAIL dose step cap ${L.DOSE_STEP_CAP} outside the published 10-30%`);
    bad++;
  }

  /* Correction paces are fractions of the sourced maximum rate, so they must
     be ordered and none may exceed it. */
  const paces = L.CORRECTION_PACE;
  if (!(paces.gentle < paces.steady && paces.steady < paces.quick)) {
    console.log('  FAIL correction paces are not ordered gentle < steady < quick'); bad++;
  }
  if (paces.quick > 1) {
    console.log(`  FAIL the quick pace (${paces.quick}) exceeds the safe maximum rate`); bad++;
  }

  /* Dose-drift triggers: alkalinity must be the tightest, because it is the
     only one read precisely enough to justify acting on a small gap. */
  const trig = L.DOSE_DRIFT_TRIGGER;
  if (!(trig.alkalinity < trig.calcium)) {
    console.log(`  FAIL alkalinity's drift trigger (${trig.alkalinity}) is not tighter than calcium's (${trig.calcium})`); bad++;
  }
  if ('magnesium' in trig) {
    console.log('  FAIL magnesium has a dose-drift trigger — its dose cannot be inferred from readings'); bad++;
  }
  console.log(`  the four unasserted constants: ${bad} failures`);
  if (bad) process.exit(1);
}
