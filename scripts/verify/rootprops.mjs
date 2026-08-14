#!/usr/bin/env node
/* Ported from legacy/tools/rootprops.py.
 *
 * Checks that every value passed as a prop from the app root actually exists
 * in the root's own scope. Written after a blank screen: Tank was handed
 * `overview`, `sparkRowsByParam` and `stabilityByParam` from the root, but
 * those were computed inside Dashboard's own body and had never existed at
 * the root. validate.js/linkcheck do not catch it: the names are declared
 * *somewhere*, just not in the scope doing the passing.
 *
 * Change from the monolith: the root is no longer `export default function
 * ReefConsole` — the split introduced `ReefConsole`, a thin wrapper that
 * renders `<ReefConsoleInner />` with zero props, and `ReefConsoleInner`,
 * which does everything the monolith's root did. This checks the function
 * that actually passes props: `ReefConsoleInner`.
 */
import fs from 'node:fs';
import path from 'node:path';
import { ROOT, rel } from './util.mjs';

const file = path.join(ROOT, 'src', 'App.jsx');
const src = fs.readFileSync(file, 'utf8');

const ROOT_FN = 'export function ReefConsoleInner';
const start = src.indexOf(ROOT_FN);
if (start < 0) {
  console.log(`FAIL rootprops: ${ROOT_FN} not found — the root moved, re-point this checker`);
  process.exit(1);
}
const m = src.slice(start).match(/\n(?=export function [A-Za-z])/);
const root = src.slice(start, m ? start + m.index : src.length);

const declared = new Set();
for (const dm of root.matchAll(/\b(?:const|let|var|function)\s+([A-Za-z_$][\w$]*)/g)) declared.add(dm[1]);
for (const dm of root.matchAll(/const\s*\[\s*([A-Za-z_$][\w$]*)\s*,\s*([A-Za-z_$][\w$]*)\s*\]/g)) { declared.add(dm[1]); declared.add(dm[2]); }
for (const dm of root.matchAll(/const\s*\{([^}]*)\}\s*=/g)) {
  for (const n of dm[1].split(',')) {
    const name = n.split(':').pop().split('=')[0].trim();
    if (name) declared.add(name);
  }
}
// Imports are declared too — the monolith had no imports at all, so this is
// new: a value imported and re-passed down is legitimate, not orphaned.
for (const im of root.matchAll(/^import\s+(?:([\w$]+)\s*,?\s*)?(?:\{([^}]*)\})?\s*(?:from|;)/gm)) {
  if (im[1]) declared.add(im[1]);
  if (im[2]) for (const n of im[2].split(',')) {
    const local = n.includes(' as ') ? n.split(' as ')[1].trim() : n.trim();
    if (local) declared.add(local);
  }
}

const used = new Set();
for (const g of root.matchAll(/\{\.\.\.\{([^}]*)\}\}/g)) {
  for (const n of g[1].split(',')) {
    const t = n.trim();
    if (/^[A-Za-z_$][\w$]*$/.test(t)) used.add(t);
  }
}
for (const m2 of root.matchAll(/\w+=\{([A-Za-z_$][\w$]*)\}/g)) used.add(m2[1]);

const builtin = new Set(['true', 'false', 'null', 'undefined', 'Math', 'Object', 'Array', 'JSON',
  'String', 'Number', 'Boolean', 'Date', 'window', 'document', 'console']);
const missing = [...used].filter((n) => !declared.has(n) && !builtin.has(n) && n[0] !== n[0].toUpperCase())
  .sort();

if (missing.length) {
  console.log('FAIL values passed from the root but never declared there:');
  for (const n of missing) console.log(`    ${n}`);
  process.exit(1);
}
console.log(`OK   root passes only values it declares (${used.size} checked, ${rel(file)})`);
