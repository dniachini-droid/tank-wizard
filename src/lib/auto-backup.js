/* ---------------------------------- automatic backup ----------------------------------
 *
 * The backup machinery was good and entirely manual: `buildBackup`,
 * `downloadJson`, `inspectBackup` and `restoreBackup` all worked, and nothing
 * called any of them without a tap on the Setup tab. The entire durability
 * story was a file the user had to remember to make. This module adds the
 * scheduling — three parts, and what each one does NOT protect against is as
 * much of the design as what it does:
 *
 * ONE — a snapshot ring. The last few `buildBackup()` outputs, kept in
 * IndexedDB, written at most once a day. It is an UNDO HISTORY, not a backup:
 * it lives in the same origin as the data it copies and dies with it. It
 * protects against an app bug, a bad restore, and an accidental bulk delete.
 * It is a ring rather than a slot because one snapshot that a bad state
 * overwrites is worse than none — it destroys the last good copy at the
 * moment it is needed. And it refuses the write that would start that rot: a
 * snapshot that collapsed to nothing does not go over one that held data.
 *
 * TWO — a File System Access handle. `showSaveFilePicker()` once, from a
 * user's tap; the handle persisted here; the same file rewritten on the daily
 * cadence with no further prompts. Genuinely automatic, and it survives a
 * storage clear if the file is in a synced folder — but it is CHROMIUM-ONLY.
 * No Safari, no Firefox, therefore no iOS, which is the platform the
 * seven-day eviction rule punishes hardest. It also cannot tell a synced
 * folder from a local-only one. It must never be the only plan.
 *
 * THREE — the share sheet. `navigator.share` with the backup as a file: one
 * tap to Files, iCloud Drive or Mail on the platform where the handle does
 * not exist. NOT automatic — a user gesture every time, by browser policy —
 * and the sheet reports dismissal and success identically in practice, so a
 * share is never recorded as a backup: a `last-backup` written on a cancelled
 * share would claim a copy that does not exist.
 *
 * The honest baseline, which no part of this changes: the only copy that
 * survives losing the phone is a file the user has put somewhere else. This
 * module makes that outcome much more likely. It does not make it certain,
 * and no UI string it feeds may imply otherwise.
 *
 * A fourth option — periodic programmatic auto-download — was considered and
 * rejected twice (routines/14 §3.3, routines/16 piece two): browsers block
 * non-gesture downloads, iOS Safari handles them badly, and it litters the
 * Downloads folder.
 */
import { buildBackup, restoreBackup } from './backup.jsx';
import { META_STORE, RING_STORE, run } from './idb.js';

export const RING_SIZE = 7;
const HANDLE_KEY = "file-handle";
const DAY_MS = 24 * 60 * 60 * 1000;

const total = (b) => Object.values((b && b.counts) || {}).reduce((a, n) => a + (n || 0), 0);

/* Newest first, with enough on each entry for a list the user can choose
   from — when it was taken and what it held — without deserialising the
   readings themselves. */
export async function ringList() {
  const res = await run(RING_STORE, "readonly", (s) => s.getAllKeys());
  if (!res.ok || !Array.isArray(res.value)) return [];
  const keys = res.value.map(String).sort().reverse();
  const out = [];
  for (const key of keys) {
    const snap = await run(RING_STORE, "readonly", (s) => s.get(key));
    if (snap.ok && snap.value) out.push({ key, counts: snap.value.counts || {}, createdAt: snap.value.createdAt });
  }
  return out;
}

export async function ringAdd(backup, nowIso) {
  if (!backup || backup.format !== "dans-tank-backup") {
    return { ok: false, reason: "not a backup" };
  }

  /* The refusal that makes the ring safe to run unattended. Only the
     transition from something to nothing is suspect — an empty snapshot on a
     device that never held anything is a normal first week. A user who
     deliberately empties their log keeps their run-before markers, and piece
     one's verdict (`suspectWipe` in the scheduler below) is what tells those
     apart at the call site; this check is the backstop for a caller that
     didn't ask. */
  const list = await ringList();
  const latest = list[0];
  if (latest && total(backup) === 0 && total(latest) > 0) {
    return { ok: false, reason: "this snapshot is empty and the last one was not — refusing to overwrite a good copy" };
  }

  const put = await run(RING_STORE, "readwrite", (s) => s.put(backup, nowIso));
  if (!put.ok) return put;

  /* Prune from the oldest end. A prune that fails is left for next time —
     an over-full ring loses nothing. */
  const keys = list.map((e) => e.key).concat(nowIso).sort();
  for (const key of keys.slice(0, Math.max(0, keys.length - RING_SIZE))) {
    await run(RING_STORE, "readwrite", (s) => s.delete(key));
  }
  return { ok: true, reason: null };
}

/* A snapshot's contents, without restoring it, so the same preview the file
   restore shows can be built for a snapshot: what is in it, and whether its
   target ranges disagree with this device's. The ring was the one restore path
   with no preview at all, which is how it came to rewrite target ranges on a tap. */
export async function readSnapshot(key) {
  const res = await run(RING_STORE, "readonly", (s) => s.get(key));
  return res.ok && res.value ? res.value : null;
}

/* Through `restoreBackup`, deliberately: a snapshot merges by natural key,
   never removes anything, and restores idempotently — the same three promises
   the file restore makes, because it is the same code making them. That
   includes the fourth: it will not decide on its own what to do about target
   ranges the snapshot and the device disagree about, so `options` is passed
   through rather than defaulted here. */
export async function restoreSnapshot(key, current, applySettings = true, options = {}) {
  const value = await readSnapshot(key);
  if (!value) return null;
  return restoreBackup(value, current, applySettings, options);
}

/* --------------------------------- the file handle --------------------------------- */

export async function saveFileHandle(handle) {
  const res = await run(META_STORE, "readwrite", (s) => s.put(handle, HANDLE_KEY));
  return res.ok;
}

export async function loadFileHandle() {
  const res = await run(META_STORE, "readonly", (s) => s.get(HANDLE_KEY));
  return res.ok && res.value ? res.value : null;
}

export async function dropFileHandle() {
  const res = await run(META_STORE, "readwrite", (s) => s.delete(HANDLE_KEY));
  return res.ok;
}

/* A write that cannot proceed says which kind of cannot: `needsTap` means the
   browser wants a user gesture to re-grant, which the Setup panel turns into
   a button rather than an error. */
export async function writeBackupToHandle(handle, backup) {
  if (!handle) return { ok: false, needsTap: false, reason: "no file chosen" };
  try {
    if (handle.queryPermission) {
      const p = await handle.queryPermission({ mode: "readwrite" });
      if (p !== "granted") {
        return { ok: false, needsTap: p === "prompt", reason: "the browser needs permission to keep writing this file" };
      }
    }
    const w = await handle.createWritable();
    await w.write(JSON.stringify(backup, null, 1));
    await w.close();
    return { ok: true, needsTap: false, reason: null };
  } catch (e) {
    return { ok: false, needsTap: false, reason: (e && e.message) || "the backup file could not be written" };
  }
}

/* The user-gesture half: re-request a lapsed permission, then write. Only
   ever called from a tap — `requestPermission` outside one is refused by the
   browser anyway. */
export async function regrantAndWrite(handle, backup) {
  try {
    if (handle && handle.requestPermission) {
      const p = await handle.requestPermission({ mode: "readwrite" });
      if (p !== "granted") return { ok: false, needsTap: true, reason: "permission was not granted" };
    }
    return writeBackupToHandle(handle, backup);
  } catch (e) {
    return { ok: false, needsTap: false, reason: (e && e.message) || "the backup file could not be written" };
  }
}

export function fileHandleSupported() {
  return typeof window !== "undefined" && typeof window.showSaveFilePicker === "function";
}

/* --------------------------------- the share sheet --------------------------------- */

export function shareSupported() {
  try {
    if (!navigator.share || !navigator.canShare) return false;
    return navigator.canShare({ files: [new File(["{}"], "t.json", { type: "application/json" })] });
  } catch {
    return false;
  }
}

/* Never writes `last-backup`, whatever the sheet reports. Dismissal and
   success come back indistinguishably often enough that recording either
   would sometimes claim a backup that was cancelled — the Setup panel says
   "shared" without promising "saved". */
export async function shareBackup(backup) {
  try {
    const file = new File([JSON.stringify(backup, null, 1)],
      `dans-tank-backup-${(backup.createdAt || "").slice(0, 10)}.json`,
      { type: "application/json" });
    await navigator.share({ files: [file], title: "Tank backup" });
    return { ok: true };
  } catch (e) {
    return { ok: false, reason: (e && e.message) || "sharing was cancelled" };
  }
}

/* ---------------------------------- the schedule ----------------------------------
 *
 * Called at launch and when the app is backgrounded. At most one snapshot a
 * day; the file handle is rewritten on the same cadence. Both are skipped
 * entirely on a device piece one judged wiped or suspect — the schedule
 * exists to preserve the last good state, and on those devices the current
 * state is the thing that needs to not be preserved: writing it to the
 * chosen file would destroy the one copy that survived. */
export async function maybeAutoBackup({ now = new Date().toISOString(), suspectWipe = false } = {}) {
  const out = { snapshotted: false, fileWritten: false, needsTap: false };
  if (suspectWipe) return out;

  const list = await ringList();
  const latest = list[0];
  const due = !latest || (Date.parse(now) - Date.parse(latest.key)) >= DAY_MS;
  if (!due) return out;

  const backup = await buildBackup();
  backup.createdAt = now;

  const added = await ringAdd(backup, now);
  out.snapshotted = added.ok;

  const handle = await loadFileHandle();
  if (handle) {
    const wrote = await writeBackupToHandle(handle, backup);
    out.fileWritten = wrote.ok;
    out.needsTap = wrote.needsTap;
  }
  return out;
}
