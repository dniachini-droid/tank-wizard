#!/usr/bin/env python3
"""Everything that animates must stop when the system asks it to.

Ten animations sat outside the prefers-reduced-motion block — the chart draw,
the score bar fill, the stability strips, the splash, the reading-confirmation
flourishes. A partial block is arguably worse than none: the motion that
remains is precisely the motion nobody thought to check, and someone who has
asked their device not to animate should not have to argue with it.

Nothing else inspected this. csscheck confirms every class has a rule and every
rule is used; it has no opinion about whether a rule moves.
"""
import re
import sys

path = sys.argv[1] if len(sys.argv) > 1 else "build/reef-console.html"
html = open(path, encoding="utf-8").read()

# Classes whose rule declares an animation.
animated = {}
for m in re.finditer(r"\.([\w-]+)\s*\{([^}]*)\}", html):
    cls, body = m.group(1), m.group(2)
    if re.search(r"animation:\s*\w", body):
        found = re.search(r"animation:\s*([\w-]+)", body)
        animated[cls] = found.group(1) if found else "?"

# Classes named inside a reduced-motion block.
guarded = set()
for block in re.findall(r"@media \(prefers-reduced-motion[^{]*\{([\s\S]*?)\n\s*\}\s*\n", html):
    guarded |= set(re.findall(r"\.([\w-]+)", block))

if not animated:
    print("FAIL motioncheck: found no animations at all — the parser is wrong")
    sys.exit(1)
if not guarded:
    print("FAIL motioncheck: no prefers-reduced-motion block")
    sys.exit(1)

missing = sorted(c for c in animated if c not in guarded)
if missing:
    print("FAIL animations that ignore prefers-reduced-motion:")
    for cls in missing:
        print(f"    .{cls} ({animated[cls]})")
    sys.exit(1)
print(f"OK   every animation respects reduced motion ({len(animated)} checked)")
