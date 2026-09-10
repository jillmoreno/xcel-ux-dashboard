import { useEffect, type CSSProperties, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { X } from '@/icons'
import { ALERT_TONES, type AlertTone } from './alertTones'
import { useToastFrameAnchor } from '@/utils/overlayFrameBounds'

/**
 * Toast notification surfaced after a destructive- or commit-style action
 * (e.g. an enrollment confirmation). Sourced from Figma node `17:14204` —
 * 8px tinted top border, leading status icon, title + body copy, optional
 * trailing CTA, and a manual close X. Auto-dismisses after `duration` ms.
 *
 * Renders into `document.body` via portal so it survives parent unmounts
 * (e.g. closing the originating sheet/modal).
 */
/**
 * A toast's tone is an **alert tone** — the same family the notification
 * centre reads, from one map. Widened beyond the original four when the
 * Figma "Alerts" file landed: `message` and `promo` exist there too, and a
 * toast is a legitimate way to surface an incoming message.
 *
 * See [`alertTones`](./alertTones.ts) for why the colours live over there
 * rather than here, and for the `circle-xmark` gap on `error`.
 */
export type ToastTone = AlertTone

type Props = {
  open: boolean
  onClose: () => void
  tone?: ToastTone
  title: string
  /** Body copy. Accepts ReactNode so callers can mix bold/regular runs. */
  children: ReactNode
  action?: { label: string; onClick: () => void }
  /**
   * The design's outline **Secondary** button, shown to the RIGHT of the
   * primary (the design's own order — see the footer below). Only rendered
   * alongside `action`: a lone secondary is a primary wearing the wrong
   * weight, and the design has no such variant.
   */
  secondaryAction?: { label: string; onClick: () => void }
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
  secondaryAction,
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

  const palette = ALERT_TONES[tone]
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
          // Primary FIRST, secondary to its right — the design's own order in
          // the Info and Messages variants (node 1:1372). The Added-to-Cart
          // variant reverses it, but that card is `AddToCartToast`, which
          // draws its own footer.
          <div style={{ paddingTop: 16, display: 'flex', gap: 20, alignItems: 'center' }}>
            <ToastButton
              label={action.label}
              onClick={() => {
                action.onClick()
                onClose()
              }}
            />
            {secondaryAction && (
              <ToastButton
                variant="secondary"
                label={secondaryAction.label}
                onClick={() => {
                  secondaryAction.onClick()
                  onClose()
                }}
              />
            )}
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

/**
 * The alert card's CTA. Both weights key off the action colour — a fill for
 * primary, a `currentColor` outline over the card surface for secondary — so
 * the pair re-skins per brand exactly as the Figma's orange/outline pair does
 * on MCK. The secondary takes it through `.cre-alert-action` rather than
 * inline, because as TEXT it has to change with the theme; see that rule in
 * `tokens.css`.
 */
function ToastButton({
  label,
  onClick,
  variant = 'primary',
}: {
  label: string
  onClick: () => void
  variant?: 'primary' | 'secondary'
}) {
  const secondary = variant === 'secondary'
  return (
    <button
      type="button"
      onClick={onClick}
      // Only the secondary needs it: its label is action-coloured TEXT, which
      // on a dark card needs the theme-aware light stop. The primary is white
      // on the action FILL, which is what that colour is actually for.
      className={secondary ? 'cre-alert-action' : undefined}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 36,
        padding: '4px 12px',
        borderRadius: 'var(--radius-md)',
        background: secondary ? 'transparent' : 'var(--color-action)',
        color: secondary ? undefined : '#fff',
        border: secondary ? '1px solid currentColor' : 'none',
        fontFamily: 'var(--font-body)',
        fontWeight: 600,
        fontSize: 16,
        lineHeight: '28px',
        cursor: 'pointer',
      }}
    >
      {label}
    </button>
  )
}
