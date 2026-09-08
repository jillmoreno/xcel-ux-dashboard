import { useEffect, useState, type CSSProperties, type ReactNode } from 'react'
import { Sheet } from '@/components/ui/Sheet'
import {
  CalendarDay,
  CalendarPen,
  Check,
  ClipboardList,
  PenToSquare,
  Trash,
  X,
} from '@/icons'

type Props = {
  open: boolean
  onClose: () => void
  /** Opens the Edit Calendar slide-over. The actions panel closes
   *  first so the two slide-overs don't stack. */
  onEditCalendar?: () => void
  /** Opens the printable Study Calendar view in a new tab. */
  onViewCalendar?: () => void
  /** Opens the printable Task List view in a new tab. */
  onViewTaskList?: () => void
  /** Opens the Add Custom Event slide-over in add mode. */
  onAddCustomEvent?: () => void
  /** Opens the Edit Exam Date slide-over. The actions panel closes
   *  first so the two slide-overs don't stack. */
  onEditExamDate?: () => void
  /** Wipes all session-only custom tasks. Confirmation is handled by
   *  this panel — by the time this fires, the learner has already
   *  clicked through "Yes, delete." */
  onDeleteAllCustomTasks?: () => void
  /** Total custom-task count on the calendar — shown inside the
   *  delete-all confirmation copy so the learner knows exactly how
   *  many entries are about to be wiped. */
  customTaskCount?: number
}

type ActionTile = {
  id: string
  label: ReactNode
  icon: ReactNode
  onClick: () => void
}

/**
 * Calendar Actions slide-over. Right-anchored 480px panel that
 * surfaces every per-calendar action behind a single Calendar
 * Actions link on the Study Calendar tab toolbar. Sourced from Figma
 * node `3370:16329`.
 *
 * Body content: a "What would you like to do?" subtitle followed by
 * a 3×2 grid of square action tiles. Each tile is a white card with
 * a teal icon centered on top and a two-line teal label below.
 *
 * Add Custom Task / Add Exam Date / Delete All Custom Events are
 * stubs for now — they fire a "Coming soon" toast since the
 * underlying flows haven't been designed yet. View Calendar / View
 * Task List / Edit Calendar wire into the existing handlers.
 */
export function CalendarActionsPanel({
  open,
  onClose,
  onEditCalendar,
  onViewCalendar,
  onViewTaskList,
  onAddCustomEvent,
  onEditExamDate,
  onDeleteAllCustomTasks,
  customTaskCount = 0,
}: Props) {
  // Internal flag for the in-panel "delete all" confirmation step.
  // The Delete All Custom Tasks tile flips this on; "No, cancel."
  // flips it back; "Yes, delete." fires `onDeleteAllCustomTasks` and
  // the parent closes the panel. Reset whenever the panel reopens so
  // a stale confirmation never carries across sessions.
  const [confirmingDeleteAll, setConfirmingDeleteAll] = useState(false)

  useEffect(() => {
    if (open) setConfirmingDeleteAll(false)
  }, [open])

  const actions: ActionTile[] = [
    {
      id: 'view-calendar',
      label: (
        <>
          View Full
          <br />
          Calendar
        </>
      ),
      icon: <CalendarDay size={22} aria-hidden />,
      onClick: () => {
        onClose()
        onViewCalendar?.()
      },
    },
    {
      id: 'view-task-list',
      label: (
        <>
          View Full
          <br />
          Task List
        </>
      ),
      icon: <ClipboardList size={22} aria-hidden />,
      onClick: () => {
        onClose()
        onViewTaskList?.()
      },
    },
    {
      id: 'edit-calendar',
      label: (
        <>
          Edit
          <br />
          Study Plan
        </>
      ),
      icon: <PenToSquare size={22} aria-hidden />,
      onClick: () => {
        onClose()
        onEditCalendar?.()
      },
    },
    {
      id: 'add-custom-task',
      label: 'Add Task',
      icon: <Check size={22} aria-hidden />,
      onClick: () => {
        onClose()
        onAddCustomEvent?.()
      },
    },
    {
      id: 'edit-exam-date',
      label: (
        <>
          Edit
          <br />
          Exam Date
        </>
      ),
      icon: <CalendarPen size={22} aria-hidden />,
      onClick: () => {
        onClose()
        onEditExamDate?.()
      },
    },
    {
      id: 'delete-custom-events',
      label: (
        <>
          Delete All
          <br />
          Custom Tasks
        </>
      ),
      icon: <Trash size={22} aria-hidden />,
      onClick: () => setConfirmingDeleteAll(true),
    },
  ]

  const heading = confirmingDeleteAll
    ? 'Delete All Custom Tasks'
    : 'Study Plan Actions'

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
          {confirmingDeleteAll ? (
            // Destructive confirmation step. Replaces the tile grid
            // with the question + Yes/No buttons, mirroring the
            // single-task delete pattern in AddCustomEventPanel.
            <DeleteAllConfirmation
              count={customTaskCount}
              onConfirm={() => onDeleteAllCustomTasks?.()}
              onCancel={() => setConfirmingDeleteAll(false)}
            />
          ) : (
            <>
              <p style={subtitleStyle}>What would you like to do?</p>
              <div style={gridStyle}>
                {actions.map((a) => (
                  <ActionTileButton key={a.id} action={a} />
                ))}
              </div>
            </>
          )}
        </div>
    </Sheet>
  )
}

function ActionTileButton({ action }: { action: ActionTile }) {
  return (
    <button
      type="button"
      onClick={action.onClick}
      className="cre-panel-tile"
      style={tileStyle}
    >
      <span aria-hidden style={iconWrapStyle}>
        {action.icon}
      </span>
      <span style={labelStyle}>{action.label}</span>
    </button>
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
  border: 'none',
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
  fontSize: 24,
  lineHeight: '32px',
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
  gap: 16,
}

const subtitleStyle: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-body)',
  fontSize: 14,
  fontWeight: 600,
  color: 'var(--color-text-primary)',
}

const gridStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(3, 1fr)',
  gap: 20,
}

const tileStyle: CSSProperties = {
  // Per Colibri DS CTA Buttons (Sheet), Figma `8236:3314`. Each tile is
  // a 116×116 square with five states (default, hover, pressed, focus,
  // disabled) — all owned by the `.cre-panel-tile` class in tokens.css
  // so every brand picks up its own ramp via `--color-action` /
  // `--color-action-hover`. The inline rules here cover layout-only
  // concerns the class deliberately leaves to the call site.
  aspectRatio: '1 / 1',
  width: '100%',
  borderRadius: 'var(--radius-md)',
  cursor: 'pointer',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 12,
  padding: '12px 8px',
  fontFamily: 'var(--font-body)',
}

const iconWrapStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: 'inherit',
}

const labelStyle: CSSProperties = {
  textAlign: 'center',
  fontSize: 13,
  fontWeight: 600,
  lineHeight: '18px',
  color: 'inherit',
}

/**
 * Inline destructive-confirmation step. Same pattern as the single-
 * task delete inside AddCustomEventPanel — short question + Yes/No
 * button pair in error tones. The bolded count makes the destructive
 * scope unambiguous before the learner confirms.
 */
function DeleteAllConfirmation({
  count,
  onConfirm,
  onCancel,
}: {
  count: number
  onConfirm: () => void
  onCancel: () => void
}) {
  // e.g. "1 custom task" / "5 custom tasks" — pluralizes the noun
  // only, so the count reads cleanly without a stray "all" qualifier
  // that would feel odd for `count === 1`.
  const noun = `${count} custom task${count === 1 ? '' : 's'}`
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <p style={confirmCopyStyle}>
        Are you sure you wish to delete{' '}
        <strong style={{ fontWeight: 700 }}>{noun}</strong>? This
        can&rsquo;t be undone.
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

const confirmCopyStyle: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-body)',
  fontSize: 15,
  lineHeight: '24px',
  color: 'var(--color-text-primary)',
}

// Same shell sizing as `AddCustomEventPanel`'s confirmation buttons so
// the two destructive flows share visual rhythm. Color + hover states
// are owned by the `.cre-delete-confirm-yes` / `.cre-delete-confirm-no`
// CSS classes in `tokens.css` (sourced from Figma node `2006:15814` —
// `#db4c4c` default → `#cb0000` hover; the outlined button gains a
// 3px visual border on hover via an inset shadow). Inline styles here
// cover layout-only concerns the classes deliberately leave to call
// sites.
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
