import { DOSE_ELEMENTS, computeElementConsumption } from '../analytics/consumption.js'
import { computeDoseAdvice, computeIonicBalance } from '../analytics/drift.js'
import { fmtAmount } from '../analytics/time-in-range.js'
import { DEFAULT_SETTINGS } from '../analytics/water-changes.js'

/* --- What changes if a corrected strength is applied ---
 *
 * Retyping a four-decimal number is exactly the kind of transcription that
 * produces a wrong figure in the first place, and applying one blind hides the
 * consequences. This works out the before and after so the change can be seen
 * before it is committed.
 */
export function previewStrengthChange(key, newStrength, readings, waterChanges, settings, paramDefs) {
  const el = DOSE_ELEMENTS.find((e) => e.key === key);
  if (!el) return null;
  const before = { ...DEFAULT_SETTINGS, ...settings };
  /* Everything here is per-litre, and a nonsensical strength can't be previewed
     meaningfully either. Refuse rather than render Infinity at the user. */
  if (!(before.volumeL > 0)) return null;
  if (!(typeof newStrength === "number" && isFinite(newStrength) && newStrength > 0)) return null;
  const after = { ...before, [el.strengthField]: newStrength };
  const def = paramDefs.find((d) => d.key === key);

  const rows = [];
  const doseMl = before[el.doseField] || 0;
  const delivers = (st) => doseMl * st * (100 / before.volumeL);
  rows.push({
    label: "Your dose delivers",
    before: `${fmtAmount(delivers(before[el.strengthField]))} ${def ? def.unit : ""}/day`,
    after: `${fmtAmount(delivers(newStrength))} ${def ? def.unit : ""}/day`,
  });

  const cB = computeElementConsumption(key, readings, waterChanges, before);
  const cA = computeElementConsumption(key, readings, waterChanges, after);
  if (cB && cA && cB.status === "ok" && cA.status === "ok" && cB.reliable) {
    rows.push({
      label: "Consumption",
      before: `${fmtAmount(cB.perDay)} ${def ? def.unit : ""}/day`,
      after: `${fmtAmount(cA.perDay)} ${def ? def.unit : ""}/day`,
    });
  }

  const aB = computeDoseAdvice(readings, [], paramDefs, 30, before);
  const aA = computeDoseAdvice(readings, [], paramDefs, 30, after);
  const mlOf = (adv) => {
    const e = adv.advice[key];
    return e && e.calc && !e.calc.impossible ? `${e.calc.recommendedMl.toFixed(1)} mL/day` : null;
  };
  const mB = mlOf(aB), mA = mlOf(aA);
  if (mB || mA) rows.push({ label: "Suggested dose", before: mB || "—", after: mA || "—" });

  if (key === "calcium" || key === "alkalinity") {
    const bB = computeIonicBalance(readings, before);
    const bA = computeIonicBalance(readings, after);
    if (bB && bA && bB.status === "ok" && aA && bA.status === "ok") {
      rows.push({
        label: "Calcium/alkalinity ratio",
        before: `${bB.ratio.toFixed(1)} ppm per dKH`,
        after: `${bA.ratio.toFixed(1)} ppm per dKH`,
        good: bA.ratio >= bA.band[0] && bA.ratio <= bA.band[1],
      });
    }
  }

  /* Whether a different mixing concentration would be more practical. This is a
     convenience question, not a correction: the solution is whatever strength it
     is, and the app's job is to hold the right number for it. */
  const perDayNeed = (() => {
    const a = aA.advice[key];
    return a && a.calc && !a.calc.impossible ? a.calc.recommendedMl : doseMl;
  })();
  let remixNote = null;
  if (perDayNeed > 0 && perDayNeed < 0.5) {
    remixNote = `At ${perDayNeed.toFixed(2)} mL a day, most dosing pumps can't deliver this accurately — their smallest reliable dose is usually around 0.5 mL. Mixing the solution weaker would give you a larger, more repeatable daily volume.`;
  } else if (perDayNeed > 50) {
    remixNote = `At ${perDayNeed.toFixed(0)} mL a day you'll be refilling often, and that's a lot of water going into a ${before.volumeL}L system. Mixing the solution stronger would cut the volume — just remember to update the strength here when you do.`;
  }

  return { rows, remixNote, el, newStrength, oldStrength: before[el.strengthField] };
}

/* Findings relevant to one parameter, most serious first. */
export function findingsFor(findings, key) {
  const rank = { act: 0, watch: 1, info: 2 };
  return (findings || [])
    .filter((f) => f.params && f.params.includes(key))
    .sort((a, b) => rank[a.severity] - rank[b.severity]);
}
