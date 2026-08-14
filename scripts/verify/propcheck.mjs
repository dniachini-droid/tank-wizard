#!/usr/bin/env node
/* Ported from legacy/tools/propcheck.py.
 *
 * Compares props passed to a component against the props it destructures. A
 * prop passed but not destructured is `undefined` inside the component —
 * exactly how the Tasks tab broke. The monolith scanned one file top to
 * bottom; components are now one-per-file (mostly), so a component's JSX
 * usage can be in a different file from its signature. Matching is still by
 * tag name, not a real import graph — two components sharing a name would be
 * a false negative — but every component in this tree already has a globally
 * unique name, so the coverage is the same as the monolith's, not narrower.
 */
import { listSrcFiles, readAll, matchBracket, allParamGroups } from './util.mjs';

function componentSignatures(entries) {
  const sigs = {};
  for (const { src } of entries) {
    for (const m of src.matchAll(/export function ([A-Z]\w*)\(\{/g)) {
      const openBrace = m.index + m[0].length - 1;
      const close = matchBracket(src, openBrace);
      if (close < 0) continue;
      const body = src.slice(openBrace + 1, close);
      const props = new Set();
      let depth = 0, token = '';
      for (const ch of body) {
        if ('([{'.includes(ch)) depth++;
        else if (')]}'.includes(ch)) depth--;
        if (ch === ',' && depth === 0) { props.add(token.trim()); token = ''; }
        else token += ch;
      }
      props.add(token.trim());
      const clean = new Set();
      for (let p of props) {
        p = p.split('=')[0].split(':')[0].trim();
        if (p && /^\w+$/.test(p)) clean.add(p);
      }
      sigs[m[1]] = clean;
    }
  }
  return sigs;
}

const files = listSrcFiles();
const entries = readAll(files);
const sigs = componentSignatures(entries);

const problems = [];

for (const { rel, src } of entries) {
  for (const m of src.matchAll(/<([A-Z]\w*)\s([^>]*?)\/?>/gs)) {
    const [, name, attrs] = m;
    if (!(name in sigs)) continue;
    if (attrs.includes('{...')) continue; // spread props can't be checked statically
    const passed = new Set([...attrs.matchAll(/(\w+)=\{/g)].map((a) => a[1]));
    for (const a of attrs.matchAll(/(\w+)="/g)) passed.add(a[1]);
    passed.delete('key');
    const missing = [...passed].filter((p) => !sigs[name].has(p));
    if (missing.length) {
      const line = src.slice(0, m.index).split('\n').length;
      problems.push(`${rel}:${line} ${name}: passed but not received -> ${missing.sort().join(', ')}`);
    }
  }
}

// The reverse direction: an on* handler called in a component's own body but
// never received as a prop and never declared locally is `undefined` the
// moment it's called.
for (const { rel, src } of entries) {
  for (const m of src.matchAll(/export function ([A-Z]\w*)\(\{/g)) {
    const name = m[1];
    if (!(name in sigs)) continue;
    const openBrace = m.index + m[0].length - 1;
    const closeBrace = matchBracket(src, openBrace);
    const fnStart = src.indexOf(') {', closeBrace);
    if (fnStart < 0) continue;
    const bodyOpen = fnStart + 2;
    const bodyClose = matchBracket(src, bodyOpen);
    if (bodyClose < 0) continue;
    const body = src.slice(bodyOpen, bodyClose);
    const used = new Set([...body.matchAll(/\b(on[A-Z]\w*)\s*[({),.]/g)].map((x) => x[1]));
    const declared = new Set();
    for (const g of allParamGroups(body)) {
      for (const part of String(g).split(',')) {
        const t = part.split('=')[0].replace(/[{}[\]]/g, ' ').trim();
        if (/^on[A-Z]\w*$/.test(t)) declared.add(t);
      }
    }
    for (const dm of body.matchAll(/(?:const|let|var|function)\s+(on[A-Z]\w*)/g)) declared.add(dm[1]);
    const called = new Set([...body.matchAll(/\b(on[A-Z]\w*)\s*\(/g)].map((x) => x[1]));
    const missing = [...used].filter((u) => !sigs[name].has(u) && !declared.has(u) && called.has(u));
    if (missing.length) {
      problems.push(`${rel} ${name}: calls handlers it never receives -> ${[...new Set(missing)].sort().join(', ')}`);
    }
  }
}

if (problems.length) {
  console.log('FAIL props passed but never destructured, or handlers called but never received:');
  for (const p of [...new Set(problems)].sort()) console.log('    ' + p);
  process.exit(1);
}
console.log(`OK   component props match their signatures (${Object.keys(sigs).length} components)`);
