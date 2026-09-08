import type { CSSProperties } from 'react'
import { X } from '@/icons'
import {
  CATEGORY_LABELS,
  type LibraryCategory,
} from '@/data/membership/libraryFixtures'

/**
 * Single-select pill row at the top of the library results column.
 * Renders one chip per category that the active brand actually has
 * content for (derived upstream via `categoriesForBrand(brand)`).
 *
 * Two visual states per chip:
 *
 *   - Unselected: outlined pill, primary-800 text, no fill. Click
 *     applies the filter.
 *   - Selected:   filled primary-700 pill, white text, X icon on
 *                 the right. Click removes the filter.
 *
 * Matches the screenshot's Category row exactly — selecting a chip
 * dims everything else and renders the active chip with a trailing
 * close affordance.
 */
type Props = {
  categories: LibraryCategory[]
  active: LibraryCategory | null
  onChange: (next: LibraryCategory | null) => void
}

export function LibraryCategoryChips({ categories, active, onChange }: Props) {
  return (
    <section aria-label="Filter by category" style={filterRowStyle}>
      <h2 style={filterLabelStyle}>Category</h2>
      <div role="group" style={chipsRowStyle}>
        {categories.map((cat) => {
          const isActive = active === cat
          return (
            <button
              key={cat}
              type="button"
              aria-pressed={isActive}
              onClick={() => onChange(isActive ? null : cat)}
              className={chipClassName(isActive)}
              style={chipStyle(isActive)}
            >
              {CATEGORY_LABELS[cat]}
              {isActive && (
                <span aria-hidden style={chipCloseStyle}>
                  <X size={11} aria-hidden />
                </span>
              )}
            </button>
          )
        })}
      </div>
    </section>
  )
}

/* ─── styles ───────────────────────────────────────────────────────── */

// Inline "Label  [pill] [pill] …" row (matches the design). The label sits in a
// fixed-width column so the Profession + Category pill rows line up; it's
// line-height 32 so it centers against the first chip row when the pills wrap.
export const filterRowStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'flex-start',
  gap: 12,
}

export const filterLabelStyle: CSSProperties = {
  flex: 'none',
  width: 84,
  margin: 0,
  lineHeight: '32px',
  fontFamily: 'var(--font-body)',
  fontSize: 14,
  fontWeight: 700,
  color: 'var(--color-text-primary)',
}

const chipsRowStyle: CSSProperties = {
  flex: 1,
  minWidth: 0,
  display: 'flex',
  flexWrap: 'wrap',
  gap: 8,
}

// Layout-only inline styles; the color / border / background (and the hover
// fill) live on the `.cre-library-chip` class in tokens.css so `:hover` works
// — inline styles can't express hover. Pair with `chipClassName(active)`.
//
// `withClose` tightens the right padding to seat a trailing X close affordance
// (active Category chips). Chips without an X (Profession radio chips) pass
// `false` so their padding stays symmetric and matches the inactive pills.
export function chipStyle(withClose = false): CSSProperties {
  return {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    height: 32,
    padding: withClose ? '0 6px 0 14px' : '0 14px',
    borderRadius: 'var(--radius-pill)',
    fontFamily: 'var(--font-body)',
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
  }
}

/** Class carrying the chip's color states + hover fill (see tokens.css). */
export function chipClassName(active: boolean): string {
  return active ? 'cre-library-chip is-active' : 'cre-library-chip'
}

const chipCloseStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 18,
  height: 18,
  borderRadius: '50%',
  background: 'rgba(255, 255, 255, 0.2)',
  color: 'var(--color-text-inverse)',
}
