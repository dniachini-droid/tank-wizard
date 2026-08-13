/* Two smoke tests to prove the Vitest setup works — nothing more. */
import { describe, it, expect } from 'vitest'
import { isoLocal, paramStatus } from './dates.js'

describe('isoLocal', () => {
  it('formats a date as a local YYYY-MM-DD string', () => {
    expect(isoLocal(new Date(2026, 0, 5))).toBe('2026-01-05')
  })
})

describe('paramStatus', () => {
  it('reads a value inside the band as ok', () => {
    expect(paramStatus({ min: 8.5, max: 9.5 }, 9)).toBe('ok')
  })
})
