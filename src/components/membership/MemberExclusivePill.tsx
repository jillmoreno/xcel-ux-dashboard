import type { CSSProperties } from 'react'
import { Lock } from '@/icons'

/**
 * "Member Exclusive" locked pill (Figma 63:16150 / 63:16401) — a magenta
 * `cta-100` chip with a lock glyph + label in `cta-700`. Used on non-member
 * (non-member) cards in place of their normal action link (Partner Offers,
 * Resources).
 */
export function MemberExclusivePill() {
  return (
    <span style={pillStyle}>
      <Lock size={13} aria-hidden />
      Member Exclusive
    </span>
  )
}

const pillStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 8,
  alignSelf: 'flex-start',
  padding: '4px 8px',
  borderRadius: 'var(--radius-pill)',
  background: 'var(--color-cta-100)',
  color: 'var(--color-cta-700)',
  fontFamily: 'var(--font-body)',
  fontSize: 14,
  fontWeight: 600,
}
