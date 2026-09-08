import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { LoFiWidgetBody } from '@/components/lo-fi/LoFiPlaceholders'
import { useLoFi } from '@/context/LoFiContext'
import type { LearningPathCardData, LearningPathStatus } from '@/data/learningFixtures'

const STATUS_LABEL: Record<LearningPathStatus, string> = {
  'not-started': 'Not Started',
  'on-track': 'On Track',
  'at-risk': 'At Risk',
  behind: 'Behind',
  completed: 'Complete',
  expired: 'Expired',
}

type StatusTone = {
  pillBg: string
  pillFg: string
  ringFill: string | null
}

// Pills match the Figma badge sheet (file JEY1UPqWJ165AVy40in1KQ node 148:12287):
// soft tinted background + dark in-hue text, no inline icon. The status itself
// is the signal; the ring fill carries the same hue family for reinforcement.
function toneFor(status: LearningPathStatus): StatusTone {
  switch (status) {
    case 'not-started':
      return {
        pillBg: 'var(--color-neutral-100)',
        pillFg: 'var(--color-neutral-darkest)',
        ringFill: null,
      }
    case 'on-track':
      return {
        pillBg: 'var(--color-success-100)',
        pillFg: 'var(--color-success-800)',
        ringFill: 'var(--color-success-500)',
      }
    case 'at-risk':
      return {
        pillBg: 'var(--color-warning-100)',
        pillFg: 'var(--color-warning-800)',
        ringFill: 'var(--color-warning-500)',
      }
    case 'behind':
      return {
        pillBg: 'var(--color-error-100)',
        pillFg: 'var(--color-error-800)',
        ringFill: 'var(--color-error-500)',
      }
    case 'completed':
      return {
        pillBg: 'var(--color-success-100)',
        pillFg: 'var(--color-success-800)',
        ringFill: 'var(--color-success-500)',
      }
    case 'expired':
      return {
        pillBg: 'var(--color-neutral-100)',
        pillFg: 'var(--color-neutral-darkest)',
        ringFill: 'var(--color-error-500)',
      }
  }
}

/**
 * Horizontal Learning Path / License row card.
 *
 * Layout (≥1024px):
 *   ◯ ring | identity + 6-column stats grid (flex 1) | status pill (top-right)
 *
 * Status drives:
 *   - the right-aligned pill (background + text via `toneFor`)
 *   - the progress-ring fill color (null for not-started → track only)
 *   - the days-left value color (warning-800) when `status === 'at-risk'`
 *     so the time-pressure signal pops without a second pill
 *
 * `variant='compact'` collapses the row layout into a vertical stack —
 * progress ring + title + status pill sit on top, with the 6 stats listed
 * as label:value rows below. Used by Dashboard V2's 3-column
 * Learning Paths / Courses / Quick Links row, where each tile occupies a
 * single column of a 3-up grid.
 */
export function LearningPathCard({
  data,
  variant = 'wide',
  pathsCount,
  onViewAll,
}: {
  data: LearningPathCardData
  variant?: 'wide' | 'compact' | 'compact-v3'
  /** Compact-only: total LP count, rendered in the in-card eyebrow as
   *  "Learning Paths (N)". Mirrors the Quick Links / Courses tile pattern
   *  in V2's 3-up row. */
  pathsCount?: number
  /** Compact-only: click handler for the in-card "View All →" link.
   *  When provided, the eyebrow renders the link; when omitted, only the
   *  title shows. Wired to the LP slide-over via `useLearningPathsPanel`
   *  by the LearnerOverviewPanel parent. */
  onViewAll?: () => void
}) {
  const { loFi } = useLoFi()
  if (loFi) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
          padding: 20,
          background: 'var(--color-surface-card)',
          border: '1px solid var(--color-border-subtle)',
          borderRadius: 'var(--radius-lg)',
          minHeight: 240,
        }}
      >
        <LoFiWidgetBody rows={5} ariaLabel="Lo-fi learning path card" />
      </div>
    )
  }
  const tone = toneFor(data.status)
  const daysLeftEmphasized = data.status === 'at-risk' && data.daysLeftToComplete != null

  if (variant === 'compact' || variant === 'compact-v3') {
    const isV3 = variant === 'compact-v3'
    // V3 sizes the ring + header block to align with the V3 Courses
    // gauge (100px tall) so both card dividers land on the same Y and
    // both card bottoms land on the JBI bottom.
    const ringSize = isV3 ? 100 : 88
    const headerMinHeight = isV3 ? 102 : undefined
    return (
      <section
        style={{
          display: 'flex',
          flexDirection: 'column',
          // 20px outer gap = clear visual break between the in-card
          // eyebrow ("LEARNING PATHS (N)") and the clickable content
          // surface below. V3 tightens both gap + vertical padding so
          // the card's total height matches the V3 Jump Back In tile.
          gap: isV3 ? 14 : 20,
          padding: isV3 ? '10px 20px' : '16px 20px',
          background: 'var(--color-surface-card)',
          border: '1px solid var(--color-border-subtle)',
          borderRadius: 'var(--radius-lg)',
          // V3 sizes to its natural content so the bottom aligns with
          // the Jump Back In tile (which is itself sized to its
          // CourseCard). V2 stretches to fill the 3-up row height.
          ...(isV3 ? { alignSelf: 'start' } : { height: '100%' }),
        }}
      >
        {/* In-card eyebrow — title + optional View All. Matches the Quick
            Links and Courses tiles in the same row so the three cards
            read as a header-and-body family. The outer section-heading
            in V2 is dropped because this header carries the same info.
            When the learner has exactly one path, drop the "(1)"
            parenthetical and hide the View All action — there's nowhere
            useful for it to lead. */}
        <CardEyebrow
          label={
            pathsCount === 1
              ? 'Learning Path'
              : `Learning Paths${typeof pathsCount === 'number' ? ` (${pathsCount})` : ''}`
          }
          onViewAll={pathsCount === 1 ? undefined : onViewAll}
        />

        {/* Clickable surface — wraps the ring + title + pill + stats.
            No hover affordance here (the eyebrow's View All button is
            the primary action; the body is a secondary "resume" target
            that doesn't need the lift/shadow treatment the wide card
            uses). */}
        <Link
          to={data.resumeUrl}
          aria-label={`Resume ${data.title}`}
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
            textDecoration: 'none',
            color: 'inherit',
            flex: 1,
            minHeight: 0,
          }}
        >
          {/* Ring on the left, title + status pill in a column on the right.
              Status pill sits inline below the title (not absolutely
              positioned) so the narrow column doesn't fight for horizontal
              space. V3 vertically centers the pair inside a 130px box so
              the divider below aligns with the Courses card's gauge. */}
          <div
            style={{
              display: 'flex',
              alignItems: isV3 ? 'center' : 'flex-start',
              gap: 16,
              ...(headerMinHeight ? { minHeight: headerMinHeight } : null),
            }}
          >
            <ProgressRing
              percent={data.progressPct}
              fillColor={tone.ringFill}
              title={data.title}
              size={ringSize}
            />
            <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
              <h3
                style={{
                  margin: 0,
                  fontFamily: 'var(--font-heading)',
                  fontSize: 15,
                  fontWeight: 500,
                  lineHeight: '20px',
                  color: 'inherit',
                }}
              >
                {data.title}
              </h3>
              <div>
                <StatusPill bg={tone.pillBg} fg={tone.pillFg}>
                  {STATUS_LABEL[data.status]}
                </StatusPill>
              </div>
            </div>
          </div>

          {/* Stats list — vertical label:value rows. V3 drops the
              Enrolled + Last Activity rows and spans the full inner
              card width so the labels' left edge lines up with the
              ring's left edge (and the values' right edge sits at the
              card's inner right padding). Tightened row gap + extra
              top/bottom padding keep the section reading as a "stat
              block with breathing room". */}
          <dl
            style={{
              margin: 0,
              display: 'flex',
              flexDirection: 'column',
              gap: 6,
              paddingTop: isV3 ? 10 : 4,
              paddingBottom: isV3 ? 6 : 0,
              borderTop: '1px solid var(--color-border-subtle)',
              ...(isV3 ? { width: '100%' } : null),
            }}
          >
            <CompactStatRow
              label="Hours Completed"
              value={`${data.hoursCompleted} / ${data.totalHours}`}
            />
            {!isV3 && (
              <CompactStatRow
                label="Enrolled"
                value={formatDate(data.enrolledDate)}
                placeholder={data.enrolledDate == null}
              />
            )}
            <CompactStatRow
              label="Expires"
              value={formatDate(data.expiresDate)}
              placeholder={data.expiresDate == null}
            />
            <CompactStatRow
              label="Days Left"
              value={data.daysLeftToComplete != null ? `${data.daysLeftToComplete} Days` : '---'}
              placeholder={data.daysLeftToComplete == null}
              emphasizeColor={daysLeftEmphasized ? 'var(--color-warning-800)' : undefined}
            />
            <CompactStatRow
              label="Total Time Spent"
              value={data.totalTimeSpent ? `${data.totalTimeSpent.hours} hrs` : '---'}
              placeholder={data.totalTimeSpent == null}
            />
            {!isV3 && (
              <CompactStatRow
                label="Last Activity"
                value={data.lastActivityDays != null ? `${data.lastActivityDays} Days` : '---'}
                placeholder={data.lastActivityDays == null}
              />
            )}
          </dl>
        </Link>
      </section>
    )
  }

  return (
    <Link
      to={data.resumeUrl}
      aria-label={`Resume ${data.title}`}
      className="cre-learning-path-card"
      style={{
        display: 'block',
        position: 'relative',
        padding: '16px 20px',
        background: 'var(--color-surface-card)',
        border: '1px solid var(--color-border-subtle)',
        borderRadius: 'var(--radius-lg)',
        textDecoration: 'none',
      }}
    >
      {/* Status pill is positioned absolutely (out of normal flow) so it
          doesn't lift the meta line away from the title. Top is offset to
          vertically center on the title's 20px line: 16 (card pad) +
          10 (half title) − 15 (half pill) = 11. */}
      <div style={{ position: 'absolute', top: 11, right: 20 }}>
        <StatusPill bg={tone.pillBg} fg={tone.pillFg}>
          {STATUS_LABEL[data.status]}
        </StatusPill>
      </div>
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: 20,
          flexWrap: 'wrap',
        }}
      >
        <ProgressRing percent={data.progressPct} fillColor={tone.ringFill} title={data.title} />
        <div
          style={{
            flex: 1,
            minWidth: 0,
            display: 'flex',
            flexDirection: 'column',
            gap: 0,
          }}
        >
          <h3
            style={{
              margin: 0,
              // Reserve room on the right so the title doesn't run under the
              // absolutely-positioned status pill.
              paddingRight: 120,
              fontFamily: 'var(--font-heading)',
              fontSize: 16,
              fontWeight: 500,
              lineHeight: '20px',
              color: 'inherit',
            }}
          >
            {data.title}
          </h3>
          <MetaRow
            programType={data.programType}
            credentialType={data.credentialType}
            jurisdiction={data.jurisdiction}
          />
          <StatsGrid data={data} daysLeftEmphasized={daysLeftEmphasized} />
        </div>
      </div>
    </Link>
  )
}

/** Top-of-card eyebrow shared with `CoursesSummaryCard` + `QuickLinksCard`
 *  in V2's 3-up row. Renders an uppercase label on the left and an
 *  optional "View All →" action on the right.
 *
 *  Pass `onViewAll` for a button (e.g. opening the LP slide-over via a
 *  context callback) or `viewAllHref` for a `<Link>` (e.g. routing into
 *  /my-learning/courses). At most one should be set. */
export function CardEyebrow({
  label,
  onViewAll,
  viewAllHref,
  viewAllCount,
}: {
  label: string
  onViewAll?: () => void
  viewAllHref?: string
  /** When set, the View All affordance reads "View All (N)" (no arrow)
   *  instead of the default "View All →" — lets the Current Learning Path
   *  widget surface the learner's total path count. Backward-compatible:
   *  callers that omit it keep the original "View All →" label. */
  viewAllCount?: number
}) {
  const viewAllLabel =
    typeof viewAllCount === 'number' ? `View All (${viewAllCount})` : 'View All →'
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 8,
      }}
    >
      <span
        style={{
          fontFamily: 'var(--font-body)',
          fontSize: 11,
          fontWeight: 600,
          letterSpacing: '0.04em',
          textTransform: 'uppercase',
          color: 'var(--color-text-secondary)',
        }}
      >
        {label}
      </span>
      {onViewAll ? (
        <button
          type="button"
          onClick={onViewAll}
          className="cre-link-action"
          style={VIEW_ALL_STYLE}
        >
          {viewAllLabel}
        </button>
      ) : viewAllHref ? (
        <Link to={viewAllHref} className="cre-link-action" style={VIEW_ALL_STYLE}>
          {viewAllLabel}
        </Link>
      ) : null}
    </div>
  )
}

const VIEW_ALL_STYLE: React.CSSProperties = {
  background: 'transparent',
  border: 'none',
  cursor: 'pointer',
  padding: 0,
  textDecoration: 'none',
  fontFamily: 'var(--font-body)',
  fontSize: 13,
  fontWeight: 600,
  // Contrast-aware CTA link — deep magenta on light, light pink on the navy
  // dark surface (flat --color-action/cta-500 was 2.9:1 there). #1
  color: 'var(--color-accent-link)',
}

/** Label:value row for the compact LP card. Two-column flex with the
 *  label hugging the left and the value pinned to the right. Mirrors the
 *  wide card's StatCol type ramp (label = 11/secondary, value = 13/600). */
function CompactStatRow({
  label,
  value,
  placeholder = false,
  emphasizeColor,
  reverseLayout = false,
}: {
  label: string
  value: string
  placeholder?: boolean
  emphasizeColor?: string
  /** When true, flip the row so the value sits on the left and the
   *  label on the right. V3's LP card uses this to mirror the V3
   *  Courses-card legend, which puts value-left / label-right so the
   *  two cards' rows visually align across the 3-up row. */
  reverseLayout?: boolean
}) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: reverseLayout ? 'row-reverse' : 'row',
        alignItems: 'baseline',
        justifyContent: 'space-between',
        gap: 8,
      }}
    >
      <dt
        style={{
          fontFamily: 'var(--font-body)',
          fontSize: 11,
          fontWeight: 500,
          lineHeight: '16px',
          color: 'var(--color-text-secondary)',
        }}
      >
        {label}
      </dt>
      <dd
        style={{
          margin: 0,
          fontFamily: 'var(--font-body)',
          fontSize: 13,
          fontWeight: 600,
          lineHeight: '18px',
          color: emphasizeColor
            ? emphasizeColor
            : placeholder
              ? 'var(--color-neutral-500)'
              : 'inherit',
          whiteSpace: 'nowrap',
        }}
      >
        {value}
      </dd>
    </div>
  )
}

function MetaRow({
  programType,
  credentialType,
  jurisdiction,
}: {
  programType: string
  credentialType: string
  jurisdiction: string
}) {
  const parts = [programType, credentialType, jurisdiction]
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        flexWrap: 'wrap',
        fontFamily: 'var(--font-body)',
        fontSize: 12,
        lineHeight: '16px',
        color: 'var(--color-text-secondary)',
      }}
    >
      {parts.map((p, i) => (
        <span key={`${p}-${i}`} style={{ display: 'inline-flex', alignItems: 'center' }}>
          {i > 0 && (
            <span aria-hidden style={{ margin: '0 8px', color: 'var(--color-text-secondary)' }}>
              ·
            </span>
          )}
          <span>{p}</span>
        </span>
      ))}
    </div>
  )
}

function StatsGrid({
  data,
  daysLeftEmphasized,
}: {
  data: LearningPathCardData
  daysLeftEmphasized: boolean
}) {
  return (
    <dl
      style={{
        // 16px top margin = clear breathing room between the meta row
        // (program · credential · jurisdiction) and the stats grid,
        // without growing the card. Math: title 20px + meta 16px +
        // this gap 16px + stats row 36px = 88px body column, which
        // exactly matches the 88px ProgressRing height that already
        // governs the card's vertical footprint. Anything larger than
        // 16px would push the body taller than the ring and the card
        // would grow.
        margin: '16px 0 0',
        // Flex row instead of an equal-fr grid — each column hugs its content
        // (label/value width) so the dividers track the actual data widths.
        display: 'flex',
        flexWrap: 'wrap',
        rowGap: 8,
      }}
    >
      <StatCol label="Hours Completed" value={`${data.hoursCompleted} / ${data.totalHours}`} />
      <StatCol label="Enrolled" value={formatDate(data.enrolledDate)} placeholder={data.enrolledDate == null} />
      <StatCol label="Expires" value={formatDate(data.expiresDate)} placeholder={data.expiresDate == null} />
      <StatCol
        label="Days Left"
        value={data.daysLeftToComplete != null ? `${data.daysLeftToComplete} Days` : '---'}
        placeholder={data.daysLeftToComplete == null}
        emphasizeColor={daysLeftEmphasized ? 'var(--color-warning-800)' : undefined}
      />
      <StatCol
        label="Total Time Spent"
        value={data.totalTimeSpent ? `${data.totalTimeSpent.hours} hrs` : '---'}
        placeholder={data.totalTimeSpent == null}
      />
      <StatCol
        label="Last Activity"
        value={data.lastActivityDays != null ? `${data.lastActivityDays} Days` : '---'}
        placeholder={data.lastActivityDays == null}
      />
    </dl>
  )
}

function StatCol({
  label,
  value,
  placeholder = false,
  emphasizeColor,
}: {
  label: string
  value: string
  placeholder?: boolean
  emphasizeColor?: string
}) {
  return (
    <div className="cre-stat-col" style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
      <dt
        style={{
          fontFamily: 'var(--font-body)',
          fontSize: 11,
          fontWeight: 500,
          lineHeight: '16px',
          color: 'var(--color-text-secondary)',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
      >
        {label}
      </dt>
      <dd
        style={{
          margin: 0,
          fontFamily: 'var(--font-body)',
          fontSize: 13,
          fontWeight: 600,
          lineHeight: '18px',
          color: emphasizeColor
            ? emphasizeColor
            : placeholder
              ? 'var(--color-neutral-500)'
              : 'inherit',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
      >
        {value}
      </dd>
    </div>
  )
}

function StatusPill({
  bg,
  fg,
  children,
}: {
  bg: string
  fg: string
  children: ReactNode
}) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '6px 16px',
        borderRadius: 999,
        background: bg,
        color: fg,
        fontFamily: 'var(--font-body)',
        fontSize: 13,
        fontWeight: 600,
        lineHeight: '18px',
        whiteSpace: 'nowrap',
        flexShrink: 0,
      }}
    >
      {children}
    </span>
  )
}

function ProgressRing({
  percent,
  fillColor,
  title,
  size = 88,
}: {
  percent: number
  fillColor: string | null
  title: string
  /** Outer square size in px. Default 88 matches V1/V2; V3 passes a
   *  larger value to bring the ring closer to the Courses-card gauge
   *  footprint. Stroke + interior text size scale with `size`. */
  size?: number
}) {
  // Stroke scales gently with size so the bigger ring doesn't read as a
  // hairline; ~9% of width matches the 88/8 default ratio.
  const stroke = Math.max(6, Math.round(size * 0.091))
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const clamped = Math.max(0, Math.min(100, percent))
  const offset = circumference - (clamped / 100) * circumference
  return (
    <div
      role="progressbar"
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={`${title} progress`}
      style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--color-neutral-100)"
          strokeWidth={stroke}
        />
        {fillColor && clamped > 0 && (
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={fillColor}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
          />
        )}
      </svg>
      <span
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'var(--font-body)',
          // Scale the % readout with the ring so it stays proportional.
          fontSize: Math.max(16, Math.round(size * 0.2)),
          fontWeight: 600,
          color: 'inherit',
        }}
      >
        {clamped}%
      </span>
    </div>
  )
}

function formatDate(iso: string | null): string {
  if (!iso) return 'mm/dd/yyyy'
  const [y, m, d] = iso.split('-').map((s) => parseInt(s, 10))
  const mm = String(m).padStart(2, '0')
  const dd = String(d).padStart(2, '0')
  return `${mm}/${dd}/${y}`
}
