import { useMemo, useState } from 'react'
import { Btn, Field, SectionTitle, inputCls } from './DoseExpectation.jsx'
import { Card } from './ErrorBoundary.jsx'
import { Check, Plus, X } from '../icons.jsx'
import { predictAfterChange } from '../lib/analytics/consumption.js'
import { fmtVal } from '../lib/analytics/time-in-range.js'
import { DEFAULT_SETTINGS } from '../lib/analytics/water-changes.js'
import { CompletionCalendar, ReminderRow, ReminderSheet } from '../lib/backup.jsx'
import { uid } from '../lib/constants.js'
import { todayStr } from '../lib/dates.js'
import { REMINDER_GROUPS, reminderState } from '../lib/reminders.js'

/* ---------------------------------- Tasks ---------------------------------- */

export function Tasks({ allTasks, taskLog, onAddCustom, onDeleteCustom, onMarkDone,
  onAddWaterChange, onSetReminderDue, onSetReminderInterval, onSkipReminder,
  onDeleteWaterChange, onUpdateReminder, onNudgeReminder, onAddReminder, onDeleteReminder,
  waterChanges = [], settings = DEFAULT_SETTINGS,
  latestByParam = {}, paramDefs = [], reminders = [], reminderView = null,
  onOpenTest = () => {} }) {
  const [newUnit, setNewUnit] = useState("days");
  const [newStart, setNewStart] = useState(todayStr());
  const [wcOpen, setWcOpen] = useState(false);
  const [wcLitres, setWcLitres] = useState(String(settings.waterChangeL ?? 10));
  const [wcResult, setWcResult] = useState(null);

  const preview = useMemo(() => {
    const L = parseFloat(wcLitres);
    /* What a change dilutes is a fraction of the tank, so with no net volume
       there is no fraction to quote. */
    if (!L || L <= 0 || !(settings.volumeL > 0)) return null;
    return predictAfterChange(latestByParam, paramDefs, settings.volumeL, L);
  }, [wcLitres, latestByParam, paramDefs, settings.volumeL]);

  const confirmWaterChange = async () => {
    const L = parseFloat(wcLitres);
    if (!L || L <= 0) return;
    await onAddWaterChange({ date: todayStr(), litres: L, note: "" });
    await onMarkDone("waterchange", todayStr());
    setWcResult(settings.volumeL > 0
      ? predictAfterChange(latestByParam, paramDefs, settings.volumeL, L) : null);
    setWcOpen(false);
  };

  const [label, setLabel] = useState("");
  const [freq, setFreq] = useState(14);

  const submit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    const name = label.trim();
    if (!name) return;
    /* Custom entries are reminders like any other, so they get the same
       scheduling, snoozing and calendar history. */
    const n = Math.max(1, parseInt(freq, 10) || 7);
    await onAddReminder({
      id: uid(), label: name, paramKey: null, kind: "task",
      intervalDays: newUnit === "weeks" ? n * 7 : n,
      startDate: newStart || todayStr(), enabled: true, builtin: false,
    });
    setLabel(""); setFreq(14); setNewUnit("days"); setNewStart(todayStr());
  };

  /* One sheet, shared by the calendar below and the reminder list above, so a
     task can be moved from wherever you happen to be looking at it. */
  const [sheetId, setSheetId] = useState(null);
  const sheetRem = sheetId ? (reminders || []).find((r) => r.id === sheetId) : null;
  const sheetState = sheetRem ? reminderState(sheetRem, taskLog, todayStr()) : null;
  const closeSheet = () => setSheetId(null);
  const onPickTask = (id) => setSheetId(id);

  return (
    <div>
      <SectionTitle eyebrow="Schedule" title="Reminders" />

      {/* Result of the change just logged */}
      {wcResult && (
        <Card className="p-4 mb-4" style={{ borderColor: "#0B7C8666" }}>
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="text-[11px] font-extrabold uppercase tracking-wide text-teal-brand">
              Water change logged
            </div>
            <button aria-label="Dismiss" onClick={() => setWcResult(null)} className="text-ink2 p-2 -m-2 rounded-lg active:bg-app"><X size={16} /></button>
          </div>
          <p className="text-[13px] text-ink font-medium leading-relaxed mb-2">
            That replaced {wcResult.pct.toFixed(1)}% of your water. Here's roughly where your levels should sit now — worth testing to confirm rather than taking these as read.
          </p>
          <div className="space-y-1.5">
            {wcResult.rows.map(({ def, before, after, delta }) => (
              <div key={def.key} className="flex items-center justify-between gap-2 p-2 rounded-lg bg-app">
                <span className="text-[13px] font-black text-ink min-w-0 truncate">{def.label}</span>
                <span className="text-[12px] font-bold text-ink2 shrink-0">
                  {fmtVal(def, before)} → <span className="text-ink font-black">{fmtVal(def, after)}{def.unit}</span>
                  {Math.abs(delta) >= 0.005 && (
                    <span className="ml-1" style={{ color: delta > 0 ? "#A2621B" : "#1D6FA5" }}>
                      ({delta > 0 ? "+" : ""}{fmtVal(def, delta)})
                    </span>
                  )}
                </span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Water change volume prompt */}
      {wcOpen && (
        <Card className="p-4 mb-4">
          <div className="flex items-center justify-between gap-2 mb-3">
            <span className="text-[14px] font-black text-ink">How much did you change?</span>
            <button aria-label="Close" onClick={() => setWcOpen(false)} className="text-ink2 hover:text-ink p-2 -m-2 rounded-lg active:bg-app"><X size={20} /></button>
          </div>
          <Field label="Litres">
            <input type="number" inputMode="decimal" min="0" step="0.5" value={wcLitres}
              onChange={(e) => setWcLitres(e.target.value)} className={inputCls} />
          </Field>
          {wcPreview && (
            <p className="text-[12px] text-ink2 font-medium leading-relaxed mt-1 mb-2">
              {wcPreview.pct.toFixed(1)}% of your {settings.volumeL}L system.
            </p>
          )}
          <Btn className="w-full" onClick={logWaterChange}>
            <span className="flex items-center justify-center gap-1.5"><Check size={14} /> Log water change</span>
          </Btn>
        </Card>
      )}

      {/* One list, one set of controls. Tests and husbandry used to be separate
          sections with different capabilities, so the same concept behaved
          differently depending on where you found it. */}
      <Card className="p-4 mb-4">
        <p className="text-[13px] text-ink font-medium leading-relaxed mb-3">
          Everything here repeats on a schedule you set. Tap one to change how often it repeats,
          when it starts, or to nudge the next occurrence. Tests complete themselves when you log
          that reading; the rest you tick off.
        </p>

        {REMINDER_GROUPS.map((g) => {
          const list = reminders.filter((r) => g.kinds.includes(r.kind));
          if (!list.length) return null;
          return (
            <div key={g.id} className="mb-4 last:mb-0">
              <div className="text-[10px] font-extrabold uppercase tracking-wide text-ink2 mb-1.5">
                {g.label}
              </div>
              <div className="space-y-2">
                {list.map((r) => (
                  <ReminderRow key={r.id} rem={r}
                    state={reminderView && reminderView.states.find((x) => x.rem.id === r.id)}
                    onReschedule={() => onPickTask(r.id)}
                    onComplete={r.kind === "water" ? () => setWcOpen(true)
                      : r.kind === "test" && r.paramKey ? () => onOpenTest(r.paramKey)
                      : () => onMarkDone(r.id)}
                    completeLabel={r.kind === "water" ? "Log change" : r.kind === "test" ? "Log test" : "Mark done"} />
                ))}
              </div>
            </div>
          );
        })}
      </Card>

      {/* The add form uses the same fields as editing, so what you fill in
          matches what you'll see afterwards. */}
      <Card className="p-4 mb-8">
        <div className="text-[10px] font-extrabold uppercase tracking-wide text-ink2 mb-2">Add a reminder</div>
        <Field label="Name">
          <input type="text" value={label} onChange={(e) => setLabel(e.target.value)}
            className={inputCls} placeholder="e.g. Clean filter sock" />
        </Field>
        <div className="grid grid-cols-2 gap-2 mt-2">
          <Field label="Repeat every">
            <div className="flex gap-1.5">
              <input type="number" inputMode="decimal" min="1" value={freq} onChange={(e) => setFreq(e.target.value)} className={inputCls} />
              <select className={inputCls} value={newUnit} onChange={(e) => setNewUnit(e.target.value)}>
                <option value="days">days</option>
                <option value="weeks">weeks</option>
              </select>
            </div>
          </Field>
          <Field label="Starting from">
            <input type="date" value={newStart} onChange={(e) => setNewStart(e.target.value)} className={inputCls} />
          </Field>
        </div>
        <Btn onClick={submit} className="w-full mt-3">
          <span className="flex items-center justify-center gap-1.5"><Plus size={14} /> Add reminder</span>
        </Btn>
      </Card>

      {/* The calendar replaces a list of recent water changes: it shows every
          completed task, not one kind, and gives the month at a glance. */}
      <SectionTitle eyebrow="History" title="Done & coming up" />
      <CompletionCalendar taskLog={taskLog} reminders={reminders} waterChanges={waterChanges}
        onPickTask={onPickTask} />

      {sheetRem && (
        <ReminderSheet rem={sheetRem} state={sheetState} onClose={closeSheet}
          onSetDue={(id, d) => { onSetReminderDue(id, d); closeSheet(); }}
          onSetInterval={(id, n) => { onSetReminderInterval(id, n); closeSheet(); }}
          onComplete={(id) => { onMarkDone(id); closeSheet(); }}
          onSkip={(id) => { onSkipReminder(id); closeSheet(); }}
          onToggleEnabled={(id, on) => { onUpdateReminder(id, { enabled: on }); closeSheet(); }}
          onDelete={(id) => { onDeleteReminder(id); closeSheet(); }} />
      )}

    </div>
  );
}
