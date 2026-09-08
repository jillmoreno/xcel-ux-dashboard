import type { CSSProperties } from 'react'
import { Link } from 'react-router-dom'
import { useAccount } from '@/context/AccountContext'
import { useFeatureFlag } from '@/context/FeatureFlagContext'
import { useLoFi } from '@/context/LoFiContext'
import { LoFiHeroBody } from '@/components/lo-fi/LoFiPlaceholders'
import {
  membershipHeroStatsFor,
  type MembershipHeroStat,
} from '@/data/membership/heroStatsFixtures'

/**
 * Hero band for the **member** view of `/membership`.
 *
 * Variant-aware via the `membership-hero-band` feature flag:
 *   - `dark`  (default): teal-gradient surface, white text, matches
 *                        the dashboard hero band's V2 treatment.
 *   - `light`           : white card with primary-800 text + a hair-
 *                        line border. Same family as DashboardHeroBand's
 *                        V3 light treatment.
 *
 * The stats row (Active courses · Saved to library · Unread replies)
 * is independently gated by the `membership-hero-stats` flag — the
 * row hides while the rest of the band (eyebrow / greeting / sub-line
 * / CTAs) stays put. Both flags surface under AccountMenu → UI/UX
 * Demo Tools → Feature Flag → Membership.
 *
 *   ┌─────────────────────────────────────────────────────────────────┐
 *   │ Eyebrow   Membership · {planName}                                │
 *   │ H1        Welcome back, {firstName}                              │
 *   │ Sub       Member since {…}. Your {planName} plan renews on {…}.  │
 *   │                                                                  │
 *   │ Stat-row  Active courses   Saved to library   Unread replies     │  ← hidden when
 *   │           {value} {meta}   {value} {meta}     {value} {meta}     │    membership-hero-stats off
 *   │                                                                  │
 *   │                          [ Manage plan → ]  View benefits        │
 *   └─────────────────────────────────────────────────────────────────┘
 *
 * Zero-state still applies: `stat.value === 0` dims the chip and the
 * meta caption flips to an onboarding nudge (same convention the
 * dashboard hero band uses for the STC fixture).
 *
 * Stats come from `membershipHeroStatsFor(brand)`; plan + dates come
 * from `useAccount().user`. Both fixture-backed for now — the
 * engagement service will own the stats once that endpoint ships.
 */
export function MembershipHeroBand() {
  const { brand, user } = useAccount()
  const stats = membershipHeroStatsFor(brand)
  const heroFlag = useFeatureFlag('membership-hero-band')
  const statsFlag = useFeatureFlag('membership-hero-stats')
  const { loFi } = useLoFi()
  const isLight = heroFlag.variant === 'light'
  const showStats = statsFlag.enabled

  // Lo-Fi: keep the outer dimensions; strip the welcome content.
  if (loFi) {
    return (
      <section aria-label="Membership overview" style={loFiHeroShellStyle}>
        <LoFiHeroBody ariaLabel="Lo-fi membership hero" />
      </section>
    )
  }

  // Sub-line copy varies on whether a renewal date is set. An empty
  // string (STC zero-state fixture) renders the "renews monthly"
  // fallback so the band doesn't show a malformed sentence.
  const subline = user.renewalDate
    ? `Member since ${user.memberSinceMonthYear}. Your ${user.planName} plan renews on ${user.renewalDate}.`
    : `Member since ${user.memberSinceMonthYear}. Your ${user.planName} plan renews monthly.`

  return (
    <section aria-label="Membership overview" style={bandStyle(isLight)}>
      <div style={leftStyle}>
        <span style={eyebrowStyle}>Membership · {user.planName} plan</span>
        <h1 style={greetingStyle(isLight)}>Welcome back, {user.firstName}</h1>
        <p style={sublineStyle(isLight)}>{subline}</p>

        {showStats && (
          <div role="group" aria-label="Membership stats" style={statsRowStyle}>
            {stats.map((stat) => (
              <HeroStat key={stat.label} stat={stat} isLight={isLight} />
            ))}
          </div>
        )}
      </div>

      <div style={ctaRowStyle}>
        <Link to="/membership/plans" style={primaryCtaStyle}>
          Manage plan →
        </Link>
        <Link to="/membership/benefits" style={ghostCtaStyle(isLight)}>
          View benefits
        </Link>
      </div>
    </section>
  )
}

/* ─── stat tile ────────────────────────────────────────────────────── */

function HeroStat({
  stat,
  isLight,
}: {
  stat: MembershipHeroStat
  isLight: boolean
}) {
  const isZero = stat.value === 0
  return (
    <div
      data-faded={isZero ? 'true' : undefined}
      style={{
        ...chipStyle(isLight),
        opacity: isZero ? 0.65 : 1,
      }}
    >
      <span style={chipLabelStyle(isLight)}>{stat.label}</span>
      <span style={chipValueStyle(isLight)}>{stat.value}</span>
      <span style={chipMetaStyle(isLight)}>{stat.meta}</span>
    </div>
  )
}

/* ─── styles ───────────────────────────────────────────────────────── */
//
// Light/dark variant pairs share structure (padding, grid, gap) but
// swap color tokens. Each style is a function of `isLight` so the
// component renders the same DOM regardless of variant.

const loFiHeroShellStyle: CSSProperties = {
  background: 'var(--color-neutral-100)',
  border: '1px solid var(--color-neutral-200)',
  borderRadius: 'var(--radius-lg)',
  padding: '32px 40px',
}

function bandStyle(isLight: boolean): CSSProperties {
  return {
    background: isLight
      ? 'var(--color-surface-card)'
      : 'linear-gradient(135deg, var(--color-primary-700), var(--color-primary-800))',
    border: isLight ? '1px solid var(--color-border-subtle)' : 'none',
    borderRadius: 'var(--radius-lg)',
    padding: '32px 40px',
    display: 'grid',
    gridTemplateColumns: 'minmax(380px, 1fr) auto',
    gap: 32,
    alignItems: 'start',
  }
}

const leftStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
  minWidth: 0,
}

// The eyebrow keeps its warning-amber color in both variants — the
// accent reads against both a teal and a white surface, so no
// per-variant override is needed.
const eyebrowStyle: CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: '0.16em',
  textTransform: 'uppercase',
  color: 'var(--color-warning-500)',
}

function greetingStyle(isLight: boolean): CSSProperties {
  return {
    margin: 0,
    fontFamily: 'var(--font-heading)',
    fontSize: 32,
    fontWeight: 700,
    color: isLight
      ? 'var(--color-primary-800)'
      : 'var(--color-neutral-50)',
    letterSpacing: '-0.01em',
    lineHeight: 1.15,
  }
}

function sublineStyle(isLight: boolean): CSSProperties {
  return {
    margin: 0,
    fontFamily: 'var(--font-body)',
    fontSize: 14,
    fontWeight: 500,
    color: isLight
      ? 'var(--color-text-secondary)'
      : 'var(--color-primary-100)',
    lineHeight: 1.5,
  }
}

const statsRowStyle: CSSProperties = {
  marginTop: 16,
  display: 'grid',
  gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
  gap: 32,
  alignItems: 'flex-start',
}

function chipStyle(isLight: boolean): CSSProperties {
  return {
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
    paddingLeft: 14,
    borderLeft: isLight
      ? '1px solid var(--color-primary-200)'
      : '1px solid rgba(255, 255, 255, 0.22)',
  }
}

function chipLabelStyle(isLight: boolean): CSSProperties {
  return {
    fontFamily: 'var(--font-body)',
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: '0.12em',
    textTransform: 'uppercase',
    color: isLight
      ? 'var(--color-primary-800)'
      : 'var(--color-neutral-50)',
  }
}

function chipValueStyle(isLight: boolean): CSSProperties {
  return {
    fontFamily: 'var(--font-heading)',
    fontSize: 28,
    fontWeight: 700,
    lineHeight: 1,
    marginTop: 4,
    color: isLight
      ? 'var(--color-primary-800)'
      : 'var(--color-neutral-50)',
  }
}

function chipMetaStyle(isLight: boolean): CSSProperties {
  return {
    fontFamily: 'var(--font-body)',
    fontSize: 11,
    fontWeight: 500,
    marginTop: 4,
    color: isLight
      ? 'var(--color-text-secondary)'
      : 'var(--color-primary-100)',
  }
}

const ctaRowStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
  alignItems: 'flex-end',
}

// Primary CTA — warning-amber background + dark text pops against
// both surfaces, so it doesn't need a variant fork.
const primaryCtaStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: 40,
  padding: '0 18px',
  background: 'var(--color-warning-500)',
  color: 'var(--color-neutral-900)',
  borderRadius: 'var(--radius-md)',
  fontFamily: 'var(--font-body)',
  fontSize: 14,
  fontWeight: 700,
  textDecoration: 'none',
  whiteSpace: 'nowrap',
}

function ghostCtaStyle(isLight: boolean): CSSProperties {
  return {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 36,
    padding: '0 16px',
    // Light: outlined primary-700 against the white card surface.
    // Dark: translucent-white glass on the teal band.
    background: isLight ? 'transparent' : 'rgba(255, 255, 255, 0.08)',
    color: isLight
      ? 'var(--color-primary-700)'
      : 'var(--color-neutral-50)',
    borderRadius: 'var(--radius-md)',
    border: isLight
      ? '1px solid var(--color-primary-300)'
      : '1px solid rgba(255, 255, 255, 0.35)',
    fontFamily: 'var(--font-body)',
    fontSize: 13,
    fontWeight: 600,
    textDecoration: 'none',
    whiteSpace: 'nowrap',
  }
}
