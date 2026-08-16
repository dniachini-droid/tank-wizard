note: 2026-08-14-four-decisions-no-code
status: needs-approval
about: TW-025
date: 2026-08-14
order: 410

2026-08-14, from Dan's four decisions: two of the four need NO code change,
recorded here so nobody re-opens them. Decision 2 (water changes stay in the
trend fit, corrections subtracted proportionally) — alkalinity.js:493-499 and
calcium.js:273-278 already do exactly this; canon moved to the code. Decision 3
(bracket memory flat 45 days) — BRACKET_MEMORY_DAYS = 45 at helpers.js:85 is
already correct; the withdrawn 30/60 split was never built. Still open and NOT
filed as code work: the "widen never narrow" bracket rule (needs a sharper
diagnosis first — see reef-chemistry.md §8.3) and the absence of any
size threshold separating a routine 10% water change from a 40% one.
