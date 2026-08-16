import { findingKey, findingSignature } from '../components/DoseExpectation.jsx'
import { fmtAmount, fmtVal } from './analytics/time-in-range.js'
import { windowRows } from './analytics/time-of-day.js'
import { PARAM_DEFS } from './constants.js'
import { daysBetween, paramStatus, todayStr } from './dates.js'
import { SAFE_BOUNDS, directional } from './findings.js'
import { STABILITY_RULES, computeStability } from './stability-engine.js'

/* ---------------------------------- narrative overview engine ---------------------------------- */

/* "A and B and C" reads like a child's sentence; join lists properly. */
export function joinList(items) {
  if (!items || !items.length) return "";
  if (items.length === 1) return items[0];
  if (items.length === 2) return items[0] + " and " + items[1];
  return items.slice(0, -1).join(", ") + " and " + items[items.length - 1];
}

/* Findings carry a full explanation; the assessment only needs its opening
   claim, with the rest available on the parameter card. */
export function firstSentence(text) {
  if (!text) return "";
  /* Must not split on the decimal point in "22.4ppm", which is why a plain
     [^.!?] match was cutting sentences off after two characters. A sentence
     end is punctuation followed by a space or the end of the string. */
  const m = String(text).match(/^.*?[.!?](?=\s|$)/);
  return (m ? m[0] : String(text).slice(0, 150)).trim();
}

/* Titles are written lower-case for use mid-sentence; as a headline they need
   a capital. */
export function sentenceCase(t) {
  const x = String(t || "").trim();
  if (!x) return x;
  /* "pH" is spelt that way; capitalising the first letter produced "PH is low
     while alkalinity is fine". Any word whose second letter is already capital
     is left alone. */
  if (/^[a-z][A-Z]/.test(x)) return x;
  return x[0].toUpperCase() + x.slice(1);
}


/* ===========================================================================
   buildBriefing — the tank summary as claims rather than paragraphs
   ===========================================================================
   The prose version ran to about 280 words in four paragraphs, and a paragraph
   turned out to be a container rather than an idea: one of them carried two
   unrelated stories (two elements parked off-target, and a third one climbing)
   glued together with no signal that they were separate. It also spent forty
   words describing a shape — "nine readings, a 0.7 dKH spread, climbing" —
   that a strip of pixels shows instantly, and it buried the single most useful
   line, what to do this week, at the bottom.

   This returns an ordered list of claims. Each carries a short assertion, one
   line of support, and optionally a strip to draw. Ordering is by what to do
   first, so the feed reads top-down as a priority list.

   It shares its inputs with the dosing engines and reads their doseStates
   directly, so a dose change in progress appears here in the same words the
   Dosing screen uses. That is the point: one question, one answer, wherever
   you are standing.
   ========================================================================= */

/* ===========================================================================
   explainScore — the working behind the number
   ===========================================================================
   The score was an assertion. Every other figure in the app can be
   interrogated; 80/100 could not.

   The obvious design — "calcium is costing you 2 points" — was tested and
   thrown out. Recomputing the score with one parameter made perfect moves it
   by only one or two points, because the weakest-link term is still dragged by
   whichever parameter is next worst. Those marginal costs summed to 5 against
   a shortfall of 20, so a breakdown built from them would have left fifteen
   points unexplained and looked authoritative while doing it.

   What is shown instead is the actual arithmetic: each parameter's two
   components, the average, the weakest link, and the blend. It adds up exactly
   because it is the calculation, not a story about it.
   ========================================================================= */
export function explainScore(readings, latestByParam, defs, score) {
  /* No score, nothing to explain. The card would otherwise show a full
     derivation — average, weakest link, a total — for a number it is not
     displaying, because the tank has too little recent history to be scored
     at all. */
  if (score == null) return null;
  const parts = [];
  for (const def of defs) {
    const reading = latestByParam[def.key];
    if (!reading) continue;
    const stab = computeStability(def, readings);

    /* Must mirror the score exactly, including parameters with no usable
       stability yet — those count as 0.7 rather than being left out. Skipping
       them here made the stated average drift from the real one. */
    const stabPt = !stab ? 0.7
      : stab.grade === "green" ? 1 : stab.grade === "amber" ? 0.55
      : stab.grade === "red" ? 0.15 : 0.7;

    const st = paramStatus(def, reading.value);
    let rangePt = 1;
    if (st !== "ok") {
      const width = Math.max(1e-9, def.max - def.min);
      const gap = reading.value > def.max ? reading.value - def.max : def.min - reading.value;
      const bands = gap / width;
      rangePt = bands <= 0.25 ? 0.78 : bands <= 0.75 ? 0.45 : bands <= 1.5 ? 0.2 : 0.03;
    }
    parts.push({
      key: def.key, label: def.label, def,
      stability: Math.round(stabPt * 100),
      range: Math.round(rangePt * 100),
      sub: Math.round((stabPt * 0.4 + rangePt * 0.6) * 100),
      /* Kept unrounded: averaging rounded figures drifts from the real score. */
      raw: stabPt * 0.4 + rangePt * 0.6,
      /* Which of the two is actually holding this parameter back — the single
         number hid that alkalinity's problem is movement while calcium's is
         position. */
      weakness: rangePt < stabPt ? "range" : stabPt < rangePt ? "stability" : null,
    });
  }
  if (!parts.length) return null;

  const raws = parts.map((p) => p.raw);
  const rawMean = raws.reduce((a, b) => a + b, 0) / raws.length;
  const rawWorst = Math.min(...raws);
  const blended = Math.round((rawMean * 0.6 + rawWorst * 0.4) * 100);

  const mean = Math.round(rawMean * 100);
  const worst = Math.round(rawWorst * 100);
  /* When everything scores the same there is no weakest link to name, and
     listing all seven reads as a fault report on a perfect tank. */
  const allEqual = parts.every((p) => Math.abs(p.raw - rawWorst) < 1e-9);
  const weakest = allEqual ? [] : parts.filter((p) => p.raw === rawWorst).map((p) => p.label);

  /* Decided by looking at ammonia, not by noticing the numbers disagree. The
     previous version inferred it from a mismatch, so a one-point rounding
     difference printed a warning about ammonia on tanks that have never had an
     ammonia reading. */
  const amDef = defs.find((d) => d.key === "ammonia");
  const amLast = latestByParam && latestByParam.ammonia;
  const ammoniaCap = !!(amDef && amLast && amLast.value > (amDef.step || 0.01) / 2);

  /* The score is also held down by how little data supports it — a ceiling the
     explanation never mentioned, which is most of why the stated arithmetic
     could land several points above the score shown. */
  const totalReadings = parts.reduce((n, p) =>
    n + readings.filter((r) => r.param === p.key).length, 0);
  const evidenceCap = parts.length < 3 || totalReadings < 12 ? 70
    : totalReadings < 30 ? 85 : null;

  /* Anything outside what the hobby treats as workable caps the score, the
     same way ammonia does. The explanation has to know about it or the stated
     arithmetic lands well above the score on the card — which is exactly the
     complaint the working was built to answer. */
  const { cap: safetyCap, label: safetyName } = safetyCapFor(defs, latestByParam);

  return {
    parts: parts.sort((a, b) => a.raw - b.raw),
    mean, worst, weakest, blended,
    capped: ammoniaCap, evidenceCap, totalReadings,
    safetyCap,
    safetyLabel: safetyName,
    score,
  };
}


/* ===========================================================================
   buildHeadline — one line describing the whole tank
   ===========================================================================
   The old headline named a single metric: "Calcium dose could change". Useful,
   but it is a finding, not an assessment — it says nothing about the other six
   parameters, so a tank with one dose tweak and a tank in real trouble could
   read identically.

   Writing a hundred fixed sentences was the obvious approach and the wrong
   one: each would have to be checked by hand against the state that triggers
   it, and any drift between the two produces a confident, false headline.
   Instead this composes from two halves, each chosen by an explicit condition
   — a state clause and a qualifier. Around fifteen states against a dozen
   qualifiers gives well over a hundred distinct lines, and every one is
   accurate by construction because each half is only ever emitted when its own
   condition holds.
   ========================================================================= */
export function buildHeadline(ctx) {
  const { total, inRange, steady, urgent, offSteady, drifting,
          settling, dueTests, suggested, missed, thinData, staleCount,
          urgentTitle, watching, correcting } = ctx;

  if (!total) return "Nothing logged yet";
  if (thinData) {
    return staleCount
      ? "Too little recent history to judge the tank"
      : "Early days — not enough history to read a trend yet";
  }

  /* ---- The state clause: what the tank is, overall ---------------------- */
  const allIn = inRange === total;
  const allSteady = steady === total;
  const mostIn = inRange >= Math.ceil(total * 0.75);
  const mostSteady = steady >= Math.ceil(total * 0.75);
  const halfOut = inRange <= Math.floor(total * 0.5);
  /* Which parameters are actually outside, so the headline can name them
     rather than average them away. */
  const outList = ctx.outLabels || [];
  const anyOut = outList.length > 0;
  /* Capitalised inline — `cap` is defined inside a component and is not in
     scope in this engine function. validate.js resolves the name and does not
     care where it lives, so this only surfaced at runtime. */
  const upper = (t) => (t ? t.charAt(0).toUpperCase() + t.slice(1) : t);
  const outNames = outList.length === 1 ? upper(outList[0])
    : outList.length === 2 ? `${upper(outList[0])} and ${outList[1]}`
    : `${upper(outList[0])} and ${outList.length - 1} others`;

  let state;
  /* Urgency used to end the sentence, which made three quarters of all tanks
     read identically and said nothing about the other six parameters. Naming
     what is wrong is both more accurate and more varied. */
  if (urgent >= 2) state = `${urgent} things need attention now`;
  else if (urgent === 1) state = urgentTitle
    ? sentenceCase(urgentTitle)
    : "One thing needs attention now";
  /* "Everything is in range and holding" while a claim underneath says
     phosphate is heading out of range is a straight contradiction. A
     watch-level finding means something is worth knowing, whatever the
     snapshot says. */
  else if (allIn && allSteady && !watching) state = "Everything is in range and holding";
  else if (allIn && allSteady) state = "All in range today, with something worth watching";
  else if (allIn && mostSteady) state = "All in range, and mostly holding steady";
  else if (allIn) state = "All in range, but not all of it settled";
  else if (allSteady && halfOut) state = "Rock steady, but a lot of it is out of range";
  else if (allSteady) state = "Steady throughout, with a few sitting out of range";
  /* "Mostly in range" is true at 75% and reads as reassurance. With six
     parameters that means one can sit a full point outside its band and the
     headline still opens with "in range" — and a swept sample found no surface
     naming it in 9% of out-of-band tanks. The count was honest and the
     impression was not.
     
     A flat reading out of band was already caught, because allSteady goes
     false and the sentence falls through to "a few sitting out of range". A
     MOVING one was not: the trend grades amber or red, mostSteady stays true,
     and it lands here. Out of band and heading further out is exactly when
     silence is worst. */
  else if (mostIn && mostSteady && !anyOut) state = "Mostly stable and in range";
  else if (mostIn && mostSteady) state = `Mostly steady, but ${outNames} is outside its range`;
  else if (mostIn && drifting >= 2) state = anyOut
    ? `${outNames} is out of range, and several others are moving`
    : "Mostly in range, but several are moving";
  else if (mostIn) state = anyOut
    ? `${outNames} is out of range, with some movement elsewhere`
    : "Mostly in range, with some movement";
  else if (mostSteady && halfOut) state = "Held steady, but held in the wrong place";
  else if (mostSteady) state = "Fairly steady, with several out of range";
  else if (halfOut && drifting >= 2) state = "Unsettled — several are out of range and moving";
  else if (halfOut) state = "A good part of the tank is out of range";
  else state = "Mixed picture across the tank";

  /* ---- The qualifier: what that means for you today -------------------- */
  let qualifier = null;
  /* With something urgent named, the qualifier says how the rest of the tank
     is doing — which is the question the headline is supposed to answer. */
  if (urgent) {
    qualifier = allIn && allSteady ? "everything else is in range and holding"
      : mostIn && mostSteady ? "the rest is mostly stable"
      : halfOut ? "and a good part of the rest is out of range"
      : drifting >= 2 ? "and several others are moving"
      : offSteady >= 1 ? "the rest is steady, some out of range"
      : "the rest looks alright";
  }
  else if (missed) qualifier = missed === 1
    ? "one dose change did not land as expected"
    : `${missed} dose changes did not land as expected`;
  else if (dueTests) qualifier = dueTests === 1
    ? "one dose is waiting on a test to confirm it"
    : `${dueTests} doses are waiting on tests to confirm them`;
  else if (correcting) qualifier = correcting === 1
    ? "a correction is under way"
    : `${correcting} corrections are under way`;
  else if (settling) qualifier = settling === 1
    ? "a dose change is still settling"
    : `${settling} dose changes are still settling`;
  else if (suggested) qualifier = suggested === 1
    ? "one dose could change"
    : `${suggested} doses could change`;
  else if (staleCount) qualifier = staleCount === 1
    ? "one reading is getting old"
    : `${staleCount} readings are getting old`;
  else if (drifting === 1) qualifier = "one parameter to keep an eye on";
  else if (drifting > 1) qualifier = `${drifting} parameters to keep an eye on`;
  else if (offSteady === 1) qualifier = "one sitting out of range but going nowhere";
  else if (offSteady > 1) qualifier = `${offSteady} sitting out of range but going nowhere`;
  else if (allIn && allSteady && !watching) qualifier = "nothing needs doing";

  if (!qualifier) return state;
  /* Some state clauses already contain a dash. A second one turns the line
     into a list of fragments. */
  const joiner = state.includes("\u2014") ? "; " : " \u2014 ";
  const q = qualifier.startsWith("and ") ? qualifier.slice(4) : qualifier;
  return `${state}${joiner}${q}`;
}


/* Where a finding says something is heading is usually its second sentence —
   "at that pace it reaches the top of your range in roughly 34 days" — and
   taking only the first threw away the useful half. Two sentences, never the
   whole essay: the rest is reasoning that belongs on the parameter card. */
export function findingGist(text) {
  const t = String(text || "").trim();
  if (!t) return "";
  const parts = t.split(/(?<=[.!?])\s+/);
  const first = parts[0] || "";
  const second = parts[1] || "";
  /* Only carry the second when it says where this is going or when it lands. */
  const projects = /\b(reach|reaches|hit|hits|in roughly|in about|within|by the time|at that pace|settle|settles|end up)\b/i.test(second);
  return projects ? `${first} ${second}`.trim() : first;
}


/* Whether a stability strip can be drawn for a parameter at all. Checked
   before asking for one, because a strip that returns null leaves a gap that
   looks like a rendering fault. */
export function stripDrawable(key, defs, readings) {
  const def = (defs || []).find((d) => d.key === key);
  if (!def) return false;
  const stab = computeStability(def, readings);
  return !!(stab && stab.p05 != null && stab.p95 != null);
}

export function buildBriefing(readings, latestByParam, defs, findings, doseStates, opts) {
  const claims = [];
  const o = opts || {};
  const hidden = o.dismissed || {};
  /* Three kinds of claim, and only one of them should be dismissible.
       - Urgent: never. Hiding "ammonia is dangerously high" is the one thing
         the summary must not allow.
       - Needs an action the app can take you to: never, because acting on it
         clears it anyway, and hiding it just loses the job.
       - Everything else: yes, but as a snooze rather than a delete. The key
         carries the numbers behind the claim, so a material change brings it
         straight back rather than leaving you blind to it. */
  /* A hidden claim is still built, then flagged — not skipped. Skipping it
     meant it never reserved its parameter, so hiding "calcium is parked
     off-target" could make a different claim about calcium appear in its
     place, and the count of hidden notes was taken from a list that did not
     match what was actually on screen. Building everything and marking what to
     draw keeps the set of claims stable regardless of what is put away. */
  /* Identity and state are separate fields, and conflating them was the bug.
     A key of "drift|alkalinity|climbing|9.3" changes the moment a reading
     moves, so a claim you put away silently came back under a new key while
     the old one lingered in storage — the count went stale and it looked like
     a different claim had taken its place.

     dismissKey is now stable for the life of the claim; dismissSignature holds
     the facts that should bring it back. Storage maps one to the other, so a
     claim is hidden only while the situation it was hidden in still holds. */
  const add = (c) => {
    if (!c) return;
    if (c.dismissible && c.dismissKey) {
      const was = hidden[c.dismissKey];
      const sig = c.dismissSignature != null ? String(c.dismissSignature) : "";
      if (was != null && String(was.sig != null ? was.sig : was) === sig) c.hidden = true;
    }
    claims.push(c);
  };

  const analysed = defs.map((def) => {
    const reading = latestByParam[def.key];
    if (!reading) return null;
    const stab = computeStability(def, readings);
    return { def, reading, stab, status: paramStatus(def, reading.value) };
  }).filter(Boolean);

  const ds = (doseStates || []).filter(Boolean);

  /* ---- 1. Findings, all of them ----------------------------------------
     Only urgent findings used to reach the summary, so "phosphate is heading
     out of range" — which carries a projection of where it settles — existed
     on the parameter card and nowhere else. If a finding is worth raising at
     all it belongs where people look first. */
  const TONE_FOR = { act: "act", watch: "watch", info: "busy" };
  const RANK_FOR = { act: 0, watch: 4, info: 7 };
  for (const f of (findings || [])) {
    const single = f.params && f.params.length === 1 ? f.params[0] : null;
    add({
      id: "finding:" + f.id,
      tone: TONE_FOR[f.severity] || "watch",
      rank: RANK_FOR[f.severity] != null ? RANK_FOR[f.severity] : 5,
      claim: sentenceCase(f.title),
      support: sentenceCase(findingGist(f.detail)),
      goto: single ? { tab: "param", key: single } : null,
      /* Acute chemistry hazards only — ammonia, a parameter far outside its
         range. A calibration offset is serious but persistent, and refusing to
         let it be acknowledged just leaves a permanent line in the summary. */
      dismissible: !(f.severity === "act" && f.scope === "chemistry"),
      dismissKey: findingKey(f),
      dismissSignature: findingSignature(f),
      /* A strip only where one can actually be drawn. Ammonia has no
         stability rule — it should read zero, so the spread of its readings
         means nothing — and asking for one there rendered an empty gap. */
      strip: single && f.severity !== "info" && stripDrawable(single, defs, readings)
        ? { key: single } : null,
    });
  }

  /* ---- 2. Dose work in progress ----------------------------------------
     Stated before any observation about the parameter, because "it moved" is
     not news when you moved it. */
  /* A dose suggestion you have decided against should go away — but only
     until there is new evidence, which for a dose means the next test. Keying
     the snooze to the latest reading for that parameter makes it
     self-limiting: it cannot be hidden indefinitely without also stopping
     testing, and it returns the moment there is something new to judge it on.
     The recommended amount is in the key too, so a materially different
     suggestion comes back rather than inheriting an old decision.

     This is deliberately not a permanent "never tell me". Someone who is
     content running calcium at 430 does not want a suppressed warning, they
     want a different target range — and the app already lets them set one. */
  /* The dose snooze is the one that genuinely should lift on the next test, so
     the reading's timestamp belongs in the signature — but the key stays
     stable so the count and the storage entry survive it. */
  const snoozeKey = (d) => `dose|${d.key}`;
  const snoozeSig = (d) => {
    const last = latestByParam[d.key];
    const stamp = last ? `${last.date}T${last.time || ""}` : "none";
    return `${stamp}|${d.short || d.headline || ""}`;
  };

  for (const d of ds) {
    /* Good news, and the end of the loop. Without this a change that worked
       was announced only inside the Dosing Wizard, so the summary went from
       "test to confirm this" straight to silence — the one moment the app had
       something worth reporting. Dismissible, because once read it is done. */
    if (d.state === "worked") {
      add({ id: "dose:" + d.key, tone: "ok", rank: 6,
        claim: d.headline,
        support: sentenceCase(firstSentence(d.detail)),
        goto: { tab: "dosing", key: d.key },
        dismissible: true, dismissKey: `worked|${d.key}`,
        dismissSignature: String(d.headline || "") });
      continue;
    }

    /* When a finding already says this element is a long way out of range,
       a dose claim saying "the dose is right, the level is not" is the same
       news twice — and the finding is the better of the two, carrying the
       reading and the target range. Only claims about the level are dropped; a real
       dose change, a settling one, or one awaiting a test still has something
       of its own to say. */
    if ((findings || []).some((f) => f.id === "far-out-" + d.key)
      && (d.state === "off-target" || d.state === "suggested")
      && /level is not|steady but/i.test(d.headline || "")) continue;

    /* A temporary correction dose. Not dismissible while it runs: hiding it
       would leave the tank being deliberately pushed with nothing on screen
       saying so, and nothing to cancel it from. */
    if (d.state === "correcting-dose") {
      add({ id: "dose:" + d.key, tone: "busy", rank: 2,
        claim: d.headline,
        support: sentenceCase(firstSentence(d.detail)),
        goto: { tab: "dosing", key: d.key } });
      continue;
    }
    if (d.state === "correction-due") {
      add({ id: "dose:" + d.key, tone: "warn", rank: 2,
        claim: d.headline,
        support: sentenceCase(firstSentence(d.detail)),
        goto: { tab: "log", key: d.key } });
      continue;
    }
    if (d.state === "correction-done") {
      add({ id: "dose:" + d.key, tone: "ok", rank: 2,
        claim: d.headline,
        support: `Set the dose back to ${fmtAmount(d.returnDose)} mL/day to hold it there.`,
        goto: { tab: "dosing", key: d.key } });
      continue;
    }
    if (d.state === "correction-stalled") {
      add({ id: "dose:" + d.key, tone: "warn", rank: 2,
        claim: d.headline,
        support: sentenceCase(firstSentence(d.detail)),
        goto: { tab: "dosing", key: d.key } });
      continue;
    }
    if (d.state === "correcting") {
      /* The correction has its own claim rather than being folded into a
         level complaint. Not dismissible while it is running: hiding it would
         leave the tank being actively moved with nothing on screen saying so. */
      add({ id: "dose:" + d.key, tone: "busy", rank: 2,
        claim: d.headline,
        support: sentenceCase(firstSentence(d.detail)),
        goto: { tab: "dosing", key: d.key } });
    } else if (d.state === "settling") {
      /* The engine's own headline rather than a second phrasing. The old
         hardcoded line only matched while settling arose one way; once it
         could also come from a dose changed outside the wizard, the summary
         and the Dosing Wizard started saying different things about the same
         state. Two wordings for one fact is how they drift apart. */
      add({ id: "dose:" + d.key, tone: "busy", rank: 1,
        claim: d.headline,
        support: sentenceCase(firstSentence(d.detail)),
        goto: { tab: "dosing", key: d.key } });
    } else if (d.state === "due") {
      /* The engine's wording, like every other dose claim. This one wrote its
         own — "ready to judge" against the wizard's own headline — and two
         phrasings for one state is how the surfaces drift apart. */
      add({ id: "dose:" + d.key, tone: "busy", rank: 1,
        claim: d.headline,
        support: sentenceCase(firstSentence(d.detail)),
        goto: { tab: "log", key: d.key } });
    } else if (d.state === "fell-short" || d.state === "overshot") {
      add({ id: "dose:" + d.key, tone: "warn", rank: 1,
        claim: d.headline,
        support: sentenceCase(firstSentence(d.detail)),
        goto: { tab: "dosing", key: d.key },
        dismissible: true, snoozeUntilTest: true,
        dismissKey: snoozeKey(d), dismissSignature: snoozeSig(d) });
    } else if (d.state === "suggested") {
      add({ id: "dose:" + d.key, tone: "warn", rank: 2,
        claim: d.headline,
        support: sentenceCase(firstSentence(d.detail)),
        goto: { tab: "dosing", key: d.key },
        dismissible: true, snoozeUntilTest: true,
        dismissKey: snoozeKey(d), dismissSignature: snoozeSig(d) });
    } else if (d.state === "off-target") {
      add({ id: "dose:" + d.key, tone: "warn", rank: 3,
        claim: d.headline,
        support: sentenceCase(firstSentence(d.detail)),
        goto: { tab: "dosing", key: d.key },
        /* The only dose state with nothing to do: the dose is right and the
           level is not, and nothing you add brings it down. */
        dismissible: true, snoozeUntilTest: true,
        dismissKey: snoozeKey(d), dismissSignature: snoozeSig(d) });
    }
  }

  const spokenFor = new Set();
  for (const c of claims) {
    if (c.goto && c.goto.tab === "param") spokenFor.add(c.goto.key);
    const el = c.id.split(":")[1];
    if (el) spokenFor.add(el);
  }

  /* ---- 3. Moving through the band rather than settling in it ------------
     The claim the old prose spent most of its words on. Here it is one line
     plus a strip, and only for parameters the dosing engine has not already
     accounted for. */
  /* The plan itself, so a trend claim can say the movement is expected rather
     than either reporting it as a fault or dropping it silently. */
  const planFor = {};
  for (const d of (doseStates || [])) {
    if (d && d.correctionPlan) planFor[d.key] = d.correctionPlan;
  }
  const drifting = analysed.filter((x) =>
    x.stab && (x.stab.grade === "red" || x.stab.grade === "amber") && !spokenFor.has(x.def.key));
  /* A parameter moving under a correction plan is still worth reporting — the
     movement is real and the keeper should see it — but as expected rather
     than as a fault. Dropping it entirely would hide the very thing the plan
     is doing. */
  for (const x of drifting) {
    const plan = planFor[x.def.key];
    if (!plan) continue;
    const dir = x.stab.pattern === "trending up" ? "climbing" : "falling";
    add({
      id: "drift:" + x.def.key, tone: "busy", rank: 3,
      claim: `${x.def.label} is ${dir} — in line with your plan`,
      support: `Moving toward ${fmtVal(x.def, plan.target)}${x.def.unit}, which is what the raised dose is for. Nothing to act on here.`,
      goto: { tab: "dosing", key: x.def.key },
    });
    spokenFor.add(x.def.key);
  }
  for (const x of drifting.slice(0, 3)) {
    const dir = x.stab.pattern === "trending up" ? "climbing"
      : x.stab.pattern === "trending down" ? "falling" : "swinging";
    add({
      id: "drift:" + x.def.key, tone: x.stab.grade === "red" ? "warn" : "watch", rank: 4,
      claim: `${x.def.label} is ${dir}, not settling`,
      support: x.status === "ok"
        ? `Inside the band today, but passing through it rather than holding.`
        : `Outside the band and still moving.`,
      strip: { key: x.def.key },
      goto: { tab: "param", key: x.def.key },
      dismissible: true,
      dismissKey: `drift|${x.def.key}`,
      /* Direction and the graded band, not the raw reading: a single new test
         should not undo a decision, but a change of direction or of severity
         should. */
      dismissSignature: `${dir}|${x.status}`,
    });
  }

  /* ---- 4. Parked off-target but steady — grouped, never repeated -------- */
  /* An element with a correction already running is not "parked, nothing to
     chase" — it is being moved, deliberately, and the Dosing Wizard is saying
     so. Two surfaces on the same tank told opposite stories about the same
     element. */
  const correcting = new Set(
    (doseStates || []).filter((d) => d && isCorrectionState(d.state)).map((d) => d.key));
  /* "Parked" means off-target and going nowhere. The stability grade alone
     does not establish that: it compares day-to-day movement against a noise
     threshold, so a parameter climbing steadily but slowly still grades green.
     Potassium rising 80 ppm over three weeks was being called parked. If the
     readings travel consistently in one direction it is not parked, whatever
     the per-day rate. */
  const travelling = (key) => {
    const rows = windowRows(readings, key, 30);
    return rows.length >= 4 && directional(rows);
  };
  const parked = analysed.filter((x) =>
    x.status !== "ok" && x.stab && x.stab.grade === "green"
    && !spokenFor.has(x.def.key) && !correcting.has(x.def.key)
    && !travelling(x.def.key));

  /* Off-target and travelling — not parked, and not covered by the drift claim
     either, which only speaks for parameters still inside their band. Without
     this, potassium climbing 80 ppm out of range produced nothing at all: it
     was excluded from "parked" for moving and excluded from "drifting" for
     being out of band. */
  const movingOut = analysed.filter((x) =>
    x.status !== "ok" && !spokenFor.has(x.def.key) && !correcting.has(x.def.key)
    && travelling(x.def.key)
    /* An amber or red grade already gets a drift claim further down, which
       says the same thing. This one is for the case the grade misses: moving
       steadily but slowly enough to still read green. */
    && x.stab && x.stab.grade === "green");
  for (const x of movingOut) {
    const rows = windowRows(readings, x.def.key, 30);
    const up = rows[rows.length - 1].value > rows[0].value;
    const moved = Math.abs(rows[rows.length - 1].value - rows[0].value);
    const span = daysBetween(rows[0].date, rows[rows.length - 1].date);
    add({
      id: "moving-out:" + x.def.key, tone: "warn", rank: 4,
      claim: `${x.def.label} is outside your range and still ${up ? "rising" : "falling"}`,
      support: `${fmtVal(x.def, moved)}${x.def.unit} over ${span} days, and it has not turned. Now ${fmtVal(x.def, x.reading.value)}${x.def.unit} against a target range of ${fmtVal(x.def, x.def.min)}–${fmtVal(x.def, x.def.max)}${x.def.unit}.`,
      goto: { tab: "param", key: x.def.key },
      dismissible: true, dismissKey: `moving-out|${x.def.key}`,
      dismissSignature: `${up ? "up" : "down"}|${Math.round(x.reading.value * 100) / 100}`,
    });
    spokenFor.add(x.def.key);
  }
  if (parked.length) {
    add({
      id: "parked", tone: "watch", rank: 5,
      claim: parked.length === 1
        ? `${parked[0].def.label} is parked out of range`
        : `${joinList(parked.map((x) => x.def.label))} are parked out of range`,
      support: parked.length === 1
        ? `Steady rather than drifting, so there is nothing to chase — water changes will bring it round.`
        : `Steady rather than drifting, so there is nothing to chase — water changes will bring them round.`,
      goto: parked.length === 1 ? { tab: "param", key: parked[0].def.key } : null,
      dismissible: true,
      dismissKey: "parked",
      dismissSignature: parked.map((x) => x.def.key).sort().join(","),
      facts: parked.map((x) => `${x.def.label} ${fmtVal(x.def, x.reading.value)}${x.def.unit}`),
    });
  }

  /* ---- 5. What is genuinely fine, in one line ---------------------------
     The count is of every parameter that is in range and holding, not of the
     ones left over after the claims above. Those were two different
     populations: the numerator dropped anything already mentioned while the
     denominator counted all of them, so a tank with five parameters in range
     could read "2 of 7". Being raised above for some other reason — a kit
     offset, say — does not stop a parameter being in range and steady. */
  /* Both sides of the ratio come from the parameters that can actually be
     judged on both counts. A single reading says nothing about holding, and
     ammonia has no steadiness rule at all, so counting them in the denominator
     understated how much of the tank was genuinely fine. */
  const judged = analysed.filter((x) => x.stab && x.stab.grade !== "unknown");
  /* A parameter with a live claim against its level is not "in range and
     holding", whatever its grade says. Something heading out of range can
     still be inside the band and read green today, so without this the same
     screen said both "phosphate is heading out of range" and named phosphate
     among the ones that are fine. */
  const flaggedLevel = new Set();
  for (const c of claims) {
    const m = /^finding:(far-out-|heading-out-|salinity-off)/.exec(c.id);
    if (m && c.goto && c.goto.tab === "param") flaggedLevel.add(c.goto.key);
    if (c.id.startsWith("drift:")) flaggedLevel.add(c.id.slice(6));
    /* A dose claim wanting a change is a live objection to that element too.
       Calcium could be inside its band and graded green while the protocol
       said the dose no longer matches consumption, so the same screen listed
       calcium among the ones that are fine and asked you to change its dose. */
    if (c.id.startsWith("dose:")) flaggedLevel.add(c.id.slice(5));
  }
  const solid = judged.filter((x) =>
    x.status === "ok" && x.stab.grade === "green" && !flaggedLevel.has(x.def.key));
  if (solid.length >= 2) {
    /* Every parameter in the count is named. Listing only the unmentioned ones
       and finishing with "and others noted above" left the reader to work out
       which — the whole point of the line is to say what is fine, so it says
       all of it. A parameter raised above for some other reason is still in
       range and holding, and naming it here does not contradict that. */
    const named = solid;
    add({
      id: "solid", tone: "ok", rank: 8,
      claim: `${solid.length} of ${judged.length} are in range and holding`,
      /* "pH" is the one label that starts lower-case, so a list beginning with
         it opens the sentence in lower case. Prefixing keeps the parameter's
         own spelling intact rather than capitalising it wrongly. */
      support: (() => {
        const list = joinList(named.map((x) => x.def.label));
        /* "pH" is the one label that starts lower-case, so a list beginning
           with it would open the sentence in lower case. Prefixing keeps the
           parameter's own spelling rather than capitalising it wrongly. */
        return /^[a-z]/.test(list) ? `Holding: ${list}.` : `${list}.`;
      })(),
      dismissible: true,
      dismissKey: "solid",
      dismissSignature: `${solid.length}/${judged.length}`,
    });
  }

  claims.sort((a, b) => a.rank - b.rank);
  /* The hidden ones travel with the list so the caller can count them, but
     they are not part of the visible dozen. */
  const visible = claims.filter((c) => !c.hidden);
  const put_away = claims.filter((c) => c.hidden);
  /* Everything goes in the box — it is collapsed by default, so a long list
     costs nothing until it is asked for. */
  const out = visible.slice(0, o.limit || 12);
  out.hiddenCount = put_away.length;
  /* Carried so the box can list what is put away and let each one back
     individually. Previously only a count travelled, so the only way back was
     to restore everything at once. */
  out.hidden = put_away;
  return out;
}

/* The ceiling a parameter outside its workable range puts on the score.
   Written once because it was written twice: buildOverview applied it and
   explainScore recomputed it, and when the cap was introduced the second copy
   was forgotten — the card showed 42 while its own working added to 71, which
   is precisely the contradiction the working exists to prevent. */
export function safetyCapFor(defs, latestByParam) {
  let cap = null, which = null;
  for (const def of defs || []) {
    const bounds = SAFE_BOUNDS[def.key];
    const last = latestByParam && latestByParam[def.key];
    if (!bounds || !last || last.value == null) continue;
    const span = (def.max - def.min) || 1;
    const out = Math.max(bounds.min - last.value, last.value - bounds.max);
    if (out <= 0) continue;
    /* A little past the edge caps at 45; a long way past caps at 15, below the
       ammonia-detected cap, because it is the emergency it looks like. */
    const c = Math.round(45 - Math.min(1, out / (span * 2)) * 30);
    if (cap == null || c < cap) { cap = c; which = def; }
  }
  return { cap, label: which ? which.label : null };
}

/* Every state that means an element is being deliberately moved. Written as a
   list because naming one state let the newer ones through: the headline went
   back to calling a tank mid-plan "going nowhere" once correcting-dose existed
   alongside the original correcting. */
export const CORRECTION_STATES = new Set([
  "correcting", "correcting-dose", "correction-done",
  "correction-due", "correction-stalled",
  "emergency-correcting", "off-target-correcting",
]);
export const isCorrectionState = (state) => CORRECTION_STATES.has(state);

export function buildOverview(readings, latestByParam, defs, findings, doseStates) {
  const paras = [];
  const analysed = (defs || PARAM_DEFS)
    .map((def) => ({ def, reading: latestByParam[def.key], stab: computeStability(def, readings) }))
    .filter((x) => x.reading);

  if (!analysed.length) {
    return { headline: "No data yet", paragraphs: ["Log your first readings and this summary will start describing how the tank is tracking."], score: null };
  }

  const inRange = analysed.filter((x) => paramStatus(x.def, x.reading.value) === "ok");
  const outRange = analysed.filter((x) => paramStatus(x.def, x.reading.value) !== "ok");
  const steady = analysed.filter((x) => x.stab && x.stab.grade === "green");
  const wobbly = analysed.filter((x) => x.stab && x.stab.grade === "amber");
  const unstable = analysed.filter((x) => x.stab && x.stab.grade === "red");

  /* Composite health score.
     Two earlier faults: being out of range cost a flat penalty regardless of
     how far out, so magnesium 300 ppm low scored the same as 5 ppm low; and a
     tank with two readings scored 100 because nothing had gone wrong yet.
     Distance now scales the penalty, and thin data caps the score. */
  const scored = analysed.filter((x) => x.stab && x.stab.grade !== "unknown");
  let score = null;
  if (scored.length) {
    /* Score each parameter on its own, then combine. Averaging alone let a
       single badly-wrong parameter disappear behind good ones — magnesium
       300 ppm low still scored 89 — so the worst performer carries real
       weight in the total. */
    const perParam = analysed.map((x) => {
      const stabPt = x.stab
        ? (x.stab.grade === "green" ? 1 : x.stab.grade === "amber" ? 0.55 : x.stab.grade === "red" ? 0.15 : 0.7)
        : 0.7;
      const st = paramStatus(x.def, x.reading.value);
      let rangePt = 1;
      if (st !== "ok") {
        const width = Math.max(1e-9, x.def.max - x.def.min);
        const gap = x.reading.value > x.def.max
          ? x.reading.value - x.def.max
          : x.def.min - x.reading.value;
        const bands = gap / width;
        rangePt = bands <= 0.25 ? 0.78 : bands <= 0.75 ? 0.45 : bands <= 1.5 ? 0.2 : 0.03;
      }
      /* Range now outweighs stability. The previous 60/40 split the other way
         let a tank hold every parameter steadily in the wrong place and still
         score in the high seventies — stability is only a virtue when what is
         being held is roughly right. */
      return stabPt * 0.4 + rangePt * 0.6;
    });

    const mean = perParam.reduce((a, b) => a + b, 0) / perParam.length;
    const worst = Math.min(...perParam);
    // 60% how the tank looks overall, 40% how bad its weakest link is.
    score = Math.round((mean * 0.6 + worst * 0.4) * 100);

    /* Ammonia overrides everything. A tank can look immaculate on every other
       measure while poisoning its livestock, and a score in the seventies
       alongside a detectable reading is actively misleading. */
    const amDef = (defs || PARAM_DEFS).find((d) => d.key === "ammonia");
    const amLast = latestByParam && latestByParam.ammonia;
    if (amDef && amLast) {
      if (amLast.value > amDef.max) score = Math.min(score, 22);
      else if (amLast.value > (amDef.step || 0.01) / 2) score = Math.min(score, 42);
    }

    /* Ammonia had a cap and nothing else did, so a tank at 0.2 dKH scored 71 —
       the same as one at 6.0, and only 29 points below perfect. The blend
       cannot express it: five healthy parameters hold the mean up while the
       worst term is floored. Anything outside what the hobby treats as
       workable is a tank in trouble whatever else reads well, so it caps the
       score the way ammonia does. */
    {
      const { cap } = safetyCapFor(defs, latestByParam);
      if (cap != null) score = Math.min(score, cap);
    }

    /* A score is a claim about the tank, and a claim needs evidence. */
    const totalReadings = analysed.reduce((n, x) =>
      n + readings.filter((r) => r.param === x.def.key).length, 0);
    if (analysed.length < 3 || totalReadings < 12) score = Math.min(score, 70);
    else if (totalReadings < 30) score = Math.min(score, 85);
  }

  const thinData = analysed.reduce((n, x) => n + readings.filter((r) => r.param === x.def.key).length, 0) < 12;
  const headline = score == null ? "Building a picture"
    : thinData ? "Not enough history yet to judge"
    : score >= 85 ? "Tank is tracking really well"
    : score >= 70 ? "Solid, with a couple of things to watch"
    : score >= 50 ? "Mixed — some parameters need attention"
    : "Several parameters need attention";


  /* --- Urgent findings lead ---
     Previously the assessment never read findings, so an [act] item lived only
     as a small badge on one card. A person could open the app to a warm
     paragraph about steady alkalinity while ammonia sat at 0.4ppm. When
     something urgent exists it is said first, and the rest of the summary
     stands down to make room for it. */
  /* Ordered by how much it matters, not by the order findings happen to be
     generated. Ammonia threatens livestock today; a nutrient a long way out is
     a problem for the month. */
  const URGENCY = ["ammonia-high", "ammonia-detected", "contaminants", "strength-missing", "far-out"];
  const rank = (f) => {
    const i = URGENCY.findIndex((k) => String(f.id).startsWith(k));
    return i === -1 ? URGENCY.length : i;
  };
  const urgent = (findings || [])
    .filter((f) => f.severity === "act")
    .sort((a, b) => rank(a) - rank(b));
  const watch = (findings || []).filter((f) => f.severity === "watch");
  /* --- Dosing, if anything is happening ---
     Placed before the parameter commentary because a change in progress
     changes how the numbers below should be read: a tank mid-correction is
     supposed to be moving. */
  const ds = (doseStates || []).filter(Boolean);
  const running = ds.filter((d) => d.state === "settling" || d.state === "due");
  const needsTest = ds.filter((d) => d.state === "due");
  const suggested = ds.filter((d) => d.state === "suggested");
  const landed = ds.filter((d) => d.state === "worked");
  const missed = ds.filter((d) => d.state === "fell-short" || d.state === "overshot");

  if (needsTest.length) {
    paras.push(needsTest.length === 1
      ? `${needsTest[0].headline}. ${needsTest[0].detail}`
      : `${joinList(needsTest.map((d) => d.el))} all have dose changes waiting on a test before they can be judged. Until those readings go in, the app cannot tell you whether the changes worked or what to do next.`);
  } else if (running.length) {
    paras.push(running.length === 1
      ? `${running[0].headline}. ${running[0].detail}`
      : `${joinList(running.map((d) => d.el))} both have dose changes settling. Hold them and test when due — reading anything into the numbers before then is guesswork.`);
  }
  if (missed.length) {
    paras.push(`${missed.map((d) => d.headline).join(". ")}. ${missed[0].detail}`);
  } else if (landed.length && !running.length) {
    paras.push(landed.length === 1
      ? `${landed[0].headline}. ${landed[0].detail}`
      : `${joinList(landed.map((d) => d.el))} have settled after their dose changes.`);
  }
  if (suggested.length && !running.length) {
    paras.push(suggested.length === 1
      ? `${suggested[0].headline}. ${suggested[0].detail}`
      : `${joinList(suggested.map((d) => d.el))} each look like the dose no longer matches what the tank uses. The Dosing tab shows the working for each.`);
  }

  /* --- Paragraph 0: anything urgent, said first ---
     This is the only paragraph that can push the rest aside. A person opening
     the app to a tank in trouble should read about the trouble, not about how
     steadily magnesium has been holding. */
  if (urgent.length) {
    const titles = urgent.map((f) => f.title);
    paras.push(urgent.length === 1
      ? `Start here: ${titles[0]}. ${firstSentence(urgent[0].detail)}`
      : `Start here — ${urgent.length} things need attention: ${joinList(titles)}. Tap the parameter cards below for what to do about each.`);
  }

  // --- Paragraph 1: overall shape ---
  /* Each parameter should be explained once, in whichever paragraph explains it
     best. Without this, alkalinity was being named up to nine times in one
     summary — roll-call, detail, trend, trio, cross-set comparison, priority —
     all describing the same drift. */
  const detailed = new Set();

  /* Paragraph 2 gives a full account of in-range-but-moving parameters, so the
     roll-call above shouldn't flag them as well — that was the last remaining
     double-mention. */
  const willDetail = new Set(
    analysed.filter((x) => paramStatus(x.def, x.reading.value) === "ok"
      && x.stab && (x.stab.grade === "red" || x.stab.grade === "amber"))
      .map((x) => x.def.key));

  /* Opening paragraph is the headline only: how many are where they should be,
     and whether the tank is steady overall. Naming individual parameters here
     duplicated the detail paragraphs that follow. */
  const p1 = [];
  const steadyAndIn = steady.filter((x) => paramStatus(x.def, x.reading.value) === "ok");
  p1.push(`${inRange.length} of ${analysed.length} tracked ${analysed.length === 1 ? "parameter is" : "parameters are"} sitting inside ${analysed.length === 1 ? "its" : "their"} target range${steady.length ? `, and ${steady.length} of ${analysed.length} ${steady.length === 1 ? "is" : "are"} holding steady` : ""}.`);

  if (steady.length && steadyAndIn.length !== steady.length) {
    p1.push(`Steady isn't the same as in range though — ${steady.length - steadyAndIn.length === 1 ? "one of those is being held" : `${steady.length - steadyAndIn.length} of those are being held`} at a level outside the band you set, which is worth separating from being genuinely under control.`);
  } else if (steady.length === analysed.length) {
    p1.push(`Day-to-day movement is inside the tolerance corals prefer, which matters more for long-term health than hitting an exact number.`);
  }

  if (unstable.length) {
    p1.push(`The bigger concern is movement rather than position: ${joinList(unstable.map((x) => x.def.label))} ${unstable.length === 1 ? "is" : "are"} swinging faster than is comfortable.`);
    unstable.forEach((x) => detailed.add(x.def.key));
  } else if (wobbly.length) {
    const notElsewhere = wobbly.filter((x) => !willDetail.has(x.def.key));
    if (notElsewhere.length) {
      p1.push(`${joinList(notElsewhere.map((x) => x.def.label))} ${notElsewhere.length === 1 ? "shows" : "show"} moderate movement — not alarming, but worth tightening if you can.`);
      notElsewhere.forEach((x) => detailed.add(x.def.key));
    }
  }
  paras.push(p1.join(" "));

  // --- Paragraph 2: the nuanced cases (out of range but stable, in range but volatile) ---
  /* Only genuinely marginal parameters belong in the "steady, leave it" group.
     Magnesium 300 ppm low was being described as "parked slightly off" and told
     to be left alone, while a later paragraph said to fix it first. */
  /* A parameter climbing back into its band from below is being corrected, not
     misbehaving. Flagging it as the tank's biggest problem tells someone to
     stop the fix they're in the middle of. */
  const isRecovering = (x) => {
    if (!x.stab || !x.stab.netChange) return false;
    const now = x.reading.value;
    const started = now - x.stab.netChange;
    const up = x.stab.pattern === "trending up";
    const down = x.stab.pattern === "trending down";
    if (up) return started < x.def.min && now <= x.def.max;
    if (down) return started > x.def.max && now >= x.def.min;
    return false;
  };

  const bandsOut = (x) => {
    const width = Math.max(1e-9, x.def.max - x.def.min);
    const gap = x.reading.value > x.def.max ? x.reading.value - x.def.max : x.def.min - x.reading.value;
    return gap / width;
  };
  const outButStable = outRange.filter((x) => x.stab && x.stab.grade === "green" && bandsOut(x) <= 1);
  const outAndFar = outRange.filter((x) => bandsOut(x) > 1);
  const inButVolatile = inRange.filter((x) => x.stab && (x.stab.grade === "red" || x.stab.grade === "amber"));
  const p2 = [];

  /* Grouped rather than repeated: two parameters that are both steady-but-off
     used to produce the same forty-word passage twice in a row. */
  if (outButStable.length) {
    outButStable.forEach((x) => detailed.add(x.def.key));
    const bits = outButStable.map((x) => {
      const status = paramStatus(x.def, x.reading.value);
      const dir = status === "high" ? "above" : "below";
      const edge = status === "high" ? x.def.max : x.def.min;
      const gap = Math.abs(x.reading.value - edge);
      return `${x.def.label} at ${fmtVal(x.def, x.reading.value)}${x.def.unit} (${fmtVal(x.def, gap)}${x.def.unit} ${dir === "above" ? "over" : "under"} your range)`;
    });
    const list = bits.length === 1 ? bits[0]
      : bits.slice(0, -1).join(", ") + " and " + bits[bits.length - 1];
    p2.push(`${bits.length === 1 ? "One parameter is" : `${bits.length} parameters are`} sitting out of range but holding steady: ${list}. Parked slightly off but rock steady beats bouncing through the ideal band, so there's no need to chase ${bits.length === 1 ? "it" : "them"} — let water changes bring ${bits.length === 1 ? "it" : "them"} round gradually.`);
  }

  if (outAndFar.length) {
    const bits = outAndFar.map((x) => {
      const st = paramStatus(x.def, x.reading.value);
      const edge = st === "high" ? x.def.max : x.def.min;
      const gap = Math.abs(x.reading.value - edge);
      return `${x.def.label} at ${fmtVal(x.def, x.reading.value)}${x.def.unit}, ${fmtVal(x.def, gap)}${x.def.unit} ${st === "high" ? "above" : "below"} your range`;
    });
    outAndFar.forEach((x) => detailed.add(x.def.key));
    p2.push(`${joinList(bits)} ${bits.length === 1 ? "is" : "are"} a long way out — far enough that this isn't a case of the target range being set slightly wrong. ${bits.length === 1 ? "It needs" : "They need"} correcting rather than accepting, though still gradually.`);
  }

  for (const x of inButVolatile) {
    detailed.add(x.def.key);
    /* Plain language: today's single reading is inside the band, but the run of
       readings behind it is not settled. Avoid "spot value" and similar jargon. */
    const moving = x.stab.pattern === "oscillating" ? "moving up and down"
      : x.stab.pattern === "trending up" ? "climbing steadily"
      : x.stab.pattern === "trending down" ? "falling steadily" : "moving about";
    p2.push(`${x.def.label} happens to be inside your target range today at ${fmtVal(x.def, x.reading.value)}${x.def.unit}, but today's reading only tells you where it is right now. Look at the last ${x.stab.readingCount} readings and it has covered a ${x.stab.fmtRate} and is ${moving} — so it's passing through your target range rather than settling in it, and that movement is what corals respond to.`);
  }
  if (p2.length) paras.push(p2.join(" "));

  /* Only call something a trend when the movement clears the test kit's own
     resolution. pH shifting 0.10 across a month, or phosphate 0.07, is inside
     the noise and was previously reported as a direction with a deadline.
     Dosing advice deliberately lives in the dosing box, not here. */
  const trending = analysed.filter((x) => {
    if (!x.stab) return false;
    /* Already described in the paragraph above; saying it again adds nothing. */
    if (detailed.has(x.def.key)) return false;
    if (x.stab.pattern !== "trending up" && x.stab.pattern !== "trending down") return false;
    const floor = STABILITY_RULES[x.def.key] ? STABILITY_RULES[x.def.key].noiseFloor : 0;
    return Math.abs(x.stab.netChange) > floor * 2;
  });

  if (trending.length) {
    const p3 = trending.map((x) => {
      const dir = x.stab.pattern === "trending up" ? "risen" : "fallen";
      const amt = Math.abs(x.stab.netChange);
      const status = paramStatus(x.def, x.reading.value);
      const headroom = status === "ok"
        ? (x.stab.pattern === "trending up" ? x.def.max - x.reading.value : x.reading.value - x.def.min)
        : null;
      if (isRecovering(x)) {
        return `${x.def.label} has ${dir} ${amt < 1 ? amt.toFixed(2) : amt.toFixed(0)}${x.def.unit} over the past ${x.stab.spanDays} days, moving back toward its target range rather than away from it — that's a correction in progress, so let it run rather than reacting to the movement.`;
      }
      let s2 = `${x.def.label} has ${dir} ${amt < 1 ? amt.toFixed(2) : amt.toFixed(0)}${x.def.unit} over the past ${x.stab.spanDays} days, which is a consistent direction rather than noise.`;
      if (headroom != null && headroom >= 0 && x.stab.typicalRate > 0) {
        const daysToExit = Math.round(headroom / x.stab.typicalRate);
        if (daysToExit > 0 && daysToExit < 90) {
          s2 += ` Carry on at that pace and it reaches the edge of your target range in roughly ${daysToExit} days.`;
        }
      }
      return s2;
    });
    paras.push(p3.join(" "));
  }

  /* --- The foundation trio, read together ---
     Alkalinity, calcium and magnesium are the three every experienced reefer
     names first, and they only make sense as a set: calcium supplies the
     building blocks, alkalinity the carbonate, magnesium keeps both in
     solution. Reporting them separately misses the interactions. */
  const p4 = [];
  const alk = analysed.find((x) => x.def.key === "alkalinity");
  const ca = analysed.find((x) => x.def.key === "calcium");
  const mg = analysed.find((x) => x.def.key === "magnesium");

  if (alk && ca && mg) {
    const trio = [alk, ca, mg];
    const steadyTrio = trio.filter((x) => x.stab && x.stab.grade === "green").length;
    const inTrio = trio.filter((x) => paramStatus(x.def, x.reading.value) === "ok").length;
    if (steadyTrio === 3 && inTrio === 3) {
      p4.push(`The foundation trio is in good shape: alkalinity ${fmtVal(alk.def, alk.reading.value)}${alk.def.unit}, calcium ${fmtVal(ca.def, ca.reading.value)}ppm and magnesium ${fmtVal(mg.def, mg.reading.value)}ppm are all in range and all holding. Those three carry coral skeleton growth between them, so with the set behaving you have room to pay attention elsewhere.`);
    } else if (steadyTrio === 3) {
      p4.push(mg.reading.value < 1250
        ? `The foundation trio — alkalinity ${fmtVal(alk.def, alk.reading.value)}${alk.def.unit}, calcium ${fmtVal(ca.def, ca.reading.value)}ppm, magnesium ${fmtVal(mg.def, mg.reading.value)}ppm — is holding steady, but steady isn't the same as sufficient here.`
        : `The foundation trio — alkalinity ${fmtVal(alk.def, alk.reading.value)}${alk.def.unit}, calcium ${fmtVal(ca.def, ca.reading.value)}ppm, magnesium ${fmtVal(mg.def, mg.reading.value)}ppm — is all steady, even where the numbers sit outside your target ranges. Corals build skeleton from these three together, and consistency across the set matters more than any one of them hitting a textbook figure.`);
    } else {
      const looseX = trio.filter((x) => x.stab && x.stab.grade !== "green");
      const loose = looseX.map((x) => x.def.label);
      /* If the roll-call already named these, repeating them adds nothing —
         the set explanation only earns its place when it tells you something
         the paragraphs above didn't. */
      const alreadySaid = looseX.every((x) => detailed.has(x.def.key));
      if (alreadySaid && loose.length < 3) {
        // nothing new to add about the trio
      } else p4.push(loose.length === 3
        ? `All three of the foundation parameters are moving about at once. When they wander together it's usually one underlying cause rather than three separate ones — worth checking dosing consistency and water change routine before adjusting any of them individually.`
        : `Of the foundation trio, ${joinList(loose)} ${loose.length === 1 ? "is" : "are"} moving more than the other${loose.length === 1 ? "s" : ""}. They work as a set — one supplies the building blocks, one the carbonate, one keeps both in solution — so settling the loose one usually steadies the others with it.`);
    }
  }

  /* Magnesium only stops calcium and alkalinity holding when it is genuinely
     low in absolute terms. Below a user-set range reaching 1450 it may still be
     1400, which is a perfectly ordinary level and not a blocker. */
  const MG_CRITICAL = 1250;
  const mgTrulyLow = mg && mg.reading.value < MG_CRITICAL;
  if (mgTrulyLow) {
    p4.push(`Magnesium at ${fmtVal(mg.def, mg.reading.value)}ppm is low enough to matter — below about ${MG_CRITICAL} it stops holding calcium and alkalinity in solution, and they become difficult to maintain no matter how much you dose. Worth resolving before anything else.`);
  } else if (mg && paramStatus(mg.def, mg.reading.value) === "low") {
    p4.push(`Magnesium sits under your target range at ${fmtVal(mg.def, mg.reading.value)}ppm, though it's still within the range most tanks run without trouble — worth nudging up gradually rather than treating as urgent.`);
  }

  /* Calcium and alkalinity are consumed in fixed proportion, so their ratio is
     a cross-check that neither number gives on its own. */
  if (alk && ca) {
    const ratio = ca.reading.value / alk.reading.value;
    if (ratio < 42) {
      p4.push(`Calcium to alkalinity sits at ${ratio.toFixed(0)}:1, on the low side of the roughly 50:1 a balanced tank shows — calcium is lagging what your alkalinity implies, so the calcium side of your dosing is the one to look at.`);
    } else if (ratio > 60) {
      p4.push(`Calcium to alkalinity sits at ${ratio.toFixed(0)}:1, above the roughly 50:1 of a balanced tank — there's more calcium in solution than your alkalinity is drawing on, which usually means the calcium dose is running ahead.`);
    }
  }

  if (mg && ca) {
    const mgRatio = mg.reading.value / ca.reading.value;
    if (mgRatio < 2.7) {
      p4.push(`Magnesium to calcium is ${mgRatio.toFixed(1)}:1, under the ~3.1:1 of natural seawater — too little magnesium to hold calcium and alkalinity comfortably in solution.`);
    }
  }

  if (p4.length) paras.push(p4.join(" "));

  /* --- Nutrients: the ratio, not just the levels ---
     Corals build tissue from nitrogen and phosphorus and skeleton from
     alkalinity, so the nutrient pair and alkalinity have to be read together.
     High alkalinity on lean nutrients is the classic burnt-tip setup. */
  const p5 = [];
  const po4 = analysed.find((x) => x.def.key === "phosphate");
  const no3 = analysed.find((x) => x.def.key === "nitrate");

  if (po4 && no3 && po4.reading.value > 0) {
    const ratio = no3.reading.value / po4.reading.value;
    const balanced = ratio >= 50 && ratio <= 150;
    /* A ratio says nothing about whether there is enough of either. Nitrate 1.0
       against phosphate 0.01 is exactly 100:1 and also a starving tank. */
    const starved = no3.reading.value < 3 || po4.reading.value < 0.03;
    const loaded = no3.reading.value > 25 || po4.reading.value > 0.2;

    if (starved) {
      p5.push(`Your nutrients read ${fmtVal(no3.def, no3.reading.value)}ppm nitrate against ${fmtVal(po4.def, po4.reading.value)}ppm phosphate. The proportion between them is ${balanced ? "fine" : "off"}, but the levels themselves are the problem — both are close to bottom, and corals need measurable nitrogen and phosphorus to build tissue. Running this lean pales corals out and is the classic opening for dinoflagellates. Feeding more, or dosing nitrate back toward 5ppm, matters more here than the ratio.`);
    } else if (loaded) {
      const wayOver = no3.reading.value > no3.def.max * 2 || po4.reading.value > po4.def.max * 2;
      p5.push(`Your nutrients read ${fmtVal(no3.def, no3.reading.value)}ppm nitrate against ${fmtVal(po4.def, po4.reading.value)}ppm phosphate — a ratio of about ${ratio.toFixed(0)}:1. ${wayOver ? `Both are well above where you want them, far enough that this needs actively bringing down rather than just watching` : `The levels are on the high side, which tends to show as darker coral tissue and faster algae growth rather than anything acute`}. Work them down through water changes and export gradually; sudden nutrient crashes are harder on corals than steady high readings.`);
    } else if (balanced) {
      p5.push(`Your nutrients read ${fmtVal(no3.def, no3.reading.value)}ppm nitrate against ${fmtVal(po4.def, po4.reading.value)}ppm phosphate — a ratio of about ${ratio.toFixed(0)}:1, close to the 100:1 reefers treat as balanced. The ratio matters more than either figure alone: when one runs out well ahead of the other, whichever is left over tends to feed algae or cyano instead of coral.`);
    } else if (ratio > 150) {
      p5.push(`Your nutrients read ${fmtVal(no3.def, no3.reading.value)}ppm nitrate against ${fmtVal(po4.def, po4.reading.value)}ppm phosphate — about ${ratio.toFixed(0)}:1, well above the 100:1 that counts as balanced. Phosphate is the limiting one here, and when it runs short corals pale while the spare nitrate goes to nuisance growth. Easing off phosphate export usually works better than chasing nitrate down.`);
    } else {
      p5.push(`Your nutrients read ${fmtVal(no3.def, no3.reading.value)}ppm nitrate against ${fmtVal(po4.def, po4.reading.value)}ppm phosphate — about ${ratio.toFixed(0)}:1, below the 100:1 that counts as balanced. Phosphate is running ahead of nitrate, which favours algae and can slow calcification. Nudging nitrate up usually rebalances this more gently than stripping phosphate.`);
    }
  }

  /* Alkalinity and nutrients set each other's safe range. */
  if (alk && po4 && no3) {
    const alkVal = alk.reading.value;
    const lean = no3.reading.value < 3 || po4.reading.value < 0.03;
    const rich = no3.reading.value >= 5 && po4.reading.value >= 0.05;
    if (alkVal >= 9 && lean) {
      p5.push(`Worth flagging: alkalinity at ${fmtVal(alk.def, alkVal)}${alk.def.unit} on nutrients this lean is the combination that burns SPS tips. Skeleton growth outruns tissue growth when there's carbonate to spare but little nitrogen and phosphorus to build with. Either feed a little more, or bring alkalinity down toward 8 — the two have to move together.`);
    } else if (alkVal >= 9 && rich) {
      p5.push(`Alkalinity at ${fmtVal(alk.def, alkVal)}${alk.def.unit} is on the higher side, but your nutrients support it — tissue growth can keep pace with skeleton growth at these nitrate and phosphate levels. That pairing is coherent; the same alkalinity on a lean tank would risk burnt tips.`);
    } else if (alkVal <= 7.5 && rich) {
      p5.push(`Alkalinity at ${fmtVal(alk.def, alkVal)}${alk.def.unit} is fairly low for nutrients this generous. Corals have plenty to build tissue with but less carbonate for skeleton, which tends to show as good colour and slow growth. Raising alkalinity gently would let growth catch up.`);
    }
  }

  if (p5.length) paras.push(p5.join(" "));

  /* --- Control quality across the set ---
     Only worth saying when it draws a contrast the roll-call above didn't
     already make. Repeating the same names in a different sentence made the
     summary feel padded. */
  const graded = analysed.filter((x) => x.stab && x.stab.grade !== "unknown");
  if (graded.length >= 3) {
    const tightest = graded.filter((x) => x.stab.grade === "green");
    const loosest = graded.filter((x) => x.stab.grade === "red");
    const anyOff = analysed.some((x) => paramStatus(x.def, x.reading.value) !== "ok");
    if (tightest.length === graded.length) {
      paras.push(anyOff
        ? `Taken as a whole, everything you track is being held steadily — including the parameters sitting outside their target ranges. Steady in the wrong place is a much easier problem than unsteady in the right one.`
        : `Taken as a whole, everything you track is holding tightly. There's nothing here that needs adjusting.`);
    } else if (loosest.length && loosest.length < graded.length) {
      const names = loosest.map((x) => x.def.label);
      paras.push(`Set against the rest of the tank, ${joinList(names)} ${names.length === 1 ? "is the outlier" : "are the outliers"} — everything else is holding. Tightening the loose one usually lifts the whole tank more than fine-tuning something already steady.`);
    }
  }

  /* pH is the parameter most often misdiagnosed, so say where it comes from. */
  const ph = analysed.find((x) => x.def.key === "ph");
  if (ph && ph.reading.value > 8.4) {
    paras.push(`On pH: at ${fmtVal(ph.def, ph.reading.value)} you're running high, which usually means kalkwasser or a heavy buffer rather than a problem. Corals tolerate it well as long as it's steady, but watch that alkalinity doesn't get pushed up alongside it, and be careful adding anything else alkaline while pH sits here.`);
  } else if (ph && ph.reading.value < 7.9) {
    paras.push(`On pH: at ${fmtVal(ph.def, ph.reading.value)} it's on the low side, and the usual cause is carbon dioxide in the room rather than anything wrong in the tank. More surface agitation, fresh air to the skimmer intake, or a refugium lit opposite your display all lift it more reliably than buffering does — and chasing pH with alkalinity additives usually causes more trouble than the low reading itself.`);
  }

  // --- Paragraph 5: testing cadence feedback ---
  const stale = analysed.filter((x) => {
    if (!x.def.freqDays) return false;
    return daysBetween(x.reading.date, todayStr()) > x.def.freqDays * 2;
  });
  if (stale.length) {
    paras.push(`Worth noting the data itself is thinning out: ${stale.map((x) => `${x.def.label} (last tested ${daysBetween(x.reading.date, todayStr())} days ago)`).join(", ")}. Stability readings get less trustworthy as gaps widen, since a smooth line between two distant points can hide real movement in between.`);
  }

  /* --- One priority ---
     The commentary above lists observations; this ranks them. Ordered by what
     actually destabilises a tank fastest: magnesium failing first (it gates
     the other two), then genuine swing, then sustained drift, then placement. */
  const priority = (() => {
    // Magnesium gates the other two, so it goes first regardless.
    if (mg && mg.reading.value < 1250) {
      return `bring magnesium up — below about 1250 it stops holding calcium and alkalinity in solution, and they'll fight you no matter what you dose.`;
    }
    /* Starved nutrients paired with high alkalinity burns SPS tips, which
       outranks a parameter merely sitting under its target range. */
    if (alk && no3 && po4 && alk.reading.value >= 9
        && (no3.reading.value < 3 || po4.reading.value < 0.03)) {
      return `feed more — alkalinity this high on nutrients this lean is what burns SPS tips, and the nutrients are the easier half to fix.`;
    }
    /* A foundation parameter swinging wildly is more dangerous than a nutrient
       sitting off-target, because corals feel movement faster than position. */
    const bigThree = ["alkalinity", "calcium", "magnesium"];
    const wildFoundation = analysed.filter((x) =>
      bigThree.includes(x.def.key) && x.stab && x.stab.grade === "red" && !isRecovering(x));
    if (wildFoundation.length) {
      const worst = wildFoundation.sort((a, b) =>
        (a.def.key === "alkalinity" ? -1 : b.def.key === "alkalinity" ? 1 : 0))[0];
      return `settle ${worst.def.label.toLowerCase()} — it's swinging widely, and corals feel that movement long before they mind a number being out of range.`;
    }

    // Anything a long way outside its band outranks remaining stability concerns.
    const farOut = analysed
      .filter((x) => {
        if (paramStatus(x.def, x.reading.value) === "ok" || x.def.key === "ph") return false;
        if (bandsOut(x) <= 1) return false;
        /* Magnesium above the critical level is never the most important thing
           on a tank that is otherwise behaving, however far it sits from a
           user-set target range. */
        if (x.def.key === "magnesium" && x.reading.value >= 1250) return false;
        return true;
      })
      .sort((a, b) => bandsOut(b) - bandsOut(a));
    if (farOut.length) {
      return `bring ${farOut[0].def.label.toLowerCase()} back toward its band — at ${fmtVal(farOut[0].def, farOut[0].reading.value)}${farOut[0].def.unit} it's far enough out that steadiness isn't the issue.`;
    }
    // Starved nutrients are a real risk even when everything looks steady.
    if (no3 && po4 && (no3.reading.value < 3 || po4.reading.value < 0.03)) {
      return `feed a little more — nutrients this lean starve corals and invite dinoflagellates, whatever the rest of the numbers say.`;
    }
    const swinging = analysed
      .filter((x) => x.stab && x.stab.grade === "red" && !isRecovering(x))
      .sort((a, b) => (a.def.key === "alkalinity" ? -1 : b.def.key === "alkalinity" ? 1 : 0));
    if (swinging.length) {
      return `settle ${swinging[0].def.label.toLowerCase()} — it's the widest-moving thing here, and movement costs corals more than being out of range does.`;
    }
    const drifting = analysed.filter((x) => {
      if (!x.stab || isRecovering(x)) return false;
      const floor = STABILITY_RULES[x.def.key] ? STABILITY_RULES[x.def.key].noiseFloor : 0;
      return (x.stab.pattern === "trending up" || x.stab.pattern === "trending down")
        && Math.abs(x.stab.netChange) > floor * 2;
    }).sort((a, b) => (a.def.key === "alkalinity" ? -1 : b.def.key === "alkalinity" ? 1 : 0));
    if (drifting.length) {
      return `keep an eye on ${drifting[0].def.label.toLowerCase()} — it's travelling in one direction, and a small dosing correction now beats a large one later.`;
    }
    /* pH is never managed by moving a target range, so it is excluded here. */
    const off = analysed.filter((x) => paramStatus(x.def, x.reading.value) !== "ok" && x.def.key !== "ph");
    /* Changing a target range is a decision that needs history behind it; a handful
       of readings is not grounds for redefining what you are aiming at. */
    if (off.length && !thinData) {
      return `decide whether your ${off[0].def.label.toLowerCase()} target range is still the right one — the tank is holding steady, just not where you told it to.`;
    }
    if (off.length && thinData) {
      return `keep testing — ${off[0].def.label.toLowerCase()} is sitting outside your target range, but there isn't enough history yet to know whether that's the tank or the range.`;
    }
    if (ph && ph.reading.value < 7.9) {
      return `work on gas exchange for the low pH — more surface agitation or fresh air to the skimmer, rather than anything added to the water.`;
    }
    const stale = analysed.filter((x) => x.def.freqDays && daysBetween(x.reading.date, todayStr()) > x.def.freqDays * 2);
    if (stale.length) {
      return `get a fresh ${stale[0].def.label.toLowerCase()} reading in — everything looks well held, but the data behind that is getting old.`;
    }
    if (thinData) {
      return `keep logging — there isn't enough history yet for any of this to mean much, and a few weeks of consistent testing will change that.`;
    }
    return `nothing needs attention — keep testing at your current rhythm and leave the dosing alone.`;
  })();
  paras.push(`If you do one thing this week: ${priority}`);

  /* When something urgent leads, the rest of the summary steps back. Three
     screenfuls of prose beneath a warning buries it, and the detail is all
     still on the parameter cards. */
  const trimmed = urgent.length
    ? [paras[0], ...paras.slice(1, 3)]
    : paras;

  /* One line, and it says what rather than how many. "One thing needs
     attention" made you open the card to find out which; naming it costs the
     same space and answers the question. */
  /* The headline used to name a single metric, which made a tank with one
     dose tweak read the same as a tank in trouble. It now describes the whole
     thing; the individual findings are the claims below it. */
  const staleList = analysed.filter((x) => x.def.freqDays
    && daysBetween(x.reading.date, todayStr()) > x.def.freqDays * 2);
  const lead = buildHeadline({
    total: analysed.length,
    inRange: analysed.filter((x) => paramStatus(x.def, x.reading.value) === "ok").length,
    /* Which ones are out, so the headline can name them rather than average
       them away into "mostly in range". */
    outLabels: analysed
      .filter((x) => paramStatus(x.def, x.reading.value) !== "ok")
      .map((x) => x.def.label.toLowerCase()),
    steady: analysed.filter((x) => x.stab && x.stab.grade === "green").length,
    drifting: analysed.filter((x) => x.stab && (x.stab.grade === "amber" || x.stab.grade === "red")).length,
    /* An element being corrected is not "off-target and going nowhere" — it is
       going somewhere on purpose, and the claim beneath the headline says so. */
    offSteady: analysed.filter((x) => paramStatus(x.def, x.reading.value) !== "ok"
      && x.stab && x.stab.grade === "green"
      /* Matches every correction state, not just the one that existed when this
         was written: correcting-dose, correction-done, correction-due and
         correction-stalled all mean the element is being deliberately moved.
         Naming a single state let the new ones through, and the headline went
         back to calling a tank mid-plan "going nowhere". */
      && !(doseStates || []).some((d) => d && isCorrectionState(d.state) && d.key === x.def.key)).length,
    urgent: urgent.length,
    settling: ds.filter((d) => d.state === "settling").length,
    dueTests: needsTest.length,
    suggested: suggested.length,
    missed: missed.length,
    staleCount: staleList.length,
    urgentTitle: urgent.length === 1 ? urgent[0].title : null,
    /* Anything raised at watch level, so the headline cannot declare the tank
       spotless while a claim below it disagrees. */
    watching: (findings || []).some((f) => f.severity === "watch"),
    /* A correction under way outranks "sitting off-target but going nowhere" —
       it is going somewhere, on purpose, and the summary beneath says so. */
    correcting: (doseStates || []).filter((d) => d && d.state === "correcting").length,
    thinData,
  });

  return {
    headline: lead || headline,
    paragraphs: trimmed.filter(Boolean),
    score,
    urgentCount: urgent.length,
    watchCount: watch.length,
  };
}
