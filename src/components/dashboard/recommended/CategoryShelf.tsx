import { Children, type ReactNode } from 'react'
import { ShelfHeader } from './ShelfHeader'
import { ShelfScroller } from './ShelfScroller'

type Props = {
  id: string
  eyebrow?: string
  title: string
  descriptor?: ReactNode
  seeAllHref: string
  children: ReactNode
  /** Forwarded to `ShelfScroller` — lets a row override the default 262px /
   *  220px cell width. Featured Series uses the wider 400 / 280 pairing. */
  cardWidth?: { desktop: number; mobile: number }
  /** Optional override for the "See All →" link label. The Unlock-with-
   *  Premium shelf uses "Compare plans →" instead. */
  seeAllLabel?: string
  /** Forwarded to `ShelfScroller` — `dark` for the larger (catalog) cards so
   *  the scroll arrows read over the cards' white bodies. */
  arrowTone?: 'light' | 'dark'
  /** Drop the shelf header's "See All" link — the Recommended for You page
   *  relies on the horizontal carousel to reveal everything. */
  hideSeeAll?: boolean
  /** Keep the scroll arrows visible whenever scrollable (Recommended for You
   *  page), instead of the default hover-reveal. Forwarded to `ShelfScroller`. */
  arrowsPersistent?: boolean
}

/**
 * Composes one recommended-for-you shelf: header (eyebrow / title /
 * descriptor / see-all) over a horizontal scroller of card cells.
 *
 * Returns `null` when `children` resolves to an empty array — personalized
 * shelves (Continue where you left off, For your license, Renew before…)
 * should disappear cleanly when nothing qualifies rather than rendering a
 * "Nothing here yet" empty state. `buildShelves` also filters empty rows
 * out before they reach this component, so this is a defensive second
 * layer.
 */
export function CategoryShelf({
  id,
  eyebrow,
  title,
  descriptor,
  seeAllHref,
  children,
  cardWidth,
  seeAllLabel,
  arrowTone,
  hideSeeAll,
  arrowsPersistent,
}: Props) {
  const count = Children.count(children)
  if (count === 0) return null

  return (
    <section aria-labelledby={`shelf-${id}-title`}>
      <ShelfHeader
        eyebrow={eyebrow}
        title={title}
        descriptor={descriptor}
        seeAllHref={seeAllHref}
        seeAllLabel={seeAllLabel}
        hideSeeAll={hideSeeAll}
      />
      <ShelfScroller
        label={title}
        cardWidth={cardWidth}
        arrowTone={arrowTone}
        arrowsPersistent={arrowsPersistent}
      >
        {children}
      </ShelfScroller>
    </section>
  )
}
