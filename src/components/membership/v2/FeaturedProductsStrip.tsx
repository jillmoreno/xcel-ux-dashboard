import { useAccount } from '@/context/AccountContext'
import { featuredProductsFor } from '@/data/membership/passportRecommendedFixtures'
import { ProductTileStrip } from './RecommendedForYouStrip'

/**
 * "Featured products" — membership-spotlighted content, rendered with the
 * same tile UI as the Recommended-for-you strip. Used on the Dashboard
 * Rebrand overview beneath the personalized widgets.
 */
export function FeaturedProductsStrip() {
  const { brand } = useAccount()
  const items = featuredProductsFor(brand)
  return (
    <ProductTileStrip
      id="featured-products"
      eyebrow="Included with membership"
      title="Featured products"
      items={items}
    />
  )
}
