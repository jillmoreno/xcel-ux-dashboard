import type { CSSProperties } from 'react'

/**
 * Lo-Fi primitive toolkit.
 *
 * Each component on the platform (hero band, card, widget, etc.)
 * imports the right placeholder from here and renders it when
 * `useLoFi().loFi` is true. The outer shell of each component stays
 * intact — same dimensions, same position in the grid — so the
 * page TEMPLATE remains visible while the Hi-Fi DETAILS get
 * stripped.
 *
 * Atoms:
 *   - `<LoFiBar>`   — grey horizontal bar; configurable width.
 *   - `<LoFiBlock>` — grey rectangle; configurable height + radius.
 *
 * Named composites:
 *   - `<LoFiHeroBody>`   — eyebrow ("Lo-fi version active") + 2 bars
 *                          + a CTA placeholder. Slots inside a hero
 *                          band's outer container.
 *   - `<LoFiCardBody>`   — grey image header + 3 stacked bars + a
 *                          footer rule. Slots inside a card's outer
 *                          shell.
 *   - `<LoFiWidgetBody>` — 3-5 stacked bars in a column. Slots
 *                          inside a sidebar widget / dashboard tile.
 */

/* ─── atoms ────────────────────────────────────────────────────────── */

const barBaseStyle: CSSProperties = {
  display: 'block',
  height: 12,
  background: 'var(--color-neutral-200)',
  borderRadius: 6,
}

export function LoFiBar({
  width = '100%',
  height = 12,
  style,
}: {
  width?: string | number
  height?: number
  style?: CSSProperties
}) {
  return (
    <span
      aria-hidden
      style={{
        ...barBaseStyle,
        width,
        height,
        ...style,
      }}
    />
  )
}

export function LoFiBlock({
  height = 80,
  radius = 8,
  style,
}: {
  height?: number
  radius?: number
  style?: CSSProperties
}) {
  return (
    <div
      aria-hidden
      style={{
        height,
        background: 'var(--color-neutral-200)',
        borderRadius: radius,
        width: '100%',
        ...style,
      }}
    />
  )
}

/* ─── hero body ────────────────────────────────────────────────────── */
//
// Drops into any hero band's outer container. The hero's own
// container provides the surface (gradient, padding, border-radius);
// this body just replaces the content.

export function LoFiHeroBody({
  ariaLabel = 'Lo-fi hero placeholder',
}: {
  ariaLabel?: string
} = {}) {
  return (
    <div
      role="region"
      aria-label={ariaLabel}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        width: '100%',
      }}
    >
      <span style={heroLabelStyle}>Lo-fi version active</span>
      <LoFiBar width="55%" />
      <LoFiBar width="35%" />
      <LoFiBlock height={36} radius={6} style={{ width: 140, marginTop: 12 }} />
    </div>
  )
}

const heroLabelStyle: CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontSize: 13,
  fontWeight: 600,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  color: 'var(--color-text-tertiary)',
}

/* ─── card body ────────────────────────────────────────────────────── */
//
// Drops into a CourseCard / LibraryResourceCard / PartnerOfferingCard
// shell. The shell provides the outer Card (border, radius,
// min-width 265, hover style); this body fills the inside.

export function LoFiCardBody({
  ariaLabel = 'Lo-fi card placeholder',
}: { ariaLabel?: string } = {}) {
  return (
    <div
      role="region"
      aria-label={ariaLabel}
      style={{ display: 'flex', flexDirection: 'column', height: '100%' }}
    >
      <LoFiBlock height={138} radius={0} />
      <div style={cardBodyStackStyle}>
        <LoFiBar width="40%" height={10} />
        <LoFiBar width="80%" />
        <LoFiBar width="65%" />
        <LoFiBar width="50%" />
        <div style={{ flex: 1 }} />
        <div
          aria-hidden
          style={{
            height: 1,
            background: 'var(--color-border-subtle)',
            margin: '6px 0',
          }}
        />
        <LoFiBar width="30%" height={10} />
      </div>
    </div>
  )
}

const cardBodyStackStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 10,
  padding: '14px 16px 16px',
  flex: 1,
}

/* ─── widget body ──────────────────────────────────────────────────── */
//
// Drops into a sidebar widget / dashboard tile. Three to five
// stacked bars + optional CTA at the bottom. The host component
// owns the outer surface (padding, background, border).

export function LoFiWidgetBody({
  rows = 4,
  showCta = false,
  ariaLabel = 'Lo-fi widget placeholder',
}: {
  rows?: number
  showCta?: boolean
  ariaLabel?: string
} = {}) {
  // Cycle through a few widths so the bars don't look identical.
  const widths = ['80%', '60%', '70%', '45%', '55%', '90%']
  return (
    <div
      role="region"
      aria-label={ariaLabel}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        width: '100%',
      }}
    >
      {Array.from({ length: rows }).map((_, i) => (
        <LoFiBar key={i} width={widths[i % widths.length]} />
      ))}
      {showCta && (
        <LoFiBlock
          height={36}
          radius={6}
          style={{ width: '60%', marginTop: 6 }}
        />
      )}
    </div>
  )
}
