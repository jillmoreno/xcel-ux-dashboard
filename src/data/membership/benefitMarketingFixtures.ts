import type { Brand } from '@/context/AccountContext'

/**
 * Marketing copy for the Dashboard Rebrand's NON-MEMBER membership surfaces
 * (Elite-only). Two selectors, both keyed off the same prototype copy set:
 *
 *   - `membershipSpotlightFor` → the A1 "dark spotlight" hero that tops the
 *     non-member **Explore Membership** section (replaces the gradient
 *     `MembershipSectionHero` for non-members). The membership-level pitch:
 *     eyebrow + headline + three benefit rows + one CTA.
 *   - `benefitMarketingFor`    → per-benefit copy for the **locked benefit
 *     pages** a non-member reaches by clicking a Passport-only rail item
 *     (Resource Library / Exam & Cert Prep / Rubi AI Tools / Partner Offers).
 *     Drives the loud strip's lead line + the marketing block below it.
 *
 * Both are Elite-only; every other brand returns `null` / `[]` so the
 * surfaces hide themselves (the rebrand only ever runs Elite, but the
 * fallbacks keep the data layer brand-safe).
 *
 * `iconKey` maps to an `@/icons` glyph by the component that renders it —
 * never an imported component here, so the fixture stays presentation-free.
 *
 * TODO(data): replace prototype copy + swap the placeholder marketing images
 * for brand-provided art once the membership/marketing service exists. Keep
 * the shapes additive.
 */

/** Locked sections a non-member can open (mirrors `NON_MEMBER_LOCKED` in
 *  PlatformSideNav). The `benefitMarketingFor` keys. */
export type LockedBenefitSection =
  | 'm-learning-library'
  | 'm-exam-prep'
  | 'm-career-tools'
  | 'm-more'

export type BenefitMarketing = {
  /** Loud upgrade-strip headline (e.g. "Exam & cert prep is an Elite member
   *  benefit"). */
  stripTitle: string
  /** Strip sub-line — the one-sentence "unlock X" hook. */
  stripSubtitle: string
  /** Marketing block eyebrow (kept constant across benefits today). */
  eyebrow: string
  /** Marketing block headline — the page's `<h1>`. */
  title: string
  /** 1–2 sentence value description. */
  blurb: string
  /** 3 concrete value bullets. */
  bullets: string[]
  /** Icon glyph key for the marketing image placeholder. */
  iconKey: string
}

export type SpotlightBenefit = {
  iconKey: string
  title: string
  blurb: string
}

export type MembershipSpotlight = {
  eyebrow: string
  /** Hero headline — the section `<h1>` when shown. */
  title: string
  /** Marketing cover photo (3:4). When set, replaces the "Member photo"
   *  placeholder. TODO(asset): swap the Unsplash stand-in for the licensed
   *  campaign image — drop it in `public/brand/` and point this there. */
  photo?: string
  benefits: SpotlightBenefit[]
  ctaLabel: string
  /** Route for the CTA (the standalone pricing/plans page). */
  ctaTo: string
}

/* ─── A1 spotlight (Explore Membership hero) ─────────────────────────── */

const SPOTLIGHT_BY_BRAND: Record<Brand, MembershipSpotlight | null> = {
  // XCEL sells transactional course packages (Standard / Premier) + a B2B
  // Partner programme — no consumer membership, so nothing here is reachable.
  xcel: null,
}

export function membershipSpotlightFor(brand: Brand): MembershipSpotlight | null {
  return SPOTLIGHT_BY_BRAND[brand]
}

/* ─── Per-benefit locked-page copy ───────────────────────────────────── */

const BENEFIT_MARKETING_BY_BRAND: Record<
  Brand,
  Partial<Record<LockedBenefitSection, BenefitMarketing>>
> = {
  // XCEL sells transactional course packages (Standard / Premier) + a B2B
  // Partner programme — no consumer membership, so nothing here is reachable.
  xcel: {},
}

export function benefitMarketingFor(
  brand: Brand,
  section: LockedBenefitSection,
): BenefitMarketing | null {
  return BENEFIT_MARKETING_BY_BRAND[brand][section] ?? null
}
