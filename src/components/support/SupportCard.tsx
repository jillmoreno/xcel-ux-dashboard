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
 */
export type SupportCardProps = {
  icon: ComponentType<{ size?: number; 'aria-hidden'?: boolean }>
  title: string
  description: string
  /** Bottom-row CTA label, e.g. "Get help" or "Open FAQs". */
  action: string
  onSelect: () => void
}

export function SupportCard({ icon: Icon, title, description, action, onSelect }: SupportCardProps) {
  return (
    <button type="button" onClick={onSelect} className="cre-support-card" style={cardStyle}>
      <div style={headerRowStyle}>
        <span aria-hidden style={iconStyle}>
          <Icon size={24} aria-hidden />
        </span>
        <span style={titleStyle}>{title}</span>
      </div>
      <p style={descStyle}>{description}</p>
      <div aria-hidden style={dividerStyle} />
      <span style={actionStyle}>
        {action}
        <ChevronRight size={14} aria-hidden />
      </span>
    </button>
  )
}

/* ─── styles (tokens only) ───────────────────────────────────────────── */

const cardStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  width: '100%',
  textAlign: 'left',
  background: 'var(--color-surface-card)',
  border: '1px solid var(--color-border-subtle)',
  borderRadius: 'var(--radius-lg)',
  boxShadow: 'var(--shadow-card, 0 1px 2px rgb(0 0 0 / 0.06))',
  padding: '24px 24px 20px',
  cursor: 'pointer',
  transition: 'box-shadow 120ms ease, transform 120ms ease',
}

const headerRowStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 12,
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
