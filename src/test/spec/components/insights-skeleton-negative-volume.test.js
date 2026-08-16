/* Spec conformance — reef-chemistry.md §2/§7.6/§9: a wrong number must never
 * reach the screen in place of a refusal.
 *
 * This pins the live-app consequence of the computeSkeletonMass guard bug
 * documented in skeleton-mass-negative-volume.test.js: with a negative
 * `settings.volumeL` (reachable today via an unsanitised backup restore —
 * see src/lib/backup.jsx:151-155, which spreads `tank-settings` from an
 * imported file straight into live settings with no numeric validation),
 * Insights.jsx's "Skeleton laid down" card renders a NEGATIVE mass figure
 * ("about -8 g of calcium carbonate a month") instead of the refusal state
 * it correctly shows when volumeL is null/unset (see
 * insights-skeleton-novolume.test.js, the sibling positive-control file).
 *
 * A negative mass of calcium carbonate "deposited" per month is not a
 * possible real-world reading — it is a symptom of the guard bug, presented
 * to a real person as though it were a tank measurement.
 */
import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import React from 'react'

vi.mock('../../../lib/analytics/consumption.js', async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    computeConsumption: () => ({
      driftPerDay: -0.2,
      dosePerDayDkh: 0.5,
      consumption: 0.3, // positive alkalinity consumption -> skeleton mass is computed
      recommendedMl: null,
      adjustMl: null,
      windows: [],
      demandTrend: null,
      settings: {},
      readingCount: 5,
    }),
  };
});

const { Insights } = await import('../../../components/Insights.jsx');
const { PARAM_DEFS } = await import('../../../lib/constants.js');
const { DEFAULT_SETTINGS } = await import('../../../lib/analytics/water-changes.js');

describe('§2/§7.6/§9 — Insights "Skeleton laid down" card with a negative (corrupted) net volume', () => {
  it('BUG: renders a negative calcium-carbonate mass instead of refusing', () => {
    // Exactly what a backup restore with a hand-edited/corrupted
    // "tank-settings": { "volumeL": -50 } produces once merged with
    // DEFAULT_SETTINGS (restoreBackup performs no validation on this field).
    const settings = { ...DEFAULT_SETTINGS, volumeL: -50 };

    render(React.createElement(Insights, {
      readings: [],
      icps: [],
      paramDefs: PARAM_DEFS,
      settings,
      latestByParam: {},
    }));

    // What SHOULD happen: the same refusal shown for volumeL: null.
    const refusal = screen.queryByText(/set your tank's net volume in setup/i);
    expect(refusal).toBeInTheDocument();

    // What ACTUALLY happens: a negative mass figure is displayed instead.
    const bogusNegative = screen.queryByText(/-\d/); // any rendered negative number
    expect(bogusNegative).not.toBeInTheDocument();
  });
});
