const L = require(require('path').join(__dirname, '..', 'build', 'engines.js'));
const defs = L.PARAM_DEFS;
const D = k => defs.find(d=>d.key===k);
let issues = [];
function tryIt(label, fn) {
  try { const r = fn(); console.log('  OK   ' + label.padEnd(46) + ' → ' + (r===undefined?'undefined':r)); }
  catch (e) { console.log('  THROW ' + label.padEnd(45) + ' → ' + e.message); issues.push(label); }
}
function mk(p,vals,st=2){return vals.map((v,i)=>({id:p+i,param:p,value:v,
 date:new Date(Date.parse('2026-08-09')-(vals.length-1-i)*st*86400000).toISOString().slice(0,10)}));}

console.log('╔═══ INPUT ROBUSTNESS — things a real user will eventually do ═══╗\n');
const S = {...L.DEFAULT_SETTINGS, volumeL:77, dailyDoseMl:8, dkhPerMlPer100L:0.069};

tryIt('empty readings array', () => JSON.stringify(L.buildOverview([], {}, defs)).slice(0,40));
tryIt('single reading', () => L.buildOverview(mk('alkalinity',[9.0]), {alkalinity:{value:9,date:'2026-08-09'}}, defs).score);
tryIt('duplicate dates', () => { const r=[...mk('alkalinity',[9.0,9.1]),...mk('alkalinity',[8.9,9.2])];
  return L.computeControl(D('alkalinity'), r, 30).headline; });
tryIt('out-of-order dates', () => { const r=mk('alkalinity',[9,8.8,9.2,8.9]).reverse();
  return L.computeControl(D('alkalinity'), r, 30).headline; });
tryIt('value of 0', () => L.computeControl(D('alkalinity'), mk('alkalinity',[0,0,0,0]), 30).headline);
tryIt('negative value', () => L.computeControl(D('alkalinity'), mk('alkalinity',[-1,9,9,9]), 30).headline);
tryIt('absurdly large value', () => L.computeControl(D('alkalinity'), mk('alkalinity',[9,9,99999,9]), 30).headline);
tryIt('volume of 0', () => { const c=L.computeDoseCalc('alkalinity',-1,{...S,volumeL:0}); return c===null?'null (guarded)':c.recommendedMl; });
tryIt('volume of 1L (pico)', () => L.computeDoseCalc('alkalinity',-0.5,{...S,volumeL:1}).recommendedMl.toFixed(3)+' mL');
tryIt('volume 2000L', () => L.computeDoseCalc('alkalinity',-0.5,{...S,volumeL:2000,dailyDoseMl:200}).recommendedMl.toFixed(1)+' mL');
tryIt('negative dose', () => { const c=L.computeDoseCalc('alkalinity',-1,{...S,dailyDoseMl:-5}); return c===null?'null (guarded)':c.recommendedMl; });
tryIt('negative strength', () => { const c=L.computeDoseCalc('alkalinity',-1,{...S,dkhPerMlPer100L:-0.03}); return c===null?'null (guarded)':c.recommendedMl; });
tryIt('huge strength', () => L.computeDoseCalc('alkalinity',-1,{...S,dkhPerMlPer100L:10}).recommendedMl.toFixed(3)+' mL');
tryIt('drift of exactly 0', () => L.computeDoseCalc('alkalinity',0,S).recommendedMl.toFixed(2)+' mL');
tryIt('correction target == current', () => { const c=L.computeCorrection('alkalinity',9,9,77); return c?('delta '+c.delta):'null'; });
tryIt('correction volume 0', () => { const c=L.computeCorrection('alkalinity',7,9,0); return c?c.products.map(p=>p.totalG).join(','):'null'; });
tryIt('water change larger than tank', () => L.predictAfterChange({alkalinity:{value:9}}, defs, 77, 200).pct.toFixed(0)+'%');
tryIt('water change of 0L', () => L.predictAfterChange({alkalinity:{value:9}}, defs, 77, 0).pct.toFixed(0)+'%');
tryIt('nutrient ratio, phosphate 0', () => { const r=L.computeNutrientRatio([...mk('nitrate',[10,10]),...mk('phosphate',[0,0])]); return r===null?'null (guarded)':r.verdict; });
tryIt('ICP with empty elements', () => L.computeIcpTrends([{date:'2026-01-01',elements:{}},{date:'2026-02-01',elements:{}}]).length + ' trends');
tryIt('calibration, no ICP', () => L.computeCalibration(mk('alkalinity',[9,9]), [], defs).results.length + ' pairs');
tryIt('stability, all identical', () => L.computeStability(D('alkalinity'), mk('alkalinity',[9,9,9,9,9])).grade);

console.log('\nthrew: ' + issues.length);
issues.slice(0, 10).forEach((i) => console.log('  ' + i));
/* Printed the count and exited 0. A throw here is a crash on an input the app
   can reach; reporting it and passing is the same as not checking. */
if (issues.length) process.exit(1);
