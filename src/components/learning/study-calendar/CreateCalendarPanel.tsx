import { useEffect, useId, useMemo, type CSSProperties } from 'react'
import { Sheet } from '@/components/ui/Sheet'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Select'
import { Toggle } from '@/components/ui/Toggle'
import { X } from '@/icons'
import {
  calendarLengthsForPath,
  findCreateCalendarOption,
} from '@/data/createCalendarOptions'
import { StudyDaysToggle } from './CreateCalendarModal/StudyDaysToggle'
import {
  computeProjectedCompletion,
  useProjectedCompletion,
} from './CreateCalendarModal/useProjectedCompletion'
import { ProjectedCompletionCard } from './ProjectedCompletionCard'
import type { CreateCalendarFormState } from './CreateCalendarModal/CreateCalendarModal'

type Props = {
  open: boolean
  onClose: () => void
  onSave: (state: CreateCalendarFormState) => void
  formState: CreateCalendarFormState
  onChange: (next: Partial<CreateCalendarFormState>) => void
  /** Learning Path this calendar is being created for. Selects the plan-length
   *  list via `calendarLengthsForPath`; omitted ⇒ the Series 79 lengths. */
  pathId?: string
}

/**
 * STC Create Calendar **panel** variant. Same form content as the
 * `CreateCalendarModal` (Assign Calendar select, NYSE-holidays toggle,
 * Start Day input, Study Days picker, projected-completion readout) but
 * rendered inside the shared right-anchored slide-over pattern — Close
 * top-left → title → divider → body → neutral-light footer band with
 * primary-left / secondary-right CTAs.
 *
 * Save is disabled until the user picks an assigned calendar and at
 * least one study day. Matches the modal's `canSave` rule so behavior
 * stays consistent across the two demo treatments.
 */
export function CreateCalendarPanel({
  open,
  onClose,
  onSave,
  formState,
  onChange,
  pathId,
}: Props) {
  const planLengths = calendarLengthsForPath(pathId)
  const assignId = useId()
  const startId = useId()
  const targetDateId = useId()
  const examTimeId = useId()
  const studyDaysId = useId()
  const studyDaysHelperId = useId()

  // Availability filter — same shape as the Edit Calendar V2 panel.
  // When startDate + studyDays + targetExamDate are all set, every
  // Series 79 plan runs through `computeProjectedCompletion` and we
  // keep only the ones whose earliest possible end date fits before
  // the learner's target. Until then the filter stays open so the
  // dropdown shows every plan.
  const inputsReady =
    formState.startDate !== '' &&
    formState.studyDays.length > 0 &&
    formState.targetExamDate !== ''
  const availableOptions = useMemo(() => {
    if (!inputsReady) return planLengths
    return planLengths.filter((option) => {
      const projection = computeProjectedCompletion({
        assignedCalendarId: option.id,
        startDate: formState.startDate,
        studyDays: formState.studyDays,
        omitNyseHolidays: formState.omitNyseHolidays,
      })
      if (projection.state !== 'filled') return false
      return toIsoDate(projection.date) <= formState.targetExamDate
    })
  }, [
    inputsReady,
    formState.startDate,
    formState.studyDays,
    planLengths,
    formState.omitNyseHolidays,
    formState.targetExamDate,
  ])

  const noCalendarsAvailable = inputsReady && availableOptions.length === 0

  // Recommended option — the longest available plan. Rationale: more
  // study time generally produces better preparation, so we surface
  // the longest plan that still fits the learner's target (or, when
  // no target is set, simply the longest overall). Drives both the
  // dropdown label tag and the auto-select effect below.
  const recommendedOption =
    availableOptions.length === 0
      ? null
      : availableOptions[availableOptions.length - 1]

  // Auto-clear a stale assigned-calendar selection when a follow-on
  // field change drops it out of the filter — same safety net as the
  // V2 Edit Calendar panel, without it Save would pass `canSave` on a
  // now-invalid id.
  useEffect(() => {
    if (!inputsReady) return
    if (formState.assignedCalendarId === '') return
    const stillAvailable = availableOptions.some(
      (o) => o.id === formState.assignedCalendarId,
    )
    if (!stillAvailable) onChange({ assignedCalendarId: '' })
  }, [inputsReady, availableOptions, formState.assignedCalendarId, onChange])

  // Auto-select the recommended plan whenever the dropdown is empty
  // and a recommendation exists. Keeps the Projected Completion card
  // visible at all times (so the learner sees a concrete end date as
  // soon as the form has enough input) except when the warning is
  // showing, in which case `recommendedOption` is null anyway.
  useEffect(() => {
    if (noCalendarsAvailable) return
    if (formState.assignedCalendarId !== '') return
    if (!recommendedOption) return
    onChange({ assignedCalendarId: recommendedOption.id })
  }, [
    noCalendarsAvailable,
    formState.assignedCalendarId,
    recommendedOption,
    onChange,
  ])

  // Wrap the (possibly filtered) option list in the shape `<Select>`
  // expects, with a disabled placeholder entry pinned at the top. The
  // recommended option carries a " (Recommended)" suffix so the tag
  // is visible both in the closed dropdown and when the learner opens
  // the menu to consider alternatives.
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

  // Tasks-per-study-day = totalTasks / (studyDays × calendarWeeks).
  // `null` when the form doesn't have enough input yet — the StudyDays
  // helper drops the "~N tasks per study day" suffix in that state.
  const tasksPerStudyDay = useMemo<number | null>(() => {
    const option = findCreateCalendarOption(formState.assignedCalendarId)
    if (!option || formState.studyDays.length === 0) return null
    const totalStudyDays = formState.studyDays.length * option.defaultWeeks
    if (totalStudyDays === 0) return null
    return Math.max(1, Math.round(option.taskCount / totalStudyDays))
  }, [formState.assignedCalendarId, formState.studyDays])

  const projection = useProjectedCompletion({
    assignedCalendarId: formState.assignedCalendarId || null,
    startDate: formState.startDate || null,
    studyDays: formState.studyDays,
    omitNyseHolidays: formState.omitNyseHolidays,
  })

  const canSave =
    formState.assignedCalendarId !== '' && formState.studyDays.length > 0

  return (
    <Sheet open={open} onClose={onClose} title="Create Study Plan">
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
          aria-label="Close Create Study Plan panel"
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
          Create Study Plan
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
          // Bumped from 18 → 24 so form rows have a touch more breathing
          // room. Pairs with the 12px helper text rule.
          gap: 24,
        }}
      >
        {/* Intro paragraph — same shape as the Edit Calendar panel's
            description line. Adjusted for a fresh-setup context:
            "set up" + "will be generated" instead of "adjust" +
            "will recalculate". */}
        <p
          style={{
            margin: 0,
            fontFamily: 'var(--font-body)',
            fontSize: 13,
            lineHeight: '18px',
            color: 'var(--color-text-secondary)',
          }}
        >
          Set up your study schedule — task due dates will be generated
          when you save.
        </p>

        {/* V2-style field order shared with the Edit Calendar panel:
            Calendar Start Day → Include Tasks → Exclude NYSE toggle →
            Set Exam / Target Date (optional) → Select Plan Length
            → Projected Completion card. */}
        <Field
          label="Select Start Day"
          hint="Defaults to today"
          htmlFor={startId}
        >
          <input
            id={startId}
            type="date"
            value={formState.startDate}
            onChange={(e) => onChange({ startDate: e.target.value })}
            style={dateInputStyle}
          />
        </Field>

        <Field
          label="Select Preferred Study Days"
          htmlFor={studyDaysId}
        >
          <StudyDaysToggle
            id={studyDaysId}
            helperId={studyDaysHelperId}
            selected={formState.studyDays}
            onChange={(next) => onChange({ studyDays: next })}
            tasksPerStudyDay={tasksPerStudyDay}
          />
        </Field>

        {/* NYSE holiday opt-out. Switch on the left, label
            immediately after — reads as "[off] Exclude…" / "[on]
            Exclude…" inline rather than the full-row label-vs-switch
            split. */}
        <Field bare>
          <Toggle
            label="Exclude all New York Stock Exchange (NYSE) holidays"
            checked={formState.omitNyseHolidays}
            onChange={(next) => onChange({ omitNyseHolidays: next })}
            switchPosition="left"
          />
        </Field>

        {/* Exam date + optional time share one row — the time input
            sits to the right of the date, mirroring the custom-task
            Time field (minus the All-Day toggle). */}
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
                value={formState.targetExamDate}
                onChange={(e) => onChange({ targetExamDate: e.target.value })}
                style={dateInputStyle}
              />
            </Field>
          </div>
          <Field label="Time" hint="Optional" htmlFor={examTimeId}>
            <input
              id={examTimeId}
              type="time"
              value={formState.examTime ?? ''}
              onChange={(e) => onChange({ examTime: e.target.value })}
              style={timeInputStyle}
            />
          </Field>
        </div>

        <Field label="Select Plan Length" htmlFor={assignId}>
          <Select
            id={assignId}
            options={assignOptions}
            value={formState.assignedCalendarId}
            onChange={(e) => onChange({ assignedCalendarId: e.target.value })}
            aria-required="true"
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
        </Field>

        {/* Projected completion only appears once the form has enough
            input to compute a real date AND the dropdown isn't in the
            "no calendars available" failure state. Uses the prominent
            variant — same large calendar tile + exam sub-line + bullet
            summary the Edit Calendar V2 panel shows. */}
        {projection.state === 'filled' && !noCalendarsAvailable && (
          <Field bare>
            <ProjectedCompletionCard
              result={projection}
              variant="prominent"
              examName={examNameLabel(formState.assignedCalendarId)}
              planLengthLabel={planLengthLabelFor(formState.assignedCalendarId)}
              daysPerWeek={formState.studyDays.length}
            />
          </Field>
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
        <Button
          variant="primary"
          size="md"
          disabled={!canSave}
          onClick={() => {
            if (!canSave) return
            onSave(formState)
          }}
          style={{
            flex: 1,
            height: 52,
            padding: '12px 32px',
            borderRadius: 8,
            fontSize: 16,
            lineHeight: '28px',
            ...(!canSave && {
              background: 'var(--color-neutral-disabled)',
              borderColor: 'var(--color-neutral-disabled)',
              color: 'var(--color-neutral-dark)',
              cursor: 'not-allowed',
            }),
          }}
        >
          Save Study Plan
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
      </footer>
    </Sheet>
  )
}

/* Field wrapper — panel-form convention:
     - Required fields render the label only. No asterisk. Required is
       the default state; the user finds out a field is required via the
       disabled Save CTA + form-validation feedback.
     - Optional fields render an "Optional" tag inline on the right.
     - `hint` renders a short parenthetical next to the label in the
       tertiary tone — use for one-line context that's not validation
       advice (e.g., "Defaults to today"). Mutually exclusive with
       `optional` in practice.
   Aria-required still gets set on the underlying input where applicable. */
function Field({
  label,
  optional,
  hint,
  htmlFor,
  bare,
  children,
}: {
  label?: string
  optional?: boolean
  hint?: string
  htmlFor?: string
  bare?: boolean
  children: React.ReactNode
}) {
  if (bare) return <div>{children}</div>
  return (
    <div>
      <div style={fieldLabelRowStyle}>
        <label htmlFor={htmlFor} style={fieldLabelStyle}>
          {label}
          {hint && <span style={hintStyle}> ({hint})</span>}
        </label>
        {optional && <span style={optStyle}>Optional</span>}
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

const optStyle: CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontSize: 11,
  color: 'var(--color-text-tertiary)',
  fontWeight: 400,
}

// Parenthetical hint that sits inline with the label — neutral-600 tone
// at regular weight, matching the helper-text standard. Sits at label
// font-size so the two reads as one continuous line.
const hintStyle: CSSProperties = {
  color: 'var(--color-text-tertiary)',
  fontWeight: 400,
}

// Mirrors `inputStyle` in CalendarSettingsSheet so date inputs match
// the Edit / Add Calendar panel treatment. `colorScheme: 'light'` forces
// the native date-picker popup to render light even when the host OS is
// in dark mode — the rest of the app ships light-only.
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

// Same warning surface the Edit V2 panel uses when the target date
// doesn't leave room for any plan. Soft warning palette so the
// message reads as guidance, not as a validation error the learner
// can't resolve from inside the form.
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

/** Local-date ISO helper (yyyy-mm-dd). Mirrors the helper inside
 *  CalendarSettingsSheet — kept colocated so the panel doesn't reach
 *  across files just for one formatting call. */
function toIsoDate(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/**
 * Pull the short exam name out of a calendar option's label
 * (e.g. "Series 79 Exam 10 Day Calendar" → "Series 79 Exam"). Returns
 * undefined when no option is picked so the prominent readout's
 * sub-line drops cleanly. Mirrors the helper in CalendarSettingsSheet
 * so both panels surface the same labels.
 */
function examNameLabel(assignedCalendarId: string): string | undefined {
  const option = findCreateCalendarOption(assignedCalendarId)
  if (!option) return undefined
  const match = option.label.match(/^(.*?Exam)\b/i)
  return match?.[1] ?? option.label
}

/** Format the plan length as "{N}-day plan" — pulled from the
 *  option id (e.g. `series-79-15day` → "15-day plan"). */
function planLengthLabelFor(assignedCalendarId: string): string | undefined {
  const option = findCreateCalendarOption(assignedCalendarId)
  if (!option) return undefined
  const match = option.id.match(/(\d+)day/i)
  if (!match) return undefined
  return `${match[1]}-day plan`
}

