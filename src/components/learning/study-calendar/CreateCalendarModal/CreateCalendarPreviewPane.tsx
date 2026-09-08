import type { CSSProperties } from 'react'
import {
  findCreateCalendarOption,
} from '@/data/createCalendarOptions'
import type { ProjectedCompletion } from './useProjectedCompletion'
import type { WeekDay } from './StudyDaysToggle'

/**
 * Right-side preview pane inside the Create Calendar modal.
 * Progressive reveal:
 *
 *   - Nothing filled                    → "No Calendar Selected" card.
 *   - Calendar picked                   → 4-up stat row (Tasks · Study
 *                                          days · Start · Finish).
 *   - Calendar + studyDays + start date → Mini month grid (NYSE
 *                                          holidays tinted amber when
 *                                          the omit toggle is on; off-
 *                                          days muted) + first 3 tasks
 *                                          stubbed below.
 *
 * The preview is read-only for the demo — nothing in it is clickable.
 * Once Save fires, the real Study Calendar grid takes over in the
 * underlying tab.
 */
type Props = {
  assignedCalendarId: string | null
  startDate: string | null
  studyDays: WeekDay[]
  omitNyseHolidays: boolean
  projection: ProjectedCompletion
}

export function CreateCalendarPreviewPane({
  assignedCalendarId,
  startDate,
  studyDays,
  omitNyseHolidays,
  projection,
}: Props) {
  const option = findCreateCalendarOption(assignedCalendarId)
  const hasCalendar = option != null
  const hasMath = projection.state === 'filled' && studyDays.length > 0

  return (
    <div style={paneStyle}>
      <h4 style={eyebrowStyle}>Calendar Preview</h4>

      {!hasCalendar ? (
        <div style={emptyCardStyle}>
          <div style={emptyTitleStyle}>No Calendar Selected</div>
          <div style={emptySubStyle}>Please select calendar to view calendar tasks.</div>
        </div>
      ) : (
        <>
          <StatRow
            tasks={option.taskCount}
            studyDays={studyDays.length}
            startLabel={hasMath ? shortDate(parseIsoOrToday(startDate)) : 'TBD'}
            finishLabel={
              hasMath && projection.state === 'filled'
                ? shortDate(projection.date)
                : 'TBD'
            }
          />
          {hasMath && (
            <>
              <MiniMonthGrid
                anchor={parseIsoOrToday(startDate)}
                studyDays={studyDays}
                omitNyseHolidays={omitNyseHolidays}
              />
              <FirstThreeTasks
                start={parseIsoOrToday(startDate)}
                studyDays={studyDays}
                omitNyseHolidays={omitNyseHolidays}
              />
            </>
          )}
        </>
      )}
    </div>
  )
}

/* ─── 4-up stats ───────────────────────────────────────────────────── */

function StatRow({
  tasks,
  studyDays,
  startLabel,
  finishLabel,
}: {
  tasks: number
  studyDays: number
  startLabel: string
  finishLabel: string
}) {
  return (
    <dl style={statRowStyle}>
      <StatCell label="Tasks" value={String(tasks)} />
      <StatCell label="Study days" value={String(studyDays)} />
      <StatCell label="Start" value={startLabel} />
      <StatCell label="Finish" value={finishLabel} />
    </dl>
  )
}

function StatCell({ label, value }: { label: string; value: string }) {
  return (
    <div style={statCellStyle}>
      <dt style={statLabelStyle}>{label}</dt>
      <dd style={statValueStyle}>{value}</dd>
    </div>
  )
}

/* ─── Mini month grid ──────────────────────────────────────────────── */

const STUBBED_NYSE_HOLIDAYS = new Set<string>([
  '2026-01-01',
  '2026-01-19',
  '2026-02-16',
  '2026-04-03',
  '2026-05-25',
  '2026-06-19',
  '2026-07-03',
  '2026-09-07',
  '2026-11-26',
  '2026-12-25',
])

function MiniMonthGrid({
  anchor,
  studyDays,
  omitNyseHolidays,
}: {
  anchor: Date
  studyDays: WeekDay[]
  omitNyseHolidays: boolean
}) {
  // Render the month containing the anchor date. Grid starts on
  // Sunday and pads the leading + trailing weeks with muted "outside-
  // month" cells so the calendar always renders 5 full rows.
  const studyDaySet = new Set(studyDays)
  const year = anchor.getFullYear()
  const month = anchor.getMonth()
  const monthLabel = anchor.toLocaleString('en-US', {
    month: 'long',
    year: 'numeric',
  })

  const firstOfMonth = new Date(year, month, 1)
  const gridStart = new Date(firstOfMonth)
  gridStart.setDate(gridStart.getDate() - gridStart.getDay()) // back to Sunday

  const cells: Array<{
    dayLabel: string
    classifier: 'in-month-task' | 'in-month-off' | 'in-month-holiday' | 'muted'
  }> = []
  const cursor = new Date(gridStart)
  for (let i = 0; i < 35; i++) {
    const inMonth = cursor.getMonth() === month
    const dow = cursor.getDay() as WeekDay
    const isHoliday = omitNyseHolidays && STUBBED_NYSE_HOLIDAYS.has(isoOf(cursor))
    const isStudyDay = studyDaySet.has(dow)
    const classifier = !inMonth
      ? 'muted'
      : isHoliday
        ? 'in-month-holiday'
        : isStudyDay
          ? 'in-month-task'
          : 'in-month-off'
    cells.push({
      dayLabel: String(cursor.getDate()),
      classifier,
    })
    cursor.setDate(cursor.getDate() + 1)
  }

  return (
    <div style={miniCalWrapStyle}>
      <div style={miniCalHeadStyle}>
        <span>{monthLabel}</span>
        <div style={legendStyle}>
          <LegendDot tint="var(--color-primary-500)" label="Task" />
          <LegendDot tint="var(--color-warning-500)" label="Holiday" />
          <LegendDot tint="var(--color-neutral-300)" label="Off day" />
        </div>
      </div>
      <div style={miniGridStyle}>
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
          <div key={`dow-${i}`} style={miniDowStyle}>
            {d}
          </div>
        ))}
        {cells.map((cell, i) => (
          <div
            key={i}
            style={{
              ...miniDayStyle,
              ...(cell.classifier === 'muted'
                ? mutedStyle
                : cell.classifier === 'in-month-off'
                  ? offStyle
                  : cell.classifier === 'in-month-holiday'
                    ? holidayStyle
                    : taskStyle),
            }}
          >
            {cell.dayLabel}
            {cell.classifier === 'in-month-task' && (
              <span aria-hidden style={taskDotStyle} />
            )}
            {cell.classifier === 'in-month-holiday' && (
              <>
                <span aria-hidden style={holidayDotStyle} />
                {/* "H" glyph anchors meaning even without color. */}
                <span aria-hidden style={holidayGlyphStyle}>
                  H
                </span>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

function LegendDot({ tint, label }: { tint: string; label: string }) {
  return (
    <span style={legendItemStyle}>
      <span
        aria-hidden
        style={{
          width: 6,
          height: 6,
          borderRadius: '50%',
          background: tint,
          display: 'inline-block',
          verticalAlign: 1,
          marginRight: 4,
        }}
      />
      {label}
    </span>
  )
}

/* ─── First-3 tasks ────────────────────────────────────────────────── */

function FirstThreeTasks({
  start,
  studyDays,
  omitNyseHolidays,
}: {
  start: Date
  studyDays: WeekDay[]
  omitNyseHolidays: boolean
}) {
  const studyDaySet = new Set(studyDays)
  const found: Array<{ date: Date; kind: 'Lesson' | 'Quiz'; title: string; meta: string }> =
    []
  const cursor = new Date(start)
  // Stubbed task scaffold — first 3 days that land on a selected
  // study day (skipping holidays when the toggle is on). Titles +
  // meta are placeholders that mirror the concept HTML's first 3
  // rows; this is the only place demo-specific copy lives.
  const TASKS = [
    { kind: 'Lesson' as const, title: 'Equity Securities · Intro', meta: '45 min · Video' },
    { kind: 'Lesson' as const, title: 'Debt Securities · Bonds 101', meta: '60 min · Video + Reading' },
    { kind: 'Quiz' as const, title: 'Module 1 Practice Quiz', meta: '20 min · 15 questions' },
  ]
  while (found.length < 3) {
    const dow = cursor.getDay() as WeekDay
    const iso = isoOf(cursor)
    const skip = !studyDaySet.has(dow) || (omitNyseHolidays && STUBBED_NYSE_HOLIDAYS.has(iso))
    if (!skip) {
      const t = TASKS[found.length]
      found.push({ date: new Date(cursor), ...t })
    }
    cursor.setDate(cursor.getDate() + 1)
  }

  return (
    <div style={taskListStyle}>
      <div style={taskListHeadStyle}>
        <span>First 3 tasks</span>
        <span style={taskListSubStyle}>
          starting {shortDate(found[0].date)}
        </span>
      </div>
      {found.map((row, i) => (
        <div
          key={i}
          style={{
            ...taskRowStyle,
            borderBottom: i === found.length - 1 ? 'none' : '1px solid var(--color-border-subtle)',
          }}
        >
          <div style={tdateStyle}>
            <div style={tdateMStyle}>
              {row.date.toLocaleString('en-US', { month: 'short' }).toUpperCase()}
            </div>
            <div style={tdateDStyle}>{row.date.getDate()}</div>
          </div>
          <div>
            <div style={ttitleStyle}>{row.title}</div>
            <div style={tmetaStyle}>{row.meta}</div>
          </div>
          <span style={row.kind === 'Quiz' ? tkindQuizStyle : tkindLessonStyle}>
            {row.kind}
          </span>
        </div>
      ))}
    </div>
  )
}

/* ─── Helpers ──────────────────────────────────────────────────────── */

function parseIsoOrToday(iso: string | null | undefined): Date {
  if (iso) {
    const [y, m, d] = iso.split('-').map((p) => parseInt(p, 10))
    if (y && m && d) return new Date(y, m - 1, d)
  }
  const now = new Date()
  return new Date(now.getFullYear(), now.getMonth(), now.getDate())
}

function isoOf(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function shortDate(d: Date): string {
  return d.toLocaleString('en-US', { month: 'short', day: 'numeric' })
}

/* ─── styles ───────────────────────────────────────────────────────── */

const paneStyle: CSSProperties = {
  padding: '22px 22px',
  background: 'var(--color-neutral-100)',
  overflowY: 'auto',
  display: 'flex',
  flexDirection: 'column',
  gap: 14,
  minHeight: 0,
}

const eyebrowStyle: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-heading)',
  fontWeight: 700,
  fontSize: 13,
  textTransform: 'uppercase',
  letterSpacing: '0.14em',
  color: 'var(--color-text-tertiary)',
}

const emptyCardStyle: CSSProperties = {
  background: 'var(--color-surface-card)',
  border: '1px solid var(--color-border-subtle)',
  borderRadius: 'var(--radius-md)',
  padding: '16px 18px',
}

const emptyTitleStyle: CSSProperties = {
  fontFamily: 'var(--font-heading)',
  fontWeight: 700,
  fontSize: 14,
  color: 'var(--color-text-primary)',
  marginBottom: 4,
}

const emptySubStyle: CSSProperties = {
  fontFamily: 'var(--font-body)',
  color: 'var(--color-text-secondary)',
  fontSize: 13,
}

const statRowStyle: CSSProperties = {
  margin: 0,
  display: 'grid',
  gridTemplateColumns: 'repeat(2, 1fr)',
  gap: 10,
}

const statCellStyle: CSSProperties = {
  background: 'var(--color-surface-card)',
  border: '1px solid var(--color-border-subtle)',
  borderRadius: 'var(--radius-md)',
  padding: '10px 12px',
}

const statLabelStyle: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-body)',
  fontSize: 10,
  textTransform: 'uppercase',
  letterSpacing: '0.1em',
  color: 'var(--color-text-tertiary)',
  fontWeight: 700,
}

const statValueStyle: CSSProperties = {
  margin: '3px 0 0',
  fontFamily: 'var(--font-heading)',
  fontWeight: 700,
  fontSize: 16,
  color: 'var(--color-primary-500)',
}

const miniCalWrapStyle: CSSProperties = {
  background: 'var(--color-surface-card)',
  border: '1px solid var(--color-border-subtle)',
  borderRadius: 'var(--radius-md)',
  overflow: 'hidden',
}

const miniCalHeadStyle: CSSProperties = {
  padding: '8px 12px',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  borderBottom: '1px solid var(--color-border-subtle)',
  fontFamily: 'var(--font-heading)',
  fontWeight: 700,
  fontSize: 12,
  color: 'var(--color-text-primary)',
}

const legendStyle: CSSProperties = {
  display: 'flex',
  gap: 10,
  fontFamily: 'var(--font-body)',
  fontSize: 10,
  fontWeight: 400,
  color: 'var(--color-text-tertiary)',
}

const legendItemStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
}

const miniGridStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(7, 1fr)',
  gap: 1,
  background: 'var(--color-border-subtle)',
}

const miniDowStyle: CSSProperties = {
  background: 'var(--color-neutral-100)',
  padding: '4px 0',
  textAlign: 'center',
  fontFamily: 'var(--font-body)',
  fontSize: 8,
  fontWeight: 700,
  letterSpacing: '0.1em',
  color: 'var(--color-text-tertiary)',
  textTransform: 'uppercase',
}

const miniDayStyle: CSSProperties = {
  background: 'var(--color-surface-card)',
  aspectRatio: '1 / 0.85',
  padding: '3px 4px',
  fontFamily: 'var(--font-body)',
  fontSize: 9,
  color: 'var(--color-text-primary)',
  position: 'relative',
  fontWeight: 600,
}

const mutedStyle: CSSProperties = {
  color: 'var(--color-neutral-400)',
  fontWeight: 400,
}

const offStyle: CSSProperties = {
  background: 'var(--color-neutral-100)',
  color: 'var(--color-neutral-400)',
  fontWeight: 400,
}

const taskStyle: CSSProperties = {}

const holidayStyle: CSSProperties = {
  background: 'var(--color-warning-100)',
  color: 'var(--color-warning-700)',
}

const taskDotStyle: CSSProperties = {
  position: 'absolute',
  bottom: 4,
  left: '50%',
  transform: 'translateX(-50%)',
  width: 4,
  height: 4,
  borderRadius: '50%',
  background: 'var(--color-primary-500)',
}

const holidayDotStyle: CSSProperties = {
  position: 'absolute',
  bottom: 4,
  left: '50%',
  transform: 'translateX(-50%)',
  width: 4,
  height: 4,
  borderRadius: '50%',
  background: 'var(--color-warning-500)',
}

const holidayGlyphStyle: CSSProperties = {
  position: 'absolute',
  top: 2,
  right: 3,
  fontFamily: 'var(--font-heading)',
  fontSize: 8,
  fontWeight: 700,
  color: 'var(--color-warning-700)',
}

const taskListStyle: CSSProperties = {
  background: 'var(--color-surface-card)',
  border: '1px solid var(--color-border-subtle)',
  borderRadius: 'var(--radius-md)',
  overflow: 'hidden',
}

const taskListHeadStyle: CSSProperties = {
  padding: '8px 12px',
  borderBottom: '1px solid var(--color-border-subtle)',
  fontFamily: 'var(--font-heading)',
  fontWeight: 700,
  fontSize: 12,
  color: 'var(--color-text-primary)',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
}

const taskListSubStyle: CSSProperties = {
  color: 'var(--color-text-tertiary)',
  fontFamily: 'var(--font-body)',
  fontSize: 11,
  fontWeight: 400,
}

const taskRowStyle: CSSProperties = {
  padding: '8px 12px',
  display: 'grid',
  gridTemplateColumns: '36px 1fr auto',
  alignItems: 'center',
  gap: 10,
}

const tdateStyle: CSSProperties = {
  textAlign: 'center',
  background: 'var(--color-neutral-100)',
  borderRadius: 'var(--radius-sm)',
  padding: '3px 0 4px',
}

const tdateMStyle: CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontSize: 8,
  fontWeight: 700,
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  color: 'var(--color-text-tertiary)',
  lineHeight: 1,
}

const tdateDStyle: CSSProperties = {
  fontFamily: 'var(--font-heading)',
  fontWeight: 700,
  fontSize: 13,
  color: 'var(--color-primary-500)',
}

const ttitleStyle: CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontSize: 13,
  color: 'var(--color-text-primary)',
  fontWeight: 600,
}

const tmetaStyle: CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontSize: 11,
  color: 'var(--color-text-tertiary)',
}

const tkindBaseStyle: CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontSize: 10,
  fontWeight: 700,
  padding: '2px 8px',
  borderRadius: 'var(--radius-pill)',
  whiteSpace: 'nowrap',
}

const tkindLessonStyle: CSSProperties = {
  ...tkindBaseStyle,
  color: 'var(--color-secondary-700)',
  background: 'var(--color-secondary-100)',
}

const tkindQuizStyle: CSSProperties = {
  ...tkindBaseStyle,
  color: 'var(--color-primary-700)',
  background: 'var(--color-primary-100)',
}
