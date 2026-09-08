import { PassportHero } from './PassportHero'
import { PassportProductsGrid } from './PassportProductsGrid'
import { PassportProductsSections } from './PassportProductsSections'
import { LearningRecapBadge } from './LearningRecapBadge'
import { RecommendedForYouStrip } from './RecommendedForYouStrip'
import { VipPerksRow } from './VipPerksRow'

/**
 * Member ("benefits") Passport page — matches
 * `explorations/membership-landing/elite-v2-member.html`.
 * Order: personalized hero + stat cards → learning recap badge →
 * benefits grid → recommended for you → VIP perks.
 *
 * `productsLayout` (V2 vs V3): `'grid'` renders the single 9-tile grid;
 * `'sections'` (V3) renders the grouped `PassportProductsSections`.
 */
export function MembershipV2Member({
  productsLayout = 'grid',
}: {
  productsLayout?: 'grid' | 'sections'
}) {
  return (
    <div>
      <PassportHero variant="member" />
      <LearningRecapBadge />
      {productsLayout === 'sections' ? (
        <PassportProductsSections variant="member" />
      ) : (
        <PassportProductsGrid variant="member" />
      )}
      <RecommendedForYouStrip />
      <VipPerksRow variant="redeem" />
    </div>
  )
}
