/* Stage 6b — the notice model, tested against canon.
 *
 * THE-ENGINE-PLAN-v2.md Stage 6b. Every assertion below cites the rule it is
 * asserting. Nothing here is taken from the current app's behaviour:
 * `buildFindings` and `narrative-engine.js` are the layer being replaced, and a
 * test that agreed with them would be inheriting the reasoning this stage
 * exists to stop inheriting.
 *
 * The canon sources, once:
 *   wizard-states.md §20   one live notice per parameter; supersession; hiding
 *                          is global; everything hideable; serious confirms
 *   wizard-states.md §25.1 the four tiers, the fixed parameter order,
 *                          proportional distance, hidden versus off, and
 *                          "a notice type is a parameter"
 *   wizard-states.md §25.4 the three kinds and no fourth
 *   wizard-states.md §13   the seven bands
 *   reef-chemistry.md §18  which parameters reach an alert tier
 *   reef-chemistry.md §32  ammonia — two states, detectable is an alert
 *   docs/journeys/journey-4-notifications.md — the account this came from
 */
import { describe, expect, it } from 'vitest'
import {
  FIXED_PARAMETER_ORDER,
  PARAMETER_SORT_ORDER,
  buildNoticeList,
  hide,
  isHidden,
  isOff,
  isSerious,
  needsHideConfirmation,
  noticeKey,
  noticeSignature,
  noticeTier,
  proportionalDistance,
  unhide,
  unhideAll,
} from '../../../lib/notices/notice-model.js'

/* ---- fixtures ------------------------------------------------------------
 * Built from canon's own figures: §2 layer 3's suggested ranges, and §13's
 * bands. Wording is deliberately absent — that is Stage 6c's, and a notice
 * model that carried sentences would be doing 6c's job. */

const ALK = { min: 8.2, max: 8.8 }      // §2 layer 3
const CA = { min: 400, max: 450 }
const MG = { min: 1250, max: 1400 }     // §2 layer 3, amended 16 Aug
const PO4 = { min: 0.03, max: 0.1 }     // §29.2

const verdict = (parameter, band, value, range, extra = {}) => ({
  kind: 'verdict', parameter, band, value, range, severity: band?.startsWith('alert') ? 'act' : 'watch', ...extra,
})

describe('identity — §20, one live notice per parameter', () => {
  it('keys a verdict by its parameter and nothing else', () => {
    /* §20: "One live notice per parameter. Its content is the engine's current
     * verdict. Not one per surface, not one per rule that fired." So the
     * identity is the parameter — journey 4's open question 1 ("what counts as
     * one topic?") is answered by §20, and the answer is the parameter. */
    const a = verdict('alkalinity', 'out-of-band-low', 8.0, ALK)
    const b = verdict('alkalinity', 'alert-low', 7.4, ALK)
    expect(noticeKey(a)).toBe(noticeKey(b))
    expect(noticeKey(a)).not.toBe(noticeKey(verdict('calcium', 'in-band', 420, CA)))
  })

  it('gives a relationship notice its own identity, not a parameter one', () => {
    /* §25.4 kind 3: "the small set that genuinely belong to no single
     * parameter", and §25.1 gives them their own tier. */
    const rel = { kind: 'relationship', id: 'mg-gate', parameters: ['magnesium', 'alkalinity'], severity: 'act' }
    expect(noticeKey(rel)).not.toBe(noticeKey(verdict('magnesium', 'alert-low', 1140, MG)))
  })

  it('changes signature when the verdict changes, and not otherwise', () => {
    /* §20: "A new verdict supersedes the old notice rather than joining it."
     * The signature is what makes a notice count as changed. */
    const same = noticeSignature(verdict('alkalinity', 'out-of-band-low', 8.0, ALK))
    expect(noticeSignature(verdict('alkalinity', 'out-of-band-low', 8.0, ALK))).toBe(same)
    expect(noticeSignature(verdict('alkalinity', 'alert-low', 8.0, ALK))).not.toBe(same)
    expect(noticeSignature(verdict('alkalinity', 'out-of-band-low', 7.9, ALK))).not.toBe(same)
  })
})

describe('hiding — §20 and §25.1', () => {
  it('hides globally, by key, so hiding anywhere hides everywhere', () => {
    /* §20: "Hiding is global, because there is one notice, not one per
     * surface." Journey 4 problem 1: "Wherever you hide it from, it should be
     * hidden." One store, keyed by identity — no surface dimension exists. */
    const n = verdict('alkalinity', 'out-of-band-low', 8.0, ALK)
    const store = hide({}, n)
    expect(isHidden(n, store)).toBe(true)
    expect(Object.keys(store)).toEqual([noticeKey(n)])
  })

  it('lets a superseding verdict return a hidden notice to the live list', () => {
    /* §25.1: "When the situation changes and a new verdict supersedes it, the
     * notice reappears in the live list automatically. This is load-bearing:
     * hiding must never silence a situation permanently." */
    const hidden = hide({}, verdict('alkalinity', 'out-of-band-low', 8.0, ALK))
    const worse = verdict('alkalinity', 'alert-low', 7.4, ALK)
    expect(isHidden(worse, hidden)).toBe(false)
  })

  it('hides every kind, including a safe-bounds excursion and an alert', () => {
    /* §20: "Every notice can be hidden. No exceptions, including safe-bounds
     * excursions." Two live behaviours are named as against canon there. */
    const alert = verdict('alkalinity', 'alert-low', 7.4, ALK, { safeBoundsExcursion: true })
    expect(isHidden(alert, hide({}, alert))).toBe(true)
    const rel = { kind: 'relationship', id: 'mg-gate', parameters: ['magnesium'], severity: 'act' }
    expect(isHidden(rel, hide({}, rel))).toBe(true)
  })

  it('asks for confirmation before hiding a serious notice, and does not refuse it', () => {
    /* §20: serious notices get a confirmation, and "the confirmation is a
     * speed bump, not an exception. It does not create a class of notice that
     * cannot be hidden." Serious is severity `act` or a red §3 tone. */
    const serious = verdict('alkalinity', 'alert-low', 7.4, ALK)
    const calm = verdict('calcium', 'out-of-band-high', 455, CA)
    expect(isSerious(serious)).toBe(true)
    expect(needsHideConfirmation(serious)).toBe(true)
    expect(isSerious(calm)).toBe(false)
    expect(needsHideConfirmation(calm)).toBe(false)
    expect(isHidden(serious, hide({}, serious))).toBe(true)
    expect(isSerious({ kind: 'verdict', parameter: 'alkalinity', tone: 'red' })).toBe(true)
  })

  it('unhides one at a time and all at once', () => {
    /* §25.1: the hidden list "is unhidden one at a time or all at once".
     * Journey 4, what works: "The tank summary can unhide — all at once, or
     * one at a time." */
    const a = verdict('alkalinity', 'out-of-band-low', 8.0, ALK)
    const c = verdict('calcium', 'out-of-band-high', 460, CA)
    let store = hide(hide({}, a), c)
    store = unhide(store, a)
    expect(isHidden(a, store)).toBe(false)
    expect(isHidden(c, store)).toBe(true)
    expect(Object.keys(unhideAll(store))).toHaveLength(0)
  })

  it('treats a stored entry with no signature as lapsed rather than permanent', () => {
    /* The bare-date format `findingHidden` already guards against: a hidden
     * entry with nothing to compare against must not stick forever, or hiding
     * becomes the permanent silence §25.1 forbids. */
    const n = verdict('alkalinity', 'out-of-band-low', 8.0, ALK)
    expect(isHidden(n, { [noticeKey(n)]: '2026-08-16' })).toBe(false)
  })
})

describe('off — §25.1, a notice type is a parameter', () => {
  it('turns off one parameter and leaves the others alone', () => {
    /* §25.1: "Turning phosphate off turns off phosphate and nothing else. The
     * nitrate warning is unaffected — which is the question G-31 asked in
     * exactly those terms." */
    expect(isOff(verdict('phosphate', 'out-of-band-low', 0.02, PO4), ['phosphate'])).toBe(true)
    expect(isOff(verdict('nitrate', 'out-of-band-high', 60, { min: 5, max: 20 }), ['phosphate'])).toBe(false)
  })

  it('includes alerts, safe-bounds excursions and ammonia', () => {
    /* §25.1: "There is no notice a parameter can produce that survives its
     * switch being off: not alert-low, not alert-high, not a reading beyond
     * §2's safe bounds ... and not ammonia's detectable notice
     * (reef-chemistry.md §32.6, which records this as the sharpest case and
     * accepts it by name)." */
    const alert = verdict('alkalinity', 'alert-low', 6.5, ALK, { safeBoundsExcursion: true })
    expect(isOff(alert, ['alkalinity'])).toBe(true)
    const nh3 = { kind: 'verdict', parameter: 'ammonia', state: 'detectable', value: 0.25, severity: 'act' }
    expect(isOff(nh3, ['ammonia'])).toBe(true)
  })

  it('drops an off parameter from both the live and the hidden list', () => {
    /* Off is not a kind of hiding — it removes the parameter from the notices
     * entirely (§25.1, "what off does not do"). A parameter sitting in the
     * hidden list while switched off would be a notice that survived its
     * switch. */
    const alk = verdict('alkalinity', 'alert-low', 7.4, ALK)
    const out = buildNoticeList({ notices: [alk], hidden: hide({}, alk), off: ['alkalinity'] })
    expect(out.live).toHaveLength(0)
    expect(out.hidden).toHaveLength(0)
    expect(out.off).toHaveLength(1)
  })
})

describe('supersession — §20, and journey 4 problem 4', () => {
  it('keeps one live notice per parameter, never two', () => {
    /* Journey 4's heart: a stale "consider changing the dose" sitting beside
     * "a correction is in progress". §20: "A new verdict supersedes the old
     * notice rather than joining it. Nothing accumulates." */
    const out = buildNoticeList({
      notices: [verdict('alkalinity', 'out-of-band-low', 8.0, ALK)],
      hidden: {}, off: [],
    })
    expect(out.live.filter((n) => n.parameter === 'alkalinity')).toHaveLength(1)
  })

  it('records a collision rather than silently picking, where two notices share a parameter', () => {
    /* §25.4 kind 2 — a suspect reading "belongs to its parameter" — can arrive
     * alongside kind 1's verdict for that same parameter, and §20 allows one.
     * Canon does not say which wins. The model keeps the caller's first and
     * says so; it does not invent a precedence rule. */
    const v = verdict('alkalinity', 'out-of-band-low', 8.0, ALK)
    const suspect = { kind: 'suspect-reading', parameter: 'alkalinity', value: 7.2, range: ALK, severity: 'watch' }
    const out = buildNoticeList({ notices: [v, suspect], hidden: {}, off: [] })
    expect(out.live.filter((n) => n.parameter === 'alkalinity')).toHaveLength(1)
    expect(out.collisions).toEqual([{ key: noticeKey(v), parameter: 'alkalinity', kinds: ['verdict', 'suspect-reading'] }])
  })
})

describe('tiers — §25.1, four of them in this order', () => {
  it('places alerts first, out of range second, relationships third, the rest fourth', () => {
    expect(noticeTier(verdict('alkalinity', 'alert-low', 7.4, ALK))).toBe(1)
    expect(noticeTier(verdict('alkalinity', 'alert-high', 9.8, ALK))).toBe(1)
    expect(noticeTier(verdict('calcium', 'out-of-band-low', 390, CA))).toBe(2)
    expect(noticeTier(verdict('calcium', 'out-of-band-high', 460, CA))).toBe(2)
    expect(noticeTier({ kind: 'relationship', id: 'mg-gate', parameters: ['magnesium'] })).toBe(3)
    expect(noticeTier(verdict('calcium', 'drifting', 420, CA))).toBe(4)
  })

  it("puts ammonia's detectable state in tier 1", () => {
    /* §25.1: "Ammonia only ever produces a notice when it is detectable, and a
     * detectable reading is an alert (reef-chemistry.md §18, §32) — so it
     * enters at tier 1." §13 does not classify ammonia (§32.1), so the state
     * places it, not a band. */
    expect(noticeTier({ kind: 'verdict', parameter: 'ammonia', state: 'detectable', value: 0.25 })).toBe(1)
  })

  it('orders by tier before anything else', () => {
    /* §25.1: "tier outranks the fixed order absolutely." Ammonia is last in
     * the fixed order and alkalinity is first, so an ammonia alert above an
     * alkalinity out-of-range is the test that tier wins. */
    const out = buildNoticeList({
      notices: [
        verdict('alkalinity', 'out-of-band-low', 8.0, ALK),
        { kind: 'verdict', parameter: 'ammonia', state: 'detectable', value: 0.25, severity: 'act' },
      ],
      hidden: {}, off: [],
    })
    expect(out.live.map((n) => n.parameter)).toEqual(['ammonia', 'alkalinity'])
  })
})

describe('ranking — §25.1, proportional distance then the fixed order', () => {
  it('measures distance past the nearer edge as a fraction of the range width', () => {
    /* §25.1: "the distance past the nearer edge of the user's target range,
     * divided by that range's width, furthest first." */
    expect(proportionalDistance(verdict('alkalinity', 'out-of-band-low', 8.0, ALK))).toBeCloseTo(0.2 / 0.6, 10)
    expect(proportionalDistance(verdict('calcium', 'out-of-band-high', 460, CA))).toBeCloseTo(10 / 50, 10)
    expect(proportionalDistance(verdict('calcium', 'in-band', 420, CA))).toBe(0)
  })

  it('ranks the further-out parameter first within a tier, whatever the unit', () => {
    /* §25.1: "0.3 dKH and 30 ppm are not two sizes of the same thing, and a
     * raw distance would order the list by which parameter happens to be
     * measured in the larger unit." Calcium is 20 ppm out of a 50 band (0.40);
     * alkalinity is 0.1 dKH out of a 0.6 band (0.17). The raw numbers order
     * them the other way. */
    const out = buildNoticeList({
      notices: [
        verdict('alkalinity', 'out-of-band-low', 8.1, ALK),
        verdict('calcium', 'out-of-band-high', 470, CA),
      ],
      hidden: {}, off: [],
    })
    expect(out.live.map((n) => n.parameter)).toEqual(['calcium', 'alkalinity'])
  })

  it('breaks an exact tie with the fixed parameter order', () => {
    /* §25.1: "The fixed order breaks ties", and it "is a total order, so the
     * list is always deterministic". Both are 50% of their band past the edge.
     * Magnesium is offered first to prove input order does not decide it. */
    const out = buildNoticeList({
      notices: [
        verdict('magnesium', 'out-of-band-low', 1175, MG),
        verdict('calcium', 'out-of-band-low', 375, CA),
      ],
      hidden: {}, off: [],
    })
    expect(out.live.map((n) => n.parameter)).toEqual(['calcium', 'magnesium'])
  })

  it('is the order canon states, and pH sorts last', () => {
    /* §25.1's fixed order names eight; pH is derived to sort last, after
     * ammonia, and the bullet saying so is correctable in one line. */
    expect(FIXED_PARAMETER_ORDER).toEqual([
      'alkalinity', 'calcium', 'magnesium', 'salinity', 'nitrate', 'phosphate', 'potassium', 'ammonia',
    ])
    expect(PARAMETER_SORT_ORDER[PARAMETER_SORT_ORDER.length - 1]).toBe('ph')
    expect(PARAMETER_SORT_ORDER).toHaveLength(9)
  })

  it('sorts tier 4 by the fixed order alone', () => {
    const out = buildNoticeList({
      notices: [
        verdict('ph', 'in-band', 8.1, { min: 7.9, max: 8.3 }),
        verdict('potassium', 'in-band', 400, { min: 380, max: 420 }),
        verdict('alkalinity', 'drifting', 8.5, ALK),
      ],
      hidden: {}, off: [],
    })
    expect(out.live.map((n) => n.parameter)).toEqual(['alkalinity', 'potassium', 'ph'])
  })

  it('orders relationship notices by the earliest parameter they name', () => {
    /* §25.1: "Relationship notices order among themselves by the earliest
     * parameter they name" — derived, and stated so the tier is deterministic
     * for the same reason as the others. */
    const out = buildNoticeList({
      notices: [
        { kind: 'relationship', id: 'mg-gate', parameters: ['magnesium', 'alkalinity'] },
        { kind: 'relationship', id: 'both-nutrients-low', parameters: ['nitrate', 'phosphate'] },
      ],
      hidden: {}, off: [],
    })
    expect(out.live.map((n) => n.id)).toEqual(['mg-gate', 'both-nutrients-low'])
  })

  it('produces the same order however the notices arrive', () => {
    /* §25.1: "A list whose order changes without the tank changing is a list a
     * keeper cannot learn." */
    const notices = [
      verdict('phosphate', 'out-of-band-low', 0.01, PO4),
      verdict('alkalinity', 'alert-low', 7.4, ALK),
      { kind: 'relationship', id: 'mg-gate', parameters: ['magnesium'] },
      verdict('calcium', 'in-band', 420, CA),
    ]
    const forward = buildNoticeList({ notices, hidden: {}, off: [] }).live.map((n) => n.parameter ?? n.id)
    const backward = buildNoticeList({ notices: [...notices].reverse(), hidden: {}, off: [] }).live.map((n) => n.parameter ?? n.id)
    expect(backward).toEqual(forward)
  })
})

describe('the built list — the shape a surface renders', () => {
  it('splits live from hidden and orders both by the same rule', () => {
    /* §25.1: the hidden section sits below the list; it is the same set of
     * notices, not a different vocabulary. */
    const alk = verdict('alkalinity', 'alert-low', 7.4, ALK)
    const ca = verdict('calcium', 'out-of-band-high', 470, CA)
    const mg = verdict('magnesium', 'out-of-band-low', 1175, MG)
    const out = buildNoticeList({ notices: [mg, ca, alk], hidden: hide(hide({}, ca), mg), off: [] })
    expect(out.live.map((n) => n.parameter)).toEqual(['alkalinity'])
    /* Magnesium is 75 of a 150 band past the edge (0.50), calcium 20 of 50
     * (0.40), so the hidden list is ranked by the same proportional distance as
     * the live one — not by the fixed order, which would have put calcium
     * first. */
    expect(out.hidden.map((n) => n.parameter)).toEqual(['magnesium', 'calcium'])
  })

  it('carries no wording of its own', () => {
    /* §25.4: "a notice is that verdict rendered", and §19 gives every sentence
     * to the engine. A notice model that minted a title would be Stage 6c
     * doing itself early, and §11's single-source rule forbids it. */
    const out = buildNoticeList({ notices: [verdict('alkalinity', 'alert-low', 7.4, ALK)], hidden: {}, off: [] })
    const own = Object.entries(out.live[0]).filter(([k, v]) => typeof v === 'string' && /\s/.test(v) && k !== 'parameter')
    expect(own).toEqual([])
  })

  it('is empty for a tank with nothing to say, rather than saying so', () => {
    const out = buildNoticeList({ notices: [], hidden: {}, off: [] })
    expect(out.live).toEqual([])
    expect(out.hidden).toEqual([])
  })

  it('ignores a malformed notice instead of throwing', () => {
    /* The app is used one-handed at a tank; a notice list that throws takes
     * the dashboard with it. */
    const out = buildNoticeList({ notices: [null, {}, verdict('calcium', 'in-band', 420, CA)], hidden: {}, off: [] })
    expect(out.live.map((n) => n.parameter)).toEqual(['calcium'])
    expect(out.malformed).toBe(2)
  })
})

describe('what canon does not settle — recorded, not decided', () => {
  it('does not let a parameter switch reach a relationship notice, and says so', () => {
    /* §25.1 makes off per parameter; §25.4 kind 3 belongs to no single
     * parameter. Canon does not say whether switching magnesium off silences a
     * relationship notice naming magnesium. The model leaves it live and
     * reports the gap rather than choosing. */
    const rel = { kind: 'relationship', id: 'mg-gate', parameters: ['magnesium', 'alkalinity'] }
    const out = buildNoticeList({ notices: [rel], hidden: {}, off: ['magnesium'] })
    expect(out.live.map((n) => n.id)).toEqual(['mg-gate'])
    expect(out.gaps).toContain('relationship-notice-vs-off')
  })

  it('hides a relationship notice as one notice, and says the both-parameters question is open', () => {
    /* §25.4: "whether hiding one hides it for both parameters it names is a
     * question about hiding rather than about placement" — G-26's second
     * question, explicitly open. */
    const rel = { kind: 'relationship', id: 'mg-gate', parameters: ['magnesium', 'alkalinity'] }
    const out = buildNoticeList({ notices: [rel], hidden: hide({}, rel), off: [] })
    expect(out.hidden.map((n) => n.id)).toEqual(['mg-gate'])
    expect(out.gaps).toContain('relationship-notice-hide-scope')
  })
})
