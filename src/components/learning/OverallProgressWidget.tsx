import { Card } from '@/components/ui/Card'
import type { LearningPathSummary } from '@/data/learningFixtures'

const SIZE = 210
const STROKE = 22
const RADIUS = (SIZE - STROKE) / 2
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

type Props = {
  path: LearningPathSummary
}

export function OverallProgressWidget({ path }: Props) {
  const mandatory = path.mandatory ?? { completed: 0, required: 0 }
  const elective = path.elective ?? { completed: 0, required: 0 }
  const totalRequired = mandatory.required + elective.required
  const totalCompleted = mandatory.completed + elective.completed
  const percent =
    totalRequired > 0 ? Math.round((totalCompleted / totalRequired) * 100) : path.progressPct
  const filled = (percent / 100) * CIRCUMFERENCE

  return (
    <Card style={{ padding: 30, gap: 19, height: '100%' }}>
      <h3
        style={{
          margin: 0,
          fontFamily: 'var(--font-body)',
          fontWeight: 600,
          fontSize: 20,
          lineHeight: '28px',
          color: 'var(--color-neutral-darkest)',
        }}
      >
        Overall Course Progress
      </h3>
      <div style={{ display: 'flex', gap: 30, alignItems: 'flex-start' }}>
        <Donut percent={percent} filled={filled} />
        <CategoryLegend mandatory={mandatory} elective={elective} />
      </div>
    </Card>
  )
}

function Donut({ percent, filled }: { percent: number; filled: number }) {
  return (
    <div style={{ position: 'relative', width: SIZE, height: SIZE, flexShrink: 0 }}>
      <svg
        width={SIZE}
        height={SIZE}
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        role="img"
        aria-label={`${percent}% of courses completed`}
      >
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          fill="none"
          stroke="var(--color-neutral-200)"
          strokeWidth={STROKE}
        />
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          fill="none"
          stroke="var(--color-progress-fill)"
          strokeWidth={STROKE}
          strokeDasharray={`${filled} ${CIRCUMFERENCE - filled}`}
          strokeDashoffset={0}
          transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}
          strokeLinecap="butt"
        />
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
              fontSize: 48,
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
              fontSize: 24,
              lineHeight: 1,
              color: 'var(--color-neutral-darkest)',
            }}
          >
            %
          </span>
        </div>
        <span
          style={{
            marginTop: 8,
            fontFamily: 'var(--font-body)',
            fontWeight: 600,
            fontSize: 16,
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

function CategoryLegend({
  mandatory,
  elective,
}: {
  mandatory: { completed: number; required: number }
  elective: { completed: number; required: number }
}) {
  return (
    <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
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
        Categories
      </h4>
      <CategoryRow
        label="Mandatory"
        color="var(--color-primary-500)"
        completed={mandatory.completed}
        required={mandatory.required}
      />
      <div
        aria-hidden
        style={{ height: 1, background: 'var(--color-border-subtle)', margin: '12px 0' }}
      />
      <CategoryRow
        label="Elective"
        color="var(--color-secondary-500)"
        completed={elective.completed}
        required={elective.required}
      />
    </div>
  )
}

function CategoryRow({
  label,
  color,
  completed,
  required,
}: {
  label: string
  color: string
  completed: number
  required: number
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
      <span
        aria-hidden
        style={{
          width: 12,
          height: 12,
          borderRadius: 'var(--radius-pill)',
          background: color,
          marginTop: 8,
          flexShrink: 0,
        }}
      />
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
        <span
          style={{
            fontFamily: 'var(--font-body)',
            fontWeight: 400,
            fontSize: 14,
            lineHeight: '22px',
            color: 'var(--color-neutral-darkest)',
          }}
        >
          {label}
        </span>
        <span
          style={{
            fontFamily: 'var(--font-body)',
            fontWeight: 400,
            fontSize: 12,
            lineHeight: '18px',
            color: 'var(--color-neutral-dark)',
          }}
        >
          {required} required
        </span>
      </div>
      <span
        style={{
          fontFamily: 'var(--font-body)',
          fontWeight: 600,
          fontSize: 18,
          lineHeight: '28px',
          color: 'var(--color-neutral-darkest)',
        }}
      >
        {completed}
      </span>
    </div>
  )
}
