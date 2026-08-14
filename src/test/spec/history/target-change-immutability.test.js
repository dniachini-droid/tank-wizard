/* History truthfulness — §16 (wizard-states.md)
 *
 *   "A logged entry records what the app said at the time: the
 *    classification, the recommendation, and the targets then in force.
 *    Changing targets today must not retroactively change what history
 *    shows was recommended. Recomputing the past against present settings
 *    is an S1 defect."
 *
 * WaterLog (src/components/WaterLog.jsx:186) renders each historical row's
 * status pill as:
 *
 *     <StatusPill status={paramStatus(histDef, r.value)} />
 *
 * `histDef` is looked up from the `paramDefs` prop, which App.jsx builds
 * live from PARAM_DEFS merged with `customRanges` on every render
 * (App.jsx:377-381 — "Merge any user-edited target ranges over the
 * built-in defaults"). Nothing about a stored reading records the target
 * band that was in force when it was logged, and `paramStatus` takes no
 * timestamp — it classifies strictly against whatever `def.min`/`def.max`
 * the caller currently hands it. So the history list has no way to know
 * what the band used to be; it only ever knows what it is right now.
 *
 * This test renders the real WaterLog component with one stored reading,
 * first against the target band in force when it was logged, then again
 * (same reading, same id, nothing about it touched) against a changed
 * target band — exactly what happens when a user edits a target in Setup
 * and returns to Test Lab. Per §6 the classification shown must not move.
 */
import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import React from 'react'
import { WaterLog } from '../../../components/WaterLog.jsx'
import { PARAM_DEFS } from '../../../lib/constants.js'

const noop = () => {};
const asyncNoop = async () => {};

// A single reading logged back in March, stored exactly once and never
// edited again — this object is byte-for-byte identical across both
// renders below.
const historicalReading = {
  id: 'hist-1',
  param: 'alkalinity',
  value: 8.5,
  date: '2026-03-15',
  time: '09:00',
  note: '',
};

// The band in force at the time the reading was logged: PARAM_DEFS ships
// alkalinity as 8.2-8.8 dKH (src/lib/constants.js:26), and 8.5 sits
// squarely inside it.
const targetsAtLogTime = PARAM_DEFS;

// The same merge App.jsx performs when a user edits the alkalinity target
// in Setup (App.jsx:377-381: `PARAM_DEFS.map(d => customRanges[d.key] ? {
// ...d, min: customRanges[d.key].min, max: customRanges[d.key].max } : d)`).
// The user has since decided they want a tighter, higher band.
const targetsAfterChange = PARAM_DEFS.map((d) =>
  d.key === 'alkalinity' ? { ...d, min: 9.2, max: 9.8 } : d);

function renderLog(paramDefs) {
  return render(React.createElement(WaterLog, {
    readings: [historicalReading],
    onAdd: asyncNoop,
    onDelete: noop,
    onEdit: asyncNoop,
    paramDefs,
  }));
}

describe('§6 history truthfulness — target change must not rewrite a historical classification', () => {
  it('baseline: 8.5 dKH logged in March renders "In range" under the target that was in force then', () => {
    renderLog(targetsAtLogTime);
    expect(screen.getByText('In range')).toBeInTheDocument();
  });

  it('SPEC VIOLATION (§6, S1): the identical stored reading silently becomes "Low" once today\'s target changes', () => {
    const { unmount } = renderLog(targetsAtLogTime);
    expect(screen.getByText('In range')).toBeInTheDocument();
    unmount();

    // Nothing about `historicalReading` changed — same id, same value, same
    // date. Only today's target band changed, exactly as if the user had
    // just edited alkalinity's target in Setup.
    renderLog(targetsAfterChange);

    // §6: "Changing targets today must not retroactively change what
    // history shows was recommended." This assertion is what a truthful
    // history view requires. It fails against the current implementation,
    // which recomputes the pill from `paramDefs` on every render with no
    // memory of what band applied in March.
    expect(screen.getByText('In range')).toBeInTheDocument();
  });

  it('confirms what the history view shows instead: "Low", for a value that never moved', () => {
    renderLog(targetsAfterChange);
    // Evidence, not just absence: the exact same 8.5 dKH reading, unedited,
    // now reads as Low because 9.2-9.8 is today's band. History rewritten.
    expect(screen.getByText('Low')).toBeInTheDocument();
    expect(screen.queryByText('In range')).not.toBeInTheDocument();
  });
});
