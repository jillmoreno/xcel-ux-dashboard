import { Card } from '@/components/ui/Card'
import { CalendarTearOff } from '@/components/ui/CalendarTearOff'
import { HourglassClock, PenToSquare } from '@/icons'
import type { StudyCalendar } from '@/data/studyCalendarFixtures'
import { weeksUntilExam } from '@/data/studyCalendarFixtures'

export function ExamDateCard({
  calendar,
  onEdit,
}: {
  calendar: StudyCalendar
  onEdit: () => void
}) {
  const weeks = weeksUntilExam(calendar.examDate)

  return (
    <Card style={{ padding: 30, gap: 19, height: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
          <h2
            style={{
              margin: 0,
              fontFamily: 'var(--font-body)',
              fontWeight: 600,
              fontSize: 20,
              lineHeight: '28px',
              color: 'var(--color-neutral-darkest)',
            }}
          >
            Target Date
          </h2>
          <p
            style={{
              margin: 0,
              fontFamily: 'var(--font-body)',
              fontSize: 13,
              lineHeight: '18px',
              color: 'var(--color-text-secondary)',
            }}
          >
            {calendar.examName}
          </p>
        </div>
        <button
          type="button"
          onClick={onEdit}
          aria-label="Edit target date"
          className="cre-link-action"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: 0,
            background: 'transparent',
            border: 'none',
            color: 'var(--color-action)',
            fontFamily: 'var(--font-body)',
            fontSize: 14,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          <PenToSquare size={14} aria-hidden />
          Edit
        </button>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)',
          gap: 20,
          alignItems: 'stretch',
        }}
      >
        <TimeToExamPanel weeks={weeks} />
        <ExamDatePanel date={calendar.examDate} />
      </div>
    </Card>
  )
}

function TimeToExamPanel({ weeks }: { weeks: number }) {
  return (
    <div
      style={{
        background: 'color-mix(in srgb, var(--color-primary-500) 12%, white)',
        borderRadius: 'var(--radius-md)',
        padding: '16px 20px 20px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 12,
        textAlign: 'center',
      }}
    >
      <div
        style={{
          fontFamily: 'var(--font-body)',
          fontSize: 16,
          fontWeight: 600,
          lineHeight: '28px',
          color: 'var(--color-neutral-darkest)',
        }}
      >
        Time to Target Date
      </div>
      <HourglassClock size={50} aria-hidden style={{ color: 'var(--color-primary-500)' }} />
      <div
        style={{
          fontFamily: 'var(--font-body)',
          fontWeight: 600,
          color: 'var(--color-neutral-darkest)',
          lineHeight: '28px',
        }}
      >
        <span style={{ fontSize: 24 }}>{weeks}</span>{' '}
        <span style={{ fontSize: 16 }}>{weeks === 1 ? 'week' : 'weeks'}</span>
      </div>
      <div
        style={{
          fontFamily: 'var(--font-body)',
          fontSize: 12,
          fontWeight: 400,
          lineHeight: '16px',
          color: 'var(--color-neutral-darkest)',
        }}
      >
        Left to Target Date
      </div>
    </div>
  )
}

function ExamDatePanel({ date }: { date: string }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'flex-start',
        gap: 12,
      }}
    >
      <div
        style={{
          fontFamily: 'var(--font-body)',
          fontSize: 14,
          fontWeight: 600,
          color: 'var(--color-text-primary)',
        }}
      >
        Target Date
      </div>
      <CalendarTearOff date={date} />
    </div>
  )
}
