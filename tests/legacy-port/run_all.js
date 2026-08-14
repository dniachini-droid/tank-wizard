const L = require(require('path').join(__dirname, '..', '..', 'build', 'engines-new.cjs'));
const { TANKS, D } = require('./tanks3.js');

let calls=0, throws=0, flags=[];
const fail=(tank,fn,e)=>{throws++; flags.push(`THROW  ${tank} :: ${fn} :: ${e.message}`);};
const susp=(tank,what)=>flags.push(`SUSPECT ${tank} :: ${what}`);
const T=(tank,name,fn)=>{calls++; try{return fn();}catch(e){fail(tank,name,e);return undefined;}};

// water-change patterns to vary
const WC_SETS = {
  'none': [],
  'weekly10': [...Array(20)].map((_,i)=>({id:'w'+i,date:D(3+i*7),litres:10})),
  'fortnight25': [...Array(8)].map((_,i)=>({id:'w'+i,date:D(5+i*14),litres:25})),
  'huge': [...Array(4)].map((_,i)=>({id:'w'+i,date:D(7+i*21),litres:500})),
};
const DOSE_LOGS = {
  'none': [],
  'one': [{id:'d1',date:D(30),ml:6,element:'alkalinity'}],
  'several': [
    {id:'d1',date:D(90),ml:5,element:'alkalinity'},
    {id:'d2',date:D(50),ml:8,element:'alkalinity'},
    {id:'d3',date:D(20),ml:11,element:'alkalinity'},
    {id:'d4',date:D(60),ml:6,element:'calcium'},
    {id:'d5',date:D(25),ml:10,element:'calcium'},
  ],
};
const ICP_SETS = { 'none': [], 'seed': L.ICP_SEED };

for (const tank of TANKS) {
  for (const [wcName, wcs] of Object.entries(WC_SETS)) {
    for (const [dlName, dl] of Object.entries(DOSE_LOGS)) {
      for (const [icpName, icps] of Object.entries(ICP_SETS)) {
        const id = `${tank.name} | wc:${wcName} dose:${dlName} icp:${icpName}`;
        const R = tank.readings, S = tank.settings, defs = L.PARAM_DEFS;
        const latest = {};
        for (const d of defs) {
          const rs = R.filter(r=>r.param===d.key).sort((a,b)=>a.date<b.date?1:-1);
          latest[d.key]=rs[0]||null;
        }

        T(id,'buildFindings',()=>{
          const f=L.buildFindings({readings:R,icps,paramDefs:defs,settings:S,doseLog:dl,waterChanges:wcs,latestByParam:latest});
          for (const x of f.findings) {
            if (!x.id||!x.title||!x.detail) susp(id,'finding missing fields: '+JSON.stringify(x).slice(0,60));
            if (/NaN|undefined|Infinity/.test(x.detail)) susp(id,'finding text: '+x.detail.slice(0,90));
            if (!['info','watch','act'].includes(x.severity)) susp(id,'bad severity '+x.severity);
          }
          return f;
        });

        T(id,'overview',()=>{
          const o=L.buildOverview(R,latest,defs);
          if(o&&o.paragraphs) for(const p of o.paragraphs)
            if(/NaN|undefined|Infinity/.test(p)) susp(id,'overview: '+p.slice(0,90));
          return o;
        });

        T(id,'doseAdvice',()=>{
          const a=L.computeDoseAdvice(R,dl,defs,30,S);
          for(const k of ['alkalinity','calcium','magnesium']){
            const e=a.advice[k]; if(!e) continue;
            const dd=defs.find(d=>d.key===k);
            const fn=k==='alkalinity'?L.assessAlkalinity:k==='calcium'?L.assessCalcium:L.assessMagnesium;
            const pa=fn({readings:R,doseLog:[],waterChanges:[],corrections:[],settings:S,def:dd});
            const txt=(pa.explanation||pa.reason||'');
            if(/NaN|undefined|Infinity/.test(txt)) susp(id,k+' advice: '+txt.slice(0,90));
            if(e.calc&&!e.calc.impossible){
              const c=e.calc;
              if(!isFinite(c.recommendedMl)) susp(id,k+' recommendedMl not finite');
              if(c.recommendedMl<0) susp(id,k+' negative mL: '+c.recommendedMl);
              if(c.recommendedMl>10000) susp(id,k+' absurd mL: '+c.recommendedMl);
            }
          }
          return a;
        });

        T(id,'ionic',()=>{
          const b=L.computeIonicBalance(R,S);
          if(b&&b.note&&/NaN|undefined|Infinity/.test(b.note)) susp(id,'ionic: '+b.note.slice(0,90));
          if(b&&b.status==='ok'){
            if(!isFinite(b.ratio)) susp(id,'ionic ratio not finite');
            if(b.ratio<0) susp(id,'negative ionic ratio '+b.ratio.toFixed(2));
          }
          return b;
        });

        for (const key of ['nitrate','phosphate']) T(id,'nutrientProd:'+key,()=>{
          const n=L.computeNutrientProduction(key,R,wcs,S);
          if(n&&n.status==='ok'){
            if(!isFinite(n.perWeek)) susp(id,key+' perWeek not finite');
            if(n.equilibrium!=null&&(!isFinite(n.equilibrium)||n.equilibrium<0)) susp(id,key+' bad equilibrium '+n.equilibrium);
            if(n.holdAtMid!=null&&(!isFinite(n.holdAtMid)||n.holdAtMid<0)) susp(id,key+' bad holdAtMid '+n.holdAtMid);
            if(n.halfLifeDays!=null&&!isFinite(n.halfLifeDays)) susp(id,key+' bad halfLife');
            if(n.offsetPct!=null&&!isFinite(n.offsetPct)) susp(id,key+' bad offsetPct');
          }
          return n;
        });

        for (const key of ['alkalinity','calcium']) T(id,'demand:'+key,()=>{
          const d2=L.computeDemandSeries(key,R,wcs,S);
          if(d2&&d2.status==='ok'){
            for(const p of d2.points){
              if(!isFinite(p.demand)||!isFinite(p.lo)||!isFinite(p.hi)) susp(id,key+' demand point not finite');
              if(p.hi<p.lo) susp(id,key+' band inverted');
            }
            if(!isFinite(d2.snr)&&d2.snr!==Infinity) susp(id,key+' snr bad');
          }
          return d2;
        });

        for (const el of L.DOSE_ELEMENTS) T(id,'calibrate:'+el.key,()=>{
          const c=L.calibrateDoseStrength(el.key,R,dl,wcs,S);
          if(c&&c.status==='ok'){
            if(!isFinite(c.median)||c.median<=0) susp(id,el.key+' calibration median '+c.median);
            if(c.range.hi<c.range.lo) susp(id,el.key+' calibration range inverted');
          }
          return c;
        });

        T(id,'skeleton',()=>{
          const c=L.computeConsumption(R,S);
          if(c&&c.consumption!=null){
            const sk=L.computeSkeletonMass(c.consumption,S.volumeL);
            if(sk&&(!isFinite(sk.gPerDay)||sk.gPerDay<0)) susp(id,'skeleton gPerDay '+sk.gPerDay);
          }
        });

        T(id,'calibration',()=>L.computeCalibration(R,icps,defs));
        T(id,'saltCompare',()=>L.computeSaltComparison(latest,defs));
        T(id,'predict',()=>L.predictAfterChange(latest,defs,S.volumeL,10));
        T(id,'nutrientRatio',()=>L.computeNutrientRatio(R));
        for(const d of defs){
          T(id,'control:'+d.key,()=>L.computeControl(d,R,90));
          T(id,'stability:'+d.key,()=>L.computeStability(d,R));
          T(id,'consumption:'+d.key,()=>L.computeElementConsumption(d.key,R,wcs,S));
        }
      }
    }
  }
}
console.log('calls:', calls, ' throws:', throws, ' flags:', flags.length);
flags.slice(0,40).forEach(f=>console.log('  '+f));
if(flags.length>40) console.log('  ...and '+(flags.length-40)+' more');
/* Reported and exited 0. A flag is a real finding: it means an assessment
   produced something the sweep could not reconcile. */
if (throws || flags.length) process.exit(1);
