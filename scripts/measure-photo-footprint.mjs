#!/usr/bin/env node
/* Measures where ICP report photos actually live and what they cost.
 *
 * Run before and after the IndexedDB move to compare like with like. It drives
 * the real `saveKey`/`loadKey` — not a model of them — against a stubbed
 * localStorage and a real IndexedDB implementation, and reports the character
 * count of every stored key.
 *
 * The photo payload is synthetic, but its *size* is not invented: it is the
 * ceiling `compressImage` permits (maxBytes = 220000 bytes of JPEG, which
 * base64 expands by 4/3), so it is the largest row the app can actually
 * produce. base64 expansion does not depend on the bytes being a real JPEG.
 *
 *   node scripts/measure-photo-footprint.mjs [panelCount]
 */
import 'fake-indexeddb/auto';

const PANELS = parseInt(process.argv[2] || '12', 10);
const JPEG_BUDGET_BYTES = 220000;              // src/lib/image-compression.js:5

const store = new Map();
const localStorage = {
  get length() { return store.size; },
  key: (i) => [...store.keys()][i] ?? null,
  getItem: (k) => (store.has(k) ? store.get(k) : null),
  setItem: (k, v) => { store.set(k, String(v)); },
  removeItem: (k) => { store.delete(k); },
  clear: () => store.clear(),
};
globalThis.window = { localStorage, indexedDB: globalThis.indexedDB };
globalThis.localStorage = localStorage;

const photo = () => 'data:image/jpeg;base64,' +
  Buffer.from(Buffer.alloc(JPEG_BUDGET_BYTES, 0).map((_, i) => (i * 37) % 251)).toString('base64');

const rows = Array.from({ length: PANELS }, (_, i) => ({
  id: `icp${i}`,
  date: `2026-${String((i % 12) + 1).padStart(2, '0')}-01`,
  note: 'Quarterly panel',
  elements: { calcium: 420, magnesium: 1350, alkalinity: 8.2, nitrate: 4.1, phosphate: 0.04 },
  image: photo(),
}));

const { saveKey, loadKey } = await import('../src/lib/storage.js');

const one = rows[0].image.length;
console.log(`photo payload: ${one.toLocaleString()} chars each (${JPEG_BUDGET_BYTES.toLocaleString()} bytes of JPEG, base64)`);
console.log(`panels:        ${PANELS}\n`);

await saveKey('icp-tests', rows);
await saveKey('readings', Array.from({ length: 400 }, (_, i) => (
  { id: `r${i}`, param: 'alkalinity', value: 8.2, date: '2026-08-14', note: '' })));

let lsTotal = 0;
console.log('localStorage:');
for (const [k, v] of [...store].sort()) {
  console.log(`  ${k.padEnd(26)} ${v.length.toLocaleString().padStart(10)} chars`);
  lsTotal += k.length + v.length;
}
console.log(`  ${'TOTAL'.padEnd(26)} ${lsTotal.toLocaleString().padStart(10)} chars`);

/* Whatever is in IndexedDB, counted the same way. Zero before the move. */
const idbTotal = await new Promise((resolve) => {
  const req = globalThis.indexedDB.open('tank-wizard', 1);
  req.onerror = () => resolve(0);
  req.onupgradeneeded = () => { try { req.result.createObjectStore('icp-photos'); } catch { /* exists */ } };
  req.onsuccess = () => {
    const db = req.result;
    if (!db.objectStoreNames.contains('icp-photos')) { db.close(); return resolve(0); }
    const all = db.transaction('icp-photos', 'readonly').objectStore('icp-photos').getAll();
    all.onerror = () => { db.close(); resolve(0); };
    all.onsuccess = () => {
      db.close();
      resolve(all.result.reduce((a, v) => a + (typeof v === 'string' ? v.length : 0), 0));
    };
  };
});

console.log(`\nIndexedDB:      ${idbTotal.toLocaleString()} chars`);
console.log(`\nlocalStorage quota is ~5,000,000 chars in every engine that ships one.`);
console.log(`localStorage used: ${((lsTotal / 5e6) * 100).toFixed(1)}% of a 5M quota`);

/* The round trip has to survive the move, or the saving is not a saving. */
const back = await loadKey('icp-tests', []);
const intact = back.length === rows.length && back.every((r, i) => r.image === rows[i].image);
console.log(`\nphotos read back intact: ${intact ? 'yes' : 'NO'} (${back.length}/${rows.length} panels)`);
