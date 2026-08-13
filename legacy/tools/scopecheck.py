#!/usr/bin/env python3
"""Find identifiers used in a component's JS body that are never declared.

`validate.js` catches undefined *calls*; this catches undefined *variables* —
the failure that produced "Can't find variable: editing" and a blank tab. It
inspects only the JS above each component's `return (`, which is where hooks and
derived values live, so prose inside JSX can't create false positives.

SCOPE, deliberately: components only, not the engine functions. That is not an
oversight. An undeclared READ throws a ReferenceError the moment the line runs,
in strict mode or out of it, and the engines are exercised by golden,
protocols and run_all on every build — so an undeclared name there fails the
gate at runtime rather than needing a parser to spot it. Components are the
place a path can go unexercised, because nothing renders them.

Verified by probe: an undeclared read inserted into assessCalcium is caught by
golden, protocols and run_all. This checker does not see it and does not need
to.
"""
import re, sys

raw = open(sys.argv[1]).read()

def strip_noise(t):
    """Remove comments and string literals so prose and class names can't be
    mistaken for identifiers."""
    t = re.sub(r'/\*[\s\S]*?\*/', ' ', t)
    t = re.sub(r'(?m)^\s*//[^\n]*$', ' ', t)
    # Trailing comments too — "// 0 counting, 1 counted" was being parsed as
    # three undeclared identifiers.
    t = re.sub(r'(?m)//[^\n]*$', ' ', t)
    t = re.sub(r'"(?:\\.|[^"\\])*"', '""', t)
    t = re.sub(r"'(?:\\.|[^'\\])*'", "''", t)
    t = re.sub(r'`(?:\\.|[^`\\])*`', '``', t)
    return t

src = raw
# `async function foo` is still a top-level declaration; without the optional
# async the scan missed loadKey and requestPersistence entirely.
toplevel = set(re.findall(r'^(?:async\s+)?(?:function|const|let|var|class)\s+(\w+)', src, re.M))
builtins = {
 'React','Math','Object','Array','Number','String','JSON','Date','Set','Map','Promise','Error',
 'console','window','document','navigator','fetch','setTimeout','clearTimeout','setInterval',
 'clearInterval','requestAnimationFrame','cancelAnimationFrame','parseInt','parseFloat','isNaN',
 'isFinite','useState','useEffect','useMemo','useRef','Blob','FileReader','URL','encodeURIComponent',
 'decodeURIComponent','localStorage','sessionStorage','structuredClone','queueMicrotask','Infinity',
 'NaN','undefined','null','true','false','this','super','arguments','globalThis','Boolean','Symbol',
}
keywords = {
 'const','let','var','function','return','if','else','for','while','do','switch','case','break',
 'continue','new','typeof','instanceof','delete','void','in','of','try','catch','finally','throw',
 'class','extends','static','async','await','yield','export','import','default','from','as',
}

problems = []
for m in re.finditer(r'\nfunction ([A-Z]\w*)\(\{([^)]*?)\}\)\s*\{', src, re.S):
    name, sig = m.group(1), m.group(2)
    start = m.end()
    nxt = src.find('\nfunction ', start)
    body = src[start:nxt if nxt > 0 else len(src)]
    body = strip_noise(body)
    # Only the JS above the first return — hooks, memos, derived values. Below
    # that is JSX, where prose and attribute values live.
    # Cut at the component's own JSX return (two-space indent), not at any
    # `return` inside a nested callback — those truncate the scan too early.
    m2 = re.search(r'\n  return \(', body)
    if not m2: continue
    js = body[:m2.start()]
    # Early returns can contain JSX (`if (!x) return <div />`); strip tags so
    # attribute names aren't read as variables.
    # Must only match real tags. The previous pattern took any `<` to the next
    # `>`, so `rows.length < 2` followed later by an arrow `(v) =>` deleted
    # everything between them — including three `const` declarations, which
    # were then reported as undeclared. Requiring a tag name and forbidding
    # newlines keeps it to actual JSX.
    # Requiring a tag name after `<` is what matters: `rows.length < 2` is not
    # a tag, so the scan no longer runs from a comparison to a later arrow and
    # deletes the declarations in between. Newlines stay allowed because real
    # JSX tags wrap across lines.
    js = re.sub(r'</?[A-Za-z][^<>]*>', ' ', js)

    props = set(re.findall(r'(\w+)\s*(?:=[^,]*)?(?:,|$)', sig))
    props |= set(re.findall(r'\b(\w+)\b', sig))
    declared = set(re.findall(r'(?:const|let|var|function)\s+(\w+)', js))
    # Comma-separated declarators: `const a = 1, b = 2;` declares both.
    for stmt in re.findall(r'(?:const|let|var)\s+([^;\n]+)', js):
        for part in stmt.split(','):
            nm = part.split('=')[0].strip()
            if re.match(r'^\w+$', nm): declared.add(nm)
    for a, b in re.findall(r'(?:const|let|var)\s*\[\s*(\w+)\s*,\s*(\w+)\s*\]', js):
        declared |= {a, b}
    for grp in re.findall(r'(?:const|let|var)\s*\{([^}]*)\}\s*=', js):
        declared |= {p.split(':')[-1].split('=')[0].strip() for p in grp.split(',')}
    # parameters of inner arrow functions and callbacks
    for grp in re.findall(r'\(([^()]*)\)\s*=>', js):
        declared |= {p.split('=')[0].replace('{','').replace('}','').replace('[','').replace(']','').strip()
                     for p in grp.split(',')}
    for one in re.findall(r'(\w+)\s*=>', js):
        declared.add(one)
    declared |= set(re.findall(r'catch\s*\(\s*(\w+)', js))

    used = set(re.findall(r'(?<![.\w$\'"`])([a-z_]\w*)\s*(?=[.\[)(,;=<>!?+\-*/&|\s])', js))
    unknown = sorted(u for u in used
                     if u not in props and u not in declared and u not in toplevel
                     and u not in builtins and u not in keywords)
    if unknown:
        line = src[:start].count('\n') + 1
        problems.append(f'{name} (line {line}): {", ".join(unknown)}')

# Verified false positives: destructuring patterns and JSX text this simple
# parser cannot model. Anything NOT on this list fails the run, so a genuinely
# orphaned reference — the bug that has produced three blank tabs — is caught
# before it ships rather than being lost in advisory noise.
KNOWN_OK = {
    "CompletionCalendar": {"a", "c", "start", "weeks"},
    "DeleteButton": {"className", "e", "style"},
    "ZoomableLineChart": {"onTouchMove", "r", "values"},
    "ParamHistoryModal": {"windowStats"},
    "TestLab": {"def", "key"},
    "LaunchSplash": {"b"},
    "CoralClump": {"b"},
    # Prose between JSX tags on the same line as an expression — the stripper
    #    reads "Cancel and go back to {fmtAmount(x)} mL/day" as identifiers. The
    #    words below are all plain English from that panel's copy.
    "CorrectionPanel": {"and", "back", "complete", "day", "dose", "go", "it",
                        "mL", "running", "to"},
    "ReminderSheet": {"intervalNum"},
    "LogResultPopup": {"t", "i", "timers"},
    "TaskDonePopup": {"a", "avg", "b", "t"},
    "IcpResultPopup": {"moves", "pct", "was"},
}

real = []
for line in problems:
    name = line.split(" (")[0]
    ids = {x.strip() for x in line.split(": ", 1)[1].split(",")}
    unknown = ids - KNOWN_OK.get(name, set())
    if unknown:
        real.append(f"{name}: {', '.join(sorted(unknown))}")

if real:
    print("FAIL identifiers used but never declared:")
    for r in real: print("   ", r)
    sys.exit(1)
print("OK   no new undeclared identifiers (%d known false positives allowed)"
      % sum(len(v) for v in KNOWN_OK.values()))
sys.exit(0)

# Advisory, not a gate. A precise version would need a real JS parser; this
# catches the common case (an orphaned reference left behind by an edit) at the
# cost of some false positives from destructuring it doesn't model. Worth
# scanning by eye after edits; the error boundary catches whatever slips past.
if problems:
    print('SUSPECTS (verify by eye — some are destructuring this cannot model):')
    for p in problems: print('   ', p)
else:
    print('OK   no undeclared identifiers in component bodies')
