import { Link } from 'react-router-dom'
import { ArrowRight } from '@/icons'
import type { PassportProduct } from '@/data/membership/passportProductsFixtures'
import { ProductIcon, TierTags } from './passportShared'

/**
 * Single Passport product card — shared by the V2 grid
 * (`PassportProductsGrid`) and the V3 grouped sections
 * (`PassportProductsSections`). Markup is the grid's original card,
 * token-for-token.
 *
 * `rubiAccent` (the V3 Career Tools group) swaps in the CTA-toned
 * treatment: CTA border, CTA-tinted icon medallion, and a "Rubi AI" pill
 * leading the tier-tag row. Off → the standard secondary treatment.
 */
export function PassportProductCard({
  product,
  variant,
  rubiAccent = false,
}: {
  product: PassportProduct
  variant: 'join' | 'member'
  rubiAccent?: boolean
}) {
  const isMember = variant === 'member'
  return (
    <Link
      to={`/membership/passport/${product.id}`}
      aria-label={product.title}
      className="cre-passport-prod"
      style={{
        background: 'var(--color-surface-card)',
        border: `1px solid ${rubiAccent ? 'var(--color-cta-300)' : 'var(--color-border-subtle)'}`,
        borderRadius: 'var(--radius-lg)',
        padding: 24,
        boxShadow: 'var(--shadow-card)',
        display: 'flex',
        flexDirection: 'column',
        textDecoration: 'none',
        color: 'inherit',
      }}
    >
      <ProductIcon iconKey={product.iconKey} tone={rubiAccent ? 'cta' : 'secondary'} />
      <h3
        style={{
          margin: '0 0 8px',
          fontFamily: 'var(--font-heading)',
          fontSize: 17,
          fontWeight: 700,
          color: 'var(--color-primary-500)',
        }}
      >
        {product.title}
      </h3>
      <p
        style={{
          margin: '0 0 16px',
          fontFamily: 'var(--font-body)',
          fontSize: 14,
          color: 'var(--color-text-secondary)',
          flex: 1,
        }}
      >
        {product.blurb}
      </p>
      {isMember ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
            {rubiAccent && <RubiAiPill />}
            <TierTags tier={product.tier} />
          </div>
          <MemberProductCta />
        </div>
      ) : (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
          {rubiAccent && <RubiAiPill />}
          <TierTags tier={product.tier} />
        </div>
      )}
    </Link>
  )
}

/** CTA-toned "Rubi AI" pill — leads the tier-tag row on Career Tools
 *  cards. Mirrors the tier-pill metrics (font-body 12/600, radius-sm,
 *  22px tall) in the CTA ramp. */
function RubiAiPill() {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        padding: '0 8px',
        height: 22,
        borderRadius: 'var(--radius-sm)',
        background: 'var(--color-cta-100)',
        color: 'var(--color-cta-700)',
        fontFamily: 'var(--font-body)',
        fontSize: 12,
        fontWeight: 600,
        lineHeight: '20px',
        whiteSpace: 'nowrap',
      }}
    >
      Rubi AI
    </span>
  )
}

function MemberProductCta() {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        fontFamily: 'var(--font-body)',
        fontWeight: 700,
        fontSize: 14,
        color: 'var(--color-accent-text)',
        cursor: 'pointer',
      }}
    >
      Open
      <ArrowRight size={13} aria-hidden />
    </span>
  )
}
