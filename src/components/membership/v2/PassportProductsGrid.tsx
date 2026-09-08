import { useAccount } from '@/context/AccountContext'
import { passportProductsFor } from '@/data/membership/passportProductsFixtures'
import { Block, SectionHead, Wrap } from './passportShared'
import { PassportProductCard } from './PassportProductCard'

/**
 * The 9-product grid — the hero of the redesign. Every product is
 * included for all members, so there's no live-status / "coming soon"
 * badge: the only differentiator shown is the tier (Passport vs Passport
 * & Lite). `variant="member"` adds an "Open" CTA per card.
 *
 * The card body lives in the shared `<PassportProductCard>` so the V3
 * grouped layout (`PassportProductsSections`) renders identical cards.
 */
export function PassportProductsGrid({ variant }: { variant: 'join' | 'member' }) {
  const { brand } = useAccount()
  const products = passportProductsFor(brand)
  const isMember = variant === 'member'

  return (
    <Block id={isMember ? 'benefits' : 'included'} alt>
      <Wrap>
        {isMember ? (
          <div style={{ marginBottom: 24 }}>
            <SectionHead
              eyebrow="Included in your Passport"
              title="Your benefits at a glance"
              blurb="Open any of your included products — your full Passport toolkit, all in one place."
            />
          </div>
        ) : (
          <SectionHead
            eyebrow="Endless extras"
            title="Everything in your Passport"
            blurb="Nine member products built for nurses — all included in your Passport membership."
          />
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 22 }}>
          {products.map((p) => (
            <PassportProductCard key={p.id} product={p} variant={variant} />
          ))}
        </div>
      </Wrap>
    </Block>
  )
}
