import { useMemo, useState, type CSSProperties, type ReactNode } from 'react'
import { REFINED_PAGE_TITLES } from '@/data/compassRefinedCopy'
import { AngleLeftRegular, AngleRightRegular, RubiLogo } from '@/icons'
import {
  STUDY_CALENDAR,
  STUDY_CALENDAR_TODAY,
  type StudyCalendar,
  type StudyTask,
  type StudyTaskStatus,
} from '@/data/studyCalendarFixtures'
import { StudyCalendarStatBand } from './study-calendar/StudyCalendarStatBand'
import { TaskRow } from './study-calendar/TaskRow'
import { WeekendToggle } from './study-calendar/WeekendToggle'
import { AddCustomTaskFooter } from './study-calendar/InlineStudyCalendar'
import { STATUS_CHIP_COLORS } from './study-calendar/studyStatusColors'
import { CompassRefinedColumn, CompassRefinedHead } from './CompassRefinedChrome'
import './compassRefined.css'
import './compassRefinedPlannerStc.css'

/**
 * THE STUDY PLANNER, WITH THE LMS STUDY PLAN'S LOGIC — 2026-11-13, the `stc`
 * arm of `compass-planner-source`.
 *
 * Jillienne, looking at the LMS Study Plan calendar (Series 79 · 15 Day
 * Study Plan, `/dashboard-rebrand?section=learning-path`): "with the study
 * calendar, i want to make another standalone link that incorporates logic
 * from the lms STC calendar". The answer was a flag, not a link, because the
 * STC logic already lives in this repo as React — `study-calendar/` is the
 * ported LMS plan — so this page COMPOSES those components inside the
 * Refined chrome rather than redrawing them.
 *
 * What is the LMS's and what is Compass's, by part:
 *
 *   - The stat band (Status · Progress · Tasks Completed · Start Date ·
 *     Target/Exam Date · Days Left) is `StudyCalendarStatBand`, verbatim.
 *   - The task cards are `TaskRow`, verbatim — `JumpBackInTodaysTasks.test`
 *     pins that the Study Plan's row is never forked, and it is not here.
 *   - The Hide weekends switch is `WeekendToggle`, verbatim.
 *   - The Add Task footer is `AddCustomTaskFooter`, verbatim.
 *   - The scope pills, the status chips, the month grid and the day cell are
 *     COPIED from `InlineStudyCalendar`, which keeps them file-local. Copied
 *     rather than exported because that file is the LMS surface's and this
 *     is a design fork of it; the freeze-on-fork rule in
 *     `compassRefinedPages.ts` applies in both directions.
 *   - The chrome — `CompassRefinedHead`, `CompassRefinedColumn`, the Ask
 *     Rubi button — is Refined's, so the shell tests see the same header
 *     shape as every other page.
 *
 * ⚠ NOT WIRED TO `InlineStudyCalendar` ITSELF, on purpose. That component
 * carries the LMS brand gate (`hasStudyCalendarFor` refuses the Series 79
 * path under the XCEL brand), three flag short-circuits, localStorage custom
 * events and four slide-over panels. A Compass page needs the plan, not the
 * plumbing.
 *
 * ⚠ THE DATA IS THE SERIES 79 FIXTURE, RELABELLED. `STUDY_CALENDAR` is the
 * one plan with task-per-day data, pacing status and a tasks-completed count
 * (40 of 48, on track, 8 days left — the screenshot that asked for this).
 * Its dates are May 2026 and `STUDY_CALENDAR_TODAY` is 2026-05-19, which is
 * why this page's "today" differs from the Compass planner's Sep 22. A
 * Florida Life & Health task set would be the next step if the direction
 * holds; `StudyWeekSummary.test` counts the fixture's tasks, so it is read,
 * never mutated.
 *
 * ⚠ ADD TASK SAYS WHAT IT IS. The LMS footer opens `AddCustomEventPanel`;
 * here it writes one line under the list. A participant who reaches for it
 * should learn that it is a real control that is not built yet, which is a
 * better finding than a panel this prototype does not need.
 */

type Scope = { kind: 'date'; iso: string } | { kind: 'all' }
type StatusFilterKey = StudyTaskStatus

const STATUS_CHIPS: { id: StatusFilterKey; label: string }[] = [
  { id: 'overdue', label: 'Overdue' },
  { id: 'in-progress', label: 'In Progress' },
  { id: 'upcoming', label: 'Not Started' },
  { id: 'completed', label: 'Completed' },
]

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

/** The plan, under the course this surface is about. The tasks and dates are
 *  the fixture's; only the names change, so the stat band and the rail agree
 *  on which course the learner is in. */
const PLAN: StudyCalendar = {
  ...STUDY_CALENDAR,
  id: 'compass-fl-lh-stc',
  name: 'Florida Life and Health Pre-licensing',
  examName: 'Florida Life & Health state exam',
}

type DayCell = {
  iso: string
  day: number
  inMonth: boolean
  isToday: boolean
  tasks: StudyTask[]
  summary: 'empty' | 'all-complete' | 'has-overdue' | 'has-in-progress' | 'has-upcoming'
}

function isoOfYMD(y: number, mIdx: number, d: number): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${y}-${pad(mIdx + 1)}-${pad(d)}`
}

function summaryOf(tasks: StudyTask[], done: Set<string>): DayCell['summary'] {
  if (tasks.length === 0) return 'empty'
  const status = (t: StudyTask) => (done.has(t.id) ? 'completed' : t.status)
  if (tasks.every((t) => status(t) === 'completed')) return 'all-complete'
  if (tasks.some((t) => status(t) === 'overdue')) return 'has-overdue'
  if (tasks.some((t) => status(t) === 'in-progress')) return 'has-in-progress'
  return 'has-upcoming'
}

function buildMonthGrid(year: number, monthIdx: number, calendar: StudyCalendar, done: Set<string>): DayCell[] {
  const first = new Date(Date.UTC(year, monthIdx, 1))
  const startDow = first.getUTCDay()
  const daysInMonth = new Date(Date.UTC(year, monthIdx + 1, 0)).getUTCDate()
  const prevDaysInMonth = new Date(Date.UTC(year, monthIdx, 0)).getUTCDate()
  const cells: DayCell[] = []
  for (let i = startDow - 1; i >= 0; i--) {
    const day = prevDaysInMonth - i
    const y = monthIdx === 0 ? year - 1 : year
    const m = monthIdx === 0 ? 11 : monthIdx - 1
    cells.push({ iso: isoOfYMD(y, m, day), day, inMonth: false, isToday: false, tasks: [], summary: 'empty' })
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const iso = isoOfYMD(year, monthIdx, d)
    const tasks = calendar.tasks.filter((t) => t.dueDate === iso)
    cells.push({ iso, day: d, inMonth: true, isToday: iso === STUDY_CALENDAR_TODAY, tasks, summary: summaryOf(tasks, done) })
  }
  while (cells.length % 7 !== 0) {
    const next = cells.length - (startDow + daysInMonth) + 1
    const y = monthIdx === 11 ? year + 1 : year
    const m = monthIdx === 11 ? 0 : monthIdx + 1
    cells.push({ iso: isoOfYMD(y, m, next), day: next, inMonth: false, isToday: false, tasks: [], summary: 'empty' })
  }
  return cells
}

function formatLongWithDow(iso: string): string {
  const [y, m, d] = iso.split('-').map((p) => parseInt(p, 10))
  const date = new Date(Date.UTC(y, m - 1, d))
  const dow = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  return `${dow[date.getUTCDay()]}, ${MONTH_LABELS[m - 1]} ${d}`
}

function monthOf(iso: string): { year: number; monthIdx: number } {
  const [y, m] = iso.split('-').map((p) => parseInt(p, 10))
  return { year: y, monthIdx: m - 1 }
}

export function CompassRefinedPlannerStc() {
  const calendar = PLAN
  const [scope, setScope] = useState<Scope>({ kind: 'date', iso: STUDY_CALENDAR_TODAY })
  const [statusFilter, setStatusFilter] = useState<StatusFilterKey | null>(null)
  const [hideWeekends, setHideWeekends] = useState(false)
  const [month, setMonth] = useState(() => monthOf(STUDY_CALENDAR_TODAY))
  const [done, setDone] = useState<Set<string>>(() => new Set())
  const [note, setNote] = useState<string | null>(null)

  const firstMonth = monthOf(calendar.startDate)
  const lastMonth = monthOf(calendar.examDate)
  const monthKey = (m: { year: number; monthIdx: number }) => m.year * 12 + m.monthIdx
  const canPrev = monthKey(month) > monthKey(firstMonth)
  const canNext = monthKey(month) < monthKey(lastMonth)
  const step = (d: number) =>
    setMonth((m) => {
      const k = monthKey(m) + d
      return { year: Math.floor(k / 12), monthIdx: ((k % 12) + 12) % 12 }
    })

  const cells = useMemo(() => buildMonthGrid(month.year, month.monthIdx, calendar, done), [month, calendar, done])
  const displayCells = useMemo(
    () => (hideWeekends ? cells.filter((_, i) => i % 7 !== 0 && i % 7 !== 6) : cells),
    [cells, hideWeekends],
  )
  const dowLabels = hideWeekends ? DOW_LABELS.slice(1, 6) : DOW_LABELS
  const columns = hideWeekends ? 5 : 7

  const effectiveStatus = (t: StudyTask): StudyTaskStatus => (done.has(t.id) ? 'completed' : t.status)

  const visibleTasks = useMemo(() => {
    const base =
      scope.kind === 'all'
        ? [...calendar.tasks].sort((a, b) => a.dueDate.localeCompare(b.dueDate))
        : calendar.tasks.filter((t) => t.dueDate === scope.iso)
    return statusFilter === null ? base : base.filter((t) => effectiveStatus(t) === statusFilter)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [calendar.tasks, scope, statusFilter, done])

  const completedCount = visibleTasks.filter((t) => effectiveStatus(t) === 'completed').length
  const isTodayScope = scope.kind === 'date' && scope.iso === STUDY_CALENDAR_TODAY

  return (
    <div className="crf-page">
      <button type="button" className="crf-ask">
        <RubiLogo size={17} aria-hidden />
        Ask Rubi
      </button>
      <CompassRefinedColumn>
        <CompassRefinedHead title={REFINED_PAGE_TITLES['study-planner']} />
        <p className="crf-lead">
          Every lesson, quiz and reading in your course, placed on the days you said you can study. Mark a task done
          and the plan keeps score; it tells you whether you are on track for your exam.
        </p>

        {/* ---------- the LMS stat band, verbatim ---------- */}
        <section className="crf-pls__band" aria-label="Plan at a glance">
          <StudyCalendarStatBand calendar={calendar} />
        </section>

        {/* ---------- scope + status filters ---------- */}
        <div className="crf-pls__toolbar">
          <div role="tablist" aria-label="Task scope" style={scopeTablistStyle}>
            <ScopeButton active={isTodayScope} onClick={() => { setScope({ kind: 'date', iso: STUDY_CALENDAR_TODAY }); setMonth(monthOf(STUDY_CALENDAR_TODAY)) }}>
              Today
            </ScopeButton>
            <ScopeButton active={scope.kind === 'all'} onClick={() => setScope({ kind: 'all' })}>
              All Tasks
            </ScopeButton>
          </div>
          <div className="crf-pls__chips" role="group" aria-label="Filter by status">
            {STATUS_CHIPS.map((chip) => (
              <FilterChip
                key={chip.id}
                active={statusFilter === chip.id}
                colors={STATUS_CHIP_COLORS[chip.id]}
                onClick={() => setStatusFilter((p) => (p === chip.id ? null : chip.id))}
              >
                {chip.label}
              </FilterChip>
            ))}
          </div>
        </div>

        {/* ---------- the day (or all) band ---------- */}
        <header className="crf-pls__scope">
          <h3 className="crf-pls__scope-title">
            {scope.kind === 'all' ? (
              'All Tasks'
            ) : isTodayScope ? (
              <>
                Today
                <span className="crf-pls__scope-sub">
                  <span aria-hidden className="crf-pls__scope-bar">|</span>
                  {formatLongWithDow(scope.iso)}
                </span>
              </>
            ) : (
              formatLongWithDow(scope.iso)
            )}
          </h3>
          {visibleTasks.length > 0 && (
            <span className="crf-pls__scope-count">
              {scope.kind === 'all'
                ? `${visibleTasks.length} ${visibleTasks.length === 1 ? 'task' : 'tasks'}`
                : `${completedCount} of ${visibleTasks.length} ${visibleTasks.length === 1 ? 'task' : 'tasks'} complete`}
            </span>
          )}
        </header>

        <div className="crf-pls__grid">
          {/* ---------- the month ---------- */}
          <section className="crf-pls__cal" aria-label="Calendar">
            <div className="crf-pls__month">
              <button type="button" className="crf-pls__nav" aria-label="Previous month" disabled={!canPrev} onClick={() => step(-1)}>
                <AngleLeftRegular size={14} aria-hidden />
              </button>
              <h4 className="crf-pls__month-title">
                {MONTH_LABELS[month.monthIdx]} {month.year}
              </h4>
              <button type="button" className="crf-pls__nav" aria-label="Next month" disabled={!canNext} onClick={() => step(1)}>
                <AngleRightRegular size={14} aria-hidden />
              </button>
            </div>
            <div className="crf-pls__dow" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
              {dowLabels.map((d) => (
                <span key={d}>{d}</span>
              ))}
            </div>
            <div className="crf-pls__cells" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
              {displayCells.map((cell, i) => (
                <DayCellButton
                  key={`${cell.iso}-${i}`}
                  cell={cell}
                  selected={scope.kind === 'date' && cell.iso === scope.iso && cell.inMonth}
                  filterTint={
                    cell.inMonth && statusFilter !== null && cell.tasks.some((t) => effectiveStatus(t) === statusFilter)
                      ? STATUS_CHIP_COLORS[statusFilter].bg
                      : null
                  }
                  onSelect={() => {
                    setScope({ kind: 'date', iso: cell.iso })
                    setStatusFilter(null)
                  }}
                />
              ))}
            </div>
            <div className="crf-pls__cal-foot">
              <WeekendToggle checked={hideWeekends} onChange={setHideWeekends} />
            </div>
          </section>

          {/* ---------- the tasks ---------- */}
          <aside className="crf-pls__tasks" aria-label="Tasks">
            {visibleTasks.length === 0 ? (
              <p className="crf-pls__empty">
                {statusFilter !== null ? 'No tasks match the active filters.' : 'Nothing scheduled for this day.'}
              </p>
            ) : (
              <ul className="crf-pls__list">
                {visibleTasks.map((task) => (
                  <TaskRow
                    key={task.id}
                    task={task}
                    compact
                    showDueDate={scope.kind === 'all'}
                    demoCompleted={done.has(task.id)}
                    onMarkDemoComplete={(id) => setDone((p) => new Set(p).add(id))}
                  />
                ))}
              </ul>
            )}
            <AddCustomTaskFooter
              scopeIso={scope.kind === 'date' ? scope.iso : STUDY_CALENDAR_TODAY}
              onAddCustomEvent={(iso) =>
                setNote(`Adding your own task to ${formatLongWithDow(iso)} is not part of this prototype yet.`)
              }
            />
            {note && (
              <p className="crf-pls__note" role="status">
                {note}
              </p>
            )}
          </aside>
        </div>
      </CompassRefinedColumn>
    </div>
  )
}

/* ---------- copied from InlineStudyCalendar (file-local there) ---------- */

function DayCellButton({
  cell,
  selected,
  filterTint,
  onSelect,
}: {
  cell: DayCell
  selected: boolean
  filterTint: string | null
  onSelect: () => void
}) {
  const border = selected
    ? '2px solid var(--color-action)'
    : cell.isToday
      ? '1px solid var(--color-action)'
      : '1px solid transparent'
  const itemCount = cell.tasks.length
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
  const background = cell.inMonth ? (filterTint ?? 'var(--color-neutral-75)') : 'transparent'
  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={!cell.inMonth}
      className="crf-pls__cell"
      style={{ background, border, cursor: cell.inMonth ? 'pointer' : 'default', opacity: cell.inMonth ? 1 : 0.4 }}
    >
      <span
        className="crf-pls__cell-day"
        style={{ fontWeight: cell.isToday ? 700 : 500, color: cell.isToday ? 'var(--color-action)' : 'var(--color-text-primary)' }}
      >
        {cell.day}
      </span>
      {itemCount > 0 && (
        <span className="crf-pls__cell-count">
          <span aria-hidden className="crf-pls__cell-dot" style={{ background: dotColor }} />
          {itemCount} task{itemCount === 1 ? '' : 's'}
        </span>
      )}
    </button>
  )
}

const scopeTablistStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'stretch',
  height: 33.5,
  background: 'var(--color-neutral-50)',
  borderRadius: 'var(--radius-lg)',
}

function ScopeButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  const [hover, setHover] = useState(false)
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '0 18px',
        borderRadius: 'var(--radius-lg)',
        background: active ? 'var(--color-cta-500)' : hover ? 'var(--color-neutral-100)' : 'transparent',
        color: active ? 'var(--color-neutral-50)' : 'var(--color-neutral-dark)',
        border: 'none',
        fontFamily: 'var(--font-body)',
        fontSize: 14,
        fontWeight: 600,
        lineHeight: 1,
        cursor: 'pointer',
        whiteSpace: 'nowrap',
      }}
    >
      {children}
    </button>
  )
}

function FilterChip({
  active,
  colors,
  onClick,
  children,
}: {
  active: boolean
  colors: { bg: string; fg: string; border: string }
  onClick: () => void
  children: ReactNode
}) {
  const [hover, setHover] = useState(false)
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        padding: '6px 14px',
        borderRadius: 'var(--radius-pill)',
        background: active ? colors.bg : hover ? 'var(--color-neutral-100)' : 'transparent',
        color: active ? colors.fg : 'var(--color-text-secondary)',
        border: `1px solid ${active ? colors.border : hover ? 'var(--color-neutral-300)' : 'var(--color-border-subtle)'}`,
        fontFamily: 'var(--font-body)',
        fontSize: 13,
        fontWeight: 600,
        cursor: 'pointer',
        whiteSpace: 'nowrap',
      }}
    >
      {children}
    </button>
  )
}
