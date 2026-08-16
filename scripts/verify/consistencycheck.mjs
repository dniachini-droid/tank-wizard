#!/usr/bin/env node
/* §22 consistency verdicts — the checker (TW-045).
 *
 * Per wizard-states.md §10, a rule with no checker is an intention; §22's own
 * Enforced-by section named exactly three checks and, until this file, none
 * existed. The three, verbatim from §22:
 *
 *   (1) the verdict set is exactly {dialled, controlled, steady-off,
 *       unsettled, loose, sliding} — a seventh verdict fails the build,
 *       exactly as an invented band does under §13;
 *   (2) no verdict renders calmer than its own reading's §13 band — the
 *       alert-tier rule, and the one with a livestock consequence;
 *   (3) an ungradeable parameter refuses and names what is missing, rather
 *       than grading.
 *
 * (1) is checked statically against reading-meaning.js's source. (2) and (3)
 * are behavioural: computeControl is bundled (its import graph reaches .jsx,
 * so plain node cannot import it) and run against fixtures. TW-028's
 * wordingcheck extension is the §19/§20 half; this is deliberately §22 only.
 */
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { ROOT } from './util.mjs';

const require = createRequire(import.meta.url);
let failed = false;
const fail = (msg) => { console.log(`FAIL consistencycheck: ${msg}`); failed = true; };

/* ---- (1) the verdict set, statically ---- */
const srcPath = path.join(ROOT, 'src', 'lib', 'analytics', 'reading-meaning.js');
const src = fs.readFileSync(srcPath, 'utf8');
const THE_SIX = ['dialled', 'controlled', 'steady-off', 'unsettled', 'loose', 'sliding'];
const assigned = [...new Set([...src.matchAll(/verdict = "([a-z-]+)"/g)].map((m) => m[1]))];
for (const v of assigned) {
  if (!THE_SIX.includes(v)) fail(`invented verdict "${v}" — §22 registers exactly six`);
}
for (const v of THE_SIX) {
  if (!assigned.includes(v)) fail(`verdict "${v}" is in §22's registry but never assigned`);
}

/* ---- bundle computeControl for the behavioural half ---- */
const bundle = path.join(ROOT, 'build', 'consistency-check.cjs');
execFileSync('npx', ['esbuild', srcPath, '--bundle', '--platform=node', '--format=cjs',
  `--outfile=${bundle}`, '--loader:.jsx=jsx', '--log-level=silent',
  '--banner:js=global.window=global.window||{storage:null,localStorage:null,matchMedia:()=>({matches:false})};',
], { cwd: ROOT, stdio: 'pipe' });
const { computeControl, positionBand } = require(bundle);

const isoLocal = (d) => {
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
};
const series = (param, values, gapDays = 5) => values.map((v, i) => {
  const d = new Date();
  d.setDate(d.getDate() - (values.length - 1 - i) * gapDays);
  return { id: `r${i}`, param, date: isoLocal(d), value: v };
});

const alkDef = { key: 'alkalinity', label: 'Alkalinity', unit: 'dKH', min: 8.2, max: 8.8, step: 0.1, freqDays: 2 };
/* Same tier language the module uses: teal/green calm, blue/amber off-band, red alert. */
const TONE_TIER = { '#0B7C86': 0, '#2A8050': 0, '#1D6FA5': 1, '#A2621B': 1, '#C4285B': 2, '#9FB0AE': 0 };

/* ---- (2) no verdict renders calmer than its own reading's band ---- */
const shapes = [
  ['off-band oscillating', [7.6, 8.3, 7.6, 8.3, 7.6, 8.3, 7.6, 8.3, 7.6]],
  ['dialled in-band', [8.5, 8.5, 8.45, 8.55, 8.5, 8.5]],
  ['in-band median, out-of-band latest', [8.5, 8.5, 8.45, 8.55, 8.5, 8.05]],
  ['steady at alert-low', [7.0, 7.05, 6.95, 7.0, 7.05, 6.95, 7.0]],
  ['sliding through the band', [7.0, 7.4, 7.8, 8.2, 8.6, 9.0, 9.4]],
  ['wide swing', [6.9, 9.1, 7.0, 9.0, 6.8, 9.2, 7.1]],
  ['steady at alert-high', [9.6, 9.65, 9.55, 9.6, 9.65, 9.6]],
  ['low run recovering into band', [7.2, 7.4, 7.6, 7.3, 7.5, 7.7, 7.4, 7.6, 8.0, 8.25, 8.3]],
];
let swept = 0;
for (const [label, values] of shapes) {
  const c = computeControl(alkDef, series('alkalinity', values), 90);
  if (!c) { fail(`fixture "${label}" produced no result`); continue; }
  swept++;
  const pos = positionBand(alkDef, values[values.length - 1]);
  const toneTier = TONE_TIER[c.tone];
  if (toneTier == null) { fail(`fixture "${label}": unregistered tone ${c.tone}`); continue; }
  if (toneTier < pos.tier) {
    fail(`fixture "${label}": verdict ${c.verdict} renders ${c.tone} (tier ${toneTier}), calmer than its reading's band ${pos.band} (tier ${pos.tier})`);
  }
  if (pos.tier === 2 && !/needs attention/.test(c.note.slice(0, 60))) {
    fail(`fixture "${label}": at the alert tier the note must lead with the position; got "${c.note.slice(0, 60)}…"`);
  }
  if (c.verdict != null && !THE_SIX.includes(c.verdict)) {
    fail(`fixture "${label}": runtime verdict "${c.verdict}" is not one of §22's six`);
  }
}

/* ---- (3) an ungradeable parameter refuses and names what is missing ---- */
const boronDef = { key: 'boron', label: 'Boron', unit: 'ppm', min: 4, max: 6, step: 0.1 };
const r = computeControl(boronDef, series('boron', [4.5, 4.6, 4.4, 4.5, 4.6]), 90);
if (!r) fail('ungradeable parameter returned nothing — a refusal is still a result');
else {
  if (r.refused !== true || THE_SIX.includes(r.verdict)) {
    fail(`ungradeable parameter graded anyway: verdict ${JSON.stringify(r.verdict)} — §13's last row requires a refusal`);
  }
  if (!/no consistency tolerance is defined for boron/i.test(r.note || '')) {
    fail(`the refusal does not name what is missing; note: ${JSON.stringify((r.note || '').slice(0, 80))}`);
  }
}

if (failed) process.exit(1);
console.log(`OK   §22 consistency verdicts: set of six, tier floor over ${swept} fixtures, refusal names what is missing`);
