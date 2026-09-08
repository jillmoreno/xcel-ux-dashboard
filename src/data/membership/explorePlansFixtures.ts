import type { Brand } from '@/context/AccountContext'

/**
 * Non-member "Explore Membership" plan cards for the Dashboard Rebrand shell
 * — the Elite Nursing Passport Lite vs. Passport CE Membership comparison,
 * matching the marketing pricing card (1-year terms, sale + list price, promo
 * code, per-card included-feature checklists, "Most Popular" on the full
 * Passport). Distinct from the shared `passportTiersFixtures` /
 * `PassportPlanComparison` used by the standalone `/membership` Benefits tab —
 * this fuller dataset is rebrand-scoped so that page stays unchanged.
 *
 * Elite-only; other brands return `[]` and the cards self-hide.
 *
 * TODO(data): swap for the real commerce plans endpoint. TODO(pricing): the
 * promo (`JUNECE`) + sale price are a seasonal example — refresh per campaign.
 */
export type ExplorePlan = {
  id: 'passport-lite' | 'passport'
  /** Full marketing name, e.g. "Elite Nursing Passport CE Membership". */
  name: string
  /** Short name for the comparison table header ("Passport Lite"). */
  shortName: string
  /** One-line value line shown on the card (the per-feature breakdown lives in
   *  the comparison table below the cards). */
  tagline: string
  /** Term label shown above the price ("1 Year"). */
  period: string
  /** Current (sale) price, pre-formatted ("$48", "$84.99"). */
  price: string
  /** Struck-through list price when on sale ("$99.99"). Omit at list price. */
  originalPrice?: string
  /** Promo code surfaced under the price ("JUNECE"). Omit when none. */
  promoCode?: string
  ctaLabel: string
  /** The featured (recommended) plan — carries the "Most Popular" badge. */
  featured?: boolean
  /** Badge copy for the featured plan ("Most Popular"). */
  badge?: string
}

/** A feature row in the plan comparison table. `true`/`false` render a check /
 *  dash; a string renders that value (e.g. "100+" vs "200+" courses). */
export type ExplorePlanComparisonRow = {
  label: string
  lite: boolean | string
  passport: boolean | string
}

const ELITE_EXPLORE_PLANS: ExplorePlan[] = [
  {
    id: 'passport-lite',
    name: 'Elite Nursing Passport Lite CE Membership',
    shortName: 'Passport Lite',
    tagline: 'Essential CE to keep your license current.',
    period: '1 Year',
    price: '$48',
    ctaLabel: 'Get Access Now',
  },
  {
    id: 'passport',
    name: 'Elite Nursing Passport CE Membership',
    shortName: 'Passport',
    tagline: 'Everything unlocked — the complete nursing membership.',
    period: '1 Year',
    price: '$84.99',
    originalPrice: '$99.99',
    featured: true,
    badge: 'Most Popular',
    ctaLabel: 'Add to Cart',
  },
]

const ELITE_EXPLORE_COMPARISON: ExplorePlanComparisonRow[] = [
  { label: 'State-required CE (and multi-state CE)', lite: true, passport: true },
  { label: 'ANCC-accredited courses', lite: '100+', passport: '200+' },
  { label: 'Exclusive CE podcasts', lite: true, passport: true },
  { label: 'Enhanced CE deadline tracking', lite: true, passport: true },
  { label: 'Automatic reporting, including CE Broker', lite: true, passport: true },
  { label: 'Premium specialty collections', lite: false, passport: true },
  { label: 'Expanded pharmacology library', lite: false, passport: true },
  { label: 'Certification prep', lite: false, passport: true },
]

const EXPLORE_PLANS_BY_BRAND: Record<Brand, ExplorePlan[]> = {
  cre: [],
  mckissock: [],
  elite: ELITE_EXPLORE_PLANS,
  fitzgerald: ELITE_EXPLORE_PLANS,
  stc: [],
  // XCEL sells transactional course packages (Standard / Premier) + a B2B
  // Partner programme — no consumer membership, so nothing here is reachable.
  xcel: [],
}

const EXPLORE_COMPARISON_BY_BRAND: Record<Brand, ExplorePlanComparisonRow[]> = {
  cre: [],
  mckissock: [],
  elite: ELITE_EXPLORE_COMPARISON,
  fitzgerald: ELITE_EXPLORE_COMPARISON,
  stc: [],
  // XCEL sells transactional course packages (Standard / Premier) + a B2B
  // Partner programme — no consumer membership, so nothing here is reachable.
  xcel: [],
}

export function explorePassportPlansFor(brand: Brand): ExplorePlan[] {
  return EXPLORE_PLANS_BY_BRAND[brand]
}

export function explorePlanComparisonFor(brand: Brand): ExplorePlanComparisonRow[] {
  return EXPLORE_COMPARISON_BY_BRAND[brand]
}
