import { useMemo } from 'react'
import type {
  StudyCalendar,
  StudyTask,
  StudyTaskKind,
  StudyTaskStatus,
} from '@/data/studyCalendarFixtures'

/**
 * Printer / PDF-friendly tabular view of every task on a Study Calendar.
 * Rendered inside the "View Task List" modal — drops the per-card chrome
 * (kebab, hover, rounded boxes) used in the in-tab `TaskListView` so the
 * sheet flattens to a clean HTML table the browser print dialog can hand
 * off as-is. All tasks live in one chronological table; the Status column
 * carries the categorization the card layout previously did via section
 * headers.
 */
export function TaskListTable({ calendar }: { calendar: StudyCalendar }) {
  const rows = useMemo(
    () => [...calendar.tasks].sort((a, b) => a.dueDate.localeCompare(b.dueDate)),
    [calendar.tasks],
  )

  return (
    <table
      style={{
        width: '100%',
        borderCollapse: 'collapse',
        fontFamily: 'var(--font-body)',
        fontSize: 13,
        lineHeight: '18px',
        color: 'var(--color-text-primary)',
      }}
    >
      <thead>
        <tr style={{ background: 'var(--color-neutral-75)' }}>
          <Th style={{ width: 110 }}>Date</Th>
          <Th style={{ width: 80 }}>Type</Th>
          <Th>Title</Th>
          <Th style={{ width: 80 }}>Duration</Th>
          <Th style={{ width: 110 }}>Status</Th>
          <Th style={{ width: 80, textAlign: 'right' }}>Progress</Th>
        </tr>
      </thead>
      <tbody>
        {rows.map((task) => (
          <Row key={task.id} task={task} />
        ))}
      </tbody>
    </table>
  )
}

function Row({ task }: { task: StudyTask }) {
  const isCompleted = task.status === 'completed'
  // Completed tasks always read as 100% (the task is done — done is done,
  // regardless of whether the fixture carried a `progress` field).
  // In-progress tasks show whatever the fixture / API reports.
  // Off Track / To Do show an em dash since "% done" isn't meaningful yet.
  const progress = isCompleted
    ? '100%'
    : task.status === 'in-progress' && typeof task.progress === 'number'
      ? `${Math.round(task.progress)}%`
      : '—'
  return (
    <tr
      style={{
        // No hover — sheet stays static so PDF / printed output matches
        // exactly what the learner sees in the modal.
        borderBottom: '1px solid var(--color-border-subtle)',
      }}
    >
      <Td>{formatLongDate(task.dueDate)}</Td>
      <Td>{KIND_LABEL[task.kind]}</Td>
      <Td>
        <span
          style={{
            fontWeight: 600,
            textDecoration: isCompleted ? 'line-through' : undefined,
            opacity: isCompleted ? 0.7 : 1,
          }}
        >
          {task.title}
        </span>
        {task.context ? (
          <span style={{ color: 'var(--color-text-secondary)' }}>
            {' '}
            — {task.context}
          </span>
        ) : null}
      </Td>
      <Td>{task.durationMin} min</Td>
      <Td>
        <span style={{ color: statusColor(task.status), fontWeight: 600 }}>
          {statusLabel(task.status)}
        </span>
      </Td>
      <Td style={{ textAlign: 'right' }}>{progress}</Td>
    </tr>
  )
}

function Th({
  children,
  style,
}: {
  children: React.ReactNode
  style?: React.CSSProperties
}) {
  return (
    <th
      style={{
        padding: '10px 12px',
        textAlign: 'left',
        fontFamily: 'var(--font-body)',
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: '0.04em',
        textTransform: 'uppercase',
        color: 'var(--color-text-secondary)',
        borderBottom: '1px solid var(--color-border-subtle)',
        ...style,
      }}
    >
      {children}
    </th>
  )
}

function Td({
  children,
  style,
}: {
  children: React.ReactNode
  style?: React.CSSProperties
}) {
  return (
    <td
      style={{
        padding: '10px 12px',
        verticalAlign: 'top',
        ...style,
      }}
    >
      {children}
    </td>
  )
}

const KIND_LABEL: Record<StudyTaskKind, string> = {
  video: 'Video',
  quiz: 'Quiz',
  exam: 'Exam',
  reading: 'Reading',
  custom: 'Custom',
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
      return 'Not Started'
  }
}

function statusColor(status: StudyTaskStatus): string {
  switch (status) {
    case 'completed':
      return 'var(--color-success-700)'
    case 'in-progress':
      return 'var(--color-primary-700)'
    case 'overdue':
      return 'var(--color-warning-700)'
    case 'upcoming':
      return 'var(--color-text-secondary)'
  }
}

function formatLongDate(iso: string): string {
  const [y, m, d] = iso.split('-').map((p) => parseInt(p, 10))
  const date = new Date(Date.UTC(y, m - 1, d))
  const dow = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][date.getUTCDay()]
  const months = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ]
  return `${dow}, ${months[m - 1]} ${d}`
}
