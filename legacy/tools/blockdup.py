#!/usr/bin/env python3
"""Duplicated blocks INSIDE functions, which dupcheck.py cannot see.

dupcheck compares whole function bodies pairwise, so it reports "no unexplained
duplication" while the same twenty lines sit inside three different 400-line
functions. That is exactly where the duplication lives: assessCalcium and
assessMagnesium are 68% identical line for line, and each is about half
identical to assessAlkalinity.

This is not a style complaint. Every serious bug this project has had of the
"fixed in one place, not the others" kind came from precisely this: the
dose-gap check went into one engine of three; the settling window disagreed
across three tables; the return dose was recomputed in one path and replayed in
another. The copies do not stay in step.

The threshold is deliberately loose. The point is to make the scale visible and
stop it growing, not to fail the build over six lines.
"""
import collections
import hashlib
import re
import sys

path = sys.argv[1] if len(sys.argv) > 1 else "src/reef-console.jsx"
lines = open(path, encoding="utf-8").read().split("\n")

RUN = 8          # lines that must match consecutively
CEILING = 10     # exactly what exists today, so anything new fails

# A ceiling with headroom is not a check. Set to 6 with 4 in the file, it let a
# whole pasted function through. Set it to whatever the file actually contains
# and lower it as regions are resolved.
#
# The count went from 4 to 11 when comments stopped breaking the window, then
# to 10 after extracting noteCurrentAndInterventions. The remaining ten are
# recorded rather than hidden:
#
#   the one-off correction block   3 copies, alkalinity/calcium/magnesium
#   the backup key map             2 copies, inspectBackup and restoreBackup
#   the estimate collection        2 copies, solveAlkEffect and solveSlowEffect
#
# Each is a genuine candidate for extraction. None is being extracted blind at
# the end of a long session; the point of the ceiling is that they cannot grow.

# Measured before setting: 90 lines of 15,706 sit in runs of 8+ identical
# lines, 36 in runs of 12+, and none in runs of 20+. So the verbatim copying is
# small and the ceiling can be tight.
#
# The larger similarity is real but structural: assessCalcium and
# assessMagnesium share 68% of their LINES, and about half of each matches
# assessAlkalinity — but shuffled, reworded and interleaved rather than copied
# in blocks. That is not something a text comparison should try to police, and
# merging three 400-line engines is a deliberate piece of work rather than
# something to slip into a checker.

def substantive(line):
    t = line.strip()
    if not t or t.startswith("//") or t.startswith("/*") or t.startswith("*"):
        return None
    if len(t) < 12:
        return None
    return re.sub(r"\s+", " ", t)

# Comments are SKIPPED, not treated as a break. The first version abandoned any
# window containing one, so in a codebase this heavily commented almost no
# 8-line run was comment-free — and a whole pasted function went unnoticed
# because its duplicate lines were interleaved with the explanation of what
# they do. Documentation was hiding duplication.
code = [(i + 1, substantive(l)) for i, l in enumerate(lines)]
code = [(n, t) for n, t in code if t is not None]

seen = collections.defaultdict(list)
for i in range(len(code) - RUN):
    block = [t for _, t in code[i:i + RUN]]
    key = hashlib.md5("\n".join(block).encode()).hexdigest()
    seen[key].append(code[i][0])

regions = [v for v in seen.values() if len(v) > 1]
# Collapse overlapping windows into one region each.
starts = sorted(v[0] for v in regions)
collapsed = []
for s in starts:
    if not collapsed or s - collapsed[-1] > RUN:
        collapsed.append(s)

if len(collapsed) > CEILING:
    print(f"FAIL {len(collapsed)} duplicated blocks of {RUN}+ lines, ceiling is {CEILING}")
    for v in sorted(regions, key=lambda x: -len(x))[:6]:
        print(f"    {len(v)} copies, first at line {v[0]}")
    sys.exit(1)

print(f"OK   duplicated blocks within functions: {len(collapsed)} (ceiling {CEILING})")
