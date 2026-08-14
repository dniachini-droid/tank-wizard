/* ---------------------------------- storage helpers ---------------------------------- */

/* Two storage backends, tried in order. The host bridge is preferred where it
   exists, but it can fail in ways localStorage doesn't — a bridge that returns
   an unexpected response would otherwise lose a change with only a red banner
   to show for it. Falling through means the data still lands somewhere.

   `window.storage` is a genuine host bridge, supplied by an environment the
   app is embedded in. There used to be a shim here that installed a fake one
   whenever it was absent, backed by this same localStorage under the prefix
   below. Nothing in the shipped PWA defines `window.storage` — not
   index.html, not main.jsx — so the shim was always installed, `saveKey`
   always took its bridge branch, and that branch's mirror wrote a second,
   byte-identical copy of every value into the same localStorage under a
   second prefix. The app's effective quota was half what the browser gave it,
   and bought nothing: the mirror exists so that a bridge failure cannot lose
   a write, and a bridge that *is* localStorage cannot fail in any way its own
   mirror would survive.

   The shim is gone. Environments with a real bridge are untouched — the shim
   only ever installed where there was none — and the mirror is kept for them,
   which is the case its reasoning was written for. */
export const LS_PREFIX = "danstank:";
export const LEGACY_PREFIX = "reefconsole:";

export function lsGet(key) {
  try {
    const raw = window.localStorage.getItem(LS_PREFIX + key);
    return raw == null ? undefined : JSON.parse(raw);
  } catch { return undefined; }
}
/* Why the failure is kept rather than reduced to `false`: it is the only
   evidence of *why* a save failed, and the difference between "storage is
   full, here is what takes up the room" and "unknown error" is the difference
   between a user who can act and one who cannot. It used to reach `saveKey`
   only because the shim threw it across the bridge branch first. */
let lastLocalError = null;
export function lsSet(key, value) {
  try {
    window.localStorage.setItem(LS_PREFIX + key, JSON.stringify(value));
    lastLocalError = null;
    return true;
  } catch (e) { lastLocalError = e; return false; }
}

/* Devices that ran the shim hold every value under both prefixes. The legacy
   copy is the authoritative one — `saveKey` wrote it first and `loadKey` read
   the bridge before the mirror — so it is carried across and only then
   removed. Reclaiming the duplicate is the point: without this an existing
   install goes on paying the doubled footprint forever, and the fix would only
   help devices that had never run the app.

   Drained rather than merely read as a fallback, because a fallback cannot
   work here: a stale mirror sitting under the live prefix would shadow the
   good copy behind it, and the near-quota device where the pair diverged in
   the first place is exactly the one that would be hurt.

   Failing safely is designed in. Identical copies — every key on a device that
   was never short of space — need no write at all, only a removal, which
   cannot fail for want of room. A key that does need a write and cannot get
   one keeps both copies and is recorded, so reads go on preferring the legacy
   copy until a later run has the room to finish. Nothing is removed before its
   replacement is known to be in place. */
const undrained = new Set();

export function drainLegacyStore() {
  const tally = { reclaimed: 0, carried: 0, undrained: 0 };
  const keys = [];
  try {
    for (let i = 0; i < window.localStorage.length; i++) {
      const k = window.localStorage.key(i);
      if (k && k.startsWith(LEGACY_PREFIX)) keys.push(k.slice(LEGACY_PREFIX.length));
    }
  } catch { return tally; }

  undrained.clear();
  for (const key of keys) {
    const legacy = window.localStorage.getItem(LEGACY_PREFIX + key);
    if (legacy === null) continue;
    if (window.localStorage.getItem(LS_PREFIX + key) === legacy) {
      tally.reclaimed++;
    } else {
      try {
        window.localStorage.setItem(LS_PREFIX + key, legacy);
        tally.carried++;
      } catch {
        undrained.add(key);
        tally.undrained++;
        continue;
      }
    }
    try { window.localStorage.removeItem(LEGACY_PREFIX + key); } catch { /* keep both */ }
  }
  return tally;
}

export async function loadKey(key, fallback) {
  try {
    if (window.storage && window.storage.get) {
      const res = await window.storage.get(key, false);
      if (res && res.value) return JSON.parse(res.value);
    }
  } catch (e) { /* fall through to local storage */ }
  /* A key the drain could not finish still lives under the legacy prefix, and
     that copy is the newer of the two. Empty on every device the drain
     completed on, which is all of them but one that was out of space at load. */
  if (undrained.has(key)) {
    try {
      const raw = window.localStorage.getItem(LEGACY_PREFIX + key);
      if (raw != null) return JSON.parse(raw);
    } catch { /* fall through to the mirror */ }
  }
  const local = lsGet(key);
  return local === undefined ? fallback : local;
}
/* Storage failures used to be swallowed, which made a full quota look like a
   successful save until the next reload. Surface them instead. */
export let toastHandler = null;
export function onToast(fn) { toastHandler = fn; }
/* Brief confirmation that something happened — used where the thing you acted
   on disappears, so there is otherwise no feedback that it worked. */
export function notify(message) { if (toastHandler) toastHandler(message); }

export let storageErrorHandler = null;
export function onStorageError(fn) { storageErrorHandler = fn; }

export function isQuotaError(e) {
  if (!e) return false;
  const n = e.name || "";
  const m = String(e.message || "");
  return n === "QuotaExceededError" || n === "NS_ERROR_DOM_QUOTA_REACHED" ||
         /quota|exceeded|storage is full|too large/i.test(m);
}

export async function saveKey(key, value) {
  let bridgeError = null;
  try {
    if (window.storage && window.storage.set) {
      await window.storage.set(key, JSON.stringify(value), false);
      /* Mirror to local storage as well, so a later bridge failure can still
         read back what was written. */
      lsSet(key, value);
      return true;
    }
  } catch (e) {
    bridgeError = e;
    console.error("storage bridge save failed", key, e);
  }

  /* Bridge unavailable or failed — write locally instead. In the shipped PWA
     this is the only path, so the local failure is the one worth reporting;
     with a bridge in play its failure came first and explains more. */
  if (lsSet(key, value)) return true;

  const e = bridgeError || lastLocalError;
  if (storageErrorHandler) {
    storageErrorHandler(
      isQuotaError(e)
        ? "Storage is full, so that change was not saved. ICP report photos use the most space — remove a few, then try again. Save a backup file first if you need one."
        : "That change could not be saved (" + (e && e.message ? e.message : "unknown error") + ")."
    );
  }
  return false;
}

/* Once per load, before anything reads. Cheap on a drained device: one pass
   over the localStorage key list, finding nothing. */
drainLegacyStore();
