import type { TopSpecialty } from '@/data/membership/learningAtAGlanceFixtures'
import { glanceCardHeadStyle, glanceCardStyle } from './glanceShared'

/**
 * Ranked top-specialties list (the "top artists" analog). Semantically an
 * ordered list; bars are decorative (width = hours ÷ max hours), values
 * live in the hour labels.
 */
export function TopSpecialtiesCard({ specialties }: { specialties: TopSpecialty[] }) {
  const maxHours = Math.max(...specialties.map((s) => s.hours), 1)
  return (
    <div style={glanceCardStyle}>
      <h3 style={glanceCardHeadStyle}>Your top specialties</h3>
      <ol style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 14 }}>
        {specialties.map((s) => (
          <li
            key={s.name}
            style={{
              display: 'grid',
              gridTemplateColumns: '26px 1fr 64px',
              alignItems: 'center',
              gap: 12,
            }}
          >
            <span
              aria-hidden
              style={{
                fontFamily: 'var(--font-heading)',
                fontWeight: 800,
                fontSize: 18,
                color: 'var(--color-primary-400)',
              }}
            >
              {s.rank}
            </span>
            <div>
              <div style={{ fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 15, color: 'var(--color-primary-800)' }}>
                {s.name}
              </div>
              <div
                aria-hidden
                style={{
                  height: 8,
                  borderRadius: 'var(--radius-pill)',
                  background: 'var(--color-primary-100)',
                  overflow: 'hidden',
                  marginTop: 4,
                }}
              >
                <span
                  style={{
                    display: 'block',
                    height: '100%',
                    width: `${Math.round((s.hours / maxHours) * 100)}%`,
                    background: 'linear-gradient(90deg, var(--color-secondary-500), var(--color-primary-500))',
                  }}
                />
              </div>
            </div>
            <span style={{ fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 600, color: 'var(--color-text-tertiary)', whiteSpace: 'nowrap', textAlign: 'right' }}>
              {s.hours.toFixed(1)} hrs
            </span>
          </li>
        ))}
      </ol>
    </div>
  )
}
