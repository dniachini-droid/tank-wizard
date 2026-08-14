#!/usr/bin/env node
/* Ported from legacy/tools/motioncheck.py.
 *
 * Everything that animates must stop when the system asks it to. Ten
 * animations once sat outside the prefers-reduced-motion block; a partial
 * block is arguably worse than none, since the motion left over is precisely
 * what nobody thought to check.
 *
 * Change from the monolith: reads src/styles/*.css directly instead of a
 * built HTML file's embedded stylesheet. There is no single inlined
 * stylesheet under Tailwind + PostCSS to read post-build, and source is
 * strictly more useful here — no build step needed before this can run.
 */
import fs from 'node:fs';
import path from 'node:path';
import { ROOT } from './util.mjs';

const cssDir = path.join(ROOT, 'src', 'styles');
const cssFiles = fs.readdirSync(cssDir).filter((f) => f.endsWith('.css'));
const css = cssFiles.map((f) => fs.readFileSync(path.join(cssDir, f), 'utf8')).join('\n');

const animated = {};
for (const m of css.matchAll(/\.([\w-]+)\s*\{([^}]*)\}/g)) {
  const [, cls, body] = m;
  if (/animation:\s*\w/.test(body)) {
    const found = body.match(/animation:\s*([\w-]+)/);
    animated[cls] = found ? found[1] : '?';
  }
}

const guarded = new Set();
for (const block of css.matchAll(/@media \(prefers-reduced-motion[^{]*\{([\s\S]*?)\n\s*\}\s*\n/g)) {
  for (const c of block[1].matchAll(/\.([\w-]+)/g)) guarded.add(c[1]);
}

if (!Object.keys(animated).length) {
  console.log('FAIL motioncheck: found no animations at all — the parser is wrong');
  process.exit(1);
}
if (!guarded.size) {
  console.log('FAIL motioncheck: no prefers-reduced-motion block');
  process.exit(1);
}

const missing = Object.keys(animated).filter((c) => !guarded.has(c)).sort();
if (missing.length) {
  console.log('FAIL animations that ignore prefers-reduced-motion:');
  for (const cls of missing) console.log(`    .${cls} (${animated[cls]})`);
  process.exit(1);
}
console.log(`OK   every animation respects reduced motion (${Object.keys(animated).length} checked, ${cssFiles.length} CSS files)`);
