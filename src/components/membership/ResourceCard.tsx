import type { CSSProperties } from 'react'
import { ArrowUpRightFromSquare, Blog, BookOpen, Megaphone, Facebook, Podcast } from '@/icons'
import { Card } from '@/components/ui/Card'
import { LoFiCardBody } from '@/components/lo-fi/LoFiPlaceholders'
import { useLoFi } from '@/context/LoFiContext'
import { useTheme } from '@/context/ThemeContext'
import type { Resource, ResourceIcon } from '@/data/membership/resourcesFixtures'
import { MAX_RESOURCE_DESCRIPTION_CHARS } from '@/data/membership/resourcesFixtures'

/**
 * Resource card — an outbound link (blog, podcast, …) styled to match the VIP
 * Partner Offering card (`PartnerOfferingCard`): a top plate, name, clamped
 * description, divider, and a CTA. The plate holds a tinted icon instead of a
 * partner logo, and the CTA is an external link (opens in a new tab, with the
 * arrow-up-right-from-square affordance) rather than an in-app route.
 *
 * There is deliberately NO locked variant. This card only ever renders on the
 * Free Content page, where every item is free to members and non-members alike;
 * a "Member Exclusive" pill here would contradict the page it sits on. A
 * member-only resource belongs on the Membership page instead — see
 * `MembershipCommunityBand`.
 *
 * Reuses `.cre-library-card` so it picks up the same hover-zoom-color
 * transition as the catalog / library / partner cards.
 */
type Props = {
  data: Resource
  /** The Atlas/Compass treatment (2026-10-01, the designer's request): the Home
   *  course card's surface and stroke, a tinted plate in the brand's button
   *  colour, a serif title (Serif H8) and the CTA in the page's link ink. */
  compass?: boolean
}

const ICONS: Record<ResourceIcon, typeof Blog> = {
  blog: Blog,
  book: BookOpen,
  megaphone: Megaphone,
  podcast: Podcast,
  facebook: Facebook,
}

/**
 * Enforce the description budget. Copy should already be authored within the
 * limit; this is a defensive hard-cap so an over-length blurb can't blow past
 * the card's 4-line clamp. Trims at a word boundary and appends an ellipsis.
 */
function clampDescription(text: string): string {
  if (text.length <= MAX_RESOURCE_DESCRIPTION_CHARS) return text
  const slice = text.slice(0, MAX_RESOURCE_DESCRIPTION_CHARS)
  const lastSpace = slice.lastIndexOf(' ')
  return `${(lastSpace > 0 ? slice.slice(0, lastSpace) : slice).trimEnd()}…`
}

export function ResourceCard({ data, compass = false }: Props) {
  const { loFi } = useLoFi()
  // The CTA link color (`.cre-resource-cta` + inline accent-link) bakes to the
  // navy default in this subtree and fails on the dark surface. Dark mode only
  // renders on the rebrand shell (seeded to Elite), so pin the CTA to Elite's
  // light-pink CTA stop (cta-200) there — a literal that can't bake. #1
  const dark = useTheme().theme === 'dark'
  if (loFi) {
    return (
      <Card className="cre-library-card" style={cardStyle}>
        <LoFiCardBody ariaLabel="Lo-fi resource card" />
      </Card>
    )
  }
  const Icon = ICONS[data.icon]

  return (
    <Card
      className={compass ? 'cre-library-card cre-compass-resource-card' : 'cre-library-card'}
      style={compass ? { ...cardStyle, ...compassCardStyle } : cardStyle}
    >
      <div style={plateAreaStyle}>
        <span
          aria-hidden
          className={compass ? 'cre-resource-plate cre-compass-resource-plate' : 'cre-resource-plate'}
          style={iconPlateStyle}
        >
          <Icon size={26} />
        </span>
      </div>

      <div style={bodyStyle}>
        <h3 style={compass ? compassNameStyle : nameStyle} className="cre-library-card-title">
          {data.title}
        </h3>
        <p style={compass ? { ...descriptionStyle, color: 'var(--color-compass-page-muted)' } : descriptionStyle}>
          {clampDescription(data.description)}
        </p>

        <div style={spacerStyle} />
        <div
          aria-hidden
          style={compass ? { ...dividerStyle, background: 'var(--color-compass-page-card-rule)' } : dividerStyle}
        />

        <a
          href={data.href}
          target="_blank"
          rel="noopener noreferrer"
          className={compass ? 'cre-resource-cta cre-compass-resource-cta' : 'cre-resource-cta'}
          style={
            compass
              ? { ...ctaStyle, color: 'var(--color-atlas-cta-ink, var(--color-accent-link))' }
              : dark
              ? { ...ctaStyle, color: '#d9b5d5' }
              : ctaStyle
          }
          aria-label={`${data.cta}: ${data.title} (opens in a new tab)`}
        >
          {data.cta}
          <ArrowUpRightFromSquare size={13} aria-hidden />
        </a>
      </div>
    </Card>
  )
}

/* ─── styles (mirror PartnerOfferingCard) ──────────────────────────── */

const cardStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  minWidth: 265,
  minHeight: 290,
  // Fill the (grid-stretched) cell so every card in a row matches the tallest —
  // the `flex: 1` spacer in the body then pins the divider + CTA to the bottom.
  // Without this the card only grows to its own content, so a longer
  // description leaves shorter cards standing short.
  height: '100%',
}

const plateAreaStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '20px 16px 12px',
  minHeight: 96,
}

// Background + glyph color (incl. the hover deepening) live on the
// `.cre-resource-plate` class so the plate can respond to card hover.
const iconPlateStyle: CSSProperties = {
  display: 'grid',
  placeItems: 'center',
  width: 56,
  height: 56,
  borderRadius: 'var(--radius-lg)',
}

const bodyStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
  padding: '4px 16px 16px',
  flex: 1,
}

const nameStyle: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-body)',
  fontSize: 16,
  fontWeight: 700,
  lineHeight: '22px',
  // Color omitted so `.cre-library-card-title` handles the hover darkening.
}

const descriptionStyle: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-body)',
  fontSize: 13,
  lineHeight: '19px',
  color: 'var(--color-text-secondary)',
  display: '-webkit-box',
  WebkitLineClamp: 4,
  WebkitBoxOrient: 'vertical',
  overflow: 'hidden',
}

const spacerStyle: CSSProperties = {
  flex: 1,
  minHeight: 8,
}

const dividerStyle: CSSProperties = {
  height: 1,
  background: 'var(--color-border-subtle)',
  marginBottom: 10,
}

const ctaStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  // Contrast-aware CTA link set inline (the `.cre-resource-cta` class color
  // bakes to the light cta-500 under @theme-inline and fails on the navy dark
  // surface). Inline `--color-accent-link` resolves at runtime → deep magenta
  // on light, light pink on navy. The class still owns the hover darkening. #1
  color: 'var(--color-accent-link)',
  fontFamily: 'var(--font-body)',
  fontSize: 14,
  fontWeight: 700,
  textDecoration: 'none',
  alignSelf: 'flex-start',
}

/* ─── the Atlas/Compass treatment (`compass`) ─────────────────────── */
/* The Home course card's surface — `--color-compass-course-card` (#FCFCFB)
   and its 1px inset stroke, radius 14, no shadow. Hover, the plate and the
   title colour are `.cre-compass-resource-*` in tokens.css. */
const compassCardStyle: CSSProperties = {
  background: 'var(--color-compass-course-card)',
  boxShadow: 'inset 0 0 0 1px var(--color-compass-course-card-stroke, var(--color-atlas-nav-rule))',
  border: 'none',
  borderRadius: 14,
}
/* Serif H8, as the Home rail's step titles. */
const compassNameStyle: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-heading-serif)',
  fontWeight: 400,
  fontSize: 'var(--type-atlas-h8-size, 20px)',
  lineHeight: 'var(--type-atlas-h8-line, 24px)',
  color: 'var(--color-compass-page-heading)',
}
