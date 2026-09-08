import type { CSSProperties } from 'react'
import { Select } from '@/components/ui/Select'
import { Checkbox } from '@/components/ui/Checkbox'
import { FilterAccordion } from '@/components/catalog/FilterAccordion'
import {
  TYPE_LABELS,
  type LibraryResourceType,
} from '@/data/membership/libraryFixtures'
import { LibraryLengthSlider } from './LibraryLengthSlider'

/**
 * Left-rail filter column for the Resource Library tab. Five
 * filter sections, all URL-driven (state lives in the parent
 * `<LibraryPanel>`):
 *
 *   - Sort By           — Newest / Alphabetical / Rating (5 options)
 *   - Content Length    — dual-thumb range slider on durationMinutes
 *   - Content Type      — multi-select (Article, E-book, Infographic,
 *                          Template, Video, Webinar Recording)
 *   - Tags              — multi-select; derived per-brand
 *   - Status            — multi-select (Viewed / Not Viewed)
 *
 * Accordions default to open so a reviewer sees the full filter
 * surface at a glance — matches the screenshot's expanded state.
 *
 * "Clear All Filters" only activates when at least one filter is
 * set; clicking it drops every filter param in one shot (handled
 * upstream).
 */

export const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest' },
  { value: 'title-asc', label: 'Alphabetical (A to Z)' },
  { value: 'title-desc', label: 'Alphabetical (Z to A)' },
  { value: 'rating-desc', label: 'Rating (High to Low)' },
  { value: 'rating-asc', label: 'Rating (Low to High)' },
] as const
export type LibrarySort = (typeof SORT_OPTIONS)[number]['value']

export const TYPE_FILTER_OPTIONS: LibraryResourceType[] = [
  'article',
  'e-book',
  'infographic',
  'template',
  'video',
  'webinar-recording',
]

/** Status filter accepts the two engagement states the screenshot
 *  shows. Multi-select (a reviewer could untick both if they want
 *  the union — same as "show all"). */
export type LibraryStatus = 'viewed' | 'not-viewed'
export const STATUS_OPTIONS: { value: LibraryStatus; label: string }[] = [
  { value: 'viewed', label: 'Viewed' },
  { value: 'not-viewed', label: 'Not Viewed' },
]

type Props = {
  sort: LibrarySort
  onSortChange: (next: LibrarySort) => void

  /** Min / max of the brand's `durationMinutes` — bounds for the
   *  length slider. */
  lengthBounds: [number, number]
  /** Currently-selected sub-range. `[min, max]` == "Any". */
  lengthValue: [number, number]
  onLengthChange: (next: [number, number]) => void

  selectedTypes: Set<LibraryResourceType>
  onToggleType: (type: LibraryResourceType) => void

  /** Brand-derived list of available tag values — drives the
   *  checkbox set. */
  tagOptions: string[]
  selectedTags: Set<string>
  onToggleTag: (tag: string) => void

  selectedStatuses: Set<LibraryStatus>
  onToggleStatus: (status: LibraryStatus) => void

  /** When `true`, the "Clear All Filters" link renders in its active
   *  (primary-colored) state and accepts a click. */
  hasFilters: boolean
  onClearAll: () => void
}

export function LibraryFilterRail({
  sort,
  onSortChange,
  lengthBounds,
  lengthValue,
  onLengthChange,
  selectedTypes,
  onToggleType,
  tagOptions,
  selectedTags,
  onToggleTag,
  selectedStatuses,
  onToggleStatus,
  hasFilters,
  onClearAll,
}: Props) {
  const [boundMin, boundMax] = lengthBounds
  const lengthActiveCount =
    lengthValue[0] !== boundMin || lengthValue[1] !== boundMax ? 1 : 0

  return (
    <aside aria-label="Resource Library filters" style={railStyle}>
      <button
        type="button"
        onClick={onClearAll}
        disabled={!hasFilters}
        aria-disabled={!hasFilters}
        style={clearAllStyle(hasFilters)}
      >
        Clear All Filters
      </button>

      <div style={sortBlockStyle}>
        <label style={sortLabelStyle}>Sort By</label>
        <Select
          label="Sort library resources"
          options={SORT_OPTIONS.map((o) => ({ ...o }))}
          value={sort}
          onChange={(e) => onSortChange(e.target.value as LibrarySort)}
          style={{ width: '100%' }}
          valueWeight={400}
        />
      </div>

      <div style={accordionsStyle}>
        <FilterAccordion
          label="Content Length"
          defaultOpen
          activeCount={lengthActiveCount}
        >
          <LibraryLengthSlider
            min={boundMin}
            max={boundMax}
            value={lengthValue}
            onChange={onLengthChange}
          />
        </FilterAccordion>

        <FilterAccordion
          label="Content Type"
          defaultOpen
          activeCount={selectedTypes.size}
        >
          <div style={checkboxListStyle}>
            {TYPE_FILTER_OPTIONS.map((type) => (
              <Checkbox
                key={type}
                value={type}
                label={TYPE_LABELS[type]}
                checked={selectedTypes.has(type)}
                onChange={() => onToggleType(type)}
              />
            ))}
          </div>
        </FilterAccordion>

        <FilterAccordion
          label="Tags"
          defaultOpen
          activeCount={selectedTags.size}
        >
          {tagOptions.length === 0 ? (
            <p style={emptyAccordionStyle}>No tags for this brand yet.</p>
          ) : (
            <div style={checkboxListStyle}>
              {tagOptions.map((tag) => (
                <Checkbox
                  key={tag}
                  value={tag}
                  label={tag}
                  checked={selectedTags.has(tag)}
                  onChange={() => onToggleTag(tag)}
                />
              ))}
            </div>
          )}
        </FilterAccordion>

        <FilterAccordion
          label="Status"
          defaultOpen
          activeCount={selectedStatuses.size}
        >
          <div style={checkboxListStyle}>
            {STATUS_OPTIONS.map((opt) => (
              <Checkbox
                key={opt.value}
                value={opt.value}
                label={opt.label}
                checked={selectedStatuses.has(opt.value)}
                onChange={() => onToggleStatus(opt.value)}
              />
            ))}
          </div>
        </FilterAccordion>
      </div>
    </aside>
  )
}

/* ─── styles ───────────────────────────────────────────────────────── */

const railStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 16,
  // Fill the parent grid's rail track (LibraryPanel sets it to 200px, matching
  // the Courses / Catalog / Certificates rails) instead of forcing a fixed
  // 240px width that overflowed the narrower track. `minWidth: 0` lets it
  // shrink cleanly inside the grid column.
  minWidth: 0,
}

function clearAllStyle(active: boolean): CSSProperties {
  return {
    alignSelf: 'flex-start',
    background: 'transparent',
    border: 'none',
    padding: 0,
    fontFamily: 'var(--font-body)',
    fontSize: 13,
    fontWeight: 600,
    color: active ? 'var(--color-action)' : 'var(--color-text-tertiary)',
    cursor: active ? 'pointer' : 'default',
    textDecoration: active ? 'underline' : 'none',
    textUnderlineOffset: 3,
  }
}

const sortBlockStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 6,
}

const sortLabelStyle: CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontSize: 13,
  fontWeight: 600,
  color: 'var(--color-text-secondary)',
}

const accordionsStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
}

const checkboxListStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 4,
}

const emptyAccordionStyle: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-body)',
  fontSize: 12,
  fontStyle: 'italic',
  color: 'var(--color-text-tertiary)',
}
