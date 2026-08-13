"""Builds build/engines.js — the engine-only module every test harness imports.

Previously each harness rebuilt this inline with its own export list, so
whichever script ran last decided what the others could see. robust.js then
threw twelve times on functions that exist in the app but were missing from
whatever list happened to be current. Exporting everything top-level removes
the coupling entirely.
"""
import re, os, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.makedirs(os.path.join(ROOT, "build"), exist_ok=True)

src = open(os.path.join(ROOT, 'src', 'reef-console.jsx')).read()

# Logic only: everything before the first React component, plus the engine
# blocks that sit further down between components.
cut = src.index('function ParamGauge(')
logic = re.sub(r'^import [\s\S]*?from "[^"]+";\n', '', src[:cut], flags=re.M)
for start, end in [('/* --- Safe rate of change ---', '/* ---------------------------------- main app ---')]:
    logic += src[src.index(start):src.index(end)]

# Some pure helpers live among the components (niceAxis, for instance). Pull in
# any lowercase-named function from the rest of the file that contains no JSX,
# so a harness cannot miss a function purely because of where it was written.
rest = src[cut:]
for m in re.finditer(r'\nfunction ([a-z][\w$]*)\([\s\S]*?\n\}\n', rest):
    body = m.group(0)
    if '<' in body and '/>' in body:
        continue
    if re.search(r'^function ' + m.group(1) + r'\b', logic, re.M):
        continue
    logic += body

# Strip anything containing JSX — harnesses only need the maths.
logic = re.sub(r'\nfunction [A-Z]\w*\([\s\S]*?\n\}\n(?=\n|function|const|/\*)', '\n', logic)

names = set(re.findall(r'^(?:async\s+)?function\s+([a-zA-Z_$][\w$]*)', logic, re.M))
names |= set(re.findall(r'^const\s+([A-Z_][A-Z0-9_]*)\s*=', logic, re.M))
names |= set(re.findall(r'^const\s+([a-z][\w$]*)\s*=\s*\(', logic, re.M))
names = {n for n in names if not n[0].isupper() or n.isupper() or n[0].isupper()}

icons = ['LayoutDashboard','FlaskConical','FileBarChart2','ListChecks','SunMedium','StickyNote',
         'Images','Plus','Trash2','X','Waves','Bell','CheckCircle2','AlertTriangle','Upload','Check',
         'ArrowUp','ArrowDown','Minus','RotateCcw','ChevronDown','ChevronUp','Settings2','Save',
         'Activity','Scale','Beaker','Target','Gauge','Calculator','Download','Droplets']
stub = ('const ' + ', '.join(i + '=null' for i in icons) + ';\n'
        'const useState=(v)=>[v,()=>{}],useMemo=(f)=>f(),useEffect=()=>{},useRef=()=>({});\n'
        'const window={storage:null,localStorage:null,matchMedia:()=>({matches:false})};\n')

# Strict mode, because the app runs strict and this did not. Babel transforms
# the source with sourceType "module", which is strict by definition, so an
# implicit global throws in the browser and passed silently here — an
# extraction left two callers assigning an undeclared `next` and validate,
# scopecheck and a 5,940-case fingerprint all agreed it was fine. A harness
# more permissive than the app is a harness that certifies crashes.
out = ('"use strict";\n' + stub + logic
       + '\nmodule.exports={' + ','.join(sorted(names)) + '};\n')
open(os.path.join(ROOT, 'build', 'engines.js'), 'w').write(out)
print(f"harness built: {len(names)} exports")
