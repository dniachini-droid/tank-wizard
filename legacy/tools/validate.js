const fs = require('fs');
const src = fs.readFileSync(process.argv[2], 'utf8');
let fail = false;

// --- 1. Brace balance ---
const pairs = { '(': ')', '{': '}', '[': ']' };
let stack = [], line = 1, balanced = true;
for (const ch of src) {
  if (ch === '\n') line++;
  if ('([{'.includes(ch)) stack.push([ch, line]);
  else if (')]}'.includes(ch)) {
    const top = stack.pop();
    if (!top || pairs[top[0]] !== ch) {
      console.log('FAIL brace mismatch near line ' + line); balanced = false; fail = true; break;
    }
  }
}
if (balanced && stack.length) { console.log('FAIL unclosed braces: ' + stack.length); fail = true; }
else if (balanced) console.log('OK   braces balanced');

// Strip comments and string literals so prose cannot look like code.
const code = src
  .replace(/\/\*[\s\S]*?\*\//g, ' ')
  .replace(/\/\/[^\n]*/g, ' ')
  .replace(/`(?:\\.|[^`\\])*`/g, '`S`')
  .replace(/"(?:\\.|[^"\\])*"/g, '"S"');
// Single-quoted strings are deliberately NOT stripped: JSX prose is full of
// apostrophes ("you're", "don't"), and treating those as string delimiters
// swallows real code between them.

// --- 2. Duplicate top-level declarations (broke the last build) ---
const decls = {};
for (const m of src.matchAll(/^(?:const|let|function|async function)\s+([A-Za-z_$][\w$]*)/gm)) {
  const n = m[1];
  (decls[n] = decls[n] || []).push(src.slice(0, m.index).split('\n').length);
}
const dupes = Object.entries(decls).filter(e => e[1].length > 1);
if (dupes.length) {
  console.log('FAIL duplicate declarations:');
  dupes.forEach(e => console.log('       ' + e[0] + ' at lines ' + e[1].join(', ')));
  fail = true;
} else console.log('OK   no duplicate declarations');

// --- 3. Undefined function calls (broke this build) ---
const defs = new Set();
for (const m of code.matchAll(/(?:async\s+)?function\s+([A-Za-z_$][\w$]*)/g)) defs.add(m[1]);
// Class components: the class itself, plus its methods, which are called by React.
for (const m of code.matchAll(/class\s+([A-Za-z_$][\w$]*)/g)) defs.add(m[1]);
for (const m of code.matchAll(/^\s{2}(?:static\s+)?([a-zA-Z_$][\w$]*)\s*\([^)]*\)\s*\{/gm)) defs.add(m[1]);
for (const m of code.matchAll(/\b(?:const|let|var)\s+([A-Za-z_$][\w$]*)/g)) defs.add(m[1]);
for (const m of code.matchAll(/\b(?:const|let|var)\s*\[([^\]]*)\]/g))
  m[1].split(',').forEach(p => defs.add(p.split('=')[0].trim()));
for (const m of code.matchAll(/\b(?:const|let|var)\s*\{([^}]*)\}/g))
  m[1].split(',').forEach(p => defs.add(p.split(':').pop().split('=')[0].trim()));
for (const m of code.matchAll(/function\s*\w*\(([^)]*)\)/g))
  m[1].split(',').forEach(p => defs.add(p.split('=')[0].replace(/[{}\[\]\.]/g, '').trim()));
for (const m of code.matchAll(/\(([^()]*)\)\s*=>/g))
  m[1].split(',').forEach(p => defs.add(p.split('=')[0].replace(/[{}\[\]\.]/g, '').trim()));

const builtin = new Set(['require','fetch','setTimeout','clearTimeout','setInterval','parseFloat',
  'parseInt','isNaN','isFinite','alert','eval','Boolean','Number','String','Array','Object','Math',
  'Date','JSON','Promise','Error','Blob','FileReader','Image','useState','useMemo','useEffect',
  'useRef','if','for','while','switch','catch','return','typeof','super','function','await','new','requestAnimationFrame','cancelAnimationFrame','clearInterval','queueMicrotask',
  'resolve','reject','async','of','in','every','some','map','filter','find','photo']);

/* Props without a default (`onFoo,` rather than `onFoo = () => {}`) and const
   arrows declared anywhere were both being missed, so a correctly wired
   handler read as undefined. */
for (const m of code.matchAll(/\b(on[A-Z][A-Za-z0-9_$]*)\s*[,}]/g)) defs.add(m[1]);
for (const m of code.matchAll(/(?:const|let)\s+([a-z][A-Za-z0-9_$]*)\s*=\s*(?:async\s*)?\(/g)) defs.add(m[1]);

const calls = new Set();
for (const m of code.matchAll(/(?:^|[^.\w$'"`])([a-z][A-Za-z0-9_$]{2,})\s*\(/g)) calls.add(m[1]);
/* Verified by hand: declared as component props or as const arrows, but the
   destructuring scan does not reach them. Listed rather than loosened, so the
   check keeps its teeth for genuinely missing functions. */
const knownProps = new Set(['onSetReminderDue','onSetReminderInterval','onSkipReminder',
  'closeSheet','onPickTask','onGoDosing','onApplyCaDose','onApplyMgDose','onClearCaPlan',
  'onClearMgPlan','onApplyCaEffect','onApplyMgEffect','onLogCorrection','onApplyEffect',
  'onRestoreFinding','onRestoreAllFindings','onPlayIntro','onReplaceKit','onUndoReplaceKit',
  'onDismissFinding','onApplyDose','onClearPlan','onApplyAlkDose','onRestored',
  'onDeleteReminder','onUpdateReminder','onPickTask','onToggleEnabled','onReschedule']);
const undef = [...calls].filter(c => !defs.has(c) && !builtin.has(c) && !knownProps.has(c));
if (undef.length) { console.log('FAIL undefined functions: ' + undef.join(', ')); fail = true; }
else console.log('OK   all called functions defined');

// --- 4. Components referenced but not defined ---
const comps = new Set([
  ...[...src.matchAll(/^function ([A-Z]\w+)\(/gm)].map(m => m[1]),
  ...[...src.matchAll(/^class ([A-Z]\w+)/gm)].map(m => m[1]),
]);
const used = new Set([...src.matchAll(/<([A-Z]\w+)[\s/>]/g)].map(m => m[1]));
const known = new Set(['LayoutDashboard','FlaskConical','FileBarChart2','ListChecks','SunMedium',
  'StickyNote','Images','Plus','Trash2','X','Waves','Bell','CheckCircle2','AlertTriangle','Upload',
  'Check','ArrowUp','ArrowDown','Minus','RotateCcw','ChevronDown','ChevronUp','Settings2','Save',
  'Activity','Scale','Beaker','Target','Gauge','Calculator','Download','Droplets','Icon','Row',
  'LineChart','Line','XAxis','YAxis','CartesianGrid','Tooltip','ReferenceArea','ReferenceLine',
  'ResponsiveContainer']);
const missingComp = [...used].filter(u => !comps.has(u) && !known.has(u));
if (missingComp.length) { console.log('FAIL undefined components: ' + missingComp.join(', ')); fail = true; }
else console.log('OK   all components defined');

console.log(fail ? '\nRESULT: FAILED' : '\nRESULT: PASSED');
process.exit(fail ? 1 : 0);
