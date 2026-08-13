/* ---------------------------------- ICP seed data ---------------------------------- */

/* Deliberately empty. This module used to hold two hardcoded "Triton" panels
   dated 2026-06-14 and 2026-07-26, seeded into the user's `icp-tests` on first
   run with nothing to mark them as anything other than panels the user had
   entered. Shipped in source, they landed identically on every device, so they
   could not be that tank's panels — the same fabrication as the readings seed
   in ../seed-data.js, feeding the same engines and the same backup and export.
   The export stays so the seeding path stays a no-op, not a missing import. */
export const ICP_SEED = [];
