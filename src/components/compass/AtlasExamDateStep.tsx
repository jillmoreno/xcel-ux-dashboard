import { useMemo, useState, type CSSProperties } from 'react'
import {
  AngleLeftRegular,
  AngleRightRegular,
  AngleRightSolid,
  CalendarThin,
  HourglassClockThin,
  PenToSquareSolid,
} from '@/icons'

/**
 * SET EXAM DATE — Figma "Atlas UX Design" 466:856, 2026-10-19 (Eric's
 * request: "add the attached with its states right below Pass State Exam in
 * the steps"). Step 2's panel on Eric's End-to-End Demo Home, in place of the
 * pill that stood above the steps and of the step's "150 scored…" line.
 *
 * FOUR STATES, and they are walked, not just drawn:
 *
 *   Default   "Do you know your state exam date?" — Yes, Not Yet.
 *   No        "No state exam date yet? That's okay." — I have my exam date ›
 *   Yes       "When is your <State> state exam?" — a month calendar, Cancel,
 *             Set Exam Date (off until a day is picked).
 *   Date Set  "Your state exam date:" — the date, and the days until it,
 *             from the demo's today; Edit reopens the calendar on that date.
 *
 * Cancel goes back to where Yes was pressed from (Default or No), or to Date
 * Set when editing. Days before today (the real one) and outside the month are muted and
 * cannot be picked. Nothing is stored: a reload starts at Default.
 *
 * Departures: the state is the demo's, not the design's "New York"; "here"
 * in the No state is bold text, as drawn, not a link — there is nowhere for
 * it to go yet.
 */
type Stage = 'default' | 'no' | 'yes' | 'set'

const DAY = 24 * 60 * 60 * 1000
const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'] as const

function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate())
}

export function AtlasExamDateStep({ stateName }: { stateName: string }) {
  /* THE REAL TODAY, not the demo's fixture date (2026-10-19, Eric's request:
     "make the calendar reflect the current date"). The calendar opens on this
     month, earlier days are greyed, and Date Set counts the days from it. */
  const todayStart = useMemo(() => startOfDay(new Date()), [])
  const [stage, setStage] = useState<Stage>('default')
  // Where Cancel returns to from the calendar.
  const [cameFrom, setCameFrom] = useState<Stage>('default')
  const [examDate, setExamDate] = useState<Date | null>(null)
  const [picked, setPicked] = useState<Date | null>(null)
  const [view, setView] = useState(() => new Date(todayStart.getFullYear(), todayStart.getMonth(), 1))

  const openCalendar = (from: Stage) => {
    setCameFrom(from)
    setPicked(examDate)
    const anchor = examDate ?? todayStart
    setView(new Date(anchor.getFullYear(), anchor.getMonth(), 1))
    setStage('yes')
  }

  if (stage === 'default') {
    return (
      /* The buttons 8 further right: 16 to the panel's edge, not 24, and 8
         more beside the copy — 20, not 12 (2026-10-19, Eric's request). */
      <div style={{ ...PANEL_DEFAULT, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 20, paddingRight: 16 }}>
        {/* No 181 cap (the design's): the question on ONE line, the step
            column widened to hold it (2026-10-19, Eric's request). */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0 }}>
          <p style={{ ...HEADLINE, whiteSpace: 'nowrap' }}>Do you know your state exam date?</p>
          <p style={SMALL}>Using your state exam date, can help you plan and pass your course easier.</p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, flex: 'none' }}>
          <button type="button" onClick={() => openCalendar('default')} style={{ ...PRIMARY, padding: '5px 24px' }}>
            Yes
          </button>
          <button type="button" onClick={() => setStage('no')} style={TEXT_LINK}>
            Not Yet
            <AngleRightSolid size={11} aria-hidden style={{ width: 6 }} />
          </button>
        </div>
      </div>
    )
  }

  if (stage === 'no') {
    return (
      <div style={PANEL}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <p style={HEADLINE}>No state exam date yet? That’s okay.</p>
          <p style={SMALL}>
            You can register for your exam <strong style={{ fontWeight: 700 }}>here</strong>. Once you have a date,
            add it here so we can help you plan your study time and stay on track.
          </p>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button type="button" onClick={() => openCalendar('no')} style={{ ...TEXT_LINK, lineHeight: '19.5px' }}>
            I have my exam date
            <AngleRightSolid size={11} aria-hidden style={{ width: 6 }} />
          </button>
        </div>
      </div>
    )
  }

  if (stage === 'yes') {
    const year = view.getFullYear()
    const month = view.getMonth()
    const first = new Date(year, month, 1)
    const gridStart = new Date(year, month, 1 - first.getDay())
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const cells = Math.ceil((first.getDay() + daysInMonth) / 7) * 7
    const days = Array.from({ length: cells }, (_, i) => new Date(gridStart.getFullYear(), gridStart.getMonth(), gridStart.getDate() + i))
    const monthLabel = view.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    const canGoBack = view > new Date(todayStart.getFullYear(), todayStart.getMonth(), 1)
    return (
      /* Fitted to the compact calendar — its 223 plus the 24 inset and edge,
         273 — rather than the step's full width (2026-10-19, Eric's
         request). */
      <div style={{ ...PANEL, gap: 16, width: 'fit-content' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <p style={HEADLINE}>When is your {stateName} state exam?</p>
          {/* The compact calendar, Figma 224:4257 (2026-10-19, Eric's request):
              223 wide and centred in the panel, in place of the 466:856
              calendar that spread to the panel's full width. */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: CALENDAR_W, alignSelf: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, height: 26 }}>
              <button
                type="button"
                aria-label="Previous month"
                disabled={!canGoBack}
                onClick={() => setView(new Date(year, month - 1, 1))}
                style={{ ...NAV, opacity: canGoBack ? 1 : 0.4, cursor: canGoBack ? 'pointer' : 'default' }}
              >
                <AngleLeftRegular size={14} aria-hidden />
              </button>
              <p aria-live="polite" style={MONTH}>
                {monthLabel}
              </p>
              <button type="button" aria-label="Next month" onClick={() => setView(new Date(year, month + 1, 1))} style={NAV}>
                <AngleRightRegular size={14} aria-hidden />
              </button>
            </div>
            <div role="grid" aria-label={monthLabel} style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
              <div role="row" style={GRID}>
                {WEEKDAYS.map((d, i) => (
                  <span key={i} role="columnheader" style={WEEKDAY}>
                    {d}
                  </span>
                ))}
              </div>
              <div style={{ ...GRID, rowGap: 9 }}>
                {days.map((d) => {
                  const inMonth = d.getMonth() === month
                  const past = d < todayStart
                  const selectable = inMonth && !past
                  const selected = picked !== null && d.getTime() === picked.getTime()
                  return (
                    <button
                      key={d.toISOString()}
                      type="button"
                      role="gridcell"
                      aria-selected={selected}
                      aria-label={d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                      disabled={!selectable}
                      onClick={() => setPicked(d)}
                      style={selected ? DATE_SELECTED : selectable ? DATE : DATE_MUTED}
                    >
                      {d.getDate()}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 16 }}>
          <button type="button" onClick={() => setStage(cameFrom)} style={{ ...TEXT_LINK, lineHeight: '19.5px' }}>
            Cancel
          </button>
          <button
            type="button"
            disabled={!picked}
            onClick={() => {
              setExamDate(picked)
              setStage('set')
            }}
            style={{ ...PRIMARY, padding: '5px 16px', opacity: picked ? 1 : 0.5, cursor: picked ? 'pointer' : 'default' }}
          >
            Set Exam Date
          </button>
        </div>
      </div>
    )
  }

  // Date Set
  const date = examDate ?? todayStart
  const daysUntil = Math.round((date.getTime() - todayStart.getTime()) / DAY)
  return (
    /* Date Set has no box — no edge, no inset — and everything sits left
       (2026-10-19, Eric's request). */
    <div style={PANEL_SET}>
      <p style={HEADLINE}>Your state exam date:</p>
      <div style={{ display: 'flex', gap: 8, alignSelf: 'stretch' }}>
        {/* Both tiles fit their content with 23 either side (2026-10-19, Eric's
            requests: the date tile's visual 31 matched across, then 8 less).
            This one was the design's fixed 100. */}
        <div style={{ ...TILE, flex: 'none', paddingLeft: TILE_SIDE, paddingRight: TILE_SIDE, background: 'var(--color-secondary-200)' }}>
          <CalendarThin size={38} aria-hidden style={TILE_ICON} />
          <p style={TILE_TEXT}>
            <strong style={{ fontWeight: 700 }}>{date.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}</strong>
            <br />
            {date.getFullYear()}
          </p>
        </div>
        <div style={{ ...TILE, flex: 'none', paddingLeft: TILE_SIDE, paddingRight: TILE_SIDE, background: 'var(--color-primary-100)' }}>
          {/* 43 wide, so its glyph stands the calendar's 40.7 tall (2026-10-19, Eric's request); it was 30, about 28. */}
          <HourglassClockThin size={43} aria-hidden style={TILE_ICON} />
          <p style={TILE_TEXT}>
            <strong style={{ fontWeight: 700 }}>
              {daysUntil} {daysUntil === 1 ? 'day' : 'days'}
            </strong>{' '}
            {/* "…until your" / "state exam" (2026-10-19, Eric's request; the
                break was after the count). */}
            until your
            <br />
            state exam
          </p>
        </div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
        <button type="button" onClick={() => openCalendar('set')} style={{ ...TEXT_LINK, lineHeight: '13px' }}>
          <PenToSquareSolid size={11} aria-hidden />
          Edit
        </button>
      </div>
    </div>
  )
}

/* ── Styles — Figma 466:856 ─────────────────────────────────────────────── */

const BODY = 'var(--font-body)'

/* Default: the Primary 100 ground, 16 / 24 in. */
const PANEL_DEFAULT: CSSProperties = {
  display: 'flex',
  boxSizing: 'border-box',
  width: '100%',
  padding: '16px 24px',
  borderRadius: 12,
  background: 'var(--color-primary-100)',
}
/* No, Yes and Date Set: white inside a Primary 200 edge, 24 in. */
const PANEL: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 16,
  boxSizing: 'border-box',
  width: '100%',
  padding: 24,
  borderRadius: 12,
  border: '1px solid var(--color-primary-200)',
  background: 'var(--color-fixed-light)',
}
const HEADLINE: CSSProperties = {
  margin: 0,
  fontFamily: BODY,
  fontWeight: 700,
  fontSize: 13,
  lineHeight: '14px',
  letterSpacing: '-0.2px',
  color: 'var(--color-text-primary)',
}
const SMALL: CSSProperties = {
  margin: 0,
  fontFamily: BODY,
  fontSize: 11,
  lineHeight: '15px',
  color: 'var(--color-neutral-700)',
}
const PRIMARY: CSSProperties = {
  border: '1px solid transparent',
  borderRadius: 9,
  background: 'var(--color-primary-500)',
  fontFamily: BODY,
  fontWeight: 700,
  fontSize: 13.5,
  lineHeight: '20.25px',
  color: 'var(--color-fixed-light)',
  whiteSpace: 'nowrap',
  cursor: 'pointer',
}
const TEXT_LINK: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 4,
  padding: 0,
  border: 'none',
  background: 'none',
  fontFamily: BODY,
  fontWeight: 700,
  fontSize: 11,
  lineHeight: '11.5px',
  color: 'var(--color-primary-500)',
  whiteSpace: 'nowrap',
  cursor: 'pointer',
}
const NAV: CSSProperties = {
  flex: 'none',
  width: 23,
  height: 26,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 0,
  border: 'none',
  borderRadius: 8,
  background: 'var(--color-atlas-outlined-card)',
  color: 'var(--color-neutral-700)',
  cursor: 'pointer',
}
const MONTH: CSSProperties = {
  flex: '1 0 0',
  margin: 0,
  textAlign: 'center',
  fontFamily: BODY,
  fontSize: 12,
  lineHeight: '14px',
  letterSpacing: '1.4px',
  textTransform: 'uppercase',
  color: 'var(--color-neutral-700)',
}
/* Seven equal columns, so the weekday letters and the dates share them. */
/* Figma 224:4257: seven 22 columns, 11.5 apart — 223 across, the weekday
   letters on the same columns as the dates. */
const CELL = 22
const CALENDAR_W = CELL * 7 + 11.5 * 6
const GRID: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: `repeat(7, ${CELL}px)`,
  columnGap: 11.5,
  justifyItems: 'center',
}
const WEEKDAY: CSSProperties = {
  width: 20,
  textAlign: 'center',
  fontFamily: BODY,
  fontWeight: 700,
  fontSize: 10,
  lineHeight: '20.25px',
  color: 'var(--color-text-primary)',
}
const DATE: CSSProperties = {
  width: CELL,
  height: CELL,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 0,
  border: 'none',
  borderRadius: 8,
  background: 'var(--color-fixed-light)',
  fontFamily: BODY,
  fontWeight: 600,
  fontSize: 10,
  color: 'var(--color-atlas-exam-calendar-ink)',
  cursor: 'pointer',
}
const DATE_MUTED: CSSProperties = { ...DATE, color: 'var(--color-secondary-500)', cursor: 'default' }
const DATE_SELECTED: CSSProperties = {
  ...DATE,
  fontWeight: 700,
  background: 'var(--color-atlas-exam-calendar-ink)',
  color: 'var(--color-fixed-light)',
}
/* Date Set: the panel without its edge, inset or ground. */
const PANEL_SET: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-start',
  gap: 16,
  width: '100%',
}
const TILE_SIDE = 23
/* The two Date Set tiles: 8 / 8 / 12 in, a 2px shadow. */
const TILE: CSSProperties = {
  boxSizing: 'border-box',
  display: 'flex',
  flexDirection: 'column',
  // Centred inside, as the design draws them — the panel around them is
  // left-aligned (2026-10-19, Eric's requests: left, then back).
  alignItems: 'center',
  gap: 8,
  // 16 on top: 8, then 4 and 4 more (2026-10-19, Eric's requests).
  padding: '16px 8px 12px',
  borderRadius: 8,
  filter: 'drop-shadow(var(--shadow-atlas-exam-tile))',
}
const TILE_ICON: CSSProperties = { color: 'var(--color-neutral-700)', height: 44 }
const TILE_TEXT: CSSProperties = {
  margin: 0,
  textAlign: 'center',
  fontFamily: BODY,
  fontSize: 11,
  lineHeight: '14px',
  color: 'var(--color-text-primary)',
}
