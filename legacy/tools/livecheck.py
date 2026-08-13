#!/usr/bin/env python3
"""Fields declared in a config table must be read by the app, not only by tests.

STABILITY_RULES carried `greenPerDay` and `amberPerDay` on eight parameters.
Nothing in the app ever read them — drift is graded by CONSISTENCY_RULES, on
the spread across a window. The only readers in the repository were the tests.

That is worse than dead code. A stage 3 audit found that alkalinity "graded
steady at 1.4 dKH a week, three times the published limit", corrected it, and
verified the correction by reading the same unused constant. A fix and a test
agreeing with each other about a number the app never consults, reported as one
of the most significant findings of that stage.

deadcode.py cannot see this: the constant IS read, just not by anything that
runs. This checks the source file alone.
"""
import re
import sys

path = sys.argv[1] if len(sys.argv) > 1 else "src/reef-console.jsx"
src = open(path, encoding="utf-8").read()

# Config tables worth policing: a flat object of per-parameter settings.
TABLES = ["STABILITY_RULES", "CONSISTENCY_RULES", "SAFE_BOUNDS", "KIT_PRECISION",
          "CORRECTION_MAX_RATE", "DOSE_ADVICE_RULES", "DOSE_DRIFT_TRIGGER"]

problems = []
for table in TABLES:
    m = re.search(r"const " + table + r"\s*=\s*\{", src)
    if not m:
        continue
    start = src.index("{", m.start())
    depth, k = 0, start
    while k < len(src):
        if src[k] == "{":
            depth += 1
        elif src[k] == "}":
            depth -= 1
            if depth == 0:
                break
        k += 1
    body = src[start:k]
    # Field names used inside the table's entries.
    fields = set(re.findall(r"[\{,]\s*(\w+):", body))
    outside = src[:m.start()] + src[k:]
    for field in sorted(fields):
        if field in ("why", "label", "unit", "mode", "displayPer"):
            continue          # descriptive, not consulted
        # read as .field or ["field"] anywhere else in the source
        if re.search(r"\.\s*" + field + r"\b", outside) or f'"{field}"' in outside or f"'{field}'" in outside:
            continue
        problems.append((table, field))

if problems:
    print("FAIL config fields the app never reads:")
    for table, field in problems:
        print(f"    {table}.{field}")
    print("    (delete them, or wire them up — a field only tests read is worse than dead)")
    sys.exit(1)

print(f"OK   every config field is read by the app ({len(TABLES)} tables checked)")

# ---------------------------------------------------------------------------
# Fields an engine SETS on its result that nothing ever reads.
#
# `out.previous` was set by assessCalcium alone — assessAlkalinity and
# assessMagnesium never set it — and read by nothing anywhere. A field one copy
# of three grew, that no consumer asked for. The config-table check above could
# not see it: it inspects declarations, and this is an assignment.

ENGINES = ["assessAlkalinity", "assessCalcium", "assessMagnesium"]
set_fields = {}
for engine in ENGINES:
    i = src.find("function " + engine)
    if i < 0:
        continue
    j = src.index(") {", i) + 2
    depth, k = 0, j
    while k < len(src):
        if src[k] == "{":
            depth += 1
        elif src[k] == "}":
            depth -= 1
            if depth == 0:
                break
        k += 1
    body = src[j:k]
    for field in set(re.findall(r"\bout\.(\w+)\s*=(?![=])", body)):
        set_fields.setdefault(field, set()).add(engine)

# Where a result field could be read: anywhere outside the engines, plus the
# tests, which are legitimate consumers of a diagnostic.
outside = src
for engine in ENGINES:
    i = outside.find("function " + engine)
    if i < 0:
        continue
    j = outside.index(") {", i) + 2
    depth, k = 0, j
    while k < len(outside):
        if outside[k] == "{":
            depth += 1
        elif outside[k] == "}":
            depth -= 1
            if depth == 0:
                break
        k += 1
    outside = outside[:i] + outside[k:]

import glob
import os
test_src = ""
for f in glob.glob(os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "tests", "**", "*.js"), recursive=True):
    test_src += open(f, encoding="utf-8").read()

# A field read inside the engine that set it is a working variable, not a dead
# output — an earlier version excluded the engine bodies from the search and so
# reported every one of those as orphaned.
engine_bodies = ""
for engine in ENGINES:
    i = src.find("function " + engine)
    if i < 0:
        continue
    j = src.index(") {", i) + 2
    depth, k = 0, j
    while k < len(src):
        if src[k] == "{":
            depth += 1
        elif src[k] == "}":
            depth -= 1
            if depth == 0:
                break
        k += 1
    engine_bodies += src[j:k]

orphans = []
for field, engines in sorted(set_fields.items()):
    pattern = r"\.\s*" + field + r"\b"
    if re.search(pattern, outside) or re.search(pattern, test_src):
        continue
    # read by its own engine, other than the assignment itself
    reads = len(re.findall(pattern, engine_bodies))
    writes = len(re.findall(r"out\." + field + r"\s*=(?![=])", engine_bodies))
    if reads > writes:
        continue
    orphans.append((field, sorted(engines)))

if orphans:
    print("FAIL engine result fields nothing reads:")
    for field, engines in orphans:
        print(f"    out.{field}  (set by {', '.join(engines)})")
    sys.exit(1)
print(f"OK   every engine result field has a reader ({len(set_fields)} checked)")
