import { Link } from 'react-router-dom'
import { ArrowRight } from '@/icons'
import { useAccount } from '@/context/AccountContext'
import { additionalBenefitsFor } from '@/data/membership/membershipFirstFixtures'
import { Eyebrow, Wrap } from '../v2/passportShared'
import { Medallion } from './shared'

/**
 * "Explore everything else in your membership" — the catch-all band for
 * benefits beyond learning content (partner offers, community, well-being).
 * Keeps the page's promise that membership is more than courses, and gives
 * every remaining benefit a visible, linkable home.
 */
export function AdditionalBenefitsBand({
  hideTitle = false,
}: {
  /** Suppress the eyebrow + `<h2>` title (the Dashboard Rebrand shell owns
   *  the section title) and the band's top divider. */
  hideTitle?: boolean
} = {}) {
  const { brand } = useAccount()
  const items = additionalBenefitsFor(brand)
  if (items.length === 0) return null

  return (
    <section
      id="more"
      style={{
        scrollMarginTop: 88,
        padding: hideTitle ? '0 0 32px' : '52px 0 64px',
        borderTop: hideTitle ? 'none' : '1px solid var(--color-border-subtle)',
      }}
    >
      <Wrap>
        {!hideTitle && (
          <>
            <Eyebrow>More in your membership</Eyebrow>
            <h2
              style={{
                margin: '8px 0 24px',
                fontFamily: 'var(--font-heading)',
                fontSize: 26,
                fontWeight: 800,
                letterSpacing: '-0.01em',
                color: 'var(--color-primary-800)',
              }}
            >
              Explore everything else your Passport includes
            </h2>
          </>
        )}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: 18,
          }}
        >
          {items.map((item) => (
            <Link
              key={item.id}
              to={item.href}
              aria-label={item.title}
              className="cre-passport-prod"
              style={{
                display: 'flex',
                gap: 14,
                alignItems: 'flex-start',
                background: 'var(--color-surface-card)',
                border: '1px solid var(--color-border-subtle)',
                borderRadius: 'var(--radius-lg)',
                padding: 20,
                boxShadow: 'var(--shadow-card)',
                textDecoration: 'none',
                color: 'inherit',
              }}
            >
              <Medallion iconKey={item.iconKey} tone="teal" size={42} />
              <div style={{ flex: 1 }}>
                <h3
                  style={{
                    margin: '2px 0 6px',
                    fontFamily: 'var(--font-heading)',
                    fontSize: 16,
                    fontWeight: 700,
                    color: 'var(--color-accent-text)',
                  }}
                >
                  {item.title}
                </h3>
                <p
                  style={{
                    margin: 0,
                    fontFamily: 'var(--font-body)',
                    fontSize: 14,
                    lineHeight: 1.5,
                    color: 'var(--color-text-secondary)',
                  }}
                >
                  {item.blurb}
                </p>
              </div>
              <ArrowRight size={16} aria-hidden style={{ color: 'var(--color-primary-500)', marginTop: 4 }} />
            </Link>
          ))}
        </div>
      </Wrap>
    </section>
  )
}
