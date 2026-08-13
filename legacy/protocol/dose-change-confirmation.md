# Protocol: the reading confirmation after a dose change

**Status: proposed, not built.** For review before any code.

## What exists today

The confirmation window that appears after logging a reading has two modes,
and this is deliberate — the comment in `tests/summary.js` states it:

> With a correction running the window renders the engine's verdict. Without
> one it uses its own voice — "dead centre", "a little low" — and that voice
> has to stay consistent with what the wizard says about the same tank.

So a **correction plan** is narrated: progress, days remaining, arrival with a
celebration. That works and is tested across seven verdicts.

A **plain dose change** is not narrated at all. The window describes the reading
in isolation.

## Why that is wrong, not merely terse

Four readings, all after raising alkalinity from 9 to 11 mL a day:

| Days since the change | Reading | What the window says now |
|---|---|---|
| 1 | 8.5 | *In band, though near the edge — worth watching* |
| 7, it worked | 9.0 | *Dead centre. Barely moved since last time* |
| 7, nothing moved | 8.4 | *A little low. 0.1dKH below the bottom of your range* |
| 7, overshot to 10.2 | 10.2 | *Well above band. Far enough out that a re-test is worth doing* |

Every one is factually true about the reading and unhelpful about the tank.

The last row is the clearest failure. You raised the dose, alkalinity climbed
2 dKH, and the app suggests the *reading* may be wrong. It is not wrong. It is
the entirely predictable consequence of your own change six days earlier, and
the app knows that — the wizard is holding `overshot` at that moment.

The third row is the quietest failure and probably the more costly one. Seven
days at a raised dose with no movement at all means either the dose is still
short or the solution strength in Setup is wrong. "A little low" invites you to
wait longer, which is the opposite of what should happen.

## The principle

**A reading taken after a dose change is evidence about the change.** That is
its primary meaning. Where the level happens to sit is secondary, and the window
currently reports only the secondary thing.

## What the engine already knows

Nothing needs recomputing. At the moment the window opens, the assessment holds:

| Field | Meaning |
|---|---|
| `state` | `settling`, `worked`, `fell-short`, `overshot`, `suggested`, `idle` |
| `hoursOnDose` | how long the current dose has run |
| `currentDose` | the dose in force |
| `trendPerDay` | how fast the level is moving |
| `settleWindow(...)` | how long before a verdict is fair |

`doseStatus` already turns those into a verdict. The window has the dose state
passed to it and uses it only when a correction plan is present.

## Proposed behaviour

Five cases, in priority order. Each fires only when a dose change exists in the
log and no correction plan is running — a plan already takes precedence and
should keep it.

### 1. Too early to judge (`settling`, inside the settle window)

> **Too early to tell**
> You raised the dose to 11 mL a day yesterday. Give it 2 more days before
> reading anything into this — alkalinity moves slower than the kit's
> precision.

Names the change, names the wait, and says *why* the wait exists. Stops someone
adjusting again on day two, which is how oscillation starts.

### 2. It worked (`worked`, or in band and moving toward the middle)

> **The dose change is working**
> 11 mL a day has brought alkalinity from 8.4 to 9.0 over 7 days. Hold it here
> — this is what a matched dose looks like.

The point is to say *hold*, explicitly. "Dead centre" reads as a compliment;
"hold it here" is an instruction.

### 3. Not enough (`fell-short`, or flat after the settle window)

> **7 days at 11 mL and it hasn't moved**
> Still 8.4, the same as before the change. Either the dose needs to go further
> or the solution strength in Setup is wrong — check that before raising again,
> because a wrong strength makes every figure here wrong.

Two candidate causes, in the order worth checking. The strength possibility is
the one nobody thinks of and the one that invalidates everything else.

### 4. Overshot (`overshot`, or out of band in the direction of the change)

> **That's the dose change overshooting**
> 14 mL a day has taken alkalinity from 8.4 to 10.2 in 7 days. The reading is
> not suspect — this is your change doing more than the tank needed. The wizard
> has a smaller dose to go back to.

Explicitly retracts the "re-test" advice, which is the actively misleading part.

### 5. Wrong direction

> **It's moved the wrong way**
> You raised the dose to 11 mL a day 7 days ago and alkalinity has fallen from
> 8.9 to 8.4. Something else is consuming it — check for a skimmer or reactor
> change, or growth outpacing what you are replacing.

Rare, but the one case where the reading genuinely is the most surprising thing
on the screen.

## Constraints this must respect

1. **A correction plan wins.** If one is running, behaviour is unchanged. It is
   already narrated and already tested.
2. **Never contradict the wizard.** The existing agreement test must keep
   passing — 21 combinations, no contradictions. These messages should echo the
   wizard's verdict, not form a second opinion. That is the lesson from the
   summary, where a dose claim writing its own words produced "parked
   off-target" against the engine's "on its way to 475".
3. **The out-of-band fact stays.** Subordinated to the dose story, not hidden.
   A tank at 10.2 is out of range whatever caused it.
4. **No new thresholds.** Every decision uses the wizard's existing state. A
   new threshold here is a second place for the same judgement to live, which
   is how the engines drifted apart in the first place.
5. **Quiet when there is nothing to say.** No dose change in the log, or one
   long settled, and the window keeps its current voice.

## What could go wrong

**Wording drift.** Five new messages quoting doses and dates is five new places
to print a stale figure. Mitigation: they must read `currentDose` and
`hoursOnDose` from the assessment, never from arguments passed in — the
"0.30dKH of 1.00dKH added" bug came from a figure computed in the wrong place.

**Attribution error.** Saying "your dose change worked" when a water change did
it. The engine tracks water changes as disturbances; if one falls between the
dose change and the reading, the claim should soften to "alkalinity has risen"
rather than "the dose change has raised it".

**Over-narration.** If every reading after every dose change gets a paragraph,
it becomes noise and gets ignored. Case 2 in particular should probably fall
silent once the dose has been stable and correct for a while — the settle
window is the natural cut-off.

## How it should be tested

- One case per state, asserting the message names the dose and the elapsed time
- The wizard-agreement test extended to run WITH a dose log, which it currently
  does not — it uses `doseLog: []`, which is exactly why this gap survived
- A water change interposed between dose change and reading must soften the
  attribution
- The golden fingerprint will change; the diff must be confined to these
  messages
- Removing the feature must fail the new tests

## Decisions taken

1. **Case 2 speaks.** A working dose change gets said out loud. Confirming that
   something worked is as useful as flagging that it did not, and it is the
   message that teaches what a matched dose looks like.

2. **A dose change stays relevant until one of two things happens:** you change
   the dose again, or the level holds inside its range for long enough that the
   change is plainly settled — two settle windows, which for alkalinity on a
   Hanna checker is about six days and for calcium about six weeks.

   In the app itself this is never phrased as "two settle windows", which means
   nothing to anyone. It is expressed as the thing it describes: "this has been
   steady for a week now" or simply by falling silent, which is the clearest
   way of saying a change is no longer news.

3. **Past a safe bound, danger comes first and cause second, in one message.**
   Not two messages, and not the cause alone. Someone whose alkalinity has hit
   11.5 needs to know that first; knowing their own dose change did it is what
   tells them how to fix it, so both belong, in that order.
