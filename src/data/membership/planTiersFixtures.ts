import type { Brand } from '@/context/AccountContext'

/**
 * Plan tier content rendered by the non-member `<PlanTierStrip>` on
 * the /membership landing page. Three tiers per brand — Standard,
 * Premium (featured), Brokerage — with per-tier price, feature
 * checklist, and CTA. CRE default matches the exploration HTML at
 * `explorations/membership-landing/membership-landing.html`; the
 * other three brands ride on the same tier shape with their own
 * pricing / wording.
 *
 * TODO(data): swap this for a `/api/plans?brand=…` selector once the
 * commerce service publishes a canonical pricing endpoint. Keep the
 * shape additive — adding fields here shouldn't break the strip.
 */
export type PlanTier = {
  id: 'standard' | 'premium' | 'brokerage'
  name: string
  /** Display price string — `$29` or `Custom`. Cadence ("/month")
   *  sits in `cadence` so the typography can stack large + small. */
  price: string
  /** Optional cadence suffix. Omitted when price is "Custom". */
  cadence?: string
  features: string[]
  ctaLabel: string
  ctaTo: string
  /** Renders the "Most popular" ribbon + accent border / shadow. Only
   *  one tier per brand should set this. */
  featured?: boolean
}


const PREMIUM_BASE: Omit<PlanTier, 'price' | 'cadence'> = {
  id: 'premium',
  name: 'Premium',
  features: [
    'Unlimited CE for all states',
    'Full Resource Library + Paths',
    'Post in Course Forums (instructor-moderated)',
    'Post + comment in the Community',
    'Quarterly live broker workshops',
  ],
  ctaLabel: 'Choose Premium',
  ctaTo: '/membership/plans',
  featured: true,
}

const BROKERAGE_BASE: Omit<PlanTier, 'price' | 'cadence'> = {
  id: 'brokerage',
  name: 'Brokerage',
  features: [
    'Everything in Premium',
    'Team analytics + compliance reporting',
    'Private forum for your office',
    'Dedicated CSM',
  ],
  ctaLabel: 'Talk to sales',
  // TODO(routes): swap for a `/contact-sales` destination once that
  // page exists. /membership/plans is the safe placeholder for now.
  ctaTo: '/membership/plans',
}

const PLANS_BY_BRAND: Record<Brand, PlanTier[]> = {
  // XCEL sells transactional course packages, not membership tiers — the plan
  // strip has nothing to show and self-hides on an empty list.
  xcel: [],
}

export function planTiersFor(brand: Brand): PlanTier[] {
  return PLANS_BY_BRAND[brand]
}
