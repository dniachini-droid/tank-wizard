#!/usr/bin/env python3
"""Every custom class must have a rule, and every rule must be used.

The behavioural suites cannot see the UI layer at all, so a class with no
styling renders as an unstyled element and a rule with no class is dead weight
that will confuse the next person to read it. This caught `sb-swatch`, which
was being styled by an element selector (`.sb-key i`) while the markup named a
class — working by accident, and silently lost the moment either moved.

Reads the built HTML rather than the source so it sees exactly what ships.
"""
import re, sys

path = sys.argv[1] if len(sys.argv) > 1 else 'build/reef-console.html'
html = open(path, encoding='utf-8').read()
app = html.split('<script id="app-src" type="text/plain">')[1].split('</script>')[0]

used = set()
for m in re.finditer(r'className="([^"{]*)"', app):
    used.update(m.group(1).split())
# Template literals, including the branches of a ternary inside them — those
# class names are just as real as the static ones.
for m in re.finditer(r'className=\{`([^`]*)`\}', app):
    body = m.group(1)
    for lit in re.findall(r'"([^"]*)"', body):
        used.update(lit.split())
    for t in re.sub(r'\$\{[^}]*\}', ' ', body).split():
        used.add(t)
for m in re.finditer(r'className=\{[^}]*\?[^}]*\}', app):
    for lit in re.findall(r'"([^"]*)"', m.group(0)):
        used.update(lit.split())

# A fixed prefix list meant a new family was simply invisible: the splash
# classes for the correction celebration had no rules at all and this reported
# OK, because "splash" was not on the list. The checker is only worth having if
# adding a class cannot silently opt out of it — so treat anything that is not
# a known Tailwind utility as custom, and let the allowlist below carry the
# handful of exceptions.
TAILWIND = re.compile(
    r'^(?:'
    r'[a-z]+:'                     # responsive / state prefixes
    r'|-?(?:m|p)[trblxy]?-'
    r'|(?:w|h|min-w|min-h|max-w|max-h|inset|top|right|bottom|left|z)-'
    r'|(?:flex|grid|col|row|gap|order|basis|grow|shrink)(?:-|$)'
    r'|(?:items|justify|content|self|place)-'
    r'|(?:text|font|leading|tracking|whitespace|break|truncate|tabular)(?:-|$)'
    r'|(?:bg|border|rounded|ring|shadow|opacity|outline|divide)(?:-|$)'
    r'|(?:absolute|relative|fixed|sticky|static|block|inline|hidden|table|contents)$'
    r'|(?:overflow|object|cursor|pointer-events|select|resize|appearance)(?:-|$)'
    r'|(?:transition|duration|ease|delay|animate|transform|scale|rotate|translate|origin)(?:-|$)'
    r'|(?:space|backdrop|filter|blur|list|align|uppercase|lowercase|capitalize|italic|underline)(?:-|$)'
    r'|(?:sr-only|not-sr-only|antialiased|shrink|grow|isolate|mix-blend)(?:-|$)'
    r'|(?:aspect|inline-block|inline-flex|inline-grid|float|clear|box|container)(?:-|$)'
    r')'
)
# Utility-looking names that are genuinely ours would go here.
NOT_CUSTOM = set()
custom = sorted(c for c in used if not TAILWIND.match(c) and c not in NOT_CUSTOM)
missing = [c for c in custom if '.' + c not in html]

defined = set(re.findall(r'\.((?:brief|strip|sb|el|hero|param-row|session)[a-z0-9-]*)\s*[,{:]', html))
unused = sorted(d for d in defined if d not in used)

problems = []
for c in missing:
    problems.append(f'class used with no CSS rule: {c}')
for d in unused:
    problems.append(f'CSS rule never used: {d}')

if problems:
    print('FAIL stylesheet and markup disagree:')
    for p in problems:
        print(f'    {p}')
    sys.exit(1)
print(f'OK   stylesheet matches markup ({len(custom)} custom classes)')
