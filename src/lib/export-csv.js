import { byOldest } from './analytics/time-of-day.js'
import { PARAM_DEFS } from './constants.js'

/* --- CSV export --- */
export function buildCsv({ readings, icps, lighting, taskLog, doseLog, waterChanges, allTasks }) {
  const esc = (v) => {
    const s = v == null ? "" : String(v);
    return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
  };
  const lines = ["section,date,item,value,unit,note"];
  for (const r of [...readings].sort(byOldest)) {
    const def = PARAM_DEFS.find((d) => d.key === r.param);
    lines.push(["reading", r.date, r.param, r.value, def ? def.unit : "", r.note || ""].map(esc).join(","));
  }
  for (const t of icps) {
    for (const [k, v] of Object.entries(t.elements || {})) {
      lines.push(["icp", t.date, k, v, "mg/L", t.note || ""].map(esc).join(","));
    }
  }
  for (const d of doseLog || []) {
    lines.push(["dose", d.date, `${d.element || "alkalinity"} dose`, d.ml, "mL/day", d.note || ""].map(esc).join(","));
  }
  for (const w of waterChanges || []) lines.push(["water-change", w.date, "volume", w.litres, "L", w.note || ""].map(esc).join(","));
  for (const l of lighting) lines.push(["lighting", l.date, "change", "", "", l.note || ""].map(esc).join(","));
  for (const t of taskLog || []) {
    const task = (allTasks || []).find((x) => x.id === t.taskId);
    lines.push(["task", t.date, task ? task.label : t.taskId, "", "", ""].map(esc).join(","));
  }
  return lines.join("\n");
}
