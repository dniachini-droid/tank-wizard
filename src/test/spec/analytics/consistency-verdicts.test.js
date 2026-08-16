/* §22 consistency verdicts — the second vocabulary, registered (TW-037/TW-045)
 *
 * Spec anchors: docs/spec/wizard-states.md §22 (all three parts), §13 (the
 * band words and the refusal row), §15 (the drifting/unsettled ban),
 * reef-chemistry.md §26 (the tier is read from the LAST reading) and §18
 * (the alert thresholds the alert tier tests against).
 *
 * Three rules under test, plus the verdict registry itself:
 *   (1) RENAME — the verdict once called `drifting` (median OUTSIDE the band,
 *       moderate spread) is `unsettled`; `drifting` stays §13's band word
 *       (INSIDE the band, trending toward an edge). Same word, near-opposite
 *       meanings, one tap apart — the collision TW-037 was filed on.
 *   (2) ALERT TIER — every verdict carries the tier of the latest reading's
 *       §13 band and renders no calmer than it; at the alert tier the note
 *       leads with the position before the steadiness.
 *   (3) UNKNOWN REFUSES — a parameter with no consistency rule refuses and
 *       names what is missing rather than grading against nothing.
 */
import { describe, expect, it } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { computeControl, positionBand } from '../../../lib/analytics/reading-meaning.js'
import { CONSISTENCY_RULES } from '../../../lib/analytics/time-in-range.js'
import { PARAM_DEFS } from '../../../lib/constants.js'
import { isoLocal } from '../../../lib/dates.js'

const THE_SIX = ['dialled', 'controlled', 'steady-off', 'unsettled', 'loose', 'sliding']

/* Verdict tones, and §22's ordering of them: teal/green are the calm (in-band)
   tier, blue/amber the off-band tier, red the alert tier. */
const TONE_TIER = { '#0B7C86': 0, '#2A8050': 0, '#1D6FA5': 1, '#A2621B': 1, '#C4285B': 2 }

const alkDef = PARAM_DEFS.find((d) => d.key === 'alkalinity') // band 8.2–8.8, target midpoint 8.5

/* Readings n days apart ending today, oldest first. 5-day gaps keep the
   rate machinery out of the way (RATE_RULES.alkalinity.maxGapDays is 4, so
   no daily rate is computed and the spread does the grading, which is the
   §22 path under test). */
const series = (values, gapDays = 5) => {
  const out = []
  for (let i = 0; i < values.length; i++) {
    const d = new Date()
    d.setDate(d.getDate() - (values.length - 1 - i) * gapDays)
    out.push({ id: `r${i}`, param: 'alkalinity', date: isoLocal(d), value: values[i] })
  }
  return out
}

describe('§22 part 1 — the rename: `drifting` became `unsettled`', () => {
  /* Median OUTSIDE the band with moderate spread — the exact condition the
     verdict formerly named `drifting` fired on. §13's drifting means the
     opposite (inside the band, sliding toward an edge). */
  const offAndMoving = series([7.6, 8.3, 7.6, 8.3, 7.6, 8.3, 7.6, 8.3, 7.6])

  it('the off-band, moving-about verdict is `unsettled`, headlined "Unsettled low/high"', () => {
    const c = computeControl(alkDef, offAndMoving, 90)
    expect(c.verdict).toBe('unsettled')
    expect(c.headline).toBe('Unsettled low')
  })

  it('no fixture, whatever its shape, ever yields the verdict `drifting` or a "Drifting" headline', () => {
    /* The permanent form of the scratchpad/drift-collision3.mjs repro: the
       word `drifting` may no longer appear as a verdict anywhere. */
    const shapes = [
      offAndMoving,
      series([7.2, 7.4, 7.6, 7.3, 7.5, 7.7, 7.4, 7.6, 8.0, 8.25, 8.3]), // the collision fixture: low run, recovering, latest in band
      series([8.5, 8.5, 8.45, 8.55, 8.5, 8.5]),
      series([7.0, 7.05, 6.95, 7.0, 7.05, 6.95, 7.0]),
      series([7.0, 7.4, 7.8, 8.2, 8.6, 9.0, 9.4]),
      series([6.9, 9.1, 7.0, 9.0, 6.8, 9.2, 7.1]),
    ]
    for (const s of shapes) {
      const c = computeControl(alkDef, s, 90)
      expect(c.verdict).not.toBe('drifting')
      expect(String(c.headline)).not.toMatch(/^Drifting/)
    }
  })

  it('the six verdicts are exactly §22\'s six — a seventh in the source fails', () => {
    /* Static half: every quoted verdict assigned inside computeControl must
       be one of the six, and all six must be assignable. */
    const src = fs.readFileSync(
      path.join(__dirname, '../../../lib/analytics/reading-meaning.js'), 'utf8')
    const assigned = [...src.matchAll(/verdict = "([a-z-]+)"/g)].map((m) => m[1])
    expect([...new Set(assigned)].sort()).toEqual([...THE_SIX].sort())
  })
})

describe('§22 part 2 — a verdict never masks a position (the alert tier)', () => {
  /* A tank held very steadily at 7.0 dKH against an 8.2–8.8 band: alert-low
     is target − 1.0 dKH (reef-chemistry.md §18) = 7.5, so the latest reading
     classifies alert-low. The window grading is still `steady-off` — the
     verdict word does not change — but it may not render in steady-off's
     calm blue, and the note must lead with the position. */
  const steadyAtAlertLow = series([7.0, 7.05, 6.95, 7.0, 7.05, 6.95, 7.0])

  it('a steady tank at alert-low keeps the verdict word but renders at the alert tier', () => {
    const c = computeControl(alkDef, steadyAtAlertLow, 90)
    expect(c.verdict).toBe('steady-off')
    expect(c.tone).toBe('#C4285B')
    expect(c.position).toEqual({ band: 'alert-low', tier: 2 })
  })

  it('at the alert tier the note leads with the position, not the steadiness', () => {
    const c = computeControl(alkDef, steadyAtAlertLow, 90)
    expect(c.note).toMatch(/^Your alkalinity needs attention/)
    /* The steadiness sentence is still there — after the position. */
    expect(c.note).toMatch(/steady/i)
    expect(c.note.indexOf('needs attention')).toBeLessThan(c.note.search(/steady/i))
  })

  it('a latest reading out of band (not alert) lifts a calm verdict to the off-band tier', () => {
    /* Median inside the band (controlled, green) but the newest reading sits
       below it at 8.05 — out-of-band-low, above alert-low. Green renders
       calmer than the band; amber does not. */
    const excursion = series([8.5, 8.5, 8.45, 8.55, 8.5, 8.05])
    const c = computeControl(alkDef, excursion, 90)
    expect(c.position).toEqual({ band: 'out-of-band-low', tier: 1 })
    expect(TONE_TIER[c.tone]).toBeGreaterThanOrEqual(1)
  })

  it('no verdict ever renders calmer than its own reading\'s band, across the fixture sweep', () => {
    const shapes = [
      series([7.6, 8.3, 7.6, 8.3, 7.6, 8.3, 7.6, 8.3, 7.6]),
      series([8.5, 8.5, 8.45, 8.55, 8.5, 8.5]),
      series([8.5, 8.5, 8.45, 8.55, 8.5, 8.05]),
      series([7.0, 7.05, 6.95, 7.0, 7.05, 6.95, 7.0]),
      series([7.0, 7.4, 7.8, 8.2, 8.6, 9.0, 9.4]),
      series([6.9, 9.1, 7.0, 9.0, 6.8, 9.2, 7.1]),
      series([9.6, 9.65, 9.55, 9.6, 9.65, 9.6]),
      series([7.2, 7.4, 7.6, 7.3, 7.5, 7.7, 7.4, 7.6, 8.0, 8.25, 8.3]),
    ]
    for (const s of shapes) {
      const c = computeControl(alkDef, s, 90)
      const last = s[s.length - 1].value
      const pos = positionBand(alkDef, last)
      expect(c.position).toEqual(pos)
      expect(TONE_TIER[c.tone], `tone ${c.tone} vs band ${pos.band} (latest ${last})`)
        .toBeGreaterThanOrEqual(pos.tier)
    }
  })

  it('the tier is read from the LAST reading, not the median (reef-chemistry.md §26)', () => {
    /* Median at alert-low levels, latest recovered into the band: the
       position is the last reading, so no alert lead and no red floor. */
    const recovered = series([7.2, 7.0, 7.1, 7.05, 7.15, 7.1, 8.5])
    const c = computeControl(alkDef, recovered, 90)
    expect(c.position.band).toBe('in-band')
    expect(c.note).not.toMatch(/^Your alkalinity needs attention/)
  })

  it('parameters canon gives no alert threshold can reach the off-band tier but never the alert tier', () => {
    const phosDef = PARAM_DEFS.find((d) => d.key === 'phosphate')
    expect(positionBand(phosDef, 9.9)).toEqual({ band: 'out-of-band-high', tier: 1 })
    expect(positionBand(phosDef, 0.0001)).toEqual({ band: 'out-of-band-low', tier: 1 })
  })

  it('§13 boundary rules hold: band edges belong to the band, the alert edge to alert', () => {
    expect(positionBand(alkDef, 8.2).band).toBe('in-band')
    expect(positionBand(alkDef, 8.8).band).toBe('in-band')
    expect(positionBand(alkDef, 7.5).band).toBe('alert-low')   // exactly target − 1.0
    expect(positionBand(alkDef, 9.5).band).toBe('alert-high')  // exactly target + 1.0
    expect(positionBand(alkDef, 7.51).band).toBe('out-of-band-low')
  })
})

describe('§22 part 3 — unknown refuses (§13\'s last row)', () => {
  /* LATENT PATH, not a live repro: every PARAM_DEFS key has a
     CONSISTENCY_RULES entry today (time-in-range.js), so no shipping surface
     reaches this. The test exists because every branch used to fail open —
     a def with no rule still reached `controlled`/`unsettled` on the median
     test alone, a graded verdict resting on no grading. */
  const boronDef = { key: 'boron', label: 'Boron', unit: 'ppm', min: 4, max: 6, step: 0.1 }
  const boronSeries = series([4.5, 4.6, 4.4, 4.5, 4.6]).map((r) => ({ ...r, param: 'boron' }))

  it('precondition: boron genuinely has no consistency rule (else this tests nothing)', () => {
    expect(CONSISTENCY_RULES.boron).toBeUndefined()
  })

  it('a parameter with no consistency rule refuses instead of grading', () => {
    const c = computeControl(boronDef, boronSeries, 90)
    expect(c.refused).toBe(true)
    expect(c.verdict).toBe(null)
    expect(THE_SIX).not.toContain(c.verdict)
  })

  it('the refusal names what is missing, per §14\'s refusal rule', () => {
    const c = computeControl(boronDef, boronSeries, 90)
    expect(c.missing).toBe('consistency tolerance rule')
    expect(c.note).toMatch(/no consistency tolerance is defined for boron/i)
  })

  it('every live parameter still grades — the refusal is reachable only without a rule', () => {
    for (const def of PARAM_DEFS) {
      expect(CONSISTENCY_RULES[def.key], `${def.key} lost its consistency rule`).toBeDefined()
    }
  })
})
