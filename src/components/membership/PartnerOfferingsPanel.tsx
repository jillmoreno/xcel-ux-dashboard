import type { CSSProperties } from 'react'
import { useAccount } from '@/context/AccountContext'
import { useFeatureFlag } from '@/context/FeatureFlagContext'
import { partnerOfferingsFor } from '@/data/membership/partnerOfferingsFixtures'
import { featuredOffersFor } from '@/data/membership/featuredOffersFixtures'
import { PartnerOfferingCard } from './PartnerOfferingCard'
import { FeaturedOfferCard } from './FeaturedOfferCard'

/**
 * Member-facing VIP Partner Offerings panel rendered under
 * `/membership?tab=partner-offerings`.
 *
 *   ┌────────────────────────────────────────────────────────┐
 *   │ Description paragraph (sits under the tab title)        │
 *   ├────────────────────────────────────────────────────────┤
 *   │ ┌────────┐ ┌────────┐ ┌────────┐                       │
 *   │ │ Card   │ │ Card   │ │ Card   │   (auto-fill 3-up)    │
 *   │ └────────┘ └────────┘ └────────┘                       │
 *   └────────────────────────────────────────────────────────┘
 *
 * The "Partner Offerings" page-level title from the design
 * reference is omitted — `MembershipLandingPage` already renders
 * the unified `<h2>{tabLabel}</h2>` (== "VIP Partner Offerings")
 * above every panel, so a second hero title would double up.
 *
 * When the `partner-offers-featured` flag is on, a distinct **Featured Offers**
 * band leads the page — a wide hero card + a row of smaller cards
 * (`FeaturedOfferCard`, demo data from `featuredOffersFor`) — and the brand's
 * regular offerings drop under an **Additional Offerings** subheading. Off ⇒
 * one flat grid with no subheadings (original behavior).
 *
 * No lead paragraph — the section hero above owns the pitch (the panel's own
 * intro line was removed for all brands to avoid duplicating it).
 *
 * Non-member view: `locked` swaps each card's "Learn More →" link for a
 * "Member Exclusive" locked pill (Figma 63:16150).
 */
export function PartnerOfferingsPanel({ locked = false }: { locked?: boolean } = {}) {
  const { brand } = useAccount()
  const offerings = partnerOfferingsFor(brand)

  const { enabled: featuredEnabled } = useFeatureFlag('partner-offers-featured')
  const featured = featuredOffersFor(brand)
  const showFeatured = featuredEnabled && featured.length > 0

  // McKissock mirrors its live page — featured cards use solid brand-tint media
  // blocks (not photos). Other brands keep the photo / gradient treatment.
  const placeholderMedia = brand === 'mckissock'

  // Split the featured band into a wide lead card + the remaining 2-up row.
  const [lead, ...rest] = featured

  return (
    <section
      aria-label="VIP Partner Offerings"
      style={{ display: 'flex', flexDirection: 'column', gap: 28 }}
    >
      {showFeatured && (
        <div style={groupStyle}>
          <h2 style={headingStyle}>Featured Offers</h2>
          <div style={featuredStackStyle}>
            {lead && (
              <FeaturedOfferCard
                data={lead}
                hero
                placeholderMedia={placeholderMedia}
                locked={locked}
              />
            )}
            {rest.length > 0 && (
              <div style={featuredRowStyle}>
                {rest.map((offer) => (
                  <FeaturedOfferCard
                    key={offer.id}
                    data={offer}
                    placeholderMedia={placeholderMedia}
                    locked={locked}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {offerings.length === 0 ? (
        <p style={emptyStyle}>
          No partner offerings published for this brand yet.
        </p>
      ) : (
        <div style={groupStyle}>
          {showFeatured && <h2 style={headingStyle}>Additional Offerings</h2>}
          <div role="list" style={gridStyle}>
            {offerings.map((offering) => (
              <div key={offering.id} role="listitem">
                <PartnerOfferingCard data={offering} locked={locked} />
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  )
}

/* ─── styles ───────────────────────────────────────────────────────── */

const groupStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 14,
}

const headingStyle: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-heading)',
  fontSize: 20,
  fontWeight: 700,
  // Brand-colored section headings — matches the McKissock page's green
  // "Featured" / "Additional Offerings" headings (brand primary per brand).
  color: 'var(--color-accent-text)',
}

// Featured band: a wide lead card stacked above a row of smaller cards.
const featuredStackStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 16,
}

const featuredRowStyle: CSSProperties = {
  display: 'grid',
  // Fixed two-up (matches the McKissock reference). Each card wraps its media
  // block above its content when a column gets narrow, so it degrades cleanly.
  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
  gap: 16,
}

const gridStyle: CSSProperties = {
  display: 'grid',
  // 265px columns match the canonical CourseCard / LibraryResource
  // grid rhythm — the partner grid sits in the same column footprint
  // so reviewers see a consistent card surface across surfaces.
  gridTemplateColumns: 'repeat(auto-fill, 265px)',
  gap: 16,
}

const emptyStyle: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-body)',
  fontSize: 13,
  fontStyle: 'italic',
  color: 'var(--color-text-tertiary)',
}
