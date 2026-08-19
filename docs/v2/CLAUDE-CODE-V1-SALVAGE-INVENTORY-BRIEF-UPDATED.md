# CLAUDE CODE — V1 SALVAGE INVENTORY

## Purpose

Before Tank Wizard V2 is created in a fresh repository, perform a complete reconnaissance of the existing V1 repository so useful work, domain discoveries, tooling and user-experience lessons are not lost.

This is **not** a migration plan and **not** an instruction to port V1 architecture.

V1 is a read-only reference library.

The future V2 app will be built in a fresh repository against the frozen V2 canon.

## Current frozen authority

```text
SHARED_V2_FREEZE_2
ALK_V2_FREEZE_4
```

The behavioural authority is:

`docs/v2/REEF-CHEMISTRY-ENGINE-V2-CANON.md`

Do not alter V2 chemistry policy during this reconnaissance.

## Critical principle

For every V1 asset distinguish:

```text
PORT_AS_IS
PORT_WITH_CLEANUP
REBUILD_THE_IDEA
REFERENCE_ONLY
REVALIDATE_SCIENTIFICALLY
LEAVE_BEHIND
```

Default to **not porting code** when it carries V1 analytical/state assumptions.

Preserve knowledge and good generic infrastructure. Do not preserve technical debt.

## Inspect ALL of these areas

### A. `.agent/` knowledge library

Inspect every `.agent/` document, not just code.

Pay special attention to:
- engine inventory;
- gap reports;
- real-history replay;
- journeys / user workflows;
- historical design notes;
- prior audits;
- edge-case lists;
- anything describing how Daniel actually keeps a reef tank or uses the app.

For each document state whether it should be copied into the new repo as reference, condensed, superseded, or left behind.

### B. Generic product infrastructure

Inspect:
- calendar;
- task organiser;
- husbandry reminders;
- reminder completion/skip/roll-forward behaviour;
- any scheduling UI;
- notification-related infrastructure or wording, even if no true push layer exists;
- measurement-entry flows;
- history views;
- charts and recharts wrappers;
- navigation;
- setup/configuration flows;
- forms and reusable controls;
- export/import tools;
- state-management utilities;
- storage helpers;
- visual design tokens / layout conventions;
- accessibility/usability work.

Important: separate a useful **product idea/UX** from tangled V1 logic. A good idea may be `REBUILD_THE_IDEA` even when the component should not be ported.

### C. Chemistry/domain knowledge embedded in V1

Inventory all behaviour for:
- alkalinity;
- calcium;
- magnesium;
- phosphate;
- nitrate;
- salinity;
- ammonia;
- pH if present;
- trace/ICP if present;
- water changes;
- dosing changes;
- target ranges;
- movement/persistence rules;
- retest timing;
- warnings;
- interactions/cross-parameter gates.

For chemistry outside frozen Alk V2, default classification is:

```text
REVALIDATE_SCIENTIFICALLY
```

Do **not** recommend porting a V1 nutrient/chemistry rule merely because it exists or worked plausibly.

The future design process will compare V1 lessons against:
- primary science;
- current technical guidance;
- experienced reef-keeping bodies such as BRS and other high-quality practical sources;
- actual measurement limitations;
- deterministic product requirements.

### D. Tests and tooling

Inspect and catalogue:
- the 5,940-case input sweep;
- golden corpus generators;
- long-run simulation;
- replay harness in `.agent/real-history-replay.md`;
- verify gate;
- legacy-port suites;
- fixtures;
- threshold-straddling scenarios;
- property/invariant checks;
- scripts worth copying or adapting;
- dev/debug utilities.

Distinguish input/scenario value from V1 expected-output value.

V1 expected answers are not V2 correctness authority.

### E. Historical data

Identify exactly what user data can be exported/imported into V2, including:
- readings;
- Ca/Mg history;
- dose-change history;
- notes;
- husbandry/task history;
- settings where useful;
- anything else user-created.

For each dataset state:
- what is actually known;
- what metadata is missing;
- how it should be imported truthfully;
- whether it is history-only or eligible for V2 analysis.

Do not manufacture timestamps, timezones, configuration versions, implementation truth, delivery history or deleted records.

### F. Visual layer

Do not propose porting current analytical surface components early.

For every screen/component Daniel may like, separate:

```text
VISUAL_IDEA_WORTH_REUSING
GENERIC_COMPONENT_SAFE_TO_PORT
TANGLED_WITH_V1_DOMAIN_LOGIC_REBUILD_LATER
LEAVE_BEHIND
```

Particularly inspect any component that computes chemistry, verdicts, retest dates or recommendation state. Those should normally be rebuilt later against V2 domain outputs.

## Required output

Return a report with these sections:

### 1. Executive salvage summary
What is genuinely valuable in V1 and what should be abandoned.

### 2. `.agent/` document inventory
One row per important document with classification and reason.

### 3. Product/infrastructure inventory
Calendar, tasks, reminders, charts, logging, navigation, setup, etc.

### 4. Chemistry/domain-knowledge inventory
Parameter by parameter. Mark non-Alk chemistry `REVALIDATE_SCIENTIFICALLY` unless there is a compelling reason not to.

### 5. Test/tooling inventory
Exact reusable scenarios/harnesses/scripts and what is V1-only.

### 6. Historical-data export inventory
What can cross into V2 and with what provenance/degradation.

### 7. Visual/UX inventory
Ideas to preserve versus components to leave behind.

### 8. Fresh-repo starter pack
A **minimal list of assets/documents/data/tools** that should be copied into the new V2 repository on day one.

Do not design the full new repo yet. Just list the starter pack.

### 9. Things explicitly NOT to carry forward
Name them so they cannot re-enter V2 accidentally.

### 10. Unknowns / forgotten V1 assets
Anything surprising you found that was not named in this brief.

### 11. Recommendation
State whether reconnaissance is complete enough to create the fresh V2 repository.

## Stop point

Planning/reconnaissance only.

Do not edit V1 code.
Do not create V2 code.
Do not create the new repository yet.

End with exactly:

`STOP. SALVAGE INVENTORY COMPLETE — DO NOT BUILD YET.`


# REQUIRED — UNMIGRATED V1 CANON / SPECIFICATION INVENTORY

Do not limit the salvage inventory to runtime code, tests, UI, or `.agent/` documents.

V1 contains **domain and product decisions that have not yet been migrated into V2**. These decisions may be scientifically correct, partly correct, obsolete, or structurally wrong, but they are valuable source material and must not be lost.

Inspect every V1 canon/specification/design source you can find, including at minimum:

- `docs/spec/reef-chemistry.md`;
- `docs/spec/wizard-states.md`;
- any other `docs/spec/` material;
- phosphate rules, including the historical §29 behaviour and movement/persistence logic;
- nitrate rules, including movement/persistence logic;
- salinity and ammonia rules;
- Calcium and Magnesium rules not yet represented by frozen V2 Parts;
- notice/reminder model;
- the seven wording rules;
- summary/headline rules;
- card/verdict semantics;
- testing/retest timing rules;
- intervention or correction concepts;
- historical product decisions embedded in prose rather than code;
- `.agent/` journeys;
- `.agent/engine-inventory.md`;
- gap reports;
- design notes;
- historical audit/review documents;
- any source that explains *why* V1 behaves as it does.

For each meaningful V1 canon/spec decision, record:

```text
sourceFile
sectionOrRule
parameterOrSurface
plainEnglishPurpose
currentV1Behaviour
whyItWasIntroduced (if recoverable)
knownProblemsOrContradictions
classification
futureV2Owner
scientificRevalidationRequired
```

Allowed classifications remain:

```text
PORT_AS_IS
PORT_WITH_CLEANUP
REBUILD_THE_IDEA
REFERENCE_ONLY
REVALIDATE_SCIENTIFICALLY
LEAVE_BEHIND
```

## Critical rule

For any chemistry family that is not already frozen in V2, especially:

```text
Phosphate
Nitrate
Calcium
Magnesium
Salinity
Ammonia
```

V1 canon is **source material, not authority**.

Default classification for chemistry behaviour should be:

```text
REVALIDATE_SCIENTIFICALLY
```

unless the item is merely a parameter-agnostic structural concept already owned by frozen shared V2 architecture.

Do not port a V1 threshold, range, movement rule, persistence rule, correction rule, retest cadence, or explanatory cause into V2 merely because it exists.

The future V2 design process will compare:
1. V1 lessons;
2. current primary science;
3. authoritative reef-keeping guidance and expert practice;
4. measurement limits and deterministic product requirements.

The purpose of this inventory is to **preserve the questions, decisions, failure cases, and keeper workflows** without allowing them to constrain a clean V2 design.

## Separate output required

Add a dedicated section to the salvage report titled:

```text
V1 CANON / PRODUCT-KNOWLEDGE SALVAGE
```

Within it, explicitly inventory:
- phosphate;
- nitrate;
- Ca;
- Mg;
- salinity;
- ammonia;
- notice model;
- wording rules;
- summary/headline rules;
- journeys/workflows;
- any other unmigrated V1 canon.

Flag anything that appears to represent substantial prior reasoning but has no V2 owner yet.

