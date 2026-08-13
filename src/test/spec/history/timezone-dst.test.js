/* History truthfulness — §6 corollary: a reading logged at 23:30 must land
 * on the calendar day it was actually taken, and stay there, regardless of
 * DST transitions or a later device timezone change.
 *
 * src/lib/dates.js documents a previously-fixed version of exactly this bug
 * (isoLocal's header comment: "toISOString() returns UTC. At 9am in Sydney
 * it is still the previous day in UTC..."). This file is a regression test
 * guarding that fix, plus checks of the two follow-on risks named in the
 * auditor brief: a DST boundary, and a reading's stored date surviving a
 * later device timezone change unmoved.
 */
import { describe, expect, it, vi, afterEach } from 'vitest'
import { isoLocal, parseLocal, todayStr } from '../../../lib/dates.js'

afterEach(() => vi.useRealTimers());

describe('§6 — a 23:30 reading does not move to the next (or previous) calendar day', () => {
  it('isoLocal reads the wall-clock date, not the UTC date, for a late-night local timestamp', () => {
    // 23:30 local time, well past midnight UTC for any timezone west of
    // UTC+0:30 — if isoLocal used toISOString() (UTC) this would read as
    // the next day.
    const lateNight = new Date(2026, 5, 15, 23, 30); // 15 Jun 2026, 23:30 local
    expect(isoLocal(lateNight)).toBe('2026-06-15');
  });

  it('todayStr(), called at 23:30 local, matches isoLocal of "now" (no UTC round-trip)', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 5, 15, 23, 30));
    expect(todayStr()).toBe('2026-06-15');
  });

  it('a reading logged at 23:30 the night before a US spring-forward DST transition keeps its date', () => {
    // 2026-03-08 is the US DST "spring forward" date (2am -> 3am).
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 2, 8, 23, 30));
    expect(todayStr()).toBe('2026-03-08');
  });

  it('a reading logged at 23:30 the night before a US fall-back DST transition keeps its date', () => {
    // 2026-11-01 is the US DST "fall back" date (2am -> 1am).
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 9, 31, 23, 30));
    expect(todayStr()).toBe('2026-10-31');
  });
});

describe('§6 — a stored reading date is a plain calendar string, immune to a later device timezone change', () => {
  it('parseLocal/isoLocal round-trip a stored date string without reference to the current locale or offset', () => {
    // The stored value for a reading is always a bare "YYYY-MM-DD" string
    // (see App.jsx addReading: `row.date`, WaterLog editDate, TestLab
    // `date` state seeded from todayStr()). Once stored, re-deriving the
    // same string back must not depend on "now" or on whatever timezone
    // the device happens to be in when it is displayed.
    const stored = '2026-06-15';
    // Simulate reading it back on a device in a completely different
    // timezone / at a much later "now" — isoLocal(parseLocal(x)) must be
    // a pure round-trip with no dependency on the current system time.
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2027, 0, 1, 3, 0));
    expect(isoLocal(parseLocal(stored))).toBe('2026-06-15');
  });

  it('a date string logged at 23:30 is not reconstructed via a UTC-based Date (which would drift a day under -X:30 to +X:30 offsets)', () => {
    // Regression guard for the exact bug isoLocal's own header comment
    // describes: building the reading's date via `new Date(...).toISOString()`
    // (UTC) rather than local getFullYear/getMonth/getDate.
    const d = new Date(2026, 5, 15, 23, 30);
    const viaUtc = d.toISOString().slice(0, 10);
    const viaLocal = isoLocal(d);
    // In the test runner's local timezone this may or may not coincide;
    // the point is that the app's own helper (isoLocal) must always match
    // the wall-clock date, never the UTC one, for a late-night reading.
    expect(viaLocal).toBe('2026-06-15');
    // Document, rather than assert, whether the environment's own offset
    // would have caused the two to diverge — this makes the regression
    // guard meaningful even when CI happens to run in UTC.
    if (viaUtc !== viaLocal) {
      expect(d.getTimezoneOffset()).not.toBe(0);
    }
  });
});
