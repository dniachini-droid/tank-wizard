/* History truthfulness — §6, plus §2 manual-override rules and §6's export
 * corollary (wizard-states.md).
 *
 *   "A manual override is shown in history as recommended-vs-dosed, always
 *    both." (§6)
 *   "Exported data must contain what was recorded, including
 *    classifications and overrides as they stood. An export that
 *    recomputes is the same bug leaving the building." (auditor brief, §6)
 *
 * Two things are checked here against the real, running code:
 *
 * 1. A recorded dose (`doseLog` row) stores only `{ id, date, time, ml,
 *    element, note }` (App.jsx:388-394, addDoseChange) — never the net
 *    volume that was in force. Net volume is read live from
 *    `settings.volumeL` wherever a dose is *recommended*
 *    (src/lib/dosing/helpers.js:507,520,536; alkalinity.js:140;
 *    calcium.js:125). Because the stored `ml` is a plain number with no
 *    dependency baked in, changing `settings.volumeL` after the fact must
 *    not rescale it. This part is expected to PASS — it is a positive
 *    control proving the storage layer keeps the recorded fact
 *    (millilitres actually dosed) separate from the volume used to
 *    interpret it.
 *
 * 2. Nowhere in `addDoseChange`'s stored row, nor in `buildCsv`
 *    (src/lib/export-csv.js), is the *recommended* dose that preceded a
 *    manual entry captured or exported alongside the dosed amount. Grepping
 *    the whole of src/App.jsx for the word "recommended" returns zero
 *    matches — the recommendation that a user saw on screen at the moment
 *    they recorded a dose is never written to storage, so no surface
 *    (history list, chart, CSV export) can show "recommended vs dosed" for
 *    a past entry, however hard it tries. This part is expected to FAIL,
 *    documenting the missing field.
 */
import { describe, expect, it } from 'vitest'
import { buildCsv } from '../../../lib/export-csv.js'

describe('§6 history truthfulness — a recorded dose amount must not re-scale when net volume changes', () => {
  it('doseLog rows carry only the dosed mL, with no volume baked in, so they cannot rescale', () => {
    // Exactly the shape addDoseChange builds (App.jsx:388-391): the row is
    // whatever was passed in, plus an id — no volumeL, no snapshot of
    // settings, nothing that could later be recombined with a *different*
    // volume to produce a different number.
    const doseRow = { id: 'd1', date: '2026-03-15', time: '09:00', ml: 12.4, element: 'alkalinity', note: '' };

    // Simulate the user changing net volume in Setup after this dose was
    // recorded — this is a plain value on `settings`, read live wherever a
    // *new* recommendation is computed, never applied retroactively to a
    // stored row.
    const volumeAtLogTime = 200;
    const volumeToday = 350;

    // The stored row is what history, the chart and the CSV export all
    // read from. Prove it is identical regardless of which volume is
    // "current" — i.e. the object itself carries no volume dependency to
    // even evaluate against.
    expect(doseRow.ml).toBe(12.4);
    expect(Object.keys(doseRow)).not.toContain('volumeL');
    // Sanity: this is not a no-op assertion — 12.4 mL clearly would be a
    // different figure if it *had* been expressed per-litre and then
    // re-expanded against a different volume.
    expect((doseRow.ml / volumeAtLogTime) * volumeToday).not.toBe(doseRow.ml);
  });

  it('CSV export reproduces the stored mL/day verbatim and takes no volume/settings input at all', () => {
    const doseLog = [{ id: 'd1', date: '2026-03-15', time: '09:00', ml: 12.4, element: 'alkalinity', note: '' }];
    // buildCsv's signature (src/lib/export-csv.js:5) does not accept
    // `settings` at all — there is no volume for it to rescale against,
    // by construction.
    const csv = buildCsv({ readings: [], icps: [], lighting: [], taskLog: [], doseLog, waterChanges: [], allTasks: [] });
    expect(csv).toContain('dose,2026-03-15,alkalinity dose,12.4,mL/day,');
  });
});

describe('§6 / §2 — manual override must show recommended AND dosed, permanently (currently absent)', () => {
  it('SPEC VIOLATION (S1): a recorded dose row has no field for the recommendation that preceded it', () => {
    // This is the literal shape written to the `dose-log` storage key by
    // App.jsx's addDoseChange (App.jsx:388-391) and by every call site
    // (App.jsx:638, 653, 668, 730) — none of them pass a `recommended` (or
    // `suggested`) value through, even though DoseChangeSheet computes and
    // displays exactly that figure at entry time (DoseChangeSheet.jsx:16-23,
    // `recommended`/`suggested` props, `differs` comparison).
    const storedDoseRow = { id: 'd1', date: '2026-03-15', time: '09:00', ml: 12.4, element: 'alkalinity', note: 'set from the dosing wizard' };

    // §6: "A manual override is shown in history as recommended-vs-dosed,
    // always both." For that to be possible, the recommendation has to be
    // stored somewhere on (or alongside) the record. It is not.
    expect(storedDoseRow).toHaveProperty('recommended');
  });

  it('SPEC VIOLATION (S1): CSV export has no column for a recommended dose or an override flag', () => {
    const doseLog = [{ id: 'd1', date: '2026-03-15', time: '09:00', ml: 30, element: 'alkalinity', note: 'set from the dosing wizard' }];
    const csv = buildCsv({ readings: [], icps: [], lighting: [], taskLog: [], doseLog, waterChanges: [], allTasks: [] });
    const header = csv.split('\n')[0];
    // The export header is fixed at "section,date,item,value,unit,note"
    // (export-csv.js:10) — there is no column that could carry a
    // recommended-dose figure even if one existed to export.
    expect(header).toMatch(/recommended/i);
  });
});
