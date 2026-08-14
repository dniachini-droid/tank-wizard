import React, { useEffect, useMemo, useState } from 'react'
import { Dashboard, ParamHistoryModal } from './components/Dashboard.jsx'
import { DoseChangePopup, findingHidden, findingKey, findingSignature } from './components/DoseExpectation.jsx'
import { DosingWizard } from './components/DosingWizard.jsx'
import { TabErrorBoundary } from './components/ErrorBoundary.jsx'
import { IcpResultPopup } from './components/IcpConfirmation.jsx'
import { Insights } from './components/Insights.jsx'
import { LaunchSplash } from './components/LaunchAnimation.jsx'
import { LogResultPopup, Toast } from './components/ReadingConfirmation.jsx'
import { Setup } from './components/Setup.jsx'
import { TaskDonePopup } from './components/TaskCompletion.jsx'
import { Tasks } from './components/Tasks.jsx'
import { WaterLog } from './components/WaterLog.jsx'
import { AlertTriangle, Waves, X } from './icons.jsx'
import { DOSE_ELEMENTS } from './lib/analytics/consumption.js'
import { fmtAmount } from './lib/analytics/time-in-range.js'
import { addDays, byNewest, byOldest, nowTime } from './lib/analytics/time-of-day.js'
import { DEFAULT_SETTINGS, LIGHTING_SEED, WATER_CHANGE_LITRES, WATER_CHANGE_SEED } from './lib/analytics/water-changes.js'
import { buildBackup, requestPersistence } from './lib/backup.jsx'
import { NAV, PARAM_DEFS, uid } from './lib/constants.js'
import { fmtShort, paramStatus, todayStr } from './lib/dates.js'
import { assessAlkalinity } from './lib/dosing/alkalinity.js'
import { assessCalcium } from './lib/dosing/calcium.js'
import { assessMagnesium, proposeCorrection } from './lib/dosing/helpers.js'
import { doseStatus } from './lib/dosing/state.js'
import { buildFindings } from './lib/findings.js'
import { buildBriefing, buildOverview, explainScore } from './lib/narrative-engine.js'
import { REMINDER_SEED, autoCompletions, computeReminders, intervalLabel, reminderState } from './lib/reminders.js'
import { computeStability } from './lib/stability-engine.js'
import { loadKey, notify, onStorageError, onToast, saveKey } from './lib/storage.js'

/* ---------------------------------- main app ---------------------------------- */


/* ===========================================================================
   deriveTankState — everything the app believes about the tank, computed once
   ===========================================================================
   Before this, derivation was split: the app root computed the findings and
   the three dosing assessments, while the Dashboard separately computed the
   overview, the briefing and the score working, and computeStability was
   called from six places. Nothing forced those to agree, and twice they did
   not — two dismissal systems writing different key formats into the same
   storage, and a headline that declared the tank calm while the claims under
   it disagreed.

   Every screen now reads from one object. Two surfaces cannot describe the
   same tank differently because there is only one description. This changes
   no reasoning: the same engines are called with the same inputs, so every
   protocol example and every suite must still pass unchanged, which is what
   makes the consolidation checkable rather than a leap of faith.
   ========================================================================= */
/* Whatever came out of storage, as a list of usable records. Storage holds
   whatever was last written, and a backup file holds whatever was in it — an
   interrupted write, a hand-edited export or a file from another tool can all
   produce a null in the middle of a list, or something that is not a list at
   all. Dropping the unusable entries is right: a record the app cannot read is
   worse than no record, because it poisons everything derived from it. */
export function toRecords(value) {
  if (!Array.isArray(value)) return [];
  const out = [];
  for (const r of value) {
    if (r && typeof r === "object" && !Array.isArray(r)) out.push(r);
  }
  return out;
}

export function deriveTankState(input) {
  const {
    readings: rawReadings = [], icps: rawIcps = [], paramDefs = [],
    settings: rawSettings = DEFAULT_SETTINGS,
    doseLog: rawDoseLog = [], waterChanges: rawWaterChanges = [],
    corrections: rawCorrections = [], kitChanges = {},
    dismissed = {}, plans: rawPlans = {}, correctionPlans = {},
  } = input || {};

  /* Readings arrive from three places: the log form, which parses; an edit,
     which parses; and a restored backup, which does not. The backup inspector
     checks the file's shape but never the type of a value, so a JSON export
     touched by hand — or written by another tool — can put the string "8.9"
     into a reading. That threw on the first call to toFixed and took the whole
     screen with it, and because it is then saved to storage it would throw
     again on every load.

     Coerced once, here, rather than defended against in fifty display sites.
     A value that cannot be made into a finite number is dropped: a reading the
     app cannot read is worse than no reading, because it poisons the trend. */
  const readings = [];
  for (const r of toRecords(rawReadings)) {
    const v = typeof r.value === "number" ? r.value : parseFloat(r.value);
    if (!isFinite(v)) continue;
    readings.push(r.value === v ? r : { ...r, value: v });
  }

  /* The same guard for every other log. Readings were coerced here and the
     rest were not, so a backup with a null entry in the dose log — or a stored
     value that was not an array at all — threw before anything could be shown.
     Six of the app's own record types crashed on shapes its own backup format
     permits. */
  /* A default is only applied when the key is absent. Storage can hold an
     explicit null — an interrupted write leaves one — and that sails past the
     default straight into the first property access. */
  const settings = (rawSettings && typeof rawSettings === "object" && !Array.isArray(rawSettings))
    ? rawSettings : DEFAULT_SETTINGS;

  /* Same trap as settings: a stored null passes the default and then the
     first property read fails. Three storage keys hold plans and any of them
     can be null after an interrupted write. */
  const plans = (rawPlans && typeof rawPlans === "object") ? rawPlans : {};

  const icps = toRecords(rawIcps);
  /* Millilitres coerced, the same way reading values are. Readings have been
     coerced at this boundary for months and the dose log never was — so a
     backup holding ml as the string "11" survived the restore, survived
     inspectBackup, and then crashed the reading confirmation on toFixed. JSON
     round-trips preserve types, but a hand-edited export or a file from
     another tool does not have to. */
  const doseLog = toRecords(rawDoseLog).map((r) => {
    const ml = typeof r.ml === "number" ? r.ml : parseFloat(r.ml);
    return isFinite(ml) ? (r.ml === ml ? r : { ...r, ml }) : { ...r, ml: null };
  });
  const waterChanges = toRecords(rawWaterChanges);
  const corrections = toRecords(rawCorrections);

  /* Uses the app's own ordering rather than a second implementation of "most
     recent" — the point of this function is that there is one of everything. */
  const latestByParam = {};
  for (const def of paramDefs) {
    const rows = readings.filter((r) => r.param === def.key).sort(byNewest);
    latestByParam[def.key] = rows[0] || null;
  }

  const findingsData = buildFindings({
    readings, icps, paramDefs, settings, doseLog, waterChanges,
    latestByParam, kitChanges, corrections,
  });
  /* Dismissal filters the presentation, never the reasoning: the engines see
     everything, and only what reaches a screen is trimmed. */
  const allFindings = findingsData.findings;
  const findings = allFindings.filter((f) => !findingHidden(f, dismissed));
  const dismissedList = allFindings.filter((f) => findingHidden(f, dismissed));

  const assess = (key, fn2, plan) => {
    const def = paramDefs.find((d) => d.key === key);
    if (!def) return null;
    const a = fn2({ readings, doseLog, waterChanges, settings, def, plan, corrections, correctionPlans });
    return a ? { ...a, def } : null;
  };
  const alkAssessment = assess("alkalinity", assessAlkalinity, plans.alk);
  const caAssessment = assess("calcium", assessCalcium, plans.ca);
  const mgAssessment = assess("magnesium", assessMagnesium, plans.mg);

  const today = todayStr();
  const doseStates = [
    { key: "alkalinity", a: alkAssessment },
    { key: "calcium", a: caAssessment },
    { key: "magnesium", a: mgAssessment },
  ].map(({ key, a }) => {
    const d = paramDefs.find((x) => x.key === key);
    if (!d || !a) return null;
    const st = doseStatus(a, d, today, settings, latestByParam, doseLog, waterChanges);
    return st ? { ...st, key, el: d.label.toLowerCase(), def: d } : null;
  }).filter(Boolean);

  /* Stability was recomputed independently by the strip, the score working,
     the briefing and the overview. Computed once here and handed down. */
  const stabilityByParam = {};
  for (const def of paramDefs) stabilityByParam[def.key] = computeStability(def, readings);

  const overview = buildOverview(readings, latestByParam, paramDefs, findings, doseStates);
  /* The briefing sees the whole pool and does its own hiding, so it can report
     how many notes are put away rather than silently losing them. */
  const briefing = buildBriefing(readings, latestByParam, paramDefs, allFindings, doseStates, { dismissed });
  const scoreExplained = explainScore(readings, latestByParam, paramDefs, overview.score);

  /* What a correction would involve for each element, at each pace, so the
     Dosing Wizard can offer it without re-deriving anything. Null where the
     level is already in band; { possible: false, why } where the dose cannot
     do the job. */
  const correctionOffers = {};
  for (const d of doseStates) {
    if (!d || !d.def) continue;
    const a = { alkalinity: alkAssessment, calcium: caAssessment, magnesium: mgAssessment }[d.key];
    if (!a) continue;
    correctionOffers[d.key] = {
      gentle: proposeCorrection(a, d.def, settings, "gentle"),
      steady: proposeCorrection(a, d.def, settings, "steady"),
      quick: proposeCorrection(a, d.def, settings, "quick"),
    };
  }

  return {
    correctionOffers,
    latestByParam, stabilityByParam,
    findingsData, allFindings, findings, dismissedList,
    alkAssessment, caAssessment, mgAssessment, doseStates,
    overview, briefing, scoreExplained,
    hiddenCount: briefing.hiddenCount || 0,
  };
}

/* The last line before a blank screen.
 *
 * TabErrorBoundary covers the tab contents, but 942 lines run above it —
 * every storage load, the whole derivation, forty-one hooks. A failure in any
 * of that renders nothing at all: no tabs, no menu, and no way to reach the
 * export button.
 *
 * That matters more than it sounds. A display bug is an annoyance if you can
 * still get your data out and a disaster if you cannot, and this app has
 * already shipped one fault that made it completely unusable while every check
 * passed. The point of this boundary is not to fix anything — it is to make
 * sure a bug costs you a morning rather than your history.
 *
 * buildBackup reads storage directly and touches no component state, so it
 * still works when everything above it has failed. */
export class RootErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null, saving: false, saved: false };
  }
  static getDerivedStateFromError(error) { return { error }; }

  async rescue() {
    this.setState({ saving: true });
    try {
      const backup = await buildBackup();
      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `dans-tank-rescue-${todayStr()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      this.setState({ saving: false, saved: true });
    } catch (e) {
      this.setState({ saving: false, saved: false, rescueFailed: String(e && e.message) });
    }
  }

  render() {
    if (!this.state.error) return this.props.children;
    const { saving, saved, rescueFailed } = this.state;
    return (
      <div style={{ minHeight: "100vh", background: "#F3F7F6", padding: "24px 18px" }}>
        <div style={{ maxWidth: 460, margin: "0 auto" }}>
          <h1 style={{ fontSize: 19, fontWeight: 900, color: "#08191D", margin: "0 0 10px" }}>
            The app could not start
          </h1>
          <p style={{ fontSize: 14, lineHeight: 1.55, color: "#45605F", margin: "0 0 8px" }}>
            Something failed before any screen could be drawn. <strong>Your data has not been
            touched</strong> — it is still in storage exactly as you left it.
          </p>
          <p style={{ fontSize: 14, lineHeight: 1.55, color: "#45605F", margin: "0 0 18px" }}>
            Save a copy now, before doing anything else. The file below is the same
            backup the Setup screen produces and can be restored once this is fixed.
          </p>
          <button onClick={() => this.rescue()} disabled={saving}
            style={{ width: "100%", padding: "13px 16px", borderRadius: 12, border: "none",
                     background: saved ? "#0B7C86" : "#08191D", color: "#fff",
                     fontSize: 15, fontWeight: 800, cursor: saving ? "default" : "pointer" }}>
            {saving ? "Saving…" : saved ? "Saved — check your downloads" : "Save my data"}
          </button>
          {rescueFailed && (
            <p style={{ fontSize: 13, color: "#C4285B", marginTop: 12, fontWeight: 700 }}>
              The rescue export also failed. {rescueFailed} Do not clear the app's storage —
              the data is still there and can be recovered another way.
            </p>
          )}
          <p style={{ fontSize: 12, color: "#5F7575", marginTop: 22, lineHeight: 1.5 }}>
            Reloading is safe and may clear a one-off failure. If it does not, the message
            below is what went wrong.
          </p>
          <pre style={{ fontSize: 11, color: "#5F7575", background: "#E3ECEA",
                        padding: 10, borderRadius: 8, marginTop: 8,
                        whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
            {String(this.state.error && (this.state.error.stack || this.state.error.message))}
          </pre>
        </div>
      </div>
    );
  }
}

export function ReefConsoleInner() {
  const [tab, setTab] = useState("dashboard");
  /* Tapping "Log test" on a reminder should land on the entry form with the
     right parameter already chosen — otherwise you arrive on the Testing tab
     and have to find it yourself. */
  const [testPrefill, setTestPrefill] = useState(null);
  /* Lifted out of Dashboard: tapping a parameter should open its graph from
     anywhere, and two copies of the same modal would drift apart. */
  const [modalParam, setModalParam] = useState(null);
  const [logResult, setLogResult] = useState(null);
  const [icpResult, setIcpResult] = useState(null);
  const [taskResult, setTaskResult] = useState(null);
  const [toastMsg, setToastMsg] = useState(null);

  /* The splash belongs to a launch, not to a render: it plays once per session
     and never again until the app is opened afresh. Gating it to home-screen
     launches meant it was invisible in a browser tab, which made it impossible
     to see at all unless installed — so it now plays wherever the app opens,
     and is skippable either way. */
  /* The app mounts once per page load, so plain state already means "once per
     launch". A sessionStorage flag was used to guard against replays, but it
     was never cleared — so after the first ever load the splash was suppressed
     for the entire life of that browser tab, which is why it stopped showing. */
  const [splash, setSplash] = useState(true);
  useEffect(() => { onToast(setToastMsg); }, []);

  /* Ask the browser to keep this app's data, once, at launch.
     This request used to live in Setup's mount effect, and Setup only mounts
     while its tab is selected — so someone who logged readings from the
     Dashboard for months never asked at all, while Safari's seven-day
     eviction rule applied to them in full. Asking from the root means it
     happens whatever tab is showing. requestPersistence remembers its own
     answer, so Setup's copy of the call reads the result rather than asking a
     second time. */
  useEffect(() => { requestPersistence(); }, []);
  const openTestFor = (paramKey) => { setTestPrefill({ paramKey, at: Date.now() }); setTab("log"); };

  /* Browsers restore the previous scroll position on reload, which drops you
     partway down the Dashboard with the heading out of view. */
  useEffect(() => {
    if (typeof window !== "undefined" && "scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }
  }, []);

  /* Returning to a tab left the heading clipped under the browser chrome.
     Two things cause it: the previous scroll position is retained, and mobile
     Chrome re-expands its URL bar as you reach the top, which shifts the layout
     after the scroll has already happened. A single scrollTo therefore lands in
     the wrong place. Reset across several frames so the last one runs after the
     toolbar has settled. */
  useEffect(() => {
    if (typeof window === "undefined") return;
    let cancelled = false;
    const toTop = () => {
      if (cancelled) return;
      window.scrollTo(0, 0);
      if (document.scrollingElement) document.scrollingElement.scrollTop = 0;
      if (document.body) document.body.scrollTop = 0;
    };
    toTop();
    const r1 = requestAnimationFrame(() => { toTop(); requestAnimationFrame(toTop); });
    const t1 = setTimeout(toTop, 80);
    const t2 = setTimeout(toTop, 250);
    return () => {
      cancelled = true;
      cancelAnimationFrame(r1);
      clearTimeout(t1); clearTimeout(t2);
    };
  }, [tab]);
  const [loaded, setLoaded] = useState(false);
  const [readings, setReadings] = useState([]);
  const [icps, setIcps] = useState([]);
  const [customTasks, setCustomTasks] = useState([]);
  const [taskLog, setTaskLog] = useState([]);
  const [lighting, setLighting] = useState([]);
  const [customRanges, setCustomRanges] = useState({});
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [doseLog, setDoseLog] = useState([]);
  const [waterChanges, setWaterChanges] = useState([]);
  const [reminders, setReminders] = useState([]);
  /* When each test kit was last replaced, so a lab comparison is only weighed
     against the kit that actually produced it. */
  const [kitChanges, setKitChanges] = useState({});
  /* Findings the user has read and chosen not to act on, keyed by id and the
     exact wording — so if the situation worsens the wording changes and the
     finding comes back rather than staying hidden for good. */
  const [dismissed, setDismissed] = useState({});
  const [alkPlan, setAlkPlan] = useState(null);
  const [corrections, setCorrections] = useState([]);
  /* Temporary correction plans, keyed by element. A plan says the dose is
     deliberately off consumption, what it is aiming at, and what to return to
     — without it the engine reads the elevated dose as an error and argues
     with the very plan the keeper just started. */
  const [correctionPlans, setCorrectionPlans] = useState({});
  const [caPlan, setCaPlan] = useState(null);
  const [mgPlan, setMgPlan] = useState(null);
  const [doseResult, setDoseResult] = useState(null);
  const [storageMsg, setStorageMsg] = useState(null);

  // Merge any user-edited target ranges over the built-in defaults.
  const paramDefs = useMemo(() =>
    PARAM_DEFS.map((d) => customRanges[d.key]
      ? { ...d, min: customRanges[d.key].min, max: customRanges[d.key].max }
      : d),
  [customRanges]);

  const saveSettings = async (next) => {
    const merged = { ...DEFAULT_SETTINGS, ...next };
    setSettings(merged);
    await saveKey("tank-settings", merged);
  };
  const addDoseChange = async (row) => {
    const element = row.element || "alkalinity";
    const next = [{ id: uid(), ...row, element }, ...doseLog];
    setDoseLog(next); await saveKey("dose-log", next);
    const cfg = DOSE_ELEMENTS.find((e) => e.key === element);
    if (cfg) await saveSettings({ ...settings, [cfg.doseField]: row.ml });
  };
  const deleteDoseChange = async (id) => {
    const next = doseLog.filter((d) => d.id !== id);
    setDoseLog(next); await saveKey("dose-log", next);
  };
  const addWaterChange = async (row) => {
    const next = [{ id: uid(), ...row }, ...waterChanges];
    setWaterChanges(next); await saveKey("water-changes", next);
  };
  const deleteWaterChange = async (id) => {
    const next = waterChanges.filter((w) => w.id !== id);
    setWaterChanges(next); await saveKey("water-changes", next);
  };
  const saveRange = async (key, min, max) => {
    const next = { ...customRanges, [key]: { min, max } };
    setCustomRanges(next);
    await saveKey("custom-ranges", next);
  };
  const resetRange = async (key) => {
    const next = { ...customRanges };
    delete next[key];
    setCustomRanges(next);
    await saveKey("custom-ranges", next);
  };

  useEffect(() => { onStorageError((m) => setStorageMsg(m)); }, []);

  useEffect(() => {
    (async () => {
      const [r, i, ct, tl, lg, seeded, icpSeeded, wcSeeded, lightSeeded, strengthsFixed, rem, kc, dis, ap, corr, cap, mgp, cr, st, dl, wc] = await Promise.all([
        loadKey("readings", []),
        loadKey("icp-tests", []),
        loadKey("tasks-custom", []),
        loadKey("task-log", []),
        loadKey("lighting-log", []),
        loadKey("historical-seeded", false),
        loadKey("icp-seeded", false),
        loadKey("wc-seeded", false),
        loadKey("light-seeded", false),
        loadKey("strengths-fixed-v1", false),
        loadKey("reminders", null),
        loadKey("kit-changes", {}),
        loadKey("findings-dismissed", {}),
        loadKey("alk-plan", null),
        loadKey("corrections", []),
        loadKey("ca-plan", null),
        loadKey("mg-plan", null),
        loadKey("custom-ranges", {}),
        loadKey("tank-settings", DEFAULT_SETTINGS),
        loadKey("dose-log", []),
        loadKey("water-changes", []),
      ]);

      /* Readings are measurements somebody took, so nothing is seeded into
         them — a clean device starts empty. The marker is still written on the
         first run so the state of an install stays readable. */
      const finalReadings = r;
      if (!seeded) {
        await saveKey("readings", finalReadings);
        await saveKey("historical-seeded", true);
      }

      /* ICP panels are measurements too, and are seeded no more than readings
         are. */
      const finalIcps = i;
      if (!icpSeeded) {
        await saveKey("icp-seeded", true);
      }

      /* Weekly water changes, seeded once and matched on date so anything
         already logged by hand is left alone. */
      let finalWaterChanges = wc || [];
      if (!wcSeeded) {
        const have = new Set(finalWaterChanges.map((w) => w.date));
        const add = WATER_CHANGE_SEED
          .filter((d) => !have.has(d))
          .map((d) => ({ id: "wc-" + d, date: d, litres: WATER_CHANGE_LITRES, note: "" }));
        if (add.length) {
          finalWaterChanges = [...finalWaterChanges, ...add].sort(byNewest);
          await saveKey("water-changes", finalWaterChanges);
        }
        await saveKey("wc-seeded", true);
      }

      let finalLighting = lg || [];
      if (!lightSeeded) {
        const haveL = new Set(finalLighting.map((x) => x.date));
        const addL = LIGHTING_SEED.filter((x) => !haveL.has(x.date));
        if (addL.length) {
          finalLighting = [...finalLighting, ...addL].sort(byNewest);
          await saveKey("lighting-log", finalLighting);
        }
        await saveKey("light-seeded", true);
      }

      /* Product strengths are measured facts about the bottles, so fill them in
         where the user hasn't set their own. Doses are deliberately left alone. */
      let finalSettings = { ...DEFAULT_SETTINGS, ...(st || {}) };
      const seedFields = ["dkhPerMlPer100L", "caPpmPerMlPer100L", "mgPpmPerMlPer100L",
                          "dailyDoseMl", "calciumDoseMl", "magDoseMl"];
      const needsSeed = !st || seedFields.some((f) => st[f] == null);
      if (needsSeed) {
        for (const f of seedFields) {
          if (!st || st[f] == null) finalSettings[f] = DEFAULT_SETTINGS[f];
        }
        await saveKey("tank-settings", finalSettings);
      }

      /* One-off correction. The product strengths were originally entered from
         a label rather than derived from the mix, and the calcium figure had
         the 2x doubling applied twice — 0.72 instead of 0.3611. Since those
         values are already saved in browser storage, "fill in only if missing"
         would never reach them. This overwrites once, then never again. */
      if (!strengthsFixed) {
        finalSettings = {
          ...finalSettings,
          dkhPerMlPer100L: DEFAULT_SETTINGS.dkhPerMlPer100L,
          caPpmPerMlPer100L: DEFAULT_SETTINGS.caPpmPerMlPer100L,
        };
        await saveKey("tank-settings", finalSettings);
        await saveKey("strengths-fixed-v1", true);
      }

      /* Test reminders exist from the start rather than needing to be created —
         the app already knows which parameters exist. Only the schedule is the
         user's to set. */
      let finalReminders = rem;
      if (!finalReminders) {
        finalReminders = REMINDER_SEED.map((x) => ({ ...x }));
        await saveKey("reminders", finalReminders);
      } else {
        /* Add anything seeded since this install was created — husbandry
           reminders arrived after the test ones — without disturbing schedules
           already customised. */
        const have = new Set(finalReminders.map((x) => x.id));
        const missing = REMINDER_SEED.filter((x) => !have.has(x.id)).map((x) => ({ ...x }));
        if (missing.length) {
          finalReminders = [...finalReminders, ...missing];
          await saveKey("reminders", finalReminders);
        }
      }
      setReminders(finalReminders);
      setKitChanges(kc || {});
      setDismissed(dis || {});
      setAlkPlan(ap || null);
      setCorrections(corr || []);
      const cplans = await loadKey("correction-plans");
      setCorrectionPlans(cplans || {});
      setCaPlan(cap || null);
      setMgPlan(mgp || null);

      setReadings(finalReadings); setIcps(finalIcps); setCustomTasks(ct); setTaskLog(tl);
      setLighting(finalLighting); setCustomRanges(cr || {}); setSettings(finalSettings);
      setDoseLog(dl || []); setWaterChanges(finalWaterChanges);
      setLoaded(true);
    })();
  }, []);

  /* A restore writes to storage directly, so mirror the merged result into
     state — otherwise the screen would keep showing the pre-restore data until
     the next reload. */
  const saveReminders = async (next) => {
    setReminders(next);
    await saveKey("reminders", next);
  };

  /* Recording a replacement retires every comparison made with the old kit. */
  const replaceKit = async (paramKey, date = todayStr()) => {
    const next = { ...kitChanges, [paramKey]: date };
    setKitChanges(next);
    await saveKey("kit-changes", next);
    const def = paramDefs.find((d) => d.key === paramKey);
    notify(`${def ? def.label : "Kit"} marked as replaced`);
  };
  const undoReplaceKit = async (paramKey) => {
    const next = { ...kitChanges };
    delete next[paramKey];
    setKitChanges(next);
    await saveKey("kit-changes", next);
    notify("Replacement removed");
  };

  const dismissFinding = async (f) => {
    const prev = dismissed[findingKey(f)];
    const times = (prev && typeof prev === "object" && prev.times ? prev.times : 0) + 1;
    const next = { ...dismissed,
      [findingKey(f)]: { at: todayStr(), sig: findingSignature(f), times } };
    setDismissed(next);
    await saveKey("findings-dismissed", next);
    notify("Hidden — it'll return if this changes");
  };
  /* A claim is put away by its own key rather than a finding id, because most
     claims are not findings — a drift or a parked pair is assembled from the
     readings themselves. */
  const dismissNote = async (c) => {
    if (!c || !c.dismissKey) return;
    /* Key and signature are stored separately: the key identifies the claim
       for as long as it exists, the signature records the situation it was put
       away in. A claim is suppressed only while the two still agree, which is
       what makes the count stable and the return meaningful. */
    const prev = dismissed[c.dismissKey];
    const times = (prev && typeof prev === "object" && prev.times ? prev.times : 0) + 1;
    const next = {
      ...dismissed,
      [c.dismissKey]: {
        at: todayStr(),
        sig: c.dismissSignature != null ? String(c.dismissSignature) : "",
        /* How many times this has been put off. Kept in the entry because the
           key no longer changes between snoozes, so counting keys would always
           report one. */
        times,
      },
    };
    /* Shown once rather than in front of every snooze. */
    if (c.snoozeUntilTest && c.dismissKey) {
      next["__snooze-explained|" + c.dismissKey] = todayStr();
    }
    setDismissed(next);
    await saveKey("findings-dismissed", next);
    notify(c.snoozeUntilTest
      ? "Put off \u2014 back after your next test"
      : "Hidden \u2014 it'll return if this changes");
  };
  /* One note back, by its own key — restoring everything was the only option
     before, which made hiding a thing you had to be sure about. */
  /* Start a temporary correction: set the dose and record why, so every
     surface knows the elevated figure is deliberate. */
  const startCorrection = async (key, offer) => {
    if (!offer || !offer.possible) return;
    const st = deriveTankState({ readings, icps, paramDefs, settings, doseLog,
      waterChanges, corrections, kitChanges, dismissed, correctionPlans });
    const level = st.latestByParam[key];
    const plan = {
      target: offer.target,
      returnDose: offer.returnDose,
      startedAt: `${todayStr()} ${nowTime()}`,
      startValue: level ? level.value : null,
      pace: offer.pace,
      dose: offer.dose,
      days: offer.days,
    };
    const next = { ...correctionPlans, [key]: plan };
    setCorrectionPlans(next);
    await saveKey("correction-plans", next);
    await addDoseChange({ date: todayStr(), ml: offer.dose, element: key,
      note: `correction toward ${offer.target}` });
    notify(`${key} dose set to ${fmtAmount(offer.dose)} mL/day — correcting toward ${offer.target}`);
  };

  /* Cancel: the dose goes back, the plan is deleted, and everything derived
     from it disappears with it. Nothing should survive a cancel. */
  const cancelCorrection = async (key) => {
    const plan = correctionPlans[key];
    if (!plan) return;
    const next = { ...correctionPlans };
    delete next[key];
    setCorrectionPlans(next);
    await saveKey("correction-plans", next);
    if (plan.returnDose != null) {
      await addDoseChange({ date: todayStr(), ml: plan.returnDose, element: key,
        note: "correction cancelled" });
    }
    notify(`Correction cancelled — ${key} dose back to ${fmtAmount(plan.returnDose)} mL/day`);
  };

  /* Arrived: return to the maintenance dose and clear the plan in one action,
     because leaving the elevated dose running is how a correction overshoots. */
  const finishCorrection = async (key) => {
    const plan = correctionPlans[key];
    if (!plan) return;
    const next = { ...correctionPlans };
    delete next[key];
    setCorrectionPlans(next);
    await saveKey("correction-plans", next);
    await addDoseChange({ date: todayStr(), ml: plan.returnDose, element: key,
      note: "correction complete" });
    notify(`${key} back to ${fmtAmount(plan.returnDose)} mL/day`);
  };

  const restoreOneNote = async (c) => {
    if (!c || !c.dismissKey) return;
    const next = { ...dismissed };
    delete next[c.dismissKey];
    setDismissed(next);
    await saveKey("findings-dismissed", next);
    notify("Shown again");
  };

  const restoreNotes = async () => {
    setDismissed({});
    await saveKey("findings-dismissed", {});
    notify("Hidden notes restored");
  };

  const restoreFinding = async (key) => {
    const next = { ...dismissed };
    delete next[key];
    setDismissed(next);
    await saveKey("findings-dismissed", next);
    notify("Note restored");
  };
  const restoreAllFindings = async () => {
    setDismissed({});
    await saveKey("findings-dismissed", {});
    notify("All notes restored");
  };

  /* Setting the dose from the assessment records it as a dose change, so the
     protocol restarts its window and will hold for 48 hours before advising
     again — exactly as it would if the change had been entered by hand. */
  /* Applying a dose does three things at once, which is what makes this a loop
     rather than a calculator: it records the change so the protocol restarts
     its window, it remembers where the staged correction is heading, and it
     pins the alkalinity test that will judge the new dose so it appears on the
     dashboard when it is actually due. */
  const applyAlkDose = (ml, meta = {}) => applyDoseChange("alkalinity", ml, meta);

  /* Adopting the solved strength updates the one number every dose figure
     depends on. */
  /* Calcium mirrors alkalinity exactly: apply a dose, remember the plan, pin
     the test that judges it — only on a weekly rhythm rather than a 48-hour
     one, because that is how fast calcium actually moves. */
  /* Recording a dose change, for any of the three. The date and time come from
     the sheet rather than "now", because when the doser actually changed is
     what the settling period is measured from — and people record it after the
     fact as often as at the moment. */
  const applyDoseChange = async (element, ml, meta = {}) => {
    const cfg = {
      alkalinity: { rem: "rem-alkalinity", key: "alk-plan", set: setAlkPlan, days: 2 },
      calcium:    { rem: "rem-calcium",    key: "ca-plan",  set: setCaPlan,  days: 7 },
      magnesium:  { rem: "rem-magnesium",  key: "mg-plan",  set: setMgPlan,  days: 7 },
    }[element];
    if (!cfg) return;

    const date = meta.date || todayStr();
    const time = meta.time || nowTime();
    await addDoseChange({ date, time, ml, element, note: "set from the dosing wizard" });

    const testOn = addDays(date, cfg.days);
    const nextPlan = {
      appliedDose: ml, appliedAt: `${date} ${time}`,
      target: meta.target != null ? meta.target : ml,
      stage: meta.stage || 1, stages: meta.stages || 1,
      nextTestAt: testOn, nextTestTime: time,
    };
    cfg.set(nextPlan);
    await saveKey(cfg.key, nextPlan);
    await saveReminders(reminders.map((r) => (r.id === cfg.rem
      ? { ...r, dueOverride: testOn, dueTime: time, dueReason: "dose", adjustDays: 0 } : r)));

    /* What this dose should do, so the next reading confirms it or doesn't.
       Uses the dose actually entered, not the one suggested. */
    const def = paramDefs.find((d) => d.key === element);
    const effect = meta.effectPerMl;
    const cons = meta.consumption;
    let perDay = null, expected = null;
    if (isFinite(effect) && isFinite(cons) && meta.currentValue != null) {
      perDay = ml * effect - cons;
      expected = meta.currentValue + perDay * cfg.days;
    }
    setDoseResult({
      at: Date.now(), def, from: meta.fromDose, to: ml, date, time,
      testOn, days: cfg.days, perDay, expected,
      staged: !!meta.staged, target: meta.target,
    });
  };

  const applyMgDose = (ml, meta = {}) => applyDoseChange("magnesium", ml, meta);
  const clearMgPlan = async () => {
    setMgPlan(null);
    await saveKey("mg-plan", null);
    await saveReminders(reminders.map((r) => (r.id === "rem-magnesium"
      ? { ...r, dueOverride: null, dueTime: null, dueReason: null } : r)));
    notify("Plan cleared");
  };
  const applyMgEffect = async (per100L) => {
    await saveSettings({ ...settings, mgPpmPerMlPer100L: per100L });
    notify(`Magnesium strength set to ${per100L} ppm/mL/100L`);
  };

  const applyCaDose = (ml, meta = {}) => applyDoseChange("calcium", ml, meta);
  const clearCaPlan = async () => {
    setCaPlan(null);
    await saveKey("ca-plan", null);
    await saveReminders(reminders.map((r) => (r.id === "rem-calcium"
      ? { ...r, dueOverride: null, dueTime: null, dueReason: null } : r)));
    notify("Plan cleared");
  };
  const applyCaEffect = async (per100L) => {
    await saveSettings({ ...settings, caPpmPerMlPer100L: per100L });
    notify(`Calcium strength set to ${per100L} ppm/mL/100L`);
  };

  const applyAlkEffect = async (per100L) => {
    await saveSettings({ ...settings, dkhPerMlPer100L: per100L });
    notify(`Alkalinity strength set to ${per100L} dKH/mL/100L`);
  };

  const logCorrection = async (ml, direction, element = "alkalinity") => {
    const entry = { id: uid(), date: todayStr(), time: nowTime(), element,
                    ml: direction === "down" ? -Math.abs(ml) : Math.abs(ml), direction };
    const next = [entry, ...corrections];
    setCorrections(next);
    await saveKey("corrections", next);
    /* The correction takes two to three days to deliver, so the test that
       judges it belongs after that, not tomorrow. */
    /* Calcium and magnesium take a week to show what a correction did;
       alkalinity a few days. */
    const testOn = addDays(todayStr(), element === "alkalinity" ? 3 : 7);
    const remId = element === "calcium" ? "rem-calcium"
      : element === "magnesium" ? "rem-magnesium" : "rem-alkalinity";
    const rem = reminders.map((r) => (r.id === remId
      ? { ...r, dueOverride: testOn, dueTime: nowTime(), dueReason: "correction", adjustDays: 0 } : r));
    await saveReminders(rem);
    notify(`${fmtAmount(Math.abs(ml))} mL correction logged · test ${fmtShort(testOn)}`);
  };

  const deleteCorrection = async (id) => {
    const next = corrections.filter((c) => c.id !== id);
    setCorrections(next);
    await saveKey("corrections", next);
  };

  const clearAlkPlan = async () => {
    setAlkPlan(null);
    await saveKey("alk-plan", null);
    const next = reminders.map((r) => (r.id === "rem-alkalinity"
      ? { ...r, dueOverride: null, dueTime: null, dueReason: null } : r));
    await saveReminders(next);
    notify("Plan cleared");
  };

  const addReminder = async (r) => { await saveReminders([...reminders, r]); };
  const deleteReminder = async (id) => { await saveReminders(reminders.filter((r) => r.id !== id)); };

  const updateReminder = async (id, patch) => {
    await saveReminders(reminders.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  };

  /* Nudging shifts only the next occurrence. The one after it is scheduled from
     the actual completion, so this never permanently skews the rhythm. */
  /* Moving a task sets an explicit date rather than accumulating a relative
     offset. The old model nudged by N days, which meant the date you saw was
     the result of arithmetic you could not inspect, and editing a task that
     already had completion history did nothing at all — the due date was
     derived from the last completion and the offset was quietly ignored. */
  const setReminderDue = async (id, iso) => {
    if (!iso) return;
    await updateReminder(id, { dueOverride: iso, dueReason: "manual", adjustDays: 0 });
    const r = reminders.find((x) => x.id === id);
    notify(`${r ? r.label : "Task"} moved to ${fmtShort(iso)}`);
  };

  const setReminderInterval = async (id, days) => {
    if (!isFinite(days) || days < 1) return;
    /* Changing the rhythm also releases any one-off move, or the new interval
       would appear to do nothing until the pinned date passed. */
    await updateReminder(id, { intervalDays: days, dueOverride: null, dueReason: null });
    notify(`Now ${intervalLabel(days).toLowerCase()}`);
  };

  const skipReminder = async (id) => {
    const r = reminders.find((x) => x.id === id);
    if (!r) return;
    const st = reminderState(r, taskLog, todayStr());
    /* Skipping moves to the next occurrence rather than marking it done, so
       the history stays honest about what was actually tested. */
    await updateReminder(id, { dueOverride: addDays(st.due, r.intervalDays), dueReason: "skipped", adjustDays: 0 });
    notify(`Skipped — next ${fmtShort(addDays(st.due, r.intervalDays))}`);
  };

  /* Kept for the existing +1 day controls. */
  const nudgeReminder = async (id, days) => {
    const r = reminders.find((x) => x.id === id);
    if (!r) return;
    const st = reminderState(r, taskLog, todayStr());
    await setReminderDue(id, addDays(st.due, days));
  };

  const completeReminder = async (id, date = todayStr()) => {
    const entry = { id: uid(), taskId: id, date };
    const next = [entry, ...taskLog];
    setTaskLog(next);
    await saveKey("task-log", next);
    /* A completion supersedes any nudge — the next due date comes from here. */
    await updateReminder(id, { adjustDays: 0 });

    const rem = reminders.find((r) => r.id === id);
    if (rem) {
      const history = next.filter((l) => l.taskId === id)
        .map((l) => l.date).sort((a, b) => (a < b ? 1 : -1));
      setTaskResult({
        at: Date.now(), label: rem.label, date,
        intervalDays: rem.intervalDays,
        nextDue: addDays(date, rem.intervalDays),
        history,
      });
    }
  };

  const applyRestore = (merged) => {
    if (merged["readings"]) setReadings(merged["readings"]);
    if (merged["icp-tests"]) setIcps(merged["icp-tests"]);
    if (merged["water-changes"]) setWaterChanges(merged["water-changes"]);
    if (merged["dose-log"]) setDoseLog(merged["dose-log"]);
    if (merged["lighting-log"]) setLighting(merged["lighting-log"]);
    if (merged["task-log"]) setTaskLog(merged["task-log"]);
    if (merged["tasks-custom"]) setCustomTasks(merged["tasks-custom"]);
    if (merged["reminders"]) setReminders(merged["reminders"]);
    if (merged["tank-settings"]) setSettings(merged["tank-settings"]);
    if (merged["custom-ranges"]) setCustomRanges(merged["custom-ranges"]);
    if (merged["kit-changes"]) setKitChanges(merged["kit-changes"]);
    if (merged["findings-dismissed"]) setDismissed(merged["findings-dismissed"]);
  };

  /* Reminders replaced the old task list, so anything that used to look up a
     task name reads from there instead. Kept under the same name so the CSV
     export and due-list code didn't need rewriting. */
  const allTasks = useMemo(
    () => reminders.map((r) => ({ id: r.id, label: r.label, freqDays: r.intervalDays, builtin: r.builtin })),
    [reminders]);

  const latestByParam = useMemo(() => {
    const map = {};
    for (const def of paramDefs) {
      const rows = readings.filter((r) => r.param === def.key).sort(byNewest);
      map[def.key] = rows[0] || null;
    }
    return map;
  }, [readings, paramDefs]);

  const [remWindow, setRemWindow] = useState(14);
  const reminderView = useMemo(
    () => computeReminders(reminders, taskLog, todayStr(), remWindow),
    [reminders, taskLog, remWindow]);

  /* The reminder engine replaced this; nothing renders it any more. */
  const dueList = [];

  /* Husbandry events overlaid on parameter charts so cause and effect is visible. */
  /* Chart markers are limited to things that happen occasionally and could
     plausibly shift a trend. Water changes and recurring tasks are weekly, so
     marking them buried the chart under a picket fence of lines that carried
     no information. */
  /* One place reasons about cross-cutting conclusions; every screen reads from
     the same pool rather than re-deriving its own view. */
  /* One derivation for the whole app. Every screen reads from this object, so
     two surfaces cannot describe the same tank differently — the fault behind
     two dismissal systems keyed differently, and a headline that contradicted
     the claims beneath it. */
  const tank = useMemo(
    () => deriveTankState({
      readings, icps, paramDefs, settings, doseLog, waterChanges, corrections,
      kitChanges, dismissed, plans: { alk: alkPlan, ca: caPlan, mg: mgPlan },
      correctionPlans,
    }),
    [readings, icps, paramDefs, settings, doseLog, waterChanges, corrections,
     kitChanges, dismissed, alkPlan, caPlan, mgPlan, correctionPlans]);

  const findingsData = tank.findingsData;
  const findings = tank.findings;
  const dismissedList = tank.dismissedList;
  const alkAssessment = tank.alkAssessment;
  const caAssessment = tank.caAssessment;
  const mgAssessment = tank.mgAssessment;
  const doseStates = tank.doseStates;

  const chartEvents = useMemo(() => {
    const ev = [];
    for (const l of lighting) {
      ev.push({ date: l.date, icon: "\u2600", color: "#926A09", kind: "Lighting", text: l.note || "Lighting change" });
    }
    for (const d of doseLog) {
      const el = DOSE_ELEMENTS.find((e) => e.key === (d.element || "alkalinity"));
      ev.push({ date: d.date, icon: "\u25C6", color: "#0B7C86", kind: "Dose",
        param: d.element || "alkalinity",
        text: `${el ? el.label : "Dose"} set to ${d.ml} mL/day` });
    }
    return ev.sort(byOldest);
  }, [lighting, doseLog]);

  const alerts = useMemo(() => {
    return paramDefs.map((def) => ({ def, reading: latestByParam[def.key] }))
      .filter(({ def, reading }) => reading && paramStatus(def, reading.value) !== "ok" && paramStatus(def, reading.value) !== "unknown");
  }, [latestByParam, paramDefs]);

  /* ---------- mutators ---------- */
  const addReading = async (row) => {
    const next = [...readings, { id: uid(), ...row }];
    setReadings(next); await saveKey("readings", next);
    /* Recording the reading IS the completion — there is no second tick to
       remember, and the next one is scheduled from this date. */
    const completed = await completeLinkedReminders(row.param, row.date, "test");

    /* Hand back enough for the form to confirm what was saved and when the
       next one falls, so the outcome is visible without leaving the page. */
    const def = paramDefs.find((d) => d.key === row.param);
    const linked = reminders.find((r) => r.enabled !== false && r.kind === "test" && r.paramKey === row.param);
    /* The previous reading lets the confirmation say something about movement
       rather than just repeating the number back. */
    const prior = readings.filter((r) => r.param === row.param)
      .sort(byNewest)[0];
    const out = {
      prev: prior ? prior.value : null,
      delta: prior ? row.value - prior.value : null,
      def, value: row.value, date: row.date,
      status: def ? paramStatus(def, row.value) : "unknown",
      nextDue: linked ? addDays(row.date, linked.intervalDays) : null,
      interval: linked ? linked.intervalDays : null,
      completed: completed && completed.length > 0,
      /* Identity for the confirmation popup: remounting on each reading is what
         stops the previous run's finished state painting for a frame. */
      at: Date.now(),
    };

    /* What the dosing engine makes of the tank now this reading is in it. The
       popup renders that verdict rather than forming its own — otherwise the
       two drift, and a reading logged mid-correction reads as a problem while
       the Dosing Wizard two taps away calls it progress. */
    try {
      const after = deriveTankState({
        readings: next, icps, paramDefs, settings, doseLog, waterChanges,
        corrections, kitChanges, dismissed,
        plans: { alk: alkPlan, ca: caPlan, mg: mgPlan },
        correctionPlans,
      });
      out.doseState = after.doseStates.find((d) => d && d.key === row.param) || null;
    } catch (e) {
      out.doseState = null;
    }
    if (out.def) setLogResult(out);
    return out;
  };
  const editReading = async (id, patch) => {
    const next = readings.map((r) => (r.id === id ? { ...r, ...patch } : r));
    setReadings(next); await saveKey("readings", next);
  };
  const deleteReading = async (id) => {
    const next = readings.filter((r) => r.id !== id);
    setReadings(next); await saveKey("readings", next);
  };
  /* Shared by readings and ICP panels: mark any linked reminder done and clear
     a pending nudge, so the schedule follows what actually happened. */
  const completeLinkedReminders = async (paramKey, date, kind) => {
    const additions = autoCompletions(reminders, taskLog, paramKey, date, kind);
    if (!additions.length) return [];
    const nextLog = [...additions, ...taskLog];
    setTaskLog(nextLog);
    await saveKey("task-log", nextLog);
    const ids = new Set(additions.map((a) => a.taskId));
    const cleared = reminders.map((r) =>
      ids.has(r.id) && (r.adjustDays || r.dueOverride)
        ? { ...r, adjustDays: 0, dueOverride: null, dueTime: null, dueReason: null }
        : r);
    if (cleared.some((r, i) => r !== reminders[i])) await saveReminders(cleared);
    return additions;
  };

  const addIcp = async (row) => {
    const next = [...icps, { id: uid(), ...row }];
    setIcps(next);
    const ok = await saveKey("icp-tests", next);
    await completeLinkedReminders(null, row.date, "icp");
    /* The panel is the densest thing entered into the app; it deserves the same
       moment a single reading gets. `at` keys the popup so each one remounts. */
    setIcpResult({ ...row, at: Date.now(), priorPanels: icps });
    return ok;
  };
  const deleteIcp = async (id) => {
    const next = icps.filter((r) => r.id !== id);
    setIcps(next); await saveKey("icp-tests", next);
  };
  const addCustomTask = async (row) => {
    const next = [...customTasks, { id: uid(), builtin: false, ...row }];
    setCustomTasks(next); await saveKey("tasks-custom", next);
  };
  const deleteCustomTask = async (id) => {
    const next = customTasks.filter((t) => t.id !== id);
    setCustomTasks(next); await saveKey("tasks-custom", next);
    const nextLog = taskLog.filter((l) => l.taskId !== id);
    setTaskLog(nextLog); await saveKey("task-log", nextLog);
  };
  const markTaskDone = async (taskId, date) => {
    const next = [...taskLog, { id: uid(), taskId, date }];
    setTaskLog(next); await saveKey("task-log", next);
  };
  const addLighting = async (row) => {
    const next = [{ id: uid(), ...row }, ...lighting];
    setLighting(next); await saveKey("lighting-log", next);
  };
  const deleteLighting = async (id) => {
    const next = lighting.filter((l) => l.id !== id);
    setLighting(next); await saveKey("lighting-log", next);
  };

  if (!loaded) {
    return (
      <div className="min-h-screen bg-app flex items-center justify-center font-body">
        <div className="flex items-center gap-3 text-teal-brand font-bold text-sm">
          <Waves className="animate-pulse" size={20} /> loading reef console…
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-app text-ink font-body">
      <style>{`
        .font-display { font-family: 'Avenir Next', 'Avenir', 'Futura', 'Trebuchet MS', -apple-system, 'Segoe UI', Roboto, sans-serif; letter-spacing: -0.02em; font-weight: 800; }
        .font-body { font-family: -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; }
        .bg-app { background-color: #F3F7F6; }
        .border-app { border-color: #E3ECEA; }
        .text-ink { color: #08191D; }
        .text-ink2 { color: #45605F; }
        .text-teal-brand { color: #0B7C86; }
        .bg-teal-brand { background-color: #0B7C86; }
        ::-webkit-scrollbar { width: 8px; height: 8px; }
        ::-webkit-scrollbar-thumb { background: #C7D6D3; border-radius: 4px; }
        /* iOS gives date/time inputs a large intrinsic width that ignores the
           grid column, which pushed neighbouring fields past the card edge.
           Force them to size from their container instead. */
        input[type="date"] {
          -webkit-appearance: none;
          appearance: none;
          min-width: 0;
          width: 100%;
          max-width: 100%;
          box-sizing: border-box;
          text-align: left;
        }
        input, select, textarea { min-width: 0; max-width: 100%; box-sizing: border-box; }
        select { -webkit-appearance: none; appearance: none;
          background-image: url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D'http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg'%20viewBox%3D'0%200%2024%2024'%20fill%3D'none'%20stroke%3D'%2345605F'%20stroke-width%3D'3'%3E%3Cpath%20d%3D'M6%209l6%206%206-6'%2F%3E%3C%2Fsvg%3E");
          background-repeat: no-repeat; background-position: right 10px center; background-size: 14px;
          padding-right: 32px;
        }
      `}</style>

      <div className="flex">
        {/* Sidebar - desktop */}
        <aside className="hidden md:flex flex-col w-56 shrink-0 h-screen sticky top-0 border-r border-app px-4 py-6 bg-white">
          <div className="flex items-center gap-2 px-2 mb-8">
            <div className="w-9 h-9 rounded-xl bg-teal-brand flex items-center justify-center shadow-sm">
              <Waves size={17} className="text-white" />
            </div>
            <div>
              <div className="font-display text-sm text-ink leading-tight">Dan's Tank</div>
              <div className="text-[10px] text-ink2 font-bold">77L reef · Sydney</div>
            </div>
          </div>
          <nav className="flex flex-col gap-1">
            {NAV.map((n) => {
              const Icon = n.icon;
              const active = tab === n.id;
              return (
                <button key={n.id} onClick={() => setTab(n.id)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-bold transition-colors ${active ? "bg-teal-50 text-teal-brand" : "text-ink2 hover:text-ink hover:bg-app"}`}>
                  <Icon size={16} /> {n.label}
                </button>
              );
            })}
          </nav>
          <div className="mt-auto px-3 py-3 rounded-lg bg-app border border-app">
            <div className="text-[10px] text-teal-brand uppercase tracking-wide font-extrabold mb-1">Target profile</div>
            <div className="text-xs text-ink font-bold leading-relaxed">34–36 ppt · 8.5–9.5 dKH<br/>Ca 450–500 · Mg 1450–1500</div>
          </div>
        </aside>

        {/* Main */}
        <main className="flex-1 px-4 md:px-8 max-w-6xl"
          style={{
            /* The safe-area inset is what actually protects the heading — on a
               notched phone or an installed PWA it is the difference between a
               readable title and one under the status bar, and it is zero on
               desktop where nothing overlaps. The 2.5rem that used to sit on
               top of it was defensive padding against mobile Chrome's URL bar,
               but browser chrome sits above the viewport rather than over it,
               so all it bought was a screenful of white space above every
               heading. One rem is enough to keep the title off the edge. */
            paddingTop: "calc(1rem + env(safe-area-inset-top, 0px))",
            paddingBottom: "calc(6rem + env(safe-area-inset-bottom, 0px))",
          }}>
          {storageMsg && (
            <div className="mb-4 rounded-xl p-3 border-2" style={{ background: "#C4285B12", borderColor: "#C4285B55" }}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-2 min-w-0">
                  <AlertTriangle size={16} className="shrink-0 mt-0.5" color="#C4285B" />
                  <p className="text-[13px] font-bold text-ink leading-relaxed">{storageMsg}</p>
                </div>
                <button aria-label="Dismiss" onClick={() => setStorageMsg(null)} className="text-ink2 shrink-0 p-2 -m-2 rounded-lg active:bg-app"><X size={16} /></button>
              </div>
            </div>
          )}

          <header className="md:hidden flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-teal-brand flex items-center justify-center">
              <Waves size={16} className="text-white" />
            </div>
            <div className="font-display text-ink">Dan's Tank</div>
          </header>

          <TabErrorBoundary tabKey={tab}>
          {tab === "dashboard" && (
            <Dashboard {...{ latestByParam, dueList, alerts, readings, paramDefs, saveRange, resetRange,
              customRanges, chartEvents, settings, doseLog, waterChanges, findings, icps,
              reminderView, remWindow, setRemWindow, doseStates }}
              onOpenTest={openTestFor}
              onCompleteReminder={completeReminder}
              onNudgeReminder={nudgeReminder}
              onSetReminderDue={setReminderDue} onSetReminderInterval={setReminderInterval}
              onSkipReminder={skipReminder} onUpdateReminder={updateReminder}
              onAddReading={addReading} reminders={reminders} taskLog={taskLog}
              onGoTab={(t) => setTab(t)}
              tank={tank}
              dismissedNotes={dismissed}
              onDismissNote={dismissNote} onRestoreNotes={restoreNotes}
              onRestoreOneNote={restoreOneNote}
              onOpenParam={setModalParam} />
          )}
          {tab === "log" && (
            <WaterLog readings={readings} onAdd={addReading} onDelete={deleteReading}
              paramDefs={paramDefs} chartEvents={chartEvents}
              icps={icps} onAddIcp={addIcp} onDeleteIcp={deleteIcp} onEdit={editReading} prefill={testPrefill}
              onOpenParam={setModalParam} reminders={reminders} reminderView={reminderView} />
          )}
          {tab === "dosing" && (
            <DosingWizard paramDefs={paramDefs}
              alkAssessment={alkAssessment} caAssessment={caAssessment} mgAssessment={mgAssessment}
              findings={findings} onDismissFinding={dismissFinding}
              onApplyAlkDose={applyAlkDose} onApplyCaDose={applyCaDose} onApplyMgDose={applyMgDose}
              onClearAlkPlan={clearAlkPlan} onClearCaPlan={clearCaPlan} onClearMgPlan={clearMgPlan}
              correctionOffers={tank.correctionOffers} doseStates={tank.doseStates}
              onStartCorrection={startCorrection} onCancelCorrection={cancelCorrection}
              onFinishCorrection={finishCorrection}
              onLogCorrection={logCorrection}
              onApplyEffect={applyAlkEffect} onApplyCaEffect={applyCaEffect} onApplyMgEffect={applyMgEffect} />
          )}
          {tab === "insights" && (
            <Insights readings={readings} icps={icps} paramDefs={paramDefs}
              settings={settings} latestByParam={latestByParam}
              doseLog={doseLog} waterChanges={waterChanges} lighting={lighting} findings={findings}
              onSaveSettings={saveSettings} onSaveRange={saveRange}
              kitChanges={kitChanges} onReplaceKit={replaceKit} onUndoReplaceKit={undoReplaceKit}
              onDismissFinding={dismissFinding} onApplyAlkDose={applyAlkDose}
              alkPlan={alkPlan} onClearAlkPlan={clearAlkPlan}
              corrections={corrections} onLogCorrection={logCorrection}
              onApplyEffect={applyAlkEffect}
              onApplyCaDose={applyCaDose} onApplyCaEffect={applyCaEffect}
              caPlan={caPlan} onClearCaPlan={clearCaPlan}
              onApplyMgDose={applyMgDose} onApplyMgEffect={applyMgEffect}
              mgPlan={mgPlan} onClearMgPlan={clearMgPlan} />
          )}
          {tab === "tasks" && (
            <Tasks allTasks={allTasks} taskLog={taskLog} onAddCustom={addCustomTask}
              onDeleteCustom={deleteCustomTask} onMarkDone={completeReminder}
              onAddWaterChange={addWaterChange} waterChanges={waterChanges}
              settings={settings} latestByParam={latestByParam}
              paramDefs={paramDefs} onDeleteWaterChange={deleteWaterChange}
              reminders={reminders} reminderView={reminderView} onUpdateReminder={updateReminder}
              onSetReminderDue={setReminderDue} onSetReminderInterval={setReminderInterval}
              onSkipReminder={skipReminder}
              onNudgeReminder={nudgeReminder} onAddReminder={addReminder}
              onDeleteReminder={deleteReminder} onOpenTest={openTestFor} />
          )}
          {tab === "setup" && (
            <Setup settings={settings} onSaveSettings={saveSettings} paramDefs={paramDefs}
              latestByParam={latestByParam} readings={readings}
              doseLog={doseLog} onAddDoseChange={addDoseChange} onDeleteDoseChange={deleteDoseChange}
              waterChanges={waterChanges} icps={icps} lighting={lighting}
              taskLog={taskLog} allTasks={allTasks}
              onAddLighting={addLighting} onDeleteLighting={deleteLighting}
              customTasks={customTasks} onRestored={applyRestore}
              onPlayIntro={() => setSplash(true)}
              dismissedList={dismissedList} onRestoreFinding={restoreFinding}
              onRestoreAllFindings={restoreAllFindings} />
          )}
          </TabErrorBoundary>

          <DoseChangePopup result={doseResult} onClose={() => setDoseResult(null)} />
          <LogResultPopup key={logResult ? logResult.at : "none"} result={logResult}
            onClose={() => setLogResult(null)} readings={readings}
            onOpenDosing={() => setTab("dosing")} />
          <IcpResultPopup key={icpResult ? "icp" + icpResult.at : "icpnone"} result={icpResult}
            onClose={() => setIcpResult(null)} icps={icpResult ? icpResult.priorPanels : []} />
          <TaskDonePopup key={taskResult ? "task" + taskResult.at : "tasknone"} result={taskResult}
            onClose={() => setTaskResult(null)} />
          <Toast message={toastMsg} onDone={() => setToastMsg(null)} />
          {splash && <LaunchSplash onDone={() => setSplash(false)} />}

          {modalParam && (
            <ParamHistoryModal def={paramDefs.find((d) => d.key === modalParam)} readings={readings}
              onClose={() => setModalParam(null)} onSaveRange={saveRange} onResetRange={resetRange}
              isCustom={!!customRanges[modalParam]} chartEvents={chartEvents} settings={settings}
              doseLog={doseLog} paramDefs={paramDefs} waterChanges={waterChanges} findings={findings}
              onAddReading={addReading} reminders={reminders} onDismissFinding={dismissFinding}
              dose={(doseStates || []).find((d) => d.key === modalParam) || null}
              onGoDosing={() => { setModalParam(null); setTab("dosing"); }} />
          )}
        </main>
      </div>

      {/* Bottom nav - mobile */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 bg-white border-t border-app flex justify-around py-2 z-20 shadow-[0_-1px_6px_rgba(15,40,45,0.06)]"
        style={{ paddingBottom: "calc(0.5rem + env(safe-area-inset-bottom, 0px))" }}>
        {NAV.map((n) => {
          const Icon = n.icon;
          const active = tab === n.id;
          return (
            <button key={n.id} onClick={() => setTab(n.id)} className="flex flex-col items-center gap-0.5 px-3 py-1.5 min-w-[56px] rounded-lg active:bg-app">
              <Icon size={18} className={active ? "text-teal-brand" : "text-ink2"} />
              <span className={`text-[9px] font-bold ${active ? "text-teal-brand" : "text-ink2"}`}>{n.label.split(" ")[0]}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}

/* Exported wrapped, so nothing can render the app without its last line of
   defence in place. */
export function ReefConsole() {
  return (
    <RootErrorBoundary>
      <ReefConsoleInner />
    </RootErrorBoundary>
  );
}
