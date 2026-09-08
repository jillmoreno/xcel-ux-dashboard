import { useMemo, useState } from 'react'
import { ArrowLeft, ArrowRight } from '@/icons'
import { Button } from '@/components/ui/Button'
import {
  STUDY_CALENDAR_TODAY,
  type StudyCalendar,
  type StudyTask,
} from '@/data/studyCalendarFixtures'
import { TaskRow } from './TaskRow'
import { WeekendToggle } from './WeekendToggle'

type DayCell = {
  iso: string
  day: number
  inMonth: boolean
  isToday: boolean
  tasks: StudyTask[]
  /** Status summary of the day's tasks. */
  summary: 'empty' | 'all-complete' | 'has-overdue' | 'has-in-progress' | 'has-upcoming'
}

const DOW_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTH_LABELS = [
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

function isoOfYMD(y: number, mIdx: number, d: number): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${y}-${pad(mIdx + 1)}-${pad(d)}`
}

function buildMonthGrid(year: number, monthIdx: number, calendar: StudyCalendar): DayCell[] {
  const first = new Date(Date.UTC(year, monthIdx, 1))
  const startDow = first.getUTCDay()
  const daysInMonth = new Date(Date.UTC(year, monthIdx + 1, 0)).getUTCDate()
  // Prev month tail for leading blanks
  const prevDaysInMonth = new Date(Date.UTC(year, monthIdx, 0)).getUTCDate()

  const cells: DayCell[] = []
  // Leading days from previous month (greyed)
  for (let i = startDow - 1; i >= 0; i--) {
    const day = prevDaysInMonth - i
    const prevYear = monthIdx === 0 ? year - 1 : year
    const prevMonth = monthIdx === 0 ? 11 : monthIdx - 1
    const iso = isoOfYMD(prevYear, prevMonth, day)
    cells.push({
      iso,
      day,
      inMonth: false,
      isToday: false,
      tasks: [],
      summary: 'empty',
    })
  }
  // Current month
  for (let d = 1; d <= daysInMonth; d++) {
    const iso = isoOfYMD(year, monthIdx, d)
    const tasks = calendar.tasks.filter((t) => t.dueDate === iso)
    const summary: DayCell['summary'] =
      tasks.length === 0
        ? 'empty'
        : tasks.every((t) => t.status === 'completed')
          ? 'all-complete'
          : tasks.some((t) => t.status === 'overdue')
            ? 'has-overdue'
            : tasks.some((t) => t.status === 'in-progress')
              ? 'has-in-progress'
              : 'has-upcoming'
    cells.push({
      iso,
      day: d,
      inMonth: true,
      isToday: iso === STUDY_CALENDAR_TODAY,
      tasks,
      summary,
    })
  }
  // Trailing days to complete the week
  while (cells.length % 7 !== 0) {
    const next = cells.length - (startDow + daysInMonth) + 1
    const nextYear = monthIdx === 11 ? year + 1 : year
    const nextMonth = monthIdx === 11 ? 0 : monthIdx + 1
    const iso = isoOfYMD(nextYear, nextMonth, next)
    cells.push({
      iso,
      day: next,
      inMonth: false,
      isToday: false,
      tasks: [],
      summary: 'empty',
    })
  }
  return cells
}

export function GridView({ calendar }: { calendar: StudyCalendar }) {
  const today = STUDY_CALENDAR_TODAY
  const [todayY, todayM] = today.split('-').map((p) => parseInt(p, 10))
  const [year, setYear] = useState(todayY)
  const [monthIdx, setMonthIdx] = useState(todayM - 1)
  const [selectedIso, setSelectedIso] = useState<string>(today)
  const [hideWeekends, setHideWeekends] = useState(false)

  const cells = useMemo(() => buildMonthGrid(year, monthIdx, calendar), [year, monthIdx, calendar])
  // The grid is laid out 7-cells-per-week starting on Sunday. When weekends
  // are hidden we drop Sun (i % 7 === 0) and Sat (i % 7 === 6) cells and
  // collapse the grid to 5 columns.
  const displayCells = useMemo(
    () => (hideWeekends ? cells.filter((_, i) => i % 7 !== 0 && i % 7 !== 6) : cells),
    [cells, hideWeekends],
  )
  const dowLabels = hideWeekends ? DOW_LABELS.slice(1, 6) : DOW_LABELS
  const columns = hideWeekends ? 5 : 7
  const selectedTasks = useMemo(
    () => calendar.tasks.filter((t) => t.dueDate === selectedIso),
    [calendar, selectedIso],
  )

  const goPrevMonth = () => {
    if (monthIdx === 0) {
      setMonthIdx(11)
      setYear(year - 1)
    } else {
      setMonthIdx(monthIdx - 1)
    }
  }
  const goNextMonth = () => {
    if (monthIdx === 11) {
      setMonthIdx(0)
      setYear(year + 1)
    } else {
      setMonthIdx(monthIdx + 1)
    }
  }

  return (
    <section
      style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 1.3fr) minmax(0, 1fr)',
        gap: 24,
        alignItems: 'start',
      }}
    >
      {/* LEFT — calendar container with header + day grid inside */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, minWidth: 0 }}>
        <div
          style={{
            background: 'var(--color-surface-card)',
            border: '1px solid var(--color-border-subtle)',
            borderRadius: 'var(--radius-md)',
            padding: 12,
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
          }}
        >
          {/* Calendar header — month label on the left, nav controls on the right */}
          <header
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
              padding: '4px 4px 0',
            }}
          >
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
              {MONTH_LABELS[monthIdx]} {year}
            </h4>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Button variant="ghost" size="sm" onClick={goPrevMonth} aria-label="Previous month">
                <ArrowLeft size={14} aria-hidden />
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setYear(todayY)
                  setMonthIdx(todayM - 1)
                  setSelectedIso(today)
                }}
              >
                Today
              </Button>
              <Button variant="ghost" size="sm" onClick={goNextMonth} aria-label="Next month">
                <ArrowRight size={14} aria-hidden />
              </Button>
            </div>
          </header>

          {/* Day-of-week labels + day cells */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
              gap: 4,
            }}
          >
            {dowLabels.map((d) => (
              <div
                key={d}
                style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: 11,
                  fontWeight: 600,
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase',
                  color: 'var(--color-text-secondary)',
                  padding: '4px 8px',
                }}
              >
                {d}
              </div>
            ))}
            {displayCells.map((cell, i) => (
              <DayCellButton
                key={`${cell.iso}-${i}`}
                cell={cell}
                selected={cell.iso === selectedIso}
                onSelect={() => cell.inMonth && setSelectedIso(cell.iso)}
              />
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
          <WeekendToggle checked={hideWeekends} onChange={setHideWeekends} />
        </div>
      </div>

      {/* RIGHT — selected-day tasks */}
      <TasksSidePanel selectedIso={selectedIso} tasks={selectedTasks} />
    </section>
  )
}

function TasksSidePanel({
  selectedIso,
  tasks,
}: {
  selectedIso: string
  tasks: StudyTask[]
}) {
  const completed = tasks.filter((t) => t.status === 'completed').length

  return (
    <aside
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        position: 'sticky',
        top: 24,
      }}
    >
      <header
        style={{
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          gap: 12,
        }}
      >
        <h3
          style={{
            margin: 0,
            fontFamily: 'var(--font-body)',
            fontWeight: 600,
            fontSize: 18,
            lineHeight: '24px',
            color: 'var(--color-text-primary)',
          }}
        >
          {formatLongWithDow(selectedIso)}
        </h3>
        {tasks.length > 0 && (
          <span
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: 13,
              color: 'var(--color-text-secondary)',
              textAlign: 'right',
              whiteSpace: 'nowrap',
            }}
          >
            {completed} of {tasks.length} {tasks.length === 1 ? 'task' : 'tasks'} complete
          </span>
        )}
      </header>

      {tasks.length === 0 ? (
        <div
          style={{
            padding: '24px 12px',
            textAlign: 'center',
            background: 'var(--color-neutral-75)',
            border: '1px dashed var(--color-border-subtle)',
            borderRadius: 'var(--radius-md)',
            fontFamily: 'var(--font-body)',
            fontSize: 13,
            color: 'var(--color-text-secondary)',
          }}
        >
          No tasks scheduled.
        </div>
      ) : (
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
            <TaskRow key={task.id} task={task} compact />
          ))}
        </ul>
      )}
    </aside>
  )
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

function DayCellButton({
  cell,
  selected,
  onSelect,
}: {
  cell: DayCell
  selected: boolean
  onSelect: () => void
}) {
  const border = selected
    ? '2px solid var(--color-action)'
    : cell.isToday
      ? '1px solid var(--color-action)'
      : '1px solid transparent'
  // Status dot color matches the ProgressCard donut + TaskBreakdown legend:
  // completed → success, overdue → warning, in-progress → primary, upcoming → neutral.
  const dotColor =
    cell.summary === 'has-overdue'
      ? 'var(--color-warning-500)'
      : cell.summary === 'all-complete'
        ? 'var(--color-success-500)'
        : cell.summary === 'has-in-progress'
          ? 'var(--color-primary-500)'
          : cell.summary === 'has-upcoming'
            ? 'var(--color-neutral-400)'
            : 'transparent'

  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={!cell.inMonth}
      style={{
        minHeight: 72,
        padding: '8px 10px',
        textAlign: 'left',
        background: cell.inMonth ? 'var(--color-neutral-75)' : 'transparent',
        border,
        borderRadius: 'var(--radius-sm)',
        cursor: cell.inMonth ? 'pointer' : 'default',
        opacity: cell.inMonth ? 1 : 0.4,
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
      }}
    >
      <span
        style={{
          fontFamily: 'var(--font-body)',
          fontSize: 13,
          fontWeight: cell.isToday ? 700 : 500,
          color: cell.isToday ? 'var(--color-action)' : 'var(--color-text-primary)',
        }}
      >
        {cell.day}
      </span>
      {cell.tasks.length > 0 && (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
          <span
            aria-hidden
            style={{
              width: 6,
              height: 6,
              borderRadius: 'var(--radius-pill)',
              background: dotColor,
              display: 'inline-block',
            }}
          />
          <span
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: 11,
              color: 'var(--color-text-secondary)',
            }}
          >
            {cell.tasks.length} task{cell.tasks.length === 1 ? '' : 's'}
          </span>
        </span>
      )}
    </button>
  )
}

