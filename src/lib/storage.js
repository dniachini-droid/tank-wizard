import { KV_STORE, run } from './idb.js';
import { noteCount } from './install-witness.js';
import {
  PHOTO_KEY, announceFallbackOnce, attachPhotos, collectOrphans, detachPhotos,
  needsMigration, photosAreInline,
} from './photo-store.js';

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

function readKey(key, fallback) {
  try {
    if (window.storage && window.storage.get) {
      /* The bridge is synchronous only in shape; the caller awaits this. */
      return window.storage.get(key, false).then((res) => {
        /* The parse is inside the fallback, not outside it: a bridge that
           hands back something unparseable must land on the local chain the
           same way one that throws does, rather than rejecting the load. */
        try {
          if (res && res.value) return JSON.parse(res.value);
        } catch { /* fall through to the local chain */ }
        return readStored(key, fallback);
      }, () => readStored(key, fallback));
    }
  } catch (e) { /* fall through to the local chain */ }
  return readStored(key, fallback);
}

/* Values are kept as JSON strings rather than structured clones, so what
   IndexedDB holds is byte-for-byte what localStorage held — the migration is
   checkable by comparing strings, and the parse behaves identically on both
   sides of the move. */
async function kvGet(key) {
  const res = await run(KV_STORE, "readonly", (s) => s.get(key));
  if (!res.ok || typeof res.value !== "string") return { found: false, value: undefined };
  try {
    return { found: true, value: JSON.parse(res.value) };
  } catch {
    /* A corrupt entry answers nothing; the localStorage chain may still hold
       a good copy from before the migration. */
    return { found: false, value: undefined };
  }
}

/* IndexedDB first, then localStorage. A key found only in localStorage has
   not been moved yet — an install from before the change, or one where an
   earlier attempt had nowhere to write. Moving it is exactly what saving it
   does, so that is what happens, through the one write path — and it inherits
   the same guarantee as the photo move: a key that cannot be written stays
   where it already works, and a later load retries. */
async function readStored(key, fallback) {
  const kv = await kvGet(key);
  if (kv.found) return kv.value;

  const local = readLocal(key);
  if (local !== undefined) {
    await saveKey(key, local);
    return local;
  }
  return fallback;
}

function readLocal(key) {
  /* A key the drain could not finish still lives under the legacy prefix, and
     that copy is the newer of the two. Empty on every device the drain
     completed on, which is all of them but one that was out of space at load.
     The migration above must take this answer — the drain-aware one — or the
     stale mirror it exists to shadow would be the copy that gets moved, and
     the loss TW-032 was filed to stop would become permanent. */
  if (undrained.has(key)) {
    try {
      const raw = window.localStorage.getItem(LEGACY_PREFIX + key);
      if (raw != null) return JSON.parse(raw);
    } catch { /* fall through to the mirror */ }
  }
  return lsGet(key);
}

export async function loadKey(key, fallback) {
  const value = await readKey(key, fallback);

  /* ICP report photos are the one thing not kept in localStorage — see
     src/lib/photo-store.js for why, and for the shape on each side. From here
     out the row looks exactly as it always did, with the photo inline on it,
     which is what lets every caller of this function stay unchanged. */
  if (key !== PHOTO_KEY || !Array.isArray(value)) return value;

  const attached = await attachPhotos(value);
  if (attached.missing > 0) {
    /* A row that claims a photo the database does not have. Rendering the
       panel with a blank space where the picture was is the one outcome this
       whole phase exists to prevent, so it is said out loud. */
    report(`${attached.missing === 1 ? "A report photo" : `${attached.missing} report photos`} could not be read back` +
      (attached.reason ? ` (${attached.reason})` : "") +
      ". The panel's readings are unaffected. Restoring a backup file will bring the photo back.");
  }

  /* Photos still sitting inline in localStorage have not been moved yet: this
     is an install from before the change, or one where an earlier attempt had
     nowhere to write. Moving them is exactly what saving them does, so that is
     what happens — and it inherits the same guarantee, that a photo which
     cannot be written stays where it already works. A later load retries. */
  if (needsMigration(attached.rows)) await saveKey(PHOTO_KEY, attached.rows);

  return attached.rows;
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

function report(message) { if (storageErrorHandler) storageErrorHandler(message); }


export async function saveKey(key, value) {
  /* Photos out of the row and into IndexedDB before the row is serialised.
     Anything that cannot be moved stays inline and is written to localStorage
     exactly as it was before this existed. */
  if (key === PHOTO_KEY && Array.isArray(value)) {
    const detached = await detachPhotos(value);
    /* A fallback that works is not worth a red banner on every save, but it is
       worth one — the photos are going somewhere much smaller than they would
       otherwise, and that is the user's business. */
    if (detached.inline > 0 && announceFallbackOnce()) {
      report("Report photos are being kept in browser storage on this device" +
        (detached.reason ? ` (${detached.reason})` : "") +
        ", which holds far less than the photo store does. Your data is saved. " +
        "Keeping fewer photos, or saving a backup file, will keep it that way.");
    }
    if (detached.moved > 0 || detached.inline === 0) await collectOrphans(detached.rows);
    value = detached.rows;
  }

  /* How much this device has ever held, recorded as it is written rather than
     only at startup — a session that adds 40 readings and is wiped before the
     next launch should still be able to say so. Kept in IndexedDB, so it
     survives a clear that takes only localStorage; it can never make a save
     fail, and a device with no IndexedDB simply records nothing. */
  const witnessed = Array.isArray(value) ? noteCount(key, value.length) : null;

  let bridgeError = null;
  try {
    if (window.storage && window.storage.set) {
      await window.storage.set(key, JSON.stringify(value), false);
      /* Mirror to local storage as well, so a later bridge failure can still
         read back what was written. */
      lsSet(key, value);
      await witnessed;
      return true;
    }
  } catch (e) {
    bridgeError = e;
    console.error("storage bridge save failed", key, e);
  }

  /* IndexedDB is where a value lives now. On a confirmed write both
     localStorage prefixes are cleared for the key — removals cannot fail for
     want of room — which is what stops the next load's drain resurrecting a
     legacy copy into a store the app no longer treats as authoritative, and
     incidentally hands the drain the space it may have been short of. Nothing
     is removed until the replacement is known to be in place. */
  const kv = await run(KV_STORE, "readwrite", (s) => s.put(JSON.stringify(value), key));
  if (kv.ok) {
    try { window.localStorage.removeItem(LS_PREFIX + key); } catch { /* stale copy stays; the next save retries */ }
    try { window.localStorage.removeItem(LEGACY_PREFIX + key); } catch { /* same */ }
    undrained.delete(key);
    await witnessed;
    return true;
  }

  /* IndexedDB unavailable or refusing — localStorage still works, and a value
     kept where it works beats one lost to a better store. Worth saying once,
     through the same once-per-connection gate the photo fallback uses: both
     messages describe the same degraded device, and whichever save trips it
     first says so — one banner, not one per concern. */
  if (announceFallbackOnce() && storageErrorHandler) {
    storageErrorHandler(
      "This device is keeping your data in the smaller browser storage" +
      (kv.reason ? ` (${kv.reason})` : "") +
      ". Your data is saved. Saving a backup file now and then will keep it that way."
    );
  }

  /* In the shipped PWA this is now the fallback path; the local failure is
     the one worth reporting, since with a bridge in play its failure came
     first and explains more. */
  if (lsSet(key, value)) { await witnessed; return true; }

  const e = bridgeError || lastLocalError;
  if (storageErrorHandler) {
    storageErrorHandler(
      /* What to delete depends on where the photos ended up. Naming them is
         only useful advice while they are still in this store; once they are
         in the photo database, telling someone to remove a few would send
         them after space that was never the problem. */
      isQuotaError(e)
        ? "Storage is full, so that change was not saved. " + (photosAreInline()
            ? "ICP report photos use the most space on this device — remove a few, then try again."
            : "Removing some older entries will make room.") +
          " Save a backup file first if you need one."
        : "That change could not be saved (" + (e && e.message ? e.message : "unknown error") + ")."
    );
  }
  return false;
}

/* Once per load, before anything reads. Cheap on a drained device: one pass
   over the localStorage key list, finding nothing. */
drainLegacyStore();
