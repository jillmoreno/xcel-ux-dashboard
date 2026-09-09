import { useEffect, useRef, useState, type ReactNode } from 'react'
import {
  BookOpen,
  CalendarDay,
  CircleCheck,
  ClipboardList,
  FileText,
  Library,
  MoreVertical,
  Video,
} from '@/icons'
import { Modal } from '@/components/ui/Modal'
import type { StudyTask, StudyTaskKind, StudyTaskStatus } from '@/data/studyCalendarFixtures'

const KIND_LABEL: Record<StudyTaskKind, string> = {
  video: 'Video',
  quiz: 'Quiz',
  exam: 'Exam',
  reading: 'Reading',
  custom: 'Custom',
}

function KindIcon({ kind, size = 16 }: { kind: StudyTaskKind; size?: number }): ReactNode {
  switch (kind) {
    case 'video':
      return <Video size={size} aria-hidden />
    case 'quiz':
      return <ClipboardList size={size} aria-hidden />
    case 'exam':
      return <Library size={size} aria-hidden />
    case 'reading':
      return <BookOpen size={size} aria-hidden />
    case 'custom':
      return <CalendarDay size={size} aria-hidden />
  }
}

function statusLabel(status: StudyTaskStatus): string {
  switch (status) {
    case 'completed':
      return 'Completed'
    case 'in-progress':
      return 'In Progress'
    case 'overdue':
      return 'Overdue'
    case 'upcoming':
      // The internal status key stays `upcoming` for backwards compat,
      // but the user-facing label is "Not Started" to align with the
      // Mandatory card progress copy used elsewhere on the page.
      return 'Not Started'
  }
}

// Kind-icon container colors mirror the StatusBadge tones so the icon tint
// reads as a quiet echo of the status badge on the right.
function kindIconColors(status: StudyTaskStatus): { bg: string; fg: string } {
  switch (status) {
    case 'completed':
      return { bg: 'var(--color-success-100)', fg: 'var(--color-success-800)' }
    case 'in-progress':
      return { bg: 'var(--color-primary-100)', fg: 'var(--color-primary-800)' }
    case 'overdue':
      return { bg: 'var(--color-warning-100)', fg: 'var(--color-warning-800)' }
    case 'upcoming':
      return { bg: 'var(--color-neutral-100)', fg: 'var(--color-neutral-darkest)' }
  }
}

function formatDueDate(iso: string): string {
  const [, m, d] = iso.split('-').map((p) => parseInt(p, 10))
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  return `${months[m - 1]} ${d}`
}

type Props = {
  task: StudyTask
  /** Show the due date above the title (used by Task List view headers). */
  showDueDate?: boolean
  /**
   * Compact rendering used inside the Calendar side panel: drops the date
   * label so only the status badge + kebab sit on the right of the card.
   */
  compact?: boolean
  /**
   * External demo-completion flag, lifted to the parent so the parent can
   * re-sort the list when a card is marked complete. When `true`, the card
   * renders as completed regardless of `task.status`.
   */
  demoCompleted?: boolean
  /** Called when the learner marks a demo card complete (via either the
   *  inline CTA or the kebab dropdown). The parent uses this to update
   *  the shared completion set so the sort drops the card to the bottom. */
  onMarkDemoComplete?: (taskId: string) => void
}

export function TaskRow({
  task,
  showDueDate = false,
  compact = false,
  demoCompleted = false,
  onMarkDemoComplete,
}: Props) {
  // Title-prefix-driven affordances:
  //   - "Complete …" → kebab hidden entirely (no actions to offer).
  //   - "Read …" / "View …" → resource-style row: left icon swaps to a
  //     document/PDF glyph and the kebab opens a small action menu
  //     (Mark complete / Open).
  //   - Reading-kind without any prefix match (e.g. "Review …") →
  //     interactive "demo" card. See `isDemoCard` below.
  // Match the FIRST word so e.g. "Review" doesn't accidentally trigger
  // the "Read" path.
  const firstWord = task.title.trim().split(/\s+/)[0]?.toLowerCase() ?? ''
  const startsWithComplete = firstWord === 'complete'
  const isResourceRow = firstWord === 'read' || firstWord === 'view'
  // Demo card: BookOpen + kebab cards (reading kind without Read / View /
  // Complete prefix, not already completed by the fixture). Get the
  // interactive empty-state-modal + "Mark as complete" flow. Local-only
  // state — resets on page refresh so the workflow can be replayed.
  const isDemoCardCandidate =
    task.kind === 'reading' &&
    !startsWithComplete &&
    !isResourceRow &&
    task.status !== 'completed'
  // Local "seen" state — tracks whether this card has had its modal opened
  // at least once. Stays per-mount; only affects whether the right-side
  // shows the "Mark as complete" CTA. The terminal "completed" flag is
  // OWNED BY THE PARENT (`demoCompleted` prop) so the parent's sort can
  // bucket this row into the Completed group when the learner marks it.
  const [demoSeen, setDemoSeen] = useState(false)
  const [demoModalOpen, setDemoModalOpen] = useState(false)
  const isDemoCompleted = isDemoCardCandidate && demoCompleted
  const showMarkCompleteCta =
    isDemoCardCandidate && demoSeen && !isDemoCompleted
  const handleDemoMarkComplete = () => {
    onMarkDemoComplete?.(task.id)
  }
  // Effective status: when the demo flow marks the card complete, treat
  // every downstream check (icon, strikethrough, kebab visibility,
  // status text) as if the underlying task were already completed.
  const effectiveStatus: StudyTaskStatus = isDemoCompleted
    ? 'completed'
    : task.status
  const isCompleted = effectiveStatus === 'completed'
  const isInProgress = effectiveStatus === 'in-progress'
  const isOverdue = effectiveStatus === 'overdue'
  const kindColors = kindIconColors(effectiveStatus)
  const progressValue = Math.max(0, Math.min(100, Math.round(task.progress ?? 0)))
  // Hide the kebab entirely for:
  //   - any completed task (done is done, no actions left)
  //   - "Complete …" prefixed tasks (the prompt itself is to complete it)
  //   - demo cards already showing the "Mark as complete" CTA — the CTA
  //     and the kebab's "Mark as complete" item would be redundant, so
  //     once the CTA appears the kebab steps aside.
  // We still render a 32×32 transparent placeholder in those cases so
  // the status text column stays vertically aligned across cards.
  const hideKebab = isCompleted || startsWithComplete || showMarkCompleteCta
  const kebab: ReactNode = hideKebab ? (
    <span
      aria-hidden
      style={{ display: 'inline-block', width: 32, height: 32, flexShrink: 0 }}
    />
  ) : isResourceRow ? (
    <TaskActionMenu task={task} />
  ) : isDemoCardCandidate ? (
    // Reading-kind / non-prefix card → same dropdown menu shape as Read/View,
    // but the actions actually flip local demo state rather than logging.
    <TaskActionMenu
      task={task}
      onMarkComplete={handleDemoMarkComplete}
      onOpen={() => setDemoModalOpen(true)}
    />
  ) : (
    <button
      type="button"
      aria-label={`More actions for ${task.title}`}
      className="cre-card-kebab"
    >
      <MoreVertical size={16} aria-hidden />
    </button>
  )

  // Card-body click — only for demo cards that haven't been completed yet.
  // Skip when the click bubbled from a button (kebab dropdown, action CTA).
  const handleCardClick = (e: React.MouseEvent<HTMLLIElement>) => {
    if (!isDemoCardCandidate || isDemoCompleted) return
    if ((e.target as HTMLElement).closest('button')) return
    setDemoModalOpen(true)
  }
  const closeDemoModal = () => {
    setDemoModalOpen(false)
    // First time the modal closes, flip pristine → seen so the right side
    // swaps the status label for the "Mark as complete" CTA.
    if (!demoSeen) setDemoSeen(true)
  }

  return (
    <li
      className="cre-task-card"
      onClick={handleCardClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        // WRAP, in `compact` only. The status cluster is `flexShrink: 0`, so in
        // a container narrower than about 320px it holds its ~110px and the
        // title column collapses — measured at 48px in the dashboard's Jump
        // Back In card, narrow enough that `overflow-wrap: anywhere` was
        // breaking words mid-syllable ("Insura / nce"). Wrapping drops the
        // cluster onto its own line instead, which keeps the status AND the
        // title readable; nothing wraps at the Study Plan page's width, so that
        // surface is unaffected. Scoped to `compact` because only the narrow
        // callers (the calendar side panel, the dashboard card) can hit it.
        flexWrap: compact ? 'wrap' : undefined,
        // Reduced from 14px top/bottom → 10px to tighten vertical rhythm
        // when many cards stack in the inline calendar's task column.
        padding: '10px 16px',
        background: 'var(--color-surface-card)',
        border: `1px solid ${
          isOverdue ? 'var(--color-warning-400)' : 'var(--color-border-subtle)'
        }`,
        borderRadius: 'var(--radius-md)',
        boxShadow: 'var(--shadow-card)',
        listStyle: 'none',
        // Demo cards become click-to-open until they've been completed.
        cursor:
          isDemoCardCandidate && !isDemoCompleted ? 'pointer' : undefined,
      }}
    >
      <span
        aria-hidden
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 36,
          height: 36,
          flexShrink: 0,
          borderRadius: 'var(--radius-md)',
          background: kindColors.bg,
          color: kindColors.fg,
        }}
      >
        {/* Left-icon priority:
              1. Completed → CircleCheck, regardless of title prefix. "Done"
                 is the strongest signal we can give the learner.
              2. Read/View ("resource" rows) → FileText (PDF-style glyph).
              3. Otherwise → kind icon (Video / Reading / Exam / Quiz / Custom).
            Kind / context still surface in the meta line below the title. */}
        {isCompleted ? (
          <CircleCheck size={18} aria-hidden />
        ) : isResourceRow ? (
          <FileText size={18} aria-hidden />
        ) : (
          <KindIcon kind={task.kind} size={18} />
        )}
      </span>
      <div
        style={{
          flex: 1,
          // `compact` gives the title a FLOOR rather than letting it collapse
          // to nothing: below this the row wraps (see `flexWrap` above) and the
          // status cluster takes the next line. 150px is roughly the widest
          // single word these titles carry plus breathing room.
          minWidth: compact ? 150 : 0,
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
        }}
      >
        {/* Title — wraps freely. Long titles flow to multiple lines
            instead of ellipsis-truncating. */}
        <span
          style={{
            fontFamily: 'var(--font-body)',
            fontWeight: 600,
            fontSize: 14,
            lineHeight: '20px',
            color: 'var(--color-text-primary)',
            textDecoration: isCompleted ? 'line-through' : undefined,
            opacity: isCompleted ? 0.7 : 1,
            overflowWrap: 'anywhere',
          }}
        >
          {task.title}
        </span>
        {/* Meta line below the title — kind · (context ·) duration.
            When `showDueDate` is true (inline calendar's All Tasks list)
            the formatted due date is prepended in the same mixed-case
            middle-dot style, e.g. "May 18 · Reading · 45 min". Rendered as
            plain text (not flex) so it wraps as one continuous string when
            the card is narrow rather than breaking each segment onto its
            own line. */}
        <span
          style={{
            display: 'block',
            fontFamily: 'var(--font-body)',
            fontSize: 12,
            color: 'var(--color-text-secondary)',
            lineHeight: '16px',
          }}
        >
          {[
            showDueDate ? formatDueDate(task.dueDate) : null,
            KIND_LABEL[task.kind],
            task.context ?? null,
            `${task.durationMin} min`,
          ]
            .filter((part): part is string => Boolean(part))
            .join(' · ')}
        </span>
        {/* In-progress tasks render a full-width progress bar at the
            bottom of the inner column so it spans the available card
            width regardless of how many lines the title wrapped to. */}
        {isInProgress && <FullWidthProgress value={progressValue} />}
      </div>
      {compact ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          {/* All four statuses render as plain dark text (no pill) for
              visual consistency. For in-progress, the text sits alongside
              the kebab; the actual percent + bar live below the title.
              Demo cards in 'seen' state swap the label for a "Mark as
              complete" CTA so the next action is one click away. */}
          {showMarkCompleteCta ? (
            <MarkAsCompleteButton onClick={handleDemoMarkComplete} />
          ) : (
            <StatusTextLabel status={effectiveStatus} />
          )}
          {kebab}
        </div>
      ) : (
        <RightCluster
          status={effectiveStatus}
          kebab={kebab}
          markCompleteCta={
            showMarkCompleteCta ? (
              <MarkAsCompleteButton onClick={handleDemoMarkComplete} />
            ) : null
          }
        />
      )}
      {isDemoCardCandidate && (
        // Empty-state modal — minimal "no content yet" stub. Closing it
        // is the trigger that promotes pristine → seen on first open.
        <Modal
          open={demoModalOpen}
          onClose={closeDemoModal}
          title={task.title}
          width={560}
        >
          <div
            style={{
              padding: '32px 32px 40px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
              gap: 12,
            }}
          >
            <span
              aria-hidden
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 56,
                height: 56,
                borderRadius: 'var(--radius-pill)',
                background: 'var(--color-neutral-75)',
                color: 'var(--color-text-secondary)',
              }}
            >
              <FileText size={24} aria-hidden />
            </span>
            <p
              style={{
                margin: 0,
                fontFamily: 'var(--font-body)',
                fontSize: 14,
                lineHeight: '20px',
                color: 'var(--color-text-secondary)',
                maxWidth: 360,
              }}
            >
              No content available for this task yet. Close this window to mark it as
              something to come back to.
            </p>
          </div>
        </Modal>
      )}
    </li>
  )
}

function RightCluster({
  status,
  kebab,
  markCompleteCta,
}: {
  status: StudyTaskStatus
  /** Kebab / action menu JSX — caller decides which variant (default,
   *  hidden, or dropdown) based on the task's title prefix. */
  kebab: ReactNode
  /** Demo-flow CTA that replaces the status label when present. */
  markCompleteCta: ReactNode
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
      {/* Fixed 124px slot keeps the status word vertically aligned across
          cards regardless of which status label is longest. */}
      <span
        style={{
          width: 124,
          display: 'inline-flex',
          justifyContent: 'center',
        }}
      >
        {markCompleteCta ?? <StatusTextLabel status={status} />}
      </span>
      {kebab}
    </div>
  )
}

/**
 * Full-width progress block (bar + trailing percent label) rendered below
 * an in-progress task's title. The bar stretches to fill the inner
 * column so it spans the card regardless of how many lines the title
 * wrapped to. Replaces the previous In Progress StatusBadge — the bar
 * itself carries the state cue.
 */
function FullWidthProgress({ value }: { value: number }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        marginTop: 4,
      }}
    >
      <div
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={100}
        style={{
          position: 'relative',
          flex: 1,
          height: 4,
          background: 'var(--color-neutral-100)',
          borderRadius: 'var(--radius-pill)',
          overflow: 'hidden',
        }}
      >
        <span
          aria-hidden
          style={{
            position: 'absolute',
            inset: '0 auto 0 0',
            width: `${value}%`,
            background: 'var(--color-primary-500)',
            borderRadius: 'var(--radius-pill)',
          }}
        />
      </div>
      <span
        style={{
          fontFamily: 'var(--font-body)',
          fontSize: 12,
          fontWeight: 600,
          color: 'var(--color-text-secondary)',
          whiteSpace: 'nowrap',
        }}
      >
        {value}%
      </span>
    </div>
  )
}

/**
 * Plain-text status label rendered in the card's right-side cluster.
 * All four statuses share the same shape (no pill background, no icon —
 * just the status word in its color) so the cards read as a quiet,
 * uniform list rather than a chaotic mix of colored chips.
 */
function StatusTextLabel({ status }: { status: StudyTaskStatus }) {
  return (
    <span
      style={{
        fontFamily: 'var(--font-body)',
        // Smaller (13px / 18px line) than the title so the status reads
        // as a quiet right-side annotation, not a heading.
        fontSize: 13,
        fontWeight: 500,
        lineHeight: '18px',
        color: STATUS_TEXT_COLOR[status],
        whiteSpace: 'nowrap',
      }}
    >
      {statusLabel(status)}
    </span>
  )
}

const STATUS_TEXT_COLOR: Record<StudyTaskStatus, string> = {
  completed: 'var(--color-success-700)',
  'in-progress': 'var(--color-primary-700)',
  overdue: 'var(--color-warning-700)',
  upcoming: 'var(--color-text-secondary)',
}

/**
 * Kebab + dropdown menu rendered for "resource" rows (titles starting with
 * "Read" or "View") and demo cards (BookOpen + kebab cards). Click the
 * kebab to toggle the menu; clicking outside closes it. If `onMarkComplete`
 * / `onOpen` callbacks are supplied (demo flow), the menu items run them;
 * otherwise they fall back to a `console.info` stub for the LMS-side
 * implementation to wire later.
 */
function TaskActionMenu({
  task,
  onMarkComplete,
  onOpen,
}: {
  task: StudyTask
  onMarkComplete?: () => void
  onOpen?: () => void
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onMouseDown = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onMouseDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onMouseDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const handle = (action: 'mark-complete' | 'open') => {
    if (action === 'mark-complete' && onMarkComplete) onMarkComplete()
    else if (action === 'open' && onOpen) onOpen()
    else {
      // Demo stub — replace with the real LMS mutation / navigation once
      // the task-action endpoints exist.
      console.info(`task:${action}`, task.id)
    }
    setOpen(false)
  }

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        type="button"
        aria-label={`More actions for ${task.title}`}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="cre-card-kebab"
      >
        <MoreVertical size={16} aria-hidden />
      </button>
      {open && (
        <div
          role="menu"
          style={{
            position: 'absolute',
            top: 'calc(100% + 4px)',
            right: 0,
            minWidth: 160,
            background: 'var(--color-surface-card)',
            border: '1px solid var(--color-border-subtle)',
            borderRadius: 'var(--radius-md)',
            boxShadow: '0 8px 24px rgb(0 0 0 / 0.12)',
            padding: 4,
            zIndex: 10,
          }}
        >
          <MenuItem onClick={() => handle('mark-complete')}>Mark complete</MenuItem>
          <MenuItem onClick={() => handle('open')}>Open</MenuItem>
        </div>
      )}
    </div>
  )
}

function MenuItem({
  onClick,
  children,
}: {
  onClick: () => void
  children: ReactNode
}) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onClick}
      style={{
        display: 'block',
        width: '100%',
        padding: '8px 12px',
        textAlign: 'left',
        background: 'transparent',
        border: 'none',
        borderRadius: 'var(--radius-sm)',
        fontFamily: 'var(--font-body)',
        fontSize: 14,
        color: 'var(--color-text-primary)',
        cursor: 'pointer',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = 'var(--color-neutral-75)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'transparent'
      }}
    >
      {children}
    </button>
  )
}

/**
 * Small filled CTA that replaces the status text on a demo card once the
 * learner has opened (and closed) the empty-state modal. One click marks
 * the card complete — the same terminal state the kebab dropdown's
 * "Mark as complete" item reaches.
 */
function MarkAsCompleteButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        padding: '6px 14px',
        // Rounded-rectangle (not pill) so the CTA reads as a discrete
        // action button rather than another status chip.
        borderRadius: 'var(--radius-md)',
        background: 'transparent',
        color: 'var(--color-cta-500)',
        border: '1px solid var(--color-cta-500)',
        fontFamily: 'var(--font-body)',
        fontSize: 13,
        fontWeight: 600,
        lineHeight: '18px',
        cursor: 'pointer',
        whiteSpace: 'nowrap',
      }}
    >
      Mark as complete
    </button>
  )
}
