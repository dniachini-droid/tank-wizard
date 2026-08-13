# Getting Tank Wizard Out Of Claude And Onto Your Mac

This slots into the main guide. Do it like this:

1. **Part B (steps 1–9)** of the main guide first — install everything
2. **Then this document** — it replaces steps 10 and 11
3. **Then Step 12** of the main guide onward

Right now Tank Wizard is code sitting inside a chat. By the end of this it'll be
a real project folder on your Mac that can build and run.

---

# PART 1 — Get the code out of the chat

## Step A — Find the latest version

1. Open **claude.ai** in your browser on the Mac (not your phone — you need to
   copy text)
2. Find the chat where you built Tank Wizard
3. Scroll to the **most recent** version of the app. If you built it over many
   messages, you want the last one, not the first.
4. Click on it. It opens in a panel on the right side of the screen.

If there's a small version selector at the top of that panel (something like
"Version 12 of 12"), make sure it's on the last one.

## Step B — Copy the code

At the top or bottom of that panel there are some small buttons. One of them is
**Copy** (two overlapping squares icon). Click it.

The whole code is now on your clipboard.

**If you see a Download button instead, even better** — click that, and skip to
Step D.

## Step C — Paste it into a file

1. Press **Cmd+Space**, type **TextEdit**, press Enter
2. TextEdit opens. Click **New Document** if it asks.
3. **This bit matters:** in the menu bar at the top, click **Format** → **Make
   Plain Text**. If it says "Make Rich Text" instead, it's already plain — good.
4. Click into the blank document and press **Cmd+V** to paste
5. Press **Cmd+S** to save
6. In the save box:
   - **Save As:** type `tank-wizard-code.txt`
   - **Where:** choose **Desktop**
   - Click **Save**
   - If it warns you about plain text or encoding, click **OK** or **Use UTF-8**

You should now see `tank-wizard-code.txt` on your Desktop.

## Step D — If you have more than one artifact

Did you build Tank Wizard as several separate files in Claude? Repeat Steps A–C
for each one, saving each with a name that tells you what it is:

- `tank-wizard-code.txt`
- `tank-wizard-dosing.txt`
- `tank-wizard-storage.txt`

...and so on. Put them all on the Desktop. Don't worry about getting the names
right — we just need them all saved somewhere.

**Also check other chats.** If you built parts of it across different
conversations, get those too. Missing a file now means confusion later.

---

# PART 2 — Make it a real project

## Step E — Create the folder

Open Terminal (Cmd+Space → Terminal). Type each of these, pressing Enter after
each:

```
mkdir ~/Documents/tank-wizard
```

```
cd ~/Documents/tank-wizard
```

Nothing visible happens. That's fine — you've made a folder and moved into it.

## Step F — Move your code files in

```
mv ~/Desktop/tank-wizard-*.txt .
```

Press Enter. (That last full stop is part of the command — don't leave it off.)

Check they arrived:

```
ls
```

You should see your `.txt` file or files listed.

## Step G — Let Claude Code build the project around your code

This is the part that would take you fifty commands to do by hand. Claude Code
does it for you.

Type:

```
claude
```

Press Enter. You'll get a prompt where you can type in plain English.

Now type this message (or copy and paste it):

> The .txt files in this folder contain my React app, Tank Wizard — a reef
> aquarium management progressive web app that I built as Claude artifacts.
>
> Please set this up as a proper project:
> 1. Read the .txt files to see what the app is and what libraries it uses
> 2. Scaffold a Vite + React project in this folder
> 3. Install every dependency the code actually needs, including Tailwind if the
>    code uses Tailwind class names
> 4. Split the code into sensible files under src/ with proper .jsx extensions
> 5. Make it work as an installable PWA with offline support
> 6. Add a .gitignore
> 7. Get `npm run build` and `npm run dev` both working
> 8. Delete the .txt files once their contents are properly in place
>
> Tell me if anything in the code looks incomplete or is missing a file.

Press Enter.

**It will work for several minutes.** It'll ask permission for things along the
way — read what it's asking, then press **y** and Enter to allow it.

## Step H — Check it actually runs

When Claude Code says it's finished, type:

```
/exit
```

Then:

```
npm run dev
```

You'll see some text including a web address like `http://localhost:5173`.

**Hold Cmd and click that address.** Your browser opens and Tank Wizard should
appear.

- **It loads and works** → excellent. Go back to Terminal and press
  **Ctrl+C** (Control, not Command) to stop it. Move to Step I.
- **It's broken or blank** → type `claude` again, describe exactly what you see,
  and let it fix things. Repeat until it loads.

## Step I — Check it builds

```
npm run build
```

This should finish without errors. If it doesn't, go back into `claude` and
paste the error.

---

# You're now caught up

Your app is a real project on your Mac at `~/Documents/tank-wizard`.

**Go back to the main guide and continue from Step 12** (`git init`).

One change: when Step 11 tells you to drag the folder into Terminal, you don't
need to — you're already in the right place. If you've closed Terminal since,
just type:

```
cd ~/Documents/tank-wizard
```

---

# Things that might go wrong here

**"I can't find the Copy button."** Some artifacts show the buttons only when
you hover your mouse over the panel. Move your cursor over the code and look
again at the top-right corner.

**"The code is enormous and TextEdit is struggling."** That's fine, it'll cope.
Just wait for it to finish pasting before you save.

**"I don't know if I've got all the files."** Get what you can. Step G asks
Claude Code to tell you if anything looks missing — it's quite good at spotting
a reference to a file that isn't there.

**"It says my code uses a library it can't install."** Paste the exact message
to me. Some artifact libraries have different names outside artifacts, and a few
need substituting.

**"Nothing looks like my app when it loads."** Artifacts run in a slightly
different environment to a real browser page. Small visual differences are
normal and fixable. A completely blank page is not — tell Claude Code what you
see.
