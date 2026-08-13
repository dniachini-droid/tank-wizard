#!/bin/bash
# The gate. Nothing merges unless this exits 0.
#
# Ordered cheapest-first so a syntax error fails in a second rather than after
# the full simulation. The engine module is rebuilt at the start because the
# harnesses share it: letting each one build its own export list is how a
# crashing function once went untested for weeks.
set -e
# Without pipefail a pipeline reports the exit code of its LAST command, so
# `node tests/textcheck.js | tail -1` succeeded no matter what the test did.
# textcheck.js was crashing on every run and the gate never noticed.
set -o pipefail
cd "$(dirname "$0")"

echo "── building engine module ──"
python3 tools/build_harness.py

echo "── static checks ──"
node tools/validate.js src/reef-console.jsx | tail -1
python3 tools/jsxcheck.py src/reef-console.jsx
python3 tools/propcheck.py src/reef-console.jsx
python3 tools/scopecheck.py src/reef-console.jsx
python3 tools/hookcheck.py src/reef-console.jsx
python3 tools/rootprops.py src/reef-console.jsx
python3 tools/deadcode.py src/reef-console.jsx
# Config fields the app never reads. deadcode.py cannot see these: the constant
# IS read, just only by tests — which is how a fix and a test came to agree with
# each other about a number the app never consults.
python3 tools/livecheck.py src/reef-console.jsx

echo "── stylesheet ──"
python3 tools/build.py > /dev/null
python3 tools/wordingcheck.py src/reef-console.jsx || fail=1
python3 tools/dupcheck.py src/reef-console.jsx || fail=1
# Duplication INSIDE functions, which dupcheck cannot see: it compares whole
# bodies, so the same twenty lines in three 400-line engines look unique.
python3 tools/blockdup.py src/reef-console.jsx || fail=1
python3 tools/csscheck.py build/reef-console.html
python3 tools/motioncheck.py build/reef-console.html || fail=1
python3 tools/a11ycheck.py build/reef-console.html || fail=1
python3 tools/escapecheck.py src/reef-console.jsx || fail=1

echo "── behavioural checks ──"
node tests/run_all.js      2>&1 | tail -1
node tests/textcheck.js    2>&1 | tail -1
node tests/fuzz3.js        2>&1 | tail -1
node tests/robust.js       2>&1 | tail -1
node tests/verify_math.js  2>&1 | grep "checks passed"
node tests/strips.js
node tests/briefing.js
node tests/hiding.js
node tests/crosstalk.js
node tests/summary.js
# Every dose state against every reading position. The overlap bugs came from
# two combinations; this walks all 180.
node tests/matrix.js || fail=1
# The popup component: every verdict carries what it reads, every prop is
# passed, every goto is handled. Not rendering — there is no React here.
node tests/popup.js || fail=1
# If a parameter is outside its band, some surface must NAME it — not merely
# be technically accurate about the count.
node tests/surfaces-agree.js || fail=1
node tests/husbandry.js
node tests/derivation.js
# A fingerprint of all three assessment engines, 1,620 cases. Property tests
# say the output is reasonable; this says it has not changed.
node tests/golden.js || fail=1
# The merge inverted the risk: one implementation, three callers. A helper that
# ignores its element gives all three the same answer and the fingerprint, being
# recorded from current behaviour, calls that perfectly stable.
node tests/shared.js || fail=1
node tests/malformed.js || fail=1
# Every number must be plausible for the unit beside it: arithmetic can be
# right while the label is wrong, and no structural checker sees that.
node tests/units.js || fail=1
# The derivation runs on every render. This guards the shape of the curve,
# not a few milliseconds: quadratic growth passes a fixed ceiling until it does not.
node tests/perf.js || fail=1

echo "── protocol conformance ──"
node tests/protocols.js

echo "── surfaces ──"
# Whole tanks through whole correction lifecycles, checking that the headline,
# summary claims, findings, Dosing Wizard and reading window agree on every
# simulated day. The unit suites cannot see this: a correction with no stop
# condition ran calcium to 702 ppm while every individual assessment stayed
# correct. Six seconds, and it is the only check that runs days in sequence.
node tests/sim/smoke.js || fail=1
# Three years per scenario, where a dose that never keeps up only shows late.
node tests/sim/years.js || fail=1


echo "── invariants ──"
node tests/invariants.js

echo
# Every "|| fail=1" above was a no-op: the flag was set and never read, so a
# suite could exit 1 while the gate reported success. set -e does not catch
# them because the || handles the failure. Checking the flag is the whole point
# of setting it — this went unnoticed for the entire life of the script.
if [ "${fail:-0}" != "0" ]; then
  echo "CHECKS FAILED"
  exit 1
fi
echo "ALL CHECKS PASSED"
