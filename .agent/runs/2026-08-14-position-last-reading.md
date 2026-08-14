run: 2026-08-14-position-last-reading
routine: none — owner decision delivered directly by Dan, implemented in session
started: 2026-08-14 (time of day not recorded)
status: complete
last completed step: spec §26, implementation, golden regenerated, needs-dan updated
next step: none — merged as PR #34
in-flight: none
branch: claude/position-last-reading-d3s0pj
uncommitted work: no
log: .agent/log/2026-08-14-position-last-reading.md

> Original note, reproduced verbatim from the HTML comment this record lived in
> inside the former `.agent/run-state.md`. It argues against giving itself the
> `run:` header it now has, and refers to a neighbouring phosphate-band note
> that had already been lost to an overwrite. Both are artefacts of the shared
> file, kept because they are the clearest evidence of why it was replaced:
>
> 2026-08-14, appended by the position-is-last-reading change (log:
> .agent/log/2026-08-14-position-last-reading.md). Deliberately NOT written
> as a new `run:` header, for the reason the phosphate-band note below
> already gives: routine 15's record is what this file's header is. This was
> an owner decision delivered directly by Dan, implemented in session, not a
> routine.

What it produced, on branch claude/position-last-reading-d3s0pj:
(1) reef-chemistry.md §26 — position is always the last reading. Written
under Dan's explicit authorisation for the spec edit, which is the only
reason an agent touched docs/spec (AGENTS.md #1).
(2) The implementation: `inRange`/`above`/`below`, `nearEdge` and
`clearlyOut` in all three engines, plus doseStatus's two position tests,
all now read the last reading. No threshold moved. doseStatus's "dose
right, level off" card removed as provably unreachable once both branches
use one measure. Test: src/test/defects/position-is-last-reading.test.js,
17 assertions, all 17 confirmed red against git archive HEAD.
(3) golden fbac65244f00ac9b -> 83780c1728b67ca6, 172 of 5,940 rows,
audited by element and direction — 0 rows move the dose away from the band
its last reading is on.
(4) needs-dan item 3 CLOSED (superseded, with its residue stated: the 12%
dose-gap trigger is untouched). Two new open items filed rather than fixed:
item 4 (the one-off correction is still sized from the fitted value — a
dose figure, 39 further golden rows if moved) and item 5
(caClearlyOut/clearlyOut compare a ppm distance against a ppm/week rate).

Nothing here changes routine 15's state or its composed PRs. This branch
was cut from `main`, which carries bugs 1-7.
