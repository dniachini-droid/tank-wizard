import { byOldest } from './analytics/time-of-day.js'
import { PARAM_DEFS } from './constants.js'

/* --- CSV export --- */
export function buildCsv({ readings, icps, lighting, taskLog, doseLog, waterChanges, allTasks,
  corrections = [] }) {
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
  /* One-off corrections were absent from this file entirely, which made the
     export unable to answer the one question it exists for. The engines read
     them permanently — a correction is what stops a rise being read as the
     tank needing less — so a spreadsheet without them shows a consumption
     estimate moving for no reason a reader can see.

     A separate section rather than a "dose" row: `dose` rows are mL/day, a
     rate that stays set, and a correction is a single addition in mL. Filing
     them under one heading would put two different quantities in one column. */
  for (const c of corrections || []) {
    lines.push(["correction", c.date, `${c.element || "alkalinity"} correction`, c.ml, "mL", c.note || ""].map(esc).join(","));
  }
  for (const w of waterChanges || []) lines.push(["water-change", w.date, "volume", w.litres, "L", w.note || ""].map(esc).join(","));
  for (const l of lighting) lines.push(["lighting", l.date, "change", "", "", l.note || ""].map(esc).join(","));
  for (const t of taskLog || []) {
    const task = (allTasks || []).find((x) => x.id === t.taskId);
    lines.push(["task", t.date, task ? task.label : t.taskId, "", "", ""].map(esc).join(","));
  }
  return lines.join("\n");
}
