import type { Brand } from '@/context/AccountContext'

/**
 * FHEA Passport plan tiers for the Membership v2 redesign — Passport Lite
 * (essentials) and Passport (the featured, complete membership). Feature
 * lists mirror the prototype's plan comparison.
 *
 * TODO(pricing): $19 / $39 per month are PLACEHOLDERS — Jillienne is
 * confirming the real numbers. Update `price` here once finalized.
 * TODO(data): swap `passportTiersFor` for a real plans endpoint later.
 */

export type PassportPlanFeature = {
  label: string
  /** false → rendered struck-through / muted ("not included"). */
  included: boolean
}

export type PassportTierPlan = {
  id: 'passport-lite' | 'passport'
  name: string
  /** Placeholder price — see TODO(pricing). */
  price: string
  cadence: string
  /** Short one-liner under the price. */
  tagline: string
  features: PassportPlanFeature[]
  ctaLabel: string
  /** The featured (Most popular) plan gets the highlighted card. */
  featured?: boolean
  /** Ribbon copy for the featured plan. */
  ribbon?: string
}

const ELITE_PASSPORT_TIERS: PassportTierPlan[] = [
  {
    id: 'passport-lite',
    name: 'Passport Lite',
    price: '$19', // TODO(pricing): placeholder
    cadence: '/month',
    tagline: 'Essentials to keep learning on the go.',
    features: [
      { label: 'Nursing podcasts', included: true },
      { label: 'Community access', included: true },
      { label: 'Video nursing skills library', included: false },
      { label: 'Pharmacology & specialty bundles', included: false },
      { label: 'Rubi AI career toolkit', included: false },
    ],
    ctaLabel: 'Choose Passport Lite',
  },
  {
    id: 'passport',
    name: 'Passport',
    price: '$39', // TODO(pricing): placeholder
    cadence: '/month',
    tagline: 'The complete nursing membership.',
    featured: true,
    ribbon: 'Most popular',
    features: [
      { label: 'Everything in Passport Lite', included: true },
      { label: 'Video nursing skills library', included: true },
      { label: 'Pharmacology course library', included: true },
      { label: 'In-depth specialty bundles', included: true },
      { label: 'Specialty certification exam prep', included: true },
      { label: 'Specialty & role transition CE', included: true },
      { label: 'Rubi AI career toolkit', included: true },
    ],
    ctaLabel: 'Join FHEA Passport',
  },
]

const PASSPORT_TIERS_BY_BRAND: Record<Brand, PassportTierPlan[]> = {
  cre: [],
  mckissock: [],
  elite: ELITE_PASSPORT_TIERS,
  fitzgerald: ELITE_PASSPORT_TIERS,
  stc: [],
  // XCEL sells transactional course packages (Standard / Premier) + a B2B
  // Partner programme — no consumer membership, so nothing here is reachable.
  xcel: [],
}

export function passportTiersFor(brand: Brand): PassportTierPlan[] {
  return PASSPORT_TIERS_BY_BRAND[brand]
}
