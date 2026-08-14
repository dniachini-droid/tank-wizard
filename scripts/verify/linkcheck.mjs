#!/usr/bin/env node
/* Ported from legacy/tools/validate.js, parts 3 and 4 only.
 *
 * validate.js's brace-balance and duplicate-top-level-declaration checks
 * (parts 1-2) are SUPERSEDED by `npm run build` — esbuild's parser rejects
 * both a mismatched brace and a duplicate binding in the same module before
 * a single test runs. Demonstrated in .agent/phase5-gate.md.
 *
 * What survives is "a call or a JSX tag that resolves to nothing" — undefined
 * function calls and undefined components. Under one 15,706-line file that
 * was a single flat scope: every top-level name, real or accidental, was
 * visible everywhere, so the original carried an allowlist of prop names its
 * regex scope-builder missed (`knownProps`) and a fixed list of known
 * lucide-react/recharts component names (`known`).
 *
 * Split into 58 ES modules, "resolves to nothing" gets a real answer instead
 * of a guess: a name is defined if it's declared in the file, destructured
 * from a parameter, or imported — and a *local* import (`./x.js`) is only
 * accepted if the target file actually exports that name. That is strictly
 * more precise than the monolith version and needs no hand-maintained
 * allowlist: package imports (react, recharts, lucide-react-alikes) are
 * trusted without inspecting node_modules, exactly as the monolith trusted
 * its fixed `known` component list.
 */
import { listSrcFiles, readAll, rel, importSpecs, resolveImport, allParamGroups, methodDefNames } from './util.mjs';

const KEYWORDS = new Set(['if', 'for', 'while', 'switch', 'catch', 'function', 'return', 'typeof',
  'new', 'in', 'of', 'do', 'else', 'try', 'throw', 'delete', 'void', 'instanceof', 'yield', 'await', 'async']);

const GLOBALS = new Set(['require', 'fetch', 'setTimeout', 'clearTimeout', 'setInterval', 'clearInterval',
  'parseFloat', 'parseInt', 'isNaN', 'isFinite', 'alert', 'confirm', 'prompt', 'eval', 'Boolean', 'Number',
  'String', 'Array', 'Object', 'Math', 'Date', 'JSON', 'Promise', 'Error', 'Blob', 'FileReader', 'Image',
  'RegExp', 'Map', 'Set', 'WeakMap', 'Symbol', 'requestAnimationFrame', 'cancelAnimationFrame',
  'queueMicrotask', 'structuredClone', 'encodeURIComponent', 'decodeURIComponent', 'console', 'window',
  'document', 'navigator', 'localStorage', 'sessionStorage', 'globalThis', 'URL', 'FormData', 'Infinity',
  'NaN', 'undefined', 'super']);

function stripNoiseKeepStructure(src) {
  let code = src
    .replace(/\/\*[\s\S]*?\*\//g, (m) => ' '.repeat(m.length))
    .replace(/\/\/[^\n]*/g, (m) => ' '.repeat(m.length))
    .replace(/`(?:\\.|[^`\\])*`/g, (m) => '`' + ' '.repeat(Math.max(0, m.length - 2)) + '`')
    .replace(/"(?:\\.|[^"\\])*"/g, (m) => '"' + ' '.repeat(Math.max(0, m.length - 2)) + '"');
  // Single-quoted strings deliberately left alone, same reason as the original:
  // JSX prose is full of apostrophes.
  return code;
}

// JSX prose that happens to put a word directly against "(" — "Report photo
// (optional)", "Set target range ({def.unit..." — reads as a call. This is
// the same failure legacy/tools/scopecheck.py hit and solved the same way it
// did: a short, explicit, file-scoped allowlist (its KNOWN_OK) rather than a
// general JSX-text stripper. A general stripper was tried here first — it
// requires telling a JSX tag's closing `>` apart from a `>`/`>=` comparison
// operator by pure regex, and in a file that mixes JS and JSX in one file
// that guess is wrong often enough to blank real code (it briefly reported
// `useEscape`, `dosePlausible` and `CompletionCalendar` — all real, all
// declared — as undefined). Two verified false positives is what an
// allowlist is for.
const PROSE_FALSE_POSITIVES = {
  'src/components/Dashboard.jsx': new Set(['range']), // "Set target range ({def.unit...})"
  'src/components/IcpPanel.jsx': new Set(['photo']),  // "Report photo (optional)"
};

function destructureNames(pattern) {
  const names = new Set();
  for (const part of pattern.split(',')) {
    const cleaned = part.split('=')[0].replace(/[{}[\]]/g, ' ').replace(/\.\.\./g, ' ');
    for (const tok of cleaned.split(/[:\s]+/)) {
      if (/^[A-Za-z_$][\w$]*$/.test(tok)) names.add(tok);
    }
  }
  return names;
}

function topLevelExports(src) {
  const names = new Set();
  for (const m of src.matchAll(/^export\s+(?:default\s+)?(?:async\s+)?function\s+([A-Za-z_$][\w$]*)/gm)) names.add(m[1]);
  for (const m of src.matchAll(/^export\s+(?:const|let|var)\s+([A-Za-z_$][\w$]*)/gm)) names.add(m[1]);
  for (const m of src.matchAll(/^export\s+class\s+([A-Za-z_$][\w$]*)/gm)) names.add(m[1]);
  for (const m of src.matchAll(/^export\s*\{([^}]*)\}/gm)) {
    for (const part of m[1].split(',')) {
      const name = part.trim().split(/\s+as\s+/)[0].trim();
      if (name) names.add(name);
    }
  }
  if (/^export\s+default\s+function\s+\w/m.test(src) === false && /export default/.test(src)) names.add('default');
  return names;
}

function definedNames(code) {
  const defs = new Set();
  for (const m of code.matchAll(/\b(?:async\s+)?function\s+([A-Za-z_$][\w$]*)/g)) defs.add(m[1]);
  for (const m of code.matchAll(/\bclass\s+([A-Za-z_$][\w$]*)/g)) defs.add(m[1]);
  for (const m of code.matchAll(/\b(?:const|let|var)\s+([A-Za-z_$][\w$]*)/g)) defs.add(m[1]);
  for (const m of code.matchAll(/\b(?:const|let|var)\s*\[([^\]]*)\]/g)) destructureNames(m[1]).forEach((n) => defs.add(n));
  for (const m of code.matchAll(/\b(?:const|let|var)\s*\{([^}]*)\}/g)) destructureNames(m[1]).forEach((n) => defs.add(n));
  for (const group of allParamGroups(code)) destructureNames(group).forEach((n) => defs.add(n));
  for (const m of code.matchAll(/\bcatch\s*\(\s*([A-Za-z_$][\w$]*)/g)) defs.add(m[1]);
  methodDefNames(code).forEach((n) => defs.add(n));
  return defs;
}

function jsxComponents(src) {
  return new Set([...src.matchAll(/<([A-Z][\w.]*)[\s/>]/g)].map((m) => m[1].split('.')[0]));
}

function calls(code) {
  const found = new Set();
  for (const m of code.matchAll(/(?:^|[^.\w$'"`])([a-z][A-Za-z0-9_$]{2,})\s*\(/g)) {
    if (!KEYWORDS.has(m[1])) found.add(m[1]);
  }
  return found;
}

const files = listSrcFiles();
const entries = readAll(files);
const exportsByFile = new Map(entries.map((e) => [e.path, topLevelExports(e.src)]));

let fail = false;
const report = [];

for (const { path: p, rel: r, src } of entries) {
  const code = stripNoiseKeepStructure(src);
  const defs = definedNames(code);
  const imported = new Set();
  const badImports = [];

  for (const spec of importSpecs(src)) {
    const target = resolveImport(p, spec);
    const m = src.match(new RegExp(`^import\\s+(?:([\\w$]+)\\s*,?\\s*)?(?:\\{([^}]*)\\})?(?:\\s*\\*\\s*as\\s+([\\w$]+))?\\s*from\\s+['"]${spec.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}['"]`, 'm'));
    if (!m) continue;
    const [, def, named, ns] = m;
    if (def) imported.add(def);
    if (ns) imported.add(ns);
    const namedList = [];
    if (named) {
      for (const part of named.split(',')) {
        const t = part.trim();
        if (!t) continue;
        const local = t.includes(' as ') ? t.split(' as ')[1].trim() : t;
        const remote = t.includes(' as ') ? t.split(' as ')[0].trim() : t;
        if (local) { imported.add(local); namedList.push({ local, remote }); }
      }
    }
    if (!target) continue; // package import — trusted, not statically checked
    const exp = exportsByFile.get(target) || new Set();
    if (def && !exp.has('default')) badImports.push(`default import '${def}' but ${rel(target)} has no default export`);
    for (const { local, remote } of namedList) {
      if (!exp.has(remote) && !exp.has('default')) badImports.push(`'${remote}' imported as ${local === remote ? local : local + ' (as)'} but not exported by ${rel(target)}`);
    }
  }

  const knownDefined = new Set([...defs, ...imported]);
  const prose = PROSE_FALSE_POSITIVES[r] || new Set();
  const undefCalls = [...calls(code)].filter((c) => !knownDefined.has(c) && !GLOBALS.has(c) && !prose.has(c));
  const comps = jsxComponents(src);
  const undefComps = [...comps].filter((c) => !knownDefined.has(c));

  if (badImports.length || undefCalls.length || undefComps.length) {
    fail = true;
    report.push({ file: r, badImports, undefCalls, undefComps });
  }
}

if (fail) {
  console.log('FAIL linkcheck: imports/calls/components that resolve to nothing:');
  for (const { file, badImports, undefCalls, undefComps } of report) {
    for (const b of badImports) console.log(`    ${file}: import — ${b}`);
    if (undefCalls.length) console.log(`    ${file}: undefined calls -> ${undefCalls.join(', ')}`);
    if (undefComps.length) console.log(`    ${file}: undefined components -> ${undefComps.join(', ')}`);
  }
  process.exit(1);
}
console.log(`OK   linkcheck: every call, component and local import resolves (${files.length} modules)`);
