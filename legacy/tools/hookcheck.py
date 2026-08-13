#!/usr/bin/env python3
"""Hooks must run on every render, at the top level of a component.

An edit inserted `useEscape(finish)` inside the body of `finish` itself, so the
hook ran only when the splash was tapped. That is a hook called conditionally:
it breaks the rules of hooks and throws. The effect was that the launch splash
could not be dismissed at all — the tap that should have closed it was the
thing that broke it, and the app sat on the loading animation.

Nothing caught it. validate.js resolves identifiers and does not care where
they sit; scopecheck looks for undeclared names; the test suites never render.
A misplaced hook is invisible to all of them and fatal to the user.

The rule: a hook call must sit at exactly one indent level inside a top-level
function, with no intervening block.
"""
import re
import sys

path = sys.argv[1] if len(sys.argv) > 1 else "src/reef-console.jsx"
lines = open(path, encoding="utf-8").read().split("\n")

HOOK = re.compile(r"^(\s*)(use[A-Z]\w*)\(")
TOP_LEVEL_FN = re.compile(r"^(function|const)\s+\w+")

problems = []
current_fn = None
for i, line in enumerate(lines):
    if TOP_LEVEL_FN.match(line):
        current_fn = line.split("(")[0].split("=")[0].replace("function ", "").strip()
    m = HOOK.match(line)
    if not m:
        continue
    indent = len(m.group(1))
    hook = m.group(2)
    # 2 spaces is the body of a top-level function. Anything deeper is inside
    # a block, a callback or a condition.
    if indent != 2:
        problems.append((i + 1, current_fn or "?", hook, indent, line.strip()[:60]))

if problems:
    print("FAIL hooks that do not run on every render:")
    for line_no, fn, hook, indent, text in problems:
        print(f"    line {line_no} in {fn}: {hook} at indent {indent} — {text}")
    sys.exit(1)

total = sum(1 for l in lines if HOOK.match(l))
if total == 0:
    print("FAIL hookcheck: found no hooks at all — the parser is wrong")
    sys.exit(1)
print(f"OK   every hook runs on every render ({total} checked)")
