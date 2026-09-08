import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { CardEyebrow } from '@/components/courses/LearningPathCard'
import { useAccount } from '@/context/AccountContext'
import { isRecentlyAdded, myCoursesFor } from '@/data/myCoursesFixtures'

/**
 * Dashboard V2 — Courses summary tile (Completion Gauge).
 *
 * One of three 1/3-width tiles in the Learner Overview 3-up row
 * (Jump Back In · Learning Paths · Courses). A 180° semicircular
 * completion gauge shows `completed / total` as a green arc with the
 * total count + "courses" label centered inside the half-donut. Same
 * outer chrome as the compact LearningPathCard so the tiles read as a
 * family.
 *
 * Recently-added overlaps the three status buckets (a course can be both
 * "recently added" and "in progress"), so it renders as a quiet footnote
 * beneath the legend and never participates in the bar math.
 *
 * Reads from the same `myCoursesFor(brand)` source as the Jump Back In
 * widget so counts always agree with what the learner sees one click
 * deeper.
 */
export function CoursesSummaryCard() {
  const { brand } = useAccount()
  const courses = useMemo(() => myCoursesFor(brand), [brand])

  const total = courses.length
  const inProgress = courses.filter((c) => c.myStatus === 'in-progress').length
  const completed = courses.filter((c) => c.myStatus === 'completed').length
  // Status buckets must sum to `total`. `MyCourseStatus` is one of
  // not-started / in-progress / completed / archived; anything not
  // explicitly active or done lands in "not started" for the bar.
  const notStarted = Math.max(0, total - inProgress - completed)
  const recent = courses.filter((c) => isRecentlyAdded(c)).length

  return (
    <section
      style={{
        display: 'flex',
        flexDirection: 'column',
        // 20px matches the compact LearningPathCard + Jump Back In so
        // all tiles in V2's 3-up row share the same eyebrow-to-content
        // spacing.
        gap: 20,
        padding: '16px 20px',
        background: 'var(--color-surface-card)',
        border: '1px solid var(--color-border-subtle)',
        borderRadius: 'var(--radius-lg)',
        height: '100%',
      }}
    >
      <CardEyebrow label={`Courses (${total})`} viewAllHref="/my-learning/courses" />

      {/* Clickable surface — wraps the header row + bar + legend. No
          hover affordance (matches the compact LearningPathCard); the
          eyebrow's "View All →" is the primary action and the body
          acts as a secondary tap target into /my-learning/courses. */}
      <Link
        to="/my-learning/courses"
        aria-label="View all my courses"
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
        {/* Gauge block — single CompletionGauge centered inside an 88px
            box. The 88px minHeight matches the LearningPathCard compact
            card's progress ring so the divider underneath this block
            lands on the same baseline as LP's `<dl>` divider in the
            sibling tile. */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: 88,
          }}
        >
          <CompletionGauge completed={completed} total={total} />
        </div>

        <dl
          style={{
            margin: 0,
            display: 'flex',
            flexDirection: 'column',
            gap: 6,
            paddingTop: 4,
            borderTop: '1px solid var(--color-border-subtle)',
          }}
        >
          {completed > 0 && (
            <LegendRow swatch="var(--color-status-completed)" label="Completed" value={completed} />
          )}
          {inProgress > 0 && (
            <LegendRow swatch="var(--color-status-in-progress)" label="In Progress" value={inProgress} />
          )}
          {notStarted > 0 && (
            <LegendRow swatch="var(--color-status-not-started)" label="Not Started" value={notStarted} />
          )}
          {recent > 0 && <LegendRow muted label="+ Recently Added" value={recent} />}
        </dl>
      </Link>
    </section>
  )
}

/* ─── Completion Gauge ──────────────────────────────────────────────
 *
 * 180° semicircular arc — green fill represents `completed / total`,
 * rest of the half-circle is the light neutral-100 track. Total count
 * + "courses" caption are centered inside the half-donut.
 *
 * Geometry: arc center sits at (CX, CY) inside an 88×48 viewBox. The
 * track spans from (CX-R, CY) sweeping clockwise across the top to
 * (CX+R, CY); the fill is the same arc truncated at the progress
 * endpoint. Stroke linecaps are round so the green segment's leading
 * edge reads as a soft tip rather than a hard slice. */

function CompletionGauge({ completed, total }: { completed: number; total: number }) {
  const pct = total === 0 ? 0 : Math.max(0, Math.min(1, completed / total))
  const W = 88
  const H = 48
  const CX = W / 2
  const CY = 42
  const R = 36
  const STROKE = 6
  // Endpoint of the progress arc. Angle is measured CCW from positive
  // x-axis; we start at 180° (left baseline) and sweep CW toward 0°
  // (right baseline) as progress fills.
  const angleRad = ((180 - 180 * pct) * Math.PI) / 180
  const endX = CX + R * Math.cos(angleRad)
  const endY = CY - R * Math.sin(angleRad)
  const trackPath = `M ${CX - R} ${CY} A ${R} ${R} 0 0 1 ${CX + R} ${CY}`
  const fillPath = `M ${CX - R} ${CY} A ${R} ${R} 0 0 1 ${endX} ${endY}`
  const pctNum = Math.round(pct * 100)
  const ariaLabel =
    total === 0
      ? '0 courses enrolled'
      : `${completed} of ${total} courses completed (${pctNum}%)`
  return (
    <div
      role="img"
      aria-label={ariaLabel}
      style={{ position: 'relative', width: W, height: H }}
    >
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ display: 'block' }}>
        <path
          d={trackPath}
          stroke="var(--color-neutral-100)"
          strokeWidth={STROKE}
          fill="none"
          strokeLinecap="round"
        />
        {pct > 0 && (
          <path
            d={fillPath}
            stroke="var(--color-success-500)"
            strokeWidth={STROKE}
            fill="none"
            strokeLinecap="round"
          />
        )}
      </svg>
      {/* Center label — total count above a small caps "COURSES"
          caption. Positioned inside the half-circle (the top half of
          the viewBox); the SVG arc curves around the text. */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          // Nudge labels down so they sit inside the arc's interior
          // rather than overlapping the curved stroke at the top.
          paddingTop: 6,
        }}
      >
        <span
          style={{
            fontFamily: 'var(--font-heading)',
            fontSize: 22,
            fontWeight: 700,
            lineHeight: 1,
            color: 'var(--color-neutral-darkest)',
          }}
        >
          {total}
        </span>
        <span
          style={{
            marginTop: 2,
            fontFamily: 'var(--font-body)',
            fontSize: 10,
            fontWeight: 600,
            lineHeight: 1,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            color: 'var(--color-text-tertiary)',
          }}
        >
          courses
        </span>
      </div>
    </div>
  )
}

/* ─── Legend rows ───────────────────────────────────────────────── */

function LegendRow({
  swatch,
  label,
  value,
  muted = false,
}: {
  /** Background color for the 8×8 status swatch. Omit when `muted` (the
   *  recently-added footnote has no color cue, just a separator above). */
  swatch?: string
  label: string
  value: number
  muted?: boolean
}) {
  const labelColor = muted ? 'var(--color-text-tertiary)' : 'var(--color-text-secondary)'
  const valueColor = muted ? 'var(--color-text-tertiary)' : 'var(--color-text-primary)'
  const labelWeight = muted ? 500 : 500
  const valueWeight = muted ? 500 : 600
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'baseline',
        justifyContent: 'space-between',
        gap: 8,
        // Footnote-style separator above the recently-added row so it
        // reads as a tertiary cue, distinct from the three legend
        // swatches above it.
        ...(muted
          ? {
              paddingTop: 4,
              borderTop: '1px solid var(--color-border-subtle)',
            }
          : null),
      }}
    >
      <dt
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          fontFamily: 'var(--font-body)',
          fontSize: 11,
          fontWeight: labelWeight,
          lineHeight: '16px',
          color: labelColor,
        }}
      >
        {swatch && (
          <span
            aria-hidden
            style={{
              width: 8,
              height: 8,
              borderRadius: 2,
              background: swatch,
              display: 'inline-block',
              flexShrink: 0,
            }}
          />
        )}
        {label}
      </dt>
      <dd
        style={{
          margin: 0,
          fontFamily: 'var(--font-body)',
          fontSize: 13,
          fontWeight: valueWeight,
          lineHeight: '18px',
          color: valueColor,
          whiteSpace: 'nowrap',
        }}
      >
        {value}
      </dd>
    </div>
  )
}
