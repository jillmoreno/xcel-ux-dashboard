import { useEffect, type ComponentType, type CSSProperties, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { CircleCheck, CircleExclamation, X } from '@/icons'
import { useToastFrameAnchor } from '@/utils/overlayFrameBounds'

type ToneIcon = ComponentType<{ size?: number; 'aria-hidden'?: boolean | 'true' | 'false' }>

/**
 * Toast notification surfaced after a destructive- or commit-style action
 * (e.g. an enrollment confirmation). Sourced from Figma node `17:14204` —
 * 8px tinted top border, leading status icon, title + body copy, optional
 * trailing CTA, and a manual close X. Auto-dismisses after `duration` ms.
 *
 * Renders into `document.body` via portal so it survives parent unmounts
 * (e.g. closing the originating sheet/modal).
 */
type ToastTone = 'success' | 'error' | 'warning' | 'info'

type ToneTokens = { border: string; icon: string; Icon: ToneIcon }

// Icon now maps to the tone (per Figma node 3625:19356 — success uses a
// filled check-circle). success → circle-check; the remaining tones reuse
// circle-exclamation for now (color differentiates them) until dedicated
// circle-xmark / triangle-exclamation / circle-info SVGs are added to the
// icon registry. Before today the icon was a hardcoded check for every
// tone, so an error/warning/info toast would have shown a checkmark.
const TONE: Record<ToastTone, ToneTokens> = {
  success: { border: 'var(--color-success-300)', icon: 'var(--color-success-500)', Icon: CircleCheck },
  error: { border: 'var(--color-error-300)', icon: 'var(--color-error-500)', Icon: CircleExclamation },
  warning: { border: 'var(--color-warning-300)', icon: 'var(--color-warning-500)', Icon: CircleExclamation },
  info: { border: 'var(--color-info-300)', icon: 'var(--color-info-500)', Icon: CircleExclamation },
}

type Props = {
  open: boolean
  onClose: () => void
  tone?: ToastTone
  title: string
  /** Body copy. Accepts ReactNode so callers can mix bold/regular runs. */
  children: ReactNode
  action?: { label: string; onClick: () => void }
  /** Auto-dismiss after this many ms. `0` disables auto-dismiss. Default 6000. */
  duration?: number
  style?: CSSProperties
}

export function Toast({
  open,
  onClose,
  tone = 'success',
  title,
  children,
  action,
  duration = 6000,
  style,
}: Props) {
  // In the Demo frame, pin to the demo window's top-right (not the true
  // viewport, which would float the toast over the dark stage / prototype bar).
  const anchor = useToastFrameAnchor(open)

  useEffect(() => {
    if (!open || !duration) return
    const id = window.setTimeout(onClose, duration)
    return () => window.clearTimeout(id)
  }, [open, duration, onClose])

  if (!open) return null

  const palette = TONE[tone]
  const ToneIcon = palette.Icon

  return createPortal(
    <div
      role="status"
      aria-live="polite"
      className="cre-toast"
      style={{
        position: 'fixed',
        // 72px app header + 16px gap so the toast lands directly below
        // the avatar / right-side header chrome. Every Toast usage now
        // lands top-right by default — callers shouldn't override. In the Demo
        // frame `anchor` shifts it to the demo window's top-right.
        top: anchor.top,
        right: anchor.right,
        zIndex: 200,
        width: 423,
        maxWidth: 'calc(100vw - 48px)',
        background: 'var(--color-surface-card)',
        borderRadius: 'var(--radius-md)',
        boxShadow: '0 8px 12px rgba(41, 41, 41, 0.10)',
        padding: '24px 48px 16px 16px',
        display: 'flex',
        gap: 10,
        alignItems: 'flex-start',
        overflow: 'hidden',
        ...style,
      }}
    >
      {/* Top tinted border */}
      <span
        aria-hidden
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 8,
          background: palette.border,
        }}
      />
      {/* Status icon — tone-mapped glyph in the tone color (Figma uses a
          filled check-circle for success). */}
      <span
        aria-hidden
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: palette.icon,
          flexShrink: 0,
          marginTop: 2,
        }}
      >
        <ToneIcon size={18} aria-hidden />
      </span>
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        <p
          style={{
            margin: 0,
            fontFamily: 'var(--font-body)',
            fontWeight: 700,
            fontSize: 14,
            lineHeight: '22px',
            color: 'var(--color-neutral-darkest)',
          }}
        >
          {title}
        </p>
        <p
          style={{
            margin: '4px 0 0',
            fontFamily: 'var(--font-body)',
            fontSize: 14,
            lineHeight: '22px',
            color: 'var(--color-text-secondary)',
          }}
        >
          {children}
        </p>
        {action && (
          <div style={{ paddingTop: 16 }}>
            <button
              type="button"
              onClick={() => {
                action.onClick()
                onClose()
              }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: 36,
                padding: '4px 12px',
                borderRadius: 'var(--radius-md)',
                background: 'var(--color-action)',
                color: '#fff',
                border: 'none',
                fontFamily: 'var(--font-body)',
                fontWeight: 600,
                fontSize: 16,
                lineHeight: '28px',
                cursor: 'pointer',
              }}
            >
              {action.label}
            </button>
          </div>
        )}
      </div>
      <button
        type="button"
        aria-label="Dismiss notification"
        onClick={onClose}
        style={{
          position: 'absolute',
          top: 8,
          right: 8,
          width: 32,
          height: 32,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'transparent',
          border: 'none',
          color: 'var(--color-neutral-500)',
          cursor: 'pointer',
        }}
      >
        <X size={18} aria-hidden />
      </button>
    </div>,
    document.body,
  )
}
