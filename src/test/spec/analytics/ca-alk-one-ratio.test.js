/* Spec conformance — §16: Ca:alk consumption ratio is 7.15 ppm Ca per 1.0 dKH,
 * and it governs COUPLING, not product strengths.
 *
 * docs/spec/reef-chemistry.md §16 fixes one value: **7.15 ppm Ca per 1.0 dKH**,
 * and says changing it without an [approved][chem] item is an S1 defect. §20
 * derives the calcification coupling from the same figure.
 *
 * The codebase carried five different numbers for it (.agent/inventory.md:354)
 * and, as that entry put it, "the spec's 7.15 appears nowhere":
 *
 *   6.8   DOSE_ELEMENTS' calcium hint, stated to the user as "the ratio corals
 *         actually consume"
 *   6.75  findings.js's divisor for implied alkalinity, user-facing
 *   7.0   the midpoint of drift.js's CA_PER_DKH_LO/HI band, used as the ratio
 *         itself to convert calcium consumption into implied alkalinity
 *   6.77  the ratio implied by DOSE_ELEMENTS' default strengths
 *   6.754 the ratio implied by DEFAULT_SETTINGS' strengths
 *
 * The first three were the ratio being stated wrongly, and they are fixed: one
 * exported constant, every coupling surface derived from it.
 *
 * **The last two were never the ratio at all**, and this is the distinction the
 * 16 August owner decision drew. A solution strength is a property of a bottle
 * — what that product delivers per mL — not a property of chemistry. 0.3611
 * was the Aquaforest 1:1 recipe's genuinely delivered figure, and that recipe
 * really is slightly calcium-light against a true 7.15. Moving a strength to
 * make the ratio come out right would have made the app claim a bottle
 * delivers something it does not, and every calcium dose computed from it
 * would have been wrong by the difference.
 *
 * So the two must never be reconciled: coupling uses 7.15; strengths describe
 * the product. The strengths are now not shipped at all (see
 * unset-solution-strength.test.js) — only the user knows their own bottle.
 */
import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { CA_PER_DKH } from '../../../lib/analytics/calcification.js'
import { CA_PER_DKH_LO, CA_PER_DKH_HI } from '../../../lib/analytics/drift.js'

describe('§16 — one constant, and it is 7.15', () => {
  it('CA_PER_DKH is the spec value', () => {
    expect(CA_PER_DKH).toBe(7.15)
  })
})

describe('§16 — the ratio governs coupling', () => {
  it("drift.js's balanced band is centred on the constant", () => {
    /* ca-alk-coupling.test.js already required this and failed: the band was
       6.4-7.6, midpoint 7.0. The midpoint is not decoration — drift.js
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

  it('implied alkalinity is derived from the ratio, in every module that states one', () => {
    /* The scan catches the ratio a module merely SAYS — a hint string, a
       comment, a divisor inlined into a sentence — which is how three of the
       five got in and is not reachable through an export. Comments are
       stripped first, so a module may still record what the superseded figure
       was; it may not carry one in live code or in a string the user reads. */
    const withoutComments = (src) => src
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/^\s*\/\/.*$/gm, '')

    const STALE = {
      'src/lib/analytics/consumption.js': ['6.8 ppm'],
      'src/lib/analytics/drift.js': ['6.4', '7.6'],
      'src/lib/findings.js': ['6.75'],
    }
    for (const [file, bad] of Object.entries(STALE)) {
      const src = withoutComments(readFileSync(file, 'utf8'))
      for (const literal of bad) {
        expect(src, `${file} still states "${literal}" as a Ca:alk figure`).not.toContain(literal)
      }
    }
  })
})

describe('§16 — the ratio does NOT govern product strengths', () => {
  /* The guard against re-reconciling them. If a later change reintroduces a
     shipped strength derived from CA_PER_DKH, this fails — which is the whole
     point of the distinction being written into canon. */
  it('no module derives a solution strength from the ratio', () => {
    const FILES = [
      'src/lib/analytics/water-changes.js',
      'src/lib/analytics/consumption.js',
    ]
    for (const file of FILES) {
      const src = readFileSync(file, 'utf8')
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .replace(/^\s*\/\/.*$/gm, '')
      expect(src, `${file} derives a strength from CA_PER_DKH`).not.toMatch(/CA_PER_DKH/)
      expect(src, `${file} still defines a default strength`).not.toMatch(/DEFAULT_STRENGTH/)
    }
  })
})
