/* Spec conformance — §2/§7.6/§9 net volume must be named, never a crash or a
 * silent vanish, on the Insights "Skeleton laid down" card.
 *
 * Spec anchor: docs/spec/reef-chemistry.md §2, lines 48-52 — "If net volume
 * is unset, the app refuses to calculate any dose and names net volume as
 * the missing input." §7.6, line 188 — "Any missing input is named. The app
 * never substitutes a default silently."
 *
 * computeSkeletonMass (calcification.js) now returns a truthy
 * `{ status: 'novolume', missing: 'net volume' }` object instead of a bare
 * null when net volume is unset (see net-volume-entry-points.test.js). That
 * object has no `gPerMonth`/`gPerWeek`/etc — Insights.jsx read those fields
 * unconditionally as soon as `skeleton` was truthy, so this is a regression
 * test pinning the guard that stops that read from throwing.
 *
 * computeConsumption itself also refuses on an unset net volume, so a real
 * user can never actually reach a truthy `consumption.consumption` with
 * `settings.volumeL` unset — the only way to exercise the Insights.jsx guard
 * in isolation is to control what `consumption` the component sees directly,
 * which is what the mock below does. Everything else here reflects a
 * genuine first-run state (no readings, no dose log, no icps).
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
      consumption: 0.3,
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

describe('§2/§7.6/§9 — Insights "Skeleton laid down" card with net volume unset', () => {
  it('does not throw and names net volume on screen rather than crashing or vanishing', () => {
    const settings = { ...DEFAULT_SETTINGS, volumeL: null };

    expect(() => render(React.createElement(Insights, {
      readings: [],
      icps: [],
      paramDefs: PARAM_DEFS,
      settings,
      latestByParam: {},
    }))).not.toThrow();

    /* Not a silent vanish either: the card is present, open it and confirm
       the missing input is named. */
    const summary = screen.getByText(/set your tank's net volume in setup/i);
    expect(summary).toBeInTheDocument();
  });
});
