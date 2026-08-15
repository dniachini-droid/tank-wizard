/* §15 terminology registry — "notice" is the one word (TW-043)
 *
 * Spec anchor: docs/spec/wizard-states.md §15 —
 *   "a thing the app shows about a parameter | **notice** | notification,
 *    note, hidden note, 'worth knowing about'"
 * and §20, "The word — settled 14 August": the three alternatives that
 * shipped alongside it are banned: "Worth knowing about" (Dashboard.jsx),
 * "Hidden notes" / "Notes" (Setup.jsx), and "notification" in the hide
 * confirmation.
 *
 * Scope, per the item: the Dashboard heading and the Setup hidden-list
 * strings only. The hide-confirmation sentence ("This is flagged as a
 * serious notice...") is TW-031's to build — asserting it here would land
 * the string twice. `finding`, `claim` and `dose state` in
 * narrative-engine.js are internal code names, not user-facing words (§20
 * says so explicitly), and are not tested.
 *
 * This is a source-scan test over the two named components. The build-wide
 * banned-noun checker is TW-028's job (extending wordingcheck.mjs) and
 * lands with it; this test pins the two screens TW-043 fixes.
 */
import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

const read = (p) => fs.readFileSync(path.join(__dirname, '../../../components', p), 'utf8')

describe('§15/§20 — Dashboard says "notice", not "worth knowing about"', () => {
  const dash = read('Dashboard.jsx')

  it('the banned phrase "Worth knowing about" is gone', () => {
    expect(dash).not.toMatch(/worth knowing about/i)
  })

  it('the per-parameter heading over the notice list uses the word "notice"', () => {
    expect(dash).toMatch(/Notices for \{def\.label/)
  })
})

describe('§15/§20 — Setup says "notice", not "note"', () => {
  const setup = read('Setup.jsx')

  it('the banned title "Hidden notes" is gone, replaced by "Hidden notices"', () => {
    expect(setup).not.toMatch(/Hidden notes/)
    expect(setup).toMatch(/Hidden notices/)
  })

  it('the count summary pluralises "notice", not "note"', () => {
    // The stale string was `${dismissedList.length} note${...} hidden`.
    expect(setup).not.toMatch(/\} note\$\{/)
    expect(setup).toMatch(/\} notice\$\{/)
  })

  it('the empty-state sentence says "Notices you hide", not "Notes you hide"', () => {
    expect(setup).not.toMatch(/Notes you hide/)
    expect(setup).toMatch(/Notices you hide/)
  })
})

describe('§15/§20 — the restore-all toast says "notice", not "note"', () => {
  /* Found by grepping the banned nouns across src/ while fixing the three
     named strings: App.jsx's toast for Setup's "Show all again" button said
     "Hidden notes restored" — the same banned noun on the same hidden-notices
     flow. Same concept, same word, same fix. */
  it('the toast shown after restoring all hidden notices uses the word "notice"', () => {
    const app = fs.readFileSync(path.join(__dirname, '../../../App.jsx'), 'utf8')
    expect(app).not.toMatch(/Hidden notes restored/)
    expect(app).toMatch(/Hidden notices restored/)
  })
})

describe('§20 — recorded non-violations stay as they are', () => {
  it('"Got it — hide this" carries no noun and needs no change (§20 records it so it is not re-filed)', () => {
    const doseExp = read('DoseExpectation.jsx')
    expect(doseExp).toMatch(/Got it — hide this/)
  })
})
