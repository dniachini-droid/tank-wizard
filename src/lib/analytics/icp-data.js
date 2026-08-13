/* ---------------------------------- advanced analytics ---------------------------------- */

/* Dosing strength expressed as dKH raised per mL per 100L. A standard
   two-part alkalinity solution (BRS soda ash and equivalents) needs roughly
   33 mL to raise 100L by 1 dKH, i.e. about 0.03 dKH per mL per 100L. */

/* --- Real ICP panels, seeded once ---
 * Triton reports traces in ug/L and macros in mg/L; everything here is stored
 * in mg/L to match the app's reference ranges. Dates are the sampling dates
 * (five days before the reported date), since that is when the water actually
 * came out of the tank and is what the calibration pairing needs.
 */
export const ICP_SEED = [{"id": "icp-2026-06-14","date": "2026-06-14","lab": "Triton","ref": "B-ovXZ3O","elements": {"aluminium": 0.006,"antimony": 0,"arsenic": 0,"lead": 0,"cadmium": 0,"copper": 0,"lanthanum": 0,"mercury": 0,"scandium": 0,"selenium": 0,"titanium": 0,"tungsten": 0,"tin": 0,"chloride": 19574,"sodium": 10795,"calcium": 438,"magnesium": 1349,"potassium": 397,"bromide": 66,"boron": 5,"fluoride": 0.67,"strontium": 7,"sulphur": 912,"lithium": 0.192,"nickel": 0,"molybdenum": 0.007,"vanadium": 0,"zinc": 0,"manganese": 0.001,"iodine": 0.013,"chromium": 0,"cobalt": 0,"iron": 0,"barium": 0.026,"beryllium": 0,"silicon": 0.16,"phosphorus": 0.015,"phosphate": 0.046,"salinity": 34.713}},{"id": "icp-2026-07-26","date": "2026-07-26","lab": "Triton","ref": "B-l8j2NQ","elements": {"aluminium": 0.001,"antimony": 0,"arsenic": 0,"lead": 0,"cadmium": 0,"copper": 0,"lanthanum": 0,"mercury": 0,"scandium": 0,"selenium": 0,"titanium": 0,"tungsten": 0,"tin": 0,"chloride": 20075,"sodium": 11010,"calcium": 435,"magnesium": 1407,"potassium": 421,"bromide": 66,"boron": 5,"fluoride": 0.61,"strontium": 8,"sulphur": 920,"lithium": 0.195,"nickel": 0,"molybdenum": 0.006,"vanadium": 0.001,"zinc": 0,"manganese": 0.001,"iodine": 0.033,"chromium": 0,"cobalt": 0,"iron": 0,"barium": 0.021,"beryllium": 0,"silicon": 0.146,"phosphorus": 0.012,"phosphate": 0.037,"salinity": 35.514}}];
