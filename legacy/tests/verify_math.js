const L = require(require('path').join(__dirname, '..', 'build', 'engines.js'));
let pass = 0, fail = 0;
function check(label, got, want, tol) {
  const ok = Math.abs(got - want) <= tol;
  if (ok) pass++; else { fail++; console.log('  FAIL ' + label + ': got ' + got + ' want ' + want); }
}
console.log('INDEPENDENT ARITHMETIC CHECK — dose calculator');
console.log('='.repeat(70));
console.log('Formula checked by hand: perMl = strength x (100/L)');
console.log('                         consumed = doseMl x perMl - drift/7');
console.log('                         recommended = consumed / perMl');
console.log();

const volumes  = [20, 45, 77, 100, 200, 450];
const strengths= [0.02, 0.03, 0.069, 0.14];
const doses    = [1, 3, 8, 15, 40];
const drifts   = [-2.0, -0.7, 0, 0.5, 1.8];

for (const L_ of volumes) for (const st of strengths) for (const dm of doses) for (const dw of drifts) {
  const s = { ...require(require('path').join(__dirname, '..', 'build', 'engines.js')).DEFAULT_SETTINGS, volumeL: L_, dailyDoseMl: dm, dkhPerMlPer100L: st };
  const c = L.computeDoseCalc('alkalinity', dw, s);
  // hand-computed expectation
  const perMl = st * (100 / L_);
  const delivered = dm * perMl;
  const consumed = delivered - dw / 7;
  if (consumed <= 0) { if (!c.impossible) { fail++; console.log('  FAIL impossible not flagged @', L_, st, dm, dw); } else pass++; continue; }
  const rec = consumed / perMl;
  check(`perMl ${L_}L/${st}`, c.perMl, perMl, 1e-9);
  check(`delivered ${L_}L/${st}/${dm}mL`, c.delivered, delivered, 1e-9);
  check(`consumed ${L_}L/${st}/${dm}/${dw}`, c.consumed, consumed, 1e-9);
  check(`recommended ${L_}L/${st}/${dm}/${dw}`, c.recommendedMl, rec, 1e-9);
}
console.log('checks passed: ' + pass + ', failed: ' + fail);
console.log();

// Invariant: if drift is zero, recommended dose must equal current dose
console.log('INVARIANT — zero drift means no change needed:');
let inv = true;
for (const L_ of volumes) for (const st of strengths) for (const dm of doses) {
  const s = { ...require(require('path').join(__dirname, '..', 'build', 'engines.js')).DEFAULT_SETTINGS, volumeL: L_, dailyDoseMl: dm, dkhPerMlPer100L: st };
  const c = L.computeDoseCalc('alkalinity', 0, s);
  if (Math.abs(c.recommendedMl - dm) > 1e-9) { inv = false; console.log('  FAIL', L_, st, dm, c.recommendedMl); }
}
console.log(inv ? '  OK — recommended == current in all ' + (volumes.length*strengths.length*doses.length) + ' combinations' : '  FAILED');
