/* If a parameter is outside its band, some surface must say so.
 *
 * Not "the count is technically right" — some surface must NAME it. A swept
 * sample found 9% of out-of-band tanks where none did: the headline said
 * "Mostly stable and in range", the summary said "alkalinity DOSE could
 * change", and the solid claim said "5 of 6 are in range and holding". Every
 * statement true, the impression wrong.
 *
 * The condition was specific. A flat reading out of band was caught, because
 * allSteady goes false and the sentence falls through to "a few sitting
 * off-target". A MOVING one was not: the trend grades amber or red, mostSteady
 * stays true, and it lands in the "mostly in range" branch — so the app read
 * as reassuring exactly when a parameter was out of range AND heading further
 * out.
 */
const path = require('path');
const L = require(path.join(__dirname, '..', '..', 'build', 'engines-new.cjs'));
const { makeRng } = require(path.join(__dirname, 'sim', 'rng.js'));

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
let bad = 0, checked = 0;
const shown = [];

for (let seed = 1; seed <= 600; seed++) {
  const rnd = makeRng(seed * 13 + 1);
  const key = ['alkalinity', 'calcium', 'magnesium', 'nitrate', 'phosphate'][seed % 5];
  const def = defs.find((d) => d.key === key);
  const span = def.max - def.min;

  /* One parameter placed outside its band, with a random trend through it —
     the trend is what decides which headline branch is reached. */
  const readings = [];
  const end = def.max + span * (0.1 + rnd() * 1.2) * (rnd() < 0.5 ? 1 : -1);
  const slope = (rnd() - 0.5) * span * 0.5;
  const count = 3 + Math.floor(rnd() * 5);
  for (let j = count; j > 0; j--) {
    readings.push({ param: key, date: L.addDays(T, -j * 2), time: '20:00',
      value: Math.round((end - slope * (j - 1)) * 1000) / 1000 });
  }
  for (const k of defs.map((d) => d.key)) {
    if (k === key || k === 'ammonia') continue;
    const d = defs.find((x) => x.key === k);
    for (let j = 8; j > 0; j--) {
      readings.push({ param: k, date: L.addDays(T, -j * 2), time: '20:00', value: (d.min + d.max) / 2 });
    }
  }

  let st;
  try { st = L.deriveTankState({ readings, icps: [], paramDefs: defs,
    settings: { ...L.DEFAULT_SETTINGS, ...TANK_STRENGTHS, volumeL: 77 } }); }
  catch (e) { console.log(`  FAIL seed ${seed}: deriving threw — ${e.message}`); bad++; continue; }

  const level = st.latestByParam[key];
  if (!level || (level.value >= def.min && level.value <= def.max)) continue;
  checked++;

  const surfaces = [
    st.overview.headline,
    ...st.briefing.map((c) => `${c.claim} ${c.support || ''}`),
    ...st.allFindings.map((f) => `${f.title} ${f.detail || ''}`),
  ].join(' ');

  const namesIt = new RegExp(key, 'i').test(surfaces);
  const saysOut = /above|below|high|low|out of|off-target|outside|dangerous/i.test(surfaces);
  if (!namesIt || !saysOut) {
    bad++;
    if (shown.length < 5) {
      shown.push(`${key} at ${level.value.toFixed(2)} (band ${def.min}-${def.max}) — "${st.overview.headline.slice(0, 54)}"`);
    }
  }
}

for (const s of shown) console.log(`  FAIL nothing named it: ${s}`);
console.log(`  every out-of-band parameter is named somewhere: ${checked} tanks, ${bad} silent`);
if (bad) process.exit(1);
