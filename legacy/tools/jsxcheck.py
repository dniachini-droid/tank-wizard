#!/usr/bin/env python3
"""Verify JSX tag balance. A brace-balance check cannot catch an unclosed
<div>, which is how a broken layout can pass every other test."""
import sys
src = open(sys.argv[1]).read()

def scan(src, tag):
    i = opens = closes = selfc = 0
    n = len(src)
    while i < n:
        # Skip block comments, but only where one genuinely starts: at
        # whitespace or line start. Requiring that keeps accept="image/*"
        # from being read as a comment opener, which previously swallowed
        # 3.8k characters of real markup.
        if src.startswith('/*', i) and (i == 0 or src[i - 1] in ' \t\n(,;{'):
            end = src.find('*/', i + 2)
            i = n if end < 0 else end + 2
            continue
        if src.startswith('</' + tag, i) and not src[i + 2 + len(tag)].isalnum():
            closes += 1; i += 2 + len(tag); continue
        if src.startswith('<' + tag, i) and not src[i + 1 + len(tag)].isalnum():
            j = i + 1 + len(tag); depth = 0; q = None; selfclose = False
            while j < n:
                c = src[j]
                # A block comment inside the attributes is skipped whole. Without
                # this an apostrophe in a comment — "Chrome's URL bar" — opened a
                # quote that never closed, so the scanner ran past the closing
                # tag and reported a phantom imbalance.
                if not q and src.startswith('/*', j):
                    end = src.find('*/', j + 2)
                    j = n if end < 0 else end + 2
                    continue
                if q:
                    if c == '\\': j += 2; continue
                    if c == q: q = None
                elif c in '"\'`': q = c
                elif c == '{': depth += 1
                elif c == '}': depth -= 1
                elif depth == 0 and c == '>':
                    k = j - 1
                    while k > i and src[k] in ' \n\t': k -= 1
                    selfclose = src[k] == '/'
                    break
                j += 1
            if selfclose: selfc += 1
            else: opens += 1
            i = j + 1; continue
        i += 1
    return opens, closes

TAGS = ['div','p','span','InfoBlock','Card','main','nav','aside','button','form',
        'select','label','ResponsiveContainer','LineChart','Field','Btn','Stat']
bad = []
for t in TAGS:
    o, c = scan(src, t)
    if o != c: bad.append(f'{t}: {o} open vs {c} close')
if bad:
    print('FAIL JSX tag imbalance:'); [print('   ', b) for b in bad]; sys.exit(1)
print('OK   JSX tags balanced (%d tag types checked)' % len(TAGS))
