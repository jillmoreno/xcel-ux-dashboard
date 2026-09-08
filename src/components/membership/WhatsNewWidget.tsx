import type { CSSProperties, ComponentType } from 'react'
import { Link } from 'react-router-dom'
import { Monitor, Podcast, Users, Video } from '@/icons'
import { useAccount, type Brand } from '@/context/AccountContext'
import { useFeatureFlag } from '@/context/FeatureFlagContext'
import { ShelfScroller } from '@/components/dashboard/recommended/ShelfScroller'
import { imageForIndex } from '@/utils/courseImage'
import { Wrap } from './v2/passportShared'
import { CardBadgeOverlay } from './badged/CardBadgeOverlay'
import { deriveCardBadges, type CardBadges } from './badged/cardBadges'

/**
 * "What's Trending" dashboard widget — the image-forward carousel on the
 * Dashboard Rebrand overview (`MembershipOverview`, `showExtras`). The single
 * `dashboard-whats-new-layout` flag is a plain on/off switch that shows/hides
 * the whole section — the earlier layout + background variants were removed, so
 * the carousel is the only treatment.
 *
 * Full-bleed cover photos + bottom-up gradient scrim, title + meta (hours ·
 * delivery), and a play affordance for audio/video, scrolled with the SAME
 * `ShelfScroller` as "Recommended for you" (Figma node 291:13394). The section
 * title is caller-supplied ("What's Trending" on Marketing Focused, since its
 * top-band carousel already owns "What's New").
 */

type VibrantDelivery = 'online' | 'podcast' | 'video' | 'in-person'

type VibrantCardData = { title: string; hours: number; delivery: VibrantDelivery }

// Per-brand "What's Trending" cards. Real titles (replacing the earlier lo-fi
// "Feature Title" placeholders), themed to each brand and varied by delivery so
// the play affordance shows on audio/video. Elite/Fitzgerald share the nursing
// set; CRE/McKissock are real-estate + appraisal; STC is securities exam prep.
// TODO(data): swap for a real "trending" feed when the engagement service ships.
const CRE_CARDS: VibrantCardData[] = [
  { title: 'AI MasterTracks for Agents', hours: 3, delivery: 'online' },
  { title: 'Ethics on the Go', hours: 2, delivery: 'podcast' },
  { title: 'Listing in a Cooling Market', hours: 1, delivery: 'video' },
  { title: 'Certified Negotiation Expert', hours: 12, delivery: 'online' },
  { title: 'Open-House Safety Essentials', hours: 1, delivery: 'in-person' },
  { title: 'Fair Housing Deep Dive', hours: 2, delivery: 'podcast' },
]

// XCEL — the 3-Part Training Program's own artefacts (lessons, the Prep
// Review course, the three Exam Simulators) plus its named study tools.
const XCEL_CARDS: VibrantCardData[] = [
  { title: 'Life & Health Pre-License Course', hours: 4, delivery: 'online' },
  { title: 'Livestream Exam Review', hours: 6, delivery: 'in-person' },
  { title: 'On-Demand Lecture Videos', hours: 2, delivery: 'video' },
  { title: 'Prep Review Course', hours: 3, delivery: 'online' },
  { title: 'Exam Simulator 1', hours: 2, delivery: 'online' },
  { title: 'Exam Cram', hours: 1, delivery: 'video' },
]

const VIBRANT_CARDS_BY_BRAND: Record<Brand, VibrantCardData[]> = {
  xcel: XCEL_CARDS,
}

const VIBRANT_DELIVERY: Record<
  VibrantDelivery,
  { Icon: ComponentType<{ size?: number; 'aria-hidden'?: boolean }>; label: string }
> = {
  online: { Icon: Monitor, label: 'Online' },
  podcast: { Icon: Podcast, label: 'Podcast' },
  video: { Icon: Video, label: 'Video' },
  'in-person': { Icon: Users, label: 'In Person' },
}

export function WhatsNewWidget({
  title = "What's New",
  badged = false,
}: { title?: string; badged?: boolean } = {}) {
  const { brand } = useAccount()
  const { enabled } = useFeatureFlag('dashboard-whats-new-layout')
  if (!enabled) return null

  const cards = VIBRANT_CARDS_BY_BRAND[brand] ?? CRE_CARDS

  return (
    <section aria-label={title} style={{ paddingTop: 4 }}>
      <Wrap style={{ padding: 0 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {/* Large primary-500 section header — kept in sync with the
                Recommended band's header. */}
            <span style={sectionLeadHeaderStyle}>{title}</span>
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16 }}>
              <p style={ledeStyle}>
                The latest features, content, and tools.
              </p>
              <Link to="/catalog" style={seeAllStyle}>
                See All →
              </Link>
            </div>
          </div>
          <ShelfScroller label={title} cardWidth={{ desktop: 320, mobile: 260 }}>
            {cards.map((c, i) => (
              <VibrantCard
                key={i}
                image={imageForIndex(i)}
                title={c.title}
                hours={c.hours}
                delivery={c.delivery}
                badges={badged ? deriveCardBadges(`whats-trending-${i}`) : undefined}
              />
            ))}
          </ShelfScroller>
        </div>
      </Wrap>
    </section>
  )
}

/* ─── image card ─────────────────────────────────────────────────────────
   Full-bleed cover photo + bottom-up gradient scrim, with the title + meta
   (hours · delivery) bottom-left and a play affordance bottom-right for
   audio/video. On-image text uses `rgb(255 255 255 / x)` (always-white,
   theme-independent — the scrim is dark in both themes). */
function VibrantCard({
  image,
  title,
  hours,
  delivery,
  badges,
}: {
  image: string
  title: string
  hours: number
  delivery: VibrantDelivery
  /** Tier + status badge overlay (the "Badged Version" dashboard). */
  badges?: CardBadges
}) {
  const { Icon, label } = VIBRANT_DELIVERY[delivery]
  const hasPlay = delivery === 'podcast' || delivery === 'video'
  return (
    <div style={{ ...cardStyle, backgroundImage: `url(${image})` }}>
      <div aria-hidden style={scrimStyle} />
      {badges && <CardBadgeOverlay badges={badges} />}
      <div style={contentStyle}>
        <div style={{ minWidth: 0 }}>
          <h3 style={titleStyle}>{title}</h3>
          <div style={metaStyle}>
            <span style={{ whiteSpace: 'nowrap' }}>
              {hours} {hours === 1 ? 'Hour' : 'Hours'}
            </span>
            <span aria-hidden style={metaDivider} />
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap' }}>
              <Icon size={14} aria-hidden />
              {label}
            </span>
          </div>
        </div>
        {hasPlay && (
          <span aria-hidden style={playBtnStyle}>
            <span style={playTriangleStyle} />
          </span>
        )}
      </div>
    </div>
  )
}

/* ─── styles (tokens only) ───────────────────────────────────────────── */

// Large accent section header — shared visual with the Recommended band's
// header (DashboardRecommendedBand keeps a matching `eyebrowStyle` fed by the
// same `--color-accent-text` token for its light variants). Keep the two in
// sync. The accent token clears AA on white and lifts to a lighter stop when
// the widget card flips to navy in dark mode.
const sectionLeadHeaderStyle: CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontSize: 18,
  fontWeight: 700,
  letterSpacing: '0.04em',
  textTransform: 'uppercase',
  color: 'var(--color-accent-text)',
}

const ledeStyle: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-body)',
  fontSize: 13,
  lineHeight: '20px',
  color: 'var(--color-text-secondary)',
}

// "See All →" — magenta CTA link in the carousel header. Uses the
// contrast-aware `--color-accent-link` token (deep magenta on the light card,
// light pink when the card flips to navy in dark mode) so it clears AA on both
// — the flat cta-500 failed on white for McKissock and on navy in dark.
const seeAllStyle: CSSProperties = {
  flexShrink: 0,
  fontFamily: 'var(--font-body)',
  fontSize: 13,
  fontWeight: 600,
  color: 'var(--color-accent-link)',
  textDecoration: 'none',
  whiteSpace: 'nowrap',
}

const cardStyle: CSSProperties = {
  position: 'relative',
  width: '100%',
  height: 190,
  borderRadius: 'var(--radius-lg)',
  overflow: 'hidden',
  backgroundSize: 'cover',
  backgroundPosition: 'center',
  backgroundRepeat: 'no-repeat',
}

const scrimStyle: CSSProperties = {
  position: 'absolute',
  inset: 0,
  background:
    'linear-gradient(to top, rgb(0 0 0 / 0.82) 0%, rgb(0 0 0 / 0.18) 52%, rgb(0 0 0 / 0) 78%)',
}

const contentStyle: CSSProperties = {
  position: 'absolute',
  left: 16,
  right: 16,
  bottom: 14,
  display: 'flex',
  alignItems: 'flex-end',
  justifyContent: 'space-between',
  gap: 12,
}

const titleStyle: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-heading)',
  fontSize: 18,
  fontWeight: 700,
  lineHeight: 1.2,
  color: 'rgb(255 255 255 / 0.98)',
  display: '-webkit-box',
  WebkitLineClamp: 2,
  WebkitBoxOrient: 'vertical',
  overflow: 'hidden',
}

const metaStyle: CSSProperties = {
  marginTop: 6,
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  fontFamily: 'var(--font-body)',
  fontSize: 13,
  fontWeight: 500,
  color: 'rgb(255 255 255 / 0.92)',
}

const metaDivider: CSSProperties = {
  width: 1,
  height: 12,
  background: 'rgb(255 255 255 / 0.5)',
}

const playBtnStyle: CSSProperties = {
  flexShrink: 0,
  width: 40,
  height: 40,
  borderRadius: 'var(--radius-pill)',
  // Slightly translucent so the cover image reads faintly through the disc.
  background: 'color-mix(in srgb, var(--color-cta-500) 85%, transparent)',
  color: 'rgb(255 255 255 / 1)',
  display: 'grid',
  placeItems: 'center',
  boxShadow: '0 2px 8px rgb(0 0 0 / 0.3)',
}

const playTriangleStyle: CSSProperties = {
  width: 0,
  height: 0,
  marginLeft: 3,
  borderTop: '7px solid transparent',
  borderBottom: '7px solid transparent',
  borderLeft: '11px solid currentColor',
}
