import type { CSSProperties } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight } from '@/icons'
import { dayStatusOf, STATUS_CHIP_COLORS } from './studyStatusColors'
import {
  studyWeeks,
  STUDY_CALENDAR_TODAY,
  type StudyCalendar,
  type StudyTask,
  type StudyWeek,
} from '@/data/studyCalendarFixtures'

/**
 * Week summary — the Home band that answers "what does THIS WEEK look like"
 * without opening the plan.
 *
 * Seven day cells, Sunday → Saturday, mirroring the Study Plan's own month
 * grid: same day order, same "today" treatment, same task-count line. It is the
 * grid's current row, lifted onto Home.
 *
 * ── One week, not a list of them ────────────────────────────────────────────
 * The first build of this was a LIST of week rows (theme, pips, status chip).
 * That answered "how is the plan going", which the Current Learning Progress
 * band directly above already answers. This answers a different question —
 * which DAYS have work on them — and a learner scanning Home is asking the
 * second one. It is also why the days show a COUNT rather than the task
 * titles: the titles are one click away, and seven columns of them is the
 * plan itself.
 *
 * ── It is a SUMMARY ─────────────────────────────────────────────────────────
 * No per-task action anywhere. Every route out is the same link into the Study
 * Plan, and a test asserts each cell contains links and no buttons — that is
 * the guard keeping this from becoming a second place to tick a task off.
 */

const DOW = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

/** The one route out of this band — the same target the Jump Back In card's
 *  "View all" uses, so both entry points land on the same surface. */
const PLAN_HREF = '/dashboard-rebrand?section=study-plan'

function addDaysIso(iso: string, days: number): string {
  const [y, m, d] = iso.split('-').map((p) => parseInt(p, 10))
  const dt = new Date(Date.UTC(y, m - 1, d))
  dt.setUTCDate(dt.getUTCDate() + days)
  return dt.toISOString().slice(0, 10)
}

/** "May 17 – 23", widening to "May 31 – Jun 6" across a month boundary. */
function rangeLabel(startIso: string, endIso: string): string {
  const [, sm, sd] = startIso.split('-').map((p) => parseInt(p, 10))
  const [, em, ed] = endIso.split('-').map((p) => parseInt(p, 10))
  const left = `${MONTHS[sm - 1]} ${sd}`
  return sm === em ? `${left} – ${ed}` : `${left} – ${MONTHS[em - 1]} ${ed}`
}

type Day = {
  iso: string
  dom: number
  dow: string
  tasks: StudyTask[]
  overdue: number
  /** The day's overall state, from the SAME rule the Study Plan colours its
   *  cells by. `null` when nothing is due. */
  status: ReturnType<typeof dayStatusOf>
}

/** The week's seven days, INCLUDING the empty ones — that is the point of a
 *  calendar row. A day with nothing on it says "nothing due", which a list of
 *  only-the-busy-days cannot. */
function daysOf(week: StudyWeek, today: string): Day[] {
  return Array.from({ length: 7 }, (_, i) => {
    const iso = addDaysIso(week.start, i)
    const tasks = week.tasks.filter((t) => t.dueDate === iso)
    return {
      iso,
      dom: parseInt(iso.slice(8, 10), 10),
      dow: DOW[i],
      tasks,
      overdue: tasks.filter((t) => t.status !== 'completed' && iso < today).length,
      status: dayStatusOf(tasks, iso, today),
    }
  })
}

export function StudyWeekSummary({
  calendar,
  today = STUDY_CALENDAR_TODAY,
}: {
  calendar: StudyCalendar
  today?: string
}) {
  const weeks = studyWeeks(calendar, today)
  if (weeks.length === 0) return null

  // The week the learner is IN. `studyWeeks` drops empty weeks, so on a plan
  // with gaps "this week" is the nearest week that HAS work rather than a
  // literal date match — a strip of seven blank days is not a summary.
  const currentIdx = weeks.findIndex((w) => w.end >= today)
  const week = weeks[currentIdx === -1 ? weeks.length - 1 : currentIdx]
  const days = daysOf(week, today)
  const done = week.completed
  const total = week.total

  return (
    <section aria-labelledby="study-week-summary" style={wrapStyle}>
      <div style={headerStyle}>
        <div style={{ minWidth: 0 }}>
          <p style={eyebrowStyle}>This week</p>
          <h2 id="study-week-summary" style={titleStyle}>
            {week.label}
          </h2>
        </div>
        <Link to={PLAN_HREF} style={linkStyle}>
          Open study plan <ArrowRight size={13} aria-hidden />
        </Link>
      </div>

      <div style={cardStyle}>
        <ul role="list" style={gridStyle}>
          {days.map((day) => (
            <li key={day.iso} style={{ minWidth: 0 }}>
              <DayCell day={day} isToday={day.iso === today} />
            </li>
          ))}
        </ul>

        {/* The footer carries the plan-level position, so seven day cells never
            imply the plan is one week long. */}
        <div style={footerStyle}>
          <span style={footerTextStyle}>
            <strong style={{ fontWeight: 700 }}>
              Week {week.index} of {weeks.length}
            </strong>{' '}
            · {rangeLabel(week.start, week.end)} ·{' '}
            <strong style={{ fontWeight: 700 }}>
              {done} of {total}
            </strong>{' '}
            done
            {week.overdue > 0 && (
              <>
                {' · '}
                <strong style={{ fontWeight: 700, color: 'var(--color-error-700)' }}>
                  {week.overdue} overdue
                </strong>
              </>
            )}
          </span>
          <Link to={PLAN_HREF} style={{ ...linkStyle, fontSize: 13 }}>
            Week summary <ArrowRight size={13} aria-hidden />
          </Link>
        </div>
      </div>
    </section>
  )
}

function DayCell({ day, isToday }: { day: Day; isToday: boolean }) {
  const count = day.tasks.length
  return (
    <Link
      to={PLAN_HREF}
      aria-label={`${day.dow} ${day.dom}: ${count === 0 ? 'nothing due' : `${count} task${count === 1 ? '' : 's'}`}${
        day.status && day.status !== 'upcoming' ? `, ${STATUS_WORD[day.status]}` : ''
      }${isToday ? ', today' : ''}`}
      style={{ ...cellStyle, ...(isToday ? todayCellStyle : null) }}
    >
      <span style={{ ...dowStyle, ...(isToday ? { color: 'var(--color-text-inverse)' } : null) }}>
        {day.dow}
      </span>
      <span style={{ ...domStyle, ...(isToday ? { color: 'var(--color-text-inverse)' } : null) }}>
        {day.dom}
      </span>
      <span style={countRowStyle}>
        {count === 0 ? (
          // An em dash, not "0 tasks". A zero invites the reading that
          // something failed to load; a dash reads as "nothing here".
          <span style={{ ...emptyStyle, ...(isToday ? { color: 'var(--color-text-inverse)' } : null) }}>
            —
          </span>
        ) : (
          <>
            {/* Coloured by the day's STATE, from the Study Plan's own family —
                complete reads green here because it reads green there. On
                today's navy fill the saturated stops still carry (they are the
                `-500`s the plan puts on a light cell), so only the neutral
                `upcoming` stop needs swapping for the inverse ink. */}
            <span
              aria-hidden
              style={{
                ...dotStyle,
                background:
                  day.status && day.status !== 'upcoming'
                    ? STATUS_CHIP_COLORS[day.status].border
                    : isToday
                      ? 'var(--color-text-inverse)'
                      : STATUS_CHIP_COLORS.upcoming.border,
              }}
            />
            <span
              style={{ ...countStyle, ...(isToday ? { color: 'var(--color-text-inverse)' } : null) }}
            >
              {count} task{count === 1 ? '' : 's'}
            </span>
          </>
        )}
      </span>
      {/* The one flag per cell, and it is what keeps the day's state off COLOUR
          ALONE — the dot says it in hue, this says it in words.
          OVERDUE outranks the rest: a reviewer scanning the strip needs the
          problem to surface. TODAY comes next only when there is no state worth
          reporting, since the filled cell already marks today. */}
      <span style={flagRowStyle}>
        {day.overdue > 0 ? (
          <span style={overdueFlagStyle}>{day.overdue} OVERDUE</span>
        ) : day.status === 'completed' ? (
          <span
            style={{
              ...stateFlagStyle,
              color: isToday
                ? 'var(--color-text-inverse)'
                : STATUS_CHIP_COLORS.completed.fg,
            }}
          >
            DONE
          </span>
        ) : day.status === 'in-progress' ? (
          <span
            style={{
              ...stateFlagStyle,
              color: isToday
                ? 'var(--color-text-inverse)'
                : STATUS_CHIP_COLORS['in-progress'].fg,
            }}
          >
            IN PROGRESS
          </span>
        ) : isToday ? (
          <span style={todayFlagStyle}>TODAY</span>
        ) : null}
      </span>
    </Link>
  )
}

/* ─── styles ───────────────────────────────────────────────────────────── */

const wrapStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 10,
  marginBottom: 32,
}

const headerStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'flex-end',
  justifyContent: 'space-between',
  gap: 12,
}

const eyebrowStyle: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-body)',
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  color: 'var(--color-text-tertiary)',
}

const titleStyle: CSSProperties = {
  margin: '2px 0 0',
  fontFamily: 'var(--font-heading)',
  fontSize: 20,
  fontWeight: 700,
  color: 'var(--color-text-primary)',
}

const cardStyle: CSSProperties = {
  border: '1px solid var(--color-border-subtle)',
  borderRadius: 'var(--radius-lg)',
  overflow: 'hidden',
  background: 'var(--color-surface-card)',
}

const gridStyle: CSSProperties = {
  listStyle: 'none',
  margin: 0,
  padding: 0,
  display: 'grid',
  // Seven equal columns, and they stay seven — a calendar row that reflows to
  // four columns is no longer a week.
  gridTemplateColumns: 'repeat(7, minmax(0, 1fr))',
}

const cellStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 4,
  minHeight: 104,
  padding: '10px 8px',
  textDecoration: 'none',
  borderRight: '1px solid var(--color-border-subtle)',
  background: 'var(--color-surface-card)',
}

const todayCellStyle: CSSProperties = { background: 'var(--color-primary-700)' }

const dowStyle: CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: '0.08em',
  color: 'var(--color-text-tertiary)',
}

const domStyle: CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontSize: 18,
  fontWeight: 700,
  lineHeight: 1,
  color: 'var(--color-text-primary)',
}

const countRowStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  marginTop: 4,
  minWidth: 0,
}

const dotStyle: CSSProperties = {
  width: 7,
  height: 7,
  borderRadius: 'var(--radius-pill)',
  flexShrink: 0,
}

const countStyle: CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontSize: 12,
  color: 'var(--color-text-secondary)',
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
}

const emptyStyle: CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontSize: 12,
  color: 'var(--color-text-tertiary)',
}

const flagRowStyle: CSSProperties = { marginTop: 'auto', minHeight: 14 }

const overdueFlagStyle: CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontSize: 9,
  fontWeight: 700,
  letterSpacing: '0.06em',
  color: 'var(--color-warning-800)',
  whiteSpace: 'nowrap',
}

/** Words for the state flags + the accessible label, so nothing about a day's
 *  state is carried by hue alone. */
const STATUS_WORD: Record<string, string> = {
  overdue: 'overdue',
  'in-progress': 'in progress',
  completed: 'complete',
  upcoming: 'not started',
  custom: 'custom',
}

const stateFlagStyle: CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontSize: 9,
  fontWeight: 700,
  letterSpacing: '0.06em',
  whiteSpace: 'nowrap',
}

const todayFlagStyle: CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontSize: 9,
  fontWeight: 700,
  letterSpacing: '0.06em',
  color: 'var(--color-text-inverse)',
}

const footerStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 12,
  flexWrap: 'wrap',
  padding: '10px 14px',
  borderTop: '1px solid var(--color-border-subtle)',
  background: 'var(--color-surface-page)',
}

const footerTextStyle: CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontSize: 13,
  color: 'var(--color-text-secondary)',
}

const linkStyle: CSSProperties = {
  textDecoration: 'none',
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  flexShrink: 0,
  fontFamily: 'var(--font-body)',
  fontSize: 13,
  fontWeight: 700,
  color: 'var(--color-accent-link)',
}
