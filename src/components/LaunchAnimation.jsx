import { useEffect, useState } from 'react'
import { useEscape } from '../lib/backup.jsx'

/* --- Launch animation ---
 *
 * A reef scene that plays once per session and then washes away to reveal the
 * dashboard sitting behind it. Skippable at any point.
 */

/* Branching stony coral, generated rather than drawn, so no two clumps repeat.
   Tapering strokes and polyp dots are what stop it reading as a bare shrub. */
export function CoralClump({ x, y, scale = 1, colour, tip, depth = 3, delay = 0, soft = false, lean = 0 }) {
  const seg = [];
  const grow = (px, py, ang, len, w, d) => {
    const steps = 5;
    for (let i = 0; i < steps; i++) {
      const t0 = i / steps, t1 = (i + 1) / steps;
      const a0 = ang + lean * t0 * 0.5, a1 = ang + lean * t1 * 0.5;
      seg.push({
        x: px + Math.cos(a0) * len * t0, y: py - Math.sin(a0) * len * t0,
        x2: px + Math.cos(a1) * len * t1, y2: py - Math.sin(a1) * len * t1,
        w: w * (1 - t1 * 0.28), tipEnd: d === 0 && i === steps - 1,
      });
    }
    const ex = px + Math.cos(ang) * len, ey = py - Math.sin(ang) * len;
    if (d <= 0) return;
    grow(ex, ey, ang + 0.40 + d * 0.03, len * 0.70, w * 0.66, d - 1);
    grow(ex, ey, ang - 0.44 - d * 0.02, len * 0.70, w * 0.66, d - 1);
  };
  grow(0, 0, Math.PI / 2, 30, 8, depth);
  const tips = seg.filter((b) => b.tipEnd);

  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <g className="sp-coral" style={{ animationDelay: `${delay}ms` }}>
        <g className={soft ? "sp-swaySoft" : "sp-sway"} style={{ animationDelay: `${delay % 1200}ms` }}>
          <ellipse cx="0" cy="2" rx={14} ry={4} fill="#000" opacity="0.13" />
          {seg.map((b, i) => (
            <line key={i} x1={b.x} y1={b.y} x2={b.x2} y2={b.y2}
              stroke={colour} strokeWidth={b.w} strokeLinecap="round" />
          ))}
          {tips.map((b, i) => (
            <g key={"t" + i}>
              <circle cx={b.x2} cy={b.y2} r={b.w * 1.5} fill={tip} opacity="0.22"
                className="sp-tip" style={{ animationDelay: `${i * 150}ms` }} />
              <circle cx={b.x2} cy={b.y2} r={b.w * 0.85} fill={tip}
                className="sp-polyp" style={{ animationDelay: `${i * 190}ms` }} />
            </g>
          ))}
        </g>
      </g>
    </g>
  );
}

/* A soft coral: fleshy lobes rather than branches, swaying more freely. */
export function SoftCoral({ x, y, scale = 1, colour, delay = 0 }) {
  const lobes = [[0, -34, 12], [-13, -24, 9], [13, -26, 10], [-7, -44, 8], [8, -46, 7]];
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <g className="sp-coral" style={{ animationDelay: `${delay}ms` }}>
        <g className="sp-swaySoft" style={{ animationDelay: `${delay % 900}ms` }}>
          <ellipse cx="0" cy="2" rx={16} ry={4} fill="#000" opacity="0.13" />
          <path d="M-7,0 Q-9,-20 -4,-34 L5,-34 Q10,-18 7,0 Z" fill={colour} opacity="0.95" />
          {lobes.map(([lx, ly, r], i) => (
            <circle key={i} cx={lx} cy={ly} r={r} fill={colour}
              className="sp-polyp" style={{ animationDelay: `${i * 240}ms` }} />
          ))}
        </g>
      </g>
    </g>
  );
}

export function Clownfish() {
  return (
    <g>
      <g className="sp-wag" transform="translate(-19 0)">
        <path d="M0,0 L-15,-11 Q-9,0 -15,11 Z" fill="#E8701A" />
        <path d="M-2,0 L-12,-8 Q-8,0 -12,8 Z" fill="#F79445" opacity="0.8" />
      </g>
      <ellipse cx="0" cy="0" rx="20" ry="12" fill="#F58220" />
      <path d="M-20,0 Q-4,-15 12,-7 Q2,-11 -20,0 Z" fill="#E8701A" opacity="0.5" />
      <path d="M-10,-11.4 Q-6,0 -10,11.4 L-5,11 Q-1,0 -5,-11 Z" fill="#FFF" />
      <path d="M2,-11.6 Q6,0 2,11.6 L7,10 Q10,0 7,-10 Z" fill="#FFF" />
      <path d="M17,-8 Q21,0 17,8 Q19,0 17,-8 Z" fill="#FFF" />
      <g className="sp-fin"><path d="M-3,-11 Q2,-21 9,-11 Z" fill="#E8701A" /></g>
      <g className="sp-fin"><path d="M-2,11 Q3,19 9,11 Z" fill="#E8701A" /></g>
      <circle cx="13" cy="-3" r="3.1" fill="#0D2A2E" />
      <circle cx="14" cy="-3.9" r="1.1" fill="#fff" />
    </g>
  );
}

export function Firefish() {
  return (
    <g>
      <g className="sp-wag" transform="translate(-22 0)">
        <path d="M0,0 L-16,-8 Q-11,0 -16,8 Z" fill="#4B32A0" />
      </g>
      <path d="M-22,0 Q-4,-3 22,-1 Q6,8 -22,0 Z" fill="#6B4BC0" />
      <ellipse cx="4" cy="0" rx="19" ry="7" fill="#7B5BC9" />
      <ellipse cx="15" cy="0" rx="9" ry="7" fill="#F7F4FC" />
      <ellipse cx="20" cy="1" rx="4" ry="5" fill="#FBD24E" />
      <g className="sp-fin"><path d="M-6,-6 Q-2,-30 4,-8 Z" fill="#9A7BE8" /></g>
      <g className="sp-fin"><path d="M-2,6 Q2,16 8,7 Z" fill="#6B4BC0" /></g>
      <circle cx="19" cy="-2" r="2.4" fill="#0D2A2E" />
      <circle cx="19.8" cy="-2.7" r="0.9" fill="#fff" />
    </g>
  );
}

export function LaunchSplash({ onDone }) {
  const [washing, setWashing] = useState(false);
  const finish = () => {
    if (washing) return;
    setWashing(true);
    setTimeout(onDone, 900);
  };
  /* After `finish` is defined, and at the top level of the component. An
     earlier edit put this INSIDE the body of `finish`, so the hook ran only on
     a tap — which is a hook called conditionally, breaks the rules of hooks,
     and threw on the first tap. The splash then sat there with no way past it:
     the tap that should have dismissed it was the thing that broke it. */
  useEscape(finish);
  useEffect(() => {
    const reduced = typeof window !== "undefined" && window.matchMedia
      && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    /* 6.4 seconds is a long time to wait for an animation you have already
       seen, every single launch. Shortened, and the skip control is now a
       readable pill rather than 60%-opacity text at the very bottom edge —
       "tap to skip" that nobody can see is not a skip. */
    const t = setTimeout(finish, reduced ? 400 : 3200);
    return () => clearTimeout(t);
  }, []);

  /* The title is drawn, not typeset: each letter rises separately from behind
     the reef, with a gradient fill and a light sweeping across afterwards. */
  const line1 = "Dan's Tank";
  const line2 = "Wizard";
  /* Two nested spans per letter, deliberately: the outer one carries the
     transform, the inner one the gradient fill. Putting both on one element
     makes WebKit drop the background-clip, which rendered the whole title
     transparent — visible in the DOM, invisible on screen. */
  const letter = (ch, i, base) => (
    <span key={i} className="sp-letter" style={{ animationDelay: `${base + i * 55}ms` }}>
      <span className="sp-glyph">{ch === " " ? "\u00A0" : ch}</span>
    </span>
  );

  return (
    <div className="fixed inset-0 z-[100] overflow-hidden" onClick={finish}>
      <div className={`absolute inset-0 sp-wrap${washing ? " sp-wash" : ""}`}
        style={{ background: "linear-gradient(180deg,#1AA0AC 0%,#0C6470 38%,#063744 72%,#04222B 100%)" }}>

        <svg viewBox="0 0 300 300" className="absolute inset-0 w-full h-full"
          preserveAspectRatio="xMidYMax slice" aria-hidden="true">
          <defs>
            <linearGradient id="spSand" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#EDE2C9" /><stop offset="100%" stopColor="#BFAD87" />
            </linearGradient>
            <linearGradient id="spRay" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#CFFAF4" stopOpacity="0.85" />
              <stop offset="100%" stopColor="#CFFAF4" stopOpacity="0" />
            </linearGradient>
            <filter id="spSoft"><feGaussianBlur stdDeviation="6" /></filter>
            <radialGradient id="spVig" cx="50%" cy="42%" r="72%">
              <stop offset="60%" stopColor="#000" stopOpacity="0" />
              <stop offset="100%" stopColor="#000" stopOpacity="0.42" />
            </radialGradient>
          </defs>

          <g className="sp-caustic">
            <g className="sp-ray" filter="url(#spSoft)">
              <polygon points="42,0 84,0 126,300 62,300" fill="url(#spRay)" />
              <polygon points="150,0 182,0 228,300 176,300" fill="url(#spRay)" />
              <polygon points="238,0 264,0 300,300 258,300" fill="url(#spRay)" />
            </g>
          </g>

          {[[46,"0s",3.2],[96,"1.6s",2.1],[150,"0.7s",3.8],[198,"2.9s",2.5],[68,"4.2s",1.9],
            [124,"5.1s",2.9],[176,"3.4s",2.2],[220,"1.1s",3.1]].map(([y, d, r], i) => (
            <circle key={i} cx="-20" cy={y} r={r} fill="#DFFBF6" className="sp-drift"
              style={{ animationDelay: d }} />
          ))}

          {/* Far reef, dimmed for depth. */}
          <g opacity="0.34">
            <CoralClump x={16}  y={258} scale={0.55} colour="#8FD9D2" tip="#CFF6F1" delay={520} soft lean={0.2} />
            <CoralClump x={122} y={256} scale={0.5}  colour="#7FCBD8" tip="#CFF6F1" delay={660} soft lean={-0.2} />
            <CoralClump x={288} y={258} scale={0.52} colour="#8FD9D2" tip="#CFF6F1" delay={600} soft lean={0.15} />
          </g>

          <g className="sp-sand">
            <path d="M0,254 Q56,238 118,250 T236,244 T300,254 L300,300 L0,300 Z" fill="url(#spSand)" />
            <path d="M0,262 Q70,252 150,260 T300,256 L300,300 L0,300 Z" fill="#B3A07A" opacity="0.45" />
          </g>

          {/* Near reef. */}
          <SoftCoral  x={44}  y={256} scale={0.95} colour="#F2A0C0" delay={240} />
          <CoralClump x={84}  y={258} scale={1.15} colour="#F6FCFB" tip="#7FE3D4" delay={120} lean={0.12} />
          <CoralClump x={252} y={256} scale={1.0}  colour="#EFE4FB" tip="#B98BF0" delay={380} lean={-0.15} />
          <SoftCoral  x={286} y={258} scale={0.8}  colour="#F5C98A" delay={480} />
          <CoralClump x={176} y={260} scale={0.72} colour="#CFF0EC" tip="#7FE3D4" delay={560} soft lean={0.1} />

          <g className="sp-fishR" style={{ animationDelay: "400ms" }}>
            <g transform="translate(0 104)"><Clownfish /></g>
          </g>
          <g className="sp-fishL" style={{ animationDelay: "1400ms" }}>
            <g transform="translate(0 176)"><Firefish /></g>
          </g>

          <rect x="0" y="0" width="300" height="300" fill="url(#spVig)" />
        </svg>

        {/* Title — letters rising individually from behind the reef. */}
        <div className="absolute inset-x-0 flex flex-col items-center px-4"
          style={{ top: "17%", pointerEvents: "none" }}>
          <div className="relative">
            <div className="font-display text-center leading-[1.02]"
              style={{
                fontSize: "clamp(34px, 12vw, 58px)",
                filter: "drop-shadow(0 4px 16px rgba(0,0,0,0.5)) drop-shadow(0 0 24px rgba(127,227,212,0.5))",
              }}>
              <div>{line1.split("").map((c, i) => letter(c, i, 3050))}</div>
              <div>{line2.split("").map((c, i) => letter(c, i, 3050 + line1.length * 55))}</div>
            </div>
            {/* Light sweeping across once the letters have landed. */}
            <div className="sp-shine absolute inset-y-0" style={{
              width: "42%", left: 0,
              background: "linear-gradient(100deg,transparent,rgba(255,255,255,0.55),transparent)",
              mixBlendMode: "overlay" }} />
          </div>
        </div>

        {/* The wizard — larger, with a swaying robe and sparks from his hands. */}
        <div className="absolute" style={{ left: "50%", bottom: "9%", transform: "translateX(-50%)" }}>
          <div className="sp-bubble absolute" style={{ left: "68%", bottom: "96%", whiteSpace: "nowrap" }}>
            <div className="rounded-2xl px-3.5 py-2 bg-white" style={{ boxShadow: "0 8px 26px rgba(0,0,0,0.35)" }}>
              <span className="text-[15px] font-black" style={{ color: "#08191D" }}>Wanna frag?</span>
            </div>
            <div className="absolute" style={{ bottom: -6, left: 18, width: 0, height: 0,
              borderLeft: "7px solid transparent", borderRight: "7px solid transparent",
              borderTop: "8px solid #fff" }} />
          </div>

          <svg width="186" height="212" viewBox="0 0 186 212" className="sp-wizard" aria-hidden="true">
            <defs>
              <linearGradient id="spRobe" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#12909C" /><stop offset="100%" stopColor="#07545E" />
              </linearGradient>
              <linearGradient id="spHat" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#16A5B2" /><stop offset="100%" stopColor="#0A6B76" />
              </linearGradient>
            </defs>

            {/* arms, raised outward */}
            <g className="sp-armR">
              <path d="M66,126 L30,96" stroke="#0E8892" strokeWidth="12" strokeLinecap="round" />
              <circle cx="27" cy="93" r="9" fill="#F3DDC6" />
              <circle cx="27" cy="93" r="4" fill="#B8F5EC" className="sp-spark" />
              <circle cx="20" cy="86" r="2.6" fill="#EFFFFC" className="sp-spark" style={{ animationDelay: "400ms" }} />
            </g>
            <g className="sp-armL">
              <path d="M120,126 L156,96" stroke="#0E8892" strokeWidth="12" strokeLinecap="round" />
              <circle cx="159" cy="93" r="9" fill="#F3DDC6" />
              <circle cx="159" cy="93" r="4" fill="#B8F5EC" className="sp-spark" style={{ animationDelay: "200ms" }} />
              <circle cx="166" cy="86" r="2.6" fill="#EFFFFC" className="sp-spark" style={{ animationDelay: "700ms" }} />
            </g>

            {/* robe */}
            <g className="sp-robe">
              <path d="M70,116 Q93,108 116,116 L130,204 L56,204 Z" fill="url(#spRobe)" />
              <path d="M93,112 L93,204" stroke="#064851" strokeWidth="2" opacity="0.55" />
              <path d="M70,116 Q93,132 116,116 L112,142 Q93,152 74,142 Z" fill="#0A6B76" opacity="0.55" />
            </g>

            {/* head */}
            <circle cx="93" cy="96" r="23" fill="#F3DDC6" />
            <circle cx="85" cy="93" r="2.9" fill="#08191D" />
            <circle cx="101" cy="93" r="2.9" fill="#08191D" />
            <circle cx="86" cy="92" r="1" fill="#fff" />
            <circle cx="102" cy="92" r="1" fill="#fff" />
            <path d="M83,104 Q93,113 103,104" stroke="#08191D" strokeWidth="2.6" fill="none" strokeLinecap="round" />
            <circle cx="76" cy="103" r="4.5" fill="#E8A08C" opacity="0.4" />
            <circle cx="110" cy="103" r="4.5" fill="#E8A08C" opacity="0.4" />
            {/* beard */}
            <path d="M72,102 Q93,142 114,102 Q104,124 93,124 Q82,124 72,102 Z" fill="#F7FBFA" />
            <path d="M80,110 Q93,130 106,110 Q99,120 93,120 Q87,120 80,110 Z" fill="#E4EFEE" opacity="0.7" />

            {/* hat */}
            <g className="sp-hat">
              <path d="M93,16 Q104,48 116,74 L70,74 Q82,48 93,16 Z" fill="url(#spHat)" />
              <path d="M93,16 Q99,40 106,60 L86,60 Q90,38 93,16 Z" fill="#3FCADA" opacity="0.45" />
              <ellipse cx="93" cy="75" rx="34" ry="8" fill="#0E8892" />
              <ellipse cx="93" cy="73" rx="34" ry="7" fill="#16A5B2" />
              <circle cx="93" cy="18" r="5" fill="#B8F5EC" className="sp-tip" />
              <circle cx="82" cy="56" r="2.4" fill="#B8F5EC" opacity="0.8" />
              <circle cx="103" cy="46" r="2" fill="#B8F5EC" opacity="0.7" />
            </g>
          </svg>
        </div>
      </div>

      {washing && (
        <div className="sp-foam absolute inset-y-0" style={{ left: 0, width: "46%" }}>
          <svg viewBox="0 0 100 300" preserveAspectRatio="none" className="w-full h-full">
            <path d="M100,0 Q62,58 80,118 Q96,190 58,242 Q32,278 44,300 L0,300 L0,0 Z"
              fill="rgba(200,246,240,0.94)" />
            <path d="M100,0 Q72,64 88,124 Q104,196 68,248 Q42,282 54,300 L26,300 L26,0 Z"
              fill="rgba(255,255,255,0.8)" />
          </svg>
        </div>
      )}

      {!washing && (
        <button onClick={finish}
          aria-label="Skip the opening animation"
          className="absolute inset-x-0 mx-auto w-max px-4 py-2 rounded-full text-[12px] font-extrabold uppercase tracking-widest"
          style={{ bottom: "calc(6% + env(safe-area-inset-bottom, 0px))",
                   color: "#08191D", background: "rgba(255,255,255,0.92)" }}>
          Skip
        </button>
      )}
    </div>
  );
}
