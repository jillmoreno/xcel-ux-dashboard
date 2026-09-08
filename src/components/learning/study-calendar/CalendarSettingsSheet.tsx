import { useEffect, useId, useMemo, useState, type CSSProperties } from 'react'
import { Sheet } from '@/components/ui/Sheet'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Select'
import { Lock, X } from '@/icons'
import type { StudyCalendar } from '@/data/studyCalendarFixtures'
import {
  calendarLengthsForPath,
  findCreateCalendarOption,
} from '@/data/createCalendarOptions'
import { StudyDaysToggle, type WeekDay } from './CreateCalendarModal/StudyDaysToggle'
import {
  computeProjectedCompletion,
  useProjectedCompletion,
} from './CreateCalendarModal/useProjectedCompletion'
import { ProjectedCompletionCard } from './ProjectedCompletionCard'

type Props = {
  open: boolean
  onClose: () => void
  calendar: StudyCalendar
  onSave: (next: {
    examDate: string
    examTime: string
    startDate: string
    daysPerWeek: number
    bufferDays: number
    excludeNYSEHolidays: boolean
  }) => void
  /** Copy overrides for first-setup contexts (e.g., AddCalendarPanel).
   *  Defaults match the Edit Calendar slide-over. */
  title?: string
  description?: string
  primaryLabel?: string
  /** Inline hint shown next to the Calendar Start Day label, e.g.
   *  "Defaults to today" for first-setup contexts (AddCalendarPanel).
   *  Edit panels leave this undefined so the field reads as the
   *  learner's previously-saved date with no default qualifier. */
  startDateHint?: string
  /** Learning Path this calendar belongs to. Selects the plan-length list via
   *  `calendarLengthsForPath`; omitted ⇒ the Series 79 lengths (see that
   *  function for why the fallback is a visible one rather than an empty
   *  dropdown). */
  pathId?: string
}

/**
 * Edit Calendar slide-over. Shares the exact field layout with
 * `CreateCalendarPanel` — Select Plan Length, Calendar Start Day
 * (with hint), Include Events on the Following Days, Exclude NYSE
 * Holidays toggle, Projected Completion card — so Edit and Create read
 * as the same form, just with different defaults + button labels.
 *
 * Pre-fills from the passed `calendar` prop and translates the new
 * form values back to the existing `onSave` signature so
 * `StudyProgressPanel` / `InlineStudyCalendar` / the Add-Calendar
 * harness don't need to change.
 *
 * Locked calendars (admin-pinned pacing) collapse to a read-only view
 * — fields render disabled, footer collapses to a single Close button.
 */
export function CalendarSettingsSheet({
  open,
  onClose,
  calendar,
  onSave,
  title = 'Edit Study Plan',
  description = 'Adjust your study schedule — task due dates will recalculate when you save.',
  primaryLabel = 'Save Study Plan',
  startDateHint,
  pathId,
}: Props) {
  const assignId = useId()
  const startId = useId()
  const targetDateId = useId()
  const examTimeId = useId()
  const studyDaysId = useId()
  const studyDaysHelperId = useId()

  const [assignedCalendarId, setAssignedCalendarId] = useState(() =>
    initialAssignedCalendarId(calendar),
  )
  const [startDate, setStartDate] = useState(calendar.startDate)
  const [studyDays, setStudyDays] = useState<WeekDay[]>(() =>
    defaultStudyDays(calendar.daysPerWeek),
  )
  // Plan lengths are per-PATH, not global — see `calendarLengthsForPath`. A
  // caller that doesn't know its path falls back to the Series 79 lengths.
  const planLengths = calendarLengthsForPath(pathId)
  const [omitNyseHolidays, setOmitNyseHolidays] = useState(calendar.excludeNYSEHolidays)
  // Target / exam date.
  //   - Locked layout: the ONLY editable field — pre-filled with the
  //     calendar's existing examDate so the learner sees their current
  //     target and can adjust it.
  //   - Unlocked layout: starts blank. Most learners don't know their
  //     exam date when they first set up a calendar; the field becomes
  //     a deliberate later choice instead of a pre-filled assumption.
  const initialTargetExamDate = calendar.locked ? calendar.examDate : ''
  const [targetExamDate, setTargetExamDate] = useState(initialTargetExamDate)
  // Optional exam time. Pre-fills from the calendar when one is saved;
  // the field sits to the right of the target exam date.
  const [examTime, setExamTime] = useState(calendar.examTime ?? '')

  useEffect(() => {
    if (open) {
      setAssignedCalendarId(initialAssignedCalendarId(calendar))
      setStartDate(calendar.startDate)
      setStudyDays(defaultStudyDays(calendar.daysPerWeek))
      setOmitNyseHolidays(calendar.excludeNYSEHolidays)
      setTargetExamDate(calendar.locked ? calendar.examDate : '')
      setExamTime(calendar.examTime ?? '')
    }
  }, [open, calendar])

  const readOnly = calendar.locked

  // V2-only — filter the calendar-length catalog down to options whose
  // earliest possible completion date is on or before the learner's
  // explicit "Set Exam / Target Date". Reuses the same projection walk
  // the Projected Completion card runs, just one extra invocation per
  // option. Until ALL three inputs (startDate, studyDays, target) are
  // present, the gate stays open — we don't want to filter prematurely
  // while the form is half-filled.
  const inputsReady =
    startDate !== '' && studyDays.length > 0 && targetExamDate !== ''
  const availableOptions = useMemo(() => {
    if (!inputsReady) return planLengths
    return planLengths.filter((option) => {
      const projection = computeProjectedCompletion({
        assignedCalendarId: option.id,
        startDate,
        studyDays,
        omitNyseHolidays,
      })
      if (projection.state !== 'filled') return false
      return toIsoDate(projection.date) <= targetExamDate
    })
  }, [planLengths, inputsReady, startDate, studyDays, omitNyseHolidays, targetExamDate])

  const noCalendarsAvailable = inputsReady && availableOptions.length === 0
  // Some — but not all — plan lengths fit the target date. Surface why the
  // longer options disappeared so the filtering isn't silent.
  const someOptionsHidden =
    inputsReady &&
    availableOptions.length > 0 &&
    availableOptions.length < planLengths.length

  // Pick the longest available plan as the "Recommended" option. More
  // study time = better prep, so the longest plan that still fits the
  // learner's target is the suggestion. Drives both the dropdown
  // label tag and the auto-select effect below.
  const recommendedOption =
    availableOptions.length === 0
      ? null
      : availableOptions[availableOptions.length - 1]

  // If the learner had a calendar picked and a follow-on change to
  // start date / study days / target shifts that option out of the
  // `availableOptions` filter, clear the stale selection so the
  // auto-select effect below can land a fresh recommendation and the
  // Save handler doesn't commit a now-invalid id.
  useEffect(() => {
    if (!inputsReady) return
    if (assignedCalendarId === '') return
    const stillAvailable = availableOptions.some(
      (o) => o.id === assignedCalendarId,
    )
    if (!stillAvailable) setAssignedCalendarId('')
  }, [inputsReady, availableOptions, assignedCalendarId])

  // Auto-select the recommended plan whenever the dropdown is empty
  // and a recommendation exists. Keeps the Projected Completion card
  // visible at all times except when the warning is showing, in
  // which case `recommendedOption` is null anyway.
  useEffect(() => {
    if (noCalendarsAvailable) return
    if (assignedCalendarId !== '') return
    if (!recommendedOption) return
    setAssignedCalendarId(recommendedOption.id)
  }, [noCalendarsAvailable, assignedCalendarId, recommendedOption])

  const assignOptions = useMemo(
    () => [
      { value: '', label: 'Select plan' },
      ...availableOptions.map((o) => ({
        value: o.id,
        label:
          recommendedOption && o.id === recommendedOption.id
            ? `${o.label} (Recommended)`
            : o.label,
      })),
    ],
    [availableOptions, recommendedOption],
  )

  // Same per-day math as CreateCalendarPanel — derive from the picked
  // option's task count + the learner's selected study-day count.
  const tasksPerStudyDay = useMemo<number | null>(() => {
    const option = findCreateCalendarOption(assignedCalendarId)
    if (!option || studyDays.length === 0) return null
    const total = studyDays.length * option.defaultWeeks
    if (total === 0) return null
    return Math.max(1, Math.round(option.taskCount / total))
  }, [assignedCalendarId, studyDays])

  const projection = useProjectedCompletion({
    assignedCalendarId: assignedCalendarId || null,
    startDate: startDate || null,
    studyDays,
    omitNyseHolidays,
  })

  const canSave = assignedCalendarId !== '' && studyDays.length > 0

  return (
    <Sheet open={open} onClose={onClose} title={title}>
      <header
        style={{
          padding: '20px 20px 12px',
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
        }}
      >
        <button
          type="button"
          aria-label="Close edit calendar panel"
          onClick={onClose}
          className="cre-sheet-close"
          style={{
            alignSelf: 'flex-start',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            background: 'transparent',
            borderTop: 'none',
            borderLeft: 'none',
            borderRight: 'none',
            fontFamily: 'var(--font-body)',
            fontSize: 14,
            fontWeight: 600,
            lineHeight: '20px',
            cursor: 'pointer',
            padding: 0,
          }}
        >
          <X size={14} aria-hidden />
          Close
        </button>
        <h2
          style={{
            margin: 0,
            fontFamily: 'var(--font-heading)',
            fontWeight: 600,
            fontSize: 22,
            lineHeight: '28px',
            color: 'var(--color-text-primary)',
          }}
        >
          {readOnly ? 'Study plan (locked)' : title}
        </h2>
      </header>
      <div aria-hidden style={{ height: 1, background: 'var(--color-border-subtle)' }} />

      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '20px 24px 24px',
          display: 'flex',
          flexDirection: 'column',
          gap: 24,
        }}
      >
        {readOnly ? (
          /* Locked variant — manager-set schedule. Only the Target
             Exam Date input is editable; every other pacing field is
             hidden so the form reads as a single-action panel. */
          <>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '4px 10px',
                borderRadius: 'var(--radius-pill)',
                background: 'var(--color-warning-100)',
                color: 'var(--color-warning-800)',
                fontFamily: 'var(--font-body)',
                fontSize: 12,
                fontWeight: 600,
                alignSelf: 'flex-start',
              }}
            >
              <Lock size={12} aria-hidden />
              Locked by manager
            </span>
            <p
              style={{
                margin: 0,
                fontFamily: 'var(--font-body)',
                fontSize: 13,
                lineHeight: '18px',
                color: 'var(--color-text-secondary)',
              }}
            >
              Your manager has set your study schedule. Update your target exam date below; other pacing settings stay as they are.
            </p>

            <div style={examRowStyle}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <Field label="Target Exam Date">
                  <input
                    type="date"
                    value={targetExamDate}
                    onChange={(e) => setTargetExamDate(e.target.value)}
                    style={dateInputStyle}
                  />
                </Field>
              </div>
              <Field label="Time" hint="Optional" htmlFor={examTimeId}>
                <input
                  id={examTimeId}
                  type="time"
                  value={examTime}
                  onChange={(e) => setExamTime(e.target.value)}
                  style={timeInputStyle}
                />
              </Field>
            </div>
          </>
        ) : (
          <>
            <p
              style={{
                margin: 0,
                fontFamily: 'var(--font-body)',
                fontSize: 13,
                lineHeight: '18px',
                color: 'var(--color-text-secondary)',
              }}
            >
              {description}
            </p>

            {/* Field order — Calendar Start Day first, then Include
                Tasks, then Exclude NYSE Holidays, then an explicit
                Set Exam / Target Date input, with Select Calendar
                Length at the end. Surfaces the target date as a
                deliberate user choice rather than a projection
                outcome. */}
            <Field
              label="Start Day"
              hint={startDateHint}
              htmlFor={startId}
            >
              <input
                id={startId}
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                style={dateInputStyle}
              />
            </Field>

            <Field
              label="Include Tasks on the Following Days"
              htmlFor={studyDaysId}
            >
              <StudyDaysToggle
                id={studyDaysId}
                helperId={studyDaysHelperId}
                selected={studyDays}
                onChange={setStudyDays}
                tasksPerStudyDay={tasksPerStudyDay}
              />
            </Field>

            {/* NYSE holidays are SECURITIES-specific — insurance state exams
                are not scheduled around them, so this row is hidden for any
                other Study-Plan brand rather than asking an insurance
                candidate about the stock exchange.
                TODO(data): the proper fix is a generic
                `holidayCalendar?: 'nyse' | 'federal' | null` on
                `StudyCalendar`, replacing the boolean `excludeNYSEHolidays`.
                Scoped out of the XCEL brand-add deliberately — it changes a
                shared type and the calendar-generation logic behind it. */}
            {/* The NYSE-holiday toggle was STC's — its exam calendars keyed off
                exchange holidays. XCEL's insurance licensing exams do not, so
                the control went with the brand. See the TODO above: the
                `holidayCalendar` refactor it describes is still unbuilt. */}

            {/* Exam date + optional time share one row — the time
                input sits to the right of the date, mirroring the
                custom-task Time field (minus the All-Day toggle). */}
            <div style={examRowStyle}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <Field
                  label="Set Exam / Target Date"
                  hint="Optional"
                  htmlFor={targetDateId}
                >
                  <input
                    id={targetDateId}
                    type="date"
                    value={targetExamDate}
                    onChange={(e) => setTargetExamDate(e.target.value)}
                    style={dateInputStyle}
                  />
                </Field>
              </div>
              <Field label="Time" hint="Optional" htmlFor={examTimeId}>
                <input
                  id={examTimeId}
                  type="time"
                  value={examTime}
                  onChange={(e) => setExamTime(e.target.value)}
                  style={timeInputStyle}
                />
              </Field>
            </div>

            <Field label="Select Plan Length" htmlFor={assignId}>
              <Select
                id={assignId}
                options={assignOptions}
                value={assignedCalendarId}
                onChange={(e) => setAssignedCalendarId(e.target.value)}
                label="Select Plan Length"
                disabled={noCalendarsAvailable}
                style={{ width: '100%', display: 'flex' }}
              />
              {noCalendarsAvailable && (
                <div role="status" aria-live="polite" style={noCalendarsBannerStyle}>
                  <strong style={{ fontWeight: 700 }}>
                    No calendars available.
                  </strong>{' '}
                  Your target date doesn&rsquo;t leave enough time for any
                  Series 79 plan. Try a later target date or shift your
                  start day earlier.
                </div>
              )}
              {someOptionsHidden && (
                <p role="status" aria-live="polite" style={hiddenOptionsNoteStyle}>
                  Longer plans that would finish after your target date are
                  hidden. Pick a later target date to see more options.
                </p>
              )}
            </Field>

            {projection.state === 'filled' && !noCalendarsAvailable && (
              <ProjectedCompletionCard
                result={projection}
                variant="prominent"
                examName={examNameLabel(assignedCalendarId)}
                planLengthLabel={planLengthLabelFor(assignedCalendarId)}
                daysPerWeek={studyDays.length}
              />
            )}
          </>
        )}
      </div>

      <footer
        style={{
          padding: '24px 32px',
          background: 'var(--color-neutral-light)',
          borderBottomLeftRadius: 16,
          display: 'flex',
          gap: 32,
        }}
      >
        <>
          <Button
            variant="primary"
            size="md"
            disabled={readOnly ? !targetExamDate : !canSave}
            onClick={() => {
              if (readOnly) {
                // Locked save — only the target exam date changes.
                // Other pacing fields stay at the calendar's current
                // values (manager-set, untouched by the learner).
                if (!targetExamDate) return
                onSave({
                  examDate: targetExamDate,
                  examTime,
                  startDate: calendar.startDate,
                  daysPerWeek: calendar.daysPerWeek,
                  bufferDays: calendar.bufferDays,
                  excludeNYSEHolidays: calendar.excludeNYSEHolidays,
                })
                onClose()
                return
              }
              if (!canSave) return
              const option = findCreateCalendarOption(assignedCalendarId)
              // Prefer the learner's explicit "Set Exam / Target
              // Date" when they've set one; otherwise fall back to
              // the projected completion date so a saved calendar
              // always has a target on file.
              const examDate =
                targetExamDate ||
                (projection.state === 'filled' ? toIsoDate(projection.date) : '')
              onSave({
                examDate,
                examTime,
                startDate,
                daysPerWeek: studyDays.length,
                bufferDays: option?.bufferDays ?? 0,
                excludeNYSEHolidays: omitNyseHolidays,
              })
              onClose()
            }}
            style={{
              flex: 1,
              height: 52,
              padding: '12px 32px',
              borderRadius: 8,
              fontSize: 16,
              lineHeight: '28px',
              ...((readOnly ? !targetExamDate : !canSave) && {
                background: 'var(--color-neutral-disabled)',
                borderColor: 'var(--color-neutral-disabled)',
                color: 'var(--color-neutral-dark)',
                cursor: 'not-allowed',
              }),
            }}
          >
            {primaryLabel}
          </Button>
          <Button
            variant="secondary"
            size="md"
            onClick={onClose}
            style={{
              flex: 1,
              height: 52,
              padding: '12px 32px',
              borderRadius: 8,
              fontSize: 16,
              lineHeight: '28px',
            }}
          >
            Cancel
          </Button>
        </>
      </footer>
    </Sheet>
  )
}

/* ─── helpers ────────────────────────────────────────────────────── */

/**
 * Best-effort guess at which Series 79 length option corresponds to
 * the passed StudyCalendar. The fixture catalog only has one Series 79
 * plan today; new paths can branch here.
 */
function initialAssignedCalendarId(calendar: StudyCalendar): string {
  if (calendar.id === 'stc-series79-15day') return 'series-79-15day'
  // For blank / new calendars (Add flow) or non-Series-79 paths, start
  // empty so the user has to pick a length.
  return ''
}

/**
 * Translate a numeric `daysPerWeek` count into a default weekday array
 * for the Include Events selector. Order roughly follows a typical
 * study cadence (Mon → Wed/Fri → Tue/Thu → weekends last).
 */
function defaultStudyDays(daysPerWeek: number): WeekDay[] {
  const order: WeekDay[] = [1, 3, 5, 2, 4, 6, 0]
  const n = Math.max(0, Math.min(7, Math.round(daysPerWeek)))
  return order.slice(0, n).sort() as WeekDay[]
}

/**
 * Pull the short exam name out of a calendar option's label. Today's
 * Series 79 lengths label as "Series 79 Exam 10 Day Calendar"; we
 * trim to "Series 79 Exam". Returns undefined when no option is
 * picked so the prominent readout's sub-line drops cleanly.
 */
function examNameLabel(assignedCalendarId: string): string | undefined {
  const option = findCreateCalendarOption(assignedCalendarId)
  if (!option) return undefined
  const match = option.label.match(/^(.*?Exam)\b/i)
  return match?.[1] ?? option.label
}

/**
 * Format the plan length as "{N}-day plan" — pulled from the option's
 * id (e.g. `series-79-15day` → "15-day plan").
 */
function planLengthLabelFor(assignedCalendarId: string): string | undefined {
  const option = findCreateCalendarOption(assignedCalendarId)
  if (!option) return undefined
  const match = option.id.match(/(\d+)day/i)
  if (!match) return undefined
  return `${match[1]}-day plan`
}

function toIsoDate(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/* ─── styles ─────────────────────────────────────────────────────── */

// Warning surface shown under the V2 Select Plan Length field
// when none of the Series 79 plans fit between the learner's start
// day and target exam date. Soft warning palette (--color-warning-100
// fill + warning-800 text) so the message reads as guidance, not as a
// validation error the learner can't resolve.
const noCalendarsBannerStyle: CSSProperties = {
  marginTop: 8,
  padding: '10px 12px',
  borderRadius: 'var(--radius-md)',
  background: 'var(--color-warning-100)',
  border: '1px solid var(--color-warning-300)',
  color: 'var(--color-warning-800)',
  fontFamily: 'var(--font-body)',
  fontSize: 13,
  lineHeight: '18px',
}

// Quiet helper note explaining why longer plan lengths dropped out of the
// dropdown once a target date narrows the window. Lower-key than the
// warning banner — this is informational, not a problem to resolve.
const hiddenOptionsNoteStyle: CSSProperties = {
  margin: '8px 0 0',
  fontFamily: 'var(--font-body)',
  fontSize: 12,
  lineHeight: '16px',
  color: 'var(--color-text-secondary)',
}

const dateInputStyle: CSSProperties = {
  width: '100%',
  height: 40,
  padding: '0 12px',
  border: '1px solid var(--color-border-subtle)',
  borderRadius: 'var(--radius-md)',
  background: 'var(--color-surface-card)',
  color: 'var(--color-text-primary)',
  fontFamily: 'var(--font-body)',
  fontSize: 14,
  colorScheme: 'light',
}

// Time input sits to the right of the exam date — sized to its content
// rather than stretching, so the date field keeps the row's flex space.
const timeInputStyle: CSSProperties = {
  ...dateInputStyle,
  width: 'auto',
  minWidth: 130,
}

const examRowStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'flex-start',
  gap: 12,
}

/* ─── Field wrapper (matches CreateCalendarPanel) ─────────────────── */

function Field({
  label,
  hint,
  htmlFor,
  children,
}: {
  label: string
  hint?: string
  htmlFor?: string
  children: React.ReactNode
}) {
  return (
    <div>
      <div style={fieldLabelRowStyle}>
        <label htmlFor={htmlFor} style={fieldLabelStyle}>
          {label}
          {hint && <span style={hintStyle}> ({hint})</span>}
        </label>
      </div>
      {children}
    </div>
  )
}

const fieldLabelRowStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'baseline',
  justifyContent: 'space-between',
  marginBottom: 6,
}

const fieldLabelStyle: CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontWeight: 700,
  fontSize: 13,
  color: 'var(--color-text-primary)',
}

const hintStyle: CSSProperties = {
  color: 'var(--color-text-tertiary)',
  fontWeight: 400,
}
