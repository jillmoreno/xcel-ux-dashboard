import { useEffect, useRef, type ComponentType, type CSSProperties } from 'react'
import { createPortal } from 'react-dom'
import { ShoppingCart, X } from '@/icons'
import { useToastFrameAnchor } from '@/utils/overlayFrameBounds'

/**
 * "Added to Cart" confirmation toast — the richer cart-specific notification
 * from Figma node `471:19219` (distinct from the generic `Toast`, which stays
 * in use for status messages like "Statement saved" / enrollment success).
 *
 * Layout: a brand `primary` accent bar across the top, a circular cart badge +
 * "Added to Cart" title, the added product (thumbnail + title + a
 * divider-separated meta row + price), and two CTAs — outline **Continue
 * Shopping** + filled **View Cart**. Every color resolves from a brand token
 * (accent/badge → `--color-primary-500`, buttons → `--color-action`), so the
 * card re-skins per brand: green + orange for CRE/McKissock, blue + magenta for
 * Elite, etc. The Figma frame is the McKissock (green/orange) instance.
 *
 * Portaled to `document.body` so it survives the originating sheet unmounting.
 */

type DeliveryIcon = ComponentType<{ size?: number; 'aria-hidden'?: boolean | 'true' | 'false' }>

export type AddToCartItem = {
  /** Product name — the course or plan that was added. */
  title: string
  /** Optional cover image. Omitted (e.g. a membership) → no thumbnail. */
  imageUrl?: string
  /** Leading glyph for the first meta token (e.g. the delivery mode icon). */
  DeliveryIcon?: DeliveryIcon
  /** Meta tokens shown in a divider-separated row (e.g. Webinar · 3 Hours · TX). */
  meta?: string[]
  /** Preformatted price, e.g. "$19.00" or "$84.99/yr". */
  price: string
}

type Props = {
  open: boolean
  onClose: () => void
  item: AddToCartItem | null
  /** "Continue Shopping" — defaults to dismissing the toast. */
  onContinueShopping?: () => void
  /** "View Cart" — no cart page exists yet, so defaults to a stub. */
  onViewCart?: () => void
  /** Auto-dismiss after this many ms. `0` disables it. Default 8000 (longer
   *  than the generic toast so the action buttons stay reachable). */
  duration?: number
  style?: CSSProperties
}

export function AddToCartToast({
  open,
  onClose,
  item,
  onContinueShopping,
  onViewCart,
  duration = 8000,
  style,
}: Props) {
  // Keep the latest onClose in a ref so the auto-dismiss timer is armed ONCE
  // when the toast opens and isn't reset by unrelated re-renders — an inline
  // `onClose` prop changes identity every render, which would otherwise keep
  // clearing + resetting the timeout so it never fires.
  const onCloseRef = useRef(onClose)
  useEffect(() => {
    onCloseRef.current = onClose
  }, [onClose])
  useEffect(() => {
    if (!open || !duration) return
    const id = window.setTimeout(() => onCloseRef.current(), duration)
    return () => window.clearTimeout(id)
  }, [open, duration])

  // In the Demo frame, pin to the demo window's top-right instead of the true
  // viewport (so it doesn't float over the dark stage / prototype bar).
  const anchor = useToastFrameAnchor(open)

  if (!open || !item) return null

  const meta = item.meta ?? []

  return createPortal(
    <div
      role="status"
      aria-live="polite"
      className="cre-add-to-cart-toast"
      style={{
        position: 'fixed',
        top: anchor.top,
        right: anchor.right,
        zIndex: 200,
        width: 440,
        maxWidth: 'calc(100vw - 48px)',
        background: 'var(--color-surface-card)',
        borderRadius: 'var(--radius-md)',
        boxShadow: '0 8px 24px rgba(41, 41, 41, 0.14)',
        padding: '24px 16px 16px',
        overflow: 'hidden',
        ...style,
      }}
    >
      {/* Brand accent bar */}
      <span
        aria-hidden
        style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 8, background: 'var(--color-primary-500)' }}
      />

      {/* Close */}
      <button
        type="button"
        aria-label="Dismiss notification"
        onClick={onClose}
        style={{
          position: 'absolute',
          top: 12,
          right: 10,
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
        <X size={20} aria-hidden />
      </button>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <span
          aria-hidden
          style={{
            width: 30,
            height: 30,
            flexShrink: 0,
            borderRadius: 'var(--radius-pill)',
            background: 'var(--color-primary-500)',
            color: 'var(--color-text-inverse, #fff)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <ShoppingCart size={15} aria-hidden />
        </span>
        <p
          style={{
            margin: 0,
            fontFamily: 'var(--font-body)',
            fontWeight: 700,
            fontSize: 20,
            lineHeight: '28px',
            color: 'var(--color-text-primary)',
          }}
        >
          Added to Cart
        </p>
      </div>

      {/* Product */}
      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
        {item.imageUrl && (
          <div
            aria-hidden
            style={{
              width: 72,
              height: 72,
              flexShrink: 0,
              borderRadius: 10,
              background: `center / cover no-repeat url(${item.imageUrl})`,
            }}
          />
        )}
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
          <p
            style={{
              margin: 0,
              fontFamily: 'var(--font-body)',
              fontWeight: 600,
              fontSize: 16,
              lineHeight: '20px',
              color: 'var(--color-text-primary)',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {item.title}
          </p>
          {meta.length > 0 && (
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                gap: 12,
                fontFamily: 'var(--font-body)',
                fontSize: 14,
                lineHeight: '22px',
                color: 'var(--color-text-secondary)',
              }}
            >
              {meta.map((token, i) => (
                <span key={token} style={{ display: 'inline-flex', alignItems: 'center', gap: 12 }}>
                  {i > 0 && (
                    <span
                      aria-hidden
                      style={{ width: 1, height: 16, background: 'var(--color-neutral-300)', flexShrink: 0 }}
                    />
                  )}
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, whiteSpace: 'nowrap' }}>
                    {i === 0 && item.DeliveryIcon && <item.DeliveryIcon size={16} aria-hidden />}
                    {token}
                  </span>
                </span>
              ))}
            </div>
          )}
          <p
            style={{
              margin: 0,
              fontFamily: 'var(--font-body)',
              fontWeight: 700,
              fontSize: 16,
              lineHeight: '28px',
              color: 'var(--color-text-primary)',
            }}
          >
            {item.price}
          </p>
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 16, marginTop: 20 }}>
        <button
          type="button"
          onClick={onContinueShopping ?? onClose}
          style={{ ...cartBtnBase, background: 'transparent', color: 'var(--color-action)', border: '1px solid var(--color-action)' }}
        >
          Continue Shopping
        </button>
        <button
          type="button"
          onClick={() => {
            if (onViewCart) onViewCart()
            else console.info('cart:view')
            onClose()
          }}
          style={{ ...cartBtnBase, background: 'var(--color-action)', color: 'var(--color-text-inverse, #fff)', border: '1px solid var(--color-action)' }}
        >
          View Cart
        </button>
      </div>
    </div>,
    document.body,
  )
}

const cartBtnBase: CSSProperties = {
  flex: 1,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: 44,
  padding: '8px 16px',
  borderRadius: 'var(--radius-md)',
  fontFamily: 'var(--font-body)',
  fontWeight: 600,
  fontSize: 16,
  lineHeight: '28px',
  cursor: 'pointer',
  whiteSpace: 'nowrap',
}
