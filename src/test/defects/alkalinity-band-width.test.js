/* Bug 4 (routine 15) — alkalinity's default band, 1.0 dKH -> 0.6 dKH.
 *
 * Spec anchor: docs/spec/reef-chemistry.md §2, Layer 3 ("Decided 13 Aug:
 * alkalinity's band tightened from 1.0 to 0.6. Published guidance puts
 * weekly drift under 0.5 dKH and daily variation under 0.3. A 1.0 band
 * tolerates a full dKH of movement before the app speaks, by which point a
 * correction is needed rather than a nudge.") Suggested target 8.5 dKH,
 * suggested band 0.6 total (+/-0.3) -> 8.2-8.8 dKH.
 *
 * `src/lib/constants.js`'s PARAM_DEFS shipped `{ min: 8.5, max: 9.5 }` —
 * width 1.0, and not even centred on the 8.5 target (min and target
 * coincide; the real band was target-to-target+1, not target+/-0.5).
 *
 * `src/test/spec/classification/band-edges.test.js` already has failing
 * assertions naming alkalinity's def, but they cite a "target 8.5 +/- 0.5"
 * convention (a 1.0-wide band, expecting min/max of 8.0/9.0) that matches
 * neither the old PARAM_DEFS (8.5/9.5) nor this fix (8.2/8.8) — confirmed by
 * running it unchanged before and after this fix, red both times, for a
 * reason unrelated to this bug (see this bug's PR body). Left untouched, per
 * AGENTS.md #4 — this file asserts §2's own numbers instead.
 */
import { describe, expect, it } from 'vitest'
import { PARAM_DEFS } from '../../lib/constants.js'
import { paramContext } from '../../lib/analytics/reading-meaning.js'

describe('alkalinity default band — §2, 8.2-8.8 dKH (target 8.5, +/-0.3)', () => {
  const def = PARAM_DEFS.find((d) => d.key === 'alkalinity')

  it('DEFECT: PARAM_DEFS.alkalinity is not 8.2-8.8 dKH', () => {
    expect(def.min).toBeCloseTo(8.2, 5)
    expect(def.max).toBeCloseTo(8.8, 5)
  })

  it('the band is centred on the 8.5 dKH suggested target, not offset from it', () => {
    const mid = (def.min + def.max) / 2
    expect(mid).toBeCloseTo(8.5, 5)
  })

  it('the band is 0.6 dKH wide, not 1.0', () => {
    expect(def.max - def.min).toBeCloseTo(0.6, 5)
  })

  it('DEFECT: 9.4 dKH, in range under the old 1.0-wide band, is now out of range', () => {
    // Under the pre-fix def (8.5-9.5) this classified as in range (no
    // commentary). Under the fixed 8.2-8.8 band it is 0.6 dKH above the top
    // of the range and must be flagged.
    expect(paramContext(def, 9.4, null)).not.toBeNull()
  })

  it('8.2 dKH, the new lower edge, classifies in range (inclusive)', () => {
    expect(paramContext(def, 8.2, null)).toBeNull()
  })

  it('8.8 dKH, the new upper edge, classifies in range (inclusive)', () => {
    expect(paramContext(def, 8.8, null)).toBeNull()
  })

  it('8.19 dKH, just under the new lower edge, is out of range', () => {
    expect(paramContext(def, 8.19, null)).not.toBeNull()
  })

  it('8.81 dKH, just over the new upper edge, is out of range', () => {
    expect(paramContext(def, 8.81, null)).not.toBeNull()
  })
})
