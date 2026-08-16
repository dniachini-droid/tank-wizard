id: TW-D5
title: A cleared browser is indistinguishable from a fresh install, and is seeded into
status: done
tags: [schema]
order: 610

why: both storage prefixes live in the same localStorage, so a clear takes all of
it at once. On the next open every `loadKey` returns its fallback, `wc-seeded` and
`light-seeded` are gone with everything else, and `App.jsx:489-513` reads their
absence as "new device": 25 weekly water changes dated 16 Feb to 3 Aug
(`src/lib/analytics/water-changes.js:9`) and one lighting note are written into a
history that holds nothing else. The user sees a maintenance record they did not
create beside an empty readings list, and the water-change list is not decoration —
it is the export side of the nutrient maths. `seed-data.js:1-11` settled the same
principle for readings; these two keys never got it.
what it could not do before: notice. `grep -rn "install-id\|installId\|firstRun"
src/` returned nothing — a wipe and a fresh install were byte-identical states.
fix, in two legs, because neither is sufficient alone:
  - `src/lib/install-witness.js` keeps an install id, a first-seen date and the
    most this device ever held of each counted list, in IndexedDB. It survives a
    clear that takes only localStorage. High-water marks never fall on their own,
    so deleting a reading is not read as evidence of anything.
  - shape detection for the rest: markers absent (localStorage lost) plus either
    non-zero high-water marks, or photos in the photo store with no `icp-tests`
    rows to hang them on — which cannot exist on a device that never ran the app —
    or `navigator.storage.estimate()` over a floor of 8 MB, seven times the 1.1 MB
    the built bundle and its precache account for (`du -sh dist`). The last of
    those is `suspect`, not proof: it suppresses seeding and claims nothing.
the rule both legs feed: do not seed into a history the app cannot account for.
`App.jsx` writes the `*-seeded` markers even when it declines, so the next load —
by then with a reading on it, and so no longer looking wiped — cannot walk back
into the seeding branch.
honest limit, stated in the module and the PR: nothing survives a full clear.
Safari's seven-day rule and every "clear site data" control take IndexedDB too, and
no local marker survives that. On a full clear this returns `fresh` or `suspect`.
also here: `src/lib/idb.js`, the shared database open lifted out of
`photo-store.js` unchanged in behaviour. Two modules opening `tank-wizard` at two
versions is a `VersionError` that would have degraded the photo store and put
report photos back inline in localStorage permanently — a quota regression from a
change that never touched photos. One version constant, `onupgradeneeded` creates
only what is missing, 1 -> 2 for `install-witness`.
repro: `src/test/defects/wipe-detection.test.jsx` — 10 cases through a real
`ReefConsoleInner` mount, 6 confirmed red against the pre-fix `App.jsx`. The 4 that
passed before and after are the regression guards: a genuinely clean install still
gets its 25 water changes and its lighting note, a user who emptied their own log
is not told they were wiped, no backup claim is made either way, and a device with
no IndexedDB behaves exactly as it always did.
authorised by `THE-PLAN-v3.md` §PHASE 7, written by Dan on 2026-08-14, which names
wipe detection as remaining work — AGENTS.md rule 5's `[schema]` item, filed with
the work as TW-032 was.
owner: implementer — routine 16, piece one
