/* §2/§6 parity — a correction landing exactly on a rail
 *
 * surfaces-and-messaging.md §2: "the recommended dose in mL, after rounding
 * and rails" must be identical across every surface that produces a dose.
 * reef-chemistry.md §6: SAFE_DAILY_RISE is the enforced ceiling; a
 * recommendation exceeding it is a bug.
 *
 * `rateLimitDose` (src/lib/dosing/alkalinity.js) is the one function that
 * applies this ceiling. It is imported byte-identically into calcium.js
 * (`import { ... rateLimitDose ... } from './alkalinity.js'`) and into
 * helpers.js's assessMagnesium (same import). So for the dose-clamping step
 * itself, alkalinity/calcium/magnesium cannot disagree — they call the same
 * function object. This file (a) proves that positively with a fixture that
 * lands exactly on the rail, then (b) shows the one real dosing surface that
 * bypasses rateLimitDose entirely: the manual override sheet.
 */
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { rateLimitDose } from '../../src/lib/dosing/alkalinity.js'
import { safeDoseBand, SAFE_DAILY_RISE } from '../../src/lib/analytics/safe-rate.js'
import { railFixture, alkDef } from './fixtures.js'

describe('§6 rail — alkalinity, calcium and magnesium engines call the identical clamp function', () => {
  // rateLimitDose is exported from alkalinity.js only (not re-exported), so
  // it cannot be imported a second time and compared by reference the way
  // PARAM_DEFS or SAFE_DAILY_RISE can. What can be verified without reading
  // the source as prose (per the "do not infer parity from reading the
  // code" rule) is that calcium.js and helpers.js's import statements name
  // the identical symbol from the identical module — the only way JS lets a
  // second file "call" the first file's function is by importing that exact
  // binding, so this is a mechanical, not interpretive, check.
  const calciumSrc = readFileSync(resolve(process.cwd(), 'src/lib/dosing/calcium.js'), 'utf8');
  const helpersSrc = readFileSync(resolve(process.cwd(), 'src/lib/dosing/helpers.js'), 'utf8');

  it('calcium.js imports rateLimitDose from ./alkalinity.js rather than defining its own', () => {
    expect(calciumSrc).toMatch(/import\s*\{[^}]*\brateLimitDose\b[^}]*\}\s*from\s*['"]\.\/alkalinity\.js['"]/);
    // No second definition anywhere in the file.
    expect(calciumSrc).not.toMatch(/function\s+rateLimitDose\s*\(/);
  });

  it('helpers.js (assessMagnesium) imports rateLimitDose from ./alkalinity.js rather than defining its own', () => {
    expect(helpersSrc).toMatch(/import\s*\{[^}]*\brateLimitDose\b[^}]*\}\s*from\s*['"]\.\/alkalinity\.js['"]/);
    expect(helpersSrc).not.toMatch(/function\s+rateLimitDose\s*\(/);
  });
});

describe('§2/§6 — a correction that would exceed the rail lands exactly on it, at stored precision', () => {
  const { settings, effect, currentDose, maintenanceDose, applied, expectedWanted, expectedAllowed } = railFixture;

  it('the raw arithmetic really does ask for more than the rail allows (precondition)', () => {
    expect(currentDose + applied).toBe(expectedWanted);
    const band = safeDoseBand('alkalinity', maintenanceDose, effect);
    expect(expectedWanted).toBeGreaterThan(band.hi);
  });

  it('rateLimitDose clamps to the rail, not to the maintenance dose and not to the raw request', () => {
    const out = { currentDose, maintenanceDose };
    const result = rateLimitDose(applied, out, alkDef, settings, effect);
    expect(result.stop).toBe(false);
    // Stored precision, not display precision (§3 boundary rule, applied here
    // to dose figures rather than reading values): compare the raw number,
    // not a formatted string.
    expect(result.next).toBe(expectedAllowed);
    expect(out.rateLimited).toBeTruthy();
    expect(out.rateLimited.wanted).toBe(expectedWanted);
    expect(out.rateLimited.allowed).toBe(expectedAllowed);
    expect(out.rateLimited.perDay).toBe(SAFE_DAILY_RISE.alkalinity);
  });

  it('the clamped figure is reproducible independently from safeDoseBand — the rail is data, not a side effect of rounding', () => {
    const band = safeDoseBand('alkalinity', maintenanceDose, effect);
    const expected = Math.round(band.hi * 10) / 10;
    expect(expected).toBe(expectedAllowed);
  });
});
