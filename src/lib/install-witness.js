/* ---------------------------------- wipe detection ----------------------------------
 *
 * The app could not tell a cleared browser from a fresh install. Both
 * localStorage prefixes live in the same store, so a clear takes all of it at
 * once, and on the next open every `loadKey` returns its fallback — which reads
 * to `App.jsx` exactly like a device that has never run the app. It then seeds
 * 25 weekly water changes and a lighting note into a history that holds nothing
 * else, and says nothing about any of it.
 *
 * There are two ways to notice, and this module does both, because neither is
 * sufficient on its own.
 *
 * ONE — a witness. An install id, when it was first seen, and the most this
 * device ever held of each counted key. It lives in IndexedDB, so it survives a
 * clear that takes only localStorage: an eviction of the 5 MB text store, a
 * site-data control that treats the two separately, or the app's own storage
 * being cleared by something else.
 *
 * TWO — the shape of a wipe. A device that had data and now has none. Photos in
 * the photo store with no ICP panels left to hang them on cannot happen on a
 * device that has never run the app, and `navigator.storage.estimate()` can
 * report bytes the app knows nothing about.
 *
 * WHAT NEITHER OF THEM DOES is survive a full clear. Safari's seven-day rule
 * and every "clear site data" control take IndexedDB along with everything
 * else, and no local marker survives that — not a cookie (capped at seven days
 * on the platform that matters), not the cache storage, not anything. On a full
 * clear this module returns `fresh` or `suspect` and the app says nothing it
 * cannot support. That is the honest limit and it is not papered over.
 *
 * What the caller does with a verdict is the point of the whole thing: on
 * anything but a clean device, DO NOT SEED. A missing water-change list can be
 * restored or retyped; 25 fabricated maintenance events feeding the nutrient
 * maths cannot be told apart from real ones afterwards. `seed-data.js` settled
 * that principle for readings already.
 */
import { uid } from './constants.js';
import { WITNESS_STORE, onDbClosed, run } from './idb.js';
import { photoIds } from './photo-store.js';

/* The keys whose length is worth remembering. Every one of them is a list of
   things that happened, so a count is a meaningful high-water mark; settings
   and markers are not counted because their size says nothing. */
export const COUNTED_KEYS = [
  "readings", "icp-tests", "water-changes", "dose-log", "task-log", "lighting-log",
];

/* The markers that prove this install has run before. Their absence is what
   distinguishes "localStorage was cleared" from "the user deleted their own
   entries" — the second keeps every marker. */
export const RUN_BEFORE_MARKERS = [
  "historical-seeded", "icp-seeded", "wc-seeded", "light-seeded", "strengths-fixed-v1",
];

const WITNESS_KEY = "install";

/* `navigator.storage.estimate()` reports the whole origin — the built bundle
   and the service worker's precache included, about 1.1 MB of it (`du -sh
   dist`). The floor is seven times that, so it can only be crossed by stored
   data, and it is deliberately generous: a false "suspect" costs a new user
   their seeded water-change list, which they can restore or retype, while a
   false "fresh" costs a wiped user 25 invented maintenance events they cannot
   later tell from their own. */
const SUSPECT_FLOOR_BYTES = 8 * 1024 * 1024;

/* Read once per connection. A save consults the witness to decide whether the
   high-water mark moved, and going to the database for that on every write
   would put an IndexedDB round trip in front of every list the app stores. */
let cached;
onDbClosed(() => { cached = undefined; });

export async function readWitness() {
  if (cached !== undefined) return cached;
  const res = await run(WITNESS_STORE, "readonly", (s) => s.get(WITNESS_KEY));
  cached = res.ok && res.value && typeof res.value === "object" ? res.value : null;
  return cached;
}

async function writeWitness(next) {
  const res = await run(WITNESS_STORE, "readwrite", (s) => s.put(next, WITNESS_KEY));
  /* Only remembered if it was actually stored. A witness that exists in memory
     but not in the database would claim, after the next reload, to have been
     watching a device it never wrote a word about. */
  if (res.ok) cached = next;
  return res.ok;
}

function blank() {
  return { installId: uid(), firstSeen: new Date().toISOString(), high: {}, wipedAt: null };
}

/* The most this device has ever held, per key. It never falls on its own: a
   user deleting a reading is not evidence of anything, and a mark that tracked
   the current count downwards would read zero at exactly the moment a wipe
   needs it to read 412. */
export async function noteCount(key, count) {
  if (!COUNTED_KEYS.includes(key) || !(count > 0)) return false;
  const witness = (await readWitness()) || blank();
  if ((witness.high[key] || 0) >= count) return false;
  return writeWitness({ ...witness, high: { ...witness.high, [key]: count } });
}

async function suspectByUsage() {
  try {
    if (!navigator.storage || !navigator.storage.estimate) return false;
    const { usage } = await navigator.storage.estimate();
    return typeof usage === "number" && usage > SUSPECT_FLOOR_BYTES;
  } catch {
    return false;
  }
}

const verdict = (state, had, since) => ({
  state,
  /* What the device is known to have held, for the notice to name. Empty for
     every state but `wiped`. */
  had,
  hadTotal: Object.values(had).reduce((a, b) => a + b, 0),
  /* The one thing the caller must act on. Seeding into a history the app cannot
     account for is the defect this module exists to stop. */
  maySeed: state === "fresh" || state === "known",
  since,
});

/* `counts` — what each counted key holds right now. `markers` — the run-before
   markers as loaded. Both come from the startup load, so this makes no reads of
   its own beyond IndexedDB. */
export async function assessInstall(counts, markers) {
  const anyData = COUNTED_KEYS.some((k) => (counts[k] || 0) > 0);
  const anyMarker = RUN_BEFORE_MARKERS.some((k) => !!markers[k]);
  const witness = await readWitness();

  if (anyData) {
    /* A device with data on it is not wiped, whatever it was before — a restore
       or a fresh start both land here, and both mean the notice has done its
       job and should stop. */
    for (const key of COUNTED_KEYS) await noteCount(key, counts[key] || 0);
    if (witness && witness.wipedAt) await writeWitness({ ...witness, wipedAt: null });
    return verdict("known", {}, witness ? witness.firstSeen : null);
  }

  /* A wipe already found and recorded. Said again on every load until there is
     something on the device to say it about — the user may not have had a
     backup file to hand the first time. */
  if (witness && witness.wipedAt) {
    return verdict("wiped", witness.had || {}, witness.firstSeen);
  }

  if (!anyMarker) {
    const had = {};
    if (witness) {
      for (const [k, n] of Object.entries(witness.high || {})) if (n > 0) had[k] = n;
    }
    if (Object.keys(had).length > 0) {
      await writeWitness({ ...witness, wipedAt: new Date().toISOString(), had });
      return verdict("wiped", had, witness.firstSeen);
    }

    /* No witness either — this clear took IndexedDB as well. A photo with no
       panel to hang it on is the one trace that cannot be explained any other
       way, since only this app writes to that store. */
    const orphans = await photoIds();
    if (orphans.length > 0) {
      const fromPhotos = { "icp-tests": orphans.length };
      const next = { ...blank(), wipedAt: new Date().toISOString(), had: fromPhotos };
      await writeWitness(next);
      return verdict("wiped", fromPhotos, next.firstSeen);
    }

    if (await suspectByUsage()) return verdict("suspect", {}, null);

    /* Nothing anywhere. Indistinguishable from a new device, and treated as
       one — which is the only case where seeding is allowed. */
    if (!witness) await writeWitness(blank());
    return verdict("fresh", {}, witness ? witness.firstSeen : null);
  }

  /* Markers present, no entries: this install has run before and the user has
     emptied it themselves. Nothing was lost and nothing is claimed. */
  if (!witness) await writeWitness(blank());
  return verdict("known", {}, witness ? witness.firstSeen : null);
}
