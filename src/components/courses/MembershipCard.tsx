import { useState } from 'react'
import { Crown } from '@/icons'
import { Card } from '@/components/ui/Card'
import type { Membership } from '@/data/catalog/types'
import { MembershipSheet } from './MembershipSheet'

type Props = {
  data: Membership
}

export function MembershipCard({ data }: Props) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <Card
        className="cre-course-card cre-card-asym"
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
          className="cre-tile-header cre-tile-header--primary"
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
          <Crown
            size={140}
            aria-hidden
            style={{
              position: 'absolute',
              top: -8,
              right: -16,
              color: 'var(--color-text-inverse)',
              opacity: 0.18,
            }}
          />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, padding: '16px 16px 0', gap: 8 }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 500 }}>
            <Crown size={16} aria-hidden />
            Membership
          </span>
          <span style={{ fontFamily: 'var(--font-body)', fontSize: 12 }}>{data.states.join(' | ')}</span>
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
          ${data.price.toFixed(2)}
        </div>
      </Card>
      <MembershipSheet open={open} onClose={() => setOpen(false)} data={data} />
    </>
  )
}
