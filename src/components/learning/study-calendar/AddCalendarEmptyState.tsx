import { useMemo, useState, type CSSProperties } from 'react'
import { Button } from '@/components/ui/Button'
import {
  ArrowLeft,
  ArrowRight,
  Bell,
  CalendarDay,
  HourglassClock,
} from '@/icons'
import { STUDY_CALENDAR_TODAY } from '@/data/studyCalendarFixtures'

type Props = {
  /** Fires when the learner clicks "Create Calendar" — the parent
   *  opens the Create Calendar slide-over. */
  onCreateCalendar: () => void
}

/**
 * "Add Calendar" empty-state body for the Study Calendar tab. Two-
 * column layout: a blank-but-still-functional month grid on the
 * left, and a "Set up your study calendar" feature card on the right
 * with a Create Calendar CTA. Sourced from McKissock Figma node
 * `3381:4038` and remapped to the STC brand tokens (`--color-action`
 * resolves to mid-teal `#358087`; the navy title pulls
 * `--color-primary-500`).
 *
 * The calendar reuses the same visual chrome as the normal Study
 * Calendar (white month-nav header attached to a 7-column grid with
 * neutral-75 cell fills, today highlighted in the action color) but
 * drops the per-day task chips so the grid reads as "preview — no
 * tasks scheduled yet". Prev / Next month buttons stay live so the
 * learner can flip ahead and see calendar shape before committing.
 */
export function AddCalendarEmptyState({ onCreateCalendar }: Props) {
  const today = STUDY_CALENDAR_TODAY
  const [todayY, todayM] = today.split('-').map((p) => parseInt(p, 10))
  const [year, setYear] = useState(todayY)
  const [monthIdx, setMonthIdx] = useState(todayM - 1)

  const cells = useMemo(() => buildBlankMonthGrid(year, monthIdx, today), [
    year,
    monthIdx,
    today,
  ])

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
    <section style={shellStyle}>
      <div style={calendarOuterStyle}>
        <header style={calendarHeaderStyle}>
          <button
            type="button"
            onClick={goPrevMonth}
            aria-label="Previous month"
            style={navButtonStyle}
          >
            <ArrowLeft size={14} aria-hidden />
          </button>
          <h4 style={calendarTitleStyle}>
            {MONTH_LABELS[monthIdx]} {year}
          </h4>
          <button
            type="button"
            onClick={goNextMonth}
            aria-label="Next month"
            style={navButtonStyle}
          >
            <ArrowRight size={14} aria-hidden />
          </button>
        </header>

        <div style={gridStyle}>
          {DOW_LABELS.map((d) => (
            <div key={d} style={dowHeaderStyle}>
              {d}
            </div>
          ))}
          {cells.map((cell, i) => (
            <BlankDayCell key={`${cell.iso}-${i}`} cell={cell} />
          ))}
        </div>
      </div>

      <FeatureCard onCreateCalendar={onCreateCalendar} />
    </section>
  )
}

/* ─── Blank day cell ─────────────────────────────────────────────── */

type DayCell = {
  iso: string
  day: number
  inMonth: boolean
  isToday: boolean
}

function BlankDayCell({ cell }: { cell: DayCell }) {
  const border = cell.isToday
    ? '1px solid var(--color-action)'
    : '1px solid transparent'
  const background = cell.inMonth
    ? 'var(--color-neutral-75)'
    : 'transparent'
  return (
    <div
      style={{
        minHeight: 72,
        padding: '8px 10px',
        background,
        border,
        borderRadius: 'var(--radius-sm)',
        opacity: cell.inMonth ? 1 : 0.4,
      }}
    >
      <span
        style={{
          fontFamily: 'var(--font-body)',
          fontSize: 13,
          fontWeight: cell.isToday ? 700 : 500,
          color: cell.isToday
            ? 'var(--color-action)'
            : 'var(--color-text-primary)',
        }}
      >
        {cell.day}
      </span>
    </div>
  )
}

/* ─── Right-side feature card ────────────────────────────────────── */

function FeatureCard({
  onCreateCalendar,
}: {
  onCreateCalendar: () => void
}) {
  return (
    <aside style={cardStyle}>
      <h3 style={cardTitleStyle}>A Study Plan Designed for You</h3>
      <ul style={featureListStyle}>
        <FeatureRow
          icon={<CalendarDay size={18} aria-hidden />}
          label="Personalized study schedule"
        />
        <FeatureRow
          icon={<HourglassClock size={18} aria-hidden />}
          label="Exam day countdown"
        />
        <FeatureRow
          icon={<Bell size={18} aria-hidden />}
          label="Daily study reminders"
        />
      </ul>
      <Button
        variant="primary"
        size="md"
        onClick={onCreateCalendar}
        style={ctaStyle}
      >
        Create Study Plan
      </Button>
    </aside>
  )
}

function FeatureRow({
  icon,
  label,
}: {
  icon: React.ReactNode
  label: string
}) {
  return (
    <li style={featureRowStyle}>
      <span aria-hidden style={featureIconStyle}>
        {icon}
      </span>
      <span style={featureLabelStyle}>{label}</span>
    </li>
  )
}

/* ─── Month-grid helpers ─────────────────────────────────────────── */

const DOW_LABELS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']

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

/** Same shape as `buildMonthGrid` in InlineStudyCalendar, but
 *  stripped of all task / custom-event aggregation since this
 *  preview never has any. Walks back to the previous month's
 *  trailing days, fills the active month, then pads forward to
 *  complete the last week. */
function buildBlankMonthGrid(
  year: number,
  monthIdx: number,
  today: string,
): DayCell[] {
  const first = new Date(Date.UTC(year, monthIdx, 1))
  const startDow = first.getUTCDay()
  const daysInMonth = new Date(Date.UTC(year, monthIdx + 1, 0)).getUTCDate()
  const prevDaysInMonth = new Date(Date.UTC(year, monthIdx, 0)).getUTCDate()
  const cells: DayCell[] = []
  for (let i = startDow - 1; i >= 0; i--) {
    const day = prevDaysInMonth - i
    const prevYear = monthIdx === 0 ? year - 1 : year
    const prevMonth = monthIdx === 0 ? 11 : monthIdx - 1
    const iso = isoOfYMD(prevYear, prevMonth, day)
    cells.push({ iso, day, inMonth: false, isToday: false })
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const iso = isoOfYMD(year, monthIdx, d)
    cells.push({ iso, day: d, inMonth: true, isToday: iso === today })
  }
  while (cells.length % 7 !== 0) {
    const next = cells.length - (startDow + daysInMonth) + 1
    const nextYear = monthIdx === 11 ? year + 1 : year
    const nextMonth = monthIdx === 11 ? 0 : monthIdx + 1
    const iso = isoOfYMD(nextYear, nextMonth, next)
    cells.push({ iso, day: next, inMonth: false, isToday: false })
  }
  return cells
}

/* ─── Styles ─────────────────────────────────────────────────────── */

const shellStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'minmax(0, 1.5fr) minmax(0, 1fr)',
  gap: 24,
  alignItems: 'start',
  // Cap + center so the calendar + feature card don't sprawl on wide
  // viewports.
  maxWidth: 960,
  margin: '0 auto',
}

const calendarOuterStyle: CSSProperties = {
  border: '1px solid var(--color-border-subtle)',
  borderRadius: 'var(--radius-md)',
  overflow: 'hidden',
  background: 'var(--color-surface-card)',
}

const calendarHeaderStyle: CSSProperties = {
  background: 'var(--color-surface-card)',
  color: 'var(--color-text-primary)',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  gap: 12,
  padding: '14px 16px 4px',
}

const navButtonStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 28,
  height: 28,
  borderRadius: 'var(--radius-pill)',
  background: 'transparent',
  border: 'none',
  color: 'var(--color-text-primary)',
  cursor: 'pointer',
}

const calendarTitleStyle: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-body)',
  fontWeight: 600,
  fontSize: 16,
  lineHeight: '22px',
  color: 'var(--color-text-primary)',
  textAlign: 'center',
  minWidth: 150,
}

const gridStyle: CSSProperties = {
  background: 'var(--color-surface-card)',
  padding: 12,
  display: 'grid',
  gridTemplateColumns: 'repeat(7, minmax(0, 1fr))',
  gap: 4,
}

const dowHeaderStyle: CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontSize: 11,
  fontWeight: 600,
  letterSpacing: '0.04em',
  color: 'var(--color-text-secondary)',
  padding: '4px 8px',
}

/* ─── Feature card styles (mirrors Figma node 3381:4038) ─────────── */

const cardStyle: CSSProperties = {
  background: 'var(--color-surface-card)',
  border: '1px solid var(--color-border-subtle)',
  borderRadius: 12,
  padding: '20px',
  display: 'flex',
  flexDirection: 'column',
  gap: 16,
}

const cardTitleStyle: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-body)',
  fontWeight: 600,
  fontSize: 18,
  lineHeight: '22px',
  color: 'var(--color-primary-500)',
}

const featureListStyle: CSSProperties = {
  margin: 0,
  padding: 0,
  listStyle: 'none',
  display: 'flex',
  flexDirection: 'column',
  gap: 10,
}

const featureRowStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
}

// Each glyph sits in an action-tinted rounded medallion (mirrors the
// Passport `ProductIcon` / dashboard Quick Links treatment) so the
// feature list reads as graphical rather than a plain bullet list.
// Color resolves to mid-teal on STC via `--color-action`.
const featureIconStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 34,
  height: 34,
  flexShrink: 0,
  borderRadius: 'var(--radius-md)',
  background: 'color-mix(in srgb, var(--color-action) 12%, white)',
  color: 'var(--color-action)',
}

const featureLabelStyle: CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontSize: 13,
  lineHeight: '18px',
  color: 'var(--color-text-secondary)',
}

const ctaStyle: CSSProperties = {
  marginTop: 4,
  width: '100%',
  height: 44,
  borderRadius: 8,
  fontSize: 14,
  fontWeight: 600,
  lineHeight: '20px',
}
