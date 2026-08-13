import { DOSE_ELEMENTS } from './consumption.js'
import { regressionWithError } from './measurement-noise.js'
import { addDays, byOldest } from './time-of-day.js'
import { DEFAULT_SETTINGS } from './water-changes.js'

/* --- 1. Self-calibrating dose strength ---
 *
 * A dose change is a controlled experiment. Before it, consumption
 * C = D1*k - s1; after, C = D2*k - s2, where k is units delivered per mL and
 * s is the observed drift. If consumption held steady across the change, the
 * two are equal and k falls out:
 *
 *     k = (s1 - s2) / (D1 - D2)
 *
 * The assumption that consumption is unchanged is the weak point, so the
 * comparison windows are kept short and the result is reported as a range from
 * the regression standard errors — never as a bare number.
 */
export function calibrateDoseStrength(key, readings, doseLog, waterChanges, settings) {
  const cfg = DOSE_ELEMENTS.find((e) => e.key === key);
  if (!cfg) return null;
  const s = { ...DEFAULT_SETTINGS, ...settings };
  const volumeL = s.volumeL || 77;

  const changes = (doseLog || [])
    .filter((d) => (d.element || "alkalinity") === key)
    .sort(byOldest);
  if (!changes.length) return { status: "nochanges", key };

  const rows = readings.filter((r) => r.param === key).sort(byOldest);
  const WINDOW = 21;           // days either side — long enough for signal,
  const MIN_READINGS = 4;      // short enough that demand shouldn't move much
  const estimates = [];
  const skipped = [];

  for (let i = 0; i < changes.length; i++) {
    const ch = changes[i];
    const prior = i > 0 ? changes[i - 1] : null;
    const dBefore = prior ? prior.ml : null;
    const dAfter = ch.ml;
    // Without a previous logged rate the earlier dose is unknown.
    if (dBefore == null) { skipped.push({ date: ch.date, why: "no earlier dose on record" }); continue; }
    const deltaD = dAfter - dBefore;
    if (Math.abs(deltaD) < 1 || Math.abs(deltaD) / Math.max(dBefore, 1) < 0.15) {
      skipped.push({ date: ch.date, why: `change of ${deltaD.toFixed(1)} mL is too small to measure against` });
      continue;
    }

    const startBefore = addDays(ch.date, -WINDOW);
    const endAfter = addDays(ch.date, WINDOW);
    const before = rows.filter((r) => r.date >= startBefore && r.date < ch.date);
    const after = rows.filter((r) => r.date > ch.date && r.date <= endAfter);
    if (before.length < MIN_READINGS || after.length < MIN_READINGS) {
      skipped.push({ date: ch.date, why: `only ${before.length} readings before and ${after.length} after` });
      continue;
    }

    // A water change inside either window shifts the level independently.
    const wcInside = (waterChanges || []).some((w) => w.date >= startBefore && w.date <= endAfter);
    if (wcInside) { skipped.push({ date: ch.date, why: "a water change falls inside the comparison window" }); continue; }

    const r1 = regressionWithError(before);
    const r2 = regressionWithError(after);
    if (!r1 || !r2) { skipped.push({ date: ch.date, why: "not enough spread in the readings" }); continue; }

    const kPerMl = (r1.slope - r2.slope) / (dBefore - dAfter);
    if (!isFinite(kPerMl) || kPerMl <= 0) {
      skipped.push({ date: ch.date, why: "the level moved opposite to the dose change — something else was going on" });
      continue;
    }
    const seK = Math.sqrt(r1.seSlope ** 2 + r2.seSlope ** 2) / Math.abs(deltaD);
    const strength = kPerMl * volumeL / 100;
    const seStrength = seK * volumeL / 100;
    estimates.push({
      date: ch.date, dBefore, dAfter, deltaD,
      slopeBefore: r1.slope, slopeAfter: r2.slope,
      nBefore: r1.n, nAfter: r2.n,
      kPerMl, strength, seStrength,
      lo: Math.max(0, strength - 2 * seStrength), hi: strength + 2 * seStrength,
    });
  }

  const entered = s[cfg.strengthField];
  if (!estimates.length) return { status: "nodata", key, cfg, entered, skipped };

  // Median is more robust than a mean when one experiment was disturbed.
  const sorted = [...estimates].sort((a, b) => a.strength - b.strength);
  const median = sorted[Math.floor(sorted.length / 2)].strength;
  const widest = {
    lo: Math.min(...estimates.map((e) => e.lo)),
    hi: Math.max(...estimates.map((e) => e.hi)),
  };
  const enteredInside = entered >= widest.lo && entered <= widest.hi;
  const ratio = entered > 0 ? median / entered : null;
  // A result wildly different from the entered figure usually means the
  // assumption of steady consumption failed, not that the bottle is wrong.
  const implausible = ratio != null && (ratio > 5 || ratio < 0.2);

  return {
    status: "ok", key, cfg, entered, estimates, skipped,
    median, range: widest, enteredInside, ratio, implausible,
  };
}
