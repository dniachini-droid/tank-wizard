# Needs Dan

Decisions no agent may make. Newest at top. Dan clears this file.

---

## Open

### 1. DOSE_ELEMENTS default Ca:alk strength ratio (~6.77) vs spec-fixed 7.15 — which is right?

`reef-chemistry.md` §1 fixes the Ca:alk consumption ratio at 7.15 ppm Ca per
1.0 dKH, "for every user." The app's own suggested two-part defaults
(`src/lib/analytics/consumption.js:84-93`) imply 6.77 (and the hint text next
to them claims "6.8 ppm calcium per dKH", which doesn't even match its own
code). Before an implementer changes either the code or asks for a spec
exception: is 7.15 a verified real-world Ca:alk consumption ratio the app's
defaults should be recomputed to match, or does the coded ~6.8 track a real
product's actual mixing ratio that 7.15 should be checked against? No agent
has asserted the spec itself is wrong — this reads as a spec-vs-product-
reality question, not a `spec-challenges.md` case — but the target number
needs to be your call before `.agent/backlog.md`'s TW-021 can be `[approved]`.

### 2. `reef-chemistry.md` §2 still uses the losing term (follow-on from the 2026-08-13 terminology decision)

The registry now bans "water volume" (see Decisions, below). Two places in
`docs/spec/reef-chemistry.md` still use it:

- line 43, the §2 heading: `## 2. Water volume`
- line 45: "`[user]` net water volume — gross system volume minus rock…"

Not changed: only three spec edits were authorised and these are a fourth.
Say the word and they become "Net volume" / "net volume", or confirm the
heading and the definition line are exempt as prose describing the concept
rather than app-facing terminology.

---

## Decisions

### 2026-08-13 — Dan, spec owner (resolves both items from run 2026-08-13-consistency-sweep)

**Magnesium rail: 50 ppm / 24 h.** `reef-chemistry.md` §6 changed from 100 to
50. Source recorded in the table: Aqua Forest magnesium label, "maximum daily
increase 50 mg/l (ppm)". Neither in-app table was right — `correction.js`'s
100 matched the old canon and now **exceeds** the rail; `safe-rate.js`'s 25 is
under it but is a hardcoded tightening, not a `[user]` one.

**Calcium rail: 20 ppm / 24 h.** `reef-chemistry.md` §6 changed from 25 to 20,
noted in the table as matching the real-world sourcing cited in
`src/lib/analytics/safe-rate.js` (reefcalcs' 20 ppm/day safe rate). Both
in-app tables already agree at 20, so canon moved to the code here, not the
code to canon. The uniform constant drift is closed.

**Volume terminology: "net volume" wins.** `surfaces-and-messaging.md` §5
registry row changed: the word to use is **net volume**; "water volume" joins
"tank size, volume, capacity" in the never-use column. `reef-chemistry.md`
already uses "net volume" throughout, so the losing file was the registry.
This is the file that wins on terminology going forward — do not re-raise.

Why these and not the alternatives: the rails are hard caps on how much goes
into a live tank, so each one now carries its own real-world source in the
spec rather than an unattributed number. "net volume" was already the majority
usage in canon and is the more precise of the two terms — "water volume" does
not say net.

Application source code was **not** touched under this authorisation. The
resulting code work is filed untagged in `.agent/backlog.md`.
