import type { CSSProperties, ReactNode } from 'react'

/**
 * Wrapper that dims and desaturates its children, then overlays a
 * vertical fade gradient + a centered "Join to unlock" pill anchored
 * to the bottom edge. Used by the non-member `/membership` view to
 * tease real content behind a marketing CTA.
 *
 * Anatomy:
 *
 *   ┌──────────────────────────────────────────┐
 *   │   <children, dimmed + desaturated>      │
 *   │                                          │
 *   │   (vertical fade gradient overlay)       │
 *   │                                          │
 *   │             [🔑  pillLabel]              │
 *   └──────────────────────────────────────────┘
 *
 * `pointer-events: none` on the dimmer means the underlying content
 * stays render-only — clicks land on the pill, never on the locked
 * cards.
 *
 * Mirrors `.locked-wrap` / `.locked-overlay` / `.locked-pill` in
 * `explorations/membership-landing/membership-landing.html`.
 */
type Props = {
  children: ReactNode
  /** Pill text. Defaults to "Join to unlock"; per-tab labels are
   *  passed from `MembershipLandingPage` ("445+ assets unlock with
   *  membership" etc.). */
  pillLabel?: string
}

export function LockedPreview({
  children,
  pillLabel = 'Join to unlock',
}: Props) {
  return (
    <div style={wrapStyle}>
      <div style={dimmerStyle}>{children}</div>
      <div style={overlayStyle}>
        <a href="/membership/plans" style={pillStyle}>
          <span aria-hidden style={keyStyle}>
            🔑
          </span>
          {pillLabel}
        </a>
      </div>
    </div>
  )
}

/* ─── styles ───────────────────────────────────────────────────────── */

const wrapStyle: CSSProperties = {
  position: 'relative',
  overflow: 'hidden',
  borderRadius: 'var(--radius-lg)',
}

const dimmerStyle: CSSProperties = {
  // Saturation + opacity drop so the underlying content reads as
  // present-but-restricted. `pointer-events: none` prevents
  // interaction with the locked surface — only the pill's anchor is
  // reachable.
  opacity: 0.55,
  filter: 'saturate(0.6)',
  pointerEvents: 'none',
}

const overlayStyle: CSSProperties = {
  position: 'absolute',
  inset: 0,
  // Same triple-stop fade the exploration uses — transparent at the
  // top, hits 95% at the bottom so the pill reads against a near-
  // solid plate without a hard edge.
  background:
    'linear-gradient(180deg, rgba(245,245,245,0) 0%, rgba(245,245,245,0.55) 60%, rgba(245,245,245,0.95) 100%)',
  display: 'flex',
  alignItems: 'flex-end',
  justifyContent: 'center',
  padding: '0 0 22px',
}

const pillStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 8,
  padding: '9px 18px',
  background: 'var(--color-neutral-900)',
  color: 'var(--color-text-inverse)',
  borderRadius: 'var(--radius-pill)',
  fontFamily: 'var(--font-body)',
  fontSize: 12,
  fontWeight: 700,
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
  textDecoration: 'none',
  whiteSpace: 'nowrap',
}

const keyStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 18,
  height: 18,
  borderRadius: '50%',
  background: 'var(--color-warning-500)',
  color: 'var(--color-neutral-900)',
  fontSize: 10,
}
