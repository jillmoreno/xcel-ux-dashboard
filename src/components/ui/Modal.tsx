import { X } from '@/icons'
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
  /** Hide chrome (header bar + close button) — used for print previews */
  hideChrome?: boolean
  /** Skip the backdrop dim. Use when stacking on top of an already-dimmed
   *  surface (e.g. opening from inside a Sheet) so the page isn't double-tinted. */
  transparentBackdrop?: boolean
  /** When true, clicks on the backdrop don't close the modal. Used by
   *  config / setup flows where accidentally tossing the user's input
   *  would feel hostile — they have to use the X or Esc instead.
   *  Matches the STC Create Calendar production behaviour. */
  disableBackdropClose?: boolean
  /** Override the backdrop tint. Used by the STC Create Calendar
   *  modal to match the production navy overlay
   *  (`rgba(8, 21, 94, 0.36)`). Ignored when `transparentBackdrop` is on. */
  backdropColor?: string
  /** Drop the rule under the header AND its bottom padding, so the header and
   *  the body read as one block. For modals whose body opens with its own intro
   *  line, where a rule would separate a title from the sentence explaining it.
   *  Off by default — every other modal keeps both. */
  hideHeaderDivider?: boolean
}

/** Off-screen but readable by assistive tech — keeps `aria-labelledby` valid
 *  when the title is not drawn. */
const visuallyHiddenStyle = {
  position: 'absolute',
  width: 1,
  height: 1,
  padding: 0,
  margin: -1,
  overflow: 'hidden',
  clip: 'rect(0 0 0 0)',
  whiteSpace: 'nowrap',
  border: 0,
} as const

export function Modal({
  open,
  onClose,
  title,
  children,
  width = 720,
  hideChrome,
  transparentBackdrop,
  disableBackdropClose,
  backdropColor,
  hideHeaderDivider,
}: Props) {
  const dialogRef = useRef<HTMLDivElement | null>(null)
  const previouslyFocused = useRef<HTMLElement | null>(null)
  const id = useId()
  // Confine the fixed overlay to the stakeholder Demo frame when active, so the
  // modal centers over the demo screen — not the real viewport.
  const frameBounds = useOverlayFrameBounds(open)

  useEffect(() => {
    if (!open) return
    previouslyFocused.current = (document.activeElement as HTMLElement) ?? null
    dialogRef.current?.focus()

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation()
        onClose()
        return
      }
      if (e.key === 'Tab') trapFocus(e, dialogRef.current)
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
      onClick={(e) => {
        if (disableBackdropClose) return
        if (e.target === e.currentTarget) onClose()
      }}
      className="cre-modal-backdrop"
      style={{
        ...frameBounds,
        zIndex: 100,
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        padding: '64px 24px',
        background: transparentBackdrop
          ? 'transparent'
          : backdropColor ?? 'rgb(0 0 0 / 0.45)',
        overflowY: 'auto',
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={`${id}-title`}
        tabIndex={-1}
        className="cre-modal"
        style={{
          width: '100%',
          maxWidth: width,
          background: 'var(--color-surface-card)',
          borderRadius: 'var(--radius-xl)',
          boxShadow: 'var(--shadow-modal)',
          overflow: 'hidden',
          outline: 'none',
        }}
      >
        {hideChrome ? (
          // Keep the dialog's accessible name even when chrome is hidden —
          // visually hidden heading still satisfies aria-labelledby.
          <span id={`${id}-title`} style={visuallyHiddenStyle}>
            {title}
          </span>
        ) : (
          <header
            className="cre-modal-header"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 16,
              // Bottom padding goes with the divider. Once the rule is gone the
              // header and the body are one block, and 16px of header padding
              // stacked on the body's own top padding leaves a gap sized for a
              // separation that is no longer there.
              padding: hideHeaderDivider ? '16px 20px 0' : '16px 20px',
              borderBottom: hideHeaderDivider
                ? 'none'
                : '1px solid var(--color-border-subtle)',
            }}
          >
            <h2
              id={`${id}-title`}
              style={{
                margin: 0,
                fontFamily: 'var(--font-heading)',
                fontWeight: 500,
                fontSize: 'var(--text-h3-semibold)',
                lineHeight: 'var(--text-h3-semibold--line-height)',
                color: 'var(--color-text-primary)',
              }}
            >
              {title}
            </h2>
            <button
              type="button"
              aria-label="Close"
              onClick={onClose}
              style={{
                width: 36,
                height: 36,
                borderRadius: 'var(--radius-pill)',
                background: 'transparent',
                border: 'none',
                color: 'var(--color-text-secondary)',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <X size={18} aria-hidden />
            </button>
          </header>
        )}
        <div>{children}</div>
      </div>
    </div>,
    document.body,
  )
}

function trapFocus(e: KeyboardEvent, container: HTMLElement | null) {
  if (!container) return
  const focusable = container.querySelectorAll<HTMLElement>(
    'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
  )
  if (focusable.length === 0) return
  const first = focusable[0]
  const last = focusable[focusable.length - 1]
  const active = document.activeElement
  if (e.shiftKey && active === first) {
    e.preventDefault()
    last.focus()
  } else if (!e.shiftKey && active === last) {
    e.preventDefault()
    first.focus()
  }
}
