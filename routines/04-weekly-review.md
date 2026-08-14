# Routine 4 — Weekly Review  (schedule: Sunday 06:00)

Steps back from the nightly grind. This is the one that catches drift.

## STEP ZERO — always, before anything else

Scan `.agent/runs/`. Every run owns one file, `.agent/runs/<run-id>.md`, and
**no run ever writes another run's file.**

- Any file whose `status:` is `in-progress` or `interrupted` and whose run id is
  **not yours** → **that run died.** Recover it first, per the checkpoint
  contract in `AGENTS.md`: check for its open branch, commit verified work or
  revert unverified work, log what you found, and set that file's `status:` to
  `interrupted` with a line saying what you did. Several may need it — handle
  each. Leave its `next step:` intact; whoever runs that routine next resumes
  from it.
- Then create your own `.agent/runs/<run-id>.md` with `status: in-progress` and
  continue below. If your run already has a file with `status: in-progress` or
  `interrupted`, that is *your* dead run — resume from its `next step` rather
  than starting over.

An empty or absent `.agent/runs/` is a normal start, not an error.

Update **your own** `.agent/runs/<run-id>.md` before and after every step. Append
to `.agent/log/<run-id>.md` as you go, never at the end.

If you are running low on time, context or usage: **stop at the next wave
boundary**, write state, write the brief with whatever you have, and exit
cleanly. Never stop mid-edit, mid-verification, or mid-git-operation.

---

---

You are the orchestrator for the Tank Wizard weekly review. Read `AGENTS.md`.
Read all `.agent/log/` entries from the past seven days.

Read-only. Produce `.agent/weekly-review.md`.

Answer these, with evidence:

1. **Did we get anything real done?** List merged PRs and what actually improved
   for the user. Distinguish shipped value from motion.
2. **What kept coming back?** Items attempted more than once, agents that
   repeatedly rejected each other, the same finding raised on multiple nights.
   Recurrence means a structural problem, not a task problem.
3. **Is the spec keeping up?** Count spec gaps surfaced this week and how many
   are still unanswered in `.agent/needs-dan.md`. If unanswered gaps are growing
   week over week, the system is running ahead of Dan and will start producing
   confident nonsense. Say so bluntly.
4. **Trust check.** Find at least two instances this week where an agent claimed
   success. Independently verify them now. Report honestly whether they held up.
5. **Cost.** Runs used vs cap, and which routine consumed the most for the least
   return. Recommend one thing to cut.
6. **Backlog health.** Size, age of oldest item, ratio approved to unapproved.
   A growing unapproved pile means Dan is the bottleneck — propose fewer,
   better-scoped items rather than more.

End with exactly three recommendations for next week: one to add, one to change,
one to stop doing.
