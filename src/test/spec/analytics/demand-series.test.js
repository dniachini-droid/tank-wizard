/* Spec conformance — demand.js status discipline and rolling-window math
 *
 * docs/spec/reef-chemistry.md §0 (lines 22-23): "would rather say 'not
 * enough data' than produce a confident number from thin evidence."
 *
 * computeDemandSeries (src/lib/analytics/demand.js) is the rolling-window
 * companion to computeElementConsumption — nothing exercised its "ok" branch
 * anywhere in the test suite before this file. This locks the basic shape of
 * a correct result (a flat, noise-free series reports "steady" demand with
 * zero change) and the "novolume"/"nodose" refusal branches, which are
 * already spec-compliant and worth protecting from regression.
 */
import { describe, expect, it } from 'vitest'
import { computeDemandSeries } from '../../../lib/analytics/demand.js'
import { DEFAULT_SETTINGS } from '../../../lib/analytics/water-changes.js'

const S = { ...DEFAULT_SETTINGS, volumeL: 100, dailyDoseMl: 8, dkhPerMlPer100L: 0.0533 }

describe('computeDemandSeries refusal branches', () => {
  it('refuses with net volume unset', () => {
    const result = computeDemandSeries('alkalinity', [], [], { ...S, volumeL: null })
    expect(result.status).toBe('novolume')
  })

  it('refuses when no dose is configured for the element', () => {
    const result = computeDemandSeries('alkalinity', [], [], { ...S, dailyDoseMl: 0 })
    expect(result.status).toBe('nodose')
  })
})

describe('computeDemandSeries "ok" branch', () => {
  /* A perfectly linear, zero-noise alkalinity series, dosed at a constant
     rate: demand should read as exactly steady across every rolling window,
     since nothing about the underlying draw is changing. */
  const rows = []
  for (let i = 0; i < 30; i++) {
    const d = new Date(2026, 5, 1)
    d.setDate(d.getDate() + i * 2)
    const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    rows.push({ id: `r${i}`, param: 'alkalinity', date: iso, value: 9.0 - i * 0.03 })
  }

  it('reports a steady, non-meaningful trend on a perfectly linear series', () => {
    const result = computeDemandSeries('alkalinity', rows, [], S)
    expect(result.status).toBe('ok')
    expect(result.direction).toBe('steady')
    expect(result.meaningful).toBe(false)
    expect(result.change).toBeCloseTo(0, 6)
    expect(result.points.length).toBeGreaterThan(1)
  })
})
