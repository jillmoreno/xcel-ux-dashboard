import type { CSSProperties } from 'react'

/**
 * In-flow eyebrow + H2 that sits between the `<PlanTierStrip>` and
 * the tab bar on the non-member `/membership` view. Tells the visitor
 * the locked tabs below are a real peek of the member experience.
 *
 * Mirrors the exploration's `.preview-banner` block — sentence-case
 * heading, lighter `--font-heading` weight, low-saturation surface
 * (matches the page background so it doesn't compete visually).
 */
export function PreviewBanner() {
  return (
    <div style={bannerStyle}>
      <span style={eyebrowStyle}>A peek inside Premium</span>
      <h2 style={headlineStyle}>Here's what unlocks when you join</h2>
    </div>
  )
}

const bannerStyle: CSSProperties = {
  padding: '18px 0 4px',
  background: 'transparent',
}

const eyebrowStyle: CSSProperties = {
  display: 'block',
  marginBottom: 6,
  fontFamily: 'var(--font-body)',
  fontSize: 11,
  fontWeight: 600,
  letterSpacing: '0.24em',
  textTransform: 'uppercase',
  color: 'var(--color-text-tertiary)',
}

const headlineStyle: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-heading)',
  fontSize: 22,
  fontWeight: 500,
  lineHeight: 1.3,
  color: 'var(--color-text-primary)',
}
