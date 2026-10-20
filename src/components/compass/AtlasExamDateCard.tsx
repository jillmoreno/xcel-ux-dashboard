import { useMemo, useState, type CSSProperties } from 'react'
import {
  AngleRightSolid,
  CalendarThin,
  HourglassClockThin,
  PenToSquareSolid,
} from '@/icons'
import { COMPASS_BUTTON } from './compassButton'
import { AtlasExamCalendar } from './AtlasExamCalendar'
import { startOfDay } from './examCalendarUtil'

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
const DAY_MS = 24 * 60 * 60 * 1000

/** The date tile is 70 wide: "June 5" as designed, but a long month shortened
 *  ("Sept. 30", "Dec. 12") so the date holds one line. */
function shortMonth(m: number): string {
  const name = MONTHS[m]
  return name.length <= 5 ? name : `${name.slice(0, m === 8 ? 4 : 3)}.`
}



export function AtlasExamDateCard({
  stateName = 'New York',
  style,
  hideIntroCopy = false,
  initialStage = 'default',
  initialDate = null,
}: {
  stateName?: string
  style?: CSSProperties
  /** The first screen without its sub-line ("Adding your state exam date …")
   *  — Eric/Atlas WIP, 2026-10-13. The other screens keep theirs. */
  hideIntroCopy?: boolean
  /** Which of the four screens this opens on — additive, 2026-10-20, so a
   *  dev-handoff preview can pin each stage for a live side-by-side gallery
   *  without threading clicks through the calendar. Defaults to `'default'`,
   *  so every existing caller is unchanged. */
  initialStage?: Stage
  /** Seeds `examDate` so `initialStage: 'set'` (or `'yes'`, to open the
   *  calendar already on a picked day) has a date to show. Ignored on
   *  `'default'` / `'no'`. */
  initialDate?: Date | null
}) {
  const today = useMemo(() => startOfDay(new Date()), [])
  const [stage, setStage] = useState<Stage>(initialStage)
  const [cameFrom, setCameFrom] = useState<Stage>('default')
  const [examDate, setExamDate] = useState<Date | null>(initialDate)

  /* ⚠ THE MONTH IN VIEW AND THE IN-FLIGHT PICK MOVED WITH THE GRID (2026-10-20)
     — `AtlasExamCalendar` holds both, seeded from `initialDate`, which is the
     saved date when editing and null when not. That is what the three lines
     deleted from here did; the calendar is mounted fresh each time the stage
     becomes 'yes', so the seeding still happens on every open. */
  const openCalendar = (from: Stage) => {
    setCameFrom(from)
    setStage('yes')
  }
  const daysLeft = examDate ? Math.round((examDate.getTime() - today.getTime()) / DAY_MS) : 0

  return (
    // `cre-atlas-compass-palette`: the card's contents in the COMPASS colours
    // on every brand (2026-10-07, Eric's request) — see tokens.css.
    <section aria-label="Your state exam date" className="cre-atlas-compass-palette" style={{ ...CARD, ...style }}>
      {stage === 'default' ? (
        <>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <p style={TITLE}>Do you know your state exam date?</p>
            {hideIntroCopy ? null : (
              <p style={COPY}>Adding your state exam date we can help you plan and pass your course easier.</p>
            )}
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
          {/* ⚠ THE GRID MOVED OUT 2026-10-20 — `AtlasExamCalendar`, so the Atlas
              Home's exam prompt could show THIS calendar rather than a third
              one typed into the Home. Nothing here changed: no `today` is
              passed, so it still opens on the WALL CLOCK exactly as this card
              always has, and the Cancel / Set Exam Date pair, the disabled
              past days, the ringed today and the month arrows are the same
              markup under the same styles. The Home passes the demo clock;
              this card deliberately does not. */}
          <AtlasExamCalendar
            initialDate={examDate}
            onCancel={() => setStage(examDate ? 'set' : cameFrom)}
            onSave={(date) => {
              setExamDate(date)
              setStage('set')
            }}
          />
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
              {/* 16, the date's line height beside it (2026-10-14, Eric's request; it was 12). */}
              <p style={{ margin: 0, fontFamily: 'var(--font-body)', fontSize: 11, lineHeight: '16px', textAlign: 'center', color: 'var(--color-text-primary)' }}>
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
/* Past days and the neighbouring months' — the design's faint #C3BBA5. */
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
  // 7, not 8 (2026-10-14, Eric's request): the hourglass is 35 to the
  // calendar's 38, so 35 + 7 puts this tile's text on the date tile's lines
  // (38 + its 4 gap) — both 50 from the top.
  gap: 7,
  background: 'var(--color-primary-100)',
}
