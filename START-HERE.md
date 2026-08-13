# START HERE

Everything you need to run 27 agents on Tank Wizard overnight.

Read this page, then work through the phases in order. Don't skip ahead — each
one depends on the last.

---

## What's in this bundle

**Guides — read these**

| `START-HERE.md` | this page |
| `GET-CODE-OUT-OF-CLAUDE.md` | getting your app out of the chat and onto your Mac |
| `DO-THIS-STEP-BY-STEP.md` | the 23-step install, click by click |
| `AGENT-ROSTER.md` | what all 27 agents do, one line each |

**The system itself — you don't need to read these, but they're yours**

| `AGENTS.md` | the house rules every agent obeys |
| `docs/spec/reef-chemistry.md` | the chemistry the app gets checked against |
| `docs/spec/surfaces-and-messaging.md` | bands, message rules, terminology |
| `docs/spec/app-contract.md` | stack, storage, offline, accessibility floor |
| `.claude/agents/` | the 27 agent definitions |
| `routines/` | 6 routine prompts |
| `.agent/` | backlog, budgets, findings, run-state, log folder |

---

## The order to do things in

### PHASE 1 — Install the tools · ~1 hour · Mac required
**`DO-THIS-STEP-BY-STEP.md`, steps 1 to 9.**
Node, Claude Code, Homebrew, git, GitHub. Boring, mostly waiting on downloads.

### PHASE 2 — Get your app out of Claude · ~1 hour · Mac required
**All of `GET-CODE-OUT-OF-CLAUDE.md`.**
Copy the artifact code into a file, then let Claude Code build a real project
around it. Ends when `npm run dev` opens Tank Wizard in your browser.

Take the **latest** version. Also save any earlier version you remember working
well, as a backup to compare against.

### PHASE 3 — Upload and install the agents · ~30 min · Mac required
**`DO-THIS-STEP-BY-STEP.md`, steps 12 to 18.**
Private GitHub repo, branch protection, unpack this bundle into the project.

Step 14 (branch protection) is the one that matters. It's what stops an agent
changing your app without you approving it.

### PHASE 4 — Find out what you actually have · ~20 min
**Run the inventory.**

In Terminal, in your project folder:

```
claude
```

Then open `routines/00-inventory.md`, copy the whole thing, paste it in, press
Enter.

It reads your app and writes `.agent/inventory.md`: what exists, what's
half-finished, where the same thing got built twice, how far it is from the
spec, and whether anything could currently produce a wrong dose.

**Read this properly.** Your app has been through many rounds of changes that
nobody verified. This is the first honest look at what those rounds actually
left you with.

### PHASE 5 — Get tests working · 1–2 hours · Mac required
**`DO-THIS-STEP-BY-STEP.md`, steps 19 and 20.**

This is the one step that decides whether any of the rest is worth doing. Tests
are the only thing that can tell an agent it's wrong. Without them, 27 agents
just agree with each other confidently.

Step 20 is your moment of truth — run two agents by hand and see whether what
they find is sharp or vague.

### PHASE 6 — Turn on the first overnight run · ~15 min · phone or Mac
**`DO-THIS-STEP-BY-STEP.md`, steps 21 to 23.**

One routine only, at first. The consistency sweep. Read three or four morning
briefs before adding any others.

---

## After that, it's a phone job

Every morning, about ten minutes:

1. Read the morning brief
2. Open github.com → your repo → **Pull requests**
3. Each one is a change an agent wants to make. Read it. **Merge** or **Close**.

Nothing merges itself. Ever.

---

## Cost

**Nothing beyond your Max subscription.** GitHub private repos are free, so are
Node and git.

Routines use the same allowance as normal chats, so heavy nightly runs eat into
your daytime usage. Check **claude.ai/settings/usage** during the first week
before adding more routines. If you hit the limit, runs are simply rejected —
you can't get a surprise bill unless you deliberately turn on usage credits,
which is off by default.

---

## Time, honestly

| Phase | Time | Where |
|---|---|---|
| 1 — install | ~1 hr | Mac |
| 2 — get app out of Claude | ~1 hr | Mac |
| 3 — GitHub + agents | ~30 min | Mac |
| 4 — inventory | ~20 min | Mac |
| 5 — tests | 1–2 hrs | Mac |
| 6 — first routine | ~15 min | either |

**Four to five hours total.** Split it over two or three evenings. Phases 1–3
in one sitting, 4–5 in another, 6 whenever.

---

## The nightly schedule, once you're running

| 22:00 | build cycle | 2–3.5 hrs |
| 02:00 | consistency sweep | 45–90 min |
| 04:00 | audit sweep **or** attack night, alternating | ~1 hr |
| Sun 06:00 | weekly review | short |

Nothing overlaps. Add them one at a time, not all at once.

---

## Five things that will save you grief

**Nothing merges itself.** Agents open pull requests. You decide.

**A green tick means the job ran, not that it worked.** Read the brief, not the
status light.

**Routines never ask permission.** No approval prompts, ever. That's why branch
protection in Phase 3 isn't optional.

**Strip all connectors** from every routine you create. They're switched on by
default and an agent can use any of them, including writes, without asking.
These agents need none of them.

**Stop at the first thing that doesn't match.** Paste me what's on screen. One
broken step makes the next five fail in ways that look unrelated.

---

## If you only remember one thing

Phase 5. Get `npm test` genuinely working.

Everything else in this bundle — all 27 agents, all six routines, all three spec
files — is scaffolding around one simple idea: an agent that can be proven wrong
is useful, and an agent that can't be proven wrong is just a confident voice.
The tests are what makes the difference.
