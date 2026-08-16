id: TW-D11
title: The remaining 23 storage keys move to IndexedDB, behind the unchanged loadKey/saveKey contract
status: done
tags: [schema]
order: 590

why: photos left localStorage in c7ed9d0; everything else stayed in a synchronous
~5 MB text store with all-or-nothing writes. The routine's enumeration found 23
keys, not the plan's 20 (routines/16-durability-remainder.md, the keys table — the
count that nobody had run included `strengths-fixed-v1`).
fix, same shape as the photo move, one level up (`src/lib/storage.js` only):
  - values live in a `keyvalue` object store as JSON strings — byte-for-byte what
    localStorage held, so migration is checkable by string comparison and the
    parse behaves identically on both sides.
  - read order is IndexedDB first, then the drain-aware localStorage chain. A key
    found only in localStorage migrates through the existing `saveKey` path — one
    write path, not two — and a key that cannot be written stays where it works
    and is retried on a later load.
  - a confirmed IndexedDB write removes BOTH localStorage prefixes for the key
    (removals cannot fail for want of room), which is what stops the next load's
    drain resurrecting a legacy copy, and hands the drain the space it may have
    been short of. Nothing is removed before its replacement is in place.
  - the drain interaction the routine required checking rather than assuming:
    migration takes `readLocal`'s answer, which prefers the legacy copy for
    undrained keys — migrating the stale mirror would have made the TW-032 loss
    permanent. Pinned by a test that quota-blocks the drain, migrates, and shows
    the legacy value in IndexedDB with nothing left under either prefix.
  - IndexedDB unavailable: every key stays in localStorage, works exactly as
    before (`storage-double-write.test.js`, `legacy-drain-wiring.test.jsx` and
    `seed-data.test.js` run without IndexedDB and pass untouched — they are now
    the fallback regression suite), and the user is told once, through the same
    once-per-connection gate as the photo fallback — one banner per degraded
    device, not one per concern.
knock-on, named rather than hidden: with a working IndexedDB, a full localStorage
can no longer fail a save at all — the save lands in IndexedDB, which is the point.
The "storage is full" message is now only reachable when both stores refuse, and
the two message tests hold their scenario constant by breaking IndexedDB first.
test edits, each the same class and each commented in place: assertions that read
the row store at its old address (`lsGet`) in the two files that install
IndexedDB — `icp-photos-in-idb.test.js` (row-location assertions and the two
scenario tests above) and one clean-install assertion in
`wipe-detection.test.jsx`. Every pinned property survives; the address moved,
and TW-D11 is the authorised address change. No assertion was weakened: the
photo-location checks got stronger (localStorage now holds nothing for the key).
contract pinned unchanged: `loadKey` fallback semantics including stored falsy
values (`0`, `""`, `false` return the stored value), `saveKey` true/false with
`storageErrorHandler` reporting, `buildBackup`/`restoreBackup` format-identical
in both directions across the move.
what it does not buy, stated: IndexedDB is evicted by the same clears and the
same seven-day rule. This is room and transactional writes, not durability —
TW-D5 and TW-D12 are the durability half.
`DB_VERSION` 3 -> 4 in `src/lib/idb.js`.
repro: `src/test/defects/keys-in-idb.test.js`, 10 cases, 7 red before the change
(values not in IndexedDB, localStorage not emptied); the 3 green before-and-after
are the fallback-contract regression guards.
authorised by `THE-PLAN-v3.md` §PHASE 7 (Dan, 2026-08-14) — AGENTS.md rule 5's
`[schema]` item, filed with the work.
owner: implementer — routine 16, piece three
