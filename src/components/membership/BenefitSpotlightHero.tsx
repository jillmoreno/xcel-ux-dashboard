import type { CSSProperties, ComponentType } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Award, Gem, Library, RubiLogo } from '@/icons'
import { useAccount } from '@/context/AccountContext'
import { useLoFi } from '@/context/LoFiContext'
import { LoFiHeroBody } from '@/components/lo-fi/LoFiPlaceholders'
import { membershipSpotlightFor } from '@/data/membership/benefitMarketingFixtures'

/**
 * "Dark spotlight" membership hero (design direction A1) — the non-member
 * pitch that tops the rebrand shell's **Explore Membership** section in
 * place of the gradient `MembershipSectionHero`. A two-column dark band:
 * a marketing photo on the left, and on the right the membership-level
 * pitch — eyebrow, headline (the section `<h1>`), three benefit rows, and
 * one CTA to the plans page.
 *
 * Content is fixture-backed + Elite-only via `membershipSpotlightFor(brand)`
 * — returns `null` for other brands, so the hero renders nothing and the
 * caller falls back to its default header.
 *
 * Colors are token-only: the band is the brand primary gradient, the CTA
 * is the brand action color (Elite magenta), and accents use the secondary
 * (Elite aqua) ramp — the component never names a brand or a hex.
 */

const ICONS: Record<string, ComponentType<{ size?: number; 'aria-hidden'?: boolean }>> = {
  library: Library,
  award: Award,
  rubi: RubiLogo,
  gem: Gem,
}

export function BenefitSpotlightHero() {
  const { brand } = useAccount()
  const { loFi } = useLoFi()
  const spotlight = membershipSpotlightFor(brand)
  if (!spotlight) return null

  if (loFi) {
    return (
      <section aria-label="Become a member" style={loFiShellStyle}>
        <LoFiHeroBody ariaLabel="Lo-fi membership spotlight" />
      </section>
    )
  }

  return (
    <section aria-label="Become a member" style={bandStyle}>
      <div
        aria-hidden
        style={
          spotlight.photo
            ? {
                ...photoStyle,
                backgroundImage: `url(${spotlight.photo})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }
            : photoStyle
        }
      >
        {!spotlight.photo && <span style={photoCaptionStyle}>Member photo</span>}
      </div>
      <div style={bodyStyle}>
        <span style={eyebrowStyle}>{spotlight.eyebrow}</span>
        <h1 style={headlineStyle}>{spotlight.title}</h1>
        <ul style={benefitListStyle}>
          {spotlight.benefits.map((benefit) => {
            const Icon = ICONS[benefit.iconKey] ?? Library
            return (
              <li key={benefit.title} style={benefitRowStyle}>
                <span aria-hidden style={benefitIconStyle}>
                  <Icon size={20} aria-hidden />
                </span>
                <span>
                  <span style={benefitTitleStyle}>{benefit.title}</span>
                  <span style={benefitBlurbStyle}>{benefit.blurb}</span>
                </span>
              </li>
            )
          })}
        </ul>
        <Link to={spotlight.ctaTo} style={ctaStyle}>
          {spotlight.ctaLabel}
          <ArrowRight size={16} aria-hidden />
        </Link>
      </div>
    </section>
  )
}

/* ─── styles (tokens only) ───────────────────────────────────────────── */

const loFiShellStyle: CSSProperties = {
  background: 'var(--color-neutral-100)',
  border: '1px solid var(--color-neutral-200)',
  borderRadius: 'var(--radius-lg)',
  padding: '32px',
  marginBottom: 24,
}

const bandStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '220px 1fr',
  gap: 24,
  // Stretch so the photo fills the band height and bleeds to ~8px of the
  // top/bottom/left edges (the band's small padding).
  alignItems: 'stretch',
  background:
    'linear-gradient(135deg, var(--color-primary-700), var(--color-primary-800))',
  borderRadius: 'var(--radius-lg)',
  padding: 8,
  marginBottom: 24,
}

const photoStyle: CSSProperties = {
  // No fixed aspect ratio — the photo stretches to the band height so it
  // bleeds close to the edges; a floor keeps it tall if the copy is short.
  minHeight: 260,
  borderRadius: 'var(--radius-md)',
  background: 'rgb(255 255 255 / 0.06)',
  border: '1px solid rgb(255 255 255 / 0.12)',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 8,
  color: 'var(--color-secondary-300)',
}

const photoCaptionStyle: CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontSize: 12,
}

const bodyStyle: CSSProperties = {
  minWidth: 0,
  // Band padding is only 8px (so the photo bleeds to the edges) — give the
  // copy its own breathing room from the top/right/bottom.
  padding: '24px 28px 24px 0',
  alignSelf: 'center',
}

const eyebrowStyle: CSSProperties = {
  display: 'block',
  fontFamily: 'var(--font-body)',
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: '0.18em',
  textTransform: 'uppercase',
  color: 'var(--color-secondary-300)',
  marginBottom: 8,
}

const headlineStyle: CSSProperties = {
  margin: '0 0 18px',
  fontFamily: 'var(--font-heading)',
  fontSize: 'var(--text-heading-2xl)',
  fontWeight: 700,
  lineHeight: 'var(--text-heading-2xl--line-height)',
  color: 'var(--color-text-inverse)',
}

const benefitListStyle: CSSProperties = {
  listStyle: 'none',
  margin: 0,
  padding: 0,
  display: 'flex',
  flexDirection: 'column',
  gap: 13,
}

const benefitRowStyle: CSSProperties = {
  display: 'flex',
  gap: 12,
  alignItems: 'flex-start',
}

const benefitIconStyle: CSSProperties = {
  flexShrink: 0,
  color: 'var(--color-secondary-300)',
  lineHeight: 0,
  marginTop: 1,
}

const benefitTitleStyle: CSSProperties = {
  display: 'block',
  fontFamily: 'var(--font-body)',
  fontSize: 14,
  fontWeight: 700,
  color: 'var(--color-text-inverse)',
}

const benefitBlurbStyle: CSSProperties = {
  display: 'block',
  fontFamily: 'var(--font-body)',
  fontSize: 13,
  lineHeight: 1.5,
  color: 'var(--color-primary-100)',
}

const ctaStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 8,
  marginTop: 20,
  minHeight: 44,
  padding: '0 22px',
  background: 'var(--color-cta-500)',
  color: 'var(--color-text-inverse)',
  borderRadius: 'var(--radius-md)',
  fontFamily: 'var(--font-heading)',
  fontSize: 15,
  fontWeight: 700,
  textDecoration: 'none',
}
