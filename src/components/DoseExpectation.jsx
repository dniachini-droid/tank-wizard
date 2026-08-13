import { useEffect, useState } from 'react'
import { Card } from './ErrorBoundary.jsx'
import { Activity, AlertTriangle, ArrowDown, ArrowUp, Beaker, Droplets, FlaskConical, Gauge, Plus, Scale, Target, Waves } from '../icons.jsx'
import { fmtAmount, fmtVal } from '../lib/analytics/time-in-range.js'
import { fmtTime } from '../lib/analytics/time-of-day.js'
import { fmtFriendly } from '../lib/analytics/water-changes.js'
import { ParamGauge, useEscape } from '../lib/backup.jsx'
import { STATUS_COLOR, fmtShort, paramStatus } from '../lib/dates.js'
import { STABILITY_COLOR } from '../lib/stability-engine.js'

/* --- What to expect after a dose change ---
 *
 * A dose change is a prediction as much as an action: it says the tank should
 * move a certain way over a certain time. Stating that up front means the next
 * test either confirms it or doesn't, rather than being read from scratch.
 */
export function DoseChangePopup({ result, onClose }) {
  useEscape(onClose);
  const AUTO = 14;
  const [left, setLeft] = useState(AUTO);
  const [held, setHeld] = useState(false);
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    if (!result) return;
    setPhase(0);
    const t = [setTimeout(() => setPhase(1), 420), setTimeout(() => setPhase(2), 900)];
    return () => t.forEach(clearTimeout);
  }, [result]);

  useEffect(() => {
    if (!result || held) return;
    if (left <= 0) { onClose(); return; }
    const t = setTimeout(() => setLeft((n) => n - 1), 1000);
    return () => clearTimeout(t);
  }, [result, left, held]);

  if (!result) return null;
  const { def, from, to, date, time, testOn, expected, perDay, days, staged, target } = result;
  const up = to > from;
  const tone = "#0B7C86";

  return (
    <div className="fixed inset-0 flex items-center justify-center p-5" onClick={onClose}
      style={{ background: "rgba(8,25,29,0.45)", zIndex: 70 }}>
      <div onClick={(e) => { e.stopPropagation(); setHeld(true); }}
        className="w-full max-w-xs rounded-3xl bg-white overflow-hidden"
        style={{ boxShadow: "0 24px 60px rgba(8,25,29,0.35)" }}>

        <div className="px-5 pt-6 pb-5 text-center" style={{ background: tone + "12" }}>
          <div style={{ fontSize: 40, lineHeight: 1 }}>{up ? "\u{1F4C8}" : "\u{1F4C9}"}</div>
          <div className="mt-3 flex items-baseline justify-center gap-1.5">
            <span className="text-[19px] font-black text-ink2 tabular-nums">{fmtAmount(from)}</span>
            <span className="text-[15px] font-bold text-ink2">{"\u2192"}</span>
            <span className={`rc-value text-[32px] font-black leading-none tabular-nums${phase >= 1 ? " landed" : ""}`}
              style={{ color: tone }}>
              <span className="rc-sheen">{fmtAmount(to)}</span>
            </span>
            <span className="text-[12px] font-bold text-ink2">mL/day</span>
          </div>
          <div className="text-[12px] font-black text-ink mt-1">
            {def.label} · from {fmtFriendly(date)}{fmtTime(time) ? ` at ${fmtTime(time)}` : ""}
          </div>
        </div>

        {phase >= 2 && (
          <div className="px-5 py-4 rc-stagger">
            <div className="text-center" style={{ animationDelay: "0ms" }}>
              <div className="text-[15px] font-black" style={{ color: tone }}>Recorded</div>
              <p className="text-[13px] text-ink font-medium leading-relaxed mt-1">
                {expected != null
                  ? `If this is right, ${def.label.toLowerCase()} should move about ${fmtAmount(Math.abs(perDay))}${def.unit} a day and read near ${fmtVal(def, expected)}${def.unit} when you next test.`
                  : `The next test will show what this dose actually does.`}
              </p>
            </div>

            <div className="mt-3 rounded-xl p-3" style={{ background: "#F7FAFA", animationDelay: "150ms" }}>
              <div className="flex items-center justify-between gap-2 py-1">
                <span className="text-[11px] font-bold text-ink2">Test again</span>
                <span className="text-[12px] font-black text-ink">{fmtFriendly(testOn)}</span>
              </div>
              <div className="flex items-center justify-between gap-2 py-1 border-t border-app">
                <span className="text-[11px] font-bold text-ink2">That's in</span>
                <span className="text-[12px] font-black text-ink">{days} day{days === 1 ? "" : "s"}</span>
              </div>
              {expected != null && (
                <div className="flex items-center justify-between gap-2 py-1 border-t border-app">
                  <span className="text-[11px] font-bold text-ink2">Expect around</span>
                  <span className="text-[12px] font-black" style={{ color: tone }}>
                    {fmtVal(def, expected)}{def.unit}
                  </span>
                </div>
              )}
              {staged && target != null && (
                <div className="flex items-center justify-between gap-2 py-1 border-t border-app">
                  <span className="text-[11px] font-bold text-ink2">Heading for</span>
                  <span className="text-[12px] font-black text-ink">{fmtAmount(target)} mL/day</span>
                </div>
              )}
            </div>

            <p className="text-[11px] text-ink2 font-medium leading-relaxed mt-2" style={{ animationDelay: "300ms" }}>
              It's on your reminders, so it'll appear when it's due. Don't change the dose again before
              then — the reading is only meaningful if this dose has run undisturbed.
            </p>

            <button onClick={onClose}
              className="mt-4 w-full rounded-xl py-2.5 text-[13px] font-extrabold text-white"
              style={{ background: tone, animationDelay: "450ms" }}>
              Done
            </button>
            <div className="mt-2 text-center" style={{ animationDelay: "560ms" }}>
              <span className="text-[10px] font-bold text-ink2">
                {held ? "Staying open — tap Done when you're finished" : `Closes in ${left}s · tap to keep open`}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* DoseAdviceRow lived here. It was the dose UI before the Dosing Wizard, and
   the wizard renders AlkAssessmentBlock directly, so nothing referenced it any
   more — an old screen kept alive only by being defined. */

/* A function declaration rather than a const arrow: buildBriefing calls this
   and is defined earlier in the file, so it has to hoist. */
/* The stable identity of a finding, used by every surface that can dismiss
   one. Previously the parameter modal and Insights keyed on id+title while the
   summary keyed on id alone, so the same finding had two identities and
   dismissing it in one place left it showing in the other. */
export function findingKey(f) {
  return "finding|" + f.id;
}

/* What has to hold for that dismissal to stay in force. The title carries the
   severity wording and, for urgent findings, the reading itself — so a worse
   number brings it straight back. */
export function findingSignature(f) {
  return f.severity === "act" && f.value != null
    ? `${f.id}|${f.title}|${f.value}`
    : `${f.id}|${f.title}`;
}

/* Shared by every surface: is this finding currently put away? */
export function findingHidden(f, dismissed) {
  const e = (dismissed || {})[findingKey(f)];
  if (e == null) return false;
  const sig = e && typeof e === "object" ? e.sig : null;
  /* A bare date is the old format and lapses rather than sticking forever. */
  return sig != null && sig === findingSignature(f);
}

export function FindingList({ items, compact = false, onDismiss = null }) {
  if (!items || !items.length) return null;
  const tone = (sev) => (sev === "act" ? "#C4285B" : sev === "watch" ? "#A2621B" : "#45605F");
  return (
    <div className={compact ? "space-y-1.5" : "space-y-2"}>
      {items.map((f) => (
        <div key={f.id} className="rounded-lg p-2.5" style={{ background: tone(f.severity) + "10", border: `1px solid ${tone(f.severity)}30` }}>
          <div className="flex items-center gap-1.5 mb-0.5">
            <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: tone(f.severity) }} />
            <span className="text-[11px] font-extrabold uppercase tracking-wide flex-1" style={{ color: tone(f.severity) }}>
              {f.title}
            </span>
          </div>
          <p className="text-[12px] text-ink font-medium leading-relaxed">{f.detail}</p>
          {onDismiss && (
            <div className="flex justify-end mt-1.5">
              <button onClick={() => onDismiss(f)}
                className="text-[10px] font-extrabold uppercase tracking-wide px-2 py-1 rounded-md"
                style={{ color: tone(f.severity), background: tone(f.severity) + "14" }}>
                Got it — hide this
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

/* A small badge for dashboard cards, so a card looks as interesting as it is. */
/* An icon per parameter, so a card is recognisable before it is read. Reusing
   the icon set already imported keeps the weight and stroke consistent with
   the rest of the app. */
export const PARAM_ICON = {
  alkalinity: Waves, salinity: Droplets, calcium: Scale, magnesium: Gauge,
  potassium: Target, phosphate: Beaker, nitrate: FlaskConical,
  ammonia: AlertTriangle, ph: Activity,
};

/* A short trace of where the parameter has been. It replaces a second bar with
   something that carries more information in the same space. */
export function MicroSpark({ rows, def, colour }) {
  if (!rows || rows.length < 3) return <div style={{ height: 20 }} />;
  const W = 100, H = 20, P = 2;
  const vals = rows.map((r) => r.value);
  const lo = Math.min(...vals, def.min), hi = Math.max(...vals, def.max);
  const span = (hi - lo) || 1;
  const x = (i) => (i / (rows.length - 1)) * W;
  const y = (v) => H - P - ((v - lo) / span) * (H - P * 2);
  const d = rows.map((r, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(r.value).toFixed(1)}`).join(" ");
  const bandTop = y(def.max), bandBot = y(def.min);
  const last = [x(rows.length - 1), y(rows[rows.length - 1].value)];
  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="w-full" style={{ height: 20 }}>
      <rect x="0" y={Math.min(bandTop, bandBot)} width={W}
        height={Math.max(1, Math.abs(bandBot - bandTop))} fill={colour} opacity="0.10" />
      <path d={d} fill="none" stroke={colour} strokeWidth="1.6" strokeLinecap="round"
        strokeLinejoin="round" opacity="0.75" vectorEffect="non-scaling-stroke" />
      <circle cx={last[0]} cy={last[1]} r="2" fill={colour} vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

export function ParamCard({ def, reading, recent, stab, findings, rows, onOpen, onLog = null, dose = null }) {
  const status = reading ? paramStatus(def, reading.value) : "unknown";
  const tone = STATUS_COLOR[status] || "#45605F";
  const Icon = PARAM_ICON[def.key] || Beaker;
  const notes = findings || [];
  const worst = notes[0];

  /* Direction since the previous reading, shown as a glyph rather than a
     sentence — enough to tell a rising tank from a falling one at a glance. */
  const prev = rows && rows.length >= 2 ? rows[rows.length - 2].value : null;
  const delta = reading && prev != null ? reading.value - prev : null;
  const moved = delta != null && Math.abs(delta) >= (def.step || 0.01);

  return (
    <div className="relative h-full">
      <button onClick={onOpen} className="text-left h-full w-full">
      <Card className="h-full flex flex-col overflow-hidden hover:shadow-md transition-all cursor-pointer"
        style={{ borderColor: status === "ok" ? undefined : tone + "55" }}>

        {/* A tinted cap in the parameter's own colour, which is what makes the
            grid scannable rather than eight identical white boxes. */}
        <div className="flex items-center gap-1.5 px-3 py-2"
          style={{ background: def.color + "14" }}>
          <span className="w-5 h-5 rounded-md flex items-center justify-center shrink-0"
            style={{ background: def.color + "26" }}>
            <Icon size={11} style={{ color: def.color }} strokeWidth={2.6} />
          </span>
          <span className="text-[12px] font-black truncate flex-1 min-w-0" style={{ color: "#08191D" }}>
            {def.label}
          </span>
          {moved && (
            <span className="shrink-0" style={{ color: tone, opacity: 0.8 }}>
              {delta > 0 ? <ArrowUp size={11} strokeWidth={3} /> : <ArrowDown size={11} strokeWidth={3} />}
            </span>
          )}
          {/* Sits in the header row rather than floating over the card, so it
              cannot land on top of the trend arrow. Nested inside the card's
              own button, so it stops the event to log rather than open. */}
          {onLog && (
            <span role="button" tabIndex={0}
              onClick={(e) => { e.stopPropagation(); e.preventDefault(); onLog(def.key); }}
              aria-label={`Log a ${def.label.toLowerCase()} reading`}
              className="shrink-0 rounded-md flex items-center justify-center cursor-pointer"
              style={{ width: 18, height: 18, background: def.color + "26", color: def.color }}>
              <Plus size={11} strokeWidth={3} />
            </span>
          )}
        </div>

        <div className="px-3 pt-2 pb-2.5 flex flex-col gap-1.5 flex-1">
          <div className="flex items-baseline gap-1">
            <span className="font-black text-[24px] leading-none tabular-nums" style={{ color: tone }}>
              {reading ? fmtVal(def, reading.value) : "\u2014"}
            </span>
            <span className="text-[10px] font-bold text-ink2">{def.unit}</span>
          </div>

          <ParamGauge def={def} value={reading ? reading.value : null} recent={recent} compact />

          <MicroSpark rows={rows} def={def} colour={def.color} />

          <div className="flex items-center justify-between gap-1 mt-auto pt-0.5">
            <span className="text-[9px] font-extrabold uppercase tracking-wide truncate"
              style={{ color: stab ? STABILITY_COLOR[stab.grade] || "#45605F" : "#5F7575" }}>
              {stab ? stab.label : "\u2014"}
            </span>
            <span className="text-[9px] font-bold text-ink2 shrink-0">
              {reading ? fmtShort(reading.date) : ""}
            </span>
          </div>

          {dose && dose.state !== "idle" && (
            <div className="flex items-center gap-1 rounded-md px-1.5 py-1"
              style={{ background: dose.tone + "14" }}>
              <span className="w-1 h-1 rounded-full shrink-0" style={{ background: dose.tone }} />
              <span className="text-[9px] font-extrabold uppercase tracking-wide truncate"
                style={{ color: dose.tone }}>
                {dose.short}
              </span>
            </div>
          )}

          {worst && (
            <div className="flex items-center gap-1 rounded-md px-1.5 py-1"
              style={{ background: (worst.severity === "act" ? "#C4285B" : worst.severity === "watch" ? "#A2621B" : "#45605F") + "14" }}>
              <span className="w-1 h-1 rounded-full shrink-0"
                style={{ background: worst.severity === "act" ? "#C4285B" : worst.severity === "watch" ? "#A2621B" : "#45605F" }} />
              <span className="text-[9px] font-extrabold uppercase tracking-wide truncate"
                style={{ color: worst.severity === "act" ? "#C4285B" : worst.severity === "watch" ? "#A2621B" : "#45605F" }}>
                {notes.length > 1 ? `${notes.length} notes` : worst.title}
              </span>
            </div>
          )}
        </div>
      </Card>
      </button>
    </div>
  );
}

export function SectionTitle({ eyebrow, title, action }) {
  return (
    <div className="flex items-end justify-between mb-4 gap-3 flex-wrap">
      <div>
        {eyebrow && <div className="text-[11px] uppercase tracking-[0.14em] text-teal-brand font-extrabold mb-1">{eyebrow}</div>}
        <h2 className="text-2xl font-display text-ink">{title}</h2>
      </div>
      {action}
    </div>
  );
}

export function Btn({ children, onClick, variant = "primary", type = "button", className = "", disabled }) {
  const styles = {
    primary: "bg-teal-brand text-white hover:brightness-110 font-bold shadow-sm",
    ghost: "bg-white border-2 border-app text-ink hover:border-teal-brand font-bold",
    danger: "bg-transparent text-rose-700 hover:bg-rose-50 font-bold",
  };
  return (
    <button type={type} onClick={onClick} disabled={disabled}
      className={`px-3.5 py-2 rounded-lg text-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${styles[variant]} ${className}`}>
      {children}
    </button>
  );
}

export function Field({ label, children, className = "" }) {
  return (
    <label className={`block min-w-0 ${className}`}>
      <span className="block text-xs font-bold text-ink2 mb-1.5">{label}</span>
      {children}
    </label>
  );
}

export const inputCls = "w-full min-w-0 max-w-full bg-white border-2 border-app rounded-lg px-3 py-2 text-sm font-semibold text-ink placeholder:text-ink2/50 placeholder:font-normal focus:outline-none focus:ring-2 focus:ring-teal-brand/40 focus:border-teal-brand";
