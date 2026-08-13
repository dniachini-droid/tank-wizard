/* A fingerprint of what the three assessment engines produce today.
 *
 * This exists to make the merge safe. Merging assessAlkalinity, assessCalcium
 * and assessMagnesium is worth doing — they share 68% of their lines and every
 * "fixed in one place, not the others" bug this project has had came from that
 * — but it is 1,300 lines of the most consequential code in the app, and the
 * usual suites check properties rather than exact output.
 *
 * So: run a wide sweep of tanks through all three, hash every field that
 * reaches a user, and store the result. Any change in behaviour shows up as a
 * changed hash, and can then be inspected field by field.
 *
 * Run with UPDATE=1 to re-record after a change that is deliberate.
 */
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const L = require(path.join(__dirname, '..', 'build', 'engines.js'));

const T = L.todayStr();

/* Every assessment stamps "now" as the date PLUS the time of day, and the
 * fixtures below are logged at 20:00. So a snapshot recorded in the morning
 * and checked in the evening disagrees with itself: the same code, the same
 * readings, a different answer, because the most recent reading moved from the
 * future to the past.
 *
 * This fingerprint has been the proof that every refactor this session was
 * behaviour-preserving. It was not reproducible, and the failure only showed
 * when a run happened to straddle 20:00.
 *
 * Passing an explicit `now` pins it. The engines all accept one — the option
 * existed and the harness never used it. */
const NOW = L.dayNum(T) + 12 / 24;   /* midday, well clear of the fixtures */

const defs = L.PARAM_DEFS;
const SNAPSHOT = path.join(__dirname, 'golden.json');

const CFG = {
  alkalinity: { fn: L.assessAlkalinity, strength: 'dkhPerMlPer100L', dose: 'dailyDoseMl', s: 0.0533, d: 9 },
  calcium: { fn: L.assessCalcium, strength: 'caPpmPerMlPer100L', dose: 'calciumDoseMl', s: 0.36, d: 12 },
  magnesium: { fn: L.assessMagnesium, strength: 'mgPpmPerMlPer100L', dose: 'magDoseMl', s: 0.024, d: 8 },
};

/* Fields a user can see or that steer advice. Order fixed so the hash is
   stable. */
const FIELDS = ['ok', 'action', 'currentDose', 'recommendedDose', 'maintenanceDose',
  'consumption', 'supplied', 'effectPerMl', 'trendPerDay', 'band', 'consistent',
  'explanation', 'reason', 'nextCheck'];
/* `correctionRepeats` was listed here and has been removed from the engines —
   it was a leftover from a change that was reverted, assigned and read by
   nothing. This sweep was its only consumer, which is not a consumer. */

function fingerprint() {
  const rows = [];
  for (const key of Object.keys(CFG)) {
    const def = defs.find((d) => d.key === key);
    const cfg = CFG[key];
    const span = def.max - def.min;
    for (const offset of [-2.5, -1.5, -0.8, -0.3, 0, 0.3, 0.8, 1.5, 2.5]) {
      /* Slopes chosen to straddle the thresholds, not spread evenly. A coarse
         set missed a change to the drift threshold entirely: no scenario
         happened to sit near the boundary, so moving it changed nothing. The
         values here bracket the green and amber grades from both sides. */
      /* Slope is a fraction of the band per reading, and readings are two days
         apart, so the daily rate is slope * span / 2. Alkalinity grades amber
         above 0.14 dKH a day on a band of 1.0 — which needs a slope of 0.29.
         Every earlier set topped out at 0.09 and therefore never left green,
         so moving the green/amber boundary changed nothing anywhere in the
         sweep and this reported no change. */
      for (const slope of [-0.45, -0.29, -0.15, -0.06, -0.02, 0,
                           0.02, 0.06, 0.15, 0.29, 0.45]) {
          /* Reading counts matter more than they look. Stability grades on the
             SPREAD within its window, not on slope, so a steep trend across two
             readings has a small spread and comes out green. Only longer runs
             reach the amber and red thresholds — with 2, 5 and 10 alone, moving
             those thresholds changed nothing in 3,564 cases and this sweep
             reported no change at all. */
        for (const count of [2, 4, 7, 12, 20]) {
          for (const withDose of [false, true]) {
            for (const withCorrection of [false, true]) {
              const settings = { ...L.DEFAULT_SETTINGS, volumeL: 77,
                [cfg.strength]: cfg.s, [cfg.dose]: cfg.d };
              const base = (def.min + def.max) / 2 + span * offset;
              const readings = [];
              for (let j = count; j > 0; j--) {
                const v = base + span * slope * (count - j);
                readings.push({ param: key, date: L.addDays(T, -j * 2), time: '20:00',
                  value: Math.round(v * 100000) / 100000 });
              }
              const doseLog = withDose
                ? [{ element: key, date: L.addDays(T, -6), time: '21:00', ml: cfg.d * 1.2 }] : [];
              const corrections = withCorrection
                ? [{ id: 'c', element: key, date: L.addDays(T, -3), time: '12:00', ml: 20, direction: 'up' }] : [];
              let a;
              try {
                a = cfg.fn({ readings, doseLog, waterChanges: [], corrections,
                  settings, def, correctionPlans: {}, now: NOW });
              } catch (e) {
                rows.push(`${key}|${offset}|${slope}|${count}|${withDose}|${withCorrection}|THREW:${e.message}`);
                continue;
              }
              const parts = FIELDS.map((f) => {
                const v = a[f];
                if (v == null) return '';
                if (typeof v === 'number') return String(Math.round(v * 10000) / 10000);
                return String(v);
              });
              /* And what the wizard says about it, which is what a user reads. */
              let st = null;
              try { st = L.doseStatus(a, def, T, settings); } catch (e) { parts.push('STATUS THREW ' + e.message); }
              if (st) parts.push(st.state, st.headline, st.detail);
              /* Stability is graded by a separate engine reading a separate
                 table, so a change to the drift thresholds moved nothing in
                 the assessment output and this sweep reported no change. It is
                 user-visible — it drives the strips and the "steady" language
                 — so it belongs in the fingerprint. */
              try {
                const stab = L.computeStability(def, readings);
                /* The fields it actually returns — an earlier version read
                   `perWeek`, which does not exist, so every case recorded an
                   empty string and the sweep was blind to the whole engine. */
                if (stab) {
                  for (const f of ['grade', 'trueGrade', 'pattern', 'label', 'netChange',
                                   'typicalRate', 'spread', 'consistency', 'atResolution', 'detail']) {
                    const v = stab[f];
                    parts.push(v == null ? '' : (typeof v === 'number' ? String(Math.round(v * 10000) / 10000) : String(v)));
                  }
                }
              } catch (e) { parts.push('STABILITY THREW ' + e.message); }
              /* And the correction offers, which quote figures a user acts on. */
              for (const pace of ['gentle', 'steady', 'quick']) {
                try {
                  const o = L.proposeCorrection(a, def, settings, pace);
                  parts.push(o ? `${o.possible ? 'y' : 'n'}:${o.dose == null ? '' : Math.round(o.dose * 10) / 10}:${o.days || ''}` : '');
                } catch (e) { parts.push('OFFER THREW'); }
              }
              rows.push(`${key}|${offset}|${slope}|${count}|${withDose}|${withCorrection}|` + parts.join('~'));
            }
          }
        }
      }
    }
  }
  return rows;
}

const rows = fingerprint();
const digest = crypto.createHash('sha256').update(rows.join('\n')).digest('hex').slice(0, 16);

if (process.env.UPDATE === '1' || !fs.existsSync(SNAPSHOT)) {
  fs.writeFileSync(SNAPSHOT, JSON.stringify({ digest, count: rows.length, rows }, null, 0));
  console.log(`  golden snapshot recorded: ${rows.length} cases, digest ${digest}`);
  process.exit(0);
}

const stored = JSON.parse(fs.readFileSync(SNAPSHOT, 'utf8'));
if (stored.digest === digest) {
  console.log(`  golden: ${rows.length} cases unchanged (${digest})`);
  process.exit(0);
}

/* Changed — say exactly where, because a digest alone is useless. */
console.log(`  FAIL golden output changed: ${stored.digest} -> ${digest}`);
let shown = 0;
for (let i = 0; i < Math.max(rows.length, stored.rows.length); i++) {
  if (rows[i] === stored.rows[i]) continue;
  const key = (rows[i] || stored.rows[i] || '').split('|').slice(0, 6).join('|');
  console.log(`    ${key}`);
  const was = (stored.rows[i] || '').split('|').slice(6).join('|');
  const now = (rows[i] || '').split('|').slice(6).join('|');
  const wasParts = was.split('~');
  const nowParts = now.split('~');
  for (let f = 0; f < Math.max(wasParts.length, nowParts.length); f++) {
    if (wasParts[f] === nowParts[f]) continue;
    const name = FIELDS[f] || ['state', 'headline', 'detail'][f - FIELDS.length] || `field${f}`;
    console.log(`        ${name}: "${String(wasParts[f]).slice(0, 60)}" -> "${String(nowParts[f]).slice(0, 60)}"`);
  }
  shown++;
  if (shown >= 8) { console.log('    ...'); break; }
}
process.exit(1);
