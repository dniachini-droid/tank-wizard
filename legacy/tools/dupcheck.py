#!/usr/bin/env python3
"""Flag substantial logic typed out more than once.

Duplication is how correctionInProgress ended up wired into alkalinity alone,
and how the score's safety cap was applied in buildOverview while explainScore
recomputed it from its own copy of the formula — the card showed 42 while its
own working added to 71. In both cases a fix landed in one copy and the others
were quietly left behind.

The check is deliberately coarse: it looks for whole lines of real logic that
appear verbatim in two or more functions. Short lines, boilerplate and comments
are ignored, and a small allowlist carries the cases where repetition is
clearer than sharing.
"""
import re
import sys
import collections

path = sys.argv[1] if len(sys.argv) > 1 else "src/reef-console.jsx"
src = open(path, encoding="utf-8").read()

# Pairs of functions permitted to look alike, with the reason.
ALLOWED = {
    ("solveAlkEffect", "solveSlowEffect"):
        "alkalinity genuinely differs — its own settling window and anomaly guard",
    ("regressionSlope", "regressionWithError"):
        "one returns the error term, and sharing would cost a branch in a hot path",
    ("computeElementConsumption", "computeNutrientProduction"):
        "opposite signs on the same shape; merging obscured which was which",
    ("computeDemandSeries", "computeElementConsumption"): "same",
    ("computeDemandSeries", "computeNutrientProduction"): "same",
    ("computeControl", "gradeSpread"): "small shared idiom, not shared logic",
    ("computeControl", "computeStability"): "small shared idiom, not shared logic",
}
THRESHOLD = 8  # shared lines before a pair is worth questioning


def bodies():
    out = {}
    for m in re.finditer(r"\nfunction (\w+)\(", src):
        name = m.group(1)
        start = m.start()
        depth = 0
        j = src.index("{", start)
        k = j
        while k < len(src):
            if src[k] == "{":
                depth += 1
            elif src[k] == "}":
                depth -= 1
                if depth == 0:
                    break
            k += 1
        out[name] = src[start:k]
    return out


SKIP = re.compile(r"^(\}|\{|\)|//|/\*|\*|return;?$|const \w+ = \w+;$)")
norm = lambda l: re.sub(r"\s+", " ", l).strip()

line_map = collections.defaultdict(set)
for fn, body in bodies().items():
    for raw in body.split("\n"):
        line = norm(raw)
        if len(line) < 40 or SKIP.match(line):
            continue
        line_map[line].add(fn)

pairs = collections.Counter()
for fns in line_map.values():
    if len(fns) < 2:
        continue
    ordered = sorted(fns)
    for i, a in enumerate(ordered):
        for b in ordered[i + 1:]:
            pairs[(a, b)] += 1

flagged = [(p, n) for p, n in pairs.items()
           if n >= THRESHOLD and p not in ALLOWED and (p[1], p[0]) not in ALLOWED]

if flagged:
    print("FAIL logic duplicated across functions:")
    for (a, b), n in sorted(flagged, key=lambda x: -x[1]):
        print(f"    {n} identical lines: {a} <-> {b}")
    print("    Share it, or add the pair to ALLOWED with the reason.")
    sys.exit(1)
print(f"OK   no unexplained duplication ({len(pairs)} function pairs compared)")
