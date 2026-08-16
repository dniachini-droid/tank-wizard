import { useEffect, useMemo, useState } from 'react'
import { Btn, Field, inputCls } from '../components/DoseExpectation.jsx'
import { Card } from '../components/ErrorBoundary.jsx'
import { Check, ChevronDown, Save, Settings2, X } from '../icons.jsx'
import { fmtVal } from './analytics/time-in-range.js'
import { addDays } from './analytics/time-of-day.js'
import { DEFAULT_SETTINGS, fmtFriendly } from './analytics/water-changes.js'
import { uid } from './constants.js'
import { STATUS_COLOR, fmtShort, paramStatus, todayStr } from './dates.js'
import { intervalLabel, projectOccurrences } from './reminders.js'
import { loadKey, saveKey } from './storage.js'

/* --- Backup and restore ---
 *
 * Browser storage is not durable. On iOS, Safari deletes a site's local storage
 * after seven days without a visit, and clearing browsing data wipes it at any
 * time. Adding the app to the home screen avoids the seven-day rule, but not a
 * lost phone or an accidental clear.
 *
 * The CSV export is for reading — open it in a spreadsheet, share it. It is not
 * a backup: it flattens ICP panels into rows and drops settings entirely, so it
 * cannot be restored from. This is the file that can.
 */
export const BACKUP_LABELS = {
  "readings": "Test readings", "icp-tests": "ICP panels", "water-changes": "Water changes",
  "dose-log": "Dose changes", "lighting-log": "Lighting notes", "task-log": "Completed tasks",
  "tasks-custom": "Custom tasks", "reminders": "Reminder schedules",
};

export const BACKUP_KEYS = [
  "readings", "icp-tests", "tasks-custom", "task-log", "lighting-log",
  "custom-ranges", "tank-settings", "dose-log", "water-changes", "reminders", "kit-changes",
  "findings-dismissed", "alk-plan", "corrections", "ca-plan", "mg-plan",
  /* An in-progress correction: the elevated dose, what it is correcting
     toward, and the dose to go back to when it arrives. It was written by the
     app and read by the app but collected by neither half of this file, so a
     restore returned the dose log showing an elevated dose with nothing left
     to explain it, and nothing to tell the user to put the dose back. */
  "correction-plans",
];

export async function buildBackup() {
  const data = {};
  for (const key of BACKUP_KEYS) {
    data[key] = await loadKey(key, null);
  }
  return {
    format: "dans-tank-backup",
    version: 1,
    createdAt: new Date().toISOString(),
    counts: {
      readings: (data["readings"] || []).length,
      icps: (data["icp-tests"] || []).length,
      waterChanges: (data["water-changes"] || []).length,
      doseChanges: (data["dose-log"] || []).length,
      taskLog: (data["task-log"] || []).length,
      lighting: (data["lighting-log"] || []).length,
    },
    data,
  };
}

/* The natural key each list merges on. Merging is by natural key, never by id,
   because ids are regenerated and would let the same reading in twice.

   Written once and shared by the preview and the restore. It used to be two
   copies of the same object literal, one in each function, which is how they
   came to disagree about what counted as a duplicate.

   Time of day is part of the key for readings and dose changes because a day
   is not the unit either of them happens in. Two alkalinity tests, one before
   the morning dose and one after the evening one, is the ordinary way to find
   out what a dose did; two dose changes in a day is what a staged plan looks
   like when you change your mind. On `param|date` alone the pair collided and
   the second was dropped, silently, on every restore.

   `r.time || ""` rather than requiring a time: rows written before times were
   recorded have none, and they must still match themselves, or restoring an
   old file would duplicate every row in it. */
export const NATURAL_KEYS = {
  "readings": (r) => `${r.param}|${r.date}|${r.time || ""}`,
  "icp-tests": (r) => r.date,
  "water-changes": (r) => `${r.date}|${r.litres}`,
  "dose-log": (r) => `${r.element || "alkalinity"}|${r.date}|${r.time || ""}`,
  "lighting-log": (r) => r.date,
  "task-log": (r) => `${r.taskId}|${r.date}`,
  "tasks-custom": (r) => r.id,
  "reminders": (r) => r.id,
};

/* Only entries the app can actually use are counted. Two problems otherwise:
   a null in any list threw while building the key, so a single bad entry
   made the whole file unreadable with no explanation; and a string or a
   number in the readings list was counted as an importable record, so the
   preview promised more than the restore would deliver and the difference
   vanished silently. */
const usable = (rows) => (Array.isArray(rows) ? rows : [])
  .filter((r) => r && typeof r === "object" && !Array.isArray(r));

/* One merge, run by the preview and by the restore, so the number on the
   confirmation screen is the number of rows that actually arrive.

   The preview used to count the incoming rows that were absent from current
   state, which is not the same question: it deduped the file against the
   device but never against itself, while the restore deduped both ways. A
   file holding the same entry twice was previewed as two recoveries and
   delivered as one, and nothing said so. */
export function planMerge(currentRows, incomingRows, keyFn) {
  const merged = usable(currentRows);
  const have = new Set(merged.map(keyFn));
  const kept = [];
  for (const row of usable(incomingRows)) {
    const k = keyFn(row);
    if (have.has(k)) continue;
    have.add(k);
    kept.push(row);
  }
  return { merged, kept };
}

const isRange = (v) => v && typeof v === "object" && !Array.isArray(v);
const sameRange = (a, b) => (a == null && b == null)
  || (isRange(a) && isRange(b) && a.min === b.min && a.max === b.max);

/* Which parameters the file and this device disagree about, with both values,
   so a restore can show them rather than pick one.

   A target present on one side and absent on the other is a disagreement too:
   absent means "use the app's default band", which is a different band from
   whatever the other side names, and history reads the same either way. */
export function rangeConflicts(fileRanges, deviceRanges) {
  /* A file that says nothing about targets is not disagreeing with anything —
     the same reading the correction plans below get. Absence has three shapes
     and none of them may be read as "go back to the defaults": a file written
     before this key was collected has no member at all, a device that has
     never customised a band writes an explicit null, and `{}` is what
     `loadKey("custom-ranges", {})` hands back for the same device. Asking the
     user to choose between their targets and no targets on every restore of
     an ordinary file would be noise, and the answer that matters — keep what
     is on this device — is the one absence already implies. */
  if (!isRange(fileRanges) || Object.keys(fileRanges).length === 0) return [];
  const f = fileRanges;
  const d = isRange(deviceRanges) ? deviceRanges : {};
  const params = [...new Set([...Object.keys(d), ...Object.keys(f)])].sort();
  return params
    .filter((p) => !sameRange(d[p], f[p]))
    .map((p) => ({ param: p, device: isRange(d[p]) ? d[p] : null, file: isRange(f[p]) ? f[p] : null }));
}

/* Describe a backup file without writing anything, so the restore can be seen
   before it happens. */
export function inspectBackup(parsed, current, deviceRanges = null) {
  if (!parsed || parsed.format !== "dans-tank-backup") {
    return { ok: false, reason: "That doesn't look like a backup from this app." };
  }
  if (!parsed.data || typeof parsed.data !== "object") {
    return { ok: false, reason: "The file is missing its data." };
  }
  const b = parsed.data;
  /* Unusable entries are reported rather than ignored — telling someone their
     backup had 412 readings when 9 of them cannot be read is the difference
     between a restore they can trust and one that quietly loses data. */
  const summary = [];
  let skipped = 0;
  for (const key of Object.keys(NATURAL_KEYS)) {
    const raw = Array.isArray(b[key]) ? b[key] : [];
    const incoming = usable(raw);
    skipped += raw.length - incoming.length;
    const { kept } = planMerge(current[key], incoming, NATURAL_KEYS[key]);
    if (raw.length) summary.push({ key, total: incoming.length, fresh: kept.length, skipped: raw.length - incoming.length });
  }
  const hasSettings = b["tank-settings"] && typeof b["tank-settings"] === "object";
  return {
    ok: true, summary, hasSettings, skipped,
    createdAt: parsed.createdAt,
    rangeConflicts: rangeConflicts(b["custom-ranges"], deviceRanges),
  };
}

/* Merge rather than replace. Restoring the same file twice changes nothing the
   second time, and restoring an old backup never removes newer entries.

   `options.ranges` says what to do about the target bands, and there is no
   default that can be applied quietly. Every band a reading is classified
   against is computed live from `custom-ranges` — the log's colours, the
   chart's shading, every tooltip — so writing the file's copy over the
   device's re-labels the entire history, including readings logged after the
   file was written, and keeping the device's copy silently discards a target
   the user may be restoring on purpose. Both directions change what the app
   says about the past, so when the two disagree the caller must have asked:
   "keep" leaves this device's targets alone, "file" takes the backup's.
   Anything else is refused before a single row is written. */
export async function restoreBackup(parsed, current, applySettings, options = {}) {
  const b = parsed.data;

  /* Read from storage rather than from `current`, which carries only the
     eight list keys the preview counts. */
  const deviceRanges = await loadKey("custom-ranges", null);
  const conflicts = rangeConflicts(b["custom-ranges"], deviceRanges);
  const choice = options.ranges;
  if (conflicts.length && choice !== "keep" && choice !== "file") {
    /* Refused up front, so a caller that has not been taught to ask fails
       loudly and completely instead of writing half a restore and rewriting
       the targets on its way past. */
    throw new Error(
      `This backup's target ranges differ from this device's for ${conflicts.map((c) => c.param).join(", ")}. `
      + `Restoring must say which to keep — pass options.ranges as "keep" or "file".`);
  }

  /* The same guard the inspector applies. The inspector was hardened against
     nulls and non-objects; this function, which does the actual writing, was
     not — so a file the preview cheerfully described as ready to import threw
     the moment the button was pressed. Four shapes did it, including a null in
     the EXISTING data rather than the incoming file, which no amount of
     inspecting the file would have caught.

     A preview that promises what the restore cannot deliver is worse than a
     refusal, because the refusal at least happens before anything is written. */
  const result = {};
  for (const key of Object.keys(NATURAL_KEYS)) {
    const incoming = usable(b[key]);
    if (!incoming.length) { result[key] = usable(current[key]); continue; }
    const { merged, kept } = planMerge(current[key], incoming, NATURAL_KEYS[key]);
    for (const row of kept) merged.push({ ...row, id: row.id || uid() });
    merged.sort((x, y) => ((x.date || "") < (y.date || "") ? 1 : -1));
    await saveKey(key, merged);
    result[key] = merged;
  }
  if (applySettings && b["tank-settings"]) {
    /* Same sanitisation as Setup.jsx:77's saveVolume: a backup file is not
       trusted input any more than the manual entry field is, so an invalid
       net volume is refused (null) rather than written through. */
    const volNum = parseFloat(b["tank-settings"].volumeL);
    const s = {
      ...DEFAULT_SETTINGS, ...b["tank-settings"],
      volumeL: volNum > 0 ? volNum : null,
    };
    await saveKey("tank-settings", s);
    result["tank-settings"] = s;
  }
  if (b["findings-dismissed"]) {
    await saveKey("findings-dismissed", b["findings-dismissed"]);
    result["findings-dismissed"] = b["findings-dismissed"];
  }
  if (b["kit-changes"]) {
    await saveKey("kit-changes", b["kit-changes"]);
    result["kit-changes"] = b["kit-changes"];
  }
  /* Only on an explicit "use the backup's targets". Every parameter the two
     agree on already holds the same band, so the file's copy IS the answer for
     the whole set — there is nothing to merge, only a side to take. */
  if (choice === "file" && conflicts.length) {
    const next = isRange(b["custom-ranges"]) ? b["custom-ranges"] : {};
    await saveKey("custom-ranges", next);
    result["custom-ranges"] = next;
  }

  /* An in-progress correction is merged per parameter rather than replaced
     wholesale, which is the promise the lists above already make and the one
     the restore panel makes to the user: a restore adds what is missing and
     leaves what you have alone. The plan on this device wins a collision,
     because it describes the dose going into the tank right now, whereas the
     plan in a file describes what was running when the file was written.

     The current plans are read from storage rather than from `current`, which
     carries only the eight list keys the preview counts.

     Absence is the migration case, and it has three shapes: a file written
     before this key was collected has no member at all, a file from a device
     with no correction running carries an explicit null, and a corrupted one
     could carry anything. None of them may be read as "cancel the correction
     that is running here" — the only safe reading of a file that says nothing
     about corrections is that it says nothing. */
  const asPlans = (v) => (v && typeof v === "object" && !Array.isArray(v) ? v : {});
  const currentPlans = asPlans(await loadKey("correction-plans", null));
  const mergedPlans = { ...asPlans(b["correction-plans"]), ...currentPlans };
  /* Written only when the file actually contributed a parameter, so restoring
     the same file twice is still a no-op the second time. */
  if (Object.keys(mergedPlans).length !== Object.keys(currentPlans).length) {
    await saveKey("correction-plans", mergedPlans);
  }
  result["correction-plans"] = mergedPlans;

  return result;
}

export function downloadJson(obj, filename) {
  const blob = new Blob([JSON.stringify(obj, null, 1)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/* Ask the browser not to evict this site's data. Apple doesn't document whether
   this overrides the seven-day rule, but it costs nothing to request and
   developers report it helping.

   Asked once per page load, and the answer is remembered. This used to be
   called only from Setup's mount effect, which meant two things: a user who
   never opened that tab never asked at all, and one who opened it repeatedly
   asked on every visit. The app now asks at launch (src/App.jsx) and Setup
   reads the same answer to explain it, so the request happens exactly once
   however many times either caller runs.

   The memo is deliberately per page load rather than persisted. A reload is
   the natural moment to re-ask — the user may have installed the app to the
   home screen since, which is precisely what flips the answer on the
   platforms where it matters. */
let persistenceAsked = null;

export async function requestPersistence() {
  if (!persistenceAsked) persistenceAsked = askForPersistence();
  return persistenceAsked;
}

async function askForPersistence() {
  try {
    if (!navigator.storage || !navigator.storage.persist) return { supported: false };
    const already = navigator.storage.persisted ? await navigator.storage.persisted() : false;
    if (already) return { supported: true, granted: true };
    const granted = await navigator.storage.persist();
    return { supported: true, granted };
  } catch {
    return { supported: false };
  }
}

export function downloadCsv(csv, filename) {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}




export function ParamGauge({ def, value, recent, compact = false }) {
  const status = paramStatus(def, value);
  const color = STATUS_COLOR[status];
  const has = value != null && !isNaN(value);

  /* The scale must contain the band, the current value and the recent range,
     with a little air so a marker at the extreme isn't clipped. */
  const pts = [def.min, def.max];
  if (has) pts.push(value);
  if (recent && recent.lo != null) pts.push(recent.lo, recent.hi);
  const rawLo = Math.min(...pts), rawHi = Math.max(...pts);
  const span = rawHi - rawLo || Math.abs(rawHi) * 0.2 || 1;
  const lo = rawLo - span * 0.18, hi = rawHi + span * 0.18;
  const pos = (v) => Math.max(0, Math.min(100, ((v - lo) / (hi - lo)) * 100));

  const bandL = pos(def.min), bandR = pos(def.max);
  const valPos = has ? pos(value) : null;

  return (
    <div className="w-full">
      {/* The card draws its own value now, so the gauge does not repeat it. */}
      {!compact && (
        <div className="flex items-baseline justify-center gap-1 mb-2">
          <span className="font-black text-[26px] text-ink leading-none tabular-nums">
            {has ? fmtVal(def, value) : "\u2014"}
          </span>
          <span className="text-[11px] font-bold text-ink2">{def.unit}</span>
        </div>
      )}

      <div className="relative w-full" style={{ height: compact ? 16 : 22 }}>
        {/* Full scale */}
        <div className="absolute rounded-full" style={{ left: 0, right: 0, top: compact ? 6 : 9, height: compact ? 4 : 5, background: "#E9EFEE" }} />

        {/* Target band — the only region that should read as "good" */}
        <div className="absolute rounded-full"
          style={{ left: `${bandL}%`, width: `${Math.max(2, bandR - bandL)}%`,
                   top: compact ? 6 : 9, height: compact ? 4 : 5,
                   background: has && status === "ok" ? color + "55" : "#C8D6D4" }} />

        {/* Where the parameter has been recently, so spread is visible at a glance */}
        {recent && recent.lo != null && recent.hi > recent.lo && (
          <div className="absolute rounded-full"
            style={{ left: `${pos(recent.lo)}%`, width: `${Math.max(1.5, pos(recent.hi) - pos(recent.lo))}%`,
                     top: compact ? 4 : 6, height: compact ? 8 : 11, background: color + "22" }} />
        )}

        {/* Current reading */}
        {valPos != null && (
          <div className="absolute" style={{ left: `${valPos}%`, top: compact ? 1 : 2, transform: "translateX(-50%)" }}>
            <div className="rounded-full ring-2 ring-white shadow-sm"
              style={{ width: compact ? 9 : 11, height: compact ? 14 : 17, background: color }} />
          </div>
        )}
      </div>

      <div className="flex items-center justify-between mt-0.5">
        <span className="text-[9px] font-bold text-ink2 tabular-nums">{fmtVal(def, def.min)}</span>
        <span className="text-[9px] font-extrabold uppercase tracking-wide" style={{ color: has ? color : "#5F7575" }}>
          {has ? (status === "ok" ? "in band" : status === "low" ? "below band" : "above band") : "no data"}
        </span>
        <span className="text-[9px] font-bold text-ink2 tabular-nums">{fmtVal(def, def.max)}</span>
      </div>
    </div>
  );
}


export function StatusPill({ status }) {
  const map = {
    ok: { label: "In range", cls: "bg-teal-50 text-teal-800 border-teal-200" },
    low: { label: "Low", cls: "bg-amber-50 text-amber-800 border-amber-300" },
    high: { label: "High", cls: "bg-rose-50 text-rose-800 border-rose-300" },
    unknown: { label: "No data", cls: "bg-slate-100 text-slate-600 border-slate-200" },
  };
  const m = map[status];
  return <span className={`text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full border ${m.cls}`}>{m.label}</span>;
}


/* What moved a task off its normal rhythm. "Pinned" on its own left you unable
   to tell an app-scheduled check from a date you chose yourself. */
export function pinReasonLabel(reason) {
  return reason === "dose" ? "to check the new dose"
    : reason === "correction" ? "to check the correction"
    : reason === "skipped" ? "skipped once"
    : "moved by you";
}

export function ReminderRow({ rem, state, onComplete, onReschedule, completeLabel = "Mark done" }) {
  /* This row used to expand into its own editor — interval, start date, nudge
     buttons — which was a second, older way of changing a schedule than the
     sheet the calendar opens. The two drifted: the sheet could move a task with
     completion history, the inline editor's "starting from" silently could not.
     The row is now purely a display that opens the same sheet, so there is one
     way to change a schedule regardless of where you tapped it. */
  const off = !rem.enabled;
  const due = state ? state.daysOut : null;
  const tone = off ? "#5F7575"
    : due != null && due < 0 ? "#A2621B"
    : due === 0 ? "#0B7C86" : "#45605F";

  return (
    <div className="rounded-xl border border-app overflow-hidden">
      <div className="flex items-center gap-2 p-3">
        <button onClick={onReschedule} className="flex-1 min-w-0 text-left">
          <div className="text-[14px] font-black truncate" style={{ color: off ? "#5F7575" : "#08191D" }}>
            {rem.label}
          </div>
          <div className="text-[11px] font-bold" style={{ color: tone }}>
            {off ? "turned off"
              : `${intervalLabel(rem.intervalDays)}${state ? ` · ${due < 0 ? `${Math.abs(due)}d overdue` : due === 0 ? "due today" : `next ${fmtShort(state.due)}`}` : ""}`}
            {state && state.pinned ? ` · ${pinReasonLabel(state.pinReason)}` : ""}
          </div>
        </button>
        {!off && state && due <= 0 && (
          <button onClick={onComplete}
            className="shrink-0 rounded-lg px-2.5 py-1.5 text-[11px] font-extrabold text-white"
            style={{ background: "#0B7C86" }}>
            {completeLabel}
          </button>
        )}
        <button aria-label="Change schedule" onClick={onReschedule}
          className="shrink-0 p-2 -m-1 text-ink2">
          <Settings2 size={15} />
        </button>
      </div>
    </div>
  );
}

/* Escape closes an overlay. One modal of ten had this and the other nine did
   not, so a keyboard user could open a sheet and have no way out of it — every
   other route to closing was a click on a button or a backdrop.

   Written once as a hook rather than copied ten times, because the copy is how
   nine of them came to be missing it in the first place. Guarded on `active`
   so a modal that is rendered but hidden does not swallow the key from one
   that is actually open. */
export function useEscape(onClose, active = true) {
  useEffect(() => {
    if (!active || typeof onClose !== "function") return undefined;
    const onKey = (e) => {
      if (e.key === "Escape" || e.key === "Esc") {
        e.stopPropagation();
        onClose();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, active]);
}

export function ReminderSheet({ rem, state, onClose, onSetDue, onSetInterval, onComplete, onSkip,
  onToggleEnabled = null, onDelete = null }) {
  useEscape(onClose);
  const [date, setDate] = useState(state && state.due ? state.due : todayStr());
  const [every, setEvery] = useState(String(rem ? rem.intervalDays : 7));
  const [tab, setTab] = useState("when");
  if (!rem) return null;

  const daysOut = state ? state.daysOut : null;
  const late = daysOut != null && daysOut < 0;
  const tone = late ? "#A2621B" : daysOut === 0 ? "#0B7C86" : "#45605F";
  const quick = [
    { label: "Today", iso: todayStr() },
    { label: "Tomorrow", iso: addDays(todayStr(), 1) },
    { label: "In 3 days", iso: addDays(todayStr(), 3) },
    { label: "Next week", iso: addDays(todayStr(), 7) },
  ];
  const intervalNum = parseInt(every, 10);
  const intervalOk = isFinite(intervalNum) && intervalNum >= 1 && intervalNum <= 365;

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center"
      style={{ background: "rgba(8,25,29,0.5)" }} onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()}
        className="w-full sm:max-w-sm bg-white rounded-t-3xl sm:rounded-3xl overflow-hidden"
        style={{ boxShadow: "0 -8px 40px rgba(8,25,29,0.3)" }}>

        <div className="px-4 pt-4 pb-3" style={{ background: tone + "10" }}>
          <div className="text-[15px] font-black text-ink">{rem.label}</div>
          <div className="text-[12px] font-bold mt-0.5" style={{ color: tone }}>
            {!rem.enabled ? "Turned off — no reminders until you turn it back on"
              : state && state.pinned
              ? `Moved to ${fmtFriendly(state.due)} — ${pinReasonLabel(state.pinReason)}`
              : late ? `${Math.abs(daysOut)} day${Math.abs(daysOut) === 1 ? "" : "s"} overdue · was due ${fmtFriendly(state.due)}`
              : daysOut === 0 ? "Due today"
              : `Due ${fmtFriendly(state.due)}`}
          </div>
          <div className="text-[11px] font-semibold text-ink2 mt-0.5">
            {intervalLabel(rem.intervalDays)}
            {state && state.lastDone ? ` · last done ${fmtFriendly(state.lastDone)}` : " · never done"}
          </div>
        </div>

        <div className="flex border-b border-app">
          {[["when", "Reschedule"], ["how", "How often"]].map(([k, l]) => (
            <button key={k} onClick={() => setTab(k)}
              className="flex-1 py-2.5 text-[12px] font-extrabold"
              style={{ color: tab === k ? "#0B7C86" : "#5F7575",
                       borderBottom: tab === k ? "2px solid #0B7C86" : "2px solid transparent" }}>
              {l}
            </button>
          ))}
        </div>

        {tab === "when" ? (
          <div className="px-4 py-3">
            <div className="grid grid-cols-2 gap-2 mb-3">
              {quick.map((q) => (
                <Btn key={q.label} variant="ghost" onClick={() => onSetDue(rem.id, q.iso)}>
                  {q.label}
                </Btn>
              ))}
            </div>
            <Field label="Or pick a date">
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={inputCls} />
            </Field>
            <Btn className="w-full mt-2" onClick={() => onSetDue(rem.id, date)}>
              <span className="flex items-center justify-center gap-1.5"><Save size={13} /> Move to {fmtShort(date)}</span>
            </Btn>
            <p className="text-[11px] text-ink2 font-medium leading-relaxed mt-2">
              Moving a task changes only this occurrence. Once you complete it, the normal
              {" "}{intervalLabel(rem.intervalDays).toLowerCase()} rhythm picks up from the day you did it.
            </p>
            <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-app">
              <Btn variant="ghost" onClick={() => onSkip(rem.id)}>Skip this one</Btn>
              <Btn onClick={() => onComplete(rem.id)}>
                <span className="flex items-center justify-center gap-1.5"><Check size={13} /> Mark done</span>
              </Btn>
            </div>
          </div>
        ) : (
          <div className="px-4 py-3">
            <div className="grid grid-cols-4 gap-2 mb-3">
              {[1, 2, 3, 7, 14, 21, 30, 42].map((d) => (
                <button key={d} onClick={() => setEvery(String(d))}
                  className="rounded-lg py-2 text-[12px] font-extrabold"
                  style={{ background: intervalNum === d ? "#0B7C86" : "#F1F5F4",
                           color: intervalNum === d ? "#fff" : "#45605F" }}>
                  {d}d
                </button>
              ))}
            </div>
            <Field label="Or every N days">
              <input type="number" min="1" max="365" value={every}
                onChange={(e) => setEvery(e.target.value)} className={inputCls} />
            </Field>
            <Btn className="w-full mt-2" disabled={!intervalOk}
              onClick={() => onSetInterval(rem.id, intervalNum)}>
              <span className="flex items-center justify-center gap-1.5">
                <Save size={13} /> {intervalOk ? intervalLabel(intervalNum) : "Enter 1–365"}
              </span>
            </Btn>
            <p className="text-[11px] text-ink2 font-medium leading-relaxed mt-2">
              Changing how often also moves the next one, counted from when you last did it. Testing
              less often is not a failure — a settled tank genuinely needs fewer readings than one
              you are still working out.
            </p>
          </div>
        )}

        {(onToggleEnabled || onDelete) && (
          <div className="px-4 pb-3 pt-3 border-t border-app flex items-center gap-2">
            {onToggleEnabled && (
              <Btn variant="ghost" className="flex-1" onClick={() => onToggleEnabled(rem.id, !rem.enabled)}>
                {rem.enabled ? "Turn off" : "Turn back on"}
              </Btn>
            )}
            {onDelete && !rem.builtin && (
              <Btn variant="danger" className="flex-1" onClick={() => onDelete(rem.id)}>Delete</Btn>
            )}
          </div>
        )}

        <button onClick={onClose} className="w-full py-3 text-[12px] font-extrabold text-ink2 border-t border-app">
          Close
        </button>
      </div>
    </div>
  );
}

export function CompletionCalendar({ taskLog, reminders, waterChanges, onPickTask = null }) {
  const [monthOffset, setMonthOffset] = useState(0);
  const [picked, setPicked] = useState(null);

  const now = new Date();
  const cursor = new Date(now.getFullYear(), now.getMonth() + monthOffset, 1);
  const year = cursor.getFullYear(), month = cursor.getMonth();
  const monthLabel = cursor.toLocaleDateString("en-GB", { month: "long", year: "numeric" });

  const labelFor = (id) => {
    const r = (reminders || []).find((x) => x.id === id);
    return r ? r.label : id;
  };

  /* Completions grouped by day, with water-change volumes folded in so the
     detail can say "Water change · 10L" rather than just naming the task. */
  const byDay = useMemo(() => {
    const map = {};
    for (const l of taskLog || []) {
      if (!l.date) continue;
      (map[l.date] = map[l.date] || []).push({
        id: l.id, label: labelFor(l.taskId), taskId: l.taskId, auto: !!l.auto, done: true,
      });
    }
    for (const w of waterChanges || []) {
      const day = map[w.date];
      if (!day) continue;
      const row = day.find((x) => x.taskId === "waterchange");
      if (row) row.detail = `${w.litres}L`;
    }
    return map;
  }, [taskLog, waterChanges, reminders]);

  /* What's scheduled ahead, so the month reads as a plan and not only a record. */
  const dueByDay = useMemo(() => {
    const map = {};
    const today = todayStr();
    const horizon = `${year}-${String(month + 1).padStart(2, "0")}-28`;
    const until = addDays(horizon, 10);
    for (const r of reminders || []) {
      for (const d of projectOccurrences(r, taskLog, today, until)) {
        (map[d] = map[d] || []).push({ id: r.id + d, label: r.label, taskId: r.id, done: false });
      }
    }
    return map;
  }, [reminders, taskLog, year, month]);

  const first = new Date(year, month, 1);
  const startPad = (first.getDay() + 6) % 7;          // weeks start Monday
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < startPad; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) {
    const iso = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    cells.push({ d, iso, items: byDay[iso] || [], due: dueByDay[iso] || [] });
  }

  const today = todayStr();
  const monthTotal = cells.reduce((a, c) => a + (c ? c.items.length : 0), 0);

  return (
    <Card className="p-4 mb-8">
      <div className="flex items-center justify-between gap-2 mb-3">
        <button onClick={() => { setMonthOffset(monthOffset - 1); setPicked(null); }}
          className="p-2 -m-2 rounded-lg text-ink2 active:bg-app" aria-label="Previous month">
          <ChevronDown size={16} style={{ transform: "rotate(90deg)" }} />
        </button>
        <div className="text-center">
          <div className="text-[14px] font-black text-ink">{monthLabel}</div>
          <div className="text-[10px] font-bold text-ink2">
            {monthTotal} completed · {cells.reduce((a, c) => a + (c ? c.due.length : 0), 0)} scheduled
          </div>
        </div>
        <button onClick={() => { setMonthOffset(monthOffset + 1); setPicked(null); }}
          className="p-2 -m-2 rounded-lg text-ink2 active:bg-app disabled:opacity-25" aria-label="Next month">
          <ChevronDown size={16} style={{ transform: "rotate(-90deg)" }} />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-1">
        {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
          <div key={i} className="text-center text-[9px] font-extrabold uppercase text-ink2">{d}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {cells.map((c, i) => {
          if (!c) return <div key={`p${i}`} />;
          const n = c.items.length, m = c.due.length;
          const isToday = c.iso === today;
          const isPicked = picked === c.iso;
          const total = n + m;
          return (
            <button key={c.iso} onClick={() => setPicked(isPicked ? null : c.iso)}
              className="aspect-square rounded-lg flex flex-col items-center justify-center gap-0.5 border"
              style={{
                borderColor: isPicked ? "#0B7C86" : isToday ? "#0B7C86" : "transparent",
                background: isPicked ? "#0B7C8618" : n ? "#0B7C860C" : "transparent",
              }}>
              <span className="text-[11px] font-bold leading-none"
                style={{ color: total ? "#08191D" : "#9FB0AE" }}>{c.d}</span>
              {total > 0 && (total <= 3 ? (
                <span className="flex gap-0.5">
                  {/* Solid = done, hollow = scheduled. */}
                  {Array.from({ length: n }).map((_, k) => (
                    <span key={"d" + k} className="w-1 h-1 rounded-full" style={{ background: "#0B7C86" }} />
                  ))}
                  {Array.from({ length: m }).map((_, k) => (
                    <span key={"u" + k} className="w-1 h-1 rounded-full border" style={{ borderColor: "#0B7C8699" }} />
                  ))}
                </span>
              ) : (
                <span className="text-[8px] font-extrabold leading-none"
                  style={{ color: n ? "#0B7C86" : "#5F7575" }}>{total}</span>
              ))}
            </button>
          );
        })}
      </div>

      {picked && (
        <div className="mt-3 pt-3 border-t border-app">
          <div className="text-[11px] font-extrabold uppercase tracking-wide text-ink2 mb-1.5">
            {fmtFriendly(picked)}
          </div>
          {((byDay[picked] || []).length + (dueByDay[picked] || []).length) === 0 ? (
            <p className="text-[13px] text-ink2 font-medium">Nothing logged or scheduled that day.</p>
          ) : (
            <div className="space-y-1">
              {(byDay[picked] || []).map((it) => (
                <div key={it.id} className="flex items-center gap-2">
                  <Check size={13} style={{ color: "#0B7C86" }} className="shrink-0" />
                  <span className="text-[13px] font-bold text-ink">{it.label}</span>
                  {it.detail && <span className="text-[12px] font-bold text-ink2">· {it.detail}</span>}
                  {it.auto && <span className="text-[10px] font-bold text-ink2">· from a logged test</span>}
                </div>
              ))}
              {/* Scheduled items are tappable: seeing a task on a day you
                  cannot make it is exactly the moment you want to move it, and
                  previously the calendar could only be read. */}
              {(dueByDay[picked] || []).map((it) => (
                <button key={it.id} onClick={() => onPickTask && onPickTask(it.taskId)}
                  disabled={!onPickTask}
                  className="w-full flex items-center gap-2 text-left rounded-lg px-1 py-1 -mx-1"
                  style={{ background: onPickTask ? "transparent" : undefined }}>
                  <span className="w-3 h-3 rounded-full border-2 shrink-0" style={{ borderColor: "#0B7C8699" }} />
                  <span className="text-[13px] font-bold text-ink2 flex-1">{it.label}</span>
                  {onPickTask
                    ? <span className="text-[10px] font-extrabold" style={{ color: "#0B7C86" }}>Reschedule</span>
                    : <span className="text-[10px] font-bold text-ink2">· scheduled</span>}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {!picked && (
        <div className="flex items-center gap-3 mt-3">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full" style={{ background: "#0B7C86" }} />
            <span className="text-[10px] font-bold text-ink2">done</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full border" style={{ borderColor: "#0B7C8699" }} />
            <span className="text-[10px] font-bold text-ink2">scheduled</span>
          </span>
          <span className="text-[10px] font-medium text-ink2">Tap a day for detail</span>
        </div>
      )}
    </Card>
  );
}


/* The calendar as an overlay, so it can be reached from the dashboard without
   losing your place. */
export function CalendarModal({ taskLog, reminders, waterChanges, onClose, onPickTask = null }) {
  useEscape(onClose);
  return (
    <div className="fixed inset-0 bg-[#08191D]/60 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={onClose}>
      <div className="bg-app w-full sm:max-w-lg max-h-[88vh] overflow-y-auto rounded-t-3xl sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
        style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}>
        <div className="sticky top-0 bg-app px-4 pt-4 pb-2 flex items-center justify-between gap-2 z-10">
          <div>
            <div className="text-[11px] uppercase tracking-[0.14em] text-teal-brand font-extrabold">Calendar</div>
            <h2 className="text-xl font-display text-ink">Done &amp; coming up</h2>
          </div>
          <button aria-label="Close" onClick={onClose}
            className="text-ink2 hover:text-ink p-2 -m-2 rounded-lg active:bg-white/60"><X size={20} /></button>
        </div>
        <div className="px-4 pb-4">
          <CompletionCalendar taskLog={taskLog} reminders={reminders} waterChanges={waterChanges}
            onPickTask={onPickTask} />
        </div>
      </div>
    </div>
  );
}
