# Journeys — source documents

**Status: source material. Not canon, not a specification, not a bug report.**

The files in this folder record **how the owner actually keeps his tank**. They are
first-hand accounts, written by the person who does the dosing, of what he does over
the course of a real correction: what he looks at, what he decides, in what order,
what he does when the numbers disagree with the plan, and where he has learned not to
trust himself.

There is one per element:

| `journey-1-alkalinity.md` | keeping and correcting alkalinity |
| `journey-2-calcium.md`    | keeping and correcting calcium |
| `journey-3-magnesium.md`  | keeping and correcting magnesium |

They are the raw material for **Phase 8**.

---

## What these documents are not

Three things, and the distinctions matter more than they look:

**They are not the spec.** `docs/spec/reef-chemistry.md` and
`docs/spec/wizard-states.md` are canon — human-authored, sourced, and binding on the
code. These are not. A journey describes one reefer's practice on one 77 L tank; it
carries no authority over a formula, a threshold, a band boundary or a rail. Nothing
in this folder may be cited to justify a code change, and a journey never overrides a
spec figure. If a journey and the spec disagree, the spec wins and the disagreement
is *interesting* — see below.

**They are not a description of what the app does today.** They were written from the
tank, not from the screen. Where a journey describes a step the app has never
offered, that is not a claim that the app offers it. Where a journey describes a step
the app *does* offer but differently, that is not a bug report.

**They are not a feature request.** Nobody has asked for the app to be changed to
match them. A journey describing something the app doesn't do is a fact about the
owner's practice, not an instruction.

---

## What they are for

Phase 8 works from these documents. The value in them is the gap: the distance
between what the owner actually does at the tank and what the app currently helps
him do. That gap is the material — but reading a gap correctly takes care, because a
gap has at least four possible causes and they lead in opposite directions:

- the app is missing something the owner needs;
- the owner is doing something the spec says is wrong, and the app is right to not
  help him do it;
- the app already does it, somewhere he hasn't found, or under a different name;
- the journey is describing an old habit he has since dropped.

Deciding which of those it is is exactly the kind of question no agent resolves
alone. House rule 10 applies in full: **work the contradiction up, don't settle it.**
Options with reasoning that can be checked, which direction being wrong hurts, what
else must change alongside, and what would make each option wrong. File it where the
routine says to file it.

---

## Rules for agents

1. **Read-only.** Never edit a file in this folder. Like `docs/spec/*` and `legacy/*`,
   these are authored by a human and preserved as written. Unlike `docs/spec/*`, they
   are not binding — but they are still not yours to correct. If a journey contains
   an error of chemistry, say so in your findings; do not fix it in place.
2. **Quote, don't paraphrase.** When a journey is the reason for a finding, quote the
   sentence and cite the file. A paraphrase of a paraphrase is how a personal habit
   turns into a fake requirement three documents later.
3. **Never cite a journey as a spec reference.** Backlog items take `spec:` lines
   pointing at `docs/spec/*`. A journey may motivate an item; it can never be the
   authority for one. An item whose only support is a journey is not implementable —
   it needs a spec decision from Dan first.
4. **Don't generalise from them.** One tank, one reefer, one set of products. Nothing
   here is evidence about reefkeeping in general, and nothing here should become a
   default for a hypothetical other user.
5. **Contradictions with the spec go to `.agent/spec-challenges.md`**, worked up, per
   house rule 10 and non-negotiable 1 — not resolved, and not silently dropped
   either.
