/* Stage 6b — the notice model.
 *
 * THE-ENGINE-PLAN-v2.md Stage 6b, built alongside the existing findings layer.
 * Nothing calls it yet; the switchover is 6f. `buildFindings` and
 * `narrative-engine.js` are untouched, and the golden fingerprint does not move.
 *
 * Written from canon alone, per the plan's governing rule:
 *   wizard-states.md §20    one live notice per parameter; a new verdict
 *                           supersedes rather than joins; hiding is global;
 *                           everything hideable; serious confirms first
 *   wizard-states.md §25.1  the four tiers, the fixed parameter order,
 *                           proportional distance, hidden versus off, and
 *                           "a notice type is a parameter"
 *   wizard-states.md §25.4  the three kinds and no fourth
 *   wizard-states.md §13    the seven bands
 *   reef-chemistry.md §18   which parameters reach an alert tier
 *   reef-chemistry.md §32   ammonia — two states, detectable is an alert
 *   docs/journeys/journey-4-notifications.md — the account this came from
 *
 * REUSED, NOT REWRITTEN. `findingKey`, `findingSignature` and `findingHidden`
 * (`src/components/DoseExpectation.jsx:130-154`) already implement the identity
 * half, and journey 4 says so in terms: "Someone started building exactly this.
 * A key is identity; a signature is what would make a notice count as changed."
 * What is reused is the *mechanism* — a key for identity, a signature for
 * supersession, and hidden-only-while-the-signature-still-matches, including
 * its guard that a bare-date entry lapses rather than sticking forever. What is
 * not reused is the key's *content*: `findingKey` is `finding|<id>`, one notice
 * per finding **id**, and §20 requires one notice per **parameter**. Importing
 * it and keying on `f.id` would give a parameter as many live notices as rules
 * that fired, which is journey 4 problem 4 exactly. So the shape is theirs and
 * the topic is canon's.
 *
 * To be exact about why these are re-stated rather than imported: it is the
 * key's content and nothing else. `narrative-engine.js:1` already imports both
 * from that component, so the lib-importing-a-component layering is established
 * and is not the objection. `findingHidden`'s body is reproduced in `isHidden`
 * below unchanged, including its guard that a bare-date entry lapses rather
 * than sticking forever — that guard is the reused part that matters most, and
 * it is canon's resurfacing rule already working. 6f is where the old exports
 * go, and it is the right place to collapse the two back into one.
 *
 * This module mints no wording. §25.4: "a notice is that verdict rendered", and
 * §19 gives every sentence to the engine — the message layer is 6c.
 */

/* §25.1's fixed parameter order, verbatim. Eight, and the section says eight. */
export const FIXED_PARAMETER_ORDER = [
  'alkalinity', 'calcium', 'magnesium', 'salinity', 'nitrate', 'phosphate', 'potassium', 'ammonia',
];

/* pH sorts last. §25.1 derives this rather than deciding it — the order names
 * eight parameters and the app has nine, and pH produces notices (§31's *pH
 * high* and *CO2 signature*) despite having no alert tier, so last is the only
 * placement that adds nothing to what the decision states. Correcting it is a
 * one-line change here and to that bullet. It is deliberately NOT a ninth entry
 * in FIXED_PARAMETER_ORDER above, because the order still names eight. */
export const PARAMETER_SORT_ORDER = [...FIXED_PARAMETER_ORDER, 'ph'];

/* §13's two alert bands, and §32's detectable state, which is not a band —
 * §32.1 says §13 does not classify ammonia at all. */
const ALERT_BANDS = ['alert-low', 'alert-high'];
const OUT_BANDS = ['out-of-band-low', 'out-of-band-high'];

const KINDS = ['verdict', 'suspect-reading', 'relationship'];

const isNum = (v) => typeof v === 'number' && Number.isFinite(v);

/* ------------------------------------------------------------- identity ---- */

/**
 * The stable identity of a notice. §20: one live notice **per parameter** — so
 * the parameter is the topic, which is journey 4's open question 1 answered by
 * canon rather than by this module.
 *
 * A relationship notice (§25.4 kind 3) "genuinely belongs to no single
 * parameter", so it keys on its own id and cannot collide with a parameter's.
 */
export function noticeKey(notice) {
  if (!notice) return null;
  if (notice.kind === 'relationship') return `notice|rel|${notice.id}`;
  return `notice|${notice.parameter}`;
}

/**
 * What has to hold for a hidden notice to stay hidden. §20: "A new verdict
 * supersedes the old notice rather than joining it", and §25.1: supersession
 * returns it to the live list automatically.
 *
 * The verdict is the band (or ammonia's state, §32.2) plus the reading it was
 * computed from — a worse number is a new verdict and comes straight back, which
 * is the property `findingSignature` buys by putting the value in the signature
 * for `act` findings. Here every kind carries it, because §20 admits no class of
 * notice that hides differently from the rest.
 */
export function noticeSignature(notice) {
  if (!notice) return null;
  const verdict = notice.band ?? notice.state ?? notice.kind ?? '';
  const value = isNum(notice.value) ? notice.value : '';
  return `${noticeKey(notice)}|${verdict}|${value}`;
}

/* --------------------------------------------------------------- hiding ---- */

/**
 * Is this notice currently hidden? §20's resurfacing rule: an entry stays hidden
 * only while the stored signature still equals the current one.
 *
 * A stored entry with no signature is the bare-date format `findingHidden`
 * already guards against, and it lapses rather than sticking forever — a hidden
 * entry with nothing to compare against would be the permanent silence §25.1
 * forbids.
 */
export function isHidden(notice, hiddenStore) {
  const entry = (hiddenStore || {})[noticeKey(notice)];
  if (entry == null) return false;
  const sig = entry && typeof entry === 'object' ? entry.sig : null;
  return sig != null && sig === noticeSignature(notice);
}

/** Hide one notice. Global by construction: one store, keyed by identity, with
 *  no surface dimension for a second opinion to live in (§20, journey 4 #1). */
export function hide(hiddenStore, notice) {
  const key = noticeKey(notice);
  if (key == null) return { ...(hiddenStore || {}) };
  return { ...(hiddenStore || {}), [key]: { sig: noticeSignature(notice), at: notice.at ?? null } };
}

/** Unhide one. §25.1: the hidden list is unhidden one at a time or all at once. */
export function unhide(hiddenStore, notice) {
  const next = { ...(hiddenStore || {}) };
  delete next[noticeKey(notice)];
  return next;
}

/** Unhide everything. */
export function unhideAll() {
  return {};
}

/**
 * §20: "Serious is the app's existing severity vocabulary and not a new
 * category: a finding of severity `act`, or a wizard state whose §3 tone is
 * red." That mapping is canon's own derivation and correctable in one line
 * there; this is that line.
 */
export function isSerious(notice) {
  if (!notice) return false;
  return notice.severity === 'act' || notice.tone === 'red';
}

/**
 * §20: serious notices get a confirmation before hiding — "a speed bump, not an
 * exception. It does not create a class of notice that cannot be hidden." So
 * this gates the prompt and never the outcome: `hide` above does not consult it.
 */
export function needsHideConfirmation(notice) {
  return isSerious(notice);
}

/* ------------------------------------------------------------------ off ---- */

/**
 * §25.1: a notice type is a **parameter**. One switch per parameter, and it
 * turns off everything that parameter would say — "not alert-low, not
 * alert-high, not a reading beyond §2's safe bounds, not §29.4's fixed
 * warnings, and not ammonia's detectable notice".
 *
 * A relationship notice belongs to no single parameter (§25.4 kind 3), and canon
 * does not say whether a parameter's switch reaches one that names it. It does
 * not, here — and `buildNoticeList` reports the gap rather than letting the
 * choice pass as settled.
 */
export function isOff(notice, offParameters) {
  if (!notice || notice.kind === 'relationship') return false;
  return (offParameters || []).includes(notice.parameter);
}

/* ----------------------------------------------------------- the tiers ---- */

/**
 * §25.1's four tiers, in its order: alerts, out of range, relationship notices,
 * then everything else.
 */
export function noticeTier(notice) {
  if (!notice) return 4;
  if (notice.kind === 'relationship') return 3;
  /* Ammonia is placed by its state, not a band: §32.1 says §13 does not
   * classify it, and §25.1 says a detectable reading "enters at tier 1". */
  if (notice.state === 'detectable') return 1;
  if (ALERT_BANDS.includes(notice.band)) return 1;
  if (OUT_BANDS.includes(notice.band)) return 2;
  return 4;
}

/**
 * §25.1: "the distance past the nearer edge of the user's target range, divided
 * by that range's width, furthest first."
 *
 * A ranking key and **not a margin** — `reef-chemistry.md` §27 rule 3 is
 * untouched by it, and §25.1 says so in terms for both the rules that sort on
 * this. Nothing may read this figure as a threshold.
 */
export function proportionalDistance(notice) {
  const range = notice?.range;
  if (!notice || !range || !isNum(range.min) || !isNum(range.max) || !isNum(notice.value)) return 0;
  const width = range.max - range.min;
  if (!(width > 0)) return 0;
  const past = notice.value < range.min ? range.min - notice.value
    : notice.value > range.max ? notice.value - range.max
      : 0;
  return past / width;
}

/* The earliest parameter a notice names, in the fixed order. For a relationship
 * notice this is §25.1's stated internal ordering for tier 3; for everything
 * else it is the parameter itself. An unknown parameter sorts after every known
 * one rather than throwing — a new parameter must not reorder the list it is
 * not in. */
function orderIndex(notice) {
  const names = notice?.kind === 'relationship'
    ? (notice.parameters || [])
    : [notice?.parameter];
  const indices = names
    .map((p) => PARAMETER_SORT_ORDER.indexOf(p))
    .filter((i) => i >= 0);
  return indices.length ? Math.min(...indices) : PARAMETER_SORT_ORDER.length;
}

/* The total order §25.1 requires: tier, then proportional distance within tiers
 * 1 and 2, then the fixed parameter order. Deterministic for any input order —
 * "a list whose order changes without the tank changing is a list a keeper
 * cannot learn." The final id comparison exists so two relationship notices
 * naming the same earliest parameter still sort deterministically; canon's
 * tier-3 rule stops at the parameter. */
function compare(a, b) {
  const tier = noticeTier(a) - noticeTier(b);
  if (tier !== 0) return tier;
  if (noticeTier(a) === 1 || noticeTier(a) === 2) {
    const d = proportionalDistance(b) - proportionalDistance(a);
    if (Math.abs(d) > 1e-12) return d;
  }
  const order = orderIndex(a) - orderIndex(b);
  if (order !== 0) return order;
  return String(a.id ?? '').localeCompare(String(b.id ?? ''));
}

/* ------------------------------------------------------- the built list ---- */

/**
 * The list a surface renders. Every surface renders this one (§19, §11's
 * single-source rule); none computes its own.
 *
 * @param {object} input
 * @param {Array}  input.notices  the engine's current notices — one verdict per
 *                                parameter, plus §25.4's other two kinds
 * @param {object} [input.hidden] the hidden store, key → `{ sig }`
 * @param {Array}  [input.off]    parameters switched off in Setup (§25.1)
 * @returns {object} `{ live, hidden, off, collisions, malformed, gaps }`
 */
export function buildNoticeList(input) {
  const { notices, hidden: hiddenStore, off: offParameters } = input || {};
  const gaps = new Set();
  let malformed = 0;

  const valid = (Array.isArray(notices) ? notices : []).filter((n) => {
    const ok = n && typeof n === 'object' && KINDS.includes(n.kind)
      && (n.kind === 'relationship' ? n.id != null : n.parameter != null);
    if (!ok) malformed += 1;
    return ok;
  });

  /* ---- off, first: §25.1's switch removes the parameter from the notices
   * entirely, so an off parameter reaches neither list. A parameter sitting in
   * the hidden list while switched off would be a notice that survived its own
   * switch. */
  const off = [];
  const remaining = [];
  for (const n of valid) {
    if (isOff(n, offParameters)) off.push(n);
    else remaining.push(n);
  }
  if ((offParameters || []).length && remaining.some((n) => n.kind === 'relationship'
    && (n.parameters || []).some((p) => (offParameters || []).includes(p)))) {
    /* §25.1 makes off per parameter; §25.4 kind 3 belongs to no single
     * parameter. Canon does not join the two up. Left live, and reported. */
    gaps.add('relationship-notice-vs-off');
  }

  /* ---- one live notice per parameter (§20). Where two share a key, canon does
   * not say which wins — §25.4's kind 2 "belongs to its parameter" and can
   * arrive beside kind 1's verdict for it. The caller's first is kept and the
   * collision is reported; inventing a precedence rule here would be this layer
   * deciding something §25.4 left open. */
  const collisions = [];
  const byKey = new Map();
  for (const n of remaining) {
    const key = noticeKey(n);
    if (byKey.has(key)) {
      const existing = collisions.find((c) => c.key === key);
      if (existing) existing.kinds.push(n.kind);
      else collisions.push({ key, parameter: n.parameter ?? null, kinds: [byKey.get(key).kind, n.kind] });
      continue;
    }
    byKey.set(key, n);
  }

  const live = [];
  const hidden = [];
  for (const n of byKey.values()) {
    if (isHidden(n, hiddenStore)) hidden.push(n);
    else live.push(n);
  }

  if (hidden.some((n) => n.kind === 'relationship' && (n.parameters || []).length > 1)) {
    /* §25.4: "whether hiding one hides it for both parameters it names is a
     * question about hiding rather than about placement" — G-26's second
     * question, open. Hidden as one notice, which is what §20 says a notice is;
     * reported so that is not read as the answer. */
    gaps.add('relationship-notice-hide-scope');
  }

  live.sort(compare);
  hidden.sort(compare);

  return { live, hidden, off, collisions, malformed, gaps: [...gaps] };
}
