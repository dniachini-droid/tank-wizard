#!/usr/bin/env python3
"""Every dose claim in the tank summary must repeat the dosing engine's words.

The summary and the Dosing Wizard describe the same state. When each writes its
own sentence they drift, and the drift is invisible until someone reads both
screens: "parked off-target" on one while the other said "on its way to 475",
about the same element on the same day.

The rule is narrow on purpose. Claims about groups ("5 of 6 are in range") or
about stability rather than dosing are legitimately the summary's own voice.
What may not differ is a claim about a dose state, because the engine has
already worded that and the summary is repeating it.
"""
import re, sys

path = sys.argv[1] if len(sys.argv) > 1 else "src/reef-console.jsx"
src = open(path, encoding="utf-8").read()

m = re.search(r"\nfunction buildBriefing\(", src)
if not m:
    print("FAIL wordingcheck: buildBriefing not found")
    sys.exit(1)
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
body = src[start:k]

bad = []
checked = 0
for a in re.finditer(r"add\(\{[\s\S]{0,600}?\}\);", body):
    block = a.group(0)
    ident = re.search(r"id:\s*([^,\n]+)", block)
    claim = re.search(r"claim:\s*([^\n]+?),?\s*$", block, re.M)
    if not ident or not claim:
        continue
    ident_s, claim_s = ident.group(1).strip(), claim.group(1).strip().rstrip(",")
    if '"dose:"' not in ident_s:
        continue
    checked += 1
    # d.headline, or a ternary whose branches are all d.headline
    if not re.fullmatch(r"d\.headline", claim_s):
        bad.append((ident_s, claim_s[:70]))

if bad:
    print("FAIL dose claims that do not repeat the engine's wording:")
    for i, c in bad:
        print(f"    {i}: {c}")
    sys.exit(1)
print(f"OK   dose claims repeat the engine's wording ({checked} checked)")
