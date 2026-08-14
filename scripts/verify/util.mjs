// Shared helpers for the ported static checkers in scripts/verify/.
// Every checker walks the real ESM module graph instead of one JSX file, so
// this is where "what counts as application source" is decided once.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

// Application source: every .js/.jsx under src/, excluding tests. Mirrors
// what the old gate treated as "the file" — just spread across modules now.
export function listSrcFiles() {
  const out = [];
  const walk = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (entry.name === 'test') continue; // src/test/** — vitest specs, not app code
        walk(p);
      } else if (/\.(jsx?|mjs)$/.test(entry.name) && !entry.name.endsWith('.test.js')) {
        out.push(p);
      }
    }
  };
  walk(path.join(ROOT, 'src'));
  return out.sort();
}

export function readAll(files) {
  return files.map((p) => ({ path: p, rel: path.relative(ROOT, p), src: fs.readFileSync(p, 'utf8') }));
}

export function rel(p) {
  return path.relative(ROOT, p);
}

// Named imports/default/namespace imports at the top of an ES module, resolved
// to the local binding name a file can then use unqualified.
const IMPORT_RE = /^import\s+(?:([\w$]+)\s*,?\s*)?(?:\{([^}]*)\})?(?:\s*\*\s*as\s+([\w$]+))?\s*(?:from\s+['"]([^'"]+)['"])?/gm;

export function importedNames(src) {
  const names = new Set();
  IMPORT_RE.lastIndex = 0;
  let m;
  while ((m = IMPORT_RE.exec(src))) {
    const [, def, named, ns] = m;
    if (def) names.add(def);
    if (ns) names.add(ns);
    if (named) {
      for (const part of named.split(',')) {
        const p = part.trim();
        if (!p) continue;
        const asName = p.includes(' as ') ? p.split(' as ')[1].trim() : p;
        if (/^[\w$]+$/.test(asName)) names.add(asName);
      }
    }
  }
  return names;
}

// Resolve a relative import specifier to a file under src/, the way node/vite
// would (extension-less imports, directory index files are not used in this
// tree so only extension resolution is needed).
export function resolveImport(fromFile, spec) {
  if (!spec.startsWith('.')) return null; // package import, not local
  const base = path.resolve(path.dirname(fromFile), spec);
  const candidates = [base, base + '.js', base + '.jsx', base + '.mjs'];
  for (const c of candidates) {
    if (fs.existsSync(c) && fs.statSync(c).isFile()) return c;
  }
  return null;
}

export function importSpecs(src) {
  const specs = [];
  const re = /^import\s+[^'"]*from\s+['"]([^'"]+)['"]/gm;
  let m;
  while ((m = re.exec(src))) specs.push(m[1]);
  return specs;
}

let FAIL = false;
export function fail() { FAIL = true; }
export function failed() { return FAIL; }

// Find the index of the bracket matching the one at `openIdx`, counting all
// three bracket kinds together so a default value like `() => {}` inside a
// parameter list doesn't look like the list's own closing paren. This is the
// depth-aware scan propcheck.py did by hand; validate.js's flat `[^)]*`
// regexes are exactly what missed a signature with an inline arrow default
// (`setRemWindow = () => {}`) — everything after it in the same destructure
// silently vanished from the scan.
const OPEN = { '(': ')', '{': '}', '[': ']' };
const CLOSE = { ')': '(', '}': '{', ']': '[' };
export function matchBracket(src, openIdx) {
  const openCh = src[openIdx];
  let depth = 0;
  for (let i = openIdx; i < src.length; i++) {
    const c = src[i];
    if (OPEN[c]) depth++;
    else if (CLOSE[c]) {
      depth--;
      if (depth === 0) return i;
    }
  }
  return -1;
}

// Every `(...)` parameter list in the file — function declarations,
// expressions and arrow functions alike — extracted with bracket-depth
// tracking rather than a `[^)]*` regex, so a default value containing its own
// parens doesn't truncate the match.
export function allParamGroups(code) {
  const groups = [];
  for (const m of code.matchAll(/function\s*[\w$]*\s*\(/g)) {
    const open = m.index + m[0].length - 1;
    const close = matchBracket(code, open);
    if (close > open) groups.push(code.slice(open + 1, close));
  }
  for (const m of code.matchAll(/\)\s*=>/g)) {
    const close = m.index;
    let open = close;
    // walk back to the matching '(' for this ')'
    let depth = 0;
    for (let i = close; i >= 0; i--) {
      const c = code[i];
      if (CLOSE[c]) depth++;
      else if (OPEN[c]) { depth--; if (depth === 0) { open = i; break; } }
    }
    groups.push(code.slice(open + 1, close));
  }
  // Single-identifier arrow with no parens: `x => x + 1`.
  for (const m of code.matchAll(/(?:^|[^\w$.])([A-Za-z_$][\w$]*)\s*=>/g)) groups.push(m[1]);
  return groups;
}

// Method-style definitions inside a class body or object literal:
// `  async rescue() {`, `  render() {`, `  static getDerivedStateFromError(x) {`.
// Scoped to lines that end in `{` right after the parameter list so an
// ordinary call statement (`  someFunction(arg);`) is never mistaken for one.
export function methodDefNames(code) {
  const names = new Set();
  for (const m of code.matchAll(/^[ \t]{2,}(?:static\s+)?(?:async\s+)?(?:get\s+|set\s+)?(\*\s*)?([A-Za-z_$][\w$]*)\s*\([^;{}]*\)\s*\{/gm)) {
    names.add(m[2]);
  }
  return names;
}
