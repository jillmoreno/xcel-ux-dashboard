import type { CSSProperties } from 'react'

/** Shared card shell + heading styles for the Learning-at-a-Glance bento. */
export const glanceCardStyle: CSSProperties = {
  background: 'var(--color-surface-card)',
  border: '1px solid var(--color-border-subtle)',
  borderRadius: 'var(--radius-lg)',
  padding: 24,
  boxShadow: 'var(--shadow-card)',
}

export const glanceCardHeadStyle: CSSProperties = {
  margin: '0 0 16px',
  fontFamily: 'var(--font-heading)',
  fontSize: 13,
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
  color: 'var(--color-secondary-700)',
}
