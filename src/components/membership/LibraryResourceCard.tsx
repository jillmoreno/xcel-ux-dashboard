import type { CSSProperties } from 'react'
import { Link } from 'react-router-dom'
import { StarSolid } from '@/icons'
import { Card } from '@/components/ui/Card'
import { LoFiCardBody } from '@/components/lo-fi/LoFiPlaceholders'
import { useLoFi } from '@/context/LoFiContext'
import { LIBRARY_TYPE_ICON } from './libraryTypeIcon'
import {
  TYPE_LABELS,
  type LibraryResource,
} from '@/data/membership/libraryFixtures'

/**
 * Library resource card — used by the Resource Library grid on
 * `/membership?tab=library`.
 *
 *   ┌──────────────────────────────────────────────┐
 *   │  ▓▓▓▓▓ heroBackground gradient ▓▓▓▓▓        │   ← image header (138px)
 *   │  ▓  HEROLABEL  ▓                             │
 *   │  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ │
 *   │ ( Type badge )                               │
 *   │ Title — up to 2 lines, 14/600                │
 *   │ Description — up to 3 lines, 12/regular     │
 *   │ ─────────────────────────────────────────── │   ← divider
 *   │ ★ 4.8     (optional tag pill)                │   ← footer
 *   └──────────────────────────────────────────────┘
 *
 * Anatomy mirrors `<CompactCourseCard>` (image header → body →
 * footer) so the library grid feels visually consistent with My
 * Courses / Catalog grids. Differences:
 *
 *   - The image header is a CSS gradient + a big wordmark instead of
 *     a stock photo, since the platform doesn't ship licensed library
 *     artwork yet. Each resource defines its own gradient + accent +
 *     label in the fixture so cards stay visually distinct.
 *   - The metadata row is replaced by a single "Type" pill (top of
 *     the body) — Infographic / Video / Guide / Q&A Session.
 *   - The footer pairs a star rating with an optional content tag
 *     ("Injections", "EKG") instead of a status + progress bar.
 *
 * Routes to the existing `/resources/:id` detail page on click.
 */
type Props = {
  data: LibraryResource
}

export function LibraryResourceCard({ data }: Props) {
  const { loFi } = useLoFi()
  // Lo-Fi: keep the outer Card shell + dimensions so the library
  // grid layout stays intact; strip the body.
  if (loFi) {
    return (
      <Card className="cre-library-card" style={cardStyle}>
        <LoFiCardBody ariaLabel="Lo-fi library resource card" />
      </Card>
    )
  }

  // When the resource ships with a hero image asset (Elite skill-
  // refresher set), render it cover-fit over the hero block and skip
  // the wordmark. Otherwise fall back to the gradient + heroLabel
  // treatment used by the brands that don't have artwork yet.
  const heroBackground = data.imageUrl
    ? `center / cover no-repeat url("${data.imageUrl}")`
    : data.heroBackground

  // Content-type glyph shown beside the type label — mirrors the icon on the
  // Dashboard's "Recommended for You" cards.
  const TypeIcon = LIBRARY_TYPE_ICON[data.type]

  return (
    <Card className="cre-library-card" style={cardStyle}>
      <div
        aria-hidden
        style={{
          ...heroBlockStyle,
          background: heroBackground,
        }}
      >
        {!data.imageUrl && (
          <span style={{ ...heroLabelStyle, color: data.heroAccent }}>
            {data.heroLabel}
          </span>
        )}
      </div>

      <div style={bodyStyle}>
        <span style={typeBadgeStyle}>
          <TypeIcon size={12} aria-hidden style={{ flexShrink: 0 }} />
          {TYPE_LABELS[data.type]}
        </span>

        <Link
          to={`/resources/${data.id}`}
          style={titleStyle}
          className="cre-library-card-title"
        >
          {data.title}
        </Link>

        <p style={descriptionStyle}>{data.description}</p>

        <div style={spacerStyle} />

        <div aria-hidden style={dividerStyle} />

        <div style={footerStyle}>
          <span
            aria-label={`Rating ${data.rating.toFixed(1)} out of 5`}
            style={ratingStyle}
          >
            <StarSolid
              size={14}
              aria-hidden
              style={{ color: 'var(--color-warning-500)' }}
            />
            {data.rating.toFixed(1)}
          </span>
          {data.tag && <span style={tagPillStyle}>{data.tag}</span>}
        </div>
      </div>
    </Card>
  )
}

/* ─── styles ───────────────────────────────────────────────────────── */

const cardStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  // Fill the grid track (the flexible `gridStyle` sizes columns); `minWidth: 0`
  // lets the card shrink to the track so 3 fit across the results column.
  minWidth: 0,
  // Slightly shorter than CourseCard (no progress bar / kebab) — the
  // card is dense enough at this height without forcing extra
  // whitespace at the bottom.
  minHeight: 348,
}

const heroBlockStyle: CSSProperties = {
  position: 'relative',
  height: 138,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  // Card has overflow:hidden via the `Card` primitive; the hero
  // block fills the top edge corner-to-corner.
  padding: '12px 18px',
}

const heroLabelStyle: CSSProperties = {
  fontFamily: 'var(--font-heading)',
  fontSize: 22,
  fontWeight: 700,
  letterSpacing: '0.04em',
  lineHeight: 1.1,
  textAlign: 'center',
  textTransform: 'uppercase',
  textShadow: '0 1px 0 rgba(0, 0, 0, 0.08)',
}

const bodyStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
  padding: '14px 16px 16px',
  flex: 1,
}

const typeBadgeStyle: CSSProperties = {
  alignSelf: 'flex-start',
  display: 'inline-flex',
  alignItems: 'center',
  gap: 5,
  height: 22,
  padding: '0 10px',
  borderRadius: 'var(--radius-pill)',
  border: '1px solid var(--color-border-subtle)',
  background: 'var(--color-surface-card)',
  color: 'var(--color-text-secondary)',
  fontFamily: 'var(--font-body)',
  fontSize: 11,
  fontWeight: 600,
}

const titleStyle: CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontSize: 14,
  fontWeight: 600,
  lineHeight: '20px',
  // Color intentionally omitted — `.cre-library-card-title` inherits
  // from the card root so the title participates in the card's
  // neutral-800 → neutral-950 hover transition. See tokens.css.
  textDecoration: 'none',
  // 2-line clamp — mirrors the CourseCard title behavior.
  display: '-webkit-box',
  WebkitLineClamp: 2,
  WebkitBoxOrient: 'vertical',
  overflow: 'hidden',
  minHeight: 40,
}

const descriptionStyle: CSSProperties = {
  // Extra top margin (in addition to the body's 8px flex gap) gives
  // breathing room between the title and description — total
  // separation = 16px. Keeps the title visually anchored above the
  // body copy without bleeding into it.
  margin: '8px 0 0',
  fontFamily: 'var(--font-body)',
  fontSize: 12,
  lineHeight: '18px',
  color: 'var(--color-text-secondary)',
  // 3-line clamp so the card height stays bounded for the noisiest
  // copy in the fixture. Combined with the matching `minHeight: 54`
  // below (3 lines × 18px line-height), every description reserves
  // exactly three lines worth of vertical space — short copy still
  // takes up the same height as a 3-line wrap, which keeps every
  // card in the grid the same overall height regardless of
  // description length.
  display: '-webkit-box',
  WebkitLineClamp: 3,
  WebkitBoxOrient: 'vertical',
  overflow: 'hidden',
  minHeight: 54,
}

const spacerStyle: CSSProperties = {
  // Pushes the divider + footer to the bottom of the card so cards
  // with shorter descriptions don't end up with floating ratings.
  flex: 1,
  minHeight: 8,
}

const dividerStyle: CSSProperties = {
  height: 1,
  background: 'var(--color-border-subtle)',
  marginBottom: 10,
}

const footerStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 8,
}

const ratingStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  fontFamily: 'var(--font-body)',
  fontSize: 13,
  fontWeight: 600,
  // Inherits from `.cre-library-card` so the rating numeric darkens
  // alongside the title on hover. The star icon keeps its own
  // warning-amber inline color.
  color: 'inherit',
}

const tagPillStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  height: 22,
  padding: '0 10px',
  borderRadius: 'var(--radius-pill)',
  background: 'var(--color-neutral-100)',
  color: 'var(--color-text-secondary)',
  fontFamily: 'var(--font-body)',
  fontSize: 11,
  fontWeight: 600,
}
