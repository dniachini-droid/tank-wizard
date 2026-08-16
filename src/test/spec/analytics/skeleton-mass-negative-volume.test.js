/* Spec conformance — reef-chemistry.md §2, §7.6/§9: net volume must be
 * validated and, when unusable, refused and named — the same rule TW-001
 * already applied to `predictAfterChange` and `computeConsumption` (see
 * net-volume-entry-points.test.js).
 *
 * `computeSkeletonMass` (src/lib/analytics/calcification.js:25) uses a
 * DIFFERENT guard than its siblings:
 *
 *   computeSkeletonMass:   if (!volumeL) return { status: "novolume", ... }
 *   computeConsumption:    if (!(s.volumeL > 0)) return null
 *   predictAfterChange:    if (!(volumeL > 0)) return { status: "novolume", ... }
 *
 * `!volumeL` and `!(volumeL > 0)` only agree for a genuine positive number.
 * They disagree for:
 *   - any negative number:      !(-50) is false -> falls through and computes
 *     a NEGATIVE mass/day figure instead of refusing.
 *   - a numeric string "0":     !"0" is false ("0" is a non-empty, truthy
 *     string) -> falls through, silently computing a zero mass rather than
 *     refusing and naming net volume as the missing input.
 *
 * A negative net volume is directly reachable in the live app without ever
 * touching Setup's own `volNum > 0 ? volNum : null` sanitiser: restoreBackup
 * (src/lib/backup.jsx:151-155) applies `tank-settings` from an imported
 * backup file with NO numeric validation at all —
 *   `{ ...DEFAULT_SETTINGS, ...b["tank-settings"] }`
 * — so a hand-edited or corrupted backup JSON with `"volumeL": -50` loads
 * straight into live settings and reaches Insights.jsx's `skeleton` card
 * (line 118), which renders it unconditionally as long as `skeleton.status
 * !== "novolume"` (line 424).
 */
import { describe, expect, it } from 'vitest'
import { computeSkeletonMass } from '../../../lib/analytics/calcification.js'

describe('computeSkeletonMass — invalid net volume must refuse, matching computeConsumption/predictAfterChange', () => {
  it('BUG: negative net volume produces a negative mass instead of refusing', () => {
    const result = computeSkeletonMass(0.3, -50);
    // What actually happens today: a negative "grams of calcium carbonate
    // deposited per day" figure — nonsensical, and exactly the "wrong number"
    // AGENTS.md calls a safety property, not a quality one.
    expect(result).toEqual({ status: 'novolume', missing: 'net volume' });
  });

  it('BUG: net volume as the numeric string "0" produces a silent zero instead of refusing', () => {
    const result = computeSkeletonMass(0.3, "0");
    expect(result).toEqual({ status: 'novolume', missing: 'net volume' });
  });

  it('BUG: net volume as a negative numeric string ("-50", plausible after a corrupted/hand-edited backup restore) also bypasses the guard', () => {
    const result = computeSkeletonMass(0.3, "-50");
    expect(result).toEqual({ status: 'novolume', missing: 'net volume' });
  });

  it('control: a genuine positive net volume still works (this must keep passing)', () => {
    const result = computeSkeletonMass(0.3, 68);
    expect(result.gPerDay).toBeGreaterThan(0);
  });

  it('control: exactly zero net volume (the number 0) is already refused correctly today', () => {
    const result = computeSkeletonMass(0.3, 0);
    expect(result).toEqual({ status: 'novolume', missing: 'net volume' });
  });
});
