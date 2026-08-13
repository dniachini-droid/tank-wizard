import { useEffect, useMemo, useState } from 'react'
import { fmtFriendly } from '../lib/analytics/water-changes.js'
import { useEscape } from '../lib/backup.jsx'
import { daysBetween } from '../lib/dates.js'
import { intervalLabel } from '../lib/reminders.js'

/* --- Task completion ---
 *
 * Ticking off a chore used to move a row quietly. This marks it, and shows the
 * run of times it has been done — the one thing the app knows that you don't
 * carry in your head.
 */
export function TaskDonePopup({ result, onClose }) {
  useEscape(onClose);
  const AUTO_SECONDS = 10;
  const [left, setLeft] = useState(AUTO_SECONDS);
  const [held, setHeld] = useState(false);
  const [lit, setLit] = useState(0);

  const stats = useMemo(() => {
    if (!result) return null;
    const dates = (result.history || []).slice(0, 12);
    /* Actual interval between completions, which is often not the interval that
       was set — worth showing without comment. */
    const gaps = [];
    for (let i = 1; i < dates.length; i++) gaps.push(daysBetween(dates[i], dates[i - 1]));
    const avg = gaps.length ? gaps.reduce((a, b) => a + b, 0) / gaps.length : null;
    return { dates, count: (result.history || []).length, avg };
  }, [result]);

  /* Stars light one at a time, most recent last, so the run reads left to right. */
  useEffect(() => {
    if (!result || !stats) return;
    const reduced = typeof window !== "undefined" && window.matchMedia
      && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const n = Math.min(stats.dates.length, 12);
    if (reduced) { setLit(n); return; }
    setLit(0);
    const timers = [];
    for (let i = 1; i <= n; i++) timers.push(setTimeout(() => setLit(i), 380 + i * 110));
    return () => timers.forEach(clearTimeout);
  }, [result, stats]);

  useEffect(() => {
    if (!result || held) return;
    if (left <= 0) { onClose(); return; }
    const t = setTimeout(() => setLeft((n) => n - 1), 1000);
    return () => clearTimeout(t);
  }, [result, left, held]);

  if (!result || !stats) return null;
  const tone = "#0B7C86";
  const shown = stats.dates.slice().reverse();   // oldest first

  return (
    <div className="fixed inset-0 flex items-center justify-center p-5" onClick={onClose}
      style={{ background: "rgba(8,25,29,0.45)", zIndex: 70 }}>
      <div onClick={(e) => { e.stopPropagation(); setHeld(true); }}
        className="w-full max-w-xs rounded-3xl bg-white overflow-hidden"
        style={{ boxShadow: "0 24px 60px rgba(8,25,29,0.35)" }}>

        <div className="px-5 pt-6 pb-5 text-center" style={{ background: tone + "12" }}>
          <div style={{ fontSize: 42, lineHeight: 1 }}>{"\u2705"}</div>
          <div className="text-[17px] font-black text-ink mt-3">{result.label}</div>
          <div className="text-[12px] font-bold text-ink2 mt-0.5">
            done {fmtFriendly(result.date)}
          </div>

          {/* The run so far. Twelve at most, so it stays a glance not a list. */}
          <div className="flex items-center justify-center gap-1 mt-3 flex-wrap">
            {shown.map((d, i) => {
              const isLatest = i === shown.length - 1;
              return (
                <span key={d + i}
                  className={i < lit ? "tp-star" : undefined}
                  style={{
                    fontSize: isLatest ? 19 : 14,
                    opacity: i < lit ? 1 : 0,
                    animationDelay: `${i * 40}ms`,
                    lineHeight: 1,
                  }}>
                  {isLatest ? "\u2B50" : "\u2734\uFE0F"}
                </span>
              );
            })}
          </div>
        </div>

        <div className="px-5 py-4 text-center rc-stagger">
          <div className="text-[15px] font-black" style={{ color: tone, animationDelay: "260ms" }}>
            {stats.count === 1 ? "First time logged"
              : `${stats.count} times now`}
          </div>
          <p className="text-[13px] text-ink font-medium leading-relaxed mt-1"
            style={{ animationDelay: "380ms" }}>
            {stats.avg != null
              ? `You do this about every ${Math.round(stats.avg)} days${
                  result.intervalDays && Math.abs(stats.avg - result.intervalDays) >= 2
                    ? `, against a schedule of ${intervalLabel(result.intervalDays).replace("every ", "")}`
                    : " — right on schedule"}.`
              : "The next one is scheduled from today."}
          </p>

          {result.nextDue && (
            <div className="mt-3 pt-3 border-t border-app" style={{ animationDelay: "500ms" }}>
              <div className="text-[11px] font-bold text-ink2">Next due</div>
              <div className="text-[13px] font-black text-ink">
                {fmtFriendly(result.nextDue)}
                {result.intervalDays
                  ? <span className="text-ink2 font-bold"> · {intervalLabel(result.intervalDays)}</span>
                  : null}
              </div>
            </div>
          )}

          <button onClick={onClose}
            className="mt-4 w-full rounded-xl py-2.5 text-[13px] font-extrabold text-white"
            style={{ background: tone, animationDelay: "620ms" }}>
            Done
          </button>
          <div className="mt-2" style={{ animationDelay: "740ms" }}>
            {held
              ? <span className="text-[10px] font-bold text-ink2">Staying open — tap Done when you're finished</span>
              : <span className="text-[10px] font-bold text-ink2">Closes in {left}s · tap to keep open</span>}
          </div>
        </div>
      </div>
    </div>
  );
}
