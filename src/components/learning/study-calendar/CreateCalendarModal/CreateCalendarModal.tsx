import { useId, type CSSProperties } from 'react'
import { Modal } from '@/components/ui/Modal'
import { AssignCalendarSelect } from './AssignCalendarSelect'
import { OmitHolidaysCheckbox } from './OmitHolidaysCheckbox'
import { CalendarStartDayInput } from './CalendarStartDayInput'
import { StudyDaysToggle, type WeekDay } from './StudyDaysToggle'
import { ProjectedCompletionReadout } from './ProjectedCompletionReadout'
import { CreateCalendarPreviewPane } from './CreateCalendarPreviewPane'
import { useProjectedCompletion } from './useProjectedCompletion'

/**
 * Form payload — what gets passed to `onSave`. The harness logs this
 * verbatim to `console.info` and surfaces a "Demo save — not
 * persisted" toast.
 */
export type CreateCalendarFormState = {
  assignedCalendarId: string
  omitNyseHolidays: boolean
  startDate: string
  studyDays: WeekDay[]
  /** Optional learner-set target exam date. Empty string when the
   *  learner hasn't picked one yet — the Create Calendar panel's
   *  availability filter only kicks in once this is set. */
  targetExamDate: string
  /** Optional learner-set exam time, `HH:mm` (24h). Empty string when
   *  unset. Sits to the right of the target exam date field. */
  examTime?: string
}

type Props = {
  open: boolean
  onClose: () => void
  onSave: (state: CreateCalendarFormState) => void
  /** Optional existing calendar — when present, "Remove Calendar"
   *  surfaces. Demo build never passes this. */
  existingCalendar?: { id: string } | null
  formState: CreateCalendarFormState
  onChange: (next: Partial<CreateCalendarFormState>) => void
}

/**
 * STC Create Calendar modal. Two-column body:
 *
 *   - **Form**     — Assign Calendar select, Omit Holidays checkbox,
 *                    Calendar Start Day input, Study Days toggle,
 *                    Projected Completion readout, Save (disabled
 *                    until valid), Remove (hidden in create mode).
 *   - **Preview**  — `CreateCalendarPreviewPane`. Progressive reveal:
 *                    empty card → 4-up stats → mini month grid +
 *                    first-3-tasks.
 *
 * State is owned by the harness — every field is controlled. Save is
 * disabled until `assignedCalendarId !== ''` AND `studyDays.length > 0`.
 * Backdrop click is a no-op (`disableBackdropClose` on Modal); Esc and
 * × still close.
 */
export function CreateCalendarModal({
  open,
  onClose,
  onSave,
  existingCalendar,
  formState,
  onChange,
}: Props) {
  const assignId = useId()
  const startId = useId()
  const startHelperId = useId()
  const studyDaysId = useId()
  const studyDaysHelperId = useId()
  const assignErrorId = useId()

  const projection = useProjectedCompletion({
    assignedCalendarId: formState.assignedCalendarId || null,
    startDate: formState.startDate || null,
    studyDays: formState.studyDays,
    omitNyseHolidays: formState.omitNyseHolidays,
  })

  const canSave =
    formState.assignedCalendarId !== '' && formState.studyDays.length > 0

  const handleSave = () => {
    if (!canSave) return
    onSave(formState)
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Create Study Plan"
      width={960}
      disableBackdropClose
      backdropColor="rgba(8, 21, 94, 0.36)"
    >
      <div style={bodyStyle}>
        {/* Form column */}
        <div style={formColStyle}>
          <Field label="Select Plan Length" required htmlFor={assignId}>
            <AssignCalendarSelect
              id={assignId}
              value={formState.assignedCalendarId}
              onChange={(id) => onChange({ assignedCalendarId: id })}
              describedBy={assignErrorId}
            />
          </Field>

          <Field bare>
            <OmitHolidaysCheckbox
              checked={formState.omitNyseHolidays}
              onChange={(next) => onChange({ omitNyseHolidays: next })}
            />
          </Field>

          <Field
            label="Start Day"
            optional
            htmlFor={startId}
          >
            <CalendarStartDayInput
              id={startId}
              helperId={startHelperId}
              value={formState.startDate}
              onChange={(next) => onChange({ startDate: next })}
            />
          </Field>

          <Field
            label="Include Tasks on the Following Days"
            required
            htmlFor={studyDaysId}
          >
            <StudyDaysToggle
              id={studyDaysId}
              helperId={studyDaysHelperId}
              selected={formState.studyDays}
              onChange={(next) => onChange({ studyDays: next })}
            />
          </Field>

          <Field bare>
            <ProjectedCompletionReadout result={projection} />
          </Field>

          <div style={ctaBarStyle}>
            <button
              type="button"
              onClick={handleSave}
              disabled={!canSave}
              style={{
                ...primaryBtnStyle,
                background: canSave
                  ? 'var(--color-primary-500)'
                  : 'var(--color-neutral-300)',
                cursor: canSave ? 'pointer' : 'not-allowed',
              }}
              onMouseEnter={(e) => {
                if (!canSave) return
                e.currentTarget.style.background = 'var(--color-primary-600)'
              }}
              onMouseLeave={(e) => {
                if (!canSave) return
                e.currentTarget.style.background = 'var(--color-primary-500)'
              }}
            >
              Save Study Plan
            </button>
            {existingCalendar && (
              <button
                type="button"
                onClick={onClose /* placeholder — demo never triggers */}
                style={dangerBtnStyle}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = 'var(--color-error-700)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = 'var(--color-error-500)'
                }}
              >
                Remove Calendar
              </button>
            )}
          </div>
        </div>

        {/* Preview column */}
        <CreateCalendarPreviewPane
          assignedCalendarId={formState.assignedCalendarId || null}
          startDate={formState.startDate || null}
          studyDays={formState.studyDays}
          omitNyseHolidays={formState.omitNyseHolidays}
          projection={projection}
        />
      </div>
    </Modal>
  )
}

/* ─── Field wrapper ────────────────────────────────────────────────── */

function Field({
  label,
  required,
  optional,
  htmlFor,
  bare,
  children,
}: {
  label?: string
  required?: boolean
  optional?: boolean
  htmlFor?: string
  bare?: boolean
  children: React.ReactNode
}) {
  if (bare) return <div style={fieldStyle}>{children}</div>
  return (
    <div style={fieldStyle}>
      <div style={fieldLabelRowStyle}>
        <label htmlFor={htmlFor} style={fieldLabelStyle}>
          {label}
          {required && (
            <span aria-hidden style={reqStyle}>
              *
            </span>
          )}
        </label>
        {optional && <span style={optStyle}>Optional</span>}
      </div>
      {children}
    </div>
  )
}

/* ─── styles ───────────────────────────────────────────────────────── */

const bodyStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'minmax(0, 1fr) 360px',
  // Keep both columns scrollable when the modal can't fit them.
  maxHeight: 'calc(92vh - 70px)',
}

const formColStyle: CSSProperties = {
  padding: '22px 24px 20px',
  background: 'var(--color-surface-card)',
  overflowY: 'auto',
  borderRight: '1px solid var(--color-border-subtle)',
  minHeight: 0,
}

const fieldStyle: CSSProperties = {
  marginBottom: 18,
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

const reqStyle: CSSProperties = {
  color: 'var(--color-error-500)',
  marginLeft: 2,
}

const optStyle: CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontSize: 11,
  color: 'var(--color-text-tertiary)',
  fontWeight: 400,
}

const ctaBarStyle: CSSProperties = {
  marginTop: 6,
  display: 'flex',
  flexDirection: 'column',
  gap: 14,
}

const primaryBtnStyle: CSSProperties = {
  appearance: 'none',
  border: 0,
  borderRadius: 'var(--radius-md)',
  fontFamily: 'var(--font-body)',
  fontWeight: 700,
  fontSize: 14,
  padding: '13px 22px',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 8,
  color: 'var(--color-text-inverse)',
  transition: 'background-color 120ms ease',
}

const dangerBtnStyle: CSSProperties = {
  appearance: 'none',
  border: 0,
  background: 'transparent',
  color: 'var(--color-error-500)',
  fontFamily: 'var(--font-body)',
  fontWeight: 700,
  fontSize: 14,
  padding: '6px 0',
  alignSelf: 'flex-start',
  cursor: 'pointer',
  transition: 'color 120ms ease',
}
