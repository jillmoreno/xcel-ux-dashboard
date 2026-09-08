// Membership upsell shown in the "Choose how to enroll" step of the new
// Purchase Course sheet (`CoursePurchaseSheet`). One entry per brand so the
// sheet stays brand-agnostic — the plan names, prices, and copy all resolve
// from the active brand rather than being hardcoded at the call site.
//
// The enroll step lists a one-time purchase against one OR MORE membership
// tiers (Elite: Passport Lite + Passport), each a compact option row with a
// short "this course FREE + …" subtitle, a "View Details" link, and a price.
// The highest tier carries the BEST VALUE marker.
//
// TODO(commerce): replace with the real plans/pricing endpoint. Prices +
// `catalogSize` are fixture values.

import type { Brand } from '@/context/AccountContext'

/** A single membership option in the enroll step. */
export type UpsellTier = {
  /** Stable id used as the radio value + cart key. */
  id: string
  /** Plan display name, e.g. "Passport Lite Membership". */
  name: string
  /** One-line value copy under the name (no bullet list — the compact style). */
  subtitle: string
  /** Price the non-member pays today (per `period`). */
  price: number
  /** Period suffix rendered after the price ("year"). */
  period: string
  /** Billing cadence noun used in the step-2 summary line ("billed yearly"). */
  billingNote: string
  /** The recommended tier — carries the BEST VALUE pill + tinted card. */
  bestValue?: boolean
}

export type UpsellOffer = {
  /** Membership tiers, lowest → highest. */
  tiers: UpsellTier[]
  /** Catalog size surfaced in the Added-to-Cart toast meta ("200+ courses"). */
  catalogSize: string
}

// "This course FREE + All CE Requirements." — the shared lead line every tier
// opens with; the top tier appends its extra inclusions.
const FREE_CE = 'This course FREE + All CE Requirements.'

const ELITE_OFFER: UpsellOffer = {
  catalogSize: '200+',
  tiers: [
    {
      id: 'passport-lite',
      name: 'Passport Lite Membership',
      subtitle: FREE_CE,
      price: 48,
      period: 'year',
      billingNote: 'billed yearly',
    },
    {
      id: 'passport',
      name: 'Passport Membership',
      subtitle: `${FREE_CE} Resources, clinical skills library + more`,
      price: 99.99,
      period: 'year',
      billingNote: 'billed yearly',
      bestValue: true,
    },
  ],
}

const OFFERS: Record<Brand, UpsellOffer> = {
  // Healthcare (Elite) — the brand this flow was designed against; two tiers.
  elite: ELITE_OFFER,
  // Fitzgerald shares Elite's Passport tier model + palette.
  fitzgerald: ELITE_OFFER,
  // Real Estate — Plus (entry) vs. Premier (recommended), matching the
  // "Compare your Membership Options" plans.
  cre: {
    catalogSize: '200+',
    tiers: [
      {
        id: 'plus',
        name: 'Plus Membership',
        subtitle: FREE_CE,
        price: 99,
        period: 'year',
        billingNote: 'billed yearly',
      },
      {
        id: 'premier',
        name: 'Premier Membership',
        subtitle: `${FREE_CE} Designation prep, masterclasses, coaching + more`,
        price: 199.99,
        period: 'year',
        billingNote: 'billed yearly',
        bestValue: true,
      },
    ],
  },
  mckissock: {
    catalogSize: '120+',
    tiers: [
      {
        id: 'membership',
        name: 'Appraisal Membership',
        subtitle: `${FREE_CE} 120+ courses for your license.`,
        price: 99.99,
        period: 'year',
        billingNote: 'billed yearly',
        bestValue: true,
      },
    ],
  },
  stc: {
    catalogSize: '80+',
    tiers: [
      {
        id: 'membership',
        name: 'STC Membership',
        subtitle: 'This course FREE + exam prep for every series you hold.',
        price: 99.99,
        period: 'year',
        billingNote: 'billed yearly',
        bestValue: true,
      },
    ],
  },
  // XCEL has no membership to upsell — an empty tier list means the
  // catalog's membership upsell has nothing to offer and degrades to the
  // plain add-to-cart path. `catalogSize` still has a real job: it is the
  // Added-to-Cart toast's "N courses" meta, which is a catalogue fact, not a
  // membership one.
  xcel: { catalogSize: '50+', tiers: [] },
}

export function upsellOfferFor(brand: Brand): UpsellOffer {
  return OFFERS[brand] ?? ELITE_OFFER
}
