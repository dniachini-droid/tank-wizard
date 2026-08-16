# Stage 6a — where canon could not answer the question

`THE-ENGINE-PLAN-v2.md` Stage 6a. Written while building
`src/lib/classify/classify-reading.js` from `docs/spec/reef-chemistry.md` and
`docs/spec/wizard-states.md` alone, per the plan's governing rule. Nothing in
the new function was read out of the layer it replaces.

**Twenty findings.** Six are holes canon does not fill (**S**, **W**), five are
places two canon sections give different answers to one question (**T**), five
are consequences of canon as written that the owner may not have intended
(**A**), and four are scope questions that only appear once a single function
has to answer all four questions at once (**Q**).

**Nothing here was resolved.** Where the code had to do *something*, what it
does is stated under the finding and the alternative is stated beside it. Per
house rule 10 each carries options, which direction being wrong hurts, and what
would make each option wrong.

**None of these blocks Stage 6a.** The function is built, tested and green. Six
of the twenty are the reason it refuses more often than the current app does,
and that is the intended behaviour, not a shortfall — §13's last row and §22's
"Unknown refuses" are the mechanism canon provides for exactly this.

---

## S — the steadiness verdicts cannot be graded from canon at all

### S-1. §22 registers six verdicts and names no threshold for any of them

`wizard-states.md` §22 gives the six words and one sentence of prose each —
*"held inside the band, tightly"*, *"ordinary test-to-test variation"*,
*"swinging widely"*. It then says in terms: **"It does not change any
threshold, window or grading rule. It registers the words."** No section of
either canon document names a spread, a tolerance, or any figure a verdict
could be graded against.

`reef-chemistry.md` §11 confirms the hole rather than filling it:
`CONSISTENCY_RULES` "survives only where `wizard-states.md` §22's steadiness
verdicts need a spread" — canon points at a table in the old layer and does not
restate its figures. Those figures are the reasoning Stage 6a exists to stop
inheriting.

**What the code does.** `SPREAD_TOLERANCE` ships **empty**, and the verdict
refuses under §22's own rule: *"A verdict is produced only where consistency
can actually be graded. Where it cannot — no tolerance rule for the parameter …
— the surface refuses and names what is missing."* The grading tree is written
from §22's six descriptions and tested against fictional figures, so the moment
a row is supplied the verdict starts being produced. **Today, every parameter
refuses the verdict.**

**Options.**

- **(a) Dan names two figures per parameter** — the spread at or under which a
  window is *tight*, and the spread at or over which it is *wide*, both in the
  parameter's own unit. Eighteen numbers for nine parameters. Wrong if the
  spread is not actually the quantity that separates the six.
- **(b) Derive both from §5's noise floor** — e.g. tight = 2× floor, wide = 8×
  floor. One decision instead of eighteen. **Wrong for the reason §27 rule 3
  gives**: "a margin must not be defined in terms of … a kit noise floor",
  because changing what a kit can see would change what counts as steady. §27's
  rule is written about the out-of-band margins, not about this, but the fault
  it names is the same one.
- **(c) Derive both from the band width** — tight = ¼ of the range, wide = 1½
  ranges. Self-scaling to whatever the keeper set, no new figures at all.
  Wrong if a keeper who widens their range has not thereby decided that
  bouncing about matters less — which is exactly the argument §27 uses to
  refuse scaling *clearly out* to band width.
- **(d) Leave the verdict refusing** and drop the steadiness panel from the
  rebuild. Wrong because §25.2 has just decided what the panel is *for*, and
  §22 registered the six words on the argument that they "answer a question the
  seven bands cannot".

**Which direction hurts.** Grading against invented figures is the fault that
produced the 16 August contradiction in the first place. Refusing costs the
keeper a panel; guessing costs them a sentence that disagrees with the card
above it.

### S-2. Canon does not say what makes a *window* sit off the range

Three of the six verdicts turn on it — `steady-off` and `unsettled` are the
off-range pair, `dialled` and `controlled` the in-range pair. §22 says the six
are graded "from the spread or the fitted rate of the readings in
[the window] — **never from a single reading**", which rules out §26's last
reading and rules in nothing.

The only measure canon mentions is in a sentence describing the *old* verdict
being renamed — "the window **median** outside the band" — and that is
describing the behaviour being replaced, not prescribing it.

**What the code does.** The tolerance row must name the measure explicitly:
`median` | `mean` | `all-readings`. With no row, the question never arises.
**This is a menu, not a decision** — all three are implemented and none is
preferred.

**Which direction hurts.** `all-readings` is the strictest and will call a
window in-range that spent most of it out. `mean` is pulled about by one
outlier, which is the shape of thing a kit misread produces.

### S-3. `sliding` — canon defines "moving one way" and never defines "fast"

§22: `sliding` is *"moving one way, fast"*. §11 defines **moving** — the rate
limb, 0.10 dKH/day and the two weekly figures — and §27's own table calls that
"whether the movement is credible", not whether it is fast. So canon has a bar
for *moving* and no bar for *fast*, while §22 needs both: a level moving on
§11's second limb (slow but persistent) is moving and is plainly not sliding.

**What the code does.** With no tolerance row the verdict refuses, so `sliding`
is unreachable today. In the tested tree, `sliding` is §11's **first** limb —
the rate threshold — which is canon's only definition of a fast movement, and
the second limb alone never reaches it. Recorded as a derivation, not a figure.

**Options.** (a) confirm §11's rate limb is also the `sliding` bar — no new
number; (b) give `sliding` its own multiple of the rate threshold; (c) grade
`sliding` off the fitted rate against the *spread* figures of S-1 instead.
Wrong for (a) if a keeper would not call 0.11 dKH/day "fast".

---

## W — parameters canon grades nothing for

### W-1. Four parameters have no analysis window

§4 gives windows for alkalinity, calcium and magnesium. §29.7 adds phosphate
and nitrate. **Salinity, potassium, pH and ammonia have none**, so no movement
claim and no steadiness verdict can be graded over §4's window for any of them.
`.agent/gap-report.md` G-12 named three of the four; salinity is the fourth.

**What the code does.** Refuses with `no-analysis-window`, naming the
parameter. A caller may pass `windowDays` — which is exactly what §25.2's
selectable panel does — and the refusal lifts.

**Options.** (a) four more rows in §4; (b) declare that these four are watched,
not graded, and the app never claims movement about them; (c) let the panel's
selected window be the only window they ever get, which is what the code
already permits. (b) is wrong for salinity, which §18 just gave an alert tier
to and §3 gives a rate rail to — a parameter the app will act on ought to be
one it can grade.

### W-2. Five parameters have no per-day movement threshold

§11's first limb names 0.10 dKH/day, 5 ppm/week and 10 ppm/week — the three
dosed elements. **Nitrate, phosphate, salinity, potassium and pH have no rate
threshold**, so for them the first limb can never fire.

**What the code does.** Reports `limbs.rate: 'no-threshold-in-canon'` and
decides movement on the second limb alone. That limb *is* fully specified for
them — §30.1's three readings, one direction, total clearing §5's floor is
stated "once here for every parameter rather than per section" — so the answer
is an honest under-claim rather than a refusal: a parameter can be found moving
but can never be found moving *fast*.

**Which direction hurts.** A nitrate climbing steeply but non-monotonically —
up, up, down a little, up — clears no limb and is reported as not moving. On
the three dosed elements the rate limb catches exactly that case.

### W-3. Ammonia has no noise floor and no chemistry section

§5 excludes ammonia deliberately — *"graded on detectability, not on
movement"* — and records that it still has no chemistry section of its own
(G-22). So neither movement limb is available to it: no rate threshold, no
floor.

**What the code does.** Movement refuses with `no-noise-floor`, quoting §5's
reason. The band still classifies, because §18's detectability rule needs no
floor.

### W-4. Four parameters have no clearly-out margin

§27 names three, §29.3 adds two. **Salinity, potassium, pH and ammonia have
none.**

**What the code does.** `clearlyOut: null` and a refusal naming the missing
margin — but **only when the level is actually out**, since §27's audit is
explicit that the margin governs only levels already out. A potassium sitting
in range is not refused.

**Options.** (a) four more figures; (b) declare that "clearly out" is a
distinction only the five parameters with margins draw, and the wording for the
other four never escalates. (b) is cheap and defensible — §27 is a wording tier
and nothing else — but it needs saying, because a surface that expects a
boolean and gets `null` will do something with it.

---

## T — where canon answers the same question twice, differently

### T-1. §13's last row against §24.5 — does a thin series refuse the position?

§13's last row makes `insufficient-data` the answer when there are **"too few
readings"**. §24.5 is a card for exactly that state and it **states the position
anyway**: *"Alkalinity is 8.5 dKH, in your range. Two more readings will show
which way it's going"*, with the note *"It still states the position, because
the position is known."* §26 agrees with §24.5 — position is the last reading,
and one reading is one reading.

**What the code does.** Follows §24.5: with fewer than three readings the band
is classified from the last reading, and the **movement and steadiness axes
refuse and name what is missing** (`2 more readings in the 14-day window — §30.1
needs three`, plus when the next test is due, per §23 example 5). §13's
`insufficient-data` is reserved for a band that genuinely cannot be found — no
reading, no target range, an invalid configuration, or a reading beneath what
the kit resolves.

**Why it matters.** The other reading — refusing the whole classification on a
first reading — would leave a keeper who has just logged their first-ever
alkalinity test with no statement of where it sits, which §24.5 explicitly
rejects and §26 calls the one thing a test is definitely qualified to answer.

**What would make this wrong:** if §13's row was meant to cover the whole
result and §24.5 is the exception rather than the rule. One sentence in §13
settles it either way.

### T-2. §13's inclusive edges against §13's own alert rule

Two boundary rules in the same section collide on one value:

> - Band edges are **inclusive of the band they bound**: a value exactly equal
>   to the no-action lower edge is `in-band`.
> - A value exactly equal to alert-low is `alert-low`.

They meet whenever alert-low lands exactly on the range's lower edge, which is
not hypothetical: **§10 floors magnesium's alert-low at 1150, and §2 layer 3's
suggested range gives alert-low exactly 1150** — so a keeper who sets 1150 as
their minimum has one value that both rules claim.

**What the code does.** Tests the alert tier **first**, so 1150 classifies
`alert-low`. The reasoning: §22's tier rule says a position must never render
calmer than it is, and of two defensible answers the more serious is the one
that cannot get a tank killed.

**Which direction hurts.** Alert-first means a keeper whose minimum sits on the
safe bound gets "needs attention" at a reading that is, by their own range, in
range. In-band-first means the app is quiet at the level §2 calls harm.

### T-3. §18's salinity levels are strict; §13's boundary rule is inclusive

§18 sets salinity's tier at **"below 33 ppt"** and **"above 36 ppt"** — strict
comparisons. §13's boundary rule says a value **at or above** alert-high is
`alert-high`. At exactly 36.0 the two disagree, and the app's shipped salinity
range is 34–36, so 36.0 is a value a keeper will actually record.

**What the code does.** Follows §13, which calls its boundary rules "fixed, no
exceptions": 36.0 classifies `alert-high`. Note the consequence — at 36.0 the
band is `alert-high` while `out` is `false`, because §27 measures out against
the keeper's own edges and 36.0 is on the edge, not past it. **A reading that
needs attention and is not out of range is a state no card in §24 covers.**

**Options.** (a) read §18's "below/above" as the loose form and let §13 govern
— what the code does; (b) treat §18's two fixed levels as strict and exempt
them from §13's boundary rule, which means §13 has an exception after all;
(c) move salinity's default range so its upper edge is not its alert level.

### T-4. §11's "total movement" — slope × window, or last minus first?

§11's rule says the second limb fires where "the direction has held
consistently across the window and **the total movement over it** clears §5's
noise floor", and its explanation says "slope **times** window, not slope
alone". §30.1 sets the same bar as "three readings, one direction, and total
movement clearing §5's noise floor", and adds that "**it is a claim about
consecutive readings, not about a fitted line**, which is why it is a count and
a floor rather than a significance test".

Slope × window and last-minus-first agree closely on a monotone series and part
company on a noisy one.

**What the code does.** Last minus first, following §30.1, because §30.1 is the
more specific rule and rules out the fitted line in terms. §11's fitted rate is
still computed and still drives the first limb.

**Which direction hurts.** Slope × window is the more forgiving of a single
misread at either end of the window; last-minus-first is the more literal about
what the keeper actually measured.

### T-5. §26 says the trend is fitted "over the correction-adjusted window"

§26 keeps trend, direction and consumption fitted, and says the fit is over the
**correction-adjusted** window of §6 — the series with logged corrections
subtracted. A classifier that is given readings has no corrections to subtract
and no dose to subtract them with.

**What the code does.** Fits the readings it is given, and documents that a
caller holding a correction log should pass the adjusted series. **This is an
interface question, not a chemistry one**, but it needs an owner: if 6b or 6f
wires `classifyReading` straight to raw readings, the movement claim will
disagree with the engines' trend on any tank with a logged correction — which
is precisely the class of disagreement §26 was written to end.

---

## A — consequences of canon as written, which may not be intended

### A-1. Canon names no detection limit for ammonia

§18's tier is "anything detectable … above whatever the kit can resolve", and
§5 records that ammonia has no floor. So "detectable" has no figure behind it.

**What the code does.** Reads a recorded value **greater than zero** as
detectable. A keeper who logs 0.00 is in range; a keeper who logs anything at
all is at the alert tier.

**Which direction hurts.** A keeper whose kit shows the faintest tint and who
records 0.01 gets the same tier as one at 0.5 ppm — correct under §18 as
written, and worth confirming it is meant.

### A-2. §18's default alert offsets forbid a wide target range

§18 hangs alert-low at midpoint − 1.0 dKH and says classifyReading must refuse
a configuration where the bands and the alert thresholds overlap. Together those
mean **any alkalinity range wider than 2.0 dKH is a configuration error** with
the defaults — its own lower edge sits below its alert level. The same holds at
100 ppm for calcium and 400 ppm for magnesium.

§2 permits a target range anywhere inside 7–11 dKH, so a keeper running
7.4–9.6 has set a legal range that §18's defaults invalidate.

**What the code does.** Refuses with `range-configuration`, naming both figures.
The shipped defaults (8.2–8.8, 400–450, 1275–1425) are all comfortably valid;
this bites only a keeper who widens their range a long way.

**Options.** (a) accept it — a range that wide is arguably a keeper telling the
app they do not want an alert tier, and refusing is honest; (b) clamp the
derived alert to the range's edge instead of refusing, as §10 already does for
magnesium's floor; (c) make the offsets proportional to the range, which §27's
third rule argues against for its own margins.

### A-3. A reading below the kit's resolution refuses, and phosphate zero is the case

§5 gives phosphate 0.01 ppm as "the kit's own resolution … anything smaller is
beneath measurement". Read as a rule about *levels* rather than about
*movement*, a phosphate logged as 0.00 — which is a normal thing for a keeper
running a lean tank to record — is beneath measurement and cannot be placed.

**What the code does.** Refuses the whole result with `below-resolution`, naming
the resolution. **The cost is concrete: §29.4's phosphate-low warning fires
below 0.03 ppm, and a 0.00 reading is the clearest case it exists for.** The
warning is Stage 6e's, not this function's, so nothing is broken today — but if
6e reads its input from here, the warning goes quiet at exactly the reading that
should trigger it loudest.

**Note what canon actually says.** §5's sentence is about movement — "Movement
smaller than this is the kit, not the tank. No trend, verdict or dose change may
be founded on a difference below the floor." The level reading is an extension
of it, warranted by phosphate's own paragraph and by §18's ammonia rule, and it
is the one place in this function where the code goes past the letter of canon.

**Options.** (a) confirm the refusal and have §29.4 read the raw reading rather
than the classification; (b) scope the floor to movement only, as §5's sentence
literally does, and let a 0.00 phosphate classify `out-of-band-low`; (c) refuse
only where the reading is strictly between zero and the floor, treating an
exact zero as a real measurement of "nothing detected". **(b) is the smallest
reading of canon and (a) is the safest; the code currently does neither
cleanly** — it does the strict form, which is (a) without (a)'s second half.

### A-4. §13 lists "missing volume" as a cause of `insufficient-data`

§13's last row: "cannot classify (missing target range, **missing volume**, too
few readings)". Net volume (§17) is a dosing input — it is required before the
app may compute a millilitre figure. Nothing in classifying a reading against a
range needs it.

**What the code does.** Does not take a volume and never refuses for want of
one. Recorded because a checker written against §13's text would look for it.

### A-5. §13's `drifting` has no proximity test

§13: `drifting` is "inside the band, but trending toward an edge". Every
movement inside a range is toward one edge or the other, so read literally,
in-range **and moving** is `drifting`, with no requirement that the level be
anywhere near an edge.

**What the code does.** Exactly that: in range and moving → `drifting`; in range
and not moving → `in-band`. A level sitting dead centre and creeping is
`drifting`.

**Options.** (a) confirm — the trend is the information and where it sits inside
the range is not; (b) require proximity, for which the app already has a figure
in a neighbouring rule (§26 names a 12%-of-band `nearEdge` proximity, untouched
by this stage). **(b) would need §26's figure re-authorised for a new use**,
which §27 rule 3 is precisely about.

---

## Q — scope questions a single classifier is the first to hit

These are not gaps in canon so much as questions nobody had to ask while
sixteen classifiers each answered a slice of it.

### Q-1. Do §22's data requirements apply to a movement claim?

`reef-chemistry.md` §22 requires "at least 3 readings spanning at least **6
days**" and §19 forbids computing a rate "from readings less than 2 days
apart" — both scoped to a **consumption rate**. §11's movement rule and §30.1's
evidence bar impose a count and a floor and no span at all.

Canon's own worked case sits on the question: §11 illustrates the second limb
with "0.02 dKH/day for three days is noise", which is three readings spanning
two days — inside §19's minimum and well inside §22's six.

**What the code does.** Applies the count (three readings, §30.1 and §12) and
no span requirement, because both span rules name the consumption rate and this
is not one. **Recorded rather than decided.**

### Q-2. Which window does `classifyReading` grade over?

§4's analysis window is what the wizard's arithmetic runs on. §25.2, amended the
same day, has the steadiness panel grade **the window the keeper selected** and
name it in its heading. Both are canon and they are different windows.

**What the code does.** Defaults to §4's window and accepts a caller-supplied
one, reporting which window it actually graded on every result — which is
§25.2's rule 1 turned into a field. The caller decides; the answer never
silently disagrees with its own heading.

### Q-3. Does a kit change end the window, or split it?

§19 and §23 example 6 say the series splits at a recorded kit change, with "no
trend across the boundary; fresh baseline requested". Canon does not say whether
the reading *at* the change belongs to the old series or the new one.

**What the code does.** Treats the change as the start of the new series — the
reading at that timestamp is the fresh baseline — so a kit change two readings
ago leaves two readings and the movement claim refuses, which is example 6's
"fresh baseline requested" in the shape of a refusal.

### Q-4. Nothing in canon says which surface calls this function

The plan settles it (6f), and §11 of `wizard-states.md` — the single-source rule
— says no surface may classify. Recorded only because Stage 7's proposed check
("no comparison against `def.min`/`def.max` outside `classifyReading`") needs a
list of the call sites it is enforcing against, and that list does not exist
yet.

---

# In plain terms

*Per house rule 11 — the same report, without a single code word.*

## What this was

The plan says the new layer must be built from your own written rules and
nothing else, because the whole point is to stop copying the reasoning we are
replacing. So the first piece — the one thing that decides where a reading sits
— was written that way, and this is the list of every question your rules could
not answer.

Twenty of them. The function is built and working regardless; where your rules
run out it says so out loud rather than making something up.

## The big one: how steady is steady?

You have six phrases for how settled a parameter has been — dialled in, well
controlled, steady but running high, unsettled, wide swing, moving fast. They
are written down and they are yours.

**What is not written down anywhere is how much movement earns each one.** How
tight is tight? How wide is a wide swing? Your rules say, in as many words, that
registering the six words does not set any threshold — and the only numbers that
ever answered it live in the old code we are throwing away.

So right now the app can tell you where your alkalinity is and whether it is
moving, and when you ask how steady it has been it says it cannot grade that
yet. That is deliberate and it is reversible the moment you give two numbers per
parameter: how much spread counts as tight, and how much counts as wild.

There is a related one. Three of the six phrases are about being settled *off*
your range. Nothing says whether that means the middle reading of the period was
off, the average was off, or every single reading was off. Those give different
answers on a tank that spent half the month out and half in.

## Four parameters the rules skip

Salinity, potassium, pH and ammonia have no stated period to judge them over —
alkalinity gets a fortnight, calcium and magnesium a month, and those four get
nothing. Five parameters have no "this is fast" figure. Four have no "this is a
long way out" figure. Ammonia has no figure for what counts as a real change at
all, which your rules say is on purpose, because ammonia is about whether there
is any rather than how much it moved.

None of that is broken — the app refuses and says which figure is missing
instead of borrowing another parameter's.

## Five places your rules answer the same question twice

The interesting ones:

**A single test.** One rule says the app cannot classify a reading until it has
three. Another — the card you wrote for exactly that situation — says
*"alkalinity is 8.5, in your range, two more readings will show which way it's
going"*, and notes that it still states the position because the position is
known. The code follows the card: it tells you where you are, and refuses only
the part about which way you are heading.

**Magnesium at 1150.** That figure is both the bottom of a sensible range and
the level your rules call act-now. A reading of exactly 1150 is claimed by two
rules that disagree. The code says "needs attention", on the grounds that of two
defensible answers the more cautious one cannot get anything killed.

**Salinity at exactly 36.** Your alert rule says "above 36", your boundary rule
says "at or above" — and 36 is the top of the app's own salinity range. So at
36.0 the app currently says the level needs attention while also saying it is
not out of your range, and there is no card written for that combination.

## The one place the code goes past what you wrote

Your rules say a phosphate kit reads to 0.01 and anything smaller is beneath
measurement. The new function takes that seriously and refuses to place a
phosphate reading below 0.01 — including a reading of zero.

**That has a cost worth knowing about.** You have a fixed warning for phosphate
below 0.03, and a reading of zero is the clearest case it exists for. If the
warning ends up reading its input from this function, it will go quiet at
exactly the reading that should set it off loudest. Nothing is broken today,
because that warning is built in a later step — but somebody has to decide
whether "beneath measurement" is a rule about levels or only about changes.

## What nothing here changes

The dosing arithmetic is untouched, the five-thousand-tank fingerprint has not
moved, and nothing in the app calls the new function yet. Every one of these
twenty is a question for you, not a fault in the build.
