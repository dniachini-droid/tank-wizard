#!/usr/bin/env python3
"""Compare props passed to each component against the props it destructures.

A prop passed but not destructured is `undefined` inside the component, which
crashes the moment it's used — a blank tab with nothing in the validator to
show for it. This is exactly how the Tasks tab broke.
"""
import re, sys
src = open(sys.argv[1]).read()

# Signatures: function Name({ a, b = [], c }) {
sigs = {}
for m in re.finditer(r'function ([A-Z]\w*)\(\{([^)]*?)\}\)\s*\{', src, re.S):
    name, body = m.group(1), m.group(2)
    props = set()
    depth = 0
    token = ''
    for ch in body:
        if ch in '([{': depth += 1
        elif ch in ')]}': depth -= 1
        if ch == ',' and depth == 0:
            props.add(token.strip()); token = ''
        else:
            token += ch
    props.add(token.strip())
    clean = set()
    for p in props:
        p = p.split('=')[0].split(':')[0].strip()
        if p and re.match(r'^\w+$', p): clean.add(p)
    sigs[name] = clean

problems = []
for m in re.finditer(r'<([A-Z]\w*)\s([^>]*?)/?>', src, re.S):
    name, attrs = m.group(1), m.group(2)
    if name not in sigs: continue
    if '{...' in attrs: continue          # spread props can't be checked statically
    passed = set(re.findall(r'(\w+)=\{', attrs)) | set(re.findall(r'(\w+)="', attrs))
    passed.discard('key')
    missing = passed - sigs[name]
    if missing:
        line = src[:m.start()].count('\n') + 1
        problems.append(f'{name} (line {line}): passed but not received -> {", ".join(sorted(missing))}')

# The reverse direction: an on* handler used in a body but never received and
# never declared locally is `undefined`, which throws the moment it's called.
bodies = re.split(r'\nfunction ([A-Z]\w*)\(', src)
for i in range(1, len(bodies), 2):
    name, body = bodies[i], bodies[i + 1]
    if name not in sigs: continue
    stop = body.find('\nfunction ')
    if stop > 0: body = body[:stop]
    used = set(re.findall(r'\b(on[A-Z]\w*)\s*[({),.]', body))
    declared = set(re.findall(r'(?:const|let|var|function)\s+(on[A-Z]\w*)', body))
    # Props destructured inside the body (e.g. from a map) count as declared too
    declared |= set(re.findall(r'\{[^}]*\b(on[A-Z]\w*)\b[^}]*\}\s*=', body))
    missing = used - sigs[name] - declared
    # Attributes we pass DOWN to children are fine; only flag ones we call
    called = set(re.findall(r'\b(on[A-Z]\w*)\s*\(', body))
    missing &= called
    if missing:
        problems.append(f'{name}: calls handlers it never receives -> {", ".join(sorted(missing))}')

# An assessment computed but never passed to a component is invisible work —
# this is exactly how the protocol engines ran for days without appearing on
# screen, because the edit that was meant to wire them up never matched.
for name in ["alkAssessment", "caAssessment", "mgAssessment"]:
    if re.search(r'const ' + name + r'\s*=\s*useMemo', src) and not re.search(name + r'\s*[,}]|=\s*' + name + r'\b|\?\s*' + name + r'\b', src.split('useMemo', 1)[-1]):
        problems.append(f'{name}: computed but never passed to any component')

if problems:
    print('FAIL props passed but never destructured:')
    for p in sorted(set(problems)): print('   ', p)
    sys.exit(1)
print('OK   component props match their signatures (%d components)' % len(sigs))
