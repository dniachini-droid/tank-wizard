#!/usr/bin/env node
/* Ported from legacy/tools/deadcode.py.
 *
 * Fails on code nothing references. This is the shape that hid a real crash:
 * CA_PER_DKH_LO was used in seven places and declared in none, and every
 * suite passed because nothing compiled that path. Reports three things:
 * components defined but never rendered, functions defined but never
 * referenced, and upper-case constants declared but never read — plus the
 * inverse, a SCREAMING_SNAKE name used but declared nowhere.
 *
 * Change from the monolith: "referenced" is now counted across the whole
 * `src/` corpus, not one file — a helper exported from module A and used only
 * from module B is not dead. This is a text-frequency count across every
 * module concatenated, not real import resolution, so two different symbols
 * that happen to share a name in different files could mask each other (one
 * dead, one live, the count reads "used"). Cheap to state, expensive to fix
 * properly (a real per-symbol import graph) — flagged as a known coverage
 * gap rather than silently assumed away. No name collision was found in this
 * tree when this was written; livecheck.mjs, which does resolve imports for
 * its narrower set of tables, is the fallback for the fields that matter most.
 */
import { listSrcFiles, readAll } from './util.mjs';

const files = listSrcFiles();
const entries = readAll(files);
const corpus = entries.map((e) => e.src).join('\n');
const countIn = (text, name) => (text.match(new RegExp(`(?<![\\w.])${name}(?![\\w])`, 'g')) || []).length;

const problems = [];

// Components defined but never rendered anywhere in the tree.
const components = new Set();
for (const { src } of entries) for (const m of src.matchAll(/^export function ([A-Z]\w+)\(/gm)) components.add(m[1]);
const rendered = new Set([...corpus.matchAll(/<([A-Z]\w+)[\s/>]/g)].map((m) => m[1]));
// The mount point (src/main.jsx) is plain JS, not JSX: it mounts the root via
// `React.createElement(ReefConsole)`, not a `<ReefConsole />` tag. The
// monolith had no separate entry file at all, so this pattern is genuinely
// new rather than a gap the split opened.
for (const m of corpus.matchAll(/React\.createElement\(\s*([A-Z]\w+)/g)) rendered.add(m[1]);
for (const c of [...components].sort()) {
  if (!rendered.has(c)) problems.push(`component never rendered: ${c}`);
}

// Functions defined but referenced nowhere else in the tree (their own
// declaration is the only occurrence).
const functions = new Set();
for (const { src } of entries) for (const m of src.matchAll(/^export function ([a-z]\w+)\(/gm)) functions.add(m[1]);
for (const fn of [...functions].sort()) {
  if (countIn(corpus, fn) <= 1) problems.push(`function never referenced: ${fn}`);
}

// SCREAMING_SNAKE constants declared but read nowhere else.
const consts = new Set();
for (const { src } of entries) for (const m of src.matchAll(/^export const ([A-Z_][A-Z0-9_]*)\s*=/gm)) consts.add(m[1]);
for (const c of [...consts].sort()) {
  if (countIn(corpus, c) <= 1) problems.push(`constant never read: ${c}`);
}

// The inverse: used everywhere, declared nowhere in this tree.
const candidates = new Set([...corpus.matchAll(/\b([A-Z][A-Z0-9]*(?:_[A-Z0-9]+)+)\b/g)].map((m) => m[1]));
const declaredAnywhere = new Set();
for (const { src } of entries) for (const m of src.matchAll(/(?:^|\n)\s*(?:export\s+)?(?:const|let|var)\s+([A-Z_][A-Z0-9_]*)\b/g)) declaredAnywhere.add(m[1]);
for (const name of [...candidates].sort()) {
  const uses = countIn(corpus, name);
  if (uses >= 2 && !declaredAnywhere.has(name)) problems.push(`used but never declared: ${name} (${uses} uses)`);
}

// Local `useMemo` values computed and never read again — the shape the
// monolith didn't have to check for. Its whole app was one function body, so
// every top-level `const` was already covered by the checks above; splitting
// into 58 modules moved real computation into component-local scope, where a
// value can be memoed, threaded through nothing, and never used. This is
// exactly `.agent/five-decisions.md`'s known `doseAdvice` finding
// (Insights.jsx:108, Dashboard.jsx:298) — named here as the check this port
// must reproduce, not invent.
for (const { rel, src } of entries) {
  for (const m of src.matchAll(/^export function ([A-Z]\w*)\(/gm)) {
    const start = m.index;
    const next = src.indexOf('\nexport function ', start + 1);
    const body = src.slice(start, next > 0 ? next : src.length);
    for (const dm of body.matchAll(/\bconst\s+(\w+)\s*=\s*useMemo\(/g)) {
      const name = dm[1];
      if (countIn(body, name) <= 1) {
        const line = src.slice(0, start + dm.index).split('\n').length;
        problems.push(`${rel}:${line} ${m[1]}: '${name}' computed (useMemo) but never read again`);
      }
    }
  }
}

if (problems.length) {
  console.log('FAIL dead or undeclared code:');
  for (const p of problems) console.log(`    ${p}`);
  process.exit(1);
}
console.log(`OK   no dead code (${components.size} components, all rendered)`);
