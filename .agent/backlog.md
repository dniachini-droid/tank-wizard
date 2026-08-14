# Backlog

Ordered. Top = next. **Only `[approved]` items may be implemented.**

## Approved for implementation

- [ ] [approved][chem] TW-001 Add net-volume field; every dose calc uses net, not gross
      why: dosing on gross 77 L overdoses by the displacement fraction
      spec: docs/spec/reef-chemistry.md#17-net-volume
      owner: implementer

<!-- 2026-08-14: TW-026, TW-027 and TW-028 moved here from "Needs Dan's
     approval" and marked [approved]. The only blocker recorded against all
     three was the missing canon entry, and Dan wrote it — the Reef Chemistry
     Engine, now reef-chemistry.md §25 and wizard-states.md §19/§20, folded in
     from docs/spec/DECISION-reef-chemistry-engine.md (deleted; it was never
     canon while it sat loose in docs/spec/). Their full text is unchanged
     below apart from the spec:, owner: and UNBLOCKED lines — everything each
     item established about the code still holds and is still the starting
     point. Still phase 8b: approved, ordered 026 → 027 → 028, not next.
     Note what the canon entry does NOT settle, because both items lean on it:
     journey 4b's evidence figures (three readings for movement; two readings
     24 h apart and 0.2-0.3 dKH to contradict a dose change) are journey
     material, not canon, and §25 says so in as many words. Neither item
     carries [chem], deliberately — the routing, the states and the
     enforcement may be built; a new chemistry constant may not be minted from
     them (AGENTS.md rule 3). If one turns out to be unavoidable, escalate to
     .agent/needs-dan.md with 4b's open questions 2-5 attached. -->

- [ ] [approved] TW-026 `doseStatus` cannot express four cells of the journey-4b matrix
      phase: 8b — approved, first of the three, not next.
      UNBLOCKED 2026-08-14 — canon exists. wizard-states.md §19 puts these
      states in the engine rather than the notification layer, and §11's new
      single-source row makes `deriveTankState` the one place a parameter is
      assessed. The four cells are states of the engine's verdict, which is
      what this item always argued.
      why: journey 4b lays out a three-dimensional matrix — position (below /
      in / above band) × movement (falling / stable / rising / **not
      established**) × dose state (no recent change / behaving as expected /
      **contradicting the expectation**). Four cells have no state in
      `doseStatus` at all, and `doseStatus` is the verdict every other surface
      is meant to echo (wizard-states.md §7, now §19), so a cell it cannot
      express is a sentence no surface in the app can say:
        - dose raised, still falling
        - dose lowered, still rising
        - dose changed, no movement at all (either direction)
        - movement not established — fewer readings than it takes to claim a
          direction, said out loud rather than guessed at or hidden
      wizard-states.md §3 tabulates 17 state/label rows and none of them is any
      of these four. 4b's own summary of the gap: *"There is no 'despite your
      dose change' anywhere. A falling level reads the same whether you just
      raised the dose or did nothing."*
      check first — do `fell-short` and `overshot` already cover this?
      They express something close and MUST be settled before any new branch is
      added, or this lands a fifth engine on top of two that nearly work.
      What the code says today (src/lib/dosing/state.js:318-332):
        - `fell-short` is "still moving the way it was and the engine still
          wants more of the same"; `overshot` is anything else after a change.
          Direction is read off `a.trendPerDay` against `a.action`, and the
          truth table is pinned by src/test/defects/dose-state-direction.test.js.
          That is exactly 4b's "dose raised, still falling" and "dose lowered,
          still rising", in the app's own words.
        - But both sit inside `if (plan && plan.appliedAt)` (state.js:278) and
          behind three further gates: `tested` = at least two readings dated
          after the change AND `daysSince >= settleDays` (:284); not `steady`
          (:306-317); and `a.action` still "increase" or "decrease" (:318).
          `plan` is `a.activePlan`, set only from a stored `alk-plan` / `ca-plan`
          / `mg-plan` (helpers.js:725, alkalinity.js:437, calcium.js:255), which
          only `applyDoseChange` writes (App.jsx:730-750) and `clearAlkPlan` and
          its siblings delete. `doseStatus` then expires it after 30 days
          (:274-277).
        - So a dose changed in Setup rather than through the wizard reaches
          neither branch, and a plan that has been cleared or aged out cannot
          either. NOTE the framing this item was filed under — "only reachable
          behind a staged plan" — is not quite what the code does:
          `applyDoseChange` writes a plan for *every* wizard dose change, with
          `stage: 1, stages: 1` for an unstaged one, so a single-step change
          does get a plan. The real gate is having gone through the wizard at
          all, and the three conditions above. Establishing which of those gates
          is intended and which is accident is the first job of this item, and
          the answer decides whether 4b's two "still moving" cells are new
          states or an existing pair with its preconditions widened. The two
          "no movement at all" cells and "not established" have no candidate
          either way — nothing in state.js expresses them.
        - "not established" today collapses into `settling` / "needs another
          reading" (state.js:417-437), which TW-009 already records as saying
          the wrong thing when the cause is a missing Setup field rather than a
          missing reading. Whatever this item does must not make TW-009 worse.
      the evidence rules 4b attaches, which are the substance of the item —
      and which are **journey material, not canon** (reef-chemistry.md §25,
      "what this does not settle"). They may shape the design; they may not be
      minted as constants without Dan settling 4b's open questions 2-5 first:
        - to establish movement from nothing: **three** readings, one
          direction, clearing the kit noise floor. *"If my alkalinity was 9.0
          and the next reading was 9.3, that's only two readings. We can't
          really say it's rising."* Two is a difference; three is a trend.
        - to claim a dose change is being contradicted (or confirmed): **two**
          readings, all four conditions — both dated after the change; at least
          **24 hours apart** (*"not taken the next day at a different time"*);
          movement substantial, Dan's figure 0.2-0.3 dKH; direction opposite to
          (or with) what the change intended. A deliberately lower bar: the
          change created an expectation, so breaking it is informative at once.
        - the 0.2-0.3 dKH figure is 2-3x `KIT_PRECISION.hanna.alkalinity`
          (0.10, src/lib/findings.js:59), which is what 4b means by "roughly
          2-3x the kit noise floor" — so the rule may be expressible against
          `kitNoise()` rather than as a fourth hardcoded alkalinity constant.
          Worth checking before a new number is minted.
        - none of this exists as a gate today. `doseStatus` reads `a.band` and
          `a.trendPerDay`, whose thresholds (ALK_TREND at alkalinity.js:28,
          CA_TREND at calcium.js:27, MG_TREND at magnesium.js:15) are
          magnitude bands over a fitted slope, with no reading count and no
          minimum spacing. TW-007 is the same absence one layer down — it has
          `assessDrift` and `assessAlkalinity` producing dose-affecting
          verdicts without reef-chemistry.md §22's minimum-evidence gate.
          These two items should be read together; they may share one fix.
        - 4b also asks for wording relative to the target when out of band
          ("coming back toward it", not "rising"). `recovering` / `worsening`
          (state.js:465-471) already do exactly this and need no change — but
          wizard-states.md §10 records that nothing asserts those two states
          exist, so a refactor here could delete them silently.
      spec: docs/spec/wizard-states.md §19 (the engine owns the verdict; the
      states belong in it), §11's parameter-assessment row, §3's state table —
      which gains a row per new state, and a state that is not in that table
      does not exist; docs/spec/reef-chemistry.md §25. Still open and NOT
      settled by that canon entry: the evidence figures above, and 4b's open
      questions 2 (how long "recent dose change" lasts), 3 (24 h or 48), 4
      (whether calcium and magnesium use the same wording at their own scales)
      and 5 (whether these belong in the wizard's own states — *"Get it wrong
      and this builds a sixth engine"*). Questions 2-5 are Dan's.
      journey: docs/journeys/journey-4b-notification-matrix.md — "The three
      dimensions", "Evidence rules", "The matrix — dose changed, contradicting
      the expectation" (*"The most important row in the document, and the one
      the app cannot produce today"*), and "What the app cannot do today"
      items 1-3. The "no movement" cells are Dan's own reasoning, quoted there
      from journey 1: *"I know that's within test variation, but now that's two
      days of an increased dose. It hasn't actually moved. So at that point I
      would increase the dose further."* An expected response that does not
      arrive is itself evidence.
      owner: implementer

- [ ] [approved] TW-027 Every notification surface renders `doseStatus`'s verdict; one live notice per parameter
      phase: 8b — approved, second of the three. Depends on TW-026 for the
      states; the routing and identity work is separable from it.
      UNBLOCKED 2026-08-14 — canon exists, and it answers this item's two
      open questions. wizard-states.md §19 names the surfaces and says every
      one of them renders the engine's verdict; §20 settles notice identity
      (one live notice per parameter), supersession (a new verdict replaces
      the old notice rather than joining it), hiding scope (global), and
      journey 4's open question 4 — **every notice can be hidden, safe-bounds
      excursions included**, with a confirmation on serious ones (TW-031).
      why: journey 4 records the app holding two opinions about one parameter
      at once — *"There should be another notification which says your calcium
      is increasing, but you've just changed the dose, so this is expected to
      go down"* — and asks for one engine every surface reads from. That is
      wizard-states.md §7 and §11 applied to a layer that has never had a
      specification. §7 already names the rule ("all three echo the wizard or
      say nothing") and §7's own note admits it "describes an intention, not a
      guarantee"; §19 now widens it to every surface and every parameter.
      what is actually wired today, surface by surface:
        - **tank summary** (`buildBriefing`, src/lib/narrative-engine.js:329) is
          the closest to right: every dose claim in the `ds` loop renders
          `d.headline` and `sentenceCase(firstSentence(d.detail))` verbatim
          (:428-535). Two exceptions. First, `correction-done` writes its own
          support sentence — `Set the dose back to ${fmtAmount(d.returnDose)}
          mL/day to hold it there.` (:474) — against §7's "renders the wizard's
          headline and the first sentence of its detail". Second, the loop has
          branches for 12 of `doseStatus`'s states and **none** for `emergency`,
          `blocked`, `idle`, `recovering` or `worsening`, all five of which are
          in wizard-states.md §3's table. §7 permits silence, so this is not a
          §7 breach on its face — but journey 4 says *"The tank summary is the
          complete list"*, and §19's surface table now says the same thing in
          canon: the summary shows every parameter. Today it does not.
          `emergency` reaches the summary only via a separately computed
          `far-out-<key>` finding, which is the second-classifier problem
          TW-002 already tracks.
        - **parameter card** (`ParamCard`, src/components/DoseExpectation.jsx:219)
          holds three verdicts about one reading in one render: its headline
          colour and status from `paramStatus` (:220), a findings badge from
          `findingsFor` (:223), and `dose.short` from `doseStatus` (:290-296).
          This is the 90-pixel card §7 calls out by name.
        - **parameter graph panel** (`ParamHistoryModal`, Dashboard.jsx:335-353)
          renders `dose.headline` and `dose.detail` faithfully, then writes its
          own eyebrow label from a ternary over `dose.state` covering 7 of the
          17 states, with everything else falling through to the literal "Dose
          suggestion" — so a running correction, an emergency and a recovering
          level are all labelled as a dose suggestion.
        - **Insights** (src/components/Insights.jsx:85) is handed `findings` and
          never receives `doseStates` at all. It renders no dose verdict, which
          means journey 4's third surface — and §19's fourth row — currently
          cannot echo the wizard even if it wanted to.
      one live notice per parameter — not the case today, and now canon (§20).
      `buildBriefing` can emit a `finding:<id>` claim, a `dose:<key>` claim, a
      `drift|<key>` claim and a `moving-out|<key>` claim about the same element
      in one render; the `spokenFor` set (:537-543) suppresses only sections 3
      and later, and there is one hardcoded pairwise exception (:450-453,
      dropping a level-ish dose claim when a `far-out-` finding exists).
      Supersession is not a concept: `add()` (:356) pushes, it never replaces.
      check what already exists before designing anything — journey 4 is right
      that someone started this, and the difference between "never built" and
      "built and not wired up" is weeks versus days. Concretely:
        - `findingKey(f)` (DoseExpectation.jsx:134) is `"finding|" + f.id` — a
          stable identity for the life of the finding. This is the topic key.
        - `findingSignature(f)` (:141) is `id|title` — plus `|value` when the
          finding is severity `act` and carries a reading, so a worse number
          brings a hidden notice straight back. This is "what would make it
          count as a different notice".
        - `findingHidden(f, dismissed)` (:148) hides only while the stored
          signature still equals the current one, and treats a bare-date entry
          (the old format) as lapsed. **This is §20's resurfacing rule already
          working**, for findings.
        - it is genuinely global for findings: one `dismissed` map, one storage
          key `findings-dismissed`, and both `dismissFinding` (App.jsx:586) and
          the summary's finding claims (narrative-engine.js:395) key on
          `findingKey(f)`, so hiding on the card hides in the summary.
        - claims that are not findings carry their own `dismissKey` /
          `dismissSignature` (`worked|<key>`, `dose|<key>`, `drift|<key>`,
          `moving-out|<key>`, `parked`, `solid`) into the same map via
          `dismissNote` (App.jsx:598). Same mechanism, different namespace.
        So the model §20 now requires is largely built. What is missing is
        that it stops at the summary: no surface other than `FindingList` and
        `Briefing` consults `findingHidden`, so a dose verdict rendered by
        `ParamCard` or `ParamHistoryModal` has no hide control and no hidden
        state to consult. Which is journey 4's problem 2 exactly.
      every notice can be hidden — five dose claims are built with no
      `dismissible: true` at all (`correcting-dose` :457, `correction-due` :464,
      `correction-done` :471, `correction-stalled` :478, `correcting` :485), and
      findings of severity `act` and scope `chemistry` are non-dismissible by
      rule (:394). Both have stated reasons in the code — hiding a correction
      leaves the tank being deliberately pushed with nothing on screen saying
      so; hiding "ammonia is dangerously high" is the one thing the summary must
      not allow. **Settled 14 Aug against both**: §20 says every notice can be
      hidden, no exceptions, because the user may have a reason the app cannot
      see. The confirmation on serious notices is the speed bump that makes
      that safe, and it is TW-031 — build them together or the guard lands
      after the thing it guards.
      the hidden list growing without bound (journey 4's problem 3) falls out of
      supersession and needs no separate mechanism: `findingHidden` already
      lapses an entry the moment the signature moves. What does not yet happen
      is any pruning of the stored map, so `findings-dismissed` keeps entries
      for notices that no longer exist. Setup lists them (Setup.jsx:484) from
      `dismissedList`, which is computed against live findings only
      (App.jsx:140), so the *display* is already bounded — the storage is not.
      spec: docs/spec/wizard-states.md §19 (the surface table, and the rule
      that a surface computing its own verdict is an S1 defect), §20 (notice
      identity, supersession, global hiding, resurfacing), §11's
      parameter-assessment row, §7, §12, §17; docs/spec/reef-chemistry.md §25.
      Journey 4's open question 1 — what counts as one topic — is answered by
      §20: one notice per parameter, whose content is the engine's current
      verdict, so "alkalinity is falling" and "alkalinity is out of band" are
      one topic and the newer verdict supersedes.
      journey: docs/journeys/journey-4-notifications.md — "What is wrong — five
      things" (all five), "What Dan wants — the model", "What already exists"
      (*"Before designing anything, find out what those three do today"*), and
      "What this means for the spec" points 1-6. Point 6 is the load-bearing
      one and is now canon in §19. Also
      docs/journeys/journey-4b-notification-matrix.md open question 1.
      related: TW-002 (no `classifyReading`; the same 6.9 dKH reading getting
      three severities in one card is the band-classification half of this
      item's parameter-card finding). TW-015 and TW-016 are wording drift in
      the same surfaces. TW-029 and TW-030 are the parameters this routing will
      carry once they have reasoning of their own. This item is the routing;
      those are the vocabulary and the content.
      owner: implementer

- [ ] [approved] TW-028 Extend `wordingcheck` past one function and one field, or TW-027 drifts back
      phase: 8b — approved, third of the three. **Lands in the same change as
      TW-027, not after it** — §7 reached its current state precisely because
      the rule was written and never asserted, and §19/§20 are now two more
      rules in exactly that position (both say so, under "Enforced by").
      UNBLOCKED 2026-08-14 — the list of surfaces this must assert against now
      exists: wizard-states.md §19's surface table and §11's
      parameter-assessment row.
      correction to the premise this was filed under: `wordingcheck.py` **did**
      survive the Phase 5 conversion. It is `scripts/verify/wordingcheck.mjs`,
      ported unchanged, wired into `npm run verify` as **blocking**
      (scripts/verify/run.mjs:35), passing today (`OK — dose claims repeat the
      engine's wording (11 checked)`), and mutation-tested — `node
      scripts/verify/mutate.mjs` lists "dose claim writes its own words → caught
      by wordingcheck.mjs" (.agent/phase5-gate.md §6, and §2's table records it
      as the one checker ported with no material change). The rest of the
      premise holds exactly: .agent/phase5-gate.md §3 calls it *"the only
      automated enforcement wizard-states.md §7/§12 has ever had"*, and
      wizard-states.md §10 says no rule in that document may be described as
      enforced until a test asserts it. So the item is not a port. It is that
      the guard covers a fraction of what TW-027 would create, and the
      uncovered fraction is where §7 already leaks.
      why: what the checker actually asserts is one thing — inside
      `buildBriefing` in src/lib/narrative-engine.js, an `add({...})` block whose
      `id:` contains the literal `"dose:"` must have `claim:` matching exactly
      `d.headline`. Everything else is outside it:
        - **one file, one function.** The path is hardcoded (wordingcheck.mjs:15)
          and the function is found by name (:18). Nothing checks
          `ParamHistoryModal` (Dashboard.jsx:335-353), `ParamCard`
          (DoseExpectation.jsx:290-296), `Insights.jsx` or
          `ReadingConfirmation.jsx` — three of which §7 names explicitly and all
          of which §19's table now covers.
        - **one field.** `claim:` is checked, `support:` is not — which is why
          `correction-done`'s hand-written support sentence
          (narrative-engine.js:474) passes a blocking check while §7 asks for
          "the first sentence of its detail". A live §7 violation the gate is
          green on.
        - **no floor on coverage.** `checked` is counted and printed, never
          asserted. If the `add({...})` blocks were reformatted so the regex
          (`add\(\{[\s\S]{0,600}?\}\);`, with `claim:` required at end of line)
          stopped matching, the script prints `OK ... (0 checked)` and exits 0.
          run.mjs's own header states the third rule it carried forward from the
          old gate: *"A check that cannot fail is worse than no check."* This one
          can be silenced by a whitespace change.
        - **cannot see a missing branch.** It checks the wording of claims that
          exist. The five `doseStatus` states with no `add()` in the loop at all
          (`emergency`, `blocked`, `idle`, `recovering`, `worsening` — see
          TW-027) are invisible to it, and `recovering` / `worsening` are the
          two states wizard-states.md §10 explicitly says nothing prevents
          vanishing in a refactor.
      what it would take: a checker (or checkers) that assert, per surface named
      in §19's table, that a verdict is rendered from the engine's own fields
      and not written locally; that every state in wizard-states.md §3's table
      is reachable on the surfaces canon says it appears on; and a minimum
      `checked` count so the check cannot pass by matching nothing. §10's "what
      still needs building" list already names two of these — a `matrix.js`
      equivalent driving `doseStatus` through all its states asserting
      first-match-wins order, and a `summary.js` equivalent asserting no surface
      emits language contradicting the wizard's state for the same element in
      the same render. This item is those two plus the coverage floor.
      spec: docs/spec/wizard-states.md §19 (the surfaces to assert against),
      §20 (the notice rules that need their own assertions — one live notice
      per parameter, supersession, resurfacing), §7, §10, §12;
      docs/spec/reef-chemistry.md §25 ("Enforced by": nothing asserts any of
      this today).
      journey: docs/journeys/journey-4-notifications.md — "What this means for
      the spec" point 6, and the observation that this is *"not a separate
      problem from the wizard one. It is the same rule, applied to a layer that
      has never had a specification."* A rule with no checker is the state §10
      describes as "an intention".
      repro: `node scripts/verify/wordingcheck.mjs` → `OK dose claims repeat the
      engine's wording (11 checked)`, exit 0, while narrative-engine.js:474
      writes its own support sentence and Insights.jsx receives no `doseStates`
      prop at all.
      owner: implementer

## Needs Dan's approval

<!-- triage-analyst files items here. Dan promotes by adding [approved]. -->
<!-- 2026-08-13 consistency sweep: 15 promoted (cap), 7 more qualified and were
     held back this run (parseFloat truncation on paste, "target" field dual
     meaning dose-vs-reading, ICP popup + chart missing units x2, LogResultPopup
     missing date/time, kitChanges not threaded into assessAlkalinity, chart has
     no alert-low/high shading) — will resurface next sweep if still true.
     2 items (volume terminology spec self-contradiction; magnesium/calcium rail
     constant conflict) were escalated in .agent/needs-dan.md and RESOLVED by Dan
     on 2026-08-13 — see the Decisions section of that file. The code work those
     decisions create is TW-016 and TW-017 below. -->

- [ ] [chem] TW-026 magnesium's default band is off-centre from its suggested target
      why: found while fixing bug 4 (routine 15, alkalinity's band 1.0 -> 0.6).
      reef-chemistry.md §2's Layer 3 table gives magnesium a suggested target of
      1350 ppm with a 150-total (±75) band -> 1275-1425. `src/lib/constants.js`'s
      PARAM_DEFS entry ships `{ min: 1250, max: 1400 }` — width 150 (correct), but
      centred on 1325, not 1350 (min and target-75 coincide; the shipped band is
      target-75-to-target+50, not target±75). Not authorised to fix under bug 4's
      citation (alkalinity only) — reported per rule 7 rather than folded in.
      spec: docs/spec/reef-chemistry.md#2-targets-three-layers
      repro: PARAM_DEFS.find(d => d.key === 'magnesium') — (1250+1400)/2 = 1325, not 1350
      owner: Dan approves the fix; implementer applies it once approved

- [ ] [chem] TW-016 correction.js allows magnesium at 4x the rail; rails.test.js asserts the old canon
      why: Dan settled the magnesium rail at 25 ppm/24 h on 2026-08-14 (§3), closing
      the 25-vs-50 conflict the canon swap surfaced. Against that figure:
      - src/lib/analytics/correction.js:20 CORRECTIONS.magnesium.maxPerDay is 100 —
        four times the rail. Per §3, "any recommendation exceeding a rail is a bug,
        not a preference." Its calcium entry (20) is already right.
      - src/lib/analytics/safe-rate.js:27 CORRECTION_MAX_RATE is {alkalinity 0.5,
        calcium 20, magnesium 25} — this now matches canon exactly and needs NO
        change. Its own comment ("the conservative end of each is the default")
        states the principle Dan chose. Do not touch it.
      So this item is now one constant plus its test, not the two-sided conflict it
      was filed as: correction.js's 100 becomes 25.
      spec: docs/spec/reef-chemistry.md#3-rate-rails--one-per-element
      UNBLOCKED 2026-08-14 — the rail figure is no longer in dispute.
      repro: tests/parity/correction-calculator-vs-rail.test.js; also
      src/test/spec/classification/rails.test.js, whose SPEC_RAIL at line 24 is
      {alkalinity 0.5, calcium 25, magnesium 100} — the pre-13-Aug canon, quoted
      again in the header comment at lines 1-19, which cites "§6, lines 149-166"
      (that section is now §3). SPEC_RAIL must be re-pointed to {0.5, 20, 25} and
      the header comment rewritten to quote §3, as part of this item — not edited
      on its own to go green (AGENTS.md rule 4). Its calcium assertions currently
      fail against code that is already correct; its magnesium ones fail for the
      right reason.
      owner: implementer — needs [approved][chem] first (AGENTS.md rule 3)

- [ ] TW-017 Terminology: "water volume" is now a banned synonym for "net volume"
      why: Dan's 2026-08-13 registry decision. wizard-states.md §15 now
      requires "net volume"; "water volume" is never-use. terminology-auditor
      previously found "tank volume" / "net volume" / "water volume" all live in the
      app, twice in one message at src/lib/findings.js:362-363.
      spec: docs/spec/wizard-states.md#15-terminology-registry
      owner: implementer

- [ ] TW-002 No single classifyReading(); ~8 divergent classifiers disagree on the same reading
      why: classifyReading(param, value, targets) — the one legal place band classification
      happens per spec — does not exist anywhere in the codebase. 8 independently-maintained
      engines (paramStatus, reading-meaning.js's computeControl, ReadingConfirmation's
      readingVerdict, findings.js's SAFE_BOUNDS, dosing/state.js's inline SAFE_BOUNDS check,
      three dosing engines' own def.min/max comparisons, computeIonicBalance) use different
      thresholds and vocabulary and visibly disagree today. Concrete instance: Dashboard
      ParamCard shows amber "low" (paramStatus) directly above two red "Dangerously low"
      badges (doseStatus + findings.js, both reading SAFE_BOUNDS) for the identical 6.9 dKH
      reading, in one card, one render. The SAFE_BOUNDS check is also non-inclusive at the
      boundary (7.0 dKH exactly falls through to calm "off-target"; 6.99 triggers
      "emergency"). narrative-engine.js and findings.js separately disagree on the pH-high
      threshold (8.4 vs 8.45) for the same stored value, producing a message on one surface
      and silence on the other for the same reading.
      spec: docs/spec/wizard-states.md §11 ("a second implementation... is an S1
      defect, even if it currently produces identical output"), §3
      repro: npx vitest run src/test/spec/classification/classify-reading-validation.test.js
      ("no module in scope exports a function named classifyReading"); npx vitest run
      tests/parity/alert-severity-cross-surface.test.js (doseStatusAt(6.9) → emergency/red
      vs readingVerdictAt(6.9) → "Well below band"/amber; doseStatusAt(7.0).state is not
      'emergency')
      owner: implementer

- [ ] TW-003 Dosing Wizard crashes on the two most common refusal states
      why: AlkAssessmentBlock (shared by all three elements) unconditionally reads
      a.current.value at the top of its stats table. Every assess* engine leaves
      out.current = null on a refusal (no net volume/solution strength set, or no readings
      logged yet) and returns before populating it. Tapping any element card before setup
      is complete throws a TypeError inside render; the correctly-worded refusal message the
      engine already computed (a.reason) is discarded and replaced with a generic
      "this tab hit an error" card and a raw stack trace. This is the first thing a
      brand-new user sees — the wizard opens on the element needing attention, and the
      closing hint text explicitly invites tapping any of the three cards.
      spec: docs/spec/reef-chemistry.md §17/§12 (refuses and names what's missing);
      docs/spec/wizard-states.md §14
      repro: reproduced live against real components (not mocked): render
      <AlkAssessmentBlock a={{...assessAlkalinity({readings:[],doseLog:[],waterChanges:[],
      settings:{},def,now}), def}} /> throws "TypeError: Cannot read properties of null
      (reading 'value')" at src/components/ErrorBoundary.jsx:279. Same result for
      readings:[] against fully-configured settings.
      owner: implementer

- [ ] [chem] TW-004 Manual dose entry has no rail check (reef-chemistry.md §3); Setup also accepts negative/unbounded doses
      why: DoseChangeSheet (opened from the wizard for all three elements) only compares
      the typed value to the app's own suggestion for a cosmetic "that's fine" note; the
      Save button is enabled for any finite value >= 0, with no rail lookup and no
      confirmation step. Setup's independent "Dosing" card dose field has no min bound
      (saveDose only rejects NaN), never calls dosePlausible, and stores the raw parseFloat
      verbatim — a negative or wildly implausible daily dose is written straight into
      settings and doseLog, corrupting every downstream engine's currentDose input.
      spec: docs/spec/wizard-states.md §12 ("may NOT silently exceed a §3 rail...
      the app warns explicitly, states the rail and the overage, and requires confirmation")
      repro: npx vitest run tests/parity/manual-override-rail-check.test.js — with
      rateLimitDose clamping a requested 70 mL/day to 49.4 mL/day elsewhere in the app,
      driving the real DoseChangeSheet component with 70 mL/day entered shows no text
      matching /rail|limit|confirm|exceed/ anywhere, Record enabled, onSave(70,...) fires
      silently. src/components/Setup.jsx:66-92,204-208 (no min, no dosePlausible call).
      owner: implementer

- [ ] [chem] TW-005 Magnesium gate and precipitation guard are unreachable from the Dosing Wizard
      why: assessAlkalinity/assessCalcium take no magnesium status or sibling-element
      due-today parameter at all, so two of reef-chemistry.md §12's mandatory refusals — hold
      alk/Ca corrections while magnesium is below alert-low; never schedule alk and Ca doses
      within 4 hours of each other — cannot be produced by the wizard no matter what a user
      does. Not merely untested: structurally unimplemented.
      spec: docs/spec/reef-chemistry.md §20/§12, §23 worked examples 4 and 8
      repro: npx vitest run src/test/spec/dosing/magnesium-gate.test.js — worked-example-4
      fixture (Mg 1140 < alert-low 1150, alk 7.4 vs target 8.5) still returns action:
      "increase" with no /magnesium/i match anywhere in the reason text; npx vitest run
      src/test/spec/dosing/precipitation-guard.test.js — neither engine's output carries a
      minSeparationFromCalciumHours/minSeparationFromAlkalinityHours field.
      owner: implementer

- [ ] TW-006 assessCalcium's displayed recommendedDose and internal plan[0] disagree for the same correction
      why: out.recommendedDose (rate-limited and step-capped via rateLimitDose/
      capDoseStep/applyDoseConstraints — what's shown and pre-fills DoseChangeSheet) and
      out.plan[0] (first day of the staged multi-day plan, built by a separate loop using
      its own 0.5/0.6 urgency multiplier, never capped) are two different numbers both
      claiming to be "day one" of the identical correction, computed inside one function
      call.
      spec: docs/spec/wizard-states.md §12 ("the recommended dose in mL... and
      whether a multi-day plan is required" must be identical across surfaces)
      repro: npx vitest run tests/parity/multiday-plan-parity.test.js — currentDose 6 mL/day,
      maintenanceDose ~9.93 mL/day: recommendedDose = 7.5 (stepCapped {wanted:9.9,
      allowed:7.5}), plan[0] = 8.4 — a third figure, matching neither.
      owner: implementer

- [ ] TW-007 Rate/drift verdicts compare display-rounded values and skip the minimum-evidence gate
      why: assessDrift/computeRates round the rate before comparing it to the action
      threshold, not after — a raw 0.501 dKH/week drift (over the 0.5 threshold) rounds to
      "0.50" and is graded "no action needed". Separately, assessDrift and assessAlkalinity's
      own consumption calc never gate on reef-chemistry's minimum-evidence rule (>=3
      readings spanning >=6 days; no reading pair under 2 days apart) before producing a
      confident, dose-affecting verdict.
      spec: docs/spec/wizard-states.md §13; docs/spec/reef-chemistry.md §21
      ("round last"), §22 (minimum evidence)
      repro: npx vitest run src/test/spec/classification/rounding-vs-stored.test.js; npx
      vitest run src/test/spec/classification/min-evidence.test.js — both fail live
      owner: implementer

- [ ] TW-008 "No change" shown for a matched dose holding outside the band, beside a live correction control
      why: when a daily dose matches consumption but the current reading sits outside the
      user's band, the collapsed Dosing Wizard tile shows headline "No change" / "dose
      matches use" in the neutral hold tone, directly beside an amber/red band-position dot
      — and one tap away, inside the same card, an active "Log a ... mL correction" button
      for the identical reading.
      spec: docs/spec/wizard-states.md §14 (a message must not imply no action is
      needed when an action is available for the same reading)
      repro: code trace — src/lib/dosing/alkalinity.js:715-765 (out.ok=true,
      action="hold", explanation still notes it's out of range), src/components/
      DosingWizard.jsx:14-31,62-74 (headline/tone logic, band-position dot)
      owner: implementer

- [ ] TW-009 Refusal states render as a calm "Hold" or a false "more readings needed" instead of naming the missing input
      why: every genuine insufficient-data refusal (no volume, no dose configured, no
      readings yet) leaves out.action at its untouched default "hold", so AlkAssessmentBlock
      renders "Hold at -- mL/day" in the same tone as a real matched-dose hold. DoseElementCard
      and doseStatus separately collapse the identical refusal to "more readings needed" /
      "needs another reading" — false when the cause is a missing Setup field, since no
      amount of retesting fixes that. The correctly-worded a.reason exists on the object but
      only reaches the least prominent of the three surfaces.
      spec: docs/spec/wizard-states.md §13 ("refuse and name what's missing"), §4
      ("a refusal message names the specific missing input")
      repro: code trace — src/lib/dosing/{calcium,alkalinity,helpers}.js (action never set
      off the "hold" default on any refusal path); src/components/DosingWizard.jsx:27-31;
      src/lib/dosing/state.js:417-437
      owner: implementer

- [ ] TW-010 insufficient-data readings render as a green "Saved" success card
      why: readingVerdict (the test-log confirmation shown after every test) has no branch
      for status === "unknown"/insufficient-data; execution falls through to the function's
      final return, which reuses the exact tone (#0B7C86) and checkmark used for a
      confirmed in-band good reading. A reading the app cannot classify is indistinguishable
      from one it has confirmed healthy.
      spec: docs/spec/wizard-states.md §13 ("refuse and name what's missing"), §2
      (test-log confirmation, "every user, every test")
      repro: code trace — src/components/ReadingConfirmation.jsx:343-409, no unknown/
      insufficient-data branch; fallback at line 409 returns {emoji:"checkmark",
      tone:"#0B7C86", headline:"Saved"}
      owner: implementer

- [ ] TW-011 "In range, correction still running" headline contradicts its own body text
      why: when a correction plan is active but hasn't yet confirmed arrival (two in-band
      confirming readings), the first in-band test after starting the correction produces
      headline "In range, correction still running" with a body line quoting the remaining
      ppm/dKH gap and days left in the same breath — pairing the spec's no-action term
      directly against language describing an unfinished action.
      spec: docs/spec/wizard-states.md §14 ("the single most important rule in this
      file")
      repro: code trace — src/components/ReadingConfirmation.jsx:74-78; reachable via
      App.jsx:1014-1020 recomputing doseState/correctionPlan from the freshly-saved reading
      before the popup opens
      owner: implementer

- [ ] TW-012 No submit lock on dose confirmation buttons — rapid double-tap can drop or duplicate a dose-log/correction-plan entry
      why: DoseChangeSheet's Record button and CorrectionPanel's Start button have no
      disabled-while-saving guard, and the write path (addDoseChange, setDoseLog/
      setCorrectionPlans) reads state from the enclosing render's closure rather than a
      functional updater. Two confirmations fired close together each compute `next` from
      the same stale array; the later write replaces the array outright rather than merging,
      so one entry can be silently dropped from state, from storage, or from just one of the
      two while the UI still reports "Recorded" for it.
      spec: docs/spec/wizard-states.md §16 (history-truthfulness); audit checklist
      item 7 ("rapid double-tap on the final button must not double-dose or double-log")
      repro: reproduced live (not committed, git status clean after) — two fireEvent.click
      on Record calls onSave twice with no lock in between; code trace src/App.jsx:388-394
      (addDoseChange: setDoseLog(next) built from closure, not a functional updater), :720-759
      owner: implementer

- [ ] [schema] TW-013 No persisted classification or target-change event — editing a target silently reclassifies all history
      why: readings store no band/target-at-time-of-reading; every surface reclassifies live
      against the user's current customRanges, so narrowing or adopting a new target
      silently rewrites every past reading's verdict with no record anything changed.
      Separately, saveRange/resetRange write only to custom-ranges — no event is recorded
      anywhere when a target changes, so a step-change in a chart/history has no on-screen
      explanation.
      spec: docs/spec/wizard-states.md §16 ("Recomputing the past against present
      settings is an S1 defect"; "If a target changed, history shows the change as an event
      in the series")
      repro: npx vitest run src/test/spec/history/target-change-immutability.test.js — a
      9.0 dKH reading logged 2026-03-15, rendered "In range" via the real WaterLog
      component, re-renders as "Low" the moment paramDefs reflects a changed target, unedited
      owner: implementer

- [ ] [schema] TW-014 Manual dose overrides are never stored with the recommendation they replaced
      why: DoseChangeSheet's onSave callback is invoked with only (ml, date, time) — the
      recommended/suggested figure shown on the same sheet is dropped before it reaches
      storage. Every doseLog row is {id, date, time, ml, element, note}; no history view,
      chart, or CSV export can show recommended-vs-dosed for a past manual entry.
      spec: docs/spec/wizard-states.md §12/§16 ("recorded as a manual override, with
      both the recommended value and the entered value... history must show both, always")
      repro: npx vitest run src/test/spec/history/override-visibility.test.js — typing 15.5
      into the amount field with recommended=10.0 and clicking Record calls onSave with
      [15.5, date, time]; 10.0 appears nowhere in the call
      owner: implementer

- [ ] TW-015 Forbidden vocabulary ("safe", "optimal", "healthier") leaks into rendered narrative text
      why: CONSISTENCY_RULES[key].why strings are spliced verbatim into Dashboard/Insights
      messages: "20 ppm/day is the accepted safe rate of change for calcium"; "the safe
      correction ceiling"; "fluctuation... inside the optimal range"; "a steady 0.08 ppm is
      healthier than a range of 0.01-0.15 ppm". §5 bans exactly this vocabulary about a
      reading.
      spec: docs/spec/wizard-states.md §15 ("The app never uses 'safe' or 'unsafe'
      about any reading")
      repro: code trace — src/lib/analytics/time-in-range.js:70,72,76,80, spliced in at
      src/lib/analytics/reading-meaning.js:206, consumed by Dashboard.jsx:11 and
      Insights.jsx:15
      owner: implementer

- [ ] TW-016 "drift"/"drifting" is used for three incompatible meanings across the app
      why: reading-meaning.js's verdict="drifting" fires on an out-of-band, oscillating
      median — the opposite of the spec's inside-band, trending-toward-an-edge definition.
      Dashboard's "Weekly drift" label is a generic rate-of-change magnitude shown even when
      a parameter is centred in-band. Insights' ionic-balance section uses "drift" for an
      unaccounted dosing-vs-measured discrepancy, a third, unrelated meaning.
      spec: docs/spec/wizard-states.md §13 (band-verdict definition of "drifting"),
      §5 (no invented or reused vocabulary)
      repro: code trace — src/lib/analytics/reading-meaning.js:196-220; src/components/
      Dashboard.jsx:492,582; src/components/Insights.jsx:384,391
      owner: implementer

- [ ] [chem] TW-018 Remove `drift.js`'s dose figures; the wizard is the only source of a dose
      why: Dan's 2026-08-14 decision 1 (see .agent/needs-dan.md). reef-chemistry.md §7 and
      wizard-states.md §0.3 now state that the wizard's staged full-recompute is the only
      mechanism that may produce a figure to dose. src/lib/analytics/drift.js's
      computeDoseAdvice/computeDoseCalc compute their own — a flat 10%/15% in .pct, a
      halve-the-gap first step in .calc — from their own noise floors and windows, with no
      concept of staging, bracketing, rate ceilings, plausibility or an active plan. Worked
      in the spec: the same two readings give 10.35 (drift .pct), 10.08→11.17 (drift .calc)
      and 10.95 mL/day (wizard).
      scope: `assessDrift`, the slope classifier with no dose number, is explicitly NOT
      removed. `previewStrengthChange` (src/lib/dosing/corrected-strength.js:43-51) is the
      only live consumer of .calc, rendered at Insights.jsx:697-720 — it needs re-pointing
      at the wizard's own assessment run under before/after settings BEFORE the removal, or
      that row goes blank. The dead `doseAdvice` useMemos at Insights.jsx:108 and
      Dashboard.jsx:298 (computed, never read in either file) come out with it.
      spec: docs/spec/reef-chemistry.md §7; docs/spec/wizard-states.md §0.3, §9.4
      repro: static trace only (grep-based); worth confirming with the app running that no
      component reads the output under a prop-drilled or re-exported name
      owner: implementer — needs [approved][chem] first (AGENTS.md rule 3)

- [ ] [chem] TW-019 `DOSE_ADVICE_RULES` has a magnesium key; §10 forbids tuning magnesium from readings
      why: independent of TW-018 and needs closing either way. drift.js:40-57 gives magnesium
      its own 14-35 day window and never consults DOSE_DRIFT_TRIGGER, so magnesium can be
      handed a computed dose figure through the previewStrengthChange path — while
      reef-chemistry.md §10 says the magnesium maintenance dose is never tuned from readings,
      "not delayed — exempt", and that DOSE_DRIFT_TRIGGER "must not gain" a magnesium key.
      The exemption currently holds only because one engine honours a rule the other cannot
      see. A 15% magnesium dose error takes over a thousand days to clear the 30 ppm noise
      floor, so any figure built from a few weeks of magnesium readings measures nothing.
      spec: docs/spec/reef-chemistry.md §10; docs/spec/wizard-states.md §9.4
      owner: implementer — needs [approved][chem] first

- [ ] [chem] TW-020 `arrived` must test the arrival zone, not the full band
      why: Dan's 2026-08-14 decision 4. correctionProgress's arrival test
      (src/lib/dosing/helpers.js:273-279) is `inBand(v)` over the last two readings — the
      full band. Canon is now `zoneWidth = max(bandWidth / 3, 2 × noiseFloor)`, clamped to
      the band, centred on the midpoint: 8.40-8.60 dKH, 415-435 ppm Ca, 1320-1380 ppm Mg at
      the suggested bands. The aim point (`proposeCorrection`'s `(min + max) / 2`,
      helpers.js:404) does not change.
      watch: `passed` (helpers.js:316) must stay independent — correction-done fires on
      `arrived || passed` (state.js:227) and that is what keeps the "return to maintenance"
      action reachable when the narrower zone is not hit twice. Do not conflate them. Also
      check the two call sites that branch on `cp.arrived` specifically for wording, and
      note the zone/noise-floor margin: reaching the zone from outside the band always
      exceeds `stalled`'s noiseFloor test today, but only by 1.67× for calcium and magnesium.
      spec: docs/spec/reef-chemistry.md §9; docs/spec/wizard-states.md §4
      owner: implementer — needs [approved][chem] first

<!-- 2026-08-14, from Dan's four decisions: two of the four need NO code change,
     recorded here so nobody re-opens them. Decision 2 (water changes stay in the
     trend fit, corrections subtracted proportionally) — alkalinity.js:493-499 and
     calcium.js:273-278 already do exactly this; canon moved to the code. Decision 3
     (bracket memory flat 45 days) — BRACKET_MEMORY_DAYS = 45 at helpers.js:85 is
     already correct; the withdrawn 30/60 split was never built. Still open and NOT
     filed as code work: the "widen never narrow" bracket rule (needs a sharper
     diagnosis first — see reef-chemistry.md §8.3) and the absence of any
     size threshold separating a routine 10% water change from a 40% one. -->

- [ ] TW-025 Offer magnesium–alkalinity dose parity for balling systems
      phase: 8 — future work, not next. Filed now so the decision isn't lost.
      why: Dan's 2026-08-14 decision. In a balling system the magnesium maintenance
      dose is not calculated at all — it is copied from alkalinity's, millilitre for
      millilitre: *"Whatever I'm dosing my alkalinity at the time — if I'm dosing 12
      mL a day spread over the day, I'd dose 12 mL of magnesium. And that seems to
      hold it."* The app has no concept of this and treats all three elements as
      independent, deriving magnesium's dose from readings — which per
      reef-chemistry.md §10 it cannot do meaningfully anyway (a 15% magnesium dose
      error takes over a thousand days to clear the 30 ppm noise floor). Parity may
      be the actual answer to "how does the app set a magnesium maintenance dose":
      it doesn't, it copies alkalinity's and offers to.
      what: a Setup question — *"are you running three-part balling?"* — and, when
      the answer is yes, magnesium's maintenance dose **defaults to the same mL/day
      as alkalinity's** rather than being derived from readings, tracking
      alkalinity's dose when that changes. A default, not a lock: the user can
      break parity, and magnesium corrections are unaffected (§10 keeps them
      separate-product and measurable, exactly as today).
      caveat to carry: breaking parity disturbs the balling ionic ratio, and the
      app should say so rather than be silent about it. *"Most reefers don't follow
      those ratios — they adjust them independently, and it's not a huge deal
      because you're doing water changes to replenish the ionic balance over
      time."* So: water changes recover the balance over time, and it matters more
      for anyone dosing trace elements alongside — potassium is sometimes dosed
      with magnesium. Low concentrations, slow movement, not urgent. Whether that
      lands as a note or a warning is journey 3's open question 4 and is not
      settled here.
      spec: none yet. reef-chemistry.md §10 records that "balling guidance says all
      three should be dosed in equal amounts" but then requires the app to support
      independent dosing; no section defines a parity mode or the Setup input it
      needs. A canon entry is required before this is implementable — a journey may
      motivate an item, never authorise one (docs/journeys/README.md rule 3).
      journey: docs/journeys/journey-3-magnesium.md — "The setting", journey A's
      ionic-balance caveat, and finding 1 ("In balling, magnesium's dose is copied
      from alkalinity's"). Also its open question 1, which asked for exactly this
      Setup question — now answered yes, offer it.
      owner: Dan for the spec entry first, then implementer

<!-- 2026-08-14, the new work created by the Reef Chemistry Engine decision
     (reef-chemistry.md §25, wizard-states.md §19/§20). Three items. TW-029 is
     filed as a **defect**, not an enhancement — the decision is explicit that
     the current phosphate and nitrate notices are wrong rather than merely
     unhelpful. TW-030 and TW-031 are the two other things §25 and §20 name as
     needing building.
     TW-029 and TW-030 both need Dan to write per-parameter reasoning into
     reef-chemistry.md before they are implementable in full: §25 covers the
     parameters and forbids borrowing another parameter's thresholds, but it
     deliberately mints no phosphate, nitrate or salinity figures, and says so
     under "what this does not settle". Each therefore has a part that can be
     built today (removing wrong reasoning; wiring salinity into the engine)
     and a part that cannot (what the right reasoning is). Neither is
     [approved]; both are split so the buildable half is obvious once it is.
     TW-031 is fully specified by §20 except for one line, flagged in the item. -->

- [ ] [chem] TW-029 DEFECT — phosphate and nitrate are assessed with alkalinity's reasoning
      phase: 8b — the defect half of reef-chemistry.md §25.
      why: Dan's 14 August decision, in his own words: *"I have noticed silly
      notifications of phosphate coming up and silly notifications of nitrate
      coming up, which don't make sense, because the wrong measurements are
      being applied to them — it's the same measurements as alkalinity and
      calcium."* §25 records this as **a real defect, not a display problem**:
      the notices are wrong, not merely unhelpful. Phosphate bounces; applying
      alkalinity's trend logic and thresholds to it produces noise dressed as
      findings. §12 gains the matching refusal — the app does not judge one
      parameter by another parameter's thresholds, trend logic or evidence bar.
      what is actually shared today — three generic loops in
      src/lib/findings.js run over every entry in `paramDefs` with one set of
      rules, and phosphate and nitrate go through all three:
        - **`far-out-<key>`** (findings.js:218-251). Threshold is a full band
          outside the band — `outBy >= (def.max - def.min)`, i.e. two half-bands
          — with severity raised to `act` only when also outside SAFE_BOUNDS
          (:87-111). Scaling an alarm to the width of the user's own band is
          alkalinity's logic. Verified arithmetic at the default bands
          (constants.js:33-34): phosphate 0.03-0.10 flags high at >=0.170 ppm
          and low at <=**-0.040 ppm**; nitrate 5-15 flags high at >=25 ppm and
          low at <=**-5 ppm**. Both low thresholds are negative, so **neither
          parameter can ever produce a far-out-low finding at any reading a kit
          can return** — including 0.00 ppm phosphate, which SAFE_BOUNDS itself
          calls out of bounds (min 0.01, :102) and which reading-meaning.js:51
          describes as starving corals and inviting dinoflagellates. Alkalinity
          at the same defaults flags at >=9.4 / <=7.6, which is the behaviour
          the rule was written for. One rule, sensible on one parameter,
          unreachable on another.
        - **`heading-out-<key>`** (findings.js:424-510). A 30-day linear
          regression, slope > 2x its own standard error, a noise-floor gate off
          STABILITY_RULES, `directional()` (:118-132, needs >=4 rows) and a
          45-day projection horizon. Nitrate and phosphate are 7-day-cadence
          parameters (constants.js:33-34 `freqDays: 7`), so a 30-day window
          holds about 4-5 readings and the required `rows.length >= 5` is
          barely met — a regression over four intervals of a bouncing
          parameter. Alkalinity tests every 2 days (:26) and gets ~15. The
          file's own comment at :453-459 records the symptom already: phosphate
          *"being projected to leave its range in 34 days on a trend of 0.006
          ppm a week, against a kit that resolves 0.02 ppm and readings that
          swing six times that between tests. The regression was confident
          about a movement nobody could have measured."* The noise-floor gate
          added there is a patch on the borrowed rule, not per-parameter
          reasoning.
        - **`paramStatus`** (src/lib/dates.js:24-29) — a bare min/max/ok test
          against the same band, the gate that decides whether `heading-out`
          is even considered (:428-429).
      what already is per-parameter, and should be read before anything is
      designed: STABILITY_RULES (src/lib/stability-engine.js:47-52) gives
      phosphate a 14-day window in **percent** mode with a 0.02 noise floor and
      nitrate a 28-day window in percent mode with a 1.0 floor — i.e. the
      stability layer already knows these two are proportional, bouncy and
      slow-cadence, while the findings layer does not. measurement-noise.js:12
      and time-in-range.js:17,75 carry their own per-parameter figures again.
      Whether the right fix is to teach the findings loops what those layers
      already know, or to move the whole judgement into the engine per §25, is
      the first question of this item.
      scope note — this is not "delete the phosphate notices". Removing the
      wrong reasoning is buildable now; **what the right reasoning is is not
      yet canon** and may not be invented here (§25, "naming a parameter in
      this table does not authorise inventing its thresholds"). Expect this to
      split: a change that stops the borrowed rules producing wrong notices,
      and a canon entry from Dan giving phosphate and nitrate their own
      thresholds, windows and noise floors, sourced the way §2, §3 and §5 are.
      spec: docs/spec/reef-chemistry.md §25 (the coverage table, "one engine
      does not mean one set of rules"), §12's new refusal, §5 (noise floors as
      a per-parameter concept), §4 (cadences and windows likewise)
      repro: none written yet. A test that pins the two negative thresholds
      above — that no phosphate or nitrate reading, at any value >= 0, can
      reach `far-out-low` — would have caught this and is the obvious first
      artefact of the item.
      owner: Dan for the phosphate/nitrate reasoning first, then implementer

- [ ] TW-030 Salinity is not assessed at all
      phase: 8b — the second thing reef-chemistry.md §25 names as missing.
      why: §25's coverage table lists salinity as **needs its own treatment**,
      and §19's engine assesses every parameter. Today salinity has no
      assessment of any kind: `deriveTankState` (src/App.jsx:142-162) calls
      `assess()` for alkalinity, calcium and magnesium only, and builds
      `doseStates` from those three, so salinity reaches no wizard state, no
      verdict, and nothing for a surface to echo under §19.
      what salinity does have today, which is four disconnected fragments:
        - a band, 34-36 ppt (src/lib/constants.js:27), and therefore a
          `paramStatus` low/ok/high and the generic `far-out-salinity` finding
          from the loop TW-029 describes.
        - a bespoke `salinity-off` finding (src/lib/findings.js:568-587) that
          fires when salinity is far enough from **35** to skew other readings
          — a good piece of reasoning, hardcoded against a literal 35 (:584),
          suppressed when `far-out-salinity` already fired (:579).
        - a rail — 0.5 ppt/day, reef-chemistry.md §3, carried forward from the
          previous canon and enforced nowhere for salinity, since nothing
          proposes a salinity change.
        - a role inside magnesium's assessment: `out.salinityShift`
          (src/lib/dosing/helpers.js:762-780, surfaced at :1118) converts a
          salinity move into the magnesium ppm it explains. Magnesium already
          treats salinity as a cause; nothing treats it as a subject.
      three different reference points for the same number, none of them
      canon: the 34-36 band (constants.js:27), the literal 35 in the skew
      finding (findings.js:584), SAFE_BOUNDS 32-37 (findings.js:106), plus
      `salt-baseline.js:4` (35) and `icp-reference.js:74` (ideal 35, range
      31.5-38.5). Any assessment has to settle which one it is measured
      against, and that is a canon question, not an implementation one.
      why it matters beyond tidiness: salinity is the one parameter that
      changes what every other reading means — everything dissolved scales
      with it, which is what the skew finding already says. A tank whose
      salinity is drifting produces alkalinity, calcium and magnesium
      verdicts built on a moving baseline, and the engine currently has no way
      to say so.
      scope note — same split as TW-029. Wiring salinity into the engine is
      buildable; **what its reasoning is is not yet canon.** §25 mints no
      salinity figures deliberately. Needed from Dan: what salinity is judged
      against, what counts as movement (its noise floor is 0.2 ppt in
      stability-engine.js:47 and 0.2 in measurement-noise.js:12 — consistent,
      but unsourced in canon), and what the app should say, given it never
      doses salinity and the answer is always top-off or a water change.
      spec: docs/spec/reef-chemistry.md §25 (coverage table), §3 (the existing
      rail); docs/spec/wizard-states.md §19 (every parameter has a verdict
      every surface renders)
      owner: Dan for the salinity reasoning first, then implementer

- [ ] TW-031 Confirmation before hiding a serious notice; every notice becomes hideable
      phase: 8b — the third thing the decision creates. **Build with TW-027**,
      not after it: TW-027 makes the notices hideable and this is the guard
      that makes that safe.
      why: wizard-states.md §20, decided 14 August. Every notice can be
      hidden, **no exceptions, including safe-bounds excursions** — *"If
      someone wants to hide a notification, they can hide a notification.
      There might be a reason the app doesn't know about."* Serious notices
      get a confirmation first, with the settled wording:
        "This is flagged as a serious notification. Are you sure you wish to
        hide it?"
      plus a line noting hidden notices can be brought back from the tank
      summary. The confirmation is a speed bump, not an exception — it creates
      no class of notice that cannot be hidden.
      what changes in code:
        - `dismissible: !(f.severity === "act" && f.scope === "chemistry")`
          (src/lib/narrative-engine.js:394) becomes unconditional. Its stated
          reason — that hiding "ammonia is dangerously high" is the one thing
          the summary must not allow — is overruled by §20.
        - the five dose claims built with no `dismissible` flag at all
          (`correcting-dose` :457, `correction-due` :464, `correction-done`
          :471, `correction-stalled` :478, `correcting` :485-492) gain one.
          Their stated reason — hiding a correction leaves the tank being
          deliberately pushed with nothing on screen saying so — is likewise
          overruled, and the confirmation is what answers it.
        - a confirmation step in front of the hide control on every surface
          that carries one, which after TW-027 is more surfaces than today.
          §18's accessibility floor applies: 44 px targets, keyboard
          reachable, and it must be usable one-handed with wet fingers.
        - the "bring it back from the tank summary" line must be true —
          `dismissedList` (App.jsx:140) and Setup.jsx:484 already list hidden
          findings; check the summary itself does, and that the route back is
          where the sentence says it is before shipping the sentence.
      resurfacing needs no new mechanism: a hidden notice returns on the next
      reading that would trigger it, because the new verdict supersedes the
      hidden one (§20). `findingHidden` (DoseExpectation.jsx:148) already
      implements exactly this for findings — an entry stays hidden only while
      the stored signature still equals the current one — so this is a routing
      job, not a new rule.
      the one open line: **what counts as "serious".** Dan's decision does not
      define it. §20 maps it to the app's existing severity vocabulary — a
      finding of severity `act`, or a wizard state whose §3 tone is red
      (`blocked`, `emergency`) — and flags in the section itself that this
      mapping is the spec's inference and not the owner's words. Correcting it
      is a one-line change to §20. Worth Dan's nod before this ships, since it
      decides how often the confirmation appears; everything else in the item
      is settled.
      spec: docs/spec/wizard-states.md §20 (hiding, the wording, resurfacing),
      §19 (the surfaces that carry a hide control), §18 (accessibility floor)
      owner: implementer, once Dan confirms the "serious" mapping in §20

## Blocked

- [ ] [blocked] TW-022 `verify:deadcode` lands advisory — three unread `useMemo` values
      why: scripts/verify/deadcode.mjs (ported from legacy/tools/deadcode.py, extended to
      catch component-local dead `useMemo` values, not just top-level dead code) finds
      `doseAdvice` at Insights.jsx:108 and Dashboard.jsx:298 (already known,
      .agent/five-decisions.md) and a new one, `preview` at Tasks.jsx:27 — see
      `.agent/findings.md` for what each is and whether it's a real feature gap.
      what it would take to go blocking: resolve or explicitly accept each of the three
      (delete the dead memo, or wire it up), rerun `npm run verify:deadcode` clean, flip
      `deadcode`'s mode to `'blocking'` in scripts/verify/run.mjs.
      owner: implementer for the two known cases; `preview` needs a domain read first
      (is the water-change preview a missing feature or leftover code?) before it's safe
      to call [approved]

- [ ] [blocked] TW-023 `verify:csscheck` lands advisory — three dead CSS rules
      why: scripts/verify/csscheck.mjs (ported from legacy/tools/csscheck.py, reading
      src/styles/*.css and JSX source directly instead of a built HTML file) finds
      `.err`/`#boot` (leftover from the monolith's removed boot-loader screen) and
      `.rc-head` and `.rc-modal` (never applied as a className anywhere — `.rc-modal`'s
      case is a live a11y gap: the light focus ring it was meant to add inside modals
      never turns on). See `.agent/findings.md`.
      what it would take to go blocking: delete `.err`/`#boot` (confirmed orphaned), and
      for `.rc-modal` either apply the class where modals render or get a11y-reviewer to
      confirm the default ring already clears contrast there; rerun `npm run
      verify:csscheck` clean, flip `csscheck`'s mode to `'blocking'`.
      owner: implementer for the deletions; a11y-reviewer's read needed before `.rc-modal`
      is called safe to drop instead of fixed

- [ ] [deps] TW-024 `npm run lint` doesn't exist; several checkers overlap what eslint does
      why: AGENTS.md's Definition of Done requires `npm run lint` clean, and there is no
      `lint` script in package.json — true before this routine and still true after it,
      since adding a dependency is out of scope here (AGENTS.md rule 6, Dan approves).
      Three of the ported checkers in scripts/verify/ have off-the-shelf equivalents that
      would do the same job better once eslint exists:
        - scripts/verify/linkcheck.mjs (undefined calls/components) -> `no-undef` +
          `eslint-plugin-react` (component-usage rules), real scope resolution instead of
          the flat-file/single-import-hop heuristic this port uses.
        - scripts/verify/hookcheck.mjs (hooks must run unconditionally) ->
          `eslint-plugin-react-hooks`'s `rules-of-hooks`, which understands actual control
          flow instead of a fixed-indent heuristic.
        - scripts/verify/deadcode.mjs (dead exports) -> a dead-export finder (e.g.
          `eslint-plugin-unused-imports` or `ts-prune`-style tooling), real import-graph
          resolution instead of a whole-tree text-frequency count (documented coverage gap
          in that file's header comment).
      evidence this isn't a guess: each ported checker above already does a cruder version
      of what the eslint equivalent does, and each one's docstring/header names the exact
      real bug it exists to catch — see .agent/phase5-gate.md §3 and §5.
      cost: one new devDependency (eslint) plus two plugins
      (eslint-plugin-react-hooks, eslint-plugin-react), a config file, and CI wiring —
      closes this item's own `npm run lint` gap and three checkers' coverage gaps at once.
      owner: Dan approves the dependency; implementer wires it in once approved

## Done

- [x] [approved] TW-021 `verify:linkcheck` and `verify:propcheck` flipped advisory -> blocking
      why: both checkers were failing on real reference bugs, not false positives —
      `App.jsx:1275` called `goTo(...)`, which only existed inside `Dashboard`'s own body,
      and `Tasks.jsx:198` called `onComplete(id)`, which `Tasks` never received (only
      `onMarkDone` is passed in). Both threw `ReferenceError` at runtime on a real user
      action (tapping "Open the Dosing Wizard" from the log-result popup; tapping "Mark
      done" in a reminder's reschedule sheet). Fixed both call sites, confirmed
      `npm run verify:linkcheck` and `npm run verify:propcheck` clean, then flipped both
      checkers' `mode` from `'advisory'` to `'blocking'` in `scripts/verify/run.mjs`.
      spec: none — wiring bugs, no chemistry involved.
      repro: src/test/defects/tab-navigation-crashes.test.jsx (both cases, RTL — a plain
      pure-function test doesn't fit a UI-interaction bug)
      owner: implementer — routine 15 (phase 6), bug 1
