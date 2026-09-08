import type { ComponentType } from 'react'
import { Award, CircleCheck, GraduationCap, Grid } from '@/icons'
import type { LearningMilestones } from '@/data/membership/learningAtAGlanceFixtures'
import { glanceCardHeadStyle, glanceCardStyle } from './glanceShared'

/** Four milestone tiles; CE goal renders as `current/target`. */
export function MilestonesCard({ milestones }: { milestones: LearningMilestones }) {
  const tiles: { Icon: ComponentType<{ size?: number }>; value: string; label: string }[] = [
    { Icon: GraduationCap, value: String(milestones.coursesCompleted), label: 'Courses completed' },
    { Icon: Award, value: String(milestones.certificatesEarned), label: 'Certificates earned' },
    { Icon: Grid, value: String(milestones.specialtiesExplored), label: 'Specialties explored' },
    {
      Icon: CircleCheck,
      value: `${milestones.ceGoalCurrent}/${milestones.ceGoalTarget}`,
      label: 'CE goal progress',
    },
  ]
  return (
    <div style={glanceCardStyle}>
      <h3 style={glanceCardHeadStyle}>Milestones</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 14 }}>
        {tiles.map((t) => (
          <div
            key={t.label}
            style={{
              textAlign: 'center',
              border: '1px solid var(--color-border-subtle)',
              borderRadius: 'var(--radius-md)',
              padding: '18px 10px',
              background: 'var(--color-surface-page)',
            }}
          >
            <span
              aria-hidden
              style={{
                width: 40,
                height: 40,
                borderRadius: 'var(--radius-pill)',
                margin: '0 auto 10px',
                display: 'grid',
                placeItems: 'center',
                background: 'var(--color-secondary-100)',
                color: 'var(--color-secondary-700)',
              }}
            >
              <t.Icon size={18} />
            </span>
            <b style={{ display: 'block', fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: 24, color: 'var(--color-primary-800)' }}>
              {t.value}
            </b>
            <span style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--color-text-secondary)' }}>
              {t.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
