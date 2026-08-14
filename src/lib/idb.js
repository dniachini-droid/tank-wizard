/* ---------------------------------- the database ----------------------------------
 *
 * One database, one connection, one version constant, shared by every store the
 * app keeps in IndexedDB. This module was extracted from `photo-store.js`
 * unchanged in behaviour, because a second module opening `tank-wizard` at its
 * own version is a trap with a large blast radius: `indexedDB.open(name, 1)`
 * against a database that some other module has already upgraded to version 2
 * fails with a `VersionError`, the photo store degrades, and report photos fall
 * back to inline localStorage permanently — a quota regression caused by a
 * change that never touched photos.
 *
 * So: adding a store means adding its name to STORES and bumping DB_VERSION
 * once, here. `onupgradeneeded` creates only what is missing, so an existing
 * database keeps every store and every value it already had.
 *
 * Version history:
 *   1  icp-photos       (c7ed9d0)
 *   2  install-witness  — what this device held, so a wipe is detectable
 */

export const DB_NAME = "tank-wizard";
export const DB_VERSION = 2;
export const PHOTO_STORE = "icp-photos";
export const WITNESS_STORE = "install-witness";
const STORES = [PHOTO_STORE, WITNESS_STORE];

/* An open that neither succeeds nor fails is a real state, not a hypothetical:
   `onblocked` fires when another tab holds an older version of the database
   open, and until that tab goes away nothing else happens. Waiting forever
   would hang the load, so the open is raced against a clock and every caller
   falls back to whatever still works without it. */
const OPEN_TIMEOUT_MS = 4000;

let dbPromise = null;
let lastReason = null;

/* Why a connection is dropped rather than repaired: it is memoised, so a
   connection that has turned out to be unusable would otherwise be handed to
   every later caller. Callers with their own per-connection state register a
   listener so they can forget it at the same moment. */
const onCloseListeners = new Set();
export function onDbClosed(fn) { onCloseListeners.add(fn); }

export function closeDb() {
  const pending = dbPromise;
  dbPromise = null;
  lastReason = null;
  for (const fn of onCloseListeners) fn();
  if (pending) pending.then((db) => { try { if (db) db.close(); } catch { /* already gone */ } }, () => {});
}

function openDb() {
  return new Promise((resolve) => {
    let idb;
    try { idb = window.indexedDB; } catch { idb = null; }
    if (!idb || typeof idb.open !== "function") {
      lastReason = "this browser has no IndexedDB";
      return resolve(null);
    }

    let settled = false;
    const done = (db, reason) => {
      if (settled) return;
      settled = true;
      if (reason) lastReason = reason;
      resolve(db);
    };
    const timer = setTimeout(() => done(null, "opening the database timed out"), OPEN_TIMEOUT_MS);
    const finish = (db, reason) => { clearTimeout(timer); done(db, reason); };

    let req;
    try {
      req = idb.open(DB_NAME, DB_VERSION);
    } catch (e) {
      /* Safari in a private window has historically thrown here rather than
         reporting an error on the request. */
      return finish(null, e && e.message ? e.message : "the database could not be opened");
    }
    if (!req || typeof req !== "object") return finish(null, "the database could not be opened");

    req.onupgradeneeded = () => {
      try {
        const db = req.result;
        for (const name of STORES) {
          if (!db.objectStoreNames.contains(name)) db.createObjectStore(name);
        }
      } catch { /* reported by the failure that follows */ }
    };
    req.onerror = () => finish(null, (req.error && req.error.message) || "the database could not be opened");
    req.onblocked = () => finish(null, "another tab is holding the database open");
    req.onsuccess = () => {
      const db = req.result;
      if (!db || !db.objectStoreNames) return finish(null, "the database is missing its stores");
      /* A connection that dies later — the database is deleted, or a newer
         version wants in — must not be handed out again. Both go through the
         same teardown as an explicit close, so there is one way to forget a
         connection rather than three that have to agree. */
      db.onclose = closeDb;
      db.onversionchange = closeDb;
      finish(db, null);
    };
  });
}

function db() {
  if (!dbPromise) dbPromise = openDb();
  return dbPromise;
}

/* One transaction, one result. Every caller is a single operation, so there is
   nothing to gain from sharing transactions and a deadlock to avoid by not
   trying. `ok: false` always carries a `reason` a human could act on. */
export function run(store, mode, fn) {
  return db().then((conn) => {
    if (!conn) return { ok: false, value: undefined, reason: lastReason };
    if (!conn.objectStoreNames.contains(store)) {
      return { ok: false, value: undefined, reason: "the database is missing its stores" };
    }
    return new Promise((resolve) => {
      let tx;
      try {
        tx = conn.transaction(store, mode);
      } catch (e) {
        dbPromise = null;
        return resolve({ ok: false, value: undefined, reason: (e && e.message) || "the database is not usable" });
      }
      let req;
      try {
        req = fn(tx.objectStore(store));
      } catch (e) {
        return resolve({ ok: false, value: undefined, reason: (e && e.message) || "that could not be stored" });
      }
      /* The request's own error is the useful one; the transaction's abort is
         the backstop for a quota refusal, which surfaces there instead. */
      req.onsuccess = () => resolve({ ok: true, value: req.result, reason: null });
      req.onerror = () => resolve({ ok: false, value: undefined, reason: (req.error && req.error.message) || "that could not be stored" });
      tx.onabort = () => resolve({ ok: false, value: undefined, reason: (tx.error && tx.error.message) || "there was no room for that" });
    });
  }, (e) => ({ ok: false, value: undefined, reason: (e && e.message) || "the database is not usable" }));
}
