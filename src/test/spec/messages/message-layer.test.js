/* Stage 6c — the message layer, tested against §24's quoted wording.
 *
 * THE-ENGINE-PLAN-v2.md Stage 6c. §24 says its cards are "not illustrations.
 * They are the reference wording, and Stage 6c builds the message layer to
 * produce them" — so the test for this layer is not that it produces something
 * sensible, it is that it produces **exactly those strings**. Every expectation
 * below is copied from the card it names.
 *
 * Nothing here is taken from the current app's strings: §24 says "where a card
 * here and a current app string differ, the card wins and the string is a
 * finding", so a test agreeing with the app would be asserting the finding.
 */
import { describe, expect, it } from 'vitest'
import {
  CARDS,
  CARD_IDS,
  CARD_SURFACE,
  RETURN_PLAN_CARDS,
  RETURN_PLAN_EXCEPTION,
  collapsedHeadline,
  confirmationFor,
  renderCard,
  summaryLine,
} from '../../../lib/messages/message-layer.js'

/* Alkalinity throughout, as §24 does, with its own figures. `step` is the
 * parameter's display step — §13 rounds for display and canon names no
 * precision, so the caller supplies it. */
const alk = { parameter: 'alkalinity', step: 0.1 }
const render = (id, facts) => renderCard(id, { ...alk, ...facts })
const said = (r) => [r.headline, r.support.join(' ')]

describe('§24 — the twenty-seven cards, rendered to canon\'s own wording', () => {
  it('has exactly twenty-seven', () => {
    expect(CARD_IDS).toHaveLength(27)
    expect(CARD_IDS[0]).toBe('24.1')
    expect(CARD_IDS[26]).toBe('24.27')
  })

  it('24.1 — nothing to do', () => {
    expect(said(render('24.1', { value: 8.5, range: { min: 8.2, max: 8.8 } }))).toEqual([
      'Alkalinity is holding at 8.5 dKH',
      'In your range of 8.2–8.8.',
    ])
  })

  it('24.2 — the dose no longer matches', () => {
    expect(said(render('24.2', {
      value: 8.5, ratePerDay: 0.1, readingCount: 3, dose: '9.0', matchingDose: '9.7',
    }))).toEqual([
      'Alkalinity is in range but falling',
      '8.5 dKH now, down about 0.1 a day over the last three readings. Your dose of 9.0 mL/day is below what the tank is using — 9.7 mL/day would match it.',
    ])
  })

  it('24.3 — steady, but in the wrong place', () => {
    const r = render('24.3', { value: 8.0, aimPoint: 8.5 })
    expect(said(r)).toEqual([
      'Alkalinity is steady at 8.0 dKH, below your range',
      'Your dose is matching what the tank uses, so it will stay here.',
    ])
    expect(r.offer).toBe('Plan a gradual return to 8.5 dKH')
  })

  it('24.4 — too soon to judge a change', () => {
    expect(said(render('24.4', { doseChangedTo: '9.7', doseChangedWhen: 'yesterday' }))).toEqual([
      'Too soon to tell',
      "You raised the alkalinity dose to 9.7 mL/day yesterday. One more reading will show whether it's working.",
    ])
  })

  it('24.5 — not enough data, and it still states the position', () => {
    expect(said(render('24.5', { value: 8.5, readingsNeeded: 2 }))).toEqual([
      'Not enough readings yet',
      "Alkalinity is 8.5 dKH, in your range. Two more readings will show which way it's going.",
    ])
  })

  it('24.6 — the change worked', () => {
    expect(said(render('24.6', { value: 8.6, previousValue: 8.3 }))).toEqual([
      'Your dose change is working',
      'Alkalinity is up to 8.6 dKH from 8.3, in your range. Keep testing every couple of days until it settles.',
    ])
  })

  it('24.7 — still falling despite the change', () => {
    expect(said(render('24.7', {
      value: 8.3, previousValue: 8.5, previousWhen: 'two days ago', doseChangedTo: '9.7', doseChangedOn: '14th',
    }))).toEqual([
      'Alkalinity is still falling despite your dose change',
      "8.3 dKH now, down from 8.5 two days ago. You raised the dose to 9.7 mL/day on the 14th and the fall hasn't slowed. It may need to go higher.",
    ])
  })

  it('24.8 — no response at all', () => {
    expect(said(render('24.8', {
      value: 8.5, previousValue: 8.5, previousWhen: '14th', doseChangedTo: '9.7', doseChangedWhen: 'two days ago',
    }))).toEqual([
      "Alkalinity hasn't moved since your dose change",
      '8.5 on the 14th, 8.5 now. You raised the dose to 9.7 mL/day two days ago and nothing has responded. It may need to go higher.',
    ])
  })

  it('24.9 — very low, and it never says "safe" out loud', () => {
    const r = render('24.9', { value: 6.8 })
    expect(said(r)).toEqual([
      'Alkalinity is very low at 6.8 dKH',
      'This needs a correction unless you are deliberately holding it there.',
    ])
    /* §24.9: "No mention of the safe floor ... §15's rule that the app never
     * says 'safe' out loud, applied to the figure behind the word." */
    expect(said(r).join(' ')).not.toMatch(/safe|7\.5|dangerous/i)
  })

  it('24.10 — a correction running', () => {
    expect(said(render('24.10', {
      value: 8.1, correctionStartValue: 7.6, aimPoint: 8.5, testAgainInDays: 2,
    }))).toEqual([
      'Correction running',
      'Alkalinity is 8.1 dKH, up from 7.6 when the correction started. Heading for 8.5. Test again in two days.',
    ])
  })

  it('24.11 — a correction that is not working, and it does not say why', () => {
    const r = render('24.11', { value: 7.6, correctionStartedDaysAgo: 4 })
    expect(said(r)).toEqual([
      "The correction isn't working",
      'Alkalinity is 7.6 dKH, the same as when the correction started four days ago.',
    ])
    /* §23.5, and §24.11: "The temptation here is strongest and the card resists
     * it: it states the two numbers and the elapsed time, and stops." */
    expect(said(r).join(' ')).not.toMatch(/may be|might be|because|likely|probably/i)
  })

  it('24.12 — figures cannot be trusted', () => {
    const r = render('24.12', {})
    expect(said(r)).toEqual([
      "Alkalinity figures can't be trusted",
      "The numbers imply a solution strength far from what's in Setup. Check the strength before using any dose figure here.",
    ])
    expect(r.action).toBe('setup')
  })

  it('24.13 — a correction has arrived, and it is direction-aware', () => {
    /* The one card §24 makes direction-aware in terms: "A correction that
     * pushed upward risks continuing upward, so it says rising; a downward
     * correction says falling." */
    expect(said(render('24.13', { value: 8.5, correctionDirection: 'up' }))).toEqual([
      'Alkalinity has reached 8.5 dKH',
      "Back in your range. One more reading will confirm it's holding — it may still be rising.",
    ])
    expect(render('24.13', { value: 8.5, correctionDirection: 'down' }).support.join(' '))
      .toMatch(/it may still be falling\.$/)
  })

  it('24.14 — a correction has finished', () => {
    expect(said(render('24.14', { value: 8.5, dose: '9.0' }))).toEqual([
      'Correction finished',
      'Alkalinity is holding at 8.5 dKH, in your range. Your dose is back to 9.0 mL/day.',
    ])
  })

  it('24.15 — a correction is due a reading', () => {
    expect(said(render('24.15', { expectedDays: 3 }))).toEqual([
      'Time to test',
      'The alkalinity correction has run its expected three days. A reading today will show where it got to.',
    ])
  })

  it('24.16 — a correction has overrun, and it does not say it failed', () => {
    const r = render('24.16', { elapsedDays: 9, expectedDays: 3 })
    expect(said(r)).toEqual([
      'The correction has run longer than expected',
      'Nine days have passed with no readings on what should have been a three-day plan. A reading today will show where it got to.',
    ])
    expect(said(r).join(' ')).not.toMatch(/failed|didn't work|isn't working/i)
  })

  it('24.17 — out of range and coming back', () => {
    expect(said(render('24.17', { value: 8.1, previousValue: 7.9, readingCount: 3 }))).toEqual([
      'Alkalinity is below your range but coming back',
      '8.1 dKH, up from 7.9 over the last three readings.',
    ])
  })

  it('24.18 — out of range and still going', () => {
    expect(said(render('24.18', { value: 8.0, previousValue: 8.3, readingCount: 3 }))).toEqual([
      'Alkalinity is below your range and still falling',
      '8.0 dKH, down from 8.3 over the last three readings.',
    ])
  })

  it('24.19 — the change helped, but not enough', () => {
    expect(said(render('24.19', { value: 8.4, previousValue: 8.1, matchingDose: '10.2' }))).toEqual([
      "The change helped but hasn't gone far enough",
      'Alkalinity is 8.4 dKH, up from 8.1, still below your range. 10.2 mL/day would match what the tank is using.',
    ])
  })

  it('24.20 — the change went too far, and offers no return plan', () => {
    const r = render('24.20', { value: 9.0, previousValue: 8.1, matchingDose: '9.3' })
    expect(said(r)).toEqual([
      'The change went further than needed',
      'Alkalinity is 9.0 dKH, up from 8.1, now above your range. 9.3 mL/day would match what the tank is using.',
    ])
    /* §24.20: "Walking it back down is a return plan, it is a separate offer,
     * and it is not available here because the level is not steady yet." */
    expect(r.offer).toBeNull()
  })

  it('24.21 — one reading in, not enough to say', () => {
    expect(said(render('24.21', { value: 8.4 }))).toEqual([
      'You have logged one reading since your dose change',
      'Alkalinity is 8.4 dKH. One more will show whether the change is working.',
    ])
  })

  it('24.22 — still rising despite the change', () => {
    expect(said(render('24.22', {
      value: 9.1, previousValue: 8.9, previousWhen: 'two days ago', doseChangedTo: '8.4', doseChangedOn: '14th',
    }))).toEqual([
      'Alkalinity is still rising despite your dose change',
      "9.1 dKH now, up from 8.9 two days ago. You lowered the dose to 8.4 mL/day on the 14th and the rise hasn't slowed. It may need to come down further.",
    ])
  })

  it('24.23 — far out, and it names no alternative product', () => {
    const r = render('24.23', { value: 6.9, aimPoint: 8.5, planDays: 9 })
    expect(said(r)).toEqual([
      'Alkalinity is very low at 6.9 dKH',
      'Bringing it to 8.5 would take about nine days at a safe rate.',
    ])
    expect(r.offer).toBe('Plan a gradual return to 8.5 dKH')
    /* §24.23 and reef-chemistry.md §9 as amended: the constraint is the rate,
     * not the product. Naming a faster one "makes an unsafe change easier to
     * perform." */
    expect(said(r).join(' ')).not.toMatch(/buffer|water change|dry salt/i)
  })

  it('24.24 — rising faster than the dose accounts for, naming no cause', () => {
    const r = render('24.24', { value: 9.1, previousValue: 8.6, previousWhen: 'two days ago', testAgainInDays: 2 })
    expect(said(r)).toEqual([
      'Alkalinity is rising faster than your dose accounts for',
      '9.1 dKH, up from 8.6 two days ago. The dose is unchanged. Test again in two days.',
    ])
    /* reef-chemistry.md §24 and §23.5 — the card names no cause, and the Setup
     * strength was considered and rejected at the escalation. */
    expect(said(r).join(' ')).not.toMatch(/strength|water change|correction|demand/i)
  })

  it('24.25 — a staged plan is due a reading, sharing 24.15\'s headline', () => {
    const r = render('24.25', { doseChangedWhen: 'four days ago' })
    expect(said(r)).toEqual([
      'Time to test',
      'You changed the alkalinity dose four days ago. A reading today will show whether it worked.',
    ])
    /* §24.25: "the same two words at the top, a different sentence underneath".
     * 24.15 asks where a correction got to; this asks whether a change worked. */
    expect(r.headline).toBe(render('24.15', { expectedDays: 3 }).headline)
    expect(r.support).not.toEqual(render('24.15', { expectedDays: 3 }).support)
  })

  it('24.26 — tested, and still too close to call', () => {
    expect(said(render('24.26', { value: 8.6, readingsSinceChange: 2 }))).toEqual([
      'Still too close to call',
      "Alkalinity is 8.6 dKH after two readings since your dose change. One more will show which way it's going.",
    ])
  })

  it('24.27 — the change worked, and the level is settled out of range', () => {
    const r = render('24.27', { value: 8.0, aimPoint: 8.5 })
    expect(said(r)).toEqual([
      'The change worked, but alkalinity is settled below your range',
      '8.0 dKH, holding steady since the change. Your dose is now matching what the tank uses.',
    ])
    expect(r.offer).toBe('Plan a gradual return to 8.5 dKH')
    /* §3's tone for route 12 — the one `worked` route that is not teal. */
    expect(r.tone).toBe('grey')
  })
})

describe('§23 — the wording rules the cards are bound by', () => {
  it('23.7 — a fragment headline drops the parameter, a sentence keeps it', () => {
    /* §24's own two lists, verbatim. "The test is whether the sentence stands
     * on its own, not whether the parameter appears." */
    const fragments = ['24.4', '24.5', '24.10', '24.11', '24.14', '24.15', '24.16', '24.19', '24.20', '24.21']
    for (const id of fragments) {
      const r = render(id, ALL_FACTS[id])
      expect(r.headline.toLowerCase()).not.toContain('alkalinity')
    }
    for (const id of ['24.1', '24.2', '24.9']) {
      expect(render(id, ALL_FACTS[id]).headline).toContain('Alkalinity')
    }
  })

  it('23.4 — every figure carries its unit, in the parameter\'s own unit', () => {
    /* dKH for alkalinity. The first figure on each card that quotes a level
     * carries it; canon does not repeat the unit on a comparison figure in the
     * same sentence, and the cards above are the reference for which is which. */
    expect(render('24.1', ALL_FACTS['24.1']).headline).toContain('dKH')
    const ca = renderCard('24.1', { parameter: 'calcium', step: 1, value: 425, range: { min: 400, max: 450 } })
    expect(ca.headline).toBe('Calcium is holding at 425 ppm')
    expect(ca.support[0]).toBe('In your range of 400–450.')
  })

  it('23.3 — no dose figure on a card where nothing is happening', () => {
    /* "A card that says a level is holding does not need to recite the dose
     * that is holding it." */
    expect(render('24.1', ALL_FACTS['24.1']).support.join(' ')).not.toMatch(/mL\/day/)
    /* And it does appear in the three cases — here the third, which §23.3 calls
     * the one that is easy to drop and must not be. */
    expect(render('24.3', ALL_FACTS['24.3']).support.join(' ')).toMatch(/dose is matching/)
  })

  it('23.2 — the second person appears only as a fact about the user\'s own action', () => {
    expect(render('24.4', ALL_FACTS['24.4']).support.join(' ')).toMatch(/^You raised/)
    expect(render('24.25', ALL_FACTS['24.25']).support.join(' ')).toMatch(/^You changed/)
  })

  it('15 — the return plan uses its registered phrase, on exactly the two states that satisfy §28.2', () => {
    /* §24.3: "the offer appears on exactly the states that satisfy §28.2 —
     * stable and out of band ... A fourth card acquiring it is a finding."
     * 24.23 is the third and the known exception, carried at §25.6 item 7. */
    const offering = CARD_IDS.filter((id) => render(id, ALL_FACTS[id]).offer != null)
    expect(offering.sort()).toEqual([...RETURN_PLAN_CARDS, RETURN_PLAN_EXCEPTION].sort())
    for (const id of offering) {
      expect(render(id, ALL_FACTS[id]).offer).toMatch(/^Plan a gradual return to /)
    }
  })
})

describe('placement — §24.9 and §24.23, decided 16 August, Stage 5c', () => {
  it('puts the short card on the dashboard and the plan card in the wizard', () => {
    expect(CARD_SURFACE['24.9']).toBe('dashboard')
    expect(CARD_SURFACE['24.23']).toBe('wizard')
    expect(render('24.9', ALL_FACTS['24.9']).surface).toBe('dashboard')
    expect(render('24.23', ALL_FACTS['24.23']).surface).toBe('wizard')
  })

  it('is the whole of the collision rule — no card decides by reading another\'s prose', () => {
    /* What deleted `narrative-engine.js:457-459`: "a surface deciding what to
     * show by pattern-matching another surface's sentences is the shape of
     * fault §11's single-source rule exists to prevent." The two cards are
     * placed, and neither is reworded. */
    expect(render('24.9', ALL_FACTS['24.9']).headline).toBe('Alkalinity is very low at 6.8 dKH')
    expect(render('24.23', ALL_FACTS['24.23']).headline).toBe('Alkalinity is very low at 6.9 dKH')
  })
})

describe('refusals — §14, a refusal names what is missing', () => {
  it('refuses a card it does not have', () => {
    const r = renderCard('24.99', alk)
    expect(r.headline).toBeNull()
    expect(r.refusals[0].code).toBe('no-such-card')
  })

  it('refuses without a parameter, because §23.7 assumes the badge', () => {
    expect(renderCard('24.1', { value: 8.5 }).refusals[0].code).toBe('no-parameter')
  })

  it('names the missing figures rather than rendering a sentence with a hole in it', () => {
    const r = render('24.2', { value: 8.5 })
    expect(r.headline).toBeNull()
    expect(r.refusals[0].code).toBe('missing-figures')
    expect(r.refusals[0].missing).toBe('ratePerDay, readingCount, dose, matchingDose')
  })

  it('refuses a direction canon has not worded, rather than composing the mirror', () => {
    /* The rule this layer is built on. §24 words 24.2 as falling only; a
     * "rising" version would be a second reference wording minted by an
     * implementer. Reported in `.agent/stage-6c-gaps.md`. */
    const r = render('24.2', {
      value: 8.5, ratePerDay: 0.1, readingCount: 3, dose: '9.0', matchingDose: '9.7', direction: 'rising',
    })
    expect(r.headline).toBeNull()
    expect(r.refusals[0].code).toBe('no-canon-wording-for-direction')
    expect(r.refusals[0].missing).toMatch(/§24 words 24\.2 as "falling" only/)
  })

  it('renders the direction canon did write, when asked for it explicitly', () => {
    expect(render('24.2', {
      value: 8.5, ratePerDay: 0.1, readingCount: 3, dose: '9.0', matchingDose: '9.7', direction: 'falling',
    }).headline).toBe('Alkalinity is in range but falling')
  })
})

describe('§25 — the surfaces', () => {
  it('25.1 — the short form is the card\'s own headline and first sentence', () => {
    /* "The summary shows the headline plus the first sentence of the wizard's
     * card. It is not a separate wording ... the only arrangement in which two
     * wordings cannot drift apart, because there is only one wording." */
    const card = render('24.2', ALL_FACTS['24.2'])
    expect(summaryLine(card)).toEqual({
      headline: 'Alkalinity is in range but falling',
      first: '8.5 dKH now, down about 0.1 a day over the last three readings.',
      parameter: 'alkalinity',
    })
  })

  it('25.1 — every one of canon\'s eleven worked short forms comes out right', () => {
    /* §25.1 tabulates eleven of the twelve first-pass cards "as the check that
     * the rule generates sensible lines rather than as a second source". If the
     * rule is generative, this table is reproducible from the cards. */
    const expected = {
      '24.1': ['Alkalinity is holding at 8.5 dKH', 'In your range of 8.2–8.8.'],
      '24.2': ['Alkalinity is in range but falling', '8.5 dKH now, down about 0.1 a day over the last three readings.'],
      '24.3': ['Alkalinity is steady at 8.0 dKH, below your range', 'Your dose is matching what the tank uses, so it will stay here.'],
      '24.4': ['Too soon to tell', 'You raised the alkalinity dose to 9.7 mL/day yesterday.'],
      '24.5': ['Not enough readings yet', 'Alkalinity is 8.5 dKH, in your range.'],
      '24.6': ['Your dose change is working', 'Alkalinity is up to 8.6 dKH from 8.3, in your range.'],
      '24.7': ['Alkalinity is still falling despite your dose change', '8.3 dKH now, down from 8.5 two days ago.'],
      '24.8': ["Alkalinity hasn't moved since your dose change", '8.5 on the 14th, 8.5 now.'],
      '24.9': ['Alkalinity is very low at 6.8 dKH', 'This needs a correction unless you are deliberately holding it there.'],
      '24.10': ['Correction running', 'Alkalinity is 8.1 dKH, up from 7.6 when the correction started.'],
      '24.11': ["The correction isn't working", 'Alkalinity is 7.6 dKH, the same as when the correction started four days ago.'],
    }
    for (const [id, [headline, first]] of Object.entries(expected)) {
      expect([id, summaryLine(render(id, ALL_FACTS[id]))]).toEqual([id, { headline, first, parameter: 'alkalinity' }])
    }
  })

  it('25.3 — the confirmation renders the card and adds no verdict of its own', () => {
    const card = render('24.6', ALL_FACTS['24.6'])
    expect(confirmationFor(card)).toBe(card)
  })

  it('25.1 — the collapsed headline fills three slots and drops the empty ones', () => {
    /* Canon's own worked example, all three slots filled. */
    expect(collapsedHeadline({
      verdicts: [
        { parameter: 'alkalinity', band: 'out-of-band-low', value: 8.0, range: { min: 8.2, max: 8.8 } },
        { parameter: 'calcium', moving: true, band: 'in-band' },
        { parameter: 'magnesium', moving: true, band: 'in-band' },
        { parameter: 'nitrate', moving: true, band: 'in-band' },
        { parameter: 'phosphate', moving: true, band: 'in-band' },
      ],
      inFlight: true,
    })).toBe('Alkalinity is out of range, and several others are moving — a dose change is still settling.')
  })

  it('25.1 — a dropped slot leaves nothing behind', () => {
    /* "no 'and nothing else', no placeholder clause". */
    expect(collapsedHeadline({
      verdicts: [{ parameter: 'alkalinity', band: 'out-of-band-low', value: 8.0, range: { min: 8.2, max: 8.8 } }],
    })).toBe('Alkalinity is out of range.')
  })

  it('25.1 — a quiet tank produces no line at all', () => {
    expect(collapsedHeadline({ verdicts: [{ parameter: 'calcium', band: 'in-band' }] })).toBeNull()
    expect(collapsedHeadline({ verdicts: [] })).toBeNull()
  })

  it('25.1 — the worst thing leads, alert tier before distance', () => {
    /* "A parameter at alert-low or alert-high outranks every parameter that is
     * merely out of range, however far out." Calcium is 100% of its band past
     * the edge; alkalinity's alert wins anyway. */
    expect(collapsedHeadline({
      verdicts: [
        { parameter: 'calcium', band: 'out-of-band-high', value: 500, range: { min: 400, max: 450 } },
        { parameter: 'alkalinity', band: 'alert-low', value: 7.4, range: { min: 8.2, max: 8.8 } },
      ],
    })).toBe('Alkalinity and calcium are out of range.')
  })

  it('25.1 — the naming cut holds at one, three and four out of range', () => {
    /* "One, two or three parameters out of range: each is named. Four or more:
     * the worst two are named, followed by 'several others'." The cut is on the
     * count, so it is asserted at the count — and the whole string is asserted,
     * because a regex that happens not to match is not a test. Values are set
     * so the worst-first order is nitrate, magnesium, calcium, alkalinity. */
    const mk = (names) => names.map((parameter, i) => ({
      parameter, band: 'out-of-band-low', value: 9 - i, range: { min: 10, max: 20 },
    }))
    expect(collapsedHeadline({ verdicts: mk(['alkalinity']) }))
      .toBe('Alkalinity is out of range.')
    expect(collapsedHeadline({ verdicts: mk(['alkalinity', 'calcium', 'magnesium']) }))
      .toBe('Magnesium, calcium and alkalinity are out of range.')
    expect(collapsedHeadline({ verdicts: mk(['alkalinity', 'calcium', 'magnesium', 'nitrate']) }))
      .toBe('Nitrate, magnesium and several others are out of range.')
  })

  it('25.1 — names only the worst two at four, so the fourth is not in the string', () => {
    const mk = (names) => names.map((parameter, i) => ({
      parameter, band: 'out-of-band-low', value: 9 - i, range: { min: 10, max: 20 },
    }))
    const line = collapsedHeadline({ verdicts: mk(['alkalinity', 'calcium', 'magnesium', 'nitrate']) })
    expect(line.toLowerCase()).not.toContain('alkalinity')
    expect(line.toLowerCase()).not.toContain('calcium')
  })
})

/* The facts each card needs, in one place, so the §23 and §25 blocks above can
 * render any card without restating them. Every figure is §24's own. */
const ALL_FACTS = {
  '24.1': { value: 8.5, range: { min: 8.2, max: 8.8 } },
  '24.2': { value: 8.5, ratePerDay: 0.1, readingCount: 3, dose: '9.0', matchingDose: '9.7' },
  '24.3': { value: 8.0, aimPoint: 8.5 },
  '24.4': { doseChangedTo: '9.7', doseChangedWhen: 'yesterday' },
  '24.5': { value: 8.5, readingsNeeded: 2 },
  '24.6': { value: 8.6, previousValue: 8.3 },
  '24.7': { value: 8.3, previousValue: 8.5, previousWhen: 'two days ago', doseChangedTo: '9.7', doseChangedOn: '14th' },
  '24.8': { value: 8.5, previousValue: 8.5, previousWhen: '14th', doseChangedTo: '9.7', doseChangedWhen: 'two days ago' },
  '24.9': { value: 6.8 },
  '24.10': { value: 8.1, correctionStartValue: 7.6, aimPoint: 8.5, testAgainInDays: 2 },
  '24.11': { value: 7.6, correctionStartedDaysAgo: 4 },
  '24.12': {},
  '24.13': { value: 8.5, correctionDirection: 'up' },
  '24.14': { value: 8.5, dose: '9.0' },
  '24.15': { expectedDays: 3 },
  '24.16': { elapsedDays: 9, expectedDays: 3 },
  '24.17': { value: 8.1, previousValue: 7.9, readingCount: 3 },
  '24.18': { value: 8.0, previousValue: 8.3, readingCount: 3 },
  '24.19': { value: 8.4, previousValue: 8.1, matchingDose: '10.2' },
  '24.20': { value: 9.0, previousValue: 8.1, matchingDose: '9.3' },
  '24.21': { value: 8.4 },
  '24.22': { value: 9.1, previousValue: 8.9, previousWhen: 'two days ago', doseChangedTo: '8.4', doseChangedOn: '14th' },
  '24.23': { value: 6.9, aimPoint: 8.5, planDays: 9 },
  '24.24': { value: 9.1, previousValue: 8.6, previousWhen: 'two days ago', testAgainInDays: 2 },
  '24.25': { doseChangedWhen: 'four days ago' },
  '24.26': { value: 8.6, readingsSinceChange: 2 },
  '24.27': { value: 8.0, aimPoint: 8.5 },
}

describe('the whole set renders', () => {
  it('produces a headline and support for every one of the twenty-seven', () => {
    for (const id of CARD_IDS) {
      const r = render(id, ALL_FACTS[id])
      expect([id, r.refusals]).toEqual([id, []])
      expect([id, typeof r.headline]).toEqual([id, 'string'])
      expect([id, r.support.length > 0]).toEqual([id, true])
    }
  })

  it('mints no wording outside CARDS — every string a card produces comes from its own render', () => {
    /* §11's single-source rule and §25.1's first rule: a literal in a summary's
     * code path is a finding. The card registry is the only place a sentence
     * lives, and `summaryLine` and `confirmationFor` add nothing. */
    for (const id of CARD_IDS) {
      const r = render(id, ALL_FACTS[id])
      const line = summaryLine(r)
      expect(line.headline).toBe(r.headline)
      expect(line.first).toBe(r.support[0])
    }
    expect(Object.keys(CARDS)).toHaveLength(27)
  })
})
