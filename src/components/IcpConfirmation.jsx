import { useEffect, useMemo, useState } from 'react'
import { icpRef, icpStatus } from '../lib/analytics/icp-reference.js'
import { useEscape } from '../lib/backup.jsx'
import { fmtDate, fmtShort } from '../lib/dates.js'
import { joinList } from '../lib/narrative-engine.js'

/* --- ICP panel confirmation ---
 *
 * A lab panel is the most information-dense thing entered into the app, and it
 * arrived silently. This gives it a moment: the elements count in, the ones
 * outside reference are named, and anything that moved since the last panel is
 * shown with its direction.
 */
export function IcpResultPopup({ result, onClose, icps }) {
  useEscape(onClose);
  const AUTO_SECONDS = 16;
  const [left, setLeft] = useState(AUTO_SECONDS);
  const [held, setHeld] = useState(false);
  const [phase, setPhase] = useState(0);      // 0 counting, 1 counted, 2 details

  const summary = useMemo(() => {
    if (!result) return null;
    const els = Object.entries(result.elements || {})
      .map(([n, v]) => ({ n, v, ref: icpRef(n) }))
      .map((e) => ({ ...e, st: icpStatus(e.ref, e.v) }));
    const known = els.filter((e) => e.ref);
    const off = known.filter((e) => e.st !== "ok");
    const detected = els.filter((e) => e.st === "detected");

    /* Movement against the previous panel, so a new result reads as a change
       rather than a snapshot. */
    const prior = (icps || [])
      .filter((p) => p.date < result.date)
      .sort((a, b) => (a.date < b.date ? 1 : -1))[0];
    const moves = [];
    if (prior) {
      for (const e of known) {
        const was = prior.elements ? prior.elements[e.n] : undefined;
        if (was == null || was === e.v) continue;
        const denom = Math.abs(was) || Math.abs(e.v) || 1;
        const pct = ((e.v - was) / denom) * 100;
        if (Math.abs(pct) >= 25) moves.push({ ...e, was, pct });
      }
      moves.sort((a, b) => Math.abs(b.pct) - Math.abs(a.pct));
    }
    return { total: els.length, known: known.length, off, detected, moves: moves.slice(0, 3), prior };
  }, [result, icps]);

  /* The element count ticks up rather than appearing, so the size of the panel
     registers before the detail does. */
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!result || !summary) return;
    const reduced = typeof window !== "undefined" && window.matchMedia
      && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) { setCount(summary.total); setPhase(2); return; }

    setCount(0); setPhase(0);
    let raf = 0, start = 0, cancelled = false;
    const DUR = 1400, DELAY = 420;
    const step = (ts) => {
      if (cancelled) return;
      if (!start) start = ts;
      const e = ts - start - DELAY;
      if (e < 0) { raf = requestAnimationFrame(step); return; }
      const t = Math.min(1, e / DUR);
      setCount(Math.round((1 - Math.pow(1 - t, 2.6)) * summary.total));
      if (t < 1) raf = requestAnimationFrame(step);
      else { setPhase(1); setTimeout(() => setPhase(2), 260); }
    };
    raf = requestAnimationFrame(step);
    return () => { cancelled = true; cancelAnimationFrame(raf); };
  }, [result, summary]);

  useEffect(() => {
    if (!result || held) return;
    if (left <= 0) { onClose(); return; }
    const t = setTimeout(() => setLeft((n) => n - 1), 1000);
    return () => clearTimeout(t);
  }, [result, left, held]);

  if (!result || !summary) return null;

  const clean = summary.off.length === 0 && summary.detected.length === 0;
  const alarming = summary.detected.length > 0;
  const tone = alarming ? "#C4285B" : clean ? "#0B7C86" : "#A2621B";
  const emoji = alarming ? "\u{1F6A8}" : clean ? "\u{1F52C}" : "\u{1F4CB}";

  return (
    <div className="fixed inset-0 flex items-center justify-center p-5" onClick={onClose}
      style={{ background: "rgba(8,25,29,0.45)", zIndex: 70 }}>
      <div onClick={(e) => { e.stopPropagation(); setHeld(true); }}
        className="w-full max-w-xs rounded-3xl bg-white overflow-hidden"
        style={{ boxShadow: "0 24px 60px rgba(8,25,29,0.35)" }}>

        <div className="px-5 pt-6 pb-5 text-center" style={{ background: tone + "12" }}>
          <div style={{ fontSize: 42, lineHeight: 1 }}>{emoji}</div>
          <div className="mt-3 flex items-baseline justify-center gap-1.5">
            <span className={`rc-value text-[38px] font-black leading-none tabular-nums${phase >= 1 ? " landed" : ""}`}
              style={{ color: tone }}>
              <span className="rc-sheen">{count}</span>
            </span>
            <span className="text-[13px] font-bold text-ink2">elements</span>
          </div>
          <div className="text-[12px] font-black text-ink mt-1">
            {result.lab || "ICP panel"} · {fmtDate(result.date)}
          </div>
        </div>

        {phase >= 2 && (
          <div className="px-5 py-4 rc-stagger">
            <div className="text-center" style={{ animationDelay: "0ms" }}>
              <div className="text-[15px] font-black" style={{ color: tone }}>
                {alarming ? "Contaminant detected"
                  : clean ? "Everything in reference"
                  : `${summary.off.length} outside reference`}
              </div>
              <p className="text-[13px] text-ink font-medium leading-relaxed mt-1">
                {alarming
                  ? `${joinList(summary.detected.map((e) => e.n))} should read zero. Worth finding what went in recently.`
                  : clean
                  ? `All ${summary.known} elements with a published range came back inside it.`
                  : `${summary.known - summary.off.length} of ${summary.known} elements sit inside their range.`}
              </p>
            </div>

            {summary.off.length > 0 && (
              <div className="mt-3 space-y-1" style={{ animationDelay: "150ms" }}>
                {summary.off.slice(0, 4).map((e) => (
                  <div key={e.n} className="flex items-center justify-between gap-2">
                    <span className="text-[12px] font-bold text-ink capitalize truncate">{e.n}</span>
                    <span className="text-[12px] font-black shrink-0"
                      style={{ color: e.st === "detected" ? "#C4285B" : "#A2621B" }}>
                      {e.v} · {e.st}
                    </span>
                  </div>
                ))}
                {summary.off.length > 4 && (
                  <div className="text-[11px] font-bold text-ink2">
                    and {summary.off.length - 4} more
                  </div>
                )}
              </div>
            )}

            {summary.moves.length > 0 && (
              <div className="mt-3 pt-3 border-t border-app" style={{ animationDelay: "300ms" }}>
                <div className="text-[10px] font-extrabold uppercase tracking-wide text-ink2 mb-1.5">
                  Biggest moves since {fmtShort(summary.prior.date)}
                </div>
                {summary.moves.map((m) => (
                  <div key={m.n} className="flex items-center justify-between gap-2">
                    <span className="text-[12px] font-bold text-ink capitalize truncate">{m.n}</span>
                    <span className="text-[12px] font-black shrink-0"
                      style={{ color: m.pct > 0 ? "#A2621B" : "#1D6FA5" }}>
                      {m.was} {m.pct > 0 ? "\u2191" : "\u2193"} {m.v}
                    </span>
                  </div>
                ))}
              </div>
            )}

            <button onClick={onClose}
              className="mt-4 w-full rounded-xl py-2.5 text-[13px] font-extrabold text-white"
              style={{ background: tone, animationDelay: "450ms" }}>
              Done
            </button>
            <div className="mt-2 text-center" style={{ animationDelay: "560ms" }}>
              {held
                ? <span className="text-[10px] font-bold text-ink2">Staying open — tap Done when you're finished</span>
                : <span className="text-[10px] font-bold text-ink2">Closes in {left}s · tap to keep open</span>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
