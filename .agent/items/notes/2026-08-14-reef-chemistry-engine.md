note: 2026-08-14-reef-chemistry-engine
status: needs-approval
about: TW-029, TW-030, TW-031
date: 2026-08-14
order: 430

2026-08-14, the new work created by the Reef Chemistry Engine decision
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
TW-031 is fully specified by §20 except for one line, flagged in the item.
