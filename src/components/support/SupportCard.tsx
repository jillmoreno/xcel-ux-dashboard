import type { ComponentType, CSSProperties } from 'react'
import { ChevronRight } from '@/icons'

/**
 * One Help & Support entry card (Figma / Elite "Help & Support" screen).
 *
 *   ┌──────────────────────────────┐
 *   │  (icon)  Title               │
 *   │  Description line…           │
 *   │  ─────────────────────────   │  ← divider
 *   │  Action label  ›             │  ← magenta CTA (cta token)
 *   └──────────────────────────────┘
 *
 * The whole card is one clickable button (`onSelect`). The bottom "action"
 * row is a visual affordance echoing the card's action, not a separate target.
 *
 * ⚠ `compact` DROPS THAT ROW — 2026-10-07, the direct ask ("these cards are too
 * big. when in the sheet view, remove the Get help link, etc."). It is the
 * right thing to lose first precisely BECAUSE it is an echo: the card is
 * already the button, so the row carries no destination the card does not, and
 * on a 480px sheet it is the cheapest third of the card's height.
 *
 * ⚠ IT IS NOT A SECOND CARD. The sheet and the section render the same
 * component so the two cannot drift into saying different things; what changes
 * is the SIZE of the surface it is on. The full card is sized for a wide grid
 * where four of them share a row and the divider lines them up — in a single
 * 480px column, that alignment buys nothing and the height costs a scroll.
 */
export type SupportCardProps = {
  icon: ComponentType<{ size?: number; 'aria-hidden'?: boolean }>
  title: string
  description: string
  /** Bottom-row CTA label, e.g. "Get help" or "Open FAQs". Still required in
   *  `compact`, where it is not rendered — see the note below. */
  action: string
  /** The sheet's smaller shape: no divider, no action row, tighter everything. */
  compact?: boolean
  onSelect: () => void
}

export function SupportCard({
  icon: Icon,
  title,
  description,
  action,
  compact,
  onSelect,
}: SupportCardProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={compact ? 'cre-support-card cre-support-card--compact' : 'cre-support-card'}
      style={compact ? compactCardStyle : cardStyle}
    >
      <div style={headerRowStyle}>
        <span aria-hidden style={iconStyle}>
          <Icon size={compact ? 18 : 24} aria-hidden />
        </span>
        <span style={compact ? compactTitleStyle : titleStyle}>{title}</span>
      </div>
      <p style={compact ? compactDescStyle : descStyle}>{description}</p>
      {/* ⚠ `action` IS STILL REQUIRED, and deliberately not made optional. It
          is what the card PROMISES — "Open FAQs" says this one leaves the
          product — and a compact card that let a caller omit it would make the
          two shapes able to disagree about what the control does. The prop is
          the contract; the row is one way of drawing it. */}
      {compact ? null : (
        <>
          <div aria-hidden style={dividerStyle} />
          <span style={actionStyle}>
            {action}
            <ChevronRight size={14} aria-hidden />
          </span>
        </>
      )}
    </button>
  )
}

/* ─── styles (tokens only) ───────────────────────────────────────────── */

const cardStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  width: '100%',
  textAlign: 'left',
  /* ⚠ THE PAINT LIVES IN `tokens.css`, NOT HERE — moved 2026-10-07, and the
     move is what made the hover possible at all. `background`, `border`,
     `border-radius` and `box-shadow` were inline, and an inline style BEATS a
     stylesheet rule — so `.cre-support-card:hover` set them and lost, silently,
     with `:hover` matching the whole time. The rule looked right in the
     inspector and painted nothing.

     Chosen over `!important`, which would have worked and left the next person
     the same trap one layer deeper. Layout stays inline; only what the hover
     needs to change moved. */
  padding: '24px 24px 20px',
  cursor: 'pointer',
  /* ⚠ THESE ANIMATE RULES IN `tokens.css`, NOT ANYTHING HERE — and until
     2026-10-07 they animated nothing at all, because `.cre-support-card` had no
     stylesheet entry. `border-color` and `background` joined the list when the
     hover landed; the compact shape moves those two rather than the shadow. */
  transition:
    'box-shadow 120ms ease, transform 120ms ease, border-color 120ms ease, background 120ms ease',
}

/* ⚠ NO `flex: 1` ON THE COMPACT DESCRIPTION, which the full card's has. There
   it stretches so four cards in a row land their dividers on one line; with no
   divider and one card per row, stretching only adds height. */
const compactCardStyle: CSSProperties = {
  ...cardStyle,
  padding: '14px 16px 15px',
}

const headerRowStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
}

const iconStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: 'var(--color-primary-500)',
  flexShrink: 0,
}

const titleStyle: CSSProperties = {
  fontFamily: 'var(--font-heading)',
  fontWeight: 600,
  fontSize: 20,
  lineHeight: '26px',
  color: 'var(--color-text-primary)',
}

const descStyle: CSSProperties = {
  margin: '14px 0 0',
  fontFamily: 'var(--font-body)',
  fontSize: 14,
  lineHeight: '22px',
  color: 'var(--color-text-secondary)',
  // Two-line region keeps the divider + CTA aligned across the 4 cards.
  flex: 1,
}

const compactTitleStyle: CSSProperties = {
  ...titleStyle,
  fontSize: 15,
  lineHeight: '20px',
}

const compactDescStyle: CSSProperties = {
  margin: '6px 0 0',
  fontFamily: 'var(--font-body)',
  fontSize: 13,
  lineHeight: '18px',
  color: 'var(--color-text-secondary)',
}

const dividerStyle: CSSProperties = {
  height: 1,
  background: 'var(--color-border-subtle)',
  margin: '20px 0 16px',
}

const actionStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  fontFamily: 'var(--font-body)',
  fontWeight: 700,
  fontSize: 14,
  lineHeight: '20px',
  color: 'var(--color-cta-500)',
}
