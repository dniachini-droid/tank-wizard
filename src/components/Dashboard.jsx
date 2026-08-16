import { useEffect, useMemo, useState } from 'react'
import { Btn, FindingList, ParamCard, SectionTitle, inputCls } from './DoseExpectation.jsx'
import { Card } from './ErrorBoundary.jsx'
import { QuickLog } from './LogReadingSheet.jsx'
import { OverviewCard, RemindersPanel, SnoozeSheet, TodayPanel } from './TodayPanel.jsx'
import { ZoomableLineChart } from './ZoomableChart.jsx'
import { AlertTriangle, ChevronDown, ChevronUp, RotateCcw, Save, Settings2, X } from '../icons.jsx'
import { CONSUMPTION_RULES, computeConsumption, computeElementConsumption } from '../lib/analytics/consumption.js'
import { DOSE_ADVICE_RULES, computeDoseAdvice } from '../lib/analytics/drift.js'
import { computeRates, rateNarrative } from '../lib/analytics/rate-analysis.js'
import { computeControl } from '../lib/analytics/reading-meaning.js'
import { fmtAmount, fmtVal } from '../lib/analytics/time-in-range.js'
import { byOldest, fmtTime, windowRows } from '../lib/analytics/time-of-day.js'
import { DEFAULT_SETTINGS, fmtFriendly } from '../lib/analytics/water-changes.js'
import { CalendarModal, ReminderSheet, useEscape } from '../lib/backup.jsx'
import { addDaysFromToday, fmtShort, paramStatus, todayStr } from '../lib/dates.js'
import { findingsFor } from '../lib/dosing/corrected-strength.js'
import { reminderState } from '../lib/reminders.js'
import { STABILITY_RULES, computeStability } from '../lib/stability-engine.js'

/* ---------------------------------- Dashboard ---------------------------------- */

export function Dashboard({ latestByParam, dueList, alerts, readings, paramDefs, saveRange, resetRange,
  customRanges, chartEvents, settings, doseLog, waterChanges, findings = [], icps = [],
  reminderView, onOpenParam, onOpenTest, onCompleteReminder, onNudgeReminder,
  remWindow = 14, setRemWindow = () => {},
  onSetReminderDue, onSetReminderInterval, onSkipReminder, onUpdateReminder,
  onGoTab, onDismissNote, onRestoreNotes, onRestoreOneNote, dismissedNotes = {}, tank = null,
  onAddReading = null, reminders = [], taskLog = [], doseStates = [] }) {
  /* Read from the app's single derivation rather than recomputing. The
     Dashboard used to build its own overview, briefing and score working from
     a differently-filtered findings list, which is how the box could report a
     hidden count that did not match what was on screen. */
  /* Rendering without the derived state is a wiring fault, not a data state —
     an empty tank still produces a full object. Failing loudly beats a blank
     screen with no message, which is what an undefined read would give. */
  if (!tank) return <Card className="p-4">Tank state unavailable.</Card>;
  const overview = tank.overview;
  const briefing = tank.briefing;

  /* How many of the claims this tank would produce are currently put away.
     Recomputed from the live data rather than counted from storage, so a note
     whose numbers have moved on is not reported as still hidden. */
  /* Three snoozes of the same dose suggestion says the target range is wrong rather
     than the advice. Counted from the stored keys, which carry the parameter. */
  const snoozeHint = useMemo(() => {
    return Object.entries(dismissedNotes || {}).some(([k, e]) =>
      k.startsWith("dose|") && e && typeof e === "object" && (e.times || 0) >= 3);
  }, [dismissedNotes]);

  /* Reported by the engine that did the hiding, rather than recomputed here
     from a differently-built list — the two disagreed whenever putting one
     claim away changed what another claim said. */
  const hiddenNotes = tank.hiddenCount;

  const scoreEx = tank.scoreExplained;

  /* A claim knows where it can be acted on; this is the only place that knows
     how to get there. */
  const goTo = (dest) => {
    if (!dest) return;
    if (dest.tab === "param") onOpenParam(dest.key);
    else if (onGoTab) onGoTab(dest.tab, dest.key);
  };

  /* The last 30 days of each parameter, so the gauge can show where it has been
     rather than only where it is. */
  const [calOpen, setCalOpen] = useState(false);
  const [snoozing, setSnoozing] = useState(null);

  /* How many times this parameter's suggestion has already been put off. */
  const snoozeCountFor = (key) => {
    const e = (dismissedNotes || {})[`dose|${key}`];
    return e && typeof e === "object" && e.times ? e.times : 0;
  };

  /* The sheet appears the first time, and again once putting this off has
     become a habit. Everywhere else the snooze is immediate — a dialog in
     front of a cheap, reversible action only teaches people to dismiss
     dialogs without reading them. */
  const requestDismiss = (c) => {
    const explained = !!(dismissedNotes || {})["__snooze-explained|" + (c.dismissKey || "")];
    const el = c.dismissKey && c.dismissKey.startsWith("dose|") ? c.dismissKey.split("|")[1] : null;
    const count = el ? snoozeCountFor(el) : 0;
    if (c.snoozeUntilTest && (!explained || count >= 2)) setSnoozing({ claim: c, count, el });
    else onDismissNote(c);
  };

  /* A short tail per parameter for the card sparklines — computed once here
     rather than filtering the whole log inside each of eight cards. */
  const sparkRowsByParam = useMemo(() => {
    const m = {};
    for (const d of paramDefs) {
      m[d.key] = readings.filter((r) => r.param === d.key).sort(byOldest).slice(-14);
    }
    return m;
  }, [readings, paramDefs]);

  const recentRangeByParam = useMemo(() => {
    const out = {};
    for (const def of paramDefs) {
      const rows = windowRows(readings, def.key, 30);
      if (rows.length < 2) { out[def.key] = null; continue; }
      const vals = rows.map((r) => r.value);
      out[def.key] = { lo: Math.min(...vals), hi: Math.max(...vals), n: vals.length };
    }
    return out;
  }, [readings, paramDefs]);

  /* Superseded by tank.stabilityByParam; kept only for the card's recent-range
     view, which needs the same shape. */
  const stabilityByParam = useMemo(() => {
    const map = {};
    for (const def of paramDefs) map[def.key] = computeStability(def, readings);
    return map;
  }, [readings, paramDefs]);
  /* The same reschedule sheet the Tasks tab uses, so a task seen on the
     dashboard calendar can be moved without navigating away. */
  const [sheetId, setSheetId] = useState(null);
  const sheetRem = sheetId ? (reminders || []).find((r) => r.id === sheetId) : null;
  const sheetState = sheetRem ? reminderState(sheetRem, taskLog, todayStr()) : null;

  return (
    <div>
      <SectionTitle eyebrow="Reef status" title="Dashboard" />

      <OverviewCard overview={overview} scoreEx={scoreEx} onOpenParam={onOpenParam}
        claims={briefing} readings={readings} paramDefs={paramDefs} onGoTo={goTo}
        onDismissNote={requestDismiss} hiddenCount={hiddenNotes} onRestoreNotes={onRestoreNotes}
        onRestoreOneNote={onRestoreOneNote} snoozeHint={snoozeHint} />

      {/* Directly after the assessment: only what needs doing now. */}
      <TodayPanel view={reminderView} onOpenTest={onOpenTest}
        onComplete={onCompleteReminder} onNudge={onNudgeReminder} onPickTask={setSheetId}
        paramDefs={paramDefs} onAddReading={onAddReading} />

      {alerts.length > 0 && (
        <Card className="p-4 mb-6 border-rose-300">
          <div className="flex items-center gap-2 mb-2 text-rose-800 text-sm font-extrabold">
            <AlertTriangle size={16} /> Out of range
          </div>
          <div className="flex flex-wrap gap-2">
            {alerts.map(({ def, reading }) => (
              <span key={def.key} className="text-xs px-2.5 py-1 rounded-full bg-rose-50 text-rose-800 border border-rose-200 font-bold">
                {def.label}: {reading.value}{def.unit} ({paramStatus(def, reading.value)})
              </span>
            ))}
          </div>
        </Card>
      )}

      {/* Cards vary in height — some have a findings badge, some have no data at
          all — so the grid items stretch and each card fills its cell. The date
          is pushed to the bottom so it sits on one line across the row rather
          than floating wherever the content above happens to end. */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mb-8 items-stretch">
        {paramDefs.map((def) => {
          const reading = latestByParam[def.key];
          return (
            <ParamCard key={def.key} def={def} reading={reading}
              recent={recentRangeByParam[def.key]}
              stab={stabilityByParam[def.key]}
              findings={findingsFor(findings, def.key)}
              rows={sparkRowsByParam[def.key]}
              dose={(doseStates || []).find((d) => d.key === def.key) || null}
              onLog={onOpenTest}
              onOpen={() => onOpenParam(def.key)} />
          );
        })}
      </div>

      <SectionTitle eyebrow="Schedule" title="Reminders" />
      <RemindersPanel view={reminderView} windowDays={remWindow} setWindowDays={setRemWindow}
        onOpenTest={onOpenTest} onComplete={onCompleteReminder} onNudge={onNudgeReminder}
        onOpenCalendar={() => setCalOpen(true)} />

      {calOpen && (
        <CalendarModal taskLog={taskLog} reminders={reminders} waterChanges={waterChanges}
          onPickTask={setSheetId}
          onClose={() => setCalOpen(false)} />
      )}

      {snoozing && (
        <SnoozeSheet
          claim={snoozing.claim.claim}
          param={snoozing.el || "this"}
          count={snoozing.count}
          onCancel={() => setSnoozing(null)}
          onConfirm={() => { onDismissNote(snoozing.claim); setSnoozing(null); }}
          onOpenTargetRange={snoozing.el ? () => { setSnoozing(null); onOpenParam(snoozing.el); } : null} />
      )}

      {sheetRem && (
        <ReminderSheet rem={sheetRem} state={sheetState} onClose={() => setSheetId(null)}
          onSetDue={(id, d) => { onSetReminderDue(id, d); setSheetId(null); }}
          onSetInterval={(id, n) => { onSetReminderInterval(id, n); setSheetId(null); }}
          onComplete={(id) => { onCompleteReminder(id); setSheetId(null); }}
          onSkip={(id) => { onSkipReminder(id); setSheetId(null); }}
          onToggleEnabled={(id, on) => { onUpdateReminder(id, { enabled: on }); setSheetId(null); }} />
      )}

    </div>
  );
}

export function ParamHistoryModal({ def, readings, onClose, onSaveRange, onResetRange, isCustom, chartEvents = [], settings = DEFAULT_SETTINGS, doseLog = [], paramDefs = [], waterChanges = [], findings = [], onAddReading = null, reminders = [], onDismissFinding = null, dose = null, onGoDosing = null }) {
  const [editing, setEditing] = useState(false);
  const [minVal, setMinVal] = useState(String(def.min));
  const [maxVal, setMaxVal] = useState(String(def.max));
  const [rangeMsg, setRangeMsg] = useState("");

  useEffect(() => { setMinVal(String(def.min)); setMaxVal(String(def.max)); }, [def.min, def.max]);

  const commitRange = async () => {
    const lo = parseFloat(minVal), hi = parseFloat(maxVal);
    if (isNaN(lo) || isNaN(hi)) { setRangeMsg("Enter two numbers."); return; }
    if (lo >= hi) { setRangeMsg("Minimum must be below maximum."); return; }
    await onSaveRange(def.key, lo, hi);
    setRangeMsg("Target range updated.");
    setEditing(false);
    setTimeout(() => setRangeMsg(""), 2500);
  };

  const revert = async () => {
    await onResetRange(def.key);
    setRangeMsg("Reverted to default range.");
    setEditing(false);
    setTimeout(() => setRangeMsg(""), 2500);
  };

  const [winDays, setWinDays] = useState(null);

  const allRows = useMemo(() =>
    readings.filter((r) => r.param === def.key).sort(byOldest),
  [readings, def.key]);

  /* Frequently-tested parameters get a 7-day view instead of 180d — alkalinity
     is often tested several times a week, and "All" still covers the long view.
     Keeping four buttons means the strip layout never changes. */
  const WINDOWS = (def.freqDays && def.freqDays <= 3)
    ? [[7, "7d"], [30, "30d"], [90, "90d"], [99999, "All"]]
    : [[30, "30d"], [90, "90d"], [180, "180d"], [99999, "All"]];

  /* One engine, one verdict per window. Showing every window at once means
     "tight recently, wide historically" reads as a single coherent story
     rather than two boxes appearing to disagree. */
  const windowStats = useMemo(
    () => WINDOWS.map(([d, label]) => ({
      days: d, label,
      c: computeControl(def, readings, d >= 99999 ? 100000 : d),
    })),
    [def, readings]);

  /* Open on the shortest window that has enough readings to judge. Testing
     cadence changes over time, so a fixed default can land on an empty view. */
  const defaultWin = useMemo(() => {
    const usable = windowStats.find((w) => w.c);
    return usable ? usable.days : WINDOWS[1][0];
  }, [windowStats]);

  /* Collapsed by default so changing the window shows the bars and the chart
     react, rather than pushing them below prose you've already read. */
  const [detailOpen, setDetailOpen] = useState(false);
  const activeWin = winDays == null ? defaultWin : winDays;
  const winLabel = activeWin >= 99999 ? "your whole log"
    : activeWin === 7 ? "the last 7 days"
    : `the last ${activeWin} days`;

  useEffect(() => { setWinDays(null); }, [def.key]);

  // Everything below is scoped to the selected window so the stats, the chart
  // and the verdict all describe the same slice of time.
  const rows = useMemo(() => {
    if (activeWin >= 99999) return allRows;
    const cutoff = addDaysFromToday(-activeWin);
    return allRows.filter((r) => r.date >= cutoff);
  }, [allRows, activeWin]);


  const control = useMemo(
    () => computeControl(def, readings, activeWin >= 99999 ? 100000 : activeWin),
    [def, readings, activeWin]);

  const rates = useMemo(
    () => computeRates(def, readings, activeWin >= 99999 ? 100000 : activeWin),
    [def, readings, activeWin]);

  const consumption = useMemo(
    () => (def.key === "alkalinity" ? computeConsumption(readings, settings) : null),
    [def.key, readings, settings]);

  const elementUse = useMemo(
    () => (CONSUMPTION_RULES[def.key]
      ? computeElementConsumption(def.key, readings, waterChanges, settings)
      : null),
    [def.key, readings, waterChanges, settings]);

  const doseAdvice = useMemo(
    () => (DOSE_ADVICE_RULES[def.key]
      ? computeDoseAdvice(readings, doseLog, paramDefs.length ? paramDefs : [def],
          activeWin >= 99999 ? 100000 : activeWin, settings)
      : null),
    [def, readings, doseLog, paramDefs, settings, activeWin]);

  /* Dose markers are tagged with their element, so a calcium doser change
     doesn't clutter the alkalinity chart. Untagged events (water changes,
     lighting, ICP) remain relevant to every parameter. */
  const relevantEvents = useMemo(
    () => chartEvents.filter((ev) => !ev.param || ev.param === def.key),
    [chartEvents, def.key]);

  /* When a day holds more than one reading, label by time so the two points
     are distinguishable rather than both reading "10 Aug". */
  const perDay = {};
  for (const r of rows) perDay[r.date] = (perDay[r.date] || 0) + 1;
  const chartData = rows.map((r) => ({
    label: perDay[r.date] > 1 && fmtTime(r.time) ? `${fmtShort(r.date)} ${fmtTime(r.time)}` : fmtShort(r.date),
    value: r.value, date: r.date, time: r.time,
  }));
  const values = rows.map((r) => r.value);
  const latest = rows[rows.length - 1];
  const min = values.length ? Math.min(...values) : null;
  const max = values.length ? Math.max(...values) : null;
  const avg = values.length ? (values.reduce((a, b) => a + b, 0) / values.length) : null;

  useEscape(onClose);

  return (
    <div className="fixed inset-0 bg-[#08191D]/60 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="w-full max-w-2xl">
        <Card className="p-5 max-h-[85vh] overflow-y-auto">
          {/* Whatever the dosing wizard currently believes about this element,
              said here too — the dashboard was previously silent about a change
              the user had made minutes earlier. */}
          {dose && dose.state !== "idle" && (
            <div className="rounded-xl p-3 mb-4"
              style={{ background: dose.tone + "10", border: `1px solid ${dose.tone}33` }}>
              <div className="text-[10px] font-extrabold uppercase tracking-wide mb-1"
                style={{ color: dose.tone }}>
                {dose.state === "settling" ? "Dose change settling"
                  : dose.state === "due" ? "Waiting on a test"
                  : dose.state === "worked" ? "Dose change complete"
                  : dose.state === "fell-short" ? "Change didn't go far enough"
                  : dose.state === "overshot" ? "Change went too far"
                  : dose.state === "blocked" ? "Setup problem"
                  /* Steady-but-out-of-range is not a dose suggestion; labelling
                     it as one contradicted the text underneath, which says the
                     dose is right and the level is not. */
                  : dose.state === "off-target" ? "Level, not dose"
                  : "Dose suggestion"}
                {dose.stages > 1 ? ` · step ${dose.stage} of ${dose.stages}` : ""}
              </div>
              <div className="text-[13px] font-black text-ink mb-1">{dose.headline}</div>
              <p className="text-[12px] text-ink font-medium leading-relaxed">{dose.detail}</p>
              {dose.testOn && (
                <p className="text-[12px] font-black mt-1.5" style={{ color: dose.tone }}>
                  Next {def.label.toLowerCase()} test {fmtFriendly(dose.testOn)}
                  {dose.expected != null ? ` — expect around ${fmtVal(def, dose.expected)}${def.unit}` : ""}
                </p>
              )}
              {onGoDosing && (
                <button onClick={onGoDosing}
                  className="mt-2 text-[11px] font-extrabold" style={{ color: dose.tone }}>
                  Open the dosing wizard →
                </button>
              )}
            </div>
          )}

          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="text-[11px] uppercase tracking-[0.14em] text-teal-brand font-extrabold mb-1">History</div>
              <h2 className="text-2xl font-display text-ink">{def.label}</h2>
              <div className="text-[11px] text-ink2 font-bold mt-0.5">
                target range {def.min}–{def.max}{def.unit} · {rows.length} of {allRows.length} readings
                {isCustom && <span className="ml-1 text-teal-brand">· custom</span>}
              </div>
              <button onClick={() => setEditing((v) => !v)} className="mt-1.5 text-[11px] font-extrabold text-teal-brand flex items-center gap-1">
                <Settings2 size={12} /> {editing ? "Cancel" : "Edit target range"}
              </button>
            </div>
            <button aria-label="Close" onClick={onClose} className="text-ink2 hover:text-ink p-2 -m-2 rounded-lg active:bg-app"><X size={22} /></button>
          </div>

          {editing && (
            <div className="rounded-xl bg-app border border-app p-3 mb-4">
              <div className="text-[11px] font-extrabold uppercase tracking-wide text-ink2 mb-2">Set target range ({def.unit || "value"})</div>
              <div className="grid grid-cols-2 gap-2 mb-2">
                <label className="min-w-0">
                  <span className="block text-[11px] font-bold text-ink2 mb-1">Minimum</span>
                  <input type="number" inputMode="decimal" step={def.step} value={minVal} onChange={(e) => setMinVal(e.target.value)} className={inputCls} />
                </label>
                <label className="min-w-0">
                  <span className="block text-[11px] font-bold text-ink2 mb-1">Maximum</span>
                  <input type="number" inputMode="decimal" step={def.step} value={maxVal} onChange={(e) => setMaxVal(e.target.value)} className={inputCls} />
                </label>
              </div>
              <div className="flex gap-2 flex-wrap">
                <Btn onClick={commitRange} className="flex-1 sm:flex-none"><span className="flex items-center justify-center gap-1.5"><Save size={14} /> Save</span></Btn>
                {isCustom && <Btn variant="ghost" onClick={revert} className="flex-1 sm:flex-none"><span className="flex items-center justify-center gap-1.5"><RotateCcw size={13} /> Default</span></Btn>}
              </div>
              <p className="text-[11px] text-ink2 font-medium mt-2">
                Changing this updates the in-range check, the dashboard gauge, and the shaded band on the chart. Stability scoring is unaffected — it measures how fast values move, not where they sit.
              </p>
            </div>
          )}

          {rangeMsg && <div className="text-[11px] font-extrabold text-teal-brand mb-3">{rangeMsg}</div>}

          <div className="mb-4">
            <div className="text-[10px] uppercase tracking-[0.13em] font-extrabold text-ink2 mb-1.5">
              Movement by period · tap to view
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
              {windowStats.map(({ days, label, c }) => {
                const active = activeWin === days;
                const dot = c ? c.consistencyColor : "#C7D6D3";
                return (
                  <button key={label} onClick={() => setWinDays(days)}
                    className={`text-left px-2.5 py-2 rounded-xl border-2 transition-colors ${
                      active ? "border-teal-brand bg-teal-50" : "border-app bg-white"}`}>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ background: dot }} />
                      <span className={`text-[11px] font-extrabold ${active ? "text-teal-brand" : "text-ink"}`}>{label}</span>
                    </div>
                    <div className="text-[11px] font-bold text-ink mt-0.5 truncate">
                      {c ? c.metricLabel : "no data"}
                    </div>
                    <div className="text-[10px] font-semibold text-ink2">
                      {c ? `${c.pct}% in range` : "\u2014"}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {rows.length === 0 ? (
            <div className="py-10 text-center text-ink2 font-semibold text-sm">No readings for {def.label.toLowerCase()} in this window</div>
          ) : (
            <>
              <div className="grid grid-cols-4 gap-3 mb-5">
                <div className="text-center min-w-0">
                  <div className="text-[10px] text-ink2 uppercase tracking-wide font-extrabold">Latest</div>
                  <div className="text-lg font-black text-ink mt-0.5 truncate">{latest.value}{def.unit}</div>
                </div>
                <div className="text-center min-w-0">
                  <div className="text-[10px] text-ink2 uppercase tracking-wide font-extrabold">Min</div>
                  <div className="text-lg font-black text-ink mt-0.5 truncate">{fmtVal(def, min)}{def.unit}</div>
                </div>
                <div className="text-center min-w-0">
                  <div className="text-[10px] text-ink2 uppercase tracking-wide font-extrabold">Max</div>
                  <div className="text-lg font-black text-ink mt-0.5 truncate">{fmtVal(def, max)}{def.unit}</div>
                </div>
                <div className="text-center min-w-0">
                  <div className="text-[10px] text-ink2 uppercase tracking-wide font-extrabold">Median</div>
                  <div className="text-lg font-black text-ink mt-0.5 truncate">
                    {fmtVal(def, control ? control.p50 : avg)}{def.unit}
                  </div>
                </div>
              </div>

              {control && (
                <div className="rounded-xl p-3 mb-4" style={{ background: control.tone + "12", border: `1px solid ${control.tone}40` }}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-extrabold uppercase tracking-wide" style={{ color: control.tone }}>
                      {control.headline}
                    </span>
                    <span className="text-[12px] font-black text-ink">
                      usually {fmtVal(def, control.p05)}–{fmtVal(def, control.p95)}{def.unit}
                    </span>
                  </div>

                  {/* Where testing is frequent enough, the rate measures replace the
                      spread row — a spread cannot tell a slow climb from a bounce. */}
                  {rates && rates.daily ? (
                    <>
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-[10px] font-extrabold uppercase text-ink2 w-20 shrink-0">Day to day</span>
                        <div className="h-2 rounded-full bg-white overflow-hidden flex-1">
                          <div className="h-full rounded-full transition-all"
                            style={{ width: `${(rates.daily.grade === "good" ? 1 : rates.daily.grade === "ok" ? 0.55 : 0.2) * 100}%`,
                                     background: rates.daily.grade === "good" ? "#0B7C86" : rates.daily.grade === "ok" ? "#A2621B" : "#C4285B" }} />
                        </div>
                        <span className="text-[10px] font-bold w-24 text-right shrink-0"
                          style={{ color: rates.daily.grade === "good" ? "#0B7C86" : rates.daily.grade === "ok" ? "#A2621B" : "#C4285B" }}>
                          {rates.daily.value.toFixed(rates.rr.dp)} {rates.rr.unit}/day
                        </span>
                      </div>
                      {rates.weekly && (
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className="text-[10px] font-extrabold uppercase text-ink2 w-20 shrink-0">Weekly drift</span>
                          <div className="h-2 rounded-full bg-white overflow-hidden flex-1">
                            <div className="h-full rounded-full transition-all"
                              style={{ width: `${(rates.weekly.grade === "good" ? 1 : rates.weekly.grade === "ok" ? 0.55 : 0.2) * 100}%`,
                                       background: rates.weekly.grade === "good" ? "#0B7C86" : rates.weekly.grade === "ok" ? "#A2621B" : "#C4285B" }} />
                          </div>
                          <span className="text-[10px] font-bold w-24 text-right shrink-0"
                            style={{ color: rates.weekly.grade === "good" ? "#0B7C86" : rates.weekly.grade === "ok" ? "#A2621B" : "#C4285B" }}>
                            {rates.weekly.value > 0 ? "+" : ""}{rates.weekly.value.toFixed(rates.rr.dp)} {rates.rr.unit}/wk
                          </span>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-[10px] font-extrabold uppercase text-ink2 w-20 shrink-0">Consistency</span>
                      <div className="h-2 rounded-full bg-white overflow-hidden flex-1">
                        <div className="h-full rounded-full transition-all"
                          style={{ width: `${control.consistencyScore * 100}%`, background: control.consistencyColor }} />
                      </div>
                      <span className="text-[10px] font-bold w-24 text-right shrink-0" style={{ color: control.consistencyColor }}>{control.metricLabel || control.consistency}</span>
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-extrabold uppercase text-ink2 w-20 shrink-0">In range</span>
                    <div className="h-2 rounded-full bg-white overflow-hidden flex-1">
                      <div className="h-full rounded-full transition-all"
                        style={{ width: `${control.pct}%`, background: control.pct >= 85 ? "#0B7C86" : control.consistency === "tight" ? "#1D6FA5" : "#A2621B" }} />
                    </div>
                    <span className="text-[10px] font-bold text-ink2 w-16 text-right shrink-0">{control.pct}%</span>
                  </div>
                  <div className="text-[10px] text-ink2 font-semibold mt-1 ml-[88px]">
                    {control.inRange} of {control.rows} in range{control.below > 0 && ` · ${control.below} below`}{control.above > 0 && ` · ${control.above} above`}
                  </div>


                  {/* The verdict and the bars stay visible; the explanation
                      folds away. Changing the window should show the bars and
                      the chart react, not push them off screen behind three
                      paragraphs you have already read. */}
                  <button onClick={() => setDetailOpen((v) => !v)}
                    className="w-full flex items-center justify-center gap-1 mt-2 pt-2 border-t"
                    style={{ borderColor: control.tone + "26" }}>
                    <span className="text-[11px] font-extrabold" style={{ color: control.tone }}>
                      {detailOpen ? "Hide detail" : "What this means"}
                    </span>
                    {detailOpen
                      ? <ChevronUp size={12} style={{ color: control.tone }} />
                      : <ChevronDown size={12} style={{ color: control.tone }} />}
                  </button>

                  {detailOpen && (<>
                  {/* One box, both stories: where it sits, and how it is moving. */}
                  <p className="text-[12px] text-ink font-medium leading-relaxed mt-2">
                    {rates && rates.daily ? rateNarrative(def, rates, winLabel) : control.note}
                    {(!rates || !rates.daily) && control.pattern && control.pattern !== "flat" &&
                      ` Across these ${control.rows} readings it is ${control.pattern}.`}
                    {control.atResolution && ` Every step was within what a ${def.label.toLowerCase()} kit can resolve, so some of this may be reading resolution rather than real movement.`}
                  </p>

                  {rates && rates.daily && (
                    <p className="text-[12px] text-ink font-medium leading-relaxed mt-2">
                      {(() => {
                        const band = `${fmtVal(def, def.min)}\u2013${fmtVal(def, def.max)}${def.unit}`;
                        const outside = control.below + control.above;
                        const side = control.above > control.below ? "above" : "below";
                        if (!control.medianInside) {
                          return `As for where it sits, the typical reading is ${fmtVal(def, control.gap)}${def.unit} ${control.bias === "high" ? "above" : "below"} your ${band} target range — so it's being held steadily, just not at the level you asked for.`;
                        }
                        if (control.pct >= 90) {
                          return `As for where it sits, that's right where you want it — ${control.inRange} of ${control.rows} readings landed inside ${band}.`;
                        }
                        if (control.pct >= 70) {
                          return `As for where it sits, the typical reading is inside ${band}, though ${outside} of ${control.rows} strayed ${side} it. Nothing dramatic, but it spends real time outside the band rather than the occasional trip.`;
                        }
                        return `As for where it sits, that's marginal — only ${control.inRange} of ${control.rows} readings landed inside ${band}, with ${outside} ${side} it. The middle of the range is inside your band, so the issue is how widely it swings rather than where it's centred.`;
                      })()}
                    </p>
                  )}

                  {control.contextNote && (
                    <p className="text-[12px] text-ink font-medium leading-relaxed mt-2 pt-2 border-t"
                       style={{ borderColor: control.tone + "33" }}>
                      {control.contextNote}
                    </p>
                  )}

                  {rates && rates.daily && (
                    <p className="text-[11px] text-ink2 font-medium leading-relaxed mt-1.5">
                      Guides: under {rates.rr.dailyGood} {rates.rr.unit} a day, and under {rates.rr.weeklyGood} {rates.rr.unit} of drift across a week.
                    </p>
                  )}
                  </>)}

                  {control.suggestWorth && onSaveRange && (
                    <div className="mt-2 flex items-center justify-between gap-2">
                      <span className="text-[12px] font-bold text-ink min-w-0">
                        Change the target range to {fmtVal(def, control.suggested.min)}–{fmtVal(def, control.suggested.max)}{def.unit}?
                      </span>
                      <button onClick={() => onSaveRange(def.key, control.suggested.min, control.suggested.max)}
                        className="text-[11px] font-extrabold px-2.5 py-1.5 rounded-lg border-2 shrink-0 bg-white"
                        style={{ color: control.tone, borderColor: control.tone + "66" }}>
                        Use this
                      </button>
                    </div>
                  )}
                </div>
              )}


              {/* Logging sits between the verdict and the chart: you read where
                  it stands, record the new reading, and see it land. */}
              {onAddReading && (
                <QuickLog def={def} onAdd={onAddReading} settings={settings} reminders={reminders} />
              )}

              {/* Chart first: the stability summary above sets up what the
                  line shows, and the callouts below interpret it. Reading a
                  verdict before seeing the data it came from was backwards. */}
              <ZoomableLineChart data={chartData} color={def.color} targetRangeMin={def.min} targetRangeMax={def.max} height={280} events={relevantEvents} />

              {(() => {
                const fs = findingsFor(findings, def.key);
                if (!fs.length) return null;
                return (
                  <div className="mb-4">
                    <div className="text-[11px] font-extrabold uppercase tracking-wide text-ink2 mb-1.5">
                      Notices for {def.label.toLowerCase()}
                    </div>
                    <FindingList items={fs} onDismiss={onDismissFinding} />
                  </div>
                );
              })()}

              {/* The generic dose box that used to sit here has been removed.
                  It ran a different engine from the banner at the top of this
                  modal — a 30-day window against the protocol's own — and the
                  two disagreed outright: a tank steady but below range read
                  "Correction needed" at the top and "Dose looks right" here.
                  The banner says everything this did and reconciles with the
                  Dosing Wizard, so one voice is left rather than two. */}

              {elementUse && (
                <div className="rounded-xl p-3 mb-4" style={{ background: "#0B7C8610", border: "1px solid #0B7C8640" }}>
                  <div className="text-[11px] font-extrabold uppercase tracking-wide text-teal-brand mb-2">
                    Consumption & dosing
                  </div>

                  {elementUse.status !== "ok" ? (
                    <p className="text-[12px] text-ink font-medium leading-relaxed">
                      {elementUse.status === "tooshort"
                        ? `${def.label} moves slowly, so this needs at least ${elementUse.minDays} days of readings before a consumption figure means anything. You've got ${elementUse.spanDays} days so far.`
                        : `Log a few more ${def.label.toLowerCase()} tests and this will work out what the tank is actually using.`}
                    </p>
                  ) : !elementUse.doseConfigured ? (
                    <>
                      <p className="text-[12px] text-ink font-medium leading-relaxed">
                        Over the last {elementUse.spanDays} days your {def.label.toLowerCase()} has {Math.abs(elementUse.netChange) < (STABILITY_RULES[def.key]?.noiseFloor || 0)
                          ? "barely moved"
                          : elementUse.netChange > 0
                          ? `risen ${fmtAmount(Math.abs(elementUse.netChange))}${def.unit}`
                          : `fallen ${fmtAmount(Math.abs(elementUse.netChange))}${def.unit}`}
                        {elementUse.wcCount > 0 && `, across ${elementUse.wcCount} water ${elementUse.wcCount === 1 ? "change" : "changes"}`}.
                      </p>
                      <p className="text-[12px] text-ink2 font-medium leading-relaxed mt-1.5">
                        Enter how much {def.label.toLowerCase()} you dose each day, in Insights under Tank &amp; dosing setup, and this will turn that into an actual consumption rate.
                      </p>
                    </>
                  ) : (
                    <>
                      {/* Two tiles, not three. The third read "Water changes
                          +0.08 dKH" and was a term in the balance; §22 removed
                          that term, and a tile the arithmetic no longer uses is
                          an invitation to work out a different answer from the
                          one shown. */}
                      <div className="grid grid-cols-2 gap-2 mb-2">
                        <div className="text-center min-w-0">
                          <div className="text-[9px] text-ink2 uppercase tracking-wide font-extrabold">Dosing</div>
                          <div className="text-sm font-black text-ink mt-0.5 truncate">{fmtAmount(elementUse.dosePerDay)}{def.unit}/day</div>
                        </div>
                        <div className="text-center min-w-0">
                          <div className="text-[9px] text-ink2 uppercase tracking-wide font-extrabold">Consuming</div>
                          <div className="text-sm font-black mt-0.5 truncate" style={{ color: elementUse.reliable ? "#0B7C86" : "#45605F" }}>
                            {elementUse.reliable ? `${fmtAmount(elementUse.perDay)}${def.unit}/day` : "too small"}
                          </div>
                        </div>
                      </div>

                      <p className="text-[12px] text-ink font-medium leading-relaxed">
                        Across {elementUse.spanDays} days you dosed about {fmtAmount(elementUse.dosed)}{def.unit} in total
                        {elementUse.wcCount > 0
                          ? `, across ${elementUse.wcCount} water ${elementUse.wcCount === 1 ? "change" : "changes"}`
                          : ``}
                        , while the tank itself {Math.abs(elementUse.netChange) < 0.005 ? "held level" : elementUse.netChange > 0 ? `rose ${fmtAmount(elementUse.netChange)}${def.unit}` : `fell ${fmtAmount(Math.abs(elementUse.netChange))}${def.unit}`}.
                        {" "}
                        {elementUse.reliable
                          ? `That leaves about ${fmtAmount(elementUse.perDay)}${def.unit} a day being consumed.`
                          : `The leftover is smaller than your test kit can reliably resolve, so there's no trustworthy consumption figure yet — ${def.label.toLowerCase()} demand is genuinely small at this scale.`}
                        {elementUse.sparse && ` Bear in mind your readings here average ${Math.round(elementUse.avgGap)} days apart, so this is an average across long gaps rather than a close measurement.`}
                      </p>

                      {elementUse.reliable && elementUse.perDay < 0 && (
                        <p className="text-[12px] text-ink font-medium leading-relaxed mt-1.5">
                          The figure came out negative, which means more is going in than the tank uses — worth easing the dose back, or it will keep climbing.
                        </p>
                      )}

                    </>
                  )}
                </div>
              )}
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
