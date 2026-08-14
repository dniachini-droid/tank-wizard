import { SAFE_DAILY_RISE } from '../analytics/safe-rate.js'
import { fmtAmount, fmtVal } from '../analytics/time-in-range.js'
import { fmtFriendly } from '../analytics/water-changes.js'
import { daysBetween, todayStr } from '../dates.js'
import { SAFE_BOUNDS, settleWindow } from '../findings.js'

/* --- Dosing state, in one place ---
 *
 * The dosing wizard knew whether a change was running, the dashboard did not,
 * and the tank summary never mentioned dosing at all. Someone could apply a
 * change, open the dashboard, and see nothing acknowledging it. This derives a
 * single description of where each element stands, and every screen reads it,
 * so they cannot tell different stories.
 *
 * The states, in the order they occur:
 *   idle       nothing to do, dose matches consumption
 *   suggested  a change is recommended but not yet made
 *   settling   a change was made and has not had time to show its effect
 *   due        enough time has passed but no reading has been taken since
 *   worked     readings since the change show it did what it should
 *   fell-short readings show the tank still moving the wrong way
 *   overshot   readings show it moved too far the other way
 *   blocked    the strength figure is wrong, so nothing can be judged
 */

/* How fast a parameter is moving, in the unit that matches how often it is
   tested. Alkalinity is tested daily or every other day, so a daily rate
   describes what was actually watched — a two-day window quoted as a weekly
   figure read as though a week had been observed. Calcium and magnesium are
   tested weekly and a weekly rate is what their keepers think in. */
export function ratePhrase(a, def) {
  if (!a || a.trendPerDay == null) return "very little";
  const daily = def.key === "alkalinity";
  const v = daily ? Math.abs(a.trendPerDay) : Math.abs(a.trendPerDay * 7);
  return `${fmtAmount(v)}${def.unit} a ${daily ? "day" : "week"}`;
}

  /* Every correction state carries the plan. Three returns did not — two
     correction-stalled and one correction-due — and the reading window reads
     the plan off the dose state, so a test logged during a stalled or overdue
     correction got "In band, and closer to the middle" as though nothing were
     happening. The wizard knew; the confirmation the keeper actually sees did
     not. */
export function doseStatus(a, def, todayIso, settings, latestByParam, doseLog, waterChanges) {
  if (!a || !def) return null;
  /* The assessment's own "current" is the last reading inside its analysis
     window, and that window can be empty — after a dose change, or when the
     readings are too sparse to fit. The app still knows the latest reading,
     and every branch below that talks about the level should use it: over a
     three-year run this branch reported "needs another reading" on 93 days
     when a perfectly good reading existed, simply because the dose maths had
     nothing to work with. */
  const known = (latestByParam && latestByParam[def.key]) || a.current || null;

  /* Everything the reading confirmation needs to talk about a dose change,
     computed once here rather than in the window. The window renders; it does
     not judge — the same rule that keeps the summary echoing this function
     instead of writing its own verdict.

     A dose change stays relevant until the keeper changes it again, or until
     the level has held inside its range long enough that the change is plainly
     settled: two settle windows, which is about six days for alkalinity on a
     Hanna checker. After that a reading is just a reading and the window falls
     silent, which is the clearest way of saying a change is no longer news. */
  const doseFacts = (() => {
    const last = a.lastDoseChangeAt;
    if (!last) return {};
    const days = daysBetween(last, todayIso || todayStr());
    if (!isFinite(days) || days < 0) return {};
    const settle = settleWindow(def.key,
      a.currentDose > 0 && a.effectPerMl > 0 ? a.currentDose * a.effectPerMl : null, settings);
    /* Old news: in range AND held there for two settle windows. Both halves
       matter. An earlier version dropped the facts as soon as the level was in
       band past the window, which killed the "it worked" message outright —
       the one case where the level being in band is the whole point. The
       change stops being news once it has been in range for a while, not the
       moment it arrives.

       "Held there" means every reading the engine is looking at is inside the
       band, not that they span a particular stretch of calendar. Measuring the
       span of those readings does not work: the analysis window is only a
       fortnight wide, so a dose change from sixty days ago could never look
       settled and the app narrated it forever. */
    const level = known ? known.value : null;
    const inBand = level != null && level >= def.min && level <= def.max;
    const used = a.used || [];
    const allInBand = used.length >= 2
      && used.every((r) => r && r.value >= def.min && r.value <= def.max);
    /* Two settle windows OR a fortnight, whichever is longer. The window alone
       is too short to be a sensible cut-off: alkalinity on a Hanna checker
       settles in two days, so "two settle windows" is four — and a change made
       last Tuesday that is working is still worth confirming on Saturday.
       Fourteen days is the point at which a change stops being news. */
    /* Old news, on two independent grounds.
     *
     * The original rule required the level to be in band AND every reading in
     * the window to be in band. On synthetic tanks with clean readings that
     * worked. On six months of Dan's actual alkalinity it almost never fired:
     * a real tank has noise, one reading strays, and the message went on
     * narrating a dose change for months. 75-89% of readings carried a
     * paragraph about it — regardless of whether he had made two changes or
     * nine.
     *
     * A message that appears four readings in five is wallpaper. So time alone
     * now retires it: a change from six weeks ago is history whatever the
     * level is doing, and if the level is genuinely wrong the level rules will
     * say so on their own. The in-band route stays as the faster exit for a
     * change that plainly worked. */
    const oldNews = Math.max(settle * 2, 14);
    if (inBand && allInBand && days > oldNews) return {};
    if (days > Math.max(settle * 3, 42)) return {};
    /* Did a water change fall between the dose change and now? If so the rise
       may not be the dose's doing, and crediting the wrong cause teaches the
       wrong lesson. Read from the water-change list directly — neither
       `a.disturbances` nor `a.previousDose` exists, and inventing them would
       mean two more fields on a result that already carries forty-six. */
    const disturbed = (waterChanges || []).some((w) => {
      const when = String(w && w.date || "").slice(0, 10);
      return when && when >= String(last).slice(0, 10);
    });

    /* Which way the dose moved, from the log rather than a stored previous
       value: the two most recent entries for this element. */
    const changes = (doseLog || [])
      .filter((x) => x && (x.element || "alkalinity") === def.key && isFinite(Number(x.ml)))
      .sort((x, y) => (String(x.date) < String(y.date) ? -1 : 1));
    const prevDose = changes.length >= 2 ? Number(changes[changes.length - 2].ml) : null;
    const direction = prevDose != null && a.currentDose < prevDose ? "down" : "up";

    return {
      doseChangedDaysAgo: days,
      doseNow: a.currentDose,
      /* How many times the dose has been changed inside two settle windows,
         and over what span — enough to notice someone adjusting faster than
         the element can answer. */
      recentChanges: changes.filter((x) =>
        daysBetween(String(x.date).slice(0, 10), todayIso || todayStr()) <= settle * 2 + 1).length,
      changeSpanDays: (() => {
        const recent = changes.filter((x) =>
          daysBetween(String(x.date).slice(0, 10), todayIso || todayStr()) <= settle * 2 + 1);
        if (recent.length < 2) return 0;
        return daysBetween(String(recent[0].date).slice(0, 10), todayIso || todayStr());
      })(),
      maintenanceNow: a.maintenanceDose != null && isFinite(a.maintenanceDose) ? a.maintenanceDose : null,
      doseDirection: direction,
      settleDays: settle,
      disturbedSinceDoseChange: disturbed,
    };
  })();
  const today = todayIso || todayStr();
  const label = def.label.toLowerCase();
  /* Sized from what this tank supplies daily and how precise the kit is,
     rather than a fixed two days for everything. */
  const settleDays = settleWindow(def.key,
    a.currentDose != null && a.effectPerMl ? a.currentDose * a.effectPerMl : null, settings);

  if (a.action === "implausible") {
    return { ...doseFacts, state: "blocked", tone: "#C4285B", short: "Check setup",
      headline: `${def.label} figures can't be trusted yet`,
      detail: `The solution strength in Setup is outside what a real product delivers, so every millilitre figure for ${label} is wrong until it is corrected.` };
  }

  /* A stored plan outlives the change it describes. One from three months ago
     was still being reported as a change awaiting confirmation, and one dated
     in the future produced "changed -30 days ago". Both are shapes a real
     user's storage can hold: a plan is written when the dose changes and
     nothing clears it if the tank is then left alone, and a device with a
     wrong clock writes future dates. A plan older than a month has been
     overtaken by whatever the tank has done since. */
  /* A temporary correction dose outranks everything below. While it runs the
     dose is deliberately not matching consumption, so every judgement about
     whether the dose is right is the wrong question — and asking it produced
     "calcium dose could change, try 18.8 mL" in the middle of a plan to reach
     475 at 25 mL. */
  /* A level outside what corals tolerate outranks every question about the
     dose. Without this the wizard fell back to "needs another reading" while
     alkalinity sat at zero for a year — it could not form a dose verdict from
     a flat line at the floor, so it said nothing at all about the floor. Over
     a three-year run a parameter was out of band and unmentioned on 192
     separate days.

     The check is on the level, which is always known, rather than on the
     assessment, which may have nothing to work with. */
  {
    const bounds = SAFE_BOUNDS[def.key];
    const nowVal = known ? known.value : null;
    /* A correction already running says both things — the level is wrong and
       something is being done about it — so it stays in charge. Overriding it
       here replaced "on its way to 9.0, two days to go" with a bare alarm and
       lost the progress entirely. */
    if (!a.correctionPlan && bounds && nowVal != null && (nowVal < bounds.min || nowVal > bounds.max)) {
      const low = nowVal < bounds.min;
      const mid = (def.min + def.max) / 2;
      const rate = SAFE_DAILY_RISE[def.key] || (def.max - def.min) / 4;
      const days = Math.max(1, Math.ceil(Math.abs(mid - nowVal) / rate));
      return {
        ...doseFacts,
        state: "emergency", tone: "#C4285B", short: low ? "Dangerously low" : "Dangerously high",
        headline: `${def.label} is ${fmtVal(def, nowVal)}${def.unit} — ${low ? "dangerously low" : "dangerously high"}`,
        detail: `Outside ${fmtVal(def, bounds.min)}–${fmtVal(def, bounds.max)}${def.unit}, where ${low ? `calcification stops and coral tissue is at risk` : `precipitation strips ${label} out of the water and burns tissue`}. This is the level rather than the dose — bringing it back takes about ${days} day${days === 1 ? "" : "s"} at the ${fmtVal(def, rate)}${def.unit} a day corals tolerate, and the daily dose still has to match what the tank uses underneath it.`,
        level: nowVal, target: mid, days };
    }
  }

  const cp = a.correctionPlan;
  if (cp) {
    if (cp.overrun && !cp.passed) {
      return { ...doseFacts, state: "correction-stalled", tone: "#A2621B", short: "Taking too long",
        headline: `${def.label} correction is taking longer than expected`,
        /* When nothing has been measured the honest complaint is different: the
           problem is not that the correction is slow, it is that an elevated
           dose has been running untested. Quoting a level the app does not
           have printed "alkalinity is at —dKH". */
        detail: cp.level == null
          ? `${cp.days} days at ${fmtAmount(a.currentDose)} mL/day with no test since it started, against an estimate of ${cp.estimatedDays || "a few"} days. An elevated dose left running unmeasured is how a correction turns into an overdose — set it back to ${fmtAmount(cp.returnDose)} mL/day and test before doing more.`
          : `${cp.days} days at ${fmtAmount(a.currentDose)} mL/day and ${label} is at ${fmtVal(def, cp.level)}${def.unit}, still short of ${fmtVal(def, cp.target)}${def.unit}. The estimate assumed the solution strength in Setup is right — check that before running it longer, and set the dose back to ${fmtAmount(cp.returnDose)} mL/day in the meantime.`,
        correctionPlan: cp, returnDose: cp.returnDose };
    }
    /* Time is up and nothing has confirmed the level. Stop pushing and test —
       the estimate was only ever an estimate. */
    if (cp.dueNow && !cp.overrun) {
      return { ...doseFacts, state: "correction-due", tone: "#A2621B", short: "Test now",
        headline: `${def.label} correction is due a test`,
        detail: `${cp.days} day${cp.days === 1 ? "" : "s"} at ${fmtAmount(a.currentDose)} mL/day, and the estimate to reach ${fmtVal(def, cp.target)}${def.unit} has run out${cp.level == null ? " with no test since it started" : ""}. Set the dose back to ${fmtAmount(cp.returnDose)} mL/day and test before doing more — running an elevated dose through an untested week is how a correction overshoots.`,
        correctionPlan: cp, returnDose: cp.returnDose };
    }
    if (cp.arrived || cp.passed) {
      return { ...doseFacts, state: "correction-done", tone: "#0B7C86", short: "Target reached",
        headline: `${def.label} has reached ${fmtVal(def, cp.level)}${def.unit}`,
        detail: cp.arrived
          ? `Two readings back near the middle of your range confirm it — one alone can be a bad endpoint. Set the dose back to ${fmtAmount(cp.returnDose)} mL/day to hold it there; ${fmtAmount(a.currentDose)} mL was only ever to get it here.`
          : `${label} has passed ${fmtVal(def, cp.target)}${def.unit}, so stop pushing now — set the dose back to ${fmtAmount(cp.returnDose)} mL/day. One reading can be a bad endpoint, so test again to confirm, but leaving ${fmtAmount(a.currentDose)} mL/day running while you wait is how a correction overshoots.`,
        correctionPlan: cp, returnDose: cp.returnDose };
    }
    if (cp.backwards || cp.stalled) {
      return { ...doseFacts, state: "correction-stalled", tone: "#A2621B", short: "Not responding",
        headline: `${def.label} is not responding to the correction`,
        /* Telling someone to stop without saying what to stop at leaves them
           holding an elevated dose and no number to go back to. */
        detail: `${fmtAmount(a.currentDose)} mL/day has been running ${cp.days} days and ${label} has ${cp.backwards ? "moved the wrong way" : "barely moved"} — now ${fmtVal(def, cp.level)}${def.unit} against a start of ${fmtVal(def, cp.startValue)}${def.unit}. Set the dose back to ${fmtAmount(cp.returnDose)} mL/day, then check the solution strength in Setup and whether ${label} is being used faster than it was.`,
        correctionPlan: cp, returnDose: cp.returnDose };
    }
    return { ...doseFacts, state: "correcting-dose", tone: "#1D6FA5", short: "Correction running",
      headline: `${def.label} is on its way to ${fmtVal(def, cp.target)}${def.unit}`,
      detail: `${fmtAmount(a.currentDose)} mL/day is deliberately ${cp.up ? "above" : "below"} what the tank uses, which is walking ${label} ${cp.up ? "up" : "down"}. Now ${fmtVal(def, cp.level)}${def.unit}, ${fmtVal(def, cp.remaining)}${def.unit} to go${cp.daysLeft ? ` — about ${cp.daysLeft} more day${cp.daysLeft === 1 ? "" : "s"}` : ""}. Nothing to change while it is heading the right way.`,
      correctionPlan: cp, returnDose: cp.returnDose };
  }

  /* Above every dose verdict. It had sat below them, so a tank that also had
     a dose suggestion never reached it — the correction was detected and then
     never mentioned anywhere. A correction the keeper started outranks any
     opinion about the daily dose, because it is the thing actively moving the
     level. */
  /* A correction the keeper has started is reported whether or not the engine
     also wants a one-off. It had been nested inside the targetCorrection
     branch, which is only reached when the dose is holding — so the moment the
     dose also needed raising, the running correction stopped being mentioned
     anywhere. Two separate facts that were sharing one condition. */
  if (a.correctionInProgress && a.correctionInProgress.remaining > 0) {
    const running = a.correctionInProgress;
    const rate = SAFE_DAILY_RISE[def.key] || 0.5;
    const daysLeft = Math.max(1, Math.ceil(running.remaining / rate));
    const turning = (running.direction === "up" && (a.trendPerDay || 0) > 0)
      || (running.direction === "down" && (a.trendPerDay || 0) < 0);
    const target = running.startedAt != null
      ? (running.direction === "up" ? running.startedAt + running.total : running.startedAt - running.total)
      : (a.current ? a.current.value + running.remaining : null);
    return { ...doseFacts, state: "correcting", tone: "#1D6FA5", short: "Correction running",
      headline: `${def.label} is on its way to ${fmtVal(def, target)}${def.unit}`,
      detail: `Now ${fmtVal(def, a.current.value)}${def.unit}, ${fmtVal(def, running.remaining)}${def.unit} short of ${fmtVal(def, target)}${def.unit} — about ${daysLeft} more day${daysLeft === 1 ? "" : "s"} at the ${fmtVal(def, rate)}${def.unit} a day corals tolerate. ${turning ? `It has moved ${fmtVal(def, running.done)}${def.unit} since you started, which is the pace to expect.` : `It has not started moving yet — if there is nothing by the next test, check the solution strength and whether something else is pulling ${label} the other way.`} Keep the daily dose as it is underneath; that is replacing what the tank uses, not doing the correcting.`,
      correction: running };
  }

  const rawPlan = a.activePlan;
  const planAge = rawPlan && rawPlan.appliedAt
    ? daysBetween(String(rawPlan.appliedAt).slice(0, 10), today) : null;
  const plan = (planAge != null && planAge >= 0 && planAge <= 30) ? rawPlan : null;
  if (plan && plan.appliedAt) {
    const appliedOn = String(plan.appliedAt).slice(0, 10);
    const daysSince = Math.max(0, daysBetween(appliedOn, today));
    const testOn = plan.nextTestAt;
    /* Readings taken since the change are what decide whether it worked. */
    const after = (a.used || []).filter((r) => r.date >= appliedOn);
    const tested = after.length >= 2 && daysSince >= settleDays;

    if (!tested && daysSince < settleDays) {
      return { ...doseFacts, state: "settling", tone: "#1D6FA5", short: "Change settling",
        headline: `${def.label} dose changed ${daysSince === 0 ? "today" : daysSince === 1 ? "yesterday" : `${daysSince} days ago`}`,
        detail: `You set ${fmtAmount(plan.appliedDose)} mL/day. It needs ${settleDays === 2 ? "about two days" : "a full week"} before a reading means anything, so hold it and test ${testOn ? fmtFriendly(testOn) : "when due"}.`,
        testOn, expected: plan.expected, stage: plan.stage, stages: plan.stages, target: plan.target };
    }
    if (!tested) {
      return { ...doseFacts, state: "due", tone: "#A2621B", short: "Test to confirm",
        headline: `${def.label} needs a test to confirm the new dose`,
        detail: `${fmtAmount(plan.appliedDose)} mL/day has been running ${daysSince} days. Until you test, there is no way to tell whether it did what it should — and the next recommendation cannot be worked out either.`,
        testOn, stage: plan.stage, stages: plan.stages, target: plan.target };
    }

    /* Tested: did it work? Stable and in band is the answer we wanted. */
    const inBand = a.fittedNow != null
      ? (a.fittedNow >= def.min && a.fittedNow <= def.max)
      : (a.current && a.current.value >= def.min && a.current.value <= def.max);
    const steady = a.band === "stable";
    const more = plan.target != null && Math.abs(plan.target - plan.appliedDose) > 0.5;

    if (steady && inBand) {
      return { ...doseFacts, state: "worked", tone: "#0B7C86", short: "Change worked",
        headline: `${def.label} settled after the change`,
        detail: `${fmtAmount(plan.appliedDose)} mL/day is holding ${label} steady inside your range. ${more ? `The plan was heading for ${fmtAmount(plan.target)} mL/day, but the readings say this dose is already right — there is no need to go further.` : "Nothing more to do."}`,
        stage: plan.stage, stages: plan.stages, target: plan.target };
    }
    if (steady && !inBand) {
      return { ...doseFacts, state: "worked", tone: "#45605F", short: "Steady, off target",
        headline: `${def.label} is steady but not where you want it`,
        detail: `The new dose stopped the drift, which is what it was for. Holding at ${fmtVal(def, a.current.value)}${def.unit} means the level itself needs a separate correction — a bigger daily dose would only carry it past the range later.`,
        stage: plan.stage, stages: plan.stages };
    }
    if (a.action === "increase" || a.action === "decrease") {
      /* Fell short means the tank is still heading the way it was and the
         engine still wants more of the same. Anything else after a change —
         wanting to cut back while it climbs — means it went too far. */
      const same = (a.trendPerDay < 0 && a.action === "increase")
        || (a.trendPerDay > 0 && a.action === "decrease");
      return same
        ? { state: "fell-short", tone: "#A2621B", short: "Needs more",
            headline: `${def.label} is still moving after the change`,
            detail: `${fmtAmount(plan.appliedDose)} mL/day narrowed the gap but has not closed it — ${label} is still ${a.trendPerDay < 0 ? "falling" : "rising"}. ${a.recommendedDose != null ? `The next step is ${fmtAmount(a.recommendedDose)} mL/day.` : ""}`,
            recommended: a.recommendedDose, stage: plan.stage, stages: plan.stages }
        : { state: "overshot", tone: "#A2621B", short: "Went too far",
            headline: `${def.label} has turned the other way`,
            detail: `${fmtAmount(plan.appliedDose)} mL/day moved ${label} past where it needed to be and it is now ${a.trendPerDay > 0 ? "rising" : "falling"}. ${a.recommendedDose != null ? `Easing back to ${fmtAmount(a.recommendedDose)} mL/day should settle it.` : ""}`,
            recommended: a.recommendedDose, stage: plan.stage, stages: plan.stages };
    }

    /* Tested, but the answer is not in yet: the readings since the change are
       neither steady enough to call it settled nor moving enough to want a
       different dose. This fell through every branch and returned nothing, so
       the card went blank on exactly the day you tested to find out — which is
       the moment you are most likely to be looking at it. */
    return { ...doseFacts, state: "settling", tone: "#1D6FA5", short: "One more reading",
      headline: `${def.label} is close, but one reading short of a verdict`,
      /* Quoted over the span actually measured. A two-day window reported as a
         weekly figure reads as though a week had been watched — the arithmetic
         was right and the impression was wrong. Alkalinity is tested every day
         or two, so a daily rate is the honest unit; calcium and magnesium are
         tested weekly and keep theirs. */
      detail: `${fmtAmount(plan.appliedDose)} mL/day has been running ${daysSince} ${daysSince === 1 ? "day" : "days"} and ${label} has moved ${ratePhrase(a, def)} — not enough either way to say whether the change did its job. One more reading settles it.`,
      testOn, stage: plan.stage, stages: plan.stages, target: plan.target };
  }

  if (a.action === "increase" || a.action === "decrease") {
    return { ...doseFacts, state: "suggested", tone: "#0B7C86",
      short: `${fmtAmount(a.currentDose)} \u2192 ${fmtAmount(a.recommendedDose)} mL`,
      headline: `${def.label} dose could change`,
      detail: `${label} is ${a.trendPerDay < 0 ? "falling" : "rising"} and the dose no longer matches what the tank uses. ${a.staged ? `Moving to ${fmtAmount(a.recommendedDose)} mL/day is the first step toward ${fmtAmount(a.maintenanceDose)}.` : `${fmtAmount(a.recommendedDose)} mL/day would match it.`}`,
      recommended: a.recommendedDose, staged: a.staged, target: a.maintenanceDose };
  }
  if (a.targetCorrection) {
    /* A correction already under way changes what this should say. Without it
       the app reported "the level is not right" every day of a correction that
       was working — each engine telling the truth, and together reading as
       though nothing were being done about it. */
    const running = a.correctionInProgress;
    if (running && running.remaining > 0) {
      const daysLeft = Math.max(1, Math.ceil(running.remaining / (SAFE_DAILY_RISE[def.key] || 0.5)));
      const turning = (running.direction === "up" && (a.trendPerDay || 0) > 0)
        || (running.direction === "down" && (a.trendPerDay || 0) < 0);
      /* Says where the level is and where it is heading, which is what a
         keeper mid-correction actually wants. The previous wording — "0.30dKH
         of 1.00dKH added so far" — read as millilitres added when it was
         measuring the level moving, and told you nothing about where it was
         going. BRS frames a staged correction as splitting the adjustment
         across days and testing in between to watch the response; that is the
         shape of the thing, so that is what this describes. */
      const target = running.direction === "up"
        ? (running.startedAt != null ? running.startedAt + running.total : (a.current.value + running.remaining))
        : (running.startedAt != null ? running.startedAt - running.total : (a.current.value - running.remaining));
      const onTrack = turning || running.done <= 0;
      return { ...doseFacts, state: "correcting", tone: "#1D6FA5", short: "Correction running",
        headline: `${def.label} is on its way to ${fmtVal(def, target)}${def.unit}`,
        detail: `Now ${fmtVal(def, a.current.value)}${def.unit}, ${fmtVal(def, running.remaining)}${def.unit} short of ${fmtVal(def, target)}${def.unit} — about ${daysLeft} more day${daysLeft === 1 ? "" : "s"} at the ${fmtVal(def, SAFE_DAILY_RISE[def.key] || 0.5)}${def.unit} a day that corals tolerate. ${turning ? `It has moved ${fmtVal(def, running.done)}${def.unit} since you started, which is the pace to expect.` : `It has not started moving yet — if there is nothing by the next test, check the solution strength and whether something else is pulling ${label} the other way.`} Keep the daily dose as it is underneath; that is replacing what the tank uses, not doing the correcting.`,
        correction: running };
    }
    /* The one-off figure has to be pourable. Magnesium at 1330 was being told
       to add 4,652 mL of a solution normally dosed 8 mL a day — the arithmetic
       is right and the advice is useless. The correction planner already knows
       when the maintenance solution is the wrong tool; this older path did
       not. */
    const oneOff = a.targetCorrection.oneOffMl;
    const normal = a.maintenanceDose != null ? a.maintenanceDose : a.currentDose;
    const nowLevel = known ? known.value : (a.current ? a.current.value : null);
    if (normal > 0 && oneOff > normal * 25) {
      return { ...doseFacts, state: "suggested", tone: "#45605F", short: "Wrong tool",
        /* The headline has to say where the level is, not only what the tool
           cannot do. Dropping the figure to avoid quoting an impossible volume
           also dropped the only mention that the level was out of band — the
           message explained the constraint and forgot the problem. */
        headline: `${def.label} is ${fmtVal(def, nowLevel)}${def.unit}, ${nowLevel < def.min ? "below" : "above"} your range`,
        /* Naming the impossible figure was meant to show why the solution is
           the wrong tool, but "about 4,815 mL" reads as an instruction before
           it reads as an argument. Past a couple of litres the comparison
           makes the point without the number. */
        detail: oneOff > 1500
          ? `Your maintenance solution is mixed to replace what the tank uses, not to move a level this far — closing this gap through it would take litres, against a normal ${fmtAmount(normal)} mL a day. A dedicated ${label} supplement or dry salt is the right tool, or a series of water changes.`
          : `Reaching your range would take about ${fmtAmount(oneOff)} mL of your maintenance solution against a normal ${fmtAmount(normal)} mL a day — it is mixed to replace what the tank uses, not to move a level this far. A dedicated ${label} supplement or dry salt is the right tool, or a series of water changes.` };
    }
    return { ...doseFacts, state: "suggested", tone: "#45605F", short: "Correction needed",
      headline: `${def.label} dose is right, the level is not`,
      detail: `The daily dose is matching what the tank uses, so ${label} is holding — but it is holding outside your range. That needs a one-off correction of about ${fmtAmount(oneOff)} mL spread over ${a.targetCorrection.days} days, not a bigger daily dose.` };
  }
  /* The engine cannot form a verdict yet — most often because the dose changed
     within the last couple of days and it is still settling. Returning null
     here blanked the whole card, and it did so for exactly the people who
     changed their dose in Setup rather than through the wizard, since they
     have no stored plan to route them through the branch above. Two days of a
     blank screen after doing what the app asked. */
  if (!a.ok) {
    /* hoursOnDose is how long the current dose has been running — the field
       the engine already keeps. There is no lastChange on the assessment. */
    const since = a.hoursOnDose != null && isFinite(a.hoursOnDose)
      ? Math.max(0, Math.floor(a.hoursOnDose / 24)) : null;
    const shownNow = known ? known.value : null;
    const outOfBandNow = shownNow != null && (shownNow < def.min || shownNow > def.max);
    return { ...doseFacts, state: "settling", tone: "#1D6FA5", short: "Change settling",
      /* Say where the level is even when the dose cannot be judged. Over three
         simulated years this branch reported "needs another reading" while
         alkalinity sat below its band, on 93 separate days — the engine had
         nothing to say about the dose and so said nothing about anything. */
      headline: outOfBandNow
        ? `${def.label} is ${fmtVal(def, shownNow)}${def.unit}, ${shownNow < def.min ? "below" : "above"} your range`
        : since == null
          ? `${def.label} needs another reading`
          : `${def.label} dose changed ${since === 0 ? "today" : since === 1 ? "yesterday" : `${since} days ago`}`,
      detail: since == null
        ? `There is not enough recent history to judge the ${label} dose yet. One more test and this becomes readable.`
        : `You set ${fmtAmount(a.currentDose)} mL/day ${since === 0 ? "today" : since === 1 ? "yesterday" : `${since} days ago`}. It needs ${settleDays === 2 ? "about two days" : "a full week"} before a reading means anything, so hold it and test again.`,
      testOn: null };
  }

  /* Steady is not the same as right. A tank sitting above its range with a
     matched dose has nothing to correct by dosing — you cannot add something
     to bring it down — but reporting that as "nothing to do" contradicted the
     explanation directly underneath it, which said the level was wrong. */
  /* The fitted level decides whether the tank counts as out of range, because
     it resists one noisy reading. What gets shown is always the measured
     value: quoting a fitted 1540 to someone whose kit read 1520 is telling
     them a number that does not exist. */
  const level = a.fittedNow != null ? a.fittedNow : (a.current ? a.current.value : null);
  const shown = a.current ? a.current.value : level;
  if (level != null && (level < def.min || level > def.max)) {
    const above = level > def.max;

    /* "Steady but below your range" is only true if it is steady. Correcting
       calcium from 380 toward 450 climbs 8 ppm every couple of days and this
       branch called it steady the whole way up — the reading moving visibly
       while the wording said it was parked. The assessment already knows: band
       reads "significant" once the movement clears the noise threshold. */
    const moving = a.band && a.band !== "stable"
      && a.trendPerDay != null && Math.abs(a.trendPerDay) > 0;
    if (moving) {
      const up = a.trendPerDay > 0;
      const toward = (!above && up) || (above && !up);
      const edge = above ? def.max : def.min;
      const daysOut = Math.max(1, Math.ceil(Math.abs(edge - shown) / Math.abs(a.trendPerDay)));
      return { ...doseFacts, state: toward ? "recovering" : "worsening",
        tone: toward ? "#1D6FA5" : "#A2621B",
        short: toward ? "Coming back" : "Moving away",
        headline: `${def.label} is ${above ? "above" : "below"} your range and ${up ? "rising" : "falling"}`,
        detail: toward
          ? `Moving ${fmtVal(def, Math.abs(a.trendPerDay))}${def.unit} a day toward your range — at that pace it reaches ${fmtVal(def, edge)}${def.unit} in about ${daysOut} day${daysOut === 1 ? "" : "s"}. Nothing to change while it is heading the right way; keep testing and let it arrive.`
          : `Moving ${fmtVal(def, Math.abs(a.trendPerDay))}${def.unit} a day further from your range. The daily dose is not what is doing this — check the solution strength in Setup, and whether ${label} is being used faster than it was.` };
    }

    return { ...doseFacts, state: "off-target", tone: "#45605F",
      short: above ? "Steady, above range" : "Steady, below range",
      headline: `${def.label} is steady but ${above ? "above" : "below"} your range`,
      detail: above
        ? `The dose is matching what the tank uses, so ${label} is holding at ${fmtVal(def, shown)}${def.unit} rather than climbing. Nothing you can dose brings it down — easing the dose back slightly and letting consumption carry it toward the range is the way, and there is no hurry about it.`
        : `The dose is matching what the tank uses, so ${label} is holding at ${fmtVal(def, shown)}${def.unit} rather than falling further. Raising it is a separate correction rather than a bigger daily dose.` };
  }

  /* reef-chemistry.md §24. A hold reached because consumption came out
     negative is not the same hold as every other one here, and both idle cards
     below say the dose is matching consumption — which is the one thing this
     case knows to be untrue. The wizard has just declined to size a change and
     asked for a retest in two days; a card reading "nothing to do, keep
     testing on your usual schedule" underneath it contradicts it outright.

     It echoes the wizard rather than writing its own verdict (wizard-states.md
     §0.3), and it names no cause, for the same reason the wizard names none.
     The state stays "idle": no dose change is being asked for, which is what
     every consumer of this field reads it to mean. */
  if (a.gainingHold) {
    return { ...doseFacts, state: "idle", tone: "#A2621B", short: "Rising unexplained",
      headline: `${def.label} is rising faster than your dose accounts for`,
      detail: `The dose is unchanged — a rise the dose cannot explain is not a reason to cut it. Check whether a water change or a one-off correction is missing from the log, then test ${label} again in two days.` };
  }

  /* Idle means the dose is right, which is not the same as the level being
     right. A tank sitting outside its band with a perfectly matched dose was
     told "nothing to do" — true of the dose, misleading about the tank. */
  const idleLevel = known ? known.value : null;
  const idleOut = idleLevel != null && (idleLevel < def.min || idleLevel > def.max);
  if (idleOut) {
    return { ...doseFacts, state: "idle", tone: "#45605F", short: "Dose right, level off",
      headline: `${def.label} dose is matching consumption at ${fmtVal(def, idleLevel)}${def.unit}`,
      detail: `The dose is holding ${label} steady, but steady ${idleLevel < def.min ? "below" : "above"} your range of ${fmtVal(def, def.min)}–${fmtVal(def, def.max)}${def.unit}. Moving it is a separate correction rather than a bigger daily dose — the dose is doing its job.` };
  }
  return { ...doseFacts, state: "idle", tone: "#45605F", short: "No change needed",
    headline: `${def.label} dose is matching consumption`,
    detail: `Nothing to do — keep testing on your usual schedule.` };
}
