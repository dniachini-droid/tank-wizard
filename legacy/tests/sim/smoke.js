/* The normal-case sweep, run alongside verify.sh.
 *
 * The unit suites check properties of a single assessment. This runs whole
 * tanks through whole correction lifecycles and checks that five surfaces —
 * headline, summary claims, findings, Dosing Wizard, reading window — agree
 * with each other on every simulated day.
 *
 * It exists because the gate cannot see this class of fault. A correction with
 * no stop condition ran calcium to 702 ppm and alkalinity to zero; every unit
 * property still passed, because each individual assessment was correct. Only
 * running the days in sequence showed it.
 *
 * Usage: node tests/sim/smoke.js [tanks]   (default 60, about six seconds)
 */
const path = require('path');
const { run } = require(path.join(__dirname, 'surfaces.js'));
const { makeRng } = require(path.join(__dirname, 'rng.js'));

const TANKS = Number(process.argv[2] || 60);
let rnd = makeRng(99);
const pick = (a) => a[Math.floor(rnd() * a.length)];

const problems = {};
const examples = {};
const states = {};
let tanks = 0, days = 0;

for (let i = 0; i < TANKS; i++) {
  rnd = makeRng(i * 7919 + 3);
  const volumeL = pick([25, 40, 77, 200, 400]);
  const scale = volumeL / 77;
  const cfg = {
    volumeL,
    cons: {
      alkalinity: (0.3 + rnd() * 1.2) * scale,
      calcium: (2 + rnd() * 8) * scale,
      magnesium: (0.2 + rnd() * 0.8) * scale,
    },
    /* Levels spread across in-band, a little out, and a long way out, so the
       correction states are actually exercised rather than assumed. */
    startLevels: {
      alkalinity: pick([7.6, 7.9, 8.2, 9.0, 9.4, 10.0, 10.4]),
      calcium: pick([390, 405, 430, 470, 490, 520, 545]),
      magnesium: pick([1330, 1400, 1470, 1490, 1540]),
    },
    days: 70,
    /* Real keepers change their minds and skip advice. */
    cancelChance: pick([0, 0, 0.1, 0.2]),
    ignoreChance: pick([0, 0, 0.15, 0.3]),
  };
  let r;
  try {
    r = run(i * 7919 + 3, cfg);
  } catch (e) {
    problems[`threw: ${e.message}`] = (problems[`threw: ${e.message}`] || 0) + 1;
    continue;
  }
  tanks++;
  days += cfg.days;
  for (const p of r.problems) {
    const key = p.split(' | ')[0];
    problems[key] = (problems[key] || 0) + 1;
    if (!examples[key]) examples[key] = p;
  }
  for (const [k, v] of Object.entries(r.seen)) states[k] = (states[k] || 0) + v;
}

const kinds = Object.keys(problems);
console.log(`  surfaces: ${tanks} tanks, ${days.toLocaleString()} tank-days, ` +
  `${Object.keys(states).length} states exercised`);
if (kinds.length) {
  console.log('  FAIL surfaces disagree:');
  for (const k of kinds.sort((a, b) => problems[b] - problems[a])) {
    console.log(`    ${k}: ${problems[k]}`);
    /* One example per kind. A bare count says something is wrong and gives
       nothing to work from — every investigation of this sweep has started by
       re-instrumenting it to get a single line of detail back. */
    if (examples && examples[k]) console.log(`        e.g. ${String(examples[k]).slice(0, 100)}`);
  }
  process.exit(1);
}

/* A sweep that exercises nothing is a green light that means nothing — the
   csscheck failure mode. Fail if the correction states never came up. */
const MUST = ['correcting-dose', 'correction-done', 'idle', 'suggested'];
const missing = MUST.filter((s) => !states[s]);
if (missing.length) {
  console.log(`  FAIL the sweep never exercised: ${missing.join(', ')}`);
  process.exit(1);
}
