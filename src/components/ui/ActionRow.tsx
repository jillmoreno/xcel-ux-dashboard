import type { ComponentType, CSSProperties } from 'react'
import { ChevronRight } from '@/icons'

/**
 * A full-width "pick one of these" row: leading icon, label, detail sub-line,
 * trailing chevron. Stack several inside [`ActionRowGroup`](#ActionRowGroup) to
 * get the bordered, rounded list `ManageMembershipPanel` uses for "Manage your
 * plan".
 *
 * ⚠ IT WEARS `.cre-manage-row`, WHICH IS NAMED FOR ITS FIRST CALLER. That is
 * deliberate rather than sloppy: the hover wash, the inset accent bar and the
 * focus-visible outline all live on that class in `tokens.css`, and the comment
 * there explains why they cannot move inline (an inline `background` beats the
 * stylesheet's `:hover` on specificity, so the rows would look interactive and
 * then not respond). Duplicating the block under a second name would leave two
 * copies to keep in step. Rename the class if you ever want to — but rename it
 * in `tokens.css`, `ManageMembershipPanel` and here in one go.
 *
 * `ManageMembershipPanel` still has its own private copy of this row and was
 * NOT migrated: it is a heavily-tested panel and the row was extracted here for
 * a new caller, not to refactor that one. If you do migrate it, its `danger`
 * variant needs the `--danger` modifier class carried across too.
 */
export function ActionRow({
  Icon,
  label,
  detail,
  onClick,
  last,
}: {
  Icon: ComponentType<{ size?: number; 'aria-hidden'?: boolean }>
  label: string
  detail: string
  onClick: () => void
  /** Drops the bottom rule — set it on the final row of a group. */
  last?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="cre-manage-row"
      style={{ ...rowStyle, ...(last ? { borderBottom: 'none' } : null) }}
    >
      <span aria-hidden style={{ ...glyphStyle, color: 'var(--color-primary-600)' }}>
        <Icon size={19} />
      </span>
      <span style={textStyle}>
        <b style={labelStyle}>{label}</b>
        <span style={detailStyle}>{detail}</span>
      </span>
      <span aria-hidden style={{ ...glyphStyle, color: 'var(--color-neutral-600)' }}>
        <ChevronRight size={16} />
      </span>
    </button>
  )
}

/** The bordered, rounded container the rows sit in. */
export function ActionRowGroup({ children }: { children: React.ReactNode }) {
  return <div style={groupStyle}>{children}</div>
}

/* ─── styles (tokens only) ─────────────────────────────────────────────── */

/** NOTE: no `background` here — see the class note above. */
const groupStyle: CSSProperties = {
  border: '1px solid var(--color-border-subtle)',
  borderRadius: 'var(--radius-lg)',
  overflow: 'hidden',
}

const rowStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 14,
  width: '100%',
  padding: '15px 18px',
  textAlign: 'left',
  border: 'none',
  borderBottom: '1px solid var(--color-border-subtle)',
  cursor: 'pointer',
  fontFamily: 'var(--font-body)',
}

const glyphStyle: CSSProperties = { flex: 'none', display: 'inline-flex' }

const textStyle: CSSProperties = { flex: 1, minWidth: 0 }

const labelStyle: CSSProperties = {
  display: 'block',
  fontFamily: 'var(--font-body)',
  fontSize: 14,
  fontWeight: 600,
  color: 'var(--color-text-primary)',
}

const detailStyle: CSSProperties = {
  display: 'block',
  marginTop: 2,
  fontFamily: 'var(--font-body)',
  fontSize: 13,
  lineHeight: '18px',
  color: 'var(--color-text-secondary)',
}
