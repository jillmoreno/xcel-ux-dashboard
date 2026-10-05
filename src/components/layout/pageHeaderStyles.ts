import type { CSSProperties } from 'react'

/**
 * THE PAGE-HEADER GEOMETRY — one set of numbers, two headers.
 *
 * `HomePageHeader` (greeting over "Home") and `SectionPageHeader` (a crumb over
 * "My Courses") are the SAME object with a different top line, and the ask that
 * created the second one said so: the section title has to sit "in the same
 * location and font size as the current Home title".
 *
 * ⚠ THAT IS A COUPLING, NOT A COINCIDENCE, which is why the numbers live here
 * rather than being copied into the second file. Re-styling Home's title and
 * leaving Courses at the old size is a diff nobody would read as a bug — the
 * two screens are never on screen together. Shared, it cannot happen.
 *
 * ⚠ A PLAIN `.ts` MODULE ON PURPOSE. These are not components, and exporting
 * them from either `.tsx` file trips react-refresh's "only export components"
 * rule — the same split `navPlacement.ts` makes for the placement predicates.
 *
 * Measured against each other in the browser, 2026-10-02: the crumb lands at
 * the greeting's y (301) and the title at Home's (324), so switching between
 * the two screens moves no text.
 */

/* The header owns BOTH gutters: 24 off the top, 16 down to the first card.
   `SectionShell` drops its own 24 while this is above it, so these are the only
   two numbers involved rather than four stacked. */
export const pageHeaderWrapStyle: CSSProperties = { padding: '24px 40px 16px' }

/** Home's greeting line. The section header replaces it with the crumb rather
 *  than restyling it — see `sectionCrumbRowStyle`. */
export const pageHeaderEyebrowStyle: CSSProperties = {
  margin: '0 0 6px',
  fontFamily: 'var(--font-body)',
  fontSize: 11,
  lineHeight: '16.5px',
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  color: 'var(--color-primary-700)',
}

export const pageHeaderTitleStyle: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-heading, Georgia, serif)',
  fontSize: 28,
  fontWeight: 700,
  lineHeight: '32px',
  color: 'var(--color-text-primary)',
}
