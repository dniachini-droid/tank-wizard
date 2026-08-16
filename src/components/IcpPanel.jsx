import { useEffect, useMemo, useRef, useState } from 'react'
import { Btn, Field, SectionTitle, inputCls } from './DoseExpectation.jsx'
import { Card, DeleteButton } from './ErrorBoundary.jsx'
import { ZoomableLineChart } from './ZoomableChart.jsx'
import { Plus, Upload, X } from '../icons.jsx'
import { ICP_GROUPS, icpRef } from '../lib/analytics/icp-reference.js'
import { byNewest, byOldest } from '../lib/analytics/time-of-day.js'
import { fmtDate, fmtShort, todayStr } from '../lib/dates.js'
import { compressImage } from '../lib/image-compression.js'

/* ---------------------------------- ICP Panel ---------------------------------- */

export function IcpPanel({ icps, onAdd, onDelete }) {
  const [date, setDate] = useState(todayStr());
  const [note, setNote] = useState("");
  const [rows, setRows] = useState([{ name: "", value: "" }]);
  const [imgData, setImgData] = useState(null);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef(null);

  const elementNames = useMemo(() => {
    const set = new Set();
    icps.forEach((t) => Object.keys(t.elements || {}).forEach((k) => set.add(k)));
    return Array.from(set).sort();
  }, [icps]);

  /* Same elements, ordered the way you'd actually look for them: the ones you
     manage first, contaminants last. */
  const groupedElements = useMemo(() => {
    const remaining = new Set(elementNames);
    const out = [];
    for (const g of ICP_GROUPS) {
      const found = g.members.filter((m) => remaining.has(m));
      found.forEach((m) => remaining.delete(m));
      if (found.length) out.push({ label: g.label, items: found });
    }
    if (remaining.size) out.push({ label: "Other", items: Array.from(remaining).sort() });
    return out;
  }, [elementNames]);
  const [graphEl, setGraphEl] = useState("");
  useEffect(() => {
    if (graphEl || !groupedElements.length) return;
    /* Open on something worth looking at rather than the first contaminant
       alphabetically. */
    setGraphEl(groupedElements[0].items[0]);
  }, [groupedElements]);

  const updateRow = (i, field, val) => {
    const next = [...rows]; next[i] = { ...next[i], [field]: val }; setRows(next);
  };
  const addRow = () => setRows([...rows, { name: "", value: "" }]);
  const removeRow = (i) => setRows(rows.filter((_, idx) => idx !== i));

  const [fileErr, setFileErr] = useState(null);
  const [saveMsg, setSaveMsg] = useState(null);

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true); setFileErr(null);
    try {
      const data = await compressImage(file);
      setImgData(data);
    } catch (err) {
      setFileErr(err.message || "Could not read that image.");
      setImgData(null);
    } finally { setBusy(false); }
  };

  const submit = async (e) => {
    e.preventDefault();
    const elements = {};
    rows.forEach((r) => { if (r.name.trim() && r.value !== "") elements[r.name.trim()] = parseFloat(r.value); });
    if (Object.keys(elements).length === 0) {
      setSaveMsg("Add at least one element name and value before saving.");
      return;
    }
    const ok = await onAdd({ date, note: note.trim(), elements, image: imgData });
    if (ok === false) {
      setSaveMsg("Could not save — see the message at the top of the screen.");
      return;
    }
    setSaveMsg(`Saved ${Object.keys(elements).length} element${Object.keys(elements).length === 1 ? "" : "s"} for ${fmtDate(date)}.`);
    setTimeout(() => setSaveMsg(null), 4000);
    setRows([{ name: "", value: "" }]); setNote(""); setImgData(null); setFileErr(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  const graphData = useMemo(() => {
    return icps.filter((t) => t.elements && t.elements[graphEl] != null)
      .sort(byOldest)
      .map((t) => ({ label: fmtShort(t.date), value: t.elements[graphEl], date: t.date }));
  }, [icps, graphEl]);

  const sortedIcps = useMemo(() => [...icps].sort(byNewest), [icps]);

  return (
    <div>
      <SectionTitle eyebrow="Every 6 weeks" title="ICP Panel" />

      <Card className="p-4 mb-6">
        <form onSubmit={submit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Test date"><input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={inputCls} max={todayStr()} /></Field>
            <Field label="Note (optional)"><input type="text" value={note} onChange={(e) => setNote(e.target.value)} className={inputCls} placeholder="e.g. Triton, after WC" /></Field>
          </div>

          <div>
            <span className="block text-xs font-bold text-ink2 mb-1.5">Elements</span>
            <div className="space-y-2">
              {rows.map((r, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <div className="flex-1 min-w-0">
                    <input type="text" value={r.name} onChange={(e) => updateRow(i, "name", e.target.value)} placeholder="Element, e.g. Iodine" className={inputCls} />
                  </div>
                  <div className="w-24 shrink-0">
                    <input type="number" inputMode="decimal" step="any" value={r.value} onChange={(e) => updateRow(i, "value", e.target.value)} placeholder="value" className={inputCls} />
                  </div>
                  <button type="button" onClick={() => removeRow(i)} aria-label="Remove element"
                    className="text-ink2 hover:text-rose-700 shrink-0 w-8 h-8 flex items-center justify-center rounded-lg">
                    <X size={16} />
                  </button>
                </div>
              ))}
            </div>
            <button type="button" onClick={addRow} className="mt-2 text-xs font-bold text-teal-brand flex items-center gap-1"><Plus size={12} /> Add element</button>
          </div>

          <div>
            <span className="block text-xs font-bold text-ink2 mb-1.5">Report photo (optional)</span>
            <div className="flex items-center gap-3">
              <label className="cursor-pointer">
                <span className="flex items-center gap-1.5 px-3 py-2 rounded-lg border-2 border-app text-sm font-bold text-ink hover:border-teal-brand">
                  <Upload size={14} /> {busy ? "processing…" : "Choose file"}
                </span>
                <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} className="hidden" />
              </label>
              {imgData && <img src={imgData} alt="preview" className="h-12 w-12 object-cover rounded-md border border-app" />}
            </div>
          </div>

          {fileErr && <p className="text-[12px] font-bold text-rose-700">{fileErr}</p>}
          {saveMsg && <p className="text-[12px] font-bold text-teal-brand">{saveMsg}</p>}
          <Btn type="submit"><span className="flex items-center gap-1.5"><Plus size={14} /> Save ICP result</span></Btn>
        </form>
      </Card>

      {elementNames.length > 0 && (
        <>
          <div className="mb-4">
            <div className="text-[11px] uppercase tracking-[0.14em] text-teal-brand font-extrabold mb-1">Trend</div>
            <h2 className="text-2xl font-display text-ink mb-3">Element graph</h2>
            <div className="w-full sm:w-52">
              <select value={graphEl} onChange={(e) => setGraphEl(e.target.value)} className={inputCls}>
                {groupedElements.map((g) => (
                  <optgroup key={g.label} label={g.label}>
                    {g.items.map((n) => <option key={n} value={n}>{n}</option>)}
                  </optgroup>
                ))}
              </select>
            </div>
          </div>
          <Card className="p-4 mb-8">
            {(() => {
              const gRef = icpRef(graphEl);
              return (
                <>
                  <ZoomableLineChart data={graphData} color="#B8541A" height={240}
                    targetRangeMin={gRef ? gRef.lo : null} targetRangeMax={gRef ? gRef.hi : null} />
                  {gRef && (
                    <p className="text-[11px] text-ink2 font-medium leading-relaxed mt-2">
                      {gRef.derived
                        ? `Shaded band is Triton's setpoint of ${gRef.setpoint} ${gRef.unit} give or take 10% — Triton publishes a single target for this element rather than a range.`
                        : gRef.hi === 0
                        ? `Triton's target for ${graphEl} is zero, so the band sits on the axis — anything measurable is a detection.`
                        : `Shaded band is Triton's published range, ${gRef.lo}–${gRef.hi} ${gRef.unit}.`}
                    </p>
                  )}
                  {!gRef && (
                    <p className="text-[11px] text-ink2 font-medium mt-2">No published reference range held for {graphEl}.</p>
                  )}
                </>
              );
            })()}
          </Card>
        </>
      )}

      <SectionTitle eyebrow="History" title="Past results" />
      <div className="space-y-3">
        {sortedIcps.length === 0 && <Card className="px-4 py-6 text-center text-ink2 font-semibold text-sm">No ICP results logged yet</Card>}
        {sortedIcps.map((t) => (
          <Card key={t.id} className="p-4">
            <div className="flex items-start justify-between mb-2">
              <div>
                <div className="text-sm font-black text-ink">{fmtDate(t.date)}</div>
                {t.note && <div className="text-[11px] text-ink2 font-semibold">{t.note}</div>}
              </div>
              <DeleteButton onDelete={() => onDelete(t.id)} />
            </div>
            <div className="flex flex-wrap gap-2 mb-2">
              {Object.entries(t.elements || {}).map(([k, v]) => (
                <span key={k} className="text-[11px] font-bold px-2 py-1 rounded-md bg-app border border-app text-ink">{k}: {v}</span>
              ))}
            </div>
            {t.image && <img src={t.image} alt="ICP report" className="mt-2 max-h-48 rounded-lg border border-app" />}
          </Card>
        ))}
      </div>
    </div>
  );
}
