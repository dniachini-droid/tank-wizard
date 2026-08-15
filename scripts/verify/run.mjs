#!/usr/bin/env node
/* npm run verify — the gate. Nothing merges unless this exits 0.
 *
 * Ordered cheapest-first, same principle as legacy/verify.sh: a syntax error
 * fails in a second, not after the full simulation. `npm run build` runs
 * first because it IS the check for two whole legacy checkers (validate.js's
 * brace/duplicate-declaration half, jsxcheck.py) — see .agent/phase5-gate.md
 * for the demonstration. The static checkers run next (all read source only,
 * no build needed), then the behavioural suites, which do need a build.
 *
 * The three rules the old gate learned the hard way, carried forward on
 * purpose:
 *   1. Every non-zero exit must reach the exit code — the old `fail=1` flag
 *      was set and never read. `failed` below is read, at the end, always.
 *   2. A piped checker's exit code must survive the pipe — nothing here
 *      pipes a checker through anything.
 *   3. A check that cannot fail is worse than no check — see verify:mutate.
 *
 * BLOCKING checks fail the gate. ADVISORY checks run, print, and are logged,
 * but never flip the exit code — see .agent/phase5-gate.md for why each one
 * is advisory today and the backlog item tracking it back to blocking.
 */
import { execFileSync } from 'node:child_process';
import { ROOT } from './util.mjs';

const STATIC_CHECKS = [
  ['linkcheck', 'scripts/verify/linkcheck.mjs', 'blocking'],
  ['propcheck', 'scripts/verify/propcheck.mjs', 'blocking'],
  ['scopecheck', 'scripts/verify/scopecheck.mjs', 'blocking'],
  ['hookcheck', 'scripts/verify/hookcheck.mjs', 'blocking'],
  ['rootprops', 'scripts/verify/rootprops.mjs', 'blocking'],
  ['deadcode', 'scripts/verify/deadcode.mjs', 'advisory'],
  ['livecheck', 'scripts/verify/livecheck.mjs', 'blocking'],
  ['wordingcheck', 'scripts/verify/wordingcheck.mjs', 'blocking'],
  ['consistencycheck', 'scripts/verify/consistencycheck.mjs', 'blocking'],
  ['dupcheck', 'scripts/verify/dupcheck.mjs', 'blocking'],
  ['blockdup', 'scripts/verify/blockdup.mjs', 'blocking'],
  ['csscheck', 'scripts/verify/csscheck.mjs', 'advisory'],
  ['motioncheck', 'scripts/verify/motioncheck.mjs', 'blocking'],
  ['a11ycheck', 'scripts/verify/a11ycheck.mjs', 'blocking'],
  ['escapecheck', 'scripts/verify/escapecheck.mjs', 'blocking'],
];

let failed = false;
const results = [];

function run(label, cmd, args, mode) {
  const t0 = Date.now();
  try {
    const out = execFileSync(cmd, args, { cwd: ROOT, encoding: 'utf8', stdio: 'pipe' });
    process.stdout.write(out);
    results.push([label, mode, 'pass', Date.now() - t0]);
    return true;
  } catch (e) {
    process.stdout.write(e.stdout || '');
    process.stderr.write(e.stderr || String(e.message) + '\n');
    results.push([label, mode, mode === 'blocking' ? 'FAIL' : 'fail (advisory)', Date.now() - t0]);
    if (mode === 'blocking') failed = true;
    return false;
  }
}

console.log('── build (supersedes validate.js braces/dupes, jsxcheck.py) ──');
run('build', 'npm', ['run', 'build', '--silent'], 'blocking');

console.log('\n── static checks ──');
for (const [label, script, mode] of STATIC_CHECKS) {
  run(label, 'node', [script], mode);
}

console.log('\n── behavioural checks (already ported, Phase 3 — tests/legacy-port/) ──');
run('rebuild engine bundle', 'npx', ['esbuild', 'src/test-surface.js', '--bundle', '--platform=node',
  '--format=cjs', '--outfile=build/engines-new.cjs',
  '--banner:js=global.window=global.window||{storage:null,localStorage:null,matchMedia:()=>({matches:false})};',
  '--loader:.jsx=jsx'], 'blocking');
// Same file list and order as legacy/verify.sh's behavioural section, minus
// popup.js — Phase 3 filed it unrunnable (it greps the monolith's JSX source,
// which no longer exists) and this gate holds that line rather than
// rewriting the test to fit a different extraction pattern.
const LEGACY_PORT_SUITES = ['run_all', 'textcheck', 'fuzz3', 'robust', 'verify_math', 'strips',
  'briefing', 'hiding', 'crosstalk', 'summary', 'matrix', 'surfaces-agree', 'husbandry', 'derivation',
  'golden', 'shared', 'malformed', 'units', 'perf', 'protocols', 'sim/smoke', 'sim/years', 'invariants'];
for (const suite of LEGACY_PORT_SUITES) {
  run(`legacy-port:${suite}`, 'node', [`tests/legacy-port/${suite}.js`], 'blocking');
}
console.log('  SKIP legacy-port:popup — unrunnable since Phase 3 (.agent/phase3-conformance.md): greps the');
console.log('       monolith\'s JSX source, which no longer exists. Not rewritten — see AGENTS.md #4/#9.');

// `npm test` (vitest, src/test/** + tests/parity/**) is deliberately left out
// of this gate. It is not part of legacy/verify.sh — vitest didn't exist in
// the monolith — so porting it was never this routine's scope. It is also,
// right now, 69/261 tests red across 32/44 files, every one of them a
// pre-existing, already-labelled "SPEC VIOLATION" test tracking a chemistry
// gap the backlog already has open (rate-rails.test.js's calcium/magnesium
// rail mismatch is TW-020's own arrival-zone item; several others match
// TW-018/TW-019 in .agent/backlog.md). Wiring that suite into the one
// required check would make it permanently red on every PR, including ones
// with nothing to do with chemistry, until those [chem] items are approved
// and closed — the opposite of what a merge gate is for. See
// .agent/phase5-gate.md for the full count and reasoning; the decision is
// flagged there for Dan, not made silently.

console.log('\n' + '─'.repeat(60));
for (const [label, mode, status, ms] of results) {
  console.log(`  ${status.padEnd(18)} ${label.padEnd(22)} (${mode})  ${ms}ms`);
}
console.log('');

if (failed) {
  console.log('CHECKS FAILED');
  process.exit(1);
}
console.log('ALL BLOCKING CHECKS PASSED (advisory findings above, if any, are tracked in the backlog)');
