import { useState, type ComponentType } from 'react'
import { Link } from 'react-router-dom'
import { Award, FileText, Library, Podcast } from '@/icons'
import { useLoFi } from '@/context/LoFiContext'
import { LoFiWidgetBody } from '@/components/lo-fi/LoFiPlaceholders'

type IconCmp = ComponentType<{ size?: number }>

type QuickLink = {
  id: string
  label: string
  caption: string
  href: string
  Icon: IconCmp
}

/**
 * Mixed shortcut tiles — learning + account in one place. Order is
 * loosely "most likely to need next": Catalog (find new courses),
 * Resource Library (resources / passport), Podcasts (alternate format),
 * Certificates (review completed coursework).
 *
 * Routes intentionally point at pages already in the app shell so the
 * tile clicks always land somewhere meaningful (vs. the placeholder
 * routes under /account/* that still render PlaceholderPage).
 */
const QUICK_LINKS: QuickLink[] = [
  {
    id: 'catalog',
    label: 'Catalog',
    caption: 'Browse new courses',
    href: '/catalog',
    Icon: Library,
  },
  {
    id: 'learning-library',
    label: 'Resource Library',
    caption: 'Explore Resources',
    // No dedicated /library index route yet — route to the same Resources
    // destination the Member Benefits "Resources Library" tile uses so the
    // tile lands somewhere real until that index ships.
    href: '/resources/r-cre-disclosure-guide',
    Icon: FileText,
  },
  {
    id: 'podcasts',
    label: 'Podcasts',
    caption: 'Listen on the go',
    href: '/my-learning/podcasts',
    Icon: Podcast,
  },
  {
    id: 'certificates',
    label: 'Certificates',
    caption: 'View Completions',
    href: '/my-learning/certificates',
    Icon: Award,
  },
]

/**
 * Dashboard V2 — Quick Links sidebar tile.
 *
 * Lives in the right sidebar above the "What's New" / Premium
 * Membership cards. Renders a 2×2 grid of square tiles with the icon
 * medallion top-left and the label + caption stacked bottom-left
 * (Option B from `explorations/quick-links-redesign/quick-links-tiles.html`).
 * Each tile is a `<Link>` so the whole square is the hit target.
 */
export function QuickLinksCard({ variant = 'v2' }: { variant?: 'v2' | 'v3' } = {}) {
  const { loFi } = useLoFi()
  if (loFi) {
    return (
      <section
        aria-label="Quick links"
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
          padding: '16px 20px',
          background: 'var(--color-surface-card)',
          border: '1px solid var(--color-border-subtle)',
          borderRadius: 'var(--radius-lg)',
        }}
      >
        <LoFiWidgetBody rows={5} ariaLabel="Lo-fi quick links widget" />
      </section>
    )
  }
  return (
    <section
      aria-label="Quick links"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        padding: '16px 20px',
        background: 'var(--color-surface-card)',
        border: '1px solid var(--color-border-subtle)',
        borderRadius: 'var(--radius-lg)',
      }}
    >
      <span
        style={{
          fontFamily: 'var(--font-body)',
          fontSize: 11,
          fontWeight: 600,
          letterSpacing: '0.04em',
          textTransform: 'uppercase',
          color: 'var(--color-text-secondary)',
        }}
      >
        Quick Links
      </span>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: 10,
        }}
      >
        {QUICK_LINKS.map((link) => (
          <QuickLinkTile key={link.id} link={link} variant={variant} />
        ))}
      </div>
    </section>
  )
}

function QuickLinkTile({ link, variant = 'v2' }: { link: QuickLink; variant?: 'v2' | 'v3' }) {
  const isV3 = variant === 'v3'
  const { Icon } = link
  // Local hover state — same useState-driven pattern the rest of this
  // file used for the previous QuickLinkRow, so the tile chrome can
  // animate border/lift/wash together without leaning on a stylesheet.
  const [hovered, setHovered] = useState(false)
  return (
    <Link
      to={link.href}
      aria-label={`${link.label} — ${link.caption}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setHovered(true)}
      onBlur={() => setHovered(false)}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        // V2 keeps the square 1:1 tile with icon top + text bottom.
        // V3 collapses to a rectangle — the gap between the icon and
        // the label/caption stack tightens and the tile sizes to its
        // content height rather than forcing a square.
        ...(isV3
          ? { gap: 6 }
          : { justifyContent: 'space-between', gap: 12, aspectRatio: '1 / 1' }),
        padding: 12,
        background: hovered
          ? 'color-mix(in srgb, var(--color-primary-500) 4%, white)'
          : 'var(--color-surface-card)',
        border: `1px solid ${
          hovered ? 'var(--color-primary-500)' : 'var(--color-border-subtle)'
        }`,
        borderRadius: 'var(--radius-md)',
        textDecoration: 'none',
        color: 'var(--color-text-primary)',
        boxShadow: hovered ? 'var(--shadow-card)' : 'none',
        transform: hovered ? 'translateY(-1px)' : 'none',
        transition:
          'background 160ms ease, border-color 160ms ease, box-shadow 160ms ease, transform 160ms ease',
      }}
    >
      {/* Medallion — same colors as today's row medallion but does NOT
          invert on hover. The tile's border + lift + soft wash already
          carries the "tappable" affordance; flipping the medallion at
          the same time double-signals and adds visual noise. */}
      <span
        aria-hidden
        style={{
          width: 32,
          height: 32,
          flexShrink: 0,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 'var(--radius-sm)',
          background: 'color-mix(in srgb, var(--color-primary-500) 12%, white)',
          color: 'var(--color-primary-700)',
        }}
      >
        <Icon size={18} />
      </span>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
          minWidth: 0,
          width: '100%',
        }}
      >
        <span
          style={{
            fontFamily: 'var(--font-heading)',
            fontSize: 14,
            fontWeight: 500,
            lineHeight: '16px',
            color: 'var(--color-text-primary)',
          }}
        >
          {link.label}
        </span>
        <span
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: 11,
            fontWeight: 400,
            lineHeight: '14px',
            color: 'var(--color-text-secondary)',
            // "Renewals & status" / "Explore Resources" sit on the edge
            // at ~130px tile width — guarantee graceful truncation.
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            width: '100%',
          }}
        >
          {link.caption}
        </span>
      </div>
    </Link>
  )
}
