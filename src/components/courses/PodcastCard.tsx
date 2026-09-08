import { useState } from 'react'
import { Podcast, StarSolid } from '@/icons'
import { Card } from '@/components/ui/Card'
import type { PodcastRecord } from '@/data/podcastFixtures'
import { useAccount, type Membership as MembershipState } from '@/context/AccountContext'
import { PodcastSheet } from './PodcastSheet'

const BADGE_LABEL: Record<PodcastRecord['badge'], string> = {
  mandatory: 'Mandatory',
  elective: 'Elective',
  'non-credit': 'Non-Credit',
}

type Props = {
  data: PodcastRecord
  /** Active membership state. When omitted, reads from AccountContext. */
  membership?: MembershipState
}

export function PodcastCard({ data, membership }: Props) {
  const account = useAccount()
  const membershipState = membership ?? account.membership
  const isMember = membershipState === 'member'
  const [open, setOpen] = useState(false)
  return (
    <>
      <Card
        className="cre-course-card cre-card-asym"
        onClick={() => setOpen(true)}
        role="button"
        tabIndex={0}
        aria-label={data.title}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            setOpen(true)
          }
        }}
        style={{ cursor: 'pointer' }}
      >
        <div
          className="cre-tile-header cre-tile-header--podcast"
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
              color: 'var(--color-text-inverse)',
              display: '-webkit-box',
              WebkitLineClamp: 3,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {data.title}
          </h3>
          <Podcast
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
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              fontFamily: 'var(--font-body)',
              fontSize: 12,
              fontWeight: 500,
            }}
          >
            <Podcast size={16} aria-hidden />
            Podcast
          </span>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 2 }}>
            {/* Badge | Hours | State — state sits inline with hours when
                there's room; wraps together as a unit when there isn't. */}
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '2px 6px',
                fontFamily: 'var(--font-body)',
                fontSize: 12,
                fontWeight: 500,
              }}
            >
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap' }}>
                <span>{BADGE_LABEL[data.badge]}</span>
                <span aria-hidden style={{ width: 1, height: 12, background: 'var(--color-border-subtle)' }} />
                <span>
                  {data.hours} {data.hours === 1 ? 'Hour' : 'Hours'}
                </span>
              </span>
              {data.state && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap' }}>
                  <span aria-hidden style={{ width: 1, height: 12, background: 'var(--color-border-subtle)' }} />
                  <span>{data.state}</span>
                </span>
              )}
            </div>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                fontFamily: 'var(--font-body)',
                fontSize: 12,
                fontWeight: 500,
              }}
            >
              <StarSolid size={12} aria-hidden style={{ color: 'var(--color-warning-500)' }} />
              <span>{data.rating.toFixed(1)}</span>
            </span>
          </div>
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            padding: '8px 16px 16px',
            fontFamily: 'var(--font-body)',
            fontSize: 12,
            fontWeight: 600,
          }}
        >
          {/* Membership entitlement now lives in the detail panel, not on the
              card. Non-members still see the à-la-carte price here. */}
          {!isMember && typeof data.price === 'number' && (
            <span>${data.price.toFixed(2)}</span>
          )}
        </div>
      </Card>
      <PodcastSheet open={open} onClose={() => setOpen(false)} data={data} />
    </>
  )
}
