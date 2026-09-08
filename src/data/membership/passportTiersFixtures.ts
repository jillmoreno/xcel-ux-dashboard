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

const PASSPORT_TIERS_BY_BRAND: Record<Brand, PassportTierPlan[]> = {
  // XCEL sells transactional course packages (Standard / Premier) + a B2B
  // Partner programme — no consumer membership, so nothing here is reachable.
  xcel: [],
}

export function passportTiersFor(brand: Brand): PassportTierPlan[] {
  return PASSPORT_TIERS_BY_BRAND[brand]
}
