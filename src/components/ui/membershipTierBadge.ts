import type { ComponentType } from 'react'
import { Bolt, Crown, Gem } from '@/icons'
import type { MembershipTierTone } from '@/context/AccountContext'

/**
 * Tier tone → leading badge glyph for `<MembershipBadge>`, per the Figma
 * "Tier Profile Pics" (nodes 1444:30900 / :30947): primary (Plus / Passport
 * Lite) → Bolt, tertiary (Pro) → Gem, warning (Premier / Passport) → Crown.
 * Neutral falls back to the Gem (not used by member pills today). Kept in a
 * plain `.ts` module so it can be imported by the badge callers and stay off
 * the component's fast-refresh boundary.
 */
export function tierBadgeIcon(
  tone: MembershipTierTone,
): ComponentType<{ size?: number; 'aria-hidden'?: boolean }> {
  switch (tone) {
    case 'primary':
      return Bolt
    case 'tertiary':
      return Gem
    case 'warning':
      return Crown
    default:
      return Gem
  }
}
