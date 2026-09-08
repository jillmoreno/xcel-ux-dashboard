import { useMemo, useState } from 'react'
import { ArrowLeft, ArrowRight } from '@/icons'
import { Button } from '@/components/ui/Button'
import { TaskRow } from './TaskRow'
import { STUDY_CALENDAR_TODAY, tasksOnDate, type StudyCalendar } from '@/data/studyCalendarFixtures'

function shiftIsoDay(iso: string, deltaDays: number): string {
  const [y, m, d] = iso.split('-').map((p) => parseInt(p, 10))
  const date = new Date(Date.UTC(y, m - 1, d))
  date.setUTCDate(date.getUTCDate() + deltaDays)
  return date.toISOString().slice(0, 10)
}

function formatLongWithDow(iso: string): string {
  const [y, m, d] = iso.split('-').map((p) => parseInt(p, 10))
  const date = new Date(Date.UTC(y, m - 1, d))
  const dow = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  const months = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ]
  return `${dow[date.getUTCDay()]}, ${months[m - 1]} ${d}`
}

export function DailyView({ calendar }: { calendar: StudyCalendar }) {
  const [selected, setSelected] = useState<string>(STUDY_CALENDAR_TODAY)
  const tasks = useMemo(() => tasksOnDate(calendar, selected), [calendar, selected])
  const isToday = selected === STUDY_CALENDAR_TODAY

  return (
    <section style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <span
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              color: 'var(--color-text-secondary)',
            }}
          >
            {isToday ? 'Today' : 'Day plan'}
          </span>
          <h4
            style={{
              margin: 0,
              fontFamily: 'var(--font-body)',
              fontWeight: 600,
              fontSize: 18,
              lineHeight: '24px',
              color: 'var(--color-text-primary)',
            }}
          >
            {formatLongWithDow(selected)}
          </h4>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSelected((s) => shiftIsoDay(s, -1))}
            aria-label="Previous day"
          >
            <ArrowLeft size={14} aria-hidden />
          </Button>
          {!isToday && (
            <Button variant="secondary" size="sm" onClick={() => setSelected(STUDY_CALENDAR_TODAY)}>
              Today
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSelected((s) => shiftIsoDay(s, 1))}
            aria-label="Next day"
          >
            <ArrowRight size={14} aria-hidden />
          </Button>
        </div>
      </header>

      {tasks.length === 0 ? (
        <div
          style={{
            padding: '32px 16px',
            textAlign: 'center',
            background: 'var(--color-surface-card)',
            border: '1px dashed var(--color-border-subtle)',
            borderRadius: 'var(--radius-md)',
            fontFamily: 'var(--font-body)',
            fontSize: 14,
            color: 'var(--color-text-secondary)',
          }}
        >
          No study tasks scheduled for this day.
        </div>
      ) : (
        <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {tasks.map((task) => (
            <TaskRow key={task.id} task={task} />
          ))}
        </ul>
      )}
    </section>
  )
}
