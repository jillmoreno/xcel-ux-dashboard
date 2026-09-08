import type { CSSProperties } from 'react'

/**
 * Non-member upsell hero (Figma 63:16150 Partner Offers / 63:16401
 * Resources) — a full-bleed brand-gradient marketing band that replaces the
 * standard section hero for non-members on a Passport-only Explore section: a
 * "members only" eyebrow, a big headline, a one-line pitch, and an "Unlock with
 * Membership" CTA. The section's cards below render locked ("Member Exclusive").
 *
 * Uses the same full-bleed breakout as `MembershipSectionHero` (cancel
 * SectionShell's 24px top + 40px side gutter) so it sits flush under the slim
 * header and spans the content column.
 */
export function NonMemberUpsellHero({
  title,
  description,
  onUnlock,
  eyebrow = 'Members only · Become a member today',
  ctaLabel = 'Unlock with Membership',
}: {
  title: string
  description: string
  onUnlock: () => void
  eyebrow?: string
  ctaLabel?: string
}) {
  return (
    <header style={bandStyle}>
      <p style={eyebrowStyle}>{eyebrow}</p>
      <h1 style={titleStyle}>{title}</h1>
      <p style={descStyle}>{description}</p>
      <button type="button" onClick={onUnlock} style={ctaStyle}>
        {ctaLabel}
      </button>
    </header>
  )
}

/* ─── styles (tokens only for colors + fonts) ────────────────────────── */

const bandStyle: CSSProperties = {
  margin: '-24px -40px 24px',
  padding: '44px 48px 48px',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-start',
  gap: 16,
  background: 'linear-gradient(166deg, var(--color-primary-500) 0%, var(--color-primary-900) 100%)',
  color: 'var(--color-text-inverse)',
}

const eyebrowStyle: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-body)',
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  color: 'rgb(255 255 255 / 0.82)',
}

const titleStyle: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-heading)',
  fontWeight: 700,
  fontSize: 40,
  lineHeight: 1.08,
  color: 'var(--color-text-inverse)',
}

const descStyle: CSSProperties = {
  margin: 0,
  maxWidth: '56ch',
  fontFamily: 'var(--font-body)',
  fontSize: 15,
  lineHeight: '22px',
  color: 'rgb(255 255 255 / 0.85)',
}

const ctaStyle: CSSProperties = {
  marginTop: 14,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  height: 48,
  padding: '0 32px',
  borderRadius: 'var(--radius-md)',
  border: 0,
  cursor: 'pointer',
  background: 'var(--color-cta-500)',
  color: 'var(--color-text-inverse)',
  fontFamily: 'var(--font-body)',
  fontSize: 16,
  fontWeight: 600,
}
