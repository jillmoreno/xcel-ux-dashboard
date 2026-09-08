import type { CSSProperties } from 'react'
import { Link } from 'react-router-dom'
import { useLoFi } from '@/context/LoFiContext'
import { LoFiHeroBody } from '@/components/lo-fi/LoFiPlaceholders'

/**
 * Non-member hero for `/membership`. Mirrors the exploration's
 * `.upsell` block — full-width teal-gradient band, **center-aligned**
 * content, larger 38px H1, sub-copy, and a CTA row with the same
 * primary warning-amber button + ghost button pair the dashboard
 * uses for its upgrade affordances.
 *
 * Distinguished from `<MembershipHeroBand>` (the member-facing
 * variant) by alignment, scale, and the absence of personalized stats
 * — this hero is the upsell pitch, not a status dashboard.
 */
export function MembershipUpsellHero() {
  const { loFi } = useLoFi()
  if (loFi) {
    return (
      <section aria-label="Become a member" style={loFiHeroShellStyle}>
        <LoFiHeroBody ariaLabel="Lo-fi upsell hero" />
      </section>
    )
  }
  return (
    <section aria-label="Become a member" style={bandStyle}>
      <span style={eyebrowStyle}>Membership</span>
      <h1 style={headlineStyle}>
        Everything you need to grow your real estate career — in one place.
      </h1>
      <p style={subcopyStyle}>
        Unlimited CE, an exclusive resource library, expert-moderated
        course forums, and a 40,000-strong community of agents and
        brokers. One subscription.
      </p>
      <div style={ctaRowStyle}>
        <Link to="/membership/plans" style={primaryCtaStyle}>
          Become a member →
        </Link>
        <Link to="/membership/plans" style={ghostCtaStyle}>
          Compare plans
        </Link>
      </div>
    </section>
  )
}

/* ─── styles ───────────────────────────────────────────────────────── */

const loFiHeroShellStyle: CSSProperties = {
  background: 'var(--color-neutral-100)',
  border: '1px solid var(--color-neutral-200)',
  borderRadius: 'var(--radius-lg)',
  padding: '56px 40px',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
}

const bandStyle: CSSProperties = {
  background:
    'linear-gradient(135deg, var(--color-primary-700), var(--color-primary-800))',
  borderRadius: 'var(--radius-lg)',
  padding: '56px 40px',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  textAlign: 'center',
  gap: 14,
}

const eyebrowStyle: CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: '0.22em',
  textTransform: 'uppercase',
  color: 'var(--color-warning-500)',
}

const headlineStyle: CSSProperties = {
  margin: 0,
  maxWidth: 760,
  fontFamily: 'var(--font-heading)',
  fontSize: 38,
  fontWeight: 700,
  lineHeight: 1.15,
  letterSpacing: '-0.01em',
  color: 'var(--color-neutral-50)',
}

const subcopyStyle: CSSProperties = {
  margin: 0,
  maxWidth: 620,
  fontFamily: 'var(--font-body)',
  fontSize: 15,
  lineHeight: 1.55,
  color: 'var(--color-primary-100)',
}

const ctaRowStyle: CSSProperties = {
  marginTop: 10,
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 12,
}

const primaryCtaStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: 44,
  padding: '0 20px',
  background: 'var(--color-warning-500)',
  color: 'var(--color-neutral-900)',
  borderRadius: 'var(--radius-md)',
  fontFamily: 'var(--font-body)',
  fontSize: 15,
  fontWeight: 700,
  textDecoration: 'none',
  whiteSpace: 'nowrap',
}

const ghostCtaStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: 44,
  padding: '0 20px',
  background: 'rgba(255, 255, 255, 0.08)',
  color: 'var(--color-neutral-50)',
  borderRadius: 'var(--radius-md)',
  border: '1px solid rgba(255, 255, 255, 0.35)',
  fontFamily: 'var(--font-body)',
  fontSize: 15,
  fontWeight: 600,
  textDecoration: 'none',
  whiteSpace: 'nowrap',
}
