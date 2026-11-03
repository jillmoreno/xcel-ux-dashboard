import type { CSSProperties } from 'react'
import { CARD, EYEBROW, HEADING } from './adminStyles'

/**
 * ATLAS ADMIN — PRICING (2026-10-20). The reference's /pricing: the
 * commercial model, three tiers and the levers that move ARR. Copy kept,
 * with the reference's own words; nothing on it is clickable there either.
 */

const TIERS = [
  {
    name: 'Your data',
    body: 'You keep training and HR signals in your systems. We provide connectors, SLAs, and export contracts — no hosted analytics surface.',
    bestFor: 'Security-first agencies that only need pipes and compliance artifacts.',
    popular: false,
  },
  {
    name: 'Dashboard + your data',
    body: 'Your data lands in our admin experience: roster, assignments, completion, and operational reporting in one place.',
    bestFor: 'Teams that want a single pane of glass without standing up their own BI.',
    popular: true,
  },
  {
    name: 'Full stack + AI insights',
    body: 'Everything in the dashboard tier plus governed exports, admin automation, and AI-assisted insights (risk, cohort narratives, next-best actions).',
    bestFor: 'Enterprises optimizing licensing speed, retention, and audit readiness together.',
    popular: false,
  },
]

const LEVERS = [
  ['Seats', 'named learners and admin roles; tiered bands with volume breaks.'],
  ['Products', 'size of licensed catalog; overage when programs or SKUs exceed the bundle.'],
  ['Custom products', 'bespoke courses, white-label storefronts, and branded agency portals.'],
  ['Onboarding', 'migration, SSO, rules for assignments, and success checkpoints sold as packages.'],
]

export function AtlasAdminPricingPage() {
  return (
    <div style={{ maxWidth: 760, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 20, padding: '16px 0' }}>
      <div>
        <p style={{ ...EYEBROW, fontSize: 10, color: 'var(--admin-brand)' }}>Commercial model</p>
        <h1 style={{ margin: '6px 0', fontFamily: HEADING, fontSize: 26, fontWeight: 700, color: 'var(--admin-ink)' }}>How we package value</h1>
        <p style={{ margin: 0, maxWidth: 560, fontSize: 13, lineHeight: 1.5, color: 'var(--admin-text)' }}>
          Three clear tiers so customers know what they are buying. Mix usage-based levers (seats, catalog size, custom SKUs) with high-touch onboarding to grow revenue without surprise scope.
        </p>
      </div>

      <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
        {TIERS.map((t) => (
          <section key={t.name} style={{ ...CARD, borderRadius: 12, padding: 16, ...(t.popular ? { background: 'var(--admin-brand-hover-bg)', boxShadow: '0 0 0 2px var(--admin-brand-soft-edge)' } : null) }}>
            {t.popular ? <p style={{ ...EYEBROW, fontSize: 9, color: 'var(--admin-brand)' }}>Popular</p> : null}
            <h2 style={{ margin: t.popular ? '4px 0 8px' : '0 0 8px', fontFamily: HEADING, fontSize: 16, fontWeight: 700, color: 'var(--admin-ink)' }}>{t.name}</h2>
            <p style={P}>{t.body}</p>
            <p style={{ ...EYEBROW, fontSize: 9, marginTop: 12 }}>Best for</p>
            <p style={{ ...P, color: 'var(--admin-ink)' }}>{t.bestFor}</p>
          </section>
        ))}
      </div>

      <section style={{ ...CARD, borderRadius: 12, padding: 16, background: 'var(--admin-fill-soft)' }}>
        <h2 style={{ margin: '0 0 12px', fontFamily: HEADING, fontSize: 15, fontWeight: 700, color: 'var(--admin-ink)' }}>Levers that move ARR</h2>
        <dl style={{ display: 'grid', gap: '10px 24px', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', margin: 0 }}>
          {LEVERS.map(([k, v]) => (
            <div key={k} style={{ display: 'flex', gap: 6, fontSize: 12, lineHeight: 1.5 }}>
              <dt style={{ flex: 'none', fontWeight: 700, color: 'var(--admin-brand)' }}>{k}</dt>
              <dd style={{ margin: 0, color: 'var(--admin-text)' }}>— {v}</dd>
            </div>
          ))}
        </dl>
        <p style={{ margin: '12px 0 0', fontSize: 11, color: 'var(--admin-muted)' }}>Heavy onboarding is not a cost center here — it is a deliberate revenue line item that reduces churn and accelerates time-to-value.</p>
      </section>
    </div>
  )
}

const P: CSSProperties = { margin: 0, fontSize: 12, lineHeight: 1.5, color: 'var(--admin-text)' }
