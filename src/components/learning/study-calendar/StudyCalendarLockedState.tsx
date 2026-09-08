import type { CSSProperties, ReactNode } from 'react'
import { Lock } from '@/icons'

/**
 * Non-Member STC overlay for the Study Calendar tab.
 *
 * Renders a dimmed + desaturated preview of the Daily view behind a
 * marketing CTA — "Stay on track for your Series exam" + body copy +
 * a "Get STC membership" button that fires
 * `console.info('cta:get-stc-membership')` (stub; replace with the
 * real CTA wiring once the STC commerce flow is built).
 *
 * Same visual treatment family as `LockedPreview` on the Membership
 * landing page — `pointer-events: none` on the dimmer means clicks
 * only ever land on the CTA, never on the locked content underneath.
 */
type Props = {
  /** The Daily view (or any fallback) — rendered dimmed behind the
   *  overlay. Keeps the page reading as a real surface that's being
   *  withheld, not a placeholder. */
  preview: ReactNode
}

export function StudyCalendarLockedState({ preview }: Props) {
  return (
    <section
      role="region"
      aria-label="Study calendar — STC membership required"
      style={wrapStyle}
    >
      <div aria-hidden style={dimmerStyle}>
        {preview}
      </div>
      <div style={overlayStyle}>
        <div style={cardStyle}>
          <span aria-hidden style={iconBadgeStyle}>
            <Lock size={20} aria-hidden />
          </span>
          <h3 style={titleStyle}>Stay on track for your Series exam</h3>
          <p style={bodyStyle}>
            STC membership unlocks your personalized pacing calendar —
            daily tasks, exam-date countdown, and an on-track / off-
            track signal that updates as you complete work.
          </p>
          <button
            type="button"
            onClick={() => {
              // TODO(cta): swap for the real STC checkout / upsell once it's
              // wired. Stub mirrors the AddToCart pattern in the rest of the
              // platform — see `src/components/courses/*` examples.
              console.info('cta:get-stc-membership')
            }}
            style={primaryCtaStyle}
          >
            Get STC membership
          </button>
        </div>
      </div>
    </section>
  )
}

/* ─── styles ───────────────────────────────────────────────────────── */

const wrapStyle: CSSProperties = {
  position: 'relative',
  overflow: 'hidden',
  borderRadius: 'var(--radius-lg)',
}

const dimmerStyle: CSSProperties = {
  // Saturation + opacity drop so the daily view reads as
  // present-but-restricted. `pointer-events: none` prevents
  // interaction with the locked surface — only the CTA is reachable.
  opacity: 0.45,
  filter: 'saturate(0.55) blur(2px)',
  pointerEvents: 'none',
}

const overlayStyle: CSSProperties = {
  position: 'absolute',
  inset: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  // Soft fade so the upsell card reads against a near-solid plate
  // without a hard edge against the dimmed preview.
  background:
    'linear-gradient(180deg, rgba(245,245,245,0.4) 0%, rgba(245,245,245,0.85) 100%)',
  padding: '24px',
}

const cardStyle: CSSProperties = {
  maxWidth: 420,
  width: '100%',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  textAlign: 'center',
  gap: 12,
  padding: '28px 24px',
  background: 'var(--color-surface-card)',
  border: '1px solid var(--color-border-subtle)',
  borderRadius: 'var(--radius-lg)',
  boxShadow: 'var(--shadow-popover)',
}

const iconBadgeStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 44,
  height: 44,
  borderRadius: 'var(--radius-pill)',
  background: 'var(--color-tertiary-600)',
  color: 'var(--color-neutral-50)',
}

const titleStyle: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-heading)',
  fontSize: 20,
  fontWeight: 700,
  lineHeight: '28px',
  color: 'var(--color-text-primary)',
}

const bodyStyle: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-body)',
  fontSize: 14,
  lineHeight: '20px',
  color: 'var(--color-text-secondary)',
}

const primaryCtaStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  marginTop: 8,
  padding: '10px 20px',
  minHeight: 44,
  borderRadius: 'var(--radius-md)',
  background: 'var(--color-primary-500)',
  color: 'var(--color-text-inverse)',
  fontFamily: 'var(--font-body)',
  fontSize: 14,
  fontWeight: 700,
  border: 'none',
  cursor: 'pointer',
}
