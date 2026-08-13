run: 2026-08-13-consistency-sweep
routine: routine 5 — consistency sweep
started: 2026-08-13T08:20:31Z
status: in-progress
last completed step: dispatched Wave A
next step: await Wave A completion (6 agents), then start Wave B (dose-parity-checker)
in-flight: manual-dose-auditor, wizard-dose-auditor, band-classifier-auditor, message-consistency-auditor, terminology-auditor, history-truth-auditor — all read-only except history-truth-auditor which may add tests/ files
branch: claude/2026-08-13-consistency-sweep
uncommitted work: no

<!--
This file is the resume point. Every routine reads it first and writes it
throughout. If status is in-progress or interrupted, the last run died and the
next run must resume before starting anything new. See AGENTS.md, "Checkpoint
and resume contract".
-->
