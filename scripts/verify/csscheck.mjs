#!/usr/bin/env node
/* Ported from legacy/tools/csscheck.py, with changes — routine flagged this
 * as the checker most likely not to port, and half of it isn't: the "every
 * Tailwind utility has a rule" question does not exist here, because
 * Tailwind generates rules for the utility classes it recognises on demand
 * and purges the rest at build time — there is no fixed stylesheet where a
 * utility class could go unstyled.
 *
 * What Tailwind's build does NOT check is the other half: hand-authored
 * classes (`brief-*`, `sb-*`, `rc-*`, `sp-*`, ...) are still real, still
 * live in src/styles/*.css, not generated, not purged, and a typo in either
 * direction — a className with no rule, a rule nothing renders — ships
 * silently. That's the same fault csscheck.py was written for (it caught
 * `sb-swatch` styled by an element selector while the markup named a class,
 * working by accident). Reading source directly instead of built HTML is a
 * strict improvement, not a cost: no build step is needed to catch a typo
 * introduced in either file before it ever compiles.
 *
 * Also widened from the monolith's fixed custom-class prefix list
 * (`brief|strip|sb|el|hero|param-row|session`) to "not a recognised Tailwind
 * pattern" for BOTH directions — the original only used that exclusion for
 * classes found in use; the unused-rule side still filtered through the
 * fixed prefix list, which is the exact "whole class family invisible"
 * failure mode the docstring describes, just left unfixed on one side.
 */
import fs from 'node:fs';
import path from 'node:path';
import { ROOT, listSrcFiles, readAll } from './util.mjs';

const TAILWIND = new RegExp(
  '^(?:' +
  '[a-z-]+:' +                    // responsive / state prefixes
  '|-?(?:m|p)[trblxy]?-' +
  '|(?:w|h|min-w|min-h|max-w|max-h|inset|top|right|bottom|left|z)-' +
  '|(?:flex|grid|col|row|gap|order|basis|grow|shrink)(?:-|$)' +
  '|(?:items|justify|content|self|place)-' +
  '|(?:text|font|leading|tracking|whitespace|break|truncate|tabular)(?:-|$)' +
  '|(?:bg|border|rounded|ring|shadow|opacity|outline|divide)(?:-|$)' +
  '|(?:absolute|relative|fixed|sticky|static|block|inline|hidden|table|contents)$' +
  '|(?:overflow|object|cursor|pointer-events|select|resize|appearance)(?:-|$)' +
  '|(?:transition|duration|ease|delay|animate|transform|scale|rotate|translate|origin)(?:-|$)' +
  '|(?:space|backdrop|filter|blur|list|align|uppercase|lowercase|capitalize|italic|underline)(?:-|$)' +
  '|(?:sr-only|not-sr-only|antialiased|shrink|grow|isolate|mix-blend)(?:-|$)' +
  '|(?:aspect|inline-block|inline-flex|inline-grid|float|clear|box|container)(?:-|$)' +
  ')'
);

const files = listSrcFiles();
const entries = readAll(files.filter((f) => f.endsWith('.jsx')));

const used = new Set();
for (const { src } of entries) {
  for (const m of src.matchAll(/className="([^"{]*)"/g)) m[1].split(/\s+/).forEach((c) => c && used.add(c));
  for (const m of src.matchAll(/className=\{`([^`]*)`\}/g)) {
    const bodyStr = m[1];
    // Only strings in ternary-branch position (`? "x" : "y"`) count as class
    // literals — an unqualified `"([^"]*)"` scan also catches a plain string
    // comparison inside the same expression (`status === "ok" ? ... : ...`)
    // and reads its value as a class name.
    for (const lit of bodyStr.matchAll(/[?:]\s*"([^"]*)"/g)) lit[1].split(/\s+/).forEach((c) => c && used.add(c));
    bodyStr.replace(/\$\{[^}]*\}/g, ' ').split(/\s+/).forEach((c) => c && used.add(c));
  }
  for (const m of src.matchAll(/className=\{([^`}]*\?[^}]*)\}/g)) {
    for (const lit of m[1].matchAll(/[?:]\s*"([^"]*)"/g)) lit[1].split(/\s+/).forEach((c) => c && used.add(c));
  }
}

const cssDir = path.join(ROOT, 'src', 'styles');
const cssFiles = fs.readdirSync(cssDir).filter((f) => f.endsWith('.css')).map((f) => path.join(cssDir, f));
const css = cssFiles.map((f) => fs.readFileSync(f, 'utf8')).join('\n');

const custom = [...used].filter((c) => !TAILWIND.test(c)).sort();
const missing = custom.filter((c) => !css.includes('.' + c));

// Every hand-authored selector (i.e. not a Tailwind pattern) declared in the
// stylesheet — both sides of the comparison now use the same exclusion rule.
const declaredSelectors = new Set([...css.matchAll(/\.([a-zA-Z][\w-]*)\s*[,{:]/g)].map((m) => m[1]));
const defined = [...declaredSelectors].filter((d) => !TAILWIND.test(d)).sort();
const unused = defined.filter((d) => !used.has(d));

const problems = [];
for (const c of missing) problems.push(`class used with no CSS rule: ${c}`);
for (const d of unused) problems.push(`CSS rule never used: ${d}`);

if (problems.length) {
  console.log('FAIL stylesheet and markup disagree:');
  for (const p of problems) console.log(`    ${p}`);
  process.exit(1);
}
console.log(`OK   stylesheet matches markup (${custom.length} custom classes, ${cssFiles.length} CSS files)`);
