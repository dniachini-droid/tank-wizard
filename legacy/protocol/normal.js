/* A normal tank, kept by someone who does what the app says.
   Established system, corals growing steadily, testing on a sensible rhythm,
   occasional water change. No shocks, no crises — the 95% case. */
const { walkAll, setSeed, DEF, GUIDE } = require('/tmp/integrated.js');

function normalTank(rnd) {
  const volumeL = [40, 77, 120, 200, 300, 450][Math.floor(rnd()*6)];
  /* Consumption proportional to volume, in the ordinary range for a
     moderately stocked mixed reef. */
  const per100 = 0.5 + rnd()*0.9;          // dKH/day per 100 L
  return {
    volumeL,
    cons: {
      alkalinity: per100 * volumeL/100,
      calcium:    per100 * volumeL/100 * 7.0,   // roughly the stoichiometric pair
      magnesium:  per100 * volumeL/100 * 0.55,
    },
    /* Gradual growth rather than shocks: demand creeps up as corals fill in. */
    jumps: [60, 120, 180, 240, 300].map(day => ({
      el: ['alkalinity','calcium','magnesium'][Math.floor(rnd()*3)],
      day, factor: 1.04 + rnd()*0.08,
    })),
    days: 365,
    skipChance: rnd()*0.15,                    // misses the odd test
    behaviour: { ignoreChance: rnd()*0.08, contraryChance: rnd()*0.05 },
    env: { wcEvery: [7,14][Math.floor(rnd()*2)], wcFraction: 0.1 + rnd()*0.1, logWaterChanges: true },
  };
}
module.exports = { normalTank, walkAll, setSeed, DEF, GUIDE };
