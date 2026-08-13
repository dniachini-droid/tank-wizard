/* §3 band classification, driven through the fixture matrix required by the
 * task brief: "one case per band from §3, including boundary-exact values."
 *
 * §3 requires exactly seven bands: in-band, drifting, out-of-band-low,
 * out-of-band-high, alert-low, alert-high, insufficient-data. §5 requires
 * one word per concept everywhere.
 *
 * `paramStatus` (src/lib/dates.js) is the one classifier actually shared
 * across surfaces — grep confirms it is imported identically by
 * WaterLog.jsx (history), Dashboard.jsx, DosingWizard.jsx (the tile's own
 * position dot), DoseExpectation.jsx and App.jsx (which builds the `status`
 * field fed into ReadingConfirmation's readingVerdict, the test-log
 * surface). Because it is genuinely shared, whatever vocabulary gap it has
 * is identical everywhere it is used — not a cross-surface contradiction,
 * but a real shortfall against §3's own seven-value contract, worth
 * recording with the actual fixture values rather than inferred from
 * reading the function.
 *
 * (src/test/spec/classification/classify-reading-validation.test.js and
 * alert-thresholds.test.js already establish that `classifyReading` does
 * not exist and that no in-scope module encodes an alert threshold at all.
 * This file's contribution is the fixture-by-fixture matrix the task brief
 * asks for, run against the one function that IS shared, so the gap is
 * shown with real boundary-exact numbers rather than restated.)
 */
import { describe, expect, it } from 'vitest'
import { paramStatus } from '../../src/lib/dates.js'
import { SAFE_BOUNDS } from '../../src/lib/findings.js'
import { bandFixtures, alkDef } from './fixtures.js'

// The full matrix, computed once so it can be asserted on AND printed for
// the record (task Output section: "Parity matrix: fixture x surface x
// field").
const matrix = Object.fromEntries(
  Object.entries(bandFixtures).map(([name, { param, value }]) => {
    const def = param === 'calcium'
      ? { key: 'calcium', min: 400, max: 450, unit: 'ppm' }
      : param === 'magnesium'
        ? { key: 'magnesium', min: 1250, max: 1400, unit: 'ppm' }
        : alkDef;
    return [name, { param, value, status: paramStatus(def, value) }];
  })
);

describe('§3 boundary rule — band edges are inclusive of the band they bound', () => {
  it('exactly at the lower edge (8.5, alkDef.min) classifies in-band ("ok"), not out-of-band-low', () => {
    expect(matrix.inBandLowerEdge.status).toBe('ok');
  });

  it('exactly at the upper edge (9.5, alkDef.max) classifies in-band ("ok"), not out-of-band-high', () => {
    expect(matrix.inBandUpperEdge.status).toBe('ok');
  });

  it('dead centre (9.0) classifies in-band', () => {
    expect(matrix.inBandMid.status).toBe('ok');
  });
});

describe('§3 seven-band vocabulary vs paramStatus\'s actual three-value vocabulary, per fixture', () => {
  it('the full fixture matrix, for the record', () => {
    // Printed (not asserted) so the parity matrix in the task's required
    // output format is backed by an executable, re-runnable artefact rather
    // than a hand-written table.
    // eslint-disable-next-line no-console
    console.log('band-classification matrix:', JSON.stringify(matrix, null, 2));
    expect(Object.keys(matrix).length).toBe(Object.keys(bandFixtures).length);
  });

  it('out-of-band-low (8.2, below the no-action band but above alert-low 7) and alert-low-exact (7.0) both classify as the single value "low"', () => {
    // §3 requires these to be two distinct bands (`out-of-band-low` vs
    // `alert-low`), with different implied action ("correct slowly" vs "act,
    // see chemistry §5 gating"). paramStatus — the classifier every surface
    // that renders a status pill actually calls — cannot tell them apart.
    expect(matrix.outOfBandLow.status).toBe('low');
    expect(matrix.alertLowExact.status).toBe('low');
    expect(matrix.outOfBandLow.status).toBe(matrix.alertLowExact.status);
  });

  it('out-of-band-high (9.8) and alert-high-exact (11.0) likewise both collapse to the single value "high"', () => {
    expect(matrix.outOfBandHigh.status).toBe('high');
    expect(matrix.alertHighExact.status).toBe('high');
    expect(matrix.outOfBandHigh.status).toBe(matrix.alertHighExact.status);
  });

  it('paramStatus has no "drifting" or "insufficient-data" value at all — every possible return is one of exactly four strings', () => {
    const possible = new Set(['ok', 'low', 'high', 'unknown']);
    for (const [name, row] of Object.entries(matrix)) {
      expect(possible.has(row.status), `${name} -> ${row.status}`).toBe(true);
    }
  });

  it('SAFE_BOUNDS (the nearest thing to an alert threshold in the codebase) is not consulted by paramStatus at all — the alert-exact fixtures classify purely off def.min/def.max', () => {
    // alertLowExact (7.0) is chosen to equal SAFE_BOUNDS.alkalinity.min
    // exactly. paramStatus(def, 7.0) returns the same "low" it would for ANY
    // value below def.min (8.5) — including a value nowhere near the safe
    // envelope — because it never reads SAFE_BOUNDS.
    expect(matrix.alertLowExact.value).toBe(SAFE_BOUNDS.alkalinity.min);
    expect(matrix.alertLowExact.status).toBe(matrix.outOfBandLow.status);
  });
});

describe('calcium and magnesium alert-low-exact fixtures, for completeness', () => {
  it('calcium at SAFE_BOUNDS.calcium.min (350) and magnesium at SAFE_BOUNDS.magnesium.min (1150) both classify with the same generic "low" as any other below-target reading', () => {
    expect(matrix.caAlertLowExact.status).toBe('low');
    expect(matrix.mgAlertLowExact.status).toBe('low');
  });
});
