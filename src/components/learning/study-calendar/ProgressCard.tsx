import { Card } from '@/components/ui/Card'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Lock, PenToSquare } from '@/icons'
import type { StudyCalendar } from '@/data/studyCalendarFixtures'
import { isOnTrack, progressPct } from '@/data/studyCalendarFixtures'

const SIZE = 168
const STROKE = 20
const RADIUS = (SIZE - STROKE) / 2
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

export function ProgressCard({
  calendar,
  onEdit,
}: {
  calendar: StudyCalendar
  onEdit: () => void
}) {
  const percent = progressPct(calendar)
  const onTrack = isOnTrack(calendar)

  const total = calendar.tasks.length
  const completed = calendar.tasks.filter((t) => t.status === 'completed').length
  const inProgress = calendar.tasks.filter((t) => t.status === 'in-progress').length
  const overdue = calendar.tasks.filter((t) => t.status === 'overdue').length
  const upcoming = calendar.tasks.filter((t) => t.status === 'upcoming').length

  return (
    <Card style={{ padding: 30, gap: 19, height: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <h2
          style={{
            margin: 0,
            fontFamily: 'var(--font-body)',
            fontWeight: 600,
            fontSize: 20,
            lineHeight: '28px',
            color: 'var(--color-neutral-darkest)',
          }}
        >
          {calendar.name}
        </h2>
        <button
          type="button"
          onClick={onEdit}
          aria-label={calendar.locked ? 'View study plan pacing' : 'Edit study plan pacing'}
          className="cre-link-action"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: 0,
            background: 'transparent',
            border: 'none',
            color: 'var(--color-action)',
            fontFamily: 'var(--font-body)',
            fontSize: 14,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          {calendar.locked ? <Lock size={14} aria-hidden /> : <PenToSquare size={14} aria-hidden />}
          {calendar.locked ? 'View' : 'Edit'}
        </button>
      </div>

      {/* Calendar settings row (Start / Days per week / Buffer days /
          NYSE holidays) removed per design — the On Track / Off Track
          badge it shared a row with now sits on its own, right-aligned. */}
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <StatusBadge tone={onTrack ? 'success' : 'warning'}>
          {onTrack ? 'On Track' : 'Off Track'}
        </StatusBadge>
      </div>

      <div style={{ display: 'flex', gap: 30, alignItems: 'flex-start' }}>
        <Donut
          percent={percent}
          completed={completed}
          inProgress={inProgress}
          overdue={overdue}
          upcoming={upcoming}
        />
        <TaskBreakdown
          completed={completed}
          inProgress={inProgress}
          overdue={overdue}
          upcoming={upcoming}
          total={total}
        />
      </div>
    </Card>
  )
}

function Donut({
  percent,
  completed,
  inProgress,
  overdue,
  upcoming,
}: {
  percent: number
  completed: number
  inProgress: number
  overdue: number
  upcoming: number
}) {
  const total = completed + inProgress + overdue + upcoming
  let accumulated = 0
  const segments: { color: string; length: number; offset: number }[] = (
    [
      { count: completed, color: 'var(--color-status-completed)' },
      { count: inProgress, color: 'var(--color-status-in-progress)' },
      { count: overdue, color: 'var(--color-warning-500)' },
      { count: upcoming, color: 'var(--color-status-not-started)' },
    ] as const
  ).map((s) => {
    const length = total > 0 ? (s.count / total) * CIRCUMFERENCE : 0
    const offset = accumulated
    accumulated += length
    return { color: s.color, length, offset }
  })

  return (
    <div style={{ position: 'relative', width: SIZE, height: SIZE, flexShrink: 0 }}>
      <svg
        width={SIZE}
        height={SIZE}
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        role="img"
        aria-label={`${percent}% of tasks completed`}
      >
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          fill="none"
          stroke="var(--color-neutral-100)"
          strokeWidth={STROKE}
        />
        {segments.map(({ color, length, offset }, i) => (
          <circle
            key={i}
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={RADIUS}
            fill="none"
            stroke={color}
            strokeWidth={STROKE}
            strokeDasharray={`${length} ${CIRCUMFERENCE - length}`}
            strokeDashoffset={-offset}
            transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}
            strokeLinecap="butt"
          />
        ))}
      </svg>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 2 }}>
          <span
            style={{
              fontFamily: 'var(--font-body)',
              fontWeight: 600,
              fontSize: 40,
              lineHeight: 1,
              color: 'var(--color-neutral-darkest)',
            }}
          >
            {percent}
          </span>
          <span
            style={{
              fontFamily: 'var(--font-body)',
              fontWeight: 600,
              fontSize: 20,
              lineHeight: 1,
              color: 'var(--color-neutral-darkest)',
            }}
          >
            %
          </span>
        </div>
        <span
          style={{
            marginTop: 6,
            fontFamily: 'var(--font-body)',
            fontWeight: 600,
            fontSize: 14,
            lineHeight: '20px',
            color: 'var(--color-neutral-darkest)',
          }}
        >
          Complete
        </span>
      </div>
    </div>
  )
}

function TaskBreakdown({
  completed,
  inProgress,
  overdue,
  upcoming,
  total,
}: {
  completed: number
  inProgress: number
  overdue: number
  upcoming: number
  total: number
}) {
  return (
    <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          marginBottom: 4,
        }}
      >
        <h4
          style={{
            margin: 0,
            fontFamily: 'var(--font-body)',
            fontWeight: 600,
            fontSize: 16,
            lineHeight: '28px',
            color: 'var(--color-neutral-darkest)',
          }}
        >
          Tasks
        </h4>
        <span
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: 13,
            color: 'var(--color-text-secondary)',
          }}
        >
          {completed} of {total}
        </span>
      </div>
      <TaskRow label="Completed" color="var(--color-status-completed)" count={completed} />
      <Divider />
      <TaskRow label="In Progress" color="var(--color-status-in-progress)" count={inProgress} />
      <Divider />
      <TaskRow label="Off Track" color="var(--color-warning-500)" count={overdue} />
      <Divider />
      <TaskRow label="Not Started" color="var(--color-status-not-started)" count={upcoming} />
    </div>
  )
}

function Divider() {
  return (
    <div
      aria-hidden
      style={{ height: 1, background: 'var(--color-border-subtle)', margin: '10px 0' }}
    />
  )
}

function TaskRow({
  label,
  color,
  count,
}: {
  label: string
  color: string
  count: number
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <span
        aria-hidden
        style={{
          width: 12,
          height: 12,
          borderRadius: 'var(--radius-pill)',
          background: color,
          flexShrink: 0,
        }}
      />
      <span
        style={{
          flex: 1,
          fontFamily: 'var(--font-body)',
          fontSize: 14,
          color: 'var(--color-neutral-darkest)',
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontFamily: 'var(--font-body)',
          fontWeight: 600,
          fontSize: 18,
          color: 'var(--color-neutral-darkest)',
        }}
      >
        {count}
      </span>
    </div>
  )
}

