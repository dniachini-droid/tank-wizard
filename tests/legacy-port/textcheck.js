const L=require(require('path').join(__dirname, '..', '..', 'build', 'engines-new.cjs'));
const {TANKS,D}=require('./tanks3.js');

/* The app ships no solution strengths — only the user's own bottle can say
   what a product delivers (docs/spec/reef-chemistry.md §16), and an unset
   strength is refused and named. These simulated tanks stand in for CONFIGURED
   tanks, so they state the strengths explicitly. The figures are the ones this
   harness used to inherit from DEFAULT_SETTINGS, so every expectation is
   unchanged. Cases that deliberately probe a missing or null strength set
   their own and are untouched. */
const TANK_STRENGTHS = { dkhPerMlPer100L: 0.0533, caPpmPerMlPer100L: 0.36, mgPpmPerMlPer100L: 0.024 };

const defs=L.PARAM_DEFS;
let checked=0, dirty=[];
const scan=(id,txt)=>{checked++; if(/NaN|Infinity|undefined|\[object|null /.test(String(txt))) dirty.push(id+' :: '+String(txt).slice(0,110));};

const SETTINGS=[{},{volumeL:0},{volumeL:-50},{dkhPerMlPer100L:NaN},{dkhPerMlPer100L:0},
  {caPpmPerMlPer100L:null},{dailyDoseMl:-5},{dailyDoseMl:1e6},{volumeL:1e7}];
const WCS=[[],[{id:'a',date:D(5),litres:0}],[{id:'a',date:D(5),litres:-10}],
  [{id:'a',date:D(5),litres:99999}],L.WATER_CHANGE_SEED.map(d=>({id:d,date:d,litres:10}))];

for(const t of TANKS) for(const so of SETTINGS) for(const W of WCS){
  const S={...L.DEFAULT_SETTINGS, ...TANK_STRENGTHS,...t.settings,...so};
  const R=t.readings;
  const latest={};for(const d of defs){const rs=R.filter(r=>r.param===d.key).sort((a,b)=>a.date<b.date?1:-1);latest[d.key]=rs[0]||null;}
  const id=t.name+'|'+JSON.stringify(so);
  const f=L.buildFindings({readings:R,icps:L.ICP_SEED,paramDefs:defs,settings:S,doseLog:[],waterChanges:W,latestByParam:latest});
  f.findings.forEach(x=>{scan(id+' finding:'+x.id,x.detail); scan(id+' title:'+x.id,x.title);});
  const o=L.buildOverview(R,latest,defs);
  if(o&&o.paragraphs) o.paragraphs.forEach((p,i2)=>scan(id+' overview'+i2,p));
  const a=L.computeDoseAdvice(R,[],defs,30,S);
  for(const k of ['alkalinity','calcium','magnesium']){
    const dd=defs.find(d=>d.key===k);
    const fn=k==='alkalinity'?L.assessAlkalinity:k==='calcium'?L.assessCalcium:L.assessMagnesium;
    const pa=fn({readings:R,doseLog:[],waterChanges:[],corrections:[],settings:S,def:dd});
    scan(id+' dose:'+k,(pa.explanation||'')+(pa.reason||'')+(pa.caution||''));
  }
  const b=L.computeIonicBalance(R,S); if(b&&b.note) scan(id+' ionic',b.note);
  if(b&&b.mgNote) scan(id+' mgNote',b.mgNote.text);
  for(const k of ['nitrate','phosphate']){const n=L.computeNutrientProduction(k,R,W,S); if(n&&n.note) scan(id+' nut:'+k,n.note);}
  const nr=L.computeNutrientRatio(R); if(nr&&nr.note) scan(id+' ratio',nr.note);
}
console.log('text fragments checked:',checked,' dirty:',dirty.length);
dirty.slice(0,20).forEach(d=>console.log('  '+d));
/* "dirty: 0" was printed and the gate moved on regardless of the number.
   Broken text reaching a user is exactly what this exists to stop. */
if (dirty.length) process.exit(1);
