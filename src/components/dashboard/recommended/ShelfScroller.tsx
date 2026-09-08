import { useEffect, useRef, useState, type ReactNode } from 'react'
import { CarouselArrow } from '@/components/ui/CarouselArrow'
import { useMediaQuery } from '@/utils/useMediaQuery'

/**
 * Horizontal scrolling track for one recommended-for-you shelf.
 *
 * Layout decisions:
 * - **Card width** — desktop: 262px (matches the existing CourseCard / Membership /
 *   Package grid cell width). Mobile (<600px): 220px so two cards are visible
 *   with a sliver of the third, per the redesign doc § 5 "Mobile" rule.
 * - **Gap** — 16px (matches `GRID_STYLE` in `ContinueLearningTabs.tsx`).
 * - **Snap** — `scroll-snap-type: x mandatory` + `scroll-snap-align: start` on
 *   each cell. Swipes / arrow clicks land cleanly on a card edge.
 * - **Peek** — track bleeds 16px past the right edge of the section so the
 *   trailing card cuts off ~30% (signals "more to scroll").
 * - **Arrows** — desktop only, hover-revealed on the section. Each click
 *   scrolls by one card-width + gap. Hidden under 600px (touch / swipe).
 * - **No auto-advance** — explicitly out of scope per the redesign doc.
 */

type Props = {
  /** Card cells, already wrapped in their respective Course / Podcast /
   *  IndividualCourse / LockedTail components. */
  children: ReactNode
  /** Accessible label for the track (e.g. "Continue where you left off"). */
  label: string
  /** Optional per-row card-width override. Defaults to the standard
   *  262px (desktop) / 220px (mobile) cell — the Featured Series shelf
   *  passes wider 400px / 280px cells. */
  cardWidth?: { desktop: number; mobile: number }
  /** Carousel-arrow tone. `light` (default) reads over cover images (compact
   *  shelf cards); `dark` reads over the larger cards' white bodies (catalog /
   *  `RecommendedLargeCard`), where the arrow's center sits below the image. */
  arrowTone?: 'light' | 'dark'
  /** Keep the scroll arrows visible whenever the track can scroll (instead of
   *  the default hover-reveal). The Recommended for You page passes this so the
   *  right arrow is a persistent, discoverable affordance. */
  arrowsPersistent?: boolean
}

const DESKTOP_CARD_WIDTH = 172
const MOBILE_CARD_WIDTH = 140
const GAP = 16
const PEEK = 16
// A horizontal scroll container (`overflow-x: auto`) forces `overflow-y` to
// compute to `auto` too, so it clips each card's drop-shadow at its own
// rectangular top/bottom edge — the hover shadow gets sliced into hard "square"
// corners. Pad the track vertically to give the shadow room, then cancel the
// padding with an equal negative margin so nothing shifts (cards, the header
// gap, and inter-shelf spacing all stay put — only the clip region grows).
const SHADOW_PAD = 14

/**
 * Each snap cell is itself a single-cell grid. The outer track stretches every
 * cell to the tallest card's height (CSS grid `align-items: stretch`), and this
 * inner grid passes that height down to the card (a plain block child would
 * keep its own shorter content height, leaving cards mismatched). Cards with a
 * flex-column body (`.cre-card`) then expand their body via `flex: 1`, pinning
 * the price/CTA footer to the bottom so every card in a row lines up.
 */
const CELL_STYLE: React.CSSProperties = { scrollSnapAlign: 'start', display: 'grid' }

export function ShelfScroller({
  children,
  label,
  cardWidth: cardWidthOverride,
  arrowTone = 'light',
  arrowsPersistent = false,
}: Props) {
  const isMobile = useMediaQuery('(max-width: 599px)')
  const desktop = cardWidthOverride?.desktop ?? DESKTOP_CARD_WIDTH
  const mobile = cardWidthOverride?.mobile ?? MOBILE_CARD_WIDTH
  const cardWidth = isMobile ? mobile : desktop
  const railRef = useRef<HTMLDivElement | null>(null)
  const [hovering, setHovering] = useState(false)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)

  // Re-measure scroll bounds on mount + on every scroll / resize so the
  // arrows fade out once the user has reached an edge.
  useEffect(() => {
    const rail = railRef.current
    if (!rail) return
    const update = () => {
      const { scrollLeft, scrollWidth, clientWidth } = rail
      setCanScrollLeft(scrollLeft > 1)
      setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 1)
    }
    update()
    rail.addEventListener('scroll', update, { passive: true })
    const ro = new ResizeObserver(update)
    ro.observe(rail)
    return () => {
      rail.removeEventListener('scroll', update)
      ro.disconnect()
    }
  }, [])

  const scrollByOne = (direction: 'prev' | 'next') => {
    const rail = railRef.current
    if (!rail) return
    const delta = (cardWidth + GAP) * (direction === 'next' ? 1 : -1)
    rail.scrollBy({ left: delta, behavior: 'smooth' })
  }

  // Expose the active cell width to descendant card cells via a custom
  // property so each cell can size itself without prop-drilling.
  const railStyle: React.CSSProperties = {
    display: 'grid',
    gridAutoFlow: 'column',
    gridAutoColumns: `${cardWidth}px`,
    gap: GAP,
    overflowX: 'auto',
    // Bleed past the right edge so the trailing card peeks ~30%. The
    // negative right margin keeps the wrapper aligned to the section's
    // padding while still allowing the track to extend.
    // Right peek already bleeds SHADOW_PAD+ past the edge, so the trailing
    // card's shadow has room there; PEEK stays the wider peek value.
    paddingRight: PEEK,
    marginRight: -PEEK,
    // Breathing room on the other three sides so card shadows aren't clipped
    // square by the scroll container (a horizontal scroller forces `overflow-y`
    // to `auto`, and the left/top/bottom content edges otherwise slice the
    // shadow). Padding + equal negative margin ⇒ zero net layout shift (the
    // first card stays flush with the shelf header; rows/spacing are unchanged).
    paddingTop: SHADOW_PAD,
    paddingBottom: SHADOW_PAD,
    paddingLeft: SHADOW_PAD,
    marginTop: -SHADOW_PAD,
    marginBottom: -SHADOW_PAD,
    marginLeft: -SHADOW_PAD,
    scrollSnapType: 'x mandatory',
    // Inset the snap start by the left pad so the first card snaps flush with
    // the shelf header (not to the padded box edge, which would negate
    // `paddingLeft` and shift the card left into the shadow gutter). End stays 0.
    scrollPaddingInlineStart: SHADOW_PAD,
    scrollPaddingInlineEnd: 0,
    // Drop the default scrollbar — the arrows + peek already communicate
    // overflow on desktop; mobile users swipe.
    scrollbarWidth: 'none',
  }

  return (
    <div
      role="region"
      aria-label={label}
      style={{ position: 'relative' }}
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
    >
      <div ref={railRef} style={railStyle} className="cre-shelf-scroller">
        {/* Each child is expected to render a single card cell. We wrap with
            scroll-snap-align so the track snaps regardless of which card
            component each consumer renders. */}
        {Array.isArray(children)
          ? children.map((child, i) => (
              <div key={(child as { key?: string })?.key ?? i} style={CELL_STYLE}>
                {child}
              </div>
            ))
          : (
              <div style={CELL_STYLE}>{children}</div>
            )}
      </div>

      {!isMobile && (arrowsPersistent || hovering) && canScrollLeft && (
        <CarouselArrow direction="prev" tone={arrowTone} onClick={() => scrollByOne('prev')} />
      )}
      {!isMobile && (arrowsPersistent || hovering) && canScrollRight && (
        <CarouselArrow direction="next" tone={arrowTone} onClick={() => scrollByOne('next')} />
      )}
    </div>
  )
}
