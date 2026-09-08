import type { ComponentType } from 'react'
import { CalendarDay, Clock, Flag, GraduationCap } from '@/icons'
import type { ConsistencyStats } from '@/data/membership/learningAtAGlanceFixtures'
import { glanceCardHeadStyle, glanceCardStyle } from './glanceShared'

/** Time & consistency — four stat tiles (the "minutes listened" analogs). */
export function ConsistencyCard({ consistency }: { consistency: ConsistencyStats }) {
  const tiles: { Icon: ComponentType<{ size?: number }>; value: string; label: string }[] = [
    { Icon: GraduationCap, value: `${consistency.ceHours} hrs`, label: 'CE earned this year' },
    { Icon: Flag, value: `${consistency.streakWeeks} wks`, label: 'Current learning streak' },
    { Icon: Clock, value: consistency.peakTime, label: 'Your peak learning time' },
    { Icon: CalendarDay, value: consistency.mostActiveDay, label: 'Your most active day' },
  ]
  return (
    <div style={glanceCardStyle}>
      <h3 style={glanceCardHeadStyle}>Time &amp; consistency</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 14 }}>
        {tiles.map((t) => (
          <div
            key={t.label}
            style={{
              border: '1px solid var(--color-border-subtle)',
              borderRadius: 'var(--radius-md)',
              padding: 16,
              background: 'var(--color-surface-page)',
            }}
          >
            <span aria-hidden style={{ color: 'var(--color-secondary-700)', display: 'inline-flex' }}>
              <t.Icon size={16} />
            </span>
            <b style={{ display: 'block', fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: 26, color: 'var(--color-primary-700)', marginTop: 6 }}>
              {t.value}
            </b>
            <div style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--color-text-secondary)', marginTop: 2 }}>
              {t.label}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
