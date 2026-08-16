import { PARAM_DEFS } from '../constants.js'
import { SAFE_BOUNDS } from '../findings.js'
import { ALERT_WIDTH } from './reading-meaning.js'
import { dayPos } from './time-of-day.js'

/* --- The magnesium gate — reef-chemistry.md §10, restated in §20 and §12 ---
 *
 * "Below roughly 1200-1350 ppm, calcium and alkalinity cannot be held properly
 *  and precipitation becomes likely (BRS). While magnesium is below alert-low,
 *  the app does not recommend alkalinity or calcium corrections, and says why."
 *
 * §12 lists it among the things the app refuses to do: "Propose an alkalinity
 * or calcium correction while magnesium is below alert-low." §23's worked
 * example 4: "GIVEN Mg 1140 with alert-low 1150, and alk 7.4 with aim point
 * 8.5 THEN addresses magnesium only; explicitly defers the alk correction and
 * says why."
 *
 * This module is the only place that decides whether the gate is closed. Three
 * separate paths evaluate it — the two dose engines, `computeDoseAdvice`, and
 * Setup's correction calculator — because they share no code with each other;
 * what they must not do is each work out the threshold for themselves, which
 * is the defect this app keeps having.
 *
 * The engines' offers reach `proposeCorrection` through the assessment object,
 * so that path is covered by the engines' evaluation rather than a fourth one.
 *
 * What it does NOT touch: the safe-bounds emergency. `doseStatus`
 * (`dosing/state.js:189-206`) reads the level and SAFE_BOUNDS directly and
 * returns before it consults `action` or `correction`, so a level outside what
 * corals tolerate still fires while the gate is closed. The gate suppresses
 * advice about a correction, never a warning about danger.
 */

/* Where alert-low sits for magnesium.
 *
 * §18 hangs it from the midpoint of whatever target range is in force:
 * midpoint - 200 ppm. On the app's shipped magnesium range that is
 * 1325 - 200 = 1125 -- which is BELOW §2's safe bound of 1150, so the
 * "act now" line would sit outside the "this causes harm" line. §2's layering
 * is the other way round: layer 1 is where sources describe harm, and the
 * alert is the earlier, act-now signal. An act-now threshold below the harm
 * point is incoherent, so the safe bound is the floor.
 *
 * The inversion is not §18's doing. §2 layer 3 suggests 1275-1425 for
 * magnesium (midpoint 1350, alert-low exactly 1150, no inversion at all); the
 * app ships 1250-1400, which `src/test/spec/classification/band-edges.test.js`
 * pins and TW-052 tracks. When that band is corrected this floor stops
 * changing the answer and can come out.
 *
 * The floor can never close the gate on an in-band reading: §12 refuses a
 * target range whose minimum is below the safe bound, so a reading inside the
 * user's own range is always at or above 1150.
 */
export function magnesiumAlertLow(paramDefs = PARAM_DEFS, settings = null) {
  const explicit = settings && Number(settings.mgAlertLow);
  if (isFinite(explicit) && explicit > 0) return explicit;
  const def = (paramDefs || PARAM_DEFS).find((d) => d.key === "magnesium")
    || PARAM_DEFS.find((d) => d.key === "magnesium");
  if (!def) return null;
  const width = ALERT_WIDTH.magnesium;
  if (width == null) return null;
  const alertLow = (def.min + def.max) / 2 - width;
  const harmFloor = SAFE_BOUNDS.magnesium ? SAFE_BOUNDS.magnesium.min : null;
  return harmFloor != null ? Math.max(alertLow, harmFloor) : alertLow;
}

/* Magnesium's position, from the last reading (§26 — position is the last
 * reading, never a fitted or projected value).
 *
 * `settings` is also read, because two callers have magnesium's status without
 * having its readings to hand. An explicit value there wins over the log.
 */
function magnesiumLevel(readings, settings) {
  const s = settings || {};
  for (const field of ["magnesiumValue", "magnesium"]) {
    const v = Number(s[field]);
    if (isFinite(v) && v > 0) return v;
  }
  /* One pass, keeping the newest, rather than filtering a copy and sorting it.
     This runs on every assessment and every one of them is handed the whole
     reading log, so a sort here is O(n log n) of work per call that grows with
     a keeper's entire history — the cost the engines' own 400-day floor exists
     to avoid, and `tests/legacy-port/perf.js` grades the SHAPE of that growth,
     not just its ceiling. `byNewest` is the ordering being reproduced; it is
     `dayPos(b) - dayPos(a)`, so "newest" is the largest `dayPos`. */
  let best = null, bestPos = -Infinity;
  for (const r of readings || []) {
    if (!r || r.param !== "magnesium" || !isFinite(r.value)) continue;
    const pos = dayPos(r);
    if (best === null || pos > bestPos) { best = r; bestPos = pos; }
  }
  return best ? best.value : null;
}

/* Null when the gate is open — no magnesium reading, or magnesium is above
 * alert-low. An object when it is closed.
 *
 * Magnesium that has never been measured does not close the gate. §10
 * conditions the rule on magnesium being below alert-low, and an unmeasured
 * level is not below anything; refusing on a measurement nobody has taken
 * would withhold every alkalinity and calcium correction from every tank that
 * does not test magnesium.
 *
 * The comparison is at-or-below rather than strictly below, because
 * `wizard-states.md` §13 fixes the boundary: "A value exactly equal to
 * alert-low is `alert-low`", and that band's action column points here.
 */
export function magnesiumGate({ readings = [], settings = null, paramDefs = PARAM_DEFS } = {}) {
  const s = settings || {};
  const alertLow = magnesiumAlertLow(paramDefs, s);
  if (alertLow == null) return null;

  const forced = s.magnesiumBelowAlertLow;
  const level = magnesiumLevel(readings, s);
  const below = forced === true || (level != null && level <= alertLow);
  if (!below) return null;

  return {
    blocked: true,
    level: level != null ? level : null,
    alertLow,
    why: gateSentence(level, alertLow),
  };
}

/* One sentence, written once, so every surface gives the same reason.
 *
 * Terminology (`wizard-states.md` §15): "needs attention" is the registered
 * phrase for at or beyond an alert threshold, "target range" is always both
 * words, and the app does not say "safe", "danger" or "critical" out loud.
 */
export function gateSentence(level, alertLow) {
  const at = level != null ? `${Math.round(level)}ppm` : "below its alert level";
  return `Magnesium needs attention first: at ${at} it is at or below its alert level of ${Math.round(alertLow)}ppm. `
    + `Alkalinity and calcium cannot be held at that magnesium level, and pushing either one up now tends to precipitate straight back out — `
    + `it wastes the additive and leaves the tank no better. Bring magnesium up, then come back to this.`;
}

/* What the deferral covers, and the one thing it costs.
 *
 * §1 separates two instruments: a daily dose REPLACES what the tank consumes
 * and HOLDS a level; a correction MOVES one. §10 names corrections, and the
 * spec tests that pin this rule read it wider — they require the daily-dose
 * recommendation to be deferred too (`out.action`, `advice[key].status`).
 * That wider reading is implemented here, because "addresses magnesium only"
 * (§23, worked example 4) does not leave room for the app to go on tuning the
 * alkalinity doser in the same breath.
 *
 * It is not free, and the cost is measured rather than assumed. On the
 * three-year simulation a tank whose magnesium drifts under alert-low while
 * its demand compounds has its alkalinity dose frozen, and loses 5.7 dKH in
 * six weeks (`tests/legacy-port/sim/years.js`, fast growth 60%/yr, seeds 1
 * and 3). The app is not silent while that happens — magnesium reads
 * emergency throughout, and alkalinity gets its own once it leaves the safe
 * bounds — but the deferral is what freezes the dose, and a keeper who does
 * not act on the magnesium instruction pays for it.
 *
 * If that trade is judged wrong, the change is small and lives in one place:
 * drop the `out.action` branch below and the `status` branch in
 * `drift.js`, and the gate reverts to §10's literal scope — the one-off
 * correction, the correction offers, and Setup's calculator.
 */

/* Applied to a finished assessment, at the two points where an engine would
 * otherwise recommend raising a level: the daily-dose change and the one-off
 * correction. Both are suppressed; nothing else on the assessment is touched,
 * so the trend, consumption and consistency figures stay readable.
 *
 * Only upward advice is gated. Lowering a dose, or holding it, cannot
 * precipitate anything and is never what §10 is protecting against.
 */
export function gateAssessment(out, def, gate) {
  if (!out || !gate || !gate.blocked) return out;
  if (!def || (def.key !== "alkalinity" && def.key !== "calcium")) return out;

  out.magnesiumGate = gate;
  let suppressed = false;

  if (out.action === "increase") {
    /* Kept, not discarded: the figure is what the app would have recommended
       once magnesium is dealt with, and hiding it entirely would make the
       deferral impossible to explain. Nothing renders it as a recommendation.
       The staged plan goes with it — a plan is a schedule for raising the
       dose, and there is nothing to schedule while the gate is closed. */
    out.deferred = {
      action: "increase", recommendedDose: out.recommendedDose,
      plan: out.plan || null, by: "magnesium-gate",
    };
    out.recommendedDose = out.currentDose;
    out.action = "hold";
    out.staged = false;
    out.plan = null;
    suppressed = true;
  }
  if (out.correction) {
    out.deferredCorrection = out.correction;
    out.correction = null;
    suppressed = true;
  }
  if (!suppressed) return out;

  out.explanation = `${out.explanation ? out.explanation + " " : ""}${gate.why}`;
  out.nextCheck = `Test magnesium, correct it, and re-test ${def.label.toLowerCase()} once magnesium is back inside your target range.`;
  return out;
}
