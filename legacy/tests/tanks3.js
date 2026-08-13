/* Tank archetypes spanning the range the app should survive. */
const L = require(require('path').join(__dirname, '..', 'build', 'engines.js'));
const D = (n) => new Date(Date.parse('2026-08-09') - n*86400000).toISOString().slice(0,10);

function series(param, days, fn, every=2) {
  const out=[];
  for (let d=days; d>=0; d-=every) out.push({id:param+d, param, value:+fn(d).toFixed(4), date:D(d)});
  return out;
}
const noise = (a)=> (Math.random()-0.5)*2*a;

const TANKS = [];
const push=(name,r,s,extra={})=>TANKS.push({name,readings:r,settings:{...L.DEFAULT_SETTINGS,...s},...extra});

// 1. Healthy mature SPS
push('healthy mature SPS', [
  ...series('alkalinity',120,d=>8.8+noise(0.08)),
  ...series('calcium',120,d=>440+noise(8),4),
  ...series('magnesium',120,d=>1380+noise(15),7),
  ...series('nitrate',120,d=>6+noise(1),7),
  ...series('phosphate',120,d=>0.05+noise(0.01),4),
], {volumeL:400, dailyDoseMl:40, calciumDoseMl:40, magDoseMl:10});

// 2. Brand new tank, sparse data
push('brand new tank', [
  ...series('alkalinity',12,d=>8.2+noise(0.1),3),
  ...series('calcium',12,d=>420+noise(10),6),
], {volumeL:100, dailyDoseMl:0, calciumDoseMl:0, magDoseMl:0});

// 3. Alkalinity crashing
push('alkalinity crashing', [
  ...series('alkalinity',40,d=>7.0+(40-d)*-0.05+noise(0.1)),
  ...series('calcium',40,d=>420-(40-d)*0.4+noise(8),4),
  ...series('magnesium',40,d=>1300+noise(15),7),
], {volumeL:200, dailyDoseMl:20, calciumDoseMl:20, magDoseMl:5});

// 4. ULNS with burnt-tip risk
push('ULNS high alk', [
  ...series('alkalinity',60,d=>11.5+noise(0.1)),
  ...series('calcium',60,d=>460+noise(8),4),
  ...series('nitrate',60,d=>0.3+noise(0.1),7),
  ...series('phosphate',60,d=>0.005+noise(0.002),4),
], {volumeL:300, dailyDoseMl:35, calciumDoseMl:35});

// 5. Magnesium truly low
push('magnesium low', [
  ...series('alkalinity',60,d=>8.0+noise(0.2)),
  ...series('calcium',60,d=>380+noise(10),4),
  ...series('magnesium',60,d=>1120+noise(20),7),
], {volumeL:150, dailyDoseMl:12, calciumDoseMl:12, magDoseMl:20});

// 6. Wildly swinging
push('wild swings', [
  ...series('alkalinity',60,d=>8.5+Math.sin(d/3)*1.6+noise(0.2)),
  ...series('calcium',60,d=>440+Math.sin(d/4)*40+noise(10),4),
], {volumeL:250, dailyDoseMl:25, calciumDoseMl:25});

// 7. Identical readings (zero variance)
push('flat identical readings', [
  ...series('alkalinity',60,d=>9.0),
  ...series('calcium',60,d=>450,4),
  ...series('magnesium',60,d=>1400,7),
], {volumeL:77});

// 8. Single reading each
push('single readings', [
  {id:'a',param:'alkalinity',value:8.5,date:D(1)},
  {id:'c',param:'calcium',value:430,date:D(1)},
], {volumeL:77});

// 9. Nutrients extremely high
push('nutrient loaded', [
  ...series('alkalinity',60,d=>7.8+noise(0.1)),
  ...series('nitrate',60,d=>85+noise(5),7),
  ...series('phosphate',60,d=>1.2+noise(0.1),4),
], {volumeL:500, dailyDoseMl:30, calciumDoseMl:30});

// 10. Tiny nano
push('nano 20L', [
  ...series('alkalinity',60,d=>8.9+noise(0.15)),
  ...series('calcium',60,d=>435+noise(10),4),
], {volumeL:20, dailyDoseMl:2, calciumDoseMl:2, magDoseMl:1});

// 11. Huge system
push('large 2000L', [
  ...series('alkalinity',90,d=>8.4+noise(0.06)),
  ...series('calcium',90,d=>445+noise(6),4),
], {volumeL:2000, dailyDoseMl:250, calciumDoseMl:250, magDoseMl:60});

// 12. Rising demand (growth)
push('rising demand', [
  ...series('alkalinity',120,d=>9.0 - (120-d)*0.004 + noise(0.06)),
  ...series('calcium',120,d=>450-(120-d)*0.15+noise(7),4),
], {volumeL:300, dailyDoseMl:30, calciumDoseMl:30});

// 13. Dose way too high (alk climbing fast)
push('overdosing alk', [
  ...series('alkalinity',30,d=>8.0+(30-d)*0.12+noise(0.1)),
  ...series('calcium',30,d=>450+noise(8),4),
], {volumeL:100, dailyDoseMl:60, calciumDoseMl:10});

// 14. Zero/absent dose settings but readings drifting
push('no dose configured', [
  ...series('alkalinity',60,d=>9.5-(60-d)*0.02+noise(0.1)),
  ...series('calcium',60,d=>470-(60-d)*0.5+noise(8),4),
], {volumeL:180, dailyDoseMl:0, calciumDoseMl:0, magDoseMl:0});

// 15. Extreme strength values
push('extreme strengths', [
  ...series('alkalinity',60,d=>8.8+noise(0.1)),
  ...series('calcium',60,d=>440+noise(8),4),
], {volumeL:77, dkhPerMlPer100L:5.0, caPpmPerMlPer100L:50, dailyDoseMl:1, calciumDoseMl:1});

module.exports = { TANKS, D, series };
