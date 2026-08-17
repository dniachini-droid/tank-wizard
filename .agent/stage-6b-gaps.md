# Stage 6b — where canon could not answer the question

`THE-ENGINE-PLAN-v2.md` Stage 6b. Written while building
`src/lib/notices/notice-model.js` from `docs/spec/wizard-states.md` §20 and
§25.1, `docs/spec/wizard-states.md` §25.4, and
`docs/journeys/journey-4-notifications.md` as the account it came from, per the
plan's governing rule. Nothing in the new module was read out of
`buildFindings` or `narrative-engine.js`.

**Seven findings.** Two are places two canon sections leave one question
unanswered between them (**C**), three are consequences of canon as written that
the owner may not have intended (**A**), and two are scope questions a single
notice model is the first to hit (**Q**).

**Nothing here blocks Stage 6b or 6c.** The module is built, tested and green;
where canon is silent it **reports rather than decides**, and the two silences
that could change behaviour are returned in the result as `gaps` so a caller
cannot mistake the fallback for a rule.

**Canon answered more than 6a's canon did.** Journey 4's five open questions are
now four-fifths settled by §20 and §25.1 — question 1 (what counts as one topic)
is the parameter, question 4 (should some notices be unhideable) is answered no
with no exceptions, and question 3 (what Setup's hidden list becomes) is answered
by §25.1's hidden section. That is worth recording because it is the opposite of
the 6a experience.

---

## C — where two sections leave one question between them

### C-1. Off is per parameter; a relationship notice has no parameter

§25.1 settles that **a notice type is a parameter**, with one switch per
parameter that "turns off everything that parameter would say" and has no
exception list. §25.4 kind 3 is the small set of notices that **"genuinely
belong to no single parameter"** and get their own tier for exactly that reason.

**Neither section joins the two up.** A keeper who switches magnesium off has
said they do not want the app commenting on magnesium; the magnesium gate notice
(§25.4's own worked example, *"Magnesium is low at 1180 ppm — alkalinity and
calcium corrections are held until magnesium comes up"*) names magnesium and is
tier 3.

**What the code does.** `isOff` returns false for every relationship notice, so
the notice stays live, and `buildNoticeList` returns `gaps: ['relationship-notice-vs-off']`
whenever an off parameter is named by a live relationship notice. **The fallback
is the quieter-is-worse direction on purpose** — §25.1's off switch is about the
app commenting on *a parameter*, and a relationship notice is a claim about two.

**Options.** (a) a relationship notice is silenced when **any** parameter it
names is off — simple, and it lets one switch silence a notice about a second
parameter the keeper never switched off; (b) silenced only when **every**
parameter it names is off — harder to reach and never surprising; (c) never
silenced by a parameter switch, and relationship notices get their own switch —
which is a new notice type and §25.1 says a type is a parameter.

**Which direction hurts.** (a) can silence the magnesium gate for someone who
turned magnesium off and still doses alkalinity, which is the case the gate
exists for. (c) adds a control to a screen §21 keeps deliberately thin.

### C-2. §20 allows one notice per parameter; §25.4 has two kinds that are per parameter

§20: **one live notice per parameter**, and its content is the engine's current
verdict. §25.4 lists three kinds, and **two of them are per parameter**: kind 1,
the verdict, and kind 2, a suspect reading, which "belongs to its parameter".

A suspect reading and a verdict about the same parameter can both be true at
once — in fact the worked example makes them likely to co-occur, since a reading
that looks unusual is also a reading that classifies somewhere. **Canon does not
say which is the one live notice.**

**What the code does.** Keeps the caller's first and returns
`collisions: [{ key, parameter, kinds }]`. **It does not invent a precedence
rule**, because §25.4 left the question open and a model that silently preferred
one kind would be deciding it.

**Options.** (a) the suspect reading wins, on the argument its own wording makes
— *"worth retesting before acting on it"* casts doubt on the very reading the
verdict is computed from, so showing the verdict first is showing a conclusion
drawn from a number the app has just called into question; (b) the verdict wins,
because §20 says a notice's content **is** the verdict; (c) a suspect reading is
not a notice at all but a modifier on the verdict's wording, which is 6c's
problem and removes the collision.

**(a) is the strongest on canon's own words** and is not taken, because it is an
argument from a card's phrasing rather than from a rule.

---

## A — consequences of canon as written

### A-1. Hiding a relationship notice hides it once, and canon says the scope is open

§25.4 records it directly: *"whether hiding one hides it for both parameters it
names is a question about hiding rather than about placement"* — G-26's second
question, explicitly not closed.

**What the code does.** Hides it as **one notice**, keyed on its own id, which is
what §20 says a notice is and what the tier-3 slot implies. Reports
`gaps: ['relationship-notice-hide-scope']` when a hidden relationship notice
names more than one parameter, so the fallback is visible.

**Why it matters more than it sounds.** If hiding a relationship notice also
suppressed the two parameters' own verdicts, hiding one thing would silence
three, and §20's resurfacing rule would have three signatures to track instead of
one. The single-notice reading is the conservative one.

### A-2. `unhideAll` cannot be partial, and that is a consequence of hiding being global

§25.1 has the hidden list unhidden "one at a time or all at once", and §20 makes
hiding global — one store, no surface dimension. So *all at once* is
unambiguous: it empties the store.

**What the code does.** `unhideAll()` returns `{}` and takes no argument.
**Recorded because it looks like a missing parameter and is not one** — a
per-surface or per-tier unhide-all would reintroduce the surface dimension §20
removed, which is journey 4 problem 1.

### A-3. A notice for a parameter with no target range has no proportional distance

§25.1 ranks tiers 1 and 2 by distance past the nearer edge over the range width.
**Ammonia has no range** — §32.1, its target is zero and §13 does not classify
it — and it enters at tier 1 whenever it is detectable.

**What the code does.** `proportionalDistance` returns **0** where there is no
usable range, so ammonia sorts by the fixed order among alerts, where it is
last. §25.1 addresses the placement directly and calls it correct — *"ammonia is
last in the fixed order and is never disadvantaged by it"* — but it argues from
tier, not from the ranking key inside the tier.

**The consequence, stated:** a detectable ammonia sorts **below** any other alert
that is measurably past its edge, and a tank with ammonia and an alert-low
alkalinity names alkalinity first. Whether that is intended is worth a look,
because ammonia is the parameter with the shortest path from a reading to a dead
tank. **Not changed here** — canon's fixed order is explicit and the fix, if one
is wanted, is a sentence in §25.1 rather than a special case in the ranker.

---

## Q — scope questions a single notice model is the first to hit

### Q-1. Nothing says whether a hidden notice survives a reload

Journey 4's open question 5, never answered: *"Does hiding survive a reload, and
should it?"* §25.1 puts the hidden list in the tank summary and in Setup, which
implies persistence, and no section says so.

**What the code does.** Nothing — the model is pure and takes the store as an
argument. **Persistence is the caller's**, which is 6f's wiring and the storage
contract at §18. Recorded so the question is answered deliberately there rather
than by whichever component happens to hold the state.

### Q-2. The order within tier 3 stops one step short of a total order

§25.1 derives that relationship notices "order among themselves by the earliest
parameter they name". **Two relationship notices naming the same earliest
parameter have no stated order** — the magnesium gate and a hypothetical second
magnesium relationship notice would tie.

**What the code does.** Falls back to comparing ids, which is deterministic and
arbitrary. §25.1's own argument for the fixed order — *"a list whose order
changes without the tank changing is a list a keeper cannot learn"* — demands
determinism and does not care which way. **The tie is unreachable today** with
one relationship notice registered; it is recorded because tier 3 is described
as a set that will grow.

---

# In plain terms

*Per house rule 11 — the same report, without a single code word.*

The notice model is the piece that decides **what the app tells you about, and in
what order** — and, just as importantly, what it stops telling you about when you
hide something or switch it off. It is built and it works. This is the list of
questions your written rules could not answer while it was being built, and
there are far fewer than last time: seven, against twenty for the previous piece.

**The two that could change what you see.**

You can switch a parameter off, and that turns off everything the app would say
about it. But a few notices are about **two** parameters at once — the one that
says magnesium is low so your alkalinity corrections are on hold, for instance.
Nobody has said whether switching magnesium off should silence that. Right now it
does not, on the grounds that the notice is also about alkalinity, which you did
not switch off. If you would rather one switch silenced everything mentioning
that parameter, say so and it is a small change.

The other: the app can tell you where a parameter sits, and it can separately tell
you a reading looks odd and is worth retesting. Both are about the same parameter,
and your rules allow one notice per parameter. Nobody has said which wins. There
is a decent argument that the retest warning should, because it casts doubt on the
very number the other one is computed from — but that argument comes from how a
card is worded rather than from a rule, so the code keeps them both visible to
whoever calls it and refuses to pick.

**One worth a glance.** Ammonia sorts last among urgent notices, because your
fixed order puts it last and it has no range for the app to measure "how far out"
against. Your rules address this and call it fine — ammonia gets in at the urgent
tier, which is what matters. But it does mean a tank with detectable ammonia and a
very low alkalinity names alkalinity first, and ammonia is the one with the
shortest path to a dead tank. Nothing is broken; it is a sentence in your rules if
you want it different.

**And one thing nobody has ever decided:** whether hiding a notice survives
closing the app. Your rules put the hidden list on two screens, which implies it
does, and never actually say so. The model does not decide it either — it will be
decided when the app is wired to this, and it should be decided rather than
inherited from whichever screen happens to hold it.
