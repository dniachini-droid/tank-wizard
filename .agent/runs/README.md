# `.agent/runs/` — one file per run

Each run owns exactly one file here, `.agent/runs/<run-id>.md`, holding the
checkpoint/resume state defined in `AGENTS.md` §"The run file". The `<run-id>`
matches the run's log, so `.agent/runs/<id>.md` and `.agent/log/<id>.md` are a
matched pair.

**The rule that makes this work: a run writes only its own file, and never edits
another run's.** Two runs in flight write two different filenames and cannot
conflict. STEP ZERO scans this folder for `status: in-progress` or `interrupted`
to find runs that died — see `AGENTS.md`.

Files are kept after a run completes; the folder is the history of runs that had
state, the same way `.agent/log/` is the history of what they did.

## Do not

- Do not add a shared index or summary file derived from these. A second copy of
  `status` conflicts exactly the way the old single file did — which is why it is
  gone. `ls` is the index.
- Do not edit another run's file except to mark it `interrupted` during the
  recovery in `AGENTS.md`, and even then leave its `next step` alone.

## Migration note (2026-08-14)

These files were split out of the former `.agent/run-state.md`, a single shared
file that concurrent runs overwrote — four open PRs conflicted on it in one
evening, and two runs had resorted to hiding their records inside HTML comments
under another run's header to avoid touching its fields. Records dated on or
before 2026-08-14 are reproduced verbatim from it and may still refer to
"run-state.md", or to neighbouring entries that were lost to an overwrite before
the split. That prose is left as its run wrote it; only its address changed.

`2026-08-14-position-last-reading.md` is one of the two comment-buried records,
given the ordinary header it was denied at the time. Its `started:` is a date
only — the original never recorded a time.
