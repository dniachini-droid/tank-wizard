/* ---------------------------------- ICP report photos ----------------------------------
 *
 * Photos live in IndexedDB. Everything else the app stores lives in
 * localStorage, and stays there.
 *
 * The reason is size and nothing else. `compressImage` caps a report photo at
 * 220,000 bytes of JPEG, which base64 expands to 293,359 characters — measured
 * by scripts/measure-photo-footprint.mjs, not estimated. Written inline on an
 * `icp-tests` row, twelve panels take 3.5 M characters of a localStorage quota
 * that is about 5 M in every engine that ships one, and they take it from the
 * same pool the readings, the dose log and the settings are drawing on.
 * IndexedDB is not subject to that quota, stores by key rather than as one
 * serialised blob, and is the only local store a browser will let grow.
 *
 * The split happens underneath `loadKey`/`saveKey`, which is the whole design:
 * a row has an inline `image` everywhere outside src/lib/storage.js, exactly as
 * it always did. The app renders `t.image`, `buildBackup` writes it into the
 * file, `restoreBackup` merges it back, and none of them know or care that the
 * bytes took a different road. Backup files therefore keep their existing
 * format, and a file written before this change restores into one written
 * after it without a migration of any kind.
 *
 * What is stored where:
 *
 *   localStorage  danstank:icp-tests   [{ id, date, note, elements, photoInIdb }]
 *   IndexedDB     icp-photos[id]       "data:image/jpeg;base64,…"
 *
 * `photoInIdb` is a hint, not a record. Nothing trusts it to decide whether a
 * photo is really there — `detachPhotos` checks the database itself — because a
 * row carrying that flag can arrive from a backup file written on another
 * device, where it means nothing at all.
 *
 * Every failure here degrades to the old behaviour: the photo stays inline in
 * localStorage, where it already worked. None of them degrade to a lost photo,
 * and none of them are silent — `reason` comes back to storage.js, which tells
 * the user. */

export const DB_NAME = "tank-wizard";
export const DB_VERSION = 1;
export const PHOTO_STORE = "icp-photos";

/* The one key whose rows carry photos, and the fields involved. */
export const PHOTO_KEY = "icp-tests";
export const PHOTO_FIELD = "image";
export const PHOTO_MARKER = "photoInIdb";

/* An open that neither succeeds nor fails is a real state, not a hypothetical:
   `onblocked` fires when another tab holds an older version of the database
   open, and until that tab goes away nothing else happens. Waiting forever
   would hang the load, so the open is raced against a clock and the app falls
   back to inline photos, which still work. */
const OPEN_TIMEOUT_MS = 4000;

let dbPromise = null;
let lastReason = null;
let fallbackAnnounced = false;

/* Dropping the memoised handle. Called when a connection turns out to be
   unusable, and by tests between databases. */
export function closePhotoStore() {
  const pending = dbPromise;
  dbPromise = null;
  lastReason = null;
  fallbackAnnounced = false;
  photosInline = false;
  if (pending) pending.then((db) => { try { if (db) db.close(); } catch { /* already gone */ } }, () => {});
}

/* True the first time this store falls back to inline photos, false after.
   The flag belongs to the connection's lifetime rather than to storage.js,
   because "have we already had to fall back" is a fact about this database —
   and a store that is closed and reopened deserves to be asked again. */
export function announceFallbackOnce() {
  if (fallbackAnnounced) return false;
  fallbackAnnounced = true;
  return true;
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
    const timer = setTimeout(() => done(null, "opening the photo database timed out"), OPEN_TIMEOUT_MS);
    const finish = (db, reason) => { clearTimeout(timer); done(db, reason); };

    let req;
    try {
      req = idb.open(DB_NAME, DB_VERSION);
    } catch (e) {
      /* Safari in a private window has historically thrown here rather than
         reporting an error on the request. */
      return finish(null, e && e.message ? e.message : "the photo database could not be opened");
    }
    if (!req || typeof req !== "object") return finish(null, "the photo database could not be opened");

    req.onupgradeneeded = () => {
      try {
        const db = req.result;
        if (!db.objectStoreNames.contains(PHOTO_STORE)) db.createObjectStore(PHOTO_STORE);
      } catch { /* reported by the failure that follows */ }
    };
    req.onerror = () => finish(null, (req.error && req.error.message) || "the photo database could not be opened");
    req.onblocked = () => finish(null, "another tab is holding the photo database open");
    req.onsuccess = () => {
      const db = req.result;
      if (!db || !db.objectStoreNames || !db.objectStoreNames.contains(PHOTO_STORE)) {
        return finish(null, "the photo database is missing its store");
      }
      /* A connection that dies later — the database is deleted, or a newer
         version wants in — must not be handed out again. Both go through the
         same teardown as an explicit close, so there is one way to forget a
         connection rather than three that have to agree. */
      db.onclose = closePhotoStore;
      db.onversionchange = closePhotoStore;
      finish(db, null);
    };
  });
}

function db() {
  if (!dbPromise) dbPromise = openDb();
  return dbPromise;
}

/* One transaction, one result. Every caller below is a single operation, so
   there is nothing to gain from sharing transactions and a deadlock to avoid
   by not trying. */
function run(mode, fn) {
  return db().then((conn) => {
    if (!conn) return { ok: false, value: undefined, reason: lastReason };
    return new Promise((resolve) => {
      let tx;
      try {
        tx = conn.transaction(PHOTO_STORE, mode);
      } catch (e) {
        dbPromise = null;
        return resolve({ ok: false, value: undefined, reason: (e && e.message) || "the photo database is not usable" });
      }
      let req;
      try {
        req = fn(tx.objectStore(PHOTO_STORE));
      } catch (e) {
        return resolve({ ok: false, value: undefined, reason: (e && e.message) || "that photo could not be stored" });
      }
      /* The request's own error is the useful one; the transaction's abort is
         the backstop for a quota refusal, which surfaces there instead. */
      req.onsuccess = () => resolve({ ok: true, value: req.result, reason: null });
      req.onerror = () => resolve({ ok: false, value: undefined, reason: (req.error && req.error.message) || "that photo could not be stored" });
      tx.onabort = () => resolve({ ok: false, value: undefined, reason: (tx.error && tx.error.message) || "there was no room for that photo" });
    });
  }, (e) => ({ ok: false, value: undefined, reason: (e && e.message) || "the photo database is not usable" }));
}

export async function photoIds() {
  const res = await run("readonly", (s) => s.getAllKeys());
  return res.ok && Array.isArray(res.value) ? res.value.map(String) : [];
}

/* Existence is checked with `count`, which does not deserialise the 293 KB
   value the way a `get` would. Worth the extra round trip: a save of the panel
   list happens every time a panel is added or deleted, and reading every photo
   back on each one would undo much of what this move buys. */
async function hasPhoto(id) {
  const res = await run("readonly", (s) => s.count(id));
  return res.ok && res.value > 0;
}

export async function getPhoto(id) {
  const res = await run("readonly", (s) => s.get(id));
  if (!res.ok) return { ok: false, value: undefined, reason: res.reason };
  return { ok: true, value: typeof res.value === "string" ? res.value : undefined, reason: null };
}

export async function putPhoto(id, dataUrl) {
  return run("readwrite", (s) => s.put(dataUrl, id));
}

export async function deletePhoto(id) {
  return run("readwrite", (s) => s.delete(id));
}

/* --------------------------------- the split --------------------------------- */

/* Rows on their way to localStorage: photo out, marker in. A photo that cannot
   be written stays on the row and goes to localStorage inline, which is where
   it was already going before any of this existed. */
export async function detachPhotos(rows) {
  const out = [];
  let moved = 0, inline = 0, reason = null;

  for (const row of rows) {
    if (!row || typeof row !== "object") { out.push(row); continue; }
    const photo = row[PHOTO_FIELD];
    if (typeof photo !== "string" || !photo) {
      /* No photo. Any stale marker goes too, so the row cannot claim one. */
      const { [PHOTO_MARKER]: _drop, ...rest } = row;
      out.push(rest);
      continue;
    }

    /* The marker is not trusted — see the note at the top. A row can carry it
       in from another device's backup file, where this database has never
       heard of the id. */
    const already = await hasPhoto(row.id);
    let stored = already;
    if (!already) {
      const res = await putPhoto(row.id, photo);
      stored = res.ok;
      if (!res.ok && !reason) reason = res.reason;
    }

    if (stored) {
      const { [PHOTO_FIELD]: _photo, ...rest } = row;
      out.push({ ...rest, [PHOTO_MARKER]: true });
      moved++;
    } else {
      const { [PHOTO_MARKER]: _drop, ...rest } = row;
      out.push(rest);
      inline++;
    }
  }

  photosInline = inline > 0;
  return { rows: out, moved, inline, reason };
}

/* Whether report photos are, on this device, still taking up localStorage.
   False wherever the move worked, which changes what a full-storage message
   can honestly tell someone to delete. */
let photosInline = false;
export function photosAreInline() { return photosInline; }

/* Photos whose panel is gone. Without this, deleting a panel would leave its
   photo behind forever and the move would trade a quota problem for a leak. */
export async function collectOrphans(rows) {
  const keep = new Set(rows.filter((r) => r && typeof r === "object").map((r) => String(r.id)));
  const ids = await photoIds();
  let removed = 0;
  for (const id of ids) {
    if (keep.has(id)) continue;
    const res = await deletePhoto(id);
    if (res.ok) removed++;
  }
  return removed;
}

/* Rows on their way back to the app: photo in, exactly where it used to be.
   `missing` counts rows that claim a photo the database does not have — a
   real, visible loss, so storage.js says so rather than rendering a panel that
   quietly has no picture. */
export async function attachPhotos(rows) {
  const out = [];
  let missing = 0, reason = null;

  for (const row of rows) {
    if (!row || typeof row !== "object" || !row[PHOTO_MARKER]) { out.push(row); continue; }
    const res = await getPhoto(row.id);
    if (res.ok && res.value) {
      out.push({ ...row, [PHOTO_FIELD]: res.value });
    } else {
      out.push(row);
      missing++;
      if (!reason) reason = res.reason;
    }
  }

  return { rows: out, missing, reason };
}

/* Rows read out of localStorage with a photo still sitting on them have not
   been moved yet. Distinguished from a row whose photo was just attached by
   the marker, which only `attachPhotos` sets. */
export function needsMigration(rows) {
  return rows.some((r) => r && typeof r === "object" &&
    typeof r[PHOTO_FIELD] === "string" && r[PHOTO_FIELD] && !r[PHOTO_MARKER]);
}
