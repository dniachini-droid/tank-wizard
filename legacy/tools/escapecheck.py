#!/usr/bin/env python3
"""Every overlay must close on Escape.

One modal of ten had this and the other nine did not, so a keyboard user could
open a sheet and have no way out: every other route to closing it was a click,
on a button or on the backdrop. The one that worked had a hand-rolled keydown
listener, which is why the other nine never got one — there was nothing to
reuse and nothing to notice its absence.

The handling is now a `useEscape` hook, and this checks that every component
rendering a full-screen overlay calls it.
"""
import re
import sys

path = sys.argv[1] if len(sys.argv) > 1 else "src/reef-console.jsx"
src = open(path, encoding="utf-8").read()
lines = src.split("\n")

# Component boundaries.
starts = [(i, l.split("(")[0].replace("function ", "").strip())
          for i, l in enumerate(lines) if l.startswith("function ")]

def owner_of(line_no):
    name = None
    for i, n in starts:
        if i < line_no:
            name = n
        else:
            break
    return name

def body_of(name):
    start = next((i for i, n in starts if n == name), None)
    if start is None:
        return ""
    end = next((i for i, n in starts if i > start), len(lines))
    return "\n".join(lines[start:end])

overlays = set()
for i, line in enumerate(lines):
    if "fixed inset-0" in line:
        name = owner_of(i)
        if name:
            overlays.add(name)

if not overlays:
    print("FAIL escapecheck: found no overlays at all — the parser is wrong")
    sys.exit(1)

if "function useEscape(" not in src:
    print("FAIL escapecheck: the useEscape hook is gone")
    sys.exit(1)

missing = sorted(n for n in overlays if "useEscape(" not in body_of(n))
if missing:
    print("FAIL overlays that cannot be closed with Escape:")
    for name in missing:
        print(f"    {name}")
    sys.exit(1)

print(f"OK   every overlay closes on Escape ({len(overlays)} checked)")
