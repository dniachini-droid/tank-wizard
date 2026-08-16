/* §15 colour registry — a severity colour is not an identity (TW-044)
 *
 * Spec anchor: docs/spec/wizard-states.md §15, "The colour registry"
 * (decided 14 Aug): a colour that means *something is wrong* must not also
 * be a parameter's identity. The severity colours (`STATUS_COLOR`,
 * src/lib/dates.js) are reserved and unchanged; the brand colours move:
 * phosphate #C4285B → #9B3A8C (plum), potassium #926A09 → #5F7A12 (olive).
 *
 * The values are measured, not eyeballed, and were re-derived rather than
 * trusted (scratchpad colour-derive script, run 2026-08-15): contrast
 * against the #F3F7F6 page 5.76:1 and 4.54:1 (§18 floor 4.5:1 text,
 * 3:1 chart stroke); CIE76 from the severity colour each replaces 37.9 and
 * 32.7; the palette's tightest pair is unchanged at 16.4 (alkalinity/pH);
 * calcium/potassium improves from 29.3 to 61.6.
 *
 * NAMED EXCEPTION — alkalinity. `PARAM_DEFS.alkalinity.color` #0B7C86 is
 * byte-identical to `STATUS_COLOR.ok` and stays so BY DECISION: TW-046,
 * decided against 2026-08-15 (.agent/needs-dan.md, Decisions; .agent/
 * backlog.md TW-046 under Done). #0B7C86 is also the app's brand teal,
 * STABILITY_COLOR.green, the `dialled` tone and the `tight` consistency
 * colour across ~134 sites; the badge beside the chart already covers the
 * harm, and TW-037's alert tier is the proper answer to it. This test must
 * NOT be widened to fail on it — the exception is the decision, recorded.
 */
import { describe, expect, it } from 'vitest'
import { PARAM_DEFS } from '../../../lib/constants.js'
import { STATUS_COLOR } from '../../../lib/dates.js'

const norm = (c) => String(c).toUpperCase()

/* The one collision left standing, by the 2026-08-15 TW-046 decision. */
const DECIDED_EXCEPTIONS = { alkalinity: norm(STATUS_COLOR.ok) }

describe('§15 colour registry — no brand colour is byte-identical to a severity colour', () => {
  const severity = Object.entries(STATUS_COLOR).map(([name, c]) => [name, norm(c)])

  for (const def of PARAM_DEFS) {
    it(`${def.key} (${def.color}) does not reuse a severity colour`, () => {
      const brand = norm(def.color)
      if (DECIDED_EXCEPTIONS[def.key] === brand) {
        // alkalinity === STATUS_COLOR.ok, decided-against 2026-08-15 (TW-046).
        return
      }
      for (const [name, sev] of severity) {
        expect(brand, `${def.key} brand colour equals STATUS_COLOR.${name}`).not.toBe(sev)
      }
    })
  }

  it('the named exception is exactly alkalinity == ok, nothing broader', () => {
    /* If alkalinity's colour ever moves off STATUS_COLOR.ok, the exception is
       dead code and should be removed with it — this pins that linkage. */
    const alk = PARAM_DEFS.find((d) => d.key === 'alkalinity')
    expect(norm(alk.color)).toBe(norm(STATUS_COLOR.ok))
    expect(Object.keys(DECIDED_EXCEPTIONS)).toEqual(['alkalinity'])
  })
})

describe('§15 colour registry — the decided replacement values', () => {
  it('phosphate is #9B3A8C (plum), no longer the danger red', () => {
    expect(norm(PARAM_DEFS.find((d) => d.key === 'phosphate').color)).toBe('#9B3A8C')
  })

  it('potassium is #5F7A12 (olive), no longer the low amber', () => {
    expect(norm(PARAM_DEFS.find((d) => d.key === 'potassium').color)).toBe('#5F7A12')
  })

  it('the severity colours themselves did not move', () => {
    expect(STATUS_COLOR).toEqual({ ok: '#0B7C86', low: '#926A09', high: '#C4285B', unknown: '#9FB0AE' })
  })
})
