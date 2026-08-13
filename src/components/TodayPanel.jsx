import { useState } from 'react'
import { Btn } from './DoseExpectation.jsx'
import { Card } from './ErrorBoundary.jsx'
import { Bell, Check, ChevronDown, ChevronUp, ListChecks } from '../icons.jsx'
import { fmtVal } from '../lib/analytics/time-in-range.js'
import { fmtTime, nowTime, windowRows } from '../lib/analytics/time-of-day.js'
import { pinReasonLabel, useEscape } from '../lib/backup.jsx'
import { fmtShort, todayStr } from '../lib/dates.js'
import { joinList } from '../lib/narrative-engine.js'
import { intervalLabel } from '../lib/reminders.js'
import { computeStability } from '../lib/stability-engine.js'

/* --- What needs doing today ---
 * Sits directly under the tank assessment and shows only what is overdue or due
 * now. It disappears entirely when there's nothing to do, so its presence alone
 * means something needs attention.
 */
/* One row of the today panel. Test reminders take the reading inline: going to
   another tab to type one number was the most repeated friction in the app. */
export function TodayRow({ s: st, onOpenTest, onComplete, onNudge, onPickTask, def, onAddReading }) {
  const [value, setValue] = useState("");
  const isTest = st.rem.kind === "test" && st.rem.paramKey;
  const late = st.status === "overdue";
  const canLogHere = isTest && def && onAddReading;

  const save = async () => {
    const v = parseFloat(value);
    if (!isFinite(v)) return;
    await onAddReading({ param: def.key, value: v, date: todayStr(), time: nowTime(), note: "" });
    setValue("");
  };

  return (
    <div className="rounded-xl bg-white border border-app p-2.5">
      <div className="flex items-center justify-between gap-2">
        <button className="min-w-0 text-left flex-1"
          onClick={() => (isTest ? onOpenTest(st.rem.paramKey) : onComplete(st.rem.id))}>
          <div className="text-[14px] font-black text-ink truncate">{st.rem.label}</div>
          <div className="text-[11px] font-bold"
            style={{ color: late ? "#A2621B" : st.daysOut === 0 ? "#0B7C86" : "#45605F" }}>
            {late ? `${Math.abs(st.daysOut)} day${Math.abs(st.daysOut) === 1 ? "" : "s"} overdue`
              : st.daysOut === 0 ? "due today"
              : `in ${st.daysOut} day${st.daysOut === 1 ? "" : "s"} · ${fmtShort(st.due)}`}
            {/* A test pinned by the dosing protocol says so, since it sits off
                the usual rhythm for a reason. */}
            {st.pinned
                          ? ` · ${pinReasonLabel(st.pinReason)}${st.dueTime && fmtTime(st.dueTime) ? `, around ${fmtTime(st.dueTime)}` : ""}`
                          : ` · ${intervalLabel(st.rem.intervalDays)}`}
                      </div>
        </button>

        {canLogHere ? (
          <div className="flex items-center gap-1.5 shrink-0">
            <input type="number" inputMode="decimal" step={def.step} value={value}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") save(); }}
              placeholder={def.unit}
              className="w-16 rounded-lg border border-app bg-white px-2 py-1.5 text-[13px] font-bold text-ink text-right" />
            <button onClick={save} disabled={value === ""}
              className="rounded-lg px-3 py-2 text-[12px] font-extrabold transition-colors"
              style={{ background: value === "" ? "#EDF3F2" : "#0B7C86", color: value === "" ? "#9FB0AE" : "#fff" }}>
              Log
            </button>
          </div>
        ) : (
          <button onClick={() => onComplete(st.rem.id)}
            className="shrink-0 rounded-lg px-3 py-2 text-[12px] font-extrabold text-white"
            style={{ background: "#0B7C86" }}>
            Done
          </button>
        )}
      </div>

      <div className="flex items-center gap-1.5 mt-2 flex-wrap">
          <NudgeButton onClick={() => onNudge(st.rem.id, 1 - Math.min(0, st.daysOut))} label="Snooze until tomorrow" />
          {onPickTask && <NudgeButton onClick={() => onPickTask(st.rem.id)} label="Change schedule…" />}
          {canLogHere && (
            <button onClick={() => onOpenTest(st.rem.paramKey)}
              className="rounded-lg border border-app px-2 py-1 text-[10px] font-extrabold text-ink2 active:bg-app">
              Open in Test Lab
            </button>
          )}
      </div>
    </div>
  );
}

export function TodayPanel({ view, onOpenTest, onComplete, onNudge, onPickTask, paramDefs = [], onAddReading = null }) {
  /* Collapsed to one line by default so it never crowds the dashboard, but
     always present: hiding it entirely when nothing was due made it look like
     the reminders had disappeared. When you're clear it shows what's next
     instead of vanishing. */
  const [open, setOpen] = useState(false);
  if (!view) return null;

  const actionable = view.actionable;
  const soon = view.upcoming.slice(0, 4);
  const rows = actionable.length ? actionable : soon;
  if (!rows.length) return null;

  const overdue = view.overdue.length;
  const clear = actionable.length === 0;
  const tone = overdue ? "#A2621B" : clear ? "#45605F" : "#0B7C86";

  const headline = overdue
    ? `${overdue} overdue`
    : actionable.length
    ? `${actionable.length} due today`
    : "Nothing due today";

  const preview = clear
    ? (soon[0] ? `next ${soon[0].rem.label.replace(/^Test /, "")} in ${soon[0].daysOut}d` : "")
    : rows.slice(0, 2).map((s) => s.rem.label.replace(/^Test /, "")).join(", ") +
      (rows.length > 2 ? ` +${rows.length - 2}` : "");

  return (
    <div className="rounded-2xl border-2 mb-4"
      style={{ borderColor: overdue ? "#D9832555" : clear ? "#E3ECEA" : "#0B7C8640",
               background: overdue ? "#A2621B10" : clear ? "#fff" : "#0B7C860A" }}>
      <button onClick={() => setOpen((v) => !v)} className="w-full flex items-center gap-2 p-4 text-left">
        <Bell size={15} style={{ color: tone }} className="shrink-0" />
        <span className="text-[11px] font-extrabold uppercase tracking-[0.13em] shrink-0" style={{ color: tone }}>
          {headline}
        </span>
        <span className="text-[11px] font-bold text-ink2 truncate flex-1 min-w-0 text-right">{preview}</span>
        {open ? <ChevronUp size={15} style={{ color: tone }} className="shrink-0" />
              : <ChevronDown size={15} style={{ color: tone }} className="shrink-0" />}
      </button>

      {open && (
        <div className="px-4 pb-4">
          <div className="space-y-2">
            {rows.map((st) => (
              <TodayRow key={st.rem.id} s={st} onOpenTest={onOpenTest} onComplete={onComplete}
                onNudge={onNudge} onPickTask={onPickTask} onAddReading={onAddReading}
                def={paramDefs.find((d) => d.key === st.rem.paramKey)} />
            ))}
          </div>
          <p className="text-[10px] text-ink2 font-medium mt-2.5 leading-relaxed">
            {clear
              ? "Nothing needs doing right now — these are what's coming. Type a reading straight in when you test."
              : "Type the reading in and it saves, completes the reminder, and schedules the next one from today."}
          </p>
        </div>
      )}
    </div>
  );
}

export function NudgeButton({ onClick, label }) {
  return (
    <button onClick={onClick}
      className="rounded-lg border border-app px-2 py-1 text-[10px] font-extrabold text-ink2 active:bg-app">
      {label}
    </button>
  );
}

/* The fuller picture: what's coming, and what's recently been done. The window
   is adjustable because a two-day alkalinity rhythm and a six-week ICP cycle
   want very different horizons. */
export function RemindersPanel({ view, windowDays, setWindowDays, onOpenTest, onComplete, onNudge, onPickTask, onOpenCalendar = null }) {
  if (!view) return null;
  const Row = ({ s, tone, right }) => (
    <div className="flex items-center justify-between gap-2 py-2 border-t border-app first:border-0">
      <div className="min-w-0">
        <div className="text-[13px] font-black text-ink truncate">{s.rem.label}</div>
        <div className="text-[10px] font-bold text-ink2">{intervalLabel(s.rem.intervalDays)}</div>
      </div>
      <div className="text-right shrink-0">{right}</div>
    </div>
  );
  return (
    <Card className="p-4 mb-6">
      <div className="flex items-center justify-between gap-2 mb-3">
        {onOpenCalendar ? (
          <button onClick={onOpenCalendar}
            className="flex items-center gap-1.5 rounded-lg border-2 px-2.5 py-1 text-[11px] font-extrabold"
            style={{ borderColor: "#E3ECEA", color: "#45605F" }}>
            <ListChecks size={13} /> Calendar
          </button>
        ) : <span />}
        <div className="flex gap-1">
          {[7, 14, 30].map((d) => (
            <button key={d} onClick={() => setWindowDays(d)}
              className="rounded-lg px-2 py-1 text-[11px] font-extrabold border-2"
              style={{ borderColor: windowDays === d ? "#0B7C86" : "#E3ECEA",
                       color: windowDays === d ? "#0B7C86" : "#45605F" }}>
              {d}d
            </button>
          ))}
        </div>
      </div>

      {view.actionable.length > 0 && (
        <div className="mb-3">
          <div className="text-[10px] font-extrabold uppercase tracking-wide text-ink2 mb-1">Needs doing</div>
          {view.actionable.map((s) => (
            <div key={s.rem.id} className="py-2.5 border-t border-app first:border-0">
              <div className="flex items-center justify-between gap-2">
                <button className="min-w-0 text-left flex-1"
                  onClick={() => (s.rem.kind === "test" && s.rem.paramKey ? onOpenTest(s.rem.paramKey) : onComplete(s.rem.id))}>
                  <div className="text-[13px] font-black text-ink truncate">{s.rem.label}</div>
                  <div className="text-[10px] font-bold" style={{ color: s.status === "overdue" ? "#A2621B" : "#0B7C86" }}>
                    {s.status === "overdue" ? `${Math.abs(s.daysOut)} day${Math.abs(s.daysOut) === 1 ? "" : "s"} overdue` : "due today"}
                  </div>
                </button>
                <button onClick={() => (s.rem.kind === "test" && s.rem.paramKey ? onOpenTest(s.rem.paramKey) : onComplete(s.rem.id))}
                  className="shrink-0 rounded-lg px-3.5 py-2 text-[12px] font-extrabold text-white" style={{ background: "#0B7C86" }}>
                  {s.rem.kind === "test" && s.rem.paramKey ? "Log" : "Done"}
                </button>
              </div>
              {/* Snooze stays as a one-tap shortcut; anything more than that
                  opens the same sheet the calendar uses, so there is one way to
                  change a schedule however you got here. */}
              <div className="mt-1.5 flex items-center gap-1.5">
                <NudgeButton onClick={() => onNudge(s.rem.id, 1 - Math.min(0, s.daysOut))} label="Snooze until tomorrow" />
                {onPickTask && <NudgeButton onClick={() => onPickTask(s.rem.id)} label="Change schedule…" />}
              </div>
            </div>
          ))}
        </div>
      )}

      {view.upcoming.length > 0 && (
        <div className="mb-3">
          <div className="text-[10px] font-extrabold uppercase tracking-wide text-ink2 mb-1">Coming up</div>
          {view.upcoming.map((s) => (
            <div key={s.rem.id} className="py-2 border-t border-app first:border-0">
              <div className="flex items-center justify-between gap-2">
                <button className="min-w-0 text-left flex-1"
                  onClick={() => (s.rem.kind === "test" && s.rem.paramKey ? onOpenTest(s.rem.paramKey) : onComplete(s.rem.id))}>
                  <div className="text-[13px] font-black text-ink truncate">{s.rem.label}</div>
                  <div className="text-[10px] font-bold text-ink2">
                    in {s.daysOut} day{s.daysOut === 1 ? "" : "s"} · {fmtShort(s.due)} · {intervalLabel(s.rem.intervalDays)}
                  </div>
                </button>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button onClick={() => (s.rem.kind === "test" && s.rem.paramKey ? onOpenTest(s.rem.paramKey) : onComplete(s.rem.id))}
                    className="rounded-lg border-2 px-3 py-1.5 text-[11px] font-extrabold"
                    style={{ borderColor: "#0B7C8640", color: "#0B7C86" }}>
                    {s.rem.kind === "test" && s.rem.paramKey ? "Log" : "Done"}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {view.recent.length > 0 && (
        <div>
          <div className="text-[10px] font-extrabold uppercase tracking-wide text-ink2 mb-1">Recently done</div>
          {view.recent.map((s) => (
            <Row key={s.rem.id} s={s} right={
              <>
                <div className="text-[12px] font-black flex items-center gap-1 justify-end" style={{ color: "#0B7C86" }}>
                  <Check size={12} /> {s.doneToday ? "today" : fmtShort(s.lastDone)}
                </div>
                <div className="text-[10px] font-bold text-ink2">next {fmtShort(s.due)}</div>
              </>
            } />
          ))}
        </div>
      )}

      {view.actionable.length === 0 && view.upcoming.length === 0 && view.recent.length === 0 && (
        <p className="text-[13px] text-ink2 font-medium">Nothing due in the next {windowDays} days.</p>
      )}

      {/* Say what sits beyond the window. Without this the selector looks
          broken whenever everything happens to be due at once — there is no
          visible difference between "nothing further out" and "not shown". */}
      <p className="text-[11px] text-ink2 font-medium mt-2.5 pt-2.5 border-t border-app leading-relaxed">
        Showing what's due and what was done within {windowDays} days.
        {view.later.length > 0
          ? ` ${view.later.length} further ${view.later.length === 1 ? "reminder falls" : "reminders fall"} beyond that — next is ${view.later[0].rem.label.toLowerCase()} on ${fmtShort(view.later[0].due)}.`
          : " Nothing falls outside it."}
      </p>
    </Card>
  );
}


/* ===========================================================================
   StabilityStrip — the picture that replaced forty words
   ===========================================================================
   The old summary described a shape in prose: "the last nine readings covered
   a 0.7 dKH spread and is climbing steadily, so it's passing through your
   target band rather than settling in it". This draws it.

   The target band is the lit segment. The observed spread of recent readings
   is the darker bar. Today is the dot. Where the bar sits inside the band the
   tank is settled; where it overhangs either end, the parameter is travelling
   through — which is the distinction the paragraph needed a whole sentence to
   make and the eye makes instantly.
   ========================================================================= */
export function StabilityStrip({ def, readings }) {
  const rows = (readings || []).filter((r) => r.param === def.key);
  if (rows.length < 2) return null;
  const stab = computeStability(def, readings);
  if (!stab || stab.p05 == null || stab.p95 == null) return null;

  /* The axis spans the band plus a margin, widened if the readings run past
     it, so an excursion is visible rather than clipped at the edge. */
  const bandW = (def.max - def.min) || 1;
  const lo = Math.min(def.min - bandW * 0.35, stab.p05 - bandW * 0.08);
  const hi = Math.max(def.max + bandW * 0.35, stab.p95 + bandW * 0.08);
  /* Clamped: an excursion beyond the drawn axis used to place the marker and
     its travel line outside the rail entirely. */
  const at = (v) => Math.max(0, Math.min(100, ((v - lo) / ((hi - lo) || 1)) * 100));

  const now = rows[rows.length - 1].value;
  const outside = stab.p05 < def.min || stab.p95 > def.max;

  /* The oldest reading in the same window the stability engine graded, so the
     two can never tell different stories. */
  const windowRows = rows.slice(-Math.max(2, stab.readingCount || 2));
  const then = windowRows[0].value;
  const travelled = Math.abs(now - then) >= (def.step || 0.01);

  return (
    <div className="strip" role="img"
      aria-label={`${def.label}: recent readings span ${fmtVal(def, stab.p05)} to ${fmtVal(def, stab.p95)}${def.unit}, target ${fmtVal(def, def.min)} to ${fmtVal(def, def.max)}${def.unit}`}>
      <div className="strip-rail">
        <div className="strip-band"
          style={{ left: `${at(def.min)}%`, width: `${at(def.max) - at(def.min)}%`,
                   background: def.color, opacity: 0.16 }} />
        <div className="strip-span"
          style={{ left: `${at(stab.p05)}%`, width: `${Math.max(1.5, at(stab.p95) - at(stab.p05))}%`,
                   background: outside ? "#A2621B" : def.color }} />
        {travelled && (
          <>
            <div className="strip-travel"
              style={{ left: `${Math.min(at(then), at(now))}%`,
                       width: `${Math.abs(at(now) - at(then))}%` }} />
            <div className="strip-then" style={{ left: `${at(then)}%` }}
              title={`${stab.readingCount} readings ago: ${fmtVal(def, then)}${def.unit}`} />
          </>
        )}
        <div className="strip-now" style={{ left: `${at(now)}%` }}
          title={`now: ${fmtVal(def, now)}${def.unit}`} />
      </div>
      <div className="strip-scale">
        <span>{fmtVal(def, def.min)}</span>
        <span className="strip-scale-mid">
          {travelled
            ? `${fmtVal(def, then)} \u2192 ${fmtVal(def, now)}${def.unit}`
            : "target"}
        </span>
        <span>{fmtVal(def, def.max)}</span>
      </div>
    </div>
  );
}

/* ===========================================================================
   Briefing — the summary, as a feed of claims
   ========================================================================= */

/* ===========================================================================
   ScoreBreakdown — the score, shown working
   ========================================================================= */
export function ScoreBreakdown({ ex, onOpenParam }) {
  if (!ex) return null;
  return (
    <div className="sb">
      {ex.capped && (
        <p className="sb-capped">
          Overridden: a detectable ammonia reading caps the score regardless of
          everything else below.
        </p>
      )}

      {/* A parameter outside what the hobby treats as workable holds the score
          down too. Computed but never shown, the arithmetic below simply did
          not add up to the number on the card — which is the one thing this
          panel exists to prevent. */}
      {!ex.capped && ex.safetyCap != null && ex.safetyCap < ex.blended && (
        <p className="sb-capped">
          Held at {ex.safetyCap}: {ex.safetyLabel} is outside the range corals
          tolerate, which caps the score whatever else reads well.
        </p>
      )}

      <div className="sb-rows">
        {ex.parts.map((p) => (
          <button key={p.key} className="sb-row" onClick={() => onOpenParam(p.key)}>
            <span className="sb-name">{p.label}</span>
            <span className="sb-bars">
              {/* Two bars, because the single number hid which of the two was
                  the problem — alkalinity moves, calcium sits in the wrong
                  place, and those need opposite responses. */}
              <span className="sb-bar" title={`Position in range: ${p.range}`}>
                <span className="sb-fill sb-range" style={{ width: `${p.range}%` }} />
              </span>
              <span className="sb-bar" title={`Steadiness: ${p.stability}`}>
                <span className="sb-fill sb-stab" style={{ width: `${p.stability}%` }} />
              </span>
            </span>
            <span className={`sb-sub ${p.sub < 70 ? "sb-low" : p.sub < 90 ? "sb-mid" : "sb-hi"}`}>{p.sub}</span>
          </button>
        ))}
      </div>

      <div className="sb-key">
        <span><i className="sb-swatch sb-range" /> position in range</span>
        <span><i className="sb-swatch sb-stab" /> steadiness</span>
      </div>

      <div className="sb-maths">
        <div className="sb-line">
          <span>Average of all {ex.parts.length}</span><span>{ex.mean}</span>
        </div>
        <div className="sb-line">
          <span>{ex.weakest.length ? `Weakest link · ${joinList(ex.weakest)}` : "Weakest link"}</span>
          <span>{ex.worst}</span>
        </div>
        <div className={`sb-line ${ex.evidenceCap != null && ex.evidenceCap < ex.blended ? "" : "sb-total"}`}>
          <span>60% average + 40% weakest</span><span>{ex.blended}</span>
        </div>
        {ex.evidenceCap != null && ex.evidenceCap < ex.blended && (
          <div className="sb-line sb-total">
            <span>Capped — only {ex.totalReadings} readings so far</span>
            <span>{ex.evidenceCap}</span>
          </div>
        )}
      </div>

      <p className="sb-note">
        The weakest link is weighted deliberately, so one badly-wrong parameter cannot
        hide behind six good ones. It also means fixing a single parameter moves the
        total only a little — the others still hold the weakest-link term down.
      </p>
    </div>
  );
}


/* ===========================================================================
   SnoozeSheet — shown the first time, and when it becomes a habit
   ===========================================================================
   Not shown on every snooze. Putting a suggestion off is cheap and reversible,
   and a dialog in front of a cheap reversible action is friction that teaches
   people to dismiss dialogs. It appears twice: the first time, so the promise
   is explicit, and again once the same suggestion has been put off three
   times, which is the point at which the target is more likely wrong than the
   advice.
   ========================================================================= */
export function SnoozeSheet({ claim, param, count, onConfirm, onCancel, onOpenTargets }) {
  useEscape(onCancel);
  const habit = count >= 2;
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-3"
      style={{ background: "#08191D66" }} onClick={onCancel}>
      <div className="bg-white rounded-2xl w-full max-w-sm p-5" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-base font-display text-ink mb-1">
          {habit ? "Put this off again?" : "Put this off for now?"}
        </h3>
        <p className="text-[13px] text-ink2 font-medium leading-relaxed mb-3">
          {claim}
        </p>

        <div className="rounded-xl p-3 mb-3" style={{ background: "#0B7C860D", border: "1px solid #0B7C8626" }}>
          <div className="text-[11px] font-extrabold uppercase tracking-wide mb-1" style={{ color: "#0B7C86" }}>
            It comes back
          </div>
          <p className="text-[12px] text-ink font-medium leading-relaxed">
            As soon as you log your next {param} reading — or sooner if the
            recommended amount changes materially. It is not switched off, just
            not asked again until there is something new to judge it on.
          </p>
        </div>

        {habit && (
          /* The honest alternative. Someone content at this level does not want
             a suppressed warning, they want a target that matches the tank they
             are actually keeping. */
          <div className="rounded-xl p-3 mb-3" style={{ background: "#A2621B0D", border: "1px solid #A2621B33" }}>
            <div className="text-[11px] font-extrabold uppercase tracking-wide mb-1" style={{ color: "#A2621B" }}>
              You have put this off {count} times
            </div>
            <p className="text-[12px] text-ink font-medium leading-relaxed mb-2">
              If you are content with {param} where it is, the target is the thing
              to change rather than the dose. A range you actually want beats a
              warning you always dismiss.
            </p>
            {onOpenTargets && (
              <Btn variant="ghost" className="w-full" onClick={onOpenTargets}>
                Change the {param} target
              </Btn>
            )}
          </div>
        )}

        <div className="flex gap-2">
          <Btn variant="ghost" className="flex-1" onClick={onCancel}>Keep showing</Btn>
          <Btn className="flex-1" onClick={onConfirm}>Not now</Btn>
        </div>
      </div>
    </div>
  );
}

export function Briefing({ claims, readings, paramDefs, onOpenParam, onGoTo, onDismiss,
  hiddenCount = 0, onRestoreAll, onRestoreOne, snoozeHint = false }) {
  const [openId, setOpenId] = useState(null);
  const [showHidden, setShowHidden] = useState(false);
  /* Not `!claims.length` — hiding every claim is exactly when the list of
     hidden ones has to stay reachable, and returning null there stranded
     them. */
  if (!claims) return null;
  const hiddenList = claims.hidden || [];
  if (!claims.length && !hiddenList.length) return null;

  const MARK = { act: "!", warn: "\u25B2", busy: "\u25CB", watch: "\u25CF", ok: "\u2713" };
  /* The same colours FindingList uses, so a note looks the same whether it is
     read here or on a parameter card. */
  const TONE_HEX = { act: "#C4285B", warn: "#A2621B", busy: "#1D6FA5", watch: "#0B7C86", ok: "#2A8050" };

  return (
    <div className="brief">
      {claims.map((c) => {
        const def = c.strip ? paramDefs.find((d) => d.key === c.strip.key) : null;
        const open = openId === c.id;
        return (
          <div key={c.id} className={`brief-item brief-${c.tone}`}
            style={{ background: TONE_HEX[c.tone] + "0D", borderColor: TONE_HEX[c.tone] + "33" }}>
            {/* A claim is a pointer, not a statement: tapping it goes to the
                place that can act on it — the dosing screen for a dose claim,
                the parameter's own history for anything else. */}
            <button className="brief-head"
              onClick={() => { if (c.goto) onGoTo(c.goto); else setOpenId(open ? null : c.id); }}
              aria-expanded={c.goto ? undefined : open}>
              <span className="brief-mark" aria-hidden="true">{MARK[c.tone] || "\u25CF"}</span>
              <span className="brief-claim">{c.claim}</span>
              {c.goto && <span className="brief-go" aria-hidden="true">{"\u203A"}</span>}
            </button>

            {/* Put away, not deleted: the key carries the numbers behind the
                claim, so a material change brings it straight back. */}
            {c.dismissible && onDismiss && (
              <div className="brief-actions">
                {/* Two different promises, so they get two different words.
                    "Hide" waits for the numbers to change; "Not now" waits for
                    the next test, which is when there is anything new to say
                    about a dose. */}
                <button className="brief-hide" onClick={() => onDismiss(c)}
                  aria-label={`${c.snoozeUntilTest ? "Not now" : "Hide"}: ${c.claim}`}>
                  {c.snoozeUntilTest ? "Not now" : "Hide"}
                </button>
                <span className="brief-hint">
                  {c.snoozeUntilTest
                    ? "back after your next test"
                    : "back if this changes"}
                </span>
              </div>
            )}

            <div className="brief-support">{c.support}</div>

            {c.facts && (
              <div className="brief-facts">
                {c.facts.map((f, i) => <span key={i}>{f}</span>)}
              </div>
            )}

            {def && <StabilityStrip def={def} readings={readings} />}

            {def && open && (
              <button className="brief-link" onClick={() => onOpenParam(def.key)}>
                Open {def.label.toLowerCase()} history
              </button>
            )}
          </div>
        );
      })}

      {snoozeHint && (
        <p className="brief-target-note">
          Putting the same suggestion off each time usually means the target is
          the thing to change, not the dose — targets live in Setup, and a range
          you actually want is better than a warning you always dismiss.
        </p>
      )}

      {hiddenList.length > 0 && (
        <div className="brief-hidden">
          <button className="brief-restore" onClick={() => setShowHidden((v) => !v)}
            aria-expanded={showHidden}>
            {showHidden ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            {hiddenList.length === 1 ? "1 hidden note" : `${hiddenList.length} hidden notes`}
          </button>

          {showHidden && (
            <div className="brief-hidden-list">
              {hiddenList.map((h) => (
                <div key={h.id} className="brief-hidden-row">
                  <span className="brief-hidden-mark" aria-hidden="true">{MARK[h.tone] || "\u25CF"}</span>
                  <span className="brief-hidden-claim">{h.claim}</span>
                  {onRestoreOne && (
                    <button className="brief-show-one" onClick={() => onRestoreOne(h)}>Show</button>
                  )}
                </div>
              ))}
              {onRestoreAll && hiddenList.length > 1 && (
                <button className="brief-restore-all" onClick={onRestoreAll}>Show all again</button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function OverviewCard({ overview, scoreEx, onOpenParam, claims = [], readings = [],
  paramDefs = [], onGoTo, onDismissNote, hiddenCount = 0, onRestoreNotes,
  onRestoreOneNote, snoozeHint = false }) {
  const [expanded, setExpanded] = useState(false);
  const [showMaths, setShowMaths] = useState(false);
  const s = overview.score;
  const scoreColor = s == null ? "#9FB0AE" : s >= 85 ? "#0B7C86" : s >= 70 ? "#2A8050" : s >= 50 ? "#A2621B" : "#C4285B";
  return (
    <div className="bg-white border-2 rounded-2xl p-5 mb-6 shadow-sm" style={{ borderColor: scoreColor + "40" }}>
      <div className="flex items-start gap-4">
        {s != null && (
          /* The score was the one figure in the app that could not be
             interrogated. Tapping it shows the arithmetic. */
          <button className="shrink-0 text-center"
            onClick={() => setShowMaths((v) => !v)}
            aria-label="Show how the score is calculated">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: scoreColor + "15", border: `2px solid ${scoreColor}` }}>
              <span className="text-2xl font-black" style={{ color: scoreColor }}>{s}</span>
            </div>
            <div className="text-[9px] font-extrabold uppercase tracking-wider mt-1 text-ink2">
              {showMaths ? "Health" : "How?"}
            </div>
          </button>
        )}
        <div className="flex-1 min-w-0">
          <div className="text-[11px] uppercase tracking-[0.14em] font-extrabold mb-1" style={{ color: scoreColor }}>
            Tank assessment
          </div>
          <h3 className="text-lg font-display text-ink leading-snug mb-2">{overview.headline}</h3>
          {/* Collapsed by default: the headline is the answer, and most days
              that is the whole visit. Everything behind it is one tap. */}
        </div>
      </div>

      {/* Outside the header row: the claims, the score working and the strips
          use the card's whole width rather than the column left over beside
          the score tile. */}
      <div>
          {/* Two independent things: how the score was reached, and what the tank
              is telling you. Tapping the score used to open both, so asking one
              question answered a different one as well. When both are open the
              working comes first, because it explains the number above it. */}
          {showMaths && (
            <>
              <button onClick={() => setShowMaths(false)}
                className="text-[11px] font-extrabold flex items-center gap-1 mb-2" style={{ color: scoreColor }}>
                <ChevronUp size={12} /> Hide the score working
              </button>
              <ScoreBreakdown ex={scoreEx} onOpenParam={onOpenParam} />
            </>
          )}

          {!expanded && claims.length > 0 && (
            <button onClick={() => setExpanded(true)}
              className="text-xs font-extrabold flex items-center gap-1 mt-1" style={{ color: scoreColor }}>
              <ChevronDown size={13} />
              {claims.length === 1 ? "1 thing to look at" : `${claims.length} things to look at`}
            </button>
          )}

          {expanded && (
            <>
              <Briefing claims={claims} readings={readings} paramDefs={paramDefs}
                onOpenParam={onOpenParam} onGoTo={onGoTo}
                onDismiss={onDismissNote} hiddenCount={hiddenCount}
                onRestoreAll={onRestoreNotes} onRestoreOne={onRestoreOneNote}
                snoozeHint={snoozeHint} />

              <button onClick={() => setExpanded(false)}
                className="mt-1 text-xs font-extrabold flex items-center gap-1" style={{ color: scoreColor }}>
                <ChevronUp size={13} /> Hide these
              </button>
            </>
          )}
      </div>

    </div>
  );
}
