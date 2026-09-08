import type { Brand } from '@/context/AccountContext'
import type { MembershipFirstTier } from './membershipFirstFixtures'

/**
 * Benefit-hero fixtures for the "Membership Benefits" tab (and the V5/V7
 * Membership-First overview, which reuses the same heroes). Each hero is a
 * warm, benefit-led jumping-off point with TWO CTA sets:
 *
 *   - `memberCta`    → deep-links a member uses to jump straight into the
 *                      benefit (the page they'd reach today).
 *   - `marketingCta` → the non-member pitch: "Learn more" deep-links to the
 *                      SAME benefit page a member reaches, and "Become a
 *                      member" anchors to the in-page `#plans` comparison.
 *
 * Elite-only for this pass (matches the v2–v7 brand gate); every other brand
 * returns `[]`, which hides the Benefits tab and renders nothing.
 *
 * Deep-link routes were audited against `App.tsx` (2026-06): all four resolve
 * today — `?tab=library` (this page), `/my-learning/podcasts`,
 * `/membership/passport/cert-exam-prep` + `/membership/passport/interview-sim`
 * (both real `passportProductsFor` ids on `/membership/passport/:productId`).
 *
 * TODO(data): swap for the Membership service's benefit-aggregation endpoint
 * once published. Shapes stay additive.
 */

export type BenefitHeroAccent = 'teal' | 'gold' | 'sky' | 'lavender'
export type BenefitHeroIconKey = 'library' | 'podcast' | 'award' | 'robot'

export type BenefitHeroCta = { label: string; href: string }
export type BenefitHeroCtaSet = { primary: BenefitHeroCta; secondary: BenefitHeroCta }

export type BenefitHero = {
  id: string
  /** Drives `--accent` + tinted chip / button / stat chip. */
  accent: BenefitHeroAccent
  /** Tier that unlocks this benefit — drives the marketing-variant gated
   *  "Unlock with Passport" chip. `passport` = gated for Lite/non-members;
   *  `both` = open free sample (e.g. CE podcasts, Lite-included). */
  tier: MembershipFirstTier
  kicker: string
  /** Benefit-led headline (not just the feature name). */
  heading: string
  lede: string
  bullets: string[]
  /** Resolved to an `@/icons` component in BenefitHeroSections (data layer
   *  stays React-free, mirroring `membershipFirstFixtures`). */
  iconKey: BenefitHeroIconKey
  /** Stat chip rendered bottom-right of the photo. */
  stat: { heading: string; sub: string }
  memberCta: BenefitHeroCtaSet
  marketingCta: BenefitHeroCtaSet
  /** Configurable image source. TODO(brand): replace these Unsplash
   *  placeholders with Elite Learning's licensed nursing photography. */
  image: string
  imageAlt: string
}

const BENEFIT_HEROES_BY_BRAND: Record<Brand, BenefitHero[]> = {
  // XCEL sells transactional course packages (Standard / Premier) + a B2B
  // Partner programme — no consumer membership, so nothing here is reachable.
  xcel: [],
}

/** The four benefit heroes for the active brand. Elite-only today; every
 *  other brand returns `[]` (which hides the Benefits tab + renders nothing). */
export function benefitHeroesFor(brand: Brand): BenefitHero[] {
  return BENEFIT_HEROES_BY_BRAND[brand]
}
