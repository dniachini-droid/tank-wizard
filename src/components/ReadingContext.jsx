import { fmtVal } from '../lib/analytics/time-in-range.js'
import { byOldest } from '../lib/analytics/time-of-day.js'
import { STATUS_COLOR } from '../lib/dates.js'

/* --- The new reading in context ---
 *
 * A number alone doesn't say whether 9.3 is the highest in a fortnight or the
 * middle of a steady run. This draws the recent history and lands on the value
 * just logged, so the reading arrives with its own background.
 */
export function buildReadingSeries(def, readings, result) {
  const prior = (readings || [])
    .filter((r) => r.param === def.key)
    .sort(byOldest)
    .slice(-11);
  return [...prior, { date: result.date, time: result.time, value: result.value, isNew: true }];
}

/* --- Geometry shared by the chart and the counter ---
 *
 * Both are driven from one progress value, so the travelling dot, the drawn
 * line and the number on screen cannot drift apart. Three separate animations
 * — a CSS dash, an SVG motion path and a JS timer — could never stay in step,
 * which is why the dot ran ahead of its own line.
 */
export function readingGeometry(def, rows, W, H, PAD) {
  const vals = rows.map((r) => r.value);
  const lo = Math.min(...vals, def.min), hi = Math.max(...vals, def.max);
  const span = (hi - lo) || 1;
  const pad = span * 0.22;
  const yMin = lo - pad, yMax = hi + pad;

  /* Room on the left for axis labels. Without them the line has shape but no
     scale, and you cannot tell a 0.2 dKH move from a 2 dKH one. */
  const AXIS = 34;
  const x = (i) => AXIS + (i / (rows.length - 1)) * (W - AXIS - PAD);
  const y = (v) => H - PAD - ((v - yMin) / (yMax - yMin)) * (H - PAD * 2);
  const pts = rows.map((r, i) => [x(i), y(r.value)]);

  /* Cumulative arc length, so the drawn line can be cut at exactly the point
     the dot has reached rather than at a proportional guess. */
  const seg = [], cum = [0];
  for (let i = 1; i < pts.length; i++) {
    const d = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
    seg.push(d); cum.push(cum[i - 1] + d);
  }
  const total = cum[cum.length - 1] || 1;

  /* Position at progress p, interpolated between readings — so between a 9.0
     and a 10.0 the counter runs through 9.1, 9.2, 9.3 rather than jumping. */
  const at = (p) => {
    const t = Math.max(0, Math.min(1, p)) * (rows.length - 1);
    const i = Math.min(rows.length - 2, Math.floor(t));
    const f = rows.length > 1 ? t - i : 0;
    return {
      value: rows[i].value + (rows[i + 1].value - rows[i].value) * f,
      px: pts[i][0] + (pts[i + 1][0] - pts[i][0]) * f,
      py: pts[i][1] + (pts[i + 1][1] - pts[i][1]) * f,
      drawn: cum[i] + seg[i] * f,
      index: i, frac: f,
    };
  };

  const d = pts.map(([px, py], i) => `${i ? "L" : "M"}${px.toFixed(1)},${py.toFixed(1)}`).join(" ");
  /* Axis labels: the band edges plus the highest and lowest readings actually
     plotted, so a peak on the line can be read off the left rather than
     guessed at. Anything closer than 11px to a label already chosen is
     dropped, since two overlapping numbers are worse than one. */
  const dataMax = Math.max(...vals), dataMin = Math.min(...vals);
  const candidates = [dataMax, def.max, def.min, dataMin]
    .filter((v, i, a) => a.indexOf(v) === i)
    .sort((a, b) => b - a);
  const ticks = [];
  for (const val of candidates) {
    if (ticks.every((t) => Math.abs(y(t) - y(val)) > 11)) ticks.push(val);
  }

  return { pts, total, at, d, y, yMin, yMax, AXIS, ticks,
           bandTop: y(def.max), bandBottom: y(def.min), W, H };
}

export function ReadingSparkline({ def, rows, result, progress, geo }) {
  const W = geo.W, H = geo.H;
  if (!rows || rows.length < 2) return null;

  const tone = STATUS_COLOR[result.status] || def.color;
  const head = geo.at(progress);
  const done = progress >= 1;
  const last = geo.pts[geo.pts.length - 1];

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full rc-chart" style={{ height: H }} aria-hidden="true">
      <defs>
        <filter id={`rcGlow-${def.key}`} x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="3.4" result="b" />
          <feMerge><feMergeNode in="b" /><feMergeNode in="b" /></feMerge>
        </filter>
        <filter id={`rcHead-${def.key}`} x="-300%" y="-300%" width="700%" height="700%">
          <feGaussianBlur stdDeviation="3" />
        </filter>
        <linearGradient id={`rcArea-${def.key}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={tone} stopOpacity="0.26" />
          <stop offset="100%" stopColor={tone} stopOpacity="0" />
        </linearGradient>
        {/* The fill is revealed by a rectangle that tracks the head, so it can
            never run ahead of the line above it. */}
        <clipPath id={`rcClip-${def.key}`}>
          <rect x={0} y={0} width={head.px} height={H} />
        </clipPath>
      </defs>

      {/* Scale: band edges, plus the peak and trough of what's plotted. Band
          lines are drawn more strongly, since those are the thresholds. */}
      {geo.ticks.map((val, i) => {
        const isBand = val === def.max || val === def.min;
        return (
          <g key={i} className="rc-band">
            <line x1={geo.AXIS - 4} x2={W} y1={geo.y(val)} y2={geo.y(val)}
              stroke={isBand ? tone : "#9FB0AE"} strokeOpacity={isBand ? 0.32 : 0.22}
              strokeWidth="1" strokeDasharray={isBand ? "3 3" : "2 4"} />
            <text x={geo.AXIS - 7} y={geo.y(val) + 3.6} textAnchor="end"
              fontSize="10.5" fontWeight={isBand ? 800 : 700}
              fill={isBand ? "#08191D" : "#3D5654"}>
              {fmtVal(def, val)}
            </text>
          </g>
        );
      })}

      {/* Area beneath the line, filling in behind the head. */}
      <path d={`${geo.d} L${geo.pts[geo.pts.length - 1][0]},${H} L${geo.pts[0][0]},${H} Z`}
        fill={`url(#rcArea-${def.key})`} clipPath={`url(#rcClip-${def.key})`} />

      <rect x={geo.AXIS} y={Math.min(geo.bandTop, geo.bandBottom)} width={W - geo.AXIS}
        height={Math.max(2, Math.abs(geo.bandBottom - geo.bandTop))}
        fill={tone}
        className={`rc-band${done && result.status === "ok" ? " rc-band-hit" : ""}`} />

      {/* Both strokes are cut at the dot's exact position along the path. */}
      <path d={geo.d} fill="none" stroke={tone} strokeWidth="4.5" strokeLinecap="round"
        strokeLinejoin="round" opacity="0.45" filter={`url(#rcGlow-${def.key})`}
        strokeDasharray={geo.total} strokeDashoffset={geo.total - head.drawn} />
      <path d={geo.d} fill="none" stroke={tone} strokeWidth="2.6" strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray={geo.total} strokeDashoffset={geo.total - head.drawn} />

      {/* A reading's dot lights up as the head passes it. Nothing is drawn
          before the travel starts: the first dot otherwise appeared with the
          empty chart and the falling head then landed on top of it, which drew
          the eye to the wrong thing. */}
      {progress > 0 && geo.pts.slice(0, -1).map(([px, py], i) => (
        <circle key={i} cx={px} cy={py} r="2.6" fill={tone}
          opacity={progress * (rows.length - 1) >= i ? 0.55 : 0}
          style={{ transition: "opacity 200ms ease-out" }} />
      ))}

      {/* The head itself — the same coordinates the counter is reading from.
          Before the travel begins it drops onto the first point. */}
      {!done && (
        <g className={progress <= 0 ? "rc-drop" : undefined}>
          <circle cx={head.px} cy={head.py} r="8" fill={tone} opacity="0.5"
            filter={`url(#rcHead-${def.key})`} />
          <circle cx={head.px} cy={head.py} r="3.4" fill="#fff" opacity="0.95" />
        </g>
      )}

      {done && (
        <>
          <circle cx={last[0]} cy={last[1]} r="4" fill="none" stroke={tone} strokeWidth="2"
            className="rc-ring" />
          <circle cx={last[0]} cy={last[1]} r="4" fill="none" stroke={tone} strokeWidth="1.5"
            className="rc-ring rc-ring2" />
          <circle cx={last[0]} cy={last[1]} r="9" fill={tone} opacity="0.18" className="rc-new" />
          <circle cx={last[0]} cy={last[1]} r="4.8" fill={tone} className="rc-new" />
          <circle cx={last[0]} cy={last[1]} r="1.9" fill="#fff" className="rc-new" />
        </>
      )}
    </svg>
  );
}
