import { describe, expect, it } from 'vitest'
import { planRenewalFactsFor } from '@/data/membership/membershipScorecardFixtures'
import { renewalFromPlanFacts } from '@/components/membership/membershipRenewalState'
import {
  CANCEL_REASONS,
  cancelOffersFor,
  discountedPrice,
  pauseRenewalOn,
  pauseResumeOn,
  pauseTermsFor,
} from '@/data/membership/cancelOffersFixtures'
import type { Brand } from '@/context/AccountContext'

/**
 * Guards for the cancellation flow's offer set.
 *
 * The reason this file exists: the first wiring of the plan-fixture fallback
 * parsed `membershipPlanFor(...).renewsOn`, which is display-formatted
 * ("Nov 3, 2026"). The mm/dd/yyyy regex never matched, so the helper returned
 * `null`, so `cancelOffersFor` returned `[]`, so the flow silently opened past
 * the offers step with NO retention alternatives at all — and nothing threw.
 * A failed parse that degrades to "show the learner nothing" is precisely the
 * failure a type checker can't see, so it gets a test.
 */

const ELITE_PASSPORT = 'Passport'
const ELITE_LITE = 'Passport Lite'

describe('planRenewalFactsFor — the presentation-string trap', () => {
  it('returns the RAW mm/dd/yyyy date, not the formatted one', () => {
    // If this ever starts returning "Nov 3, 2026" the offer set silently
    // empties. Assert the shape a parser can actually consume.
    const facts = planRenewalFactsFor('elite')
    expect(facts.renewsOn).toMatch(/^\d{2}\/\d{2}\/\d{4}$/)
  })

  it('is parseable into a renewal for every brand that authors a date', () => {
    const brands: Brand[] = ['elite', 'fitzgerald', 'cre', 'mckissock']
    for (const brand of brands) {
      const renewal = renewalFromPlanFacts(planRenewalFactsFor(brand))
      expect(renewal, `${brand} should resolve a renewal`).not.toBeNull()
      expect(renewal!.endsOn).toMatch(/^\d{4}-\d{2}-\d{2}$/)
      expect(renewal!.price).toBeGreaterThan(0)
    }
  })

  it('degrades to null for a brand with no authored renewal date', () => {
    // STC is the new-user degrade fixture — no expiry. Inventing a date would be
    // worse than saying less.
    expect(renewalFromPlanFacts(planRenewalFactsFor('stc'))).toBeNull()
  })

  it('never reads an unset autoRenew as ON — the one billing-consequence failure', () => {
    // REWRITTEN 2026-08-31. This asserted unset ⇒ `'unavailable'`, a value that
    // no longer exists (collapsed to `'on' | 'off'` once nothing forked on
    // capability). The PROPERTY it protected is unchanged and is what matters:
    // only `'on'` produces the auto-renews copy and its charge disclosure, so an
    // unconfirmed setting must never land there. McKissock deliberately leaves
    // it unset; asserting an auto-charge that may not happen is the one failure
    // here with a billing consequence.
    expect(renewalFromPlanFacts(planRenewalFactsFor('mckissock'))!.autoRenew).not.toBe('on')
    expect(renewalFromPlanFacts(planRenewalFactsFor('mckissock'))!.autoRenew).toBe('off')
    // And a fixture that DOES confirm it still reads as on.
    expect(renewalFromPlanFacts(planRenewalFactsFor('elite'))!.autoRenew).toBe('on')
  })
})

describe('cancelOffersFor', () => {
  const eliteRenewal = renewalFromPlanFacts(planRenewalFactsFor('elite'))!

  // The discounted-renewal arm was removed on 2026-08-25, so the retention set
  // is pause + downgrade. The exit is no longer counted here at all — it stopped
  // being an offer and became a peer CARD in the flow's grid, which is a
  // rendering concern, not something cancelOffersFor knows about. So "two
  // offers" on screen reads as three columns.
  it('offers two to a member on the top tier', () => {
    // CRE, not Elite: Elite's plan fixture prices Passport at Passport LITE's
    // $48, so its downgrade saves nothing and is correctly hidden (see the
    // zero-saving test below). CRE runs $99 → $49, a real ladder.
    const offers = cancelOffersFor({
      brand: 'cre',
      tierLabel: 'Premier Member',
      renewal: renewalFromPlanFacts(planRenewalFactsFor('cre'))!,
    })
    // Downgrade leads as of 2026-08-25 (requested). Asserting the ORDER, not
    // just the set: it is a deliberate ranking now, so a silent reshuffle
    // should fail rather than pass.
    expect(offers.map((o) => o.kind)).toEqual(['downgrade', 'pause'])
    // …and the ranking is carried in the data, not guessed at render time.
    expect(offers.map((o) => o.emphasis)).toEqual(['primary', 'secondary'])
  })

  it('never offers a discounted renewal', () => {
    // Guards the removal specifically: the `discount` kind, DISCOUNT_PCT and
    // discountedPrice() are all still in the module, so re-adding the builder
    // block is a one-paste mistake away.
    for (const tierLabel of [ELITE_PASSPORT, ELITE_LITE]) {
      const offers = cancelOffersFor({ brand: 'elite', tierLabel, renewal: eliteRenewal })
      expect(offers.some((o) => o.kind === 'discount')).toBe(false)
    }
  })

  it('drops the downgrade for a member already on the lowest tier', () => {
    // Rule 3 — an offer that can't be honoured is not shown at all. NOT
    // rendered disabled, which would advertise something unavailable.
    const offers = cancelOffersFor({ brand: 'elite', tierLabel: ELITE_LITE, renewal: eliteRenewal })
    expect(offers.map((o) => o.kind)).toEqual(['pause'])
  })

  it('drops the downgrade for a brand with no tier ladder', () => {
    // STC has one member tier, so there is nothing to move down to.
    const offers = cancelOffersFor({
      brand: 'stc',
      tierLabel: 'Member',
      renewal: { autoRenew: 'on', endsOn: '2026-11-03', price: 99 },
    })
    expect(offers.map((o) => o.kind)).toEqual(['pause'])
  })

  it('returns nothing when there is no renewal to build an offer from', () => {
    // The flow reads this as "skip the offers step" rather than rendering an
    // empty alternatives screen.
    expect(cancelOffersFor({ brand: 'elite', tierLabel: ELITE_PASSPORT, renewal: null })).toEqual([])
  })

  it('never marks an offer as recommended or preselected', () => {
    // The guidance forbids a preselected retention option. There is deliberately
    // no field on CancelOffer that could express one — this asserts the shape
    // stays that way.
    const offers = cancelOffersFor({
      brand: 'elite',
      tierLabel: ELITE_PASSPORT,
      renewal: eliteRenewal,
    })
    for (const offer of offers) {
      expect(Object.keys(offer)).not.toContain('recommended')
      expect(Object.keys(offer)).not.toContain('selected')
    }
  })

  it('states every future charge inline on every offer', () => {
    // Rule 2 — a term behind an expander is the trap the guidance names. The
    // separate "What this means" box was removed on 2026-08-25 and its content
    // folded into each blurb, so this now asserts against `blurb`: the ONLY
    // copy the card renders. The rule is that the learner sees the money fact
    // before accepting, not which field holds it — asserting the old `terms`
    // would pass on a string nothing displays.
    const offers = cancelOffersFor({
      brand: 'elite',
      tierLabel: ELITE_PASSPORT,
      renewal: eliteRenewal,
    })
    expect(offers.length).toBeGreaterThan(0)
    for (const offer of offers) {
      // Asserted against title + blurb, the offer's whole VISIBLE copy. Option C
      // (2026-08-25) deliberately moves the money fact into the title where the
      // title is a price — "Pay $48 instead of $84.99" — so pinning this to
      // `blurb` alone would fail a card that states the fact more prominently
      // than before. The rule is that the learner sees it, not where it sits.
      const copy = `${offer.title} ${offer.blurb}`.toLowerCase()
      expect(copy).toMatch(/charge|payment|pay |paid|\$/)
    }
  })

  it('hides a downgrade that would save nothing', () => {
    // Same rule as "no lower tier": an offer that cannot be honoured is not an
    // offer. Elite's plan fixture prices the membership at $48 — Passport
    // LITE's price — so a Passport member's saving computes to zero, and the
    // Option C title would render "Pay $48.00 instead of $48.00".
    const offers = cancelOffersFor({
      brand: 'elite',
      tierLabel: ELITE_PASSPORT,
      renewal: eliteRenewal,
    })
    expect(offers.some((o) => o.kind === 'downgrade')).toBe(false)
    // CRE prices its ladder properly ($99 → $49), so its downgrade still shows.
    const cre = cancelOffersFor({
      brand: 'cre',
      tierLabel: 'Premier Member',
      renewal: renewalFromPlanFacts(planRenewalFactsFor('cre'))!,
    })
    expect(cre.some((o) => o.kind === 'downgrade')).toBe(true)
  })

  it('names what a downgrade gives up, not only what it keeps', () => {
    const offers = cancelOffersFor({
      brand: 'cre',
      tierLabel: 'Premier Member',
      renewal: renewalFromPlanFacts(planRenewalFactsFor('cre'))!,
    })
    const down = offers.find((o) => o.kind === 'downgrade')!
    expect(down.blurb).toMatch(/give up/i)
    // The tier name leads the title (the price-as-title experiment was
    // reverted); the blurb carries the trade-off AND the comparison, so the
    // saving is legible without the title having to be a number.
    expect(down.title).toBe('Switch to Plus Member')
    expect(down.blurb).toMatch(/down from \$99\.00 a year/)
  })
})

describe('pause — term extension, not a billing holiday', () => {
  it('moves the renewal out by the pause length', () => {
    // The whole model: access pauses and the paid-through date moves by the same
    // months, so no money moves. Derived from endsOn, never authored beside it.
    expect(pauseRenewalOn(1, '2026-11-03')).toBe('2026-12-03')
    expect(pauseRenewalOn(2, '2026-11-03')).toBe('2027-01-03')
    expect(pauseRenewalOn(3, '2026-11-03')).toBe('2027-02-03')
  })

  it('resumes access at today + N months', () => {
    expect(pauseResumeOn(2, new Date(2026, 7, 25))).toBe('2026-10-25')
  })

  it('resolves both real dates into the terms before the learner commits', () => {
    const terms = pauseTermsFor(2, '2026-11-03', 99, new Date(2026, 7, 25))
    expect(terms).toContain('October 25, 2026') // access resumes
    expect(terms).toContain('January 3, 2027') // new renewal date
    expect(terms).toContain('$99.00')
    // It must NOT claim billing resumes at the end of the pause — that event
    // does not exist on a prepaid annual term, and saying so was the original
    // copy bug.
    expect(terms.toLowerCase()).not.toContain('billing restarts')
    expect(terms.toLowerCase()).not.toContain('billing resumes')
  })
})

describe('discount arithmetic', () => {
  it('is exactly 30% off, to the cent', () => {
    // 99.99 * 0.7 = 69.993 — must render 69.99, not 69.993.
    expect(discountedPrice(99.99)).toBe(69.99)
    expect(discountedPrice(99)).toBe(69.3)
    expect(discountedPrice(48)).toBe(33.6)
  })
})

describe('reason list', () => {
  it('offers between four and six choices', () => {
    // The guidance says 4–6. More becomes a survey; fewer stops covering the
    // real reasons.
    expect(CANCEL_REASONS.length).toBeGreaterThanOrEqual(4)
    expect(CANCEL_REASONS.length).toBeLessThanOrEqual(6)
  })

  it('ends with an escape hatch', () => {
    expect(CANCEL_REASONS[CANCEL_REASONS.length - 1]).toMatch(/something else/i)
  })
})
