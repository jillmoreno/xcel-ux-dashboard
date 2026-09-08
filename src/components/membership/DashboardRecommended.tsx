import type { CSSProperties } from 'react'
import { Link } from 'react-router-dom'
import { Podcast, StarSolid } from '@/icons'
import { useAccount } from '@/context/AccountContext'
import { useFeatureFlag } from '@/context/FeatureFlagContext'
import {
  dashboardRecommendedFor,
  type PassportRecommendation,
} from '@/data/membership/passportRecommendedFixtures'
import { RecommendedTile } from './v2/RecommendedForYouStrip'
import { SummaryEyebrow } from './v2/passportShared'
import { useWidgetColor } from './v5/widgetColorUtil'

/**
 * "Recommended for you" widget for the Dashboard Rebrand overview — sits to the
 * RIGHT of the (vertically stacked) Featured Products widget. The `SummaryEyebrow`
 * heading (compact card-header style, matching Jump Back In) over a **3-up** grid (auto-fit, wraps on small screens) of square
 * tiles: the **top 2 podcasts** (as flat secondary-color "podcast spotlight"
 * tiles — icon + watermark + title + `Podcast · ★ rating` meta) then **4
 * interest-based** image tiles. Data + Elite-only gating live in
 * `dashboardRecommendedFor`; self-hides when the brand has no recommendations.
 */
export function DashboardRecommended() {
  const { brand } = useAccount()
  const items = dashboardRecommendedFor(brand)
  // NOTE: this 6-tile widget is no longer rendered on the dashboard (the
  // full-bleed `DashboardRecommendedBand` replaced it). The old
  // `dashboard-recommended-color` flag that once drove it — then the band's
  // background — has been REMOVED (the band is now hardcoded to the transparent
  // "none" background). `useFeatureFlag` returns a safe disabled fallback for
  // the unknown key, so this archived widget simply renders nothing. If it's
  // ever resurrected, give it its own color flag.
  const flag = useFeatureFlag('dashboard-recommended-color')
  const p = useWidgetColor(flag.variant)
  if (!flag.enabled || items.length === 0) return null
  return (
    <section
      aria-label="Recommended for you"
      style={{ ...wrapStyle, background: p.surface, border: p.border }}
    >
      <SummaryEyebrow color={p.eyebrow}>Recommended for you</SummaryEyebrow>
      <div style={gridStyle}>
        {items.map((item) =>
          // Podcasts use the flat secondary "spotlight" tile; everything else
          // keeps the square image tile.
          item.kind === 'podcast' ? (
            <PodcastSpotlightTile key={item.id} item={item} />
          ) : (
            <RecommendedTile key={item.id} item={item} square />
          ),
        )}
      </div>
    </section>
  )
}

/**
 * Flat square podcast tile (the "Podcast spotlight" design) in the Elite
 * secondary (teal) color: a corner podcast badge + a large faded podcast
 * watermark + the title and a `Podcast · ★ rating` meta row at the bottom.
 * No artwork — podcasts read as a branded audio tile rather than a photo card.
 */
function PodcastSpotlightTile({ item }: { item: PassportRecommendation }) {
  return (
    <Link
      to={item.href}
      aria-label={item.title}
      className="cre-recommended-simple-card"
      style={tileStyle}
      onMouseEnter={hoverIn}
      onMouseLeave={hoverOut}
    >
      {/* Large faded watermark. */}
      <Podcast
        size={118}
        aria-hidden
        style={{
          position: 'absolute',
          top: 4,
          left: '50%',
          transform: 'translateX(-28%)',
          color: 'var(--color-text-inverse)',
          opacity: 0.14,
          pointerEvents: 'none',
        }}
      />
      {/* Corner badge. */}
      <span aria-hidden style={badgeStyle}>
        <Podcast size={16} aria-hidden />
      </span>

      <div style={footerStyle}>
        <span style={titleStyle}>{item.title}</span>
        <span style={metaStyle}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, minWidth: 0 }}>
            <Podcast size={11} aria-hidden style={{ flexShrink: 0 }} />
            Podcast
          </span>
          <span aria-hidden style={metaDividerStyle} />
          <span
            style={{ display: 'inline-flex', alignItems: 'center', gap: 3, flexShrink: 0 }}
            aria-label={`Rated ${item.rating} out of 5`}
          >
            <StarSolid size={11} aria-hidden style={{ color: 'var(--color-warning-500)' }} />
            {item.rating.toFixed(1)}
          </span>
        </span>
      </div>
    </Link>
  )
}

function hoverIn(e: React.MouseEvent<HTMLElement>) {
  e.currentTarget.style.boxShadow = '0 6px 18px rgb(0 0 0 / 0.16)'
  e.currentTarget.style.transform = 'scale(1.005)'
}
function hoverOut(e: React.MouseEvent<HTMLElement>) {
  e.currentTarget.style.boxShadow = 'var(--shadow-card)'
  e.currentTarget.style.transform = 'none'
}

/* ─── styles (tokens only) ───────────────────────────────────────────── */

// Card chrome matching the Featured Products widget (`radius-lg` / `20px 24px
// 24px` padding) so the two discovery-row widgets read as a matched pair. The
// surface + border come from the color-wheel palette (`dashboard-recommended-color`).
const wrapStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 16,
  borderRadius: 'var(--radius-lg)',
  padding: '20px 24px 24px',
}

// 3-up by default (the widget sits in the ~half-width right column, so the
// tiles run compact like the reference); `auto-fit` wraps to 2 / 1 when the
// column is too narrow for three.
const gridStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(112px, 1fr))',
  gap: 14,
}

const tileStyle: CSSProperties = {
  position: 'relative',
  height: 172,
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'flex-end',
  padding: 14,
  boxSizing: 'border-box',
  borderRadius: 'var(--radius-lg)',
  overflow: 'hidden',
  textDecoration: 'none',
  background: 'var(--color-secondary-700)',
  color: 'var(--color-text-inverse)',
  boxShadow: 'var(--shadow-card)',
  transition: 'transform 160ms ease, box-shadow 160ms ease',
}

const badgeStyle: CSSProperties = {
  position: 'absolute',
  top: 12,
  left: 12,
  width: 30,
  height: 30,
  borderRadius: 'var(--radius-md)',
  background: 'rgb(255 255 255 / 0.16)',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
}

const footerStyle: CSSProperties = {
  position: 'relative',
  zIndex: 1,
  display: 'flex',
  flexDirection: 'column',
  gap: 4,
}

const titleStyle: CSSProperties = {
  fontFamily: 'var(--font-heading)',
  fontWeight: 700,
  fontSize: 13,
  lineHeight: '16px',
  color: 'var(--color-text-inverse)',
  display: '-webkit-box',
  WebkitBoxOrient: 'vertical',
  WebkitLineClamp: 2,
  overflow: 'hidden',
}

const metaStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  flexWrap: 'nowrap',
  minWidth: 0,
  fontFamily: 'var(--font-body)',
  fontSize: 11,
  fontWeight: 500,
  color: 'color-mix(in srgb, var(--color-text-inverse) 88%, transparent)',
}

const metaDividerStyle: CSSProperties = {
  flexShrink: 0,
  width: 1,
  height: 10,
  background: 'color-mix(in srgb, var(--color-text-inverse) 40%, transparent)',
}
