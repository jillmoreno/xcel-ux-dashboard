import { useEffect, useId, useRef, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { acquireBodyScrollLock } from '@/utils/bodyScrollLock'
import { useOverlayFrameBounds } from '@/utils/overlayFrameBounds'

type Props = {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
  width?: number
  /** Side the sheet slides in from. Default `'right'`. */
  side?: 'left' | 'right'
}

export function Sheet({ open, onClose, title, children, width = 480, side = 'right' }: Props) {
  const dialogRef = useRef<HTMLDivElement | null>(null)
  const previouslyFocused = useRef<HTMLElement | null>(null)
  const id = useId()
  // Confine the fixed overlay to the stakeholder Demo frame when active, so the
  // sheet slides against the demo screen's edge — not the real viewport's.
  const frameBounds = useOverlayFrameBounds(open)

  useEffect(() => {
    if (!open) return
    previouslyFocused.current = (document.activeElement as HTMLElement) ?? null
    dialogRef.current?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation()
        onClose()
      }
    }
    document.addEventListener('keydown', onKey)
    const releaseScrollLock = acquireBodyScrollLock()
    return () => {
      document.removeEventListener('keydown', onKey)
      releaseScrollLock()
      previouslyFocused.current?.focus?.()
    }
  }, [open, onClose])

  if (!open) return null

  return createPortal(
    <div
      role="presentation"
      className="cre-sheet-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
      style={{
        ...frameBounds,
        zIndex: 100,
        display: 'flex',
        justifyContent: side === 'left' ? 'flex-start' : 'flex-end',
        background: 'rgb(0 0 0 / 0.45)',
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={`${id}-title`}
        tabIndex={-1}
        className={side === 'left' ? 'cre-sheet-panel--left' : 'cre-sheet-panel--right'}
        style={{
          width: '100%',
          maxWidth: width,
          height: '100%',
          background: 'var(--color-surface-card)',
          boxShadow: side === 'left' ? '4px 0 16px rgb(0 0 0 / 0.18)' : '-4px 0 16px rgb(0 0 0 / 0.18)',
          outline: 'none',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          borderTopLeftRadius: side === 'left' ? 0 : 16,
          borderBottomLeftRadius: side === 'left' ? 0 : 16,
          borderTopRightRadius: side === 'left' ? 16 : 0,
          borderBottomRightRadius: side === 'left' ? 16 : 0,
        }}
      >
        <span id={`${id}-title`} style={{ position: 'absolute', clip: 'rect(0 0 0 0)', clipPath: 'inset(50%)' }}>
          {title}
        </span>
        {children}
      </div>
    </div>,
    document.body,
  )
}
