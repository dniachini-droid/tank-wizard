import { useEffect, useMemo, useState } from 'react'
import { AllGraphsModal, TestLab } from './AllParametersSheet.jsx'
import { Btn, Field, inputCls } from './DoseExpectation.jsx'
import { Card, DeleteButton } from './ErrorBoundary.jsx'
import { IcpPanel } from './IcpPanel.jsx'
import { Activity, FileBarChart2, FlaskConical, Save, Upload } from '../icons.jsx'
import { fmtVal } from '../lib/analytics/time-in-range.js'
import { byNewest, fmtTime } from '../lib/analytics/time-of-day.js'
import { StatusPill } from '../lib/backup.jsx'
import { PARAM_DEFS } from '../lib/constants.js'
import { fmtDate, paramStatus, todayStr } from '../lib/dates.js'
import { notify } from '../lib/storage.js'

/* ---------------------------------- Water Log ---------------------------------- */

/* The two halves of Testing are equally important, so the switcher is a pair
   of full-width cards rather than small pills — the ICP side was easy to miss
   entirely when it was a 12px text button. */
export function TestModeSwitch({ mode, setMode, testCount, icpCount }) {
  const items = [
    { id: "tests", label: "My tests", sub: testCount === 1 ? "1 reading" : `${testCount} readings`, Icon: FlaskConical },
    { id: "icp", label: "ICP panels", sub: icpCount === 1 ? "1 panel" : `${icpCount} panels`, Icon: FileBarChart2 },
  ];
  return (
    <div className="grid grid-cols-2 gap-2 mb-4">
      {items.map(({ id, label, sub, Icon }) => {
        const on = mode === id;
        return (
          <button key={id} onClick={() => setMode(id)}
            className="rounded-2xl border-2 px-3 py-3 text-left transition-all"
            style={{
              borderColor: on ? "#0B7C86" : "#E3ECEA",
              background: on ? "#0B7C8612" : "#fff",
              boxShadow: on ? "0 2px 10px rgba(11,124,134,0.13)" : "none",
            }}>
            <div className="flex items-center gap-2 mb-0.5">
              <Icon size={17} color={on ? "#0B7C86" : "#45605F"} />
              <span className="text-[14px] font-black" style={{ color: on ? "#0B7C86" : "#08191D" }}>{label}</span>
            </div>
            <div className="text-[11px] font-bold" style={{ color: on ? "#0B7C86" : "#45605F" }}>{sub}</div>
          </button>
        );
      })}
    </div>
  );
}

export function WaterLog({ readings, onAdd, onDelete, onImportHistorical, paramDefs, chartEvents = [],
  icps = [], onAddIcp, onDeleteIcp, onEdit, prefill = null, onOpenParam,
  reminders = [], reminderView = null }) {
  const [mode, setMode] = useState("tests");
  const [importMsg, setImportMsg] = useState(null);
  const [importing, setImporting] = useState(false);
  const [allGraphs, setAllGraphs] = useState(false);
  const [histParam, setHistParam] = useState(PARAM_DEFS[0].key);
  const [editId, setEditId] = useState(null);
  const [editVal, setEditVal] = useState("");
  const [editDate, setEditDate] = useState(todayStr());
  const [editTime, setEditTime] = useState("");

  /* Arriving from a reminder just needs the tests view; every parameter is
     listed there now, so there is nothing to pre-select. `at` is a timestamp
     rather than a flag so tapping the same reminder twice still works. */
  useEffect(() => {
    if (!prefill || !prefill.paramKey) return;
    setMode("tests");
  }, [prefill && prefill.at]);

  const runImport = async () => {
    setImporting(true);
    try {
      const count = await onImportHistorical();
      setImportMsg(count > 0 ? `Imported ${count} historical readings.` : "Already up to date.");
    } finally {
      setImporting(false);
    }
  };


  const histDef = paramDefs.find((d) => d.key === histParam) || paramDefs[0];
  const histRows = useMemo(() => readings
    .filter((r) => r.param === histParam)
    .sort(byNewest)
    .slice(0, 40),
  [readings, histParam]);

  if (mode === "icp") {
    return (
      <div>
        <div className="mb-4">
          <h2 className="text-2xl font-display text-ink mb-3">Water Test Lab</h2>
        </div>
        <TestModeSwitch mode={mode} setMode={setMode} testCount={readings.length} icpCount={icps.length} />
        <IcpPanel icps={icps} onAdd={onAddIcp} onDelete={onDeleteIcp} />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4">
        <div className="flex items-start justify-between gap-2 mb-3">
          <h2 className="text-2xl font-display text-ink">Water Test Lab</h2>
          {/* Every chart in one scroll, for when you want the whole picture
              rather than one parameter's detail. */}
          <button onClick={() => setAllGraphs(true)}
            className="shrink-0 flex items-center gap-1.5 rounded-lg border-2 px-2.5 py-1.5 text-[11px] font-extrabold"
            style={{ borderColor: "#0B7C8640", color: "#0B7C86" }}>
            <Activity size={13} /> All graphs
          </button>
        </div>
        <TestModeSwitch mode={mode} setMode={setMode} testCount={readings.length} icpCount={icps.length} />
        <Btn variant="ghost" onClick={runImport} disabled={importing} className="w-full sm:w-auto">
          <span className="flex items-center justify-center gap-1.5"><Upload size={14} /> {importing ? "Importing…" : "Import historical data"}</span>
        </Btn>
        {importMsg && <div className="text-[11px] font-bold text-teal-brand mt-1.5">{importMsg}</div>}
      </div>

      <TestLab paramDefs={paramDefs} readings={readings} onAdd={onAdd}
        onOpenParam={onOpenParam} reminders={reminders} reminderView={reminderView} />

      {allGraphs && (
        <AllGraphsModal paramDefs={paramDefs} readings={readings} chartEvents={chartEvents}
          onClose={() => setAllGraphs(false)} onOpenParam={onOpenParam} />
      )}


      {/* Filtered to one parameter: a single mixed list was hard to scan, and
          correcting a mis-typed reading meant hunting through everything. */}
      <div className="flex items-end justify-between gap-2 mb-3">
        <div>
          <div className="text-[11px] uppercase tracking-[0.14em] text-teal-brand font-extrabold mb-1">History</div>
          <h2 className="text-2xl font-display text-ink">Past readings</h2>
        </div>
        <select value={histParam} onChange={(e) => setHistParam(e.target.value)}
          className="rounded-lg border border-app bg-white px-2.5 py-2 text-[13px] font-bold text-ink max-w-[50%]">
          {paramDefs.map((d) => <option key={d.key} value={d.key}>{d.label}</option>)}
        </select>
      </div>

      <Card className="divide-y divide-app">
        {histRows.length === 0 && (
          <div className="px-4 py-6 text-center text-ink2 font-semibold text-sm">
            No {histDef.label.toLowerCase()} readings yet
          </div>
        )}
        {histRows.map((r) => {
          const editing = editId === r.id;
          return (
            <div key={r.id} className="px-4 py-3"
              style={editing ? { background: "#F3F7F6" } : undefined}>
              {editing ? (
                /* Four fields and two buttons on one line left every control
                   too narrow to use. Stacked instead: value on its own row,
                   date and time sharing the next, buttons last. */
                <div>
                  <div className="text-[10px] font-extrabold uppercase tracking-wide text-ink2 mb-2">
                    Editing this reading
                  </div>
                  <Field label={`Value (${histDef.unit || ""})`}>
                    <input type="number" inputMode="decimal" step={histDef.step} value={editVal}
                      onChange={(e) => setEditVal(e.target.value)} className={inputCls} autoFocus />
                  </Field>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <Field label="Date">
                      <input type="date" value={editDate} max={todayStr()}
                        onChange={(e) => setEditDate(e.target.value)} className={inputCls} />
                    </Field>
                    <Field label="Time">
                      {/* Editable on old readings too, so a batch entered from
                          paper can be placed at the hour it was actually taken. */}
                      <input type="time" value={editTime}
                        onChange={(e) => setEditTime(e.target.value)} className={inputCls} />
                    </Field>
                  </div>
                  <div className="grid grid-cols-2 gap-2 mt-3">
                    <Btn variant="ghost" onClick={() => setEditId(null)}>Cancel</Btn>
                    <Btn onClick={async () => {
                      const v = parseFloat(editVal);
                      if (isFinite(v)) {
                        await onEdit(r.id, { value: v, date: editDate, time: editTime || undefined });
                        notify("Reading updated");
                      }
                      setEditId(null);
                    }}>
                      <span className="flex items-center justify-center gap-1.5"><Save size={13} /> Save</span>
                    </Btn>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between gap-2">
                  <button className="min-w-0 text-left flex-1"
                    onClick={() => { setEditId(r.id); setEditVal(String(r.value)); setEditDate(r.date); setEditTime(r.time || ""); }}>
                    <div className="flex items-center gap-2">
                      <span className="font-black text-sm text-ink">{fmtVal(histDef, r.value)}{histDef.unit}</span>
                      <span className="text-[11px] text-ink2 font-semibold">
                        {fmtDate(r.date)}{fmtTime(r.time) ? ` · ${fmtTime(r.time)}` : ""}
                      </span>
                    </div>
                    {r.note && <div className="text-[11px] text-ink2 mt-0.5">{r.note}</div>}
                  </button>
                  <div className="flex items-center gap-2 shrink-0">
                    <StatusPill status={paramStatus(histDef, r.value)} />
                    <DeleteButton onDelete={() => onDelete(r.id)} confirmMessage="Reading removed" />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </Card>
      {histRows.length > 0 && (
        <p className="text-[11px] text-ink2 font-medium mt-2">Tap a reading to correct its value or date.</p>
      )}
    </div>
  );
}
