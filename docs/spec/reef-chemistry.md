# Reef Chemistry Spec — CANON

Scope: **three-part dosing** (alkalinity, calcium, magnesium as separate
additives). Not two-part, not kalkwasser, not calcium reactor.

Tank-agnostic and product-agnostic. Anything a user configures is marked
`[user]` and lives in app settings, not here. Everything else is universal
reasoning that must be identical for every user.

> Agents never edit this file. Disagreements → `.agent/spec-challenges.md`.

---

## 0. Philosophy

- **Stability over micromanagement.** Slow correction beats fast correction.
  The app never recommends a large single-step correction.
- Coral health over user convenience.
- When a reading is ambiguous, the app recommends **re-testing**, not dosing.
- The app advises. It never auto-doses. Every recommendation shows its inputs
  and its reasoning.
- The app would rather say "not enough data" than produce a confident number
  from thin evidence.

---

## 1. Universal constants — fixed for every user

Changing any of these without an `[approved][chem]` item is an S1 defect.

| Constant | Value |
|---|---|
| Ca:alk consumption ratio | **7.15 ppm Ca per 1.0 dKH** |
| Mg | not consumed proportionally to calcification; depletes slowly and via water changes |
| dKH ↔ meq/L | 1 meq/L = **2.8 dKH** |
| ppm ≡ mg/L | identical — display only, never convert |
| L ↔ US gal | 1 US gal = **3.78541 L** |
| L ↔ imp gal | 1 imp gal = **4.54609 L** — must be distinguished from US gal |
| °C ↔ °F | F = C × 9/5 + 32 |

---

## 2. Water volume

`[user]` net water volume — gross system volume minus rock, sand and equipment
displacement.

**Every dose calculation uses net volume. Never gross.** This is the most common
cause of overdosing in software of this kind.

If net volume is unset, the app **refuses to calculate any dose** and names net
volume as the missing input.

**Estimate helper.** The app may offer `net ≈ gross × 0.85` as a starting point.
If used, it must be explicitly accepted by the user, and every dose derived from
an estimated volume is labelled as such wherever it appears. The app prompts the
user to measure properly, once, non-nagging.

---

## 3. Targets

The app does not impose targets. It stores what the user chooses `[user]` and
holds them stable.

**Setup suggestions.** At first setup the app offers a starting set based on the
user's stated coral mix. These are suggestions, clearly labelled, fully editable,
and never re-applied afterwards.

| Coral mix | Alk (dKH) | Ca (ppm) | Mg (ppm) |
|---|---|---|---|
| SPS-dominant | 8.0 | 430 | 1350 |
| Mixed reef | 8.5 | 430 | 1350 |
| LPS + softies | 9.0 | 420 | 1350 |
| Mostly softies | 9.0 | 420 | 1350 |

Default no-action band, applied to whatever target the user sets:

| Parameter | Band width | Applied as |
|---|---|---|
| Alkalinity | 1.0 dKH | target ± 0.5 dKH |
| Calcium | 50 ppm | target ± 25 ppm |
| Magnesium | 100 ppm | target ± 50 ppm |

Default alert thresholds:

| Parameter | Alert low | Alert high |
|---|---|---|
| Alkalinity | target − 1.0 dKH | target + 1.0 dKH |
| Calcium | target − 50 ppm | target + 50 ppm |
| Magnesium | target − 200 ppm | target + 200 ppm |

The out-of-band window is therefore narrow for alkalinity — 0.5 to 1.0 dKH from
target — and the app must handle a reading landing exactly on either edge
correctly. The bands and the alert thresholds must never be allowed to overlap
or invert: `classifyReading` validates this on every call and returns
`insufficient-data` with a configuration error if a user has set them
inconsistently.

All of the above are `[user]` adjustable.

**Universal rule regardless of chosen targets:** stability at a slightly
sub-optimal number beats movement toward an optimal one. If a value sits outside
the user's target but the series is stable, the app suggests reconsidering the
target before suggesting a correction.

---

## 4. Testing cadence and precision

- **Alkalinity is tested no more often than every 2 days.** This is the design
  assumption for all consumption maths. A tank drawing ~0.4 dKH/day produces
  ~0.8 dKH of signal over that interval, comfortably above any common kit's error.
- The app must not compute a consumption rate from readings less than 2 days
  apart. It says when to test next instead.
- Absolute accuracy is not required. Users target stability against their own
  kit. **The app never tells a user their kit is wrong.**
- **Kit change flag `[user]`.** When the user records a change of test kit or
  brand, the app marks that point and must not read the step change across it
  as consumption or trend. It requests a fresh baseline.

---

## 5. Three-part reasoning — universal

**Calcification coupling.** Alk and Ca are consumed together at 7.15 ppm Ca per
1.0 dKH. Therefore:

- If measured alk consumption implies a calcium draw the user's calcium dosing
  does not cover, calcium is drifting down. The app surfaces this **before** the
  calcium reading confirms it.
- If calcium falls while alkalinity is stable, calcification is **not** the
  cause. The app says so and does not reflexively recommend more calcium —
  precipitation, low magnesium, or a testing error are likelier. It points there.
- Dosing alkalinity alone over time is a defect state, not a valid
  configuration. Flag it.

**Magnesium gate.** Low magnesium destabilises both alk and calcium and drives
precipitation. **If magnesium is below alert-low, the app does not recommend alk
or calcium corrections until magnesium is addressed.** Correcting the other two
first wastes additive and can precipitate.

**Precipitation guard.** Never recommend simultaneous alkalinity and calcium
doses. Separate by at least 4 hours (`[user]`, minimum 1). Never recommend
dosing both into the same location at the same time.

---

## 6. Rate-of-change rails — hard caps

Any recommendation exceeding a rail is a **bug**, not a preference. Enforced in
logic, not merely displayed.

| Rail | Default per 24 h |
|---|---|
| Alkalinity | **0.5 dKH** |
| Calcium | 25 ppm |
| Magnesium | 100 ppm |
| Salinity | 0.5 ppt |
| Temperature | 0.5 °C |

`[user]` may tighten a rail. **The app never permits loosening beyond the
default.** A correction needing more than one day is presented as a **multi-day
plan** with a per-day dose — never as a single dose the user might administer
at once.

---

## 7. Dose calculation

```
dose_mL = (target − current) × net_volume_L / potency
```

`potency` `[user]` = change in the parameter per mL per litre, taken from the
product's own documentation. Product-agnostic: the app stores a potency per
product per parameter and nothing about brands.

Rules:

1. **Convert units first. Round last.** Never round an intermediate value.
2. Round to the doser's minimum increment `[user]`.
3. **Round down on the first correction of any parameter.** Under-correcting is
   recoverable; over-correcting is not.
4. Doses above `[user]` mL are split across the day.
5. Every recommendation states: product, potency used, net volume assumed, mL,
   expected delta, days to target.
6. Any missing input is named. The app never substitutes a default silently.

---

## 8. Consumption rate

- Requires at least 3 readings spanning at least 6 days.
- Fewer: the app says "insufficient data", shows what it has, gives no rate.
- Readings across a recorded kit change do not combine.
- A water change between readings must be accounted for or the span discarded.
- The rate is always reported with the interval it came from.

---

## 9. The app must refuse to

- Calculate any dose when net volume is unset
- Recommend a correction exceeding a §6 rail
- Recommend simultaneous alk and calcium dosing
- Recommend alk or calcium correction while magnesium is below alert-low
- Compute consumption from readings less than 2 days apart
- Treat a step change across a recorded kit change as real
- Use gross volume anywhere
- Extrapolate a trend from fewer than 3 readings
- Substitute a default for a missing measurement without saying so

---

## 10. Worked examples — executable test vectors

Illustrative numbers. These become tests verbatim; they check the reasoning, not
any particular tank.

```
1. GIVEN net 68 L, alk 7.6, target 8.5, product potency such that 1 mL raises
   68 L by 0.0147 dKH
   THEN total need 0.9 dKH = 61 mL; exceeds the 0.5 dKH/day rail
   → 2-day plan; day one capped at 0.5 dKH = 34 mL, rounded DOWN to the doser
     increment; flagged "multi-day correction"

2. GIVEN net volume unset
   THEN refuses; names net volume as the missing input; offers the 0.85 helper

3. GIVEN alk consumption 0.4 dKH/day; user's calcium dosing covers 1.5 ppm/day
   THEN implied Ca draw = 0.4 × 7.15 = 2.86 ppm/day
   → flags a 1.36 ppm/day shortfall BEFORE the Ca reading falls

4. GIVEN Mg 1140 with alert-low 1150, and alk 7.4 with target 8.5
   THEN addresses magnesium only; explicitly defers the alk correction and says why

5. GIVEN two alk readings 1 day apart
   THEN no consumption rate; states the 2-day minimum; says when to test next

6. GIVEN a kit change recorded between reading 4 and 5
   THEN series split at that point; no trend across the boundary; fresh baseline
   requested

7. GIVEN Ca falling 8 ppm/week, alk flat within ±0.1 dKH
   THEN does NOT recommend more calcium; surfaces precipitation, magnesium and
   test error as likelier causes

8. GIVEN an alk dose and a Ca dose both due
   THEN never scheduled together; separated by ≥4 hours

9. GIVEN alk exactly at the no-action lower edge (target 8.5, band ±0.5 → 8.0)
   THEN classified in range, not out of range (edges inclusive of their band)

10. GIVEN target 8.5, upper edge 9.0, stored reading 9.049 displayed as 9.0
    THEN classified on 9.049 (out of range), not on the displayed 9.0
```
