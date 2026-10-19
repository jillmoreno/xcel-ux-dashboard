import { useEffect, type CSSProperties, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { XmarkRegular } from '@/icons'
import { HEADING } from './adminStyles'

/**
 * XCEL ADMIN — the small dialog frame (2026-10-19): a title, a line under
 * it, a body and a footer of buttons, over a scrim. Escape and a scrim
 * click close it. The reference's Set exam date and Log a call use this
 * size; Invite learners has its own, wider frame.
 */
export function AdminDialog({
  title,
  subtitle,
  onClose,
  footer,
  width = 480,
  children,
}: {
  title: string
  subtitle?: ReactNode
  onClose: () => void
  footer: ReactNode
  width?: number
  children: ReactNode
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])
  return createPortal(
    <div style={SCRIM} onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div role="dialog" aria-modal="true" aria-label={title} style={{ ...DIALOG, maxWidth: width }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
          <div>
            <h2 style={TITLE}>{title}</h2>
            {subtitle ? <p style={{ margin: '4px 0 0', fontSize: 14, color: 'var(--admin-muted)' }}>{subtitle}</p> : null}
          </div>
          <button type="button" aria-label="Close" onClick={onClose} style={CLOSE}>
            <XmarkRegular size={14} aria-hidden />
          </button>
        </div>
        <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>{children}</div>
        <div style={{ marginTop: 24, display: 'flex', justifyContent: 'flex-end', gap: 8 }}>{footer}</div>
      </div>
    </div>,
    document.body,
  )
}

const SCRIM: CSSProperties = {
  position: 'fixed',
  inset: 0,
  zIndex: 50,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 24,
  background: 'var(--admin-scrim)',
  fontFamily: 'var(--font-body)',
}
const DIALOG: CSSProperties = {
  width: '100%',
  boxSizing: 'border-box',
  padding: 24,
  borderRadius: 20,
  border: '1px solid var(--admin-rule)',
  background: 'var(--admin-surface)',
  boxShadow: 'var(--admin-shadow-menu)',
}
const TITLE: CSSProperties = { margin: 0, fontFamily: HEADING, fontSize: 20, fontWeight: 600, color: 'var(--admin-ink)' }
const CLOSE: CSSProperties = {
  flex: 'none',
  width: 32,
  height: 32,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  border: 'none',
  borderRadius: 9999,
  background: 'none',
  color: 'var(--admin-faint)',
  cursor: 'pointer',
}
