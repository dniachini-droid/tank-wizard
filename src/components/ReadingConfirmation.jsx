import React, { useEffect, useMemo, useState } from 'react'
import { Btn } from './DoseExpectation.jsx'
import { ReadingSparkline, buildReadingSeries, readingGeometry } from './ReadingContext.jsx'
import { Check } from '../icons.jsx'
import { fmtAmount, fmtVal } from '../lib/analytics/time-in-range.js'
import { fmtFriendly } from '../lib/analytics/water-changes.js'
import { useEscape } from '../lib/backup.jsx'
import { SAFE_BOUNDS } from '../lib/findings.js'
import { isCorrectionState } from '../lib/narrative-engine.js'
import { intervalLabel } from '../lib/reminders.js'
import { STABILITY_RULES } from '../lib/stability-engine.js'

/* --- Reading confirmation ---
 *
 * Logging a test is the thing you do most often, so it's worth making it feel
 * like something happened. The tone stays honest: a reading outside its band
 * gets a calm, useful line rather than an alarm, and one inside gets
 * acknowledgement rather than confetti.
 */
export function readingVerdict(def, result) {
  const { value, status, delta, prev } = result;

  /* A correction under way changes what this reading means. Logged mid-plan,
     412 ppm is not "well below your target" with nothing being done — it is a
     tank on its way somewhere, and the number climbing is the plan working.
     The out-of-range fact stays because it is true; it is subordinated to the
     plan rather than hidden. */
  const ds = result.doseState;
  const cp = ds && ds.correctionPlan;
  if (cp) {
    const unit = def.unit;
    const inBand = value >= def.min && value <= def.max;

    /* A dangerous reading outranks the correction narrative.
     *
     * Calcium at 325 — below the 350 safe floor — read "below range,
     * correction in progress, 15ppm to go toward 425ppm". Two things wrong at
     * once: the danger went unmentioned, and the progress figure was computed
     * from the last LOGGED reading rather than the one being previewed, so it
     * promised 15 ppm to go when from 325 it is a hundred.
     *
     * A correction running does not make a dangerous level less dangerous, and
     * quoting stale progress against a reading that has just fallen through
     * the floor is worse than saying nothing. */
    const safeB = SAFE_BOUNDS[def.key];
    if (safeB && (value < safeB.min || value > safeB.max)) {
      const low = value < safeB.min;
      const target = cp.target;
      const stillToGo = target != null ? Math.abs(target - value) : null;
      return { emoji: "\u{1F6A8}", tone: "#C4285B",
        headline: `${fmtVal(def, value)}${unit} — dangerously ${low ? "low" : "high"}`,
        line: `Outside ${fmtVal(def, safeB.min)}\u2013${fmtVal(def, safeB.max)}${unit}. A correction is running${target != null ? ` toward ${fmtVal(def, target)}${unit}` : ""}${stillToGo != null ? `, and from here that is ${fmtVal(def, stillToGo)}${unit} away — further than the plan assumed` : ""}. Re-test before doing anything else: if this reading is right the plan needs rebuilding from where the tank actually is, and if it is wrong you want to know before acting on it.`,
        goto: "dosing" };
    }

    /* Arrival is the payoff of a process that can run for weeks, and it is
       the one moment worth celebrating. Not any in-band reading — if it fires
       on every ordinary test it stops meaning anything. */
    if (ds.state === "correction-done") {
      return { emoji: "\u{1F386}", tone: "#0B7C86", celebrate: true,
        headline: `Nice work — ${def.label.toLowerCase()} is back in range`,
        line: cp.arrived
          ? `Two readings inside your band confirm it. Set the dose back to ${fmtAmount(cp.returnDose)} mL/day in the Dosing Wizard.`
          : `${fmtVal(def, value)}${unit} has passed your target — stop pushing now and set the dose back to ${fmtAmount(cp.returnDose)} mL/day.`,
        goto: "dosing" };
    }
    if (ds.state === "correction-stalled" || ds.state === "correction-due") {
      return { emoji: "\u26A0\uFE0F", tone: "#A2621B",
        headline: ds.state === "correction-due" ? "Correction is due a check" : "Not moving as expected",
        line: `${fmtVal(def, value)}${unit} after ${cp.days} days of the correction. See the Dosing Wizard for what to do next.`,
        goto: "dosing" };
    }
    /* Running normally. */
    const moving = prev != null && Math.sign(value - prev) === (cp.up ? 1 : -1);
    return { emoji: moving ? "\u{1F4C8}" : "\u{1F4CA}", tone: "#1D6FA5",
      headline: inBand ? `In range, correction still running` : `${def.label} is ${value < def.min ? "below" : "above"} range — correction in progress`,
      line: `${fmtVal(def, cp.remaining)}${unit} to go toward ${fmtVal(def, cp.target)}${unit}${cp.daysLeft ? `, about ${cp.daysLeft} more day${cp.daysLeft === 1 ? "" : "s"}` : ""}. ${moving ? `This ${cp.up ? "rise" : "fall"} is your correction working — nothing to change.` : `It has not moved the way the plan expects yet.`}`,
      goto: "dosing" };
  }

  /* A reading taken after a dose change is evidence about the change. That is
     its primary meaning, and the window used to report only where the level
     happened to sit.

     The failure that made this worth fixing: raise the dose, watch alkalinity
     climb 2 dKH, and the app would say "far enough out that a re-test is worth
     doing" — suggesting the READING was suspect when it was the entirely
     predictable result of the keeper's own change, which the wizard knew about
     and was already calling an overshoot.

     The quieter failure mattered more. Seven days at a raised dose with no
     movement means either the dose is still short or the solution strength in
     Setup is wrong. "A little low" invites waiting longer, which is the
     opposite of what should happen, and a wrong strength invalidates every
     other figure the app produces.

     Everything below reads the wizard's own state and figures. No new
     thresholds: a second place for the same judgement is how the three
     assessment engines drifted apart. */
  /* Only when the wizard has nothing louder to say.
   *
   * Two overlaps, both found by comparing the two surfaces side by side rather
   * than testing this block alone:
   *
   * A LOGGED correction sets the state to "correcting" without creating a
   * correctionPlan, so guarding on `!cp` was not enough — the wizard said
   * "alkalinity is on its way to 10.0dKH" while this said "the dose change is
   * working, hold it here", crediting the daily dose for a rise a correction
   * was driving and telling the keeper to hold while a correction ran.
   *
   * And "suggested" means the engine wants a DIFFERENT dose. Saying "hold it
   * here" against a wizard that is asking for 9.6 mL is a flat contradiction,
   * and the wizard is the one with the arithmetic. Where it wants a change,
   * this stays quiet and lets it speak. */
  /* Read from the dose state alone — the assessment is not in scope here, and
     the state already reflects a logged correction by sitting in "correcting". */
  const wizardBusy = ds && (isCorrectionState(ds.state) || !!ds.correctionPlan);
  /* This applies to ONE message, not the whole block. Suppressing everything
     when the wizard wants a change silenced the overshoot and the "it has not
     moved" cases — which are precisely the ones worth saying, because they
     EXPLAIN why the wizard wants a change rather than contradicting it.
     Only "hold it here" contradicts, so only that is withheld. */
  const wizardWantsAChange = ds && (ds.state === "suggested" || ds.state === "due");
  if (ds && !cp && !wizardBusy
      && ds.doseChangedDaysAgo != null && ds.doseChangedDaysAgo >= 0) {
    const since = ds.doseChangedDaysAgo;
    const dose = ds.doseNow;
    const unit = def.unit;
    const wait = ds.settleDays;
    const at = `${fmtAmount(dose)} mL a day`;
    const ago = since === 0 ? "today" : since === 1 ? "yesterday" : `${since} days ago`;
    const moved = prev != null ? value - prev : null;
    const raised = ds.doseDirection === "up";
    /* What the tank actually uses, in millilitres — the figure that decides
       whether a change went far enough. */
    const a0 = ds.maintenanceNow != null ? ds.maintenanceNow : null;

    /* A water change between the dose change and this reading could have done
       the work instead, so the claim softens from "your change did this" to
       "it has moved". Crediting the wrong cause teaches the wrong lesson. */
    const confounded = !!ds.disturbedSinceDoseChange;
    const credit = confounded
      ? `${def.label} has moved`
      : `${at} has moved ${def.label.toLowerCase()}`;

    /* Danger first, cause second, in one message. Someone at 11.5 dKH needs the
       danger before the explanation, and needs the explanation to know what to
       do about it. */
    const bounds = SAFE_BOUNDS[def.key];
    const unsafe = bounds && (value < bounds.min || value > bounds.max);
    if (unsafe) {
      return { emoji: "\u{1F6A8}", tone: "#C4285B",
        headline: `${fmtVal(def, value)}${unit} — dangerously ${value < bounds.min ? "low" : "high"}`,
        line: `Outside ${fmtVal(def, bounds.min)}\u2013${fmtVal(def, bounds.max)}${unit}. You changed the dose to ${at} ${ago}, and that is what has carried it here — so the fix is the dose, not the reading. Set it back and let the level come to you; the Dosing Wizard has the figure.`,
        goto: "dosing" };
    }

    /* Adjusting again before the last change could be read.
     *
     * Three changes in five days on an element that settles in two is the
     * oscillation the whole bracketing system exists to prevent, and nothing
     * anywhere mentioned it — not the headline, not the findings, not the
     * wizard. The app would say "too early to tell" for the third time in a
     * week without noticing it was the third time.
     *
     * This is the one thing worth saying before anything else, because every
     * other message assumes the dose has been left alone long enough to judge.
     * Placed above the settle-window branch for that reason. */
    if (ds.recentChanges >= 3) {
      return { emoji: "\u{1F504}", tone: "#A2621B",
        headline: `That is ${ds.recentChanges} dose changes in ${ds.changeSpanDays} days`,
        line: `${def.label} takes about ${wait} day${wait === 1 ? "" : "s"} to show what a change did, so each of these was judged before the last one could be read. The level will swing rather than settle. Pick a dose, leave it alone for ${wait * 2} days, and let this reading mean something.`,
        goto: "dosing" };
    }

    /* Too early to read anything into it — but only for the judgements that
       actually need the settle window.
       
       The window governs whether the DOSE RATE can be inferred from readings,
       which for calcium is 17 days and magnesium 30. It does not govern
       whether a level has visibly left its band: that is plain from a single
       reading and needs no statistics.
       
       Suppressing everything behind it made calcium and magnesium say "too
       early to tell" and nothing else, for a month, however far out they had
       gone. Alkalinity settles in two days so this never showed there — the
       whole feature was built and tested on the one element where the bug is
       invisible.
       
       So an overshoot past the band still speaks, and so does a move in the
       wrong direction. Only "it worked" and "it has not moved" wait, because
       those are inferences about the rate. */
    /* Overshot: past the band in the DIRECTION of the change. Merely being
       out of band does not qualify — a level still below where it started is
       exactly the case the settle window exists for, and treating it as plain
       evidence made day one fall through every branch and say "a little low"
       with no mention of the change at all. */
    const plainlyOut = (raised && value > def.max) || (!raised && value < def.min);
    const plainlyWrongWay = moved != null
      && Math.abs(moved) > ((STABILITY_RULES[def.key] || {}).noiseFloor || 0)
      && ((raised && moved < 0) || (!raised && moved > 0));
    if (since < wait && !plainlyOut && !plainlyWrongWay) {
      const left = Math.max(1, wait - since);
      return { emoji: "\u{1F553}", tone: "#1D6FA5",
        headline: "Too early to tell",
        line: `You changed the dose to ${at} ${ago}. Give it ${left} more day${left === 1 ? "" : "s"} before reading anything into this — ${def.label.toLowerCase()} moves slower than the kit can see, and adjusting again now is how the dose starts swinging.` };
    }

    const inBand = value >= def.min && value <= def.max;
    const wrongWay = moved != null && Math.abs(moved) > (STABILITY_RULES[def.key] || {}).noiseFloor
      && ((raised && moved < 0) || (!raised && moved > 0));

    /* Moved against the change — the one case where the reading really is the
       most surprising thing on the screen. */
    if (wrongWay) {
      /* A reduction that was not big enough looks identical to an external
         cause, and the app blamed the skimmer. Lowering 13 mL to 11 on a tank
         that uses 0.62 dKH a day still supplies 0.76 — the level goes on
         rising, nothing else is at work, and telling someone to hunt for a
         changed reactor sends them looking for a problem that is arithmetic.
         
         The engine already knows: if the dose still sits the wrong side of
         what the tank uses, the change simply did not go far enough. */
      /* Three cases, and the app can only distinguish two of them.
      
         If it knows what the tank uses, it can say plainly whether the change
         went far enough. If it does not — and after a change it often cannot,
         because the fit needs readings on the NEW dose — then "something else
         is at work" is a guess, and it was the guess the app made. Lowering
         13 mL to 11 on a tank using 0.62 dKH a day still supplies 0.76, so the
         level goes on rising with nothing else involved; sending someone to
         inspect their skimmer is sending them after a problem that is
         arithmetic.
         
         Where it cannot tell, it now says so and names both possibilities in
         the order worth checking. */
      const known = ds.maintenanceNow;
      const notFarEnough = ds.doseNow != null && known != null
        && ((raised && ds.doseNow < known) || (!raised && ds.doseNow > known));
      const wentOn = raised ? "falling" : "rising";
      let head, body;
      if (notFarEnough) {
        head = "The change did not go far enough";
        body = `You ${raised ? "raised" : "lowered"} the dose to ${at} ${ago} and ${def.label.toLowerCase()} has gone on ${wentOn} to ${fmtVal(def, value)}${unit}. ${at} is still ${raised ? "less" : "more"} than the tank uses, so the direction cannot change until the dose does — it is the size of the change, not the fact of it.`;
      } else if (known != null) {
        head = "It has moved the wrong way";
        body = `You ${raised ? "raised" : "lowered"} the dose to ${at} ${ago} and ${def.label.toLowerCase()} has gone ${raised ? "down" : "up"} to ${fmtVal(def, value)}${unit}, though ${at} should be ${raised ? "more" : "less"} than the tank uses. Something else is at work — check whether a skimmer, reactor or water change habit has altered, or whether growth is outpacing what you are replacing.`;
      } else {
        head = `It is still ${wentOn}`;
        body = `You ${raised ? "raised" : "lowered"} the dose to ${at} ${ago} and ${def.label.toLowerCase()} has gone on ${wentOn} to ${fmtVal(def, value)}${unit}. There is not yet enough on the new dose to tell whether the change was simply too small or whether something else is at work — the first is far likelier, so check the arithmetic before hunting for a cause.`;
      }
      return { emoji: "\u{1F914}", tone: "#A2621B", headline: head, line: body, goto: "dosing" };
    }

    /* Out of band in the direction of the change: it overshot. */
    if (!inBand && ((raised && value > def.max) || (!raised && value < def.min))) {
      return { emoji: "\u{1F4C9}", tone: "#A2621B",
        headline: `That is the dose change overshooting ${raised ? "upward" : "downward"}`,
        /* Which end it overshot. An overshoot can be downward — lowering the
           dose too far pushes the level under the band — and this said "past
           the top of your range" either way, then told the keeper the dose was
           "more than the tank needs" while they were staring at a reading
           below their floor. */
        line: `${credit} to ${fmtVal(def, value)}${unit} over ${since} day${since === 1 ? "" : "s"}, past the ${raised ? "top" : "bottom"} of your range. The reading is not suspect — ${confounded ? "though a water change in between may have helped" : `${at} is simply ${raised ? "more" : "less"} than the tank needs`}. The Dosing Wizard has a ${raised ? "smaller" : "larger"} figure to go back to.`,
        goto: "dosing" };
    }

    /* Past the settle window and still not moving. */
    /* "It has not moved" is an inference about the RATE, so it waits for the
       settle window even when the level is plainly out of band. Letting the
       out-of-band case skip the wait made this fire on day one — "1 days at
       11.0 mL a day and it has not moved", which is true and useless. Only the
       overshoot and wrong-way messages bypass the window, because those read a
       movement that has already happened rather than the absence of one. */
    const stuck = moved == null || Math.abs(moved) <= (STABILITY_RULES[def.key] || {}).noiseFloor;
    if (!inBand && stuck && since >= wait) {
      /* Not moving has two quite different causes and the app gave one answer
         to both.
         
         If the dose does NOT match consumption, the change was too small and
         the advice — go further, or check the strength — is right.
         
         If it DOES match, the level is not stuck, it is being HELD. That is
         what a matched dose does, and it is the normal state after a
         correction that overshot and was then cancelled: 15 mL pushed
         alkalinity to 10.12, the dose went back to 9, and 9 holds it there
         exactly. Telling someone their dose "needs to go further" is then both
         wrong and, for a level above the band, pointing the wrong way. A
         maintenance dose cannot move a level; only a correction can. */
      const matched = ds.maintenanceNow != null && ds.doseNow > 0
        && Math.abs(ds.maintenanceNow - ds.doseNow) / ds.doseNow <= 0.12;
      if (matched) {
        return { emoji: "\u{1F4CD}", tone: "#A2621B",
          headline: `Held at ${fmtVal(def, value)}${unit}, ${value < def.min ? "below" : "above"} your range`,
          line: `${at} is matching what the tank uses, so it is holding ${def.label.toLowerCase()} steady exactly where it is — which is ${value < def.min ? "under" : "over"} your range. A daily dose cannot move a level, only hold one. Bringing it ${value < def.min ? "up" : "down"} is a separate correction, and the Dosing Wizard has it.`,
          goto: "dosing" };
      }
      return { emoji: "\u{1F6A7}", tone: "#A2621B",
        headline: `${since} days at ${at} and it has not moved`,
        line: `Still ${fmtVal(def, value)}${unit}, ${value < def.min ? "below" : "above"} your range. Either the dose needs to go ${value < def.min ? "higher" : "lower"} or the solution strength in Setup is wrong — check the strength first, because if it is off then every figure this app gives you is off with it.`,
        goto: "dosing" };
    }

    /* It worked. Said out loud, because confirming a change worked is as
       useful as flagging one that did not, and it is the message that teaches
       what a matched dose looks like.

       Withheld when the wizard is asking for a different dose: "hold it here"
       against a wizard requesting 9.6 mL is a flat contradiction, and the
       wizard is the one with the arithmetic. */
    /* Said once, when it becomes true — not on every reading afterwards.
     *
     * On six months of real readings this fired on three quarters of them: the
     * change stays "recent" for weeks, the level stays in band, and every
     * test got the same congratulation. A message that appears four readings
     * in five is wallpaper, and wallpaper is what people stop reading before
     * the one that matters.
     *
     * News means the PREVIOUS reading was not yet in band. Once it is settled,
     * silence is the reward. */
    const wasOut = prev != null && (prev < def.min || prev > def.max);
    if (inBand && wasOut) {
      /* Two halves, and only one of them can contradict the wizard.
       *
       * "Your change brought it back" is a fact about what happened. "Hold it
       * here" is an instruction, and it is the instruction that clashes when
       * the engine is asking for a different dose.
       *
       * Suppressing the whole message made it unreachable: arriving in band
       * means the level is MOVING, moving makes the engine want a tweak, and
       * the tweak blocked the confirmation. The message that was explicitly
       * asked for could almost never appear. Splitting it fixes that without
       * putting two voices at odds. */
      return { emoji: "\u{2705}", tone: "#0B7C86",
        headline: "The dose change is working",
        line: `${credit}${moved != null && Math.abs(moved) > 0 ? ` from ${fmtVal(def, prev)}${unit} to ${fmtVal(def, value)}${unit}` : ""} over ${since} day${since === 1 ? "" : "s"}, and it is back in range. ${wizardWantsAChange ? "The Dosing Wizard has a small further adjustment to hold it there." : "Hold it here — this is what a matched dose looks like."}` };
    }
  }

  /* Some parameters have a ceiling rather than a target — ammonia should read
     zero, and anything measurable is worth acting on however far it sits
     "inside" the range. */
  if (def.idealAt === "min") {
    if (value <= (def.step || 0.01) / 2) {
      return { emoji: "\u{1F3AF}", tone: "#0B7C86", headline: "Undetectable",
        line: "Exactly where it should be — an established tank should read zero." };
    }
    if (value <= def.max) {
      return { emoji: "\u26A0\uFE0F", tone: "#A2621B", headline: "Detectable",
        line: "Any measurable ammonia means something isn't being processed. Check for a dead animal, an overfeed, or a disturbed filter — and re-test today." };
    }
    return { emoji: "\u{1F6A8}", tone: "#C4285B", headline: "Dangerously high",
      line: "This is harmful to livestock now. Test again to confirm, then act — water change, and find what died or overloaded the system." };
  }

  const mid = (def.min + def.max) / 2;
  const halfBand = (def.max - def.min) / 2 || 1;
  const fromMid = Math.abs(value - mid) / halfBand;   // 0 = dead centre, 1 = at the edge

  /* "Nothing to do" is the window's own voice, and it contradicts a wizard
     that is asking for a dose change — 4% of readings in a swept sample got
     exactly that pair. The level being dead centre is true; "nothing to do" is
     an instruction, and the instruction is not the window's to give when the
     engine disagrees.
     
     The overlap rule built for the dose-change messages only guarded the
     phrase "hold it here". This is the same fault in the older, generic
     wording, which nothing was watching. */
  const engineWantsSomething = ds
    && /could change|needs a test|is due|needs more/i.test(`${ds.headline || ""} ${ds.detail || ""}`);

  if (status === "ok") {
    if (fromMid < 0.35) {
      return { emoji: "\u{1F3AF}", tone: "#0B7C86",
        headline: "Dead centre",
        line: engineWantsSomething
          ? "Right in the middle of your band. The Dosing Wizard still has an adjustment to suggest."
          : prev != null && Math.abs(delta) < def.step * 1.5
            ? "Barely moved since last time. That's the boring kind of good."
            : "Right in the middle of your band — nothing to do." };
    }
    if (prev != null && Math.abs(value - mid) < Math.abs(prev - mid)) {
      return { emoji: "\u{1F44C}", tone: "#0B7C86",
        headline: "Heading the right way",
        line: `In band, and closer to the middle than last time.` };
    }
    return { emoji: "\u2705", tone: "#0B7C86",
      headline: "In band",
      line: fromMid > 0.8 ? "Inside your range, though near the edge — worth watching."
        : "Comfortably within your target range." };
  }

  if (status === "high") {
    const far = value > def.max + halfBand;
    return { emoji: far ? "\u{1F6A9}" : "\u{1F4C8}", tone: "#A2621B",
      headline: far ? "Well above band" : "A little high",
      line: far ? "Far enough out that a re-test is worth doing before you act on it."
        : `${fmtVal(def, +(value - def.max).toFixed(4))}${def.unit} above the top of your range.` };
  }

  if (status === "low") {
    const far = value < def.min - halfBand;
    return { emoji: far ? "\u{1F6A9}" : "\u{1F4C9}", tone: "#A2621B",
      headline: far ? "Well below band" : "A little low",
      line: far ? "Far enough out that a re-test is worth doing before you act on it."
        : `${fmtVal(def, +(def.min - value).toFixed(4))}${def.unit} below the bottom of your range.` };
  }

  return { emoji: "\u2705", tone: "#0B7C86", headline: "Saved", line: "" };
}


/* Water splash for a correction arriving. Deliberately reserved for that one
   moment: a fortnight of dosing ends here, and if it fired on every in-band
   reading it would stop meaning anything. */
export function SplashBurst() {
  const drops = React.useMemo(() => Array.from({ length: 18 }, (_, i) => {
    const angle = (i / 18) * Math.PI * 2 + (i % 3) * 0.2;
    const dist = 46 + (i % 5) * 14;
    return { id: i, x: Math.cos(angle) * dist, y: Math.sin(angle) * dist - 10,
      size: 4 + (i % 4) * 2, delay: (i % 6) * 40 };
  }), []);
  return (
    <div className="splash-wrap" aria-hidden="true">
      {drops.map((d) => (
        <span key={d.id} className="splash-drop"
          style={{ "--dx": `${d.x}px`, "--dy": `${d.y}px`,
            width: d.size, height: d.size, animationDelay: `${d.delay}ms` }} />
      ))}
    </div>
  );
}

export function LogResultPopup({ result, onClose, readings = [], onOpenDosing }) {
  useEscape(onClose);
  /* The full sequence runs to about 6.8 seconds; the countdown leaves roughly
     eight more to actually look at the result. */
  const AUTO_SECONDS = 15;
  const [left, setLeft] = useState(AUTO_SECONDS);
  const [held, setHeld] = useState(false);

  /* A card that vanishes without warning feels like a glitch, and one that
     vanishes while you're still reading is worse. The countdown says what will
     happen, and touching the card stops it — so it only closes itself when
     you've clearly moved on. */
  useEffect(() => {
    if (!result) return;
    setLeft(AUTO_SECONDS); setHeld(false);
  }, [result]);

  useEffect(() => {
    if (!result || held) return;
    if (left <= 0) { onClose(); return; }
    const t = setTimeout(() => setLeft((n) => n - 1), 1000);
    return () => clearTimeout(t);
  }, [result, left, held]);

  const series = useMemo(
    () => (result && result.def ? buildReadingSeries(result.def, readings, result) : []),
    [result, readings]);

  const geo = useMemo(
    () => (result && result.def && series.length >= 2
      ? readingGeometry(result.def, series, 260, 108, 12) : null),
    [result, series]);

  /* One clock for everything. The dot's position, the length of drawn line and
     the number on screen are all read from this single progress value, so they
     move as one rather than as three animations that happen to start together. */
  const [progress, setProgress] = useState(0);
  const [sheenDone, setSheenDone] = useState(false);
  const landed = progress >= 1;

  /* The sweep leaves the gradient clipped to the text, so the number keeps a
     faint sheen forever unless the class is removed once it has finished. */
  useEffect(() => {
    if (!landed) { setSheenDone(false); return; }
    const t = setTimeout(() => setSheenDone(true), 1250);
    return () => clearTimeout(t);
  }, [landed]);

  useEffect(() => {
    if (!result || !geo) { setProgress(1); return; }
    const reduced = typeof window !== "undefined" && window.matchMedia
      && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) { setProgress(1); return; }

    /* The chart bounces in, then the dot falls onto the first point, and only
       then does the travel begin — so nothing moves along the line until there
       is a line to move along. */
    /* Chart lands by 460ms and the scale by 640ms; a beat of stillness, then
       the dot falls from 900ms to 1340ms. The travel starts as it settles. */
    const DURATION = 4600, DELAY = 1340;
    let raf = 0, start = 0, cancelled = false;
    setProgress(0);
    const step = (ts) => {
      if (cancelled) return;
      if (!start) start = ts;
      const elapsed = ts - start - DELAY;
      if (elapsed < 0) { raf = requestAnimationFrame(step); return; }
      /* Eased so it sets off briskly and settles onto the final reading. */
      const t = Math.min(1, elapsed / DURATION);
      const eased = 1 - Math.pow(1 - t, 2.4);
      setProgress(eased);
      if (t < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => { cancelled = true; cancelAnimationFrame(raf); };
  }, [result, geo]);

  if (!result || !result.def) return null;

  const { def, value, delta, prev, nextDue, interval } = result;
  const v = readingVerdict(def, result);
  const moved = prev != null && Math.abs(delta) >= (def.step || 0.01);

  return (
    <div className="fixed inset-0 flex items-center justify-center p-5" onClick={onClose}
      style={{ background: "rgba(8,25,29,0.45)", zIndex: 70 }}>
      <div onClick={(e) => { e.stopPropagation(); setHeld(true); }}
        className="w-full max-w-xs rounded-3xl bg-white overflow-hidden"
        style={{ boxShadow: "0 24px 60px rgba(8,25,29,0.35)" }}>

        {/* A tinted cap so the result reads before any words do. */}
        <div className="px-5 pt-6 pb-5 text-center relative" style={{ background: v.tone + "12" }}>
          {v.celebrate && <SplashBurst />}
          <div style={{ fontSize: 44, lineHeight: 1 }}>{v.emoji}</div>
          <div className="mt-3 flex items-baseline justify-center gap-1">
            <span className={`rc-value text-[34px] font-black leading-none tabular-nums${landed && !sheenDone ? " landed" : ""}`}
              style={{ color: v.tone }}>
              <span className="rc-sheen">
                {fmtVal(def, geo ? geo.at(progress).value : value)}
              </span>
            </span>
            <span className="text-[14px] font-bold text-ink2">{def.unit}</span>
          </div>
          <div className="text-[13px] font-black text-ink mt-1">{def.label}</div>
          {moved && (
            <div className="text-[11px] font-bold text-ink2 mt-1">
              {delta > 0 ? "\u2191" : "\u2193"} {fmtVal(def, +Math.abs(delta).toFixed(4))}{def.unit} from {fmtVal(def, prev)}
            </div>
          )}

          {geo && (
            <div className="mt-2 -mx-1">
              <ReadingSparkline def={def} rows={series} result={result}
                progress={progress} geo={geo} />
            </div>
          )}
        </div>

        <div className="px-5 py-4 text-center rc-stagger">
          <div className="text-[15px] font-black" style={{ color: v.tone, animationDelay: "260ms" }}>
            {v.headline}
          </div>
          {v.line && (
            <p className="text-[13px] text-ink font-medium leading-relaxed mt-1"
              style={{ animationDelay: "380ms" }}>{v.line}</p>
          )}

          {/* Any actionable outcome hands off to the Dosing Wizard rather than
              being acted on here. One place changes doses, so this window can
              never drift out of step with it. */}
          {v.goto === "dosing" && onOpenDosing && (
            <div className="mt-3">
              <Btn variant={v.celebrate ? "solid" : "ghost"}
                onClick={() => { onClose(); onOpenDosing(def.key); }}>
                {v.celebrate ? "Set the dose back" : "Open the Dosing Wizard"}
              </Btn>
            </div>
          )}

          {nextDue && (
            <div className="mt-3 pt-3 border-t border-app" style={{ animationDelay: "500ms" }}>
              <div className="text-[11px] font-bold text-ink2">
                Next {def.label.toLowerCase()} test
              </div>
              <div className="text-[13px] font-black text-ink">
                {fmtFriendly(nextDue)}
                {interval ? <span className="text-ink2 font-bold"> · {intervalLabel(interval)}</span> : null}
              </div>
            </div>
          )}

          <button onClick={onClose}
            className="mt-4 w-full rounded-xl py-2.5 text-[13px] font-extrabold text-white"
            style={{ background: v.tone, animationDelay: "620ms" }}>
            Done
          </button>

          {held ? (
            <div className="mt-2 text-[10px] font-bold text-ink2" style={{ animationDelay: "740ms" }}>
              Staying open — tap Done when you're finished
            </div>
          ) : (
            <div className="mt-2" style={{ animationDelay: "740ms" }}>
              <div className="text-[10px] font-bold text-ink2">Closes in {left}s · tap to keep open</div>
              {/* A bar as well as a number, so the time left is legible at a glance. */}
              <div className="mt-1 h-1 rounded-full overflow-hidden" style={{ background: v.tone + "1F" }}>
                <div className="h-full rounded-full"
                  style={{ width: `${(left / AUTO_SECONDS) * 100}%`, background: v.tone,
                           transition: "width 1s linear" }} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* A brief, unobtrusive confirmation. Sits above the nav bar and clears itself. */
export function Toast({ message, onDone }) {
  useEffect(() => {
    if (!message) return;
    const t = setTimeout(onDone, 2600);
    return () => clearTimeout(t);
  }, [message]);
  if (!message) return null;
  return (
    <div className="fixed left-0 right-0 px-4 pointer-events-none flex justify-center"
      style={{ bottom: "calc(5rem + env(safe-area-inset-bottom, 0px))", zIndex: 80 }}>
      <div className="pointer-events-auto rounded-full px-4 py-2.5 shadow-lg flex items-center gap-2"
        style={{ background: "#08191D" }}>
        <Check size={14} color="#7FE3D4" strokeWidth={3} />
        <span className="text-[12px] font-bold text-white">{message}</span>
      </div>
    </div>
  );
}
