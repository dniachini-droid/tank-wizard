# Run log — 2026-08-14-phosphate-band-investigation

Dan asked a question, not for a change: *"Has anything in today's changes
affected phosphate's band or its defaults? I'm seeing a phosphate band that
appears to have shifted from around 0.10 to 0.03 without me changing it."*
The answer is no — and the investigation turned up a real defect on the way to
it, which Dan then authorised fixing in the same session. Both are recorded
here.

## The question: did today move phosphate's band?

No. Verified rather than asserted:

- `src/lib/constants.js:33` reads `{ key: "phosphate", … min: 0.03, max: 0.10,
  step: 0.01, freqDays: 7 }`. `git log -L 33,33:src/lib/constants.js` returns
  exactly one commit — `0637695 Tank Wizard converted to Vite project`. The
  line has never been edited since it was written.
- The only `PARAM_DEFS` edit today is alkalinity: `2497b36` (bug 4, PR #23),
  `8.5-9.5` → `8.2-8.8`.
- `git diff daab64d..HEAD -- src/` (last commit of 13 Aug → HEAD) contains no
  line mentioning phosphate, in either direction.

**Where the number Dan remembers comes from.** The band did move from a top
near 0.15 down to 0.03-0.10, but before this repository's history:
`legacy/releases/reef-console-v1-stable.jsx:27`, `v2-meridian`,
`v3-prerebuild` and `pre-derive` all ship `phosphate min: 0.07, max: 0.15`,
while `legacy/src/reef-console.jsx:47` — the rebuild source — already reads
`0.03, 0.10`. The old band centred near 0.11; the new one has 0.03 as its
floor. The change was sourced, and the ported conformance gate states the
reasoning in its own words: *"Nitrate shipped at 9-15 and phosphate at
0.07-0.15, both shifted above the consensus — a tank at a healthy 6 ppm
nitrate or 0.05 ppm phosphate read as below target"*, against Reef Trak 3-15 /
0.03-0.10 and reefcalcs 0.04-0.08 target, 0.02-0.10 acceptable.

What today *did* change about it is enforcement, not value: Phase 5
(`793bc67`) ported that gate into CI, so 0.03-0.10 is now pinned by a blocking
check rather than only being the value in the file.

## The defect found while answering: TW-032

There is one live mechanism that makes a phosphate band change with no code
change behind it, and it is not phosphate-specific.

`App.jsx:388` merges `custom-ranges` over `PARAM_DEFS` and falls back to the
default when a key is absent — silently, by design. So a custom band that goes
missing does not error or blank; it reappears as the shipped default.

`ee64a23` removed the storage shim, moving every read from the legacy
`reefconsole:` prefix to the `danstank:` mirror. `drainLegacyStore`
(`storage.js:71`) was written in that same change to carry an install's data
across the move, and `src/test/defects/storage-double-write.test.js` pins its
behaviour in six cases. **Nothing ever called it.** The only references in the
repository were that test file and `src/test-surface.js:276` — not `App.jsx`,
not `main.jsx`. It passed its own tests on every run while doing nothing on a
real device.

That matters because the two copies can disagree. The pre-shim `saveKey`
ignored the mirror's return value (`lsSet(key, value); return true;`), so a
quota failure left the legacy copy correct and the mirror stale, with no
error. ICP report photos sat inline in localStorage until `c7ed9d0` moved them
to IndexedDB today, which is exactly the pressure that produces those
failures. Any key written under that pressure now reads its older copy —
`custom-ranges`, and equally `readings`, `dose-log`, `corrections`,
`correction-plans`.

**Fix.** `src/App.jsx:431` calls `drainLegacyStore()` synchronously at the top
of the startup effect, before the `Promise.all` of `loadKey`s. The ordering is
load-bearing, not incidental: the drain records the keys it could not finish
and `loadKey` consults that record to keep preferring the legacy copy for
them, so both halves have to run before the first read. The drain itself is
unchanged — this run added a call site, nothing else.

**Regression test.** `src/test/defects/legacy-drain-wiring.test.jsx`, four
cases, all through a real `ReefConsoleInner` mount rather than against the
drain directly, because the wiring is the entire defect — every assertion in
the file would have passed against the un-called function. A custom phosphate
band of 0.05-0.12 behind a stale mirror; the same band read back off the
dashboard card's own gauge; a legacy key with no mirror at all; a clean
install left untouched. 3 of the 4 confirmed red against the pre-fix
`App.jsx`; the fourth is the no-op case and passes either way, which is the
point of it.

## Also filed, not fixed: a unit mismatch in bug 7's arrival zone

Appended to TW-029 rather than raised as its own item, because it is latent
today and becomes live exactly when TW-029 is built.

`correctionProgress` (`helpers.js:280`) reads
`STABILITY_RULES[def.key].noiseFloor` and uses it as an absolute value in the
parameter's own unit. Correct for the three `mode: "absolute"` elements, and
verified against §9's worked table when it was written. Wrong for the only two
entries in **percent** mode — phosphate (`noiseFloor: 0.02, unit: "%"`) and
nitrate (`1.0, "%"`), `stability-engine.js:51-52`.

At the default bands: phosphate's `bandWidth/3` is 0.0233 against
`2*noiseFloor` = 0.04, so the misread constant binds and would set the arrival
zone at 0.045-0.085 — 57% of the band where §9 asks for a middle third.
Nitrate's 3.33 beats its 2, so there the misread constant is inert.

It is latent because `correctionProgress` is called only from
`alkalinity.js:480,644`, `calcium.js:233,354` and `helpers.js:734,863`
(magnesium); phosphate never reaches it. No fix is proposed: reading the
percent floor as a percentage of the band, giving `correctionProgress` its own
floor, and giving phosphate an absolute floor in `STABILITY_RULES` are three
different chemistry decisions, and §25 forbids minting them here.

## Verification

- `npm test` — 62 failed / 313 passed. Baseline on the same tree with this
  run's three files stashed: 62 failed / **309** passed. Exactly the four new
  tests, no new failures. The 62 are pre-existing and unrelated.
- `npm run build` — succeeds (PWA precache 11 entries, 1074.18 KiB).
- `npm run verify` — ALL BLOCKING CHECKS PASSED, including the ported
  legacy-port gate (`sim/years`, `golden`, `invariants`).
- `npm run lint` — does not exist (TW-024), not run.
- Red-before-green confirmed by reverting `src/App.jsx` and re-running the new
  file: 3 failed / 1 passed.

## Plain-language layer (AGENTS.md rule 11)

**On the phosphate range.** Nothing done today touched it. The range the app
uses for phosphate — 0.03 to 0.10 ppm — has been exactly that since the app
was rebuilt, and no change today went near it. The only target range that
moved today was alkalinity's.

The 0.10-ish figure is real, though: the older version of Tank Wizard, before
the rebuild, used 0.07 to 0.15 ppm for phosphate. That was changed because it
sat above what the published sources actually recommend — a tank at a
perfectly healthy 0.05 ppm was being told it was below target. The new range
matches the guidance the sources agree on. What changed today is only that a
test now guards that range, so nothing can quietly move it in future.

**On the thing that was actually broken.** If a target range is ever set by
hand, the app stores it. If that stored setting goes missing, the app quietly
falls back to the built-in range and says nothing about it — so a hand-set
phosphate range disappearing would look exactly like the range having
"shifted" on its own.

Today's storage work changed which of two copies of the saved data the app
reads. A piece of code was written to move the older copy across to the new
place so nothing would be lost — and it was never actually switched on. On a
phone that had ever been short of storage space, the copy now being read could
be the out-of-date one, which means a setting saved on a full phone could
silently revert to how it was before. That has been switched on now, and there
is a test that fails if anyone ever unwires it again.

**On the third thing.** A change made earlier today decides when a correction
has "arrived" by aiming for the middle of a range rather than anywhere inside
it. It uses each parameter's own test-kit accuracy figure to keep that middle
zone from being narrower than the kit can measure. For phosphate and nitrate,
that accuracy figure is stored as a percentage rather than a straight number,
and the new code treats it as a straight number. Nothing is wrong on screen
today, because phosphate and nitrate do not have corrections. It is written
down against the existing phosphate/nitrate item so that whoever gives those
two their own rules deals with it then — it is a chemistry decision, and those
are Dan's.
