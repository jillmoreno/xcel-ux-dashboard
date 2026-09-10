import type { CSSProperties } from 'react'
import { Circle, CircleCheck, CircleExclamation } from '@/icons'
import { ProgressBar } from '@/components/ui/ProgressBar'
import {
  daysUntilExam,
  formatStatDate,
  pacingStatus,
  progressPct,
  taskCompletion,
  type StudyCalendar,
} from '@/data/studyCalendarFixtures'

type Props = {
  calendar: StudyCalendar
  /**
   * Course progress to show in the Progress tile, 0-100.
   *
   * When omitted the tile falls back to `progressPct(calendar)` — this plan's
   * own TASK count — which is what it always showed. It is overridable because
   * that number is not the one the rest of the app reports: Home's Current
   * Learning Progress band counts CREDIT HOURS against the selected persona,
   * and the Readiness page follows Home. Three surfaces, two measures, and the
   * Study Plan was the odd one out at 32% against Home's 63%.
   *
   * The "Tasks Completed" tile beside it still counts tasks, and that is not a
   * contradiction: the two tiles are labelled as the different things they are.
   * What was wrong was a tile labelled "Progress" disagreeing with every other
   * screen's Progress.
   */
  coursePct?: number
  /** Reserved for a future actions menu. The Calendar Actions link
   *  is hidden in the v2 layout per Figma node `3370:16917`, but the
   *  prop stays so callers don't break and so the wiring is in place
   *  when the actions surface ships. */
  onOpenActions?: () => void
}

/**
 * Stat band rendered above the Study Calendar tab toolbar. Sourced
 * from Figma node `3370:16917`.
 *
 *   ┌──────────────────────────────────────────────────────────────┐
 *   │  Series 79 - 15 Day Calendar (navy fill, white text)         │
 *   ├──────┬──────────┬──────────┬──────────┬──────────┬─────────┤
 *   │Status│ Progress │ Tasks    │ Start    │ Target / │ Days    │
 *   │      │  bar  %  │ Completed│ Date     │ Exam Date│ Left    │
 *   └──────┴──────────┴──────────┴──────────┴──────────┴─────────┘
 *
 * The earlier layout (plain h3 + Calendar Actions link on the right)
 * was replaced — title now sits inside a navy filled band and the
 * Calendar Actions link is hidden until a real actions menu ships.
 * Stat tiles sit flat (no card border) since the navy band above
 * already groups the row visually.
 */
export function StudyCalendarStatBand({ calendar, coursePct }: Props) {
  const pct = coursePct ?? progressPct(calendar)
  const { completed, total } = taskCompletion(calendar)
  const status = pacingStatus(calendar)
  const daysLeft = daysUntilExam(calendar.examDate)

  return (
    <section aria-label="Study calendar overview" style={wrapStyle}>
      <header style={titleBandStyle}>
        <h3 style={titleStyle}>{calendar.name}</h3>
      </header>
      <div style={statsRowStyle}>
        <Tile label="Status">
          <StatusBadge status={status} />
        </Tile>
        <Divider />
        <Tile label="Progress" grow>
          <ProgressInline pct={pct} />
        </Tile>
        <Divider />
        <Tile label="Tasks Completed">
          <StrongValue>
            {completed} <Faint>/ {total}</Faint>
          </StrongValue>
        </Tile>
        <Divider />
        <Tile label="Start Date">
          <StrongValue>{formatStatDate(calendar.startDate)}</StrongValue>
        </Tile>
        <Divider />
        <Tile label="Target/Exam Date">
          <StrongValue>{formatStatDate(calendar.examDate)}</StrongValue>
        </Tile>
        <Divider />
        <Tile label="Days Left">
          <StrongValue>{daysLeft} Days</StrongValue>
        </Tile>
      </div>
    </section>
  )
}

/* ─── pieces ──────────────────────────────────────────────────────── */

function Tile({
  label,
  children,
  grow,
}: {
  label: string
  children: React.ReactNode
  grow?: boolean
}) {
  return (
    <div style={{ ...tileStyle, ...(grow && { flex: 1, minWidth: 0 }) }}>
      <div style={tileLabelStyle}>{label}</div>
      <div style={tileValueWrapStyle}>{children}</div>
    </div>
  )
}

function Divider() {
  return <div aria-hidden style={dividerStyle} />
}

function StrongValue({ children }: { children: React.ReactNode }) {
  return <span style={strongValueStyle}>{children}</span>
}

function Faint({ children }: { children: React.ReactNode }) {
  return <span style={faintStyle}>{children}</span>
}

function StatusBadge({
  status,
}: {
  status: 'not-started' | 'on-track' | 'off-track'
}) {
  if (status === 'not-started') {
    return (
      <span style={statusNeutralStyle}>
        <span aria-hidden style={statusIconWrapStyle}>
          <Circle
            size={16}
            aria-hidden
            style={{ color: 'var(--color-neutral-500)' }}
          />
        </span>
        Not Started
      </span>
    )
  }
  if (status === 'on-track') {
    return (
      <span style={statusOkStyle}>
        <span aria-hidden style={statusIconWrapStyle}>
          <CircleCheck size={16} aria-hidden style={{ color: 'var(--color-success-500)' }} />
        </span>
        On Track
      </span>
    )
  }
  return (
    <span style={statusWarnStyle}>
      <span aria-hidden style={statusIconWrapStyle}>
        <CircleExclamation size={16} aria-hidden style={{ color: 'var(--color-warning-500)' }} />
      </span>
      Off Track
    </span>
  )
}

function ProgressInline({ pct }: { pct: number }) {
  // The bar itself is `ProgressBar` now — this composes it with the percentage
  // label. The treatment was defined here and is still the reference; it moved
  // out because the Readiness page needed the bar WITHOUT the label and had
  // drawn a thinner lookalike instead.
  return (
    <div style={progressRowStyle}>
      {/* The grow lives HERE, not in `ProgressBar` — the bar is layout-neutral
          so it survives being dropped into a column. */}
      <div style={{ flex: 1, minWidth: 80 }}>
        <ProgressBar pct={pct} />
      </div>
      <span style={progressPctStyle}>{pct}%</span>
    </div>
  )
}

/* ─── styles ──────────────────────────────────────────────────────── */

const wrapStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 0,
  marginBottom: 4,
  borderRadius: 'var(--radius-md)',
  overflow: 'hidden',
  border: '1px solid var(--color-border-subtle)',
  background: 'var(--color-surface-card)',
}

// Navy filled title band — full-width across the stat band, anchors
// the section visually.
const titleBandStyle: CSSProperties = {
  background: 'var(--color-primary-700)',
  color: 'var(--color-text-inverse)',
  padding: '6px 16px',
}

const titleStyle: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-body)',
  fontWeight: 700,
  fontSize: 16,
  lineHeight: '24px',
  color: 'var(--color-text-inverse)',
}

// Flat stat row — tiles sit directly on the card surface with
// vertical dividers between them. No outer border (the wrapper owns
// it), no card fill that would re-introduce a double-bordered look.
const statsRowStyle: CSSProperties = {
  padding: '12px 16px',
  display: 'flex',
  alignItems: 'stretch',
  gap: 16,
}

const tileStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 4,
  minWidth: 0,
}

const tileLabelStyle: CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontSize: 12,
  fontWeight: 600,
  color: 'var(--color-text-secondary)',
  letterSpacing: '0.01em',
}

const tileValueWrapStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  minHeight: 24,
}

const strongValueStyle: CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontWeight: 600,
  fontSize: 16,
  lineHeight: '24px',
  color: 'var(--color-text-primary)',
}

const faintStyle: CSSProperties = {
  color: 'var(--color-text-tertiary)',
  fontWeight: 600,
}

const dividerStyle: CSSProperties = {
  width: 1,
  alignSelf: 'stretch',
  background: 'var(--color-border-subtle)',
}

const statusOkStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  fontFamily: 'var(--font-body)',
  fontWeight: 600,
  fontSize: 14,
  lineHeight: '20px',
  color: 'var(--color-success-700)',
}

const statusWarnStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  fontFamily: 'var(--font-body)',
  fontWeight: 600,
  fontSize: 14,
  lineHeight: '20px',
  color: 'var(--color-warning-800)',
}

// Neutral tone for the Not Started variant — reads as a quiet
// "hasn't begun" state without competing with the green / amber
// signals carried by the on-track / off-track badges.
const statusNeutralStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  fontFamily: 'var(--font-body)',
  fontWeight: 600,
  fontSize: 14,
  lineHeight: '20px',
  color: 'var(--color-text-secondary)',
}

const statusIconWrapStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
}

const progressRowStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  width: '100%',
}



const progressPctStyle: CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontWeight: 600,
  fontSize: 16,
  color: 'var(--color-text-primary)',
  whiteSpace: 'nowrap',
}
