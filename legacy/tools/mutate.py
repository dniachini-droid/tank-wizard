#!/usr/bin/env python3
"""Break things on purpose and check the suites notice.

A green gate only means something if the checks can fail, and two of ours could
not: csscheck inspected a fixed prefix list and reported OK while a whole class
family went unstyled, and verify.sh set a `fail` flag it never read. Both were
green for a long time while covering nothing.

Every mutation below is a real fault found during stage 5. Run this after
adding a check, and after any change that touches the engines.
"""
import os
import shutil
import subprocess
import tempfile

CWD = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
P = os.path.join(CWD, "src", "reef-console.jsx")
PRISTINE = os.path.join(tempfile.gettempdir(), "mutate-pristine.jsx")
shutil.copy(P, PRISTINE)

MUTATIONS = [
  ('dose claim writes its own words',
   'if (d.state === "correcting-dose") {\n      add({ id: "dose:" + d.key, tone: "busy", rank: 2,\n        claim: d.headline,',
   'if (d.state === "correcting-dose") {\n      add({ id: "dose:" + d.key, tone: "busy", rank: 2,\n        claim: `${d.el} being fixed`,',
   ['tools/wordingcheck.py']),
  ('calcium band drifts from the consensus',
   'min: 400, max: 450, step: 1, freqDays: 7',
   'min: 460, max: 510, step: 1, freqDays: 7',
   ['tests/husbandry.js']),
  ('records no longer guarded',
   '  const doseLog = toRecords(rawDoseLog);',
   '  const doseLog = rawDoseLog;',
   ['tests/malformed.js']),
  ('return dose replays the stored figure',
   '    returnDose: freshReturn, storedReturnDose: plan.returnDose,',
   '    storedReturnDose: plan.returnDose,',
   ['tests/crosstalk.js']),
  ('unattended plans stop being timed',
   '  if (!latest) {\n    const elapsed = daysBetween',
   '  if (!latest) return { ...plan, level: null, arrived: false, readingsSince: 0 };\n  if (false) {\n    const elapsed = daysBetween',
   ['tests/crosstalk.js']),
  ('the dose-gap check removed',
   '  if (out.band === "stable" && !alkWorsening\n      && !doseDriftedFrom(out.maintenanceDose, out.currentDose, def.key)) {',
   '  if (out.band === "stable" && !alkWorsening) {',
   ['tests/protocols.js', 'tests/sim/years.js']),
]

for label, old, new, suites in MUTATIONS:
    s = open(P, encoding='utf-8').read()
    if old not in s:
        print(f'  {label:<44} ANCHOR MISSED'); continue
    open(P, 'w', encoding='utf-8').write(s.replace(old, new, 1))
    subprocess.run(['python3','tools/build_harness.py'], capture_output=True, cwd=CWD)
    caught = False
    for suite in suites:
        runner = 'node' if suite.endswith('.js') else 'python3'
        args = [runner, suite] + (['src/reef-console.jsx'] if suite.endswith('.py') else [])
        r = subprocess.run(args, capture_output=True, cwd=CWD)
        if r.returncode: caught = True
    print(f'  {label:<44}{"caught by " + ", ".join(suites) if caught else "NOT CAUGHT"}')
    shutil.copy(PRISTINE, P)
    subprocess.run(['python3','tools/build_harness.py'], capture_output=True, cwd=CWD)
    # Verify the restore actually took. A run that is interrupted, or whose
    # copy silently fails, leaves a mutation in the source — and this tool's
    # whole job is to introduce faults, so its leftovers are indistinguishable
    # from real ones. One did survive: the alkalinity dose-gap check went
    # missing and only the golden fingerprint noticed, an hour later.
    if open(P, encoding='utf-8').read() != open(PRISTINE, encoding='utf-8').read():
        print('  *** RESTORE FAILED — the source is still mutated ***')
        raise SystemExit(2)

if open(P, encoding='utf-8').read() != open(PRISTINE, encoding='utf-8').read():
    print('  *** SOURCE LEFT MUTATED AFTER ALL PROBES ***')
    raise SystemExit(2)
print('  source restored and verified')
