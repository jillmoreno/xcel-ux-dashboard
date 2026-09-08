import { useAccount } from '@/context/AccountContext'
import { MembershipV2Member } from './MembershipV2Member'
import { MembershipV2NonMember } from './MembershipV2NonMember'

/**
 * Membership v2 (FHEA Passport redesign). Brand/membership switch
 * wrapper. The brand gate (Elite-only) lives in `MembershipLandingPage`
 * — by the time this renders, the brand is already known-Elite. The
 * member-vs-non-member branch reads `useAccount().membership`, mirroring
 * the v1 page (independent of `?version`).
 *
 * `version` selects the products layout: `'v2'` → the single 9-tile grid;
 * `'v3'` → the grouped sections (`productsLayout="sections"`). Everything
 * else on the page is shared, so V3 is purely additive.
 */
export function MembershipV2({ version = 'v2' }: { version?: 'v2' | 'v3' }) {
  const { membership } = useAccount()
  const productsLayout = version === 'v3' ? 'sections' : 'grid'
  return membership === 'member' ? (
    <MembershipV2Member productsLayout={productsLayout} />
  ) : (
    <MembershipV2NonMember productsLayout={productsLayout} />
  )
}
