import { Fragment, useMemo } from 'react'
import { TaskRow } from './TaskRow'
import type { StudyCalendar, StudyTask } from '@/data/studyCalendarFixtures'

type SectionDef = {
  id: 'current' | 'upcoming' | 'completed'
  title: string
  matches: (t: StudyTask) => boolean
}

// Order: Current (today's focus) → Upcoming (road ahead) → Completed (history).
// "Current" bundles in-progress + overdue so the learner sees everything that
// still needs attention together.
const SECTIONS: SectionDef[] = [
  {
    id: 'current',
    title: 'Current Tasks',
    matches: (t) => t.status === 'in-progress' || t.status === 'overdue',
  },
  { id: 'upcoming', title: 'Not Started', matches: (t) => t.status === 'upcoming' },
  { id: 'completed', title: 'Completed Tasks', matches: (t) => t.status === 'completed' },
]

function formatDateHeader(iso: string): string {
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

function groupByDate(tasks: StudyTask[]): Array<{ iso: string; tasks: StudyTask[] }> {
  const map = new Map<string, StudyTask[]>()
  for (const t of tasks) {
    const list = map.get(t.dueDate) ?? []
    list.push(t)
    map.set(t.dueDate, list)
  }
  return Array.from(map.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([iso, ts]) => ({ iso, tasks: ts }))
}

export function TaskListView({ calendar }: { calendar: StudyCalendar }) {
  const grouped = useMemo(() => {
    return SECTIONS.map((section) => {
      const tasks = calendar.tasks.filter(section.matches)
      return { ...section, byDate: groupByDate(tasks), total: tasks.length }
    })
  }, [calendar.tasks])

  return (
    <section style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
      {grouped.map((section) => (
        <div key={section.id} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
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
            {section.title} ({section.total})
          </h4>
          {section.total === 0 ? (
            <div
              style={{
                padding: '24px 16px',
                textAlign: 'center',
                background: 'var(--color-surface-card)',
                border: '1px dashed var(--color-border-subtle)',
                borderRadius: 'var(--radius-md)',
                fontFamily: 'var(--font-body)',
                fontSize: 14,
                color: 'var(--color-text-secondary)',
              }}
            >
              No {section.title.toLowerCase()}.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              {section.byDate.map(({ iso, tasks }) => (
                <Fragment key={iso}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <h5
                      style={{
                        margin: 0,
                        fontFamily: 'var(--font-body)',
                        fontWeight: 600,
                        fontSize: 13,
                        lineHeight: '18px',
                        letterSpacing: '0.04em',
                        textTransform: 'uppercase',
                        color: 'var(--color-neutral-700)',
                      }}
                    >
                      {formatDateHeader(iso)}
                    </h5>
                    <ul
                      style={{
                        listStyle: 'none',
                        margin: 0,
                        padding: 0,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 8,
                      }}
                    >
                      {tasks.map((task) => (
                        <TaskRow key={task.id} task={task} />
                      ))}
                    </ul>
                  </div>
                </Fragment>
              ))}
            </div>
          )}
        </div>
      ))}
    </section>
  )
}
