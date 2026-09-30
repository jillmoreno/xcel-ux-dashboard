import type { CSSProperties } from 'react'

/**
 * The two layout constants the Profile edit panels share, in their own module.
 *
 * They lived in `profileFormBits.tsx` until the `react-refresh` rule pointed
 * out the cost: a file that exports both components and plain values loses Fast
 * Refresh, so editing one of these styles full-reloads the page and drops
 * whatever sheet state you were looking at.
 */

/** Scrolling body of a sheet, between the header divider and the footer. */
export const panelBodyStyle: CSSProperties = {
  flex: 1,
  overflowY: 'auto',
  padding: '20px 24px 24px',
  display: 'flex',
  flexDirection: 'column',
  gap: 18,
}

/** Lead-in copy at the top of a panel body. */
export const introTextStyle: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-body)',
  fontSize: 14,
  lineHeight: '20px',
  color: 'var(--color-text-secondary)',
}
