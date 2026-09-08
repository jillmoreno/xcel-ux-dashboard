import { useAccount } from '@/context/AccountContext'
import { passportProductsFor } from '@/data/membership/passportProductsFixtures'
import { Wrap } from './passportShared'
import { PassportHero } from './PassportHero'
import { HowItWorksSteps } from './HowItWorksSteps'
import { PassportProductsGrid } from './PassportProductsGrid'
import { PassportProductsSections } from './PassportProductsSections'
import { RubiAiBand } from './RubiAiBand'
import { PassportPlanComparison } from './PassportPlanComparison'
import { VipPerksRow } from './VipPerksRow'
import { MembershipFaq } from './MembershipFaq'
import { FinalJoinCta } from './FinalJoinCta'

/**
 * Non-member ("join") Passport page — matches
 * `explorations/membership-landing/elite-v2-nonmember.html`.
 * Order: hero → trust strip → how it works → 9-product grid → Rubi AI
 * band → plan comparison → VIP perks → FAQ → final join CTA.
 *
 * `productsLayout` (V2 vs V3): `'grid'` renders the single grid + the
 * standalone `RubiAiBand`. `'sections'` (V3) renders the grouped
 * `PassportProductsSections` and drops the standalone band — the Career
 * Tools section already covers the Rubi AI tools.
 */
export function MembershipV2NonMember({
  productsLayout = 'grid',
}: {
  productsLayout?: 'grid' | 'sections'
}) {
  const isSections = productsLayout === 'sections'
  return (
    <div>
      <PassportHero variant="join" />
      <TrustStrip />
      <HowItWorksSteps />
      {isSections ? (
        <PassportProductsSections variant="join" />
      ) : (
        <PassportProductsGrid variant="join" />
      )}
      {!isSections && <RubiAiBand />}
      <PassportPlanComparison />
      <VipPerksRow variant="promo" />
      <MembershipFaq />
      <FinalJoinCta />
    </div>
  )
}

/** Dark marketing trust strip directly under the hero. */
function TrustStrip() {
  const { brand } = useAccount()
  const productCount = passportProductsFor(brand).length
  const stats = [
    { value: '500+', label: 'CE hours & courses' },
    { value: String(productCount), label: 'member products & tools' },
    { value: 'ANCC', label: 'accredited provider' },
    { value: 'All 50', label: 'states supported' },
  ]
  return (
    <div style={{ background: 'var(--color-primary-900)', color: 'var(--color-text-inverse)' }}>
      <Wrap
        style={{
          display: 'flex',
          justifyContent: 'space-around',
          gap: 20,
          flexWrap: 'wrap',
          padding: '22px 24px',
          textAlign: 'center',
        }}
      >
        {stats.map((s) => (
          <div key={s.label}>
            <b style={{ display: 'block', fontFamily: 'var(--font-heading)', fontSize: 26, color: 'var(--color-secondary-300)' }}>
              {s.value}
            </b>
            <span style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'rgb(255 255 255 / 0.8)', letterSpacing: '0.02em' }}>
              {s.label}
            </span>
          </div>
        ))}
      </Wrap>
    </div>
  )
}
