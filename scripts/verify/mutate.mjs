#!/usr/bin/env node
/* Ported from legacy/tools/mutate.py.
 *
 * Break things on purpose and check the suites notice. A green gate only
 * means something if the checks can fail — two of the monolith's could not:
 * csscheck inspected a fixed prefix list and reported OK while a whole class
 * family went unstyled, and verify.sh set a `fail` flag it never read. Both
 * were green for a long time while covering nothing. This is the tool that
 * would have caught both, and the one the routine requires be run before the
 * gate is reported as working.
 *
 * Every mutation below is the same real fault legacy/tools/mutate.py found,
 * re-anchored to its new file: the monolith was one file, these are six
 * files. The anchors were verified to still exist, near-verbatim, when this
 * was ported — see .agent/phase5-gate.md §6 for the diff of what moved.
 */
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { execFileSync } from 'node:child_process';
import { ROOT } from './util.mjs';

const MUTATIONS = [
  {
    label: 'dose claim writes its own words',
    file: 'src/lib/narrative-engine.js',
    old: '    if (d.state === "correcting-dose") {\n      add({ id: "dose:" + d.key, tone: "busy", rank: 2,\n        claim: d.headline,',
    neu: '    if (d.state === "correcting-dose") {\n      add({ id: "dose:" + d.key, tone: "busy", rank: 2,\n        claim: `${d.el} being fixed`,',
    suites: [{ kind: 'node', cmd: 'scripts/verify/wordingcheck.mjs' }],
  },
  {
    label: 'calcium band drifts from the consensus',
    file: 'src/lib/constants.js',
    old: '{ key: "calcium", label: "Calcium", unit: "ppm", min: 400, max: 450, step: 1, freqDays: 7, color: "#B8541A" }',
    neu: '{ key: "calcium", label: "Calcium", unit: "ppm", min: 460, max: 510, step: 1, freqDays: 7, color: "#B8541A" }',
    suites: [{ kind: 'legacy', name: 'husbandry' }],
  },
  {
    label: 'records no longer guarded',
    file: 'src/App.jsx',
    old: '  const doseLog = toRecords(rawDoseLog).map((r) => {',
    neu: '  const doseLog = rawDoseLog.map((r) => {',
    suites: [{ kind: 'legacy', name: 'malformed' }],
  },
  {
    label: 'return dose replays the stored figure',
    file: 'src/lib/dosing/helpers.js',
    old: '    returnDose: freshReturn, storedReturnDose: plan.returnDose,',
    neu: '    storedReturnDose: plan.returnDose,',
    suites: [{ kind: 'legacy', name: 'crosstalk' }],
  },
  {
    label: 'unattended plans stop being timed',
    file: 'src/lib/dosing/helpers.js',
    old: '  if (!latest) {\n    const elapsed = daysBetween',
    neu: '  if (!latest) return { ...plan, level: null, arrived: false, readingsSince: 0 };\n  if (false) {\n    const elapsed = daysBetween',
    suites: [{ kind: 'legacy', name: 'crosstalk' }],
  },
  {
    label: 'the dose-gap check removed',
    file: 'src/lib/dosing/alkalinity.js',
    old: '  if (out.band === "stable" && !alkWorsening\n      && !doseDriftedFrom(out.maintenanceDose, out.currentDose, def.key)) {',
    neu: '  if (out.band === "stable" && !alkWorsening) {',
    suites: [{ kind: 'legacy', name: 'protocols' }, { kind: 'legacy', name: 'sim/years' }],
  },
];

const BUILD_CMD = ['npx', ['esbuild', 'src/test-surface.js', '--bundle', '--platform=node', '--format=cjs',
  '--outfile=build/engines-new.cjs',
  '--banner:js=global.window=global.window||{storage:null,localStorage:null,matchMedia:()=>({matches:false})};',
  '--loader:.jsx=jsx']];

function rebuild() {
  execFileSync(BUILD_CMD[0], BUILD_CMD[1], { cwd: ROOT, stdio: 'pipe' });
}

function runSuite(suite) {
  try {
    if (suite.kind === 'node') {
      execFileSync('node', [suite.cmd], { cwd: ROOT, stdio: 'pipe' });
    } else {
      execFileSync('node', [`tests/legacy-port/${suite.name}.js`], { cwd: ROOT, stdio: 'pipe' });
    }
    return false; // exited 0 — did not catch the mutation
  } catch {
    return true; // non-zero exit — caught it
  }
}

const pristineDir = fs.mkdtempSync(path.join(os.tmpdir(), 'tw-mutate-'));
const results = [];

for (const m of MUTATIONS) {
  const target = path.join(ROOT, m.file);
  const pristinePath = path.join(pristineDir, m.file.replace(/\//g, '_'));
  const original = fs.readFileSync(target, 'utf8');
  fs.writeFileSync(pristinePath, original);

  if (!original.includes(m.old)) {
    console.log(`  ${m.label.padEnd(44)} ANCHOR MISSED`);
    results.push({ ...m, outcome: 'ANCHOR MISSED' });
    continue;
  }

  fs.writeFileSync(target, original.replace(m.old, m.neu));
  rebuild();

  let caught = false;
  const caughtBy = [];
  for (const suite of m.suites) {
    if (runSuite(suite)) { caught = true; caughtBy.push(suite.kind === 'node' ? path.basename(suite.cmd) : `legacy-port/${suite.name}`); }
  }

  console.log(`  ${m.label.padEnd(44)}${caught ? 'caught by ' + caughtBy.join(', ') : 'NOT CAUGHT'}`);
  results.push({ ...m, outcome: caught ? `caught by ${caughtBy.join(', ')}` : 'NOT CAUGHT' });

  // Restore before the next mutation regardless of outcome.
  fs.writeFileSync(target, original);
  rebuild();
  if (fs.readFileSync(target, 'utf8') !== original) {
    console.log('  *** RESTORE FAILED — the source is still mutated ***');
    process.exit(2);
  }
}

// Final check across every mutated file, same as the original's closing
// safety net: a run that dies mid-mutation must not leave the tree mutated.
let anyMismatch = false;
for (const m of MUTATIONS) {
  const target = path.join(ROOT, m.file);
  const pristinePath = path.join(pristineDir, m.file.replace(/\//g, '_'));
  if (fs.existsSync(pristinePath) && fs.readFileSync(target, 'utf8') !== fs.readFileSync(pristinePath, 'utf8')) {
    anyMismatch = true;
  }
}
if (anyMismatch) {
  console.log('  *** SOURCE LEFT MUTATED AFTER ALL PROBES ***');
  process.exit(2);
}
console.log('  source restored and verified');

const notCaught = results.filter((r) => r.outcome === 'NOT CAUGHT' || r.outcome === 'ANCHOR MISSED');
if (notCaught.length) process.exit(1);
