const L=require(require('path').join(__dirname, '..', '..', 'build', 'engines-new.cjs'));
const D=(n)=>new Date(Date.parse('2026-08-09')-n*86400000).toISOString().slice(0,10);
let calls=0,throws=0,bad=[];
const T=(n,f)=>{calls++;try{const r=f();
  const j=JSON.stringify(r);
  if(j&&/null,"|:NaN|"NaN|Infinity/.test(j)&&!/"note"/.test(j)) {}
  return r;}catch(e){throws++;bad.push(n+' :: '+e.message);}};

const defs=L.PARAM_DEFS;
const EDGE=[
  ['empty readings',[]],
  ['one reading',[{param:'alkalinity',value:8,date:D(0)}]],
  ['all same date',[...Array(10)].map((_,i)=>({param:'alkalinity',value:8+i*0.1,date:D(5)}))],
  ['zero values',[...Array(10)].map((_,i)=>({param:'alkalinity',value:0,date:D(i*2)}))],
  ['negative values',[...Array(10)].map((_,i)=>({param:'alkalinity',value:-1,date:D(i*2)}))],
  ['huge values',[...Array(10)].map((_,i)=>({param:'alkalinity',value:1e6,date:D(i*2)}))],
  ['tiny values',[...Array(10)].map((_,i)=>({param:'phosphate',value:1e-9,date:D(i*2)}))],
  ['future dates',[...Array(10)].map((_,i)=>({param:'alkalinity',value:9,date:D(-i*2)}))],
  ['unknown param',[...Array(10)].map((_,i)=>({param:'unobtainium',value:5,date:D(i*2)}))],
];
const SETTINGS=[
  ['zero volume',{volumeL:0}],
  ['negative volume',{volumeL:-50}],
  ['null strengths',{dkhPerMlPer100L:null,caPpmPerMlPer100L:null}],
  ['zero strengths',{dkhPerMlPer100L:0,caPpmPerMlPer100L:0}],
  ['negative dose',{dailyDoseMl:-5}],
  ['massive dose',{dailyDoseMl:1e6}],
  ['NaN strength',{dkhPerMlPer100L:NaN}],
];
const WCS=[['none',[]],['zero litres',[{id:'a',date:D(5),litres:0}]],
  ['negative litres',[{id:'a',date:D(5),litres:-10}]],
  ['litres > volume',[{id:'a',date:D(5),litres:99999}]]];

for(const [rn,R] of EDGE) for(const [sn,so] of SETTINGS) for(const [wn,W] of WCS){
  const S={...L.DEFAULT_SETTINGS,...so};
  const id=`${rn} / ${sn} / ${wn}`;
  const latest={};for(const d of defs){const rs=R.filter(r=>r.param===d.key).sort((a,b)=>a.date<b.date?1:-1);latest[d.key]=rs[0]||null;}
  T(id+' findings',()=>L.buildFindings({readings:R,icps:L.ICP_SEED,paramDefs:defs,settings:S,doseLog:[],waterChanges:W,latestByParam:latest}));
  T(id+' overview',()=>L.buildOverview(R,latest,defs));
  T(id+' advice',()=>{for(const k of ['alkalinity','calcium','magnesium']){const dd=defs.find(d=>d.key===k);const fn=k==='alkalinity'?L.assessAlkalinity:k==='calcium'?L.assessCalcium:L.assessMagnesium;fn({readings:R,doseLog:[],waterChanges:[],corrections:[],settings:S,def:dd});}return true;});
  T(id+' ionic',()=>L.computeIonicBalance(R,S));
  T(id+' nutrient',()=>L.computeNutrientProduction('nitrate',R,W,S));
  T(id+' demand',()=>L.computeDemandSeries('alkalinity',R,W,S));
  T(id+' calibrate',()=>L.calibrateDoseStrength('alkalinity',R,[{id:'x',date:D(30),ml:5,element:'alkalinity'},{id:'y',date:D(10),ml:9,element:'alkalinity'}],W,S));
  T(id+' skeleton',()=>L.computeSkeletonMass(0.5,S.volumeL));
  T(id+' predict',()=>L.predictAfterChange(latest,defs,S.volumeL,10));
  T(id+' axis',()=>{const v=R.map(r=>r.value);return v.length?L.niceAxis(Math.min(...v),Math.max(...v)):null;});
}
console.log('edge calls:',calls,' throws:',throws);
bad.slice(0,10).forEach((b)=>console.log('  '+b));
/* This printed the count and exited 0, so a throw was reported and the gate
   passed anyway. Four suites were doing that — fuzz3, robust, run_all and
   textcheck — which meant a quarter of the behavioural checks could not fail. */
if (throws) process.exit(1);
bad.slice(0,15).forEach(b=>console.log('  '+b));
