# The 27 Agents — what each one does

## Build wave — writes code, tightly gated
| planner | picks and scopes the night's work; refuses underspecified items |
| implementer | writes code and tests, one item at a time, no drive-by changes |
| integrator | independently re-verifies everything, opens the PR, never merges |
| fixer | applies small unambiguous fixes; hard-refuses chemistry and schema |

## Chemistry and correctness
| domain-verifier | every number checked against the chemistry spec, not the code |
| dataflow-tracer | traces every displayed number back to a real computation |
| static-analyst | dead config, orphaned code, copy-paste defects |
| state-auditor | stale closures, races, derived-state-in-state, input drift |

## Surface consistency — the app must not contradict itself
| manual-dose-auditor | the override path: rails, recording, contamination |
| wizard-dose-auditor | every branch and exit, back-navigation staleness |
| dose-parity-checker | identical inputs through every surface → identical output |
| band-classifier-auditor | single source, boundary exactness, precision |
| message-consistency-auditor | message vs classification contradictions |
| terminology-auditor | one word per concept; bans safety framing |
| history-truth-auditor | no retroactive recomputation of the log |
| contradiction-hunter | the spaces between surfaces; the full matrix |

## Adversarial
| breaker | tries to produce a wrong dose or lose data |
| test-engineer | turns findings into permanent regression tests; kills flakes |

## Platform
| pwa-auditor | offline, service worker, install, persistence, export |
| data-migration-auditor | guards tank history across schema versions |
| a11y-reviewer | accessibility + one-handed-at-the-tank usability |
| perf-watchdog | bundle and runtime budgets |
| security-auditor | dependencies, secrets, stray network calls |

## Judgement and reporting
| adjudicator | independently reproduces every S1/S2 before it reaches you |
| triage-analyst | dedupes to root cause; deletes noise; caps the backlog |
| docs-scribe | keeps README, changelog and comments honest |
| reporter | the single morning brief |

## The rule that governs all of them

**Parallel only for read-only agents.** Everything that writes source runs alone.
Two agents editing the same file concurrently corrupts the night's work and
neither notices.
