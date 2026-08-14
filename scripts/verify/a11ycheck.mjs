#!/usr/bin/env node
/* Ported from legacy/tools/a11ycheck.py — logic unchanged, source unchanged
 * from motioncheck.mjs's reasoning: reads src/styles/*.css directly rather
 * than a built HTML file, since there is no single post-build stylesheet to
 * read anymore and source is the more direct source of truth.
 *
 * Contrast and focus: the two things that decide whether the app is usable.
 * Text colours were once between 2.55 and 3.93 against the page background,
 * under the 4.5:1 normal text needs, and there was no focus indicator at
 * all — someone navigating by keyboard could not see where they were.
 */
import fs from 'node:fs';
import path from 'node:path';
import { ROOT } from './util.mjs';

const cssDir = path.join(ROOT, 'src', 'styles');
const cssFiles = fs.readdirSync(cssDir).filter((f) => f.endsWith('.css'));
const css = cssFiles.map((f) => fs.readFileSync(path.join(cssDir, f), 'utf8')).join('\n');

const PAGE_BG = '#F3F7F6';
const ALLOWED = {
  '#FFFFFF': 'on a dark surface',
  '#EAFFFB': 'the launch splash, which is dark',
  '#F3F7F6': 'the page background itself, used as text only on dark',
};

const rgb = (h) => { h = h.replace('#', ''); return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16)); };
const luminance = ([r, g, b]) => {
  const ch = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
  const [cr, cg, cb] = [ch(r), ch(g), ch(b)];
  return 0.2126 * cr + 0.7152 * cg + 0.0722 * cb;
};
const contrast = (a, b) => {
  const la = luminance(rgb(a)), lb = luminance(rgb(b));
  const hi = Math.max(la, lb), lo = Math.min(la, lb);
  return (hi + 0.05) / (lo + 0.05);
};

const TEXT_COLOURS = [...new Set([...css.matchAll(/(?<![-\w])color:\s*(#[0-9A-Fa-f]{6})\b/g)].map((m) => m[1]))].sort();

const bad = [];
for (const colour of TEXT_COLOURS) {
  if (colour.toUpperCase() in ALLOWED) continue;
  const r = contrast(colour, PAGE_BG);
  if (r < 4.5) bad.push([colour, r]);
}

if (bad.length) {
  console.log('FAIL text colours below 4.5:1 against the page:');
  for (const [colour, r] of bad.sort((a, b) => a[1] - b[1])) console.log(`    ${colour}  ${r.toFixed(2)}:1`);
  process.exit(1);
}

if (!css.includes('focus-visible')) {
  console.log('FAIL no :focus-visible rule — keyboard focus is invisible');
  process.exit(1);
}
if (!/:focus-visible\s*\{[^}]*outline:\s*(?!none)/.test(css)) {
  console.log('FAIL :focus-visible exists but declares no visible outline');
  process.exit(1);
}

console.log(`OK   contrast and focus (${TEXT_COLOURS.length} text colours, focus ring present, ${cssFiles.length} CSS files)`);
