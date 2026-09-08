import { useAccount } from '@/context/AccountContext'
import { partnerOfferingsFor } from '@/data/membership/partnerOfferingsFixtures'
import { Block, PassportButton, SecTitle, SectionHead, Wrap } from './passportShared'

/**
 * VIP partner perks (NatMed · Prescriber Insights · Boojee) — reuses the
 * shared `partnerOfferingsFor('elite')` fixture. `variant="promo"` is the
 * non-member teaser (centered head, no CTA); `variant="redeem"` is the
 * member view with a "Redeem offer" action per card.
 */
export function VipPerksRow({ variant }: { variant: 'promo' | 'redeem' }) {
  const { brand } = useAccount()
  const offerings = partnerOfferingsFor(brand)
  const isRedeem = variant === 'redeem'

  return (
    <Block id="perks" alt={isRedeem}>
      <Wrap>
        {isRedeem ? (
          <SecTitle
            eyebrow="VIP partner offerings"
            title="Member-only savings"
            blurb="Active with your Passport — redeem anytime."
          />
        ) : (
          <SectionHead
            eyebrow="VIP partner offerings"
            title="Member-only savings"
            blurb="Your Passport unlocks exclusive discounts from trusted clinical partners."
          />
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 22 }}>
          {offerings.map((o) => (
            <div
              key={o.id}
              style={{
                background: 'var(--color-surface-card)',
                border: '1px solid var(--color-border-subtle)',
                borderRadius: 'var(--radius-lg)',
                padding: 24,
                boxShadow: 'var(--shadow-card)',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: 18, color: 'var(--color-primary-800)' }}>
                {o.partnerName}
              </div>
              <span
                style={{
                  display: 'inline-block',
                  alignSelf: 'flex-start',
                  margin: '10px 0 12px',
                  background: 'var(--color-tertiary-100)',
                  color: 'var(--color-tertiary-700)',
                  fontFamily: 'var(--font-body)',
                  fontWeight: 700,
                  fontSize: 13,
                  padding: '4px 12px',
                  borderRadius: 'var(--radius-pill)',
                }}
              >
                {o.savingsLabel}
              </span>
              <p
                style={{
                  margin: 0,
                  fontFamily: 'var(--font-body)',
                  fontSize: 14,
                  color: 'var(--color-text-secondary)',
                  flex: 1,
                  display: '-webkit-box',
                  WebkitLineClamp: 3,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                }}
              >
                {o.description}
              </p>
              {isRedeem && (
                <div style={{ marginTop: 16 }}>
                  <PassportButton variant="ghost" size="sm">
                    Redeem offer
                  </PassportButton>
                </div>
              )}
            </div>
          ))}
        </div>
      </Wrap>
    </Block>
  )
}
