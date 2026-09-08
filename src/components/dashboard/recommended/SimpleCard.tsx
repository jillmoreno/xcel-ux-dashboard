import { Link } from 'react-router-dom'
import { Lock, StarSolid } from '@/icons'

/**
 * Spotify-style "shelf" card used across every row of the dashboard's
 * Recommended for You tab. A full-bleed square image with a
 * primary-colored bar across the bottom that holds the title, plus a
 * small type icon in the top-left corner so the format reads at a glance.
 *
 * When `imageUrl` is missing (e.g. catalog podcasts, which don't ship
 * cover art), the card falls back to a solid tinted block + a faded
 * background-decoration version of `Icon`, mirroring the
 * `cre-tile-header--tertiary` treatment from the catalog's `PodcastCard`.
 *
 * Replaces the previous mix of `CourseCard` / `IndividualCourseCard` /
 * `PodcastCard` / `SeriesCard` / `UrgentCourseCard` / `LockedPreviewCard`
 * inside the recommended panel. The richer cards stay in use on the
 * Catalog page and My Courses surfaces — only the dashboard recommendation
 * shelves get the simplified treatment.
 */

type BaseProps = {
  imageUrl?: string
  title: string
  /** Small icon component shown top-left (and, when no image is set,
   *  again as a large faded decoration in the upper-right of the image
   *  area). */
  Icon?: React.ComponentType<{ size?: number; style?: React.CSSProperties }>
  /** Override the bottom bar background. Defaults to `--color-primary-700`.
   *  The Renew-Before / "course-urgent" shelf passes `--color-warning-700`,
   *  the Podcast Spotlight passes `--color-tertiary-700`. */
  barColor?: string
  /** Override the icon badge background and (when no image is set) the
   *  card body color. Mirrors `barColor` semantics. */
  iconBg?: string
  /** Lock overlay (60% white wash + centered padlock + "Member only" pill).
   *  Used by the Unlock with Premium shelf's locked-preview cards. */
  locked?: boolean
  /** Optional bottom-bar meta row (type icon + label · gold star + rating),
   *  matching `RecommendedTile`. When set, the title bar grows to a two-line
   *  stack (title over meta) — used by the Dashboard Rebrand's full-bleed
   *  Recommended band. Omitted everywhere else (title-only bar, unchanged).
   *  `rating` is optional: course tiles pass it (format · ★ rating); product
   *  types without a rating (membership / package / career tool) pass just the
   *  type label, so the meta row reads as a clean type tag. */
  meta?: {
    Icon: React.ComponentType<{ size?: number; style?: React.CSSProperties }>
    label: string
    rating?: number
    /** Optional price shown in the meta row **in place of** the star rating —
     *  the non-member "buying signal" treatment. When set, the price segment
     *  renders instead of the rating (driven by the `dashboard-shelf-card-meta`
     *  flag on the Dashboard Rebrand Recommended band). */
    price?: number
  }
  /** Optional small corner tag on the media (e.g. "Member Exclusive" on the
   *  Rubi career-tool tiles). Styled to match the What's New "NEW" pill — a
   *  magenta `cta-500` square tag with white text. */
  flag?: string
  /** "Bannerless" treatment — drop the solid brand-colored bottom bar and
   *  instead overlay the title + meta on the cover image behind a dark gradient
   *  scrim (the What's-Trending look, but with the shelf card's format · rating
   *  meta). Used by the Dashboard Rebrand Recommended band's "Shelf (image
   *  tiles)" card style. Everywhere else keeps the solid bar (default). */
  bannerless?: boolean
}

type Props =
  | (BaseProps & { to: string; onClick?: never })
  | (BaseProps & { onClick: () => void; to?: never })

export function SimpleCard(props: Props) {
  const { imageUrl, title, Icon, locked, meta, flag, bannerless } = props
  const barColor = props.barColor ?? 'var(--color-primary-700)'
  const iconBg = props.iconBg ?? 'var(--color-primary-700)'
  // Bannerless cards drop the solid bar and float the title/meta over the image
  // behind a gradient, so the text is always-white (theme-independent, like the
  // VibrantCard) rather than the bar's `--color-text-inverse`.
  const titleColor = bannerless ? 'rgb(255 255 255 / 0.98)' : 'var(--color-text-inverse)'
  const metaColor = bannerless
    ? 'rgb(255 255 255 / 0.9)'
    : 'color-mix(in srgb, var(--color-text-inverse) 88%, transparent)'
  const dividerColor = bannerless
    ? 'rgb(255 255 255 / 0.5)'
    : 'color-mix(in srgb, var(--color-text-inverse) 40%, transparent)'
  // When there's no image, the card body is filled with `iconBg` — so the
  // top-left icon badge would disappear if it used the same color. Darken
  // the badge 30% in that case so the icon's glyph + circle both read.
  const badgeBg = imageUrl ? iconBg : `color-mix(in srgb, ${iconBg} 70%, black)`

  const content = (
    <div
      className="cre-recommended-simple-card"
      style={{
        position: 'relative',
        width: '100%',
        aspectRatio: '1 / 1',
        borderRadius: 'var(--radius-lg)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        transition: 'transform 160ms ease, box-shadow 160ms ease',
        cursor: 'pointer',
      }}
    >
      {/* Image area takes the upper portion. Flex-grows so the title bar
          sticks to the bottom and the avatar can sit above it cleanly. */}
      <div
        style={{
          position: 'relative',
          flex: 1,
          background: imageUrl
            ? `center / cover no-repeat url(${imageUrl})`
            : iconBg,
          overflow: 'hidden',
        }}
      >
        {/* Faded background-icon decoration — mirrors the catalog
            PodcastCard's tile-header treatment. Only renders when there
            isn't a real image to anchor the card. */}
        {!imageUrl && Icon && (
          <Icon
            size={140}
            style={{
              position: 'absolute',
              top: -8,
              right: -16,
              color: 'var(--color-text-inverse)',
              opacity: 0.18,
            }}
          />
        )}

        {/* Top-left type icon, sits on a small filled circle so it reads
            against any underlying image. Suppressed when a `meta` row is
            present — the bottom meta row already shows the type icon + label,
            so the corner badge would be redundant (the Dashboard Rebrand's
            blended band always passes `meta`). */}
        {Icon && !meta && (
          <span
            aria-hidden
            style={{
              position: 'absolute',
              top: 10,
              left: 10,
              width: 26,
              height: 26,
              borderRadius: 'var(--radius-pill)',
              background: badgeBg,
              color: 'var(--color-text-inverse)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1,
            }}
          >
            <Icon size={14} />
          </span>
        )}

        {/* Optional corner flag (e.g. "Member Exclusive"), top-left where the
            type badge would sit. Matches the What's New "NEW" pill shape — a
            square tag (radius-sm) with white text — in teal `secondary-700`. */}
        {flag && (
          <span
            style={{
              position: 'absolute',
              top: 10,
              left: 10,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              height: 22,
              padding: '0 8px',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--color-secondary-700)',
              color: 'var(--color-text-inverse)',
              fontFamily: 'var(--font-body)',
              fontSize: 12,
              fontWeight: 600,
              lineHeight: '20px',
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              whiteSpace: 'nowrap',
              zIndex: 1,
            }}
          >
            {flag}
          </span>
        )}
      </div>

      {/* Contrast scrim (bannerless only) — a tall bottom-up dark gradient
          layer BEHIND the text. Because it extends well above the text box
          (72% of the card), the whole title/meta sits over a dark-enough base,
          so the white text clears WCAG AA (~4.5:1) over any cover image — not
          just the bottom line. */}
      {bannerless && (
        <div
          aria-hidden
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 0,
            height: '72%',
            background:
              'linear-gradient(to top, rgb(4 17 36 / 0.95) 0%, rgb(4 17 36 / 0.82) 34%, rgb(4 17 36 / 0.5) 62%, rgb(4 17 36 / 0) 100%)',
            pointerEvents: 'none',
          }}
        />
      )}

      {/* Bottom title bar — full-width, brand-tinted, white text. Sits as
          a flex sibling so the avatar above it can anchor to the image
          area's bottom edge regardless of how many lines the title takes.
          `minHeight: 40` keeps single-line bars the same height as the
          two-line ones (4 + 16 + 16 + 4 = 40), so adjacent cards in a
          shelf align even when titles fit on one line. */}
      <div
        style={{
          boxSizing: 'border-box',
          ...(bannerless
            ? {
                // Float over the image; the scrim layer above supplies the
                // contrast. `zIndex: 1` keeps the text above that scrim.
                position: 'absolute',
                left: 0,
                right: 0,
                bottom: 0,
                zIndex: 1,
              }
            : { background: barColor, minHeight: 40 }),
          ...(meta
            ? { padding: '8px 12px 10px', display: 'flex', flexDirection: 'column', gap: 4 }
            : { padding: '4px 12px', display: 'flex', alignItems: 'center' }),
        }}
      >
        <h4
          style={{
            margin: 0,
            fontFamily: 'var(--font-heading)',
            fontWeight: 700,
            fontSize: 13,
            lineHeight: '16px',
            color: titleColor,
            // Extra insurance over the scrim on bright images.
            textShadow: bannerless ? '0 1px 3px rgb(4 17 36 / 0.55)' : undefined,
            display: '-webkit-box',
            WebkitBoxOrient: 'vertical',
            WebkitLineClamp: 2,
            overflow: 'hidden',
            // Reserve two lines (2 × 16px) only on the SOLID-BAR meta cards, so
            // the bottom bar stays a uniform height across a shelf row even when
            // a title is one line. Bannerless cards anchor the title/meta block
            // to the card bottom (meta already aligns across cards), so reserving
            // a 2nd line there just leaves an empty gap under one-line titles —
            // let those hug their natural height instead.
            ...(meta && !bannerless ? { minHeight: 32 } : null),
          }}
        >
          {title}
        </h4>
        {meta && (
          // Type icon · label | gold star + rating — mirrors RecommendedTile.
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              flexWrap: 'nowrap',
              minWidth: 0,
              fontFamily: 'var(--font-body)',
              fontSize: 11,
              fontWeight: 500,
              color: metaColor,
              textShadow: bannerless ? '0 1px 2px rgb(4 17 36 / 0.5)' : undefined,
            }}
          >
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, minWidth: 0 }}>
              <meta.Icon size={11} style={{ flexShrink: 0 }} />
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {meta.label}
              </span>
            </span>
            {meta.price != null ? (
              // Price takes precedence over rating when set — the non-member
              // buying-signal treatment (`dashboard-shelf-card-meta` = auto/price).
              <>
                <span
                  aria-hidden
                  style={{
                    flexShrink: 0,
                    width: 1,
                    height: 10,
                    background: dividerColor,
                  }}
                />
                <span style={{ flexShrink: 0, fontWeight: 600 }}>{formatShelfPrice(meta.price)}</span>
              </>
            ) : (
              meta.rating != null && (
                <>
                  <span
                    aria-hidden
                    style={{
                      flexShrink: 0,
                      width: 1,
                      height: 10,
                      background: dividerColor,
                    }}
                  />
                  <span
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 3, flexShrink: 0 }}
                    aria-label={`Rated ${meta.rating} out of 5`}
                  >
                    <StarSolid size={11} aria-hidden style={{ color: 'var(--color-warning-500)' }} />
                    <span>{meta.rating.toFixed(1)}</span>
                  </span>
                </>
              )
            )}
          </span>
        )}
      </div>

      {locked && (
        // 60% white wash + centered padlock + "Member only" pill over the
        // image. Non-members get a clear visual signal that the content
        // is paywalled.
        <div
          aria-hidden
          style={{
            position: 'absolute',
            inset: 0,
            background: 'rgb(255 255 255 / 0.6)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            zIndex: 2,
          }}
        >
          <span
            style={{
              width: 36,
              height: 36,
              borderRadius: 'var(--radius-pill)',
              background: 'var(--color-tertiary-600)',
              color: 'var(--color-neutral-50)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Lock size={14} aria-hidden />
          </span>
          <span
            style={{
              padding: '3px 10px',
              borderRadius: 'var(--radius-pill)',
              background: 'var(--color-tertiary-600)',
              color: 'var(--color-neutral-50)',
              fontFamily: 'var(--font-body)',
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
            }}
          >
            Member only
          </span>
        </div>
      )}
    </div>
  )

  // Two click semantics: navigate via Link (course-progress, locked,
  // upsell) or open a sheet via button (course / podcast / series).
  if ('to' in props && props.to) {
    return (
      <Link
        to={props.to}
        aria-label={title}
        style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}
        onMouseEnter={hoverIn}
        onMouseLeave={hoverOut}
      >
        {content}
      </Link>
    )
  }
  return (
    <button
      type="button"
      onClick={props.onClick}
      aria-label={title}
      style={{
        background: 'transparent',
        border: 'none',
        padding: 0,
        margin: 0,
        textAlign: 'left',
        cursor: 'pointer',
        width: '100%',
      }}
      onMouseEnter={hoverIn}
      onMouseLeave={hoverOut}
    >
      {content}
    </button>
  )
}

// Whole-dollar prices render bare ($199); anything with cents keeps two
// decimals ($49.99). Keeps the meta row short on the compact shelf card.
function formatShelfPrice(price: number): string {
  return Number.isInteger(price) ? `$${price}` : `$${price.toFixed(2)}`
}

// Soft shadow + 1.005 scale on hover — matches the rest of the dashboard's
// interactive surfaces.
function hoverIn(e: React.MouseEvent<HTMLElement>) {
  const card = e.currentTarget.querySelector<HTMLElement>('.cre-recommended-simple-card')
  if (!card) return
  card.style.boxShadow = '0 6px 18px rgb(0 0 0 / 0.16)'
  card.style.transform = 'scale(1.005)'
}
function hoverOut(e: React.MouseEvent<HTMLElement>) {
  const card = e.currentTarget.querySelector<HTMLElement>('.cre-recommended-simple-card')
  if (!card) return
  card.style.boxShadow = 'none'
  card.style.transform = 'none'
}
