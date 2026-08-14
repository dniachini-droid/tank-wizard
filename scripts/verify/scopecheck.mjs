#!/usr/bin/env node
/* Ported from legacy/tools/scopecheck.py.
 *
 * Finds identifiers used in a component's JS body — the hooks and derived
 * values above `return (` — that are never declared. This is what caught
 * "Can't find variable: editing" and a blank tab. Deliberately scoped to
 * components only, not engine functions: an undeclared read in an engine
 * throws the moment golden/protocols/run_all exercise it, so the behavioural
 * suites already guard that path. A component can go a long time unexercised
 * because nothing renders it.
 *
 * Change from the monolith: a file's own imports now count as declared, same
 * as the monolith's flat top-level scope counted every other top-level name
 * as declared regardless of where it sat in the file.
 */
import { listSrcFiles, readAll, importedNames } from './util.mjs';

const BUILTINS = new Set(['React', 'Math', 'Object', 'Array', 'Number', 'String', 'JSON', 'Date', 'Set',
  'Map', 'Promise', 'Error', 'console', 'window', 'document', 'navigator', 'fetch', 'setTimeout',
  'clearTimeout', 'setInterval', 'clearInterval', 'requestAnimationFrame', 'cancelAnimationFrame',
  'parseInt', 'parseFloat', 'isNaN', 'isFinite', 'Blob', 'FileReader', 'URL', 'encodeURIComponent',
  'decodeURIComponent', 'localStorage', 'sessionStorage', 'structuredClone', 'queueMicrotask', 'Infinity',
  'NaN', 'undefined', 'null', 'true', 'false', 'this', 'super', 'arguments', 'globalThis', 'Boolean',
  'Symbol']);
const KEYWORDS = new Set(['const', 'let', 'var', 'function', 'return', 'if', 'else', 'for', 'while', 'do',
  'switch', 'case', 'break', 'continue', 'new', 'typeof', 'instanceof', 'delete', 'void', 'in', 'of', 'try',
  'catch', 'finally', 'throw', 'class', 'extends', 'static', 'async', 'await', 'yield', 'export', 'import',
  'default', 'from', 'as']);

function stripNoise(t) {
  return t
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .replace(/(?<=^|\n)\s*\/\/[^\n]*/g, ' ')
    .replace(/\/\/[^\n]*$/gm, ' ')
    .replace(/"(?:\\.|[^"\\])*"/g, '""')
    .replace(/'(?:\\.|[^'\\])*'/g, "''")
    .replace(/`(?:\\.|[^`\\])*`/g, '``');
}

// Verified false positives: destructuring patterns and JSX prose this simple
// parser cannot model. Ported verbatim from legacy scopecheck.py's KNOWN_OK,
// re-keyed to whichever file each component now lives in; unmatched entries
// are dropped below with a note, not carried as dead weight.
const KNOWN_OK = {
  CompletionCalendar: ['a', 'c', 'start', 'weeks'],
  DeleteButton: ['className', 'e', 'style'],
  ZoomableLineChart: ['onTouchMove', 'r', 'values'],
  ParamHistoryModal: ['windowStats'],
  TestLab: ['def', 'key'],
  LaunchSplash: ['b'],
  CoralClump: ['b'],
  CorrectionPanel: ['and', 'back', 'complete', 'day', 'dose', 'go', 'it', 'mL', 'running', 'to'],
  ReminderSheet: ['intervalNum'],
  LogResultPopup: ['t', 'i', 'timers'],
  TaskDonePopup: ['a', 'avg', 'b', 't'],
  IcpResultPopup: ['moves', 'pct', 'was'],
};

const files = listSrcFiles();
const entries = readAll(files);
const problems = [];
const usedAllowlist = new Set();

for (const { rel, src } of entries) {
  const toplevel = new Set([...src.matchAll(/^(?:export\s+)?(?:async\s+)?(?:function|const|let|var|class)\s+(\w+)/gm)].map((m) => m[1]));
  const imported = importedNames(src);

  for (const m of src.matchAll(/\nexport function ([A-Z]\w*)\(\{([^)]*?)\}\)\s*\{/gs)) {
    const [, name, sig] = m;
    const start = m.index + m[0].length;
    const nxt = src.indexOf('\nexport function ', start);
    let body = src.slice(start, nxt > 0 ? nxt : src.length);
    body = stripNoise(body);
    const m2 = body.match(/\n  return \(/);
    if (!m2) continue;
    let js = body.slice(0, m2.index);
    js = js.replace(/<\/?[A-Za-z][^<>]*>/g, ' ');

    const props = new Set([...sig.matchAll(/\b(\w+)\b/g)].map((x) => x[1]));
    const declared = new Set([...js.matchAll(/(?:const|let|var|function)\s+(\w+)/g)].map((x) => x[1]));
    for (const stmt of js.matchAll(/(?:const|let|var)\s+([^;\n]+)/g)) {
      for (const part of stmt[1].split(',')) {
        const nm = part.split('=')[0].trim();
        if (/^\w+$/.test(nm)) declared.add(nm);
      }
    }
    for (const dm of js.matchAll(/(?:const|let|var)\s*\[\s*(\w+)\s*,\s*(\w+)\s*\]/g)) { declared.add(dm[1]); declared.add(dm[2]); }
    for (const dm of js.matchAll(/(?:const|let|var)\s*\{([^}]*)\}\s*=/g)) {
      for (const p of dm[1].split(',')) {
        const nm = p.split(':').pop().split('=')[0].trim();
        if (nm) declared.add(nm);
      }
    }
    for (const dm of js.matchAll(/\(([^()]*)\)\s*=>/g)) {
      for (const p of dm[1].split(',')) {
        const nm = p.split('=')[0].replace(/[{}[\]]/g, '').trim();
        if (nm) declared.add(nm);
      }
    }
    for (const dm of js.matchAll(/(\w+)\s*=>/g)) declared.add(dm[1]);
    for (const dm of js.matchAll(/catch\s*\(\s*(\w+)/g)) declared.add(dm[1]);

    const used = new Set([...js.matchAll(/(?<![.\w$'"`])([a-z_]\w*)\s*(?=[.[)(,;=<>!?+\-*/&|\s])/g)].map((x) => x[1]));
    const unknown = [...used].filter((u) => !props.has(u) && !declared.has(u) && !toplevel.has(u)
      && !BUILTINS.has(u) && !KEYWORDS.has(u) && !imported.has(u));

    const allowed = new Set(KNOWN_OK[name] || []);
    const real = unknown.filter((u) => !allowed.has(u));
    unknown.filter((u) => allowed.has(u)).forEach((u) => usedAllowlist.add(`${name}.${u}`));
    if (real.length) {
      const line = src.slice(0, start).split('\n').length;
      problems.push(`${rel}:${line} ${name}: ${real.sort().join(', ')}`);
    }
  }
}

if (problems.length) {
  console.log('FAIL identifiers used but never declared:');
  for (const p of problems) console.log('    ' + p);
  process.exit(1);
}
console.log(`OK   no undeclared identifiers in component bodies (${usedAllowlist.size} known false positives allowed)`);
