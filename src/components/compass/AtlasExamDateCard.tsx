import { useMemo, useState, type CSSProperties } from 'react'
import {
  AngleLeftRegular,
  AngleRightRegular,
  AngleRightSolid,
  CalendarThin,
  HourglassClockThin,
  PenToSquareSolid,
} from '@/icons'
import { COMPASS_BUTTON } from './compassButton'

/**
 * THE EXAM-DATE CARD — Figma "Atlas-UX-Design" component 224:4118, "Set Exam
 * Date", 2026-10-07 (Eric's request: "add the functionality represented in the
 * figma component … make the calendar functional"). Four states, one card:
 *
 *   DEFAULT  "Do you know your state exam date?"  ·  Not Yet ›  ·  Yes
 *   NO       "No state exam date yet? That's okay." · I have my exam date ›
 *   YES      "When is your {state} state exam?" — a month calendar, Cancel and
 *            Set Exam Date. The calendar opens on TODAY's month and year;
 *            Set Exam Date stays disabled until a day is picked.
 *   SET      "Your state exam date:" — the date, the days left, and Edit.
 *
 * Not Yet → NO; Yes and "I have my exam date" → YES; Cancel → back to where the
 * learner came from; Set Exam Date → SET; Edit → YES with the date kept.
 *
 * ⚠ LOCAL STATE ONLY. The date lives in this card for the session — nothing
 * downstream (the pace model, the Study Journey) reads it yet. Wiring it to
 * `examDate` is the next step if the flow is kept.
 *
 * ⚠ PAST DAYS ARE NOT PICKABLE — an exam already sat is not a date to plan
 * toward — and neither are the neighbouring months' days at the grid's edges
 * (step a month for those). Today is ringed.
 *
 * Colours are the COMPASS palette on every brand (2026-10-07) — EXCEPT the
 * buttons and text links, which keep the brand's button colour. The card sets
 * the Global values on itself (`.cre-atlas-compass-palette`): the calendar's
 * days and letters (`--color-atlas-cal-ink`, steel), the tiles and the
 * hairline.
 */
type Stage = 'default' | 'no' | 'yes' | 'set'

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S']
const DAY_MS = 24 * 60 * 60 * 1000

/** The date tile is 70 wide: "June 5" as designed, but a long month shortened
 *  ("Sept. 30", "Dec. 12") so the date holds one line. */
function shortMonth(m: number): string {
  const name = MONTHS[m]
  return name.length <= 5 ? name : `${name.slice(0, m === 8 ? 4 : 3)}.`
}

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate())
}
function sameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

/** The month's grid: whole weeks, Sunday first, padded with the neighbouring
 *  months' days — 5 or 6 rows as the month needs. */
function monthGrid(year: number, month: number): { date: Date; inMonth: boolean }[] {
  const first = new Date(year, month, 1)
  const start = new Date(year, month, 1 - first.getDay())
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const cells = Math.ceil((first.getDay() + daysInMonth) / 7) * 7
  return Array.from({ length: cells }, (_, i) => {
    const date = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i)
    return { date, inMonth: date.getMonth() === month }
  })
}

export function AtlasExamDateCard({ stateName = 'New York', style }: { stateName?: string; style?: CSSProperties }) {
  const today = useMemo(() => startOfDay(new Date()), [])
  const [stage, setStage] = useState<Stage>('default')
  const [cameFrom, setCameFrom] = useState<Stage>('default')
  const [view, setView] = useState({ year: today.getFullYear(), month: today.getMonth() })
  const [picked, setPicked] = useState<Date | null>(null)
  const [examDate, setExamDate] = useState<Date | null>(null)

  const openCalendar = (from: Stage) => {
    setCameFrom(from)
    // Open on the saved date's month when editing, else on today's.
    const anchor = examDate ?? today
    setView({ year: anchor.getFullYear(), month: anchor.getMonth() })
    setPicked(examDate)
    setStage('yes')
  }
  const stepMonth = (dir: -1 | 1) =>
    setView((v) => {
      const d = new Date(v.year, v.month + dir, 1)
      return { year: d.getFullYear(), month: d.getMonth() }
    })
  // No stepping back past today's month — every day there would be past.
  const atTodaysMonth = view.year === today.getFullYear() && view.month === today.getMonth()
  const daysLeft = examDate ? Math.round((examDate.getTime() - today.getTime()) / DAY_MS) : 0

  return (
    // `cre-atlas-compass-palette`: the card's contents in the COMPASS colours
    // on every brand (2026-10-07, Eric's request) — see tokens.css.
    <section aria-label="Your state exam date" className="cre-atlas-compass-palette" style={{ ...CARD, ...style }}>
      {stage === 'default' ? (
        <>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <p style={TITLE}>Do you know your state exam date?</p>
            <p style={COPY}>Adding your state exam date we can help you plan and pass your course easier.</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 16 }}>
            <button type="button" className="cre-compass-v2-link" style={TEXT_LINK} onClick={() => setStage('no')}>
              Not Yet
              <AngleRightSolid size={11} aria-hidden />
            </button>
            <button
              type="button"
              className="cre-compass-primary cre-compass-btn-primary"
              style={{ ...BUTTON, padding: '5px 24px' }}
              onClick={() => openCalendar('default')}
            >
              Yes
            </button>
          </div>
        </>
      ) : null}

      {stage === 'no' ? (
        <>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <p style={TITLE}>No state exam date yet? That’s okay.</p>
            {/* "here" is bold, as designed — NOT A LINK YET: the registration
                destination has not been chosen. */}
            <p style={COPY}>
              You can register for your exam <strong style={{ fontWeight: 700 }}>here</strong>. Once you have a date, add it
              here so we can help you plan your study time and stay on track.
            </p>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button type="button" className="cre-compass-v2-link" style={TEXT_LINK} onClick={() => openCalendar('no')}>
              I have my exam date
              <AngleRightSolid size={11} aria-hidden />
            </button>
          </div>
        </>
      ) : null}

      {stage === 'yes' ? (
        <>
          <p style={TITLE}>When is your {stateName} state exam?</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {/* Month picker */}
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
            {/* Weekday letters, then the days */}
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
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 16 }}>
            <button type="button" className="cre-compass-v2-link" style={TEXT_LINK} onClick={() => setStage(examDate ? 'set' : cameFrom)}>
              Cancel
            </button>
            <button
              type="button"
              className="cre-compass-primary cre-compass-btn-primary"
              style={{ ...BUTTON, padding: '5px 16px', ...(picked ? null : BUTTON_OFF) }}
              disabled={!picked}
              onClick={() => {
                if (!picked) return
                setExamDate(picked)
                setStage('set')
              }}
            >
              Set Exam Date
            </button>
          </div>
        </>
      ) : null}

      {stage === 'set' && examDate ? (
        <>
          <p style={TITLE}>Your state exam date:</p>
          <div style={{ display: 'flex', gap: 8, alignItems: 'stretch' }}>
            <div style={DATE_TILE}>
              <CalendarThin size={38} aria-hidden />
              <p style={{ margin: 0, fontFamily: 'var(--font-body)', fontSize: 11, lineHeight: '16px', textAlign: 'center', color: 'var(--color-text-primary)' }}>
                <strong style={{ fontWeight: 700, display: 'block' }}>
                  {shortMonth(examDate.getMonth())} {examDate.getDate()}
                </strong>
                {examDate.getFullYear()}
              </p>
            </div>
            <div style={DAYS_TILE}>
              <HourglassClockThin size={35} aria-hidden />
              <p style={{ margin: 0, fontFamily: 'var(--font-body)', fontSize: 11, lineHeight: '12px', textAlign: 'center', color: 'var(--color-text-primary)' }}>
                <strong style={{ fontWeight: 700 }}>
                  {daysLeft === 0 ? 'Today' : `${daysLeft} ${daysLeft === 1 ? 'day' : 'days'}`}
                </strong>{' '}
                {daysLeft === 0 ? 'is your state exam' : 'until your state exam'}
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button type="button" className="cre-compass-v2-link" style={{ ...TEXT_LINK, lineHeight: '13px' }} onClick={() => openCalendar('set')}>
              <PenToSquareSolid size={11} aria-hidden />
              Edit
            </button>
          </div>
        </>
      ) : null}
    </section>
  )
}

/* ── Styles ─────────────────────────────────────────────────────────────── */

const CARD: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 16,
  padding: 24,
  boxSizing: 'border-box',
  borderRadius: 12,
  border: '1px solid var(--color-atlas-nav-rule)',
}
/* Serif H8, the side cards' heading. */
const TITLE: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-heading-serif)',
  fontWeight: 400,
  fontSize: 'var(--type-atlas-h8-base-size, 20px)',
  lineHeight: 'var(--type-atlas-h8-base-line, 24px)',
  letterSpacing: '-0.01em',
  color: 'var(--color-text-primary)',
}
/* 11 / 15 in the secondary grey (5.3:1 on the page; the design's #616161). */
const COPY: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-body)',
  fontSize: 11,
  lineHeight: '15px',
  color: 'var(--color-text-secondary)',
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
const TILE: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: 4,
  padding: 8,
  borderRadius: 8,
  color: 'var(--color-text-secondary)',
}
const DATE_TILE: CSSProperties = {
  ...TILE,
  width: 70,
  flex: 'none',
  boxSizing: 'border-box',
  background: 'var(--color-atlas-outlined-card, var(--color-compass-page-card))',
}
const DAYS_TILE: CSSProperties = {
  ...TILE,
  flex: '1 1 0',
  minWidth: 0,
  gap: 8,
  background: 'var(--color-primary-100)',
}
