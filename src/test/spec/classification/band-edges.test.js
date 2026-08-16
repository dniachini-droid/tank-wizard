/* Reading classification — no-action band edges (worked example 9)
 *
 * Spec anchor: docs/spec/reef-chemistry.md §2 (decided 16 Aug: the user sets
 * a minimum and a maximum — one range, two edges, no target point inside it)
 * and §23 worked example 9: a reading exactly on the lower edge of the
 * target range classifies IN RANGE, not out of range. Edges are inclusive of
 * their band (wizard-states.md §13 boundary rules).
 *
 * This file previously pinned a structural gap — the earlier canon's "the
 * user sets a target and a band width", which the code never implemented (no
 * target field exists anywhere on settings; the user edits two edges
 * directly). That gap is now closed BY DECISION, not by code: §2 was
 * corrected on 16 Aug to describe the two-edges model the app always had,
 * and a target point inside the band was considered and rejected. The
 * final describe below pins the settled model.
 *
 * The band edges must track whatever range the USER has set, not a single
 * hardcoded default — so every table below is exercised at more than one
 * range, including non-default ones. Each def is generated as midpoint ±
 * half-width, which is only a generator: the def under test carries two
 * edges, exactly as §2 specifies.
 */
import { describe, expect, it } from 'vitest'
import { paramContext, computeControl } from '../../../lib/analytics/reading-meaning.js'
import { PARAM_DEFS } from '../../../lib/constants.js'

const real = (key) => PARAM_DEFS.find((d) => d.key === key)

// A spec-legal def: midpoint ± half-width, everything else borrowed from
// the app's own definition so label/unit/step stay realistic.
const bandDef = (key, mid, half) => ({ ...real(key), min: mid - half, max: mid + half })

const HALF = { alkalinity: 0.5, calcium: 25, magnesium: 50 };

// Non-default ranges are included deliberately — §2 says everything the app
// says is relative to the range the user set, not just the suggestions.
const MIDPOINTS = {
  alkalinity: [8.0, 8.5, 9.0, 8.2],
  calcium: [420, 430, 450, 405],
  magnesium: [1300, 1350, 1250, 1420],
};

describe('§2 no-action band — edges are inclusive (worked example 9)', () => {
  for (const key of Object.keys(HALF)) {
    const half = HALF[key];
    for (const mid of MIDPOINTS[key]) {
      const def = bandDef(key, mid, half);
      const lo = mid - half, hi = mid + half;

      it(`${key}: range ${lo}–${hi} — lower edge ${lo} classifies in range`, () => {
        // paramContext returns null when the reading needs no comment, i.e.
        // is inside the band. A non-null return means the app is treating it
        // as out of band.
        expect(paramContext(def, lo, null)).toBeNull();
      });

      it(`${key}: range ${lo}–${hi} — upper edge ${hi} classifies in range`, () => {
        expect(paramContext(def, hi, null)).toBeNull();
      });

      it(`${key}: range ${lo}–${hi} — just inside lower edge (${lo} + step) is in range`, () => {
        const step = key === 'alkalinity' ? 0.05 : key === 'calcium' ? 1 : 1;
        expect(paramContext(def, lo + step, null)).toBeNull();
      });

      it(`${key}: range ${lo}–${hi} — just outside lower edge (${lo} - step) is out of range`, () => {
        const step = key === 'alkalinity' ? 0.05 : key === 'calcium' ? 1 : 1;
        expect(paramContext(def, lo - step, null)).not.toBeNull();
      });

      it(`${key}: range ${lo}–${hi} — just outside upper edge (${hi} + step) is out of range`, () => {
        const step = key === 'alkalinity' ? 0.05 : key === 'calcium' ? 1 : 1;
        expect(paramContext(def, hi + step, null)).not.toBeNull();
      });
    }
  }
});

describe('§2 no-action band — computeControl treats the median edge inclusively', () => {
  // computeControl's medianInside test reads `p50 >= def.min && p50 <= def.max`
  // (reading-meaning.js:176). Three identical readings sitting exactly on the
  // lower edge should therefore read as "inside", per worked example 9.
  const mid = 8.5, half = 0.5;
  const def = bandDef('alkalinity', mid, half);
  const edge = mid - half; // 8.0

  const readings = [
    { id: '1', param: 'alkalinity', date: '2026-08-09', value: edge },
    { id: '2', param: 'alkalinity', date: '2026-08-11', value: edge },
    { id: '3', param: 'alkalinity', date: '2026-08-13', value: edge },
  ];

  it('a reading held exactly on the lower edge is medianInside=true, not treated as out of band', () => {
    const control = computeControl(def, readings, 90);
    expect(control).not.toBeNull();
    expect(control.medianInside).toBe(true);
    expect(control.below).toBe(0);
  });
});

describe("§2 (16 Aug) — the settled model: two edges on the def, no target point anywhere", () => {
  /* PARAM_DEFS (src/lib/constants.js) is the ONLY def object ever passed to
   * paramContext/computeControl/paramStatus in the running app, and there is
   * no user-settable target point anywhere in the codebase (grepped: no
   * alkTarget, caTarget, mgTarget, or any "target" field on settings) — the
   * user edits the two edges directly (customRanges, src/App.jsx). Until
   * 16 Aug this block pinned that as a structural gap against the earlier
   * canon's "the user sets a target and a band width"; §2 now says the
   * two-edges model IS the model, so these pin the settlement instead.
   */
  it("worked example 9 verbatim: alk exactly on the lower edge of the shipped range is in range", () => {
    const alkDef = real('alkalinity');
    expect(alkDef).toBeTruthy();
    // §23 example 9: target range 8.2–8.8, lower edge 8.2, edges inclusive.
    expect(paramContext(alkDef, alkDef.min, null)).toBeNull();
  });

  it("PARAM_DEFS.alkalinity ships §2's suggested target range 8.2–8.8", () => {
    const alkDef = real('alkalinity');
    expect(alkDef.min).toBeCloseTo(8.2, 5);
    expect(alkDef.max).toBeCloseTo(8.8, 5);
  });

  it("PARAM_DEFS.calcium ships §2's suggested target range 400–450", () => {
    const caDef = real('calcium');
    expect(caDef.min).toBeCloseTo(400, 5);
    expect(caDef.max).toBeCloseTo(450, 5);
  });

  it("PARAM_DEFS.magnesium ships 1250–1400 — §2 suggests 1275–1425; the off-centre default is TW-052, still open", () => {
    /* Deliberately pins the SHIPPED values, not canon's: TW-052 (needs
     * approval) owns whether the default moves. If this fails, either the
     * default changed silently or TW-052 landed — update it with that item. */
    const mgDef = real('magnesium');
    expect(mgDef.min).toBeCloseTo(1250, 5);
    expect(mgDef.max).toBeCloseTo(1400, 5);
    expect(mgDef.max - mgDef.min).toBeCloseTo(150, 5); // width agrees with §2
  });
});
