#!/usr/bin/env python3
"""Fail on code nothing references.

This is the shape that hid a real crash: CA_PER_DKH_LO was used in seven places
and declared in none, and every suite passed because nothing compiled that path.
The fault only surfaced when unrelated dead code was removed and forced a
rebuild. Dead code is not merely untidy here — it is where faults hide.

Reports three things: components defined but never rendered, functions defined
but never referenced, and upper-case constants declared but never read.
"""
import re, sys

path = sys.argv[1] if len(sys.argv) > 1 else 'src/reef-console.jsx'
src = open(path, encoding='utf-8').read()

# Strip comments so prose mentioning a name does not count as a use.
code = re.sub(r'/\*[\s\S]*?\*/', ' ', src)

problems = []

components = set(re.findall(r'^function ([A-Z]\w+)\(', code, re.M))
rendered = set(re.findall(r'<([A-Z]\w+)[\s/>]', code))
for c in sorted(components - rendered):
    problems.append(f'component never rendered: {c}')

# A function counts as used if its name appears anywhere other than its own
# definition — including as a bare reference passed to something else.
for fn in sorted(set(re.findall(r'^function ([a-z]\w+)\(', code, re.M))):
    if len(re.findall(r'(?<![\w.])' + fn + r'(?![\w])', code)) <= 1:
        problems.append(f'function never referenced: {fn}')

for const in sorted(set(re.findall(r'^const ([A-Z_][A-Z0-9_]*)\s*=', code, re.M))):
    if len(re.findall(r'(?<![\w.])' + const + r'(?![\w])', code)) <= 1:
        problems.append(f'constant never read: {const}')

# The inverse, and the more dangerous one: used everywhere, declared nowhere.
# Only SCREAMING_SNAKE names, which is how this codebase spells its constants.
# Requiring an underscore keeps hex colour literals, product codes and words
# like RODI out of the report — they were burying the one real hit under
# twenty-eight false ones.
for name in sorted(set(re.findall(r'\b([A-Z][A-Z0-9]*(?:_[A-Z0-9]+)+)\b', code))):
    uses = len(re.findall(r'(?<![\w.])' + name + r'(?![\w])', code))
    declared = re.search(r'(?m)^\s*(?:const|let|var)\s+' + name + r'\b', code)
    if uses >= 2 and not declared:
        problems.append(f'used but never declared: {name} ({uses} uses)')

if problems:
    print('FAIL dead or undeclared code:')
    for p in problems:
        print(f'    {p}')
    sys.exit(1)
print(f'OK   no dead code ({len(components)} components, all rendered)')
