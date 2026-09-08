import type { CSSProperties } from 'react'
import { Link } from 'react-router-dom'
import { Card } from '@/components/ui/Card'
import { MemberExclusivePill } from './MemberExclusivePill'
import type { FeaturedOffer } from '@/data/membership/featuredOffersFixtures'

/**
 * Featured Partner Offer card — the distinct hero treatment used under the
 * "Featured Offers" heading (design reference: the McKissock partner-offerings
 * page). Two shapes:
 *
 *   hero (lead card, full width):        small card (2-up row):
 *   ┌───────────┬───────────────┐        ┌───────┬───────────┐   ┌──────────┐
 *   │           │  [brand mark] │        │       │  Title    │   │ [mark]   │
 *   │  [media]  │  Title        │        │[media]│  copy…    │   │ Title    │
 *   │           │  copy…        │        │       │ [Learn]   │   │ copy…    │
 *   │           │  [Learn More] │        └───────┴───────────┘   │ [Learn]  │
 *   └───────────┴───────────────┘                                └──────────┘
 *
 * The media panel on the left is one of three treatments:
 *   - a **photo** when the offer carries an `imageUrl` (CRE),
 *   - a solid **brand-tint placeholder block** when `placeholderMedia` is set
 *     (McKissock — mirrors the real page's sage-green image blocks), or
 *   - a **brand gradient panel** carrying the wordmark on a photo-less hero
 *     (Elite / STC, which have no lifestyle photo set).
 *
 * The "Learn More" CTA is an outlined button in the platform action color
 * (orange on McKissock, teal/magenta on other brands) rather than the plain
 * text link the standard `PartnerOfferingCard` uses.
 */
type Props = {
  data: FeaturedOffer
  /** Wide lead card (first featured offer) vs. the smaller 2-up cards. */
  hero?: boolean
  /** Render the media panel as a solid brand-tint placeholder block (matches
   *  the McKissock page's sage-green image blocks) instead of a photo/gradient. */
  placeholderMedia?: boolean
  /** Non-member view — swaps the CTA for the "Member Exclusive" pill. */
  locked?: boolean
}

export function FeaturedOfferCard({
  data,
  hero = false,
  placeholderMedia = false,
  locked = false,
}: Props) {
  const hasImage = Boolean(data.imageUrl) && !placeholderMedia
  // Media treatment (left panel): photo → solid placeholder block → gradient.
  const showBlock = placeholderMedia
  // A photo-less hero (no block) shows a branded gradient panel carrying the
  // partner wordmark, so the lead card keeps its weight without a photo asset.
  const showAccentPanel = hero && !hasImage && !showBlock
  // The gradient panel already carries the wordmark, so the body drops the
  // small brand label there to avoid repeating it.
  const showBrandLabel = Boolean(data.brandLabel) && !showAccentPanel

  return (
    <Card
      className="cre-library-card"
      style={hero ? heroCardStyle : smallCardStyle}
    >
      {hasImage && (
        <div style={hero ? heroImageWrapStyle : smallImageWrapStyle}>
          <img src={data.imageUrl} alt="" style={imageStyle} />
        </div>
      )}
      {showBlock && (
        <div
          aria-hidden
          style={{
            ...(hero ? heroImageWrapStyle : smallImageWrapStyle),
            ...placeholderBlockStyle,
          }}
        />
      )}
      {showAccentPanel && (
        <div style={heroAccentPanelStyle}>
          <span style={accentWordmarkStyle}>{data.brandLabel ?? data.partnerName}</span>
        </div>
      )}

      <div style={hero ? heroBodyStyle : smallBodyStyle}>
        {showBrandLabel && <span style={brandLabelStyle}>{data.brandLabel}</span>}
        <h3 style={hero ? heroTitleStyle : titleStyle} className="cre-library-card-title">
          {data.partnerName}
        </h3>
        <p style={descriptionStyle}>{data.description}</p>

        <div style={spacerStyle} />

        {locked ? (
          <MemberExclusivePill />
        ) : (
          <Link to={data.learnMoreUrl} style={learnMoreButtonStyle}>
            Learn More
          </Link>
        )}
      </div>
    </Card>
  )
}

/* ─── styles ───────────────────────────────────────────────────────── */

const heroCardStyle: CSSProperties = {
  flexDirection: 'row',
  flexWrap: 'wrap',
  alignItems: 'stretch',
  minHeight: 260,
}

const smallCardStyle: CSSProperties = {
  flexDirection: 'row',
  flexWrap: 'wrap',
  alignItems: 'stretch',
  minHeight: 200,
}

const heroImageWrapStyle: CSSProperties = {
  flex: '1 1 300px',
  minHeight: 240,
  position: 'relative',
}

const smallImageWrapStyle: CSSProperties = {
  flex: '0 0 40%',
  minWidth: 140,
  minHeight: 180,
  position: 'relative',
}

const imageStyle: CSSProperties = {
  position: 'absolute',
  inset: 0,
  width: '100%',
  height: '100%',
  objectFit: 'cover',
  display: 'block',
}

// Solid brand-tint media block — mirrors the sage-green image placeholders on
// the McKissock partner-offerings page (McKissock's olive primary tint).
const placeholderBlockStyle: CSSProperties = {
  background: 'var(--color-primary-200)',
}

// Photo-less hero fallback — a brand-gradient panel carrying the partner
// wordmark, so the lead card keeps its weight without a photo asset.
const heroAccentPanelStyle: CSSProperties = {
  flex: '1 1 300px',
  minHeight: 240,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '28px 32px',
  background:
    'linear-gradient(135deg, var(--color-primary-700), var(--color-primary-900))',
}

const accentWordmarkStyle: CSSProperties = {
  fontFamily: 'var(--font-heading)',
  fontSize: 26,
  fontWeight: 700,
  lineHeight: 1.15,
  letterSpacing: '0.02em',
  textAlign: 'center',
  color: 'var(--color-text-inverse)',
}

const heroBodyStyle: CSSProperties = {
  flex: '1 1 320px',
  display: 'flex',
  flexDirection: 'column',
  gap: 10,
  padding: '28px 32px',
}

const smallBodyStyle: CSSProperties = {
  flex: '1 1 200px',
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
  padding: '20px 22px',
}

// Partner's own brand mark — rendered as a compact uppercase wordmark since
// we don't ship the licensed logo artwork for the demo partners.
const brandLabelStyle: CSSProperties = {
  fontFamily: 'var(--font-heading)',
  fontSize: 13,
  fontWeight: 700,
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
  color: 'var(--color-primary-700)',
}

const heroTitleStyle: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-heading)',
  fontSize: 24,
  fontWeight: 700,
  lineHeight: 1.15,
  letterSpacing: '-0.01em',
}

const titleStyle: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-heading)',
  fontSize: 19,
  fontWeight: 700,
  lineHeight: 1.2,
  letterSpacing: '-0.01em',
}

const descriptionStyle: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-body)',
  fontSize: 14,
  lineHeight: 1.5,
  color: 'var(--color-text-secondary)',
}

const spacerStyle: CSSProperties = {
  flex: 1,
  minHeight: 12,
}

// Outlined action button matching the reference's "Learn More" chip.
const learnMoreButtonStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 4,
  alignSelf: 'flex-start',
  padding: '9px 18px',
  border: '1px solid var(--color-action)',
  borderRadius: 'var(--radius-sm)',
  color: 'var(--color-action)',
  fontFamily: 'var(--font-body)',
  fontSize: 14,
  fontWeight: 700,
  textDecoration: 'none',
}
