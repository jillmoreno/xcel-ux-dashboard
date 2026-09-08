import { Fragment, useMemo, useState, type ReactNode } from 'react'
import { WeekendToggle } from './WeekendToggle'
import type { StudyCalendar, StudyTask, StudyTaskStatus } from '@/data/studyCalendarFixtures'
import { STUDY_CALENDAR_TODAY } from '@/data/studyCalendarFixtures'

const DOW_LABELS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function formatCellDate(iso: string): string {
  const [, m, d] = iso.split('-').map((p) => parseInt(p, 10))
  return `${MONTH_SHORT[m - 1]} ${d}`
}

function isoToUTC(iso: string): number {
  const [y, m, d] = iso.split('-').map((p) => parseInt(p, 10))
  return Date.UTC(y, m - 1, d)
}

function utcToIso(ms: number): string {
  const dt = new Date(ms)
  const y = dt.getUTCFullYear()
  const m = String(dt.getUTCMonth() + 1).padStart(2, '0')
  const d = String(dt.getUTCDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function dayOfWeek(ms: number): number {
  return new Date(ms).getUTCDay()
}

function statusDotColor(status: StudyTaskStatus): string {
  switch (status) {
    case 'completed':
      return 'var(--color-success-500)'
    case 'in-progress':
      return 'var(--color-primary-500)'
    case 'overdue':
      return 'var(--color-warning-500)'
    case 'upcoming':
      return 'var(--color-neutral-400)'
  }
}

export function WeekGridView({
  calendar,
  hideWeekendToggle,
  headerActions,
}: {
  calendar: StudyCalendar
  /** Hide the "Hide weekends" toggle below the grid. Used by the
   *  "View Calendar" modal where the grid is presented as a print-style
   *  layout — weekends stay collapsed (the default) with no user toggle. */
  hideWeekendToggle?: boolean
  /** Slot rendered on the right side of the calendar's title header.
   *  Used by the "View Calendar" modal to inline the Download / Print
   *  actions next to the calendar title instead of in a footer. */
  headerActions?: ReactNode
}) {
  const [hideWeekends, setHideWeekends] = useState(true)
  const today = STUDY_CALENDAR_TODAY

  const tasksByDate = useMemo(() => {
    const map = new Map<string, StudyTask[]>()
    for (const t of calendar.tasks) {
      const list = map.get(t.dueDate) ?? []
      list.push(t)
      map.set(t.dueDate, list)
    }
    return map
  }, [calendar.tasks])

  // Align week start to Monday of the calendar's start week, then walk forward
  // one week at a time until we've covered the exam date.
  const { weekStartsMs, dowOffsets, dowLabels } = useMemo(() => {
    const startMs = isoToUTC(calendar.startDate)
    const endMs = isoToUTC(calendar.examDate)
    const startDow = dayOfWeek(startMs)
    const daysToMonday = startDow === 0 ? -6 : 1 - startDow
    const firstMonday = startMs + daysToMonday * 86400000

    const weeks: number[] = []
    let cursor = firstMonday
    while (cursor <= endMs) {
      weeks.push(cursor)
      cursor += 7 * 86400000
    }

    // Offsets from Monday: Mon=0, Tue=1, ..., Sun=6
    const fullOffsets = [0, 1, 2, 3, 4, 5, 6]
    const fullLabels = [
      DOW_LABELS[1],
      DOW_LABELS[2],
      DOW_LABELS[3],
      DOW_LABELS[4],
      DOW_LABELS[5],
      DOW_LABELS[6],
      DOW_LABELS[0],
    ]
    const offsets = hideWeekends ? fullOffsets.slice(0, 5) : fullOffsets
    const labels = hideWeekends ? fullLabels.slice(0, 5) : fullLabels

    return { weekStartsMs: weeks, dowOffsets: offsets, dowLabels: labels }
  }, [calendar.startDate, calendar.examDate, hideWeekends])

  const examIso = calendar.examDate

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
        <h4
          style={{
            margin: 0,
            fontFamily: 'var(--font-body)',
            fontWeight: 600,
            fontSize: 18,
            lineHeight: '24px',
            color: 'var(--color-primary-500)',
          }}
        >
          {calendar.examName} Calendar
        </h4>
        {headerActions ? (
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 12 }}>
            {headerActions}
          </div>
        ) : null}
      </header>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `48px repeat(${dowOffsets.length}, minmax(0, 1fr))`,
          gap: 8,
        }}
      >
        <div aria-hidden />
        {dowLabels.map((label) => (
          <div
            key={label}
            style={{
              background: 'var(--color-neutral-700)',
              color: 'var(--color-neutral-50)',
              padding: '10px 12px',
              borderRadius: 'var(--radius-md)',
              textAlign: 'center',
              fontFamily: 'var(--font-body)',
              fontWeight: 600,
              fontSize: 13,
              lineHeight: '20px',
            }}
          >
            {label}
          </div>
        ))}

        {weekStartsMs.map((weekMs, wi) => (
          <Fragment key={wi}>
            <div
              style={{
                background: 'var(--color-neutral-100)',
                borderRadius: 'var(--radius-md)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: 'var(--font-body)',
                fontWeight: 600,
                fontSize: 12,
                color: 'var(--color-text-secondary)',
                padding: 8,
              }}
            >
              <span
                style={{
                  writingMode: 'vertical-rl',
                  transform: 'rotate(180deg)',
                  letterSpacing: '0.02em',
                }}
              >
                Week {wi + 1}
              </span>
            </div>
            {dowOffsets.map((offset) => {
              const cellMs = weekMs + offset * 86400000
              const iso = utcToIso(cellMs)
              const tasks = tasksByDate.get(iso) ?? []
              const isToday = iso === today
              const isExam = iso === examIso

              return (
                <div
                  key={offset}
                  style={{
                    background: 'var(--color-surface-card)',
                    border: isToday
                      ? '2px solid var(--color-cta-500)'
                      : isExam
                      ? '2px solid var(--color-primary-500)'
                      : '1px solid var(--color-border-subtle)',
                    borderRadius: 'var(--radius-md)',
                    padding: 10,
                    minHeight: 96,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 6,
                  }}
                >
                  <span
                    style={{
                      alignSelf: 'flex-start',
                      fontFamily: 'var(--font-body)',
                      fontSize: 11,
                      fontWeight: 600,
                      letterSpacing: '0.04em',
                      textTransform: 'uppercase',
                      color: isToday
                        ? 'var(--color-cta-700)'
                        : isExam
                        ? 'var(--color-primary-700)'
                        : 'var(--color-neutral-700)',
                    }}
                  >
                    {formatCellDate(iso)}
                  </span>
                  {isExam && (
                    <span
                      style={{
                        alignSelf: 'flex-start',
                        background: 'var(--color-primary-500)',
                        color: 'var(--color-neutral-50)',
                        padding: '2px 8px',
                        borderRadius: 'var(--radius-pill)',
                        fontFamily: 'var(--font-body)',
                        fontWeight: 700,
                        fontSize: 11,
                        letterSpacing: '0.04em',
                        textTransform: 'uppercase',
                      }}
                    >
                      Exam Day
                    </span>
                  )}
                  {tasks.length > 0 && (
                    <ul
                      style={{
                        listStyle: 'none',
                        margin: 0,
                        padding: 0,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 4,
                      }}
                    >
                      {tasks.map((t) => (
                        <li
                          key={t.id}
                          style={{
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: 6,
                            fontFamily: 'var(--font-body)',
                            fontSize: 12,
                            lineHeight: '16px',
                            color: 'var(--color-text-primary)',
                            textDecoration: t.status === 'completed' ? 'line-through' : undefined,
                            opacity: t.status === 'completed' ? 0.6 : 1,
                          }}
                        >
                          <span
                            aria-hidden
                            style={{
                              width: 6,
                              height: 6,
                              borderRadius: 'var(--radius-pill)',
                              background: statusDotColor(t.status),
                              flexShrink: 0,
                              marginTop: 5,
                            }}
                          />
                          <span style={{ flex: 1, minWidth: 0 }}>{t.title}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )
            })}
          </Fragment>
        ))}
      </div>

      {hideWeekendToggle ? null : (
        <div>
          <WeekendToggle checked={hideWeekends} onChange={setHideWeekends} />
        </div>
      )}
    </section>
  )
}
