#!/usr/bin/env python3
"""Checks that every value passed from the app root actually exists there.

Written after a blank screen: Tank was handed `overview`, `sparkRowsByParam`
and `stabilityByParam` from the root, but those were computed inside Dashboard's
own body and had never existed at the root. Passing them referenced undeclared
variables, which React surfaces as an empty page with no message.

validate.js did not catch it because it checks the file as a whole — the names
were declared *somewhere*, just not in the scope doing the passing.
"""
import re, sys

path = sys.argv[1] if len(sys.argv) > 1 else 'src/reef-console.jsx'
src = open(path, encoding='utf-8').read()

start = src.index('export default function ReefConsole')
# The root ends at the next top-level function declaration.
m = re.search(r'\n(?=function [A-Za-z])', src[start:])
root = src[start:start + (m.start() if m else len(src) - start)]

declared = set(re.findall(r'\b(?:const|let|var|function)\s+([A-Za-z_$][\w$]*)', root))
declared |= set(re.findall(r'const\s*\[\s*([A-Za-z_$][\w$]*)\s*,\s*([A-Za-z_$][\w$]*)\s*\]', root)
                and [x for pair in re.findall(r'const\s*\[\s*([A-Za-z_$][\w$]*)\s*,\s*([A-Za-z_$][\w$]*)\s*\]', root) for x in pair])
declared |= set(re.findall(r'const\s*\{([^}]*)\}\s*=', root) and
                [n.split(':')[-1].strip() for grp in re.findall(r'const\s*\{([^}]*)\}\s*=', root)
                 for n in grp.split(',') if n.strip()])

# Shorthand props inside {...{ a, b, c }} spreads and prop={value} pairs.
used = set()
for grp in re.findall(r'\{\.\.\.\{([^}]*)\}\}', root):
    for n in grp.split(','):
        n = n.strip()
        if re.fullmatch(r'[A-Za-z_$][\w$]*', n):
            used.add(n)
for m2 in re.finditer(r'\w+=\{([A-Za-z_$][\w$]*)\}', root):
    used.add(m2.group(1))

builtin = {'true', 'false', 'null', 'undefined', 'Math', 'Object', 'Array', 'JSON',
           'String', 'Number', 'Boolean', 'Date', 'window', 'document', 'console'}
missing = sorted(n for n in used - declared - builtin if not n[0].isupper())

if missing:
    print("FAIL values passed from the root but never declared there:")
    for n in missing:
        print(f"    {n}")
    sys.exit(1)
print(f"OK   root passes only values it declares ({len(used)} checked)")
