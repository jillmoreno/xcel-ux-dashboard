import type { CSSProperties } from 'react'
import { EmptyState } from '@/components/ui/EmptyState'
import { SimpleCard } from '@/components/dashboard/recommended/SimpleCard'
import { LibraryResourceCard } from './LibraryResourceCard'
import { LIBRARY_TYPE_ICON } from './libraryTypeIcon'
import {
  TYPE_LABELS,
  type LibraryResource,
  type LibraryResourceType,
} from '@/data/membership/libraryFixtures'

/** Content types that take the **primary** bar/accent on the shelf card —
 *  moving imagery (videos + webinar recordings). Every other type (article,
 *  e-book, infographic, template) takes the **secondary** color. */
const PRIMARY_BAR_TYPES: readonly LibraryResourceType[] = ['video', 'webinar-recording']

/** Bottom-bar + icon-badge color for a shelf card, keyed to content type:
 *  video / webinar-recording → primary; all other types → secondary. */
function barColorFor(type: LibraryResourceType): string {
  return PRIMARY_BAR_TYPES.includes(type)
    ? 'var(--color-primary-700)'
    : 'var(--color-secondary-700)'
}

/** Bottom-bar meta row for the shelf card — content-type icon + type name,
 *  a divider, then the star rating. Matches the Dashboard's "Recommended for
 *  You" cards (`SimpleCard` `meta`): the shared component renders the icon ·
 *  label │ ★ rating layout and drops the redundant top-left corner badge. */
function metaFor(resource: LibraryResource) {
  return {
    Icon: LIBRARY_TYPE_ICON[resource.type],
    label: TYPE_LABELS[resource.type],
    rating: resource.rating,
  }
}

/**
 * The Resource Library results column body: an "N Results" header
 * + a 3-up auto-fill grid of `<LibraryResourceCard>`. Empty state
 * surfaces when the active filters drop the result list to zero.
 *
 * Grid column width matches the canonical CourseCard footprint
 * (265px min-width via auto-fill) so the library reads as a
 * sibling surface to the catalog / my-courses grids — same rhythm,
 * same minimum card.
 */
type Props = {
  resources: LibraryResource[]
  /** Click handler for the empty-state CTA — wires "Clear all
   *  filters" so the empty state recovers gracefully. */
  onClearFilters?: () => void
  /** `default` → the full `LibraryResourceCard` (image header + body +
   *  rating). `shelf` → the compact Recommended-style `SimpleCard`
   *  (square image + bottom title bar). The Dashboard Rebrand shell uses
   *  `shelf`; `/membership?tab=library` keeps `default`. */
  cardVariant?: 'default' | 'shelf'
  /** Shelf-only: float the title + meta over the cover behind a dark gradient
   *  instead of the solid footer band (the Home "Recommended for you" tile
   *  style). Driven by the `learning-library-card-style` `image-shelf` variant.
   *  Ignored for the `default` card. */
  bannerless?: boolean
  /** When set (Dashboard Rebrand shell), shelf cards open the resource viewer
   *  in-shell via this callback instead of navigating to `/resources/:id`. */
  onOpenResource?: (resourceId: string) => void
}

export function LibraryGrid({
  resources,
  onClearFilters,
  cardVariant = 'default',
  bannerless = false,
  onOpenResource,
}: Props) {
  const shelf = cardVariant === 'shelf'
  return (
    <section
      aria-label="Library results"
      style={{ display: 'flex', flexDirection: 'column', gap: 16 }}
    >
      <header style={headerStyle}>
        <h2 style={headingStyle}>Results</h2>
        <span style={countStyle}>
          {resources.length} {resources.length === 1 ? 'Result' : 'Results'}
        </span>
      </header>

      {resources.length === 0 ? (
        <EmptyState
          title="No resources match your filters"
          description="Try clearing one of the active filters to widen the results."
          {...(onClearFilters
            ? { actionLabel: 'Clear filters', actionTo: '#' }
            : {})}
        />
      ) : (
        <div role="list" style={shelf ? shelfGridStyle : gridStyle}>
          {resources.map((resource) => (
            <div key={resource.id} role="listitem">
              {shelf ? (
                onOpenResource ? (
                  <SimpleCard
                    onClick={() => onOpenResource(resource.id)}
                    imageUrl={resource.imageUrl}
                    title={resource.title}
                    Icon={LIBRARY_TYPE_ICON[resource.type]}
                    meta={metaFor(resource)}
                    barColor={barColorFor(resource.type)}
                    iconBg={barColorFor(resource.type)}
                    bannerless={bannerless}
                  />
                ) : (
                  <SimpleCard
                    to={`/resources/${resource.id}`}
                    imageUrl={resource.imageUrl}
                    title={resource.title}
                    Icon={LIBRARY_TYPE_ICON[resource.type]}
                    meta={metaFor(resource)}
                    barColor={barColorFor(resource.type)}
                    iconBg={barColorFor(resource.type)}
                    bannerless={bannerless}
                  />
                )
              ) : (
                <LibraryResourceCard data={resource} />
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  )
}

/* ─── styles ───────────────────────────────────────────────────────── */

const headerStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'baseline',
  gap: 10,
}

const headingStyle: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-heading)',
  fontSize: 22,
  fontWeight: 700,
  // Adaptive: primary-800 is invisible navy-on-navy when the page goes dark. #1
  color: 'var(--color-text-primary)',
}

const countStyle: CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontSize: 13,
  fontWeight: 500,
  color: 'var(--color-text-secondary)',
}

const gridStyle: CSSProperties = {
  display: 'grid',
  // Flexible tracks (min ~232px, growing via 1fr) so the cards fill the row
  // instead of leaving a fixed-265px gutter — 3 fit across the rebrand's
  // results column, and the grid flows to more columns on wider surfaces.
  gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 232px), 1fr))',
  gap: 16,
}

// Shelf variant — a wrapping grid of compact square `SimpleCard`s, sized to
// the Recommended-shelf footprint but flowing to fill the results column.
const shelfGridStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
  gap: 16,
}
