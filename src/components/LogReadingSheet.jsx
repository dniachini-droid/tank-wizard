import { useState } from 'react'
import { Btn, Field, inputCls } from './DoseExpectation.jsx'
import { ChevronDown, ChevronUp, Plus } from '../icons.jsx'
import { nowTime } from '../lib/analytics/time-of-day.js'
import { todayStr } from '../lib/dates.js'

/* --- Log a reading from the parameter view ---
 *
 * You often want to record a test at the moment you're looking at the trend for
 * that parameter, rather than going back to the Testing tab and re-selecting it.
 * Kept to the two fields that matter — value and date — and collapsed by
 * default so it never competes with the chart for attention.
 */
export function QuickLog({ def, onAdd, settings, reminders = [] }) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");
  const [date, setDate] = useState(todayStr());
  const [time, setTime] = useState(nowTime());

  const linked = reminders.find((r) => r.enabled !== false && r.kind === "test" && r.paramKey === def.key);

  const submit = async () => {
    if (value === "") return;
    await onAdd({ param: def.key, value: parseFloat(value), date, time, note: "" });
    setValue("");
    setDate(todayStr()); setTime(nowTime());
  };

  return (
    <div className="rounded-xl border border-app overflow-hidden mb-4">
      <button onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-2 px-3 py-2.5 text-left active:bg-app">
        <span className="flex items-center gap-1.5">
          <Plus size={13} style={{ color: def.color }} />
          <span className="text-[12px] font-extrabold" style={{ color: def.color }}>
            Log a {def.label.toLowerCase()} reading
          </span>
        </span>
        {open ? <ChevronUp size={14} className="text-ink2" /> : <ChevronDown size={14} className="text-ink2" />}
      </button>

      {open && (
        <div className="px-3 pb-3 pt-1 border-t border-app">
          {/* Stacked rather than squeezed into columns: a date and a time
              control need most of a phone's width between them. */}
          <Field label={`Value (${def.unit || ""})`}>
            <input type="number" inputMode="decimal" step={def.step} value={value}
              onChange={(e) => setValue(e.target.value)} className={inputCls}
              placeholder={String(def.min)} />
          </Field>
          <div className="grid grid-cols-2 gap-2 mt-2">
            <Field label="Date">
              {/* Backdating matters: readings are often written down first and
                  entered later, and the hour is part of the reading. */}
              <input type="date" value={date} max={todayStr()}
                onChange={(e) => setDate(e.target.value)} className={inputCls} />
            </Field>
            <Field label="Time">
              <input type="time" value={time}
                onChange={(e) => setTime(e.target.value)} className={inputCls} />
            </Field>
          </div>
          <Btn onClick={submit} className="w-full mt-3">
            <span className="flex items-center justify-center gap-1.5"><Plus size={13} /> Save reading</span>
          </Btn>
        </div>
      )}

    </div>
  );
}
