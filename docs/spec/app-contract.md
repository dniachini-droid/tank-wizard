# App Contract — CANON

Agents must never edit this file.

## Stack

- React + JSX, PWA, offline-first
- Build: detected from the repo at first run and recorded here by Dan
- Test: Vitest + React Testing Library, axe-core for a11y
- Storage: detected from the repo at first run and recorded here by Dan

## Storage contract

- Schema version key: `tw.schema.version`
- **Every schema change requires a forward migration plus a test that migrates a
  fixture from every previous version.** Fixtures in `tests/fixtures/schema/`.
- Data is never destructively rewritten in place: migrate to a new key, verify,
  then remove the old.
- On migration failure the app enters read-only mode and surfaces an export
  button. It must never start empty and silent.

## Offline behaviour

- Fully functional with no network on first paint after install.
- Service worker updates must never serve a half-updated asset set.
- A log entry created offline must survive a hard reload.

## Non-goals

No accounts, no sync, no telemetry, no analytics, no ads, no cloud dependency.

## Performance budgets

`.agent/budgets.json`. Enforced, not advisory.

## Accessibility floor

- Touch targets ≥44 px
- Text contrast ≥4.5:1
- All interactive elements keyboard reachable and labelled
- Numeric inputs use the right `inputmode` — this app is used one-handed,
  wet-handed, standing at a tank
