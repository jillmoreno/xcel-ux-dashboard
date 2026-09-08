import type { CSSProperties } from 'react'
import { CalendarDay } from '@/icons'
import type { ProjectedCompletion } from './CreateCalendarModal/useProjectedCompletion'

type Props = {
  /** Only rendered when `result.state === 'filled'`. The parent (the
   *  Create / Edit Calendar panel) handles hiding the chip while
   *  pristine. */
  result: Extract<ProjectedCompletion, { state: 'filled' }>
  /** Layout variant.
   *  - `'chip'` (default) — compact horizontal chip with a 52px
   *    mini-calendar + single-line date + meta line. Used by
   *    CreateCalendarPanel.
   *  - `'prominent'` — larger 86px calendar block + weekday-prefixed
   *    date + exam/plan sub-line + a three-item bullet list (Study
   *    days, Buffer days, Days / Week). Used by the Edit Calendar
   *    panel where the projected completion is the headline result
   *    of the form. */
  variant?: 'chip' | 'prominent'
  /** Prominent variant only — short exam name (e.g. "Series 79 Exam"). */
  examName?: string
  /** Prominent variant only — plan length label (e.g. "15-day plan"). */
  planLengthLabel?: string
  /** Prominent variant only — number of study days per week (e.g. 5
   *  for Mon–Fri). Drives the third bullet ("Days / Week: N") below
   *  the sub-line. */
  daysPerWeek?: number
}

const MONTHS_ABBR = [
  'JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC',
]

const MONTHS_FULL_UPPER = [
  'JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE',
  'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER',
]

const MONTHS_FULL_TITLE = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

const WEEKDAYS_FULL = [
  'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday',
]

/**
 * Projected-completion readout for the Create / Edit Calendar panels.
 *
 * Two variants:
 *   - `'chip'` (Variation D): compact horizontal chip with a small
 *     mini-calendar, full date, and a single meta line. Used by the
 *     Create Calendar panel.
 *   - `'prominent'` (Variation C): larger calendar block on the left,
 *     "Weekday, Month Day" headline, exam-plan sub-line, and two
 *     stat tiles. Used by the Edit Calendar panel.
 *
 * Both variants share the same label ("Projected Completion Date")
 * above the visual.
 *
 * Color values for the chip variant come from the design spec rather
 * than brand tokens (light-blue tint, mid-navy #1A3A6E); these are
 * hardcoded by intent so the chip reads consistently across brands.
 */
export function ProjectedCompletionCard({
  result,
  variant = 'chip',
  examName,
  planLengthLabel,
  daysPerWeek,
}: Props) {
  // Prominent variant gets a light-tertiary-tinted wrapper so the
  // projection card sits as its own visual block in the Edit Study
  // Calendar panel — easier to spot at a glance than when it floats
  // on the panel's white surface. Chip variant keeps its existing
  // self-contained tint (TINT_BG inside the chip body) so it stays
  // visually consistent inside CreateCalendarPanel.
  const isProminent = variant === 'prominent'
  return (
    <div
      role="status"
      aria-live="polite"
      style={isProminent ? prominentSectionStyle : undefined}
    >
      <div style={labelStyle}>Projected Completion Date</div>
      {isProminent ? (
        <ProminentBody
          result={result}
          examName={examName}
          planLengthLabel={planLengthLabel}
          daysPerWeek={daysPerWeek}
        />
      ) : (
        <ChipBody result={result} />
      )}
    </div>
  )
}

/* ─── Variant: chip (Variation D) ─────────────────────────────────── */

function ChipBody({ result }: { result: Props['result'] }) {
  const month = MONTHS_ABBR[result.date.getMonth()]
  const day = result.date.getDate()
  const year = result.date.getFullYear()
  return (
    <div style={chipStyle}>
      <MiniCalendar month={month} day={day} year={year} />
      <div style={textBlockStyle}>
        <div style={dateLineStyle}>{result.formattedDate}</div>
        <div style={metaLineStyle}>
          {result.daysFromStart} days · {result.bufferDaysIncluded} buffer day
          {result.bufferDaysIncluded === 1 ? '' : 's'} included
        </div>
      </div>
      <span aria-hidden style={iconWrapStyle}>
        <CalendarDay size={22} aria-hidden />
      </span>
    </div>
  )
}

function MiniCalendar({
  month,
  day,
  year,
}: {
  month: string
  day: number
  year: number
}) {
  return (
    <div style={miniCalWrapStyle}>
      <div style={miniHeaderStyle}>{month}</div>
      <div style={miniBodyStyle}>
        <div style={miniDayStyle}>{day}</div>
        <div style={miniYearStyle}>{year}</div>
      </div>
    </div>
  )
}

/* ─── Variant: prominent (Variation C) ────────────────────────────── */

function ProminentBody({
  result,
  examName,
  planLengthLabel,
  daysPerWeek,
}: {
  result: Props['result']
  examName?: string
  planLengthLabel?: string
  daysPerWeek?: number
}) {
  const d = result.date
  const monthUpper = MONTHS_FULL_UPPER[d.getMonth()]
  const monthTitle = MONTHS_FULL_TITLE[d.getMonth()]
  const weekday = WEEKDAYS_FULL[d.getDay()]
  const day = d.getDate()
  const year = d.getFullYear()
  // e.g. "Series 79 Exam · 15-day plan" — only render the sub-line
  // when both pieces are provided; otherwise drop it cleanly.
  const subLine =
    examName && planLengthLabel ? `${examName} · ${planLengthLabel}` : null

  return (
    <div style={prominentWrapStyle}>
      <LargeCalendar month={monthUpper} day={day} year={year} />
      <div style={prominentRightStyle}>
        <div style={prominentDateLineStyle}>{`${weekday}, ${monthTitle} ${day}`}</div>
        {subLine && <div style={prominentSubLineStyle}>{subLine}</div>}
        {/* Bulleted summary — replaces the previous neutral stat
            tiles. Renders as a standard disc-marker list anchored
            below the sub-line so the entire projection (date +
            context + facts) reads as one continuous block. The
            Days / Week bullet only appears when the caller provides
            the count. The NYSE holidays bullet only appears when at
            least one holiday falls in the projected window AND the
            learner has the Exclude NYSE Holidays toggle on — so a
            quiet window or an opted-out window drops the row
            cleanly rather than printing "0". */}
        <ul style={bulletListStyle}>
          <li style={bulletItemStyle}>
            <span style={bulletLabelStyle}>Study days:</span>{' '}
            {result.daysFromStart}
          </li>
          <li style={bulletItemStyle}>
            <span style={bulletLabelStyle}>Buffer days:</span>{' '}
            {result.bufferDaysIncluded}
          </li>
          {typeof daysPerWeek === 'number' && (
            <li style={bulletItemStyle}>
              <span style={bulletLabelStyle}>Days / Week:</span> {daysPerWeek}
            </li>
          )}
          {result.nyseHolidaysExcluded > 0 && (
            <li style={bulletItemStyle}>
              <span style={bulletLabelStyle}>NYSE holidays excluded:</span>{' '}
              {result.nyseHolidaysExcluded}
            </li>
          )}
        </ul>
      </div>
    </div>
  )
}

function LargeCalendar({
  month,
  day,
  year,
}: {
  month: string
  day: number
  year: number
}) {
  return (
    <div style={largeCalWrapStyle}>
      <div style={largeHeaderStyle}>{month}</div>
      <div style={largeBodyStyle}>
        <div style={largeDayStyle}>{day}</div>
        <div style={largeYearStyle}>{year}</div>
      </div>
    </div>
  )
}

/* ─── Spec colors (intentionally not tokenized) ──────────────────── */
const TINT_BG = '#EEF3FB'
const TINT_BORDER = '#C6D4EC'
const NAVY = '#1A3A6E'
const META = '#4A6FA5'

/* ─── Shared label ───────────────────────────────────────────────── */

const labelStyle: CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontWeight: 700,
  fontSize: 13,
  color: 'var(--color-text-primary)',
  marginBottom: 8,
}

/* ─── Chip styles ────────────────────────────────────────────────── */

const chipStyle: CSSProperties = {
  background: TINT_BG,
  border: `0.5px solid ${TINT_BORDER}`,
  borderRadius: 10,
  padding: '12px 14px',
  display: 'flex',
  alignItems: 'center',
  gap: 12,
}

const miniCalWrapStyle: CSSProperties = {
  width: 52,
  flexShrink: 0,
  border: `1.5px solid ${NAVY}`,
  borderRadius: 6,
  overflow: 'hidden',
  background: '#fff',
}

const miniHeaderStyle: CSSProperties = {
  background: NAVY,
  color: '#fff',
  textAlign: 'center',
  fontFamily: 'var(--font-body)',
  fontSize: 9,
  fontWeight: 600,
  letterSpacing: '0.06em',
  lineHeight: '14px',
}

const miniBodyStyle: CSSProperties = {
  background: '#fff',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
}

const miniDayStyle: CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontSize: 22,
  fontWeight: 700,
  color: NAVY,
  lineHeight: 1,
  padding: '3px 0 1px',
}

const miniYearStyle: CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontSize: 9,
  color: NAVY,
  paddingBottom: 4,
}

const textBlockStyle: CSSProperties = {
  flex: 1,
  minWidth: 0,
  display: 'flex',
  flexDirection: 'column',
}

const dateLineStyle: CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontSize: 14,
  fontWeight: 500,
  color: NAVY,
  lineHeight: '18px',
}

const metaLineStyle: CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontSize: 12,
  color: META,
  marginTop: 2,
  lineHeight: '16px',
}

const iconWrapStyle: CSSProperties = {
  flexShrink: 0,
  color: NAVY,
  opacity: 0.4,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
}

/* ─── Prominent styles ───────────────────────────────────────────── */

// Outer wrapper applied by the prominent variant. Faint tertiary
// tint + padding lifts the entire projection block (label + date +
// bullets) off the panel's white surface. We dilute `--color-tertiary-100`
// 35:65 with white via `color-mix` so the tint stays detectable
// without competing with the form fields above. Each brand's tertiary
// ramp resolves automatically — no per-brand override needed.
const prominentSectionStyle: CSSProperties = {
  background:
    'color-mix(in srgb, var(--color-tertiary-100) 35%, var(--color-surface-card))',
  borderRadius: 'var(--radius-md)',
  padding: '16px 18px',
}

const prominentWrapStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'flex-start',
  gap: 16,
}

const largeCalWrapStyle: CSSProperties = {
  width: 86,
  flexShrink: 0,
  border: `1.5px solid ${NAVY}`,
  borderRadius: 8,
  overflow: 'hidden',
  background: '#fff',
}

const largeHeaderStyle: CSSProperties = {
  background: NAVY,
  color: '#fff',
  textAlign: 'center',
  fontFamily: 'var(--font-body)',
  fontSize: 11,
  fontWeight: 600,
  letterSpacing: '0.06em',
  lineHeight: '18px',
}

const largeBodyStyle: CSSProperties = {
  background: '#fff',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
}

const largeDayStyle: CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontSize: 40,
  fontWeight: 700,
  color: NAVY,
  lineHeight: 1,
  padding: '6px 0 0',
}

const largeYearStyle: CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontSize: 11,
  color: NAVY,
  paddingBottom: 7,
  marginTop: 2,
}

const prominentRightStyle: CSSProperties = {
  flex: 1,
  minWidth: 0,
  paddingTop: 2,
}

const prominentDateLineStyle: CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontSize: 15,
  fontWeight: 500,
  color: 'var(--color-text-primary)',
  marginBottom: 3,
}

const prominentSubLineStyle: CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontSize: 12,
  color: 'var(--color-text-secondary)',
  marginBottom: 12,
}

// Bullet list anchored below the sub-line. Standard disc markers
// (browser default) so the list reads as a quick facts summary
// rather than another colored UI surface like the previous stat
// tiles. `padding-left: 18` reserves room for the disc marker
// without indenting the bullets too far from the date headline.
const bulletListStyle: CSSProperties = {
  margin: 0,
  paddingLeft: 18,
  listStyle: 'disc',
  display: 'flex',
  flexDirection: 'column',
  gap: 4,
}

const bulletItemStyle: CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontSize: 13,
  lineHeight: '20px',
  color: 'var(--color-text-primary)',
}

const bulletLabelStyle: CSSProperties = {
  fontWeight: 600,
}
