import { useMemo, useState, type CSSProperties } from 'react'
import { CalendarTearOff } from '@/components/ui/CalendarTearOff'
import { ArrowLeft, ArrowRight, CalendarExclamation, HourglassClock, PenToSquare } from '@/icons'
import { clearExamDate, useExamDate, writeExamDate } from '@/data/examDateStore'
import { FIXTURE_TODAY } from '@/data/myCoursesFixtures'
import { EXAM_DETAILS_STEP_ID } from '@/data/examDetails'
import { daysUntilIso } from '@/data/courseExpiry'
import { widgetEyebrowStyle } from './widgetStyles'

/**
 * THE EXAM-DATE STEP CARD, ASKED AS A QUESTION — `exam-step-style: ask-first`.
 *
 * Figma node 765:3844 ("SquareTile") in the CRE > Dash file draws the opening
 * ask only. The three states after it are this variant's extension of that
 * concept, and each one exists to answer what the Figma frame leaves open —
 * what happens after either button is pressed.
 *
 * A THIRD SIBLING, not an edit to the other two. `LicensingStepWidget`'s inline
 * treatment (`inline`) and `ExamDateCard` (`date-first`) are both untouched;
 * the flag picks between all three at the call site in `StudyJourneyWidget`, so
 * the three stay on screen together and comparable.
 *
 * WHAT THIS ARM ARGUES, against `date-first`:
 *
 *  • IT ASKS BEFORE IT OFFERS A CONTROL. `date-first` leads with "Enter exam
 *    date", which assumes the learner has one. This leads with the question
 *    itself — "Have you scheduled your New York state exam?" — because the answer
 *    for most learners arriving is no, and a no is worth capturing.
 *  • "NOT YET" IS AN ANSWER, NOT A DISMISSAL. The card shrinks to a short note
 *    about booking through the state board and keeps one way back in ("I have
 *    my exam date"). Nothing is hidden and nothing is permanent — the learner
 *    who books next week still has the card waiting.
 *  • "YES" EXPANDS THE CALENDAR IN PLACE, the same settled-not-a-sheet decision
 *    `date-first` made, and for the same reason: the date belongs in the card
 *    that asked for it.
 *  • ONCE SAVED THE CARD RE-TITLES ITSELF "{state} State exam" and turns into a
 *    readout — tear-off calendar, day countdown, Edit at link weight. The
 *    question is spent, so the card stops asking it.
 *  • EDIT IS THE ONLY ROUTE IN THAT CAN DESTROY SOMETHING, so it is the only
 *    one that offers to: the footer's "How to Schedule" becomes a red "Clear
 *    exam date" there. Someone editing a date they already hold is past
 *    needing booking instructions, and is exactly who needs a way to undo a
 *    wrong one.
 *
 * THREE ADAPTATIONS FROM THE STANDALONE EXPLORATION, each deliberate:
 *
 *  1. THE EYEBROW IS "Step {number}", not the Figma's "Quick question". This
 *     card lives in the numbered journey column now, and the numbering IS the
 *     sequence — four cards cannot draw a continuous spine, so a card that
 *     opted out of the numbers would read as unrelated to the three around it.
 *     The same note `StudyJourneyWidget` carries.
 *  2. THE DATE IS THE SHARED ONE. The exploration held it in local state; here
 *     it is `examDateStore`, so a date entered re-points the Target Exam Date,
 *     the Study Pace tile's required rate and the Compass player's bar — which
 *     is the whole reason the product asks. Fork the layout, import the data.
 *  3. THE CLOCK IS `FIXTURE_TODAY` (2026-05-11), not the wall clock. Every
 *     date-driven surface in this app is anchored there; measuring the
 *     countdown against the real today would put it months out and make this
 *     card disagree with the Study Plan beside it.
 */

type Phase = 'prompt' | 'not-yet' | 'picking' | 'scheduled'

/** Where Cancel returns to — the phase the picker was opened from. */
type ReturnPhase = 'prompt' | 'not-yet' | 'scheduled'

export function ExamScheduleWidget({
  shell,
  onOpenStep,
  stateName = 'New York',
  today = FIXTURE_TODAY,
}: {
  shell: CSSProperties
  /** Opens a sheet by id. This card only ever sends `EXAM_DETAILS_STEP_ID` —
   *  the menu it opens is what sends the real step ids back. */
  onOpenStep?: (id: string) => void
  /** Learner's licensing state — drives the saved title, "{stateName} State exam". */
  stateName?: string
  /** Clock override for the countdown and the picker's past-day greying. */
  today?: Date
}) {
  const stored = useExamDate()
  /* THE STORED DATE DECIDES THE OPENING PHASE, and `phase` only overrides it
     while the learner is mid-interaction. A learner who already entered a date
     (here, or on either sibling card, or on the Study Plan) must not be asked
     whether they have one — the question is already answered. */
  const [phase, setPhase] = useState<Phase | null>(null)
  const [returnPhase, setReturnPhase] = useState<ReturnPhase>('prompt')

  const activePhase: Phase = phase ?? (stored ? 'scheduled' : 'prompt')
  /* No stored date ⇒ the card is still asking ⇒ it wears the eyebrow. */
  const hasEyebrow = !stored

  function openPicker(from: ReturnPhase) {
    setReturnPhase(from)
    setPhase('picking')
  }

  function handleSave(iso: string) {
    writeExamDate(iso)
    setPhase('scheduled')
  }

  /* EDIT MODE — the picker reached from the saved readout, as opposed to from
     either answer to the question. It is the one route in where a date already
     exists, which is what gives the footer something to destroy. */
  const editing = activePhase === 'picking' && returnPhase === 'scheduled'

  function handleClear() {
    clearExamDate()
    /* Back to null, NOT to `'prompt'` — the phase falls through to the store
       again, so the card re-derives its opening state from the fact that there
       is no longer a date. Pinning the phase here would be the same answer
       today and the wrong one the moment a date arrived from somewhere else. */
    setPhase(null)
  }

  return (
    <section aria-label="Exam Date" style={shell}>
      {/* "QUICK QUESTION", not "Step N" — 2026-09-29, and it is the Figma's own
          eyebrow restored.

          ⚠ THIS CARD IS NOT A JOURNEY STEP, which is the correction. It was
          numbered on the reasoning that four cards cannot draw a continuous
          spine so the numbering IS the sequence — true of the three licensing
          steps, and not true of this, which asks a question and gets out of the
          way. `StudyJourneyWidget` renumbers the column around it rather than
          leaving a gap where a "Step 1" used to be.

          AND IT GOES WHEN A DATE EXISTS. The eyebrow frames an ask; once the
          learner has answered there is no question, the card is a readout, and
          an eyebrow still calling it a question would be describing the state
          it just left. Keyed on the STORE, so edit mode has no eyebrow either —
          a date exists there too. */}
      {hasEyebrow && (
        <p className="cre-eyebrow-ink" style={widgetEyebrowStyle}>
          Quick question
        </p>
      )}

      {activePhase === 'prompt' && (
        <PromptState
          stateName={stateName}
          onNotYet={() => setPhase('not-yet')}
          onYes={() => openPicker('prompt')}
        />
      )}

      {activePhase === 'not-yet' && (
        <NotYetState stateName={stateName} onSchedule={() => openPicker('not-yet')} />
      )}

      {activePhase === 'picking' && (
        <PickerState
          initialDate={stored}
          stateName={stateName}
          today={today}
          editing={editing}
          onCancel={() => setPhase(returnPhase)}
          onSave={handleSave}
        />
      )}

      {activePhase === 'scheduled' && stored && (
        <ScheduledState
          examLabel={`${stateName} State exam`}
          examDate={stored}
          today={today}
          onEdit={() => openPicker('scheduled')}
        />
      )}

      {/* THE FOOTER SLOT, and it carries ONE of two things.
 
          Normally it is EXAM DETAILS — a menu of the three exam sheets, rather
          than the direct link to Schedule State Exam it used to be. The learner
          who wants to rebook also wants to know what the sitting is like and
          what happens if they fail, and two of those were reachable only from
          other cards in the column. ⚠ Still tagged `home.schedule-exam`: it is
          the same slot and the same intent, `CtaTest` asserts that id renders
          unconditionally on the home surface, and a fresh load opens on the
          question, so that assertion is still met. The CTA catalog's label was
          updated to match what the control now says.
 
          IN EDIT MODE IT BECOMES CLEAR EXAM DATE, in red. Editing is the only
          route into the picker where a date already exists, so it is the only
          place where deleting one is a coherent offer — and the learner who
          opened Edit to fix a wrong date is exactly who needs it. "How to
          Schedule" would be the weaker of the two here: someone editing a date
          they already hold is past needing booking instructions. Red because
          this is the one control on the card that destroys something; the
          token is theme-aware (`error-600` light, `error-200` dark) and
          `tokenContrast.test.ts` already pins it to AA on a card surface. */}
      {editing ? (
        <button
          type="button"
          data-cta-id="home.exam-date-clear"
          className="cre-link-action"
          style={clearStyle}
          onClick={handleClear}
        >
          Clear exam date
        </button>
      ) : (
        <button
          type="button"
          data-cta-id="home.schedule-exam"
          className="cre-link-action cre-cta-ink"
          style={howStyle}
          onClick={() => onOpenStep?.(EXAM_DETAILS_STEP_ID)}
        >
          Exam Details →
        </button>
      )}
    </section>
  )
}

/* ─── state 1 · the opening ask (the Figma frame) ──────────────────────── */

function PromptState({
  stateName,
  onNotYet,
  onYes,
}: {
  stateName: string
  onNotYet: () => void
  onYes: () => void
}) {
  return (
    <>
      {/* ⚠ THE STATE IS NAMED IN EVERY PHASE — 2026-09-29. A learner holding
          licences in more than one jurisdiction, or working a course for a state
          they do not live in, cannot tell which exam this card means from "your
          state exam". Naming it costs two words and removes the only genuinely
          ambiguous thing on the card. Lowercase "state exam" here because this
          is a sentence; the saved readout titles it "New York State exam",
          which is a label rather than prose. */}
      <p style={questionStyle}>Have you scheduled your {stateName} state exam?</p>
      <div style={promptButtonRowStyle}>
        <button type="button" style={yesButtonStyle} onClick={onYes}>
          Yes
        </button>
        <button type="button" style={notYetButtonStyle} onClick={onNotYet}>
          Not yet
        </button>
      </div>
    </>
  )
}

/* ─── state 2 · "Not yet" — shrinks, keeps the door open ────────────────── */

function NotYetState({
  stateName,
  onSchedule,
}: {
  stateName: string
  onSchedule: () => void
}) {
  return (
    <>
      <div style={notYetHeadingRowStyle}>
        <CalendarExclamation
          size={16}
          aria-hidden
          style={{ color: 'var(--color-text-secondary)', flexShrink: 0 }}
        />
        <p style={notYetHeadingStyle}>No exam date yet? That’s okay.</p>
      </div>
      <p style={notYetBodyStyle}>
        You can register for your {stateName} exam through the state licensing board. Once you
        have a date, add it here and we’ll count down to it for you.
      </p>
      <button type="button" style={linkStyle} onClick={onSchedule}>
        I have my exam date →
      </button>
    </>
  )
}

/* ─── state 3 · "Yes" — the calendar, in the card ───────────────────────── */

const DOW_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S']
const MONTH_LABELS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

type DayCell = { iso: string; day: number; inMonth: boolean }

function pad2(n: number): string {
  return String(n).padStart(2, '0')
}

function toIso(y: number, mIdx: number, d: number): string {
  return `${y}-${pad2(mIdx + 1)}-${pad2(d)}`
}

/** A whole number of weeks, so the grid never ends mid-row. Leading and
 *  trailing cells belong to the neighbouring months and are not selectable. */
function buildMonthCells(year: number, monthIdx: number): DayCell[] {
  const startDow = new Date(year, monthIdx, 1).getDay()
  const daysInMonth = new Date(year, monthIdx + 1, 0).getDate()
  const prevDaysInMonth = new Date(year, monthIdx, 0).getDate()

  const cells: DayCell[] = []
  for (let i = startDow - 1; i >= 0; i--) {
    const day = prevDaysInMonth - i
    const prevYear = monthIdx === 0 ? year - 1 : year
    const prevMonth = monthIdx === 0 ? 11 : monthIdx - 1
    cells.push({ iso: toIso(prevYear, prevMonth, day), day, inMonth: false })
  }
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ iso: toIso(year, monthIdx, d), day: d, inMonth: true })
  }
  let nextDay = 1
  while (cells.length % 7 !== 0) {
    const nextYear = monthIdx === 11 ? year + 1 : year
    const nextMonth = monthIdx === 11 ? 0 : monthIdx + 1
    cells.push({ iso: toIso(nextYear, nextMonth, nextDay), day: nextDay, inMonth: false })
    nextDay++
  }
  return cells
}

function PickerState({
  initialDate,
  stateName,
  today,
  editing,
  onCancel,
  onSave,
}: {
  initialDate: string | null
  stateName: string
  today: Date
  editing: boolean
  onCancel: () => void
  onSave: (iso: string) => void
}) {
  /* ⚠ BUILT FROM THE DATE'S OWN PARTS, never `toISOString()` — that is UTC and
     shifts the day for anyone west of Greenwich. The rule `examDateStore` and
     `badgeDate` both record. */
  const todayIso = useMemo(
    () => toIso(today.getFullYear(), today.getMonth(), today.getDate()),
    [today],
  )
  const seedIso = initialDate ?? todayIso
  const [year, setYear] = useState(() => parseInt(seedIso.slice(0, 4), 10))
  const [monthIdx, setMonthIdx] = useState(() => parseInt(seedIso.slice(5, 7), 10) - 1)
  const [selected, setSelected] = useState<string | null>(initialDate)

  const cells = useMemo(() => buildMonthCells(year, monthIdx), [year, monthIdx])

  function goToMonth(by: number) {
    const next = monthIdx + by
    setYear((y) => y + Math.floor(next / 12))
    setMonthIdx(((next % 12) + 12) % 12)
  }

  return (
    <>
      {/* `editing` ⇔ a date exists ⇔ no eyebrow above, so the offset goes with
          it. The only phase where this differs either way. */}
      <p style={{ ...pickerLeadStyle, marginTop: editing ? 0 : 6 }}>
        {editing ? `Edit your ${stateName} exam date` : `When is your ${stateName} state exam?`}
      </p>

      <div style={pickerFrameStyle}>
        <div style={monthNavRowStyle}>
          <button
            type="button"
            aria-label="Previous month"
            style={navBtnStyle}
            onClick={() => goToMonth(-1)}
          >
            <ArrowLeft size={11} aria-hidden />
          </button>
          <span style={monthLabelStyle}>
            {MONTH_LABELS[monthIdx]} {year}
          </span>
          <button
            type="button"
            aria-label="Next month"
            style={navBtnStyle}
            onClick={() => goToMonth(1)}
          >
            <ArrowRight size={11} aria-hidden />
          </button>
        </div>

        <div style={dayGridStyle}>
          {/* ⚠ `aria-hidden`, the same call `ExamDateCard` made: seven single
              letters, three of them repeats, are noise to a screen reader — and
              every day button already carries its full date as its name. */}
          {DOW_LABELS.map((label, i) => (
            <span key={i} aria-hidden style={dowLabelStyle}>
              {label}
            </span>
          ))}
          {cells.map((cell) => {
            const isSelected = cell.iso === selected
            const isToday = cell.iso === todayIso
            /* A booked exam in the past is a data-entry slip rather than a
               state to design for — `examDateRenewal` returns null for one. */
            const disabled = !cell.inMonth || cell.iso < todayIso
            return (
              <button
                key={cell.iso}
                type="button"
                disabled={disabled}
                aria-pressed={isSelected}
                aria-current={isToday ? 'date' : undefined}
                aria-label={longDate(cell.iso)}
                onClick={() => setSelected(cell.iso)}
                style={{
                  ...dayStyle,
                  ...(disabled ? dayDisabledStyle : null),
                  ...(isToday && !isSelected ? dayTodayStyle : null),
                  ...(isSelected ? daySelectedStyle : null),
                }}
              >
                {cell.day}
              </button>
            )
          })}
        </div>
      </div>

      <div style={pickerFooterStyle}>
        <button
          type="button"
          data-cta-id="home.exam-date-save"
          style={{ ...yesButtonStyle, ...(selected ? null : saveDisabledStyle) }}
          disabled={!selected}
          onClick={() => selected && onSave(selected)}
        >
          Save exam date
        </button>
        <button type="button" style={linkStyle} onClick={onCancel}>
          Cancel
        </button>
      </div>
    </>
  )
}

/* ─── state 4 · saved — the countdown, still editable ───────────────────── */

function ScheduledState({
  examLabel,
  examDate,
  today,
  onEdit,
}: {
  examLabel: string
  examDate: string
  today: Date
  onEdit: () => void
}) {
  const days = daysUntilIso(examDate, today) ?? 0
  const countdown =
    days < 0 ? 'Date has passed' : days === 0 ? 'Today!' : days === 1 ? '1 day' : `${days} days`

  return (
    <>
      <div style={scheduledHeaderRowStyle}>
        <p style={scheduledTitleStyle}>{examLabel}</p>
        {/* Link weight, not a button — the same quietening `date-first` does
            once a date exists. Editing is no longer the main event. */}
        <button type="button" style={editLinkStyle} onClick={onEdit}>
          <PenToSquare size={12} aria-hidden />
          Edit
        </button>
      </div>

      <div style={scheduledBodyRowStyle}>
        <CalendarTearOff date={examDate} width={84} compact />
        <div style={countdownPanelStyle}>
          <HourglassClock
            size={24}
            aria-hidden
            style={{ color: 'var(--color-primary-600)', flexShrink: 0 }}
          />
          <div style={{ minWidth: 0 }}>
            <p style={countdownNumberStyle}>{countdown}</p>
            {days >= 0 && <p style={countdownCaptionStyle}>until your exam</p>}
          </div>
        </div>
      </div>
    </>
  )
}

/* ─── dates ────────────────────────────────────────────────────────────── */

function longDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number)
  if (!y || !m || !d) return iso
  return new Date(y, m - 1, d).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

/* ─── styles ───────────────────────────────────────────────────────────────

   The Figma frame's literal hex values, mapped to the tokens they resolve to
   in that node's brand context: #1d3849 → `--color-primary-700`, #e9eef2 →
   `--color-primary-100`, #3a3a3a → `--color-text-primary`. The frame's
   "Georgia:Bold" question text is a missing-font placeholder in the Figma file
   — this project has no Georgia anywhere — so it renders on `--font-heading`,
   which every other heading in this app uses. */

const questionStyle: CSSProperties = {
  /* 6px under the eyebrow. The question only ever renders WITH one — there is
     no stored date in the prompt phase — so this offset is unconditional. */
  margin: '6px 0 0',
  fontFamily: 'var(--font-heading)',
  fontWeight: 700,
  fontSize: 18,
  lineHeight: '24px',
  letterSpacing: '-0.01em',
  color: 'var(--color-text-primary)',
}

const promptButtonRowStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  flexWrap: 'wrap',
  marginTop: 12,
}

const yesButtonStyle: CSSProperties = {
  padding: '8px 18px',
  borderRadius: 'var(--radius-sm)',
  border: '1px solid var(--color-primary-600)',
  background: 'var(--color-primary-600)',
  color: 'var(--color-text-inverse)',
  fontFamily: 'var(--font-body)',
  fontSize: 13,
  fontWeight: 700,
  cursor: 'pointer',
}

const saveDisabledStyle: CSSProperties = {
  opacity: 0.45,
  cursor: 'not-allowed',
}

const notYetButtonStyle: CSSProperties = {
  padding: '8px 15px',
  borderRadius: 'var(--radius-sm)',
  border: '1px solid var(--color-primary-600)',
  background: 'transparent',
  color: 'var(--color-primary-600)',
  fontFamily: 'var(--font-body)',
  fontSize: 13,
  fontWeight: 700,
  cursor: 'pointer',
}

const notYetHeadingRowStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  margin: '6px 0 0',
}

const notYetHeadingStyle: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-heading)',
  fontWeight: 700,
  fontSize: 15,
  lineHeight: '20px',
  color: 'var(--color-text-primary)',
}

const notYetBodyStyle: CSSProperties = {
  margin: '8px 0 0',
  fontFamily: 'var(--font-body)',
  fontSize: 12,
  lineHeight: '16px',
  color: 'var(--color-text-secondary)',
}

const linkStyle: CSSProperties = {
  marginTop: 10,
  alignSelf: 'flex-start',
  padding: 0,
  border: 0,
  background: 'none',
  color: 'var(--color-primary-600)',
  fontFamily: 'var(--font-body)',
  fontSize: 13,
  fontWeight: 700,
  cursor: 'pointer',
}

/* The picker renders in both cases — under the eyebrow when reached from an
   answer, flush when reached from Edit — so its offset is the one that has to
   be conditional. */
const pickerLeadStyle: CSSProperties = {
  margin: '6px 0 0',
  fontFamily: 'var(--font-heading)',
  fontWeight: 700,
  fontSize: 15,
  lineHeight: '20px',
  color: 'var(--color-text-primary)',
}

const pickerFrameStyle: CSSProperties = {
  marginTop: 10,
  border: '1px solid var(--color-neutral-300)',
  borderRadius: 'var(--radius-sm)',
  padding: 10,
  background: 'var(--color-surface-page)',
}

const monthNavRowStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  marginBottom: 8,
  fontFamily: 'var(--font-body)',
  color: 'var(--color-text-primary)',
}

const navBtnStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 22,
  height: 22,
  border: '1px solid var(--color-neutral-300)',
  borderRadius: 'var(--radius-sm)',
  background: 'var(--color-surface-card)',
  color: 'var(--color-text-secondary)',
  cursor: 'pointer',
}

const monthLabelStyle: CSSProperties = {
  fontWeight: 700,
  fontSize: 12.5,
}

const dayGridStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(7, 1fr)',
  gap: 2,
}

const dowLabelStyle: CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontSize: 9.5,
  fontWeight: 700,
  textAlign: 'center',
  paddingBottom: 3,
  color: 'var(--color-text-tertiary)',
}

const dayStyle: CSSProperties = {
  border: 0,
  background: 'transparent',
  borderRadius: 'var(--radius-sm)',
  padding: '4px 0',
  fontFamily: 'var(--font-body)',
  fontSize: 11.5,
  color: 'var(--color-text-secondary)',
  cursor: 'pointer',
}

const dayDisabledStyle: CSSProperties = {
  color: 'var(--color-neutral-300)',
  cursor: 'not-allowed',
}

const dayTodayStyle: CSSProperties = {
  boxShadow: 'inset 0 0 0 1px var(--color-primary-600)',
}

const daySelectedStyle: CSSProperties = {
  background: 'var(--color-primary-600)',
  color: 'var(--color-text-inverse)',
  fontWeight: 700,
}

const pickerFooterStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  marginTop: 10,
}

const scheduledHeaderRowStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'baseline',
  justifyContent: 'space-between',
  gap: 12,
  /* FLUSH TO THE TOP — the readout only renders when a date exists, which is
     exactly when there is no eyebrow above it to sit under. */
  margin: 0,
}

const scheduledTitleStyle: CSSProperties = {
  margin: 0,
  minWidth: 0,
  fontFamily: 'var(--font-heading)',
  fontWeight: 700,
  fontSize: 18,
  lineHeight: '24px',
  letterSpacing: '-0.01em',
  color: 'var(--color-text-primary)',
}

const editLinkStyle: CSSProperties = {
  flexShrink: 0,
  display: 'inline-flex',
  alignItems: 'center',
  gap: 5,
  padding: 0,
  border: 0,
  background: 'none',
  color: 'var(--color-primary-600)',
  fontFamily: 'var(--font-body)',
  fontSize: 12.5,
  fontWeight: 700,
  cursor: 'pointer',
}

const scheduledBodyRowStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 14,
  marginTop: 12,
}

const countdownPanelStyle: CSSProperties = {
  flex: 1,
  minWidth: 0,
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  padding: '10px 14px',
  borderRadius: 'var(--radius-sm)',
  background: 'color-mix(in srgb, var(--color-primary-600) 10%, var(--color-surface-card))',
}

const countdownNumberStyle: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-heading)',
  fontWeight: 700,
  fontSize: 20,
  lineHeight: '24px',
  color: 'var(--color-text-primary)',
}

const countdownCaptionStyle: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-body)',
  fontSize: 11.5,
  lineHeight: '16px',
  color: 'var(--color-text-secondary)',
}

/* ⚠ NO `.cre-cta-ink` on the element that uses this — that class IS the action
   colour and would win over the inline value. `.cre-link-action` alone is
   colour-free (its underline and hover both run on `currentColor`), so the red
   below is the only colour in play and the hover darkens it rather than the
   navy. */
const clearStyle: CSSProperties = {
  marginTop: 12,
  alignSelf: 'flex-start',
  background: 'none',
  border: 0,
  padding: 0,
  fontFamily: 'var(--font-body)',
  fontSize: 13,
  fontWeight: 700,
  color: 'var(--color-status-error-text)',
  cursor: 'pointer',
}

const howStyle: CSSProperties = {
  marginTop: 12,
  alignSelf: 'flex-start',
  background: 'none',
  border: 0,
  padding: 0,
  fontFamily: 'var(--font-body)',
  fontSize: 13,
  fontWeight: 700,
  cursor: 'pointer',
}

