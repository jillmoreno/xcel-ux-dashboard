import { useAccount } from '@/context/AccountContext'
import { MembershipCombinedHero } from './MembershipCombinedHero'
import { LearningRecapBadge } from '../v2/LearningRecapBadge'
import { PassportProductsGrid } from '../v2/PassportProductsGrid'
import { RecommendedForYouStrip } from '../v2/RecommendedForYouStrip'
import { VipPerksRow } from '../v2/VipPerksRow'
import { MembershipV2NonMember } from '../v2/MembershipV2NonMember'

/**
 * Membership v6 — "Combined hero" page. The hero mixes aspects audited
 * across v1/v2/v4 per stakeholder direction (solid primary-700 surface,
 * two-column layout, v2-member KPI stat cards in the aside). The body
 * below reuses the v2 member content so the page is complete:
 *   hero → learning recap → benefits grid → recommended → VIP perks.
 *
 * Member view is the designed-first variant. The non-member/join hero is
 * a follow-up, so v6 falls back to the v2 join page for non-members.
 * Elite-gated upstream in `MembershipLandingPage` (the KPI fixtures only
 * return data for Elite).
 */
export function MembershipV6() {
  const { membership } = useAccount()

  if (membership !== 'member') {
    return <MembershipV2NonMember productsLayout="grid" />
  }

  return (
    <div>
      <MembershipCombinedHero />
      <LearningRecapBadge />
      <PassportProductsGrid variant="member" />
      <RecommendedForYouStrip />
      <VipPerksRow variant="redeem" />
    </div>
  )
}
