import { useState } from 'react'
import { Btn, FindingList, PARAM_ICON, SectionTitle } from './DoseExpectation.jsx'
import { AlkAssessmentBlock, Card } from './ErrorBoundary.jsx'
import { Beaker, ChevronDown, ChevronUp, X } from '../icons.jsx'
import { fmtAmount, fmtVal } from '../lib/analytics/time-in-range.js'
import { STATUS_COLOR, paramStatus } from '../lib/dates.js'
import { findingsFor } from '../lib/dosing/corrected-strength.js'

/* ---------------------------------- Dosing Wizard ---------------------------------- */

/* A card per element, showing the verdict before it is opened. The three sit
   side by side so the question "does anything need doing?" is answered by
   glancing at the colours, not by reading three assessments. */
export function DoseElementCard({ def, a, open, onToggle }) {
  const Icon = PARAM_ICON[def.key] || Beaker;
  const act = a ? a.action : null;
  const tone = act === "implausible" ? "#C4285B"
    : act === "increase" || act === "decrease" ? "#0B7C86"
    : act === "hold" ? "#45605F" : "#5F7575";
  const arrow = act === "increase" ? "\u2191" : act === "decrease" ? "\u2193" : null;

  const headline = !a ? "Set up"
    : act === "implausible" ? "Check setup"
    : act === "increase" || act === "decrease"
    ? `${fmtAmount(a.currentDose)} \u2192 ${fmtAmount(a.recommendedDose)}`
    : "No change";
  const sub = !a ? "needs volume and strength"
    : act === "implausible" ? "strength looks wrong"
    : act === "increase" || act === "decrease"
    ? (a.staged ? "staged step" : "mL/day")
    : a.ok ? "dose matches use" : "more readings needed";

  /* A miniature of where the parameter sits in its band, so the card carries
     the situation as well as the verdict. */
  const pos = a && a.current && def.max > def.min
    ? Math.max(0, Math.min(1, (a.current.value - def.min) / (def.max - def.min)))
    : null;

  return (
    <button onClick={onToggle} className="w-full text-left">
      <Card className="p-3 h-full flex flex-col overflow-hidden transition-all"
        style={{ borderColor: open ? tone + "66" : undefined,
                 boxShadow: open ? `0 0 0 2px ${tone}22` : undefined }}>
        <div className="flex items-center gap-1.5 mb-1.5">
          <span className="w-5 h-5 rounded-md flex items-center justify-center shrink-0"
            style={{ background: def.color + "22" }}>
            <Icon size={11} style={{ color: def.color }} strokeWidth={2.6} />
          </span>
          <span className="text-[11px] font-black text-ink truncate flex-1 min-w-0">{def.label}</span>
          {open ? <ChevronUp size={13} className="text-ink2 shrink-0" />
                : <ChevronDown size={13} className="text-ink2 shrink-0" />}
        </div>

        <div className="flex items-baseline gap-1">
          {arrow && <span className="text-[13px] font-black" style={{ color: tone }}>{arrow}</span>}
          <span className="text-[14px] font-black leading-none tabular-nums" style={{ color: tone }}>
            {headline}
          </span>
        </div>
        <div className="text-[9px] font-bold text-ink2 mt-0.5 truncate">{sub}</div>

        {pos != null && (
          <div className="mt-2">
            <div className="h-1 rounded-full relative" style={{ background: "#E9EFEE" }}>
              <div className="absolute rounded-full" style={{ left: 0, right: 0, top: 0, height: 4,
                background: def.color + "33" }} />
              <div className="absolute rounded-full"
                style={{ left: `${pos * 100}%`, top: -2, width: 4, height: 8,
                         background: STATUS_COLOR[paramStatus(def, a.current.value)] || def.color,
                         transform: "translateX(-50%)" }} />
            </div>
            <div className="text-[9px] font-bold text-ink2 mt-1 truncate">
              {fmtVal(def, a.current.value)}{def.unit}
            </div>
          </div>
        )}

        {a && a.activePlan && (
          <div className="mt-1.5 rounded px-1.5 py-0.5 inline-block"
            style={{ background: "#0B7C8618" }}>
            <span className="text-[8px] font-extrabold uppercase tracking-wide" style={{ color: "#0B7C86" }}>
              in progress
            </span>
          </div>
        )}
      </Card>
    </button>
  );
}


/* The correction control. Three states, and only one is ever on screen:
   nothing running and the level is out of band -> offer it;
   running -> show progress and let it be cancelled;
   arrived -> one tap back to the maintenance dose. */
export function CorrectionPanel({ def, state, offers, onStart, onCancel, onFinish }) {
  /* Open on the quickest pace that is actually workable rather than a fixed
     default. Defaulting to "steady" showed a refusal for calcium at 530 while
     its gentle option would have brought it back in a fortnight — the panel
     hid a working answer behind a preference. */
  const best = ["quick", "steady", "gentle"].find((k) => offers && offers[k] && offers[k].possible);
  const [pace, setPace] = useState(null);
  const chosen = pace && offers && offers[pace] && offers[pace].possible ? pace : (best || "steady");
  if (!def) return null;
  const st = state || {};
  const plan = st.correctionPlan;

  if (plan && st.state === "correction-done") {
    return (
      <Card className="p-4 mt-3" style={{ borderColor: "#0B7C8640", background: "#0B7C8608" }}>
        <div className="text-[11px] font-extrabold uppercase tracking-wide text-ink2 mb-1">Correction complete</div>
        <div className="text-sm font-black text-ink">{st.headline}</div>
        <p className="text-[12px] text-ink2 mt-1 leading-snug">{st.detail}</p>
        <div className="flex gap-2 mt-3">
          <Btn onClick={onFinish}>Set dose to {fmtAmount(plan.returnDose)} mL/day</Btn>
          <Btn variant="ghost" onClick={onCancel}>Dismiss</Btn>
        </div>
      </Card>
    );
  }

  if (plan) {
    const pct = plan.movedSoFar != null && plan.remaining != null
      ? Math.max(0, Math.min(100, Math.round(plan.movedSoFar / (plan.movedSoFar + plan.remaining) * 100)))
      : 0;
    return (
      <Card className="p-4 mt-3" style={{ borderColor: "#1D6FA540", background: "#1D6FA508" }}>
        <div className="text-[11px] font-extrabold uppercase tracking-wide text-ink2 mb-1">Correction running</div>
        <div className="text-sm font-black text-ink">{st.headline}</div>
        <p className="text-[12px] text-ink2 mt-1 leading-snug">{st.detail}</p>
        <div className="mt-2 h-1.5 rounded-full overflow-hidden" style={{ background: "#1D6FA520" }}>
          <div style={{ width: `${pct}%`, height: "100%", background: "#1D6FA5" }} />
        </div>
        <div className="text-[10px] font-bold text-ink2 mt-1">
          {fmtVal(def, plan.startValue)} → {fmtVal(def, plan.level)} → {fmtVal(def, plan.target)}{def.unit}
        </div>
        <div className="mt-3">
          <Btn variant="ghost" onClick={onCancel}>Cancel and go back to {fmtAmount(plan.returnDose)} mL/day</Btn>
        </div>
      </Card>
    );
  }

  const offer = offers && offers[chosen];
  if (!offer) return null;

  if (!offer.possible) {
    return (
      <Card className="p-4 mt-3" style={{ borderColor: "#A2621B40", background: "#A2621B08" }}>
        <div className="text-[11px] font-extrabold uppercase tracking-wide text-ink2 mb-1">Bringing it back</div>
        <p className="text-[12px] text-ink2 leading-snug">{offer.why}</p>
      </Card>
    );
  }

  return (
    <Card className="p-4 mt-3">
      <div className="text-[11px] font-extrabold uppercase tracking-wide text-ink2 mb-1">Bring it back to range</div>
      <p className="text-[12px] text-ink2 leading-snug">
        {def.label} is {offer.up ? "below" : "above"} your band. The daily dose can walk it
        to {fmtVal(def, offer.target)}{def.unit} if it runs {offer.up ? "above" : "below"} what
        the tank uses for a while, then goes back.
      </p>
      <div className="flex gap-1.5 mt-3">
        {["gentle", "steady", "quick"].map((k) => {
          const o = offers[k];
          if (!o || !o.possible) return null;
          const on = k === chosen;
          return (
            <button key={k} onClick={() => setPace(k)}
              className="flex-1 rounded-lg px-2 py-2 text-center"
              style={{ border: `1px solid ${on ? "#0B7C86" : "#E3ECEA"}`,
                background: on ? "#0B7C860D" : "transparent" }}>
              <div className="text-[11px] font-black text-ink capitalize">{k}</div>
              <div className="text-[10px] font-bold text-ink2">{o.days}d</div>
            </button>
          );
        })}
      </div>
      <p className="text-[11px] text-ink2 mt-2 leading-snug">
        Dose {fmtAmount(offer.dose)} mL/day for about {offer.days} day{offer.days === 1 ? "" : "s"},
        then back to {fmtAmount(offer.returnDose)} mL/day. You will be told when it arrives,
        and can cancel at any point.
      </p>
      <div className="mt-3">
        <Btn onClick={() => onStart(offer)}>Start the correction</Btn>
      </div>
    </Card>
  );
}

export function DosingWizard({ paramDefs, alkAssessment, caAssessment, mgAssessment, findings = [],
  onDismissFinding, onApplyAlkDose, onApplyCaDose, onApplyMgDose,
  onClearAlkPlan, onClearCaPlan, onClearMgPlan,
  onLogCorrection, onApplyEffect, onApplyCaEffect, onApplyMgEffect,
  correctionOffers = {}, doseStates = [],
  onStartCorrection, onCancelCorrection, onFinishCorrection }) {

  const items = [
    { key: "alkalinity", a: alkAssessment, apply: onApplyAlkDose, clear: onClearAlkPlan, effect: onApplyEffect },
    { key: "calcium", a: caAssessment, apply: onApplyCaDose, clear: onClearCaPlan, effect: onApplyCaEffect },
    { key: "magnesium", a: mgAssessment, apply: onApplyMgDose, clear: onClearMgPlan, effect: onApplyMgEffect },
  ];

  /* Opens on whichever element actually wants attention, so the common case
     needs no navigation at all. */
  const firstNeeding = items.find((x) => x.a && (x.a.action === "increase" || x.a.action === "decrease"));
  const [openKey, setOpenKey] = useState(firstNeeding ? firstNeeding.key : null);

  const needing = items.filter((x) => x.a && (x.a.action === "increase" || x.a.action === "decrease")).length;
  const active = items.find((x) => x.key === openKey);
  const activeDef = active ? paramDefs.find((d) => d.key === active.key) : null;

  return (
    <div>
      <SectionTitle eyebrow="Two-part" title="Dosing Wizard" />

      <div className="rounded-2xl p-3.5 mb-4"
        style={{ background: needing ? "#0B7C860F" : "#F3F7F6",
                 border: `1px solid ${needing ? "#0B7C8633" : "#E3ECEA"}` }}>
        <p className="text-[13px] text-ink font-medium leading-relaxed">
          {needing
            ? `${needing === 1 ? "One element looks" : `${needing} elements look`} like the dose no longer matches what the tank is using. Tap one below for the working — you set the amount yourself.`
            : "Every dose is currently matching what the tank uses. Nothing needs changing."}
        </p>
        <p className="text-[11px] text-ink2 font-medium leading-relaxed mt-1.5">
          Each element is judged only on readings taken since its own dose last changed. Change one thing
          at a time, and give it the time stated before judging it.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-2 mb-4 items-stretch">
        {items.map(({ key, a }) => {
          const def = paramDefs.find((d) => d.key === key);
          if (!def) return null;
          return (
            <DoseElementCard key={key} def={def} a={a} open={openKey === key}
              onToggle={() => setOpenKey(openKey === key ? null : key)} />
          );
        })}
      </div>

      {active && activeDef && (
        <Card key={active.key} className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: activeDef.color }} />
            <span className="text-[15px] font-black text-ink flex-1">{activeDef.label}</span>
            <button onClick={() => setOpenKey(null)} aria-label="Close"
              className="text-ink2 p-1 -m-1"><X size={16} /></button>
          </div>
          {active.a ? (
            <AlkAssessmentBlock a={active.a} def={activeDef} onApplyDose={active.apply}
              onClearPlan={active.clear}
              onLogCorrection={onLogCorrection ? ((ml, dir) => onLogCorrection(ml, dir, active.key)) : null}
              onApplyEffect={active.effect} />
          ) : (
            <p className="text-[13px] text-ink2 font-medium leading-relaxed">
              Set your tank volume, this element's daily dose and its solution strength in Setup, and log a
              few readings — the assessment will appear here.
            </p>
          )}
          {/* --- Temporary correction ---------------------------------------
              Separate from tuning the dose to match consumption. That job
              keeps a level where it already is; this one moves it somewhere
              else and then ends. Conflating them is what had the app
              recommending a dose cut in the middle of a deliberate rise. */}
          <CorrectionPanel
            def={activeDef}
            state={doseStates.find((d) => d && d.key === active.key)}
            offers={correctionOffers[active.key]}
            onStart={(offer) => onStartCorrection(active.key, offer)}
            onCancel={() => onCancelCorrection(active.key)}
            onFinish={() => onFinishCorrection(active.key)} />

          {findingsFor(findings, active.key).length > 0 && (
            <div className="mt-3">
              <FindingList items={findingsFor(findings, active.key)} compact onDismiss={onDismissFinding} />
            </div>
          )}
        </Card>
      )}

      {!active && (
        <p className="text-[12px] text-ink2 font-medium leading-relaxed text-center px-6">
          Tap any of the three above to see how its figure was reached.
        </p>
      )}
    </div>
  );
}
