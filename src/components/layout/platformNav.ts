import type { PlatformSection } from './PlatformSideNav'

/**
 * Non-component constants for the platform shell rail. Kept out of
 * `PlatformSideNav.tsx` so that file only exports components (react-refresh
 * lint) — mirrors the `v4/sharedUtil.ts` split.
 *
 * Membership sections that upsell non-members — everything in the Membership
 * group except Explore Membership. Non-members still OPEN each section and see the
 * SAME body a member sees; the non-member difference is a larger upsell hero on top
 * (`LearningLibraryHero` for the Resource Library, `BenefitUpsellHero` for Exam
 * & Cert Prep + AI Career Tools, `NonMemberUpsellHero` for Partner Offers).
 *
 * NOTE: currently informational — the shell branches on the specific section
 * ids directly rather than reading this set.
 */
export const NON_MEMBER_LOCKED: ReadonlySet<PlatformSection> = new Set([
  'm-learning-library',
  'm-exam-prep',
  'm-career-tools',
  'm-more',
])
