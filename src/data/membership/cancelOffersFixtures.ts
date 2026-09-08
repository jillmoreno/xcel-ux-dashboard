import type { Brand, MembershipRenewal } from '@/context/AccountContext'
import { formatRenewalDate } from '@/components/membership/membershipRenewalState'

/**
 * Retention offers + reason list for the self-service cancellation flow.
 *
 * Source: "Self-Service Cancellation Best Practices" (a synthesis of Baymard
 * Institute guidance), and the option comparison at
 * `explorations/membership-cancellation/cancellation-flow-options.html`.
 *
 * The three rules from that doc which THIS file exists to enforce, because they
 * are content rules rather than layout rules and so cannot live in the
 * component:
 *
 *  1. AT MOST THREE OFFERS, AND THEY ARE PARALLEL. The flow shows every offer at
 *     once, so this returns a plain array with no ranking and no `recommended`
 *     flag. Nothing here says "pick this one" — the guidance is explicit that no
 *     retention option may be preselected.
 *  2. EVERY TERM IS INLINE. `terms` carries every future bill, billing-date
 *     change, and new commitment in plain words. The flow renders it always
 *     visible, never behind a "see terms" expander — the doc names hidden offer
 *     mechanics as the quickest way to turn a retention idea into a dark
 *     pattern. If you add an offer, its `terms` must answer: what am I charged,
 *     when, and what happens after that.
 *  3. AN OFFER THAT CANNOT BE HONOURED IS NOT SHOWN. `cancelOffersFor` drops a
 *     card rather than rendering it disabled or with vague copy — a brand with
 *     one member tier (STC) gets no downgrade card at all.
 *
 * ── The pause modelling problem, and why it reads the way it does ────────────
 * These are ANNUAL, PREPAID memberships. The first draft of the exploration said
 * "nothing is charged while you're paused, and billing resumes when the pause
 * ends" — copied from monthly-subscription pause flows. That is meaningless
 * here: the learner has already paid for the year and owes nothing until
 * `endsOn`, so "no charge while paused" concedes nothing, and "billing resumes"
 * names an event that does not exist.
 *
 * The only version that is true for a prepaid term is the one below: pause
 * SUSPENDS ACCESS and pushes the paid-through date out by the same number of
 * months, so the renewal moves with it and no money moves at all. Note what that
 * means commercially — it saves the learner nothing, so it is a much weaker
 * retention offer than pause is for a monthly service. If billing cannot extend
 * a term, this offer should be removed rather than reworded.
 *
 * TODO(product): confirm term extension is possible before this ships. Logged as
 * an open decision on the feature handoff.
 * TODO(data): prices, the downgrade's keeps/loses lists, and the discount
 * percentage are authored here. The subscription service will own all of them.
 */

export type CancelOfferKind = 'pause' | 'downgrade' | 'discount'

export type CancelOffer = {
  kind: CancelOfferKind
  /** Card title. */
  title: string
  /** Price shown beside the title, e.g. "$48 / year". Omitted when the offer
   *  costs nothing today (pause). */
  priceLabel?: string
  /** One or two sentences. A downgrade MUST name what is given up as well as
   *  what is kept — an offer that only lists gains is the sneaky kind. */
  blurb: string
  /** The always-visible terms block. See rule 2 above. For `pause` this is the
   *  pre-selection copy; once a length is chosen the flow replaces it with
   *  `pauseTermsFor`, which resolves the real dates. */
  terms: string
  /** CTA label. */
  cta: string
  /**
   * Button weight for the CTA. NOTE this is a RANKING, and the flow's own rule
   * 2 says no offer is ranked or flagged recommended — so it exists only
   * because it was asked for explicitly (2026-08-25): the downgrade leads the
   * row with a solid CTA and pause follows with an outlined one. Set every
   * offer to `primary` to return to unranked alternatives.
   */
  emphasis?: 'primary' | 'secondary'
  /** `pause` only — the selectable lengths, in months. */
  months?: number[]
}

/** Selectable pause lengths. Deliberately short: a pause long enough to cross a
 *  CE deadline is not a favour. UNUSED since 2026-08-25 — the picker was
 *  removed and the offer fixed at one month. Exported (rather than deleted) so
 *  it stays the one place the lengths are defined if the picker returns. */
export const PAUSE_MONTHS = [1, 2, 3]

/** The discount arm's reduction. One constant so the headline percentage and
 *  the computed price can never disagree. */
const DISCOUNT_PCT = 30

/** What the brand's lower tier is called, what it costs, and the honest
 *  trade — what a learner keeps and what they lose by moving down.
 *
 *  Keyed by brand and ABSENT where there is no lower tier to move to: STC has a
 *  single member tier today, so it has no downgrade offer and its flow shows two
 *  cards, not three. That absence is the point — see rule 3. */
const DOWNGRADE_BY_BRAND: Partial<
  Record<Brand, { tierLabel: string; price: number; priceLabel: string; keeps: string; loses: string }>
> = {
}

/** Money with cents, so a price never renders as "$69.993" or "$48". */
function money(n: number): string {
  return `$${n.toFixed(2)}`
}

/** Add whole months to an ISO `YYYY-MM-DD`, returning ISO. Parsed by hand —
 *  `new Date(iso)` is UTC and shifts the day for anyone west of Greenwich, the
 *  same trap `membershipRenewalState` documents. */
function addMonthsIso(iso: string, months: number): string {
  const [y, m, d] = iso.split('-').map(Number)
  const dt = new Date(y, m - 1 + months, d)
  const mm = String(dt.getMonth() + 1).padStart(2, '0')
  const dd = String(dt.getDate()).padStart(2, '0')
  return `${dt.getFullYear()}-${mm}-${dd}`
}

function isoOf(d: Date): string {
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${mm}-${dd}`
}

/** When access comes back: today + N months. */
export function pauseResumeOn(months: number, today = new Date()): string {
  return addMonthsIso(isoOf(today), months)
}

/** Where the renewal lands after a pause: the paid-through date + N months.
 *  Derived from `endsOn`, never authored separately — the whole point of the
 *  extension model is that these two move together. */
export function pauseRenewalOn(months: number, endsOn: string): string {
  return addMonthsIso(endsOn, months)
}

/**
 * The pause terms, resolved to real dates for a chosen length.
 *
 * Called the moment a length is selected, so the learner sees the actual new
 * billing date BEFORE committing. A billing-date change is exactly the term the
 * guidance says must be visible up front, and "the day your pause ends" is not
 * a date.
 */
export function pauseTermsFor(
  months: number,
  endsOn: string,
  price: number,
  today = new Date(),
): string {
  const resume = formatRenewalDate(pauseResumeOn(months, today))
  const renews = formatRenewalDate(pauseRenewalOn(months, endsOn))
  const charge = price > 0 ? money(price) : 'your renewal amount'
  return (
    `Access pauses today and comes back on ${resume}. Your paid-through date moves from ` +
    `${formatRenewalDate(endsOn)} to ${renews}, and your renewal moves with it — so your next ` +
    `charge of ${charge} falls on ${renews} instead. Nothing is charged today, and nothing is ` +
    `charged while you are paused. You can unpause early and the unused days go back on the end.`
  )
}

/** The discounted renewal price for a plan. */
export function discountedPrice(price: number): number {
  return Math.round(price * (1 - DISCOUNT_PCT / 100) * 100) / 100
}

/**
 * The offers to show a learner who has clicked Cancel membership.
 *
 * Returns between zero and three, in a fixed order (pause → downgrade →
 * discount) chosen so the least-committing option reads first. Order is NOT a
 * recommendation and the flow renders them as equals.
 *
 * An empty array is a legitimate result — a learner with no renewal record, or
 * an expired membership, has nothing to be offered, and the flow goes straight
 * to the review step rather than showing an empty "alternatives" screen.
 */
export function cancelOffersFor(args: {
  brand: Brand
  /** The member's current tier label, e.g. "Passport". Used only to suppress the
   *  downgrade card when they are already on the lower tier. */
  tierLabel?: string | null
  renewal: MembershipRenewal | null
}): CancelOffer[] {
  // No `today` here on purpose: every string this builds is derived from
  // `endsOn`, so the offer set is stable regardless of when it's read. Only the
  // pause TERMS depend on today, and those resolve later in `pauseTermsFor`.
  const { brand, tierLabel, renewal } = args
  if (!renewal) return []
  const offers: CancelOffer[] = []
  const { endsOn, price } = renewal

  // ── Downgrade. Only when the brand HAS a lower tier and the member isn't
  //    already on it. Rule 3: no card rather than a dead one.
  //    A downgrade that saves NOTHING is the same category of dead offer as one
  //    with no tier to move to, so the same rule applies: no card rather than a
  //    card that argues against itself. Elite/Fitzgerald hit this today —
  //    their plan fixture prices the membership at $48, which is Passport
  //    LITE's price, so a Passport member's "saving" computes to zero. Under
  //    the old copy that surfaced as "$0.00 less a year" buried in a
  //    paragraph; under Option C the card's TITLE reads "Pay $48.00 instead of
  //    $48.00", which is why the guard is here and not merely a TODO.
  //    TODO(data): make the plan price tier-aware ($84.99 Passport / $48 Lite,
  //    per explorePlansFixtures) and Elite's downgrade returns on its own.
  const down = DOWNGRADE_BY_BRAND[brand]
  if (down && tierLabel !== down.tierLabel && price > down.price) {
    offers.push({
      kind: 'downgrade',
      // The TIER NAME leads. Option C briefly made the title the price ("Pay
      // $49.00 instead of $99.00") on the theory that a price change is the
      // outcome — reverted 2026-08-25, because the plan is what a learner
      // recognises, and a card titled with a number gives them nothing to
      // match against the membership they hold.
      title: `Switch to ${down.tierLabel}`,
      // Rendered beside the title, so the new rate is scannable without reading
      // the blurb. The accepted step's Billing line reads the same field.
      priceLabel: down.priceLabel,
      // Carries the trade-off and the COMPARISON. "down from {old}" rather than
      // "{new} instead of {old}" on purpose: the new price is already in the
      // chip above, and repeating it is what a shorter card is trying to avoid.
      blurb:
        `Keep ${down.keeps}. You'd give up ${down.loses}. Takes effect ` +
        `${formatRenewalDate(endsOn)}, down from ${money(price)} a year.`,
      terms: '',
      cta: 'Change Plan',
      emphasis: 'primary',
    })
  }

  // ── Pause. Term extension, not a billing holiday — see the header note.
  //
  //    FIXED at one month since 2026-08-25. It was a 1/2/3-month picker that
  //    started unchosen with its CTA disabled (so no length was preselected);
  //    the lengths and the disabled state are gone, and the blurb now carries
  //    the terms that used to sit in a separate "What this means" box. The
  //    material fact still has to be IN the copy — the paid-through date moving
  //    is the term that must not surprise anyone — so it is stated here rather
  //    than dropped with the box. PAUSE_MONTHS and pauseTermsFor() are intact
  //    if the picker comes back.
  offers.push({
    kind: 'pause',
    // Option C (2026-08-25): the TITLE carries the outcome, the body carries the
    // consequence. "Pause for one month" named the mechanism; this names what
    // the learner gets. The mechanism survives on the CTA.
    title: 'Take a month off, keep the time',
    // "your next payment" rather than "your paid-through date" — the latter is
    // billing-system vocabulary. Naming the payment is also what keeps the
    // money fact visible, which is the rule this copy has to survive.
    blurb:
      `Access stops until ${formatRenewalDate(pauseResumeOn(1, new Date()))}. Your end date — and ` +
      `your next payment — move to ${formatRenewalDate(pauseRenewalOn(1, endsOn))}.`,
    terms: '',
    cta: 'Pause Plan',
    emphasis: 'secondary',
  })

  // ── The discounted-renewal arm was REMOVED on 2026-08-25. The `discount`
  //    kind, DISCOUNT_PCT and discountedPrice() are all intact, so restoring it
  //    is re-adding this block — but note the exit is now a peer card in the
  //    offers row, so a third retention offer would put the row at four columns
  //    and squeeze every card.
  //
  //    if (price > 0) { … kind: 'discount', `Renew at ${DISCOUNT_PCT}% off` … }

  return offers
}

/**
 * Why-did-you-cancel choices.
 *
 * Six, per the guidance's "4–6 choices", and asked only AFTER the cancellation
 * is confirmed — the doc is explicit that a required reason reads as an
 * eligibility test for whether you will be allowed to leave. The flow renders
 * these as optional with a visible way to decline.
 *
 * Written as reasons a learner would recognise about CE specifically, not
 * generic churn buckets, because the answers are only useful if they name
 * something the team could act on.
 */
/** Four, not six. Trimmed 2026-08-25: "I have finished the CE I needed this
 *  cycle" and "The content does not match my license or state" were removed —
 *  the first is really a timing case rather than a complaint, and the second is
 *  narrow enough that "Something else" plus the free-text box catches it. This
 *  is an OPTIONAL question asked after the cancellation is already confirmed,
 *  so a short list that gets answered beats a complete one that gets skipped. */
export const CANCEL_REASONS: string[] = [
  'It costs more than I want to spend',
  'I was not using it enough',
  'I get what I need somewhere else',
  'Something else',
]

/** What survives a cancellation. Deliberately the SAME sentence the Expired
 *  membership card and the cancellation flow use — the answer to "what do I
 *  lose" must not depend on which surface a learner happens to read it on.
 *  Shortened 2026-08-25 for scannability. Kept as ONE constant rather than a
 *  short version here and a long one elsewhere — the Expired card and the
 *  cancellation flow both state it, and "what survives" must not depend on
 *  which surface you happen to read. */
export const CANCEL_RECORD_STAYS =
  'Certificates and progress stay yours; you can still buy courses.'
