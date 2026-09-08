import { Navigate } from 'react-router-dom'
import { Award } from '@/icons'
import { useAccount } from '@/context/AccountContext'
import { learningAtAGlanceFor } from '@/data/membership/learningAtAGlanceFixtures'
import { MembershipBreadcrumbs } from '@/components/membership/MembershipBreadcrumbs'
import { ArchetypeCard } from '@/components/membership/v2/learning-glance/ArchetypeCard'
import { TopSpecialtiesCard } from '@/components/membership/v2/learning-glance/TopSpecialtiesCard'
import { ConsistencyCard } from '@/components/membership/v2/learning-glance/ConsistencyCard'
import { MilestonesCard } from '@/components/membership/v2/learning-glance/MilestonesCard'

/**
 * `/membership/recap` — the full Spotify-Wrapped-style learning recap.
 * Route lives under `/membership` (rather than `/my-learning`) to keep the
 * feature self-contained with its entry point (the badge on the member
 * membership view). Members + Elite only; a deep link from anyone else
 * redirects back to `/membership` so an empty recap can't be exposed.
 */
export function LearningRecapPage() {
  const { brand, membership } = useAccount()
  const glance = learningAtAGlanceFor(brand)

  if (membership !== 'member' || !glance) {
    return <Navigate to="/membership" replace />
  }

  return (
    <>
      <MembershipBreadcrumbs
        items={[{ label: 'Membership', to: '/membership' }, { label: 'Your Learning Recap' }]}
      />
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px 24px 64px', width: '100%' }}>
        <header style={{ margin: '0 0 26px' }}>
        <span
          style={{
            fontFamily: 'var(--font-heading)',
            fontWeight: 700,
            fontSize: 13,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: 'var(--color-eyebrow-text)',
          }}
        >
          Your learning, wrapped
        </span>
        <h1
          style={{
            margin: '8px 0 0',
            fontFamily: 'var(--font-heading)',
            fontWeight: 800,
            fontSize: 34,
            lineHeight: 1.1,
            letterSpacing: '-0.01em',
            color: 'var(--color-primary-800)',
          }}
        >
          Your Learning Recap
        </h1>
        <p style={{ margin: '8px 0 0', fontFamily: 'var(--font-body)', fontSize: 16, color: 'var(--color-text-secondary)' }}>
          {glance.periodLabel}
        </p>
        {/* Headline celebration of certificates earned — the recap's
            standout achievement, also teased on the membership badge. */}
        {glance.milestones.certificatesEarned > 0 && (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              marginTop: 14,
              padding: '7px 14px',
              borderRadius: 'var(--radius-pill)',
              background: 'var(--color-secondary-100)',
              color: 'var(--color-secondary-800)',
              fontFamily: 'var(--font-body)',
              fontSize: 14,
              fontWeight: 600,
            }}
          >
            <Award size={16} aria-hidden />
            <b style={{ fontFamily: 'var(--font-heading)' }}>
              {glance.milestones.certificatesEarned}
            </b>{' '}
            certificates earned this year
          </span>
        )}
      </header>

      {/* Top row — archetype hero (wider) + top specialties. */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.4fr) minmax(0, 1fr)', gap: 20 }}>
        <ArchetypeCard archetype={glance.archetype} />
        <TopSpecialtiesCard specialties={glance.topSpecialties} />
      </div>

      <div style={{ marginTop: 20 }}>
        <ConsistencyCard consistency={glance.consistency} />
      </div>
      <div style={{ marginTop: 20 }}>
        <MilestonesCard milestones={glance.milestones} />
      </div>
      </div>
    </>
  )
}
