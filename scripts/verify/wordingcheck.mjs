#!/usr/bin/env node
/* Ported from legacy/tools/wordingcheck.py — unchanged logic, new path.
 *
 * Every dose claim in the tank summary must repeat the dosing engine's own
 * words. The summary and the Dosing Wizard describe the same state; when each
 * writes its own sentence they drift, invisibly, until someone reads both
 * screens on the same day. `buildBriefing` now lives in
 * src/lib/narrative-engine.js — this is the only automated enforcement of
 * wizard-states.md §7 and §12 that has ever existed.
 */
import fs from 'node:fs';
import path from 'node:path';
import { ROOT, matchBracket } from './util.mjs';

const file = path.join(ROOT, 'src', 'lib', 'narrative-engine.js');
const src = fs.readFileSync(file, 'utf8');

const m = src.match(/\nexport function buildBriefing\(/);
if (!m) { console.log('FAIL wordingcheck: buildBriefing not found'); process.exit(1); }
const start = m.index;
const open = src.indexOf('{', start);
const close = matchBracket(src, open);
const body = src.slice(start, close + 1);

const bad = [];
let checked = 0;
for (const a of body.matchAll(/add\(\{[\s\S]{0,600}?\}\);/g)) {
  const block = a[0];
  const ident = block.match(/id:\s*([^,\n]+)/);
  const claim = block.match(/claim:\s*([^\n]+?),?\s*$/m);
  if (!ident || !claim) continue;
  const identS = ident[1].trim();
  const claimS = claim[1].trim().replace(/,$/, '');
  if (!identS.includes('"dose:"')) continue;
  checked++;
  if (!/^d\.headline$/.test(claimS)) bad.push([identS, claimS.slice(0, 70)]);
}

if (bad.length) {
  console.log('FAIL dose claims that do not repeat the engine\'s wording:');
  for (const [i, c] of bad) console.log(`    ${i}: ${c}`);
  process.exit(1);
}
console.log(`OK   dose claims repeat the engine's wording (${checked} checked)`);
