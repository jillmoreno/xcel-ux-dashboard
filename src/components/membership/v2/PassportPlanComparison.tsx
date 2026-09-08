import { Check, X } from '@/icons'
import { useAccount } from '@/context/AccountContext'
import { passportTiersFor, type PassportTierPlan } from '@/data/membership/passportTiersFixtures'
import { Block, PassportButton, SectionHead, Wrap } from './passportShared'

/** Passport vs. Passport Lite plan comparison (non-member view). */
export function PassportPlanComparison() {
  const { brand } = useAccount()
  const tiers = passportTiersFor(brand)
  return (
    <Block id="plans" alt>
      <Wrap>
        <SectionHead
          eyebrow="Choose your membership"
          title="Passport vs. Passport Lite"
          blurb="Start with the essentials, or unlock the full library and AI career toolkit."
        />
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
            gap: 24,
            maxWidth: 840,
            margin: '0 auto',
          }}
        >
          {tiers.map((plan) => (
            <PlanCard key={plan.id} plan={plan} />
          ))}
        </div>
      </Wrap>
    </Block>
  )
}

function PlanCard({ plan }: { plan: PassportTierPlan }) {
  const featured = !!plan.featured
  return (
    <div
      style={{
        background: 'var(--color-surface-card)',
        border: featured ? '2px solid var(--color-cta-500)' : '1px solid var(--color-border-subtle)',
        borderRadius: 'var(--radius-xl)',
        padding: 32,
        boxShadow: featured
          ? '0 16px 40px color-mix(in srgb, var(--color-cta-500) 20%, transparent)'
          : 'var(--shadow-card)',
        position: 'relative',
      }}
    >
      {featured && plan.ribbon && (
        <span
          style={{
            position: 'absolute',
            top: -13,
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'var(--color-cta-500)',
            color: 'var(--color-text-inverse)',
            fontFamily: 'var(--font-heading)',
            fontWeight: 700,
            fontSize: 12,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            padding: '6px 16px',
            borderRadius: 'var(--radius-pill)',
          }}
        >
          {plan.ribbon}
        </span>
      )}
      <h3 style={{ margin: 0, fontFamily: 'var(--font-heading)', fontSize: 23, color: 'var(--color-primary-800)' }}>
        {plan.name}
      </h3>
      <div
        style={{
          fontFamily: 'var(--font-heading)',
          fontWeight: 800,
          fontSize: 40,
          color: 'var(--color-primary-700)',
          margin: '8px 0 2px',
        }}
      >
        {plan.price}
        <small style={{ fontSize: 15, fontWeight: 600, color: 'var(--color-text-tertiary)' }}>
          {plan.cadence}
        </small>
      </div>
      <div style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--color-text-secondary)', marginBottom: 20 }}>
        {plan.tagline}
      </div>
      <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 24px', display: 'grid', gap: 12 }}>
        {plan.features.map((f) => (
          <li
            key={f.label}
            style={{
              display: 'flex',
              gap: 10,
              fontFamily: 'var(--font-body)',
              fontSize: 15,
              color: f.included ? 'var(--color-text-secondary)' : 'var(--color-neutral-500)',
            }}
          >
            <span
              aria-hidden
              style={{
                flex: 'none',
                color: f.included ? 'var(--color-success-500)' : 'var(--color-neutral-300)',
                display: 'inline-flex',
              }}
            >
              {f.included ? <Check size={16} /> : <X size={16} />}
            </span>
            {f.label}
          </li>
        ))}
      </ul>
      <PassportButton variant={featured ? 'primary' : 'ghost'} style={{ width: '100%', justifyContent: 'center' }}>
        {plan.ctaLabel}
      </PassportButton>
    </div>
  )
}
