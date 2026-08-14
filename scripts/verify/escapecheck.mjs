#!/usr/bin/env node
/* Ported from legacy/tools/escapecheck.py.
 *
 * Every full-screen overlay must close on Escape. One modal of ten once had
 * a hand-rolled keydown listener and the other nine had nothing, so a
 * keyboard user could open a sheet with no way out. Handling is a shared
 * `useEscape` hook (src/lib/backup.jsx); this checks every component
 * rendering `fixed inset-0` calls it.
 *
 * Change from the monolith: component boundaries were "the next `function `
 * line in a 15,706-line file" there; components are mostly one per file now,
 * but several files (Tasks.jsx, TodayPanel.jsx, ...) still define more than
 * one, so the same within-file boundary scan is kept, just run per file
 * instead of once globally.
 */
import fs from 'node:fs';
import path from 'node:path';
import { ROOT, listSrcFiles } from './util.mjs';

const files = listSrcFiles().filter((f) => f.endsWith('.jsx'));
let useEscapeExists = false;
for (const f of files) {
  if (fs.readFileSync(f, 'utf8').includes('function useEscape(')) { useEscapeExists = true; break; }
}
if (!useEscapeExists) {
  console.log('FAIL escapecheck: the useEscape hook is gone');
  process.exit(1);
}

const problems = [];
let overlayCount = 0;

for (const file of files) {
  const src = fs.readFileSync(file, 'utf8');
  const rel = path.relative(ROOT, file);
  const lines = src.split('\n');
  const starts = [];
  lines.forEach((l, i) => {
    if (/^export function [A-Z]\w*\(/.test(l)) starts.push([i, l.split('(')[0].replace('export function ', '').trim()]);
  });
  const ownerOf = (lineNo) => {
    let name = null;
    for (const [i, n] of starts) { if (i < lineNo) name = n; else break; }
    return name;
  };
  const bodyOf = (name) => {
    const start = starts.find(([, n]) => n === name)?.[0];
    if (start === undefined) return '';
    const next = starts.find(([i]) => i > start)?.[0] ?? lines.length;
    return lines.slice(start, next).join('\n');
  };

  const overlays = new Set();
  lines.forEach((line, i) => {
    if (line.includes('fixed inset-0')) {
      const name = ownerOf(i);
      if (name) overlays.add(name);
    }
  });
  overlayCount += overlays.size;

  for (const name of [...overlays].sort()) {
    if (!bodyOf(name).includes('useEscape(')) problems.push(`${rel} ${name}`);
  }
}

if (overlayCount === 0) {
  console.log('FAIL escapecheck: found no overlays at all — the parser is wrong');
  process.exit(1);
}
if (problems.length) {
  console.log('FAIL overlays that cannot be closed with Escape:');
  for (const p of problems) console.log(`    ${p}`);
  process.exit(1);
}
console.log(`OK   every overlay closes on Escape (${overlayCount} checked)`);
