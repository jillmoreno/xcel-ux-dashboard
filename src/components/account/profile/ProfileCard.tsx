import type { ComponentType, CSSProperties, ReactNode } from 'react'
import { PenToSquare } from '@/icons'

type IconComponent = ComponentType<{ size?: number; 'aria-hidden'?: boolean }>

type Props = {
  /** Section title, e.g. "Account Details". */
  title: string
  /** Header glyph (from `@/icons`). */
  icon: IconComponent
  /** Edit-pencil handler. Omit to hide the pencil. */
  onEdit?: () => void
  /** Accessible label for the edit control (defaults to `Edit {title}`). */
  editLabel?: string
  children: ReactNode
}

/**
 * Shared Profile-page card chrome — a white `radius-lg` surface with a header
 * row (icon + title on the left, an edit pencil on the right) over the body.
 * Matches the Figma "Profile" cards (`301:18770`); the McKissock CTA-orange
 * pencil is remapped to the app's `--color-action` link color per convention.
 */
export function ProfileCard({ title, icon: Icon, onEdit, editLabel, children }: Props) {
  return (
    <section style={cardStyle}>
      <div style={headerRowStyle}>
        <div style={titleWrapStyle}>
          <Icon size={20} aria-hidden />
          <h2 style={titleStyle}>{title}</h2>
        </div>
        {onEdit && (
          <button
            type="button"
            onClick={onEdit}
            aria-label={editLabel ?? `Edit ${title}`}
            style={editBtnStyle}
          >
            <PenToSquare size={18} aria-hidden />
          </button>
        )}
      </div>
      {children}
    </section>
  )
}

const cardStyle: CSSProperties = {
  background: 'var(--color-surface-card)',
  border: '1px solid var(--color-border-subtle)',
  borderRadius: 'var(--radius-lg)',
  padding: '20px 24px 24px',
  display: 'flex',
  flexDirection: 'column',
  gap: 20,
}

const headerRowStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 12,
}

const titleWrapStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  color: 'var(--color-text-primary)',
}

const titleStyle: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-body)',
  fontSize: 18,
  fontWeight: 600,
  lineHeight: '28px',
  color: 'var(--color-text-primary)',
}

const editBtnStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 32,
  height: 32,
  padding: 0,
  background: 'transparent',
  border: 'none',
  borderRadius: 'var(--radius-pill)',
  color: 'var(--color-action)',
  cursor: 'pointer',
}

/* ─── shared row: label (left) + value (right) ─────────────────────────── */

/** A single label / value row used inside the Account + Personal cards. The
 *  label is small semibold; the value right-aligns. `value` accepts a node so
 *  multi-line addresses can pass a stacked block. */
export function ProfileField({
  label,
  value,
  valueWeight = 'regular',
}: {
  label: string
  value: ReactNode
  /** Account Details renders bold values; Personal Information regular. */
  valueWeight?: 'regular' | 'semibold'
}) {
  return (
    <div style={fieldRowStyle}>
      <span style={fieldLabelStyle}>{label}</span>
      <div
        style={{
          ...fieldValueStyle,
          fontWeight: valueWeight === 'semibold' ? 600 : 400,
        }}
      >
        {value}
      </div>
    </div>
  )
}

const fieldRowStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'flex-start',
  justifyContent: 'space-between',
  gap: 24,
}

const fieldLabelStyle: CSSProperties = {
  flexShrink: 0,
  fontFamily: 'var(--font-body)',
  fontSize: 14,
  fontWeight: 600,
  lineHeight: '22px',
  color: 'var(--color-text-primary)',
}

const fieldValueStyle: CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontSize: 16,
  lineHeight: '24px',
  textAlign: 'right',
  color: 'var(--color-text-primary)',
}
