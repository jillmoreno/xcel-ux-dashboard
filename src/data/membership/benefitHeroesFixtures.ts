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

/** Shared "Become a member" target — anchors to the in-page PassportPlanComparison
 *  (`<Block id="plans">`), so the marketing CTA scrolls down to the plans. */
const BECOME_A_MEMBER: BenefitHeroCta = { label: 'Become a member', href: '#plans' }

const ELITE_BENEFIT_HEROES: BenefitHero[] = [
  {
    id: 'learning-library',
    accent: 'teal',
    tier: 'passport',
    kicker: 'Your Resource Library',
    heading: 'Hundreds of courses. One unlimited library.',
    lede: 'Unlimited CE, video skills, and specialty libraries — built by nurses, for nurses.',
    bullets: [
      'Hundreds of courses across 30+ specialties',
      'Online, video, webinar, or printed — your choice',
      'Dashboard tracks hours toward your renewal',
      'Picks matched to your state + specialties',
    ],
    iconKey: 'library',
    stat: { heading: '4.8★', sub: 'from 80k+ reviews' },
    memberCta: {
      primary: { label: 'Browse the library', href: '/membership?tab=library' },
      secondary: { label: 'See specialty collections', href: '/membership?tab=library' },
    },
    marketingCta: {
      primary: { label: 'Learn more', href: '/membership?tab=library' },
      secondary: BECOME_A_MEMBER,
    },
    image:
      'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=900&h=900&fit=crop&q=80',
    imageAlt: 'Nurse studying continuing-education materials on a laptop.',
  },
  {
    id: 'podcasts',
    accent: 'gold',
    // Open free sample — CE podcasts are included with Passport Lite, so
    // they're never gated in the marketing variant.
    tier: 'both',
    kicker: 'CE Podcasts',
    heading: 'Listen, learn, and earn CE.',
    lede: 'Accredited audio that turns commutes into credit hours.',
    bullets: [
      'New episodes every two weeks',
      'Earn real CE credit just by listening',
      'Apple Podcasts + Spotify — Lite included',
      'Hosted by nursing experts and educators',
    ],
    iconKey: 'podcast',
    stat: { heading: 'New ep.', sub: 'every 2 weeks' },
    memberCta: {
      primary: { label: 'Browse podcasts', href: '/my-learning/podcasts' },
      secondary: { label: 'Listen to a sample episode', href: '/my-learning/podcasts' },
    },
    marketingCta: {
      primary: { label: 'Learn more', href: '/my-learning/podcasts' },
      secondary: BECOME_A_MEMBER,
    },
    image:
      'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=900&h=900&fit=crop&q=80',
    imageAlt: 'Nurse wearing headphones listening to a continuing-education podcast.',
  },
  {
    id: 'exam-prep',
    accent: 'sky',
    tier: 'passport',
    kicker: 'Exam & Certification Prep',
    heading: 'Walk into your exam ready.',
    lede: 'Practice tests and study plans for the certifications nurses request most.',
    bullets: [
      'Realistic practice tests',
      'Structured, exam-ready study plans',
      'Coverage for in-demand credentials',
      'Track readiness, close gaps before exam day',
    ],
    iconKey: 'award',
    stat: { heading: 'Pass-ready', sub: 'study plans' },
    memberCta: {
      primary: { label: 'View all prep', href: '/membership/passport/cert-exam-prep' },
      secondary: { label: 'See covered certifications', href: '/membership/passport/cert-exam-prep' },
    },
    marketingCta: {
      primary: { label: 'Learn more', href: '/membership/passport/cert-exam-prep' },
      secondary: BECOME_A_MEMBER,
    },
    image:
      'https://images.unsplash.com/photo-1581595220892-b0739db3ba8c?w=900&h=900&fit=crop&q=80',
    imageAlt: 'Nurse studying for a certification exam at a desk with notes.',
  },
  {
    id: 'career-tools',
    accent: 'lavender',
    tier: 'passport',
    kicker: 'AI Career Tools',
    heading: 'Your personal coach, powered by Rubi AI.',
    lede: 'Practice, polish, and plan — at your own pace, 24/7.',
    bullets: [
      'Interview reps with instant feedback',
      'Resume help that translates clinical experience',
      'Next-move planning for specialties + roles',
      'Always available when you are',
    ],
    iconKey: 'robot',
    stat: { heading: '24/7', sub: 'AI career coach' },
    memberCta: {
      primary: { label: 'Explore tools', href: '/membership/passport/interview-sim' },
      secondary: { label: 'Meet Rubi AI', href: '/membership/passport/interview-sim' },
    },
    marketingCta: {
      primary: { label: 'Learn more', href: '/membership/passport/interview-sim' },
      secondary: BECOME_A_MEMBER,
    },
    image:
      'https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=900&h=900&fit=crop&q=80',
    imageAlt: 'Nurse working with an AI career coaching tool on a tablet.',
  },
]

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
