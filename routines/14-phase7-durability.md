# Routine 14 — Phase 7: Durability

Cloud routine, **Track B**. **Report only. No storage code is changed in this
pass.** Nothing in `src/` is edited by this routine. The output is this
document and the backlog items it names.

## Track boundary — read first

Track A is working in `src/lib/dosing/` and `src/lib/analytics/` **right now**.
This routine must not touch either directory, and must not touch any file that
imports from them for the purpose of changing them.

Reading those files to understand what depends on a storage key is fine and was
done. Editing them is not. Where this routine found a defect inside Track A's
territory it is written down here and left alone.

Files this routine read: `src/lib/storage.js`, `src/lib/backup.jsx`,
`src/App.jsx`, `src/components/Setup.jsx`, `src/components/IcpPanel.jsx`,
`src/lib/image-compression.js`, `src/lib/constants.js`, `src/lib/seed-data.js`,
`vite.config.js`. Files this routine wrote: this one.

---

## Step 1 — `requestPersistence`: the finding

**The premise is half right, and the half that is wrong matters.**

`requestPersistence` is not dead code. It is called exactly once in the shipped
app, and `navigator.storage.persist()` is genuinely invoked. But it is called
from the one screen a user has no reason to open.

### Every call site

| Site | What it is |
|---|---|
| `src/lib/backup.jsx:183` | The definition. |
| `src/components/Setup.jsx:37` | **The only real call.** Inside a `useEffect(..., [])` on `Setup`'s mount. |
| `src/test-surface.js:137` | Re-export for the legacy-port adapter. Not a call. |
| `legacy/**` (5 files) | The monolith and four archived releases. Not shipped. |

`navigator.storage.persist()` appears at `src/lib/backup.jsx:188` and nowhere
else in `src/`. `navigator.storage.estimate()` is **never called anywhere** —
the app has no idea how much room it has left or how much it is using.

### Why the one call site is close to worthless

`Setup` is rendered conditionally:

```jsx
// src/App.jsx:1258
{tab === "setup" && (
  <Setup settings={settings} ... />
)}
```

The default tab is `"dashboard"` (`src/App.jsx:287`). `Setup` is not
pre-mounted, not lazily prefetched, not rendered hidden. Its mount effect —
and therefore the entire persistence request — runs **only when the user taps
Setup for the first time in that page load**.

So the durability guarantee the app has an implementation for is contingent on
the user visiting a configuration screen they may never need. Someone who
installs the app, logs readings for six months from the Dashboard and Test Lab,
and never opens Setup has never once asked the browser not to evict their data.
The seven-day Safari rule that `src/components/Setup.jsx:15-18` describes in
detail applies to them in full.

**Restating the finding accurately, because the difference changes the fix:**
the code was not forgotten, it was mis-sited. This is not "add a call", it is
"move a call" — from a component mount effect to app start.

### What the fix is worth, and its limits

Moving the call to app startup is the single highest-value change available in
this phase, and it is roughly four lines. It is also not a guarantee:

- **Chromium** grants persistence silently from engagement heuristics
  (bookmarked, installed to home screen, high site-engagement score). No
  prompt, so calling early is free and strictly better.
- **Safari / iOS** — Apple does not document `persist()` as overriding the
  seven-day eviction rule. Adding to the home screen is what is known to help.
  The existing comment at `src/lib/backup.jsx:180-182` states this honestly and
  should not be made more confident than the evidence supports.
- **Firefox** shows a permission prompt. Firing it at app start, before the
  user has done anything, is more likely to be dismissed than firing it in a
  context where storage is the subject. This is the one argument against a
  blind move to startup, and it is why the proposal below is "call at startup,
  keep the Setup copy as the explanatory surface" rather than "cut and paste".

### The UI consequence, which is worse than the missing call

`persistState` renders three strings (`src/components/Setup.jsx:521-529`), and
because the request only happens on the Setup tab, so does the only place the
app ever tells the user their data is at risk. The message "This browser
wouldn't guarantee your data against automatic eviction, which makes backups
more important" is exactly what a user needs to see, and it is behind a
collapsible block (`defaultOpen` only when the last backup is missing or older
than 14 days) on a tab they have no other reason to open.

**Nothing is changed for this in this pass.** It becomes backlog item TW-D1.

---

## Step 2 — What is actually stored

### 2.1 The two backends, and the double write

`src/lib/storage.js` installs a shim at module load when `window.storage` does
not exist (lines 4-29), writing to `localStorage` under the prefix
`reefconsole:`. Separately, `lsGet`/`lsSet` write under `danstank:` (line 37).

`saveKey` uses **both**:

```js
// src/lib/storage.js:79-96
if (window.storage && window.storage.set) {
  await window.storage.set(key, JSON.stringify(value), false);
  lsSet(key, value);          // mirror
  return true;
}
if (lsSet(key, value)) return true;
```

In the shipped PWA there is no host bridge — nothing in `index.html` or
`src/main.jsx` defines `window.storage` — so the shim is always installed, the
first branch always taken, and **every value is written to `localStorage`
twice, in full, under two different prefixes.**

Verified by executing `storage.js` against a stubbed `localStorage`:

```
saveKey('readings', [ …one reading… ])
  reefconsole:readings  -> 90 chars
  danstank:readings     -> 90 chars
  distinct keys: 2
```

The mirror is deliberate and the reasoning at lines 33-36 and 84-86 is sound —
a bridge that fails in an unexpected way should not lose the write. But when
the "bridge" *is* `localStorage`, the mirror buys nothing and costs exactly
100% of the footprint. **The app's effective quota is half of what the browser
gives it.**

Two secondary faults in the same block:

- `lsSet`'s return value is discarded on the bridge path. If the bridge write
  succeeds and the mirror fails, `saveKey` returns `true` and the two copies
  diverge silently. `loadKey` reads the bridge first, so today this is latent
  rather than live — but it is a lie in the return value.
- `loadKey` (line 50-59) treats a falsy `res.value` as "not found" and falls
  through to the mirror. A legitimately stored `""` or `0` would take the
  fallback path. No current key stores a bare falsy scalar, so this is also
  latent.

### 2.2 Every key

21 distinct keys. The 16 in `BACKUP_KEYS` (`src/lib/backup.jsx:30-34`) plus 5
that are not.

| Key | Holds | In backup? |
|---|---|---|
| `readings` | Every test result: `{id, param, value, date, time, note}` | yes |
| `icp-tests` | ICP panels: `{id, date, note, elements{…42}, image}` — **the photo lives here** | yes |
| `water-changes` | `{id, date, litres, note}` | yes |
| `dose-log` | `{id, date, time, ml, element, note}` | yes |
| `lighting-log` | `{id, date, note}` | yes |
| `task-log` | Completions: `{id, taskId, date, auto}` | yes |
| `tasks-custom` | User-defined tasks | yes |
| `reminders` | Schedules, intervals, pins | yes |
| `tank-settings` | Volume, doses, product strengths, kit sigma | yes |
| `custom-ranges` | User-edited target bands | yes |
| `kit-changes` | Test-kit replacement dates | yes |
| `findings-dismissed` | Dismissed insight keys | yes |
| `alk-plan` / `ca-plan` / `mg-plan` | In-flight dosing plans | yes |
| `corrections` | Logged one-off corrections | yes |
| **`correction-plans`** | **In-flight correction plans** (`src/App.jsx:540, 637, 651, 667`) | **NO** |
| `last-backup` | ISO timestamp of the last manual backup | no — correct, it is per-device |
| `historical-seeded` | First-run marker | no — correct |
| `icp-seeded` | First-run marker | no — correct |
| `wc-seeded` | First-run marker | no — correct |
| `light-seeded` | First-run marker | no — correct |

**`correction-plans` is a genuine gap.** It is loaded, saved in three places,
and fed into the derivation (`src/App.jsx:145, 624`). It is not in
`BACKUP_KEYS`, so it is neither written to a backup file nor restored from one.
A user who backs up mid-correction and restores onto a new phone loses the
plan while keeping the `corrections` history it belongs to — the two go out of
sync, and nothing says so.

The fix is one array entry in `src/lib/backup.jsx`, which is Track B territory
and not blocked by Track A. **It is still not made in this pass** — this is a
report. Backlog item TW-D2.

### 2.3 Size after one year

Measured record sizes (JSON, including the separating comma):

| Record | Bytes |
|---|---|
| reading | 104 |
| water change | ~65 |
| task-log entry | ~70 |
| dose change | ~90 |
| lighting note | ~60 + note |
| **ICP panel, no photo** | ~900 (42 elements) |
| **ICP panel with photo** | **up to ~294,000** |

The photo number is not a guess. `compressImage`
(`src/lib/image-compression.js:5`) shrinks until `out.length * 0.75 <= 220000`
where `out` is the data URL, so the stored **string** is up to ~293,333
characters. It is held inline in the `icp-tests` array as `image`
(`src/components/IcpPanel.jsx:62, 78`).

**The brief asks for a 2-day cadence.** The app's own `PARAM_DEFS`
(`src/lib/constants.js:25-36`) sets `freqDays` per parameter — alkalinity 2,
salinity 3, calcium/phosphate/nitrate 7, magnesium 21, potassium 30, ammonia
and pH unscheduled. Both readings are given, because they answer different
questions:

| Scenario | Readings/yr | Size/yr (one copy) |
|---|---|---|
| Alkalinity alone, every 2 days | 182 | 18.5 KB |
| **All params at app cadence** | **488** | **49.6 KB** |
| All 7 scheduled params every 2 days (upper bound) | 1,274 | 129.4 KB |

Full year at app cadence, everything included:

| Key | Volume | One copy | Doubled |
|---|---|---|---|
| `readings` | 488 | 50 KB | 100 KB |
| `task-log` | ~550 | 39 KB | 78 KB |
| `water-changes` | 52 weekly | 3.4 KB | 7 KB |
| `dose-log` | ~24 | 2 KB | 4 KB |
| `lighting-log` | ~12 | 1 KB | 2 KB |
| everything else | fixed | ~5 KB | 10 KB |
| **subtotal, no photos** | | **~100 KB** | **~200 KB** |
| `icp-tests`, 4/yr **with photos** | 4 | **1.18 MB** | **2.35 MB** |
| **total** | | **~1.28 MB** | **~2.55 MB** |

### 2.4 Is the 5 MB limit a real risk?

**From readings: no, not in any human timescale.** Text data doubles to ~200 KB
a year. Even at the 2-day-everything upper bound it is under 400 KB a year.
Twenty-five years of tank history would fit.

**From ICP photos: yes, and inside two years.** At four photographed panels a
year the app writes ~2.35 MB annually. The quota lands during **year two**.
Three ICPs a year still gets there in year three. The app has no ability to
prune, no per-photo delete that reclaims space visibly, and no quota meter —
`navigator.storage.estimate()` is never called, so the first sign of trouble is
the failure itself.

On the limit's exact size: 5 MB is the right planning figure but not a precise
one. Chromium and Firefox meter `localStorage` in UTF-16 code units against a
per-origin 5 MB budget; Safari applies its own per-origin cap and may prompt.
The photos are base64 ASCII, so the character count above is the number that
matters in every engine. Plan against 5 MB and treat anything past 2.5 MB of
real data as the danger zone, because of the double write.

When it does fail, the handling is good: `isQuotaError`
(`src/lib/storage.js:71`) matches five spellings across engines, and
`storageErrorHandler` raises a specific, actionable banner naming photos as the
cause (`src/lib/storage.js:101`, rendered at `src/App.jsx:1176-1186`). The
message is honest and tells the user to back up first. **The failure is handled
well; it is the approach to the failure that is invisible.**

### 2.5 What happens today when the browser clears storage

Walked end to end. The answer is: **the app does not notice, does not warn, and
actively misleads.**

Both prefixes are cleared together — same origin, same `localStorage`. On the
next open (`src/App.jsx:423-490`):

1. Every `loadKey` returns its fallback. `readings` is `[]`.
2. **Nothing is seeded into `readings`** — `src/lib/seed-data.js` was
   deliberately emptied and `HISTORICAL_DATA` is `{}`. Good: no invented
   measurements appear.
3. `water-changes` and `lighting-log` **are re-seeded** from
   `WATER_CHANGE_SEED` and `LIGHTING_SEED`, because `wc-seeded` and
   `light-seeded` were cleared too (lines 463-487). The user gets a
   plausible-looking maintenance history they did not create, next to an empty
   readings list.
4. Reminders rebuild to defaults, settings to `DEFAULT_SETTINGS` plus seeded
   product strengths.

**Does the app notice?** No. There is no install marker, no device ID, no
record count, nothing persisted outside the cleared namespace. A wipe and a
fresh install are byte-identical states. Grepping for `install-id`, `installId`,
`firstRun` returns nothing.

**Does it warn?** No. No banner, no dialogue, no "you had 488 readings
yesterday". The `*-seeded` flags are the only things that could have carried
that signal and they die with the data.

**And the misleading part:** `last-backup` is cleared as well, so
Setup → Backup & export renders

> "You haven't saved a backup yet. Browser storage isn't permanent…"
> — `src/components/Setup.jsx:516`

to a user who may well have a backup file sitting in iCloud Drive. The single
string most likely to make someone conclude there is nothing to recover is
shown at precisely the moment recovery is possible.

**Is there a recovery path?** One, and it is entirely manual:

- The user made a backup themselves via Setup → **Save backup file**
  (`src/components/Setup.jsx:531-539`), and still has that JSON.
- They restore it via Setup → **Restore from a backup**. `inspectBackup`
  previews it, `restoreBackup` merges by natural key, never by `id`, so it is
  idempotent and additive (`src/lib/backup.jsx:60-169`). Unreadable rows are
  counted and reported rather than dropped silently. **This machinery is good
  and should be kept wholesale.**
- Failing that: nothing. There is no second copy, no snapshot, no export the
  app made on its own initiative. The CSV export cannot be restored from and
  says so (`src/lib/backup.jsx:20-22`).

There is one further path worth crediting, for a different failure: if the app
crashes before rendering, `RootErrorBoundary.rescue()` (`src/App.jsx:222-237`)
calls `buildBackup()` — which reads storage directly and needs no component
state — and offers the file. That covers "the app is broken", not "the data is
gone". It re-implements `downloadJson` inline instead of calling it, with an
immediate `revokeObjectURL` rather than the deferred one at
`src/lib/backup.jsx:177`; harmless in practice, worth collapsing.

**Summary: the app's entire durability story is a file the user has to
remember to make, stored somewhere the app never checks, prompted for on a tab
it does not lead them to, and after a wipe it tells them that file does not
exist.**

---

## Step 3 — The proposal

**Nothing below is built in this pass.** Each item is sized and given a
recommendation so the build routine has decisions already made.

### 3.1 What is reusable as-is

| Function | Verdict |
|---|---|
| `buildBackup` (`backup.jsx:36`) | **Reuse unchanged.** Reads through `loadKey`, so it follows the storage layer wherever it goes — an IndexedDB migration needs no edit here. Already used headless by the error boundary, which proves it. |
| `downloadJson` (`backup.jsx:171`) | **Reuse unchanged.** Also: delete the inline copy in `App.jsx:225-234` and call this. |
| `inspectBackup` (`backup.jsx:60`) | **Reuse unchanged.** Preview-before-write, natural-key dedup, unusable-row accounting. Nothing to improve. |
| `restoreBackup` (`backup.jsx:111`) | **Reuse, one edit.** Merge logic is right. It only handles the 8 keys in `keyOf` plus 4 special-cased blobs; `correction-plans` must join `BACKUP_KEYS` and the special-cased set (TW-D2). |
| `BACKUP_KEYS` / `BACKUP_LABELS` | Reuse. Add `correction-plans`. |
| `isQuotaError` (`storage.js:71`) | **Reuse unchanged.** Cross-engine, already correct. |
| `compressImage` (`image-compression.js:5`) | Reuse the shrink loop. The 220 KB budget should be raised once photos leave `localStorage`, not before. |

**Roughly 80% of the backup system already exists and is well built.** The gap
is not backup, it is (a) where bytes live and (b) that backup is manual.

### 3.2 The storage move — three options

**Option A — Stay on `localStorage`, remove the double write, move photos out.**
Delete the mirror in `saveKey` when the shim is the bridge; store ICP images as
Blobs in a small IndexedDB store keyed by ICP id.
*Cost:* small. *Gain:* effective quota doubles, and the only key that can fill
it leaves. *Loses:* still a synchronous 5 MB text store; still no transactions;
a corrupt write is still unrecoverable.
*Verdict:* the cheapest thing that removes the actual risk. Viable as a
standalone release if Phase 7 must ship something small.

**Option B — IndexedDB behind the existing `loadKey`/`saveKey` signature.**
(Recommended.) Both are already `async` and already the only way the app
reaches storage — 21 keys, every access funnelled through two functions. Swap
the body for an IndexedDB object store, keep `localStorage` as a **read-only
migration source** for one release, then drop it.
*Cost:* medium — an adapter, a migration, and a test that proves a
`localStorage`-shaped install lands intact.
*Gain:* quota goes from 5 MB to a browser-managed share of disk (hundreds of MB
to GBs); writes are transactional; Blobs are stored natively so photos stop
being base64 and shrink ~25%; `persist()` actually protects it.
*Risk:* the migration is the whole risk, and it is one-way. Mitigate by writing
a `buildBackup()` JSON into IndexedDB *before* migrating, and by leaving the
`localStorage` copy in place — not deleting — until the release after.

**Option C — Split: IndexedDB for photos, `localStorage` for everything else.**
*Cost:* small-medium. *Gain:* removes the only key that threatens quota while
leaving 20 keys on a proven path. *Loses:* two storage systems to reason about
forever, two migration stories, and the double write persists for text.
*Verdict:* a good **first stage of B**, a poor final destination.

**Recommendation: B, staged as C then B.** Stage 1 moves photos to IndexedDB
and kills the double write (this alone takes projected year-2 quota exhaustion
off the table). Stage 2 moves the remaining 20 keys behind the same adapter.
Each stage is independently shippable and independently revertible.

### 3.3 Automatic backup — four options

**Option 1 — Snapshot ring in IndexedDB.** Keep the last N `buildBackup()`
outputs (7 daily, say), written on a cadence or on app close.
*Protects against:* an app bug, a bad restore, an accidental bulk delete.
*Does not protect against:* a storage clear — the snapshots are in the same
origin and die with everything else.
*Cost:* low, works in every browser, no permissions.
*Verdict:* **build it, and describe it accurately.** It is an undo history, not
a backup, and must never be labelled as one in the UI.

**Option 2 — File System Access API.** `showSaveFilePicker()` once, persist the
`FileSystemFileHandle` in IndexedDB, re-write that file on a cadence with no
further prompts.
*Protects against:* everything, including a full storage clear, provided the
file is in a synced folder.
*Cost:* medium. *Limit:* **Chromium only** — no Safari, no Firefox, so not iOS,
which is the platform the seven-day rule punishes hardest.
*Verdict:* build it as a progressive enhancement. Genuinely automatic where it
works. Must not be the only plan.

**Option 3 — `navigator.share()` with a file, on iOS.** One tap from the app to
Files / iCloud Drive / Mail. Not automatic — but it converts "save a backup"
from a multi-step download-and-file dance into one tap on the platform where
that friction is highest and the eviction risk is worst.
*Cost:* low. *Verdict:* build it. Highest ratio of durability gained to code
written, for this app's actual user.

**Option 4 — Programmatic periodic auto-download.** Rejected. Browsers block
non-user-gesture downloads, iOS Safari handles them badly, and it would litter
the Downloads folder with files nobody asked for.

**Recommended combination: 1 + 2 + 3.** The ring for in-origin mistakes, the
file handle where the platform allows real automation, the share sheet for iOS.
Plus the honest baseline below, which is worth more than any of them.

### 3.4 The honest baseline — do these first, they are nearly free

1. **Call `requestPersistence()` at app start**, not on `Setup` mount. Keep the
   Setup panel as the place that *explains* the result. (Step 1. TW-D1.)
2. **Write an install marker** outside the seeded flags — a UUID and a
   high-water record count, refreshed on save. On load, marker absent but the
   browser reports a prior visit, or marker present with a count that dropped
   to zero → **the app finally knows it was wiped and can say so.**
3. **Fix the post-wipe message.** "You haven't saved a backup yet" must become
   "This device has no record of a backup — if you saved one, restore it now",
   with the restore control adjacent. This is the single most damaging string
   in the app today.
4. **Add a quota meter.** `navigator.storage.estimate()` costs one call and
   turns a silent wall into a visible gauge. Surface it next to the ICP photo
   control, where the bytes are actually spent.
5. **Move the backup nag off the Setup tab.** Older than 14 days with a real
   history behind it deserves the dashboard, not a collapsed block on a screen
   the user does not visit.

### 3.5 What must be written from scratch

- IndexedDB adapter implementing the current `loadKey`/`saveKey` contract.
- One-way migration with a pre-migration `buildBackup()` safety copy, plus a
  test asserting a full 21-key `localStorage` install migrates byte-identically.
- Blob store for ICP images, and the read path that hands a Blob URL to the UI.
- Snapshot ring (write, prune, list, restore-from).
- `FileSystemFileHandle` persistence and the periodic re-write.
- Install marker and wipe detection.
- Quota meter UI.
- `navigator.share()` export path.

Everything else is already in `src/lib/backup.jsx` and works.

---

## Backlog items this routine produces

| ID | Item | Size |
|---|---|---|
| TW-D1 | `requestPersistence()` fires only on Setup mount; move to app start, keep Setup as the explanatory surface | XS |
| TW-D2 | `correction-plans` is not in `BACKUP_KEYS` — silently absent from every backup and restore | XS |
| TW-D3 | Every value written twice to `localStorage` (`reefconsole:` + `danstank:`); effective quota halved | S |
| TW-D4 | ICP photos stored inline as ~293 KB base64 strings; projected quota exhaustion in year 2 | M |
| TW-D5 | No wipe detection — a cleared browser is indistinguishable from a fresh install, and re-seeds water changes and lighting into an empty history | S |
| TW-D6 | Post-wipe UI claims "You haven't saved a backup yet" when a backup file may exist | XS |
| TW-D7 | `navigator.storage.estimate()` never called; no quota visibility before failure | S |
| TW-D8 | `lsSet` return value discarded on the bridge path in `saveKey`; divergence returns `true` | XS |
| TW-D9 | `RootErrorBoundary.rescue()` re-implements `downloadJson` inline | XS |
| TW-D10 | Backup nag lives in a collapsible block on the Setup tab only | S |
| TW-D11 | Migration to IndexedDB, staged (photos first, then all keys) | L |
| TW-D12 | Automatic backup: snapshot ring + File System Access handle + iOS share sheet | L |

**None of these are implemented by this routine.** TW-D1 and TW-D2 are each a
few lines and entirely within Track B, and are the obvious first PR once Track A
has landed and this report has been read.
