import { Activity, Beaker, FlaskConical, LayoutDashboard, ListChecks, Settings2 } from '../icons.jsx'

/* ---------------------------------- constants ---------------------------------- */

/* Target ranges, checked against the hobby consensus rather than assumed.
   Calcium ran 450-500 and magnesium 1450-1500, and both sat entirely ABOVE
   every published range: natural seawater is about 420 ppm calcium and 1290
   ppm magnesium, and the sources converge on 400-450 and 1250-1400. The effect
   was worse than cosmetic — a tank at a textbook 435 ppm calcium and 1285 ppm
   magnesium read as out of band on both, and the app offered to push magnesium
   to 1475, a level the same sources describe as stressing invertebrates and
   suppressing calcium and alkalinity uptake. The app was steering people away
   from correct values.

   Anyone running deliberately higher can still set their own range; these are
   the defaults, and defaults should be the consensus. */
/* Text colours meet 4.5:1 against the page. The warn amber was 2.69:1 and is
   used as a tone, which becomes text in the summary and the Dosing Wizard —
   a warning nobody can comfortably read is worse than no warning. The muted
   ink and the parameter labels were 2.55 to 3.93. Hue is preserved; only
   lightness moved, so the palette still reads as itself.

   Chart strokes and fills keep the original values where they are purely
   graphical: 3:1 is the bar for a graphical object and they all clear it. */
export const PARAM_DEFS = [
  { key: "alkalinity", label: "Alkalinity", unit: "dKH", min: 8.2, max: 8.8, step: 0.1, freqDays: 2, color: "#0B7C86" },
  { key: "salinity", label: "Salinity", unit: "ppt", min: 34, max: 36, step: 0.1, freqDays: 3, color: "#1D6FA5" },
  { key: "calcium", label: "Calcium", unit: "ppm", min: 400, max: 450, step: 1, freqDays: 7, color: "#B8541A" },
  { key: "magnesium", label: "Magnesium", unit: "ppm", min: 1250, max: 1400, step: 1, freqDays: 21, color: "#7B4FCB" },
    /* Potassium is slow-moving and monthly-tested. 380-420 is all comfortable
     territory, so the band is wide and the cadence is 30 days rather than 7. */
  /* Brand colours may never be byte-identical to a severity colour
     (wizard-states.md §15, colour registry, decided 14 Aug). Potassium was
     #926A09 (== STATUS_COLOR.low) and phosphate #C4285B (== STATUS_COLOR.high),
     so a perfect phosphate reading charted in the danger red. The replacements
     are measured, not eyeballed: contrast on the #F3F7F6 page 4.54:1 and
     5.76:1 (§18 floor 4.5 text / 3 stroke), CIE76 from the severity colour
     each replaced 32.7 and 37.9. Alkalinity's #0B7C86 (== ok) stays by
     decision — TW-046, 2026-08-15. */
  { key: "potassium", label: "Potassium", unit: "ppm", min: 380, max: 420, step: 5, freqDays: 30, color: "#5F7A12" },
  { key: "phosphate", label: "Phosphate", unit: "ppm", min: 0.03, max: 0.10, step: 0.01, freqDays: 7, color: "#9B3A8C" },
  { key: "nitrate", label: "Nitrate", unit: "ppm", min: 5, max: 15, step: 0.1, freqDays: 7, color: "#2A8050" },
  { key: "ammonia", label: "Ammonia", unit: "ppm", min: 0, max: 0.25, step: 0.01, freqDays: null, color: "#D0342C", idealAt: "min" },
  { key: "ph", label: "pH", unit: "", min: 7.8, max: 8.4, step: 0.01, freqDays: null, color: "#2AA7B0" },
];


export const NAV = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "log", label: "Test Lab", icon: FlaskConical },
  { id: "dosing", label: "Dosing", icon: Beaker },
  { id: "insights", label: "Insights", icon: Activity },
  { id: "tasks", label: "Tasks", icon: ListChecks },
  { id: "setup", label: "Setup", icon: Settings2 },
];

export const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
