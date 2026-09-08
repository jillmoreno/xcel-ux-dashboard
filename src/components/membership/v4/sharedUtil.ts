import type { MembershipFirstTier } from '@/data/membership/membershipFirstFixtures'

/**
 * Non-component helpers + types for the Membership v4 page. Kept in a
 * plain `.ts` module (separate from `shared.tsx`) so the component file
 * only exports components — satisfies the `react-refresh/only-export-
 * components` lint rule.
 */

/** Which membership the viewer is browsing as. `full` = active member
 *  (everything open); `lite` = Passport Lite / non-member (Passport-only
 *  items are gated, Lite items stay open as the free sample). */
export type MembershipAccess = 'full' | 'lite'

export type AccentTone = 'teal' | 'cta' | 'gold'

/** Resolve an accent tone to its {bg, fg} CSS-variable pair. */
export function accentPalette(tone: AccentTone): { bg: string; fg: string } {
  switch (tone) {
    case 'cta':
      return { bg: 'var(--color-cta-100)', fg: 'var(--color-cta-700)' }
    case 'gold':
      return { bg: 'var(--color-tertiary-100)', fg: 'var(--color-tertiary-700)' }
    default:
      return { bg: 'var(--color-secondary-100)', fg: 'var(--color-secondary-700)' }
  }
}

/** Solid brand color per accent tone — the base for the designed-cover
 *  gradient (the `accentPalette` -100 bg is too pale to carry white text). */
const COVER_BASE: Record<AccentTone, string> = {
  teal: 'var(--color-secondary-500)',
  cta: 'var(--color-cta-500)',
  gold: 'var(--color-tertiary-500)',
}

/** Diagonal gradient for the designed cover, derived from the item's accent
 *  tone — darkens the base ~24% via `color-mix` (no hardcoded hex). */
export function coverGradient(tone: AccentTone): string {
  const c = COVER_BASE[tone]
  return `linear-gradient(140deg, ${c}, color-mix(in srgb, ${c} 76%, black))`
}

/** Decide whether an item is gated for the current access level. Lite
 *  items (`both`) stay open as the free sample; Passport-only items are
 *  gated when browsing as Lite / non-member. */
export function isGated(tier: MembershipFirstTier, access: MembershipAccess): boolean {
  return access === 'lite' && tier === 'passport'
}
