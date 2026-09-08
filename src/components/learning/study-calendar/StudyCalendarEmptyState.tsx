import type { CSSProperties } from 'react'
import { Bell, CalendarDay, ChevronRight, Clock, Lock } from '@/icons'
import { STUDY_CALENDAR_TODAY } from '@/data/studyCalendarFixtures'

type Props = {
  /** When provided, renders the active two-column setup view with a
   *  CTA card + dimmed calendar preview. Used by both the Add-Calendar
   *  and Create-Calendar demo paths. */
  onAddCalendar?: () => void
  /** Active-mode CTA label. Defaults to "Add calendar"; the Create
   *  Calendar harness passes "Create calendar". */
  ctaLabel?: string
  /** Passive-mode body copy (only rendered in the fallback layout).
   *  Active mode uses the spec'd benefit list instead. */
  description?: string
}

/**
 * Renders when the active STC learning path has no calendar assigned.
 *
 * Two modes:
 *   - **Passive** (no `onAddCalendar`): centered card with a calendar
 *     glyph + "Your team will assign one" copy. Used by non-exam STC
 *     paths and as a fallback when the backend hasn't built a plan.
 *   - **Active** (`onAddCalendar` provided): two-column setup view —
 *     a 260px CTA card on the left (teal-accented border, benefit
 *     list, full-width Create button anchored to the bottom) +
 *     a dimmed month-grid preview with a "Create your calendar to
 *     unlock" pill on the right. Used by the Add-Calendar and
 *     Create-Calendar demo paths.
 *
 * Color values in the active view come from the design spec rather
 * than brand tokens (specific teals: `#0F6E56`, `#1D9E75`, `#E1F5EE`,
 * `#9FE1CB`) so the surface reads the same regardless of which brand
 * is active. Spec values are hardcoded by intent.
 */
export function StudyCalendarEmptyState({
  onAddCalendar,
  ctaLabel = 'Add study plan',
  description,
}: Props = {}) {
  const isActive = typeof onAddCalendar === 'function'
  if (!isActive) return <PassiveEmpty description={description} />
  return <ActiveEmpty ctaLabel={ctaLabel} onAddCalendar={onAddCalendar} />
}

/* ─── Passive mode ────────────────────────────────────────────────── */

function PassiveEmpty({ description }: { description?: string }) {
  return (
    <section
      role="region"
      aria-label="Study plan unavailable"
      style={passiveWrapStyle}
    >
      <span aria-hidden style={passiveIconStyle}>
        <CalendarDay size={22} aria-hidden />
      </span>
      <h3 style={passiveTitleStyle}>No study plan assigned to this path.</h3>
      <p style={passiveBodyStyle}>
        {description ??
          'Your team will pace this learning path with a Study Calendar when one is assigned. For now, use the Mandatory carousel above to pick the next task.'}
      </p>
    </section>
  )
}

const passiveWrapStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  textAlign: 'center',
  gap: 12,
  padding: '48px 24px',
  background: 'var(--color-surface-card)',
  border: '1px solid var(--color-border-subtle)',
  borderRadius: 'var(--radius-lg)',
}

const passiveIconStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 48,
  height: 48,
  borderRadius: 'var(--radius-pill)',
  background: 'var(--color-neutral-100)',
  color: 'var(--color-text-secondary)',
}

const passiveTitleStyle: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-heading)',
  fontSize: 18,
  fontWeight: 700,
  color: 'var(--color-text-primary)',
}

const passiveBodyStyle: CSSProperties = {
  margin: 0,
  maxWidth: 420,
  fontFamily: 'var(--font-body)',
  fontSize: 14,
  lineHeight: '20px',
  color: 'var(--color-text-secondary)',
}

/* ─── Active mode (two-column setup view) ─────────────────────────── */

// Spec colors — intentionally hardcoded, not tokenized.
// `TEAL_MID` was used by the CTA card border before we dropped the
// outline; kept the other four tokens since they still drive the icon
// chip, today-cell highlight, and study-day fill / text.
const TEAL = '#0F6E56'
const TEAL_LIGHT = '#E1F5EE'
const STUDY_FILL = '#9FE1CB'
const STUDY_TEXT = '#085041'

function ActiveEmpty({
  ctaLabel,
  onAddCalendar,
}: {
  ctaLabel: string
  onAddCalendar: () => void
}) {
  return (
    <section
      role="region"
      aria-label="Set up your study plan"
      style={activeWrapStyle}
    >
      <CtaCard ctaLabel={ctaLabel} onAddCalendar={onAddCalendar} />
      <CalendarPreview />
    </section>
  )
}

const activeWrapStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'stretch',
  gap: 16,
  padding: 20,
  background: 'var(--color-surface-page)',
  borderRadius: 'var(--radius-lg)',
}

/* CTA card (left) */

const BENEFITS = [
  { icon: CalendarDay, label: 'Projected pass date' },
  { icon: Clock, label: 'Number of days left to exam' },
  { icon: Bell, label: 'Daily task reminders' },
] as const

function CtaCard({
  ctaLabel,
  onAddCalendar,
}: {
  ctaLabel: string
  onAddCalendar: () => void
}) {
  return (
    <div style={ctaCardStyle}>
      <span aria-hidden style={ctaIconStyle}>
        <CalendarDay size={18} aria-hidden style={{ color: TEAL }} />
      </span>
      <h3 style={ctaTitleStyle}>Set up your study plan</h3>
      <ul style={benefitListStyle}>
        {BENEFITS.map((b) => (
          <li key={b.label} style={benefitItemStyle}>
            <span aria-hidden style={benefitIconStyle}>
              <b.icon size={11} aria-hidden style={{ color: TEAL }} />
            </span>
            <span style={benefitLabelStyle}>{b.label}</span>
          </li>
        ))}
      </ul>
      <button
        type="button"
        onClick={onAddCalendar}
        style={ctaButtonStyle}
        onMouseEnter={(e) => {
          ;(e.currentTarget as HTMLButtonElement).style.background = '#0c5a47'
        }}
        onMouseLeave={(e) => {
          ;(e.currentTarget as HTMLButtonElement).style.background = TEAL
        }}
      >
        {ctaLabel}
      </button>
    </div>
  )
}

const ctaCardStyle: CSSProperties = {
  width: 260,
  flexShrink: 0,
  background: 'var(--color-surface-card)',
  border: 'none',
  borderRadius: 12,
  padding: 20,
  display: 'flex',
  flexDirection: 'column',
  gap: 14,
}

const ctaIconStyle: CSSProperties = {
  width: 38,
  height: 38,
  borderRadius: 'var(--radius-pill)',
  background: TEAL_LIGHT,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
}

const ctaTitleStyle: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-body)',
  fontSize: 15,
  fontWeight: 500,
  color: 'var(--color-text-primary)',
  lineHeight: '20px',
}

const benefitListStyle: CSSProperties = {
  listStyle: 'none',
  margin: 0,
  padding: 0,
  display: 'flex',
  flexDirection: 'column',
  gap: 10,
}

const benefitItemStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
}

const benefitIconStyle: CSSProperties = {
  width: 22,
  height: 22,
  borderRadius: 'var(--radius-pill)',
  border: 'none',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
}

const benefitLabelStyle: CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontSize: 13,
  color: 'var(--color-text-secondary)',
  lineHeight: '18px',
}

const ctaButtonStyle: CSSProperties = {
  marginTop: 'auto',
  width: '100%',
  background: TEAL,
  color: '#fff',
  border: 'none',
  borderRadius: 8,
  padding: '12px 16px',
  fontFamily: 'var(--font-body)',
  fontSize: 13,
  fontWeight: 500,
  cursor: 'pointer',
  outline: 'none',
  transition: 'background 120ms ease',
}

/* Calendar preview (right) */

function CalendarPreview() {
  // Render the canonical demo "today" month so the preview lines up
  // with the rest of the app's deterministic snapshots.
  const today = parseIso(STUDY_CALENDAR_TODAY)
  const monthCells = monthGrid(today)
  const monthLabel = today.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  })
  return (
    <div style={previewWrapStyle}>
      <div style={previewCardStyle} aria-hidden="true">
        <header style={previewHeaderStyle}>
          <button type="button" tabIndex={-1} style={previewChevStyle}>
            <ChevronRight size={14} aria-hidden style={{ transform: 'rotate(180deg)' }} />
          </button>
          <div style={previewMonthLabelStyle}>{monthLabel}</div>
          <button type="button" tabIndex={-1} style={previewChevStyle}>
            <ChevronRight size={14} aria-hidden />
          </button>
          <span style={previewMetaStyle}>4 study days / week</span>
        </header>
        <div style={previewDowRowStyle}>
          {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((d) => (
            <span key={d} style={previewDowCellStyle}>
              {d}
            </span>
          ))}
        </div>
        <div style={previewGridStyle}>
          {monthCells.map((cell, i) => {
            if (!cell.inMonth) return <div key={i} aria-hidden style={previewEmptyCellStyle} />
            const isToday = sameDay(cell.date, today)
            const dow = cell.date.getDay()
            // Spec example: 4 study days / week — drop Sun + Sat + Wed
            // so Mon, Tue, Thu, Fri light up as study days.
            const isStudyDay = dow !== 0 && dow !== 6 && dow !== 3
            return (
              <div
                key={i}
                style={
                  isToday
                    ? previewTodayCellStyle
                    : isStudyDay
                      ? previewStudyCellStyle
                      : previewPlainCellStyle
                }
              >
                {cell.date.getDate()}
              </div>
            )
          })}
        </div>
      </div>
      <div style={lockOverlayStyle}>
        <Lock size={15} aria-hidden style={{ color: TEAL }} />
        <span style={lockTextStyle}>Create your study plan to unlock</span>
      </div>
    </div>
  )
}

function parseIso(iso: string): Date {
  const [y, m, d] = iso.split('-').map((p) => parseInt(p, 10))
  return new Date(y, m - 1, d)
}

function sameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

type Cell = { date: Date; inMonth: boolean }

function monthGrid(anchor: Date): Cell[] {
  const y = anchor.getFullYear()
  const m = anchor.getMonth()
  const firstOfMonth = new Date(y, m, 1)
  const startDow = firstOfMonth.getDay() // 0..6, Sun = 0
  const start = new Date(y, m, 1 - startDow)
  const cells: Cell[] = []
  for (let i = 0; i < 42; i += 1) {
    const d = new Date(start)
    d.setDate(start.getDate() + i)
    cells.push({ date: d, inMonth: d.getMonth() === m })
  }
  return cells
}

const previewWrapStyle: CSSProperties = {
  flex: 1,
  minWidth: 0,
  position: 'relative',
}

const previewCardStyle: CSSProperties = {
  opacity: 0.45,
  pointerEvents: 'none',
  background: 'var(--color-surface-card)',
  border: '0.5px solid var(--color-border-subtle)',
  borderRadius: 12,
  padding: 16,
  display: 'flex',
  flexDirection: 'column',
  gap: 10,
}

const previewHeaderStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'auto auto 1fr auto auto',
  alignItems: 'center',
  gap: 8,
}

const previewChevStyle: CSSProperties = {
  width: 24,
  height: 24,
  borderRadius: 'var(--radius-pill)',
  border: 'none',
  background: 'transparent',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: 'var(--color-text-secondary)',
  cursor: 'default',
}

const previewMonthLabelStyle: CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontWeight: 600,
  fontSize: 14,
  color: 'var(--color-text-primary)',
  textAlign: 'left',
  marginLeft: 4,
}

const previewMetaStyle: CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontSize: 12,
  color: 'var(--color-text-secondary)',
  gridColumn: 5,
  justifySelf: 'end',
  whiteSpace: 'nowrap',
}

const previewDowRowStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(7, 1fr)',
  gap: 4,
}

const previewDowCellStyle: CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontSize: 11,
  fontWeight: 600,
  letterSpacing: '0.04em',
  textTransform: 'uppercase',
  color: 'var(--color-text-secondary)',
  textAlign: 'center',
  padding: '2px 0',
}

const previewGridStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(7, 1fr)',
  gap: 4,
}

const baseCellStyle: CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontSize: 12,
  height: 30,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: 8,
}

const previewEmptyCellStyle: CSSProperties = {
  ...baseCellStyle,
  visibility: 'hidden',
}

const previewPlainCellStyle: CSSProperties = {
  ...baseCellStyle,
  color: 'var(--color-text-secondary)',
}

const previewStudyCellStyle: CSSProperties = {
  ...baseCellStyle,
  background: STUDY_FILL,
  color: STUDY_TEXT,
  fontWeight: 500,
}

const previewTodayCellStyle: CSSProperties = {
  ...baseCellStyle,
  background: TEAL,
  color: '#fff',
  fontWeight: 500,
}

const lockOverlayStyle: CSSProperties = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  zIndex: 2,
  display: 'inline-flex',
  alignItems: 'center',
  gap: 8,
  background: 'var(--color-surface-card)',
  border: '0.5px solid var(--color-border-subtle)',
  borderRadius: 12,
  padding: '10px 14px',
  boxShadow: '0 4px 12px rgb(0 0 0 / 0.08)',
}

const lockTextStyle: CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontSize: 13,
  color: 'var(--color-text-secondary)',
}
