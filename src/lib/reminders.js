import { addDays, byNewest } from './analytics/time-of-day.js'
import { dayNum } from './analytics/water-changes.js'
import { uid } from './constants.js'
import { daysBetween } from './dates.js'

/* --- Smart reminders ---
 *
 * A reminder is due a fixed interval after it was last COMPLETED, not after it
 * was last due. Test three days late and the next one falls three days later
 * too, so being behind never compounds into a backlog that can't be cleared.
 *
 * Test reminders are linked to a parameter and complete themselves when that
 * test is logged — there is no separate tick to remember, because the act of
 * recording the reading is the completion.
 */
export const REMINDER_SEED = [
  { id: "rem-alkalinity", label: "Test alkalinity", paramKey: "alkalinity", kind: "test", intervalDays: 2,  startDate: "2026-08-10", enabled: true, builtin: true },
  { id: "rem-phosphate",  label: "Test phosphate",  paramKey: "phosphate",  kind: "test", intervalDays: 3,  startDate: "2026-08-10", enabled: true, builtin: true },
  { id: "rem-salinity",   label: "Test salinity",   paramKey: "salinity",   kind: "test", intervalDays: 3,  startDate: "2026-08-10", enabled: true, builtin: true },
  { id: "rem-nitrate",    label: "Test nitrate",    paramKey: "nitrate",    kind: "test", intervalDays: 7,  startDate: "2026-08-10", enabled: true, builtin: true },
  { id: "rem-calcium",    label: "Test calcium",    paramKey: "calcium",    kind: "test", intervalDays: 7,  startDate: "2026-08-10", enabled: true, builtin: true },
  { id: "rem-magnesium",  label: "Test magnesium",  paramKey: "magnesium",  kind: "test", intervalDays: 7,  startDate: "2026-08-10", enabled: true, builtin: true },
  { id: "rem-potassium",  label: "Test potassium",  paramKey: "potassium",  kind: "test", intervalDays: 30, startDate: "2026-08-10", enabled: true, builtin: true },
  { id: "rem-icp",        label: "Send ICP sample", paramKey: null,         kind: "icp",  intervalDays: 42, startDate: "2026-08-10", enabled: true, builtin: true },

  /* Husbandry. Same model as the tests, so they get the same scheduling,
     snoozing and editing rather than a second parallel system. Ids match the
     old task ids so completion history carries straight over. */
  { id: "waterchange", label: "Water change",    paramKey: null, kind: "water", intervalDays: 7,  startDate: "2026-08-10", enabled: true, builtin: true, needsVolume: true },
  { id: "carbon",      label: "Replace carbon",  paramKey: null, kind: "task",  intervalDays: 28, startDate: "2026-08-10", enabled: true, builtin: true },
  { id: "purigen",     label: "Replace Purigen", paramKey: null, kind: "task",  intervalDays: 28, startDate: "2026-08-10", enabled: true, builtin: true },
];

/* Reminders grouped the way the Tasks screen presents them. */
export const REMINDER_GROUPS = [
  { id: "test", label: "Test schedule", kinds: ["test"] },
  { id: "husbandry", label: "Husbandry & maintenance", kinds: ["icp", "water", "task"] },
];

/* Interval shown the way it was entered: 42 days reads better as 6 weeks. */
export function intervalLabel(days) {
  if (days % 7 === 0 && days >= 7) {
    const w = days / 7;
    return w === 1 ? "every week" : `every ${w} weeks`;
  }
  return days === 1 ? "every day" : `every ${days} days`;
}

/* One reminder's state: when it was last done, when it is next due, and how
   that reads today. `adjustDays` shifts only the next occurrence — the one
   after it is scheduled from the actual completion, so a nudge never
   permanently skews the rhythm. */
export function reminderState(rem, log, today) {
  const done = (log || [])
    .filter((l) => l.taskId === rem.id)
    .sort(byNewest);
  const lastDone = done.length ? done[0].date : null;

  let due = lastDone ? addDays(lastDone, rem.intervalDays) : rem.startDate;
  /* An override set by the dosing protocol: after a dose change the next test
     matters more than the usual rhythm, so it is pinned to a specific day and
     cleared as soon as the test is logged. */
  if (rem.dueOverride && (!lastDone || rem.dueOverride > lastDone)) due = rem.dueOverride;
  else if (rem.adjustDays) due = addDays(due, rem.adjustDays);

  const daysOut = daysBetween(today, due);
  return {
    rem, lastDone, due, daysOut,
    pinned: !!(rem.dueOverride && (!lastDone || rem.dueOverride > lastDone)),
    pinReason: rem.dueReason || null,
    dueTime: rem.dueTime || null,
    completions: done,
    status: daysOut < 0 ? "overdue" : daysOut === 0 ? "today" : "upcoming",
    /* Completed within the current cycle — i.e. there is nothing to do yet. */
    doneToday: lastDone === today,
  };
}

/* Future occurrences of one reminder up to a horizon, so a calendar can show
   what's coming as well as what's been done. Projection only — completing early
   or late reschedules everything after it. */
export function projectOccurrences(rem, log, today, untilDate) {
  if (!rem || rem.enabled === false || !rem.intervalDays) return [];
  const st = reminderState(rem, log, today);
  const out = [];
  let d = st.due;
  let guard = 0;
  while (dayNum(d) <= dayNum(untilDate) && guard++ < 400) {
    if (dayNum(d) >= dayNum(today)) out.push(d);
    d = addDays(d, rem.intervalDays);
  }
  return out;
}

export function computeReminders(reminders, log, today, windowDays = 14) {
  const active = (reminders || []).filter((r) => r.enabled !== false);
  const states = active.map((r) => reminderState(r, log, today));

  const overdue  = states.filter((s) => s.status === "overdue").sort((a, b) => a.daysOut - b.daysOut);
  const dueToday = states.filter((s) => s.status === "today");
  const upcoming = states.filter((s) => s.status === "upcoming" && s.daysOut <= windowDays)
                         .sort((a, b) => a.daysOut - b.daysOut);
  const later    = states.filter((s) => s.status === "upcoming" && s.daysOut > windowDays)
                         .sort((a, b) => a.daysOut - b.daysOut);

  /* Recently completed, most recent completion per reminder only — a new
     completion replaces the previous one rather than stacking up. */
  const recent = states
    .filter((s) => s.lastDone && daysBetween(s.lastDone, today) <= windowDays)
    .sort((a, b) => (a.lastDone < b.lastDone ? 1 : -1));

  return {
    states, overdue, dueToday, upcoming, later, recent,
    actionable: [...overdue, ...dueToday],
    allClear: overdue.length === 0 && dueToday.length === 0,
  };
}

/* Logging a test is the completion. Returns the log entries to add, so the
   caller can write them alongside the reading in one update. */
export function autoCompletions(reminders, log, paramKey, date, kind = "test") {
  const hits = (reminders || []).filter(
    (r) => r.enabled !== false &&
           (kind === "icp" ? r.kind === "icp" : r.kind === "test" && r.paramKey === paramKey));
  const out = [];
  for (const r of hits) {
    const already = (log || []).some((l) => l.taskId === r.id && l.date === date);
    if (already) continue;
    out.push({ id: uid(), taskId: r.id, date, auto: true });
  }
  return out;
}
