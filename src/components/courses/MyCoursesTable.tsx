import { Link } from 'react-router-dom'
import { Circle, CircleCheck, Clock, Monitor, Podcast, TriangleExclamation, Users, Video } from '@/icons'
import type { CourseDelivery } from '@/components/courses/CourseCard'
import type { MyCourseRecord } from '@/data/myCoursesFixtures'
import { getCourseImage } from '@/utils/courseImage'

type Props = {
  rows: MyCourseRecord[]
}

const DELIVERY: Record<CourseDelivery, { icon: typeof Monitor; label: string }> = {
  online: { icon: Monitor, label: 'Online' },
  video: { icon: Video, label: 'Video' },
  classroom: { icon: Users, label: 'In Person' },
  'in-person': { icon: Users, label: 'In Person' },
  podcast: { icon: Podcast, label: 'Podcast' },
}

const CREDIT_TYPE: Record<MyCourseRecord['badge'], string> = {
  mandatory: 'Mandatory',
  elective: 'Elective',
  'non-credit': 'Non-Credit',
}

const HEADER_CELL: React.CSSProperties = {
  textAlign: 'left',
  verticalAlign: 'top',
  padding: '16px 16px 12px',
  background: 'var(--color-surface-card)',
  borderBottom: '2px solid var(--color-neutral-500)',
  color: 'var(--color-neutral-dark)',
  fontFamily: 'var(--font-body)',
  fontSize: 12,
  fontWeight: 600,
  lineHeight: '18px',
  whiteSpace: 'pre-line',
}

const BODY_CELL: React.CSSProperties = {
  padding: '12px 16px',
  borderBottom: '1px solid var(--color-neutral-light)',
  color: 'var(--color-neutral-dark)',
  fontFamily: 'var(--font-body)',
  fontSize: 12,
  fontWeight: 400,
  lineHeight: '18px',
  verticalAlign: 'middle',
  // whiteSpace handled in tokens.css so the 1200px breakpoint can override.
}

const EM_DASH = '—'

export function MyCoursesTable({ rows }: Props) {
  return (
    <div
      style={{
        background: 'var(--color-surface-card)',
        border: '1px solid var(--color-neutral-light)',
        borderRadius: 'var(--radius-xl)',
        overflowX: 'auto',
      }}
    >
      <table
        className="cre-my-courses-table"
        style={{
          width: '100%',
          borderCollapse: 'collapse',
          fontFamily: 'var(--font-body)',
        }}
      >
        <thead>
          <tr>
            <th scope="col" style={{ ...HEADER_CELL, paddingLeft: 24 }}>
              <span style={{ display: 'block' }}>Course Name</span>
              <span style={{ display: 'block', marginTop: 4 }}>Course Type / Credit Type / Credit Hours</span>
            </th>
            <th scope="col" style={HEADER_CELL}>{'State(s)\nReceiving Credit'}</th>
            <th scope="col" style={HEADER_CELL}>Course Progress</th>
            <th scope="col" style={HEADER_CELL}>{'Enrollment\nDate'}</th>
            <th scope="col" style={HEADER_CELL}>{'Course\nExpiration'}</th>
            <th scope="col" style={HEADER_CELL}>{'Days to\nComplete'}</th>
            <th scope="col" style={{ ...HEADER_CELL, paddingRight: 24 }}>{'Course\nStatus'}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <Row key={row.id} row={row} />
          ))}
        </tbody>
      </table>
    </div>
  )
}

function Row({ row }: { row: MyCourseRecord }) {
  const delivery = DELIVERY[row.delivery]
  const DeliveryIcon = delivery.icon
  const isInProgress = row.myStatus === 'in-progress'
  const isCompleted = row.myStatus === 'completed'
  const progress = isCompleted ? 100 : Math.round(row.progress ?? 0)
  return (
    <tr className="cre-my-courses-row">
      <td style={{ ...BODY_CELL, paddingLeft: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span
            aria-hidden
            style={{
              flexShrink: 0,
              width: 40,
              height: 40,
              borderRadius: 'var(--radius-sm)',
              background: `center / cover no-repeat url(${row.imageUrl ?? getCourseImage(row.id)})`,
            }}
          />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0 }}>
            <Link
              to={`/courses/${row.id}`}
              style={{
                color: 'var(--color-text-primary)',
                fontWeight: 600,
                textDecoration: 'none',
                lineHeight: '18px',
              }}
            >
              {row.title}
            </Link>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                color: 'var(--color-neutral-dark)',
                lineHeight: '18px',
              }}
            >
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <DeliveryIcon size={14} aria-hidden />
                {delivery.label}
              </span>
              <span aria-hidden style={{ width: 1, height: 12, background: 'var(--color-border-subtle)' }} />
              <span>{CREDIT_TYPE[row.badge]}</span>
              <span aria-hidden style={{ width: 1, height: 12, background: 'var(--color-border-subtle)' }} />
              <span>{row.hours}</span>
            </div>
          </div>
        </div>
      </td>
      <td style={BODY_CELL}>{formatStates(row.state)}</td>
      <td style={BODY_CELL}>
        <ProgressCell value={progress} showLabel={isInProgress || isCompleted} />
      </td>
      <td style={BODY_CELL}>{formatDate(row.enrolledAt)}</td>
      <td style={BODY_CELL}>{row.expiresAt ? formatDate(row.expiresAt) : EM_DASH}</td>
      <td style={BODY_CELL}>{daysToComplete(row.expiresAt) ?? EM_DASH}</td>
      <td style={{ ...BODY_CELL, paddingRight: 24 }}>
        <StatusCell status={row.myStatus} />
      </td>
    </tr>
  )
}

function ProgressCell({ value, showLabel }: { value: number; showLabel: boolean }) {
  return (
    <div className="cre-progress-cell" style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 140 }}>
      <div
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={100}
        className="cre-progress-bar"
        style={{
          position: 'relative',
          flex: 1,
          height: 8,
          background: 'var(--color-neutral-light)',
          borderRadius: 'var(--radius-pill)',
          overflow: 'hidden',
        }}
      >
        <span
          aria-hidden
          style={{
            position: 'absolute',
            inset: '0 auto 0 0',
            width: `${Math.max(0, Math.min(100, value))}%`,
            background: 'var(--color-progress-fill)',
            borderRadius: 'var(--radius-pill)',
          }}
        />
      </div>
      <span style={{ minWidth: 32, textAlign: 'right', fontWeight: 600 }}>
        {showLabel ? `${value}%` : EM_DASH}
      </span>
    </div>
  )
}

function StatusCell({ status }: { status: MyCourseRecord['myStatus'] }) {
  if (status === 'in-progress') {
    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--color-cta-500)' }}>
        <Clock size={14} aria-hidden />
        In Progress
      </span>
    )
  }
  if (status === 'completed') {
    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--color-primary-500)' }}>
        <CircleCheck size={14} aria-hidden />
        Completed
      </span>
    )
  }
  // No `archived` arm: archiving is a LOCATION (axis E), not a status, so the
  // cell shows the course's REAL status and the collection does the locating —
  // the same rule that leaves the card unchanged (decisions 33-34). Restyling
  // this strip and adding the `View Archived` link is slice 4.
  if (status === 'failed') {
    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--color-error-700)' }}>
        <TriangleExclamation size={14} aria-hidden />
        Failed
      </span>
    )
  }
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--color-neutral-dark)' }}>
      <Circle size={14} aria-hidden />
      Not Started
    </span>
  )
}

function formatDate(iso: string): string {
  const parts = iso.split('-').map(Number)
  if (parts.length !== 3 || parts.some((n) => Number.isNaN(n))) return iso
  const d = new Date(parts[0], parts[1] - 1, parts[2])
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${mm}/${dd}/${d.getFullYear()}`
}

function formatStates(state: string): string {
  // Real data could have multiple state codes; for prototype fixtures we have
  // a single code per row. Whitespace-collapse and pipe-separate if a comma
  // or pipe is already in the value.
  if (state.includes('|') || state.includes(',')) {
    return state
      .split(/[,|]/)
      .map((s) => s.trim())
      .filter(Boolean)
      .join(' | ')
  }
  return state
}

function daysToComplete(expiresAt?: string, now: Date = new Date()): string | null {
  if (!expiresAt) return null
  const parts = expiresAt.split('-').map(Number)
  if (parts.length !== 3 || parts.some((n) => Number.isNaN(n))) return null
  const target = new Date(parts[0], parts[1] - 1, parts[2])
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const msPerDay = 1000 * 60 * 60 * 24
  const diff = Math.round((target.getTime() - startOfToday.getTime()) / msPerDay)
  if (diff <= 0) return 'Expired'
  if (diff < 365) return `${diff} Days`
  const years = Math.floor(diff / 365)
  const days = diff - years * 365
  if (days === 0) return `${years} ${years === 1 ? 'Year' : 'Years'}`
  return `${years} ${years === 1 ? 'Year' : 'Years'}, ${days} Days`
}
