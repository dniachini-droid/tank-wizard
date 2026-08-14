/* ---------------------------------- historical seed data ---------------------------------- */

/* Deliberately empty. This module used to hold ~325 invented readings dated
   2026-02-13 to 2026-08-09, which were merged into the user's own `readings`
   with no marker distinguishing them from measurements somebody actually took.
   They fed every consumption rate, trend and maintenance dose, and were written
   into the backup file and the CSV export. A fabricated reading standing in for
   a measurement nobody took is exactly the substitution the spec forbids
   (reef-chemistry.md §15, §12), so the readings are gone rather than flagged.
   The export stays so the seeding path stays a no-op, not a missing import. */
export const HISTORICAL_DATA = {};
