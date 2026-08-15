import { useEffect, useMemo, useState } from 'react'
import { Btn, Field, SectionTitle, findingKey, inputCls } from './DoseExpectation.jsx'
import { Card, DeleteButton } from './ErrorBoundary.jsx'
import { InfoBlock } from './Insights.jsx'
import { Activity, Calculator, CheckCircle2, ChevronDown, ChevronUp, Download, Plus, RotateCcw, Save, SunMedium, Upload, Waves } from '../icons.jsx'
import { DOSE_ELEMENTS } from '../lib/analytics/consumption.js'
import { CORRECTIONS, computeCorrection, fmtDoseMass } from '../lib/analytics/correction.js'
import { kitSigma } from '../lib/analytics/measurement-noise.js'
import { fmtAmount } from '../lib/analytics/time-in-range.js'
import { byNewest } from '../lib/analytics/time-of-day.js'
import { fileHandleSupported, loadFileHandle, regrantAndWrite, restoreSnapshot, ringList, saveFileHandle, shareBackup, shareSupported, writeBackupToHandle } from '../lib/auto-backup.js'
import { BACKUP_LABELS, buildBackup, downloadCsv, downloadJson, inspectBackup, requestPersistence, restoreBackup } from '../lib/backup.jsx'
import { daysBetween, fmtDate, fmtShort, todayStr } from '../lib/dates.js'
import { buildCsv } from '../lib/export-csv.js'
import { KIT_PRECISION, settleWindow } from '../lib/findings.js'
import { loadKey, saveKey } from '../lib/storage.js'

/* ---------------------------------- Setup ---------------------------------- */

export function Setup({ settings, onSaveSettings, paramDefs, latestByParam, readings,
  doseLog = [], onAddDoseChange, onDeleteDoseChange,
  waterChanges = [], icps = [], lighting = [], taskLog = [], allTasks = [],
  onAddLighting, onDeleteLighting, onRestored, onPlayIntro,
  onRestoreFinding, onRestoreAllFindings,
  customTasks = [], dismissedList = [], corrections = [], onDeleteCorrection = null }) {

  const [vol, setVol] = useState((settings.volumeL == null ? "" : String(settings.volumeL)));
  const [backupAt, setBackupAt] = useState(null);
  const [restoreMsg, setRestoreMsg] = useState(null);
  const [pending, setPending] = useState(null);
  const [persistState, setPersistState] = useState(null);

  /* The automatic side of backup: the snapshots this device holds, and the
     file handle if one was chosen. Loaded here so the panel shows what is
     actually protecting the user rather than what ought to be. */
  const [snapshots, setSnapshots] = useState([]);
  const [fileState, setFileState] = useState(null);

  const refreshAuto = async () => {
    setSnapshots(await ringList());
    const handle = await loadFileHandle();
    if (!handle) { setFileState(null); return; }
    let needsTap = false;
    try {
      if (handle.queryPermission) needsTap = (await handle.queryPermission({ mode: "readwrite" })) !== "granted";
    } catch { needsTap = true; }
    setFileState({ handle, needsTap });
  };

  /* Ask for durable storage on arrival, and find out when the last backup was,
     so the reminder can be honest rather than nagging on every visit. */
  useEffect(() => {
    let live = true;
    (async () => {
      const p = await requestPersistence();
      if (live) setPersistState(p);
      const last = await loadKey("last-backup", null);
      if (live) setBackupAt(last);
      if (live) await refreshAuto();
    })();
    return () => { live = false; };
  }, []);

  const backupAge = backupAt ? daysBetween(backupAt.slice(0, 10), todayStr()) : null;
  const [elemKey, setElemKey] = useState("alkalinity");
  const elem = DOSE_ELEMENTS.find((e) => e.key === elemKey) || DOSE_ELEMENTS[0];
  const [elemDose, setElemDose] = useState("");
  const [elemStrength, setElemStrength] = useState("");
  const [showStrength, setShowStrength] = useState(false);
  const [showSigma, setShowSigma] = useState(false);
  const [sigmaVal, setSigmaVal] = useState("");
  const [saveMsg, setSaveMsg] = useState(null);
  /* Doses are often adjusted a few days before you get round to logging it,
     so the change date is editable rather than assumed to be today. */
  const [doseDate, setDoseDate] = useState(todayStr());

  useEffect(() => {
    setVol((settings.volumeL == null ? "" : String(settings.volumeL)));
    setElemDose(String(settings[elem.doseField] ?? 0));
    setElemStrength(String(settings[elem.strengthField] ?? elem.defaultStrength));
    setSigmaVal(String(kitSigma(elem.key, settings)));
    setSaveMsg(null);
  }, [settings, elemKey]);

  const currentDose = settings[elem.doseField] ?? 0;
  const doseNum = parseFloat(elemDose);
  const strengthNum = parseFloat(elemStrength) || 0;
  const doseChanged = !isNaN(doseNum) && doseNum !== currentDose;
  const volNum = parseFloat(vol);
  const perDayDelivered = volNum > 0
    ? currentDose * strengthNum * (100 / volNum) : null;

  /* Clearing the field stores nothing, rather than storing some other tank's
     volume. The app would rather refuse to dose than dose the wrong tank. */
  const saveVolume = async () => {
    await onSaveSettings({ ...settings, volumeL: volNum > 0 ? volNum : null });
    setSaveMsg(volNum > 0
      ? "Tank volume saved."
      : "Tank volume cleared. Dosing advice will not be calculated until you enter it.");
    setTimeout(() => setSaveMsg(null), 2500);
  };

  /* Changing the dose is itself the event, so one action updates the setting
     and appends to that element's history. No separate "record change" step. */
  const saveDose = async () => {
    if (isNaN(doseNum)) return;
    await onAddDoseChange({ date: doseDate, ml: doseNum, element: elemKey, note: "" });
    setSaveMsg(`${elem.label} dose set to ${doseNum} mL/day, recorded for ${fmtDate(doseDate)}.`);
    setDoseDate(todayStr());
    setTimeout(() => setSaveMsg(null), 3500);
  };

  const saveSigma = async () => {
    const v = parseFloat(sigmaVal);
    if (!(v > 0)) return;
    await onSaveSettings({ ...settings, kitSigma: { ...(settings.kitSigma || {}), [elem.key]: v } });
    setSaveMsg("Kit precision saved.");
    setTimeout(() => setSaveMsg(null), 2500);
  };

  const saveStrength = async () => {
    await onSaveSettings({ ...settings, [elem.strengthField]: strengthNum || elem.defaultStrength });
    setSaveMsg("Product strength saved.");
    setTimeout(() => setSaveMsg(null), 2500);
  };

  const elemLog = useMemo(
    () => doseLog.filter((d) => (d.element || "alkalinity") === elemKey)
      .sort(byNewest),
    [doseLog, elemKey]);

  // Correction calculator state
  const correctable = paramDefs.filter((d) => CORRECTIONS[d.key]);
  const [calcParam, setCalcParam] = useState(correctable[0] ? correctable[0].key : "alkalinity");
  const [calcTarget, setCalcTarget] = useState("");
  const calcDef = paramDefs.find((d) => d.key === calcParam) || correctable[0];
  const calcCurrent = latestByParam && latestByParam[calcParam] ? latestByParam[calcParam].value : null;
  const correction = useMemo(
    () => computeCorrection(calcParam, calcCurrent, parseFloat(calcTarget), settings.volumeL),
    [calcParam, calcCurrent, calcTarget, settings.volumeL]);

  // Lighting log state
  const [lightDate, setLightDate] = useState(todayStr());
  const [lightNote, setLightNote] = useState("");
  const submitLighting = async (e) => {
    e.preventDefault();
    if (!lightNote.trim()) return;
    await onAddLighting({ date: lightDate, note: lightNote.trim() });
    setLightNote("");
  };

  return (
    <div>
      <SectionTitle eyebrow="Configuration" title="Setup" />

      {/* --- Tank & dosing setup --- */}
      <Card className="p-4 mb-4">
        <div className="text-sm font-black text-ink mb-1">Tank</div>
        <Field label="Volume (L)">
          <div className="flex gap-2">
            <input type="number" inputMode="decimal" step="1" value={vol} onChange={(e) => setVol(e.target.value)} className={inputCls} />
            <Btn onClick={saveVolume} className="shrink-0">
              <span className="flex items-center gap-1.5"><Save size={14} /> Save</span>
            </Btn>
          </div>
        </Field>

        {/* Which alkalinity kit you use decides how long the app waits before
            it will read a trend. A more precise kit clears its own error in
            fewer days, so it earns a verdict sooner — the app was assuming
            two days for everyone, which is too short on a slow tank with a
            coarse kit and a wasted day on a fast one. */}
        {/* One kit per element. A single choice was guaranteed to be wrong for
            something: Hanna's alkalinity checker is the most precise in common
            use and its calcium checker is among the least, and hardly anyone
            buys one brand for all three. */}
        {[
          { key: "alkalinity", label: "Alkalinity", unit: "dKH" },
          { key: "calcium", label: "Calcium", unit: "ppm" },
          { key: "magnesium", label: "Magnesium", unit: "ppm" },
        ].map((el) => (
          <Field key={el.key} label={`${el.label} test kit`}>
            <select className={inputCls}
              value={(settings.testKits && settings.testKits[el.key]) || settings.testKit || "hanna"}
              onChange={(e) => onSaveSettings({ ...settings,
                testKits: { ...(settings.testKits || {}), [el.key]: e.target.value } })}>
              {Object.entries(KIT_PRECISION).map(([k, v]) => (
                <option key={k} value={k}>{v.label} (±{v[el.key]}{el.unit})</option>
              ))}
            </select>
          </Field>
        ))}
        <p className="text-[11px] text-ink2 mt-1 leading-snug">
          Precision decides how long the app waits before it will read a trend —
          a better kit earns a verdict sooner.{" "}
          {settings.volumeL > 0 ? (
            <>
              Alkalinity currently needs{" "}
              {settleWindow("alkalinity",
                (settings.dailyDoseMl || 0) * (settings.dkhPerMlPer100L || 0) * 100 / settings.volumeL,
                settings)}{" "}
              days of readings on this tank.
            </>
          ) : (
            <>How many days that takes on this tank depends on your net volume, which isn't set yet.</>
          )}
        </p>
      </Card>

      <Card className="p-4 mb-4">
        <div className="text-sm font-black text-ink mb-3">Dosing</div>

        <Field label="Element">
          <select value={elemKey} onChange={(e) => setElemKey(e.target.value)} className={inputCls}>
            {DOSE_ELEMENTS.map((e) => <option key={e.key} value={e.key}>{e.label}</option>)}
          </select>
        </Field>

        {/* One field for the dose. Changing it IS the event — it records itself
            with today's date, so there's no second "new rate" box to fill in. */}
        <div className="mt-3">
          <div className="grid grid-cols-2 gap-2">
            <Field label={`Dose (mL/day)`}>
              <input type="number" step="0.1" inputMode="decimal" value={elemDose}
                onChange={(e) => setElemDose(e.target.value)} className={inputCls}
                placeholder="0 if not dosed" />
            </Field>
            <Field label="Date changed">
              <input type="date" value={doseDate} onChange={(e) => setDoseDate(e.target.value)}
                className={inputCls} max={todayStr()} />
            </Field>
          </div>
          <div className="mt-2">
            <Btn onClick={saveDose} disabled={!doseChanged} className="w-full sm:w-auto">
              <span className="flex items-center justify-center gap-1.5"><Save size={14} /> Save dose change</span>
            </Btn>
          </div>
          {doseChanged && (
            <p className="text-[11px] font-bold text-teal-brand mt-1.5">
              Records a change on {fmtDate(doseDate)}{currentDose > 0 ? `, from ${currentDose} to ${elemDose} mL/day` : `, starting at ${elemDose} mL/day`}.
            </p>
          )}
          {!doseChanged && currentDose > 0 && strengthNum > 0 && (
            <p className="text-[11px] font-bold text-teal-brand mt-1.5">
              {perDayDelivered != null
                ? `Delivering about ${fmtAmount(perDayDelivered)} ${elem.unit} per day to ${vol}L.`
                : "What this delivers per day cannot be worked out until the tank's net volume is set above."}
            </p>
          )}
          {saveMsg && <p className="text-[11px] font-extrabold text-teal-brand mt-1.5">{saveMsg}</p>}
        </div>

        {/* Strength is set once per product, so it stays tucked away. */}
        <button onClick={() => setShowStrength((v) => !v)}
          className="mt-3 w-full flex items-center justify-between gap-2 py-2 border-t border-app">
          <span className="text-[12px] font-bold text-ink2 min-w-0 truncate">
            Product strength: <span className="text-ink font-black">{elemStrength} {elem.strengthLabel}</span>
          </span>
          <span className="text-[11px] font-extrabold text-teal-brand flex items-center gap-1 shrink-0">
            {showStrength ? "Close" : "Change"} {showStrength ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          </span>
        </button>
        {showStrength && (
          <div className="mt-2 rounded-xl p-3 bg-app border border-app">
            <Field label={`Strength (${elem.strengthLabel})`}>
              <div className="flex gap-2">
                <input type="number" inputMode="decimal" step={elem.strengthStep} value={elemStrength}
                  onChange={(e) => setElemStrength(e.target.value)} className={inputCls} />
                <Btn onClick={saveStrength} className="shrink-0">
                  <span className="flex items-center gap-1.5"><Save size={14} /> Save</span>
                </Btn>
              </div>
            </Field>
            <p className="text-[11px] text-ink2 font-medium mt-2 leading-relaxed">{elem.hint}</p>
          </div>
        )}

        {/* Kit precision drives the testing-cadence advice */}
        <button onClick={() => setShowSigma((v) => !v)}
          className="mt-3 w-full flex items-center justify-between gap-2 py-2 border-t border-app">
          <span className="text-[12px] font-bold text-ink2 min-w-0 truncate">
            Test kit precision: <span className="text-ink font-black">±{kitSigma(elem.key, settings)} {elem.unit}</span>
          </span>
          <span className="text-[11px] font-extrabold text-teal-brand flex items-center gap-1 shrink-0">
            {showSigma ? "Close" : "Change"} {showSigma ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          </span>
        </button>
        {showSigma && (
          <div className="mt-2 rounded-xl p-3 bg-app border border-app">
            <Field label={`Repeat-test spread (${elem.unit})`}>
              <div className="flex gap-2">
                <input type="number" inputMode="decimal" step="0.001" value={sigmaVal}
                  onChange={(e) => setSigmaVal(e.target.value)} className={inputCls} />
                <Btn onClick={saveSigma} className="shrink-0">
                  <span className="flex items-center gap-1.5"><Save size={14} /> Save</span>
                </Btn>
              </div>
            </Field>
            <p className="text-[11px] text-ink2 font-medium mt-2 leading-relaxed">
              How much your readings vary when you test the same water twice — not how much the tank
              varies. Titration kits are typically about one drop's worth; digital checkers quote a
              figure on the box. This drives the testing-frequency advice in Insights.
            </p>
          </div>
        )}

        {/* This element's change history */}
        {elemLog.length > 0 && (
          <div className="mt-3 pt-3 border-t border-app">
            <div className="text-[11px] font-extrabold uppercase tracking-wide text-ink2 mb-1.5">
              {elem.label} changes
            </div>
            <div className="divide-y divide-app">
              {elemLog.slice(0, 5).map((d) => (
                <div key={d.id} className="flex items-center justify-between py-2">
                  <span className="text-[13px] font-bold text-ink">{d.ml} mL/day</span>
                  <div className="flex items-center gap-3">
                    <span className="text-[11px] text-ink2 font-semibold">{fmtShort(d.date)}</span>
                    <DeleteButton onDelete={() => onDeleteDoseChange(d.id)} size={13} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </Card>

      {/* --- Full dosing history across all elements --- */}
      {doseLog.length > 0 && (
        <InfoBlock icon={Activity} eyebrow="History" title="Doser changes" tone="#45605F"
          collapsible
          summary={doseLog.length
            ? `${doseLog.length} change${doseLog.length === 1 ? "" : "s"} recorded`
            : "Nothing recorded yet"}>
          <div className="divide-y divide-app">
            {[...doseLog].sort(byNewest).map((d) => {
              const el = DOSE_ELEMENTS.find((e) => e.key === (d.element || "alkalinity"));
              const prior = [...doseLog]
                .filter((x) => (x.element || "alkalinity") === (d.element || "alkalinity") && x.date < d.date)
                .sort(byNewest)[0];
              const delta = prior ? d.ml - prior.ml : null;
              return (
                <div key={d.id} className="flex items-center justify-between gap-2 py-2.5">
                  <div className="min-w-0">
                    <div className="text-[13px] font-black text-ink">
                      {el ? el.label : "Alkalinity"} → {d.ml} mL/day
                    </div>
                    <div className="text-[11px] text-ink2 font-semibold">
                      {fmtDate(d.date)}
                      {delta != null && delta !== 0 && (
                        <span style={{ color: delta > 0 ? "#0B7C86" : "#A2621B" }}>
                          {" · "}{delta > 0 ? "up" : "down"} {Math.abs(delta).toFixed(1)} mL from {prior.ml}
                        </span>
                      )}
                      {prior == null && " · first recorded"}
                    </div>
                  </div>
                  <DeleteButton onDelete={() => onDeleteDoseChange(d.id)} size={13} />
                </div>
              );
            })}
          </div>
          <p className="text-[12px] text-ink2 font-medium leading-relaxed mt-3">
            Every change here also appears as a marker on that element's own chart, so you can see what each adjustment actually did.
          </p>
        </InfoBlock>
      )}

      {/* --- One-off corrections, as their own kind of entry ---

          A correction is not a dose change and is not a reading, and it was
          previously neither listed nor exported anywhere. The engines have
          always read it — it is what stops a rise being scored as the tank
          suddenly needing less — so the app was reasoning permanently from
          something the user had no way to look at, check or take back. Its
          own block rather than a row in Doser changes, because the two hold
          different quantities: a dose change is mL per day and stays set, a
          correction is a single addition in mL and is over once it is in. */}
      {corrections.length > 0 && (
        <InfoBlock icon={Calculator} eyebrow="History" title="One-off corrections" tone="#B8541A"
          collapsible
          summary={`${corrections.length} correction${corrections.length === 1 ? "" : "s"} logged`}>
          <div className="divide-y divide-app">
            {[...corrections].sort(byNewest).map((c) => {
              const el = DOSE_ELEMENTS.find((e) => e.key === (c.element || "alkalinity"));
              const label = el ? el.label.toLowerCase() : "alkalinity";
              const down = c.direction === "down" || c.ml < 0;
              return (
                <div key={c.id} className="flex items-center justify-between gap-2 py-2.5">
                  <div className="min-w-0">
                    <div className="text-[13px] font-black text-ink">
                      {fmtAmount(Math.abs(c.ml))} mL of {label}
                    </div>
                    <div className="text-[11px] text-ink2 font-semibold">
                      {fmtDate(c.date)}{c.time ? ` · ${c.time}` : ""}
                      {" · "}{down ? "to bring it down" : "one-off, on top of the daily dose"}
                    </div>
                  </div>
                  {onDeleteCorrection && (
                    <DeleteButton onDelete={() => onDeleteCorrection(c.id)} size={13}
                      confirmMessage="Correction removed" />
                  )}
                </div>
              );
            })}
          </div>
          <p className="text-[12px] text-ink2 font-medium leading-relaxed mt-3">
            The app treats the rise these caused as your doing rather than as the tank needing less,
            so they stay in the reasoning for as long as they are listed here. Removing one you
            logged by mistake takes it back out of that reasoning too.
          </p>
        </InfoBlock>
      )}

      {/* --- 9. Correction calculator --- */}
      <InfoBlock icon={Calculator} eyebrow="Actions" title="Correction calculator" tone="#B8541A"
        collapsible
        summary="Work out a one-off dose to move a parameter">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
          <Field label="Parameter">
            <select value={calcParam} onChange={(e) => { setCalcParam(e.target.value); setCalcTarget(""); }} className={inputCls}>
              {correctable.map((d) => <option key={d.key} value={d.key}>{d.label}</option>)}
            </select>
          </Field>
          <Field label={`Target${calcDef && calcDef.unit ? ` (${calcDef.unit})` : ""}`}>
            <input type="number" inputMode="decimal" step={calcDef ? calcDef.step : 0.1} value={calcTarget}
              onChange={(e) => setCalcTarget(e.target.value)} className={inputCls}
              placeholder={calcDef ? `${calcDef.min}–${calcDef.max}` : ""} />
          </Field>
        </div>
        {calcCurrent == null ? (
          <p className="text-[13px] text-ink2 font-medium">No current reading logged for {calcDef ? calcDef.label.toLowerCase() : "this parameter"} — log one first.</p>
        ) : !(settings.volumeL > 0) ? (
          <p className="text-[13px] text-ink2 font-medium">
            Currently {calcCurrent}{calcDef.unit}. Set your tank's net volume above before this
            can be worked out — every amount here is per litre of water.
          </p>
        ) : !correction ? (
          <p className="text-[13px] text-ink2 font-medium">
            Currently {calcCurrent}{calcDef.unit}. Enter a target to see what it takes to get there in {settings.volumeL}L.
          </p>
        ) : !correction.raising ? (
          <div className="rounded-xl p-3" style={{ background: "#1D6FA512", border: "1px solid #1D6FA540" }}>
            <p className="text-[13px] text-ink font-medium leading-relaxed">
              You're aiming to <strong>lower</strong> {calcDef.label.toLowerCase()} from {calcCurrent} to {correction.delta + calcCurrent}{calcDef.unit}. There's no additive for this — the safe route is dilution through water changes, or simply reducing dosing and letting consumption pull it down. Use the water change model below to see how much each change would move it.
            </p>
          </div>
        ) : (
          <div className="rounded-xl p-3" style={{ background: "#B8541A12", border: "1px solid #B8541A40" }}>
            <p className="text-[13px] text-ink font-medium leading-relaxed mb-2">
              Raising {calcDef.label.toLowerCase()} by {correction.delta.toFixed(correction.delta < 1 ? 2 : 0)}{correction.unit} in {settings.volumeL}L.
              {correction.days > 1
                ? ` That exceeds the safe change of ${correction.maxPerDay}${correction.unit} per day, so spread it over ${correction.days} days.`
                : " That's within a safe single-day change."}
            </p>
            <div className="space-y-2">
              {correction.products.map((p) => (
                <div key={p.name} className="p-2 rounded-lg bg-white">
                  <div className="text-[13px] font-black text-ink">{p.name}</div>
                  <div className="text-[13px] font-bold" style={{ color: "#B8541A" }}>
                    {fmtDoseMass(p.totalG)} total
                    {correction.days > 1 && ` · ${fmtDoseMass(p.perDayG)}/day for ${correction.days} days`}
                  </div>
                  <div className="text-[11px] text-ink2 font-semibold mt-0.5">{p.note}</div>
                </div>
              ))}
              {correction.tiny && (
                <p className="text-[11px] text-ink2 font-medium leading-relaxed mt-2">
                  These amounts are below what a kitchen scale weighs accurately. Rather than measuring the powder directly, dissolve a larger known weight into a litre of RODI and dose a measured fraction of that solution.
                </p>
              )}
            </div>
            <p className="text-[11px] text-ink2 font-medium mt-2">
              Dissolve in RODI before adding, and add to high flow. Re-test before dosing again rather than stacking doses on an assumption.
            </p>
          </div>
        )}
      </InfoBlock>


      {/* --- Lighting log --- */}
      <InfoBlock icon={SunMedium} eyebrow="AI Blade" title="Lighting changes" tone="#926A09"
        collapsible
        summary={lighting.length
          ? `${lighting.length} change${lighting.length === 1 ? "" : "s"} · last ${fmtShort(lighting[0].date)}`
          : "Nothing recorded yet"}>
        <form onSubmit={submitLighting} className="grid grid-cols-1 sm:grid-cols-4 gap-3 mb-3">
          <Field label="Date">
            <input type="date" value={lightDate} onChange={(e) => setLightDate(e.target.value)} className={inputCls} max={todayStr()} />
          </Field>
          <Field label="What changed" className="sm:col-span-3">
            <input type="text" value={lightNote} onChange={(e) => setLightNote(e.target.value)} className={inputCls}
              placeholder="e.g. bumped blue channel to 80%" />
          </Field>
          <div className="sm:col-span-4">
            <Btn type="submit" className="w-full sm:w-auto">
              <span className="flex items-center justify-center gap-1.5"><Plus size={14} /> Log change</span>
            </Btn>
          </div>
        </form>
        {lighting.length === 0 ? (
          <p className="text-[13px] text-ink2 font-medium">No lighting changes logged yet.</p>
        ) : (
          <div className="divide-y divide-app">
            {lighting.slice(0, 8).map((l) => (
              <div key={l.id} className="flex items-start justify-between gap-2 py-2">
                <div className="min-w-0">
                  <div className="text-[11px] text-ink2 font-bold">{fmtDate(l.date)}</div>
                  <div className="text-[13px] font-semibold text-ink">{l.note}</div>
                </div>
                <DeleteButton onDelete={() => onDeleteLighting(l.id)} />
              </div>
            ))}
          </div>
        )}
        <p className="text-[12px] text-ink2 font-medium leading-relaxed mt-3">
          Each change drops a marker on every parameter chart, so you can see whether a lighting tweak moved your alkalinity demand.
        </p>
      </InfoBlock>

      {/* --- 11. Backup and export --- */}
      {/* Anything hidden has to be findable again, or dismissing becomes its own
          trap — a note you can never get back. */}
      <InfoBlock icon={CheckCircle2} eyebrow="Acknowledged" title="Hidden notes" tone="#45605F"
        collapsible
        summary={dismissedList.length
          ? `${dismissedList.length} note${dismissedList.length === 1 ? "" : "s"} hidden`
          : "Nothing hidden"}>
        {dismissedList.length === 0 ? (
          <p className="text-[13px] text-ink2 font-medium leading-relaxed">
            Notes you hide will be listed here. They come back on their own if the situation changes —
            hiding one only silences the version you read.
          </p>
        ) : (
          <>
            <p className="text-[13px] text-ink font-medium leading-relaxed mb-3">
              These are hidden from the rest of the app. Each will return by itself if the underlying
              numbers move enough to change what it says.
            </p>
            <div className="space-y-2">
              {dismissedList.map((f) => (
                <div key={f.id} className="flex items-start justify-between gap-2 rounded-lg p-2.5 bg-app">
                  <div className="min-w-0">
                    <div className="text-[12px] font-black text-ink">{f.title}</div>
                    <div className="text-[11px] text-ink2 font-medium">
                      {(f.params || []).join(", ") || f.scope}
                    </div>
                  </div>
                  <button onClick={() => onRestoreFinding(findingKey(f))}
                    className="shrink-0 text-[11px] font-extrabold text-teal-brand">Show again</button>
                </div>
              ))}
            </div>
            <Btn variant="ghost" className="w-full mt-3" onClick={onRestoreAllFindings}>
              <span className="flex items-center justify-center gap-1.5"><RotateCcw size={13} /> Show all again</span>
            </Btn>
          </>
        )}
      </InfoBlock>

      <InfoBlock icon={Waves} eyebrow="Fun" title="Opening animation" tone="#0B7C86"
        collapsible
        summary="Watch the reef intro again">
        <p className="text-[13px] text-ink font-medium leading-relaxed mb-3">
          This plays once each time the app is opened. Tap below to watch it now.
        </p>
        <Btn className="w-full" onClick={onPlayIntro}>
          <span className="flex items-center justify-center gap-1.5"><Waves size={14} /> Play intro</span>
        </Btn>
      </InfoBlock>

      <InfoBlock icon={Download} eyebrow="Your data" title="Backup & export" tone="#45605F"
        collapsible
        defaultOpen={backupAge == null || backupAge > 14}
        summary={backupAge == null ? "No backup recorded on this device"
          : backupAge > 14 ? `Last backup ${backupAge} days ago`
          : `Backed up ${backupAge === 0 ? "today" : `${backupAge}d ago`} · ${readings.length} readings`}>
        <div className="rounded-xl p-3 mb-3" style={{ background: backupAge == null || backupAge > 14 ? "#A2621B15" : "#0B7C8612" }}>
          <p className="text-[13px] text-ink font-medium leading-relaxed">
            {/* Not "you haven't saved a backup yet" — the app cannot know that.
                `last-backup` lives in the same storage as everything else, so a
                browser that clears its data erases the record of the backup
                along with the data the backup was protecting. Saying no backup
                exists would be a guess, and it would be wrong at exactly the
                moment it matters most: a user with a good file in iCloud Drive,
                told by the only screen that could help them that there is
                nothing to recover. Report the missing record, and point at
                restore. */}
            {backupAge == null
              ? `This device has no record of a backup. That record is erased along with everything else when a browser clears its storage, so if you saved a file before, it may still be there — restore it below rather than starting again. Browser storage isn't permanent: clearing Safari, or not opening the app for a week, can erase everything, and a backup file is the only copy that survives that.`
              : backupAge > 14
              ? `Your last backup was ${backupAge} days ago. Worth saving a fresh one.`
              : `Last backup ${backupAge === 0 ? "today" : backupAge === 1 ? "yesterday" : `${backupAge} days ago`}.`}
          </p>
          {persistState && (
            <p className="text-[11px] text-ink2 font-medium mt-1.5">
              {persistState.granted
                ? "This browser has agreed to keep your data rather than evicting it automatically."
                : persistState.supported
                ? "This browser wouldn't guarantee your data against automatic eviction, which makes backups more important."
                : "This browser can't guarantee your data against automatic eviction, which makes backups more important."}
            </p>
          )}
        </div>

        <Btn className="w-full mb-2" onClick={async () => {
          const b = await buildBackup();
          downloadJson(b, `dans-tank-backup-${todayStr()}.json`);
          await saveKey("last-backup", b.createdAt);
          setBackupAt(b.createdAt);
          setRestoreMsg("Backup saved. Keep it somewhere that isn't this phone — Files, iCloud Drive, or emailed to yourself.");
          setTimeout(() => setRestoreMsg(null), 8000);
        }}>
          <span className="flex items-center justify-center gap-1.5"><Save size={14} /> Save backup file</span>
        </Btn>

        {/* One tap to Files, iCloud Drive or Mail, on the platforms where the
            automatic file below does not exist. Not recorded as a backup: the
            share sheet reports dismissal and success identically in practice,
            so a `last-backup` written here would sometimes claim a copy that
            was cancelled. */}
        {shareSupported() && (
          <Btn variant="ghost" className="w-full mb-2" onClick={async () => {
            const res = await shareBackup(await buildBackup());
            setRestoreMsg(res.ok
              ? "Backup shared. If you saved it to Files or iCloud Drive, it will survive anything that happens to this browser."
              : "Sharing was cancelled — nothing was saved.");
            setTimeout(() => setRestoreMsg(null), 8000);
          }}>
            <span className="flex items-center justify-center gap-1.5"><Upload size={14} /> Share a backup file</span>
          </Btn>
        )}

        <label className="block">
          <span className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl border-2 border-app px-4 py-2.5 text-[13px] font-extrabold text-ink2 cursor-pointer active:bg-app">
            <Upload size={14} /> Restore from a backup
          </span>
          <input type="file" accept=".json,application/json" className="hidden"
            onChange={async (e) => {
              const file = e.target.files && e.target.files[0];
              e.target.value = "";
              if (!file) return;
              try {
                const parsed = JSON.parse(await file.text());
                const info = inspectBackup(parsed, {
                  "readings": readings, "icp-tests": icps, "water-changes": waterChanges,
                  "dose-log": doseLog, "lighting-log": lighting, "task-log": taskLog,
                  "tasks-custom": customTasks,
                });
                if (!info.ok) { setRestoreMsg(info.reason); return; }
                setPending({ parsed, info });
                setRestoreMsg(null);
              } catch (err) {
                setRestoreMsg("That file couldn't be read as a backup.");
              }
            }} />
        </label>

        {pending && (
          <div className="mt-3 rounded-xl border-2 p-3" style={{ borderColor: "#0B7C8640", background: "#0B7C8608" }}>
            <div className="text-[11px] font-extrabold uppercase tracking-wide text-ink2 mb-1.5">
              Backup from {pending.info.createdAt ? fmtDate(pending.info.createdAt.slice(0, 10)) : "an unknown date"}
            </div>
            {/* Entries the file holds but the app cannot read. Counting them as
                importable made the preview promise more than the restore would
                deliver, and the difference vanished without a word — the worst
                shape a data-loss bug can take, because nothing looks wrong. */}
            {pending.info.skipped > 0 && (
              <p className="text-[11px] font-bold mb-2 rounded-lg px-2 py-1.5"
                style={{ color: "#B8541A", background: "#B8541A14" }}>
                {pending.info.skipped} {pending.info.skipped === 1 ? "entry" : "entries"} in
                this file can't be read and won't be restored. The counts below are what
                will actually come in.
              </p>
            )}
            <div className="space-y-1 mb-2">
              {pending.info.summary.map((row) => (
                <div key={row.key} className="flex items-center justify-between gap-2">
                  <span className="text-[12px] font-bold text-ink2">{BACKUP_LABELS[row.key] || row.key}</span>
                  <span className="text-[12px] font-black text-ink">
                    {row.total} in file · <span style={{ color: row.fresh ? "#0B7C86" : "#5F7575" }}>{row.fresh} new</span>
                  </span>
                </div>
              ))}
            </div>
            <p className="text-[11px] text-ink2 font-medium leading-relaxed mb-2">
              Restoring adds anything missing and leaves what you already have alone, so nothing is
              overwritten or duplicated. Running the same file twice changes nothing the second time.
            </p>
            <div className="grid grid-cols-2 gap-2">
              <Btn variant="ghost" onClick={() => setPending(null)}>Cancel</Btn>
              <Btn onClick={async () => {
                const merged = await restoreBackup(pending.parsed, {
                  "readings": readings, "icp-tests": icps, "water-changes": waterChanges,
                  "dose-log": doseLog, "lighting-log": lighting, "task-log": taskLog,
                  "tasks-custom": customTasks,
                }, true);
                onRestored(merged);
                const added = pending.info.summary.reduce((a, r) => a + r.fresh, 0);
                setPending(null);
                setRestoreMsg(added ? `Restored — ${added} entries added.` : "Nothing new to add; your data already matched that file.");
                setTimeout(() => setRestoreMsg(null), 8000);
              }}>Restore</Btn>
            </div>
          </div>
        )}

        {restoreMsg && (
          <p className="text-[12px] font-bold text-ink mt-2 leading-relaxed">{restoreMsg}</p>
        )}

        {/* The automatic backup file — Chromium only, which is why the share
            button above exists. Once a file is chosen the app rewrites it
            daily with no further prompts; a lapsed permission degrades to a
            tap here rather than failing silently. */}
        {fileHandleSupported() && (
          <div className="mt-4 pt-3 border-t border-app">
            <p className="text-[13px] text-ink font-medium leading-relaxed mb-2">
              {fileState
                ? fileState.needsTap
                  ? "A backup file is set up, but the browser needs your permission again to keep writing it."
                  : "This browser rewrites your chosen backup file automatically, about once a day. If the file lives in a synced folder, it survives anything that happens to this device."
                : "This browser can keep one backup file up to date by itself — choose where once, and the app rewrites it about once a day with no further steps."}
            </p>
            {fileState && fileState.needsTap ? (
              <Btn className="w-full sm:w-auto" onClick={async () => {
                const res = await regrantAndWrite(fileState.handle, await buildBackup());
                setRestoreMsg(res.ok ? "Backup file updated." : "The browser did not allow it — the file was not written.");
                setTimeout(() => setRestoreMsg(null), 8000);
                await refreshAuto();
              }}>Allow updates again</Btn>
            ) : (
              <Btn variant="ghost" className="w-full sm:w-auto" onClick={async () => {
                try {
                  const handle = await window.showSaveFilePicker({
                    suggestedName: "dans-tank-backup.json",
                    types: [{ description: "Tank backup", accept: { "application/json": [".json"] } }],
                  });
                  await saveFileHandle(handle);
                  await writeBackupToHandle(handle, await buildBackup());
                  setRestoreMsg("Backup file created. The app will keep it up to date from here.");
                  setTimeout(() => setRestoreMsg(null), 8000);
                  await refreshAuto();
                } catch { /* picker dismissed — nothing chosen, nothing changed */ }
              }}>{fileState ? "Choose a different file" : "Choose where to keep it"}</Btn>
            )}
          </div>
        )}

        {/* The snapshot ring. Deliberately described as what it is: it lives
            in the same origin as the data it copies and dies with it, so
            calling it a backup would promise a protection it cannot give. */}
        {snapshots.length > 0 && (
          <div className="mt-4 pt-3 border-t border-app">
            <p className="text-[13px] text-ink font-medium leading-relaxed mb-2">
              The app also keeps its own last {snapshots.length === 1 ? "snapshot" : `${snapshots.length} daily snapshots`} of
              everything, on this device. They undo a mistake — a bad restore, an accidental
              delete — but they are erased along with everything else if the browser clears
              its storage, so they are not a backup.
            </p>
            <div className="space-y-1">
              {snapshots.map((s) => (
                <div key={s.key} className="flex items-center justify-between gap-2">
                  <span className="text-[12px] font-bold text-ink2">
                    {fmtDate(s.key.slice(0, 10))} · {s.counts.readings || 0} readings
                  </span>
                  <Btn variant="ghost" onClick={async () => {
                    const merged = await restoreSnapshot(s.key, {
                      "readings": readings, "icp-tests": icps, "water-changes": waterChanges,
                      "dose-log": doseLog, "lighting-log": lighting, "task-log": taskLog,
                      "tasks-custom": customTasks,
                    }, true);
                    if (merged) onRestored(merged);
                    setRestoreMsg(merged ? "Snapshot restored — anything missing was added, nothing was overwritten." : "That snapshot could not be read.");
                    setTimeout(() => setRestoreMsg(null), 8000);
                  }}>Restore</Btn>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-4 pt-3 border-t border-app">
          <p className="text-[13px] text-ink font-medium leading-relaxed mb-2">
            The CSV below is for reading — open it in a spreadsheet or share it. It can't be
            restored from, because it flattens ICP panels into rows and doesn't include your settings.
          </p>
          <Btn variant="ghost" className="w-full sm:w-auto"
            onClick={() => downloadCsv(
              buildCsv({ readings, icps, lighting, taskLog, doseLog, waterChanges, allTasks, corrections }),
              `dans-tank-${todayStr()}.csv`)}>
            <span className="flex items-center justify-center gap-1.5"><Download size={14} /> Download CSV</span>
          </Btn>
        </div>

        <p className="text-[11px] text-ink2 font-medium mt-3">
          {readings.length} readings · {icps.length} ICP panels · {waterChanges.length} water changes · {doseLog.length} dose changes
        </p>
      </InfoBlock>
    </div>
  );
}
