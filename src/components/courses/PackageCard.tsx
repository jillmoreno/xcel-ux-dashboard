import { useState } from 'react'
import { Package as PackageIcon } from '@/icons'
import { Card } from '@/components/ui/Card'
import type { Package } from '@/data/catalog/types'
import {
  useAccount,
  defaultMemberTier,
  type Membership as MembershipState,
  type MembershipTier,
} from '@/context/AccountContext'
import { resolveCommerceState } from '@/data/commerce/entitlement'
import { PackageSheet } from './PackageSheet'
import { ProductPriceSlot } from './ProductPriceSlot'

type Props = {
  data: Package
  /** Active membership state. When omitted, reads from AccountContext.
   *  'member' → "Included with Pro" badge in the footer.
   *  'non-member' → price in the footer. */
  membership?: MembershipState
}

export function PackageCard({ data, membership }: Props) {
  const account = useAccount()
  // Effective tier for the commerce resolver — honor an explicit `membership`
  // override while defaulting to the account's real tier (mirrors the pattern
  // in IndividualCourseCard).
  const effectiveTier: MembershipTier =
    membership == null
      ? account.tier
      : membership === 'non-member'
        ? 'non-member'
        : account.tier !== 'non-member'
          ? account.tier
          : defaultMemberTier(account.brand)
  const commerceState = resolveCommerceState(account.brand, effectiveTier, data)
  const [open, setOpen] = useState(false)
  return (
    <>
      <Card
        className="cre-course-card cre-card-stacked cre-card-asym"
        onClick={() => setOpen(true)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            setOpen(true)
          }
        }}
        style={{ cursor: 'pointer' }}
      >
        <div
          className="cre-tile-header cre-tile-header--neutral"
          style={{
            position: 'relative',
            minHeight: 100,
            padding: 16,
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'flex-end',
          }}
        >
          <h3
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: 14,
              fontWeight: 600,
              lineHeight: '20px',
              margin: 0,
              maxWidth: '70%',
              position: 'relative',
              zIndex: 1,
              color: '#fff',
              display: '-webkit-box',
              WebkitLineClamp: 3,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {data.title}
          </h3>
          <PackageIcon
            size={140}
            aria-hidden
            style={{
              position: 'absolute',
              top: -8,
              right: -16,
              color: '#fff',
              opacity: 0.18,
            }}
          />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', padding: '16px 16px 0', gap: 8 }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 500 }}>
            <PackageIcon size={16} aria-hidden />
            Package
          </span>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 2 }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                fontFamily: 'var(--font-body)',
                fontSize: 12,
              }}
            >
              <span>
                {data.hours} {data.hours === 1 ? 'Hour' : 'Hours'}
              </span>
              {data.states.length === 1 && (
                <>
                  <span aria-hidden style={{ width: 1, height: 12, background: 'var(--color-border-subtle)' }} />
                  <span>{data.states[0]}</span>
                </>
              )}
            </div>
            {data.states.length > 1 && (
              <span style={{ fontFamily: 'var(--font-body)', fontSize: 12 }}>{data.states.join(' | ')}</span>
            )}
          </div>
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            padding: '8px 16px 16px',
            fontFamily: 'var(--font-body)',
            fontSize: 12,
            fontWeight: 600,
          }}
        >
          <ProductPriceSlot state={commerceState} fontSize={14} />
        </div>
      </Card>
      <PackageSheet open={open} onClose={() => setOpen(false)} data={data} />
    </>
  )
}
