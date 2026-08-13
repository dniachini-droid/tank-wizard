// ---- Storage shim ----
// Inside Claude, window.storage already exists. Standalone, fall back to
// localStorage so logs still persist between visits on this device.
if (!window.storage) {
  const P = "reefconsole:";
  window.storage = {
    async get(key) {
      const v = localStorage.getItem(P + key);
      if (v === null) throw new Error("key not found: " + key);
      return { key, value: v, shared: false };
    },
    async set(key, value) {
      localStorage.setItem(P + key, value);
      return { key, value, shared: false };
    },
    async delete(key) {
      localStorage.removeItem(P + key);
      return { key, deleted: true, shared: false };
    },
    async list(prefix = "") {
      const keys = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith(P + prefix)) keys.push(k.slice(P.length));
      }
      return { keys, prefix, shared: false };
    },
  };
}

/* ---------------------------------- storage helpers ---------------------------------- */

/* Two storage backends, tried in order. The host bridge is preferred where it
   exists, but it can fail in ways localStorage doesn't — a bridge that returns
   an unexpected response would otherwise lose a change with only a red banner
   to show for it. Falling through means the data still lands somewhere. */
export const LS_PREFIX = "danstank:";

export function lsGet(key) {
  try {
    const raw = window.localStorage.getItem(LS_PREFIX + key);
    return raw == null ? undefined : JSON.parse(raw);
  } catch { return undefined; }
}
export function lsSet(key, value) {
  try { window.localStorage.setItem(LS_PREFIX + key, JSON.stringify(value)); return true; }
  catch { return false; }
}

export async function loadKey(key, fallback) {
  try {
    if (window.storage && window.storage.get) {
      const res = await window.storage.get(key, false);
      if (res && res.value) return JSON.parse(res.value);
    }
  } catch (e) { /* fall through to local storage */ }
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

  /* Bridge unavailable or failed — write locally instead. */
  if (lsSet(key, value)) return true;

  const e = bridgeError;
  if (storageErrorHandler) {
    storageErrorHandler(
      isQuotaError(e)
        ? "Storage is full, so that change was not saved. ICP report photos use the most space — remove a few, then try again. Save a backup file first if you need one."
        : "That change could not be saved (" + (e && e.message ? e.message : "unknown error") + ")."
    );
  }
  return false;
}
