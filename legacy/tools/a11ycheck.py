#!/usr/bin/env python3
"""Contrast and focus: the two things that decide whether the app is usable.

Text colours were between 2.55 and 3.93 against the page, well under the 4.5:1
that normal text needs — and the worst of them was the warn amber, which is
used as a tone and becomes the text of a warning. A warning nobody can
comfortably read is worse than no warning.

There was also no focus indicator at all: no :focus-visible rule and no outline
anywhere in the stylesheet, so someone navigating by keyboard could not see
where they were. Every other accessibility detail is moot if you cannot tell
which control you are on.

Neither was inspected by anything. csscheck confirms a class has a rule; it has
no opinion about whether that rule can be read.
"""
import re
import sys

path = sys.argv[1] if len(sys.argv) > 1 else "build/reef-console.html"
html = open(path, encoding="utf-8").read()

PAGE_BG = "#F3F7F6"

# Scanned, not listed. A fixed list is how csscheck reported OK for months
# while a whole class family went unstyled — and the first version of this
# checker had the same hole: reverting a colour to its old failing value went
# unnoticed because the old value was not on the list.
#
# Every colour the stylesheet or markup applies as text is checked. Chart
# strokes and fills are excluded by only reading `color:` declarations: 3:1 is
# the bar for a graphical object and those clear it.
# Only `color:` — not border-color, background-color or outline-color, which
# an earlier version swept up and reported as failing text.
TEXT_COLOURS = sorted(set(
    re.findall(r"(?<![-\w])color:\s*(#[0-9A-Fa-f]{6})\b", html)
))

# Deliberate exceptions, each with a reason.
ALLOWED = {
    "#FFFFFF": "on a dark surface",
    "#EAFFFB": "the launch splash, which is dark",
    "#F3F7F6": "the page background itself, used as text only on dark",
}


def rgb(h):
    h = h.lstrip("#")
    return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))


def luminance(c):
    def channel(v):
        v /= 255
        return v / 12.92 if v <= 0.03928 else ((v + 0.055) / 1.055) ** 2.4
    r, g, b = (channel(x) for x in c)
    return 0.2126 * r + 0.7152 * g + 0.0722 * b


def contrast(a, b):
    la, lb = luminance(rgb(a)), luminance(rgb(b))
    hi, lo = max(la, lb), min(la, lb)
    return (hi + 0.05) / (lo + 0.05)


bad = []
for colour in TEXT_COLOURS:
    if colour.upper() in ALLOWED:
        continue
    r = contrast(colour, PAGE_BG)
    if r < 4.5:
        bad.append((colour, r))

if bad:
    print("FAIL text colours below 4.5:1 against the page:")
    for colour, r in sorted(bad, key=lambda x: x[1]):
        print(f"    {colour}  {r:.2f}:1")
    sys.exit(1)

if "focus-visible" not in html:
    print("FAIL no :focus-visible rule — keyboard focus is invisible")
    sys.exit(1)
if not re.search(r":focus-visible\s*\{[^}]*outline:\s*(?!none)", html):
    print("FAIL :focus-visible exists but declares no visible outline")
    sys.exit(1)

print(f"OK   contrast and focus ({len(TEXT_COLOURS)} text colours, focus ring present)")
