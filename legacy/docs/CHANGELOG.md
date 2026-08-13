# Notable fixes

Kept because each one describes a failure mode worth recognising again.

| Fix | Symptom | Why it hid |
|---|---|---|
| Engines wired to the UI | Correct advice computed, older engine displayed | Tests checked the engines, which were fine |
| Water changes stopped resetting the window | Every tank answered "hold" on one reading | Uniform output read as agreement |
| Displayed value is the measured one | Kit read 1520, app showed 1540 | Fitted value is correct for deciding, wrong for showing |
| `CA_PER_DKH_LO` declared | `computeIonicBalance` threw on every call | Suite never compiled that path |
| Urgent dismissals keyed to the reading | Hiding ammonia at 0.4 kept it hidden at 1.5 | Urgent titles are deliberately plain |
| Magnesium daily dose is maintenance only | Recommended 8 → 72 mL to fix a level | Arithmetically correct, physically absurd |
| Corrections are additive only | Offered a dose to *lower* alkalinity | No such product exists |
| Rate ceiling anchored on maintenance | Oscillation spiked 105 simulated tanks | Anchored on consumption, which can go negative |
| `dayNum` memoised, history bounded | 73 s to assess a 2-year tank | Only visible with years of data |
