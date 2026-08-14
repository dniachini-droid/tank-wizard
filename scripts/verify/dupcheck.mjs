#!/usr/bin/env node
/* Ported from legacy/tools/dupcheck.py.
 *
 * Flags substantial logic typed out more than once. This is how
 * correctionInProgress ended up wired into alkalinity alone, and how a
 * score's safety cap was applied in one place while another recomputed it
 * from its own copy of the formula — a fix landing in one copy while the
 * others were quietly left behind. Deliberately coarse: whole lines of real
 * logic appearing verbatim in two or more functions; short lines, boilerplate
 * and comments ignored.
 *
 * Change from the monolith: functions are compared across the whole `src/`
 * tree, not within one file — the split turned "two functions in one file"
 * into "two functions in two files", and the fault this guards against
 * (a fix landing in one copy, not the other) does not care which.
 */
import { listSrcFiles, readAll, matchBracket } from './util.mjs';

// Pairs permitted to look alike, with the reason — ported verbatim.
const ALLOWED = new Map([
  ['solveAlkEffect|solveSlowEffect', 'alkalinity genuinely differs — its own settling window and anomaly guard'],
  ['regressionSlope|regressionWithError', 'one returns the error term, and sharing would cost a branch in a hot path'],
  ['computeElementConsumption|computeNutrientProduction', 'opposite signs on the same shape; merging obscured which was which'],
  ['computeDemandSeries|computeElementConsumption', 'same'],
  ['computeDemandSeries|computeNutrientProduction', 'same'],
  ['computeControl|gradeSpread', 'small shared idiom, not shared logic'],
  ['computeControl|computeStability', 'small shared idiom, not shared logic'],
]);
const THRESHOLD = 8; // shared lines before a pair is worth questioning
const pairKey = (a, b) => [a, b].sort().join('|');

function bodies(entries) {
  const out = {};
  for (const { rel, src } of entries) {
    for (const m of src.matchAll(/\nexport function (\w+)\(/g)) {
      const name = m[1];
      const open = src.indexOf('{', m.index);
      const close = matchBracket(src, open);
      if (close < 0) continue;
      out[name] = { rel, body: src.slice(m.index, close + 1) };
    }
  }
  return out;
}

const SKIP = /^(\}|\{|\)|\/\/|\/\*|\*|return;?$|const \w+ = \w+;$)/;
const norm = (l) => l.replace(/\s+/g, ' ').trim();

const files = listSrcFiles();
const entries = readAll(files);
const fnBodies = bodies(entries);

const lineMap = new Map();
for (const [fn, { body }] of Object.entries(fnBodies)) {
  for (const raw of body.split('\n')) {
    const line = norm(raw);
    if (line.length < 40 || SKIP.test(line)) continue;
    if (!lineMap.has(line)) lineMap.set(line, new Set());
    lineMap.get(line).add(fn);
  }
}

const pairs = new Map();
for (const fns of lineMap.values()) {
  if (fns.size < 2) continue;
  const ordered = [...fns].sort();
  for (let i = 0; i < ordered.length; i++) {
    for (let j = i + 1; j < ordered.length; j++) {
      const k = pairKey(ordered[i], ordered[j]);
      pairs.set(k, (pairs.get(k) || 0) + 1);
    }
  }
}

const flagged = [...pairs.entries()].filter(([k, n]) => n >= THRESHOLD && !ALLOWED.has(k));

if (flagged.length) {
  console.log('FAIL logic duplicated across functions:');
  for (const [k, n] of flagged.sort((a, b) => b[1] - a[1])) {
    const [a, b] = k.split('|');
    console.log(`    ${n} identical lines: ${a} (${fnBodies[a].rel}) <-> ${b} (${fnBodies[b].rel})`);
  }
  console.log('    Share it, or add the pair to ALLOWED with the reason.');
  process.exit(1);
}
console.log(`OK   no unexplained duplication (${pairs.size} function pairs compared, ${Object.keys(fnBodies).length} functions)`);
