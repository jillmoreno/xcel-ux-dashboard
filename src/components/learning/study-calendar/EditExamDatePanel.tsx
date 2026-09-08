import { useEffect, useId, useMemo, useState, type CSSProperties } from 'react'
import { Sheet } from '@/components/ui/Sheet'
import { Button } from '@/components/ui/Button'
import { X } from '@/icons'
import type { StudyCalendar } from '@/data/studyCalendarFixtures'

type Props = {
  open: boolean
  onClose: () => void
  calendar: StudyCalendar
  /** Fires with the new ISO exam date + optional `HH:mm` time on Save. */
  onSave: (examDate: string, examTime: string) => void
}

/**
 * Edit Exam Date slide-over. Same chrome + footer as the Edit Study
 * Plan panel (`CalendarSettingsSheet`) — Close link, heading, divider,
 * description, and the Save / Cancel footer — but the body exposes the
 * single "Set Exam / Target Date" field. Every other pacing setting is
 * left untouched; only the calendar's exam date changes.
 *
 * Pre-fills from the calendar's current `examDate` so the learner sees
 * their existing target and adjusts it.
 */
export function EditExamDatePanel({ open, onClose, calendar, onSave }: Props) {
  const targetDateId = useId()
  const examTimeId = useId()
  const [examDate, setExamDate] = useState(calendar.examDate)
  const [examTime, setExamTime] = useState(calendar.examTime ?? '')

  // Re-sync to the calendar's saved exam date/time each time the panel
  // opens so a cancelled edit never carries a stale value into the next
  // open.
  useEffect(() => {
    if (open) {
      setExamDate(calendar.examDate)
      setExamTime(calendar.examTime ?? '')
    }
  }, [open, calendar])

  const canSave = examDate !== ''

  // Projected completion = the due date of the last scheduled task. If the
  // learner picks an exam date before that, their plan won't finish in
  // time. We surface a non-blocking warning (they can still save — they
  // may want the earlier date and then compress their plan) rather than
  // hard-blocking, matching the soft-guidance tone used elsewhere in the
  // calendar flows.
  const projectedCompletion = useMemo(() => {
    if (calendar.tasks.length === 0) return null
    return calendar.tasks.reduce(
      (latest, t) => (t.dueDate > latest ? t.dueDate : latest),
      calendar.tasks[0].dueDate,
    )
  }, [calendar.tasks])
  const examBeforeCompletion =
    examDate !== '' &&
    projectedCompletion !== null &&
    examDate < projectedCompletion

  return (
    <Sheet open={open} onClose={onClose} title="Edit Exam Date">
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
          aria-label="Close edit exam date panel"
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
          Edit Exam Date
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
        <p
          style={{
            margin: 0,
            fontFamily: 'var(--font-body)',
            fontSize: 13,
            lineHeight: '18px',
            color: 'var(--color-text-secondary)',
          }}
        >
          Update your exam or target date — task due dates will recalculate
          when you save. Your other pacing settings stay as they are.
        </p>

        {/* Exam date + optional time share one row — the time input
            sits to the right of the date, mirroring the custom-task
            Time field (minus the All-Day toggle). */}
        <div style={examRowStyle}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <Field label="Set Exam / Target Date" htmlFor={targetDateId}>
              <input
                id={targetDateId}
                type="date"
                value={examDate}
                onChange={(e) => setExamDate(e.target.value)}
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

        {examBeforeCompletion && projectedCompletion && (
          <div role="status" aria-live="polite" style={examWarningStyle}>
            <strong style={{ fontWeight: 700 }}>Heads up.</strong> This date is
            before your plan is projected to finish on{' '}
            {formatLongDate(projectedCompletion)}. You can still save it, but
            you&rsquo;ll need to shorten your study plan to be ready in time.
          </div>
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
            onSave(examDate, examTime)
            onClose()
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
          Save Exam Date
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

/* ─── helpers ────────────────────────────────────────────────────── */

const LONG_MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

/** Format an ISO `yyyy-mm-dd` date as "Month D, YYYY". */
function formatLongDate(iso: string): string {
  const [y, m, d] = iso.split('-').map((p) => parseInt(p, 10))
  if (!y || !m || !d) return iso
  return `${LONG_MONTHS[m - 1]} ${d}, ${y}`
}

/* ─── styles ─────────────────────────────────────────────────────── */

// Soft warning surface shown when the chosen exam date precedes the
// plan's projected completion. Matches the "No calendars available"
// banner palette in CalendarSettingsSheet — guidance, not a hard error.
const examWarningStyle: CSSProperties = {
  padding: '10px 12px',
  borderRadius: 'var(--radius-md)',
  background: 'var(--color-warning-100)',
  border: '1px solid var(--color-warning-300)',
  color: 'var(--color-warning-800)',
  fontFamily: 'var(--font-body)',
  fontSize: 13,
  lineHeight: '18px',
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

// Time input sits to the right of the date — sized to its content
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

/* ─── Field wrapper (matches CalendarSettingsSheet) ───────────────── */

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

const hintStyle: CSSProperties = {
  color: 'var(--color-text-tertiary)',
  fontWeight: 400,
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
