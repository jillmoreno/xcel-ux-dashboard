import { useMemo, useState, type CSSProperties } from 'react'
import { AngleLeftRegular, AngleRightRegular } from '@/icons'
import { COMPASS_BUTTON } from './compassButton'
import { monthGrid, sameDay, startOfDay } from './examCalendarUtil'

/**
 * THE EXAM CALENDAR, ON ITS OWN — extracted 2026-10-20 from
 * `AtlasExamDateCard`, which is where it was designed (Figma
 * "Atlas-UX-Design" 224:4118, "Set Exam Date", Eric's request 2026-10-07:
 * "make the calendar functional").
 *
 * ⚠ WHY IT MOVED. Jillienne asked for this calendar inside the Atlas Home's
 * exam prompt — "jill atlass version should be this version of the exam date
 * set on default". There were already TWO month grids in the product (this one
 * and `ExamScheduleWidget`'s `ExamDatePicker`); a third, typed into the Home,
 * is how two surfaces come to disagree about how a date is picked. So the grid
 * moved out of the card rather than being copied into another one, and the
 * card now renders it.
 *
 * ⚠ `today` IS A PROP NOW, AND IT DEFAULTS TO THE WALL CLOCK. That default is
 * the behaviour `AtlasExamDateCard` had and still has — it passes nothing, so
 * nothing about Eric's versions changes. The Atlas Home passes the DEMO clock
 * (`FIXTURE_TODAY`, 2026-05-11), which is the point of the prop: every dated
 * surface on that page is anchored to the fixture, and a calendar opening on
 * the real month put a November exam against a May pace model. The symptom was
 * visible in the mock this was built from — the same date reading "29 Days" in
 * one place and "18 days" in another, and a pace card that did not move at
 * all. One clock per page, or the figures cannot agree by arithmetic.
 *
 * PRESENTATIONAL. It holds the month in view and the day under the cursor, and
 * nothing else: no stored date, no stages. The caller owns the answer.
 */
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S']



export function AtlasExamCalendar({
  initialDate = null,
  today: todayProp,
  saveLabel = 'Set Exam Date',
  onCancel,
  onSave,
  onRemove,
}: {
  /** The date to open on and show selected. Null opens on `today`'s month. */
  initialDate?: Date | null
  /** ⚠ THE PAGE'S CLOCK. Omit and it is the wall clock, which is what
   *  `AtlasExamDateCard` has always used — see the file note. */
  today?: Date
  saveLabel?: string
  onCancel: () => void
  onSave: (date: Date) => void
  /**
   * Clear the date entirely — drawn as a red link at the FAR LEFT of the
   * footer, opposite Cancel and Set Exam Date (2026-10-20, Jillienne: "move
   * 'remove' to the left side of this line, make it a red link cta").
   *
   * ⚠ OPTIONAL, AND ABSENT IS THE DEFAULT, which is what keeps this component
   * shared. `AtlasExamDateCard` passes nothing, so Eric's card's footer is the
   * pair it has always been. The Atlas Home passes it only when a date already
   * exists — there is nothing to remove while one is being set for the first
   * time, and a destructive control that does nothing is worse than no control.
   */
  onRemove?: () => void
}) {
  const today = useMemo(() => startOfDay(todayProp ?? new Date()), [todayProp])
  const anchor = initialDate ?? today
  const [view, setView] = useState({ year: anchor.getFullYear(), month: anchor.getMonth() })
  const [picked, setPicked] = useState<Date | null>(initialDate)
  /* No stepping back past the month the clock is in — every day there is
     already disabled, so the arrow would lead somewhere with nothing to pick. */
  const atTodaysMonth = view.year === today.getFullYear() && view.month === today.getMonth()

  const stepMonth = (dir: -1 | 1) =>
    setView((v) => {
      const d = new Date(v.year, v.month + dir, 1)
      return { year: d.getFullYear(), month: d.getMonth() }
    })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, height: 26 }}>
        <button
          type="button"
          aria-label="Previous month"
          className="cre-atlas-cal-step"
          onClick={() => stepMonth(-1)}
          disabled={atTodaysMonth}
          style={STEP}
        >
          <AngleLeftRegular size={12} aria-hidden />
        </button>
        <p aria-live="polite" style={MONTH}>
          {MONTHS[view.month]} {view.year}
        </p>
        <button type="button" aria-label="Next month" className="cre-atlas-cal-step" onClick={() => stepMonth(1)} style={STEP}>
          <AngleRightRegular size={12} aria-hidden />
        </button>
      </div>
      <div role="grid" aria-label={`${MONTHS[view.month]} ${view.year}`} style={GRID}>
        {WEEKDAYS.map((d, i) => (
          <span key={`w${i}`} role="columnheader" style={WEEKDAY}>
            {d}
          </span>
        ))}
        {monthGrid(view.year, view.month).map(({ date, inMonth }) => {
          const past = date < today
          const selectable = inMonth && !past
          const isPicked = picked != null && sameDay(date, picked)
          const isToday = sameDay(date, today)
          return (
            <button
              key={date.toISOString()}
              type="button"
              role="gridcell"
              aria-selected={isPicked}
              aria-label={date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
              disabled={!selectable}
              className={selectable ? 'cre-atlas-cal-day' : undefined}
              onClick={() => setPicked(date)}
              style={{
                ...DAY,
                ...(selectable ? null : DAY_OFF),
                ...(isToday && !isPicked ? DAY_TODAY : null),
                ...(isPicked ? DAY_PICKED : null),
              }}
            >
              {date.getDate()}
            </button>
          )
        })}
      </div>
      {/* ⚠ `space-between` ONLY WHEN THERE IS SOMETHING ON THE LEFT. With no
          Remove the row must stay `flex-end`, or Cancel drifts to the far side
          on Eric's card and the pair stops reading as a pair. */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: onRemove ? 'space-between' : 'flex-end',
          gap: 16,
        }}
      >
        {onRemove ? (
          <button type="button" style={REMOVE_LINK} onClick={onRemove}>
            Remove
          </button>
        ) : null}
        {/* The pair keeps its own 16 against each other when Remove pushes
            them right — the row's gap only separates the two groups. */}
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 16 }}>
        <button type="button" className="cre-compass-v2-link" style={TEXT_LINK} onClick={onCancel}>
          Cancel
        </button>
        <button
          type="button"
          className="cre-compass-primary cre-compass-btn-primary"
          style={{ ...BUTTON, padding: '5px 16px', ...(picked ? null : BUTTON_OFF) }}
          disabled={!picked}
          onClick={() => picked && onSave(picked)}
        >
          {saveLabel}
        </button>
        </span>
      </div>
    </div>
  )
}

const TEXT_LINK: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 4,
  padding: 0,
  border: 'none',
  background: 'none',
  cursor: 'pointer',
  fontFamily: 'var(--font-body)',
  fontWeight: 700,
  fontSize: 11,
  lineHeight: '19.5px',
  color: 'var(--color-compass-page-button)',
  whiteSpace: 'nowrap',
}
const BUTTON: CSSProperties = {
  ...COMPASS_BUTTON,
  flex: 'none',
  minHeight: 0,
  fontSize: 13.5,
  lineHeight: '20.25px',
}
const BUTTON_OFF: CSSProperties = { opacity: 0.45, cursor: 'not-allowed' }
const STEP: CSSProperties = {
  flex: 'none',
  width: 23,
  height: 26,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 0,
  border: 'none',
  borderRadius: 8,
  background: 'var(--color-atlas-outlined-card, var(--color-compass-page-card))',
  color: 'var(--color-text-secondary)',
  cursor: 'pointer',
}
const MONTH: CSSProperties = {
  flex: '1 1 0',
  margin: 0,
  textAlign: 'center',
  fontFamily: 'var(--font-body)',
  fontSize: 12,
  lineHeight: '14px',
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
  color: 'var(--color-text-secondary)',
}
const GRID: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(7, 1fr)',
  gap: '6px 4px',
  justifyItems: 'center',
}
const WEEKDAY: CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontSize: 10,
  lineHeight: '20px',
  color: 'var(--color-atlas-cal-ink, var(--color-compass-page-button))',
}
const DAY: CSSProperties = {
  width: 24,
  height: 24,
  padding: 0,
  border: 'none',
  borderRadius: 8,
  background: 'transparent',
  fontFamily: 'var(--font-body)',
  fontWeight: 600,
  fontSize: 10,
  lineHeight: '24px',
  color: 'var(--color-atlas-cal-ink, var(--color-compass-page-button))',
  cursor: 'pointer',
}
/* Past days and the neighbouring months' — the design's faint #C3BBA5. */
const DAY_OFF: CSSProperties = {
  color: 'var(--color-neutral-500)',
  cursor: 'default',
}
const DAY_TODAY: CSSProperties = {
  boxShadow: 'inset 0 0 0 1px var(--color-atlas-cal-ink, var(--color-compass-page-button))',
}
const DAY_PICKED: CSSProperties = {
  background: 'var(--color-atlas-cal-ink, var(--color-compass-page-button))',
  color: '#ffffff',
  fontWeight: 700,
}

/* ⚠ A LINK, NOT A BUTTON, AND NOT `cre-compass-v2-link` — 2026-10-20. It wears
   Cancel's shape (11/700, no ground, no border) so the footer reads as one
   row, but it cannot take that class: the class carries the brand's button
   colour, which is the whole point of the class and the opposite of what a
   destructive control should say. `--color-error-600` is the token the status
   text uses, dark enough to pass against the card's white ground where
   `error-500` does not. */
const REMOVE_LINK: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 4,
  padding: 0,
  border: 'none',
  background: 'none',
  cursor: 'pointer',
  fontFamily: 'var(--font-body)',
  fontWeight: 700,
  fontSize: 11,
  lineHeight: '19.5px',
  color: 'var(--color-error-600)',
  whiteSpace: 'nowrap',
}
