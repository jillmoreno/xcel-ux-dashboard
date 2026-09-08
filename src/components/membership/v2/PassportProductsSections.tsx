import { useAccount } from '@/context/AccountContext'
import { passportProductGroupsFor } from '@/data/membership/passportProductsFixtures'
import { Block, SecTitle, SectionHead, Wrap } from './passportShared'
import { PassportProductCard } from './PassportProductCard'

/**
 * V3 grouped products layout — the 9-product grid broken into three
 * labeled sections (Resource Library · Exam & Certification Prep ·
 * Career Tools / Rubi AI). Slots into the page in place of
 * `PassportProductsGrid`; same `<Block>` shell + intro header so the
 * surface still reads as one benefits page.
 *
 * Section order + copy come from `PASSPORT_PRODUCT_GROUPS` via
 * `passportProductGroupsFor` (empty for non-Elite brands → renders
 * nothing extra). Cards reuse `<PassportProductCard>`; the Career Tools
 * group passes `rubiAccent` for the CTA-toned treatment.
 */
export function PassportProductsSections({ variant }: { variant: 'join' | 'member' }) {
  const { brand } = useAccount()
  const groups = passportProductGroupsFor(brand)
  const isMember = variant === 'member'

  return (
    <Block id={isMember ? 'benefits' : 'included'} alt>
      <Wrap>
        {/* One top-level intro header — reuses the grid's copy so the
            page still reads as a single benefits surface. */}
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

        <div style={{ display: 'flex', flexDirection: 'column', gap: 56 }}>
          {groups.map((group) => (
            <section key={group.id}>
              {isMember ? (
                <SecTitle
                  eyebrow={group.eyebrow}
                  title={group.title}
                  blurb={group.blurb}
                />
              ) : (
                <SectionHead
                  eyebrow={group.eyebrow}
                  title={group.title}
                  blurb={group.blurb}
                />
              )}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
                  gap: 22,
                }}
              >
                {group.products.map((p) => (
                  <PassportProductCard
                    key={p.id}
                    product={p}
                    variant={variant}
                    rubiAccent={group.rubiAccent}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      </Wrap>
    </Block>
  )
}
