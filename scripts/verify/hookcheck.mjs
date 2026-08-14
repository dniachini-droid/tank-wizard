#!/usr/bin/env node
/* Ported from legacy/tools/hookcheck.py.
 *
 * A hook called conditionally — once inserted inside the body of the very
 * callback it was meant to run alongside — broke the rules of hooks and threw,
 * and the launch splash could not be dismissed. Nothing else catches this:
 * validate.js resolves identifiers without caring where they sit; the test
 * suites never render.
 *
 * The rule ports unchanged: a hook call must sit at exactly one indent level
 * (2 spaces) inside a top-level function, with no intervening block. Only the
 * top-level-function pattern is widened, from `function`/`const` to also
 * match `export function`.
 */
import { listSrcFiles, readAll } from './util.mjs';

const HOOK = /^(\s*)(use[A-Z]\w*)\(/;
const TOP_LEVEL_FN = /^(?:export\s+)?(function|const)\s+\w+/;

const files = listSrcFiles();
const entries = readAll(files);
const problems = [];
let total = 0;

for (const { rel, src } of entries) {
  const lines = src.split('\n');
  let currentFn = null;
  lines.forEach((line, i) => {
    if (TOP_LEVEL_FN.test(line)) {
      currentFn = line.replace(/^export\s+/, '').split('(')[0].split('=')[0].replace('function ', '').trim();
    }
    const m = line.match(HOOK);
    if (!m) return;
    total++;
    const indent = m[1].length;
    if (indent !== 2) {
      problems.push(`${rel}:${i + 1} in ${currentFn || '?'}: ${m[2]} at indent ${indent} — ${line.trim().slice(0, 60)}`);
    }
  });
}

if (problems.length) {
  console.log('FAIL hooks that do not run on every render:');
  for (const p of problems) console.log('    ' + p);
  process.exit(1);
}
if (total === 0) {
  console.log('FAIL hookcheck: found no hooks at all — the parser is wrong');
  process.exit(1);
}
console.log(`OK   every hook runs on every render (${total} checked)`);
