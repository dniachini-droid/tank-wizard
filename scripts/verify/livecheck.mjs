#!/usr/bin/env node
/* Ported from legacy/tools/livecheck.py — the highest-value port. No
 * off-the-shelf equivalent exists for this.
 *
 * Fields declared in a config table must be read by the app, not only by
 * tests. STABILITY_RULES carried `greenPerDay`/`amberPerDay` on eight
 * parameters that nothing in the app ever read — drift is graded elsewhere,
 * by CONSISTENCY_RULES. The only readers in the whole repository were the
 * tests. A stage-3 audit found alkalinity "graded steady... three times the
 * published limit", fixed it, and verified the fix by reading the same
 * unused constant: a fix and a test agreeing with each other about a number
 * the app never consults. deadcode.mjs cannot see this — the constant IS
 * read, just not by anything that runs.
 *
 * Change from the monolith: each table now lives in its own module, so "read
 * anywhere outside the table's own file" widens to "read anywhere in src/
 * outside the declaring file" — still excluding tests, which is the entire
 * point: a field read only by tests must still fail.
 */
import fs from 'node:fs';
import path from 'node:path';
import { ROOT, listSrcFiles, readAll, rel, matchBracket } from './util.mjs';

const TABLES = {
  STABILITY_RULES: 'src/lib/stability-engine.js',
  CONSISTENCY_RULES: 'src/lib/analytics/time-in-range.js',
  SAFE_BOUNDS: 'src/lib/findings.js',
  KIT_PRECISION: 'src/lib/findings.js',
  CORRECTION_MAX_RATE: 'src/lib/analytics/safe-rate.js',
  DOSE_ADVICE_RULES: 'src/lib/analytics/drift.js',
  DOSE_DRIFT_TRIGGER: 'src/lib/dosing/helpers.js',
};

const files = listSrcFiles();
const entries = readAll(files);
const problems = [];

for (const [table, relPath] of Object.entries(TABLES)) {
  const file = path.join(ROOT, relPath);
  const src = fs.readFileSync(file, 'utf8');
  const m = src.match(new RegExp(`(?:export )?const ${table}\\s*=\\s*\\{`));
  if (!m) { problems.push(`${table}: declaration not found in ${relPath} — table moved, re-point livecheck`); continue; }
  const open = m.index + m[0].length - 1;
  const close = matchBracket(src, open);
  const body = src.slice(open, close + 1);
  const fields = new Set([...body.matchAll(/[{,]\s*(\w+):/g)].map((f) => f[1]));

  // "Outside" = every application module minus the table's own declaration —
  // same file with the declaration text removed, plus every OTHER module.
  const outsideSameFile = src.slice(0, m.index) + src.slice(close + 1);
  const otherFiles = entries.filter((e) => e.path !== file).map((e) => e.src).join('\n');
  const outside = outsideSameFile + '\n' + otherFiles;

  for (const field of [...fields].sort()) {
    if (['why', 'label', 'unit', 'mode', 'displayPer'].includes(field)) continue; // descriptive, not consulted
    const readPattern = new RegExp(`\\.\\s*${field}\\b`);
    if (readPattern.test(outside) || outside.includes(`"${field}"`) || outside.includes(`'${field}'`)) continue;
    problems.push(`${table}.${field}  (${relPath})`);
  }
}

if (problems.length) {
  console.log('FAIL config fields the app never reads:');
  for (const p of problems) console.log(`    ${p}`);
  console.log('    (delete them, or wire them up — a field only tests read is worse than dead)');
  process.exit(1);
}
console.log(`OK   every config field is read by the app (${Object.keys(TABLES).length} tables checked)`);

// ---------------------------------------------------------------------------
// Fields an engine SETS on its result (`out.field = `) that nothing reads.
// `out.previous` was set by assessCalcium alone and read by nothing anywhere
// — a field one copy of three grew, that no consumer asked for.
const ENGINES = {
  assessAlkalinity: 'src/lib/dosing/alkalinity.js',
  assessCalcium: 'src/lib/dosing/calcium.js',
  assessMagnesium: 'src/lib/dosing/helpers.js',
};

function functionBody(src, name) {
  const i = src.indexOf('function ' + name);
  if (i < 0) return null;
  const openParen = src.indexOf('(', i);
  const closeParen = matchBracket(src, openParen);
  const openBrace = src.indexOf('{', closeParen);
  const closeBrace = matchBracket(src, openBrace);
  return src.slice(openBrace, closeBrace + 1);
}

const setFields = {};
const engineSources = {};
for (const [engine, relPath] of Object.entries(ENGINES)) {
  const src = fs.readFileSync(path.join(ROOT, relPath), 'utf8');
  engineSources[engine] = src;
  const body = functionBody(src, engine);
  if (!body) continue;
  for (const m of body.matchAll(/\bout\.(\w+)\s*=(?!=)/g)) {
    (setFields[m[1]] = setFields[m[1]] || new Set()).add(engine);
  }
}

const appCorpus = entries.map((e) => e.src).join('\n');
let testCorpus = '';
for (const dir of ['tests/legacy-port', 'src/test']) {
  const abs = path.join(ROOT, dir);
  if (!fs.existsSync(abs)) continue;
  const walk = (d) => {
    for (const ent of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, ent.name);
      if (ent.isDirectory()) walk(p);
      else if (/\.js$/.test(ent.name)) testCorpus += fs.readFileSync(p, 'utf8');
    }
  };
  walk(abs);
}

// Remove the engine bodies from the "outside" corpus so a field read inside
// the same engine that set it (a working variable) isn't mistaken for a
// consumer — but keep those bodies to check "read by its own engine" below.
let outsideApp = appCorpus;
for (const engine of Object.keys(ENGINES)) {
  const body = functionBody(engineSources[engine], engine);
  if (body) outsideApp = outsideApp.split(body).join('');
}

const orphans = [];
for (const [field, engines] of Object.entries(setFields).sort()) {
  const pattern = new RegExp(`\\.\\s*${field}\\b`);
  if (pattern.test(outsideApp) || pattern.test(testCorpus)) continue;
  let reads = 0, writes = 0;
  for (const engine of engines) {
    const body = functionBody(engineSources[engine], engine) || '';
    reads += (body.match(new RegExp(`\\.\\s*${field}\\b`, 'g')) || []).length;
    writes += (body.match(new RegExp(`out\\.${field}\\s*=(?!=)`, 'g')) || []).length;
  }
  if (reads > writes) continue;
  orphans.push(`out.${field}  (set by ${[...engines].sort().join(', ')})`);
}

if (orphans.length) {
  console.log('FAIL engine result fields nothing reads:');
  for (const o of orphans) console.log(`    ${o}`);
  process.exit(1);
}
console.log(`OK   every engine result field has a reader (${Object.keys(setFields).length} checked)`);
