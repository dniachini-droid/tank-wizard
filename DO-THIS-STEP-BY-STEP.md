# Tank Wizard Agents — Literally Step By Step

Written for a Mac. Every step tells you exactly where to click and exactly what
to type.

**How to read this:** anything in a grey box is something you type. Type it
exactly, then press Enter. After each one, wait until the text stops moving
before doing the next.

**If something goes wrong, stop and tell me what the screen says.** Don't push on.

---

# PART A — Before you start

## What we're doing, in one paragraph

We're going to install a program called Claude Code that lives on your laptop
and can edit your app's files by itself. Then we'll upload Tank Wizard to a
website called GitHub, which is like Dropbox for code. Then we'll set up
scheduled jobs that run overnight in the cloud, work on the app, and leave you
a report in the morning.

## What you need

- Your Mac
- About an hour
- Your Claude login
- Tank Wizard's files somewhere on your laptop (more on this in Part C)

---

# PART B — Install the tools

## Step 1 — Open the Terminal

1. Press **Cmd and Space** at the same time. A search bar appears in the middle
   of your screen.
2. Type **Terminal**
3. Press **Enter**

A window opens. It's mostly blank with a bit of text and a blinking cursor.
That's the Terminal. It's just a place to type instructions.

**Leave this window open for the whole guide.**

## Step 2 — Check if you have Node

Node is a thing Claude Code needs in order to run.

Click into the Terminal window and type:

```
node --version
```

Press Enter.

**You'll see one of two things:**

- Something like `v20.11.0` → you're fine, **skip to Step 4**
- `command not found` → keep going to Step 3

## Step 3 — Install Node (only if Step 2 said "command not found")

1. Open Safari or Chrome
2. Go to **nodejs.org**
3. There's a big green button that says something like "Download Node.js (LTS)".
   Click it.
4. A file downloads. Open your Downloads folder and double-click it.
5. An installer opens. Click **Continue**, **Continue**, **Agree**, **Install**.
   Enter your Mac password when it asks.
6. Click **Close** when it's done.
7. **Quit Terminal completely** (Cmd+Q) and reopen it (Cmd+Space → Terminal).
8. Type `node --version` again. You should now see a version number.

## Step 4 — Install Claude Code

In the Terminal, type this (it's one long line — copy and paste it):

```
curl -fsSL https://claude.ai/install.sh | bash
```

Press Enter.

Text will scroll for 30 seconds or so. Wait until the blinking cursor comes back.

Now **quit Terminal (Cmd+Q) and reopen it.** This matters — it won't work
otherwise.

Type:

```
claude --version
```

You should see a version number. If you see "command not found", stop and tell
me.

## Step 5 — Log in to Claude Code

Type:

```
claude
```

Press Enter.

A browser window opens asking you to sign in. Sign in with your normal Claude
account (the Max one). When it says you're connected, go back to Terminal.

You'll see a prompt where you could type a message to Claude. We don't want that
yet, so type:

```
/exit
```

Press Enter. You're back to the normal Terminal.

## Step 6 — Install Homebrew

Homebrew is a tool that installs other tools. We need it for the next step.

1. Open your browser and go to **brew.sh**
2. On the front page there's a box with a long command in it, starting with
   `/bin/bash -c`. There's a copy button next to it — click it.
3. Go back to Terminal, paste it (Cmd+V), press Enter.
4. It will ask you to press Enter to continue — do that.
5. It will ask for your Mac password. Type it (you won't see the characters
   appear, that's normal) and press Enter.
6. This takes a few minutes. Let it finish.
7. At the end it may print two lines starting with `echo` and tell you to run
   them. If it does, copy and run each one.

Check it worked:

```
brew --version
```

## Step 7 — Install git and GitHub CLI

Git is what tracks changes to your code. GitHub CLI lets us talk to GitHub.

Type:

```
brew install git gh
```

Press Enter. This takes a few minutes.

## Step 8 — Make a GitHub account

1. Open your browser, go to **github.com**
2. Click **Sign up** (top right)
3. Enter your email, make a password, pick a username
4. Verify your email when they send you a code

Already have one? Skip this.

## Step 9 — Connect Terminal to GitHub

Back in Terminal, type:

```
gh auth login
```

Press Enter. It now asks you a series of questions. Use the **arrow keys** to
move and **Enter** to choose:

1. "What account do you want to log into?" → **GitHub.com**
2. "What is your preferred protocol?" → **HTTPS**
3. "Authenticate Git with your GitHub credentials?" → **Y**, then Enter
4. "How would you like to authenticate?" → **Login with a web browser**
5. It shows you a code like `A1B2-C3D4`. **Write it down.** Press Enter.
6. Your browser opens. Paste the code. Click **Continue**, then **Authorize**.
7. Go back to Terminal. It should say you're logged in.

**Part B is done.** Everything is installed.

---

# PART C — Get Tank Wizard onto GitHub

## Step 10 — Find your Tank Wizard files

This is the step I can't do for you, because I don't know where your app
currently lives.

**Question: are Tank Wizard's files in a folder on your Mac?**

- **Yes, there's a folder with the files in it** → go to Step 11
- **No — it only exists as artifacts inside Claude conversations** → stop here
  and tell me. We need to get the files out first, and I'll walk you through
  that separately.

If you're not sure: open Finder and look for a folder with files ending in
`.jsx`, `.js`, or a file called `package.json`. If you find one, that's it.

## Step 11 — Point Terminal at that folder

1. In Terminal, type `cd ` — that's **c**, **d**, then a **space**. Don't press
   Enter yet.
2. Open **Finder** and find your Tank Wizard folder.
3. **Drag the folder from Finder onto the Terminal window** and let go. The
   folder's location appears after `cd `.
4. Now press Enter.

Check you're in the right place — type:

```
ls
```

You should see your Tank Wizard files listed. If you see something else, you're
in the wrong folder — repeat this step.

## Step 12 — Turn the folder into a tracked project

Type each of these one at a time, pressing Enter after each and waiting for it
to finish:

```
git init
```

```
git add .
```

```
git commit -m "Tank Wizard before agents"
```

If that last one complains about your name or email, run these two first (use
your real details), then try the commit again:

```
git config --global user.name "Daniel Iachini"
```

```
git config --global user.email "your@email.com"
```

## Step 13 — Upload it to GitHub

Type:

```
gh repo create tank-wizard --private --source=. --push
```

Press Enter. It uploads. This creates a **private** copy on GitHub that only
you can see.

Check it worked: go to **github.com** in your browser. You should see
`tank-wizard` in your list of repositories.

## Step 14 — Turn on the safety lock

**This is the most important step in the whole guide.** It's what stops the
agents changing your app without your say-so.

1. On github.com, click your `tank-wizard` repository
2. Click **Settings** (along the top, on the right)
3. In the left sidebar, click **Branches**
4. Click **Add branch protection rule** (or **Add rule**)
5. In the box labelled "Branch name pattern", type: `main`
6. Tick the checkbox that says **Require a pull request before merging**
7. Scroll to the bottom, click **Create** (it may ask for your password)

Now nothing can change your app unless you personally approve it.

---

# PART D — Install the agents

## Step 15 — Download the file

On your Mac, download **tank-wizard-COMPLETE.tar.gz** from this chat. It
goes into your Downloads folder. Don't double-click it or unzip it.

## Step 16 — Unpack it into your project

Make sure Terminal is still pointed at your Tank Wizard folder. Check by typing:

```
pwd
```

It should print the path to your Tank Wizard folder. If not, redo Step 11.

Now type:

```
tar -xzf ~/Downloads/tank-wizard-COMPLETE.tar.gz
```

Press Enter. Nothing visible happens — that's normal.

Check it worked:

```
ls -a
```

You should now see `AGENTS.md`, `.claude`, `.agent`, `docs` and `routines` in
the list, alongside your own files.

## Step 17 — Check your app still builds

Type these one at a time:

```
npm install
```

(takes a few minutes)

```
npm run build
```

**If `npm run build` fails, stop and tell me what it says.** Nothing works
until this does.

```
npm test
```

**This one probably fails saying there are no tests. That's expected and fine.**
We fix it in Step 19.

## Step 18 — Save everything to GitHub

```
git add .
```

```
git commit -m "Add agent system"
```

```
git push
```

---

# PART E — Try it out (do this on another evening)

## Step 19 — Get tests working

Tests are how the agents check their own work. Without them, none of this is
trustworthy.

In Terminal, in your project folder, type:

```
claude
```

Press Enter. You now get a prompt where you can talk to Claude in plain English.

Type this and press Enter:

> Set up Vitest and React Testing Library in this project. Add an npm test
> script. Write three tests for the dosing calculation so I can confirm the
> setup works.

It will start working and occasionally ask permission to do things. Read what it
asks, then press **y** and Enter to allow it.

When it finishes, type `/exit`, then:

```
npm test
```

You should see tests passing. If not, go back into `claude` and tell it what
happened.

## Step 20 — Try two agents

Type `claude` again, then:

> Use the domain-verifier subagent to check every chemistry number in this app
> against docs/spec/reef-chemistry.md

Read what comes back. Then try:

> Use the dose-parity-checker subagent

**This is the moment of truth.** If these come back with specific, sharp
findings — real file names, real line numbers, real problems — the system works
and everything after this is easy. If they come back vague and waffly, stop and
show me what they said.

---

# PART F — Turn on overnight runs (a week later)

## Step 21 — Create your first routine

1. Open your browser, go to **claude.ai/code/routines**
2. Click **New routine**
3. **Name:** type `Consistency Sweep`
4. **Prompt:** open the file `routines/05-consistency-sweep.md` in your project
   folder (double-click it, or open it in TextEdit), select all the text
   (Cmd+A), copy it (Cmd+C), and paste it into the prompt box
5. **Repositories:** choose `tank-wizard`
6. **Connectors:** scroll down. Everything is switched on by default —
   **switch them all off.** These agents don't need any of them.
7. **Trigger:** choose **Schedule**, then **Daily**, then set the time to
   **2:00 AM**
8. Click **Create**

That's it. It runs tonight.

## Step 22 — Read your first morning brief

Next morning:

- Go to **claude.ai/code/routines**, click your routine, click the run to see
  what it did
- Or look in your project on github.com for `.agent/morning-brief.md`

**Important:** a green tick only means the job ran without crashing. It does not
mean it did anything useful. Read the actual brief.

## Step 23 — Add more, one at a time

Once you've read three or four briefs and they're useful, repeat Step 21 for the
others:

| Name | File to paste | Time |
|---|---|---|
| Build Cycle | `routines/01-build-cycle.md` | 10:00 PM |
| Audit Sweep | `routines/02-audit-sweep.md` | 4:00 AM |
| Attack Night | `routines/03-attack-night.md` | 4:00 AM |
| Weekly Review | `routines/04-weekly-review.md` | Sunday 6:00 AM |

Don't set Audit Sweep and Attack Night to the same night — alternate them.

---

# What you do every day after that

All of this works fine on your phone:

1. Read the morning brief
2. Go to github.com → your repo → **Pull requests** tab
3. Each pull request is a change an agent wants to make. Open it, read the
   description, and click **Merge** if you're happy or **Close** if you're not
4. That's it

---

# When something goes wrong

Copy whatever the screen says and paste it to me. Don't guess and don't push on
past an error — one broken step makes everything after it fail in confusing
ways.
