import type { CSSProperties, ReactNode } from 'react'

/**
 * COMPASS COURSE CONTENT — Figma "Atlas-Compass-Global-Navigation", node
 * 49:3338, 2026-09-24.
 *
 * The lesson's stage in the Compass course player: a bordered, rounded box that
 * FILLS the space between the player controls bar and the navigation footer,
 * 56px in from every side (the designer's ask; the Overview's gutter). With no
 * lesson content yet it shows the design's "Course Content" placeholder label.
 *
 * Config-driven like the other Compass pieces: pass `children` to render a
 * lesson in the box instead of the placeholder.
 *
 * Departure: the product serif (`--font-heading-serif`) for Source Serif 4.
 */
export function CompassCourseContent({ children }: { children?: ReactNode }) {
  return (
    <div style={FRAME}>
      <section aria-label="Course content" style={BOX}>
        {children ?? <p style={PLACEHOLDER}>Course Content</p>}
      </section>
    </div>
  )
}

/* ── Styles ─────────────────────────────────────────────────────────────── */

/* A flex column that grows to its parent's height, so the box fills it. */
const FRAME: CSSProperties = {
  flex: '1 1 auto',
  display: 'flex',
  flexDirection: 'column',
  padding: 56,
  boxSizing: 'border-box',
}
const BOX: CSSProperties = {
  flex: '1 1 auto',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  padding: '24px 0 1px',
  boxSizing: 'border-box',
  overflow: 'clip',
  borderRadius: 12,
  border: '1px solid var(--color-compass-content-border)',
  background: 'var(--color-compass-page)',
}
const PLACEHOLDER: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-heading-serif)',
  fontWeight: 500,
  fontSize: 34,
  lineHeight: '39px',
  letterSpacing: '-0.01em',
  textAlign: 'center',
  color: 'var(--color-compass-content-placeholder)',
}
