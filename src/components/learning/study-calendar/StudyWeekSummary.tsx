import type { CSSProperties } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight } from '@/icons'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { studyWeeks, type StudyCalendar, type StudyWeek } from '@/data/studyCalendarFixtures'

/**
 * Week summary — the Home band that answers "where am I in the plan" without
 * opening the plan.
 *
 * Sits directly above Recommended for You: the last thing in the learner's own
 * zone before the discovery zone starts. It is a SUMMARY, not a second Study
 * Plan — no task list, no calendar grid, no per-task actions. Every row is a
 * link into the plan, which is where those live.
 *
 * ── Why it does not show every week ─────────────────────────────────────────
 * `WEEKS_SHOWN` is 4, and the window STARTS at the current week rather than at
 * week 1. XCEL's CE plan is nine weeks spread over six months; a learner in
 * week 4 does not need three completed rows above the one they are in, and on
 * Home they never scroll past the fourth. The header line carries the position
 * ("Week 4 of 9") so nothing is lost by not drawing the rest.
 */

const WEEKS_SHOWN = 4

const STATUS_TONE = {
  complete: { tone: 'success' as const, label: 'COMPLETE' },
  'in-progress': { tone: 'info' as const, label: 'IN PROGRESS' },
  overdue: { tone: 'error' as const, label: 'OVERDUE' },
  upcoming: { tone: 'neutral' as const, label: 'UPCOMING' },
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

/** "May 18 – May 24", collapsing to "May 18 – 24" inside one month. */
function rangeLabel(startIso: string, endIso: string): string {
  const [, sm, sd] = startIso.split('-').map((p) => parseInt(p, 10))
  const [, em, ed] = endIso.split('-').map((p) => parseInt(p, 10))
  const left = `${MONTHS[sm - 1]} ${sd}`
  return sm === em ? `${left} – ${ed}` : `${left} – ${MONTHS[em - 1]} ${ed}`
}

/** The one route out of this band. Same target the Jump Back In card's
 *  "View all" uses, so both entry points land on the same surface. */
const PLAN_HREF = '/dashboard-rebrand?section=study-plan'

export function StudyWeekSummary({ calendar }: { calendar: StudyCalendar }) {
  const weeks = studyWeeks(calendar)
  if (weeks.length === 0) return null

  // The week the learner is IN — the first that is not finished. A plan with
  // every week complete has no "current" week, so it shows the last one rather
  // than falling off the end.
  const currentIdx = Math.max(
    0,
    weeks.findIndex((w) => w.status !== 'complete') === -1
      ? weeks.length - 1
      : weeks.findIndex((w) => w.status !== 'complete'),
  )
  const current = weeks[currentIdx]
  const shown = weeks.slice(currentIdx, currentIdx + WEEKS_SHOWN)
  const doneAcross = weeks.reduce((n, w) => n + w.completed, 0)
  const totalAcross = weeks.reduce((n, w) => n + w.total, 0)
  const overdueAcross = weeks.reduce((n, w) => n + w.overdue, 0)

  return (
    <section aria-labelledby="study-week-summary" style={wrapStyle}>
      <div style={headerStyle}>
        <div style={{ minWidth: 0 }}>
          <p style={eyebrowStyle}>Your study weeks</p>
          <h2 id="study-week-summary" style={titleStyle}>
            {calendar.name}
          </h2>
        </div>
        <Link to={PLAN_HREF} style={linkStyle}>
          Open study plan <ArrowRight size={13} aria-hidden />
        </Link>
      </div>

      {/* The plan-level line, so the four rows below never imply the plan is
          four weeks long. */}
      <p style={metaStyle}>
        Week {current.index} of {weeks.length} · {rangeLabel(current.start, current.end)} ·{' '}
        {doneAcross} of {totalAcross} done
        {overdueAcross > 0 && (
          <>
            {' · '}
            <span style={{ color: 'var(--color-error-700)', fontWeight: 700 }}>
              {overdueAcross} overdue
            </span>
          </>
        )}
      </p>

      <ul role="list" style={listStyle}>
        {shown.map((week) => (
          <li key={week.start}>
            <WeekRow week={week} />
          </li>
        ))}
      </ul>
    </section>
  )
}

function WeekRow({ week }: { week: StudyWeek }) {
  const { tone, label } = STATUS_TONE[week.status]
  return (
    <div style={rowStyle}>
      <span aria-hidden style={numberStyle}>
        {week.index}
      </span>
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
        <span style={rowEyebrowStyle}>{rangeLabel(week.start, week.end)}</span>
        <span style={rowTitleStyle}>{week.label}</span>
        {/* One pip per task. A bar would answer "what fraction", which the
            count beside the badge already says; pips answer "how many", which
            is the question a five-task week actually raises. Capped so a
            fifteen-task week does not draw a ruler. */}
        <span aria-hidden style={pipsStyle}>
          {week.tasks.slice(0, PIP_CAP).map((task, i) => (
            <span
              key={task.id}
              style={{
                ...pipStyle,
                background:
                  i < week.completed
                    ? 'var(--color-primary-700)'
                    : task.status === 'in-progress'
                      ? 'var(--color-primary-300)'
                      : 'transparent',
                borderColor:
                  i < week.completed ? 'var(--color-primary-700)' : 'var(--color-neutral-300)',
              }}
            />
          ))}
          {week.total > PIP_CAP && <span style={pipMoreStyle}>+{week.total - PIP_CAP}</span>}
        </span>
      </div>
      <div style={rightStyle}>
        <StatusBadge tone={tone}>{label}</StatusBadge>
        <span style={countStyle}>
          {week.completed} of {week.total} done
        </span>
      </div>
      <Link to={PLAN_HREF} style={viewStyle} aria-label={`View ${week.label}`}>
        View <ArrowRight size={13} aria-hidden />
      </Link>
    </div>
  )
}

const PIP_CAP = 8

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

const metaStyle: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-body)',
  fontSize: 13,
  color: 'var(--color-text-secondary)',
}

const listStyle: CSSProperties = {
  listStyle: 'none',
  margin: 0,
  padding: 0,
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
}

const rowStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 16,
  flexWrap: 'wrap',
  padding: '14px 18px',
  background: 'var(--color-surface-card)',
  border: '1px solid var(--color-border-subtle)',
  borderRadius: 'var(--radius-lg)',
}

const numberStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
  width: 34,
  height: 34,
  borderRadius: 'var(--radius-pill)',
  border: '1px solid var(--color-border-subtle)',
  fontFamily: 'var(--font-body)',
  fontSize: 14,
  fontWeight: 700,
  color: 'var(--color-text-secondary)',
}

const rowEyebrowStyle: CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  color: 'var(--color-text-tertiary)',
}

const rowTitleStyle: CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontSize: 16,
  fontWeight: 700,
  color: 'var(--color-text-primary)',
}

const pipsStyle: CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 5 }

const pipStyle: CSSProperties = {
  width: 11,
  height: 11,
  borderRadius: 3,
  border: '1px solid',
  flexShrink: 0,
}

const pipMoreStyle: CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontSize: 11,
  fontWeight: 600,
  color: 'var(--color-text-tertiary)',
  marginLeft: 2,
}

const rightStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: 4,
  flexShrink: 0,
}

const countStyle: CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontSize: 12,
  color: 'var(--color-text-secondary)',
  whiteSpace: 'nowrap',
}

const linkStyle: CSSProperties = {
  textDecoration: 'none',
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  background: 'transparent',
  border: 'none',
  padding: 0,
  cursor: 'pointer',
  flexShrink: 0,
  fontFamily: 'var(--font-body)',
  fontSize: 13,
  fontWeight: 700,
  color: 'var(--color-accent-link)',
}

const viewStyle: CSSProperties = { ...linkStyle, fontSize: 14 }
