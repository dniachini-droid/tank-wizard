# Routine 16 — Phase 7: The Durability Remainder

Cloud routine, **Track B**. Three pieces, **three PRs, one at a time, in the
order below**, each under the gate. `npm run verify` must pass before any of
them opens.

Routine 14 audited the durability story and built nothing. The urgent half of
what it found then shipped: persistence asked for at launch, the backup panel's
false "you haven't saved a backup yet", `correction-plans` in `BACKUP_KEYS`, the
double write removed, and ICP photos moved to IndexedDB (`c7ed9d0`). This
routine is the other half — the three items `THE-PLAN-v3.md` §PHASE 7 lists as
remaining, minus "a real backend before beta", which is Phase 11.

---

## Track boundary — read first

Track A owns `src/lib/dosing/` and `src/lib/analytics/`. **This routine must not
edit either directory**, or any file for the purpose of changing them. Reading
them to find out what depends on a storage key is fine and was done.

One boundary is easy to trip over and is called out where it bites, in piece
one: `WATER_CHANGE_SEED`, `LIGHTING_SEED` and `DEFAULT_SETTINGS` all live in
`src/lib/analytics/water-changes.js:9-17`. Piece one changes **whether the app
seeds**, which is a decision made in `src/App.jsx:489-513`. It does not change
what the seed contains, and must not touch that file.

Files this routine expects to be edited, in total, across all three pieces:
`src/lib/storage.js`, `src/lib/photo-store.js` (its database-open path becomes
shared), new modules under `src/lib/`, `src/App.jsx`, `src/components/Setup.jsx`,
`src/lib/backup.jsx`, and new tests under `src/test/defects/`. Nothing under
`src/lib/dosing/`, `src/lib/analytics/`, `docs/spec/` or `legacy/`.

---

## Rules, every piece, no exceptions

1. **One piece per PR, in the order below.** Piece two builds on piece one and
   piece three builds on both — branch each from the previous piece's branch,
   say so in the PR body, and do not batch them into one diff.
2. **A failing test first.** Write the test that proves the behaviour is absent,
   watch it fail against the code as it stands, for the reason the piece
   describes and not an unrelated one, then build. A PR whose tests passed
   before the change proves nothing.
3. **`npm run verify` must pass before every PR.** Not "should". See the
   baseline below for what green looks like and what is already red.
4. **Never edit a test to make it pass** (AGENTS.md #4).
5. **This routine is the `[schema]` authorisation** AGENTS.md #5 requires for
   storage work. It comes from `THE-PLAN-v3.md` §PHASE 7, written by Dan on
   14 August, which names all three of these pieces as the remaining work. File
   each piece's backlog item (one file under `.agent/items/`) tagged `[schema]`
   **with** the work, the way
   TW-032 was. Nothing here authorises a chemistry change (AGENTS.md #3) — no
   part of this routine may alter a constant, a threshold or a unit conversion.
6. **Fail safe, always, in the same shape the photo move used.** A value that
   cannot be written to its new home stays where it already works, is retried
   on a later load, and nothing is removed from where it works until its
   replacement is known to be in place (`src/lib/photo-store.js:196-237`). This
   is not a style preference: it is the only reason the photo move was safe to
   ship, and every one of these pieces is the same risk.
7. **Stop at a piece boundary** if short on time, context or usage. Finish the
   piece in hand — test, build, verify, commit, push, PR — or revert it whole.
   Never stop mid-edit. Write `.agent/runs/<run-id>.md` and `.agent/log/<run-id>.md`
   before moving on and before stopping.
8. **Report anything more involved than described here rather than forcing it.**
   This routine was written by reading the code on 14 August. Where a piece
   turns out to need more than what is cited under it, that is information:
   write it up, scope the PR down to what is clean, and say so.
9. **Finish the job: commit, push, open the PR. Never merge** (AGENTS.md #13).

---

## The baseline this routine was written against

Commit `39f370c`, branch `claude/routines-durability-remainder-a6u43v`.

**A fresh clone has no `node_modules`.** `npm run verify` on one fails at the
first step with `sh: 1: vite: not found`, and then 23 `legacy-port` checks fail
because `build/engines-new.cjs` was never produced. That is not a code failure
and must not be reported as one. `npm ci` first (529 packages, ~6 s).

| Command | Result on `39f370c`, after `npm ci` |
|---|---|
| `npm run verify` | **ALL BLOCKING CHECKS PASSED**, ~110 s (85 s of it `legacy-port:sim/years`) |
| `npm run verify` advisories | `deadcode` 3 findings, `csscheck` 3 findings — both pre-existing, tracked as TW-023/TW-024 |
| `npx vitest run` | **62 failed / 313 passed**, 56 files (30 failed) — the same pre-existing `[chem]` set as the Phase 6 baseline |

Every piece is measured against those two numbers. Blocking checks stay green;
the vitest failure count does not go up. If it does, that is a finding, not a
rounding error.

---

## What already exists, and is not to be rebuilt

Routine 14's §3.1 verdict still holds. Nothing in this list changes.

| Thing | Where | Why it is left alone |
|---|---|---|
| `buildBackup` | `backup.jsx:42` | Reads through `loadKey`, so it follows the storage layer wherever it goes. Piece three needs no edit here. Already proven headless by the error boundary. |
| `downloadJson` | `backup.jsx:204` | Works. Piece two calls it; it does not replace it. |
| `inspectBackup` / `restoreBackup` | `backup.jsx:66` / `:117` | Preview-before-write, natural-key merge, unusable rows counted. Piece two's ring restores **through** `restoreBackup`, so a snapshot is merged with the same guarantees a file is. |
| `isQuotaError` | `storage.js:173` | Cross-engine, correct. |
| The photo store | `photo-store.js` | The template for pieces two and three: an open that can time out, one transaction per operation, a `reason` string that reaches the user, and a fallback that keeps the data readable. |
| `drainLegacyStore` | `storage.js:71` | Unchanged by this routine. Piece three must not break it — see the interaction analysis there. |
| `requestPersistence` | `backup.jsx:230`, called at `App.jsx:320` | Already at launch. Not this routine's business. |

---

## The keys: 23, not 20

`THE-PLAN-v3.md` says twenty keys remain. Routine 14 counted 21, and its table
listed 22. The real number is 23, and it is worth having exactly right before
piece three moves them.

```
$ grep -rhno 'loadKey("[a-z0-9-]*"\|saveKey("[a-z0-9-]*"' src --include=*.jsx \
    --include=*.js | grep -v src/test | sed 's/.*("//;s/"//' | sort -u
```

| # | Key | In `BACKUP_KEYS`? | Note |
|---|---|---|---|
| 1 | `readings` | yes | |
| 2 | `icp-tests` | yes | Rows only. The photos left in `c7ed9d0`; the rows did not. |
| 3 | `water-changes` | yes | |
| 4 | `dose-log` | yes | |
| 5 | `lighting-log` | yes | |
| 6 | `task-log` | yes | |
| 7 | `tasks-custom` | yes | |
| 8 | `reminders` | yes | |
| 9 | `tank-settings` | yes | |
| 10 | `custom-ranges` | yes | |
| 11 | `kit-changes` | yes | |
| 12 | `findings-dismissed` | yes | |
| 13 | `alk-plan` | yes | written dynamically, `App.jsx:766` |
| 14 | `ca-plan` | yes | same site |
| 15 | `mg-plan` | yes | same site |
| 16 | `corrections` | yes | |
| 17 | `correction-plans` | yes | added by `ee64a23` |
| 18 | `last-backup` | no — correctly, it is per device | piece two writes it more often |
| 19 | `historical-seeded` | no | first-run marker |
| 20 | `icp-seeded` | no | first-run marker |
| 21 | `wc-seeded` | no | first-run marker — **piece one** |
| 22 | `light-seeded` | no | first-run marker — **piece one** |
| 23 | `strengths-fixed-v1` | no | one-off correction marker, `App.jsx:533` — the one routine 14 missed |

Four call sites reach storage at all: `src/App.jsx`, `src/components/Setup.jsx`,
`src/lib/backup.jsx`, `src/lib/storage.js`. One site uses a computed key
(`App.jsx:766`, `saveKey(cfg.key, …)`) and it resolves to keys 13–15 from a
literal table three lines above it. There is no unbounded key space, which is
what makes piece three finite.

---

# PIECE ONE — wipe detection (TW-D5)

## What happens today

Walked end to end on `39f370c`. A browser clears storage; both prefixes go,
same origin. On the next open, `src/App.jsx:431-576`:

1. Every `loadKey` returns its fallback. `readings` is `[]`.
2. Nothing is seeded into `readings` — `HISTORICAL_DATA` is `{}`
   (`seed-data.js:11`) and `App.jsx:473-480` says why. Correct, keep it.
3. `wc-seeded` and `light-seeded` are gone with everything else, so
   `App.jsx:489-513` **re-seeds 25 water changes** dated 16 Feb to 3 Aug
   (`water-changes.js:9`) **and one lighting note** dated 5 Aug
   (`water-changes.js:14-17`) into a history that now holds nothing else.
4. The user is looking at a maintenance record they did not create, sitting
   next to an empty readings list — and the water-change history is not
   decoration. It is the export side of the nutrient maths
   (`water-changes.js:3-7`).

**Does the app notice?** No. `grep -rn "install-id\|installId\|firstRun" src/`
returns nothing. A wipe and a fresh install are byte-identical states.

**Does it warn?** No. The `*-seeded` flags were the only things that could have
carried the signal, and they die with the data.

The one string that used to make this worse — "You haven't saved a backup yet" —
is fixed (`Setup.jsx:515-525`, pinned by
`src/test/defects/backup-absence-claim.test.js`). That test's own header says
the rest is deliberately not attempted: *"This is not wipe detection — that is a
larger job."* This is that job.

## What can actually survive a storage clear

The brief asks for a marker that survives *if anything can*. Each candidate,
honestly:

| Store | Survives what | Fails what |
|---|---|---|
| **IndexedDB** | A `localStorage`-only clear; a quota eviction that takes the 5 MB text store and not the database; app-side clearing | Safari's seven-day ITP eviction and every "clear site data" path, which take all origin storage together |
| **Cache Storage / the service worker** | The same narrow set | The same broad set. Also cleared by an app update in ways that make it a poor witness |
| **Cookies** | Nothing useful — a script-written cookie is capped at seven days on Safari, which is the exact platform this is for | Everything else, and it is a network header on an offline-first app (AGENTS.md #7 territory) |
| **`navigator.storage.estimate()`** | Not a store — a *measurement*. Reports bytes in use for the origin | Cannot be written to, and reports the app's own code and caches, so it is evidence and not proof |

**Conclusion, and it must be stated in the PR rather than glossed:** nothing
survives a full clear. Any claim otherwise is false. So the design has two legs,
and the second is the one that matters most.

## What to build

**Leg one — a witness in IndexedDB.** One record, in the app's existing
database, holding: an install id (a `uid()`), the ISO date it was first written,
and a high-water mark per counted key — `readings`, `icp-tests`,
`water-changes`, `dose-log`, `task-log`, `lighting-log` — refreshed on save, and
**never decreasing on its own**. It survives a `localStorage`-only clear, which
is a real shape, and it is the thing that lets the app say "you had 488
readings" rather than "something is wrong".

**Leg two — the shape of a wipe.** A device that had data and now has none.
Evidence, in descending strength:

1. The witness exists in IndexedDB and its high-water marks are non-zero, while
   every key in `localStorage` is absent. **This is a wipe, provable.**
2. The witness is gone too, but the photo store holds ICP images
   (`photoIds()`, `photo-store.js:166`) with no `icp-tests` rows to hang them
   on. **This is a wipe, provable** — those photos cannot exist on a fresh
   install.
3. Neither, but `navigator.storage.estimate()` reports usage well above what an
   empty install accounts for. **Suggestive, not proof.** Do not assert a wipe
   from this alone; it is a reason to ask rather than to seed.
4. Nothing at all. **Indistinguishable from a fresh install, and must be
   treated as one** — except for the seeding rule below, which does not depend
   on knowing.

**The seeding rule, which is the actual fix.** The brief is exact about this:
*do not seed anything into a history the app cannot account for*. Today the
absence of `wc-seeded` is read as "new install, seed away". It means no such
thing. After this piece:

- On a **provable wipe** (1 or 2): seed nothing, in any key. Say so plainly,
  once, on the surface the user is already looking at — not behind a collapsed
  block on a tab they have no reason to open (that is TW-D10, still open) — and
  put the restore control next to the message.
- On an **unprovable but suspicious** state (3): seed nothing. The cost of not
  seeding is a missing 10 L water-change history the user can re-enter or
  restore; the cost of seeding is 25 fabricated maintenance events feeding the
  nutrient maths. Those are not symmetrical, and `seed-data.js:1-11` already
  settled the principle for readings — this applies the same reasoning to the
  keys that never got it.
- On a **genuinely clean install** (4, with no evidence of anything): behave
  exactly as today. Write the witness. Seed as now.

A wipe notice must never claim a backup does or does not exist — the app still
cannot know that, and `Setup.jsx:515-523` is right about why.

## Tests to write first

Under `src/test/defects/wipe-detection.test.jsx`. Each must be seen red first.

1. A device with a witness in IndexedDB recording 400 readings and an empty
   `localStorage` mounts `ReefConsoleInner`: **no water changes are seeded**.
   Fails today — 25 rows appear.
2. Same device: the app says a wipe happened, naming what it had, and the
   message is reachable without opening Setup.
3. A device with photos in the photo store and no `icp-tests` rows: same
   outcome, via the second evidence path, with no witness present.
4. A genuinely clean install (empty everything, no witness, no photos): seeds
   exactly as it does today — the 25 water changes and the one lighting note.
   This is the regression guard on the fix, and it is the one test that must
   pass both before and after.
5. The witness's high-water mark does not fall when a user legitimately deletes
   a reading, and a wipe is not declared because of it.
6. IndexedDB missing or refusing to open: no crash, no false wipe claim, and
   seeding still governed by the rule above. Use `fake-indexeddb`'s `IDBFactory`
   and the `closePhotoStore()`-style teardown that
   `src/test/defects/icp-photos-in-idb.test.js:43-50` already established.

## What this does not protect against

State it in the PR body, in these words or better:

- **It does not prevent a wipe.** It notices one.
- **It does not survive a full clear.** Both provable paths depend on IndexedDB
  surviving, and Safari's seven-day rule and every "clear site data" control
  take IndexedDB with everything else. On those the app falls back to case 3 or
  4 — it will not seed on suspicion, but it also cannot say what was lost.
- **It does not recover anything.** A wipe notice with no backup file behind it
  is a better-informed loss, not a smaller one. That is piece two's job.
- **It does not detect a partial loss** — a single key going missing while the
  rest survive. The high-water marks make that visible in principle; this piece
  does not act on it, and should say so rather than implying coverage.

---

# PIECE TWO — automatic backup (TW-D12)

Roughly 80% of the backup system exists and is well built. This piece adds only
the scheduling and the destinations. `buildBackup`, `downloadJson`,
`inspectBackup` and `restoreBackup` are used as they are.

## 2a — The snapshot ring

Keep the last N `buildBackup()` outputs in IndexedDB, in their own object store,
written on a cadence (daily is enough) and on the app being backgrounded.

**A ring, not a slot, and this is the whole point:** one snapshot that a bad
state overwrites is worse than none, because it destroys the last good copy at
the moment it is needed. Seven entries, pruned oldest-first. A snapshot is
restored **through `restoreBackup`**, so it merges by natural key and adds
rather than replaces, exactly as a file does.

Two constraints that are not optional:

- **Never label it a backup in the UI.** It is an undo history. It lives in the
  same origin as the data it copies and dies with it.
- **Refuse to write a snapshot that is emptier than the one before it** unless
  the user deleted things deliberately. A ring that faithfully records a wipe
  seven times has eaten its own contents. Piece one's high-water marks are
  already the measurement this needs — this is why the pieces are in this order.

**Does not protect against:** a storage clear of any kind, a lost or replaced
phone, or an origin change. It protects against an app bug, a bad restore, and
an accidental bulk delete. Nothing else.

## 2b — The File System Access handle

`showSaveFilePicker()` once, from a user gesture; persist the returned
`FileSystemFileHandle` in IndexedDB; re-write that one file on a cadence with
no further prompts. Check `queryPermission`/`requestPermission` before each
write and degrade quietly to "needs a tap" when the grant has lapsed.

**Does not protect against:** not being available. This is Chromium-only — no
Safari, no Firefox, therefore **not iOS**, which is the platform the seven-day
rule punishes hardest and the platform this app is actually used on. It also
does nothing if the chosen file sits in a local-only folder rather than a synced
one, and the app cannot tell which it got. Say both in the UI. It must never be
the only plan.

## 2c — The iOS share sheet

`navigator.share({ files: [new File([json], name, { type: 'application/json' })] })`,
feature-detected with `navigator.canShare`. One tap from the app to Files,
iCloud Drive or Mail.

**Does not protect against:** being automatic — it is not. It needs a user
gesture every time, by design and by browser policy. What it buys is the
conversion of a multi-step download-and-file dance into one tap on the platform
where that friction is highest and the risk is worst. Highest ratio of
durability gained to code written, for this app's actual user. It also cannot
confirm the file was saved — the share sheet reports dismissal and success
identically in practice, so the app must not record `last-backup` on a share it
cannot confirm, or it will claim a backup that was cancelled.

**Rejected, again, and for the same reason routine 14 rejected it:** a periodic
programmatic auto-download. Browsers block non-gesture downloads, iOS Safari
handles them badly, and it litters the Downloads folder.

## Tests to write first

Under `src/test/defects/automatic-backup.test.js`.

1. The ring keeps N and prunes the oldest — with `fake-indexeddb`, no clock
   mocking beyond a passed-in timestamp.
2. A snapshot restores through `restoreBackup` and is idempotent: restoring the
   same snapshot twice adds nothing the second time.
3. **A bad state does not overwrite the last good one** — the ring refuses, or
   rings past, a snapshot whose counts collapsed. This is the test the piece
   exists for.
4. The handle round-trips through IndexedDB and a write with a lapsed permission
   degrades rather than throwing.
5. `navigator.share` absent → the button is not offered. Present but rejecting
   → no `last-backup` is written.
6. Every scheduling path is a no-op when IndexedDB is unavailable, and the
   manual "Save backup file" button still works.

## What none of it protects against

The honest baseline, worth one paragraph in the PR: **the only copy that
survives losing the phone is a file the user has put somewhere else.** The ring
is an undo history in the same origin. The handle is Chromium-only. The share
sheet needs a tap. Automatic backup makes the good outcome much more likely; it
does not make the bad outcome impossible, and the UI must not imply otherwise.

---

# PIECE THREE — the remaining keys to IndexedDB (TW-D11, stage 2)

Same shape as the photo move (`c7ed9d0`), one level up: **the split happens
underneath `loadKey`/`saveKey`, so nothing outside `src/lib/storage.js`
changes.** `App.jsx`, `Setup.jsx` and `backup.jsx` keep every call they have,
unedited. That property is the acceptance criterion, not a nice-to-have — and
`buildBackup` reading through `loadKey` (`backup.jsx:45`) is what makes backup
files format-identical across the move in both directions.

## The rules it inherits

1. **Migrate on first load through the existing `saveKey` path**, so there is
   one write path rather than two. `storage.js:153-158` is the pattern, three
   lines of it.
2. **Fail safe.** A key that cannot be written to IndexedDB **stays in
   `localStorage`, where it works**, and is retried on a later load. Nothing is
   removed from where it works until its replacement is confirmed in place.
3. **The contract is unchanged.** `loadKey(key, fallback)` still resolves to the
   value or the fallback; `saveKey(key, value)` still resolves true or false and
   still reports its failure through `storageErrorHandler`.

## The interaction with `drainLegacyStore` — checked, not assumed

The brief asks for this to be examined rather than taken on trust. Four things
are true on `39f370c` and all four bear on the design:

**(a) It runs twice per load.** `storage.js:241` calls it at module load
(`ee64a23`), and `App.jsx:447` calls it again at the top of the startup effect
(`a9bcbc2`, TW-032). Both run before any `loadKey`. The second call clears and
rebuilds `undrained` (`storage.js:81`) from a `localStorage` nothing has written
to in between, so the outcome is identical and the cost is one extra pass over
the key list. **Harmless, but it is duplication, and it should be recorded as a
finding rather than silently relied on.** Do not "tidy" it away in this piece:
the App-level call is the one TW-032 was filed for and its ordering is
load-bearing.

**(b) It writes with `localStorage.setItem` directly** (`storage.js:89`), not
through `saveKey`. So a carried value lands in `localStorage`, never in
IndexedDB. Within a single load this is fine and the ordering saves it — drain
(synchronous) completes before the first `loadKey`, so the migration reads the
carried value and moves the right one.

**(c) `readLocal` prefers the legacy copy for undrained keys**
(`storage.js:120-132`). A key the drain could not carry — a device that was out
of space — must go on reading `reefconsole:` until a later run has room. The
migration must therefore take its value from `readLocal`'s answer, not from
`lsGet` directly, or it will migrate the stale mirror and make the exact loss
TW-032 was filed to stop permanent.

**(d) The dangerous case is across loads, not within one.** If migration moves
key K to IndexedDB but leaves a `reefconsole:K` behind, the next load's drain
resurrects it into `danstank:K` — an older value now shadowing, or being
shadowed by, the IndexedDB copy, depending on read order. Both outcomes are
silent. **The design must therefore be:** read order is IndexedDB first, then
`localStorage`; and a confirmed IndexedDB write is followed by removing **both**
prefixes for that key, which cannot fail for want of room. Freeing the
`localStorage` copy also gives the next drain the space it lacked, which is a
happy interaction rather than a hazard.

A test must pin (c) and (d) together: a quota-blocked drain, on a device that
migrates in the same load, ends with the legacy value in IndexedDB and nothing
left under either prefix to resurrect.

## The database is shared, and its version is a trap

`photo-store.js:38-39` opens `tank-wizard` at `DB_VERSION = 1`, and
`openDb`'s success handler resolves `null` unless the photo store exists
(`:118-120`). If piece two or piece three opens the same database at version 2
while `photo-store.js` still asks for version 1, the version-1 open of a
version-2 database fails with a `VersionError`, `openDb` degrades, and **photos
fall back to inline in `localStorage` permanently** — a quota regression caused
by a change that never touched photos.

So: **one open path, one version constant, shared.** Lift the open out of
`photo-store.js` into a module both it and the new stores use, create every
missing store in a single `onupgradeneeded` (`if (!contains)`, as it already
does), and bump the version once per piece that adds a store. Keep the open
timeout and the `onblocked` handling — they are why the photo move cannot hang
a load. A blocked or failed open in piece three means keys stay in
`localStorage` and the app carries on, which is the whole fail-safe rule.

## Which keys, and in what order

All 23 in the table above. Suggested order within the piece, smallest blast
radius first: the four markers (`historical-seeded`, `icp-seeded`, `wc-seeded`,
`light-seeded`) and `strengths-fixed-v1`, then the small objects
(`kit-changes`, `findings-dismissed`, `custom-ranges`, `tank-settings`, the
three plans, `correction-plans`, `last-backup`), then the lists (`readings`,
`icp-tests`, `water-changes`, `dose-log`, `lighting-log`, `task-log`,
`tasks-custom`, `reminders`, `corrections`).

**Note the interaction with piece one, deliberately, in the PR:** moving the
`*-seeded` markers into IndexedDB means a `localStorage`-only clear no longer
looks like a fresh install to the seeding code, because the markers survive it.
That is a real durability gain and it is *not* a substitute for piece one — a
full clear still takes both stores, and piece one's rule is what covers it.

## Tests to write first

Under `src/test/defects/keys-in-idb.test.js`, following
`icp-photos-in-idb.test.js`'s structure, which is the best model in the repo.

1. A value saved through `saveKey` is in IndexedDB and **not** in
   `localStorage`, and comes back through `loadKey` identical.
2. A pre-existing `localStorage`-shaped install — all 23 keys populated —
   migrates on first load and every value is byte-identical afterwards. This is
   the test that matters most; assert the whole set, not a sample.
3. IndexedDB unavailable / refusing / blocked: every key stays in
   `localStorage`, everything still loads and saves, the user is told once.
4. A key whose IndexedDB write fails stays in `localStorage`, is still readable,
   and migrates on a later load once the write succeeds.
5. The `drainLegacyStore` interaction from (c) and (d) above.
6. `buildBackup` and `restoreBackup` are unchanged in behaviour: a file written
   before the move restores into a device after it, and vice versa.
7. The `loadKey` fallback contract: a missing key returns the fallback, and a
   stored falsy value (`0`, `""`, `false`) returns the stored value rather than
   the fallback.

## What this does not protect against

- **Not a durability guarantee.** IndexedDB is evicted by the same clears and
  the same seven-day rule as `localStorage`. What it buys is room — the 5 MB
  text quota stops being the ceiling — and transactional writes.
- **It does not make a wipe recoverable.** Pieces one and two are what address
  that.
- **The migration is one-way.** A device that migrates and then downgrades to an
  older build reads an empty `localStorage` and looks freshly installed. Leaving
  the `localStorage` copy in place would be the conservative answer, and it is
  the wrong one here — it re-creates the double write `ee64a23` removed. Take
  the one-way move, and take a `buildBackup()` snapshot into the ring (piece
  two) *before* migrating, which is the other reason these three are in this
  order.

---

## Backlog items this routine implements

File each with the work, tagged `[schema]`, authorised by `THE-PLAN-v3.md`
§PHASE 7 as rule 5 above sets out.

| ID | Item | Piece |
|---|---|---|
| TW-D5 | No wipe detection — a cleared browser is indistinguishable from a fresh install, and re-seeds water changes and lighting into an empty history | one |
| TW-D12 | Automatic backup: snapshot ring + File System Access handle + iOS share sheet | two |
| TW-D11 | The remaining 23 keys to IndexedDB behind the existing `loadKey`/`saveKey` contract | three |

Still open after this routine, unchanged and not in scope: TW-D7 (no quota
meter), TW-D8 (`lsSet`'s return value discarded on the bridge path), TW-D9
(`RootErrorBoundary.rescue()` re-implements `downloadJson` inline), TW-D10 (the
backup nag lives only on the Setup tab).

New finding, filed by this routine, fixed by none of the three pieces:
`drainLegacyStore` runs twice per load — `storage.js:241` at module load and
`App.jsx:447` at startup. Idempotent, so it is duplication rather than a defect,
and deliberately left alone because the App-level call's ordering is what TW-032
fixed.

---

## In plain terms

*Per AGENTS.md #11.*

**The problem, in one sentence each.**

Right now, if your phone clears the app's storage, the app cannot tell the
difference between that and a brand-new phone — so it quietly fills in twenty-five
weekly water changes you didn't do, next to a completely empty test history, and
never mentions that anything was lost.

The only copy of your tank history that survives a clear is a file you saved
yourself and remembered to put somewhere else.

And everything except the ICP photos still lives in the small, old part of
browser storage, which holds about 5 MB and can only be written all-or-nothing.

**What the three jobs do.**

The first job teaches the app to recognise that it has been wiped: it keeps a
small note of how much you had, in the same place the photos now live, and it
looks for the tell-tale shape of a device that had data and now has none. If it
sees that, it stops inventing water changes and says plainly what happened, with
the restore button next to the message. If it genuinely cannot tell, it still
does not invent anything — a missing water-change list you can retype is a much
smaller problem than a made-up one feeding the nutrient maths.

The second job makes backups happen without you remembering. Three parts, and
none of them is a complete answer on its own: a rolling set of the last seven
snapshots kept inside the app, which protects you from a bug or a mistaken
deletion but dies with everything else in a clear; a real file on your computer
that the app can keep rewriting by itself, which works properly but only on
Chrome-family browsers, so not on an iPhone; and a one-tap share to Files or
iCloud Drive on the iPhone, which needs your tap but takes about a second. The
rolling snapshots deliberately refuse to overwrite a good copy with a suddenly
empty one — that is the failure that turns a safety net into a shredder.

The third job moves the rest of your data into the same larger, sturdier store
the photos already use. Your readings, doses, water changes, settings and
reminders go across the first time you open the app, one at a time, and anything
that cannot be moved stays exactly where it is and works exactly as it does now,
with another go next time. Nothing outside the storage layer changes, so backup
files written before the move restore afterwards and the other way round.

**What none of it fixes.** If your browser clears everything, everything local
goes — including the app's note of what you had and its rolling snapshots. The
only copy that survives that, or a lost phone, is a backup file sitting somewhere
that is not this phone. These three jobs make it far more likely that file
exists and far less likely you are misled about it. They do not make it
unnecessary.
