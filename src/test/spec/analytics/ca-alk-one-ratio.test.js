/* Spec conformance — §16: Ca:alk consumption ratio is 7.15 ppm Ca per 1.0 dKH
 *
 * docs/spec/reef-chemistry.md §16 fixes one value: **7.15 ppm Ca per 1.0 dKH**,
 * and says changing it without an [approved][chem] item is an S1 defect. §20
 * derives the calcification coupling from the same figure.
 *
 * The codebase carried five different numbers for it (.agent/inventory.md:354)
 * and, as that entry put it, "the spec's 7.15 appears nowhere":
 *
 *   6.77  DOSE_ELEMENTS' calcium/alkalinity default strengths (0.3611/0.0533)
 *   6.754 DEFAULT_SETTINGS' caPpmPerMlPer100L/dkhPerMlPer100L (0.36/0.0533)
 *   6.8   DOSE_ELEMENTS' calcium hint, stated to the user as "the ratio corals
 *         actually consume"
 *   6.75  findings.js's divisor for implied alkalinity, user-facing
 *   7.0   the midpoint of drift.js's CA_PER_DKH_LO/HI band, used as the ratio
 *         itself to convert calcium consumption into implied alkalinity
 *
 * Owner decision, 16 August: 7.15 everywhere. It is the stoichiometric figure
 * and the sourced one; none of the five has a derivation in canon.
 *
 * These tests pin the ratio to ONE exported constant and check every surface
 * derives from it, so the five cannot come back. A test that merely asserted
 * "0.3811" would let the next edit reintroduce a sixth value.
 */
import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { CA_PER_DKH } from '../../../lib/analytics/calcification.js'
import { DOSE_ELEMENTS } from '../../../lib/analytics/consumption.js'
import { CA_PER_DKH_LO, CA_PER_DKH_HI } from '../../../lib/analytics/drift.js'
import { DEFAULT_SETTINGS } from '../../../lib/analytics/water-changes.js'

describe('§16 — one constant, and it is 7.15', () => {
  it('CA_PER_DKH is the spec value', () => {
    expect(CA_PER_DKH).toBe(7.15)
  })
})

describe('§16 — every surface derives its ratio from that constant', () => {
  it("DOSE_ELEMENTS' default strengths imply exactly CA_PER_DKH", () => {
    /* This is the one the owner named: the pairing the app hands a new user as
       balanced. It was 0.3611/0.0533 = 6.7749. */
    const alk = DOSE_ELEMENTS.find((e) => e.key === 'alkalinity')
    const ca = DOSE_ELEMENTS.find((e) => e.key === 'calcium')
    expect(ca.defaultStrength / alk.defaultStrength).toBeCloseTo(CA_PER_DKH, 2)
  })

  it("DEFAULT_SETTINGS' shipped strengths imply the same ratio as DOSE_ELEMENTS", () => {
    /* Two tables, one pairing. DEFAULT_SETTINGS is what the engines actually
       dose from; DOSE_ELEMENTS.defaultStrength is what Setup writes when the
       field is left blank (Setup.jsx:157). They were 6.754 and 6.7749 — close
       enough to look like agreement and not be it. */
    const implied = DEFAULT_SETTINGS.caPpmPerMlPer100L / DEFAULT_SETTINGS.dkhPerMlPer100L
    expect(implied).toBeCloseTo(CA_PER_DKH, 2)

    const alk = DOSE_ELEMENTS.find((e) => e.key === 'alkalinity')
    const ca = DOSE_ELEMENTS.find((e) => e.key === 'calcium')
    expect(DEFAULT_SETTINGS.dkhPerMlPer100L).toBe(alk.defaultStrength)
    expect(DEFAULT_SETTINGS.caPpmPerMlPer100L).toBe(ca.defaultStrength)
  })

  it("drift.js's balanced band is centred on the constant", () => {
    /* ca-alk-coupling.test.js already required this and failed: the band was
       6.4-7.6, midpoint 7.0. The midpoint is not decoration — drift.js:331
       divides by it to state an implied alkalinity draw in user-facing prose,
       so it WAS the ratio wherever a reader met that sentence. */
    expect((CA_PER_DKH_LO + CA_PER_DKH_HI) / 2).toBeCloseTo(CA_PER_DKH, 6)
  })

  it('the band still contains the constant, and keeps the width it had', () => {
    /* Flagged, not changed: the +/-0.6 tolerance has no derivation in canon
       either. It was not in scope, so it is preserved exactly — this test is
       what makes that preservation deliberate rather than accidental. */
    expect(CA_PER_DKH_LO).toBeLessThanOrEqual(CA_PER_DKH)
    expect(CA_PER_DKH_HI).toBeGreaterThanOrEqual(CA_PER_DKH)
    expect(CA_PER_DKH_HI - CA_PER_DKH_LO).toBeCloseTo(1.2, 6)
  })
})

describe('§16 — no module states a Ca:alk figure of its own', () => {
  /* A source scan, deliberately. The four tests above pin every ratio the app
     COMPUTES from; this one catches the ratio a module merely SAYS — a hint
     string, a comment, a divisor inlined into a sentence. Those are how three
     of the five originals got in, and none of them is reachable through an
     export to assert against. */
  /* Comments are stripped before scanning, so a module may still RECORD what
     the superseded figure was — those notes are why the change looks reasoned
     rather than arbitrary, and AGENTS.md #4's spirit keeps them. What it may
     not do is carry one in live code or in a string the user reads, which is
     exactly where all five originals lived. */
  const withoutComments = (src) => src
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '')

  const STALE = {
    'src/lib/analytics/consumption.js': ['6.8 ppm', '0.3611'],
    'src/lib/analytics/water-changes.js': ['6.77', '7.14', '6.75', '0.36,'],
    'src/lib/analytics/drift.js': ['6.4', '7.6'],
    'src/lib/findings.js': ['6.75'],
  }

  for (const [file, bad] of Object.entries(STALE)) {
    it(`${file} carries none of the superseded figures in live code`, () => {
      const src = withoutComments(readFileSync(file, 'utf8'))
      for (const literal of bad) {
        expect(src, `${file} still states "${literal}" as a Ca:alk figure`).not.toContain(literal)
      }
    })
  }
})
