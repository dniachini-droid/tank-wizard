/* Regression test for the terminology half of the 13 Aug build-cycle's
 * adjudicated item #6 (domain-verifier/S2, confirmed, duplicate of TW-017 in
 * `.agent/backlog.md`; this only adds coverage, it does not touch the
 * banned copy itself). Re-verified still live on 15 Aug main during the
 * PR #3 rebase — TW-017 remains open and has since catalogued further sites.
 *
 * docs/spec/wizard-states.md §15 terminology registry: the required
 * term for the concept is **"net volume"**; the "Never use" column for that
 * row is explicit: "water volume, tank size, volume, capacity". The "no
 * volume set" dosing finding (src/lib/findings.js, id: "no-volume") uses
 * neither the bare required term nor anything outside the banned column —
 * its title says "tank volume" and its detail says "your tank volume" and
 * "net water volume", none of which is the registry's plain "net volume".
 *
 * THIS TEST IS EXPECTED TO FAIL until TW-017 lands. It exists so the
 * still-open terminology violation on this specific, safety-critical
 * refusal message (the same "tank volume not set" guard TW-001 touched
 * tonight) cannot silently regress further or be forgotten.
 */
import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import path from 'node:path'

const findingsSrc = readFileSync(
  path.resolve(process.cwd(), 'src/lib/findings.js'),
  'utf8',
);

describe('findings.js "no-volume" finding — terminology registry §5 (adjudicated #6, confirmed-but-unfixed, dup of TW-017)', () => {
  it('BUG: title/detail use banned synonyms ("tank volume", "water volume") instead of the required "net volume"', () => {
    const start = findingsSrc.indexOf('id: "no-volume"');
    expect(start).toBeGreaterThan(-1);
    // The finding object is small; a generous slice comfortably covers its
    // title and detail fields without pulling in unrelated findings.
    const block = findingsSrc.slice(start, start + 800);

    // Required by the registry: the plain, bare term.
    expect(block).toMatch(/\bnet volume\b/);

    // Banned by the registry's own "Never use" column for this row.
    expect(block).not.toMatch(/\btank volume\b/i);
    expect(block).not.toMatch(/\bwater volume\b/i);
  });
});
