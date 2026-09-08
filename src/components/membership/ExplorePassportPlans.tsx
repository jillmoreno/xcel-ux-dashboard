import type { CSSProperties, ReactNode } from 'react'
import { CircleCheck } from '@/icons'
import { useAccount } from '@/context/AccountContext'
import {
  explorePassportPlansFor,
  explorePlanComparisonFor,
  type ExplorePlan,
  type ExplorePlanComparisonRow,
} from '@/data/membership/explorePlansFixtures'

/**
 * Non-member Explore Membership plans (Dashboard Rebrand) — the Elite Nursing
 * Passport Lite vs. Passport comparison. Two concise pricing cards (name +
 * one-line value tagline + term + price/promo + "Most Popular" badge + CTA)
 * over a **feature comparison table** that carries the full per-feature
 * breakdown (so the cards stay clean and the detail lives in one scannable
 * matrix). Data + Elite-only gating live in `explorePassportPlansFor` /
 * `explorePlanComparisonFor`; both self-hide for other brands.
 */
export function ExplorePassportPlans() {
  const { brand } = useAccount()
  const plans = explorePassportPlansFor(brand)
  const rows = explorePlanComparisonFor(brand)
  if (plans.length === 0) return null
  const lite = plans.find((p) => p.id === 'passport-lite')
  const passport = plans.find((p) => p.id === 'passport')
  return (
    <div>
      <div role="list" aria-label="Membership plans" style={gridStyle}>
        {plans.map((plan) => (
          <PlanCard key={plan.id} plan={plan} />
        ))}
      </div>
      {rows.length > 0 && lite && passport && (
        <ComparisonTable rows={rows} lite={lite} passport={passport} />
      )}
    </div>
  )
}

function PlanCard({ plan }: { plan: ExplorePlan }) {
  const featured = plan.featured === true
  return (
    <article role="listitem" style={cardStyle(featured)}>
      <h3 style={nameStyle}>{plan.name}</h3>
      <p style={taglineStyle}>{plan.tagline}</p>

      <div style={periodRowStyle}>
        <span style={periodStyle}>{plan.period}</span>
        {plan.badge && <span style={badgeStyle}>{plan.badge}</span>}
      </div>

      <div style={priceBlockStyle}>
        {plan.originalPrice && <span style={listPriceStyle}>{plan.originalPrice}</span>}
        <span style={priceStyle}>{plan.price}</span>
        {plan.promoCode && (
          <span style={promoStyle}>
            Use Code: <b style={promoCodeStyle}>{plan.promoCode}</b>
          </span>
        )}
      </div>

      <button type="button" onClick={() => console.info('cta:plan', { id: plan.id })} style={ctaStyle}>
        {plan.ctaLabel}
      </button>
    </article>
  )
}

/* ─── comparison table ───────────────────────────────────────────────── */

function ComparisonTable({
  rows,
  lite,
  passport,
}: {
  rows: ExplorePlanComparisonRow[]
  lite: ExplorePlan
  passport: ExplorePlan
}) {
  return (
    <div style={tableWrapStyle}>
      <table style={tableStyle}>
        <caption style={srOnlyStyle}>Compare Passport Lite and Passport features</caption>
        <thead>
          <tr>
            <th scope="col" style={thFeatureStyle}>Compare plans</th>
            <th scope="col" style={thPlanStyle}>{lite.shortName}</th>
            <th scope="col" style={{ ...thPlanStyle, ...thFeaturedStyle }}>{passport.shortName}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.label}>
              <th scope="row" style={tdFeatureStyle}>{row.label}</th>
              <td style={tdCellStyle}>{renderCell(row.lite)}</td>
              <td style={{ ...tdCellStyle, ...tdFeaturedStyle }}>{renderCell(row.passport)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function renderCell(value: boolean | string): ReactNode {
  if (value === true) {
    return (
      <CircleCheck size={18} aria-label="Included" style={{ color: 'var(--color-secondary-600)' }} />
    )
  }
  if (value === false) {
    return <span aria-label="Not included" style={dashStyle}>—</span>
  }
  return <span style={valueStyle}>{value}</span>
}

/* ─── styles (tokens only) ───────────────────────────────────────────── */

const gridStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
  gap: 24,
  marginTop: 24,
  alignItems: 'start',
}

function cardStyle(featured: boolean): CSSProperties {
  return {
    background: 'var(--color-surface-card)',
    border: featured
      ? '2px solid var(--color-secondary-500)'
      : '1px solid var(--color-border-subtle)',
    borderRadius: 'var(--radius-xl)',
    padding: '32px 32px 36px',
    boxShadow: featured
      ? '0 0 0 3px color-mix(in srgb, var(--color-secondary-500) 16%, transparent), var(--shadow-card)'
      : 'var(--shadow-card)',
    display: 'flex',
    flexDirection: 'column',
    gap: 0,
  }
}

const nameStyle: CSSProperties = {
  margin: 0,
  maxWidth: '20ch',
  fontFamily: 'var(--font-heading)',
  fontSize: 26,
  fontWeight: 600,
  lineHeight: 1.2,
  color: 'var(--color-accent-text)',
}

const taglineStyle: CSSProperties = {
  margin: '10px 0 0',
  maxWidth: '34ch',
  fontFamily: 'var(--font-body)',
  fontSize: 14,
  lineHeight: 1.5,
  color: 'var(--color-text-secondary)',
}

const periodRowStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  marginTop: 20,
}

const periodStyle: CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontSize: 15,
  fontWeight: 600,
  color: 'var(--color-text-primary)',
}

const badgeStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  padding: '3px 10px',
  borderRadius: 'var(--radius-pill)',
  background: 'var(--color-secondary-100)',
  color: 'var(--color-secondary-700)',
  fontFamily: 'var(--font-body)',
  fontSize: 12,
  fontWeight: 700,
}

const priceBlockStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 0,
  margin: '6px 0 20px',
}

const listPriceStyle: CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontSize: 15,
  color: 'var(--color-text-tertiary)',
  textDecoration: 'line-through',
}

const priceStyle: CSSProperties = {
  fontFamily: 'var(--font-heading)',
  fontSize: 46,
  fontWeight: 800,
  lineHeight: 1.05,
  color: 'var(--color-text-primary)',
}

const promoStyle: CSSProperties = {
  marginTop: 4,
  fontFamily: 'var(--font-body)',
  fontSize: 12,
  color: 'var(--color-text-secondary)',
}

const promoCodeStyle: CSSProperties = {
  color: 'var(--color-warning-600)',
  fontWeight: 700,
}

const ctaStyle: CSSProperties = {
  alignSelf: 'flex-start',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: 44,
  padding: '0 22px',
  border: 'none',
  cursor: 'pointer',
  background: 'var(--color-cta-500)',
  color: 'var(--color-text-inverse)',
  borderRadius: 'var(--radius-md)',
  fontFamily: 'var(--font-heading)',
  fontSize: 14,
  fontWeight: 700,
  letterSpacing: '0.04em',
  textTransform: 'uppercase',
}

const tableWrapStyle: CSSProperties = {
  marginTop: 32,
  background: 'var(--color-surface-card)',
  border: '1px solid var(--color-border-subtle)',
  borderRadius: 'var(--radius-lg)',
  overflow: 'hidden',
}

const tableStyle: CSSProperties = {
  width: '100%',
  borderCollapse: 'collapse',
  fontFamily: 'var(--font-body)',
}

const thFeatureStyle: CSSProperties = {
  textAlign: 'left',
  padding: '16px 24px',
  fontSize: 12,
  fontWeight: 700,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  color: 'var(--color-text-tertiary)',
  borderBottom: '1px solid var(--color-border-subtle)',
}

const thPlanStyle: CSSProperties = {
  width: 160,
  textAlign: 'center',
  padding: '16px 16px',
  fontFamily: 'var(--font-heading)',
  fontSize: 15,
  fontWeight: 700,
  color: 'var(--color-text-primary)',
  borderBottom: '1px solid var(--color-border-subtle)',
}

const thFeaturedStyle: CSSProperties = {
  background: 'color-mix(in srgb, var(--color-secondary-100) 45%, var(--color-surface-card))',
  color: 'var(--color-secondary-700)',
}

const tdFeatureStyle: CSSProperties = {
  textAlign: 'left',
  padding: '13px 24px',
  fontSize: 14,
  fontWeight: 500,
  color: 'var(--color-text-primary)',
  borderTop: '1px solid var(--color-border-subtle)',
}

const tdCellStyle: CSSProperties = {
  textAlign: 'center',
  padding: '13px 16px',
  borderTop: '1px solid var(--color-border-subtle)',
  verticalAlign: 'middle',
}

const tdFeaturedStyle: CSSProperties = {
  background: 'color-mix(in srgb, var(--color-secondary-100) 28%, var(--color-surface-card))',
}

const valueStyle: CSSProperties = {
  fontFamily: 'var(--font-heading)',
  fontSize: 14,
  fontWeight: 700,
  color: 'var(--color-text-primary)',
}

const dashStyle: CSSProperties = {
  color: 'var(--color-neutral-400)',
  fontSize: 16,
}

const srOnlyStyle: CSSProperties = {
  position: 'absolute',
  width: 1,
  height: 1,
  padding: 0,
  margin: -1,
  overflow: 'hidden',
  clip: 'rect(0 0 0 0)',
  whiteSpace: 'nowrap',
  border: 0,
}
