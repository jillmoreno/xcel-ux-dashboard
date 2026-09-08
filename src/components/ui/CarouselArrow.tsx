import type { CSSProperties } from 'react'
import { ArrowLeft, ArrowRight } from '@/icons'

/**
 * Frosted-glass circular carousel arrow (design "option 1"). Replaces the old
 * solid-white button: a translucent fill with a backdrop blur and a hairline
 * ring, so the underlying slide / cover image reads through it instead of a
 * hard disc. Meant to sit over carousel images.
 *
 * Two tones:
 *   - `light` (default) — translucent WHITE fill + white icon. Reads on cover
 *     images / dark slides (the compact shelf cards, whose square cover fills
 *     the shelf height under the arrow).
 *   - `dark` — translucent DARK fill + white icon. For the larger course cards
 *     (catalog / `RecommendedLargeCard`), where the arrow's vertical center sits
 *     over the card's WHITE body (image is only the top ~138px), so a white
 *     arrow would vanish. A dark disc reads on both the white body and images.
 *
 * Shared by `ShelfScroller` (recommended / what's-new / podcast shelves) and the
 * home-page marketing carousel so the affordance stays identical everywhere.
 */
export function CarouselArrow({
  direction,
  onClick,
  offset = -12,
  tone = 'light',
}: {
  direction: 'prev' | 'next'
  onClick: () => void
  /** Horizontal inset from the edge (px). Negative overhangs the edge. */
  offset?: number
  /** `light` (over images) or `dark` (over the larger cards' white bodies). */
  tone?: 'light' | 'dark'
}) {
  const isPrev = direction === 'prev'
  return (
    <button
      type="button"
      aria-label={isPrev ? 'Scroll to previous items' : 'Scroll to next items'}
      onClick={onClick}
      style={{ ...frostedArrowStyle, ...ARROW_TONE[tone], [isPrev ? 'left' : 'right']: offset }}
    >
      {isPrev ? <ArrowLeft size={18} aria-hidden /> : <ArrowRight size={18} aria-hidden />}
    </button>
  )
}

// Per-tone fill + ring. The icon stays white in both (never a token that would
// invert in dark mode). `light` reads on images; `dark` reads on white bodies.
const ARROW_TONE: Record<'light' | 'dark', CSSProperties> = {
  light: {
    background: 'rgb(255 255 255 / 0.18)',
    border: '1px solid rgb(255 255 255 / 0.3)',
    color: 'rgb(255 255 255 / 0.95)',
  },
  dark: {
    background: 'rgb(17 24 39 / 0.55)',
    border: '1px solid rgb(255 255 255 / 0.28)',
    color: 'rgb(255 255 255 / 0.95)',
  },
}

const frostedArrowStyle: CSSProperties = {
  position: 'absolute',
  top: '50%',
  transform: 'translateY(-50%)',
  width: 40,
  height: 40,
  borderRadius: 'var(--radius-pill)',
  // Frosted glass — a translucent fill + blur so what's behind shows through.
  // Fill/ring/icon colors come from `ARROW_TONE`.
  backdropFilter: 'blur(6px)',
  WebkitBackdropFilter: 'blur(6px)',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
  // Soft shadow keeps the button legible where it overhangs onto a light page.
  boxShadow: '0 4px 12px rgb(0 0 0 / 0.22)',
  zIndex: 2,
}
