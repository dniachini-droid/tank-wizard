/* Stage 6c — the message layer.
 *
 * THE-ENGINE-PLAN-v2.md Stage 6c, built alongside the existing narrative
 * engine. Nothing calls it; the switchover is 6f. `narrative-engine.js` and
 * `buildFindings` are untouched and the golden fingerprint does not move.
 *
 * Written from canon alone:
 *   wizard-states.md §24    the twenty-seven cards — "not illustrations. They
 *                           are the reference wording, and Stage 6c builds the
 *                           message layer to produce them."
 *   wizard-states.md §23    the seven wording rules
 *   wizard-states.md §25    the surfaces — the short form is generated, never
 *                           written; the confirmation defers; the collapsed
 *                           headline is three slots
 *   wizard-states.md §14    the message contract; a refusal names what is
 *                           missing
 *   wizard-states.md §15    the terminology registry
 *   wizard-states.md §11    the single-source rule
 *
 * ── THE RULE THIS MODULE IS BUILT ON ────────────────────────────────────────
 *
 * **It does not invent wording.** Every string below is §24's, with figures
 * substituted. Where canon words a situation in one direction only, this layer
 * renders that direction and **refuses the mirror**, naming the card and the
 * direction — it does not compose the opposite sentence, however obvious the
 * opposite looks. §24 calls its cards "the reference wording"; a mirror this
 * module wrote would be a second reference, minted by an implementer, which is
 * the thing §25.1's first rule and §11's single-source rule both exist to stop.
 *
 * The exceptions are the two canon states explicitly:
 *   - **parameter** — §24's preamble: "Alkalinity is used throughout; the same
 *     shapes apply to calcium and magnesium in their own units (§23.4)."
 *   - **direction on 24.13** — that card's own note: "Direction-aware. A
 *     correction that pushed upward risks continuing upward, so it says
 *     *rising*; a downward correction says *falling*."
 * Everywhere else the direction is fixed to the one canon wrote, and the
 * refusals are listed in `.agent/stage-6c-gaps.md`.
 *
 * **The wizard owns the verdict; this layer only renders it.** Nothing here
 * classifies, grades, compares against a band, or decides which card applies —
 * `classifyReading` (6a) and `doseStatus` (6d) do that, and the card id arrives
 * as an argument. Where a surface appears to need a claim the wizard cannot
 * supply, that is a gap in the wizard and it is reported as one.
 */

/* §15's registered phrases, so a card cannot drift from the registry. */
const RETURN_PLAN = 'Plan a gradual return to';

/* §23.4: dKH for alkalinity, ppm for everything else. Every figure, every card,
 * with no exception for a second figure in the same sentence. */
export const UNITS = {
  alkalinity: 'dKH', calcium: 'ppm', magnesium: 'ppm', salinity: 'ppt',
  nitrate: 'ppm', phosphate: 'ppm', potassium: 'ppm', ammonia: 'ppm', ph: '',
};

/* Canon writes small counts as words — "Two more readings", "nine days", "the
 * last three readings". Reproducing that register is not inventing wording; a
 * card that read "2 more readings" would be a different string from §24's. */
const WORDS = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven',
  'eight', 'nine', 'ten', 'eleven', 'twelve'];
const word = (n) => (Number.isInteger(n) && n >= 0 && n < WORDS.length ? WORDS[n] : String(n));
const Word = (n) => { const w = word(n); return w.charAt(0).toUpperCase() + w.slice(1); };

const isNum = (v) => typeof v === 'number' && Number.isFinite(v);
const cap = (s) => String(s).charAt(0).toUpperCase() + String(s).slice(1);

/* §13: "Classification never rounds. Display rounds." Canon sets the display
 * precision nowhere, so this takes it from the parameter's own step where the
 * caller supplies one and otherwise prints the value as given. It never picks a
 * precision of its own — see `.agent/stage-6c-gaps.md` A-1. */
function num(value, facts) {
  if (!isNum(value)) return null;
  const step = facts?.step;
  if (!isNum(step) || step <= 0) return String(value);
  const dp = (String(step).split('.')[1] || '').length;
  return value.toFixed(dp);
}

/* A figure with its unit, per §23.4. pH has no unit and is the one parameter
 * where a bare number is correct. */
function q(value, facts) {
  const n = num(value, facts);
  if (n == null) return null;
  const unit = UNITS[facts?.parameter];
  return unit ? `${n} ${unit}` : n;
}

/* ------------------------------------------------------------- the cards ---- */

/* Each card carries §24's wording, the facts it needs, the surface it renders
 * on where canon places it, and its §3 tone where canon states one. `needs` is
 * checked before `render` runs, so a missing figure produces a refusal that
 * names it (§14) rather than a sentence with a hole in it. */
export const CARDS = {
  '24.1': {
    state: 'idle', title: 'Nothing to do',
    needs: ['value', 'range'],
    render: (f) => ({
      /* §23.7: a complete sentence keeps the parameter — "is holding at 8.5 dKH"
       * would not stand on its own. */
      headline: `${cap(f.parameter)} is holding at ${q(f.value, f)}`,
      support: [`In your range of ${num(f.range.min, f)}–${num(f.range.max, f)}.`],
      /* §23.3: no dose figure. "A card that says a level is holding does not
       * need to recite the dose that is holding it." */
      action: null,
    }),
  },

  '24.2': {
    state: 'suggested', title: 'The dose no longer matches',
    needs: ['value', 'ratePerDay', 'readingCount', 'dose', 'matchingDose'],
    direction: 'falling',
    render: (f) => ({
      headline: `${cap(f.parameter)} is in range but falling`,
      support: [
        `${q(f.value, f)} now, down about ${num(f.ratePerDay, f)} a day over the last ${word(f.readingCount)} readings.`,
        /* §28.1 in one sentence: the figure is what the tank is using, and it is
         * not carrying an intention. "would match it", never "change to". */
        `Your dose of ${f.dose} mL/day is below what the tank is using — ${f.matchingDose} mL/day would match it.`,
      ],
      action: 'wizard',
    }),
  },

  '24.3': {
    state: 'off-target', title: 'Steady, but in the wrong place',
    needs: ['value', 'aimPoint'],
    direction: 'below',
    render: (f) => ({
      headline: `${cap(f.parameter)} is steady at ${q(f.value, f)}, below your range`,
      /* §23.3's third case — without it the card reads as the app failing to
       * notice, and the offer below has nothing to stand on. */
      support: ['Your dose is matching what the tank uses, so it will stay here.'],
      action: 'return-plan',
      offer: `${RETURN_PLAN} ${q(f.aimPoint, f)}`,
    }),
  },

  '24.4': {
    state: 'settling', title: 'Too soon to judge a change',
    needs: ['doseChangedTo', 'doseChangedWhen'],
    render: (f) => ({
      headline: 'Too soon to tell',
      /* §23.2's permitted second person — a statement of fact about the user's
       * own action. */
      support: [`You raised the ${f.parameter} dose to ${f.doseChangedTo} mL/day ${f.doseChangedWhen}.`,
        'One more reading will show whether it\'s working.'],
      action: null,
    }),
    direction: 'raised',
  },

  '24.5': {
    state: 'settling', title: 'Not enough data',
    needs: ['value', 'readingsNeeded'],
    render: (f) => ({
      headline: 'Not enough readings yet',
      /* §24.5's own note: "It still states the position, because the position is
       * known." §13's last row was amended to match this on 16 August. */
      support: [`${cap(f.parameter)} is ${q(f.value, f)}, in your range.`,
        `${Word(f.readingsNeeded)} more readings will show which way it's going.`],
      action: null,
    }),
  },

  '24.6': {
    state: 'worked', title: 'The change worked',
    needs: ['value', 'previousValue'],
    render: (f) => ({
      headline: 'Your dose change is working',
      support: [`${cap(f.parameter)} is up to ${q(f.value, f)} from ${num(f.previousValue, f)}, in your range.`,
        'Keep testing every couple of days until it settles.'],
      action: null,
    }),
    direction: 'up',
  },

  '24.7': {
    state: null, title: 'Still falling despite the change — contradiction state, does not exist',
    needs: ['value', 'previousValue', 'previousWhen', 'doseChangedTo', 'doseChangedOn'],
    contradictionState: true,
    direction: 'falling',
    render: (f) => ({
      headline: `${cap(f.parameter)} is still falling despite your dose change`,
      support: [`${q(f.value, f)} now, down from ${num(f.previousValue, f)} ${f.previousWhen}.`,
        `You raised the dose to ${f.doseChangedTo} mL/day on the ${f.doseChangedOn} and the fall hasn't slowed.`,
        'It may need to go higher.'],
      action: 'wizard',
    }),
  },

  '24.8': {
    state: null, title: 'No response at all — contradiction state, does not exist',
    needs: ['value', 'previousValue', 'previousWhen', 'doseChangedTo', 'doseChangedWhen'],
    contradictionState: true,
    render: (f) => ({
      headline: `${cap(f.parameter)} hasn't moved since your dose change`,
      support: [`${num(f.previousValue, f)} on the ${f.previousWhen}, ${num(f.value, f)} now.`,
        `You raised the dose to ${f.doseChangedTo} mL/day ${f.doseChangedWhen} and nothing has responded.`,
        'It may need to go higher.'],
      action: 'wizard',
    }),
    direction: 'raised',
  },

  '24.9': {
    state: 'emergency', title: 'Very low',
    needs: ['value'],
    surface: 'dashboard',           /* §24.9, decided 16 Aug, Stage 5c */
    direction: 'low',
    render: (f) => ({
      headline: `${cap(f.parameter)} is very low at ${q(f.value, f)}`,
      /* No mention of the safe floor — §15's rule that the app never says
       * "safe" out loud, applied to the figure behind the word. The escape
       * clause is deliberate (§23.5 as a courtesy). */
      support: ['This needs a correction unless you are deliberately holding it there.'],
      action: 'wizard',
    }),
  },

  '24.10': {
    state: 'correcting-dose', title: 'A correction running',
    needs: ['value', 'correctionStartValue', 'aimPoint', 'testAgainInDays'],
    direction: 'up',
    render: (f) => ({
      headline: 'Correction running',
      support: [`${cap(f.parameter)} is ${q(f.value, f)}, up from ${num(f.correctionStartValue, f)} when the correction started.`,
        /* "Heading for 8.5" is the aim point (§15), stated as a level. */
        `Heading for ${num(f.aimPoint, f)}.`,
        `Test again in ${word(f.testAgainInDays)} days.`],
      action: null,
    }),
  },

  '24.11': {
    state: 'correction-stalled', title: 'A correction that is not working',
    needs: ['value', 'correctionStartedDaysAgo'],
    render: (f) => ({
      headline: 'The correction isn\'t working',
      /* §23.5: no speculation about why. "The temptation here is strongest and
       * the card resists it: it states the two numbers and the elapsed time,
       * and stops." */
      support: [`${cap(f.parameter)} is ${q(f.value, f)}, the same as when the correction started ${word(f.correctionStartedDaysAgo)} days ago.`],
      action: null,
    }),
  },

  '24.12': {
    state: 'blocked', title: 'Figures cannot be trusted',
    needs: [],
    render: (f) => ({
      headline: `${cap(f.parameter)} figures can't be trusted`,
      support: ['The numbers imply a solution strength far from what\'s in Setup.',
        'Check the strength before using any dose figure here.'],
      action: 'setup',
    }),
  },

  '24.13': {
    state: 'correction-done', title: 'A correction has arrived — first reading inside',
    needs: ['value', 'correctionDirection'],
    /* The one card canon makes direction-aware in terms: "A correction that
     * pushed upward risks continuing upward, so it says rising; a downward
     * correction says falling." */
    render: (f) => ({
      headline: `${cap(f.parameter)} has reached ${q(f.value, f)}`,
      support: ['Back in your range.',
        `One more reading will confirm it's holding — it may still be ${f.correctionDirection === 'down' ? 'falling' : 'rising'}.`],
      action: null,
    }),
  },

  '24.14': {
    state: 'correction-done', title: 'A correction has finished — second reading confirms',
    needs: ['value', 'dose'],
    render: (f) => ({
      headline: 'Correction finished',
      support: [`${cap(f.parameter)} is holding at ${q(f.value, f)}, in your range.`,
        /* §23.3's first case — the dose has just changed back. */
        `Your dose is back to ${f.dose} mL/day.`],
      action: null,
    }),
  },

  '24.15': {
    state: 'correction-due', title: 'A correction is due a reading',
    needs: ['expectedDays'],
    render: (f) => ({
      headline: 'Time to test',
      support: [`The ${f.parameter} correction has run its expected ${word(f.expectedDays)} days.`,
        'A reading today will show where it got to.'],
      action: null,
    }),
  },

  '24.16': {
    state: 'correction-stalled', title: 'A correction has overrun',
    needs: ['elapsedDays', 'expectedDays'],
    render: (f) => ({
      headline: 'The correction has run longer than expected',
      /* It does not say the correction failed: with no reading since it started
       * nothing is known about where the level got to. */
      support: [`${Word(f.elapsedDays)} days have passed with no readings on what should have been a ${word(f.expectedDays)}-day plan.`,
        'A reading today will show where it got to.'],
      action: null,
    }),
  },

  '24.17': {
    state: 'recovering', title: 'Out of range and coming back',
    needs: ['value', 'previousValue', 'readingCount'],
    direction: 'below',
    /* §23.6: only when no dose change is in play. With a recent change this
     * situation is 24.6 instead. */
    render: (f) => ({
      headline: `${cap(f.parameter)} is below your range but coming back`,
      support: [`${q(f.value, f)}, up from ${num(f.previousValue, f)} over the last ${word(f.readingCount)} readings.`],
      action: null,
    }),
  },

  '24.18': {
    state: 'worsening', title: 'Out of range and still going',
    needs: ['value', 'previousValue', 'readingCount'],
    direction: 'below',
    render: (f) => ({
      headline: `${cap(f.parameter)} is below your range and still falling`,
      support: [`${q(f.value, f)}, down from ${num(f.previousValue, f)} over the last ${word(f.readingCount)} readings.`],
      action: null,
    }),
  },

  '24.19': {
    state: 'fell-short', title: 'The change helped, but not enough',
    needs: ['value', 'previousValue', 'matchingDose'],
    direction: 'below',
    render: (f) => ({
      headline: 'The change helped but hasn\'t gone far enough',
      support: [`${cap(f.parameter)} is ${q(f.value, f)}, up from ${num(f.previousValue, f)}, still below your range.`,
        `${f.matchingDose} mL/day would match what the tank is using.`],
      action: 'wizard',
    }),
  },

  '24.20': {
    state: 'overshot', title: 'The change went too far',
    needs: ['value', 'previousValue', 'matchingDose'],
    direction: 'above',
    render: (f) => ({
      headline: 'The change went further than needed',
      /* Note what is not offered: the level is above the range and the card
       * still recommends only the consumption-matching figure. Walking it back
       * down is a return plan and is not available here — §28.2, the level is
       * not steady yet. */
      support: [`${cap(f.parameter)} is ${q(f.value, f)}, up from ${num(f.previousValue, f)}, now above your range.`,
        `${f.matchingDose} mL/day would match what the tank is using.`],
      action: 'wizard',
    }),
  },

  '24.21': {
    state: null, title: 'One reading in — not enough to say — contradiction state, does not exist',
    needs: ['value'],
    contradictionState: true,
    render: (f) => ({
      headline: 'You have logged one reading since your dose change',
      /* States the position, because the position is known, and declines the
       * direction, because one reading is not a direction. */
      support: [`${cap(f.parameter)} is ${q(f.value, f)}.`,
        'One more will show whether the change is working.'],
      action: null,
    }),
  },

  '24.22': {
    state: null, title: 'Still rising despite the change — contradiction state, does not exist',
    needs: ['value', 'previousValue', 'previousWhen', 'doseChangedTo', 'doseChangedOn'],
    contradictionState: true,
    direction: 'rising',
    render: (f) => ({
      headline: `${cap(f.parameter)} is still rising despite your dose change`,
      support: [`${q(f.value, f)} now, up from ${num(f.previousValue, f)} ${f.previousWhen}.`,
        `You lowered the dose to ${f.doseChangedTo} mL/day on the ${f.doseChangedOn} and the rise hasn't slowed.`,
        'It may need to come down further.'],
      action: 'wizard',
    }),
  },

  '24.23': {
    state: null, title: 'Far out, beyond what the daily dose can reach',
    needs: ['value', 'aimPoint', 'planDays'],
    surface: 'wizard',              /* §24.23, decided 16 Aug, Stage 5c */
    direction: 'low',
    render: (f) => ({
      headline: `${cap(f.parameter)} is very low at ${q(f.value, f)}`,
      /* No alternative product is named — §9 as amended: the constraint is the
       * rate, not the product. The duration is not a warning; it is what it
       * takes. */
      support: [`Bringing it to ${num(f.aimPoint, f)} would take about ${word(f.planDays)} days at a safe rate.`],
      action: 'return-plan',
      offer: `${RETURN_PLAN} ${q(f.aimPoint, f)}`,
    }),
  },

  '24.24': {
    state: 'idle', title: 'Rising faster than the dose accounts for',
    needs: ['value', 'previousValue', 'previousWhen', 'testAgainInDays'],
    direction: 'rising',
    render: (f) => ({
      headline: `${cap(f.parameter)} is rising faster than your dose accounts for`,
      /* §23.5 and reef-chemistry.md §24: names no cause. A logged correction
       * suppresses this card entirely rather than changing its wording. */
      support: [`${q(f.value, f)}, up from ${num(f.previousValue, f)} ${f.previousWhen}.`,
        'The dose is unchanged.',
        `Test again in ${word(f.testAgainInDays)} days.`],
      action: null,
    }),
  },

  '24.25': {
    state: 'due', title: 'A staged plan is due a reading',
    needs: ['doseChangedWhen'],
    render: (f) => ({
      /* Shares 24.15's headline and is a card of its own: 24.15 is a
       * correction and asks where it got to; this is a dose change and asks
       * whether it worked. */
      headline: 'Time to test',
      support: [`You changed the ${f.parameter} dose ${f.doseChangedWhen}.`,
        'A reading today will show whether it worked.'],
      /* No dose figure, though §23.3 would permit one — "§23.3 is a limit on
       * where a figure may appear, not an instruction to print one wherever it
       * may." */
      action: null,
    }),
  },

  '24.26': {
    state: 'settling', title: 'Tested, and still too close to call',
    needs: ['value', 'readingsSinceChange'],
    render: (f) => ({
      headline: 'Still too close to call',
      support: [`${cap(f.parameter)} is ${q(f.value, f)} after ${word(f.readingsSinceChange)} readings since your dose change.`,
        'One more will show which way it\'s going.'],
      action: null,
    }),
  },

  '24.27': {
    state: 'worked', title: 'The change worked, and the level is settled out of range',
    needs: ['value', 'aimPoint'],
    tone: 'grey',                   /* §3's tone for route 12 — the one `worked` route that is not teal */
    direction: 'below',
    render: (f) => ({
      /* §23.7 keeps the parameter: "The change worked" stands alone, "but is
       * settled below your range" does not, and the two clauses are one
       * sentence. */
      headline: `The change worked, but ${f.parameter} is settled below your range`,
      support: [`${q(f.value, f)}, holding steady since the change.`,
        'Your dose is now matching what the tank uses.'],
      action: 'return-plan',
      offer: `${RETURN_PLAN} ${q(f.aimPoint, f)}`,
    }),
  },
};

export const CARD_IDS = Object.keys(CARDS);

/* The two cards canon places on a named surface — §24.9 and §24.23, decided
 * 16 August, Stage 5c. Every other card is placed by the surface that asks for
 * it. A surface rendering both of these is a finding: with a placement rule
 * they cannot collide, which is what deleted `narrative-engine.js:457-459`. */
export const CARD_SURFACE = { '24.9': 'dashboard', '24.23': 'wizard' };

/* §24.3's rule: "the offer appears on exactly the states that satisfy §28.2 —
 * stable and out of band — and those are branch 21c (`off-target`, 24.3) and
 * route 12 (`worked`, 24.27). A fourth card acquiring it is a finding." 24.23
 * is the third and the known exception, carried open at §25.6 item 7. */
export const RETURN_PLAN_CARDS = ['24.3', '24.27'];
export const RETURN_PLAN_EXCEPTION = '24.23';

/* ------------------------------------------------------------ rendering ---- */

/**
 * Render one card. The card id is decided by the wizard (§11's single-source
 * rule); this layer never picks one.
 *
 * A missing fact produces a **refusal that names it** (§14) rather than a
 * sentence with a hole in it — the same shape `classifyReading` uses.
 *
 * @param {string} id     a key of CARDS, e.g. '24.2'
 * @param {object} facts  the figures the card needs, plus `parameter`
 * @returns {object} `{ id, parameter, headline, support, action, offer, tone,
 *                      surface, refusals }`
 */
export function renderCard(id, facts) {
  const card = CARDS[id];
  const f = facts || {};
  const refusals = [];
  const blank = {
    id, parameter: f.parameter ?? null, headline: null, support: [], action: null,
    offer: null, tone: card?.tone ?? null, surface: CARD_SURFACE[id] ?? null, refusals,
  };

  if (!card) {
    refusals.push({ code: 'no-such-card', missing: `${id} is not one of §24's twenty-seven` });
    return blank;
  }
  if (!f.parameter || !(f.parameter in UNITS)) {
    refusals.push({ code: 'no-parameter', missing: 'a parameter — §23.7 assumes the badge, and §23.4 needs the unit' });
    return blank;
  }

  const missing = card.needs.filter((k) => {
    if (k === 'range') return !f.range || !isNum(f.range.min) || !isNum(f.range.max);
    return f[k] == null || (typeof f[k] === 'number' && !Number.isFinite(f[k]));
  });
  if (missing.length) {
    refusals.push({ code: 'missing-figures', missing: missing.join(', ') });
    return blank;
  }

  /* Canon words most cards in one direction only. Rendering the mirror would
   * mean minting a sentence §24 does not carry, so the caller's direction is
   * checked against the card's and refused where they differ. 24.13 is the one
   * card canon makes direction-aware, and it handles its own. */
  if (card.direction && f.direction && f.direction !== card.direction) {
    refusals.push({
      code: 'no-canon-wording-for-direction',
      missing: `§24 words ${id} as "${card.direction}" only; canon carries no "${f.direction}" wording for it`,
    });
    return blank;
  }

  const out = card.render(f);
  return {
    id,
    parameter: f.parameter,
    headline: out.headline,
    support: out.support,
    action: out.action,
    offer: out.offer ?? null,
    tone: card.tone ?? null,
    surface: CARD_SURFACE[id] ?? null,
    refusals,
  };
}

/* -------------------------------------------------------- §25's surfaces ---- */

/**
 * §25.1's short form: "The summary shows the headline plus the first sentence
 * of the wizard's card. It is not a separate wording."
 *
 * Generated, never written — "the only arrangement in which two wordings cannot
 * drift apart, because there is only one wording." This function is that rule;
 * a literal in a summary's code path is a finding.
 */
export function summaryLine(rendered) {
  if (!rendered || rendered.headline == null) return null;
  return { headline: rendered.headline, first: rendered.support[0] ?? null, parameter: rendered.parameter };
}

/**
 * §25.3: the reading confirmation renders the card and adds no verdict of its
 * own. It is the same object, returned unchanged, so there is nothing for a
 * second opinion to be added to.
 */
export function confirmationFor(rendered) {
  return rendered;
}

/* §25.1's collapsed headline — three slots, each dropped when empty, generated
 * from the same verdicts the tiles render. "A dropped slot leaves nothing
 * behind — no 'and nothing else', no placeholder clause."
 *
 * Worst is §25.1's two-key sort: alert tier first, then furthest out as a
 * fraction of its own band. That is a **ranking key and not a margin**
 * (`reef-chemistry.md` §27 rule 3 is untouched), and ties break on §25.1's
 * fixed parameter order — one order, one reason, shared with the notice list. */
export const FIXED_PARAMETER_ORDER = [
  'alkalinity', 'calcium', 'magnesium', 'salinity', 'nitrate', 'phosphate', 'potassium', 'ammonia',
];
export const PARAMETER_SORT_ORDER = [...FIXED_PARAMETER_ORDER, 'ph'];

const ALERT_BANDS = ['alert-low', 'alert-high'];
const OUT_BANDS = ['out-of-band-low', 'out-of-band-high'];

function fractionOut(v) {
  const r = v?.range;
  if (!r || !isNum(r.min) || !isNum(r.max) || !isNum(v.value)) return 0;
  const width = r.max - r.min;
  if (!(width > 0)) return 0;
  const past = v.value < r.min ? r.min - v.value : v.value > r.max ? v.value - r.max : 0;
  return past / width;
}

/* "A and B and C" reads like a child's sentence; a list joins properly. */
function joinNames(names) {
  if (names.length <= 1) return names[0] ?? '';
  if (names.length === 2) return `${names[0]} and ${names[1]}`;
  return `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`;
}

function worstFirst(a, b) {
  const tier = (v) => (ALERT_BANDS.includes(v.band) ? 0 : 1);
  const t = tier(a) - tier(b);
  if (t !== 0) return t;
  const d = fractionOut(b) - fractionOut(a);
  if (Math.abs(d) > 1e-12) return d;
  return PARAMETER_SORT_ORDER.indexOf(a.parameter) - PARAMETER_SORT_ORDER.indexOf(b.parameter);
}

/**
 * @param {object} input
 * @param {Array} input.verdicts  `[{ parameter, band, value, range, moving }]`
 * @param {boolean} [input.inFlight] something is settling — slot 3
 * @returns {string|null} the headline, or null for a tank with nothing to say
 */
export function collapsedHeadline(input) {
  const verdicts = (input?.verdicts || []).filter((v) => v && v.parameter);
  const outOfRange = verdicts
    .filter((v) => ALERT_BANDS.includes(v.band) || OUT_BANDS.includes(v.band))
    .sort(worstFirst);

  const clauses = [];

  /* Slots 1 and 2's out-of-range half are composed as **one list**, not two
   * clauses. §25.1's slot table reads as two — slot 1 "the worst parameter",
   * slot 2 "the remaining out-of-range parameters under the naming rule" — but
   * its naming rule is stated over the whole set ("one, two or three parameters
   * out of range: each is named ... four or more: the worst two are named,
   * followed by 'several others'"), and composing it as two clauses repeats the
   * predicate: *"Alkalinity is out of range, and calcium and magnesium are out
   * of range."* Canon's only worked example has nothing out of range but the
   * one, so it never shows which reading is meant. **One list is taken**,
   * because it reproduces that example exactly and the two-clause reading does
   * not survive its own second parameter. Reported at
   * `.agent/stage-6c-gaps.md` C-1. */
  const named = outOfRange.length >= 4 ? outOfRange.slice(0, 2) : outOfRange;
  if (outOfRange.length) {
    const names = named.map((v) => v.parameter);
    const list = outOfRange.length >= 4
      ? `${names.join(', ')} and several others`
      : joinNames(names);
    clauses.push(`${cap(list)} ${outOfRange.length > 1 ? 'are' : 'is'} out of range`);
  }

  /* Slot 2's other half — parameters that are **moving**, which is §11's word
   * and §11's rule, "not `drifting` or `unsettled`" (§13). Canon's worked
   * example names none of four and says "several others are moving", so the
   * same count rule applies and nothing is named past three. */
  const moving = verdicts.filter((v) => v.moving && !outOfRange.includes(v))
    .sort((a, b) => PARAMETER_SORT_ORDER.indexOf(a.parameter) - PARAMETER_SORT_ORDER.indexOf(b.parameter));
  if (moving.length) {
    const names = moving.map((v) => v.parameter);
    const text = moving.length > 3 ? 'several others' : joinNames(names);
    clauses.push(`${clauses.length ? text : cap(text)} ${moving.length > 1 ? 'are' : 'is'} moving`);
  }

  if (!clauses.length && !input?.inFlight) return null;

  let text = clauses.join(', and ');
  /* Slot 3 — anything in flight. Canon's own example separates it with a dash. */
  if (input?.inFlight) {
    text = text ? `${text} — a dose change is still settling` : 'A dose change is still settling';
  }
  return `${text}.`;
}
