import { SALT_MIX } from './salt-baseline.js'
import { windowRows } from './time-of-day.js'
import { DEFAULT_SETTINGS } from './water-changes.js'
import { PARAM_DEFS } from '../constants.js'
import { daysBetween } from '../dates.js'

/* --- 3. Nutrient production ---
 *
 * A water change replaces a fraction f of the volume, so it removes
 * f x (current - newWater), proportional to the standing level rather than a
 * fixed amount. Over a window:
 *
 *   Cend - Cstart = P*days - SUM_i f_i*(C_i - Cnew)
 *   =>  P = [ (Cend - Cstart) + SUM_i f_i*(C_i - Cnew) ] / days
 *
 * Scope: P is production NET OF ALL OTHER EXPORT — skimmer, carbon, GFO,
 * refugium. It is not gross biological production, and saying otherwise would
 * overstate what the arithmetic supports.
 */
export function computeNutrientProduction(key, readings, waterChanges, settings, days = 60) {
  const s = { ...DEFAULT_SETTINGS, ...settings };
  if (!(s.volumeL > 0)) return { status: "novolume", key };
  const def = PARAM_DEFS.find((d) => d.key === key);
  if (!def) return null;
  const rows = windowRows(readings, key, days);
  if (rows.length < 3) return { status: "insufficient", have: rows.length, def };

  const spanDays = Math.max(1, daysBetween(rows[0].date, rows[rows.length - 1].date));
  if (spanDays < 14) return { status: "tooshort", spanDays, def };

  const cStart = rows[0].value, cEnd = rows[rows.length - 1].value;
  const cNew = SALT_MIX.values[key] != null ? SALT_MIX.values[key] : 0;

  const wcs = (waterChanges || []).filter((w) => w.date >= rows[0].date && w.date <= rows[rows.length - 1].date);
  let removed = 0;
  for (const w of wcs) {
    const f = Math.min(1, (w.litres || 0) / s.volumeL);
    // Concentration at the time of that change, from the nearest reading.
    let near = rows[0], best = Infinity;
    for (const r of rows) {
      const gap = Math.abs(daysBetween(r.date, w.date));
      if (gap < best) { best = gap; near = r; }
    }
    removed += f * (near.value - cNew);
  }

  /* Without logged water changes the equation has no export term, so
     "production" collapses to net drift — which is near zero on a stable tank
     and says nothing about what the tank actually makes. Report that honestly
     rather than printing 0 ppm/week alongside advice that assumes otherwise. */
  if (!wcs.length) {
    return {
      status: "nowaterchanges", def, key, spanDays, cStart, cEnd, cNew,
      netDrift: (cEnd - cStart) / spanDays * 7,
    };
  }

  const perDay = ((cEnd - cStart) + removed) / spanDays;
  const perWeek = perDay * 7;

  /* Production can legitimately come out negative — a tank running heavy
     export consumes more than it generates. That is worth reporting, but an
     equilibrium and a "litres needed to hold" figure derived from it are not:
     they would be negative concentrations, which cannot exist. */
  const netConsumer = perWeek <= 0;

  // Weekly export at the current level, and where the level would settle if
  // water changes were the only thing removing it.
  const avgF = wcs.length
    ? wcs.reduce((a, w) => a + Math.min(1, (w.litres || 0) / s.volumeL), 0) / wcs.length : 0;
  const changesPerWeek = wcs.length ? (wcs.length / spanDays) * 7 : 0;
  const weeklyExport = avgF * changesPerWeek * (cEnd - cNew);
  const offsetPct = perWeek > 0 ? (weeklyExport / perWeek) * 100 : null;
  const equilibrium = (avgF * changesPerWeek) > 0 && !netConsumer
    ? cNew + perWeek / (avgF * changesPerWeek) : null;

  /* At equilibrium production equals export:
     P = (litres/volume) x (level - newWater) per week
     so the volume needed to hold any chosen level is
     litres = P x volume / (level - newWater) */
  const litresToHold = (target) => {
    const head = target - cNew;
    if (!(head > 0) || netConsumer) return null;
    const litres = (perWeek * s.volumeL) / head;
    return isFinite(litres) && litres > 0 ? litres : null;
  };
  const holdAtTarget = litresToHold(def.max);
  const holdAtMid = litresToHold((def.min + def.max) / 2);

  /* How quickly a change in routine actually lands. Each change removes a
     fraction f, so a deviation decays with a half-life of ln2 / -ln(1-f). */
  const weeklyF = avgF * changesPerWeek;
  const halfLifeDays = weeklyF > 0 && weeklyF < 1
    ? (Math.log(2) / -Math.log(1 - weeklyF)) * 7 : null;

  return {
    status: "ok", def, key, spanDays, cStart, cEnd, cNew,
    removed, perDay, perWeek, wcCount: wcs.length,
    weeklyExport, offsetPct: netConsumer ? null : offsetPct,
    equilibrium, saltFree: cNew === 0, netConsumer,
    holdAtTarget, holdAtMid, halfLifeDays, currentLitres: avgF * s.volumeL,
  };
}

/* --- 3. Nutrient ratio (NO3:PO4) --- */
export function computeNutrientRatio(readings) {
  const no3 = windowRows(readings, "nitrate", 60);
  const po4 = windowRows(readings, "phosphate", 60);
  if (!no3.length || !po4.length) return null;
  const n = no3[no3.length - 1], p = po4[po4.length - 1];
  if (!p.value) return null;
  const ratio = n.value / p.value;

  /* Reef convention treats roughly 100:1 NO3:PO4 by weight as balanced
     (e.g. 10 ppm nitrate against 0.10 ppm phosphate). A ratio alone says
     nothing about whether there is enough of either: 0.5 ppm nitrate against
     0.005 phosphate is exactly 100:1 and also a starving tank, so check the
     levels before praising the proportion. */
  const starved = n.value < 3 || p.value < 0.03;
  const loaded = n.value > 25 || p.value > 0.2;

  let verdict, note;
  if (starved) {
    verdict = "starved";
    note = `At ${n.value}ppm nitrate and ${p.value}ppm phosphate the proportion between them is ${ratio >= 50 && ratio <= 150 ? "fine" : "off"}, but the levels are the real issue — both are close to bottom. Corals need measurable nitrogen and phosphorus to build tissue, and running this lean pales them out while giving dinoflagellates an opening. Feed more, or dose nitrate back toward 5ppm, before worrying about the ratio.`;
  } else if (loaded) {
    verdict = "loaded";
    note = `At ${n.value}ppm nitrate and ${p.value}ppm phosphate the ratio is about ${ratio.toFixed(0)}:1, but both are on the high side. That usually shows as darker coral tissue and faster algae growth rather than anything acute. Bring them down gradually through water changes and export — a sudden nutrient crash is harder on corals than steady high readings.`;
  } else if (ratio >= 50 && ratio <= 150) {
    verdict = "balanced";
    note = `At ${ratio.toFixed(0)}:1 your nitrate and phosphate are in good proportion — close to the ~100:1 reefers treat as balanced. This is the zone that supports coral colour without handing an advantage to nuisance algae.`;
  } else if (ratio > 150) {
    verdict = "n-heavy";
    note = `At ${ratio.toFixed(0)}:1 you're running nitrate-heavy relative to phosphate. When phosphate becomes the limiting nutrient, corals can pale and cyanobacteria or dinoflagellates get an opening. Consider easing off phosphate export rather than chasing nitrate down.`;
  } else {
    verdict = "p-heavy";
    note = `At ${ratio.toFixed(0)}:1 phosphate is high relative to nitrate. Phosphate-dominant systems tend toward algae and can suppress calcification. Raising nitrate slightly often rebalances this better than stripping phosphate hard.`;
  }
  return { ratio, verdict, note, no3: n.value, po4: p.value, date: n.date };
}
