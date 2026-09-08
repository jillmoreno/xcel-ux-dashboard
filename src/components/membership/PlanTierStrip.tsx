import type { CSSProperties } from 'react'
import { Link } from 'react-router-dom'
import { useAccount } from '@/context/AccountContext'
import { useLoFi } from '@/context/LoFiContext'
import { LoFiWidgetBody } from '@/components/lo-fi/LoFiPlaceholders'
import {
  planTiersFor,
  type PlanTier,
} from '@/data/membership/planTiersFixtures'

/**
 * 3-column plan tier comparison strip rendered on the non-member
 * `/membership` view. Mirrors the exploration's `.plan-strip` —
 * Standard / Premium / Brokerage, with Premium called out as the
 * recommended option via a primary-500 border, a tinted shadow ring,
 * and a "Most popular" ribbon in the top-right corner.
 *
 * Plan data is fixture-backed per brand via `planTiersFor(brand)` —
 * never hardcoded inline. The component just unpacks the tier list
 * and renders each as a card; adding a new tier or shifting the
 * "featured" flag is a fixture-only change.
 */
export function PlanTierStrip() {
  const { brand } = useAccount()
  const tiers = planTiersFor(brand)

  return (
    <div role="list" aria-label="Membership plan tiers" style={stripStyle}>
      {tiers.map((tier) => (
        <PlanCard key={tier.id} tier={tier} />
      ))}
    </div>
  )
}

/* ─── PlanCard ─────────────────────────────────────────────────────── */

function PlanCard({ tier }: { tier: PlanTier }) {
  const featured = tier.featured === true
  const { loFi } = useLoFi()
  if (loFi) {
    return (
      <article role="listitem" style={cardStyle(false)}>
        <LoFiWidgetBody rows={6} showCta ariaLabel="Lo-fi plan tier card" />
      </article>
    )
  }

  return (
    <article role="listitem" style={cardStyle(featured)}>
      {featured && (
        <span aria-hidden style={ribbonStyle}>
          Most popular
        </span>
      )}
      <header style={headerStyle}>
        <h3 style={nameStyle}>{tier.name}</h3>
        <div style={priceRowStyle}>
          <span style={priceStyle}>{tier.price}</span>
          {tier.cadence && <span style={cadenceStyle}>{tier.cadence}</span>}
        </div>
      </header>

      <ul style={featureListStyle}>
        {tier.features.map((feature) => (
          <li key={feature} style={featureItemStyle}>
            <span aria-hidden style={checkStyle}>
              ✓
            </span>
            <span>{feature}</span>
          </li>
        ))}
      </ul>

      <Link to={tier.ctaTo} style={ctaStyle(featured)}>
        {tier.ctaLabel}
      </Link>
    </article>
  )
}

/* ─── styles ───────────────────────────────────────────────────────── */

const stripStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
  gap: 20,
  marginTop: 24,
}

function cardStyle(featured: boolean): CSSProperties {
  return {
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
    padding: '24px 22px',
    background: 'var(--color-surface-card)',
    borderRadius: 'var(--radius-lg)',
    // Featured tier gets a brand-tinted border + tinted shadow ring
    // so it visually steps in front of its siblings without losing
    // the same vertical rhythm.
    border: featured
      ? '2px solid var(--color-primary-500)'
      : '1px solid var(--color-border-subtle)',
    boxShadow: featured
      ? '0 0 0 3px color-mix(in srgb, var(--color-primary-500) 18%, transparent), var(--shadow-card)'
      : 'var(--shadow-card)',
  }
}

const ribbonStyle: CSSProperties = {
  position: 'absolute',
  top: -10,
  right: 16,
  padding: '4px 10px',
  background: 'var(--color-primary-500)',
  color: 'var(--color-text-inverse)',
  borderRadius: 'var(--radius-pill)',
  fontFamily: 'var(--font-body)',
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
}

const headerStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 6,
}

const nameStyle: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-heading)',
  fontSize: 18,
  fontWeight: 600,
  color: 'var(--color-text-primary)',
}

const priceRowStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'baseline',
  gap: 4,
}

const priceStyle: CSSProperties = {
  fontFamily: 'var(--font-heading)',
  fontSize: 32,
  fontWeight: 700,
  lineHeight: 1,
  color: 'var(--color-primary-700)',
}

const cadenceStyle: CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontSize: 13,
  fontWeight: 500,
  color: 'var(--color-text-secondary)',
}

const featureListStyle: CSSProperties = {
  listStyle: 'none',
  margin: 0,
  padding: 0,
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
  flex: 1,
}

const featureItemStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'flex-start',
  gap: 10,
  fontFamily: 'var(--font-body)',
  fontSize: 13,
  lineHeight: 1.45,
  color: 'var(--color-text-primary)',
}

const checkStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 18,
  flexShrink: 0,
  marginTop: 2,
  color: 'var(--color-primary-500)',
  fontWeight: 800,
  fontSize: 14,
}

function ctaStyle(featured: boolean): CSSProperties {
  return {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 42,
    padding: '0 16px',
    marginTop: 4,
    // Featured tier uses the brand primary so the recommended path
    // reads in-brand; non-featured tiers fall back to the CTA color
    // (warning amber) for a slightly more neutral "secondary action"
    // feel. Matches the exploration HTML.
    background: featured
      ? 'var(--color-primary-500)'
      : 'var(--color-cta-500)',
    color: 'var(--color-text-inverse)',
    borderRadius: 'var(--radius-md)',
    fontFamily: 'var(--font-body)',
    fontSize: 14,
    fontWeight: 700,
    textDecoration: 'none',
  }
}
