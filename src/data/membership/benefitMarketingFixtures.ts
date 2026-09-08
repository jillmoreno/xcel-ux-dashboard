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

const ELITE_SPOTLIGHT: MembershipSpotlight = {
  eyebrow: 'Elite membership',
  title: 'Unlock everything your nursing career needs',
  // Marketing photo — mature learner listening to CE on the go.
  // TODO(asset): confirm licensing before production.
  photo: '/brand/member-spotlight.png',
  benefits: [
    {
      iconKey: 'library',
      title: 'Unlimited CE courses',
      blurb: 'Every required credit, always included.',
    },
    {
      iconKey: 'award',
      title: 'Exam & certification prep',
      blurb: 'Pass faster with guided prep tracks.',
    },
    {
      iconKey: 'rubi',
      title: 'Rubi AI career tools',
      blurb: 'Resume, interview practice, and more.',
    },
  ],
  ctaLabel: 'See membership plans',
  ctaTo: '/membership/plans',
}

const SPOTLIGHT_BY_BRAND: Record<Brand, MembershipSpotlight | null> = {
  cre: null,
  mckissock: null,
  elite: ELITE_SPOTLIGHT,
  fitzgerald: ELITE_SPOTLIGHT,
  stc: null,
  // XCEL sells transactional course packages (Standard / Premier) + a B2B
  // Partner programme — no consumer membership, so nothing here is reachable.
  xcel: null,
}

export function membershipSpotlightFor(brand: Brand): MembershipSpotlight | null {
  return SPOTLIGHT_BY_BRAND[brand]
}

/* ─── Per-benefit locked-page copy ───────────────────────────────────── */

const ELITE_BENEFIT_MARKETING: Record<LockedBenefitSection, BenefitMarketing> = {
  'm-learning-library': {
    stripTitle: 'The Resource Library is an Elite member benefit',
    stripSubtitle:
      'Unlock 500+ CE courses, video skills, and podcasts — all counting toward renewal.',
    eyebrow: 'Member benefit',
    title: 'A CE library that grows with you',
    blurb:
      'Hundreds of courses, video skills, and CE podcasts across your specialties — added throughout the year and always counting toward your license renewal.',
    bullets: [
      '500+ CE hours across every specialty',
      'New courses and podcasts added between renewals',
      'Track progress toward every license you hold',
    ],
    iconKey: 'library',
  },
  'm-exam-prep': {
    stripTitle: 'Exam & cert prep is an Elite member benefit',
    stripSubtitle:
      'Unlock guided prep, practice exams, and readiness scoring with membership.',
    eyebrow: 'Member benefit',
    title: 'Pass your boards the first time',
    blurb:
      'Guided prep tracks, full-length practice exams, and readiness scoring built around your certification — everything you need to walk in ready, included with Elite membership.',
    bullets: [
      'Full-length practice exams with rationales',
      'Readiness score that tracks your progress',
      'Personalized study plan by exam date',
    ],
    iconKey: 'award',
  },
  'm-career-tools': {
    stripTitle: 'Rubi AI career tools are an Elite member benefit',
    stripSubtitle:
      'Unlock interview practice, a resume builder, and AI career guidance with membership.',
    eyebrow: 'Member benefit',
    title: 'Your AI-powered career coach',
    blurb:
      'Practice interviews, build a standout resume, and map your next move with Rubi AI — personalized guidance to grow your nursing career, included with membership.',
    bullets: [
      'Realistic interview simulations with feedback',
      'Resume builder tailored to nursing roles',
      'Personalized career-path recommendations',
    ],
    iconKey: 'rubi',
  },
  'm-more': {
    stripTitle: 'Partner offers & perks are an Elite member benefit',
    stripSubtitle:
      'Unlock exclusive partner savings that stretch your membership further.',
    eyebrow: 'Member benefit',
    title: 'Perks that pay for your membership',
    blurb:
      'Exclusive savings from trusted partners — discounts on the products and services nurses actually use, curated to make your membership go further.',
    bullets: [
      'Member-only discounts from trusted partners',
      'New offers added throughout the year',
      'Savings that can offset your membership cost',
    ],
    iconKey: 'gem',
  },
}

const BENEFIT_MARKETING_BY_BRAND: Record<
  Brand,
  Partial<Record<LockedBenefitSection, BenefitMarketing>>
> = {
  cre: {},
  mckissock: {},
  elite: ELITE_BENEFIT_MARKETING,
  fitzgerald: ELITE_BENEFIT_MARKETING,
  stc: {},
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
