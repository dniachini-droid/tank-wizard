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

<!-- 2026-08-14 consistency sweep: 9 new items promoted (TW-033-041), ordered
     within this block by the night's priority rule (wrong dose reaching the
     user > data loss > offline failure > crash > a11y contract violation >
     perf budget > everything else). Not interleaved into the rest of the
     file's existing order — see the sweep's triage record for the full
     found/merged/deleted/promoted/escalated count. StabilityStrip (13th
     classifier), AlkAssessmentBlock's dual numbers, and the TW-004/TW-014
     binding were folded as evidence onto TW-002/TW-006/TW-004/TW-014 above
     instead of filed as new items. -->

- [ ] TW-036 DoseChangeSheet's amount field doesn't re-sync when a second staged-plan shortcut is tapped without closing the sheet
      why: the amount field is seeded once via useState (DoseChangeSheet.jsx:17) and never
      re-syncs to a changed `recommended` prop. In a staged multi-day plan, "Step to X" and
      "Go to Y" both open the same already-mounted sheet (ErrorBoundary.jsx:209,212 → :249,
      React reuses the instance) — tap one shortcut, then the other without closing the
      sheet, and the field keeps the FIRST figure while the button just pressed claims the
      second.
      in plain terms: consider the small step, change your mind and tap "go straight to
      the full dose" instead — the entry box quietly keeps the small number, and unless
      you notice, the dose you record is not the one you just asked for.
      spec: docs/spec/wizard-states.md §12/§16 (the recorded dose must match what the
      wizard just told the user)
      repro: REPRODUCED LIVE (jsdom + react-dom, real components, no mocks) — staged plan
      [7.5, 8.4, 9.9]: "Step to 7.50" -> field 7.5; "Go to 9.90" with sheet still open ->
      field still 7.5. General case also confirmed: recommended changing 9.9->14.2 while
      sheet open leaves input at 9.9. (wizard-dose-auditor, 2026-08-14)
      suggested fix: key DoseChangeSheet off prefill/recommended, or useEffect-resync the
      field when it hasn't been hand-edited.
      owner: implementer

- [ ] [schema] TW-033 Snapshot/file restore silently overwrites targets and drops same-day rows, while claiming nothing was lost
      why: three consequences of one root cause in src/lib/backup.jsx's restore/merge path.
      (1) restoreBackup unconditionally overwrites live custom-ranges (targets) with the
      snapshot's copy (backup.jsx:170-172) — no merge, not gated by the applySettings flag
      that DOES gate tank-settings just above it. Because band classification is computed
      live against custom-ranges everywhere in history (WaterLog rows, chart shading,
      tooltips — TW-013's mechanism), a restore instantly and silently reclassifies every
      reading in the log, including readings logged after the snapshot. Setup.jsx:722-728's
      confirmation text ("Snapshot restored — anything missing was added, nothing was
      overwritten") is false for this one field.
      (2) The natural key used to dedupe restored rows omits time of day — readings key
      is param|date (backup.jsx:75), dose-log key is element|date (backup.jsx:120,123).
      Two same-parameter entries on one calendar day collide on restore; the later row is
      silently dropped while inspectBackup's preview counts both as "fresh" (it dedups
      against current state only, never within the incoming file itself).
      (3) downstream meaning loss: because neither a reading's classification-at-time
      (TW-013) nor a dose's trigger context (TW-014) is ever stored, a restore that
      changes targets or drops a row leaves no trace that anything changed — no surface
      can even detect the mismatch it just created.
      in plain terms: use the undo feature to recover a few lost readings and, as a side
      effect, every historical test result quietly re-labels itself against whatever
      target was set on the snapshot's day — and if you logged two tests of the same
      parameter on one day, the restore keeps one and throws the other away while its own
      screen says both came back safely.
      spec: docs/spec/wizard-states.md §16 ("Recomputing the past against present
      settings is an S1 defect"); §8/§16 (history record completeness)
      repro: contradiction-hunter LIVE repro against the real unmodified functions (no
      mocks) — backup with two alk readings 2026-08-10 08:00 and 18:00 restored into
      empty state: preview {total:2, fresh:2, skipped:0}, actual restored rows: 1 (the
      08:00). Identical for dose-log. Scripts: scratchpad/{readings-key-collision2,
      doselog-key-collision}.mjs (contradiction-hunter, 2026-08-14). custom-ranges
      overwrite: static trace unambiguous (backup.jsx:170-172, Setup.jsx:722-728),
      dynamic repro not independently exercised this run (read-only discovery path);
      adjudicator UPGRADED this half to VERIFIED and confirms it is worse than filed —
      even the manual-file-restore path overwrites targets, not just the daily ring.
      note: binds to TW-013 and TW-014 — a restore that changes targets or drops a row
      can make "why did I raise this dose?" permanently unanswerable and unflagged as
      unanswerable (contradiction-hunter, compositional finding, medium confidence).
      suggested fix: root fix is TW-013 (persist classification at log time); until then
      restoreBackup should merge custom-ranges rather than replace (or the confirmation
      must name the overwrite), and both natural keys need time-of-day (or a composite
      fallback), with inspectBackup's fresh-count sharing restoreBackup's exact dedup
      logic.
      owner: Dan to weigh in on the schema/merge approach; implementer once approved

- [ ] TW-034 One-off dose corrections feed the dosing engines but appear in no history view and no CSV, and can't be deleted
      why: logCorrection (App.jsx:888-905) writes to a separate `corrections` array that
      feeds the engines' math — consumption-disturbance fitting, pendingCorrection/
      repeatedCorrections gating (alkalinity.js:83,486,513,721,776,853; calcium.js:74,
      184-185) and buildFindings (App.jsx:124,134-137) — but is rendered on no history
      surface and exported in no CSV (export-csv.js:5's buildCsv signature has no
      corrections param; the one call site, Setup.jsx:744, passes none). deleteCorrection
      (App.jsx:907) is defined and wired to nothing, so a logged correction cannot even be
      reviewed or removed through the UI.
      in plain terms: log a correction and the app privately uses it to explain your
      tank's behaviour from then on, but nowhere — including the CSV you'd export — is
      the correction itself written down. "Why did the consumption estimate jump last
      month?" becomes unanswerable from your own records.
      §8/§16 gap on a dosing path distinct from TW-014: this is a separate array with
      zero visibility anywhere, not a dropped field on an existing record.
      spec: docs/spec/wizard-states.md §8 (history record shape), §16 (history-truthfulness)
      repro: grep confirms deleteCorrection has no call site; buildCsv signature
      (export-csv.js:5) and its one call site (Setup.jsx:744) confirmed to omit
      corrections (contradiction-hunter, 2026-08-14)
      suggested fix: give corrections the §8 record shape and a history row (or fold into
      doseLog with type:"correction"), add to buildCsv, wire deleteCorrection or remove it.
      owner: implementer

- [ ] TW-035 doseStatus.target holds two incompatible physical quantities under one name
      why: the top-level `target` field on doseStatus is a dose RATE (mL/day) in the
      majority of branches — "suggested" (state.js:361, target: a.maintenanceDose) and
      "settling"/"due"/"worked" (state.js:294,300,315, target: plan.target) — and a
      concentration only in "emergency" (state.js:205, target: mid). state.js:314's own
      nearby prose calls the same field "mL/day".
      in plain terms: the same labelled box sometimes holds "the level you're aiming for"
      and sometimes "how fast you're dosing"; nothing breaks today because no live
      consumer reads the field generically (checked — only correctionPlan.target, a
      different object, is rendered) — which is exactly the danger: the day a future
      change reads it generically, a dose rate could render as "8.4 dKH" with no test to
      catch it.
      spec: docs/spec/wizard-states.md §15 (one word, one concept, applied to the
      internal contract)
      repro: tests/parity/dose-status-target-field-semantics.test.js — every branch driven
      through the real function (dose-parity-checker, 2026-08-14, confirmed by adjudicator
      independent re-run)
      suggested fix: split the field (targetDose / targetLevel).
      owner: implementer

- [ ] [blocked] TW-037 reading-meaning.js's six invented headline categories disagree with §13, and one of them ("drifting") means the opposite word for word
      why: reading-meaning.js's computeControl invents six headline categories not in
      §13's band table — sliding/"Moving fast", loose/"Wide swing", dialled/"Dialled in",
      controlled/"Well controlled", steady-off/"Steady, running high/low", drifting/
      "Drifting high/low" — rendered at Dashboard.jsx:467, in the same modal opened by
      tapping the band badge. Two live/near-live contradictions:
        (1) "drifting" (reading-meaning.js:218) fires only when the window MEDIAN sits
            OUTSIDE the band; §13 defines drifting as INSIDE the band, trending toward an
            edge. Same word, opposite band position.
        (2) "steady-off" fires on median position while the CURRENT reading is in band —
            reproduced live: 10 low alk readings (7.2-8.0, band 8.2-8.8) then a recovering
            8.25-8.3 -> paramStatus "ok" (teal card) but ParamHistoryModal (opened by
            tapping that same card) leads "Steady, running low" in blue
            (Dashboard.jsx:374-380,464-467). Script: scratchpad/drift-collision3.mjs.
      in plain terms: a second, home-made vocabulary sits on top of the official band
      words, and its one shared word means the opposite of the official one — "Drifting
      high" here says you're already out of range; everywhere else in the app it means
      you're still in range but sliding toward the edge. Tap a card that says you're fine
      and the very next screen says you're running low, for a reading inside the range
      you set.
      blocked on: needs-dan escalation (see .agent/needs-dan.md, "reading-meaning
      vocabulary vs §13's band words") — whether consistency-over-time gets its own
      registry entries distinct from §13's bands, or folds into the existing seven. This
      mixes rate-of-change grading with band position and needs chemistry judgement, not
      a bare rename.
      related: TW-016 (the word "drift" used for three meanings across Dashboard/
      Insights/reading-meaning) is the wording-drift half of the same surfaces; this item
      is reading-meaning's own invented-category system and its two concrete
      contradictions.
      spec: docs/spec/wizard-states.md §13 (band-verdict definitions), §5 (no invented
      or reused vocabulary)
      repro: reading-meaning.js:196-219; Dashboard.jsx:467 (terminology-auditor); live
      repro script scratchpad/drift-collision3.mjs against the real computeControl module
      (contradiction-hunter, 2026-08-14, adjudicator-confirmed)
      owner: blocked on Dan's registry decision; implementer once unblocked

- [ ] TW-038 buildOverview computes a real cross-parameter narrative every render and shows it nowhere; wiring it in without unifying first creates two landmines
      why: buildOverview's cross-parameter narrative (narrative-engine.js:1220-1343) —
      Ca:alk and Mg:Ca ratio commentary, the alkalinity-vs-nutrients "burnt SPS tips"
      warning, pH read against alkalinity, a stability paragraph, a stale-testing warning,
      and the "if you do one thing this week" priority sentence — is computed correctly
      every render and consumed nowhere. Only overview.headline and overview.score have
      consumers (TodayPanel.jsx:645, Dashboard.jsx:38); overview.paragraphs has zero JSX
      consumers anywhere in src/. The legacy app rendered it under a "Read full assessment"
      expander (legacy/releases/reef-console-v1-stable.jsx:5278); the render call did not
      survive the rewrite into OverviewCard.
      in plain terms: the app quietly works out real cross-checks — e.g. that high
      alkalinity with lean nutrients is the classic setup for burnt SPS tips, or that a
      calcium-to-alkalinity ratio far off balance means one dosing program needs
      attention — and then throws the advice away. The keeper sees a headline and a score
      with no explanation.
      two landmines gated behind this fix, both latent only because paragraphs render
      nowhere today — acceptance criteria for this item include resolving BOTH before any
      wiring:
        (1) pH "running high" threshold split: narrative-engine.js:1191 uses >8.4 (inside
            the never-rendered paragraphs), findings.js:528 uses >8.45 (live, reaches
            Briefing/FindingList). For a pH between 8.40 and 8.45, nothing on screen
            claims "running high" today; the moment paragraphs are wired in, the app
            would say high and not-high about the same reading in one view.
        (2) two independently-computed "what matters most" answers with no shared source
            and no cross-check: buildOverview's "if you do one thing this week" waterfall
            (narrative-engine.js:1220-1288, its own priority order: far-out -> nutrient-
            starved -> swinging -> drifting -> off-target-age -> pH -> stale -> thin-data)
            and buildBriefing's claim ordering (:356-543). Wiring paragraphs in without
            unifying these means the app can name two different top priorities in one
            view.
      spec: docs/spec/wizard-states.md §14 (no contradicting messages in one view);
      reef-chemistry.md (pH threshold to be named once, canon TBD)
      repro: grep -rn "overview\." src/components -> only TodayPanel.jsx:645 and
      Dashboard.jsx:38 consume it; grep -rn "\.paragraphs" -> zero JSX consumers,
      definition only at narrative-engine.js:1343 (message-consistency-auditor,
      2026-08-14); waterfall/claim-ordering divergence traced by contradiction-hunter,
      2026-08-14, no shared consumer found by grep.
      suggested fix: name the pH-high figure once in canon and collapse both branches to
      it; derive buildOverview's priority sentence from the top Briefing claim (or
      justify divergence explicitly) — THEN wire overview.paragraphs into OverviewCard
      behind an expander as legacy did, or thread buildOverview's output into Insights.
      owner: implementer

- [ ] TW-039 rate-rails.test.js still asserts the pre-14-Aug rail canon; a red test sits next to code that is actually correct
      why: src/test/spec/dosing/rate-rails.test.js still asserts calcium 25 / magnesium
      100 ppm/day as "the canon table verbatim". The rail-constant fix (closed 2026-08-13,
      see TW-016 Done) updated correction.js and the sibling rails tests to current canon
      (reef-chemistry.md §3: alk 0.5, Ca 20, Mg 25) but missed this one file. Its header
      also cites "reef-chemistry.md §6, lines 149-166", a range that no longer exists
      (rails are now §3, ~107-113).
      in plain terms: a leftover checklist still says magnesium may rise 100 ppm a day
      when the decided safe ceiling is 25; the app itself is correct today, but anyone who
      trusts this red test as "code is out of spec" and fixes safe-rate.js to match it
      would reintroduce a magnesium rail four times too loose.
      spec: docs/spec/reef-chemistry.md §3
      repro: npx vitest run src/test/spec/dosing/rate-rails.test.js -> FAIL "calcium
      default rail is 25 ppm/24h per canon (code enforces 20)"; FAIL "magnesium default
      rail is 100 ppm/24h per canon (code enforces 25)" (manual-dose-auditor, 2026-08-14,
      confirmed by adjudicator: "fix the TEST, not the code")
      suggested fix: update the test's expectations (Ca->20, Mg->25) and its citation to
      §3 — same-shape follow-up to the closed TW-016 rail fix, not a new chemistry
      decision, so no [chem] tag needed.
      owner: implementer

- [ ] [a11y] TW-040 ICP confirmation popup renders every element value with no unit and no aria-label
      why: IcpConfirmation.jsx renders element values and "biggest moves" as bare numbers
      with no unit and zero aria-* attributes in the file.
      in plain terms: after logging an ICP lab result, the "biggest moves" numbers carry
      no ppm/ppb, and a screen reader announces context-free numbers with no unit or
      parameter name.
      spec: docs/spec/wizard-states.md §18 (accessibility floor); §15 (units are part of
      the reading, not decoration)
      repro: code trace — IcpConfirmation.jsx:134 "{e.v} · {e.st}", :156 biggest-moves
      values; zero aria-* attributes in file (terminology-auditor, 2026-08-14, unchanged
      finding from prior sweep, now also checked for a11y)
      suggested fix: thread units from icp-reference.js into lines 134/156, add
      aria-labels.
      owner: implementer

- [ ] [a11y] TW-041 ZoomableLineChart never receives or displays a unit or parameter name; axis and tooltip are unit-less at every call site
      why: ZoomableChart.jsx's prop signature (line 69) carries no unit/label/def; axis
      tickFormatter (:202) and tooltip formatter (:209) never append one (niceAxis,
      :47-61); zero aria-* in the file. All three call sites — Dashboard.jsx:612,
      IcpPanel.jsx:168, AllParametersSheet.jsx:285 — pass nothing.
      in plain terms: every gridline and tooltip on every history chart is a bare
      number — is that 8.2 dKH, ppm or ppt? A screen reader announces context-free
      numbers with no chart label either.
      spec: docs/spec/wizard-states.md §18 (accessibility floor); §15 (units are part of
      the reading)
      repro: code trace — ZoomableChart.jsx:69,202,209,47-61; callers Dashboard.jsx:612,
      IcpPanel.jsx:168, AllParametersSheet.jsx:285 (terminology-auditor, 2026-08-14,
      unchanged finding, now also checked for a11y)
      suggested fix: add unit/label props, append in axis formatters, aria-label the
      chart container — one component fix clears all three call sites.
      owner: implementer

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

- [ ] TW-017 Terminology: "water volume" is now a banned synonym for "net volume"
      why: Dan's 2026-08-13 registry decision. wizard-states.md §15 now
      requires "net volume"; "water volume" is never-use. terminology-auditor
      previously found "tank volume" / "net volume" / "water volume" all live in the
      app, twice in one message at src/lib/findings.js:362-363.
      2026-08-14: terminology-auditor finds the same byte-identical double-offender at
      findings.js:362-363 still live, plus two more sites not previously catalogued:
      drift.js:282 and DosingWizard.jsx:258, both still reading "Set your tank volume in
      Setup". Setup.jsx itself is clean ("net volume").
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
      2026-08-14: band-classifier-auditor and dose-parity-checker independently catalogue
      a 13th classifier — StabilityStrip (TodayPanel.jsx:314) computes its own
      in/out-of-band test straight off def.min/def.max to pick its spread-bar colour,
      agreeing with paramStatus today by coincidence only. Now permanently
      regression-tested: tests/parity/stability-strip-vs-param-status.test.js (real
      component via @testing-library/react) — last reading 8.5 in a 8.2-8.8 band
      (paramStatus "ok") plus a 12-day-old 7.9 in the window still renders the strip's
      hardcoded "#A2621B" excursion colour; the strip reappears in the Briefing feed too.
      Fold into this item's fix (colour off the engine's band once classifyReading
      exists) rather than filed separately.
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
      2026-08-14: contradiction-hunter — this is ONE fix with TW-014, not two. Even once
      this item adds an entry-time warning, no field exists anywhere in the write path
      (DoseChangeSheet.jsx:16,63 onSave(ml,date,time); stored shape {date,time,ml,element,
      note}; export-csv.js:20-21 identical) to carry "this exceeded a rail" — so a
      rail-violating manual dose, once recorded, is forever indistinguishable from an
      engine-approved one in history and CSV. Fix both together: {ml, recommended,
      railExceeded} through the write path.
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
      2026-08-14: contradiction-hunter finds a tighter, earlier manifestation of this same
      root cause — AlkAssessmentBlock renders BOTH numbers in one uncontested render,
      before any sheet even opens: the staged list says "Set 8.4 mL/day now"
      (ErrorBoundary.jsx:188-190) while the shortcut two lines later says "Step to 7.5"
      (:209-210), both unconditional in the same JSX block (:177). Pinned by the existing
      multiday-plan-parity test. Filed as evidence on this item, not a new one.
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
      related: TW-033 — a snapshot/file restore opens a second, silent door to this exact
      bug (custom-ranges overwritten unconditionally on restore) and compounds with
      TW-014 to erase the reason a dose change is in history at all.
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
      2026-08-14: contradiction-hunter — this is ONE fix with TW-004, not two (see that
      item's note); and a restore that changes custom-ranges compounds with this item and
      TW-013 to make "why did I raise this dose?" permanently unanswerable and unflagged
      as unanswerable — see TW-033's scoping note.
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
      added 2026-08-14, after bug 7 (TW-020) merged — **a fourth borrowed rule,
      latent rather than live, and a unit error rather than a threshold one**.
      `correctionProgress` (src/lib/dosing/helpers.js:280) now reads
      `STABILITY_RULES[def.key].noiseFloor` and uses it as an absolute value in
      the parameter's own unit: `zoneWidth = min(bandWidth, max(bandWidth/3,
      2*noiseFloor))`. That is correct for the three `mode: "absolute"`
      elements and was verified against §9's worked table when it was written
      (alkalinity 8.40-8.60, calcium 415-435). It is wrong for the only two
      entries in **percent** mode — phosphate `noiseFloor: 0.02, unit: "%"`
      and nitrate `1.0, "%"` (stability-engine.js:51-52) — where the figure is
      a proportion, not ppm. Arithmetic at the default bands: phosphate
      `bandWidth/3` = 0.0233 against `2*noiseFloor` = 0.04, so the misread
      constant **binds** and sets the zone at 0.045-0.085 — 57% of the band,
      where §9 asks for a middle third. Nitrate's 3.33 beats its 2, so the
      misread constant is inert there and the zone is the intended 8.33-11.67.
      latent, not live: `correctionProgress` is called only from
      alkalinity.js:480,644, calcium.js:233,354 and helpers.js:734,863
      (magnesium). Phosphate never reaches it today. It goes live the moment
      this item gives phosphate an engine, which is the reason it is recorded
      here rather than as a bug of its own — whoever writes phosphate's
      reasoning has to decide whether that noise floor is a proportion or a
      ppm figure before anything reads it, and §5 is where that belongs.
      no fix proposed, deliberately: reading the percent floor as a percentage
      of the band, giving `correctionProgress` its own per-parameter floor, and
      giving phosphate an absolute floor in `STABILITY_RULES` are three
      different chemistry decisions (AGENTS.md rule 3, and §25's "naming a
      parameter in this table does not authorise inventing its thresholds").
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
      2026-08-14: raised again by routine-13-phase5-gate (same three values, Tasks.jsx:27
      `preview` included) but NOT independently re-verified this run — adjudicator flags
      it UNVERIFIED-tonight, not reconfirmed. Content matches this item exactly; no new
      item filed.

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
      2026-08-14: raised again by routine-13-phase5-gate (same three rules) but NOT
      independently re-verified this run — adjudicator flags it UNVERIFIED-tonight, not
      reconfirmed. Content matches this item exactly; no new item filed.

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

- [x] [schema] TW-D11 The remaining 23 storage keys move to IndexedDB, behind the unchanged loadKey/saveKey contract
      why: photos left localStorage in c7ed9d0; everything else stayed in a synchronous
      ~5 MB text store with all-or-nothing writes. The routine's enumeration found 23
      keys, not the plan's 20 (routines/16-durability-remainder.md, the keys table — the
      count that nobody had run included `strengths-fixed-v1`).
      fix, same shape as the photo move, one level up (`src/lib/storage.js` only):
        - values live in a `keyvalue` object store as JSON strings — byte-for-byte what
          localStorage held, so migration is checkable by string comparison and the
          parse behaves identically on both sides.
        - read order is IndexedDB first, then the drain-aware localStorage chain. A key
          found only in localStorage migrates through the existing `saveKey` path — one
          write path, not two — and a key that cannot be written stays where it works
          and is retried on a later load.
        - a confirmed IndexedDB write removes BOTH localStorage prefixes for the key
          (removals cannot fail for want of room), which is what stops the next load's
          drain resurrecting a legacy copy, and hands the drain the space it may have
          been short of. Nothing is removed before its replacement is in place.
        - the drain interaction the routine required checking rather than assuming:
          migration takes `readLocal`'s answer, which prefers the legacy copy for
          undrained keys — migrating the stale mirror would have made the TW-032 loss
          permanent. Pinned by a test that quota-blocks the drain, migrates, and shows
          the legacy value in IndexedDB with nothing left under either prefix.
        - IndexedDB unavailable: every key stays in localStorage, works exactly as
          before (`storage-double-write.test.js`, `legacy-drain-wiring.test.jsx` and
          `seed-data.test.js` run without IndexedDB and pass untouched — they are now
          the fallback regression suite), and the user is told once, through the same
          once-per-connection gate as the photo fallback — one banner per degraded
          device, not one per concern.
      knock-on, named rather than hidden: with a working IndexedDB, a full localStorage
      can no longer fail a save at all — the save lands in IndexedDB, which is the point.
      The "storage is full" message is now only reachable when both stores refuse, and
      the two message tests hold their scenario constant by breaking IndexedDB first.
      test edits, each the same class and each commented in place: assertions that read
      the row store at its old address (`lsGet`) in the two files that install
      IndexedDB — `icp-photos-in-idb.test.js` (row-location assertions and the two
      scenario tests above) and one clean-install assertion in
      `wipe-detection.test.jsx`. Every pinned property survives; the address moved,
      and TW-D11 is the authorised address change. No assertion was weakened: the
      photo-location checks got stronger (localStorage now holds nothing for the key).
      contract pinned unchanged: `loadKey` fallback semantics including stored falsy
      values (`0`, `""`, `false` return the stored value), `saveKey` true/false with
      `storageErrorHandler` reporting, `buildBackup`/`restoreBackup` format-identical
      in both directions across the move.
      what it does not buy, stated: IndexedDB is evicted by the same clears and the
      same seven-day rule. This is room and transactional writes, not durability —
      TW-D5 and TW-D12 are the durability half.
      `DB_VERSION` 3 -> 4 in `src/lib/idb.js`.
      repro: `src/test/defects/keys-in-idb.test.js`, 10 cases, 7 red before the change
      (values not in IndexedDB, localStorage not emptied); the 3 green before-and-after
      are the fallback-contract regression guards.
      authorised by `THE-PLAN-v3.md` §PHASE 7 (Dan, 2026-08-14) — AGENTS.md rule 5's
      `[schema]` item, filed with the work.
      owner: implementer — routine 16, piece three

- [x] [schema] TW-D12 Backup was entirely manual — a file the user had to remember to make
      why: `buildBackup`, `downloadJson`, `inspectBackup` and `restoreBackup` all existed
      and were well built (routine 14 §3.1), and nothing called any of them without a tap
      on the Setup tab. Roughly 80% of the system was done; the missing 20% was the
      scheduling and the destinations.
      fix, three parts (`src/lib/auto-backup.js`), each carrying what it does NOT protect
      against, because none is a complete answer:
        - a snapshot ring: the last 7 `buildBackup()` outputs in IndexedDB, written at
          most daily and when the app is backgrounded. A ring, not a slot — and it
          refuses the write that would rot it: a snapshot that collapsed to nothing does
          not go over one that held data, and the schedule skips entirely on a device
          piece one judged wiped. Restores through `restoreBackup`, so it merges by
          natural key and is idempotent. Described in the UI as an undo history — it
          lives in the same origin as the data it copies and dies with it.
        - a File System Access handle: `showSaveFilePicker()` once from a tap, the
          handle persisted, the same file rewritten on the daily cadence. Chromium-only —
          no Safari, no Firefox, therefore no iOS — and it cannot tell a synced folder
          from a local one; a lapsed permission degrades to a "needs a tap" button.
        - the share sheet: `navigator.share` with the backup as a file, one tap to
          Files/iCloud Drive on the platform where the handle does not exist. Never
          automatic (browser policy), and never recorded as a backup — the sheet reports
          dismissal and success identically in practice, so `last-backup` is not written
          on a share, or it would sometimes claim a copy that was cancelled.
      rejected again, same grounds as routine 14 §3.3: periodic programmatic
      auto-download.
      honest baseline, in the module header and the PR: the only copy that survives
      losing the phone is a file the user has put somewhere else. This makes that far
      more likely; it does not make it certain.
      also here: `DB_VERSION` 2 -> 3 (`src/lib/idb.js`, stores `backup-ring` and
      `backup-meta`) — and the bump caught piece one's test helper opening the shared
      database at a hardcoded 2, the exact `VersionError` trap the routine warns about.
      The helper now imports the constant; the assertion it serves is unchanged.
      repro: `src/test/defects/automatic-backup.test.js`, 12 cases — the ring prunes at
      7, refuses the empty-over-good write, accepts empty-on-empty, restores
      idempotently; the handle round-trips and a lapsed permission never reaches
      `createWritable`; a cancelled share writes no record; the schedule is daily, skips
      a wiped device, and is a no-op without IndexedDB while the manual path still
      works. Red before the module existed, as the photo suite was.
      authorised by `THE-PLAN-v3.md` §PHASE 7 (Dan, 2026-08-14) — AGENTS.md rule 5's
      `[schema]` item, filed with the work.
      owner: implementer — routine 16, piece two

- [x] [schema] TW-D5 A cleared browser is indistinguishable from a fresh install, and is seeded into
      why: both storage prefixes live in the same localStorage, so a clear takes all of
      it at once. On the next open every `loadKey` returns its fallback, `wc-seeded` and
      `light-seeded` are gone with everything else, and `App.jsx:489-513` reads their
      absence as "new device": 25 weekly water changes dated 16 Feb to 3 Aug
      (`src/lib/analytics/water-changes.js:9`) and one lighting note are written into a
      history that holds nothing else. The user sees a maintenance record they did not
      create beside an empty readings list, and the water-change list is not decoration —
      it is the export side of the nutrient maths. `seed-data.js:1-11` settled the same
      principle for readings; these two keys never got it.
      what it could not do before: notice. `grep -rn "install-id\|installId\|firstRun"
      src/` returned nothing — a wipe and a fresh install were byte-identical states.
      fix, in two legs, because neither is sufficient alone:
        - `src/lib/install-witness.js` keeps an install id, a first-seen date and the
          most this device ever held of each counted list, in IndexedDB. It survives a
          clear that takes only localStorage. High-water marks never fall on their own,
          so deleting a reading is not read as evidence of anything.
        - shape detection for the rest: markers absent (localStorage lost) plus either
          non-zero high-water marks, or photos in the photo store with no `icp-tests`
          rows to hang them on — which cannot exist on a device that never ran the app —
          or `navigator.storage.estimate()` over a floor of 8 MB, seven times the 1.1 MB
          the built bundle and its precache account for (`du -sh dist`). The last of
          those is `suspect`, not proof: it suppresses seeding and claims nothing.
      the rule both legs feed: do not seed into a history the app cannot account for.
      `App.jsx` writes the `*-seeded` markers even when it declines, so the next load —
      by then with a reading on it, and so no longer looking wiped — cannot walk back
      into the seeding branch.
      honest limit, stated in the module and the PR: nothing survives a full clear.
      Safari's seven-day rule and every "clear site data" control take IndexedDB too, and
      no local marker survives that. On a full clear this returns `fresh` or `suspect`.
      also here: `src/lib/idb.js`, the shared database open lifted out of
      `photo-store.js` unchanged in behaviour. Two modules opening `tank-wizard` at two
      versions is a `VersionError` that would have degraded the photo store and put
      report photos back inline in localStorage permanently — a quota regression from a
      change that never touched photos. One version constant, `onupgradeneeded` creates
      only what is missing, 1 -> 2 for `install-witness`.
      repro: `src/test/defects/wipe-detection.test.jsx` — 10 cases through a real
      `ReefConsoleInner` mount, 6 confirmed red against the pre-fix `App.jsx`. The 4 that
      passed before and after are the regression guards: a genuinely clean install still
      gets its 25 water changes and its lighting note, a user who emptied their own log
      is not told they were wiped, no backup claim is made either way, and a device with
      no IndexedDB behaves exactly as it always did.
      authorised by `THE-PLAN-v3.md` §PHASE 7, written by Dan on 2026-08-14, which names
      wipe detection as remaining work — AGENTS.md rule 5's `[schema]` item, filed with
      the work as TW-032 was.
      owner: implementer — routine 16, piece one

- [x] [schema] TW-032 `drainLegacyStore` was written, tested, and never called
      why: Dan reported a phosphate band that had "shifted from around 0.10 to 0.03"
      with nothing in `PARAM_DEFS` to explain it — `constants.js:33` has read
      `min: 0.03, max: 0.10` unchanged since `0637695`, and the day's whole `src/`
      diff contains no phosphate line at all. The mechanism that can produce that
      symptom without a code change is a lost `custom-ranges` entry: `App.jsx:388`
      falls back to `PARAM_DEFS` silently, so a custom band that goes missing
      reappears as the shipped default with nothing on screen to say so.
      what was actually broken: `ee64a23` removed the storage shim, which moved
      every read from the legacy `reefconsole:` prefix to the `danstank:` mirror.
      `drainLegacyStore` (storage.js:71) was written in that same change to carry an
      install's data across the move, and `src/test/defects/storage-double-write.test.js`
      pins its behaviour in six cases — but the only references to it anywhere were
      that test file and `src/test-surface.js:276`. Nothing in `App.jsx` or
      `main.jsx` ever ran it, so it passed its own tests on every run while doing
      nothing on a real device.
      why that loses data rather than merely wasting a function: the pre-shim
      `saveKey` ignored the mirror's return value (`lsSet(key, value); return true;`),
      so a quota failure left the legacy copy correct and the mirror stale, silently
      — and ICP report photos sat inline in localStorage until `c7ed9d0`, which is
      exactly the pressure that produces those failures. Every such key now reads
      its older copy. Not phosphate-specific: `readings`, `dose-log`, `corrections`
      and `correction-plans` are all reachable the same way.
      fix: `src/App.jsx:431` calls `drainLegacyStore()` synchronously at the top of
      the startup effect, before the `Promise.all` of `loadKey`s. Ordering is the
      point and not incidental — the drain records the keys it could not finish and
      `loadKey` consults that record to keep preferring the legacy copy for them, so
      both halves must run before the first read. The drain itself is unchanged.
      repro: `src/test/defects/legacy-drain-wiring.test.jsx` — four cases through a
      real `ReefConsoleInner` mount, not against the drain directly, because the
      wiring is the whole defect: a custom phosphate band of 0.05-0.12 behind a
      stale mirror, the same band read off the dashboard card's gauge, a legacy key
      with no mirror at all, and a clean install left untouched. 3 of the 4
      confirmed red against the pre-fix `App.jsx` (the fourth is the no-op case and
      passes either way).
      authorised by Dan directly on 2026-08-14, in session — AGENTS.md rule 5
      reserves storage-schema work for a `[schema]` item, and this is that item,
      filed with the work rather than before it.
      owner: implementer

- [x] [chem] TW-016 correction.js allows magnesium at 4x the rail; rails.test.js asserted the old canon
      why: Dan settled the magnesium rail at 25 ppm/24 h on 2026-08-14 (§3), closing
      the 25-vs-50 conflict the canon swap surfaced.
      - `src/lib/analytics/correction.js:20` `CORRECTIONS.magnesium.maxPerDay`:
        100 -> 25 (was four times the rail). Its calcium entry (20) was already right,
        untouched.
      - `src/lib/analytics/safe-rate.js:27` `CORRECTION_MAX_RATE` — already matched
        canon exactly ({alkalinity 0.5, calcium 20, magnesium 25}), confirmed
        untouched.
      - `src/test/spec/classification/rails.test.js` `SPEC_RAIL` (line 24):
        {0.5, 25, 100} (the pre-13-Aug canon) -> {0.5, 20, 25}, and its header
        comment's stale "§6, lines 149-166" citation corrected to §3 — done in the
        same PR as the fix, not on its own (AGENTS.md rule 4; the backlog item
        itself named this file's constant as needing the update).
        `tests/parity/correction-calculator-vs-rail.test.js`'s two assertions that
        hardcoded the buggy 100/4x figures as "the actual, current disagreement"
        updated the same way — the disagreement they demonstrated no longer
        exists, so asserting it as fact would itself be false; its SPEC VIOLATION
        assertion (the one proving the defect) now passes unedited.
      spec: docs/spec/reef-chemistry.md#3-rate-rails--one-per-element
      repro: tests/parity/correction-calculator-vs-rail.test.js;
      src/test/spec/classification/rails.test.js — confirmed calcium assertions
      pass for the reason they were already right, magnesium's pass for the new
      reason, not just that the file goes green as a whole.
      owner: implementer — routine 15 (phase 6), bug 5

- [x] [chem] TW-019 `DOSE_ADVICE_RULES` had a magnesium key; §10 forbids tuning magnesium from readings
      why: `drift.js`'s `DOSE_ADVICE_RULES` gave magnesium its own 14-35 day window and
      computed a "suggested dose" from a trend, independent of `DOSE_DRIFT_TRIGGER` (which
      correctly has no magnesium key) and independent of the real dosing wizard
      (`assessMagnesium`) — a second, uncoordinated answer to a question §10 exempts
      magnesium from entirely ("the maintenance dose is never tuned from readings... not
      delayed — exempt").
      fix: deleted the `magnesium: {...}` entry. `computeDoseAdvice` iterates
      `Object.keys(DOSE_ADVICE_RULES)` generically — no special-casing needed elsewhere in
      `drift.js`.
      traced, not assumed: `previewStrengthChange` (corrected-strength.js:43-44, rendered
      live at Insights.jsx:697-720) reads `adv.advice[key]` behind an `e && e.calc && ...`
      guard already present — confirmed it degrades to no "Suggested dose" row for
      magnesium rather than crashing. `Insights.jsx:108`/`Dashboard.jsx:298-300` (TW-022,
      already-tracked dead code) read `DOSE_ADVICE_RULES[def.key]` behind a ternary already
      — confirmed unaffected, left alone, not expanded into.
      found while verifying, fixed in the same PR (unavoidable, not a scope expansion):
      `tests/legacy-port/husbandry.js`'s "one settling window, not three" check indexed
      `DOSE_ADVICE_RULES[key].minDaysSinceChange` for all three elements unconditionally —
      a genuine crash once magnesium's entry is gone. Narrowed to elements that still have
      an entry; the `settleWindow` sanity check for magnesium (unrelated to
      `DOSE_ADVICE_RULES`) stays.
      spec: docs/spec/reef-chemistry.md §10; docs/spec/wizard-states.md §9.4
      repro: src/test/defects/magnesium-dose-advice-removed.test.js
      owner: implementer — routine 15 (phase 6), bug 6

- [x] [chem] TW-020 `arrived` tested the full band, not the arrival zone
      why: Dan's 2026-08-14 decision 4. `correctionProgress`'s arrival test
      (src/lib/dosing/helpers.js) was `inBand(v)` over the last two readings — the full
      band. Canon: `zoneWidth = max(bandWidth / 3, 2 × noiseFloor)` clamped to the band,
      centred on the midpoint — 8.40-8.60 dKH, 415-435 ppm Ca, 1320-1380 ppm Mg at the
      suggested bands. The aim point (`(min + max) / 2`) did not change.
      fix: replaced the local `inBand` arrow (which had exactly one call site, `arrived` —
      confirmed by grep before touching it) with an `inZone` check computed live from
      `def.min`/`def.max` on every call, never hardcoded, per §9's own words. `passed`
      (helpers.js) is untouched — still computed independently, `correction-done` still
      fires on `arrived || passed` (state.js), confirmed via a live
      assessAlkalinity + doseStatus integration test, not just the raw
      correctionProgress fields.
      wording: the two call sites that branch on `cp.arrived` for copy (state.js;
      ReadingConfirmation.jsx) both said "inside your band"/"inside your range" — true
      but no longer precise once arrival means the narrower zone. Reworded to "back near
      the middle of your range" in both places; the logic they read (`cp.arrived`)
      is untouched.
      spec: docs/spec/reef-chemistry.md §9; docs/spec/wizard-states.md §4
      repro: src/test/defects/correction-arrival-zone.test.js
      owner: implementer — routine 15 (phase 6), bug 7

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
