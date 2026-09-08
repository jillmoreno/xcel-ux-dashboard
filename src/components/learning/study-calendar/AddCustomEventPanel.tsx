import { useEffect, useId, useState, type CSSProperties } from 'react'
import { Sheet } from '@/components/ui/Sheet'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Select'
import { Toggle } from '@/components/ui/Toggle'
import { Trash, X } from '@/icons'
import type {
  CustomEvent,
  CustomEventRepeat,
  StudyCalendar,
} from '@/data/studyCalendarFixtures'

type Mode = 'add' | 'edit' | 'view'

type Props = {
  open: boolean
  mode: Mode
  /** Calendar this event belongs to. Drives the "Adding event to:"
   *  context line and the default anchor date when add mode opens. */
  calendar: StudyCalendar
  /** Required in edit + view modes — populates the form on open. */
  existingEvent?: CustomEvent
  /** Pre-fill the Date field in add mode. Falls back to the calendar's
   *  startDate when omitted. */
  defaultDate?: string
  onClose: () => void
  onSave: (event: CustomEvent) => void
  /** Called from the Delete Custom Task affordance in edit mode. */
  onDelete?: (eventId: string) => void
  /** Called from the Complete Task CTA in view mode. */
  onComplete?: (eventId: string) => void
  /** Swap the open panel from view → edit when the learner clicks the
   *  Edit secondary action in view mode. */
  onSwitchToEdit?: (eventId: string) => void
}

const REPEAT_OPTIONS: Array<{ value: CustomEventRepeat; label: string }> = [
  { value: 'none', label: 'None' },
  { value: 'daily', label: 'Daily' },
  { value: 'weekday', label: 'Every weekday (Mon–Fri)' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
]

/**
 * Right-anchored Add / Edit Custom Event panel. Mirrors the Edit
 * Calendar pattern: Close top-left → title → divider → body →
 * neutral footer band with the primary CTA. Source design: STC
 * Add Custom Event modal screenshot supplied by Jill on 2026-06-03.
 *
 * Add mode shows a single primary "+ Add New Custom Event" CTA in
 * the footer. Edit mode swaps to "Save Changes" and reveals a
 * secondary "Delete Event" affordance — only ever shown when the
 * panel was opened against an existing event, per the spec.
 *
 * All Day Event? disables and clears the Time field per the agreed
 * UX so the saved event never carries a stale time.
 */
export function AddCustomEventPanel({
  open,
  mode,
  calendar,
  existingEvent,
  defaultDate,
  onClose,
  onSave,
  onDelete,
  onComplete,
  onSwitchToEdit,
}: Props) {
  const titleInputId = useId()
  const dateId = useId()
  const repeatId = useId()
  const timeId = useId()

  const [title, setTitle] = useState('')
  const [date, setDate] = useState('')
  const [repeat, setRepeat] = useState<CustomEventRepeat>('none')
  const [time, setTime] = useState('')
  const [allDay, setAllDay] = useState(false)
  // Internal flag for the in-panel delete confirmation step. The
  // edit-mode Delete link flips this on; "No, cancel." flips it back;
  // "Yes, delete." fires `onDelete` and the parent closes the panel.
  // Resets whenever the panel opens or the mode changes so a stale
  // confirmation never carries across sessions.
  const [confirmingDelete, setConfirmingDelete] = useState(false)

  // Reset form whenever the panel opens. Sheet keeps children mounted
  // when closed, so we can't rely on the natural unmount lifecycle.
  // Edit + view modes both pre-fill from the existing event.
  useEffect(() => {
    if (!open) return
    setConfirmingDelete(false)
    if ((mode === 'edit' || mode === 'view') && existingEvent) {
      setTitle(existingEvent.title)
      setDate(existingEvent.date)
      setRepeat(existingEvent.repeat)
      setTime(existingEvent.time ?? '')
      setAllDay(existingEvent.allDay)
    } else {
      setTitle('')
      setDate(defaultDate ?? calendar.startDate)
      setRepeat('none')
      setTime('')
      setAllDay(false)
    }
  }, [open, mode, existingEvent, defaultDate, calendar.startDate])

  const isView = mode === 'view'
  const canSave = title.trim() !== '' && date !== ''
  const heading = confirmingDelete
    ? 'Delete Custom Task'
    : mode === 'edit'
      ? 'Edit Custom Task'
      : mode === 'view'
        ? 'View Custom Task'
        : 'Add Task'
  const contextLabel =
    mode === 'edit'
      ? 'Editing custom task in:'
      : mode === 'view'
        ? 'Viewing custom task in:'
        : 'Adding custom task to:'

  const handleSave = () => {
    if (!canSave) return
    const next: CustomEvent = {
      id: existingEvent?.id ?? `custom-${Date.now()}`,
      title: title.trim(),
      date,
      repeat,
      time: allDay || time === '' ? undefined : time,
      allDay,
      pathId: existingEvent?.pathId,
    }
    onSave(next)
  }

  return (
    <Sheet open={open} onClose={onClose} title={heading}>
      <header style={headerStyle}>
        <button
          type="button"
          aria-label={`Close ${heading} panel`}
          onClick={onClose}
          className="cre-sheet-close"
          style={closeBtnStyle}
        >
          <X size={14} aria-hidden />
          Close
        </button>
        <h2 style={titleStyle}>{heading}</h2>
      </header>
      <div aria-hidden style={dividerStyle} />

      <div style={bodyStyle}>
        {confirmingDelete && existingEvent ? (
          // Destructive confirmation step. Replaces the entire form
          // body so the question + actions are the only thing on the
          // panel. Source pattern: reference "Delete Bookmark" screen
          // — same slide-over chrome with the title swapped, a single
          // question, and a Yes/No button pair in error tones.
          <DeleteConfirmation
            taskTitle={existingEvent.title}
            onConfirm={() => onDelete?.(existingEvent.id)}
            onCancel={() => setConfirmingDelete(false)}
          />
        ) : (
        <>
        <div style={contextRowStyle}>
          <span style={contextLabelStyle}>{contextLabel}</span>
          <strong style={contextNameStyle}>{calendar.name}</strong>
        </div>

        <Field label="Custom Task Title" htmlFor={titleInputId}>
          <input
            id={titleInputId}
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Custom Task Title"
            aria-required="true"
            disabled={isView}
            style={isView ? readOnlyTextStyle : textInputStyle}
          />
        </Field>

        <div style={twoColStyle}>
          <Field label="Date" htmlFor={dateId}>
            <input
              id={dateId}
              type="date"
              value={date}
              min={calendar.startDate}
              max={calendar.examDate}
              onChange={(e) => setDate(e.target.value)}
              aria-required="true"
              disabled={isView}
              style={isView ? readOnlyDateStyle : dateInputStyle}
            />
          </Field>

          <Field label="Repeat?" htmlFor={repeatId}>
            <Select
              id={repeatId}
              options={REPEAT_OPTIONS}
              value={repeat}
              onChange={(e) => setRepeat(e.target.value as CustomEventRepeat)}
              label="Repeat"
              disabled={isView}
              style={{ width: '100%', display: 'flex' }}
            />
          </Field>
        </div>

        <Field label="Time" optional htmlFor={timeId}>
          {/* Time input + All-day Toggle share one row so the two
              read as paired controls — the toggle is the "no, this
              one's all day" override for the time input next to it.
              `switchPosition="left"` puts the switch first and the
              label immediately after, same pairing the Edit Calendar
              panel's NYSE-holidays toggle uses. */}
          <div style={timeRowStyle}>
            <input
              id={timeId}
              type="time"
              value={time}
              disabled={allDay || isView}
              onChange={(e) => setTime(e.target.value)}
              style={timeInputStyle(allDay || isView)}
            />
            <Toggle
              label="All Day Custom Task"
              checked={allDay}
              onChange={(next) => {
                setAllDay(next)
                // Clearing the time on switch-on keeps the saved
                // event from carrying a stale value the disabled
                // Time input wouldn't otherwise wipe.
                if (next) setTime('')
              }}
              disabled={isView}
              switchPosition="left"
            />
          </div>
        </Field>

        {/* Destructive affordance — only visible in edit mode. Mirrors
            the "Delete this Bookmark" pattern from the reference design:
            trash glyph + CTA-blue semibold text-link, anchored below the
            form fields instead of in the footer. Clicking flips the
            panel into the confirmation step (see DeleteConfirmation). */}
        {mode === 'edit' && existingEvent && onDelete && (
          <div>
            <button
              type="button"
              onClick={() => setConfirmingDelete(true)}
              style={deleteTextLinkStyle}
              className="cre-link-action"
            >
              <Trash size={14} aria-hidden />
              Delete Custom Task
            </button>
          </div>
        )}
        </>
        )}
      </div>

      {/* Footer is suppressed during the delete confirmation step —
          Yes / No buttons are part of the confirmation body instead so
          the panel reads as a single committed action. */}
      {!confirmingDelete && (
      <footer style={footerStyle}>
        {mode === 'view' && existingEvent ? (
          // View-mode footer: primary "Complete Task" + secondary "Edit"
          // side-by-side. Mirrors the Save / Cancel pairing from the
          // Create Calendar panel so the two read-only-style panels
          // share the same footer shape.
          <div style={{ display: 'flex', gap: 16 }}>
            <Button
              variant="primary"
              size="md"
              onClick={() => onComplete?.(existingEvent.id)}
              style={primaryActionStyle}
            >
              Complete Task
            </Button>
            <Button
              variant="secondary"
              size="md"
              onClick={() => onSwitchToEdit?.(existingEvent.id)}
              style={primaryActionStyle}
            >
              Edit
            </Button>
          </div>
        ) : (
          // Add + Edit footer: single primary CTA. Delete (edit mode)
          // now lives in the body as a text link, so the footer is
          // reserved for the commit action.
          <Button
            variant="primary"
            size="md"
            disabled={!canSave}
            onClick={handleSave}
            style={{
              ...primaryActionStyle,
              ...(canSave
                ? {}
                : {
                    background: 'var(--color-neutral-disabled)',
                    borderColor: 'var(--color-neutral-disabled)',
                    color: 'var(--color-neutral-dark)',
                    cursor: 'not-allowed',
                  }),
            }}
          >
            {mode === 'edit' ? 'Save Changes' : 'Add New Custom Task'}
          </Button>
        )}
      </footer>
      )}
    </Sheet>
  )
}

/**
 * Inline destructive-confirmation step. Renders inside the panel's
 * body when `confirmingDelete` is true. Pattern sourced from the
 * reference "Delete Bookmark" screen — a single short question with
 * the task title quoted inline, followed by a Yes / No button pair
 * in error tones (filled + outlined respectively).
 */
function DeleteConfirmation({
  taskTitle,
  onConfirm,
  onCancel,
}: {
  taskTitle: string
  onConfirm: () => void
  onCancel: () => void
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <p style={confirmCopyStyle}>
        Are you sure you wish to delete{' '}
        <strong style={{ fontWeight: 700 }}>“{taskTitle}”</strong>?
      </p>
      <div style={{ display: 'flex', gap: 16 }}>
        <button
          type="button"
          onClick={onConfirm}
          className="cre-delete-confirm-yes"
          style={confirmDeleteBtnStyle}
        >
          Yes, delete.
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="cre-delete-confirm-no"
          style={cancelDeleteBtnStyle}
        >
          No, cancel.
        </button>
      </div>
    </div>
  )
}

/* ─── Field wrapper — required fields render the label only.
       Optional fields render "(Optional)" inline beside the label in
       a tertiary tone + regular weight, mirroring the inline
       `(Defaults to today)` hint pattern used by the Create Calendar
       / Edit Calendar panels (see CreateCalendarPanel.tsx). */
function Field({
  label,
  optional,
  htmlFor,
  children,
}: {
  label: string
  optional?: boolean
  htmlFor?: string
  children: React.ReactNode
}) {
  return (
    <div>
      <label htmlFor={htmlFor} style={fieldLabelStyle}>
        {label}
        {optional && <span style={optionalHintStyle}> (Optional)</span>}
      </label>
      {children}
    </div>
  )
}

/* ─── styles ─────────────────────────────────────────────────────── */

const headerStyle: CSSProperties = {
  padding: '20px 20px 12px',
  display: 'flex',
  flexDirection: 'column',
  gap: 12,
}

const closeBtnStyle: CSSProperties = {
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
}

const titleStyle: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-heading)',
  fontWeight: 600,
  fontSize: 22,
  lineHeight: '28px',
  color: 'var(--color-text-primary)',
}

const dividerStyle: CSSProperties = {
  height: 1,
  background: 'var(--color-border-subtle)',
}

const bodyStyle: CSSProperties = {
  flex: 1,
  overflowY: 'auto',
  padding: '20px 24px 24px',
  display: 'flex',
  flexDirection: 'column',
  gap: 24,
}

const contextRowStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 2,
  padding: '0 0 4px',
}

const contextLabelStyle: CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontSize: 13,
  color: 'var(--color-text-secondary)',
}

const contextNameStyle: CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontSize: 15,
  fontWeight: 700,
  color: 'var(--color-text-primary)',
}

const twoColStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: 16,
}

const fieldLabelStyle: CSSProperties = {
  // Block + bottom margin replace the previous flex-row wrapper, since
  // "(Optional)" now sits inline next to the label text rather than
  // floating to the right edge.
  display: 'block',
  marginBottom: 6,
  fontFamily: 'var(--font-body)',
  fontWeight: 700,
  fontSize: 13,
  color: 'var(--color-text-primary)',
}

// Inline parenthetical — matches CreateCalendarPanel's `hintStyle`:
// inherits the label's font-size so the two read as one continuous
// line, then drops weight + tone so the parenthetical reads as
// secondary metadata.
const optionalHintStyle: CSSProperties = {
  color: 'var(--color-text-tertiary)',
  fontWeight: 400,
}

const textInputStyle: CSSProperties = {
  width: '100%',
  height: 40,
  padding: '0 12px',
  border: '1px solid var(--color-border-subtle)',
  borderRadius: 'var(--radius-md)',
  background: 'var(--color-surface-card)',
  color: 'var(--color-text-primary)',
  fontFamily: 'var(--font-body)',
  fontSize: 14,
  boxSizing: 'border-box',
}

// Read-only treatment applied in view mode — neutral-100 background +
// secondary text so the field reads as "value, not editable" rather
// than just a greyed-out form input.
const readOnlyTextStyle: CSSProperties = {
  ...textInputStyle,
  background: 'var(--color-neutral-100)',
  color: 'var(--color-text-secondary)',
  cursor: 'not-allowed',
}

const readOnlyDateStyle: CSSProperties = {
  ...readOnlyTextStyle,
  colorScheme: 'light',
}

// Shared footer-button sizing. Reused by add (single full-width
// button), edit (full-width Save + secondary Delete link), and view
// (Complete Task + Edit side-by-side).
const primaryActionStyle: CSSProperties = {
  flex: 1,
  height: 52,
  padding: '12px 32px',
  borderRadius: 8,
  fontSize: 16,
  lineHeight: '28px',
}

const dateInputStyle: CSSProperties = {
  ...textInputStyle,
  // `colorScheme: 'light'` forces the native popover to render light
  // even when the host OS is in dark mode — the rest of the app ships
  // light-only. Matches the Create Calendar / Edit Calendar panels.
  colorScheme: 'light',
}

// Row that pairs the Time input with the All-day Toggle. Center
// alignment + 12px gap matches the visual rhythm of the original
// checkbox pairing this layout replaces.
const timeRowStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 12,
}

const timeInputStyle = (disabled: boolean): CSSProperties => ({
  ...textInputStyle,
  // Shrink the input so the Toggle sits comfortably beside it
  // instead of being shoved off-row by a 100%-wide input.
  width: 'auto',
  flex: '0 0 auto',
  minWidth: 160,
  colorScheme: 'light',
  background: disabled ? 'var(--color-neutral-100)' : 'var(--color-surface-card)',
  color: disabled ? 'var(--color-text-tertiary)' : 'var(--color-text-primary)',
  cursor: disabled ? 'not-allowed' : 'text',
})

const footerStyle: CSSProperties = {
  padding: '24px 32px',
  background: 'var(--color-neutral-light)',
  borderBottomLeftRadius: 16,
  display: 'flex',
  flexDirection: 'column',
  gap: 12,
}

// CTA-blue text-link styling for the in-body Delete action. Mirrors
// the "Delete this Bookmark" treatment in the reference design: trash
// glyph + semibold CTA-blue text, left-aligned, no underline at rest.
// `.cre-link-action` (added via className) supplies the hover darken +
// focus-visible ring so the link behaves like other text-link
// affordances across the app.
const deleteTextLinkStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  background: 'transparent',
  border: 'none',
  padding: 0,
  fontFamily: 'var(--font-body)',
  fontSize: 14,
  fontWeight: 600,
  color: 'var(--color-cta-500)',
  cursor: 'pointer',
}

/* ─── Delete confirmation step ─────────────────────────────────────── */

const confirmCopyStyle: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-body)',
  fontSize: 15,
  lineHeight: '24px',
  color: 'var(--color-text-primary)',
}

// Shared button shell for the Yes / No pair. Mirrors `primaryActionStyle`
// dimensions so the confirmation buttons sit at the same height as the
// other panel CTAs. Color + hover states are owned by the
// `.cre-delete-confirm-yes` / `.cre-delete-confirm-no` CSS classes in
// `tokens.css` (sourced from Figma node `2006:15814` — `#db4c4c`
// default → `#cb0000` hover; the outlined button gains a 3px visual
// border on hover via an inset shadow so width doesn't shift).
const confirmActionShellStyle: CSSProperties = {
  flex: 1,
  height: 52,
  padding: '12px 24px',
  borderRadius: 8,
  fontFamily: 'var(--font-body)',
  fontSize: 16,
  fontWeight: 600,
  lineHeight: '28px',
  cursor: 'pointer',
}

const confirmDeleteBtnStyle: CSSProperties = {
  ...confirmActionShellStyle,
}

const cancelDeleteBtnStyle: CSSProperties = {
  ...confirmActionShellStyle,
}
