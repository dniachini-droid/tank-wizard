import { useState } from 'react'
import { Btn, Field, inputCls } from './DoseExpectation.jsx'
import { Save } from '../icons.jsx'
import { fmtAmount } from '../lib/analytics/time-in-range.js'
import { nowTime } from '../lib/analytics/time-of-day.js'
import { todayStr } from '../lib/dates.js'

/* --- Recording a dose change ---
 *
 * The recommendation is a starting point, not a instruction: the amount is
 * editable, and so are the date and time. When the dose actually changed
 * matters as much as the amount — setting 10.3 mL at 9am and testing the next
 * morning gives the tank a full day, while setting it at 9pm gives it twelve
 * hours, and the engine measures from that moment.
 */
export function DoseChangeSheet({ def, element, current, recommended, suggested, plan, onCancel, onSave }) {
  const [ml, setMl] = useState(String(recommended != null ? recommended : current));
  const [date, setDate] = useState(todayStr());
  const [time, setTime] = useState(nowTime());
  const val = parseFloat(ml);
  const valid = isFinite(val) && val >= 0;
  const ref = suggested != null ? suggested : recommended;
  const differs = valid && ref != null && Math.abs(val - ref) > 0.05;

  return (
    <div className="rounded-xl border-2 p-3 mt-3" style={{ borderColor: "#0B7C8640", background: "#0B7C8608" }}>
      <div className="text-[12px] font-black text-ink mb-2">Record the new dose</div>

      <Field label={`Amount (mL/day)`}>
        <input type="number" inputMode="decimal" step="0.1" min="0" value={ml}
          onChange={(e) => setMl(e.target.value)} className={inputCls} autoFocus />
      </Field>

      <div className="grid grid-cols-2 gap-2 mt-2">
        <Field label="Changed on">
          {/* Backdatable: people often change the doser and record it later. */}
          <input type="date" value={date} max={todayStr()}
            onChange={(e) => setDate(e.target.value)} className={inputCls} />
        </Field>
        <Field label="At">
          <input type="time" value={time}
            onChange={(e) => setTime(e.target.value)} className={inputCls} />
        </Field>
      </div>

      {differs && (
        <p className="text-[11px] font-medium leading-relaxed mt-2" style={{ color: "#45605F" }}>
          That's {fmtAmount(Math.abs(val - ref))} mL {val > ref ? "more" : "less"} than
          suggested, which is fine — the app will work from what you actually set and tell you what to
          expect from it.
        </p>
      )}

      {plan && plan.length > 1 && (
        <p className="text-[11px] font-medium leading-relaxed mt-2" style={{ color: "#45605F" }}>
          This is the first of {plan.length} steps. The next is worked out from how the tank responds,
          so it may differ from {fmtAmount(plan[1])} mL once there are readings.
        </p>
      )}

      <div className="grid grid-cols-2 gap-2 mt-3">
        <Btn variant="ghost" onClick={onCancel}>Cancel</Btn>
        <Btn disabled={!valid} onClick={() => onSave(Math.round(val * 10) / 10, date, time)}>
          <span className="flex items-center justify-center gap-1.5"><Save size={13} /> Record</span>
        </Btn>
      </div>
    </div>
  );
}
