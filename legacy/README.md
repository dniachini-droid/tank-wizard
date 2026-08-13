# Dan's Tank Wizard

A reef aquarium management app. Single HTML file, no build step, no backend —
all data lives in the browser's localStorage.

## Run it

Open `build/reef-console.html` in a browser, or deploy that one file to any
static host. Deploying to the **same origin** preserves existing data; a new
subdomain starts empty.

## Build

```
python3 tools/build.py        # → build/reef-console.html
```

## Verify

```
./verify.sh
```

Runs static checks, scenario and fuzz suites, 39 protocol examples, and 6,000
randomised invariant checks. This is the gate — see `AGENTS.md`.

## What it does

- **Dashboard** — parameter cards with band position, trend and dosing state
- **Test Lab** — log readings against what is due
- **Dosing Wizard** — alkalinity, calcium and magnesium assessed against written
  protocols, with staged changes and one-off corrections
- **Insights** — consumption, ionic balance, kit calibration, nutrient ratios
- **Tasks** — reminders, calendar, rescheduling
- **Setup** — tank volume, solution strengths, targets, backup and restore

## The dosing engines

Each element has its own engine implementing a written protocol. They share an
architecture:

- elapsed time from timestamps, never from counting readings
- the assessment window starts at the last dose change
- **maintenance dose** (arithmetic) is separate from **recommended dose**
  (staged, rate-limited)
- corrections are additive only, expressed in ppm, spread over days
- a rate ceiling overrides everything: 0.5 dKH/day, 3.5 ppm/day calcium,
  15 ppm/day magnesium

Every millilitre figure depends on the solution strengths in Setup. The solver
verifies those empirically once a dose change has been logged with readings
either side.

## Back up your data

Setup → Backup & export. All 15 storage keys are included. Do it before any
redeploy.
