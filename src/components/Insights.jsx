import { useMemo, useState } from 'react'
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Btn, SectionTitle } from './DoseExpectation.jsx'
import { Card } from './ErrorBoundary.jsx'
import { niceAxis } from './ZoomableChart.jsx'
import { Activity, Beaker, Calculator, Check, ChevronDown, ChevronUp, Droplets, Gauge, RotateCcw, Scale, Target, Waves } from '../icons.jsx'
import { computeSkeletonMass } from '../lib/analytics/calcification.js'
import { DOSE_ELEMENTS, computeConsumption } from '../lib/analytics/consumption.js'
import { computeDemandSeries } from '../lib/analytics/demand.js'
import { calibrateDoseStrength } from '../lib/analytics/dose-strength.js'
import { computeDoseAdvice, computeIonicBalance } from '../lib/analytics/drift.js'
import { computeCalibration } from '../lib/analytics/icp-calibration.js'
import { computeIcpTrends, icpGroupOf, icpRef, icpStatus } from '../lib/analytics/icp-reference.js'
import { computeNutrientProduction, computeNutrientRatio } from '../lib/analytics/nutrients.js'
import { computeControl } from '../lib/analytics/reading-meaning.js'
import { SALT_MIX, computeSaltComparison } from '../lib/analytics/salt-baseline.js'
import { fmtAmount, fmtVal } from '../lib/analytics/time-in-range.js'
import { byNewest } from '../lib/analytics/time-of-day.js'
import { fmtDate } from '../lib/dates.js'
import { previewStrengthChange } from '../lib/dosing/corrected-strength.js'
import { joinList } from '../lib/narrative-engine.js'

/* ---------------------------------- Insights ---------------------------------- */

/* Collapsible by default in Insights: six long analysis blocks stacked open
   made the tab a very long scroll, and you generally want one of them rather
   than all of them. `summary` shows the headline finding while collapsed so
   the list is still scannable without opening anything. */
export function InfoBlock({ icon: Icon, eyebrow, title, tone = "#0B7C86", children,
  collapsible = false, defaultOpen = false, summary = null }) {
  const [open, setOpen] = useState(defaultOpen);

  if (!collapsible) {
    return (
      <Card className="p-4 mb-4">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ background: tone + "18" }}>
            <Icon size={15} style={{ color: tone }} />
          </div>
          <div className="min-w-0">
            <div className="text-[10px] uppercase tracking-[0.13em] font-extrabold" style={{ color: tone }}>{eyebrow}</div>
            <div className="text-base font-black text-ink leading-tight">{title}</div>
          </div>
        </div>
        {children}
      </Card>
    );
  }

  return (
    <Card className="mb-3 overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="w-full flex items-center gap-2 p-4 text-left active:bg-app">
        <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ background: tone + "18" }}>
          <Icon size={15} style={{ color: tone }} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-[10px] uppercase tracking-[0.13em] font-extrabold" style={{ color: tone }}>{eyebrow}</div>
          <div className="text-base font-black text-ink leading-tight">{title}</div>
          {!open && summary && (
            <div className="text-[11px] text-ink2 font-semibold mt-0.5 truncate">{summary}</div>
          )}
        </div>
        <div className="shrink-0 w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: open ? tone + "18" : "transparent" }}>
          {open ? <ChevronUp size={16} style={{ color: tone }} /> : <ChevronDown size={16} className="text-ink2" />}
        </div>
      </button>
      {open && <div className="px-4 pb-4">{children}</div>}
    </Card>
  );
}

export function Stat({ label, value, tone }) {
  return (
    <div className="text-center min-w-0">
      <div className="text-[9px] text-ink2 uppercase tracking-wide font-extrabold">{label}</div>
      <div className="text-base font-black mt-0.5 truncate" style={{ color: tone || "#08191D" }}>{value}</div>
    </div>
  );
}

export function Insights({ readings, icps, paramDefs, settings, latestByParam,
  doseLog = [], waterChanges = [], lighting = [], findings = [], onSaveSettings,
  onSaveRange, kitChanges = {}, onReplaceKit, onUndoReplaceKit, onDismissFinding,
  onApplyAlkDose, onLogCorrection, onApplyEffect, alkPlan = null, onClearAlkPlan, corrections = [],
  onApplyCaDose, onApplyCaEffect, caPlan = null, onClearCaPlan,
  onApplyMgDose, onApplyMgEffect, mgPlan = null, onClearMgPlan }) {

  const consumption = useMemo(() => computeConsumption(readings, settings), [readings, settings]);
  const balance = useMemo(() => computeIonicBalance(readings, settings), [readings, settings]);
  const nutrients = useMemo(() => computeNutrientRatio(readings), [readings]);
  /* Same replacement dates the findings layer uses, or this panel would keep
     showing an offset the rest of the app had already retired. */
  /* The alkalinity protocol assessment — computed here so the dose row and its
     detail read from one result rather than two engines. */
  const calibration = useMemo(
    () => computeCalibration(readings, icps, paramDefs, 7, kitChanges),
    [readings, icps, paramDefs, kitChanges]);
  const calResults = calibration.results;
  const calDiag = calibration.diagnostics;
  const [calOpen, setCalOpen] = useState(null);
  const [applyOpen, setApplyOpen] = useState(null);
  const [appliedMsg, setAppliedMsg] = useState(null);
  const icpTrends = useMemo(() => computeIcpTrends(icps), [icps]);
  const saltRows = useMemo(() => computeSaltComparison(latestByParam || {}, paramDefs), [latestByParam, paramDefs]);
  const doseAdvice = useMemo(() => computeDoseAdvice(readings, doseLog, paramDefs, 30, settings), [readings, doseLog, paramDefs, settings]);

  const demandSeries = useMemo(
    () => ["alkalinity", "calcium"]
      .map((k) => computeDemandSeries(k, readings, waterChanges, settings))
      .filter((d) => d && d.status === "ok"),
    [readings, waterChanges, settings]);

  const skeleton = useMemo(
    () => (consumption && consumption.consumption != null
      ? computeSkeletonMass(consumption.consumption, settings.volumeL) : null),
    [consumption, settings.volumeL]);

  const nutrientProd = useMemo(
    () => ["nitrate", "phosphate"].map((k) => computeNutrientProduction(k, readings, waterChanges, settings)).filter(Boolean),
    [readings, waterChanges, settings]);

  const calibrations = useMemo(
    () => DOSE_ELEMENTS.map((e) => calibrateDoseStrength(e.key, readings, doseLog, waterChanges, settings)).filter(Boolean),
    [readings, doseLog, waterChanges, settings]);



  const [tirDays, setTirDays] = useState(90);
  const control = useMemo(
    () => paramDefs.map((def) => ({ def, c: computeControl(def, readings, tirDays) })).filter((x) => x.c),
    [paramDefs, readings, tirDays]);

  return (
    <div>
      <SectionTitle eyebrow="Derived analysis" title="Insights" />

      {/* --- 1. Consumption --- */}
      {/* --- Coral demand over time ---
          Deliberately NOT a dosing verdict. That call belongs to "Should you
          adjust?", which uses a short window; this is the long view of how much
          the tank consumes and whether that demand is growing. Both were
          previously giving verdicts on different windows, which read as a
          contradiction. */}
      <InfoBlock icon={Activity} eyebrow="Coral demand" title="How much your tank uses"
        collapsible
        summary={consumption && consumption.consumption != null
          ? `${consumption.consumption.toFixed(2)} dKH/day of carbonate going into skeleton`
          : "Enter your alkalinity dose to see demand"}>
        {!consumption ? (
          <p className="text-[13px] text-ink2 font-medium">Log at least three alkalinity readings in the past 30 days and this will start tracking your tank's demand.</p>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-2 mb-3">
              <Stat label="Dose delivers" value={consumption.dosePerDayDkh != null ? `${consumption.dosePerDayDkh.toFixed(2)} dKH/day` : "—"} />
              <Stat label="Corals consume (30d)" value={consumption.consumption != null ? `${consumption.consumption.toFixed(2)} dKH/day` : "—"} tone="#0B7C86" />
            </div>
            <p className="text-[13px] text-ink font-medium leading-relaxed">
              {consumption.consumption != null
                ? `Averaged over the last 30 days, your corals are drawing about ${consumption.consumption.toFixed(2)} dKH a day out of the water — that's the demand your dosing has to meet, and it's the number that grows as corals grow.`
                : `Enter your daily dose in Setup and this will work out how much the corals are actually drawing down.`}
              {consumption.consumption != null && consumption.settings.volumeL &&
                ` Across ${consumption.settings.volumeL}L that's roughly ${(consumption.consumption * consumption.settings.volumeL / 100).toFixed(2)} dKH-litres of carbonate going into skeleton every day.`}
            </p>

            {consumption.demandTrend && (
              <p className="text-[13px] text-ink font-medium leading-relaxed mt-2">
                <span className="font-black">Demand trend: </span>
                {consumption.demandTrend.direction === "rising"
                  ? `Consumption is climbing (up ${Math.abs(consumption.demandTrend.change).toFixed(3)} dKH/day across the window). That's usually coral growth, and it means your dose will need to keep creeping up to match.`
                  : consumption.demandTrend.direction === "falling"
                  ? `Consumption is falling (down ${Math.abs(consumption.demandTrend.change).toFixed(3)} dKH/day). Worth investigating — declining demand can mean corals have stopped growing, lost tissue, or that something is inhibiting calcification. Check coral appearance and magnesium.`
                  : `Consumption is steady, which suggests a mature tank with stable coral biomass.`}
              </p>
            )}

            {/* Demand over time, one chart per element the data can support. */}
            {demandSeries.length > 0 && (
              <div className="mt-3 pt-3 border-t border-app">
                <div className="text-[11px] font-extrabold uppercase tracking-wide text-ink2 mb-1">
                  Demand over time
                </div>
                <p className="text-[12px] text-ink2 font-medium leading-relaxed mb-3">
                  Each point is consumption worked out across a rolling window, with dosing and
                  water changes accounted for. The shaded band is the uncertainty on each estimate —
                  movement inside it isn't a real change.
                </p>

                {demandSeries.map((d) => {
                  const dv = d.points.flatMap((p) => [p.lo, p.hi, p.demand]);
                  const ax = niceAxis(Math.min(...dv), Math.max(...dv));
                  return (
                    <div key={d.key} className="mb-4">
                      <div className="text-[13px] font-black text-ink mb-1.5">{d.el.label}</div>
                      {/* The same two figures alkalinity gets at the top of this
                          section, shown per element so calcium isn't left as a
                          bare chart without its context. */}
                      <div className="grid grid-cols-2 gap-2 mb-2">
                        <Stat label="Dose delivers" value={`${fmtAmount(d.perDay)} ${d.unit}/day`} />
                        <Stat label={`Corals consume (${d.windowDays}d)`} value={`${fmtAmount(d.mean)} ${d.unit}/day`} tone="#0B7C86" />
                      </div>
                      <div style={{ height: 150 }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={d.points} margin={{ top: 5, right: 10, left: -6, bottom: 0 }}>
                            <CartesianGrid stroke="#E3ECEA" strokeDasharray="3 3" />
                            <XAxis dataKey="label" stroke="#5C7876" fontSize={10} fontWeight={600} minTickGap={20} />
                            <YAxis stroke="#5C7876" fontSize={10} fontWeight={600}
                              domain={ax.domain} ticks={ax.ticks} tickFormatter={ax.format} width={46} />
                            <Tooltip
                              contentStyle={{ background: "#fff", border: "1px solid #DCE7E5", borderRadius: 10, fontSize: 12, fontWeight: 700 }}
                              formatter={(v, name) => [ax.formatValue(v), name === "demand" ? `${d.unit}/day` : name]} />
                            <Line type="monotone" dataKey="hi" stroke="#0B7C86" strokeWidth={1}
                              strokeOpacity={0.3} dot={false} strokeDasharray="3 3" name="upper" />
                            <Line type="monotone" dataKey="lo" stroke="#0B7C86" strokeWidth={1}
                              strokeOpacity={0.3} dot={false} strokeDasharray="3 3" name="lower" />
                            <Line type="monotone" dataKey="demand" stroke="#0B7C86" strokeWidth={2.5}
                              dot={{ r: 3 }} name="demand" />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                      <p className="text-[12px] text-ink font-medium leading-relaxed mt-1">
                        {d.direction === "rising"
                          ? `Demand is climbing — up ${fmtAmount(Math.abs(d.change))} ${d.unit}/day across the period, which is more than the uncertainty can explain. That's usually corals growing, and it means the dose needs to keep pace.`
                          : d.direction === "falling"
                          ? `Demand is falling — down ${fmtAmount(Math.abs(d.change))} ${d.unit}/day, beyond what noise explains. Worth checking coral appearance: declining demand can mean growth has stalled or tissue has been lost.`
                          : `Demand has held steady across the period. Movement in the line is within the uncertainty band, so it reflects testing scatter rather than the tank changing.`}
                      </p>
                    </div>
                  );
                })}

                <p className="text-[11px] text-ink2 font-medium leading-relaxed">
                  Magnesium isn't charted here on purpose. Its consumption is roughly a tenth of
                  calcium's, while the test kit resolves to about ±15 ppm and each water change moves
                  it far more than a day's demand — the estimate swings from negative to positive
                  between windows, so a chart would show noise rather than your tank.
                </p>
              </div>
            )}

          </>
        )}
        <p className="text-[11px] text-ink2 font-medium leading-relaxed mt-3">
          Worked out across the last 30 days. The Dosing Wizard uses a much shorter window, so its figure will differ whenever demand has shifted recently — that's the point of having both.
        </p>
      </InfoBlock>

      {/* --- 5. Control quality --- */}
      <InfoBlock icon={Gauge} eyebrow={`Last ${tirDays} days`} title="Control & alignment" tone="#1D6FA5"
        collapsible
        summary={(() => {
          if (!control.length) return "Needs more readings";
          const tight = control.filter((x) => x.c.consistency === "tight").length;
          const loose = control.filter((x) => x.c.consistency === "loose").length;
          return loose ? `${loose} parameter${loose === 1 ? "" : "s"} moving more than ideal`
            : `${tight} of ${control.length} parameters tightly held`;
        })()}>
        <div className="flex gap-1.5 mb-3">
          {[30, 90, 180].map((d) => (
            <button key={d} onClick={() => setTirDays(d)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-extrabold border-2 transition-colors ${
                tirDays === d ? "border-[#1D6FA5] text-[#1D6FA5] bg-[#1D6FA512]" : "border-app text-ink2"}`}>
              {d}d
            </button>
          ))}
        </div>

        <p className="text-[12px] text-ink2 font-medium leading-relaxed mb-3">
          Two separate questions: how tightly does each parameter hold its own band, and does that band line up with your target? A tank can be perfectly steady and still show a low in-range score if the target is set somewhere it never goes.
        </p>

        {!control.length ? (
          <p className="text-[13px] text-ink2 font-medium">Not enough readings in this window yet.</p>
        ) : (
          <div className="space-y-4">
            {control.map(({ def, c }) => (
              <div key={def.key}>
                <div className="flex items-start justify-between gap-2 mb-1">
                  <div className="min-w-0">
                    <div className="text-[14px] font-black text-ink">{def.label}</div>
                    <div className="text-[11px] font-extrabold" style={{ color: c.tone }}>{c.headline}</div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-[13px] font-black text-ink">
                      {fmtVal(def, c.p05)}–{fmtVal(def, c.p95)}{def.unit}
                    </div>
                    <div className="text-[10px] text-ink2 font-bold">usual range</div>
                  </div>
                </div>

                {/* Consistency: how tight the tank's own band is */}
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-extrabold uppercase text-ink2 w-20 shrink-0">Consistency</span>
                  <div className="h-2 rounded-full bg-app overflow-hidden flex-1">
                    <div className="h-full rounded-full transition-all"
                      style={{ width: `${c.consistencyScore * 100}%`, background: c.consistencyColor }} />
                  </div>
                  <span className="text-[10px] font-bold w-24 text-right shrink-0" style={{ color: c.consistencyColor }}>{c.metricLabel || c.consistency}</span>
                </div>

                {/* Alignment: how much of that band sits inside the target */}
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-extrabold uppercase text-ink2 w-20 shrink-0">In target</span>
                  <div className="h-2 rounded-full bg-app overflow-hidden flex-1">
                    <div className="h-full rounded-full transition-all"
                      style={{ width: `${c.pct}%`, background: c.pct >= 85 ? "#0B7C86" : c.consistency === "tight" ? "#1D6FA5" : "#A2621B" }} />
                  </div>
                  <span className="text-[10px] font-bold text-ink2 w-16 text-right shrink-0">{c.pct}%</span>
                </div>
                <div className="text-[10px] text-ink2 font-semibold mt-1 ml-[88px]">
                  {c.inRange} of {c.rows} in target{c.below > 0 && ` · ${c.below} below`}{c.above > 0 && ` · ${c.above} above`}
                </div>

                <p className="text-[12px] text-ink font-medium leading-relaxed mt-1.5">{c.note}</p>
                {c.contextNote && (
                  <p className="text-[12px] text-ink2 font-medium leading-relaxed mt-1.5">{c.contextNote}</p>
                )}

                {c.suggestWorth && (
                  <div className="mt-2 flex items-center justify-between gap-2 p-2 rounded-lg" style={{ background: "#1D6FA512" }}>
                    <div className="text-[12px] font-bold text-ink min-w-0">
                      Your tank actually runs {fmtVal(def, c.suggested.min)}–{fmtVal(def, c.suggested.max)}{def.unit}
                      <span className="text-ink2 font-semibold"> (target is {def.min}–{def.max}{def.unit})</span>
                    </div>
                    <button onClick={() => onSaveRange(def.key, c.suggested.min, c.suggested.max)}
                      className="text-[11px] font-extrabold px-2.5 py-1.5 rounded-lg border-2 shrink-0"
                      style={{ color: "#1D6FA5", borderColor: "#1D6FA555" }}>
                      Use this
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        <p className="text-[12px] text-ink2 font-medium leading-relaxed mt-3">
          A low in-target score with tight consistency is not a husbandry problem — it means the target needs moving. Only a loose spread genuinely indicates instability, because that is the swing corals actually feel.
        </p>
      </InfoBlock>

      {/* --- 2. Ionic balance --- */}
      <InfoBlock icon={Scale} eyebrow="Chemistry" title="Calcium & alkalinity balance" tone="#7B4FCB"
        collapsible
        summary={!balance ? "Needs more readings"
          : balance.status !== "ok" ? "Needs your dosing figures"
          : balance.verdict === "balanced" ? `Consumed in proportion (${balance.ratio.toFixed(1)} ppm per dKH)`
          : `${balance.ratio.toFixed(1)} ppm per dKH — outside the ${balance.band[0]}–${balance.band[1]} expected`}>
        {!balance ? (
          <p className="text-[13px] text-ink2 font-medium">Needs at least two alkalinity and two calcium readings in the past 60 days.</p>
        ) : balance.status !== "ok" ? (
          <>
            <p className="text-[13px] text-ink font-medium leading-relaxed">{balance.note}</p>
            {balance.mgNote && (
              <p className="text-[13px] font-medium leading-relaxed mt-3 pt-3 border-t border-app"
                 style={{ color: balance.mgNote.ok ? "#08191D" : "#8A5A00" }}>{balance.mgNote.text}</p>
            )}
          </>
        ) : (
          <>
            <p className="text-[13px] text-ink font-medium leading-relaxed mb-3">
              Corals build skeleton from calcium and carbonate together, so calcification
              consumes both in a fixed proportion — roughly {balance.band[0]}–{balance.band[1]} ppm
              of calcium for every 1 dKH of alkalinity. If your tank consumes them in that
              proportion, coral growth explains the whole picture. If it doesn't, something
              else is at work.
            </p>

            <div className="rounded-xl p-3 mb-3 bg-app border border-app">
              <div className="text-[11px] font-extrabold uppercase tracking-wide text-ink2 mb-2">
                What your tank consumes each day
              </div>
              <p className="text-[11px] text-ink2 font-medium leading-relaxed mb-2">
                Consumption is what you dose minus whatever the level drifted — measured over the last 60 days.
              </p>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[12px] font-bold text-ink2">Alkalinity consumed</span>
                  <span className="text-[13px] font-black text-ink">{balance.alkConsumed.toFixed(2)} dKH/day</span>
                </div>
                <div className="text-[10px] text-ink2 font-semibold text-right -mt-1">
                  dosing {fmtAmount(balance.alkDose)} − drift {balance.alkSlope >= 0 ? "+" : ""}{fmtAmount(balance.alkSlope)}
                </div>
                <div className="flex items-center justify-between gap-2 pt-1.5 border-t border-app">
                  <span className="text-[12px] font-bold text-ink2">Calcium consumed</span>
                  <span className="text-[13px] font-black text-ink">{balance.caConsumed.toFixed(1)} ppm/day</span>
                </div>
                <div className="text-[10px] text-ink2 font-semibold text-right -mt-1">
                  dosing {fmtAmount(balance.caDose)} − drift {balance.caSlope >= 0 ? "+" : ""}{fmtAmount(balance.caSlope)}
                </div>
                <div className="flex items-center justify-between gap-2 pt-1.5 border-t border-app">
                  <span className="text-[12px] font-bold text-ink2">That's a ratio of</span>
                  <span className="text-[15px] font-black"
                    style={{ color: balance.verdict === "balanced" ? "#0B7C86" : "#A2621B" }}>
                    {balance.ratio.toFixed(1)} ppm per dKH
                  </span>
                </div>
                <div className="text-[10px] text-ink2 font-semibold text-right -mt-1">
                  calcification produces {balance.band[0]}–{balance.band[1]}
                </div>
              </div>
            </div>

            <p className="text-[13px] text-ink font-medium leading-relaxed">{balance.note}</p>

            {balance.mgNote && (
              <p className="text-[13px] font-medium leading-relaxed mt-3 pt-3 border-t border-app"
                 style={{ color: balance.mgNote.ok ? "#08191D" : "#8A5A00" }}>{balance.mgNote.text}</p>
            )}

            <p className="text-[11px] text-ink2 font-medium leading-relaxed mt-3">
              The band is a range rather than a single figure because magnesium substitutes for
              calcium in coral skeleton, which varies by species. A few other processes shift it
              too — a sulphur denitrator, or nitrate rising or falling sharply, both consume
              alkalinity without touching calcium.
            </p>
          </>
        )}
      </InfoBlock>

      {/* --- Calcium carbonate deposited --- */}
      {skeleton && (skeleton.status === "novolume" ? (
        /* spec: reef-chemistry.md §2, §7.6/§9 — computeSkeletonMass refuses
           and names net volume as the missing input instead of a mass
           figure. Rendered explicitly rather than let the card vanish
           silently or crash reading .gPerMonth off an object that doesn't
           have it. */
        <InfoBlock icon={Scale} eyebrow="Growth" title="Skeleton laid down" tone="#0B7C86"
          collapsible
          summary="Set your tank's net volume in Setup to see this">
          <p className="text-[13px] text-ink font-medium leading-relaxed">
            Set your tank's net volume in Setup before this can be calculated — the mass of
            calcium carbonate deposited is worked out per litre of water, so nothing is shown
            until net volume is entered.
          </p>
        </InfoBlock>
      ) : (
        <InfoBlock icon={Scale} eyebrow="Growth" title="Skeleton laid down" tone="#0B7C86"
          collapsible
          summary={`about ${skeleton.gPerMonth.toFixed(0)} g of calcium carbonate a month`}>
          <p className="text-[13px] text-ink font-medium leading-relaxed mb-3">
            Every dKH of alkalinity your tank consumes becomes calcium carbonate. Converting
            your {fmtAmount(consumption.consumption)} dKH a day across {settings.volumeL}L
            gives the mass actually being deposited.
          </p>
          <div className="grid grid-cols-3 gap-2 mb-3">
            <Stat label="Per week" value={`${skeleton.gPerWeek.toFixed(1)} g`} />
            <Stat label="Per month" value={`${skeleton.gPerMonth.toFixed(0)} g`} tone="#0B7C86" />
            <Stat label="Per year" value={`${skeleton.kgPerYear.toFixed(2)} kg`} />
          </div>
          <p className="text-[13px] text-ink font-medium leading-relaxed">
            That's roughly {skeleton.cm3PerMonth.toFixed(1)} cm³ of new aragonite a month. Watch this
            figure over time rather than in isolation — it should creep upward as colonies grow, and
            a sustained fall means something has stopped calcifying.
          </p>
          <p className="text-[11px] text-ink2 font-medium leading-relaxed mt-3">
            This is all calcium carbonate laid down, not coral alone — coralline algae, snails and
            clams, and some abiotic precipitation on heaters and pumps are included. A little
            alkalinity also goes to nitrogen cycling and magnesium incorporation, so treat it as a
            close proxy for growth rather than an exact measurement of it.
          </p>
        </InfoBlock>
      ))}

      {/* --- Nutrient production --- */}
      <InfoBlock icon={Droplets} eyebrow="Nutrients" title="What your tank generates" tone="#2A8050"
        collapsible
        summary={(() => {
          const ok = nutrientProd.filter((n) => n.status === "ok");
          if (!ok.length) return "Log a water change to measure this";
          const weak = ok.filter((n) => n.offsetPct != null && n.offsetPct < 70);
          return weak.length
            ? `water changes only partly offset ${joinList(weak.map((n) => n.def.label.toLowerCase()))}`
            : "water changes are keeping pace with production";
        })()}>

        <p className="text-[13px] text-ink font-medium leading-relaxed mb-3">
          Nitrate and phosphate aren't dosed — your tank makes them, from food, fish waste and
          decomposition. They only leave when you remove them. So if you know how much a water
          change took out, and how much the level moved anyway, you can work backwards to how fast
          the tank is producing them.
        </p>

        {nutrientProd.every((n) => n.status !== "ok") ? (
          <div className="rounded-xl p-3 bg-app border border-app">
            <p className="text-[13px] text-ink font-medium leading-relaxed">
              {nutrientProd.some((n) => n.status === "nowaterchanges")
                ? `This needs at least one logged water change to work. Without knowing what came out, a steady nitrate level could mean your tank produces nothing, or that it produces plenty and your export removes exactly as much — the two look identical. Log your water changes in Tasks and this fills in after a few weeks.`
                : `Log a few more nitrate and phosphate readings and this will start measuring what your tank produces.`}
            </p>
            {nutrientProd.filter((n) => n.status === "nowaterchanges").map((n) => (
              <div key={n.key} className="flex items-center justify-between gap-2 mt-2 pt-2 border-t border-app">
                <span className="text-[12px] font-bold text-ink2">{n.def.label} over the last {n.spanDays} days</span>
                <span className="text-[12px] font-black text-ink">
                  {fmtVal(n.def, n.cStart)} → {fmtVal(n.def, n.cEnd)}{n.def.unit}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <>
            <div className="space-y-3">
              {nutrientProd.filter((n) => n.status === "ok").map((n) => {
                const weak = n.offsetPct != null && n.offsetPct < 70;
                return (
                  <div key={n.key} className="rounded-xl p-3 bg-app border border-app">
                    <div className="text-[13px] font-black text-ink mb-2">{n.def.label}</div>

                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[12px] font-bold text-ink2">Your tank produces</span>
                        <span className="text-[13px] font-black text-ink">{fmtAmount(n.perWeek)}{n.def.unit} a week</span>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[12px] font-bold text-ink2">Your water changes take out</span>
                        <span className="text-[13px] font-black text-ink">{fmtAmount(n.weeklyExport)}{n.def.unit} a week</span>
                      </div>
                      <div className="flex items-center justify-between gap-2 pt-1.5 border-t border-app">
                        <span className="text-[12px] font-bold text-ink2">Which covers</span>
                        <span className="text-[14px] font-black" style={{ color: weak ? "#A2621B" : "#0B7C86" }}>
                          {n.offsetPct != null ? `${n.offsetPct.toFixed(0)}%` : "—"}
                        </span>
                      </div>
                      {/* Always shown: where it settles if nothing else changes. */}
                      {n.equilibrium != null && (
                        <div className="flex items-center justify-between gap-2 pt-1.5 border-t border-app">
                          <span className="text-[12px] font-bold text-ink2">Settles at, on water changes alone</span>
                          <span className="text-[13px] font-black text-ink">{fmtVal(n.def, n.equilibrium)}{n.def.unit}</span>
                        </div>
                      )}
                    </div>

                    <p className="text-[12px] text-ink font-medium leading-relaxed mt-2">
                      {n.netConsumer
                        ? `Your tank is removing ${n.def.label.toLowerCase()} faster than it generates it — export is winning. There's no settling point to quote while that holds: the level will keep falling until production and export meet, or until you ease off the export.`
                        : n.offsetPct != null && n.offsetPct >= 90
                        ? `Your water changes remove almost exactly what the tank makes, which is why ${n.def.label.toLowerCase()} sits still without you doing anything else.`
                        : n.offsetPct != null && n.offsetPct >= 70
                        ? `Water changes carry most of the load, and whatever else you run — skimmer, carbon, macroalgae — handles the remainder.`
                        : `Water changes only remove ${n.offsetPct != null ? n.offsetPct.toFixed(0) : "some"}% of what the tank makes, so something else must be taking the rest.`}
                      {n.equilibrium != null && n.cEnd < n.equilibrium * 0.85 &&
                        ` You're sitting below that settling point at ${fmtVal(n.def, n.cEnd)}${n.def.unit}, which means your other export is doing real work — if it stopped, this would climb.`}
                    </p>

                    {/* What size change would hold a chosen level — the actionable bit. */}
                    {(n.holdAtTarget || n.holdAtMid) && (
                      <div className="mt-2 pt-2 border-t border-app">
                        <div className="text-[11px] font-extrabold uppercase tracking-wide text-ink2 mb-1.5">
                          Water change needed to hold a level
                        </div>
                        <div className="space-y-1">
                          {n.holdAtMid && (
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-[12px] font-bold text-ink2">
                                mid-range, {fmtVal(n.def, (n.def.min + n.def.max) / 2)}{n.def.unit}
                              </span>
                              <span className="text-[12px] font-black text-ink">{n.holdAtMid.toFixed(0)}L a week</span>
                            </div>
                          )}
                          {n.holdAtTarget && (
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-[12px] font-bold text-ink2">
                                top of your band, {fmtVal(n.def, n.def.max)}{n.def.unit}
                              </span>
                              <span className="text-[12px] font-black text-ink">{n.holdAtTarget.toFixed(0)}L a week</span>
                            </div>
                          )}
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[12px] font-bold text-ink2">you currently do</span>
                            <span className="text-[12px] font-black text-teal-brand">{n.currentLitres.toFixed(0)}L a week</span>
                          </div>
                        </div>
                        <p className="text-[12px] text-ink font-medium leading-relaxed mt-1.5">
                          {n.holdAtMid && n.currentLitres < n.holdAtMid * 0.9
                            ? `Holding ${n.def.label.toLowerCase()} mid-band on water changes alone would take ${n.holdAtMid.toFixed(0)}L a week — noticeably more than you do now. Anything below that has to come from other export.`
                            : n.holdAtMid && n.currentLitres > n.holdAtMid * 1.15
                            ? `Your current routine is more than enough to hold ${n.def.label.toLowerCase()} mid-band on water changes alone.`
                            : `Your current routine is about the right size to hold ${n.def.label.toLowerCase()} where it is.`}
                        </p>
                      </div>
                    )}

                    {n.halfLifeDays && (
                      <p className="text-[11px] text-ink2 font-medium leading-relaxed mt-2">
                        Changes to your routine take time to show: at this volume and frequency a
                        deviation halves every {n.halfLifeDays.toFixed(0)} days, so expect
                        roughly {(n.halfLifeDays * 3 / 7).toFixed(0)} weeks before a new level settles.
                      </p>
                    )}
                  </div>
                );
              })}
            </div>

            {(() => {
              const ok = nutrientProd.filter((n) => n.status === "ok");
              if (ok.length < 2) return null;
              const [a, b] = ok;
              if (a.offsetPct == null || b.offsetPct == null) return null;
              const gap = Math.abs(a.offsetPct - b.offsetPct);
              if (gap < 20) return null;
              const better = a.offsetPct > b.offsetPct ? a : b;
              const worse = a.offsetPct > b.offsetPct ? b : a;
              return (
                <p className="text-[13px] text-ink font-medium leading-relaxed mt-3">
                  Worth noticing the difference between them: water changes cover {better.offsetPct.toFixed(0)}% of
                  your {better.def.label.toLowerCase()} but only {worse.offsetPct.toFixed(0)}% of
                  your {worse.def.label.toLowerCase()}. That asymmetry is usually why one of them creeps
                  up while the other holds steady, and it's the reason nutrient ratios drift over time
                  even when nothing about your routine has changed.
                </p>
              );
            })()}
          </>
        )}

        <p className="text-[11px] text-ink2 font-medium leading-relaxed mt-3">
          A water change removes a proportion of what's in the water, not a fixed amount — take out
          13% of the volume and you take out 13% of the nitrate. That's why the figure depends on
          the level at the time. This also measures production net of any other export you run, so
          adding carbon or a skimmer lowers the number even though the tank makes the same amount.
        </p>
      </InfoBlock>

      {/* --- 3. Nutrient ratio --- */}
      <InfoBlock icon={Target} eyebrow="Nutrients" title="Nitrate to phosphate ratio" tone="#2A8050"
        collapsible
        summary={nutrients ? `${nutrients.ratio.toFixed(0)}:1 — ${nutrients.verdict}` : "Needs a nitrate and phosphate reading"}>
        {!nutrients ? (
          <p className="text-[13px] text-ink2 font-medium">Log both nitrate and phosphate to see how they balance against each other.</p>
        ) : (
          <>
            <div className="grid grid-cols-3 gap-2 mb-3">
              <Stat label="Nitrate" value={`${nutrients.no3} ppm`} />
              <Stat label="Phosphate" value={`${nutrients.po4} ppm`} />
              <Stat label="Ratio" value={`${nutrients.ratio.toFixed(0)}:1`}
                tone={nutrients.verdict === "balanced" ? "#0B7C86" : "#A2621B"} />
            </div>
            <p className="text-[13px] text-ink font-medium leading-relaxed">{nutrients.note}</p>
          </>
        )}
      </InfoBlock>

      {/* --- Self-calibrating dose strength --- */}
      <InfoBlock icon={Calculator} eyebrow="Accuracy" title="Is your dose strength right?" tone="#B8541A"
        collapsible
        summary={(() => {
          const ok = calibrations.filter((c) => c.status === "ok");
          const off = ok.filter((c) => !c.enteredInside && !c.implausible);
          return off.length ? `${joinList(off.map((c) => c.cfg.label.toLowerCase()))} may be entered wrong`
            : ok.length ? `${ok.length} confirmed against your own data`
            : "Needs a logged dose change to check";
        })()}>
          <p className="text-[13px] text-ink font-medium leading-relaxed mb-3">
            Every time you change a dose you run an experiment. If demand held steady across the
            change, the strength of your product is the only unknown left — so it can be solved for,
            and checked against what you entered.
          </p>
          {/* Two boxes were answering this question from two engines with
              different data requirements, so this one could report "nothing to
              check yet" while the Dosing Wizard had already solved it. The
              Wizard's answer is the one that feeds every millilitre figure, so
              it is the one to act on; this section stays for the longer
              explanation and the per-element detail. */}
          <p className="text-[12px] text-ink2 font-medium leading-relaxed mb-3">
            The Dosing Wizard runs the same check against each element's own dosing periods and is
            where you can adopt a solved figure. If the two ever read differently, follow the
            Wizard — its result is what the dose recommendations are built on.
          </p>
          {appliedMsg && (
          <div className="mb-3 rounded-lg p-2.5 flex items-start gap-2" style={{ background: "#0B7C8615" }}>
            <Check size={15} color="#0B7C86" className="shrink-0 mt-0.5" />
            <p className="text-[12px] font-bold text-ink leading-relaxed">{appliedMsg}</p>
          </div>
        )}

        {calibrations.every((c) => c.status === "nochanges") && (
            <p className="text-[13px] text-ink font-medium leading-relaxed">
              Nothing to check yet — this needs at least one recorded dose change with a few weeks
              of readings either side. Next time you adjust a doser, record it in Setup and this
              will tell you whether the level responded by as much as your entered strength predicts.
              It's the most direct way to catch a wrong figure, since it uses your own tank rather
              than the bottle's label.
            </p>
          )}
          <div className="space-y-2">
            {calibrations.map((c) => {
              if (c.status === "ok") {
                const bad = !c.enteredInside && !c.implausible;
                return (
                  <div key={c.key} className="rounded-xl p-3" style={{ background: bad ? "#B8541A12" : "#0B7C8610" }}>
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="text-[13px] font-black text-ink">{c.cfg.label}</span>
                      <span className="text-[12px] font-black" style={{ color: bad ? "#B8541A" : "#0B7C86" }}>
                        {bad ? "looks wrong" : c.implausible ? "inconclusive" : "confirmed"}
                      </span>
                    </div>
                    <div className="text-[11px] text-ink2 font-semibold mb-1.5">
                      You entered {c.entered} · your data implies {c.median.toFixed(4)} ({c.range.lo.toFixed(4)}–{c.range.hi.toFixed(4)}) {c.cfg.strengthLabel}
                    </div>
                    <p className="text-[12px] text-ink font-medium leading-relaxed">
                      {c.implausible
                        ? `The estimate is ${c.ratio.toFixed(1)}x your entered figure, which is too far apart to trust — demand almost certainly shifted across the dose change rather than the number being wrong. Worth re-checking after another change.`
                        : bad
                        ? `Across ${c.estimates.length} dose change${c.estimates.length === 1 ? "" : "s"}, your tank responded as though 1 mL delivers ${c.median.toFixed(4)} ${c.cfg.strengthLabel}, not the ${c.entered} entered here. Note this doesn't mean re-mixing anything — your solution is whatever strength you made it, and this is measuring what it actually delivers. It's the figure in Setup that needs correcting.`
                        : `Across ${c.estimates.length} dose change${c.estimates.length === 1 ? "" : "s"}, the tank responded consistently with the ${c.entered} you entered. That figure is now measured rather than assumed, so the millilitre advice built on it is on solid ground.`}
                    </p>

                    {bad && (() => {
                      const pv = previewStrengthChange(c.key, +c.median.toFixed(4), readings, waterChanges, settings, paramDefs);
                      if (!pv) return null;
                      const open = applyOpen === c.key;
                      return (
                        <div className="mt-2">
                          <button onClick={() => setApplyOpen(open ? null : c.key)}
                            className="w-full rounded-lg px-3 py-2 text-left border-2 active:opacity-80"
                            style={{ borderColor: "#B8541A", background: "#fff" }}>
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-[12px] font-black" style={{ color: "#B8541A" }}>
                                {open ? "Hide what this changes" : `See what changing it to ${c.median.toFixed(4)} does`}
                              </span>
                              {open ? <ChevronUp size={14} color="#B8541A" /> : <ChevronDown size={14} color="#B8541A" />}
                            </div>
                          </button>

                          {open && (
                            <div className="mt-2 rounded-lg border border-app bg-white p-3">
                              <div className="grid grid-cols-3 gap-1 mb-1 text-[10px] font-extrabold uppercase tracking-wide text-ink2">
                                <span />
                                <span className="text-right">now</span>
                                <span className="text-right">after</span>
                              </div>
                              {pv.rows.map((r, i) => (
                                <div key={i} className="grid grid-cols-3 gap-1 py-1 border-t border-app items-baseline">
                                  <span className="text-[11px] font-bold text-ink2">{r.label}</span>
                                  <span className="text-[12px] font-black text-ink2 text-right">{r.before}</span>
                                  <span className="text-[12px] font-black text-right"
                                    style={{ color: r.good === false ? "#A2621B" : "#0B7C86" }}>{r.after}</span>
                                </div>
                              ))}

                              {pv.remixNote && (
                                <p className="text-[11px] text-ink2 font-medium leading-relaxed mt-2 pt-2 border-t border-app">
                                  {pv.remixNote}
                                </p>
                              )}

                              <Btn onClick={async () => {
                                await onSaveSettings({ ...settings, [pv.el.strengthField]: pv.newStrength });
                                setApplyOpen(null);
                                setAppliedMsg(`${pv.el.label} strength updated to ${pv.newStrength}. Everything below has recalculated.`);
                                setTimeout(() => setAppliedMsg(null), 6000);
                              }} className="w-full mt-3">
                                <span className="flex items-center justify-center gap-1.5">
                                  <Check size={14} /> Use {pv.newStrength} instead of {pv.oldStrength}
                                </span>
                              </Btn>
                              <p className="text-[10px] text-ink2 font-medium mt-1.5 text-center">
                                Your readings aren't touched — only the strength figure in Setup, which you can change back at any time.
                              </p>
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                );
              }
              if (c.status === "nodata" && c.skipped.length) {
                return (
                  <div key={c.key} className="rounded-xl p-3 bg-app">
                    <div className="text-[13px] font-black text-ink mb-1">{c.cfg.label}</div>
                    <p className="text-[12px] text-ink2 font-medium leading-relaxed">
                      Can't check this yet: {c.skipped[c.skipped.length - 1].why}.
                    </p>
                  </div>
                );
              }
              return null;
            })}
          </div>
          <p className="text-[11px] text-ink2 font-medium leading-relaxed mt-3">
            This assumes your corals' demand didn't change over the three weeks either side of a
            dose change. That holds most of the time but not always, so a single odd result means
            less than a consistent one across several changes.
          </p>
      </InfoBlock>

      {/* --- 4. ICP calibration --- */}
      <InfoBlock icon={Beaker} eyebrow="Accuracy" title="Test kit calibration" tone="#B8541A"
        collapsible
        summary={calResults.length
          ? (() => {
              const off = calResults.filter((r) => Math.abs(r.meanPct) >= 5);
              return off.length ? `${off.map((r) => r.def.label.toLowerCase()).join(", ")} off by more than 5%`
                : `${calResults.length} kit${calResults.length === 1 ? "" : "s"} agree with the lab`;
            })()
          : "No paired lab comparisons yet"}>
        {!calResults.length ? (
          <p className="text-[13px] text-ink2 font-medium leading-relaxed">
            {calDiag.length
              ? `Your ICP panels include ${calDiag.map((d) => d.def.label.toLowerCase()).join(", ")}, but there's no hobby test within 7 days of a panel to compare against. Test those parameters close to your next ICP sample and this will fill in.`
              : `Log an ICP result and take your own tests within a week of it, and this will show how your kits compare against the lab.`}
          </p>
        ) : (
          <>
            <p className="text-[13px] text-ink font-medium leading-relaxed mb-3">
              Comparing your own tests against lab ICP results taken within 7 days of each other. Tap a row to see the individual pairs.
            </p>
            <div className="space-y-2">
              {calResults.map((r) => {
                const open = calOpen === r.def.key;
                const off = Math.abs(r.meanPct) >= 5;
                const tone = off ? "#B8541A" : "#0B7C86";
                return (
                  <div key={r.def.key} className="rounded-xl overflow-hidden" style={{ background: "#F3F7F6" }}>
                    <button onClick={() => setCalOpen(open ? null : r.def.key)}
                      className="w-full flex items-center justify-between gap-2 p-3 text-left active:bg-app">
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[14px] font-black text-ink">{r.def.label}</span>
                          {open ? <ChevronUp size={14} className="text-ink2" /> : <ChevronDown size={14} className="text-ink2" />}
                        </div>
                        <div className="text-[11px] text-ink2 font-semibold">
                          {r.n} paired comparison{r.n === 1 ? "" : "s"}
                          {r.converted && ` · lab ${r.converted.from} converted ×${r.converted.factor}`}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-[15px] font-black" style={{ color: tone }}>
                          {r.meanDiff > 0 ? "+" : ""}{Math.abs(r.meanDiff) < 1 ? r.meanDiff.toFixed(3) : r.meanDiff.toFixed(0)}{r.def.unit}
                        </div>
                        <div className="text-[11px] font-bold text-ink2">
                          reads {r.meanPct >= 0 ? "high" : "low"} {Math.abs(r.meanPct).toFixed(0)}%
                        </div>
                      </div>
                    </button>

                    {open && (
                      <div className="px-3 pb-3">
                        <div className="rounded-lg bg-white border border-app divide-y divide-app">
                          {r.pairs.map((p, i) => (
                            <div key={i} className="p-2.5">
                              <div className="flex items-center justify-between gap-2 mb-1">
                                <span className="text-[11px] font-extrabold uppercase tracking-wide text-ink2">
                                  Panel {fmtDate(p.date)}
                                </span>
                                <span className="text-[11px] font-bold" style={{ color: Math.abs(p.diff) > Math.abs(p.lab) * 0.05 ? "#B8541A" : "#0B7C86" }}>
                                  {p.diff > 0 ? "+" : ""}{Math.abs(p.diff) < 1 ? p.diff.toFixed(3) : p.diff.toFixed(0)}{r.def.unit}
                                </span>
                              </div>
                              <div className="grid grid-cols-2 gap-2">
                                <div className="rounded-md p-2" style={{ background: "#0B7C860D" }}>
                                  <div className="text-[10px] font-extrabold uppercase tracking-wide text-ink2">Your test</div>
                                  <div className="text-[15px] font-black text-ink">{p.kit}{r.def.unit}</div>
                                  <div className="text-[10px] text-ink2 font-semibold">
                                    {p.gap === 0 ? "same day" : `${p.gap} day${p.gap === 1 ? "" : "s"} ${"from the panel"}`}
                                  </div>
                                </div>
                                <div className="rounded-md p-2" style={{ background: "#B8541A0D" }}>
                                  <div className="text-[10px] font-extrabold uppercase tracking-wide text-ink2">Triton lab</div>
                                  <div className="text-[15px] font-black text-ink">
                                    {Math.abs(p.lab) < 1 ? p.lab.toFixed(3) : p.lab.toFixed(0)}{r.def.unit}
                                  </div>
                                  <div className="text-[10px] text-ink2 font-semibold">
                                    {p.converted ? `from ${p.converted.raw} ${p.converted.from}` : "as reported"}
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Replacing the reagent is the actual fix for a kit
                            that disagrees with the lab, and nothing offered a
                            way to record it — so the warning stayed forever
                            however many kits you went through. */}
                        <div className="mt-3 rounded-lg p-3" style={{ background: "#fff", border: "1px solid #E3ECEA" }}>
                          <div className="text-[12px] font-black text-ink mb-1">Started a new kit?</div>
                          <p className="text-[11px] text-ink2 font-medium leading-relaxed mb-2">
                            If these comparisons were made with a kit or reagent you're no longer using,
                            record that here and they'll be retired — a new kit has to be measured against
                            the lab on its own terms. This doesn't assume anything was wrong with the old
                            one; if you're happy with the reading as it is, hide the note instead.
                          </p>
                          <Btn variant="ghost" className="w-full"
                            onClick={() => onReplaceKit && onReplaceKit(r.def.key)}>
                            <span className="flex items-center justify-center gap-1.5">
                              <RotateCcw size={13} /> New {r.def.label.toLowerCase()} kit from today
                            </span>
                          </Btn>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Kits already marked as replaced, with a way back if mistaken. */}
            {Object.keys(kitChanges || {}).length > 0 && (
              <div className="mt-3 pt-3 border-t border-app">
                <div className="text-[11px] font-extrabold uppercase tracking-wide text-ink2 mb-1.5">
                  Kits you've replaced
                </div>
                {Object.entries(kitChanges).map(([key, date]) => {
                  const d = paramDefs.find((x) => x.key === key);
                  return (
                    <div key={key} className="flex items-center justify-between gap-2 py-1">
                      <span className="text-[12px] font-bold text-ink">
                        {d ? d.label : key} · {fmtDate(date)}
                      </span>
                      <button onClick={() => onUndoReplaceKit && onUndoReplaceKit(key)}
                        className="text-[11px] font-extrabold text-teal-brand">Undo</button>
                    </div>
                  );
                })}
              </div>
            )}
            <p className="text-[12px] text-ink2 font-medium leading-relaxed mt-3">
              A consistent offset above about 5% is worth knowing — it means your target should be adjusted to match your kit, rather than chasing a number your kit cannot actually read. Small differences are normal and reflect reagent age and endpoint judgement.
            </p>
            {(() => {
              /* An offset here changes how much every other section's conclusions
                 about that parameter are worth, so say where it lands. */
              const off = findings.filter((f) => f.scope === "reading-accuracy" && f.severity !== "info");
              if (!off.length) return null;
              return (
                <div className="mt-3 pt-3 border-t border-app">
                  <div className="text-[11px] font-extrabold uppercase tracking-wide text-ink2 mb-1.5">
                    What this affects elsewhere
                  </div>
                  <p className="text-[12px] text-ink font-medium leading-relaxed">
                    {joinList(off.map((f) => f.params[0]))} {off.length === 1 ? "carries" : "carry"} this
                    offset into every figure derived from {off.length === 1 ? "it" : "them"} — target
                    comparisons, trend verdicts, consumption and dose advice. Those sections now flag
                    it, but nothing is silently corrected: your recorded readings stay exactly as you
                    entered them.
                  </p>
                </div>
              );
            })()}
            {calDiag.length > 0 && (
              <p className="text-[11px] text-ink2 font-medium leading-relaxed mt-2">
                No pairing yet for {calDiag.map((d) => d.def.label.toLowerCase()).join(", ")} — nearest hobby test was too far from a panel.
              </p>
            )}
          </>
        )}
      </InfoBlock>

      {/* --- 7. ICP trace elements --- */}
      <InfoBlock icon={Beaker} eyebrow="Trace elements" title="ICP element review" tone="#7B4FCB"
        collapsible
        summary={(() => {
          if (!icps.length) return "No ICP panels logged";
          const latest = [...icps].sort(byNewest)[0];
          const es = Object.entries(latest.elements || {}).map(([n, v]) => ({ ref: icpRef(n), st: icpStatus(icpRef(n), v) }));
          const flagged = es.filter((e) => e.ref && e.st !== "ok").length;
          const known = es.filter((e) => e.ref).length;
          return flagged ? `${flagged} of ${known} elements outside reference` : `All ${known} elements inside reference`;
        })()}>
        {!icps.length ? (
          <p className="text-[13px] text-ink2 font-medium">
            Log an ICP result with element values and this will check each one against reference ranges, then track which elements are accumulating or depleting between tests.
          </p>
        ) : (
          <>
            {(() => {
              const latest = [...icps].sort(byNewest)[0];
              const entries = Object.entries(latest.elements || {})
                .map(([n, v]) => ({ n, v, ref: icpRef(n) }))
                .map((e) => ({ ...e, st: icpStatus(e.ref, e.v) }))
                .map((e) => ({ ...e, group: icpGroupOf(e.n) }))
                .sort((a, b) => {
                  /* A detected contaminant outranks everything; then anything
                     outside its band; then the rest. */
                  const rank = (x) => (x.st === "detected" ? 0
                    : x.ref && x.ref.toxic && x.st === "high" ? 0
                    : x.st === "high" || x.st === "low" ? 1 : 2);
                  return rank(a) - rank(b);
                });
              const flagged = entries.filter((e) => e.st === "high" || e.st === "low" || e.st === "detected");
              const inRange = entries.filter((e) => e.ref && e.st === "ok");
              return (
                <>
                  <div className="text-[11px] font-extrabold uppercase tracking-wide text-ink2 mb-2">
                    Latest panel · {fmtDate(latest.date)}
                  </div>
                  <p className="text-[13px] text-ink font-medium leading-relaxed mb-3">
                    {inRange.length} of {inRange.length + flagged.length} elements measured against a Triton reference came back inside it
                    {flagged.length === 0
                      ? ". That's a clean panel."
                      : `, and ${flagged.length} ${flagged.length === 1 ? "is" : "are"} outside:`}
                  </p>
                  {flagged.length === 0 ? null : (
                    <div className="space-y-2 mb-3">
                      {flagged.map((e) => {
                        const tone = e.st === "detected" ? "#C4285B"
                          : e.ref && e.ref.toxic && e.st === "high" ? "#C4285B"
                          : e.st === "high" ? "#A2621B" : "#1D6FA5";
                        return (
                          <div key={e.n} className="flex items-center justify-between gap-2 p-2 rounded-lg" style={{ background: tone + "12" }}>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="text-[13px] font-black text-ink capitalize">{e.n}</span>
                                <span className="text-[9px] font-extrabold uppercase tracking-wide px-1.5 py-0.5 rounded"
                                  style={{ background: e.group === "contaminant" ? "#C4285B18" : "#45605F14",
                                           color: e.group === "contaminant" ? "#C4285B" : "#45605F" }}>
                                  {e.group === "contaminant" ? "contaminant" : e.group === "macro" ? "macro" : e.group === "nutrient" ? "nutrient" : "trace"}
                                </span>
                              </div>
                              <div className="text-[11px] text-ink2 font-semibold">
                                {e.ref.hi === 0
                                  ? `Triton target: zero`
                                  : e.ref.derived
                                  ? `Triton setpoint ${e.ref.setpoint} ${e.ref.unit} (±10%)`
                                  : `Triton range ${e.ref.lo}–${e.ref.hi} ${e.ref.unit}`}

                              </div>
                            </div>
                            <div className="text-right shrink-0">
                              <div className="text-[13px] font-black" style={{ color: tone }}>{e.v}</div>
                              <div className="text-[10px] font-extrabold uppercase" style={{ color: tone }}>{e.st}</div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                  {entries.filter((e) => !e.ref).length > 0 && (
                    <p className="text-[11px] text-ink2 font-medium mb-3">
                      No reference range on file for: {entries.filter((e) => !e.ref).map((e) => e.n).join(", ")}.
                    </p>
                  )}
                </>
              );
            })()}

            {icpTrends.length > 0 && (
              <div className="pt-3 border-t border-app">
                <div className="text-[11px] font-extrabold uppercase tracking-wide text-ink2 mb-2">
                  Movement across {icps.length} panels
                </div>
                <div className="space-y-1.5">
                  {icpTrends.filter((t) => t.direction !== "steady").slice(0, 10).map((t) => {
                    const tone = t.direction === "accumulating" ? "#A2621B" : "#1D6FA5";
                    return (
                      <div key={t.name} className="flex items-center justify-between gap-2">
                        <span className="text-[13px] font-bold text-ink capitalize min-w-0 truncate">{t.name}</span>
                        <span className="text-[11px] font-extrabold shrink-0" style={{ color: tone }}>
                          {t.first} → {t.last} ({t.pctChange > 0 ? "+" : ""}{t.pctChange.toFixed(0)}%) {t.direction}
                        </span>
                      </div>
                    );
                  })}
                  {icpTrends.every((t) => t.direction === "steady") && (
                    <p className="text-[13px] text-ink font-medium">All tracked elements are holding steady between panels.</p>
                  )}
                </div>
                <p className="text-[12px] text-ink2 font-medium leading-relaxed mt-2">
                  Elements that climb steadily between panels usually enter through salt mix, additives or equipment; ones that fall are being consumed by corals or stripped by filtration. Direction matters more than any single panel.
                </p>
              </div>
            )}
          </>
        )}
      </InfoBlock>

      {/* --- 8. Salt baseline comparison --- */}
      <InfoBlock icon={Waves} eyebrow={SALT_MIX.name} title="Tank vs fresh saltwater" tone="#1D6FA5"
        collapsible
        summary={(() => {
          if (!saltRows.length) return "Needs current readings";
          const drifted = saltRows.filter((r) => r.pct != null && Math.abs(r.pct) > 10).length;
          return drifted ? `${drifted} parameter${drifted === 1 ? "" : "s"} more than 10% off the fresh mix`
            : "Tank close to freshly mixed saltwater";
        })()}>
        {!saltRows.length ? (
          <p className="text-[13px] text-ink2 font-medium">Log some readings and this will compare your tank against freshly mixed {SALT_MIX.name}.</p>
        ) : (
          <>
            <p className="text-[13px] text-ink font-medium leading-relaxed mb-3">
              Comparing your latest readings against {SALT_MIX.name} mixed to {SALT_MIX.salinity} ppt. A positive number means your system is running above fresh mix — either you're dosing it, or it's accumulating.
            </p>
            <div className="space-y-2">
              {saltRows.map(({ def, base, current, delta, pct }) => {
                const big = pct != null && Math.abs(pct) > 10;
                const tone = !big ? "#0B7C86" : delta > 0 ? "#A2621B" : "#1D6FA5";
                return (
                  <div key={def.key} className="flex items-center justify-between gap-2 p-2 rounded-lg bg-app">
                    <div className="min-w-0">
                      <div className="text-[13px] font-black text-ink">{def.label}</div>
                      <div className="text-[11px] text-ink2 font-semibold">fresh mix {base}{def.unit} · tank {current}{def.unit}</div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-[13px] font-black" style={{ color: tone }}>
                        {delta > 0 ? "+" : ""}{Math.abs(delta) < 1 ? delta.toFixed(2) : delta.toFixed(0)}{def.unit}
                      </div>
                      {pct != null && <div className="text-[10px] text-ink2 font-bold">{pct > 0 ? "+" : ""}{pct.toFixed(0)}%</div>}
                    </div>
                  </div>
                );
              })}
            </div>
            <p className="text-[12px] text-ink2 font-medium leading-relaxed mt-3">
              Note that {SALT_MIX.name} is nitrate and phosphate free, so any nutrients you measure are entirely generated by the tank — feeding and livestock — rather than carried in by water changes.
            </p>
          </>
        )}
      </InfoBlock>

    </div>
  );
}
