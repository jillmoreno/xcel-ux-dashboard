import { Navigate, useParams } from 'react-router-dom'
import { useAccount } from '@/context/AccountContext'
import { passportProductsFor } from '@/data/membership/passportProductsFixtures'
import { MembershipBreadcrumbs } from '@/components/membership/MembershipBreadcrumbs'

/**
 * `/membership/passport/:productId` — a per-product page reached from the
 * "Your benefits at a glance" grid. Intentionally a blank scaffold for
 * now (breadcrumbs + title + a "coming soon" placeholder); the real
 * product content gets built out per product later.
 *
 * Resolves the product from `passportProductsFor(brand)`; an unknown id
 * or a non-Elite brand (empty product list) redirects to `/membership`.
 */
export function PassportProductPage() {
  const { productId } = useParams()
  const { brand } = useAccount()
  const product = passportProductsFor(brand).find((p) => p.id === productId)

  if (!product) return <Navigate to="/membership" replace />

  return (
    <>
      <MembershipBreadcrumbs
        items={[{ label: 'Membership', to: '/membership' }, { label: product.title }]}
      />
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px 24px 64px', width: '100%' }}>
        <header style={{ margin: '0 0 26px' }}>
          <h1
            style={{
              margin: 0,
              fontFamily: 'var(--font-heading)',
              fontWeight: 800,
              fontSize: 34,
              lineHeight: 1.1,
              letterSpacing: '-0.01em',
              color: 'var(--color-primary-800)',
            }}
          >
            {product.title}
          </h1>
          <p style={{ margin: '8px 0 0', fontFamily: 'var(--font-body)', fontSize: 16, color: 'var(--color-text-secondary)' }}>
            {product.blurb}
          </p>
        </header>

        {/* TODO(membership): build out the real product experience here.
            Placeholder scaffold for now. */}
        <div
          style={{
            background: 'var(--color-surface-card)',
            border: '1px dashed var(--color-border-subtle)',
            borderRadius: 'var(--radius-lg)',
            padding: '64px 24px',
            textAlign: 'center',
            color: 'var(--color-text-tertiary)',
            fontFamily: 'var(--font-body)',
            fontSize: 15,
          }}
        >
          This page is coming soon — we'll build out {product.title} here.
        </div>
      </div>
    </>
  )
}
