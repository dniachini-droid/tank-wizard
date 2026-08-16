import React, { useEffect, useState } from 'react'
import { DoseChangeSheet } from './DoseChangeSheet.jsx'
import { Btn } from './DoseExpectation.jsx'
import { AlertTriangle, Plus, RotateCcw, Save, Trash2 } from '../icons.jsx'
import { SAFE_DAILY_RISE } from '../lib/analytics/safe-rate.js'
import { fmtAmount, fmtVal } from '../lib/analytics/time-in-range.js'
import { fmtTime } from '../lib/analytics/time-of-day.js'
import { fmtFriendly } from '../lib/analytics/water-changes.js'
import { fmtDate } from '../lib/dates.js'
import { alkStamp } from '../lib/dosing/alkalinity.js'
import { notify } from '../lib/storage.js'

/* --- Error boundary ---
 *
 * A crash in one tab used to render nothing at all: a blank page with no clue
 * what happened, and no way to reach the rest of the app. This catches it,
 * names it, and leaves the navigation working so the other tabs are still
 * usable while the fault is fixed.
 */
export class TabErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { error: null }; }
  static getDerivedStateFromError(error) { return { error }; }
  componentDidUpdate(prev) {
    /* Moving to another tab should clear a previous tab's failure. */
    if (prev.tabKey !== this.props.tabKey && this.state.error) this.setState({ error: null });
  }
  render() {
    if (!this.state.error) return this.props.children;
    const e = this.state.error;
    return (
      <Card className="p-4 mb-6" style={{ borderColor: "#C4285B55" }}>
        <div className="flex items-center gap-2 mb-2">
          <AlertTriangle size={16} color="#C4285B" />
          <span className="text-[11px] font-extrabold uppercase tracking-wide" style={{ color: "#C4285B" }}>
            This tab hit an error
          </span>
        </div>
        <p className="text-[13px] text-ink font-medium leading-relaxed mb-2">
          Something in this screen failed to display. Your data is untouched — the other tabs still
          work, and nothing has been lost.
        </p>
        <div className="rounded-lg p-2.5 mb-3" style={{ background: "#F7FAFA" }}>
          <p className="text-[11px] font-mono text-ink2 leading-relaxed break-words">
            {String(e && e.message ? e.message : e)}
          </p>
        </div>
        <Btn variant="ghost" className="w-full" onClick={() => this.setState({ error: null })}>
          <span className="flex items-center justify-center gap-1.5"><RotateCcw size={13} /> Try again</span>
        </Btn>
      </Card>
    );
  }
}

export function Card({ children, className = "", style }) {
  return <div style={style} className={`bg-white border border-app rounded-2xl shadow-[0_1px_2px_rgba(15,40,45,0.04)] ${className}`}>{children}</div>;
}

/* Deleting a reading or an ICP panel was a single tap on a 13px icon with no
   confirmation and no undo. Two taps, with the second clearly labelled, costs
   almost nothing and prevents losing data to a mis-tap. */
export function DeleteButton({ onDelete, label = "Delete", size = 15, confirmMessage = "Entry removed" }) {
  const [armed, setArmed] = useState(false);
  useEffect(() => {
    if (!armed) return;
    const t = setTimeout(() => setArmed(false), 3500);
    return () => clearTimeout(t);
  }, [armed]);

  if (armed) {
    return (
      <button
        onClick={(e) => {
          e.stopPropagation(); setArmed(false);
          onDelete();
          /* The row vanishes on delete, so without this there is no sign it
             worked rather than silently failing. */
          notify(confirmMessage);
        }}
        className="shrink-0 px-2.5 py-2 -my-1 rounded-lg text-[11px] font-extrabold"
        style={{ background: "#C4285B", color: "#fff" }}>
        {label}?
      </button>
    );
  }
  return (
    <button
      aria-label={label}
      onClick={(e) => { e.stopPropagation(); setArmed(true); }}
      className="shrink-0 p-2 -m-1 rounded-lg text-ink2 hover:text-rose-700 active:bg-app">
      <Trash2 size={size} />
    </button>
  );
}

/* Findings render identically wherever they appear — dashboard modal, insights
   section, tasks — so the same conclusion always looks and reads the same. */
/* One element's dose verdict: the number you'd act on, large and legible,
   with the reasoning tucked behind a tap. Previously the recommendation was
   buried mid-paragraph and you had to read to find it. */
/* The full assessment, laid out in the order the protocol asks for: what was
   measured, what it implies, and only then what to do about it. */
export function AlkAssessmentBlock({ a, def, onApplyDose = null, onClearPlan = null, onLogCorrection = null, onApplyEffect = null }) {
  const [sheetOpen, setSheetOpen] = useState(false);
  /* Which figure the sheet opens on: the staged step, the full maintenance
     dose, or whatever the person types over it. */
  const [prefill, setPrefill] = useState(null);
  if (!a) return null;
  const tone = a.action === "implausible" ? "#C4285B"
    : a.action === "increase" || a.action === "decrease" ? "#0B7C86" : "#45605F";
  const Row = ({ k, v, strong }) => (
    <div className="flex items-start justify-between gap-3 py-1 border-t border-app first:border-0">
      <span className="text-[11px] font-bold text-ink2 shrink-0">{k}</span>
      <span className={`text-[12px] text-right ${strong ? "font-black text-ink" : "font-bold text-ink"}`}>{v}</span>
    </div>
  );

  const headline = a.action === "implausible" ? "Check your solution strength"
    : a.action === "increase" ? `Increase to ${fmtAmount(a.recommendedDose)} mL/day`
    : a.action === "decrease" ? `Reduce to ${fmtAmount(a.recommendedDose)} mL/day`
    : `Hold at ${fmtAmount(a.currentDose)} mL/day`;

  return (
    <div>
      {/* Where the staged correction stands, carried between sessions so a plan
          begun on Monday is still a plan on Wednesday. */}
      {a.activePlan && (
        <div className="rounded-xl p-3 mb-3" style={{ background: "#0B7C860F", border: "1px solid #0B7C8633" }}>
          <div className="flex items-center justify-between gap-2 mb-1">
            <span className="text-[10px] font-extrabold uppercase tracking-wide" style={{ color: "#0B7C86" }}>
              Correction in progress
              {a.stages > 1 ? ` · step ${a.stage} of ${a.stages}` : ""}
            </span>
            {onClearPlan && (
              <button onClick={onClearPlan} className="text-[10px] font-extrabold text-ink2">Cancel</button>
            )}
          </div>
          <p className="text-[12px] text-ink font-medium leading-relaxed">
            You set {fmtAmount(a.activePlan.appliedDose)} mL/day on {fmtDate(String(a.activePlan.appliedAt).slice(0, 10))}
            {a.planTarget != null && Math.abs(a.planTarget - a.activePlan.appliedDose) > 0.05
              ? `, heading for about ${fmtAmount(a.planTarget)} mL/day once this step is confirmed.`
              : "."}
          </p>
          {a.nextTestDue && (
            <p className="text-[12px] font-black mt-1" style={{ color: "#0B7C86" }}>
              Test {def.label.toLowerCase()} {fmtFriendly(a.nextTestDue)}
              {a.activePlan.nextTestTime ? ` around ${fmtTime(a.activePlan.nextTestTime)}` : ""} — it's on your reminders.
            </p>
          )}
        </div>
      )}

      <div className="rounded-xl p-3 mb-3" style={{ background: tone + "12", border: `1px solid ${tone}33` }}>
        <div className="text-[14px] font-black mb-1" style={{ color: tone }}>{headline}</div>
        <p className="text-[12px] text-ink font-medium leading-relaxed">
          {a.explanation || a.reason}
        </p>
        {a.rateLimited && (
          <div className="mt-2.5 rounded-lg px-3 py-2" style={{ background: "#1D6FA514" }}>
            <p className="text-[11px] font-medium leading-relaxed" style={{ color: "#1D6FA5" }}>
              Held to {fmtAmount(a.rateLimited.allowed)} mL rather than {fmtAmount(a.rateLimited.wanted)} mL:
              the larger figure would move {def.label.toLowerCase()} faster than {fmtAmount(a.rateLimited.perDay)}{a.rateLimited.unit} a
              day, and the speed of a change stresses corals more than the level itself does. Getting
              there will take about {a.rateLimited.days} more {a.rateLimited.days === 1 ? "day" : "days"} this way.
            </p>
          </div>
        )}

        {a.caution && (
          <div className="mt-2.5 rounded-lg px-3 py-2" style={{ background: "#A2621B14" }}>
            <p className="text-[11px] font-medium leading-relaxed" style={{ color: "#8A5A18" }}>
              {a.caution}
            </p>
          </div>
        )}

        {a.staged && a.plan && a.plan.length > 0 && (
          <div className="mt-2.5 pt-2.5 border-t" style={{ borderColor: tone + "33" }}>
            <div className="text-[10px] font-extrabold uppercase tracking-wide mb-1.5" style={{ color: tone }}>
              The plan from here
            </div>
            {/* Each step waits 48 hours and a re-test. Showing them makes the
                waiting part of the plan rather than something to remember. */}
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="w-4 h-4 rounded-full flex items-center justify-center shrink-0 text-[9px] font-black text-white"
                  style={{ background: tone }}>1</span>
                <span className="text-[12px] font-bold text-ink">
                  Set {fmtAmount(a.plan[0])} mL/day now
                </span>
              </div>
              {a.plan.slice(1).map((step, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="w-4 h-4 rounded-full flex items-center justify-center shrink-0 text-[9px] font-black"
                    style={{ background: tone + "22", color: tone }}>{i + 2}</span>
                  <span className="text-[12px] font-bold text-ink2">
                    after 48h and a re-test, {i + 2 === a.plan.length ? "settle around" : "move to"} {fmtAmount(step)} mL/day
                  </span>
                </div>
              ))}
            </div>
            <p className="text-[11px] text-ink2 font-medium leading-relaxed mt-1.5">
              Staging exists because the strength figure is an estimate — each step gets checked before the
              next, so a wrong estimate is caught early rather than compounded. If you are confident in
              your numbers, going straight to {fmtAmount(a.maintenanceDose)} mL/day is a {fmtAmount(Math.abs(a.maintenanceDose - a.currentDose))} mL
              jump and gets there in one move.
            </p>
            <div className="grid grid-cols-2 gap-2 mt-2">
              <Btn variant="ghost" onClick={() => { setPrefill(a.recommendedDose); setSheetOpen(true); }}>
                Step to {fmtAmount(a.recommendedDose)}
              </Btn>
              <Btn variant="ghost" onClick={() => { setPrefill(Math.round(a.maintenanceDose * 10) / 10); setSheetOpen(true); }}>
                Go to {fmtAmount(a.maintenanceDose)}
              </Btn>
            </div>
          </div>
        )}

        {/* The correction the protocol asks for, logged rather than left to
            memory — and split across days, since a large single addition moves
            alkalinity faster than is safe. */}
        {a.correction && onLogCorrection && (
          <div className="mt-3 pt-3 border-t" style={{ borderColor: tone + "33" }}>
            <div className="text-[10px] font-extrabold uppercase tracking-wide mb-1" style={{ color: tone }}>
              One-off correction
            </div>
            <p className="text-[12px] text-ink font-medium leading-relaxed mb-2">
              Raise {def.label.toLowerCase()} by about {a.correction.ppmToRaise}{def.unit} in total,
              spread over at least {a.correction.days} days — around {fmtAmount(a.correction.ppmPerDay)}{def.unit} a
              day. At that pace it moves no faster than {fmtAmount(SAFE_DAILY_RISE[def.key])}{def.unit} a day, which is what
              corals tolerate; the whole amount at once would be far quicker than that.
              {a.correction.viaMaintenance
                ? ` With your maintenance solution that is about ${fmtAmount(a.correction.oneOffMl)} mL in total.`
                : ` That would take about ${fmtAmount(a.correction.oneOffMl)} mL of your maintenance solution, which is more liquid than makes sense — a stronger mix or the dry salt is the usual route, and the daily dose stays as it is.`}
              {" "}Log it once added and the rise is treated as your doing rather than as the tank needing less.
            </p>
            <Btn variant="ghost" className="w-full"
              onClick={() => onLogCorrection(Math.round(a.correction.oneOffMl * 10) / 10,
                                             a.correction.direction)}>
              <span className="flex items-center justify-center gap-1.5">
                <Plus size={13} /> Log a {fmtAmount(a.correction.oneOffMl)} mL correction
              </span>
            </Btn>
          </div>
        )}

        {onApplyDose && a.recommendedDose != null && a.action !== "implausible" && (
          sheetOpen ? (
            <DoseChangeSheet def={def} element={a.element || "alkalinity"}
              current={a.currentDose} recommended={prefill != null ? prefill : a.recommendedDose}
              suggested={a.recommendedDose} plan={a.plan}
              onCancel={() => setSheetOpen(false)}
              onSave={(ml, date, time) => {
                setSheetOpen(false);
                onApplyDose(ml, {
                  date, time,
                  target: a.staged ? Math.round(a.maintenanceDose * 10) / 10 : ml,
                  stage: a.continuingPlan && a.stage ? a.stage + 1 : 1,
                  stages: a.staged ? ((a.plan ? a.plan.length : 1) + (a.continuingPlan && a.stage ? a.stage : 0)) : 1,
                  fromDose: a.currentDose,
                  maintenanceDose: a.maintenanceDose, consumption: a.consumption,
                  effectPerMl: a.effectPerMl, currentValue: a.current ? a.current.value : null,
                  staged: a.staged,
                });
              }} />
          ) : (
            <Btn className="w-full mt-3" onClick={() => { setPrefill(null); setSheetOpen(true); }}>
              <span className="flex items-center justify-center gap-1.5">
                <Save size={13} /> {a.action === "hold"
                  ? "Change the dose anyway"
                  : `Set the dose${a.recommendedDose != null ? ` — suggested ${fmtAmount(a.recommendedDose)} mL/day` : ""}`}
              </span>
            </Btn>
          )
        )}
      </div>

      <div className="rounded-xl p-3" style={{ background: "#F7FAFA" }}>
        <Row k={`Current ${def.label.toLowerCase()}`} v={`${fmtVal(def, a.current.value)}${def.unit}`} strong />
        <Row k="Target range" v={`${fmtVal(def, a.targetRange.min)}–${fmtVal(def, a.targetRange.max)}${def.unit}`} />
        <Row k="Current dose" v={`${fmtAmount(a.currentDose)} mL/day`} />
        <Row k="Time on this dose"
          v={a.hoursOnDose == null ? "unchanged throughout"
            : a.hoursOnDose < 48 ? `${Math.round(a.hoursOnDose)} hours`
            : `${(a.hoursOnDose / 24).toFixed(1)} days`} />
        <Row k="Readings used" v={`${a.used.length} over ${fmtAmount(
          a.used.length >= 2
            ? (alkStamp(a.used[a.used.length - 1]) - alkStamp(a.used[0])) : 0)} days`} />
        {a.trendPerDay != null && (
          <Row k="Observed trend"
            v={`${a.trendPerWeek != null
              ? `${a.trendPerWeek > 0 ? "+" : ""}${fmtAmount(a.trendPerWeek)}${def.unit}/week`
              : `${a.trendPerDay > 0 ? "+" : ""}${fmtAmount(a.trendPerDay)}${def.unit}/day`
            }${a.consistent === true ? " · consistent" : a.consistent === false ? " · mixed" : ""}`} strong />
        )}
        {a.supplied != null && <Row k="Your dose supplies" v={`${fmtAmount(a.supplied)}${def.unit}/day`} />}
        {a.consumption != null && (
          <Row k={a.gaining ? "Tank is gaining" : "Tank is using"}
            v={a.gaining
              ? `${fmtAmount(a.gaining)}${def.unit}/day`
              : `${fmtAmount(a.consumption)}${def.unit}/day`} strong />
        )}
        {a.maintenanceDose != null && (
          <Row k="Calculated maintenance" v={`${fmtAmount(a.maintenanceDose)} mL/day`} />
        )}
        <Row k="Recommended next dose"
          v={a.recommendedDose == null ? "hold and re-test" : `${fmtAmount(a.recommendedDose)} mL/day`} strong />
      </div>

      {/* How well the one number everything rests on is actually known. */}
      {a.effectSolved && (
        <div className="mt-2 rounded-lg p-2.5" style={{ background: "#F7FAFA" }}>
          <div className="text-[10px] font-extrabold uppercase tracking-wide text-ink2 mb-1">
            Solution strength
          </div>
          {a.effectSolved.status === "ok" ? (
            <>
              <p className="text-[12px] text-ink font-medium leading-relaxed">
                Your tank's response across {a.effectSolved.periods} dosing periods puts the real effect at
                about {a.effectSolved.k.toFixed(4)} {def.unit} per mL, against the {a.effectPerMl.toFixed(4)} you have entered
                {Math.abs(a.effectSolved.pctOff) >= 10
                  ? ` — ${fmtAmount(Math.abs(a.effectSolved.pctOff))}% ${a.effectSolved.pctOff > 0 ? "stronger" : "weaker"} than assumed, which shifts every millilitre figure above by the same proportion.`
                  : `, which agrees closely.`}
              </p>
              {onApplyEffect && Math.abs(a.effectSolved.pctOff) >= 10 && a.effectSolved.suggestedPer100L && (
                <Btn variant="ghost" className="w-full mt-2"
                  onClick={() => onApplyEffect(a.effectSolved.suggestedPer100L)}>
                  <span className="flex items-center justify-center gap-1.5">
                    <Save size={13} /> Use {a.effectSolved.suggestedPer100L} {def.unit}/mL/100L
                  </span>
                </Btn>
              )}
            </>
          ) : (
            <p className="text-[12px] text-ink2 font-medium leading-relaxed">
              {a.effectSolved.status === "nochanges"
                ? `Every figure here rests on ${a.effectPerMl.toFixed(4)} ${def.unit} per mL, taken from what you entered. Once you have changed the dose once and tested either side of it, the app can solve for the real value from how the tank responded.`
                : `Solving for the real strength needs two settled dosing periods with a millilitre or more between them. ${a.effectSolved.periods || 0} so far.`}
            </p>
          )}
        </div>
      )}

      {a.used.length > 0 && (
        <div className="mt-2">
          <div className="text-[10px] font-extrabold uppercase tracking-wide text-ink2 mb-1">
            Measurements used
          </div>
          <div className="space-y-0.5">
            {a.used.map((r, i) => (
              <div key={i} className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-bold text-ink2">
                  {fmtDate(r.date)}{fmtTime(r.time) ? ` · ${fmtTime(r.time)}` : ""}
                </span>
                <span className="text-[11px] font-black text-ink">{fmtVal(def, r.value)}{def.unit}</span>
              </div>
            ))}
          </div>
        </div>
      )}


      <p className="text-[11px] text-ink2 font-medium leading-relaxed mt-2">{a.nextCheck}</p>
    </div>
  );
}
