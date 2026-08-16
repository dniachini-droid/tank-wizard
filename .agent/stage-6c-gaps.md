# Stage 6c — where canon could not answer the question

`THE-ENGINE-PLAN-v2.md` Stage 6c. Written while building
`src/lib/messages/message-layer.js` from `docs/spec/wizard-states.md` §24, §23,
§25, §14 and §15 alone, per the plan's governing rule. Nothing was read out of
`narrative-engine.js` — §24 says in terms that "where a card here and a current
app string differ, the card wins and the string is a finding", so a layer built
from the app's strings would have been building the findings.

**Nine findings.** One is a composition canon specifies two ways (**C**), five
are situations canon words in one direction and not the other (**D**), and three
are consequences of canon as written (**A**).

**Nothing here blocks 6c or 6d.** All twenty-seven cards render, and every one is
asserted against §24's own quoted string. Where canon has not worded something,
**the layer refuses and names it** rather than composing a sentence — that is the
whole design, and the refusals are what this report is mostly about.

**The governing rule, restated, because it is what produces most of these.** §24
calls its cards "the reference wording". A sentence this layer wrote would be a
second reference minted by an implementer, which is what §25.1's first rule and
§11's single-source rule both exist to stop. So the layer substitutes **figures**
and **the parameter** — the two things §24's preamble authorises — and nothing
else.

---

## C — where canon specifies one thing two ways

### C-1. §25.1's collapsed headline: two clauses, or one list?

§25.1's slot table reads as **two clauses**: slot 1 is "the worst parameter whose
§13 band is `alert-*` or `out-of-band-*`", slot 2 is "the remaining out-of-range
parameters under the naming rule, and parameters that are **moving**".

Its naming rule reads as **one list**: *"One, two or three parameters out of
range: each is named. Four or more: the worst two are named, followed by 'several
others'."* That is a rule about the whole out-of-range set, not about a
leftover.

**The two readings produce different sentences**, and the two-clause one does not
survive its own second parameter:

> *"Alkalinity is out of range, and calcium and magnesium are out of range."*

**What the code does.** Takes the **one-list** reading, so the out-of-range
parameters compose a single clause and slot 2 carries only the movement half:

| Out of range | Rendered |
|---|---|
| one | *Alkalinity is out of range.* |
| three | *Magnesium, calcium and alkalinity are out of range.* |
| four | *Nitrate, magnesium and several others are out of range.* |

**Why this reading.** It reproduces canon's **only worked example** exactly —
*"Alkalinity is out of range, and several others are moving — a dose change is
still settling."* — and that example has exactly one parameter out of range, so
it cannot distinguish the readings on its own. The two-clause reading repeats the
predicate at two-out-of-range, which is the commonest multi-parameter case on a
real tank.

**What would make this wrong:** if slot 1 is meant to be a genuinely separate
claim — *the worst thing now* as its own sentence — with slot 2 a different kind
of statement about the rest. Then the repetition is intended and the fix is
wording, not structure. **One sentence in §25.1 settles it.**

---

## D — situations canon words in one direction only

§24 authorises two substitutions in terms: **the parameter** ("the same shapes
apply to calcium and magnesium in their own units") and, on 24.13 alone,
**direction** ("a correction that pushed upward risks continuing upward, so it
says *rising*; a downward correction says *falling*").

**Everywhere else the mirror is not written**, and the layer refuses it with
`no-canon-wording-for-direction`, naming the card and the direction. These are
the five, and **each is a real state a real tank reaches.**

### D-1. 24.2 — "in range but falling" has no rising twin

A level inside its band and **rising** faster than the dose accounts for is
24.24, which is a different card with a different subject (the dose is
unchanged). A level in range and rising **because the dose is now too high** has
no card. The mirror of 24.2's support sentence would need "above what the tank is
using" and "would match it" unchanged.

### D-2. 24.3 — "steady at 8.0, below your range" has no above twin

`off-target` above the range is `reef-chemistry.md` §28.3's own worked case —
*"455 ppm"* — and §28.2's return-plan condition is symmetric, so the card's offer
applies. **The wording is not.** This is the most consequential of the five,
because it is the one where canon's neighbouring section supplies the situation
and expects a card.

### D-3. 24.17 and 24.18 — "below your range" has no above pair

Recovering and worsening are branch 21a and 21b, and §2 records them as live in
code. A level **above** its range and coming back, or above and still rising, is
the same branch with the sign flipped and has no wording.

### D-4. 24.19 and 24.20 are a direction pair, and they are not the same pair

24.19 is `fell-short` **below**, 24.20 is `overshot` **above** — so both signs
appear, but they are two different states, not one state in two directions.
`fell-short` above the range (a downward change that did not go far enough) and
`overshot` below it are the two unwritten quadrants.

### D-5. 24.7, 24.8 and 24.22 — the contradiction states are three of four signs

24.7 is *raised and still falling*, 24.22 is *lowered and still rising*, 24.8 is
*changed and nothing moved*. The fourth sign — lowered and still falling, i.e. a
decrease that overshot in the direction it was aimed — is 24.20's territory and
canon assigns it there, so this one is probably complete. **Recorded as checked,
not as missing.**

**Which direction hurts.** Refusing costs a keeper a card in a state the app can
detect, which reads as the app going quiet. Composing the mirror costs a second
reference wording that §24 does not carry and that nothing checks against — and
canon's own history is that the second wording drifts. **Refusing is the right
default and it is not a good permanent answer**; these five are wording work for
the owner, of exactly the kind §24 itself is.

---

## A — consequences of canon as written

### A-1. Canon sets no display precision for any parameter

§13 says "Classification never rounds. **Display rounds**" and names no figure;
§23.4 mandates the unit and says nothing about decimals. So *8.5 dKH* against
*8.50 dKH* is undetermined, and it is visible in every card.

**What the code does.** Takes the precision from the parameter's own `step` where
the caller supplies one, and otherwise prints the value as given. **It never
picks one of its own.** The cards in the tests supply `step: 0.1` for alkalinity,
which is `PARAM_DEFS`' figure — that is the caller's fact, not this layer's
constant.

**Worth deciding before 6f**, because `step` is currently a display fact living
in `PARAM_DEFS` and canon has never ratified it as one.

### A-2. 24.9 and 24.23 differ only in a figure, and the placement is the whole distinction

Rendered side by side, the two cards are *"Alkalinity is very low at 6.8 dKH"*
and *"…at 6.9 dKH"*. **§24.9 is the dashboard's and §24.23 is the wizard's**, and
after Stage 5c that is the entire mechanism keeping them apart — the regex at
`narrative-engine.js:457-459` goes.

**What the code does.** Carries `surface` on both cards, from `CARD_SURFACE`, and
carries no rule about the other. **The layer cannot enforce the placement**; only
a caller can, by asking for the right card. Recorded because the deleted regex
*was* the enforcement, and deleting it without an assertion elsewhere leaves the
rule with nothing holding it — §10's "a rule with no checker is an intention".
**TW-087 should carry that check.**

### A-3. §24.23's offer uses the return plan's registered phrase, and §28.2 may not permit it

Carried in canon already — §25.6 item 7, and §24.3 names it "the known
exception". §24.3 states the rule the code enforces: the offer appears on
**exactly** 24.3 and 24.27, and "a fourth card acquiring it is a finding".

**What the code does.** Exports `RETURN_PLAN_CARDS` (24.3, 24.27) and
`RETURN_PLAN_EXCEPTION` (24.23) separately, and a test asserts the offering set is
exactly those three. **The exception is named rather than absorbed**, so if §28.2
is widened or 24.23 is reworded, the constant that changes is the one that should.

---

# In plain terms

*Per house rule 11 — the same report, without a single code word.*

The message layer is the piece that turns "your alkalinity is 8.0 and steady" into
the actual sentence you read. All twenty-seven of your cards now come out of it,
and each one is tested against the exact words you wrote — not against something
similar, against the string itself. If anyone changes a word, the test fails.

**The rule it is built on:** it never writes a sentence. It fills in your
sentences with numbers. Where you have not written a sentence for a situation, it
says so and stops, rather than composing something that sounds like you.

**That produces the main thing to tell you.** You wrote most cards for one
direction — falling, or below your range — and the tank reaches the opposite just
as often. Five cards have no opposite:

- in range but **rising** (you wrote the falling one)
- steady and **above** your range (you wrote below — and your own chemistry rules
  work through the 455 ppm calcium version of exactly this, so the situation is
  already in canon; only the card is missing)
- above your range and coming back, and above and still climbing (you wrote both
  below versions)
- a change that did not go far enough **downward**, and one that overshot
  **downward**

None of this is hard — they are your own sentences with two or three words
flipped — but flipping them is writing, and writing cards is your job, not the
code's. Until then the app will say nothing in those states rather than guess.

**One thing I had to choose, and you should check.** Your summary headline rule
describes three slots, and separately says how to name parameters when several are
out of range. Read strictly as slots, two parameters out of range gives you
*"Alkalinity is out of range, and calcium is out of range"* — which nobody would
write. Read as one list it gives *"Alkalinity and calcium are out of range"*. I
took the list, because it reproduces your own worked example exactly. One sentence
from you settles it either way.

**And one small thing nobody has ever decided:** how many decimal places a number
gets on screen. Your rules say classification never rounds and display does, and
never say to what. The layer takes it from whatever the caller hands it and
invents nothing, but somebody should nail it down before the app is wired to this.
