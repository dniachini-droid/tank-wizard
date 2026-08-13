/* Defect 3 (inventory §6.3) — the silent 77 L fallback
 *
 * DEFAULT_SETTINGS.volumeL = 77 (src/lib/analytics/water-changes.js:29) is
 * spread into settings before any engine sees them (App.jsx:511), and `|| 77`
 * is written literally at 15 further sites including Setup.jsx:73, which
 * persists `parseFloat(vol) || 77` — so clearing the volume field writes one
 * particular tank's volume into another user's settings.
 *
 * Spec anchor: docs/spec/reef-chemistry.md §2 — "If net volume is unset, the app
 * refuses to calculate any dose and names net volume as the missing input";
 * §7.6 — "Any missing input is named. The app never substitutes a default
 * silently"; §9 — the app must refuse to "Calculate any dose when net volume is
 * unset" and to "Use gross volume anywhere". Worked example 2
 * (reef-chemistry.md:228) is this case verbatim.
 *
 * The engine already refuses when `settings.volumeL` is genuinely absent
 * (alkEffectPerMl returns null). The defect is that it is never absent: the
 * default supplies it. So this test asks the question the way the app does —
 * with the settings object the app actually assembles for a user who has never
 * entered a volume.
 */
import { describe, expect, it } from 'vitest'
import { PARAM_DEFS } from '../../lib/constants.js'
import { assessAlkalinity } from '../../lib/dosing/alkalinity.js'
import { DEFAULT_SETTINGS } from '../../lib/analytics/water-changes.js'

const def = PARAM_DEFS.find((d) => d.key === 'alkalinity')

/* A spec-legal series: five readings spanning twelve days, two days apart, so
   consumption is computable on its own terms (reef-chemistry.md §8) and nothing
   but the volume question is in play. */
const readings = [
  { id: '1', param: 'alkalinity', date: '2026-08-01', value: 9.0 },
  { id: '2', param: 'alkalinity', date: '2026-08-03', value: 8.8 },
  { id: '3', param: 'alkalinity', date: '2026-08-05', value: 8.7 },
  { id: '4', param: 'alkalinity', date: '2026-08-07', value: 8.5 },
  { id: '5', param: 'alkalinity', date: '2026-08-09', value: 8.4 },
  { id: '6', param: 'alkalinity', date: '2026-08-11', value: 8.2 },
  { id: '7', param: 'alkalinity', date: '2026-08-13', value: 8.1 },
]

const assess = (settings) => assessAlkalinity({
  readings,
  doseLog: [{ date: '2026-07-01', ml: 8, element: 'alkalinity', note: '' }],
  waterChanges: [],
  settings,
  def,
  now: 20313,
})

describe('dosing with no net volume entered', () => {
  it('refuses and names net volume, rather than dosing a 77 L tank', () => {
    /* Precondition: with a volume, this fixture does produce a dose. Without
       it the refusal below would prove nothing. */
    const known = assess({ ...DEFAULT_SETTINGS, volumeL: 68 })
    expect(known.maintenanceDose).toBeGreaterThan(0)

    /* A user who has never opened Setup. This is exactly what App.jsx:511
       hands the engines: `{ ...DEFAULT_SETTINGS, ...storedSettings }` with
       nothing stored. */
    const unset = assess({ ...DEFAULT_SETTINGS })

    expect(unset.maintenanceDose).toBeNull()
    expect(unset.recommendedDose).toBeNull()
    /* "names net volume as the missing input" — the words matter here, because
       gross volume is not an acceptable substitute for it (§2, §9). */
    expect(unset.reason).toMatch(/net volume/i)
  })
})
